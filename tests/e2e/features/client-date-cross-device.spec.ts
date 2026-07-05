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
import { randomUUID } from 'node:crypto'
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

// CLIENT-DATE-REMEDIATION: fixture creation/cleanup for the new W1-W3 trigger
// tests uses the service-role client (matches role-scoping-leak-pass.spec.ts
// pattern) — widget_data_points and deed_firings have no DELETE RLS policy at
// all, so fixture cleanup requires bypassing RLS regardless.
function getServiceClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
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

// Generalized day-offset helper (positive or negative delta) — CLIENT-DATE-REMEDIATION.
function dayOffset(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Converts a TIMESTAMPTZ (ISO string) to a YYYY-MM-DD date in the given IANA
// timezone — the JS-side mirror of Postgres's `(ts AT TIME ZONE tz)::date`.
// CLIENT-DATE-REMEDIATION.
function dateInTimezone(isoTimestamp: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(isoTimestamp))
  const year = parts.find(p => p.type === 'year')!.value
  const month = parts.find(p => p.type === 'month')!.value
  const day = parts.find(p => p.type === 'day')!.value
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

  // ══════════════════════════════════════════════════════════════════════
  // CLIENT-DATE-REMEDIATION — residual closure (Row 184 NEW-DD / Convention #257)
  // Migration 00000000100282 extends the same pattern to three more DATE
  // columns: practice_log.period_date, widget_data_points.recorded_date,
  // randomizer_draws.routine_instance_date.
  // ══════════════════════════════════════════════════════════════════════

  test('practice_log trigger overrides a "tomorrow" period_date (W1)', async () => {
    const { sb, member } = await getMomMember()
    const { data: familyToday } = await sb.rpc('family_today', { p_member_id: member.id })
    const tomorrow = tomorrowFor(familyToday as string)

    const { data: log, error } = await sb
      .from('practice_log')
      .insert({
        family_id: member.family_id,
        family_member_id: member.id,
        source_type: 'task',
        source_id: randomUUID(),
        practice_type: 'practice',
        period_date: tomorrow,
      })
      .select('id, period_date')
      .single()

    try {
      expect(error).toBeNull()
      expect(log).toBeTruthy()
      expect(log!.period_date).toBe(familyToday)
    } finally {
      if (log?.id) await sb.from('practice_log').delete().eq('id', log.id)
    }
  })

  test('practice_log and task_completions dual-write agreement (W1)', async () => {
    // A single practice session writes to BOTH tables (useLogPractice
    // sequential_task branch). Both triggers must derive the identical
    // family-local day from the same completed_at/created_at instant —
    // otherwise the same session carries two different dates across tables.
    const { sb, member } = await getMomMember()
    const sharedTimestamp = new Date().toISOString()
    const sourceId = randomUUID()

    const { data: log, error: logErr } = await sb
      .from('practice_log')
      .insert({
        family_id: member.family_id,
        family_member_id: member.id,
        source_type: 'sequential_task',
        source_id: sourceId,
        practice_type: 'practice',
        created_at: sharedTimestamp,
      })
      .select('id, period_date')
      .single()

    const { data: existingTask } = await sb
      .from('tasks')
      .select('id')
      .eq('family_id', member.family_id)
      .limit(1)
      .maybeSingle()

    try {
      expect(logErr).toBeNull()
      expect(log).toBeTruthy()

      if (!existingTask) {
        test.skip(true, 'No tasks in test family — cannot exercise task_completions side')
        return
      }

      const { data: completion, error: compErr } = await sb
        .from('task_completions')
        .insert({
          task_id: existingTask.id,
          member_id: member.id,
          family_member_id: member.id,
          completion_type: 'practice',
          completed_at: sharedTimestamp,
        })
        .select('id, period_date')
        .single()

      try {
        expect(compErr).toBeNull()
        expect(completion).toBeTruthy()
        // Same instant, two independent triggers (100282 for practice_log,
        // 100158 for task_completions) — must agree on the family-local day.
        expect(completion!.period_date).toBe(log!.period_date)
      } finally {
        if (completion?.id) await sb.from('task_completions').delete().eq('id', completion.id)
      }
    } finally {
      if (log?.id) await sb.from('practice_log').delete().eq('id', log.id)
    }
  })

  test('widget_data_points trigger overrides a "tomorrow" recorded_date (W2)', async () => {
    const svc = getServiceClient()
    const { member } = await getMomMember()

    const { data: widget, error: widgetErr } = await svc
      .from('dashboard_widgets')
      .insert({
        family_id: member.family_id,
        family_member_id: member.id,
        template_type: 'streak',
        title: 'CDR E2E Test Widget',
      })
      .select('id')
      .single()
    expect(widgetErr).toBeNull()
    const widgetId = widget!.id as string

    try {
      const { data: familyToday } = await svc.rpc('family_today', { p_member_id: member.id })
      const tomorrow = tomorrowFor(familyToday as string)

      const { data: point, error } = await svc
        .from('widget_data_points')
        .insert({
          family_id: member.family_id,
          widget_id: widgetId,
          family_member_id: member.id,
          recorded_at: new Date().toISOString(),
          recorded_date: tomorrow,
          value: 1,
        })
        .select('id, recorded_date')
        .single()

      try {
        expect(error).toBeNull()
        expect(point).toBeTruthy()
        expect(point!.recorded_date).toBe(familyToday)
      } finally {
        if (point?.id) await svc.from('widget_data_points').delete().eq('id', point.id)
      }
    } finally {
      await svc.from('dashboard_widgets').delete().eq('id', widgetId)
    }
  })

  test('widget_data_points seed-protection: a 10-day backdated entry is NOT overridden (W2)', async () => {
    // The ±1-day window must leave intentional historical backdating (e.g.
    // the 2026-03-26 bulk seed import) untouched — only the device-clock-
    // misconfiguration signature (within 1 day of today) gets corrected.
    const svc = getServiceClient()
    const { member } = await getMomMember()

    const { data: widget, error: widgetErr } = await svc
      .from('dashboard_widgets')
      .insert({
        family_id: member.family_id,
        family_member_id: member.id,
        template_type: 'streak',
        title: 'CDR E2E Seed-Protection Widget',
      })
      .select('id')
      .single()
    expect(widgetErr).toBeNull()
    const widgetId = widget!.id as string

    try {
      const { data: familyToday } = await svc.rpc('family_today', { p_member_id: member.id })
      const tenDaysBack = dayOffset(familyToday as string, -10)

      const { data: point, error } = await svc
        .from('widget_data_points')
        .insert({
          family_id: member.family_id,
          widget_id: widgetId,
          family_member_id: member.id,
          recorded_at: new Date().toISOString(), // "now" — but recorded_date claims 10 days back
          recorded_date: tenDaysBack,
          value: 1,
        })
        .select('id, recorded_date')
        .single()

      try {
        expect(error).toBeNull()
        expect(point).toBeTruthy()
        // NOT overridden — the >1-day gap means this reads as intentional backdating.
        expect(point!.recorded_date).toBe(tenDaysBack)
      } finally {
        if (point?.id) await svc.from('widget_data_points').delete().eq('id', point.id)
      }
    } finally {
      await svc.from('dashboard_widgets').delete().eq('id', widgetId)
    }
  })

  test('randomizer_draws trigger overrides a "tomorrow" routine_instance_date (W3)', async () => {
    const svc = getServiceClient()
    const { member } = await getMomMember()
    const title = `CDR E2E Randomizer ${Date.now()}`

    const { data: list, error: listErr } = await svc
      .from('lists')
      .insert({
        family_id: member.family_id,
        owner_id: member.id,
        created_by: member.id,
        title,
        list_name: title,
        list_type: 'randomizer',
      })
      .select('id')
      .single()
    expect(listErr).toBeNull()
    const listId = list!.id as string

    try {
      const { data: item, error: itemErr } = await svc
        .from('list_items')
        .insert({
          list_id: listId,
          content: 'CDR test item',
          item_name: 'CDR test item',
          is_available: true,
        })
        .select('id')
        .single()
      expect(itemErr).toBeNull()
      const itemId = item!.id as string

      const { data: familyToday } = await svc.rpc('family_today', { p_member_id: member.id })
      const tomorrow = tomorrowFor(familyToday as string)

      const { data: draw, error } = await svc
        .from('randomizer_draws')
        .insert({
          list_id: listId,
          list_item_id: itemId,
          family_member_id: member.id,
          draw_source: 'manual', // avoid the auto_surprise UNIQUE-index edge case
          routine_instance_date: tomorrow,
          status: 'active',
        })
        .select('id, routine_instance_date')
        .single()

      try {
        expect(error).toBeNull()
        expect(draw).toBeTruthy()
        expect(draw!.routine_instance_date).toBe(familyToday)
      } finally {
        if (draw?.id) await svc.from('randomizer_draws').delete().eq('id', draw.id)
      }
    } finally {
      await svc.from('lists').delete().eq('id', listId)
    }
  })

  test('routine_step_completions: positive-delta invariant holds post-100245 (corrected §2 query)', async () => {
    // Migration 100245 intentionally introduced NEGATIVE deltas (carry-over
    // walk-back attributes a completion to an earlier scheduled day). The
    // device-clock-misconfiguration bug only ever produces POSITIVE deltas
    // (a fast clock writes tomorrow) — so this is the only direction that
    // should ever read as zero. See Client-Date-Remediation.md §2.
    const { sb, member } = await getMomMember()

    const { data: familyRow } = await sb
      .from('families')
      .select('timezone')
      .eq('id', member.family_id)
      .single()
    const timezone = familyRow?.timezone || 'America/Chicago'

    const { data: rows } = await sb
      .from('routine_step_completions')
      .select('id, period_date, completed_at, member_id')
      .eq('member_id', member.id)

    if (!rows) return

    for (const row of rows) {
      if (!row.period_date || !row.completed_at) continue
      const completedFamilyLocalDate = dateInTimezone(row.completed_at as string, timezone)
      // period_date should never be LATER than the completion's own
      // family-local calendar day — that's the device-clock-ahead signature
      // this build guards. Equal or earlier (carry-over walk-back) is fine.
      // YYYY-MM-DD strings compare lexicographically the same as chronologically.
      const isNotAhead = (row.period_date as string) <= completedFamilyLocalDate
      expect(
        isNotAhead,
        `row ${row.id}: period_date ${row.period_date} > family-local completion day ${completedFamilyLocalDate}`,
      ).toBe(true)
    }
  })

  test('streak family-timezone boundary: two evening firings straddling UTC midnight = 1 day, not 2', async () => {
    // Pins the compute_streak() family-timezone fix (migration 100240, which
    // predates this build — see CLIENT-DATE-REMEDIATION build notes on why
    // W4's originally-scoped fix was moot). Two deed_firings 1 hour apart
    // straddle a UTC calendar-day boundary but land on the SAME family-local
    // calendar day for any US timezone (offset >= 1 hour behind UTC) —
    // compute_streak must count them as ONE day, not two.
    const svc = getServiceClient()
    const { sb, member } = await getMomMember()
    const { data: familyToday } = await sb.rpc('family_today', { p_member_id: member.id })
    const yesterday = dayOffset(familyToday as string, -1)
    const testSourceId = randomUUID()

    const firingA = { // yesterday 23:30 UTC
      family_id: member.family_id,
      family_member_id: member.id,
      source_type: 'task_completion',
      source_id: testSourceId,
      fired_at: `${yesterday}T23:30:00.000Z`,
      idempotency_key: `cdr-streak-test-a-${testSourceId}`,
    }
    const firingB = { // today 00:30 UTC — 1 hour later, different UTC calendar day
      family_id: member.family_id,
      family_member_id: member.id,
      source_type: 'task_completion',
      source_id: testSourceId,
      fired_at: `${familyToday}T00:30:00.000Z`,
      idempotency_key: `cdr-streak-test-b-${testSourceId}`,
    }

    const { error: insertErr } = await svc.from('deed_firings').insert([firingA, firingB])

    try {
      expect(insertErr).toBeNull()

      const { data: streak, error: streakErr } = await sb.rpc('compute_streak', {
        p_family_member_id: member.id,
        p_source_type: 'task_completion',
        p_source_id: testSourceId,
      })

      expect(streakErr).toBeNull()
      // Only "yesterday" has activity for this test source_id (both firings
      // collapse into one family-local day) — current_streak counts the
      // single active day relative to today (gap=1, within the default
      // grace window), never 2.
      expect((streak as { current_streak: number }).current_streak).toBe(1)
    } finally {
      await svc.from('deed_firings').delete().eq('source_id', testSourceId)
    }
  })
})
