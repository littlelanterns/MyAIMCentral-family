/**
 * Modal (PRD-03 Design System)
 *
 * Portal-based modal with:
 * - Backdrop click and Escape key to close
 * - Four sizes: sm, md, lg, fullscreen
 * - Optional title, footer slot
 * - Fade + scale animation on open
 * - z-index 50
 * - Zero hardcoded hex colors — all CSS custom properties
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'fullscreen'
  children: ReactNode
  footer?: ReactNode
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  fullscreen: 'w-full h-full max-w-none',
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Trap focus and prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Focus first focusable element
      requestAnimationFrame(() => {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable && focusable.length > 0) {
          focusable[0].focus()
        }
      })
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const isFullscreen = size === 'fullscreen'

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: isFullscreen ? 'stretch' : 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : '1rem',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--color-bg-overlay, rgba(0, 0, 0, 0.5))',
          animation: 'modalFadeIn 0.15s ease-out',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        ref={contentRef}
        className={`relative flex flex-col w-full ${sizeClasses[size]}`}
        style={{
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: isFullscreen ? 0 : 'var(--vibe-radius-modal, 16px)',
          maxHeight: isFullscreen ? '100vh' : 'calc(100vh - 2rem)',
          animation: 'modalScaleIn 0.15s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title !== undefined) && (
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h2
              id="modal-title"
              className="text-base font-semibold"
              style={{ color: 'var(--color-text-heading)', margin: 0 }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                color: 'var(--color-text-secondary)',
                minHeight: 'var(--touch-target-min, 44px)',
                minWidth: '44px',
              }}
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        )}

        {/* No title but still show close button */}
        {title === undefined && (
          <div
            className="flex justify-end flex-shrink-0"
            style={{ padding: '0.75rem 0.75rem 0' }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                color: 'var(--color-text-secondary)',
                minHeight: 'var(--touch-target-min, 44px)',
                minWidth: '44px',
              }}
            >
              <X size={20} aria-hidden />
            </button>
          </div>
        )}

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: '1.25rem' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex-shrink-0"
            style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes modalFadeIn { from { opacity: 1; } }
          @keyframes modalScaleIn { from { opacity: 1; transform: scale(1); } }
        }
      `}</style>
    </div>
  )

  return createPortal(content, document.body)
}
