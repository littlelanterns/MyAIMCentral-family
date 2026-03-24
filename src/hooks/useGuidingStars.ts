import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface GuidingStar {
  id: string
  family_id: string
  member_id: string
  content: string
  category: string | null
  description: string | null
  source: string
  is_included_in_ai: boolean
  created_at: string
  updated_at: string
}

export function useGuidingStars(memberId: string | undefined) {
  return useQuery({
    queryKey: ['guiding-stars', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('guiding_stars')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as GuidingStar[]
    },
    enabled: !!memberId,
  })
}

export function useCreateGuidingStar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (star: {
      family_id: string
      member_id: string
      content: string
      category?: string
      description?: string
      source?: string
    }) => {
      const { data, error } = await supabase
        .from('guiding_stars')
        .insert(star)
        .select()
        .single()

      if (error) throw error
      return data as GuidingStar
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guiding-stars', data.member_id] })
    },
  })
}

export function useUpdateGuidingStar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GuidingStar> & { id: string }) => {
      const { data, error } = await supabase
        .from('guiding_stars')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as GuidingStar
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guiding-stars', data.member_id] })
    },
  })
}

export function useToggleGuidingStarAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId, included }: { id: string; memberId: string; included: boolean }) => {
      const { error } = await supabase
        .from('guiding_stars')
        .update({ is_included_in_ai: included })
        .eq('id', id)
      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['guiding-stars', memberId] })
    },
  })
}

export function useDeleteGuidingStar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('guiding_stars')
        .delete()
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['guiding-stars', memberId] })
    },
  })
}
