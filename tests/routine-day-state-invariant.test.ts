/**
 * Member-Day Task State — Canonical Source (Convention #271) — Invariant Test
 *
 * D7 of the Member-Day-Task-State build. Asserts that the SQL Layer 1
 * predicate `obligation_active_for_member_on_date` (migration 100247) makes
 * IDENTICAL visible/hidden decisions to the frozen TS reference
 * `recurringTaskFilter.isRecurringTaskVisibleToday` for the same inputs,
 * across a synthetic 30-day window over a corpus of task shapes.
 *
 * ── Harness choice (documented per the build contract) ──────────────────
 * The vitest environment in this repo has no live Supabase client wired in
 * (tests are pure/unit — see tests/supabase-connection.test.ts which only
 * inspects the env template, never connects). Per the build instruction:
 * when hitting the real SQL function requires DB access the test env lacks,
 * port Layer 1's exact predicate into the test as a PARALLEL TS function AND
 * document that the migration's SQL MUST mirror it line-for-line.
 *
 *   THE SQL FUNCTION `obligation_active_for_member_on_date` IN MIGRATION
 *   `00000000100247_member_day_task_state_canonical_source.sql` MUST MIRROR
 *   THE `sqlLayer1Mirror` FUNCTION BELOW EXACTLY. If you change one, change
 *   the other, and this test must still pass. This test is the contract.
 *
 * The mirror encodes ONLY the schedule-shape decision (dtstart / until /
 * painted-rdates / RRULE / per-section-frequency / archived / created_at).
 * The assignee predicate (assignee_id OR task_assignments membership) and the
 * shared-routine semantics are orthogonal gating that the SQL applies on top;
 * the corpus holds the member always-assigned + always-active so the only
 * variable under test is the SCHEDULE decision — which is exactly what
 * `recurringTaskFilter` governs. The assignee/archived/created gates are
 * exercised by dedicated cases at the bottom.
 */

import { describe, it, expect } from 'vitest'
import { RRule } from 'rrule'
import { isRecurringTaskVisibleToday } from '@/lib/tasks/recurringTaskFilter'
import type { Task } from '@/types/tasks'

// ── Synthetic corpus types ──────────────────────────────────────────────

interface CorpusTask {
  label: string
  task_type: 'routine' | 'task'
  recurrence_rule: string | null
  recurrence_details: Record<string, unknown> | null
  due_date: string | null
  created_at: string // ISO timestamptz
  archived_at: string | null // ISO timestamptz or null
  assignee_id: string
  assigned_via_assignments: boolean // simulates task_assignments membership
  is_shared: boolean
}

const MEMBER = 'member-under-test'
const OTHER_MEMBER = 'someone-else'

// Frozen base: created well before the window so created_at never gates.
const FAR_PAST_CREATED = '2025-01-01T00:00:00Z'

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// ── The SQL Layer 1 mirror ──────────────────────────────────────────────
//
// MUST be kept line-for-line equivalent to the SQL function
// `obligation_active_for_member_on_date` in migration 100247.
//
// Returns true iff the task is "active for this member on this date" using
// the SAME schedule logic as recurringTaskFilter PLUS the gating predicates
// (archived / created / assignee) the SQL adds.

