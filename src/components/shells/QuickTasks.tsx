/**
 * QuickTasks — PRD-04
 *
 * Horizontal scrollable strip of pill-shaped quick-action buttons.
 * Available on Mom, Adult, and Independent shells only.
 * Collapse state persists in localStorage.
 *
 * Layout fixes (UX Overhaul Session 3):
 * - Strip spans only main content area (stops before floating buttons)
 * - Hidden scrollbar with swipe support
 * - Right-edge fade gradient when items overflow
 * - Scroll arrow buttons on desktop
 * - Auto-sort by usage frequency (persisted to localStorage)
 * - Quick Create "+" always anchored rightmost
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, FileText, Trophy, Calendar, Brain, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox, Heart, Feather, GraduationCap, Map } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useShell } from './ShellProvider'
import { useToolLauncher } from '@/components/lila/ToolLauncherProvider'
import { useTheme } from '@/lib/theme'
import { getFeatureIcons } from '@/lib/assets'
import { useFamily } from '@/hooks/useFamily'
import { useStudioQueueCount } from '@/hooks/useStudioQueue'
import { BreathingGlow } from '@/components/ui/BreathingGlow'
import { QuickCreate } from '@/components/global/QuickCreate'

// ─── Types ───────────────────────────────────────────────────

type QuickActionKind = 'path' | 'notepad' | 'tool'

interface QuickAction {
  key: string
  label: string
  icon: LucideIcon
  featureKey: string
  kind: QuickActionKind
  /** Populated when kind === 'path' */
  path?: string
  /** Populated when kind === 'tool' — the guided mode key to launch */
  toolModeKey?: string
}

// ─── Action Definitions ──────────────────────────────────────

/** Pinned first — not subject to usage sorting */
const PINNED_ACTIONS: QuickAction[] = [
  {
    key: 'lanterns_path',
    label: "Lantern's Path",
    icon: Map,
    featureKey: 'lanterns_path',
    kind: 'path',
    path: '/lanterns-path',
  },
]

const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'add_task',
    label: 'Add Task',
    icon: Plus,
    featureKey: 'tasks',
    kind: 'path',
    path: '/tasks?new=1',
  },
  {
    key: 'journal_entry',
    label: 'Journal',
    icon: BookOpen,
    featureKey: 'journal',
    kind: 'path',
    path: '/journal?new=1',
  },
  {
    key: 'quick_note',
    label: 'Quick Note',
    icon: FileText,
    featureKey: 'notepad_basic',
    kind: 'notepad',
  },
  {
    key: 'log_victory',
    label: 'Victory',
    icon: Trophy,
    featureKey: 'victories',
    kind: 'path',
    path: '/victories?new=1',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    featureKey: 'calendar',
    kind: 'path',
    path: '/calendar',
  },
  {
    key: 'mind_sweep',
    label: 'MindSweep',
    icon: Brain,
    featureKey: 'mindsweep',
    kind: 'path',
    path: '/sweep',
  },
  // PRD-21: Communication tool QuickTasks
  {
    key: 'love_languages',
    label: 'Love Languages',
    icon: Heart,
    featureKey: 'tool_quality_time',
    kind: 'tool',
    toolModeKey: 'quality_time',
  },
  {
    key: 'cyrano',
    label: 'Cyrano',
    icon: Feather,
    featureKey: 'tool_cyrano',
    kind: 'tool',
    toolModeKey: 'cyrano',
  },
  {
    key: 'higgins',
    label: 'Higgins',
    icon: GraduationCap,
    featureKey: 'tool_higgins_say',
    kind: 'tool',
    toolModeKey: 'higgins_say',
  },
]

const STORAGE_KEY = 'myaim-quicktasks-collapsed'
const USAGE_KEY = 'myaim-quicktasks-usage'
const INDICATOR_MODE_KEY = 'myaim-indicator-mode'

type IndicatorMode = 'glow' | 'numeric'

function getIndicatorMode(): IndicatorMode {
  try {
    const stored = localStorage.getItem(INDICATOR_MODE_KEY)
    if (stored === 'glow' || stored === 'numeric') return stored
  } catch { /* non-critical */ }
  return 'glow'
}

function setIndicatorMode(mode: IndicatorMode) {
  try {
    localStorage.setItem(INDICATOR_MODE_KEY, mode)
  } catch { /* non-critical */ }
}

