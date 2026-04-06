/**
 * CoachingCheckpoint — PRD-15 Phase E
 *
 * Before-send overlay shown when message coaching detects a concern.
 * Shows mom's custom prompt or Family Communication Guidelines excerpt
 * plus LiLa's coaching note. Two actions: Edit Message / Send Anyway.
 *
 * Coaching is NEVER a blocker — "Send Anyway" always available.
 */

import { MessageCircleHeart, Pencil, Send } from 'lucide-react'

interface CoachingCheckpointProps {
  coachingNote: string
  guidelinesExcerpt?: string
  onEdit: () => void
  onSendAnyway: () => void
  isLoading?: boolean
}

export function CoachingCheckpoint({
  coachingNote,
  guidelinesExcerpt,
  onEdit,
  onSendAnyway,
  isLoading,
}: CoachingCheckpointProps) {
  if (isLoading) {
    return (
      <div
        className="animate-slideUp"
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-primary))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
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
            flexShrink: 0,
          }}
        >
          <MessageCircleHeart size={14} color="var(--color-text-on-primary, #fff)" />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Checking message...
        </span>
      </div>
    )
  }

  return (
    <div
      className="animate-slideUp"
      style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-primary))',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'var(--color-btn-primary-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MessageCircleHeart size={12} color="var(--color-text-on-primary, #fff)" />
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          Communication Check
        </span>
      </div>

      {/* Guidelines excerpt (if provided) */}
      {guidelinesExcerpt && (
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          {guidelinesExcerpt}
        </p>
      )}

      {/* Coaching note */}
      <p
        style={{
          margin: 0,
          fontSize: '0.8125rem',
          color: 'var(--color-text-primary)',
          lineHeight: 1.5,
        }}
      >
        {coachingNote}
      </p>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--vibe-radius-input, 6px)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Pencil size={13} />
          Edit Message
        </button>
        <button
          onClick={onSendAnyway}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            borderRadius: 'var(--vibe-radius-input, 6px)',
            border: 'none',
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-text-on-primary, #fff)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Send size={13} />
          Send Anyway
        </button>
      </div>
    </div>
  )
}
