/**
 * InfoColoringPageWidget — KIDS-REWARDS-PAGE Slice 3 dashboard "door".
 *
 * A view-only viewport showing the member's active coloring image (or the most
 * recent finished one if none active). Tap → the existing ColorRevealDetailModal
 * (print + the new download actions). View-only on the dashboard.
 */

import { useState, useMemo } from 'react'
import { Palette, ChevronRight } from 'lucide-react'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useMemberColoringReveals } from '@/hooks/useColoringReveals'
import { coloringImageUrl } from '@/lib/coloringImageUrl'
import { ColorRevealDetailModal } from '@/components/play-dashboard/ColorRevealDetailModal'
import type { DashboardWidget } from '@/types/widgets'
import type { MemberColoringReveal } from '@/types/play-dashboard'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

function progressPct(reveal: MemberColoringReveal): number {
  const zones = reveal.coloring_image?.color_zones
  if (zones && zones.length > 0) {
    const revealed = new Set(reveal.revealed_zone_ids ?? [])
    let pct = 0
    for (const z of zones) if (revealed.has(z.id)) pct += z.pct
    return Math.min(100, Math.round(pct))
  }
  return reveal.reveal_step_count > 0
    ? Math.round((reveal.current_step / reveal.reveal_step_count) * 100)
    : 0
}

export function InfoColoringPageWidget({ widget }: Props) {
  const { member: effectiveMember, isViewAs } = useEffectiveMember()
  const memberId = isViewAs
    ? effectiveMember?.id
    : (widget.family_member_id ?? effectiveMember?.id)

  const { data: reveals = [] } = useMemberColoringReveals(memberId)
  const [open, setOpen] = useState(false)

  // Prefer an active reveal; fall back to the most recent finished one.
  const reveal = useMemo(
    () => reveals.find(r => !r.is_complete) ?? reveals[0] ?? null,
    [reveals],
  )

  if (!memberId) return null

  const slug = reveal?.coloring_image?.slug
  const thumb = slug
    ? coloringImageUrl(slug, reveal?.is_complete ? 'color' : 'grayscale')
    : null
  const pct = reveal ? progressPct(reveal) : 0

  return (
    <>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          if (reveal) setOpen(true)
        }}
        aria-label="Open my coloring page"
        className="w-full h-full flex flex-col text-left p-0"
        style={{ background: 'transparent', cursor: reveal ? 'pointer' : 'default' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Palette size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            Coloring Page
          </span>
          <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
        </div>

        {reveal && thumb ? (
          <div className="flex-1 min-h-0 flex flex-col gap-1.5">
            <div
              style={{
                position: 'relative',
                width: '100%',
                flex: 1,
                minHeight: 0,
                borderRadius: 'var(--vibe-radius-card, 0.5rem)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <img
                src={thumb}
                alt={reveal.coloring_image?.display_name ?? 'Coloring picture'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                loading="lazy"
              />
            </div>
            {reveal.is_complete ? (
              <span className="text-[10px] font-semibold" style={{ color: 'var(--color-btn-primary-bg)' }}>
                Finished!
              </span>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 5,
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-bg-card)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-btn-primary-bg)',
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center text-center px-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <span className="text-xs">
              Reveal a coloring picture by completing tasks
            </span>
          </div>
        )}
      </button>

      {open && reveal && (
        <ColorRevealDetailModal reveal={reveal} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
