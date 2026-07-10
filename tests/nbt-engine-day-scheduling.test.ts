/**
 * Next Best Thing — day-scheduling fix (GDCX Slice 1, PRD-25).
 *
 * Root cause: `useNBTEngine` computed suggestions from the raw assigned+active
 * task list without ever applying `filterTasksForToday` (the same day-of-week/
 * dtstart/painted-schedule filter `GuidedActiveTasksSection`, `Tasks.tsx`, and
 * `PlayDashboard.tsx` all apply before rendering "today's" tasks). The result:
 * an MWF routine could get suggested as the "Next Best Thing" on a Tuesday, or
 * a routine whose dtstart hadn't arrived yet could surface early. Founder
 * disabled the whole section 2026-05-03 over exactly this complaint.
 *
 * `computeNBTSuggestions` is the pure priority-computation core extracted from
 * the hook specifically so this fix can be pinned deterministically — no
 * React, no mocked hooks, no dependence on a real family's seed data. This
 * suite proves both directions: a task NOT scheduled for today never
 * surfaces, and a task genuinely scheduled for today still does (the fix
 * isn't over-broad).
 *
 * Manually verified against pre-fix code: reverting `computeNBTSuggestions`
 * to feed `tasks` directly into the priority loop (skipping the
 * `filterTasksForToday` call) makes "wrong day" below fail — the routine's
 * title appears in the suggestions array as an 'unscheduled' entry.
 */
import { describe, it, expect } from 'vitest'
import { computeNBTSuggestions } from '@/hooks/useNBTEngine'
import type { Task, TaskType, TaskStatus } from '@/types/tasks'
import type { BestIntention } from '@/hooks/useBestIntentions'

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function makeTask(overrides: Partial<Task> & { id: string; title: string }): Task {
  return {
    id: overrides.id,
    family_id: 'family-1',
    created_by: 'mom-1',
    assignee_id: 'kid-1',
    template_id: null,
    title: overrides.title,
    description: null,
    task_type: 'task' as TaskType,
    status: 'pending' as TaskStatus,
    priority: null,
    due_date: null,
    due_time: null,
    points_override: null,
    recurrence_rule: null,
    recurrence_details: null,
    ...overrides,
  } as unknown as Task
}

const NO_INTENTIONS: BestIntention[] = []

describe('computeNBTSuggestions — day scheduling (GDCX Slice 1)', () => {
  it('a routine recurring on a day OTHER than today is never suggested', () => {
    const today = '2026-07-13' // a Monday
    const todayDate = new Date(2026, 6, 13)
    const todayDow = todayDate.getDay() // 1 = Monday
    // Pick a weekday that is definitely NOT today's weekday.
    const wrongDayCode = DAY_CODES[(todayDow + 3) % 7]

    const wrongDayRoutine = makeTask({
      id: 'wrong-day-routine',
      title: 'GDCXTEST Wrong-Day Routine',
      task_type: 'routine',
      status: 'pending',
      recurrence_rule: 'weekly',
      recurrence_details: {
        rrule: `FREQ=WEEKLY;BYDAY=${wrongDayCode}`,
        dtstart: '2026-01-05T00:00:00',
      },
    })

    const suggestions = computeNBTSuggestions([wrongDayRoutine], NO_INTENTIONS, 'kid-1', today)

    expect(suggestions.some(s => s.title === 'GDCXTEST Wrong-Day Routine')).toBe(false)
  })

  it('a routine recurring on TODAY is suggested (the fix is not over-broad)', () => {
    const today = '2026-07-13' // a Monday
    const todayDate = new Date(2026, 6, 13)
    const todayCode = DAY_CODES[todayDate.getDay()]

    const todayRoutine = makeTask({
      id: 'today-routine',
      title: 'GDCXTEST Today Routine',
      task_type: 'routine',
      status: 'pending',
      recurrence_rule: 'weekly',
      recurrence_details: {
        rrule: `FREQ=WEEKLY;BYDAY=${todayCode}`,
        dtstart: '2026-01-05T00:00:00',
      },
    })

    const suggestions = computeNBTSuggestions([todayRoutine], NO_INTENTIONS, 'kid-1', today)

    expect(suggestions.some(s => s.title === 'GDCXTEST Today Routine')).toBe(true)
  })

  it('a plain one-time task with no recurrence is suggested regardless of weekday', () => {
    const today = '2026-07-13'
    const oneTimeTask = makeTask({
      id: 'one-time-task',
      title: 'GDCXTEST One-Time Task',
      task_type: 'task',
      status: 'pending',
    })

    const suggestions = computeNBTSuggestions([oneTimeTask], NO_INTENTIONS, 'kid-1', today)

    expect(suggestions.some(s => s.title === 'GDCXTEST One-Time Task')).toBe(true)
  })

  it('a routine whose dtstart is in the future is not suggested yet', () => {
    const today = '2026-07-13'
    const futureRoutine = makeTask({
      id: 'future-routine',
      title: 'GDCXTEST Future-Start Routine',
      task_type: 'routine',
      status: 'pending',
      recurrence_rule: 'weekly',
      recurrence_details: {
        rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU', // every day, so only dtstart gates it
        dtstart: '2026-12-01', // far future
      },
    })

    const suggestions = computeNBTSuggestions([futureRoutine], NO_INTENTIONS, 'kid-1', today)

    expect(suggestions.some(s => s.title === 'GDCXTEST Future-Start Routine')).toBe(false)
  })

  it('an overdue non-recurring task still surfaces as Priority 1 (overdue)', () => {
    const today = '2026-07-13'
    const overdueTask = makeTask({
      id: 'overdue-task',
      title: 'GDCXTEST Overdue Task',
      task_type: 'task',
      status: 'pending',
      due_date: '2026-07-10',
    })

    const suggestions = computeNBTSuggestions([overdueTask], NO_INTENTIONS, 'kid-1', today)

    expect(suggestions[0]?.type).toBe('overdue_task')
    expect(suggestions[0]?.title).toBe('GDCXTEST Overdue Task')
  })

  it('returns no suggestions when memberId is undefined', () => {
    const suggestions = computeNBTSuggestions([], NO_INTENTIONS, undefined, '2026-07-13')
    expect(suggestions).toEqual([])
  })
})
