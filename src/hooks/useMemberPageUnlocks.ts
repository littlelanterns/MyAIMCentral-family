/**
 * useMemberPageUnlocks — Build M Sub-phase B
 *
 * Reads `member_page_unlocks` for a single Play member, joined with the
 * sticker page definition. Ordered by `unlocked_at ASC` so the consumer
 * sees the unlock history in the order it happened (bootstrap first,
 * then each unlock event).
 *
 * Sub-phase D's StickerBookDetailModal uses this for the "All pages"
 * tab. Sub-phase B reads the count for the dashboard widget pill
 * "X pages unlocked".
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { MemberPageUnlock } from '@/types/play-dashboard'

export function useMemberPageUnlocks(familyMemberId: string | undefined) {
  return useQuery<MemberPageUnlock[]>({
    queryKey: ['member-page-unlocks', familyMemberId],
    queryFn: async () => {
      if (!familyMemberId) return []

      const { data, error } = await supabase
        .from('member_page_unlocks')
        .select(
          `
          id,
          family_member_id,
          unlocked_at,
          unlocked_trigger_type,
          creatures_at_unlock,
          page:sticker_page_id (
            id,
            slug,
            display_name,
            scene,
            image_url,
            sort_order
          )
          `,
        )
        .eq('family_member_id', familyMemberId)
        .order('unlocked_at', { ascending: true })

      if (error) {
        console.error('useMemberPageUnlocks query failed:', error)
        return []
      }
      if (!data) return []

      return data
        .map(row => {
          const rawPage = row.page as
            | MemberPageUnlock['page']
            | MemberPageUnlock['page'][]
            | null
          const page = Array.isArray(rawPage) ? rawPage[0] : rawPage
          if (!page) return null
          return {
            id: row.id,
            family_member_id: row.family_member_id,
            unlocked_at: row.unlocked_at,
            unlocked_trigger_type: row.unlocked_trigger_type,
            creatures_at_unlock: row.creatures_at_unlock,
            page,
          } satisfies MemberPageUnlock
        })
        .filter((r): r is MemberPageUnlock => r !== null)
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}
