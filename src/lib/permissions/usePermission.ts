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
 * Role-based permission check.
 * Follows the Permission Resolution Order from PRD-02:
 * 1. Primary parent (mom) → ALLOW (check self-restrictions later)
 * 2. Additional adult (dad) → check member_permissions
 * 3. Special adult → check shift + special_adult_permissions
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

      // Primary parent sees all
      if (member.role === 'primary_parent') {
        return { allowed: true, level: 'manage' }
      }

      // Own data — always allowed
      if (targetMemberId === member.id) {
        return { allowed: true, level: 'manage' }
      }

      // Additional adult — check member_permissions
      if (member.role === 'additional_adult' && targetMemberId) {
        const { data } = await supabase
          .from('member_permissions')
          .select('permission_value')
          .eq('family_id', member.family_id)
          .eq('granting_member_id', member.id)
          .eq('target_member_id', targetMemberId)
          .eq('permission_key', featureKey)
          .maybeSingle()

        if (data?.permission_value?.access_level) {
          const level = data.permission_value.access_level as AccessLevel
          return { allowed: level !== 'none', level }
        }

        return { allowed: false, level: 'none' }
      }

      // Default deny
      return { allowed: false, level: 'none' }
    },
    enabled: !!member && !!user,
  })

  const loading = memberLoading || permLoading

  return {
    allowed: permission?.allowed ?? false,
    level: permission?.level ?? 'none',
    loading,
  }
}
