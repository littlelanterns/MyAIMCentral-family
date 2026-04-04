-- Migration: Fix multi-part book extraction ordering
-- Problem: section_index from different parts overlap (Part 1 idx=0, Part 2 idx=0),
-- causing interleaved display instead of sequential parts.
-- Solution: Add source_part_number column and update RPC ORDER BY.

-- ── 1. Add source_part_number column ─────────────────────────────────────────

ALTER TABLE platform_intelligence.book_extractions
  ADD COLUMN IF NOT EXISTS source_part_number INTEGER DEFAULT 0 NOT NULL;

-- ── 2. Backfill source_part_number from old extraction tables ────────────────
-- Match new extractions → old extraction rows → bookshelf_items.part_number

DO $$
DECLARE
  v_table TEXT;
  v_text_col TEXT;
  v_count INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  -- For each old extraction table, match by text + section_title + extraction_type
  -- and set source_part_number from the bookshelf_item's part_number
  FOR v_table, v_text_col IN
    VALUES ('bookshelf_summaries', 'text'),
           ('bookshelf_insights', 'text'),
           ('bookshelf_declarations', 'declaration_text'),
           ('bookshelf_action_steps', 'text'),
           ('bookshelf_questions', 'text')
  LOOP
    EXECUTE format(
      $sql$
      WITH part_mapping AS (
        SELECT DISTINCT ON (old.%I, old.section_title)
          old.%I AS match_text,
          old.section_title,
          COALESCE(bi.part_number, 0) AS part_num,
          bi.book_library_id
        FROM %I old
        JOIN bookshelf_items bi ON old.bookshelf_item_id = bi.id
        WHERE bi.part_number IS NOT NULL AND bi.part_number > 0
      )
      UPDATE platform_intelligence.book_extractions be
      SET source_part_number = pm.part_num
      FROM part_mapping pm
      WHERE be.book_library_id = pm.book_library_id
        AND be.%I = pm.match_text
        AND COALESCE(be.section_title, '') = COALESCE(pm.section_title, '')
        AND be.source_part_number = 0
      $sql$,
      v_text_col, v_text_col, v_table,
      CASE WHEN v_text_col = 'declaration_text' THEN 'declaration_text' ELSE 'text' END
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE 'Updated % rows from %', v_count, v_table;
  END LOOP;
  RAISE NOTICE 'Total updated: %', v_total;
END $$;

-- ── 3. Index for ordering ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_plbe_part_order
  ON platform_intelligence.book_extractions (book_library_id, source_part_number, section_index, sort_order);

-- ── 4. Update get_book_extractions RPC with correct ordering ─────────────────

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
  ORDER BY e.source_part_number, e.section_index NULLS LAST, e.sort_order;
$$;
