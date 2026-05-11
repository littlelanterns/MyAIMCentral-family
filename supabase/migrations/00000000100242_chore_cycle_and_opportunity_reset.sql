-- Migration 100242: Chore cycle and opportunity reset infrastructure
--
-- Adds:
--   1. calendar_settings.chore_cycle_start_day — configurable day-of-week for
--      opportunity reset cycles (NULL = use existing week_start_day).
--   2. list_items.reset_mode — how recurring opportunity items become re-available
--      ('cooldown' = rolling N hours, 'chore_cycle' = resets at family chore week).
--
-- RLS: both columns inherit existing table-level RLS (family-scoped).

-- ── 1. chore_cycle_start_day on calendar_settings ──────────────────

ALTER TABLE calendar_settings
  ADD COLUMN IF NOT EXISTS chore_cycle_start_day INTEGER DEFAULT NULL;

COMMENT ON COLUMN calendar_settings.chore_cycle_start_day IS
  'Day of week the chore/opportunity cycle resets (0=Sunday..6=Saturday). NULL = use week_start_day.';

-- ── 2. reset_mode on list_items ────────────────────────────────────

ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS reset_mode TEXT DEFAULT 'cooldown'
    CHECK (reset_mode IN ('cooldown', 'chore_cycle'));

COMMENT ON COLUMN list_items.reset_mode IS
  'How recurring opportunity items become re-available. cooldown = rolling N hours from last completion. chore_cycle = resets at start of family chore week.';

DO $$ BEGIN RAISE NOTICE 'migration 100242: chore_cycle_start_day + reset_mode columns added'; END $$;
