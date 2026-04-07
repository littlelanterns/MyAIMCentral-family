/**
 * Creates ONE persistent sequential collection directly via the REST API,
 * using the EXACT same INSERT shape as useCreateSequentialCollection.
 * This gives the founder a row they can inspect in Supabase Studio after
 * the E2E test cleanup wipes the test-created rows.
 *
 * Run: node scripts/create-verification-sequential.cjs
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { createClient } = require('@supabase/supabase-js')
const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const sb = createClient(url, key)

async function main() {
  // Find mom's family (pick any primary_parent for a verification row)
  const { data: mom } = await sb
    .from('family_members')
    .select('id, family_id, display_name')
    .eq('role', 'primary_parent')
    .eq('is_active', true)
    .limit(1)
    .single()
  if (!mom) {
    console.error('No primary_parent found')
    process.exit(1)
  }
  const { data: child } = await sb
    .from('family_members')
    .select('id, display_name')
    .eq('family_id', mom.family_id)
    .eq('role', 'member')
    .eq('is_active', true)
    .limit(1)
    .single()
  const assigneeId = child?.id ?? mom.id
  console.log(`Using family: ${mom.display_name}'s family (${mom.family_id})`)
  console.log(`Assignee: ${child?.display_name ?? mom.display_name} (${assigneeId})`)

  const title = `Build H verification — ${new Date().toISOString().slice(0, 19)}`
  const itemTitles = [
    'Verification item 1 (was broken before 2026-04-06)',
    'Verification item 2',
    'Verification item 3',
  ]

  // Step 1: INSERT into sequential_collections — mirror useCreateSequentialCollection
  const { data: newCollection, error: collErr } = await sb
    .from('sequential_collections')
    .insert({
      family_id: mom.family_id,
      template_id: null,
      title,
      current_index: 0,
      task_ids: [],
      total_items: itemTitles.length,
      active_count: 1,
      promotion_timing: 'immediate',
      life_area_tag: null,
      reward_per_item_type: null,
      reward_per_item_amount: null,
    })
    .select()
    .single()
  if (collErr) {
    console.error('Collection insert failed:', collErr)
    process.exit(1)
  }
  const col = newCollection

  // Step 2: INSERT child tasks
  const taskInserts = itemTitles.map((title, index) => ({
    family_id: col.family_id,
    created_by: mom.id,
    assignee_id: assigneeId,
    title,
    description: null,
    task_type: 'sequential',
    status: 'pending',
    source: 'template_deployed',
    source_reference_id: col.id,
    sequential_collection_id: col.id,
    sequential_position: index,
    sequential_is_active: index < col.active_count,
    life_area_tag: null,
    focus_time_seconds: 0,
    sort_order: index,
    big_rock: false,
    is_shared: false,
    incomplete_action: 'fresh_reset',
    require_approval: false,
    victory_flagged: false,
    time_tracking_enabled: false,
    kanban_status: 'to_do',
    image_url: null,
  }))
  const { data: tasks, error: taskErr } = await sb
    .from('tasks')
    .insert(taskInserts)
    .select('id, title, sequential_position, sequential_is_active')
  if (taskErr) {
    console.error('Task insert failed:', taskErr)
    // Best-effort cleanup
    await sb.from('sequential_collections').delete().eq('id', col.id)
    process.exit(1)
  }

  // Step 3: Update task_ids on the collection
  await sb
    .from('sequential_collections')
    .update({ task_ids: tasks.map(t => t.id) })
    .eq('id', col.id)

  console.log('\n✅ Sequential collection created successfully')
  console.log(`   id: ${col.id}`)
  console.log(`   title: ${col.title}`)
  console.log(`   total_items: ${col.total_items}`)
  console.log(`   active_count: ${col.active_count}`)
  console.log('   child tasks:')
  for (const t of tasks) {
    console.log(`     • [${t.sequential_position}] ${t.title}${t.sequential_is_active ? ' (active)' : ''}`)
  }
  console.log('\nInspect in Supabase Studio or with:')
  console.log(`   SELECT * FROM sequential_collections WHERE id = '${col.id}';`)
  console.log(`   SELECT id, title, sequential_position, sequential_is_active FROM tasks WHERE sequential_collection_id = '${col.id}';`)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
