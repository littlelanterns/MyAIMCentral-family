-- Migration: Convert life_area_tag (single TEXT) to life_area_tags (TEXT[]) on 4 tables,
-- and add life_area_tags to list_items (new column, no backfill).
--
-- The old `life_area_tag` TEXT column is intentionally KEPT on all tables during this
-- transition period. A future cleanup migration will drop the old column after all
-- application code has been updated to read/write the new array column exclusively.
--
-- Tables affected:
--   1. tasks           — backfill from existing life_area_tag
--   2. task_templates   — backfill from existing life_area_tag
--   3. victories        — backfill from existing life_area_tag
--   4. sequential_collections — backfill from existing life_area_tag
--   5. list_items       — new column only (no old column to backfill from)

-- ============================================================================
-- 1. tasks
-- ============================================================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS life_area_tags TEXT[] DEFAULT '{}';

UPDATE tasks
SET life_area_tags = ARRAY[life_area_tag]
WHERE life_area_tag IS NOT NULL
  AND life_area_tag != ''
  AND (life_area_tags IS NULL OR life_area_tags = '{}');

CREATE INDEX IF NOT EXISTS idx_tasks_life_area_tags
  ON tasks USING GIN (life_area_tags);

-- ============================================================================
-- 2. task_templates
-- ============================================================================
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS life_area_tags TEXT[] DEFAULT '{}';

UPDATE task_templates
SET life_area_tags = ARRAY[life_area_tag]
WHERE life_area_tag IS NOT NULL
  AND life_area_tag != ''
  AND (life_area_tags IS NULL OR life_area_tags = '{}');

CREATE INDEX IF NOT EXISTS idx_task_templates_life_area_tags
  ON task_templates USING GIN (life_area_tags);

-- ============================================================================
-- 3. victories
-- ============================================================================
ALTER TABLE victories ADD COLUMN IF NOT EXISTS life_area_tags TEXT[] DEFAULT '{}';

UPDATE victories
SET life_area_tags = ARRAY[life_area_tag]
WHERE life_area_tag IS NOT NULL
  AND life_area_tag != ''
  AND (life_area_tags IS NULL OR life_area_tags = '{}');

CREATE INDEX IF NOT EXISTS idx_victories_life_area_tags
  ON victories USING GIN (life_area_tags);

-- ============================================================================
-- 4. sequential_collections
-- ============================================================================
ALTER TABLE sequential_collections ADD COLUMN IF NOT EXISTS life_area_tags TEXT[] DEFAULT '{}';

UPDATE sequential_collections
SET life_area_tags = ARRAY[life_area_tag]
WHERE life_area_tag IS NOT NULL
  AND life_area_tag != ''
  AND (life_area_tags IS NULL OR life_area_tags = '{}');

CREATE INDEX IF NOT EXISTS idx_sequential_collections_life_area_tags
  ON sequential_collections USING GIN (life_area_tags);

-- ============================================================================
-- 5. list_items (NEW column -- no existing life_area_tag to backfill from)
-- ============================================================================
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS life_area_tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_list_items_life_area_tags
  ON list_items USING GIN (life_area_tags);
