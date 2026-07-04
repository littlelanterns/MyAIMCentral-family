/**
 * opportunityListWriteBack — completion write-back for opportunity
 * claim-bridge tasks (OPPORTUNITY-SURFACES, founder-requested 2026-07-02).
 *
 * Closes a platform-wide gap: `useCompleteOpportunityTask` (the only code
 * that wrote list_items.completed_instances / is_available on completion)
 * was exported but never called — completing a claimed board job released
 * the claim and paid rewards but never consumed the list item, so one_time
 * items became claimable again after completion.
 *
 * Called from every completion path a claim-bridge task can take:
 *   - useTaskCompletion.ts  completeTask   (TaskCard toggle, all shells)
 *   - useTasks.ts           useCompleteTask (PlayDashboard, FO, spot-check)
 *   - useTasks.ts           useApproveTaskCompletion (approval timing, Q7 rule)
 *   - useTaskCompletions.ts useApproveCompletion     (legacy approval path)
 * and reversed from the two uncomplete paths (which already release the
 * claim "so the job goes back to the pool" — the item now follows).
 *
 * NEVER throws — gamification-adjacent writes are additive, not load-bearing
 * (same contract as grantMoney / awardCustomRewardForCompletion). Returns the
 * affected list ids so call sites can invalidate board caches, or null when
 * the task isn't a claim-bridge task or the write failed.
 */
import { supabase } from '@/lib/supabase/client'
import type { QueryClient } from '@tanstack/react-query'

export interface OpportunityWriteBackResult {
  listId: string
  listItemId: string
}

/** Refresh every surface that renders board availability after a write-back. */
export function invalidateOpportunityBoardCaches(
  queryClient: QueryClient,
  result: OpportunityWriteBackResult | null,
): void {
  if (!result) return
  queryClient.invalidateQueries({ queryKey: ['opportunity-items', result.listId] })
  queryClient.invalidateQueries({ queryKey: ['list-items', result.listId] })
  queryClient.invalidateQueries({ queryKey: ['opportunity-lists'] })
  queryClient.invalidateQueries({ queryKey: ['fo-opportunity-boards'] })
  queryClient.invalidateQueries({ queryKey: ['list-item-claim-status', result.listId] })
}

export async function writeBackOpportunityCompletion(
  taskId: string,
  direction: 'complete' | 'uncomplete' = 'complete',
): Promise<OpportunityWriteBackResult | null> {
  try {
    // All logic is server-side in the consume_opportunity_list_item RPC
    // (migration 100280, SECURITY DEFINER): kids have NO direct list_items
    // write path (li_via_list is owner/mom/shares only — the same silent-RLS
    // gap that meant useCompleteOpportunityTask could never have worked for
    // kid sessions). The RPC derives every written value from the bridge
    // task + item, restricts writes to completed_instances / is_available /
    // last_completed_at, and authorizes only the task assignee, parents, or
    // a family-shadow session. It self-filters non-bridge tasks, so calling
    // it unconditionally from approval hooks is safe.
    const { data, error } = await supabase.rpc('consume_opportunity_list_item', {
      p_task_id: taskId,
      p_direction: direction,
    })
    if (error) {
      console.warn('[opportunityListWriteBack] RPC failed (non-blocking):', error.message)
      return null
    }

    const result = data as { status?: string; list_id?: string; list_item_id?: string } | null
    if (result?.status !== 'ok') {
      // not_bridge_task is the expected no-op for ordinary tasks — stay quiet
      if (result?.status && result.status !== 'not_bridge_task') {
        console.warn('[opportunityListWriteBack] RPC declined (non-blocking):', result.status)
      }
      return null
    }
    if (!result.list_id || !result.list_item_id) return null

    return { listId: result.list_id, listItemId: result.list_item_id }
  } catch (err) {
    console.warn('[opportunityListWriteBack] non-blocking failure:', err)
    return null
  }
}
