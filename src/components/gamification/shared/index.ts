/**
 * Gamification shared infrastructure barrel.
 *
 * Build any gamification animation against these primitives — never
 * reach into individual files.
 */

export {
  useShellAwareMotion,
  getShellMotionConfig,
  ShellMotionOverrideProvider,
} from './useShellAwareMotion'
export type {
  ShellMotionConfig,
  ShellMotionOverrideProviderProps,
} from './useShellAwareMotion'

export {
  useReducedMotion,
  ReducedMotionOverrideProvider,
} from './useReducedMotion'
export type { ReducedMotionOverrideProviderProps } from './useReducedMotion'

export { RevealSparkle } from './RevealSparkle'
export type { RevealSparkleProps, RevealSparkleMode } from './RevealSparkle'

export { RewardCard } from './RewardCard'
export type { RewardCardProps } from './RewardCard'

export {
  randomBetween,
  randomFromArray,
  getParticleCount,
  buildRadialParticles,
  buildShowerParticles,
  PARTICLE_PALETTES,
} from './particleHelpers'
export type {
  RadialParticleConfig,
  RadialParticle,
  ShowerParticleConfig,
  ShowerParticle,
  ParticleShape,
  ParticlePaletteKey,
} from './particleHelpers'
