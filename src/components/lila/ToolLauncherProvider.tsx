/**
 * ToolLauncherProvider — PRD-21
 *
 * Provides a context for launching communication tool modals from anywhere
 * in the app (Sidebar AI Toolbox section, QuickTasks buttons, AI Vault).
 * Wraps the shell so ToolConversationModal renders at the shell level.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { ToolConversationModal } from './ToolConversationModal'
import { TranslatorModal } from './TranslatorModal'
import { BoardOfDirectorsModal } from './BoardOfDirectorsModal'

interface ToolLauncherState {
  /** Open a tool conversation modal by mode key */
  openTool: (modeKey: string, personId?: string) => void
  /** Close the current tool modal */
  closeTool: () => void
  /** Whether a tool modal is currently open */
  isOpen: boolean
  /** The currently open tool's mode key */
  activeTool: string | null
}

const ToolLauncherContext = createContext<ToolLauncherState>({
  openTool: () => {},
  closeTool: () => {},
  isOpen: false,
  activeTool: null,
})

export function useToolLauncher() {
  return useContext(ToolLauncherContext)
}

export function ToolLauncherProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [initialPersonId, setInitialPersonId] = useState<string | undefined>()

  const openTool = useCallback((modeKey: string, personId?: string) => {
    setActiveTool(modeKey)
    setInitialPersonId(personId)
  }, [])

  const closeTool = useCallback(() => {
    setActiveTool(null)
    setInitialPersonId(undefined)
  }, [])

  // Listen for mode-switch events from ToolConversationModal
  useEffect(() => {
    function handleModeSwitch(e: Event) {
      const detail = (e as CustomEvent).detail
      if (detail?.to) {
        // Small delay to let the current modal close
        setTimeout(() => openTool(detail.to, detail.personIds?.[0]), 100)
      }
    }
    window.addEventListener('lila-mode-switch', handleModeSwitch)
    return () => window.removeEventListener('lila-mode-switch', handleModeSwitch)
  }, [openTool])

  return (
    <ToolLauncherContext.Provider value={{ openTool, closeTool, isOpen: !!activeTool, activeTool }}>
      {children}
      {activeTool === 'translator' ? (
        <TranslatorModal onClose={closeTool} />
      ) : activeTool === 'board_of_directors' ? (
        <BoardOfDirectorsModal onClose={closeTool} />
      ) : activeTool ? (
        <ToolConversationModal
          modeKey={activeTool}
          onClose={closeTool}
          initialPersonId={initialPersonId}
        />
      ) : null}
    </ToolLauncherContext.Provider>
  )
}
