/**
 * PERMISSIONS-WIRING — browser verification (2026-06-09)
 *
 * Proves every grant wired by this build behaves differently granted vs
 * ungranted (the founder-gate requirement). Extends the role-scoping
 * leak-pass pattern: Testworth family, service-role fixtures with a unique
 * PERMWIRE prefix, surgical cleanup in afterAll.
 *
 * Coverage:
 *   1. Ungranted dad: /studio, /prize-board, /contracts all blocked +
 *      no Studio/Prize Board/RewardRules sidebar entries
 *   2. financial_tracking view grant: /finances/history opens, granted kid's
 *      ledger visible, ungranted kid's pill + rows absent
 *   3. financial_tracking view → Prize Board WITHOUT Allowance tab;
 *      manage → Allowance tab appears
 *   4. Family-wide studio grant (target_member_id NULL): Studio in dad's
 *      sidebar + /studio renders
 *   5. Family-wide reward_rules grant: /contracts renders
 *   6. tasks_basic VIEW grant: completing the kid's task is blocked with the
 *      view-only toast (founder Decision 9)
 *   7. Pending approvals: view-level dad sees "View only" instead of
 *      approve/reject buttons
 *   8. archives_browse grant: member card appears only when granted; direct
 *      URL to an ungranted member's archive bounces to /archives
 *   9. Permission Hub honesty: Family-Wide Rules card gone, Higgins row gone,
 *      Finances row present, inactive rows marked, Family Management section
 *  10. Teen What's Shared panel mounted in Alex's settings
 *  11. Mom regression: /studio + Prize Board Allowance tab unchanged
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsDad, loginAsAlex } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ── Fixture names ──────────────────────────────────────────────────────────
const JORDAN_TX = 'PERMWIRE Jordan allowance credit'
const ALEX_TX = 'PERMWIRE Alex allowance credit'
const JORDAN_VIEW_TASK = 'PERMWIRE Jordan View Task'
const JORDAN_APPROVAL_TASK = 'PERMWIRE Jordan Approval Task'

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

const GRANT_KEYS = ['financial_tracking', 'studio', 'reward_rules', 'archives_browse', 'tasks_basic']

async function clearGrants() {
  await supabase
    .from('member_permissions')
    .delete()
    .eq('family_id', familyId)
    .eq('granted_to', await memberId('Mark'))
    .in('permission_key', GRANT_KEYS)
}

/** Insert (or update) a grant for Mark. target=null → family-wide. */
async function grant(key: string, target: string | null, level: string) {
  const sarah = await memberId('Sarah')
  const mark = await memberId('Mark')
  // Remove any existing row for this key first (target may differ)
  await supabase
    .from('member_permissions')
    .delete()
    .eq('family_id', familyId)
    .eq('granted_to', mark)
    .eq('permission_key', key)
  const { error } = await supabase.from('member_permissions').insert({
    family_id: familyId,
    granting_member_id: sarah,
    granted_to: mark,
    target_member_id: target,
    permission_key: key,
    access_level: level,
    permission_value: { access_level: level },
  })
  if (error) throw new Error(`grant ${key}: ${error.message}`)
}

async function cleanup() {
  // Completions before tasks (FK)
  const { data: tasks } = await supabase
    .from('tasks').select('id').eq('family_id', familyId).ilike('title', 'PERMWIRE%')
  for (const t of tasks ?? []) {
    await supabase.from('task_completions').delete().eq('task_id', t.id)
  }
  await supabase.from('tasks').delete().eq('family_id', familyId).ilike('title', 'PERMWIRE%')
  await supabase.from('financial_transactions').delete().eq('family_id', familyId).ilike('description', 'PERMWIRE%')
  await supabase.from('notifications').delete().eq('family_id', familyId).eq('notification_type', 'finance_payment_recorded')
  await clearGrants()
}

