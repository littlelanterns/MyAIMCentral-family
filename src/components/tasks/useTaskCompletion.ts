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
import { fireDeed } from '@/lib/connector/fireDeed'
import { grantMoney } from '@/lib/financial/grantMoney'
import { awardCustomRewardForCompletion } from '@/lib/connector/awardCustomReward'
import { getChoreCycleStart } from '@/hooks/useOpportunityLists'
import { writeBackOpportunityCompletion, invalidateOpportunityBoardCaches } from '@/lib/tasks/opportunityListWriteBack'

interface UseTaskCompletionOptions {
  memberId: string
  familyId: string
  isPrimaryParent?: boolean
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

export function useTaskCompletion({ memberId, familyId, isPrimaryParent, onSparkle, onComplete }: UseTaskCompletionOptions) {
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
      // Guard: enforce cooldown / chore-cycle on opportunity tasks
      if (task.task_type?.startsWith('opportunity') && task.recurrence_details) {
        const rd = task.recurrence_details as Record<string, unknown>
        const resetMode = rd.reset_mode as string | undefined
        const cooldownHours = rd.cooldown_hours as number | undefined

        if (resetMode !== 'chore_cycle' && cooldownHours) {
          // Rolling cooldown — check most recent completion
          const { data: recent } = await supabase
            .from('task_completions')
            .select('completed_at')
            .eq('task_id', task.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (recent?.completed_at) {
            const cooldownEnd = new Date(recent.completed_at).getTime() + cooldownHours * 60 * 60 * 1000
            if (Date.now() < cooldownEnd) {
              const hoursLeft = Math.ceil((cooldownEnd - Date.now()) / (60 * 60 * 1000))
              return { success: false, error: `This job has a ${cooldownHours}-hour cooldown. Available again in ${hoursLeft}h.` }
            }
          }
        }

        if (resetMode === 'chore_cycle') {
          // Fetch chore_cycle_start_day from calendar_settings
          const { data: calSettings } = await supabase
            .from('calendar_settings')
            .select('chore_cycle_start_day, week_start_day')
            .eq('family_id', familyId)
            .maybeSingle()

          const cycleDay = calSettings?.chore_cycle_start_day ?? calSettings?.week_start_day ?? 0
          const cycleStart = getChoreCycleStart(cycleDay)

          const { data: cycleCompletion } = await supabase
            .from('task_completions')
            .select('id')
            .eq('task_id', task.id)
            .gte('completed_at', cycleStart.toISOString())
            .limit(1)
            .maybeSingle()

          if (cycleCompletion) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            return { success: false, error: `Already completed this week. Resets ${dayNames[cycleDay]}.` }
          }
        }
      }

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
      const { data: completionRow, error: completionError } = await supabase
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
        .select('id')
        .single()

      if (completionError) {
        console.warn('task_completion insert failed:', completionError.message)
      }

      // Mark any active claim as completed (claimable opportunities)
      if (task.task_type?.startsWith('opportunity')) {
        supabase
          .from('task_claims')
          .update({ status: 'completed', completed: true })
          .eq('task_id', task.id)
          .eq('status', 'claimed')
          .then(({ error: claimErr }) => {
            if (claimErr) console.warn('claim completion update failed:', claimErr.message)
          })
      }

      // OPPORTUNITY-SURFACES: consume the source list item for claim-bridge
      // tasks (completed_instances / is_available / last_completed_at).
      // Approval-required bridge tasks write back at approval time instead.
      if (task.source === 'opportunity_list_claim' && !task.require_approval) {
        const writeBack = await writeBackOpportunityCompletion(task.id, 'complete')
        invalidateOpportunityBoardCaches(queryClient, writeBack)
      }

      // Phase 3 connector: fire deed for gamification, victory, money, points.
      if (completionRow?.id) {
        fireDeed({
          familyId,
          memberId,
          sourceType: 'task_completion',
          sourceId: task.id,
          metadata: {
            task_title: task.title,
            task_type: task.task_type,
            completion_id: completionRow.id,
            victory_flagged: task.victory_flagged,
          },
          idempotencyKey: `task_completion:${completionRow.id}`,
        })
      }

      // Forward financial write: when an opportunity task with a money reward
      // is completed, create the financial_transactions row that the
      // reverse_opportunity_earning RPC expects to find on uncomplete.
      if (task.task_type?.startsWith('opportunity') && completionRow?.id) {
        const { data: rewards } = await supabase
          .from('task_rewards')
          .select('reward_type, reward_value')
          .eq('task_id', task.id)
          .limit(1)
          .maybeSingle()

        if (rewards?.reward_type === 'money' && rewards.reward_value?.amount) {
          grantMoney({
            familyId,
            memberId,
            amount: Number(rewards.reward_value.amount),
            transactionType: 'opportunity_earned',
            description: `Completed: ${task.title}`,
            sourceType: 'task_completion',
            sourceReferenceId: completionRow.id,
          })
        }
      }

      // KIDS-REWARDS-PAGE Q7: privileges/family_activities reward → earned_prizes.
      // RPC self-filters (reward type, approval timing via task.require_approval,
      // idempotency) — covers tasks, routines, and opportunity claim-bridge tasks.
      if (completionRow?.id) {
        awardCustomRewardForCompletion(completionRow.id)
      }

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

      // Step 8: Sequential promotion — advance next item when a sequential task completes
      if (task.sequential_collection_id && task.sequential_position != null) {
        const { data: collection } = await supabase
          .from('sequential_collections')
          .select('allow_out_of_order, active_count, promotion_timing')
          .eq('id', task.sequential_collection_id)
          .maybeSingle()

        if (collection) {
          await supabase
            .from('tasks')
            .update({ sequential_is_active: false })
            .eq('id', task.id)

          if (!collection.allow_out_of_order) {
            const nextPosition = task.sequential_position + 1
            const { data: nextTask } = await supabase
              .from('tasks')
              .select('id')
              .eq('sequential_collection_id', task.sequential_collection_id)
              .eq('sequential_position', nextPosition)
              .is('archived_at', null)
              .maybeSingle()

            if (nextTask) {
              await supabase
                .from('tasks')
                .update({ sequential_is_active: true, status: 'pending' })
                .eq('id', (nextTask as { id: string }).id)
              await supabase
                .from('sequential_collections')
                .update({ current_index: nextPosition })
                .eq('id', task.sequential_collection_id)
            }
          }
        }
      }

      // Step 9: Generate next recurrence — stub
      // STUB: If task.recurrence_details, generate next instance via Edge Function

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
      queryClient.invalidateQueries({ queryKey: ['task-completions'] })
      queryClient.invalidateQueries({ queryKey: ['sequential-collections'] })
      queryClient.invalidateQueries({ queryKey: ['victories', memberId] })
      queryClient.invalidateQueries({ queryKey: ['victory-count', memberId] })
      queryClient.invalidateQueries({ queryKey: ['family-member'] })
      queryClient.invalidateQueries({ queryKey: ['family-members', familyId] })
      queryClient.invalidateQueries({ queryKey: ['financial-transactions', memberId] })
      queryClient.invalidateQueries({ queryKey: ['pending-reveals', memberId] })
    },
  })

  const uncompleteTask = useMutation({
    mutationFn: async (task: Task): Promise<CompletionResult> => {
      // 1. Find the most recent completion to identify the completer
      const { data: latestCompletion } = await supabase
        .from('task_completions')
        .select('id, family_member_id, approval_status')
        .eq('task_id', task.id)
        .order('completed_at', { ascending: false })
        .limit(1)

      const completion = latestCompletion?.[0]
      const isOpportunity = task.task_type?.startsWith('opportunity')

      // 2. For opportunities: only the completer or mom can uncomplete
      if (isOpportunity && completion) {
        const completerId = completion.family_member_id
        if (completerId !== memberId && !isPrimaryParent) {
          return { success: false, error: 'Only the person who completed this or mom can undo it.' }
        }
        if (completion.approval_status === 'approved' && !isPrimaryParent) {
          return { success: false, error: 'Mom approved this — only mom can undo it.' }
        }
      }

      // 3. Delete the completion record
      if (completion) {
        await supabase.from('task_completions').delete().eq('id', completion.id)
      }

      // 4. Reset task status back to pending
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'pending', completed_at: null })
        .eq('id', task.id)

      if (error) return { success: false, error: error.message }

      // 5. For opportunities: release the claim so job goes back to pool
      if (isOpportunity) {
        supabase
          .from('task_claims')
          .update({ status: 'released', released: true, released_at: new Date().toISOString() })
          .eq('task_id', task.id)
          .in('status', ['claimed', 'completed'])
          .then(({ error: claimErr }) => {
            if (claimErr) console.warn('claim release on uncomplete failed:', claimErr.message)
          })
      }

      // OPPORTUNITY-SURFACES: the source list item follows the claim back to
      // the pool (decrement completed_instances, restore availability).
      if (task.source === 'opportunity_list_claim') {
        const writeBack = await writeBackOpportunityCompletion(task.id, 'uncomplete')
        invalidateOpportunityBoardCaches(queryClient, writeBack)
      }

      // 6. Reverse any financial transaction for this completion
      if (completion) {
        supabase
          .rpc('reverse_opportunity_earning', { p_completion_id: completion.id })
          .then(({ error: revError, data: revData }) => {
            if (revError) {
              console.warn('reverse_opportunity_earning failed:', revError.message)
            } else if (Array.isArray(revData) && revData[0]?.status === 'reversed') {
              queryClient.invalidateQueries({ queryKey: ['financial-transactions'] })
              queryClient.invalidateQueries({ queryKey: ['family-transactions'] })
              queryClient.invalidateQueries({ queryKey: ['running-balance'] })
              queryClient.invalidateQueries({ queryKey: ['family-financial-summary'] })
            }
          })
      }

      // 7. Log the unmarking (fire and forget)
      supabase
        .from('activity_log_entries')
        .insert({
          family_id: familyId,
          member_id: memberId,
          event_type: 'task_unmarked',
          source_table: 'tasks',
          source_id: task.id,
          metadata: { action: 'unmark_completion' },
        })
        .then(({ error: logError }) => {
          if (logError) console.warn('activity log insert failed:', logError.message)
        })

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
      queryClient.invalidateQueries({ queryKey: ['task-completions'] })
      queryClient.invalidateQueries({ queryKey: ['live-allowance-progress'] })
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
          const result = await uncompleteTask.mutateAsync(task)
          if (!result.success) return
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
