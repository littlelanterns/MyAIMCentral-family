/**
 * CollapsibleSection (PRD-09A)
 *
 * Reusable accordion section for the Task Creation Modal.
 * Renders a header with chevron toggle and expandable content area.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
  /** Badge or status indicator to show in header */
  headerBadge?: ReactNode
  /** Force open state from parent */
  forceOpen?: boolean
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  headerBadge,
  forceOpen,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const open = forceOpen !== undefined ? forceOpen : isOpen

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => forceOpen === undefined && setIsOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          background: open
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))'
            : 'var(--color-bg-secondary, var(--color-bg-card))',
          border: 'none',
          cursor: forceOpen !== undefined ? 'default' : 'pointer',
          textAlign: 'left',
          transition: 'background var(--vibe-transition, 0.2s ease)',
          minHeight: '44px',
        }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              color: 'var(--color-text-heading)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              fontWeight: 600,
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs, 0.75rem)',
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {headerBadge}
          {forceOpen === undefined && (
            open
              ? <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              : <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          )}
        </div>
      </button>

      {/* Content */}
      {open && (
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
