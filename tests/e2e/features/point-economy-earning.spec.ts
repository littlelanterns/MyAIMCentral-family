/**
 * PECON-EARN — Point Economy Earning pins (PRD-24 Point Economy Addendum,
 * Worker A, Slice A4, 2026-07-07)
 *
 * Backend-driven (service-role + RPC), matching the allowance-payment-
 * settlement.spec.ts precedent: these are ledger/RPC-correctness pins, not
 * UI-flow pins (the Convention #277 eyes-on tour separately covers the
 * visual surfaces — routine editor Points block, "Points for this task"
 * field, Settings Points section, "N/goal today" progress, a kid checking
 * a rewarded step).
 *
 * Fixtures: PECON-marked, Testworth's Alex + Casey (both gamification-
 * enabled, base_points_per_task=10 in production — verified live before
 * writing this spec). A dedicated PECON-prefixed routine template + task +
 * sections + steps + a dedicated non-routine task are created per test
 * group and swept in afterAll. Never touches OurFamily (the founder's real
 * family) — all A1/A2 manual verification during development used
 * BEGIN...ROLLBACK against real data and left zero residue; this spec uses
 * committed PECON-prefixed rows against the Testworth test family instead,
 * for a permanent, repeatable pin.
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!

const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MARKER = 'PECON'

// Backdate seeded routine tasks/steps 2 days: get_member_day_obligations
// gates task-level activity with a +1-day grace buffer (created_at::DATE <=
// p_date + 1) but the step-fairness JOIN (stp.created_at::DATE <= pd.d,
// Convention #244) has NO buffer at all, and both casts use the bare
// Postgres session timezone (UTC on Supabase) rather than families.timezone.
// routine_step_completions.period_date, by contrast, IS family-timezone-
// aware (Convention #257 trigger, migration 100158/100245). Near local-
// evening hours (UTC already "tomorrow" while the family's local day is
// still "today"), a completion's family-correct period_date can legitimately
// land one day behind a just-created task's/step's UTC-cast created_at, and
// the ungapped step check then reports zero required steps for a routine
// that unambiguously exists. This is a narrow, pre-existing gap in the
// Convention #271 canonical source (predates PECON-EARN, outside Worker A's
// rulings — flagged, not silently patched here) — every task/step insert in
// this spec uses this shared backdated timestamp so pass/fail never depends
// on what wall-clock hour the suite happens to run at.
const BACKDATED_CREATED_AT = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

let familyId = ''
let alexId = ''
let caseyId = ''
let sarahId = ''

/** Authenticated client for a test user (real RLS, not service role). */
async function clientFor(user: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`signIn failed for ${user.email}: ${error.message}`)
  return client
}

async function balanceOf(memberId: string): Promise<number> {
  const { data, error } = await admin
    .from('family_members')
    .select('gamification_points')
    .eq('id', memberId)
    .single()
  if (error) throw error
  return (data?.gamification_points as number) ?? 0
}

async function ledgerSum(memberId: string): Promise<number> {
  const { data, error } = await admin
    .from('point_transactions')
    .select('amount')
    .eq('family_member_id', memberId)
  if (error) throw error
  return (data ?? []).reduce((s, r) => s + Number(r.amount), 0)
}

/** Creates a PECON-marked routine template + one section + one step, deployed
 *  to the given member. Returns the ids needed to complete the step. */
