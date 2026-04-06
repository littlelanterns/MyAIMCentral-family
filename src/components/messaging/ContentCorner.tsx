/**
 * ContentCorner — PRD-15 Phase E (Screen 4)
 *
 * Special view for the content_corner conversation space.
 * Two modes: Feed (chronological list) and Playlist (sequential with Next).
 *
 * Mom controls:
 *   - Viewing mode: "browse" (default) or "locked" (until date/time)
 *   - When locked: members can ADD links but cannot VIEW until unlock
 *   - Who can add links: all members or specific members
 *
 * Links are messages with message_type = 'content_corner_link'
 * and URL metadata in the metadata JSONB field.
 */

import { useState, useMemo, useCallback } from 'react'
import { Plus, PlayCircle, List, Lock, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMessages, useSendMessage } from '@/hooks/useMessages'
import { useThreadRealtime } from '@/hooks/useMessagingRealtime'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { LinkPreviewCard } from './LinkPreviewCard'
import type { MessageWithSender, MessagingSettings } from '@/types/messaging'

interface ContentCornerProps {
  threadId: string
  settings?: MessagingSettings | null
  isMom: boolean
}

function extractUrlMetadata(url: string): { url: string; title?: string; domain?: string } {
  try {
    const parsed = new URL(url)
    return {
      url,
      domain: parsed.hostname.replace('www.', ''),
    }
  } catch {
    return { url }
  }
}

export function ContentCorner({ threadId, settings, isMom }: ContentCornerProps) {
  const [mode, setMode] = useState<'feed' | 'playlist'>('feed')
  const [playlistIndex, setPlaylistIndex] = useState(0)
  const [showAddLink, setShowAddLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

  const { data: currentMember } = useFamilyMember()
  const { data, isLoading } = useMessages(threadId)
  const sendMessage = useSendMessage()

  useThreadRealtime(threadId)

  // Filter to content_corner_link messages only
  const linkMessages = useMemo(() => {
    if (!data?.pages) return []
    const allMessages = data.pages.flatMap(p => p.messages)
    return allMessages.filter(m => m.message_type === 'content_corner_link')
  }, [data])

  // Check viewing lock
  const isLocked = useMemo(() => {
    if (!settings || settings.content_corner_viewing_mode !== 'locked') return false
    if (isMom) return false // Mom can always view
    if (!settings.content_corner_locked_until) return true
    return new Date(settings.content_corner_locked_until) > new Date()
  }, [settings, isMom])

  // Check add permission
  const canAdd = useMemo(() => {
    if (isMom) return true
    if (!settings?.content_corner_who_can_add) return true
    const allowed = settings.content_corner_who_can_add as string[]
    if (allowed.includes('all')) return true
    return currentMember?.id ? allowed.includes(currentMember.id) : false
  }, [settings, isMom, currentMember])

  const handleAddLink = useCallback(() => {
    const trimmed = linkUrl.trim()
    if (!trimmed || !threadId) return

    // Ensure it looks like a URL
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const meta = extractUrlMetadata(url)

    sendMessage.mutate({
      thread_id: threadId,
      content: url,
      message_type: 'content_corner_link',
      metadata: {
        url: meta.url,
        domain: meta.domain,
      },
    })

    setLinkUrl('')
    setShowAddLink(false)
  }, [linkUrl, threadId, sendMessage])

  if (isLocked) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          gap: '1rem',
          height: '100%',
        }}
      >
        <Lock size={32} style={{ color: 'var(--color-text-muted)' }} />
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>
            Content Corner is locked
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {settings?.content_corner_locked_until
              ? `Opens ${new Date(settings.content_corner_locked_until).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}`
              : 'Check back later!'}
          </p>
        </div>

        {/* Can still add links while locked */}
        {canAdd && (
          <div style={{ marginTop: '0.5rem' }}>
            {showAddLink ? (
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="Paste a link..."
                  onKeyDown={e => { if (e.key === 'Enter') handleAddLink() }}
                  autoFocus
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    padding: '0.375rem 0.5rem',
                    fontSize: '0.8125rem',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    width: 220,
                  }}
                />
                <button
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim()}
                  style={{
                    padding: '0.375rem 0.625rem',
                    borderRadius: 'var(--vibe-radius-input, 6px)',
                    border: 'none',
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-text-on-primary, #fff)',
                    fontSize: '0.8125rem',
                    cursor: linkUrl.trim() ? 'pointer' : 'default',
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddLink(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--vibe-radius-input, 6px)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                Add a link for later
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header: mode toggle + add button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-primary)',
        }}
      >
        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            borderRadius: 'var(--vibe-radius-input, 6px)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <button
            onClick={() => setMode('feed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.3125rem 0.625rem',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: mode === 'feed'
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-bg-secondary)',
              color: mode === 'feed'
                ? 'var(--color-text-on-primary, #fff)'
                : 'var(--color-text-secondary)',
            }}
          >
            <List size={13} />
            Feed
          </button>
          <button
            onClick={() => { setMode('playlist'); setPlaylistIndex(0) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.3125rem 0.625rem',
              border: 'none',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: mode === 'playlist'
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-bg-secondary)',
              color: mode === 'playlist'
                ? 'var(--color-text-on-primary, #fff)'
                : 'var(--color-text-secondary)',
            }}
          >
            <PlayCircle size={13} />
            Playlist
          </button>
        </div>

        {/* Add link */}
        {canAdd && (
          <button
            onClick={() => setShowAddLink(!showAddLink)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.3125rem 0.5rem',
              borderRadius: 'var(--vibe-radius-input, 6px)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            Add Link
          </button>
        )}
      </div>

      {/* Add link input */}
      {showAddLink && (
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="Paste a URL..."
            onKeyDown={e => { if (e.key === 'Enter') handleAddLink() }}
            autoFocus
            style={{
              flex: 1,
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 6px)',
              padding: '0.375rem 0.5rem',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            onClick={handleAddLink}
            disabled={!linkUrl.trim() || sendMessage.isPending}
            style={{
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--vibe-radius-input, 6px)',
              border: 'none',
              backgroundColor: linkUrl.trim()
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-bg-tertiary)',
              color: linkUrl.trim()
                ? 'var(--color-text-on-primary, #fff)'
                : 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              cursor: linkUrl.trim() ? 'pointer' : 'default',
            }}
          >
            Share
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Loading...
          </div>
        ) : linkMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            <PlayCircle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>No links shared yet</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>
              Share videos, articles, and reels for the family to enjoy together.
            </p>
          </div>
        ) : mode === 'feed' ? (
          <FeedView messages={linkMessages} />
        ) : (
          <PlaylistView
            messages={linkMessages}
            currentIndex={playlistIndex}
            onPrevious={() => setPlaylistIndex(i => Math.max(0, i - 1))}
            onNext={() => setPlaylistIndex(i => Math.min(linkMessages.length - 1, i + 1))}
          />
        )}
      </div>
    </div>
  )
}

