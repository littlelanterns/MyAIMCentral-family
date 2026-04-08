/**
 * Debug why the test-seeded task renders with "No icon" instead of an img.
 * Simulates what usePlayTaskIcons does for Ruthie's Play dashboard.
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function main() {
  const familyName = process.env.E2E_FAMILY_LOGIN_NAME
  const { data: family } = await sb.from('families').select('id').eq('family_login_name', familyName).single()
  console.log('family:', family.id)

  const { data: ruthie } = await sb
    .from('family_members')
    .select('id, display_name, dashboard_mode')
    .eq('family_id', family.id)
    .ilike('display_name', 'ruthie')
    .single()
  console.log('ruthie:', ruthie)

  // Query all active tasks assigned to Ruthie — same as useTasks does
  const { data: tasks } = await sb
    .from('tasks')
    .select('id, title, task_type, icon_asset_key, icon_variant, status')
    .eq('family_id', family.id)
    .eq('assignee_id', ruthie.id)
    .is('archived_at', null)

  console.log('\n=== Ruthie tasks ===')
  console.log('Total:', tasks.length)
  for (const t of tasks) {
    console.log('  ' + t.id.slice(0, 8) + '  "' + t.title + '"  type=' + t.task_type + '  status=' + t.status + '  icon=' + t.icon_asset_key + '/' + t.icon_variant)
  }

  // Simulate usePlayTaskIcons Path 1
  const tasksWithIcon = tasks.filter(t => t.icon_asset_key)
  console.log('\nTasks with icon_asset_key set:', tasksWithIcon.length)

  if (tasksWithIcon.length > 0) {
    const featureKeys = [...new Set(tasksWithIcon.map(t => t.icon_asset_key))]
    console.log('Unique feature_keys to lookup:', featureKeys)

    const { data: assetRows, error } = await sb
      .from('platform_assets')
      .select('feature_key, variant, size_128_url')
      .eq('category', 'visual_schedule')
      .in('feature_key', featureKeys)

    if (error) {
      console.log('Lookup ERROR:', error)
    } else {
      console.log('\nAsset lookup returned ' + assetRows.length + ' rows:')
      for (const row of assetRows) {
        console.log('  ' + row.feature_key + ' (' + row.variant + ') → ' + row.size_128_url)
      }

      // Now simulate the byKey map + per-task lookup
      const byKey = new Map()
      for (const row of assetRows) {
        byKey.set(row.feature_key + '::' + row.variant, row.size_128_url)
      }
      console.log('\nPer-task resolution:')
      for (const t of tasksWithIcon) {
        const variant = t.icon_variant ?? 'B'
        const key = t.icon_asset_key + '::' + variant
        const url = byKey.get(key)
        console.log('  ' + t.title + ' → key=' + key + ' → ' + (url || 'NULL'))
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })
