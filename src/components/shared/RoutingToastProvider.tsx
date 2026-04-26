/**
 * RoutingToastProvider (PRD-08 / PRD-17)
 *
 * Centralized undo toast for ALL routing actions platform-wide.
 * Any component can call useRoutingToast().show(...) to fire a 5-second
 * undo toast with optional "Also send to..." button.
 *
 * Renders a single UndoToast instance at the shell level so toasts
 * appear consistently regardless of which component triggered the route.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { UndoToast } from './UndoToast'

interface RoutingToastState {
  message: string
  destinationPath?: string
  onUndo?: () => void
  onAlsoSendTo?: () => void
  /**
   * Toast variant. 'success' (default) preserves existing call-site
   * styling. 'error' switches to error tokens, swaps in the alert icon,
   * and gives mom 10s to read instead of 5s. See UndoToast for full
   * variant behavior (Worker ROUTINE-SAVE-FIX c2).
   */
  variant?: 'success' | 'error'
}

interface RoutingToastContextValue {
  /** Show a routing undo toast. Only one toast at a time — new call replaces previous. */
  show: (state: RoutingToastState) => void
  /** Dismiss the current toast */
  dismiss: () => void
}

const RoutingToastContext = createContext<RoutingToastContextValue | null>(null)

export function RoutingToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<RoutingToastState | null>(null)

  const show = useCallback((state: RoutingToastState) => {
    setToast(state)
  }, [])

  const dismiss = useCallback(() => {
    setToast(null)
  }, [])

  return (
    <RoutingToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toast && (
        <UndoToast
          message={toast.message}
          destinationPath={toast.destinationPath}
          variant={toast.variant}
          onUndo={toast.onUndo ? () => {
            toast.onUndo!()
            setToast(null)
          } : undefined}
          onAlsoSendTo={toast.onAlsoSendTo ? () => {
            toast.onAlsoSendTo!()
            setToast(null)
          } : undefined}
          onDismiss={() => setToast(null)}
        />
      )}
    </RoutingToastContext.Provider>
  )
}

export function useRoutingToast(): RoutingToastContextValue {
  const ctx = useContext(RoutingToastContext)
  if (!ctx) {
    // Fallback for components not wrapped in RoutingToastProvider (e.g. tests)
    return {
      show: () => {},
      dismiss: () => {},
    }
  }
  return ctx
}
