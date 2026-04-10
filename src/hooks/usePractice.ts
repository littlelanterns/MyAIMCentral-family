/**
 * Build J — PRD-09A/09B Linked Steps, Mastery & Practice Advancement
 *
 * Practice logging and mastery approval flow for BOTH sequential tasks
 * (stored in the `tasks` table) and randomizer items (stored in `list_items`).
 *
 * Decision (addendum): `practice_log` is the authoritative unified log across
 * both source types. Sequential items ALSO dual-write to `task_completions`
 * (with new column `completion_type='practice'` or `'mastery_submit'`) so the
 * existing per-task audit view stays accurate and the existing pending-approval
 * UI auto-detects mastery submissions via `approval_status='pending'`.
 *
 * Hooks exported:
 *   useLogPractice             — write a practice session
 *   useSubmitMastery           — submit a mastery item for review
 *   useApproveMasterySubmission — mom approves, item completes / exits pool
 *   useRejectMasterySubmission  — mom rejects, status returns to 'practicing'
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useActedBy } from './useActedBy'
import type {
  PracticeLog,
  PracticeSourceType,
  SequentialCollection,
  Task,
} from '@/types/tasks'
import type { GamificationResult } from '@/types/gamification'

// Build M Sub-phase C — gamification pipeline invocation
// Mirror of the helpers in useTasks.ts / useTaskCompletions.ts. Never throws.
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

// ─── useLogPractice ────────────────────────────────────────────────
// Records a practice session. For sequential items this also:
//   1. Increments tasks.practice_count
//   2. Writes a task_completions row with completion_type='practice'
//   3. If advancement_mode='practice_count' and practice_count >= practice_target:
//      marks the item completed and promotes the next sequential item.
// For randomizer items this also:
//   1. Increments list_items.practice_count
//   2. Increments the linked randomizer_draws.practice_count if draw_id is set
//   3. If advancement_mode='practice_count' and target reached:
//      marks the randomizer_draws row 'completed' (but does NOT exit the pool
//      unless is_repeatable=false or a lifetime cap is hit — existing smart-draw
//      completion logic still applies via useSmartDrawCompletion).
// ───────────────────────────────────────────────────────────────────

export interface LogPracticeParams {
  familyId: string
  familyMemberId: string
  sourceType: PracticeSourceType
  sourceId: string                // tasks.id (sequential) | list_items.id (randomizer)
  drawId?: string | null          // randomizer_draws.id — only for randomizer
  durationMinutes?: number | null
  periodDate?: string             // defaults to today (YYYY-MM-DD)
}

export function useLogPractice() {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()

  return useMutation({
    mutationFn: async (params: LogPracticeParams): Promise<{
      practiceLog: PracticeLog
      autoAdvanced: boolean
    }> => {
      const now = new Date().toISOString()
      const periodDate = params.periodDate ?? now.slice(0, 10)

      // 1. Always write to practice_log (the unified source of truth)
      const { data: practiceLog, error: logError } = await supabase
        .from('practice_log')
        .insert({
          family_id: params.familyId,
          family_member_id: params.familyMemberId,
          source_type: params.sourceType,
          source_id: params.sourceId,
          draw_id: params.drawId ?? null,
          practice_type: 'practice',
          duration_minutes: params.durationMinutes ?? null,
          period_date: periodDate,
        })
        .select()
        .single()

      if (logError || !practiceLog) throw logError ?? new Error('Failed to log practice')

      let autoAdvanced = false

      if (params.sourceType === 'sequential_task') {
        // Sequential: dual-write to task_completions + increment practice_count
        const { data: task, error: taskFetchErr } = await supabase
          .from('tasks')
          .select('id, family_id, advancement_mode, practice_count, practice_target, sequential_collection_id, sequential_position')
          .eq('id', params.sourceId)
          .single()

        if (taskFetchErr || !task) throw taskFetchErr ?? new Error('Task not found')

        const newCount = (task.practice_count ?? 0) + 1

        // Write the dual task_completions audit row (completion_type='practice')
        await supabase.from('task_completions').insert({
          task_id: params.sourceId,
          member_id: params.familyMemberId,
          family_member_id: params.familyMemberId,
          period_date: periodDate,
          completion_type: 'practice',
          duration_minutes: params.durationMinutes ?? null,
          rejected: false,
          acted_by: actedBy,
          approval_status: null,  // practice sessions are not approval-gated
        })

        // Update tasks.practice_count
        await supabase
          .from('tasks')
          .update({ practice_count: newCount })
          .eq('id', params.sourceId)

        // Auto-advance: practice_count mode + target reached
        if (
          task.advancement_mode === 'practice_count' &&
          task.practice_target != null &&
          newCount >= task.practice_target
        ) {
          // Mark this item completed
          await supabase
            .from('tasks')
            .update({ status: 'completed', completed_at: now, sequential_is_active: false })
            .eq('id', params.sourceId)

          // Promote the next sequential item if there is one
          if (task.sequential_collection_id != null && task.sequential_position != null) {
            const nextPosition = task.sequential_position + 1
            const { data: nextTask } = await supabase
              .from('tasks')
              .select('id')
              .eq('sequential_collection_id', task.sequential_collection_id)
              .eq('sequential_position', nextPosition)
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
          autoAdvanced = true
        }

        queryClient.invalidateQueries({ queryKey: ['tasks', task.family_id] })
        if (task.sequential_collection_id) {
          queryClient.invalidateQueries({ queryKey: ['sequential-collection', task.sequential_collection_id] })
          queryClient.invalidateQueries({ queryKey: ['sequential-collections', task.family_id] })
        }
      } else {
        // Randomizer item: increment list_items.practice_count + draw if present
        const { data: item, error: itemFetchErr } = await supabase
          .from('list_items')
          .select('id, list_id, advancement_mode, practice_count, practice_target, is_repeatable')
          .eq('id', params.sourceId)
          .single()

        if (itemFetchErr || !item) throw itemFetchErr ?? new Error('List item not found')

        const newCount = (item.practice_count ?? 0) + 1
        await supabase
          .from('list_items')
          .update({ practice_count: newCount })
          .eq('id', params.sourceId)

        if (params.drawId) {
          const { data: existing } = await supabase
            .from('randomizer_draws')
            .select('practice_count')
            .eq('id', params.drawId)
            .single()
          const drawNewCount = ((existing as { practice_count: number } | null)?.practice_count ?? 0) + 1
          await supabase
            .from('randomizer_draws')
            .update({ practice_count: drawNewCount })
            .eq('id', params.drawId)
        }

        // Auto-advance: practice_count mode + target reached
        if (
          item.advancement_mode === 'practice_count' &&
          item.practice_target != null &&
          newCount >= item.practice_target
        ) {
          // Mark draw completed, mark item unavailable if not repeatable
          if (params.drawId) {
            await supabase
              .from('randomizer_draws')
              .update({ status: 'completed', completed_at: now })
              .eq('id', params.drawId)
          }
          if (!item.is_repeatable) {
            await supabase
              .from('list_items')
              .update({ is_available: false })
              .eq('id', params.sourceId)
          }
          autoAdvanced = true
        }

        queryClient.invalidateQueries({ queryKey: ['list-items', item.list_id] })
        queryClient.invalidateQueries({ queryKey: ['randomizer-draws', item.list_id] })
      }

      queryClient.invalidateQueries({
        queryKey: ['practice-log', params.familyMemberId],
      })

      return {
        practiceLog: practiceLog as PracticeLog,
        autoAdvanced,
      }
    },
  })
}

// ─── useSubmitMastery ─────────────────────────────────────────────
// Child submits an item for mastery review.
// For sequential items: writes a practice_log (practice_type='mastery_submit'),
// sets tasks.mastery_status='submitted', writes a task_completions row with
// completion_type='mastery_submit' AND approval_status='pending' so the
// existing PendingApprovalsSection (Tasks.tsx) naturally detects it.
// For randomizer items: writes practice_log, sets list_items.mastery_status,
// and marks the active randomizer_draws row 'submitted' for the Lists-page
// inline approval queue.
// ───────────────────────────────────────────────────────────────────

export interface SubmitMasteryParams {
  familyId: string
  familyMemberId: string
  sourceType: PracticeSourceType
  sourceId: string
  drawId?: string | null
  evidenceUrl?: string | null
  evidenceNote?: string | null
}

export function useSubmitMastery() {
  const queryClient = useQueryClient()
  const actedBy = useActedBy()

  return useMutation({
    mutationFn: async (params: SubmitMasteryParams) => {
      const now = new Date().toISOString()
      const periodDate = now.slice(0, 10)

      // 1. Write practice_log audit row
      const { error: logError } = await supabase
        .from('practice_log')
        .insert({
          family_id: params.familyId,
          family_member_id: params.familyMemberId,
          source_type: params.sourceType,
          source_id: params.sourceId,
          draw_id: params.drawId ?? null,
          practice_type: 'mastery_submit',
          evidence_url: params.evidenceUrl ?? null,
          evidence_note: params.evidenceNote ?? null,
          period_date: periodDate,
        })

      if (logError) throw logError

      if (params.sourceType === 'sequential_task') {
        // 2a. Update tasks: mastery_status + status pending_approval when required
        const { data: task, error: taskFetchErr } = await supabase
          .from('tasks')
          .select('id, family_id, require_mastery_approval')
          .eq('id', params.sourceId)
          .single()

        if (taskFetchErr || !task) throw taskFetchErr ?? new Error('Task not found')

        const requireApproval = (task as { require_mastery_approval: boolean }).require_mastery_approval

        if (requireApproval) {
          // Set task pending_approval + create a mastery_submit completion row
          await supabase
            .from('tasks')
            .update({
              mastery_status: 'submitted',
              mastery_submitted_at: now,
              status: 'pending_approval',
            })
            .eq('id', params.sourceId)

          await supabase.from('task_completions').insert({
            task_id: params.sourceId,
            member_id: params.familyMemberId,
            family_member_id: params.familyMemberId,
            period_date: periodDate,
            completion_type: 'mastery_submit',
            approval_status: 'pending',
            rejected: false,
            acted_by: actedBy,
            mastery_evidence_url: params.evidenceUrl ?? null,
            mastery_evidence_note: params.evidenceNote ?? null,
          })
        } else {
          // Auto-approve: mastery_status='approved', task completes, next promotes
          await supabase
            .from('tasks')
            .update({
              mastery_status: 'approved',
              mastery_submitted_at: now,
              mastery_approved_by: actedBy,
              mastery_approved_at: now,
              status: 'completed',
              completed_at: now,
              sequential_is_active: false,
            })
            .eq('id', params.sourceId)

          // Promote next sequential item
          const { data: fullTask } = await supabase
            .from('tasks')
            .select('sequential_collection_id, sequential_position')
            .eq('id', params.sourceId)
            .single()

          if (fullTask?.sequential_collection_id != null && fullTask.sequential_position != null) {
            const nextPosition = fullTask.sequential_position + 1
            const { data: nextTask } = await supabase
              .from('tasks')
              .select('id')
              .eq('sequential_collection_id', fullTask.sequential_collection_id)
              .eq('sequential_position', nextPosition)
              .maybeSingle()

            if (nextTask) {
              await supabase
                .from('tasks')
                .update({ sequential_is_active: true, status: 'pending' })
                .eq('id', (nextTask as { id: string }).id)
              await supabase
                .from('sequential_collections')
                .update({ current_index: nextPosition })
                .eq('id', fullTask.sequential_collection_id)
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ['tasks', task.family_id] })
        queryClient.invalidateQueries({ queryKey: ['pending-approvals', task.family_id] })
        queryClient.invalidateQueries({ queryKey: ['tasks-with-pending-approvals', task.family_id] })
      } else {
        // 2b. Randomizer: set list_items.mastery_status='submitted'
        const { data: item, error: itemFetchErr } = await supabase
          .from('list_items')
          .select('id, list_id, require_mastery_approval')
          .eq('id', params.sourceId)
          .single()

        if (itemFetchErr || !item) throw itemFetchErr ?? new Error('List item not found')

        const requireApproval = (item as { require_mastery_approval: boolean }).require_mastery_approval

        if (requireApproval) {
          await supabase
            .from('list_items')
            .update({ mastery_status: 'submitted', mastery_submitted_at: now })
            .eq('id', params.sourceId)

          if (params.drawId) {
            await supabase
              .from('randomizer_draws')
              .update({ status: 'submitted' })
              .eq('id', params.drawId)
          }
        } else {
          // Auto-approve: mastery done, item exits pool permanently
          await supabase
            .from('list_items')
            .update({
              mastery_status: 'approved',
              mastery_submitted_at: now,
              mastery_approved_by: actedBy,
              mastery_approved_at: now,
              is_available: false,
            })
            .eq('id', params.sourceId)

          if (params.drawId) {
            await supabase
              .from('randomizer_draws')
              .update({ status: 'mastered', completed_at: now })
              .eq('id', params.drawId)
          }
        }

        queryClient.invalidateQueries({ queryKey: ['list-items', item.list_id] })
        queryClient.invalidateQueries({ queryKey: ['randomizer-draws', item.list_id] })
      }

      queryClient.invalidateQueries({
        queryKey: ['practice-log', params.familyMemberId],
      })
    },
  })
}

// ─── useApproveMasterySubmission ───────────────────────────────────
// Mom approves a pending mastery submission.
// For sequential: sets mastery_status='approved', task.status='completed',
// promotes the next sequential item.
// For randomizer: sets mastery_status='approved', list_items.is_available=false
// (item exits pool permanently).
// ───────────────────────────────────────────────────────────────────

export interface ApproveMasteryParams {
  sourceType: PracticeSourceType
  sourceId: string                  // tasks.id | list_items.id
  approverId: string                // family_members.id of the approving parent
  completionId?: string | null      // task_completions.id for sequential items
  drawId?: string | null            // randomizer_draws.id for randomizer items
}

export function useApproveMasterySubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: ApproveMasteryParams) => {
      const now = new Date().toISOString()

      if (params.sourceType === 'sequential_task') {
        // Approve the completion row if present
        // Build M Sub-phase C: also flip completion_type from 'mastery_submit'
        // → 'mastery_approved' so the roll_creature_for_completion RPC accepts
        // this row past its Step 3 filter. Without this flip, the RPC would
        // skip it with skipped_completion_type='mastery_submit'.
        if (params.completionId) {
          await supabase
            .from('task_completions')
            .update({
              approved_by: params.approverId,
              approved_at: now,
              approval_status: 'approved',
              completion_type: 'mastery_approved',
            })
            .eq('id', params.completionId)
        }

        // Mark task mastered + completed
        const { data: task, error: taskErr } = await supabase
          .from('tasks')
          .update({
            mastery_status: 'approved',
            mastery_approved_by: params.approverId,
            mastery_approved_at: now,
            status: 'completed',
            completed_at: now,
            sequential_is_active: false,
          })
          .eq('id', params.sourceId)
          .select('id, family_id, sequential_collection_id, sequential_position')
          .single()

        if (taskErr || !task) throw taskErr ?? new Error('Task not found')

        // Promote the next sequential item
        if (task.sequential_collection_id != null && task.sequential_position != null) {
          const nextPosition = task.sequential_position + 1
          const { data: nextTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('sequential_collection_id', task.sequential_collection_id)
            .eq('sequential_position', nextPosition)
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

        // Build M Sub-phase C — mastery approval fires the gamification
        // pipeline. The completion row's completion_type was updated to
        // 'mastery_approved' above, so the RPC's Step 3 filter accepts it.
        // Idempotent via awarded_source_id if somehow re-fired.
        let gamificationResult: GamificationResult | null = null
        if (params.completionId) {
          gamificationResult = await rollGamificationForCompletion(params.completionId)
        }

        queryClient.invalidateQueries({ queryKey: ['tasks', task.family_id] })
        queryClient.invalidateQueries({ queryKey: ['pending-approvals', task.family_id] })
        queryClient.invalidateQueries({ queryKey: ['tasks-with-pending-approvals', task.family_id] })
        if (task.sequential_collection_id) {
          queryClient.invalidateQueries({ queryKey: ['sequential-collection', task.sequential_collection_id] })
        }
        if (gamificationResult && !gamificationResult.error) {
          queryClient.invalidateQueries({ queryKey: ['family-member'] })
          queryClient.invalidateQueries({ queryKey: ['family-members', task.family_id] })
        }
        return { familyId: task.family_id, gamificationResult }
      } else {
        // Randomizer: mark mastered + exit pool
        // NOTE: Randomizer items do NOT go through task_completions, so the
        // gamification pipeline (which is keyed on task_completions.id) is not
        // fired here. Randomizer mastery awards are a known gap for Sub-phase
        // C — flagged in CLAUDE.md and accepted. A follow-up build will route
        // randomizer mastery through a separate pipeline call.
        const { data: item, error: itemErr } = await supabase
          .from('list_items')
          .update({
            mastery_status: 'approved',
            mastery_approved_by: params.approverId,
            mastery_approved_at: now,
            is_available: false,
          })
          .eq('id', params.sourceId)
          .select('id, list_id')
          .single()

        if (itemErr || !item) throw itemErr ?? new Error('List item not found')

        if (params.drawId) {
          await supabase
            .from('randomizer_draws')
            .update({ status: 'mastered', completed_at: now })
            .eq('id', params.drawId)
        }

        queryClient.invalidateQueries({ queryKey: ['list-items', item.list_id] })
        queryClient.invalidateQueries({ queryKey: ['randomizer-draws', item.list_id] })
        return { familyId: null, gamificationResult: null }
      }
    },
  })
}

// ─── useRejectMasterySubmission ────────────────────────────────────
// Mom rejects a pending mastery submission.
// Key behavior: `mastery_status` returns to 'practicing' (NOT 'rejected').
// The child continues practicing. The rejection is preserved as audit
// history in practice_log and task_completions.
// ───────────────────────────────────────────────────────────────────

export interface RejectMasteryParams {
  sourceType: PracticeSourceType
  sourceId: string
  completionId?: string | null      // task_completions.id for sequential items
  drawId?: string | null            // randomizer_draws.id for randomizer items
  rejectionNote?: string | null
}

export function useRejectMasterySubmission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: RejectMasteryParams) => {
      // Record the rejection on the task_completions row (sequential) for audit.
      if (params.sourceType === 'sequential_task' && params.completionId) {
        await supabase
          .from('task_completions')
          .update({
            rejected: true,
            rejection_note: params.rejectionNote ?? null,
            approval_status: 'rejected',
          })
          .eq('id', params.completionId)
      }

      // Record the rejection on the most recent mastery_submit practice_log
      // entry for this source (audit trail).
      const { data: latestSubmit } = await supabase
        .from('practice_log')
        .select('id')
        .eq('source_type', params.sourceType)
        .eq('source_id', params.sourceId)
        .eq('practice_type', 'mastery_submit')
        .is('rejected', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestSubmit) {
        await supabase
          .from('practice_log')
          .update({
            rejected: true,
            rejection_note: params.rejectionNote ?? null,
          })
          .eq('id', (latestSubmit as { id: string }).id)
      }

      if (params.sourceType === 'sequential_task') {
        // Reset task mastery_status to 'practicing' so the child continues.
        // Task status returns to 'pending' (out of pending_approval).
        const { data: task, error } = await supabase
          .from('tasks')
          .update({
            mastery_status: 'practicing',
            mastery_submitted_at: null,
            status: 'pending',
          })
          .eq('id', params.sourceId)
          .select('id, family_id, sequential_collection_id')
          .single()

        if (error || !task) throw error ?? new Error('Task not found')

        queryClient.invalidateQueries({ queryKey: ['tasks', task.family_id] })
        queryClient.invalidateQueries({ queryKey: ['pending-approvals', task.family_id] })
        queryClient.invalidateQueries({ queryKey: ['tasks-with-pending-approvals', task.family_id] })
        if (task.sequential_collection_id) {
          queryClient.invalidateQueries({ queryKey: ['sequential-collection', task.sequential_collection_id] })
        }
        return { familyId: task.family_id }
      } else {
        // Randomizer: reset list_items.mastery_status + draw.status back to active
        const { data: item, error } = await supabase
          .from('list_items')
          .update({
            mastery_status: 'practicing',
            mastery_submitted_at: null,
          })
          .eq('id', params.sourceId)
          .select('id, list_id')
          .single()

        if (error || !item) throw error ?? new Error('List item not found')

        if (params.drawId) {
          await supabase
            .from('randomizer_draws')
            .update({ status: 'active' })
            .eq('id', params.drawId)
        }

        queryClient.invalidateQueries({ queryKey: ['list-items', item.list_id] })
        queryClient.invalidateQueries({ queryKey: ['randomizer-draws', item.list_id] })
        return { familyId: null }
      }
    },
  })
}

// ─── useMemberPracticeLog ──────────────────────────────────────────
// Query for a member's practice log entries — useful for "today's practice"
// dashboards and future rhythm/report integrations.
// ───────────────────────────────────────────────────────────────────

export function useMemberPracticeLog(memberId: string | undefined, periodDate?: string) {
  return useQuery({
    queryKey: ['practice-log', memberId, periodDate],
    queryFn: async () => {
      if (!memberId) return []

      let query = supabase
        .from('practice_log')
        .select('*')
        .eq('family_member_id', memberId)
        .order('created_at', { ascending: false })

      if (periodDate) {
        query = query.eq('period_date', periodDate)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as PracticeLog[]
    },
    enabled: !!memberId,
  })
}

// Helpful re-exports for consumers
export type { PracticeLog, Task, SequentialCollection }
