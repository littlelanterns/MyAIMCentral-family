/**
 * ChatThreadView — PRD-15 Screen 3 + Phase E
 *
 * Chat bubbles with auto-scroll, mark read on mount, load older pagination.
 * Sender avatars/initials, timestamps, system messages centered.
 * Supabase Realtime for new messages.
 *
 * Phase E additions:
 *   - LiLa "Ask LiLa & Send" streaming display
 *   - Before-send coaching checkpoint
 *   - Auto-title thread after first reply
 */

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react'
import { useMessages, useSendMessage, useAutoMarkRead } from '@/hooks/useMessages'
import { useThreadRealtime } from '@/hooks/useMessagingRealtime'
import { useRenameThread } from '@/hooks/useConversationThreads'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useLilaMessageRespond } from '@/hooks/useLilaMessageRespond'
import { useMessageCoaching } from '@/hooks/useMessageCoaching'
import { getMemberColor } from '@/lib/memberColors'
import { MessageInputBar } from './MessageInputBar'
import { CoachingCheckpoint } from './CoachingCheckpoint'
import { supabase } from '@/lib/supabase/client'
import type { MessageWithSender } from '@/types/messaging'

interface ChatThreadViewProps {
  threadId: string
  threadTitle: string | null
  spaceId: string
  participantNames?: string
  showLilaButton?: boolean
  coachingEnabled?: boolean
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
              : getMemberColor({ assigned_color: msg.sender_assigned_color, member_color: msg.sender_member_color }),
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

export function ChatThreadView({
  threadId,
  threadTitle,
  spaceId,
  participantNames,
  showLilaButton = false,
  coachingEnabled = false,
}: ChatThreadViewProps) {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const memberId = currentMember?.id

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(threadId)
  const sendMessage = useSendMessage()
  const renameThread = useRenameThread()
  const { invokeLila, isStreaming: lilaStreaming, streamedContent: lilaStreamedContent } = useLilaMessageRespond()
  const { checkCoaching, recordCoachedSend } = useMessageCoaching()

  // Coaching checkpoint state
  const [coachingState, setCoachingState] = useState<{
    active: boolean
    loading: boolean
    note: string
    pendingContent: string
  }>({ active: false, loading: false, note: '', pendingContent: '' })

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
    // Scroll to bottom on new messages or LiLa streaming
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length, lilaStreamedContent])

  // Load older on scroll to top
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !hasNextPage || isFetchingNextPage) return
    if (containerRef.current.scrollTop < 100) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Auto-title after 2nd message if title is still null
  const triggerAutoTitle = useCallback(async (tId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-title-thread`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thread_id: tId }),
      }).catch(() => {}) // Fire-and-forget
    } catch {
      // Ignore
    }
  }, [])

  const handleSend = useCallback((content: string) => {
    if (!threadId) return
    sendMessage.mutate(
      { thread_id: threadId, content },
      {
        onSuccess: () => {
          // Check if we should auto-title (thread has ~2 messages and no title)
          const totalMessages = allMessages.length + 1 // +1 for the one we just sent
          if (totalMessages === 2 && !threadTitle) {
            triggerAutoTitle(threadId)
          }
        },
      },
    )
  }, [threadId, sendMessage, allMessages.length, threadTitle, triggerAutoTitle])

  // Coaching intercept: returns true if message should send, false if user wants to edit
  const handleCoachingIntercept = useCallback(async (content: string): Promise<boolean> => {
    setCoachingState({ active: true, loading: true, note: '', pendingContent: content })

    const result = await checkCoaching(threadId, content)

    if (result.isClean || !result.shouldCoach) {
      // Message is fine — send immediately
      setCoachingState({ active: false, loading: false, note: '', pendingContent: '' })
      recordCoachedSend()
      return true
    }

    // Show coaching checkpoint
    setCoachingState({ active: true, loading: false, note: result.coachingNote, pendingContent: content })
    return false // Don't send yet
  }, [threadId, checkCoaching, recordCoachedSend])

  const handleCoachingSendAnyway = useCallback(() => {
    const content = coachingState.pendingContent
    setCoachingState({ active: false, loading: false, note: '', pendingContent: '' })
    recordCoachedSend()
    if (content && threadId) {
      sendMessage.mutate({ thread_id: threadId, content })
    }
  }, [coachingState.pendingContent, threadId, sendMessage, recordCoachedSend])

  const handleCoachingEdit = useCallback(() => {
    // Close coaching checkpoint — user goes back to editing (text still in input)
    setCoachingState({ active: false, loading: false, note: '', pendingContent: '' })
  }, [])

  // "Ask LiLa & Send" handler
  const handleSendWithLila = useCallback((content: string) => {
    if (!threadId) return
    // First send the user's message normally
    sendMessage.mutate(
      { thread_id: threadId, content },
      {
        onSuccess: () => {
          // Then invoke LiLa to respond
          invokeLila(threadId, content)
        },
      },
    )
  }, [threadId, sendMessage, invokeLila])

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

        {/* LiLa streaming response (shown while streaming) */}
        {lilaStreaming && lilaStreamedContent && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              padding: '0.125rem 1rem',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--color-btn-primary-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.6875rem',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              L
            </div>
            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '0.125rem', paddingLeft: '0.25rem' }}>
                LiLa
              </span>
              <div
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px 12px 12px 2px',
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-secondary))',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {lilaStreamedContent}
                <span
                  className="animate-cursor-blink"
                  aria-hidden="true"
                  style={{ marginLeft: '1px', fontWeight: 600 }}
                >
                  |
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Coaching Checkpoint (shown above input when coaching triggers) */}
      {coachingState.active && (
        <CoachingCheckpoint
          coachingNote={coachingState.note}
          onEdit={handleCoachingEdit}
          onSendAnyway={handleCoachingSendAnyway}
          isLoading={coachingState.loading}
        />
      )}

      {/* Input */}
      {!coachingState.active && (
        <MessageInputBar
          onSend={handleSend}
          onSendWithLila={showLilaButton ? handleSendWithLila : undefined}
          onCoachingIntercept={coachingEnabled ? handleCoachingIntercept : undefined}
          showLilaButton={showLilaButton}
          coachingEnabled={coachingEnabled}
          disabled={sendMessage.isPending || lilaStreaming}
          lilaStreaming={lilaStreaming}
        />
      )}
    </div>
  )
}
