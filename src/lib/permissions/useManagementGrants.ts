/**
 * useManagementGrants — bulk lookup of the PERMISSIONS-WIRING grant keys for
 * one member (default: the signed-in member; pass `forMember` for View-As
 * effective-member scoping).
 *
 * Grant shapes (founder gate 2026-06-09 + PRD-43 2026-07-07):
 *  - 'studio'        — FAMILY-WIDE row (target_member_id IS NULL). view = browse,
 *                      manage = create/edit/deploy.
 *  - 'reward_rules'  — FAMILY-WIDE row. view = see contracts, manage = create/edit.
 *  - 'financial_tracking' — PER-KID rows. view = read kid's ledger/balances/loans,
 *                      contribute = + record payments / Mark Paid,
 *                      manage = + Allowance tab period ops.
 *  - 'gift_planning' — FAMILY-WIDE row (studio/reward_rules shape). Binary
 *                      Off/Allowed render (task_assignment precedent) — any
 *                      non-'none' level counts as granted. Opens the Gift
 *                      Planning tab inside /wishlists. Server truth:
 *                      util.gift_planning_access() (migration 100292).
 *  - 'meal_planning' — FAMILY-WIDE row (studio/reward_rules shape). Binary
 *                      Off/Allowed render. Gates KitchenCompass plan-structure
 *                      edits, meal settings, and food restriction edits —
 *                      mark-made/kids-helped/cook-volunteering stay available
 *                      to every adult without this grant (PRD-42 §8.1).
 *                      Server truth: util.has_meal_planning_grant() (migration
 *                      100291).
 *
 * Resolution: mom → manage everything. additional_adult → granted levels.
 * Everyone else → none. RLS enforces the same shape server-side
 * (migration 00000000100260, 00000000100292, 00000000100291).
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
  /** Family-wide Gift Planning grant level (PRD-43). 'none' = ungranted. */
  giftPlanningLevel: ViewableAccessLevel
  /** Family-wide KitchenCompass plan-editing grant level (PRD-42). 'none' = ungranted. */
  mealPlanningLevel: ViewableAccessLevel
  isLoading: boolean
}

const LEVEL_RANK: Record<ViewableAccessLevel, number> = {
  none: 0, view: 1, contribute: 2, manage: 3,
}

const MANAGEMENT_KEYS = ['studio', 'reward_rules', 'financial_tracking', 'gift_planning', 'meal_planning'] as const

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
      giftPlanningLevel: 'manage',
      mealPlanningLevel: 'manage',
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
      giftPlanningLevel: 'none',
      mealPlanningLevel: 'none',
      isLoading: memberLoading,
    }
  }

  let studioLevel: ViewableAccessLevel = 'none'
  let rewardRulesLevel: ViewableAccessLevel = 'none'
  let financeMaxLevel: ViewableAccessLevel = 'none'
  let financeFamilyLevel: ViewableAccessLevel = 'none'
  let giftPlanningLevel: ViewableAccessLevel = 'none'
  let mealPlanningLevel: ViewableAccessLevel = 'none'
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
    } else if (row.permission_key === 'gift_planning' && row.target_member_id === null) {
      giftPlanningLevel = level
    } else if (row.permission_key === 'meal_planning' && row.target_member_id === null) {
      mealPlanningLevel = level
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
    giftPlanningLevel,
    mealPlanningLevel,
    isLoading: memberLoading || grantsLoading,
  }
}
