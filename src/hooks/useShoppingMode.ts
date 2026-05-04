/**
 * useShoppingMode — Shopping Mode data hooks (PRD-09B Enhancement)
 *
 * Shopping Mode is a composed READ view over existing list data.
 * It aggregates items across multiple shopping lists, filtered by store.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { List, ListItem, ShoppingModeItem } from '@/types/lists'
import { ANYWHERE_STORE_TAG } from '@/types/lists'

// ── Helpers ──────────────────────────────────────────────────

function extractStoresFromItems(items: ListItem[]): string[] {
  const stores = new Set<string>()
  for (const item of items) {
    if (item.store_tags && item.store_tags.length > 0) {
      for (const tag of item.store_tags) {
        if (tag !== ANYWHERE_STORE_TAG) stores.add(tag)
      }
    }
    if (item.section_name) {
      stores.add(item.section_name)
    }
  }
  return [...stores].sort()
}

function itemMatchesStore(item: ListItem, store: string): boolean {
  // store_tags takes precedence if present
  if (item.store_tags && item.store_tags.length > 0) {
    return (
      item.store_tags.includes(store) ||
      item.store_tags.includes(ANYWHERE_STORE_TAG)
    )
  }
  // Fallback: backward-compatible section_name match, or no section (show at all stores)
  if (!item.section_name) return true
  return item.section_name === store
}

// ── useShoppingModeStores ────────────────────────────────────

export function useShoppingModeStores(
  familyId: string | undefined,
  memberId: string | undefined,
) {
  return useQuery({
    queryKey: ['shopping-mode-stores', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return { stores: [] as string[], recentStores: [] as string[] }

      // Load all shopping lists included in shopping mode
      const { data: lists, error: listsErr } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('list_type', 'shopping')
        .eq('include_in_shopping_mode', true)
        .is('archived_at', null)

      if (listsErr) throw listsErr
      if (!lists || lists.length === 0) return { stores: [], recentStores: [] }

      // Also include shared lists the member can access
      const { data: shares } = await supabase
        .from('list_shares')
        .select('list_id')
        .eq('shared_with', memberId)
        .or('is_hidden.eq.false,is_hidden.is.null')

      const sharedIds = new Set((shares ?? []).map(s => s.list_id))
      const listIds = [...new Set([
        ...lists.map(l => l.id),
        ...sharedIds,
      ])]

      // Load unchecked items from those lists
      const { data: items, error: itemsErr } = await supabase
        .from('list_items')
        .select('store_tags, section_name, checked_at')
        .in('list_id', listIds)
        .is('archived_at', null)

      if (itemsErr) throw itemsErr
      const allItems = (items ?? []) as Pick<ListItem, 'store_tags' | 'section_name' | 'checked_at'>[]

      const stores = extractStoresFromItems(allItems as ListItem[])

      // Recent stores: those with items checked in the last 7 days
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const recentStoreSet = new Set<string>()
      for (const item of allItems) {
        if (item.checked_at && new Date(item.checked_at).getTime() >= sevenDaysAgo) {
          if (item.store_tags && item.store_tags.length > 0) {
            for (const tag of item.store_tags) {
              if (tag !== ANYWHERE_STORE_TAG) recentStoreSet.add(tag)
            }
          }
          if (item.section_name) {
            recentStoreSet.add(item.section_name)
          }
        }
      }

      return {
        stores,
        recentStores: [...recentStoreSet].sort(),
      }
    },
    enabled: !!familyId && !!memberId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// ── useShoppingModeItems ─────────────────────────────────────

export function useShoppingModeItems(
  familyId: string | undefined,
  memberId: string | undefined,
  selectedStore: string | null,
) {
  return useQuery({
    queryKey: ['shopping-mode-items', familyId, memberId, selectedStore],
    queryFn: async (): Promise<ShoppingModeItem[]> => {
      if (!familyId || !memberId || !selectedStore) return []

      // Load all shopping lists included in shopping mode
      const { data: lists, error: listsErr } = await supabase
        .from('lists')
        .select('id, title, owner_id, is_shared, default_checked_visibility_hours')
        .eq('family_id', familyId)
        .eq('list_type', 'shopping')
        .eq('include_in_shopping_mode', true)
        .is('archived_at', null)

      if (listsErr) throw listsErr
      if (!lists || lists.length === 0) return []

      // Also include shared shopping lists
      const { data: shares } = await supabase
        .from('list_shares')
        .select('list_id')
        .eq('shared_with', memberId)
        .or('is_hidden.eq.false,is_hidden.is.null')

      const sharedIds = new Set((shares ?? []).map(s => s.list_id))
      const listsMap = new Map<string, Pick<List, 'id' | 'title' | 'owner_id' | 'is_shared'> & { default_checked_visibility_hours: number }>()

      for (const l of lists) {
        listsMap.set(l.id, l as typeof lists[0])
      }
      // Add shared lists that are shopping lists and included in shopping mode
      if (sharedIds.size > 0) {
        const sharedIdsArr = [...sharedIds].filter(id => !listsMap.has(id))
        if (sharedIdsArr.length > 0) {
          const { data: sharedLists } = await supabase
            .from('lists')
            .select('id, title, owner_id, is_shared, default_checked_visibility_hours')
            .in('id', sharedIdsArr)
            .eq('list_type', 'shopping')
            .eq('include_in_shopping_mode', true)
            .is('archived_at', null)
          if (sharedLists) {
            for (const sl of sharedLists) {
              listsMap.set(sl.id, sl as typeof lists[0])
            }
          }
        }
      }

      const allListIds = [...listsMap.keys()]
      if (allListIds.length === 0) return []

      // Load all non-archived items from these lists
      const { data: items, error: itemsErr } = await supabase
        .from('list_items')
        .select('*')
        .in('list_id', allListIds)
        .is('archived_at', null)
        .order('sort_order')

      if (itemsErr) throw itemsErr
      if (!items || items.length === 0) return []

      const now = Date.now()
      const result: ShoppingModeItem[] = []

      for (const item of items as ListItem[]) {
        const listInfo = listsMap.get(item.list_id)
        if (!listInfo) continue

        // Filter: include unchecked items, or checked items still within visibility window
        if (item.checked && item.checked_at) {
          const visibilityHours = listInfo.default_checked_visibility_hours ?? 48
          const hoursSinceChecked = (now - new Date(item.checked_at).getTime()) / (1000 * 60 * 60)
          if (hoursSinceChecked > visibilityHours) continue
        }

        // Filter by store match
        if (!itemMatchesStore(item, selectedStore)) continue

        result.push({
          listItem: item,
          list: {
            id: listInfo.id,
            title: listInfo.title,
            owner_id: listInfo.owner_id,
            is_shared: listInfo.is_shared,
          },
          resolvedStore: selectedStore,
        })
      }

      return result
    },
    enabled: !!familyId && !!memberId && !!selectedStore,
    staleTime: 1000 * 30, // 30 seconds — items change frequently in shopping mode
  })
}
