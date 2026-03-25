import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type SelfKnowledgeCategory =
  | 'personality_type'
  | 'trait_tendency'
  | 'strength'
  | 'growth_area'
  | 'general'

export type SelfKnowledgeSourceType =
  | 'manual'
  | 'file_upload'
  | 'lila_discovery'
  | 'bulk_add'
  | 'content_extraction'
  | 'log_routed'

export interface SelfKnowledgeEntry {
  id: string
  family_id: string
  member_id: string
  category: SelfKnowledgeCategory
  content: string
  source_type: SelfKnowledgeSourceType
  source: string | null
  source_reference_id: string | null
  file_storage_path: string | null
  share_with_mom: boolean
  share_with_dad: boolean
  is_included_in_ai: boolean
  sort_order: number | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export const SELF_KNOWLEDGE_CATEGORIES: { value: SelfKnowledgeCategory; label: string; description?: string }[] = [
  { value: 'personality_type', label: 'Personality Types', description: 'Your results from personality frameworks — MBTI, Enneagram, Dressing Your Truth, Four Tendencies, StrengthsFinder, Love Languages, etc.' },
  { value: 'trait_tendency', label: 'Traits & Tendencies' },
  { value: 'strength', label: 'Strengths' },
  { value: 'growth_area', label: 'Growth Areas' },
  { value: 'general', label: 'General' },
]

/** Active (non-archived) entries, ordered by sort_order then created_at */
export function useSelfKnowledge(memberId: string | undefined) {
  return useQuery({
    queryKey: ['self-knowledge', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('self_knowledge')
        .select('*')
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as SelfKnowledgeEntry[]
    },
    enabled: !!memberId,
  })
}

/** Archived entries only */
export function useArchivedSelfKnowledge(memberId: string | undefined) {
  return useQuery({
    queryKey: ['self-knowledge-archived', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('self_knowledge')
        .select('*')
        .eq('member_id', memberId)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

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
        .is('archived_at', null)
        .order('sort_order', { ascending: true, nullsFirst: false })
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
      source?: string | null
      source_reference_id?: string | null
      file_storage_path?: string | null
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
      queryClient.invalidateQueries({ queryKey: ['self-knowledge-archived', data.member_id] })
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

/** Batch toggle is_included_in_ai for all entries in a category */
export function useBatchToggleSelfKnowledgeAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, category, included }: { memberId: string; category: SelfKnowledgeCategory; included: boolean }) => {
      const { error } = await supabase
        .from('self_knowledge')
        .update({ is_included_in_ai: included })
        .eq('member_id', memberId)
        .eq('category', category)
        .is('archived_at', null)
      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
    },
  })
}

/** Soft delete: sets archived_at */
export function useDeleteSelfKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('self_knowledge')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
      queryClient.invalidateQueries({ queryKey: ['self-knowledge-archived', memberId] })
    },
  })
}

/** Archive: sets archived_at (alias for delete in soft-delete pattern) */
export function useArchiveSelfKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('self_knowledge')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
      queryClient.invalidateQueries({ queryKey: ['self-knowledge-archived', memberId] })
    },
  })
}

/** Restore: sets archived_at to null */
export function useRestoreSelfKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('self_knowledge')
        .update({ archived_at: null })
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
      queryClient.invalidateQueries({ queryKey: ['self-knowledge-archived', memberId] })
    },
  })
}

/** Reorder entries within a category by updating sort_order */
export function useReorderSelfKnowledge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, reorderedIds }: { memberId: string; reorderedIds: string[] }) => {
      // Update sort_order for each entry in the new order
      const updates = reorderedIds.map((id, index) =>
        supabase
          .from('self_knowledge')
          .update({ sort_order: index })
          .eq('id', id)
      )
      const results = await Promise.all(updates)
      const firstError = results.find(r => r.error)
      if (firstError?.error) throw firstError.error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
    },
  })
}
