/**
 * SpaceListItem — PRD-15 Screen 1
 *
 * A row in the conversation spaces list.
 * Shows avatar/icon, name, preview, timestamp, unread badge.
 */

import { Users, Radio, MessageCircle } from 'lucide-react'
import { getMemberColor } from '@/lib/memberColors'
import type { ConversationSpaceWithPreview } from '@/types/messaging'

interface SpaceListItemProps {
  space: ConversationSpaceWithPreview
  currentMemberId: string
  onClick: () => void
}

function getSpaceDisplayName(space: ConversationSpaceWithPreview, currentMemberId: string): string {
  if (space.name) return space.name
  if (space.space_type === 'direct' && space.members) {
    const other = space.members.find(m => m.family_member_id !== currentMemberId)
    return other?.display_name ?? 'Direct Message'
  }
  if (space.space_type === 'family') return 'Whole Family'
  if (space.space_type === 'content_corner') return 'Content Corner'
  return 'Conversation'
}

function getSpaceIcon(space: ConversationSpaceWithPreview, currentMemberId: string) {
  if (space.space_type === 'direct' && space.members) {
    const other = space.members.find(m => m.family_member_id !== currentMemberId)
    if (other) {
      return (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: getMemberColor(other),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
            flexShrink: 0,
          }}
        >
          {(other.display_name ?? '?')[0].toUpperCase()}
        </div>
      )
    }
  }

  const Icon = space.space_type === 'content_corner'
    ? Radio
    : space.space_type === 'family' || space.space_type === 'group'
      ? Users
      : MessageCircle

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: 'var(--color-bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)',
        flexShrink: 0,
      }}
    >
      <Icon size={18} />
    </div>
  )
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
  const diffMonth = Math.floor(diffDay / 30)
  return `${diffMonth}mo`
}

export function SpaceListItem({ space, currentMemberId, onClick }: SpaceListItemProps) {
  const name = getSpaceDisplayName(space, currentMemberId)
  const unread = space.unread_count ?? 0

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
      {getSpaceIcon(space, currentMemberId)}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontWeight: unread > 0 ? 600 : 500,
              fontSize: '0.9375rem',
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {space.last_message_at && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {formatTimeAgo(space.last_message_at)}
              </span>
            )}
            {unread > 0 && (
              <span
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary, #fff)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>

        {space.last_message_preview && (
          <p
            style={{
              margin: '0.125rem 0 0',
              fontSize: '0.8125rem',
              color: unread > 0 ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
              fontWeight: unread > 0 ? 500 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {space.last_message_sender ? `${space.last_message_sender}: ` : ''}
            {space.last_message_preview}
          </p>
        )}
      </div>
    </button>
  )
}
