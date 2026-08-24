/**
 * PRD-40 Slice 5 — static pins on the AI-call COPPA gates.
 *
 * Service-role Edge Functions bypass the migration-100328 RLS write gates,
 * so the Edge-layer check in _shared/coppa-consent.ts is the ONLY gate on
 * the member-conversation engines. These pins keep the wiring from silently
 * disappearing (the safety-crisis-flag pattern):
 *
 *   - lila-chat and bookshelf-discuss both import AND call
 *     checkCoppaWriteAllowed,
 *   - in BOTH files the Convention #7 crisis gate runs BEFORE the COPPA
 *     gate (crisis resources always win — HITM-CLOSURE (d): Convention #7
 *     is global and overrides all gates),
 *   - in lila-chat the gate runs BEFORE the user message persists (a
 *     blocked member's message must never be collected),
 *   - the roster suspension filter stays on the server context assembler.
 *
 * More gated surfaces later is GROWTH, not drift — this asserts a minimum
 * set, unlike the crisis-flag exact-scope pin. The remaining utility-
 * function sweep is a registered STUB_REGISTRY follow-up.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const fn = (p: string) => readFileSync(join(ROOT, 'supabase', 'functions', p), 'utf8')

describe('PRD-40 Slice 5 — AI-call COPPA gates', () => {
  it('lila-chat: gate imported, called, ordered crisis → coppa → persist', () => {
    const text = fn('lila-chat/index.ts')
    expect(text).toContain("from '../_shared/coppa-consent.ts'")
    expect(text).toContain('checkCoppaWriteAllowed(')

    const crisisIdx = text.indexOf('detectCrisis(')
    const coppaIdx = text.indexOf('checkCoppaWriteAllowed(')
    // The user-message persist inside the main handler (after conversation load):
    const persistIdx = text.indexOf("from('lila_messages').insert", coppaIdx)
    expect(crisisIdx).toBeGreaterThan(-1)
    expect(coppaIdx).toBeGreaterThan(crisisIdx)
    expect(persistIdx, 'the COPPA gate must run before the user message is persisted').toBeGreaterThan(coppaIdx)
  })

  it('bookshelf-discuss: gate imported, called, ordered crisis → coppa', () => {
    const text = fn('bookshelf-discuss/index.ts')
    expect(text).toContain("from '../_shared/coppa-consent.ts'")
    expect(text).toContain('checkCoppaWriteAllowed(')
    const crisisIdx = text.indexOf('detectCrisis(')
    const coppaIdx = text.indexOf('checkCoppaWriteAllowed(')
    expect(crisisIdx).toBeGreaterThan(-1)
    expect(coppaIdx).toBeGreaterThan(crisisIdx)
  })

  it('server context assembler drops suspended members from the Layer-1 roster', () => {
    const text = fn('_shared/context-assembler.ts')
    expect(text).toContain("eq('is_suspended_for_deletion', false)")
  })

  it('the shared module keeps its fail-open posture and friendly copy', () => {
    const text = fn('_shared/coppa-consent.ts')
    expect(text).toContain('COPPA_AI_BLOCKED_MESSAGE')
    expect(text).toContain('failed open')
  })
})
