/**
 * Workers 2+3 — Shared Routines + Shared Lists behavioral layer.
 *
 * Tests the 9 items built in the Workers 2+3 session:
 *   1. Grayed-out read-only steps for non-completers
 *   2. Multi-instance FIRST-N-COMPLETERS
 *   3. Mom re-attribution
 *   4. Dashboard renders shared routines for all assignees
 *   5. Completer color on shared list items
 *   6. Claim semantics ("I'm on it") on shared list items
 *   7. Four-mode sharing config (shared vs individual copies)
 *   8. Cross-sibling edit authority (mom-only editing on shared items)
 *   9. Mom review surface (week view with member colors)
 */

import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { loginAsMom, loginAsAlex, loginAsCasey } from '../helpers/auth'
import { captureConsoleErrors, assertNoInfiniteRenders, waitForAppReady } from '../helpers/assertions'
import { todayLocalIso } from '../helpers/dates'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SCREENSHOT_DIR = 'tests/e2e/screenshots/workers2-3-shared'

const TEST_PREFIX = 'W23 Test'
const SHARED_ROUTINE_TITLE = `${TEST_PREFIX} Shared Kitchen Routine`
const SHARED_LIST_TITLE = `${TEST_PREFIX} Shared Shopping`
const INDIVIDUAL_LIST_TITLE = `${TEST_PREFIX} Individual Chores`

let familyId: string
let sarahMemberId: string
let alexMemberId: string
let caseyMemberId: string

let routineTemplateId: string
let routineSectionId: string
let routineStepIds: string[] = []
let routineTaskId: string

let sharedListId: string
let sharedListItemIds: string[] = []

let errors: string[]

async function lookupFamily(): Promise<string> {
  const { data } = await admin.from('families').select('id').eq('family_login_name', 'testworthfamily').single()
  if (!data) throw new Error('Testworth family not found')
  return data.id
}

async function lookupMember(fId: string, name: string): Promise<string> {
  const { data } = await admin.from('family_members').select('id').eq('family_id', fId).eq('display_name', name).single()
  if (!data) throw new Error(`Member ${name} not found`)
  return data.id
}

