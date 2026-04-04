-- ============================================================
-- BookShelf Platform Library — Data Migration (batched)
--
-- Migrates chunks and extractions in batches to avoid
-- Supabase statement timeout (60s default).
-- ============================================================

-- Increase statement timeout for this migration
SET statement_timeout = '600s';

-- ============================================================
-- 1. Chunks migration (58K rows, batched by book)
-- ============================================================
DO $$
DECLARE
  v_book RECORD;
  v_total INT := 0;
  v_batch INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM platform_intelligence.book_chunks LIMIT 1) THEN

    FOR v_book IN
      SELECT DISTINCT bi.book_library_id
      FROM bookshelf_items bi
      WHERE bi.book_library_id IS NOT NULL
    LOOP
      INSERT INTO platform_intelligence.book_chunks
        (book_library_id, chunk_index, chapter_index, chapter_title, text, embedding, tokens_count, created_at)
      SELECT
        bi.book_library_id,
        CASE
          WHEN bi.parent_bookshelf_item_id IS NOT NULL
          THEN (COALESCE(bi.part_number, 0) * 100000) + bc.chunk_index
          ELSE bc.chunk_index
        END,
        bc.chapter_index,
        bc.chapter_title,
        bc.chunk_text,
        bc.embedding,
        COALESCE(bc.token_count, 0),
        bc.created_at
      FROM bookshelf_chunks bc
      JOIN bookshelf_items bi ON bi.book_cache_id = bc.book_cache_id
      WHERE bi.book_library_id = v_book.book_library_id;

      GET DIAGNOSTICS v_batch = ROW_COUNT;
      v_total := v_total + v_batch;
    END LOOP;

    RAISE NOTICE 'Migrated % chunks to platform_intelligence.book_chunks', v_total;
  ELSE
    RAISE NOTICE 'book_chunks already populated — skipping';
  END IF;
END $$;

