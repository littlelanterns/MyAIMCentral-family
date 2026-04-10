/**
 * PageUnlockRevealModal — Build M Sub-phase D
 *
 * Full-screen reveal that plays the Fairy Door video (from
 * gamification_themes.page_reveal_video_url), then shows the newly
 * unlocked page thumbnail + scene name.
 *
 * Timing:
 *   - Video plays immediately on mount (~3-5s, muted + playsinline)
 *   - At video end, page card slides in with scene name + thumbnail
 *   - SparkleOverlay fires during video
 *   - Stays open until user taps "See my new page!" or dismisses
 *
 * Rules:
 *   - Fairy Door = page unlock reveal (non-negotiable mapping)
 *   - <video playsinline muted> to prevent iOS Safari fullscreen hijack
 *   - "See my new page!" closes this modal and opens StickerBookDetailModal
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { ConfettiBurst } from '@/components/shared/ConfettiBurst'

interface PageUnlockRevealModalProps {
  /** Page display name */
  pageName: string
  /** Scene name (from gamification_sticker_pages.scene) */
  sceneName: string
  /** Page thumbnail image URL */
  pageImageUrl?: string | null
  /** Fairy Door reveal video URL */
  videoUrl: string | null
  /** Called to dismiss the modal (chains to next queue event) */
  onClose: () => void
  /** Called when user taps "See my new page!" — opens StickerBookDetailModal */
  onViewPage: () => void
}

export function PageUnlockRevealModal({
  pageName,
  sceneName,
  pageImageUrl,
  videoUrl,
  onClose,
  onViewPage,
}: PageUnlockRevealModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showCard, setShowCard] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)
  const [showSparkle, setShowSparkle] = useState(true)

  // If no video URL, skip straight to the card
  useEffect(() => {
    if (!videoUrl) {
      setShowCard(true)
    }
  }, [videoUrl])

  const handleVideoEnd = useCallback(() => {
    setShowCard(true)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || showCard) return
    if (v.duration > 0 && v.currentTime >= v.duration - 0.5) {
      setShowCard(true)
    }
  }, [showCard])

  // Backdrop tap dismisses (but NOT the card area — that has its own button)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const handleViewPage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onViewPage()
    },
    [onViewPage],
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`New page unlocked: ${pageName}`}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
      }}
    >
      {/* Fairy Door reveal video */}
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

      {/* Page unlock card — slides in from bottom */}
      {showCard && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem',
            maxWidth: '360px',
            width: '90vw',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            backgroundColor: 'var(--color-bg-card)',
            border: '2px solid var(--color-border-accent, var(--color-btn-primary-bg))',
            animation: 'pageSlideIn 0.5s ease-out',
            textAlign: 'center',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Page thumbnail */}
          {pageImageUrl && (
            <div
              style={{
                width: '100%',
                aspectRatio: '16 / 9',
                borderRadius: 'var(--vibe-radius-card, 0.75rem)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <img
                src={pageImageUrl}
                alt={pageName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Announcement */}
          <div
            style={{
              fontSize: 'var(--font-size-xl, 1.25rem)',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            You unlocked {sceneName}!
          </div>

          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            A brand new page for your sticker book
          </div>

          {/* CTA button */}
          <button
            type="button"
            onClick={handleViewPage}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text, #fff)',
              fontWeight: 700,
              fontSize: 'var(--font-size-base)',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            See my new page!
          </button>

          {/* Dismiss hint */}
          <button
            type="button"
            onClick={() => onClose()}
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted, var(--color-text-secondary))',
              opacity: 0.7,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            Maybe later
          </button>
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
        @keyframes pageSlideIn {
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
          [style*="pageSlideIn"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
