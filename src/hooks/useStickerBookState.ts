/**
 * useStickerBookState — Build M Sub-phase B
 *
 * Reads `member_sticker_book_state` for a single Play member and joins
 * the active sticker page (if any). Returns a normalized shape ready for
 * the Play Dashboard sticker book widget.
 *
 * Auto-provisioned by the trigger in Sub-phase A's migration, so every
 * Play member already has a row before they ever load the dashboard.
 * If somehow a member is missing one (legacy data, dev fixtures), we
 * return null and the widget renders an empty state.
 *
 * Returns null when gamification is disabled (`is_enabled = false`).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { StickerBookState } from '@/types/play-dashboard'

export function useStickerBookState(familyMemberId: string | undefined) {
  return useQuery<StickerBookState | null>({
    queryKey: ['sticker-book-state', familyMemberId],
    queryFn: async () => {
      if (!familyMemberId) return null

      const { data, error } = await supabase
        .from('member_sticker_book_state')
        .select(
          `
          id,
          family_member_id,
          active_theme_id,
          active_page_id,
          page_unlock_interval,
          is_enabled,
          creatures_earned_total,
          pages_unlocked_total,
          active_page:active_page_id (
            id,
            slug,
            display_name,
            scene,
            image_url
          )
          `,
        )
        .eq('family_member_id', familyMemberId)
        .maybeSingle()

      if (error) {
        console.error('useStickerBookState query failed:', error)
        return null
      }
      if (!data) return null

      // Sub-phase B opts out entirely when gamification is disabled.
      // The widget shows nothing in that case.
      if (!data.is_enabled) return null

      // The Supabase JS client types the joined `active_page` as either
      // an object or an array depending on the relationship inference.
      // Normalize to a single object | null for the consumer.
      const rawActivePage = data.active_page as
        | StickerBookState['active_page']
        | StickerBookState['active_page'][]
        | null
      const activePage = Array.isArray(rawActivePage)
        ? rawActivePage[0] ?? null
        : rawActivePage ?? null

      return {
        id: data.id,
        family_member_id: data.family_member_id,
        active_theme_id: data.active_theme_id,
        active_page_id: data.active_page_id,
        page_unlock_interval: data.page_unlock_interval,
        is_enabled: data.is_enabled,
        creatures_earned_total: data.creatures_earned_total,
        pages_unlocked_total: data.pages_unlocked_total,
        active_page: activePage,
      } satisfies StickerBookState
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}
