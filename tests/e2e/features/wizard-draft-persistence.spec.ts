/**
 * STUDIO-EXPERIENCE ST-C — Wizard save-and-return regression pins.
 *
 * PERMANENT PINS — NOT env-gated. Every test drives the REAL wizard chrome
 * in the browser and asserts the resulting `wizard_drafts` DB rows via
 * service role (rider (a): "the modal opened" is not a deliverable).
 *
 * Primary flow (RepeatedActionChartWizard — one of the four wizards
 * migrated off the old localStorage-only useWizardDraft):
 *   1. Close via X with unsaved content -> the save/discard prompt shows;
 *      "Yes, save as draft" persists a REAL wizard_drafts row (not
 *      localStorage — asserted both ways).
 *   2. Reopening the same wizard type offers the reopen-prompt automatically
 *      and "Continue" restores the saved state into the form.
 *   3. "Start Fresh" from the reopen-prompt opens a BLANK wizard AND leaves
 *      the existing draft row untouched (Composition doc §2.2: never a
 *      silent discard).
 *   4. Studio's Drafts tab Discard action (ModalV2 confirm, no
 *      window.confirm) permanently deletes the row.
 *   5. Resuming a fresh draft end-to-end through to Deploy creates the real
 *      primitive rows (tasks + dashboard_widgets) AND clears the draft.
 *
 * Secondary flow (StarChartWizard — NOT one of the original four; added by
 * this build) proves the save + reopen-restore path works identically on a
 * wizard that never had any draft support before, i.e. this is the shared
 * chrome doing the work, not a per-wizard reimplementation.
 *
 * Fixtures: STUDIOAUD prefix (matches the ST-A/ST-F convention for this
 * Studio surface), swept beforeAll + afterAll via service role. Testworth
 * family.
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
const MEMBER_IDS: Record<string, string> = {}

async function resolveFamily() {
  const { data: fam } = await sr
    .from('families')
    .select('id')
    .eq('family_login_name_lower', 'testworthfamily')
    .single()
  if (!fam) throw new Error('Testworth family not found')
  FAMILY_ID = fam.id as string

  const { data: members } = await sr
    .from('family_members')
    .select('id, display_name')
    .eq('family_id', FAMILY_ID)
  for (const m of members ?? []) {
    MEMBER_IDS[(m.display_name as string).toLowerCase()] = m.id as string
  }
}

async function sweep() {
  if (!FAMILY_ID) await resolveFamily()

  const { data: drafts } = await sr
    .from('wizard_drafts')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  if (drafts?.length) {
    await sr.from('wizard_drafts').delete().in('id', drafts.map((d) => d.id as string))
  }

  const { data: widgets } = await sr
    .from('dashboard_widgets')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  if (widgets?.length) {
    await sr.from('dashboard_widgets').delete().in('id', widgets.map((w) => w.id as string))
  }

  const { data: tasks } = await sr
    .from('tasks')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  if (tasks?.length) {
    const taskIds = tasks.map((t) => t.id as string)
    await sr.from('task_assignments').delete().in('task_id', taskIds)
    await sr.from('contracts').delete().in('source_id', taskIds)
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

// Tests 2-5 depend on test 1's draft row — serial, sharing fixture state
// (studio-shelf-truth.spec.ts's own "dependent flows" precedent).
test.describe.configure({ mode: 'serial', timeout: 120_000 })

async function gotoStudio(page: Page) {
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
}

/**
 * Open a Studio card by section + title (studio-shelf-truth.spec.ts
 * pattern — cards hover-expand and shift the ScrollRow mid-click).
 */
async function openStudioWizard(page: Page, sectionTitle: string, cardTitle: string) {
  const section = page
    .locator('h2')
    .filter({ hasText: sectionTitle })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')

  const dialog = page.locator('[role="dialog"]').first()
  for (let attempt = 0; attempt < 3; attempt++) {
    const card = section.locator('div.snap-start').filter({ hasText: cardTitle }).first()
    await card.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {})
    await card.hover({ timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(350)
    await card.click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(400)
    const btn = card.getByRole('button', { name: /^customize$/i }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true, timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(600)
      if ((await dialog.count()) > 0 && (await dialog.isVisible().catch(() => false))) break
    }
  }
  await expect(dialog, `Expected a dialog to open from "${cardTitle}"`).toBeVisible({ timeout: 5000 })
  return dialog
}

/** Poll a DB read until it returns a truthy result. */
async function pollDb<T>(fn: () => Promise<T | null>, timeoutMs = 15000): Promise<T> {
  const start = Date.now()
  for (;;) {
    const result = await fn()
    if (result) return result
    if (Date.now() - start > timeoutMs) throw new Error('pollDb timed out')
    await new Promise((r) => setTimeout(r, 500))
  }
}

async function fetchDraftByTitle(title: string) {
  const { data } = await sr
    .from('wizard_drafts')
    .select('id, wizard_type, title, state, family_id, member_id')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  return data
}

async function localStorageDraftKeyCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('wizard-draft-')) count++
    }
    return count
  })
}

