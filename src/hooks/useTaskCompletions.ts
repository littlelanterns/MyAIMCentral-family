// PRD-09A: Task Completions, Routine Step Completions, and Approval Flow

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useActedBy } from './useActedBy'
import type {
  TaskCompletion,
  CreateTaskCompletion,
  RoutineStepCompletion,
  CreateRoutineStepCompletion,
} from '@/types/tasks'

// ============================================================
// useTaskCompletions — completions for a single task
// ============================================================

export function useTaskCompletions(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-completions', taskId],
    queryFn: async () => {
      if (!taskId) return []

      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('task_id', taskId)
        .order('completed_at', { ascending: false })

      if (error) throw error
      return data as TaskCompletion[]
    },
    enabled: !!taskId,
  })
}

// ============================================================
// useTaskCompletionsForMember — all completions for a member on a given date
// Used for daily dashboard progress tracking
// ============================================================

export function useTaskCompletionsForMember(
  memberId: string | undefined,
  periodDate?: string,
) {
  const date = periodDate ?? new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['task-completions-member', memberId, date],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .eq('member_id', memberId)
        .eq('period_date', date)
        .order('completed_at', { ascending: false })

      if (error) throw error
      return data as TaskCompletion[]
    },
    enabled: !!memberId,
  })
}

// ============================================================
// usePendingApprovals — all completions awaiting parent approval
// ============================================================

export function usePendingApprovals(familyId: string | undefined) {
  return useQuery({
    queryKey: ['pending-approvals', familyId],
    queryFn: async () => {
      if (!familyId) return []

      // Join through tasks to get family scoping
      const { data, error } = await supabase
        .from('task_completions')
        .select(`
          *,
          tasks!inner(id, family_id, title, task_type)
        `)
        .eq('tasks.family_id', familyId)
        .eq('approval_status', 'pending')
        .is('rejected', false)
        .order('completed_at', { ascending: true })

      if (error) throw error
      return data as (TaskCompletion & { tasks: { id: string; family_id: string; title: string; task_type: string } })[]
    },
    enabled: !!familyId,
  })
}

// ============================================================
// useCreateTaskCompletion — raw completion insert
// For most cases prefer useCompleteTask in useTasks.ts (which also updates the task status)
// ============================================================

export function useCreateTaskCompletion() {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()

  return useMutation({
    mutationFn: async (completion: CreateTaskCompletion) => {
      const { data, error } = await supabase
        .from('task_completions')
        .insert({
          rejected: false,
          ...completion,
          family_member_id: completion.member_id,
          acted_by: actedBy,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskCompletion
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-completions', data.task_id] })
      queryClient.invalidateQueries({ queryKey: ['task-completions-member', data.member_id] })
    },
  })
}

// ============================================================
// useApproveCompletion — parent approves pending completion
// ============================================================

export function useApproveCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      completionId,
      taskId,
      approvedById,
    }: {
      completionId: string
      taskId: string
      approvedById: string
    }) => {
      const { error: compError } = await supabase
        .from('task_completions')
        .update({
          approved_by: approvedById,
          approved_at: new Date().toISOString(),
          approval_status: 'approved',
        })
        .eq('id', completionId)

      if (compError) throw compError

      // Update task to completed
      const { data, error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select('id, family_id')
        .single()

      if (taskError) throw taskError
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-completions', data.id] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
    },
  })
}

// ============================================================
// useRejectCompletion — parent rejects, task returns to pending
// ============================================================

export function useRejectCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      completionId,
      taskId,
      rejectionNote,
    }: {
      completionId: string
      taskId: string
      rejectionNote?: string | null
    }) => {
      const { error: compError } = await supabase
        .from('task_completions')
        .update({
          rejected: true,
          rejection_note: rejectionNote ?? null,
          approval_status: 'rejected',
        })
        .eq('id', completionId)

      if (compError) throw compError

      const { data, error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'pending', completed_at: null })
        .eq('id', taskId)
        .select('id, family_id')
        .single()

      if (taskError) throw taskError
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-completions', data.id] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })
    },
  })
}

// ============================================================
// Routine Step Completions
// ============================================================

export function useRoutineStepCompletions(
  taskId: string | undefined,
  memberId: string | undefined,
  periodDate?: string,
) {
  const date = periodDate ?? new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: ['routine-step-completions', taskId, memberId, date],
    queryFn: async () => {
      if (!taskId || !memberId) return []

      const { data, error } = await supabase
        .from('routine_step_completions')
        .select('*')
        .eq('task_id', taskId)
        .eq('member_id', memberId)
        .eq('period_date', date)
        .order('completed_at')

      if (error) throw error
      return data as RoutineStepCompletion[]
    },
    enabled: !!taskId && !!memberId,
  })
}

export function useCompleteRoutineStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (completion: CreateRoutineStepCompletion) => {
      const { data, error } = await supabase
        .from('routine_step_completions')
        .insert({
          instance_number: 1,
          ...completion,
          family_member_id: completion.member_id,
        })
        .select()
        .single()

      if (error) throw error
      return data as RoutineStepCompletion
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['routine-step-completions', data.task_id, data.member_id],
      })
    },
  })
}

export function useUncompleteRoutineStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      stepId,
      memberId,
      instanceNumber,
      periodDate,
    }: {
      taskId: string
      stepId: string
      memberId: string
      instanceNumber?: number
      periodDate?: string
    }) => {
      const date = periodDate ?? new Date().toISOString().split('T')[0]
      const inst = instanceNumber ?? 1

      const { error } = await supabase
        .from('routine_step_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('step_id', stepId)
        .eq('member_id', memberId)
        .eq('period_date', date)
        .eq('instance_number', inst)

      if (error) throw error
      return { taskId, memberId, periodDate: date }
    },
    onSuccess: ({ taskId, memberId }) => {
      queryClient.invalidateQueries({
        queryKey: ['routine-step-completions', taskId, memberId],
      })
    },
  })
}

// ============================================================
// useRoutineCompletionSummary — % complete for a routine task today
// Returns { completedSteps, totalSteps, percentage }
// ============================================================

export function useRoutineCompletionSummary(
  taskId: string | undefined,
  memberId: string | undefined,
  totalSteps: number,
  periodDate?: string,
) {
  const date = periodDate ?? new Date().toISOString().split('T')[0]
  const { data: completions } = useRoutineStepCompletions(taskId, memberId, date)

  const completedSteps = completions?.length ?? 0
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  return { completedSteps, totalSteps, percentage }
}

// Re-export types for convenience
export type { TaskCompletion, RoutineStepCompletion } from '@/types/tasks'
