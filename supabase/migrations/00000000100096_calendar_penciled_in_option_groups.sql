-- Migration: Calendar "Penciled In" status + Option Groups
-- Adds universal "penciled_in" status for any calendar event,
-- plus option_group support for events with multiple date choices
-- (e.g., showtimes, open session dates).
--
-- Also adds calendar_subtype for MindSweep-classified events
-- (multi_day, options, recurring, series, single).

-- ── 1. Expand status CHECK constraint ──

ALTER TABLE calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_status_check;

ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_status_check
  CHECK (status IN (
    'draft',
    'pending_approval',
    'approved',
    'penciled_in',
    'rejected',
    'cancelled',
    'expired'
  ));

-- ── 2. Add option group columns ──

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS option_group_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS option_group_title TEXT DEFAULT NULL;

-- Index for efficient option group lookups
CREATE INDEX IF NOT EXISTS idx_ce_option_group
  ON calendar_events (option_group_id)
  WHERE option_group_id IS NOT NULL;

-- ── 3. Add calendar_subtype for MindSweep classification ──

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS calendar_subtype TEXT DEFAULT NULL;

-- CHECK constraint for valid subtypes (nullable — only set by MindSweep)
ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_subtype_check
  CHECK (calendar_subtype IS NULL OR calendar_subtype IN (
    'single',
    'multi_day',
    'options',
    'recurring',
    'series'
  ));

-- ── 4. Index for penciled_in events (used by auto-cleanup) ──

CREATE INDEX IF NOT EXISTS idx_ce_penciled_in
  ON calendar_events (event_date)
  WHERE status = 'penciled_in';

-- ── 5. Add "Options" system category ──

INSERT INTO event_categories (family_id, name, slug, icon, color, is_system, sort_order, created_at)
VALUES (NULL, 'Options', 'options', 'CircleDot', '#94a3b8', true, 12, now())
ON CONFLICT DO NOTHING;

-- ── 6. Auto-cleanup: expire penciled-in events whose date has passed ──

-- Function to expire old penciled-in events
CREATE OR REPLACE FUNCTION expire_penciled_in_events()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE calendar_events
  SET status = 'expired'
  WHERE status = 'penciled_in'
    AND event_date < CURRENT_DATE;
END;
$$;

-- Daily pg_cron job at 2:00 AM UTC
SELECT cron.schedule(
  'expire-penciled-in-events',
  '0 2 * * *',
  $$SELECT expire_penciled_in_events()$$
);

-- Done. No data migration needed — existing events keep status='approved' or 'pending_approval'.
