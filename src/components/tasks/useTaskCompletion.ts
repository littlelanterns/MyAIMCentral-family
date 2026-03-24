/**
 * useTaskCompletion — 10-step PRD-09A Screen 8 completion flow
 *
 * Handles:
 * 1. Toggle checkbox
 * 2. Set status=completed, completed_at
 * 3. Queue reward (stub — PRD-24)
 * 4. Create victory if victory_flagged (stub — PRD-11)
 * 5. Create activity_log_entry
 * 6. Trigger sparkle animation callback
 * 7. Fresh Reset for routines
 * 8. Sequential promotion
 * 9. Generate next recurrence
 * 10. Optional completion note toast
 */

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Task } from '@/hooks/useTasks'

interface UseTaskCompletionOptions {
  memberId: string
  familyId: string
  onSparkle?: (origin?: { x: number; y: number }) => void
}

interface CompletionResult {
  success: boolean
  error?: string
}

export function useTaskCompletion({ memberId, familyId, onSparkle }: UseTaskCompletionOptions) {
  const queryClient = useQueryClient()
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())

  const completeTask = useMutation({
    mutationFn: async ({
      task,
      origin,
    }: {
      task: Task
      origin?: { x: number; y: number }
    }): Promise<CompletionResult> => {
      // Step 1 & 2: Update task status to completed
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      if (updateError) return { success: false, error: updateError.message }

      // Step 2B: Insert task_completion record
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          task_id: task.id,
          member_id: memberId,
        })

      if (completionError) {
        // Non-fatal — log but continue
        console.warn('task_completion insert failed:', completionError.message)
      }

      // Step 3: Queue reward (stub — PRD-24)
      // STUB: wires to PRD-24 gamification reward transaction
      // When PRD-24 is built, call award_task_reward(task.id, memberId) here

      // Step 4: Create victory if victory_flagged (stub — PRD-11)
      // STUB: wires to PRD-11 Victory Recorder
      // if (task.victory_flagged) { create_victory({ source: 'task_completion', source_reference_id: task.id }) }

      // Step 5: Activity log entry (fire and forget)
      supabase
        .from('activity_log_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          event_type: 'task_completed',
          source_table: 'tasks',
          source_id: task.id,
          metadata: { task_title: task.title, task_type: task.task_type },
        })
        .then(({ error }) => {
          if (error) console.warn('activity log insert failed:', error.message)
        })

      // Step 6: Sparkle animation — triggered via callback
      onSparkle?.(origin)

      // Step 7: Fresh Reset for routines — handled server-side via trigger
      // The database trigger `trg_task_fresh_reset` handles routine reset logic

      // Step 8: Sequential promotion — stub until sequential_collections are built
      // STUB: If task.sequential_collection_id, promote next item

      // Step 9: Generate next recurrence — stub
      // STUB: If task.recurrence_details, generate next instance via Edge Function

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
    },
  })

  const uncompleteTask = useMutation({
    mutationFn: async (taskId: string): Promise<CompletionResult> => {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'pending',
          completed_at: null,
        })
        .eq('id', taskId)

      if (error) return { success: false, error: error.message }

      // Remove the most recent completion record
      const { data: latestCompletion } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', taskId)
        .eq('member_id', memberId)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (latestCompletion?.[0]) {
        await supabase
          .from('task_completions')
          .delete()
          .eq('id', latestCompletion[0].id)
      }

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
    },
  })

  const toggle = useCallback(
    async (
      task: Task,
      origin?: { x: number; y: number }
    ) => {
      if (completingIds.has(task.id)) return

      setCompletingIds((prev) => new Set(prev).add(task.id))
      try {
        if (task.status === 'completed') {
          await uncompleteTask.mutateAsync(task.id)
        } else {
          await completeTask.mutateAsync({ task, origin })
        }
      } finally {
        setCompletingIds((prev) => {
          const next = new Set(prev)
          next.delete(task.id)
          return next
        })
      }
    },
    [completingIds, completeTask, uncompleteTask]
  )

  return {
    toggle,
    isCompleting: (taskId: string) => completingIds.has(taskId),
  }
}