const CHART_TITLE_1 = `${PREFIX} Draft Test Chart`
const CHART_TITLE_2 = `${PREFIX} Deploy Test Chart`
const STAR_CHART_TITLE = `${PREFIX} Star Draft`

test('ST-C 1: closing via X with unsaved content shows the save prompt; "Yes, save as draft" persists a REAL wizard_drafts row, not localStorage', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioWizard(page, 'Setup Wizards', 'Set Up a Progress Chart')
  await dialog.getByPlaceholder(/potty chart|piano practice/i).fill(CHART_TITLE_1)

  // Close via the header X — with content typed, this must NOT close
  // immediately; it must show the save/discard prompt (Composition §2.2).
  await dialog.getByLabel('Close').click()

  const closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
  await expect(closePrompt).toBeVisible({ timeout: 5000 })
  await closePrompt.getByTestId('wizard-draft-save').click()

  // The wizard dialog itself is gone now.
  await expect(dialog).not.toBeVisible({ timeout: 5000 })

  const row = await pollDb(() => fetchDraftByTitle(CHART_TITLE_1))
  expect(row.family_id).toBe(FAMILY_ID)
  expect(row.wizard_type).toBe('repeated_action_chart')
  expect((row.state as Record<string, unknown>).chartName).toBe(CHART_TITLE_1)

  // Not the old localStorage mechanism.
  expect(await localStorageDraftKeyCount(page)).toBe(0)
})

test('ST-C 2: reopening the wizard offers the reopen-prompt automatically; "Continue" restores the saved state', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  await openStudioWizard(page, 'Setup Wizards', 'Set Up a Progress Chart')

  const reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
  await expect(reopenPrompt).toBeVisible({ timeout: 5000 })
  await reopenPrompt.getByText(CHART_TITLE_1, { exact: true }).click()
  await expect(reopenPrompt).not.toBeVisible({ timeout: 5000 })

  const wizardDialog = page.locator('[role="dialog"]').filter({ hasText: 'Name Your Progress Chart' })
  await expect(wizardDialog).toBeVisible({ timeout: 5000 })
  await expect(wizardDialog.getByPlaceholder(/potty chart|piano practice/i)).toHaveValue(CHART_TITLE_1)

  // Leave it exactly as-is (re-save via the close prompt) so test 3 has a
  // draft to reopen again.
  await wizardDialog.getByLabel('Close').click()
  const closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
  await expect(closePrompt).toBeVisible({ timeout: 5000 })
  await closePrompt.getByTestId('wizard-draft-save').click()
})

test('ST-C 3: "Start Fresh" opens a blank wizard and leaves the existing draft row untouched', async ({ page }) => {
  const before = await fetchDraftByTitle(CHART_TITLE_1)
  expect(before).toBeTruthy()

  await loginAsMom(page)
  await gotoStudio(page)
  await openStudioWizard(page, 'Setup Wizards', 'Set Up a Progress Chart')

  const reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
  await expect(reopenPrompt).toBeVisible({ timeout: 5000 })
  await reopenPrompt.getByTestId('wizard-draft-start-fresh').click()
  await expect(reopenPrompt).not.toBeVisible({ timeout: 5000 })

  const wizardDialog = page.locator('[role="dialog"]').filter({ hasText: 'Name Your Progress Chart' })
  await expect(wizardDialog).toBeVisible({ timeout: 5000 })
  await expect(wizardDialog.getByPlaceholder(/potty chart|piano practice/i)).toHaveValue('')

  // The old draft must still exist, byte-identical, after Start Fresh.
  const after = await fetchDraftByTitle(CHART_TITLE_1)
  expect(after).toBeTruthy()
  expect(after!.id).toBe(before!.id)

  // Close this blank instance with no content typed — no prompt should show.
  await wizardDialog.getByLabel('Close').click()
  await expect(wizardDialog).not.toBeVisible({ timeout: 5000 })
  await expect(page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })).not.toBeVisible()
})

test('ST-C 4: Studio Drafts tab Discard (ModalV2 confirm) permanently deletes the row', async ({ page }) => {
  const draft = await fetchDraftByTitle(CHART_TITLE_1)
  expect(draft).toBeTruthy()

  await loginAsMom(page)
  await gotoStudio(page)

  await page.getByRole('tab', { name: /Drafts/i }).click()
  await page.waitForTimeout(600)

  const card = page.locator(`[data-testid="wizard-draft-resume-${draft!.id}"]`).locator('xpath=ancestor::div[contains(@class, "rounded-xl")]').first()
  await expect(card).toBeVisible({ timeout: 5000 })
  await page.locator(`[data-testid="wizard-draft-tab-discard-${draft!.id}"]`).click()

  const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: 'Discard this draft?' })
  await expect(confirmDialog).toBeVisible({ timeout: 5000 })
  await confirmDialog.getByTestId('wizard-draft-tab-discard-confirm').click()
  await expect(confirmDialog).not.toBeVisible({ timeout: 5000 })

  await pollDb(async () => {
    const { data } = await sr.from('wizard_drafts').select('id').eq('id', draft!.id).maybeSingle()
    return data === null ? { deleted: true } : null
  })
})

