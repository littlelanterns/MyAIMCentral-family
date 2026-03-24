import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type SelfKnowledgeCategory =
  | 'personality'
  | 'strengths'
  | 'growth_areas'
  | 'communication_style'
  | 'how_i_work'

export type SelfKnowledgeSourceType =
  | 'manual'
  | 'upload'
  | 'lila_guided'
  | 'bulk_add'

export interface SelfKnowledgeEntry {
  id: string
  family_id: string
  member_id: string
  category: SelfKnowledgeCategory
  content: string
  source_type: SelfKnowledgeSourceType
  share_with_mom: boolean
  share_with_dad: boolean
  is_included_in_ai: boolean
  created_at: string
  updated_at: string
}

export const SELF_KNOWLEDGE_CATEGORIES: { value: SelfKnowledgeCategory; label: string }[] = [
  { value: 'personality', label: 'Personality' },
  { value: 'strengths', label: 'Strengths' },
  { value: 'growth_areas', label: 'Growth Areas' },
  { value: 'communication_style', label: 'Communication Style' },
  { value: 'how_i_work', label: 'How I Work' },
]

export function useSelfKnowledge(memberId: string | undefined) {
  return useQuery({
    queryKey: ['self-knowledge', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('self_knowledge')
        .select('*')
        .eq('member_id', memberId)
        .order('category')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SelfKnowledgeEntry[]
    },
    enabled: !!memberId,
  })
}

export function useSelfKnowledgeByCategory(memberId: string | undefined, category: SelfKnowledgeCategory) {
  return useQuery({
    queryKey: ['self-knowledge', memberId, category],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('self_knowledge')
        .select('*')
        .eq('member_id', memberId)
        .eq('category', category)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SelfKnowledgeEntry[]
    },
    enabled: !!memberId,
  })
}

export function useCreateSelfKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: {
      family_id: string
      member_id: string
      category: SelfKnowledgeCategory
      content: string
      source_type?: SelfKnowledgeSourceType
      share_with_mom?: boolean
      share_with_dad?: boolean
    }) => {
      const { data, error } = await supabase
        .from('self_knowledge')
        .insert({
          source_type: 'manual',
          ...entry,
        })
        .select()
        .single()

      if (error) throw error
      return data as SelfKnowledgeEntry
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', data.member_id] })
    },
  })
}

export function useUpdateSelfKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SelfKnowledgeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('self_knowledge')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as SelfKnowledgeEntry
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', data.member_id] })
    },
  })
}

export function useToggleSelfKnowledgeAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId, included }: { id: string; memberId: string; included: boolean }) => {
      const { error } = await supabase
        .from('self_knowledge')
        .update({ is_included_in_ai: included })
        .eq('id', id)
      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
    },
  })
}

export function useDeleteSelfKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('self_knowledge')
        .delete()
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
    },
  })
}
