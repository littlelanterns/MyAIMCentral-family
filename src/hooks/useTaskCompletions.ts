// PRD-09A: Task Completions, Routine Step Completions, and Approval Flow

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useActedBy } from './useActedBy'
import { todayLocalIso, startOfLocalWeekIso } from '@/utils/dates'
import type {
  TaskCompletion,
  CreateTaskCompletion,
  RoutineStepCompletion,
  CreateRoutineStepCompletion,
} from '@/types/tasks'
import type { GamificationResult } from '@/types/gamification'

// Build M Sub-phase C — gamification pipeline invocation
// Same contract as the copy in useTasks.ts: never throws, logs on failure,
// returns null when anything goes wrong. Gamification is additive.
async function rollGamificationForCompletion(
  completionId: string,
): Promise<GamificationResult | null> {
  try {
    const { data, error } = await supabase.rpc('roll_creature_for_completion', {
      p_task_completion_id: completionId,
    })
    if (error) {
      console.warn('[gamification] roll_creature_for_completion failed:', error)
      return null
    }
    return (data as GamificationResult) ?? null
  } catch (err) {
    console.warn('[gamification] roll_creature_for_completion threw:', err)
    return null
  }
}

// NEW-NN — Opportunity earning forward write. Same contract as the
// copy in useTasks.ts. See that file for the full docstring. Mirror
// kept here to avoid circular imports between the two completion-site
// hooks. Idempotency enforced DB-level by partial unique index
// uq_financial_transactions_forward_per_completion (migration 100174).
async function awardOpportunityEarning(completionId: string): Promise<void> {
  try {
    const { data: completion } = await supabase
      .from('task_completions')
      .select('id, task_id, family_member_id, tasks!inner(id, title, task_type, family_id)')
      .eq('id', completionId)
      .single()
    if (!completion) return

    const task = (completion.tasks as unknown) as {
      id: string
      title: string
      task_type: string
      family_id: string
    }
    if (!task.task_type || !task.task_type.startsWith('opportunity_')) return

    const { data: rewards } = await supabase
      .from('task_rewards')
      .select('reward_type, reward_value')
      .eq('task_id', task.id)
      .limit(1)
    const reward = rewards?.[0]
    if (!reward || reward.reward_type !== 'money') return

    const rewardValue = (reward.reward_value ?? {}) as { amount?: number | string }
    const amount =
      typeof rewardValue.amount === 'number'
        ? rewardValue.amount
        : typeof rewardValue.amount === 'string' && rewardValue.amount.trim() !== ''
          ? Number(rewardValue.amount)
          : NaN
    if (Number.isNaN(amount) || amount <= 0) return

    const { data: balanceData } = await supabase.rpc('calculate_running_balance', {
      p_member_id: completion.family_member_id,
    })
    const newBalance = Number(balanceData ?? 0) + amount

    const { error: insertErr } = await supabase
      .from('financial_transactions')
      .insert({
        family_id: task.family_id,
        family_member_id: completion.family_member_id,
        transaction_type: 'opportunity_earned',
        amount,
        balance_after: newBalance,
        description: `Job: ${task.title}`,
        source_type: 'task_completion',
        source_reference_id: completionId,
        category: task.title,
        metadata: {
          task_id: task.id,
          task_type: task.task_type,
          reward_type: 'money',
        },
      })
    // Swallow duplicate-violation — idempotent by design.
    if (insertErr && insertErr.code !== '23505') {
      console.warn('[opportunity-earning] insert failed:', insertErr)
    }
  } catch (err) {
    console.warn('[opportunity-earning] threw:', err)
  }
}

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
  const date = periodDate ?? todayLocalIso()

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
      queryClient.invalidateQueries({ queryKey: ['live-allowance-progress', data.member_id] })
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

      // Build M Sub-phase C — fire gamification pipeline at approval time.
      // Idempotent via awarded_source_id if this path is ever re-fired.
      const gamificationResult = await rollGamificationForCompletion(completionId)

      // NEW-NN — opportunity earning forward write at approval time.
      await awardOpportunityEarning(completionId)

      return { ...data, gamificationResult }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-completions', data.id] })
      queryClient.invalidateQueries({ queryKey: ['pending-approvals', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', data.family_id] })

      if (data.gamificationResult && !data.gamificationResult.error) {
        queryClient.invalidateQueries({ queryKey: ['family-member'] })
        queryClient.invalidateQueries({ queryKey: ['family-members', data.family_id] })
      }

      // NEW-NN: refresh financial caches after approval. Broadcast-
      // invalidate since this site doesn't know the task_type; cheap
      // no-ops when no subscriber is mounted.
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['family-transactions', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['running-balance'] })
      queryClient.invalidateQueries({ queryKey: ['family-financial-summary', data.family_id] })
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
  const date = periodDate ?? todayLocalIso()

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

/**
 * Fetch routine step completions for the ENTIRE current ISO week (Monday→today).
 * Used by isSectionActiveToday to determine whether a show_until_complete section
 * has already been finished this week. Without this, a Monday section completed on
 * Tuesday would reappear on Wednesday because the per-day query sees nothing.
 */
export function useRoutineStepCompletionsThisWeek(
  taskId: string | undefined,
  memberId: string | undefined,
) {
  const today = todayLocalIso()
  const weekStart = startOfLocalWeekIso()

  return useQuery({
    queryKey: ['routine-step-completions-week', taskId, memberId, weekStart],
    queryFn: async () => {
      if (!taskId || !memberId) return []

      const { data, error } = await supabase
        .from('routine_step_completions')
        .select('*')
        .eq('task_id', taskId)
        .eq('member_id', memberId)
        .gte('period_date', weekStart)
        .lte('period_date', today)
        .order('completed_at')

      if (error) throw error
      return data as RoutineStepCompletion[]
    },
    enabled: !!taskId && !!memberId,
  })
}

// Row 192 NEW-LL: idempotent toggle. UPSERT with ON CONFLICT DO NOTHING means
// re-clicking an already-checked step is a silent no-op (no duplicate row, no
// error). The onConflict target matches the partial UNIQUE INDEX created in
// migration 100165 (step_id, family_member_id, period_date).
export function useCompleteRoutineStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (completion: CreateRoutineStepCompletion) => {
      // Defensive: ensure family_member_id is set so the partial UNIQUE index
      // applies (the index is WHERE family_member_id IS NOT NULL).
      const row = {
        ...completion,
        family_member_id: completion.member_id,
      }

      const { data, error } = await supabase
        .from('routine_step_completions')
        .upsert(row, {
          onConflict: 'step_id,family_member_id,period_date',
          ignoreDuplicates: true,
        })
        .select()
        .maybeSingle()

      if (error) throw error
      // data is null when ignoreDuplicates=true and the conflict was a hit.
      // Return a minimal shape so onSuccess invalidations still fire correctly
      // — the cache invalidation is the meaningful side effect either way.
      return (data ?? {
        task_id: completion.task_id,
        step_id: completion.step_id,
        member_id: completion.member_id,
        period_date: completion.period_date,
      }) as RoutineStepCompletion
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['routine-step-completions', data.task_id, data.member_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['live-allowance-progress', data.member_id],
      })
    },
  })
}

