/**
 * BackgroundCelebration — PRD-24 Gamification Foundation
 *
 * SVG silhouette elements that animate across the dashboard periphery on task
 * completion events. Each background defines 9 animations (3 small + 3 medium
 * + 3 large), and the component picks one per fire — never repeating the most
 * recent. Animations are CSS-keyframe driven (transform + opacity only) and
 * never cross the center 40% of the viewport vertically.
 *
 * Tier behavior:
 *   small  → every task completion        (2000ms × multiplier, 0 trail)
 *   medium → 3rd daily / routine complete (3000ms × multiplier, 3-5 trail)
 *   large  → 5th+ task / Perfect Day      (4000ms × multiplier, 8-12 trail)
 *
 * Shell visibility is enforced by the parent (Adult shell omits the mount).
 * If mounted, this component always renders. Reduced motion replaces the
 * silhouette flight with a brief 200ms gold-tint sweep along the entry edge.
 *
 * Backgrounds shipped: 'ocean', 'space', 'garden' — 27 hand-drawn SVG paths
 * total. Add more by extending CELEBRATION_LIBRARY.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useShellAwareMotion } from '../shared/useShellAwareMotion'
import { useReducedMotion } from '../shared/useReducedMotion'

// ─── Types ───────────────────────────────────────────────────────────────────

export type CelebrationTier = 'small' | 'medium' | 'large'

export interface CelebrationAnimationDefinition {
  id: string
  /** SVG path data (single <path> d attribute) */
  pathData: string
  /** SVG viewBox */
  viewBox: string
  /** Base size in px (will be multiplied by motion.scaleMultiplier) */
  baseSize: number
  /** Entry edge: 'left', 'right', or 'top' */
  entryEdge: 'left' | 'right' | 'top'
  /**
   * Y position as a fraction of viewport height (0 = top, 1 = bottom).
   * MUST be < 0.3 OR > 0.7 — never crosses center 40%.
   */
  yPosition: number
  /** Animation flight path keyframes — translate values that the keyframe will use. */
  flightPath: { x: string; y: string; rotate?: string }[]
}

export interface CelebrationConfig {
  small: CelebrationAnimationDefinition[]
  medium: CelebrationAnimationDefinition[]
  large: CelebrationAnimationDefinition[]
}

export interface BackgroundCelebrationProps {
  tier: CelebrationTier
  /** Background ID — selects which CelebrationConfig to use */
  backgroundId: string
  /** Optional override config (testing/showcase) */
  celebrationConfig?: CelebrationConfig
  /** Called when animation completes */
  onComplete?: () => void
}

// ─── Silhouette path library ─────────────────────────────────────────────────
//
// Every path is hand-drawn for cleanness. ViewBoxes are 100x100 unless noted.
// The silhouettes are filled with var(--color-accent) (with transparency on
// the trail particles). Path commands favor cubic bezier curves for smoothness.

// OCEAN — Fish silhouettes (3 variants)
const FISH_ROUND =
  'M 12 50 C 18 32, 50 28, 72 36 C 78 38, 84 44, 86 50 C 84 56, 78 62, 72 64 C 50 72, 18 68, 12 50 Z M 8 50 L -2 38 L 2 50 L -2 62 Z M 60 47 A 2 2 0 1 1 60 47.1 Z'

const FISH_SLENDER =
  'M 8 50 C 18 38, 48 36, 78 42 C 84 44, 88 47, 90 50 C 88 53, 84 56, 78 58 C 48 64, 18 62, 8 50 Z M 4 50 L -4 40 L 0 50 L -4 60 Z M 64 48 A 1.6 1.6 0 1 1 64 48.1 Z'

const FISH_CHUBBY =
  'M 14 50 C 20 24, 56 22, 76 32 C 84 36, 90 42, 92 50 C 90 58, 84 64, 76 68 C 56 78, 20 76, 14 50 Z M 10 50 L -6 32 L 2 50 L -6 68 Z M 62 46 A 2.4 2.4 0 1 1 62 46.1 Z'

// OCEAN — Dolphin silhouettes (3 variants)
const DOLPHIN_LEAPING =
  'M 6 60 C 14 42, 30 30, 52 28 C 64 27, 76 30, 88 36 C 92 38, 96 42, 96 46 C 92 44, 86 42, 80 42 C 78 36, 74 30, 66 26 C 70 32, 70 38, 68 42 C 56 42, 44 46, 32 54 C 22 60, 14 64, 6 60 Z M 80 42 L 92 38 L 88 46 Z'

const DOLPHIN_DIVING =
  'M 8 50 C 18 38, 36 32, 56 32 C 70 32, 84 36, 94 44 C 96 46, 96 48, 94 50 C 88 46, 80 44, 72 44 C 70 38, 64 32, 56 28 C 60 34, 62 40, 60 44 C 48 46, 36 50, 24 56 C 18 60, 12 60, 8 56 Z M 56 28 L 66 22 L 60 32 Z'

