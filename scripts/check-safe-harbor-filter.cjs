#!/usr/bin/env node
/**
 * check-safe-harbor-filter.cjs
 *
 * Convention #243 (Safe Harbor aggregation-exclusion guardrail): "All
 * queries against `lila_conversations` used for aggregation, reporting, or
 * context assembly MUST filter `is_safe_harbor = false` unless the query is
 * explicitly scoped to a Safe Harbor history view. ... grep-based CI check
 * and RLS/view guard implementation land with the first aggregation PRD
 * build (PRD-19, PRD-28B, or PRD-30 — whichever ships first)." PRD-30
 * shipped first (SM-A, 2026-07). This is that check.
 *
 * Scope: server-side Edge Functions only (supabase/functions/*\/index.ts).
 * Client-side src/ code always runs under the authenticated user's session,
 * where RLS already enforces the filter at the database level (lc_select_
 * parent's `is_safe_harbor = false` predicate, migration 7) — a second
 * static check there would be redundant with a real, already-enforced
 * guarantee. Edge Functions matter because service-role Supabase clients
 * BYPASS RLS entirely, so a broad service-role query against
 * lila_conversations is the one place an aggregation could silently leak
 * Safe Harbor content.
 *
 * Heuristic (this is a guardrail, not a full AST analyzer): for every
 * `.from('lila_conversations')` call site in a server-side Edge Function,
 * look at a window of the following lines for either:
 *   (a) `.eq('id', ...)` — a single-row lookup by primary key, not an
 *       aggregation/reporting query. Always safe, no filter needed.
 *   (b) `is_safe_harbor` appearing anywhere in the window — explicitly
 *       filtered (or explicitly scoped to Safe Harbor rows on purpose).
 * A call site matching neither is flagged, UNLESS its containing file is in
 * the ALLOWLIST below (each entry requires the human-readable justification
 * documented alongside it — safety scanning is the one documented,
 * deliberate exception per Convention #243 / feature decision file §J5).
 *
 * Wired into package.json `prebuild`. Also runnable standalone:
 *     node scripts/check-safe-harbor-filter.cjs
 *
 * Exit codes: 0 = clean, 1 = at least one un-allowlisted broad query found.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const FUNCTIONS_DIR = path.join(ROOT, 'supabase', 'functions')
const WINDOW_LINES = 15

// Convention #243's documented, deliberate exception: safety scanning is
// per-message safety processing, the same class as the global crisis
// override (Convention #7), NOT data aggregation/reporting/context
// assembly — it must see EVERY conversation regardless of is_safe_harbor
// (safety trumps privacy for crisis indicators; the flag row itself
// carries a defensive is_safe_harbor boolean excluded from any future
// aggregation, per feature decision file §J5 point 2).
const ALLOWLIST = new Set([
  'safety-classify/index.ts', // PRD-30 — documented exception, see header above
])

function die(msg, code = 1) {
  console.error('')
  console.error('  ❌ ' + msg)
  console.error('')
  process.exit(code)
}

if (!fs.existsSync(FUNCTIONS_DIR)) {
  die(`Functions directory not found: ${FUNCTIONS_DIR}`)
}

const functionDirs = fs
  .readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
  .filter(e => e.isDirectory() && e.name !== '_shared')
  .map(e => e.name)

const flagged = []

for (const dirName of functionDirs) {
  const indexPath = path.join(FUNCTIONS_DIR, dirName, 'index.ts')
  if (!fs.existsSync(indexPath)) continue
  const relFile = `${dirName}/index.ts`
  const text = fs.readFileSync(indexPath, 'utf8')
  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    if (!/\.from\(\s*['"]lila_conversations['"]\s*\)/.test(lines[i])) continue

    const windowEnd = Math.min(lines.length, i + WINDOW_LINES)
    const windowText = lines.slice(i, windowEnd).join('\n')

    const isSingleRowLookup = /\.eq\(\s*['"]id['"]\s*,/.test(windowText)
    const hasSafeHarborFilter = /is_safe_harbor/.test(windowText)

    if (isSingleRowLookup || hasSafeHarborFilter) continue
    if (ALLOWLIST.has(relFile)) continue

    flagged.push({ file: relFile, line: i + 1 })
  }
}

if (flagged.length > 0) {
  console.error('')
  console.error('════════════════════════════════════════════════════════════════')
  console.error('  Convention #243 Safe Harbor filter check FAILED')
  console.error('════════════════════════════════════════════════════════════════')
  console.error('')
  console.error('  Every broad (non-single-row) service-role query against')
  console.error('  lila_conversations must filter is_safe_harbor = false, unless')
  console.error('  the query is explicitly scoped to a Safe Harbor history view')
  console.error('  or the file is added to the ALLOWLIST in this script with a')
  console.error('  documented justification (see scripts/check-safe-harbor-filter.cjs).')
  console.error('')
  for (const f of flagged) {
    console.error(`    ${f.file}:${f.line}`)
  }
  console.error('')
  die('Add an is_safe_harbor filter, scope the query to .eq(\'id\', ...), or allowlist with justification.')
}

console.log(`✓ Safe Harbor filter check passed — ${functionDirs.length} Edge Functions scanned, 0 unguarded aggregation queries`)
