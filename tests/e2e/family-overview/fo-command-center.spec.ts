/**
 * FO-COMMAND-CENTER — browser verification (2026-06-10)
 *
 * Family Overview becomes mom's command center (founder vision 2026-06-09):
 * spot-checking, category sections, Approvals, Queue, and Finances relocate
 * from the Tasks page; the Tasks page becomes purely personal with the
 * prioritization views + the Q2 inclusion control.
 *
 * Covers:
 *   1. Mom FO Overview: member columns render with the NEW section set
 *      (Routines + Sequential headers present in founder Q5 order)
 *   2. Mom FO Approvals tab: relocated PendingApprovalsSection shows a
 *      pending submission
 *   3. Mom FO Queue tab: relocated SortTab shows studio_queue items
 *   4. Mom FO Finances tab: relocated FinancesTab renders
 *   5. Spot-check: tapping a column header opens the member deep view with
 *      the founder tab set
 *   6. Tasks page is purely personal: own items only, no member pills, view
 *      carousel + inclusion pills present; Routines pill pulls routines in
 *   7. Ungranted dad: NO Family Overview tab on the perspective switcher
 *   8. Granted dad (view): FO tab appears, granted kid column visible, mom's
 *      column absent; spot-check toggle is view-only (toast, no completion)
 *   9. Deep link: /dashboard?view=family_overview&fotab=finances lands on
 *      the Finances tab; legacy /tasks?tab=finances redirects there
 *
 * Fixtures use the FOCC prefix; service-role create in beforeAll, surgical
 * cleanup in afterAll (leak-pass harness pattern).
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsDad } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { todayLocalIso } from '../helpers/dates'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ── Fixture names ──────────────────────────────────────────────────────────
const MOM_TASK = 'FOCC Mom Personal Task'
const MOM_ROUTINE = 'FOCC Mom Morning Flow'
const JORDAN_TASK = 'FOCC Jordan Spot Task'
const APPROVAL_TASK = 'FOCC Jordan Approval Task'
const QUEUE_ITEM = 'FOCC queue thought for sorting'

let familyId = ''
const memberIds: Record<string, string> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

async function clearGrants() {
  await supabase
    .from('member_permissions')
    .delete()
    .eq('family_id', familyId)
    .eq('permission_key', 'tasks_basic')
    .eq('granted_to', await memberId('Mark'))
}

async function cleanup() {
  const { data: taskRows } = await supabase
    .from('tasks').select('id').eq('family_id', familyId).ilike('title', 'FOCC%')
  for (const t of taskRows ?? []) {
    await supabase.from('task_completions').delete().eq('task_id', t.id)
  }
  await supabase.from('tasks').delete().eq('family_id', familyId).ilike('title', 'FOCC%')
  await supabase.from('studio_queue').delete().eq('family_id', familyId).ilike('content', 'FOCC%')
  await clearGrants()
}

test.describe('FO Command Center', () => {
  test.describe.configure({ retries: 1 })

  test.beforeAll(async () => {
    const { data: family, error } = await supabase
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const sarah = await memberId('Sarah')
    const jordan = await memberId('Jordan')

    await cleanup()

    // Tasks: mom personal task, mom routine (for the inclusion pill test),
    // a kid task (spot-check), and a kid task pending approval
    // NOTE: multi-row supabase inserts union the column set across rows and
    // send NULL for missing keys (bypassing column defaults) — keep every row
    // homogeneous or NOT NULL columns reject the batch.
    const { data: tasks, error: taskErr } = await supabase.from('tasks').insert([
      { family_id: familyId, created_by: sarah, assignee_id: sarah, title: MOM_TASK, task_type: 'task', status: 'pending', require_approval: false, source: 'manual' },
      { family_id: familyId, created_by: sarah, assignee_id: sarah, title: MOM_ROUTINE, task_type: 'routine', status: 'pending', require_approval: false, source: 'manual' },
      { family_id: familyId, created_by: sarah, assignee_id: jordan, title: JORDAN_TASK, task_type: 'task', status: 'pending', require_approval: false, source: 'manual' },
      { family_id: familyId, created_by: sarah, assignee_id: jordan, title: APPROVAL_TASK, task_type: 'task', status: 'pending_approval', require_approval: true, source: 'manual' },
    ]).select('id, title')
    if (taskErr) throw new Error(`task fixtures: ${taskErr.message}`)

    const approvalTask = (tasks ?? []).find(t => t.title === APPROVAL_TASK)
    if (!approvalTask) throw new Error('approval task fixture missing')
    const { error: compErr } = await supabase.from('task_completions').insert({
      task_id: approvalTask.id,
      member_id: jordan,
      family_member_id: jordan,
      approval_status: 'pending',
      period_date: todayLocalIso(),
    })
    if (compErr) throw new Error(`completion fixture: ${compErr.message}`)

    // Queue item (mom-owned → visible on her FO Queue tab)
    const { error: qErr } = await supabase.from('studio_queue').insert({
      family_id: familyId, owner_id: sarah, destination: 'task', content: QUEUE_ITEM, source: 'manual',
    })
    if (qErr) throw new Error(`queue fixture: ${qErr.message}`)
  })

  test.afterAll(async () => {
    await cleanup()
  })

  async function gotoFamilyOverview(page: import('@playwright/test').Page) {
    await page.goto('/dashboard?view=family_overview')
    await waitForAppReady(page)
    await expect(page.getByTestId('family-overview')).toBeVisible({ timeout: 15000 })
  }

  // ── 1. Overview columns + new section set ─────────────────────────────────
  test('Mom FO Overview renders member columns with Routines + Sequential sections', async ({ page }) => {
    await loginAsMom(page)
    await gotoFamilyOverview(page)

    // At least one member column with the new section headers
    await expect(page.getByTestId('section-header-routines').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('section-header-sequential').first()).toBeVisible()
    // Wired sections (founder Q9): victories + weekly_completion no longer stubs
    await expect(page.getByTestId('section-header-victories').first()).toBeVisible()
    await expect(page.getByTestId('section-header-weekly_completion').first()).toBeVisible()
    await expect(page.getByText('Weekly Completion — Coming soon')).not.toBeVisible()
  })

  // ── 2. Relocated Approvals tab ────────────────────────────────────────────
  test('Mom FO Approvals tab shows the pending submission (mastery fork home)', async ({ page }) => {
    await loginAsMom(page)
    await gotoFamilyOverview(page)

    await page.getByRole('tab', { name: /Approvals/ }).click()
    await expect(page.getByText('Pending Approvals')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(APPROVAL_TASK)).toBeVisible()
  })

  // ── 3. Relocated Queue tab (real SortTab) ─────────────────────────────────
  test('Mom FO Queue tab shows studio_queue items via SortTab', async ({ page }) => {
    await loginAsMom(page)
    await gotoFamilyOverview(page)

    await page.getByRole('tab', { name: /Queue/ }).click()
    await expect(page.getByText(QUEUE_ITEM)).toBeVisible({ timeout: 15000 })
  })

  // ── 3b. Deploy all (engine: REVIEW-ROUTE; button: FO-COMMAND-CENTER) ──────
  test('Deploy all knocks a task-destination queue item out to a real task', async ({ page }) => {
    await loginAsMom(page)
    await gotoFamilyOverview(page)

    await page.getByRole('tab', { name: /Queue/ }).click()
    await expect(page.getByText(QUEUE_ITEM)).toBeVisible({ timeout: 15000 })

    await page.getByTestId('queue-deploy-all').click()
    // Item leaves the queue…
    await expect(page.getByText(QUEUE_ITEM)).not.toBeVisible({ timeout: 15000 })

    // …and a real task row exists with the queue content as title
    await expect.poll(async () => {
      const { data } = await supabase
        .from('tasks').select('id').eq('family_id', familyId).eq('title', QUEUE_ITEM)
      return (data ?? []).length
    }, { timeout: 15000 }).toBeGreaterThan(0)

    // Cleanup the deployed task + restore a queue row for later tests
    await supabase.from('tasks').delete().eq('family_id', familyId).eq('title', QUEUE_ITEM)
    const sarah = await memberId('Sarah')
    await supabase.from('studio_queue')
      .delete().eq('family_id', familyId).eq('content', QUEUE_ITEM)
    await supabase.from('studio_queue').insert({
      family_id: familyId, owner_id: sarah, destination: 'task', content: QUEUE_ITEM, source: 'manual',
    })
  })

  // ── 4. Relocated Finances tab ─────────────────────────────────────────────
  test('Mom FO Finances tab renders the family financial surface', async ({ page }) => {
    await loginAsMom(page)
    await gotoFamilyOverview(page)

    await page.getByRole('tab', { name: 'Finances' }).click()
    // FinancesTab renders per-kid summaries / financial summary content
    await expect(page.getByText(/balance|allowance|financial/i).first()).toBeVisible({ timeout: 15000 })
  })

  // ── 5. Spot-check deep view ───────────────────────────────────────────────
  test('Tapping a column header opens the member spot-check with the tab set', async ({ page }) => {
    await loginAsMom(page)
    await gotoFamilyOverview(page)

    const jordan = await memberId('Jordan')
    await page.getByTestId(`column-header-${jordan}`).click()
    await expect(page.getByTestId('member-spot-check')).toBeVisible({ timeout: 15000 })

    // Founder tab set
    const spotCheck = page.getByTestId('member-spot-check')
    await expect(spotCheck.getByRole('tab', { name: 'My Tasks' })).toBeVisible()
    await expect(spotCheck.getByRole('tab', { name: 'Routines' })).toBeVisible()
    await expect(spotCheck.getByRole('tab', { name: 'Opportunities' })).toBeVisible()
    await expect(spotCheck.getByRole('tab', { name: 'Sequential' })).toBeVisible()

    // Jordan's task is there
    await expect(spotCheck.getByText(JORDAN_TASK)).toBeVisible()
  })

  // ── 6. Purely personal Tasks page + inclusion pills ───────────────────────
  test('Tasks page is personal: own items, no member pills, inclusion control works', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    // Own task visible; kid's task NOT (no member pills, no All pill)
    await expect(page.getByText(MOM_TASK)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(JORDAN_TASK)).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'All', exact: true })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Jordan/ })).not.toBeVisible()

    // Inclusion pills present; routines excluded by default
    await expect(page.getByTestId('task-view-inclusion')).toBeVisible()
    await expect(page.getByText(MOM_ROUTINE)).not.toBeVisible()

    // Toggle Routines in → mom's routine appears alongside tasks
    await page.getByTestId('inclusion-pill-routines').click()
    await expect(page.getByText(MOM_ROUTINE)).toBeVisible({ timeout: 10000 })
    // Session override exposes "Save as default"
    await expect(page.getByTestId('inclusion-save-default')).toBeVisible()
  })

  // ── 7. Ungranted dad: no FO tab ───────────────────────────────────────────
  test('Ungranted dad has no Family Overview tab', async ({ page }) => {
    await clearGrants()
    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await expect(page.getByRole('tab', { name: 'My Dashboard' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('tab', { name: 'Family Overview' })).not.toBeVisible()
  })

  // ── 8. Granted dad: scoped FO + view-only spot-check ──────────────────────
  test('Granted dad (view) sees only the granted kid; spot-check is view-only', async ({ page }) => {
    const sarah = await memberId('Sarah')
    const mark = await memberId('Mark')
    const jordan = await memberId('Jordan')

    const { error: gErr } = await supabase.from('member_permissions').insert({
      family_id: familyId, granting_member_id: sarah, granted_to: mark,
      target_member_id: jordan, permission_key: 'tasks_basic', access_level: 'view',
    })
    if (gErr) throw new Error(`grant: ${gErr.message}`)

    try {
      await loginAsDad(page)
      await page.goto('/dashboard')
      await waitForAppReady(page)

      // FO tab now exists for dad
      await page.getByRole('tab', { name: 'Family Overview' }).click()
      await expect(page.getByTestId('family-overview')).toBeVisible({ timeout: 15000 })

      // Jordan selectable/visible; Sarah never offered
      await expect(page.getByTestId(`column-header-${jordan}`)).toBeVisible({ timeout: 15000 })
      await expect(page.getByTestId(`column-header-${sarah}`)).not.toBeVisible()

      // Queue + Finances tabs are mom-only
      await expect(page.getByRole('tab', { name: /Queue/ })).not.toBeVisible()
      await expect(page.getByRole('tab', { name: 'Finances' })).not.toBeVisible()

      // Spot-check Jordan: view-only — toggle shows toast, no completion
      await page.getByTestId(`column-header-${jordan}`).click()
      const spotCheck = page.getByTestId('member-spot-check')
      await expect(spotCheck).toBeVisible({ timeout: 15000 })
      await expect(spotCheck.getByText('View only')).toBeVisible()
      await expect(spotCheck.getByText(JORDAN_TASK)).toBeVisible()

      const taskCard = spotCheck
        .getByText(JORDAN_TASK)
        .locator('xpath=ancestor::div[.//button[@aria-label="Mark complete"]][1]')
      await taskCard.getByRole('button', { name: 'Mark complete' }).first().click()
      await expect(page.getByText(/view-only access/i)).toBeVisible({ timeout: 10000 })

      const { data: taskRow } = await supabase
        .from('tasks').select('status').eq('family_id', familyId).eq('title', JORDAN_TASK).single()
      expect(taskRow?.status).toBe('pending')
    } finally {
      await clearGrants()
    }
  })

  // ── 9. Deep links ─────────────────────────────────────────────────────────
  test('Finances deep link + legacy /tasks?tab=finances redirect land on FO Finances', async ({ page }) => {
    await loginAsMom(page)

    await page.goto('/dashboard?view=family_overview&fotab=finances')
    await waitForAppReady(page)
    await expect(page.getByRole('tab', { name: 'Finances' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/balance|allowance|financial/i).first()).toBeVisible({ timeout: 15000 })

    // Legacy redirect
    await page.goto('/tasks?tab=finances')
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    await expect(page.getByTestId('family-overview')).toBeVisible({ timeout: 15000 })
  })
})