const DOLPHIN_PLAYFUL =
  'M 4 56 C 16 36, 36 26, 60 26 C 74 26, 88 30, 96 38 C 98 40, 98 44, 96 46 C 88 42, 80 40, 72 40 C 70 32, 64 26, 54 22 C 58 28, 60 36, 58 42 C 46 44, 34 50, 22 56 C 14 60, 8 60, 4 56 Z M 54 22 L 64 16 L 58 26 Z'

// OCEAN — Whale silhouettes (3 variants)
const WHALE_BLUE =
  'M 6 50 C 12 30, 36 22, 64 24 C 78 26, 90 32, 96 42 C 98 46, 98 54, 96 58 C 90 68, 78 74, 64 76 C 36 78, 12 70, 6 50 Z M 96 50 L 110 38 L 104 50 L 110 62 Z M 22 46 A 1.6 1.6 0 1 1 22 46.1 Z M 26 32 C 24 28, 26 24, 30 24 C 32 26, 32 30, 30 32 Z'

const WHALE_HUMPBACK =
  'M 4 52 C 10 32, 30 22, 56 22 C 72 22, 86 28, 94 38 C 98 44, 98 56, 94 62 C 86 72, 72 78, 56 78 C 30 78, 10 68, 4 52 Z M 94 50 L 108 36 L 102 50 L 108 64 Z M 18 26 C 14 32, 14 36, 18 38 C 22 36, 22 32, 18 26 Z M 22 46 A 1.4 1.4 0 1 1 22 46.1 Z'

const WHALE_SPERM =
  'M 4 48 C 4 30, 24 20, 50 20 C 70 20, 86 26, 94 38 C 98 42, 98 54, 94 58 C 86 70, 70 76, 50 76 C 24 76, 4 66, 4 48 Z M 94 48 L 108 36 L 104 48 L 108 60 Z M 14 42 A 1.4 1.4 0 1 1 14 42.1 Z'

// SPACE — Shooting star silhouettes (3 variants — star + tail)
const SHOOTING_STAR_LONG =
  'M 70 50 L 78 36 L 82 50 L 96 46 L 84 56 L 90 70 L 76 62 L 70 76 L 66 62 L 56 66 L 64 54 Z M 64 54 L 4 86 L 56 66 Z'

const SHOOTING_STAR_DIAGONAL =
  'M 72 38 L 80 24 L 84 38 L 98 34 L 86 44 L 92 58 L 78 50 L 72 64 L 68 50 L 58 54 L 66 42 Z M 66 42 L 6 74 L 58 54 Z'

const SHOOTING_STAR_BURST =
  'M 70 50 L 80 30 L 86 50 L 100 44 L 88 56 L 94 74 L 76 62 L 70 80 L 64 62 L 50 68 L 60 54 Z M 60 54 L -4 90 L 50 68 Z'

// SPACE — Comet silhouettes (3 variants — round head + flared tail)
const COMET_SHORT =
  'M 70 50 A 14 14 0 1 1 70 50.1 M 56 50 C 40 44, 20 46, 4 50 C 20 54, 40 56, 56 50 Z'

const COMET_LONG =
  'M 76 50 A 12 12 0 1 1 76 50.1 M 64 50 C 44 42, 16 46, -8 52 C 16 58, 44 58, 64 50 Z'

const COMET_FLARED =
  'M 78 50 A 16 16 0 1 1 78 50.1 M 62 50 C 38 38, 8 44, -12 56 C 8 60, 38 64, 62 50 Z'

// SPACE — Constellation silhouettes (3 variants — star clusters)
// Each star is a 5-pointed star shape. No connecting lines — the stars
// alone form recognizable constellation patterns. The component adds a
// faint connecting-line stroke overlay for constellations via fillRule.

// Triangle: 3 stars at apex + 2 base corners
const CONSTELLATION_TRIANGLE =
  'M 50 8 L 54 18 L 64 18 L 56 24 L 60 34 L 50 28 L 40 34 L 44 24 L 36 18 L 46 18 Z ' +
  'M 16 72 L 20 82 L 30 82 L 22 88 L 26 98 L 16 92 L 6 98 L 10 88 L 2 82 L 12 82 Z ' +
  'M 84 72 L 88 82 L 98 82 L 90 88 L 94 98 L 84 92 L 74 98 L 78 88 L 70 82 L 80 82 Z'

