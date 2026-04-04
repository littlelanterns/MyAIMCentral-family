-- ============================================================
-- BookShelf Platform Library — RPCs + Embedding Trigger
-- Split from 100090 which timed out during data migration.
-- ============================================================

-- match_book_chunks: semantic search on platform-level chunks
CREATE OR REPLACE FUNCTION match_book_chunks(
  query_embedding halfvec(1536),
  p_family_id UUID,
  p_book_library_ids UUID[] DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  book_library_id UUID,
  book_title TEXT,
  chunk_index INT,
  chunk_text TEXT,
  chapter_title TEXT,
  chapter_index INT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    bc.id,
    bc.book_library_id,
    bl.title AS book_title,
    bc.chunk_index,
    bc.text AS chunk_text,
    bc.chapter_title,
    bc.chapter_index,
    1 - (bc.embedding <=> query_embedding)::FLOAT AS similarity
  FROM platform_intelligence.book_chunks bc
  JOIN platform_intelligence.book_library bl ON bl.id = bc.book_library_id
  WHERE
    bc.book_library_id IN (
      SELECT DISTINCT bi.book_library_id FROM bookshelf_items bi
      WHERE bi.family_id = p_family_id
        AND bi.book_library_id IS NOT NULL
        AND bi.archived_at IS NULL
    )
    AND bc.embedding IS NOT NULL
    AND (p_book_library_ids IS NULL OR bc.book_library_id = ANY(p_book_library_ids))
    AND 1 - (bc.embedding <=> query_embedding) > match_threshold
  ORDER BY bc.embedding <=> query_embedding
  LIMIT match_count;
END;
$fn$;

-- match_book_extractions: semantic search on unified extractions + personal state
CREATE OR REPLACE FUNCTION match_book_extractions(
  query_embedding halfvec(1536),
  p_family_id UUID,
  p_member_id UUID,
  p_book_library_ids UUID[] DEFAULT NULL,
  p_extraction_types TEXT[] DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  book_library_id UUID,
  book_title TEXT,
  extraction_type TEXT,
  content_type TEXT,
  item_text TEXT,
  section_title TEXT,
  section_index INT,
  is_key_point BOOLEAN,
  is_hearted BOOLEAN,
  user_note TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    be.id,
    be.book_library_id,
    bl.title AS book_title,
    be.extraction_type,
    be.content_type,
    be.text AS item_text,
    be.section_title,
    be.section_index,
    be.is_key_point,
    COALESCE(bus.is_hearted, false) AS is_hearted,
    bus.user_note,
    1 - (be.embedding <=> query_embedding)::FLOAT AS similarity
  FROM platform_intelligence.book_extractions be
  JOIN platform_intelligence.book_library bl ON bl.id = be.book_library_id
  LEFT JOIN bookshelf_user_state bus
    ON bus.extraction_id = be.id AND bus.member_id = p_member_id
  WHERE
    be.book_library_id IN (
      SELECT DISTINCT bi.book_library_id FROM bookshelf_items bi
      WHERE bi.family_id = p_family_id
        AND bi.book_library_id IS NOT NULL
        AND bi.archived_at IS NULL
    )
    AND be.is_deleted = false
    AND be.audience = 'original'
    AND be.embedding IS NOT NULL
    AND (p_book_library_ids IS NULL OR be.book_library_id = ANY(p_book_library_ids))
    AND (p_extraction_types IS NULL OR be.extraction_type = ANY(p_extraction_types))
    AND 1 - (be.embedding <=> query_embedding) > match_threshold
  ORDER BY be.embedding <=> query_embedding
  LIMIT match_count;
END;
$fn$;

-- Embedding trigger (safe to add now — only fires on future inserts, not on migration data)
CREATE OR REPLACE TRIGGER queue_embedding_book_extractions
  AFTER INSERT OR UPDATE OF text ON platform_intelligence.book_extractions
  FOR EACH ROW EXECUTE FUNCTION util.queue_embedding_job();
