import { supabase } from '@/lib/supabase/client'

/**
 * awardCustomRewardForCompletion — KIDS-REWARDS-PAGE Q7 pipe.
 *
 * Calls the `award_custom_reward_for_completion` SQL RPC, which creates an
 * `earned_prizes` row when the completed task carries a privileges /
 * family_activities reward (the "popsicle" promise). The RPC owns ALL the
 * rules so every call site stays dumb:
 *   - reward-type filter (privileges/family_activities only; money/points skip)
 *   - Q7 timing rule (require_approval tasks award at APPROVAL, not completion)
 *   - practice / mastery_submit completions never award (Convention #200 parity)
 *   - idempotency via earned_prizes.awarded_completion_id (UNIQUE)
 *
 * Mirrors grantMoney's contract: NEVER throws — rewards are additive, not
 * load-bearing (Convention #199). A failed award must never block a task
 * from completing or being approved. Returns the RPC status for telemetry.
 *
 * Call sites (same set that handles the money forward-write / approval deeds):
 *   - useCompleteTask (hooks/useTasks.ts)            — completion-time
 *   - useTaskCompletion (components/tasks)           — completion-time
 *   - useApproveTaskCompletion (hooks/useTasks.ts)   — approval-time
 *   - useApproveCompletion (hooks/useTaskCompletions.ts) — approval-time
 */
export interface AwardCustomRewardResult {
  status:
    | 'awarded'
    | 'already_awarded'
    | 'skipped_reward_type'
    | 'skipped_pending_approval'
    | 'skipped_completion_type'
    | 'skipped_no_member'
    | 'not_found'
    | 'task_not_found'
    | 'error'
  prizeId: string | null
}

export async function awardCustomRewardForCompletion(
  taskCompletionId: string,
): Promise<AwardCustomRewardResult> {
  try {
    const { data, error } = await supabase.rpc('award_custom_reward_for_completion', {
      p_task_completion_id: taskCompletionId,
    })

    if (error) {
      console.warn('[awardCustomReward] RPC error:', error)
      return { status: 'error', prizeId: null }
    }

    const result = data as Record<string, unknown> | null
    const status = (result?.status as AwardCustomRewardResult['status']) ?? 'error'
    return {
      status,
      prizeId: (result?.prize_id as string) ?? null,
    }
  } catch (err) {
    console.warn('[awardCustomReward] threw:', err)
    return { status: 'error', prizeId: null }
  }
}
