-- Stage 3.3A: stock effect idempotency marker
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stock_applied_at timestamptz NULL;
