import { useState, useRef, useEffect, useCallback } from 'react'
import {
  StickyNote, Plus, X, Mic, MicOff, Send, ArrowRightLeft,
  Maximize2, Minimize2, Clock, AlertCircle, Loader2,
} from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { RoutingStrip } from '@/components/shared/RoutingStrip'
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'
import { NotepadReviewRoute } from './NotepadReviewRoute'
import { useNotepadContext } from './NotepadContext'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import {
  useCreateNotepadTab,
  useUpdateNotepadTab,
  useAutosave,
  useRoutingStats,
  useNotepadHistory,
  useRouteContent,
  useUndoRoute,
  type NotepadTab,
} from '@/hooks/useNotepad'

// ─── Constants ───────────────────────────────────────────────

const TAB_WARNING = 6
const TAB_LIMIT = 8

// ─── Main Component ──────────────────────────────────────────

export function NotepadDrawer() {
  const {
    isOpen, openNotepad, closeNotepad,
    view, setView,
    isFullPage, setFullPage,
    tabs, activeTabId, setActiveTabId,
    isLoading: _isLoading, memberId, familyId,
  } = useNotepadContext()

  const createTab = useCreateNotepadTab()
  const updateTab = useUpdateNotepadTab()
  // deleteTab available via useDeleteNotepadTab() when wired
  const routeContent = useRouteContent()
  const undoRoute = useUndoRoute()
  const { data: routingStats = [] } = useRoutingStats(memberId)
  const { data: historyTabs = [] } = useNotepadHistory(memberId)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null
  const save = useAutosave(activeTab)

  // Local content state for immediate UI updates
  const [localContent, setLocalContent] = useState('')
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const routingToast = useRoutingToast()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveIndicatorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Swipe-right to dismiss on mobile (PRD-04)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const handleDrawerTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])
  const handleDrawerTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStart.current || window.innerWidth >= 768) return
    const dx = e.changedTouches[0].clientX - swipeStart.current.x
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStart.current.y)
    swipeStart.current = null
    // Swipe right > 60px, predominantly horizontal
    if (dx > 60 && dx > dy * 1.5) closeNotepad()
  }, [closeNotepad])

  // Sync local content when active tab changes
  useEffect(() => {
    if (activeTab) {
      setLocalContent(activeTab.content || '')
    }
  }, [activeTab?.id])

  // Auto-focus textarea when tab changes or drawer opens
  useEffect(() => {
    if (isOpen && view === 'editor' && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, view, activeTabId])

  // ─── Handlers ──────────────────────────────────────────────

  function handleContentChange(value: string) {
    setLocalContent(value)
    save(value)

    // Show saved indicator
    if (saveIndicatorTimer.current) clearTimeout(saveIndicatorTimer.current)
    saveIndicatorTimer.current = setTimeout(() => {
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    }, 600)
  }

  function handleAddTab() {
    if (!memberId || !familyId) return
    if (tabs.length >= TAB_LIMIT) return

    createTab.mutate({
      family_id: familyId,
      member_id: memberId,
    }, {
      onSuccess: (newTab) => setActiveTabId(newTab.id),
    })
  }

  function handleCloseTab(tabId: string) {
    if (!memberId) return
    // Archive the tab (soft delete)
    updateTab.mutate({
      id: tabId,
      memberId,
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    // Switch to next tab
    const remaining = tabs.filter(t => t.id !== tabId)
    if (remaining.length > 0) {
      setActiveTabId(remaining[0].id)
    } else {
      closeNotepad()
    }
  }

  function handleRenameTab(tabId: string, title: string) {
    if (!memberId) return
    const trimmed = title.trim()
    if (!trimmed) return
    updateTab.mutate({
      id: tabId,
      memberId,
      title: trimmed,
      is_auto_named: false,
    })
    setEditingTitle(null)
  }

  function handleRoute(destination: string, subType?: string) {
    if (!activeTab || !familyId) return

    routeContent.mutate({
      tab: activeTab,
      destination: destination as any,
      subType,
      familyId,
    }, {
      onSuccess: (result) => {
        setView('editor')

        // Capture references for undo closure
        const routedTab = activeTab
        const routedDest = result.destination
        const routedRef = result.referenceId

        routingToast.show({
          message: `"${routedTab.title}" sent to ${destination}`,
          onUndo: () => {
            undoRoute.mutate({
              tab: routedTab,
              destination: routedDest,
              referenceId: routedRef,
            }, {
              onSuccess: () => {
                setActiveTabId(routedTab.id)
                if (!isOpen) openNotepad()
              },
            })
          },
          onAlsoSendTo: () => {
            undoRoute.mutate({
              tab: routedTab,
              destination: routedDest,
              referenceId: routedRef,
            }, {
              onSuccess: () => {
                setActiveTabId(routedTab.id)
                if (!isOpen) openNotepad()
                setView('send-to')
              },
            })
          },
        })

        // Auto-close if no tabs remain
        const remaining = tabs.filter(t => t.id !== routedTab.id)
        if (remaining.length === 0) {
          closeNotepad()
        } else {
          setActiveTabId(remaining[0].id)
        }
      },
    })
  }

  function handleReopenHistory(tab: NotepadTab) {
    if (!memberId || !familyId) return
    // Create a new active tab with the archived content
    createTab.mutate({
      family_id: familyId,
      member_id: memberId,
      title: tab.title,
      content: tab.content || '',
    }, {
      onSuccess: (newTab) => {
        setActiveTabId(newTab.id)
        setView('editor')
      },
    })
  }

  // ─── Escape key to close ───────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) closeNotepad()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeNotepad])

  // ─── Content counts ────────────────────────────────────────
  const wordCount = localContent.split(/\s+/).filter(Boolean).length

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      {/* Pull tab — Desktop: centered vertically, Mobile: above bottom nav */}
      {!isOpen && !isFullPage && (
        <>
          {/* Desktop pull tab — manila folder tab shape (vertical, right edge) */}
          <Tooltip content="Smart Notepad">
            <button
              onClick={() => openNotepad()}
              className="fixed right-0 z-30 hidden md:block transition-all duration-200 group"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                width: '42px',
                height: '100px',
                background: 'transparent',
                border: 'none',
                minHeight: 'unset',
                padding: 0,
              }}
            >
              {/* Tab shape: straight right edge (flush with screen), rounded left protrusion */}
              <svg viewBox="0 0 42 100" fill="none" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(-2px 0 6px rgba(0,0,0,0.12))' }}>
                <path
                  d="M42 8 L42 0 L42 8 C42 8, 42 8, 42 8 L42 8 L18 8 C8 8, 2 16, 2 26 L2 74 C2 84, 8 92, 18 92 L42 92 L42 100 L42 92 Z"
                  fill="var(--color-btn-primary-bg)"
                />
              </svg>
              <StickyNote size={16} className="relative z-10" style={{ color: 'var(--color-btn-primary-text)', marginLeft: '12px' }} />
            </button>
          </Tooltip>

          {/* Mobile pull tab — folder tab, above bottom nav */}
          <button
            onClick={() => openNotepad()}
            className="fixed right-0 z-30 md:hidden block transition-all duration-200 group"
            style={{
              top: 'auto',
              bottom: 'calc(56px + 24px)',
              width: '34px',
              height: '80px',
              background: 'transparent',
              border: 'none',
              minHeight: 'unset',
              padding: 0,
            }}
          >
            <svg viewBox="0 0 34 80" fill="none" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(-2px 0 4px rgba(0,0,0,0.12))' }}>
              <path
                d="M34 6 L14 6 C6 6, 2 13, 2 20 L2 60 C2 67, 6 74, 14 74 L34 74 L34 80 L34 74 Z M34 6 L34 0 Z"
                fill="var(--color-btn-primary-bg)"
              />
            </svg>
            <StickyNote size={14} className="relative z-10" style={{ color: 'var(--color-btn-primary-text)', marginLeft: '9px' }} />
          </button>
        </>
      )}

      {/* Backdrop — mobile only */}
      {isOpen && !isFullPage && (
        <div
          className="fixed inset-0 z-30 md:hidden animate-fadeIn"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={closeNotepad}
        />
      )}

      {/* Drawer body */}
      {isOpen && (
        <div
          onTouchStart={handleDrawerTouchStart}
          onTouchEnd={handleDrawerTouchEnd}
          className={`fixed z-40 flex flex-col ${
            isFullPage
              ? 'inset-0 md:left-[220px]'
              : 'top-0 right-0 bottom-0'
          }`}
          style={{
            width: isFullPage ? undefined : 'min(380px, 100vw)',
            background: 'linear-gradient(145deg, var(--color-bg-secondary), var(--color-bg-primary))',
            borderLeft: isFullPage ? 'none' : '1px solid var(--color-border)',
            borderRadius: isFullPage ? '0' : 'var(--vibe-radius-card, 16px) 0 0 var(--vibe-radius-card, 16px)',
            boxShadow: isFullPage ? 'none' : '-4px 0 20px rgba(0, 0, 0, 0.12)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* FeatureGuide */}
          <div className="px-3 pt-2">
            <FeatureGuide featureKey="notepad" />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b shrink-0"
            style={{
              borderColor: 'var(--color-border)',
              background: 'linear-gradient(180deg, var(--color-bg-secondary), transparent)',
            }}
          >
            <div className="flex items-center gap-2">
              <StickyNote size={16} style={{ color: 'var(--color-accent, var(--color-btn-primary-bg))' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                Smart Notepad
              </span>
              {showSaved && (
                <span className="text-[10px] animate-fadeIn" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                  Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* History */}
              <button
                onClick={() => setView(view === 'history' ? 'editor' : 'history')}
                className="p-1 rounded"
                style={{
                  color: view === 'history' ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                  background: 'transparent',
                  minHeight: 'unset',
                }}
                title="History"
              >
                <Clock size={14} />
              </button>
              {/* Expand / Collapse */}
              <button
                onClick={() => setFullPage(!isFullPage)}
                className="p-1 hidden md:block"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                title={isFullPage ? 'Collapse to drawer' : 'Expand to full page'}
              >
                {isFullPage ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              {/* Close */}
              <button
                onClick={closeNotepad}
                className="p-1"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* View Router */}
          {view === 'editor' && (
            <EditorView
              tabs={tabs}
              activeTab={activeTab}
              activeTabId={activeTabId}
              localContent={localContent}
              editingTitle={editingTitle}
              wordCount={wordCount}
              textareaRef={textareaRef}
              onContentChange={handleContentChange}
              onSelectTab={setActiveTabId}
              onAddTab={handleAddTab}
              onCloseTab={handleCloseTab}
              onRenameTab={handleRenameTab}
              onStartRename={setEditingTitle}
              onSendTo={() => setView('send-to')}
              onReviewRoute={() => setView('review-route')}
            />
          )}

          {view === 'send-to' && (
            <div className="flex-1 overflow-y-auto">
              <RoutingStrip
                context="notepad_send_to"
                onRoute={handleRoute}
                onCancel={() => setView('editor')}
                routingStats={routingStats}
                showReviewRoute
                onReviewRoute={() => setView('review-route')}
              />
            </div>
          )}

          {view === 'review-route' && activeTab && familyId && (
            <NotepadReviewRoute
              tab={activeTab}
              familyId={familyId}
              onBack={() => setView('editor')}
              onAllRouted={() => setView('editor')}
            />
          )}

          {view === 'history' && (
            <HistoryView
              historyTabs={historyTabs}
              onReopen={handleReopenHistory}
              onBack={() => setView('editor')}
            />
          )}
        </div>
      )}

    </>
  )
}

// ─── Editor View ─────────────────────────────────────────────

function EditorView({
  tabs, activeTab: _activeTab, activeTabId, localContent, editingTitle, wordCount, textareaRef,
  onContentChange, onSelectTab, onAddTab, onCloseTab, onRenameTab, onStartRename,
  onSendTo, onReviewRoute,
}: {
  tabs: NotepadTab[]
  activeTab: NotepadTab | null
  activeTabId: string | null
  localContent: string
  editingTitle: string | null
  wordCount: number
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onContentChange: (v: string) => void
  onSelectTab: (id: string) => void
  onAddTab: () => void
  onCloseTab: (id: string) => void
  onRenameTab: (id: string, title: string) => void
  onStartRename: (id: string | null) => void
  onSendTo: () => void
  onReviewRoute: () => void
}) {
  const hasContent = localContent.trim().length > 0
  const voice = useVoiceInput()

  async function handleVoiceToggle() {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) {
        const newContent = localContent ? localContent + '\n' + text : text
        onContentChange(newContent)
      }
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }
  const atWarning = tabs.length >= TAB_WARNING
  const atLimit = tabs.length >= TAB_LIMIT

  // Empty state
  if (tabs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <StickyNote size={32} style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Start typing, tap the mic, or open a past tab from history.
        </p>
        <button
          onClick={onAddTab}
          className="btn-primary px-4 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          New Tab
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Tab Bar */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 border-b overflow-x-auto shrink-0"
        style={{
          borderColor: 'var(--color-border)',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map(tab => (
          <div key={tab.id} className="flex items-center shrink-0 group max-w-[140px]">
            {editingTitle === tab.id ? (
              <input
                type="text"
                defaultValue={tab.title}
                autoFocus
                onBlur={(e) => onRenameTab(tab.id, e.target.value || tab.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onRenameTab(tab.id, (e.target as HTMLInputElement).value || tab.title)
                  if (e.key === 'Escape') onStartRename(null)
                }}
                className="px-1.5 py-0.5 rounded text-xs w-20"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border-focus, var(--color-btn-primary-bg))',
                  color: 'var(--color-text-primary)',
                }}
              />
            ) : (
              <button
                onClick={() => onSelectTab(tab.id)}
                onDoubleClick={() => onStartRename(tab.id)}
                className="px-2 py-1 rounded text-xs whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  backgroundColor: activeTabId === tab.id ? 'var(--color-bg-secondary)' : 'transparent',
                  color: activeTabId === tab.id ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
                  fontWeight: activeTabId === tab.id ? 500 : 400,
                  borderBottom: activeTabId === tab.id ? '2px solid var(--color-btn-primary-bg)' : '2px solid transparent',
                  minHeight: 'unset',
                }}
                title={`${tab.title} — double-click to rename`}
              >
                {tab.title}
              </button>
            )}
            {activeTabId === tab.id && (
              <button
                onClick={() => onCloseTab(tab.id)}
                className="p-0.5 ml-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                title="Close tab (archives to history)"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}

        {/* Add tab button */}
        <Tooltip content={atLimit ? 'Close or route some tabs first' : 'New tab'}>
          <button
            onClick={onAddTab}
            disabled={atLimit}
            className="p-1 rounded shrink-0 disabled:opacity-30"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
          >
            <Plus size={14} />
          </button>
        </Tooltip>

        {/* Tab warning */}
        {atWarning && !atLimit && (
          <Tooltip content="Consider routing some tabs">
            <span className="shrink-0 ml-1">
              <AlertCircle size={12} style={{ color: 'var(--color-warning, #d6a461)' }} />
            </span>
          </Tooltip>
        )}
      </div>

      {/* Content area — "paper" card inset */}
      <div
        className="flex-1 flex flex-col min-h-0 mx-2 mb-1 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-card, #fff), var(--color-bg-primary))',
          border: '1px solid var(--color-border)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Capture anything here... thoughts, ideas, quick notes."
          className="flex-1 p-3 text-sm resize-none rounded-lg"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            border: 'none',
            outline: 'none',
            minHeight: '44px',
          }}
        />
        {/* Interim voice preview */}
        {voice.state === 'recording' && voice.interimText && (
          <div
            className="px-3 py-2 text-xs italic border-t"
            style={{
              color: 'var(--color-text-secondary)',
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            {voice.interimText}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          {/* Voice input */}
          {voice.state === 'transcribing' ? (
            <div className="flex items-center gap-1.5 px-2 py-1">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                Transcribing...
              </span>
            </div>
          ) : (
            <button
              onClick={handleVoiceToggle}
              disabled={!voice.isSupported}
              className="p-1.5 rounded transition-colors"
              style={{
                color: voice.state === 'recording' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                backgroundColor: voice.state === 'recording' ? 'var(--color-error, #e53e3e)' : 'transparent',
                minHeight: 'unset',
              }}
              title={voice.state === 'recording' ? 'Stop recording' : 'Start voice input'}
            >
              {voice.state === 'recording' ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          {/* Recording indicator */}
          {voice.state === 'recording' ? (
            <span className="text-[10px] font-medium animate-pulse" style={{ color: 'var(--color-error, #e53e3e)' }}>
              {formatDuration(voice.duration)}
            </span>
          ) : (
            <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              {wordCount} words
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Send to */}
          <button
            onClick={onSendTo}
            disabled={!hasContent}
            className="btn-primary flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
              minHeight: 'unset',
            }}
          >
            <Send size={12} />
            Send to...
          </button>

          {/* Review & Route */}
          <button
            onClick={onReviewRoute}
            disabled={!hasContent}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              minHeight: 'unset',
            }}
          >
            <ArrowRightLeft size={12} />
            Review &amp; Route
          </button>
        </div>
      </div>
    </>
  )
}

// ─── History View ────────────────────────────────────────────

function HistoryView({ historyTabs, onReopen, onBack }: {
  historyTabs: NotepadTab[]
  onReopen: (tab: NotepadTab) => void
  onBack: () => void
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Notepad History
        </span>
        <button
          onClick={onBack}
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
        >
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {historyTabs.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              No history yet. Closed and routed tabs will appear here.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {historyTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onReopen(tab)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  minHeight: 'unset',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs truncate" style={{ color: 'var(--color-text-heading)' }}>
                    {tab.title}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-2"
                    style={{
                      backgroundColor: tab.status === 'routed' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-primary)',
                      color: tab.status === 'routed' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {tab.status === 'routed' ? `→ ${tab.routed_to}` : 'Archived'}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {(tab.content || '').slice(0, 80) || '(empty)'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
