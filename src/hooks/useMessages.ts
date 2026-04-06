/**
 * useMessages — PRD-15 Phase D
 *
 * Fetches messages with sender info for a thread (paginated).
 * Send, edit messages. Mark read on mount / new message arrival.
 */

import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { THREADS_KEY } from '@/hooks/useConversationThreads'
import { SPACES_KEY } from '@/hooks/useConversationSpaces'
import type { MessageWithSender, CreateMessageData } from '@/types/messaging'

export const MESSAGES_KEY = 'messages'
const PAGE_SIZE = 40

/**
 * Fetch messages for a thread with infinite scroll (load older).
 * Most recent messages first, then paginate backwards.
 */
export function useMessages(threadId: string | undefined) {
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  return useInfiniteQuery({
    queryKey: [MESSAGES_KEY, threadId],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!threadId) return { messages: [], nextOffset: null }

      const from = pageParam
      const to = from + PAGE_SIZE - 1

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, thread_id, sender_member_id, message_type, content, metadata,
          reply_to_id, is_edited, edited_at, created_at,
          family_members!messages_sender_member_id_fkey (
            display_name, avatar_url, assigned_color
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const messages: MessageWithSender[] = (data ?? []).map(msg => {
        const sender = msg.family_members as unknown as {
          display_name: string
          avatar_url: string | null
          assigned_color: string | null
        } | null

        return {
          id: msg.id,
          thread_id: msg.thread_id,
          sender_member_id: msg.sender_member_id,
          message_type: msg.message_type as MessageWithSender['message_type'],
          content: msg.content,
          metadata: msg.metadata ?? {},
          reply_to_id: msg.reply_to_id,
          is_edited: msg.is_edited,
          edited_at: msg.edited_at,
          created_at: msg.created_at,
          sender_display_name: sender?.display_name,
          sender_avatar_url: sender?.avatar_url ?? null,
          sender_assigned_color: sender?.assigned_color ?? null,
        }
      })

      // Reverse to chronological order for display
      messages.reverse()

      return {
        messages,
        nextOffset: data && data.length === PAGE_SIZE ? from + PAGE_SIZE : null,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!threadId && !!memberId,
    staleTime: 10_000,
  })
}

/** Send a new message in a thread */
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async (data: CreateMessageData) => {
      if (!currentMember?.id) throw new Error('No current member')

      const { data: msg, error } = await supabase
        .from('messages')
        .insert({
          thread_id: data.thread_id,
          sender_member_id: currentMember.id,
          message_type: data.message_type ?? 'user',
          content: data.content,
          metadata: data.metadata ?? {},
          reply_to_id: data.reply_to_id ?? null,
        })
        .select('id, thread_id, created_at')
        .single()

      if (error) throw error
      return msg
    },
    onSuccess: (msg) => {
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, msg.thread_id] })
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Edit an existing message */
export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, content, threadId }: { messageId: string; content: string; threadId: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)

      if (error) throw error
      return { threadId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY, result.threadId] })
    },
  })
}

/**
 * Mark thread as read — updates message_read_status for current member.
 * Called on thread mount and when new messages arrive while viewing.
 */
export function useMarkThreadRead() {
  const { data: currentMember } = useFamilyMember()
  const queryClient = useQueryClient()

  const markRead = useCallback(async (threadId: string, lastMessageId: string) => {
    if (!currentMember?.id) return

    const { error } = await supabase
      .from('message_read_status')
      .upsert(
        {
          thread_id: threadId,
          family_member_id: currentMember.id,
          last_read_message_id: lastMessageId,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'thread_id,family_member_id' }
      )

    if (error) {
      console.error('[useMarkThreadRead] Failed to mark read:', error)
      return
    }

    // Invalidate unread counts
    queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
    queryClient.invalidateQueries({ queryKey: ['unread-message-count'] })
  }, [currentMember?.id, queryClient])

  return { markRead }
}

/**
 * Auto-mark a thread as read when viewing it.
 * Pass the thread ID and the latest message ID.
 */
export function useAutoMarkRead(threadId: string | undefined, latestMessageId: string | undefined) {
  const { markRead } = useMarkThreadRead()
  const markedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!threadId || !latestMessageId) return
    // Only mark once per unique message to avoid loops
    if (markedRef.current === latestMessageId) return
    markedRef.current = latestMessageId
    markRead(threadId, latestMessageId)
  }, [threadId, latestMessageId, markRead])
}
