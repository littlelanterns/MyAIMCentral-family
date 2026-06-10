/**
 * Task Assignment Scoping — RR-DEPLOY-SCOPING build (2026-06-10)
 *
 * Proves the task_assignment authority end-to-end:
 *   DB layer (authenticated API probes against production RLS):
 *     1. Dad (no grant) CANNOT insert a task assigned to a kid
 *     2. Dad CAN insert a self-assigned task (source='review_route' accepted)
 *     3. Teen CANNOT insert a task assigned to mom
 *     4. Per-kid grant flips it: granted dad CAN assign to that kid
 *     5. Family-wide grant covers other kids; per-kid 'none' carve-out wins
 *   UI layer (real browser):
 *     6. Dad (no grant): assignee picker shows ONLY himself, no Everyone pill
 *     7. Granted dad: picker shows himself + the granted kid
 *     8. Mom regression: full roster + Everyone pill
 *
 * Fixtures via service role with TASKSCOPE prefix; removed in afterAll.
 * Mirrors the leak-pass pattern (Testworth family).
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsDad } from '../helpers/auth'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!

const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

let familyId = ''
const memberIds: Record<string, string> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await admin
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

/** Authenticated client for a test user (real RLS, not service role). */
async function clientFor(user: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })
  if (error) throw new Error(`signIn failed for ${user.email}: ${error.message}`)
  return client
}

async function clearGrants() {
  await admin
    .from('member_permissions')
    .delete()
    .eq('family_id', familyId)
    .eq('permission_key', 'task_assignment')
}

async function cleanup() {
  await admin.from('tasks').delete().eq('family_id', familyId).ilike('title', 'TASKSCOPE%')
  await clearGrants()
}

async function grantAssign(grantedTo: string, target: string | null, level: 'manage' | 'none') {
  const momId = await memberId('Sarah')
  const { error } = await admin.from('member_permissions').insert({
    family_id: familyId,
    granting_member_id: momId,
    granted_to: grantedTo,
    target_member_id: target,
    permission_key: 'task_assignment',
    access_level: level,
    permission_value: { access_level: level },
  })
  if (error) throw new Error(`grant insert failed: ${error.message}`)
}

function taskRow(creator: string, assignee: string, title: string, source = 'manual') {
  return {
    family_id: familyId,
    created_by: creator,
    assignee_id: assignee,
    title,
    task_type: 'task',
    status: 'pending',
    source,
  }
}

test.describe('Task Assignment Scoping', () => {
  test.describe.configure({ retries: 1 })

  test.beforeAll(async () => {
    const { data: family, error } = await admin
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id
    await cleanup()
  })

  test.afterAll(async () => {
    await cleanup()
  })

  // ── DB layer (RLS probes) ──────────────────────────────────────────────

  test('1. RLS: ungranted dad cannot insert a task assigned to a kid', async () => {
    const mark = await memberId('Mark')
    const jordan = await memberId('Jordan')
    const dad = await clientFor(TEST_USERS.mark)
    const { error } = await dad
      .from('tasks')
      .insert(taskRow(mark, jordan, 'TASKSCOPE dad-to-kid blocked'))
    expect(error, 'tasks INSERT with foreign assignee must be rejected by RLS').toBeTruthy()
    await dad.auth.signOut()
  })

  test('2. RLS: dad can insert a self-assigned task (review_route source accepted)', async () => {
    const mark = await memberId('Mark')
    const dad = await clientFor(TEST_USERS.mark)
    const { data, error } = await dad
      .from('tasks')
      .insert(taskRow(mark, mark, 'TASKSCOPE dad self task', 'review_route'))
      .select('id')
      .single()
    expect(error, `self-assigned insert should pass: ${error?.message}`).toBeNull()
    expect(data?.id).toBeTruthy()
    await dad.auth.signOut()
  })

  test('3. RLS: teen cannot insert a task assigned to mom', async () => {
    const alexId = await memberId('Alex')
    const sarah = await memberId('Sarah')
    const teen = await clientFor(TEST_USERS.alex)
    const { error } = await teen
      .from('tasks')
      .insert(taskRow(alexId, sarah, 'TASKSCOPE teen-to-mom blocked'))
    expect(error, 'teen assigning to mom must be rejected by RLS').toBeTruthy()
    await teen.auth.signOut()
  })

  test('4. RLS: per-kid grant lets dad assign to that kid', async () => {
    const mark = await memberId('Mark')
    const jordan = await memberId('Jordan')
    await clearGrants()
    await grantAssign(mark, jordan, 'manage')

    const dad = await clientFor(TEST_USERS.mark)
    const { data, error } = await dad
      .from('tasks')
      .insert(taskRow(mark, jordan, 'TASKSCOPE dad-to-jordan granted'))
      .select('id')
      .single()
    expect(error, `granted insert should pass: ${error?.message}`).toBeNull()
    expect(data?.id).toBeTruthy()
    await dad.auth.signOut()
    await clearGrants()
  })

  test('5. RLS: family-wide grant covers other kids; per-kid none carve-out wins', async () => {
    const mark = await memberId('Mark')
    const jordan = await memberId('Jordan')
    const casey = await memberId('Casey')
    await clearGrants()
    await grantAssign(mark, null, 'manage') // family-wide
    await grantAssign(mark, jordan, 'none') // carve Jordan out

    const dad = await clientFor(TEST_USERS.mark)

    const ok = await dad
      .from('tasks')
      .insert(taskRow(mark, casey, 'TASKSCOPE dad-to-casey familywide'))
      .select('id')
      .single()
    expect(ok.error, `family-wide grant should cover Casey: ${ok.error?.message}`).toBeNull()

    const blocked = await dad
      .from('tasks')
      .insert(taskRow(mark, jordan, 'TASKSCOPE dad-to-jordan carved-out'))
    expect(blocked.error, "per-kid 'none' carve-out must beat the family-wide grant").toBeTruthy()

    await dad.auth.signOut()
    await clearGrants()
  })

  // ── UI layer ──────────────────────────────────────────────────────────

  /** Open TaskCreationModal from the Tasks page via the Create button. */
  async function openTaskModal(page: import('@playwright/test').Page) {
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: /create/i }).first().click()
    await expect(page.getByText("Who's Responsible?")).toBeVisible({ timeout: 15000 })
  }

  test('6. UI: ungranted dad sees only himself in the assignee picker, no Everyone', async ({ page }) => {
    await clearGrants()
    await loginAsDad(page)
    await openTaskModal(page)
    await expect(page.getByRole('button', { name: 'Mark', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Everyone', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Jordan', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Sarah', exact: true })).toHaveCount(0)
  })

  test('7. UI: granted dad sees himself + the granted kid', async ({ page }) => {
    const mark = await memberId('Mark')
    const jordan = await memberId('Jordan')
    await clearGrants()
    await grantAssign(mark, jordan, 'manage')

    await loginAsDad(page)
    await openTaskModal(page)
    await expect(page.getByRole('button', { name: 'Mark', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Jordan', exact: true })).toBeVisible()
    // Still no Everyone (mom-only), still no mom pill
    await expect(page.getByRole('button', { name: 'Everyone', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Sarah', exact: true })).toHaveCount(0)

    await clearGrants()
  })

  test('8. UI: mom regression — full roster + Everyone pill', async ({ page }) => {
    await loginAsMom(page)
    await openTaskModal(page)
    await expect(page.getByRole('button', { name: 'Sarah', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Everyone', exact: true })).toBeVisible()
  })
})
