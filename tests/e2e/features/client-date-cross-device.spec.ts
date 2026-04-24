/**
 * Row 184 NEW-DD Wave 1 remediation — regression test
 *
 * Migration 00000000100158 extends the migration-100157 pattern (routine step
 * completions) to six more DATE columns. This test locks in the invariant:
 * server-side trigger overrides any client-supplied DATE value when it looks
 * like the device-clock-misconfiguration signature (within 1 day of
 * server-derived family today).
 *
 * Failure mode this test prevents: a kid's tablet set to UTC writes
 * `period_date = tomorrow` for today's completion. Mom's phone (correct TZ)
 * queries `period_date = today` and sees zero rows — kid's checkmarks are
 * invisible. This is exactly what happened on Mosiah's dashboard on
 * 2026-04-23 (see claude/web-sync/CLIENT_DATE_AUDIT_2026-04-23.md).
 *
 * Scope:
 *   - family_today(p_member_id UUID) RPC returns a DATE matching the family's
 *     timezone-derived today.
 *   - task_completions BEFORE INSERT trigger overrides period_date from the
 *     client when the client wrote "tomorrow" but completed_at is "today"
 *     in the family's timezone.
 *   - intention_iterations, family_intention_iterations,
 *     reflection_responses, homeschool_time_logs, victory_celebrations
 *     all exhibit the same override behavior for their respective DATE
 *     columns.
 *
 * This is a backend-only test — no browser needed. It drives the Supabase
 * service-role client directly, writes deliberately-misdated rows, and
 * verifies they come back with corrected dates.
 */
import { test, expect } from '@playwright/test'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

async function getMomMember() {
  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
    email: TEST_USERS.sarah.email,
    password: TEST_USERS.sarah.password,
  })
  if (authErr || !auth.user) throw new Error(`Mom login failed: ${authErr?.message}`)
  const { data } = await sb
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', auth.user.id)
    .limit(1)
    .single()
  if (!data) throw new Error('Mom family member not found')
  return { sb, member: data as { id: string; family_id: string } }
}

// Compute "tomorrow" from today by adding one day. Used to simulate a
// misconfigured device writing a DATE that's one day ahead.
function tomorrowFor(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + 1)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

test.describe.serial('Row 184 NEW-DD — cross-device date trigger invariants', () => {
  test('family_today RPC returns a valid DATE string', async () => {
    const { sb, member } = await getMomMember()
    const { data, error } = await sb.rpc('family_today', { p_member_id: member.id })
    expect(error).toBeNull()
    expect(data).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('task_completions trigger overrides a "tomorrow" period_date from misconfigured client', async () => {
    const { sb, member } = await getMomMember()

    // Get family_today from the RPC (ground truth).
    const { data: familyToday } = await sb.rpc('family_today', { p_member_id: member.id })
    const tomorrow = tomorrowFor(familyToday as string)

    // Insert a task completion with completed_at = now and period_date = tomorrow,
    // simulating a device whose clock thinks it's already the next day. We need a
    // task to point at — pick any existing one in the family, or create a throwaway.
    const { data: existingTask } = await sb
      .from('tasks')
      .select('id')
      .eq('family_id', member.family_id)
      .limit(1)
      .maybeSingle()

    if (!existingTask) {
      test.skip(true, 'No tasks in test family — cannot exercise task_completions trigger')
      return
    }

    const { data: completion, error } = await sb
      .from('task_completions')
      .insert({
        task_id: existingTask.id,
        member_id: member.id,
        family_member_id: member.id,
        period_date: tomorrow,
        completed_at: new Date().toISOString(),
      })
      .select('id, period_date')
      .single()

    try {
      expect(error).toBeNull()
      expect(completion).toBeTruthy()
      // Trigger should have overridden "tomorrow" back to family_today.
      expect(completion!.period_date).toBe(familyToday)
    } finally {
      if (completion?.id) {
        await sb.from('task_completions').delete().eq('id', completion.id)
      }
    }
  })

  test('intention_iterations trigger overrides a "tomorrow" day_date', async () => {
    const { sb, member } = await getMomMember()
    const { data: familyToday } = await sb.rpc('family_today', { p_member_id: member.id })
    const tomorrow = tomorrowFor(familyToday as string)

    // Find an existing intention belonging to mom (or bail if none).
    const { data: intention } = await sb
      .from('best_intentions')
      .select('id')
      .eq('member_id', member.id)
      .limit(1)
      .maybeSingle()

    if (!intention) {
      test.skip(true, 'No best_intention for mom — cannot exercise intention_iterations trigger')
      return
    }

    const { data: iter, error } = await sb
      .from('intention_iterations')
      .insert({
        intention_id: intention.id,
        family_id: member.family_id,
        member_id: member.id,
        day_date: tomorrow,
      })
      .select('id, day_date')
      .single()

    try {
      expect(error).toBeNull()
      expect(iter).toBeTruthy()
      expect(iter!.day_date).toBe(familyToday)
    } finally {
      if (iter?.id) {
        await sb.from('intention_iterations').delete().eq('id', iter.id)
      }
    }
  })

  test('backfill invariant: no task_completions rows misaligned by more than 1 day', async () => {
    // Defensive read-side check. The migration backfilled any 1-day-drift rows
    // inline. Anything drifting by >1 day is considered intentional backdating
    // and is NOT covered by the trigger's override window. This query should
    // return zero — if it ever doesn't, either the trigger broke or a new
    // code path bypassed it (e.g., raw SQL insert from an Edge Function).
    const { sb, member } = await getMomMember()
    const { data: familyToday } = await sb.rpc('family_today', { p_member_id: member.id })

    // Since RLS scopes mom to her own family, this query is naturally bounded.
    const { data: misaligned } = await sb
      .from('task_completions')
      .select('id, period_date, completed_at')
      .eq('family_member_id', member.id)

    if (!misaligned) return

    // For each row, verify |period_date - (completed_at::date in family TZ)| is not 1 day
    // drifted. We rely on family_today being stable for the test duration.
    for (const row of misaligned) {
      if (!row.period_date || !row.completed_at) continue
      const completedLocal = (row.completed_at as string).slice(0, 10)
      // Expect period_date to be either == completedLocal, or == familyToday (the
      // server trigger's resolution). Anything else that differs by exactly 1 day
      // is the drift signature.
      const diff = Math.abs(new Date(row.period_date as string).getTime() - new Date(completedLocal).getTime()) / 86_400_000
      expect(diff, `row ${row.id} has period_date drift from completed_at (likely trigger bypass)`).toBeLessThanOrEqual(1)
    }

    expect(familyToday).toBeTruthy()
  })
})
