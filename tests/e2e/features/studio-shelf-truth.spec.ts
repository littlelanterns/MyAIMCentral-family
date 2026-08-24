/**
 * STUDIO-EXPERIENCE ST-A — Shelf truth regression pins.
 *
 * PERMANENT PINS — NOT env-gated. Every test drives a REAL creation flow in
 * the browser and asserts the created DB rows via service role (rider (a):
 * "the modal opened" is not a deliverable). One pin per ST-A item:
 *
 *   F-03  Duplicate deep-copies non-routine templates (was: 23502 silently)
 *   F-04a Extra House Jobs Board example loads its 10 promised items + deploys
 *   rider(b) kids-boards leak probe: picked kid sees it; sibling + Special
 *         Adult do NOT (Opportunities-tab layer + eligible_members)
 *   F-05  Opportunity Board blank tile opens BOARD creation, deploys a list
 *   F-04b Curriculum Chapter Sequence loads 5 chapters + deploys
 *   F-04c SODAS Sibling Conflict pre-fills the Situation + assigns
 *   F-04d TSG Extra Jobs Randomizer hydrates 13 items (migration 100317)
 *   F-06  Best Intentions Starter is a real wizard creating real rows
 *   F-13  Use-as-is: spinner deploys straight from Review; routines open
 *         the Deploy modal (not the editor)
 *   F-16  RewardsListWizard carries the shared BulkAddWithAI + deploys
 *   F-20  MeetingSetupWizard keeps kid steps for a NULL-relationship kid
 *   F-22  UniversalListWizard: preset items + quantities honored, sharing
 *         guarded, visible auto-suggested name, real shares
 *   F-23  wizard_templates rows land with the CORRECT shape + success screens
 *   Spinner tile lands on a real spinner config and deploys it
 *
 * Fixtures: STUDIOAUD prefix (+ the exact seed titles the Use-as-is flows
 * deploy under), swept beforeAll + afterAll via service role. Testworth family.
 */
import { test, expect, type Page, type Locator } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { loginAsMom, loginAsAlex, loginAsCasey, loginAsGrandma } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

const PREFIX = 'STUDIOAUD'
// Titles the Use-as-is flows deploy under (prefilled example names — the
// review-step fast path has no rename surface). Swept exactly, Testworth-only.
const SEED_TITLES = ['Consequences', 'SODAS Sibling Conflict']

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

  // ── tasks (wizard deploys, guided-form assignments, sequential children) ──
  const { data: tasks } = await sr
    .from('tasks')
    .select('id, title')
    .eq('family_id', FAMILY_ID)
    .or(`title.ilike.${PREFIX}%,title.in.("${SEED_TITLES.join('","')}")`)
  const taskIds = (tasks ?? []).map((t) => t.id as string)

  // ── lists (boards, spinners, shared to-dos, universal-list deploys) ──
  const { data: lists } = await sr
    .from('lists')
    .select('id, title')
    .eq('family_id', FAMILY_ID)
    .or(`title.ilike.${PREFIX}%,title.in.("${SEED_TITLES.join('","')}")`)
  const listIds = (lists ?? []).map((l) => l.id as string)

  // ── contracts referencing either ──
  const sourceIds = [...taskIds, ...listIds]
  if (sourceIds.length) {
    const { data: contracts } = await sr.from('contracts').select('id').in('source_id', sourceIds)
    const contractIds = (contracts ?? []).map((c) => c.id as string)
    if (contractIds.length) {
      await sr.from('contract_grant_log').delete().in('contract_id', contractIds)
      await sr.from('deferred_grants').delete().in('contract_id', contractIds)
      await sr.from('contracts').delete().in('id', contractIds)
    }
    await sr.from('deed_firings').delete().in('source_id', sourceIds)
  }

  if (listIds.length) {
    await sr.from('activity_log_entries').delete().in('source_reference_id', listIds)
    await sr.from('randomizer_draws').delete().in('list_id', listIds)
    await sr.from('list_shares').delete().in('list_id', listIds)
    await sr.from('list_items').delete().in('list_id', listIds)
    await sr.from('lists').delete().in('id', listIds)
  }

  if (taskIds.length) {
    await sr.from('guided_form_responses').delete().in('task_id', taskIds)
    await sr.from('task_rewards').delete().in('task_id', taskIds)
    await sr.from('task_completions').delete().in('task_id', taskIds)
    await sr.from('task_assignments').delete().in('task_id', taskIds)
    await sr.from('routine_step_completions').delete().in('task_id', taskIds)
    await sr.from('tasks').delete().in('id', taskIds)
  }

  // ── sequential collections ──
  await sr.from('sequential_collections').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)

  // ── best intentions created by the starter wizard ──
  await sr.from('best_intentions').delete().eq('family_id', FAMILY_ID).eq('source', 'studio_wizard')

  // ── widgets (spinner tile deploy) ──
  const { data: widgets } = await sr
    .from('dashboard_widgets')
    .select('id')
    .eq('family_id', FAMILY_ID)
    .ilike('title', `${PREFIX}%`)
  const widgetIds = (widgets ?? []).map((w) => w.id as string)
  if (widgetIds.length) {
    await sr.from('widget_data_points').delete().in('widget_id', widgetIds)
    await sr.from('dashboard_widgets').delete().in('id', widgetIds)
  }

  // ── wizard provenance + duplicated templates ──
  await sr.from('wizard_templates').delete().eq('family_id', FAMILY_ID)
    .or(`title.ilike.${PREFIX}%,title.in.("${SEED_TITLES.join('","')}")`)
  await sr.from('task_templates').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)

  // ── restore Jordan's relationship (F-20 test mutates it) ──
  if (MEMBER_IDS['jordan']) {
    await sr.from('family_members').update({ relationship: 'child' }).eq('id', MEMBER_IDS['jordan'])
  }
}