// Square: 4 stars in a quadrilateral
const CONSTELLATION_SQUARE =
  'M 20 20 L 24 28 L 32 28 L 26 34 L 28 42 L 20 37 L 12 42 L 14 34 L 8 28 L 16 28 Z ' +
  'M 80 20 L 84 28 L 92 28 L 86 34 L 88 42 L 80 37 L 72 42 L 74 34 L 68 28 L 76 28 Z ' +
  'M 20 74 L 24 82 L 32 82 L 26 88 L 28 96 L 20 91 L 12 96 L 14 88 L 8 82 L 16 82 Z ' +
  'M 80 74 L 84 82 L 92 82 L 86 88 L 88 96 L 80 91 L 72 96 L 74 88 L 68 82 L 76 82 Z'

// Arc: 5 stars in a curving sweep (Big Dipper style)
const CONSTELLATION_ARC =
  'M 12 78 L 16 86 L 24 86 L 18 92 L 20 100 L 12 95 L 4 100 L 6 92 L 0 86 L 8 86 Z ' +
  'M 30 44 L 34 52 L 42 52 L 36 58 L 38 66 L 30 61 L 22 66 L 24 58 L 18 52 L 26 52 Z ' +
  'M 50 26 L 54 34 L 62 34 L 56 40 L 58 48 L 50 43 L 42 48 L 44 40 L 38 34 L 46 34 Z ' +
  'M 70 44 L 74 52 L 82 52 L 76 58 L 78 66 L 70 61 L 62 66 L 64 58 L 58 52 L 66 52 Z ' +
  'M 88 78 L 92 86 L 100 86 L 94 92 L 96 100 L 88 95 L 80 100 L 82 92 L 76 86 L 84 86 Z'

// GARDEN — Butterfly silhouettes (3 variants — body + 4 wings)
const BUTTERFLY_MONARCH =
  'M 48 32 C 48 26, 52 26, 52 32 L 52 70 C 52 76, 48 76, 48 70 Z M 48 36 C 30 22, 8 24, 4 36 C 0 48, 14 56, 32 50 C 38 48, 44 44, 48 40 Z M 52 36 C 70 22, 92 24, 96 36 C 100 48, 86 56, 68 50 C 62 48, 56 44, 52 40 Z M 48 52 C 32 50, 14 58, 12 70 C 12 78, 22 80, 34 74 C 40 70, 46 64, 48 58 Z M 52 52 C 68 50, 86 58, 88 70 C 88 78, 78 80, 66 74 C 60 70, 54 64, 52 58 Z'

const BUTTERFLY_SWALLOWTAIL =
  'M 48 30 C 48 24, 52 24, 52 30 L 52 72 C 52 80, 48 80, 48 72 Z M 48 34 C 26 18, 4 22, 2 36 C 0 50, 16 58, 36 50 C 42 48, 46 44, 48 38 Z M 52 34 C 74 18, 96 22, 98 36 C 100 50, 84 58, 64 50 C 58 48, 54 44, 52 38 Z M 48 52 C 28 52, 8 64, 8 76 C 10 84, 22 84, 34 76 C 42 70, 48 62, 48 56 Z M 52 52 C 72 52, 92 64, 92 76 C 90 84, 78 84, 66 76 C 58 70, 52 62, 52 56 Z M 30 80 L 26 92 L 36 84 Z M 70 80 L 74 92 L 64 84 Z'

const BUTTERFLY_SMALL =
  'M 48 36 C 48 32, 52 32, 52 36 L 52 64 C 52 68, 48 68, 48 64 Z M 48 38 C 36 28, 18 30, 16 40 C 14 50, 26 56, 40 50 C 44 48, 46 44, 48 42 Z M 52 38 C 64 28, 82 30, 84 40 C 86 50, 74 56, 60 50 C 56 48, 54 44, 52 42 Z M 48 52 C 38 52, 24 58, 24 66 C 26 72, 34 72, 42 66 C 46 62, 48 58, 48 54 Z M 52 52 C 62 52, 76 58, 76 66 C 74 72, 66 72, 58 66 C 54 62, 52 58, 52 54 Z'

// GARDEN — Bird silhouettes (3 variants)
const BIRD_SPARROW =
  'M 18 56 C 26 42, 44 38, 60 42 C 70 44, 78 50, 82 58 C 80 62, 76 64, 70 64 C 56 64, 36 64, 22 62 C 18 60, 16 58, 18 56 Z M 60 42 C 66 36, 74 32, 80 32 C 78 36, 76 40, 72 42 Z M 82 50 A 1.4 1.4 0 1 1 82 50.1 M 18 56 L 6 50 L 14 60 Z'

const BIRD_CARDINAL =
  'M 14 58 C 22 40, 42 34, 60 38 C 72 40, 82 48, 86 58 C 84 62, 80 64, 74 64 C 56 66, 32 66, 18 64 C 14 62, 12 60, 14 58 Z M 60 38 C 66 28, 76 22, 84 22 C 82 28, 80 34, 76 38 Z M 80 32 L 88 26 L 84 36 Z M 86 50 A 1.6 1.6 0 1 1 86 50.1 M 14 58 L 0 48 L 10 62 Z'

