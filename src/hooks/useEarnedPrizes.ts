import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

export interface EarnedPrize {
  id: string
  family_id: string
  family_member_id: string
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

export function useRedeemPrize() {
  const queryClient = useQueryClient()
  const { data: member } = useFamilyMember()

  return useMutation({
    mutationFn: async ({ prizeId, redeemedBy }: { prizeId: string; redeemedBy: string }) => {
      const { error } = await supabase
        .from('earned_prizes')
        .update({ redeemed_at: new Date().toISOString(), redeemed_by: redeemedBy })
        .eq('id', prizeId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earned-prizes', member?.family_id] })
    },
  })
}
