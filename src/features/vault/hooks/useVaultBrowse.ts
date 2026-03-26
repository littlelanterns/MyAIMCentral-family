import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface VaultCategory {
  id: string
  slug: string
  display_name: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
}

export interface VaultItem {
  id: string
  display_title: string
  detail_title: string | null
  short_description: string
  full_description: string | null
  content_type: string
  prompt_format: string | null
  delivery_method: string | null
  category_id: string
  difficulty: string
  tags: string[]
  thumbnail_url: string | null
  preview_image_url: string | null
  status: string
  is_featured: boolean
  teen_visible: boolean
  allowed_tiers: string[]
  display_order: number
  view_count: number
  estimated_minutes: number | null
  created_at: string
  // Content body
  content_body: string | null
  content_url: string | null
  // Tool-specific
  tool_url: string | null
  guided_mode_key: string | null
  platform: string | null
  target_platforms: string[]
  auth_provider: string | null
  requires_auth: boolean
  // LiLa optimization
  enable_lila_optimization: boolean
  lila_optimization_prompt: string | null
  // Tool portal
  portal_description: string | null
  portal_tips: string[]
  prerequisites_text: string | null
  learning_outcomes: string[]
  // Engagement (PRD-21C future)
  heart_count: number
  comment_count: number
  // Progress (joined)
  progress_status?: string
  progress_percent?: number
  last_accessed_at?: string
  // Bookmark (joined)
  is_bookmarked?: boolean
  // NEW badge
  first_seen_at?: string | null
  new_badge_duration_days: number
}

interface Filters {
  contentType: string | null
  difficulty: string | null
  bookmarksOnly: boolean
}

export function useVaultBrowse(memberId: string | null) {
  const [categories, setCategories] = useState<VaultCategory[]>([])
  const [allItems, setAllItems] = useState<VaultItem[]>([])
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set())
  const [progressMap, setProgressMap] = useState<Record<string, { status: string; percent: number; last_accessed_at: string | null }>>({})
  const [sightingsMap, setSightingsMap] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({ contentType: null, difficulty: null, bookmarksOnly: false })
  const [loading, setLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<VaultItem[]>([])

  // Load categories
  useEffect(() => {
    supabase
      .from('vault_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [])

  // Load all published items
  useEffect(() => {
    supabase
      .from('vault_items')
      .select('*')
      .eq('status', 'published')
      .order('display_order')
      .then(({ data }) => {
        if (data) setAllItems(data as VaultItem[])
        setLoading(false)
      })
  }, [])

  // Load bookmarks
  useEffect(() => {
    if (!memberId) return
    supabase
      .from('vault_user_bookmarks')
      .select('vault_item_id')
      .eq('user_id', memberId)
      .then(({ data }) => {
        if (data) setBookmarkIds(new Set(data.map(b => b.vault_item_id)))
      })
  }, [memberId])

  // Load progress
  useEffect(() => {
    if (!memberId) return
    supabase
      .from('vault_user_progress')
      .select('vault_item_id, progress_status, progress_percent, last_accessed_at')
      .eq('user_id', memberId)
      .then(({ data }) => {
        if (data) {
          const map: typeof progressMap = {}
          data.forEach(p => {
            map[p.vault_item_id] = { status: p.progress_status, percent: p.progress_percent, last_accessed_at: p.last_accessed_at }
          })
          setProgressMap(map)
        }
      })
  }, [memberId])

  // Load first sightings for NEW badge
  useEffect(() => {
    if (!memberId) return
    supabase
      .from('vault_first_sightings')
      .select('vault_item_id, first_seen_at')
      .eq('user_id', memberId)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {}
          data.forEach(s => { map[s.vault_item_id] = s.first_seen_at })
          setSightingsMap(map)
        }
      })
  }, [memberId])

  // Enrich items with user data
  const enrichedItems = useMemo(() => {
    return allItems.map(item => ({
      ...item,
      is_bookmarked: bookmarkIds.has(item.id),
      progress_status: progressMap[item.id]?.status,
      progress_percent: progressMap[item.id]?.percent,
      last_accessed_at: progressMap[item.id]?.last_accessed_at ?? undefined,
      first_seen_at: sightingsMap[item.id] ?? null,
    }))
  }, [allItems, bookmarkIds, progressMap, sightingsMap])

  // Items by category
  const itemsByCategory = useMemo(() => {
    const map: Record<string, VaultItem[]> = {}
    enrichedItems.forEach(item => {
      if (!map[item.category_id]) map[item.category_id] = []
      map[item.category_id].push(item)
    })
    return map
  }, [enrichedItems])

  // Featured items (hero spotlight)
  const featuredItems = useMemo(() => enrichedItems.filter(i => i.is_featured), [enrichedItems])

  // Continue Learning (in-progress items)
  const continueItems = useMemo(() =>
    enrichedItems
      .filter(i => i.progress_status === 'in_progress')
      .sort((a, b) => {
        const aTime = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0
        const bTime = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0
        return bTime - aTime
      }),
    [enrichedItems]
  )

  // Search & filter
  useEffect(() => {
    if (!searchQuery && !filters.contentType && !filters.difficulty && !filters.bookmarksOnly) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      let results = [...enrichedItems]

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        results = results.filter(item =>
          item.display_title.toLowerCase().includes(q) ||
          (item.detail_title && item.detail_title.toLowerCase().includes(q)) ||
          item.short_description.toLowerCase().includes(q) ||
          (item.full_description && item.full_description.toLowerCase().includes(q)) ||
          item.tags.some(t => t.toLowerCase().includes(q))
        )
      }

      if (filters.contentType) {
        results = results.filter(i => i.content_type === filters.contentType)
      }
      if (filters.difficulty) {
        results = results.filter(i => i.difficulty === filters.difficulty)
      }
      if (filters.bookmarksOnly) {
        results = results.filter(i => i.is_bookmarked)
      }

      setSearchResults(results)
      setIsSearching(false)
    }, 300) // debounce

    return () => clearTimeout(timer)
  }, [searchQuery, filters, enrichedItems])

  // Record first sightings for items not yet seen
  useEffect(() => {
    if (!memberId || allItems.length === 0) return
    const unseen = allItems.filter(item => !sightingsMap[item.id])
    if (unseen.length === 0) return

    const rows = unseen.map(item => ({ user_id: memberId, vault_item_id: item.id }))
    supabase.from('vault_first_sightings').upsert(rows, { onConflict: 'user_id,vault_item_id', ignoreDuplicates: true }).then(() => {
      // Update local state
      const newMap = { ...sightingsMap }
      unseen.forEach(item => { newMap[item.id] = new Date().toISOString() })
      setSightingsMap(newMap)
    })
  }, [memberId, allItems, sightingsMap])

  return {
    categories,
    itemsByCategory,
    featuredItems,
    continueItems,
    searchResults,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    isSearching,
    loading,
  }
}
