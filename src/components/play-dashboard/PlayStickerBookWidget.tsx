/**
 * PlayStickerBookWidget — Build M Sub-phase B
 *
 * 2-column-tall card on the Play Dashboard showing:
 *   • The active sticker book page thumbnail (from gamification_sticker_pages)
 *   • Creature count + page count pills
 *   • BreathingGlow animation when there's something new (Sub-phase D
 *     hooks the "newness" signal — for now it's always quiet)
 *
 * Tapping the widget will open the StickerBookDetailModal in Sub-phase D.
 * Sub-phase B accepts a no-op tap handler so the prop surface is in place.
 *
 * Hides itself entirely when sticker book is disabled (no row, or
 * is_enabled = false). Returns null in that case.
 */

import { BookOpen } from 'lucide-react'
import { BreathingGlow } from '@/components/ui/BreathingGlow'
import type { StickerBookState } from '@/types/play-dashboard'

interface PlayStickerBookWidgetProps {
  state: StickerBookState | null | undefined
  creatureCount: number
  hasNewActivity?: boolean
  onOpen?: () => void
}

export function PlayStickerBookWidget({
  state,
  creatureCount,
  hasNewActivity = false,
  onOpen,
}: PlayStickerBookWidgetProps) {
  // Hide entirely when sticker book is disabled
  if (!state) return null

  return (
    <BreathingGlow active={hasNewActivity} className="play-sticker-book-glow">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open my sticker book"
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '1rem',
          borderRadius: 'var(--vibe-radius-card, 1rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '2px solid var(--color-border)',
          cursor: onOpen ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <BookOpen
            size={20}
            color="var(--color-btn-primary-bg)"
            aria-hidden="true"
          />
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            My Sticker Book
          </h3>
        </div>

        {state.active_page ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 'var(--vibe-radius-card, 0.75rem)',
              overflow: 'hidden',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            <img
              src={state.active_page.image_url}
              alt={state.active_page.display_name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none',
              }}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 'var(--vibe-radius-card, 0.75rem)',
              backgroundColor: 'var(--color-bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            Your sticker book is waiting!
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <Pill label={`${creatureCount} creature${creatureCount === 1 ? '' : 's'}`} />
          <Pill
            label={`${state.pages_unlocked_total} page${state.pages_unlocked_total === 1 ? '' : 's'} unlocked`}
          />
        </div>
      </button>
    </BreathingGlow>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.625rem',
        borderRadius: '9999px',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        color: 'var(--color-text-secondary)',
      }}
    >
      {label}
    </span>
  )
}
