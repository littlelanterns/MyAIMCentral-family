/**
 * RequestCard (PRD-15 Screen 8)
 *
 * Card for a single family request in the RequestsTab.
 * Accept dropdown (Calendar/Tasks/List/Acknowledge),
 * Decline dropdown (optional note + Discuss stub),
 * Snooze button.
 * MindSweep attribution badge when source starts with 'mindsweep'.
 * Zero hardcoded colors — all CSS custom properties.
 */

import { useState } from 'react'
import {
  Calendar, CheckSquare, List, ThumbsUp,
  Clock, ChevronDown, MessageCircle, Wand2, User,
} from 'lucide-react'
import type { FamilyRequestWithSender, RequestRoutedTo } from '@/types/messaging'

interface RequestCardProps {
  request: FamilyRequestWithSender
  onAccept: (request: FamilyRequestWithSender, routedTo: RequestRoutedTo) => void
  onDecline: (request: FamilyRequestWithSender, note?: string) => void
  onSnooze: (request: FamilyRequestWithSender) => void
  onDiscuss: (request: FamilyRequestWithSender) => void
}

const ACCEPT_OPTIONS: { key: RequestRoutedTo; label: string; icon: typeof Calendar }[] = [
  { key: 'calendar', label: 'Add to Calendar', icon: Calendar },
  { key: 'tasks', label: 'Add to Tasks', icon: CheckSquare },
  { key: 'list', label: 'Add to List', icon: List },
  { key: 'acknowledged', label: 'Just Acknowledge', icon: ThumbsUp },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function RequestCard({ request, onAccept, onDecline, onSnooze, onDiscuss }: RequestCardProps) {
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineNote, setDeclineNote] = useState('')

  const isMindSweep = request.source.startsWith('mindsweep')
  const avatarColor = request.sender_assigned_color || 'var(--color-btn-primary-bg)'

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      {/* Header: sender avatar + name + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Avatar circle */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {request.sender_avatar_url ? (
            <img
              src={request.sender_avatar_url}
              alt=""
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <User size={14} style={{ color: 'var(--color-text-on-primary, #fff)' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
            {request.sender_display_name || 'Family Member'}
          </span>
          {request.when_text && (
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
              &bull; {request.when_text}
            </span>
          )}
        </div>

        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {timeAgo(request.created_at)}
        </span>
      </div>

      {/* Title */}
      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-heading)' }}>
        {request.title}
      </div>

      {/* Details */}
      {request.details && (
        <div style={{
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.45,
          whiteSpace: 'pre-wrap',
        }}>
          {request.details}
        </div>
      )}

      {/* MindSweep attribution badge */}
      {isMindSweep && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Wand2 size={12} style={{ color: 'var(--color-accent)' }} />
          <span style={{
            fontSize: '0.6875rem',
            color: 'var(--color-accent)',
            fontWeight: 500,
          }}>
            From MindSweep
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
        {/* Accept dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setAcceptOpen(!acceptOpen); setDeclineOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              background: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
              color: 'var(--color-btn-primary-bg)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Accept <ChevronDown size={14} />
          </button>
          {acceptOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.25rem',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                zIndex: 10,
                minWidth: '180px',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-border)',
              }}>
                Route this request:
              </div>
              {ACCEPT_OPTIONS.map(opt => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setAcceptOpen(false)
                      onAccept(request, opt.key)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-secondary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <Icon size={15} style={{ color: 'var(--color-btn-primary-bg)' }} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Decline dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setDeclineOpen(!declineOpen); setAcceptOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 0.625rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              background: 'color-mix(in srgb, var(--color-btn-primary-hover) 8%, var(--color-bg-card))',
              color: 'var(--color-text-secondary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Decline <ChevronDown size={14} />
          </button>
          {declineOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.25rem',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                zIndex: 10,
                minWidth: '220px',
                padding: '0.75rem',
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: '0.5rem',
              }}>
                Decline with note:
              </div>
              <textarea
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Optional: type a reason"
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-input, var(--color-bg-card))',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.8125rem',
                  resize: 'none',
                  outline: 'none',
                  marginBottom: '0.5rem',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <button
                  onClick={() => {
                    setDeclineOpen(false)
                    onDecline(request, declineNote.trim() || undefined)
                    setDeclineNote('')
                  }}
                  style={{
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    borderRadius: 'var(--vibe-radius-input, 8px)',
                    border: 'none',
                    background: 'color-mix(in srgb, var(--color-btn-primary-hover) 12%, var(--color-bg-card))',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Decline
                </button>
                <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.125rem 0' }} />
                <button
                  onClick={() => {
                    setDeclineOpen(false)
                    onDiscuss(request)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    width: '100%',
                    padding: '0.375rem 0.5rem',
                    borderRadius: 'var(--vibe-radius-input, 8px)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <MessageCircle size={14} /> Discuss (open chat)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Snooze */}
        <button
          onClick={() => onSnooze(request)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.375rem 0.625rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            border: 'none',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          <Clock size={14} /> Snooze
        </button>
      </div>
    </div>
  )
}
