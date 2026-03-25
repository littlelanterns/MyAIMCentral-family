/**
 * PerspectiveSwitcher — PRD-04
 *
 * Segmented control shown on the dashboard page. Visible only to Mom
 * (role === 'primary_parent'). Lets her switch between three dashboard
 * perspectives: My Dashboard, Family Overview, and Family Hub.
 *
 * This component is a pure presentational control — it does NOT route or
 * render the actual views. The parent (DashboardPage) owns the active state
 * and decides what to render for each perspective.
 *
 * Note: This component is separate from ViewAsMemberPicker (role-impersonation).
 */

import { useShell } from './ShellProvider'

// ─── Types ───────────────────────────────────────────────────

export type DashboardView = 'personal' | 'family_overview' | 'family_hub'

export interface PerspectiveSwitcherProps {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
}

// ─── Segment definitions ──────────────────────────────────────

interface Segment {
  view: DashboardView
  label: string
  shortLabel: string  // Used on narrow screens
}

const SEGMENTS: Segment[] = [
  {
    view: 'personal',
    label: 'My Dashboard',
    shortLabel: 'Me',
  },
  {
    view: 'family_overview',
    label: 'Family Overview',
    shortLabel: 'Overview',
  },
  {
    view: 'family_hub',
    label: 'Family Hub',
    shortLabel: 'Hub',
  },
]

// ─── Component ───────────────────────────────────────────────

export function PerspectiveSwitcher({ activeView, onViewChange }: PerspectiveSwitcherProps) {
  const { role } = useShell()

  // Only visible to primary parent (Mom)
  if (role !== 'primary_parent') return null

  return (
    <div className="flex justify-center w-full px-4 mb-4 md:mb-6">
      <div
        className="flex items-center w-full md:w-auto"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '9999px',  // fully rounded pill container
          padding: '3px',
          maxWidth: '500px',
          gap: '2px',
        }}
        role="tablist"
        aria-label="Dashboard perspective"
      >
        {SEGMENTS.map((seg) => {
          const isActive = activeView === seg.view
          return (
            <button
              key={seg.view}
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(seg.view)}
              className="flex-1 flex items-center justify-center transition-all duration-200"
              style={{
                borderRadius: '9999px',
                padding: '6px 10px',
                minHeight: 'unset',
                border: 'none',
                backgroundColor: isActive
                  ? 'var(--surface-primary, var(--color-btn-primary-bg))'
                  : 'transparent',
                color: isActive
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                boxShadow: isActive
                  ? '0 1px 3px rgba(0,0,0,0.15)'
                  : 'none',
                cursor: isActive ? 'default' : 'pointer',
              }}
            >
              {/* Full label on desktop, short label on narrow mobile */}
              <span className="hidden sm:inline">{seg.label}</span>
              <span className="sm:hidden">{seg.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
