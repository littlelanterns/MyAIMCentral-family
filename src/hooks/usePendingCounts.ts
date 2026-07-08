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
    // 5-min refresh keeps the badge fresh enough for awareness without
    // chattering every 30s. User mutations invalidate immediately.
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
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
    // 5-min refresh keeps the badge fresh enough for awareness without
    // chattering every 30s. User mutations invalidate immediately.
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
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
    // 5-min refresh keeps the badge fresh enough for awareness without
    // chattering every 30s. User mutations invalidate immediately.
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  })

  // KIDS-REWARDS-PAGE Slice 4: kid reward proposals waiting for a decision
  // (pending + counter_accepted). Rides the requests count — one decision
  // inbox (Convention #66). RLS scopes rows to mom + the proposer; excluding
  // the viewer's own rows keeps a kid's badge from counting their own pitch.
  const proposalsQuery = useQuery({
    queryKey: ['queue-badge-proposals', familyId, memberId],
    queryFn: async () => {
      if (!familyId) return 0
      let query = supabase
        .from('reward_proposals')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('is_self_proposal', false)
        .in('status', ['pending', 'counter_accepted'])
      if (memberId) {
        query = query.neq('proposer_member_id', memberId)
      }
      const { count, error } = await query
      if (error) return 0
      return count ?? 0
    },
    enabled: !!familyId,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  })

  // PECON-SHOP §6.3: pending Reward Shop purchases waiting on a decision.
  // Rides the requests count — one decision inbox (Convention #66). RLS
  // scopes rows (kid sees only their own; mom/granted-adult see all), so
  // this is safe to query unconditionally — callers that render QueueBadge
  // already gate it to primary_parent (Dashboard.tsx, CalendarPage.tsx).
  const storePurchasesQuery = useQuery({
    queryKey: ['queue-badge-store-purchases', familyId],
    queryFn: async () => {
      if (!familyId) return 0
      const { count, error } = await supabase
        .from('reward_shop_purchases')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('status', 'pending')
      if (error) return 0
      return count ?? 0
    },
    enabled: !!familyId,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  })

  const sort = sortQuery.data ?? 0
  const calendar = calendarQuery.data ?? 0
  const requests = (requestsQuery.data ?? 0) + (proposalsQuery.data ?? 0) + (storePurchasesQuery.data ?? 0)

  return {
    sort,
    calendar,
    requests,
    total: sort + calendar + requests,
    isLoading: sortQuery.isLoading || calendarQuery.isLoading || requestsQuery.isLoading,
  }
}
