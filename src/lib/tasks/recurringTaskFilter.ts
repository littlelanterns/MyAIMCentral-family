/**
 * Recurring Task Visibility Filter
 *
 * Evaluates whether a recurring task should be visible on a given day based
 * on its recurrence_details RRULE. Tasks with no recurrence, or with
 * recurrence_rule='none', always show. Non-recurring overdue tasks always show.
 *
 * Uses rrule.js (already installed for PRD-35 Universal Scheduler).
 */

import { RRule } from 'rrule'
import type { Task } from '@/types/tasks'

/**
 * Check whether a recurring task should be visible today.
 *
 * Returns true (show) when:
 *   - Task has no recurrence_details or no rrule string
 *   - Task's recurrence_rule is null
 *   - Today matches the RRULE pattern
 *   - Task is completion_dependent (no calendar schedule)
 *
 * Returns false (hide) when:
 *   - Task has a valid RRULE and today does NOT match the pattern
 */
export function isRecurringTaskVisibleToday(task: Task, today?: Date): boolean {
  const now = today ?? new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  // For routines, `tasks.due_date` is the "Run until" end date set in the
  // TaskCreationModal "How Long Should This Run?" picker (not a deadline).
  // When today is past the end date, the routine has ended — drop it off
  // the dashboard. Completion history is preserved via `task_completions`
  // and feeds allowance/gamification without the task staying visible.
  // This applies whether or not the task has a recurrence_rule — many
  // routines rely on per-section frequency and carry no RRULE on the task
  // row itself.
  if (task.task_type === 'routine' && task.due_date) {
    const endDate = new Date(task.due_date + 'T23:59:59')
    if (endDate < startOfToday) return false
  }

  // No recurrence at all — always visible
  if (!task.recurrence_rule) {
    return true
  }

  const details = task.recurrence_details as Record<string, unknown> | null
  if (!details) return true

  const rruleStr = details.rrule as string | undefined
  if (!rruleStr || typeof rruleStr !== 'string') return true

  // completion_dependent tasks show when they're pending — they don't follow a calendar
  if (task.recurrence_rule === 'completion_dependent') {
    return true
  }

  try {
    // Parse the RRULE string
    const rule = RRule.fromString(rruleStr)

    // Build a full rule with dtstart if available
    const dtstart = details.dtstart
      ? new Date(details.dtstart as string)
      : task.due_date
        ? new Date(task.due_date + 'T00:00:00')
        : new Date('2020-01-01T00:00:00')

    // Per PRD-35 the RRULE end date may be stored as recurrence_details.until
    // (or recurrence_details.end_date) as a separate field rather than baked
    // into the RRULE string. schedulerUtils.ts does the same injection when
    // generating preview instances; this filter must match.
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

    // Check if today falls on a recurrence day.
    // We check a window from start-of-today to end-of-today.
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    const occurrences = fullRule.between(dayStart, dayEnd, true)
    return occurrences.length > 0
  } catch {
    // If RRULE parsing fails, show the task (don't hide data on a parse error)
    return true
  }
}

/**
 * Filter an array of tasks to only those visible today.
 *
 * Non-recurring tasks always pass through.
 * Recurring tasks are filtered by their RRULE schedule.
 * Completed/cancelled tasks are not filtered (caller handles status filtering).
 */
export function filterTasksForToday<T extends Task>(tasks: T[], today?: Date): T[] {
  return tasks.filter(task => isRecurringTaskVisibleToday(task, today))
}
