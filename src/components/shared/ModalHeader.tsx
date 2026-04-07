/**
 * ModalHeader — Gradient (persistent) and plain (transient) header variants
 *
 * Zero hardcoded colors. Respects gradient toggle via .gradient-on class.
 */

import { X, Minus } from 'lucide-react'

interface ModalHeaderProps {
  title: string
  subtitle?: string
  type: 'persistent' | 'transient'
  onClose: () => void
  onMinimize?: () => void
  /** Batch progress: 0-1 ratio */
  batchProgress?: { current: number; total: number }
}

export function ModalHeader({
  title,
  subtitle,
  type,
  onClose,
  onMinimize,
  batchProgress,
}: ModalHeaderProps) {
  if (type === 'persistent') {
    return (
      <div className="shrink-0">
        <div className="modal-header-gradient" style={gradientHeaderStyle}>
          <div style={{ minWidth: 0 }}>
            <h2
              id="modal-title"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 600,
                margin: 0,
                color: 'inherit',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{subtitle}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            {onMinimize && (
              <button
                onClick={onMinimize}
                aria-label="Minimize"
                className="btn-icon"
                style={headerButtonStyle}
              >
                <Minus size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="btn-icon"
              style={headerButtonStyle}
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {batchProgress && batchProgress.total > 1 && (
          <div style={{ padding: '0.5rem 1.25rem', background: 'var(--color-bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: 'var(--color-bg-secondary)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                    background: 'var(--color-btn-primary-bg)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  color: 'var(--color-text-secondary)',
                  flexShrink: 0,
                }}
              >
                {batchProgress.current} of {batchProgress.total}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Transient — plain header
  return (
    <div
      className="shrink-0"
      style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <h2
        id="modal-title"
        style={{
          color: 'var(--color-text-heading)',
          fontWeight: 600,
          fontSize: '1rem',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <button
        onClick={onClose}
        aria-label="Close"
        className="btn-icon"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-secondary)',
          border: 'none',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          cursor: 'pointer',
          padding: '0.375rem',
          color: 'var(--color-text-secondary)',
          width: 36,
          height: 36,
        }}
      >
        <X size={18} />
      </button>
    </div>
  )
}

const gradientHeaderStyle: React.CSSProperties = {
  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
  padding: '1rem 1.25rem',
  color: 'var(--color-text-on-primary, var(--color-btn-primary-text, white))',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: 'var(--vibe-radius-modal, 16px) var(--vibe-radius-modal, 16px) 0 0',
}

const headerButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'color-mix(in srgb, currentColor 15%, transparent)',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  color: 'inherit',
  width: 36,
  height: 36,
  padding: 0,
}
