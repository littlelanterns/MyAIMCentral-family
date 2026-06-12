/**
 * KIDS-REWARDS-PAGE Slice 1 — EYES-ON TOUR (manual helper, NOT a regression test)
 *
 * Drives the Testworth family through the 5 mom surfaces touched by Slice 1
 * so the founder can watch live (headed) and review screenshots afterward.
 * Each stop saves a screenshot to test-results/eyes-on-tour/.
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/kids-rewards-eyes-on-tour.spec.ts --headed
 *
 * Gated behind EYES_ON_TOUR so it NEVER runs as part of the normal suite.
 *
 * Fixtures: three "KRSLICE1 EYES-ON ..." prizes are created and LEFT IN PLACE
 * so the founder can poke at them live afterward. They share the KRSLICE1
 * prefix, so the next run of kids-rewards-slice1.spec.ts sweeps them
 * automatically in its beforeAll cleanup.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsRiley } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const sr = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// NOT under test-results/ or playwright-report/ — both get wiped/rewritten by
// Playwright runs, which would delete the founder's review screenshots.
// eyes-on-tour/ at the repo root is gitignored and survives everything.
const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

/** Linger so the founder can see the state when watching live. */
async function linger(page: import('@playwright/test').Page, ms = 2500) {
  await page.waitForTimeout(ms)
}

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

async function ensurePrize(opts: {
  earnerId: string
  prizeText: string
  redeemed?: boolean
  redeemedBy?: string
}) {
  const { data: existing } = await sr
    .from('earned_prizes')
    .select('id')
    .eq('family_id', familyId)
    .eq('prize_text', opts.prizeText)
    .maybeSingle()
  if (existing) return

  const { error } = await sr.from('earned_prizes').insert({
    family_id: familyId,
    family_member_id: opts.earnerId,
    source_type: 'task_completion',
    source_id: randomUUID(),
    prize_type: 'text',
    prize_text: opts.prizeText,
    prize_name: opts.prizeText,
    visibility: 'family',
    ...(opts.redeemed
      ? { redeemed_at: new Date().toISOString(), redeemed_by: opts.redeemedBy ?? opts.earnerId }
      : {}),
  })
  if (error) throw new Error(`prize fixture: ${error.message}`)
}

test.use({ launchOptions: { slowMo: 300 }, viewport: { width: 1440, height: 900 } })