function sqlLayer1Mirror(task: CorpusTask, dateIso: string): boolean {
  const date = new Date(dateIso + 'T00:00:00')

  // --- Gating predicate 1: archived_at IS NULL OR archived_at::date >= date
  if (task.archived_at) {
    const archivedDate = task.archived_at.slice(0, 10)
    if (archivedDate < dateIso) return false
  }

  // --- Gating predicate 2: created_at::date <= date + 1
  // (mirrors recurringTaskFilter's silence on created_at by being permissive;
  //  the +1 day matches the contract's `created_at <= p_date + interval '1 day'`)
  if (task.created_at) {
    const createdDate = task.created_at.slice(0, 10)
    const datePlus1 = new Date(date)
    datePlus1.setDate(datePlus1.getDate() + 1)
    const datePlus1Iso = `${datePlus1.getFullYear()}-${String(datePlus1.getMonth() + 1).padStart(2, '0')}-${String(datePlus1.getDate()).padStart(2, '0')}`
    if (createdDate > datePlus1Iso) return false
  }

  // --- Gating predicate 3: assignee match
  const assigneeMatch = task.assignee_id === MEMBER || task.assigned_via_assignments
  if (!assigneeMatch) return false

  // --- Schedule decision (mirrors recurringTaskFilter exactly) ---
  const details = task.recurrence_details

  // Routine end-date: until lives in recurrence_details.until; legacy fallback
  // is due_date. recurringTaskFilter only applies this for task_type='routine'.
  if (task.task_type === 'routine') {
    const untilStr = (details?.until as string | undefined) ?? task.due_date ?? undefined
    if (untilStr) {
      // endDate = until + 'T23:59:59'; hide if endDate < startOfDate
      const endDate = new Date(untilStr + 'T23:59:59')
      const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
      if (endDate < startOfDate) return false
    }
  }

  // Advance-start gating: dtstart in the future hides the task.
  if (details && typeof details.dtstart === 'string') {
    const dtstart = details.dtstart as string
    const dtstartDate = new Date(dtstart.includes('T') ? dtstart : dtstart + 'T00:00:00')
    const endOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    if (dtstartDate > endOfDate) return false
  }

  // Painted: only visible on explicitly painted rdates (minus exdates).
  if (details?.schedule_type === 'painted') {
    const exdates = (details.exdates as string[] | undefined) ?? []
    if (exdates.includes(dateIso)) return false
    const rdates = (details.rdates as string[] | undefined) ?? []
    return rdates.includes(dateIso)
  }

  // No recurrence_rule at all → always visible (after advance-start above).
  if (!task.recurrence_rule) return true

  if (!details) return true

  const rruleStr = details.rrule as string | undefined
  if (!rruleStr || typeof rruleStr !== 'string') return true

  // completion_dependent → visible when pending (no calendar).
  if (task.recurrence_rule === 'completion_dependent') return true

  try {
    const rule = RRule.fromString(rruleStr)
    const dtstart = details.dtstart
      ? new Date(details.dtstart as string)
      : task.due_date
        ? new Date(task.due_date + 'T00:00:00')
        : new Date('2020-01-01T00:00:00')

    const untilRaw =
      (details.until as string | null | undefined) ??
      (details.end_date as string | undefined) ??
      null
    const until = untilRaw
      ? new Date(untilRaw.includes('T') ? untilRaw : untilRaw + 'T23:59:59')
      : undefined

    const fullRule = new RRule({
      ...rule.origOptions,
      dtstart,
      ...(until ? { until } : {}),
    })

    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    const occurrences = fullRule.between(dayStart, dayEnd, true)
    return occurrences.length > 0
  } catch {
    return true
  }
}

// ── Convert a CorpusTask to the Task shape recurringTaskFilter expects ──

function toTask(c: CorpusTask): Task {
  return {
    id: c.label,
    family_id: 'fam-1',
    title: c.label,
    task_type: c.task_type,
    status: 'pending',
    recurrence_rule: c.recurrence_rule,
    recurrence_details: c.recurrence_details,
    due_date: c.due_date,
    is_shared: c.is_shared,
  } as unknown as Task
}

// ── Build the synthetic corpus ──────────────────────────────────────────
//
// All rows are assigned to MEMBER and active (not archived, far-past created)
// UNLESS a case explicitly varies the gate. Schedule shape is the variable.

function base(partial: Partial<CorpusTask> & { label: string }): CorpusTask {
  return {
    task_type: 'routine',
    recurrence_rule: null,
    recurrence_details: null,
    due_date: null,
    created_at: FAR_PAST_CREATED,
    archived_at: null,
    assignee_id: MEMBER,
    assigned_via_assignments: false,
    is_shared: false,
    ...partial,
  }
}

