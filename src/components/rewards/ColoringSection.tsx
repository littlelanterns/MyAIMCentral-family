/**
 * ColoringSection — KIDS-REWARDS-PAGE Slice 3 (founder gate §13: CARD GALLERY).
 *
 * Active coloring images render as cards on top (each showing its
 * grayscale→color reveal progress); completed ones sit below as a gallery of
 * finished art. Tap any card → the existing ColorRevealDetailModal (print flow
 * + the new Download actions). Surfaces the EXISTING reveal mechanic only —
 * Slice 3 adds the rewards-page gallery surface + Download, it does NOT change
 * how reveals are earned (Build M owns that).
 */

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { coloringImageUrl } from '@/lib/coloringImageUrl'
import { useMemberColoringReveals } from '@/hooks/useColoringReveals'
import { ColorRevealDetailModal } from '@/components/play-dashboard/ColorRevealDetailModal'
import type { MemberColoringReveal } from '@/types/play-dashboard'

interface ColoringSectionProps {
  memberId: string
  variant?: 'standard' | 'play'
}

function revealProgressPct(reveal: MemberColoringReveal): number {
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

export function ColoringSection({ memberId, variant = 'standard' }: ColoringSectionProps) {
  const { data: reveals = [] } = useMemberColoringReveals(memberId)
  const [open, setOpen] = useState<MemberColoringReveal | null>(null)
  const play = variant === 'play'

  const active = reveals.filter(r => !r.is_complete)
  const completed = reveals.filter(r => r.is_complete)

  return (
    <section
      data-testid="mr-section-coloring"
      aria-label="My Coloring Pages"
      className="rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        padding: play ? '1.25rem' : '1rem',
      }}
    >
      <div
        className="flex items-center gap-2 mb-3"
        style={{
          fontSize: play ? 'var(--font-size-lg)' : 'var(--font-size-base)',
          fontWeight: 700,
          color: 'var(--color-text-heading)',
        }}
      >
        <span style={{ color: 'var(--color-btn-primary-bg)', display: 'inline-flex' }}>
          <Palette size={play ? 24 : 18} />
        </span>
        My Coloring Pages
      </div>

      {reveals.length === 0 ? (
        <p className="text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
          Coloring pictures show up here as you reveal them — keep completing
          your tasks!
        </p>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div>
              <p
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Revealing now
              </p>
              <div
                data-testid="coloring-active-grid"
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
              >
                {active.map(r => (
                  <ColoringCard
                    key={r.id}
                    reveal={r}
                    play={play}
                    onOpen={() => setOpen(r)}
                  />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Finished art
              </p>
              <div
                data-testid="coloring-completed-grid"
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
              >
                {completed.map(r => (
                  <ColoringCard
                    key={r.id}
                    reveal={r}
                    play={play}
                    onOpen={() => setOpen(r)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {open && (
        <ColorRevealDetailModal reveal={open} onClose={() => setOpen(null)} />
      )}
    </section>
  )
}

function ColoringCard({
  reveal,
  play,
  onOpen,
}: {
  reveal: MemberColoringReveal
  play: boolean
  onOpen: () => void
}) {
  const slug = reveal.coloring_image?.slug
  const name = reveal.coloring_image?.display_name ?? 'Coloring picture'
  const pct = revealProgressPct(reveal)
  // Completed cards show the full-color keepsake; active cards show grayscale.
  const thumb = slug
    ? coloringImageUrl(slug, reveal.is_complete ? 'color' : 'grayscale')
    : null

  return (
    <button
      type="button"
      data-testid="coloring-card"
      onClick={onOpen}
      aria-label={`${name}${reveal.is_complete ? ' (finished)' : `, ${pct}% revealed`}`}
      className="flex flex-col gap-1.5 rounded-lg text-left"
      style={{
        padding: '0.5rem',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        cursor: 'pointer',
        minHeight: play ? 56 : undefined,
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 'var(--vibe-radius-card, 0.5rem)',
          overflow: 'hidden',
          backgroundColor: 'var(--color-bg-tertiary, var(--color-bg-card))',
        }}
      >
        {thumb && (
          <img
            src={thumb}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        )}
      </div>
      <div
        className="truncate"
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        {name}
      </div>
      {reveal.is_complete ? (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          Finished!
        </span>
      ) : (
        <div
          style={{
            width: '100%',
            height: 6,
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
              transition: 'width 0.4s',
            }}
          />
        </div>
      )}
    </button>
  )
}
