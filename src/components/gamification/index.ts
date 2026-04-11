/**
 * Gamification module — PRD-24 Foundation
 *
 * Top-level barrel. Import from here, not from sub-paths.
 *
 *   import { CardFlipReveal, RewardCard, useShellAwareMotion } from '@/components/gamification'
 */

// Shared foundation
export {
  useShellAwareMotion,
  getShellMotionConfig,
  ShellMotionOverrideProvider,
  useReducedMotion,
  ReducedMotionOverrideProvider,
  RevealSparkle,
  RewardCard,
  randomBetween,
  randomFromArray,
  getParticleCount,
  buildRadialParticles,
  buildShowerParticles,
  PARTICLE_PALETTES,
} from './shared'
export type {
  ShellMotionConfig,
  ShellMotionOverrideProviderProps,
  ReducedMotionOverrideProviderProps,
  RevealSparkleProps,
  RevealSparkleMode,
  RewardCardProps,
  RadialParticleConfig,
  RadialParticle,
  ShowerParticleConfig,
  ShowerParticle,
  ParticleShape,
  ParticlePaletteKey,
} from './shared'

// Reveals
export * from './reveals'

// Celebrations
export * from './celebrations'

// Widgets
export * from './widgets'

// Dashboard layer
export * from './dashboard'

// Settings
export * from './settings'
