/**
 * useModal — Hook for modal open/close/minimize state management
 *
 * Wraps ModalManagerContext for individual modal instances.
 */

import { useState, useCallback } from 'react'
import { useModalManager } from '@/contexts/ModalManagerContext'

export function useModal(modalId: string) {
  const manager = useModalManager()
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    // If this modal was minimized, restore it
    const restored = manager.restore(modalId)
    if (restored) {
      // State will be available via the restored object
    }
    setIsOpen(true)
    manager.setActiveModalId(modalId)
  }, [modalId, manager])

  const close = useCallback(() => {
    setIsOpen(false)
    manager.close(modalId)
    if (manager.activeModalId === modalId) {
      manager.setActiveModalId(null)
    }
  }, [modalId, manager])

  const minimize = useCallback(
    (state: Record<string, unknown> = {}, hasUnsavedChanges = false) => {
      const success = manager.minimize({
        id: modalId,
        title: '', // will be overridden by the Modal component
        state,
        scrollPosition: 0,
        timestamp: new Date(),
        hasUnsavedChanges,
      })
      if (success) {
        setIsOpen(false)
        if (manager.activeModalId === modalId) {
          manager.setActiveModalId(null)
        }
      }
      return success
    },
    [modalId, manager],
  )

  return {
    isOpen,
    open,
    close,
    minimize,
    isMinimized: manager.isMinimized(modalId),
    canMinimize: manager.canMinimize(),
  }
}
