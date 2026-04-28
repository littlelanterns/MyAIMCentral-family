/**
 * Opportunity-List Unification hooks.
 *
 * Core pattern: a list item becomes a task via the claim→task bridge.
 * Kid browses opportunity list → taps "I'll do this!" → task spawns on dashboard.
 *
 * Reuses existing infrastructure:
 *   - task_claims table (PRD-09A) for lock mechanics
 *   - task_completions pipeline for gamification/approval
 *   - list_items advancement columns (Build J) for mastery tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { List, ListItem, OpportunitySubtype } from '@/types/lists'
import { todayLocalIso } from '@/utils/dates'

// ============================================================
// useOpportunityLists — all opportunity-flagged lists for a family
// ============================================================

/**
 * Fetch all opportunity lists for a family.
 * When memberId is provided, filters to lists where the member is eligible
 * (eligible_members is null = everyone, or array containing the memberId).
 */
export function useOpportunityLists(familyId: string | undefined, memberId?: string) {
  return useQuery({
    queryKey: ['opportunity-lists', familyId, memberId],
    queryFn: async () => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_opportunity', true)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })

      if (error) throw error
      const lists = data as List[]

      // Client-side filter by eligible_members (null = everyone is eligible)
      if (!memberId) return lists
      return lists.filter(l =>
        l.eligible_members === null || l.eligible_members.length === 0 || l.eligible_members.includes(memberId)
      )
    },
    enabled: !!familyId,
  })
}

// ============================================================
// useOpportunityItems — available items from an opportunity list
// ============================================================

export function useOpportunityItems(listId: string | undefined) {
  return useQuery({
    queryKey: ['opportunity-items', listId],
    queryFn: async () => {
      if (!listId) return []

      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .eq('is_available', true)
        .order('sort_order')

      if (error) throw error
      return data as ListItem[]
    },
    enabled: !!listId,
  })
}

// ============================================================
// useClaimOpportunityItem — claim→task bridge
//
// 1. Checks item availability (not already claimed for one_time/claimable)
// 2. Creates task_claims record with lock duration (if claimable)
// 3. Creates tasks record with source='opportunity_list_claim'
// 4. Returns the created task ID
// ============================================================

interface ClaimOpportunityInput {
  listItem: ListItem
  list: List
  memberId: string
  familyId: string
  createdBy: string  // who pressed the button (may differ from memberId in View As)
}

interface ClaimOpportunityResult {
  taskId: string
  claimId: string | null
}

