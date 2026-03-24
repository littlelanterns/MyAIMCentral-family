import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

/**
 * PRD-02 + PRD-31: Three-layer feature access check
 * Layer 1: Tier threshold (feature_access_v2)
 * Layer 2: Member toggle (member_feature_toggles)
 * Layer 3: Founding family override (bypasses Layer 1 only)
 *
 * Returns { allowed, blockedBy, upgradeTier?, loading }
 */

export type BlockedBy = 'none' | 'tier' | 'toggle' | 'never'

export interface CanAccessResult {
  allowed: boolean
  blockedBy: BlockedBy
  upgradeTier?: string
  loading: boolean
}

export function useCanAccess(featureKey: string, memberId?: string): CanAccessResult {
  const { data: currentMember } = useFamilyMember()
  const targetMemberId = memberId ?? currentMember?.id

  const { data, isLoading } = useQuery({
    queryKey: ['can-access', featureKey, targetMemberId],
    queryFn: async () => {
      if (!targetMemberId) return { allowed: true, blockedBy: 'none' as BlockedBy }

      const { data: result, error } = await supabase.rpc('check_feature_access', {
        p_member_id: targetMemberId,
        p_feature_key: featureKey,
      })

      if (error) {
        // During beta, fail open so features remain accessible
        console.warn('useCanAccess error, failing open:', error.message)
        return { allowed: true, blockedBy: 'none' as BlockedBy }
      }

      return result as { allowed: boolean; blockedBy: BlockedBy; upgradeTier?: string }
    },
    enabled: !!targetMemberId,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading || !data) {
    return { allowed: true, blockedBy: 'none', loading: isLoading }
  }

  return {
    allowed: data.allowed,
    blockedBy: data.blockedBy,
    upgradeTier: data.upgradeTier,
    loading: false,
  }
}
