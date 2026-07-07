/**
 * useMyRewardsSettings — KIDS-REWARDS-PAGE Slice 2 (founder gate Q1, 2026-06-12).
 *
 * Read + write side for the per-member My Rewards page configuration:
 *
 *   family_members.preferences.show_my_rewards          — page on/off (existing key,
 *                                                          read side also in useShowMyRewards)
 *   family_members.preferences.my_rewards_sections      — JSONB object of EXPLICIT
 *                                                          section overrides only
 *   family_members.preferences.personal_rewards_privacy — mom-granted privacy for
 *                                                          private self-rewards
 *                                                          (enforced at query layer by
 *                                                          util.personal_rewards_privacy,
 *                                                          migration 100266)
 *
 * Section DEFAULTS resolve at READ time (Q1, approved with one change; two
 * founder amendments 2026-06-12):
 *   points         → ON
 *   custom_rewards → ON when gamification enabled (Play: always ON by default —
 *                    Fun-tab continuity)
 *   creatures      → ON when gamification enabled   (section ships Slice 3)
 *   coloring       → ON when gamification enabled   (section ships Slice 3)
 *   finances       → MIRRORS the kid's primary-pool child_can_see_finances —
 *                    one switch of intent, the two surfaces never disagree
 *                    until mom sets an explicit override.
 *                    PLAY: default OFF, mom may explicitly opt in (founder
 *                    amendment 2026-06-12 — amends PRD-28's "never on Play"
 *                    into a per-kid mom choice, Buffet Principle).
 *   victories      → OFF
 *   propose        → OFF (Guided+ only; section ships Slice 4)
 *
 * Page gate default: ON (founder ruling 2026-06-12 — only an explicit
 * show_my_rewards=false hides the page; supersedes the original default-false).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface MyRewardsSections {
  points: boolean
  finances: boolean
  custom_rewards: boolean
  victories: boolean
  creatures: boolean
  coloring: boolean
  propose: boolean
  /** FAMILY-GOALS-PRIZES: family goals this member participates in + earned
   *  unredeemed family prizes. Default ON (spec Build Item 7). */
  family: boolean
}

export type MyRewardsSectionKey = keyof MyRewardsSections

export interface MyRewardsSettings {
  /** Page gate (preferences.show_my_rewards, default false). */
  showMyRewards: boolean
  /** Resolved sections — defaults + explicit overrides + Play finances hard rule. */
  sections: MyRewardsSections
  /** Raw stored overrides (what mom explicitly set). */
  overrides: Partial<MyRewardsSections>
  /** Mom-granted personal rewards privacy (adults' private self-rewards hidden from mom too). */
  personalRewardsPrivacy: boolean
  gamificationEnabled: boolean
  /** Primary pool's child_can_see_finances (false when no pool exists — conservative). */
  childCanSeeFinances: boolean
  role: string | null
  dashboardMode: string | null
}

const EMPTY_SETTINGS: MyRewardsSettings = {
  showMyRewards: false,
  sections: {
    points: true,
    finances: false,
    custom_rewards: false,
    victories: false,
    creatures: false,
    coloring: false,
    propose: false,
    family: true,
  },
  overrides: {},
  personalRewardsPrivacy: false,
  gamificationEnabled: false,
  childCanSeeFinances: false,
  role: null,
  dashboardMode: null,
}

export function resolveMyRewardsSections(opts: {
  overrides: Partial<MyRewardsSections>
  gamificationEnabled: boolean
  childCanSeeFinances: boolean
  dashboardMode: string | null
}): MyRewardsSections {
  const isPlay = opts.dashboardMode === 'play'
  const defaults: MyRewardsSections = {
    points: true,
    // Q1 default (ON when gamification enabled) — with one continuity carve-out:
    // the Play Fun tab ALWAYS showed the PrizeBox before Slice 2, so Play
    // members keep custom rewards ON by default even with gamification off
    // (contract prizes exist independently of gamification). Mom can still
    // turn the section off explicitly.
    custom_rewards: opts.gamificationEnabled || isPlay,
    creatures: opts.gamificationEnabled,
    coloring: opts.gamificationEnabled,
    // Play money is a mom OPT-IN, default OFF (founder amendment 2026-06-12 —
    // amends PRD-28's hard "never on Play" for this surface). Non-play kids
    // mirror child_can_see_finances (Q1).
    finances: isPlay ? false : opts.childCanSeeFinances,
    // Play: ON — the Fun page's Victories section REPLACED the Play nav's
    // "Stars" tab (founder eyes-on 2026-06-12), so it must be visible by
    // default or Play kids lose victory visibility entirely.
    victories: isPlay,
    propose: false,
    // FAMILY-GOALS-PRIZES: default ON for everyone, including Play — a family
    // goal a Play kid participates in should be visible on their Fun tab too.
    family: true,
  }
  return { ...defaults, ...opts.overrides }
}

