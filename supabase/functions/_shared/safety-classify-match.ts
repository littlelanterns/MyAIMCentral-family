// PRD-30 Safety Monitoring — shared pure logic for the safety-classify sweep.
// SAFETY-BETA-GATE lineage: sibling of crisis-detection.ts / ethics-guard.ts.
// Same conventions — word-boundary regex, case-insensitive, pure functions,
// no I/O, zero URL imports (so vitest can import this directly without a
// Deno runtime — see tests/safety-classify-match.test.ts).
//
// PRD-30 watches the MEMBER's input (user role) + whole-conversation
// patterns for member-wellbeing concerns. This is disjoint from PRD-41's
// ethics-guard.ts, which watches LiLa's OUTPUT for the five facilitation
// categories. Nothing here scans the same message twice for overlapping
// purposes (feature decision file §J1).

// ============================================================
// Categories, severities, sensitivities
// ============================================================

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
export type DetectionLayer = 'keyword' | 'classification' | 'both'
export type FlagStatus = 'new' | 'acknowledged' | 'dismissed'

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

// Key PRD Decision #3: three categories are ALWAYS High at the
// application/pipeline layer, regardless of any stored DB value. The
// pipeline ignores the sensitivity column for these three entirely — this
// is enforced at every call site that resolves effective sensitivity below,
// never left to a DB CHECK constraint (a parent must never be able to lower
// these, and the enforcement must survive a tampered row).
export const LOCKED_CATEGORIES: SafetyCategory[] = ['self_harm', 'abuse', 'sexual_predatory']

export function isLockedCategory(category: SafetyCategory): boolean {
  return (LOCKED_CATEGORIES as string[]).includes(category)
}

// Plain-language display labels — PRD §Trigger Categories table verbatim.
// Mom's flag detail/history/notifications use these, NEVER the raw enum
// string (feature decision file §J2/D2, mirroring the PRD-41 log precedent).
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

// Category descriptions — feed the content-free conversation-starter Haiku
// prompt (category + age + severity ONLY, never conversation content —
// feature decision file §J2). PRD §Trigger Categories "Description" column.
export const CATEGORY_DESCRIPTION: Record<SafetyCategory, string> = {
  self_harm: 'language about hurting oneself, suicidal thoughts, or self-harm',
  abuse: 'possible physical, emotional, or sexual abuse',
  sexual_predatory: 'sexual content or predatory/grooming patterns',
  substance: 'alcohol, drug use, or peer pressure around substances',
  eating_disorder: 'restriction, purging, body dysmorphia, or disordered eating language',
  bullying: 'being bullied, cyberbullying, or social exclusion',
  profanity: 'excessive profanity or aggressive language',
  other: 'isolation, withdrawal, persistent hopelessness, or a major behavioral change',
}

const SEVERITY_RANK: Record<SafetySeverity, number> = { concern: 1, warning: 2, critical: 3 }

export function severityRank(s: SafetySeverity): number {
  return SEVERITY_RANK[s]
}

export function maxSeverity(a: SafetySeverity, b: SafetySeverity): SafetySeverity {
  return severityRank(a) >= severityRank(b) ? a : b
}

export function minSeverity(a: SafetySeverity, b: SafetySeverity): SafetySeverity {
  return severityRank(a) <= severityRank(b) ? a : b
}

// ============================================================
// Sensitivity resolution (Key PRD Decision #9, PRD Screen 2 defaults)
// ============================================================

/**
 * Shell-type default sensitivity for ADJUSTABLE categories (locked
 * categories never reach this — callers check isLockedCategory first).
 * Play/Guided: every adjustable category defaults High. Independent teens
 * and opted-in adults: every adjustable category defaults Medium, except
 * profanity which defaults Low (PRD §Screen 2 "Key behaviors" — the PRD's
 * bullet list names Substance/Bullying/Other explicitly for teens and
 * "all adjustable categories" for adults; eating_disorder is not called out
 * separately for teens, so this treats teens identically to opted-in
 * adults — the same shape, same numbers. Documented judgment call, not an
 * ambiguity left unresolved.)
 */
