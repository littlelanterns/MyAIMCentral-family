/**
 * ALLOWANCE-RECONCILIATION — payment ↔ period settlement pins (2026-07-07)
 *
 * Root cause pinned here: the platform tracked "what mom owes" in TWO places
 * (unpaid allowance_periods rows AND the financial_transactions ledger), but
 * only the Allowance tab's targeted "Paid" button updated both. Payments from
 * the Balance tab / FO Pay All left periods 'calculated' forever, so the
 * Allowance tab permanently overstated what was owed (found live 2026-07-07:
 * $35.41 Gideon, $23.22 Helam of already-paid periods still showing owed).
 *
 * Pins (every one drives the real flow with service-role DB assertions):
 *   1. Balance tab "Pay" (full balance) → payment recorded AND calculated
 *      periods closed oldest-first via settle_calculated_allowance_periods
 *      (migration 100288). THE original bug path.
 *   2. Allowance tab targeted "Paid" → payment recorded AND exactly that
 *      period closed (now via the same RPC inside useCreatePayment, no
 *      separate client-side close that can diverge).
 *   3. Zero-balance "Mark Settled" (the live Helam dead-end): owed periods
 *      whose money was already paid out can be settled WITHOUT recording a
 *      new payment — previously the clamp threw 'Nothing to pay' and the
 *      periods were permanently stuck.
 *   4. RLS/permission probe: a kid session cannot invoke the settlement RPC.
 *   5. calculate_running_balance === SUM(amount) ground truth (migration
 *      100288 rewrote it away from newest-row balance_after, which broke on
 *      same-timestamp ties).
 *
 * Fixtures: RECONFIX-marked, Alex only (Testworth kid with NO real allowance
 * config and NO real calculated periods — his $23.00 real balance is restored
 * exactly by sweeping the fixture rows, since balance = SUM(amount)).
 * Fixture periods use 2020 dates (unambiguous, pre-app) and are
 * status='calculated' so the hourly calculate-allowance-period cron (which
 * only reads 'active'/'makeup_window') never touches them.
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loginAsMom } from '../helpers/auth'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { waitForAppReady } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!

const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MARKER = 'RECONFIX'

let familyId = ''
let alexId = ''
let alexRealBalance = 0

/** Authenticated client for a test user (real RLS, not service role). */
async function clientFor(user: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`signIn failed for ${user.email}: ${error.message}`)
  return client
}

async function sumAlexTransactions(): Promise<number> {
  const { data, error } = await admin
    .from('financial_transactions')
    .select('amount')
    .eq('family_member_id', alexId)
  if (error) throw error
  return (data ?? []).reduce((s, r) => s + Number(r.amount), 0)
}

async function seedEarning(amount: number, label: string): Promise<void> {
  const current = await sumAlexTransactions()
  const { error } = await admin.from('financial_transactions').insert({
    family_id: familyId,
    family_member_id: alexId,
    transaction_type: 'allowance_earned',
    amount,
    balance_after: current + amount,
    description: `${MARKER} seed earning — ${label}`,
    source_type: 'allowance_period',
  })
  if (error) throw new Error(`seedEarning failed: ${error.message}`)
}

