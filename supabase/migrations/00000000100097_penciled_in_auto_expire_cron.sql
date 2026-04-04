-- Auto-expire penciled-in calendar events whose date has passed.
-- Runs daily at 2:00 AM UTC via pg_cron.

CREATE OR REPLACE FUNCTION expire_penciled_in_events()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE calendar_events
  SET status = 'expired'
  WHERE status = 'penciled_in'
    AND event_date < CURRENT_DATE;
END;
$$;

SELECT cron.schedule(
  'expire-penciled-in-events',
  '0 2 * * *',
  $$SELECT expire_penciled_in_events()$$
);
