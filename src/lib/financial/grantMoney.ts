import { supabase } from '@/lib/supabase/client'

export interface GrantMoneyParams {
  familyId: string
  memberId: string
  amount: number
  transactionType?: string
  description?: string
  sourceType?: string
  sourceReferenceId?: string
  category?: string
  metadata?: Record<string, unknown>
}

export interface GrantMoneyResult {
  status: 'granted' | 'already_awarded' | 'no_op' | 'error'
  transactionId: string | null
  amount: number
  balanceAfter: number | null
}

/**
 * Generic financial transaction writer. Calls the grant_money SQL RPC
 * which computes balance_after and inserts an append-only ledger row.
 * Convention #223: financial_transactions is never UPDATEd or DELETEd.
 * Idempotent: duplicate-key violations return 'already_awarded'.
 * Never throws — returns error status on failure.
 */
export async function grantMoney(params: GrantMoneyParams): Promise<GrantMoneyResult> {
  try {
    const { data, error } = await supabase.rpc('grant_money', {
      p_family_id: params.familyId,
      p_member_id: params.memberId,
      p_amount: params.amount,
      p_transaction_type: params.transactionType ?? 'opportunity_earned',
      p_description: params.description ?? '',
      p_source_type: params.sourceType ?? null,
      p_source_reference_id: params.sourceReferenceId ?? null,
      p_category: params.category ?? null,
      p_metadata: params.metadata ?? {},
    })

    if (error) {
      console.warn('[grantMoney] RPC error:', error)
      return { status: 'error', transactionId: null, amount: 0, balanceAfter: null }
    }

    const result = data as Record<string, unknown> | null
    if (!result) {
      return { status: 'error', transactionId: null, amount: 0, balanceAfter: null }
    }

    const status = (result.status as string) ?? 'error'
    return {
      status: status === 'granted' ? 'granted'
        : status === 'already_awarded' ? 'already_awarded'
        : status === 'no_op' ? 'no_op'
        : 'error',
      transactionId: (result.transaction_id as string) ?? null,
      amount: Number(result.amount ?? 0),
      balanceAfter: result.balance_after != null ? Number(result.balance_after) : null,
    }
  } catch (err) {
    console.warn('[grantMoney] threw:', err)
    return { status: 'error', transactionId: null, amount: 0, balanceAfter: null }
  }
}
