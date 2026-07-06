/**
 * STUDIO-EXPERIENCE audit tour — Pass B (creation flows to SAVE + probes).
 *
 * MANUAL AUDIT HELPER, NOT A REGRESSION TEST. Gated behind STUDIO_AUDIT=1.
 * Each test drives one creation surface end-to-end (fill → save → DB assert)
 * or probes a specific promise (NLC routing, Drafts, Customized actions,
 * list-template hydration). Fixtures prefixed STUDIOAUD, swept via service
 * role before + after. Results appended to <OUT>/pass-b.ndjson.
 *
 * Read by the STUDIO-EXPERIENCE Fable audit session (2026-07-04).
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.STUDIO_AUDIT, 'Manual studio audit — set STUDIO_AUDIT=1 to run')

const OUT_DIR = process.env.STUDIO_AUDIT_OUT
  ? process.env.STUDIO_AUDIT_OUT
  : path.join(process.cwd(), 'studio-audit-out')

const PREFIX = 'STUDIOAUD'

const sr = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

let FAMILY_ID = ''
const MEMBER: Record<string, string> = {}

function log(name: string, data: Record<string, unknown>) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.appendFileSync(path.join(OUT_DIR, 'pass-b.ndjson'), JSON.stringify({ probe: name, ...data }) + '\n')
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(OUT_DIR, `b-${name}.png`), fullPage: false }).catch(() => {})
}

async function cleanup() {
  const { data: fam } = await sr.from('families').select('id').eq('family_login_name_lower', 'testworthfamily').single()
  if (!fam) throw new Error('Testworth family not found')
  FAMILY_ID = fam.id as string
  const { data: members } = await sr.from('family_members').select('id, display_name').eq('family_id', FAMILY_ID)
  for (const m of members ?? []) MEMBER[m.display_name as string] = m.id as string

  // lists (cascade shares + items) created by audit
  const { data: lists } = await sr.from('lists').select('id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  const listIds = (lists ?? []).map(l => l.id as string)
  if (listIds.length) {
    await sr.from('contracts').delete().in('source_id', listIds)
    await sr.from('list_shares').delete().in('list_id', listIds)
    await sr.from('list_items').delete().in('list_id', listIds)
    await sr.from('lists').delete().in('id', listIds)
  }
  // tasks (+ rewards, assignments, completions, deeds)
  const { data: tasks } = await sr.from('tasks').select('id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  const taskIds = (tasks ?? []).map(t => t.id as string)
  if (taskIds.length) {
    await sr.from('contracts').delete().in('source_id', taskIds)
    await sr.from('deed_firings').delete().in('source_id', taskIds)
    await sr.from('task_rewards').delete().in('task_id', taskIds)
    await sr.from('task_completions').delete().in('task_id', taskIds)
    await sr.from('task_assignments').delete().in('task_id', taskIds)
    await sr.from('tasks').delete().in('id', taskIds)
  }
  // sequential collections
  await sr.from('sequential_collections').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  // templates
  const { data: tpls } = await sr.from('task_templates').select('id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  for (const t of tpls ?? []) {
    const { data: secs } = await sr.from('task_template_sections').select('id').eq('template_id', t.id as string)
    const secIds = (secs ?? []).map(s => s.id as string)
    if (secIds.length) await sr.from('task_template_steps').delete().in('section_id', secIds)
    await sr.from('task_template_sections').delete().eq('template_id', t.id as string)
  }
  if ((tpls ?? []).length) await sr.from('task_templates').delete().in('id', (tpls ?? []).map(t => t.id as string))
  await sr.from('list_templates').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  await sr.from('wizard_templates').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  await sr.from('dashboard_widgets').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  await sr.from('self_knowledge').delete().eq('family_id', FAMILY_ID).ilike('content', `${PREFIX}%`)
  await sr.from('meeting_schedules').delete().eq('family_id', FAMILY_ID)
    .in('id', [])  // placeholder — meeting cleanup handled by calendar title below when needed
  const { data: evs } = await sr.from('calendar_events').select('id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  const evIds = (evs ?? []).map(e => e.id as string)
  if (evIds.length) {
    await sr.from('event_attendees').delete().in('event_id', evIds)
    await sr.from('calendar_events').delete().in('id', evIds)
  }
}

test.beforeAll(async () => { await cleanup() })
test.afterAll(async () => { await cleanup() })

test.describe.configure({ timeout: 240_000, retries: 0 })

async function gotoStudio(page: Page) {
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
  for (const text of ["Don't show guides", 'Got it', 'Dismiss']) {
    const btn = page.locator('button').filter({ hasText: text }).first()
    if (await btn.isVisible({ timeout: 200 }).catch(() => false)) await btn.click({ force: true })
  }
}

function card(page: Page, section: string, name: string) {
  return page.locator('h2').filter({ hasText: section }).first()
    .locator('xpath=ancestor::div[contains(@class, "mb-8")]')
    .locator('div.snap-start').filter({ hasText: name }).first()
}

async function customize(page: Page, section: string, name: string) {
  // Cards hover-expand (200px → 280px), shifting ScrollRow layout mid-click —
  // verify a dialog actually opened and retry once if the click went stale.
  for (let attempt = 0; attempt < 3; attempt++) {
    const c = card(page, section, name)
    await c.scrollIntoViewIfNeeded({ timeout: 8000 })
    await c.click({ timeout: 8000 })
    await page.waitForTimeout(500)
    await c.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1500)
    const opened = await page.locator('[role="dialog"]').count()
    if (opened > 0 || !page.url().includes('/studio')) return
    await page.waitForTimeout(500)
  }
  throw new Error(`customize(${name}): no dialog opened after 3 attempts`)
}

// ─────────────────────────────────────────────────────────────
// B1. NLC routing probes — 4 mom descriptions
// ─────────────────────────────────────────────────────────────
test('B1 — NLC probes: in-scope and out-of-scope descriptions', async ({ page }) => {
  await loginAsMom(page)
  const probes = [
    { key: 'chore-board-money', text: 'A chore board for my kids where they can earn money — vacuum the living room $2, unload dishes $1, fold laundry $1.50' },
    { key: 'potty-chart', text: 'A potty chart for Ruthie with a sticker for every trip and a prize after 10' },
    { key: 'shopping-list', text: 'A shared grocery shopping list my husband and I can both add to' },
    { key: 'morning-routine', text: 'A morning routine for my kids — make bed, brush teeth, get dressed, and on school days pack their backpack' },
  ]
  for (const p of probes) {
    await gotoStudio(page)
    const input = page.getByPlaceholder('Describe what you want to create...')
    await input.fill(p.text)
    await input.press('Enter')
    // Haiku round trip
    await page.waitForTimeout(9000)
    const url = page.url()
    const state = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"]')
      const dtext = Array.from(dialogs).map(d => (d as HTMLElement).innerText).join('\n---\n')
      const main = (document.querySelector('main') ?? document.body) as HTMLElement
      return { dialogCount: dialogs.length, dialogText: dtext.slice(0, 1500), mainText: main.innerText.slice(0, 1800) }
    })
    await shot(page, `nlc-${p.key}`)
    log('B1-nlc', { key: p.key, input: p.text, url, ...state })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B2. Drafts lifecycle: silent save on close → Drafts tab → Resume → Discard
// ─────────────────────────────────────────────────────────────
test('B2 — Drafts: RewardsListWizard close→resume→discard', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)
  await customize(page, 'Setup Wizards', 'Create a Rewards List')
  const dialog = page.locator('[role="dialog"]').first()
  await dialog.getByPlaceholder(/list name/i).or(dialog.locator('input').first()).first().fill(`${PREFIX} Draft Probe`)
  await page.waitForTimeout(300)
  // Close via X — expect NO prompt (silent auto-save), record whatever appears
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  const promptState = await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role="dialog"]')
    return { dialogCount: dialogs.length, text: Array.from(dialogs).map(d => (d as HTMLElement).innerText).join(' | ').slice(0, 400) }
  })
  await shot(page, 'drafts-after-close')
  // Open Drafts tab
  await page.getByRole('button', { name: /Drafts/ }).or(page.getByText(/^Drafts/)).first().click()
  await page.waitForTimeout(600)
  const draftsTabText = await page.evaluate(() => (document.querySelector('main') ?? document.body).textContent?.slice(0, 1200) ?? '')
  await shot(page, 'drafts-tab')
  const hasDraft = draftsTabText.includes(`${PREFIX} Draft Probe`)
  // Resume
  let resumedTitle = ''
  if (hasDraft) {
    await page.getByRole('button', { name: /^Resume$/ }).first().click()
    await page.waitForTimeout(800)
    resumedTitle = await page.locator('[role="dialog"]').first().locator('input').first().inputValue().catch(() => '')
    await shot(page, 'drafts-resumed')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }
  log('B2-drafts', { closePrompt: promptState, hasDraftInTab: hasDraft, resumedTitle, draftsTabText: draftsTabText.slice(0, 300) })
  // Discard (accept the window.confirm)
  if (hasDraft) {
    await page.getByRole('button', { name: /Drafts/ }).first().click().catch(() => {})
    await page.waitForTimeout(400)
    page.once('dialog', d => { d.accept() })
    await page.getByRole('button', { name: /^Discard$/ }).first().click().catch(() => {})
    await page.waitForTimeout(400)
  }
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B3. My Customized: Duplicate on task + opportunity templates (F-03 probe)
// ─────────────────────────────────────────────────────────────
test('B3 — Customized Duplicate: valid vs invalid task_type', async ({ page }) => {
  // Seed two templates via service role
  await sr.from('task_templates').insert([
    { family_id: FAMILY_ID, created_by: MEMBER['Sarah'], title: `${PREFIX} Dup Task Tpl`, task_type: 'task', is_system: false, config: { note: 'has config' } },
    { family_id: FAMILY_ID, created_by: MEMBER['Sarah'], title: `${PREFIX} Dup Opp Tpl`, task_type: 'opportunity', is_system: false, config: { note: 'has config' } },
  ])
  await loginAsMom(page)
  await gotoStudio(page)
  await page.getByRole('button', { name: /My Customized/ }).or(page.getByText(/My Customized/)).first().click()
  await page.waitForTimeout(1000)
  await shot(page, 'customized-tab')

  for (const tplName of [`${PREFIX} Dup Task Tpl`, `${PREFIX} Dup Opp Tpl`]) {
    // Duplicate lives in the card's "More options" (⋯) menu
    const moreBtn = page.locator('div.rounded-xl, div.rounded-lg, div')
      .filter({ hasText: tplName })
      .getByRole('button', { name: 'More options' })
      .last()
    const visible = await moreBtn.isVisible({ timeout: 2500 }).catch(() => false)
    let clickedDuplicate = false
    if (visible) {
      await moreBtn.click({ force: true })
      await page.waitForTimeout(400)
      const dupItem = page.getByText('Duplicate', { exact: true }).first()
      if (await dupItem.isVisible({ timeout: 1500 }).catch(() => false)) {
        await dupItem.click({ force: true })
        clickedDuplicate = true
        await page.waitForTimeout(3000)
      }
    }
    log('B3-duplicate-clicked', { tplName, moreVisible: visible, clickedDuplicate })
    // page may have reloaded (window.location.reload on success)
    await gotoStudio(page)
    await page.getByText(/My Customized/).first().click()
    await page.waitForTimeout(800)
  }
  // DB truth
  const { data: copies } = await sr.from('task_templates').select('id, title, task_type, config').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX} Dup%copy%`)
  log('B3-duplicate-db', { copies })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B4. List template hydration (NEW-ZZ settle): Weekly Grocery example
// ─────────────────────────────────────────────────────────────
test('B4 — Weekly Grocery example hydrates default_items', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)
  // expand List Templates example accordion
  const sec = page.locator('h2').filter({ hasText: 'List Templates' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const acc = sec.locator('button').filter({ hasText: /Example Templates \(/ }).first()
  if (await acc.isVisible({ timeout: 1500 }).catch(() => false)) { await acc.click(); await page.waitForTimeout(400) }
  const c = sec.locator('div.snap-start').filter({ hasText: 'Weekly Grocery List' }).first()
  await c.scrollIntoViewIfNeeded()
  await c.click()
  await page.waitForTimeout(300)
  await c.getByRole('button', { name: /^customize$/i }).click({ force: true })
  await page.waitForTimeout(2000)
  const url = page.url()
  await shot(page, 'grocery-create-modal')
  // The Lists page create form is INLINE (not role=dialog)
  const banner = await page.getByText(/creating from template/i).first().isVisible({ timeout: 2500 }).catch(() => false)
  const dialogText = banner ? 'Creating from template — items will be pre-filled. (banner visible)' : '(no template banner)'
  const titleInput = page.locator('input:visible').first()
  await titleInput.fill(`${PREFIX} Grocery Hydration`)
  const createBtn = page.getByRole('button', { name: /^create$/i }).first()
  await createBtn.click({ force: true })
  await page.waitForTimeout(3000)
  await shot(page, 'grocery-created')
  const { data: list } = await sr.from('lists').select('id, template_id, list_type').eq('family_id', FAMILY_ID).eq('title', `${PREFIX} Grocery Hydration`).maybeSingle()
  let itemCount = -1
  let sections: string[] = []
  if (list) {
    const { data: items } = await sr.from('list_items').select('content, section_name').eq('list_id', list.id as string)
    itemCount = (items ?? []).length
    sections = Array.from(new Set((items ?? []).map(i => (i.section_name as string) ?? '')))
  }
  log('B4-grocery-hydration', { url, dialogText: dialogText.slice(0, 500), listCreated: !!list, templateIdWritten: list?.template_id ?? null, itemCount, sections })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B5. Sequential blank: create with 2 items → DB rows
// ─────────────────────────────────────────────────────────────
test('B5 — Sequential Collection blank creates collection + child tasks', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)
  await customize(page, 'Task & Chore Templates', 'Sequential Collection')
  const dialog = page.locator('[role="dialog"]').first()
  const dText = await dialog.innerText().catch(() => '')
  // Who is this for? → pick Jordan
  await dialog.getByRole('button', { name: 'Jordan' }).or(dialog.getByText('Jordan', { exact: true })).first().click({ force: true })
  await page.waitForTimeout(300)
  // Collection title
  await dialog.getByPlaceholder(/title/i).or(dialog.locator('input').first()).first().fill(`${PREFIX} Seq Probe`)
  // Items textarea (one per line)
  const ta = dialog.locator('textarea').first()
  await ta.fill('Chapter One\nChapter Two')
  await page.waitForTimeout(300)
  await shot(page, 'seq-filled')
  const saveBtn = dialog.getByRole('button', { name: /create|save/i }).last()
  await saveBtn.click({ force: true })
  await page.waitForTimeout(3000)
  const { data: coll } = await sr.from('sequential_collections').select('id, total_items, active_count').eq('family_id', FAMILY_ID).eq('title', `${PREFIX} Seq Probe`).maybeSingle()
  let childTasks: unknown[] = []
  if (coll) {
    const { data: kids } = await sr.from('tasks').select('title, sequential_position, sequential_is_active, assignee_id').eq('sequential_collection_id', coll.id as string).order('sequential_position')
    childTasks = kids ?? []
  }
  log('B5-sequential', { dialogTextStart: dText.slice(0, 200), created: !!coll, coll, childTasks })
  await shot(page, 'seq-saved')
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B4b. Lists page own [+ New List] path — no template offer (NEW-ZZ path 2)
// ─────────────────────────────────────────────────────────────
test('B4b — Lists page + New List: blank creation, no template chooser', async ({ page }) => {
  await loginAsMom(page)
  await page.goto('/lists')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
  const newBtn = page.getByRole('button', { name: /new list/i }).first()
  await newBtn.click()
  await page.waitForTimeout(600)
  await shot(page, 'lists-new-picker')
  const pickerText = await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role="dialog"]')
    if (dialogs.length) return Array.from(dialogs).map(d => (d as HTMLElement).innerText).join('\n').slice(0, 1200)
    return (document.querySelector('main') ?? document.body).textContent?.slice(0, 1200) ?? ''
  })
  // pick Shopping tile
  await page.getByText('Shopping', { exact: false }).first().click({ force: true })
  await page.waitForTimeout(600)
  await shot(page, 'lists-new-shopping-form')
  const formText = await page.evaluate(() => {
    const dialogs = document.querySelectorAll('[role="dialog"]')
    return Array.from(dialogs).map(d => (d as HTMLElement).innerText).join('\n').slice(0, 1200)
  })
  log('B4b-lists-page-path', {
    pickerMentionsTemplates: /template/i.test(pickerText),
    formMentionsTemplates: /template/i.test(formText),
    pickerText: pickerText.slice(0, 400),
    formText: formText.slice(0, 400),
  })
  await page.keyboard.press('Escape')
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B7. RewardsListWizard full deploy → where does the list live afterwards?
// ─────────────────────────────────────────────────────────────
test('B7 — Rewards List deploy: reward_list row + post-deploy visibility', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)
  await customize(page, 'Setup Wizards', 'Create a Rewards List')
  const dialog = page.locator('[role="dialog"]').first()
  await dialog.getByPlaceholder(/potty rewards/i).fill(`${PREFIX} Prize Box`)
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  // Step 2: Add Rewards — add two items manually
  for (const item of ['Extra screen time', 'Ice cream trip']) {
    const addInput = dialog.locator('input').last()
    await addInput.fill(item)
    await addInput.press('Enter')
    await page.waitForTimeout(300)
  }
  await shot(page, 'rewards-items')
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  // Step 3: Who Gets It — pick Jordan if present, else skip
  const jordanBtn = dialog.getByRole('button', { name: 'Jordan' }).first()
  if (await jordanBtn.isVisible({ timeout: 1000 }).catch(() => false)) await jordanBtn.click({ force: true })
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(500)
  await shot(page, 'rewards-review')
  // Step 4: Review → deploy
  const deployBtn = dialog.getByRole('button', { name: /create|deploy|finish/i }).last()
  const deployBtnText = await deployBtn.innerText().catch(() => '')
  await deployBtn.click({ force: true })
  await page.waitForTimeout(3000)
  await shot(page, 'rewards-deployed')
  const { data: list } = await sr.from('lists').select('id, list_type').eq('family_id', FAMILY_ID).eq('title', `${PREFIX} Prize Box`).maybeSingle()
  let itemCount = -1
  if (list) {
    const { data: items } = await sr.from('list_items').select('id').eq('list_id', list.id as string)
    itemCount = (items ?? []).length
  }
  const { data: wtpl } = await sr.from('wizard_templates').select('id, wizard_type, template_name').eq('family_id', FAMILY_ID).ilike('template_name', `${PREFIX}%`)
  // Post-deploy visibility: /lists page + My Customized
  await page.goto('/lists')
  await waitForAppReady(page)
  await page.waitForTimeout(1200)
  const onListsPage = await page.getByText(`${PREFIX} Prize Box`).first().isVisible({ timeout: 2000 }).catch(() => false)
  await shot(page, 'rewards-on-lists-page')
  await gotoStudio(page)
  await page.getByText(/My Customized/).first().click()
  await page.waitForTimeout(1000)
  const inCustomized = await page.getByText(`${PREFIX} Prize Box`).first().isVisible({ timeout: 2000 }).catch(() => false)
  await shot(page, 'rewards-in-customized')
  log('B7-rewards-deploy', { deployBtnText, listCreated: !!list, listType: list?.list_type ?? null, itemCount, wizardTemplateRows: wtpl, visibleOnListsPage: onListsPage, visibleInMyCustomized: inCustomized })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B8. Tracker tile deploy → dashboard_widgets row + renders on dashboard
// ─────────────────────────────────────────────────────────────
test('B8 — Tracker tile (tally-type) deploys a widget that renders', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)
  // Use the Gamification "Star / Sticker Chart" → StarChartWizard is separate;
  // drive a Trackers & Widgets tile instead: pick the first visible card.
  const sec = page.locator('h2').filter({ hasText: 'Trackers & Widgets' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  await sec.scrollIntoViewIfNeeded()
  const firstCard = sec.locator('div.snap-start').first()
  const cardName = await firstCard.locator('p').first().innerText()
  await firstCard.click()
  await page.waitForTimeout(400)
  await firstCard.getByRole('button', { name: /^customize$/i }).click({ force: true })
  await page.waitForTimeout(1200)
  const dialog = page.locator('[role="dialog"]').first()
  const cfgText = await dialog.innerText().catch(() => '')
  // Set the widget title
  const titleInput = dialog.locator('input').first()
  await titleInput.fill(`${PREFIX} Widget Probe`)
  await shot(page, 'widget-config')
  const deployBtn = dialog.getByRole('button', { name: /add to dashboard|deploy|create|save/i }).last()
  const deployLabel = await deployBtn.innerText().catch(() => '')
  await deployBtn.click({ force: true })
  await page.waitForTimeout(2500)
  const { data: widget } = await sr.from('dashboard_widgets').select('id, template_type, family_member_id, is_on_dashboard').eq('family_id', FAMILY_ID).eq('title', `${PREFIX} Widget Probe`).maybeSingle()
  // Does it render on the dashboard?
  await page.goto('/dashboard')
  await waitForAppReady(page)
  await page.waitForTimeout(1500)
  const onDashboard = await page.getByText(`${PREFIX} Widget Probe`).first().isVisible({ timeout: 3000 }).catch(() => false)
  await shot(page, 'widget-on-dashboard')
  log('B8-tracker-deploy', { cardName, cfgTextStart: cfgText.slice(0, 250), deployLabel, widgetRow: widget, rendersOnDashboard: onDashboard })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B9. Guided forms re-probe: blank Guided Form + blank SODAS open;
//     SODAS example prefill VALUE check (textarea contents)
// ─────────────────────────────────────────────────────────────
test('B9 — Guided form tiles: blank opens + example prefill values', async ({ page }) => {
  await loginAsMom(page)
  for (const name of ['Guided Form', 'SODAS']) {
    await gotoStudio(page)
    const sec = page.locator('h2').filter({ hasText: 'Guided Forms & Worksheets' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
    await sec.scrollIntoViewIfNeeded()
    const c = sec.locator('div.snap-start').filter({ hasText: name }).first()
    await c.scrollIntoViewIfNeeded({ timeout: 8000 })
    await c.click({ timeout: 8000 })
    await page.waitForTimeout(400)
    await c.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 })
    await page.waitForTimeout(1500)
    const state = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"]')
      return { dialogCount: dialogs.length, text: Array.from(dialogs).map(d => (d as HTMLElement).innerText).join('|').slice(0, 600) }
    })
    await shot(page, `guided-blank-${name.toLowerCase().replace(/\W+/g, '-')}`)
    log('B9-guided-blank', { name, ...state })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  // SODAS Sibling Conflict example — do any textareas carry prefilled content?
  await gotoStudio(page)
  const sec = page.locator('h2').filter({ hasText: 'Guided Forms & Worksheets' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const acc = sec.locator('button').filter({ hasText: /Example Templates \(/ }).first()
  if (await acc.isVisible({ timeout: 1500 }).catch(() => false)) { await acc.click(); await page.waitForTimeout(400) }
  const ex = sec.locator('div.snap-start').filter({ hasText: 'SODAS Sibling Conflict' }).first()
  await ex.scrollIntoViewIfNeeded({ timeout: 8000 })
  await ex.click({ timeout: 8000 })
  await page.waitForTimeout(400)
  await ex.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 })
  await page.waitForTimeout(1500)
  const dialog = page.locator('[role="dialog"]').first()
  const values = await dialog.locator('textarea, input[type="text"]').evaluateAll(
    els => els.map(e => (e as HTMLInputElement | HTMLTextAreaElement).value),
  ).catch(() => ['EVAL-FAIL'])
  log('B9-sodas-example-prefill', { fieldValues: values, anyPrefilled: values.some(v => v && v.length > 5) })
  await shot(page, 'guided-sodas-example')
  await page.keyboard.press('Escape')
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// B6. Opportunity Board blank: what does saving actually produce?
// ─────────────────────────────────────────────────────────────
test('B6 — Opportunity Board blank produces a single opportunity task (not a board)', async ({ page }) => {
  await loginAsMom(page)
  await gotoStudio(page)
  await customize(page, 'Task & Chore Templates', 'Opportunity Board')
  const dialog = page.locator('[role="dialog"]').first()
  await dialog.locator('input').first().fill(`${PREFIX} Opp Probe`)
  await page.waitForTimeout(300)
  await shot(page, 'opp-modal')
  const btnTexts = await dialog.locator('button').allInnerTexts()
  const createBtn = dialog.getByRole('button', { name: /assign & create|create/i }).last()
  await createBtn.click({ force: true })
  await page.waitForTimeout(3000)
  const { data: rows } = await sr.from('tasks').select('id, task_type, title, assignee_id').eq('family_id', FAMILY_ID).eq('title', `${PREFIX} Opp Probe`)
  const { data: oppLists } = await sr.from('lists').select('id').eq('family_id', FAMILY_ID).eq('title', `${PREFIX} Opp Probe`)
  log('B6-opportunity-blank', { buttons: btnTexts.slice(0, 12), tasksCreated: rows, listsCreated: oppLists })
  expect(true).toBe(true)
})
