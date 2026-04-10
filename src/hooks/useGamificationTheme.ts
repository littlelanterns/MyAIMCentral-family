/**
 * useGamificationTheme — Build M Sub-phase D
 *
 * Reads a single `gamification_themes` row by id, primarily to fetch the
 * reveal video URLs (`creature_reveal_video_url`, `page_reveal_video_url`)
 * that CreatureRevealModal + PageUnlockRevealModal need to play.
 *
 * Stale time is generous (5 min) because theme rows change only when an
 * admin edits the seed data — they're effectively static during a session.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface GamificationTheme {
  id: string
  theme_slug: string
  display_name: string
  description: string | null
  creature_reveal_video_url: string
  page_reveal_video_url: string
  thumbnail_image_url: string | null
  is_active: boolean
}

export function useGamificationTheme(themeId: string | undefined | null) {
  return useQuery<GamificationTheme | null>({
    queryKey: ['gamification-theme', themeId],
    queryFn: async () => {
      if (!themeId) return null

      const { data, error } = await supabase
        .from('gamification_themes')
        .select(
          `
          id,
          theme_slug,
          display_name,
          description,
          creature_reveal_video_url,
          page_reveal_video_url,
          thumbnail_image_url,
          is_active
          `,
        )
        .eq('id', themeId)
        .maybeSingle()

      if (error) {
        console.error('useGamificationTheme query failed:', error)
        return null
      }

      return data as GamificationTheme | null
    },
    enabled: !!themeId,
    staleTime: 5 * 60 * 1000, // 5 minutes — theme data is effectively static
  })
}
