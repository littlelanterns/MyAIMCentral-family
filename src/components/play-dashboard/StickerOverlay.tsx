/**
 * StickerOverlay — Build M Sub-phase D
 *
 * Renders a single creature image absolutely positioned within the sticker
 * book page view. Position is stored as relative coordinates (0–1 range) on
 * member_creature_collection.position_x / position_y.
 *
 * Kids can drag creatures around on the page (touch + mouse). The sticker
 * stays clamped within the parent container bounds. On drop, the new
 * relative position is persisted via the onMove callback.
 *
 * Standard width is 8% of the page width; aspect ratio is preserved.
 */

import { useState, useRef, useCallback } from 'react'

interface StickerOverlayProps {
  /** Creature image URL (from gamification_creatures.image_url) */
  imageUrl: string
  /** Creature display name for alt text */
  displayName: string
  /** Horizontal position 0–1 (left to right) */
  positionX: number
  /** Vertical position 0–1 (top to bottom) */
  positionY: number
  /** Rarity for optional glow styling */
  rarity?: 'common' | 'rare' | 'legendary'
  /** Called on drop with new relative position (0–1) — persists to DB */
  onMove?: (newX: number, newY: number) => void
  /** Reports drag state so the parent can show edge zone indicators */
  onDragStateChange?: (isDragging: boolean) => void
}

const RARITY_GLOW: Record<string, string> = {
  common: 'none',
  rare: '0 0 6px 2px var(--color-sparkle-gold-light, #E8C547)',
  legendary: '0 0 10px 3px var(--color-sparkle-gold, #D4AF37)',
}

/** Clamp a value between 0.02 and 0.98 so stickers stay within the page */
function clamp01(v: number): number {
  return Math.max(0.02, Math.min(0.98, v))
}