// ── Feed View ──

function FeedView({ messages }: { messages: MessageWithSender[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {messages.map(msg => {
        const meta = (msg.metadata || {}) as Record<string, unknown>
        return (
          <LinkPreviewCard
            key={msg.id}
            metadata={{
              url: (meta.url as string) || msg.content,
              title: meta.title as string | undefined,
              domain: meta.domain as string | undefined,
              thumbnail_url: meta.thumbnail_url as string | undefined,
            }}
            senderName={msg.sender_display_name}
            timestamp={msg.created_at}
          />
        )
      })}
    </div>
  )
}

// ── Playlist View ──

function PlaylistView({
  messages,
  currentIndex,
  onPrevious,
  onNext,
}: {
  messages: MessageWithSender[]
  currentIndex: number
  onPrevious: () => void
  onNext: () => void
}) {
  const current = messages[currentIndex]
  if (!current) return null

  const meta = (current.metadata || {}) as Record<string, unknown>
  const url = (meta.url as string) || current.content
  const isFirst = currentIndex === 0
  const isLast = currentIndex === messages.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      {/* Progress indicator */}
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        {currentIndex + 1} of {messages.length}
      </div>

      {/* Current link */}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <LinkPreviewCard
          metadata={{
            url,
            title: meta.title as string | undefined,
            domain: meta.domain as string | undefined,
            thumbnail_url: meta.thumbnail_url as string | undefined,
          }}
          senderName={current.sender_display_name}
          timestamp={current.created_at}
        />
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={onPrevious}
          disabled={isFirst}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem 0.875rem',
            borderRadius: 'var(--vibe-radius-input, 6px)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: isFirst ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
            cursor: isFirst ? 'default' : 'pointer',
            fontSize: '0.8125rem',
          }}
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={isLast}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem 0.875rem',
            borderRadius: 'var(--vibe-radius-input, 6px)',
            border: 'none',
            backgroundColor: isLast ? 'var(--color-bg-tertiary)' : 'var(--color-btn-primary-bg)',
            color: isLast ? 'var(--color-text-muted)' : 'var(--color-text-on-primary, #fff)',
            cursor: isLast ? 'default' : 'pointer',
            fontSize: '0.8125rem',
          }}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
