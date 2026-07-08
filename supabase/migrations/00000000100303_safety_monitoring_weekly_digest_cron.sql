-- ============================================================================
-- PRD-30: Safety Monitoring — SM-C, Build Item 13 (weekly pattern digest)
-- ============================================================================
-- safety_pattern_summaries (table + RLS) already shipped in migration
-- 00000000100289 (SM-A) — that migration deliberately deferred the
-- generation cron to avoid pointing at an undeployed Edge Function. This
-- migration:
--   1. Adds a UNIQUE (monitored_member_id, period_end) constraint so the
--      weekly generation job is naturally idempotent (re-running a sweep
--      that already generated this week's summary is a no-op, not a
--      duplicate row).
--   2. Registers the weekly cron (Convention #246, util.invoke_edge_function)
--      pointing at the newly-deployed safety-weekly-digest function.
--
-- Idempotent: safe to re-run (DO $$ EXCEPTION guards, cron.unschedule before
-- re-schedule).
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.safety_pattern_summaries
    ADD CONSTRAINT uq_sps_member_period_end UNIQUE (monitored_member_id, period_end);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Cron: safety-weekly-digest, Sunday night (family-local approximation —
-- the function itself derives each family's actual local "yesterday" via
-- families.timezone; this single UTC tick is just the cadence, offset from
-- the existing weekly contract-week-end-sweep at :25 (migration 100205)).
-- ──────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'safety-weekly-digest') THEN
    PERFORM cron.unschedule('safety-weekly-digest');
  END IF;
END $$;

SELECT cron.schedule(
  'safety-weekly-digest',
  '40 0 * * 0', -- Sunday 00:40 UTC, weekly
  $cron$
  SELECT util.invoke_edge_function('safety-weekly-digest');
  $cron$
);

-- ──────────────────────────────────────────────────────────────────────────
-- Verification block.
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_constraint_count INTEGER;
  v_cron_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_constraint_count
  FROM pg_constraint
  WHERE conname = 'uq_sps_member_period_end'
    AND conrelid = 'public.safety_pattern_summaries'::regclass;
  IF v_constraint_count <> 1 THEN
    RAISE EXCEPTION 'migration 100303: expected uq_sps_member_period_end constraint to exist, found %', v_constraint_count;
  END IF;

  SELECT COUNT(*) INTO v_cron_count FROM cron.job WHERE jobname = 'safety-weekly-digest';
  IF v_cron_count <> 1 THEN
    RAISE EXCEPTION 'migration 100303: expected safety-weekly-digest cron job to exist, found %', v_cron_count;
  END IF;

  RAISE NOTICE 'PRD-30 SM-C digest migration verified: unique constraint + weekly cron registered.';
END $$;
