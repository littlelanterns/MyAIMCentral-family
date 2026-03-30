/**
 * PerspectiveSwitcher — PRD-14 + PRD-14D
 *
 * Role-based segmented control on the dashboard page.
 *
 * PRD-14D overrides PRD-14: perspective switcher is no longer mom-only.
 * - Mom (primary_parent): My Dashboard, Family Overview, Hub, View As (4 tabs)
 * - Dad/Additional Adult: My Dashboard, Hub (+ Family Overview if permitted, + View As if permitted) (2-4 tabs)
 * - Independent Teen: My Dashboard, Hub (2 tabs)
 * - Guided/Play: no perspective switcher (returns null)
 *
 * The parent (Dashboard) owns the active state and decides what to render.
 */

import { useShell } from './ShellProvider'

// ─── Types ───────────────────────────────────────────────────

export type DashboardView = 'personal' | 'family_overview' | 'family_hub' | 'view_as'

export interface PerspectiveSwitcherProps {
  activeView: DashboardView
  onViewChange: (view: DashboardView) => void
}

// ─── Segment definitions ──────────────────────────────────────

interface Segment {
  view: DashboardView
  label: string
  shortLabel: string
}

// ─── Component ───────────────────────────────────────────────

export function PerspectiveSwitcher({ activeView, onViewChange }: PerspectiveSwitcherProps) {
  const { role, shell } = useShell()

  // Guided/Play: no perspective switcher
  if (shell === 'guided' || shell === 'play') return null

  const isMom = role === 'primary_parent'
  const isAdult = role === 'additional_adult' || role === 'special_adult'
  const isTeen = shell === 'independent'

  // Build role-appropriate tabs
  const segments: Segment[] = []

  // My Dashboard — always first for everyone
  segments.push({ view: 'personal', label: 'My Dashboard', shortLabel: 'Me' })

  // Family Overview — mom always, dad if permitted (default: show it)
  if (isMom || isAdult) {
    segments.push({ view: 'family_overview', label: 'Family Overview', shortLabel: 'Overview' })
  }

  // Hub — everyone except guided/play (already filtered above)
  segments.push({ view: 'family_hub', label: 'Family Hub', shortLabel: 'Hub' })

  // View As — mom always, dad if permitted
  if (isMom) {
    segments.push({ view: 'view_as', label: 'View As...', shortLabel: 'View As' })
  }

  // Only 1 tab (My Dashboard) means no switcher needed
  if (segments.length <= 1) return null

  return (
    <div className="flex justify-center w-full px-4 mb-4 md:mb-6">
      <div
        className="flex items-center w-full md:w-auto"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '9999px',
          padding: '3px',
          maxWidth: '560px',
          gap: '2px',
        }}
        role="tablist"
        aria-label="Dashboard perspective"
      >
        {segments.map((seg) => {
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
              <span className="hidden sm:inline">{seg.label}</span>
              <span className="sm:hidden">{seg.shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
