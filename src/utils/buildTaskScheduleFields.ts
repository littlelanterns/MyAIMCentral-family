// Bridges modal schedule UI state to database columns (due_date, recurrence_rule, recurrence_details).
// Without this, schedule data collected in TaskCreationModal was silently discarded.
//
// `familyToday` is the family-timezone-derived "today" in YYYY-MM-DD, obtained by
// the caller via `fetchFamilyToday(memberId)` from useFamilyToday. Row 184 NEW-DD
// Path 2: due_date is not derived from a timestamp column (it's a scheduled future
// date), so a server-side trigger cannot fix it — the client must write the
// correct value. See Convention #257.

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
  if (data.scheduleMode === 'one_time' && data.dueDate) {
    return { due_date: data.dueDate, recurrence_rule: null, recurrence_details: null }
  }

  if (data.scheduleMode === 'daily') {
    return {
      due_date: familyToday,
      recurrence_rule: 'daily',
      recurrence_details: { rrule: 'FREQ=DAILY', dtstart: familyToday, schedule_type: 'recurring' },
    }
  }

  if (data.scheduleMode === 'weekly' && data.weeklyDays && data.weeklyDays.length > 0) {
    // Week-arithmetic uses a Date object seeded from familyToday to keep day-of-week
    // aligned to the family's calendar day, not the clicking device's day.
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
    const dueDate = localIso(nextDate)
    const byDay = data.weeklyDays.map(d => dayToRRule(d)).join(',')
    return {
      due_date: dueDate,
      recurrence_rule: 'weekly',
      recurrence_details: { rrule: `FREQ=WEEKLY;BYDAY=${byDay}`, dtstart: dueDate, schedule_type: 'recurring' },
    }
  }

  if (data.scheduleMode === 'custom' && data.schedule) {
    const dueDate = data.schedule.dtstart ?? familyToday
    return {
      due_date: dueDate,
      recurrence_rule: 'custom',
      recurrence_details: data.schedule as unknown as Record<string, unknown>,
    }
  }

  return { due_date: null, recurrence_rule: null, recurrence_details: null }
}
