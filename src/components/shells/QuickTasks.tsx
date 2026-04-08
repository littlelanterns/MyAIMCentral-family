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
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CheckSquare, Trophy, Calendar, Brain, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox, Heart, Feather, GraduationCap, Map } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useShell } from './ShellProvider'
import { useToolLauncher } from '@/components/lila/ToolLauncherProvider'
import { useTheme } from '@/lib/theme'
import { getFeatureIcons } from '@/lib/assets'
import { useFamily } from '@/hooks/useFamily'
import { useStudioQueueCount } from '@/hooks/useStudioQueue'
import { BreathingGlow } from '@/components/ui/BreathingGlow'
import { UniversalQueueModal } from '@/components/queue/UniversalQueueModal'
import { supabase } from '@/lib/supabase/client'
// QuickCreate now renders as FAB at shell level — no longer in the strip

// ─── Types ───────────────────────────────────────────────────

type QuickActionKind = 'path' | 'notepad' | 'tool' | 'submenu'

interface ToolSubmenuItem {
  key: string
  label: string
  toolModeKey: string
}

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
  /** Populated when kind === 'submenu' — list of tool options */
  submenuItems?: ToolSubmenuItem[]
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

// Navigation pills only — creation actions go through Quick Create "+"
const QUICK_ACTIONS: QuickAction[] = [
  {
    key: 'journal_entry',
    label: 'Journal',
    icon: BookOpen,
    featureKey: 'journal',
    kind: 'path',
    path: '/journal',
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
    key: 'victories',
    label: 'Victories',
    icon: Trophy,
    featureKey: 'victories',
    kind: 'path',
    path: '/victories',
  },
  {
    key: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    featureKey: 'tasks',
    kind: 'path',
    path: '/tasks',
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
    kind: 'submenu',
    submenuItems: [
      { key: 'quality_time', label: 'Quality Time', toolModeKey: 'quality_time' },
      { key: 'gifts', label: 'Gifts', toolModeKey: 'gifts' },
      { key: 'observe_serve', label: 'Observe & Serve', toolModeKey: 'observe_serve' },
      { key: 'words_affirmation', label: 'Words of Affirmation', toolModeKey: 'words_affirmation' },
      { key: 'gratitude', label: 'Gratitude', toolModeKey: 'gratitude' },
    ],
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
    kind: 'submenu',
    submenuItems: [
      { key: 'higgins_say', label: 'Help Me Say Something', toolModeKey: 'higgins_say' },
      { key: 'higgins_navigate', label: 'Help Me Navigate This', toolModeKey: 'higgins_navigate' },
    ],
  },
  // PRD-34: ThoughtSift tools
  {
    key: 'thoughtsift',
    label: 'ThoughtSift',
    icon: Brain,
    featureKey: 'thoughtsift_board_of_directors',
    kind: 'submenu',
    submenuItems: [
      { key: 'board_of_directors', label: 'Board of Directors', toolModeKey: 'board_of_directors' },
      { key: 'perspective_shifter', label: 'Perspective Shifter', toolModeKey: 'perspective_shifter' },
      { key: 'decision_guide', label: 'Decision Guide', toolModeKey: 'decision_guide' },
      { key: 'mediator', label: 'Mediator', toolModeKey: 'mediator' },
      { key: 'translator', label: 'Translator', toolModeKey: 'translator' },
    ],
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

// setIndicatorMode will be used when indicator toggle UI is built
// function setIndicatorMode(mode: IndicatorMode) { localStorage.setItem(INDICATOR_MODE_KEY, mode) }

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
  const [indicatorMode] = useState<IndicatorMode>(getIndicatorMode)
  const [queueModalOpen, setQueueModalOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { canScrollLeft, canScrollRight } = useScrollOverflow(scrollRef)

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

  function handleAction(action: QuickAction, submenuModeKey?: string) {
    incrementUsage(action.key)
    if (submenuModeKey) {
      // Launched from a submenu item
      openTool(submenuModeKey)
    } else if (action.kind === 'path' && action.path) {
      navigate(action.path)
    } else if (action.kind === 'tool' && action.toolModeKey) {
      openTool(action.toolModeKey)
    } else if (action.kind === 'submenu') {
      // Submenu pills handle their own popover — no default action
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
      {/* CSS for hidden scrollbar + desktop right constraint for floating buttons.
          The fixed floating row in MomShell holds 3 LiLa avatars + NotificationBell +
          ThemeSelector + Settings, sitting at right-12 (48px). Reserve enough room so
          the QuickTasks scroll area ends well before the buttons begin. */}
      <style>{`
        .qt-scroll::-webkit-scrollbar { display: none; }
        @media (min-width: 768px) {
          .quicktasks-strip { margin-right: 22rem; }
        }
        @media (min-width: 1280px) {
          .quicktasks-strip { margin-right: 24rem; }
        }
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
          <QuickPill
            key={item.key}
            item={item}
            onAction={() => handleAction(item)}
            onSubmenuSelect={(modeKey) => handleAction(item, modeKey)}
            illustratedUrl={iconUrls[item.featureKey] ?? null}
          />
        ))}
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

      {/* Queue indicator — opens Review Queue modal.
          Always visible (mom needs to see the door exists even when
          empty so she knows nothing is broken). Empty state is dimmed
          with no glow and no badge. */}
      <button
        onClick={() => setQueueModalOpen(true)}
        className="absolute right-9 top-1/2 flex items-center justify-center rounded-full transition-colors"
        style={{
          transform: 'translateY(-50%)',
          minHeight: 'unset',
          cursor: 'pointer',
        }}
        title={
          queueCount > 0
            ? `${queueCount} pending queue item${queueCount !== 1 ? 's' : ''}`
            : 'Review Queue — all caught up'
        }
      >
        {queueCount > 0 ? (
          indicatorMode === 'glow' ? (
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
          )
        ) : (
          <Inbox size={16} style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }} />
        )}
      </button>

      {/* Review Queue modal */}
      <UniversalQueueModal
        isOpen={queueModalOpen}
        onClose={() => setQueueModalOpen(false)}
        onOpenMessages={() => {
          setQueueModalOpen(false)
          navigate('/messages')
        }}
      />

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

/** Load vault thumbnails for submenu items — fetches directly from vault_items
 *  by guided_mode_key so thumbnails always match what the AI Vault page shows. */
function useSubmenuThumbnails(items: ToolSubmenuItem[] | undefined) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!items?.length) return
    const modeKeys = items.map(i => i.toolModeKey)

    let cancelled = false
    supabase
      .from('vault_items')
      .select('guided_mode_key, thumbnail_url')
      .in('guided_mode_key', modeKeys)
      .eq('status', 'published')
      .then(({ data }) => {
        if (cancelled || !data) return
        const map: Record<string, string> = {}
        for (const item of items) {
          const match = data.find(d => d.guided_mode_key === item.toolModeKey)
          if (match?.thumbnail_url) map[item.key] = match.thumbnail_url
        }
        setThumbnails(map)
      })
    return () => { cancelled = true }
  }, [items])

  return thumbnails
}

function QuickPill({
  item,
  onAction,
  onSubmenuSelect,
  illustratedUrl,
}: {
  item: QuickAction
  onAction: () => void
  onSubmenuSelect: (modeKey: string) => void
  illustratedUrl: string | null
}) {
  const [hovered, setHovered] = useState(false)
  const [attentionGlow, setAttentionGlow] = useState(false)
  const [submenuOpen, setSubmenuOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const Icon = item.icon
  const isPinned = PINNED_ACTIONS.some(p => p.key === item.key)
  const hasSubmenu = item.kind === 'submenu' && item.submenuItems
  const thumbnails = useSubmenuThumbnails(hasSubmenu ? item.submenuItems : undefined)

  // Close submenu on outside click
  useEffect(() => {
    if (!submenuOpen) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target) &&
          triggerRef.current && !triggerRef.current.contains(target)) {
        setSubmenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [submenuOpen])

  // Position dropdown below trigger (portal-based)
  useEffect(() => {
    if (submenuOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [submenuOpen])

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

  const handleClick = () => {
    if (hasSubmenu) {
      setSubmenuOpen(!submenuOpen)
    } else {
      onAction()
    }
  }

  const submenuPortal = hasSubmenu && submenuOpen && createPortal(
    <div
      ref={dropdownRef}
      className="fixed rounded-xl shadow-xl overflow-hidden"
      style={{
        top: `${dropdownPos.top}px`,
        left: `${dropdownPos.left}px`,
        zIndex: 9999,
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        minWidth: '220px',
      }}
    >
      {item.submenuItems!.map(sub => (
        <button
          key={sub.key}
          onClick={() => {
            onSubmenuSelect(sub.toolModeKey)
            setSubmenuOpen(false)
          }}
          className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
          style={{
            color: 'var(--color-text-primary)',
            background: 'transparent',
            border: 'none',
            minHeight: 'unset',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {thumbnails[sub.key] ? (
            <img
              src={thumbnails[sub.key]}
              alt=""
              className="shrink-0 rounded"
              style={{ width: '28px', height: '28px', objectFit: 'cover' }}
            />
          ) : (
            <span
              className="shrink-0 rounded flex items-center justify-center"
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <Icon size={14} style={{ color: 'var(--color-text-secondary)' }} />
            </span>
          )}
          {sub.label}
        </button>
      ))}
    </div>,
    document.body,
  )

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
          ref={triggerRef}
          onClick={handleClick}
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
        {submenuPortal}
      </>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="shrink-0 flex items-center gap-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap"
        style={{
          padding: '6px 12px',
          backgroundColor: (hovered || submenuOpen)
            ? 'var(--color-btn-primary-bg)'
            : 'var(--color-bg-secondary)',
          color: (hovered || submenuOpen)
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
        {hasSubmenu && <ChevronDown size={12} style={{ marginLeft: '-2px' }} />}
      </button>
      {submenuPortal}
    </>
  )
}