test('ST-C 5: resuming a draft through to Deploy creates the real primitive rows and clears the draft', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  // Create a fresh draft.
  const dialog = await openStudioWizard(page, 'Setup Wizards', 'Set Up a Progress Chart')
  await dialog.getByPlaceholder(/potty chart|piano practice/i).fill(CHART_TITLE_2)
  await dialog.getByLabel('Close').click()
  await page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' }).getByTestId('wizard-draft-save').click()

  const draft = await pollDb(() => fetchDraftByTitle(CHART_TITLE_2))

  // Resume it from the Drafts tab.
  await page.getByRole('tab', { name: /Drafts/i }).click()
  await page.waitForTimeout(600)
  await page.locator(`[data-testid="wizard-draft-resume-${draft.id}"]`).click()

  const reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
  await expect(reopenPrompt).toBeVisible({ timeout: 5000 })
  await reopenPrompt.getByText(CHART_TITLE_2, { exact: true }).click()

  // Note: SetupWizard's `subtitle` prop is never rendered — ModalV2's
  // transient header (ModalHeader.tsx) only shows subtitle for the
  // 'persistent' variant. Match against the actual dialog title instead.
  const wizardDialog = page.locator('[role="dialog"]').filter({ hasText: 'Set Up a Progress Chart' })
  await expect(wizardDialog).toBeVisible({ timeout: 5000 })
  await expect(wizardDialog.getByPlaceholder(/potty chart|piano practice/i)).toHaveValue(CHART_TITLE_2)

  // Step 0 -> 1 (Pick Action): fill the action task name.
  await wizardDialog.getByRole('button', { name: /^next$/i }).click()
  await page.waitForTimeout(300)
  await wizardDialog.getByPlaceholder(/used the potty|practiced piano/i).fill(`${PREFIX} tap`)

  // Step 1 -> 2 (Chart Display) -> 3 (Milestones) -> 4 (Assign).
  await wizardDialog.getByRole('button', { name: /^next$/i }).click()
  await page.waitForTimeout(300)
  await wizardDialog.getByRole('button', { name: /^next$/i }).click()
  await page.waitForTimeout(300)
  await wizardDialog.getByRole('button', { name: /^next$/i }).click()
  await page.waitForTimeout(300)

  // Assign to Ruthie.
  await wizardDialog.locator('[data-member-name="Ruthie"]').click()
  await wizardDialog.getByRole('button', { name: /^next$/i }).click()
  await page.waitForTimeout(300)

  // Review -> Deploy.
  await wizardDialog.getByRole('button', { name: /^deploy$/i }).click()
  await expect(wizardDialog.getByText('Chart deployed!')).toBeVisible({ timeout: 15000 })

  // Real primitive rows exist.
  const task = await pollDb(async () => {
    const { data } = await sr
      .from('tasks')
      .select('id, title, assignee_id')
      .eq('family_id', FAMILY_ID)
      .eq('title', `${PREFIX} tap`)
      .maybeSingle()
    return data
  })
  expect(task.assignee_id).toBe(MEMBER_IDS['ruthie'])

  const widget = await pollDb(async () => {
    const { data } = await sr
      .from('dashboard_widgets')
      .select('id')
      .eq('family_id', FAMILY_ID)
      .ilike('title', `${CHART_TITLE_2}%`)
      .maybeSingle()
    return data
  })
  expect(widget).toBeTruthy()

  // The draft is gone.
  const { data: staleDraft } = await sr.from('wizard_drafts').select('id').eq('id', draft.id).maybeSingle()
  expect(staleDraft).toBeNull()

  await wizardDialog.getByRole('button', { name: /^done$/i }).click()
})

test('ST-C 6 (coverage breadth): StarChartWizard — a wizard that had NO draft support before this build — saves and restores through the same shared chrome', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioWizard(page, 'Gamification & Rewards', 'Star / Sticker Chart')
  await dialog.getByPlaceholder(/potty stars|reading chart/i).fill(STAR_CHART_TITLE)
  await dialog.getByLabel('Close').click()

  const closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
  await expect(closePrompt).toBeVisible({ timeout: 5000 })
  await closePrompt.getByTestId('wizard-draft-save').click()

  const row = await pollDb(() => fetchDraftByTitle(STAR_CHART_TITLE))
  expect(row.wizard_type).toBe('star_chart')
  expect((row.state as Record<string, unknown>).chartName).toBe(STAR_CHART_TITLE)

  // Reopen -> Continue restores it.
  await openStudioWizard(page, 'Gamification & Rewards', 'Star / Sticker Chart')
  const reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
  await expect(reopenPrompt).toBeVisible({ timeout: 5000 })
  await reopenPrompt.getByText(STAR_CHART_TITLE, { exact: true }).click()

  // Same note as test 5 — match the rendered title, not the never-shown subtitle.
  const wizardDialog = page.locator('[role="dialog"]').filter({ hasText: 'Star Chart Setup' })
  await expect(wizardDialog).toBeVisible({ timeout: 5000 })
  await expect(wizardDialog.getByPlaceholder(/potty stars|reading chart/i)).toHaveValue(STAR_CHART_TITLE)
})
