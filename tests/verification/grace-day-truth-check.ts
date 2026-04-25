/**
 * Worker GRACE-CALENDAR truth-check (2026-04-25).
 *
 * Prints each of the founder's kids' grace_days array directly from
 * production, side-by-side with what the calendar should be showing.
 * Run after marking days in the UI to confirm visual state === DB state.
 *
 * Run: npx tsx tests/verification/grace-day-truth-check.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('\n=== GRACE DAY TRUTH CHECK ===')
  console.log('What the database actually has, per kid + per active period.\n')

  const { data: members } = await sb
    .from('family_members')
    .select('id, display_name, family_id')
    .eq('is_active', true)
    .in('role', ['member'])
    .order('display_name')

  for (const m of members ?? []) {
    const { data: period } = await sb
      .from('allowance_periods')
      .select('id, period_start, period_end, status, grace_days')
      .eq('family_member_id', m.id)
      .in('status', ['active', 'makeup_window'])
      .order('period_start', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!period) {
      console.log(`${m.display_name}: no active period`)
      continue
    }

    const entries = (period.grace_days as unknown[]) ?? []
    if (entries.length === 0) {
      console.log(`${m.display_name} (${period.period_start} → ${period.period_end}): no grace days marked`)
      continue
    }

    const lines = entries.map(e => {
      if (typeof e === 'string') {
        return `  ${e} → Skip (legacy string form)`
      }
      const obj = e as { date?: string; mode?: string }
      const modeLabel = obj.mode === 'numerator_keep' ? 'Keep credit' : 'Skip'
      return `  ${obj.date} → ${modeLabel}`
    })

    console.log(`${m.display_name} (${period.period_start} → ${period.period_end}):`)
    for (const l of lines) console.log(l)
  }

  console.log('\nIf the lines above match what your calendar shows, DB === UI.')
  console.log('If they differ: refresh the app (Ctrl+Shift+R) then re-run this script.')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
