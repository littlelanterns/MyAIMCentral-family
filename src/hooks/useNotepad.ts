import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface NotepadTab {
  id: string
  family_id: string
  member_id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface NotepadExtractedItem {
  id: string
  tab_id: string
  routing_destination: string
  extracted_content: string
  status: 'pending' | 'routed' | 'dismissed'
  created_at: string
}

// Valid routing destinations for extracted items
export const ROUTING_DESTINATIONS = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'guiding_stars', label: 'GuidingStars' },
  { key: 'best_intentions', label: 'BestIntentions' },
  { key: 'journal_entry', label: 'Journal' },
  { key: 'victory', label: 'Victories' },
  // STUB: people_message — wires to PRD-15
] as const

export function useNotepadTabs(memberId: string | undefined) {
  return useQuery({
    queryKey: ['notepad-tabs', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('notepad_tabs')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at')

      if (error) throw error
      return data as NotepadTab[]
    },
    enabled: !!memberId,
  })
}

export function useCreateNotepadTab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tab: {
      family_id: string
      member_id: string
      title: string
      content?: string
    }) => {
      const { data, error } = await supabase
        .from('notepad_tabs')
        .insert(tab)
        .select()
        .single()

      if (error) throw error
      return data as NotepadTab
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', data.member_id] })
    },
  })
}

export function useUpdateNotepadTab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NotepadTab> & { id: string }) => {
      const { data, error } = await supabase
        .from('notepad_tabs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as NotepadTab
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', data.member_id] })
    },
  })
}

export function useDeleteNotepadTab() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const { error } = await supabase
        .from('notepad_tabs')
        .delete()
        .eq('id', id)

      if (error) throw error
      return memberId
    },
    onSuccess: (memberId) => {
      queryClient.invalidateQueries({ queryKey: ['notepad-tabs', memberId] })
    },
  })
}

export function useExtractedItems(tabId: string | undefined) {
  return useQuery({
    queryKey: ['extracted-items', tabId],
    queryFn: async () => {
      if (!tabId) return []

      const { data, error } = await supabase
        .from('notepad_extracted_items')
        .select('*')
        .eq('tab_id', tabId)
        .order('created_at')

      if (error) throw error
      return data as NotepadExtractedItem[]
    },
    enabled: !!tabId,
  })
}

export function useRouteExtractedItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'routed' | 'dismissed' }) => {
      const { data, error } = await supabase
        .from('notepad_extracted_items')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as NotepadExtractedItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['extracted-items', data.tab_id] })
    },
  })
}
