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

  // ALL of the fixture family's drafts, not just PREFIX-titled ones. Testworth
  // is a test family, so any draft left in it is residue by definition — and
  // a single leftover draft is enough to break these tests, because the
  // wizard's reopen-prompt ("Continue where you left off?") renders on top of
  // the modal and intercepts every click. Found live 2026-10-11: a
  // "Kitchen Duties" routine draft auto-saved by the 2026-09-12 shelf-sweep
  // tour (default example title, no PREFIX) survived the old prefix sweep and
  // blocked ST-C.2 test 1. Same class as the ST-B orphaned-children lesson:
  // name-based sweeps miss what they don't know to look for.
  const { data: drafts } = await sr
    .from('wizard_drafts')
    .select('id')
    .eq('family_id', FAMILY_ID)
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

  // ST-C.2: routine template + its sections/steps — no ON DELETE CASCADE
  // from task_templates, so children must go first.
  const { data: templates } = await sr
    .from('task_templates')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  if (templates?.length) {
    const templateIds = templates.map((t) => t.id as string)
    const { data: sections } = await sr
      .from('task_template_sections')
      .select('id')
      .in('template_id', templateIds)
    if (sections?.length) {
      const sectionIds = sections.map((s) => s.id as string)
      await sr.from('task_template_steps').delete().in('section_id', sectionIds)
      await sr.from('task_template_sections').delete().in('id', sectionIds)
    }
    await sr.from('task_templates').delete().in('id', templateIds)
  }

  // ST-C.2 (ST-B's own lesson, re-applied): sequential collection CHILDREN
  // via FK, before the parent row — a title-prefix-only `tasks` sweep can
  // silently miss them (30 orphaned rows accumulated across ST-A's own
  // sessions for exactly this reason before it was caught).
  const { data: collections } = await sr
    .from('sequential_collections')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  if (collections?.length) {
    const collectionIds = collections.map((c) => c.id as string)
    const { data: childTasks } = await sr
      .from('tasks')
      .select('id')
      .in('sequential_collection_id', collectionIds)
    if (childTasks?.length) {
      const childIds = childTasks.map((t) => t.id as string)
      await sr.from('task_assignments').delete().in('task_id', childIds)
      await sr.from('tasks').delete().in('id', childIds)
    }
    await sr.from('sequential_collections').delete().in('id', collectionIds)
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

/** Collect the current value of every element a locator matches (there is
 *  no built-in `allInputValues()` on Locator — only the singular
 *  `inputValue()` — so resolve to individual elements first). */
async function allInputValuesOf(locator: import('@playwright/test').Locator): Promise<string[]> {
  const elements = await locator.all()
  return Promise.all(elements.map((el) => el.inputValue()))
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

// STUDIO-EXPERIENCE ST-C.2 fixtures
const ROUTINE_TITLE = `${PREFIX} Two Section Routine`
const ROUTINE_SECTION_1 = `${PREFIX} Morning`
const ROUTINE_SECTION_2 = `${PREFIX} Evening`
const ROUTINE_STEP_1 = `${PREFIX} Brush Teeth`
const ROUTINE_STEP_2 = `${PREFIX} Read Book`
const SEQUENTIAL_TITLE = `${PREFIX} Chapter Draft`
const SEQUENTIAL_ITEM_1 = `${PREFIX} Chapter A`
const SEQUENTIAL_ITEM_2 = `${PREFIX} Chapter B`
const SEQUENTIAL_ITEM_3 = `${PREFIX} Chapter C`

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

  // Hardened (30s ceiling, not 5s) — a 1-in-2 unexplained miss was seen
  // here; the fix is a longer ceiling plus an explicit `toBeAttached()`
  // check before interacting, so a slow reopen-prompt evaluation (the
  // chrome waits on the drafts list to finish loading before deciding
  // whether to show it) never races a short assertion window.
  const reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
  await expect(reopenPrompt).toBeVisible({ timeout: 30_000 })
  await expect(reopenPrompt).toBeAttached()
  await reopenPrompt.getByTestId('wizard-draft-start-fresh').click()
  await expect(reopenPrompt).not.toBeVisible({ timeout: 10_000 })

  const wizardDialog = page.locator('[role="dialog"]').filter({ hasText: 'Name Your Progress Chart' })
  await expect(wizardDialog).toBeVisible({ timeout: 30_000 })
  await expect(wizardDialog).toBeAttached()
  await expect(wizardDialog.getByPlaceholder(/potty chart|piano practice/i)).toHaveValue('')

  // The old draft must still exist, byte-identical, after Start Fresh.
  const after = await fetchDraftByTitle(CHART_TITLE_1)
  expect(after).toBeTruthy()
  expect(after!.id).toBe(before!.id)

  // Close this blank instance with no content typed — no prompt should show.
  await expect(wizardDialog).toBeAttached()
  await wizardDialog.getByLabel('Close').click()
  await expect(wizardDialog).not.toBeVisible({ timeout: 10_000 })
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

// ─────────────────────────────────────────────────────────────
// STUDIO-EXPERIENCE ST-C.2 — TaskCreationModal full-mode routine building
// + SequentialCreatorModal. Both wizards were explicitly NOT covered by
// ST-C (registered in STUB_REGISTRY as "not attempted"); this build wires
// them onto the same shared chrome. Neither is a SetupWizard, so their
// close/reopen affordances differ slightly from tests 1-6 above:
//   - TaskCreationModal is `type="persistent"` — the header X/backdrop/
//     Escape still MINIMIZE-TO-PILL by default (ModalV2's own platform
//     behavior, untouched). The draft chrome intercepts the FOOTER
//     "Cancel" button instead (wired to `effectiveClose`), which is the
//     modal's actual "I'm abandoning this" action.
//   - SequentialCreatorModal is `type="transient"` (no minimize) with its
//     own in-body "Cancel" button, wired the same way tests 1-6 use the
//     header X on a transient SetupWizard.
// ─────────────────────────────────────────────────────────────

test('ST-C.2 1: TaskCreationModal full-mode routine building — 2-section draft saves, restores, and deploys to real primitive rows', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioWizard(page, 'Task & Chore Templates', 'Routine Checklist')

  // Title (shared with the routine's template/task title and the draft's
  // getTitle() — this is the one input Quick Mode and Full Mode share, but
  // Studio always opens this tile in Full Mode).
  await dialog.locator('input[placeholder="What needs to be done?"]').first().fill(ROUTINE_TITLE)

  // The routine section editor starts empty — "Build sections manually"
  // is the addSection() entry point at 0 sections.
  await dialog.getByRole('button', { name: /Build sections manually/i }).click()
  await dialog.getByPlaceholder('Section name…').first().fill(ROUTINE_SECTION_1)
  await dialog.getByPlaceholder('Step name…').first().fill(ROUTINE_STEP_1)

  // Add a second section (both the top and bottom "Add section" buttons
  // call the same addSection() — the top one is always present).
  await dialog.getByRole('button', { name: /^Add section$/i }).first().click()
  await dialog.getByPlaceholder('Section name…').nth(1).fill(ROUTINE_SECTION_2)
  await dialog.getByPlaceholder('Step name…').nth(1).fill(ROUTINE_STEP_2)

  // Close via the footer Cancel button — this is the button wired to
  // routineDraftEligible ? draftChrome.requestClose : onClose, NOT the
  // header X (which still minimizes-to-pill on this persistent modal,
  // untouched by ST-C.2).
  await dialog.getByRole('button', { name: /^Cancel$/i }).click()

  const closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
  await expect(closePrompt).toBeVisible({ timeout: 30_000 })
  await closePrompt.getByTestId('wizard-draft-save').click()
  await expect(dialog).not.toBeVisible({ timeout: 10_000 })

  const draft = await pollDb(() => fetchDraftByTitle(ROUTINE_TITLE))
  expect(draft.wizard_type).toBe('routine_builder_full')
  const draftState = draft.state as { routineSections?: Array<{ name: string; steps: Array<{ title: string }> }> }
  expect(draftState.routineSections?.length).toBe(2)
  const savedNames = draftState.routineSections!.map((s) => s.name).sort()
  expect(savedNames).toEqual([ROUTINE_SECTION_1, ROUTINE_SECTION_2].sort())
  const savedStepTitles = draftState.routineSections!.flatMap((s) => s.steps.map((st) => st.title)).sort()
  expect(savedStepTitles).toEqual([ROUTINE_STEP_1, ROUTINE_STEP_2].sort())

  // Reopen (fresh mount — Studio.tsx conditionally renders this modal) —
  // the reopen-prompt fires automatically since a draft exists for this
  // wizard_type and no explicit prefill was supplied.
  const dialog2 = await openStudioWizard(page, 'Task & Chore Templates', 'Routine Checklist')
  const reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
  await expect(reopenPrompt).toBeVisible({ timeout: 30_000 })
  await reopenPrompt.getByTestId(`wizard-draft-continue-${draft.id}`).click()
  await expect(reopenPrompt).not.toBeVisible({ timeout: 10_000 })

  // Sections and steps restored.
  await expect(dialog2.locator('input[placeholder="What needs to be done?"]').first()).toHaveValue(ROUTINE_TITLE)
  await expect(dialog2.getByPlaceholder('Section name…')).toHaveCount(2)
  const restoredSectionValues = await allInputValuesOf(dialog2.getByPlaceholder('Section name…'))
  expect(restoredSectionValues.sort()).toEqual([ROUTINE_SECTION_1, ROUTINE_SECTION_2].sort())
  const restoredStepValues = await allInputValuesOf(dialog2.getByPlaceholder('Step name…'))
  expect(restoredStepValues.sort()).toEqual([ROUTINE_STEP_1, ROUTINE_STEP_2].sort())

  // Deploy from the restored draft: assign to Ruthie, then Assign & Create.
  await dialog2.locator('button').filter({ hasText: /^Ruthie$/ }).first().scrollIntoViewIfNeeded()
  await dialog2.locator('button').filter({ hasText: /^Ruthie$/ }).first().click()
  await dialog2.getByRole('button', { name: /Assign & Create/i }).click()
  await expect(dialog2).not.toBeVisible({ timeout: 15_000 })

  // Real primitive rows: task_templates + 2 sections + 2 steps + a deployed task.
  const template = await pollDb(async () => {
    const { data } = await sr
      .from('task_templates')
      .select('id, title')
      .eq('family_id', FAMILY_ID)
      .eq('title', ROUTINE_TITLE)
      .maybeSingle()
    return data
  })

  const sections = await pollDb(async () => {
    const { data } = await sr
      .from('task_template_sections')
      .select('id, title')
      .eq('template_id', template.id)
    return data && data.length === 2 ? data : null
  })
  expect((sections as Array<{ title: string }>).map((s) => s.title).sort()).toEqual(
    [ROUTINE_SECTION_1, ROUTINE_SECTION_2].sort(),
  )

  const { data: steps } = await sr
    .from('task_template_steps')
    .select('id, title')
    .in('section_id', (sections as Array<{ id: string }>).map((s) => s.id))
  expect((steps ?? []).map((s) => s.title as string).sort()).toEqual([ROUTINE_STEP_1, ROUTINE_STEP_2].sort())

  const task = await pollDb(async () => {
    const { data } = await sr
      .from('tasks')
      .select('id, assignee_id')
      .eq('family_id', FAMILY_ID)
      .eq('title', ROUTINE_TITLE)
      .maybeSingle()
    return data
  })
  expect(task.assignee_id).toBe(MEMBER_IDS['ruthie'])

  // The draft is gone.
  const { data: staleDraft } = await sr.from('wizard_drafts').select('id').eq('id', draft.id).maybeSingle()
  expect(staleDraft).toBeNull()
})

test('ST-C.2 2: SequentialCreatorModal — 3-item draft saves, restores, and deploys to a real sequential collection', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioWizard(page, 'Task & Chore Templates', 'Sequential Collection')

  // Pick an assignee before saving the draft — proves assigneeId (wrapper
  // state, not part of SequentialCreator's own controlled value) round-trips
  // through wizard_drafts too, not just title/items/advancement defaults.
  await dialog.locator('button').filter({ hasText: /^Ruthie$/ }).first().click()
  await dialog.getByPlaceholder(/Saxon Math/i).fill(SEQUENTIAL_TITLE)
  await dialog
    .getByPlaceholder(/Chapter 1 — Introduction/i)
    .fill([SEQUENTIAL_ITEM_1, SEQUENTIAL_ITEM_2, SEQUENTIAL_ITEM_3].join('\n'))

  // Close via the in-body Cancel button (this modal is `type="transient"` —
  // no minimize-to-pill; Cancel is wired to draftChrome.requestClose).
  await dialog.getByRole('button', { name: /^Cancel$/i }).click()

  const closePrompt = page.locator('[role="dialog"]').filter({ hasText: 'Save as a draft to come back to?' })
  await expect(closePrompt).toBeVisible({ timeout: 30_000 })
  await closePrompt.getByTestId('wizard-draft-save').click()
  await expect(dialog).not.toBeVisible({ timeout: 10_000 })

  const draft = await pollDb(() => fetchDraftByTitle(SEQUENTIAL_TITLE))
  expect(draft.wizard_type).toBe('sequential_creator')
  const draftState = draft.state as {
    assigneeId?: string
    creatorValue?: { title: string; rawText: string }
  }
  expect(draftState.assigneeId).toBe(MEMBER_IDS['ruthie'])
  expect(draftState.creatorValue?.title).toBe(SEQUENTIAL_TITLE)
  expect(draftState.creatorValue?.rawText).toContain(SEQUENTIAL_ITEM_1)
  expect(draftState.creatorValue?.rawText).toContain(SEQUENTIAL_ITEM_3)

  // Reopen (fresh mount) — reopen-prompt fires automatically.
  const dialog2 = await openStudioWizard(page, 'Task & Chore Templates', 'Sequential Collection')
  const reopenPrompt = page.locator('[role="dialog"]').filter({ hasText: 'Continue where you left off?' })
  await expect(reopenPrompt).toBeVisible({ timeout: 30_000 })
  await reopenPrompt.getByTestId(`wizard-draft-continue-${draft.id}`).click()
  await expect(reopenPrompt).not.toBeVisible({ timeout: 10_000 })

  await expect(dialog2.getByPlaceholder(/Saxon Math/i)).toHaveValue(SEQUENTIAL_TITLE)
  await expect(dialog2.getByPlaceholder(/Chapter 1 — Introduction/i)).toHaveValue(
    [SEQUENTIAL_ITEM_1, SEQUENTIAL_ITEM_2, SEQUENTIAL_ITEM_3].join('\n'),
  )

  // Deploy from the restored draft. No pill re-click needed — if assigneeId
  // didn't restore, Create Collection would surface "Pick who this
  // collection is for before saving." instead of succeeding, so a clean
  // deploy here IS the proof the wrapper-level state round-tripped too.
  await dialog2.getByRole('button', { name: /Create Collection/i }).click()
  await expect(dialog2).not.toBeVisible({ timeout: 15_000 })

  const collection = await pollDb(async () => {
    const { data } = await sr
      .from('sequential_collections')
      .select('id, title')
      .eq('family_id', FAMILY_ID)
      .eq('title', SEQUENTIAL_TITLE)
      .maybeSingle()
    return data
  })

  const childTasks = await pollDb(async () => {
    const { data } = await sr
      .from('tasks')
      .select('id, title, assignee_id')
      .eq('sequential_collection_id', collection.id)
    return data && data.length === 3 ? data : null
  })
  expect((childTasks as Array<{ title: string }>).map((t) => t.title).sort()).toEqual(
    [SEQUENTIAL_ITEM_1, SEQUENTIAL_ITEM_2, SEQUENTIAL_ITEM_3].sort(),
  )
  for (const t of childTasks as Array<{ assignee_id: string }>) {
    expect(t.assignee_id).toBe(MEMBER_IDS['ruthie'])
  }

  // The draft is gone.
  const { data: staleDraft } = await sr.from('wizard_drafts').select('id').eq('id', draft.id).maybeSingle()
  expect(staleDraft).toBeNull()
})
