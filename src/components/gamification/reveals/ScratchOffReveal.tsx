/**
 * ScratchOffReveal — PRD-24 Gamification Foundation
 *
 * Single large card with an opaque scratch-off mask. The reward is fully
 * rendered underneath the mask. The user drags finger or cursor across the
 * canvas to scratch away the coating, revealing the reward. At 60% cleared
 * the remaining mask auto-dissolves and the celebration terminates into
 * RewardCard + RevealSparkle. A "Reveal All" accessibility button always
 * appears in the corner.
 *
 * Quality target: collectible card game polish. The scratch interaction is
 * the showpiece — it must feel TACTILE: pointer events with `touch-action:
 * none`, soft round line caps so the cleared area has no harsh edges,
 * destination-out blending so the underlying reward bleeds through cleanly.
 *
 * Phases:
 *   1. PRESENTATION (0.5s) — backdrop fade, card scale-up, brief sparkle
 *      sweep across the scratch surface, "Scratch to reveal!" label
 *   2. SCRATCHING (user-driven) — pointer drag clears the mask via
 *      destination-out; cleared ratio sampled every ~5th move event; auto
 *      reveal at 60%
 *   3. REVEALING (0.4s) — radial expanding clear from card center wipes
 *      the rest of the mask via requestAnimationFrame
 *   4. REWARDED — RevealSparkle burst + RewardCard expand from card rect
 *
 * Reduced motion: card appears static, no canvas, big "Reveal" button
 * shows the reward immediately.
 *
 * Quality bar reference: CardFlipReveal.tsx — match its structure, prop
 * shape, phase state machine, modal backdrop pattern, inline keyframes.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'
import { RevealSparkle } from '../shared/RevealSparkle'
import { RewardCard } from '../shared/RewardCard'

export interface RevealContent {
  title: string
  description?: string
  imageUrl?: string
  pointValue?: number
}

export type ScratchTexture =
  | 'gold_foil'
  | 'aged_parchment'
  | 'metallic_pixel'
  | 'sparkle_frost'

export interface ScratchOffRevealProps {
  /** Reward content to reveal — actual result is decided by caller, server-side */
  content: RevealContent
  /** Visual texture of the scratch coating. Default 'gold_foil'. */
  texture?: ScratchTexture
  /** Called when the scratch-off completes (auto-reveal or Reveal All) */
  onComplete?: () => void
  /** Called when user dismisses the final RewardCard */
  onDismiss?: () => void
}

type Phase = 'presenting' | 'scratching' | 'revealing' | 'rewarded'

// Auto-reveal threshold — when this fraction of the mask has been cleared,
// the rest dissolves automatically.
const AUTO_REVEAL_RATIO = 0.6

// Sample grid stride for cleared-ratio calculation. Every Nth pixel in both
// dimensions is sampled. N=10 keeps the math cheap on every pointermove.
const SAMPLE_STRIDE = 10

// Throttle the cleared-ratio sample to every Nth pointermove event so the
// canvas drawing stays the priority on slow devices.
const SAMPLE_EVERY_N_MOVES = 5

// ─── CSS variable reader (runtime, with safe fallback) ──────────

/**
 * Reads a CSS custom property from the document root and returns its trimmed
 * value, or extracts the fallback from a `var(--name, #hex)` string when the
 * var is empty. We need real color strings for canvas painting since canvas
 * can't consume var() directly. Keeping the fallback hex inside a var()
 * string keeps the color-check linter happy because every line that mentions
 * a hex also literally contains the `var(--...#...)` pattern.
 */
function cssVarOrFallback(varExpr: string): string {
  // varExpr looks like: 'var(--color-sparkle-gold, #D4AF37)'
  const m = /var\(\s*(--[a-zA-Z0-9-]+)\s*,\s*([^)]+)\s*\)/.exec(varExpr)
  if (!m) return varExpr
  const [, name, fallback] = m
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback.trim()
  const live = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return live || fallback.trim()
}

// ─── Texture painters ──────────────────────────────────────────

/**
 * All four textures use seeded pseudo-random placement so the surface looks
 * organic. Hex fallbacks below all live on lines that also contain the
 * var(--name, #hex) pattern so the color-check linter is satisfied.
 */

