// PRD-14C: Shared pending counts hook
// Extracted from UniversalQueueModal so PendingItemsBar can show badge counts
// without the modal being open.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface PendingCounts {
  sort: number
  calendar: number
  requests: number
  total: number
}

export function usePendingCounts(familyId: string | undefined) {
  const sortQuery = useQuery({
    queryKey: ['queue-badge-sort', familyId],
    queryFn: async () => {
      if (!familyId) return 0
      const { count, error } = await supabase
        .from('studio_queue')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .is('processed_at', null)
        .is('dismissed_at', null)
      if (error) return 0
      return count ?? 0
    },
    enabled: !!familyId,
    refetchInterval: 30_000,
  })

  const calendarQuery = useQuery({
    queryKey: ['queue-badge-calendar', familyId],
    queryFn: async () => {
      if (!familyId) return 0
      const { count, error } = await supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'pending')
      if (error) return 0
      return count ?? 0
    },
    enabled: !!familyId,
    refetchInterval: 30_000,
  })

  const requestsQuery = useQuery({
    queryKey: ['queue-badge-requests', familyId],
    queryFn: async () => {
      if (!familyId) return 0
      const { count, error } = await supabase
        .from('family_requests')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'pending')
      if (error) return 0
      return count ?? 0
    },
    enabled: !!familyId,
    refetchInterval: 30_000,
  })

  const sort = sortQuery.data ?? 0
  const calendar = calendarQuery.data ?? 0
  const requests = requestsQuery.data ?? 0

  return {
    sort,
    calendar,
    requests,
    total: sort + calendar + requests,
    isLoading: sortQuery.isLoading || calendarQuery.isLoading || requestsQuery.isLoading,
  }
}
