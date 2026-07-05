// Shared crisis keyword detection for every AI-calling Edge Function.
// Convention #7: crisis override is global — no surface is exempt, including
// utility/classification functions that process free-form user text
// (SAFETY-BETA-GATE Slice B closed the remaining gaps 2026-07).
//
// Matching uses word-boundary regexes (not raw substring `.includes()`) so a
// single-word entry can't false-match inside an unrelated compound word.
// Multi-word phrases were already boundary-safe in practice; single words
// (e.g. "suicidal") were not.

export const CRISIS_KEYWORDS = [
  // Suicidal ideation — direct
  'suicide',
  'suicidal',
  'kill myself',
  'want to die',
  'wish i was dead',
  'wish i were dead',
  "don't want to be alive",
  'do not want to be alive',
  "don't want to live",
  'do not want to live',
  'end my life',
  'end it all',
  'better off dead',
  'no reason to live',
  "can't go on",
  'cannot go on',
  'take my own life',
  // Self-harm
  'self-harm',
  'self harm',
  'cutting myself',
  'hurting myself',
  'hurt myself',
  'overdose',
  'eating disorder',
  'starving myself',
  'purging',
  // Abuse (experienced)
  'being abused',
  'abusing me',
  'hits me',
  'hitting me',
  'molest',
  'molested',
  'molesting',
  // Harm to others
  'kill him',
  'kill her',
  'kill them',
  'going to kill',
  'want to hurt',
  'going to hurt',
] as const

export const CRISIS_RESPONSE = `I hear you, and I want you to know that help is available right now.

**988 Suicide & Crisis Lifeline** — Call or text 988 (24/7)
**Crisis Text Line** — Text HOME to 741741
**National Domestic Violence Hotline** — 1-800-799-7233 (24/7)
**Emergency** — Call 911

You don't have to face this alone.`

/** Returns true if the content contains any crisis keyword or phrase (word-boundary, case-insensitive) */
export function detectCrisis(content: string): boolean {
  const lower = content.toLowerCase()
  return CRISIS_KEYWORDS.some(k => {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`).test(lower)
  })
}
