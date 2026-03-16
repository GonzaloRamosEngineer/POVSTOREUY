-- Stage 3.1 / Create-order request idempotency

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS idempotency_payload_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique_idx
  ON public.orders (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