async function seedRoutine(opts: {
  memberId: string
  routinePointsMode?: 'none' | 'per_step' | 'per_completion'
  routineStepPoints?: number | null
  routineCompletionPoints?: number | null
  stepRewardType?: 'privilege' | 'custom' | 'money' | 'stars' | null
  stepRewardAmount?: number | null
  countsForGamification?: boolean
  countsForAllowance?: boolean
  isExtraCredit?: boolean
  secondAssigneeId?: string
}) {
  const { data: template, error: tErr } = await admin
    .from('task_templates')
    .insert({
      family_id: familyId,
      created_by: sarahId,
      title: `${MARKER} routine ${Date.now()}`,
      template_name: `${MARKER} routine`,
      task_type: 'routine',
      template_type: 'routine',
      routine_points_mode: opts.routinePointsMode ?? 'none',
      routine_step_points: opts.routineStepPoints ?? null,
      routine_completion_points: opts.routineCompletionPoints ?? null,
    })
    .select('id')
    .single()
  if (tErr) throw tErr

  const { data: section, error: sErr } = await admin
    .from('task_template_sections')
    .insert({
      template_id: template.id,
      title: 'Morning',
      section_name: 'Morning',
      frequency_rule: 'daily',
      frequency_days: null,
      sort_order: 0,
    })
    .select('id')
    .single()
  if (sErr) throw sErr

  const { data: step, error: stErr } = await admin
    .from('task_template_steps')
    .insert({
      section_id: section.id,
      title: `${MARKER} step`,
      step_name: `${MARKER} step`,
      instance_count: 1,
      sort_order: 0,
      step_type: 'static',
      reward_type: opts.stepRewardType ?? null,
      reward_amount: opts.stepRewardAmount ?? null,
      reward_description: opts.stepRewardType ? `${MARKER} step reward` : null,
      created_at: BACKDATED_CREATED_AT,
    })
    .select('id')
    .single()
  if (stErr) throw stErr

  const { data: task, error: taskErr } = await admin
    .from('tasks')
    .insert({
      family_id: familyId,
      created_by: sarahId,
      assignee_id: opts.memberId,
      title: `${MARKER} routine task`,
      task_type: 'routine',
      status: 'pending',
      template_id: template.id,
      counts_for_gamification: opts.countsForGamification ?? true,
      counts_for_allowance: opts.countsForAllowance ?? false,
      is_extra_credit: opts.isExtraCredit ?? false,
      created_at: BACKDATED_CREATED_AT,
    })
    .select('id')
    .single()
  if (taskErr) throw taskErr

  if (opts.secondAssigneeId) {
    const { error: taErr } = await admin.from('task_assignments').insert({
      task_id: task.id,
      family_member_id: opts.secondAssigneeId,
      member_id: opts.secondAssigneeId,
      assigned_by: sarahId,
      is_active: true,
    })
    if (taErr) throw taErr
  }

  return { templateId: template.id, sectionId: section.id, stepId: step.id, taskId: task.id }
}

/** The calendar date the DATABASE will assign to a row's created_at::DATE cast
 *  right now. Deliberately UTC-based (via getUTC* accessors, never the banned
 *  ISO-string date-slicing chain — Convention #257 governs app src/ writes
 *  representing a FAMILY's local day, a different concern from this): Supabase's
 *  Postgres session timezone is UTC, so any DATE cast of a just-inserted
 *  TIMESTAMPTZ column resolves in UTC regardless of the machine running this
 *  spec. get_member_day_obligations gates step-fairness on
 *  `stp.created_at::DATE <= pd.d` with NO grace window, so a period date
 *  computed from the local machine's clock can land one day behind the DB's
 *  own UTC "today" near local-evening hours (confirmed live: 8:44pm Central =
 *  1:44am UTC next day) and silently report required=0 for a freshly-seeded
 *  routine. Using the DB's own reference frame side-steps the skew entirely. */
