-- ============================================================
-- Migration: update_book_extraction_youth_text RPC
-- PRD-23 Study Guide Rework
--
-- Provides a SECURITY DEFINER RPC for the bookshelf-study-guide
-- Edge Function to UPDATE guided_text and independent_text on
-- existing platform_intelligence.book_extractions rows.
--
-- Platform_intelligence tables are not exposed via PostgREST,
-- so Edge Functions need an RPC to write to them.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_book_extraction_youth_text(
  p_extraction_id UUID,
  p_guided_text TEXT DEFAULT NULL,
  p_independent_text TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
BEGIN
  UPDATE platform_intelligence.book_extractions
  SET
    guided_text = p_guided_text,
    independent_text = p_independent_text,
    updated_at = now()
  WHERE id = p_extraction_id;
END;
$$;

-- ============================================================
-- 2. count_youth_text_by_book
--
-- Returns the count of extractions that have guided_text populated
-- for each book_library_id. Used by StudyGuideLibrary to show
-- which books already have study guides generated.
-- ============================================================
CREATE OR REPLACE FUNCTION public.count_youth_text_by_book(
  p_book_library_ids UUID[]
)
RETURNS TABLE(book_library_id UUID, item_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
BEGIN
  RETURN QUERY
    SELECT e.book_library_id, COUNT(*)::BIGINT AS item_count
    FROM platform_intelligence.book_extractions e
    WHERE e.book_library_id = ANY(p_book_library_ids)
      AND e.audience = 'original'
      AND e.guided_text IS NOT NULL
    GROUP BY e.book_library_id;
END;
$$;

-- ============================================================
-- Verification
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Created update_book_extraction_youth_text + count_youth_text_by_book RPCs for study guide rework';
END $$;
