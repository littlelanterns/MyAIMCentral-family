import { supabase } from '@/lib/supabase/client'

export interface GrantPointsResult {
  status: 'granted' | 'no_op' | 'failed' | 'error'
  pointsAwarded: number
  newTotal: number | null
}

/**
 * Awards gamification points to a family member via the grant_points SQL RPC.
 * Points only — does not touch streaks, creatures, or pages.
 * Respects gamification_configs.enabled master toggle.
 * Never throws — returns error status on failure.
 */
export async function grantPoints(
  familyId: string,
  memberId: string,
  points: number,
): Promise<GrantPointsResult> {
  try {
    const { data, error } = await supabase.rpc('grant_points', {
      p_family_id: familyId,
      p_member_id: memberId,
      p_points: points,
    })

    if (error) {
      console.warn('[grantPoints] RPC error:', error)
      return { status: 'error', pointsAwarded: 0, newTotal: null }
    }

    const result = data as Record<string, unknown> | null
    if (!result) {
      return { status: 'error', pointsAwarded: 0, newTotal: null }
    }

    const status = (result.status as string) ?? 'error'
    return {
      status: status === 'granted' ? 'granted'
        : status === 'no_op' ? 'no_op'
        : status === 'failed' ? 'failed'
        : 'error',
      pointsAwarded: Number(result.points_awarded ?? 0),
      newTotal: result.new_total != null ? Number(result.new_total) : null,
    }
  } catch (err) {
    console.warn('[grantPoints] threw:', err)
    return { status: 'error', pointsAwarded: 0, newTotal: null }
  }
}
