-- ============================================================
-- BookShelf Bulk Assignment: By Tag
-- ============================================================
-- Grants a target family access to every book in the platform
-- library tagged with a specific tag. Creates lightweight
-- bookshelf_items pointer rows — no data copy, no AI cost.
--
-- Tags are matched against platform_intelligence.book_library.tags
-- (the canonical tag source). Any family's book that has been
-- extracted and linked to the library is eligible.
--
-- Usage (psql or Supabase SQL editor):
--   1. Set the parameters below
--   2. Run with DRY_RUN = true to preview
--   3. Flip DRY_RUN to false and re-run to execute
-- ============================================================

-- ── Parameters ──────────────────────────────────────────────
\set target_family_id    '''YOUR_TARGET_FAMILY_UUID'''
\set tag_name            '''parenting'''
\set assigning_member_id '''YOUR_MEMBER_UUID'''
\set DRY_RUN             true
-- ────────────────────────────────────────────────────────────

BEGIN;

-- Before count
SELECT count(*) AS before_count
FROM bookshelf_items
WHERE family_id = :target_family_id::uuid
  AND archived_at IS NULL;

-- Preview: books that would be assigned
SELECT
  bl.title,
  bl.author,
  bl.chunk_count,
  bl.extraction_status,
  bl.tags
FROM platform_intelligence.book_library bl
WHERE :tag_name::text = ANY(bl.tags)
  AND bl.extraction_status = 'completed'
  -- Skip if target family already has this book
  AND NOT EXISTS (
    SELECT 1 FROM bookshelf_items existing
    WHERE existing.family_id = :target_family_id::uuid
      AND existing.book_library_id = bl.id
      AND existing.archived_at IS NULL
  )
ORDER BY bl.title
LIMIT 10;

-- Total that would be assigned
SELECT count(*) AS books_to_assign
FROM platform_intelligence.book_library bl
WHERE :tag_name::text = ANY(bl.tags)
  AND bl.extraction_status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM bookshelf_items existing
    WHERE existing.family_id = :target_family_id::uuid
      AND existing.book_library_id = bl.id
      AND existing.archived_at IS NULL
  );

-- ── Conditional execution ───────────────────────────────────
DO $$
BEGIN
  IF :DRY_RUN THEN
    RAISE NOTICE 'DRY RUN — no rows inserted. Set DRY_RUN to false to execute.';
  ELSE
    INSERT INTO bookshelf_items (
      family_id,
      uploaded_by_member_id,
      title,
      author,
      book_library_id,
      extraction_status,
      processing_status,
      intake_completed,
      chunk_count,
      file_type,
      genres,
      tags
    )
    SELECT
      :target_family_id::uuid,
      :assigning_member_id::uuid,
      bl.title,
      bl.author,
      bl.id,
      'completed',
      'completed',
      true,
      bl.chunk_count,
      'pdf',
      bl.genres,
      bl.tags
    FROM platform_intelligence.book_library bl
    WHERE :tag_name::text = ANY(bl.tags)
      AND bl.extraction_status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM bookshelf_items existing
        WHERE existing.family_id = :target_family_id::uuid
          AND existing.book_library_id = bl.id
          AND existing.archived_at IS NULL
      );

    RAISE NOTICE 'Assignment complete. % rows inserted.',
      (SELECT count(*) FROM bookshelf_items
       WHERE family_id = :target_family_id::uuid
         AND uploaded_by_member_id = :assigning_member_id::uuid
         AND created_at > now() - interval '1 minute');
  END IF;
END $$;

-- After count
SELECT count(*) AS after_count
FROM bookshelf_items
WHERE family_id = :target_family_id::uuid
  AND archived_at IS NULL;

COMMIT;
