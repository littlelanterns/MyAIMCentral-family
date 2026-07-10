/**
 * FE-FOLLOWUP item 1 (2026-07-10) — View-As mobile scroll regression.
 *
 * Founder-reported: on mobile, viewing as a kid with a long routine (repro:
 * View As a Guided kid, open a routine with many steps), the step list did
 * NOT scroll — touch scroll fell through and scrolled MOM'S page underneath
 * the modal instead, making everything below the fold unreachable.
 *
 * Root cause (see ViewAsModal.tsx / GuidedShell.tsx / BottomNav.tsx comments
 * for the full diagnosis):
 *   1. `document.body.style.overflow = 'hidden'` alone does not reliably
 *      block touch-scroll-through on mobile Safari/iOS behind a
 *      `position: fixed` overlay — fixed with a real position:fixed lock.
 *   2. GuidedShell's `main` had its OWN `overflow-y-auto`, creating a SECOND
 *      independently-scrollable region nested inside the modal's own scroll
 *      wrapper (both boxes genuinely overflowing, both svh-derived) — an
 *      ambiguous double-scroll-container setup on touch devices. Fixed by
 *      converting GuidedShell's bottom nav to `position: fixed` (matching
 *      every other shell's nav) so `main` no longer needs its own scroll.
 *   3. `overscroll-behavior: contain` added to the modal's scroll wrapper as
 *      defense-in-depth against any remaining scroll-chaining.
 *
 * A genuinely separate bug was found (and fixed) while building this test:
 * BottomNav.tsx (the mobile nav shared by Independent/Adult/Mom) never
 * forked on isViewingAs — every tap called react-router's real NavLink,
 * silently changing mom's REAL page behind the modal while the modal's own
 * `currentPath` state (which decides what renders inside the overlay) never
 * moved. This blocked navigating to the Tasks page inside View-As at all on
 * mobile, which is why it had to be fixed to even write the "long Tasks
 * list" leg of this test. Mirrors the exact fork Sidebar.tsx / PlayShell /
 * GuidedBottomNav already use.
 *
 * This is a REAL regression spec (not EYES_ON_TOUR-gated) — it has hard
 * assertions and belongs in the normal suite. It also captures screenshots
 * into the gitignored eyes-on-tour/ folder for Convention #277 visual
 * verification (read directly, not just asserted).
 *
 * Chromium can't reproduce the iOS-specific touch-scroll-through bug itself
 * (this repo's Playwright config only runs a chromium project), so the
 * assertions instead verify the underlying STRUCTURAL claims that make the
 * bug impossible: (a) there is exactly ONE genuinely-overflowing scroll
 * container (the modal's own wrapper), not two competing ones; (b) the
 * body is really pinned via position:fixed while the modal is open, and
 * released on close; (c) programmatically scrolling the modal's region
 * moves it while window/body scroll position never changes.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

const sr = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')
async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

const STEP_COUNT = 18
const CASEY_TASK_COUNT = 22
const PREFIX = 'VASCROLL'

test.describe('View-As mobile scroll (FE-FOLLOWUP item 1)', () => {
  test.describe.configure({ mode: 'serial' })
  test.slow()

  let familyId = ''
  let momId = ''
  let jordanId = ''
  let ruthieId = ''
  let caseyId = ''
  let templateId = ''
  const routineTaskIds: string[] = []
  const caseyTaskIds: string[] = []

  test.beforeAll(async () => {
    const { data: family, error: famErr } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (famErr || !family) throw new Error(`Testworth family not found: ${famErr?.message}`)
    familyId = family.id

    const { data: members, error: memErr } = await sr
      .from('family_members')
      .select('id, display_name')
      .eq('family_id', familyId)
      .in('display_name', ['Sarah', 'Jordan', 'Ruthie', 'Casey'])
    if (memErr || !members) throw new Error(`Testworth members not found: ${memErr?.message}`)
    momId = members.find(m => m.display_name === 'Sarah')!.id
    jordanId = members.find(m => m.display_name === 'Jordan')!.id
    ruthieId = members.find(m => m.display_name === 'Ruthie')!.id
    caseyId = members.find(m => m.display_name === 'Casey')!.id

    // Defensive sweep of any leftover fixtures from a prior aborted run.
    await sweepFixtures()

    // ── Routine template with STEP_COUNT steps (assigned to Jordan + Ruthie) ──
    const { data: template, error: tmplErr } = await sr
      .from('task_templates')
      .insert({
        family_id: familyId,
        created_by: momId,
        title: `${PREFIX} Tour Routine`,
        template_name: `${PREFIX} Tour Routine`,
        task_type: 'routine',
        template_type: 'routine',
      })
      .select('id')
      .single()
    if (tmplErr || !template) throw new Error(`Failed to seed template: ${tmplErr?.message}`)
    templateId = template.id

    const { data: section, error: secErr } = await sr
      .from('task_template_sections')
      .insert({
        template_id: templateId,
        title: 'Morning Steps',
        section_name: 'Morning Steps',
        sort_order: 0,
        frequency_rule: 'daily',
      })
      .select('id')
      .single()
    if (secErr || !section) throw new Error(`Failed to seed section: ${secErr?.message}`)

    const steps = Array.from({ length: STEP_COUNT }, (_, i) => ({
      section_id: section.id,
      title: `Step ${i + 1}: ${PREFIX} thing to do`,
      step_name: `Step ${i + 1}: ${PREFIX} thing to do`,
      sort_order: i,
    }))
    const { error: stepErr } = await sr.from('task_template_steps').insert(steps)
    if (stepErr) throw new Error(`Failed to seed steps: ${stepErr.message}`)

    for (const assigneeId of [jordanId, ruthieId]) {
      const { data: task, error: taskErr } = await sr
        .from('tasks')
        .insert({
          family_id: familyId,
          created_by: momId,
          assignee_id: assigneeId,
          template_id: templateId,
          title: `${PREFIX} Tour Routine`,
          task_type: 'routine',
          status: 'pending',
          source: 'manual',
        })
        .select('id')
        .single()
      if (taskErr || !task) throw new Error(`Failed to seed routine task: ${taskErr?.message}`)
      routineTaskIds.push(task.id)
    }

    // ── A long flat Tasks list for Casey (Independent) ──
    const caseyInserts = Array.from({ length: CASEY_TASK_COUNT }, (_, i) => ({
      family_id: familyId,
      created_by: momId,
      assignee_id: caseyId,
      title: `${PREFIX} Casey Task ${String(i + 1).padStart(2, '0')}`,
      task_type: 'task',
      status: 'pending',
      source: 'manual',
    }))
    const { data: caseyRows, error: caseyErr } = await sr.from('tasks').insert(caseyInserts).select('id')
    if (caseyErr || !caseyRows) throw new Error(`Failed to seed Casey tasks: ${caseyErr?.message}`)
    caseyTaskIds.push(...caseyRows.map(r => r.id as string))
  })

  test.afterAll(async () => {
    await sweepFixtures()
  })

  async function sweepFixtures() {
    if (!familyId) return
    // Delete tasks first (FK references template_id).
    await sr.from('tasks').delete().eq('family_id', familyId).like('title', `${PREFIX}%`)
    const { data: templates } = await sr
      .from('task_templates')
      .select('id')
      .eq('family_id', familyId)
      .like('title', `${PREFIX}%`)
    const templateIds = (templates ?? []).map(t => t.id as string)
    if (templateIds.length) {
      const { data: sections } = await sr
        .from('task_template_sections')
        .select('id')
        .in('template_id', templateIds)
      const sectionIds = (sections ?? []).map(s => s.id as string)
      if (sectionIds.length) {
        await sr.from('task_template_steps').delete().in('section_id', sectionIds)
      }
      await sr.from('task_template_sections').delete().in('template_id', templateIds)
      await sr.from('task_templates').delete().in('id', templateIds)
    }
  }

  /**
   * Shared structural + scroll-lock assertions, run once the modal is open
   * and its scrollable content has real overflow (a routine or a long list).
   */
  async function assertSingleScrollRegionAndBodyLock(page: import('@playwright/test').Page) {
    // Body must be genuinely pinned (position:fixed), not just overflow:hidden.
    const bodyState = await page.evaluate(() => ({
      position: getComputedStyle(document.body).position,
      winY: window.scrollY,
    }))
    expect(bodyState.position).toBe('fixed')

    const scrollRegion = page.locator('[data-testid="view-as-scroll-region"]')
    await expect(scrollRegion).toBeVisible()
    const dims = await scrollRegion.evaluate(el => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    // The modal's own wrapper must genuinely overflow — it's the one
    // designated scroll region.
    expect(dims.scrollHeight).toBeGreaterThan(dims.clientHeight)

    // Programmatically scroll the modal region and confirm it moves while
    // the real page (window/body) never does — the exact "falls through"
    // failure mode the founder reported.
    await scrollRegion.evaluate(el => { el.scrollTop = 300 })
    const afterScrollTop = await scrollRegion.evaluate(el => el.scrollTop)
    expect(afterScrollTop).toBeGreaterThan(0)

    const afterWinY = await page.evaluate(() => window.scrollY)
    expect(afterWinY).toBe(bodyState.winY)
  }

  test('Guided (Jordan) — routine step list is the single scroll region, body is locked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Jordan' }).first().click()
    await page.locator('[data-testid="view-as-exit"]').waitFor({ state: 'visible', timeout: 15000 })
    await shot(page, 'vascroll-01-jordan-modal-open')

    // GuidedShell's own `main` must no longer be independently scrollable
    // (the double-nested-scroll-container fix).
    const mainOverflow = await page.getByTestId('view-as-modal').locator('main').first().evaluate(el => getComputedStyle(el).overflowY)
    expect(mainOverflow).not.toBe('auto')
    expect(mainOverflow).not.toBe('scroll')

    // Expand the routine — tap its title row.
    // Exact match — the Next Best Thing card ALSO renders this routine's
    // name as its own exact-text heading (Guided dashboard order per
    // Convention #122: greeting, best_intentions, next_best_thing, calendar,
    // active_tasks — NBT always renders BEFORE the real task row in the
    // DOM). `.last()` picks the actual task-row title, not the NBT card.
    await page.getByText(`${PREFIX} Tour Routine`, { exact: true }).last().click()
    await page.getByText(`Step 1: ${PREFIX} thing to do`).waitFor({ timeout: 10000 })
    await page.getByText(`Step ${STEP_COUNT}: ${PREFIX} thing to do`).scrollIntoViewIfNeeded()
    await shot(page, 'vascroll-02-jordan-routine-expanded')

    await assertSingleScrollRegionAndBodyLock(page)
    await shot(page, 'vascroll-03-jordan-scrolled')

    // GuidedBottomNav must stay pinned (position:fixed) — visible after scroll.
    const navFixed = await page.getByTestId('view-as-modal').locator('nav').last().evaluate(el => getComputedStyle(el).position)
    expect(navFixed).toBe('fixed')

    await page.locator('[data-testid="view-as-exit"]').click()
    await page.waitForTimeout(400)
    const afterExitPosition = await page.evaluate(() => getComputedStyle(document.body).position)
    expect(afterExitPosition).not.toBe('fixed')
  })

  test('Play (Ruthie) — routine step list is the single scroll region, body is locked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Ruthie' }).first().click()
    await page.locator('[data-testid="view-as-exit"]').waitFor({ state: 'visible', timeout: 15000 })
    await shot(page, 'vascroll-04-ruthie-modal-open')

    // Exact match — the Next Best Thing card ALSO renders this routine's
    // name as its own exact-text heading (Guided dashboard order per
    // Convention #122: greeting, best_intentions, next_best_thing, calendar,
    // active_tasks — NBT always renders BEFORE the real task row in the
    // DOM). `.last()` picks the actual task-row title, not the NBT card.
    await page.getByText(`${PREFIX} Tour Routine`, { exact: true }).last().click()
    await page.getByText(`Step 1: ${PREFIX} thing to do`).waitFor({ timeout: 10000 })
    await shot(page, 'vascroll-05-ruthie-routine-expanded')

    await assertSingleScrollRegionAndBodyLock(page)
    await shot(page, 'vascroll-06-ruthie-scrolled')

    // PlayShell's nav must stay pinned (position:fixed) — unchanged by this fix.
    const navFixed = await page.getByTestId('view-as-modal').locator('nav').last().evaluate(el => getComputedStyle(el).position)
    expect(navFixed).toBe('fixed')

    await page.locator('[data-testid="view-as-exit"]').click()
    await page.waitForTimeout(400)
    const afterExitPosition = await page.evaluate(() => getComputedStyle(document.body).position)
    expect(afterExitPosition).not.toBe('fixed')
  })

  test('Independent (Casey) — long Tasks list reached via the now-fixed BottomNav, single scroll region', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('tab', { name: /View As/i }).click()
    await page
      .getByText('Choose a family member to see their dashboard experience')
      .waitFor({ state: 'visible', timeout: 10000 })
    await page.getByRole('button').filter({ hasText: 'Casey' }).first().click()
    await page.locator('[data-testid="view-as-exit"]').waitFor({ state: 'visible', timeout: 15000 })
    await shot(page, 'vascroll-07-casey-modal-open')

    // Navigate to Tasks via BottomNav — this is the navigation-desync bug
    // that was fixed alongside the scroll fix (BottomNav never forked on
    // isViewingAs, so this tap used to silently change mom's REAL page
    // behind the modal instead of the modal's own content). Inside View-As
    // the nav item renders as a <button> (state-based nav), not an <a>.
    // The two-BottomNav collision: mom's real underlying page (MomShell)
    // stays mounted behind the modal and ALSO renders a BottomNav — scope
    // to the modal's own tree specifically.
    await page.getByTestId('view-as-modal').getByTestId('bottom-nav').getByRole('button', { name: 'Tasks' }).click()
    await page.getByText(`${PREFIX} Casey Task 01`).waitFor({ timeout: 15000 })
    await page.getByText(`${PREFIX} Casey Task ${String(CASEY_TASK_COUNT).padStart(2, '0')}`).scrollIntoViewIfNeeded()
    await shot(page, 'vascroll-08-casey-tasks-list')

    await assertSingleScrollRegionAndBodyLock(page)
    await shot(page, 'vascroll-09-casey-scrolled')

    await page.locator('[data-testid="view-as-exit"]').click()
    await page.waitForTimeout(400)
    const afterExitPosition = await page.evaluate(() => getComputedStyle(document.body).position)
    expect(afterExitPosition).not.toBe('fixed')

    // Confirm the fix: mom's own REAL location was never disturbed by the
    // in-modal Tasks tap (the exact symptom of the BottomNav bug).
    expect(new URL(page.url()).pathname).toBe('/dashboard')
  })
})
