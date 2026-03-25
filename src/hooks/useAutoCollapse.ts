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

  useEffect(() => {
    const el = mainRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width < CONTENT_MIN_WIDTH && !quickTasksAutoCollapsed) {
          setQuickTasksAutoCollapsed(true)
        } else if (width >= CONTENT_MIN_WIDTH + 50 && quickTasksAutoCollapsed) {
          // Add 50px hysteresis to prevent flapping
          setQuickTasksAutoCollapsed(false)
        }
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [quickTasksAutoCollapsed])

  return { mainRef, quickTasksAutoCollapsed }
}