/** Get usage counts from localStorage */
function getUsageCounts(): Record<string, number> {
  try {
    const stored = localStorage.getItem(USAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

/** Increment usage count for a quick action key */
function incrementUsage(key: string) {
  try {
    const counts = getUsageCounts()
    counts[key] = (counts[key] || 0) + 1
    localStorage.setItem(USAGE_KEY, JSON.stringify(counts))
  } catch { /* Non-critical */ }
}

/** Sort actions by usage frequency (most-used first), preserving original order as tiebreaker */
function sortByUsage(actions: QuickAction[]): QuickAction[] {
  const counts = getUsageCounts()
  return [...actions].sort((a, b) => {
    const countA = counts[a.key] || 0
    const countB = counts[b.key] || 0
    if (countB !== countA) return countB - countA
    // Tiebreaker: preserve original order
    return actions.indexOf(a) - actions.indexOf(b)
  })
}

// ─── NotepadOpener bridge ────────────────────────────────────

interface QuickTasksNotepadBridge {
  openNotepad: () => void
}

const QuickTasksNotepadCtx = createContext<QuickTasksNotepadBridge | null>(null)

function QuickTasksNotepadBridgeProvider({
  openNotepad,
  children,
}: {
  openNotepad: () => void
  children: ReactNode
}) {
  return (
    <QuickTasksNotepadCtx.Provider value={{ openNotepad }}>
      {children}
    </QuickTasksNotepadCtx.Provider>
  )
}

export { QuickTasksNotepadBridgeProvider }

// ─── Shell eligibility ────────────────────────────────────────

const ALLOWED_SHELLS = new Set(['mom', 'adult', 'independent'])

// ─── Scroll overflow detection hook ──────────────────────────

function useScrollOverflow(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkOverflow()
    el.addEventListener('scroll', checkOverflow, { passive: true })
    const resizeOb = new ResizeObserver(checkOverflow)
    resizeOb.observe(el)
    return () => {
      el.removeEventListener('scroll', checkOverflow)
      resizeOb.disconnect()
    }
  }, [scrollRef, checkOverflow])

  return { canScrollLeft, canScrollRight, checkOverflow }
}

// ─── Illustrated icons hook ──────────────────────────────────

function useQuickActionIcons() {
  const { vibe } = useTheme()
  const [iconUrls, setIconUrls] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let cancelled = false
    const keys = QUICK_ACTIONS.map(a => a.featureKey)
    getFeatureIcons(keys, vibe, 'A', 128).then(urls => {
      if (!cancelled) setIconUrls(urls)
    })
    return () => { cancelled = true }
  }, [vibe])

  return iconUrls
}

// ─── Main Component ──────────────────────────────────────────

