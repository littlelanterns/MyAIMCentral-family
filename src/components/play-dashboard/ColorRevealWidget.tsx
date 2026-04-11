/**
 * ColorRevealWidget — Build M Phase 3
 *
 * Dashboard card showing the child's active coloring reveals.
 * Renders grayscale base with a progressive color wipe based on
 * the percentage of zones revealed. Tapping opens the detail modal.
 *
 * When no active reveals exist, shows a warm empty state.
 * When one reveal exists, shows it large. When multiple exist,
 * shows a horizontal scroll of compact cards.
 */

import { useMemo } from 'react'
import { Palette } from 'lucide-react'
import { ColorRevealCanvas } from './ColorRevealCanvas'
import type { MemberColoringReveal } from '@/types/play-dashboard'

interface ColorRevealWidgetProps {
  reveals: MemberColoringReveal[]
  onOpenReveal: (reveal: MemberColoringReveal) => void
  onOpenGallery: () => void
  /** IDs of reveals that just advanced — drives shimmer animation */
  shimmeringRevealIds?: Set<string>
}

export function ColorRevealWidget({
  reveals,
  onOpenReveal,
  onOpenGallery,
  shimmeringRevealIds,
}: ColorRevealWidgetProps) {
  const activeReveals = useMemo(
    () => reveals.filter(r => !r.is_complete && r.is_active),
    [reveals],
  )
  const completedCount = useMemo(
    () => reveals.filter(r => r.is_complete).length,
    [reveals],
  )

  if (activeReveals.length === 0 && completedCount === 0) {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '1rem',
          borderRadius: 'var(--vibe-radius-card, 1rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '2px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <Palette size={20} color="var(--color-btn-primary-bg)" aria-hidden="true" />
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            My Coloring Book
          </h3>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          No coloring pictures yet!
        </p>
      </div>
    )
  }

  if (activeReveals.length === 1) {
    const reveal = activeReveals[0]
    const isShimmering = shimmeringRevealIds?.has(reveal.id) ?? false
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1rem',
          borderRadius: 'var(--vibe-radius-card, 1rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '2px solid var(--color-border)',
        }}
      >
        <WidgetHeader completedCount={completedCount} onOpenGallery={onOpenGallery} />
        <RevealCard
          reveal={reveal}
          large
          isShimmering={isShimmering}
          onTap={() => onOpenReveal(reveal)}
        />
      </div>
    )
  }

  // Multiple active reveals — horizontal scroll
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        backgroundColor: 'var(--color-bg-card)',
        border: '2px solid var(--color-border)',
      }}
    >
      <WidgetHeader completedCount={completedCount} onOpenGallery={onOpenGallery} />
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {activeReveals.map(reveal => (
          <RevealCard
            key={reveal.id}
            reveal={reveal}
            large={false}
            isShimmering={shimmeringRevealIds?.has(reveal.id) ?? false}
            onTap={() => onOpenReveal(reveal)}
          />
        ))}
      </div>
    </div>
  )
}

function WidgetHeader({
  completedCount,
  onOpenGallery,
}: {
  completedCount: number
  onOpenGallery: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Palette size={20} color="var(--color-btn-primary-bg)" aria-hidden="true" />
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-base)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          My Coloring Book
        </h3>
      </div>
      {completedCount > 0 && (
        <button
          type="button"
          onClick={onOpenGallery}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: 'var(--color-btn-primary-bg)',
            padding: '0.25rem 0.5rem',
          }}
        >
          {completedCount} finished
        </button>
      )}
    </div>
  )
}

/**
 * RevealCard — renders a single coloring reveal using canvas-based
 * pixel masking. Only pixels matching revealed zone hex colors show
 * in color; everything else stays grayscale.
 */
function RevealCard({
  reveal,
  large,
  isShimmering,
  onTap,
}: {
  reveal: MemberColoringReveal
  large: boolean
  isShimmering: boolean
  onTap: () => void
}) {
  const slug = reveal.coloring_image?.slug
  const zones = reveal.coloring_image?.color_zones ?? []
  if (!slug) return null

  const progressPct = computeRevealProgress(reveal)
  const totalSteps = reveal.reveal_step_count
  const currentStep = reveal.current_step

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={`Open ${reveal.coloring_image?.display_name ?? 'coloring picture'} — step ${currentStep} of ${totalSteps}`}
      style={{
        flex: large ? undefined : '0 0 10rem',
        width: large ? '100%' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <ColorRevealCanvas
        slug={slug}
        zones={zones}
        revealedZoneIds={reveal.revealed_zone_ids ?? []}
        className={isShimmering ? 'color-reveal-shimmer' : undefined}
      />

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '0.375rem',
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
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
        }}
      >
        Step {currentStep} of {totalSteps}
      </span>
    </button>
  )
}

/**
 * Compute the overall reveal progress as a percentage (0-100).
 * Uses the coverage_pct of revealed zones from the color_zones array.
 */
function computeRevealProgress(reveal: MemberColoringReveal): number {
  const zones = reveal.coloring_image?.color_zones
  if (!zones || zones.length === 0) {
    return reveal.reveal_step_count > 0
      ? Math.round((reveal.current_step / reveal.reveal_step_count) * 100)
      : 0
  }

  const revealedIds = new Set(reveal.revealed_zone_ids ?? [])
  let totalPct = 0
  for (const zone of zones) {
    if (revealedIds.has(zone.id)) {
      totalPct += zone.pct
    }
  }
  return Math.min(100, Math.round(totalPct))
}
