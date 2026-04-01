/**
 * SlideshowOverlay — PRD-14D Phase B
 *
 * Near-full-screen overlay showing slideshow content.
 * Auto-rotates through active slides with per-type durations:
 * - image_photo: fast (default 60s)
 * - image_word_art: medium (default 300s / 5min)
 * - text / guiding_star_auto: slow (default 600s / 10min)
 *
 * Controls: tap to pause/play, "Back to Hub" button, swipe down to close.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Play, Pause } from 'lucide-react'
import { useSlideshowSlides, useFamilyGuidingStars } from '@/hooks/useSlideshowSlides'
import { useFamilyHubConfig } from '@/hooks/useFamilyHubConfig'
import { useFamily } from '@/hooks/useFamily'
import type { SlideshowSlide, SlideType } from '@/hooks/useSlideshowSlides'

interface SlideshowOverlayProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings?: () => void
}

// ─── Duration per slide type (seconds) ──────────────────────────────────────

function getDuration(
  slideType: SlideType,
  config: Record<string, unknown>
): number {
  switch (slideType) {
    case 'image_photo':
      return (config.photo_duration_seconds as number) ?? 60
    case 'image_word_art':
      return (config.word_art_duration_seconds as number) ?? 300
    case 'text':
    case 'guiding_star_auto':
      return (config.text_duration_seconds as number) ?? 600
    default:
      return 60
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SlideshowOverlay({ isOpen, onClose, onOpenSettings }: SlideshowOverlayProps) {
  const { data: family } = useFamily()
  const { data: dbSlides } = useSlideshowSlides(family?.id)
  const { data: guidingStars } = useFamilyGuidingStars(family?.id)
  const { data: hubConfig } = useFamilyHubConfig(family?.id)

  const slideshowConfig = (hubConfig?.slideshow_config ?? {}) as Record<string, unknown>
  const guidingStarsFeedEnabled = slideshowConfig.guiding_stars_feed !== false

  // Merge DB slides + auto-generated Guiding Stars slides
  const allSlides = useMemo(() => {
    const slides: Array<SlideshowSlide | { id: string; slide_type: SlideType; text_body: string; image_url: null; source_guiding_star_id: string }> = [
      ...(dbSlides ?? []),
    ]

    // Add Guiding Stars auto-feed if enabled
    if (guidingStarsFeedEnabled && guidingStars) {
      for (const gs of guidingStars) {
        // Skip if already exists as a DB slide
        const exists = (dbSlides ?? []).some(
          (s) => s.source_guiding_star_id === gs.id
        )
        if (!exists) {
          slides.push({
            id: `gs-${gs.id}`,
            slide_type: 'guiding_star_auto',
            text_body: gs.content,
            image_url: null,
            source_guiding_star_id: gs.id,
          })
        }
      }
    }

    // Shuffle if config says random, otherwise sequential
    if (slideshowConfig.rotation_order === 'random') {
      return slides.sort(() => Math.random() - 0.5)
    }
    return slides
  }, [dbSlides, guidingStars, guidingStarsFeedEnabled, slideshowConfig.rotation_order])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showControls, setShowControls] = useState(false)

  // Reset index when slides change
  useEffect(() => {
    setCurrentIndex(0)
  }, [allSlides.length])

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || paused || allSlides.length <= 1) return

    const currentSlide = allSlides[currentIndex]
    if (!currentSlide) return

    const duration = getDuration(currentSlide.slide_type, slideshowConfig)
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % allSlides.length)
    }, duration * 1000)

    return () => clearTimeout(timer)
  }, [isOpen, paused, currentIndex, allSlides, slideshowConfig])

  // Show controls briefly on tap
  const handleTap = useCallback(() => {
    setPaused((p) => !p)
    setShowControls(true)
    setTimeout(() => setShowControls(false), 2000)
  }, [])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen) return null

  const currentSlide = allSlides[currentIndex]

  // Empty state — close slideshow and open settings if available
  if (!currentSlide || allSlides.length === 0) {
    if (onOpenSettings) {
      // Auto-close slideshow and open Hub Settings so mom can add slides
      onClose()
      onOpenSettings()
      return null
    }
    // Non-mom: just close
    onClose()
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg-page)' }}
      onClick={handleTap}
    >
      {/* Slide content */}
      <div className="w-full h-full flex items-center justify-center p-8">
        {(currentSlide.slide_type === 'image_photo' || currentSlide.slide_type === 'image_word_art') && currentSlide.image_url && (
          <img
            src={currentSlide.image_url}
            alt="Slideshow"
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ transition: 'opacity 0.5s ease' }}
          />
        )}

        {(currentSlide.slide_type === 'text' || currentSlide.slide_type === 'guiding_star_auto') && currentSlide.text_body && (
          <div className="max-w-xl text-center px-8">
            <p
              className="text-2xl md:text-3xl leading-relaxed"
              style={{
                color: 'var(--color-text-heading)',
                fontFamily: 'var(--font-display, var(--font-heading))',
                fontStyle: currentSlide.slide_type === 'guiding_star_auto' ? 'italic' : undefined,
              }}
            >
              {currentSlide.text_body}
            </p>
            {currentSlide.slide_type === 'guiding_star_auto' && (
              <p
                className="text-sm mt-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Family Guiding Star
              </p>
            )}
          </div>
        )}
      </div>

      {/* Pause/Play indicator (briefly shown on tap) */}
      {showControls && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transition: 'opacity 0.3s ease' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            {paused ? (
              <Play size={28} style={{ color: '#fff' }} />
            ) : (
              <Pause size={28} style={{ color: '#fff' }} />
            )}
          </div>
        </div>
      )}

      {/* Back to Hub button — always visible, semi-transparent */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-opacity"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          color: '#fff',
          opacity: 0.7,
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.7' }}
      >
        <X size={16} />
        Back to Hub
      </button>

      {/* Slide counter */}
      {allSlides.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1"
        >
          {allSlides.map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: i === currentIndex
                  ? 'var(--color-btn-primary-bg)'
                  : 'rgba(128, 128, 128, 0.4)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
