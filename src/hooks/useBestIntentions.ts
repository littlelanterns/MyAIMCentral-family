import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface BestIntention {
  id: string
  family_id: string
  member_id: string
  statement: string
  tags: string[] | null
  source: string
  celebration_count: number
  iteration_count: number
  is_included_in_ai: boolean
  last_reset_at: string | null
  created_at: string
  updated_at: string
}

export interface IntentionIteration {
  id: string
  intention_id: string
  victory_reference: string | null
  created_at: string
}

export function useBestIntentions(memberId: string | undefined) {
  return useQuery({
    queryKey: ['best-intentions', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('best_intentions')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as BestIntention[]
    },
    enabled: !!memberId,
  })
}

export function useIntentionIterations(intentionId: string | undefined) {
  return useQuery({
    queryKey: ['intention-iterations', intentionId],
    queryFn: async () => {
      if (!intentionId) return []

      const { data, error } = await supabase
        .from('intention_iterations')
        .select('*')
        .eq('intention_id', intentionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as IntentionIteration[]
    },
    enabled: !!intentionId,
  })
}

export function useCreateBestIntention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (intention: {
      family_id: string
      member_id: string
      statement: string
      tags?: string[]
      source?: string
    }) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .insert(intention)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
    },
  })
}

export function useUpdateBestIntention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BestIntention> & { id: string }) => {
      const { data, error } = await supabase
        .from('best_intentions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as BestIntention
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['best-intentions', data.member_id] })
    },
  })
}

export function useLogIteration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ intentionId, victoryReference }: {
      intentionId: string
      victoryReference?: string
    }) => {
      const { data, error } = await supabase
        .from('intention_iterations')
        .insert({
          intention_id: intentionId,
          victory_reference: victoryReference ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as IntentionIteration
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['intention-iterations', data.intention_id] })
      queryClient.invalidateQueries({ queryKey: ['best-intentions'] })
    },
  })
}