test.beforeAll(async () => {
  await sweep()
})

test.afterAll(async () => {
  await sweep()
})

// Dependent flows (the leak probe reads the board test 2 deployed) — serial.
test.describe.configure({ mode: 'serial', timeout: 120_000 })

async function gotoStudio(page: Page) {
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
}

/**
 * Open a Studio card by section + title. Cards hover-expand (200→280px) and
 * shift the ScrollRow mid-click, so verify the expected result and retry once
 * (audit harness lesson §6.1).
 */
async function clickStudioCardButton(
  page: Page,
  sectionTitle: string,
  cardTitle: string,
  buttonName: RegExp,
): Promise<void> {
  const section = page
    .locator('h2')
    .filter({ hasText: sectionTitle })
    .first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')

  for (let attempt = 0; attempt < 3; attempt++) {
    let card = section.locator('div.snap-start').filter({ hasText: cardTitle }).first()
    // Default-mode sections hide example cards behind the "Example
    // Templates (N)" accordion — expand it when the card isn't on the shelf.
    if (!(await card.isVisible().catch(() => false))) {
      const accordion = section.locator('button').filter({ hasText: /Example Templates \(/ }).first()
      if (await accordion.isVisible().catch(() => false)) {
        await accordion.click().catch(() => {})
        await page.waitForTimeout(500)
      }
      card = section.locator('div.snap-start').filter({ hasText: cardTitle }).first()
    }
    await card.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {})
    // Hover first so the 200→280px expansion settles before the click —
    // clicking mid-expansion shifts the ScrollRow under the pointer
    // (harness lesson §6.1, worst on last-in-row cards).
    await card.hover({ timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(350)
    await card.click({ timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(400)
    const btn = card.getByRole('button', { name: buttonName }).first()
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true, timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(800)
      return
    }
  }
}

/**
 * Find the input/textarea inside `scope` currently holding `value`
 * (controlled React inputs don't expose value as a DOM attribute, so
 * CSS [value=...] selectors and Testing-Library's getByDisplayValue
 * don't apply — probe the live DOM property instead).
 */
async function inputWithValue(scope: Locator, value: string): Promise<Locator> {
  const inputs = scope.locator('input, textarea')
  await expect
    .poll(
      async () =>
        (await inputs.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value)))
          .some((v) => v === value),
      { timeout: 8000, message: `Expected an input holding "${value}"` },
    )
    .toBe(true)
  const vals = await inputs.evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))
  return inputs.nth(vals.findIndex((v) => v === value))
}

async function openStudioDialog(
  page: Page,
  sectionTitle: string,
  cardTitle: string,
  buttonName: RegExp = /^customize$/i,
) {
  const dialog = page.locator('[role="dialog"]').first()
  for (let attempt = 0; attempt < 2; attempt++) {
    await clickStudioCardButton(page, sectionTitle, cardTitle, buttonName)
    if ((await dialog.count()) > 0 && (await dialog.isVisible().catch(() => false))) break
  }
  await expect(dialog, `Expected a dialog to open from "${cardTitle}"`).toBeVisible({ timeout: 5000 })
  return dialog
}

