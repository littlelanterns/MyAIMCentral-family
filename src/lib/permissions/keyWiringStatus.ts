/**
 * keyWiringStatus — SINGLE SOURCE OF TRUTH for which permission keys are
 * actually enforced by a real surface ("active") vs recorded-but-not-yet-
 * enforced ("inactive").
 *
 * Founder ruling (PERMISSIONS-WIRING gate, 2026-06-09): "what is marked in one
 * place is marked in all places." Every screen that DISPLAYS permission state
 * (the Permission Hub grid, the teen "What's Shared" panel, any future
 * transparency surface) must consult this registry and render inactive keys
 * with the same "takes effect in a future update" treatment. Neither screen
 * may claim a control the app does not enforce.
 *
 * When a build wires a key to a real surface, flip it to 'active' here and
 * BOTH display surfaces update together.
 */

export type KeyWiringStatus = 'active' | 'inactive'

export const INACTIVE_PERMISSION_NOTE = 'Takes effect in a future update'

const KEY_WIRING: Record<string, KeyWiringStatus> = {
  // Wired — role-scoping leak pass 2026-06-09
  tasks_basic: 'active',
  lists_basic: 'active',

  // Wired — PERMISSIONS-WIRING build 2026-06-09
  archives_browse: 'active',
  financial_tracking: 'active',
  studio: 'active',
  reward_rules: 'active',

  // Recorded but not enforced — no dad-views-kid surface exists yet.
  // Founder ruling: keep visible in the Hub, marked inactive.
  journal_basic: 'inactive',
  guiding_stars_basic: 'inactive',
  best_intentions: 'inactive',
  innerworkings_basic: 'inactive',
  victory_recorder_basic: 'inactive',
}

/** Unknown keys default to 'inactive' — never claim enforcement we can't prove. */
export function getKeyWiringStatus(featureKey: string): KeyWiringStatus {
  return KEY_WIRING[featureKey] ?? 'inactive'
}

export function isKeyActive(featureKey: string): boolean {
  return getKeyWiringStatus(featureKey) === 'active'
}
