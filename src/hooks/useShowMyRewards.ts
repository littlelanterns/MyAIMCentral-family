/**
 * useShowMyRewards — returns whether the "My Rewards" sidebar entry should
 * render for the given family member.
 *
 * Reads `family_members.preferences.show_my_rewards` (JSONB boolean). Default
 * is `false` — the sidebar entry stays invisible until mom explicitly toggles
 * it on per-child via gamification settings. Worker 4 builds the toggle UI;
 * this hook is the read side.
 *
 * This is the PRIMARY visibility gate for the kid-facing "My Rewards" surface,
 * per founder Q2a (View As Identity-Scope Architecture, 2026-05-25). The
 * `<MomOnlyRoute>` guard on mom's `/prize-board` is the SECONDARY backstop
 * for accidental URL reach. This hook decides whether the kid ever sees the
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
      return prefs.show_my_rewards === true
    },
    enabled: !!memberId,
    staleTime: 30_000,
  })
  return data === true
}
