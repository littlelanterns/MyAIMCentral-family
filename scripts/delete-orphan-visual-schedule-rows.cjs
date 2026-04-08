/**
 * Deletes visual_schedule rows from platform_assets whose image file does
 * not exist in Supabase Storage (29 orphan rows from Sub-phase A seed data).
 *
 * Safety check before deletion: no tasks.icon_asset_key references any of
 * the orphan feature_keys. If any exist, aborts with an error.
 *
 * Also deletes the matching lines from the migration seed block in
 * 00000000100115_play_dashboard_sticker_book.sql so a fresh environment
 * rebuild produces a clean dataset.
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

// The 29 orphan feature_keys (verified HTTP 400 via HEAD request)
const ORPHAN_KEYS = [
  'vs_bath_object_C',
  'vs_bath_lotion_A',
  'vs_bath_object_B',
  'vs_dress_button_A',
  'vs_dress_button_C',
  'vs_dress_button_B',
  'vs_dress_done_C',
  'vs_dress_check_A',
  'vs_dress_done_A',
  'vs_dress_done_B',
  'vs_dress_jacket_D',
  'vs_face_dry_A',
  'vs_face_scrub_A',
  'vs_face_scrub_C',
  'vs_face_scrub_B',
  'vs_hair_blonde_C',
  'vs_hair_comb_A',
  'vs_laundry_basket2_A',
  'vs_laundry_putaway_B',
  'vs_laundry_putaway_A',
  'vs_laundry_putaway_C',
  'vs_tidy_bed_B',
  'vs_tidy_box_A',
  'vs_tidy_hang_B',
  'vs_tidy_toys_C',
  'vs_tidy_toys_B',
  'vs_tidy_wardrobe_A',
  'vs_tidy_hang_A',
  'vs_tidy_pickup_B',
]

async function main() {
  // Safety check — any tasks pointing at these keys?
  const { data: referencedTasks, error: refErr } = await sb
    .from('tasks')
    .select('id, title, icon_asset_key')
    .in('icon_asset_key', ORPHAN_KEYS)
  if (refErr) throw refErr
  if (referencedTasks && referencedTasks.length > 0) {
    console.log(
      'ABORT: ' +
        referencedTasks.length +
        ' tasks reference orphan icon_asset_keys:',
    )
    for (const t of referencedTasks) {
      console.log('  ' + t.id + ' "' + t.title + '" → ' + t.icon_asset_key)
    }
    console.log(
      '\nNot deleting. Either reassign those tasks or delete them first.',
    )
    return
  }
  console.log('Safety check passed: no tasks reference orphan keys.')

  // Delete rows from platform_assets
  const { data: beforeRows } = await sb
    .from('platform_assets')
    .select('id, feature_key, variant')
    .in('feature_key', ORPHAN_KEYS)
  console.log('\nFound ' + (beforeRows?.length ?? 0) + ' rows to delete')

  const { error: deleteErr, count } = await sb
    .from('platform_assets')
    .delete({ count: 'exact' })
    .in('feature_key', ORPHAN_KEYS)
  if (deleteErr) throw deleteErr
  console.log('Deleted ' + (count ?? 0) + ' rows from platform_assets.')

  // Remove the matching INSERT VALUES lines from the migration file
  const migrationPath = path.resolve(
    __dirname,
    '..',
    'supabase',
    'migrations',
    '00000000100115_play_dashboard_sticker_book.sql',
  )
  const src = fs.readFileSync(migrationPath, 'utf-8')
  const lines = src.split(/\r?\n/)
  const kept = []
  let removed = 0
  for (const line of lines) {
    const matchOrphan = ORPHAN_KEYS.some(key =>
      line.includes("'" + key + "'"),
    )
    if (matchOrphan && line.trim().startsWith("('")) {
      removed++
      continue
    }
    kept.push(line)
  }
  if (removed > 0) {
    fs.writeFileSync(migrationPath, kept.join('\n'), 'utf-8')
    console.log(
      'Removed ' + removed + ' orphan INSERT lines from migration file.',
    )
  } else {
    console.log('No orphan lines found in migration file.')
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
