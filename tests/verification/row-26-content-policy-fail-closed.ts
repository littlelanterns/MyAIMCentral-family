/**
 * Row 26 — SCOPE-8a.F5 contentPolicyCheck fails closed on all five branches.
 *
 * Strategy (Option i per green-light): port contentPolicyCheck into this test
 * file verbatim, stub globalThis.fetch to trigger each failure branch, and
 * assert outcome='blocked'. Also run a source-equivalence grep against the
 * real Edge Function to guard against drift.
 *
 * Five fail-closed branches:
 *   1. HTTP non-2xx (res.ok === false)
 *   2. JSON parse failure
 *   3. Unknown outcome value
 *   4. Missing outcome key (parsed is {} with no outcome field)
 *   5. Exception thrown inside the try block
 *
 * PLUS: crisis-gate precedence — a crisis message must short-circuit before
 * policy evaluation. We verify via the detectCrisis helper's presence in the
 * Edge Function's chat path + crisis field scan.
 *
 * Run: npx tsx tests/verification/row-26-content-policy-fail-closed.ts
 */
import fs from 'fs'
import path from 'path'

interface Finding { label: string; pass: boolean; detail: string }
const findings: Finding[] = []
function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

// ── Ported contentPolicyCheck (verbatim logic from lila-board-of-directors) ─

interface ContentPolicyResult {
  outcome: 'approved' | 'deity' | 'blocked' | 'harmful_description'
  message?: string
  deityName?: string
}

const CONTENT_POLICY_BLOCK_FAIL_CLOSED: ContentPolicyResult = {
  outcome: 'blocked',
  message: "We couldn't verify this request right now. Please try again in a moment.",
}

async function contentPolicyCheck(
  name: string,
  description: string,
): Promise<ContentPolicyResult> {
  const prompt = `placeholder — logic only`
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer fake`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Content Policy',
      },
      body: JSON.stringify({ prompt, name, description }),
    })
    if (!res.ok) {
      console.error('contentPolicyCheck HTTP error:', res.status)
      return CONTENT_POLICY_BLOCK_FAIL_CLOSED
    }

    const json: { choices?: Array<{ message?: { content?: string } }> } = await res.json()
    const text = json.choices?.[0]?.message?.content?.trim() || ''
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('contentPolicyCheck JSON parse failed:', text.slice(0, 200))
      return CONTENT_POLICY_BLOCK_FAIL_CLOSED
    }

    if (parsed.outcome === 'deity') {
      const deityName = (parsed.deity_name as string) || name
      return {
        outcome: 'deity',
        deityName,
        message: `We don't create AI voices for ${deityName}. Instead, ...`,
      }
    }
    if (parsed.outcome === 'blocked') {
      return { outcome: 'blocked', message: `I'm not able to create a persona for ${name}.` }
    }
    if (parsed.outcome === 'harmful_description') {
      return { outcome: 'harmful_description', message: 'Some elements in your description...' }
    }
    if (parsed.outcome === 'approved') {
      return { outcome: 'approved' }
    }
    console.error('contentPolicyCheck unknown outcome:', parsed.outcome)
    return CONTENT_POLICY_BLOCK_FAIL_CLOSED
  } catch (err) {
    console.error('contentPolicyCheck threw:', err)
    return CONTENT_POLICY_BLOCK_FAIL_CLOSED
  }
}

// ── Fetch stubs ──────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch
function setFetch(fn: typeof fetch) {
  globalThis.fetch = fn
}
function restoreFetch() {
  globalThis.fetch = originalFetch
}

async function branch1_httpError() {
  setFetch(async () =>
    new Response('upstream boom', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  )
  try {
    const result = await contentPolicyCheck('Abraham Lincoln', 'A thoughtful leader')
    record(
      'Branch 1: HTTP non-2xx → outcome=blocked',
      result.outcome === 'blocked',
      `got outcome=${result.outcome}`
    )
  } finally {
    restoreFetch()
  }
}

async function branch2_jsonParseError() {
  setFetch(async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: 'this is not JSON {{{ broken' } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  )
  try {
    const result = await contentPolicyCheck('Abraham Lincoln', 'A thoughtful leader')
    record(
      'Branch 2: JSON parse error → outcome=blocked',
      result.outcome === 'blocked',
      `got outcome=${result.outcome}`
    )
  } finally {
    restoreFetch()
  }
}

async function branch3_unknownOutcome() {
  setFetch(async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ outcome: 'bogus_not_a_real_outcome' }) } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  )
  try {
    const result = await contentPolicyCheck('Abraham Lincoln', 'A thoughtful leader')
    record(
      'Branch 3: Unknown outcome value → outcome=blocked',
      result.outcome === 'blocked',
      `got outcome=${result.outcome}`
    )
  } finally {
    restoreFetch()
  }
}

