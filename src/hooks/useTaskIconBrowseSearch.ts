/**
 * useTaskIconBrowseSearch — Build M Sub-phase B
 *
 * The BROWSE-focused search for TaskIconBrowser. Different concerns than
 * useTaskIconSuggestions (which is precision-focused for auto-suggest):
 *
 *   - Empty query → fetch ALL visual_schedule variant-B rows, ordered by
 *     display_name. Mom should be able to scroll the full library.
 *
 *   - Typed query → union of THREE searches, deduped:
 *     1. ILIKE on display_name + description (catches literal text like
 *        "scripture" that my canonical map doesn't know about)
 *     2. JSONB tag containment (exact tag match — same as before but as
 *        a supplement, not the only source)
 *     3. Embedding search via match_assets with a low threshold (0.3)
 *        for semantic siblings ("bedtime story" → "Book Read", etc.)
 *
 * Merge order prioritizes literal matches (text + tag) first, then fills
 * in semantic matches that weren't already in the literal set. This
 * ensures Mom ALWAYS sees exact matches before fuzzy ones.
 *
 * Not used by the inline auto-suggest picker — that path is
 * useTaskIconSuggestions and stays precision-focused.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TaskIconSuggestion } from '@/types/play-dashboard'

export interface UseTaskIconBrowseSearchResult {
  results: TaskIconSuggestion[]
  isLoading: boolean
  isFetching: boolean
}

export function useTaskIconBrowseSearch(
  query: string,
  enabled: boolean = true,
): UseTaskIconBrowseSearchResult {
  const trimmed = query.trim()

  const browseQuery = useQuery({
    queryKey: ['task-icon-browse', trimmed.toLowerCase()],
    queryFn: async () => {
      // ── Empty query → fetch ALL rows (all variants) ──
      // Browse is recall-focused: every variant of every subject should be
      // visible. The teeth brushing sequence has A (object), B (dark-skin
      // child), and C (lighter-skin child) variants per step — all are
      // useful and mom should be able to pick whichever works for her kid.
      // Inline auto-suggest stays precision-focused on variant B.
      if (trimmed.length === 0) {
        const { data, error } = await supabase
          .from('platform_assets')
          .select(
            'feature_key, variant, category, display_name, description, tags, size_512_url, size_128_url',
          )
          .eq('category', 'visual_schedule')
          .eq('status', 'active')
          .order('display_name', { ascending: true })
          .limit(1000)
        if (error) throw error
        return (data ?? []).map(rowToSuggestion)
      }

      // ── Typed query → run three searches in parallel, merge ──
      const pattern = `%${trimmed}%`
      const lowerTerm = trimmed.toLowerCase()

      // 1. ILIKE on display_name + description (catches literal text)
      const textPromise = supabase
        .from('platform_assets')
        .select(
          'feature_key, variant, category, display_name, description, tags, size_512_url, size_128_url',
        )
        .eq('category', 'visual_schedule')
        .eq('status', 'active')
        .or(`display_name.ilike.${pattern},description.ilike.${pattern}`)
        .limit(200)
        .then(res => (res.error ? [] : (res.data ?? []).map(rowToSuggestion)))

      // 2. JSONB tag contains the exact lowercased term
      const tagPromise = supabase
        .from('platform_assets')
        .select(
          'feature_key, variant, category, display_name, description, tags, size_512_url, size_128_url',
        )
        .eq('category', 'visual_schedule')
        .eq('status', 'active')
        .filter('tags', 'cs', JSON.stringify([lowerTerm]))
        .limit(200)
        .then(res => (res.error ? [] : (res.data ?? []).map(rowToSuggestion)))

      // 3. Embedding refine at a lower threshold for semantic siblings.
      //    Wrapped in try/catch so failure doesn't block the literal results.
      const embeddingPromise = (async () => {
        try {
          const embedRes = await supabase.functions.invoke(
            'generate-query-embedding',
            { body: { text: trimmed } },
          )
          if (embedRes.error || !embedRes.data?.embedding) return []
          const { data, error } = await supabase.rpc('match_assets', {
            query_embedding: embedRes.data.embedding,
            match_threshold: 0.3,
            match_count: 80,
            filter_category: 'visual_schedule',
            filter_status: 'active',
          })
          if (error) return []
          // Browse: keep ALL variants (A/B/C) — mom picks which image she wants
          const rows = (data ?? []) as Array<Record<string, unknown>>
          return rows.map(rowToSuggestion)
        } catch {
          return []
        }
      })()

      const [textResults, tagResults, embeddingResults] = await Promise.all([
        textPromise,
        tagPromise,
        embeddingPromise,
      ])

      // Merge with priority: literal text matches first, then literal tag
      // matches not already in text, then semantic matches not in either.
      const seen = new Set<string>()
      const merged: TaskIconSuggestion[] = []
      const add = (s: TaskIconSuggestion) => {
        const key = `${s.asset_key}::${s.variant}`
        if (seen.has(key)) return
        seen.add(key)
        merged.push(s)
      }
      for (const r of textResults) add(r)
      for (const r of tagResults) add(r)
      for (const r of embeddingResults) add(r)

      return merged
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  })

  return {
    results: browseQuery.data ?? [],
    isLoading: browseQuery.isLoading,
    isFetching: browseQuery.isFetching,
  }
}

/* ─────────────────────────────────────────────────────────────────────
 * Row → suggestion adapter (local copy to avoid cross-file coupling).
 * Identical shape to the one in useTaskIconSuggestions.
 * ───────────────────────────────────────────────────────────────────── */

function rowToSuggestion(
  row: Record<string, unknown>,
): TaskIconSuggestion {
  return {
    asset_key: row.feature_key as string,
    variant: ((row.variant as string) || 'B') as 'A' | 'B' | 'C',
    display_name: (row.display_name ??
      row.description ??
      row.feature_key) as string,
    description: (row.description ?? '') as string,
    tags: normalizeTags(row.tags),
    size_128_url: row.size_128_url as string,
    size_512_url: row.size_512_url as string,
  }
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === 'string')
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((t): t is string => typeof t === 'string')
      }
    } catch {
      return raw.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}
