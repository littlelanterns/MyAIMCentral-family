/**
 * Row 4 — SCOPE-8a.F6 DailyCelebration HITM gate.
 *
 * Proves four things via static source analysis:
 *   1. DailyCelebration.tsx declares a narrativeApproved state that defaults
 *      to false (HITM gate exists).
 *   2. handleDone() guards the saveCelebrationMutation.mutate call with
 *      narrativeApproved === true — i.e., Done without explicit Approve does
 *      NOT persist the AI-generated narrative to victory_celebrations.
 *      (CLAUDE.md Convention #4 compliance.)
 *   3. handleShareWithMom() is also guarded by narrativeApproved.
 *   4. A NarrativeHITM component renders Edit / Approve / Regenerate / Reject
 *      actions, with Edit hidden in Play shell per founder decision.
 *
 * No live DB or dev server required. Pure file-read + regex assertions.
 *
 * Run: npx tsx tests/verification/row-b2-f6-dailycelebration-hitm.ts
 */
import fs from 'fs'
import path from 'path'

interface Finding { label: string; pass: boolean; detail: string }
const findings: Finding[] = []
function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

const targetPath = path.join(
  process.cwd(),
  'src/components/victories/DailyCelebration.tsx'
)

if (!fs.existsSync(targetPath)) {
  console.error(`FAIL — source not found at ${targetPath}`)
  process.exit(2)
}

const src = fs.readFileSync(targetPath, 'utf-8')

// (1) narrativeApproved state declared with default false.
record(
  'narrativeApproved state declared with default false',
  /const\s+\[\s*narrativeApproved\s*,\s*setNarrativeApproved\s*\]\s*=\s*useState\s*(<[^>]+>)?\s*\(\s*false\s*\)/.test(src),
  'useState(false) found'
)

// (2) handleDone gated by narrativeApproved before mutate.
// Extract the handleDone body (between the signature and the closing brace of onClose() call).
const handleDoneMatch = src.match(/function\s+handleDone\s*\([^)]*\)\s*\{[\s\S]*?onClose\s*\(\s*\)\s*\}/)
record(
  'handleDone body located',
  !!handleDoneMatch,
  handleDoneMatch ? 'signature + body found' : 'signature not found'
)
if (handleDoneMatch) {
  const body = handleDoneMatch[0]
  const hasMutate = /saveCelebrationMutation\.mutate\s*\(/.test(body)
  const hasGuard = /narrativeApproved/.test(body)
  record(
    'handleDone guards saveCelebrationMutation.mutate with narrativeApproved',
    hasMutate && hasGuard,
    `mutate=${hasMutate} guard=${hasGuard}`
  )
  // Make sure the guard actually gates the mutate call (mutate should not
  // appear outside an `if (...narrativeApproved...)` block).
  const ifGuardPattern = /if\s*\([^)]*narrativeApproved[^)]*\)\s*\{[\s\S]*?saveCelebrationMutation\.mutate/
  record(
    'handleDone wraps mutate in `if (...narrativeApproved...)` block',
    ifGuardPattern.test(body),
    'mutate call is inside an approval-guarded conditional'
  )
}

// (3) handleShareWithMom also gated.
const shareMatch = src.match(/async\s+function\s+handleShareWithMom\s*\([^)]*\)\s*\{[\s\S]*?setSharedWithMom\s*\(\s*true\s*\)/)
record(
  'handleShareWithMom body located',
  !!shareMatch,
  shareMatch ? 'signature + body found' : 'signature not found'
)
if (shareMatch) {
  const body = shareMatch[0]
  record(
    'handleShareWithMom early-returns when narrativeApproved === false',
    /if\s*\(\s*!\s*narrativeApproved\s*\)\s*return/.test(body),
    'explicit `if (!narrativeApproved) return` guard present'
  )
}

// (4) NarrativeHITM component renders all 4 actions + Play-shell Edit gating.
const hitmMatch = src.match(/function\s+NarrativeHITM\s*\(\s*\{[\s\S]*?\}\s*\)\s*\{[\s\S]*?\n\}/)
record(
  'NarrativeHITM helper component present',
  !!hitmMatch,
  hitmMatch ? 'component definition found' : 'component missing'
)
if (hitmMatch) {
  const body = hitmMatch[0]
  record(
    'NarrativeHITM wires Approve handler',
    /onApprove/.test(body) && /onClick=\{onApprove\}/.test(body),
    'Approve button present and bound'
  )
  record(
    'NarrativeHITM wires Regenerate handler',
    /onClick=\{onRegenerate\}/.test(body),
    'Regenerate button present and bound'
  )
  record(
    'NarrativeHITM wires Reject handler',
    /onClick=\{onReject\}/.test(body),
    'Reject button present and bound'
  )
  record(
    'NarrativeHITM wires Start Edit handler (guarded by !isPlay)',
    /\{\s*!\s*isPlay\s*&&[\s\S]*?onClick=\{onStartEdit\}/.test(body),
    'Edit button gated by !isPlay (Play shell read-only)'
  )
  record(
    'NarrativeHITM exposes Save + Cancel during edit mode',
    /onClick=\{onSaveEdit\}/.test(body) && /onClick=\{onCancelEdit\}/.test(body),
    'Save + Cancel buttons bound'
  )
}

// Summary
const failed = findings.filter(f => !f.pass)
console.log(`\n${findings.length} checks — ${findings.length - failed.length} pass, ${failed.length} fail`)
if (failed.length > 0) {
  console.log('\nFailed checks:')
  failed.forEach(f => console.log(`  - ${f.label}: ${f.detail}`))
  process.exit(1)
}
process.exit(0)
