/**
 * useShowMyRewards — returns whether the "My Rewards" sidebar entry should
 * render for the given family member.
 *
 * Reads `family_members.preferences.show_my_rewards` (JSONB boolean). Default
 * is `true` — the page is ON for every member unless mom explicitly turns it
 * off per-child via Gamification Settings → My Rewards Page.
 * (Founder ruling 2026-06-12, KIDS-REWARDS-PAGE Slice 2 — supersedes the
 * original default-false from founder Q2a, View As Identity-Scope build.)
 *
 * This is the PRIMARY visibility gate for the kid-facing "My Rewards" surface.
 * The `<MomOnlyRoute>` guard on mom's `/prize-board` is the SECONDARY backstop
 * for accidental URL reach. This hook decides whether the kid sees the
 * option in their navigation at all (invisibility-over-blocking principle).
 *
 * @param memberId — the effective member whose preference to read. When
 *   null/undefined (auth not yet booted), returns `false` so the entry stays
 *   hidden until we know who we are.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function useShowMyRewards(memberId: string | null | undefined): boolean {
  const { data } = useQuery({
    queryKey: ['family-member-preferences', memberId, 'show_my_rewards'],
    queryFn: async (): Promise<boolean> => {
      if (!memberId) return false
      const { data, error } = await supabase
        .from('family_members')
        .select('preferences')
        .eq('id', memberId)
        .single()
      if (error || !data) return false
      const prefs = (data.preferences as Record<string, unknown> | null) ?? {}
      // Default ON (founder ruling 2026-06-12) — only an explicit false hides it.
      return prefs.show_my_rewards !== false
    },
    enabled: !!memberId,
    staleTime: 30_000,
  })
  return data === true
}
