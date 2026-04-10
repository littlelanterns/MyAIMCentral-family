/**
 * CreatureRevealModal — Build M Sub-phase D
 *
 * Full-screen reveal that plays the Mossy Chest video (from
 * gamification_themes.creature_reveal_video_url), then slides in a
 * creature card showing name, rarity badge, image, and description.
 *
 * Timing:
 *   - Video plays immediately on mount (~3-5s, muted + playsinline)
 *   - At video end (or 0.5s before if timeupdate fires), creature card
 *     slides in from bottom
 *   - SparkleOverlay + ConfettiBurst fire during/after video
 *   - Auto-dismiss after 6s from card appearance, or tap anywhere
 *
 * Rules:
 *   - Mossy Chest = creature reveal (non-negotiable mapping)
 *   - <video playsinline muted> to prevent iOS Safari fullscreen hijack
 *   - All colors via CSS custom properties
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { ConfettiBurst } from '@/components/shared/ConfettiBurst'

interface CreatureRevealModalProps {
  /** Creature display name */
  creatureName: string
  /** Creature rarity tier */
  rarity: 'common' | 'rare' | 'legendary'
  /** Creature image URL (from gamification_creatures.image_url) */
  creatureImageUrl?: string | null
  /** Creature description text */
  creatureDescription?: string | null
  /** Mossy Chest reveal video URL (from gamification_themes.creature_reveal_video_url) */
  videoUrl: string | null
  /** Called when the modal should dismiss (chains to next queue event) */
  onClose: () => void
}

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  legendary: 'Legendary',
}

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--color-text-secondary)',
  rare: 'var(--color-sparkle-gold, #D4AF37)',
  legendary: 'var(--color-accent-warm, #E8845C)',
}

export function CreatureRevealModal({
  creatureName,
  rarity,
  creatureImageUrl,
  creatureDescription,
  videoUrl,
  onClose,
}: CreatureRevealModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCard, setShowCard] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)
  const [showSparkle, setShowSparkle] = useState(true)
  const autoDismissRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Start auto-dismiss countdown once the card is visible
  useEffect(() => {
    if (!showCard) return
    autoDismissRef.current = setTimeout(onClose, 6000)
    return () => clearTimeout(autoDismissRef.current)
  }, [showCard, onClose])

  // If no video URL, skip straight to the card
  useEffect(() => {
    if (!videoUrl) {
      setShowCard(true)
    }
  }, [videoUrl])

  const handleVideoEnd = useCallback(() => {
    setShowCard(true)
  }, [])

  // Show card slightly before video ends for a smoother overlap
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || showCard) return
    if (v.duration > 0 && v.currentTime >= v.duration - 0.5) {
      setShowCard(true)
    }
  }, [showCard])

  const handleTap = useCallback(() => {
    clearTimeout(autoDismissRef.current)
    onClose()
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`New creature: ${creatureName}`}
      onClick={handleTap}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        cursor: 'pointer',
      }}
    >
      {/* Mossy Chest reveal video */}
      {videoUrl && !showCard && (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          playsInline
          muted
          onEnded={handleVideoEnd}
          onTimeUpdate={handleTimeUpdate}
          style={{
            maxWidth: '90vw',
            maxHeight: '60vh',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            objectFit: 'contain',
          }}
        />
      )}

      {/* Creature card — slides in from bottom */}
      {showCard && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem',
            maxWidth: '320px',
            width: '90vw',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            backgroundColor: 'var(--color-bg-card)',
            border: '2px solid var(--color-border-accent, var(--color-btn-primary-bg))',
            animation: 'creatureSlideIn 0.5s ease-out',
            textAlign: 'center',
          }}
        >
          {/* Creature image */}
          {creatureImageUrl && (
            <img
              src={creatureImageUrl}
              alt={creatureName}
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
                borderRadius: 'var(--vibe-radius-card, 0.75rem)',
              }}
            />
          )}

          {/* Name */}
          <div
            style={{
              fontSize: 'var(--font-size-xl, 1.25rem)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            {creatureName}
          </div>

          {/* Rarity badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.2rem 0.75rem',
              borderRadius: '9999px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: RARITY_COLORS[rarity],
              border: `1px solid ${RARITY_COLORS[rarity]}`,
              backgroundColor: 'var(--color-bg-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {RARITY_LABELS[rarity]}
          </span>

          {/* Description */}
          {creatureDescription && (
            <div
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.4,
              }}
            >
              {creatureDescription}
            </div>
          )}

          {/* Tap hint */}
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted, var(--color-text-secondary))',
              opacity: 0.7,
              marginTop: '0.5rem',
            }}
          >
            Tap anywhere to continue
          </div>
        </div>
      )}

      {/* Effects */}
      {showConfetti && (
        <ConfettiBurst
          intensity="maximum"
          onComplete={() => setShowConfetti(false)}
        />
      )}
      {showSparkle && (
        <SparkleOverlay
          type="full_celebration"
          onComplete={() => setShowSparkle(false)}
        />
      )}

      <style>{`
        @keyframes creatureSlideIn {
          from {
            opacity: 0;
            transform: translateY(60px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [style*="creatureSlideIn"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
