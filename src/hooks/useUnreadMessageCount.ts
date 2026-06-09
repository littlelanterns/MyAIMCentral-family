/**
 * useUnreadMessageCount — PRD-15 Phase D
 *
 * Total unread message count across all conversation spaces.
 * Used for the sidebar Messages nav badge.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { isThreadUnread } from '@/lib/messaging/unreadThread'

export const UNREAD_MSG_COUNT_KEY = 'unread-message-count'

/**
 * Returns the total number of threads with unread messages.
 *
 * NEW-DDD (bug 30f77dd9): this badge previously used its own definition of
 * "unread" (last_message_at vs last_read_at, ignoring who sent the message),
 * which diverged from the Messages page and produced phantom counts. It now
 * goes through the canonical isThreadUnread() predicate shared with
 * useConversationSpaces / useConversationThreads — the badge and the page
 * derive from the same definition of "unread and visible."
 */
export function useUnreadMessageCount() {
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  return useQuery({
    queryKey: [UNREAD_MSG_COUNT_KEY, memberId],
    queryFn: async (): Promise<number> => {
      if (!memberId) return 0

      // Get all spaces this member belongs to
      const { data: memberships, error: memErr } = await supabase
        .from('conversation_space_members')
        .select('space_id')
        .eq('family_member_id', memberId)

      if (memErr) return 0
      if (!memberships?.length) return 0

      const spaceIds = memberships.map(m => m.space_id)

      // Get active threads in these spaces
      const { data: threads, error: thErr } = await supabase
        .from('conversation_threads')
        .select('id, last_message_at')
        .in('space_id', spaceIds)
        .eq('is_archived', false)

      if (thErr) return 0
      if (!threads?.length) return 0

      const threadIds = threads.map(t => t.id)

      // Latest message (sender + timestamp) per thread — needed so a member's
      // own message never counts as unread for them.
      const { data: messages, error: msgErr } = await supabase
        .from('messages')
        .select('thread_id, sender_member_id, created_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })

      if (msgErr) return 0

      const latestPerThread = new Map<string, { sender_member_id: string | null; created_at: string }>()
      for (const msg of messages ?? []) {
        if (!latestPerThread.has(msg.thread_id)) {
          latestPerThread.set(msg.thread_id, msg)
        }
      }

      // Get read status for these threads
      const { data: readStatuses, error: rsErr } = await supabase
        .from('message_read_status')
        .select('thread_id, last_read_at')
        .eq('family_member_id', memberId)
        .in('thread_id', threadIds)

      if (rsErr) return 0

      const readMap = new Map(
        (readStatuses ?? []).map(rs => [rs.thread_id, rs.last_read_at])
      )

      let unread = 0
      for (const thread of threads) {
        const latest = latestPerThread.get(thread.id)
        if (isThreadUnread({
          latestMessageCreatedAt: latest?.created_at,
          latestMessageSenderId: latest?.sender_member_id,
          lastReadAt: readMap.get(thread.id),
          viewerId: memberId,
        })) {
          unread++
        }
      }

      return unread
    },
    enabled: !!memberId,
    // 5-min refresh — sidebar badge freshness without chatter.
    // useThreadRealtime/useSpacesRealtime cover the Messages page; this
    // baseline keeps the dashboard nav badge in sync globally without a
    // dedicated realtime subscription per shell.
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
  })
}
