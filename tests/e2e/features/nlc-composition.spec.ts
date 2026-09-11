/**
 * STUDIO-EXPERIENCE ST-B — Natural Language Composition v2 regression pins.
 *
 * PERMANENT PINS — driving REAL flows in the browser, asserting real DOM
 * state (input values / DOM attributes, never innerText for prefill claims —
 * per the dispatch's rider (a)). The four Composition doc §2.9 audit probe
 * phrases that STUDIO-EXPERIENCE F-01 documented as broken under the old
 * 6-outcome ai-parse router:
 *
 *   1. "chore board where kids earn money" → list_reveal_assignment_opportunity,
 *      listName prefilled, DEPLOYED and DB-asserted (the dispatch's explicit
 *      "continue to DEPLOY" requirement).
 *   2. "potty chart for Ruthie" → repeated_action_chart, chartName +
 *      actionTaskName inputs prefilled, Ruthie's member pill pre-selected
 *      (data-selected attribute, not innerText).
 *   3. "shared grocery list with my husband" → universal_list (was
 *      previously mis-routed to shared_task_list_wizard), listType=shopping,
 *      Mark (additional_adult/spouse) pre-selected on the Sharing step,
 *      title prefilled on Review.
 *   4. "help me set up a morning routine" → routine_builder (was previously
 *      mis-routed to a Progress Chart), description passthrough is
 *      VERBATIM (guaranteed client-side, not model-dependent — see
 *      NaturalLanguageComposition.tsx's finalizePreFill).
 *
 * Plus the S3 composition gap (routine step "surprise/random" detection →
 * linked_randomizer step, HITM-confirmed on Accept).
 *
 * Fixtures: created row ids are tracked explicitly and deleted in
 * afterEach/afterAll (NLC-extracted titles are model-derived English
 * phrases like "Chore Board" — not a stable PREFIX — so cleanup targets the
 * specific ids each test creates, plus a title-based safety-net sweep).
 * Testworth family.
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

const sr = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

let FAMILY_ID = ''
const MEMBER_IDS: Record<string, string> = {}

// Titles this suite's own tests create — a safety net in case a test fails
// mid-flow before its explicit id-based cleanup runs.
const SAFETY_NET_TITLES = ['Chore Board', 'Grocery List', 'NLCTEST Surprise Chore Randomizer']
const createdListIds: string[] = []
const createdTaskIds: string[] = []

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

async function sweepLists(listIds: string[]) {
  if (listIds.length === 0) return
  const { data: items } = await sr.from('list_items').select('id').in('list_id', listIds)
  const itemIds = (items ?? []).map((i) => i.id as string)
  const { data: tasks } = await sr.from('tasks').select('id')
    .eq('family_id', FAMILY_ID)
    .in('source_reference_id', itemIds.length ? itemIds : ['00000000-0000-0000-0000-000000000000'])
  const taskIds = (tasks ?? []).map((t) => t.id as string)
  if (taskIds.length) {
    await sr.from('task_completions').delete().in('task_id', taskIds)
    await sr.from('task_assignments').delete().in('task_id', taskIds)
    await sr.from('tasks').delete().in('id', taskIds)
  }
  await sr.from('list_shares').delete().in('list_id', listIds)
  await sr.from('list_items').delete().in('list_id', listIds)
  await sr.from('lists').delete().in('id', listIds)
}

async function sweep() {
  if (!FAMILY_ID) await resolveFamily()

  await sweepLists(createdListIds)
  createdListIds.length = 0

  if (createdTaskIds.length) {
    await sr.from('task_completions').delete().in('task_id', createdTaskIds)
    await sr.from('task_assignments').delete().in('task_id', createdTaskIds)
    await sr.from('tasks').delete().in('id', createdTaskIds)
    createdTaskIds.length = 0
  }

  // Safety net: catch anything an id-tracking bug or a failed test left behind.
  const { data: stragglers } = await sr
    .from('lists')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .in('title', SAFETY_NET_TITLES)
  if (stragglers && stragglers.length > 0) {
    await sweepLists(stragglers.map((l) => l.id as string))
  }
}

test.beforeAll(async () => {
  await sweep()
})

test.afterAll(async () => {
  await sweep()
})

// 120s matches studio-shelf-truth.spec.ts: probes 3 and 5 each make TWO real
// AI round-trips (the NLC router, then the wizard's own internal parse).
test.describe.configure({ mode: 'serial', timeout: 120_000 })

async function gotoStudio(page: Page) {
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
}

async function submitNLC(page: Page, text: string) {
  const input = page.getByPlaceholder('Describe what you want to create...')
  await input.fill(text)
  await input.press('Enter')
}

/** High confidence opens the wizard directly; medium shows a confirmation
 *  card first. Handle both so a live model-confidence shift never breaks
 *  the pin on a correct routing decision. */
