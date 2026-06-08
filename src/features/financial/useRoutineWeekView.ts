// PRD-28 ALLOWANCE-EDIT-WEEK (2026-04-25) — data hook for the per-kid
// see-full-week routine edit page.
//
// Convention #271 (Member-Day Task State, 2026-05-28): the per-day "what is
// scheduled for this kid on this date" derivation now comes from the single
// canonical query `get_member_day_obligations`, NOT from re-deriving the
// schedule rules inline. The old inline filter (lines ~175-195) only checked
// `until`/`dtstart` and never honored painted `rdates`, so past-end-date
// painted routines silently appeared in the denominator. The RPC gates each
// day through `obligation_active_for_member_on_date` (Layer 1), which honors
// painted rdates/exdates, until, dtstart, archived, created, and assignee.
//
// This hook:
//   - Resolves the period (requested → active → 7-day fallback; Convention #270)
//   - Calls get_member_day_obligations(member, period_start, period_end) to get
//     the (date, task, section, step) rows that count
//   - Joins task titles / section names / step names (the RPC returns IDs)
//   - Loads routine_step_completions in the period for the checked state +
//     completer attribution (shared routines load all members; Convention #266)
//   - Assembles the same `WeekViewData` shape the page renders against
//
// Display layout, columns, copy, day grouping — all unchanged. Data source swap.

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

export function useAllowancePeriods(memberId: string | undefined) {
  return useQuery({
    queryKey: ['allowance-periods-list', memberId],
    enabled: !!memberId,
    queryFn: async () => {
      if (!memberId) return []
      const { data } = await supabase
        .from('allowance_periods')
        .select('id, period_start, period_end, status')
        .eq('family_member_id', memberId)
        .order('period_start', { ascending: false })
        .limit(20)
      return (data ?? []) as Array<{ id: string; period_start: string; period_end: string; status: string }>
    },
  })
}