// ─────────────────────────────────────────────────────────────────────────
// 1. F-03 — My Customized Duplicate deep-copies the template
// ─────────────────────────────────────────────────────────────────────────
test('F-03: Duplicate on a non-routine template creates a real deep copy', async ({ page }) => {
  const srcTitle = `${PREFIX} Dup Source`
  const { error: seedErr } = await sr.from('task_templates').insert({
    family_id: FAMILY_ID,
    created_by: MEMBER_IDS['sarah'],
    title: srcTitle,
    template_name: srcTitle,
    task_type: 'opportunity',
    template_type: 'opportunity_claimable',
    is_system: false,
    config: { shelf_truth_marker: 'st-a' },
    default_reward_type: 'money',
    default_reward_amount: 3,
  })
  expect(seedErr, 'Seeding the source template failed').toBeNull()

  await loginAsMom(page)
  await gotoStudio(page)
  await page.getByText(/My Customized/).first().click()
  await page.waitForTimeout(1200)

  const card = page.locator('div.rounded-xl.border').filter({ hasText: srcTitle }).first()
  const menuBtn = card.getByLabel('More options').first()
  await expect(menuBtn, 'Expected the seeded template card with a More options menu').toBeVisible({ timeout: 8000 })
  await menuBtn.click()
  await card.getByText('Duplicate', { exact: true }).first().click()
  await page.waitForTimeout(2500)

  const { data: copy } = await sr
    .from('task_templates')
    .select('id, title, template_name, task_type, config, default_reward_type, default_reward_amount, is_system')
    .eq('family_id', FAMILY_ID)
    .eq('title', `${srcTitle} (copy)`)
    .maybeSingle()

  expect(copy, 'Expected the Duplicate to create a real task_templates row (was: silent 23502)').not.toBeNull()
  expect(copy?.template_name, 'template_name must be set (the old NOT NULL violation)').toBe(`${srcTitle} (copy)`)
  expect(copy?.task_type, 'task_type must be the DB value, not the Studio type string').toBe('opportunity')
  expect((copy?.config as Record<string, unknown>)?.shelf_truth_marker, 'config must deep-copy').toBe('st-a')
  expect(Number(copy?.default_reward_amount), 'reward config must deep-copy').toBe(3)
})

// ─────────────────────────────────────────────────────────────────────────
// 2. F-04a + rider (b) — Extra House Jobs Board loads its content + deploys
//    kid-scoped (audience → eligible_members + shares)
// ─────────────────────────────────────────────────────────────────────────
test('F-04a/rider(b): Extra House Jobs Board example deploys 10 items scoped to the picked kid', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Task & Chore Templates', 'Extra House Jobs Board')

  // The promised content is actually loaded (F-04): board name + jobs.
  const nameInput = dialog.locator('input').first()
  await expect(nameInput).toHaveValue('Extra House Jobs', { timeout: 5000 })
  await inputWithValue(dialog, 'Vacuum the living room') // promised chore jobs pre-filled
  await expect(dialog.getByPlaceholder('Item name'),
    'All 10 promised items must render').toHaveCount(10)
  await nameInput.fill(`${PREFIX} Extra House Jobs`)

  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(600)

  // Sharing step — rider (b): pills are KIDS ONLY by default.
  await dialog.getByText('Specific people').click()
  await page.waitForTimeout(400)
  await expect(dialog.getByRole('button', { name: 'Alex' }).first()).toBeVisible({ timeout: 5000 })
  await expect(dialog.getByRole('button', { name: 'Amy' }),
    'Special Adults must NEVER appear in the board audience picker').toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Kylie' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Sarah' }),
    'Adults only appear behind the explicit "Show adults too" opt-in').toHaveCount(0)
  await dialog.getByRole('button', { name: 'Alex' }).first().click({ force: true })

  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)

  await dialog.getByRole('button', { name: /^deploy$/i }).first().click({ force: true })
  await page.waitForTimeout(5000)

  await expect(dialog.getByRole('heading', { name: /opportunity board deployed/i }),
    'Expected the success screen (F-23: wizard_templates can no longer break the deploy)').toBeVisible({ timeout: 8000 })

  // ── DB truth ──
  const { data: board } = await sr
    .from('lists')
    .select('id, is_opportunity, eligible_members, is_shared')
    .eq('family_id', FAMILY_ID)
    .eq('title', `${PREFIX} Extra House Jobs`)
    .maybeSingle()
  expect(board, 'Expected the board list row').not.toBeNull()
  expect(board?.is_opportunity).toBe(true)
  expect(board?.eligible_members, 'eligible_members must carry the picked audience (was: null = everyone incl. Special Adults)')
    .toEqual([MEMBER_IDS['alex']])

  const { data: items } = await sr.from('list_items').select('id, reward_type, reward_amount').eq('list_id', board!.id as string)
  expect((items ?? []).length, 'All 10 promised items must land').toBe(10)
  expect((items ?? []).filter((i) => i.reward_type === 'money').length).toBe(8)
  expect((items ?? []).filter((i) => i.reward_type === 'points').length).toBe(2)

  const { data: shares } = await sr.from('list_shares').select('shared_with').eq('list_id', board!.id as string)
  expect((shares ?? []).map((s) => s.shared_with), 'Shares must go ONLY to the picked kid').toEqual([MEMBER_IDS['alex']])

  const { data: wt } = await sr
    .from('wizard_templates')
    .select('id, template_type, template_source, original_author_id')
    .eq('family_id', FAMILY_ID)
    .eq('title', `${PREFIX} Extra House Jobs`)
    .maybeSingle()
  expect(wt, 'F-23: the wizard_templates provenance row must land (was: nonexistent columns, always failed)').not.toBeNull()
  expect(wt?.template_type).toBe('list_reveal_assignment')
  expect(wt?.template_source).toBe('family')
})

