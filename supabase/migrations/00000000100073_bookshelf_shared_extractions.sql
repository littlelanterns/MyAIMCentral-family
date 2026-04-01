-- ============================================================================
-- BookShelf shared extractions: search family-wide, not per-member
-- ============================================================================
-- Extractions are shared across the family. All members can read and search
-- the same set of extractions. Hearts/notes will become a personal overlay
-- in a future migration. For now, they remain on the shared records.
-- ============================================================================

-- Update extraction search to filter by family_id only (not family_member_id)
CREATE OR REPLACE FUNCTION match_bookshelf_extractions(
  query_embedding halfvec(1536),
  p_family_id UUID,
  p_member_id UUID DEFAULT NULL,  -- kept for API compat but not used for filtering
  p_book_ids UUID[] DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  table_name TEXT,
  bookshelf_item_id UUID,
  book_title TEXT,
  content_type TEXT,
  item_text TEXT,
  section_title TEXT,
  section_index INT,
  is_hearted BOOLEAN,
  is_key_point BOOLEAN,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT s.id, 'bookshelf_summaries'::TEXT, s.bookshelf_item_id, bi.title,
      s.content_type, s.text, s.section_title, s.section_index, s.is_hearted, s.is_key_point,
      1 - (s.embedding <=> query_embedding)::FLOAT AS sim
    FROM bookshelf_summaries s
    JOIN bookshelf_items bi ON bi.id = s.bookshelf_item_id
    WHERE s.family_id = p_family_id
      AND s.is_deleted = false AND s.embedding IS NOT NULL
      AND (p_book_ids IS NULL OR s.bookshelf_item_id = ANY(p_book_ids))
      AND 1 - (s.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT i.id, 'bookshelf_insights'::TEXT, i.bookshelf_item_id, bi.title,
      i.content_type, i.text, i.section_title, i.section_index, i.is_hearted, i.is_key_point,
      1 - (i.embedding <=> query_embedding)::FLOAT AS sim
    FROM bookshelf_insights i
    JOIN bookshelf_items bi ON bi.id = i.bookshelf_item_id
    WHERE i.family_id = p_family_id
      AND i.is_deleted = false AND i.embedding IS NOT NULL
      AND (p_book_ids IS NULL OR i.bookshelf_item_id = ANY(p_book_ids))
      AND 1 - (i.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT d.id, 'bookshelf_declarations'::TEXT, d.bookshelf_item_id, bi.title,
      d.style_variant, d.declaration_text, d.section_title, d.section_index, d.is_hearted, d.is_key_point,
      1 - (d.embedding <=> query_embedding)::FLOAT AS sim
    FROM bookshelf_declarations d
    JOIN bookshelf_items bi ON bi.id = d.bookshelf_item_id
    WHERE d.family_id = p_family_id
      AND d.is_deleted = false AND d.embedding IS NOT NULL
      AND (p_book_ids IS NULL OR d.bookshelf_item_id = ANY(p_book_ids))
      AND 1 - (d.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT a.id, 'bookshelf_action_steps'::TEXT, a.bookshelf_item_id, bi.title,
      a.content_type, a.text, a.section_title, a.section_index, a.is_hearted, a.is_key_point,
      1 - (a.embedding <=> query_embedding)::FLOAT AS sim
    FROM bookshelf_action_steps a
    JOIN bookshelf_items bi ON bi.id = a.bookshelf_item_id
    WHERE a.family_id = p_family_id
      AND a.is_deleted = false AND a.embedding IS NOT NULL
      AND (p_book_ids IS NULL OR a.bookshelf_item_id = ANY(p_book_ids))
      AND 1 - (a.embedding <=> query_embedding) > match_threshold
  )
  UNION ALL
  (
    SELECT q.id, 'bookshelf_questions'::TEXT, q.bookshelf_item_id, bi.title,
      q.content_type, q.text, q.section_title, q.section_index, q.is_hearted, q.is_key_point,
      1 - (q.embedding <=> query_embedding)::FLOAT AS sim
    FROM bookshelf_questions q
    JOIN bookshelf_items bi ON bi.id = q.bookshelf_item_id
    WHERE q.family_id = p_family_id
      AND q.is_deleted = false AND q.embedding IS NOT NULL
      AND (p_book_ids IS NULL OR q.bookshelf_item_id = ANY(p_book_ids))
      AND 1 - (q.embedding <=> query_embedding) > match_threshold
  )
  ORDER BY sim DESC
  LIMIT match_count;
END;
$$;
