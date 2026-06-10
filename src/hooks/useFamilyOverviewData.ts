// PRD-14C: Data hooks for Family Overview column sections.
// Batch-loads today's events, tasks, intentions, trackers, and opportunities
// for all selected members in a single query per data type.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamily } from './useFamily'
import { useFamilyToday } from './useFamilyToday'
import { isoDaysFrom } from '@/utils/dates'
import { isRecurringTaskVisibleToday } from '@/lib/tasks/recurringTaskFilter'

// Row 184 NEW-DD Path 2: Family Overview queries use server-derived family-today
// via useFamilyToday. Any member in `selectedMemberIds` resolves to the family's
// timezone (all members share it), so we pick the first and query once per group.

// ─── Today's events per member ──────────────────────────────────────────────

export function useTodayEventsForMembers(memberIds: string[]) {
  const { data: family } = useFamily()
  const familyId = family?.id
  const { data: dateStr } = useFamilyToday(memberIds[0])

  return useQuery({
    queryKey: ['fo-events', familyId, dateStr, memberIds],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0 || !dateStr) return []
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, event_attendees(family_member_id)')
        .eq('family_id', familyId)
        .eq('event_date', dateStr)
        .in('status', ['approved', 'pending_approval'])
        .order('start_time', { ascending: true, nullsFirst: false })
      if (error) {
        console.error('useTodayEventsForMembers query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0 && !!dateStr,
  })
}

// ─── Today's tasks per member ───────────────────────────────────────────────

export function useTodayTasksForMembers(memberIds: string[]) {
  const { data: family } = useFamily()
  const familyId = family?.id
  const { data: dateStr } = useFamilyToday(memberIds[0])

  return useQuery({
    queryKey: ['fo-tasks', familyId, dateStr, memberIds],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0 || !dateStr) return []
      const weekAgoStr = isoDaysFrom(dateStr, -7)
      // FO-COMMAND-CENTER: routines + sequential now have their own dedicated
      // sections — exclude them here so the Tasks section is task/habit only.
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, due_time, assignee_id, task_type, require_approval, sort_order, completed_at, is_shared, recurrence_rule, recurrence_details')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .not('task_type', 'like', 'opportunity%')
        .not('task_type', 'in', '("routine","sequential")')
        .or(`due_date.eq.${dateStr},and(due_date.is.null,status.neq.completed,created_at.gte.${weekAgoStr})`)
        .in('status', ['pending', 'in_progress', 'completed', 'pending_approval'])
        .order('sort_order', { ascending: true })
      if (error) {
        console.error('useTodayTasksForMembers query failed:', error)
        return []
      }
      const rows = data ?? []
      return rows.filter(t => isRecurringTaskVisibleToday(t as Parameters<typeof isRecurringTaskVisibleToday>[0]))
    },
    enabled: !!familyId && memberIds.length > 0 && !!dateStr,
  })
}

