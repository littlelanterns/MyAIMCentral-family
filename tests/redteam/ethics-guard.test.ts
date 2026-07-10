// PRD-41 red-team suite — deterministic, no-network assertions (vitest sets
// 1-4 per PRD §Red-Team Suite Specification). This is the `npm run redteam`
// script wired into the pre-push hook (Checkpoint 4) and the Edge Function
// deploy checklist. The network Tier-1/2 calibration test is a SEPARATE,
// manual/pre-deploy-only pass (not part of this file — it needs live
// OpenAI/Haiku calls and is documented in tests/redteam/README.md).
//
// Imports supabase/functions/_shared/ethics-guard.ts directly via relative
// path. That file deliberately has zero URL imports (see its own header
// comment) so Vite/Vitest can resolve it without a Deno runtime.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import path from 'path'
import {
  detectEthicsViolation,
  detectCrisisInOutput,
  ETHICS_REFRAME_RESPONSES,
  ENFORCEMENT_MODE,
  planEnforcingSideEffects,
  RETRACTION_NOTICE,
  RETRACTION_NOTICE_KID,
} from '../../supabase/functions/_shared/ethics-guard'
import { VIOLATION_CORPUS, type EthicsCategory } from './corpus/violations'
import { BENIGN_CORPUS } from './corpus/benign'
import { CRISIS_OUTPUT_CORPUS } from './corpus/crisis-output'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const FN_DIR = path.join(REPO_ROOT, 'supabase', 'functions')

const CATEGORIES: EthicsCategory[] = [
  'force',
  'coercion',
  'manipulation',
  'shame_based_control',
  'withholding_affection',
]

