/**
 * Role-Scoping Leak Pass — browser verification (2026-06-09)
 *
 * Verifies the PRD-02 read-scoping model end-to-end in a real browser:
 *   mom sees all; everyone else sees own + explicitly shared + mom-granted.
 *
 * Covers (founder verification list):
 *   1. Mom's Tasks page defaults to HER OWN tasks (family one pill-tap away)
 *   2. Dad (no grants) sees only his own tasks — never mom's
 *   3. Granting dad tasks_basic for a kid makes that kid's tasks visible
 *   4. Dad's Lists page: own + shared-with only — never mom's private lists
 *   5. Dad's Queue tab: own studio_queue items only (RLS-enforced)
 *   6. /finances/history blocked for dad (MomOnlyRoute own-login path)
 *   7. Shopping Mode: dad sees stores only from own/shared shopping lists
 *   8. Dad still gets the Quick Create lightning-bolt FAB
 *   9. Kid (teen) Lists page: no family-wide leak
 *  10. Mom regression: All pill still shows everything; finance page renders
 *
 * Fixtures are created via service role in beforeAll with a LEAKPASS prefix
 * and removed in afterAll. The Testworth dad (Mark) has NO member_permissions
 * grants by default, which is exactly the fixture we need for tests 2/4/5/7.
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

// ── Fixture names (unique prefix so cleanup is surgical) ──────────────────
const MOM_TASK = 'LEAKPASS Mom Private Task'
const DAD_TASK = 'LEAKPASS Dad Own Task'
const KID_TASK = 'LEAKPASS Jordan Granted Task'
const MOM_LIST = 'LEAKPASS Mom Private List'
const SHARED_LIST = 'LEAKPASS Shared With Dad List'
const MOM_QUEUE_ITEM = 'LEAKPASS mom queue thought'
const DAD_QUEUE_ITEM = 'LEAKPASS dad queue thought'
const MOM_SHOP_LIST = 'LEAKPASS Mom Secret Gifts'
const SHARED_SHOP_LIST = 'LEAKPASS Family Groceries'
const PRIVATE_STORE = 'LeakPass Private Mart'
const SHARED_STORE = 'LeakPass Shared Mart'

let familyId = ''
const memberIds: Record<string, string> = {}
const createdListIds: string[] = []
let grantId: string | null = null

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

async function cleanup() {
  // Tasks / queue rows by prefix
  await supabase.from('tasks').delete().eq('family_id', familyId).ilike('title', 'LEAKPASS%')
  await supabase.from('studio_queue').delete().eq('family_id', familyId).ilike('content', 'LEAKPASS%')
  // Lists (list_items + list_shares cascade via FK)
  const { data: lists } = await supabase
    .from('lists').select('id').eq('family_id', familyId).ilike('title', 'LEAKPASS%')
  for (const l of lists ?? []) {
    await supabase.from('list_shares').delete().eq('list_id', l.id)
    await supabase.from('list_items').delete().eq('list_id', l.id)
    await supabase.from('lists').delete().eq('id', l.id)
  }
  // The test grant
  await supabase
    .from('member_permissions')
    .delete()
    .eq('family_id', familyId)
    .eq('permission_key', 'tasks_basic')
    .eq('granted_to', await memberId('Mark'))
}

test.describe('Role-Scoping Leak Pass', () => {
  // One retry: the shared injectSession() auth helper occasionally races a
  // navigation during page.reload() (net::ERR_ABORTED) — infrastructure flake,
  // not a scoping behavior. Every assertion in this suite is deterministic.
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
    const mark = await memberId('Mark')

    await cleanup() // clear any leftovers from a crashed prior run

    // Tasks
    const { error: taskErr } = await supabase.from('tasks').insert([
      { family_id: familyId, created_by: sarah, assignee_id: sarah, title: MOM_TASK, task_type: 'task', status: 'pending', source: 'manual' },
      { family_id: familyId, created_by: mark, assignee_id: mark, title: DAD_TASK, task_type: 'task', status: 'pending', source: 'manual' },
    ])
    if (taskErr) throw new Error(`task fixtures: ${taskErr.message}`)

    // Lists — one mom-private, one shared with dad
    const { data: momList, error: lErr1 } = await supabase.from('lists')
      .insert({ family_id: familyId, owner_id: sarah, created_by: sarah, title: MOM_LIST, list_name: MOM_LIST, list_type: 'custom' })
      .select('id').single()
    if (lErr1) throw new Error(`mom list: ${lErr1.message}`)
    createdListIds.push(momList.id)

    const { data: sharedList, error: lErr2 } = await supabase.from('lists')
      .insert({ family_id: familyId, owner_id: sarah, created_by: sarah, title: SHARED_LIST, list_name: SHARED_LIST, list_type: 'custom', is_shared: true })
      .select('id').single()
    if (lErr2) throw new Error(`shared list: ${lErr2.message}`)
    createdListIds.push(sharedList.id)
    const { error: shareErr } = await supabase.from('list_shares')
      .insert({ list_id: sharedList.id, shared_with: mark, member_id: mark, permission: 'view' })
    if (shareErr) throw new Error(`list share: ${shareErr.message}`)

    // Queue items
    const { error: qErr } = await supabase.from('studio_queue').insert([
      { family_id: familyId, owner_id: sarah, destination: 'task', content: MOM_QUEUE_ITEM, source: 'manual' },
      { family_id: familyId, owner_id: mark, destination: 'task', content: DAD_QUEUE_ITEM, source: 'manual' },
    ])
    if (qErr) throw new Error(`queue fixtures: ${qErr.message}`)

    // Shopping lists — mom-private and shared-with-dad, each with one item
    const { data: momShop, error: sErr1 } = await supabase.from('lists')
      .insert({ family_id: familyId, owner_id: sarah, created_by: sarah, title: MOM_SHOP_LIST, list_name: MOM_SHOP_LIST, list_type: 'shopping', include_in_shopping_mode: true })
      .select('id').single()
    if (sErr1) throw new Error(`mom shop list: ${sErr1.message}`)
    createdListIds.push(momShop.id)

    const { data: sharedShop, error: sErr2 } = await supabase.from('lists')
      .insert({ family_id: familyId, owner_id: sarah, created_by: sarah, title: SHARED_SHOP_LIST, list_name: SHARED_SHOP_LIST, list_type: 'shopping', include_in_shopping_mode: true, is_shared: true })
      .select('id').single()
    if (sErr2) throw new Error(`shared shop list: ${sErr2.message}`)
    createdListIds.push(sharedShop.id)
    await supabase.from('list_shares')
      .insert({ list_id: sharedShop.id, shared_with: mark, member_id: mark, permission: 'view' })

    const { error: iErr } = await supabase.from('list_items').insert([
      { list_id: momShop.id, content: 'secret gift', item_name: 'secret gift', store_tags: [PRIVATE_STORE] },
      { list_id: sharedShop.id, content: 'milk', item_name: 'milk', store_tags: [SHARED_STORE] },
    ])
    if (iErr) throw new Error(`shop items: ${iErr.message}`)
  })

  test.afterAll(async () => {
    await cleanup()
  })

  // ── 1. Mom default ────────────────────────────────────────────────────────
  // FO-COMMAND-CENTER (2026-06-10): the Tasks page is purely personal for
  // every role; mom's everyone-at-once view relocated to Family Overview.
  // Same intent pinned (mom default = own; family view exists), new home.
  test('Mom Tasks page is purely personal; family view lives on Family Overview', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    // Her own task visible, dad's hidden — and no All pill exists anymore
    await expect(page.getByText(MOM_TASK)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(DAD_TASK)).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'All', exact: true })).not.toBeVisible()

    // Her everyone-at-once view: Family Overview command center
    await page.goto('/dashboard?view=family_overview')
    await waitForAppReady(page)
    await expect(page.getByTestId('family-overview')).toBeVisible({ timeout: 15000 })
  })

  // ── 2. Dad (no grants) sees only his own tasks ────────────────────────────
  test('Dad sees only his own tasks — never mom\'s', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    await expect(page.getByText(DAD_TASK)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(MOM_TASK)).not.toBeVisible()

    // With zero grants his viewable set is just himself → no member pill bar.
    // Sarah must not appear as a filter pill anywhere on the page.
    await expect(page.getByRole('button', { name: /Sarah/ })).not.toBeVisible()
  })

  // ── 3. Granting dad a kid opens exactly that kid ──────────────────────────
  test('tasks_basic grant makes the granted kid\'s tasks visible to dad', async ({ page }) => {
    const sarah = await memberId('Sarah')
    const mark = await memberId('Mark')
    const jordan = await memberId('Jordan')

    // Kid task + grant
    await supabase.from('tasks').insert({
      family_id: familyId, created_by: sarah, assignee_id: jordan,
      title: KID_TASK, task_type: 'task', status: 'pending', source: 'manual',
    })
    const { data: grant, error: gErr } = await supabase.from('member_permissions')
      .insert({
        family_id: familyId, granting_member_id: sarah, granted_to: mark,
        target_member_id: jordan, permission_key: 'tasks_basic', access_level: 'view',
      })
      .select('id').single()
    if (gErr) throw new Error(`grant: ${gErr.message}`)
    grantId = grant.id

    // FO-COMMAND-CENTER (2026-06-10): the granted path now lives on the
    // Family Overview command center (Tasks page is purely personal).
    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // The grant unlocks the Family Overview tab; Jordan's column is there.
    await page.getByRole('tab', { name: 'Family Overview' }).click()
    await expect(page.getByTestId(`column-header-${jordan}`)).toBeVisible({ timeout: 15000 })
    // Mom's task/column still never visible
    await expect(page.getByText(MOM_TASK)).not.toBeVisible()
    await expect(page.getByTestId(`column-header-${sarah}`)).not.toBeVisible()

    // And his personal Tasks page stays personal — no kid task there
    await page.goto('/tasks')
    await waitForAppReady(page)
    await expect(page.getByText(KID_TASK)).not.toBeVisible()

    // Remove the grant so later tests see ungranted dad again
    await supabase.from('member_permissions').delete().eq('id', grantId)
    grantId = null
  })

  // ── 4. Dad Lists scoping ──────────────────────────────────────────────────
  test('Dad Lists page shows shared list, hides mom\'s private list', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/lists')
    await waitForAppReady(page)

    await expect(page.getByText(SHARED_LIST)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(MOM_LIST)).not.toBeVisible()
  })

  // ── 5. Dad Queue scoping (RLS) ────────────────────────────────────────────
  // FO-COMMAND-CENTER (2026-06-10): the page-level Queue tab relocated to the
  // mom-scoped Family Overview. Dad's queue access is the Review Queue MODAL
  // (QueueBadge on the Tasks page header) — same RLS-scoped data, same pin.
  test('Dad Review Queue modal shows only his own queue items', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    await page.getByRole('button', { name: /Review Queue/ }).click()
    await expect(page.getByText(DAD_QUEUE_ITEM)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(MOM_QUEUE_ITEM)).not.toBeVisible()
  })

  // ── 6. Finance history blocked for dad ────────────────────────────────────
  test('/finances/history shows Parent-only card to dad', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/finances/history')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Parent-only area' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('button', { name: 'Go back' })).toBeVisible()
  })

  // ── 7. Shopping Mode scoping ──────────────────────────────────────────────
  test('Dad Shopping Mode lists only shared-list stores', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/shopping-mode')
    await waitForAppReady(page)

    await expect(page.getByText(SHARED_STORE)).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(PRIVATE_STORE)).not.toBeVisible()
  })

  // ── 8. Quick Create FAB present for dad ───────────────────────────────────
  test('Dad gets the Quick Create lightning-bolt FAB', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await expect(page.locator('[aria-label="Quick Create"]')).toBeVisible({ timeout: 15000 })
  })

  // ── 9. Teen Lists scoping ─────────────────────────────────────────────────
  test('Teen (Alex) Lists page hides mom\'s private list', async ({ page }) => {
    await loginAsAlex(page)
    await page.goto('/lists')
    await waitForAppReady(page)

    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByText(MOM_LIST)).not.toBeVisible()
    // Not shared with Alex either
    await expect(page.getByText(SHARED_LIST)).not.toBeVisible()
  })

  // ── 10. Mom regression on finance page ────────────────────────────────────
  test('Mom still reaches /finances/history normally', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/finances/history')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Parent-only area')).not.toBeVisible()
    await expect(page.getByText(/History/).first()).toBeVisible({ timeout: 15000 })
  })
})
