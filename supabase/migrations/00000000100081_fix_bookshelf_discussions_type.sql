-- ============================================================================
-- Fix: Add missing discussion_type column to bookshelf_discussions
-- The table was created in migration 100059 without this column,
-- but the application code expects it for discussion type selection.
-- ============================================================================

ALTER TABLE bookshelf_discussions
  ADD COLUMN IF NOT EXISTS discussion_type TEXT NOT NULL DEFAULT 'discuss'
    CHECK (discussion_type IN ('discuss', 'generate_goals', 'generate_questions', 'generate_tasks', 'generate_tracker'));
