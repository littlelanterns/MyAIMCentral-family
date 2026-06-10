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

export type ViewableAccessLevel = 'none' | 'view' | 'contribute' | 'manage'

const LEVEL_ORDER: ViewableAccessLevel[] = ['none', 'view', 'contribute', 'manage']

/** True when `level` is at or above `min` in the PRD-02 four-level ladder. */
export function accessLevelAtLeast(
  level: ViewableAccessLevel | undefined,
  min: ViewableAccessLevel,
): boolean {
  return LEVEL_ORDER.indexOf(level ?? 'none') >= LEVEL_ORDER.indexOf(min)
}

export interface ViewableMembersResult {
  /** Member ids the current member may view (always includes self when loaded). */
  viewableIds: Set<string>
  /** The viewable members' full records, in roster sort order. */
  viewableMembers: FamilyMember[]
  /**
   * Access level per viewable member id (PERMISSIONS-WIRING build):
   * mom → 'manage' for everyone; self → 'manage'; granted additional_adult →
   * the grant's level. Lets surfaces distinguish "can see" (view) from
   * "can act" (contribute/manage) — founder Decision 9, 2026-06-09.
   */
  viewableLevels: Record<string, ViewableAccessLevel>
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
  // Rows with target_member_id NULL are FAMILY-WIDE grants (migration 100261):
  // they cover every kid (role='member'), with per-kid rows winning as
  // exceptions in both directions (incl. an explicit per-kid 'none' carve-out).
  const { data: grantRows, isLoading: grantsLoading } = useQuery({
    queryKey: ['viewable-member-grants', member?.id, featureKey],
    queryFn: async (): Promise<Array<{ target: string | null; level: ViewableAccessLevel }>> => {
      if (!member) return []
      const { data, error } = await supabase
        .from('member_permissions')
        .select('target_member_id, access_level, permission_value')
        .eq('family_id', member.family_id)
        .eq('granted_to', member.id)
        .eq('permission_key', featureKey)
      if (error) throw error
      return (data ?? []).map(p => ({
        target: p.target_member_id as string | null,
        level: (p.access_level || p.permission_value?.access_level || 'none') as ViewableAccessLevel,
      }))
    },
    enabled: !!member && member.role === 'additional_adult',
    staleTime: 1000 * 60 * 2,
  })

  const roster = familyMembers
  const memberId = member?.id
  const memberRole = member?.role

  const { viewableIds, viewableMembers, viewableLevels } = useMemo(() => {
    const rosterArr = roster ?? []
    let ids: Set<string>
    const levels: Record<string, ViewableAccessLevel> = {}
    if (!memberId) {
      ids = new Set<string>()
    } else if (memberRole === 'primary_parent') {
      ids = new Set(rosterArr.map(m => m.id))
      ids.add(memberId)
      ids.forEach(id => { levels[id] = 'manage' })
    } else if (memberRole === 'additional_adult') {
      ids = new Set([memberId])
      levels[memberId] = 'manage'
      const familyWide = (grantRows ?? []).find(g => g.target === null)?.level
      const perKid = new Map(
        (grantRows ?? []).filter(g => g.target !== null).map(g => [g.target as string, g.level]),
      )
      // Family-wide grant covers every kid; per-kid rows win for their kid.
      if (familyWide && familyWide !== 'none') {
        for (const m of rosterArr) {
          if (m.role !== 'member' || m.id === memberId) continue
          const effective = perKid.get(m.id) ?? familyWide
          if (effective !== 'none') {
            ids.add(m.id)
            levels[m.id] = effective
          }
        }
      }
      for (const [id, level] of perKid) {
        if (level === 'none') continue
        ids.add(id)
        levels[id] = level
      }
    } else {
      // special_adult / member — self only
      ids = new Set([memberId])
      levels[memberId] = 'manage'
    }
    return {
      viewableIds: ids,
      viewableMembers: rosterArr.filter(m => ids.has(m.id)),
      viewableLevels: levels,
    }
  }, [roster, memberId, memberRole, grantRows])

  return {
    viewableIds,
    viewableMembers,
    viewableLevels,
    isMom,
    isLoading:
      memberLoading ||
      rosterLoading ||
      (member?.role === 'additional_adult' && grantsLoading),
  }
}
