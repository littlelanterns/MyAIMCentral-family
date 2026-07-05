// CLIENT-DATE-REMEDIATION — revised W4 (streak fix, founder gate G1)
//
// `family_members.current_streak` / `longest_streak` / `last_task_completion_date`
// have been dead columns since migration 100221 (Phase 3 Worker F cutover)
// dropped `roll_creature_for_completion` — the only code path that ever wrote
// them. Streak computation now lives entirely in `compute_streak()` (migration
// 100204, made family-timezone-aware by migration 100240), keyed off
// `deed_firings` rather than the frozen family_members columns.
//
// This hook reads the LIVE, correct streak instead of the frozen column.
// `source_type: 'task_completion'` matches every fireDeed() call site fired on
// task completion (useTaskCompletions, useTasks, useTaskCompletion, usePractice),
// replicating the semantics the old `last_task_completion_date` column used to
// carry before it stopped being written to.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface MemberStreak {
  currentStreak: number
  longestStreak: number
  lastFiredAt: string | null
}

export function useMemberStreak(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-streak', memberId],
    queryFn: async (): Promise<MemberStreak> => {
      const { data, error } = await supabase.rpc('compute_streak', {
        p_family_member_id: memberId,
        p_source_type: 'task_completion',
        p_source_id: null,
      })
      if (error) throw error
      const result = data as { current_streak: number; longest_streak: number; last_fired_at: string | null }
      return {
        currentStreak: result?.current_streak ?? 0,
        longestStreak: result?.longest_streak ?? 0,
        lastFiredAt: result?.last_fired_at ?? null,
      }
    },
    enabled: !!memberId,
    staleTime: 30_000,
  })
}
