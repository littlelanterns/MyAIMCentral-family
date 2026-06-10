/**
 * Review & Route Direct Deploy — RR-DEPLOY-SCOPING build (2026-06-10)
 *
 * Origin bug: dad approved 11 LiLa-classified task cards and they all landed
 * in studio_queue requiring per-item modal configuration. The card-by-card
 * review IS the Human-in-the-Mix step — approved items must become REAL
 * records.
 *
 * Proves in a real browser (dad's adult shell, Notepad drawer):
 *   1. Route All on pre-extracted items: task items become tasks rows
 *      (assigned to dad, source='review_route'), NOT studio_queue rows
 *   2. Calendar items still go to studio_queue (date review needed)
 *   3. The confirmation summary toast reports where things went
 *
 * Extraction itself (ai-parse) is NOT exercised — items are seeded directly
 * into notepad_extracted_items so the test is deterministic and free.
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsDad, loginAsMom } from '../helpers/auth'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const admin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const TAB_TITLE = 'RRDEPLOY Brain Dump'
const TASK_A = 'RRDEPLOY fix the fence gate'
const TASK_B = 'RRDEPLOY oil the garage door'
const CAL_ITEM = 'RRDEPLOY dentist appointment Friday 2pm'

let familyId = ''
let markId = ''
let tabId = ''

async function cleanup() {
  await admin.from('tasks').delete().eq('family_id', familyId).ilike('title', 'RRDEPLOY%')
  await admin.from('studio_queue').delete().eq('family_id', familyId).ilike('content', 'RRDEPLOY%')
  const { data: tabs } = await admin
    .from('notepad_tabs')
    .select('id')
    .eq('family_id', familyId)
    .eq('title', TAB_TITLE)
  for (const t of tabs ?? []) {
    await admin.from('notepad_extracted_items').delete().eq('tab_id', t.id)
    await admin.from('notepad_tabs').delete().eq('id', t.id)
  }
}

test.describe('Review & Route Direct Deploy', () => {
  test.describe.configure({ retries: 1 })

  test.beforeAll(async () => {
    const { data: family, error } = await admin
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const { data: mark, error: markErr } = await admin
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('display_name', 'Mark')
      .single()
    if (markErr || !mark) throw new Error(`Mark not found: ${markErr?.message}`)
    markId = mark.id

    await cleanup()

    // Seed the notepad tab + pre-extracted items (2 tasks + 1 calendar)
    const { data: tab, error: tabErr } = await admin
      .from('notepad_tabs')
      .insert({
        family_id: familyId,
        member_id: markId,
        title: TAB_TITLE,
        content: `${TASK_A}\n${TASK_B}\n${CAL_ITEM}`,
      })
      .select('id')
      .single()
    if (tabErr || !tab) throw new Error(`tab seed failed: ${tabErr?.message}`)
    tabId = tab.id

    const { error: itemsErr } = await admin.from('notepad_extracted_items').insert([
      {
        tab_id: tabId, family_id: familyId, extracted_content: TASK_A,
        item_type: 'action_item', suggested_destination: 'tasks',
        routing_destination: 'tasks', confidence: 0.95, status: 'pending',
      },
      {
        tab_id: tabId, family_id: familyId, extracted_content: TASK_B,
        item_type: 'action_item', suggested_destination: 'tasks',
        routing_destination: 'tasks', confidence: 0.92, status: 'pending',
      },
      {
        tab_id: tabId, family_id: familyId, extracted_content: CAL_ITEM,
        item_type: 'general', suggested_destination: 'calendar',
        routing_destination: 'calendar', confidence: 0.9, status: 'pending',
      },
    ])
    if (itemsErr) throw new Error(`items seed failed: ${itemsErr.message}`)
  })

  test.afterAll(async () => {
    await cleanup()
  })

  test('Route All deploys tasks directly, queues calendar, shows summary', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Open the Notepad drawer (right-edge pull tab, desktop)
    await page.getByRole('button', { name: 'Open Notepad' }).click()

    // Select the seeded tab (drawer may open on tabs view or another tab's editor)
    const tabEntry = page.getByText(TAB_TITLE, { exact: false }).first()
    if (await tabEntry.isVisible().catch(() => false)) {
      await tabEntry.click()
    }

    // Reach Review & Route — direct button if present, else via Send to...
    const reviewBtn = page.getByText('Review & Route', { exact: false }).first()
    if (await reviewBtn.isVisible().catch(() => false)) {
      await reviewBtn.click()
    } else {
      await page.getByText('Send to...', { exact: false }).first().click()
      await page.getByText('Review & Route', { exact: false }).first().click()
    }

    // Pre-seeded items render as review cards immediately (no AI call)
    await expect(page.getByText(TASK_A)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(TASK_B)).toBeVisible()
    await expect(page.getByText(CAL_ITEM)).toBeVisible()

    // Route all 3 pending
    await page.getByRole('button', { name: /Route All 3 Pending/i }).click()

    // Summary toast: 2 tasks direct + 1 queued (calendar)
    await expect(page.getByText(/2 tasks added to your Tasks/i)).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/1 sent to your Queue/i)).toBeVisible()

    // ── DB assertions (service role) ──────────────────────────────────

    // Tasks created directly — assigned to dad, correct source
    const { data: tasks } = await admin
      .from('tasks')
      .select('id, title, assignee_id, created_by, source, status')
      .eq('family_id', familyId)
      .ilike('title', 'RRDEPLOY%')
    expect(tasks?.length, 'both task items should be real tasks rows').toBe(2)
    for (const t of tasks ?? []) {
      expect(t.assignee_id).toBe(markId)
      expect(t.created_by).toBe(markId)
      expect(t.source).toBe('review_route')
      expect(t.status).toBe('pending')
    }

    // NO task rows in studio_queue — that was the bug
    const { data: queueTasks } = await admin
      .from('studio_queue')
      .select('id')
      .eq('family_id', familyId)
      .eq('destination', 'task')
      .ilike('content', 'RRDEPLOY%')
    expect(queueTasks?.length, 'task items must NOT land in studio_queue anymore').toBe(0)

    // Calendar item DID go to the queue (date review needed)
    const { data: queueCal } = await admin
      .from('studio_queue')
      .select('id, destination')
      .eq('family_id', familyId)
      .eq('destination', 'calendar')
      .ilike('content', 'RRDEPLOY%')
    expect(queueCal?.length, 'calendar item keeps the queue path').toBe(1)

    // Extracted items all marked routed
    const { data: extracted } = await admin
      .from('notepad_extracted_items')
      .select('status')
      .eq('tab_id', tabId)
    expect(extracted?.every(i => i.status === 'routed')).toBe(true)
  })

  test("Mom's queue is mine-by-default — dad's items behind his pill, Deploy all scoped", async ({ page }) => {
    // Fixture: one queue item owned by Mark (the calendar item from test 1 may
    // already exist; seed a fresh deterministic one regardless).
    const DAD_QUEUE = 'RRDEPLOY dad queue item for filter test'
    await admin.from('studio_queue').insert({
      family_id: familyId,
      owner_id: markId,
      destination: 'task',
      content: DAD_QUEUE,
      source: 'review_route',
    })

    await loginAsMom(page)
    await page.goto('/dashboard?view=family_overview&fotab=queue')
    await page.waitForLoadState('networkidle')

    // Owner filter renders (mom has another member with pending items)
    const filterRow = page.locator('[data-testid="queue-owner-filter"]')
    await expect(filterRow).toBeVisible({ timeout: 15000 })

    // Default = Mine → dad's item NOT visible
    await expect(page.getByText(DAD_QUEUE)).toHaveCount(0)

    // Tap Mark's pill → his item appears
    await filterRow.getByRole('button', { name: /Mark \(\d+\)/ }).click()
    await expect(page.getByText(DAD_QUEUE)).toBeVisible()

    // Deploy all button count reflects the VISIBLE (Mark's) set, never blank-family
    const deployBtn = page.locator('[data-testid="queue-deploy-all"]')
    if (await deployBtn.isVisible().catch(() => false)) {
      await expect(deployBtn).not.toContainText('(0)')
    }

    // Back to Mine → hidden again
    await filterRow.getByRole('button', { name: /Mine \(\d+\)/ }).click()
    await expect(page.getByText(DAD_QUEUE)).toHaveCount(0)
  })
})
