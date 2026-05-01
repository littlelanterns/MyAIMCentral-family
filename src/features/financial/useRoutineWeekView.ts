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
  /** Who completed this step (null if unchecked). For shared routines, may differ from the viewed member. */
  completed_by_member_id: string | null
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
  period_id: string | null
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

      // 1. Active period — fall back to last 7 days when no allowance configured
      const { data: period } = await supabase
        .from('allowance_periods')
        .select('id, period_start, period_end')
        .eq('family_member_id', memberId)
        .in('status', ['active', 'makeup_window'])
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle()

      let periodId: string | null = period?.id as string | null ?? null
      let periodStart: string
      let periodEnd: string
      if (period) {
        periodStart = period.period_start as string
        periodEnd = period.period_end as string
      } else {
        periodEnd = todayIso
        const d = new Date(todayIso + 'T12:00:00Z')
        d.setUTCDate(d.getUTCDate() - 6)
        // eslint-disable-next-line no-restricted-syntax -- d is explicitly UTC-constructed; UTC slice is correct
        periodStart = d.toISOString().slice(0, 10)
        periodId = null
      }

      // 2. Routine tasks for this kid (including shared via task_assignments)
      const { data: directTasks } = await supabase
        .from('tasks')
        .select('id, title, template_id, is_shared')
        .eq('assignee_id', memberId)
        .eq('task_type', 'routine')
        .is('archived_at', null)
      const { data: sharedAssignments } = await supabase
        .from('task_assignments')
        .select('task_id')
        .eq('family_member_id', memberId)
        .eq('is_active', true)
      const sharedTaskIds = (sharedAssignments ?? []).map(a => a.task_id)
      const directList = directTasks ?? []
      const directIds = new Set(directList.map(t => t.id))
      let extraShared: typeof directList = []
      if (sharedTaskIds.length > 0) {
        const missing = sharedTaskIds.filter(id => !directIds.has(id))
        if (missing.length > 0) {
          const { data: extra } = await supabase
            .from('tasks')
            .select('id, title, template_id, is_shared')
            .in('id', missing)
            .eq('task_type', 'routine')
            .is('archived_at', null)
          extraShared = extra ?? []
        }
      }
      const taskList = [...directList, ...extraShared]
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

      // 5. Completions in this period — for shared tasks, load ALL members
      const sharedIds = taskList.filter(t => t.is_shared).map(t => t.id)
      const personalIds = taskList.filter(t => !t.is_shared).map(t => t.id)

      let completionList: Array<{ id: string; task_id: string; step_id: string; period_date: string; family_member_id: string }> = []
      if (personalIds.length > 0) {
        const { data } = await supabase
          .from('routine_step_completions')
          .select('id, task_id, step_id, period_date, family_member_id')
          .eq('member_id', memberId)
          .in('task_id', personalIds)
          .gte('period_date', periodStart)
          .lte('period_date', periodEnd)
        completionList.push(...((data ?? []) as typeof completionList))
      }
      if (sharedIds.length > 0) {
        const { data } = await supabase
          .from('routine_step_completions')
          .select('id, task_id, step_id, period_date, family_member_id')
          .in('task_id', sharedIds)
          .gte('period_date', periodStart)
          .lte('period_date', periodEnd)
        completionList.push(...((data ?? []) as typeof completionList))
      }

      // Index completions by (step_id, period_date) — first completion wins for display
      const completionByKey = new Map<string, { id: string; task_id: string; family_member_id: string }>()
      for (const c of completionList) {
        const key = `${c.step_id}|${c.period_date}`
        if (!completionByKey.has(key)) {
          completionByKey.set(key, { id: c.id as string, task_id: c.task_id as string, family_member_id: c.family_member_id as string })
        }
      }

      // 6. Walk the period day-by-day, building cells
      const days: RoutineWeekDay[] = []
      const start = new Date(periodStart + 'T12:00:00Z')
      const end = new Date(periodEnd + 'T12:00:00Z')
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        // eslint-disable-next-line no-restricted-syntax -- d is explicitly UTC-constructed via 'T12:00:00Z' + setUTCDate; UTC slice is correct here
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
                completed_by_member_id: completion?.family_member_id ?? null,
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
        period_id: periodId,
        period_start: periodStart,
        period_end: periodEnd,
        days,
      }
    },
  })
}
