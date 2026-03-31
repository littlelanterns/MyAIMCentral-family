/**
 * HubVictoriesSummarySection — PRD-14D Family Hub
 *
 * STUB section: shows "Victories" with Trophy icon.
 * Celebrate button visible but disabled with "Coming soon" indicator.
 */

import { Trophy, Sparkles } from 'lucide-react'

export function HubVictoriesSummarySection() {
  return (
    <div
      className="rounded-lg p-4"
      data-testid="hub-victories-section"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Victories
        </span>
      </div>

      {/* Stub content */}
      <p
        className="text-xs mb-3"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Family victories will appear here once celebration features are fully wired.
      </p>

      {/* Disabled celebrate button */}
      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-not-allowed"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
        }}
        title="Coming soon"
      >
        <Sparkles size={14} />
        Celebrate Together
      </button>

      <p className="text-[10px] mt-2 italic" style={{ color: 'var(--color-text-secondary)' }}>
        Coming soon
      </p>
    </div>
  )
}
