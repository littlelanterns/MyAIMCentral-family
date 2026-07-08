// PRD-30 Safety Monitoring — SM-C, Build Item 14 (D5 crisis-hit flag
// wiring). Pure-logic tests for supabase/functions/_shared/crisis-flag.ts,
// plus the static drift pin proving the fire-and-forget helper is imported
// by EXACTLY three surfaces (mindsweep-sort, mindsweep-scan, message-coach)
// — closing this gap must never silently spread to other Edge Functions.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'fs'
import path from 'path'
import { findMatchedCrisisKeyword, categorizeCrisisMatch } from '../supabase/functions/_shared/crisis-flag'

const REPO_ROOT = path.resolve(__dirname, '..')
const FN_DIR = path.join(REPO_ROOT, 'supabase', 'functions')

describe('PRD-30 crisis-flag — findMatchedCrisisKeyword (pure)', () => {
  it('finds a direct crisis phrase, case-insensitive', () => {
    expect(findMatchedCrisisKeyword('I want to DIE')).toBe('want to die')
    expect(findMatchedCrisisKeyword('sometimes I think about suicide')).toBe('suicide')
  })

  it('word-boundary matching — does not false-match inside an unrelated word', () => {
    // "suicide" should not match inside a longer unrelated compound word.
    expect(findMatchedCrisisKeyword('the suicidefoo bar')).toBeNull()
  })

  it('returns null for benign content', () => {
    expect(findMatchedCrisisKeyword('I want to buy milk and eggs')).toBeNull()
    expect(findMatchedCrisisKeyword('')).toBeNull()
  })

  it('negation still matches (Key PRD Decision #5 — over-flag beats under-flag)', () => {
    expect(findMatchedCrisisKeyword("I don't want to die")).toBe('want to die')
  })
})

describe('PRD-30 crisis-flag — categorizeCrisisMatch (pure)', () => {
  it('self-harm/suicide phrases categorize as self_harm', () => {
    expect(categorizeCrisisMatch('suicide')).toBe('self_harm')
    expect(categorizeCrisisMatch('want to die')).toBe('self_harm')
    expect(categorizeCrisisMatch(null)).toBe('self_harm') // safe default
  })

  it('experienced-abuse phrases categorize as abuse, mirroring the migration 100289 keyword seed', () => {
    expect(categorizeCrisisMatch('being abused')).toBe('abuse')
    expect(categorizeCrisisMatch('molest')).toBe('abuse')
    expect(categorizeCrisisMatch('hits me')).toBe('abuse')
  })

  it('harm-to-others phrases categorize as other, mirroring the migration 100289 keyword seed', () => {
    expect(categorizeCrisisMatch('kill him')).toBe('other')
    expect(categorizeCrisisMatch('going to kill')).toBe('other')
    expect(categorizeCrisisMatch('want to hurt')).toBe('other')
  })
})

describe('PRD-30 crisis-flag — static drift pin (D5 scope discipline)', () => {
  const D5_SURFACES = ['mindsweep-sort', 'mindsweep-scan', 'message-coach']

  it('flagCrisisEvent is imported by EXACTLY the three named D5 surfaces, no more, no fewer', () => {
    const dirs = readdirSync(FN_DIR).filter(d => {
      if (d === '_shared') return false
      const full = path.join(FN_DIR, d)
      return statSync(full).isDirectory() && existsSync(path.join(full, 'index.ts'))
    })

    const importers: string[] = []
    for (const fn of dirs) {
      const src = readFileSync(path.join(FN_DIR, fn, 'index.ts'), 'utf-8')
      if (src.includes("from '../_shared/crisis-flag.ts'")) importers.push(fn)
    }

    expect(importers.sort()).toEqual([...D5_SURFACES].sort())
  })

  it('each of the three D5 surfaces calls flagCrisisEvent at least once', () => {
    for (const surface of D5_SURFACES) {
      const src = readFileSync(path.join(FN_DIR, surface, 'index.ts'), 'utf-8')
      expect(src.includes('flagCrisisEvent(')).toBe(true)
    }
  })

  it('message-coach checks crisis BEFORE resolving sender for the main coaching flow — the crisis response must never depend on a DB lookup succeeding first', () => {
    // A regression was caught here: an earlier version of this fix moved
    // sender resolution ahead of the crisis check so flagCrisisEvent could
    // use sender.family_id/id, which meant the crisis response itself
    // (member-facing resources) would only fire AFTER a successful
    // family_members lookup — a real robustness regression for a
    // Convention #7 crisis path. The fix: check crisis FIRST (unconditional,
    // no DB dependency), and do an INDEPENDENT, separately try/caught
    // best-effort sender lookup inside the crisis branch purely for the D5
    // flag write, which can never delay or block the crisis response.
    const src = readFileSync(path.join(FN_DIR, 'message-coach', 'index.ts'), 'utf-8')
    const crisisIdx = src.indexOf('detectCrisis(message_content)')
    const mainSenderResolveIdx = src.indexOf('// ── Resolve sender ──')
    expect(crisisIdx).toBeGreaterThan(-1)
    expect(mainSenderResolveIdx).toBeGreaterThan(-1)
    expect(crisisIdx).toBeLessThan(mainSenderResolveIdx)
  })

  it('message-coach wraps its D5 sender lookup in its own try/catch, independent of the crisis response', () => {
    const src = readFileSync(path.join(FN_DIR, 'message-coach', 'index.ts'), 'utf-8')
    const crisisIdx = src.indexOf('detectCrisis(message_content)')
    const tryIdx = src.indexOf('try {', crisisIdx)
    const flagCallIdx = src.indexOf('flagCrisisEvent(', crisisIdx)
    const catchIdx = src.indexOf('} catch (err) {', crisisIdx)
    const crisisResponseIdx = src.indexOf('crisis: true', crisisIdx)
    // try wraps the lookup+flag call, and the crisis response is emitted
    // AFTER the try/catch block regardless of its outcome.
    expect(tryIdx).toBeGreaterThan(crisisIdx)
    expect(flagCallIdx).toBeGreaterThan(tryIdx)
    expect(catchIdx).toBeGreaterThan(flagCallIdx)
    expect(crisisResponseIdx).toBeGreaterThan(catchIdx)
  })
})
