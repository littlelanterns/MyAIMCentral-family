-- ============================================================
-- BookShelf Bulk Assignment: By Title List
-- ============================================================
-- Grants a target family access to specific books by title.
-- Uses a temp table to hold the list of titles to match against
-- platform_intelligence.book_library.
--
-- Creates lightweight bookshelf_items pointer rows — no data
-- copy, no AI cost.
--
-- Usage (psql or Supabase SQL editor):
--   1. Set the parameters below
--   2. Edit the title list in the temp table INSERT
--   3. Run with DRY_RUN = true to preview
--   4. Flip DRY_RUN to false and re-run to execute
-- ============================================================

-- ── Parameters ──────────────────────────────────────────────
\set target_family_id    '''YOUR_TARGET_FAMILY_UUID'''
\set assigning_member_id '''YOUR_MEMBER_UUID'''
\set DRY_RUN             true
-- ────────────────────────────────────────────────────────────

BEGIN;

-- Temp table for the title list
CREATE TEMP TABLE _titles_to_assign (title TEXT NOT NULL) ON COMMIT DROP;

-- ── Edit this list ──────────────────────────────────────────
-- Add one INSERT per title. Case-insensitive matching is used.
INSERT INTO _titles_to_assign (title) VALUES
  ('Atomic Habits'),
  ('The 7 Habits of Highly Effective People'),
  ('Mindset');
-- ────────────────────────────────────────────────────────────

-- Before count
SELECT count(*) AS before_count
FROM bookshelf_items
WHERE family_id = :target_family_id::uuid
  AND archived_at IS NULL;

-- Preview: books that would be assigned (case-insensitive title match)
SELECT
  bl.title,
  bl.author,
  bl.chunk_count,
  bl.extraction_status
FROM platform_intelligence.book_library bl
JOIN _titles_to_assign t ON lower(bl.title) = lower(t.title)
WHERE bl.extraction_status = 'completed'
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
JOIN _titles_to_assign t ON lower(bl.title) = lower(t.title)
WHERE bl.extraction_status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM bookshelf_items existing
    WHERE existing.family_id = :target_family_id::uuid
      AND existing.book_library_id = bl.id
      AND existing.archived_at IS NULL
  );

-- Titles NOT found in the library (typos / missing books)
SELECT t.title AS not_found_title
FROM _titles_to_assign t
WHERE NOT EXISTS (
  SELECT 1 FROM platform_intelligence.book_library bl
  WHERE lower(bl.title) = lower(t.title)
    AND bl.extraction_status = 'completed'
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
    JOIN _titles_to_assign t ON lower(bl.title) = lower(t.title)
    WHERE bl.extraction_status = 'completed'
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
