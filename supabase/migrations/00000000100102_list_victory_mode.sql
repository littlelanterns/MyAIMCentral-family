-- ============================================================================
-- PRD-09B: List Victory Mode
--   1. Add victory_mode to lists (replaces victory_on_complete boolean)
--   2. Add victory_flagged to list_items (per-item override)
--   3. Add 'list_completed' to victories.source CHECK constraint
--   4. Migrate existing victory_on_complete data to victory_mode
-- ============================================================================

-- ============================================================
-- 1. Add victory_mode to lists
-- ============================================================
ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS victory_mode TEXT NOT NULL DEFAULT 'none'
    CHECK (victory_mode IN ('none', 'item_completed', 'list_completed', 'both'));

-- Migrate existing victory_on_complete = true → 'list_completed'
UPDATE public.lists
SET victory_mode = 'list_completed'
WHERE victory_on_complete = true;

-- Set defaults for sequential and randomizer lists that have 'none'
-- (Only for newly created lists going forward — handled in frontend)

-- ============================================================
-- 2. Add victory_flagged to list_items
-- ============================================================
ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS victory_flagged BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 3. Add 'list_completed' to victories.source CHECK constraint
-- ============================================================
-- Drop the old constraint and re-create with the new value
ALTER TABLE public.victories
  DROP CONSTRAINT IF EXISTS victories_source_check;

ALTER TABLE public.victories
  ADD CONSTRAINT victories_source_check CHECK (source IN (
    'manual', 'task_completed', 'tracker_entry', 'intention_iteration',
    'widget_milestone', 'lila_conversation', 'notepad_routed',
    'reflection_routed', 'list_item_completed', 'list_completed', 'routine_completion',
    'homeschool_logged', 'plan_completed', 'milestone_completed',
    'family_feed', 'bookshelf'
  ));
