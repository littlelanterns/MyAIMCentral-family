/**
 * Schedule Access Hooks (PRD-35)
 *
 * Provides hooks for checking member availability based on access schedules.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { isCurrentlyAvailable, getNextOccurrence } from './scheduleUtils'
import type { ScheduleWindow } from './scheduleUtils'

interface AccessSchedule {
  id: string
  family_id: string
  member_id: string
  schedule_type: 'shift' | 'custody' | 'always_on'
  recurrence_details: unknown
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Fetch all active access schedules for a member.
 */
export function useAccessSchedules(memberId: string | undefined) {
  return useQuery({
    queryKey: ['access-schedules', memberId],
    queryFn: async () => {
      if (!memberId) return []

      const { data, error } = await supabase
        .from('access_schedules')
        .select('*')
        .eq('member_id', memberId)
        .eq('is_active', true)

      if (error) throw error
      return data as AccessSchedule[]
    },
    enabled: !!memberId,
  })
}

/**
 * Check if a member is currently available based on their access schedules.
 *
 * Returns:
 * - `available: true` if the member is currently within a schedule window (or has no schedules)
 * - `available: false` if the member has schedules but is outside all windows
 * - `nextWindow` if available is false, shows when the member will next be available
 */
export function useScheduleAccess(memberId: string | undefined) {
  const { data: schedules, isLoading } = useAccessSchedules(memberId)

  const now = new Date()
  const available = schedules ? isCurrentlyAvailable(schedules, now) : true
  const nextWindow: ScheduleWindow | null = !available && schedules
    ? getNextOccurrence(schedules, now)
    : null

  return {
    available,
    nextWindow,
    isLoading,
    hasSchedules: (schedules?.length ?? 0) > 0,
  }
}