async function confirmMediumConfidenceIfShown(page: Page) {
  // The router round-trip takes ~5-9s. The original 3s probe could expire
  // BEFORE the response rendered, silently skipping a confirmation card that
  // then blocked the wizard from ever opening (S3 hit exactly this: the card
  // was on screen, unclicked). Race the two REAL outcomes instead — a
  // high-confidence auto-open (dialog) vs a medium-confidence card — so this
  // waits exactly as long as the model actually takes, and no longer.
  const yesButton = page.getByRole('button', { name: 'Yes, open it' })
  const dialog = page.getByRole('dialog')
  await expect(yesButton.or(dialog).first()).toBeVisible({ timeout: 30_000 })
  if (await yesButton.isVisible().catch(() => false)) {
    await yesButton.click()
  }
}

/** Poll a DB read until it returns a truthy result (opportunity-surfaces.spec.ts pattern). */
async function pollDb<T>(fn: () => Promise<T | null>, timeoutMs = 15000): Promise<T> {
  const start = Date.now()
  for (;;) {
    const result = await fn()
    if (result) return result
    if (Date.now() - start > timeoutMs) throw new Error('pollDb timed out')
    await new Promise((r) => setTimeout(r, 500))
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Probe 1 — "chore board where kids earn money" → opportunity board, DEPLOYED
// ─────────────────────────────────────────────────────────────────────────
test('Probe 1: chore board with money routes to the opportunity wizard, prefills the name, and deploys', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  await submitNLC(page, 'I want a chore board where kids earn money for doing extra jobs')
  await confirmMediumConfidenceIfShown(page)

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Extra Earning Opportunities').first()).toBeVisible({ timeout: 15_000 })

  // Input-value assertion, not innerText — the "List name" field on the
  // Items step is a real controlled input, not a display label.
  const listNameInput = dialog.locator('input[placeholder*="Extra Earning Opportunities"]')
  await expect(listNameInput).toHaveValue('Chore Board', { timeout: 5000 })

  // Add one real job so the board is deployable (the phrase named no
  // specific jobs — mom fills those in after the wizard opens correctly).
  await dialog.getByRole('button', { name: 'Add item' }).click()
  await dialog.locator('input[placeholder="Item name"]').first().fill('Wash the car')

  // Advance through sharing/rules/review to Deploy.
  for (let i = 0; i < 3; i++) {
    await dialog.getByRole('button', { name: 'Next' }).click()
    await page.waitForTimeout(300)
  }
  await dialog.getByRole('button', { name: 'Deploy' }).click()

  const row = await pollDb(async () => {
    const { data } = await sr
      .from('lists')
      .select('id, title, is_opportunity')
      .eq('family_id', FAMILY_ID)
      .eq('title', 'Chore Board')
      .maybeSingle()
    return data
  })
  expect(row.is_opportunity).toBe(true)
  createdListIds.push(row.id as string)
})

// ─────────────────────────────────────────────────────────────────────────
// Probe 2 — "potty chart for Ruthie" → repeated_action_chart, memberName resolved
// ─────────────────────────────────────────────────────────────────────────
test('Probe 2: potty chart for Ruthie routes to the progress chart wizard and pre-selects Ruthie', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  await submitNLC(page, 'set up a potty chart for Ruthie')
  await confirmMediumConfidenceIfShown(page)

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Set Up a Progress Chart').first()).toBeVisible({ timeout: 15_000 })

  // Step 0 ("Name It") — chartName input value.
  await expect(dialog.locator('input[value="Potty Chart"]')).toBeVisible({ timeout: 5000 })

  // Step 1 ("Pick Action") — actionTaskName input value.
  await dialog.getByRole('button', { name: 'Next' }).click()
  await expect(dialog.locator('input[value="potty trip"]')).toBeVisible({ timeout: 5000 })

  // STEPS = [name, action, display, milestones, assign, review]; we are on
  // `action` (index 1), so reaching `assign` (index 4) takes THREE clicks —
  // two lands on Milestones and the pill below is legitimately absent.
  for (let i = 0; i < 3; i++) {
    await dialog.getByRole('button', { name: 'Next' }).click()
    await page.waitForTimeout(250)
  }

  // Step 4 ("Assign") — Ruthie's pill carries the real selected-state DOM
  // attribute, not just visible text (rider (a): input/state, not innerText).
  const ruthiePill = dialog.locator(`[data-testid="member-pill-${MEMBER_IDS['ruthie']}"]`)
  await expect(ruthiePill).toBeVisible({ timeout: 5000 })
  await expect(ruthiePill).toHaveAttribute('data-selected', 'true')
})