function dbToday(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function completeStep(memberId: string, taskId: string, stepId: string, periodDate: string) {
  const { data, error } = await admin
    .from('routine_step_completions')
    .upsert(
      { task_id: taskId, step_id: stepId, member_id: memberId, family_member_id: memberId, period_date: periodDate, instance_number: 1 },
      { onConflict: 'step_id,family_member_id,period_date,instance_number', ignoreDuplicates: true },
    )
    .select('id')
    .maybeSingle()
  if (error) throw error
  return data?.id as string | undefined
}

test.beforeAll(async () => {
  const { data: family } = await admin
    .from('families')
    .select('id, primary_parent_id')
    .eq('family_login_name_lower', 'testworthfamily')
    .single()
  if (!family) throw new Error('Testworth family not found — check family_login_name_lower')
  familyId = family.id

  const { data: alex } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('display_name', 'Alex').single()
  const { data: casey } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('display_name', 'Casey').single()
  const { data: sarah } = await admin.from('family_members').select('id, user_id').eq('family_id', familyId).eq('display_name', 'Sarah').single()
  alexId = alex!.id
  caseyId = casey!.id
  sarahId = sarah!.id

  // Reset both test kids to a clean, deterministic gamification config for
  // this spec's math (production may drift between runs otherwise).
  await admin.from('gamification_configs').update({
    intention_tally_points: null,
    daily_points_goal: null,
  }).in('family_member_id', [alexId, caseyId])
})

test.afterAll(async () => {
  // Sweep in FK-safe order: completions -> tasks/steps -> sections -> templates -> ledger -> deeds -> prizes -> financial
  const { data: tasks } = await admin.from('tasks').select('id, template_id').eq('family_id', familyId).ilike('title', `${MARKER}%`)
  const taskIds = (tasks ?? []).map(t => t.id)
  const templateIds = [...new Set((tasks ?? []).map(t => t.template_id).filter(Boolean))] as string[]

  if (taskIds.length) {
    await admin.from('routine_step_completions').delete().in('task_id', taskIds)
    await admin.from('task_assignments').delete().in('task_id', taskIds)
    await admin.from('tasks').delete().in('id', taskIds)
  }
  if (templateIds.length) {
    const { data: sections } = await admin.from('task_template_sections').select('id').in('template_id', templateIds)
    const sectionIds = (sections ?? []).map(s => s.id)
    if (sectionIds.length) await admin.from('task_template_steps').delete().in('section_id', sectionIds)
    await admin.from('task_template_sections').delete().in('template_id', templateIds)
    await admin.from('task_templates').delete().in('id', templateIds)
  }
  // NOTE: previously also filtered on .ilike('description', `${MARKER}%`) —
  // real bug, dropped: process_routine_step_completion writes descriptions
  // like "Completed: PECON routine task" / "Step: PECON step" (marker is
  // NOT at the start), so a prefix-match filter silently matched zero rows
  // and let routine_step/routine_completion ledger rows survive every sweep.
  // source_type IN (routine_step, routine_completion) + family_member_id IN
  // (alex, casey) is sufficient on its own — these two source_types are
  // exclusively written by process_routine_step_completion (PECON-EARN),
  // nothing else in the platform creates them for these two members.
  await admin.from('point_transactions').delete().or(`source_type.eq.routine_step,source_type.eq.routine_completion`).in('family_member_id', [alexId, caseyId])
  await admin.from('point_transactions').delete().ilike('idempotency_key', `${MARKER.toLowerCase()}%`)
  // Belt-and-suspenders: godmother-routed 'manual_test'-sourced rows have
  // idempotency_key=NULL (set by execute_points_godmother, "idempotency
  // handled at the connector/contract_grant_log layer") so the prefix sweep
  // above can't catch them by key — catch by source_type instead. Every
  // in-test cleanup already deletes these by source_id on the success path;
  // this is only a backstop for a test that threw before reaching it.
  await admin.from('point_transactions').delete().eq('source_type', 'manual_test').in('family_member_id', [alexId, caseyId])

  // Ledger self-heal: reconcile gamification_points to SUM(point_transactions)
  // for both fixture members, in case an earlier interrupted run (Ctrl-C,
  // hard failure) left the two out of sync — the invariant this whole build
  // guarantees is SUM(ledger)=balance, so re-deriving balance FROM the
  // now-swept ledger is the correct, self-consistent way to leave the shared
  // fixture family clean for the next run/lane, not a workaround.
  for (const mid of [alexId, caseyId]) {
    const { data: rows } = await admin.from('point_transactions').select('amount').eq('family_member_id', mid)
    const reconciled = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0)
    await admin.from('family_members').update({ gamification_points: reconciled }).eq('id', mid)
  }
  await admin.from('deed_firings').delete().ilike('idempotency_key', `dpg:${alexId}:%`).eq('family_member_id', alexId)
  await admin.from('earned_prizes').delete().eq('source_type', 'routine_step').ilike('prize_text', `${MARKER}%`)
  await admin.from('financial_transactions').delete().ilike('description', `${MARKER}%`)
  await admin.from('gamification_configs').update({ intention_tally_points: null, daily_points_goal: null }).in('family_member_id', [alexId, caseyId])

  // Residue check
  const { count } = await admin.from('tasks').select('id', { count: 'exact', head: true }).eq('family_id', familyId).ilike('title', `${MARKER}%`)
  expect(count ?? 0).toBe(0)
})

