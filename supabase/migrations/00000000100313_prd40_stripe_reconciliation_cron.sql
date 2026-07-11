-- ============================================================================
-- PRD-40: COPPA Compliance & Parental Verification — Slice 2 (Stripe)
-- ============================================================================
-- Schedules the daily Stripe/parent_verifications reconciliation cron
-- (decision file §3, item 5: claude/feature-decisions/PRD-40-COPPA-Compliance.md).
--
-- No new tables/columns in this migration — Slice 1 (migration 100305)
-- already shipped stripe_webhook_events, parent_verifications,
-- parent_verification_attempts, and the RLS around them. This migration is
-- purely the cron registration for the reconcile-coppa-verifications Edge
-- Function (Convention #246: util.invoke_edge_function, --no-verify-jwt).
--
-- Cadence: daily at 05:10 UTC — offset from the other daily/hourly crons in
-- this schema (allowance :30, contract-week-end :25, weekly-digest Sunday
-- :40) so nothing piles up on the same minute.
--
-- Idempotent: safe to re-run (cron.unschedule before re-schedule).
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reconcile-coppa-verifications') THEN
    PERFORM cron.unschedule('reconcile-coppa-verifications');
  END IF;
END $$;

SELECT cron.schedule(
  'reconcile-coppa-verifications',
  '10 5 * * *', -- daily, 05:10 UTC
  $cron$
  SELECT util.invoke_edge_function('reconcile-coppa-verifications');
  $cron$
);

-- ──────────────────────────────────────────────────────────────────────────
-- Verification block.
-- ──────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_cron_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cron_count FROM cron.job WHERE jobname = 'reconcile-coppa-verifications';
  IF v_cron_count <> 1 THEN
    RAISE EXCEPTION 'migration 100313: expected reconcile-coppa-verifications cron job to exist, found %', v_cron_count;
  END IF;

  RAISE NOTICE 'PRD-40 Slice 2 reconciliation cron verified: reconcile-coppa-verifications scheduled daily at 05:10 UTC.';
END $$;
