// Repo-wide invariant, wired into `npm run redteam` (pre-push hook, per
// Checkpoint 4) so this bug class can never ship a third time.
//
// Found live (2026-07-08, PRD-30 SM-C session): 'anthropic/claude-haiku-
// 4-5-20251001' is NOT a valid OpenRouter model ID (confirmed via a live
// 400: "...is not a valid model ID"). It silently broke, in order of
// discovery: safety-weekly-digest's narrative generation, safety-classify's
// Layer 2 classification + conversation starters (PRD-30, since SM-A),
// validate-ai-output's Tier 2 confirmation (PRD-41, since Slice E deploy),
// message-coach's real coaching-note generation, auto-title-thread's
// thread titling (PRD-15, since deploy), and lila-board-of-directors'
// content-policy harm screen + multi-family-relevance classifier (PRD-34 —
// this one fail-closed rather than silently passing, so its effect was
// SAFE-but-overzealous: custom persona creation was blocked more often
// than it should have been, and nothing was ever promoted to the Tier-3
// shared persona cache via this path) — six separate Edge Functions, each
// degrading SILENTLY: a failed Haiku call returns null (or an HTTP error
// the caller only console.error()s, or a documented fail-closed default),
// and every caller's fallback branch treats that as a benign "nothing to
// do here" outcome, so nothing ever LOOKED broken. All six are now fixed;
// only `_shared/cost-logger.ts`'s inert pricing-table row remains
// grandfathered (see below — it is data, never a call site).
//
// The valid form has no dated suffix: 'anthropic/claude-haiku-4.5'.
//
// Detection is COMMENT-AWARE: a `//`-prefixed line (including this file's
// own explanatory comments, which necessarily quote the banned string) does
// not count as an offense. Only a real code line — an assignment, a
// `model:` field, etc. — trips the guard.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const FN_DIR = path.join(REPO_ROOT, 'supabase', 'functions')
const BANNED_MODEL_ID = 'anthropic/claude-haiku-4-5-20251001'

function walkFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walkFiles(full))
    else if (entry.endsWith('.ts')) out.push(full)
  }
  return out
}

/** Real-code occurrences only — skips full-line `//` comments (including
 * this codebase's convention of multi-line `//`-prefixed block comments). */
function findRealCodeOccurrences(src: string): number {
  return src
    .split('\n')
    .filter(line => !line.trim().startsWith('//'))
    .filter(line => line.includes(BANNED_MODEL_ID)).length
}

// GRANDFATHERED — exactly one entry, and it is DATA, never a call site:
//   - supabase/functions/_shared/cost-logger.ts's MODEL_PRICING table
//     carries a pricing ROW for this id (dead weight now that no caller
//     will ever pass it again, but harmless — a lookup table, not a call
//     site — and a shared file bundled into every function's deploy, so
//     touching it is outside the scope of the two named cross-territory
//     fixes this build was granted).
// This list must only ever SHRINK. Any file with a real-code occurrence
// that isn't in this exact set is a NEW regression and fails the guard.
// auto-title-thread and lila-board-of-directors were removed from this
// list 2026-07-08 (seat-granted cross-territory fix, same session) — the
// guard now runs with zero function-level exceptions.
const GRANDFATHERED_FILES = new Set([
  'supabase/functions/_shared/cost-logger.ts',
].map(p => p.split('/').join(path.sep)))

const FIXED_FUNCTIONS = [
  'safety-weekly-digest', 'safety-classify', 'validate-ai-output', 'message-coach',
  'auto-title-thread', 'lila-board-of-directors',
]

describe('model-id-guard — the invalid dated-suffix Haiku model ID must never reappear', () => {
  it('no file under supabase/functions/ has a real-code occurrence of the invalid model ID, except the dated grandfather list', () => {
    const offenders: string[] = []
    for (const file of walkFiles(FN_DIR)) {
      const src = readFileSync(file, 'utf-8')
      if (findRealCodeOccurrences(src) === 0) continue
      const rel = path.relative(REPO_ROOT, file)
      if (!GRANDFATHERED_FILES.has(rel)) offenders.push(rel)
    }
    expect(offenders, `NEW invalid-model-ID regression in: ${offenders.join(', ')}. Use 'anthropic/claude-haiku-4.5' instead. (If this is a legitimate grandfather-list addition, that's a red flag, not a fix — go fix the caller.)`).toEqual([])
  })

  it('the grandfather list never goes stale — every entry still has a real-code occurrence', () => {
    for (const rel of GRANDFATHERED_FILES) {
      const src = readFileSync(path.join(REPO_ROOT, rel), 'utf-8')
      expect(findRealCodeOccurrences(src) > 0, `${rel} is grandfathered but no longer has a real-code occurrence — remove it from GRANDFATHERED_FILES so a future regression there is caught`).toBe(true)
    }
  })

  it('the six fixed functions use the valid model ID with zero real-code occurrences of the banned one', () => {
    for (const fn of FIXED_FUNCTIONS) {
      const src = readFileSync(path.join(FN_DIR, fn, 'index.ts'), 'utf-8')
      expect(findRealCodeOccurrences(src), `${fn} should have zero real-code uses of the banned model ID`).toBe(0)
      expect(src.includes("'anthropic/claude-haiku-4.5'"), `${fn} should use the valid model ID somewhere`).toBe(true)
    }
  })
})
