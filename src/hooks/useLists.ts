import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type ListType = 'simple' | 'checklist' | 'reference' | 'template' | 'randomizer' | 'backburner'

export interface List {
  id: string
  family_id: string
  owner_id: string
  title: string
  list_type: ListType
  reveal_type: string | null
  created_at: string
  updated_at: string
}

export interface ListItem {
  id: string
  list_id: string
  content: string
  checked: boolean
  section_name: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export function useLists(familyId: string | undefined) {
  return useQuery({
    queryKey: ['lists', familyId],
    queryFn: async () => {
      if (!familyId) return []

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('family_id', familyId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as List[]
    },
    enabled: !!familyId,
  })
}

export function useListItems(listId: string | undefined) {
  return useQuery({
    queryKey: ['list-items', listId],
    queryFn: async () => {
      if (!listId) return []

      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', listId)
        .order('sort_order')

      if (error) throw error
      return data as ListItem[]
    },
    enabled: !!listId,
  })
}

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (list: {
      family_id: string
      owner_id: string
      title: string
      list_type: ListType
    }) => {
      const { data, error } = await supabase
        .from('lists')
        .insert(list)
        .select()
        .single()

      if (error) throw error
      return data as List
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lists', data.family_id] })
    },
  })
}

export function useCreateListItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: {
      list_id: string
      content: string
      section_name?: string
      sort_order?: number
    }) => {
      const { data, error } = await supabase
        .from('list_items')
        .insert({ sort_order: 0, ...item })
        .select()
        .single()

      if (error) throw error
      return data as ListItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', data.list_id] })
    },
  })
}

export function useToggleListItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, checked, listId }: { id: string; checked: boolean; listId: string }) => {
      const { error } = await supabase
        .from('list_items')
        .update({ checked })
        .eq('id', id)

      if (error) throw error
      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    },
  })
}
