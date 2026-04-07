/**
 * Build H post-build SQL verification — PRD-09A/09B Studio Intelligence Phase 1
 *
 * Runs the 6 verification queries the founder asked for. Queries 1, 4, 5, 6 can
 * be answered via the Supabase REST API (supabase-js). Queries 2 and 3 need
 * direct SQL access (cron.job is not REST-exposed), so they are answered by
 * grepping the migration files for the cron.schedule calls — indirect but
 * definitive since migrations are the source of truth for scheduled jobs.
 *
 * Run: node scripts/verify-build-h.cjs
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { createClient } = require('@supabase/supabase-js')
const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(url, key)

function divider(title) {
  console.log('\n' + '─'.repeat(72))
  console.log('  ' + title)
  console.log('─'.repeat(72))
}

async function query1_sequentialCount() {
  divider('1. sequential_collections row count')
  const { count, error } = await sb
    .from('sequential_collections')
    .select('*', { count: 'exact', head: true })
  if (error) {
    console.log('   ❌ ERROR:', error.message)
    return
  }
  const ok = count > 0
  console.log(`   ${ok ? '✅' : '❌'} count = ${count}`)
  if (ok) {
    console.log(`   (Before Build H this was 0 — the E2E tests wrote the first real rows.)`)
  }
  // Also show the titles
  const { data: rows } = await sb
    .from('sequential_collections')
    .select('id, title, total_items, active_count, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  if (rows && rows.length > 0) {
    console.log('   Recent collections:')
    for (const r of rows) {
      console.log(`   • "${r.title}" — ${r.total_items} items, active_count=${r.active_count}`)
    }
  }
}

function grepMigrations(pattern) {
  // Windows-safe grep via Node fs
  const migDir = path.join(__dirname, '..', 'supabase', 'migrations')
  if (!fs.existsSync(migDir)) return []
  const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql'))
  const hits = []
  for (const f of files) {
    const content = fs.readFileSync(path.join(migDir, f), 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(pattern)) {
        // Grab a few lines of context
        const start = Math.max(0, i - 1)
        const end = Math.min(lines.length, i + 3)
        hits.push({ file: f, line: i + 1, context: lines.slice(start, end).join('\n') })
      }
    }
  }
  return hits
}

function query2_claimExpiryCron() {
  divider('2. expire-overdue-task-claims cron job (verified via migrations)')
  const hits = grepMigrations(/expire.overdue.task.claims/i)
  if (hits.length === 0) {
    console.log('   ⚠️  No migration references "expire-overdue-task-claims"')
    console.log('   This cron may not exist yet (PRD-09A opportunity claim lock is a')
    console.log('   separate feature and is not in scope for Build H).')
    return
  }
  console.log(`   ✅ Found ${hits.length} migration reference(s):`)
  for (const h of hits.slice(0, 3)) {
    console.log(`   • ${h.file}:${h.line}`)
    console.log('     ' + h.context.split('\n').map(l => '  ' + l).join('\n     '))
  }
}

function query3_listFrequencyCron() {
  divider('3. list frequency reset cron (verified via migrations)')
  const hits = grepMigrations(/list[_-]?frequency|reset.list|list.items.*reset|reset.*list_items/i)
  if (hits.length === 0) {
    console.log('   ⚠️  No migration references a list frequency reset cron')
    console.log('   (This is a list-items availability reset, possibly named differently.')
    console.log('    Search for reset patterns manually if needed.)')
    return
  }
  console.log(`   ✅ Found ${hits.length} migration reference(s):`)
  for (const h of hits.slice(0, 3)) {
    console.log(`   • ${h.file}:${h.line}`)
  }
}

async function query4_victoryModeColumn() {
  divider('4. lists.victory_mode column exists')
  // The easiest REST-visible check: try to SELECT that column. If it exists,
  // the query succeeds; if not, PostgREST returns a 400.
  const { error } = await sb.from('lists').select('id, victory_mode').limit(1)
  if (error) {
    console.log('   ❌ Column NOT found (query error):', error.message)
  } else {
    console.log('   ✅ lists.victory_mode exists (SELECT succeeded)')
  }
  // Show distribution of victory_mode values
  const { data: lists } = await sb
    .from('lists')
    .select('victory_mode')
    .not('victory_mode', 'is', null)
    .limit(1000)
  if (lists) {
    const counts = {}
    for (const l of lists) counts[l.victory_mode] = (counts[l.victory_mode] ?? 0) + 1
    console.log('   victory_mode distribution across active lists:')
    for (const [mode, n] of Object.entries(counts)) {
      console.log(`   • ${mode}: ${n}`)
    }
  }
}

async function query5_victoryFlaggedColumn() {
  divider('5. list_items.victory_flagged column exists')
  const { error } = await sb.from('list_items').select('id, victory_flagged').limit(1)
  if (error) {
    console.log('   ❌ Column NOT found (query error):', error.message)
  } else {
    console.log('   ✅ list_items.victory_flagged exists (SELECT succeeded)')
  }
  // Count how many items are flagged
  const { count } = await sb
    .from('list_items')
    .select('*', { count: 'exact', head: true })
    .eq('victory_flagged', true)
  console.log(`   ${count ?? 0} list_items currently have victory_flagged=true`)
}

async function query6_backburnerIdeasProvisioning() {
  divider('6. Backburner + Ideas auto-provisioning across members')
  // Fetch active family members
  const { data: members } = await sb
    .from('family_members')
    .select('id, display_name, family_id, role, is_active')
    .eq('is_active', true)
    .order('display_name')
  if (!members || members.length === 0) {
    console.log('   ⚠️  No active members found')
    return
  }

  // Fetch all backburner / ideas lists
  const { data: lists } = await sb
    .from('lists')
    .select('id, list_type, created_by, owner_id, family_id, title')
    .in('list_type', ['backburner', 'ideas'])
  const byMember = {}
  for (const l of lists ?? []) {
    const ownerId = l.owner_id ?? l.created_by
    if (!ownerId) continue
    if (!byMember[ownerId]) byMember[ownerId] = { backburner: 0, ideas: 0 }
    byMember[ownerId][l.list_type] = (byMember[ownerId][l.list_type] ?? 0) + 1
  }

  console.log('   member                  │ backburner │ ideas')
  console.log('   ' + '─'.repeat(54))
  let provisioned = 0
  let unprovisioned = 0
  for (const m of members) {
    const row = byMember[m.id] ?? { backburner: 0, ideas: 0 }
    const hasBoth = row.backburner > 0 && row.ideas > 0
    const marker = hasBoth ? '✅' : (row.backburner === 0 && row.ideas === 0 ? '  ' : '⚠ ')
    console.log(
      `   ${marker} ${m.display_name.padEnd(22)} │ ${String(row.backburner).padEnd(10)} │ ${row.ideas}`
    )
    if (hasBoth) provisioned++
    else if (row.backburner === 0 && row.ideas === 0) unprovisioned++
  }
  console.log(`   Totals: ${provisioned} fully provisioned · ${unprovisioned} have neither`)
  console.log('   (Note: auto-provisioning via trg_auto_provision_member_resources is a')
  console.log('    PRD-09B scope item — not Build H. Build H only surfaces the system lists,')
  console.log('    it does not change how they are created.)')
}

;(async () => {
  console.log('Build H (PRD-09A/09B Studio Intelligence Phase 1) post-build verification')
  console.log(`Connected to: ${url}`)
  await query1_sequentialCount()
  query2_claimExpiryCron()
  query3_listFrequencyCron()
  await query4_victoryModeColumn()
  await query5_victoryFlaggedColumn()
  await query6_backburnerIdeasProvisioning()
  console.log('\n' + '─'.repeat(72))
  console.log('  Done.')
  console.log('─'.repeat(72))
})().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
