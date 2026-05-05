import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type {
  List, ListItem, ListShare, ListTemplate, ListTemplateItem, ListType, VictoryMode,
  ListSectionSettings,
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

function getDefaultVictoryMode(listType: ListType): VictoryMode {
  if (listType === 'randomizer') return 'item_completed'
  return 'none'
}

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (list: {
      family_id: string
      owner_id: string
      title: string
      list_type: ListType
      tags?: string[]
      victory_mode?: VictoryMode
      template_id?: string
      default_items?: ListTemplateItem[]
      // Living Shopping List V1 overrides
      is_always_on?: boolean
      include_in_shopping_mode?: boolean
      default_checked_visibility_hours?: number
      default_purchase_history_days?: number
      default_auto_archive_days?: number
    }) => {
      const {
        victory_mode, template_id, default_items,
        is_always_on, include_in_shopping_mode,
        default_checked_visibility_hours, default_purchase_history_days,
        default_auto_archive_days,
        ...rest
      } = list
      const insertPayload: Record<string, unknown> = {
        ...rest,
        tags: list.tags ?? [],
        victory_mode: victory_mode ?? getDefaultVictoryMode(list.list_type),
        template_id: template_id ?? null,
      }
      // Only include Living Shopping List overrides if explicitly provided
      // (DB trigger handles defaults for shopping lists)
      if (is_always_on != null) insertPayload.is_always_on = is_always_on
      if (include_in_shopping_mode != null) insertPayload.include_in_shopping_mode = include_in_shopping_mode
      if (default_checked_visibility_hours != null) insertPayload.default_checked_visibility_hours = default_checked_visibility_hours
      if (default_purchase_history_days != null) insertPayload.default_purchase_history_days = default_purchase_history_days
      if (default_auto_archive_days != null) insertPayload.default_auto_archive_days = default_auto_archive_days

      const { data, error } = await supabase
        .from('lists')
        .insert(insertPayload)
        .select()
        .single()

      if (error) throw error
      const newList = data as List

      if (default_items && default_items.length > 0) {
        const itemRows = default_items
          .filter(item => !item.is_section_header)
          .map((item, idx) => ({
            list_id: newList.id,
            content: item.item_name,
            section_name: item.section_name ?? null,
            notes: item.notes ?? null,
            quantity: item.quantity ?? null,
            quantity_unit: item.quantity_unit ?? null,
            price: item.price ?? null,
            priority: item.priority ?? null,
            category: item.category ?? null,
            is_repeatable: item.is_repeatable ?? false,
            resource_url: item.resource_url ?? (item as unknown as Record<string, unknown>).url as string ?? null,
            sort_order: idx,
          }))
        if (itemRows.length > 0) {
          const { error: itemErr } = await supabase
            .from('list_items')
            .insert(itemRows)
          if (itemErr) console.warn('Failed to hydrate template items:', itemErr.message)
        }
      }

      if (template_id) {
        supabase
          .from('list_templates')
          .select('usage_count')
          .eq('id', template_id)
          .single()
          .then(({ data: tpl }) => {
            supabase
              .from('list_templates')
              .update({
                usage_count: ((tpl?.usage_count as number) ?? 0) + 1,
                last_deployed_at: new Date().toISOString(),
              })
              .eq('id', template_id)
              .then(() => {})
          })
      }

      return newList
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lists', data.family_id] })
      queryClient.invalidateQueries({ queryKey: ['list-items', data.id] })
      queryClient.invalidateQueries({ queryKey: ['list-templates'] })
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
      notes?: string
      sort_order?: number
      store_tags?: string[] | null
      store_category?: string | null
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
    mutationFn: async ({ id, checked, listId, checkedBy, familyId, itemContent, purchaseSnapshot }: {
      id: string; checked: boolean; listId: string; checkedBy?: string
      familyId?: string; itemContent?: string
      purchaseSnapshot?: {
        section_name?: string | null
        store_category?: string | null
        quantity?: number | null
        quantity_unit?: string | null
      }
    }) => {
      const { error } = await supabase
        .from('list_items')
        .update({
          checked,
          checked_by: checked ? checkedBy : null,
          checked_at: checked ? new Date().toISOString() : null,
          in_progress_member_id: null,
        })
        .eq('id', id)

      if (error) throw error

      // Activity log entry for checked items (fire-and-forget)
      if (checked && familyId && checkedBy) {
        supabase
          .from('activity_log_entries')
          .insert({
            family_id: familyId,
            member_id: checkedBy,
            event_type: 'list_item_completed',
            source_table: 'list_items',
            source_id: id,
            source_reference_id: listId,
            display_text: itemContent ? `Checked: ${itemContent}` : 'List item completed',
            metadata: { list_id: listId },
          })
          .then(({ error: logErr }) => {
            if (logErr) console.warn('activity log insert failed:', logErr.message)
          })

        // Purchase history capture for shopping lists (fire-and-forget)
        if (purchaseSnapshot) {
          supabase
            .from('purchase_history')
            .insert({
              family_id: familyId,
              list_item_id: id,
              list_id: listId,
              item_name: itemContent || 'Unknown item',
              store_section: purchaseSnapshot.section_name ?? null,
              store_category: purchaseSnapshot.store_category ?? null,
              quantity: purchaseSnapshot.quantity ?? null,
              quantity_unit: purchaseSnapshot.quantity_unit ?? null,
              purchased_by: checkedBy,
            })
            .then(({ error: phErr }) => {
              if (phErr) console.warn('purchase history insert failed:', phErr.message)
            })
        }
      }

      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    },
  })
}