// ─────────────────────────────────────────────────────────────────────────
// Probe 3 — "shared grocery list with my husband" → universal_list (was
// previously mis-routed to shared_task_list_wizard, F-01)
// ─────────────────────────────────────────────────────────────────────────
test('Probe 3: shared grocery list with husband routes to universal_list with spouse sharing pre-selected', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  await submitNLC(page, 'a shared grocery list with my husband')
  await confirmMediumConfidenceIfShown(page)

  const dialog = page.getByRole('dialog')
  // Fallback title when no named preset matched (NLC sets detectedListType
  // directly, never a preset key) — confirms this landed on UniversalListWizard.
  await expect(dialog.getByText('Create a List').first()).toBeVisible({ timeout: 15_000 })

  // Purpose was auto-completed by the prefill and the wizard opened straight
  // on Items. The Items step is a BULK-PASTE textarea, not a repeat-add list:
  // it binds to `state.rawInput`, and `canAdvance` for this step requires
  // `state.items.length > 0`, which ONLY `parseItems` ("Organize with AI")
  // produces. So drive it the way mom does — paste, organize, then advance.
  await dialog.locator('textarea').fill('Milk\nEggs\nBread')
  await dialog.getByRole('button', { name: 'Organize with AI' }).click()
  await expect(dialog.getByText(/items ready/)).toBeVisible({ timeout: 30_000 })
  await dialog.getByRole('button', { name: 'Next' }).click() // Items -> Sharing

  // Sharing step: sharingMode='specific' + Mark pre-selected. Mark's pill
  // has no data-testid (custom inline component, not the shared
  // MemberPillSelector) — selection is a real computed-style state, not
  // innerText: selected pills render white text on the member's color.
  const markPill = dialog.getByRole('button', { name: 'Mark', exact: true })
  await expect(markPill).toBeVisible({ timeout: 5000 })
  await expect(markPill).toHaveCSS('color', 'rgb(255, 255, 255)')

  // Advance to Review and confirm the title prefill landed as a real input value.
  for (let i = 0; i < 3; i++) {
    await dialog.getByRole('button', { name: 'Next' }).click()
    await page.waitForTimeout(250)
  }
  await expect(dialog.locator('input[value="Grocery List"]')).toBeVisible({ timeout: 5000 })
})

// ─────────────────────────────────────────────────────────────────────────
// Probe 4 — "morning routine" → routine_builder (was previously mis-routed
// to a Progress Chart, F-01), description is VERBATIM
// ─────────────────────────────────────────────────────────────────────────
test('Probe 4: morning routine routes to the routine builder with a verbatim description passthrough', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const phrase = 'help me set up a morning routine'
  await submitNLC(page, phrase)
  await confirmMediumConfidenceIfShown(page)

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Routine Builder').first()).toBeVisible({ timeout: 15_000 })

  // Guaranteed verbatim client-side (finalizePreFill) — assert the EXACT
  // original phrase landed in the textarea, not a model paraphrase.
  const textarea = dialog.locator('textarea')
  await expect(textarea).toHaveValue(phrase, { timeout: 5000 })
})

// ─────────────────────────────────────────────────────────────────────────
// S3 — Composition doc §2.9 linked_randomizer step detection
// ─────────────────────────────────────────────────────────────────────────
test('S3: a "surprise chore" step in a routine description proposes a linked randomizer and creates it on accept', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  // Reach the Routine Builder via NLC (also incidentally re-proves the
  // routing decision) — this test's real target is the wizard's OWN
  // internal AI parse step, not the NLC router.
  await submitNLC(page, 'set up an evening routine')
  await confirmMediumConfidenceIfShown(page)
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Routine Builder').first()).toBeVisible({ timeout: 15_000 })

  const textarea = dialog.locator('textarea')
  await textarea.fill(
    'Every evening: brush teeth, put on pajamas, then do a surprise chore pick from vacuum, dust the shelves, or wipe the counters.',
  )
  await dialog.getByRole('button', { name: 'Next' }).click()

  await expect(dialog.getByText('Surprise pick').first()).toBeVisible({ timeout: 20_000 })

  await dialog.getByRole('button', { name: 'Use This Routine' }).click()

  const row = await pollDb(async () => {
    const { data } = await sr
      .from('lists')
      .select('id, title, list_type')
      .eq('family_id', FAMILY_ID)
      .eq('list_type', 'randomizer')
      .ilike('title', '%surprise%')
      .maybeSingle()
    return data
  })
  expect(row.list_type).toBe('randomizer')
  createdListIds.push(row.id as string)

  // The Accept handoff opens TaskCreationModal with the routine's sections
  // pre-loaded, including the linked step — confirms the full pipeline
  // (parse -> review -> accept -> real list -> handed to task creation),
  // not just the list-creation side effect in isolation. The parsed step
  // title survives verbatim into the routine editor. TaskCreationModal is a
  // NEW dialog (the routine builder closed) — re-query since `dialog` is a
  // live locator that re-resolves at assertion time.
  await expect(dialog.getByText(/brush teeth/i).first()).toBeVisible({ timeout: 10_000 })
})
