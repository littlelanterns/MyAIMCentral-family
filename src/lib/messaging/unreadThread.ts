/**
 * Single source of truth for "is this thread unread?" (NEW-DDD, bug 30f77dd9)
 *
 * Before this module, three surfaces computed "unread" three different ways:
 *  - Sidebar badge (useUnreadMessageCount): last_message_at > last_read_at,
 *    even when the latest message was the viewer's OWN, and even when no
 *    other person ever wrote in the thread.
 *  - Space list (useConversationSpaces): only threads with NO read-status
 *    row counted at all — a thread with a read row but newer messages from
 *    others contributed ZERO.
 *  - Thread list (useConversationThreads): same no-read-row-only rule.
 *
 * Result: the sidebar Family > Messages badge showed "1" while the Messages
 * page showed nothing unread or openable. The badge and the page MUST derive
 * from the same definition of "unread and visible" — this is it:
 *
 *   A thread is unread iff its latest message (a) exists, (b) was sent by
 *   someone other than the viewer, and (c) is newer than the viewer's
 *   last_read_at (or the viewer has no read row for the thread).
 */

export interface ThreadUnreadInput {
  /** created_at of the thread's latest message (null/undefined = no messages) */
  latestMessageCreatedAt: string | null | undefined
  /** sender of the thread's latest message (null = system/LiLa) */
  latestMessageSenderId: string | null | undefined
  /** viewer's message_read_status.last_read_at for this thread, if any */
  lastReadAt: string | null | undefined
  /** the viewing member's family_members.id */
  viewerId: string
}

/** Canonical unread predicate — every unread surface goes through this. */
export function isThreadUnread(input: ThreadUnreadInput): boolean {
  const { latestMessageCreatedAt, latestMessageSenderId, lastReadAt, viewerId } = input

  // No messages at all → nothing to read.
  if (!latestMessageCreatedAt) return false

  // The viewer's own message can never make a thread unread for them.
  if (latestMessageSenderId === viewerId) return false

  // Never read → unread.
  if (!lastReadAt) return true

  return Date.parse(latestMessageCreatedAt) > Date.parse(lastReadAt)
}

/**
 * Count unread messages in one thread: messages from other people newer than
 * the viewer's read marker. Returns 0 whenever isThreadUnread would be false
 * for the same inputs (the latest message drives both).
 */
export function countUnreadMessages(
  threadMessages: Array<{ created_at: string; sender_member_id: string | null }>,
  lastReadAt: string | null | undefined,
  viewerId: string,
): number {
  const readTime = lastReadAt ? Date.parse(lastReadAt) : null
  return threadMessages.filter(m =>
    m.sender_member_id !== viewerId &&
    (readTime === null || Date.parse(m.created_at) > readTime)
  ).length
}
