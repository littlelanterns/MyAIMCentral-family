/**
 * useConversationThreads — PRD-15 Phase D
 *
 * Fetches threads within a conversation space with preview/unread data.
 * Supports create, archive, pin, and rename operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { SPACES_KEY } from '@/hooks/useConversationSpaces'
import type {
  ConversationThread,
  ConversationThreadWithPreview,
  CreateThreadData,
  ThreadSourceType,
} from '@/types/messaging'

export const THREADS_KEY = 'conversation-threads'

/**
 * Fetch threads for a specific conversation space,
 * enriched with last message preview and unread count.
 */
export function useConversationThreads(spaceId: string | undefined) {
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  return useQuery({
    queryKey: [THREADS_KEY, spaceId, memberId],
    queryFn: async (): Promise<ConversationThreadWithPreview[]> => {
      if (!spaceId || !memberId) return []

      // 1. Get threads for this space
      const { data: threads, error: thErr } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('space_id', spaceId)
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('last_message_at', { ascending: false })

      if (thErr) throw thErr
      if (!threads?.length) return []

      const threadIds = threads.map(t => t.id)

      // 2. Get latest message per thread
      const { data: messages, error: msgErr } = await supabase
        .from('messages')
        .select('thread_id, content, sender_member_id, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })

      if (msgErr) throw msgErr

      // Deduplicate: first occurrence per thread is the latest
      const latestPerThread = new Map<string, (typeof messages)[0]>()
      for (const msg of messages ?? []) {
        if (!latestPerThread.has(msg.thread_id)) {
          latestPerThread.set(msg.thread_id, msg)
        }
      }

      // 3. Get read status
      const { data: readStatuses, error: rsErr } = await supabase
        .from('message_read_status')
        .select('thread_id, last_read_message_id')
        .eq('family_member_id', memberId)
        .in('thread_id', threadIds)

      if (rsErr) throw rsErr

      const readMap = new Map((readStatuses ?? []).map(rs => [rs.thread_id, rs.last_read_message_id]))

      // 4. Get sender names for preview
      const senderIds = [...new Set((messages ?? []).map(m => m.sender_member_id).filter(Boolean))] as string[]
      let senderNames = new Map<string, string>()
      if (senderIds.length > 0) {
        const { data: members } = await supabase
          .from('family_members')
          .select('id, display_name')
          .in('id', senderIds)

        senderNames = new Map((members ?? []).map(m => [m.id, m.display_name]))
      }

      // 5. Get space name for the Chats tab view
      const { data: space } = await supabase
        .from('conversation_spaces')
        .select('name')
        .eq('id', spaceId)
        .single()

      // Assemble
      return (threads as ConversationThread[]).map(thread => {
        const latestMsg = latestPerThread.get(thread.id)
        const lastReadId = readMap.get(thread.id)

        // Simple unread: if latest message exists and isn't from us and we haven't read it
        let unreadCount = 0
        if (latestMsg && latestMsg.sender_member_id !== memberId && !lastReadId) {
          unreadCount = (messages ?? []).filter(m =>
            m.thread_id === thread.id && m.sender_member_id !== memberId
          ).length
        }

        const preview = latestMsg
          ? latestMsg.content.length > 60
            ? latestMsg.content.slice(0, 60) + '...'
            : latestMsg.content
          : undefined

        const senderName = latestMsg?.sender_member_id
          ? senderNames.get(latestMsg.sender_member_id)
          : undefined

        return {
          ...thread,
          last_message_preview: preview,
          last_message_sender: senderName,
          unread_count: unreadCount,
          space_name: space?.name ?? undefined,
        }
      })
    },
    enabled: !!spaceId && !!memberId,
    staleTime: 15_000,
  })
}

/**
 * Fetch ALL threads across all spaces for the "Chats" tab.
 * Returns threads sorted by last_message_at regardless of space.
 */
export function useAllThreads() {
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  return useQuery({
    queryKey: [THREADS_KEY, 'all', memberId],
    queryFn: async (): Promise<ConversationThreadWithPreview[]> => {
      if (!memberId) return []

      // Get spaces this member belongs to
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_space_members')
        .select('space_id')
        .eq('family_member_id', memberId)

      if (memErr) throw memErr
      if (!memberships?.length) return []

      const spaceIds = memberships.map(m => m.space_id)

      // Get all non-archived threads from these spaces
      const { data: threads, error: thErr } = await supabase
        .from('conversation_threads')
        .select(`
          *,
          conversation_spaces!inner ( name, space_type )
        `)
        .in('space_id', spaceIds)
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false })
        .limit(50)

      if (thErr) throw thErr
      if (!threads?.length) return []

      const threadIds = threads.map(t => t.id)

      // Latest messages
      const { data: messages, error: msgErr } = await supabase
        .from('messages')
        .select('thread_id, content, sender_member_id, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })

      if (msgErr) throw msgErr

      const latestPerThread = new Map<string, (typeof messages)[0]>()
      for (const msg of messages ?? []) {
        if (!latestPerThread.has(msg.thread_id)) {
          latestPerThread.set(msg.thread_id, msg)
        }
      }

      // Sender names
      const senderIds = [...new Set((messages ?? []).map(m => m.sender_member_id).filter(Boolean))] as string[]
      let senderNames = new Map<string, string>()
      if (senderIds.length > 0) {
        const { data: members } = await supabase
          .from('family_members')
          .select('id, display_name')
          .in('id', senderIds)
        senderNames = new Map((members ?? []).map(m => [m.id, m.display_name]))
      }

      // Read status
      const { data: readStatuses } = await supabase
        .from('message_read_status')
        .select('thread_id, last_read_message_id')
        .eq('family_member_id', memberId)
        .in('thread_id', threadIds)

      const readMap = new Map((readStatuses ?? []).map(rs => [rs.thread_id, rs.last_read_message_id]))

      return threads.map(thread => {
        const spaceInfo = thread.conversation_spaces as unknown as { name: string | null; space_type: string }
        const latestMsg = latestPerThread.get(thread.id)
        const lastReadId = readMap.get(thread.id)

        let unreadCount = 0
        if (latestMsg && latestMsg.sender_member_id !== memberId && !lastReadId) {
          unreadCount = 1 // Simplified — at least 1 unread
        }

        const preview = latestMsg
          ? latestMsg.content.length > 60
            ? latestMsg.content.slice(0, 60) + '...'
            : latestMsg.content
          : undefined

        return {
          id: thread.id,
          space_id: thread.space_id,
          title: thread.title,
          started_by: thread.started_by,
          is_archived: thread.is_archived,
          is_pinned: thread.is_pinned,
          source_type: thread.source_type as ThreadSourceType,
          source_reference_id: thread.source_reference_id,
          last_message_at: thread.last_message_at,
          created_at: thread.created_at,
          last_message_preview: preview,
          last_message_sender: latestMsg?.sender_member_id
            ? senderNames.get(latestMsg.sender_member_id)
            : undefined,
          unread_count: unreadCount,
          space_name: spaceInfo?.name ?? undefined,
        }
      })
    },
    enabled: !!memberId,
    staleTime: 15_000,
  })
}

