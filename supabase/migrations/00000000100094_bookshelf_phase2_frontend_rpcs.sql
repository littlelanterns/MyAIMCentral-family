-- Migration: BookShelf Platform Library Phase 2 — Frontend RPCs
-- Adds is_hidden to bookshelf_user_state and creates RPCs for frontend query migration.
-- These RPCs bridge the frontend to platform_intelligence tables (not PostgREST-accessible).

-- ── 1. Add is_hidden column to bookshelf_user_state ──────────────────────────

ALTER TABLE bookshelf_user_state
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false NOT NULL;

-- ── 2. RPC: get_book_extractions ─────────────────────────────────────────────
-- Fetches extractions for given bookshelf_item IDs, resolving book_library_ids
-- internally. Returns platform extraction data LEFT JOINed with per-member user state.
-- Accepts bookshelf_item_ids so the frontend doesn't need to resolve book_library_ids.

CREATE OR REPLACE FUNCTION get_book_extractions(
  p_bookshelf_item_ids UUID[],
  p_member_id UUID,
  p_audience TEXT DEFAULT 'original'
)
RETURNS TABLE (
  id UUID,
  book_library_id UUID,
  extraction_type TEXT,
  text TEXT,
  guided_text TEXT,
  independent_text TEXT,
  content_type TEXT,
  declaration_text TEXT,
  style_variant TEXT,
  value_name TEXT,
  richness TEXT,
  section_title TEXT,
  section_index INTEGER,
  sort_order INTEGER,
  audience TEXT,
  is_key_point BOOLEAN,
  is_from_go_deeper BOOLEAN,
  is_deleted BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- User state columns (NULL when no user_state row exists)
  is_hearted BOOLEAN,
  user_note TEXT,
  is_included_in_ai BOOLEAN,
  is_hidden BOOLEAN,
  sent_to_guiding_stars BOOLEAN,
  guiding_star_id UUID,
  sent_to_tasks BOOLEAN,
  task_id UUID,
  sent_to_prompts BOOLEAN,
  journal_prompt_id UUID,
  user_state_id UUID
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
  WITH library_ids AS (
    SELECT DISTINCT bi.book_library_id
    FROM bookshelf_items bi
    WHERE bi.id = ANY(p_bookshelf_item_ids)
      AND bi.book_library_id IS NOT NULL
  )
  SELECT
    e.id,
    e.book_library_id,
    e.extraction_type,
    e.text,
    e.guided_text,
    e.independent_text,
    e.content_type,
    e.declaration_text,
    e.style_variant,
    e.value_name,
    e.richness,
    e.section_title,
    e.section_index,
    e.sort_order,
    e.audience,
    e.is_key_point,
    e.is_from_go_deeper,
    e.is_deleted,
    e.created_at,
    e.updated_at,
    COALESCE(us.is_hearted, false),
    us.user_note,
    COALESCE(us.is_included_in_ai, true),
    COALESCE(us.is_hidden, false),
    COALESCE(us.sent_to_guiding_stars, false),
    us.guiding_star_id,
    COALESCE(us.sent_to_tasks, false),
    us.task_id,
    COALESCE(us.sent_to_prompts, false),
    us.journal_prompt_id,
    us.id AS user_state_id
  FROM platform_intelligence.book_extractions e
  JOIN library_ids li ON e.book_library_id = li.book_library_id
  LEFT JOIN bookshelf_user_state us
    ON us.extraction_id = e.id AND us.member_id = p_member_id
  WHERE e.audience = p_audience
    AND e.is_deleted = false
    AND COALESCE(us.is_hidden, false) = false
  ORDER BY e.section_index NULLS LAST, e.sort_order;
$$;

-- ── 3. RPC: update_extraction_text ───────────────────────────────────────────
-- SECURITY DEFINER to write to platform_intelligence (not PostgREST-accessible).
-- Used when editing extraction text (custom insights, admin edits).

CREATE OR REPLACE FUNCTION update_extraction_text(
  p_extraction_id UUID,
  p_extraction_type TEXT,
  p_text TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
BEGIN
  IF p_extraction_type = 'declaration' THEN
    UPDATE platform_intelligence.book_extractions
    SET declaration_text = p_text, updated_at = now()
    WHERE id = p_extraction_id;
  ELSE
    UPDATE platform_intelligence.book_extractions
    SET text = p_text, updated_at = now()
    WHERE id = p_extraction_id;
  END IF;
  RETURN FOUND;
END;
$$;

-- ── 4. RPC: create_custom_extraction ─────────────────────────────────────────
-- SECURITY DEFINER to insert into platform_intelligence.
-- Used for user-added custom insights.

CREATE OR REPLACE FUNCTION create_custom_extraction(
  p_book_library_id UUID,
  p_extraction_type TEXT,
  p_text TEXT,
  p_content_type TEXT DEFAULT NULL,
  p_section_title TEXT DEFAULT NULL,
  p_audience TEXT DEFAULT 'original'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO platform_intelligence.book_extractions (
    book_library_id, extraction_type, text, content_type,
    section_title, audience, is_key_point, is_from_go_deeper, is_deleted
  ) VALUES (
    p_book_library_id, p_extraction_type, p_text, p_content_type,
    p_section_title, p_audience, true, false, false
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ── 5. RPC: count_extractions_by_audience ────────────────────────────────────
-- Used by StudyGuideLibrary to discover which books have study guides.

CREATE OR REPLACE FUNCTION count_extractions_by_audience(
  p_book_library_ids UUID[],
  p_audience TEXT
)
RETURNS TABLE (
  book_library_id UUID,
  item_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
  SELECT e.book_library_id, count(*) AS item_count
  FROM platform_intelligence.book_extractions e
  WHERE e.book_library_id = ANY(p_book_library_ids)
    AND e.audience = p_audience
    AND e.is_deleted = false
  GROUP BY e.book_library_id;
$$;

-- ── 6. RPC: get_bookshelf_context ────────────────────────────────────────────
-- Used by context-assembly.ts to load BookShelf context for LiLa.
-- Returns extraction text with book title for AI context building.

CREATE OR REPLACE FUNCTION get_bookshelf_context(
  p_family_id UUID,
  p_member_id UUID,
  p_access_level TEXT DEFAULT 'hearted_only',
  p_max_items INTEGER DEFAULT 25
)
RETURNS TABLE (
  extraction_type TEXT,
  text TEXT,
  declaration_text TEXT,
  content_type TEXT,
  style_variant TEXT,
  is_hearted BOOLEAN,
  book_title TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
  WITH member_books AS (
    SELECT bi.book_library_id, bi.title
    FROM bookshelf_items bi
    WHERE bi.family_id = p_family_id
      AND bi.extraction_status = 'completed'
      AND bi.book_library_id IS NOT NULL
      AND bi.parent_bookshelf_item_id IS NULL  -- Only parent/standalone books
  )
  SELECT
    e.extraction_type,
    e.text,
    e.declaration_text,
    e.content_type,
    e.style_variant,
    COALESCE(us.is_hearted, false) AS is_hearted,
    mb.title AS book_title
  FROM platform_intelligence.book_extractions e
  JOIN member_books mb ON e.book_library_id = mb.book_library_id
  LEFT JOIN bookshelf_user_state us
    ON us.extraction_id = e.id AND us.member_id = p_member_id
  WHERE e.audience = 'original'
    AND e.is_deleted = false
    AND COALESCE(us.is_hidden, false) = false
    AND COALESCE(us.is_included_in_ai, true) = true
    AND e.extraction_type IN ('summary', 'insight', 'declaration', 'action_step')
    AND (
      p_access_level = 'all_extracted'
      OR (p_access_level = 'hearted_only' AND COALESCE(us.is_hearted, false) = true)
      OR (p_access_level = 'insights_only' AND e.extraction_type = 'insight')
    )
  ORDER BY COALESCE(us.is_hearted, false) DESC, e.created_at
  LIMIT p_max_items;
$$;
