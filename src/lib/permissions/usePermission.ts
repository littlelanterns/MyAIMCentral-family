import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useFamilyMember } from '@/hooks/useFamilyMember'

export type AccessLevel = 'none' | 'view' | 'contribute' | 'manage'

interface PermissionResult {
  allowed: boolean
  level: AccessLevel
  loading: boolean
}

/**
 * PRD-02: Role-based permission check (Layer 3)
 * Permission Resolution Order:
 * 1. Primary parent (mom) → check mom_self_restrictions first, then ALLOW
 * 2. Additional adult (dad) → check member_permissions (granted_to = dad)
 * 3. Special adult → check active shift + special_adult_permissions via assignment
 * 4. Own data → ALLOW
 * 5. Default → DENY
 */
export function usePermission(
  featureKey: string,
  targetMemberId?: string,
): PermissionResult {
  const { user } = useAuth()
  const { data: member, isLoading: memberLoading } = useFamilyMember()

  const { data: permission, isLoading: permLoading } = useQuery({
    queryKey: ['permission', member?.id, targetMemberId, featureKey],
    queryFn: async (): Promise<{ allowed: boolean; level: AccessLevel }> => {
      if (!member) return { allowed: false, level: 'none' }

      // Own data — always full access
      if (!targetMemberId || targetMemberId === member.id) {
        return { allowed: true, level: 'manage' }
      }

      // Primary parent — check self-restrictions, then allow
      if (member.role === 'primary_parent') {
        // Check if mom has restricted herself from this feature for this kid
        const { data: restriction } = await supabase
          .from('mom_self_restrictions')
          .select('id, restriction_type, restricted_tags')
          .eq('family_id', member.family_id)
          .eq('primary_parent_id', member.id)
          .eq('target_member_id', targetMemberId)
          .eq('feature_key', featureKey)
          .maybeSingle()

        if (restriction) {
          // Full restriction — mom can't see this feature for this kid
          if (restriction.restriction_type === 'full') {
            return { allowed: false, level: 'none' }
          }
          // Tag restriction — allowed but with tag filtering (handled at component level)
          return { allowed: true, level: 'manage' }
        }

        return { allowed: true, level: 'manage' }
      }

      // Additional adult — check member_permissions granted TO this adult
      if (member.role === 'additional_adult') {
        // First try the new granted_to column
        const { data: perm } = await supabase
          .from('member_permissions')
          .select('access_level, permission_value')
          .eq('family_id', member.family_id)
          .eq('granted_to', member.id)
          .eq('target_member_id', targetMemberId)
          .eq('permission_key', featureKey)
          .maybeSingle()

        if (perm) {
          // Use access_level if available, fall back to permission_value JSONB
          const level = (perm.access_level || perm.permission_value?.access_level || 'none') as AccessLevel
          return { allowed: level !== 'none', level }
        }

        // Default deny for additional adults — mom must grant access
        return { allowed: false, level: 'none' }
      }

      // Special adult — check active shift + assignment permissions
      if (member.role === 'special_adult') {
        // Check for active shift or always-on access
        const { data: activeShift } = await supabase
          .from('shift_sessions')
          .select('id')
          .eq('special_adult_id', member.id)
          .is('ended_at', null)
          .limit(1)
          .maybeSingle()

        // Also check for always-on access schedule
        const { data: alwaysOn } = await supabase
          .from('access_schedules')
          .select('id')
          .eq('member_id', member.id)
          .eq('schedule_type', 'always_on')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (!activeShift && !alwaysOn) {
          // No active shift and no always-on access — deny everything
          return { allowed: false, level: 'none' }
        }

        // Check assignment exists for this kid
        const { data: assignment } = await supabase
          .from('special_adult_assignments')
          .select('id')
          .eq('special_adult_id', member.id)
          .eq('child_id', targetMemberId)
          .maybeSingle()

        if (!assignment) {
          return { allowed: false, level: 'none' }
        }

        // Check special_adult_permissions for this assignment + feature
        const { data: saPerm } = await supabase
          .from('special_adult_permissions')
          .select('access_level')
          .eq('assignment_id', assignment.id)
          .eq('feature_key', featureKey)
          .maybeSingle()

        if (saPerm) {
          const level = saPerm.access_level as AccessLevel
          return { allowed: level !== 'none', level }
        }

        // Default deny for special adults — mom must configure
        return { allowed: false, level: 'none' }
      }

      // Member (child) — own data only, no cross-member access
      // Teens can see family-level shared data (handled at component level)
      return { allowed: false, level: 'none' }
    },
    enabled: !!member && !!user,
    staleTime: 1000 * 60 * 2,
  })

  const loading = memberLoading || permLoading

  return {
    allowed: permission?.allowed ?? false,
    level: permission?.level ?? 'none',
    loading,
  }
}
