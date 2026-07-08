import { supabase } from '@/lib/supabase/client'

/**
 * processRoutineStepCompletion — PRD-24 Point Economy Addendum §5.3/§5.5
 * (rulings 3, 4).
 *
 * Calls the `process_routine_step_completion` SQL RPC, which is the single
 * payout point for a routine step check-off: per-step points
 * (routine_points_mode='per_step', or a step-level 'stars' override),
 * per-completion points (routine_points_mode='per_completion', evaluated via
 * get_member_day_obligations — Convention #271/#278 Rider-2), and per-step
 * prizes (privilege/custom -> earned_prizes, money -> financial_transactions).
 * The RPC owns ALL the rules so this call site stays dumb.
 *
 * Mirrors awardCustomRewardForCompletion's contract exactly: NEVER throws —
 * routine economics are additive, not load-bearing (Convention #199). A
 * failed award must never block a step from being checked off. Idempotent
 * per (step, member, period_date, instance) on the SQL side, so calling
 * this more than once for the same completion is always safe.
 */
export interface ProcessRoutineStepCompletionResult {
  status: 'processed' | 'not_found' | 'skipped_orphan_step' | 'skipped_step_not_found' | 'skipped_task_not_found' | 'error'
  raw: Record<string, unknown> | null
}

export async function processRoutineStepCompletion(
  completionId: string,
): Promise<ProcessRoutineStepCompletionResult> {
  try {
    const { data, error } = await supabase.rpc('process_routine_step_completion', {
      p_completion_id: completionId,
    })

    if (error) {
      console.warn('[processRoutineStepCompletion] RPC error:', error)
      return { status: 'error', raw: null }
    }

    const result = data as Record<string, unknown> | null
    const status = (result?.status as ProcessRoutineStepCompletionResult['status']) ?? 'error'
    return { status, raw: result }
  } catch (err) {
    console.warn('[processRoutineStepCompletion] threw:', err)
    return { status: 'error', raw: null }
  }
}