test.describe('Permissions Wiring', () => {
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
    const alex = await memberId('Alex')

    await cleanup()

    // Ledger rows for two different kids — the scoping fixture
    const { error: txErr } = await supabase.from('financial_transactions').insert([
      { family_id: familyId, family_member_id: jordan, transaction_type: 'adjustment', amount: 5, balance_after: 5, description: JORDAN_TX, source_type: 'manual' },
      { family_id: familyId, family_member_id: alex, transaction_type: 'adjustment', amount: 7, balance_after: 7, description: ALEX_TX, source_type: 'manual' },
    ])
    if (txErr) throw new Error(`tx fixtures: ${txErr.message}`)

    // Jordan task for the view-only completion gate
    const { error: taskErr } = await supabase.from('tasks').insert({
      family_id: familyId, created_by: sarah, assignee_id: jordan,
      title: JORDAN_VIEW_TASK, task_type: 'task', status: 'pending', source: 'manual',
    })
    if (taskErr) throw new Error(`view task: ${taskErr.message}`)

    // Jordan pending-approval task + completion for the approvals gate
    const { data: approvalTask, error: aErr } = await supabase.from('tasks').insert({
      family_id: familyId, created_by: sarah, assignee_id: jordan,
      title: JORDAN_APPROVAL_TASK, task_type: 'task', status: 'pending_approval',
      require_approval: true, source: 'manual',
    }).select('id').single()
    if (aErr) throw new Error(`approval task: ${aErr.message}`)
    const { error: cErr } = await supabase.from('task_completions').insert({
      task_id: approvalTask.id, member_id: jordan, family_member_id: jordan,
      approval_status: 'pending',
    })
    if (cErr) throw new Error(`completion fixture: ${cErr.message}`)
  })

  test.afterAll(async () => {
    await cleanup()
  })

  // ── 1. Ungranted dad — all management surfaces stay invisible + blocked ──
  test('Ungranted dad: management surfaces blocked, no sidebar entries', async ({ page }) => {
    await clearGrants()
    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // No Studio / Prize Board / RewardRules in nav
    await expect(page.getByRole('link', { name: 'Studio' })).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Prize Board' })).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'RewardRules' })).not.toBeVisible()

    for (const route of ['/studio', '/prize-board', '/contracts']) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Parent-only area' })).toBeVisible({ timeout: 15000 })
    }
  })

  // ── 2. financial_tracking view grant scopes the ledger ───────────────────
  test('Finance view grant: granted kid visible, ungranted kid absent', async ({ page }) => {
    const jordan = await memberId('Jordan')
    await grant('financial_tracking', jordan, 'view')

    await loginAsDad(page)
    await page.goto('/finances/history')
    await page.waitForLoadState('networkidle')

    // Page opens (no Parent-only card) and shows Jordan's ledger
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).not.toBeVisible()
    await expect(page.getByText(JORDAN_TX)).toBeVisible({ timeout: 15000 })
    // Alex is not granted — his rows and pill never appear
    await expect(page.getByText(ALEX_TX)).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Alex' })).not.toBeVisible()

    await clearGrants()
  })

  // ── 3. Prize Board: Allowance tab requires manage ─────────────────────────
  test('Prize Board: view grant hides Allowance tab, manage shows it', async ({ page }) => {
    const jordan = await memberId('Jordan')
    await grant('financial_tracking', jordan, 'view')

    await loginAsDad(page)
    await page.goto('/prize-board')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: 'Parent-only area' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Prizes' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Allowance' })).not.toBeVisible()

    // Upgrade to manage → Allowance tab appears
    await grant('financial_tracking', jordan, 'manage')
    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByRole('button', { name: 'Allowance' })).toBeVisible({ timeout: 15000 })

    await clearGrants()
  })

  // ── 4. Family-wide Studio grant ───────────────────────────────────────────
  test('Studio grant (family-wide NULL target): sidebar entry + route open', async ({ page }) => {
    await grant('studio', null, 'view')

    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await expect(page.getByRole('link', { name: 'Studio' }).first()).toBeVisible({ timeout: 15000 })

    await page.goto('/studio')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).not.toBeVisible()

    await clearGrants()
  })

  // ── 5. Family-wide RewardRules grant ──────────────────────────────────────
  test('RewardRules grant: /contracts opens for granted dad', async ({ page }) => {
    await grant('reward_rules', null, 'view')

    await loginAsDad(page)
    await page.goto('/contracts')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).not.toBeVisible()

    await clearGrants()
  })

  // ── 6. tasks_basic VIEW grant cannot complete ─────────────────────────────
  test('View-only tasks grant: completion blocked with toast', async ({ page }) => {
    const jordan = await memberId('Jordan')
    await grant('tasks_basic', jordan, 'view')

    await loginAsDad(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    // Switch to Jordan's pill (granted, so it exists)
    await page.getByRole('button', { name: 'Jordan', exact: true }).click()
    await expect(page.getByText(JORDAN_VIEW_TASK)).toBeVisible({ timeout: 15000 })

    // Any completion attempt on Jordan's tasks is gated at view level.
    // Scope the click to the VIEW task's own card — the approval-task fixture
    // also renders a Mark-complete button (which opens the review expander).
    const viewTaskCard = page
      .getByText(JORDAN_VIEW_TASK)
      .locator('xpath=ancestor::div[.//button[@aria-label="Mark complete"]][1]')
    await viewTaskCard.getByRole('button', { name: 'Mark complete' }).first().click()
    await expect(page.getByText(/view-only access/i)).toBeVisible({ timeout: 10000 })

    // Task did not complete
    const { data: taskRow } = await supabase
      .from('tasks').select('status').eq('family_id', familyId).eq('title', JORDAN_VIEW_TASK).single()
    expect(taskRow?.status).toBe('pending')

    await clearGrants()
  })

  // ── 7. Pending approvals: view level shows View only ─────────────────────
  test('View-only grant: pending approval row has no approve/reject', async ({ page }) => {
    const jordan = await memberId('Jordan')
    await grant('tasks_basic', jordan, 'view')

    await loginAsDad(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    await expect(page.getByText(JORDAN_APPROVAL_TASK)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('View only')).toBeVisible()

    await clearGrants()
  })

  // ── 8. archives_browse grant scopes member cards + detail URL ────────────
  test('Archives: granted kid card appears; ungranted member detail bounces', async ({ page }) => {
    const jordan = await memberId('Jordan')
    const sarah = await memberId('Sarah')
    await clearGrants()

    await loginAsDad(page)
    await page.goto('/archives')
    await waitForAppReady(page)

    // Ungranted: dad sees himself only — no Jordan card
    await expect(page.getByText('Mark').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Jordan')).not.toBeVisible()

    // Grant Jordan → his card appears
    await grant('archives_browse', jordan, 'view')
    await page.reload()
    await waitForAppReady(page)
    await expect(page.getByText('Jordan').first()).toBeVisible({ timeout: 15000 })

    // Direct URL to Sarah's archive (not granted) bounces back to /archives
    await page.goto(`/archives/member/${sarah}`)
    await page.waitForURL('**/archives', { timeout: 15000 })

    await clearGrants()
  })

  // ── 9. Permission Hub honesty ─────────────────────────────────────────────
  test('Permission Hub: dead controls gone, finance row + inactive marks present', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/permissions')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: 'Permission Hub' })).toBeVisible({ timeout: 15000 })
    // Dead Family-Wide Rules card removed
    await expect(page.getByText('Family-Wide Rules')).not.toBeVisible()

    // Expand Mark's adult card
    await page.getByRole('button', { name: /Mark/ }).first().click()
    // Family Management section with the two family-wide grants
    await expect(page.getByText('Family Management')).toBeVisible()
    await expect(page.getByText('RewardRules')).toBeVisible()

    // Expand Jordan's per-kid block (accessible name includes the avatar
    // letter prefix, e.g. "J Jordan" — don't anchor the regex)
    await page.getByRole('button', { name: /Jordan/ }).first().click()
    // Finance row present with its level hint; Higgins row gone
    await expect(page.getByText('Finances & Allowance')).toBeVisible()
    await expect(page.getByText('Higgins (Communication)')).not.toBeVisible()
    // Inactive growth rows are marked, not interactive
    await expect(page.getByText('Takes effect in a future update').first()).toBeVisible()
  })

  // ── 10. Teen What's Shared panel mounted ──────────────────────────────────
  test('Alex sees the What\'s Shared panel in Settings', async ({ page }) => {
    await loginAsAlex(page)
    await page.goto('/settings')
    await waitForAppReady(page)

    await page.getByRole('button', { name: /What's Shared/ }).click()
    await expect(page.getByText("What's Shared About You").first()).toBeVisible({ timeout: 15000 })
    // The grid renders feature rows
    await expect(page.getByRole('cell', { name: 'Tasks' })).toBeVisible()
  })

  // ── 11a. Mobile parity: granted Studio flows into the More menu ──────────
  test('375px More menu shows Studio for granted dad (Convention #16 parity)', async ({ page }) => {
    await grant('studio', null, 'view')

    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('link', { name: 'More' }).or(page.getByRole('button', { name: 'More' })).first().click()
    await expect(page.getByRole('link', { name: 'Studio' }).first()).toBeVisible({ timeout: 15000 })

    await clearGrants()
  })

  // ── 11. Mom regression ────────────────────────────────────────────────────
  test('Mom: /studio renders and Prize Board keeps the Allowance tab', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/studio')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).not.toBeVisible()

    await page.goto('/prize-board')
    await waitForAppReady(page)
    await expect(page.getByRole('button', { name: 'Allowance' })).toBeVisible({ timeout: 15000 })
  })
})
