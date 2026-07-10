import { supabase } from '@/lib/supabase/client'

/**
 * grantMoneyForTaskCompletion — FE-FOLLOWUP item 3 (2026-07-10).
 *
 * Calls the `grant_money_for_task_completion` SQL RPC (migration 100312),
 * the server-computed replacement for the client-side pattern of reading
 * `task_rewards.reward_value.amount` in the browser and passing that number
 * as `grantMoney`'s `p_amount` — a same-family amount-tamper vector, since
 * the read happens in an ordinary browser session and the number is editable
 * in devtools between the read and the RPC call (migration 100311's
 * documented residual risk).
 *
 * The RPC reads the reward amount from `task_rewards` INSIDE its own
 * function body — never a caller-supplied parameter — and owns ALL the
 * rules so every call site stays dumb, mirroring `awardCustomRewardForCompletion`
 * exactly:
 *   - task-type filter (opportunity* only; everything else skips)
 *   - reward-type filter (money only; privilege/custom skip)
 *   - Q7 timing rule (require_approval tasks pay out at APPROVAL, not
 *     completion — financial_transactions is append-only with no reversal
 *     path, so this check runs before any read, not just before the write)
 *   - idempotency via financial_transactions'
 *     uq_financial_transactions_forward_per_completion partial unique index
 *     (delegates to grant_money for the actual balance-calc + insert)
 *
 * NEVER throws — money grants are additive, not load-bearing (Convention
 * #199 / mirrors grantMoney's own contract). A failed grant must never block
 * a task from completing or being approved. Returns the RPC status for
 * telemetry.
 *
 * Call sites: useCompleteTask (hooks/useTasks.ts) and useTaskCompletion
 * (components/tasks/useTaskCompletion.ts) — the same two places that
 * previously called `grantMoney` with a client-read amount.
 */
export interface GrantMoneyForTaskCompletionResult {
  status:
    | 'granted'
    | 'already_awarded'
    | 'no_op'
    | 'skipped_task_type'
    | 'skipped_pending_approval'
    | 'skipped_no_member'
    | 'skipped_reward_type'
    | 'skipped_invalid_amount'
    | 'not_found'
    | 'task_not_found'
    | 'error'
  transactionId: string | null
  amount: number
  balanceAfter: number | null
}

export async function grantMoneyForTaskCompletion(
  taskCompletionId: string,
): Promise<GrantMoneyForTaskCompletionResult> {
  try {
    const { data, error } = await supabase.rpc('grant_money_for_task_completion', {
      p_task_completion_id: taskCompletionId,
    })

    if (error) {
      console.warn('[grantMoneyForTaskCompletion] RPC error:', error)
      return { status: 'error', transactionId: null, amount: 0, balanceAfter: null }
    }

    const result = data as Record<string, unknown> | null
    if (!result) {
      return { status: 'error', transactionId: null, amount: 0, balanceAfter: null }
    }

    const status = (result.status as GrantMoneyForTaskCompletionResult['status']) ?? 'error'
    return {
      status,
      transactionId: (result.transaction_id as string) ?? null,
      amount: Number(result.amount ?? 0),
      balanceAfter: result.balance_after != null ? Number(result.balance_after) : null,
    }
  } catch (err) {
    console.warn('[grantMoneyForTaskCompletion] threw:', err)
    return { status: 'error', transactionId: null, amount: 0, balanceAfter: null }
  }
}
