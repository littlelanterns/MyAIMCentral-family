-- ============================================================
-- BookShelf Phase 1b-B: Write-Path RPCs
--
-- Four SECURITY DEFINER RPCs that allow Edge Functions (running
-- as service_role) to write into platform_intelligence tables
-- which are not exposed via PostgREST.
--
-- 1. upsert_book_library  — atomic cache-hit check + insert
-- 2. set_bookshelf_item_library_id — link bookshelf_items → book_library
-- 3. insert_book_chunks   — bulk insert chunks
-- 4. insert_book_extractions — bulk insert extractions
-- ============================================================

-- ============================================================
-- 1. upsert_book_library
--
-- Cache-hit logic:
--   >= 0.9 similarity  → cache hit (return existing row)
--   0.8-0.9 similarity → uncertain (create NEW entry)
--   < 0.8 similarity   → different book (create NEW entry)
--
-- ISBN is NOT used for matching (Founder Decision 1).
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_book_library(
  p_title TEXT,
  p_author TEXT DEFAULT NULL,
  p_isbn TEXT DEFAULT NULL,
  p_genres TEXT[] DEFAULT '{}',
  p_tags TEXT[] DEFAULT '{}',
  p_ai_summary TEXT DEFAULT NULL,
  p_toc JSONB DEFAULT NULL,
  p_title_author_embedding TEXT DEFAULT NULL
)
RETURNS TABLE(library_id UUID, was_cache_hit BOOLEAN, matched_similarity FLOAT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
DECLARE
  v_embedding halfvec(1536);
  v_best_id UUID;
  v_best_similarity FLOAT := 0;
  v_new_id UUID;
BEGIN
  -- Parse the embedding if provided
  IF p_title_author_embedding IS NOT NULL AND p_title_author_embedding <> '' THEN
    v_embedding := p_title_author_embedding::halfvec(1536);

    -- Find the best matching book_library entry by title+author embedding
    SELECT bl.id, 1 - (bl.title_author_embedding <=> v_embedding) AS sim
    INTO v_best_id, v_best_similarity
    FROM platform_intelligence.book_library bl
    WHERE bl.title_author_embedding IS NOT NULL
    ORDER BY bl.title_author_embedding <=> v_embedding
    LIMIT 1;
  END IF;

  -- Cache hit: similarity >= 0.9
  IF v_best_id IS NOT NULL AND v_best_similarity >= 0.9 THEN
    RETURN QUERY SELECT v_best_id, true, v_best_similarity;
    RETURN;
  END IF;

  -- Cache miss or uncertain (0.8-0.9): create a new entry
  INSERT INTO platform_intelligence.book_library (
    title, author, isbn, genres, tags, ai_summary, toc, title_author_embedding
  )
  VALUES (
    p_title, p_author, p_isbn, p_genres, p_tags, p_ai_summary, p_toc, v_embedding
  )
  RETURNING id INTO v_new_id;

  RETURN QUERY SELECT v_new_id, false, v_best_similarity;
END;
$$;

-- ============================================================
-- 2. set_bookshelf_item_library_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_bookshelf_item_library_id(
  p_item_id UUID,
  p_library_id UUID,
  p_extraction_status TEXT DEFAULT 'none',
  p_chunk_count INT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bookshelf_items
  SET
    book_library_id = p_library_id,
    extraction_status = p_extraction_status,
    chunk_count = CASE WHEN p_chunk_count > 0 THEN p_chunk_count ELSE chunk_count END
  WHERE id = p_item_id;
END;
$$;

-- ============================================================
-- 3. insert_book_chunks
--
-- p_chunks is a JSONB array of objects:
--   [{ "chunk_index": 0, "text": "...", "tokens_count": 750,
--      "chapter_title": "Ch 1", "chapter_index": 0 }, ...]
-- ============================================================
CREATE OR REPLACE FUNCTION public.insert_book_chunks(
  p_book_library_id UUID,
  p_chunks JSONB
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  INSERT INTO platform_intelligence.book_chunks (
    book_library_id, chunk_index, text, tokens_count,
    chapter_title, chapter_index
  )
  SELECT
    p_book_library_id,
    (elem->>'chunk_index')::INT,
    elem->>'text',
    (elem->>'tokens_count')::INT,
    elem->>'chapter_title',
    (elem->>'chapter_index')::INT
  FROM jsonb_array_elements(p_chunks) AS elem;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- 4. insert_book_extractions
--
-- p_extractions is a JSONB array of objects matching
-- the platform_intelligence.book_extractions schema.
-- ============================================================
CREATE OR REPLACE FUNCTION public.insert_book_extractions(
  p_book_library_id UUID,
  p_extractions JSONB,
  p_audience TEXT DEFAULT 'original'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, platform_intelligence
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  INSERT INTO platform_intelligence.book_extractions (
    book_library_id, extraction_type, text, guided_text, independent_text,
    content_type, declaration_text, style_variant, value_name, richness,
    section_title, section_index, sort_order, audience,
    is_key_point, is_from_go_deeper
  )
  SELECT
    p_book_library_id,
    elem->>'extraction_type',
    elem->>'text',
    NULLIF(elem->>'guided_text', 'null'),
    NULLIF(elem->>'independent_text', 'null'),
    elem->>'content_type',
    elem->>'declaration_text',
    elem->>'style_variant',
    elem->>'value_name',
    elem->>'richness',
    elem->>'section_title',
    (elem->>'section_index')::INT,
    COALESCE((elem->>'sort_order')::INT, 0),
    COALESCE(elem->>'audience', p_audience),
    COALESCE((elem->>'is_key_point')::BOOLEAN, false),
    COALESCE((elem->>'is_from_go_deeper')::BOOLEAN, false)
  FROM jsonb_array_elements(p_extractions) AS elem;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- Verification
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Phase 1b-B RPCs created: upsert_book_library, set_bookshelf_item_library_id, insert_book_chunks, insert_book_extractions';
END $$;
