/**
 * KIDS-REWARDS-PAGE — Slice 4 verification (Propose-a-Reward + self-propose)
 *
 * Proof-of-done per the active build file and founder gate (§5/§6/§11, R3):
 *
 *   1. Settings: the "Propose a deal" toggle writes my_rewards_sections.propose;
 *      Play members get NO propose toggle (gate §5 — Guided+ only).
 *   2. Kid pitch (UI): guided form → pending reward_proposals row + quiet mom
 *      notification (Convention #66 inbox); "Take it back" withdraw (DELETE
 *      policy) removes a still-pending pitch.
 *   3. Approve = prefill-confirm, NEVER silent auto-create: mom's Approve opens
 *      TaskCreationModal prefilled (title, assignee, reward_type='privilege' +
 *      description, require_approval default ON); saving creates the task +
 *      task_rewards row + provenance (source='reward_proposal') and only THEN
 *      stamps the proposal accepted with artifact refs.
 *   4. ONE-round counter (gate §5), full loop: mom edits terms + note →
 *      countered; kid sees the counteroffer on /my-rewards → accepts →
 *      counter_accepted returns to mom's queue → "Set it up" opens the STREAK
 *      TRACKER flow (WidgetConfiguration prefilled) → deploy → tracker artifact.
 *   5. Decline with note → declined; the kid's list shows the outcome + note.
 *   6. finish_list → routine: Approve opens TaskCreationModal in routine mode
 *      with the proposed items as checklist steps ("Assign & Create").
 *   7. Adult self-propose (§6/§11): dad's negotiation-collapsed screen creates
 *      a PRIVATE-by-default reward task (tasks.reward_visibility) + an
 *      accepted self-proposal; completing the task awards an earned prize with
 *      visibility='private' through the UNCHANGED Slice 1 pipeline — then RLS
 *      probes prove: sibling client sees 0 rows, mom sees it (mom-sees-all
 *      default), and the personal_rewards_privacy grant hides it from mom too.
 *      Never rendered-then-hidden — query layer.
 *   8. reward_proposals RLS probes: sibling can't read/update another kid's
 *      proposal; a kid can't insert AS another member; dad (additional_adult)
 *      can't read kid→mom proposals (processing is mom's); dad's self-proposal
 *      is mom-visible by default and hidden under the privacy grant.
 *
 * Fixture hygiene: KRSLICE4-prefixed fixtures created/removed via service role
 * (role-scoping-leak-pass pattern), Testworth family. Member preferences are
 * restored to the clean baseline on cleanup. Auth clients sign out with
 * scope:'local' only (slice-1 lesson — global signOut revokes cached sessions).
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsDad, loginAsCasey } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'KRSLICE4'

let familyId = ''
const memberIds: Record<string, string> = {}
const authedClients: SupabaseClient[] = []

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

/** Authenticated client for real-RLS probes (task-assignment-scoping pattern). */
async function clientFor(user: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error) throw new Error(`signIn failed for ${user.email}: ${error.message}`)
  authedClients.push(client)
  return client
}

// ─── Preference helpers ──────────────────────────────────────────────────────

const PREF_KEYS = ['my_rewards_sections', 'personal_rewards_privacy'] as const

async function setMemberPrefs(mid: string, updates: Record<string, unknown>): Promise<void> {
  const { data, error } = await sr
    .from('family_members')
    .select('preferences')
    .eq('id', mid)
    .single()
  if (error) throw new Error(`read preferences: ${error.message}`)
  const prefs = { ...((data.preferences as Record<string, unknown>) ?? {}), ...updates }
  const { error: uErr } = await sr.from('family_members').update({ preferences: prefs }).eq('id', mid)
  if (uErr) throw new Error(`write preferences: ${uErr.message}`)
}

async function stripPrefs(mid: string): Promise<void> {
  const { data, error } = await sr
    .from('family_members')
    .select('preferences')
    .eq('id', mid)
    .single()
  if (error) throw new Error(`read preferences: ${error.message}`)
  const prefs = { ...((data.preferences as Record<string, unknown>) ?? {}) }
  for (const key of PREF_KEYS) delete prefs[key]
  const { error: uErr } = await sr.from('family_members').update({ preferences: prefs }).eq('id', mid)
  if (uErr) throw new Error(`write preferences: ${uErr.message}`)
}

