import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type {
  ArchiveFolder,
  ArchiveContextItem,
  ArchiveMemberSettings,
  FaithPreferences,
  AggregatedContextEntry,
  ArchiveMemberSummary,
  FamilyOverviewSection,
  ArchiveContextType,
  ArchiveItemSource,
} from '@/types/archives'

// ---------- Tree builder utility ----------

export interface ArchiveFolderNode extends ArchiveFolder {
  children: ArchiveFolderNode[]
}

function buildFolderTree(folders: ArchiveFolder[]): ArchiveFolderNode[] {
  const map = new Map<string, ArchiveFolderNode>()
  const roots: ArchiveFolderNode[] = []

  // Create nodes
  for (const folder of folders) {
    map.set(folder.id, { ...folder, children: [] })
  }

  // Wire parent-child relationships
  for (const folder of folders) {
    const node = map.get(folder.id)!
    if (folder.parent_folder_id && map.has(folder.parent_folder_id)) {
      map.get(folder.parent_folder_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// ==========================================================================
// useArchiveFolders
// ==========================================================================

export function useArchiveFolders(familyId: string | undefined, memberId?: string) {
  return useQuery({
    queryKey: ['archive-folders', familyId, memberId],
    queryFn: async () => {
      if (!familyId) return { folders: [] as ArchiveFolder[], tree: [] as ArchiveFolderNode[] }

      let query = supabase
        .from('archive_folders')
        .select('*')
        .eq('family_id', familyId)
        .order('sort_order', { ascending: true })
        .order('folder_name', { ascending: true })

      if (memberId) {
        query = query.eq('member_id', memberId)
      }

      const { data, error } = await query

      if (error) throw error
      const folders = (data ?? []) as ArchiveFolder[]
      return {
        folders,
        tree: buildFolderTree(folders),
      }
    },
    enabled: !!familyId,
  })
}

export function useCreateArchiveFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (folder: {
      family_id: string
      member_id?: string | null
      folder_name: string
      parent_folder_id?: string | null
      folder_type?: string
      icon?: string | null
      color_hex?: string | null
      description?: string | null
    }) => {
      const { data, error } = await supabase
        .from('archive_folders')
        .insert(folder)
        .select()
        .single()

      if (error) throw error
      return data as ArchiveFolder
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['archive-folders', data.family_id] })
    },
  })
}

export function useUpdateArchiveFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, familyId, ...updates }: Partial<ArchiveFolder> & { id: string; familyId: string }) => {
      const { data, error } = await supabase
        .from('archive_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, familyId } as ArchiveFolder & { familyId: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['archive-folders', data.familyId] })
    },
  })
}

/** Delete a custom folder — reassigns items to parent folder, then deletes the folder row */
export function useDeleteArchiveFolder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, familyId, parentFolderId }: { id: string; familyId: string; parentFolderId: string | null }) => {
      // Move items from this folder to its parent (or null if root-level custom folder)
      const { error: moveError } = await supabase
        .from('archive_context_items')
        .update({ folder_id: parentFolderId })
        .eq('folder_id', id)

      if (moveError) throw moveError

      // Move child folders up to the parent
      const { error: reparentError } = await supabase
        .from('archive_folders')
        .update({ parent_folder_id: parentFolderId })
        .eq('parent_folder_id', id)

      if (reparentError) throw reparentError

      // Delete the folder itself
      const { error } = await supabase
        .from('archive_folders')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { familyId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['archive-folders', data.familyId] })
      queryClient.invalidateQueries({ queryKey: ['archive-context-items'] })
    },
  })
}

// ==========================================================================
// useArchiveContextItems
// ==========================================================================

export function useArchiveContextItems(folderId: string | undefined) {
  return useQuery({
    queryKey: ['archive-context-items', folderId],
    queryFn: async () => {
      if (!folderId) return []

      const { data, error } = await supabase
        .from('archive_context_items')
        .select('*')
        .eq('folder_id', folderId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as ArchiveContextItem[]
    },
    enabled: !!folderId,
  })
}

export function useArchiveContextItemsByMember(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['archive-context-items-member', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []

      const { data, error } = await supabase
        .from('archive_context_items')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []) as ArchiveContextItem[]
    },
    enabled: !!familyId && !!memberId,
  })
}

