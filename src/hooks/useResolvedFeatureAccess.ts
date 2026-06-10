/**
 * useResolvedFeatureAccess — per-member feature access resolution for the
 * sidebar/BottomNav layer (PERMISSIONS-WIRING build; closes the Layer-3 gap
 * filed in claude/follow-up-builds/per-member-sidebar-customization.md).
 *
 * Resolution order per Convention #11:
 *   1. Tier threshold — Convention #10: bypassed during beta (all tiers
 *      unlocked). Infrastructure note: when billing goes live, the tier check
 *      slots in here and returns { enabled: false, source: 'tier_lock' }.
 *   2. Member toggle (member_feature_toggles) — an explicit row for
 *      (member, feature) wins. This is how mom's Permission Hub choices and
 *      applied Light/Balanced/Maximum profiles reach the sidebar.
 *   3. Role default — NO row means the feature follows the shell's static
 *      section config (visible). The static getSidebarSections config already
 *      encodes the role-appropriate item set; this hook only applies mom's
 *      explicit per-member overrides on top of it.
 *
 * Mom is never filtered (her shell config is frozen; profiles exclude mom by
 * design — PRD-31 addendum).
 *
 * Sync timing (founder Decision 10, 2026-06-09): render-time. TanStack Query
 * cache (2-min staleTime) + invalidation on Hub writes — changes land on the
 * member's next page move, no realtime push.
 */

import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type FeatureAccessSource = 'role_default' | 'member_toggle' | 'tier_lock'

export interface ResolvedFeatureAccess {
  enabled: boolean
  source: FeatureAccessSource
}

export interface ResolvedFeatureAccessResult {
  /** Resolve one feature key. Defaults to enabled/role_default while loading. */
  resolve: (featureKey: string) => ResolvedFeatureAccess
  isEnabled: (featureKey: string) => boolean
  isLoading: boolean
}

/**
 * Sidebar item featureKeys → member_feature_toggles keys.
 * The sidebar config predates the toggle-key vocabulary (PRD-31 profiles /
 * Permission Hub), so the two diverge. This map is the bridge; keys not
 * listed resolve by exact match.
 */
const TOGGLE_KEY_ALIASES: Record<string, string> = {
  journal: 'journal_basic',
  tasks: 'tasks_basic',
  calendar: 'calendar_basic',
  lists: 'lists_basic',
  guiding_stars: 'guiding_stars_basic',
  my_foundation: 'innerworkings_basic',
  victories: 'victory_recorder_basic',
  widgets_trackers: 'widgets',
  notepad: 'notepad_basic',
}

export function toToggleKey(featureKey: string): string {
  return TOGGLE_KEY_ALIASES[featureKey] ?? featureKey
}

interface ScopeMember {
  id: string
  family_id: string
  role: string
}

export function useResolvedFeatureAccess(member?: ScopeMember | null): ResolvedFeatureAccessResult {
  const isMom = member?.role === 'primary_parent'

  const { data: toggles, isLoading } = useQuery({
    queryKey: ['resolved-feature-access', member?.id],
    queryFn: async () => {
      if (!member) return []
      const { data, error } = await supabase
        .from('member_feature_toggles')
        .select('feature_key, enabled, is_disabled')
        .eq('family_id', member.family_id)
        .eq('member_id', member.id)
      if (error) throw error
      return data ?? []
    },
    enabled: !!member && member.role !== 'primary_parent',
    staleTime: 1000 * 60 * 2,
  })

  const resolve = useCallback((featureKey: string): ResolvedFeatureAccess => {
    // Mom: never filtered.
    if (isMom) return { enabled: true, source: 'role_default' }
    // Convention #10: tier layer bypassed during beta (would be checked here).
    const toggleKey = toToggleKey(featureKey)
    const row = toggles?.find(t => t.feature_key === toggleKey)
    if (row) {
      return {
        enabled: row.enabled === true && row.is_disabled === false,
        source: 'member_toggle',
      }
    }
    // No row → role default: the shell's static config governs (visible).
    return { enabled: true, source: 'role_default' }
  }, [isMom, toggles])

  const isEnabled = useCallback(
    (featureKey: string) => resolve(featureKey).enabled,
    [resolve],
  )

  return { resolve, isEnabled, isLoading: !!member && !isMom && isLoading }
}
