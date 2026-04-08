/**
 * Shows which variant letters are taken for the 3 collision subjects
 * (hiking, soccer, swimming) so we know which letter to use for the
 * Grid I re-ingestion.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const SUBJECTS = ['hiking', 'soccer', 'swimming']

async function main() {
  for (const subject of SUBJECTS) {
    const prefix = 'vs_' + subject + '_'
    const { data } = await sb
      .from('platform_assets')
      .select('feature_key, variant, display_name')
      .eq('category', 'visual_schedule')
      .ilike('feature_key', prefix + '%')
      .order('variant')

    console.log('\n' + subject + ':')
    if (!data || data.length === 0) {
      console.log('  (no existing rows)')
    } else {
      for (const row of data) {
        console.log('  ' + row.feature_key + ' (' + row.variant + ') "' + row.display_name + '"')
      }
    }
    const takenVariants = new Set((data || []).map(r => r.variant))
    const available = ['A', 'B', 'C', 'D'].filter(v => !takenVariants.has(v))
    console.log('  → available variant slots: ' + available.join(', '))
  }
}

main().catch(e => { console.error(e); process.exit(1) })
