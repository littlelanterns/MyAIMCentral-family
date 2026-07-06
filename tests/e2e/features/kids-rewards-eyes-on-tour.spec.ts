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
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsRiley, loginAsCasey, loginAsDad } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { todayLocalIso } from '../helpers/dates'
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

// Slice 3 reference fixtures (looked up in beforeAll)
let s3 = {
  themeId: '',
  pageA: '',
  pageB: '',
  creatures: [] as string[],
  coloring: [] as string[],
}

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

/** Merge-write My Rewards preference keys (Slice 2 stops). The next
 *  kids-rewards-slice2.spec.ts run resets these to the clean baseline. */
async function setTourPrefs(mid: string, updates: Record<string, unknown>) {
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

/** Idempotently seed a member's sticker book so the Slice 3 creature frame has
 *  content for the founder to poke (2 backgrounds, 1 placed + 1 unplaced). */
async function seedSlice3Creatures(mid: string) {
  // Sticker state enabled + theme/active page
  const { data: st } = await sr
    .from('member_sticker_book_state')
    .select('id')
    .eq('family_member_id', mid)
    .maybeSingle()
  if (st) {
    await sr
      .from('member_sticker_book_state')
      .update({ is_enabled: true, active_theme_id: s3.themeId, active_page_id: s3.pageA })
      .eq('family_member_id', mid)
  } else {
    await sr.from('member_sticker_book_state').insert({
      family_id: familyId,
      family_member_id: mid,
      active_theme_id: s3.themeId,
      active_page_id: s3.pageA,
      is_enabled: true,
    })
  }
  for (const pageId of [s3.pageA, s3.pageB]) {
    const { data: u } = await sr
      .from('member_page_unlocks')
      .select('id')
      .eq('family_member_id', mid)
      .eq('sticker_page_id', pageId)
      .maybeSingle()
    if (!u) {
      await sr.from('member_page_unlocks').insert({
        family_id: familyId,
        family_member_id: mid,
        sticker_page_id: pageId,
        unlocked_trigger_type: 'manual_unlock',
        creatures_at_unlock: 0,
      })
    }
  }
  const { count } = await sr
    .from('member_creature_collection')
    .select('id', { count: 'exact', head: true })
    .eq('family_member_id', mid)
  if ((count ?? 0) === 0) {
    await sr.from('member_creature_collection').insert([
      {
        family_id: familyId,
        family_member_id: mid,
        creature_id: s3.creatures[0],
        sticker_page_id: s3.pageA,
        position_x: 0.3,
        position_y: 0.35,
        awarded_source_type: 'task_completion',
        awarded_source_id: randomUUID(),
      },
      {
        family_id: familyId,
        family_member_id: mid,
        creature_id: s3.creatures[1],
        sticker_page_id: null,
        position_x: null,
        position_y: null,
        awarded_source_type: 'task_completion',
        awarded_source_id: randomUUID(),
      },
    ])
  }
}

/** Idempotently seed coloring reveals (1 active + 1 finished). */
async function seedSlice3Coloring(mid: string) {
  const { count } = await sr
    .from('member_coloring_reveals')
    .select('id', { count: 'exact', head: true })
    .eq('family_member_id', mid)
  if ((count ?? 0) > 0) return
  await sr.from('member_coloring_reveals').insert([
    {
      family_id: familyId,
      family_member_id: mid,
      coloring_image_id: s3.coloring[0],
      reveal_step_count: 10,
      current_step: 4,
      revealed_zone_ids: [],
      lineart_preference: 'medium',
      is_complete: false,
      is_active: true,
    },
    {
      family_id: familyId,
      family_member_id: mid,
      coloring_image_id: s3.coloring[1],
      reveal_step_count: 10,
      current_step: 10,
      revealed_zone_ids: [],
      lineart_preference: 'medium',
      is_complete: true,
      is_active: true,
    },
  ])
}

/** Ensure the member's dashboard has a sticker + coloring door widget. */
async function seedSlice3Doors(mid: string) {
  for (const type of ['info_sticker_page', 'info_coloring_page'] as const) {
    const { data: existing } = await sr
      .from('dashboard_widgets')
      .select('id')
      .eq('family_member_id', mid)
      .eq('template_type', type)
      .eq('is_on_dashboard', true)
      .is('archived_at', null)
      .maybeSingle()
    if (existing) continue
    await sr.from('dashboard_widgets').insert({
      family_id: familyId,
      family_member_id: mid,
      template_type: type,
      title: type === 'info_sticker_page' ? 'My Sticker Page' : 'My Coloring Page',
      size: 'medium',
      is_active: true,
      is_on_dashboard: true,
    })
  }
}

/** Victory + linked celebration narrative fixture (idempotent by description). */
async function ensureVictory(mid: string, description: string, narrative: string) {
  const { data: existing } = await sr
    .from('victories')
    .select('id')
    .eq('family_id', familyId)
    .eq('description', description)
    .maybeSingle()
  if (existing) return

  const { data: victory, error } = await sr
    .from('victories')
    .insert({
      family_id: familyId,
      family_member_id: mid,
      description,
      source: 'manual',
      member_type: 'teen',
      importance: 'big_win',
    })
    .select('id')
    .single()
  if (error) throw new Error(`victory fixture: ${error.message}`)

  const { error: cErr } = await sr.from('victory_celebrations').insert({
    family_id: familyId,
    family_member_id: mid,
    celebration_date: todayLocalIso(),
    mode: 'individual',
    narrative,
    victory_ids: [victory.id],
    victory_count: 1,
  })
  if (cErr) throw new Error(`celebration fixture: ${cErr.message}`)
}

/** Slice 4 proposal fixture — pending reward_proposals row via service role
 *  (mirrors useRewardProposals.ts insertProposal shape, KRSLICE4-prefixed so
 *  the next kids-rewards-slice4.spec.ts run sweeps it automatically). */
async function insertTourProposal(opts: {
  proposerId: string
  wantText: string
  willText: string
  earnStructure: 'once' | 'streak_n_days' | 'finish_list'
  params?: { days?: number; items?: string[] }
}): Promise<string> {
  const { data, error } = await sr
    .from('reward_proposals')
    .insert({
      family_id: familyId,
      proposer_member_id: opts.proposerId,
      is_self_proposal: false,
      status: 'pending',
      terms: {
        want_text: opts.wantText,
        want_image_url: null,
        want_image_asset_key: null,
        will_text: opts.willText,
        earn_structure: opts.earnStructure,
        params: opts.params ?? {},
      },
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`tour proposal fixture: ${error?.message}`)
  return data.id
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

    // Slice 3 reference fixtures
    const { data: theme } = await sr
      .from('gamification_themes')
      .select('id')
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .single()
    s3.themeId = theme!.id
    const { data: pages } = await sr
      .from('gamification_sticker_pages')
      .select('id')
      .eq('theme_id', s3.themeId)
      .order('sort_order')
      .limit(2)
    s3.pageA = pages![0].id
    s3.pageB = pages![1].id
    const { data: creatures } = await sr
      .from('gamification_creatures')
      .select('id')
      .eq('theme_id', s3.themeId)
      .order('sort_order')
      .limit(2)
    s3.creatures = (creatures ?? []).map(c => c.id)
    const { data: coloring } = await sr
      .from('coloring_reveal_library')
      .select('id')
      .eq('is_active', true)
      .order('sort_order')
      .limit(2)
    s3.coloring = (coloring ?? []).map(c => c.id)
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

  // ═══════════════ SLICE 2 STOPS (2026-06-12) ═══════════════
  // Fixtures below use the KRSLICE2 prefix — swept automatically by the next
  // run of kids-rewards-slice2.spec.ts (its beforeAll cleanup also resets the
  // member preferences the tour sets here).

  // ── Stop 6: Gamification Settings → My Rewards Page section ─────────────────
  test('Stop 6 — Settings: My Rewards Page section (page toggle + section opt-ins)', async ({ page }) => {
    const jordan = await memberId('Jordan')
    // Page on for Jordan so the section toggles are visible for review
    await setTourPrefs(jordan, {
      show_my_rewards: true,
      my_rewards_sections: { custom_rewards: true, victories: true },
    })

    await loginAsMom(page)
    await page.goto('/family-members')
    await waitForAppReady(page)

    const jordanCard = page
      .locator('.card-hover')
      .filter({ has: page.getByText('Jordan', { exact: true }) })
    await jordanCard.getByTitle('Edit').click()
    await jordanCard.getByRole('button', { name: 'Gamification Settings' }).click()
    await page.getByRole('button', { name: 'My Rewards Page' }).click()
    await expect(page.getByTestId('my-rewards-settings-section')).toBeVisible()
    await shot(page, '11-settings-my-rewards-section-jordan')
    await linger(page, 4000)
    await page.keyboard.press('Escape')

    // Play member shape — no page toggle, no Money owed control
    const ruthieCard = page
      .locator('.card-hover')
      .filter({ has: page.getByText('Ruthie', { exact: true }) })
    await ruthieCard.getByTitle('Edit').click()
    await ruthieCard.getByRole('button', { name: 'Gamification Settings' }).click()
    await page.getByRole('button', { name: 'My Rewards Page' }).click()
    await expect(page.getByText(/rewards live on their Fun tab/)).toBeVisible()
    await shot(page, '12-settings-my-rewards-section-ruthie-play')
    await linger(page, 3000)
  })

  // ── Stop 7: Casey's /my-rewards — all four Slice 2 sections live ────────────
  test('Stop 7 — Independent kid page: points, prizes + history, victories, money owed', async ({ page }) => {
    const casey = await memberId('Casey')
    await setTourPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { custom_rewards: true, victories: true, finances: true },
    })
    await ensurePrize({ earnerId: casey, prizeText: 'KRSLICE2 EYES-ON Ice cream with Mom' })
    await ensurePrize({
      earnerId: casey,
      prizeText: 'KRSLICE2 EYES-ON Late night with friends (redeemed)',
      redeemed: true,
    })
    await ensureVictory(
      casey,
      'KRSLICE2 EYES-ON Finished the science fair project',
      'KRSLICE2 EYES-ON What a finish — weeks of sticking with it paid off. That project sparkled!',
    )

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    await expect(page.getByTestId('my-rewards-sections')).toBeVisible({ timeout: 15000 })
    await shot(page, '13-casey-my-rewards-page')
    await linger(page, 4000)

    // Previously Redeemed click-in history with provenance
    await page.getByTestId('mr-history-button').click()
    await expect(page.getByTestId('redeemed-history')).toBeVisible()
    await shot(page, '14-casey-previously-redeemed-history')
    await linger(page, 3500)
    await page.keyboard.press('Escape')

    // Victory → celebration detail
    await page
      .getByTestId('mr-section-victories')
      .getByText('KRSLICE2 EYES-ON Finished the science fair project')
      .click()
    await expect(page.getByTestId('celebration-detail')).toBeVisible()
    await shot(page, '15-casey-celebration-detail')
    await linger(page, 3500)
    await page.keyboard.press('Escape')

    // Money owed tap-through to the ledger
    await page.getByTestId('mr-finances-details').click()
    await shot(page, '16-casey-money-owed-ledger')
    await linger(page, 3500)
  })

  // ── Stop 8: View As Jordan → More → My Rewards (guided experience) ──────────
  test('Stop 8 — View As Jordan: kid page in the modal, no self-redeem offered', async ({ page }) => {
    const jordan = await memberId('Jordan')
    await setTourPrefs(jordan, {
      show_my_rewards: true,
      my_rewards_sections: { custom_rewards: true },
    })
    await ensurePrize({ earnerId: jordan, prizeText: 'KRSLICE2 EYES-ON Popsicle picnic' })

    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Jordan' }).first().click()
    await expect(page.locator('[data-testid="view-as-exit"]')).toBeVisible({ timeout: 15000 })

    // Dismiss the kid's auto-opened rhythm modal if it appears
    await page.waitForTimeout(3000)
    while ((await page.locator('[role="dialog"]').count()) > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    }

    await page.getByRole('button', { name: 'More' }).click()
    await shot(page, '17-viewas-jordan-more-menu')
    await page.getByText('My Rewards', { exact: true }).first().click()
    await expect(page.getByTestId('mr-section-custom')).toBeVisible({ timeout: 15000 })
    await shot(page, '18-viewas-jordan-my-rewards')
    await linger(page, 4000)

    // End the session row (modal exit affordance can auto-close — DB cleanup)
    await sr
      .from('view_as_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('viewing_as_id', jordan)
      .is('ended_at', null)
  })

  // ═══════════════ SLICE 3 STOPS (2026-06-13) ═══════════════
  // Creature pages + Coloring gallery + Dashboard doors. Fixtures are seeded
  // idempotently and LEFT IN PLACE for the founder to poke; the next run of
  // kids-rewards-slice3.spec.ts sweeps Casey's creature/coloring rows.

  // ── Stop 9: Casey /my-rewards — creature frame + coloring gallery ──────────
  test('Stop 9 — Independent kid page: creature swipe frame + coloring gallery', async ({ page }) => {
    const casey = await memberId('Casey')
    await setTourPrefs(casey, {
      show_my_rewards: true,
      my_rewards_sections: { creatures: true, coloring: true, points: false, custom_rewards: false },
    })
    await seedSlice3Creatures(casey)
    await seedSlice3Coloring(casey)

    await loginAsCasey(page)
    await page.goto('/my-rewards')
    await waitForAppReady(page)

    const frame = page.getByTestId('creature-page-frame')
    await expect(frame).toBeVisible({ timeout: 15000 })
    await frame.scrollIntoViewIfNeeded()
    await shot(page, '19-casey-creature-frame')
    await linger(page, 4000)

    // The coloring card gallery below
    const coloring = page.getByTestId('mr-section-coloring')
    await coloring.scrollIntoViewIfNeeded()
    await expect(coloring).toBeVisible()
    await shot(page, '20-casey-coloring-gallery')
    await linger(page, 3500)

    // Open a finished coloring card → print + download actions
    await page.getByTestId('coloring-completed-grid').getByTestId('coloring-card').first().click()
    await expect(page.getByTestId('coloring-download-lineart')).toBeVisible({ timeout: 10000 })
    await shot(page, '21-casey-coloring-modal-downloads')
    await linger(page, 3500)
  })

  // ── Stop 10: Play /rewards — small-finger creature page ───────────────────
  test('Stop 10 — Play rewards: creature swipe frame (small-finger eyes-on)', async ({ page }) => {
    const ruthie = await memberId('Ruthie')
    await setTourPrefs(ruthie, {
      my_rewards_sections: { creatures: true, points: false, custom_rewards: false, victories: false },
    })
    await seedSlice3Creatures(ruthie)

    await loginAsRiley(page) // Ruthie — Play shell
    await page.goto('/rewards')
    await waitForAppReady(page)

    await expect(page.getByTestId('creature-page-frame')).toBeVisible({ timeout: 15000 })
    await shot(page, '22-play-creature-frame')
    await linger(page, 5000)
  })

  // ── Stop 11: Casey /dashboard — sticker + coloring door widgets ───────────
  test('Stop 11 — Dashboard doors: sticker + coloring viewports open their modals', async ({ page }) => {
    const casey = await memberId('Casey')
    await seedSlice3Creatures(casey)
    await seedSlice3Coloring(casey)
    await seedSlice3Doors(casey)

    await loginAsCasey(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    while ((await page.locator('[role="dialog"]').count()) > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }

    // Scroll the widget grid into view (lazy render)
    for (let i = 0; i < 10; i++) {
      if (await page.getByRole('button', { name: 'Open my sticker book' }).count()) break
      await page.mouse.move(640, 400)
      await page.mouse.wheel(0, 900)
      await page.waitForTimeout(350)
    }
    await shot(page, '23-casey-dashboard-doors')
    await linger(page, 3500)

    const door = page.getByRole('button', { name: 'Open my sticker book' })
    await door.scrollIntoViewIfNeeded()
    await door.click()
    await expect(page.getByTestId('creature-page-modal')).toBeVisible({ timeout: 10000 })
    await shot(page, '24-casey-door-opens-creature-page')
    await linger(page, 3500)
  })
})

// ═══════════════ SLICE 4 STOPS (Convention #277 — Claude-driven Mom-UI verification) ═══════════════
// Propose-a-Reward + self-propose + the cross-member notification it fires.
// Fixtures use the KRSLICE4 prefix, swept automatically by the next run of
// kids-rewards-slice4.spec.ts (proposals via terms->>want_text ILIKE, tasks via
// title ILIKE, notifications via notification_type LIKE 'reward_proposal%',
// preferences stripped for Casey/Mark). No afterAll needed here — same
// leave-in-place-for-founder-poking convention as Stops 1-11.
//
// Run once per viewport (Desktop/Tablet/Mobile per Convention #277) so the
// SAME four surfaces get judged at all three breakpoints, matching the
// Mom-UI Verification table's column structure.

async function stop12CaseyProposeADeal(page: Page, suffix: string) {
  const casey = await memberId('Casey')
  await setTourPrefs(casey, { my_rewards_sections: { propose: true } })

  await loginAsCasey(page)
  await page.goto('/my-rewards')
  await waitForAppReady(page)

  const section = page.getByTestId('mr-section-propose')
  await expect(section).toBeVisible({ timeout: 15000 })
  await section.scrollIntoViewIfNeeded()

  await section.getByTestId('proposal-open-form').click()
  await section.getByTestId('proposal-want-input').fill('KRSLICE4 EYES-ON pizza night')
  await section
    .getByTestId('proposal-will-input')
    .fill('KRSLICE4 EYES-ON clean my room every day this week')
  await shot(page, `25-${suffix}-casey-propose-a-deal-form`)
  await linger(page)

  await section.getByTestId('proposal-submit').click()
  // .first() — this is a REAL UI submit, so re-running the tour genuinely
  // creates another pending row each time (unlike the idempotent service-role
  // fixtures elsewhere in this file); defensive against >1 match rather than
  // trying to prevent the accumulation.
  await expect(section.getByTestId('proposal-row-pending').first()).toBeVisible({ timeout: 15000 })
  await shot(page, `26-${suffix}-casey-propose-a-deal-pending`)
  await linger(page)
}

async function stop13MomQueueCounterRound(page: Page, suffix: string) {
  const casey = await memberId('Casey')
  const wantText = 'KRSLICE4 EYES-ON movie night'

  // Idempotent — same reasoning as stop15's notification fixture: this is a
  // fixed demo scenario for the Queue card, not a "propose again" action, so
  // re-running the tour should reuse the existing pending proposal rather
  // than piling up duplicates that break the strict-mode card locator below.
  const { data: existingProposal } = await sr
    .from('reward_proposals')
    .select('id')
    .eq('family_id', familyId)
    .eq('proposer_member_id', casey)
    .eq('status', 'pending')
    .eq('terms->>want_text', wantText)
    .maybeSingle()

  if (!existingProposal) {
    await insertTourProposal({
      proposerId: casey,
      wantText,
      willText: 'KRSLICE4 EYES-ON practice piano',
      earnStructure: 'streak_n_days',
      params: { days: 5 },
    })
  }

  await loginAsMom(page)
  await page.goto('/tasks')
  await waitForAppReady(page)
  await page.getByRole('button', { name: /Review Queue:/ }).click()
  await page.getByRole('tab', { name: 'Requests' }).click()

  const card = page.getByTestId('proposal-card').filter({ hasText: wantText }).first()
  await expect(card).toBeVisible({ timeout: 15000 })
  await card.scrollIntoViewIfNeeded()
  await shot(page, `27-${suffix}-mom-queue-proposal-card`)
  await linger(page)

  await card.getByTestId('proposal-counter').click()
  const counterForm = page.getByTestId('proposal-terms-form')
  await expect(counterForm).toBeVisible({ timeout: 15000 })
  await page.getByTestId('proposal-days-input').fill('7')
  await page.getByTestId('proposal-counter-note').fill('KRSLICE4 EYES-ON Make it a full week?')
  await shot(page, `28-${suffix}-mom-queue-counter-form`)
  await linger(page)
}

async function stop14DadSelfPropose(page: Page, suffix: string) {
  const mark = await memberId('Mark')
  await setTourPrefs(mark, { my_rewards_sections: { propose: true } })

  await loginAsDad(page)
  await page.goto('/my-rewards')
  await waitForAppReady(page)

  const section = page.getByTestId('mr-section-self-propose')
  await expect(section).toBeVisible({ timeout: 15000 })
  await section.scrollIntoViewIfNeeded()
  await section.getByTestId('self-propose-toggle').click()

  await section.getByTestId('proposal-want-input').fill('KRSLICE4 EYES-ON quiet coffee morning')
  await section.getByTestId('proposal-will-input').fill('KRSLICE4 EYES-ON organize the garage shelf')
  await shot(page, `29-${suffix}-dad-self-propose-form`)
  await linger(page)

  await section.getByTestId('self-propose-setup').click()
  const titleInput = page.getByPlaceholder('What needs to be done?').first()
  await expect(titleInput).toBeVisible({ timeout: 15000 })
  await shot(page, `30-${suffix}-dad-self-propose-prefilled-task`)
  await linger(page)

  await page.getByRole('button', { name: 'Create Task', exact: true }).click()
  // .first() — same reasoning as stop12's Casey pitch: this text is hardcoded
  // (not viewport-suffixed), so each viewport's run of this stop legitimately
  // adds another matching "My promises" entry across the same tour session
  // (there's no per-viewport cleanup between Desktop/Tablet/Mobile). By the
  // time Mobile runs third, the list has 3 identical entries — defensive
  // against >1 match rather than trying to prevent the accumulation.
  await expect(
    page.getByTestId('self-propose-list').getByText('KRSLICE4 EYES-ON quiet coffee morning').first(),
  ).toBeVisible({ timeout: 15000 })
  // The list assertion above can pass while the "New task" modal is still
  // mid-close (its content stays in the DOM/visible-to-Playwright during the
  // closing transition) — wait for it to fully leave before shooting, so the
  // screenshot actually shows the settled page instead of the closing modal.
  await expect(page.getByRole('heading', { name: 'New task' })).toBeHidden({ timeout: 10000 })
  await shot(page, `31-${suffix}-dad-self-propose-list`)
  await linger(page)
}

async function stop15NotificationBell(page: Page, suffix: string) {
  const sarah = await memberId('Sarah')
  const casey = await memberId('Casey')
  const title = 'Casey proposed a deal'

  // Delete-then-recreate rather than skip-if-exists: useNotifications.ts
  // orders the tray `created_at DESC .limit(20)`, so a stale skip-if-exists
  // fixture ages out of the top-20 window as OTHER test suites' real
  // notifications accumulate for Sarah across a long session. Deleting first
  // guarantees a fresh, visible-in-the-tray row on every tour run.
  await sr
    .from('notifications')
    .delete()
    .eq('family_id', familyId)
    .eq('recipient_member_id', sarah)
    .eq('title', title)

  // Seed the EXACT notification shape useRewardProposals.ts writes on a
  // real kid pitch (mirrors the real create-notification call).
  const proposalId = await insertTourProposal({
    proposerId: casey,
    wantText: 'KRSLICE4 EYES-ON ice cream trip',
    willText: 'KRSLICE4 EYES-ON walk the dog every day',
    earnStructure: 'once',
  })
  await sr.from('notifications').insert({
    family_id: familyId,
    recipient_member_id: sarah,
    notification_type: 'reward_proposal_received',
    category: 'requests',
    title,
    body: '"KRSLICE4 EYES-ON ice cream trip" if: KRSLICE4 EYES-ON walk the dog every day',
    source_type: 'reward_proposal',
    source_reference_id: proposalId,
    action_url: '/queue?tab=requests',
    is_read: false,
  })

  await loginAsMom(page)
  await page.goto('/dashboard')
  await waitForAppReady(page)

  const bell = page.getByRole('button', { name: /Notifications/ })
  await expect(bell).toBeVisible({ timeout: 15000 })
  await shot(page, `32-${suffix}-mom-notification-bell-glow`)
  await linger(page)

  // force:true — BreathingGlow's pulse animation around the bell never
  // satisfies Playwright's element-stability check (it's always "moving"
  // by design), so the default actionability wait times out. The element is
  // definitely visible/enabled; only the animation trips the heuristic.
  await bell.click({ force: true })
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 15000 })
  await shot(page, `33-${suffix}-mom-notification-tray-proposal`)
  await linger(page)
}

