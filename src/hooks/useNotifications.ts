import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { Notification } from '@/types/messaging'

const NOTIFICATIONS_KEY = 'notifications'
const UNREAD_COUNT_KEY = 'notifications-unread-count'

/** Recent 20 notifications for the current member, safety sorted to top */
export function useNotifications() {
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_member_id', memberId)
        .eq('is_dismissed', false)
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
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_member_id', memberId)
        .eq('is_read', false)
        .eq('is_dismissed', false)

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
