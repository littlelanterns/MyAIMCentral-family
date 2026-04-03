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
import type { LilaConversation } from '@/hooks/useLila'

interface ToolLauncherState {
  /** Open a tool conversation modal by mode key */
  openTool: (modeKey: string, personId?: string) => void
  /** Resume an existing conversation in its tool modal */
  resumeConversation: (conversation: LilaConversation) => void
  /** Close the current tool modal */
  closeTool: () => void
  /** Whether a tool modal is currently open */
  isOpen: boolean
  /** The currently open tool's mode key */
  activeTool: string | null
}

const ToolLauncherContext = createContext<ToolLauncherState>({
  openTool: () => {},
  resumeConversation: () => {},
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
  const [existingConversation, setExistingConversation] = useState<LilaConversation | null>(null)

  const openTool = useCallback((modeKey: string, personId?: string) => {
    setActiveTool(modeKey)
    setInitialPersonId(personId)
    setExistingConversation(null)
  }, [])

  const resumeConversation = useCallback((conversation: LilaConversation) => {
    const modeKey = conversation.guided_subtype || conversation.guided_mode || conversation.mode || 'general'
    setActiveTool(modeKey)
    setExistingConversation(conversation)
    setInitialPersonId(undefined)
  }, [])

  const closeTool = useCallback(() => {
    setActiveTool(null)
    setInitialPersonId(undefined)
    setExistingConversation(null)
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

  // When resuming a past conversation, always use ToolConversationModal
  // (Translator and BoD modals don't have message history display)
  const isResume = !!existingConversation

  return (
    <ToolLauncherContext.Provider value={{ openTool, resumeConversation, closeTool, isOpen: !!activeTool, activeTool }}>
      {children}
      {activeTool === 'translator' && !isResume ? (
        <TranslatorModal onClose={closeTool} />
      ) : activeTool === 'board_of_directors' && !isResume ? (
        <BoardOfDirectorsModal onClose={closeTool} existingConversation={existingConversation} />
      ) : activeTool ? (
        <ToolConversationModal
          modeKey={activeTool}
          onClose={closeTool}
          initialPersonId={initialPersonId}
          existingConversation={existingConversation}
        />
      ) : null}
    </ToolLauncherContext.Provider>
  )
}
