-- ============================================================
-- BookShelf Platform Library — Phase 1b, Sub-phase E
-- RPCs for remaining consumer rewires: key-points, study-guide,
-- context-assembler.
--
-- 1. Fix get_bookshelf_context enum: 'all_extracted' → 'all'
-- 2. update_book_extraction_key_points — batch key-point toggle
-- 3. delete_book_extractions_by_audience — study guide cleanup
-- 4. insert_book_extractions_study_guide — study guide inserts
--
-- All SECURITY DEFINER so Edge Functions can write to
-- platform_intelligence.* via service role.
-- ============================================================

-- ============================================================
-- 1. Fix get_bookshelf_context enum alignment (Decision #8)
--    'all_extracted' → 'all' per PRD-23 + founder decision
-- ============================================================

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
      AND bi.parent_bookshelf_item_id IS NULL
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
      p_access_level = 'all'
      OR p_access_level = 'all_extracted'  -- backward compat with any callers using old value
      OR (p_access_level = 'hearted_only' AND COALESCE(us.is_hearted, false) = true)
      OR (p_access_level = 'insights_only' AND e.extraction_type = 'insight')
    )
  ORDER BY COALESCE(us.is_hearted, false) DESC, e.created_at
  LIMIT p_max_items;
$$;

-- ============================================================
-- 2. update_book_extraction_key_points
--    Batch-set is_key_point on platform_intelligence.book_extractions.
--    Used by bookshelf-key-points Edge Function.
-- ============================================================

CREATE OR REPLACE FUNCTION update_book_extraction_key_points(
  p_ids UUID[],
  p_is_key_point BOOLEAN
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE platform_intelligence.book_extractions
  SET is_key_point = p_is_key_point,
      updated_at = now()
  WHERE id = ANY(p_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- 3. delete_book_extractions_by_audience
--    Removes study guide rows for a specific audience key
--    before regeneration. Used by bookshelf-study-guide.
-- ============================================================

CREATE OR REPLACE FUNCTION delete_book_extractions_by_audience(
  p_book_library_id UUID,
  p_audience TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM platform_intelligence.book_extractions
  WHERE book_library_id = p_book_library_id
    AND audience = p_audience;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- 4. insert_book_extractions_study_guide
--    Inserts rewritten study guide rows into the platform table.
--    Accepts a JSONB array of extraction objects.
--    Used by bookshelf-study-guide Edge Function.
-- ============================================================

CREATE OR REPLACE FUNCTION insert_book_extractions_study_guide(
  p_book_library_id UUID,
  p_audience TEXT,
  p_items JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
DECLARE
  v_item JSONB;
  v_count INTEGER := 0;
BEGIN
  FOR v_item IN SELECT jsonb_array_elements(p_items)
  LOOP
    INSERT INTO platform_intelligence.book_extractions (
      book_library_id,
      extraction_type,
      text,
      declaration_text,
      content_type,
      style_variant,
      section_title,
      audience,
      is_key_point,
      is_deleted,
      sort_order
    ) VALUES (
      p_book_library_id,
      v_item->>'extraction_type',
      v_item->>'text',
      v_item->>'declaration_text',
      v_item->>'content_type',
      v_item->>'style_variant',
      v_item->>'section_title',
      p_audience,
      true,
      false,
      COALESCE((v_item->>'sort_order')::INTEGER, 0)
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