export function useCreateArchiveContextItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: {
      family_id: string
      folder_id: string
      member_id?: string | null
      context_field?: string | null
      context_value: string
      context_type?: ArchiveContextType
      source?: ArchiveItemSource
      source_conversation_id?: string | null
      source_reference_id?: string | null
      added_by?: string | null
      is_privacy_filtered?: boolean
      link_url?: string | null
      price_range?: string | null
    }) => {
      const { data, error } = await supabase
        .from('archive_context_items')
        .insert({
          context_type: 'general',
          source: 'manual',
          ...item,
        })
        .select()
        .single()

      if (error) throw error
      return data as ArchiveContextItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['archive-context-items', data.folder_id] })
      queryClient.invalidateQueries({ queryKey: ['archive-context-items-member'] })
      queryClient.invalidateQueries({ queryKey: ['archive-members'] })
    },
  })
}

export function useUpdateArchiveContextItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ArchiveContextItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('archive_context_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ArchiveContextItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['archive-context-items', data.folder_id] })
      queryClient.invalidateQueries({ queryKey: ['archive-context-items-member'] })
      queryClient.invalidateQueries({ queryKey: ['archive-members'] })
    },
  })
}

export function useArchiveContextItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string }) => {
      const { error } = await supabase
        .from('archive_context_items')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      return folderId
    },
    onSuccess: (folderId) => {
      queryClient.invalidateQueries({ queryKey: ['archive-context-items', folderId] })
      queryClient.invalidateQueries({ queryKey: ['archive-context-items-member'] })
      queryClient.invalidateQueries({ queryKey: ['archive-members'] })
    },
  })
}

export function useToggleArchiveItemAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, folderId, included }: { id: string; folderId: string; included: boolean }) => {
      const { error } = await supabase
        .from('archive_context_items')
        .update({ is_included_in_ai: included })
        .eq('id', id)

      if (error) throw error
      return folderId
    },
    onSuccess: (folderId) => {
      queryClient.invalidateQueries({ queryKey: ['archive-context-items', folderId] })
      queryClient.invalidateQueries({ queryKey: ['archive-context-items-member'] })
    },
  })
}

// ==========================================================================
// useArchiveMemberSettings
// ==========================================================================

export function useArchiveMemberSettings(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['archive-member-settings', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return null

      const { data, error } = await supabase
        .from('archive_member_settings')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .maybeSingle()

      if (error) throw error
      return data as ArchiveMemberSettings | null
    },
    enabled: !!familyId && !!memberId,
  })
}

export function useToggleMemberPersonLevel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      familyId,
      memberId,
      included,
    }: {
      familyId: string
      memberId: string
      included: boolean
    }) => {
      // Upsert: create if not exists, update if exists
      const { error } = await supabase
        .from('archive_member_settings')
        .upsert(
          {
            family_id: familyId,
            member_id: memberId,
            is_included_in_ai: included,
          },
          { onConflict: 'family_id,member_id' }
        )

      if (error) throw error
      return { familyId, memberId }
    },
    onSuccess: ({ familyId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['archive-member-settings', familyId, memberId] })
      queryClient.invalidateQueries({ queryKey: ['archive-members', familyId] })
    },
  })
}

export function useUpdateOverviewCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      familyId,
      memberId,
      content,
    }: {
      familyId: string
      memberId: string
      content: string
    }) => {
      const { error } = await supabase
        .from('archive_member_settings')
        .upsert(
          {
            family_id: familyId,
            member_id: memberId,
            overview_card_content: content,
            overview_card_updated_at: new Date().toISOString(),
          },
          { onConflict: 'family_id,member_id' }
        )

      if (error) throw error
      return { familyId, memberId }
    },
    onSuccess: ({ familyId, memberId }) => {
      queryClient.invalidateQueries({ queryKey: ['archive-member-settings', familyId, memberId] })
    },
  })
}

// ==========================================================================
// useArchiveMembers
// ==========================================================================

