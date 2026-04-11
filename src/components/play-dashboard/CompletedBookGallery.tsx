/**
 * CompletedBookGallery — Build M Phase 3
 *
 * "Trophy shelf" of finished coloring reveals. Shows all completed
 * reveals in a grid. Tapping a card opens ColorRevealDetailModal
 * for re-viewing the full color image and re-printing the lineart.
 *
 * Completed images are never removed — this is permanent.
 */

import { useMemo } from 'react'
import { X, Palette } from 'lucide-react'
import { coloringImageUrl } from '@/lib/coloringImageUrl'
import type { MemberColoringReveal } from '@/types/play-dashboard'

interface CompletedBookGalleryProps {
  reveals: MemberColoringReveal[]
  onClose: () => void
  onOpenReveal: (reveal: MemberColoringReveal) => void
}

export function CompletedBookGallery({
  reveals,
  onClose,
  onOpenReveal,
}: CompletedBookGalleryProps) {
  const completed = useMemo(
    () =>
      reveals
        .filter(r => r.is_complete)
        .sort((a, b) => {
          const da = a.completed_at ? new Date(a.completed_at).getTime() : 0
          const db = b.completed_at ? new Date(b.completed_at).getTime() : 0
          return db - da // most recent first
        }),
    [reveals],
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="My Coloring Book Gallery"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary, #fff)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={20} color="var(--color-btn-primary-bg)" aria-hidden="true" />
          <div
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            My Coloring Book
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            color: 'var(--color-text-secondary)',
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
        }}
      >
        {completed.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '3rem 1rem',
              textAlign: 'center',
            }}
          >
            <Palette
              size={40}
              color="var(--color-text-tertiary)"
              aria-hidden="true"
            />
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Your coloring book is empty — finish a picture to add it here!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
              gap: '0.75rem',
            }}
          >
            {completed.map(reveal => {
              const slug = reveal.coloring_image?.slug
              if (!slug) return null

              return (
                <button
                  key={reveal.id}
                  type="button"
                  onClick={() => onOpenReveal(reveal)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: 'var(--vibe-radius-card, 0.5rem)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--color-bg-secondary)',
                    }}
                  >
                    <img
                      src={coloringImageUrl(slug, 'color')}
                      alt={reveal.coloring_image?.display_name ?? 'Completed coloring'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {reveal.coloring_image?.display_name}
                  </span>
                  {reveal.completed_at && (
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-tertiary)',
                      }}
                    >
                      {new Date(reveal.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