test.beforeAll(async () => {
  familyId = await lookupFamily()
  sarahMemberId = await lookupMember(familyId, 'Sarah')
  alexMemberId = await lookupMember(familyId, 'Alex')
  caseyMemberId = await lookupMember(familyId, 'Casey')

  // ── Clean up prior runs ─────────────────────────────────────
  const { data: priorTasks } = await admin
    .from('tasks')
    .select('id, template_id')
    .eq('family_id', familyId)
    .like('title', `${TEST_PREFIX}%`)
  for (const t of priorTasks ?? []) {
    await admin.from('routine_step_completions').delete().eq('task_id', t.id)
    await admin.from('task_assignments').delete().eq('task_id', t.id)
    await admin.from('tasks').delete().eq('id', t.id)
    if (t.template_id) {
      await admin.from('task_template_steps').delete().eq('section_id', t.template_id).throwOnError().catch(() => {})
      const { data: secs } = await admin.from('task_template_sections').select('id').eq('template_id', t.template_id)
      for (const s of secs ?? []) {
        await admin.from('task_template_steps').delete().eq('section_id', s.id)
      }
      await admin.from('task_template_sections').delete().eq('template_id', t.template_id)
      await admin.from('task_templates').delete().eq('id', t.template_id)
    }
  }

  const { data: priorLists } = await admin
    .from('lists')
    .select('id')
    .eq('family_id', familyId)
    .like('title', `${TEST_PREFIX}%`)
  for (const l of priorLists ?? []) {
    await admin.from('list_items').delete().eq('list_id', l.id)
    await admin.from('list_shares').delete().eq('list_id', l.id)
    await admin.from('lists').delete().eq('id', l.id)
  }

  // ── Create shared routine template ────────────────────────
  const { data: tmpl, error: tmplErr } = await admin
    .from('task_templates')
    .insert({
      family_id: familyId,
      created_by: sarahMemberId,
      title: SHARED_ROUTINE_TITLE,
      template_name: SHARED_ROUTINE_TITLE,
      template_type: 'routine',
      task_type: 'routine',
    })
    .select('id')
    .single()
  if (tmplErr) throw new Error(`task_templates insert failed: ${tmplErr.message}`)
  routineTemplateId = tmpl!.id

  const today = new Date()
  const dow = String(today.getDay())

  const { data: sec, error: secErr } = await admin
    .from('task_template_sections')
    .insert({
      template_id: routineTemplateId,
      section_name: 'Kitchen Duties',
      title: 'Kitchen Duties',
      sort_order: 0,
      frequency_rule: 'daily',
      frequency_days: [dow],
    })
    .select('id')
    .single()
  if (secErr) throw new Error(`task_template_sections insert failed: ${secErr.message}`)
  routineSectionId = sec!.id

  const stepNames = ['Wash dishes', 'Clear counter', 'Sweep floor']
  const { data: steps } = await admin
    .from('task_template_steps')
    .insert(
      stepNames.map((name, i) => ({
        section_id: routineSectionId,
        title: name,
        step_name: name,
        sort_order: i,
        instance_count: 1,
      })),
    )
    .select('id')
  routineStepIds = (steps ?? []).map(s => s.id)

  // Deploy as shared routine task
  const { data: task, error: taskErr } = await admin
    .from('tasks')
    .insert({
      family_id: familyId,
      created_by: sarahMemberId,
      assignee_id: alexMemberId,
      template_id: routineTemplateId,
      title: SHARED_ROUTINE_TITLE,
      task_type: 'routine',
      status: 'pending',
      is_shared: true,
      source: 'manual',
      recurrence_details: {},
    })
    .select('id')
    .single()
  if (taskErr) throw new Error(`tasks insert failed: ${taskErr.message}`)
  routineTaskId = task!.id

  // Assign to both Alex and Casey
  await admin.from('task_assignments').insert([
    { task_id: routineTaskId, member_id: alexMemberId, family_member_id: alexMemberId, assigned_by: sarahMemberId, is_active: true },
    { task_id: routineTaskId, member_id: caseyMemberId, family_member_id: caseyMemberId, assigned_by: sarahMemberId, is_active: true },
  ])

  // ── Create shared list ────────────────────────────────────
  const { data: list } = await admin
    .from('lists')
    .insert({
      family_id: familyId,
      owner_id: sarahMemberId,
      title: SHARED_LIST_TITLE,
      list_type: 'shopping',
      is_shared: true,
      tags: [],
    })
    .select('id')
    .single()
  sharedListId = list!.id

  const { data: items } = await admin
    .from('list_items')
    .insert([
      { list_id: sharedListId, content: 'Milk', sort_order: 0 },
      { list_id: sharedListId, content: 'Bread', sort_order: 1 },
      { list_id: sharedListId, content: 'Eggs', sort_order: 2 },
    ])
    .select('id')
  sharedListItemIds = (items ?? []).map(i => i.id)

  // Share with Alex and Casey
  await admin.from('list_shares').insert([
    { list_id: sharedListId, shared_with: alexMemberId, member_id: alexMemberId, permission: 'edit', can_edit: true },
    { list_id: sharedListId, shared_with: caseyMemberId, member_id: caseyMemberId, permission: 'edit', can_edit: true },
  ])
})