/** Create a new thread in a space with the first message */
export function useCreateThread() {
  const queryClient = useQueryClient()
  const { data: currentMember } = useFamilyMember()

  return useMutation({
    mutationFn: async (data: CreateThreadData) => {
      if (!currentMember?.id) throw new Error('No current member')

      // Create thread
      const { data: thread, error: thErr } = await supabase
        .from('conversation_threads')
        .insert({
          space_id: data.space_id,
          started_by: currentMember.id,
          source_type: data.source_type ?? 'manual',
          source_reference_id: data.source_reference_id ?? null,
          last_message_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (thErr) throw thErr

      // Create first message
      const { error: msgErr } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_member_id: currentMember.id,
          message_type: 'user',
          content: data.content,
          metadata: {},
        })

      if (msgErr) throw msgErr

      return thread as ConversationThread
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY, variables.space_id] })
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY, 'all'] })
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Rename a thread title */
export function useRenameThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ threadId, title }: { threadId: string; title: string }) => {
      const { error } = await supabase
        .from('conversation_threads')
        .update({ title })
        .eq('id', threadId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
    },
  })
}

/** Archive a thread */
export function useArchiveThread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from('conversation_threads')
        .update({ is_archived: true })
        .eq('id', threadId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
      queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
    },
  })
}

/** Toggle pin on a thread */
export function useToggleThreadPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ threadId, pinned }: { threadId: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('conversation_threads')
        .update({ is_pinned: pinned })
        .eq('id', threadId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [THREADS_KEY] })
    },
  })
}
