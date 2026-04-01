-- ============================================================================
-- PRD-23 BookShelf Discussions — Session B support schema
-- ============================================================================
-- Creates:
--   1. bookshelf_search_history  — per-member semantic search query log
--   2. bookshelf_discussion_messages.metadata verified (already exists in 100059)
--   3. lila_guided_modes seed     — book_discuss + library_ask modes
--   4. feature_key_registry seed  — bookshelf_discussions (already exists; ON CONFLICT DO NOTHING)
-- ============================================================================

-- ============================================================
-- 1. bookshelf_search_history
-- Tracks semantic search queries for the history panel.
-- Members see their own history only (max 20 displayed in UI).
-- ============================================================

CREATE TABLE IF NOT EXISTS bookshelf_search_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  member_id     UUID        NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  query         TEXT        NOT NULL,
  mode          TEXT        NOT NULL DEFAULT 'any'
    CHECK (mode IN ('any', 'together', 'separate')),
  scope         TEXT        NOT NULL DEFAULT 'both'
    CHECK (scope IN ('chunks', 'extractions', 'both')),
  result_count  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bsh_member_created
  ON bookshelf_search_history (member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bsh_family
  ON bookshelf_search_history (family_id);

ALTER TABLE bookshelf_search_history ENABLE ROW LEVEL SECURITY;

-- Member can read own history
DO $$ BEGIN
  CREATE POLICY "bsh_select_own"
    ON bookshelf_search_history FOR SELECT
    TO authenticated
    USING (
      member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Member can insert own history
DO $$ BEGIN
  CREATE POLICY "bsh_insert_own"
    ON bookshelf_search_history FOR INSERT
    TO authenticated
    WITH CHECK (
      member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Member can delete own history (e.g. "clear history" action)
DO $$ BEGIN
  CREATE POLICY "bsh_delete_own"
    ON bookshelf_search_history FOR DELETE
    TO authenticated
    USING (
      member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role full access
DO $$ BEGIN
  CREATE POLICY "bsh_service_all"
    ON bookshelf_search_history FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. bookshelf_discussion_messages — verify metadata column
-- Migration 100059 already created this table with:
--   role TEXT CHECK (role IN ('user', 'assistant'))
--   content TEXT NOT NULL
--   metadata JSONB DEFAULT '{}' NOT NULL
-- Nothing to add — this section documents that verification.
-- ============================================================

-- Defensive: add metadata column only if somehow missing
-- (should be a no-op on any DB that ran migration 100059)
ALTER TABLE bookshelf_discussion_messages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- ============================================================
-- 3. lila_guided_modes seed
-- book_discuss  — single/multi-book RAG discussion
-- library_ask   — cross-library semantic search + discussion
-- ============================================================

INSERT INTO lila_guided_modes (
  mode_key,
  display_name,
  parent_mode,
  avatar_key,
  model_tier,
  context_sources,
  person_selector,
  opening_messages,
  system_prompt_key,
  available_to_roles,
  requires_feature_key,
  sort_order,
  is_active
)
VALUES
  (
    'book_discuss',
    'Discuss This Book',
    NULL,
    'sitting',
    'sonnet',
    '{"bookshelf","guiding_stars","self_knowledge"}',
    false,
    '[
      "I''ve immersed myself in this book. What would you like to explore? I can discuss themes, help you apply insights, or connect ideas to your life.",
      "Ready to dig into this with you. Ask me anything — about a specific chapter, a concept that caught your attention, or how this connects to what matters most to you.",
      "Let''s talk about this book. I have the full text and all extracted content ready. Where would you like to start?"
    ]',
    'book_discuss',
    '{"mom","additional_adult","member"}',
    'bookshelf_discussions',
    50,
    true
  ),
  (
    'library_ask',
    'Ask Your Library',
    NULL,
    'sitting',
    'sonnet',
    '{"bookshelf","guiding_stars","self_knowledge"}',
    false,
    '[
      "Your entire BookShelf is open. Ask me anything — I''ll search across all your books to find the most relevant wisdom.",
      "I can search across everything you''ve uploaded. What''s on your mind? I''ll find connections you might not have seen.",
      "Your library is ready. Ask a question, describe a situation, or name a topic — I''ll pull the best insights from across your books."
    ]',
    'library_ask',
    '{"mom","additional_adult","member"}',
    'bookshelf_discussions',
    51,
    true
  )
ON CONFLICT (mode_key) DO NOTHING;

-- ============================================================
-- 4. feature_key_registry seed
-- bookshelf_discussions was already seeded in migration 100059.
-- ON CONFLICT DO NOTHING makes this safe to run again.
-- ============================================================

INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('bookshelf_discussions', 'BookShelf Discussions', 'RAG-powered book discussions with LiLa', 'PRD-23')
ON CONFLICT (feature_key) DO NOTHING;
