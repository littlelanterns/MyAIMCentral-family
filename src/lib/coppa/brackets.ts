/**
 * PRD-40 Slice 3 — COPPA age-bracket derivation helpers.
 *
 * `coppa_age_bracket` is the canonical under-13 source platform-wide
 * (ruling R-2, claude/feature-decisions/PRD-40-COPPA-Compliance.md).
 * Defaults to 'adult' for safety — a member must be EXPLICITLY marked
 * under_13 to trigger the consent flow (PRD-40 §Column Addition).
 */

export type CoppaAgeBracket = 'under_13' | '13_to_17' | 'adult'

export const BRACKET_LABELS: Record<CoppaAgeBracket, string> = {
  under_13: 'Under 13',
  '13_to_17': '13–17',
  adult: 'Adult (18+)',
}

export function isValidBracket(value: unknown): value is CoppaAgeBracket {
  return value === 'under_13' || value === '13_to_17' || value === 'adult'
}

/**
 * Derive a bracket from what we know about a member. PRD-40 PRD-01-retrofit
 * heuristic: explicit age < 13 → under_13; 13–17 → 13_to_17; ≥18 or clearly
 * an adult (spouse, special adult) → adult; missing/ambiguous → adult
 * (with the UI prompting mom to confirm for children — see
 * `bracketNeedsConfirmation`).
 */
export function deriveBracket(
  age: number | null,
  relationship: 'spouse' | 'child' | 'special' | 'out_of_nest',
): CoppaAgeBracket {
  if (relationship === 'spouse' || relationship === 'special' || relationship === 'out_of_nest') {
    return 'adult'
  }
  if (age == null) return 'adult'
  if (age < 13) return 'under_13'
  if (age < 18) return '13_to_17'
  return 'adult'
}

/**
 * True when the AI/manual data left the bracket genuinely ambiguous for a
 * child — no age at all — and mom should be prompted: "We weren't sure of
 * [Name]'s age — is this child under 13?" (PRD-40 bulk-add parsing rule.)
 */
export function bracketNeedsConfirmation(
  age: number | null,
  relationship: 'spouse' | 'child' | 'special' | 'out_of_nest',
): boolean {
  return relationship === 'child' && age == null
}

/** The five section keys a consent must acknowledge (PRD-40 data schema). */
export const CONSENT_SECTION_KEYS = [
  'what_we_collect',
  'how_lila_uses',
  'who_sees_it',
  'your_rights',
  'parent_affirmation',
] as const
