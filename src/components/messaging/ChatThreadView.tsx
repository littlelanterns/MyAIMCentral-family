/**
 * ChatThreadView — PRD-15 Screen 3
 *
 * Chat bubbles with auto-scroll, mark read on mount, load older pagination.
 * Sender avatars/initials, timestamps, system messages centered.
 * Supabase Realtime for new messages.
 */

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react'
import { useMessages, useSendMessage, useAutoMarkRead } from '@/hooks/useMessages'
import { useThreadRealtime } from '@/hooks/useMessagingRealtime'
import { useRenameThread } from '@/hooks/useConversationThreads'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { MessageInputBar } from './MessageInputBar'
import type { MessageWithSender } from '@/types/messaging'

interface ChatThreadViewProps {
  threadId: string
  threadTitle: string | null
  spaceId: string
  participantNames?: string
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function MessageBubble({ msg, isOwn, showSender }: {
  msg: MessageWithSender
  isOwn: boolean
  showSender: boolean
}) {
  if (msg.message_type === 'system') {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '0.5rem 1rem',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
        }}
      >
        {msg.content}
      </div>
    )
  }

  const isLila = msg.message_type === 'lila'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '0.5rem',
        padding: '0.125rem 1rem',
      }}
    >
      {/* Avatar */}
      {!isOwn && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: isLila
              ? 'var(--color-btn-primary-bg)'
              : msg.sender_assigned_color ?? 'var(--color-bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '0.6875rem',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {isLila ? 'L' : (msg.sender_display_name ?? '?')[0].toUpperCase()}
        </div>
      )}

      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {showSender && !isOwn && (
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem', paddingLeft: '0.25rem' }}>
            {isLila ? 'LiLa' : msg.sender_display_name}
          </span>
        )}

        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            backgroundColor: isOwn
              ? 'var(--color-btn-primary-bg)'
              : isLila
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-secondary))'
                : 'var(--color-bg-secondary)',
            color: isOwn ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
            fontSize: '0.875rem',
            lineHeight: '1.4',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {msg.content}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem', paddingLeft: '0.25rem' }}>
          <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
            {formatTime(msg.created_at)}
          </span>
          {msg.is_edited && (
            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
              (edited)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChatThreadView({ threadId, threadTitle, spaceId, participantNames }: ChatThreadViewProps) {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(threadId)
  const sendMessage = useSendMessage()
  const renameThread = useRenameThread()

  // Subscribe to realtime
  useThreadRealtime(threadId)

  // All messages flattened from pages
  const allMessages = useMemo(() => {
    if (!data?.pages) return []
    // Pages are loaded newest-first, but each page is already reversed to chronological.
    // We need oldest pages first.
    const pages = [...data.pages].reverse()
    return pages.flatMap(p => p.messages)
  }, [data])

  // Latest message for auto-mark-read
  const latestMessageId = allMessages.length > 0 ? allMessages[allMessages.length - 1].id : undefined
  useAutoMarkRead(threadId, latestMessageId)

  // Auto-scroll to bottom
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(threadTitle ?? '')

  useEffect(() => {
    // Scroll to bottom on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  // Load older on scroll to top
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasNextPage || isFetchingNextPage) return
    if (containerRef.current.scrollTop < 100) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleSend = useCallback((content: string) => {
    if (!threadId) return
    sendMessage.mutate({ thread_id: threadId, content })
  }, [threadId, sendMessage])

  const handleSaveTitle = useCallback(() => {
    if (!threadId || !editTitle.trim()) return
    renameThread.mutate({ threadId, title: editTitle.trim() })
    setIsEditing(false)
  }, [threadId, editTitle, renameThread])

  // Group messages by date for date separators
  const messagesWithSeparators = useMemo(() => {
    const result: Array<{ type: 'date'; date: string } | { type: 'message'; msg: MessageWithSender; showSender: boolean }> = []
    let lastDate = ''
    let lastSenderId = ''

    for (const msg of allMessages) {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== lastDate) {
        result.push({ type: 'date', date: msg.created_at })
        lastDate = msgDate
        lastSenderId = ''
      }
      const showSender = msg.sender_member_id !== lastSenderId
      result.push({ type: 'message', msg, showSender })
      lastSenderId = msg.sender_member_id ?? ''
    }

    return result
  }, [allMessages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        <button
          onClick={() => navigate(`/messages/space/${spaceId}`)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            padding: '0.25rem',
            display: 'flex',
          }}
          aria-label="Back to space"
        >
          <ArrowLeft size={20} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle() }}
              autoFocus
              style={{
                width: '100%',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 6px)',
                padding: '0.25rem 0.5rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {threadTitle ?? 'New Conversation'}
              </span>
              <button
                onClick={() => { setEditTitle(threadTitle ?? ''); setIsEditing(true) }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '0.125rem',
                  display: 'flex',
                }}
                aria-label="Edit title"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}
          {participantNames && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {participantNames}
            </p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          paddingTop: '0.75rem',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Load older indicator */}
        {isFetchingNextPage && (
          <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--color-text-muted)' }}>
            <Loader2 size={16} className="animate-spin" style={{ display: 'inline-block' }} />
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            Loading messages...
          </div>
        ) : allMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Start the conversation...
          </div>
        ) : (
          messagesWithSeparators.map((item, i) => {
            if (item.type === 'date') {
              return (
                <div
                  key={`date-${i}`}
                  style={{
                    textAlign: 'center',
                    padding: '0.5rem 0',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  {formatDateSeparator(item.date)}
                </div>
              )
            }
            return (
              <MessageBubble
                key={item.msg.id}
                msg={item.msg}
                isOwn={item.msg.sender_member_id === memberId}
                showSender={item.showSender}
              />
            )
          })
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInputBar
        onSend={handleSend}
        disabled={sendMessage.isPending}
      />
    </div>
  )
}
