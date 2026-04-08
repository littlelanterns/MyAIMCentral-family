/**
 * useReducedMotion — PRD-24 Gamification Foundation
 *
 * SSR-safe centralized prefers-reduced-motion detection. Listens for changes
 * (the media query CAN flip mid-session if the user toggles their OS setting)
 * and re-renders the consuming component when it does.
 *
 * Every gamification animation component MUST gate its motion behind this hook
 * and provide an explicit static fallback that conveys the same information.
 *
 *   const prefersReducedMotion = useReducedMotion()
 *   if (prefersReducedMotion) return <StaticFallback />
 *   return <AnimatedVersion />
 */

import { createContext, useContext, useEffect, useState, type ReactNode, createElement } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Test/showcase override. When `ReducedMotionOverrideProvider` wraps part of
 * the tree with a non-null value, every gamification component inside sees
 * that value instead of the OS preference. App code never uses this — it's
 * for the GamificationShowcase demo so we can preview both states without
 * touching OS settings.
 */
const ReducedMotionOverrideContext = createContext<boolean | null>(null)

export interface ReducedMotionOverrideProviderProps {
  /** true = force reduced motion ON, false = force OFF, null = use OS preference */
  value: boolean | null
  children: ReactNode
}

export function ReducedMotionOverrideProvider({ value, children }: ReducedMotionOverrideProviderProps) {
  return createElement(ReducedMotionOverrideContext.Provider, { value }, children)
}

export function useReducedMotion(): boolean {
  const override = useContext(ReducedMotionOverrideContext)

  // SSR safe initial — false on the server, real value once mounted.
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia(QUERY)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)

    // Sync once on mount in case SSR initial was wrong
    setPrefersReducedMotion(mq.matches)

    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return override ?? prefersReducedMotion
}
