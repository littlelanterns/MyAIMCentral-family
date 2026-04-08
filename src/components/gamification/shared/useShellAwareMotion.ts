/**
 * useShellAwareMotion — PRD-24 Gamification Foundation
 *
 * Returns shell-specific MULTIPLIERS that gamification components apply to
 * their own base timing/sizing. The five shells get progressively calmer:
 *
 *   Play     → bouncy, big, particle-heavy        (children, max delight)
 *   Guided   → moderate, warm                     (8-12 yo, moderate delight)
 *   Independent → small, fast, no idle            (teens, restrained polish)
 *   Adult / Mom → minimal, fastest                (adults, subtle accents)
 *
 * Components use the multipliers like:
 *   const m = useShellAwareMotion()
 *   const duration = 600 * m.durationMultiplier
 *   const particles = Math.round(20 * m.particleMultiplier)
 *
 * Convention #46: SparkleOverlay is exclusively for Play victory celebrations.
 * Gamification animations use this hook + RevealSparkle instead.
 */

import { createContext, useContext, type ReactNode, createElement } from 'react'
import { useShell } from '@/components/shells'
import type { ShellType } from '@/lib/theme'

/**
 * Test/showcase override. When a `ShellMotionOverrideProvider` wraps part of
 * the tree, every gamification component inside sees that shell instead of
 * the real one. App code never uses this — it's for the GamificationShowcase
 * demo page so we can preview every component across all 5 shells.
 */
const ShellMotionOverrideContext = createContext<ShellType | null>(null)

export interface ShellMotionOverrideProviderProps {
  shell: ShellType | null
  children: ReactNode
}

export function ShellMotionOverrideProvider({ shell, children }: ShellMotionOverrideProviderProps) {
  return createElement(ShellMotionOverrideContext.Provider, { value: shell }, children)
}

export interface ShellMotionConfig {
  shell: ShellType
  /** Multiply base animation durations (ms) by this. Play 1.4 → Adult 0.7 */
  durationMultiplier: number
  /** Multiply base particle counts by this. Play 1.5 → Adult 0.25 */
  particleMultiplier: number
  /** Multiply base element scales by this. Play 1.4 → Adult 0.7 */
  scaleMultiplier: number
  /** CSS easing function. Play gets the bouncy spring. */
  easing: string
  /** Convenience flags */
  isPlay: boolean
  isGuided: boolean
  isIndependent: boolean
  isAdult: boolean
  /** Whether components should run idle/ambient animations (breathing, sway) */
  hasIdleAnimations: boolean
  /** Whether components should render decorative sparkle trails on motion paths */
  hasSparkleTrails: boolean
  /** Whether milestone celebrations include confetti */
  hasConfetti: boolean
  /** Delay before allowing user to skip/dismiss a celebration (ms) */
  skipDelay: number
  /** Whether emoji is permitted in component output */
  emojiPermitted: boolean
  /** Minimum touch target size (px) — matches PRD-03 shell tokens */
  touchTargetMin: number
}

const PLAY_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Bouncy spring
const STANDARD_EASING = 'ease-out'

const CONFIG_BY_SHELL: Record<ShellType, Omit<ShellMotionConfig, 'shell'>> = {
  play: {
    durationMultiplier: 1.4,
    particleMultiplier: 1.5,
    scaleMultiplier: 1.4,
    easing: PLAY_EASING,
    isPlay: true,
    isGuided: false,
    isIndependent: false,
    isAdult: false,
    hasIdleAnimations: true,
    hasSparkleTrails: true,
    hasConfetti: true,
    skipDelay: 1000,
    emojiPermitted: true,
    touchTargetMin: 56,
  },
  guided: {
    durationMultiplier: 1.0,
    particleMultiplier: 1.0,
    scaleMultiplier: 1.0,
    easing: STANDARD_EASING,
    isPlay: false,
    isGuided: true,
    isIndependent: false,
    isAdult: false,
    hasIdleAnimations: true,
    hasSparkleTrails: true,
    hasConfetti: false,
    skipDelay: 500,
    emojiPermitted: false,
    touchTargetMin: 48,
  },
  independent: {
    durationMultiplier: 0.85,
    particleMultiplier: 0.5,
    scaleMultiplier: 0.85,
    easing: STANDARD_EASING,
    isPlay: false,
    isGuided: false,
    isIndependent: true,
    isAdult: false,
    hasIdleAnimations: false,
    hasSparkleTrails: false,
    hasConfetti: false,
    skipDelay: 0,
    emojiPermitted: false,
    touchTargetMin: 44,
  },
  adult: {
    durationMultiplier: 0.7,
    particleMultiplier: 0.25,
    scaleMultiplier: 0.7,
    easing: STANDARD_EASING,
    isPlay: false,
    isGuided: false,
    isIndependent: false,
    isAdult: true,
    hasIdleAnimations: false,
    hasSparkleTrails: false,
    hasConfetti: false,
    skipDelay: 0,
    emojiPermitted: false,
    touchTargetMin: 44,
  },
  mom: {
    durationMultiplier: 0.7,
    particleMultiplier: 0.25,
    scaleMultiplier: 0.7,
    easing: STANDARD_EASING,
    isPlay: false,
    isGuided: false,
    isIndependent: false,
    isAdult: true,
    hasIdleAnimations: false,
    hasSparkleTrails: false,
    hasConfetti: false,
    skipDelay: 0,
    emojiPermitted: false,
    touchTargetMin: 44,
  },
}

export function useShellAwareMotion(): ShellMotionConfig {
  const override = useContext(ShellMotionOverrideContext)
  const { shell: realShell } = useShell()
  const shell = override ?? realShell
  return {
    shell,
    ...CONFIG_BY_SHELL[shell],
  }
}

/**
 * Static lookup for testing / Storybook / showcase pages where shell is
 * known but the hook context isn't available. Prefer the hook in app code.
 */
export function getShellMotionConfig(shell: ShellType): ShellMotionConfig {
  return {
    shell,
    ...CONFIG_BY_SHELL[shell],
  }
}
