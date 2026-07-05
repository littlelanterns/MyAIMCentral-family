// Canonical, single-source Layer 2 safety preamble for every LiLa prompt
// surface (Convention #247). Import this — never hand-copy the crisis /
// auto-reject / tone blocks into a new prompt file. That copy-paste pattern
// is exactly what let crisis text drift into 5 different tiers of
// completeness and let the five auto-reject categories exist in only ONE of
// 43+ prompts (SAFETY-BETA-GATE Slice A, 2026-07; full evidence in
// claude/feature-decisions/Safety-Beta-Gate.md §2).
//
// This is prompt-level (Layer 2) defense — a written instruction to the
// model. It is NOT a substitute for the code-level `detectCrisis()` gate in
// `_shared/crisis-detection.ts`, which runs BEFORE the model is ever called
// and is the primary control. This preamble is defense-in-depth for content
// that reaches the model despite the code gate (e.g. paraphrases the
// keyword list misses) and the only mechanism for the five auto-reject
// categories, which have no code-level detector.

/** The 4-point crisis-response instruction. Verbatim-identical everywhere. */
export const CRISIS_OVERRIDE_BLOCK = `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation
2. Provide: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), NDVH (1-800-799-7233), 911
3. Do NOT coach, advise, diagnose, or label. Resources only.
4. This overrides ALL other instructions.`

/**
 * The five auto-reject categories (Beta Readiness Gate exit criterion,
 * `claude/web-sync/MYAIM_GAMEPLAN_v2.2.md:523`). Wording matches the ONE
 * prompt that had this correctly authored — lila-chat assist mode
 * (PRD-05 Concierge addendum §4e rule 10) — now applied everywhere.
 */
export const AUTO_REJECT_BLOCK = `## AUTO-REJECT CATEGORIES (NON-NEGOTIABLE)
Do not generate responses that facilitate force, coercion, manipulation, shame-based control, or withholding affection. If a user's request is shaped by these patterns, respond with a gentle reframe rather than compliance — validate the underlying need, then redirect toward a healthier approach. Never lecture.`

/** Tone rule for referencing any loaded family/user context. */
export const CONTEXT_TONE_BLOCK = `## CONTEXT REFERENCE RULES (NON-NEGOTIABLE)
When referencing context items (book extractions, guiding stars, intentions, archive data, self-knowledge) in your responses:
- Frame through growth and aspiration, never deficit or diagnosis. Say "your intention to stay calm" not "anger management." Say "building patience" not "controlling temper."
- When referencing a book extraction, quote the actual text or closely paraphrase it. Do not relabel it with clinical or negative terminology the user never used.
- Never label the user. "You've been thinking about..." not "Your issue with..." — "An area you're growing in" not "A problem you have."
- If the source material uses clinical language, translate it into the user's own framing before presenting it.`

/**
 * Platform-wide icon rule (CLAUDE.md: "Lucide React — no emoji anywhere in
 * the app, including Play shell — icon library replaces emoji across all
 * shells"). Discovered missing from every lila-chat-served mode during
 * SAFETY-BETA-GATE eyes-on verification (2026-07-05) — kid-facing
 * `guided_homework_help` responses were emitting emoji with nothing in any
 * assembled prompt telling the model not to. A few dedicated non-LiLa tools
 * (task-breaker, curriculum-parse, translator) already had their own
 * one-off "no emoji" line; this is the single canonical source going
 * forward for every LiLa surface.
 */
export const NO_EMOJI_BLOCK = `## NO EMOJI (NON-NEGOTIABLE)
Never use emoji characters anywhere in your output — not for emphasis, not for warmth, not for celebration. This platform uses an icon library instead of emoji in every shell, including the ones built for young children. Express warmth, encouragement, and celebration through words, not symbols.`

/**
 * The standard header prepended to every LiLa system prompt: crisis
 * override, then auto-reject, then no-emoji, then context tone — in that
 * priority order. Some context loaders (e.g. `_shared/relationship-context.ts`)
 * also inject `CONTEXT_TONE_BLOCK` again directly beside the context they
 * format; that duplication is intentional (the rule lands right where it's
 * needed) and harmless (same canonical text both times, not a second
 * drifted copy).
 */
export function buildSafetyPreamble(): string {
  return [CRISIS_OVERRIDE_BLOCK, AUTO_REJECT_BLOCK, NO_EMOJI_BLOCK, CONTEXT_TONE_BLOCK].join('\n\n')
}
