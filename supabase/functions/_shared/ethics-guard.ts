// Shared Layer 1 ethics enforcement for every AI-generating Edge Function.
// PRD-41 (LiLa Runtime Ethics Enforcement), SAFETY-BETA-GATE Slice E.
//
// Sibling of `crisis-detection.ts` — same conventions (word-boundary regex,
// case-insensitive, pure detector functions, no I/O in the pattern match
// itself). Tier 0 is the deterministic, code-level layer: the red-team
// suite pins its exact behavior and no data change can silently weaken it.
// The DB-curated Tier-1 exemplar library (platform_intelligence.
// ethics_pattern_library) is where admin flexibility belongs — never move a
// Tier-0 pattern into the DB "for flexibility" (New Convention #4).
//
// Five auto-reject categories (Beta Readiness Gate exit criterion,
// claude/web-sync/MYAIM_GAMEPLAN_v2.2.md:523): force, coercion,
// manipulation, shame_based_control, withholding_affection.
//
// Design asymmetry (load-bearing judgment, PRD §Tier 0): a false NEGATIVE
// here costs nothing — Tier 1 (embedding) and Tier 2 (Haiku confirm) stand
// behind it. A false POSITIVE costs trust. Patterns stay narrow and are
// authored against the PRD's "must catch" examples; oblique/paraphrased
// asks are deliberately left to Tier 1/2, not force-fit into Tier-0 regex.

// NOTE: deliberately NO supabase-js import here. The I/O helpers below
// (enqueueOutputScan, logEthicsRejection) accept an already-instantiated
// client from the caller — this keeps the module free of URL imports so it
// can be imported directly by the vitest red-team suite (tests/redteam/)
// via a plain relative path, matching crisis-detection.ts's zero-import
// shape. Do not add a supabase-js import back to this file; if a helper
// ever needs to construct its own client, put that in a sibling file.
import { CRISIS_KEYWORDS } from './crisis-detection.ts'

export type EthicsCategory =
  | 'force'
  | 'coercion'
  | 'manipulation'
  | 'shame_based_control'
  | 'withholding_affection'

export type EthicsDirection = 'input' | 'output'

export interface EthicsViolationHit {
  hit: true
  category: EthicsCategory
  matchedPattern: string
}
export interface EthicsViolationMiss {
  hit: false
}
export type EthicsViolationResult = EthicsViolationHit | EthicsViolationMiss

// ============================================================
// Rollback lever (PRD-41 §Rollout — "Rollback"). Shadow mode IS the
// rollback state: output actions log with action='logged_only' and produce
// no user-visible retraction. Input reframes are deterministic and go live
// immediately regardless of this constant — they cost nothing, replace no
// content, and carry no risk of hiding a real model response.
//
// NO OFF SWITCH (New Convention #3 / PRD §Five-Role Permission Behavior):
// this constant is the ONLY lever. It is not feature-gated, not
// tier-gated, not per-member, and unaffected by the beta useCanAccess()
// bypass. Flipping it to 'enforcing' is a Phase-4, founder-gated action —
// do not flip it as part of Phase 1/2/3 wiring work.
// ============================================================
export const ENFORCEMENT_MODE: 'shadow' | 'enforcing' = 'enforcing'

// ============================================================
// Tier 0 — synchronous pattern guard ($0)
// ============================================================

