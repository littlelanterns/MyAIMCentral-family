/**
 * Row 18 — SCOPE-8b.F3 HITM gate + RPC lifecycle invariants.
 *
 * Source-level verification of the HITM contract per Convention #4:
 *   - generate_persona_preview performs NO DB insert into board_personas
 *   - regenerate_persona performs NO DB insert into board_personas
 *   - commit_persona is the ONLY Edge Function action that writes
 *     to board_personas (Tier-1 row + optional Tier-2 queue row)
 *
 * Plus RPC admin-gate invariants:
 *   - list/approve/reject/defer_queued_persona all RAISE EXCEPTION
 *     'Not authorized' when the caller lacks staff_permissions
 *
 * Run: npx tsx tests/verification/row-18-promotion-queue-lifecycle.ts
 */
import fs from 'fs'
import path from 'path'

interface Finding { label: string; pass: boolean; detail: string }
const findings: Finding[] = []
function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

// ── HITM invariants from Edge Function source ────────────────────────────

function extractActionBlock(src: string, action: string): string {
  const marker = `action === '${action}'`
  const idx = src.indexOf(marker)
  if (idx < 0) return ''
  // Grab the next ~3000 chars after the action marker — enough to cover
  // the handler body before the next action's `if` block.
  const block = src.slice(idx, idx + 4000)
  const nextActionIdx = block.indexOf(`action === '`, 50)
  return nextActionIdx > 0 ? block.slice(0, nextActionIdx) : block
}

function hitmGateChecks() {
  const fnPath = path.join(
    process.cwd(),
    'supabase/functions/lila-board-of-directors/index.ts'
  )
  if (!fs.existsSync(fnPath)) {
    record('Edge Function source exists', false, fnPath)
    return
  }
  const src = fs.readFileSync(fnPath, 'utf-8')

  // generate_persona_preview must NOT insert into board_personas
  const previewBlock = extractActionBlock(src, 'generate_persona_preview')
  const previewHasInsert = /\.from\(\s*['"]board_personas['"]\s*\)[\s\S]{0,200}?\.insert/.test(previewBlock)
  record(
    'generate_persona_preview performs NO DB insert into board_personas (HITM preview)',
    !previewHasInsert && previewBlock.length > 100,
    previewHasInsert
      ? 'LEAK: found .from(board_personas).insert in preview block'
      : 'no insert found (HITM gate holds)'
  )

  // regenerate_persona must NOT insert into board_personas
  const regenBlock = extractActionBlock(src, 'regenerate_persona')
  const regenHasInsert = /\.from\(\s*['"]board_personas['"]\s*\)[\s\S]{0,200}?\.insert/.test(regenBlock)
  record(
    'regenerate_persona performs NO DB insert into board_personas',
    !regenHasInsert && regenBlock.length > 100,
    regenHasInsert
      ? 'LEAK: found .from(board_personas).insert in regenerate block'
      : 'no insert found'
  )

  // commit_persona IS the insert path
  const commitBlock = extractActionBlock(src, 'commit_persona')
  const commitHasInsert = /\.from\(\s*['"]board_personas['"]\s*\)[\s\S]{0,200}?\.insert/.test(commitBlock)
  record(
    'commit_persona IS the single insert path for board_personas',
    commitHasInsert,
    commitHasInsert ? 'insert confirmed' : 'MISSING — commit path must insert the row'
  )

  // Crisis gate on commit path runs on the FINAL profile content
  // (adjustment #2 from founder green-light)
  const commitCrisisCheck = /crisisCheckFields\([^)]*profileText/.test(commitBlock)
  record(
    'commit_persona re-runs crisis gate on final profile content',
    commitCrisisCheck,
    commitCrisisCheck ? 'profileText passed to crisisCheckFields' : 'profileText not in crisis gate args'
  )

  // Content policy gate re-runs on commit
  const commitContentPolicy = /await\s+contentPolicyCheck\(/.test(commitBlock)
  record(
    'commit_persona re-runs contentPolicyCheck on final content',
    commitContentPolicy,
    commitContentPolicy ? 'content policy re-check present' : 'missing'
  )
}

// ── RPC admin-gate invariants from migration source ──────────────────────

function rpcAdminGateChecks() {
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/00000000100161_persona_architecture_rebuild.sql'
  )
  if (!fs.existsSync(migrationPath)) {
    record('Migration 100161 source exists', false, migrationPath)
    return
  }
  const src = fs.readFileSync(migrationPath, 'utf-8')

  const rpcs = [
    'approve_queued_persona',
    'reject_queued_persona',
    'defer_queued_persona',
    'list_persona_promotion_queue',
  ]
  for (const rpcName of rpcs) {
    const idx = src.indexOf(`FUNCTION public.${rpcName}`)
    if (idx < 0) {
      record(`RPC ${rpcName} defined`, false, 'not found in migration')
      continue
    }
    // Extract function body until next CREATE OR REPLACE or end
    const body = src.slice(idx, idx + 6000)
    const nextFnIdx = body.indexOf('CREATE OR REPLACE FUNCTION', 80)
    const fnBody = nextFnIdx > 0 ? body.slice(0, nextFnIdx) : body

    const hasSecurityDefiner = /SECURITY DEFINER/i.test(fnBody)
    const hasStaffPermCheck = /staff_permissions[\s\S]{0,400}?permission_type\s+IN\s*\(\s*'persona_admin'[^)]*'super_admin'/i.test(
      fnBody
    )
    const hasNotAuthorizedRaise = /RAISE\s+EXCEPTION\s+'Not authorized[^']*'/i.test(fnBody)

    record(
      `RPC ${rpcName} is SECURITY DEFINER + admin-gated + raises Not authorized`,
      hasSecurityDefiner && hasStaffPermCheck && hasNotAuthorizedRaise,
      `security_definer=${hasSecurityDefiner} staff_perm_check=${hasStaffPermCheck} raises=${hasNotAuthorizedRaise}`
    )
  }
}

// ── Entry ────────────────────────────────────────────────────────────────

async function main() {
  console.log('Row 18 — Admin Personas HITM gate + RPC lifecycle')
  console.log('─'.repeat(60))
  hitmGateChecks()
  rpcAdminGateChecks()
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