export function useRoutineWeekView(memberId: string | undefined, todayIso: string, selectedPeriodId?: string | null) {
  return useQuery({
    queryKey: ['routine-week-view', memberId, todayIso, selectedPeriodId ?? 'active'],
    enabled: !!memberId && !!todayIso,
    queryFn: async (): Promise<WeekViewData | null> => {
      if (!memberId) return null

      // 1. Load the requested period, or fall back to active period, or last 7 days
      type PeriodRow = { id: string; period_start: string; period_end: string }
      let period: PeriodRow | null = null

      if (selectedPeriodId) {
        const { data } = await supabase
          .from('allowance_periods')
          .select('id, period_start, period_end')
          .eq('id', selectedPeriodId)
          .eq('family_member_id', memberId)
          .maybeSingle()
        period = data as PeriodRow | null
      }

      if (!period) {
        const { data } = await supabase
          .from('allowance_periods')
          .select('id, period_start, period_end')
          .eq('family_member_id', memberId)
          .in('status', ['active', 'makeup_window'])
          .order('period_start', { ascending: false })
          .limit(1)
          .maybeSingle()
        period = data as PeriodRow | null
      }

      let periodId: string | null = period?.id ?? null
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

      // 2. Canonical obligations for this kid across the period (Convention #271).
      // ONE round-trip to get_member_day_obligations replaces the inline
      // task-filter + per-DOW day-walk. Each row is a (date, task, section, step)
      // that counts for this kid on that day — painted rdates, until, dtstart,
      // archived, created, and assignee are all honored server-side by Layer 1.
      type ObligationRow = {
        date: string
        source_type: string
        task_id: string
        template_id: string | null
        section_id: string | null
        step_id: string | null
      }
      const { data: obligationsRaw, error: obligationsError } = await supabase
        .rpc('get_member_day_obligations', {
          p_member_id: memberId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
        })
      if (obligationsError) throw obligationsError
      const obligations = ((obligationsRaw ?? []) as ObligationRow[])
        .filter(o => o.source_type === 'routine_step')

      // 3. Join human-readable names (the RPC returns IDs only).
      const taskIds = [...new Set(obligations.map(o => o.task_id))]
      const sectionIds = [...new Set(obligations.map(o => o.section_id).filter((x): x is string => !!x))]
      const stepIds = [...new Set(obligations.map(o => o.step_id).filter((x): x is string => !!x))]

      const taskTitleById = new Map<string, string>()
      const taskIsSharedById = new Map<string, boolean>()
      if (taskIds.length > 0) {
        const { data: taskRows } = await supabase
          .from('tasks')
          .select('id, title, is_shared')
          .in('id', taskIds)
        for (const t of taskRows ?? []) {
          taskTitleById.set(t.id as string, t.title as string)
          taskIsSharedById.set(t.id as string, !!t.is_shared)
        }
      }

      const sectionNameById = new Map<string, string>()
      const sectionSortById = new Map<string, number>()
      if (sectionIds.length > 0) {
        const { data: sectionRows } = await supabase
          .from('task_template_sections')
          .select('id, section_name, sort_order')
          .in('id', sectionIds)
        for (const s of sectionRows ?? []) {
          sectionNameById.set(s.id as string, s.section_name as string)
          sectionSortById.set(s.id as string, (s.sort_order ?? 0) as number)
        }
      }

      const stepNameById = new Map<string, string>()
      const stepSortById = new Map<string, number>()
      if (stepIds.length > 0) {
        const { data: stepRows } = await supabase
          .from('task_template_steps')
          .select('id, step_name, title, sort_order')
          .in('id', stepIds)
        for (const s of stepRows ?? []) {
          stepNameById.set(s.id as string, (s.step_name ?? s.title ?? 'Step') as string)
          stepSortById.set(s.id as string, (s.sort_order ?? 0) as number)
        }
      }

      // 4. Completions in this period — for shared tasks, load ALL members
      //    so completer attribution renders in the completer's color (#266).
      const sharedIds = taskIds.filter(id => taskIsSharedById.get(id))
      const personalIds = taskIds.filter(id => !taskIsSharedById.get(id))

      const completionList: Array<{ id: string; task_id: string; step_id: string; period_date: string; family_member_id: string }> = []
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

      // 5. Group obligation rows into (date → cell(task+section) → steps).
      type CellAccum = {
        task_id: string
        section_id: string
        section_sort: number
        steps: Array<{ step_id: string; step_sort: number }>
      }
      const dayCellMap = new Map<string, Map<string, CellAccum>>() // iso → cellKey → accum
      for (const o of obligations) {
        if (!o.section_id || !o.step_id) continue
        let cellMap = dayCellMap.get(o.date)
        if (!cellMap) {
          cellMap = new Map()
          dayCellMap.set(o.date, cellMap)
        }
        const cellKey = `${o.task_id}|${o.section_id}`
        let cell = cellMap.get(cellKey)
        if (!cell) {
          cell = {
            task_id: o.task_id,
            section_id: o.section_id,
            section_sort: sectionSortById.get(o.section_id) ?? 0,
            steps: [],
          }
          cellMap.set(cellKey, cell)
        }
        if (!cell.steps.some(s => s.step_id === o.step_id)) {
          cell.steps.push({ step_id: o.step_id, step_sort: stepSortById.get(o.step_id) ?? 0 })
        }
      }

      // 6. Walk the period day-by-day, assembling cells from the grouped map.
      const days: RoutineWeekDay[] = []
      const start = new Date(periodStart + 'T12:00:00Z')
      const end = new Date(periodEnd + 'T12:00:00Z')
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        // eslint-disable-next-line no-restricted-syntax -- d is explicitly UTC-constructed via 'T12:00:00Z' + setUTCDate; UTC slice is correct here
        const iso = d.toISOString().slice(0, 10)
        const dow = d.getUTCDay()

        const cells: RoutineWeekDayCell[] = []
        const cellMap = dayCellMap.get(iso)
        if (cellMap) {
          const sortedCells = [...cellMap.values()].sort((a, b) => a.section_sort - b.section_sort)
          for (const accum of sortedCells) {
            const sortedSteps = [...accum.steps].sort((a, b) => a.step_sort - b.step_sort)
            const cellSteps: RoutineWeekStep[] = sortedSteps.map(s => {
              const completion = completionByKey.get(`${s.step_id}|${iso}`)
              return {
                step_id: s.step_id,
                step_name: stepNameById.get(s.step_id) ?? 'Step',
                is_checked: !!completion,
                completion_id: completion?.id ?? null,
                completed_by_member_id: completion?.family_member_id ?? null,
              }
            })
            const checkedCount = cellSteps.filter(s => s.is_checked).length
            cells.push({
              task_id: accum.task_id,
              task_title: taskTitleById.get(accum.task_id) ?? 'Routine',
              section_id: accum.section_id,
              section_name: sectionNameById.get(accum.section_id) ?? 'Section',
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
