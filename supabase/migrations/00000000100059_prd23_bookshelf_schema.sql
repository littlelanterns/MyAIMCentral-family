-- ============================================================
-- PRD-23: BookShelf Schema (Phase A — Schema Creation)
-- Creates all BookShelf tables, platform_intelligence.book_cache,
-- journal_prompts, indexes, RLS policies, triggers.
-- Idempotent: all CREATE statements use IF NOT EXISTS.
-- ============================================================

-- ============================================================
-- 1. platform_intelligence.book_cache
-- Platform-level book deduplication cache
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_intelligence.book_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  genres TEXT[] DEFAULT '{}' NOT NULL,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  ai_summary TEXT,
  toc JSONB,
  chunk_count INTEGER DEFAULT 0 NOT NULL,
  title_author_embedding halfvec(1536),
  ethics_gate_status TEXT DEFAULT 'pending' NOT NULL
    CHECK (ethics_gate_status IN ('pending', 'approved', 'failed', 'exempt')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pibc_title ON platform_intelligence.book_cache (title);
CREATE INDEX IF NOT EXISTS idx_pibc_isbn ON platform_intelligence.book_cache (isbn) WHERE isbn IS NOT NULL;

-- HNSW index for title+author similarity matching
DO $$ BEGIN
  CREATE INDEX idx_pibc_embedding ON platform_intelligence.book_cache
    USING hnsw (title_author_embedding halfvec_cosine_ops)
    WHERE title_author_embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Trigger: updated_at
CREATE OR REPLACE TRIGGER trg_pibc_updated_at
  BEFORE UPDATE ON platform_intelligence.book_cache
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- RLS: service role only for writes; authenticated users for reads (joined via bookshelf_items)
ALTER TABLE platform_intelligence.book_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "book_cache_select_authenticated"
    ON platform_intelligence.book_cache FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "book_cache_service_all"
    ON platform_intelligence.book_cache FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. bookshelf_items
-- Per-family book/document metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  uploaded_by_member_id UUID NOT NULL REFERENCES family_members(id),
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  file_type TEXT NOT NULL
    CHECK (file_type IN ('pdf', 'epub', 'docx', 'txt', 'md', 'image', 'text_note')),
  file_name TEXT,
  storage_path TEXT,
  text_content TEXT,
  file_size_bytes INTEGER,
  genres TEXT[] DEFAULT '{}' NOT NULL,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  folder_group TEXT,
  processing_status TEXT DEFAULT 'pending' NOT NULL
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_detail TEXT,
  extraction_status TEXT DEFAULT 'none' NOT NULL
    CHECK (extraction_status IN ('none', 'discovering', 'extracting', 'completed', 'failed')),
  chunk_count INTEGER DEFAULT 0 NOT NULL,
  intake_completed BOOLEAN DEFAULT false NOT NULL,
  ai_summary TEXT,
  toc JSONB,
  discovered_sections JSONB,
  book_cache_id UUID REFERENCES platform_intelligence.book_cache(id),
  title_author_embedding halfvec(1536),
  -- Multi-part book support (StewardShip migration)
  parent_bookshelf_item_id UUID REFERENCES bookshelf_items(id),
  part_number INTEGER,
  part_count INTEGER,
  last_viewed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bsi_family ON bookshelf_items (family_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_bsi_family_uploader ON bookshelf_items (family_id, uploaded_by_member_id);
CREATE INDEX IF NOT EXISTS idx_bsi_cache ON bookshelf_items (book_cache_id) WHERE book_cache_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bsi_parent ON bookshelf_items (parent_bookshelf_item_id) WHERE parent_bookshelf_item_id IS NOT NULL;

DO $$ BEGIN
  CREATE INDEX idx_bsi_tags ON bookshelf_items USING gin (tags);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_bsi_genres ON bookshelf_items USING gin (genres);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_bsi_updated_at
  BEFORE UPDATE ON bookshelf_items
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- RLS
ALTER TABLE bookshelf_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bsi_select_family"
    ON bookshelf_items FOR SELECT
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsi_insert_family"
    ON bookshelf_items FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsi_update_family"
    ON bookshelf_items FOR UPDATE
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsi_service_all"
    ON bookshelf_items FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. bookshelf_chapters
-- Chapter structure (from document TOC discovery)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookshelf_item_id UUID NOT NULL REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  start_chunk_index INTEGER,
  end_chunk_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bch_item ON bookshelf_chapters (bookshelf_item_id);

ALTER TABLE bookshelf_chapters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bch_select_via_item"
    ON bookshelf_chapters FOR SELECT
    TO authenticated
    USING (
      bookshelf_item_id IN (
        SELECT id FROM bookshelf_items
        WHERE family_id IN (
          SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bch_service_all"
    ON bookshelf_chapters FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. bookshelf_chunks
-- Platform-level RAG text chunks (keyed to book_cache, NOT family)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_cache_id UUID NOT NULL REFERENCES platform_intelligence.book_cache(id),
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  token_count INTEGER,
  chapter_title TEXT,
  chapter_index INTEGER,
  embedding halfvec(1536),
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bchk_cache_idx ON bookshelf_chunks (book_cache_id, chunk_index);

DO $$ BEGIN
  CREATE INDEX idx_bchk_embedding ON bookshelf_chunks
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Embedding trigger
CREATE OR REPLACE TRIGGER queue_embedding_bookshelf_chunks
  AFTER INSERT OR UPDATE OF chunk_text ON bookshelf_chunks
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

-- RLS: authenticated can read chunks for books in their family
ALTER TABLE bookshelf_chunks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bchk_select_authenticated"
    ON bookshelf_chunks FOR SELECT
    TO authenticated
    USING (
      book_cache_id IN (
        SELECT book_cache_id FROM bookshelf_items
        WHERE family_id IN (
          SELECT family_id FROM family_members WHERE user_id = auth.uid()
        )
        AND book_cache_id IS NOT NULL
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bchk_service_all"
    ON bookshelf_chunks FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. bookshelf_summaries
-- Per-member extracted summaries
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  bookshelf_item_id UUID NOT NULL REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  section_title TEXT,
  section_index INTEGER,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('key_concept', 'story', 'metaphor', 'lesson', 'quote', 'insight', 'theme', 'character_insight', 'exercise', 'principle')),
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  audience TEXT DEFAULT 'original' NOT NULL,
  is_key_point BOOLEAN DEFAULT false NOT NULL,
  is_hearted BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  is_from_go_deeper BOOLEAN DEFAULT false NOT NULL,
  user_note TEXT,
  is_included_in_ai BOOLEAN DEFAULT true NOT NULL,
  embedding halfvec(1536),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bsm_member_item ON bookshelf_summaries (family_member_id, bookshelf_item_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bsm_hearted ON bookshelf_summaries (family_member_id, is_hearted, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bsm_item_audience ON bookshelf_summaries (bookshelf_item_id, audience);

DO $$ BEGIN
  CREATE INDEX idx_bsm_embedding ON bookshelf_summaries
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_bsm_updated_at
  BEFORE UPDATE ON bookshelf_summaries
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE OR REPLACE TRIGGER queue_embedding_bookshelf_summaries
  AFTER INSERT OR UPDATE OF text ON bookshelf_summaries
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE bookshelf_summaries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bsm_select_family"
    ON bookshelf_summaries FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsm_insert_own"
    ON bookshelf_summaries FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsm_update_own"
    ON bookshelf_summaries FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsm_service_all"
    ON bookshelf_summaries FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 6. bookshelf_insights
-- Per-member extracted insights (flat structure, 8 content types)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  bookshelf_item_id UUID NOT NULL REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  section_title TEXT,
  section_index INTEGER,
  content_type TEXT DEFAULT 'principle' NOT NULL
    CHECK (content_type IN ('principle', 'framework', 'mental_model', 'process', 'strategy', 'concept', 'system', 'tool_set')),
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  audience TEXT DEFAULT 'original' NOT NULL,
  is_key_point BOOLEAN DEFAULT false NOT NULL,
  is_user_added BOOLEAN DEFAULT false NOT NULL,
  is_hearted BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  is_from_go_deeper BOOLEAN DEFAULT false NOT NULL,
  user_note TEXT,
  is_included_in_ai BOOLEAN DEFAULT true NOT NULL,
  embedding halfvec(1536),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bin_member_item ON bookshelf_insights (family_member_id, bookshelf_item_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bin_hearted ON bookshelf_insights (family_member_id, is_hearted, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bin_item_audience ON bookshelf_insights (bookshelf_item_id, audience);
CREATE INDEX IF NOT EXISTS idx_bin_content_type ON bookshelf_insights (content_type);

DO $$ BEGIN
  CREATE INDEX idx_bin_embedding ON bookshelf_insights
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_bin_updated_at
  BEFORE UPDATE ON bookshelf_insights
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE OR REPLACE TRIGGER queue_embedding_bookshelf_insights
  AFTER INSERT OR UPDATE OF text ON bookshelf_insights
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE bookshelf_insights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bin_select_family"
    ON bookshelf_insights FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bin_insert_own"
    ON bookshelf_insights FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bin_update_own"
    ON bookshelf_insights FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bin_service_all"
    ON bookshelf_insights FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 7. bookshelf_declarations
-- Per-member honest identity declarations
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  bookshelf_item_id UUID NOT NULL REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  section_title TEXT,
  section_index INTEGER,
  value_name TEXT,
  declaration_text TEXT NOT NULL,
  style_variant TEXT NOT NULL
    CHECK (style_variant IN ('choosing_committing', 'recognizing_awakening', 'claiming_stepping_into', 'learning_striving', 'resolute_unashamed')),
  richness TEXT
    CHECK (richness IS NULL OR richness IN ('rich', 'medium', 'concise')),
  sort_order INTEGER DEFAULT 0 NOT NULL,
  audience TEXT DEFAULT 'original' NOT NULL,
  is_key_point BOOLEAN DEFAULT false NOT NULL,
  is_hearted BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  is_from_go_deeper BOOLEAN DEFAULT false NOT NULL,
  sent_to_guiding_stars BOOLEAN DEFAULT false NOT NULL,
  guiding_star_id UUID REFERENCES guiding_stars(id) ON DELETE SET NULL,
  user_note TEXT,
  is_included_in_ai BOOLEAN DEFAULT true NOT NULL,
  embedding halfvec(1536),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bde_member_item ON bookshelf_declarations (family_member_id, bookshelf_item_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bde_hearted ON bookshelf_declarations (family_member_id, is_hearted, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bde_item_audience ON bookshelf_declarations (bookshelf_item_id, audience);
CREATE INDEX IF NOT EXISTS idx_bde_sent_gs ON bookshelf_declarations (family_member_id, sent_to_guiding_stars);

DO $$ BEGIN
  CREATE INDEX idx_bde_embedding ON bookshelf_declarations
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_bde_updated_at
  BEFORE UPDATE ON bookshelf_declarations
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE OR REPLACE TRIGGER queue_embedding_bookshelf_declarations
  AFTER INSERT OR UPDATE OF declaration_text ON bookshelf_declarations
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE bookshelf_declarations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bde_select_family"
    ON bookshelf_declarations FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bde_insert_own"
    ON bookshelf_declarations FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bde_update_own"
    ON bookshelf_declarations FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bde_service_all"
    ON bookshelf_declarations FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 8. bookshelf_action_steps
-- Per-member actionable exercises and practices
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_action_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  bookshelf_item_id UUID NOT NULL REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  section_title TEXT,
  section_index INTEGER,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('exercise', 'practice', 'habit', 'conversation_starter', 'project', 'daily_action', 'weekly_practice')),
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  audience TEXT DEFAULT 'original' NOT NULL,
  is_key_point BOOLEAN DEFAULT false NOT NULL,
  is_hearted BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  is_from_go_deeper BOOLEAN DEFAULT false NOT NULL,
  sent_to_tasks BOOLEAN DEFAULT false NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_note TEXT,
  is_included_in_ai BOOLEAN DEFAULT true NOT NULL,
  embedding halfvec(1536),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bas_member_item ON bookshelf_action_steps (family_member_id, bookshelf_item_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bas_hearted ON bookshelf_action_steps (family_member_id, is_hearted, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bas_item_audience ON bookshelf_action_steps (bookshelf_item_id, audience);

DO $$ BEGIN
  CREATE INDEX idx_bas_embedding ON bookshelf_action_steps
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_bas_updated_at
  BEFORE UPDATE ON bookshelf_action_steps
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE OR REPLACE TRIGGER queue_embedding_bookshelf_action_steps
  AFTER INSERT OR UPDATE OF text ON bookshelf_action_steps
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE bookshelf_action_steps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bas_select_family"
    ON bookshelf_action_steps FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bas_insert_own"
    ON bookshelf_action_steps FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bas_update_own"
    ON bookshelf_action_steps FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bas_service_all"
    ON bookshelf_action_steps FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 9. bookshelf_questions
-- Per-member extracted reflection questions
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  bookshelf_item_id UUID NOT NULL REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  section_title TEXT,
  section_index INTEGER,
  content_type TEXT NOT NULL
    CHECK (content_type IN ('reflection', 'implementation', 'recognition', 'self_examination', 'discussion', 'scenario')),
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  audience TEXT DEFAULT 'original' NOT NULL,
  is_key_point BOOLEAN DEFAULT false NOT NULL,
  is_hearted BOOLEAN DEFAULT false NOT NULL,
  is_deleted BOOLEAN DEFAULT false NOT NULL,
  is_from_go_deeper BOOLEAN DEFAULT false NOT NULL,
  sent_to_prompts BOOLEAN DEFAULT false NOT NULL,
  journal_prompt_id UUID,
  sent_to_tasks BOOLEAN DEFAULT false NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_note TEXT,
  is_included_in_ai BOOLEAN DEFAULT true NOT NULL,
  embedding halfvec(1536),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bqu_member_item ON bookshelf_questions (family_member_id, bookshelf_item_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bqu_hearted ON bookshelf_questions (family_member_id, is_hearted, is_deleted);
CREATE INDEX IF NOT EXISTS idx_bqu_item_audience ON bookshelf_questions (bookshelf_item_id, audience);

DO $$ BEGIN
  CREATE INDEX idx_bqu_embedding ON bookshelf_questions
    USING hnsw (embedding halfvec_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_bqu_updated_at
  BEFORE UPDATE ON bookshelf_questions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

CREATE OR REPLACE TRIGGER queue_embedding_bookshelf_questions
  AFTER INSERT OR UPDATE OF text ON bookshelf_questions
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();

ALTER TABLE bookshelf_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bqu_select_family"
    ON bookshelf_questions FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bqu_insert_own"
    ON bookshelf_questions FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bqu_update_own"
    ON bookshelf_questions FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bqu_service_all"
    ON bookshelf_questions FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 10. journal_prompts (standalone — NOT prefixed with bookshelf_)
-- Personal prompt library, multi-source
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  prompt_text TEXT NOT NULL,
  source TEXT DEFAULT 'manual' NOT NULL
    CHECK (source IN ('manual', 'bookshelf_extraction')),
  source_reference_id UUID,
  source_book_title TEXT,
  source_chapter_title TEXT,
  tags TEXT[] DEFAULT '{}' NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jp_member ON journal_prompts (family_member_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_jp_member_book ON journal_prompts (family_member_id, source_book_title);

DO $$ BEGIN
  CREATE INDEX idx_jp_tags ON journal_prompts USING gin (tags);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_jp_updated_at
  BEFORE UPDATE ON journal_prompts
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "jp_select_family"
    ON journal_prompts FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "jp_insert_own"
    ON journal_prompts FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "jp_update_own"
    ON journal_prompts FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "jp_service_all"
    ON journal_prompts FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add FK from bookshelf_questions to journal_prompts now that the table exists
DO $$ BEGIN
  ALTER TABLE bookshelf_questions
    ADD CONSTRAINT fk_bqu_journal_prompt
    FOREIGN KEY (journal_prompt_id) REFERENCES journal_prompts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 11. bookshelf_discussions
-- Book discussion conversation metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  bookshelf_item_ids UUID[] NOT NULL,
  audience TEXT DEFAULT 'personal' NOT NULL
    CHECK (audience IN ('personal', 'family', 'teen', 'spouse', 'children')),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bdi_member ON bookshelf_discussions (family_member_id, updated_at DESC);

CREATE OR REPLACE TRIGGER trg_bdi_updated_at
  BEFORE UPDATE ON bookshelf_discussions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE bookshelf_discussions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bdi_select_own"
    ON bookshelf_discussions FOR SELECT TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bdi_insert_own"
    ON bookshelf_discussions FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bdi_update_own"
    ON bookshelf_discussions FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bdi_service_all"
    ON bookshelf_discussions FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 12. bookshelf_discussion_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_discussion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES bookshelf_discussions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bdm_discussion ON bookshelf_discussion_messages (discussion_id, created_at);

ALTER TABLE bookshelf_discussion_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bdm_select_via_discussion"
    ON bookshelf_discussion_messages FOR SELECT TO authenticated
    USING (
      discussion_id IN (
        SELECT id FROM bookshelf_discussions
        WHERE family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bdm_insert_via_discussion"
    ON bookshelf_discussion_messages FOR INSERT TO authenticated
    WITH CHECK (
      discussion_id IN (
        SELECT id FROM bookshelf_discussions
        WHERE family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bdm_service_all"
    ON bookshelf_discussion_messages FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 13. bookshelf_collections
-- Named book groupings
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  created_by_member_id UUID NOT NULL REFERENCES family_members(id),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bcol_family ON bookshelf_collections (family_id, archived_at, sort_order);

CREATE OR REPLACE TRIGGER trg_bcol_updated_at
  BEFORE UPDATE ON bookshelf_collections
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE bookshelf_collections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bcol_select_family"
    ON bookshelf_collections FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bcol_insert_family"
    ON bookshelf_collections FOR INSERT TO authenticated
    WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bcol_update_family"
    ON bookshelf_collections FOR UPDATE TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bcol_service_all"
    ON bookshelf_collections FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 14. bookshelf_collection_items
-- Junction: books <-> collections
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES bookshelf_collections(id) ON DELETE CASCADE,
  bookshelf_item_id UUID NOT NULL REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (collection_id, bookshelf_item_id)
);

CREATE INDEX IF NOT EXISTS idx_bci_collection ON bookshelf_collection_items (collection_id, sort_order);

ALTER TABLE bookshelf_collection_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bci_select_via_collection"
    ON bookshelf_collection_items FOR SELECT TO authenticated
    USING (
      collection_id IN (
        SELECT id FROM bookshelf_collections
        WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bci_insert_via_collection"
    ON bookshelf_collection_items FOR INSERT TO authenticated
    WITH CHECK (
      collection_id IN (
        SELECT id FROM bookshelf_collections
        WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bci_delete_via_collection"
    ON bookshelf_collection_items FOR DELETE TO authenticated
    USING (
      collection_id IN (
        SELECT id FROM bookshelf_collections
        WHERE family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bci_service_all"
    ON bookshelf_collection_items FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 15. bookshelf_shares
-- Book/collection sharing records
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  shared_by_member_id UUID NOT NULL REFERENCES family_members(id),
  shared_with_member_id UUID NOT NULL REFERENCES family_members(id),
  share_type TEXT NOT NULL CHECK (share_type IN ('book', 'collection')),
  bookshelf_item_id UUID REFERENCES bookshelf_items(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES bookshelf_collections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT bookshelf_shares_type_check CHECK (
    (share_type = 'book' AND bookshelf_item_id IS NOT NULL) OR
    (share_type = 'collection' AND collection_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_bsh_family ON bookshelf_shares (family_id);
CREATE INDEX IF NOT EXISTS idx_bsh_recipient ON bookshelf_shares (shared_with_member_id);

ALTER TABLE bookshelf_shares ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bsh_select_family"
    ON bookshelf_shares FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsh_insert_family"
    ON bookshelf_shares FOR INSERT TO authenticated
    WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsh_delete_family"
    ON bookshelf_shares FOR DELETE TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bsh_service_all"
    ON bookshelf_shares FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 16. bookshelf_member_settings
-- Per-member BookShelf configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS bookshelf_member_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  book_knowledge_access TEXT DEFAULT 'hearted_only' NOT NULL
    CHECK (book_knowledge_access IN ('hearted_only', 'all_extracted', 'insights_only', 'none')),
  library_sort TEXT DEFAULT 'newest',
  library_layout TEXT DEFAULT 'grid',
  library_group_mode TEXT DEFAULT 'all_books',
  resurfaced_item_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (family_id, family_member_id)
);

CREATE OR REPLACE TRIGGER trg_bms_updated_at
  BEFORE UPDATE ON bookshelf_member_settings
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

ALTER TABLE bookshelf_member_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bms_select_family"
    ON bookshelf_member_settings FOR SELECT TO authenticated
    USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bms_upsert_own"
    ON bookshelf_member_settings FOR INSERT TO authenticated
    WITH CHECK (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bms_update_own"
    ON bookshelf_member_settings FOR UPDATE TO authenticated
    USING (family_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "bms_service_all"
    ON bookshelf_member_settings FOR ALL TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 17. Feature key registrations
-- ============================================================
INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('bookshelf_basic', 'BookShelf Basic', 'BookShelf page, file upload, text extraction, AI classification, search', 'PRD-23'),
  ('bookshelf_extraction', 'BookShelf Extraction', 'AI extraction (all 5 tabs), Go Deeper, Re-Run', 'PRD-23'),
  ('bookshelf_discussions', 'BookShelf Discussions', 'Book discussions (single and multi-book)', 'PRD-23'),
  ('bookshelf_export', 'BookShelf Export', 'Export in all formats', 'PRD-23'),
  ('bookshelf_adult', 'BookShelf Adult Access', 'Dad/Additional Adult BookShelf access', 'PRD-23'),
  ('bookshelf_teen', 'BookShelf Teen Access', 'Independent Teen BookShelf access', 'PRD-23'),
  ('bookshelf_sharing', 'BookShelf Sharing', 'Family sharing and assignment features', 'PRD-23')
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================================
-- 18. Register LiLa guided modes for BookShelf
-- ============================================================
INSERT INTO lila_guided_modes (mode_key, display_name, parent_mode, model_tier, context_sources, person_selector, available_to_roles, system_prompt_key, sort_order, is_active)
VALUES
  ('book_discuss', 'Discuss This Book', 'bookshelf_action', 'sonnet', ARRAY['bookshelf_chunks', 'bookshelf_summaries', 'bookshelf_insights', 'guiding_stars', 'self_knowledge'], false, ARRAY['mom', 'dad_adults', 'independent_teens'], 'book_discuss', 80, true),
  ('library_ask', 'Ask Your Library', 'bookshelf_action', 'sonnet', ARRAY['bookshelf_chunks', 'bookshelf_summaries', 'bookshelf_insights', 'guiding_stars', 'self_knowledge'], false, ARRAY['mom', 'dad_adults', 'independent_teens'], 'library_ask', 81, true)
ON CONFLICT (mode_key) DO NOTHING;

-- ============================================================
-- Done. All 16 tables + book_cache created.
-- Ready for Phase B+C data migration.
-- ============================================================