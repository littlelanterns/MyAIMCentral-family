/**
 * useViewableMembers — PRD-02 read-scoping for member-data surfaces.
 *
 * Answers: "whose data may the current member SEE on a given feature surface?"
 *
 * Resolution (mirrors usePermission's Layer-3 order, in bulk):
 *  - primary_parent      → every active family member (mom sees all)
 *  - additional_adult    → self + members with a non-'none' member_permissions
 *                          grant (granted_to = me) for the given feature key
 *  - special_adult       → self only (shift-scoped surfaces handle their own
 *                          access via special_adult_permissions — not widened here)
 *  - member (kids/teens) → self only
 *
 * This is DISPLAY-layer scoping (same layer the existing kid task/list filters
 * use). It intentionally checks member_permissions directly rather than
 * useCanAccess() — the beta all-tiers-unlocked behavior (Convention #10) applies
 * to tier thresholds, not to mom's per-member grants.
 *
 * Origin: role-scoping leak pass 2026-06-09 (founder ruling: each person sees
 * only their own; mom sees all; grants extend dad's view).
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers, type FamilyMember } from './useFamilyMember'

export interface ViewableMembersResult {
  /** Member ids the current member may view (always includes self when loaded). */
  viewableIds: Set<string>
  /** The viewable members' full records, in roster sort order. */
  viewableMembers: FamilyMember[]
  /** True when the current member is the primary parent. */
  isMom: boolean
  isLoading: boolean
}

/** Minimal member shape needed for scoping — lets View-As surfaces pass the
 *  EFFECTIVE member (data subject) so scoping reflects what THEY may see. */
export interface ViewableScopeMember {
  id: string
  family_id: string
  role: string
}

export function useViewableMembers(
  featureKey: string,
  forMember?: ViewableScopeMember | null,
): ViewableMembersResult {
  const { data: authMember, isLoading: memberLoading } = useFamilyMember()
  // Scope to the effective member when provided (View-As), else the auth member.
  const member = forMember ?? authMember
  const { data: familyMembers, isLoading: rosterLoading } = useFamilyMembers(member?.family_id)

  const isMom = member?.role === 'primary_parent'

  // Bulk grant lookup — only needed for additional_adult.
  const { data: grantedIds, isLoading: grantsLoading } = useQuery({
    queryKey: ['viewable-member-grants', member?.id, featureKey],
    queryFn: async (): Promise<string[]> => {
      if (!member) return []
      const { data, error } = await supabase
        .from('member_permissions')
        .select('target_member_id, access_level, permission_value')
        .eq('family_id', member.family_id)
        .eq('granted_to', member.id)
        .eq('permission_key', featureKey)
      if (error) throw error
      return (data ?? [])
        .filter(p => {
          const level = p.access_level || p.permission_value?.access_level || 'none'
          return level !== 'none'
        })
        .map(p => p.target_member_id as string)
    },
    enabled: !!member && member.role === 'additional_adult',
    staleTime: 1000 * 60 * 2,
  })

  const roster = familyMembers
  const memberId = member?.id
  const memberRole = member?.role

  const { viewableIds, viewableMembers } = useMemo(() => {
    const rosterArr = roster ?? []
    let ids: Set<string>
    if (!memberId) {
      ids = new Set<string>()
    } else if (memberRole === 'primary_parent') {
      ids = new Set(rosterArr.map(m => m.id))
      ids.add(memberId)
    } else if (memberRole === 'additional_adult') {
      ids = new Set([memberId, ...(grantedIds ?? [])])
    } else {
      // special_adult / member — self only
      ids = new Set([memberId])
    }
    return { viewableIds: ids, viewableMembers: rosterArr.filter(m => ids.has(m.id)) }
  }, [roster, memberId, memberRole, grantedIds])

  return {
    viewableIds,
    viewableMembers,
    isMom,
    isLoading:
      memberLoading ||
      rosterLoading ||
      (member?.role === 'additional_adult' && grantsLoading),
  }
}
