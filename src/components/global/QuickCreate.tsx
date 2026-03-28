/**
 * QuickCreate — Global "+" button with popover for quick-action shortcuts
 *
 * Desktop: Rightmost pill in QuickTasks strip.
 * Mobile: FAB in bottom-right corner, above bottom nav.
 *
 * Opens a compact popover with 6 quick actions.
 * Spec: specs/Remaining-Implementation-Specs.md → Spec 1
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, CheckSquare, StickyNote, Trophy, CalendarPlus, HandHelping, Brain, X } from 'lucide-react'
import { useShell } from '@/components/shells/ShellProvider'

const QUICK_ACTIONS = [
  { key: 'task', label: 'Add Task', icon: CheckSquare },
  { key: 'note', label: 'Quick Note', icon: StickyNote },
  { key: 'victory', label: 'Log Victory', icon: Trophy },
  { key: 'event', label: 'Calendar Event', icon: CalendarPlus },
  { key: 'request', label: 'Send Request', icon: HandHelping },
  { key: 'sweep', label: 'Mind Sweep', icon: Brain },
] as const

type QuickActionKey = typeof QUICK_ACTIONS[number]['key']

interface QuickCreateProps {
  /** Called when "Add Task" is selected */
  onAddTask?: () => void
  /** Called when "Quick Note" is selected */
  onQuickNote?: () => void
  /** Called when "Log Victory" is selected */
  onLogVictory?: () => void
  /** Called when "Calendar Event" is selected */
  onCalendarEvent?: () => void
  /** Called when "Send Request" is selected */
  onSendRequest?: () => void
  /** Called when "Mind Sweep" is selected */
  onMindSweep?: () => void
  /** Render mode — strip inserts as a pill, fab renders floating button */
  mode?: 'strip' | 'fab'
}

const ALLOWED_SHELLS = new Set(['mom', 'adult', 'independent'])

export function QuickCreate({
  onAddTask,
  onQuickNote,
  onLogVictory,
  onCalendarEvent,
  onSendRequest,
  onMindSweep,
  mode = 'strip',
}: QuickCreateProps) {
  const { shell } = useShell()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  if (!ALLOWED_SHELLS.has(shell)) return null

  const handleAction = useCallback((key: QuickActionKey) => {
    setIsOpen(false)
    switch (key) {
      case 'task': onAddTask?.(); break
      case 'note': onQuickNote?.(); break
      case 'victory': onLogVictory?.(); break
      case 'event': onCalendarEvent?.(); break
      case 'request': onSendRequest?.(); break
      case 'sweep': onMindSweep?.(); break
    }
  }, [onAddTask, onQuickNote, onLogVictory, onCalendarEvent, onSendRequest, onMindSweep])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  if (mode === 'fab') {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed z-30 flex items-center justify-center rounded-full shadow-lg md:hidden"
          style={{
            bottom: '4.5rem',
            right: '1rem',
            width: '56px',
            height: '56px',
            background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text, #fff)',
            border: 'none',
            minHeight: 'unset',
          }}
          aria-label="Quick Create"
        >
          <Plus size={24} />
        </button>
        {isOpen && <QuickCreatePopover
          anchorRef={buttonRef}
          popoverRef={popoverRef}
          onAction={handleAction}
          position="above"
        />}
      </>
    )
  }

  // Strip mode — rendered as a pill in the QuickTasks bar
  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          width: '36px',
          height: '36px',
          background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
          color: 'var(--color-btn-primary-text, #fff)',
          border: 'none',
          minHeight: 'unset',
        }}
        aria-label="Quick Create"
      >
        <Plus size={18} />
      </button>
      {isOpen && <QuickCreatePopover
        anchorRef={buttonRef}
        popoverRef={popoverRef}
        onAction={handleAction}
        position="below"
      />}
    </>
  )
}

function QuickCreatePopover({
  anchorRef,
  popoverRef,
  onAction,
  position,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>
  popoverRef: React.RefObject<HTMLDivElement | null>
  onAction: (key: QuickActionKey) => void
  position: 'above' | 'below'
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    if (position === 'above') {
      // Position above the FAB
      setPos({
        top: rect.top - 8, // 8px gap above
        left: Math.max(8, rect.right - 200), // right-aligned, min 8px from edge
      })
    } else {
      // Position below the strip button
      setPos({
        top: rect.bottom + 6,
        left: Math.max(8, rect.left - 100),
      })
    }
  }, [anchorRef, position])

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed animate-slideDown"
      style={{
        top: position === 'above' ? undefined : `${pos.top}px`,
        bottom: position === 'above' ? `${window.innerHeight - pos.top}px` : undefined,
        left: `${pos.left}px`,
        width: '200px',
        zIndex: 'var(--z-modal-content, 55)' as unknown as number,
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        boxShadow: 'var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.2))',
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Quick Create
        </span>
      </div>
      <div className="py-1">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.key}
              onClick={() => onAction(action.key)}
              className="w-full flex items-center gap-2.5 text-sm transition-colors"
              style={{
                padding: '0.5rem 0.75rem',
                color: 'var(--color-text-primary)',
                background: 'transparent',
                border: 'none',
                minHeight: 'unset',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Icon size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}
