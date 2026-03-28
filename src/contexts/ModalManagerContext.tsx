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
  restore: (id: string) => MinimizedModal | null
  close: (id: string) => void
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

  const isMinimized = useCallback((id: string) => minimized.some((m) => m.id === id), [minimized])

  return (
    <ModalManagerCtx.Provider
      value={{
        minimizedModals: minimized,
        minimize,
        restore,
        close,
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