test.describe('Point Economy — ledger + config-as-truth', () => {
  test('ledger invariant: SUM(amount) = balance_after of latest row = gamification_points, after mixed operations', async () => {
    const before = await balanceOf(alexId)
    const key1 = `${MARKER.toLowerCase()}:earn:${Date.now()}`
    const key2 = `${MARKER.toLowerCase()}:spend:${Date.now()}`
    const r1 = await admin.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: alexId, p_amount: 15,
      p_transaction_type: 'earn', p_source_type: 'manual_test', p_source_id: null,
      p_description: `${MARKER} earn`, p_idempotency_key: key1, p_acted_by: null,
    })
    expect(r1.error).toBeNull()
    const r2 = await admin.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: alexId, p_amount: -5,
      p_transaction_type: 'spend', p_source_type: 'manual_test', p_source_id: null,
      p_description: `${MARKER} spend`, p_idempotency_key: key2, p_acted_by: null,
    })
    expect(r2.error).toBeNull()

    const sum = await ledgerSum(alexId)
    const balance = await balanceOf(alexId)
    expect(sum).toBe(balance)
    expect(balance).toBe(before + 15 - 5)

    // cleanup this test's own rows (afterAll also sweeps by idempotency-key prefix, belt-and-suspenders)
    await admin.from('point_transactions').delete().in('idempotency_key', [key1, key2])
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('dead-lever repair: execute_points_godmother reads the LIVE base_points_per_task, not a frozen contract snapshot', async () => {
    const { data: origConfig } = await admin.from('gamification_configs').select('base_points_per_task').eq('family_member_id', alexId).single()
    const originalBasePoints = origConfig?.base_points_per_task ?? 10

    const { data: plainTask } = await admin.from('tasks').insert({
      family_id: familyId, created_by: sarahId, assignee_id: alexId,
      title: `${MARKER} plain task`, task_type: 'task', status: 'pending',
      counts_for_gamification: true,
    }).select('id').single()

    await admin.from('gamification_configs').update({ base_points_per_task: 7 }).eq('family_member_id', alexId)

    const before = await balanceOf(alexId)
    const deed = await admin.rpc('execute_points_godmother', {
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_deed_firing: { family_id: familyId, family_member_id: alexId, source_type: 'task_completion', source_id: plainTask!.id, id: '00000000-0000-0000-0000-000000000001' },
      p_payload: { payload_amount: null, payload_text: null, payload_config: null, godmother_config_id: null },
      p_stroke_of: 'immediate',
    })
    expect(deed.error).toBeNull()
    expect((deed.data as { status: string })?.status).toBe('granted')
    const after = await balanceOf(alexId)
    expect(after - before).toBe(7) // the LIVE config value, not a stale payload

    await admin.from('tasks').delete().eq('id', plainTask!.id)
    await admin.from('gamification_configs').update({ base_points_per_task: originalBasePoints }).eq('family_member_id', alexId)
    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_id', plainTask!.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('per-task points_override pays instead of the base value', async () => {
    const { data: task } = await admin.from('tasks').insert({
      family_id: familyId, created_by: sarahId, assignee_id: alexId,
      title: `${MARKER} override task`, task_type: 'task', status: 'pending',
      counts_for_gamification: true, points_override: 5,
    }).select('id').single()

    const before = await balanceOf(alexId)
    const deed = await admin.rpc('execute_points_godmother', {
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_deed_firing: { family_id: familyId, family_member_id: alexId, source_type: 'task_completion', source_id: task!.id, id: '00000000-0000-0000-0000-000000000002' },
      p_payload: { payload_amount: null, payload_text: null, payload_config: null, godmother_config_id: null },
      p_stroke_of: 'immediate',
    })
    expect(deed.error).toBeNull()
    const after = await balanceOf(alexId)
    expect(after - before).toBe(5) // NOT the base 10

    await admin.from('tasks').delete().eq('id', task!.id)
    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_id', task!.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('counts_for_gamification=false silences the award unconditionally ("off means off")', async () => {
    const { data: task } = await admin.from('tasks').insert({
      family_id: familyId, created_by: sarahId, assignee_id: alexId,
      title: `${MARKER} silenced task`, task_type: 'task', status: 'pending',
      counts_for_gamification: false,
    }).select('id').single()

    const before = await balanceOf(alexId)
    const deed = await admin.rpc('execute_points_godmother', {
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_deed_firing: { family_id: familyId, family_member_id: alexId, source_type: 'task_completion', source_id: task!.id, id: '00000000-0000-0000-0000-000000000003' },
      p_payload: { payload_amount: null, payload_text: null, payload_config: null, godmother_config_id: null },
      p_stroke_of: 'immediate',
    })
    expect(deed.error).toBeNull()
    expect((deed.data as { status: string })?.status).toBe('no_op')
    const after = await balanceOf(alexId)
    expect(after).toBe(before)

    await admin.from('tasks').delete().eq('id', task!.id)
  })

  test('best-intention tally: awards when intention_tally_points is set, nothing when NULL', async () => {
    const before = await balanceOf(alexId)
    // NULL case first (default state)
    const deed1 = await admin.rpc('execute_points_godmother', {
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_deed_firing: { family_id: familyId, family_member_id: alexId, source_type: 'intention_iteration', source_id: null, id: '00000000-0000-0000-0000-000000000004' },
      p_payload: { payload_amount: null, payload_text: null, payload_config: null, godmother_config_id: null },
      p_stroke_of: 'immediate',
    })
    expect((deed1.data as { status: string })?.status).toBe('no_op')

    await admin.from('gamification_configs').update({ intention_tally_points: 3 }).eq('family_member_id', alexId)
    const deed2 = await admin.rpc('execute_points_godmother', {
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_deed_firing: { family_id: familyId, family_member_id: alexId, source_type: 'intention_iteration', source_id: null, id: '00000000-0000-0000-0000-000000000005' },
      p_payload: { payload_amount: null, payload_text: null, payload_config: null, godmother_config_id: null },
      p_stroke_of: 'immediate',
    })
    expect((deed2.data as { status: string })?.status).toBe('granted')
    const after = await balanceOf(alexId)
    expect(after - before).toBe(3)

    await admin.from('gamification_configs').update({ intention_tally_points: null }).eq('family_member_id', alexId)
    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_type', 'intention_iteration')
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })
})

