import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

export interface EarnedPrize {
  id: string
  family_id: string
  /**
   * FAMILY-GOALS-PRIZES: nullable — NULL exactly when
   * source_type='family_goal' (CHECK-enforced, migration 100284). A Family
   * Prize belongs to no single member; consumers must branch on this.
   */
  family_member_id: string | null
  reward_reveal_id: string | null
  attachment_id: string | null
  source_type: string
  source_id: string
  prize_type: string
  prize_text: string | null
  prize_name: string | null
  prize_image_url: string | null
  prize_asset_key: string | null
  animation_slug: string | null
  earned_at: string
  redeemed_at: string | null
  redeemed_by: string | null
  created_at: string
  /** KIDS-REWARDS-PAGE visibility model (migration 100266) — was never added
   *  to this interface even though `select('*')` always fetched it. */
  visibility?: 'family' | 'private' | 'shared'
  /** FAMILY-GOALS-PRIZES: participant snapshot at award time for a Family
   *  Prize (source_type='family_goal'). Empty array for non-family prizes. */
  shared_with_member_ids?: string[]
  created_by?: string | null
  awarded_completion_id?: string | null
}

export function useEarnedPrizes() {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['earned-prizes', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('earned_prizes')
        .select('*')
        .eq('family_id', familyId)
        .is('redeemed_at', null)
        .order('earned_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as EarnedPrize[]
    },
    enabled: !!familyId,
    staleTime: 30_000,
  })
}

/**
 * KIDS-REWARDS-PAGE Q2: recently redeemed prizes (family-wide) so the Prize
 * Board can offer Un-redeem. Window kept tight (default 30 days) — the full
 * history lives on each member's Previously Redeemed view (Slice 2).
 */
export function useRecentlyRedeemedPrizes(windowDays = 30) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['earned-prizes-redeemed', familyId, windowDays],
    queryFn: async () => {
      if (!familyId) return []
      const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('earned_prizes')
        .select('*')
        .eq('family_id', familyId)
        .not('redeemed_at', 'is', null)
        .gte('redeemed_at', since)
        .order('redeemed_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as EarnedPrize[]
    },
    enabled: !!familyId,
    staleTime: 30_000,
  })
}

function useInvalidatePrizeQueries() {
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()
  return (memberId?: string | null) => {
    queryClient.invalidateQueries({ queryKey: ['earned-prizes', member?.family_id] })
    queryClient.invalidateQueries({ queryKey: ['earned-prizes-redeemed', member?.family_id] })
    if (memberId) {
      // Per-member keys used by PrizeBox (useRewardReveals hooks)
      queryClient.invalidateQueries({ queryKey: ['earned-prizes', memberId] })
      queryClient.invalidateQueries({ queryKey: ['earned-prizes-unredeemed-count', memberId] })
    }
  }
}

export function useRedeemPrize() {
  const invalidate = useInvalidatePrizeQueries()

  return useMutation({
    mutationFn: async ({ prizeId, redeemedBy, memberId }: { prizeId: string; redeemedBy: string; memberId?: string | null }) => {
      const { error } = await supabase
        .from('earned_prizes')
        .update({ redeemed_at: new Date().toISOString(), redeemed_by: redeemedBy })
        .eq('id', prizeId)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      invalidate(data?.memberId)
    },
  })
}

/**
 * KIDS-REWARDS-PAGE Q2: mom's Un-redeem — clean reset (clears
 * redeemed_at/redeemed_by; no reversal audit row by founder decision).
 * The card returns to the kid's active rewards, redeemable again.
 * Parent-only via the earned_prizes UPDATE policy.
 */
export function useUnredeemPrize() {
  const invalidate = useInvalidatePrizeQueries()

  return useMutation({
    mutationFn: async ({ prizeId, memberId }: { prizeId: string; memberId?: string | null }) => {
      const { error } = await supabase
        .from('earned_prizes')
        .update({ redeemed_at: null, redeemed_by: null })
        .eq('id', prizeId)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      invalidate(data?.memberId)
    },
  })
}

/**
 * KIDS-REWARDS-PAGE Q5c: mom's edit-image-later — set/replace the picture on
 * an already-earned prize card from the Prize Board. Parent-only via the
 * UPDATE policy. earned_prizes is NOT append-only (that rule is
 * financial_transactions, Convention #223).
 */
export function useUpdatePrizeImage() {
  const invalidate = useInvalidatePrizeQueries()

  return useMutation({
    mutationFn: async ({
      prizeId,
      memberId,
      imageUrl,
      imageAssetKey,
    }: {
      prizeId: string
      memberId?: string | null
      imageUrl: string | null
      imageAssetKey: string | null
    }) => {
      // Only flip prize_type between the three content modes. Randomizer /
      // celebration_only prizes keep their type even when an image is edited.
      const { data: current, error: readError } = await supabase
        .from('earned_prizes')
        .select('prize_type')
        .eq('id', prizeId)
        .single()
      if (readError) throw readError

      const isContentType = ['text', 'image', 'platform_image'].includes(current.prize_type)
      const update: Record<string, unknown> = {
        prize_image_url: imageUrl,
        prize_asset_key: imageAssetKey,
      }
      if (isContentType) {
        update.prize_type = imageUrl ? 'image' : imageAssetKey ? 'platform_image' : 'text'
      }

      const { error } = await supabase
        .from('earned_prizes')
        .update(update)
        .eq('id', prizeId)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      invalidate(data?.memberId)
    },
  })
}
