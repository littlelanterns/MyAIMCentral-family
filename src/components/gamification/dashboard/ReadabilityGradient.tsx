/**
 * ReadabilityGradient — PRD-24 Gamification Foundation (Dashboard layer)
 *
 * CSS overlay that sits between a background image and dashboard content,
 * darkening the bottom half (where most widgets sit) for text legibility.
 * Opacity ramps top → middle → bottom, tuned per-shell so the calmer shells
 * get lighter overlays and the Play shell (bigger UI, higher-contrast needs)
 * gets the heaviest.
 *
 * Per-shell opacity (LIGHT mode):
 *
 *   Shell       Top   Mid   Bot
 *   Play        0.30  0.50  0.70
 *   Guided      0.25  0.45  0.65
 *   Independent 0.20  0.35  0.55
 *   Adult/Mom   0.15  0.30  0.50
 *
 * Dark mode: each stop reduced by 0.10 (backgrounds are already dark).
 *
 * No animation, no JS beyond shell + dark-mode lookup. Zero hardcoded colors.
 *
 * Usage:
 *   <div style={{ position: 'relative', backgroundImage: 'url(...)' }}>
 *     <ReadabilityGradient />
 *     <DashboardContent />
 *   </div>
 */

import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useTheme } from '@/lib/theme/ThemeProvider'
import type { ShellType } from '@/lib/theme'

export interface ReadabilityGradientProps {
  /** Optional className for layout */
  className?: string
  /** zIndex relative to dashboard. Default 1 (above bg, below content). */
  zIndex?: number
}

interface GradientStops {
  top: number
  mid: number
  bot: number
}

const LIGHT_STOPS: Record<ShellType, GradientStops> = {
  play: { top: 0.3, mid: 0.5, bot: 0.7 },
  guided: { top: 0.25, mid: 0.45, bot: 0.65 },
  independent: { top: 0.2, mid: 0.35, bot: 0.55 },
  adult: { top: 0.15, mid: 0.3, bot: 0.5 },
  mom: { top: 0.15, mid: 0.3, bot: 0.5 },
}

/**
 * Dark mode reduces each stop by 0.10 (floor at 0 so nothing goes negative).
 */
function getStops(shell: ShellType, isDark: boolean): GradientStops {
  const base = LIGHT_STOPS[shell]
  if (!isDark) return base
  return {
    top: Math.max(0, base.top - 0.1),
    mid: Math.max(0, base.mid - 0.1),
    bot: Math.max(0, base.bot - 0.1),
  }
}

/**
 * Builds the linear-gradient CSS string from stops. Uses color-mix against
 * var(--color-bg-primary) so the overlay adapts to whatever theme is active.
 */
export function getReadabilityGradientCss(shell: ShellType, isDark: boolean): string {
  const stops = getStops(shell, isDark)
  const toColor = (opacity: number) =>
    `color-mix(in srgb, var(--color-bg-primary, #F9FAFB) ${Math.round(opacity * 100)}%, transparent)`

  return `linear-gradient(to bottom, ${toColor(stops.top)} 0%, ${toColor(stops.mid)} 50%, ${toColor(
    stops.bot,
  )} 100%)`
}

export function ReadabilityGradient({ className, zIndex = 1 }: ReadabilityGradientProps) {
  const motion = useShellAwareMotion()

  // useTheme throws if outside ThemeProvider. Fall back to light mode so the
  // component is still useful in isolated testing contexts (Storybook, etc.).
  let isDark = false
  try {
    const theme = useTheme()
    isDark = theme.effectiveColorMode === 'dark'
  } catch {
    if (typeof document !== 'undefined') {
      isDark = document.documentElement.classList.contains('dark')
    }
  }

  const background = getReadabilityGradientCss(motion.shell, isDark)

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex,
        background,
      }}
    />
  )
}
