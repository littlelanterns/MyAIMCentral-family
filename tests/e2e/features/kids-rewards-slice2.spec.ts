/**
 * KIDS-REWARDS-PAGE — Slice 2 verification (My Rewards page + section opt-ins)
 *
 * Proof-of-done for the Slice 2 build per the active build file
 * (.claude/rules/current-builds/KIDS-REWARDS-PAGE.md) and founder gate:
 *
 *   1. Settings (Q1 + founder ruling 2026-06-12): the page DEFAULTS ON; the
 *      GamificationSettingsModal "My Rewards Page" section writes
 *      show_my_rewards + my_rewards_sections to family_members.preferences.
 *      Play members get NO page toggle (Fun tab needs no gate) but DO get the
 *      "Money owed" opt-in (founder amendment 2026-06-12).
 *   2. Default-ON + invisibility backstop: clean baseline renders the page;
 *      explicit show_my_rewards=false shows the friendly not-enabled card,
 *      never sections.
 *   3. CONVENTION #271 RECONCILIATION (REQUIRED, fixture-driven): the kid's
 *      ONE owed number on My Rewards === calculate_running_balance (the
 *      Balance page's source) === independent ground truth computed from the
 *      inserted financial_transactions fixtures. Display surface and math
 *      surface derive from the same query.
 *   4. Finances default MIRRORS child_can_see_finances (Q1 approved change)
 *      when no explicit override exists.
 *   5. Play money opt-in (founder amendment 2026-06-12, amends PRD-28's
 *      "never on Play" for this surface): finances ABSENT on /rewards by
 *      default; renders only on mom's explicit opt-in. No Redeem button
 *      either way — "Ask a grown-up to use it!" (Q2/Q3).
 *   6. Kid-final self-redeem from the page (Q2) + Previously Redeemed
 *      click-in history with provenance ("Earned by: {task title}") and
 *      redeemed-at attribution (Pillar 4, Q6, Q8).
 *   7. Victories section (gate Section 7): tappable record; narrative from
 *      victory_celebrations via ARRAY MEMBERSHIP (victories.celebration_text
 *      is a dead column); celebration-only fallback when no narrative.
 *   8. View As (Convention #39): mom viewing a kid sees the kid's page with
 *      NO self-redeem button (redeem_own_prize is earner-auth-only).
 *
 * Fixture hygiene: KRSLICE2-prefixed fixtures created/removed via service
 * role (role-scoping-leak-pass pattern), Testworth family. Member
 * preferences are reset to the clean baseline (keys removed) on cleanup.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import {
  loginAsMom,
  loginAsCasey,
  loginAsAlex,
  loginAsRiley,
} from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { todayLocalIso } from '../helpers/dates'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!

// Service role client — fixtures + ground-truth assertions (bypasses RLS)
const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'KRSLICE2'

let familyId = ''
const memberIds: Record<string, string> = {}

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

// ─── Preference helpers (merge-write; cleanup strips our keys) ───────────────

const MY_REWARDS_PREF_KEYS = [
  'show_my_rewards',
  'my_rewards_sections',
  'personal_rewards_privacy',
] as const

async function setMemberPrefs(
  mid: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const { data, error } = await sr
    .from('family_members')
    .select('preferences')
    .eq('id', mid)
    .single()
  if (error) throw new Error(`read preferences: ${error.message}`)
  const prefs = { ...((data.preferences as Record<string, unknown>) ?? {}), ...updates }
  const { error: uErr } = await sr
    .from('family_members')
    .update({ preferences: prefs })
    .eq('id', mid)
  if (uErr) throw new Error(`write preferences: ${uErr.message}`)
}

async function stripMyRewardsPrefs(mid: string): Promise<void> {
  const { data, error } = await sr
    .from('family_members')
    .select('preferences')
    .eq('id', mid)
    .single()
  if (error) throw new Error(`read preferences: ${error.message}`)
  const prefs = { ...((data.preferences as Record<string, unknown>) ?? {}) }
  for (const key of MY_REWARDS_PREF_KEYS) delete prefs[key]
  const { error: uErr } = await sr
    .from('family_members')
    .update({ preferences: prefs })
    .eq('id', mid)
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

async function createPrize(opts: {
  earnerId: string
  prizeText: string
  sourceType?: string
  sourceId?: string
  redeemed?: boolean
}): Promise<string> {
  const { data, error } = await sr
    .from('earned_prizes')
    .insert({
      family_id: familyId,
      family_member_id: opts.earnerId,
      source_type: opts.sourceType ?? 'task_completion',
      source_id: opts.sourceId ?? randomUUID(),
      prize_type: 'text',
      prize_text: opts.prizeText,
      prize_name: opts.prizeText.slice(0, 80),
      visibility: 'family',
      ...(opts.redeemed
        ? { redeemed_at: new Date().toISOString(), redeemed_by: opts.earnerId }
        : {}),
    })
    .select('id')
    .single()
  if (error) throw new Error(`prize fixture: ${error.message}`)
  return data.id
}

/** Pool fixture state for the mirror-default test (test 4). */
let caseyPoolCreatedId: string | null = null
let caseyPoolOriginal: { id: string; child_can_see_finances: boolean } | null = null

