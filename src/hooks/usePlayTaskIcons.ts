/**
 * usePlayTaskIcons — Build M Sub-phase B
 *
 * Batch fetch icon URLs for an array of tasks. Used by the Play Dashboard
 * tile grid to render every tile's paper-craft icon in ONE query (no N+1).
 *
 * Two paths:
 *   1. Tasks with `icon_asset_key` set → fetch by (feature_key, variant) tuple
 *   2. Tasks WITHOUT icon_asset_key → auto-match via extractTaskIconTags
 *      against the title + life_area_tag, take the top tag-search result.
 *
 * Returns a map keyed by task.id → URL string. Tiles look up their own URL.
 * Sub-phase B accepts auto-matching at render time as the baseline. When mom
 * uses the picker in TaskCreationModal, icon_asset_key is set explicitly so
 * the auto-match path is bypassed for those tasks.
 *
 * Fallback: vs_task_default — referenced as a constant. The actual asset
 * doesn't ship until Manus generates the fallback PNGs (separate task,
 * see asset-requirements/manus-vs-task-default-fallback.md). Tiles with
 * no match render the broken URL gracefully via onError fallback.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { extractTaskIconTags } from '@/lib/assets/extractTaskIconTags'
import type { Task } from '@/types/tasks'

export const TASK_ICON_FALLBACK_KEY = 'vs_task_default'

export interface PlayTaskIconMap {
  /** Map from task.id → resolved 128px image URL (or null if no match) */
  iconUrls: Record<string, string | null>
  /** True while the batch query is loading */
  isLoading: boolean
}

export function usePlayTaskIcons(tasks: Task[]): PlayTaskIconMap {
  // Dedupe (feature_key, variant) tuples we need to look up.
  // Tasks WITH icon_asset_key set → direct lookup.
  // Tasks WITHOUT icon_asset_key → auto-match via extractTaskIconTags.
  const { explicitRefs, autoMatchTags } = useMemo(() => {
    const explicit = new Map<string, { feature_key: string; variant: string }>()
    const autoTags: Record<string, string[]> = {}

    for (const task of tasks) {
      if (task.icon_asset_key) {
        const variant = task.icon_variant ?? 'B'
        const key = `${task.icon_asset_key}::${variant}`
        explicit.set(key, { feature_key: task.icon_asset_key, variant })
      } else {
        const tags = extractTaskIconTags(task.title, task.life_area_tags?.[0] ?? task.life_area_tag)
        if (tags.length > 0) {
          autoTags[task.id] = tags
        }
      }
    }

    return {
      explicitRefs: Array.from(explicit.values()),
      autoMatchTags: autoTags,
    }
  }, [tasks])

  // Stable cache key — only refetch when the resolved set actually changes
  const explicitKey = useMemo(
    () =>
      explicitRefs
        .map(r => `${r.feature_key}:${r.variant}`)
        .sort()
        .join(','),
    [explicitRefs],
  )

  const autoMatchKey = useMemo(
    () =>
      Object.entries(autoMatchTags)
        .map(([taskId, tags]) => `${taskId}:${tags.join('|')}`)
        .sort()
        .join(','),
    [autoMatchTags],
  )

  const query = useQuery({
    queryKey: ['play-task-icons', explicitKey, autoMatchKey],
    queryFn: async () => {
      const result: Record<string, string | null> = {}

      // ── Path 1: explicit feature_key + variant lookups (one batched query) ──
      if (explicitRefs.length > 0) {
        const featureKeys = Array.from(new Set(explicitRefs.map(r => r.feature_key)))
        const { data, error } = await supabase
          .from('platform_assets')
          .select('feature_key, variant, size_128_url')
          .eq('category', 'visual_schedule')
          .in('feature_key', featureKeys)

        if (!error && data) {
          // Build a (feature_key|variant) → URL map for the explicit set
          const byKey = new Map<string, string>()
          for (const row of data) {
            byKey.set(`${row.feature_key}::${row.variant}`, row.size_128_url as string)
          }
          for (const task of tasks) {
            if (task.icon_asset_key) {
              const variant = task.icon_variant ?? 'B'
              const url = byKey.get(`${task.icon_asset_key}::${variant}`)
              result[task.id] = url ?? null
            }
          }
        }
      }

      // ── Path 2: auto-match via tag search (one query per unique tag set) ──
      // For Sub-phase B we keep this simple: query each unique tag set
      // sequentially. This is bounded by the number of pending tasks on
      // a Play dashboard (typically <10), so the cost is acceptable.
      // Optimization for later: a single .or() composite query.
      const uniqueTagSets = new Map<string, string[]>()
      for (const [taskId, tags] of Object.entries(autoMatchTags)) {
        uniqueTagSets.set(tags.join(','), tags)
        result[taskId] = null // initialize to null until resolved
      }

      for (const tags of uniqueTagSets.values()) {
        // JSONB array containment — must use .filter(..., 'cs', JSON.stringify(...))
        // because platform_assets.tags is JSONB, not text[]. See the same
        // fix in useTaskIconSuggestions for the full explanation.
        //
        // Auto-match accepts ANY variant (A/B/C) and returns the first one.
        // Mom's explicit picker selection (via task.icon_asset_key + icon_variant)
        // always wins — this path only fires for tasks where mom never picked.
        const { data } = await supabase
          .from('platform_assets')
          .select('feature_key, size_128_url, tags')
          .eq('category', 'visual_schedule')
          .eq('status', 'active')
          .filter('tags', 'cs', JSON.stringify(tags))
          .limit(1)

        if (data && data.length > 0) {
          const url = data[0].size_128_url as string
          // Assign this URL to every task whose auto-match tags equal this set
          for (const [taskId, taskTags] of Object.entries(autoMatchTags)) {
            if (taskTags.join(',') === tags.join(',')) {
              result[taskId] = url
            }
          }
        }
      }

      return result
    },
    enabled: tasks.length > 0,
    staleTime: 5 * 60_000, // icons don't churn — 5 minutes is generous
  })

  return {
    iconUrls: query.data ?? {},
    isLoading: query.isLoading,
  }
}