export function useArchiveMembers(familyId: string | undefined) {
  return useQuery({
    queryKey: ['archive-members', familyId],
    queryFn: async () => {
      if (!familyId) return []

      // Fetch family members
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('id, display_name, role, avatar_url')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .order('display_name', { ascending: true })

      if (membersError) throw membersError
      if (!members || members.length === 0) return []

      // Fetch archive_member_settings for all members
      const { data: settings, error: settingsError } = await supabase
        .from('archive_member_settings')
        .select('member_id, is_included_in_ai')
        .eq('family_id', familyId)

      if (settingsError) throw settingsError

      const settingsMap = new Map(
        (settings ?? []).map((s: { member_id: string; is_included_in_ai: boolean }) => [s.member_id, s.is_included_in_ai])
      )

      const memberIds = members.map((m: { id: string }) => m.id)

      // Count archive_context_items per member (standalone items)
      const { data: contextCounts, error: contextError } = await supabase
        .from('archive_context_items')
        .select('member_id')
        .eq('family_id', familyId)
        .in('member_id', memberIds)
        .is('archived_at', null)

      if (contextError) throw contextError

      const contextCountMap = new Map<string, number>()
      for (const row of contextCounts ?? []) {
        const mid = (row as { member_id: string }).member_id
        contextCountMap.set(mid, (contextCountMap.get(mid) ?? 0) + 1)
      }

      // Count aggregated source entries per member: self_knowledge
      const { data: skCounts, error: skError } = await supabase
        .from('self_knowledge')
        .select('member_id')
        .in('member_id', memberIds)
        .is('archived_at', null)

      if (skError) throw skError

      const skCountMap = new Map<string, number>()
      for (const row of skCounts ?? []) {
        const mid = (row as { member_id: string }).member_id
        skCountMap.set(mid, (skCountMap.get(mid) ?? 0) + 1)
      }

      // Count aggregated: guiding_stars
      const { data: gsCounts, error: gsError } = await supabase
        .from('guiding_stars')
        .select('member_id')
        .in('member_id', memberIds)
        .is('archived_at', null)

      if (gsError) throw gsError

      const gsCountMap = new Map<string, number>()
      for (const row of gsCounts ?? []) {
        const mid = (row as { member_id: string }).member_id
        gsCountMap.set(mid, (gsCountMap.get(mid) ?? 0) + 1)
      }

      // Count aggregated: best_intentions
      const { data: biCounts, error: biError } = await supabase
        .from('best_intentions')
        .select('member_id')
        .in('member_id', memberIds)
        .is('archived_at', null)

      if (biError) throw biError

      const biCountMap = new Map<string, number>()
      for (const row of biCounts ?? []) {
        const mid = (row as { member_id: string }).member_id
        biCountMap.set(mid, (biCountMap.get(mid) ?? 0) + 1)
      }

      // Assemble summaries
      const summaries: ArchiveMemberSummary[] = members.map(
        (m: { id: string; display_name: string; role: string; avatar_url: string | null }) => {
          const archiveCount = contextCountMap.get(m.id) ?? 0
          const skCount = skCountMap.get(m.id) ?? 0
          const gsCount = gsCountMap.get(m.id) ?? 0
          const biCount = biCountMap.get(m.id) ?? 0
          const total = archiveCount + skCount + gsCount + biCount

          return {
            member_id: m.id,
            display_name: m.display_name,
            role: m.role,
            avatar_url: m.avatar_url,
            is_included_in_ai: settingsMap.get(m.id) ?? true,
            total_insights: total,
            active_insights: total, // All non-archived are active
            folder_previews: [], // Populated by UI if needed
          }
        }
      )

      return summaries
    },
    enabled: !!familyId,
  })
}

// ==========================================================================
// useFaithPreferences
// ==========================================================================

export function useFaithPreferences(familyId: string | undefined) {
  return useQuery({
    queryKey: ['faith-preferences', familyId],
    queryFn: async () => {
      if (!familyId) return null

      const { data, error } = await supabase
        .from('faith_preferences')
        .select('*')
        .eq('family_id', familyId)
        .maybeSingle()

      if (error) throw error
      return data as FaithPreferences | null
    },
    enabled: !!familyId,
  })
}

