/**
 * Reveal animations — interactive choose-your-reward components.
 *
 * All four reveals share the same `RevealContent` shape for the reward
 * payload. RevealContent is canonically exported from CardFlipReveal and
 * re-exported here once (the other reveal files redeclare it locally to
 * keep their imports tidy, but they're structurally identical).
 */

export { CardFlipReveal } from './CardFlipReveal'
export type { CardFlipRevealProps, RevealContent } from './CardFlipReveal'

export { ThreeDoorsReveal } from './ThreeDoorsReveal'
export type { ThreeDoorsRevealProps } from './ThreeDoorsReveal'

export { SpinnerWheelReveal } from './SpinnerWheelReveal'
export type {
  SpinnerWheelRevealProps,
  SpinnerWheelSegment,
} from './SpinnerWheelReveal'

export { ScratchOffReveal } from './ScratchOffReveal'
export type { ScratchOffRevealProps, ScratchTexture } from './ScratchOffReveal'
