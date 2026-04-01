import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  List, ListItem, ListShare, ListTemplate, ListType,
} from '@/types/lists'

// Re-export types for backward compatibility
export type { List, ListItem, ListType, ListShare, ListTemplate }

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
    mutationFn: async ({ id, checked, listId, checkedBy }: { id: string; checked: boolean; listId: string; checkedBy?: string }) => {
      const { error } = await supabase
        .from('list_items')
        .update({
          checked,
          checked_by: checked ? checkedBy : null,
          checked_at: checked ? new Date().toISOString() : null,
        })
        .eq('id', id)

      if (error) throw error
      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    },
  })
}

// ── Extended hooks (PRD-09B) ──────────────────────────────

export function useList(listId: string | undefined) {
  return useQuery({
    queryKey: ['list', listId],
    queryFn: async () => {
      if (!listId) return null
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('id', listId)
        .single()
      if (error) throw error
      return data as List
    },
    enabled: !!listId,
  })
}

export function useUpdateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<List>) => {
      const { data, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as List
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list', data.id] })
    },
  })
}

export function useArchiveList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('lists')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', listId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}

export function useDeleteListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, listId }: { id: string; listId: string }) => {
      const { error } = await supabase.from('list_items').delete().eq('id', id)
      if (error) throw error
      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    },
  })
}

export function useUpdateListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, listId, ...updates }: { id: string; listId: string } & Partial<ListItem>) => {
      const { error } = await supabase
        .from('list_items')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    },
  })
}

export function useListShares(listId: string | undefined) {
  return useQuery({
    queryKey: ['list-shares', listId],
    queryFn: async () => {
      if (!listId) return []
      const { data, error } = await supabase
        .from('list_shares')
        .select('*')
        .eq('list_id', listId)
      if (error) throw error
      return data as ListShare[]
    },
    enabled: !!listId,
  })
}

export function useShareList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, memberId, canEdit }: { listId: string; memberId: string; canEdit?: boolean }) => {
      const { error } = await supabase.from('list_shares').insert({
        list_id: listId,
        shared_with: memberId,
        member_id: memberId,
        permission: canEdit ? 'edit' : 'view',
        can_edit: canEdit ?? true,
      })
      if (error) throw error
      // Flag the list as shared
      await supabase.from('lists').update({ is_shared: true }).eq('id', listId)
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['list-shares', vars.listId] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}

export function useUnshareList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shareId, listId }: { shareId: string; listId: string }) => {
      const { error } = await supabase.from('list_shares').delete().eq('id', shareId)
      if (error) throw error
      return listId
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['list-shares', vars.listId] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}

export function usePromoteListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, content, familyId, memberId, listId }: {
      itemId: string; content: string; familyId: string; memberId: string; listId: string
    }) => {
      // Create studio_queue entry
      const { error: qErr } = await supabase.from('studio_queue').insert({
        family_id: familyId,
        owner_id: memberId,
        destination: 'task',
        content,
        content_details: {},
        source: 'list_promoted',
        source_reference_id: itemId,
      })
      if (qErr) throw qErr

      // Mark item as promoted
      const { error: uErr } = await supabase
        .from('list_items')
        .update({ promoted_to_task: true })
        .eq('id', itemId)
      if (uErr) throw uErr

      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
      queryClient.invalidateQueries({ queryKey: ['studio_queue'] })
    },
  })
}

export function useListTemplates() {
  return useQuery({
    queryKey: ['list-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_templates')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return data as ListTemplate[]
    },
  })
}

export function useReorderListItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const updates = items.map(({ id, sort_order }) =>
        supabase.from('list_items').update({ sort_order }).eq('id', id)
      )
      await Promise.all(updates)
      return items
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-items'] })
    },
  })
}

export function useSaveListAsTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      familyId,
      createdBy,
      title,
      listType,
      items,
    }: {
      familyId: string
      createdBy: string
      title: string
      listType: string
      items: ListItem[]
    }) => {
      const { data, error } = await supabase
        .from('list_templates')
        .insert({
          family_id: familyId,
          created_by: createdBy,
          title: `${title} (Template)`,
          list_type: listType,
          default_items: items.map((i) => ({
            content: i.content || i.item_name || '',
            section_name: i.section_name || null,
            notes: i.notes || null,
          })),
          is_system: false,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-templates'] })
    },
  })
}

export function useUncheckAllItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('list_items')
        .update({ checked: false, checked_by: null, checked_at: null })
        .eq('list_id', listId)
      if (error) throw error
      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    },
  })
}
