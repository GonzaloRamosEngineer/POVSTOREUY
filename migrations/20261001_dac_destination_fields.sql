-- Datos de destino requeridos para preparar órdenes para DAC.
-- DAC acepta CI/RUT y email como opcionales; POV conserva email NOT NULL
-- y agrega CI/RUT como dato opcional.

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_document text,
  ADD COLUMN IF NOT EXISTS shipping_neighborhood text;

-- Sobrecarga compatible: la firma anterior permanece operativa durante el
-- despliegue y el handler nuevo selecciona esta firma por sus argumentos.
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
  p_delivery_method          delivery_method,
  p_customer_document        text,
  p_shipping_neighborhood    text
)
RETURNS TABLE(
  order_id     uuid,
  order_number text,
  total        numeric,
  status       text
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
      user_id, order_number, customer_email, customer_name, customer_phone,
      customer_document, shipping_address, shipping_city, shipping_department,
      shipping_neighborhood, shipping_postal_code, subtotal, shipping_cost,
      total, order_status, payment_method, payment_status, notes,
      idempotency_key, idempotency_payload_hash, delivery_method
    ) VALUES (
      NULL, p_order_number, p_customer_email, p_customer_name, p_customer_phone,
      NULLIF(BTRIM(p_customer_document), ''), p_shipping_address, p_shipping_city,
      p_shipping_department, NULLIF(BTRIM(p_shipping_neighborhood), ''),
      p_shipping_postal_code, p_subtotal, p_shipping_cost, p_total,
      'pending'::order_status, p_payment_method, 'pending'::payment_status,
      p_notes, p_idempotency_key, p_idempotency_payload_hash, p_delivery_method
    )
    RETURNING orders.id, orders.order_number, orders.total
      INTO v_order_id, v_order_number, v_total;

  EXCEPTION WHEN unique_violation THEN
    SELECT o.id, o.order_number, o.total, o.idempotency_payload_hash
      INTO v_order_id, v_order_number, v_total, v_existing_hash
    FROM public.orders o
    WHERE o.idempotency_key = p_idempotency_key
    LIMIT 1;

    IF NOT FOUND THEN RAISE; END IF;

    IF v_existing_hash IS DISTINCT FROM p_idempotency_payload_hash THEN
      RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'payload_mismatch'::text;
      RETURN;
    END IF;

    RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'idempotent_replay'::text;
    RETURN;
  END;

  INSERT INTO public.order_items (
    order_id, product_id, product_name, product_model, product_image_url,
    quantity, unit_price, total_price, line_type, pack_group_id, pack_id,
    pack_parent_product_id, pack_version
  )
  SELECT
    v_order_id,
    NULLIF(item->>'product_id', '')::uuid,
    item->>'product_name', item->>'product_model', item->>'product_image_url',
    (item->>'quantity')::integer, (item->>'unit_price')::numeric,
    (item->>'total_price')::numeric, item->>'line_type',
    NULLIF(item->>'pack_group_id', '')::uuid, NULLIF(item->>'pack_id', ''),
    NULLIF(item->>'pack_parent_product_id', '')::uuid,
    NULLIF(item->>'pack_version', '')::integer
  FROM jsonb_array_elements(p_items) AS item;

  RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'created'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb,
  delivery_method, text, text
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb,
  delivery_method, text, text
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb,
  delivery_method, text, text
) TO service_role;

COMMIT;