const corpus: CorpusTask[] = [
  // ── Painted single-day ──
  base({
    label: 'painted-single-day',
    recurrence_details: { schedule_type: 'painted', rdates: [ymd(2026, 5, 22)], exdates: [], until: ymd(2026, 5, 22) },
  }),
  // ── Painted multi-day contiguous ──
  base({
    label: 'painted-multi-contiguous',
    recurrence_details: {
      schedule_type: 'painted',
      rdates: [ymd(2026, 5, 18), ymd(2026, 5, 19), ymd(2026, 5, 20), ymd(2026, 5, 21), ymd(2026, 5, 22), ymd(2026, 5, 23)],
      exdates: [],
      until: ymd(2026, 5, 23),
    },
  }),
  // ── Painted scattered, with an exdate ──
  base({
    label: 'painted-scattered-exdate',
    recurrence_details: {
      schedule_type: 'painted',
      rdates: [ymd(2026, 5, 15), ymd(2026, 5, 20), ymd(2026, 5, 25)],
      exdates: [ymd(2026, 5, 20)],
      until: ymd(2026, 5, 25),
    },
  }),
  // ── Painted WITHOUT until (the production bug shape) ──
  base({
    label: 'painted-no-until',
    recurrence_details: {
      schedule_type: 'painted',
      rdates: [ymd(2026, 5, 22), ymd(2026, 5, 23)],
      exdates: [],
    },
  }),
  // ── Recurring daily, no until, no dtstart ──
  base({
    label: 'recurring-daily',
    recurrence_rule: 'daily',
    recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=DAILY' },
  }),
  // ── Recurring weekly + BYDAY (Mon/Wed/Fri) ──
  base({
    label: 'recurring-weekly-mwf',
    recurrence_rule: 'weekly',
    recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR' },
  }),
  // ── Recurring monthly BYMONTHDAY ──
  base({
    label: 'recurring-monthly-15th',
    recurrence_rule: 'monthly',
    recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=MONTHLY;BYMONTHDAY=15' },
  }),
  // ── Recurring daily WITH until in the middle of window ──
  base({
    label: 'recurring-daily-until',
    recurrence_rule: 'daily',
    recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=DAILY', until: ymd(2026, 5, 20) },
  }),
  // ── Recurring daily WITH future dtstart ──
  base({
    label: 'recurring-daily-future-dtstart',
    recurrence_rule: 'daily',
    recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=DAILY', dtstart: ymd(2026, 5, 22) },
  }),
  // ── Recurring daily WITH past dtstart ──
  base({
    label: 'recurring-daily-past-dtstart',
    recurrence_rule: 'daily',
    recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=DAILY', dtstart: ymd(2026, 5, 1) },
  }),
  // ── Per-section-frequency routine (no rrule string, no painted) ──
  base({
    label: 'per-section-no-rrule',
    recurrence_rule: null,
    recurrence_details: { schedule_type: 'recurring', dtstart: ymd(2026, 5, 1) },
  }),
  // ── Per-section routine with future dtstart ──
  base({
    label: 'per-section-future-dtstart',
    recurrence_rule: null,
    recurrence_details: { schedule_type: 'recurring', dtstart: ymd(2026, 5, 25) },
  }),
  // ── Routine with legacy due_date end (no until in details) ──
  base({
    label: 'routine-legacy-due-date-end',
    recurrence_rule: 'daily',
    recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=DAILY' },
    due_date: ymd(2026, 5, 18),
  }),
  // ── Non-routine plain task (no recurrence) ──
  base({
    label: 'plain-task',
    task_type: 'task',
    recurrence_rule: null,
    recurrence_details: null,
  }),
  // ── Shared painted routine (assigned via task_assignments, not assignee_id) ──
  base({
    label: 'shared-painted-via-assignments',
    assignee_id: OTHER_MEMBER,
    assigned_via_assignments: true,
    is_shared: true,
    recurrence_details: {
      schedule_type: 'painted',
      rdates: [ymd(2026, 5, 19), ymd(2026, 5, 20)],
      exdates: [],
      until: ymd(2026, 5, 20),
    },
  }),
  // ── Archived-mid-window painted (archived 5/20) ──
  base({
    label: 'painted-archived-midwindow',
    archived_at: '2026-05-20T12:00:00Z',
    recurrence_details: {
      schedule_type: 'painted',
      rdates: [ymd(2026, 5, 18), ymd(2026, 5, 22)],
      exdates: [],
      until: ymd(2026, 5, 22),
    },
  }),
]

// ── 30-day window ───────────────────────────────────────────────────────

