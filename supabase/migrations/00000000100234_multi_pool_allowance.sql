-- ============================================================================
-- Phase 3.5 Worker A — Multi-Pool Allowance Schema
--
-- Restructures the allowance system from one config per child to
-- per-(child, pool) with independent configurations, periods, and payouts.
--
-- Changes:
--   1. allowance_configs — add pool columns, replace unique index
--   2. allowance_periods — add pool_name + combined_percentage, update indexes
--   3. tasks — add pool_id FK
--   4. financial_transactions — add pool_name source tracking
--   5. Feature key registration
--   6. Data migration verification
-- ============================================================================


-- ============================================================================
-- 1. Extend allowance_configs to per-(kid, pool)
-- ============================================================================

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS pool_name TEXT NOT NULL DEFAULT 'default';

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS pool_type TEXT NOT NULL DEFAULT 'percentage_pool';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'allowance_configs_pool_type_check'
  ) THEN
    ALTER TABLE public.allowance_configs
      ADD CONSTRAINT allowance_configs_pool_type_check
      CHECK (pool_type IN ('percentage_pool', 'goal_pool'));
  END IF;
END $$;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS payout_mode TEXT NOT NULL DEFAULT 'weekly';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'allowance_configs_payout_mode_check'
  ) THEN
    ALTER TABLE public.allowance_configs
      ADD CONSTRAINT allowance_configs_payout_mode_check
      CHECK (payout_mode IN ('weekly', 'biweekly', 'monthly', 'term', 'event_driven', 'measurement_only'));
  END IF;
END $$;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS pool_status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'allowance_configs_pool_status_check'
  ) THEN
    ALTER TABLE public.allowance_configs
      ADD CONSTRAINT allowance_configs_pool_status_check
      CHECK (pool_status IN ('active', 'paused', 'archived'));
  END IF;
END $$;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS pool_weight DECIMAL DEFAULT 1.0;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS pool_owner_member_id UUID REFERENCES public.family_members(id);

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS term_start_date DATE;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS term_end_date DATE;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS close_on_event_source_type TEXT;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS close_on_event_source_id UUID;

ALTER TABLE public.allowance_configs
  ADD COLUMN IF NOT EXISTS overage_cap DECIMAL NOT NULL DEFAULT 100;

-- Replace the old one-config-per-child unique index with per-(child, pool)
DROP INDEX IF EXISTS idx_allowance_configs_member;
CREATE UNIQUE INDEX IF NOT EXISTS idx_allowance_configs_member_pool
  ON public.allowance_configs (family_member_id, pool_name);


-- ============================================================================
-- 2. Extend allowance_periods to per-(kid, pool, period)
-- ============================================================================

ALTER TABLE public.allowance_periods
  ADD COLUMN IF NOT EXISTS pool_name TEXT NOT NULL DEFAULT 'default';

ALTER TABLE public.allowance_periods
  ADD COLUMN IF NOT EXISTS combined_percentage DECIMAL;

-- Update the partial unique index to be per-(member, pool) instead of per-member.
-- This allows one active period per pool per member.
DROP INDEX IF EXISTS allowance_periods_one_active_per_member;
CREATE UNIQUE INDEX IF NOT EXISTS allowance_periods_one_active_per_member_pool
  ON public.allowance_periods (family_member_id, pool_name)
  WHERE status IN ('active', 'makeup_window');

COMMENT ON INDEX public.allowance_periods_one_active_per_member_pool IS
  'Phase 3.5: At most one period per member per pool in an unresolved state.';

-- Add pool_name to the member+period lookup index
DROP INDEX IF EXISTS idx_ap_member_period;
CREATE INDEX IF NOT EXISTS idx_ap_member_pool_period
  ON public.allowance_periods (family_member_id, pool_name, period_start DESC);

-- Add pool_name to the member+status index
DROP INDEX IF EXISTS idx_ap_member_status;
CREATE INDEX IF NOT EXISTS idx_ap_member_pool_status
  ON public.allowance_periods (family_member_id, pool_name, status);


-- ============================================================================
-- 3. Per-task pool assignment
-- ============================================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS pool_id UUID REFERENCES public.allowance_configs(id);


-- ============================================================================
-- 4. Pool source tracking on financial_transactions
-- ============================================================================

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS pool_name TEXT;


-- ============================================================================
-- 5. Feature key registration
-- ============================================================================

INSERT INTO public.feature_key_registry (feature_key, display_name, description, prd_source)
VALUES (
  'tracking_allowance_multi_pool',
  'Multi-Pool Allowance',
  'Multiple named allowance pools per child with independent configurations, periods, and payout rules',
  'PRD-28'
)
ON CONFLICT (feature_key) DO NOTHING;


-- ============================================================================
-- 6. Data migration verification
-- ============================================================================

DO $$
DECLARE v_bad_configs INTEGER;
DECLARE v_bad_periods INTEGER;
BEGIN
  SELECT count(*) INTO v_bad_configs
    FROM public.allowance_configs WHERE pool_name != 'default';
  IF v_bad_configs > 0 THEN
    RAISE EXCEPTION 'Migration error: % allowance_configs rows have non-default pool_name', v_bad_configs;
  END IF;

  SELECT count(*) INTO v_bad_periods
    FROM public.allowance_periods WHERE pool_name != 'default';
  IF v_bad_periods > 0 THEN
    RAISE EXCEPTION 'Migration error: % allowance_periods rows have non-default pool_name', v_bad_periods;
  END IF;
END $$;