const VIEWPORTS = [
  { label: 'Desktop', width: 1440, height: 900 },
  { label: 'Tablet', width: 768, height: 1024 },
  { label: 'Mobile', width: 390, height: 844 },
] as const

for (const vp of VIEWPORTS) {
  test.describe(`Eyes-on tour — Slice 4 (Propose-a-Reward) — ${vp.label}`, () => {
    test.describe.configure({ timeout: 120_000, retries: 1 })
    test.use({ viewport: { width: vp.width, height: vp.height } })
    const suffix = vp.label.toLowerCase()

    // This describe block is a SEPARATE top-level block from "Eyes-on tour —
    // Slice 1 mom surfaces" above, so it does NOT inherit that block's
    // beforeAll (which sets the module-level `familyId`). Re-resolve it here
    // — memberId() below still shares the same module-level memberIds cache.
    test.beforeAll(async () => {
      if (familyId) return
      const { data: family, error } = await sr
        .from('families')
        .select('id')
        .eq('family_login_name_lower', 'testworthfamily')
        .single()
      if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
      familyId = family.id
    })

    test(`Stop 12 [${vp.label}] — Casey proposes a deal: guided form → pending pitch`, async ({ page }) => {
      await stop12CaseyProposeADeal(page, suffix)
    })

    test(`Stop 13 [${vp.label}] — Mom Queue: proposal pitch card + counter round`, async ({ page }) => {
      await stop13MomQueueCounterRound(page, suffix)
    })

    test(`Stop 14 [${vp.label}] — Dad self-propose: private-by-default reward promise`, async ({ page }) => {
      await stop14DadSelfPropose(page, suffix)
    })

    test(`Stop 15 [${vp.label}] — Notification bell: mom receives Casey's proposal`, async ({ page }) => {
      await stop15NotificationBell(page, suffix)
    })
  })
}