export function useMyRewardsSettings(memberId: string | null | undefined) {
  return useQuery({
    queryKey: ['my-rewards-settings', memberId],
    queryFn: async (): Promise<MyRewardsSettings> => {
      if (!memberId) return EMPTY_SETTINGS

      const [memberRes, gamRes, poolsRes] = await Promise.all([
        supabase
          .from('family_members')
          .select('preferences, role, dashboard_mode')
          .eq('id', memberId)
          .maybeSingle(),
        supabase
          .from('gamification_configs')
          .select('enabled')
          .eq('family_member_id', memberId)
          .maybeSingle(),
        supabase
          .from('allowance_configs')
          .select('pool_name, child_can_see_finances')
          .eq('family_member_id', memberId)
          .order('created_at', { ascending: true }),
      ])

      if (memberRes.error || !memberRes.data) return EMPTY_SETTINGS

      const prefs = (memberRes.data.preferences as Record<string, unknown> | null) ?? {}
      const overrides = (prefs.my_rewards_sections as Partial<MyRewardsSections> | null) ?? {}
      const gamificationEnabled = gamRes.data?.enabled === true

      // Primary pool = 'default', else first pool. No pool → conservative false
      // (same resolution as PrizeBoard's KidSelfBalanceView).
      const pools = poolsRes.data ?? []
      const primaryPool = pools.find(p => p.pool_name === 'default') ?? pools[0]
      const childCanSeeFinances = primaryPool?.child_can_see_finances === true

      const dashboardMode = (memberRes.data.dashboard_mode as string | null) ?? null

      return {
        // Default ON (founder ruling 2026-06-12) — only explicit false hides the page.
        showMyRewards: prefs.show_my_rewards !== false,
        sections: resolveMyRewardsSections({
          overrides,
          gamificationEnabled,
          childCanSeeFinances,
          dashboardMode,
        }),
        overrides,
        personalRewardsPrivacy: prefs.personal_rewards_privacy === true,
        gamificationEnabled,
        childCanSeeFinances,
        role: (memberRes.data.role as string | null) ?? null,
        dashboardMode,
      }
    },
    enabled: !!memberId,
    staleTime: 30_000,
  })
}

/**
 * Merge-write the My Rewards keys on family_members.preferences. Partial —
 * only the keys provided are touched; everything else in preferences (and in
 * my_rewards_sections) is preserved.
 */
export function useUpdateMyRewardsSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      memberId: string
      showMyRewards?: boolean
      sections?: Partial<MyRewardsSections>
      personalRewardsPrivacy?: boolean
    }) => {
      const { data: current, error: readError } = await supabase
        .from('family_members')
        .select('preferences')
        .eq('id', params.memberId)
        .single()
      if (readError) throw readError

      const existing = (current?.preferences ?? {}) as Record<string, unknown>
      const merged: Record<string, unknown> = { ...existing }

      if (params.showMyRewards !== undefined) {
        merged.show_my_rewards = params.showMyRewards
      }
      if (params.sections) {
        const existingSections =
          (existing.my_rewards_sections as Record<string, unknown> | null) ?? {}
        merged.my_rewards_sections = { ...existingSections, ...params.sections }
      }
      if (params.personalRewardsPrivacy !== undefined) {
        merged.personal_rewards_privacy = params.personalRewardsPrivacy
      }

      const { error: writeError } = await supabase
        .from('family_members')
        .update({ preferences: merged })
        .eq('id', params.memberId)
      if (writeError) throw writeError

      return merged
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['my-rewards-settings', vars.memberId] })
      // useShowMyRewards (sidebar gate) reads the same preference under its own key.
      qc.invalidateQueries({
        queryKey: ['family-member-preferences', vars.memberId, 'show_my_rewards'],
      })
      qc.invalidateQueries({ queryKey: ['member-preferences', vars.memberId] })
      qc.invalidateQueries({ queryKey: ['family-member'] })
      qc.invalidateQueries({ queryKey: ['family-members'] })
    },
  })
}
