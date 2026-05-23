-- PF-05: Atomicidad de create-order
-- Antes: dos INSERTs separados (orders + order_items) podían dejar órdenes huérfanas
--        si fallaba el segundo (red, constraint, crash del proceso).
-- Después: una RPC pl/pgsql ejecuta ambos inserts en la misma transacción implícita
--          (la propia función). Cualquier RAISE EXCEPTION revierte ambos.
--
-- Maneja idempotencia (replay legítimo vs. payload mismatch) devolviendo un campo
-- 'status' en lugar de excepciones para control de flujo.

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
  p_items                    jsonb
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
  -- 1) Intento principal: insert de la orden
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
      idempotency_payload_hash
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
      p_idempotency_payload_hash
    )
    RETURNING orders.id, orders.order_number, orders.total
      INTO v_order_id, v_order_number, v_total;

  EXCEPTION WHEN unique_violation THEN
    -- Puede ser colisión por idempotency_key o por order_number.
    -- Resolvemos consultando por idempotency_key (el caso esperable).
    SELECT o.id, o.order_number, o.total, o.idempotency_payload_hash
      INTO v_order_id, v_order_number, v_total, v_existing_hash
    FROM public.orders o
    WHERE o.idempotency_key = p_idempotency_key
    LIMIT 1;

    IF NOT FOUND THEN
      -- No fue idempotency: fue colisión de order_number (race del random POV-XXXXXX).
      -- Re-lanzamos para que el handler responda 500 y el cliente reintente.
      RAISE;
    END IF;

    IF v_existing_hash IS DISTINCT FROM p_idempotency_payload_hash THEN
      RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'payload_mismatch'::text;
      RETURN;
    END IF;

    -- Hash coincide → replay legítimo, devolvemos la orden existente sin insertar items.
    RETURN QUERY SELECT v_order_id, v_order_number, v_total, 'idempotent_replay'::text;
    RETURN;
  END;

  -- 2) Insert de items en el mismo bloque transaccional de la función.
  --    Si falla cualquier CHECK constraint, la transacción revierte el insert de orders.
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

-- Permisos: SOLO service_role puede ejecutar. Defensa en profundidad.
-- Importante (gotcha de Supabase): el schema public tiene ALTER DEFAULT PRIVILEGES que
-- conceden EXECUTE automáticamente a anon y authenticated sobre toda función nueva.
-- REVOKE FROM PUBLIC sólo desarma el grant del pseudo-rol PUBLIC; las concesiones
-- explícitas a roles nominados persisten. Por eso hay que revocar de anon/authenticated
-- por rol.
REVOKE ALL ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_transactional(
  text, text, text, text, text, text, uruguay_department, text,
  numeric, numeric, numeric, payment_method, text, text, text, jsonb
) TO service_role;
