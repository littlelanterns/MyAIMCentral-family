/**
 * Worker ALLOWANCE-COMPLETE / NEW-TT — per-day grace mode verification.
 *
 * Migration 100175 changed calculate_allowance_progress's 4th arg from
 * DATE[] to JSONB. Each entry can be a plain string (legacy = full_exclude)
 * OR an object {date, mode} where mode in (full_exclude, numerator_keep).
 *
 * Modes:
 *   full_exclude: skip day on BOTH numerator + denominator (B1b behavior)
 *   numerator_keep: skip day on DENOMINATOR only; numerator preserved
 *
 * Scenarios:
 *   TT-1: 4-arg signature accepts JSONB null + array shapes (no error)
 *   TT-2: legacy string[] form === [{date, mode:'full_exclude'}] form
 *         (back-compat with pre-NEW-TT production data)
 *   TT-3: founder flagship — numerator_keep > full_exclude on a partial
 *         completion day. Setup: 7-day period, 5-step daily routine.
 *         Day A (PARTIAL_DAY): 3/5 steps done.
 *         Days B-F (5 other days): 5/5 each.
 *         Without grace: 28/35 (80%)
 *         With full_exclude on Day A: 25/30 (83.3%) — drops 3 num + 5 denom
 *         With numerator_keep on Day A: 28/30 (93.3%) — drops 5 denom only
 *   TT-4: numerator_keep on a fully-uncompleted day == full_exclude
 *         (numerator was 0 anyway, so keeping vs dropping makes no diff)
 *
 * Run: npx tsx tests/verification/new-tt-per-day-grace-mode.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
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

async function loadFamily() {
  const { data: f } = await sb
    .from('families')
    .select('id')
    .eq('family_login_name', TEST_FAMILY_LOGIN)
    .single()
  if (!f) throw new Error('testworthfamily not found')
  return f.id as string
}

interface Scenario {
  kidId: string
  taskId: string
  templateId: string
  sectionId: string
  stepIds: string[]
  configId: string
  periodId: string
  partialDay: string
  uncompletedDay: string
  fullDays: string[]
  periodStart: string
  periodEnd: string
}

async function seed(familyId: string): Promise<Scenario> {
  const kidId = crypto.randomUUID()
  await sb.from('family_members').insert({
    id: kidId,
    family_id: familyId,
    display_name: `[TT] scratch ${kidId.slice(0, 6)}`,
    role: 'member',
    dashboard_mode: 'guided',
    is_active: true,
    age: 10,
  })

  const { data: cfg } = await sb
    .from('allowance_configs')
    .insert({
      family_id: familyId,
      family_member_id: kidId,
      enabled: true,
      weekly_amount: 10,
      calculation_approach: 'dynamic',
      default_point_value: 1,
      grace_days_enabled: true,
      period_start_day: 'sunday',
      calculation_time: '23:59:00',
      minimum_threshold: 0,
      bonus_threshold: 90,
    })
    .select('id')
    .single()
  if (!cfg) throw new Error('config insert failed')

  const periodStart = '2026-04-19'
  const periodEnd = '2026-04-25'
  const fullDays = ['2026-04-19', '2026-04-20', '2026-04-22', '2026-04-24', '2026-04-25']
  const partialDay = '2026-04-21'
  const uncompletedDay = '2026-04-23'

  const { data: period } = await sb
    .from('allowance_periods')
    .insert({
      family_id: familyId,
      family_member_id: kidId,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'active',
      base_amount: 10,
    })
    .select('id')
    .single()
  if (!period) throw new Error('period insert failed')

  const { data: tmpl } = await sb
    .from('task_templates')
    .insert({
      family_id: familyId,
      created_by: kidId,
      title: '[TT] daily routine',
      template_name: '[TT] daily routine',
      task_type: 'routine',
      template_type: 'routine',
    })
    .select('id')
    .single()
  if (!tmpl) throw new Error('template insert failed')

  const { data: section } = await sb
    .from('task_template_sections')
    .insert({
      template_id: tmpl.id,
      title: 'Daily',
      section_name: 'Daily',
      frequency_rule: 'daily',
      frequency_days: ['0', '1', '2', '3', '4', '5', '6'],
      show_until_complete: false,
      sort_order: 0,
    })
    .select('id')
    .single()
  if (!section) throw new Error('section insert failed')

  const stepRows = [0, 1, 2, 3, 4].map(i => ({
    section_id: section.id,
    title: `Step ${i + 1}`,
    step_name: `Step ${i + 1}`,
    instance_count: 1,
    require_photo: false,
    sort_order: i,
  }))
  const { data: steps } = await sb
    .from('task_template_steps')
    .insert(stepRows)
    .select('id')
  if (!steps || steps.length !== 5) throw new Error('steps insert failed')
  const stepIds = steps.map(s => s.id as string)

  const { data: task } = await sb
    .from('tasks')
    .insert({
      family_id: familyId,
      created_by: kidId,
      assignee_id: kidId,
      template_id: tmpl.id,
      title: '[TT] daily routine',
      task_type: 'routine',
      status: 'pending',
      source: 'manual',
      counts_for_allowance: true,
    })
    .select('id, created_at')
    .single()
  if (!task) throw new Error('task insert failed')

  // Backdate so the RPC's effective_start = period_start (otherwise the
  // task created today only counts the last 2 days of the week).
  await sb
    .from('tasks')
    .update({ created_at: `${periodStart}T00:00:00Z` })
    .eq('id', task.id)

  // Migration 100157 trigger overrides period_date from completed_at.
  // Set completed_at per-day at noon UTC so the trigger derives the
  // intended period_date in the family timezone (regardless of what tz
  // testworthfamily uses, noon UTC for a YYYY-MM-DD lands on that
  // YYYY-MM-DD across all standard zones).
  const completions: Array<{
    task_id: string
    step_id: string
    member_id: string
    family_member_id: string
    completed_at: string
  }> = []
  for (const day of fullDays) {
    for (const stepId of stepIds) {
      completions.push({
        task_id: task.id,
        step_id: stepId,
        member_id: kidId,
        family_member_id: kidId,
        completed_at: `${day}T12:00:00Z`,
      })
    }
  }
  for (let i = 0; i < 3; i++) {
    completions.push({
      task_id: task.id,
      step_id: stepIds[i],
      member_id: kidId,
      family_member_id: kidId,
      completed_at: `${partialDay}T12:00:00Z`,
    })
  }
  const { error: rscErr } = await sb.from('routine_step_completions').insert(completions)
  if (rscErr) {
    throw new Error(`routine_step_completions insert failed: ${rscErr.message}`)
  }

  return {
    kidId,
    taskId: task.id,
    templateId: tmpl.id,
    sectionId: section.id,
    stepIds,
    configId: cfg.id,
    periodId: period.id,
    partialDay,
    uncompletedDay,
    fullDays,
    periodStart,
    periodEnd,
  }
}

async function cleanup(s: Scenario) {
  await sb.from('routine_step_completions').delete().eq('task_id', s.taskId)
  await sb.from('task_completions').delete().eq('task_id', s.taskId)
  await sb.from('tasks').delete().eq('id', s.taskId)
  await sb.from('task_template_steps').delete().eq('section_id', s.sectionId)
  await sb.from('task_template_sections').delete().eq('id', s.sectionId)
  await sb.from('task_templates').delete().eq('id', s.templateId)
  await sb.from('allowance_periods').delete().eq('id', s.periodId)
  await sb.from('allowance_configs').delete().eq('id', s.configId)
  await sb.from('family_members').delete().eq('id', s.kidId)
}

async function callRpc(s: Scenario, graceDays: unknown) {
  const { data, error } = await sb.rpc('calculate_allowance_progress', {
    p_member_id: s.kidId,
    p_period_start: s.periodStart,
    p_period_end: s.periodEnd,
    p_grace_days: graceDays,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return row
}

async function main() {
  console.log('\n=== NEW-TT VERIFICATION: per-day grace mode (migration 100175) ===\n')

  const familyId = await loadFamily()
  const s = await seed(familyId)
  try {
    // TT-1
    {
      const name = 'TT-1: RPC accepts JSONB null/[]/string[]/object[] shapes'
      const inputs: Array<[string, unknown]> = [
        ['null', null],
        ['empty', []],
        ['string[]', [s.partialDay]],
        ['object[]', [{ date: s.partialDay, mode: 'full_exclude' }]],
      ]
      let okAll = true
      for (const [label, input] of inputs) {
        try {
          await callRpc(s, input)
        } catch (e) {
          okAll = false
          fail(name, `${label} threw: ${(e as Error).message}`)
        }
      }
      if (okAll) pass(name, '4 input shapes accepted')
    }

    // TT-2
    {
      const name = 'TT-2: legacy string[] same result as object[] full_exclude'
      const r1 = await callRpc(s, [s.partialDay, s.uncompletedDay])
      const r2 = await callRpc(s, [
        { date: s.partialDay, mode: 'full_exclude' },
        { date: s.uncompletedDay, mode: 'full_exclude' },
      ])
      const same =
        Number(r1.completion_percentage) === Number(r2.completion_percentage) &&
        Number(r1.raw_steps_completed) === Number(r2.raw_steps_completed) &&
        Number(r1.raw_steps_available) === Number(r2.raw_steps_available)
      if (same) {
        pass(name, `pct=${r1.completion_percentage}, steps=${r1.raw_steps_completed}/${r1.raw_steps_available}`)
      } else {
        fail(name, `legacy=${JSON.stringify(r1)} vs object=${JSON.stringify(r2)}`)
      }
    }

    // TT-3 founder flagship
    {
      const name = 'TT-3: numerator_keep produces higher % than full_exclude on partial day'
      const baseline = await callRpc(s, null)
      const fullExclude = await callRpc(s, [
        { date: s.partialDay, mode: 'full_exclude' },
      ])
      const numeratorKeep = await callRpc(s, [
        { date: s.partialDay, mode: 'numerator_keep' },
      ])
      const baselinePct = Number(baseline.completion_percentage)
      const fullExcludePct = Number(fullExclude.completion_percentage)
      const numeratorKeepPct = Number(numeratorKeep.completion_percentage)

      if (numeratorKeepPct > fullExcludePct) {
        pass(
          name,
          `baseline=${baselinePct.toFixed(2)}%, full_exclude=${fullExcludePct.toFixed(2)}%, numerator_keep=${numeratorKeepPct.toFixed(2)}% — modes diverge correctly`,
        )
      } else {
        fail(
          name,
          `expected numerator_keep > full_exclude. got: baseline=${baselinePct}, full_exclude=${fullExcludePct}, numerator_keep=${numeratorKeepPct}`,
        )
      }

      const expectedFullExclude = (25 / 30) * 100
      const expectedNumeratorKeep = (28 / 30) * 100
      const fullExcludeMatch = Math.abs(fullExcludePct - expectedFullExclude) < 0.5
      const numeratorKeepMatch = Math.abs(numeratorKeepPct - expectedNumeratorKeep) < 0.5
      if (fullExcludeMatch && numeratorKeepMatch) {
        pass(
          'TT-3b: percentages match expected math',
          `full_exclude≈${expectedFullExclude.toFixed(2)} (got ${fullExcludePct.toFixed(2)}); numerator_keep≈${expectedNumeratorKeep.toFixed(2)} (got ${numeratorKeepPct.toFixed(2)})`,
        )
      } else {
        fail(
          'TT-3b: percentages differ from expected math',
          `expected full_exclude≈${expectedFullExclude.toFixed(2)}, got ${fullExcludePct}; expected numerator_keep≈${expectedNumeratorKeep.toFixed(2)}, got ${numeratorKeepPct}`,
        )
      }
    }

    // TT-4
    {
      const name = 'TT-4: numerator_keep on uncompleted day matches full_exclude'
      const fullEx = await callRpc(s, [
        { date: s.uncompletedDay, mode: 'full_exclude' },
      ])
      const numKeep = await callRpc(s, [
        { date: s.uncompletedDay, mode: 'numerator_keep' },
      ])
      const samePct =
        Math.abs(Number(fullEx.completion_percentage) - Number(numKeep.completion_percentage)) < 0.01
      if (samePct) {
        pass(name, `both=${fullEx.completion_percentage}% (no numerator to keep)`)
      } else {
        fail(name, `full_exclude=${fullEx.completion_percentage}% vs numerator_keep=${numKeep.completion_percentage}% — should match`)
      }
    }
  } finally {
    await cleanup(s)
  }

  const passed = results.filter(r => r.ok).length
  const total = results.length
  console.log(`\n  ${passed}/${total} scenarios passed`)
  process.exit(passed === total ? 0 : 1)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