function windowDates(): string[] {
  const out: string[] = []
  const start = new Date('2026-05-10T00:00:00')
  for (let i = 0; i < 30; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return out
}

// ── The invariant ───────────────────────────────────────────────────────
//
// For every (corpus row, date) pair, the SCHEDULE decision of the TS
// reference must agree with the SQL Layer 1 mirror's SCHEDULE decision.
//
// recurringTaskFilter does NOT model assignee/archived/created gating — so to
// compare apples to apples we evaluate the TS reference against the SCHEDULE
// portion only, and assert that whenever the gates pass, schedule decisions
// agree; and whenever a gate fails, the SQL mirror hides regardless.

describe('Member-Day obligation invariant: TS recurringTaskFilter === SQL Layer 1', () => {
  const dates = windowDates()

  for (const task of corpus) {
    it(`agrees on all 30 days for "${task.label}"`, () => {
      const disagreements: Array<{ date: string; ts: boolean; sql: boolean; gatePass: boolean }> = []
      for (const dateIso of dates) {
        const dateMidday = new Date(dateIso + 'T12:00:00')

        // Gate status (archived / created / assignee), evaluated the same way
        // the SQL mirror does.
        let gatePass = true
        if (task.archived_at && task.archived_at.slice(0, 10) < dateIso) gatePass = false
        if (task.created_at) {
          const datePlus1 = new Date(dateIso + 'T00:00:00')
          datePlus1.setDate(datePlus1.getDate() + 1)
          const datePlus1Iso = `${datePlus1.getFullYear()}-${String(datePlus1.getMonth() + 1).padStart(2, '0')}-${String(datePlus1.getDate()).padStart(2, '0')}`
          if (task.created_at.slice(0, 10) > datePlus1Iso) gatePass = false
        }
        if (!(task.assignee_id === MEMBER || task.assigned_via_assignments)) gatePass = false

        const tsSchedule = isRecurringTaskVisibleToday(toTask(task), dateMidday)
        const sqlActive = sqlLayer1Mirror(task, dateIso)

        // Expected SQL result = gate AND tsSchedule.
        const expectedSql = gatePass && tsSchedule
        if (sqlActive !== expectedSql) {
          disagreements.push({ date: dateIso, ts: tsSchedule, sql: sqlActive, gatePass })
        }
      }
      expect(disagreements, `disagreements for ${task.label}: ${JSON.stringify(disagreements)}`).toEqual([])
    })
  }

  it('production bug repro: painted-no-until is HIDDEN after its last rdate', () => {
    const task = corpus.find(t => t.label === 'painted-no-until')!
    // last rdate is 2026-05-23; 5/24 onward must be hidden
    expect(sqlLayer1Mirror(task, ymd(2026, 5, 23))).toBe(true)
    expect(sqlLayer1Mirror(task, ymd(2026, 5, 24))).toBe(false)
    expect(sqlLayer1Mirror(task, ymd(2026, 5, 25))).toBe(false)
    // and the TS reference agrees
    expect(isRecurringTaskVisibleToday(toTask(task), new Date(ymd(2026, 5, 24) + 'T12:00:00'))).toBe(false)
  })

  it('assignee gate: a task assigned to someone else (no assignments row) is never active for MEMBER', () => {
    const t = base({
      label: 'not-mine',
      assignee_id: OTHER_MEMBER,
      assigned_via_assignments: false,
      recurrence_rule: 'daily',
      recurrence_details: { schedule_type: 'recurring', rrule: 'FREQ=DAILY' },
    })
    for (const dateIso of windowDates()) {
      expect(sqlLayer1Mirror(t, dateIso)).toBe(false)
    }
  })

  it('archived gate: archived-before-date hides even on a painted rdate', () => {
    const t = base({
      label: 'archived-early',
      archived_at: '2026-05-12T00:00:00Z',
      recurrence_details: { schedule_type: 'painted', rdates: [ymd(2026, 5, 20)], exdates: [], until: ymd(2026, 5, 20) },
    })
    // 5/20 is a painted rdate but the task was archived 5/12 → hidden
    expect(sqlLayer1Mirror(t, ymd(2026, 5, 20))).toBe(false)
  })
})