// Patterns are authored directly against the PRD §Five Auto-Reject
// Categories "must catch" examples. Each pattern requires a fairly
// specific multi-word combination (facilitation verb + object), not a
// loose single-clause fragment — this is what keeps them from firing on
// the documented "must NOT catch" benign near-neighbors (e.g. "how do I
// correct her WITHOUT embarrassing her in front of her friends" must never
// match a shame_based_control pattern that only requires "embarrass her in
// front of").
const FORCE_PATTERNS: RegExp[] = [
  /\bphysically\s+(force|make|restrain|hold|pin|drag|carry|overpower)\b/i,
  /\bforce\s+(him|her|them)\s+(to|into)\b/i,
  /\bhold\s+(him|her|them|his|her)\s+(down|there|still|in place)\b.{0,20}\buntil\b/i,
  /\bhold\s+(his|her|their)\s+(arm|arms|wrist|hand|shoulders?)\b/i,
  /\bgrab\s+(his|her|their)\s+(arm|arms|wrist|hand|shoulders?)\b/i,
  /\bpin(ning)?\s+(him|her|them|his|her)(\s+down)?\b/i,
  /\brestrain\s+(him|her|them|his|her)\b/i,
  /\boverpower\s+(him|her|them)\b/i,
  /\bblock(ing)?\s+the\s+(door|doorway|exit)\b.{0,15}(can'?t|cannot)\s+leave\b/i,
  /\bgrab\s+(him|her|them|his|her)\s+and\s+(force|drag|make)\b/i,
  /\b(won'?t|don'?t)\s+let\s+(him|her|them|go)\s+(up\s+)?until\b/i,
  /\bmakes?\s+(him|her|them)\s+(comply|obey)\s+by\s+force\b/i,
  /\b(drag|carry)\s+(him|her|them)\s+to\s+(his|her|their)\s+room\b/i,
  /\btrap\s+(him|her|them)\s+in\s+(his|her|their)\s+room\s+until\b/i,
  /\bby\s+force\b.{0,20}\buntil\b/i,
  /\bhold\s+the\s+door\s+shut\b/i,
  /\bwalk\s+(him|her|them)\s+back\b.{0,25}\bby\s+force\b/i,
  /\bblock\s+(his|her|their)\s+path\b/i,
  /\bforce\s+the\s+spoon\b/i,
  /\bpush\s+the\s+door\s+closed\b/i,
]

const COERCION_PATTERNS: RegExp[] = [
  /\bthreaten\s+to\s+(take away|cancel|kick\s+.{0,15}\s+out)\b/i,
  /\bultimatum\b.{0,30}\bno way out\b/i,
  /\bscares?\s+(him|her|them)\s+into\b/i,
  /\bterrif(y|ies)\s+(him|her|them)\s+into\b/i,
  /\b(threat|warning)\s+.{0,20}\bnever\s+.{0,15}\s+again\b/i,
  /\bmakes?\s+(him|her|them)\s+afraid\s+of\s+what\s+happens\s+if\b/i,
  /\bthreat.{0,10}\s+scary\s+enough\s+(that|to)\b/i,
  /\bscary\s+enough\s+to\s+threaten\b/i,
  /\bthreatens?\s+.{0,20}\bunless\s+(he|she|they)\s+(obey|obeys|complies|comply)\b/i,
  /\bgive\s+(him|her|them)\s+an\s+ultimatum\b/i,
  /\bwill\s+never\s+(disobey|sneak out)\s+again\b/i,
  /\bthreat\s+(about|to)\s+(losing|kick)\b/i,
  /\bfall\s+in\s+line\b/i,
  /\bso\s+severe\s+(he|she|they)('ll| will)?\s+never\b/i,
  /\bpermanent\s+loss\s+of\s+everything\b/i,
  /\bthreatens?\s+permanent\s+loss\b/i,
]

const MANIPULATION_PATTERNS: RegExp[] = [
  /\bguilt[- ]trip(ping|s|ped)?\b/i,
  /\bgaslight\b/i,
  /\bmakes?\s+(him|her|them)\s+(think|believe)\s+it\s+was\s+(his|her|their)\s+(idea|fault|choice)\b/i,
  /\bmakes?\s+(him|her|them)\s+doubt\s+(his|her|their)\s+(own\s+)?(memory|perception)\b/i,
  /\bplays?\s+on\s+(his|her|their)\s+(fear|insecurit)/i,
  /\bmakes?\s+(him|her|them)\s+feel\s+(responsible|guilty|obligated)\s+for\b/i,
  /\bsteers?\s+(him|her|them)\s+into\s+believing\b/i,
  /\bmanipulates?\s+(him|her|them)\s+into\b/i,
  /\bmakes?\s+(her|him|them)\s+think\s+(it|the\s+fight)\s+was\s+(her|his|their)\s+idea\b/i,
  /\bengineer(ing)?\s+(the\s+conversation|her|his|their)\s+.{0,20}(doubt|believe)/i,
  /\bguide\s+(her|him|them)\s+toward\s+guilt\b/i,
]

const SHAME_PATTERNS: RegExp[] = [
  /\bpost\s+(his|her|their)\s+grades?\s+(on|to)\s+the\s+fridge\b/i,
  /\bcall(s|ing)?\s+(him|her|them)\s+out\b/i,
  /\bpublicly\s+call(s|ing)?\s+(him|her|them)\s+out\b/i,
  /\bmakes?\s+(him|her|them)\s+feel\s+(ashamed|humiliated|like a failure)\b/i,
  /\bexposes?\s+(his|her|their)\s+mistake\b/i,
  /\bhumiliat(e|es|ing)\s+(him|her|them)\s+(publicly|in front of (his|her|their) friends)\b/i,
  /\bshames?\s+(him|her|them)\s+(publicly|into|at dinner)\b/i,
  /\bembarrass(es)?\s+(him|her|them)\s+(enough|in front of his friends so|so (he|she|they))\b/i,
  /\bmake an example of\s+(him|her|them)\s+publicly\b/i,
  /\bhumiliates?\s+(him|her|them)\s+into\b/i,
]

const WITHHOLDING_AFFECTION_PATTERNS: RegExp[] = [
  /\bsilent treatment\b/i,
  /\bwon'?t\s+(hug|talk to|speak to)\s+(him|her|them)\s+(again\s+)?until\b/i,
  /\bwithhold(ing)?\s+(affection|warmth|love)\b/i,
  /\bwithdraws?\s+(all\s+)?affection\s+until\b/i,
  /\bfreezes?\s+(him|her|them)\s+out\s+until\b/i,
  /\blove\s+(is|feels?)\s+conditional\s+on\b/i,
  /\bcondition(ing)?\s+(my|your)?\s*(affection|hug|warmth|love)\s+on\b/i,
  /\bearn\s+(my|your)\s+(warmth|love)\s+back\b/i,
  /\bignores?\s+(him|her|them)\s+completely\s+until\b/i,
  /\bstay\s+(cold|distant)\b.{0,20}\buntil\b/i,
]

const PATTERN_TABLE: Record<EthicsCategory, RegExp[]> = {
  force: FORCE_PATTERNS,
  coercion: COERCION_PATTERNS,
  manipulation: MANIPULATION_PATTERNS,
  shame_based_control: SHAME_PATTERNS,
  withholding_affection: WITHHOLDING_AFFECTION_PATTERNS,
}

const CATEGORY_ORDER: EthicsCategory[] = [
  'force',
  'coercion',
  'manipulation',
  'shame_based_control',
  'withholding_affection',
]

/**
 * Synchronous, $0 pattern check. Runs on both directions:
 *  - 'input': the user's message, immediately after the detectCrisis gate.
 *  - 'output': the complete assistant text, before delivery (non-streaming)
 *    or on fullText at stream end (streaming).
 * Same pattern table serves both directions — the phrase shapes ("physically
 * force him to", "guilt-trip", "silent treatment", ...) are equally
 * diagnostic of a request FOR the weapon and generated content that IS the
 * weapon. Crisis always wins if both match — callers run detectCrisis first.
 */
export function detectEthicsViolation(text: string, _direction: EthicsDirection): EthicsViolationResult {
  if (!text) return { hit: false }
  for (const category of CATEGORY_ORDER) {
    for (const pattern of PATTERN_TABLE[category]) {
      const match = text.match(pattern)
      if (match) {
        return { hit: true, category, matchedPattern: pattern.source }
      }
    }
  }
  return { hit: false }
}

/**
 * Tier-0 output rider: crisis-adjacent GENERATED content. Closes Convention
 * #7's output-direction hole — detectCrisis() only ever ran on user input.
 * Reuses CRISIS_KEYWORDS verbatim (owned by crisis-detection.ts) rather than
 * duplicating the list.
 */
export function detectCrisisInOutput(text: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return CRISIS_KEYWORDS.some(k => {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`).test(lower)
  })
}

// ============================================================
// Reframe copy (Tier-0 input hit) — founder-approved verbatim, PRD-41 §UX.
// Shape: validate the underlying need → redirect → open door. Never a
// lecture. No emoji (NO_EMOJI_BLOCK governs model output; this is authored
// copy and is written emoji-free by hand for the same reason).
// ============================================================
export const ETHICS_REFRAME_RESPONSES: Record<EthicsCategory, string> = {
  force:
    "It sounds like you've hit the point where nothing's working and you just need this to happen. Forcing it usually costs more than it wins — want to look at what's underneath the standoff and find something that actually moves it?",
  coercion:
    "I can hear how much you need this to change. Threats tend to get short-term compliance and long-term distance — I'd rather help you find a consequence that teaches instead of scares. Want to work on that together?",
  manipulation:
    "It sounds like you really need to be heard here, and that matters. I won't help steer someone without their awareness — but I'd love to help you say the true thing directly, in a way they can actually take in. Want to try that?",
  shame_based_control:
    "I can tell this behavior has you at the end of your rope. Shame changes behavior by making a person feel small — and it lingers long after the behavior's forgotten. Let's find something that corrects the behavior and keeps their dignity. Want to start there?",
  withholding_affection:
    "It sounds like you're hurt and you want them to feel the weight of it. Pulling back warmth does make it felt — and it also teaches that love has conditions. Can I help you show the weight of it in words instead?",
}

export function buildReframeMessage(category: EthicsCategory): string {
  return ETHICS_REFRAME_RESPONSES[category]
}

// ============================================================
// Retraction notice (Tier-0/1/2 output hit, enforcing mode only).
// ============================================================
export const RETRACTION_NOTICE =
  "That last reply wasn't advice I should have given — the approach it suggested could hurt more than it helps. Let me try again, or ask me a different way."

export const RETRACTION_NOTICE_KID =
  "LiLa took that answer back — it wasn't a good one. Ask me again!"

/**
 * Plain-language category labels for the mom-facing notification + LiLa
 * Response Log. NEVER the internal enum strings, never clinical vocabulary
 * (context-tone rule applies to our own UI too — PRD §UX). `crisis_output`
 * is deliberately absent: the crisis-output rider category never produces a
 * mom notification through this path (crisis surfaces are handled by the
 * global crisis override, Convention #7).
 */
export const ETHICS_CATEGORY_PLAIN_LABEL: Record<EthicsCategory, string> = {
  force: 'a pressure-based ask',
  coercion: 'a threat-based ask',
  manipulation: 'a guilt-based framing',
  shame_based_control: 'a shame-based framing',
  withholding_affection: 'affection used as leverage',
}

// ============================================================
// Enforcing-mode side-effect planner (Phase 2 fix-up #2).
//
// Shadow mode gates ALL user-visible output actions — not just the
// retraction card: the message-metadata annotation AND the mom
// notification are equally gated behind ENFORCEMENT_MODE==='enforcing'.
// In shadow mode a confirmed rejection writes ONLY the
// lila_ethics_rejections row (action='logged_only'); nothing mom or the
// kid ever sees.
//
// This is a PURE function (no I/O, no supabase client) so the red-team
// vitest can prove the enforcing behavior deterministically WITHOUT
// flipping the shipped ENFORCEMENT_MODE constant or deploying enforcing
// mode. processRow() in validate-ai-output calls it and applies whatever
// non-null writes it returns; the vitest calls it with mode='enforcing'
// and asserts the exact annotation + notification shapes.
//
// Notification is CHILD-SURFACE-ONLY (isKid). Input reframes never notify
// regardless of mode — that path never calls this function.
// ============================================================

export interface EnforcingSideEffectInput {
  mode: 'shadow' | 'enforcing'
  category: EthicsCategory
  tier: 0 | 1 | 2
  rejectionId: string | null
  isKid: boolean
  surface: string
  familyId: string
  /** Resolved by the caller from DB lookups — the planner stays pure. */
  momId: string | null
  kidName: string | null
  /** Present only when the assistant output was persisted (utility tools
   *  have no message row → no annotation). */
  messageTable?: string | null
  messageId?: string | null
}

export interface PlannedAnnotation {
  table: string
  messageId: string
  metadata: {
    ethics_retraction: {
      category: EthicsCategory
      tier: 0 | 1 | 2
      retracted_at: string
      rejection_id: string | null
      notice: string
    }
  }
}

export interface PlannedNotification {
  family_id: string
  recipient_member_id: string
  notification_type: string
  category: 'lila'
  title: string
  body: string
  priority: 'normal'
}

export interface EnforcingSideEffects {
  annotation: PlannedAnnotation | null
  notification: PlannedNotification | null
}

export function planEnforcingSideEffects(input: EnforcingSideEffectInput): EnforcingSideEffects {
  // Shadow mode (shipped state) — nothing user-visible. This is the whole
  // point of fix-up #2: the annotation and notification are gated here,
  // exactly like the retraction card, not just the card.
  if (input.mode !== 'enforcing') {
    return { annotation: null, notification: null }
  }

  const notice = input.isKid ? RETRACTION_NOTICE_KID : RETRACTION_NOTICE

  const annotation: PlannedAnnotation | null =
    input.messageTable && input.messageId
      ? {
          table: input.messageTable,
          messageId: input.messageId,
          metadata: {
            ethics_retraction: {
              category: input.category,
              tier: input.tier,
              retracted_at: new Date().toISOString(),
              rejection_id: input.rejectionId,
              notice,
            },
          },
        }
      : null

  // Notification: child surfaces only, and only when we resolved a mom to
  // send it to. Never bypasses DND (priority='normal', category='lila').
  const notification: PlannedNotification | null =
    input.isKid && input.momId
      ? {
          family_id: input.familyId,
          recipient_member_id: input.momId,
          notification_type: 'lila_ethics_retraction',
          category: 'lila',
          title: 'LiLa took back a response',
          body: `In ${input.kidName ?? 'a family member'}'s ${input.surface} conversation just now (${ETHICS_CATEGORY_PLAIN_LABEL[input.category]}). See the LiLa Response Log for details.`,
          priority: 'normal',
        }
      : null

  return { annotation, notification }
}

// ============================================================
// Enqueue / log helpers — never throw (Convention #199 discipline: a
// failure here must never break the user's conversation).
// ============================================================

export interface EthicsContext {
  familyId: string
  memberId?: string | null
  surface: string
  modeKey?: string | null
  conversationId?: string | null
  messageTable?: 'lila_messages' | 'bookshelf_discussion_messages' | 'messages' | null
  messageId?: string | null
  isSafeHarbor?: boolean
}

/**
 * Stamps member_is_under_13 at enqueue time (PRD-40 aggregation exclusion —
 * candidate harvesting must never draw from an under-13 member's surface).
 * Derived from date_of_birth when present, falling back to the age column.
 * Never throws — defaults to false (excludes nothing extra; the harvest
 * query is the actual gate, this is just the stamp).
 */
async function computeIsUnder13(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  memberId: string | null | undefined,
): Promise<boolean> {
  if (!memberId) return false
  try {
    const { data } = await supabase
      .from('family_members')
      .select('date_of_birth, age')
      .eq('id', memberId)
      .single()
    if (!data) return false
    if (data.date_of_birth) {
      const dob = new Date(data.date_of_birth as string)
      if (!Number.isNaN(dob.getTime())) {
        const now = new Date()
        let years = now.getFullYear() - dob.getFullYear()
        const monthDiff = now.getMonth() - dob.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) years--
        return years < 13
      }
    }
    if (typeof data.age === 'number') return data.age < 13
    return false
  } catch {
    return false
  }
}

/**
 * Enqueues a row in ai_output_scans for every assistant output on every
 * surface (Tier-0-clean outputs too — Tier 1 exists precisely to catch
 * what patterns can't). Fire-and-forget shape: caller may `await` it
 * (recommended, so the scan lands before [DONE]) but it never rejects.
 */
export async function enqueueOutputScan(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  ctx: EthicsContext & { content: string },
): Promise<void> {
  try {
    const memberIsUnder13 = await computeIsUnder13(supabase, ctx.memberId)
    await supabase.from('ai_output_scans').insert({
      family_id: ctx.familyId,
      member_id: ctx.memberId ?? null,
      surface: ctx.surface,
      mode_key: ctx.modeKey ?? null,
      conversation_id: ctx.conversationId ?? null,
      message_table: ctx.messageTable ?? null,
      message_id: ctx.messageId ?? null,
      content: ctx.content,
      is_safe_harbor: ctx.isSafeHarbor ?? false,
      member_is_under_13: memberIsUnder13,
      status: 'pending',
    })
  } catch (err) {
    console.warn('enqueueOutputScan failed (non-fatal):', (err as Error)?.message)
  }
}

/**
 * Writes a lila_ethics_rejections row. Never throws. `action='logged_only'`
 * in shadow mode for output-direction hits (Tier 0/1/2) — input-direction
 * reframes are always 'reframed' regardless of ENFORCEMENT_MODE (they are
 * deterministic and carry no retraction risk).
 */
export async function logEthicsRejection(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  params: EthicsContext & {
    direction: EthicsDirection
    tier: 0 | 1 | 2
    category: EthicsCategory | 'crisis_output'
    action: 'reframed' | 'replaced' | 'retracted' | 'logged_only'
    matchedPattern?: string | null
    tier1Similarity?: number | null
    tier2Confidence?: number | null
    tier2Reasoning?: string | null
    contentExcerpt?: string | null
    scanId?: string | null
  },
): Promise<void> {
  try {
    await supabase.from('lila_ethics_rejections').insert({
      family_id: params.familyId,
      member_id: params.memberId ?? null,
      surface: params.surface,
      mode_key: params.modeKey ?? null,
      conversation_id: params.conversationId ?? null,
      message_table: params.messageTable ?? null,
      message_id: params.messageId ?? null,
      scan_id: params.scanId ?? null,
      direction: params.direction,
      tier: params.tier,
      category: params.category,
      action: params.action,
      matched_pattern: params.matchedPattern ?? null,
      tier1_similarity: params.tier1Similarity ?? null,
      tier2_confidence: params.tier2Confidence ?? null,
      tier2_reasoning: params.tier2Reasoning ?? null,
      content_excerpt: params.contentExcerpt ? params.contentExcerpt.slice(0, 500) : null,
      is_safe_harbor: params.isSafeHarbor ?? false,
    })
  } catch (err) {
    console.warn('logEthicsRejection failed (non-fatal):', (err as Error)?.message)
  }
}

// ============================================================
// Shared streaming-surface wiring helpers (Phase 2). Keep each of the ~14
// conversation surfaces down to a couple of added lines and identical
// behavior — the "same shape as lila-chat" the rollout requires.
// ============================================================

/**
 * Output-side Tier-0 scan for a completed assistant message. Runs
 * detectEthicsViolation(fullText,'output') plus the crisis-output rider,
 * logs a rejection row on a hit (action='logged_only' in shadow mode,
 * 'retracted' in enforcing), and returns:
 *   - `retracted`: whether a hit occurred (for logging/telemetry).
 *   - `emitRetractionEvent`: true ONLY in enforcing mode on a hit — the
 *     caller emits `{type:'ethics_retraction', category}` on its SSE stream.
 *   - `retractionMetadata`: non-null ONLY in enforcing mode on a hit —
 *     the caller merges it into the assistant message's metadata at insert
 *     time so a reload renders the retraction card (the reliable render
 *     path; the SSE event is the instant-in-flight nicety).
 * In shadow mode (shipped state) both are inert — the message persists
 * unchanged and only the logged_only rejection row is written. NEVER
 * throws. `enqueueOutputScan` is always called separately by the caller
 * (with the persisted message id), including for Tier-0-clean output.
 */
export interface StreamedOutputScanResult {
  retracted: boolean
  category: EthicsCategory | 'crisis_output' | null
  emitRetractionEvent: boolean
  retractionMetadata: { ethics_retraction: { category: EthicsCategory | 'crisis_output'; tier: 0; retracted_at: string; rejection_id: null } } | null
}

export async function scanStreamedOutput(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  fullText: string,
  ctx: EthicsContext,
): Promise<StreamedOutputScanResult> {
  const hit = detectEthicsViolation(fullText, 'output')
  const crisisHit = !hit.hit && detectCrisisInOutput(fullText)
  const category: EthicsCategory | 'crisis_output' | null = hit.hit
    ? hit.category
    : crisisHit
      ? 'crisis_output'
      : null

  if (!category) {
    return { retracted: false, category: null, emitRetractionEvent: false, retractionMetadata: null }
  }

  const enforcing = ENFORCEMENT_MODE === 'enforcing'
  await logEthicsRejection(supabase, {
    ...ctx,
    direction: 'output',
    tier: 0,
    category,
    action: enforcing ? 'retracted' : 'logged_only',
    matchedPattern: hit.hit ? hit.matchedPattern : 'crisis_keyword',
    contentExcerpt: fullText,
  })

  return {
    retracted: true,
    category,
    emitRetractionEvent: enforcing,
    retractionMetadata: enforcing
      ? { ethics_retraction: { category, tier: 0, retracted_at: new Date().toISOString(), rejection_id: null } }
      : null,
  }
}

/**
 * Input-side Tier-0 pre-flight for a conversation surface that persists to
 * `lila_messages` and mirrors its crisis path with a JSON response (the
 * shape ToolConversationModal's streamToolChat already handles). Runs
 * detectEthicsViolation(content,'input'); on a hit it logs the reframe
 * rejection, persists the user message + the reframe assistant message, and
 * returns the reframe text. Returns null on a miss (caller proceeds to the
 * model). Callers that DON'T persist to lila_messages (translator, board
 * per-advisor) handle the input check inline instead. NEVER throws for the
 * logging/persistence — a failure there still returns the reframe so the
 * user is never left without a response.
 */
export async function handleEthicsInputReframe(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  content: string,
  ctx: EthicsContext,
): Promise<{ reframed: true; category: EthicsCategory; response: string } | null> {
  const hit = detectEthicsViolation(content, 'input')
  if (!hit.hit) return null

  const reframe = buildReframeMessage(hit.category)
  await logEthicsRejection(supabase, {
    ...ctx,
    messageTable: 'lila_messages',
    direction: 'input',
    tier: 0,
    category: hit.category,
    action: 'reframed',
    matchedPattern: hit.matchedPattern,
    contentExcerpt: content,
  })
  try {
    await supabase.from('lila_messages').insert([
      { conversation_id: ctx.conversationId, role: 'user', content, metadata: {} },
      { conversation_id: ctx.conversationId, role: 'assistant', content: reframe, metadata: { source: 'ethics_reframe', ethics_category: hit.category } },
    ])
  } catch (err) {
    console.warn('handleEthicsInputReframe persist failed (non-fatal):', (err as Error)?.message)
  }
  return { reframed: true, category: hit.category, response: reframe }
}

// ============================================================
// Category-2 UTILITY-tool wiring helpers (Phase 3). Utility tools return
// structured payloads (task steps, calendar events, classifications) and do
// NOT persist a conversation, so they don't use handleEthicsInputReframe /
// scanStreamedOutput. Instead:
//   - Input: on a hit, the tool DECLINES (never calls the model) and returns
//     a surface-appropriate refusal carrying the reframe text.
//   - Output: on a hit, the payload is REPLACED with a safe refusal — never
//     a half-scrubbed payload (PRD §Tier 0). In shadow mode (shipped) the
//     payload is unchanged and only a logged_only rejection is written.
//   - Q: the caller always enqueueOutputScan()s the generated output text
//     (message_table/message_id null — utility outputs have no message row).
// ============================================================

/**
 * Input pre-flight for a utility tool. Logs the reframe rejection on a hit
 * (never persists a message — utility tools have no conversation). Returns
 * the reframe text so the caller can decline with a surface-appropriate
 * response. `surface` + family/member come from `ctx`. NEVER throws.
 */
export async function scanUtilityInput(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  text: string,
  ctx: EthicsContext,
): Promise<{ blocked: true; category: EthicsCategory; reframe: string } | null> {
  const hit = detectEthicsViolation(text, 'input')
  if (!hit.hit) return null
  await logEthicsRejection(supabase, {
    ...ctx,
    direction: 'input',
    tier: 0,
    category: hit.category,
    action: 'reframed',
    matchedPattern: hit.matchedPattern,
    contentExcerpt: text,
  })
  return { blocked: true, category: hit.category, reframe: buildReframeMessage(hit.category) }
}

/**
 * Output scan for a utility tool's generated text. Logs on a hit
 * (action='replaced' in enforcing mode, 'logged_only' in shadow). Returns
 * `replaced: true` ONLY in enforcing mode on a hit — the caller then returns
 * its safe structured refusal instead of the payload. Does NOT enqueue —
 * the caller calls enqueueOutputScan() separately (always, on the original
 * output text). NEVER throws.
 */
export async function scanUtilityOutput(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  text: string,
  ctx: EthicsContext,
): Promise<{ replaced: boolean; category: EthicsCategory | 'crisis_output' | null }> {
  const hit = detectEthicsViolation(text, 'output')
  const crisisHit = !hit.hit && detectCrisisInOutput(text)
  const category: EthicsCategory | 'crisis_output' | null = hit.hit
    ? hit.category
    : crisisHit
      ? 'crisis_output'
      : null
  if (!category) return { replaced: false, category: null }

  const enforcing = ENFORCEMENT_MODE === 'enforcing'
  await logEthicsRejection(supabase, {
    ...ctx,
    direction: 'output',
    tier: 0,
    category,
    action: enforcing ? 'replaced' : 'logged_only',
    matchedPattern: hit.hit ? hit.matchedPattern : 'crisis_keyword',
    contentExcerpt: text,
  })
  return { replaced: enforcing, category }
}