export function useSaveFaithPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (prefs: Partial<FaithPreferences> & { family_id: string }) => {
      const { data, error } = await supabase
        .from('faith_preferences')
        .upsert(prefs, { onConflict: 'family_id' })
        .select()
        .single()

      if (error) throw error
      return data as FaithPreferences
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faith-preferences', data.family_id] })
    },
  })
}

// ==========================================================================
// useArchiveAggregation — "checked somewhere, checked everywhere"
// ==========================================================================

export interface AggregatedSourceGroup {
  source_table: string
  source_label: string
  view_link: string
  entries: AggregatedContextEntry[]
  total: number
  included_count: number
}

export function useArchiveAggregation(familyId: string | undefined, memberId: string | undefined) {
  return useQuery({
    queryKey: ['archive-aggregation', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []

      const groups: AggregatedSourceGroup[] = []

      // 1. self_knowledge
      const { data: skData, error: skError } = await supabase
        .from('self_knowledge')
        .select('id, content, category, is_included_in_ai')
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (skError) throw skError

      if (skData && skData.length > 0) {
        groups.push({
          source_table: 'self_knowledge',
          source_label: 'InnerWorkings',
          view_link: '/inner-workings',
          total: skData.length,
          included_count: skData.filter((e) => e.is_included_in_ai).length,
          entries: skData.map((e) => ({
            id: e.id,
            content: e.content,
            source_table: 'self_knowledge',
            source_feature: 'InnerWorkings',
            category: e.category ?? undefined,
            is_included_in_ai: e.is_included_in_ai,
            view_link: '/inner-workings',
          })),
        })
      }

      // 2. guiding_stars
      const { data: gsData, error: gsError } = await supabase
        .from('guiding_stars')
        .select('id, content, entry_type, category, is_included_in_ai')
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })

      if (gsError) throw gsError

      if (gsData && gsData.length > 0) {
        groups.push({
          source_table: 'guiding_stars',
          source_label: 'Guiding Stars',
          view_link: '/guiding-stars',
          total: gsData.length,
          included_count: gsData.filter((e) => e.is_included_in_ai).length,
          entries: gsData.map((e) => ({
            id: e.id,
            content: e.content,
            source_table: 'guiding_stars',
            source_feature: 'Guiding Stars',
            category: e.category ?? e.entry_type ?? undefined,
            is_included_in_ai: e.is_included_in_ai,
            view_link: '/guiding-stars',
          })),
        })
      }

      // 3. best_intentions
      const { data: biData, error: biError } = await supabase
        .from('best_intentions')
        .select('id, statement, tags, is_included_in_ai')
        .eq('member_id', memberId)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })

      if (biError) throw biError

      if (biData && biData.length > 0) {
        groups.push({
          source_table: 'best_intentions',
          source_label: 'Best Intentions',
          view_link: '/guiding-stars',
          total: biData.length,
          included_count: biData.filter((e) => e.is_included_in_ai).length,
          entries: biData.map((e) => ({
            id: e.id,
            content: e.statement,
            source_table: 'best_intentions',
            source_feature: 'Best Intentions',
            is_included_in_ai: e.is_included_in_ai,
            view_link: '/guiding-stars',
          })),
        })
      }

      return groups
    },
    enabled: !!familyId && !!memberId,
  })
}

/**
 * Toggle is_included_in_ai on the SOURCE table — "checked somewhere, checked everywhere".
 * When an InnerWorkings entry appears in Archives and user toggles the heart,
 * this writes back to self_knowledge, guiding_stars, or best_intentions directly.
 */
export function useToggleAggregatedAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sourceTable,
      id,
      memberId,
      included,
    }: {
      sourceTable: 'self_knowledge' | 'guiding_stars' | 'best_intentions'
      id: string
      memberId: string
      included: boolean
    }) => {
      const { error } = await supabase
        .from(sourceTable)
        .update({ is_included_in_ai: included })
        .eq('id', id)

      if (error) throw error
      return { sourceTable, memberId }
    },
    onSuccess: ({ sourceTable, memberId }) => {
      // Invalidate both the source feature queries and the archive aggregation
      queryClient.invalidateQueries({ queryKey: ['archive-aggregation'] })
      queryClient.invalidateQueries({ queryKey: ['archive-members'] })

      // Invalidate the source feature's own query keys
      if (sourceTable === 'self_knowledge') {
        queryClient.invalidateQueries({ queryKey: ['self-knowledge', memberId] })
      } else if (sourceTable === 'guiding_stars') {
        queryClient.invalidateQueries({ queryKey: ['guiding-stars', memberId] })
      } else if (sourceTable === 'best_intentions') {
        queryClient.invalidateQueries({ queryKey: ['best-intentions', memberId] })
      }
    },
  })
}

