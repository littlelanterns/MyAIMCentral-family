/**
 * NEW-DDD regression test (bug 30f77dd9, worksheet row 210).
 *
 * The sidebar Messages badge and the Messages page previously computed
 * "unread" with different rules, producing a phantom badge ("1" in the
 * sidebar, nothing unread on the page). All surfaces now share
 * isThreadUnread() / countUnreadMessages() — this test pins the canonical
 * definition, including the exact production scenario that surfaced the bug.
 */
import { describe, it, expect } from 'vitest'
import { isThreadUnread, countUnreadMessages } from '@/lib/messaging/unreadThread'

const MOM = 'mom-id'
const KID = 'kid-id'

describe('isThreadUnread — canonical unread definition (NEW-DDD)', () => {
  it('production phantom scenario: reply from kid after mom last read → unread (badge was RIGHT, page was hiding it)', () => {
    // Thread 63442aa3 "Big People": Mosiah replied 03:43, Tenise read 03:17.
    expect(isThreadUnread({
      latestMessageCreatedAt: '2026-04-07T03:43:26.404564+00:00',
      latestMessageSenderId: KID,
      lastReadAt: '2026-04-07T03:17:37.349+00:00',
      viewerId: MOM,
    })).toBe(true)
  })

  it('own latest message never counts as unread (old badge counted these)', () => {
    expect(isThreadUnread({
      latestMessageCreatedAt: '2026-04-07T03:26:01.174267+00:00',
      latestMessageSenderId: MOM,
      lastReadAt: null,
      viewerId: MOM,
    })).toBe(false)
  })

  it('thread with no messages is never unread (old badge counted last_message_at-only threads)', () => {
    expect(isThreadUnread({
      latestMessageCreatedAt: null,
      latestMessageSenderId: null,
      lastReadAt: null,
      viewerId: MOM,
    })).toBe(false)
  })

  it('never-read thread with a message from someone else is unread', () => {
    expect(isThreadUnread({
      latestMessageCreatedAt: '2026-04-07T02:28:11.440224+00:00',
      latestMessageSenderId: KID,
      lastReadAt: undefined,
      viewerId: MOM,
    })).toBe(true)
  })

  it('read past the latest message → not unread', () => {
    expect(isThreadUnread({
      latestMessageCreatedAt: '2026-04-07T03:43:26.404564+00:00',
      latestMessageSenderId: KID,
      lastReadAt: '2026-04-07T05:08:53.003+00:00',
      viewerId: MOM,
    })).toBe(false)
  })
})

describe('countUnreadMessages', () => {
  const msgs = [
    { created_at: '2026-04-07T03:17:35.822686+00:00', sender_member_id: MOM },
    { created_at: '2026-04-07T03:43:26.404564+00:00', sender_member_id: KID },
    { created_at: '2026-04-07T04:00:00.000000+00:00', sender_member_id: KID },
  ]

  it('counts only other-sender messages newer than last read', () => {
    expect(countUnreadMessages(msgs, '2026-04-07T03:17:37.349+00:00', MOM)).toBe(2)
  })

  it('counts all other-sender messages when never read', () => {
    expect(countUnreadMessages(msgs, null, MOM)).toBe(2)
  })

  it('counts zero when read past everything', () => {
    expect(countUnreadMessages(msgs, '2026-04-07T05:00:00.000000+00:00', MOM)).toBe(0)
  })
})
