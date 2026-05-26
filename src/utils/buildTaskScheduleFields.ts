// Bridges modal schedule UI state to database columns (due_date, recurrence_rule, recurrence_details).
//
// due_date is OPT-IN, DEADLINE-ONLY. It is set ONLY when mom explicitly assigns a
// deadline. Recurring schedule anchors use recurrence_details.dtstart, not due_date.
// Routine end-dates use recurrence_details.until, not due_date.
//
// `familyToday` is the family-timezone-derived "today" in YYYY-MM-DD, obtained by
// the caller via `fetchFamilyToday(memberId)` from useFamilyToday. See Convention #257.

import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { dayToRRule } from '@/components/scheduling/schedulerUtils'
import { localIso } from '@/utils/dates'

interface TaskScheduleFields {
  due_date: string | null
  recurrence_rule: string | null
  recurrence_details: Record<string, unknown> | null
}

export function buildTaskScheduleFields(
  data: CreateTaskData,
  familyToday: string,
): TaskScheduleFields {
  // Routines never get a due_date. The "Run until" end date lives in
  // recurrence_details.until so it doesn't trigger deadline display logic.
  if (data.taskType === 'routine') {
    // Painted: preserve full SchedulerOutput shape so rdates round-trip.
    // Without this branch, RoutineDeployModal's painted dates would be silently
    // stripped to a recurring-shape envelope and the dashboard would render
    // the routine every day after dtstart instead of only on painted days.
    if (
      data.schedule?.schedule_type === 'painted' &&
      Array.isArray(data.schedule.rdates) &&
      data.schedule.rdates.length > 0
    ) {
      const sortedRdates = [...data.schedule.rdates].sort()
      const details: Record<string, unknown> = {
        dtstart: data.startDate || sortedRdates[0],
        schedule_type: 'painted',
        rdates: sortedRdates,
        until: sortedRdates[sortedRdates.length - 1],
      }
      if (Array.isArray(data.schedule.exdates) && data.schedule.exdates.length > 0) {
        details.exdates = data.schedule.exdates
      }
      if (data.schedule.timezone) details.timezone = data.schedule.timezone
      return {
        due_date: null,
        recurrence_rule: null,
        recurrence_details: details,
      }
    }
    const dtstart = data.startDate || familyToday
    const details: Record<string, unknown> = { dtstart, schedule_type: 'recurring' }
    if (data.dueDate) details.until = data.dueDate
    return {
      due_date: null,
      recurrence_rule: null,
      recurrence_details: details,
    }
  }

  if (data.scheduleMode === 'one_time' && data.dueDate) {
    return { due_date: data.dueDate, recurrence_rule: null, recurrence_details: null }
  }

  if (data.scheduleMode === 'daily') {
    return {
      due_date: data.dueDate || null,
      recurrence_rule: 'daily',
      recurrence_details: { rrule: 'FREQ=DAILY', dtstart: familyToday, schedule_type: 'recurring' },
    }
  }

  if (data.scheduleMode === 'weekly' && data.weeklyDays && data.weeklyDays.length > 0) {
    const [y, m, d] = familyToday.split('-').map(Number)
    const today = new Date(y, m - 1, d)
    const todayDow = today.getDay()
    const sortedDays = [...data.weeklyDays].sort((a, b) => a - b)
    let nextDay = sortedDays.find(d => d >= todayDow)
    if (nextDay === undefined) nextDay = sortedDays[0]
    let daysUntil = nextDay - todayDow
    if (daysUntil < 0) daysUntil += 7
    const nextDate = new Date(today)
    nextDate.setDate(nextDate.getDate() + daysUntil)
    const dtstart = localIso(nextDate)
    const byDay = data.weeklyDays.map(d => dayToRRule(d)).join(',')
    return {
      due_date: data.dueDate || null,
      recurrence_rule: 'weekly',
      recurrence_details: { rrule: `FREQ=WEEKLY;BYDAY=${byDay}`, dtstart, schedule_type: 'recurring' },
    }
  }

  if (data.scheduleMode === 'custom' && data.schedule) {
    return {
      due_date: data.dueDate || null,
      recurrence_rule: 'custom',
      recurrence_details: data.schedule as unknown as Record<string, unknown>,
    }
  }

  return { due_date: null, recurrence_rule: null, recurrence_details: null }
}
