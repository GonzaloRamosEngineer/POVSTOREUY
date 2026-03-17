-- Stage 3.3A (corrected): one-time stock effect per order with transactional DB function
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_applied_at timestamptz NULL;

CREATE OR REPLACE FUNCTION public.apply_order_stock_once(p_order_id uuid)
RETURNS TABLE(ok boolean, no_op boolean, reason text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock_applied_at timestamptz;
  v_has_line_type boolean;
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

  IF v_stock_applied_at IS NOT NULL THEN
    RETURN QUERY SELECT true, true, 'stock_already_applied';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'order_items'
      AND c.column_name = 'line_type'
  ) INTO v_has_line_type;

  IF v_has_line_type THEN
    UPDATE public.products p
    SET stock_count = GREATEST(0, COALESCE(p.stock_count, 0) - x.qty)
    FROM (
      SELECT oi.product_id, SUM(COALESCE(oi.quantity, 0))::integer AS qty
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
        AND oi.product_id IS NOT NULL
        AND COALESCE(oi.line_type, 'simple') IN ('simple', 'pack_component')
      GROUP BY oi.product_id
    ) x
    WHERE p.id = x.product_id;
  ELSE
    UPDATE public.products p
    SET stock_count = GREATEST(0, COALESCE(p.stock_count, 0) - x.qty)
    FROM (
      SELECT oi.product_id, SUM(COALESCE(oi.quantity, 0))::integer AS qty
      FROM public.order_items oi
      WHERE oi.order_id = p_order_id
        AND oi.product_id IS NOT NULL
      GROUP BY oi.product_id
    ) x
    WHERE p.id = x.product_id;
  END IF;

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