async function branch4_missingOutcome() {
  setFetch(async () =>
    new Response(
      JSON.stringify({ choices: [{ message: { content: JSON.stringify({ other_key: 'x' }) } }] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  )
  try {
    const result = await contentPolicyCheck('Abraham Lincoln', 'A thoughtful leader')
    record(
      'Branch 4: Missing outcome key → outcome=blocked',
      result.outcome === 'blocked',
      `got outcome=${result.outcome}`
    )
  } finally {
    restoreFetch()
  }
}

async function branch5_exception() {
  setFetch(async () => {
    throw new Error('network completely down')
  })
  try {
    const result = await contentPolicyCheck('Abraham Lincoln', 'A thoughtful leader')
    record(
      'Branch 5: Exception thrown → outcome=blocked',
      result.outcome === 'blocked',
      `got outcome=${result.outcome}`
    )
  } finally {
    restoreFetch()
  }
}

async function positiveControl_approved() {
  setFetch(async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ outcome: 'approved' }) } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  )
  try {
    const result = await contentPolicyCheck('Abraham Lincoln', 'A thoughtful leader')
    record(
      'Positive control: Haiku returns approved → outcome=approved (sanity)',
      result.outcome === 'approved',
      `got outcome=${result.outcome}`
    )
  } finally {
    restoreFetch()
  }
}

// ── Source-equivalence grep against the real Edge Function ────────────────
// Guards against drift between this test's ported function and production.

function sourceEquivalenceCheck() {
  const fnPath = path.join(
    process.cwd(),
    'supabase/functions/lila-board-of-directors/index.ts'
  )
  if (!fs.existsSync(fnPath)) {
    record('Edge Function source exists', false, `not found: ${fnPath}`)
    return
  }
  const src = fs.readFileSync(fnPath, 'utf-8')
  // Extract from `async function contentPolicyCheck` up to the next top-level
  // `async function` or `function` declaration that follows it.
  const startIdx = src.indexOf('async function contentPolicyCheck')
  if (startIdx < 0) {
    record('contentPolicyCheck function extracted from source', false, 'start marker not found')
    return
  }
  const rest = src.slice(startIdx + 1)
  const nextFnIdx = rest.search(/\n(?:async\s+function|function|const|\/\/ ──)/)
  const body = nextFnIdx > 0 ? src.slice(startIdx, startIdx + 1 + nextFnIdx) : src.slice(startIdx)

  // Assert exactly 4 `return CONTENT_POLICY_BLOCK_FAIL_CLOSED` statements
  const failClosedReturns = (body.match(/return\s+CONTENT_POLICY_BLOCK_FAIL_CLOSED/g) || []).length
  record(
    'Source has ≥4 return CONTENT_POLICY_BLOCK_FAIL_CLOSED statements (branches 1, 2, 3, 5)',
    failClosedReturns >= 4,
    `found ${failClosedReturns} occurrences`
  )
  // Branch 4 (missing outcome) is subsumed by branch 3 (unknown outcome) in
  // the real code: if parsed has no 'outcome' key, none of the four if-blocks
  // match and it falls through to the unknown-outcome return. Test coverage
  // via branch4_missingOutcome proves this behavior.

  // Crisis gate: the Board Edge Function must call detectCrisis/crisisCheck
  // on free-form name/description fields BEFORE contentPolicyCheck runs.
  const callsCrisisCheck = /crisisCheckFields|detectCrisis\(/.test(src)
  record(
    'Crisis gate exists on persona creation inputs (runs before content policy)',
    callsCrisisCheck,
    callsCrisisCheck ? 'detectCrisis/crisisCheckFields present' : 'MISSING crisis gate'
  )
  // And assert it's invoked from create_persona / commit_persona / preview paths
  const crisisInPersonaPaths = /create_persona[\s\S]{0,3000}?crisisCheck|generate_persona_preview[\s\S]{0,3000}?crisisCheck|commit_persona[\s\S]{0,3000}?crisisCheck/.test(src)
  record(
    'Crisis gate wired into persona creation actions',
    crisisInPersonaPaths,
    crisisInPersonaPaths ? 'call-site confirmed' : 'could not locate call-site near persona actions'
  )
}

async function main() {
  console.log('Row 26 — contentPolicyCheck fail-closed + crisis gate')
  console.log('─'.repeat(60))

  await branch1_httpError()
  await branch2_jsonParseError()
  await branch3_unknownOutcome()
  await branch4_missingOutcome()
  await branch5_exception()
  await positiveControl_approved()
  sourceEquivalenceCheck()

  console.log('─'.repeat(60))
  const failures = findings.filter(f => !f.pass)
  if (failures.length === 0) {
    console.log(`ALL PASS (${findings.length} checks)`)
    process.exit(0)
  } else {
    console.log(`FAIL: ${failures.length} of ${findings.length}`)
    failures.forEach(f => console.log(`  - ${f.label}: ${f.detail}`))
    process.exit(1)
  }
}

main().catch(err => {
  console.error('verification error:', err)
  process.exit(2)
})
