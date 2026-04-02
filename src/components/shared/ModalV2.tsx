/**
 * ModalV2 — Shared Modal component with persistent + transient modes
 *
 * Persistent: Gradient header, minimize-to-pill, state preservation.
 * Transient: Plain header, click-off closes, no state preservation.
 *
 * Part of the Modal System Architecture (specs/Modal-System-Architecture.md).
 * Zero hardcoded colors — all CSS custom properties.
 */

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ModalHeader } from './ModalHeader'
import { ModalBackdrop } from './ModalBackdrop'
import { DraftPrompt } from './DraftPrompt'
import { useModalManager } from '@/contexts/ModalManagerContext'

export interface ModalV2Props {
  /** Unique ID for this modal instance */
  id: string
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Called when the modal should close */
  onClose: () => void
  /** Modal behavior type */
  type: 'persistent' | 'transient'
  /** Size hint for desktop rendering */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Modal title */
  title: string
  /** Optional subtitle */
  subtitle?: string
  /** Lucide icon for the minimized pill */
  icon?: React.ComponentType<{ size: number }>
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean
  /** Called on "Save draft" */
  onSaveDraft?: () => void
  /** Called when the modal is minimized */
  onMinimize?: () => void
  /** Called when the modal is restored from minimized state */
  onRestore?: (state: Record<string, unknown>) => void
  /** Content */
  children: ReactNode
  /** Footer content */
  footer?: ReactNode
  /** Batch progress */
  batchProgress?: { current: number; total: number }
  /** Mobile rendering preference override */
  mobileStyle?: 'bottom-sheet' | 'full-screen'
}

const sizeMaxWidths: Record<string, string> = {
  sm: '480px',
  md: '640px',
  lg: '750px',
  xl: '960px',
  full: '90vw',
}

export function ModalV2({
  id,
  isOpen,
  onClose,
  type,
  size = 'md',
  title,
  subtitle,
  icon,
  hasUnsavedChanges = false,
  onSaveDraft,
  onMinimize,
  onRestore,
  children,
  footer,
  batchProgress,
}: ModalV2Props) {
  const manager = useModalManager()
  const contentRef = useRef<HTMLDivElement>(null)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const isPersistent = type === 'persistent'

  // Handle restore from minimized state
  useEffect(() => {
    if (isOpen && onRestore) {
      const wasMinimized = manager.isMinimized(id)
      if (wasMinimized) {
        const restored = manager.restore(id)
        if (restored) {
          onRestore(restored.state)
        }
      }
    }
  }, [isOpen]) // intentionally only on isOpen change

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      manager.setActiveModalId(id)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPersistent) {
          handleMinimize()
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, isPersistent, hasUnsavedChanges])

  // Focus first focusable element on open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable && focusable.length > 0) {
          focusable[0].focus()
        }
      })
    }
  }, [isOpen])

  const handleMinimize = useCallback(() => {
    if (!isPersistent) {
      onClose()
      return
    }
    if (hasUnsavedChanges && onSaveDraft) {
      setShowDraftPrompt(true)
      return
    }
    doMinimize()
  }, [isPersistent, hasUnsavedChanges, onSaveDraft])

  const doMinimize = useCallback(() => {
    const success = manager.minimize({
      id,
      title,
      icon,
      state: {}, // Consumer can serialize state via onMinimize callback
      scrollPosition: contentRef.current?.scrollTop ?? 0,
      timestamp: new Date(),
      hasUnsavedChanges,
    })
    if (success) {
      onMinimize?.()
      onClose()
    }
    setShowDraftPrompt(false)
  }, [id, title, icon, hasUnsavedChanges, manager, onMinimize, onClose])

  const handleBackdropClick = useCallback(() => {
    if (isPersistent) {
      handleMinimize()
    } else {
      onClose()
    }
  }, [isPersistent, handleMinimize, onClose])

  const handleHeaderClose = useCallback(() => {
    if (isPersistent) {
      handleMinimize()
    } else {
      onClose()
    }
  }, [isPersistent, handleMinimize, onClose])

  if (!isOpen) return null

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal-content, 55)' as unknown as number,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <ModalBackdrop onClick={handleBackdropClick} />

      {/* Modal panel */}
      <div
        ref={contentRef}
        className="relative flex flex-col w-full"
        style={{
          maxWidth: sizeMaxWidths[size] ?? sizeMaxWidths.md,
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: 'var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.3))',
          borderRadius: 'var(--vibe-radius-modal, 16px)',
          overflow: 'hidden',
          animation: 'modalScaleIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          title={title}
          subtitle={subtitle}
          type={type}
          onClose={handleHeaderClose}
          onMinimize={isPersistent ? handleMinimize : undefined}
          batchProgress={batchProgress}
        />

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
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.5rem',
            }}
          >
            {footer}
          </div>
        )}

        {/* Draft prompt overlay */}
        {showDraftPrompt && (
          <DraftPrompt
            onSaveAndMinimize={() => {
              onSaveDraft?.()
              doMinimize()
            }}
            onMinimizeWithoutSaving={doMinimize}
            onCancel={() => setShowDraftPrompt(false)}
          />
        )}
      </div>

      <style>{`
        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes modalScaleIn { from { opacity: 1; transform: none; } }
        }
        @media (max-width: 767px) {
          [role="dialog"] > .relative {
            max-width: 100% !important;
            max-height: 92dvh !important;
            border-radius: var(--vibe-radius-modal, 16px) var(--vibe-radius-modal, 16px) 0 0 !important;
            margin-top: auto !important;
          }
        }
      `}</style>
    </div>
  )

  return createPortal(content, document.body)
}
