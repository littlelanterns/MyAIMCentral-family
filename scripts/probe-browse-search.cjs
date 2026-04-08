/**
 * Diagnose what the current search misses vs what a broader search would find.
 * Probes several test queries against display_name, description, tags, and embeddings.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function main() {
  console.log('=== Probe: what does "scripture" currently match? ===\n')

  // 1. ILIKE on display_name
  const { data: dnMatches } = await sb
    .from('platform_assets')
    .select('feature_key, variant, display_name, description, tags')
    .eq('category', 'visual_schedule')
    .eq('variant', 'B')
    .ilike('display_name', '%scripture%')
  console.log('display_name ILIKE "%scripture%": ' + (dnMatches?.length ?? 0) + ' rows')
  for (const r of dnMatches || []) {
    console.log('  ' + r.feature_key + ' — "' + r.display_name + '"  tags=' + JSON.stringify(r.tags))
  }

  // 2. ILIKE on description
  const { data: descMatches } = await sb
    .from('platform_assets')
    .select('feature_key, variant, display_name, description')
    .eq('category', 'visual_schedule')
    .eq('variant', 'B')
    .ilike('description', '%scripture%')
  console.log('\ndescription ILIKE "%scripture%": ' + (descMatches?.length ?? 0) + ' rows')
  for (const r of descMatches || []) {
    console.log('  ' + r.feature_key + ' — "' + r.display_name + '"')
  }

  // 3. JSONB tag contains "scripture"
  const { data: tagMatches } = await sb
    .from('platform_assets')
    .select('feature_key, variant, display_name, tags')
    .eq('category', 'visual_schedule')
    .eq('variant', 'B')
    .filter('tags', 'cs', JSON.stringify(['scripture']))
  console.log('\ntags contains "scripture": ' + (tagMatches?.length ?? 0) + ' rows')
  for (const r of tagMatches || []) {
    console.log('  ' + r.feature_key + ' — "' + r.display_name + '"')
  }

  console.log('\n=== Probe: what does "read" / "reading" / "book" match? ===\n')

  // display_name / description ILIKE for read
  for (const term of ['read', 'reading', 'book']) {
    const { data: m } = await sb
      .from('platform_assets')
      .select('feature_key, variant, display_name, tags')
      .eq('category', 'visual_schedule')
      .eq('variant', 'B')
      .or('display_name.ilike.%' + term + '%,description.ilike.%' + term + '%')
    console.log('display_name/description ILIKE "%' + term + '%": ' + (m?.length ?? 0) + ' rows')
    for (const r of (m || []).slice(0, 10)) {
      console.log('  ' + r.feature_key + ' — "' + r.display_name + '"  tags=' + JSON.stringify(r.tags))
    }
    console.log('')
  }

  // And tags contains book
  const { data: bookTag } = await sb
    .from('platform_assets')
    .select('feature_key, display_name')
    .eq('category', 'visual_schedule')
    .eq('variant', 'B')
    .filter('tags', 'cs', JSON.stringify(['book']))
  console.log('tags contains "book": ' + (bookTag?.length ?? 0) + ' rows')

  console.log('\n=== Total variant-B rows ===')
  const { count } = await sb
    .from('platform_assets')
    .select('id', { count: 'exact', head: true })
    .eq('category', 'visual_schedule')
    .eq('variant', 'B')
  console.log(count + ' total variant-B visual_schedule rows available to browse')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
