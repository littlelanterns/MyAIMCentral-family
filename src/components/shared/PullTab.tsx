/**
 * PullTab — Vibe-aware pull tab for drawers (PRD-03)
 *
 * Adapts visual style based on the active vibe:
 * - Classic MyAIM: warm rounded tab with brand colors
 * - Clean & Modern: minimal thin notch, barely visible until hover
 * - Professional: small squared tab with subtle shadow
 * - Cozy Journal: washi tape image background
 *
 * Two orientations:
 * - 'bottom': horizontal tab (LiLa drawer, bottom-center)
 * - 'side': vertical tab (Notepad drawer, right edge)
 */

import type { ReactNode } from 'react'
import { useTheme } from '@/lib/theme'
import type { VibeKey } from '@/lib/theme/tokens'

export interface PullTabProps {
  orientation: 'bottom' | 'side'
  onClick: () => void
  children: ReactNode
  className?: string
  width?: number
  height?: number
}

function getTabStyles(vibe: VibeKey, orientation: 'bottom' | 'side') {
  const isBottom = orientation === 'bottom'

  switch (vibe) {
    case 'modern':
      // Minimal thin notch — barely visible, expands on hover
      return {
        background: 'var(--color-border)',
        borderRadius: isBottom ? '6px 6px 0 0' : '6px 0 0 6px',
        boxShadow: 'none',
        width: isBottom ? 60 : 6,
        height: isBottom ? 6 : 60,
      }

    case 'nautical':
      // Professional — small squared tab, subtle shadow
      return {
        background: 'var(--surface-primary, var(--color-btn-primary-bg))',
        borderRadius: isBottom ? '4px 4px 0 0' : '4px 0 0 4px',
        boxShadow: '0 -1px 4px rgba(0,0,0,0.08)',
        width: isBottom ? 140 : 32,
        height: isBottom ? 28 : 80,
      }

    case 'cozy':
      // Cozy Journal — extra rounded, warm soft shadow, slightly larger
      return {
        background: 'var(--surface-primary, var(--color-btn-primary-bg))',
        borderRadius: isBottom ? '16px 16px 0 0' : '16px 0 0 16px',
        boxShadow: isBottom
          ? '0 -4px 12px rgba(90, 64, 51, 0.15)'
          : '-3px 0 10px rgba(90, 64, 51, 0.15)',
        width: isBottom ? 170 : 40,
        height: isBottom ? 38 : 95,
      }

    case 'classic':
    default:
      // Warm rounded tab — brand style
      return {
        background: 'var(--surface-primary, var(--color-btn-primary-bg))',
        borderRadius: isBottom ? '10px 10px 0 0' : '10px 0 0 10px',
        boxShadow: isBottom
          ? '0 -3px 6px rgba(0,0,0,0.12)'
          : '-2px 0 6px rgba(0,0,0,0.12)',
        width: isBottom ? 160 : 36,
        height: isBottom ? 34 : 90,
      }
  }
}

export function PullTab({
  orientation,
  onClick,
  children,
  className = '',
  width: widthOverride,
  height: heightOverride,
}: PullTabProps) {
  const { vibe } = useTheme()
  const styles = getTabStyles(vibe, orientation)
  const isModern = vibe === 'modern'

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center transition-all duration-200
        ${isModern ? 'hover:opacity-100 opacity-60' : 'hover:brightness-110'}
        ${className}
      `.trim()}
      style={{
        background: styles.background,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        width: widthOverride ?? styles.width,
        height: heightOverride ?? styles.height,
        border: 'none',
        minHeight: 'unset',
        padding: 0,
        color: vibe === 'cozy' ? 'var(--color-text-heading)' : 'var(--color-btn-primary-text)',
        cursor: 'pointer',
        ...(styles.transform ? { transform: styles.transform } : {}),
      }}
      aria-label="Toggle drawer"
    >
      {children}
    </button>
  )
}