export function resolveDefaultSensitivity(
  category: SafetyCategory,
  dashboardMode: string | null,
): SafetySensitivity {
  if (isLockedCategory(category)) return 'high'
  if (dashboardMode === 'play' || dashboardMode === 'guided') return 'high'
  // independent teens + opted-in adults (dashboardMode null/'personal')
  return category === 'profanity' ? 'low' : 'medium'
}

/**
 * Effective sensitivity for a member+category: locked categories are ALWAYS
 * 'high' regardless of any stored row (enforced here, not just at write
 * time — Key PRD Decision #3). Otherwise an explicit
 * safety_sensitivity_configs row wins; absent that, the shell-type default.
 */
export function effectiveSensitivity(
  category: SafetyCategory,
  dashboardMode: string | null,
  explicitSensitivity: SafetySensitivity | null | undefined,
): SafetySensitivity {
  if (isLockedCategory(category)) return 'high'
  if (explicitSensitivity) return explicitSensitivity
  return resolveDefaultSensitivity(category, dashboardMode)
}

/**
 * Sensitivity filtering (Key PRD Decision #9): "If sensitivity=Low and
 * severity=Concern, the match is logged but no flag is generated. Medium
 * and High sensitivity both generate flags from keyword matches." Read
 * literally: Low suppresses Concern-severity hits; Medium and High do not
 * suppress anything. (Documented judgment call — the PRD's further clause
 * "Medium just requires a higher base severity threshold for the less
 * critical categories" is treated as descriptive of how Medium's DEFAULT
 * category assignment already skews toward Warning/Critical base
 * severities, achieved via resolveDefaultSensitivity's category defaults,
 * not as an additional per-message runtime filter here.)
 */
export function passesSensitivityThreshold(severity: SafetySeverity, sensitivity: SafetySensitivity): boolean {
  if (sensitivity === 'low') return severity !== 'concern'
  return true
}

// ============================================================
// Layer 1 — keyword/phrase matching
// ============================================================

export interface SafetyKeywordRow {
  keyword: string
  category: SafetyCategory
  base_severity: SafetySeverity
  is_phrase?: boolean
}

export interface SafetyKeywordMatch {
  keyword: string
  category: SafetyCategory
  base_severity: SafetySeverity
}

/**
 * Case-insensitive, word-boundary matching (crisis-detection.ts pattern).
 * Negation does NOT suppress a match (Key PRD Decision #5 — "I don't want
 * to die" still triggers; better to over-flag than under-flag for critical
 * categories). Phrase entries (multi-word, is_phrase=true) match the same
 * way — \b at each end of the escaped string handles both single words and
 * phrases correctly since \b anchors on the phrase's first/last characters.
 */
export function matchSafetyKeywords(text: string, keywords: SafetyKeywordRow[]): SafetyKeywordMatch[] {
  if (!text) return []
  const lower = text.toLowerCase()
  const matches: SafetyKeywordMatch[] = []
  for (const kw of keywords) {
    const escaped = kw.keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`\\b${escaped}\\b`)
    if (pattern.test(lower)) {
      matches.push({ keyword: kw.keyword, category: kw.category, base_severity: kw.base_severity })
    }
  }
  return matches
}

// ============================================================
// Flag generation — dedup (Key PRD Decision #6) + alert-fatigue
// consolidation (Key PRD Decision #7)
// ============================================================

export interface ExistingFlagSummary {
  id: string
  severity: SafetySeverity
  created_at: string
}

export type DedupDecision =
  | { action: 'insert' }
  | { action: 'update_context'; targetId: string }
  | { action: 'insert_escalation'; supersedes: string }
  | { action: 'consolidate'; targetId: string }

/**
 * `existingFlagsSameCategory24h` must already be filtered to the same
 * family + flagged member + category + created_at within the last 24h,
 * sorted most-recent-first. Decides what a new detection should do:
 *   - no existing flag -> insert a new one
 *   - >=5 existing in the window -> alert-fatigue consolidation onto the
 *     most recent (Key PRD Decision #7)
 *   - new severity higher than the most recent existing -> a genuinely new
 *     row is created (Key PRD Decision #6, "a new flag is created")
 *   - new severity same-or-lower -> absorbed into the existing row's
 *     context fields, no new row (Key PRD Decision #6)
 */
