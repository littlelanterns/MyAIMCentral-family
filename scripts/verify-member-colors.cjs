/**
 * Quick data check: what's in assigned_color vs member_color vs calendar_color
 * for all family_members rows? Helps decide the backfill strategy.
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const { createClient } = require('@supabase/supabase-js')
const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const sb = createClient(url, key)

async function main() {
  const { data, error } = await sb
    .from('family_members')
    .select('id, display_name, member_color, assigned_color, calendar_color, assigned_color_token')
    .eq('is_active', true)
    .order('family_id')
    .order('display_name')
  if (error) { console.error(error); process.exit(1) }

  console.log(`\nTotal active members: ${data.length}\n`)

  let bothMatch = 0
  let onlyMember = 0
  let onlyAssigned = 0
  let neither = 0
  let conflict = 0

  for (const m of data) {
    const hasMember = !!m.member_color
    const hasAssigned = !!m.assigned_color
    if (hasMember && hasAssigned) {
      if (m.member_color === m.assigned_color) bothMatch++
      else conflict++
    } else if (hasMember) {
      onlyMember++
    } else if (hasAssigned) {
      onlyAssigned++
    } else {
      neither++
    }
  }

  console.log(`Both set + matching:   ${bothMatch}`)
  console.log(`Both set + CONFLICT:   ${conflict}`)
  console.log(`Only member_color:     ${onlyMember}`)
  console.log(`Only assigned_color:   ${onlyAssigned}`)
  console.log(`Neither set:           ${neither}`)
  console.log('')
  console.log('Sample rows (first 15):')
  console.log('─'.repeat(90))
  for (const m of data.slice(0, 15)) {
    const mc = (m.member_color || '(null)').padEnd(9)
    const ac = (m.assigned_color || '(null)').padEnd(9)
    const cc = (m.calendar_color || '(null)').padEnd(9)
    const tok = (m.assigned_color_token || '(null)').padEnd(20)
    console.log(`  ${m.display_name.padEnd(16)}  member=${mc}  assigned=${ac}  calendar=${cc}  token=${tok}`)
  }
  console.log('')
}

main().catch(e => { console.error(e); process.exit(1) })
