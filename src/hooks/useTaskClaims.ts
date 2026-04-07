// PRD-09A: Task Claims — claim/release/complete for opportunity_claimable tasks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TaskClaim } from '@/types/tasks'
import { todayLocalIso } from '@/utils/dates'

// ============================================================
// useTaskClaims — all claims for a specific task
// Used on the Opportunities tab to show who has claimed what
// ============================================================

export function useTaskClaims(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-claims', taskId],
    queryFn: async () => {
      if (!taskId) return []

      const { data, error } = await supabase
        .from('task_claims')
        .select('*')
        .eq('task_id', taskId)
        .order('claimed_at', { ascending: false })

      if (error) throw error
      return data as TaskClaim[]
    },
    enabled: !!taskId,
  })
}

// ============================================================
// useActiveClaims — claims that are currently locked (not completed, not released)
// ============================================================

export function useActiveClaims(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-claims-active', taskId],
    queryFn: async () => {
      if (!taskId) return []

      const { data, error } = await supabase
        .from('task_claims')
        .select('*')
        .eq('task_id', taskId)
        .eq('completed', false)
        .eq('released', false)
        .order('claimed_at', { ascending: true })

      if (error) throw error
      return data as TaskClaim[]
    },
    enabled: !!taskId,
  })
}

// ============================================================
// useMyActiveClaims — all active claims for a specific member
// Used on the member's Dashboard to show claimed jobs
// ============================================================

export function useMyActiveClaims(memberId: string | undefined) {
  return useQuery({
    queryKey: ['my-claims', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('task_claims')
        .select(`
          *,
          tasks!inner(id, title, task_type, claim_lock_duration, claim_lock_unit)
        `)
        .or(`member_id.eq.${memberId},claimed_by.eq.${memberId}`)
        .eq('completed', false)
        .eq('released', false)
        .order('claimed_at', { ascending: true })

      if (error) throw error
      return data as (TaskClaim & {
        tasks: {
          id: string
          title: string
          task_type: string
          claim_lock_duration: number | null
          claim_lock_unit: string | null
        }
      })[]
    },
    enabled: !!memberId,
  })
}

// ============================================================
// useClaimTask — member claims a claimable opportunity
// Enforces database uniqueness: only one active claim per task
// ============================================================

export function useClaimTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      memberId,
      lockDurationMinutes,
    }: {
      taskId: string
      memberId: string
      lockDurationMinutes: number  // calculated from task's claim_lock_duration + claim_lock_unit
    }) => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + lockDurationMinutes * 60 * 1000)

      // Check for an existing active claim (first-claim-wins)
      const { data: existing, error: checkError } = await supabase
        .from('task_claims')
        .select('id, member_id, claimed_by')
        .eq('task_id', taskId)
        .eq('completed', false)
        .eq('released', false)
        .maybeSingle()

      if (checkError) throw checkError

      if (existing) {
        throw new Error('ALREADY_CLAIMED')
      }

      const { data, error } = await supabase
        .from('task_claims')
        .insert({
          task_id: taskId,
          member_id: memberId,
          claimed_by: memberId,
          expires_at: expiresAt.toISOString(),
          status: 'claimed',
          completed: false,
          released: false,
        })
        .select()
        .single()

      if (error) throw error
      return data as TaskClaim
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-claims', data.task_id] })
      queryClient.invalidateQueries({ queryKey: ['task-claims-active', data.task_id] })
      queryClient.invalidateQueries({ queryKey: ['my-claims', data.member_id] })
      if (data.claimed_by) {
        queryClient.invalidateQueries({ queryKey: ['my-claims', data.claimed_by] })
      }
    },
  })
}

// ============================================================
// useCompleteClaim — member marks their claimed job complete
// ============================================================

export function useCompleteClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      claimId,
      taskId,
      memberId,
    }: {
      claimId: string
      taskId: string
      memberId: string
    }) => {
      // 1. Mark the claim as completed
      const { error: claimError } = await supabase
        .from('task_claims')
        .update({
          completed: true,
          status: 'completed',
        })
        .eq('id', claimId)

      if (claimError) throw claimError

      // 2. Insert a task_completion record
      const periodDate = todayLocalIso()
      const { data: completion, error: compError } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          member_id: memberId,
          family_member_id: memberId,
          period_date: periodDate,
          rejected: false,
        })
        .select()
        .single()

      if (compError) throw compError

      return { claimId, taskId, memberId, completion }
    },
    onSuccess: ({ taskId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-claims', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-claims-active', taskId] })
      queryClient.invalidateQueries({ queryKey: ['my-claims', memberId] })
      queryClient.invalidateQueries({ queryKey: ['task-completions', taskId] })
    },
  })
}

// ============================================================
// useReleaseClaim — member voluntarily releases a claim before expiry
// ============================================================

export function useReleaseClaim() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      claimId,
      taskId,
      memberId,
    }: {
      claimId: string
      taskId: string
      memberId: string
    }) => {
      const { error } = await supabase
        .from('task_claims')
        .update({
          released: true,
          released_at: new Date().toISOString(),
          status: 'released',
        })
        .eq('id', claimId)

      if (error) throw error
      return { claimId, taskId, memberId }
    },
    onSuccess: ({ taskId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-claims', taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-claims-active', taskId] })
      queryClient.invalidateQueries({ queryKey: ['my-claims', memberId] })
    },
  })
}

// ============================================================
// useExpireOverdueClaims — release claims past their expires_at
// Run this on the client as a background sweep; server-side pg_cron handles it properly.
// Returns how many were expired.
// ============================================================

export function useExpireOverdueClaims() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (familyId: string) => {
      const now = new Date().toISOString()

      // Find all expired active claims for this family
      const { data: expired, error: findError } = await supabase
        .from('task_claims')
        .select('id, task_id, member_id, claimed_by')
        .lt('expires_at', now)
        .eq('completed', false)
        .eq('released', false)
        .eq('status', 'claimed')

      if (findError) throw findError
      if (!expired || expired.length === 0) return { count: 0 }

      const ids = expired.map((c: { id: string }) => c.id)
      const taskIds = [...new Set(expired.map((c: { task_id: string }) => c.task_id))]

      const { error: updateError } = await supabase
        .from('task_claims')
        .update({
          released: true,
          released_at: now,
          status: 'released',
        })
        .in('id', ids)

      if (updateError) throw updateError

      return { count: ids.length, taskIds, familyId }
    },
    onSuccess: (result) => {
      if (result.count > 0 && result.taskIds) {
        for (const taskId of result.taskIds) {
          queryClient.invalidateQueries({ queryKey: ['task-claims', taskId] })
          queryClient.invalidateQueries({ queryKey: ['task-claims-active', taskId] })
        }
      }
    },
  })
}

// ============================================================
// Helper: calculate lock duration in minutes from task fields
// ============================================================

export function calculateLockMinutes(
  duration: number | null,
  unit: 'hours' | 'days' | 'weeks' | null,
): number {
  if (!duration || !unit) return 60 * 4  // default 4 hours

  switch (unit) {
    case 'hours': return duration * 60
    case 'days': return duration * 60 * 24
    case 'weeks': return duration * 60 * 24 * 7
    default: return 60 * 4
  }
}

// ============================================================
// Helper: get remaining lock time in milliseconds
// ============================================================

export function getClaimRemainingMs(claim: TaskClaim): number {
  if (!claim.expires_at) return 0
  return Math.max(0, new Date(claim.expires_at).getTime() - Date.now())
}

// Re-export types for convenience
export type { TaskClaim, CreateTaskClaim } from '@/types/tasks'
