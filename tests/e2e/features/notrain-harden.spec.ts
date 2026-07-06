/**
 * NOTRAIN-HARDEN — structural no-training hardening for OpenRouter calls (2026-07-05)
 *
 * Evidence base: claude/legal-drafts/no-training-verification.md — condition 3
 * in §7's "what must be true for the bracketed [no-training] sentence to
 * become publishable" table. Before this build, none of the ~45 OpenRouter
 * call sites across ~30 Edge Functions sent a `provider` field at all —
 * every request relied solely on OpenRouter account-dashboard defaults the
 * application code could not see or guarantee.
 *
 * This build introduces `supabase/functions/_shared/openrouter-client.ts` —
 * the single entry point for every OpenRouter request — which forces
 * `provider: { data_collection: "deny" }` onto every request body. Every
 * call site (48 call sites across 36 Edge Functions) was swept onto it.
 *
 * Two test classes, following the safety-beta-gate.spec.ts pattern:
 *   1. STATIC regression pins — read source files on disk. No deploy
 *      required. These are the permanent guardrails: if a future edit
 *      reintroduces a hand-built `fetch('https://openrouter.ai/...')` call
 *      or a request body that bypasses withNoTraining(), these fail
 *      immediately.
 *   2. LIVE probe — hits one deployed Edge Function directly to confirm the
 *      new `provider` field does not break OpenRouter's routing (i.e. the
 *      request still succeeds end-to-end). This does NOT and cannot verify
 *      that OpenRouter enforces the policy server-side — that trust rests on
 *      OpenRouter's own documented behavior (see the evidence file §4,
 *      Source 4). It only proves the added field doesn't silently break the
 *      call path.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { TEST_USERS } from '../helpers/seed-testworths-complete'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const FN = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`

const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// global-setup.ts populates seed-testworths-complete's module-level TEST_IDS,
// but that mutation happens in Playwright's orchestrator process — this spec
// runs in a separate worker process with its own fresh module instance, so
// TEST_IDS shows up empty here. Resolve real ids via service-role query
// instead (the proven pattern from safety-beta-gate.spec.ts).
let familyId = ''
const memberIds: Record<string, string> = {}

async function resolveFamilyId(): Promise<string> {
  if (familyId) return familyId
  const { data, error } = await sr
    .from('families')
    .select('id')
    .eq('family_login_name_lower', 'testworthfamily')
    .single()
  if (error || !data) throw new Error(`Testworth family not found: ${error?.message}`)
  familyId = data.id
  return familyId
}

async function resolveMemberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const fid = await resolveFamilyId()
  const { data, error } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', fid)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

async function signInToken(email: string, password: string): Promise<string> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: true },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`)
  return data.session.access_token
}

// Repo-relative path to supabase/functions. Playwright runs from the repo
// root, so process.cwd() is the repo root — avoids __dirname, which is
// undefined in this project's ESM module scope.
const REPO_ROOT = process.cwd()
const FN_DIR = path.join(REPO_ROOT, 'supabase', 'functions')
function readFn(name: string): string {
  return readFileSync(path.join(FN_DIR, name, 'index.ts'), 'utf-8')
}

// ────────────────────────────────────────────────────────────────
// STATIC REGRESSION PINS — no deploy required
// ────────────────────────────────────────────────────────────────

test.describe('NOTRAIN-HARDEN — static regression pins', () => {
  test('_shared/openrouter-client.ts is the sole canonical source and exports the required surface', () => {
    const src = readFileSync(path.join(FN_DIR, '_shared', 'openrouter-client.ts'), 'utf-8')
    expect(src).toContain("export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'")
    expect(src).toContain('export function withNoTraining')
    expect(src).toContain('export function openRouterHeaders')
    expect(src).toContain('export async function callOpenRouter')
    // The deny value must actually be set inside withNoTraining, not just
    // documented in a comment.
    const fnBody = src.slice(src.indexOf('export function withNoTraining'))
    expect(fnBody).toMatch(/data_collection:\s*'deny'/)
  })

  // Every known OpenRouter call-site function imports the shared client.
  // This is the exhaustive list as of this build (48 call sites, 36 files) —
  // extend it whenever a new Edge Function starts calling OpenRouter.
  const OPENROUTER_CALL_SITES = [
    'ai-parse',
    'auto-title-thread',
    'bookshelf-discuss',
    'bookshelf-extract',
    'bookshelf-key-points',
    'bookshelf-process',
    'bookshelf-study-guide',
    'calendar-extract',
    'celebrate-victory',
    'curriculum-parse',
    'describe-vs-icon',
    'extract-insights',
    'guided-nbt-glaze',
    'homework-estimate',
    'lila-board-of-directors',
    'lila-chat',
    'lila-cyrano',
    'lila-decision-guide',
    'lila-gifts',
    'lila-gratitude',
    'lila-higgins-navigate',
    'lila-higgins-say',
    'lila-mediator',
    'lila-message-respond',
    'lila-observe-serve',
    'lila-perspective-shifter',
    'lila-quality-time',
    'lila-translator',
    'lila-words-affirmation',
    'message-coach',
    'mindsweep-scan',
    'mindsweep-sort',
    'scan-activity-victories',
    'smart-list-import',
    'spelling-coach',
    'task-breaker',
  ]

  for (const fn of OPENROUTER_CALL_SITES) {
    test(`${fn} imports the shared OpenRouter client`, () => {
      const src = readFn(fn)
      expect(src).toContain("from '../_shared/openrouter-client.ts'")
    })
  }

  test('no Edge Function hardcodes the OpenRouter URL outside the shared client', () => {
    const offenders: string[] = []
    for (const entry of readdirSync(FN_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name === '_shared') continue
      const file = path.join(FN_DIR, entry.name, 'index.ts')
      let src: string
      try {
        src = readFileSync(file, 'utf-8')
      } catch {
        continue
      }
      if (src.includes('openrouter.ai/api/v1/chat/completions')) {
        offenders.push(entry.name)
      }
    }
    expect(offenders).toEqual([])
  })

  test('no Edge Function sets provider.data_collection directly (only withNoTraining may)', () => {
    const offenders: string[] = []
    for (const entry of readdirSync(FN_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const file = path.join(FN_DIR, entry.name, 'index.ts')
      let src: string
      try {
        src = readFileSync(file, 'utf-8')
      } catch {
        continue
      }
      if (entry.name === '_shared') continue
      if (src.includes('data_collection')) offenders.push(entry.name)
    }
    expect(offenders).toEqual([])
  })

  test('bookshelf-extract and bookshelf-study-guide route their retry wrapper through OPENROUTER_URL + withNoTraining', () => {
    for (const fn of ['bookshelf-extract', 'bookshelf-study-guide']) {
      const src = readFn(fn)
      expect(src).toContain('OPENROUTER_URL')
      expect(src).toContain('withNoTraining(')
      expect(src).not.toContain("'https://openrouter.ai/api/v1/chat/completions'")
    }
  })

  test('orphaned local openRouterHeaders object literals were replaced with the shared builder', () => {
    for (const fn of ['bookshelf-extract', 'bookshelf-study-guide']) {
      const src = readFn(fn)
      expect(src).toMatch(/openRouterHeaders\s*=\s*buildOpenRouterHeaders\(/)
      // The old inline header object (HTTP-Referer + X-Title as sibling keys
      // of a hand-rolled const) must be gone.
      expect(src).not.toMatch(/const openRouterHeaders = \{\s*\n\s*Authorization/)
    }
  })
})

// ────────────────────────────────────────────────────────────────
// LIVE PROBE — requires this build's Edge Functions to be deployed
// ────────────────────────────────────────────────────────────────

test.describe('NOTRAIN-HARDEN — LIVE: provider.data_collection does not break routing', () => {
  let momToken: string

  test.beforeAll(async () => {
    momToken = await signInToken(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
  })

  test('ai-parse still completes a normal request with the deny flag set', async ({ request }) => {
    const res = await request.post(FN('ai-parse'), {
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${momToken}`,
      },
      data: {
        system_prompt: 'Reply with exactly the word: ok',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10,
      },
    })
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(typeof json.content).toBe('string')
    expect(json.content.length).toBeGreaterThan(0)
  })

  // Founder-requested smoke pass: 2 more architecturally distinct AI features
  // (batch-classification JSON call, quick-subtask JSON call) beyond ai-parse,
  // to confirm the shared client's header/body shape doesn't silently break
  // any of the differently-shaped request bodies swept onto it.

  test('task-breaker still completes a normal request with the deny flag set', async ({ request }) => {
    const res = await request.post(FN('task-breaker'), {
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${momToken}`,
      },
      data: {
        task_title: 'Clean out the garage',
        detail_level: 'quick',
        family_members: [],
      },
    })
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(Array.isArray(json.subtasks)).toBeTruthy()
    expect(json.subtasks.length).toBeGreaterThan(0)
  })

  test('mindsweep-sort still classifies a normal (non-crisis) item with the deny flag set', async ({ request }) => {
    const res = await request.post(FN('mindsweep-sort'), {
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${momToken}`,
      },
      data: {
        family_id: await resolveFamilyId(),
        member_id: await resolveMemberId('Sarah'),
        items: [{ content: 'buy milk and eggs at the store', content_type: 'text' }],
        source_channel: 'quick_capture',
        input_type: 'text',
      },
    })
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.crisis).toBeFalsy()
    expect(Array.isArray(json.results)).toBeTruthy()
    expect(json.results.length).toBe(1)
  })

  test.describe('lila-chat', () => {
    const PREFIX = 'NOTRAINGATE'
    let conversationId = ''

    test.beforeAll(async () => {
      const fid = await resolveFamilyId()
      const mid = await resolveMemberId('Sarah')
      // mode='general' avoids the 'assist'-only routing-prescan short-circuit
      // (Convention: routing prescan only fires when modeKey === 'assist'),
      // guaranteeing this request reaches the real OpenRouter call.
      const { data, error } = await sr
        .from('lila_conversations')
        .insert({ family_id: fid, member_id: mid, mode: 'general', container_type: 'drawer', title: `${PREFIX} smoke test` })
        .select('id')
        .single()
      if (error || !data) throw new Error(`lila_conversations fixture: ${error?.message}`)
      conversationId = data.id
    })

    test.afterAll(async () => {
      if (conversationId) {
        await sr.from('lila_messages').delete().eq('conversation_id', conversationId)
        await sr.from('lila_conversations').delete().eq('id', conversationId)
      }
    })

    test('still streams a normal reply with the deny flag set', async ({ request }) => {
      const res = await request.post(FN('lila-chat'), {
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${momToken}`,
        },
        data: {
          conversation_id: conversationId,
          content: 'Reply with exactly one short sentence confirming you received this test message.',
        },
      })
      expect(res.ok()).toBeTruthy()
      const body = await res.text()
      // SSE stream — assert at least one real content chunk arrived, not just [DONE].
      expect(body).toContain('"type":"chunk"')
      expect(body).toContain('[DONE]')
    })
  })
})