-- ============================================================
-- 2. Extractions migration (88K rows, batched by table then book)
-- ============================================================
DO $$
DECLARE
  v_book RECORD;
  v_total INT := 0;
  v_batch INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM platform_intelligence.book_extractions LIMIT 1) THEN

    -- Summaries (~21K)
    FOR v_book IN
      SELECT DISTINCT bi.book_library_id
      FROM bookshelf_items bi
      JOIN bookshelf_summaries s ON s.bookshelf_item_id = bi.id
      WHERE bi.book_library_id IS NOT NULL
    LOOP
      INSERT INTO platform_intelligence.book_extractions
        (book_library_id, extraction_type, text, content_type,
         section_title, section_index, sort_order, audience,
         is_key_point, is_from_go_deeper, is_deleted, created_at)
      SELECT
        bi.book_library_id, 'summary', s.text, s.content_type,
        s.section_title, s.section_index, s.sort_order, s.audience,
        s.is_key_point, s.is_from_go_deeper, s.is_deleted, s.created_at
      FROM bookshelf_summaries s
      JOIN bookshelf_items bi ON bi.id = s.bookshelf_item_id
      WHERE bi.book_library_id = v_book.book_library_id;

      GET DIAGNOSTICS v_batch = ROW_COUNT;
      v_total := v_total + v_batch;
    END LOOP;
    RAISE NOTICE 'Summaries: % rows', v_total;

    -- Insights (~24K)
    v_total := 0;
    FOR v_book IN
      SELECT DISTINCT bi.book_library_id
      FROM bookshelf_items bi
      JOIN bookshelf_insights i ON i.bookshelf_item_id = bi.id
      WHERE bi.book_library_id IS NOT NULL
    LOOP
      INSERT INTO platform_intelligence.book_extractions
        (book_library_id, extraction_type, text, content_type,
         section_title, section_index, sort_order, audience,
         is_key_point, is_from_go_deeper, is_deleted, created_at)
      SELECT
        bi.book_library_id, 'insight', i.text, i.content_type,
        i.section_title, i.section_index, i.sort_order, i.audience,
        i.is_key_point, i.is_from_go_deeper, i.is_deleted, i.created_at
      FROM bookshelf_insights i
      JOIN bookshelf_items bi ON bi.id = i.bookshelf_item_id
      WHERE bi.book_library_id = v_book.book_library_id;

      GET DIAGNOSTICS v_batch = ROW_COUNT;
      v_total := v_total + v_batch;
    END LOOP;
    RAISE NOTICE 'Insights: % rows', v_total;

    -- Declarations (~17K)
    v_total := 0;
    FOR v_book IN
      SELECT DISTINCT bi.book_library_id
      FROM bookshelf_items bi
      JOIN bookshelf_declarations d ON d.bookshelf_item_id = bi.id
      WHERE bi.book_library_id IS NOT NULL
    LOOP
      INSERT INTO platform_intelligence.book_extractions
        (book_library_id, extraction_type, text, declaration_text,
         style_variant, value_name, richness,
         section_title, section_index, sort_order, audience,
         is_key_point, is_from_go_deeper, is_deleted, created_at)
      SELECT
        bi.book_library_id, 'declaration', d.declaration_text, d.declaration_text,
        d.style_variant, d.value_name, d.richness,
        d.section_title, d.section_index, d.sort_order, d.audience,
        d.is_key_point, d.is_from_go_deeper, d.is_deleted, d.created_at
      FROM bookshelf_declarations d
      JOIN bookshelf_items bi ON bi.id = d.bookshelf_item_id
      WHERE bi.book_library_id = v_book.book_library_id;

      GET DIAGNOSTICS v_batch = ROW_COUNT;
      v_total := v_total + v_batch;
    END LOOP;
    RAISE NOTICE 'Declarations: % rows', v_total;

    -- Action Steps (~16K)
    v_total := 0;
    FOR v_book IN
      SELECT DISTINCT bi.book_library_id
      FROM bookshelf_items bi
      JOIN bookshelf_action_steps a ON a.bookshelf_item_id = bi.id
      WHERE bi.book_library_id IS NOT NULL
    LOOP
      INSERT INTO platform_intelligence.book_extractions
        (book_library_id, extraction_type, text, content_type,
         section_title, section_index, sort_order, audience,
         is_key_point, is_from_go_deeper, is_deleted, created_at)
      SELECT
        bi.book_library_id, 'action_step', a.text, a.content_type,
        a.section_title, a.section_index, a.sort_order, a.audience,
        a.is_key_point, a.is_from_go_deeper, a.is_deleted, a.created_at
      FROM bookshelf_action_steps a
      JOIN bookshelf_items bi ON bi.id = a.bookshelf_item_id
      WHERE bi.book_library_id = v_book.book_library_id;

      GET DIAGNOSTICS v_batch = ROW_COUNT;
      v_total := v_total + v_batch;
    END LOOP;
    RAISE NOTICE 'Action Steps: % rows', v_total;

    -- Questions (~10K)
    v_total := 0;
    FOR v_book IN
      SELECT DISTINCT bi.book_library_id
      FROM bookshelf_items bi
      JOIN bookshelf_questions q ON q.bookshelf_item_id = bi.id
      WHERE bi.book_library_id IS NOT NULL
    LOOP
      INSERT INTO platform_intelligence.book_extractions
        (book_library_id, extraction_type, text, content_type,
         section_title, section_index, sort_order, audience,
         is_key_point, is_from_go_deeper, is_deleted, created_at)
      SELECT
        bi.book_library_id, 'question', q.text, q.content_type,
        q.section_title, q.section_index, q.sort_order, q.audience,
        q.is_key_point, q.is_from_go_deeper, q.is_deleted, q.created_at
      FROM bookshelf_questions q
      JOIN bookshelf_items bi ON bi.id = q.bookshelf_item_id
      WHERE bi.book_library_id = v_book.book_library_id;

      GET DIAGNOSTICS v_batch = ROW_COUNT;
      v_total := v_total + v_batch;
    END LOOP;
    RAISE NOTICE 'Questions: % rows', v_total;

  ELSE
    RAISE NOTICE 'book_extractions already populated — skipping';
  END IF;
END $$;

