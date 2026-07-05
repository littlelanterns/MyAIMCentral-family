/**
 * Progress Chart Wizard — real-deploy regression pin (finding F-21 / ST-0 hotfix).
 *
 * PERMANENT PIN — NOT env-gated. Unlike studio-experience-scenarios.spec.ts
 * (which is a manual STUDIO_AUDIT=1 audit helper), this spec always runs.
 *
 * Drives the full RepeatedActionChartWizard ("Set Up a Progress Chart") from
 * Studio → deploy → asserts real DB rows exist. This exercises a REAL Deploy
 * click against production DB constraints, not just a UI walkthrough — the
 * bug this pin guards against (tasks.source = 'studio' rejected by
 * tasks_source_check, plus tasks.status = 'active' rejected by
 * tasks_status_check) threw silently on every deploy attempt in production
 * with zero DB writes, while a UI-only test would never have caught it.
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

const PREFIX = 'STUDIOAUD'

const sr = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

let FAMILY_ID = ''

async function sweep() {
  const { data: fam } = await sr
    .from('families')
    .select('id')
    .eq('family_login_name_lower', 'testworthfamily')
    .single()
  if (!fam) throw new Error('Testworth family not found')
  FAMILY_ID = fam.id as string

  const { data: tasks } = await sr
    .from('tasks')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  const taskIds = (tasks ?? []).map((t) => t.id as string)

  const { data: widgets } = await sr
    .from('dashboard_widgets')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  const widgetIds = (widgets ?? []).map((w) => w.id as string)

  // Contracts reference the tracked task via source_id (star chart, coloring
  // reveal, and milestone contracts all use sourceId = task.id — see
  // RepeatedActionChartWizard.tsx handleDeploy).
  let contractIds: string[] = []
  if (taskIds.length) {
    const { data: contracts } = await sr.from('contracts').select('id').in('source_id', taskIds)
    contractIds = (contracts ?? []).map((c) => c.id as string)
  }

  if (contractIds.length) {
    await sr.from('contract_grant_log').delete().in('contract_id', contractIds)
    await sr.from('deferred_grants').delete().in('contract_id', contractIds)
    await sr.from('contracts').delete().in('id', contractIds)
  }
  if (taskIds.length) {
    await sr.from('deed_firings').delete().in('source_id', taskIds)
  }
  if (widgetIds.length) {
    await sr.from('widget_data_points').delete().in('widget_id', widgetIds)
    await sr.from('dashboard_widgets').delete().in('id', widgetIds)
  }
  if (taskIds.length) {
    await sr.from('task_rewards').delete().in('task_id', taskIds)
    await sr.from('task_completions').delete().in('task_id', taskIds)
    await sr.from('task_assignments').delete().in('task_id', taskIds)
    await sr.from('routine_step_completions').delete().in('task_id', taskIds)
    await sr.from('tasks').delete().in('id', taskIds)
  }
  await sr.from('wizard_templates').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
}

test.beforeAll(async () => {
  await sweep()
})

test.afterAll(async () => {
  await sweep()
})

test.describe.configure({ timeout: 90_000, retries: 0 })

async function gotoStudio(page: Page) {
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
}

/**
 * Open a Setup Wizards card by its title text. Cards are div.snap-start and
 * hover-expand before their Customize button is clickable, so the first
 * click may only expand the card without opening the dialog — retry once.
 */
async function openSetupWizardCard(page: Page, cardTitle: string) {
  const section = page
    .locator('h2')
    .filter({ hasText: 'Setup Wizards' })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const dialog = page.locator('[role="dialog"]').first()

  for (let attempt = 0; attempt < 2; attempt++) {
    const card = section.locator('div.snap-start').filter({ hasText: cardTitle }).first()
    await card.scrollIntoViewIfNeeded({ timeout: 8000 })
    await card.click({ timeout: 8000 })
    await page.waitForTimeout(400)
    await card
      .getByRole('button', { name: /^customize$/i })
      .click({ force: true, timeout: 8000 })
      .catch(() => {})
    await page.waitForTimeout(1000)
    if ((await dialog.count()) > 0 && (await dialog.isVisible().catch(() => false))) break
  }

  await expect(dialog, `Expected "${cardTitle}" wizard dialog to open from Studio`).toBeVisible({ timeout: 5000 })
  return dialog
}

