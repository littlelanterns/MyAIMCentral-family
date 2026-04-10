import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface MemberWithColor {
  assigned_color?: string | null
  member_color?: string | null
}

/**
 * Canonical member color resolver.
 * Prefers assigned_color (kept in sync with member_color via FamilyMembers.tsx save handler
 * and migration 00000000100116). Falls back to member_color, then neutral gray.
 *
 * Use this everywhere instead of reading assigned_color or member_color directly.
 */
export function getMemberColor(member: MemberWithColor): string {
  return member.assigned_color || member.member_color || '#6B7280'
}

/**
 * React hook that fetches a single member's resolved color.
 * Useful when you only have a memberId, not the full member object.
 */
export function useMemberColor(memberId: string) {
  return useQuery({
    queryKey: ['member-color', memberId],
    queryFn: async () => {
      const { data } = await supabase
        .from('family_members')
        .select('assigned_color, member_color')
        .eq('id', memberId)
        .single()
      return data ? getMemberColor(data) : '#6B7280'
    },
    staleTime: 5 * 60 * 1000,
  })
}
