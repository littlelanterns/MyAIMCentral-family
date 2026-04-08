/**
 * CollapsibleGroup — PRD-06/07 Pattern
 *
 * Category group for Guiding Stars, InnerWorkings, etc.
 * Features: expand/collapse, item count badge, heart all/unheart all toggle,
 * drag-to-reorder inside via children slot.
 * Zero hardcoded colors — all CSS custom properties.
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Heart, HeartOff } from 'lucide-react'
import { Tooltip } from './Tooltip'

interface CollapsibleGroupProps {
  label: string
  count: number
  heartedCount?: number
  defaultOpen?: boolean
  children: ReactNode
  /** Tooltip/description shown on hover */
  description?: string
  /** Called when "heart all" or "unheart all" is toggled */
  onToggleAll?: (included: boolean) => void
  /** Footer content (e.g., "+ Add" button) */
  footer?: ReactNode
}

export function CollapsibleGroup({
  label,
  count,
  heartedCount,
  defaultOpen = true,
  children,
  description,
  onToggleAll,
  footer,
}: CollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const allHearted = heartedCount !== undefined && heartedCount === count && count > 0
  const noneHearted = heartedCount !== undefined && heartedCount === 0

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Header — the expand/collapse button and the heart-all button are
          siblings, not nested. Nesting buttons is a React hydration error
          and breaks keyboard/screen-reader semantics. The wrapping <div>
          gets the header chrome; only the two inner <button>s are
          interactive, each with its own role and handler. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: isOpen
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))'
            : 'var(--color-bg-secondary, var(--color-bg-card))',
          transition: 'background var(--vibe-transition, 0.2s ease)',
          minHeight: '44px',
        }}
      >
        <Tooltip content={description ?? ''} disabled={!description}>
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            className="flex items-center gap-2"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
              minHeight: '24px',
            }}
          >
            {isOpen
              ? <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              : <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
            }
            <span
              style={{
                color: 'var(--color-text-heading)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 600,
              }}
            >
              {label}
            </span>
            {count > 0 && (
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px]"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {count}
              </span>
            )}
          </button>
        </Tooltip>

        {/* Heart all / unheart all toggle — sibling of the expand button,
            no longer nested inside it. */}
        {onToggleAll && count > 0 && (
          <button
            type="button"
            onClick={() => onToggleAll(!allHearted)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              color: allHearted ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
            }}
            title={allHearted ? 'Unheart all in this group' : 'Heart all in this group'}
          >
            {allHearted || !noneHearted
              ? <Heart size={12} fill={allHearted ? 'currentColor' : 'none'} />
              : <HeartOff size={12} />
            }
            {allHearted ? 'All' : noneHearted ? 'None' : `${heartedCount}/${count}`}
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div
          style={{
            padding: '0.5rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          {count === 0 ? (
            <p
              className="text-center py-4 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              No {label.toLowerCase()} yet
            </p>
          ) : (
            children
          )}
          {footer}
        </div>
      )}
    </div>
  )
}