async function readPrefs(mid: string): Promise<Record<string, unknown>> {
  const { data, error } = await sr
    .from('family_members')
    .select('preferences')
    .eq('id', mid)
    .single()
  if (error) throw new Error(`read preferences: ${error.message}`)
  return (data.preferences as Record<string, unknown>) ?? {}
}

// ─── Fixture helpers ─────────────────────────────────────────────────────────

interface TermsFixture {
  want_text: string
  want_image_url?: string | null
  want_image_asset_key?: string | null
  will_text: string
  earn_structure: 'once' | 'streak_n_days' | 'finish_list'
  params?: { days?: number; items?: string[] }
}

function terms(t: TermsFixture) {
  return {
    want_text: t.want_text,
    want_image_url: t.want_image_url ?? null,
    want_image_asset_key: t.want_image_asset_key ?? null,
    will_text: t.will_text,
    earn_structure: t.earn_structure,
    params: t.params ?? {},
  }
}

async function insertProposal(opts: {
  proposerId: string
  terms: TermsFixture
  status?: string
  counterTerms?: TermsFixture
  isSelf?: boolean
  processedBy?: string
}): Promise<string> {
  const { data, error } = await sr
    .from('reward_proposals')
    .insert({
      family_id: familyId,
      proposer_member_id: opts.proposerId,
      is_self_proposal: opts.isSelf ?? false,
      status: opts.status ?? 'pending',
      terms: terms(opts.terms),
      counter_terms: opts.counterTerms ? terms(opts.counterTerms) : null,
      processed_by: opts.processedBy ?? null,
      processed_at: opts.processedBy ? new Date().toISOString() : null,
    })
    .select('id')
    .single()
  if (error) throw new Error(`proposal fixture: ${error.message}`)
  return data.id
}

async function proposalRow(id: string) {
  const { data, error } = await sr.from('reward_proposals').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`proposal read: ${error.message}`)
  return data
}

// ─── Queue modal helper ──────────────────────────────────────────────────────

