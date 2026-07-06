/**
 * KIDS-REWARDS-PAGE — Slice 5 verification (2026-07-05)
 *
 * Program-level spec for the final slice of KIDS-REWARDS-PAGE. Slices 1-4
 * have their own dedicated specs (kids-rewards-slice1..4.spec.ts) that stay
 * green independently — this file covers ONLY what Slice 5 added to the
 * Prize Board's Prizes tab (per STUB_REGISTRY.md / the gate's Slice 5 row):
 *
 *   1. "Arrange: By kid / By date" toggle — both render modes correct,
 *      choice persists across reload (localStorage, mirrors LedgerView's
 *      By child/By date pattern from the Balance tab).
 *   2. Summary strip — correct prize/kid counts, prizes/privileges only
 *      (never a dollar amount), EXCLUDES mom's own self-rewards.
 *   3. Mom's own prizes NEVER leak into the general "owed to kids" views —
 *      not the summary strip, not either arrangement, not Recently Redeemed
 *      (R4-REVISED: her own rewards live ONLY in her "Me" pill).
 *   4. The "Me" pill (R4-REVISED): mom-only entry point reusing the same
 *      building blocks as MyRewards.tsx's Custom Rewards section — her own
 *      PrizeBox cards, self-redeem, Previously Redeemed history, and the
 *      "Promise Yourself a Reward" self-propose screen. Absent for a
 *      finance-granted dad (his self-rewards live on his own /my-rewards).
 *
 * Fixture hygiene: KRS5-prefixed fixtures created/removed via service role
 * (kids-rewards-slice1.spec.ts pattern), Testworth family.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'
import { loginAsMom, loginAsDad } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!

// Service role client — fixtures + ground-truth assertions (bypasses RLS)
const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'KRS5'

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

/** Insert an earned_prizes row directly (fixture only — mirrors slice1's helper). */
async function createPrize(opts: {
  earnerId: string
  prizeText: string
  redeemed?: boolean
}): Promise<string> {
  const { data, error } = await sr
    .from('earned_prizes')
    .insert({
      family_id: familyId,
      family_member_id: opts.earnerId,
      source_type: 'task_completion',
      source_id: randomUUID(),
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

const GRANT_KEY = 'financial_tracking'

async function grantDad(target: string, level: string) {
  const sarah = await memberId('Sarah')
  const mark = await memberId('Mark')
  await sr
    .from('member_permissions')
    .delete()
    .eq('family_id', familyId)
    .eq('granted_to', mark)
    .eq('permission_key', GRANT_KEY)
    .eq('target_member_id', target)
  const { error } = await sr.from('member_permissions').insert({
    family_id: familyId,
    granting_member_id: sarah,
    granted_to: mark,
    target_member_id: target,
    permission_key: GRANT_KEY,
    access_level: level,
    permission_value: { access_level: level },
  })
  if (error) throw new Error(`grant: ${error.message}`)
}

async function clearDadGrants() {
  const mark = await memberId('Mark')
  await sr
    .from('member_permissions')
    .delete()
    .eq('family_id', familyId)
    .eq('granted_to', mark)
    .eq('permission_key', GRANT_KEY)
}

async function cleanupPrizes() {
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
}

test.describe('KIDS-REWARDS-PAGE Slice 5 — Prize Board arrangement + Me pill', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id
    await Promise.all([memberId('Sarah'), memberId('Mark'), memberId('Casey'), memberId('Jordan')])
  })

  test.afterEach(async () => {
    await cleanupPrizes()
    await clearDadGrants()
  })

  test('1. Arrangement toggle: both modes render correctly and persist across reload', async ({ page }) => {
    const casey = await memberId('Casey')
    const jordan = await memberId('Jordan')
    await createPrize({ earnerId: casey, prizeText: `${PREFIX} Casey ice cream trip` })
    await createPrize({ earnerId: jordan, prizeText: `${PREFIX} Jordan movie night` })

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes' }).click()

    // Default: By kid — grouped headers per member.
    await expect(page.getByTestId('prizes-by-kid-list')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('prizes-by-date-list')).not.toBeVisible()
    const byKidList = page.getByTestId('prizes-by-kid-list')
    await expect(byKidList.getByText('Casey', { exact: true })).toBeVisible()
    await expect(byKidList.getByText('Jordan', { exact: true })).toBeVisible()
    await expect(page.getByText(`${PREFIX} Casey ice cream trip`)).toBeVisible()
    await expect(page.getByText(`${PREFIX} Jordan movie night`)).toBeVisible()

    // Switch to By date — flat stream, member-tag pills instead of headers.
    await page.getByTestId('prizes-arrangement-by_date').click()
    await expect(page.getByTestId('prizes-by-date-list')).toBeVisible()
    await expect(page.getByTestId('prizes-by-kid-list')).not.toBeVisible()
    const byDateList = page.getByTestId('prizes-by-date-list')
    await expect(byDateList.getByText('Casey', { exact: true })).toBeVisible()
    await expect(byDateList.getByText('Jordan', { exact: true })).toBeVisible()

    // Reload + re-navigate to Prizes — arrangement choice survives (localStorage).
    await page.reload()
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes' }).click()
    await expect(page.getByTestId('prizes-by-date-list')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('prizes-by-kid-list')).not.toBeVisible()

    // Regression: the shared PrizeOwedRow's Redeem action still works post-refactor.
    await page
      .getByRole('button', { name: `Mark redeemed: ${PREFIX} Casey ice cream trip` })
      .click()
    await expect(page.getByText(`${PREFIX} Casey ice cream trip`)).not.toBeVisible({ timeout: 10000 })

    // Reset arrangement to the default for later tests in this serial file.
    await page.getByTestId('prizes-arrangement-by_kid').click()
  })

  test('2. Summary strip: correct prize/kid counts, excludes mom\'s own reward', async ({ page }) => {
    const sarah = await memberId('Sarah')
    const casey = await memberId('Casey')
    const jordan = await memberId('Jordan')
    await createPrize({ earnerId: casey, prizeText: `${PREFIX} Casey strip test 1` })
    await createPrize({ earnerId: casey, prizeText: `${PREFIX} Casey strip test 2` })
    await createPrize({ earnerId: jordan, prizeText: `${PREFIX} Jordan strip test` })
    await createPrize({ earnerId: sarah, prizeText: `${PREFIX} Sarah private treat` })

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes' }).click()

    const strip = page.getByTestId('prizes-summary-strip')
    await expect(strip).toBeVisible({ timeout: 15000 })
    await expect(strip).toContainText('3')
    await expect(strip).toContainText('2')
    // Never a dollar sign in this strip — prizes/privileges only.
    await expect(strip).not.toContainText('$')

    // Mom's own reward never appears in the general owed views.
    await expect(page.getByTestId('prizes-by-kid-list')).not.toContainText(`${PREFIX} Sarah private treat`)
    await page.getByTestId('prizes-arrangement-by_date').click()
    await expect(page.getByTestId('prizes-by-date-list')).not.toContainText(`${PREFIX} Sarah private treat`)
    await page.getByTestId('prizes-arrangement-by_kid').click()
  })

  test('3. Recently redeemed excludes mom\'s own reward; kid redemption still works', async ({ page }) => {
    const sarah = await memberId('Sarah')
    const jordan = await memberId('Jordan')
    await createPrize({ earnerId: jordan, prizeText: `${PREFIX} Jordan already redeemed`, redeemed: true })
    await createPrize({ earnerId: sarah, prizeText: `${PREFIX} Sarah already redeemed`, redeemed: true })

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes' }).click()

    await page.getByRole('button', { name: /Recently redeemed/ }).click()
    await expect(page.getByText(`${PREFIX} Jordan already redeemed`)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(`${PREFIX} Sarah already redeemed`)).not.toBeVisible()

    // Un-redeem still works on a kid's row post-refactor. Sarah's own reward
    // is excluded from this list entirely (assertion above), so exactly one
    // Un-redeem button is present here — no disambiguation needed.
    await page.getByTestId('unredeem-button').click()
    await expect(page.getByTestId('prizes-by-kid-list')).toContainText(`${PREFIX} Jordan already redeemed`, { timeout: 10000 })
  })

  test('4. Me pill: mom self-redeems her own prize and opens Previously Redeemed history', async ({ page }) => {
    const sarah = await memberId('Sarah')
    await createPrize({ earnerId: sarah, prizeText: `${PREFIX} Sarah me-pill redeem` })
    await createPrize({ earnerId: sarah, prizeText: `${PREFIX} Sarah me-pill history`, redeemed: true })

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes' }).click()

    const mePill = page.getByTestId('prizes-me-pill')
    await expect(mePill).toBeVisible({ timeout: 15000 })
    await page.getByTestId('prizes-me-pill-toggle').click()

    // Her own prize renders inside the pill. With no kid prizes fixtured in
    // this test, the general owed section correctly shows the empty state
    // (her own reward never counts toward "owed to kids" — see test 2 for
    // the exclusion check with kid prizes actually present alongside hers).
    await expect(mePill.getByText(`${PREFIX} Sarah me-pill redeem`)).toBeVisible()
    await expect(page.getByText('No unredeemed prizes.')).toBeVisible()

    // Self-redeem via the RPC-backed PrizeBox flow.
    await mePill.getByTestId('self-redeem-button').first().click()
    await expect(page.getByText('Use your reward now?')).toBeVisible()
    await page.getByTestId('confirm-self-redeem').click()
    await expect(mePill.getByText(`${PREFIX} Sarah me-pill redeem`)).not.toBeVisible({ timeout: 10000 })

    // Previously Redeemed history (pre-seeded redeemed prize).
    await page.getByTestId('prizes-me-history-button').click()
    await expect(page.getByRole('heading', { name: 'Previously Redeemed' })).toBeVisible()
    await expect(page.getByText(`${PREFIX} Sarah me-pill history`)).toBeVisible()
  })

  test('5. Me pill: Promise Yourself a Reward self-propose form is present', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Prizes' }).click()
    await page.getByTestId('prizes-me-pill-toggle').click()

    await expect(page.getByTestId('mr-section-self-propose')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Promise Yourself a Reward')).toBeVisible()
  })

  test('6. Me pill is absent for a finance-granted dad', async ({ page }) => {
    const jordan = await memberId('Jordan')
    await grantDad(jordan, 'view')

    await loginAsDad(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)
    await expect(page.getByRole('button', { name: 'Prizes' })).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Prizes' }).click()
    await expect(page.getByTestId('prizes-me-pill')).not.toBeVisible()
  })
})
