/**
 * useTaskSegments — Build M Phase 1
 *
 * Reads `task_segments` for a single member, ordered by sort_order.
 * Returns active segments only by default.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TaskSegment } from '@/types/play-dashboard'

export function useTaskSegments(familyMemberId: string | undefined) {
  return useQuery<TaskSegment[]>({
    queryKey: ['task-segments', familyMemberId],
    queryFn: async () => {
      if (!familyMemberId) return []

      const { data, error } = await supabase
        .from('task_segments')
        .select('*')
        .eq('family_member_id', familyMemberId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('useTaskSegments query failed:', error)
        return []
      }

      return (data ?? []) as TaskSegment[]
    },
    enabled: !!familyMemberId,
    staleTime: 30_000,
  })
}
