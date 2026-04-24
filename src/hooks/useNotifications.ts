import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { Notification, NotificationCategory } from '@/types/messaging'

const NOTIFICATIONS_KEY = 'notifications'
const UNREAD_COUNT_KEY = 'notifications-unread-count'

/**
 * Loads the member's DND-enabled categories. Consumed by the notification
 * readers below to suppress non-safety notifications at the read layer
 * (SCOPE-2.F40 + Convention #143). Safety alerts (priority='high') always
 * bypass — they're filtered back in via the OR clause in each consumer query.
 */
async function loadDndCategories(memberId: string): Promise<NotificationCategory[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('category, do_not_disturb')
    .eq('family_member_id', memberId)
    .eq('do_not_disturb', true)
  if (error) return []
  return ((data ?? []) as Array<{ category: NotificationCategory }>).map(r => r.category)
}

/** Recent 20 notifications for the current member, safety sorted to top */
export function useNotifications() {
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, memberId],
    queryFn: async () => {
      if (!memberId) return []
      const dnd = await loadDndCategories(memberId)

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_member_id', memberId)
        .eq('is_dismissed', false)

      // DND filter (SCOPE-2.F40): suppress non-safety notifications in
      // DND-enabled categories. Safety alerts (priority='high') bypass per
      // Convention #143 — they pass via the OR priority.eq.high clause.
      if (dnd.length > 0) {
        const dndList = dnd.join(',')
        query = query.or(`priority.eq.high,category.not.in.(${dndList})`)
      }

      const { data, error } = await query
        .order('priority', { ascending: false }) // high first
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data ?? []) as Notification[]
    },
    enabled: !!memberId,
    refetchInterval: 60_000,
  })
}

/** Unread notification count for the bell badge */
export function useUnreadNotificationCount() {
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  return useQuery({
    queryKey: [UNREAD_COUNT_KEY, memberId],
    queryFn: async () => {
      if (!memberId) return 0
      const dnd = await loadDndCategories(memberId)

      let query = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_member_id', memberId)
        .eq('is_read', false)
        .eq('is_dismissed', false)

      if (dnd.length > 0) {
        const dndList = dnd.join(',')
        query = query.or(`priority.eq.high,category.not.in.(${dndList})`)
      }

      const { count, error } = await query
      if (error) return 0
      return count ?? 0
    },
    enabled: !!memberId,
    refetchInterval: 30_000,
  })
}

/** Mark a single notification as read */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, currentMember?.id] })
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, currentMember?.id] })
    },
  })
}

/** Mark all unread notifications as read */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async () => {
      if (!currentMember?.id) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_member_id', currentMember.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, currentMember?.id] })
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, currentMember?.id] })
    },
  })
}

/** Dismiss a single notification */
export function useDismissNotification() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, currentMember?.id] })
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, currentMember?.id] })
    },
  })
}

/**
 * Supabase Realtime subscription for new notification inserts.
 * Invalidates the cache when a new notification arrives.
 */
export function useNotificationRealtime() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!memberId) return

    const channel = supabase
      .channel(`notifications:${memberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_member_id=eq.${memberId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, memberId] })
          queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, memberId] })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [memberId, queryClient])
}