export function QuickTasks({ forceCollapsed }: { forceCollapsed?: boolean } = {}) {
  const { shell } = useShell()
  const navigate = useNavigate()
  const notepadBridge = useContext(QuickTasksNotepadCtx)
  const { openTool } = useToolLauncher()
  const iconUrls = useQuickActionIcons()
  const { data: family } = useFamily()
  const { data: queueCount = 0 } = useStudioQueueCount(family?.id)
  const [indicatorMode, setIndicatorModeState] = useState<IndicatorMode>(getIndicatorMode)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { canScrollLeft, canScrollRight } = useScrollOverflow(scrollRef)

  function toggleIndicatorMode() {
    const next: IndicatorMode = indicatorMode === 'glow' ? 'numeric' : 'glow'
    setIndicatorModeState(next)
    setIndicatorMode(next)
  }

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) return stored === 'true'
    } catch {
      // localStorage not available
    }
    return typeof window !== 'undefined' && window.innerWidth < 768
  })

  if (!ALLOWED_SHELLS.has(shell)) return null

  const effectiveCollapsed = forceCollapsed || collapsed

  function persistCollapsed(next: boolean) {
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch { /* Non-critical */ }
  }

  function handleAction(action: QuickAction) {
    incrementUsage(action.key)
    if (action.kind === 'path' && action.path) {
      navigate(action.path)
    } else if (action.kind === 'tool' && action.toolModeKey) {
      openTool(action.toolModeKey)
    } else {
      if (notepadBridge) {
        notepadBridge.openNotepad()
      } else {
        navigate('/notepad')
      }
    }
  }

  function scrollStrip(direction: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'right' ? 200 : -200, behavior: 'smooth' })
  }

  // Auto-sort by usage frequency — pinned items always first
  const sortedActions = [...PINNED_ACTIONS, ...sortByUsage(QUICK_ACTIONS)]

  if (effectiveCollapsed) {
    return (
      <div
        className="flex items-center justify-between px-3"
        style={{
          height: '28px',
          backgroundColor: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          className="text-xs select-none"
          style={{ color: 'var(--color-text-secondary)', opacity: 0.55 }}
        >
          Quick Actions
        </span>
        <button
          onClick={() => persistCollapsed(false)}
          aria-label="Expand QuickTasks strip"
          aria-expanded={false}
          className="flex items-center justify-center rounded-full transition-colors"
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            minHeight: 'unset',
          }}
        >
          <ChevronDown size={13} />
        </button>
      </div>
    )
  }

  return (
    <div
      className="quicktasks-strip"
      style={{
        backgroundColor: 'var(--surface-nav, var(--color-bg-card))',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
      }}
    >
      {/* CSS for hidden scrollbar */}
      <style>{`
        .qt-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Left scroll arrow — desktop only, visible when can scroll left */}
      {canScrollLeft && (
        <button
          onClick={() => scrollStrip('left')}
          className="hidden md:flex absolute left-0 top-1/2 items-center justify-center rounded-full z-[2] transition-opacity"
          style={{
            transform: 'translateY(-50%)',
            width: '28px',
            height: '28px',
            background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            minHeight: 'unset',
          }}
          aria-label="Scroll left"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* Scrollable pill row — constrained to not overlap floating buttons */}
      <div
        ref={scrollRef}
        className="qt-scroll flex items-center gap-2 overflow-x-auto"
        style={{
          height: '44px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth',
          // Left padding: account for scroll arrow space if scrollable
          paddingLeft: canScrollLeft ? '32px' : '12px',
          // Right padding: room for collapse button + queue indicator + right arrow
          paddingRight: '48px',
        }}
      >
        {sortedActions.map((item) => (
          <QuickPill key={item.key} item={item} onAction={() => handleAction(item)} illustratedUrl={iconUrls[item.featureKey] ?? null} />
        ))}

        {/* Quick Create "+" button — always anchored rightmost */}
        <QuickCreate
          mode="strip"
          onAddTask={() => navigate('/tasks?new=1')}
          onQuickNote={() => {
            if (notepadBridge) notepadBridge.openNotepad()
            else navigate('/notepad')
          }}
          onLogVictory={() => navigate('/victories?new=1')}
          onCalendarEvent={() => navigate('/calendar?new=1')}
          onSendRequest={() => {
            // TODO: Open request creation modal when PRD-15 is built
            if (notepadBridge) notepadBridge.openNotepad()
          }}
          onMindSweep={() => navigate('/sweep')}
        />
      </div>

      {/* Right fade gradient — visible when items overflow right */}
      {canScrollRight && (
        <div
          className="absolute top-0 right-[40px] h-full w-10 pointer-events-none z-[1]"
          style={{
            background: 'linear-gradient(to left, var(--surface-nav, var(--color-bg-card)), transparent)',
          }}
        />
      )}

      {/* Right scroll arrow — desktop only, visible when can scroll right */}
      {canScrollRight && (
        <button
          onClick={() => scrollStrip('right')}
          className="hidden md:flex absolute right-[32px] top-1/2 items-center justify-center rounded-full z-[2] transition-opacity"
          style={{
            transform: 'translateY(-50%)',
            width: '28px',
            height: '28px',
            background: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            minHeight: 'unset',
          }}
          aria-label="Scroll right"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Queue indicator — shows pending items */}
      {queueCount > 0 && (
        <button
          onClick={toggleIndicatorMode}
          className="absolute right-9 top-1/2 flex items-center justify-center rounded-full transition-colors"
          style={{
            transform: 'translateY(-50%)',
            minHeight: 'unset',
            cursor: 'pointer',
          }}
          title={`${queueCount} pending queue item${queueCount !== 1 ? 's' : ''} — tap to toggle indicator style`}
        >
          {indicatorMode === 'glow' ? (
            <BreathingGlow active={true}>
              <Inbox size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
            </BreathingGlow>
          ) : (
            <span className="relative inline-flex">
              <Inbox size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
              <span
                className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold leading-none px-1"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                {queueCount}
              </span>
            </span>
          )}
        </button>
      )}

      {/* Collapse toggle — overlaid at right edge */}
      <button
        onClick={() => persistCollapsed(true)}
        aria-label="Collapse QuickTasks strip"
        aria-expanded={true}
        className="absolute right-2 top-1/2 flex items-center justify-center rounded-full transition-colors"
        style={{
          transform: 'translateY(-50%)',
          width: '24px',
          height: '24px',
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          minHeight: 'unset',
        }}
      >
        <ChevronUp size={13} />
      </button>
    </div>
  )
}

// ─── Individual Pill ─────────────────────────────────────────

function QuickPill({ item, onAction, illustratedUrl }: { item: QuickAction; onAction: () => void; illustratedUrl: string | null }) {
  const [hovered, setHovered] = useState(false)
  const [attentionGlow, setAttentionGlow] = useState(false)
  const Icon = item.icon
  const isPinned = PINNED_ACTIONS.some(p => p.key === item.key)

  // Listen for tour dismissal to trigger attention animation
  useEffect(() => {
    if (!isPinned) return
    function handleGlow() {
      setAttentionGlow(true)
      setTimeout(() => setAttentionGlow(false), 6000)
    }
    window.addEventListener('tour-dismissed-glow', handleGlow)
    return () => window.removeEventListener('tour-dismissed-glow', handleGlow)
  }, [isPinned])

  if (isPinned) {
    return (
      <>
        <style>{`
          @keyframes qtGoldShimmer {
            0%, 100% { box-shadow: 0 0 6px rgba(214,164,97,0.4), inset 0 0 4px rgba(214,164,97,0.1); border-color: var(--color-accent, #D6A461); }
            50% { box-shadow: 0 0 14px rgba(214,164,97,0.7), inset 0 0 8px rgba(214,164,97,0.2); border-color: var(--color-accent, #E8C177); }
          }
          @keyframes qtAttentionPulse {
            0% { transform: scale(1); box-shadow: 0 0 8px rgba(214,164,97,0.5); background-color: var(--color-accent, #D6A461); }
            25% { transform: scale(1.15); box-shadow: 0 0 24px rgba(214,164,97,0.9); background-color: var(--color-accent, #E8C177); }
            50% { transform: scale(1); box-shadow: 0 0 8px rgba(104,163,149,0.6); background-color: var(--color-btn-primary-bg, #68A395); }
            75% { transform: scale(1.1); box-shadow: 0 0 20px rgba(214,164,97,0.8); background-color: var(--color-accent, #D6A461); }
            100% { transform: scale(1); box-shadow: 0 0 8px rgba(214,164,97,0.5); background-color: var(--color-accent, #D6A461); }
          }
        `}</style>
        <button
          onClick={onAction}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="shrink-0 flex items-center gap-1.5 rounded-full text-xs font-bold whitespace-nowrap"
          style={{
            padding: '6px 14px',
            backgroundColor: hovered ? 'var(--color-accent-deep, #C4923A)' : 'var(--color-accent, #D6A461)',
            color: 'var(--color-btn-primary-text, #fff)',
            border: '1.5px solid var(--color-accent, #D6A461)',
            animation: attentionGlow
              ? 'qtAttentionPulse 1s ease-in-out infinite'
              : 'qtGoldShimmer 2.5s ease-in-out infinite',
            minHeight: 'unset',
            lineHeight: 1.2,
            transition: 'background-color 0.15s',
          }}
        >
          <Icon size={16} />
          {item.label}
        </button>
      </>
    )
  }

  return (
    <button
      onClick={onAction}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="shrink-0 flex items-center gap-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap"
      style={{
        padding: '6px 12px',
        backgroundColor: hovered
          ? 'var(--color-btn-primary-bg)'
          : 'var(--color-bg-secondary)',
        color: hovered
          ? 'var(--color-btn-primary-text)'
          : 'var(--color-text-primary)',
        border: 'none',
        minHeight: 'unset',
        lineHeight: 1.2,
      }}
    >
      {illustratedUrl ? (
        <img src={illustratedUrl} alt="" width={16} height={16} className="shrink-0 rounded-sm" />
      ) : (
        <Icon size={16} />
      )}
      {item.label}
    </button>
  )
}
