/**
 * useMessagingPermissions — PRD-15 Phase D
 *
 * Checks who a member can message. Mom and Dad (primary_parent + additional_adult)
 * have implicit permission to message anyone — no explicit records needed.
 * Kids/teens need explicit member_messaging_permissions records.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { FamilyMember } from '@/hooks/useFamilyMember'

const PERMISSIONS_KEY = 'messaging-permissions'

interface PermittedContact {
  memberId: string
  displayName: string
  avatarUrl: string | null
  assignedColor: string | null
  role: FamilyMember['role']
}

/**
 * Returns the list of family members the current user can message.
 * - Mom/Dad: can message everyone (implicit)
 * - Kids/Teens: only members with explicit permission records
 */
export function useMessagingPermissions() {
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: allMembers } = useFamilyMembers(currentFamily?.id)

  const memberId = currentMember?.id
  const familyId = currentFamily?.id
  const isParent = currentMember?.role === 'primary_parent' || currentMember?.role === 'additional_adult'

  return useQuery({
    queryKey: [PERMISSIONS_KEY, familyId, memberId],
    queryFn: async (): Promise<PermittedContact[]> => {
      if (!memberId || !familyId || !allMembers) return []

      const activeMembers = allMembers.filter(m => m.is_active && m.id !== memberId)

      // Parents can message everyone
      if (isParent) {
        return activeMembers.map(m => ({
          memberId: m.id,
          displayName: m.display_name,
          avatarUrl: m.avatar_url,
          assignedColor: m.assigned_color,
          role: m.role,
        }))
      }

      // Non-parents: check explicit permissions
      const { data: permissions, error } = await supabase
        .from('member_messaging_permissions')
        .select('can_message_member_id')
        .eq('member_id', memberId)

      if (error) throw error

      const permittedIds = new Set((permissions ?? []).map(p => p.can_message_member_id))

      // Always allow messaging parents (implicit in app layer per PRD-15)
      for (const m of activeMembers) {
        if (m.role === 'primary_parent' || m.role === 'additional_adult') {
          permittedIds.add(m.id)
        }
      }

      return activeMembers
        .filter(m => permittedIds.has(m.id))
        .map(m => ({
          memberId: m.id,
          displayName: m.display_name,
          avatarUrl: m.avatar_url,
          assignedColor: m.assigned_color,
          role: m.role,
        }))
    },
    enabled: !!memberId && !!familyId && !!allMembers,
  })
}

/** Check if current member can message a specific other member */
export function useCanMessage(otherMemberId: string | undefined) {
  const { data: permitted } = useMessagingPermissions()

  if (!otherMemberId || !permitted) return false
  return permitted.some(p => p.memberId === otherMemberId)
}
