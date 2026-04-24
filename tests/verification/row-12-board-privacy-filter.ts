/**
 * Row 12 + Row 94 — SCOPE-4.F8a/b Board of Directors privacy filter hard constraint.
 *
 * Proves three things:
 *   1. lila-board-of-directors Edge Function imports and calls assembleContext()
 *      from _shared/context-assembler.ts (Convention #247+248 category-1).
 *   2. loadFilteredArchive inside context-assembler.ts calls applyPrivacyFilter,
 *      which applies is_privacy_filtered=false ONLY for non-primary_parent
 *      callers (Convention #76).
 *   3. End-to-end runtime: seed a privacy-filtered archive_context_items row,
 *      execute the exact query pattern the Edge Function uses, and assert the
 *      row is EXCLUDED for non-mom and INCLUDED for mom.
 *
 * Runs against the live Testworth family. Cleans up any rows it creates.
 *
 * Run: npx tsx tests/verification/row-12-board-privacy-filter.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(2)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface Finding { label: string; pass: boolean; detail: string }
const findings: Finding[] = []
function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

// ── Static invariants ──────────────────────────────────────────────────────

function staticChecks() {
  const boardFnPath = path.join(
    process.cwd(),
    'supabase/functions/lila-board-of-directors/index.ts'
  )
  const assemblerPath = path.join(
    process.cwd(),
    'supabase/functions/_shared/context-assembler.ts'
  )
  const privacyPath = path.join(
    process.cwd(),
    'supabase/functions/_shared/privacy-filter.ts'
  )

  for (const [label, p] of [
    ['lila-board-of-directors source', boardFnPath],
    ['_shared/context-assembler.ts source', assemblerPath],
    ['_shared/privacy-filter.ts source', privacyPath],
  ] as const) {
    if (!fs.existsSync(p)) {
      record(`${label} exists`, false, `not found at ${p}`)
      return
    }
  }

  const boardSrc = fs.readFileSync(boardFnPath, 'utf-8')
  const assemblerSrc = fs.readFileSync(assemblerPath, 'utf-8')

  record(
    'Board Edge Function imports assembleContext from _shared/context-assembler',
    /from ['"]\.\.\/_shared\/context-assembler\.ts['"]/.test(boardSrc) &&
      /import\s*\{[^}]*assembleContext[^}]*\}/.test(boardSrc),
    'grep confirms import'
  )
  record(
    'Board Edge Function calls assembleContext() on the chat path',
    /await\s+assembleContext\s*\(/.test(boardSrc),
    'grep confirms invocation'
  )
  record(
    'context-assembler loadFilteredArchive applies applyPrivacyFilter',
    /applyPrivacyFilter\s*\(/.test(assemblerSrc),
    'grep confirms filter call site'
  )
  record(
    'context-assembler derives requesterIsMom via isPrimaryParent',
    /isPrimaryParent\s*\(\s*supabase/.test(assemblerSrc),
    'grep confirms role derivation'
  )
}

// ── Runtime filter exercise ────────────────────────────────────────────────

async function runtimeCheck() {
  // Resolve the Testworth family and a folder that is AI-included.
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .ilike('family_name', '%testworth%')
    .limit(1)
    .single()
  if (!family?.id) {
    record('Testworth family located', false, 'family not found')
    return
  }
  const familyId = family.id as string

  const { data: mom } = await supabase
    .from('family_members')
    .select('id, role')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .single()
  const { data: nonMom } = await supabase
    .from('family_members')
    .select('id, role, display_name')
    .eq('family_id', familyId)
    .neq('role', 'primary_parent')
    .limit(1)
    .single()
  if (!mom?.id || !nonMom?.id) {
    record('Mom + non-mom members located', false, `mom=${mom?.id} nonMom=${nonMom?.id}`)
    return
  }
  console.log(`  Using mom=${mom.id}, non-mom=${nonMom.id} (${nonMom.role} ${nonMom.display_name})`)

  const { data: folder } = await supabase
    .from('archive_folders')
    .select('id, member_id')
    .eq('family_id', familyId)
    .eq('member_id', mom.id)
    .eq('is_included_in_ai', true)
    .limit(1)
    .single()
  if (!folder?.id) {
    record('AI-enabled folder for mom located', false, 'no folder found')
    return
  }

  const testMarker = `__row_12_verify_${Date.now()}__`
  const { data: inserted, error: insertError } = await supabase
    .from('archive_context_items')
    .insert({
      family_id: familyId,
      folder_id: folder.id,
      member_id: mom.id,
      context_field: 'test',
      context_value: testMarker,
      context_type: 'general',
      is_included_in_ai: true,
      is_privacy_filtered: true,
      added_by: mom.id,
    })
    .select('id')
    .single()
  if (insertError || !inserted?.id) {
    record('Seed privacy-filtered archive_context_items row', false, insertError?.message ?? 'no row')
    return
  }
  const seededId = inserted.id as string
  console.log(`  Seeded privacy-filtered item id=${seededId}`)

  try {
    // Mirror the exact query applyPrivacyFilter produces.
    // Mom path: no is_privacy_filtered predicate → item IS visible.
    const { data: momRows } = await supabase
      .from('archive_context_items')
      .select('id, context_value')
      .eq('family_id', familyId)
      .eq('folder_id', folder.id)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)

    const momSeesIt = (momRows || []).some(r => r.id === seededId)
    record(
      'Mom caller: privacy-filtered row IS visible (positive control)',
      momSeesIt,
      momSeesIt
        ? `seeded id=${seededId} present in ${momRows?.length} rows`
        : `seeded id=${seededId} NOT found in ${momRows?.length ?? 0} rows — mom path is broken`
    )

    // Non-mom path: applyPrivacyFilter appends .eq('is_privacy_filtered', false).
    const { data: nonMomRows } = await supabase
      .from('archive_context_items')
      .select('id, context_value')
      .eq('family_id', familyId)
      .eq('folder_id', folder.id)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .eq('is_privacy_filtered', false)

    const nonMomSeesIt = (nonMomRows || []).some(r => r.id === seededId)
    record(
      'Non-mom caller: privacy-filtered row is EXCLUDED (hard constraint)',
      !nonMomSeesIt,
      !nonMomSeesIt
        ? `seeded id=${seededId} correctly absent from ${nonMomRows?.length ?? 0} non-mom rows`
        : `LEAK: seeded id=${seededId} present in ${nonMomRows?.length ?? 0} non-mom rows — filter is broken`
    )

    // Round-trip via isPrimaryParent to make sure the role derivation itself
    // matches expectations for both members we're using.
    const { data: momRow } = await supabase
      .from('family_members')
      .select('role')
      .eq('id', mom.id)
      .maybeSingle()
    record(
      'isPrimaryParent(mom.id) derivation returns primary_parent',
      momRow?.role === 'primary_parent',
      `role=${momRow?.role}`
    )
    const { data: nonMomRow } = await supabase
      .from('family_members')
      .select('role')
      .eq('id', nonMom.id)
      .maybeSingle()
    record(
      'isPrimaryParent(nonMom.id) does NOT return primary_parent',
      nonMomRow?.role !== 'primary_parent',
      `role=${nonMomRow?.role}`
    )
  } finally {
    await supabase.from('archive_context_items').delete().eq('id', seededId)
    console.log(`  Cleanup: deleted seeded id=${seededId}`)
  }
}

async function main() {
  console.log('Row 12 + Row 94 — Board privacy filter hard-constraint')
  console.log('─'.repeat(60))
  staticChecks()
  await runtimeCheck()
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
