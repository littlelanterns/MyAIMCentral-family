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

import { useState, createContext, useContext, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookOpen, FileText, Trophy, Calendar, Brain, ChevronUp, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useShell } from './ShellProvider'

// ─── Types ───────────────────────────────────────────────────

type QuickActionKind = 'path' | 'notepad'

interface QuickAction {
  key: string
  label: string
  icon: LucideIcon
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
    kind: 'path',
    path: '/tasks?new=1',
  },
  {
    key: 'journal_entry',
    label: 'Journal',
    icon: BookOpen,
    kind: 'path',
    path: '/journal?new=1',
  },
  {
    key: 'quick_note',
    label: 'Quick Note',
    icon: FileText,
    kind: 'notepad',
  },
  {
    key: 'log_victory',
    label: 'Victory',
    icon: Trophy,
    kind: 'path',
    path: '/victories?new=1',
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    kind: 'path',
    path: '/calendar',
  },
  {
    key: 'mind_sweep',
    label: 'MindSweep',
    icon: Brain,
    kind: 'path',
    path: '/sweep',
  },
]

const STORAGE_KEY = 'myaim-quicktasks-collapsed'

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

export function QuickTasks() {
  const { shell } = useShell()
  const navigate = useNavigate()
  const notepadBridge = useContext(QuickTasksNotepadCtx)

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

  function persistCollapsed(next: boolean) {
    setCollapsed(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      // Non-critical
    }
  }

  function handleAction(action: QuickAction) {
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

  if (collapsed) {
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
        backgroundColor: 'var(--color-bg-card)',
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

        {QUICK_ACTIONS.map((item) => (
          <QuickPill key={item.key} item={item} onAction={() => handleAction(item)} />
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

function QuickPill({ item, onAction }: { item: QuickAction; onAction: () => void }) {
  const [hovered, setHovered] = useState(false)
  const Icon = item.icon

  return (
    <button
      onClick={onAction}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-shrink-0 flex items-center gap-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap"
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
      <Icon size={16} />
      {item.label}
    </button>
  )
}