export function StickerOverlay({
  imageUrl,
  displayName,
  positionX,
  positionY,
  rarity = 'common',
  onMove,
  onDragStateChange,
}: StickerOverlayProps) {
  // Local position state for smooth dragging (overrides props while dragging)
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const dragRef = useRef<{
    startClientX: number
    startClientY: number
    startRelX: number
    startRelY: number
    parentRect: DOMRect
    hasMoved: boolean
  } | null>(null)

  const elRef = useRef<HTMLDivElement>(null)

  /** Get the parent container (the page image wrapper) bounding rect */
  const getParentRect = useCallback((): DOMRect | null => {
    const parent = elRef.current?.parentElement
    return parent?.getBoundingClientRect() ?? null
  }, [])

  /** Convert a client-space delta into a relative 0–1 delta given the parent size */
  const clientToRelative = useCallback(
    (clientDX: number, clientDY: number, parentRect: DOMRect) => ({
      dx: parentRect.width > 0 ? clientDX / parentRect.width : 0,
      dy: parentRect.height > 0 ? clientDY / parentRect.height : 0,
    }),
    [],
  )

  // ── Mouse drag ────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onMove) return
      e.preventDefault()
      const parentRect = getParentRect()
      if (!parentRect) return

      const currentX = localPos?.x ?? positionX
      const currentY = localPos?.y ?? positionY

      dragRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startRelX: currentX,
        startRelY: currentY,
        parentRect,
        hasMoved: false,
      }

      function handleMouseMove(ev: MouseEvent) {
        if (!dragRef.current) return
        const dx = ev.clientX - dragRef.current.startClientX
        const dy = ev.clientY - dragRef.current.startClientY
        if (!dragRef.current.hasMoved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          dragRef.current.hasMoved = true
          setIsDragging(true)
          onDragStateChange?.(true)
        }
        if (dragRef.current.hasMoved) {
          const rel = clientToRelative(dx, dy, dragRef.current.parentRect)
          setLocalPos({
            x: clamp01(dragRef.current.startRelX + rel.dx),
            y: clamp01(dragRef.current.startRelY + rel.dy),
          })
        }
      }

      function handleMouseUp(ev: MouseEvent) {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        if (dragRef.current?.hasMoved) {
          const dx = ev.clientX - dragRef.current.startClientX
          const dy = ev.clientY - dragRef.current.startClientY
          const rel = clientToRelative(dx, dy, dragRef.current.parentRect)
          const finalX = clamp01(dragRef.current.startRelX + rel.dx)
          const finalY = clamp01(dragRef.current.startRelY + rel.dy)
          setLocalPos({ x: finalX, y: finalY })
          onMove?.(finalX, finalY)
        }
        setIsDragging(false)
        onDragStateChange?.(false)
        dragRef.current = null
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [onMove, positionX, positionY, localPos, getParentRect, clientToRelative],
  )

  // ── Touch drag ────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!onMove) return
      const touch = e.touches[0]
      const parentRect = getParentRect()
      if (!parentRect) return

      const currentX = localPos?.x ?? positionX
      const currentY = localPos?.y ?? positionY

      dragRef.current = {
        startClientX: touch.clientX,
        startClientY: touch.clientY,
        startRelX: currentX,
        startRelY: currentY,
        parentRect,
        hasMoved: false,
      }

      function handleTouchMove(ev: TouchEvent) {
        if (!dragRef.current) return
        const t = ev.touches[0]
        const dx = t.clientX - dragRef.current.startClientX
        const dy = t.clientY - dragRef.current.startClientY
        if (!dragRef.current.hasMoved && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
          dragRef.current.hasMoved = true
          setIsDragging(true)
          onDragStateChange?.(true)
          ev.preventDefault() // prevent scroll while dragging
        }
        if (dragRef.current.hasMoved) {
          ev.preventDefault()
          const rel = clientToRelative(dx, dy, dragRef.current.parentRect)
          setLocalPos({
            x: clamp01(dragRef.current.startRelX + rel.dx),
            y: clamp01(dragRef.current.startRelY + rel.dy),
          })
        }
      }

      function handleTouchEnd(ev: TouchEvent) {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        if (dragRef.current?.hasMoved) {
          const t = ev.changedTouches[0]
          const dx = t.clientX - dragRef.current.startClientX
          const dy = t.clientY - dragRef.current.startClientY
          const rel = clientToRelative(dx, dy, dragRef.current.parentRect)
          const finalX = clamp01(dragRef.current.startRelX + rel.dx)
          const finalY = clamp01(dragRef.current.startRelY + rel.dy)
          setLocalPos({ x: finalX, y: finalY })
          onMove?.(finalX, finalY)
        }
        setIsDragging(false)
        onDragStateChange?.(false)
        dragRef.current = null
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    },
    [onMove, positionX, positionY, localPos, getParentRect, clientToRelative],
  )

  const displayX = localPos?.x ?? positionX
  const displayY = localPos?.y ?? positionY

  return (
    <div
      ref={elRef}
      role="img"
      aria-label={displayName}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'absolute',
        left: `${(displayX * 100).toFixed(1)}%`,
        top: `${(displayY * 100).toFixed(1)}%`,
        width: '8%',
        transform: `translate(-50%, -50%) ${isDragging ? 'scale(1.15)' : 'scale(1)'}`,
        cursor: onMove ? (isDragging ? 'grabbing' : 'grab') : 'default',
        zIndex: isDragging ? 10 : 1,
        transition: isDragging ? 'none' : 'transform 0.15s ease-out, left 0.15s ease-out, top 0.15s ease-out',
        touchAction: 'none', // prevent browser scroll/zoom during drag
        userSelect: 'none',
        WebkitUserSelect: 'none',
        filter: rarity !== 'common' ? `drop-shadow(${RARITY_GLOW[rarity]})` : undefined,
      }}
    >
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: 'auto',
          pointerEvents: 'none', // img doesn't capture events — the wrapper div does
        }}
        loading="lazy"
      />
    </div>
  )
}