// ==========================================================================
// useFamilyOverview
// ==========================================================================

export function useFamilyOverview(familyId: string | undefined) {
  return useQuery({
    queryKey: ['archive-family-overview', familyId],
    queryFn: async () => {
      if (!familyId) return { sections: [] as FamilyOverviewSection[], familyStars: [] }

      // Fetch family overview folders
      const { data: folders, error: foldersError } = await supabase
        .from('archive_folders')
        .select('*')
        .eq('family_id', familyId)
        .eq('folder_type', 'family_overview')
        .order('sort_order', { ascending: true })

      if (foldersError) throw foldersError

      // Fetch items for each folder
      const sections: FamilyOverviewSection[] = []
      for (const folder of (folders ?? []) as ArchiveFolder[]) {
        const { data: items, error: itemsError } = await supabase
          .from('archive_context_items')
          .select('*')
          .eq('folder_id', folder.id)
          .is('archived_at', null)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })

        if (itemsError) throw itemsError

        sections.push({
          folder,
          items: (items ?? []) as ArchiveContextItem[],
          aggregated: [],
        })
      }

      // Fetch family-level guiding stars (owner_type='family')
      const { data: familyStars, error: starsError } = await supabase
        .from('guiding_stars')
        .select('*')
        .eq('family_id', familyId)
        .eq('owner_type', 'family')
        .is('archived_at', null)
        .order('sort_order', { ascending: true })

      if (starsError) throw starsError

      return {
        sections,
        familyStars: familyStars ?? [],
      }
    },
    enabled: !!familyId,
  })
}

// ==========================================================================
// usePrivacyFiltered
// ==========================================================================

export interface PrivacyFilteredGroup {
  member_id: string
  member_name: string
  items: ArchiveContextItem[]
}

export function usePrivacyFiltered(familyId: string | undefined) {
  return useQuery({
    queryKey: ['archive-privacy-filtered', familyId],
    queryFn: async () => {
      if (!familyId) return []

      const { data: items, error: itemsError } = await supabase
        .from('archive_context_items')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_privacy_filtered', true)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError
      if (!items || items.length === 0) return []

      // Collect unique member_ids
      const memberIds = [...new Set((items as ArchiveContextItem[]).map((i) => i.member_id).filter(Boolean))] as string[]

      // Fetch member names
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('id, display_name')
        .in('id', memberIds)

      if (membersError) throw membersError

      const nameMap = new Map(
        (members ?? []).map((m: { id: string; display_name: string }) => [m.id, m.display_name])
      )

      // Group by member
      const groupMap = new Map<string, PrivacyFilteredGroup>()
      for (const item of items as ArchiveContextItem[]) {
        const mid = item.member_id ?? 'unknown'
        if (!groupMap.has(mid)) {
          groupMap.set(mid, {
            member_id: mid,
            member_name: nameMap.get(mid) ?? 'Unknown',
            items: [],
          })
        }
        groupMap.get(mid)!.items.push(item)
      }

      return Array.from(groupMap.values())
    },
    enabled: !!familyId,
  })
}

export function useMoveToArchive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, folderId }: { itemId: string; folderId: string }) => {
      const { error } = await supabase
        .from('archive_context_items')
        .update({
          folder_id: folderId,
          is_privacy_filtered: false,
        })
        .eq('id', itemId)

      if (error) throw error
      return { itemId, folderId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive-privacy-filtered'] })
      queryClient.invalidateQueries({ queryKey: ['archive-context-items'] })
      queryClient.invalidateQueries({ queryKey: ['archive-members'] })
    },
  })
}