export function decideDedup(
  newSeverity: SafetySeverity,
  existingFlagsSameCategory24h: ExistingFlagSummary[],
): DedupDecision {
  if (existingFlagsSameCategory24h.length === 0) return { action: 'insert' }
  if (existingFlagsSameCategory24h.length >= 5) {
    return { action: 'consolidate', targetId: existingFlagsSameCategory24h[0].id }
  }
  const mostRecent = existingFlagsSameCategory24h[0]
  if (severityRank(newSeverity) > severityRank(mostRecent.severity)) {
    return { action: 'insert_escalation', supersedes: mostRecent.id }
  }
  return { action: 'update_context', targetId: mostRecent.id }
}

// ============================================================
// Notification consolidation (Key PRD Decision — "Same Conversation
// Triggers Multiple Categories" edge case + J3/D3 severity->priority table)
// ============================================================

export interface ConsolidationFlagSummary {
  category: SafetyCategory
  severity: SafetySeverity
}

/**
 * D3 (feature decision file §J3): Critical/Warning bypass DND (priority
 * 'high'); Concern-only records quietly (priority 'normal'). Refines
 * Convention #143's blanket "safety alerts bypass DND" to the severity
 * tier, matching PRD-41's ethics-retraction pole on the other end.
 */
export function severityToPriority(highestSeverity: SafetySeverity): 'high' | 'normal' {
  return highestSeverity === 'critical' || highestSeverity === 'warning' ? 'high' : 'normal'
}

/**
 * PRD §Edge Cases "Same Conversation Triggers Multiple Categories":
 * "Safety alert for Jake: Substance Use (Warning), Bullying (Concern)."
 * One notification per conversation, highest severity first is NOT
 * required by the example — it lists in encounter order — but this sorts
 * by severity (most severe first) for scan-ability, a reasonable
 * presentation choice within the PRD's stated shape.
 */
export function buildConsolidatedNotificationBody(memberName: string, flags: ConsolidationFlagSummary[]): {
  title: string
  body: string
  highestSeverity: SafetySeverity
} {
  const sorted = [...flags].sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
  const highestSeverity = sorted.reduce<SafetySeverity>((acc, f) => maxSeverity(acc, f.severity), 'concern')
  const parts = sorted.map(f => `${CATEGORY_DISPLAY_LABEL[f.category]} (${capitalize(f.severity)})`)
  return {
    title: `Safety alert for ${memberName}`,
    body: `Safety alert for ${memberName}: ${parts.join(', ')}.`,
    highestSeverity,
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ============================================================
// Weekly pattern digest — pure helpers (SM-C, Build Item 13).
// Narrative generation (Haiku) is content-free by construction (J2/D2):
// it only ever receives category counts + severity breakdown + trend,
// never conversation content. `safety_flags.is_safe_harbor=true` rows are
// EXCLUDED from all counts here (J5 — "excluded from pattern summaries and
// any future aggregation").
// ============================================================

export type SummaryTrend = 'increasing' | 'decreasing' | 'stable'

export const ZERO_FLAG_NARRATIVE = 'No concerns detected this week.'

/** Pure — PRD §Edge Cases "No Flags Generated": zero-flag weeks never call Haiku. */
export function computeTrend(currentTotal: number, priorTotal: number): SummaryTrend {
  if (currentTotal > priorTotal) return 'increasing'
  if (currentTotal < priorTotal) return 'decreasing'
  return 'stable'
}

export interface WeeklySummaryData {
  category_counts: Record<SafetyCategory, number>
  total_flags: number
  severity_breakdown: Record<SafetySeverity, number>
  trend: SummaryTrend
}

/** Pure — builds the summary_data JSONB shape from a flat list of (category, severity) flags. */
export function buildWeeklySummaryData(
  flags: { category: SafetyCategory; severity: SafetySeverity }[],
  priorTotal: number,
): WeeklySummaryData {
  const category_counts = Object.fromEntries(CATEGORY_LIST.map(c => [c, 0])) as Record<SafetyCategory, number>
  const severity_breakdown: Record<SafetySeverity, number> = { concern: 0, warning: 0, critical: 0 }
  for (const f of flags) {
    category_counts[f.category] += 1
    severity_breakdown[f.severity] += 1
  }
  return {
    category_counts,
    total_flags: flags.length,
    severity_breakdown,
    trend: computeTrend(flags.length, priorTotal),
  }
}

/**
 * Pure — the UTC offset (in minutes, positive = ahead of UTC) a given IANA
 * timezone carries AT the supplied instant. Handles DST correctly for that
 * instant; a single week's digest boundary using one offset for the whole
 * window is an accepted approximation (this is a trend narrative, not a
 * DATE-column write — Convention #257's precision concern is elsewhere).
 */
export function timezoneOffsetMinutesAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(instant)
  const map: Record<string, string> = {}
  for (const p of parts) map[p.type] = p.value
  const asUtcMs = Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour), Number(map.minute), Number(map.second),
  )
  return (asUtcMs - instant.getTime()) / 60000
}

