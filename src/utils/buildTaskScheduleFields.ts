// Computes due_date, recurrence_rule, and recurrence_details from CreateTaskData schedule fields.
// Used by all handleCreateTask handlers (Tasks.tsx, MomShell, AdultShell, IndependentShell).

import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'

const RRULE_DAY_NAMES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

interface TaskScheduleFields {
  due_date: string | null
  recurrence_rule: string | null
  recurrence_details: Record<string, unknown> | null
}

export function buildTaskScheduleFields(data: CreateTaskData): TaskScheduleFields {
  if (data.scheduleMode === 'one_time' && data.dueDate) {
    return { due_date: data.dueDate, recurrence_rule: null, recurrence_details: null }
  }

  if (data.scheduleMode === 'daily') {
    const today = new Date().toISOString().split('T')[0]
    return {
      due_date: today,
      recurrence_rule: 'daily',
      recurrence_details: { rrule: 'FREQ=DAILY', dtstart: today, schedule_type: 'recurring' },
    }
  }

  if (data.scheduleMode === 'weekly' && data.weeklyDays && data.weeklyDays.length > 0) {
    const today = new Date()
    const todayDow = today.getDay()
    const sortedDays = [...data.weeklyDays].sort((a, b) => a - b)
    let nextDay = sortedDays.find(d => d >= todayDow)
    if (nextDay === undefined) nextDay = sortedDays[0]
    let daysUntil = nextDay - todayDow
    if (daysUntil < 0) daysUntil += 7
    const nextDate = new Date(today)
    nextDate.setDate(nextDate.getDate() + daysUntil)
    const dueDate = nextDate.toISOString().split('T')[0]
    const byDay = data.weeklyDays.map(d => RRULE_DAY_NAMES[d]).join(',')
    return {
      due_date: dueDate,
      recurrence_rule: 'weekly',
      recurrence_details: { rrule: `FREQ=WEEKLY;BYDAY=${byDay}`, dtstart: dueDate, schedule_type: 'recurring' },
    }
  }

  if (data.scheduleMode === 'custom' && data.schedule) {
    const dueDate = data.schedule.dtstart ?? new Date().toISOString().split('T')[0]
    return {
      due_date: dueDate,
      recurrence_rule: 'custom',
      recurrence_details: data.schedule as unknown as Record<string, unknown>,
    }
  }

  return { due_date: null, recurrence_rule: null, recurrence_details: null }
}
