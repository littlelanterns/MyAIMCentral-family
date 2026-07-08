// PRD-24 Point Economy Addendum §5.6 (rider 2) — Daily Points Goal.
//
// Mirrors useMemberStreak.ts's shape: reads a live-computed value via RPC
// rather than a client-side day derivation (Convention #257 — the RPC
// itself resolves "today" through public.family_today at the family's
// timezone). Used by My Rewards' Points section and the Play/Guided
// dashboard points readouts. Query key matches the invalidation added in
// useTaskCompletions.ts's useCompleteRoutineStep onSuccess.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export function useMemberPointsToday(memberId: string | undefined) {
  return useQuery({
    queryKey: ['member-points-today', memberId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('member_points_today', {
        p_member_id: memberId,
      })
      if (error) throw error
      return (data as number) ?? 0
    },
    enabled: !!memberId,
    staleTime: 15_000,
  })
}
