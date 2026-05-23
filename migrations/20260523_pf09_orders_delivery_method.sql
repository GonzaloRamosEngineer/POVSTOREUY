-- PF-09: Modelar delivery_method como columna explícita en `orders`.
--
-- Antes: la lógica de "pickup vs delivery" se infería de `!shipping_address`
--        en 9 sitios del código (server + client). Frágil: data corrupta o
--        flows nuevos que dejen shipping_address vacío sin ser pickup
--        causan falsos positivos.
--
-- Después: columna `orders.delivery_method` con ENUM `('delivery','pickup')`,
--          NOT NULL, sin DEFAULT permanente. Backfill basado en doble señal
--          (notes pattern es PRIMARIO porque es lo que el backend escribe
--          explícitamente para pickup; shipping_address vacío es FALLBACK
--          para órdenes legacy raras).
--
-- RPC create_order_transactional gana p_delivery_method con DEFAULT 'delivery'
-- TRANSITORIO (no permanente) para que el handler viejo siga funcionando
-- durante la ventana de deploy (~2 min entre que corre esta migration y
-- termina de propagarse el nuevo deploy de Vercel). Las órdenes pickup
-- creadas durante esa ventana podrían quedar mis-clasificadas como
-- 'delivery' pero son recuperables vía UPDATE one-shot mirando notes.
--
-- Operacional: correr esta migration en Supabase Studio JUSTO ANTES del
-- push de código (la SQL es safe sobre el código viejo gracias al default).

BEGIN;

-- 1) ENUM type
CREATE TYPE delivery_method AS ENUM ('delivery', 'pickup');

-- 2) Columna nullable (para poder backfill antes de set NOT NULL)
ALTER TABLE public.orders ADD COLUMN delivery_method delivery_method;

-- 3) Backfill: doble señal con notes como primario.
--    El handler en create-order/route.ts escribe explícitamente:
--      notes = 'Retiro en local físico: <PICKUP_ADDRESS>'  para pickup
--    La señal de shipping_address vacío puede tener falsos positivos por
--    bugs legacy, por eso es fallback.
UPDATE public.orders SET delivery_method = CASE
  WHEN notes ILIKE '%Retiro en local físico%' THEN 'pickup'::delivery_method
  WHEN shipping_address IS NULL OR shipping_address = '' THEN 'pickup'::delivery_method
  ELSE 'delivery'::delivery_method
END;

-- 4) Set NOT NULL (no DEFAULT en la columna — forzamos explicit set en inserts).
ALTER TABLE public.orders ALTER COLUMN delivery_method SET NOT NULL;

-- 5) Drop OLD RPC signature + CREATE new one con p_delivery_method.
--    Postgres no permite cambiar signature con CREATE OR REPLACE,
--    requiere DROP + CREATE.
DROP FUNCTION IF EXISTS public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb
);

CREATE OR REPLACE FUNCTION public.create_order_transactional(
  p_order_number             text,
  p_customer_email           text,
  p_customer_name            text,
  p_customer_phone           text,
  p_shipping_address         text,
  p_shipping_city            text,
  p_shipping_department      uruguay_department,
  p_shipping_postal_code     text,
  p_subtotal                 numeric,
  p_shipping_cost            numeric,
  p_total                    numeric,
  p_payment_method           payment_method,
  p_notes                    text,
  p_idempotency_key          text,
  p_idempotency_payload_hash text,
  p_items                    jsonb,
  -- Param nuevo con DEFAULT TRANSITORIO para no romper handler viejo durante
  -- la ventana de deploy. Una vez confirmado el nuevo deploy en prod, este
  -- DEFAULT puede removerse en una migration de follow-up (cosmético, no
  -- bloqueante: el handler nuevo siempre pasa el valor explícito).
  p_delivery_method          delivery_method DEFAULT 'delivery'
)
RETURNS TABLE(
  order_id     uuid,
  order_number text,
  total        numeric,
  status       text  -- 'created' | 'idempotent_replay' | 'payload_mismatch'
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id      uuid;
  v_order_number  text;
  v_total         numeric;
  v_existing_hash text;
BEGIN
  BEGIN
    INSERT INTO public.orders (
      user_id,
      order_number,
      customer_email,
      customer_name,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_department,
      shipping_postal_code,
      subtotal,
      shipping_cost,
      total,
      order_status,
      payment_method,
      payment_status,
      notes,
      idempotency_key,
      idempotency_payload_hash,
      delivery_method
    ) VALUES (
      NULL,
      p_order_number,
      p_customer_email,
      p_customer_name,
      p_customer_phone,
      p_shipping_address,
      p_shipping_city,
      p_shipping_department,
      p_shipping_postal_code,
      p_subtotal,
      p_shipping_cost,
      p_total,
      'pending'::order_status,
      p_payment_method,
      'pending'::payment_status,
      p_notes,
      p_idempotency_key,
      p_idempotency_payload_hash,
      p_delivery_method
    )
    RETURNING orders.id, orders.order_number, orders.total
      INTO v_order_id, v_order_number, v_total;

  EXCEPTION WHEN unique_violation THEN
    SELECT o.id, o.order_number, o.total, o.idempotency_payload_hash
      INTO v_order_id, v_order_number, v_total, v_existing_hash
    FROM public.orders o
    WHERE o.idempotency_key = p_idempotency_key
    LIMIT 1;

    IF NOT FOUND THEN
      RAISE;
    END IF;

    IF v_existing_hash IS DISTINCT FROM p_idempotency_payload_hash THEN
      RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'payload_mismatch'::text;
      RETURN;
    END IF;

    RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'idempotent_replay'::text;
    RETURN;
  END;

  INSERT INTO public.order_items (
    order_id,
    product_id,
    product_name,
    product_model,
    product_image_url,
    quantity,
    unit_price,
    total_price,
    line_type,
    pack_group_id,
    pack_id,
    pack_parent_product_id,
    pack_version
  )
  SELECT
    v_order_id,
    NULLIF(item->>'product_id', '')::uuid,
    item->>'product_name',
    item->>'product_model',
    item->>'product_image_url',
    (item->>'quantity')::integer,
    (item->>'unit_price')::numeric,
    (item->>'total_price')::numeric,
    item->>'line_type',
    NULLIF(item->>'pack_group_id', '')::uuid,
    NULLIF(item->>'pack_id', ''),
    NULLIF(item->>'pack_parent_product_id', '')::uuid,
    NULLIF(item->>'pack_version', '')::integer
  FROM jsonb_array_elements(p_items) AS item;

  RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'created'::text;
END;
$$;

-- 6) Permisos (mismo patrón que PF-05).
REVOKE ALL ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb,
  delivery_method
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb,
  delivery_method
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb,
  delivery_method
) TO service_role;

COMMIT;

-- VERIFICACIÓN (correr después del COMMIT):
--
-- -- a) Backfill correcto: ninguna NULL, distribución plausible
-- SELECT delivery_method, COUNT(*) FROM orders GROUP BY delivery_method;
--
-- -- b) Sanity: pickup sin notes pattern (debería ser 0 o muy bajo)
-- SELECT COUNT(*) FROM orders
-- WHERE delivery_method = 'pickup'
--   AND notes NOT ILIKE '%Retiro en local físico%';
--
-- -- c) Permisos del RPC nuevo (esperado: anon=f, authenticated=f, service_role=t)
-- SELECT r.rolname, has_function_privilege(r.rolname,
--   'public.create_order_transactional(text,text,text,text,text,text,uruguay_department,text,numeric,numeric,numeric,payment_method,text,text,text,jsonb,delivery_method)',
--   'EXECUTE')
-- FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role');
