/**
 * One-shot verification: does the studio_queue have any pending rows?
 * Reports: total pending, last 5 rows with content preview, source breakdown.
 *
 * Run: node scripts/verify-studio-queue.cjs
 */
const path = require('path')
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

async function main() {
  divider('studio_queue — total pending (processed_at IS NULL AND dismissed_at IS NULL)')
  const { count, error: countError } = await sb
    .from('studio_queue')
    .select('id', { count: 'exact', head: true })
    .is('processed_at', null)
    .is('dismissed_at', null)
  if (countError) {
    console.error('count error:', countError)
    process.exit(1)
  }
  console.log(`  total pending rows: ${count}`)

  divider('studio_queue — last 10 rows (most recent first)')
  const { data: rows, error: rowsError } = await sb
    .from('studio_queue')
    .select('id, family_id, owner_id, destination, content, source, mindsweep_confidence, processed_at, dismissed_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  if (rowsError) {
    console.error('rows error:', rowsError)
    process.exit(1)
  }
  if (!rows || rows.length === 0) {
    console.log('  (zero rows in studio_queue)')
  } else {
    for (const r of rows) {
      const status = r.processed_at ? 'PROCESSED' : r.dismissed_at ? 'DISMISSED' : 'PENDING'
      const contentPreview = (r.content || '').slice(0, 60).replace(/\s+/g, ' ')
      console.log(`  [${status}] ${r.created_at}  dest=${r.destination}  source=${r.source}`)
      console.log(`          family=${r.family_id}  owner=${r.owner_id}`)
      console.log(`          content: "${contentPreview}${r.content && r.content.length > 60 ? '…' : ''}"`)
      console.log(`          confidence=${r.mindsweep_confidence || 'n/a'}`)
    }
  }

  divider('studio_queue — pending rows grouped by source')
  const { data: allPending, error: allErr } = await sb
    .from('studio_queue')
    .select('source, destination')
    .is('processed_at', null)
    .is('dismissed_at', null)
  if (allErr) {
    console.error('group error:', allErr)
  } else {
    const groups = {}
    for (const r of allPending || []) {
      const key = `${r.source} → ${r.destination}`
      groups[key] = (groups[key] || 0) + 1
    }
    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1])
    if (entries.length === 0) {
      console.log('  (no pending rows)')
    } else {
      for (const [k, v] of entries) {
        console.log(`  ${v.toString().padStart(4)}  ${k}`)
      }
    }
  }

  divider('mindsweep_events — last 10 sweep runs')
  const { data: events, error: evErr } = await sb
    .from('mindsweep_events')
    .select('id, family_id, member_id, source_channel, input_type, items_extracted, items_auto_routed, items_queued, items_direct_routed, aggressiveness_at_time, raw_content_preview, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  if (evErr) {
    console.log(`  (mindsweep_events query failed: ${evErr.message})`)
  } else if (!events || events.length === 0) {
    console.log('  (no mindsweep_events rows)')
  } else {
    for (const e of events) {
      console.log(`  ${e.created_at}  channel=${e.source_channel}  input=${e.input_type}  aggressiveness=${e.aggressiveness_at_time}`)
      console.log(`          extracted=${e.items_extracted}  auto_routed=${e.items_auto_routed}  queued=${e.items_queued}  direct_routed=${e.items_direct_routed}`)
      console.log(`          family=${e.family_id}  member=${e.member_id}`)
      if (e.raw_content_preview) {
        console.log(`          preview: "${(e.raw_content_preview || '').slice(0, 80).replace(/\s+/g, ' ')}"`)
      }
    }
  }

  console.log('\n')
}

main().catch(err => {
  console.error('fatal:', err)
  process.exit(1)
})