test.describe('Point Economy — routine step economics', () => {
  test('per_step mode: awards per check, same-day recheck no-double, uncheck does not revoke', async () => {
    const { taskId, stepId } = await seedRoutine({ memberId: alexId, routinePointsMode: 'per_step', routineStepPoints: 2 })
    const before = await balanceOf(alexId)
    const periodDate = dbToday()

    const id1 = await completeStep(alexId, taskId, stepId, periodDate)
    expect(id1).toBeTruthy()
    const processed1 = await admin.rpc('process_routine_step_completion', { p_completion_id: id1 })
    expect(processed1.error).toBeNull()
    const afterFirst = await balanceOf(alexId)
    expect(afterFirst - before).toBe(2)

    // Recheck (upsert no-ops under ignoreDuplicates — no new completion id to
    // process — but call the RPC again directly with the same id to prove
    // idempotency at the ledger layer too).
    const processed2 = await admin.rpc('process_routine_step_completion', { p_completion_id: id1 })
    expect(processed2.error).toBeNull()
    const afterRecheck = await balanceOf(alexId)
    expect(afterRecheck).toBe(afterFirst) // no double-pay

    // Uncheck: delete the completion row. Points are NOT revoked (Convention #219).
    await admin.from('routine_step_completions').delete().eq('id', id1)
    const afterUncheck = await balanceOf(alexId)
    expect(afterUncheck).toBe(afterFirst) // unchanged — celebration-only, never clawed back

    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_id', stepId)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('per_completion mode: no award until the FULL day is done; awards every contributor on a shared routine (rider 3 attribution pin)', async () => {
    const { taskId, sectionId } = await seedRoutine({
      memberId: alexId, routinePointsMode: 'per_completion', routineCompletionPoints: 4, secondAssigneeId: caseyId,
    })
    // Add a SECOND step to this section so "the whole day" requires 2 checks.
    await admin.from('task_template_steps').insert({
      section_id: sectionId, title: `${MARKER} step 2`, step_name: `${MARKER} step 2`,
      instance_count: 1, sort_order: 1, step_type: 'static', created_at: BACKDATED_CREATED_AT,
    })
    const { data: allSteps } = await admin
      .from('task_template_steps')
      .select('id')
      .eq('section_id', sectionId)
      .order('sort_order', { ascending: true })
    const [step1Id, step2Id] = allSteps!.map(s => s.id)

    const alexBefore = await balanceOf(alexId)
    const caseyBefore = await balanceOf(caseyId)
    const periodDate = dbToday()

    // Alex completes ONE of two steps — should NOT trigger completion award.
    const c1 = await completeStep(alexId, taskId, step1Id, periodDate)
    await admin.rpc('process_routine_step_completion', { p_completion_id: c1 })
    expect(await balanceOf(alexId)).toBe(alexBefore) // partial day: nothing yet

    // Casey completes the OTHER step (shared routine — contribution-based).
    const c2 = await completeStep(caseyId, taskId, step2Id, periodDate)
    const finalProcess = await admin.rpc('process_routine_step_completion', { p_completion_id: c2 })
    expect(finalProcess.error).toBeNull()

    // RIDER 3: every contributor that day (both Alex and Casey completed >=1
    // step) gets the completion award — exactly once each.
    const alexAfter = await balanceOf(alexId)
    const caseyAfter = await balanceOf(caseyId)
    expect(alexAfter - alexBefore).toBe(4)
    expect(caseyAfter - caseyBefore).toBe(4)

    // Re-processing either completion again must not double-pay either member.
    await admin.rpc('process_routine_step_completion', { p_completion_id: c1 })
    await admin.rpc('process_routine_step_completion', { p_completion_id: c2 })
    expect(await balanceOf(alexId)).toBe(alexAfter)
    expect(await balanceOf(caseyId)).toBe(caseyAfter)

    await admin.from('routine_step_completions').delete().in('id', [c1, c2].filter(Boolean))
    await admin.from('point_transactions').delete().in('family_member_id', [alexId, caseyId]).eq('source_id', taskId)
    await admin.from('family_members').update({ gamification_points: alexBefore }).eq('id', alexId)
    await admin.from('family_members').update({ gamification_points: caseyBefore }).eq('id', caseyId)
  })

  test('defect-4 probe: a daily-rule section (frequency_days=NULL) still completes and awards — was silently unreachable before migration 100295/100296', async () => {
    const { taskId, stepId } = await seedRoutine({ memberId: alexId, routinePointsMode: 'per_completion', routineCompletionPoints: 6 })
    // seedRoutine's section already uses frequency_rule='daily', frequency_days=null
    // — this IS the defect-4 shape.
    const before = await balanceOf(alexId)
    const periodDate = dbToday()
    const completionId = await completeStep(alexId, taskId, stepId, periodDate)
    const result = await admin.rpc('process_routine_step_completion', { p_completion_id: completionId })
    expect(result.error).toBeNull()
    const body = result.data as { completion_awarded: boolean; required: number; done: number }
    expect(body.required).toBeGreaterThan(0) // NOT 0 — the pre-fix bug would have made this 0 forever
    expect(body.completion_awarded).toBe(true)
    const after = await balanceOf(alexId)
    expect(after - before).toBe(6)

    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_id', taskId)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('rider 4 — three independent rails: an extra-credit shared-routine step boosts numerator only, changes NO denominator, and pays points independently', async () => {
    const { taskId, stepId } = await seedRoutine({
      memberId: alexId, routinePointsMode: 'per_step', routineStepPoints: 3,
      countsForAllowance: true, isExtraCredit: true,
    })
    const before = await balanceOf(alexId)
    const periodDate = dbToday()
    const completionId = await completeStep(alexId, taskId, stepId, periodDate)
    const result = await admin.rpc('process_routine_step_completion', { p_completion_id: completionId })
    expect(result.error).toBeNull()
    // (c) points paid independently of the allowance rails
    expect(await balanceOf(alexId)).toBe(before + 3)

    // (a)/(b): extra-credit is evaluated by calculate_allowance_progress at
    // period-close time, not by this RPC — confirm the flags on the task
    // itself are exactly what the allowance RPC keys off, so a regression
    // in the points path can never silently change allowance semantics.
    const { data: taskRow } = await admin.from('tasks').select('counts_for_allowance, is_extra_credit, counts_for_gamification').eq('id', taskId).single()
    expect(taskRow?.counts_for_allowance).toBe(true)
    expect(taskRow?.is_extra_credit).toBe(true)
    expect(taskRow?.counts_for_gamification).toBe(true)

    // Now flip counts_for_gamification=false on a FRESH completion of the
    // same shape — points must be silenced while allowance flags are
    // untouched (independent rails).
    await admin.from('tasks').update({ counts_for_gamification: false }).eq('id', taskId)
    const periodDate2 = dbToday()
    const completionId2 = await completeStep(alexId, taskId, stepId, periodDate2)
    const balanceBeforeSecond = await balanceOf(alexId)
    await admin.rpc('process_routine_step_completion', { p_completion_id: completionId2 })
    expect(await balanceOf(alexId)).toBe(balanceBeforeSecond) // silenced

    await admin.from('routine_step_completions').delete().in('id', [completionId, completionId2].filter(Boolean))
    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_id', stepId)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('per-step "stars" reward replaces the routine per-step amount for that one step only', async () => {
    const { taskId, sectionId } = await seedRoutine({ memberId: alexId, routinePointsMode: 'per_step', routineStepPoints: 2 })
    // Add a second step with a 'stars' override of 9 — should pay 9, not 2.
    const { data: overrideStep } = await admin.from('task_template_steps').insert({
      section_id: sectionId, title: `${MARKER} override step`, step_name: `${MARKER} override step`,
      instance_count: 1, sort_order: 1, step_type: 'static', reward_type: 'stars', reward_amount: 9,
    }).select('id').single()

    const before = await balanceOf(alexId)
    const periodDate = dbToday()
    const completionId = await completeStep(alexId, taskId, overrideStep!.id, periodDate)
    await admin.rpc('process_routine_step_completion', { p_completion_id: completionId })
    expect(await balanceOf(alexId)).toBe(before + 9) // NOT 2

    await admin.from('routine_step_completions').delete().eq('id', completionId)
    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_id', overrideStep!.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('per-step privilege prize creates an earned_prizes row with routine_step provenance, idempotent per completion', async () => {
    const { taskId, stepId } = await seedRoutine({ memberId: alexId, stepRewardType: 'privilege' })
    const periodDate = dbToday()
    const completionId = await completeStep(alexId, taskId, stepId, periodDate)
    const r1 = await admin.rpc('process_routine_step_completion', { p_completion_id: completionId })
    expect(r1.error).toBeNull()
    expect((r1.data as { step_prize_id?: string })?.step_prize_id).toBeTruthy()

    const { data: prizes } = await admin.from('earned_prizes').select('id, source_type, source_id, family_member_id').eq('source_id', completionId)
    expect(prizes?.length).toBe(1)
    expect(prizes?.[0].source_type).toBe('routine_step')
    expect(prizes?.[0].family_member_id).toBe(alexId)

    // Idempotent: re-processing must not create a second prize.
    await admin.rpc('process_routine_step_completion', { p_completion_id: completionId })
    const { count } = await admin.from('earned_prizes').select('id', { count: 'exact', head: true }).eq('source_id', completionId)
    expect(count).toBe(1)

    await admin.from('earned_prizes').delete().eq('source_id', completionId)
    await admin.from('routine_step_completions').delete().eq('id', completionId)
  })

  test('per-step money reward writes a real financial_transactions row', async () => {
    const { taskId, stepId } = await seedRoutine({ memberId: alexId, stepRewardType: 'money', stepRewardAmount: 2.5 })
    const periodDate = dbToday()
    const completionId = await completeStep(alexId, taskId, stepId, periodDate)
    const r = await admin.rpc('process_routine_step_completion', { p_completion_id: completionId })
    expect(r.error).toBeNull()

    const { data: ftRows } = await admin.from('financial_transactions').select('amount, source_type, source_reference_id').eq('source_reference_id', completionId)
    expect(ftRows?.length).toBe(1)
    expect(Number(ftRows?.[0].amount)).toBe(2.5)
    expect(ftRows?.[0].source_type).toBe('routine_step')

    await admin.from('financial_transactions').delete().eq('source_reference_id', completionId)
    await admin.from('routine_step_completions').delete().eq('id', completionId)
  })
})

