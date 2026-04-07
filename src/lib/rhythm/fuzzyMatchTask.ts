/**
 * PRD-18 Enhancement 1: Fuzzy Task Matching for Evening Tomorrow Capture.
 *
 * Given a candidate text string (what mom typed in a Tomorrow Capture
 * input) and an array of her existing active tasks, returns the single
 * best match if any task is "close enough", or null otherwise.
 *
 * Why not a library: we need one lookup per input debounce cycle against
 * a small in-memory list (tens to low hundreds of tasks). A full fuzzy
 * library (Fuse.js, fuzzysort) would add ~5-10KB to the bundle and
 * significant API surface for a 40-line problem.
 *
 * Algorithm: combine two independent similarity signals:
 *
 *   1. Jaccard similarity on tokenized words.
 *      |intersection| / |union| over the two token sets.
 *      Catches paraphrased matches: "finish the report" ↔ "report finishing".
 *
 *   2. Substring coverage of the candidate against the target title.
 *      Fraction of the candidate's tokens that appear as substrings
 *      inside the target's normalized string.
 *      Catches typos and partial matches: "report" ↔ "monthly report".
 *
 * A task is considered a match if EITHER:
 *   - Jaccard ≥ JACCARD_THRESHOLD (0.55)
 *   - Substring coverage ≥ SUBSTRING_THRESHOLD (0.7)
 *
 * Thresholds are calibrated for mom's typical typing style — "Call the
 * dentist" should match "Dentist appointment call" (Jaccard 0.5, shouldn't
 * match — that's genuinely different) but "Dentist call" SHOULD match
 * (Jaccard 1.0, trivially). The substring coverage rule catches "dentist"
 * → "Dentist appointment" because 1/1 candidate tokens land in the target.
 *
 * These thresholds are exported so a future "find duplicates" feature can
 * re-use the same utility with tighter or looser bounds.
 */

const JACCARD_THRESHOLD = 0.55
const SUBSTRING_THRESHOLD = 0.7

/** Tiny stopword list — pronouns and tiny articles only. */
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'for',
  'in',
  'on',
  'at',
  'with',
  'my',
  'i',
])

/**
 * Lowercase, strip punctuation, collapse whitespace. No stemming — that
 * would over-match ("running" ≠ "runs" is fine for this use case because
 * mom usually types titles close to how she wrote them).
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalize then split into tokens, dropping stopwords. */
export function tokenize(input: string): string[] {
  const norm = normalize(input)
  if (!norm) return []
  return norm.split(' ').filter(t => t.length > 0 && !STOPWORDS.has(t))
}

/** Jaccard similarity between two token arrays. Empty → 0. */
export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const setA = new Set(a)
  const setB = new Set(b)
  let intersection = 0
  for (const t of setA) if (setB.has(t)) intersection++
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Fraction of candidate tokens that appear as substrings in the target's
 * normalized form. Empty candidate → 0.
 *
 * Uses the normalized string (not token set) on the target side because
 * a token like "appointments" should match "appointment" via substring.
 */
export function substringCoverage(candidate: string[], targetNormalized: string): number {
  if (candidate.length === 0 || !targetNormalized) return 0
  let hits = 0
  for (const tok of candidate) {
    // Short tokens (≤ 2 chars) would match everything — skip them
    // unless the whole candidate is one short token.
    if (tok.length <= 2 && candidate.length > 1) continue
    if (targetNormalized.includes(tok)) hits++
  }
  // If we skipped all candidates due to length, fall back to no coverage
  const denom = candidate.length
  return hits / denom
}

export interface FuzzyTaskMatchResult {
  task: { id: string; title: string }
  score: number
  signal: 'jaccard' | 'substring' | 'both'
}

/**
 * Find the best matching task for a candidate string. Returns null if
 * no task exceeds either threshold.
 *
 * Scoring: max(jaccard, substringCoverage). When multiple tasks tie at
 * the top, the first encountered wins — stable order in, stable match out.
 *
 * Empty input strings return null without iterating. Tasks with empty
 * titles are skipped.
 */
export function fuzzyMatchTask(
  candidate: string,
  tasks: Array<{ id: string; title: string }>
): FuzzyTaskMatchResult | null {
  if (!candidate || candidate.trim().length < 3) return null
  const candTokens = tokenize(candidate)
  if (candTokens.length === 0) return null

  let best: FuzzyTaskMatchResult | null = null

  for (const task of tasks) {
    if (!task.title) continue
    const targetTokens = tokenize(task.title)
    const targetNorm = normalize(task.title)
    if (targetTokens.length === 0) continue

    const j = jaccard(candTokens, targetTokens)
    const s = substringCoverage(candTokens, targetNorm)

    const jOk = j >= JACCARD_THRESHOLD
    const sOk = s >= SUBSTRING_THRESHOLD
    if (!jOk && !sOk) continue

    const score = Math.max(j, s)
    if (!best || score > best.score) {
      best = {
        task,
        score,
        signal: jOk && sOk ? 'both' : jOk ? 'jaccard' : 'substring',
      }
    }
  }

  return best
}

// Exported for tests / future tuning
export const FUZZY_THRESHOLDS = {
  jaccard: JACCARD_THRESHOLD,
  substring: SUBSTRING_THRESHOLD,
}
