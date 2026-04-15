/**
 * RevealAnimationPicker — Browseable grid of reveal animations grouped by style category.
 *
 * Used inline in task/widget config (compact mode) AND in the library page (full mode).
 * Supports single-select and multi-select (for rotation).
 */

import { useMemo } from 'react'
import { Film, Sparkles } from 'lucide-react'
import { useRevealAnimations } from '@/hooks/useRewardReveals'
import type { RevealAnimation } from '@/types/reward-reveals'

const CATEGORY_LABELS: Record<string, string> = {
  paper_craft: 'Paper Craft',
  minecraft: 'Pixel Block Style',
  anime: 'Anime Style',
  pokemon: 'Monster Catch Style',
  unicorn: 'Unicorn & Magic',
  candy: 'Candy & Sweets',
  dnd: 'Fantasy Quest Style',
  steampunk: 'Steampunk',
  retro: 'Retro / 8-Bit',
  pink_purple: 'Pink & Purple',
  ice_cream: 'Ice Cream',
  css_effect: 'Special Effects',
}

interface RevealAnimationPickerProps {
  /** Currently selected animation IDs */
  selectedIds: string[]
  /** Called when selection changes */
  onSelect: (ids: string[]) => void
  /** Allow multiple selection for rotation (default false) */
  multiSelect?: boolean
}

export function RevealAnimationPicker({
  selectedIds,
  onSelect,
  multiSelect = false,
}: RevealAnimationPickerProps) {
  const { data: animations = [], isLoading } = useRevealAnimations()

  // Group by style_category
  const grouped = useMemo(() => {
    const groups: Record<string, RevealAnimation[]> = {}
    for (const a of animations) {
      if (!groups[a.style_category]) groups[a.style_category] = []
      groups[a.style_category].push(a)
    }
    return groups
  }, [animations])

  const handleToggle = (id: string) => {
    if (multiSelect) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
      onSelect(next)
    } else {
      onSelect([id])
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          padding: '1rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Loading animations...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {multiSelect && (
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {selectedIds.length === 0
            ? 'Pick one or more animations'
            : `${selectedIds.length} selected — these will rotate each time the reveal fires`}
        </div>
      )}

      {Object.entries(grouped).map(([category, anims]) => (
        <div key={category}>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            {CATEGORY_LABELS[category] ?? category}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: '0.5rem',
            }}
          >
            {anims.map((anim) => {
              const isSelected = selectedIds.includes(anim.id)
              const isCSS = anim.reveal_type === 'css'
              return (
                <button
                  key={anim.id}
                  type="button"
                  onClick={() => handleToggle(anim.id)}
                  aria-label={anim.display_name}
                  aria-pressed={isSelected}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem',
                    borderRadius: 'var(--vibe-radius-card, 0.75rem)',
                    backgroundColor: 'var(--color-bg-card)',
                    border: isSelected
                      ? '2px solid var(--color-btn-primary-bg)'
                      : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                    minHeight: '80px',
                  }}
                >
                  {/* Icon — Film for video, Sparkles for CSS */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '0.5rem',
                      backgroundColor: isSelected
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                        : 'var(--color-bg-secondary)',
                    }}
                  >
                    {isCSS ? (
                      <Sparkles
                        size={24}
                        style={{
                          color: isSelected
                            ? 'var(--color-btn-primary-bg)'
                            : 'var(--color-text-secondary)',
                        }}
                      />
                    ) : (
                      <Film
                        size={24}
                        style={{
                          color: isSelected
                            ? 'var(--color-btn-primary-bg)'
                            : 'var(--color-text-secondary)',
                        }}
                      />
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-secondary)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {anim.display_name}
                  </span>

                  {anim.duration_seconds != null && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        color: 'var(--color-text-muted, var(--color-text-secondary))',
                        opacity: 0.7,
                      }}
                    >
                      {anim.duration_seconds}s
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
