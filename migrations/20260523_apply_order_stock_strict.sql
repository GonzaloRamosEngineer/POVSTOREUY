-- Deuda técnica: race condition silencioso en apply_order_stock_once.
--
-- Antes: la RPC usaba `GREATEST(0, stock_count - qty)`. Si dos órdenes
-- concurrentes para el mismo producto pasaban el pre-check del handler
-- y ambas llegaban a `apply_order_stock_once`, se decrementaba a 0
-- silenciosamente — vendías más unidades de las disponibles sin señal.
-- También faltaba un lock sobre la tabla `products`: el FOR UPDATE solo
-- protegía la fila de `orders`, no las filas de `products` que se iban a
-- modificar, así que dos órdenes para distintos `order_id` no se serializaban.
--
-- Después:
--   1) SELECT FOR UPDATE sobre los products afectados antes de validar →
--      cualquier transacción concurrente que toque los mismos products
--      espera hasta que esta commitee.
--   2) Validación explícita: si algún product tiene stock_count < qty,
--      RAISE EXCEPTION 'insufficient_stock' con DETAIL estructurado
--      (ERRCODE P0001 — raise_exception genérico).
--   3) UPDATE estricto sin GREATEST: con los locks tomados y la validación
--      pasada, el subtract no puede caer por debajo de 0.
--
-- Se elimina la rama legacy `IF v_has_line_type` — la columna existe en
-- DB desde la migración stage2a (2026-03-13) y está documentada en CLAUDE.md
-- como CHECK constraint activo. Mantenerla solo agregaba ruido.
--
-- Idempotencia preservada: el chequeo de stock_applied_at sigue al inicio,
-- así que llamadas repetidas con la misma orden devuelven no_op sin tocar
-- products (ni los lockea de más).
--
-- Impacto en callers (cambio semántico de error):
--   - mp-webhook: cuando recibe reason='insufficient_stock' devolverá 200
--     con el reason en el body (no retry — el stock no se arregla en segundos).
--   - admin manual mark-paid: devolverá 409 al admin con mensaje claro.
--
-- Operacional: la migration es safe sobre el código viejo. Mientras no se
-- deployen los handlers nuevos, el comportamiento de los callers existentes
-- cambia de "silencioso oversold" a "loud failure" — eso es exactamente lo
-- que queremos. Cero órdenes nuevas se afectarán si no hay race real.

CREATE OR REPLACE FUNCTION public.apply_order_stock_once(p_order_id uuid)
RETURNS TABLE(ok boolean, no_op boolean, reason text)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock_applied_at      timestamptz;
  v_shortfall_product_id  uuid;
  v_shortfall_name        text;
  v_shortfall_available   integer;
  v_shortfall_needed      integer;
BEGIN
  -- 1) Idempotencia: lock de la orden + early exit si stock ya aplicado.
  SELECT o.stock_applied_at
    INTO v_stock_applied_at
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 'order_not_found';
    RETURN;
  END IF;

  IF v_stock_applied_at IS NOT NULL THEN
    RETURN QUERY SELECT true, true, 'stock_already_applied';
    RETURN;
  END IF;

  -- 2) Lockear todas las filas de products afectadas ANTES de validar.
  --    Esto serializa cualquier otra transacción que toque los mismos products.
  --    Sin esto, otra transacción podría leer stock=5 (post-commit nuestro)
  --    mientras nosotros aún estamos calculando el shortfall.
  PERFORM 1
  FROM public.products p
  JOIN public.order_items oi ON oi.product_id = p.id
  WHERE oi.order_id = p_order_id
    AND oi.product_id IS NOT NULL
    AND COALESCE(oi.line_type, 'simple') IN ('simple', 'pack_component')
  FOR UPDATE OF p;

  -- 3) Buscar primer shortfall (si lo hay) en estado ya lockeado.
  --    LIMIT 1 alcanza para abortar — no necesitamos enumerar todos.
  SELECT p.id, p.name, COALESCE(p.stock_count, 0), x.qty
    INTO v_shortfall_product_id, v_shortfall_name, v_shortfall_available, v_shortfall_needed
  FROM public.products p
  JOIN (
    SELECT oi.product_id, SUM(COALESCE(oi.quantity, 0))::integer AS qty
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
      AND COALESCE(oi.line_type, 'simple') IN ('simple', 'pack_component')
    GROUP BY oi.product_id
  ) x ON x.product_id = p.id
  WHERE COALESCE(p.stock_count, 0) < x.qty
  ORDER BY p.id  -- determinismo para tests
  LIMIT 1;

  IF v_shortfall_product_id IS NOT NULL THEN
    RAISE EXCEPTION 'insufficient_stock'
      USING ERRCODE = 'P0001',
            DETAIL  = format(
              'product_id=%s name=%s available=%s needed=%s',
              v_shortfall_product_id,
              v_shortfall_name,
              v_shortfall_available,
              v_shortfall_needed
            );
  END IF;

  -- 4) Apply estricto. Con locks tomados + validación pasada, no puede
  --    caer por debajo de 0. Se eliminó el GREATEST silencioso.
  UPDATE public.products p
  SET stock_count = p.stock_count - x.qty
  FROM (
    SELECT oi.product_id, SUM(COALESCE(oi.quantity, 0))::integer AS qty
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
      AND COALESCE(oi.line_type, 'simple') IN ('simple', 'pack_component')
    GROUP BY oi.product_id
  ) x
  WHERE p.id = x.product_id;

  -- 5) Marcar la orden como stock-applied. El WHERE adicional garantiza
  --    que si otra transacción ganó la carrera entre los pasos 1 y 5
  --    (no debería con FOR UPDATE en el paso 1, pero defensa en profundidad),
  --    no doble-aplicamos.
  UPDATE public.orders o
  SET stock_applied_at = TIMEZONE('utc', now())
  WHERE o.id = p_order_id
    AND o.stock_applied_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT true, true, 'stock_already_applied';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, false, 'stock_applied';
END;
$$;

-- Permisos: la función original estaba abierta a anon/authenticated por el
-- gotcha de Supabase default privileges. Aprovechamos esta migración para
-- corregir siguiendo el patrón canónico documentado en CLAUDE.md
-- ("Permisos en RPCs nuevas — gotcha de Supabase").
REVOKE ALL ON FUNCTION public.apply_order_stock_once(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_order_stock_once(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_order_stock_once(uuid) TO service_role;

-- VERIFICACIÓN (correr después del COMMIT):
--
-- -- a) La función se actualizó (esperar plpgsql con cuerpo nuevo)
-- SELECT pg_get_functiondef('public.apply_order_stock_once(uuid)'::regprocedure);
--
-- -- b) Permisos correctos (esperar service_role=t, anon/auth=f)
-- SELECT r.rolname, has_function_privilege(r.rolname,
--   'public.apply_order_stock_once(uuid)', 'EXECUTE')
-- FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role');
--
-- -- c) Sanity: no hay órdenes con stock_count negativo (no debería existir,
-- --    pero confirmamos por si el bug viejo lo causó alguna vez)
-- SELECT id, name, stock_count FROM products WHERE stock_count < 0;
