// PRD-28 ALLOWANCE-EDIT-WEEK (2026-04-25) — data hook for the per-kid
// see-full-week routine edit page.
//
// Loads:
//   - The kid's active period (period_start..period_end)
//   - All routine tasks counts_for_allowance OR not (mom may want to
//     edit non-allowance routines too; we show all routines for context)
//   - Their template sections + steps
//   - All routine_step_completions inside the active period
//
// Returns a structured `WeekViewData` the page renders against.
//
// Hard rule per founder 2026-04-25: no backend changes. The trigger
// keeps period_date = local-day-of-completion. This view DISPLAYS
// per-day breakdowns by intersecting (scheduled-for-this-day-DOW)
// with (completions on this day). Stale "wrong-day" checks (steps
// from a section not scheduled for the click day) live in the DB but
// don't render here — mom only sees the day's actual scheduled work.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface RoutineWeekStep {
  step_id: string
  step_name: string
  /** True iff a routine_step_completion exists for this step on this date. */
  is_checked: boolean
  /** completion_id if checked — needed to delete on uncheck. */
  completion_id: string | null
}

export interface RoutineWeekDayCell {
  task_id: string
  task_title: string
  section_id: string
  section_name: string
  steps: RoutineWeekStep[]
  /** Total scheduled steps for this day-cell (clamps display denominator). */
  scheduled_count: number
  /** Count of checked steps; always ≤ scheduled_count by construction. */
  checked_count: number
}

export interface RoutineWeekDay {
  iso: string                  // YYYY-MM-DD
  weekday: string              // 'Sun'..'Sat'
  is_today: boolean
  is_future: boolean
  cells: RoutineWeekDayCell[]
  /** Aggregate across all cells for this day. */
  total_scheduled: number
  total_checked: number
}

export interface WeekViewData {
  period_id: string
  period_start: string
  period_end: string
  days: RoutineWeekDay[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function useRoutineWeekView(memberId: string | undefined, todayIso: string) {
  return useQuery({
    queryKey: ['routine-week-view', memberId, todayIso],
    enabled: !!memberId && !!todayIso,
    queryFn: async (): Promise<WeekViewData | null> => {
      if (!memberId) return null

      // 1. Active period
      const { data: period } = await supabase
        .from('allowance_periods')
        .select('id, period_start, period_end')
        .eq('family_member_id', memberId)
        .in('status', ['active', 'makeup_window'])
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!period) return null

      // 2. Routine tasks for this kid
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, template_id')
        .eq('assignee_id', memberId)
        .eq('task_type', 'routine')
        .is('archived_at', null)
      const taskList = tasks ?? []
      const templateIds = taskList.map(t => t.template_id).filter((x): x is string => !!x)

      // 3. Sections for those templates
      const { data: sections } = templateIds.length > 0
        ? await supabase
            .from('task_template_sections')
            .select('id, template_id, section_name, frequency_days')
            .in('template_id', templateIds)
            .order('sort_order')
        : { data: [] as Array<{ id: string; template_id: string; section_name: string; frequency_days: string[] }> }
      const sectionList = sections ?? []

      // 4. Steps for those sections
      const sectionIds = sectionList.map(s => s.id)
      const { data: steps } = sectionIds.length > 0
        ? await supabase
            .from('task_template_steps')
            .select('id, section_id, step_name, title, sort_order')
            .in('section_id', sectionIds)
            .order('sort_order')
        : { data: [] as Array<{ id: string; section_id: string; step_name: string | null; title: string | null; sort_order: number }> }
      const stepList = steps ?? []

      // 5. Completions in this period
      const { data: completions } = await supabase
        .from('routine_step_completions')
        .select('id, task_id, step_id, period_date')
        .eq('member_id', memberId)
        .gte('period_date', period.period_start)
        .lte('period_date', period.period_end)
      const completionList = completions ?? []

      // Index completions by (step_id, period_date)
      const completionByKey = new Map<string, { id: string; task_id: string }>()
      for (const c of completionList) {
        const key = `${c.step_id}|${c.period_date}`
        completionByKey.set(key, { id: c.id as string, task_id: c.task_id as string })
      }

      // 6. Walk the period day-by-day, building cells
      const days: RoutineWeekDay[] = []
      const start = new Date(period.period_start + 'T12:00:00Z')
      const end = new Date(period.period_end + 'T12:00:00Z')
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const iso = d.toISOString().slice(0, 10)
        const dow = d.getUTCDay()
        const dowStr = String(dow)

        const cells: RoutineWeekDayCell[] = []
        for (const task of taskList) {
          const taskSections = sectionList.filter(
            s => s.template_id === task.template_id && (s.frequency_days as string[]).includes(dowStr),
          )
          for (const section of taskSections) {
            const sectionSteps = stepList.filter(s => s.section_id === section.id)
            const cellSteps: RoutineWeekStep[] = sectionSteps.map(s => {
              const completion = completionByKey.get(`${s.id}|${iso}`)
              return {
                step_id: s.id,
                step_name: (s.step_name ?? s.title ?? 'Step') as string,
                is_checked: !!completion,
                completion_id: completion?.id ?? null,
              }
            })
            const checkedCount = cellSteps.filter(s => s.is_checked).length
            cells.push({
              task_id: task.id,
              task_title: task.title,
              section_id: section.id,
              section_name: section.section_name,
              steps: cellSteps,
              scheduled_count: cellSteps.length,
              checked_count: Math.min(checkedCount, cellSteps.length),
            })
          }
        }

        days.push({
          iso,
          weekday: WEEKDAYS[dow],
          is_today: iso === todayIso,
          is_future: iso > todayIso,
          cells,
          total_scheduled: cells.reduce((sum, c) => sum + c.scheduled_count, 0),
          total_checked: cells.reduce((sum, c) => sum + c.checked_count, 0),
        })
      }

      return {
        period_id: period.id as string,
        period_start: period.period_start as string,
        period_end: period.period_end as string,
        days,
      }
    },
  })
}
