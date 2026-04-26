/**
 * Worker ROUTINE-SAVE-FIX (c3) — DB-behavior verification for migration
 * 100178 (atomic routine-template rewrite RPC).
 *
 * Confirms against a live Supabase project that:
 *   1. The RPC executes successfully on a happy-path edit.
 *   2. Section + step counts match what we passed in.
 *   3. Old sections + steps are deleted (FK SET NULL from c1 lets this
 *      succeed even when completion history exists).
 *   4. Existing routine_step_completions survive with step_id=NULL
 *      (audit trail preserved per Convention #259).
 *   5. A mid-flow failure (intentional invalid payload) rolls back
 *      ALL changes — partial commits impossible.
 *
 * Run: npx tsx tests/verification/update-routine-template-atomic.ts
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
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
const stamp = Date.now()

let familyId: string
let parentId: string
let memberId: string
let templateId: string

async function cleanup() {
  console.log('\nCleanup:')
  if (templateId) {
    // Cascade-clean: delete tasks + sections (which cascade to steps);
    // completions FK is SET NULL post-c1 so they survive automatically.
    await sb.from('tasks').delete().eq('template_id', templateId)
    await sb.from('task_template_sections').delete().eq('template_id', templateId)
    await sb.from('task_templates').delete().eq('id', templateId)
  }
  console.log('  Cleanup complete.')
}

async function main() {
  console.log('\n[c3] update_routine_template_atomic RPC verification\n')

  // 1. Resolve fixtures
  const { data: fam, error: famErr } = await sb
    .from('families')
    .select('id, primary_parent_id')
    .eq('family_login_name_lower', TEST_FAMILY_LOGIN.toLowerCase())
    .single()
  if (famErr || !fam) {
    fail('resolve family', famErr?.message ?? 'no family')
    process.exit(1)
  }
  familyId = fam.id
  parentId = fam.primary_parent_id

  const { data: kid } = await sb
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', HOST_KID_DISPLAY_NAME)
    .single()
  if (!kid) {
    fail('resolve test kid', `no kid named ${HOST_KID_DISPLAY_NAME}`)
    process.exit(1)
  }
  memberId = kid.id
  pass('resolve fixtures', `family=${familyId.slice(0, 8)} member=${memberId.slice(0, 8)}`)

  // 2. Seed template + initial sections + steps
  const { data: template, error: tplErr } = await sb
    .from('task_templates')
    .insert({
      family_id: familyId,
      created_by: parentId,
      title: `[c3-test ${stamp}] atomic`,
      template_name: `[c3-test ${stamp}]`,
      task_type: 'routine',
      template_type: 'routine',
      is_system: false,
    })
    .select('id')
    .single()
  if (tplErr || !template) {
    fail('seed template', tplErr?.message ?? 'no template')
    await cleanup()
    process.exit(1)
  }
  templateId = template.id

  // Seed initial section + step + a tasks row + a completion row so we
  // can verify completion survival across the rewrite.
  const { data: section } = await sb
    .from('task_template_sections')
    .insert({
      template_id: templateId,
      title: 'Initial Section',
      section_name: 'Initial Section',
      frequency_rule: 'daily',
      frequency_days: null,
      show_until_complete: false,
      sort_order: 0,
    })
    .select('id')
    .single()
  if (!section) {
    fail('seed section', 'no section returned')
    await cleanup()
    process.exit(1)
  }

  const { data: step } = await sb
    .from('task_template_steps')
    .insert({
      section_id: section.id,
      title: 'Initial Step',
      step_name: 'Initial Step',
      sort_order: 0,
      step_type: 'static',
      instance_count: 1,
    })
    .select('id')
    .single()
  if (!step) {
    fail('seed step', 'no step returned')
    await cleanup()
    process.exit(1)
  }

  const { data: task } = await sb
    .from('tasks')
    .insert({
      family_id: familyId,
      created_by: parentId,
      assignee_id: memberId,
      template_id: templateId,
      title: `[c3-test ${stamp}]`,
      task_type: 'routine',
      status: 'pending',
    })
    .select('id')
    .single()
  if (!task) {
    fail('seed task', 'no task returned')
    await cleanup()
    process.exit(1)
  }

  const { data: completion } = await sb
    .from('routine_step_completions')
    .insert({
      task_id: task.id,
      step_id: step.id,
      member_id: memberId,
      family_member_id: memberId,
      period_date: '2026-04-26',
    })
    .select('id, step_id')
    .single()
  if (!completion) {
    fail('seed completion', 'no completion returned')
    await cleanup()
    process.exit(1)
  }
  pass('seed state', `1 section, 1 step, 1 completion (step_id=${completion.step_id?.slice(0, 8)})`)

  // 3. Happy-path RPC call: rewrite with 2 new sections + 4 steps
  const newSections = [
    {
      title: 'Mornings',
      section_name: 'Mornings',
      frequency_rule: 'custom',
      frequency_days: [1, 3, 5],
      show_until_complete: false,
      sort_order: 0,
      steps: [
        {
          title: 'Brush teeth',
          step_name: 'Brush teeth',
          step_notes: null,
          instance_count: 1,
          require_photo: false,
          sort_order: 0,
          step_type: 'static',
          linked_source_id: null,
          linked_source_type: null,
          display_name_override: null,
        },
        {
          title: 'Make bed',
          step_name: 'Make bed',
          step_notes: 'pillows on top',
          instance_count: 1,
          require_photo: false,
          sort_order: 1,
          step_type: 'static',
          linked_source_id: null,
          linked_source_type: null,
          display_name_override: null,
        },
      ],
    },
    {
      title: 'Evenings',
      section_name: 'Evenings',
      frequency_rule: 'daily',
      frequency_days: null,
      show_until_complete: false,
      sort_order: 1,
      steps: [
        {
          title: 'Pajamas',
          step_name: 'Pajamas',
          step_notes: null,
          instance_count: 1,
          require_photo: false,
          sort_order: 0,
          step_type: 'static',
          linked_source_id: null,
          linked_source_type: null,
          display_name_override: null,
        },
        {
          title: 'Read 10 minutes',
          step_name: 'Read 10 minutes',
          step_notes: null,
          instance_count: 1,
          require_photo: false,
          sort_order: 1,
          step_type: 'static',
          linked_source_id: null,
          linked_source_type: null,
          display_name_override: null,
        },
      ],
    },
  ]

  const { data: rpcResult, error: rpcErr } = await sb.rpc('update_routine_template_atomic', {
    p_template_id: templateId,
    p_title: `[c3-test ${stamp}] rewritten`,
    p_description: 'After atomic rewrite',
    p_sections: newSections,
  })
  if (rpcErr) {
    fail('happy-path rpc', rpcErr.message)
    await cleanup()
    process.exit(1)
  }
  // rpcResult is jsonb {section_count, step_count}
  const result = rpcResult as { section_count: number; step_count: number }
  if (result.section_count === 2 && result.step_count === 4) {
    pass('happy-path counts', `${result.section_count} sections, ${result.step_count} steps`)
  } else {
    fail('happy-path counts', `expected 2/4, got ${JSON.stringify(rpcResult)}`)
  }

  // 4. Old sections + step deleted; completion survives with step_id=NULL
  const { data: surviving } = await sb
    .from('routine_step_completions')
    .select('id, step_id')
    .eq('id', completion.id)
    .maybeSingle()
  if (!surviving) {
    fail('completion survival', 'completion was deleted (CASCADE leak)')
  } else if (surviving.step_id !== null) {
    fail('completion orphan', `expected NULL step_id, got ${surviving.step_id}`)
  } else {
    pass('completion survival', 'row exists with step_id=NULL (Convention #259)')
  }

  // 5. New sections + steps exist
  const { data: newSecRows } = await sb
    .from('task_template_sections')
    .select('id, section_name')
    .eq('template_id', templateId)
    .order('sort_order')
  if (newSecRows?.length === 2 && newSecRows[0].section_name === 'Mornings') {
    pass('new sections', `2 sections in correct order`)
  } else {
    fail('new sections', `unexpected: ${JSON.stringify(newSecRows)}`)
  }

  // 6. Mid-flow rollback: pass an invalid payload that fails partway through.
  //    We use a deliberately malformed step_type (won't match enum / type
  //    coercion) to force a DB error after some inserts have started.
  const beforeRollback = await sb
    .from('task_template_sections')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', templateId)
  const sectionsBefore = beforeRollback.count ?? 0

  const malformed = [
    {
      title: 'Should not persist',
      section_name: 'Should not persist',
      frequency_rule: 'daily',
      frequency_days: null,
      show_until_complete: false,
      sort_order: 0,
      steps: [
        {
          title: 'Bad step',
          // Force a sort_order cast failure mid-loop
          sort_order: 'not-a-number',
          step_type: 'static',
        },
      ],
    },
  ]

  const { error: rollbackErr } = await sb.rpc('update_routine_template_atomic', {
    p_template_id: templateId,
    p_title: 'should not persist',
    p_description: null,
    p_sections: malformed,
  })

  if (!rollbackErr) {
    fail('mid-flow rollback', 'malformed payload unexpectedly succeeded')
  } else {
    // Confirm template title was NOT updated to the failed value
    const { data: afterTpl } = await sb
      .from('task_templates')
      .select('title')
      .eq('id', templateId)
      .single()
    const titleHeld = afterTpl?.title === `[c3-test ${stamp}] rewritten`
    const { count: sectionsAfter } = await sb
      .from('task_template_sections')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', templateId)
    const sectionsHeld = sectionsAfter === sectionsBefore
    if (titleHeld && sectionsHeld) {
      pass(
        'mid-flow rollback',
        `RPC rejected malformed payload; pre-call state preserved (title="${afterTpl?.title}", sections=${sectionsAfter})`,
      )
    } else {
      fail(
        'mid-flow rollback',
        `partial commit detected: titleHeld=${titleHeld}, sectionsBefore=${sectionsBefore}, sectionsAfter=${sectionsAfter}`,
      )
    }
  }

  await cleanup()

  const passed = results.filter(r => r.ok).length
  const failed = results.length - passed
  console.log(`\n${passed}/${results.length} passed${failed ? `, ${failed} FAILED` : ''}`)
  process.exit(failed ? 1 : 0)
}

main().catch(async err => {
  console.error('Verification crashed:', err)
  await cleanup()
  process.exit(1)
})
