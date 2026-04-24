/**
 * Row 192 NEW-LL / Worker TOGGLE-2 — Routine step checkbox idempotent toggle.
 *
 * Verifies migration 100165 against a production-like Supabase instance:
 *   1. Seed a routine_step_completions row.
 *   2. Re-insert same (step_id, family_member_id, period_date) — UNIQUE rejects.
 *   3. Re-insert via .upsert(..., ignoreDuplicates: true) — silent no-op.
 *   4. DELETE the row — gone.
 *   5. Re-insert after delete — succeeds (constraint is per-row, not historical).
 *   6. Mass-insert 10 attempted duplicates on a single test step — verify
 *      exactly 1 row exists after.
 *
 * Run: npx tsx tests/verification/new-ll-checkbox-idempotent.ts
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Strategy: same as row-9 — uses an existing kid in the testworth family,
 * creates throwaway template+task+steps, cleans up scratch rows after.
 * Zero impact on production data outside the scratch records we explicitly
 * create + delete.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type ScenarioResult = { name: string; ok: boolean; detail: string }
const results: ScenarioResult[] = []

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail })
  console.log(`  PASS  ${name} — ${detail}`)
}
function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail })
  console.log(`  FAIL  ${name} — ${detail}`)
}

const TEST_FAMILY_LOGIN = 'testworthfamily'
const HOST_KID_DISPLAY_NAME = 'Alex'

const testStamp = Date.now()
let testFamilyId: string
let testMemberId: string
let testParentId: string
let templateId: string
let taskId: string
let stepIds: string[] = []
let testPeriodDate: string

async function fetchFamilyToday(memberId: string): Promise<string> {
  const { data, error } = await sb.rpc('family_today', { p_member_id: memberId })
  if (error) throw new Error(`family_today RPC failed: ${error.message}`)
  return data as string
}

async function setup() {
  console.log(`\n[setup] Resolving host family "${TEST_FAMILY_LOGIN}" + host kid "${HOST_KID_DISPLAY_NAME}"`)

  const { data: fam, error: famErr } = await sb
    .from('families')
    .select('id')
    .eq('family_login_name', TEST_FAMILY_LOGIN)
    .single()
  if (famErr || !fam) throw new Error(`host family lookup: ${famErr?.message ?? 'not found'}`)
  testFamilyId = (fam as { id: string }).id

  const { data: mom, error: momErr } = await sb
    .from('family_members')
    .select('id')
    .eq('family_id', testFamilyId)
    .eq('role', 'primary_parent')
    .limit(1)
    .single()
  if (momErr || !mom) throw new Error(`primary_parent lookup: ${momErr?.message ?? 'not found'}`)
  testParentId = (mom as { id: string }).id

  const { data: kid, error: kidErr } = await sb
    .from('family_members')
    .select('id')
    .eq('family_id', testFamilyId)
    .eq('display_name', HOST_KID_DISPLAY_NAME)
    .single()
  if (kidErr || !kid) throw new Error(`host kid lookup: ${kidErr?.message ?? 'not found'}`)
  testMemberId = (kid as { id: string }).id

  testPeriodDate = await fetchFamilyToday(testMemberId)

  // Throwaway template + section + 2 steps + 1 task assigned to host kid.
  const { data: tmpl, error: tmplErr } = await sb
    .from('task_templates')
    .insert({
      family_id: testFamilyId,
      created_by: testParentId,
      title: `NEW-LL toggle test template ${testStamp}`,
      task_type: 'routine',
      is_system: false,
      template_name: `NewLLTpl${testStamp}`,
      template_type: 'routine',
    })
    .select('id')
    .single()
  if (tmplErr) throw new Error(`template insert: ${tmplErr.message}`)
  templateId = (tmpl as { id: string }).id

  const { data: section, error: sectErr } = await sb
    .from('task_template_sections')
    .insert({
      template_id: templateId,
      title: 'Toggle Test Section',
      section_name: 'Toggle Test Section',
      sort_order: 0,
      frequency_rule: 'daily',
    })
    .select('id')
    .single()
  if (sectErr) throw new Error(`section insert: ${sectErr.message}`)
  const sectionId = (section as { id: string }).id

  const { data: steps, error: stepsErr } = await sb
    .from('task_template_steps')
    .insert([
      { section_id: sectionId, title: 'Step Alpha', step_name: 'Step Alpha', sort_order: 0 },
      { section_id: sectionId, title: 'Step Bravo', step_name: 'Step Bravo', sort_order: 1 },
    ])
    .select('id')
  if (stepsErr) throw new Error(`steps insert: ${stepsErr.message}`)
  stepIds = (steps as { id: string }[]).map(s => s.id)

  const { data: task, error: taskErr } = await sb
    .from('tasks')
    .insert({
      family_id: testFamilyId,
      created_by: testParentId,
      assignee_id: testMemberId,
      template_id: templateId,
      title: `NEW-LL toggle test task ${testStamp}`,
      task_type: 'routine',
      status: 'pending',
    })
    .select('id')
    .single()
  if (taskErr) throw new Error(`task insert: ${taskErr.message}`)
  taskId = (task as { id: string }).id

  console.log(`[setup] family=${testFamilyId} kid=${testMemberId} task=${taskId} steps=${stepIds.length} period=${testPeriodDate}`)
}

async function teardown() {
  console.log(`\n[teardown] Removing scratch rows for taskId=${taskId} templateId=${templateId}`)
  try {
    if (taskId) {
      await sb.from('routine_step_completions').delete().eq('task_id', taskId)
      await sb.from('task_completions').delete().eq('task_id', taskId)
      await sb.from('tasks').delete().eq('id', taskId)
    }
    if (templateId) {
      const { data: sections } = await sb
        .from('task_template_sections')
        .select('id')
        .eq('template_id', templateId)
      for (const s of (sections as { id: string }[] | null) ?? []) {
        await sb.from('task_template_steps').delete().eq('section_id', s.id)
      }
      await sb.from('task_template_sections').delete().eq('template_id', templateId)
      await sb.from('task_templates').delete().eq('id', templateId)
    }
    console.log('[teardown] clean')
  } catch (e) {
    console.log('[teardown] warn:', (e as Error).message)
  }
}

// ── Scenarios ────────────────────────────────────────────────────────────

async function scenario1_seed() {
  const name = '(1) Seed initial completion'
  await sb.from('routine_step_completions').delete().eq('task_id', taskId)
  const { error } = await sb.from('routine_step_completions').insert({
    task_id: taskId,
    step_id: stepIds[0],
    member_id: testMemberId,
    family_member_id: testMemberId,
    period_date: testPeriodDate,
    completed_at: new Date().toISOString(),
  })
  if (error) return fail(name, `insert error: ${error.message}`)

  const { count } = await sb
    .from('routine_step_completions')
    .select('id', { count: 'exact', head: true })
    .eq('step_id', stepIds[0])
    .eq('family_member_id', testMemberId)
    .eq('period_date', testPeriodDate)

  if (count === 1) pass(name, `1 row exists for (step_alpha, kid, today)`)
  else fail(name, `expected 1 row, got ${count}`)
}

async function scenario2_uniqueRejectsDupe() {
  const name = '(2) UNIQUE rejects raw duplicate INSERT'
  const { error } = await sb.from('routine_step_completions').insert({
    task_id: taskId,
    step_id: stepIds[0],
    member_id: testMemberId,
    family_member_id: testMemberId,
    period_date: testPeriodDate,
    completed_at: new Date().toISOString(),
  })
  if (!error) return fail(name, 'expected unique violation, but insert succeeded — migration 100165 may not be applied')
  const code = (error as { code?: string }).code
  const isUnique = code === '23505' || /duplicate key value violates unique constraint/i.test(error.message)
  if (isUnique) pass(name, `rejected (sqlstate ${code ?? '?'})`)
  else fail(name, `expected sqlstate 23505, got: ${error.message}`)
}

async function scenario3_upsertIgnoresDupe() {
  const name = '(3) UPSERT with ignoreDuplicates is silent no-op'
  // This mirrors the production hook (useCompleteRoutineStep) exactly.
  const { error } = await sb
    .from('routine_step_completions')
    .upsert(
      {
        task_id: taskId,
        step_id: stepIds[0],
        member_id: testMemberId,
        family_member_id: testMemberId,
        period_date: testPeriodDate,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: 'step_id,family_member_id,period_date',
        ignoreDuplicates: true,
      },
    )
  if (error) return fail(name, `upsert error: ${error.message}`)

  const { count } = await sb
    .from('routine_step_completions')
    .select('id', { count: 'exact', head: true })
    .eq('step_id', stepIds[0])
    .eq('family_member_id', testMemberId)
    .eq('period_date', testPeriodDate)

  if (count === 1) pass(name, `still exactly 1 row after upsert (no error, no duplicate)`)
  else fail(name, `expected 1 row after upsert, got ${count}`)
}

async function scenario4_deleteRemovesRow() {
  const name = '(4) DELETE removes the row'
  const { error } = await sb
    .from('routine_step_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('step_id', stepIds[0])
    .eq('member_id', testMemberId)
    .eq('period_date', testPeriodDate)
  if (error) return fail(name, `delete error: ${error.message}`)

  const { count } = await sb
    .from('routine_step_completions')
    .select('id', { count: 'exact', head: true })
    .eq('step_id', stepIds[0])
    .eq('family_member_id', testMemberId)
    .eq('period_date', testPeriodDate)

  if (count === 0) pass(name, `0 rows after delete`)
  else fail(name, `expected 0 rows after delete, got ${count}`)
}

async function scenario5_reinsertAfterDelete() {
  const name = '(5) Re-INSERT after delete succeeds'
  const { error } = await sb.from('routine_step_completions').insert({
    task_id: taskId,
    step_id: stepIds[0],
    member_id: testMemberId,
    family_member_id: testMemberId,
    period_date: testPeriodDate,
    completed_at: new Date().toISOString(),
  })
  if (error) return fail(name, `re-insert error: ${error.message}`)

  const { count } = await sb
    .from('routine_step_completions')
    .select('id', { count: 'exact', head: true })
    .eq('step_id', stepIds[0])
    .eq('family_member_id', testMemberId)
    .eq('period_date', testPeriodDate)

  if (count === 1) pass(name, `1 row after re-insert (constraint is current-state, not historical)`)
  else fail(name, `expected 1 row, got ${count}`)
}

async function scenario6_massInsertCollapsesToOne() {
  const name = '(6) Mass-attempt 10 duplicates on Step Bravo → exactly 1 row'
  // Use the second step (Bravo) so we don't conflict with Alpha's row from
  // scenario 5. Each upsert mirrors the production hook.
  for (let i = 0; i < 10; i++) {
    const { error } = await sb
      .from('routine_step_completions')
      .upsert(
        {
          task_id: taskId,
          step_id: stepIds[1],
          member_id: testMemberId,
          family_member_id: testMemberId,
          period_date: testPeriodDate,
          completed_at: new Date(Date.now() + i).toISOString(),
        },
        {
          onConflict: 'step_id,family_member_id,period_date',
          ignoreDuplicates: true,
        },
      )
    if (error) return fail(name, `mass-upsert iteration ${i} error: ${error.message}`)
  }

  const { count } = await sb
    .from('routine_step_completions')
    .select('id', { count: 'exact', head: true })
    .eq('step_id', stepIds[1])
    .eq('family_member_id', testMemberId)
    .eq('period_date', testPeriodDate)

  if (count === 1) pass(name, `10 upsert attempts → exactly 1 row (the toggle is genuinely idempotent)`)
  else fail(name, `expected 1 row after 10 upserts, got ${count}`)
}

// ── Runner ───────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(72))
  console.log('Row 192 NEW-LL — Routine step checkbox idempotent toggle')
  console.log('═'.repeat(72))

  try {
    await setup()
    console.log('\n— Scenarios —')
    await scenario1_seed()
    await scenario2_uniqueRejectsDupe()
    await scenario3_upsertIgnoresDupe()
    await scenario4_deleteRemovesRow()
    await scenario5_reinsertAfterDelete()
    await scenario6_massInsertCollapsesToOne()
  } finally {
    await teardown()
  }

  const passCount = results.filter(r => r.ok).length
  const failCount = results.length - passCount
  console.log('\n' + '═'.repeat(72))
  console.log(`Result: ${passCount} PASS / ${failCount} FAIL`)
  console.log('═'.repeat(72))
  process.exit(failCount > 0 ? 1 : 0)
}

main().catch(e => {
  console.error('FATAL:', e)
  process.exit(1)
})
