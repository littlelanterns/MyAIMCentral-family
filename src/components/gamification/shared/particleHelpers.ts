/**
 * particleHelpers — PRD-24 Gamification Foundation
 *
 * Pure utility functions extracted from SparkleOverlay + ConfettiBurst patterns.
 * No React, no DOM, no side effects. Used by RevealSparkle and any other
 * particle system in the gamification module.
 */

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomFromArray<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Apply a shell multiplier to a base particle count, with sensible floor/ceiling.
 * Adult shells get small numbers (1/4 of base) — clamp to a minimum of 4 so the
 * effect remains visible. Play caps at 2x base so we never DOS the GPU.
 */
export function getParticleCount(base: number, multiplier: number, opts?: { min?: number; max?: number }): number {
  const min = opts?.min ?? 4
  const max = opts?.max ?? Math.round(base * 2)
  return Math.max(min, Math.min(max, Math.round(base * multiplier)))
}

export interface RadialParticleConfig {
  /** Total particle count (already shell-multiplied) */
  count: number
  /** Min/max radial distance from origin in pixels */
  minDistance: number
  maxDistance: number
  /** Min/max particle size in pixels */
  minSize: number
  maxSize: number
  /** Min/max stagger delay in ms */
  minDelay: number
  maxDelay: number
  /** Min/max animation duration in ms */
  minDuration: number
  maxDuration: number
  /** Optional: restrict to a wedge of angles (degrees). Default 0-360 (full circle) */
  minAngle?: number
  maxAngle?: number
  /** Color palette to randomly draw from */
  colors: readonly string[]
  /** Particle shapes to randomly draw from */
  shapes?: readonly ParticleShape[]
}

export type ParticleShape = 'circle' | 'square' | 'star' | 'strip'

export interface RadialParticle {
  index: number
  /** Computed translation X (px from origin) */
  tx: number
  /** Computed translation Y (px from origin) */
  ty: number
  size: number
  delay: number
  duration: number
  color: string
  shape: ParticleShape
  rotation: number
}

/**
 * Generate a radial particle burst — particles fly from a single origin
 * outward in random directions. Used by RevealSparkle 'burst' mode.
 */
export function buildRadialParticles(config: RadialParticleConfig): RadialParticle[] {
  const {
    count, minDistance, maxDistance, minSize, maxSize,
    minDelay, maxDelay, minDuration, maxDuration,
    minAngle = 0, maxAngle = 360,
    colors, shapes = ['circle'],
  } = config

  return Array.from({ length: count }, (_, i) => {
    const angle = randomBetween(minAngle, maxAngle)
    const distance = randomBetween(minDistance, maxDistance)
    const radians = (angle * Math.PI) / 180
    return {
      index: i,
      tx: Math.cos(radians) * distance,
      ty: Math.sin(radians) * distance,
      size: randomBetween(minSize, maxSize),
      delay: randomBetween(minDelay, maxDelay),
      duration: randomBetween(minDuration, maxDuration),
      color: randomFromArray(colors),
      shape: randomFromArray(shapes),
      rotation: randomBetween(0, 360),
    }
  })
}

export interface ShowerParticleConfig {
  count: number
  /** X position range (% of viewport width) */
  minX: number
  maxX: number
  /** Y start position (% of viewport height, usually negative for above-screen) */
  minStartY: number
  maxStartY: number
  minSize: number
  maxSize: number
  minDelay: number
  maxDelay: number
  minDuration: number
  maxDuration: number
  /** Random horizontal drift max (px) */
  driftMax: number
  colors: readonly string[]
  shapes?: readonly ParticleShape[]
}

export interface ShowerParticle {
  index: number
  xPercent: number
  startYPercent: number
  drift: number
  size: number
  delay: number
  duration: number
  color: string
  shape: ParticleShape
  rotationStart: number
  rotationEnd: number
}

/**
 * Generate a shower of particles falling from above the viewport (or any
 * starting Y range). Used by RevealSparkle 'shower' mode.
 */
export function buildShowerParticles(config: ShowerParticleConfig): ShowerParticle[] {
  const {
    count, minX, maxX, minStartY, maxStartY,
    minSize, maxSize, minDelay, maxDelay,
    minDuration, maxDuration, driftMax,
    colors, shapes = ['circle'],
  } = config

  return Array.from({ length: count }, (_, i) => ({
    index: i,
    xPercent: randomBetween(minX, maxX),
    startYPercent: randomBetween(minStartY, maxStartY),
    drift: randomBetween(-driftMax, driftMax),
    size: randomBetween(minSize, maxSize),
    delay: randomBetween(minDelay, maxDelay),
    duration: randomBetween(minDuration, maxDuration),
    color: randomFromArray(colors),
    shape: randomFromArray(shapes),
    rotationStart: randomBetween(-30, 30),
    rotationEnd: randomBetween(360, 720),
  }))
}

/**
 * Theme-aware particle palettes. Use accent variants by default for theme
 * adaptation; gold variants are reserved for treasure/reward contexts.
 */
export const PARTICLE_PALETTES = {
  accent: [
    'var(--color-accent, #7C6DD8)',
    'var(--color-btn-primary-bg, #7C6DD8)',
    'var(--color-accent-deep, #5B4BB0)',
  ],
  accentLight: [
    'var(--color-accent, #7C6DD8)',
    'color-mix(in srgb, var(--color-accent, #7C6DD8) 70%, white)',
    'color-mix(in srgb, var(--color-accent, #7C6DD8) 50%, white)',
  ],
  gold: [
    'var(--color-sparkle-gold, #D4AF37)',
    'var(--color-sparkle-gold-light, #E8C547)',
    'var(--color-sparkle-gold-dark, #B8942A)',
  ],
  goldAccent: [
    'var(--color-sparkle-gold, #D4AF37)',
    'var(--color-sparkle-gold-light, #E8C547)',
    'var(--color-accent, #7C6DD8)',
  ],
  victory: [
    'var(--color-sparkle-gold, #D4AF37)',
    'var(--color-sparkle-gold-light, #E8C547)',
    'var(--color-victory, #FFD700)',
    'var(--color-accent, #7C6DD8)',
  ],
} as const

export type ParticlePaletteKey = keyof typeof PARTICLE_PALETTES
