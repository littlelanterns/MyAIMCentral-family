/**
 * QuickCreate — Universal draggable FAB for quick-action shortcuts
 *
 * Single mode: floating action button on ALL screen sizes.
 * Draggable — long-press or drag to reposition, snaps to screen edges.
 * Position persists to localStorage.
 * Semi-transparent when idle, full opacity on hover/interaction.
 * z-index: above page content, below modals.
 *
 * Spec: UX Overhaul Session 4 — founder-approved FAB-everywhere design.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, CheckSquare, StickyNote, Trophy, CalendarPlus, HandHelping, Brain } from 'lucide-react'
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

export interface QuickCreateProps {
  onAddTask?: () => void
  onQuickNote?: () => void
  onLogVictory?: () => void
  onCalendarEvent?: () => void
  onSendRequest?: () => void
  onMindSweep?: () => void
}

const ALLOWED_SHELLS = new Set(['mom', 'adult', 'independent'])
const STORAGE_KEY = 'myaim-quickcreate-pos'
const FAB_SIZE = 52
const EDGE_SNAP_MARGIN = 12

interface FabPosition {
  x: number
  y: number
}

function getStoredPosition(): FabPosition | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

function storePosition(pos: FabPosition) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch { /* ignore */ }
}

function clampPosition(x: number, y: number): FabPosition {
  const maxX = window.innerWidth - FAB_SIZE - EDGE_SNAP_MARGIN
  const maxY = window.innerHeight - FAB_SIZE - EDGE_SNAP_MARGIN
  return {
    x: Math.max(EDGE_SNAP_MARGIN, Math.min(x, maxX)),
    y: Math.max(EDGE_SNAP_MARGIN, Math.min(y, maxY)),
  }
}

function snapToEdge(x: number, y: number): FabPosition {
  const midX = window.innerWidth / 2
  const snappedX = x < midX ? EDGE_SNAP_MARGIN : window.innerWidth - FAB_SIZE - EDGE_SNAP_MARGIN
  const clamped = clampPosition(snappedX, y)
  return clamped
}

function defaultPosition(): FabPosition {
  return {
    x: window.innerWidth - FAB_SIZE - EDGE_SNAP_MARGIN,
    y: window.innerHeight - FAB_SIZE - 80, // above bottom nav
  }
}

export function QuickCreate({
  onAddTask,
  onQuickNote,
  onLogVictory,
  onCalendarEvent,
  onSendRequest,
  onMindSweep,
}: QuickCreateProps) {
  const { shell } = useShell()
  const [isOpen, setIsOpen] = useState(false)
  const [pos, setPos] = useState<FabPosition>(() => getStoredPosition() || defaultPosition())
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; fabX: number; fabY: number } | null>(null)
  const hasDraggedRef = useRef(false)
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

  // Recalculate on window resize
  useEffect(() => {
    function handleResize() {
      setPos(prev => clampPosition(prev.x, prev.y))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ── Drag handling (mouse) ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartRef.current = { startX: e.clientX, startY: e.clientY, fabX: pos.x, fabY: pos.y }
    hasDraggedRef.current = false

    function handleMouseMove(ev: MouseEvent) {
      if (!dragStartRef.current) return
      const dx = ev.clientX - dragStartRef.current.startX
      const dy = ev.clientY - dragStartRef.current.startY
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedRef.current = true
        setIsDragging(true)
      }
      if (hasDraggedRef.current) {
        const newX = dragStartRef.current.fabX + dx
        const newY = dragStartRef.current.fabY + dy
        setPos(clampPosition(newX, newY))
      }
    }

    function handleMouseUp(ev: MouseEvent) {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      if (hasDraggedRef.current && dragStartRef.current) {
        const newX = dragStartRef.current.fabX + (ev.clientX - dragStartRef.current.startX)
        const newY = dragStartRef.current.fabY + (ev.clientY - dragStartRef.current.startY)
        const snapped = snapToEdge(newX, newY)
        setPos(snapped)
        storePosition(snapped)
      }
      setIsDragging(false)
      dragStartRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [pos])

  // ── Drag handling (touch) ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartRef.current = { startX: touch.clientX, startY: touch.clientY, fabX: pos.x, fabY: pos.y }
    hasDraggedRef.current = false

    function handleTouchMove(ev: TouchEvent) {
      if (!dragStartRef.current) return
      const t = ev.touches[0]
      const dx = t.clientX - dragStartRef.current.startX
      const dy = t.clientY - dragStartRef.current.startY
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        hasDraggedRef.current = true
        setIsDragging(true)
        ev.preventDefault() // prevent scroll while dragging
      }
      if (hasDraggedRef.current) {
        setPos(clampPosition(dragStartRef.current.fabX + dx, dragStartRef.current.fabY + dy))
      }
    }

    function handleTouchEnd(ev: TouchEvent) {
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      if (hasDraggedRef.current && dragStartRef.current) {
        const t = ev.changedTouches[0]
        const newX = dragStartRef.current.fabX + (t.clientX - dragStartRef.current.startX)
        const newY = dragStartRef.current.fabY + (t.clientY - dragStartRef.current.startY)
        const snapped = snapToEdge(newX, newY)
        setPos(snapped)
        storePosition(snapped)
      }
      setIsDragging(false)
      dragStartRef.current = null
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [pos])

  const handleClick = useCallback(() => {
    // Only toggle popover if we didn't just drag
    if (!hasDraggedRef.current) {
      setIsOpen(prev => !prev)
    }
  }, [])

  // Popover position: above or below FAB, left or right aligned
  const popoverPos = useCallback(() => {
    const fabCenterX = pos.x + FAB_SIZE / 2
    const isRightSide = fabCenterX > window.innerWidth / 2
    const isBottomHalf = pos.y > window.innerHeight / 2

    return {
      left: isRightSide ? pos.x + FAB_SIZE - 200 : pos.x,
      top: isBottomHalf ? undefined : pos.y + FAB_SIZE + 8,
      bottom: isBottomHalf ? window.innerHeight - pos.y + 8 : undefined,
    }
  }, [pos])

  return (
    <>
      {/* FAB button */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed flex items-center justify-center rounded-full shadow-lg transition-all duration-200"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${FAB_SIZE}px`,
          height: `${FAB_SIZE}px`,
          background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
          color: 'var(--color-btn-primary-text, #fff)',
          border: 'none',
          minHeight: 'unset',
          zIndex: 35, // above content, below modals (z-40+)
          opacity: isDragging ? 1 : isHovered || isOpen ? 1 : 0.75,
          cursor: isDragging ? 'grabbing' : 'pointer',
          transform: isOpen ? 'rotate(45deg)' : 'none',
          touchAction: 'none', // prevent scroll interference
          userSelect: 'none',
        }}
        aria-label="Quick Create"
      >
        <Plus size={24} />
      </button>

      {/* Popover */}
      {isOpen && !isDragging && createPortal(
        <div
          ref={popoverRef}
          className="fixed animate-slideDown"
          style={{
            left: `${popoverPos().left}px`,
            top: popoverPos().top !== undefined ? `${popoverPos().top}px` : undefined,
            bottom: popoverPos().bottom !== undefined ? `${popoverPos().bottom}px` : undefined,
            width: '200px',
            zIndex: 36, // just above FAB
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
                  onClick={() => handleAction(action.key)}
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
      )}
    </>
  )
}
