/**
 * SegmentHeader — Build M Phase 5
 *
 * Compact segment header for Guided/Independent/Adult shells.
 * Shows segment name + icon + progress pill + optional collapse chevron.
 * Play shell uses its own chunky PlayTaskTileGrid banners instead.
 */

import { useMemo, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface SegmentHeaderProps {
  name: string
  iconKey?: string | null
  completedCount: number
  totalCount: number
  /** If provided, renders as a collapsible header */
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  /** Optional children rendered below (task list) */
  children?: ReactNode
}

export function SegmentHeader({
  name,
  iconKey,
  completedCount,
  totalCount,
  isCollapsed,
  onToggleCollapse,
  children,
}: SegmentHeaderProps) {
  const isComplete = totalCount > 0 && completedCount >= totalCount
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isCollapsible = onToggleCollapse !== undefined

  const Icon = useMemo(() => {
    if (!iconKey) return null
    const key = iconKey.charAt(0).toUpperCase() + iconKey.slice(1)
    return (LucideIcons as Record<string, unknown>)[key] as
      | React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
      | undefined
  }, [iconKey])

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={isCollapsible ? onToggleCollapse : undefined}
        className="w-full flex items-center gap-2 py-2 px-3 rounded-lg transition-colors"
        style={{
          background: isComplete
            ? 'color-mix(in srgb, var(--color-accent-warm) 8%, transparent)'
            : 'color-mix(in srgb, var(--color-bg-secondary) 60%, transparent)',
          cursor: isCollapsible ? 'pointer' : 'default',
          border: 'none',
          textAlign: 'left',
          minHeight: 'unset',
        }}
      >
        {/* Icon */}
        {Icon && (
          <Icon
            size={16}
            style={{ color: isComplete ? 'var(--color-accent-warm)' : 'var(--color-text-secondary)', flexShrink: 0 }}
          />
        )}

        {/* Name */}
        <span
          className="flex-1 text-sm font-semibold truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {name}
        </span>

        {/* Progress pill */}
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: isComplete
              ? 'color-mix(in srgb, var(--color-accent-warm) 15%, transparent)'
              : 'var(--color-bg-secondary)',
            color: isComplete ? 'var(--color-accent-warm)' : 'var(--color-text-secondary)',
          }}
        >
          {isComplete ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} />
              Done
            </span>
          ) : (
            `${completedCount}/${totalCount}`
          )}
        </span>

        {/* Progress bar (compact) */}
        {!isComplete && (
          <div
            className="shrink-0"
            style={{
              width: '3rem',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-bg-secondary)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                borderRadius: '9999px',
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                transition: 'width 0.4s ease-out',
              }}
            />
          </div>
        )}

        {/* Collapse chevron */}
        {isCollapsible && (
          <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </span>
        )}
      </button>

      {/* Content (tasks) — hidden when collapsed */}
      {(!isCollapsible || !isCollapsed) && children}
    </div>
  )
}
