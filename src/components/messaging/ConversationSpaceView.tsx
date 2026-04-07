/**
 * ConversationSpaceView — PRD-15 Screen 2
 *
 * Thread list within a conversation space.
 * Sorted by pinned first, then last_message_at.
 * New conversation button at bottom.
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PenSquare, Pin, MessageCircle, Settings2 } from 'lucide-react'
import { useConversationThreads, useCreateThread } from '@/hooks/useConversationThreads'
import { EmptyState } from '@/components/shared'
import { ManageGroupModal } from './ManageGroupModal'
import type { ConversationSpaceWithPreview, ConversationThreadWithPreview } from '@/types/messaging'

interface ConversationSpaceViewProps {
  spaceId: string
  spaceName: string
  /** Full space object — required for Manage Group button (group spaces only) */
  space?: ConversationSpaceWithPreview
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'now'
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d`
  const diffWeek = Math.floor(diffDay / 7)
  if (diffWeek < 5) return `${diffWeek}w`
  return `${Math.floor(diffDay / 30)}mo`
}

function ThreadRow({
  thread,
  onClick,
}: {
  thread: ConversationThreadWithPreview
  onClick: () => void
}) {
  const unread = thread.unread_count ?? 0

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.75rem 1rem',
        border: 'none',
        borderBottom: '1px solid var(--color-border)',
        background: unread > 0 ? 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, transparent)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {thread.is_pinned && (
        <Pin size={13} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontWeight: unread > 0 ? 600 : 500,
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {thread.title ?? 'New Conversation'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {thread.last_message_at && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {formatTimeAgo(thread.last_message_at)}
              </span>
            )}
            {unread > 0 && (
              <span
                style={{
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary, #fff)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {unread}
              </span>
            )}
          </div>
        </div>

        {thread.last_message_preview && (
          <p
            style={{
              margin: '0.125rem 0 0',
              fontSize: '0.8125rem',
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {thread.last_message_sender ? `${thread.last_message_sender}: ` : ''}
            {thread.last_message_preview}
          </p>
        )}
      </div>
    </button>
  )
}

export function ConversationSpaceView({ spaceId, spaceName, space }: ConversationSpaceViewProps) {
  const navigate = useNavigate()
  const { data: threads, isLoading } = useConversationThreads(spaceId)
  const createThread = useCreateThread()
  const [composing, setComposing] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [manageOpen, setManageOpen] = useState(false)

  const isGroup = space?.space_type === 'group'

  const handleNewThread = useCallback(async () => {
    if (!newMessage.trim()) return
    const thread = await createThread.mutateAsync({
      space_id: spaceId,
      content: newMessage.trim(),
    })
    setNewMessage('')
    setComposing(false)
    navigate(`/messages/thread/${thread.id}`)
  }, [spaceId, newMessage, createThread, navigate])

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
          onClick={() => navigate('/messages')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            padding: '0.25rem',
            display: 'flex',
          }}
          aria-label="Back to messages"
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ flex: 1, fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
          {spaceName}
          {isGroup && space?.members && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
              · {space.members.length} members
            </span>
          )}
        </span>
        {isGroup && space && (
          <button
            onClick={() => setManageOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '0.25rem',
              display: 'flex',
            }}
            aria-label="Manage group"
            title="Manage group"
          >
            <Settings2 size={18} />
          </button>
        )}
        <button
          onClick={() => setComposing(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-btn-primary-bg)',
            padding: '0.25rem',
            display: 'flex',
          }}
          aria-label="New conversation"
        >
          <PenSquare size={18} />
        </button>
      </div>

      {/* Manage Group modal — group spaces only */}
      {isGroup && space && (
        <ManageGroupModal
          isOpen={manageOpen}
          onClose={() => setManageOpen(false)}
          space={space}
        />
      )}

      {/* Thread list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading conversations...
          </div>
        ) : !threads?.length ? (
          <div style={{ padding: '2rem 1rem' }}>
            <EmptyState
              icon={<MessageCircle size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />}
              title="No conversations yet"
              description="Start a new conversation to get things going."
            />
          </div>
        ) : (
          threads.map(thread => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              onClick={() => navigate(`/messages/thread/${thread.id}`)}
            />
          ))
        )}
      </div>

      {/* Quick compose for new thread */}
      {composing && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            display: 'flex',
            gap: '0.5rem',
          }}
        >
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleNewThread()
              }
              if (e.key === 'Escape') {
                setComposing(false)
                setNewMessage('')
              }
            }}
            placeholder="Start a new conversation..."
            autoFocus
            rows={2}
            style={{
              flex: 1,
              resize: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-bg-secondary)',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleNewThread}
            disabled={!newMessage.trim() || createThread.isPending}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-text-on-primary, #fff)',
              fontWeight: 500,
              fontSize: '0.8125rem',
              cursor: newMessage.trim() ? 'pointer' : 'default',
              opacity: newMessage.trim() ? 1 : 0.5,
              alignSelf: 'flex-end',
            }}
          >
            Send
          </button>
        </div>
      )}

      {/* New conversation button (when not composing) */}
      {!composing && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setComposing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              width: '100%',
              padding: '0.625rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px dashed var(--color-border)',
              background: 'transparent',
              color: 'var(--color-btn-primary-bg)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <PenSquare size={15} /> New Conversation
          </button>
        </div>
      )}
    </div>
  )
}