export function useClaimOpportunityItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listItem,
      list,
      memberId,
      familyId,
      createdBy,
    }: ClaimOpportunityInput): Promise<ClaimOpportunityResult> => {
      const subtype = listItem.opportunity_subtype ?? list.default_opportunity_subtype ?? 'one_time'

      // ── 1. Check availability ──────────────────────────────
      if (subtype === 'one_time' || subtype === 'claimable') {
        // Check for existing active claims on tasks sourced from this list item
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('source', 'opportunity_list_claim')
          .eq('source_reference_id', listItem.id)
          .in('status', ['pending', 'in_progress', 'pending_approval'])
          .limit(1)

        if (existingTasks && existingTasks.length > 0) {
          throw new Error('ITEM_ALREADY_CLAIMED')
        }
      }

      // For repeatable items, check cooldown
      if (subtype === 'repeatable' && listItem.cooldown_hours) {
        const cooldownCutoff = new Date(
          Date.now() - listItem.cooldown_hours * 60 * 60 * 1000,
        ).toISOString()

        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('source', 'opportunity_list_claim')
          .eq('source_reference_id', listItem.id)
          .eq('assignee_id', memberId)
          .gte('created_at', cooldownCutoff)
          .limit(1)

        if (recentTasks && recentTasks.length > 0) {
          throw new Error('COOLDOWN_ACTIVE')
        }
      }

      // ── 2. Map opportunity subtype to task type ────────────
      const taskTypeMap: Record<OpportunitySubtype, string> = {
        one_time: 'opportunity_capped',
        claimable: 'opportunity_claimable',
        repeatable: 'opportunity_repeatable',
      }
      const taskType = taskTypeMap[subtype as OpportunitySubtype] ?? 'task'

      // ── 3. Build reward fields ─────────────────────────────
      const rewardType = listItem.reward_type ?? list.default_reward_type
      const rewardAmount = listItem.reward_amount ?? list.default_reward_amount

      // ── 4. Create the task ─────────────────────────────────
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          family_id: familyId,
          created_by: createdBy,
          assignee_id: memberId,
          title: listItem.content || listItem.item_name || 'Opportunity',
          description: listItem.notes ?? null,
          task_type: taskType,
          status: 'in_progress',
          source: 'opportunity_list_claim',
          source_reference_id: listItem.id,
          // Carry forward advancement/mastery from list item
          advancement_mode: listItem.advancement_mode ?? 'complete',
          practice_target: listItem.practice_target,
          require_mastery_approval: listItem.require_mastery_approval ?? false,
          require_mastery_evidence: listItem.require_mastery_evidence ?? false,
          track_duration: listItem.track_duration ?? list.default_track_duration ?? false,
          track_progress: listItem.track_progress ?? list.default_track_progress ?? false,
          in_progress_member_id: (listItem.track_progress ?? list.default_track_progress ?? false) ? memberId : null,
          // Opportunity fields
          max_completions: subtype === 'one_time' ? 1 : (listItem.max_instances ?? null),
          claim_lock_duration: listItem.claim_lock_duration ?? list.default_claim_lock_duration ?? null,
          claim_lock_unit: listItem.claim_lock_unit ?? list.default_claim_lock_unit ?? null,
          // Reward info via points_override (for gamification pipeline)
          points_override: rewardType === 'points' && rewardAmount ? rewardAmount : null,
          // Resource URL if available
          resource_url: listItem.url ?? null,
        })
        .select('id')
        .single()

      if (taskError) throw taskError

      // ── 5. Create task_rewards record if reward configured ─
      if (rewardType && rewardAmount) {
        await supabase
          .from('task_rewards')
          .insert({
            task_id: task.id,
            reward_type: rewardType,
            reward_value: { amount: rewardAmount },
          })
      }

      // ── 6. Create claim record (for claimable with lock) ──
      let claimId: string | null = null
      if (subtype === 'claimable') {
        const lockDuration = listItem.claim_lock_duration ?? list.default_claim_lock_duration ?? null
        const lockUnit = listItem.claim_lock_unit ?? list.default_claim_lock_unit ?? 'hours'

        let lockMinutes = 240 // default 4 hours
        if (lockDuration) {
          switch (lockUnit) {
            case 'minutes': lockMinutes = lockDuration; break
            case 'hours': lockMinutes = lockDuration * 60; break
            case 'days': lockMinutes = lockDuration * 60 * 24; break
          }
        }

        const expiresAt = new Date(Date.now() + lockMinutes * 60 * 1000).toISOString()

        const { data: claim, error: claimError } = await supabase
          .from('task_claims')
          .insert({
            task_id: task.id,
            member_id: memberId,
            claimed_by: memberId,
            expires_at: expiresAt,
            status: 'claimed',
            completed: false,
            released: false,
          })
          .select('id')
          .single()

        if (claimError) {
          // Claim failed — clean up the task we just created
          await supabase.from('tasks').delete().eq('id', task.id)
          throw claimError
        }

        claimId = claim.id
      }

      return { taskId: task.id, claimId }
    },
    onSuccess: (_result, variables) => {
      // Invalidate everything that needs refreshing
      queryClient.invalidateQueries({ queryKey: ['opportunity-items', variables.listItem.list_id] })
      queryClient.invalidateQueries({ queryKey: ['opportunity-lists', variables.familyId] })
      queryClient.invalidateQueries({ queryKey: ['list-items', variables.listItem.list_id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.familyId] })
      queryClient.invalidateQueries({ queryKey: ['my-claims', variables.memberId] })
    },
  })
}

