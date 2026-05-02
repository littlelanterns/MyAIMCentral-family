import { supabase } from '@/lib/supabase/client'
import type { GamificationResult } from '@/types/gamification'

/**
 * Calls the SECURITY DEFINER RPC that awards points, updates streak,
 * rolls a creature, and checks for a page unlock — all in one atomic
 * transaction, keyed by the task_completions.id that just fired.
 *
 * CRITICAL: never throws. If the RPC errors (network blip, DB error,
 * whatever) we log a warning and return null. Gamification is ADDITIVE.
 * A failure here must never block a task from being marked complete.
 */
export async function rollGamificationForCompletion(
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
