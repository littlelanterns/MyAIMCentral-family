// PRD-14C: Data hooks for Family Overview column sections.
// Batch-loads today's events, tasks, intentions, trackers, and opportunities
// for all selected members in a single query per data type.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamily } from './useFamily'

const today = () => new Date().toISOString().split('T')[0]

// ─── Today's events per member ──────────────────────────────────────────────

export function useTodayEventsForMembers(memberIds: string[]) {
  const { data: family } = useFamily()
  const familyId = family?.id
  const dateStr = today()

  return useQuery({
    queryKey: ['fo-events', familyId, dateStr, memberIds],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0) return []
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*, event_attendees(family_member_id)')
        .eq('family_id', familyId)
        .eq('event_date', dateStr)
        .in('status', ['approved', 'pending_approval'])
        .order('start_time', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0,
  })
}

// ─── Today's tasks per member ───────────────────────────────────────────────

export function useTodayTasksForMembers(memberIds: string[]) {
  const { data: family } = useFamily()
  const familyId = family?.id
  const dateStr = today()

  return useQuery({
    queryKey: ['fo-tasks', familyId, dateStr, memberIds],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0) return []
      // Get tasks assigned to selected members, due today or with no due date and active
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, due_time, assignee_id, task_type, require_approval, sort_order, completed_at, is_shared')
        .eq('family_id', familyId)
        .is('archived_at', null)
        .not('task_type', 'like', 'opportunity%')
        .or(`due_date.eq.${dateStr},due_date.is.null`)
        .in('status', ['pending', 'in_progress', 'completed', 'pending_approval'])
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0,
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
      if (error) throw error
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
      if (error) throw error
      return data ?? []
    },
    enabled: memberIds.length > 0,
  })
}

export function useTodayIterationsForMembers(memberIds: string[]) {
  const dateStr = today()

  return useQuery({
    queryKey: ['fo-iterations-today', memberIds, dateStr],
    queryFn: async () => {
      if (memberIds.length === 0) return []
      const { data, error } = await supabase
        .from('intention_iterations')
        .select('intention_id, member_id')
        .in('member_id', memberIds)
        .eq('day_date', dateStr)
      if (error) throw error
      return data ?? []
    },
    enabled: memberIds.length > 0,
  })
}

// ─── Active trackers (dashboard widgets) ────────────────────────────────────

export function useTrackersForMembers(familyId: string | undefined, memberIds: string[]) {
  return useQuery({
    queryKey: ['fo-trackers', familyId, memberIds],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0) return []
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('id, family_member_id, config, widget_template_id')
        .eq('family_id', familyId)
        .in('family_member_id', memberIds)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0,
  })
}

// ─── Opportunity completions today ──────────────────────────────────────────

export function useTodayOpportunityCompletions(familyId: string | undefined, memberIds: string[]) {
  const dateStr = today()

  return useQuery({
    queryKey: ['fo-opportunities', familyId, memberIds, dateStr],
    queryFn: async () => {
      if (!familyId || memberIds.length === 0) return []
      // Tasks with opportunity types that were completed today
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, task_type, assignee_id, points_override, completed_at')
        .eq('family_id', familyId)
        .like('task_type', 'opportunity%')
        .eq('status', 'completed')
        .gte('completed_at', `${dateStr}T00:00:00`)
        .lte('completed_at', `${dateStr}T23:59:59`)
      if (error) throw error
      return data ?? []
    },
    enabled: !!familyId && memberIds.length > 0,
  })
}
