-- PF-08: Compensación simétrica de stock al revertir payment_status.
-- Espejo de apply_order_stock_once (ver migrations/20260317_stage3_3a_stock_once_rpc.sql).
-- Repone qty a products.stock_count y limpia stock_applied_at para que pueda
-- re-aplicarse si la orden se reabre.

CREATE OR REPLACE FUNCTION public.revert_order_stock_once(p_order_id uuid)
RETURNS TABLE(ok boolean, no_op boolean, reason text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stock_applied_at timestamptz;
BEGIN
  SELECT o.stock_applied_at
    INTO v_stock_applied_at
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 'order_not_found';
    RETURN;
  END IF;

  IF v_stock_applied_at IS NULL THEN
    RETURN QUERY SELECT true, true, 'stock_already_reverted';
    RETURN;
  END IF;

  -- Restituir qty al stock de las líneas que originalmente descontaron
  -- (simple + pack_component, igual que el apply).
  UPDATE public.products p
  SET stock_count = COALESCE(p.stock_count, 0) + x.qty
  FROM (
    SELECT oi.product_id, SUM(COALESCE(oi.quantity, 0))::integer AS qty
    FROM public.order_items oi
    WHERE oi.order_id = p_order_id
      AND oi.product_id IS NOT NULL
      AND COALESCE(oi.line_type, 'simple') IN ('simple', 'pack_component')
    GROUP BY oi.product_id
  ) x
  WHERE p.id = x.product_id;

  -- Limpiar la marca; permite re-aplicar si la orden vuelve a 'completed'.
  UPDATE public.orders o
  SET stock_applied_at = NULL
  WHERE o.id = p_order_id
    AND o.stock_applied_at IS NOT NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT true, true, 'stock_already_reverted';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, false, 'stock_reverted';
END;
$$;

-- Permisos: SOLO service_role puede ejecutar.
-- Ver "Permisos en RPCs nuevas (gotcha de Supabase)" en CLAUDE.md para el porqué
-- del REVOKE explícito a anon/authenticated.
REVOKE ALL ON FUNCTION public.revert_order_stock_once(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revert_order_stock_once(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revert_order_stock_once(uuid) TO service_role;