export function useClaimListItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, listId, memberId }: { id: string; listId: string; memberId: string | null }) => {
      const { error } = await supabase
        .from('list_items')
        .update({ in_progress_member_id: memberId })
        .eq('id', id)
      if (error) throw error
      return listId
    },
    onSuccess: (listId) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
    },
  })
}

export function useDuplicateListForMembers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sourceList, items, memberIds, familyId }: {
      sourceList: List
      items: ListItem[]
      memberIds: string[]
      familyId: string
    }) => {
      const created: string[] = []
      for (const memberId of memberIds) {
        const { data: newList, error: listErr } = await supabase
          .from('lists')
          .insert({
            family_id: familyId,
            owner_id: memberId,
            title: sourceList.title,
            list_type: sourceList.list_type,
            tags: sourceList.tags ?? [],
            victory_mode: sourceList.victory_mode ?? 'none',
            instantiation_mode: 'individual',
          })
          .select()
          .single()
        if (listErr) throw listErr

        if (items.length > 0) {
          const rows = items.map((item, i) => ({
            list_id: (newList as List).id,
            content: item.content || item.item_name || '',
            item_name: item.item_name,
            section_name: item.section_name,
            notes: item.notes,
            resource_url: item.resource_url,
            quantity: item.quantity,
            quantity_unit: item.quantity_unit,
            price: item.price,
            category: item.category,
            priority: item.priority,
            sort_order: item.sort_order ?? i,
          }))
          await supabase.from('list_items').insert(rows)
        }
        created.push((newList as List).id)
      }
      return created
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lists', vars.familyId] })
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

export function useDeleteList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) => {
      // Items cascade-delete via FK, but delete explicitly for safety
      await supabase.from('list_items').delete().eq('list_id', listId)
      await supabase.from('list_shares').delete().eq('list_id', listId)
      const { error } = await supabase.from('lists').delete().eq('id', listId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })
}

export function useRestoreList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('lists')
        .update({ archived_at: null })
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

/** List IDs shared WITH a specific member (excludes hidden shares) */
export function useSharedListIds(memberId: string | undefined) {
  return useQuery({
    queryKey: ['shared-list-ids', memberId],
    queryFn: async () => {
      if (!memberId) return [] as string[]
      const { data, error } = await supabase
        .from('list_shares')
        .select('list_id')
        .eq('shared_with', memberId)
        .or('is_hidden.eq.false,is_hidden.is.null')
      if (error) throw error
      return (data ?? []).map(r => r.list_id)
    },
    enabled: !!memberId,
  })
}

