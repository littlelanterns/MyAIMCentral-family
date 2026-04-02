import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import {
  useNotepadTabs,
  useCreateNotepadTab,
  type NotepadTab,
} from '@/hooks/useNotepad'

// ─── Types ───────────────────────────────────────────────────

export type NotepadView = 'editor' | 'send-to' | 'review-route' | 'history'

interface NotepadContextValue {
  // Drawer state
  isOpen: boolean
  openNotepad: (opts?: { content?: string; title?: string; sourceType?: NotepadTab['source_type']; sourceReferenceId?: string }) => void
  closeNotepad: () => void
  toggleNotepad: () => void

  // View state
  view: NotepadView
  setView: (view: NotepadView) => void

  // Full-page mode
  isFullPage: boolean
  setFullPage: (v: boolean) => void

  // Tab data
  tabs: NotepadTab[]
  activeTabId: string | null
  setActiveTabId: (id: string | null) => void
  isLoading: boolean

  // Identity
  memberId: string | undefined
  familyId: string | undefined
}

const NotepadCtx = createContext<NotepadContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────

export function NotepadProvider({ children }: { children: ReactNode }) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()

  // In View As mode, load the viewed-as member's notepad
  const effectiveMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const memberId = effectiveMember?.id
  const familyId = family?.id

  const { data: tabs = [], isLoading } = useNotepadTabs(memberId)
  const createTab = useCreateNotepadTab()

  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<NotepadView>('editor')
  const [isFullPage, setFullPage] = useState(false)
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // Keep activeTabId in sync with tabs
  const effectiveActiveTabId = activeTabId && tabs.some(t => t.id === activeTabId)
    ? activeTabId
    : tabs[0]?.id ?? null

  const openNotepad = useCallback((opts?: {
    content?: string
    title?: string
    sourceType?: NotepadTab['source_type']
    sourceReferenceId?: string
  }) => {
    setIsOpen(true)
    setView('editor')

    if (opts?.content && memberId && familyId) {
      // Create a new tab with the provided content (e.g., "Edit in Notepad" from LiLa/Journal)
      createTab.mutate({
        family_id: familyId,
        member_id: memberId,
        content: opts.content,
        title: opts.title,
        source_type: opts.sourceType || 'edit_in_notepad',
        source_reference_id: opts.sourceReferenceId,
      }, {
        onSuccess: (newTab) => setActiveTabId(newTab.id),
      })
    } else if (tabs.length === 0 && memberId && familyId) {
      // No tabs — create one
      createTab.mutate({
        family_id: familyId,
        member_id: memberId,
        title: 'New Tab',
      }, {
        onSuccess: (newTab) => setActiveTabId(newTab.id),
      })
    } else {
      // Activate an empty tab if one exists, otherwise keep current
      const emptyTab = tabs.find(t => !(t.content || '').trim())
      if (emptyTab) setActiveTabId(emptyTab.id)
    }
  }, [tabs, memberId, familyId, createTab])

  const closeNotepad = useCallback(() => {
    setIsOpen(false)
    setView('editor')
    setFullPage(false)
  }, [])

  const toggleNotepad = useCallback(() => {
    if (isOpen) closeNotepad()
    else openNotepad()
  }, [isOpen, openNotepad, closeNotepad])

  return (
    <NotepadCtx.Provider value={{
      isOpen,
      openNotepad,
      closeNotepad,
      toggleNotepad,
      view,
      setView,
      isFullPage,
      setFullPage,
      tabs,
      activeTabId: effectiveActiveTabId,
      setActiveTabId,
      isLoading,
      memberId,
      familyId,
    }}>
      {children}
    </NotepadCtx.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────

export function useNotepadContext() {
  const ctx = useContext(NotepadCtx)
  if (!ctx) throw new Error('useNotepadContext must be used inside NotepadProvider')
  return ctx
}

/** Safe version that returns null when not inside NotepadProvider */
export function useNotepadContextSafe() {
  return useContext(NotepadCtx)
}
