/**
 * ScrollRow — universal horizontal scroll container
 *
 * Desktop: circle ← → arrow buttons appear on hover
 * Mobile: subtle "swipe" hint text, touch-scroll with momentum
 * No visible scrollbars anywhere
 *
 * Use this for ALL horizontal scroll/swipe areas in the platform.
 */

import { useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react'

interface ScrollRowProps {
  children: ReactNode
  /** Gap between items (Tailwind class, default 'gap-3') */
  gap?: string
  /** How many pixels each arrow click scrolls (default 280) */
  scrollAmount?: number
  /** Show the mobile swipe hint (default true) */
  showSwipeHint?: boolean
  /** Additional className for the scroll container */
  className?: string
}

export function ScrollRow({
  children,
  gap = 'gap-3',
  scrollAmount = 280,
  showSwipeHint = true,
  className = '',
}: ScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 'left' | 'right') {
    scrollRef.current?.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative group">
      {/* Left arrow — desktop only, appears on hover */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
        aria-label="Scroll left"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Right arrow — desktop only, appears on hover */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
        }}
        aria-label="Scroll right"
      >
        <ChevronRight size={16} />
      </button>

      {/* Scroll container — no scrollbar, snap scroll, touch momentum */}
      <div
        ref={scrollRef}
        className={`flex ${gap} overflow-x-auto pb-2 snap-x snap-mandatory ${className}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* Swipe hint — mobile only */}
      {showSwipeHint && (
        <div
          className="flex md:hidden items-center justify-center gap-1 py-1"
          style={{ color: 'var(--color-text-secondary)', opacity: 0.35 }}
        >
          <MoveHorizontal size={12} />
          <span className="text-[10px]">swipe</span>
        </div>
      )}
    </div>
  )
}
