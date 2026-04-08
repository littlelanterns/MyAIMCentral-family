/**
 * Inserts the 45 G/H/I icon rows from ghi-icons.json directly into
 * platform_assets via the Supabase service role. Used to apply the
 * ingestion results to the live DB without running a migration.
 *
 * For a fresh dev environment, the parallel migration file (generated
 * by generate-ghi-icons-sql.cjs) is what populates these rows.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const IN_PATH = path.join(__dirname, 'build-m-seeds', 'ghi-icons.json')

async function main() {
  const rows = JSON.parse(fs.readFileSync(IN_PATH, 'utf8'))
  console.log('Loaded ' + rows.length + ' rows from ' + IN_PATH)

  // Supabase JS client expects pgvector as a string '[0.1,0.2,...]'
  // (Postgres auto-casts the text to halfvec(1536) via the column type).
  const toInsert = rows.map(r => ({
    feature_key: r.feature_key,
    variant: r.variant,
    category: r.category,
    size_512_url: r.size_512_url,
    size_128_url: r.size_128_url,
    size_32_url: r.size_32_url,
    description: r.description,
    generation_prompt: r.generation_prompt,
    tags: r.tags,
    vibe_compatibility: r.vibe_compatibility,
    display_name: r.display_name,
    assigned_to: r.assigned_to,
    status: r.status,
    embedding: '[' + r.embedding.map(n => n.toFixed(6)).join(',') + ']',
  }))

  // Insert in small batches to avoid payload size limits
  const BATCH = 10
  let inserted = 0
  const failures = []
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const slice = toInsert.slice(i, i + BATCH)
    const { error } = await sb.from('platform_assets').insert(slice)
    if (error) {
      console.error(
        'Batch ' + Math.floor(i / BATCH) + ' failed: ' + error.message,
      )
      // Retry per-row to isolate the bad ones
      for (const row of slice) {
        const { error: rowErr } = await sb.from('platform_assets').insert(row)
        if (rowErr) {
          failures.push({ feature_key: row.feature_key, error: rowErr.message })
        } else {
          inserted++
        }
      }
    } else {
      inserted += slice.length
      console.log(
        'Batch ' +
          Math.floor(i / BATCH) +
          ': inserted ' +
          slice.length +
          ' rows (total: ' +
          inserted +
          ')',
      )
    }
  }

  console.log('\n=== SUMMARY ===')
  console.log('Inserted: ' + inserted)
  console.log('Failed:   ' + failures.length)
  if (failures.length > 0) {
    for (const f of failures) {
      console.log('  - ' + f.feature_key + ': ' + f.error)
    }
    process.exit(1)
  }

  // Verify with a count
  const { count } = await sb
    .from('platform_assets')
    .select('id', { count: 'exact', head: true })
    .eq('category', 'visual_schedule')
  console.log('\nTotal visual_schedule rows after insert: ' + count)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
