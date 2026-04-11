/**
 * ColorRevealCanvas — Build M Phase 3
 *
 * Canvas-based pixel masking that shows color.png pixels ONLY where
 * their color matches a revealed zone's hex value. Unrevealed pixels
 * show the grayscale image underneath.
 *
 * How it works:
 *   1. Load both grayscale.png and color.png into offscreen Image objects
 *   2. Draw grayscale as the base layer onto the visible canvas
 *   3. Draw color.png onto a hidden offscreen canvas
 *   4. Read color pixel data, compare each pixel's RGB to the set of
 *      revealed zone hex colors (with tolerance for compression artifacts)
 *   5. For matching pixels, paint them onto the visible canvas on top
 *      of the grayscale
 *
 * The tolerance accounts for JPEG/PNG compression artifacts — a pixel
 * stored as #E54134 in the zone data might render as #E44033 after
 * compression. We use a per-channel tolerance of ±12.
 */

import { useRef, useEffect, useState, useMemo } from 'react'
import { coloringImageUrl } from '@/lib/coloringImageUrl'
import type { ColoringRevealZone } from '@/types/play-dashboard'

interface ColorRevealCanvasProps {
  slug: string
  /** All zones defined for this image */
  zones: ColoringRevealZone[]
  /** IDs of zones that have been revealed */
  revealedZoneIds: number[]
  /** If true, show the full color image (completed state) */
  showFullColor?: boolean
  /** CSS class name for the container */
  className?: string
}

/** Per-channel RGB tolerance for matching compressed pixels to zone hex values */
const COLOR_TOLERANCE = 12

export function ColorRevealCanvas({
  slug,
  zones,
  revealedZoneIds,
  showFullColor = false,
  className,
}: ColorRevealCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState(0)

  // Build a lookup set of revealed zone RGB values for fast pixel matching
  const revealedRgbSet = useMemo(() => {
    if (showFullColor) return null // skip computation — show everything
    const revealedIds = new Set(revealedZoneIds)
    const rgbValues: Array<[number, number, number]> = []
    for (const zone of zones) {
      if (revealedIds.has(zone.id)) {
        const rgb = hexToRgb(zone.hex)
        if (rgb) rgbValues.push(rgb)
      }
    }
    return rgbValues
  }, [zones, revealedZoneIds, showFullColor])

  // Observe container size for responsive canvas
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect.width)
        if (width > 0) setCanvasSize(width)
      }
    })
    observer.observe(container)

    // Initial measurement
    const initialWidth = Math.floor(container.clientWidth)
    if (initialWidth > 0) setCanvasSize(initialWidth)

    return () => observer.disconnect()
  }, [])

  // Render the canvas whenever size, images, or revealed zones change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasSize === 0) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const grayscaleUrl = coloringImageUrl(slug, 'grayscale')
    const colorUrl = coloringImageUrl(slug, 'color')

    const grayscaleImg = new Image()
    const colorImg = new Image()
    grayscaleImg.crossOrigin = 'anonymous'
    colorImg.crossOrigin = 'anonymous'

    let cancelled = false

    Promise.all([
      new Promise<void>((resolve, reject) => {
        grayscaleImg.onload = () => resolve()
        grayscaleImg.onerror = reject
        grayscaleImg.src = grayscaleUrl
      }),
      new Promise<void>((resolve, reject) => {
        colorImg.onload = () => resolve()
        colorImg.onerror = reject
        colorImg.src = colorUrl
      }),
    ])
      .then(() => {
        if (cancelled) return

        const size = canvasSize
        // Use device pixel ratio for crisp rendering
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = size * dpr
        canvas.height = size * dpr
        canvas.style.width = `${size}px`
        canvas.style.height = `${size}px`
        ctx.scale(dpr, dpr)

        // Calculate cover-fit crop (center crop to 1:1)
        const imgW = colorImg.naturalWidth
        const imgH = colorImg.naturalHeight
        const minDim = Math.min(imgW, imgH)
        const sx = (imgW - minDim) / 2
        const sy = (imgH - minDim) / 2

        if (showFullColor) {
          // Just draw the full color image
          ctx.drawImage(colorImg, sx, sy, minDim, minDim, 0, 0, size, size)
          return
        }

        // Step 1: Draw grayscale as the base
        ctx.drawImage(grayscaleImg, sx, sy, minDim, minDim, 0, 0, size, size)

        if (!revealedRgbSet || revealedRgbSet.length === 0) return

        // Step 2: Draw color onto an offscreen canvas
        const offscreen = document.createElement('canvas')
        offscreen.width = size * dpr
        offscreen.height = size * dpr
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true })
        if (!offCtx) return
        offCtx.scale(dpr, dpr)
        offCtx.drawImage(colorImg, sx, sy, minDim, minDim, 0, 0, size, size)

        // Step 3: Read pixel data from the color image
        const colorData = offCtx.getImageData(0, 0, size * dpr, size * dpr)
        const pixels = colorData.data

        // Step 4: Create a mask — only keep pixels matching revealed zones
        const maskedData = ctx.createImageData(size * dpr, size * dpr)
        const masked = maskedData.data

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]

          if (matchesAnyZone(r, g, b, revealedRgbSet)) {
            masked[i] = r
            masked[i + 1] = g
            masked[i + 2] = b
            masked[i + 3] = 255 // fully opaque
          }
          // else: leave transparent (alpha = 0)
        }

        // Step 5: Draw the masked color pixels on top of the grayscale
        // Use a temp canvas to putImageData then drawImage with compositing
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = size * dpr
        maskCanvas.height = size * dpr
        const maskCtx = maskCanvas.getContext('2d')
        if (!maskCtx) return
        maskCtx.putImageData(maskedData, 0, 0)

        // Reset scale for raw pixel drawing
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(maskCanvas, 0, 0)
      })
      .catch(err => {
        if (!cancelled) {
          console.warn('ColorRevealCanvas image load failed:', err)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug, canvasSize, revealedRgbSet, showFullColor])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return null
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)]
}

function matchesAnyZone(
  r: number,
  g: number,
  b: number,
  rgbSet: Array<[number, number, number]>,
): boolean {
  for (const [zr, zg, zb] of rgbSet) {
    if (
      Math.abs(r - zr) <= COLOR_TOLERANCE &&
      Math.abs(g - zg) <= COLOR_TOLERANCE &&
      Math.abs(b - zb) <= COLOR_TOLERANCE
    ) {
      return true
    }
  }
  return false
}