// Task assignments to map tasks → members
export function useTaskAssignmentsForMembers(memberIds: string[]) {
  const { data: family } = useFamily()
  const familyId = family?.id

  return useQuery({
    queryKey: ['fo-task-assignments', familyId, memberIds],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0) return []
      const { data, error } = await supabase
        .from('task_assignments')
        .select('task_id, family_member_id')
        .in('family_member_id', memberIds)
        .eq('is_active', true)
      if (error) {
        console.error('useTaskAssignmentsForMembers query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0,
  })
}

// ─── Best Intentions + today's iterations ───────────────────────────────────

export function useBestIntentionsForMembers(memberIds: string[]) {
  return useQuery({
    queryKey: ['fo-intentions', memberIds],
    queryFn: async () => {
      if (memberIds.length === 0) return []
      const { data, error } = await supabase
        .from('best_intentions')
        .select('id, member_id, statement, is_active, iteration_count, color')
        .in('member_id', memberIds)
        .eq('is_active', true)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      if (error) {
        console.error('useBestIntentionsForMembers query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: memberIds.length > 0,
  })
}

export function useTodayIterationsForMembers(memberIds: string[]) {
  const { data: dateStr } = useFamilyToday(memberIds[0])

  return useQuery({
    queryKey: ['fo-iterations-today', memberIds, dateStr],
    queryFn: async () => {
      if (memberIds.length === 0 || !dateStr) return []
      const { data, error } = await supabase
        .from('intention_iterations')
        .select('intention_id, member_id')
        .in('member_id', memberIds)
        .eq('day_date', dateStr)
      if (error) {
        console.error('useTodayIterationsForMembers query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: memberIds.length > 0 && !!dateStr,
  })
}

// ─── Active trackers (dashboard widgets) ────────────────────────────────────

export function useTrackersForMembers(familyId: string | undefined, memberIds: string[]) {
  return useQuery({
    queryKey: ['fo-trackers', familyId, memberIds],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0) return []
      // `config` is an alias for the real `widget_config` column so the
      // consumer (TrackersSection) can keep reading `w.config`. There is no
      // `widget_template_id` column on dashboard_widgets; `template_type` is
      // the real discriminator if it's ever needed.
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('id, family_member_id, config:widget_config, template_type')
        .eq('family_id', familyId)
        .in('family_member_id', memberIds)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      // Degrade gracefully: a widget-data failure must never crash the
      // Family Overview render (it surfaces inside View-As of any member).
      if (error) {
        console.error('useTrackersForMembers query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0,
  })
}

// ─── Routines today (Convention #271 — canonical member-day obligations) ────
// FO-COMMAND-CENTER: the per-member routines section derives "what routine
// steps count today" EXCLUSIVELY from get_member_day_obligations. Do not
// re-derive schedule rules inline (painted rdates/exdates, until, dtstart,
// archived, assignee are all honored server-side by Layer 1).

export interface MemberRoutineToday {
  task_id: string
  title: string
  is_shared: boolean
  total_steps: number
  done_steps: number
}

type ObligationRow = {
  date: string
  source_type: string
  task_id: string
  template_id: string | null
  section_id: string | null
  step_id: string | null
}

export function useTodayRoutinesForMembers(memberIds: string[]) {
  const { data: dateStr } = useFamilyToday(memberIds[0])

  return useQuery({
    queryKey: ['fo-routines', memberIds, dateStr],
    queryFn: async (): Promise<Record<string, MemberRoutineToday[]>> => {
      if (memberIds.length === 0 || !dateStr) return {}

      // 1. Canonical obligations per member (one RPC per member — Convention #271)
      const perMember = await Promise.all(
        memberIds.map(async (mid) => {
          const { data, error } = await supabase.rpc('get_member_day_obligations', {
            p_member_id: mid,
            p_period_start: dateStr,
            p_period_end: dateStr,
          })
          if (error) {
            console.error('useTodayRoutinesForMembers obligations failed:', error)
            return [mid, [] as ObligationRow[]] as const
          }
          return [
            mid,
            ((data ?? []) as ObligationRow[]).filter((o) => o.source_type === 'routine_step'),
          ] as const
        })
      )

      const allTaskIds = [
        ...new Set(perMember.flatMap(([, rows]) => rows.map((r) => r.task_id))),
      ]
      if (allTaskIds.length === 0) return Object.fromEntries(memberIds.map((m) => [m, []]))

      // 2. Titles + shared flags
      const { data: taskRows, error: taskErr } = await supabase
        .from('tasks')
        .select('id, title, is_shared')
        .in('id', allTaskIds)
      if (taskErr) console.error('useTodayRoutinesForMembers tasks failed:', taskErr)
      const taskById = new Map(
        (taskRows ?? []).map((t) => [t.id as string, { title: t.title as string, is_shared: !!t.is_shared }])
      )

      // 3. Today's step completions for these routines (all members — shared
      //    routines count any completer's checkmark, Convention #266/#267)
      const { data: completions, error: compErr } = await supabase
        .from('routine_step_completions')
        .select('task_id, step_id, member_id, family_member_id')
        .in('task_id', allTaskIds)
        .eq('period_date', dateStr)
      if (compErr) console.error('useTodayRoutinesForMembers completions failed:', compErr)
      const completionRows = completions ?? []

      const stepDone = (stepId: string | null, memberId: string, isShared: boolean) => {
        if (!stepId) return false
        return completionRows.some(
          (c) =>
            c.step_id === stepId &&
            (isShared || c.member_id === memberId || c.family_member_id === memberId)
        )
      }

      // 4. Assemble per-member routine summaries
      const result: Record<string, MemberRoutineToday[]> = {}
      for (const [mid, rows] of perMember) {
        const byTask = new Map<string, ObligationRow[]>()
        for (const r of rows) {
          const existing = byTask.get(r.task_id) ?? []
          existing.push(r)
          byTask.set(r.task_id, existing)
        }
        result[mid] = [...byTask.entries()].map(([taskId, steps]) => {
          const meta = taskById.get(taskId)
          const isShared = meta?.is_shared ?? false
          return {
            task_id: taskId,
            title: meta?.title ?? 'Routine',
            is_shared: isShared,
            total_steps: steps.length,
            done_steps: steps.filter((s) => stepDone(s.step_id, mid, isShared)).length,
          }
        })
      }
      return result
    },
    enabled: memberIds.length > 0 && !!dateStr,
    staleTime: 15_000,
  })
}

// ─── Sequential collections per member ───────────────────────────────────────
// FO-COMMAND-CENTER: per-member sequential progress — collection title,
// completed/total, and the current (next) active item.

export interface MemberSequentialSummary {
  collection_id: string
  collection_title: string
  total_items: number
  completed_count: number
  current_item_title: string | null
  current_task_id: string | null
}

export function useSequentialForMembers(familyId: string | undefined, memberIds: string[]) {
  return useQuery({
    queryKey: ['fo-sequential', familyId, memberIds],
    queryFn: async (): Promise<Record<string, MemberSequentialSummary[]>> => {
      if (!familyId || memberIds.length === 0) return {}

      const { data: seqTasks, error } = await supabase
        .from('tasks')
        .select('id, title, status, assignee_id, sequential_collection_id, sequential_position, sequential_is_active')
        .eq('family_id', familyId)
        .eq('task_type', 'sequential')
        .in('assignee_id', memberIds)
        .is('archived_at', null)
      if (error) {
        console.error('useSequentialForMembers tasks failed:', error)
        return {}
      }
      const rows = seqTasks ?? []
      const collectionIds = [
        ...new Set(rows.map((t) => t.sequential_collection_id as string | null).filter((x): x is string => !!x)),
      ]
      if (collectionIds.length === 0) return Object.fromEntries(memberIds.map((m) => [m, []]))

      const { data: collections, error: collErr } = await supabase
        .from('sequential_collections')
        .select('id, title, total_items')
        .in('id', collectionIds)
      if (collErr) console.error('useSequentialForMembers collections failed:', collErr)
      const collById = new Map((collections ?? []).map((c) => [c.id as string, c]))

      const result: Record<string, MemberSequentialSummary[]> = {}
      for (const mid of memberIds) {
        const memberRows = rows.filter((t) => t.assignee_id === mid)
        const byColl = new Map<string, typeof memberRows>()
        for (const t of memberRows) {
          const cid = t.sequential_collection_id as string | null
          if (!cid) continue
          const existing = byColl.get(cid) ?? []
          existing.push(t)
          byColl.set(cid, existing)
        }
        result[mid] = [...byColl.entries()].map(([cid, tasks]) => {
          const coll = collById.get(cid)
          const active = tasks
            .filter((t) => t.sequential_is_active && t.status !== 'completed')
            .sort((a, b) => ((a.sequential_position as number) ?? 0) - ((b.sequential_position as number) ?? 0))[0]
          return {
            collection_id: cid,
            collection_title: (coll?.title as string) ?? 'Sequential',
            total_items: (coll?.total_items as number) ?? tasks.length,
            completed_count: tasks.filter((t) => t.status === 'completed').length,
            current_item_title: (active?.title as string) ?? null,
            current_task_id: (active?.id as string) ?? null,
          }
        })
      }
      return result
    },
    enabled: !!familyId && memberIds.length > 0,
    staleTime: 15_000,
  })
}

// ─── Victories today ─────────────────────────────────────────────────────────

export function useTodayVictoriesForMembers(familyId: string | undefined, memberIds: string[]) {
  const { data: dateStr } = useFamilyToday(memberIds[0])

  return useQuery({
    queryKey: ['fo-victories', familyId, memberIds, dateStr],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0 || !dateStr) return []
      const { data, error } = await supabase
        .from('victories')
        .select('id, family_member_id, description, celebration_text, created_at')
        .eq('family_id', familyId)
        .in('family_member_id', memberIds)
        .is('archived_at', null)
        .gte('created_at', `${dateStr}T00:00:00`)
        .lte('created_at', `${dateStr}T23:59:59`)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('useTodayVictoriesForMembers query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0 && !!dateStr,
  })
}

// ─── Opportunity completions today ──────────────────────────────────────────

export function useTodayOpportunityCompletions(familyId: string | undefined, memberIds: string[]) {
  const { data: dateStr } = useFamilyToday(memberIds[0])

  return useQuery({
    queryKey: ['fo-opportunities', familyId, memberIds, dateStr],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0 || !dateStr) return []
      // Tasks with opportunity types that were completed today
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, task_type, assignee_id, points_override, completed_at')
        .eq('family_id', familyId)
        .like('task_type', 'opportunity%')
        .eq('status', 'completed')
        .gte('completed_at', `${dateStr}T00:00:00`)
        .lte('completed_at', `${dateStr}T23:59:59`)
      if (error) {
        console.error('useTodayOpportunityCompletions query failed:', error)
        return []
      }
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0 && !!dateStr,
  })
}
