// PRD-11: Victory Celebration Archive — save/fetch/delete celebration narratives
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { VictoryCelebration, CreateCelebration } from '@/types/victories'

export function useCelebrationArchive(memberId: string | undefined) {
  const { data: member } = useFamilyMember()
  const familyId = member?.family_id

  return useQuery({
    queryKey: ['celebration-archive', memberId],
    queryFn: async () => {
      if (!memberId || !familyId) return []

      const { data, error } = await supabase
        .from('victory_celebrations')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as VictoryCelebration[]
    },
    enabled: !!memberId && !!familyId,
  })
}

export function useSaveCelebration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCelebration) => {
      const { data, error } = await supabase
        .from('victory_celebrations')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          celebration_date: input.celebration_date ?? new Date().toISOString().slice(0, 10),
          mode: input.mode,
          period: input.period ?? null,
          narrative: input.narrative,
          victory_ids: input.victory_ids ?? null,
          victory_count: input.victory_count,
          celebration_voice: input.celebration_voice ?? null,
          context_sources: input.context_sources ?? {},
        })
        .select()
        .single()

      if (error) throw error
      return data as VictoryCelebration
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['celebration-archive', data.family_member_id] })
    },
  })
}

export function useDeleteCelebration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('victory_celebrations')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { memberId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['celebration-archive', data.memberId] })
    },
  })
}
