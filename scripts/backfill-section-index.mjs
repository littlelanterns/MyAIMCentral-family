// Per-book backfill of section_index on platform_intelligence.book_extractions.
// Runs one UPDATE per book_library_id so each call gets its own 5-min budget
// and HNSW index maintenance cost is bounded per iteration.

import { execSync } from 'node:child_process'
import fs from 'node:fs'

const LOG_PATH = 'C:/tmp/backfill-section-index.log'
fs.writeFileSync(LOG_PATH, `--- Backfill run started ${new Date().toISOString()} ---\n`)

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  fs.appendFileSync(LOG_PATH, line + '\n')
}

function runQuery(sql) {
  const out = execSync(
    `npx supabase db query --linked "${sql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 },
  )
  return JSON.parse(out.match(/\{[\s\S]*\}/)?.[0] || '{}')
}

// 1. Get distinct books needing backfill
log('Fetching distinct book_library_ids with NULL rows...')
const booksRes = runQuery(`
  SELECT DISTINCT bl.id AS book_library_id, bl.title
  FROM platform_intelligence.book_library bl
  WHERE EXISTS (
    SELECT 1 FROM platform_intelligence.book_extractions be
    WHERE be.book_library_id = bl.id
      AND be.section_index IS NULL
      AND be.audience = 'original'
      AND be.is_deleted = false
      AND be.section_title IS NOT NULL
  )
  ORDER BY bl.title
`)
const books = booksRes.rows || []
log(`Found ${books.length} books with NULL rows to backfill`)

let totalP1 = 0
let totalP2 = 0
let errors = []

for (let i = 0; i < books.length; i++) {
  const book = books[i]
  const libId = book.book_library_id
  const title = (book.title || '(untitled)').slice(0, 50)
  const t0 = Date.now()

  try {
    // Pass 1: book-wide unique match
    const p1 = runQuery(`
      WITH canonical AS (
        SELECT section_title, MIN(section_index) AS canonical_idx
        FROM platform_intelligence.book_extractions
        WHERE book_library_id = '${libId}'
          AND section_index IS NOT NULL
          AND section_title IS NOT NULL
          AND audience = 'original'
          AND is_deleted = false
        GROUP BY section_title
        HAVING COUNT(DISTINCT section_index) = 1
      )
      UPDATE platform_intelligence.book_extractions be
      SET section_index = canonical.canonical_idx
      FROM canonical
      WHERE be.book_library_id = '${libId}'
        AND be.section_index IS NULL
        AND be.audience = 'original'
        AND be.is_deleted = false
        AND be.section_title = canonical.section_title
      RETURNING 1
    `)
    const p1Rows = (p1.rows || []).length

    // Pass 2: per-part unique match (for remaining NULL rows)
    const p2 = runQuery(`
      WITH canonical AS (
        SELECT section_title, source_part_number, MIN(section_index) AS canonical_idx
        FROM platform_intelligence.book_extractions
        WHERE book_library_id = '${libId}'
          AND section_index IS NOT NULL
          AND section_title IS NOT NULL
          AND audience = 'original'
          AND is_deleted = false
        GROUP BY section_title, source_part_number
        HAVING COUNT(DISTINCT section_index) = 1
      )
      UPDATE platform_intelligence.book_extractions be
      SET section_index = canonical.canonical_idx
      FROM canonical
      WHERE be.book_library_id = '${libId}'
        AND be.section_index IS NULL
        AND be.audience = 'original'
        AND be.is_deleted = false
        AND be.section_title = canonical.section_title
        AND be.source_part_number = canonical.source_part_number
      RETURNING 1
    `)
    const p2Rows = (p2.rows || []).length

    totalP1 += p1Rows
    totalP2 += p2Rows
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    log(`[${i + 1}/${books.length}] ${title} — P1:${p1Rows} P2:${p2Rows} (${elapsed}s)`)
  } catch (e) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    log(`[${i + 1}/${books.length}] ${title} — ERROR (${elapsed}s): ${e.message.slice(0, 200)}`)
    errors.push({ libId, title, err: e.message.slice(0, 200) })
  }
}

log(`\n--- Backfill complete ---`)
log(`TOTAL Pass 1 backfilled: ${totalP1}`)
log(`TOTAL Pass 2 backfilled: ${totalP2}`)
log(`TOTAL rows updated:      ${totalP1 + totalP2}`)
log(`Errors: ${errors.length}`)
if (errors.length) log(JSON.stringify(errors, null, 2))

// Final verification
const finalCount = runQuery(`
  SELECT count(*) AS still_null
  FROM platform_intelligence.book_extractions
  WHERE section_index IS NULL
    AND audience = 'original'
    AND is_deleted = false
    AND section_title IS NOT NULL
`)
log(`Final NULL count: ${finalCount.rows?.[0]?.still_null ?? '?'}`)
