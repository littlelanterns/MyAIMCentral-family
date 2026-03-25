import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type JournalEntryType =
  | 'journal_entry' | 'gratitude' | 'reflection' | 'quick_note'
  | 'commonplace' | 'kid_quips' | 'meeting_notes' | 'transcript'
  | 'lila_conversation' | 'brain_dump' | 'custom'

export type JournalVisibility = 'private' | 'shared_parents' | 'family'

export interface JournalEntry {
  id: string
  family_id: string
  member_id: string
  entry_type: JournalEntryType
  content: string
  tags: string[]
  visibility: JournalVisibility
  related_plan_id: string | null
  is_included_in_ai: boolean
  created_at: string
  updated_at: string
}

export const JOURNAL_ENTRY_TYPES: { value: JournalEntryType; label: string }[] = [
  { value: 'journal_entry', label: 'Journal Entry' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'quick_note', label: 'Quick Note' },
  { value: 'commonplace', label: 'Commonplace' },
  { value: 'kid_quips', label: 'Kid Quips' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'transcript', label: 'Transcript' },
  { value: 'lila_conversation', label: 'LiLa Conversation' },
  { value: 'brain_dump', label: 'Brain Dump' },
  { value: 'custom', label: 'Custom' },
]

export function useJournalEntries(memberId: string | undefined) {
  return useQuery({
    queryKey: ['journal-entries', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as JournalEntry[]
    },
    enabled: !!memberId,
  })
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entry: {
      family_id: string
      member_id: string
      entry_type: JournalEntryType
      content: string
      visibility?: JournalVisibility
      tags?: string[]
    }) => {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          visibility: 'private',
          tags: [],
          ...entry,
        })
        .select()
        .single()

      if (error) throw error
      return data as JournalEntry
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', data.member_id] })
    },
  })
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JournalEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as JournalEntry
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', data.member_id] })
    },
  })
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', memberId] })
    },
  })
}
