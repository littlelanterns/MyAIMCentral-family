/**
 * QueueBadge — PRD-17 entry point indicator
 *
 * Reusable badge button that opens the UniversalQueueModal.
 * Shows BreathingGlow when items are pending. Can target a specific tab.
 * Used on Dashboard, Tasks page, Calendar page, and sidebar nav items.
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { BreathingGlow } from '@/components/ui/BreathingGlow'
import { UniversalQueueModal } from './UniversalQueueModal'
import type { ReactNode } from 'react'

type TabKey = 'calendar' | 'sort' | 'requests'

interface QueueBadgeProps {
  /** Number of pending items (0 = hidden) */
  count: number
  /** Which tab to open on click */
  defaultTab?: TabKey
  /** Optional label next to icon */
  label?: string
  /** Custom icon (defaults to Inbox) */
  icon?: ReactNode
  /** Compact mode — smaller, no label */
  compact?: boolean
}

export function QueueBadge({ count, defaultTab, label, icon, compact }: QueueBadgeProps) {
  const [open, setOpen] = useState(false)
  const hasItems = count > 0

  // Always render — mom needs to see the door exists even when empty, so
  // she knows nothing is broken. Empty state is dimmed (muted colors, no
  // breathing glow, no numeric badge). Clicking when empty still opens
  // the modal to the "All caught up!" empty state.
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 transition-colors"
        style={{
          padding: compact ? '0.25rem 0.5rem' : '0.35rem 0.75rem',
          borderRadius: '9999px',
          border: '1px solid var(--color-border)',
          backgroundColor: hasItems
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
            : 'var(--color-bg-secondary)',
          color: hasItems
            ? 'var(--color-btn-primary-bg)'
            : 'var(--color-text-secondary)',
          fontSize: compact ? 'var(--font-size-xs, 0.75rem)' : 'var(--font-size-sm, 0.875rem)',
          fontWeight: 500,
          cursor: 'pointer',
          minHeight: 'unset',
        }}
        title={
          hasItems
            ? `${count} pending item${count !== 1 ? 's' : ''} — tap to review`
            : 'Review Queue — all caught up'
        }
      >
        {hasItems ? (
          <BreathingGlow active={true}>
            {icon ?? <Inbox size={compact ? 13 : 15} />}
          </BreathingGlow>
        ) : (
          icon ?? <Inbox size={compact ? 13 : 15} />
        )}
        {label && <span>{label}</span>}
        {hasItems && (
          <span
            className="flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
            style={{
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {count}
          </span>
        )}
      </button>

      <UniversalQueueModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultTab={defaultTab}
      />
    </>
  )
}