// ─────────────────────────────────────────────────────────────────────────
// 3. rider (b) leak probe — picked kid sees the board; sibling + Special
//    Adult do NOT (display layer + direct list read)
// ─────────────────────────────────────────────────────────────────────────
test('rider(b): board deployed to Alex is invisible to Casey and Special Adult Amy', async ({ browser }) => {
  const boardTitle = `${PREFIX} Extra House Jobs`

  // DB-level scoping predicate first (the enforcement field itself)
  const { data: board } = await sr
    .from('lists')
    .select('id, eligible_members')
    .eq('family_id', FAMILY_ID)
    .eq('title', boardTitle)
    .maybeSingle()
  expect(board, 'Board from the previous test must exist').not.toBeNull()
  const eligible = (board?.eligible_members ?? []) as string[]
  expect(eligible).toContain(MEMBER_IDS['alex'])
  expect(eligible).not.toContain(MEMBER_IDS['casey'])
  expect(eligible).not.toContain(MEMBER_IDS['amy'])

  // Alex (picked) — sees it on the Opportunities tab
  const alexCtx = await browser.newContext()
  const alexPage = await alexCtx.newPage()
  await loginAsAlex(alexPage)
  await alexPage.goto('/tasks')
  await waitForAppReady(alexPage)
  await alexPage.getByText('Opportunities', { exact: true }).first().click()
  await expect(alexPage.getByText(boardTitle).first(),
    'The picked kid must see the board').toBeVisible({ timeout: 10_000 })
  await alexCtx.close()

  // Casey (not picked) — does NOT see it
  const caseyCtx = await browser.newContext()
  const caseyPage = await caseyCtx.newPage()
  await loginAsCasey(caseyPage)
  await caseyPage.goto('/tasks')
  await waitForAppReady(caseyPage)
  await caseyPage.getByText('Opportunities', { exact: true }).first().click()
  await caseyPage.waitForTimeout(3000)
  await expect(caseyPage.getByText(boardTitle),
    'An unpicked sibling must NOT see the board').toHaveCount(0)
  await caseyCtx.close()

  // Amy (Special Adult) — does NOT see it (the S1 audit leak)
  const amyCtx = await browser.newContext()
  const amyPage = await amyCtx.newPage()
  await loginAsGrandma(amyPage)
  await amyPage.goto('/tasks')
  await waitForAppReady(amyPage)
  const oppTab = amyPage.getByText('Opportunities', { exact: true }).first()
  if (await oppTab.isVisible().catch(() => false)) {
    await oppTab.click()
    await amyPage.waitForTimeout(3000)
  }
  await expect(amyPage.getByText(boardTitle),
    'A Special Adult must NEVER see a kids\' earning board').toHaveCount(0)
  await amyCtx.close()
})

// ─────────────────────────────────────────────────────────────────────────
// 4. F-05 — the blank Opportunity Board tile creates a BOARD, not a task
// ─────────────────────────────────────────────────────────────────────────
test('F-05: Opportunity Board blank tile opens board creation and deploys a list', async ({ page }) => {
  const title = `${PREFIX} Board Blank`
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Task & Chore Templates', 'Opportunity Board')

  // It is the board wizard (items step, "List name"), NOT TaskCreationModal.
  await expect(dialog.getByText('List name').first()).toBeVisible({ timeout: 5000 })
  await expect(dialog.getByText('Who Can Browse').first(),
    'The board wizard\'s member-visibility step must exist').toBeVisible({ timeout: 5000 })

  await dialog.locator('input').first().fill(title)
  await dialog.getByRole('button', { name: /add item/i }).first().click()
  await dialog.getByPlaceholder('Item name').first().fill('Sweep the porch')
  await page.waitForTimeout(400)

  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /^deploy$/i }).first().click({ force: true })
  await page.waitForTimeout(4000)

  const { data: list } = await sr
    .from('lists')
    .select('id, is_opportunity')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(list, 'The blank tile must deploy a BOARD (lists row)').not.toBeNull()
  expect(list?.is_opportunity).toBe(true)

  // B6 counter-proof: no orphan single task was created.
  const { data: orphanTasks } = await sr.from('tasks').select('id').eq('family_id', FAMILY_ID).eq('title', title)
  expect((orphanTasks ?? []).length, 'No unassigned single opportunity task (the old B6 behavior)').toBe(0)
})

