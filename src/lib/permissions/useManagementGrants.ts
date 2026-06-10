/**
 * useManagementGrants — bulk lookup of the PERMISSIONS-WIRING grant keys for
 * one member (default: the signed-in member; pass `forMember` for View-As
 * effective-member scoping).
 *
 * Three grant shapes (founder gate 2026-06-09):
 *  - 'studio'        — FAMILY-WIDE row (target_member_id IS NULL). view = browse,
 *                      manage = create/edit/deploy.
 *  - 'reward_rules'  — FAMILY-WIDE row. view = see contracts, manage = create/edit.
 *  - 'financial_tracking' — PER-KID rows. view = read kid's ledger/balances/loans,
 *                      contribute = + record payments / Mark Paid,
 *                      manage = + Allowance tab period ops.
 *
 * Resolution: mom → manage everything. additional_adult → granted levels.
 * Everyone else → none. RLS enforces the same shape server-side
 * (migration 00000000100260).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { ViewableScopeMember } from '@/hooks/useViewableMembers'
import type { ViewableAccessLevel } from '@/hooks/useViewableMembers'

export interface ManagementGrants {
  /** Family-wide Studio grant level ('none' when ungranted). */
  studioLevel: ViewableAccessLevel
  /** Family-wide Reward Rules (contracts) grant level. */
  rewardRulesLevel: ViewableAccessLevel
  /** Highest financial_tracking level held across any kid OR family-wide. */
  financeMaxLevel: ViewableAccessLevel
  /** Per-kid financial_tracking levels (memberId → level). */
  financeLevels: Record<string, ViewableAccessLevel>
  /**
   * FAMILY-WIDE financial_tracking level (target_member_id IS NULL,
   * migration 100261). Covers every kid incl. future ones; per-kid rows in
   * financeLevels win as exceptions for their kid.
   */
  financeFamilyLevel: ViewableAccessLevel
  isLoading: boolean
}

const LEVEL_RANK: Record<ViewableAccessLevel, number> = {
  none: 0, view: 1, contribute: 2, manage: 3,
}

const MANAGEMENT_KEYS = ['studio', 'reward_rules', 'financial_tracking'] as const

export function useManagementGrants(forMember?: ViewableScopeMember | null): ManagementGrants {
  const { data: authMember, isLoading: memberLoading } = useFamilyMember()
  const member = forMember ?? authMember

  const isMom = member?.role === 'primary_parent'

  const { data, isLoading: grantsLoading } = useQuery({
    queryKey: ['management-grants', member?.id],
    queryFn: async () => {
      if (!member) return []
      const { data, error } = await supabase
        .from('member_permissions')
        .select('permission_key, target_member_id, access_level, permission_value')
        .eq('family_id', member.family_id)
        .eq('granted_to', member.id)
        .in('permission_key', [...MANAGEMENT_KEYS])
      if (error) throw error
      return data ?? []
    },
    enabled: !!member && member.role === 'additional_adult',
    staleTime: 1000 * 60 * 2,
  })

  if (isMom) {
    return {
      studioLevel: 'manage',
      rewardRulesLevel: 'manage',
      financeMaxLevel: 'manage',
      financeLevels: {},
      financeFamilyLevel: 'manage',
      isLoading: false,
    }
  }

  if (!member || member.role !== 'additional_adult') {
    return {
      studioLevel: 'none',
      rewardRulesLevel: 'none',
      financeMaxLevel: 'none',
      financeLevels: {},
      financeFamilyLevel: 'none',
      isLoading: memberLoading,
    }
  }

  let studioLevel: ViewableAccessLevel = 'none'
  let rewardRulesLevel: ViewableAccessLevel = 'none'
  let financeMaxLevel: ViewableAccessLevel = 'none'
  let financeFamilyLevel: ViewableAccessLevel = 'none'
  const financeLevels: Record<string, ViewableAccessLevel> = {}

  for (const row of data ?? []) {
    const level = (row.access_level
      || row.permission_value?.access_level
      || 'none') as ViewableAccessLevel
    if (level === 'none') continue
    if (row.permission_key === 'studio' && row.target_member_id === null) {
      studioLevel = level
    } else if (row.permission_key === 'reward_rules' && row.target_member_id === null) {
      rewardRulesLevel = level
    } else if (row.permission_key === 'financial_tracking' && row.target_member_id === null) {
      financeFamilyLevel = level
      if (LEVEL_RANK[level] > LEVEL_RANK[financeMaxLevel]) financeMaxLevel = level
    } else if (row.permission_key === 'financial_tracking' && row.target_member_id) {
      financeLevels[row.target_member_id] = level
      if (LEVEL_RANK[level] > LEVEL_RANK[financeMaxLevel]) financeMaxLevel = level
    }
  }

  return {
    studioLevel,
    rewardRulesLevel,
    financeMaxLevel,
    financeLevels,
    financeFamilyLevel,
    isLoading: memberLoading || grantsLoading,
  }
}