/**
 * Pure — [start, end] UTC ISO bounds for a family-local calendar date
 * (YYYY-MM-DD), inclusive of the full local day. `offsetMinutesAtNow` is
 * `timezoneOffsetMinutesAt(now, timeZone)`, passed in so callers compute it
 * once per family per invocation.
 */
export function familyLocalDayBoundsUtc(dateStr: string, offsetMinutesAtNow: number): { startUtc: string; endUtc: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - offsetMinutesAtNow * 60000
  const endUtcMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999) - offsetMinutesAtNow * 60000
  return { startUtc: new Date(startUtcMs).toISOString(), endUtc: new Date(endUtcMs).toISOString() }
}

/** Pure — formats a family-local date (YYYY-MM-DD) N days earlier/later, no Date-string parsing pitfalls.
 *  Formatted via getUTC accessors on a UTC-constructed date: pure calendar arithmetic on the
 *  input date, no device-clock or timezone dependency (and no Convention #257 pattern). */
export function shiftLocalDate(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + deltaDays))
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(shifted.getUTCDate()).padStart(2, '0')
  return `${shifted.getUTCFullYear()}-${mm}-${dd}`
}

// ============================================================
// Context snippet construction (Screen 3 — max 5 messages, default 3)
// ============================================================

export interface SnippetMessage {
  role: string
  content: string
  message_id: string
}

/**
 * Layer 1 default: the flagged message + up to 2 messages before it
 * (PRD §Screen 3 "the flagged message + 2 messages before it"). `allMessages`
 * must be in chronological (ascending) order; `flaggedIndex` is the index
 * of the flagged message within it. The snippet NEVER extends past the
 * flagged message itself (end is pinned to flaggedIndex+1) — it must not
 * include messages that happened after the flag.
 */
export function buildContextSnippetFromIndex(
  allMessages: SnippetMessage[],
  flaggedIndex: number,
  maxMessages = 5,
): SnippetMessage[] {
  const end = Math.min(allMessages.length, flaggedIndex + 1)
  const desiredStart = Math.max(0, flaggedIndex - 2)
  const start = Math.max(desiredStart, end - maxMessages)
  return allMessages.slice(start, end)
}

/**
 * Layer 2: Haiku returns key_message_indices. Builds a snippet spanning the
 * lowest-to-highest flagged index plus one message of leading context,
 * capped at maxMessages (Screen 3's "max 5 messages" ceiling). Like the
 * Layer 1 variant, the snippet never extends past the highest key index.
 */
export function buildContextSnippetFromIndices(
  allMessages: SnippetMessage[],
  keyIndices: number[],
  maxMessages = 5,
): SnippetMessage[] {
  if (keyIndices.length === 0) return []
  const minIdx = Math.min(...keyIndices)
  const maxIdx = Math.max(...keyIndices)
  const end = Math.min(allMessages.length, maxIdx + 1)
  const desiredStart = Math.max(0, minIdx - 1)
  const start = Math.max(desiredStart, end - maxMessages)
  return allMessages.slice(start, end)
}
