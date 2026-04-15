import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type SelfKnowledgeCategory =
  | 'personality_type'
  | 'trait_tendency'
  | 'strength'
  | 'growth_area'
  | 'general'
  // Connection Preferences (6 categories)
  | 'gift_ideas'
  | 'meaningful_words'
  | 'helpful_actions'
  | 'quality_time_ideas'
  | 'sensitivities'
  | 'comfort_needs'

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

export type SelfKnowledgeCategoryGroup = 'self_knowledge' | 'connection'

export const SELF_KNOWLEDGE_CATEGORIES: { value: SelfKnowledgeCategory; label: string; description?: string; group: SelfKnowledgeCategoryGroup }[] = [
  // Self-Knowledge categories (existing)
  { value: 'personality_type', label: 'Personality Types', description: 'Your results from personality frameworks — MBTI, Enneagram, Dressing Your Truth, Four Tendencies, StrengthsFinder, Love Languages, etc.', group: 'self_knowledge' },
  { value: 'trait_tendency', label: 'Traits & Tendencies', group: 'self_knowledge' },
  { value: 'strength', label: 'Strengths', group: 'self_knowledge' },
  { value: 'growth_area', label: 'Growth Areas', group: 'self_knowledge' },
  { value: 'general', label: 'General', group: 'self_knowledge' },
  // Connection Preferences categories (new)
  { value: 'gift_ideas', label: 'Things I\'d Love', group: 'connection' },
  { value: 'meaningful_words', label: 'Words That Mean Something', group: 'connection' },
  { value: 'helpful_actions', label: 'What Really Helps', group: 'connection' },
  { value: 'quality_time_ideas', label: 'Ways to Spend Time Together', group: 'connection' },
  { value: 'sensitivities', label: 'Good to Know', group: 'connection' },
  { value: 'comfort_needs', label: 'What Makes a Bad Day Better', group: 'connection' },
]

/** Guided-shell-friendly labels for connection categories (ages 8-12) */
export const GUIDED_CONNECTION_LABELS: Partial<Record<SelfKnowledgeCategory, string>> = {
  gift_ideas: 'Cool Stuff I\'d Want',
  meaningful_words: 'Nice Things to Say to Me',
  helpful_actions: 'Ways to Help Me',
  quality_time_ideas: 'Fun Things to Do Together',
  sensitivities: 'Things to Know About Me',
  comfort_needs: 'What Makes a Bad Day Better',
}

/** Connection categories that map to specific Love Language tools */
export const CONNECTION_TO_TOOL_MAP: Partial<Record<SelfKnowledgeCategory, string>> = {
  gift_ideas: 'gifts',
  meaningful_words: 'words_affirmation',
  helpful_actions: 'observe_serve',
  quality_time_ideas: 'quality_time',
  sensitivities: 'all_communication', // feeds into Higgins, Mediator, all tools
  comfort_needs: 'general', // general context for all tools
}

/** Starter prompts to help users get started with each connection category */
export const CONNECTION_STARTER_PROMPTS: Record<string, { adult: string[]; guided: string[] }> = {
  gift_ideas: {
    adult: [
      'What gift would make your whole week?',
      'What\'s something you\'ve been wanting but haven\'t bought yourself?',
      'What non-material gift would mean the world to you?',
    ],
    guided: [
      'If you could get any present, what would it be?',
      'What\'s something cool you\'ve been wanting?',
      'What would be the best surprise ever?',
    ],
  },
  meaningful_words: {
    adult: [
      'What\'s a compliment that would really mean something to you?',
      'What kind of encouragement helps you the most?',
      'When do words make the biggest difference for you?',
    ],
    guided: [
      'What\'s the nicest thing someone could say to you?',
      'What makes you feel proud when someone notices?',
      'What words make you feel really good?',
    ],
  },
  helpful_actions: {
    adult: [
      'What\'s something someone could do for you that would really help?',
      'What chore or task would be amazing if someone just did it?',
      'When you\'re overwhelmed, what kind of help do you actually want?',
    ],
    guided: [
      'What\'s something that would really help you out?',
      'What\'s a chore you really don\'t like doing?',
      'When you need help, what kind of help is best?',
    ],
  },
  quality_time_ideas: {
    adult: [
      'What\'s your favorite way to spend time with someone?',
      'What activity makes you feel most connected to the people you love?',
      'Describe your perfect low-key hangout.',
    ],
    guided: [
      'What\'s the most fun thing to do with someone?',
      'What do you love doing with your family?',
      'If you had a whole afternoon with someone, what would you do?',
    ],
  },
  sensitivities: {
    adult: [
      'What\'s something that bothers you even when the person doesn\'t mean it?',
      'What should people know about how you process things?',
      'What\'s a pattern you wish people understood about you?',
    ],
    guided: [
      'What\'s something that bugs you even when people are trying to be nice?',
      'What do you wish people knew about you?',
      'What\'s something that makes you feel bad even when it\'s not a big deal?',
    ],
  },
  comfort_needs: {
    adult: [
      'When you\'re having a tough day, what actually helps?',
      'What are your go-to comfort things?',
      'What should someone do (or not do) when you\'re upset?',
    ],
    guided: [
      'When you\'re having a bad day, what makes it better?',
      'What\'s your favorite comfort food or thing to do?',
      'What helps when you\'re feeling sad or mad?',
    ],
  },
}

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
