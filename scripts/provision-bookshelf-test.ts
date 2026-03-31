/**
 * Provision BookShelf test data — creates bookshelf_items from book_cache for your family.
 *
 * Usage:
 *   npx tsx scripts/provision-bookshelf-test.ts          # Provision books
 *   npx tsx scripts/provision-bookshelf-test.ts --cleanup # Remove provisioned books
 *   npx tsx scripts/provision-bookshelf-test.ts --count   # Just count what exists
 *
 * NOT a migration — this is a reversible dev/test tool.
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.VITE_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const supabasePi = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'platform_intelligence' },
})

const mode = process.argv[2] // --cleanup, --count, or undefined (provision)

async function main() {
  // Find the first family (primary parent's family)
  const { data: families, error: famErr } = await supabase
    .from('families')
    .select('id, family_name, primary_parent_id')
    .limit(1)
    .single()

  if (famErr || !families) {
    console.error('Could not find a family:', famErr?.message)
    process.exit(1)
  }

  const familyId = families.id
  const memberId = families.primary_parent_id

  // Find the actual family_member for the primary parent
  const { data: member } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .single()

  const memberRecordId = member?.id
  if (!memberRecordId) {
    console.error('Could not find primary_parent family_member record')
    process.exit(1)
  }

  console.log(`Family: ${families.family_name} (${familyId})`)
  console.log(`Member: ${memberRecordId}`)

  // Count existing
  const { count: existingCount } = await supabase
    .from('bookshelf_items')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId)

  console.log(`Existing bookshelf_items for this family: ${existingCount ?? 0}`)

  if (mode === '--count') {
    const { count: cacheCount } = await supabasePi
      .from('book_cache')
      .select('*', { count: 'exact', head: true })
    console.log(`Books in platform_intelligence.book_cache: ${cacheCount ?? 0}`)
    return
  }

  if (mode === '--cleanup') {
    console.log('Cleaning up provisioned bookshelf_items...')
    const { error, count } = await supabase
      .from('bookshelf_items')
      .delete({ count: 'exact' })
      .eq('family_id', familyId)
    if (error) {
      console.error('Cleanup failed:', error.message)
      process.exit(1)
    }
    console.log(`Deleted ${count ?? 0} bookshelf_items. Clean.`)
    return
  }

  // Provision: fetch all book_cache entries
  const { data: books, error: booksErr } = await supabasePi
    .from('book_cache')
    .select('id, title, author, isbn, genres, tags, ai_summary, toc, chunk_count')

  if (booksErr || !books) {
    console.error('Could not fetch book_cache:', booksErr?.message)
    process.exit(1)
  }

  console.log(`Found ${books.length} books in book_cache. Provisioning...`)

  // Skip books that already have a bookshelf_item
  const { data: existingLinks } = await supabase
    .from('bookshelf_items')
    .select('book_cache_id')
    .eq('family_id', familyId)
    .not('book_cache_id', 'is', null)

  const existingCacheIds = new Set((existingLinks ?? []).map(r => r.book_cache_id))
  const newBooks = books.filter(b => !existingCacheIds.has(b.id))

  if (newBooks.length === 0) {
    console.log('All books already provisioned. Nothing to do.')
    return
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50
  let inserted = 0

  for (let i = 0; i < newBooks.length; i += BATCH_SIZE) {
    const batch = newBooks.slice(i, i + BATCH_SIZE)
    const rows = batch.map(book => ({
      family_id: familyId,
      uploaded_by_member_id: memberRecordId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      file_type: 'pdf' as const,
      genres: book.genres ?? [],
      tags: book.tags ?? [],
      ai_summary: book.ai_summary,
      toc: book.toc,
      chunk_count: book.chunk_count ?? 0,
      book_cache_id: book.id,
      processing_status: 'completed',
      extraction_status: 'completed',
      intake_completed: true,
    }))

    const { error: insertErr } = await supabase
      .from('bookshelf_items')
      .insert(rows)

    if (insertErr) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, insertErr.message)
      // Continue with next batch
    } else {
      inserted += batch.length
      process.stdout.write(`  ${inserted}/${newBooks.length}\r`)
    }
  }

  console.log(`\nProvisioned ${inserted} bookshelf_items. Reload /bookshelf to see them.`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
