-- PRD-17B: MindSweep auto-sweep pg_cron job
-- Runs every hour, checks each member's holding queue against their
-- configured auto_sweep_time, and triggers mindsweep-sort for matches.
--
-- The Edge Function (mindsweep-auto-sweep) handles the timezone-aware
-- hour matching and batch processing logic.
--
-- This migration was authored against a never-set custom GUC pattern
-- (current_setting('app.settings.supabase_url')) that is permission-denied
-- on Supabase hosted. The job silently failed on every run for 7+ days
-- (Scope 7 performance baseline, PERFORMANCE_BASELINE.md issue #1). Rewritten
-- 2026-04-20 to use util.invoke_edge_function which reads from Supabase Vault.
-- Migration 100150 creates the helper and reschedules; this file is kept in
-- sync so fresh-DB rebuilds produce the correct final state directly.

-- Skip if the helper doesn't exist yet (fresh rebuild where this migration
-- runs BEFORE 100150). Migration 100150 unschedules + reschedules anyway.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'util' AND p.proname = 'invoke_edge_function'
  ) THEN
    RAISE NOTICE 'util.invoke_edge_function not yet present; migration 100150 will schedule this job.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mindsweep-auto-sweep') THEN
    PERFORM cron.unschedule('mindsweep-auto-sweep');
  END IF;

  PERFORM cron.schedule(
    'mindsweep-auto-sweep',
    '0 * * * *',  -- every hour at :00
    $cron$
    SELECT util.invoke_edge_function('mindsweep-auto-sweep');
    $cron$
  );
END $$;
