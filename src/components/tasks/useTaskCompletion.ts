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
import { useActedBy } from '@/hooks/useActedBy'
import { todayLocalIso } from '@/utils/dates'
import { createVictoryForCompletion } from '@/lib/tasks/createVictoryForCompletion'

interface UseTaskCompletionOptions {
  memberId: string
  familyId: string
  onSparkle?: (origin?: { x: number; y: number }) => void
  onComplete?: (task: Task) => void
}

interface CompletionResult {
  success: boolean
  error?: string
}

/**
 * Upload a completion evidence photo to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadCompletionPhoto(file: File, taskId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${taskId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('task-evidence')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: urlData } = supabase.storage
    .from('task-evidence')
    .getPublicUrl(path)
  return urlData.publicUrl
}

export function useTaskCompletion({ memberId, familyId, onSparkle, onComplete }: UseTaskCompletionOptions) {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())

  const completeTask = useMutation({
    mutationFn: async ({
      task,
      origin,
      completionNote,
      photoUrl,
    }: {
      task: Task
      origin?: { x: number; y: number }
      completionNote?: string | null
      photoUrl?: string | null
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
      // period_date scopes the completion to a specific recurrence instance —
      // critical for "any of them" shared recurring tasks (e.g., trash on Tuesdays).
      // Without it, the same shared task can't reset week-to-week.
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          task_id: task.id,
          member_id: memberId,
          family_member_id: memberId,
          period_date: todayLocalIso(),
          completion_note: completionNote ?? null,
          photo_url: photoUrl ?? null,
          acted_by: actedBy,
        })

      if (completionError) {
        // Non-fatal — log but continue
        console.warn('task_completion insert failed:', completionError.message)
      }

      // Step 3: Queue reward (stub — PRD-24)
      // STUB: wires to PRD-24 gamification reward transaction
      // When PRD-24 is built, call award_task_reward(task.id, memberId) here

      // Step 4: Create victory if victory_flagged (fire and forget)
      createVictoryForCompletion({
        task: { id: task.id, title: task.title, victory_flagged: task.victory_flagged, is_shared: task.is_shared, family_id: familyId, life_area_tags: task.life_area_tags },
        completerId: memberId,
        familyId,
      })

      // Step 5: Activity log entry (fire and forget)
      const isRoutine = task.task_type === 'routine'
      supabase
        .from('activity_log_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          event_type: isRoutine ? 'routine_completed' : 'task_completed',
          source_table: 'tasks',
          source_id: task.id,
          display_text: isRoutine
            ? `Routine completed: ${task.title}`
            : `Task completed: ${task.title}`,
          metadata: {
            task_title: task.title,
            task_type: task.task_type,
            has_photo: !!photoUrl,
            has_note: !!completionNote,
            completion_note: completionNote ?? null,
          },
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
      queryClient.invalidateQueries({ queryKey: ['task-completions'] })
      queryClient.invalidateQueries({ queryKey: ['victories', memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-count', memberId] })
    },
  })

  const uncompleteTask = useMutation({
    mutationFn: async (taskId: string): Promise<CompletionResult> => {
      // 1. Reset task status back to pending
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'pending',
          completed_at: null,
        })
        .eq('id', taskId)

      if (error) return { success: false, error: error.message }

      // 2. Remove the most recent completion record
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

      // 3. Log the unmarking (fire and forget)
      supabase
        .from('activity_log_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          event_type: 'task_unmarked',
          source_table: 'tasks',
          source_id: taskId,
          metadata: { action: 'unmark_completion' },
        })
        .then(({ error: logError }) => {
          if (logError) console.warn('activity log insert failed:', logError.message)
        })

      // STUB: Reverse gamification reward/streak — wires when PRD-24 is built

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
      queryClient.invalidateQueries({ queryKey: ['task-completions'] })
    },
  })

  const toggle = useCallback(
    async (
      task: Task,
      origin?: { x: number; y: number },
      extras?: { completionNote?: string | null; photoUrl?: string | null },
    ) => {
      if (completingIds.has(task.id)) return

      setCompletingIds((prev) => new Set(prev).add(task.id))
      try {
        if (task.status === 'completed') {
          await uncompleteTask.mutateAsync(task.id)
        } else {
          await completeTask.mutateAsync({
            task,
            origin,
            completionNote: extras?.completionNote,
            photoUrl: extras?.photoUrl,
          })
          onComplete?.(task)
        }
      } finally {
        setCompletingIds((prev) => {
          const next = new Set(prev)
          next.delete(task.id)
          return next
        })
      }
    },
    [completingIds, completeTask, uncompleteTask, onComplete]
  )

  return {
    toggle,
    isCompleting: (taskId: string) => completingIds.has(taskId),
  }
}
