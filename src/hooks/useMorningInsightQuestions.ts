/**
 * PRD-18 Phase C Enhancement 3: Morning Insight question pool hook
 *
 * Reads from `morning_insight_questions` table — seeded with 20 adult
 * questions in migration 100112. Returns the active list for the given
 * audience, filtered to system rows (family_id IS NULL) plus any
 * family-authored rows (family_id = <current family>).
 *
 * Phase C ships read-only. Per-family question CRUD + custom questions
 * in Rhythms Settings is post-MVP.
 *
 * Teen audience (15 teen-specific questions) is Phase D scope. Calling
 * this hook with audience='teen' currently returns an empty list until
 * Phase D seeds them.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { MorningInsightQuestion, MorningInsightAudience } from '@/types/rhythms'

export function useMorningInsightQuestions(
  audience: MorningInsightAudience,
  familyId?: string,
) {
  return useQuery({
    queryKey: ['morning-insight-questions', audience, familyId ?? null],
    queryFn: async (): Promise<MorningInsightQuestion[]> => {
      // System questions (family_id IS NULL) + family-authored ones if any
      let query = supabase
        .from('morning_insight_questions')
        .select('*')
        .eq('audience', audience)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (familyId) {
        query = query.or(`family_id.is.null,family_id.eq.${familyId}`)
      } else {
        query = query.is('family_id', null)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as MorningInsightQuestion[]
    },
    // Questions rarely change — cache aggressively
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
