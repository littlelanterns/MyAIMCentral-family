/**
 * MessagesPage — PRD-15 Screen 1 + Screen 2 + Screen 3
 *
 * Messages home with two tabs (Spaces / Chats), search, compose.
 * Sub-routes for individual spaces and threads.
 * Auto-initializes conversation spaces on first visit.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageCircle, Search, PenSquare, Loader2,
} from 'lucide-react'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useConversationSpaces, SPACES_KEY } from '@/hooks/useConversationSpaces'
import { useAllThreads } from '@/hooks/useConversationThreads'
import { useSpacesRealtime } from '@/hooks/useMessagingRealtime'
import { useQueryClient } from '@tanstack/react-query'
import { initializeConversationSpaces } from '@/utils/initializeConversationSpaces'
import { SpaceListItem } from '@/components/messaging/SpaceListItem'
import { ComposeFlow } from '@/components/messaging/ComposeFlow'
import { MessageSearch } from '@/components/messaging/MessageSearch'
import { FeatureGuide } from '@/components/shared'
import type { ConversationThreadWithPreview } from '@/types/messaging'

type Tab = 'spaces' | 'chats'

/** Thread row for the "Chats" tab — shows thread across all spaces */
function ChatRow({
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
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: 'var(--color-bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          flexShrink: 0,
        }}
      >
        <MessageCircle size={16} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                flexShrink: 0,
              }}
            >
              {unread}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          {thread.space_name && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              {thread.space_name}
            </span>
          )}
          {thread.last_message_preview && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {thread.space_name ? ' — ' : ''}{thread.last_message_preview}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function MessagesPage() {
  const navigate = useNavigate()
  const { data: currentMember } = useFamilyMember()
  const { data: currentFamily } = useFamily()
  const { data: allMembers } = useFamilyMembers(currentFamily?.id)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<Tab>('spaces')
  const [showCompose, setShowCompose] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const initRef = useRef(false)

  const memberId = currentMember?.id
  const familyId = currentFamily?.id

  // Initialize spaces on first visit
  useEffect(() => {
    if (!familyId || !memberId || !allMembers?.length || initRef.current) return
    initRef.current = true

    const activeMembers = allMembers.filter(m => m.is_active && !m.out_of_nest)
    const activeIds = activeMembers.map(m => m.id)

    setInitializing(true)
    initializeConversationSpaces({
      familyId,
      currentMemberId: memberId,
      allMemberIds: activeIds,
      memberProfiles: activeMembers.map(m => ({
        id: m.id,
        role: m.role,
        age: m.age ?? null,
      })),
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: [SPACES_KEY] })
      })
      .catch(err => {
        console.error('[MessagesPage] Initialization error:', err)
      })
      .finally(() => {
        setInitializing(false)
      })
  }, [familyId, memberId, allMembers, queryClient])

  // Fetch data
  const { data: spaces, isLoading: spacesLoading } = useConversationSpaces()
  const { data: allThreads, isLoading: chatsLoading } = useAllThreads()

  // Subscribe to space-level realtime
  useSpacesRealtime(familyId)

  const isLoading = initializing || (activeTab === 'spaces' ? spacesLoading : chatsLoading)

  const handleSpaceClick = useCallback((spaceId: string) => {
    navigate(`/messages/space/${spaceId}`)
  }, [navigate])

  const handleChatClick = useCallback((thread: ConversationThreadWithPreview) => {
    navigate(`/messages/thread/${thread.id}`)
  }, [navigate])

  // Initializing state
  if (initializing) {
    return (
      <div className="density-comfortable" style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)', margin: '0 auto 1rem' }} />
        <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          Setting up your family conversations...
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          This only happens once.
        </p>
      </div>
    )
  }

  return (
    <div className="density-compact" style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Messages
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowSearch(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '0.375rem',
              display: 'flex',
              borderRadius: 'var(--vibe-radius-input, 6px)',
            }}
            aria-label="Search messages"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setShowCompose(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-btn-primary-bg)',
              padding: '0.375rem',
              display: 'flex',
              borderRadius: 'var(--vibe-radius-input, 6px)',
            }}
            aria-label="New message"
          >
            <PenSquare size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--color-border)',
          padding: '0 1rem',
        }}
      >
        {(['spaces', 'chats'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '0.625rem 0.5rem',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--color-btn-primary-bg)' : '2px solid transparent',
              background: 'none',
              color: activeTab === tab ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === tab ? 600 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              marginBottom: '-2px',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading...
          </div>
        ) : activeTab === 'spaces' ? (
          // Spaces tab
          !spaces?.length ? (
            <div style={{ padding: '2rem 1rem' }}>
              <FeatureGuide featureKey="messaging_basic" />
            </div>
          ) : (
            spaces.map(space => (
              <SpaceListItem
                key={space.id}
                space={space}
                currentMemberId={memberId!}
                onClick={() => handleSpaceClick(space.id)}
              />
            ))
          )
        ) : (
          // Chats tab
          !allThreads?.length ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No conversations yet. Start one from a conversation space.
            </div>
          ) : (
            allThreads.map(thread => (
              <ChatRow
                key={thread.id}
                thread={thread}
                onClick={() => handleChatClick(thread)}
              />
            ))
          )
        )}
      </div>

      {/* Compose Flow modal */}
      {showCompose && (
        <ComposeFlow
          isOpen={showCompose}
          onClose={() => setShowCompose(false)}
        />
      )}

      {/* Search overlay */}
      {showSearch && (
        <MessageSearch
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}
