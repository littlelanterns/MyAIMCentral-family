/**
 * useColoringReveals — Build M Phase 1
 *
 * Two hooks:
 *   - useColoringRevealLibrary: browse the platform-level library of coloring images
 *   - useMemberColoringReveals: read a member's active/completed coloring reveal progress
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  ColoringRevealImage,
  MemberColoringReveal,
  LineartPreference,
} from '@/types/play-dashboard'

/**
 * Browse the coloring reveal library for a given theme.
 * Used by mom's settings to pick an image for a child.
 */
export function useColoringRevealLibrary(themeId: string | undefined) {
  return useQuery<ColoringRevealImage[]>({
    queryKey: ['coloring-reveal-library', themeId],
    queryFn: async () => {
      if (!themeId) return []

      const { data, error } = await supabase
        .from('coloring_reveal_library')
        .select('*')
        .eq('theme_id', themeId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('useColoringRevealLibrary query failed:', error)
        return []
      }

      return (data ?? []) as ColoringRevealImage[]
    },
    enabled: !!themeId,
    staleTime: 60_000, // library rarely changes
  })
}

/**
 * Read a member's active coloring reveals with joined image data.
 * Returns both active in-progress reveals and completed ones.
 */
export function useMemberColoringReveals(familyMemberId: string | undefined) {
  return useQuery<MemberColoringReveal[]>({
    queryKey: ['member-coloring-reveals', familyMemberId],
    queryFn: async () => {
      if (!familyMemberId) return []

      const { data, error } = await supabase
        .from('member_coloring_reveals')
        .select(
          `
          *,
          coloring_image:coloring_image_id (
            id, theme_id, slug, display_name, subject_category,
            color_zones, reveal_sequences, zone_count, sort_order
          )
          `,
        )
        .eq('family_member_id', familyMemberId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('useMemberColoringReveals query failed:', error)
        return []
      }
      if (!data) return []

      return data.map(row => {
        const rawImage = row.coloring_image as
          | MemberColoringReveal['coloring_image']
          | MemberColoringReveal['coloring_image'][]
          | null
        const coloring_image = Array.isArray(rawImage)
          ? rawImage[0] ?? undefined
          : rawImage ?? undefined

        return {
          ...row,
          coloring_image,
        } as MemberColoringReveal
      })
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}

/**
 * Update a member's coloring reveal record (lineart_preference, printed_at).
 */
export function useUpdateColoringReveal(familyMemberId: string | undefined) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      revealId: string
      lineart_preference?: LineartPreference
      printed_at?: string
    }) => {
      const updates: Record<string, unknown> = {}
      if (params.lineart_preference !== undefined) {
        updates.lineart_preference = params.lineart_preference
      }
      if (params.printed_at !== undefined) {
        updates.printed_at = params.printed_at
      }

      const { error } = await supabase
        .from('member_coloring_reveals')
        .update(updates)
        .eq('id', params.revealId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member-coloring-reveals', familyMemberId] })
    },
  })
}
