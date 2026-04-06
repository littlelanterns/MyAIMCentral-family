/**
 * useMessagingRealtime — PRD-15 Phase D
 *
 * Supabase Realtime subscriptions for:
 * - New messages in the active thread (INSERT on messages filtered by thread_id)
 * - Space-level changes (conversation_spaces updates for the member's spaces)
 *
 * First chat-style Realtime usage in the codebase.
 */

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { MESSAGES_KEY } from '@/hooks/useMessages'
import { THREADS_KEY } from '@/hooks/useConversationThreads'
import { SPACES_KEY } from '@/hooks/useConversationSpaces'

/**
 * Subscribe to new messages in a specific thread.
 * Invalidates the messages cache when a new message arrives,
 * triggering a refetch that auto-scrolls to the new message.
 */
export function useThreadRealtime(threadId: string | undefined) {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!threadId) return

    const channel = supabase
      .channel(`thread-messages:${threadId}`)
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
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [threadId, queryClient])
}

/**
 * Subscribe to space-level activity changes.
 * Listens for conversation_spaces updated_at changes
 * to refresh the spaces list when activity happens in other spaces.
 */
export function useSpacesRealtime(familyId: string | undefined) {
  const queryClient = useQueryClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!familyId) return

    const channel = supabase
      .channel(`spaces-activity:${familyId}`)
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
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [familyId, queryClient])
}