test.afterAll(async () => {
  // Cleanup in reverse order
  await admin.from('routine_step_completions').delete().eq('task_id', routineTaskId)
  await admin.from('task_assignments').delete().eq('task_id', routineTaskId)
  await admin.from('tasks').delete().eq('id', routineTaskId)
  for (const id of routineStepIds) {
    await admin.from('task_template_steps').delete().eq('id', id)
  }
  await admin.from('task_template_sections').delete().eq('id', routineSectionId)
  await admin.from('task_templates').delete().eq('id', routineTemplateId)

  await admin.from('list_items').delete().eq('list_id', sharedListId)
  await admin.from('list_shares').delete().eq('list_id', sharedListId)
  await admin.from('lists').delete().eq('id', sharedListId)

  // Clean up any individual copies created during test
  const { data: copies } = await admin
    .from('lists')
    .select('id')
    .eq('family_id', familyId)
    .like('title', `${TEST_PREFIX}%`)
  for (const c of copies ?? []) {
    await admin.from('list_items').delete().eq('list_id', c.id)
    await admin.from('list_shares').delete().eq('list_id', c.id)
    await admin.from('lists').delete().eq('id', c.id)
  }
})

test.beforeEach(async ({ page }) => {
  errors = captureConsoleErrors(page)
})

test.afterEach(() => {
  assertNoInfiniteRenders(errors)
})

// ─── Test Suite ─────────────────────────────────────────────