async function openRequestsTab(page: import('@playwright/test').Page) {
  await page.goto('/tasks')
  await waitForAppReady(page)
  // The QueueBadge aria-label always starts "Review Queue:" (colon). Mom's
  // /tasks page also renders a second header button titled "Review Queue — ..."
  // (em-dash), so the colon keeps the locator strict-mode-unique.
  await page.getByRole('button', { name: /Review Queue:/ }).click()
  await page.getByRole('tab', { name: 'Requests' }).click()
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

async function cleanup() {
  for (const name of ['Casey', 'Jordan', 'Mark', 'Ruthie']) {
    if (!memberIds[name]) await memberId(name)
    await stripPrefs(memberIds[name])
  }

  // Notifications from proposal lifecycle + prize redemption
  await sr
    .from('notifications')
    .delete()
    .eq('family_id', familyId)
    .like('notification_type', 'reward_proposal%')

  // Earned prizes from the self-propose award test
  await sr.from('earned_prizes').delete().eq('family_id', familyId).ilike('prize_text', `${PREFIX}%`)

  // Tasks (task_rewards + task_completions cascade) + routine templates
  await sr.from('tasks').delete().eq('family_id', familyId).ilike('title', `${PREFIX}%`)
  await sr
    .from('task_templates')
    .delete()
    .eq('family_id', familyId)
    .ilike('template_name', `${PREFIX}%`)

  // Trackers deployed from streak approvals
  await sr.from('dashboard_widgets').delete().eq('family_id', familyId).ilike('title', `${PREFIX}%`)

  // Proposals last (notifications reference them)
  await sr
    .from('reward_proposals')
    .delete()
    .eq('family_id', familyId)
    .ilike('terms->>want_text', `${PREFIX}%`)
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('KIDS-REWARDS-PAGE Slice 4 — Propose-a-Reward + self-propose', () => {
  test.describe.configure({ timeout: 150_000 })

  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    await Promise.all([
      memberId('Sarah'),
      memberId('Mark'),
      memberId('Casey'),
      memberId('Alex'),
      memberId('Jordan'),
      memberId('Ruthie'),
    ])

    await cleanup() // clear leftovers from any crashed prior run
  })

  test.afterAll(async () => {
    await cleanup()
    // Local-scope sign-out ONLY — a global signOut would revoke the cached
    // browser sessions in tests/e2e/.auth (slice-1 incident).
    for (const client of authedClients) {
      await client.auth.signOut({ scope: 'local' }).catch(() => {})
    }
  })

  // ── 1. Settings: propose toggle (Guided+ only — no Play control) ───────────
  test('settings: Propose a deal toggle writes prefs; Play member gets no toggle', async ({ page }) => {
    const casey = memberIds['Casey']

    await loginAsMom(page)
    await page.goto('/family-members')
    await waitForAppReady(page)

    const caseyCard = page
      .locator('.card-hover')
      .filter({ has: page.getByText('Casey', { exact: true }) })
    await caseyCard.getByTitle('Edit').click()
    await caseyCard.getByRole('button', { name: 'Gamification Settings' }).click()
    await page.getByRole('button', { name: 'My Rewards Page' }).click()

    const settingsSection = page.getByTestId('my-rewards-settings-section')
    await expect(settingsSection).toBeVisible()

    const proposeSwitch = settingsSection.getByRole('switch', { name: 'Propose a deal' })
    await expect(proposeSwitch).toBeVisible()
    // Q1: propose defaults OFF
    await expect(proposeSwitch).toHaveAttribute('aria-checked', 'false')

    await proposeSwitch.click()
    await expect
      .poll(
        async () => {
          const prefs = await readPrefs(casey)
          const sections = (prefs.my_rewards_sections ?? {}) as Record<string, unknown>
          return sections.propose ?? null
        },
        { timeout: 10000, message: 'propose override should persist' },
      )
      .toBe(true)

    await page.keyboard.press('Escape')
    await expect(settingsSection).not.toBeVisible()

    // Play member (Ruthie): no propose toggle — gate §5, Guided+ only
    const ruthieCard = page
      .locator('.card-hover')
      .filter({ has: page.getByText('Ruthie', { exact: true }) })
    await ruthieCard.getByTitle('Edit').click()
    await ruthieCard.getByRole('button', { name: 'Gamification Settings' }).click()
    await page.getByRole('button', { name: 'My Rewards Page' }).click()

    const ruthieSection = page.getByTestId('my-rewards-settings-section')
    await expect(ruthieSection).toBeVisible()
    await expect(ruthieSection.getByRole('switch', { name: 'Points & streak' })).toBeVisible()
    await expect(ruthieSection.getByRole('switch', { name: 'Propose a deal' })).toHaveCount(0)
  })

  // ── 2. Kid pitch → pending row + mom notification; withdraw deletes ────────
  test('kid pitches a deal from My Rewards; mom is notified; take-it-back withdraws', async ({ page }) => {
    const casey = memberIds['Casey']
    const sarah = memberIds['Sarah']
    await setMemberPrefs(casey, { my_rewards_sections: { propose: true } })

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const section = page.getByTestId('mr-section-propose')
    await expect(section).toBeVisible()

    await section.getByTestId('proposal-open-form').click()
    await section.getByTestId('proposal-want-input').fill(`${PREFIX} popsicle party`)
    // structure defaults to 'once'
    await section.getByTestId('proposal-will-input').fill(`${PREFIX} clean the garage`)
    await section.getByTestId('proposal-submit').click()

    // DB: pending row with the guided terms
    let proposalId = ''
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('reward_proposals')
            .select('id, status, proposer_member_id, is_self_proposal, terms')
            .eq('family_id', familyId)
            .eq('terms->>want_text', `${PREFIX} popsicle party`)
            .maybeSingle()
          if (!data) return null
          proposalId = data.id
          return `${data.status}|${data.proposer_member_id}|${data.is_self_proposal}|${(data.terms as { earn_structure: string }).earn_structure}`
        },
        { timeout: 15000, message: 'pending proposal row should exist' },
      )
      .toBe(`pending|${casey}|false|once`)

    // Quiet notification to mom (Convention #66 — her queue is the inbox)
    await expect
      .poll(
        async () => {
          const { count } = await sr
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', familyId)
            .eq('recipient_member_id', sarah)
            .eq('notification_type', 'reward_proposal_received')
            .eq('source_reference_id', proposalId)
          return count ?? 0
        },
        { timeout: 15000, message: 'mom should get a reward_proposal_received notification' },
      )
      .toBe(1)

    // The kid's list shows the waiting pitch; take it back → row deleted
    await expect(section.getByTestId('proposal-row-pending')).toBeVisible()
    await section.getByTestId('proposal-withdraw').click()
    await expect
      .poll(async () => (await proposalRow(proposalId)) === null, {
        timeout: 15000,
        message: 'withdraw should delete the pending proposal',
      })
      .toBe(true)
  })

  // ── 3. Approve = prefill-confirm → task + provenance + accepted ────────────
  test('mom approves a once-proposal: prefilled TaskCreationModal → task + task_rewards + accepted', async ({ page }) => {
    const casey = memberIds['Casey']
    const proposalId = await insertProposal({
      proposerId: casey,
      terms: {
        want_text: `${PREFIX} ice cream night`,
        will_text: `${PREFIX} vacuum the van`,
        earn_structure: 'once',
      },
    })

    await loginAsMom(page)
    await openRequestsTab(page)

    const card = page
      .getByTestId('proposal-card')
      .filter({ hasText: `${PREFIX} ice cream night` })
    await expect(card).toBeVisible({ timeout: 15000 })
    await card.getByTestId('proposal-approve').click()

    // Prefill-confirm: the EXISTING creation flow opens, prefilled — never
    // silent auto-create (gate §5)
    const titleInput = page.getByPlaceholder('What needs to be done?').first()
    await expect(titleInput).toBeVisible({ timeout: 15000 })
    await expect(titleInput).toHaveValue(`${PREFIX} vacuum the van`)

    // No proposal mutation happened yet (mom hasn't confirmed)
    expect((await proposalRow(proposalId))?.status).toBe('pending')

    await page.getByRole('button', { name: 'Create Task', exact: true }).click()

    // Task created with reward promise + provenance
    let taskId = ''
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('tasks')
            .select('id, assignee_id, source, source_reference_id, reward_description, require_approval')
            .eq('family_id', familyId)
            .eq('title', `${PREFIX} vacuum the van`)
            .maybeSingle()
          if (!data) return null
          taskId = data.id
          return `${data.assignee_id}|${data.source}|${data.source_reference_id}|${data.reward_description}|${data.require_approval}`
        },
        { timeout: 20000, message: 'approved task should be created with provenance' },
      )
      .toBe(`${casey}|reward_proposal|${proposalId}|${PREFIX} ice cream night|true`)

    // task_rewards row drives the Slice 1 award pipeline (zero new award code).
    // POLL: createTaskFromData inserts task_rewards a step AFTER the task row.
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('task_rewards')
            .select('reward_type')
            .eq('task_id', taskId)
            .maybeSingle()
          return data?.reward_type ?? null
        },
        { timeout: 15000, message: 'task_rewards row should carry the privilege reward' },
      )
      .toBe('privilege')

    // Proposal stamped accepted with artifact refs
    await expect
      .poll(
        async () => {
          const row = await proposalRow(proposalId)
          return row ? `${row.status}|${row.created_artifact_type}|${row.created_artifact_id}` : null
        },
        { timeout: 15000, message: 'proposal should be accepted with artifact refs' },
      )
      .toBe(`accepted|task|${taskId}`)

    // Card leaves the queue
    await expect(
      page.getByTestId('proposal-card').filter({ hasText: `${PREFIX} ice cream night` }),
    ).toHaveCount(0)
  })

  // ── 4. ONE-round counter, full loop → streak tracker setup ────────────────
  test('counter round: mom counters, kid accepts, mom sets up the streak tracker', async ({ page }) => {
    const casey = memberIds['Casey']
    await setMemberPrefs(casey, { my_rewards_sections: { propose: true } })

    const proposalId = await insertProposal({
      proposerId: casey,
      terms: {
        want_text: `${PREFIX} movie night`,
        will_text: `${PREFIX} practice piano`,
        earn_structure: 'streak_n_days',
        params: { days: 5 },
      },
    })

    // Mom counters: 5 days → 7 days, with a note
    await loginAsMom(page)
    await openRequestsTab(page)
    const card = page.getByTestId('proposal-card').filter({ hasText: `${PREFIX} movie night` })
    await expect(card).toBeVisible({ timeout: 15000 })
    await card.getByTestId('proposal-counter').click()

    const counterForm = page.getByTestId('proposal-terms-form')
    await expect(counterForm).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('proposal-days-input')).toHaveValue('5')
    await page.getByTestId('proposal-days-input').fill('7')
    await page.getByTestId('proposal-counter-note').fill('Make it a full week?')
    await page.getByTestId('proposal-counter-send').click()

    await expect
      .poll(
        async () => {
          const row = await proposalRow(proposalId)
          if (!row) return null
          const ct = row.counter_terms as { params?: { days?: number } } | null
          return `${row.status}|${ct?.params?.days}|${row.counter_note}`
        },
        { timeout: 15000, message: 'counter should persist revised terms + note' },
      )
      .toBe('countered|7|Make it a full week?')

    // Kid sees the counteroffer and accepts (ONE round — gate §5)
    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const counteredRow = page.getByTestId('proposal-row-countered')
    await expect(counteredRow).toBeVisible({ timeout: 15000 })
    await expect(counteredRow.getByText('7 days in a row')).toBeVisible()
    await expect(counteredRow.getByText('"Make it a full week?"')).toBeVisible()
    await counteredRow.getByTestId('counter-accept').click()

    await expect
      .poll(async () => (await proposalRow(proposalId))?.status ?? null, {
        timeout: 15000,
        message: 'kid accept should set counter_accepted',
      })
      .toBe('counter_accepted')

    // Back to mom: the card returns as "Set it up" → WidgetConfiguration
    // prefilled for the STREAK TRACKER (counter terms, not the original 5)
    await loginAsMom(page)
    await openRequestsTab(page)
    const setupCard = page.getByTestId('proposal-card').filter({ hasText: `${PREFIX} movie night` })
    await expect(setupCard).toBeVisible({ timeout: 15000 })
    await expect(setupCard.getByTestId('proposal-counter-accepted-banner')).toBeVisible()
    await setupCard.getByTestId('proposal-setup').click()

    const widgetTitle = page.getByLabel('Title')
    await expect(widgetTitle).toBeVisible({ timeout: 15000 })
    await expect(widgetTitle).toHaveValue(`${PREFIX} practice piano — 7 days in a row`)
    await page.getByRole('button', { name: 'Deploy to Dashboard' }).click()

    // Tracker deployed to Casey with the promise recorded (G1/R2: firing on
    // goal-reached is the registered follow-up; the promise fields land now)
    let widgetId = ''
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('dashboard_widgets')
            .select('id, family_member_id, template_type, widget_config')
            .eq('family_id', familyId)
            .eq('title', `${PREFIX} practice piano — 7 days in a row`)
            .maybeSingle()
          if (!data) return null
          widgetId = data.id
          const cfg = data.widget_config as { prize_label?: string; goal_days?: number }
          return `${data.family_member_id}|${data.template_type}|${cfg.prize_label}|${cfg.goal_days}`
        },
        { timeout: 20000, message: 'streak tracker should deploy with the prize promise' },
      )
      .toBe(`${casey}|streak|${PREFIX} movie night|7`)

    await expect
      .poll(
        async () => {
          const row = await proposalRow(proposalId)
          return row ? `${row.status}|${row.created_artifact_type}|${row.created_artifact_id}` : null
        },
        { timeout: 15000, message: 'proposal should be accepted with the tracker artifact' },
      )
      .toBe(`accepted|tracker|${widgetId}`)
  })

  // ── 5. Decline with note → kid sees the outcome ────────────────────────────
  test('mom declines with a note; the kid list shows the outcome', async ({ page }) => {
    const casey = memberIds['Casey']
    await setMemberPrefs(casey, { my_rewards_sections: { propose: true } })

    const proposalId = await insertProposal({
      proposerId: casey,
      terms: {
        want_text: `${PREFIX} late night`,
        will_text: `${PREFIX} fold laundry`,
        earn_structure: 'once',
      },
    })

    await loginAsMom(page)
    await openRequestsTab(page)
    const card = page.getByTestId('proposal-card').filter({ hasText: `${PREFIX} late night` })
    await expect(card).toBeVisible({ timeout: 15000 })
    await card.getByTestId('proposal-decline-open').click()
    await card.locator('textarea').fill(`${PREFIX} not this week, love`)
    await card.getByTestId('proposal-decline-confirm').click()

    await expect
      .poll(
        async () => {
          const row = await proposalRow(proposalId)
          return row ? `${row.status}|${row.decline_note}` : null
        },
        { timeout: 15000, message: 'decline should persist status + note' },
      )
      .toBe(`declined|${PREFIX} not this week, love`)

    // Kid side: outcome + note visible
    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    const declinedRow = page
      .getByTestId('proposal-row-declined')
      .filter({ hasText: `${PREFIX} late night` })
    await expect(declinedRow).toBeVisible({ timeout: 15000 })
    await expect(declinedRow.getByText('Not this time')).toBeVisible()
    await expect(declinedRow.getByText(`"${PREFIX} not this week, love"`)).toBeVisible()
  })

  // ── 6. finish_list → routine checklist (Assign & Create) ──────────────────
  test('finish_list approval opens the routine flow with the items as steps', async ({ page }) => {
    const jordan = memberIds['Jordan']
    const proposalId = await insertProposal({
      proposerId: jordan,
      terms: {
        want_text: `${PREFIX} sleepover`,
        will_text: `${PREFIX} room reset`,
        earn_structure: 'finish_list',
        params: {
          items: [`${PREFIX} make bed`, `${PREFIX} clear floor`, `${PREFIX} empty trash`],
        },
      },
    })

    await loginAsMom(page)
    await openRequestsTab(page)
    const card = page.getByTestId('proposal-card').filter({ hasText: `${PREFIX} sleepover` })
    await expect(card).toBeVisible({ timeout: 15000 })
    await card.getByTestId('proposal-approve').click()

    // Routine mode with the proposed steps prefilled
    await expect(page.getByText(`${PREFIX} make bed`).first()).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Assign & Create', exact: true }).click()

    let taskId = ''
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('tasks')
            .select('id, assignee_id, task_type, template_id, source_reference_id')
            .eq('family_id', familyId)
            .eq('title', `${PREFIX} room reset`)
            .maybeSingle()
          if (!data) return null
          taskId = data.id
          return `${data.assignee_id}|${data.task_type}|${!!data.template_id}|${data.source_reference_id}`
        },
        { timeout: 20000, message: 'routine task should be created for Jordan' },
      )
      .toBe(`${jordan}|routine|true|${proposalId}`)

    await expect
      .poll(
        async () => {
          const row = await proposalRow(proposalId)
          return row ? `${row.status}|${row.created_artifact_type}|${row.created_artifact_id}` : null
        },
        { timeout: 15000, message: 'proposal should be accepted with the routine artifact' },
      )
      .toBe(`accepted|routine|${taskId}`)
  })

  // ── 7. Adult self-propose: PRIVATE by default, end-to-end to the prize ─────
  test('dad self-proposes a private reward; the earned prize is private at the query layer', async ({ page }) => {
    const mark = memberIds['Mark']
    await setMemberPrefs(mark, { my_rewards_sections: { propose: true } })

    await loginAsDad(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const section = page.getByTestId('mr-section-self-propose')
    await expect(section).toBeVisible({ timeout: 15000 })
    await section.getByTestId('self-propose-toggle').click()

    await section.getByTestId('proposal-want-input').fill(`${PREFIX} quiet evening`)
    await section.getByTestId('proposal-will-input').fill(`${PREFIX} organize the garage shelf`)
    // Visibility defaults to PRIVATE (§11) — no interaction needed
    await section.getByTestId('self-propose-setup').click()

    const titleInput = page.getByPlaceholder('What needs to be done?').first()
    await expect(titleInput).toBeVisible({ timeout: 15000 })
    await expect(titleInput).toHaveValue(`${PREFIX} organize the garage shelf`)
    await page.getByRole('button', { name: 'Create Task', exact: true }).click()

    // Task: self-assigned, PRIVATE reward promise, provenance
    let taskId = ''
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('tasks')
            .select('id, created_by, assignee_id, reward_visibility, source, reward_description')
            .eq('family_id', familyId)
            .eq('title', `${PREFIX} organize the garage shelf`)
            .maybeSingle()
          if (!data) return null
          taskId = data.id
          return `${data.created_by}|${data.assignee_id}|${data.reward_visibility}|${data.source}|${data.reward_description}`
        },
        { timeout: 20000, message: 'self-reward task should be private' },
      )
      .toBe(`${mark}|${mark}|private|reward_proposal|${PREFIX} quiet evening`)

    // Self-proposal recorded accepted with artifact refs (born accepted — §6).
    // POLL: the proposal row is inserted AFTER the task save (onCreated), so
    // it lands a beat after the task row the previous poll waited on.
    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('reward_proposals')
            .select('id, status, is_self_proposal, processed_by, created_artifact_type, created_artifact_id')
            .eq('family_id', familyId)
            .eq('terms->>want_text', `${PREFIX} quiet evening`)
            .maybeSingle()
          if (!data) return null
          return `${data.status}|${data.is_self_proposal}|${data.processed_by}|${data.created_artifact_type}|${data.created_artifact_id}`
        },
        { timeout: 15000, message: 'self-proposal should be recorded accepted with artifact refs' },
      )
      .toBe(`accepted|true|${mark}|task|${taskId}`)

    // The self-promise list shows it
    await expect(page.getByTestId('self-propose-list')).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByTestId('self-propose-list').getByText(`${PREFIX} quiet evening`),
    ).toBeVisible()

    // ── Award through the UNCHANGED Slice 1 pipeline ──
    const { data: completion, error: cErr } = await sr
      .from('task_completions')
      .insert({
        task_id: taskId,
        family_member_id: mark,
        member_id: mark,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (cErr) throw new Error(`completion fixture: ${cErr.message}`)

    const dadClient = await clientFor(TEST_USERS.mark)
    const { data: awardResult, error: aErr } = await dadClient.rpc(
      'award_custom_reward_for_completion',
      { p_task_completion_id: completion.id },
    )
    expect(aErr).toBeNull()
    expect((awardResult as { status: string }).status).toBe('awarded')

    const prizeId = (awardResult as { prize_id: string }).prize_id
    const { data: prize } = await sr
      .from('earned_prizes')
      .select('visibility, family_member_id, prize_text')
      .eq('id', prizeId)
      .single()
    expect(prize?.visibility).toBe('private')
    expect(prize?.family_member_id).toBe(mark)
    expect(prize?.prize_text).toBe(`${PREFIX} quiet evening`)

    // ── Query-layer visibility probes (never rendered-then-hidden, §11) ──
    // Sibling: ZERO rows
    const caseyClient = await clientFor(TEST_USERS.casey)
    const { data: caseyView } = await caseyClient.from('earned_prizes').select('id').eq('id', prizeId)
    expect(caseyView ?? []).toHaveLength(0)

    // Owner: sees it
    const { data: dadView } = await dadClient.from('earned_prizes').select('id').eq('id', prizeId)
    expect(dadView ?? []).toHaveLength(1)

    // Mom: sees it by default (mom-sees-all)...
    const momClient = await clientFor(TEST_USERS.sarah)
    const { data: momView } = await momClient.from('earned_prizes').select('id').eq('id', prizeId)
    expect(momView ?? []).toHaveLength(1)

    // ...unless she granted Mark personal rewards privacy (query layer)
    await setMemberPrefs(mark, { personal_rewards_privacy: true })
    const { data: momViewPrivate } = await momClient
      .from('earned_prizes')
      .select('id')
      .eq('id', prizeId)
    expect(momViewPrivate ?? []).toHaveLength(0)
    await setMemberPrefs(mark, { personal_rewards_privacy: false })
  })

  // ── 8. reward_proposals RLS probes ─────────────────────────────────────────
  test('RLS: sibling/dad cannot read kid proposals; no insert-as-other; privacy grant hides self-proposals from mom', async () => {
    const casey = memberIds['Casey']
    const alex = memberIds['Alex']
    const mark = memberIds['Mark']

    const caseyClient = await clientFor(TEST_USERS.casey)
    const alexClient = await clientFor(TEST_USERS.alex)
    const markClient = await clientFor(TEST_USERS.mark)
    const momClient = await clientFor(TEST_USERS.sarah)

    // Kid creates own proposal through the real INSERT policy
    const { data: created, error: insErr } = await caseyClient
      .from('reward_proposals')
      .insert({
        family_id: familyId,
        proposer_member_id: casey,
        status: 'pending',
        terms: terms({
          want_text: `${PREFIX} rls probe`,
          will_text: `${PREFIX} rls chore`,
          earn_structure: 'once',
        }),
      })
      .select('id')
      .single()
    expect(insErr).toBeNull()
    const probeId = created!.id

    // Sibling: cannot read it
    const { data: alexRead } = await alexClient.from('reward_proposals').select('id').eq('id', probeId)
    expect(alexRead ?? []).toHaveLength(0)

    // Sibling: cannot update it (0 rows affected)
    const { data: alexUpdate } = await alexClient
      .from('reward_proposals')
      .update({ status: 'accepted' })
      .eq('id', probeId)
      .select('id')
    expect(alexUpdate ?? []).toHaveLength(0)
    expect((await proposalRow(probeId))?.status).toBe('pending')

    // Dad (additional_adult): kid→mom proposals are mom's to process — 0 rows
    const { data: dadRead } = await markClient.from('reward_proposals').select('id').eq('id', probeId)
    expect(dadRead ?? []).toHaveLength(0)

    // Mom: sees it (she is the recipient)
    const { data: momRead } = await momClient.from('reward_proposals').select('id').eq('id', probeId)
    expect(momRead ?? []).toHaveLength(1)

    // A kid cannot insert AS another member
    const { error: forgeErr } = await caseyClient.from('reward_proposals').insert({
      family_id: familyId,
      proposer_member_id: alex,
      status: 'pending',
      terms: terms({
        want_text: `${PREFIX} forged`,
        will_text: `${PREFIX} forged chore`,
        earn_structure: 'once',
      }),
    })
    expect(forgeErr).not.toBeNull()

    // Dad's SELF-proposal: mom-visible by default, hidden under the privacy grant
    const selfId = await insertProposal({
      proposerId: mark,
      terms: {
        want_text: `${PREFIX} dad self probe`,
        will_text: `${PREFIX} dad self chore`,
        earn_structure: 'once',
      },
      status: 'accepted',
      isSelf: true,
      processedBy: mark,
    })

    const { data: momSelfRead } = await momClient.from('reward_proposals').select('id').eq('id', selfId)
    expect(momSelfRead ?? []).toHaveLength(1)

    await setMemberPrefs(mark, { personal_rewards_privacy: true })
    const { data: momSelfPrivate } = await momClient
      .from('reward_proposals')
      .select('id')
      .eq('id', selfId)
    expect(momSelfPrivate ?? []).toHaveLength(0)
    // Dad still sees his own
    const { data: dadSelfRead } = await markClient.from('reward_proposals').select('id').eq('id', selfId)
    expect(dadSelfRead ?? []).toHaveLength(1)
    await setMemberPrefs(mark, { personal_rewards_privacy: false })
  })
})
