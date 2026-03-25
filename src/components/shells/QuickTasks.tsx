/**
 * QuickTasks — PRD-04
 *
 * Horizontal scrollable strip of pill-shaped quick-action buttons.
 * Available on Mom, Adult, and Independent shells only.
 * Collapse state persists in localStorage.
 *
 * "Quick Note" opens the Smart Notepad drawer when NotepadProvider is in the
 * tree (Mom shell). On other shells it falls back to navigating to /notepad.
 *
 * Future: auto-sort by usage frequency from notepad_routing_stats.
 */

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, FileText, Trophy, Calendar, Brain, ChevronUp, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useShell } from './ShellProvider'
import { useTheme } from '@/lib/theme'
import { getFeatureIcons } from '@/lib/assets'

// ─── Types ───────────────────────────────────────────────────

type QuickActionKind = 'path' | 'notepad'

interface QuickAction {
  key: string
  label: string
  icon: LucideIcon
  featureKey: string
  kind: QuickActionKind
  /** Populated when kind === 'path' */
  path?: string
}

// ─── Action Definitions ──────────────────────────────────────

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
]

const STORAGE_KEY = 'myaim-quicktasks-collapsed'
const USAGE_KEY = 'myaim-quicktasks-usage'

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
    return countB - countA // Higher count first
  })
}

// ─── NotepadOpener bridge ────────────────────────────────────
// QuickTasks cannot safely import useNotepadContext directly because
// Adult and Independent shells never render NotepadProvider. Instead,
// MomShell passes an openNotepad function down through a thin context
// defined here so QuickTasks stays self-contained.

interface QuickTasksNotepadBridge {
  openNotepad: () => void
}

const QuickTasksNotepadCtx = createContext<QuickTasksNotepadBridge | null>(null)

/**
 * Wrap QuickTasks with this inside MomShell (after NotepadProvider) to wire
 * the notepad action. Other shells do not need to use this.
 *
 * Usage in MomShell (after NotepadProvider is in the tree):
 *   import { QuickTasksNotepadBridge } from '@/components/shells/QuickTasks'
 *   // Then inside a component that can call useNotepadContext:
 *   <QuickTasksNotepadBridge>…</QuickTasksNotepadBridge>
 */
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

// Export for MomShell to use
export { QuickTasksNotepadBridgeProvider }

// ─── Shell eligibility ────────────────────────────────────────

const ALLOWED_SHELLS = new Set(['mom', 'adult', 'independent'])

// ─── Component ───────────────────────────────────────────────

/** Batch-fetch illustrated icons for quick action pills */
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

export function QuickTasks({ forceCollapsed }: { forceCollapsed?: boolean } = {}) {
  const { shell } = useShell()
  const navigate = useNavigate()
  const notepadBridge = useContext(QuickTasksNotepadCtx)
  const iconUrls = useQuickActionIcons()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) return stored === 'true'
    } catch {
      // localStorage not available — use responsive default
    }
    // Default: collapsed on mobile (<768px), expanded on desktop
    return typeof window !== 'undefined' && window.innerWidth < 768
  })

  if (!ALLOWED_SHELLS.has(shell)) return null

  // Auto-collapse override from ResizeObserver (PRD-04 auto-collapse logic)
  const effectiveCollapsed = forceCollapsed || collapsed

  function persistCollapsed(next: boolean) {
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // Non-critical
    }
  }

  function handleAction(action: QuickAction) {
    incrementUsage(action.key) // Track usage for auto-sort (PRD-04)
    if (action.kind === 'path' && action.path) {
      navigate(action.path)
    } else {
      // notepad action
      if (notepadBridge) {
        notepadBridge.openNotepad()
      } else {
        // Fallback for Adult/Independent shells (no NotepadProvider)
        navigate('/notepad')
      }
    }
  }

  // Auto-sort by usage frequency (PRD-04)
  const sortedActions = sortByUsage(QUICK_ACTIONS)

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
      style={{
        backgroundColor: 'var(--surface-nav, var(--color-bg-card))',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
      }}
    >
      {/* Scrollable pill row */}
      <div
        className="flex items-center gap-2 px-3 pr-10 overflow-x-auto"
        style={{
          height: '44px',
          // Hide scrollbar across all browsers
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`.qt-row::-webkit-scrollbar { display: none; }`}</style>

        {sortedActions.map((item) => (
          <QuickPill key={item.key} item={item} onAction={() => handleAction(item)} illustratedUrl={iconUrls[item.featureKey] ?? null} />
        ))}
      </div>

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
  const Icon = item.icon

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
