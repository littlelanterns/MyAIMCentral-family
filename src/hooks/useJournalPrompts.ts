/**
 * useJournalPrompts (PRD-23)
 * CRUD for journal_prompts table — personal prompt library.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type { JournalPrompt } from '@/types/bookshelf'

export function useJournalPrompts() {
  const { data: member } = useFamilyMember()
  const qc = useQueryClient()
  const queryKey = ['journal-prompts', member?.id]

  const { data: prompts = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!member) return []
      const { data, error } = await supabase
        .from('journal_prompts')
        .select('*')
        .eq('family_member_id', member.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as JournalPrompt[]
    },
    enabled: !!member,
  })

  const createPrompt = useMutation({
    mutationFn: async ({ text, tags }: { text: string; tags?: string[] }) => {
      if (!member) throw new Error('No member')
      const { error } = await supabase
        .from('journal_prompts')
        .insert({
          family_id: member.family_id,
          family_member_id: member.id,
          prompt_text: text,
          source: 'manual',
          tags: tags || [],
        })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const archivePrompt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('journal_prompts')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  return {
    prompts,
    loading,
    createPrompt: createPrompt.mutateAsync,
    archivePrompt: archivePrompt.mutateAsync,
    refetch: () => qc.invalidateQueries({ queryKey }),
  }
}