// ==========================================================================
// useContextExport — generates Markdown exports
// ==========================================================================

export function useContextExport(familyId: string | undefined) {
  const exportByFolder = useCallback(
    async (folderId: string): Promise<string> => {
      if (!familyId) return ''

      const { data: folder, error: folderError } = await supabase
        .from('archive_folders')
        .select('folder_name')
        .eq('id', folderId)
        .single()

      if (folderError) throw folderError

      const { data: items, error: itemsError } = await supabase
        .from('archive_context_items')
        .select('context_field, context_value, context_type, is_included_in_ai')
        .eq('folder_id', folderId)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError

      let md = `## ${folder?.folder_name ?? 'Folder'}\n\n`
      for (const item of (items ?? []) as Pick<ArchiveContextItem, 'context_field' | 'context_value' | 'context_type' | 'is_included_in_ai'>[]) {
        const aiTag = item.is_included_in_ai ? '' : ' [excluded from LiLa]'
        const label = item.context_field ? `**${item.context_field}:** ` : ''
        md += `- ${label}${item.context_value}${aiTag}\n`
      }

      return md
    },
    [familyId]
  )

  const exportByMember = useCallback(
    async (memberId: string): Promise<string> => {
      if (!familyId) return ''

      // Get member name
      const { data: member } = await supabase
        .from('family_members')
        .select('display_name')
        .eq('id', memberId)
        .single()

      // Get folders for this member
      const { data: folders, error: foldersError } = await supabase
        .from('archive_folders')
        .select('id, folder_name')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .order('sort_order', { ascending: true })

      if (foldersError) throw foldersError

      let md = `# ${member?.display_name ?? 'Member'} — Context Export\n\n`

      for (const folder of (folders ?? []) as { id: string; folder_name: string }[]) {
        const folderMd = await exportByFolder(folder.id)
        md += folderMd + '\n'
      }

      // Also include aggregated sources
      const { data: skData } = await supabase
        .from('self_knowledge')
        .select('content, category, is_included_in_ai')
        .eq('member_id', memberId)
        .is('archived_at', null)

      if (skData && skData.length > 0) {
        md += `## InnerWorkings\n\n`
        for (const entry of skData) {
          const aiTag = entry.is_included_in_ai ? '' : ' [excluded from LiLa]'
          const cat = entry.category ? `[${entry.category}] ` : ''
          md += `- ${cat}${entry.content}${aiTag}\n`
        }
        md += '\n'
      }

      const { data: gsData } = await supabase
        .from('guiding_stars')
        .select('content, entry_type, is_included_in_ai')
        .eq('member_id', memberId)
        .is('archived_at', null)

      if (gsData && gsData.length > 0) {
        md += `## Guiding Stars\n\n`
        for (const entry of gsData) {
          const aiTag = entry.is_included_in_ai ? '' : ' [excluded from LiLa]'
          const type = entry.entry_type ? `[${entry.entry_type}] ` : ''
          md += `- ${type}${entry.content}${aiTag}\n`
        }
        md += '\n'
      }

      const { data: biData } = await supabase
        .from('best_intentions')
        .select('statement, is_included_in_ai')
        .eq('member_id', memberId)
        .is('archived_at', null)

      if (biData && biData.length > 0) {
        md += `## Best Intentions\n\n`
        for (const entry of biData) {
          const aiTag = entry.is_included_in_ai ? '' : ' [excluded from LiLa]'
          md += `- ${entry.statement}${aiTag}\n`
        }
        md += '\n'
      }

      return md
    },
    [familyId, exportByFolder]
  )

  const exportAll = useCallback(async (): Promise<string> => {
    if (!familyId) return ''

    // Get all active members
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('id, display_name')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('display_name', { ascending: true })

    if (membersError) throw membersError

    let md = `# Family Context Export\n\nGenerated: ${new Date().toLocaleDateString()}\n\n`

    for (const member of (members ?? []) as { id: string; display_name: string }[]) {
      const memberMd = await exportByMember(member.id)
      md += memberMd + '\n---\n\n'
    }

    return md
  }, [familyId, exportByMember])

  return { exportAll, exportByMember, exportByFolder }
}
