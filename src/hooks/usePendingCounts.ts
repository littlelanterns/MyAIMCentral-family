// PRD-14C: Shared pending counts hook
// Extracted from UniversalQueueModal so PendingItemsBar can show badge counts
// without the modal being open.
// PRD-15 Phase C: requests filtered by recipient + snoozed resurface

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface PendingCounts {
  sort: number
  calendar: number
  requests: number
  total: number
}

export function usePendingCounts(familyId: string | undefined, memberId?: string | undefined) {
  const sortQuery = useQuery({
    queryKey: ['queue-badge-sort', familyId],
    queryFn: async () => {
      if (!familyId) return 0
      const { count, error } = await supabase
        .from('studio_queue')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .neq('destination', 'calendar')  // calendar items show in CalendarTab
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

      // Count pending calendar_events (family member submissions)
      const { count: pendingCount, error: pendingErr } = await supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'pending_approval')

      // Count studio_queue items with destination='calendar' (imports + MindSweep detected)
      const { count: queueCount, error: queueErr } = await supabase
        .from('studio_queue')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('destination', 'calendar')
        .is('processed_at', null)
        .is('dismissed_at', null)

      const pending = pendingErr ? 0 : (pendingCount ?? 0)
      const queued = queueErr ? 0 : (queueCount ?? 0)
      return pending + queued
    },
    enabled: !!familyId,
    refetchInterval: 30_000,
  })

  const requestsQuery = useQuery({
    queryKey: ['queue-badge-requests', familyId, memberId],
    queryFn: async () => {
      if (!familyId) return 0

      // If memberId provided, filter by recipient. Otherwise count all family pending.
      const now = new Date().toISOString()
      let query = supabase
        .from('family_requests')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)

      if (memberId) {
        query = query.eq('recipient_member_id', memberId)
      }

      // Count pending + snoozed-but-resurfaced requests
      query = query.or(`status.eq.pending,and(status.eq.snoozed,snoozed_until.lt.${now})`)

      const { count, error } = await query
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
