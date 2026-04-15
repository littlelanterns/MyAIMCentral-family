import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  StickyNote, Plus, X, Mic, MicOff, Send, ArrowRightLeft,
  Maximize2, Minimize2, Clock, AlertCircle, Loader2,
  ChevronsRight, Search, ArrowDownUp, Trash2, Wand2,
} from 'lucide-react'
import { Tooltip } from '@/components/shared'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { PullTab } from '@/components/shared/PullTab'
import { HScrollArrows } from '@/components/shared/HScrollArrows'
import { RoutingStrip } from '@/components/shared/RoutingStrip'
import { useRoutingToast } from '@/components/shared/RoutingToastProvider'
import { NotepadRichEditor } from './NotepadRichEditor'
import { NotepadReviewRoute } from './NotepadReviewRoute'
import { useNotepadContext } from './NotepadContext'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useMindSweepSettings, useRunSweep } from '@/hooks/useMindSweep'
import { QuickRequestModal } from '@/components/requests/QuickRequestModal'
import { ComposeFlow } from '@/components/messaging/ComposeFlow'
import { FEATURE_FLAGS } from '@/config/featureFlags'
import {
  useCreateNotepadTab,
  useUpdateNotepadTab,
  useDeleteNotepadTab,
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
const CHAR_SOFT_LIMIT = 5000

// Destination labels for routing toast links
const DEST_LABELS: Record<string, { label: string; path: string }> = {
  journal: { label: 'Journal', path: '/journal' },
  quick_note: { label: 'Journal', path: '/journal' },
  best_intentions: { label: 'Best Intentions', path: '/guiding-stars' },
  victory: { label: 'Victories', path: '/victories' },
  guiding_stars: { label: 'Guiding Stars', path: '/guiding-stars' },
  innerworkings: { label: 'InnerWorkings', path: '/inner-workings' },
  tasks: { label: 'Tasks', path: '/tasks' },
  list: { label: 'Lists', path: '/lists' },
  calendar: { label: 'Calendar', path: '/calendar' },
  track: { label: 'Dashboard', path: '/dashboard' },
  agenda: { label: 'Meetings', path: '/meetings' },
  message: { label: 'Messages', path: '/messages' },
  optimizer: { label: 'Optimizer', path: '/vault' },
  ideas: { label: 'Ideas', path: '/lists' },
  backburner: { label: 'Backburner', path: '/lists' },
  mindsweep: { label: 'MindSweep', path: '' },
  request: { label: 'Request', path: '' },
}

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
  const deleteTab = useDeleteNotepadTab()
  const routeContent = useRouteContent()
  const undoRoute = useUndoRoute()
  const { data: routingStats = [] } = useRoutingStats(memberId)
  const { data: historyTabs = [] } = useNotepadHistory(memberId)

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null
  const save = useAutosave(activeTab)

  // MindSweep hooks
  const { data: familyMembers = [] } = useFamilyMembers(familyId)
  const { data: sweepSettings } = useMindSweepSettings(memberId)
  const { run: runSweep, status: sweepStatus } = useRunSweep()

  // Local content state for immediate UI updates
  const [localContent, setLocalContent] = useState('')
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const routingToast = useRoutingToast()

  // Request modal state — opened when user picks "Request" as a routing destination
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestPrefill, setRequestPrefill] = useState<{ title: string; details: string; tabId: string }>({ title: '', details: '', tabId: '' })
  const [composeFlowOpen, setComposeFlowOpen] = useState(false)
  const [composeFlowContent, setComposeFlowContent] = useState('')

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
    if (dx > 60 && dx > dy * 1.5) closeNotepad()
  }, [closeNotepad])

  // Sync local content when active tab changes
  useEffect(() => {
    if (activeTab) {
      setLocalContent(activeTab.content || '')
    }
  }, [activeTab?.id])

  // ─── Handlers ──────────────────────────────────────────────

  function handleContentChange(value: string) {
    setLocalContent(value)
    save(value)

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
    updateTab.mutate({
      id: tabId,
      memberId,
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    const remaining = tabs.filter(t => t.id !== tabId)
    if (remaining.length > 0) {
      setActiveTabId(remaining[0].id)
    } else {
      closeNotepad()
    }
  }

  function handleDiscardTab(tabId: string) {
    if (!memberId) return
    deleteTab.mutate({ id: tabId, memberId })
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

  async function handleMindSweep() {
    if (!activeTab || !familyId || !memberId) return
    const content = (activeTab.content || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()
    if (!content) return

    setView('editor')

    const memberNames = familyMembers.map(m => ({
      id: m.id,
      display_name: m.display_name,
      nicknames: m.nicknames || [],
    }))

    const result = await runSweep({
      items: [{ content, content_type: 'text' }],
      familyId,
      memberId,
      settings: sweepSettings || null,
      sourceChannel: 'routing_strip',
      familyMemberNames: memberNames,
    })

    if (result) {
      // Mark tab as routed
      updateTab.mutate({ id: activeTab.id, memberId, status: 'routed', routed_to: 'mindsweep' })

      const saved = result.autoRouted + result.queued
      const msg = result.failed > 0
        ? `MindSweep saved ${saved}, ${result.failed} failed — check the Review Queue`
        : result.autoRouted > 0 && result.queued > 0
          ? `MindSweep sorted ${result.totalItems} items — ${result.autoRouted} auto-routed, ${result.queued} in queue`
          : result.autoRouted > 0
            ? `MindSweep auto-routed ${result.autoRouted} items`
            : `MindSweep sorted ${result.queued} items to your queue`

      routingToast.show({ message: msg })

      const remaining = tabs.filter(t => t.id !== activeTab.id)
      if (remaining.length === 0) {
        closeNotepad()
      } else {
        setActiveTabId(remaining[0].id)
      }
    } else {
      routingToast.show({ message: 'MindSweep had trouble sorting. Items saved to queue.' })
      routeContent.mutate({ tab: activeTab, destination: 'mindsweep' as any, familyId })
    }
  }

  function handleRoute(destination: string, subType?: string) {
    if (!activeTab || !familyId) return

    // Intercept MindSweep — run through sweep pipeline instead of studio_queue
    if (destination === 'mindsweep') {
      handleMindSweep()
      return
    }

    // Intercept Request — open QuickRequestModal pre-filled with notepad content
    if (destination === 'request') {
      const content = activeTab.content || ''
      const title = activeTab.title && !activeTab.is_auto_named ? activeTab.title : content.split('\n')[0]?.slice(0, 100) || 'Untitled Request'
      setRequestPrefill({ title, details: content, tabId: activeTab.id })
      setRequestModalOpen(true)
      return
    }

    // Intercept Message — open ComposeFlow pre-filled with notepad content
    if (destination === 'message') {
      const content = activeTab.content || ''
      setComposeFlowContent(content)
      setComposeFlowOpen(true)
      return
    }

    routeContent.mutate({
      tab: activeTab,
      destination: destination as any,
      subType,
      familyId,
    }, {
      onSuccess: (result) => {
        setView('editor')

        const routedTab = activeTab
        const routedDest = result.destination
        const routedRef = result.referenceId
        const destInfo = DEST_LABELS[destination] || { label: destination, path: '' }

        routingToast.show({
          message: `Saved to ${destInfo.label}`,
          destinationPath: destInfo.path || undefined,
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
  // Strip HTML tags for word/char count
  const plainText = localContent.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
  const wordCount = plainText.split(/\s+/).filter(Boolean).length
  const charCount = plainText.length

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      {/* Pull tab — Desktop: centered vertically, Mobile: above bottom nav */}
      {!isOpen && !isFullPage && (
        <>
          <Tooltip content="Smart Notepad">
            <div className="fixed right-0 z-30 hidden md:block" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              <PullTab orientation="side" onClick={() => openNotepad()}>
                <StickyNote size={16} />
              </PullTab>
            </div>
          </Tooltip>

          <div
            className="fixed right-0 z-30 md:hidden block"
            style={{ bottom: 'calc(56px + 90px)' }}
          >
            <PullTab orientation="side" onClick={() => openNotepad()} height={70}>
              <StickyNote size={14} />
            </PullTab>
          </div>
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
          {/* Close PullTab — inward arrow on left edge (Founder directive A) */}
          <div
            className="absolute left-0 z-50 hidden md:block"
            style={{ top: '50%', transform: 'translate(-100%, -50%)' }}
          >
            <PullTab orientation="side" onClick={closeNotepad}>
              <ChevronsRight size={14} />
            </PullTab>
          </div>

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
              <Tooltip content="History">
              <button
                onClick={() => setView(view === 'history' ? 'editor' : 'history')}
                className="p-1 rounded"
                style={{
                  color: view === 'history' ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                  background: 'transparent',
                  minHeight: 'unset',
                }}
              >
                <Clock size={14} />
              </button>
              </Tooltip>
              {/* Expand / Collapse */}
              <Tooltip content={isFullPage ? 'Collapse to drawer' : 'Expand to full page'}>
              <button
                onClick={() => setFullPage(!isFullPage)}
                className="p-1 hidden md:block"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                {isFullPage ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              </Tooltip>
              {/* X button to close — always visible on all screen sizes */}
              <Tooltip content="Close (your content is saved)">
              <button
                onClick={closeNotepad}
                className="p-1"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <X size={14} />
              </button>
              </Tooltip>
            </div>
          </div>

          {/* MindSweep processing overlay */}
          {sweepStatus.status === 'processing' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3"
              style={{
                background: 'color-mix(in srgb, var(--color-bg-primary) 90%, transparent)',
                borderRadius: 'inherit',
              }}
            >
              <Wand2 size={28} className="animate-pulse" style={{ color: 'var(--color-btn-primary-bg)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                MindSweep sorting...
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Classifying and routing your items
              </p>
            </div>
          )}

          {/* View Router */}
          {view === 'editor' && (
            <EditorView
              tabs={tabs}
              activeTabId={activeTabId}
              localContent={localContent}
              editingTitle={editingTitle}
              wordCount={wordCount}
              charCount={charCount}
              onContentChange={handleContentChange}
              onSelectTab={setActiveTabId}
              onAddTab={handleAddTab}
              onCloseTab={handleCloseTab}
              onDiscardTab={handleDiscardTab}
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
              onDelete={(tab) => {
                if (!memberId) return
                deleteTab.mutate({ id: tab.id, memberId })
              }}
              onBack={() => setView('editor')}
            />
          )}
        </div>
      )}

      {/* QuickRequestModal — opened when user picks "Request" in routing strip */}
      <QuickRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        prefillTitle={requestPrefill.title}
        prefillDetails={requestPrefill.details}
        source="notepad_route"
        sourceReferenceId={requestPrefill.tabId || undefined}
      />

      {/* ComposeFlow — opened when user picks "Message" in routing strip */}
      <ComposeFlow
        isOpen={composeFlowOpen}
        onClose={() => setComposeFlowOpen(false)}
        prefillContent={composeFlowContent}
      />
    </>
  )
}

// ─── Editor View ─────────────────────────────────────────────

function EditorView({
  tabs, activeTabId, localContent, editingTitle, wordCount, charCount,
  onContentChange, onSelectTab, onAddTab, onCloseTab, onDiscardTab, onRenameTab, onStartRename,
  onSendTo, onReviewRoute,
}: {
  tabs: NotepadTab[]
  activeTabId: string | null
  localContent: string
  editingTitle: string | null
  wordCount: number
  charCount: number
  onContentChange: (v: string) => void
  onSelectTab: (id: string) => void
  onAddTab: () => void
  onCloseTab: (id: string) => void
  onDiscardTab: (id: string) => void
  onRenameTab: (id: string, title: string) => void
  onStartRename: (id: string | null) => void
  onSendTo: () => void
  onReviewRoute: () => void
}) {
  const hasContent = localContent.replace(/<[^>]*>/g, '').trim().length > 0
  const voice = useVoiceInput()
  const isOverLimit = charCount > CHAR_SOFT_LIMIT

  async function handleVoiceToggle() {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) {
        const newContent = localContent ? localContent + '<p>' + text + '</p>' : '<p>' + text + '</p>'
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
      {/* Tab Bar with HScrollArrows */}
      <HScrollArrows>
        <div
          data-hscroll
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
                <Tooltip content={`${tab.title} — double-click to rename`}>
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
                >
                  {tab.title}
                </button>
                </Tooltip>
              )}
              {activeTabId === tab.id && (
                <Tooltip content="Close tab (archives to history)">
                <button
                  onClick={() => onCloseTab(tab.id)}
                  className="p-0.5 ml-0.5 rounded md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                >
                  <X size={10} />
                </button>
                </Tooltip>
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

          {atWarning && !atLimit && (
            <Tooltip content="Consider routing some tabs">
              <span className="shrink-0 ml-1">
                <AlertCircle size={12} style={{ color: 'var(--color-warning, #d6a461)' }} />
              </span>
            </Tooltip>
          )}
        </div>
      </HScrollArrows>

      {/* Content area — "paper" card inset with rich text editor */}
      <div
        className="flex-1 flex flex-col min-h-0 overflow-hidden mx-2 mb-1 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-card, #fff), var(--color-bg-primary))',
          border: '1px solid var(--color-border)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        <NotepadRichEditor
          content={localContent}
          onChange={onContentChange}
          autoFocus
        />
        {/* Interim voice preview */}
        {FEATURE_FLAGS.ENABLE_VOICE_INPUT && voice.state === 'recording' && voice.interimText && (
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

      {/* Large content warning (Issue #8) */}
      {isOverLimit && (
        <div className="px-3 py-1">
          <p className="text-[10px]" style={{ color: 'var(--color-warning, #d6a461)' }}>
            Long note — consider splitting into multiple tabs or routing some content
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-t shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          {/* Voice input — hidden behind feature flag */}
          {FEATURE_FLAGS.ENABLE_VOICE_INPUT && (voice.state === 'transcribing' ? (
            <div className="flex items-center gap-1.5 px-2 py-1">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                Transcribing...
              </span>
            </div>
          ) : (
            <Tooltip content={voice.state === 'recording' ? 'Stop recording' : 'Start voice input'}>
            <button
              onClick={handleVoiceToggle}
              disabled={!voice.isSupported}
              className="p-1.5 rounded transition-colors"
              style={{
                color: voice.state === 'recording' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                backgroundColor: voice.state === 'recording' ? 'var(--color-error, #e53e3e)' : 'transparent',
                minHeight: 'unset',
              }}
            >
              {voice.state === 'recording' ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            </Tooltip>
          ))}

          {/* Word/char count */}
          {FEATURE_FLAGS.ENABLE_VOICE_INPUT && voice.state === 'recording' ? (
            <span className="text-[10px] font-medium animate-pulse" style={{ color: 'var(--color-error, #e53e3e)' }}>
              {formatDuration(voice.duration)}
            </span>
          ) : (
            <span
              className="text-[10px]"
              style={{ color: isOverLimit ? 'var(--color-warning, #d6a461)' : 'var(--color-text-secondary)' }}
            >
              {wordCount} words{charCount > 1000 ? ` · ${Math.round(charCount / 1000)}k chars` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip content="Discard this tab">
            <button
              onClick={() => {
                if (!activeTabId) return
                if (hasContent && !window.confirm('Discard this note? This cannot be undone.')) return
                onDiscardTab(activeTabId)
              }}
              className="p-1.5 rounded transition-colors"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>

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

// ─── History View (Issue #7: search, filter, sort, delete) ───

type HistorySort = 'newest' | 'oldest' | 'by_status'
type HistoryFilter = 'all' | 'routed' | 'archived'

function HistoryView({ historyTabs, onReopen, onDelete, onBack }: {
  historyTabs: NotepadTab[]
  onReopen: (tab: NotepadTab) => void
  onDelete: (tab: NotepadTab) => void
  onBack: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [sort, setSort] = useState<HistorySort>('newest')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let items = [...historyTabs]

    // Filter by status
    if (filter === 'routed') items = items.filter(t => t.status === 'routed')
    if (filter === 'archived') items = items.filter(t => t.status === 'archived')

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.content || '').toLowerCase().includes(q)
      )
    }

    // Sort
    if (sort === 'newest') items.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    if (sort === 'oldest') items.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    if (sort === 'by_status') items.sort((a, b) => a.status.localeCompare(b.status))

    return items
  }, [historyTabs, filter, searchQuery, sort])

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

      {/* Search + controls */}
      <div className="px-3 py-2 space-y-2 shrink-0">
        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          <Search size={12} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-xs bg-transparent outline-none"
            style={{ color: 'var(--color-text-primary)', minHeight: 'unset' }}
          />
        </div>

        {/* Filter + Sort row */}
        <div className="flex items-center justify-between">
          <HScrollArrows>
            <div data-hscroll className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {(['all', 'routed', 'archived'] as HistoryFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-2 py-1 rounded text-[10px] whitespace-nowrap"
                  style={{
                    backgroundColor: filter === f ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                    color: filter === f ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    minHeight: 'unset',
                  }}
                >
                  {f === 'all' ? 'All' : f === 'routed' ? 'Routed' : 'Archived'}
                </button>
              ))}
            </div>
          </HScrollArrows>

          <Tooltip content={`Sort: ${sort}`}>
          <button
            onClick={() => setSort(sort === 'newest' ? 'oldest' : sort === 'oldest' ? 'by_status' : 'newest')}
            className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] shrink-0 ml-1"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-secondary)',
              minHeight: 'unset',
            }}
          >
            <ArrowDownUp size={10} />
            {sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : 'Status'}
          </button>
          </Tooltip>
        </div>
      </div>

      {/* History entries */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {searchQuery ? 'No matching entries.' : 'No history yet. Closed and routed tabs will appear here.'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map(tab => (
              <div
                key={tab.id}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onReopen(tab)}
                    className="flex-1 text-left"
                    style={{ background: 'transparent', minHeight: 'unset' }}
                  >
                    <span className="font-medium text-xs truncate block" style={{ color: 'var(--color-text-heading)' }}>
                      {tab.title}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: tab.status === 'routed' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-primary)',
                        color: tab.status === 'routed' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                      }}
                    >
                      {tab.status === 'routed' ? `→ ${tab.routed_to}` : 'Archived'}
                    </span>
                    {/* Delete button */}
                    {confirmDeleteId === tab.id ? (
                      <button
                        onClick={() => { onDelete(tab); setConfirmDeleteId(null) }}
                        className="px-1.5 py-0.5 rounded text-[10px]"
                        style={{
                          backgroundColor: 'var(--color-error, #e53e3e)',
                          color: 'var(--color-btn-primary-text, #fff)',
                          minHeight: 'unset',
                        }}
                      >
                        Confirm
                      </button>
                    ) : (
                      <Tooltip content="Delete">
                      <button
                        onClick={() => setConfirmDeleteId(tab.id)}
                        className="p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                      >
                        <Trash2 size={11} />
                      </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onReopen(tab)}
                  className="w-full text-left"
                  style={{ background: 'transparent', minHeight: 'unset' }}
                >
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                    {(tab.content || '').replace(/<[^>]*>/g, '').slice(0, 80) || '(empty)'}
                  </p>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
