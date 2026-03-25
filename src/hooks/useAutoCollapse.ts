/**
 * useAutoCollapse — PRD-04
 *
 * Monitors the main content area width via ResizeObserver.
 * When content drops below 480px, auto-collapses QuickTasks.
 * Tracks auto-collapsed state separately from manual collapse.
 *
 * Returns whether QuickTasks should be force-collapsed by the system.
 */

import { useEffect, useRef, useState } from 'react'

const CONTENT_MIN_WIDTH = 480

export function useAutoCollapse() {
  const mainRef = useRef<HTMLDivElement>(null)
  const [quickTasksAutoCollapsed, setQuickTasksAutoCollapsed] = useState(false)
  const collapsedRef = useRef(false)

  // Keep ref in sync with state so the observer callback always reads current value
  collapsedRef.current = quickTasksAutoCollapsed

  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width < CONTENT_MIN_WIDTH && !collapsedRef.current) {
          collapsedRef.current = true
          setQuickTasksAutoCollapsed(true)
        } else if (width >= CONTENT_MIN_WIDTH + 50 && collapsedRef.current) {
          // Add 50px hysteresis to prevent flapping
          collapsedRef.current = false
          setQuickTasksAutoCollapsed(false)
        }
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, []) // Stable — observer reads current state via ref

  return { mainRef, quickTasksAutoCollapsed }
}
