#!/usr/bin/env node
/**
 * check-under13-aggregation.cjs
 *
 * PRD-40 aggregation-exclusion CI seed (PRD L756/L1117, decision file §4):
 * "Under-13 child data MUST NOT be included in any platform-wide,
 * cross-family, or anonymized aggregation pipeline." The PRD asks the build
 * to audit today's aggregation writers and establish the audit habit — full
 * grep enforcement lands with the first aggregation-pipeline PRD (PRD-19 /
 * PRD-28B), but from THIS script forward, any NEW Edge Function that writes
 * into the platform_intelligence schema fails CI until it is classified
 * below (guarded, or documented not-applicable).
 *
 * Mechanics (guardrail, not an AST analyzer — same class as
 * check-safe-harbor-filter.cjs):
 *   1. DETECTION: every file under supabase/functions/ (including _shared)
 *      matching a platform-intelligence WRITE signal:
 *        - `.schema('platform_intelligence')`   (direct schema writes)
 *        - a known PI-writing RPC name (PI_WRITER_RPCS below)
 *      must appear in the AUDITED registry.
 *   2. ASSERTION: each audited-guarded file must still contain its declared
 *      guard pattern(s) — removing a guard breaks the build.
 *   3. STAMP: _shared/ethics-guard.ts must keep computeIsUnder13 reading
 *      coppa_age_bracket (ruling R-2 — the bracket is the canonical under-13
 *      source; DOB/age stays as the union fallback).
 *
 * Wired into package.json `prebuild`. Standalone:
 *     node scripts/check-under13-aggregation.cjs
 * Exit codes: 0 = clean, 1 = unclassified writer or missing guard.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const FUNCTIONS_DIR = path.join(ROOT, 'supabase', 'functions')

// RPC names that WRITE into platform_intelligence (extend when new ones appear).
const PI_WRITER_RPCS = ['insert_ethics_pattern_candidate', 'upsert_book_library']

/**
 * The audit registry. Keys are paths relative to supabase/functions/.
 *  - kind 'guarded': `guards` are regexes that must ALL match the file.
 *  - kind 'not_applicable': `why` documents the classification (the file
 *    writes book/platform content, not member data).
 * A detected file absent from this registry FAILS the check — classify it.
 */
const AUDITED = {
  'validate-ai-output/index.ts': {
    kind: 'guarded',
    guards: [
      // Harvest gate: pattern-library candidates never drawn from an
      // under-13 member's surface (PRD-41 Slice E, PRD-40 exclusion).
      /!row\.member_is_under_13/,
    ],
  },
  'lila-board-of-directors/index.ts': {
    kind: 'guarded',
    guards: [
      // BOTH persona_promotion_queue insert sites are gated on
      // computeIsUnder13 (PRD-40 Slice 5) — asserted per-site below via
      // countPromotionGuards(), this regex just pins the import.
      /computeIsUnder13/,
    ],
  },
  'bookshelf-process/index.ts': {
    kind: 'not_applicable',
    why: 'Writes book CONTENT (platform_intelligence.book_library/book_chunks) — published-book text, not member data. No member attribution enters the platform cache (Channel E design).',
  },
  'bookshelf-extract/index.ts': {
    kind: 'not_applicable',
    why: 'Writes book extraction CONTENT (platform_intelligence.book_extractions) — derived from published-book text, not member data.',
  },
}

function die(msg) {
  console.error('')
  console.error('  ❌ ' + msg)
  console.error('')
  process.exit(1)
}

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (e.name.endsWith('.ts')) out.push(p)
  }
  return out
}

if (!fs.existsSync(FUNCTIONS_DIR)) die(`Functions directory not found: ${FUNCTIONS_DIR}`)

const failures = []
const files = walk(FUNCTIONS_DIR)

// ── 1 + 2. Detection sweep + guard assertions ──────────────────────────────
for (const filePath of files) {
  const rel = path.relative(FUNCTIONS_DIR, filePath).replace(/\\/g, '/')
  const text = fs.readFileSync(filePath, 'utf8')

  const writesPi =
    /\.schema\(\s*['"]platform_intelligence['"]\s*\)/.test(text) ||
    PI_WRITER_RPCS.some((rpc) => text.includes(`'${rpc}'`) || text.includes(`"${rpc}"`))

  // coppa-cascade-plan.ts names the persona_promotion_queue TABLE (scrub
  // classification) without writing to it — string-table registries are not
  // writers.
  if (rel === '_shared/coppa-cascade-plan.ts') continue

  if (!writesPi) continue

  const entry = AUDITED[rel]
  if (!entry) {
    failures.push(
      `${rel}: writes to platform_intelligence but is NOT in the AUDITED registry — ` +
        `classify it in scripts/check-under13-aggregation.cjs (guarded with an under-13 ` +
        `exclusion, or not_applicable with a documented justification).`,
    )
    continue
  }
  if (entry.kind === 'guarded') {
    for (const g of entry.guards) {
      if (!g.test(text)) {
        failures.push(`${rel}: declared guard pattern ${g} no longer matches — the under-13 exclusion was removed or renamed.`)
      }
    }
  }
}

// ── 2b. Per-site guard on the persona promotion queue inserts ──────────────
{
  const bodPath = path.join(FUNCTIONS_DIR, 'lila-board-of-directors', 'index.ts')
  if (fs.existsSync(bodPath)) {
    const text = fs.readFileSync(bodPath, 'utf8')
    const insertSites = (text.match(/from\(\s*['"]persona_promotion_queue['"]\s*\)/g) || []).length
    // Each insert site sits inside an `if (... === 'yes' && !(await computeIsUnder13(...)))` block.
    const guardedConditions = (text.match(/=== 'yes' && !\(await computeIsUnder13\(/g) || []).length
    if (insertSites === 0) {
      failures.push('lila-board-of-directors/index.ts: expected persona_promotion_queue insert sites not found — update this check.')
    } else if (guardedConditions < insertSites) {
      failures.push(
        `lila-board-of-directors/index.ts: ${insertSites} persona_promotion_queue insert site(s) but only ` +
          `${guardedConditions} computeIsUnder13-guarded condition(s) — every cross-family promotion write ` +
          `must exclude under-13 authors (PRD-40 L756).`,
      )
    }
  }
}

// ── 3. The canonical stamp (ruling R-2) ────────────────────────────────────
{
  const egPath = path.join(FUNCTIONS_DIR, '_shared', 'ethics-guard.ts')
  const text = fs.existsSync(egPath) ? fs.readFileSync(egPath, 'utf8') : ''
  if (!/coppa_age_bracket/.test(text)) {
    failures.push('_shared/ethics-guard.ts: computeIsUnder13 no longer reads coppa_age_bracket — ruling R-2 makes the bracket the canonical under-13 source.')
  }
  if (!/member_is_under_13/.test(text)) {
    failures.push('_shared/ethics-guard.ts: the member_is_under_13 stamp is gone from enqueueOutputScan.')
  }
}

if (failures.length) {
  console.error('')
  console.error('════════════════════════════════════════════════════════════════')
  console.error('  PRD-40 under-13 aggregation-exclusion check FAILED')
  console.error('════════════════════════════════════════════════════════════════')
  console.error('')
  for (const f of failures) console.error('    ' + f)
  console.error('')
  die('Under-13 child data must never enter a cross-family/platform aggregation pipeline (PRD-40 L756).')
}

const audited = Object.keys(AUDITED).length
console.log(`✓ Under-13 aggregation-exclusion check passed — ${files.length} files scanned, ${audited} platform-intelligence writers audited`)
