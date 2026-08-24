-- ============================================================================
-- PRD-40: COPPA Compliance — Slice 4, Part 3 — the three daily retention crons
-- ============================================================================
-- Deliberately a SEPARATE migration from the RPCs/bucket (100319/100320),
-- matching the SM-A -> SM-C precedent (migration 100289 built the table
-- without a cron; 100303 added the cron only once the Edge Function was
-- deployed) — a cron pointing at an undeployed function just fails silently
-- every run with no user-facing symptom. Apply this migration ONLY after
-- coppa-deletion-cascade, coppa-retention-rolling-sweep, and
-- coppa-storage-cleanup are deployed.
--
-- Cadence: staggered 5 minutes apart, all after midnight UTC, offset from
-- the existing 00:20/00:25/00:30/00:40 cron cluster (migrations
-- 100180/100205/100303) per Convention #246 discipline.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'coppa-deletion-cascade') THEN
    PERFORM cron.unschedule('coppa-deletion-cascade');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'coppa-retention-rolling-sweep') THEN
    PERFORM cron.unschedule('coppa-retention-rolling-sweep');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'coppa-storage-cleanup') THEN
    PERFORM cron.unschedule('coppa-storage-cleanup');
  END IF;
END $$;

-- Consent-lifecycle sweep (PRD: "processes coppa_consents with
-- scheduled_deletion_at past") — runs first so a same-night revocation
-- grace-window close is acted on before the rolling sweeps run.
SELECT cron.schedule(
  'coppa-deletion-cascade',
  '45 0 * * *', -- 00:45 UTC daily
  $cron$
  SELECT util.invoke_edge_function('coppa-deletion-cascade');
  $cron$
);

-- Rolling retention sweep (lila_conversations/lila_messages 90-day,
-- parental_data_exports 90-day-after-download).
SELECT cron.schedule(
  'coppa-retention-rolling-sweep',
  '50 0 * * *', -- 00:50 UTC daily
  $cron$
  SELECT util.invoke_edge_function('coppa-retention-rolling-sweep');
  $cron$
);

-- Storage cleanup (task/routine completion photos, 180-day rolling).
SELECT cron.schedule(
  'coppa-storage-cleanup',
  '55 0 * * *', -- 00:55 UTC daily
  $cron$
  SELECT util.invoke_edge_function('coppa-storage-cleanup');
  $cron$
);

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM cron.job WHERE jobname IN (
    'coppa-deletion-cascade', 'coppa-retention-rolling-sweep', 'coppa-storage-cleanup'
  );
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'Expected 3 PRD-40 Slice 4 crons registered, found %', v_count;
  END IF;
  RAISE NOTICE '[100321] PRD-40 Slice 4 retention crons registered: %', v_count;
END $$;