-- ============================================================
-- 3. Personal state migration (13 hearted items)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bookshelf_user_state LIMIT 1) THEN

    -- Hearted summaries
    INSERT INTO bookshelf_user_state
      (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai)
    SELECT DISTINCT ON (s.id)
      s.family_id, s.family_member_id, be.id, s.is_hearted, s.user_note, s.is_included_in_ai
    FROM bookshelf_summaries s
    JOIN bookshelf_items bi ON bi.id = s.bookshelf_item_id
    JOIN platform_intelligence.book_extractions be
      ON be.book_library_id = bi.book_library_id
      AND be.extraction_type = 'summary'
      AND be.text = s.text
      AND COALESCE(be.section_title, '') = COALESCE(s.section_title, '')
    WHERE s.is_hearted = true OR s.user_note IS NOT NULL;

    -- Hearted insights
    INSERT INTO bookshelf_user_state
      (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai)
    SELECT DISTINCT ON (i.id)
      i.family_id, i.family_member_id, be.id, i.is_hearted, i.user_note, i.is_included_in_ai
    FROM bookshelf_insights i
    JOIN bookshelf_items bi ON bi.id = i.bookshelf_item_id
    JOIN platform_intelligence.book_extractions be
      ON be.book_library_id = bi.book_library_id
      AND be.extraction_type = 'insight'
      AND be.text = i.text
      AND COALESCE(be.section_title, '') = COALESCE(i.section_title, '')
    WHERE i.is_hearted = true OR i.user_note IS NOT NULL;

    -- Hearted declarations
    INSERT INTO bookshelf_user_state
      (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai,
       sent_to_guiding_stars, guiding_star_id)
    SELECT DISTINCT ON (d.id)
      d.family_id, d.family_member_id, be.id, d.is_hearted, d.user_note, d.is_included_in_ai,
      d.sent_to_guiding_stars, d.guiding_star_id
    FROM bookshelf_declarations d
    JOIN bookshelf_items bi ON bi.id = d.bookshelf_item_id
    JOIN platform_intelligence.book_extractions be
      ON be.book_library_id = bi.book_library_id
      AND be.extraction_type = 'declaration'
      AND be.declaration_text = d.declaration_text
      AND COALESCE(be.section_title, '') = COALESCE(d.section_title, '')
    WHERE d.is_hearted = true OR d.user_note IS NOT NULL;

    -- Action steps (0 expected)
    INSERT INTO bookshelf_user_state
      (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai,
       sent_to_tasks, task_id)
    SELECT DISTINCT ON (a.id)
      a.family_id, a.family_member_id, be.id, a.is_hearted, a.user_note, a.is_included_in_ai,
      a.sent_to_tasks, a.task_id
    FROM bookshelf_action_steps a
    JOIN bookshelf_items bi ON bi.id = a.bookshelf_item_id
    JOIN platform_intelligence.book_extractions be
      ON be.book_library_id = bi.book_library_id
      AND be.extraction_type = 'action_step'
      AND be.text = a.text
      AND COALESCE(be.section_title, '') = COALESCE(a.section_title, '')
    WHERE a.is_hearted = true OR a.user_note IS NOT NULL;

    -- Questions (0 expected)
    INSERT INTO bookshelf_user_state
      (family_id, member_id, extraction_id, is_hearted, user_note, is_included_in_ai,
       sent_to_prompts, journal_prompt_id, sent_to_tasks, task_id)
    SELECT DISTINCT ON (q.id)
      q.family_id, q.family_member_id, be.id, q.is_hearted, q.user_note, q.is_included_in_ai,
      q.sent_to_prompts, q.journal_prompt_id, q.sent_to_tasks, q.task_id
    FROM bookshelf_questions q
    JOIN bookshelf_items bi ON bi.id = q.bookshelf_item_id
    JOIN platform_intelligence.book_extractions be
      ON be.book_library_id = bi.book_library_id
      AND be.extraction_type = 'question'
      AND be.text = q.text
      AND COALESCE(be.section_title, '') = COALESCE(q.section_title, '')
    WHERE q.is_hearted = true OR q.user_note IS NOT NULL;

    RAISE NOTICE 'Migrated % user state rows', (SELECT count(*) FROM bookshelf_user_state);
  ELSE
    RAISE NOTICE 'bookshelf_user_state already populated — skipping';
  END IF;
END $$;

-- ============================================================
-- 4. Update book_library extraction_status + extraction_count
-- ============================================================
UPDATE platform_intelligence.book_library bl
SET
  extraction_status = 'completed',
  extraction_count = sub.cnt
FROM (
  SELECT book_library_id, count(*) AS cnt
  FROM platform_intelligence.book_extractions
  WHERE is_deleted = false
  GROUP BY book_library_id
) sub
WHERE bl.id = sub.book_library_id
  AND bl.extraction_status = 'none';

-- Reset statement timeout
RESET statement_timeout;
