/**
 * useUnreadMessageCount — PRD-15 Phase D
 *
 * Total unread message count across all conversation spaces.
 * Used for the sidebar Messages nav badge.
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

export const UNREAD_MSG_COUNT_KEY = 'unread-message-count'

/**
 * Returns the total number of threads with unread messages.
 * Counts threads where the latest message is newer than the member's
 * last read position (or where no read position exists).
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

      // Count threads where last_message_at > last_read_at (or no read record)
      let unread = 0
      for (const thread of threads) {
        const lastRead = readMap.get(thread.id)
        if (!lastRead) {
          // Never read — check if the thread has any messages at all
          if (thread.last_message_at) unread++
        } else if (thread.last_message_at && thread.last_message_at > lastRead) {
          unread++
        }
      }

      return unread
    },
    enabled: !!memberId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
