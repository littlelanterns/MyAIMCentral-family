/**
 * Row 21 — SCOPE-8b.F7 calendar_events source_type CHECK constraint
 *
 * Verifies:
 *   - 'ics_import' is allowed (migration 100162 or equivalent added it)
 *   - 'mindsweep' is allowed
 *   - A bogus value is still rejected (negative-path)
 *
 * Uses the Testworth family and cleans up after itself. Soft-deletes are not
 * required — we DELETE rows we INSERT.
 *
 * Run: npx tsx tests/verification/row-21-calendar-source-check.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(2)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const findings: Array<{ label: string; pass: boolean; detail: string }> = []

function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

async function getTestworthFamilyId(): Promise<string> {
  const { data } = await supabase
    .from('families')
    .select('id')
    .ilike('family_name', '%testworth%')
    .limit(1)
    .maybeSingle()
  if (data?.id) return data.id as string
  // Fall back to first family if Testworth not present
  const { data: fallback } = await supabase.from('families').select('id').limit(1).single()
  return fallback!.id as string
}

async function getMemberId(familyId: string): Promise<string> {
  const { data } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .limit(1)
    .single()
  return data!.id as string
}

async function tryInsert(familyId: string, memberId: string, sourceType: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      family_id: familyId,
      created_by: memberId,
      title: `__verify_row_21_${sourceType}_${Date.now()}`,
      event_date: '2099-01-01',
      source_type: sourceType,
      status: 'approved',
    })
    .select('id')
    .single()
  return { data, error }
}

async function main() {
  console.log('Row 21 — calendar_events source_type CHECK constraint')
  console.log('─'.repeat(60))

  const familyId = await getTestworthFamilyId()
  const memberId = await getMemberId(familyId)
  console.log(`Using family_id=${familyId}, created_by=${memberId}`)

  // Positive path: ics_import
  {
    const { data, error } = await tryInsert(familyId, memberId, 'ics_import')
    if (error) {
      record('ics_import accepted', false, `REJECTED: ${error.message} (code ${error.code})`)
    } else {
      record('ics_import accepted', true, `inserted id=${data!.id}`)
      await supabase.from('calendar_events').delete().eq('id', data!.id)
    }
  }

  // Positive path: mindsweep
  {
    const { data, error } = await tryInsert(familyId, memberId, 'mindsweep')
    if (error) {
      record('mindsweep accepted', false, `REJECTED: ${error.message} (code ${error.code})`)
    } else {
      record('mindsweep accepted', true, `inserted id=${data!.id}`)
      await supabase.from('calendar_events').delete().eq('id', data!.id)
    }
  }

  // Negative path: bogus_source should reject with CHECK violation
  {
    const { data, error } = await tryInsert(familyId, memberId, 'bogus_source_row21')
    if (error) {
      const looksLikeCheck = /check constraint|source_type_check|violates check/i.test(error.message)
      record(
        'bogus_source rejected with CHECK violation (negative-path)',
        looksLikeCheck,
        `error: ${error.message} (code ${error.code})`
      )
    } else {
      // Clean up if somehow inserted and fail
      if (data?.id) await supabase.from('calendar_events').delete().eq('id', data.id)
      record('bogus_source rejected with CHECK violation (negative-path)', false, 'INSERT succeeded — constraint is MISSING or overly permissive')
    }
  }

  console.log('─'.repeat(60))
  const failures = findings.filter(f => !f.pass)
  if (failures.length === 0) {
    console.log(`ALL PASS (${findings.length} checks)`)
    process.exit(0)
  } else {
    console.log(`FAIL: ${failures.length} of ${findings.length}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('verification error:', err)
  process.exit(2)
})