// ─────────────────────────────────────────────────────────────────────────
// 5. F-04b — Curriculum Chapter Sequence loads its 5 chapters + deploys
// ─────────────────────────────────────────────────────────────────────────
test('F-04b: Curriculum Chapter Sequence example creates a 5-item collection', async ({ page }) => {
  const title = `${PREFIX} Curriculum`
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Task & Chore Templates', 'Curriculum Chapter Sequence')

  const titleInput = dialog.locator('input').first()
  await expect(titleInput, 'The promised title must be pre-filled').toHaveValue('Curriculum Chapter Sequence', { timeout: 5000 })
  await expect(dialog.locator('textarea').first(),
    'The promised 5 sample chapters must be pre-filled').toHaveValue(/Chapter 1: Getting Started/, { timeout: 5000 })
  await titleInput.fill(title)

  await dialog.getByRole('button', { name: 'Jordan' }).first().click({ force: true })
  await dialog.getByRole('button', { name: /create collection \(5 items\)/i }).click({ force: true })
  await page.waitForTimeout(4000)

  const { data: collection } = await sr
    .from('sequential_collections')
    .select('id, total_items')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(collection, 'Expected the sequential collection row').not.toBeNull()
  expect(collection?.total_items).toBe(5)

  const { data: children } = await sr
    .from('tasks')
    .select('id, assignee_id, sequential_position')
    .eq('sequential_collection_id', collection!.id as string)
  expect((children ?? []).length, 'All 5 chapters must become tasks').toBe(5)
  expect(children?.every((c) => c.assignee_id === MEMBER_IDS['jordan'])).toBe(true)
})

// ─────────────────────────────────────────────────────────────────────────
// 6. F-04c — SODAS Sibling Conflict pre-fills the Situation + assigns
// ─────────────────────────────────────────────────────────────────────────
test('F-04c: SODAS Sibling Conflict example pre-fills the Situation and assigns for real', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Guided Forms', 'SODAS Sibling Conflict')

  // The audit's value assertion returned [""] — now the Situation is REAL.
  const situation = dialog.locator('textarea').first()
  await expect(situation).toBeVisible({ timeout: 5000 })
  const value = await situation.inputValue()
  expect(value.length, 'The promised pre-filled Situation must not be empty').toBeGreaterThan(40)
  expect(value.toLowerCase()).toContain('sibling')

  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(600)
  await dialog.getByRole('button', { name: 'Jordan' }).first().click({ force: true })
  await dialog.getByRole('button', { name: /^assign$/i }).first().click({ force: true })
  await page.waitForTimeout(4000)

  const { data: task } = await sr
    .from('tasks')
    .select('id, task_type')
    .eq('family_id', FAMILY_ID)
    .eq('title', 'SODAS Sibling Conflict')
    .eq('assignee_id', MEMBER_IDS['jordan'])
    .maybeSingle()
  expect(task, 'Expected the guided-form assignment task').not.toBeNull()
  expect(task?.task_type).toBe('guided_form')

  const { data: responses } = await sr
    .from('guided_form_responses')
    .select('section_key, section_content, family_member_id, filled_by')
    .eq('task_id', task!.id as string)
    .eq('section_key', 'situation')
  expect((responses ?? []).length, 'Mom\'s pre-filled Situation must persist as her response').toBeGreaterThan(0)
  expect(String(responses?.[0]?.section_content ?? '').toLowerCase()).toContain('sibling')
  expect(responses?.[0]?.filled_by).toBe('mom')
  expect(responses?.[0]?.family_member_id).toBe(MEMBER_IDS['sarah'])
})