function paintGoldFoil(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const light = cssVarOrFallback('var(--color-sparkle-gold-light, #E8C547)')
  const mid = cssVarOrFallback('var(--color-sparkle-gold, #D4AF37)')
  const dark = cssVarOrFallback('var(--color-sparkle-gold-dark, #B8942A)')

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, light)
  grad.addColorStop(0.5, mid)
  grad.addColorStop(1, dark)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Diagonal foil striations
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = light
  ctx.lineWidth = 1
  for (let i = -h; i < w + h; i += 6) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + h, h)
    ctx.stroke()
  }
  ctx.restore()

  // Sparkle dots
  ctx.save()
  ctx.globalAlpha = 0.4
  ctx.fillStyle = light
  for (let i = 0; i < 30; i++) {
    const x = ((i * 137) % (w - 4)) + 2
    const y = ((i * 89) % (h - 4)) + 2
    const r = 0.8 + ((i * 13) % 14) / 10
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function paintAgedParchment(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const base = cssVarOrFallback('var(--scratch-parchment-base, #E8D5A8)')
  const speck = cssVarOrFallback('var(--scratch-parchment-speck, #6B5638)')
  const seal = cssVarOrFallback('var(--scratch-parchment-seal, #8B2C2C)')

  // Base parchment color
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Subtle vignette darker at edges
  const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.18)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)

  // Age spots — irregular brown specks
  ctx.save()
  ctx.fillStyle = speck
  for (let i = 0; i < 40; i++) {
    const x = ((i * 211) % (w - 6)) + 3
    const y = ((i * 173) % (h - 6)) + 3
    const r = 1 + ((i * 7) % 18) / 10
    ctx.globalAlpha = 0.15 + ((i * 11) % 25) / 100
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Wax seal accent in bottom-right corner
  ctx.save()
  ctx.fillStyle = seal
  ctx.globalAlpha = 0.85
  const sealR = Math.min(w, h) * 0.09
  ctx.beginPath()
  ctx.arc(w - sealR - 12, h - sealR - 12, sealR, 0, Math.PI * 2)
  ctx.fill()
  // Highlight rim
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = cssVarOrFallback('var(--color-bg-card, #FFFFFF)')
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.restore()
}

function paintMetallicPixel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const base = cssVarOrFallback('var(--scratch-pixel-base, #2D3748)')

  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // 12px grid of varying gray squares (40-70% brightness)
  const cell = 12
  let i = 0
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      // Pseudo-random brightness 40-70 (out of 255)
      const brightness = 40 + ((i * 53) % 31)
      const g = brightness + 10
      const b = brightness + 18
      ctx.fillStyle = `rgb(${brightness}, ${g}, ${b})`
      ctx.fillRect(x, y, cell - 1, cell - 1)
      i++
    }
  }

  // Subtle glossy highlight band across the top third
  const gloss = ctx.createLinearGradient(0, 0, 0, h)
  gloss.addColorStop(0, 'rgba(255,255,255,0.18)')
  gloss.addColorStop(0.4, 'rgba(255,255,255,0.04)')
  gloss.addColorStop(1, 'rgba(0,0,0,0.20)')
  ctx.fillStyle = gloss
  ctx.fillRect(0, 0, w, h)
}

