// Shared crisis keyword detection for lila-* Edge Functions.
// Used by all relationship tools and ThoughtSift tools (except Translator).

export const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'want to die',
  'end my life',
  'self-harm',
  'cutting myself',
  'hurting myself',
  'being abused',
  'abusing me',
  'hits me',
  'molest',
  'eating disorder',
  'starving myself',
  'purging',
  'overdose',
] as const

export const CRISIS_RESPONSE = `I hear you, and I want you to know that help is available right now.

**988 Suicide & Crisis Lifeline** — Call or text 988 (24/7)
**Crisis Text Line** — Text HOME to 741741
**National Domestic Violence Hotline** — 1-800-799-7233 (24/7)
**Emergency** — Call 911

You don't have to face this alone.`

/** Returns true if the content contains any crisis keyword (case-insensitive) */
export function detectCrisis(content: string): boolean {
  const lower = content.toLowerCase()
  return CRISIS_KEYWORDS.some(k => lower.includes(k))
}
