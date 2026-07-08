/**
 * PRD-30 Safety Monitoring — client-side mirror of the category/severity
 * constants in `supabase/functions/_shared/safety-classify-match.ts`.
 *
 * That module is Deno-only (lives under supabase/functions/, not in the
 * Vite build). Rather than reach across the build boundary, this is a
 * deliberate duplicate — flagged by the SM-A progress log as the correct
 * fix so both copies stay small, dependency-free, and easy to eyeball
 * against each other. Keep in sync with safety-classify-match.ts.
 */

export type SafetyCategory =
  | 'self_harm'
  | 'abuse'
  | 'sexual_predatory'
  | 'substance'
  | 'eating_disorder'
  | 'bullying'
  | 'profanity'
  | 'other'

export type SafetySeverity = 'concern' | 'warning' | 'critical'
export type SafetySensitivity = 'low' | 'medium' | 'high'
export type SafetyFlagStatus = 'new' | 'acknowledged' | 'dismissed'

export const CATEGORY_LIST: SafetyCategory[] = [
  'self_harm',
  'abuse',
  'sexual_predatory',
  'substance',
  'eating_disorder',
  'bullying',
  'profanity',
  'other',
]

// Key PRD Decision #3 — always High at the pipeline layer regardless of any
// stored value. The UI never renders an editable control for these; they
// show a locked pill instead (mirrors safety-classify-match.ts).
export const LOCKED_CATEGORIES: SafetyCategory[] = ['self_harm', 'abuse', 'sexual_predatory']

export function isLockedCategory(category: SafetyCategory): boolean {
  return (LOCKED_CATEGORIES as string[]).includes(category)
}

// Plain-language labels — NEVER show the raw enum string to mom (J2/D2,
// mirrors the PRD-41 LiLa Response Log precedent).
export const CATEGORY_DISPLAY_LABEL: Record<SafetyCategory, string> = {
  self_harm: 'Self-Harm / Suicidal Ideation',
  abuse: 'Abuse Indicators',
  sexual_predatory: 'Sexual Content / Predatory Patterns',
  substance: 'Substance Use',
  eating_disorder: 'Eating Disorder Language',
  bullying: 'Severe Bullying',
  profanity: 'Profanity / Aggressive Language',
  other: 'Other Concerning Patterns',
}

export const SEVERITY_DISPLAY_LABEL: Record<SafetySeverity, string> = {
  concern: 'Concern',
  warning: 'Warning',
  critical: 'Critical',
}

const SEVERITY_RANK: Record<SafetySeverity, number> = { concern: 1, warning: 2, critical: 3 }

export function severityRank(s: SafetySeverity): number {
  return SEVERITY_RANK[s]
}

/**
 * Shell-type default sensitivity for ADJUSTABLE categories — mirrors
 * resolveDefaultSensitivity() in safety-classify-match.ts exactly, used
 * here only for DISPLAY (showing what "default" means before mom sets an
 * override). The pipeline's own resolution is authoritative at scan time.
 */
export function resolveDefaultSensitivity(
  category: SafetyCategory,
  dashboardMode: string | null,
): SafetySensitivity {
  if (isLockedCategory(category)) return 'high'
  if (dashboardMode === 'play' || dashboardMode === 'guided') return 'high'
  return category === 'profanity' ? 'low' : 'medium'
}

export function surfaceLabel(surface: string): string {
  const map: Record<string, string> = {
    'lila-chat': 'a LiLa chat',
    'bookshelf-discuss': 'a BookShelf discussion',
  }
  return map[surface] || 'a ' + surface.replace(/-/g, ' ')
}

export function detectionLayerLabel(layer: 'keyword' | 'classification' | 'both'): string {
  if (layer === 'keyword') return 'Keyword match'
  if (layer === 'classification') return 'Conversation review'
  return 'Keyword + conversation review'
}
