#!/usr/bin/env node
/**
 * check-function-jwt-config.cjs
 *
 * Fails the build if any Edge Function in supabase/functions/ is missing
 * a `[functions.NAME] verify_jwt = false` entry in supabase/supabase/config.toml.
 *
 * Why this exists
 * ───────────────
 * The Supabase CLI defaults `verify_jwt = true` on every `functions deploy`.
 * Every function in this repo handles its own auth via _shared/auth.ts, so
 * the platform-level JWT check is redundant and — empirically — breaks
 * authenticated browser calls with 401 (discovered 2026-04-08 with
 * mindsweep-sort). The fix is to pin `verify_jwt = false` per function in
 * config.toml. This script guarantees nobody forgets when adding a new
 * function.
 *
 * Wired into package.json `prebuild`, so it runs before every `npm run build`
 * (local and Vercel). Also runnable standalone:
 *
 *     node scripts/check-function-jwt-config.cjs
 *
 * Exit codes:
 *   0 — every function has a config entry with verify_jwt = false
 *   1 — at least one function is missing, or its entry has verify_jwt = true
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const FUNCTIONS_DIR = path.join(ROOT, 'supabase', 'functions')
const CONFIG_PATH = path.join(ROOT, 'supabase', 'supabase', 'config.toml')

function die(msg, code = 1) {
  console.error('')
  console.error('  ❌ ' + msg)
  console.error('')
  process.exit(code)
}

// ── Step 1: enumerate functions ──
if (!fs.existsSync(FUNCTIONS_DIR)) {
  die(`Functions directory not found: ${FUNCTIONS_DIR}`)
}

const entries = fs.readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
const functionNames = entries
  .filter(e => e.isDirectory() && e.name !== '_shared')
  .map(e => e.name)
  .sort()

if (functionNames.length === 0) {
  die('No Edge Functions found under supabase/functions/')
}

// ── Step 2: read and parse config.toml ──
if (!fs.existsSync(CONFIG_PATH)) {
  die(`config.toml not found: ${CONFIG_PATH}`)
}

const configText = fs.readFileSync(CONFIG_PATH, 'utf8')

/**
 * Minimal per-function config parser — we only care about the
 * [functions.NAME] sections and their verify_jwt value. Full TOML parsing
 * would need a library; this is a targeted regex scan.
 *
 * Matches:
 *   [functions.my-function]
 *   verify_jwt = false
 *
 * Returns a Map<functionName, { verify_jwt: boolean | null }>.
 */
function parseFunctionSections(text) {
  const result = new Map()
  const sectionRegex = /\[functions\.([a-zA-Z0-9_-]+)\]\s*\n((?:[^\n[]*\n?)*)/g
  let match
  while ((match = sectionRegex.exec(text)) !== null) {
    const name = match[1]
    const body = match[2] || ''
    const verifyMatch = body.match(/verify_jwt\s*=\s*(true|false)/)
    const verifyJwt = verifyMatch ? verifyMatch[1] === 'true' : null
    result.set(name, { verify_jwt: verifyJwt })
  }
  return result
}

const configured = parseFunctionSections(configText)

// ── Step 3: diff ──
const missing = []
const wrong = []
const stale = []

for (const name of functionNames) {
  if (!configured.has(name)) {
    missing.push(name)
    continue
  }
  const entry = configured.get(name)
  if (entry.verify_jwt === null) {
    wrong.push({ name, reason: 'has section but no verify_jwt setting' })
  } else if (entry.verify_jwt === true) {
    wrong.push({ name, reason: 'verify_jwt = true (must be false)' })
  }
}

// Detect config entries for functions that no longer exist (cleanup hint)
for (const configuredName of configured.keys()) {
  if (!functionNames.includes(configuredName)) {
    stale.push(configuredName)
  }
}

// ── Step 4: report ──
const hasErrors = missing.length > 0 || wrong.length > 0

if (hasErrors) {
  console.error('')
  console.error('════════════════════════════════════════════════════════════════')
  console.error('  Edge Function verify_jwt config check FAILED')
  console.error('════════════════════════════════════════════════════════════════')
  console.error('')
  console.error('  Every Edge Function must have this in config.toml:')
  console.error('')
  console.error('      [functions.NAME]')
  console.error('      verify_jwt = false')
  console.error('')
  console.error('  Why: the Supabase CLI defaults verify_jwt = true on deploy,')
  console.error('  which makes the platform reject valid authenticated browser')
  console.error('  requests with 401 before they reach your function. Every')
  console.error('  function in this repo handles its own auth via')
  console.error('  _shared/auth.ts, so pin verify_jwt = false here.')
  console.error('')

  if (missing.length > 0) {
    console.error('  Missing config entries:')
    for (const name of missing) {
      console.error(`    • ${name}`)
    }
    console.error('')
  }

  if (wrong.length > 0) {
    console.error('  Entries with wrong setting:')
    for (const { name, reason } of wrong) {
      console.error(`    • ${name} — ${reason}`)
    }
    console.error('')
  }

  console.error('  Add the missing entries under the "Edge Function per-function')
  console.error('  settings" section near the bottom of supabase/supabase/config.toml')
  console.error('  and re-run the build.')
  console.error('')
  console.error('════════════════════════════════════════════════════════════════')
  console.error('')
  process.exit(1)
}

// ── Success ──
console.log(`✓ verify_jwt config check passed — ${functionNames.length} Edge Functions covered`)

if (stale.length > 0) {
  console.log('')
  console.log('  Note: config.toml has entries for functions that no longer exist:')
  for (const name of stale) {
    console.log(`    • ${name}  (safe to remove)`)
  }
  console.log('  These are not an error, but you can clean them up when convenient.')
}

process.exit(0)
