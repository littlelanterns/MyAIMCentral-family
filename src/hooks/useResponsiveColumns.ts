import { useEffect, useState } from 'react'
import { getOptimalColumnCount } from '@/lib/utils/gridColumns'

/**
 * Responsive column count for grids of N items.
 * Caps: 5 desktop (>=1024px), 3 tablet (>=768px), 2 mobile (<768px).
 * Algorithm avoids leaving a singleton on the last row.
 *
 * Source: gridColumns.ts (Archives Bublup-style folder grid pattern).
 */
export function useResponsiveColumns(totalCards: number) {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const maxCols = width >= 1024 ? 5 : width >= 768 ? 3 : 2
  const isMobile = width < 768

  return {
    columns: getOptimalColumnCount(totalCards, maxCols),
    isMobile,
    width,
  }
}