const BIRD_ROBIN =
  'M 16 56 C 24 42, 42 36, 60 40 C 72 42, 80 50, 84 58 C 82 62, 78 64, 72 64 C 56 66, 32 66, 20 64 C 16 62, 14 58, 16 56 Z M 60 40 C 66 32, 74 28, 80 28 C 78 34, 76 38, 72 40 Z M 84 50 A 1.4 1.4 0 1 1 84 50.1 M 16 56 L 4 48 L 12 62 Z M 32 60 C 36 62, 44 62, 48 60 C 44 66, 36 66, 32 60 Z'

// GARDEN — Flower silhouettes (3 variants)
// Cluster of 5 small flowers (each with 5 petals + center)
const FLOWERS_CLUSTER =
  'M 24 32 A 5 5 0 1 1 24 32.1 M 18 38 A 5 5 0 1 1 18 38.1 M 30 38 A 5 5 0 1 1 30 38.1 M 18 50 A 5 5 0 1 1 18 50.1 M 30 50 A 5 5 0 1 1 30 50.1 M 24 56 A 4 4 0 1 1 24 56.1 ' +
  'M 50 28 A 5 5 0 1 1 50 28.1 M 44 34 A 5 5 0 1 1 44 34.1 M 56 34 A 5 5 0 1 1 56 34.1 M 44 46 A 5 5 0 1 1 44 46.1 M 56 46 A 5 5 0 1 1 56 46.1 M 50 52 A 4 4 0 1 1 50 52.1 ' +
  'M 76 32 A 5 5 0 1 1 76 32.1 M 70 38 A 5 5 0 1 1 70 38.1 M 82 38 A 5 5 0 1 1 82 38.1 M 70 50 A 5 5 0 1 1 70 50.1 M 82 50 A 5 5 0 1 1 82 50.1 M 76 56 A 4 4 0 1 1 76 56.1 ' +
  'M 24 60 L 24 92 M 50 56 L 50 92 M 76 60 L 76 92'

// Vine of 3 blooms with leaves
const FLOWERS_VINE =
  'M 50 8 C 30 14, 20 28, 22 44 C 24 60, 36 70, 50 76 C 64 70, 76 60, 78 44 C 80 28, 70 14, 50 8 Z ' +
  'M 50 14 A 4 4 0 1 1 50 14.1 M 44 18 A 4 4 0 1 1 44 18.1 M 56 18 A 4 4 0 1 1 56 18.1 M 44 26 A 4 4 0 1 1 44 26.1 M 56 26 A 4 4 0 1 1 56 26.1 M 50 30 A 3 3 0 1 1 50 30.1 ' +
  'M 30 38 A 4 4 0 1 1 30 38.1 M 24 42 A 4 4 0 1 1 24 42.1 M 36 42 A 4 4 0 1 1 36 42.1 M 30 50 A 3 3 0 1 1 30 50.1 ' +
  'M 70 38 A 4 4 0 1 1 70 38.1 M 64 42 A 4 4 0 1 1 64 42.1 M 76 42 A 4 4 0 1 1 76 42.1 M 70 50 A 3 3 0 1 1 70 50.1 ' +
  'M 50 76 L 50 96'

// Single large flower (8 petals + center + stem)
const FLOWERS_SINGLE_LARGE =
  'M 50 14 C 42 18, 38 26, 42 34 C 46 30, 50 28, 50 28 C 50 28, 54 30, 58 34 C 62 26, 58 18, 50 14 Z ' +
  'M 76 26 C 70 22, 62 24, 60 32 C 64 32, 68 36, 70 40 C 78 40, 82 32, 76 26 Z ' +
  'M 86 50 C 86 42, 78 38, 70 42 C 72 46, 72 50, 70 54 C 78 58, 86 58, 86 50 Z ' +
  'M 76 74 C 80 68, 78 60, 70 60 C 68 64, 64 68, 60 70 C 62 78, 70 80, 76 74 Z ' +
  'M 50 86 C 58 82, 62 74, 58 66 C 54 70, 50 72, 50 72 C 50 72, 46 70, 42 66 C 38 74, 42 82, 50 86 Z ' +
  'M 24 74 C 20 68, 22 60, 30 60 C 32 64, 36 68, 40 70 C 38 78, 30 80, 24 74 Z ' +
  'M 14 50 C 14 42, 22 38, 30 42 C 28 46, 28 50, 30 54 C 22 58, 14 58, 14 50 Z ' +
  'M 24 26 C 30 22, 38 24, 40 32 C 36 32, 32 36, 30 40 C 22 40, 18 32, 24 26 Z ' +
  'M 50 50 A 8 8 0 1 1 50 50.1 ' +
  'M 50 86 L 50 100'

