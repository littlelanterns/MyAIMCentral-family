/**
 * PRD-09A: Claim/release/complete hook for opportunity_claimable tasks.
 * Uses the useTaskClaims hooks from src/hooks/useTaskClaims.ts.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { ClaimLockUnit } from '@/types/tasks'

interface ClaimTaskArgs {
  taskId: string
  memberId: string
}

function calculateExpiresAt(duration: number, unit: ClaimLockUnit): string {
  const now = new Date()
  switch (unit) {
    case 'hours':
      now.setHours(now.getHours() + duration)
      break
    case 'days':
      now.setDate(now.getDate() + duration)
      break
    case 'weeks':
      now.setDate(now.getDate() + duration * 7)
      break
  }
  return now.toISOString()
}

export function useClaimTask() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ taskId, memberId }: ClaimTaskArgs) => {
      // Fetch task to get lock config
      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .select('claim_lock_duration, claim_lock_unit')
        .eq('id', taskId)
        .single()

      if (taskErr) throw taskErr

      const expiresAt = calculateExpiresAt(
        task.claim_lock_duration ?? 24,
        (task.claim_lock_unit as ClaimLockUnit) ?? 'hours'
      )

      // Check for active claims first (first-claim-wins)
      const { data: existing } = await supabase
        .from('task_claims')
        .select('id')
        .eq('task_id', taskId)
        .eq('completed', false)
        .eq('released', false)
        .limit(1)

      if (existing && existing.length > 0) {
        throw new Error('Task already claimed by another member')
      }

      const { data, error } = await supabase
        .from('task_claims')
        .insert({
          task_id: taskId,
          claimed_by: memberId,
          member_id: memberId,
          expires_at: expiresAt,
          completed: false,
          released: false,
          status: 'claimed',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['task-claims', vars.taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-claims-active', vars.taskId] })
      queryClient.invalidateQueries({ queryKey: ['my-active-claims'] })
    },
  })

  return {
    claimTask: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  }
}
