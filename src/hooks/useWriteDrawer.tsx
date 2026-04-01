/**
 * PRD-25 Phase B: Write Drawer state context
 * Manages drawer open/closed state and active tab for the Guided shell.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type WriteDrawerTab = 'notepad' | 'messages' | 'reflections'

interface WriteDrawerContextValue {
  isOpen: boolean
  activeTab: WriteDrawerTab
  openDrawer: (tab?: WriteDrawerTab) => void
  closeDrawer: () => void
  setActiveTab: (tab: WriteDrawerTab) => void
}

const WriteDrawerContext = createContext<WriteDrawerContextValue | null>(null)

export function WriteDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTabState] = useState<WriteDrawerTab>(() => {
    const saved = sessionStorage.getItem('guided-write-drawer-tab')
    return (saved as WriteDrawerTab) || 'notepad'
  })

  const openDrawer = useCallback((tab?: WriteDrawerTab) => {
    if (tab) {
      setActiveTabState(tab)
      sessionStorage.setItem('guided-write-drawer-tab', tab)
    }
    setIsOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsOpen(false)
  }, [])

  const setActiveTab = useCallback((tab: WriteDrawerTab) => {
    setActiveTabState(tab)
    sessionStorage.setItem('guided-write-drawer-tab', tab)
  }, [])

  return (
    <WriteDrawerContext.Provider value={{ isOpen, activeTab, openDrawer, closeDrawer, setActiveTab }}>
      {children}
    </WriteDrawerContext.Provider>
  )
}

export function useWriteDrawer(): WriteDrawerContextValue {
  const ctx = useContext(WriteDrawerContext)
  if (!ctx) throw new Error('useWriteDrawer must be used inside WriteDrawerProvider')
  return ctx
}