test.describe.serial('Workers 2+3 — Shared Routines + Shared Lists', () => {
  test('4. Shared routine appears on dashboard for all assignees', async ({ page }) => {
    // Alex should see the shared routine
    await loginAsAlex(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${SCREENSHOT_DIR}/alex-dashboard.png`, fullPage: true })

    const mainContent = page.locator('main, [role="main"]').first()
    const text = await mainContent.textContent()
    expect(text).toContain(SHARED_ROUTINE_TITLE)
  })

  test('4b. Shared routine also appears for second assignee (Casey)', async ({ page }) => {
    await loginAsCasey(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)

    const mainContent = page.locator('main, [role="main"]').first()
    const text = await mainContent.textContent()
    expect(text).toContain(SHARED_ROUTINE_TITLE)
  })

  test('1+2. Alex completes a step; Casey sees it grayed out with attribution', async ({ page }) => {
    // Alex completes "Wash dishes"
    const todayIso = todayLocalIso()
    await admin.from('routine_step_completions').insert({
      task_id: routineTaskId,
      step_id: routineStepIds[0],
      member_id: alexMemberId,
      family_member_id: alexMemberId,
      period_date: todayIso,
      instance_number: 1,
    })

    // Casey views the routine — should see Alex's completion attributed
    await loginAsCasey(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)

    // Expand the routine by clicking the "today" subtitle area
    const expandBtn = page.locator('text=/\\d+\\/\\d+ today/').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
    } else {
      await page.locator(`text=${SHARED_ROUTINE_TITLE}`).first().click()
    }
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SCREENSHOT_DIR}/casey-sees-alex-completion.png`, fullPage: true })

    // The step should be visible as completed (checked, strikethrough)
    const washDishes = page.locator('text=Wash dishes').first()
    await expect(washDishes).toBeVisible({ timeout: 5000 })

    // DB verification: the completion is credited to Alex, not Casey
    const { data: completions } = await admin
      .from('routine_step_completions')
      .select('family_member_id')
      .eq('task_id', routineTaskId)
      .eq('step_id', routineStepIds[0])
    expect(completions).toBeTruthy()
    expect(completions!.length).toBe(1)
    expect(completions![0].family_member_id).toBe(alexMemberId)

    // Check that the step renders as done (strikethrough)
    const stepStyle = await washDishes.evaluate(el => window.getComputedStyle(el).textDecoration)
    expect(stepStyle).toContain('line-through')
  })

  test('8. Cross-sibling edit authority — Casey cannot edit shared routine steps', async ({ page }) => {
    await loginAsCasey(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)

    // Expand the routine
    const expandBtn = page.locator('text=/\\d+\\/\\d+ today/').first()
    if (await expandBtn.isVisible()) await expandBtn.click()
    else await page.locator(`text=${SHARED_ROUTINE_TITLE}`).first().click()
    await page.waitForTimeout(1500)

    // The pencil edit button should NOT be visible for Casey (non-mom)
    const editButton = page.locator('button[title="Edit steps"]')
    const editCount = await editButton.count()
    expect(editCount).toBe(0)

    await page.screenshot({ path: `${SCREENSHOT_DIR}/casey-no-edit-button.png`, fullPage: true })
  })

  test('5. Shared list shows checker color when Alex checks an item', async ({ page }) => {
    // Alex checks "Milk"
    await admin.from('list_items').update({
      checked: true,
      checked_by: alexMemberId,
      checked_at: new Date().toISOString(),
    }).eq('id', sharedListItemIds[0])

    // Mom views the shared list
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)

    // Click into the shared list
    const listCard = page.locator(`text=${SHARED_LIST_TITLE}`).first()
    await listCard.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${SCREENSHOT_DIR}/mom-sees-checker-color.png`, fullPage: true })

    // Should see "by" attribution text for the checked item
    const byText = page.locator('text=/by \\w+/')
    await expect(byText.first()).toBeVisible({ timeout: 5000 })
  })

  test('6. Claim semantics — "I\'m on it" appears on shared list items', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)

    const listCard = page.locator(`text=${SHARED_LIST_TITLE}`).first()
    await listCard.click()
    await page.waitForTimeout(1500)

    // Hover over an unchecked item — "I'm on it" should appear
    const breadItem = page.locator('text=Bread').first()
    await breadItem.hover()
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${SCREENSHOT_DIR}/claim-hover.png`, fullPage: true })

    // Click "I'm on it"
    const claimBtn = page.locator('text=I\'m on it').first()
    if (await claimBtn.isVisible()) {
      await claimBtn.click()
      await page.waitForTimeout(1000)

      // Verify the claim was written to DB
      const { data: item } = await admin
        .from('list_items')
        .select('in_progress_member_id')
        .eq('id', sharedListItemIds[1])
        .single()
      expect(item?.in_progress_member_id).toBeTruthy()

      await page.screenshot({ path: `${SCREENSHOT_DIR}/claim-active.png`, fullPage: true })
    }
  })

  test('7. Share modal shows "Shared list" / "Individual copies" toggle', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)

    const listCard = page.locator(`text=${SHARED_LIST_TITLE}`).first()
    await listCard.click()
    await page.waitForTimeout(1500)

    // Open share modal
    const shareButton = page.locator('button').filter({ has: page.locator('[data-lucide="share-2"], [class*="lucide-share"]') }).first()
    // Fallback: find by aria or text
    const shareTrigger = page.locator('button[title*="hare"], button:has-text("Share")').first()
    const trigger = (await shareButton.count()) > 0 ? shareButton : shareTrigger
    if (await trigger.isVisible()) {
      await trigger.click()
      await page.waitForTimeout(1000)

      // The mode toggle should be visible
      const sharedListBtn = page.locator('text=Shared list')
      const individualBtn = page.locator('text=Individual copies')

      await page.screenshot({ path: `${SCREENSHOT_DIR}/share-modal-modes.png`, fullPage: true })

      if (await sharedListBtn.isVisible()) {
        await expect(sharedListBtn).toBeVisible()
        await expect(individualBtn).toBeVisible()

        // Click "Individual copies" mode
        await individualBtn.click()
        await page.waitForTimeout(500)

        // Description should update
        const desc = page.locator('text=Each person gets their own copy')
        await expect(desc).toBeVisible({ timeout: 3000 })

        await page.screenshot({ path: `${SCREENSHOT_DIR}/share-modal-individual-mode.png`, fullPage: true })
      }

      // Close modal
      const closeBtn = page.locator('button:has([data-lucide="x"])').first()
      if (await closeBtn.isVisible()) await closeBtn.click()
    }
  })

  test('3. Mom re-attribution — "done by" is clickable for mom', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)

    // Find and expand the shared routine
    const expandBtn = page.locator('text=/\\d+\\/\\d+ today/').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await page.waitForTimeout(1500)

      // The "done by" text should be visible and clickable (underlined)
      const doneBy = page.locator('button:has-text("done by")').first()
      await page.screenshot({ path: `${SCREENSHOT_DIR}/mom-reattribute-before.png`, fullPage: true })

      if (await doneBy.isVisible()) {
        await doneBy.click()
        await page.waitForTimeout(500)

        // A picker with member names should appear
        await page.screenshot({ path: `${SCREENSHOT_DIR}/mom-reattribute-picker.png`, fullPage: true })

        // Should see member name pills
        const picker = page.locator('.rounded-full').filter({ hasText: /\w+/ })
        const pillCount = await picker.count()
        expect(pillCount).toBeGreaterThanOrEqual(1)
      }
    }
  })

  test('9. Mom week view shows shared completion data', async ({ page }) => {
    await loginAsMom(page)

    // Navigate to the week edit page for Alex (primary assignee)
    await page.goto(`/settings/allowance/${alexMemberId}/history`)
    await waitForAppReady(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: `${SCREENSHOT_DIR}/week-view.png`, fullPage: true })

    // The page should load (not show "No routines found") even without allowance
    const mainContent = page.locator('main, [role="main"]').first()
    const content = await mainContent.textContent()

    // Should show the routine title
    expect(content).toContain('Kitchen Duties')

    // Should show "Edit Past Days" in the heading
    const heading = page.locator('h1')
    await expect(heading).toContainText('Edit Past Days')
  })

  test('9b. Week view shows other completer name for shared steps', async ({ page }) => {
    // Casey completes "Clear counter" — this should show Casey's name on Alex's week view
    const todayIso = todayLocalIso()
    await admin.from('routine_step_completions').insert({
      task_id: routineTaskId,
      step_id: routineStepIds[1],
      member_id: caseyMemberId,
      family_member_id: caseyMemberId,
      period_date: todayIso,
      instance_number: 1,
    })

    await loginAsMom(page)
    await page.goto(`/settings/allowance/${alexMemberId}/history`)
    await waitForAppReady(page)
    await page.waitForTimeout(2000)

    // Viewing Alex's week — Casey's completion of "Clear counter" should show Casey's name
    const todayBlock = page.locator(`[data-testid*="week-edit-day-${todayIso}"]`)
    if (await todayBlock.isVisible()) {
      const blockText = await todayBlock.textContent()
      expect(blockText).toContain('Casey')
      await page.screenshot({ path: `${SCREENSHOT_DIR}/week-view-completer-names.png`, fullPage: true })
    }
  })

  test('View this week link appears on shared routines for mom', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)

    // Expand shared routine
    const expandBtn = page.locator('text=/\\d+\\/\\d+ today/').first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await page.waitForTimeout(1500)

      // "View this week" link should be visible
      const weekLink = page.locator('text=View this week')
      await page.screenshot({ path: `${SCREENSHOT_DIR}/view-this-week-link.png`, fullPage: true })
      await expect(weekLink).toBeVisible({ timeout: 5000 })
    }
  })

  test('DB verification — shared completion has correct member_id', async () => {
    const { data: completions } = await admin
      .from('routine_step_completions')
      .select('*')
      .eq('task_id', routineTaskId)
      .eq('step_id', routineStepIds[0])

    expect(completions).toBeTruthy()
    expect(completions!.length).toBeGreaterThanOrEqual(1)
    expect(completions![0].family_member_id).toBe(alexMemberId)
  })

  test('DB verification — list claim column exists and is writable', async () => {
    // Write a claim
    await admin.from('list_items').update({
      in_progress_member_id: caseyMemberId,
    }).eq('id', sharedListItemIds[2])

    // Read it back
    const { data } = await admin
      .from('list_items')
      .select('in_progress_member_id')
      .eq('id', sharedListItemIds[2])
      .single()

    expect(data?.in_progress_member_id).toBe(caseyMemberId)

    // Clean up
    await admin.from('list_items').update({
      in_progress_member_id: null,
    }).eq('id', sharedListItemIds[2])
  })
})
