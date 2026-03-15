-- Stage 2A / Block 1
-- Minimal schema extension for pack internal persistence in order_items.

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS line_type text NOT NULL DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS pack_group_id uuid,
  ADD COLUMN IF NOT EXISTS pack_id text,
  ADD COLUMN IF NOT EXISTS pack_parent_product_id uuid,
  ADD COLUMN IF NOT EXISTS pack_version integer;

-- Ensure line_type has the minimal closed set for 2A.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_line_type_check'
      AND conrelid = 'public.order_items'::regclass
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_line_type_check
      CHECK (line_type IN ('simple', 'pack_primary', 'pack_component'));
  END IF;
END $$;

-- pack_version, when present, must be >= 1.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_pack_version_check'
      AND conrelid = 'public.order_items'::regclass
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_pack_version_check
      CHECK (pack_version IS NULL OR pack_version >= 1);
  END IF;
END $$;

-- Conditional nullability semantics for 2A.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_items_pack_fields_by_line_type_check'
      AND conrelid = 'public.order_items'::regclass
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_pack_fields_by_line_type_check
      CHECK (
        (
          line_type = 'simple'
          AND pack_group_id IS NULL
          AND pack_id IS NULL
          AND pack_parent_product_id IS NULL
          AND pack_version IS NULL
        )
        OR
        (
          line_type IN ('pack_primary', 'pack_component')
          AND pack_group_id IS NOT NULL
          AND pack_id IS NOT NULL
        )
      );
  END IF;
END $$;
