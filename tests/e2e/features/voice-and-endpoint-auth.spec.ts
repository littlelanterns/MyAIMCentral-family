/**
 * VOICE-INPUT-REPAIR — endpoint auth + voice reducer regression pins.
 *
 * Two classes of pin, mirroring safety-beta-gate.spec.ts:
 *   1. STATIC pins (no deploy) — grep the source so the fixes can't silently
 *      regress: the voice hook uses the de-duplicating reducer; the three
 *      exposed Edge Functions (whisper-transcribe, extract-insights,
 *      mindsweep-email-intake) verify auth in code.
 *   2. LIVE probes (require the new function versions deployed) — hit the
 *      endpoints and assert 401 for no-auth / garbage / forged-`sub` tokens.
 *      These fail until the founder-approved deploy pass ships; run them after.
 *
 * Voice capture itself can't be exercised end-to-end (CI has no microphone) —
 * the duplication fix is pinned by tests/voice-reduce-speech-results.test.ts
 * (vitest) plus the static pin here.
 */
import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const FN = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`

const REPO_ROOT = process.cwd()
const FN_DIR = path.join(REPO_ROOT, 'supabase', 'functions')
function readFn(name: string): string {
  return readFileSync(path.join(FN_DIR, name, 'index.ts'), 'utf-8')
}

// A syntactically well-formed JWT with a forged `sub` and a bogus signature.
// extract-insights USED to base64-decode this and trust the `sub` outright.
// header {"alg":"HS256","typ":"JWT"} . payload {"sub":"<uuid>"} . fake-sig
const FORGED_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDAifQ' +
  '.not_a_real_signature'

// ────────────────────────────────────────────────────────────────
// STATIC PINS — no deploy required
// ────────────────────────────────────────────────────────────────

test.describe('VOICE-INPUT-REPAIR — static pins', () => {
  test('useVoiceInput uses the de-duplicating reducer, not index-0 iteration (F1)', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'hooks', 'useVoiceInput.ts'), 'utf-8')
    expect(src).toContain("from '@/lib/voice/reduceSpeechResults'")
    expect(src).toMatch(/reduceSpeechResults\(event\)/)
    // The old bug iterated every result from 0 on each event.
    expect(src).not.toMatch(/for\s*\(\s*let i = 0; i < event\.results\.length/)
  })

  test('reduceSpeechResults reads event.resultIndex (F1)', () => {
    const src = readFileSync(path.join(REPO_ROOT, 'src', 'lib', 'voice', 'reduceSpeechResults.ts'), 'utf-8')
    expect(src).toContain('event.resultIndex')
  })

  test('whisper-transcribe imports and calls authenticateRequest (S2)', () => {
    const src = readFn('whisper-transcribe')
    expect(src).toContain("from '../_shared/auth.ts'")
    expect(src).toMatch(/authenticateRequest\(req\)/)
  })

  test('extract-insights verifies auth and no longer trusts a decoded sub (S1)', () => {
    const src = readFn('extract-insights')
    expect(src).toContain("from '../_shared/auth.ts'")
    expect(src).toMatch(/authenticateRequest\(req\)/)
    // The unverified decode-then-trust pattern must be gone.
    expect(src).not.toContain('JSON.parse(atob(')
    // Storage ownership check present (the cross-family file-read guard).
    expect(src).toContain('callerFamilyIds')
  })

  test('mindsweep-email-intake fails closed on a missing/invalid webhook secret (S3)', () => {
    const src = readFn('mindsweep-email-intake')
    expect(src).toContain('MINDSWEEP_WEBHOOK_SECRET')
    // Fail-closed: reject when the secret is unset OR the presented value differs.
    expect(src).toMatch(/!WEBHOOK_SECRET \|\| provided !== WEBHOOK_SECRET/)
  })
})

// ────────────────────────────────────────────────────────────────
// LIVE PROBES — require the new function versions deployed
// ────────────────────────────────────────────────────────────────

test.describe('VOICE-INPUT-REPAIR — LIVE: exposed-endpoint auth closure', () => {
  test('whisper-transcribe rejects no Authorization header', async ({ request }) => {
    const res = await request.post(FN('whisper-transcribe'), {
      headers: { apikey: ANON_KEY },
      multipart: { notaudio: 'x' },
    })
    expect(res.status()).toBe(401)
  })

  test('whisper-transcribe rejects a garbage bearer token', async ({ request }) => {
    const res = await request.post(FN('whisper-transcribe'), {
      headers: { apikey: ANON_KEY, Authorization: 'Bearer not-a-real-token' },
      multipart: { notaudio: 'x' },
    })
    expect(res.status()).toBe(401)
  })

  test('extract-insights rejects no Authorization header', async ({ request }) => {
    const res = await request.post(FN('extract-insights'), {
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      data: {},
    })
    expect(res.status()).toBe(401)
  })

  test('extract-insights rejects a forged-sub JWT (the old bypass)', async ({ request }) => {
    const res = await request.post(FN('extract-insights'), {
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${FORGED_JWT}`,
      },
      data: { file_storage_path: 'x/innerworkings/y.txt', extraction_target: 'keel' },
    })
    expect(res.status()).toBe(401)
  })

  test('mindsweep-email-intake rejects a request with no webhook secret', async ({ request }) => {
    const res = await request.post(FN('mindsweep-email-intake'), {
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      data: { from: 'a@b.com', to: 'c@d.com', subject: 's', text: 't' },
    })
    expect(res.status()).toBe(401)
  })
})