async function seedCalculatedPeriod(
  periodStart: string,
  periodEnd: string,
  totalEarned: number,
): Promise<string> {
  const { data, error } = await admin
    .from('allowance_periods')
    .insert({
      family_id: familyId,
      family_member_id: alexId,
      pool_name: 'default',
      period_start: periodStart,
      period_end: periodEnd,
      status: 'calculated',
      base_amount: 5,
      total_earned: totalEarned,
      calculated_amount: totalEarned,
      completion_percentage: totalEarned > 0 ? 60 : 0,
      effective_tasks_assigned: 5,
      effective_tasks_completed: totalEarned > 0 ? 3 : 0,
      tasks_completed: totalEarned > 0 ? 3 : 0,
      calculated_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`seedCalculatedPeriod failed: ${error?.message}`)
  return data.id
}

async function sweep(): Promise<void> {
  // Payments and earnings created by these tests carry the MARKER in their
  // description (the tests type it into the payment note). Deleting them
  // restores Alex's real balance exactly, because balance = SUM(amount).
  await admin
    .from('financial_transactions')
    .delete()
    .eq('family_member_id', alexId)
    .ilike('description', `%${MARKER}%`)
  // Fixture periods are unambiguous: 2020 dates, this kid only.
  await admin
    .from('allowance_periods')
    .delete()
    .eq('family_member_id', alexId)
    .lt('period_start', '2021-01-01')
  // Fixture allowance config (Alex has no real one).
  await admin
    .from('allowance_configs')
    .delete()
    .eq('family_member_id', alexId)
}

test.describe.configure({ mode: 'serial' })

test.describe('Allowance payment settlement (ALLOWANCE-RECONCILIATION)', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await admin
      .from('families')
      .select('id')
      .ilike('family_name', '%testworth%')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const { data: alex, error: alexErr } = await admin
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('display_name', 'Alex')
      .single()
    if (alexErr || !alex) throw new Error(`Alex not found: ${alexErr?.message}`)
    alexId = alex.id

    await sweep()
    alexRealBalance = await sumAlexTransactions()

    // Alex needs an enabled allowance config for his Allowance-tab card to
    // render (fixture — swept in afterAll; verified he has no real config).
    const { error: cfgErr } = await admin.from('allowance_configs').insert({
      family_id: familyId,
      family_member_id: alexId,
      pool_name: 'default',
      enabled: true,
      weekly_amount: 5,
    })
    if (cfgErr) throw new Error(`fixture config insert failed: ${cfgErr.message}`)
  })

  test.afterAll(async () => {
    await sweep()
    // Residue check: Alex's balance must be exactly what it was before the run.
    const finalBalance = await sumAlexTransactions()
    if (Math.abs(finalBalance - alexRealBalance) > 0.005) {
      throw new Error(
        `Fixture residue: Alex balance ${finalBalance} != pre-test ${alexRealBalance}`,
      )
    }
  })

  test('1. Balance tab payment settles calculated periods (original bug path)', async ({ page }) => {
    const p1 = await seedCalculatedPeriod('2020-01-05', '2020-01-11', 3.0)
    const p2 = await seedCalculatedPeriod('2020-01-12', '2020-01-18', 2.0)
    await seedEarning(3.0, 'P1')
    await seedEarning(2.0, 'P2')

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)

    // Balance tab → per-kid → Alex
    await page.getByRole('button', { name: 'Balance', exact: true }).click()
    await page.getByRole('button', { name: 'Alex', exact: true }).click()

    // Header shows real balance + fixture earnings
    const expectedBalance = (alexRealBalance + 5).toFixed(2)
    await expect(page.getByText(`$${expectedBalance}`).first()).toBeVisible({ timeout: 10000 })

    // Pay full balance, marking the note so the sweep can find it
    await page.getByRole('button', { name: 'Pay', exact: true }).click()
    await page.getByPlaceholder('Cash — from birthday shopping trip').fill(MARKER)
    await page.getByRole('button', { name: 'Confirm Payment' }).click()

    // DB: payment recorded for the full balance…
    await expect
      .poll(async () => {
        const { data } = await admin
          .from('financial_transactions')
          .select('amount')
          .eq('family_member_id', alexId)
          .eq('transaction_type', 'payment_made')
          .ilike('description', `%${MARKER}%`)
        return (data ?? []).length
      }, { timeout: 15000 })
      .toBe(1)

    // …AND both calculated periods closed (this is what never happened before)
    const { data: periods } = await admin
      .from('allowance_periods')
      .select('id, status')
      .in('id', [p1, p2])
    expect(periods).toHaveLength(2)
    for (const p of periods!) {
      expect(p.status).toBe('closed')
    }
  })

  test('2. Allowance tab targeted Paid records payment and closes exactly that period', async ({ page }) => {
    const p3 = await seedCalculatedPeriod('2020-02-02', '2020-02-08', 4.0)
    await seedEarning(4.0, 'P3')

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)

    // Open the Allowance tab explicitly (don't rely on the default landing tab)
    await page.getByRole('button', { name: 'Allowance', exact: true }).click()
    await expect(page.getByText('$4.00 owed')).toBeVisible({ timeout: 10000 })

    // The group row for the fixture period (Feb 2 – Feb 8 2020). Scoped to
    // the PeriodGroupRow root (div.rounded-lg) so page-level wrapper divs —
    // which also "contain" the text — can't match and click another kid's
    // Paid button.
    const groupRow = page
      .locator('div.rounded-lg')
      .filter({ hasText: /Feb 2 – Feb 8/ })
      .getByRole('button', { name: 'Paid', exact: true })
    await groupRow.first().click()

    // PaymentModal: keep the suggested amount, mark the note for sweeping
    const noteInput = page.getByPlaceholder('Cash — from birthday shopping trip')
    await noteInput.fill(MARKER)
    await page.getByRole('button', { name: 'Confirm Payment' }).click()

    await expect
      .poll(async () => {
        const { data } = await admin
          .from('allowance_periods')
          .select('status')
          .eq('id', p3)
          .single()
        return data?.status
      }, { timeout: 15000 })
      .toBe('closed')

    // Payment of exactly $4 recorded
    const { data: payments } = await admin
      .from('financial_transactions')
      .select('amount')
      .eq('family_member_id', alexId)
      .eq('transaction_type', 'payment_made')
      .ilike('description', `%${MARKER}%`)
      .order('created_at', { ascending: false })
    expect(Number(payments![0].amount)).toBeCloseTo(-4.0, 2)
  })

  test('3. Zero-balance owed period can be marked settled without a new payment (Helam dead-end)', async ({ page }) => {
    // Period says $6 owed but NO matching ledger credit — the exact live
    // state Helam was stuck in (money already paid out via the Balance tab
    // before the fix existed). Old behavior: 'Nothing to pay' throw, period
    // stuck 'calculated' forever.
    const p4 = await seedCalculatedPeriod('2020-03-01', '2020-03-07', 6.0)

    const { count: paymentsBefore } = await admin
      .from('financial_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('family_member_id', alexId)
      .eq('transaction_type', 'payment_made')

    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)

    await page.getByRole('button', { name: 'Allowance', exact: true }).click()
    await expect(page.getByText('$6.00 owed')).toBeVisible({ timeout: 10000 })
    const groupRow = page
      .locator('div.rounded-lg')
      .filter({ hasText: /Mar 1 – Mar 7/ })
      .getByRole('button', { name: 'Paid', exact: true })
    await groupRow.first().click()

    // Clamp honesty: the modal says nothing more will be paid, and the
    // confirm button reads Mark Settled.
    await expect(page.getByText(/balance is already \$0\.00/i)).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Mark Settled' }).click()

    await expect
      .poll(async () => {
        const { data } = await admin
          .from('allowance_periods')
          .select('status')
          .eq('id', p4)
          .single()
        return data?.status
      }, { timeout: 15000 })
      .toBe('closed')

    // NO new payment row was recorded
    const { count: paymentsAfter } = await admin
      .from('financial_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('family_member_id', alexId)
      .eq('transaction_type', 'payment_made')
    expect(paymentsAfter).toBe(paymentsBefore)
  })

  test('4. Kid session cannot invoke the settlement RPC', async () => {
    const alexClient = await clientFor(TEST_USERS.alex)
    try {
      const { error } = await alexClient.rpc('settle_calculated_allowance_periods', {
        p_member_id: alexId,
        p_allocate_amount: 100,
      })
      expect(error).not.toBeNull()
      expect(error!.message).toMatch(/not authorized/i)
    } finally {
      await alexClient.auth.signOut()
    }
  })

  test('5. calculate_running_balance equals SUM(amount) ground truth', async () => {
    const momClient = await clientFor(TEST_USERS.sarah)
    try {
      const { data: rpcBalance, error } = await momClient.rpc('calculate_running_balance', {
        p_member_id: alexId,
      })
      expect(error).toBeNull()
      const trueSum = await sumAlexTransactions()
      expect(Number(rpcBalance)).toBeCloseTo(trueSum, 2)
    } finally {
      await momClient.auth.signOut()
    }
  })
})
