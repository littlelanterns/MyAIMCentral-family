/**
 * useAssetMissLogger — KIDS-REWARDS-PAGE (founder, 2026-06-12)
 *
 * "Have the system keep track of which items don't have images so we can
 * later add those."
 *
 * Fire-and-forget insert into asset_suggestion_misses when an image search
 * settles with zero results or only weak semantic matches (top similarity
 * below GOOD_MATCH_SIMILARITY). Session-deduped per (term, context) so the
 * table records demand, not keystrokes. Never throws — telemetry is additive.
 */

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

export type AssetMissContext = 'task_icon' | 'reward_image' | 'icon_browse'

// Module-level: dedupe across all picker instances for the session
const loggedThisSession = new Set<string>()

export function useAssetMissLogger() {
  const { data: member } = useFamilyMember()

  return useCallback(
    (searchTerm: string, context: AssetMissContext, topSimilarity: number | null) => {
      const term = searchTerm.trim().toLowerCase()
      if (term.length < 3 || !member?.family_id) return

      const dedupeKey = `${context}::${term}`
      if (loggedThisSession.has(dedupeKey)) return
      loggedThisSession.add(dedupeKey)

      supabase
        .from('asset_suggestion_misses')
        .insert({
          family_id: member.family_id,
          member_id: member.id,
          search_term: term,
          context,
          top_similarity: topSimilarity,
        })
        .then(({ error }) => {
          if (error) console.warn('[assetMissLogger] insert failed:', error.message)
        })
    },
    [member?.family_id, member?.id],
  )
}