// Row 192 NEW-LL: unchecking deletes ALL matching rows (no instance_number
// filter). After migration 100165 there can only ever be one row per
// (step_id, family_member_id, period_date), but the broader DELETE is
// belt-and-suspenders against any pre-migration stragglers and against
// race conditions during the migration window.
export function useUncompleteRoutineStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      stepId,
      memberId,
      periodDate,
    }: {
      taskId: string
      stepId: string
      memberId: string
      /** @deprecated NEW-LL — instance_number filter dropped; kept on the type for caller compat */
      instanceNumber?: number
      periodDate?: string
    }) => {
      const date = periodDate ?? todayLocalIso()

      const { error } = await supabase
        .from('routine_step_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('step_id', stepId)
        .eq('member_id', memberId)
        .eq('period_date', date)

      if (error) throw error
      return { taskId, memberId, periodDate: date }
    },
    onSuccess: ({ taskId, memberId }) => {
      queryClient.invalidateQueries({
        queryKey: ['routine-step-completions', taskId, memberId],
      })
      queryClient.invalidateQueries({
        queryKey: ['live-allowance-progress', memberId],
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
  const date = periodDate ?? todayLocalIso()
  const { data: completions } = useRoutineStepCompletions(taskId, memberId, date)

  const completedSteps = completions?.length ?? 0
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  return { completedSteps, totalSteps, percentage }
}

// Re-export types for convenience
export type { TaskCompletion, RoutineStepCompletion } from '@/types/tasks'
