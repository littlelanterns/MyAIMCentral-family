/**
 * FAMILY-GOALS-PRIZES — end-to-end pins (2026-07-06)
 *
 * Covers (build file Build Item 10):
 *   1. Mode A ("shared_counter") goal creation via the FamilyGoalManager UI
 *      (Prize Board door), linked to a Family Best Intention
 *   2. Intention taps increment progress (DB trigger,
 *      count_family_goal_contribution_from_intention)
 *   3. Threshold-cross awards EXACTLY ONE family prize — concurrency probe
 *      (rapid Nth/N+1th contributions)
 *   4. Mode B ("each_member") withholds until every participant hits target
 *   5. Non-participant contributions never count
 *   6. Window: post-ends_at contribution doesn't count (lazy expiry)
 *   7. Task-source goal: counts at completion (no approval) AND only at
 *      approval (approval-required)
 *   8. My Rewards: participant visibility + non-participant absence
 *   9. Mom redeem-once → reflected for all; un-redeem
 *   10. RLS probes: kid cannot INSERT/UPDATE family_goals or INSERT
 *       family_goal_contributions directly; family-wide SELECT still works
 *
 * Migration: 00000000100284_family_goals_and_prizes.sql
 * Spec: claude/feature-decisions/Family-Goals-And-Prizes.md
 *
 * Fixtures are FAMGOAL-prefixed, created via service role, swept in
 * beforeAll + afterAll (leak-pass pattern). family_goal_sources and
 * family_goal_contributions cascade-delete when their parent family_goals
 * row is removed (ON DELETE CASCADE) — cleanup only needs to target
 * family_goals, family_best_intentions (+ cascades to iterations), tasks
 * (+ their completions), and earned_prizes by prize_name prefix.
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsAlex, loginAsJordan } from '../helpers/auth'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { waitForAppReady } from '../helpers/assertions'
import { localIsoDaysFromToday } from '../helpers/dates'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!

const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'FAMGOAL'

let familyId = ''
const memberIds: Record<string, string> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await admin
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

/** Authenticated client for a test user (real RLS, not service role). */
async function clientFor(user: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`signIn failed for ${user.email}: ${error.message}`)
  return client
}