test('Progress Chart wizard deploys real DB rows (task + widget + contract)', async ({ page }) => {
  const chartName = `${PREFIX} Chart Pin`

  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openSetupWizardCard(page, 'Set Up a Progress Chart')

  // Step 1 — Name It: fill the first visible input, then Next.
  const nameInput = dialog.locator('input').first()
  await expect(nameInput).toBeVisible({ timeout: 5000 })
  await nameInput.fill(chartName)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)

  // Step 2 — Pick Action: defaults to "Task on their dashboard" / task_completion.
  // Leave the action task name blank so it falls back to the chart name
  // (taskTitle = actionTaskName || chartName), which keeps the STUDIOAUD
  // prefix on the created task title.
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)

  // Step 3 — Chart Display: Star Chart is on by default (canAdvance requires
  // showStarChart || showColoringReveal, true out of the box).
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)

  // Step 4 — Milestones & Rewards: optional, skip.
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)

  // Step 5 — Assign: pick Casey.
  const caseyPill = dialog.getByRole('button', { name: 'Casey' }).first()
  await expect(caseyPill, 'Expected a Casey pill on the Assign step').toBeVisible({ timeout: 5000 })
  await caseyPill.click({ force: true })
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)

  // Step 6 — Review & Deploy.
  const deployBtn = dialog.getByRole('button', { name: /^deploy$/i }).first()
  await expect(deployBtn).toBeVisible({ timeout: 5000 })
  await deployBtn.click({ force: true })

  // Give the deploy sequence (task insert → widget insert → contract insert
  // → wizard_templates insert) time to complete its DB round trips.
  await page.waitForTimeout(4000)

  // The wizard must reach its success screen (deployed === true → clearDraft()
  // + setDeployed(true) both ran). This is the F-23 regression pin: the
  // wizard_templates insert previously used non-existent columns
  // (created_by, wizard_type) and threw AFTER the task/widget/contract writes
  // succeeded, so `deployed` was silently never set — mom never saw this
  // screen even though the deploy had actually worked underneath her.
  await expect(
    dialog.getByRole('heading', { name: /chart deployed!/i }),
    'Expected the wizard to reach its success screen after Deploy',
  ).toBeVisible({ timeout: 5000 })

  // ─── DB truth ───────────────────────────────────────────────────────────
  const { data: task, error: taskErr } = await sr
    .from('tasks')
    .select('id, status, source, title, assignee_id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
    .maybeSingle()

  expect(taskErr, 'Unexpected error querying tasks').toBeNull()
  expect(task, 'Expected the Progress Chart wizard to create a tasks row').not.toBeNull()
  expect(task?.status).toBe('pending')
  expect(task?.source).toBe('studio')

  const { data: widget, error: widgetErr } = await sr
    .from('dashboard_widgets')
    .select('id, template_type, visual_variant, family_member_id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
    .maybeSingle()

  expect(widgetErr, 'Unexpected error querying dashboard_widgets').toBeNull()
  expect(widget, 'Expected the Progress Chart wizard to create a dashboard_widgets row (star chart)').not.toBeNull()

  const { data: contracts, error: contractErr } = await sr
    .from('contracts')
    .select('id, godmother_type, source_type, source_id')
    .eq('source_id', task!.id as string)

  expect(contractErr, 'Unexpected error querying contracts').toBeNull()
  expect(
    (contracts ?? []).length,
    'Expected at least one contracts row wired to the tracked task',
  ).toBeGreaterThan(0)

  const { data: wizardTemplate, error: wizardTemplateErr } = await sr
    .from('wizard_templates')
    .select('id, family_id, template_type, title, template_source, original_author_id')
    .eq('family_id', FAMILY_ID)
    .eq('template_type', 'repeated_action_chart')
    .ilike('title', `${PREFIX}%`)
    .maybeSingle()

  expect(wizardTemplateErr, 'Unexpected error querying wizard_templates').toBeNull()
  expect(
    wizardTemplate,
    'Expected the Progress Chart wizard to save a wizard_templates provenance row',
  ).not.toBeNull()
  expect(wizardTemplate?.template_source).toBe('family')
})
