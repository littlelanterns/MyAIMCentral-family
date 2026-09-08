/**
 * ModalManagerContext — Global minimize/restore state for persistent modals
 *
 * Lives at app root (above Router, below ThemeProvider) so minimized modal
 * state survives page navigations.
 *
 * Max 3 minimized modals. Attempting a 4th shows a limit prompt.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const MAX_MINIMIZED = 3

export interface MinimizedModal {
  id: string
  title: string
  icon?: React.ComponentType<{ size: number }>
  state: Record<string, unknown>
  scrollPosition: number
  timestamp: Date
  hasUnsavedChanges: boolean
}

export interface ModalManagerContextValue {
  minimizedModals: MinimizedModal[]
  minimize: (modal: MinimizedModal) => boolean // returns false if at limit
  /** Removes a pill and lets the (still-mounted) ModalV2 instance reappear. */
  restore: (id: string) => MinimizedModal | null
  /** Defensive bookkeeping cleanup only — removes a pill without asking the
   * underlying modal to do anything. Used by ModalV2 itself when its OWN
   * `isOpen` prop goes false for a real reason (a true close), to guarantee
   * no stale pill survives it. Never call this from a pill's own dismiss
   * action — that needs `dismiss()` below, or the modal stays mounted with
   * no way back. */
  close: (id: string) => void
  /** The pill's own "I'm done with this, throw it away" action — removes
   * the pill AND signals the still-mounted ModalV2 instance to actually
   * close itself (unmount via its real onClose), so nothing is left
   * running invisibly with no pill to bring it back. */
  dismiss: (id: string) => void
  /** Bumps whenever `dismiss(id)` fires; a ModalV2 instance watches for its
   * own id here to fire its real onClose. */
  dismissedSignal: { id: string; token: number } | null
  isMinimized: (id: string) => boolean
  canMinimize: () => boolean
  /** Currently active modal id (topmost open) */
  activeModalId: string | null
  setActiveModalId: (id: string | null) => void
}

const ModalManagerCtx = createContext<ModalManagerContextValue | null>(null)

export function ModalManagerProvider({ children }: { children: ReactNode }) {
  const [minimized, setMinimized] = useState<MinimizedModal[]>([])
  const [activeModalId, setActiveModalId] = useState<string | null>(null)
  const [dismissedSignal, setDismissedSignal] = useState<{ id: string; token: number } | null>(null)

  const canMinimize = useCallback(() => minimized.length < MAX_MINIMIZED, [minimized.length])

  const minimize = useCallback((modal: MinimizedModal): boolean => {
    if (minimized.length >= MAX_MINIMIZED) return false
    setMinimized((prev) => {
      // Replace if already exists (re-minimize with updated state)
      const filtered = prev.filter((m) => m.id !== modal.id)
      return [...filtered, modal]
    })
    return true
  }, [minimized.length])

  const restore = useCallback((id: string): MinimizedModal | null => {
    const found = minimized.find((m) => m.id === id) ?? null
    if (found) {
      setMinimized((prev) => prev.filter((m) => m.id !== id))
    }
    return found
  }, [minimized])

  const close = useCallback((id: string) => {
    setMinimized((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const dismiss = useCallback((id: string) => {
    setMinimized((prev) => prev.filter((m) => m.id !== id))
    setDismissedSignal({ id, token: Date.now() })
  }, [])

  const isMinimized = useCallback((id: string) => minimized.some((m) => m.id === id), [minimized])

  return (
    <ModalManagerCtx.Provider
      value={{
        minimizedModals: minimized,
        minimize,
        restore,
        close,
        dismiss,
        dismissedSignal,
        isMinimized,
        canMinimize,
        activeModalId,
        setActiveModalId,
      }}
    >
      {children}
    </ModalManagerCtx.Provider>
  )
}

export function useModalManager(): ModalManagerContextValue {
  const ctx = useContext(ModalManagerCtx)
  if (!ctx) throw new Error('useModalManager must be used within ModalManagerProvider')
  return ctx
}
