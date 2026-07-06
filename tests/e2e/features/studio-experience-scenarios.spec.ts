/**
 * STUDIO-EXPERIENCE audit — Stage 2 integration scenarios (S1–S5).
 *
 * MANUAL AUDIT HELPER, NOT A REGRESSION TEST. Gated behind STUDIO_AUDIT=1.
 * Drives the founder's five real-mom scenarios end-to-end and records every
 * friction point / breakage into <OUT>/scenarios.ndjson. Fixtures prefixed
 * STUDIOAUD, swept before + after via service role.
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { loginAsMom, loginAsAlex, loginAsCasey, loginAsJordan } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })
test.skip(!process.env.STUDIO_AUDIT, 'Manual studio audit — set STUDIO_AUDIT=1 to run')

const OUT_DIR = process.env.STUDIO_AUDIT_OUT ?? path.join(process.cwd(), 'studio-audit-out')
const PREFIX = 'STUDIOAUD'

const sr = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
)

let FAMILY_ID = ''
const MEMBER: Record<string, string> = {}

function log(name: string, data: Record<string, unknown>) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.appendFileSync(path.join(OUT_DIR, 'scenarios.ndjson'), JSON.stringify({ probe: name, ...data }) + '\n')
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(OUT_DIR, `s-${name}.png`), fullPage: false }).catch(() => {})
}

async function cleanup() {
  const { data: fam } = await sr.from('families').select('id').eq('family_login_name_lower', 'testworthfamily').single()
  if (!fam) throw new Error('Testworth family not found')
  FAMILY_ID = fam.id as string
  const { data: members } = await sr.from('family_members').select('id, display_name').eq('family_id', FAMILY_ID)
  for (const m of members ?? []) MEMBER[m.display_name as string] = m.id as string

  const { data: lists } = await sr.from('lists').select('id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  const listIds = (lists ?? []).map(l => l.id as string)
  const { data: tasks } = await sr.from('tasks').select('id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  const taskIds = (tasks ?? []).map(t => t.id as string)
  const srcIds = [...listIds, ...taskIds]
  if (srcIds.length) {
    const { data: contracts } = await sr.from('contracts').select('id').in('source_id', srcIds)
    const cIds = (contracts ?? []).map(c => c.id as string)
    if (cIds.length) {
      await sr.from('contract_grant_log').delete().in('contract_id', cIds)
      await sr.from('deferred_grants').delete().in('contract_id', cIds)
      await sr.from('contracts').delete().in('id', cIds)
    }
    await sr.from('deed_firings').delete().in('source_id', srcIds)
  }
  if (listIds.length) {
    await sr.from('randomizer_draws').delete().in('list_id', listIds)
    await sr.from('list_shares').delete().in('list_id', listIds)
    await sr.from('list_items').delete().in('list_id', listIds)
    await sr.from('lists').delete().in('id', listIds)
  }
  if (taskIds.length) {
    await sr.from('task_rewards').delete().in('task_id', taskIds)
    await sr.from('task_completions').delete().in('task_id', taskIds)
    await sr.from('task_claims').delete().in('task_id', taskIds)
    await sr.from('task_assignments').delete().in('task_id', taskIds)
    await sr.from('routine_step_completions').delete().in('task_id', taskIds)
    await sr.from('tasks').delete().in('id', taskIds)
  }
  // bridge tasks created by claims carry the ITEM name — also sweep by known item names
  const { data: bridge } = await sr.from('tasks').select('id').eq('family_id', FAMILY_ID)
    .in('title', ['Vacuum the living room', 'Unload the dishwasher', 'Fold laundry'])
  const bIds = (bridge ?? []).map(t => t.id as string)
  if (bIds.length) {
    await sr.from('deed_firings').delete().in('source_id', bIds)
    await sr.from('task_rewards').delete().in('task_id', bIds)
    await sr.from('task_completions').delete().in('task_id', bIds)
    await sr.from('task_claims').delete().in('task_id', bIds)
    await sr.from('task_assignments').delete().in('task_id', bIds)
    await sr.from('tasks').delete().in('id', bIds)
  }
  const { data: tpls } = await sr.from('task_templates').select('id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  for (const t of tpls ?? []) {
    const { data: secs } = await sr.from('task_template_sections').select('id').eq('template_id', t.id as string)
    const secIds = (secs ?? []).map(s => s.id as string)
    if (secIds.length) await sr.from('task_template_steps').delete().in('section_id', secIds)
    await sr.from('task_template_sections').delete().eq('template_id', t.id as string)
  }
  if ((tpls ?? []).length) await sr.from('task_templates').delete().in('id', (tpls ?? []).map(t => t.id as string))
  await sr.from('wizard_templates').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  await sr.from('dashboard_widgets').delete().eq('family_id', FAMILY_ID).ilike('title', `${PREFIX}%`)
  await sr.from('mindsweep_holding').delete().eq('family_id', FAMILY_ID).ilike('content', `${PREFIX}%`)
  await sr.from('studio_queue').delete().eq('family_id', FAMILY_ID).ilike('content', `${PREFIX}%`)
  await sr.from('financial_transactions').delete().eq('family_id', FAMILY_ID).ilike('description', `%${PREFIX}%`)
}

test.beforeAll(async () => { await cleanup() })
test.afterAll(async () => { await cleanup() })
test.describe.configure({ timeout: 420_000, retries: 0 })

async function gotoStudio(page: Page) {
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(800)
}

// ─────────────────────────────────────────────────────────────
// S1 — "Chore board for my kids with money rewards" via NLC
// ─────────────────────────────────────────────────────────────
test('S1 — NLC chore board → deploy → Alex claims/completes → does money flow?', async ({ page }) => {
  const friction: string[] = [
    'NLC failure on this exact description already double-proven (B1 + prior S1 run) — driving the wizard directly from the shelf tile, as mom would after the error',
  ]
  await loginAsMom(page)
  await gotoStudio(page)

  // Open the blank ListReveal wizard from the shelf with opened-dialog retry
  const dialog = page.locator('[role="dialog"]').first()
  for (let attempt = 0; attempt < 3; attempt++) {
    const sec = page.locator('h2').filter({ hasText: 'Setup Wizards' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
    const c = sec.locator('div.snap-start').filter({ hasText: 'Extra Earning or Consequence Spinner' }).first()
    await c.scrollIntoViewIfNeeded({ timeout: 8000 })
    await c.click({ timeout: 8000 })
    await page.waitForTimeout(500)
    await c.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1500)
    if ((await page.locator('[role="dialog"]').count()) > 0) break
  }
  let opened = await dialog.innerText().catch(() => 'NO DIALOG')
  await shot(page, 's1-wizard-open')
  log('S1-nlc-opened', { openedStart: opened.slice(0, 300), friction: [...friction] })
  if (opened === 'NO DIALOG') {
    log('S1-abort', { reason: 'wizard did not open from shelf tile' })
    expect(true).toBe(true)
    return
  }

  // 1b. If the wizard opened without NLC prefill (fallback path): pick the
  // Opportunities type if a type step shows, then bulk-add the chores via the
  // wizard's own "Bulk Add with AI" (auditing that path in the same breath).
  const oppTypeCard = dialog.getByText('Opportunities', { exact: true }).first()
  if (await oppTypeCard.isVisible({ timeout: 1500 }).catch(() => false)) {
    await oppTypeCard.click({ force: true })
    await page.waitForTimeout(400)
    const n = dialog.getByRole('button', { name: /^next/i }).first()
    if (await n.isVisible({ timeout: 1000 }).catch(() => false)) { await n.click({ force: true }); await page.waitForTimeout(700) }
  }
  const bulkBtn = dialog.getByRole('button', { name: /bulk add with ai/i }).first()
  if (await bulkBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    const nameInput0 = dialog.getByPlaceholder(/earning opportunities|consequences/i).first()
    if (await nameInput0.isVisible({ timeout: 800 }).catch(() => false)) await nameInput0.fill(`${PREFIX} S1 Chore Board`)
    await bulkBtn.click({ force: true })
    await page.waitForTimeout(400)
    await dialog.locator('textarea').first().fill('Vacuum the living room $2\nUnload the dishwasher $1\nFold laundry $1.50')
    await dialog.getByRole('button', { name: /add to list/i }).first().click({ force: true })
    await page.waitForTimeout(12_000) // real Haiku parse
    await shot(page, 's1-bulk-added')
    const itemsNow = (await dialog.innerText().catch(() => '')).includes('Vacuum the living room')
    log('S1-bulk-add', { itemsParsed: itemsNow })
    if (!itemsNow) friction.push('Bulk Add with AI did not surface the pasted chores')
  }

  // 2. Walk the wizard. Fill list name if the field is empty; Next until Review; deploy.
  // Set the list name on whatever step exposes it.
  for (let i = 0; i < 8; i++) {
    const nameInput = dialog.getByPlaceholder(/list name/i).or(dialog.locator('input[type="text"]').first())
    if (await nameInput.first().isVisible({ timeout: 500 }).catch(() => false)) {
      const v = await nameInput.first().inputValue().catch(() => '')
      if (!v) await nameInput.first().fill(`${PREFIX} S1 Chore Board`).catch(() => {})
      if (v && !v.includes(PREFIX)) await nameInput.first().fill(`${PREFIX} S1 Chore Board`).catch(() => {})
    }
    const stepText = (await dialog.innerText().catch(() => '')).slice(0, 120).replace(/\n/g, ' / ')
    const deployBtn = dialog.getByRole('button', { name: /^(deploy|create board|create list|finish)$/i }).first()
    if (await deployBtn.isVisible({ timeout: 400 }).catch(() => false)) {
      await shot(page, `s1-review`)
      await deployBtn.click({ force: true })
      await page.waitForTimeout(3500)
      log('S1-deployed-click', { finalStep: stepText })
      break
    }
    const nextBtn = dialog.getByRole('button', { name: /^next/i }).first()
    if (await nextBtn.isVisible({ timeout: 400 }).catch(() => false)) {
      const disabled = await nextBtn.isDisabled().catch(() => false)
      if (disabled) friction.push(`Next disabled on step: ${stepText}`)
      await nextBtn.click({ force: true }).catch(() => friction.push(`Next unclickable on: ${stepText}`))
      await page.waitForTimeout(700)
    } else {
      friction.push(`No Next/Deploy on step: ${stepText}`)
      await shot(page, `s1-stuck-${i}`)
      break
    }
  }
  await shot(page, 's1-after-deploy')

  // 3. DB truth after deploy
  const { data: list } = await sr.from('lists').select('id, is_opportunity, list_type, eligible_members, is_shared').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX} S1%`).maybeSingle()
  let items: unknown[] = []
  let contracts: unknown[] = []
  let shares: unknown[] = []
  if (list) {
    items = (await sr.from('list_items').select('content, reward_type, reward_amount, opportunity_subtype').eq('list_id', list.id as string)).data ?? []
    contracts = (await sr.from('contracts').select('id, source_type, godmother_type, payload_amount').eq('source_id', list.id as string)).data ?? []
    shares = (await sr.from('list_shares').select('member_id').eq('list_id', list.id as string)).data ?? []
  }
  const { data: wtpl } = await sr.from('wizard_templates').select('id, wizard_type').eq('family_id', FAMILY_ID)
  log('S1-db-after-deploy', { listCreated: !!list, list, items, contracts, shares, wizardTemplates: wtpl, friction: [...friction] })
  if (!list) { expect(true).toBe(true); return }

  // Balance + grant-log baselines
  const { data: balBefore } = await sr.rpc('calculate_running_balance', { p_family_member_id: MEMBER['Alex'] }).then(r => r as { data: unknown })
  const { count: glBefore } = await sr.from('contract_grant_log').select('id', { count: 'exact', head: true }).eq('family_id', FAMILY_ID)

  // 4. Alex: browse → claim → complete
  await loginAsAlex(page)
  await page.goto('/tasks')
  await waitForAppReady(page)
  await page.waitForTimeout(1200)
  const oppTab = page.getByRole('button', { name: /opportunities/i }).or(page.getByText('Opportunities', { exact: true })).first()
  if (await oppTab.isVisible({ timeout: 3000 }).catch(() => false)) await oppTab.click()
  await page.waitForTimeout(1500)
  await shot(page, 's1-alex-opportunities')
  const boardVisible = await page.getByText(`${PREFIX} S1 Chore Board`).first().isVisible({ timeout: 3000 }).catch(() => false)
  const vacuumRow = page.getByText('Vacuum the living room').first()
  const vacuumVisible = await vacuumRow.isVisible({ timeout: 2000 }).catch(() => false)
  log('S1-alex-board', { boardVisible, vacuumVisible })
  if (vacuumVisible) {
    await vacuumRow.click({ force: true })
    await page.waitForTimeout(600)
    const claimBtn = page.getByRole('button', { name: /claim/i }).first()
    if (await claimBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await claimBtn.click({ force: true })
      await page.waitForTimeout(600)
      const confirmBtn = page.getByRole('button', { name: /claim|yes|confirm/i }).last()
      if (await confirmBtn.isVisible({ timeout: 1500 }).catch(() => false)) await confirmBtn.click({ force: true }).catch(() => {})
      await page.waitForTimeout(2000)
    } else friction.push('No Claim button found on board item')
    await shot(page, 's1-alex-after-claim')
  }
  // Bridge task?
  const { data: bridgeTask } = await sr.from('tasks').select('id, title, require_approval, source').eq('family_id', FAMILY_ID).eq('assignee_id', MEMBER['Alex']).eq('title', 'Vacuum the living room').maybeSingle()
  let bridgeRewards: unknown[] = []
  if (bridgeTask) bridgeRewards = (await sr.from('task_rewards').select('*').eq('task_id', bridgeTask.id as string)).data ?? []
  log('S1-bridge-task', { bridgeTask, bridgeRewards })

  if (bridgeTask) {
    // Complete it from Alex's My Tasks
    const myTab = page.getByRole('button', { name: /my tasks/i }).first()
    if (await myTab.isVisible({ timeout: 2000 }).catch(() => false)) await myTab.click()
    await page.waitForTimeout(1200)
    const taskRow = page.getByText('Vacuum the living room').first()
    if (await taskRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      // find its checkbox/complete affordance within the card
      const card = page.locator('div').filter({ hasText: 'Vacuum the living room' }).locator('button[aria-label*="omplete"], input[type="checkbox"], button:has-text("Done")').first()
      if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
        await card.click({ force: true })
        await page.waitForTimeout(2500)
      } else {
        // fallback: click the row then a Done button
        await taskRow.click({ force: true })
        await page.waitForTimeout(700)
        const doneBtn = page.getByRole('button', { name: /mark (as )?done|complete|done/i }).first()
        if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) { await doneBtn.click({ force: true }); await page.waitForTimeout(2500) }
        else friction.push('No visible complete affordance on bridge task')
      }
      await shot(page, 's1-alex-completed')
    } else friction.push('Bridge task not visible on Alex My Tasks')

    const { data: comp } = await sr.from('task_completions').select('id, approval_status, completion_type').eq('task_id', bridgeTask.id as string).maybeSingle()
    log('S1-completion', { completion: comp })

    // 5. Mom approves if pending
    if (comp && (comp as { approval_status?: string }).approval_status === 'pending') {
      await loginAsMom(page)
      await page.goto('/dashboard?view=family_overview&fotab=approvals')
      await waitForAppReady(page)
      await page.waitForTimeout(2000)
      await shot(page, 's1-mom-approvals')
      const approveBtn = page.getByRole('button', { name: /^approve$/i }).first()
      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveBtn.click({ force: true })
        await page.waitForTimeout(3000)
      } else friction.push('Approve button not found on FO Approvals for the bridge completion')
    }

    // 6. Money truth
    const { data: ftx } = await sr.from('financial_transactions').select('amount, description, source_type, created_at').eq('family_member_id', MEMBER['Alex']).order('created_at', { ascending: false }).limit(5)
    const { count: glAfter } = await sr.from('contract_grant_log').select('id', { count: 'exact', head: true }).eq('family_id', FAMILY_ID)
    const { data: deeds } = await sr.from('deed_firings').select('source_type, source_id').eq('family_member_id', MEMBER['Alex']).order('fired_at', { ascending: false }).limit(3)
    log('S1-money-truth', {
      balanceBefore: balBefore ?? null,
      recentTransactions: ftx,
      grantLogDelta: (glAfter ?? 0) - (glBefore ?? 0),
      recentDeeds: deeds,
      friction,
    })
  }

  // 7. Eligibility leak: board shared only per wizard picks — does Casey see it?
  await loginAsCasey(page)
  await page.goto('/tasks')
  await waitForAppReady(page)
  await page.waitForTimeout(1200)
  const oppTab2 = page.getByRole('button', { name: /opportunities/i }).first()
  if (await oppTab2.isVisible({ timeout: 3000 }).catch(() => false)) await oppTab2.click()
  await page.waitForTimeout(1500)
  const caseySees = await page.getByText(`${PREFIX} S1 Chore Board`).first().isVisible({ timeout: 2500 }).catch(() => false)
  await shot(page, 's1-casey-board')
  log('S1-eligibility', { caseySeesBoard: caseySees, note: 'wizard shares via list_shares; opportunities tab scopes by eligible_members (null=everyone)' })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// S2 — Progress Chart for Casey (reading) → completion → godmothers
// ─────────────────────────────────────────────────────────────
test('S2 — Progress chart: deploy → Casey completes → tally + milestone fire', async ({ page }) => {
  const friction: string[] = []
  await loginAsMom(page)
  await gotoStudio(page)
  const sec = page.locator('h2').filter({ hasText: 'Setup Wizards' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const c = sec.locator('div.snap-start').filter({ hasText: 'Set Up a Progress Chart' }).first()
  await c.scrollIntoViewIfNeeded({ timeout: 8000 })
  await c.click({ timeout: 8000 })
  await page.waitForTimeout(400)
  await c.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 })
  await page.waitForTimeout(1200)
  const dialog = page.locator('[role="dialog"]').first()

  // Step 1 Name It
  await dialog.locator('input').first().fill(`${PREFIX} S2 Reading Chart`)
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(600)
  // Step 2 Pick Action — name the action task
  const actionInput = dialog.locator('input').first()
  if (await actionInput.isVisible({ timeout: 1500 }).catch(() => false)) {
    await actionInput.fill(`${PREFIX} S2 Read 20 minutes`).catch(() => {})
  }
  await shot(page, 's2-action')
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(600)
  // Step 3 Chart Display — keep defaults
  await shot(page, 's2-display')
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(600)
  // Step 4 Milestones — record what's offered, keep defaults
  const milestonesText = (await dialog.innerText().catch(() => '')).slice(0, 600)
  await shot(page, 's2-milestones')
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(600)
  // Step 5 Assign — pick Casey
  const caseyBtn = dialog.getByRole('button', { name: 'Casey' }).or(dialog.getByText('Casey', { exact: true })).first()
  if (await caseyBtn.isVisible({ timeout: 2000 }).catch(() => false)) await caseyBtn.click({ force: true })
  else friction.push('Casey pill not found on Assign step')
  await shot(page, 's2-assign')
  await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
  await page.waitForTimeout(600)
  // Step 6 Review → deploy
  const deployBtn = dialog.getByRole('button', { name: /deploy|create|finish/i }).last()
  const label = await deployBtn.innerText().catch(() => '')
  await shot(page, 's2-review')
  await deployBtn.click({ force: true })
  await page.waitForTimeout(3500)

  // DB truth
  const { data: task } = await sr.from('tasks').select('id, assignee_id, recurrence_details, require_approval').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX} S2 Read%`).maybeSingle()
  const { data: widget } = await sr.from('dashboard_widgets').select('id, template_type, family_member_id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX} S2%`).maybeSingle()
  let contracts: unknown[] = []
  if (task) contracts = (await sr.from('contracts').select('id, source_type, godmother_type, if_pattern, if_n').eq('source_id', task.id as string)).data ?? []
  log('S2-db-after-deploy', { deployLabel: label, milestonesText, taskCreated: !!task, widgetCreated: !!widget, widget, contracts, friction: [...friction] })
  if (!task || !widget) { expect(true).toBe(true); return }

  // Casey completes the action task twice (tally x2)
  await loginAsCasey(page)
  for (let round = 1; round <= 2; round++) {
    await page.goto('/tasks')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    const row = page.getByText(`${PREFIX} S2 Read 20 minutes`).first()
    const vis = await row.isVisible({ timeout: 3000 }).catch(() => false)
    if (!vis) { friction.push(`round ${round}: action task not visible on Casey /tasks`); break }
    const btn = page.locator('div').filter({ hasText: `${PREFIX} S2 Read 20 minutes` }).locator('button[aria-label*="omplete"], input[type="checkbox"], button:has-text("Done")').first()
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click({ force: true })
      await page.waitForTimeout(3000)
    } else { friction.push(`round ${round}: no complete affordance`); break }
    await shot(page, `s2-casey-complete-${round}`)
  }

  // Godmother truth
  let widgetPoints: unknown[] = []
  widgetPoints = (await sr.from('widget_data_points').select('value, recorded_date, recorded_at').eq('widget_id', widget.id as string)).data ?? []
  const { data: gl } = await sr.from('contract_grant_log').select('godmother_type, status, error_message').eq('family_id', FAMILY_ID).order('created_at', { ascending: false }).limit(10)
  log('S2-godmother-truth', { widgetDataPoints: widgetPoints, recentGrantLog: gl, friction })

  // Casey dashboard shows the widget? (widget grid lazy-renders — scroll it in)
  await page.goto('/dashboard')
  await waitForAppReady(page)
  await page.waitForTimeout(1500)
  for (let s = 0; s < 5; s++) { await page.mouse.wheel(0, 1500); await page.waitForTimeout(400) }
  const widgetOnDash = await page.getByText(`${PREFIX} S2 Reading Chart`).first().isVisible({ timeout: 3000 }).catch(() => false)
  await shot(page, 's2-casey-dashboard')
  log('S2-dashboard', { widgetOnCaseyDashboard: widgetOnDash })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// S3 — AI routine → deploy to Jordan → Guided dashboard; linked-step affordance
// ─────────────────────────────────────────────────────────────
test('S3 — Routine Builder AI → deploy to Jordan → renders on Guided dashboard', async ({ page }) => {
  const friction: string[] = []
  await loginAsMom(page)
  await gotoStudio(page)
  const sec = page.locator('h2').filter({ hasText: 'Setup Wizards' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const dialog = page.locator('[role="dialog"]').first()
  for (let attempt = 0; attempt < 3; attempt++) {
    const c = sec.locator('div.snap-start').filter({ hasText: 'Routine Builder (AI)' }).first()
    await c.scrollIntoViewIfNeeded({ timeout: 8000 })
    await c.click({ timeout: 8000 })
    await page.waitForTimeout(500)
    await c.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1200)
    if ((await page.locator('[role="dialog"]').count()) > 0) break
  }
  await dialog.getByPlaceholder(/morning routine|bedroom/i).first().fill(`${PREFIX} S3 Morning`)
  await dialog.locator('textarea').first().fill('Every morning: make bed, brush teeth, get dressed. Then a surprise fun activity each day.')
  // SetupWizard nav: Next = parse (real Haiku roundtrip), then finishLabel "Use This Routine"
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(18_000)
  await shot(page, 's3-parsed')
  const parsed = (await dialog.innerText().catch(() => '')).slice(0, 700)
  const acceptBtn = dialog.getByRole('button', { name: /use this routine/i }).first()
  if (await acceptBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await acceptBtn.click({ force: true })
    await page.waitForTimeout(1800)
  } else friction.push('No "Use This Routine" button after AI parse — parse may have failed')
  await shot(page, 's3-task-modal')
  const modal = page.locator('[role="dialog"]').last()
  const modalText = (await modal.innerText().catch(() => '')).slice(0, 500)
  // Record linked-step affordance discoverability: look for "link" language in the routine editor
  const linkAffordance = await page.getByText(/linked|link to|sequential|randomizer/i).first().isVisible({ timeout: 1500 }).catch(() => false)
  // Assign to Jordan + create
  const jordanPill = modal.getByRole('button', { name: 'Jordan' }).first()
  if (await jordanPill.isVisible({ timeout: 2000 }).catch(() => false)) await jordanPill.click({ force: true })
  else friction.push('Jordan pill not directly visible in TaskCreationModal (assignment section may need expansion)')
  const createBtn = modal.getByRole('button', { name: /assign & create/i }).first()
  if (await createBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createBtn.click({ force: true })
    await page.waitForTimeout(3500)
  } else friction.push('Assign & Create not found')
  await shot(page, 's3-created')

  const { data: task } = await sr.from('tasks').select('id, task_type, assignee_id, template_id').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX} S3%`).maybeSingle()
  let sections: unknown[] = []
  if (task?.template_id) {
    sections = (await sr.from('task_template_sections').select('section_name, frequency_rule').eq('template_id', task.template_id as string)).data ?? []
  }
  log('S3-db', { parsedPreview: parsed.slice(0, 300), modalTextStart: modalText.slice(0, 200), linkAffordanceVisibleInEditor: linkAffordance, task, sections, friction: [...friction] })
  if (!task) { expect(true).toBe(true); return }

  // Jordan's Guided dashboard renders it?
  await loginAsJordan(page)
  await page.goto('/dashboard')
  await waitForAppReady(page)
  await page.waitForTimeout(2000)
  for (let s = 0; s < 4; s++) { await page.mouse.wheel(0, 1200); await page.waitForTimeout(300) }
  const onGuided = await page.getByText(`${PREFIX} S3 Morning`).first().isVisible({ timeout: 4000 }).catch(() => false)
  await shot(page, 's3-jordan-dashboard')
  log('S3-guided-render', { routineVisibleOnGuidedDashboard: onGuided, friction })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// S4 — Shared shopping list wizard → Mark adds an item
// ─────────────────────────────────────────────────────────────
test('S4 — Shared Family Shopping List → deploy → Mark sees + adds item', async ({ page }) => {
  const friction: string[] = []
  await loginAsMom(page)
  await gotoStudio(page)
  const sec = page.locator('h2').filter({ hasText: 'List Templates' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
  const acc = sec.locator('button').filter({ hasText: /Example Templates \(/ }).first()
  if (await acc.isVisible({ timeout: 1500 }).catch(() => false)) { await acc.click(); await page.waitForTimeout(400) }
  const dialog = page.locator('[role="dialog"]').first()
  for (let attempt = 0; attempt < 3; attempt++) {
    const c = sec.locator('div.snap-start').filter({ hasText: 'Shared Family Shopping List' }).first()
    await c.scrollIntoViewIfNeeded({ timeout: 8000 })
    await c.click({ timeout: 8000 })
    await page.waitForTimeout(500)
    await c.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(1200)
    if ((await page.locator('[role="dialog"]').count()) > 0) break
  }

  // Explicit step walk (the generic walker previously matched the "Things to get done" tile as a deploy button)
  // Step 1 Purpose: pick Shopping / groceries
  const shoppingTile = dialog.getByText('Shopping / groceries').first()
  if (await shoppingTile.isVisible({ timeout: 2000 }).catch(() => false)) await shoppingTile.click({ force: true })
  else friction.push('Purpose step: Shopping tile not visible (preset may have pre-selected)')
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(800)
  // Step 2 Items: rename if possible, then Next (preset items may exist)
  const s4NameInput = dialog.getByPlaceholder(/name/i).first()
  if (await s4NameInput.isVisible({ timeout: 800 }).catch(() => false)) await s4NameInput.fill(`${PREFIX} S4 Groceries`).catch(() => {})
  await shot(page, 's4-items')
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(800)
  // Step 3 Sharing: pick Mark
  const markPill = dialog.getByRole('button', { name: 'Mark' }).first()
  if (await markPill.isVisible({ timeout: 1500 }).catch(() => false)) await markPill.click({ force: true })
  else friction.push('Sharing step: Mark pill not visible')
  // also try renaming here if a list-name input lives on this wizard's later steps
  await shot(page, 's4-sharing')
  await dialog.getByRole('button', { name: /^next/i }).first().click({ force: true })
  await page.waitForTimeout(800)
  // Steps 4-5 (Organize, Extras): Next through, renaming when an input shows
  for (let i = 0; i < 3; i++) {
    const ni = dialog.getByPlaceholder(/name/i).first()
    if (await ni.isVisible({ timeout: 400 }).catch(() => false)) {
      const v = await ni.inputValue().catch(() => '')
      if (!v.includes(PREFIX)) await ni.fill(`${PREFIX} S4 Groceries`).catch(() => {})
    }
    const finishBtn = dialog.getByRole('button', { name: /^(deploy|create list|finish|create)$/i }).first()
    if (await finishBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await shot(page, 's4-review')
      await finishBtn.click({ force: true })
      await page.waitForTimeout(3500)
      break
    }
    const nx = dialog.getByRole('button', { name: /^next/i }).first()
    if (await nx.isVisible({ timeout: 500 }).catch(() => false)) { await nx.click({ force: true }); await page.waitForTimeout(800) }
    else { friction.push('S4 walker stuck — no Next/finish'); await shot(page, `s4-stuck-${i}`); break }
  }
  let { data: list } = await sr.from('lists').select('id, title, list_type, is_shared, is_always_on, include_in_shopping_mode').eq('family_id', FAMILY_ID).ilike('title', `${PREFIX} S4%`).maybeSingle()
  if (!list) {
    // rename may not have landed — fall back to any list created in the last 3 minutes
    const since = new Date(Date.now() - 3 * 60_000).toISOString()
    const { data: recent } = await sr.from('lists').select('id, title, list_type, is_shared, is_always_on, include_in_shopping_mode, created_at').eq('family_id', FAMILY_ID).gte('created_at', since).order('created_at', { ascending: false })
    list = (recent ?? [])[0] as typeof list
    if (list) friction.push(`rename did not land — created list title: ${(list as { title?: string }).title}`)
  }
  let itemCount = -1; let shares: unknown[] = []
  if (list) {
    itemCount = ((await sr.from('list_items').select('id').eq('list_id', list.id as string)).data ?? []).length
    shares = (await sr.from('list_shares').select('member_id, can_edit').eq('list_id', list.id as string)).data ?? []
  }
  log('S4-db', { listCreated: !!list, list, itemCount, shares, friction: [...friction] })
  if (!list) { expect(true).toBe(true); return }

  // Mark: sees + adds an item
  const listTitle = (list as { title?: string }).title ?? `${PREFIX} S4 Groceries`
  const { loginAsDad } = await import('../helpers/auth')
  await loginAsDad(page)
  await page.goto('/lists')
  await waitForAppReady(page)
  await page.waitForTimeout(1500)
  const seen = await page.getByText(listTitle).first().isVisible({ timeout: 3000 }).catch(() => false)
  log('S4-mark-sees', { seen, listTitle })
  if (seen) {
    await page.getByText(listTitle).first().click()
    await page.waitForTimeout(1500)
    const addInput = page.getByPlaceholder(/add/i).first()
    if (await addInput.isVisible({ timeout: 2500 }).catch(() => false)) {
      await addInput.fill('Bananas')
      await addInput.press('Enter')
      await page.waitForTimeout(2000)
      const { data: item } = await sr.from('list_items').select('id, content').eq('list_id', list.id as string).eq('content', 'Bananas').maybeSingle()
      log('S4-mark-added', { bananasPersisted: !!item })
    } else friction.push('No add-item input visible for Mark on the shared list')
    await shot(page, 's4-mark-list')
  }
  log('S4-final', { friction })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// TOUR — Progress Chart wizard visual pass (Convention #277)
// Post-ST-0 + F-23-micro-fix Mom-UI verification: full flow to the
// SUCCESS SCREEN, desktop + mobile, plus Casey dashboard/tasks render.
// Screenshots: m77-*.png in OUT_DIR. Claude reads them and records
// verdicts in the STUDIO-EXPERIENCE Mom-UI table.
// ─────────────────────────────────────────────────────────────
test('TOUR — progress chart wizard visual pass', async ({ page }) => {
  async function walkWizard(tag: string, chartName: string) {
    await gotoStudio(page)
    const dialog = page.locator('[role="dialog"]').first()
    for (let attempt = 0; attempt < 3; attempt++) {
      const sec = page.locator('h2').filter({ hasText: 'Setup Wizards' }).first().locator('xpath=ancestor::div[contains(@class, "mb-8")]')
      const c = sec.locator('div.snap-start').filter({ hasText: 'Set Up a Progress Chart' }).first()
      await c.scrollIntoViewIfNeeded({ timeout: 8000 })
      await c.click({ timeout: 8000 })
      await page.waitForTimeout(500)
      await c.getByRole('button', { name: /^customize$/i }).click({ force: true, timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(1200)
      if ((await page.locator('[role="dialog"]').count()) > 0) break
    }
    await dialog.locator('input').first().fill(chartName)
    await shot(page, `m77-${tag}-1-name`)
    await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
    await page.waitForTimeout(600)
    await shot(page, `m77-${tag}-2-action`)
    await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
    await page.waitForTimeout(600)
    await shot(page, `m77-${tag}-3-display`)
    await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
    await page.waitForTimeout(600)
    await shot(page, `m77-${tag}-4-milestones`)
    await dialog.getByRole('button', { name: /next/i }).first().click({ force: true })
    await page.waitForTimeout(600)
    // Select Casey with verification — the pill click can miss on mobile
    const nextBtn = dialog.getByRole('button', { name: /^next/i }).first()
    for (let sel = 0; sel < 3; sel++) {
      const caseyBtn = dialog.getByRole('button', { name: 'Casey' }).first()
      await caseyBtn.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
      await caseyBtn.click({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(500)
      const gated = await dialog.getByText(/pick at least one child/i).isVisible({ timeout: 400 }).catch(() => false)
      const nextDisabled = await nextBtn.isDisabled().catch(() => false)
      if (!gated && !nextDisabled) break
    }
    await shot(page, `m77-${tag}-5-assign`)
    await nextBtn.click({ force: true })
    await page.waitForTimeout(800)
    await shot(page, `m77-${tag}-6-review`)
    await dialog.getByRole('button', { name: /^deploy$/i }).last().click({ force: true, timeout: 15000 })
    await page.waitForTimeout(4000)
    await shot(page, `m77-${tag}-7-SUCCESS`)
    const successText = await dialog.innerText().catch(() => 'DIALOG GONE')
    log(`TOUR-${tag}-success-screen`, { text: successText.slice(0, 500) })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  await loginAsMom(page)
  // Desktop pass
  await page.setViewportSize({ width: 1440, height: 900 })
  await walkWizard('desktop', `${PREFIX} Tour Chart`)
  // Mobile pass
  await page.setViewportSize({ width: 375, height: 812 })
  await walkWizard('mobile', `${PREFIX} Tour Chart M`)
  await page.setViewportSize({ width: 1280, height: 720 })

  // Kid-side render: Casey dashboard widget + action task
  await loginAsCasey(page)
  await page.goto('/dashboard')
  await waitForAppReady(page)
  await page.waitForTimeout(1500)
  for (let s = 0; s < 5; s++) { await page.mouse.wheel(0, 1400); await page.waitForTimeout(300) }
  await shot(page, 'm77-casey-dashboard')
  const widgetVisible = await page.getByText(`${PREFIX} Tour Chart`).first().isVisible({ timeout: 3000 }).catch(() => false)
  await page.goto('/tasks')
  await waitForAppReady(page)
  await page.waitForTimeout(1500)
  await shot(page, 'm77-casey-tasks')
  const taskVisible = await page.getByText(`${PREFIX} Tour Chart`).first().isVisible({ timeout: 3000 }).catch(() => false)
  log('TOUR-casey-render', { widgetVisible, taskVisible })
  expect(true).toBe(true)
})

// ─────────────────────────────────────────────────────────────
// S5 — MindSweep brain-dump: does configuration-worthy detection exist?
// ─────────────────────────────────────────────────────────────
test('S5 — MindSweep chore-board dump: composition proposal or plain classification?', async ({ page }) => {
  await loginAsMom(page)
  await page.goto('/sweep')
  await waitForAppReady(page)
  await page.waitForTimeout(1500)
  const ta = page.locator('textarea').first()
  if (!(await ta.isVisible({ timeout: 3000 }).catch(() => false))) {
    log('S5-abort', { reason: 'no textarea on /sweep' })
    expect(true).toBe(true)
    return
  }
  await ta.fill(`${PREFIX} I need a chore board for my kids with money rewards - vacuum for $2, dishes for $1, and a potty chart for Ruthie with a prize after 10 trips`)
  const sweepBtn = page.getByRole('button', { name: /sweep now|sweep/i }).first()
  await sweepBtn.click({ force: true })
  await page.waitForTimeout(18_000) // classification roundtrip
  await shot(page, 's5-mindsweep-result')
  const resultText = await page.evaluate(() => ((document.querySelector('main') ?? document.body) as HTMLElement).innerText.slice(0, 2000))
  const mentionsWizard = /wizard|set up|chart for|board for|want me to start/i.test(resultText)
  log('S5-mindsweep', { resultText: resultText.slice(0, 1200), anyCompositionProposalLanguage: mentionsWizard })
  expect(true).toBe(true)
})