/**
 * Ensure Casey has a primary allowance pool and set child_can_see_finances.
 * Reuses an existing pool when present (original value restored on cleanup);
 * otherwise inserts a DISABLED fixture pool (enabled=false — the allowance
 * cron only processes enabled configs, so no side effects).
 */
async function setCaseyPoolCanSeeFinances(canSee: boolean): Promise<void> {
  const casey = await memberId('Casey')
  const { data: pools, error } = await sr
    .from('allowance_configs')
    .select('id, pool_name, child_can_see_finances')
    .eq('family_member_id', casey)
    .order('created_at', { ascending: true })
  if (error) throw new Error(`read pools: ${error.message}`)

  const primary = (pools ?? []).find(p => p.pool_name === 'default') ?? (pools ?? [])[0]
  if (primary) {
    if (!caseyPoolOriginal && !caseyPoolCreatedId) {
      caseyPoolOriginal = {
        id: primary.id,
        child_can_see_finances: primary.child_can_see_finances,
      }
    }
    const { error: uErr } = await sr
      .from('allowance_configs')
      .update({ child_can_see_finances: canSee })
      .eq('id', primary.id)
    if (uErr) throw new Error(`update pool: ${uErr.message}`)
    return
  }

  const { data: created, error: cErr } = await sr
    .from('allowance_configs')
    .insert({
      family_id: familyId,
      family_member_id: casey,
      enabled: false, // never picked up by the allowance cron
      pool_name: 'default',
      child_can_see_finances: canSee,
    })
    .select('id')
    .single()
  if (cErr) throw new Error(`create pool fixture: ${cErr.message}`)
  caseyPoolCreatedId = created.id
}

/** Transaction fixtures for the #271 reconciliation test. */
const txIds: string[] = []

async function runningBalance(mid: string): Promise<number> {
  const { data, error } = await sr.rpc('calculate_running_balance', {
    p_member_id: mid,
  })
  if (error) throw new Error(`calculate_running_balance: ${error.message}`)
  return Number(data ?? 0)
}

