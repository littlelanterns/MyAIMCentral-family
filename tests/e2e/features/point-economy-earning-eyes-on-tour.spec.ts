/**
 * PECON-EARN — EYES-ON TOUR (manual helper, NOT a regression test)
 *
 * Convention #277: Claude drives this tour via Playwright, reads every
 * screenshot, and fills the Mom-UI Verification table in
 * .claude/rules/current-builds/PECON-earn.md. Gated behind EYES_ON_TOUR so
 * it never runs as part of the normal suite.
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/point-economy-earning-eyes-on-tour.spec.ts --headed
 *
 * Surfaces toured:
 *   1. TaskCreationModal routine flow — "Points for this routine" block +
 *      RoutineSectionEditor per-step reward picker (mom, desktop/mobile)
 *   2. GamificationSettingsModal Points section — task/intention/daily-goal
 *      values, currency name/icon editor, routine glance-list (mom, desktop/mobile)
 *   3. My Rewards daily-goal progress bar (Alex, independent, desktop/tablet/mobile)
 *   4. PlayDashboardHeader daily-goal pill (Ruthie, play, mobile)
 *   5. GuidedGreetingSection daily-goal pill + checking a per-step-rewarded
 *      routine step live (Jordan, guided, mobile)
 *
 * Fixtures: unlike the FAMILY-GOALS/KIDS-REWARDS precedent (which leaves
 * fixtures in place for founder review), this tour reverts EVERY
 * gamification_configs/tasks/routine change it makes in afterAll — several
 * OTHER lanes are actively running against this SAME shared Testworth
 * family right now (per the coordination seat), and daily_points_goal /
 * routine deployments are config-shaped state that could confuse a
 * concurrent lane's own assertions if left dangling.
 */
import { test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsAlex, loginAsJordan, loginAsRiley } from '../helpers/auth'
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

const MARKER = 'PECONTOUR'

let familyId = ''
const memberIds: Record<string, string> = {}
let alexId = '', jordanId = '', ruthieId = ''

// Original gamification_configs values, captured in beforeAll and restored in afterAll.
const originalConfig: Record<string, { daily_points_goal: number | null }> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await sr.from('family_members').select('id').eq('family_id', familyId).eq('display_name', name).single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

let jordanTaskId = '', jordanTemplateId = '', jordanSectionId = ''

