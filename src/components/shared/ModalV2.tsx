/**
 * ModalV2 — Shared Modal component with persistent + transient modes
 *
 * Persistent: Gradient header, minimize-to-pill, state preservation.
 * Transient: Plain header, click-off closes, no state preservation.
 *
 * Part of the Modal System Architecture (specs/Modal-System-Architecture.md).
 * Zero hardcoded colors — all CSS custom properties.
 *
 * Minimize/restore (2026-09-07 fix): minimizing a persistent modal used to
 * call the consumer's onClose(), which unmounted the whole subtree — so the
 * pill was purely decorative; clicking it removed the pill but nothing ever
 * reopened. Minimizing now keeps the modal's children mounted (hidden via
 * CSS) so all of its internal React state survives on its own; the pill's
 * click just needs to remove itself from the manager's minimized list for
 * the overlay to reappear exactly as it was — no per-consumer
 * serialize/deserialize wiring required. The pill's own dismiss action
 * (right-click, or its small x) uses `dismiss()` instead, which also tells
 * this still-mounted instance to truly close via its real onClose.
 *
 * `closeButtonBehavior` lets one consumer opt the header X (and Escape)
 * into a TRUE close (no pill left behind) instead of the platform default
 * of minimizing — every existing consumer keeps the default 'minimize'
 * unless it explicitly opts in.
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
  /**
   * What the header X button (and Escape) do on a persistent modal.
   * 'minimize' (default) — matches every existing consumer: X sends the
   * modal to the pill bar, same as clicking the backdrop. The separate
   * minimize (—) button always minimizes regardless of this setting.
   * 'close' — X (and Escape) fully close with no pill left behind; only
   * the backdrop click and the — button still minimize. Opt in per
   * consumer; never the platform default.
   */
  closeButtonBehavior?: 'minimize' | 'close'
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
  closeButtonBehavior = 'minimize',
}: ModalV2Props) {
  const manager = useModalManager()
  const contentRef = useRef<HTMLDivElement>(null)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const isPersistent = type === 'persistent'
  const isMinimizedNow = manager.isMinimized(id)
  // Whether the overlay should actually be visible right now. `isOpen`
  // still governs whether this instance exists at all (a true close still
  // unmounts everything); `isMinimizedNow` governs whether the (mounted)
  // overlay is showing or hidden behind a pill.
  const visuallyOpen = isOpen && !isMinimizedNow

  const focusFirstElement = useCallback(() => {
    requestAnimationFrame(() => {
      const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable && focusable.length > 0) {
        focusable[0].focus()
      }
    })
  }, [])

  // Restore: fires once when this instance transitions from minimized back
  // to visible (pill clicked, or restore() called directly elsewhere). The
  // subtree never unmounted while minimized, so this is a notification
  // hook for consumers — not what makes state survive.
  const wasMinimizedRef = useRef(isMinimizedNow)
  useEffect(() => {
    if (wasMinimizedRef.current && !isMinimizedNow && isOpen) {
      onRestore?.({})
      focusFirstElement()
    }
    wasMinimizedRef.current = isMinimizedNow
  }, [isMinimizedNow, isOpen, onRestore, focusFirstElement])

  // The pill's own dismiss action (not a restore) — this instance is still
  // mounted (nothing unmounted it), so it must close itself for real.
  // `lastSeenDismissTokenRef` starts at whatever token already existed at
  // MOUNT time — a fresh remount of the same id (e.g. reopening after a
  // prior dismiss) must not immediately re-fire on that stale signal.
  const lastSeenDismissTokenRef = useRef(manager.dismissedSignal?.token ?? null)
  useEffect(() => {
    const sig = manager.dismissedSignal
    if (sig && sig.id === id && sig.token !== lastSeenDismissTokenRef.current) {
      lastSeenDismissTokenRef.current = sig.token
      onClose()
    } else if (sig) {
      lastSeenDismissTokenRef.current = sig.token
    }
    // Only re-run when the signal itself changes, not on every onClose identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager.dismissedSignal, id])

  // A real close (parent flips isOpen false, for any reason) must never
  // leave a stale pill behind.
  useEffect(() => {
    if (!isOpen) {
      manager.close(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, id])

  // Prevent body scroll + track the active modal only while VISUALLY open —
  // never while minimized, since the whole point of minimizing is that the
  // page underneath becomes fully usable again.
  useEffect(() => {
    if (visuallyOpen) {
      document.body.style.overflow = 'hidden'
      manager.setActiveModalId(id)
    }
    return () => {
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visuallyOpen, id])

  // Escape key handler
  useEffect(() => {
    if (!visuallyOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPersistent) {
          if (closeButtonBehavior === 'close') {
            onClose()
          } else {
            handleMinimize()
          }
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visuallyOpen, isPersistent, closeButtonBehavior, hasUnsavedChanges])

  // Focus first focusable element on open
  useEffect(() => {
    if (visuallyOpen) {
      focusFirstElement()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visuallyOpen])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // No onClose() here — the modal stays mounted (just visually hidden
      // via CSS) so every bit of its internal state survives until the
      // pill is clicked. This is the core of the minimize/restore fix.
    }
    setShowDraftPrompt(false)
  }, [id, title, icon, hasUnsavedChanges, manager, onMinimize])

  const handleBackdropClick = useCallback(() => {
    if (isPersistent) {
      handleMinimize()
    } else {
      onClose()
    }
  }, [isPersistent, handleMinimize, onClose])

  const handleHeaderClose = useCallback(() => {
    if (isPersistent) {
      if (closeButtonBehavior === 'close') {
        onClose()
      } else {
        handleMinimize()
      }
    } else {
      onClose()
    }
  }, [isPersistent, closeButtonBehavior, handleMinimize, onClose])

  if (!isOpen) return null

  const content = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal-content, 55)' as unknown as number,
        display: visuallyOpen ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-hidden={!visuallyOpen}
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
            className="shrink-0"
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
