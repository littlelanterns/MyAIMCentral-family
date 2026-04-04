-- PRD-17B: MindSweep auto-sweep pg_cron job
-- Runs every hour, checks each member's holding queue against their
-- configured auto_sweep_time, and triggers mindsweep-sort for matches.
--
-- The Edge Function (mindsweep-auto-sweep) handles the timezone-aware
-- hour matching and batch processing logic.

-- Schedule the auto-sweep job to run every hour at minute 0
SELECT cron.schedule(
  'mindsweep-auto-sweep',
  '0 * * * *',  -- every hour at :00
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/mindsweep-auto-sweep',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
