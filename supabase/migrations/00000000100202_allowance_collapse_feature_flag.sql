-- Phase 3 Connector Architecture — Sub-task 2c
-- 1. Collapse calculation_approach 'fixed' → 'dynamic' (mathematically identical)
-- 2. Add allowance_dispatch_via feature flag to families table

-- Migrate any existing 'fixed' rows to 'dynamic'
UPDATE public.allowance_configs
   SET calculation_approach = 'dynamic'
 WHERE calculation_approach = 'fixed';

-- Drop old CHECK and add tighter one
ALTER TABLE public.allowance_configs
  DROP CONSTRAINT IF EXISTS allowance_configs_calculation_approach_check;

ALTER TABLE public.allowance_configs
  ADD CONSTRAINT allowance_configs_calculation_approach_check
    CHECK (calculation_approach IN ('dynamic', 'points_weighted'));

-- Feature flag for connector dispatch rollout
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS allowance_dispatch_via TEXT
    NOT NULL DEFAULT 'legacy'
    CHECK (allowance_dispatch_via IN ('legacy', 'connector'));

DO $$ BEGIN RAISE NOTICE 'migration 100202: fixed→dynamic collapse + allowance_dispatch_via feature flag'; END $$;