// ============================================================
// useCompleteOpportunityTask — completion flow for opportunity tasks
//
// On task completion:
// 1. Mark task completed
// 2. Update list_items.completed_instances
// 3. For one_time: set list_items.is_available = false
// 4. For repeatable: update last_completed_at, respect cooldown
// 5. Release claim if claimable
// ============================================================

export function useCompleteOpportunityTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      memberId,
      listItemId,
      subtype,
    }: {
      taskId: string
      memberId: string
      listItemId: string
      subtype: OpportunitySubtype
    }) => {
      // 1. Create task_completion record
      const periodDate = todayLocalIso()
      const { error: compError } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          member_id: memberId,
          family_member_id: memberId,
          period_date: periodDate,
          rejected: false,
        })

      if (compError) throw compError

      // 2. Mark task completed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      if (taskError) throw taskError

      // 3. Update list item tracking
      const updates: Record<string, unknown> = {
        last_completed_at: new Date().toISOString(),
      }

      if (subtype === 'one_time') {
        updates.is_available = false
      }

      // Increment completed_instances via RPC-style (read + write since Supabase
      // JS client doesn't support column references in .update())
      const { data: currentItem } = await supabase
        .from('list_items')
        .select('completed_instances')
        .eq('id', listItemId)
        .single()

      const newCount = (currentItem?.completed_instances ?? 0) + 1
      updates.completed_instances = newCount

      // Check if max_instances reached (for capped items)
      const { data: itemData } = await supabase
        .from('list_items')
        .select('max_instances')
        .eq('id', listItemId)
        .single()

      if (itemData?.max_instances && newCount >= itemData.max_instances) {
        updates.is_available = false
      }

      const { error: itemError } = await supabase
        .from('list_items')
        .update(updates)
        .eq('id', listItemId)

      if (itemError) throw itemError

      // 4. Release any active claims on this task
      await supabase
        .from('task_claims')
        .update({
          completed: true,
          status: 'completed',
        })
        .eq('task_id', taskId)
        .eq('completed', false)
        .eq('released', false)

      return { taskId, listItemId }
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-items'] })
      queryClient.invalidateQueries({ queryKey: ['list-items'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-completions', variables.taskId] })
      queryClient.invalidateQueries({ queryKey: ['my-claims', variables.memberId] })
    },
  })
}

// ============================================================
// Helper: check if a member can claim a specific item
// ============================================================

export function canClaimItem(
  item: ListItem,
  list: List,
  memberId: string,
): { canClaim: boolean; reason?: string } {
  // Check eligible_members if set
  if (list.eligible_members && list.eligible_members.length > 0) {
    if (!list.eligible_members.includes(memberId)) {
      return { canClaim: false, reason: 'Not eligible for this list' }
    }
  }

  // Check availability
  if (!item.is_available) {
    return { canClaim: false, reason: 'No longer available' }
  }

  // Check max_instances
  if (item.max_instances && item.completed_instances >= item.max_instances) {
    return { canClaim: false, reason: 'Maximum completions reached' }
  }

  return { canClaim: true }
}

// ============================================================
// useActiveOpportunityClaims — tasks from opportunity claims
// that are currently in-progress for a member
// ============================================================

export function useActiveOpportunityClaims(memberId: string | undefined, familyId: string | undefined) {
  return useQuery({
    queryKey: ['opportunity-claimed-tasks', memberId, familyId],
    queryFn: async () => {
      if (!memberId || !familyId) return []

      const { data, error } = await supabase
        .from('tasks')
        .select('*, task_rewards(*)')
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .eq('source', 'opportunity_list_claim')
        .in('status', ['pending', 'in_progress', 'pending_approval'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!memberId && !!familyId,
  })
}