test.describe('PECON-EARN eyes-on tour', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr.from('families').select('id').eq('family_login_name_lower', 'testworthfamily').single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    alexId = await memberId('Alex')
    jordanId = await memberId('Jordan')
    ruthieId = await memberId('Ruthie')
    const sarahId = await memberId('Sarah')

    // Capture + set daily_points_goal for all three kid roles so the "N/goal
    // today" surfaces have something to render (they render nothing when NULL).
    for (const [name, id] of [['Alex', alexId], ['Jordan', jordanId], ['Ruthie', ruthieId]] as const) {
      const { data: cfg } = await sr.from('gamification_configs').select('daily_points_goal').eq('family_member_id', id).single()
      originalConfig[name] = { daily_points_goal: cfg?.daily_points_goal ?? null }
      await sr.from('gamification_configs').update({ daily_points_goal: 10 }).eq('family_member_id', id)
      // A partial earn so the pill shows a nonzero, mid-progress ratio rather
      // than a flat "0/10" — more informative for the visual read.
      await sr.rpc('record_point_transaction', {
        p_family_id: familyId, p_family_member_id: id, p_amount: 6, p_transaction_type: 'earn',
        p_source_type: 'manual_test', p_source_id: null, p_description: `${MARKER} tour earn`,
        p_idempotency_key: `${MARKER.toLowerCase()}:earn:${id}`, p_acted_by: null,
      })
    }

    // Deploy a real per-step-rewarded, per-completion-points routine to
    // Jordan (guided) for Tour 5's live "check a step, watch the ledger" shot.
    // Backdated created_at for the same reason point-economy-earning.spec.ts
    // backdates its own fixtures (get_member_day_obligations step-fairness
    // has no UTC/family-timezone grace buffer — see that file's comment).
    const backdated = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const { data: template } = await sr.from('task_templates').insert({
      family_id: familyId, created_by: sarahId, title: `${MARKER} Morning Routine`,
      template_name: `${MARKER} Morning Routine`, task_type: 'routine', template_type: 'routine',
      routine_points_mode: 'per_completion', routine_completion_points: 5,
    }).select('id').single()
    jordanTemplateId = template!.id

    const { data: section } = await sr.from('task_template_sections').insert({
      template_id: jordanTemplateId, title: 'Morning', section_name: 'Morning',
      frequency_rule: 'daily', frequency_days: null, sort_order: 0,
    }).select('id').single()
    jordanSectionId = section!.id

    await sr.from('task_template_steps').insert({
      section_id: jordanSectionId, title: 'Make bed', step_name: 'Make bed',
      instance_count: 1, sort_order: 0, step_type: 'static',
      reward_type: 'stars', reward_amount: 3, created_at: backdated,
    })
    await sr.from('task_template_steps').insert({
      section_id: jordanSectionId, title: 'Brush teeth', step_name: 'Brush teeth',
      instance_count: 1, sort_order: 1, step_type: 'static', created_at: backdated,
    })

    const { data: task } = await sr.from('tasks').insert({
      family_id: familyId, created_by: sarahId, assignee_id: jordanId,
      title: `${MARKER} Morning Routine`, task_type: 'routine', status: 'pending',
      template_id: jordanTemplateId, counts_for_gamification: true, created_at: backdated,
    }).select('id').single()
    jordanTaskId = task!.id
  })

  test.afterAll(async () => {
    // Revert daily_points_goal + sweep tour-created ledger/deed rows for all
    // three kids so no concurrent lane inherits stray state.
    for (const [name, id] of [['Alex', alexId], ['Jordan', jordanId], ['Ruthie', ruthieId]] as const) {
      await sr.from('gamification_configs').update({ daily_points_goal: originalConfig[name].daily_points_goal }).eq('family_member_id', id)
    }
    await sr.from('point_transactions').delete().or('source_type.eq.routine_step,source_type.eq.routine_completion,source_type.eq.manual_test').in('family_member_id', [alexId, jordanId, ruthieId])
    await sr.from('deed_firings').delete().ilike('idempotency_key', 'dpg:%').in('family_member_id', [alexId, jordanId, ruthieId])
    // Reconcile gamification_points to the (now-clean) ledger for all three —
    // same self-healing pattern as point-economy-earning.spec.ts's afterAll.
    for (const id of [alexId, jordanId, ruthieId]) {
      const { data: rows } = await sr.from('point_transactions').select('amount').eq('family_member_id', id)
      const reconciled = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0)
      await sr.from('family_members').update({ gamification_points: reconciled }).eq('id', id)
    }

    if (jordanTaskId) {
      await sr.from('routine_step_completions').delete().eq('task_id', jordanTaskId)
      await sr.from('tasks').delete().eq('id', jordanTaskId)
    }
    if (jordanSectionId) await sr.from('task_template_steps').delete().eq('section_id', jordanSectionId)
    if (jordanTemplateId) {
      await sr.from('task_template_sections').delete().eq('template_id', jordanTemplateId)
      await sr.from('task_templates').delete().eq('id', jordanTemplateId)
    }
  })

  // ── Tour 1: TaskCreationModal routine Points block + per-step reward picker ──
  test('Tour 1 — TaskCreationModal: Points for this routine + per-step reward picker (mom)', async ({ page }) => {
    await loginAsMom(page)

    for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile })) {
      await page.setViewportSize(vp)
      await page.goto('/tasks')
      await waitForAppReady(page)
      await page.getByRole('button', { name: 'Create', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await dialog.waitFor({ state: 'visible' })

      const fullToggle = dialog.getByRole('button', { name: 'Full', exact: true })
      const fullLink = dialog.getByText('Full mode →')
      if (await fullLink.isVisible().catch(() => false)) await fullLink.click()
      else if (await fullToggle.isVisible().catch(() => false)) await fullToggle.click()

      // Select task type = Routine. Scoped to the dialog — the Tasks page
      // behind it has its own unrelated "Routines" inclusion-filter pill
      // (data-testid="inclusion-pill-routines") that also matches /Routine/i.
      await dialog.getByRole('button', { name: /Routine/i }).first().click()
      await linger(page, 500)

      // Build sections manually (creates one blank section + one blank step
      // immediately, per RoutineSectionEditor's makeBlankSection/makeBlankStep).
      const manualBtn = dialog.getByText('Build sections manually')
      if (await manualBtn.isVisible().catch(() => false)) {
        await manualBtn.click()
        await linger(page, 400)
      }

      const heading = dialog.getByText('Rewards & Completion Tracking')
      await heading.scrollIntoViewIfNeeded()
      await linger(page, 400)
      await shot(page, `pecon-01-points-block-${vpName}`)

      // Set the routine points mode to "per step" so the radio's selected
      // state + inline amount input are visible in the shot.
      const perStepRadio = dialog.getByTestId('routine-points-mode-per-step')
      if (await perStepRadio.isVisible().catch(() => false)) {
        await perStepRadio.click()
        await linger(page, 400)
        await shot(page, `pecon-02-routine-points-per-step-selected-${vpName}`)
      }

      // Per-step reward picker: click the Gift-icon toggle on the first step.
      const rewardToggle = dialog.getByTestId('step-reward-toggle').first()
      if (await rewardToggle.isVisible().catch(() => false)) {
        await rewardToggle.scrollIntoViewIfNeeded()
        await rewardToggle.click()
        await linger(page, 500)
        await shot(page, `pecon-03-step-reward-picker-${vpName}`)
      }

      await page.keyboard.press('Escape')
      await linger(page, 300)
    }
  })

  // ── Tour 2: GamificationSettingsModal Points section ────────────────────────
  test('Tour 2 — GamificationSettingsModal: Points section (mom)', async ({ page }) => {
    await loginAsMom(page)

    for (const [vpName, vp] of Object.entries({ desktop: VIEWPORTS.desktop, mobile: VIEWPORTS.mobile })) {
      await page.setViewportSize(vp)
      await page.goto('/family-members')
      await waitForAppReady(page)

      const alexCard = page.locator('.card-hover').filter({ has: page.getByText('Alex', { exact: true }) })
      await alexCard.getByTitle('Edit').click()
      await alexCard.getByRole('button', { name: 'Gamification Settings' }).click()
      await linger(page, 500)

      await page.getByRole('button', { name: 'Points' }).click()
      await linger(page, 500)
      await shot(page, `pecon-04-gamification-points-section-${vpName}`)
    }
  })

  // ── Tour 3: My Rewards daily-goal progress (Alex, independent) ──────────────
  test('Tour 3 — My Rewards: daily-goal progress (Alex, independent)', async ({ page }) => {
    await loginAsAlex(page)
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp)
      await page.goto('/my-rewards')
      await waitForAppReady(page)
      const pointsSection = page.getByTestId('mr-section-points')
      if (await pointsSection.isVisible().catch(() => false)) {
        await pointsSection.scrollIntoViewIfNeeded()
        await linger(page, 400)
      }
      await shot(page, `pecon-05-myrewards-daily-goal-${vpName}`)
    }
  })

  // ── Tour 4: PlayDashboardHeader daily-goal pill (Ruthie, play) ───────────────
  test('Tour 4 — Play dashboard: daily-goal pill (Ruthie)', async ({ page }) => {
    await loginAsRiley(page)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    let dialogCount = await page.locator('[role="dialog"]').count()
    while (dialogCount > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      dialogCount = await page.locator('[role="dialog"]').count()
    }
    await linger(page, 600)
    await shot(page, 'pecon-06-play-dashboard-daily-goal-mobile')
  })

  // ── Tour 5: GuidedGreetingSection pill + live step-check (Jordan, guided) ───
  test('Tour 5 — Guided dashboard: daily-goal pill + checking a per-step-rewarded routine step (Jordan)', async ({ page }) => {
    await loginAsJordan(page)
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    let dialogCount = await page.locator('[role="dialog"]').count()
    while (dialogCount > 0) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
      dialogCount = await page.locator('[role="dialog"]').count()
    }
    await linger(page, 600)
    await shot(page, 'pecon-07-guided-dashboard-daily-goal-pill')

    // Find the seeded routine and expand it.
    const routineRow = page.getByText(`${MARKER} Morning Routine`, { exact: false }).first()
    if (await routineRow.isVisible().catch(() => false)) {
      await routineRow.scrollIntoViewIfNeeded()
      await routineRow.click()
      await linger(page, 500)
      await shot(page, 'pecon-08-guided-routine-expanded')

      // Click the first step's checkbox (structural locator — StepRow has no
      // testid/aria-label). The row wrapper is `<div className="flex
      // items-start gap-2 py-1.5 group">` (RoutineStepChecklist.tsx:298) —
      // the checkbox <button> is a DIRECT SIBLING of the title's own
      // `<div className="flex-1 min-w-0">`, not a descendant of it, so a
      // bare `.filter({hasText}).last()` over ALL divs tends to resolve to
      // the innermost title div (which has no button descendant at all).
      // Target the `.group` row wrapper specifically instead.
      const stepLabel = page.getByText('Make bed', { exact: true }).first()
      await stepLabel.scrollIntoViewIfNeeded().catch(() => {})
      await linger(page, 300)
      const stepRow = page.locator('div.group').filter({ hasText: 'Make bed' }).first()
      const checkButton = stepRow.locator('button').first()
      if (await checkButton.isVisible().catch(() => false)) {
        const pointsBefore = await sr.from('family_members').select('gamification_points').eq('id', jordanId).single()
        await checkButton.click()
        await linger(page, 1200) // let the fire-and-forget processRoutineStepCompletion round-trip
        await shot(page, 'pecon-09-guided-step-checked')

        const pointsAfter = await sr.from('family_members').select('gamification_points').eq('id', jordanId).single()
        // Not an assertion (this is a tour, not a regression pin) — just a
        // console record for the eyes-on read to cross-reference against the
        // screenshot's own rendered points display.
        console.log(`TOUR-jordan-points: before=${pointsBefore.data?.gamification_points} after=${pointsAfter.data?.gamification_points} (expect +3 stars reward from the "Make bed" step)`)
      }
    }
  })
})