// ─────────────────────────────────────────────────────────────────────────
// 7. F-04d — TSG Extra Jobs Randomizer hydrates its 13 items
// ─────────────────────────────────────────────────────────────────────────
test('F-04d: TSG Extra Jobs Randomizer hydrates 9 chores + 4 connection items', async ({ page }) => {
  const title = `${PREFIX} TSG Jobs`

  // Migration 100317 seeds the system template the tile always promised.
  const { data: tpl } = await sr
    .from('list_templates')
    .select('id, default_items')
    .eq('title', 'TSG Extra Jobs Randomizer')
    .eq('is_example', true)
    .is('family_id', null)
    .maybeSingle()
  expect(tpl, 'The TSG list_templates seed (migration 100317) must exist').not.toBeNull()
  expect((tpl?.default_items as unknown[])?.length).toBe(13)

  await loginAsMom(page)

  // The tile navigates to /lists?create=randomizer&template=<id>, and the
  // Lists page consumes + strips the params immediately — so gate on the
  // OUTCOME (the template-hydrating create form), not the transient URL.
  // Retry the whole open on the known last-in-row hover-shift flake (§6.1).
  const hydrationBanner = page.getByText(/creating from template/i)
  let formOpen = false
  for (let attempt = 0; attempt < 3 && !formOpen; attempt++) {
    await gotoStudio(page)
    await clickStudioCardButton(page, 'Task & Chore Templates', 'TSG Extra Jobs Randomizer', /^customize$/i)
    formOpen = await hydrationBanner.isVisible({ timeout: 8000 }).catch(() => false)
      || await hydrationBanner.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
  }
  expect(formOpen, 'Expected the template-hydrating create form (template id resolved — migration 100317)').toBe(true)
  await page.getByPlaceholder('List name').fill(title)
  await page.getByRole('button', { name: /^create$/i }).click()
  await page.waitForTimeout(4000)

  const { data: list } = await sr
    .from('lists')
    .select('id, list_type')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(list, 'Expected the randomizer list').not.toBeNull()
  expect(list?.list_type).toBe('randomizer')

  const { data: items } = await sr.from('list_items').select('id, is_repeatable').eq('list_id', list!.id as string)
  expect((items ?? []).length, 'All 13 promised items must hydrate').toBe(13)
  expect((items ?? []).filter((i) => i.is_repeatable === true).length, '4 connection items repeatable').toBe(4)
  expect((items ?? []).filter((i) => i.is_repeatable !== true).length, '9 chores one-time').toBe(9)
})

// ─────────────────────────────────────────────────────────────────────────
// 8. F-06 — Best Intentions Starter is a real wizard
// ─────────────────────────────────────────────────────────────────────────
test('F-06: Best Intentions Starter wizard creates real best_intentions rows', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Growth', 'Best Intentions Starter')

  // It is a wizard (dialog), not a nav-away to /guiding-stars.
  expect(page.url()).toContain('/studio')

  await dialog.getByRole('button', { name: 'Be patient when the kids are loud' }).click()
  await dialog.getByRole('button', { name: 'Put my phone down during dinner' }).click()
  const customInput = dialog.getByPlaceholder(/pause before answering/i)
  await customInput.fill(`${PREFIX} practice gratitude out loud`)
  await customInput.press('Enter')
  await page.waitForTimeout(300)

  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(400)
  await dialog.getByRole('button', { name: /create intentions/i }).click({ force: true })
  await page.waitForTimeout(3000)

  await expect(dialog.getByRole('heading', { name: /intentions created/i })).toBeVisible({ timeout: 5000 })

  const { data: rows } = await sr
    .from('best_intentions')
    .select('id, statement, member_id')
    .eq('family_id', FAMILY_ID)
    .eq('source', 'studio_wizard')
  expect((rows ?? []).length, 'The picked intentions must persist').toBeGreaterThanOrEqual(3)
  expect(rows?.every((r) => r.member_id === MEMBER_IDS['sarah'])).toBe(true)
  expect(rows?.some((r) => (r.statement as string).includes('practice gratitude'))).toBe(true)
})

// ─────────────────────────────────────────────────────────────────────────
// 9. F-13 — Use as-is is a REAL fast deploy, not a Customize alias
// ─────────────────────────────────────────────────────────────────────────
test('F-13: Use as-is deploys the Consequence Spinner straight from Review; routines open the Deploy modal', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)

  // (a) Consequence Spinner — opens ON the review step, one tap deploys.
  const dialog = await openStudioDialog(page, 'Setup Wizards', 'Consequence Spinner', /use as-is/i)
  const deployBtn = dialog.getByRole('button', { name: /^deploy$/i }).first()
  await expect(deployBtn, 'Use as-is must land on Review with Deploy ready').toBeVisible({ timeout: 5000 })
  await deployBtn.click({ force: true })
  await page.waitForTimeout(4000)
  await expect(dialog.getByRole('heading', { name: /spinner deployed/i })).toBeVisible({ timeout: 8000 })

  const { data: spinner } = await sr
    .from('lists')
    .select('id, list_type')
    .eq('family_id', FAMILY_ID)
    .eq('title', 'Consequences')
    .maybeSingle()
  expect(spinner, 'The spinner list must exist with the example content').not.toBeNull()
  expect(spinner?.list_type).toBe('randomizer')
  const { data: spinnerItems } = await sr.from('list_items').select('id').eq('list_id', spinner!.id as string)
  expect((spinnerItems ?? []).length, 'All 8 pre-decided consequences must land').toBe(8)

  await dialog.getByRole('button', { name: /^done$/i }).click()
  await page.waitForTimeout(500)

  // (b) Morning Routine — Use as-is opens the DEPLOY modal, not the editor.
  await gotoStudio(page)
  await clickStudioCardButton(page, 'Task & Chore Templates', 'Morning Routine', /use as-is/i)
  await expect(page.getByText(/deploy: morning routine/i),
    'Routine Use-as-is must open RoutineDeployModal (pick kid + deploy), not the template editor').toBeVisible({ timeout: 8000 })
})