async function createGoal(params: {
  title: string
  earningMode: 'shared_counter' | 'each_member'
  targetCount: number
  participantIds: string[]
  endsAt?: string | null
  createdBy?: string
}) {
  const momId = await memberId('Sarah')
  const { data, error } = await admin
    .from('family_goals')
    .insert({
      family_id: familyId,
      created_by: params.createdBy ?? momId,
      title: params.title,
      participating_member_ids: params.participantIds,
      earning_mode: params.earningMode,
      target_count: params.targetCount,
      ends_at: params.endsAt ?? null,
      prize_name: `${params.title} Prize`,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`createGoal failed: ${error?.message}`)
  return data as { id: string; family_id: string; status: string; current_progress: number }
}

async function attachIntentionSource(goalId: string, intentionId: string) {
  const { error } = await admin
    .from('family_goal_sources')
    .insert({ family_id: familyId, goal_id: goalId, source_kind: 'family_intention', source_id: intentionId })
  if (error) throw new Error(`attachIntentionSource failed: ${error.message}`)
}

async function attachTaskSource(goalId: string, taskId: string) {
  const { error } = await admin
    .from('family_goal_sources')
    .insert({ family_id: familyId, goal_id: goalId, source_kind: 'task', source_id: taskId })
  if (error) throw new Error(`attachTaskSource failed: ${error.message}`)
}

async function createIntention(title: string, participantIds: string[]) {
  const momId = await memberId('Sarah')
  const { data, error } = await admin
    .from('family_best_intentions')
    .insert({
      family_id: familyId,
      created_by_member_id: momId,
      title,
      participating_member_ids: participantIds,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`createIntention failed: ${error?.message}`)
  return data as { id: string }
}

async function tallyIntention(intentionId: string, participantId: string) {
  const { error } = await admin
    .from('family_intention_iterations')
    .insert({ family_id: familyId, intention_id: intentionId, member_id: participantId })
  if (error) throw new Error(`tallyIntention failed: ${error.message}`)
}

async function fetchGoal(goalId: string) {
  const { data, error } = await admin.from('family_goals').select('*').eq('id', goalId).single()
  if (error) throw new Error(`fetchGoal failed: ${error.message}`)
  return data as {
    id: string
    status: string
    current_progress: number
    earned_prize_id: string | null
  }
}

async function fetchContributions(goalId: string) {
  const { data, error } = await admin.from('family_goal_contributions').select('*').eq('goal_id', goalId)
  if (error) throw new Error(`fetchContributions failed: ${error.message}`)
  return data as { id: string; member_id: string; source_kind: string; source_ref_id: string }[]
}

async function fetchGoalPrizes(goalId: string) {
  const { data, error } = await admin
    .from('earned_prizes')
    .select('*')
    .eq('source_type', 'family_goal')
    .eq('source_id', goalId)
  if (error) throw new Error(`fetchGoalPrizes failed: ${error.message}`)
  return data as { id: string; redeemed_at: string | null; family_member_id: string | null; shared_with_member_ids: string[] }[]
}

async function createTask(title: string, assigneeId: string, requireApproval: boolean) {
  const momId = await memberId('Sarah')
  const { data, error } = await admin
    .from('tasks')
    .insert({
      family_id: familyId,
      created_by: momId,
      assignee_id: assigneeId,
      title,
      task_type: 'task',
      status: 'pending',
      require_approval: requireApproval,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`createTask failed: ${error?.message}`)
  return data as { id: string; family_id: string }
}

async function insertCompletion(taskId: string, memberIdVal: string, approvalStatus: string | null) {
  const { data, error } = await admin
    .from('task_completions')
    .insert({
      task_id: taskId,
      member_id: memberIdVal,
      family_member_id: memberIdVal,
      approval_status: approvalStatus,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`insertCompletion failed: ${error?.message}`)
  return data as { id: string }
}

async function approveCompletion(completionId: string) {
  const { error } = await admin
    .from('task_completions')
    .update({ approval_status: 'approved' })
    .eq('id', completionId)
  if (error) throw new Error(`approveCompletion failed: ${error.message}`)
}

async function sweepFixtures() {
  // Cascades to family_goal_sources + family_goal_contributions.
  const { data: goals } = await admin.from('family_goals').select('id').ilike('title', `${PREFIX}%`)
  const goalIds = (goals ?? []).map((g: { id: string }) => g.id)
  if (goalIds.length > 0) {
    await admin.from('family_goals').delete().in('id', goalIds)
  }
  await admin.from('earned_prizes').delete().ilike('prize_name', `${PREFIX}%`)

  // family_intention_iterations cascade when their parent intention is deleted.
  await admin.from('family_best_intentions').delete().ilike('title', `${PREFIX}%`)

  const { data: tasks } = await admin.from('tasks').select('id').ilike('title', `${PREFIX}%`)
  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id)
  if (taskIds.length > 0) {
    await admin.from('task_completions').delete().in('task_id', taskIds)
    await admin.from('tasks').delete().in('id', taskIds)
  }
}

test.describe('FAMILY-GOALS-PRIZES', () => {
  // Serial: multiple tests complete family goals and leave their earned
  // prizes sitting in the SAME "Family" group on the Prize Board (they all
  // share one grouping key) — serial execution + exact aria-label matching
  // (test 9) keeps the redeem-button click unambiguous.
  test.describe.configure({ mode: 'serial', retries: 1 })

  test.beforeAll(async () => {
    const { data: family, error } = await admin
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id
    await sweepFixtures()
  })

  test.afterAll(async () => {
    await sweepFixtures()
  })

  test('1. Mom creates a Mode A family goal via the UI, linked to a Family Best Intention', async ({ page }) => {
    const intention = await createIntention(`${PREFIX} Remain Calm`, [
      await memberId('Alex'),
      await memberId('Casey'),
      await memberId('Jordan'),
      await memberId('Ruthie'),
    ])

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes', exact: false }).first().click()
    await waitForAppReady(page)

    // Either the quiet [+ Family goal] affordance (no goals yet) or the
    // Manage button (goals already exist from a previous run) opens the manager.
    const quiet = page.getByTestId('family-goal-quiet-create')
    const manage = page.getByTestId('family-goal-manage-button')
    if (await quiet.isVisible().catch(() => false)) {
      await quiet.click()
    } else {
      await manage.click()
    }

    await page.getByTestId('family-goal-new-button').click()
    await page.getByTestId('family-goal-title-input').fill(`${PREFIX} Family Movie Night`)
    await page.getByTestId('family-goal-prize-name-input').fill(`${PREFIX} Family Movie Night Prize`)
    await page.getByTestId('family-goal-mode-shared').click()
    await page.getByTestId('family-goal-target-input').fill('5')
    await page.getByText(`${PREFIX} Remain Calm`).click()
    await page.getByTestId('family-goal-save-button').click()

    await expect(page.getByTestId('family-goal-list')).toBeVisible({ timeout: 10000 })

    const { data: goal, error } = await admin
      .from('family_goals')
      .select('*')
      .eq('title', `${PREFIX} Family Movie Night`)
      .single()
    expect(error).toBeNull()
    expect(goal.earning_mode).toBe('shared_counter')
    expect(goal.target_count).toBe(5)
    expect(goal.status).toBe('active')

    const { data: sources } = await admin.from('family_goal_sources').select('*').eq('goal_id', goal.id)
    expect(sources).toHaveLength(1)
    expect(sources![0].source_kind).toBe('family_intention')
    expect(sources![0].source_id).toBe(intention.id)
  })

  test('2. Intention tap increments contribution + denormalized progress', async () => {
    const alex = await memberId('Alex')
    const intention = await createIntention(`${PREFIX} Tally Test`, [alex])
    const goal = await createGoal({
      title: `${PREFIX} Tally Goal`,
      earningMode: 'shared_counter',
      targetCount: 10,
      participantIds: [alex],
    })
    await attachIntentionSource(goal.id, intention.id)

    await tallyIntention(intention.id, alex)

    const contributions = await fetchContributions(goal.id)
    expect(contributions).toHaveLength(1)
    expect(contributions[0].member_id).toBe(alex)
    expect(contributions[0].source_kind).toBe('family_intention')

    const updated = await fetchGoal(goal.id)
    expect(updated.current_progress).toBe(1)
    expect(updated.status).toBe('active')
  })

  test('3. Threshold-cross awards EXACTLY ONE family prize (concurrency probe)', async () => {
    const alex = await memberId('Alex')
    const casey = await memberId('Casey')
    const intention = await createIntention(`${PREFIX} Concurrency Tally`, [alex, casey])
    const goal = await createGoal({
      title: `${PREFIX} Concurrency Goal`,
      earningMode: 'shared_counter',
      targetCount: 3,
      participantIds: [alex, casey],
    })
    await attachIntentionSource(goal.id, intention.id)

    // Two sequential contributions first (progress = 2, still active).
    await tallyIntention(intention.id, alex)
    await tallyIntention(intention.id, casey)
    expect((await fetchGoal(goal.id)).status).toBe('active')

    // Nth (3rd) and N+1th (4th) contributions fired truly concurrently — both
    // cross the target=3 threshold from below. Only ONE should win the award.
    //
    // Whichever transaction commits first flips family_goals.status to
    // 'completed'; the loser's own trigger re-checks `fg.status = 'active'`
    // and — by design — does NOT count a contribution against an
    // already-completed goal (see count_family_goal_contribution_from_intention,
    // migration 100284). So current_progress lands on EITHER 3 (loser's tap
    // didn't count) OR 4 (loser's tap raced in just ahead of the winner's
    // status flip) depending on real network/commit timing — both are
    // correct outcomes. The one invariant that must ALWAYS hold regardless of
    // timing is exactly one prize, ever: that's what this test proves.
    await Promise.all([tallyIntention(intention.id, alex), tallyIntention(intention.id, casey)])

    const finalGoal = await fetchGoal(goal.id)
    expect(finalGoal.status).toBe('completed')
    expect(finalGoal.current_progress).toBeGreaterThanOrEqual(3)
    expect(finalGoal.current_progress).toBeLessThanOrEqual(4)
    expect(finalGoal.earned_prize_id).not.toBeNull()

    const prizes = await fetchGoalPrizes(goal.id)
    expect(prizes).toHaveLength(1)
    expect(prizes[0].family_member_id).toBeNull()
    expect(prizes[0].shared_with_member_ids.sort()).toEqual([alex, casey].sort())
  })

  test('4. Mode B ("each_member") withholds until every participant hits target', async () => {
    const alex = await memberId('Alex')
    const casey = await memberId('Casey')
    const intention = await createIntention(`${PREFIX} Each Member Tally`, [alex, casey])
    const goal = await createGoal({
      title: `${PREFIX} Each Member Goal`,
      earningMode: 'each_member',
      targetCount: 2,
      participantIds: [alex, casey],
    })
    await attachIntentionSource(goal.id, intention.id)

    // Alex reaches target alone — goal must stay active (Casey hasn't).
    await tallyIntention(intention.id, alex)
    await tallyIntention(intention.id, alex)
    expect((await fetchGoal(goal.id)).status).toBe('active')
    expect((await fetchGoalPrizes(goal.id))).toHaveLength(0)

    // Casey now reaches target too — goal completes.
    await tallyIntention(intention.id, casey)
    await tallyIntention(intention.id, casey)
    const finalGoal = await fetchGoal(goal.id)
    expect(finalGoal.status).toBe('completed')
    expect(await fetchGoalPrizes(goal.id)).toHaveLength(1)
  })

  test('5. Non-participant contributions never count', async () => {
    const alex = await memberId('Alex')
    const jordan = await memberId('Jordan') // NOT a participant
    const intention = await createIntention(`${PREFIX} Non-Participant Tally`, [alex, jordan])
    const goal = await createGoal({
      title: `${PREFIX} Non-Participant Goal`,
      earningMode: 'shared_counter',
      targetCount: 10,
      participantIds: [alex], // Jordan excluded
    })
    await attachIntentionSource(goal.id, intention.id)

    await tallyIntention(intention.id, jordan)

    const contributions = await fetchContributions(goal.id)
    expect(contributions).toHaveLength(0)
    expect((await fetchGoal(goal.id)).current_progress).toBe(0)

    // Confirm the participant path DOES count on the same goal/source.
    await tallyIntention(intention.id, alex)
    expect(await fetchContributions(goal.id)).toHaveLength(1)
  })

  test('6. Window: post-ends_at contribution does not count and lazily expires the goal', async () => {
    const alex = await memberId('Alex')
    const intention = await createIntention(`${PREFIX} Expired Window Tally`, [alex])
    const yesterday = localIsoDaysFromToday(-1)
    const goal = await createGoal({
      title: `${PREFIX} Expired Window Goal`,
      earningMode: 'shared_counter',
      targetCount: 10,
      participantIds: [alex],
      endsAt: yesterday,
    })
    await attachIntentionSource(goal.id, intention.id)

    await tallyIntention(intention.id, alex)

    expect(await fetchContributions(goal.id)).toHaveLength(0)
    const updated = await fetchGoal(goal.id)
    expect(updated.status).toBe('expired')
  })

  test('7. Task-source goal counts at completion (no approval) AND only at approval (approval-required)', async () => {
    const alex = await memberId('Alex')
    const casey = await memberId('Casey')
    const goal = await createGoal({
      title: `${PREFIX} Task Source Goal`,
      earningMode: 'shared_counter',
      targetCount: 10,
      participantIds: [alex, casey],
    })

    // 7a — no approval required: counts immediately at INSERT.
    const taskA = await createTask(`${PREFIX} No Approval Task`, alex, false)
    await attachTaskSource(goal.id, taskA.id)
    await insertCompletion(taskA.id, alex, null)
    expect(await fetchContributions(goal.id)).toHaveLength(1)

    // 7b — approval required: pending completion must NOT count yet.
    const taskB = await createTask(`${PREFIX} Approval Required Task`, casey, true)
    await attachTaskSource(goal.id, taskB.id)
    const completionB = await insertCompletion(taskB.id, casey, 'pending')
    expect(await fetchContributions(goal.id)).toHaveLength(1) // unchanged

    // Approving it flips the count.
    await approveCompletion(completionB.id)
    const contributions = await fetchContributions(goal.id)
    expect(contributions).toHaveLength(2)
    expect(contributions.some((c) => c.source_ref_id === completionB.id)).toBe(true)
  })

  test('8. My Rewards: participant sees the goal, non-participant does not', async ({ page }) => {
    const alex = await memberId('Alex')
    const casey = await memberId('Casey')
    const intention = await createIntention(`${PREFIX} MyRewards Tally`, [alex, casey])
    const goal = await createGoal({
      title: `${PREFIX} MyRewards Visibility Goal`,
      earningMode: 'each_member',
      targetCount: 2,
      participantIds: [alex, casey], // Jordan NOT a participant
    })
    await attachIntentionSource(goal.id, intention.id)
    await tallyIntention(intention.id, alex)

    await loginAsAlex(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByText(`${PREFIX} MyRewards Visibility Goal`)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('You: 1 / 2')).toBeVisible()

    await loginAsJordan(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByText(`${PREFIX} MyRewards Visibility Goal`)).not.toBeVisible()
  })

  test('9. Mom redeem-once reflected for all; un-redeem restores it', async ({ page }) => {
    const alex = await memberId('Alex')
    const casey = await memberId('Casey')
    const intention = await createIntention(`${PREFIX} Redeem Tally`, [alex, casey])
    const goal = await createGoal({
      title: `${PREFIX} Redeem Goal`,
      earningMode: 'shared_counter',
      targetCount: 1,
      participantIds: [alex, casey],
    })
    await attachIntentionSource(goal.id, intention.id)
    await tallyIntention(intention.id, alex)

    const completedGoal = await fetchGoal(goal.id)
    expect(completedGoal.status).toBe('completed')
    const prizes = await fetchGoalPrizes(goal.id)
    expect(prizes).toHaveLength(1)
    expect(prizes[0].redeemed_at).toBeNull()

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes', exact: false }).first().click()
    await waitForAppReady(page)

    const familyGroup = page.getByTestId('prizes-family-group')
    await expect(familyGroup).toBeVisible({ timeout: 10000 })
    await expect(familyGroup.getByText(`${PREFIX} Redeem Goal Prize`)).toBeVisible()
    // Exact aria-label (not a loose /Mark redeemed/ match) — other family
    // goals completed earlier in this suite (tests 3, 4) leave their own
    // unredeemed prizes in this SAME "Family" group.
    await familyGroup.getByRole('button', { name: `Mark redeemed: ${PREFIX} Redeem Goal Prize` }).click()

    await expect
      .poll(async () => (await fetchGoalPrizes(goal.id))[0].redeemed_at, { timeout: 10000 })
      .not.toBeNull()

    // Un-redeem via the Recently redeemed section — exact aria-label, since
    // other family goals completed earlier in this suite may also be sitting
    // in the recently-redeemed list.
    const redeemedToggle = page.getByText(/Recently redeemed/)
    await expect(redeemedToggle).toBeVisible({ timeout: 10000 })
    await redeemedToggle.click()
    const unredeemBtn = page.getByRole('button', { name: `Un-redeem: ${PREFIX} Redeem Goal Prize` })
    await expect(unredeemBtn).toBeVisible({ timeout: 10000 })
    await unredeemBtn.click()
    await expect
      .poll(async () => (await fetchGoalPrizes(goal.id))[0].redeemed_at, { timeout: 10000 })
      .toBeNull()
  })

  test('10. RLS: kid cannot write family_goals/family_goal_contributions directly; SELECT still works', async () => {
    const alex = await memberId('Alex')
    const goal = await createGoal({
      title: `${PREFIX} RLS Probe Goal`,
      earningMode: 'shared_counter',
      targetCount: 10,
      participantIds: [alex],
    })

    const alexClient = await clientFor(TEST_USERS.alex)

    // Kid cannot INSERT a new family goal.
    const insertResult = await alexClient.from('family_goals').insert({
      family_id: familyId,
      created_by: alex,
      title: `${PREFIX} Kid Should Not Create`,
      participating_member_ids: [alex],
      earning_mode: 'shared_counter',
      target_count: 5,
      prize_name: 'Should not exist',
    })
    expect(insertResult.error).not.toBeNull()

    // Kid cannot UPDATE an existing family goal.
    const updateResult = await alexClient
      .from('family_goals')
      .update({ title: 'Hacked title' })
      .eq('id', goal.id)
      .select()
    expect(updateResult.data ?? []).toHaveLength(0)

    const { data: unchangedGoal } = await admin.from('family_goals').select('title').eq('id', goal.id).single()
    expect(unchangedGoal!.title).toBe(`${PREFIX} RLS Probe Goal`)

    // Kid cannot INSERT a contribution directly (even with their own member_id) —
    // no INSERT policy exists on family_goal_contributions at all (writes only
    // via the SECURITY DEFINER trigger functions).
    const contribInsert = await alexClient.from('family_goal_contributions').insert({
      family_id: familyId,
      goal_id: goal.id,
      member_id: alex,
      source_kind: 'family_intention',
      source_ref_id: goal.id, // arbitrary, doesn't matter — should be rejected before that
    })
    expect(contribInsert.error).not.toBeNull()

    // But SELECT works (family-wide visibility, needed for Hub/My Rewards render).
    const readResult = await alexClient.from('family_goals').select('id').eq('id', goal.id).single()
    expect(readResult.error).toBeNull()
    expect(readResult.data?.id).toBe(goal.id)
  })
})
