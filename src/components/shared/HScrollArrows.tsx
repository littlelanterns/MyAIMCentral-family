/**
 * HScrollArrows — Universal horizontal scroll arrow indicators (Founder directive D)
 *
 * Wraps any horizontal scroll area with visible left/right ChevronLeft/ChevronRight
 * arrows for desktop/non-touchscreen users. Arrows appear when overflow content
 * exists in that direction and fade when at the end.
 *
 * Usage: <HScrollArrows><div className="overflow-x-auto">...</div></HScrollArrows>
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HScrollArrowsProps {
  children: ReactNode
  scrollAmount?: number
}

export function HScrollArrows({ children, scrollAmount = 120 }: HScrollArrowsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    // Find the scrollable child (first child with overflow)
    const scrollEl = el.querySelector('[data-hscroll]') as HTMLElement || el.firstElementChild as HTMLElement
    if (!scrollEl) return

    setCanScrollLeft(scrollEl.scrollLeft > 2)
    setCanScrollRight(scrollEl.scrollLeft + scrollEl.clientWidth < scrollEl.scrollWidth - 2)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = containerRef.current
    if (!el) return
    const scrollEl = el.querySelector('[data-hscroll]') as HTMLElement || el.firstElementChild as HTMLElement
    if (!scrollEl) return

    scrollEl.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(scrollEl)

    return () => {
      scrollEl.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll])

  function scroll(direction: 'left' | 'right') {
    const el = containerRef.current
    if (!el) return
    const scrollEl = el.querySelector('[data-hscroll]') as HTMLElement || el.firstElementChild as HTMLElement
    if (!scrollEl) return
    scrollEl.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div ref={containerRef} className="relative group">
      {children}

      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center
                     w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: 'var(--color-bg-card, #fff)',
            color: 'var(--color-text-secondary)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            minHeight: 'unset',
          }}
          aria-label="Scroll left"
          type="button"
        >
          <ChevronLeft size={14} />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center
                     w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: 'var(--color-bg-card, #fff)',
            color: 'var(--color-text-secondary)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            minHeight: 'unset',
          }}
          aria-label="Scroll right"
          type="button"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}
