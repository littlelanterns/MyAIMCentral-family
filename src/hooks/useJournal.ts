import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type JournalEntryType =
  | 'daily_reflection' | 'gratitude' | 'learning_capture' | 'prayer'
  | 'letter' | 'memory' | 'goal_check_in' | 'dream'
  | 'observation' | 'free_write' | 'reflection_response'

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
  { value: 'free_write', label: 'Free Write' },
  { value: 'daily_reflection', label: 'Daily Reflection' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'learning_capture', label: 'Learning Capture' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'letter', label: 'Letter' },
  { value: 'memory', label: 'Memory' },
  { value: 'goal_check_in', label: 'Goal Check-In' },
  { value: 'dream', label: 'Dream' },
  { value: 'observation', label: 'Observation' },
  { value: 'reflection_response', label: 'Reflection Response' },
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