// ─────────────────────────────────────────────────────────────────────────
// 10. F-16 — RewardsListWizard carries the shared bulk-add + deploys
// ─────────────────────────────────────────────────────────────────────────
test('F-16: Rewards List wizard has Bulk Add with AI and deploys a reward_list', async ({ page }) => {
  const title = `${PREFIX} Rewards`
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Setup Wizards', 'Create a Rewards List')

  await dialog.locator('input').first().fill(title)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)

  // The card's promised bulk-paste path exists (shared BulkAddWithAI).
  const bulkBtn = dialog.getByRole('button', { name: /bulk add with ai/i }).first()
  await expect(bulkBtn, 'The promised bulk-paste entry point must exist').toBeVisible({ timeout: 5000 })
  await bulkBtn.click()
  await expect(dialog.getByText('Bulk Add Rewards').first(),
    'The shared BulkAddWithAI panel must open').toBeVisible({ timeout: 5000 })
  // The panel is inline — the manual add path stays available below it.
  // Add one reward manually to keep the pin AI-free.
  await dialog.getByRole('button', { name: /add reward/i }).first().click()
  await dialog.getByPlaceholder('Reward name').first().fill('Extra story at bedtime')
  await page.waitForTimeout(300)

  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /^deploy$/i }).first().click({ force: true })
  await page.waitForTimeout(4000)

  const { data: list } = await sr
    .from('lists')
    .select('id, list_type')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(list, 'Expected the reward_list row').not.toBeNull()
  expect(list?.list_type).toBe('reward_list')
  const { data: items } = await sr.from('list_items').select('id').eq('list_id', list!.id as string)
  expect((items ?? []).length).toBe(1)
})

// ─────────────────────────────────────────────────────────────────────────
// 11. F-20 — MeetingSetupWizard keeps kid steps for a NULL-relationship kid
// ─────────────────────────────────────────────────────────────────────────
test('F-20: Meeting Setup keeps its kid steps when a kid has relationship=NULL', async ({ page }) => {
  // Reproduce the silent-loss precondition the audit found.
  await sr.from('family_members').update({ relationship: null }).eq('id', MEMBER_IDS['jordan'])
  try {
    await loginAsMom(page)
    await gotoStudio(page)
    const dialog = await openStudioDialog(page, 'Setup Wizards', 'Family Meeting Setup')

    // The step dots must include the kid steps (they silently vanished before).
    await expect(dialog.getByText('Family Meeting', { exact: true }).first(),
      'Family Council step must survive a NULL-relationship kid').toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText('Pick Kids').first(),
      '1:1 kid-picking step must survive a NULL-relationship kid').toBeVisible({ timeout: 5000 })
  } finally {
    await sr.from('family_members').update({ relationship: 'child' }).eq('id', MEMBER_IDS['jordan'])
  }
})

// ─────────────────────────────────────────────────────────────────────────
// 12. F-22 — Universal List wizard: preset honored, sharing guarded,
//     visible name suggestion, real shares, no silent partial deploy
// ─────────────────────────────────────────────────────────────────────────
test('F-22: Shared Family Shopping List deploys its full preset, shared for real', async ({ page }) => {
  const title = `${PREFIX} Family Shopping List`
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'List Templates', 'Shared Family Shopping List')

  // Purpose step (preset auto-selected) → Next
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(600)

  // Items step: the preset's 10 example items are present.
  await inputWithValue(dialog, 'Milk (whole)') // the preset's example items must be honored
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(600)

  // Sharing step: preset = "specific" — Next must be GATED until someone is picked
  const nextBtn = dialog.getByRole('button', { name: /^next/i }).first()
  await expect(nextBtn, '"Specific people" with nobody picked must not advance (the S4 unshared deploy)').toBeDisabled()
  await dialog.getByRole('button', { name: 'Mark' }).first().click({ force: true })
  await expect(nextBtn).toBeEnabled()
  await nextBtn.click({ force: true })
  await page.waitForTimeout(500)

  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true }) // organize
  await page.waitForTimeout(500)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true }) // extras
  await page.waitForTimeout(600)

  // Review: the name is a VISIBLE editable suggestion, never a silent
  // tile-label fallback.
  const reviewName = dialog.locator('input[type="text"]').first()
  await expect(reviewName, 'A real suggested name must sit in the input').toHaveValue('Family Shopping List', { timeout: 5000 })
  await reviewName.fill(title)

  await dialog.getByRole('button', { name: /create list/i }).click({ force: true })
  await page.waitForTimeout(5000)

  const { data: list } = await sr
    .from('lists')
    .select('id, list_type, is_shared')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(list, 'Expected the shopping list row').not.toBeNull()
  expect(list?.list_type).toBe('shopping')
  expect(list?.is_shared, 'The list must actually be shared (S4 landed is_shared=false)').toBe(true)

  const { data: items } = await sr
    .from('list_items')
    .select('id, content, quantity, quantity_unit')
    .eq('list_id', list!.id as string)
  expect((items ?? []).length, 'ALL 10 preset items must land (S4 landed 4)').toBe(10)
  const milk = (items ?? []).find((i) => (i.content as string).startsWith('Milk'))
  expect(Number(milk?.quantity), 'Preset quantities must persist (were silently dropped)').toBe(1)
  expect(milk?.quantity_unit).toBe('gallon')

  const { data: shares } = await sr.from('list_shares').select('shared_with').eq('list_id', list!.id as string)
  expect((shares ?? []).map((s) => s.shared_with), 'Mark\'s share must exist (S4 created zero)').toEqual([MEMBER_IDS['mark']])
})

