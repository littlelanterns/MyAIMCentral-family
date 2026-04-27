-- Worker 5 (Painter / Universal Scheduler Upgrade) — Sub-task 7
--
-- Schedules the fire-painted-schedules Edge Function via pg_cron.
-- Convention #246: all cron → Edge Function invocations use
-- util.invoke_edge_function(). One line, no URLs, no keys.
--
-- Slot :20 was designated by the Coordination Brief as free for
-- this purpose (:00 mindsweep, :05 carry-forward, :10 allowance,
-- :15 loan interest).
--
-- The Edge Function must be deployed with --no-verify-jwt per
-- Convention #246 (cron-invoked functions use sb_secret_* keys
-- which are not JWTs).

-- Idempotent: unschedule if exists, then schedule fresh.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fire-painted-schedules') THEN
    PERFORM cron.unschedule('fire-painted-schedules');
  END IF;
END $$;

SELECT cron.schedule(
  'fire-painted-schedules',
  '20 * * * *',
  $cron$
  SELECT util.invoke_edge_function('fire-painted-schedules');
  $cron$
);