async function insertTransaction(opts: {
  memberId: string
  type: string
  amount: number
  balanceAfter: number
  description: string
}): Promise<string> {
  const { data, error } = await sr
    .from('financial_transactions')
    .insert({
      family_id: familyId,
      family_member_id: opts.memberId,
      transaction_type: opts.type,
      amount: opts.amount,
      balance_after: opts.balanceAfter,
      description: opts.description,
    })
    .select('id')
    .single()
  if (error) throw new Error(`transaction fixture: ${error.message}`)
  return data.id
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

async function cleanup() {
  // Preferences back to clean baseline for every member we touch
  for (const name of ['Casey', 'Alex', 'Jordan', 'Ruthie']) {
    if (!memberIds[name]) await memberId(name)
    await stripMyRewardsPrefs(memberIds[name])
  }

  // Prizes (+ prize_redeemed notifications referencing them)
  const { data: prizes } = await sr
    .from('earned_prizes')
    .select('id')
    .eq('family_id', familyId)
    .ilike('prize_text', `${PREFIX}%`)
  const prizeIds = (prizes ?? []).map(p => p.id)
  if (prizeIds.length) {
    await sr
      .from('notifications')
      .delete()
      .eq('family_id', familyId)
      .eq('notification_type', 'prize_redeemed')
      .in('source_reference_id', prizeIds)
    await sr.from('earned_prizes').delete().in('id', prizeIds)
  }

  // Tasks (provenance fixtures; task_rewards/completions cascade via FK)
  await sr.from('tasks').delete().eq('family_id', familyId).ilike('title', `${PREFIX}%`)

  // Victories + celebrations
  await sr
    .from('victory_celebrations')
    .delete()
    .eq('family_id', familyId)
    .ilike('narrative', `${PREFIX}%`)
  await sr
    .from('victories')
    .delete()
    .eq('family_id', familyId)
    .ilike('description', `${PREFIX}%`)

  // Transaction fixtures — by recorded id AND description prefix (crashed-run
  // leftovers). Test fixtures only; the append-only rule (Convention #223)
  // governs app behavior, and zero-fixture-residue requires the sweep.
  if (txIds.length) {
    await sr.from('financial_transactions').delete().in('id', txIds)
    txIds.length = 0
  }
  await sr
    .from('financial_transactions')
    .delete()
    .eq('family_id', familyId)
    .ilike('description', `${PREFIX}%`)

  // Pool fixture: restore original value or delete the created row
  if (caseyPoolOriginal) {
    await sr
      .from('allowance_configs')
      .update({ child_can_see_finances: caseyPoolOriginal.child_can_see_finances })
      .eq('id', caseyPoolOriginal.id)
    caseyPoolOriginal = null
  }
  if (caseyPoolCreatedId) {
    await sr.from('allowance_configs').delete().eq('id', caseyPoolCreatedId)
    caseyPoolCreatedId = null
  }

  // Any View As session rows the View As tests left open
  for (const name of ['Jordan', 'Ruthie']) {
    const mid = memberIds[name]
    if (mid) {
      await sr
        .from('view_as_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('viewing_as_id', mid)
        .is('ended_at', null)
    }
  }
}

// ─── Suite ───────────────────────────────────────────────────────────────────

test.describe('KIDS-REWARDS-PAGE Slice 2 — My Rewards page + section opt-ins', () => {
  test.describe.configure({ timeout: 120_000 })

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
      memberId('Casey'),
      memberId('Alex'),
      memberId('Jordan'),
      memberId('Ruthie'),
    ])

    await cleanup() // clear leftovers from any crashed prior run
  })

  test.afterAll(async () => {
    await cleanup()
  })

  // ── 1. Settings section writes preferences; Play gets honest controls ──────
  test('GamificationSettingsModal My Rewards section — writes prefs; Play member shape', async ({ page }) => {
    const jordan = memberIds['Jordan']

    await loginAsMom(page)
    await page.goto('/family-members')
    await waitForAppReady(page)

    // Open Jordan's edit pane → Gamification Settings → My Rewards Page section
    const jordanCard = page
      .locator('.card-hover')
      .filter({ has: page.getByText('Jordan', { exact: true }) })
    await jordanCard.getByTitle('Edit').click()
    await jordanCard.getByRole('button', { name: 'Gamification Settings' }).click()

    const settingsSection = page.getByTestId('my-rewards-settings-section')
    await page.getByRole('button', { name: 'My Rewards Page' }).click()
    await expect(settingsSection).toBeVisible()

    // Founder ruling 2026-06-12: the page DEFAULTS ON (clean baseline)
    const pageSwitch = settingsSection.getByRole('switch', { name: 'Show My Rewards page' })
    await expect(pageSwitch).toHaveAttribute('aria-checked', 'true')

    // Toggle OFF → explicit preferences.show_my_rewards = false
    await pageSwitch.click()
    await expect
      .poll(async () => (await readPrefs(jordan)).show_my_rewards ?? null, {
        timeout: 10000,
        message: 'show_my_rewards=false should persist to preferences',
      })
      .toBe(false)

    // Toggle back ON → explicit true
    await pageSwitch.click()
    await expect
      .poll(async () => (await readPrefs(jordan)).show_my_rewards ?? null, {
        timeout: 10000,
        message: 'show_my_rewards=true should persist to preferences',
      })
      .toBe(true)

    // Section toggles are visible while the page is on; flip Victories ON
    await settingsSection.getByRole('switch', { name: 'Victories' }).click()
    await expect
      .poll(
        async () => {
          const prefs = await readPrefs(jordan)
          const sections = (prefs.my_rewards_sections ?? {}) as Record<string, unknown>
          return sections.victories ?? null
        },
        { timeout: 10000, message: 'victories override should persist' },
      )
      .toBe(true)

    // Close the modal (Escape closes transient ModalV2)
    await page.keyboard.press('Escape')
    await expect(settingsSection).not.toBeVisible()

    // ── Play member shape: no page toggle, no Money owed control ──
    const ruthieCard = page
      .locator('.card-hover')
      .filter({ has: page.getByText('Ruthie', { exact: true }) })
    await ruthieCard.getByTitle('Edit').click()
    await ruthieCard.getByRole('button', { name: 'Gamification Settings' }).click()
    await page.getByRole('button', { name: 'My Rewards Page' }).click()

    const ruthieSection = page.getByTestId('my-rewards-settings-section')
    await expect(ruthieSection).toBeVisible()
    await expect(ruthieSection.getByText(/rewards live on their Fun tab/)).toBeVisible()
    await expect(
      ruthieSection.getByRole('switch', { name: 'Show My Rewards page' }),
    ).toHaveCount(0)
    // Founder amendment 2026-06-12: Play money is a mom OPT-IN — the toggle
    // IS offered for Play members, defaulting OFF.
    const playMoneySwitch = ruthieSection.getByRole('switch', { name: 'Money owed' })
    await expect(playMoneySwitch).toBeVisible()
    await expect(playMoneySwitch).toHaveAttribute('aria-checked', 'false')
    // Section toggles ARE present (the Fun tab exists without a page gate)
    await expect(ruthieSection.getByRole('switch', { name: 'Points & streak' })).toBeVisible()
  })

  // ── 2. Default ON + invisibility backstop when mom turns it off ───────────
  test('page defaults ON; explicit off shows the not-enabled card, never sections', async ({ page }) => {
    const alex = memberIds['Alex']

    // Clean baseline → page renders by default (founder ruling 2026-06-12)
    await stripMyRewardsPrefs(alex)
    await loginAsAlex(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('my-rewards-sections')).toBeVisible()
    await expect(page.getByTestId('my-rewards-not-enabled')).toHaveCount(0)

    // Mom explicitly turns the page off → friendly card, never sections
    await setMemberPrefs(alex, { show_my_rewards: false })
    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByTestId('my-rewards-not-enabled')).toBeVisible()
    await expect(page.getByTestId('my-rewards-sections')).toHaveCount(0)
  })

  // ── 3. CONVENTION #271 — owed number reconciles with the Balance source ────
  test('Convention #271: owed number === calculate_running_balance === fixture ground truth', async ({ page }) => {
    const casey = memberIds['Casey']

    await setMemberPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { finances: true, custom_rewards: true },
    })

    // Fixture chain: read the CURRENT balance, then append three transactions
    // with a correct balance_after chain (append-only ledger invariant).
    const before = await runningBalance(casey)
    const deltas = [
      { type: 'allowance_earned', amount: 12.5, description: `${PREFIX} allowance earned` },
      { type: 'opportunity_earned', amount: 3.25, description: `${PREFIX} opportunity money` },
      { type: 'payment_made', amount: -5.0, description: `${PREFIX} payment made` },
    ]
    let running = before
    for (const d of deltas) {
      running = Math.round((running + d.amount) * 100) / 100
      txIds.push(
        await insertTransaction({
          memberId: casey,
          type: d.type,
          amount: d.amount,
          balanceAfter: running,
          description: d.description,
        }),
      )
    }
    const expected = Math.round((before + 10.75) * 100) / 100

    // Ground truth #1: the Balance page's source (calculate_running_balance)
    const rpcBalance = await runningBalance(casey)
    expect(rpcBalance).toBeCloseTo(expected, 2)

    // Ground truth #2: the page's ONE owed number — same value, same source
    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const owed = page.getByTestId('my-rewards-owed')
    await expect(owed).toBeVisible()
    await expect(owed).toHaveAttribute('data-amount', expected.toFixed(2))
    await expect(owed).toHaveText(`$${expected.toFixed(2)}`)

    // Tap-through breakdown renders the ledger (one of our fixture rows visible)
    await page.getByTestId('mr-finances-details').click()
    await expect(page.getByText(`${PREFIX} allowance earned`).first()).toBeVisible()
  })

  // ── 4. Finances default mirrors child_can_see_finances (Q1 change) ─────────
  test('finances section default mirrors child_can_see_finances when no override', async ({ page }) => {
    const casey = memberIds['Casey']

    // Page on, NO finances override (points default ON keeps the page non-empty)
    await setMemberPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { custom_rewards: true },
    })

    await setCaseyPoolCanSeeFinances(false)
    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await expect(page.getByTestId('mr-section-points')).toBeVisible()
    await expect(page.getByTestId('mr-section-finances')).toHaveCount(0)

    await setCaseyPoolCanSeeFinances(true)
    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByTestId('mr-section-finances')).toBeVisible()
  })

  // ── 5. Play money opt-in — default OFF; renders only on mom's opt-in ──────
  test('Play /rewards: finances absent by default, renders on mom opt-in; no Redeem button', async ({ page }) => {
    const ruthie = memberIds['Ruthie']

    // (a) No finances override → default OFF for Play (founder amendment
    //     2026-06-12: opt-in, not mirror, not hard-never)
    await setMemberPrefs(ruthie, {
      my_rewards_sections: {
        custom_rewards: true,
        victories: true,
      },
    })
    await createPrize({ earnerId: ruthie, prizeText: `${PREFIX} Sticker surprise` })

    await loginAsRiley(page)
    await page.goto('/rewards')
    await waitForAppReady(page)

    await expect(page.getByTestId('mr-section-points')).toBeVisible()
    await expect(page.getByTestId('mr-section-custom')).toBeVisible()
    await expect(page.getByTestId('mr-section-finances')).toHaveCount(0)
    // Q2: no redeem on Play — warm grown-up prompt instead (either way)
    await expect(page.getByTestId('self-redeem-button')).toHaveCount(0)
    await expect(page.getByText('Ask a grown-up to use it!').first()).toBeVisible()

    // (b) Mom explicitly opts Ruthie in → the money section renders on Play
    await setMemberPrefs(ruthie, {
      my_rewards_sections: {
        custom_rewards: true,
        victories: true,
        finances: true,
      },
    })
    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByTestId('mr-section-finances')).toBeVisible()
    await expect(page.getByTestId('my-rewards-owed')).toBeVisible()
    await expect(page.getByTestId('self-redeem-button')).toHaveCount(0)
  })

  // ── 6. Self-redeem + Previously Redeemed history with provenance ──────────
  test('kid self-redeems from the page; history shows provenance + attribution', async ({ page }) => {
    const casey = memberIds['Casey']
    const sarah = memberIds['Sarah']

    await setMemberPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { custom_rewards: true },
    })

    // Provenance target: a real task this prize points back to
    const { data: task, error: tErr } = await sr
      .from('tasks')
      .insert({
        family_id: familyId,
        created_by: sarah,
        assignee_id: casey,
        title: `${PREFIX} Provenance Task`,
        task_type: 'task',
        status: 'completed',
        source: 'manual',
      })
      .select('id')
      .single()
    if (tErr) throw new Error(`task fixture: ${tErr.message}`)

    const prizeId = await createPrize({
      earnerId: casey,
      prizeText: `${PREFIX} Ice cream trip`,
      sourceType: 'task_completion',
      sourceId: task.id,
    })

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    // Redeem (kid-final, with confirmation — Q2)
    await expect(page.getByText(`${PREFIX} Ice cream trip`).first()).toBeVisible()
    await page.getByTestId('self-redeem-button').first().click()
    await page.getByTestId('confirm-self-redeem').click()

    await expect
      .poll(
        async () => {
          const { data } = await sr
            .from('earned_prizes')
            .select('redeemed_at, redeemed_by')
            .eq('id', prizeId)
            .single()
          return data?.redeemed_at ? data.redeemed_by : null
        },
        { timeout: 15000, message: 'redeem_own_prize should set redeemed fields' },
      )
      .toBe(casey)

    // History is click-in only (Pillar 4) — button appears once something is redeemed
    const historyButton = page.getByTestId('mr-history-button')
    await expect(historyButton).toBeVisible()
    await historyButton.click()

    const history = page.getByTestId('redeemed-history')
    await expect(history).toBeVisible()
    await expect(history.getByText(`${PREFIX} Ice cream trip`)).toBeVisible()
    // Provenance resolver: "how they earned it" via the tasks join (Q6)
    await expect(
      history.getByText(`Earned by: ${PREFIX} Provenance Task`),
    ).toBeVisible()
  })

  // ── 7. Victories section — narrative via array membership + fallback ──────
  test('victories section lists wins; tap shows celebration narrative or fallback', async ({ page }) => {
    const casey = memberIds['Casey']

    await setMemberPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { victories: true },
    })

    const { data: v1, error: v1Err } = await sr
      .from('victories')
      .insert({
        family_id: familyId,
        family_member_id: casey,
        description: `${PREFIX} Cleaned the whole garage`,
        source: 'manual',
        member_type: 'teen',
        importance: 'big_win',
      })
      .select('id')
      .single()
    if (v1Err) throw new Error(`victory fixture: ${v1Err.message}`)

    const { data: v2, error: v2Err } = await sr
      .from('victories')
      .insert({
        family_id: familyId,
        family_member_id: casey,
        description: `${PREFIX} Helped little sister with reading`,
        source: 'manual',
        member_type: 'teen',
        importance: 'standard',
      })
      .select('id')
      .single()
    if (v2Err) throw new Error(`victory fixture 2: ${v2Err.message}`)

    // Narrative linked by ARRAY MEMBERSHIP (victory_ids) — recon finding #8
    const { error: cErr } = await sr.from('victory_celebrations').insert({
      family_id: familyId,
      family_member_id: casey,
      celebration_date: todayLocalIso(),
      mode: 'individual',
      narrative: `${PREFIX} NARRATIVE What a day — the garage has never looked better. That took real follow-through!`,
      victory_ids: [v1.id],
      victory_count: 1,
    })
    if (cErr) throw new Error(`celebration fixture: ${cErr.message}`)

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const victoriesSection = page.getByTestId('mr-section-victories')
    await expect(victoriesSection).toBeVisible()
    await expect(
      victoriesSection.getByText(`${PREFIX} Cleaned the whole garage`),
    ).toBeVisible()

    // Tap the celebrated victory → full narrative
    await victoriesSection.getByText(`${PREFIX} Cleaned the whole garage`).click()
    await expect(page.getByTestId('celebration-narrative')).toBeVisible()
    await expect(page.getByText(/the garage has never looked better/)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('celebration-detail')).toHaveCount(0)

    // Tap the un-celebrated victory → celebration-only fallback
    await victoriesSection
      .getByText(`${PREFIX} Helped little sister with reading`)
      .click()
    await expect(page.getByTestId('celebration-fallback')).toBeVisible()
    await expect(page.getByTestId('celebration-narrative')).toHaveCount(0)
  })

  // ── 8. View As — kid's page renders for mom, no self-redeem offered ───────
  test('View As shows the kid page with no self-redeem (earner-auth-only RPC)', async ({ page }) => {
    const jordan = memberIds['Jordan']

    await setMemberPrefs(jordan, {
      show_my_rewards: true,
      my_rewards_sections: { custom_rewards: true },
    })
    await createPrize({ earnerId: jordan, prizeText: `${PREFIX} Jordan popsicle` })

    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Mom's fresh-start View As: perspective tab → member pill
    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Jordan' }).first().click()

    // Modal mounts with the kid's shell
    await expect(page.locator('[data-testid="view-as-exit"]')).toBeVisible({
      timeout: 15000,
    })

    // The kid's morning/evening rhythm modal can auto-open over the dashboard
    // (auto_open timing window) — it mounts a beat AFTER the modal shell, so
    // wait for it deterministically, then dismiss any open dialog.
    await page.waitForTimeout(3000)
    while ((await page.locator('[role="dialog"]').count()) > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }

    // Guided shell: My Rewards lives in the bottom-nav More menu (the guided
    // shell has its own purpose-built nav — gated by the target's
    // show_my_rewards, which we set above)
    await page.getByRole('button', { name: 'More' }).click()
    await page.getByText('My Rewards', { exact: true }).first().click()

    await expect(page.getByTestId('mr-section-custom')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(`${PREFIX} Jordan popsicle`).first()).toBeVisible()
    // redeem_own_prize is earner-auth-only — mom's session must not be offered
    // a button that would fail (Convention #39)
    await expect(page.getByTestId('self-redeem-button')).toHaveCount(0)

    // End the session row directly (the modal can auto-close on shell swap —
    // documented quirk from the View-As build; DB cleanup is the reliable path)
    await sr
      .from('view_as_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('viewing_as_id', jordan)
      .is('ended_at', null)
  })

  // ── 9. View As a PLAY kid — bottom-nav tabs navigate the MODAL router ─────
  // Founder eyes-on 2026-06-12: PlayShell's nav used raw NavLinks, which
  // changed mom's real router UNDER the modal while the modal kept rendering
  // the same page ("every tab is the same page"), and the modal neither
  // mapped /rewards nor allowed Play's nav paths. This pins the fix.
  test('View As Ruthie: Play Fun tab navigates inside the modal to the rewards page', async ({ page }) => {
    const ruthie = memberIds['Ruthie']

    await setMemberPrefs(ruthie, {
      my_rewards_sections: { custom_rewards: true },
    })
    await createPrize({ earnerId: ruthie, prizeText: `${PREFIX} Ruthie bubbles` })

    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Ruthie' }).first().click()
    await expect(page.locator('[data-testid="view-as-exit"]')).toBeVisible({ timeout: 15000 })

    // Tap the Play bottom-nav "Fun" tab INSIDE the modal
    await page.getByRole('button', { name: 'Fun' }).click()

    // The modal's internal router must land on PlayRewards — sections render
    await expect(page.getByTestId('mr-section-custom')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(`${PREFIX} Ruthie bubbles`).first()).toBeVisible()
    // And mom's REAL router must still be on her dashboard (the old bug
    // navigated the app underneath the modal)
    expect(new URL(page.url()).pathname).toBe('/dashboard')

    await sr
      .from('view_as_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('viewing_as_id', ruthie)
      .is('ended_at', null)
  })
})
