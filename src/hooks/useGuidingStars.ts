import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type GuidingStarEntryType = 'value' | 'declaration' | 'scripture_quote' | 'vision'

export const GUIDING_STAR_TYPES: { value: GuidingStarEntryType; label: string }[] = [
  { value: 'value', label: 'Values' },
  { value: 'declaration', label: 'Declarations' },
  { value: 'scripture_quote', label: 'Scriptures & Quotes' },
  { value: 'vision', label: 'Vision' },
]

export interface GuidingStar {
  id: string
  family_id: string
  member_id: string
  entry_type: GuidingStarEntryType
  content: string
  category: string | null
  description: string | null
  source: string
  source_reference_id: string | null
  owner_type?: 'member' | 'family'
  is_included_in_ai: boolean
  is_private: boolean
  is_shared_with_partner: boolean
  sort_order: number
  archived_at: string | null
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
        .is('archived_at', null)
        .order('entry_type', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as GuidingStar[]
    },
    enabled: !!memberId,
  })
}

export function useArchivedGuidingStars(memberId: string | undefined) {
  return useQuery({
    queryKey: ['guiding-stars-archived', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('guiding_stars')
        .select('*')
        .eq('member_id', memberId)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

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
      entry_type?: GuidingStarEntryType
      category?: string
      description?: string
      source?: string
    }) => {
      const { data, error } = await supabase
        .from('guiding_stars')
        .insert({
          ...star,
          entry_type: star.entry_type || 'value',
        })
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

export function useBatchToggleGuidingStarAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      entryType,
      included,
    }: {
      memberId: string
      entryType: GuidingStarEntryType
      included: boolean
    }) => {
      const { error } = await supabase
        .from('guiding_stars')
        .update({ is_included_in_ai: included })
        .eq('member_id', memberId)
        .eq('entry_type', entryType)
        .is('archived_at', null)
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
      // Soft delete — set archived_at
      const { error } = await supabase
        .from('guiding_stars')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['guiding-stars', memberId] })
      queryClient.invalidateQueries({ queryKey: ['guiding-stars-archived', memberId] })
    },
  })
}

export function useRestoreGuidingStar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('guiding_stars')
        .update({ archived_at: null })
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['guiding-stars', memberId] })
      queryClient.invalidateQueries({ queryKey: ['guiding-stars-archived', memberId] })
    },
  })
}

export function useHardDeleteGuidingStar() {
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
      queryClient.invalidateQueries({ queryKey: ['guiding-stars-archived', memberId] })
    },
  })
}

export function useReorderGuidingStars() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      memberId,
      orderedIds,
    }: {
      memberId: string
      orderedIds: string[]
    }) => {
      // Update sort_order for each ID based on position
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('guiding_stars')
          .update({ sort_order: index })
          .eq('id', id)
      )
      const results = await Promise.all(updates)
      const firstError = results.find((r) => r.error)
      if (firstError?.error) throw firstError.error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['guiding-stars', memberId] })
    },
  })
}
