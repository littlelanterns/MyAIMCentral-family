/**
 * useTaskIconSuggestions — Build M Sub-phase B (per feature decision §16.6b)
 *
 * Hybrid two-stage progressive enhancement:
 *
 *   Stage 1 — Instant tag search (no debounce, fires on every keystroke)
 *     • Pure DB query against platform_assets via searchVisualScheduleAssets
 *     • ~30ms, free, returns immediately
 *
 *   Stage 2 — Debounced (500ms) embedding refine
 *     • generate-query-embedding Edge Function → match_assets RPC
 *     • ~200-400ms, ~$0.00002 per call
 *     • Refines/replaces tag results with semantically smarter matches
 *
 * Merge rule: prefer embedding results when they exist, fall back to
 * tag results when embedding hasn't completed yet OR has failed silently.
 *
 * Edge cases:
 *   - Mom types fast: Stage 1 fires repeatedly, Stage 2 fires once on pause
 *   - Embedding service down: silent failure, tag results stay
 *   - Title <3 chars: both queries disabled
 *   - Cached: React Query serves identical inputs from cache
 *
 * Founder direction (Round 3 A3, 2026-04-07):
 *   "Tag search fires instantly as Mom types. Embedding search via match_assets()
 *    fires after 500ms debounce, refines/supplements the tag results. Mom sees
 *    images appear fast, then they improve a moment later. If the OpenAI
 *    embedding call fails, tag results remain. Both paths already exist."
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { supabase } from '@/lib/supabase/client'
import { extractTaskIconTags } from '@/lib/assets/extractTaskIconTags'
import type { TaskIconSuggestion } from '@/types/play-dashboard'

export interface UseTaskIconSuggestionsResult {
  /** Best current suggestions (embedding when available, tag results otherwise) */
  results: TaskIconSuggestion[]
  /** True while the instant tag query is in flight (rare — should be near-instant) */
  isLoading: boolean
  /** True while the debounced embedding refine is in flight */
  isRefining: boolean
  /** True if embedding stage produced results (UI can show a "smart match" indicator) */
  hasEmbeddingResults: boolean
}

export function useTaskIconSuggestions(
  taskTitle: string,
  category?: string | null,
  enabled: boolean = true,
): UseTaskIconSuggestionsResult {
  // ── Stage 1: Instant text + tag search (no debounce, every change) ──
  //
  // Tries canonical tag containment FIRST (precision) — e.g. "brush teeth"
  // → ["teeth"] → strict tag match → finds the teeth sequence.
  //
  // Falls through to ILIKE on display_name + description when the canonical
  // map doesn't know the word — e.g. "scripture" isn't in the canonical map,
  // so we fall through to ILIKE and find "Scripture Read — B" by display_name.
  //
  // Background on the JSONB fix: supabase-js's `.contains('tags', [...])`
  // generates PostgreSQL array syntax `cs.{teeth}`, which Postgres rejects
  // because `platform_assets.tags` is JSONB (not text[]). The correct wire
  // format is `cs.["teeth"]` via `.filter('tags', 'cs', JSON.stringify([...]))`.
  const tagQuery = useQuery({
    queryKey: ['task-icons-tag', taskTitle, category],
    queryFn: async () => {
      const tags = extractTaskIconTags(taskTitle, category ?? undefined)

      // All variants (A/B/C) are shown — mom picks whichever image she
      // prefers. Different families gravitate toward different looks,
      // especially for gendered/cultural imagery. Increased limit to 12
      // so multiple variants of the same subject can coexist in the
      // auto-suggest result set.
      if (tags.length > 0) {
        // Canonical tag match — precision path
        const { data, error } = await supabase
          .from('platform_assets')
          .select('feature_key, variant, category, display_name, description, tags, size_512_url, size_128_url')
          .eq('category', 'visual_schedule')
          .eq('status', 'active')
          .filter('tags', 'cs', JSON.stringify(tags))
          .limit(12)
        if (error) throw error
        const rows = data ?? []
        if (rows.length > 0) return rows.map(rowToSuggestion)
        // Fall through to text match if tag match returned nothing
      }

      // Fall-through: ILIKE on display_name + description catches words
      // not in the canonical map ("scripture", "spanish", "bible", etc.)
      const pattern = `%${taskTitle.trim()}%`
      const { data: textData, error: textError } = await supabase
        .from('platform_assets')
        .select('feature_key, variant, category, display_name, description, tags, size_512_url, size_128_url')
        .eq('category', 'visual_schedule')
        .eq('status', 'active')
        .or(`display_name.ilike.${pattern},description.ilike.${pattern}`)
        .limit(12)
      if (textError) throw textError
      return (textData ?? []).map(rowToSuggestion)
    },
    enabled: enabled && taskTitle.trim().length >= 3,
    staleTime: 60_000,
    retry: false,
  })

  // ── Stage 2: Debounced embedding-based refine ──
  const debouncedTitle = useDebounce(taskTitle, 500)

  const embeddingQuery = useQuery({
    queryKey: ['task-icons-embedding', debouncedTitle, category],
    queryFn: async () => {
      const queryText = `${debouncedTitle}${category ? ' ' + category : ''}`.trim()

      // Generate query embedding via the existing PRD-18 Phase C Edge Function
      const embedRes = await supabase.functions.invoke('generate-query-embedding', {
        body: { text: queryText },
      })

      if (embedRes.error || !embedRes.data?.embedding) {
        throw new Error('Embedding generation failed')
      }

      // Cosine similarity search via the platform_assets match_assets RPC.
      // Threshold 0.3 = recall-friendly: catches semantic siblings like
      // "scripture" → "Scripture Read", "bedtime story" → "Book Read", etc.
      // Tuned down from 0.5 after end-to-end testing showed 0.5 missed obvious
      // word-level matches.
      const { data, error } = await supabase.rpc('match_assets', {
        query_embedding: embedRes.data.embedding,
        match_threshold: 0.3,
        match_count: 12,
        filter_category: 'visual_schedule',
        filter_status: 'active',
      })

      if (error) throw error

      // All variants surface — mom chooses which one she likes best.
      // Different families gravitate toward different looks.
      const rows = (data ?? []) as Array<Record<string, unknown>>
      return rows.map(rowToSuggestion)
    },
    enabled: enabled && debouncedTitle.trim().length >= 3,
    staleTime: 5 * 60_000,
    retry: false, // Silent failure → fall back to tag results
  })

  // ── Merge: prefer embedding results when available ──
  const results = useMemo(() => {
    const embedding = embeddingQuery.data ?? []
    const tag = tagQuery.data ?? []
    return embedding.length > 0 ? embedding : tag
  }, [tagQuery.data, embeddingQuery.data])

  return {
    results,
    isLoading: tagQuery.isLoading,
    isRefining: embeddingQuery.isFetching,
    hasEmbeddingResults: (embeddingQuery.data?.length ?? 0) > 0,
  }
}

/* ─────────────────────────────────────────────────────────────────────
 * Row → suggestion adapter
 *
 * Both query paths return platform_assets rows with slightly different
 * shapes. The tag query returns the raw row (tags as JSONB → unknown).
 * The embedding query goes through match_assets RPC which returns
 * tags as JSONB. Either way we coerce to a clean string[] for the UI.
 * ───────────────────────────────────────────────────────────────────── */

function rowToSuggestion(row: Record<string, unknown>): TaskIconSuggestion {
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
  if (Array.isArray(raw)) return raw.filter((t): t is string => typeof t === 'string')
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === 'string')
    } catch {
      // Not JSON — treat as comma-separated fallback
      return raw.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}
