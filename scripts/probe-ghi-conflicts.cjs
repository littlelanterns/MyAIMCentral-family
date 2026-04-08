/**
 * Check which Grid G/H/I subject keys already exist in the DB,
 * so we know whether this ingestion is adding new rows or replacing.
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

async function main() {
  const dir = path.join(__dirname, '..', 'seed-assets', 'visual-schedule-icons-ghi')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'))
  console.log(files.length + ' files in ghi folder')

  // Parse filenames and build expected feature_keys (variant B)
  const subjects = files.map(f => {
    const m = f.match(/^vs_(.+)-(\d+)\.jpg$/)
    return m ? m[1] : null
  }).filter(Boolean)

  const expectedKeys = subjects.map(s => 'vs_' + s + '_B')
  console.log('\nExpected feature_keys (variant B):')
  console.log(expectedKeys.sort().join('\n'))

  // Check which already exist
  const { data: existing } = await sb
    .from('platform_assets')
    .select('feature_key, variant, display_name')
    .eq('category', 'visual_schedule')
    .in('feature_key', expectedKeys)

  console.log('\n=== Already in DB ===')
  console.log((existing || []).length + ' of ' + expectedKeys.length + ' already exist')
  for (const row of existing || []) {
    console.log('  ' + row.feature_key + ' (' + row.variant + ') "' + row.display_name + '"')
  }

  const existingKeys = new Set((existing || []).map(r => r.feature_key))
  const newKeys = expectedKeys.filter(k => !existingKeys.has(k))
  console.log('\n=== NEW to ingest ===')
  console.log(newKeys.length + ' new keys')
  for (const k of newKeys) console.log('  ' + k)
}

main().catch(e => { console.error(e); process.exit(1) })