test.describe('Point Economy — daily points goal', () => {
  test('crosses exactly once per family-local day; spending never subtracts progress; NULL goal renders/fires nothing', async () => {
    // Goal is set RELATIVE to Alex's actual pre-existing member_points_today()
    // baseline, not assumed to start at 0 — member_points_today sums ALL of
    // today's earns platform-wide (by design, PRD-24 §5.6), so any earlier
    // test in this same file that legitimately awarded Alex real points
    // earlier today (and hasn't been reverted yet, e.g. mid-run on a prior
    // test failure) would otherwise silently shift the crossing point.
    // Computing the threshold off the live baseline makes the crossing math
    // correct regardless of what ran before it.
    const baselineToday = ((await admin.rpc('member_points_today', { p_member_id: alexId })).data as number) ?? 0
    const goal = baselineToday + 10
    await admin.from('gamification_configs').update({ daily_points_goal: goal }).eq('family_member_id', alexId)
    const before = await balanceOf(alexId)

    // First earn under the goal — no deed.
    const k1 = `${MARKER.toLowerCase()}:dpg1:${Date.now()}`
    await admin.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: alexId, p_amount: 6, p_transaction_type: 'earn',
      p_source_type: 'manual_test', p_source_id: null, p_description: `${MARKER} dpg under`, p_idempotency_key: k1, p_acted_by: null,
    })
    let { data: deedsSoFar } = await admin.from('deed_firings').select('id').eq('family_member_id', alexId).eq('source_type', 'daily_points_goal_met').ilike('idempotency_key', `dpg:${alexId}:%`)
    expect(deedsSoFar?.length ?? 0).toBe(0)

    // Second earn crosses the goal — deed fires.
    const k2 = `${MARKER.toLowerCase()}:dpg2:${Date.now()}`
    await admin.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: alexId, p_amount: 6, p_transaction_type: 'earn',
      p_source_type: 'manual_test', p_source_id: null, p_description: `${MARKER} dpg cross`, p_idempotency_key: k2, p_acted_by: null,
    })
    ;({ data: deedsSoFar } = await admin.from('deed_firings').select('id').eq('family_member_id', alexId).eq('source_type', 'daily_points_goal_met').ilike('idempotency_key', `dpg:${alexId}:%`))
    expect(deedsSoFar?.length ?? 0).toBe(1)

    // A THIRD earn, still the same day — must NOT fire a second deed.
    const k3 = `${MARKER.toLowerCase()}:dpg3:${Date.now()}`
    await admin.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: alexId, p_amount: 4, p_transaction_type: 'earn',
      p_source_type: 'manual_test', p_source_id: null, p_description: `${MARKER} dpg recross`, p_idempotency_key: k3, p_acted_by: null,
    })
    ;({ data: deedsSoFar } = await admin.from('deed_firings').select('id').eq('family_member_id', alexId).eq('source_type', 'daily_points_goal_met').ilike('idempotency_key', `dpg:${alexId}:%`))
    expect(deedsSoFar?.length ?? 0).toBe(1) // still exactly one

    // Spending does not subtract from today's progress (member_points_today
    // only sums 'earn' transactions).
    const progress = await admin.rpc('member_points_today', { p_member_id: alexId })
    expect(progress.data).toBe(baselineToday + 16) // baseline + 6 + 6 + 4, all earns
    const k4 = `${MARKER.toLowerCase()}:dpg-spend:${Date.now()}`
    await admin.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: alexId, p_amount: -5, p_transaction_type: 'spend',
      p_source_type: 'manual_test', p_source_id: null, p_description: `${MARKER} dpg spend`, p_idempotency_key: k4, p_acted_by: null,
    })
    const progressAfterSpend = await admin.rpc('member_points_today', { p_member_id: alexId })
    expect(progressAfterSpend.data).toBe(baselineToday + 16) // unchanged by the spend

    // NULL goal (Casey, never set this test): no deed fires on an earn.
    const kCasey = `${MARKER.toLowerCase()}:dpg-casey:${Date.now()}`
    const caseyBefore = await balanceOf(caseyId)
    await admin.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: caseyId, p_amount: 50, p_transaction_type: 'earn',
      p_source_type: 'manual_test', p_source_id: null, p_description: `${MARKER} casey no-goal`, p_idempotency_key: kCasey, p_acted_by: null,
    })
    const { data: caseyDeeds } = await admin.from('deed_firings').select('id').eq('family_member_id', caseyId).eq('source_type', 'daily_points_goal_met')
    expect(caseyDeeds?.length ?? 0).toBe(0)

    // Cleanup
    await admin.from('deed_firings').delete().ilike('idempotency_key', `dpg:${alexId}:%`)
    await admin.from('point_transactions').delete().in('idempotency_key', [k1, k2, k3, k4, kCasey])
    await admin.from('gamification_configs').update({ daily_points_goal: null }).eq('family_member_id', alexId)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
    await admin.from('family_members').update({ gamification_points: caseyBefore }).eq('id', caseyId)
  })
})

