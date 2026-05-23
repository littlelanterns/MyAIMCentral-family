/**
 * Painted-routine visibility — unit tests for isRecurringTaskVisibleToday.
 *
 * The bug this guards: pre-fix, a routine with schedule_type='painted' and no
 * recurrence_rule would fall through to the "no recurrence → show" branch and
 * render every day after dtstart. The fix adds a painted branch that only
 * returns true when today is in rdates (and not in exdates).
 *
 * E2E coverage for the same fix lives in:
 *   tests/e2e/features/routine-painted-dashboard-visibility.spec.ts
 */
import { isRecurringTaskVisibleToday } from '../../src/lib/tasks/recurringTaskFilter'
import type { Task } from '../../src/types/tasks'

function makeRoutine(details: Record<string, unknown> | null, due_date: string | null = null): Task {
  return {
    id: 'test-task',
    family_id: 'fam',
    created_by: 'mom',
    assignee_id: null,
    title: 'test',
    description: null,
    task_type: 'routine',
    status: 'pending',
    priority: null,
    due_date,
    due_time: null,
    recurrence_details: details,
    recurrence_rule: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  } as unknown as Task
}

describe('isRecurringTaskVisibleToday — painted routines', () => {
  const may23 = new Date(2026, 4, 23) // May 23, 2026 local

  test('painted: today in rdates → visible', () => {
    const task = makeRoutine({
      dtstart: '2026-05-18',
      schedule_type: 'painted',
      rdates: ['2026-05-18', '2026-05-19', '2026-05-23'],
    })
    expect(isRecurringTaskVisibleToday(task, may23)).toBe(true)
  })

  test('painted: today NOT in rdates → hidden (no infinite-recur fallthrough)', () => {
    const task = makeRoutine({
      dtstart: '2026-05-18',
      schedule_type: 'painted',
      rdates: ['2026-05-18', '2026-05-19'], // ends before today
    })
    expect(isRecurringTaskVisibleToday(task, may23)).toBe(false)
  })

  test('painted: today in rdates AND in exdates → hidden', () => {
    const task = makeRoutine({
      dtstart: '2026-05-18',
      schedule_type: 'painted',
      rdates: ['2026-05-18', '2026-05-23'],
      exdates: ['2026-05-23'],
    })
    expect(isRecurringTaskVisibleToday(task, may23)).toBe(false)
  })

  test('painted: dtstart in future → hidden (advance-start gate fires first)', () => {
    const task = makeRoutine({
      dtstart: '2026-06-01',
      schedule_type: 'painted',
      rdates: ['2026-05-23'], // even if today is in rdates, dtstart wins
    })
    expect(isRecurringTaskVisibleToday(task, may23)).toBe(false)
  })

  test('painted: only future rdates → hidden', () => {
    const task = makeRoutine({
      dtstart: '2026-05-18',
      schedule_type: 'painted',
      rdates: ['2026-05-24', '2026-05-25'],
    })
    expect(isRecurringTaskVisibleToday(task, may23)).toBe(false)
  })

  test('regression: recurring with no rrule still passes (not painted)', () => {
    const task = makeRoutine({
      dtstart: '2026-05-18',
      schedule_type: 'recurring',
    })
    // No recurrence_rule + no painted branch hit → falls through to "no
    // recurrence at all → always visible" (legacy behavior preserved)
    expect(isRecurringTaskVisibleToday(task, may23)).toBe(true)
  })
})
