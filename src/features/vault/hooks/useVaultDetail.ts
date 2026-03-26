import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { VaultItem } from './useVaultBrowse'

export interface PromptEntry {
  id: string
  vault_item_id: string
  title: string
  prompt_text: string
  variable_placeholders: string[]
  example_outputs: string[]
  reference_images: string[]
  tags: string[]
  sort_order: number
}

export interface CollectionChild {
  id: string
  item_id: string
  sort_order: number
  item: VaultItem
}

export function useVaultDetail(itemId: string | null, memberId: string | null) {
  const [item, setItem] = useState<VaultItem | null>(null)
  const [promptEntries, setPromptEntries] = useState<PromptEntry[]>([])
  const [collectionItems, setCollectionItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch item detail
  useEffect(() => {
    if (!itemId) { setItem(null); return }
    setLoading(true)
    supabase
      .from('vault_items')
      .select('*')
      .eq('id', itemId)
      .single()
      .then(({ data }) => {
        if (data) setItem(data as VaultItem)
        setLoading(false)
      })
  }, [itemId])

  // Fetch prompt entries for prompt_pack content type
  useEffect(() => {
    if (!item || item.content_type !== 'prompt_pack') { setPromptEntries([]); return }
    supabase
      .from('vault_prompt_entries')
      .select('*')
      .eq('vault_item_id', item.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setPromptEntries(data)
      })
  }, [item?.id, item?.content_type])

  // Fetch collection items for curation content type
  useEffect(() => {
    if (!item || item.content_type !== 'curation') { setCollectionItems([]); return }
    supabase
      .from('vault_collection_items')
      .select('item_id, sort_order')
      .eq('collection_id', item.id)
      .order('sort_order')
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setCollectionItems([]); return }
        const ids = data.map(d => d.item_id)
        const { data: items } = await supabase
          .from('vault_items')
          .select('*')
          .in('id', ids)
          .eq('status', 'published')
        if (items) {
          // Sort by collection sort_order
          const orderMap = new Map(data.map(d => [d.item_id, d.sort_order]))
          items.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0))
          setCollectionItems(items as VaultItem[])
        }
      })
  }, [item?.id, item?.content_type])

  // Track progress: mark as in_progress on first view
  useEffect(() => {
    if (!item || !memberId) return
    supabase
      .from('vault_user_progress')
      .upsert({
        user_id: memberId,
        vault_item_id: item.id,
        progress_status: 'in_progress',
        last_accessed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,vault_item_id' })
      .then(() => {})

    // Increment view_count (fire-and-forget, RPC may not exist yet)
    supabase.rpc('increment_vault_view_count', { item_id: item.id }).then(() => {})
  }, [item?.id, memberId])

  // Update progress percent
  const updateProgress = useCallback(async (percent: number) => {
    if (!item || !memberId) return
    const isComplete = percent >= 100
    await supabase
      .from('vault_user_progress')
      .upsert({
        user_id: memberId,
        vault_item_id: item.id,
        progress_status: isComplete ? 'completed' : 'in_progress',
        progress_percent: Math.min(percent, 100),
        last_accessed_at: new Date().toISOString(),
        ...(isComplete ? { completed_at: new Date().toISOString() } : {}),
      }, { onConflict: 'user_id,vault_item_id' })
  }, [item?.id, memberId])

  return { item, promptEntries, collectionItems, loading, updateProgress }
}
