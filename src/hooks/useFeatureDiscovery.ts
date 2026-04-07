/**
 * PRD-18 Phase C Enhancement 4: Feature Discovery hooks
 *
 * Two hooks:
 *
 *   useFeatureDiscoveryCandidates(memberId, audience)
 *     Returns the filtered pool after:
 *       - audience filter (adult-only in Phase C; Phase D adds teen)
 *       - dismissal filter (permanent per member via `feature_discovery_dismissals`)
 *       - engagement filter (excludes features the member has meaningfully
 *         engaged with in the last 14 days via `activity_log_entries`)
 *
 *   useDismissFeatureDiscovery()
 *     Mutation: inserts a dismissal row. Idempotent via ON CONFLICT DO NOTHING.
 *     Invalidates the candidates query so the section re-renders without the
 *     dismissed feature.
 *
 * Engagement signal: for each candidate, we check if any
 * `activity_log_entries` row exists for this member in the last 14 days
 * with event_type ∈ candidate.engagement_event_types OR source_table ∈
 * candidate.engagement_source_tables. Either match counts. Empty arrays
 * mean "no engagement signal" — the candidate is always eligible for
 * discovery (unless dismissed).
 *
 * Client-side filter for Phase C — 12 small queries per rhythm open,
 * each hitting the indexed `idx_ale_family_member` index. Trivial cost.
 * Server-side RPC optimization deferred if this becomes hot.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { FEATURE_DISCOVERY_POOL } from '@/lib/rhythm/featureDiscoveryPool'
import type { FeatureDiscoveryCandidate, FeatureDiscoveryAudience } from '@/types/rhythms'

const ENGAGEMENT_WINDOW_DAYS = 14

export function useFeatureDiscoveryCandidates(
  memberId: string | undefined,
  audience: FeatureDiscoveryAudience = 'adult',
) {
  return useQuery({
    queryKey: ['feature-discovery-candidates', memberId, audience],
    queryFn: async (): Promise<FeatureDiscoveryCandidate[]> => {
      if (!memberId) return []

      // Step 1: audience filter
      const audienceFiltered = FEATURE_DISCOVERY_POOL.filter(c =>
        c.audiences.includes(audience)
      )

      // Step 2: dismissal filter
      const { data: dismissals } = await supabase
        .from('feature_discovery_dismissals')
        .select('feature_key')
        .eq('member_id', memberId)

      const dismissedKeys = new Set((dismissals ?? []).map(d => d.feature_key as string))
      const notDismissed = audienceFiltered.filter(c => !dismissedKeys.has(c.feature_key))

      // Step 3: engagement filter (parallel per-candidate query)
      const windowStart = new Date()
      windowStart.setDate(windowStart.getDate() - ENGAGEMENT_WINDOW_DAYS)
      const windowStartIso = windowStart.toISOString()

      const results = await Promise.all(
        notDismissed.map(async candidate => {
          // Skip engagement check if candidate has no signals (always eligible)
          if (
            candidate.engagement_event_types.length === 0 &&
            candidate.engagement_source_tables.length === 0
          ) {
            return candidate
          }

          let query = supabase
            .from('activity_log_entries')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', memberId)
            .gte('created_at', windowStartIso)

          // Supabase doesn't allow OR across two `in` filters cleanly.
          // We run two separate probes and take the earliest non-empty.
          if (candidate.engagement_event_types.length > 0) {
            const { count } = await query.in('event_type', candidate.engagement_event_types)
            if (count && count > 0) return null
            // Rebuild query for source_tables probe
            query = supabase
              .from('activity_log_entries')
              .select('id', { count: 'exact', head: true })
              .eq('member_id', memberId)
              .gte('created_at', windowStartIso)
          }

          if (candidate.engagement_source_tables.length > 0) {
            const { count } = await query.in(
              'source_table',
              candidate.engagement_source_tables,
            )
            if (count && count > 0) return null
          }

          return candidate
        }),
      )

      return results.filter((c): c is FeatureDiscoveryCandidate => c !== null)
    },
    enabled: !!memberId,
    // Candidates change rarely within a session — cache for 5 minutes
    staleTime: 1000 * 60 * 5,
  })
}

export function useDismissFeatureDiscovery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      familyId: string
      memberId: string
      featureKey: string
    }) => {
      const { error } = await supabase.from('feature_discovery_dismissals').insert({
        family_id: params.familyId,
        member_id: params.memberId,
        feature_key: params.featureKey,
      })
      // UNIQUE index on (member_id, feature_key) — 23505 means already
      // dismissed, which is fine (idempotent).
      if (error && error.code !== '23505') throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['feature-discovery-candidates', variables.memberId],
      })
    },
  })
}
