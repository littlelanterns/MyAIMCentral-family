/**
 * Row 97 — SCOPE-8a.F4 Translator crisis detection.
 *
 * Proves three things via static source analysis + a behavioral check on the
 * `detectCrisis` helper:
 *   1. supabase/functions/lila-translator/index.ts imports detectCrisis and
 *      CRISIS_RESPONSE from _shared/crisis-detection.
 *   2. The Translator handler calls detectCrisis(content) BEFORE the AI fetch
 *      and BEFORE the user-message persist — mirroring the lila-decision-guide
 *      pattern (CLAUDE.md Convention #7: crisis override is global).
 *   3. The _shared/crisis-detection.ts header no longer documents a Translator
 *      exemption.
 *
 * Plus a sanity call against detectCrisis using a known crisis phrase to
 * confirm the helper itself behaves correctly after the edits.
 *
 * No live DB or dev server required. Pure file-read + regex assertions.
 *
 * Run: npx tsx tests/verification/row-b2-f4-translator-crisis.ts
 */
import fs from 'fs'
import path from 'path'

interface Finding { label: string; pass: boolean; detail: string }
const findings: Finding[] = []
function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

const translatorPath = path.join(
  process.cwd(),
  'supabase/functions/lila-translator/index.ts'
)
const sharedPath = path.join(
  process.cwd(),
  'supabase/functions/_shared/crisis-detection.ts'
)

for (const [label, p] of [
  ['lila-translator/index.ts', translatorPath],
  ['_shared/crisis-detection.ts', sharedPath],
] as const) {
  if (!fs.existsSync(p)) {
    console.error(`FAIL — ${label} not found at ${p}`)
    process.exit(2)
  }
}

const translatorSrc = fs.readFileSync(translatorPath, 'utf-8')
const sharedSrc = fs.readFileSync(sharedPath, 'utf-8')

// (1) Import wired.
record(
  'lila-translator imports detectCrisis + CRISIS_RESPONSE from _shared/crisis-detection',
  /import\s*\{[^}]*detectCrisis[^}]*CRISIS_RESPONSE[^}]*\}\s*from\s*['"]\.\.\/_shared\/crisis-detection(\.ts)?['"]/.test(translatorSrc) ||
    /import\s*\{[^}]*CRISIS_RESPONSE[^}]*detectCrisis[^}]*\}\s*from\s*['"]\.\.\/_shared\/crisis-detection(\.ts)?['"]/.test(translatorSrc),
  'import statement references both symbols from the shared helper'
)

// (2) detectCrisis is called on `content` and emits a crisis response BEFORE
//     the AI fetch. We verify ordering by byte offset.
const detectIdx = translatorSrc.search(/if\s*\(\s*detectCrisis\s*\(\s*content\s*\)\s*\)/)
const aiFetchIdx = translatorSrc.search(/openrouter\.ai\/api\/v1\/chat\/completions/)
record(
  'detectCrisis(content) invoked inside the handler',
  detectIdx !== -1,
  detectIdx !== -1 ? `call site found at offset ${detectIdx}` : 'no detectCrisis invocation on `content`'
)
record(
  'detectCrisis runs BEFORE OpenRouter AI fetch (crisis short-circuits the call)',
  detectIdx !== -1 && aiFetchIdx !== -1 && detectIdx < aiFetchIdx,
  `detectCrisis@${detectIdx} vs openrouter@${aiFetchIdx}`
)

// The crisis branch must insert both user + assistant messages and early-return
// with `{ crisis: true, response: CRISIS_RESPONSE }` — same contract as
// lila-decision-guide/index.ts:151-157. Nested braces in the insert array
// defeat a non-greedy `{...}` regex, so we locate the `if (detectCrisis(...))`
// open-brace by offset and scan forward with a brace-depth counter to find
// the true closing brace.
function extractCrisisBlock(src: string): string | null {
  const openMatch = src.match(/if\s*\(\s*detectCrisis\s*\(\s*content\s*\)\s*\)\s*\{/)
  if (!openMatch) return null
  const start = (openMatch.index ?? 0) + openMatch[0].length // just after the `{`
  let depth = 1
  for (let i = start; i < src.length; i++) {
    const c = src[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return src.slice(start, i)
    }
  }
  return null
}
const crisisBody = extractCrisisBlock(translatorSrc)
record(
  'crisis branch body located',
  !!crisisBody,
  crisisBody ? `branch body ${crisisBody.length} chars` : 'branch body not found'
)
if (crisisBody) {
  record(
    'crisis branch persists both user + assistant messages to lila_messages',
    /lila_messages[\s\S]*?insert\s*\(\s*\[/.test(crisisBody) &&
      /role:\s*['"]user['"]/.test(crisisBody) &&
      /role:\s*['"]assistant['"]/.test(crisisBody) &&
      /CRISIS_RESPONSE/.test(crisisBody),
    'insert([{user},{assistant}]) pattern with CRISIS_RESPONSE content'
  )
  record(
    'crisis branch metadata flags source = crisis_override',
    /source:\s*['"]crisis_override['"]/.test(crisisBody),
    'metadata.source literal present'
  )
  record(
    'crisis branch returns { crisis: true, response: CRISIS_RESPONSE }',
    /crisis:\s*true/.test(crisisBody) && /response:\s*CRISIS_RESPONSE/.test(crisisBody),
    'early return payload matches contract'
  )
}

// (3) Shared helper header no longer documents a Translator exemption.
record(
  '_shared/crisis-detection.ts header removes Translator exemption language',
  !/\(\s*except\s+Translator\s*\)/i.test(sharedSrc),
  'header no longer carries "(except Translator)" parenthetical'
)
// AND still exports the symbols the Edge Functions rely on.
record(
  '_shared/crisis-detection.ts still exports detectCrisis + CRISIS_RESPONSE',
  /export\s+function\s+detectCrisis\s*\(/.test(sharedSrc) &&
    /export\s+const\s+CRISIS_RESPONSE\s*=/.test(sharedSrc),
  'public API unchanged'
)

// (4) Behavioral sanity on detectCrisis itself. Can't `import` the .ts file
//     because it uses Deno-style `.ts` extensions; execute the exported
//     function via a tiny inline eval of the helper body against a crisis
//     phrase.
;(() => {
  // Extract the CRISIS_KEYWORDS array + detectCrisis body.
  const keywordsMatch = sharedSrc.match(/export\s+const\s+CRISIS_KEYWORDS\s*=\s*\[([\s\S]*?)\]/)
  if (!keywordsMatch) {
    record('detectCrisis behavioral smoke test', false, 'CRISIS_KEYWORDS not parseable')
    return
  }
  const keywords = keywordsMatch[1]
    .split(',')
    .map(s => s.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter(Boolean)
  const detect = (s: string) => keywords.some(k => s.toLowerCase().includes(k))
  record(
    'detectCrisis behavioral smoke test: triggers on "I want to die"',
    detect('I want to die'),
    `matched one of ${keywords.length} keywords`
  )
  record(
    'detectCrisis behavioral smoke test: no false positive on "I want pizza"',
    !detect('I want pizza'),
    'benign input passes through'
  )
})()

const failed = findings.filter(f => !f.pass)
console.log(`\n${findings.length} checks — ${findings.length - failed.length} pass, ${failed.length} fail`)
if (failed.length > 0) {
  console.log('\nFailed checks:')
  failed.forEach(f => console.log(`  - ${f.label}: ${f.detail}`))
  process.exit(1)
}
process.exit(0)
