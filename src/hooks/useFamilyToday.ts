// NEW-DD Wave 1 remediation (Row 184, FIX_NOW_SEQUENCE v12) — Path 2 read path.
//
// Canonical source of "today's local date for this family" on the client.
// Replaces todayLocalIso() at every filter site that queries a DATE column —
// see Convention #257. Device-clock misconfiguration no longer matters: the
// RPC reads families.timezone and derives the date server-side.
//
// Usage:
//   const { data: familyToday } = useFamilyToday(memberId)
//   const { data } = useQuery({
//     queryKey: ['my-today-data', memberId, familyToday],
//     queryFn: () => supabase.from('t').eq('day_date', familyToday!),
//     enabled: !!memberId && !!familyToday,
//   })
//
// While the RPC is loading, `data` is undefined. Dependent queries should
// gate on `enabled: !!familyToday` so they don't run with a stale or missing
// value. The 60s staleTime keeps the result shared across renders — the RPC
// fires at most once per member per minute.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * Today's local date (YYYY-MM-DD) for the family this member belongs to.
 * Deterministic function of NOW() + families.timezone on the server.
 *
 * Returns `undefined` while the RPC is loading or when `memberId` is falsy.
 * Cached for 60 seconds across all consumers.
 */
export function useFamilyToday(memberId: string | undefined) {
  return useQuery({
    queryKey: ['family-today', memberId],
    queryFn: async () => {
      if (!memberId) return null
      const { data, error } = await supabase.rpc('family_today', { p_member_id: memberId })
      if (error) throw error
      return data as string // DATE is returned as YYYY-MM-DD
    },
    enabled: !!memberId,
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * Non-hook variant for imperative code paths (mutations, utilities) that can't
 * subscribe to a query. Returns the result of a one-off RPC call.
 *
 * Prefer the hook whenever possible. This exists for write-path utilities like
 * buildTaskScheduleFields and createTaskFromData rotation updates, which run
 * outside component render cycles.
 */
export async function fetchFamilyToday(memberId: string): Promise<string> {
  const { data, error } = await supabase.rpc('family_today', { p_member_id: memberId })
  if (error) throw error
  return data as string
}