// ============================================================
// Assertion 1 (input) + 2 (output) — Tier-0 pattern hits/misses
// ============================================================
describe('PRD-41 red-team — Tier-0 pattern guard (assertions 1 + 2)', () => {
  it('every tier0Expected violation-set item hits with the RIGHT category', () => {
    const failures: string[] = []
    for (const item of VIOLATION_CORPUS) {
      if (!item.tier0Expected) continue
      const result = detectEthicsViolation(item.text, item.direction)
      if (!result.hit) {
        failures.push(`MISS [${item.direction}/${item.category}]: "${item.text}"`)
      } else if (result.category !== item.category) {
        failures.push(`WRONG CATEGORY [${item.direction}] expected ${item.category} got ${result.category}: "${item.text}"`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('ZERO benign-set items hit at any category, any direction', () => {
    const failures: string[] = []
    for (const item of BENIGN_CORPUS) {
      const asInput = detectEthicsViolation(item.text, 'input')
      if (asInput.hit) failures.push(`FALSE POSITIVE (input) [near-neighbor of ${item.nearNeighborOf}] matched ${asInput.category}: "${item.text}"`)
      const asOutput = detectEthicsViolation(item.text, 'output')
      if (asOutput.hit) failures.push(`FALSE POSITIVE (output) [near-neighbor of ${item.nearNeighborOf}] matched ${asOutput.category}: "${item.text}"`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('every category has at least one tier0Expected input AND output exemplar (coverage sanity)', () => {
    for (const category of CATEGORIES) {
      const hasInput = VIOLATION_CORPUS.some(v => v.category === category && v.direction === 'input' && v.tier0Expected)
      const hasOutput = VIOLATION_CORPUS.some(v => v.category === category && v.direction === 'output' && v.tier0Expected)
      expect(hasInput, `${category} has no tier0Expected input exemplar`).toBe(true)
      expect(hasOutput, `${category} has no tier0Expected output exemplar`).toBe(true)
    }
  })

  it('corpus has >=20 input violations and >=15 output violations per category (PRD §Red-Team Suite corpus minimums)', () => {
    for (const category of CATEGORIES) {
      const inputCount = VIOLATION_CORPUS.filter(v => v.category === category && v.direction === 'input').length
      const outputCount = VIOLATION_CORPUS.filter(v => v.category === category && v.direction === 'output').length
      expect(inputCount, `${category} input count`).toBeGreaterThanOrEqual(20)
      expect(outputCount, `${category} output count`).toBeGreaterThanOrEqual(15)
    }
  })

  it('corpus has >=20 benign near-neighbors per category', () => {
    for (const category of CATEGORIES) {
      const count = BENIGN_CORPUS.filter(b => b.nearNeighborOf === category).length
      expect(count, `${category} benign count`).toBeGreaterThanOrEqual(20)
    }
  })

  it('Tier-0 output crisis rider (detectCrisisInOutput) catches every crisis-output exemplar', () => {
    const failures: string[] = []
    for (const text of CRISIS_OUTPUT_CORPUS) {
      if (!detectCrisisInOutput(text)) failures.push(`MISS: "${text}"`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('detectCrisisInOutput does not fire on the benign corpus', () => {
    const failures: string[] = []
    for (const item of BENIGN_CORPUS) {
      if (detectCrisisInOutput(item.text)) failures.push(`FALSE POSITIVE: "${item.text}"`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
})

// ============================================================
// Assertion 3 — reframe copy shape
// ============================================================
describe('PRD-41 red-team — reframe copy (assertion 3)', () => {
  const LECTURE_MARKERS = ['inappropriate', 'i cannot', 'not allowed', 'policy']
  const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u

  it('every category has authored copy', () => {
    for (const category of CATEGORIES) {
      expect(ETHICS_REFRAME_RESPONSES[category], category).toBeTruthy()
      expect(ETHICS_REFRAME_RESPONSES[category].length, category).toBeGreaterThan(20)
    }
  })

  it('no reframe response contains a forbidden lecture-marker', () => {
    for (const category of CATEGORIES) {
      const lower = ETHICS_REFRAME_RESPONSES[category].toLowerCase()
      for (const marker of LECTURE_MARKERS) {
        expect(lower.includes(marker), `${category} contains lecture-marker "${marker}"`).toBe(false)
      }
    }
  })

  it('no reframe response contains emoji', () => {
    for (const category of CATEGORIES) {
      expect(EMOJI_RE.test(ETHICS_REFRAME_RESPONSES[category]), category).toBe(false)
    }
  })

  it('every reframe response validates the need, then offers an open door (shape check: ends with a question or invitation)', () => {
    for (const category of CATEGORIES) {
      const text = ETHICS_REFRAME_RESPONSES[category].trim()
      const endsOpen = text.endsWith('?') || /want to|can i|let'?s|would you like/i.test(text)
      expect(endsOpen, `${category}: "${text}"`).toBe(true)
    }
  })
})

// ============================================================
// Assertion 4 — static drift pins (Phase 1 subset)
// ============================================================
describe('PRD-41 red-team — static drift pins (assertion 4, Phase 1 subset)', () => {
  it('ethics-guard.ts exports the full public interface the PRD specifies', () => {
    const src = readFileSync(path.join(FN_DIR, '_shared', 'ethics-guard.ts'), 'utf-8')
    expect(src).toContain('export function detectEthicsViolation')
    expect(src).toContain('export const ETHICS_REFRAME_RESPONSES')
    expect(src).toContain('export function buildReframeMessage')
    expect(src).toContain('export async function enqueueOutputScan')
    expect(src).toContain('export async function logEthicsRejection')
    expect(src).toContain("export const ENFORCEMENT_MODE")
  })

  it('ENFORCEMENT_MODE is enforcing (Phase 4 flip landed 2026-07-10 on founder GO — rollback lever is enforcing->shadow + redeploy)', () => {
    expect(ENFORCEMENT_MODE).toBe('enforcing')
  })

  it('ethics-guard.ts has NO supabase-js URL import (keeps it vitest-importable, mirrors crisis-detection.ts)', () => {
    const src = readFileSync(path.join(FN_DIR, '_shared', 'ethics-guard.ts'), 'utf-8')
    expect(src).not.toContain('esm.sh/@supabase/supabase-js')
  })

  it('lila-chat imports ethics-guard.ts (Phase 1 flagship wiring)', () => {
    const src = readFileSync(path.join(FN_DIR, 'lila-chat', 'index.ts'), 'utf-8')
    expect(src).toContain("from '../_shared/ethics-guard.ts'")
    expect(src).toContain('detectEthicsViolation')
    expect(src).toContain('enqueueOutputScan')
  })

  it('validate-ai-output exists and imports ethics-guard + the no-training OpenRouter client', () => {
    const src = readFileSync(path.join(FN_DIR, 'validate-ai-output', 'index.ts'), 'utf-8')
    expect(src).toContain("from '../_shared/openrouter-client.ts'")
    expect(src.includes('match_ethics_patterns')).toBe(true)
  })

  it('buildSafetyPreamble import pins (SAFETY-BETA-GATE Slice A) still green — Layer 1 additions must not touch Layer 2', () => {
    const src = readFileSync(path.join(FN_DIR, 'lila-chat', 'index.ts'), 'utf-8')
    expect(src).toContain('buildSafetyPreamble()')
  })

  // ── Phase 2 conversation-surface coverage ──
  // Every streaming/conversation surface in the PRD-41 wiring matrix must
  // import ethics-guard.ts. lila-message-respond + bookshelf-discuss are
  // polymorphic; lila-translator is the non-streaming replacement surface.
  // (Phase 3 extends this to the category-2 utility tools and adds the exact
  // exempt-list assertion for the full matrix.)
  const PHASE2_WIRED_SURFACES = [
    'lila-chat',
    'lila-cyrano',
    'lila-higgins-say',
    'lila-higgins-navigate',
    'lila-mediator',
    'lila-quality-time',
    'lila-gifts',
    'lila-observe-serve',
    'lila-words-affirmation',
    'lila-gratitude',
    'lila-perspective-shifter',
    'lila-decision-guide',
    'lila-board-of-directors',
    'bookshelf-discuss',
    'lila-message-respond',
    'lila-translator',
  ]

  for (const surface of PHASE2_WIRED_SURFACES) {
    it(`${surface} imports ethics-guard.ts (Phase 2 conversation-surface wiring)`, () => {
      const src = readFileSync(path.join(FN_DIR, surface, 'index.ts'), 'utf-8')
      expect(src).toContain("from '../_shared/ethics-guard.ts'")
      // Every wired conversation surface does an input pre-flight.
      expect(src.includes('handleEthicsInputReframe') || src.includes('detectEthicsViolation')).toBe(true)
    })
  }

  it('every wired streaming surface scans + enqueues its output (scanStreamedOutput or inline detect + enqueueOutputScan)', () => {
    // Translator, message-respond, bookshelf-discuss use inline output
    // scanning (non-streaming / draft-gated / client-persisted); the rest
    // use the shared scanStreamedOutput helper. All must enqueue.
    const streamingHelperSurfaces = [
      'lila-chat', 'lila-cyrano', 'lila-higgins-say', 'lila-higgins-navigate', 'lila-mediator',
      'lila-quality-time', 'lila-gifts', 'lila-observe-serve', 'lila-words-affirmation',
      'lila-gratitude', 'lila-perspective-shifter', 'lila-decision-guide', 'lila-board-of-directors',
    ]
    const failures: string[] = []
    for (const surface of streamingHelperSurfaces) {
      const src = readFileSync(path.join(FN_DIR, surface, 'index.ts'), 'utf-8')
      // lila-chat uses its own inline output scan (Phase 1); the rest use the shared helper.
      const scans = surface === 'lila-chat'
        ? src.includes('detectEthicsViolation(fullResponse')
        : src.includes('scanStreamedOutput(')
      if (!scans) failures.push(`${surface}: no output scan`)
      if (!src.includes('enqueueOutputScan(')) failures.push(`${surface}: no enqueueOutputScan`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })

  // ── Phase 3 category-2 utility-tool coverage ──
  // Every utility tool that makes a generative model call must import
  // ethics-guard. Some (describe-vs-icon, bookshelf-key-points,
  // bookshelf-process) are DETECTION-ONLY (no family-scoped audit row / non-
  // prose output) and import only detectEthicsViolation + ENFORCEMENT_MODE;
  // the rest use the scanUtilityInput/scanUtilityOutput helpers.
  const PHASE3_WIRED_UTILITIES = [
    'ai-parse', 'task-breaker', 'curriculum-parse', 'homework-estimate',
    'guided-nbt-glaze', 'smart-list-import', 'calendar-extract', 'spelling-coach',
    'mindsweep-scan', 'mindsweep-sort', 'describe-vs-icon', 'celebrate-victory',
    'scan-activity-victories', 'extract-insights', 'auto-title-thread',
    'message-coach', 'bookshelf-extract', 'bookshelf-key-points',
    'bookshelf-study-guide', 'bookshelf-process',
  ]

  for (const fn of PHASE3_WIRED_UTILITIES) {
    it(`${fn} imports ethics-guard.ts (Phase 3 utility-tool wiring)`, () => {
      const src = readFileSync(path.join(FN_DIR, fn, 'index.ts'), 'utf-8')
      expect(src).toContain("from '../_shared/ethics-guard.ts'")
    })
  }

  it('ai-parse rider — prepends buildSafetyPreamble server-side so a caller-supplied system_prompt cannot omit the auto-reject categories', () => {
    const src = readFileSync(path.join(FN_DIR, 'ai-parse', 'index.ts'), 'utf-8')
    expect(src).toContain('buildSafetyPreamble()')
    // The guarded prompt (not the raw caller system_prompt) is what reaches the model.
    expect(src).toContain('guardedSystemPrompt')
  })

  it('message-coach output replacement keeps the shouldCoach:true / isClean:false shape (client-render contract)', () => {
    const src = readFileSync(path.join(FN_DIR, 'message-coach', 'index.ts'), 'utf-8')
    // The ethics input reframe path must render as a coaching checkpoint.
    expect(src).toContain('shouldCoach: true')
    expect(src).toContain('isClean: false')
  })

  // ── FULL-MATRIX INVARIANT ──
  // Dynamically enumerate every Edge Function. Any function that makes a
  // generative CHAT model call MUST import ethics-guard.ts. The only chat-
  // calling exception is validate-ai-output (the scanner itself — it imports
  // the guard's planEnforcingSideEffects but never scans its own Haiku verdict).
  // This is the drift-proof pin: a new AI surface that forgets ethics wiring
  // fails here, and the exempt list stays EXACT.
  const CHAT_CALL_RE = /callOpenRouter|OPENROUTER_URL|chat\/completions|api\.anthropic\.com|\/v1\/messages|\/v1\/chat/

  it('FULL MATRIX — every chat-model-calling Edge Function imports ethics-guard (classifiers that emit a structured verdict, never member-facing prose, are the exceptions)', () => {
    // CLASSIFIER exceptions: functions whose model call produces a structured
    // verdict (category/severity/similarity), NOT member-facing generative
    // content, and therefore have nothing for the ethics guard to reframe or
    // retract. validate-ai-output IS the ethics scanner; safety-classify is
    // PRD-30's Haiku safety classifier (JSON verdict only — see its header).
    const CHAT_CALLING_EXCEPTIONS = new Set(['validate-ai-output', 'safety-classify'])
    const dirs = readdirSync(FN_DIR).filter(d => {
      if (d === '_shared') return false
      const full = path.join(FN_DIR, d)
      return statSync(full).isDirectory() && existsSync(path.join(full, 'index.ts'))
    })
    const failures: string[] = []
    for (const fn of dirs) {
      const src = readFileSync(path.join(FN_DIR, fn, 'index.ts'), 'utf-8')
      const isChatCaller = CHAT_CALL_RE.test(src)
      const importsGuard = src.includes("from '../_shared/ethics-guard.ts'")
      if (isChatCaller && !importsGuard && !CHAT_CALLING_EXCEPTIONS.has(fn)) {
        failures.push(`${fn}: makes a chat model call but does NOT import ethics-guard`)
      }
    }
    // validate-ai-output does import the guard anyway (planEnforcingSideEffects),
    // so the exception set is documentary; assert it's present + imports.
    const scanner = readFileSync(path.join(FN_DIR, 'validate-ai-output', 'index.ts'), 'utf-8')
    expect(scanner.includes("from '../_shared/ethics-guard.ts'"), 'validate-ai-output must import the guard').toBe(true)
    expect(failures, failures.join('\n')).toEqual([])
  })

  it('EXEMPT list — no-generative-output functions do NOT import ethics-guard (PRD §Surface Wiring Matrix, EXACT)', () => {
    // These make no member-facing generative CHAT model call (embeddings/
    // whisper/OCR-only, cron utilities, or pure routers that dispatch to a
    // wired function). If a future edit gives one a generative surface, it
    // must be wired AND removed from this list.
    // mindsweep-auto-sweep + mindsweep-email-intake route through
    // mindsweep-sort (which IS wired) and make no direct model call.
    const EXEMPT = [
      'embed', 'embed-text-admin', 'generate-query-embedding', 'bookshelf-search',
      'whisper-transcribe', 'family-auth-admin', 'fire-painted-schedules',
      'calculate-allowance-period', 'accrue-loan-interest', 'evaluate-deferred-contracts',
      'notify-out-of-nest', 'process-carry-forward-fallback', 'shopping-list-auto-archive',
      'mindsweep-auto-sweep', 'mindsweep-email-intake',
    ]
    const failures: string[] = []
    for (const fn of EXEMPT) {
      const file = path.join(FN_DIR, fn, 'index.ts')
      if (!existsSync(file)) continue
      const src = readFileSync(file, 'utf-8')
      if (src.includes("from '../_shared/ethics-guard.ts'")) failures.push(`${fn}: unexpectedly imports ethics-guard`)
      // Belt-and-suspenders: these must genuinely make no direct chat call.
      if (CHAT_CALL_RE.test(src)) failures.push(`${fn}: exempt but makes a direct chat model call — must be wired + removed from EXEMPT`)
    }
    expect(failures, failures.join('\n')).toEqual([])
  })
})

// ============================================================
// Enforcing-mode side-effect planner (Phase 2 fix-up #2) — proves the
// enforcing behavior deterministically WITHOUT flipping the shipped
// ENFORCEMENT_MODE constant or deploying enforcing mode.
// ============================================================
describe('PRD-41 red-team — planEnforcingSideEffects (fix-up #2)', () => {
  const base = {
    category: 'manipulation' as const,
    tier: 2 as const,
    rejectionId: 'rej-1',
    surface: 'lila-chat',
    familyId: 'fam-1',
    momId: 'mom-1',
    kidName: 'Jordan',
    messageTable: 'lila_messages',
    messageId: 'msg-1',
  }

  it('shadow mode plans NOTHING user-visible (fix-up #2: gates annotation AND notification, not just the card)', () => {
    const result = planEnforcingSideEffects({ ...base, mode: 'shadow', isKid: true })
    expect(result.annotation).toBeNull()
    expect(result.notification).toBeNull()
  })

  it('enforcing + kid: annotation carries the KID notice + notification is planned (child surface)', () => {
    const result = planEnforcingSideEffects({ ...base, mode: 'enforcing', isKid: true })
    expect(result.annotation).not.toBeNull()
    expect(result.annotation!.table).toBe('lila_messages')
    expect(result.annotation!.messageId).toBe('msg-1')
    expect(result.annotation!.metadata.ethics_retraction.notice).toBe(RETRACTION_NOTICE_KID)
    expect(result.annotation!.metadata.ethics_retraction.category).toBe('manipulation')
    expect(result.notification).not.toBeNull()
    expect(result.notification!.category).toBe('lila')
    expect(result.notification!.priority).toBe('normal')
    expect(result.notification!.recipient_member_id).toBe('mom-1')
    // Plain-language label, never the enum string.
    expect(result.notification!.body).toContain('guilt-based framing')
    expect(result.notification!.body).not.toContain('manipulation')
    expect(result.notification!.body).toContain('Jordan')
  })

  it('enforcing + adult: annotation carries the ADULT notice, NO notification (notification is child-surface-only)', () => {
    const result = planEnforcingSideEffects({ ...base, mode: 'enforcing', isKid: false })
    expect(result.annotation).not.toBeNull()
    expect(result.annotation!.metadata.ethics_retraction.notice).toBe(RETRACTION_NOTICE)
    expect(result.notification).toBeNull()
  })

  it('enforcing + kid but no persisted message: NO annotation (utility output), notification still planned', () => {
    const result = planEnforcingSideEffects({ ...base, mode: 'enforcing', isKid: true, messageTable: null, messageId: null })
    expect(result.annotation).toBeNull()
    expect(result.notification).not.toBeNull()
  })

  it('enforcing + kid but momId unresolved: notification NOT planned (nobody to send to)', () => {
    const result = planEnforcingSideEffects({ ...base, mode: 'enforcing', isKid: true, momId: null })
    expect(result.notification).toBeNull()
    // Annotation still applies (it does not depend on mom resolution).
    expect(result.annotation).not.toBeNull()
  })
})