// ─── CelebrationConfig library ───────────────────────────────────────────────

export const CELEBRATION_LIBRARY: Record<string, CelebrationConfig> = {
  ocean: {
    small: [
      {
        id: 'ocean-fish-round-lr',
        pathData: FISH_ROUND,
        viewBox: '0 0 100 100',
        baseSize: 60,
        entryEdge: 'left',
        yPosition: 0.18,
        flightPath: [
          { x: '-12vw', y: '0px', rotate: '0deg' },
          { x: '50vw', y: '-6px', rotate: '2deg' },
          { x: '112vw', y: '0px', rotate: '0deg' },
        ],
      },
      {
        id: 'ocean-fish-slender-rl',
        pathData: FISH_SLENDER,
        viewBox: '0 0 100 100',
        baseSize: 60,
        entryEdge: 'right',
        yPosition: 0.82,
        flightPath: [
          { x: '12vw', y: '0px', rotate: '180deg' },
          { x: '-50vw', y: '6px', rotate: '178deg' },
          { x: '-112vw', y: '0px', rotate: '180deg' },
        ],
      },
      {
        id: 'ocean-fish-chubby-lr',
        pathData: FISH_CHUBBY,
        viewBox: '0 0 100 100',
        baseSize: 70,
        entryEdge: 'left',
        yPosition: 0.78,
        flightPath: [
          { x: '-12vw', y: '0px', rotate: '0deg' },
          { x: '50vw', y: '4px', rotate: '-3deg' },
          { x: '112vw', y: '0px', rotate: '0deg' },
        ],
      },
    ],
    medium: [
      {
        id: 'ocean-dolphin-leap-lr',
        pathData: DOLPHIN_LEAPING,
        viewBox: '0 0 100 100',
        baseSize: 100,
        entryEdge: 'left',
        yPosition: 0.22,
        flightPath: [
          { x: '-12vw', y: '20px', rotate: '0deg' },
          { x: '50vw', y: '-30px', rotate: '-8deg' },
          { x: '112vw', y: '20px', rotate: '8deg' },
        ],
      },
      {
        id: 'ocean-dolphin-dive-rl',
        pathData: DOLPHIN_DIVING,
        viewBox: '0 0 100 100',
        baseSize: 100,
        entryEdge: 'right',
        yPosition: 0.78,
        flightPath: [
          { x: '12vw', y: '-20px', rotate: '180deg' },
          { x: '-50vw', y: '30px', rotate: '188deg' },
          { x: '-112vw', y: '-20px', rotate: '172deg' },
        ],
      },
      {
        id: 'ocean-dolphin-playful-lr',
        pathData: DOLPHIN_PLAYFUL,
        viewBox: '0 0 100 100',
        baseSize: 110,
        entryEdge: 'left',
        yPosition: 0.16,
        flightPath: [
          { x: '-14vw', y: '15px', rotate: '0deg' },
          { x: '50vw', y: '-25px', rotate: '-6deg' },
          { x: '114vw', y: '15px', rotate: '6deg' },
        ],
      },
    ],
    large: [
      {
        id: 'ocean-whale-blue-breach',
        pathData: WHALE_BLUE,
        viewBox: '0 0 110 100',
        baseSize: 160,
        entryEdge: 'left',
        yPosition: 0.85,
        flightPath: [
          { x: '-16vw', y: '40px', rotate: '0deg' },
          { x: '50vw', y: '-40px', rotate: '-4deg' },
          { x: '116vw', y: '40px', rotate: '4deg' },
        ],
      },
      {
        id: 'ocean-whale-humpback-breach',
        pathData: WHALE_HUMPBACK,
        viewBox: '0 0 110 100',
        baseSize: 160,
        entryEdge: 'right',
        yPosition: 0.85,
        flightPath: [
          { x: '16vw', y: '40px', rotate: '180deg' },
          { x: '-50vw', y: '-40px', rotate: '184deg' },
          { x: '-116vw', y: '40px', rotate: '176deg' },
        ],
      },
      {
        id: 'ocean-whale-sperm-glide',
        pathData: WHALE_SPERM,
        viewBox: '0 0 110 100',
        baseSize: 170,
        entryEdge: 'left',
        yPosition: 0.18,
        flightPath: [
          { x: '-16vw', y: '0px', rotate: '0deg' },
          { x: '50vw', y: '-10px', rotate: '-2deg' },
          { x: '116vw', y: '0px', rotate: '2deg' },
        ],
      },
    ],
  },

  space: {
    small: [
      {
        id: 'space-shooting-star-long',
        pathData: SHOOTING_STAR_LONG,
        viewBox: '0 0 100 100',
        baseSize: 70,
        entryEdge: 'right',
        yPosition: 0.15,
        flightPath: [
          { x: '15vw', y: '-30px', rotate: '0deg' },
          { x: '-50vw', y: '20px', rotate: '0deg' },
          { x: '-115vw', y: '60px', rotate: '0deg' },
        ],
      },
      {
        id: 'space-shooting-star-diagonal',
        pathData: SHOOTING_STAR_DIAGONAL,
        viewBox: '0 0 100 100',
        baseSize: 70,
        entryEdge: 'right',
        yPosition: 0.22,
        flightPath: [
          { x: '15vw', y: '-20px', rotate: '0deg' },
          { x: '-50vw', y: '30px', rotate: '0deg' },
          { x: '-115vw', y: '80px', rotate: '0deg' },
        ],
      },
      {
        id: 'space-shooting-star-burst',
        pathData: SHOOTING_STAR_BURST,
        viewBox: '0 0 100 100',
        baseSize: 80,
        entryEdge: 'right',
        yPosition: 0.85,
        flightPath: [
          { x: '15vw', y: '20px', rotate: '0deg' },
          { x: '-50vw', y: '-10px', rotate: '0deg' },
          { x: '-115vw', y: '-40px', rotate: '0deg' },
        ],
      },
    ],
    medium: [
      {
        id: 'space-comet-short-arc',
        pathData: COMET_SHORT,
        viewBox: '0 0 100 100',
        baseSize: 110,
        entryEdge: 'left',
        yPosition: 0.18,
        flightPath: [
          { x: '-15vw', y: '20px', rotate: '0deg' },
          { x: '50vw', y: '-30px', rotate: '8deg' },
          { x: '115vw', y: '20px', rotate: '0deg' },
        ],
      },
      {
        id: 'space-comet-long-glide',
        pathData: COMET_LONG,
        viewBox: '-20 0 120 100',
        baseSize: 130,
        entryEdge: 'right',
        yPosition: 0.82,
        flightPath: [
          { x: '15vw', y: '0px', rotate: '180deg' },
          { x: '-50vw', y: '0px', rotate: '180deg' },
          { x: '-120vw', y: '0px', rotate: '180deg' },
        ],
      },
      {
        id: 'space-comet-flared-dive',
        pathData: COMET_FLARED,
        viewBox: '-20 0 120 100',
        baseSize: 130,
        entryEdge: 'left',
        yPosition: 0.85,
        flightPath: [
          { x: '-15vw', y: '-20px', rotate: '0deg' },
          { x: '50vw', y: '10px', rotate: '4deg' },
          { x: '115vw', y: '-20px', rotate: '0deg' },
        ],
      },
    ],
    large: [
      {
        id: 'space-constellation-triangle',
        pathData: CONSTELLATION_TRIANGLE,
        viewBox: '0 0 100 100',
        baseSize: 180,
        entryEdge: 'top',
        yPosition: 0.16,
        flightPath: [
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
        ],
      },
      {
        id: 'space-constellation-square',
        pathData: CONSTELLATION_SQUARE,
        viewBox: '0 0 100 100',
        baseSize: 180,
        entryEdge: 'top',
        yPosition: 0.85,
        flightPath: [
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
        ],
      },
      {
        id: 'space-constellation-arc',
        pathData: CONSTELLATION_ARC,
        viewBox: '0 0 100 100',
        baseSize: 200,
        entryEdge: 'top',
        yPosition: 0.18,
        flightPath: [
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
        ],
      },
    ],
  },

  garden: {
    small: [
      {
        id: 'garden-butterfly-monarch',
        pathData: BUTTERFLY_MONARCH,
        viewBox: '0 0 100 100',
        baseSize: 70,
        entryEdge: 'left',
        yPosition: 0.16,
        flightPath: [
          { x: '-12vw', y: '0px', rotate: '0deg' },
          { x: '50vw', y: '-15px', rotate: '6deg' },
          { x: '112vw', y: '10px', rotate: '-4deg' },
        ],
      },
      {
        id: 'garden-butterfly-swallowtail',
        pathData: BUTTERFLY_SWALLOWTAIL,
        viewBox: '0 0 100 100',
        baseSize: 75,
        entryEdge: 'right',
        yPosition: 0.22,
        flightPath: [
          { x: '12vw', y: '0px', rotate: '0deg' },
          { x: '-50vw', y: '20px', rotate: '-6deg' },
          { x: '-112vw', y: '-10px', rotate: '4deg' },
        ],
      },
      {
        id: 'garden-butterfly-small',
        pathData: BUTTERFLY_SMALL,
        viewBox: '0 0 100 100',
        baseSize: 60,
        entryEdge: 'left',
        yPosition: 0.82,
        flightPath: [
          { x: '-12vw', y: '0px', rotate: '0deg' },
          { x: '50vw', y: '-12px', rotate: '4deg' },
          { x: '112vw', y: '8px', rotate: '-2deg' },
        ],
      },
    ],
    medium: [
      {
        id: 'garden-bird-sparrow',
        pathData: BIRD_SPARROW,
        viewBox: '-10 0 110 100',
        baseSize: 100,
        entryEdge: 'left',
        yPosition: 0.18,
        flightPath: [
          { x: '-14vw', y: '10px', rotate: '0deg' },
          { x: '50vw', y: '-15px', rotate: '-3deg' },
          { x: '114vw', y: '0px', rotate: '0deg' },
        ],
      },
      {
        id: 'garden-bird-cardinal',
        pathData: BIRD_CARDINAL,
        viewBox: '-10 0 110 100',
        baseSize: 110,
        entryEdge: 'right',
        yPosition: 0.22,
        flightPath: [
          { x: '14vw', y: '10px', rotate: '180deg' },
          { x: '-50vw', y: '-15px', rotate: '183deg' },
          { x: '-114vw', y: '0px', rotate: '180deg' },
        ],
      },
      {
        id: 'garden-bird-robin',
        pathData: BIRD_ROBIN,
        viewBox: '-10 0 110 100',
        baseSize: 100,
        entryEdge: 'left',
        yPosition: 0.82,
        flightPath: [
          { x: '-14vw', y: '0px', rotate: '0deg' },
          { x: '50vw', y: '-10px', rotate: '-2deg' },
          { x: '114vw', y: '5px', rotate: '0deg' },
        ],
      },
    ],
    large: [
      {
        id: 'garden-flowers-cluster',
        pathData: FLOWERS_CLUSTER,
        viewBox: '0 0 100 100',
        baseSize: 180,
        entryEdge: 'top',
        yPosition: 0.84,
        flightPath: [
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
        ],
      },
      {
        id: 'garden-flowers-vine',
        pathData: FLOWERS_VINE,
        viewBox: '0 0 100 100',
        baseSize: 180,
        entryEdge: 'top',
        yPosition: 0.16,
        flightPath: [
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
        ],
      },
      {
        id: 'garden-flowers-single-large',
        pathData: FLOWERS_SINGLE_LARGE,
        viewBox: '0 0 100 100',
        baseSize: 200,
        entryEdge: 'top',
        yPosition: 0.85,
        flightPath: [
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
          { x: '0vw', y: '0px', rotate: '0deg' },
        ],
      },
    ],
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BackgroundCelebration({
  tier,
  backgroundId,
  celebrationConfig,
  onComplete,
}: BackgroundCelebrationProps) {
  const motion = useShellAwareMotion()
  const prefersReducedMotion = useReducedMotion()

  const lastAnimationIdRef = useRef<string | null>(null)
  const completedRef = useRef(false)

  // Resolve config: explicit override > library lookup > ocean fallback
  const config = useMemo<CelebrationConfig>(() => {
    if (celebrationConfig) return celebrationConfig
    return CELEBRATION_LIBRARY[backgroundId] ?? CELEBRATION_LIBRARY.ocean
  }, [celebrationConfig, backgroundId])

  // Pick an animation, excluding the last-played one
  const animation = useMemo<CelebrationAnimationDefinition>(() => {
    const pool = config[tier]
    if (pool.length === 0) {
      // Shouldn't happen, but pick from any tier as fallback
      const anyPool = config.small.length > 0 ? config.small : config.medium
      return anyPool[0]
    }
    const eligible = pool.filter((a) => a.id !== lastAnimationIdRef.current)
    const candidates = eligible.length > 0 ? eligible : pool
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    lastAnimationIdRef.current = pick.id
    return pick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, tier])

  // Tier base durations (ms)
  const baseDurationByTier: Record<CelebrationTier, number> = {
    small: 2000,
    medium: 3000,
    large: 4000,
  }
  const durationMs = Math.round(baseDurationByTier[tier] * motion.durationMultiplier)

  // Trail particle counts (per spec)
  const trailCountByTier: Record<CelebrationTier, number> = {
    small: 0,
    medium: 4,
    large: 10,
  }
  const trailCount = motion.hasSparkleTrails ? trailCountByTier[tier] : 0

  // Resolved size in px
  const sizePx = Math.round(animation.baseSize * motion.scaleMultiplier)

  // Build the dynamic keyframe — single keyframe per animation id
  const keyframeName = `bgCelebFlight_${animation.id.replace(/[^a-zA-Z0-9_]/g, '_')}`

  const keyframeCss = useMemo(() => {
    if (prefersReducedMotion) return ''
    const steps = animation.flightPath
    if (steps.length === 0) return ''

    // For constellation/flower 'top' anchored animations, the flight path is
    // identity translate(0,0). We still want a fade-in / scale-in / fade-out
    // pulse, so we use a different keyframe pattern keyed off opacity + scale.
    const isStationary = steps.every((s) => s.x === '0vw' && s.y === '0px')

    if (isStationary) {
      return `
        @keyframes ${keyframeName} {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
          18%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          78%  { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        }
      `
    }

    // Standard moving keyframe
    const pct = (i: number) => `${Math.round((i / (steps.length - 1)) * 100)}%`
    const stepCss = steps
      .map((s, i) => {
        const rotate = s.rotate ?? '0deg'
        return `${pct(i)} { transform: translate(${s.x}, ${s.y}) rotate(${rotate}); opacity: ${
          i === 0 || i === steps.length - 1 ? 0 : 1
        }; }`
      })
      .join('\n          ')

    return `
        @keyframes ${keyframeName} {
          ${stepCss}
        }
      `
  }, [animation, keyframeName, prefersReducedMotion])

  // Schedule completion
  useEffect(() => {
    if (completedRef.current) return
    const totalMs = prefersReducedMotion ? 250 : durationMs + 50
    const t = setTimeout(() => {
      completedRef.current = true
      onComplete?.()
    }, totalMs)
    return () => clearTimeout(t)
  }, [durationMs, prefersReducedMotion, onComplete])

  // ─── Reduced motion fallback ─────────────────────────────────────────────
  if (prefersReducedMotion) {
    const edge = animation.entryEdge
    const edgeStyle: React.CSSProperties = {
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 5,
      opacity: 0,
      animation: `bgCelebEdgeFlash 250ms ease-out forwards`,
      willChange: 'opacity',
    }

    if (edge === 'left') {
      Object.assign(edgeStyle, {
        top: 0,
        left: 0,
        bottom: 0,
        width: '12px',
        background:
          'linear-gradient(to right, color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 50%, transparent), transparent)',
      })
    } else if (edge === 'right') {
      Object.assign(edgeStyle, {
        top: 0,
        right: 0,
        bottom: 0,
        width: '12px',
        background:
          'linear-gradient(to left, color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 50%, transparent), transparent)',
      })
    } else {
      Object.assign(edgeStyle, {
        top: 0,
        left: 0,
        right: 0,
        height: '12px',
        background:
          'linear-gradient(to bottom, color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 50%, transparent), transparent)',
      })
    }

    return (
      <>
        <div aria-hidden="true" style={edgeStyle} />
        <style>{`
          @keyframes bgCelebEdgeFlash {
            0%   { opacity: 0; }
            30%  { opacity: 1; }
            70%  { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </>
    )
  }

  // ─── Standard animated render ─────────────────────────────────────────────
  // The silhouette wrapper is anchored at yPosition; the keyframe drives x/y
  // translate from the offscreen entry to the offscreen exit (for moving
  // animations) or from scale/opacity (for stationary constellation/flower
  // bursts).

  const isStationary = animation.flightPath.every(
    (s) => s.x === '0vw' && s.y === '0px',
  )

  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${animation.yPosition * 100}vh`,
    left: isStationary ? '50%' : '0',
    width: sizePx,
    height: sizePx,
    pointerEvents: 'none',
    zIndex: 5,
    opacity: 0,
    transform: isStationary ? 'translate(-50%, -50%) scale(0.6)' : 'translate(-12vw, 0)',
    animation: `${keyframeName} ${durationMs}ms ${motion.easing} forwards`,
    willChange: 'transform, opacity',
  }

  const fillColor = 'var(--color-accent, #7C6DD8)'
  const trailColor = 'color-mix(in srgb, var(--color-accent, #7C6DD8) 60%, transparent)'

  return (
    <>
      {/* Main silhouette */}
      <div aria-hidden="true" style={wrapperStyle}>
        <svg
          viewBox={animation.viewBox}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', overflow: 'visible' }}
        >
          <path
            d={animation.pathData}
            fill={fillColor}
            stroke={fillColor}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Trail particles (medium + large) */}
      {trailCount > 0 &&
        Array.from({ length: trailCount }).map((_, i) => {
          const delayMs = (i + 1) * 80
          const particleSize = Math.max(3, Math.round(sizePx * 0.06))
          const particleStyle: React.CSSProperties = {
            position: 'fixed',
            top: `${animation.yPosition * 100}vh`,
            left: 0,
            width: particleSize,
            height: particleSize,
            borderRadius: '50%',
            backgroundColor: trailColor,
            pointerEvents: 'none',
            zIndex: 4,
            opacity: 0,
            transform: isStationary
              ? 'translate(-50%, -50%) scale(0.6)'
              : 'translate(-12vw, 0)',
            animation: `${keyframeName} ${durationMs}ms ${motion.easing} ${delayMs}ms forwards`,
            willChange: 'transform, opacity',
          }
          return <div key={i} aria-hidden="true" style={particleStyle} />
        })}

      <style>{keyframeCss}</style>
    </>
  )
}