test.describe('Eyes-on tour — Slice 1 mom surfaces', () => {
  // It's a watchable tour, not a perf test — slowMo + linger pauses need room.
  // One retry: the shared injectSession() helper occasionally serves a stale
  // cached token (same infrastructure flake the leak-pass suite documents).
  test.describe.configure({ timeout: 120_000, retries: 1 })

  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const jordan = await memberId('Jordan')
    const ruthie = await memberId('Ruthie')
    const sarah = await memberId('Sarah')

    // Demo prizes (left in place after the tour; swept by the slice-1 suite)
    await ensurePrize({ earnerId: jordan, prizeText: 'KRSLICE1 EYES-ON Popsicle with Dad' })
    await ensurePrize({
      earnerId: jordan,
      prizeText: 'KRSLICE1 EYES-ON Movie night (redeemed)',
      redeemed: true,
      redeemedBy: sarah,
    })
    await ensurePrize({ earnerId: ruthie, prizeText: 'KRSLICE1 EYES-ON Sticker surprise' })
  })

  // ── Stop 1: TaskCreationModal Section 7 + image picker ──────────────────────
  test('Stop 1 — Task creation: privilege reward, picker suggestions, empty state', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    // Open the creation modal (the ?new=1 param is reserved for makeup tasks)
    await page.getByRole('button', { name: 'Create', exact: true }).click()

    // Ensure Full mode (Section 7 lives there). The page's Create button opens
    // Full mode directly with a Quick|Full toggle; the Sort-tab path opens
    // Quick with a "Full mode →" link — handle both.
    const fullToggle = page.getByRole('button', { name: 'Full', exact: true })
    const fullLink = page.getByText('Full mode →')
    if (await fullLink.isVisible().catch(() => false)) {
      await fullLink.click()
    } else if (await fullToggle.isVisible().catch(() => false)) {
      await fullToggle.click()
    }

    const heading = page.getByText('Rewards & Completion Tracking')
    await heading.scrollIntoViewIfNeeded()

    // Pick "Special Privilege" on the Reward Type select
    const rewardSelect = page
      .locator('select', { has: page.locator('option[value="privilege"]') })
      .first()
    await rewardSelect.scrollIntoViewIfNeeded()
    await rewardSelect.selectOption('privilege')

    // Describe the reward
    const desc = page.getByPlaceholder('e.g., A popsicle, Late night with friends, Ice cream trip')
    await desc.fill('a popsicle')
    await shot(page, '01-task-creation-privilege-reward')
    await linger(page)

    // Picture library mode → auto-suggestions from "a popsicle"
    await page.getByRole('button', { name: 'Picture library' }).click()
    await page.waitForTimeout(3500) // tag search + embedding refine
    // Scroll the results area into the frame for the screenshot
    const firstTile = page.locator('button[title] img').first()
    const noMatchMsg = page.getByText('No matches yet — try a different word.')
    if (await firstTile.isVisible().catch(() => false)) {
      await firstTile.scrollIntoViewIfNeeded()
    } else if (await noMatchMsg.isVisible().catch(() => false)) {
      await noMatchMsg.scrollIntoViewIfNeeded()
    }
    await shot(page, '02-image-picker-suggestions-for-popsicle')
    await linger(page)

    // Weak/no-match state with a word the library won't match. Founder design
    // (2026-06-12): never a dead end — either "we don't have an image for that
    // yet" (zero results) or "here's the closest we have" (weak matches), and
    // the term is logged to asset_suggestion_misses either way.
    const search = page.getByPlaceholder(/Suggestions for|Search the picture library/)
    await search.fill('zzzblorp')
    const honestMsg = page.getByText(/We don't have (an image for that|that exact image) yet/)
    await expect(honestMsg.first()).toBeVisible({ timeout: 15000 })
    await honestMsg.first().scrollIntoViewIfNeeded()
    await shot(page, '03-image-picker-empty-state-zzzblorp')
    await linger(page)
  })

  // ── Stop 2: PrizeBoard Prizes tab — Un-redeem + edit-image ──────────────────
  test('Stop 2 — Prize Board: prize cards, Recently redeemed, Un-redeem, edit picture', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)

    await page.getByRole('button', { name: 'Prizes' }).click()
    await expect(page.getByText('KRSLICE1 EYES-ON Popsicle with Dad')).toBeVisible({
      timeout: 15000,
    })
    await shot(page, '04-prizeboard-prizes-tab')
    await linger(page)

    // Recently redeemed group with the Un-redeem button
    await page.getByText(/Recently redeemed \(\d+\)/).click()
    await expect(page.getByTestId('unredeem-button').first()).toBeVisible()
    await shot(page, '05-prizeboard-recently-redeemed-unredeem')
    await linger(page)

    // Edit-picture modal (three-mode picker on an already-earned prize)
    await page.getByLabel('Edit picture').first().click()
    await expect(page.getByText('Reward picture')).toBeVisible()
    await shot(page, '06-prizeboard-edit-image-modal')
    await linger(page)
  })

  // ── Stop 3: ContractForm (RewardRules) custom reward ────────────────────────
  test('Stop 3 — Reward Rules: custom reward with the three-mode picker', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/contracts')
    await waitForAppReady(page)

    await page.getByRole('button', { name: 'New Scenario' }).click()
    await page.getByText('Custom Reward', { exact: true }).click()

    const desc = page.getByPlaceholder('Victory description, prize text, etc.')
    await desc.scrollIntoViewIfNeeded()
    await desc.fill('an ice cream trip')

    await expect(page.getByText('Reward picture')).toBeVisible()
    await page.getByText('Reward picture').scrollIntoViewIfNeeded()
    await shot(page, '07-contract-form-custom-reward-picker')
    await linger(page)

    // Show library suggestions here too
    await page.getByRole('button', { name: 'Picture library' }).click()
    await page.waitForTimeout(3500)
    const cTile = page.locator('button[title] img').first()
    const cNoMatch = page.getByText('No matches yet — try a different word.')
    if (await cTile.isVisible().catch(() => false)) {
      await cTile.scrollIntoViewIfNeeded()
    } else if (await cNoMatch.isVisible().catch(() => false)) {
      await cNoMatch.scrollIntoViewIfNeeded()
    }
    await shot(page, '08-contract-form-library-suggestions')
    await linger(page)
  })

  // ── Stop 4: WidgetConfiguration sequential_path prize fields ────────────────
  test('Stop 4 — Widget config: sequential path tracker prize picture', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    const addWidget = page.getByRole('button', { name: 'Add Widget' })
    await addWidget.scrollIntoViewIfNeeded()
    await addWidget.click()

    // The sequential_path tracker renders as the "Step Path" registry entry
    // (the seeded starter-config categories don't match the picker's internal
    // category keys — pre-existing PRD-10 quirk, noted for the founder)
    await page.getByPlaceholder('Search widgets and trackers...').fill('step path')
    await expect(page.getByText('Step Path').first()).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(500)

    // Click the Customize button INSIDE the Step Path card (innermost div
    // containing both the card title and a Customize button)
    const stepPathCard = page
      .locator('div')
      .filter({ has: page.getByText('Step Path', { exact: true }) })
      .filter({ has: page.getByRole('button', { name: 'Customize' }) })
      .last()
    await stepPathCard.getByRole('button', { name: 'Customize' }).first().click()

    // Configuration modal → prize fields
    const prizeLabel = page.getByText('Prize at End (optional)')
    await expect(prizeLabel).toBeVisible({ timeout: 15000 })
    await prizeLabel.scrollIntoViewIfNeeded()
    await page.getByPlaceholder('e.g. Pizza party!').fill('Pizza party!')
    await expect(page.getByText('Prize picture (optional)')).toBeVisible()
    await page.getByText('Prize picture (optional)').scrollIntoViewIfNeeded()
    await shot(page, '09-widget-config-sequential-path-prize')
    await linger(page)
  })

  // ── Stop 5: Play shell rewards (Ruthie) ─────────────────────────────────────
  test('Stop 5 — Play rewards: prize card shows "Ask a grown-up to use it!"', async ({ page }) => {
    await loginAsRiley(page) // Ruthie — Play shell
    await page.goto('/rewards')
    await waitForAppReady(page)

    await expect(page.getByText('KRSLICE1 EYES-ON Sticker surprise')).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('Ask a grown-up to use it!').first()).toBeVisible()
    await shot(page, '10-play-rewards-ask-a-grownup')
    await linger(page, 4000)
  })
})