// ─────────────────────────────────────────────────────────────────────────
// 13. Reward Spinner tile lands on a real spinner config and deploys it
// ─────────────────────────────────────────────────────────────────────────
test('Reward Spinner tile opens a real spinner configuration and deploys the widget', async ({ page }) => {
  const title = `${PREFIX} Spinner`
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Gamification', 'Reward Spinner')

  // The old behavior dumped mom into the generic Add Widget picker showing
  // Family-Hub widgets. Now: a configuration surface for the spinner itself.
  const titleInput = await inputWithValue(dialog, 'Reward Spinner')
  await expect(titleInput, 'Expected the spinner CONFIGURATION (not the generic widget picker)').toBeVisible({ timeout: 5000 })
  await titleInput.fill(title)

  await dialog.getByRole('button', { name: /deploy to dashboard/i }).click({ force: true })
  await page.waitForTimeout(3000)

  const { data: widget } = await sr
    .from('dashboard_widgets')
    .select('id, template_type, visual_variant')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(widget, 'Expected a real spinner widget row').not.toBeNull()
  expect(widget?.template_type).toBe('randomizer_spinner')
})

// ─────────────────────────────────────────────────────────────────────────
// 14. Honey-Do Use-as-is + F-23 SharedTaskList provenance + success screen
// ─────────────────────────────────────────────────────────────────────────
test('F-13/F-23: Honey-Do Use-as-is opens at sharing, deploys, shows success, records provenance', async ({ page }) => {
  const title = `${PREFIX} Honey Do`
  await loginAsMom(page)
  await gotoStudio(page)

  const dialog = await openStudioDialog(page, 'Setup Wizards', 'Honey-Do List', /use as-is/i)

  // Opens at the ONE remaining decision: who shares it (items pre-decided).
  await expect(dialog.getByRole('button', { name: 'Mark' }).first(),
    'Use as-is must open at the Share step').toBeVisible({ timeout: 5000 })

  // Name it for sweepability (Back → name step), then return.
  await dialog.getByRole('button', { name: /^back$/i }).click({ force: true })
  await page.waitForTimeout(300)
  await dialog.getByRole('button', { name: /^back$/i }).click({ force: true })
  await page.waitForTimeout(300)
  await dialog.getByPlaceholder('Honey-Do List').fill(title)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(300)
  // Items step — the 8 example items are pre-decided
  await inputWithValue(dialog, 'Fix the leaky faucet')
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(300)
  await dialog.getByRole('button', { name: 'Mark' }).first().click({ force: true })
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(300)
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(300)
  await dialog.getByRole('button', { name: /^create$/i }).first().click({ force: true })
  await page.waitForTimeout(4000)

  // F-23: the success screen must show (template_source:'wizard' used to
  // violate the CHECK inside the main try — the wizard never finished).
  await expect(dialog.getByRole('heading', { name: /shared to-do deployed/i }),
    'The SharedTaskList wizard must reach its success screen').toBeVisible({ timeout: 8000 })

  const { data: list } = await sr
    .from('lists')
    .select('id, is_shared')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(list).not.toBeNull()
  expect(list?.is_shared).toBe(true)
  const { data: items } = await sr.from('list_items').select('id').eq('list_id', list!.id as string)
  expect((items ?? []).length, 'All 8 honey-do items must land').toBe(8)

  const { data: wt } = await sr
    .from('wizard_templates')
    .select('id, template_type, template_source')
    .eq('family_id', FAMILY_ID)
    .eq('title', title)
    .maybeSingle()
  expect(wt, 'F-23: the shared_task_list provenance row must land').not.toBeNull()
  expect(wt?.template_source, 'template_source must be a legal CHECK value').toBe('family')
})
