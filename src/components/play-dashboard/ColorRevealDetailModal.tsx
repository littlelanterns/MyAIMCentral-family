/**
 * ColorRevealDetailModal — Build M Phase 3
 *
 * Full-screen modal showing a larger view of an active (or completed)
 * coloring reveal. The grayscale → color wipe renders at a bigger scale.
 *
 * For completed reveals: full color image, ConfettiBurst + SparkleOverlay
 * celebration on first open, print flow with lineart preference picker.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Palette, Printer } from 'lucide-react'
import { coloringImageUrl, lineartUrlForPreference } from '@/lib/coloringImageUrl'
import { useUpdateColoringReveal } from '@/hooks/useColoringReveals'
import { ColorRevealCanvas } from './ColorRevealCanvas'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { ConfettiBurst } from '@/components/shared/ConfettiBurst'
import type { MemberColoringReveal, LineartPreference } from '@/types/play-dashboard'

interface ColorRevealDetailModalProps {
  reveal: MemberColoringReveal
  onClose: () => void
  /** If true, play the completion celebration on mount (first time seeing completion) */
  showCompletionCelebration?: boolean
}

export function ColorRevealDetailModal({
  reveal,
  onClose,
  showCompletionCelebration = false,
}: ColorRevealDetailModalProps) {
  const updateReveal = useUpdateColoringReveal(reveal.family_member_id)
  const slug = reveal.coloring_image?.slug
  const displayName = reveal.coloring_image?.display_name ?? 'Coloring picture'

  const [celebrating, setCelebrating] = useState(showCompletionCelebration && reveal.is_complete)
  const [confettiDone, setConfettiDone] = useState(false)
  const [sparkleDone, setSparkleDone] = useState(false)

  // Lineart preference picker state
  const [selectedLineart, setSelectedLineart] = useState<LineartPreference>(
    reveal.lineart_preference ?? 'medium',
  )

  // Only celebrate once
  const celebratedRef = useRef(false)
  useEffect(() => {
    if (showCompletionCelebration && reveal.is_complete && !celebratedRef.current) {
      celebratedRef.current = true
      setCelebrating(true)
    }
  }, [showCompletionCelebration, reveal.is_complete])

  const handleConfettiDone = useCallback(() => setConfettiDone(true), [])
  const handleSparkleDone = useCallback(() => setSparkleDone(true), [])

  // Dismiss celebration after both finish
  useEffect(() => {
    if (celebrating && confettiDone && sparkleDone) {
      const t = setTimeout(() => setCelebrating(false), 400)
      return () => clearTimeout(t)
    }
  }, [celebrating, confettiDone, sparkleDone])

  const handleLineartChange = useCallback(
    (pref: LineartPreference) => {
      setSelectedLineart(pref)
      updateReveal.mutate({ revealId: reveal.id, lineart_preference: pref })
    },
    [updateReveal, reveal.id],
  )

  const handlePrint = useCallback(() => {
    if (!slug) return
    const url = lineartUrlForPreference(slug, selectedLineart)
    const w = window.open('', '_blank')
    if (!w) return

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Color me! — ${displayName}</title>
  <style>
    @media screen { body { margin: 2rem; text-align: center; } }
    @media print { .no-print { display: none !important; } body { margin: 0; } }
    img { max-width: 100%; height: auto; }
    h2 { font-family: sans-serif; font-size: 1.25rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <h2 class="no-print">Color me! — ${displayName}</h2>
  <img src="${url}" alt="${displayName} coloring page" onload="window.print()" />
</body>
</html>`)
    w.document.close()

    // Record the print
    updateReveal.mutate({
      revealId: reveal.id,
      printed_at: new Date().toISOString(),
    })
  }, [slug, selectedLineart, displayName, updateReveal, reveal.id])

  if (!slug) return null

  const progressPct = computeProgress(reveal)
  const totalSteps = reveal.reveal_step_count
  const currentStep = reveal.current_step

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-primary, #fff)',
        overflow: 'auto',
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
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {reveal.is_complete
                ? 'Complete!'
                : `Step ${currentStep} of ${totalSteps}`}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
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

      {/* ── Image ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '28rem' }}>
          <ColorRevealCanvas
            slug={slug}
            zones={reveal.coloring_image?.color_zones ?? []}
            revealedZoneIds={reveal.revealed_zone_ids ?? []}
            showFullColor={reveal.is_complete}
          />
        </div>

        {/* ── Progress bar (active only) ──────────────────────── */}
        {!reveal.is_complete && (
          <div style={{ width: '100%', maxWidth: '28rem' }}>
            <div
              style={{
                width: '100%',
                height: '0.5rem',
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
            <p
              style={{
                marginTop: '0.5rem',
                textAlign: 'center',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Keep going! {totalSteps - currentStep} more step{totalSteps - currentStep === 1 ? '' : 's'} to reveal the whole picture!
            </p>
          </div>
        )}

        {/* ── Completed state: print flow ─────────────────────── */}
        {reveal.is_complete && (
          <div
            style={{
              width: '100%',
              maxWidth: '28rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                textAlign: 'center',
              }}
            >
              You revealed the whole picture!
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                textAlign: 'center',
              }}
            >
              Print and color it yourself! Pick your line style:
            </p>

            {/* Lineart preference picker */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              {(['simple', 'medium', 'complex'] as const).map(pref => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => handleLineartChange(pref)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem',
                    border: selectedLineart === pref
                      ? '2px solid var(--color-btn-primary-bg)'
                      : '2px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-card, 0.5rem)',
                    backgroundColor: selectedLineart === pref
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                      : 'var(--color-bg-card)',
                    cursor: 'pointer',
                    width: '5.5rem',
                  }}
                >
                  <img
                    src={coloringImageUrl(slug, `lineart_${pref}` as 'lineart_simple')}
                    alt={`${pref} line art`}
                    style={{
                      width: '4rem',
                      height: '4rem',
                      objectFit: 'cover',
                      borderRadius: '0.25rem',
                    }}
                    loading="lazy"
                  />
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: selectedLineart === pref ? 600 : 400,
                      color: selectedLineart === pref
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-secondary)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {pref}
                  </span>
                </button>
              ))}
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-text-on-primary, #fff)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
              }}
            >
              <Printer size={18} />
              Print coloring page
            </button>

            {reveal.printed_at && (
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Last printed{' '}
                {new Date(reveal.printed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Celebrations ──────────────────────────────────────── */}
      {celebrating && (
        <>
          <ConfettiBurst intensity="moderate" onComplete={handleConfettiDone} />
          <SparkleOverlay type="full_celebration" onComplete={handleSparkleDone} />
        </>
      )}
    </div>
  )
}

function computeProgress(reveal: MemberColoringReveal): number {
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
