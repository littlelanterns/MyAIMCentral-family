-- ============================================================================
-- PRD-28: Add bonus_type + bonus_flat_amount to allowance_configs
--
-- Supports two bonus modes:
--   'percentage' (default, existing behavior) — bonus = base * bonus_percentage%
--   'flat' — bonus = bonus_flat_amount (fixed dollar amount)
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- Add bonus_type column: 'percentage' or 'flat'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'allowance_configs' AND column_name = 'bonus_type'
  ) THEN
    ALTER TABLE public.allowance_configs
      ADD COLUMN bonus_type TEXT NOT NULL DEFAULT 'percentage'
      CHECK (bonus_type IN ('percentage', 'flat'));
    RAISE NOTICE 'Added bonus_type column to allowance_configs';
  END IF;
END $$;

-- Add bonus_flat_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'allowance_configs' AND column_name = 'bonus_flat_amount'
  ) THEN
    ALTER TABLE public.allowance_configs
      ADD COLUMN bonus_flat_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
    RAISE NOTICE 'Added bonus_flat_amount column to allowance_configs';
  END IF;
END $$;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'bonus_type exists: %', (
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'allowance_configs' AND column_name = 'bonus_type'
    )
  );
  RAISE NOTICE 'bonus_flat_amount exists: %', (
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'allowance_configs' AND column_name = 'bonus_flat_amount'
    )
  );
END $$;