test.describe('Point Economy — security regression pins (100298 + 100300 fixes stay closed)', () => {
  test('process_routine_step_completion: unauthenticated caller is rejected; legitimate same-family caller still succeeds (100298 fix)', async () => {
    const { taskId, stepId } = await seedRoutine({ memberId: alexId })
    const periodDate = dbToday()
    const completionId = await completeStep(alexId, taskId, stepId, periodDate)

    // Negative path: an unauthenticated anon-key client (auth.uid() IS NULL,
    // auth.role() != 'service_role') must be rejected by the 100298
    // authorization gate — this is the exact class of caller the live
    // exploit used (a valid completion UUID with no relationship check).
    const anonClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const anonAttempt = await anonClient.rpc('process_routine_step_completion', { p_completion_id: completionId })
    expect(anonAttempt.error).toBeTruthy()
    expect(anonAttempt.error?.message ?? '').toMatch(/not authorized/i)

    // Positive path: a legitimate same-family member (Sarah, Alex's own mom)
    // must NOT be locked out by the fix.
    const sarahClient = await clientFor(TEST_USERS.sarah)
    const legit = await sarahClient.rpc('process_routine_step_completion', { p_completion_id: completionId })
    expect(legit.error).toBeNull()

    await admin.from('routine_step_completions').delete().eq('id', completionId)
    await admin.from('point_transactions').delete().eq('family_member_id', alexId).eq('source_id', stepId)
  })

  test('record_point_transaction is not directly callable by an authenticated (non-service) session', async () => {
    const sarahClient = await clientFor(TEST_USERS.sarah)
    const result = await sarahClient.rpc('record_point_transaction', {
      p_family_id: familyId, p_family_member_id: alexId, p_amount: 999999,
      p_transaction_type: 'earn', p_source_type: 'forged', p_source_id: null,
      p_description: 'should be rejected', p_idempotency_key: null, p_acted_by: null,
    })
    expect(result.error).toBeTruthy()
    expect(result.error?.message ?? '').toMatch(/permission denied/i)
  })

  test('execute_points_godmother is not directly callable by an authenticated (non-service) session', async () => {
    const sarahClient = await clientFor(TEST_USERS.sarah)
    const result = await sarahClient.rpc('execute_points_godmother', {
      p_contract_id: '00000000-0000-0000-0000-000000000000',
      p_deed_firing: { family_id: familyId, family_member_id: alexId, source_type: 'task_completion', source_id: null, id: '00000000-0000-0000-0000-000000000099' },
      p_payload: { payload_amount: 999999, payload_text: null, payload_config: null, godmother_config_id: null },
      p_stroke_of: 'immediate',
    })
    expect(result.error).toBeTruthy()
    expect(result.error?.message ?? '').toMatch(/permission denied/i)
  })
})
