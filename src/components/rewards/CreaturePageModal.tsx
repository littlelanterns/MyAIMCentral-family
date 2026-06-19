/**
 * CreaturePageModal — KIDS-REWARDS-PAGE Slice 3.
 *
 * Full-screen wrapper around <CreaturePageFrame> opened by the dashboard
 * "sticker page" door widget and the Play sticker-book widget. The door on the
 * dashboard is a view-only viewport; all the interaction (swipe, place, carry
 * to another background, remove) lives here in the modal (gate Section 4 —
 * "a window, not a toy").
 */

import { X, BookOpen } from 'lucide-react'
import { CreaturePageFrame } from './CreaturePageFrame'

interface CreaturePageModalProps {
  memberId: string
  onClose: () => void
  variant?: 'standard' | 'play'
  /** Open directly to this background (e.g. from a page-unlock reveal). */
  initialPageId?: string | null
}

export function CreaturePageModal({
  memberId,
  onClose,
  variant = 'standard',
  initialPageId = null,
}: CreaturePageModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="My Sticker Book"
      data-testid="creature-page-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary, #fff)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={20} color="var(--color-btn-primary-bg)" aria-hidden="true" />
          <div
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            My Sticker Book
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sticker book"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            cursor: 'pointer',
            color: 'var(--color-text-primary)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0.75rem' }}>
        <CreaturePageFrame
          memberId={memberId}
          variant={variant}
          initialPageId={initialPageId}
          tall
        />
      </div>
    </div>
  )
}