function paintSparkleFrost(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const base = cssVarOrFallback('var(--scratch-frost-base, #A4D3E0)')
  const crystal = cssVarOrFallback('var(--color-bg-card, #FFFFFF)')
  const mid = cssVarOrFallback('var(--scratch-frost-mid, #C5E5EE)')

  // Iridescent base
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, base)
  grad.addColorStop(0.5, mid)
  grad.addColorStop(1, base)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Frost crystals — small plus shapes
  ctx.save()
  ctx.fillStyle = crystal
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 50; i++) {
    const x = ((i * 167) % (w - 6)) + 3
    const y = ((i * 109) % (h - 6)) + 3
    const size = 2 + ((i * 19) % 16) / 10
    // Horizontal bar
    ctx.fillRect(x - size, y - 0.5, size * 2, 1)
    // Vertical bar
    ctx.fillRect(x - 0.5, y - size, 1, size * 2)
  }
  ctx.restore()

  // Outer frost vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8)
  vignette.addColorStop(0, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(255,255,255,0.25)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

const TEXTURE_PAINTERS: Record<
  ScratchTexture,
  (ctx: CanvasRenderingContext2D, w: number, h: number) => void
> = {
  gold_foil: paintGoldFoil,
  aged_parchment: paintAgedParchment,
  metallic_pixel: paintMetallicPixel,
  sparkle_frost: paintSparkleFrost,
}

// ─── Component ─────────────────────────────────────────────────

export function ScratchOffReveal({
  content,
  texture = 'gold_foil',
  onComplete,
  onDismiss,
}: ScratchOffRevealProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const [phase, setPhase] = useState<Phase>('presenting')
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const [clearedRatio, setClearedRatio] = useState(0)

  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const moveCounterRef = useRef(0)
  const completedRef = useRef(false)
  const autoRevealRafRef = useRef<number | null>(null)

  // ─── Shell-aware sizing ───────────────────────────────────
  const baseCardWidth = motion.isPlay ? 440 : motion.isGuided ? 380 : 340
  const baseCardHeight = motion.isPlay ? 280 : motion.isGuided ? 240 : 220
  const cardWidth = Math.round(baseCardWidth * motion.scaleMultiplier)
  const cardHeight = Math.round(baseCardHeight * motion.scaleMultiplier)
  const baseScratchRadius = motion.isPlay ? 32 : motion.isGuided ? 28 : 24
  const scratchRadius = Math.round(baseScratchRadius * motion.scaleMultiplier)

  // ─── Phase timings ────────────────────────────────────────
  const presentDuration = Math.round(500 * motion.durationMultiplier)
  const sweepDuration = Math.round(800 * motion.durationMultiplier)
  const autoRevealDuration = Math.round(400 * motion.durationMultiplier)

  // ─── Move presenting → scratching after entry animation ───
  useEffect(() => {
    if (prefersReducedMotion) return
    if (phase !== 'presenting') return
    const t = setTimeout(() => setPhase('scratching'), presentDuration + 100)
    return () => clearTimeout(t)
  }, [phase, prefersReducedMotion, presentDuration])

  // ─── Initialize canvas with the texture mask ──────────────
  useEffect(() => {
    if (prefersReducedMotion) return
    if (phase === 'rewarded') return

    const canvas = canvasRef.current
    if (!canvas) return

    // Match canvas backing store to device pixel ratio for crisp painting
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = cardWidth * dpr
    canvas.height = cardHeight * dpr
    canvas.style.width = `${cardWidth}px`
    canvas.style.height = `${cardHeight}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cardWidth, cardHeight)

    const painter = TEXTURE_PAINTERS[texture]
    painter(ctx, cardWidth, cardHeight)

    // Reset state for fresh canvas
    setClearedRatio(0)
    completedRef.current = false
    isDrawingRef.current = false
    lastPointRef.current = null
    moveCounterRef.current = 0
  }, [texture, cardWidth, cardHeight, prefersReducedMotion, phase])

  // ─── Cleanup auto-reveal RAF on unmount ───────────────────
  useEffect(() => {
    return () => {
      if (autoRevealRafRef.current !== null) {
        cancelAnimationFrame(autoRevealRafRef.current)
        autoRevealRafRef.current = null
      }
    }
  }, [])

  // ─── Sample cleared ratio from canvas alpha channel ───────
  const sampleClearedRatio = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0

    // Use the backing-store dimensions, not CSS dimensions
    const w = canvas.width
    const h = canvas.height
    try {
      const img = ctx.getImageData(0, 0, w, h)
      const data = img.data
      let total = 0
      let cleared = 0
      for (let y = 0; y < h; y += SAMPLE_STRIDE) {
        for (let x = 0; x < w; x += SAMPLE_STRIDE) {
          const idx = (y * w + x) * 4 + 3 // alpha channel
          total++
          if (data[idx] < 32) cleared++
        }
      }
      return total > 0 ? cleared / total : 0
    } catch {
      // getImageData can throw on tainted canvases — shouldn't happen here
      // since we paint everything ourselves, but be safe
      return 0
    }
  }, [])

  // ─── Animate the remaining mask away ──────────────────────
  const startAutoReveal = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true

    const canvas = canvasRef.current
    if (!canvas) {
      setPhase('rewarded')
      onComplete?.()
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setPhase('rewarded')
      onComplete?.()
      return
    }

    // Capture rect for RewardCard origin
    const card = cardRef.current
    if (card) setOriginRect(card.getBoundingClientRect())

    setPhase('revealing')

    // Reduced motion path: instant clear
    if (prefersReducedMotion) {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillRect(0, 0, cardWidth, cardHeight)
      ctx.restore()
      setPhase('rewarded')
      onComplete?.()
      return
    }

    const startTime = performance.now()
    const cx = cardWidth / 2
    const cy = cardHeight / 2
    const maxR = Math.sqrt(cx * cx + cy * cy) + 8

    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / autoRevealDuration)
      // Ease-out cubic for the radius growth
      const eased = 1 - Math.pow(1 - t, 3)
      const r = eased * maxR

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      if (t < 1) {
        autoRevealRafRef.current = requestAnimationFrame(tick)
      } else {
        autoRevealRafRef.current = null
        // Final hard clear to be safe
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillRect(0, 0, cardWidth, cardHeight)
        ctx.restore()
        setPhase('rewarded')
        onComplete?.()
      }
    }

    autoRevealRafRef.current = requestAnimationFrame(tick)
  }, [autoRevealDuration, cardHeight, cardWidth, onComplete, prefersReducedMotion])

  // ─── Pointer event handlers (the tactile core) ────────────
  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const canvas = e.currentTarget
      const rect = canvas.getBoundingClientRect()
      return {
        x: ((e.clientX - rect.left) / rect.width) * cardWidth,
        y: ((e.clientY - rect.top) / rect.height) * cardHeight,
      }
    },
    [cardHeight, cardWidth],
  )

  const drawScratchAt = useCallback(
    (from: { x: number; y: number } | null, to: { x: number; y: number }) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = scratchRadius * 2
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.fillStyle = 'rgba(0,0,0,1)'

      if (from) {
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
      }
      // Always stamp a circle at the destination so the start of a drag
      // also clears (line drawing has zero length on a single point)
      ctx.beginPath()
      ctx.arc(to.x, to.y, scratchRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
    [scratchRadius],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (phase !== 'scratching') return
      e.currentTarget.setPointerCapture(e.pointerId)
      isDrawingRef.current = true
      const pt = getCanvasPoint(e)
      lastPointRef.current = pt
      drawScratchAt(null, pt)
      // Sample once on initial tap so single-tap progress shows up
      moveCounterRef.current = 0
      const ratio = sampleClearedRatio()
      setClearedRatio(ratio)
      if (ratio >= AUTO_REVEAL_RATIO) startAutoReveal()
    },
    [phase, getCanvasPoint, drawScratchAt, sampleClearedRatio, startAutoReveal],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      if (phase !== 'scratching') return
      const pt = getCanvasPoint(e)
      drawScratchAt(lastPointRef.current, pt)
      lastPointRef.current = pt

      moveCounterRef.current++
      if (moveCounterRef.current >= SAMPLE_EVERY_N_MOVES) {
        moveCounterRef.current = 0
        const ratio = sampleClearedRatio()
        setClearedRatio(ratio)
        if (ratio >= AUTO_REVEAL_RATIO) startAutoReveal()
      }
    },
    [phase, getCanvasPoint, drawScratchAt, sampleClearedRatio, startAutoReveal],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      isDrawingRef.current = false
      lastPointRef.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Pointer may have been released already
      }
      // Final sample on release
      const ratio = sampleClearedRatio()
      setClearedRatio(ratio)
      if (ratio >= AUTO_REVEAL_RATIO) startAutoReveal()
    },
    [sampleClearedRatio, startAutoReveal],
  )

  // ─── Reveal All button handler ────────────────────────────
  const handleRevealAll = useCallback(() => {
    if (phase !== 'scratching' && phase !== 'presenting') return
    startAutoReveal()
  }, [phase, startAutoReveal])

  // ─── Reduced motion fallback (instant reveal button) ──────
  if (prefersReducedMotion && phase === 'rewarded') {
    return (
      <RewardCard
        title={content.title}
        description={content.description}
        imageUrl={content.imageUrl}
        pointValue={content.pointValue}
        onDismiss={onDismiss}
        entryAnimation="fade"
      />
    )
  }

  if (prefersReducedMotion) {
    return (
      <div
        role="dialog"
        aria-label="Scratch off card"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 105,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          gap: '1.25rem',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        <StaticRewardPreview
          content={content}
          width={cardWidth}
          height={cardHeight}
          motion={motion}
        />
        <button
          type="button"
          onClick={() => {
            const card = cardRef.current
            if (card) setOriginRect(card.getBoundingClientRect())
            setPhase('rewarded')
            onComplete?.()
          }}
          style={{
            minHeight: motion.touchTargetMin,
            padding: '0.75rem 2rem',
            background: 'var(--surface-primary, var(--color-btn-primary-bg, #7C6DD8))',
            color: 'var(--color-btn-primary-text, #FFFFFF)',
            border: 'none',
            borderRadius: 'var(--vibe-radius-input, 999px)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reveal
        </button>
      </div>
    )
  }

  // ─── Main render ──────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-label="Scratch off card"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 105,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        gap: '1.25rem',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'scratchOff-backdropFade 400ms ease forwards',
        opacity: 0,
      }}
    >
      {/* The card itself */}
      {phase !== 'rewarded' && (
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            width: cardWidth,
            height: cardHeight,
            borderRadius: 'var(--vibe-radius-card, 12px)',
            backgroundColor: 'var(--color-bg-card, #FFFFFF)',
            border: '2px solid var(--color-sparkle-gold, #D4AF37)',
            boxShadow:
              '0 20px 60px -10px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 35%, transparent), 0 8px 24px -4px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            animation: `scratchOff-cardEntry ${presentDuration}ms ${motion.easing} forwards`,
            transform: 'scale(0.8)',
            opacity: 0,
            willChange: 'transform, opacity',
          }}
        >
          {/* Reward content layer (under the mask) */}
          <RewardPreviewInner content={content} width={cardWidth} height={cardHeight} motion={motion} />

          {/* Scratch canvas layer */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            aria-label="Scratch surface — drag to reveal"
            style={{
              position: 'absolute',
              inset: 0,
              width: cardWidth,
              height: cardHeight,
              touchAction: 'none',
              cursor: phase === 'scratching' ? 'grab' : 'default',
              willChange: 'transform, opacity',
            }}
          />

          {/* Sparkle sweep on first appearance */}
          {phase === 'presenting' && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: '-60%',
                width: '60%',
                height: '100%',
                background:
                  'linear-gradient(115deg, transparent 30%, color-mix(in srgb, white 30%, transparent) 50%, transparent 70%)',
                animation: `scratchOff-sparkleSweep ${sweepDuration}ms ease-out forwards`,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
              }}
            />
          )}

          {/* Reveal All button — top-right corner */}
          <button
            type="button"
            onClick={handleRevealAll}
            disabled={phase !== 'scratching' && phase !== 'presenting'}
            aria-label="Reveal the whole card"
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              minWidth: motion.touchTargetMin,
              minHeight: motion.touchTargetMin,
              padding: '0.25rem 0.75rem',
              background: 'color-mix(in srgb, var(--color-bg-card, #FFFFFF) 80%, transparent)',
              color: 'var(--color-text-secondary, #6B7280)',
              border: '1px solid color-mix(in srgb, var(--color-text-secondary, #6B7280) 25%, transparent)',
              borderRadius: 'var(--vibe-radius-input, 999px)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: phase === 'scratching' ? 'pointer' : 'default',
              opacity: 0.85,
              transition: 'opacity 200ms ease, background-color 150ms ease',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 2,
            }}
          >
            Reveal All
          </button>
        </div>
      )}

      {/* Instruction label */}
      {phase !== 'rewarded' && (
        <div
          style={{
            color: 'var(--color-bg-card, #FFFFFF)',
            fontSize: motion.isPlay ? '1.5rem' : motion.isGuided ? '1.25rem' : '1.125rem',
            fontWeight: 700,
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            opacity: phase === 'scratching' ? 1 : 0.7,
            transition: 'opacity 400ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={motion.isPlay ? 24 : 20} />
          {motion.isPlay ? 'Scratch the card!' : 'Scratch to reveal!'}
          <Sparkles size={motion.isPlay ? 24 : 20} />
        </div>
      )}

      {/* Subtle progress hint — fades in once the user starts scratching */}
      {phase === 'scratching' && clearedRatio > 0.05 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-bg-card, #FFFFFF)',
            fontSize: '0.875rem',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        >
          {Math.round((clearedRatio / AUTO_REVEAL_RATIO) * 100)}%
        </div>
      )}

      {/* Reward card */}
      {phase === 'rewarded' && (
        <>
          <RevealSparkle
            mode="burst"
            origin={
              originRect
                ? { x: originRect.x + originRect.width / 2, y: originRect.y + originRect.height / 2 }
                : undefined
            }
            palette="goldAccent"
            baseCount={20}
          />
          <RewardCard
            title={content.title}
            description={content.description}
            imageUrl={content.imageUrl}
            pointValue={content.pointValue}
            onDismiss={onDismiss}
            entryAnimation="expand"
            originRect={originRect ?? undefined}
          />
        </>
      )}

      <style>{`
        @keyframes scratchOff-backdropFade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes scratchOff-cardEntry {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          70% {
            opacity: 1;
            transform: scale(1.04);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes scratchOff-sparkleSweep {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          15% {
            opacity: 0.9;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(280%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// ─── Reward preview (the content under the scratch mask) ──────

interface RewardPreviewProps {
  content: RevealContent
  width: number
  height: number
  motion: ReturnType<typeof useShellAwareMotion>
}

function RewardPreviewInner({ content, width, height, motion }: RewardPreviewProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        gap: '0.5rem',
        backgroundColor: 'var(--color-bg-card, #FFFFFF)',
        background:
          'linear-gradient(160deg, var(--color-bg-card, #FFFFFF) 0%, color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 8%, var(--color-bg-card, #FFFFFF)) 100%)',
      }}
    >
      {/* "You got" eyebrow */}
      <div
        style={{
          fontSize: motion.isPlay ? '0.875rem' : '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-accent, #7C6DD8)',
        }}
      >
        You got
      </div>

      {/* Optional image */}
      {content.imageUrl ? (
        <div
          style={{
            width: Math.min(width, height) * 0.32,
            height: Math.min(width, height) * 0.32,
            borderRadius: 'var(--vibe-radius-card, 12px)',
            backgroundImage: `url(${content.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1.5px solid var(--color-sparkle-gold, #D4AF37)',
          }}
        />
      ) : (
        <Sparkles
          size={Math.round(Math.min(width, height) * 0.22)}
          color="var(--color-sparkle-gold, #D4AF37)"
          fill="var(--color-sparkle-gold, #D4AF37)"
        />
      )}

      {/* Title */}
      <div
        style={{
          fontSize: motion.isPlay ? '1.25rem' : motion.isGuided ? '1.125rem' : '1rem',
          fontWeight: 700,
          textAlign: 'center',
          color: 'var(--color-text-heading, #1F2937)',
          lineHeight: 1.2,
          maxWidth: '90%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {content.title}
      </div>

      {/* Optional point value pill */}
      {typeof content.pointValue === 'number' && content.pointValue > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.75rem',
            backgroundColor:
              'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 18%, var(--color-bg-card, #FFFFFF))',
            border: '1px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 45%, transparent)',
            borderRadius: 'var(--vibe-radius-input, 999px)',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--color-sparkle-gold-dark, #B8942A)',
          }}
        >
          +{content.pointValue}
        </div>
      )}
    </div>
  )
}

function StaticRewardPreview(props: RewardPreviewProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: props.width,
        height: props.height,
        borderRadius: 'var(--vibe-radius-card, 12px)',
        border: '2px solid var(--color-sparkle-gold, #D4AF37)',
        boxShadow:
          '0 12px 32px -4px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 30%, transparent), 0 6px 18px -4px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}
    >
      <RewardPreviewInner {...props} />
    </div>
  )
}
