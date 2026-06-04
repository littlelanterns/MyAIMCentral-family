/**
 * useMessagingRealtime — PRD-15 Phase D
 *
 * Supabase Realtime subscriptions for:
 * - New messages in the active thread (INSERT on messages filtered by thread_id)
 * - Space-level changes (conversation_spaces updates for the member's spaces)
 *
 * First chat-style Realtime usage in the codebase.
 */

import { useEffect, useId, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { MESSAGES_KEY } from '@/hooks/useMessages'
import { THREADS_KEY } from '@/hooks/useConversationThreads'
import { SPACES_KEY } from '@/hooks/useConversationSpaces'
import { UNREAD_MSG_COUNT_KEY } from '@/hooks/useUnreadMessageCount'

/**
 * Subscribe to new messages in a specific thread.
 * Invalidates the messages cache when a new message arrives,
 * triggering a refetch that auto-scrolls to the new message.
 */
export function useThreadRealtime(threadId: string | undefined) {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  // Stable per-hook-instance id. View-As mounts the target's shell while the
  // viewer's shell is live, so the messages page (and this hook) can double-mount
  // on the same thread. Supabase reuses a channel by exact topic name, so a shared
  // `thread-messages:${threadId}` topic causes the second instance to grab an
  // already-subscribed channel and call `.on()` after `.subscribe()` →
  // "cannot add postgres_changes callbacks after subscribe()" → black screen.
  const instanceId = useId()

  useEffect(() => {
    if (!threadId) return

    const channel = supabase
      .channel(`thread-messages:${threadId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          // Invalidate messages for this thread to trigger refetch
          queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, threadId] })
          // Also refresh threads (last_message_at updated by trigger)
          queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
          queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
          // Sidebar unread badge — fires anywhere the dashboard renders
          queryClient.invalidateQueries({ queryKey: [UNREAD_MSG_COUNT_KEY] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          // Message edited
          queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, threadId] })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      // removeChannel both unsubscribes and removes the channel from the client
      // registry so a remount creates a fresh channel rather than reusing a
      // stale (still-subscribed) one.
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [threadId, instanceId, queryClient])
}

/**
 * Subscribe to space-level activity changes.
 * Listens for conversation_spaces updated_at changes
 * to refresh the spaces list when activity happens in other spaces.
 */
export function useSpacesRealtime(familyId: string | undefined) {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  // Stable per-hook-instance id. View-As double-mounts this hook (viewer's shell
  // + the target's shell inside the modal) on the same family. Supabase reuses a
  // channel by exact topic name, so a shared `spaces-activity:${familyId}` topic
  // causes the second instance to call `.on()` after `.subscribe()` →
  // "cannot add postgres_changes callbacks after subscribe()" → black screen.
  const instanceId = useId()

  useEffect(() => {
    if (!familyId) return

    const channel = supabase
      .channel(`spaces-activity:${familyId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_spaces',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_threads',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
          queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
          queryClient.invalidateQueries({ queryKey: [UNREAD_MSG_COUNT_KEY] })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      // removeChannel both unsubscribes and removes the channel from the client
      // registry so a remount creates a fresh channel rather than reusing a
      // stale (still-subscribed) one.
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [familyId, instanceId, queryClient])
}