// ── Stop 16: Slice 5 — Prize Board arrangement + summary strip + Me pill ────

async function stop16PrizeBoardSlice5(page: Page, suffix: string) {
  const jordan = await memberId('Jordan')
  const casey = await memberId('Casey')
  const sarah = await memberId('Sarah')

  await ensurePrize({ earnerId: jordan, prizeText: 'KRS5 EYES-ON Jordan bowling night' })
  await ensurePrize({ earnerId: casey, prizeText: 'KRS5 EYES-ON Casey bake cookies together' })
  await ensurePrize({ earnerId: sarah, prizeText: 'KRS5 EYES-ON Sarah quiet coffee morning' })

  await loginAsMom(page)
  await page.goto('/prize-board')
  await waitForAppReady(page)
  await page.getByRole('button', { name: 'Prizes' }).click()

  await expect(page.getByTestId('prizes-summary-strip')).toBeVisible({ timeout: 15000 })
  await expect(page.getByTestId('prizes-by-kid-list')).toContainText('KRS5 EYES-ON Jordan bowling night')
  await shot(page, `34-${suffix}-prizeboard-summary-strip-by-kid`)
  await linger(page)

  await page.getByTestId('prizes-arrangement-by_date').click()
  await expect(page.getByTestId('prizes-by-date-list')).toBeVisible()
  await shot(page, `35-${suffix}-prizeboard-by-date-arrangement`)
  await linger(page)

  await page.getByTestId('prizes-me-pill-toggle').click()
  await expect(page.getByText('KRS5 EYES-ON Sarah quiet coffee morning')).toBeVisible()
  await shot(page, `36-${suffix}-prizeboard-me-pill-expanded`)
  await linger(page)
}

for (const vp of VIEWPORTS) {
  test.describe(`Eyes-on tour — Slice 5 (Prize Board arrangement + Me pill) — ${vp.label}`, () => {
    test.describe.configure({ timeout: 120_000, retries: 1 })
    test.use({ viewport: { width: vp.width, height: vp.height } })
    const suffix = vp.label.toLowerCase()

    test.beforeAll(async () => {
      if (familyId) return
      const { data: family, error } = await sr
        .from('families')
        .select('id')
        .eq('family_login_name_lower', 'testworthfamily')
        .single()
      if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
      familyId = family.id
    })

    test(`Stop 16 [${vp.label}] — Prize Board: summary strip, By kid/By date, Me pill`, async ({ page }) => {
      await stop16PrizeBoardSlice5(page, suffix)
    })
  })
}
