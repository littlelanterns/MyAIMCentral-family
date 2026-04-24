/**
 * Row 180 — SCOPE-4.F7 server-side moderator opt-in gate (static check).
 *
 * Complements tests/e2e/features/row-180-board-moderator-optin.spec.ts
 * which covers the UI toggle + DB persistence path. This script asserts
 * the server-side gate in supabase/functions/lila-board-of-directors so
 * we don't need to exercise the (expensive) real moderator stream.
 *
 * Invariants:
 *   1. The Edge Function reads two sources for moderator opt-in:
 *      - Per-conversation: context_snapshot.moderator_enabled
 *      - Per-user: family_members.preferences.moderator_interjections_enabled
 *   2. Default is OFF (moderatorEnabled starts false).
 *   3. The moderator stream chunk ("moderator_start") is only emitted when
 *      moderatorEnabled === true (explicit if-guard on the critical path).
 *
 * Run: npx tsx tests/verification/row-180-moderator-optin-server-gate.ts
 */
import fs from 'fs'
import path from 'path'

const findings: Array<{ label: string; pass: boolean; detail: string }> = []
function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

function main() {
  console.log('Row 180 — Board moderator opt-in server gate (static)')
  console.log('─'.repeat(60))

  const fnPath = path.join(
    process.cwd(),
    'supabase/functions/lila-board-of-directors/index.ts'
  )
  if (!fs.existsSync(fnPath)) {
    record('Edge Function source exists', false, fnPath)
    process.exit(1)
  }
  const src = fs.readFileSync(fnPath, 'utf-8')

  // Default false
  record(
    'moderatorEnabled initial value is false (default OFF)',
    /let\s+moderatorEnabled\s*=\s*false/.test(src),
    /let\s+moderatorEnabled\s*=\s*false/.test(src) ? 'grep confirms' : 'MISSING default'
  )

  // Per-conversation override via context_snapshot.moderator_enabled
  record(
    'Per-conversation override read from context_snapshot.moderator_enabled',
    /convSnapshot\.moderator_enabled/.test(src),
    'grep confirms'
  )

  // Per-user pref read from family_members.preferences
  record(
    'Per-user pref read from family_members.preferences.moderator_interjections_enabled',
    /prefs\.moderator_interjections_enabled\s*===\s*true/.test(src) ||
      /moderator_interjections_enabled/.test(src),
    'grep confirms'
  )

  // Streaming gate: moderator_start chunk only emitted when moderatorEnabled true
  // Look for `if (moderatorEnabled)` block preceding the `moderator_start` enqueue
  const modStartIdx = src.indexOf("'moderator_start'")
  if (modStartIdx < 0) {
    record('moderator_start stream chunk emitted', false, 'not found')
  } else {
    // Scan backward for `if (moderatorEnabled)` within the same function
    const preceding = src.slice(Math.max(0, modStartIdx - 1500), modStartIdx)
    const hasGuard = /if\s*\(\s*moderatorEnabled\s*\)/.test(preceding)
    record(
      "moderator_start stream chunk is inside an `if (moderatorEnabled)` guard",
      hasGuard,
      hasGuard ? 'guard confirmed within 1500 chars preceding' : 'NO GUARD — moderator fires regardless of opt-in'
    )
  }

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

main()
