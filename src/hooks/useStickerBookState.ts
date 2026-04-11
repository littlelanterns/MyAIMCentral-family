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
          creature_earning_mode,
          creature_earning_threshold,
          creature_earning_counter,
          creature_earning_counter_resets,
          creature_earning_segment_ids,
          page_earning_mode,
          page_earning_completion_threshold,
          page_earning_completion_counter,
          page_earning_tracker_widget_id,
          page_earning_tracker_threshold,
          randomizer_reveal_style,
          creature_roll_chance_per_task,
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
        creature_earning_mode: data.creature_earning_mode ?? 'random_per_task',
        creature_earning_threshold: data.creature_earning_threshold ?? 3,
        creature_earning_counter: data.creature_earning_counter ?? 0,
        creature_earning_counter_resets: data.creature_earning_counter_resets ?? true,
        creature_earning_segment_ids: data.creature_earning_segment_ids ?? [],
        page_earning_mode: data.page_earning_mode ?? 'every_n_creatures',
        page_earning_completion_threshold: data.page_earning_completion_threshold ?? 20,
        page_earning_completion_counter: data.page_earning_completion_counter ?? 0,
        page_earning_tracker_widget_id: data.page_earning_tracker_widget_id ?? null,
        page_earning_tracker_threshold: data.page_earning_tracker_threshold ?? 5,
        randomizer_reveal_style: data.randomizer_reveal_style ?? 'mystery_tap',
        creature_roll_chance_per_task: data.creature_roll_chance_per_task ?? 40,
      } satisfies StickerBookState
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}
