-- RPC to read book chunks from platform_intelligence for study guide generation.
-- Needed because platform_intelligence tables aren't PostgREST-accessible.
-- Some books have chunks in the old bookshelf_chunks table, others only in
-- platform_intelligence.book_chunks (migrated during Phase 1b).

CREATE OR REPLACE FUNCTION public.get_book_chunks_for_study_guide(
  p_book_library_id UUID
)
RETURNS TABLE(
  chunk_index INTEGER,
  chapter_index INTEGER,
  chapter_title TEXT,
  text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
BEGIN
  RETURN QUERY
    SELECT
      bc.chunk_index::INTEGER,
      bc.chapter_index::INTEGER,
      bc.chapter_title,
      bc.text
    FROM platform_intelligence.book_chunks bc
    WHERE bc.book_library_id = p_book_library_id
    ORDER BY bc.chunk_index ASC;
END;
$$;

DO $$ BEGIN
  RAISE NOTICE 'Created get_book_chunks_for_study_guide RPC for platform chunk access';
END $$;
