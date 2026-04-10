/**
 * useMessagingPermissions — PRD-15 Phase D
 *
 * Checks who a member can message. Mom and Dad (primary_parent + additional_adult)
 * have implicit permission to message anyone — no explicit records needed.
 *
 * Guided and Independent members (role='member') have implicit default permission
 * to message both parents AND siblings (other role='member' family members). This
 * matches the family-default expectation: kids can talk to their parents and to
 * each other out of the box. Special adults (caregivers) are NOT in the default
 * and still require explicit member_messaging_permissions rows.
 *
 * When mom's permission-management UI is built (future), it will layer negative
 * overrides on top of this default (e.g. "block this sibling pair").
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
  memberColor: string | null
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

      // Active, in-household, not self. Out-of-nest members live in their own
      // table for messaging purposes (see convention #142) and shouldn't appear
      // in the normal compose picker even if a legacy family_members row exists.
      //
      // TODO (Out of Nest messaging, PRD-15 Phase E): When Out of Nest messaging
      // is built, this hook must ALSO fetch from the `out_of_nest_members` table
      // and merge the results — they are a separate contact source, not part of
      // `family_members`. Per Tenise (2026-04-06), Out of Nest members are higher
      // priority than Special Adults in the compose picker — surface them as a
      // first-class group, not an afterthought. The merge likely needs a new
      // `contactSource: 'family' | 'out_of_nest'` field on PermittedContact so
      // the UI can render them distinctly.
      const activeMembers = allMembers.filter(
        m => m.is_active && !m.out_of_nest && m.id !== memberId,
      )

      // Parents can message everyone
      if (isParent) {
        return activeMembers.map(m => ({
          memberId: m.id,
          displayName: m.display_name,
          avatarUrl: m.avatar_url,
          assignedColor: m.assigned_color,
          memberColor: m.member_color ?? null,
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

      // Default permissions for kids (role='member'): can always message parents
      // AND siblings (other role='member' family members). Special adults are
      // intentionally NOT in the default — they require explicit permission rows.
      for (const m of activeMembers) {
        if (
          m.role === 'primary_parent' ||
          m.role === 'additional_adult' ||
          m.role === 'member'
        ) {
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
          memberColor: m.member_color ?? null,
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
