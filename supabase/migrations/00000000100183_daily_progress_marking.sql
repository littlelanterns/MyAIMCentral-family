-- Migration: Daily Progress Marking (PRD-09A Addendum)
-- Adds track_progress columns, soft-claim column, and extends practice_log CHECK.
--
-- DOWN-MIGRATION (manual, if needed):
--   1. Verify no rows use new source types:
--      SELECT count(*) FROM practice_log WHERE source_type IN ('task','routine_step');
--   2. If count = 0, restore original CHECK:
--      ALTER TABLE practice_log DROP CONSTRAINT practice_log_source_type_check;
--      ALTER TABLE practice_log ADD CONSTRAINT practice_log_source_type_check
--        CHECK (source_type IN ('sequential_task','randomizer_item'));
--   3. Drop new columns:
--      ALTER TABLE tasks DROP COLUMN IF EXISTS track_progress;
--      ALTER TABLE tasks DROP COLUMN IF EXISTS in_progress_member_id;
--      ALTER TABLE lists DROP COLUMN IF EXISTS default_track_progress;
--      ALTER TABLE list_items DROP COLUMN IF EXISTS track_progress;

-- ══════════════════════════════════════════════════════════════════
-- 1. tasks.track_progress — opt-in daily-progress marking per task
-- ══════════��═════════════════════════════════��═════════════════════
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS track_progress BOOLEAN NOT NULL DEFAULT false;

-- tasks.track_duration already exists (migration 100105) — NOT re-added.

-- ══════════════════════════════════════════════════════════════════
-- 2. tasks.in_progress_member_id — soft-claim attribution (Option B)
--    Set on first practice session, cleared on completion.
--    Mom and task creator always override.
-- ══════════���═══════════════════════════��═══════════════════════════
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS in_progress_member_id UUID
    REFERENCES public.family_members(id) ON DELETE SET NULL;

-- ═════════���════════════════════════════════════════════════════════
-- 3. lists.default_track_progress �� list-level default for generated tasks
-- ═════��═════════════════════��═════════════════════════════════════��
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS default_track_progress BOOLEAN NOT NULL DEFAULT false;

-- lists.default_track_duration already exists (migration 100105) — NOT re-added.

-- ════════════════════════════════════���═════════════════════════════
-- 4. list_items.track_progress — per-item override (NULL = inherit from list)
-- ═══════��══════════════════════════════════════════════════════════
ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS track_progress BOOLEAN;

-- list_items.track_duration already exists (migration 100105) — NOT re-added.

-- ═════════���═════════════════════════���══════════════════════════���═══
-- 5. practice_log.source_type CHECK constraint extension
--    Existing values: 'sequential_task', 'randomizer_item'
--    Adding: 'task', 'routine_step'
--    Additive: existing rows remain valid.
-- ══���════════════════════���══════════════════════════════════════════

-- Verify zero rows would violate the new CHECK (should return 0).
-- This is a safety assertion — if it fails, the migration is wrong.
DO $$
DECLARE
  bad_count INTEGER;
BEGIN
  SELECT count(*) INTO bad_count
  FROM public.practice_log
  WHERE source_type NOT IN ('sequential_task', 'randomizer_item', 'task', 'routine_step');

  IF bad_count > 0 THEN
    RAISE EXCEPTION 'Found % practice_log rows with unexpected source_type values', bad_count;
  END IF;
END
$$;

ALTER TABLE public.practice_log
  DROP CONSTRAINT IF EXISTS practice_log_source_type_check;

ALTER TABLE public.practice_log
  ADD CONSTRAINT practice_log_source_type_check
    CHECK (source_type IN ('sequential_task', 'randomizer_item', 'task', 'routine_step'));
