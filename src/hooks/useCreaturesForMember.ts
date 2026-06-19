/**
 * useCreaturesForMember — Build M Sub-phase B
 *
 * Reads `member_creature_collection` for a single member with the joined
 * creature definition. Returns rows ordered by `awarded_at DESC` (most
 * recent first) so the dashboard widget can show "newest first".
 *
 * Sub-phase D will use this same hook for the StickerBookDetailModal,
 * which groups creatures by `sticker_page_id`. Both surfaces consume
 * the same query result; React Query caches it once per member.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { MemberCreature } from '@/types/play-dashboard'

export function useCreaturesForMember(familyMemberId: string | undefined) {
  return useQuery<MemberCreature[]>({
    queryKey: ['member-creatures', familyMemberId],
    queryFn: async () => {
      if (!familyMemberId) return []

      const { data, error } = await supabase
        .from('member_creature_collection')
        .select(
          `
          id,
          family_member_id,
          sticker_page_id,
          position_x,
          position_y,
          awarded_at,
          creature:creature_id (
            id,
            slug,
            display_name,
            rarity,
            image_url,
            description,
            theme_id
          )
          `,
        )
        .eq('family_member_id', familyMemberId)
        .order('awarded_at', { ascending: false })

      if (error) {
        console.error('useCreaturesForMember query failed:', error)
        return []
      }
      if (!data) return []

      // Normalize joined creature shape (object vs array)
      return data
        .map(row => {
          const rawCreature = row.creature as
            | MemberCreature['creature']
            | MemberCreature['creature'][]
            | null
          const creature = Array.isArray(rawCreature)
            ? rawCreature[0]
            : rawCreature
          if (!creature) return null
          return {
            id: row.id,
            family_member_id: row.family_member_id,
            sticker_page_id: row.sticker_page_id,
            position_x: row.position_x,
            position_y: row.position_y,
            awarded_at: row.awarded_at,
            creature,
          } satisfies MemberCreature
        })
        .filter((r): r is MemberCreature => r !== null)
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}

/**
 * useMoveCreature — persists a creature's new position after drag-drop.
 *
 * Optimistically updates the local cache so the sticker stays where the
 * kid dropped it, even before the DB round-trip completes.
 */
export function useMoveCreature(familyMemberId: string | undefined) {
  const qc = useQueryClient()
  const queryKey = ['member-creatures', familyMemberId]

  return useMutation({
    mutationFn: async ({
      creatureCollectionId,
      positionX,
      positionY,
      newPageId,
    }: {
      creatureCollectionId: string
      positionX: number
      positionY: number
      /**
       * Reassign the creature's sticker page. `undefined` = leave the page as
       * is (just move within the current page). A string = place on that page.
       * `null` = remove from any page (returns it to the unplaced tray — Slice 3).
       */
      newPageId?: string | null
    }) => {
      // Routed through place_member_creature (SECURITY DEFINER) so the OWNING
      // member can self-arrange — member_creature_collection is mom-write-only
      // at the policy layer (Slice 3, migration 100275). Mom + family-shadow
      // are also accepted inside the RPC.
      const { data, error } = await supabase.rpc('place_member_creature', {
        p_creature_collection_id: creatureCollectionId,
        p_position_x: positionX,
        p_position_y: positionY,
        p_sticker_page_id: newPageId ?? null,
        p_set_page: newPageId !== undefined,
      })
      if (error) throw error
      const status = (data as { status?: string } | null)?.status
      if (status && status !== 'ok') {
        throw new Error(`place_member_creature: ${status}`)
      }
    },

    // Optimistic update — move the sticker in the cache immediately
    onMutate: async ({ creatureCollectionId, positionX, positionY, newPageId }) => {
      await qc.cancelQueries({ queryKey })
      const previous = qc.getQueryData<MemberCreature[]>(queryKey)

      qc.setQueryData<MemberCreature[]>(queryKey, old =>
        (old ?? []).map(c =>
          c.id === creatureCollectionId
            ? {
                ...c,
                position_x: positionX,
                position_y: positionY,
                ...(newPageId !== undefined ? { sticker_page_id: newPageId } : {}),
              }
            : c,
        ),
      )

      return { previous }
    },

    onError: (_err, _vars, context) => {
      // Revert on failure
      if (context?.previous) {
        qc.setQueryData(queryKey, context.previous)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })
}
