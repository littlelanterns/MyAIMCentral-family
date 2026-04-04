-- ============================================================
-- BookShelf Platform Library — Phase 1: Schema + Data Migration
--
-- Moves books, chunks, and extractions to platform_intelligence.
-- Personal state (hearts, notes) → bookshelf_user_state.
-- Multi-part books consolidated under parent's book_library entry.
-- Old tables remain functional as fallback.
-- ============================================================

-- ============================================================
-- 1. Rename book_cache → book_library + add columns
-- ============================================================
ALTER TABLE IF EXISTS platform_intelligence.book_cache
  RENAME TO book_library;

ALTER TABLE platform_intelligence.book_library
  ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'none' NOT NULL,
  ADD COLUMN IF NOT EXISTS extraction_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS discovered_sections JSONB;

-- Add CHECK constraint only if not already present
DO $$ BEGIN
  ALTER TABLE platform_intelligence.book_library
    ADD CONSTRAINT book_library_extraction_status_check
    CHECK (extraction_status IN ('none', 'processing', 'completed', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. Create platform_intelligence.book_chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_intelligence.book_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_library_id UUID NOT NULL REFERENCES platform_intelligence.book_library(id),
  chunk_index INTEGER NOT NULL,
  chapter_index INTEGER,
  chapter_title TEXT,
  text TEXT NOT NULL,
  embedding halfvec(1536),
  tokens_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes (triggers added AFTER bulk migration in Section 14)
CREATE INDEX IF NOT EXISTS idx_plbc_library
  ON platform_intelligence.book_chunks(book_library_id);
CREATE INDEX IF NOT EXISTS idx_plbc_library_idx
  ON platform_intelligence.book_chunks(book_library_id, chunk_index);

DO $$ BEGIN
  CREATE INDEX idx_plbc_embedding
    ON platform_intelligence.book_chunks
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- RLS: family members read chunks for books their family owns
ALTER TABLE platform_intelligence.book_chunks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "plbc_select_family"
    ON platform_intelligence.book_chunks FOR SELECT
    TO authenticated
    USING (
      book_library_id IN (
        SELECT DISTINCT book_library_id FROM bookshelf_items
        WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
          AND book_library_id IS NOT NULL
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "plbc_service_all"
    ON platform_intelligence.book_chunks FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. Create platform_intelligence.book_extractions
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_intelligence.book_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_library_id UUID NOT NULL REFERENCES platform_intelligence.book_library(id),

  -- Type discriminator
  extraction_type TEXT NOT NULL
    CHECK (extraction_type IN ('summary', 'insight', 'declaration', 'action_step', 'question')),

  -- Content — 3 text levels
  text TEXT NOT NULL,
  guided_text TEXT,
  independent_text TEXT,

  -- Type-specific columns (nullable, only populated for matching type)
  content_type TEXT,
  declaration_text TEXT,
  style_variant TEXT,
  value_name TEXT,
  richness TEXT,

  -- Structural
  section_title TEXT,
  section_index INTEGER,
  sort_order INTEGER DEFAULT 0,
  audience TEXT DEFAULT 'original' NOT NULL,

  -- Flags
  is_key_point BOOLEAN DEFAULT false NOT NULL,
  is_from_go_deeper BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plbe_library
  ON platform_intelligence.book_extractions(book_library_id);
CREATE INDEX IF NOT EXISTS idx_plbe_type
  ON platform_intelligence.book_extractions(extraction_type);
CREATE INDEX IF NOT EXISTS idx_plbe_library_type
  ON platform_intelligence.book_extractions(book_library_id, extraction_type, section_index, sort_order);
CREATE INDEX IF NOT EXISTS idx_plbe_key_points
  ON platform_intelligence.book_extractions(book_library_id)
  WHERE is_key_point = true;
CREATE INDEX IF NOT EXISTS idx_plbe_audience
  ON platform_intelligence.book_extractions(book_library_id, audience);

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_plbe_updated_at
  BEFORE UPDATE ON platform_intelligence.book_extractions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- RLS: family members read extractions for books their family owns
ALTER TABLE platform_intelligence.book_extractions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "plbe_select_family"
    ON platform_intelligence.book_extractions FOR SELECT
    TO authenticated
    USING (
      book_library_id IN (
        SELECT DISTINCT book_library_id FROM bookshelf_items
        WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
          AND book_library_id IS NOT NULL
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "plbe_service_all"
    ON platform_intelligence.book_extractions FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. Create bookshelf_user_state
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_user_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  member_id UUID NOT NULL REFERENCES family_members(id),
  extraction_id UUID NOT NULL REFERENCES platform_intelligence.book_extractions(id),

  -- Personal state
  is_hearted BOOLEAN DEFAULT false NOT NULL,
  user_note TEXT,
  is_included_in_ai BOOLEAN DEFAULT true NOT NULL,

  -- Routing tracking
  sent_to_guiding_stars BOOLEAN DEFAULT false NOT NULL,
  guiding_star_id UUID,
  sent_to_tasks BOOLEAN DEFAULT false NOT NULL,
  task_id UUID,
  sent_to_prompts BOOLEAN DEFAULT false NOT NULL,
  journal_prompt_id UUID,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE (member_id, extraction_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bus_member
  ON bookshelf_user_state(member_id);
CREATE INDEX IF NOT EXISTS idx_bus_extraction
  ON bookshelf_user_state(extraction_id);
CREATE INDEX IF NOT EXISTS idx_bus_family
  ON bookshelf_user_state(family_id);
CREATE INDEX IF NOT EXISTS idx_bus_hearted
  ON bookshelf_user_state(member_id)
  WHERE is_hearted = true;

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_bus_updated_at
  BEFORE UPDATE ON bookshelf_user_state
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- RLS: member reads/writes own. Mom reads family.
ALTER TABLE bookshelf_user_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bus_select_own_or_family"
    ON bookshelf_user_state FOR SELECT
    TO authenticated
    USING (
      member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
      OR family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bus_insert_own"
    ON bookshelf_user_state FOR INSERT
    TO authenticated
    WITH CHECK (
      member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bus_update_own"
    ON bookshelf_user_state FOR UPDATE
    TO authenticated
    USING (
      member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bus_service_all"
    ON bookshelf_user_state FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. Add book_library_id to bookshelf_items
-- ============================================================
ALTER TABLE bookshelf_items
  ADD COLUMN IF NOT EXISTS book_library_id UUID
    REFERENCES platform_intelligence.book_library(id);

CREATE INDEX IF NOT EXISTS idx_bsi_library
  ON bookshelf_items(book_library_id)
  WHERE book_library_id IS NOT NULL;

-- ============================================================
-- 6. Data migration: Link bookshelf_items → book_library
--    Multi-part consolidation: children point to parent's entry.
-- ============================================================
DO $$
BEGIN
  -- Only run if book_library_id hasn't been populated yet
  IF NOT EXISTS (SELECT 1 FROM bookshelf_items WHERE book_library_id IS NOT NULL LIMIT 1) THEN

    -- Standalone books + parent books: book_library_id = own book_cache_id
    UPDATE bookshelf_items
    SET book_library_id = book_cache_id
    WHERE parent_bookshelf_item_id IS NULL
      AND book_cache_id IS NOT NULL;

    -- Child parts: book_library_id = PARENT's book_cache_id
    UPDATE bookshelf_items child
    SET book_library_id = parent.book_cache_id
    FROM bookshelf_items parent
    WHERE child.parent_bookshelf_item_id = parent.id
      AND child.parent_bookshelf_item_id IS NOT NULL
      AND parent.book_cache_id IS NOT NULL;

    RAISE NOTICE 'Linked bookshelf_items → book_library (% rows)',
      (SELECT count(*) FROM bookshelf_items WHERE book_library_id IS NOT NULL);
  ELSE
    RAISE NOTICE 'book_library_id already populated — skipping';
  END IF;
END $$;

-- Data migration (chunks, extractions, user_state, RPCs) in 100091 + 100092
-- Split out to handle Supabase statement timeout on large inserts.