export function useShareList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ listId, memberId, canEdit, listType }: { listId: string; memberId: string; canEdit?: boolean; listType?: string }) => {
      // Reference lists default to view-only shares
      const defaultCanEdit = listType === 'reference' ? false : true
      const resolvedCanEdit = canEdit ?? defaultCanEdit
      const permission = resolvedCanEdit ? 'edit' : 'view'
      const { error } = await supabase.from('list_shares').insert({
        list_id: listId,
        shared_with: memberId,
        member_id: memberId,
        permission,
        can_edit: permission === 'edit',
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
            item_name: i.content || i.item_name || '',
            section_name: i.section_name || undefined,
            notes: i.notes || undefined,
            quantity: i.quantity ?? undefined,
            quantity_unit: i.quantity_unit || undefined,
            price: i.price ?? undefined,
            priority: i.priority || undefined,
            category: i.category || undefined,
            is_repeatable: i.is_repeatable || undefined,
            resource_url: i.resource_url || undefined,
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

export function useHideSharedList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shareId }: { shareId: string }) => {
      const { error } = await supabase
        .from('list_shares')
        .update({ is_hidden: true })
        .eq('id', shareId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list-shares'] })
      queryClient.invalidateQueries({ queryKey: ['shared-list-ids'] })
    },
  })
}

export function useUnhideSharedList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shareId }: { shareId: string }) => {
      const { error } = await supabase
        .from('list_shares')
        .update({ is_hidden: false })
        .eq('id', shareId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['list-shares'] })
      queryClient.invalidateQueries({ queryKey: ['shared-list-ids'] })
      queryClient.invalidateQueries({ queryKey: ['hidden-shared-lists'] })
    },
  })
}

export function useHiddenSharedLists(memberId: string | undefined) {
  return useQuery({
    queryKey: ['hidden-shared-lists', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('list_shares')
        .select('*, lists(*)')
        .eq('shared_with', memberId)
        .eq('is_hidden', true)
      if (error) throw error
      return data ?? []
    },
    enabled: !!memberId,
  })
}

export function useUpdateSharePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ shareId, permission }: { shareId: string; permission: 'view' | 'edit' }) => {
      const { error } = await supabase
        .from('list_shares')
        .update({ permission, can_edit: permission === 'edit' })
        .eq('id', shareId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['list-shares'] })
    },
  })
}

export function useSuggestListTags() {
  return useMutation({
    mutationFn: async ({
      listName,
      sampleItems,
    }: {
      listName: string
      sampleItems: string[]
    }): Promise<string[]> => {
      try {
        const { sendAIMessage, extractJSON } = await import('@/lib/ai/send-ai-message')
        const response = await sendAIMessage(
          'You are a tag suggestion engine. Return ONLY a JSON array of lowercase tag strings.',
          [{ role: 'user', content: `Suggest 2-4 short tags for a list called "${listName}" with items like: ${sampleItems.slice(0, 10).join(', ')}. Examples: ["parenting","tsg","reference"] or ["insurance","medical","kids"]` }],
          512,
          'haiku'
        )
        const parsed = extractJSON(response)
        if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === 'string')
        return []
      } catch {
        return []
      }
    },
  })
}

// ── Living Shopping List: Per-Section Settings ──────────────

export function useListSectionSettings(listId: string | undefined) {
  return useQuery({
    queryKey: ['list-section-settings', listId],
    queryFn: async () => {
      if (!listId) return []
      const { data, error } = await supabase
        .from('list_section_settings')
        .select('*')
        .eq('list_id', listId)
        .order('section_name')
      if (error) throw error
      return data as ListSectionSettings[]
    },
    enabled: !!listId,
  })
}

export function useUpsertListSectionSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      familyId,
      listId,
      sectionName,
      updates,
    }: {
      familyId: string
      listId: string
      sectionName: string
      updates: {
        checked_visibility_hours?: number | null
        purchase_history_days?: number | null
        auto_archive_days?: number | null
      }
    }) => {
      const { data, error } = await supabase
        .from('list_section_settings')
        .upsert(
          {
            family_id: familyId,
            list_id: listId,
            section_name: sectionName,
            ...updates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'list_id,section_name' }
        )
        .select()
        .single()
      if (error) throw error
      return data as ListSectionSettings
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['list-section-settings', vars.listId] })
    },
  })
}
