/**
 * FAMILY-GOALS-PRIZES — EYES-ON TOUR (manual helper, NOT a regression test)
 *
 * Convention #277: Claude drives this tour via Playwright, reads every
 * screenshot, and fills the Mom-UI Verification table in
 * .claude/rules/current-builds/FAMILY-GOALS-PRIZES.md. Gated behind
 * EYES_ON_TOUR so it never runs as part of the normal suite.
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/family-goals-prizes-eyes-on-tour.spec.ts --headed
 *
 * Surfaces toured (desktop ~1440px / tablet ~768px / mobile ~390px):
 *   1. FamilyGoalManager (create/edit/archive) — mom
 *   2. Prize Board Family group + Family Goals strip — mom
 *   3. Hub 'family_goals' section (progress + celebration banner) — mom
 *   4. Hub Settings management door — mom
 *   5. My Rewards Family section — participant kid (Alex) + non-participant (Jordan)
 *
 * Fixtures: "FAMGOAL Eyes-On ..." prefixed, LEFT IN PLACE for review (matches
 * the kids-rewards-eyes-on-tour.spec.ts precedent) — swept automatically by
 * the next run of family-goals-prizes.spec.ts's beforeAll (same FAMGOAL prefix).
 */
import { test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsAlex, loginAsJordan } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const sr = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function linger(page: Page, ms = 800) {
  await page.waitForTimeout(ms)
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
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

test.describe('FAMILY-GOALS-PRIZES eyes-on tour', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const alex = await memberId('Alex')
    const casey = await memberId('Casey')
    const mom = await memberId('Sarah')

    // Fixture A: in-progress Mode A goal (visible on Manager/Hub/PrizeBoard strip).
    const { data: existingA } = await sr
      .from('family_goals')
      .select('id')
      .eq('title', 'FAMGOAL Eyes-On Movie Night')
      .maybeSingle()
    let goalAId = existingA?.id
    if (!goalAId) {
      const { data: intentionA } = await sr
        .from('family_best_intentions')
        .insert({
          family_id: familyId,
          created_by_member_id: mom,
          title: 'FAMGOAL Eyes-On Remain Calm',
          participating_member_ids: [alex, casey],
        })
        .select()
        .single()
      const { data: goalA } = await sr
        .from('family_goals')
        .insert({
          family_id: familyId,
          created_by: mom,
          title: 'FAMGOAL Eyes-On Movie Night',
          description: 'Tally Remain Calm 10 times together as a family.',
          participating_member_ids: [alex, casey],
          earning_mode: 'shared_counter',
          target_count: 10,
          prize_name: 'FAMGOAL Eyes-On Movie Night Prize',
          prize_text: 'Popcorn, blankets, and everyone picks a scene.',
        })
        .select()
        .single()
      goalAId = goalA!.id
      await sr
        .from('family_goal_sources')
        .insert({ family_id: familyId, goal_id: goalAId, source_kind: 'family_intention', source_id: intentionA!.id })
      await sr.from('family_intention_iterations').insert({ family_id: familyId, intention_id: intentionA!.id, member_id: alex })
      await sr.from('family_intention_iterations').insert({ family_id: familyId, intention_id: intentionA!.id, member_id: casey })
      await sr.from('family_intention_iterations').insert({ family_id: familyId, intention_id: intentionA!.id, member_id: alex })
    }

    // Fixture B: JUST-completed goal (celebration banner, ≤48h) with an
    // earned-unredeemed Family Prize (Prize Board Family group).
    const { data: existingB } = await sr
      .from('family_goals')
      .select('id, status')
      .eq('title', 'FAMGOAL Eyes-On Family Bike Ride')
      .maybeSingle()
    if (!existingB || existingB.status !== 'completed') {
      const { data: intentionB } = await sr
        .from('family_best_intentions')
        .insert({
          family_id: familyId,
          created_by_member_id: mom,
          title: 'FAMGOAL Eyes-On Kindness Tally',
          participating_member_ids: [alex, casey],
        })
        .select()
        .single()
      const { data: goalB } = await sr
        .from('family_goals')
        .insert({
          family_id: familyId,
          created_by: mom,
          title: 'FAMGOAL Eyes-On Family Bike Ride',
          participating_member_ids: [alex, casey],
          earning_mode: 'shared_counter',
          target_count: 1,
          prize_name: 'FAMGOAL Eyes-On Family Bike Ride Prize',
        })
        .select()
        .single()
      await sr
        .from('family_goal_sources')
        .insert({ family_id: familyId, goal_id: goalB!.id, source_kind: 'family_intention', source_id: intentionB!.id })
      // Fires the real trigger pipeline — completes the goal + awards the prize.
      await sr.from('family_intention_iterations').insert({ family_id: familyId, intention_id: intentionB!.id, member_id: alex })
    }
  })

  test('Tour: FamilyGoalManager + Prize Board (mom)', async ({ page }) => {
    await loginAsMom(page)

    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp)
      await page.goto('/prize-board')
      await waitForAppReady(page)
      await page.getByRole('button', { name: 'Prizes', exact: false }).first().click()
      await waitForAppReady(page)
      await linger(page)
      await shot(page, `fg-prizeboard-${vpName}`)

      // Open the manager from whichever door is currently visible.
      const manageBtn = page.getByTestId('family-goal-manage-button')
      const quietBtn = page.getByTestId('family-goal-quiet-create')
      if (await manageBtn.isVisible().catch(() => false)) {
        await manageBtn.click()
      } else if (await quietBtn.isVisible().catch(() => false)) {
        await quietBtn.click()
      }
      await linger(page)
      await shot(page, `fg-manager-list-${vpName}`)

      const newBtn = page.getByTestId('family-goal-new-button')
      if (await newBtn.isVisible().catch(() => false)) {
        await newBtn.click()
        await linger(page)
        await shot(page, `fg-manager-form-${vpName}`)
      }
    }
  })

  test('Tour: Hub family_goals section (mom)', async ({ page }) => {
    // /hub keeps some background network activity alive (realtime channels /
    // polling) that never reaches Playwright's networkidle — wait on the
    // Hub's own content instead of waitForAppReady's networkidle wait.
    async function waitForHub(p: Page) {
      await p.waitForLoadState('domcontentloaded')
      await p.getByTestId('family-hub').waitFor({ state: 'visible', timeout: 20000 })
      await p.waitForTimeout(500)
    }

    await loginAsMom(page)
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp)
      await page.goto('/hub')
      await waitForHub(page)
      const gotIt = page.getByText('Got it')
      if (await gotIt.isVisible().catch(() => false)) await gotIt.click()
      await linger(page)
      await shot(page, `fg-hub-section-${vpName}`)
    }

    // Hub Settings door (desktop + mobile only — settings modal isn't
    // meaningfully viewport-differentiated at tablet width).
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto('/hub')
    await waitForHub(page)
    const settingsBtn = page.getByRole('button', { name: /settings/i }).first()
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click()
      await linger(page)
      await shot(page, 'fg-hubsettings-door-desktop')
      // Scroll to the "Family Goals & Prizes" group (4b, below Family Best
      // Intentions) to confirm it renders — not visible in the first fold.
      const familyGoalsGroupHeading = page.getByText('Family Goals & Prizes').last()
      if (await familyGoalsGroupHeading.isVisible().catch(() => false)) {
        await familyGoalsGroupHeading.scrollIntoViewIfNeeded()
        await linger(page)
        await shot(page, 'fg-hubsettings-door-scrolled-desktop')
      }
    }

    await page.setViewportSize(VIEWPORTS.mobile)
    await page.reload()
    await waitForHub(page)
    const settingsBtnMobile = page.getByRole('button', { name: /settings/i }).first()
    if (await settingsBtnMobile.isVisible().catch(() => false)) {
      await settingsBtnMobile.click()
      await linger(page)
      await shot(page, 'fg-hubsettings-door-mobile')
    }
  })

  test('Tour: My Rewards Family section (participant + non-participant)', async ({ page }) => {
    await loginAsAlex(page)
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp)
      await page.goto('/my-rewards')
      await waitForAppReady(page)
      await linger(page)
      // The Family section renders after Points/Creatures/Coloring/Custom
      // Rewards — scroll to it directly so it's actually in frame.
      const familySection = page.getByTestId('mr-section-family')
      if (await familySection.isVisible().catch(() => false)) {
        await familySection.scrollIntoViewIfNeeded()
        await linger(page, 400)
      }
      await shot(page, `fg-myrewards-participant-${vpName}`)
    }

    await loginAsJordan(page)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/my-rewards')
    await waitForAppReady(page)
    await linger(page)
    const jordanFamilySection = page.getByTestId('mr-section-family')
    if (await jordanFamilySection.isVisible().catch(() => false)) {
      await jordanFamilySection.scrollIntoViewIfNeeded()
      await linger(page, 400)
    }
    await shot(page, 'fg-myrewards-nonparticipant-mobile')
  })
})
