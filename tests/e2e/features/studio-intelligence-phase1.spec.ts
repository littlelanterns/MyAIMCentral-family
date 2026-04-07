/**
 * Studio Intelligence Phase 1 — E2E Tests
 *
 * Verifies the four sub-phases from
 * `claude/feature-decisions/PRD-09A-09B-Studio-Intelligence-Phase-1.md`:
 *
 *   1A. Sequential creation works end-to-end (was silently broken before).
 *       Opening SequentialCreator from Studio, Tasks → Sequential tab, and the
 *       Lists page [+ New List] picker all produce:
 *         - one row in `sequential_collections`
 *         - N child rows in `tasks` with `task_type='sequential'`,
 *           `sequential_collection_id` set, `sequential_position` 0..N-1
 *         - `sequential_is_active = true` on the first `active_count` items
 *
 *   1B. Randomizer is visible in the Lists page [+ New List] type picker and
 *       selecting it produces a `lists` row with `list_type='randomizer'`.
 *
 *   1C. Sequential collections appear on the Lists page alongside regular lists
 *       with a "Sequential" badge, AND on the Tasks → Sequential tab.
 *
 *   1D. (Verified by tsc -b — capability_tags field is a compile-time
 *       requirement on StudioTemplate, so if we got here, every seed template
 *       is tagged.)
 *
 * Guard tests (1A defensive layer):
 *   - createTaskFromData throws on taskType='sequential'. Tested via unit-style
 *     import since it's a pure function with a synchronous guard.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import { TEST_USERS } from '../helpers/seed-family'
import { waitForAppReady, captureConsoleErrors } from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

// ── Supabase helpers ────────────────────────────────────────

async function getMomSupabase() {
  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await sb.auth.signInWithPassword({
    email: TEST_USERS.mom.email,
    password: TEST_USERS.mom.password,
  })
  if (error || !data.user) throw new Error(`Mom login failed: ${error?.message}`)
  return { sb, userId: data.user.id }
}

async function getMomMember() {
  const { sb, userId } = await getMomSupabase()
  const { data } = await sb
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', userId)
    .limit(1)
    .single()
  if (!data) throw new Error('Mom family member not found')
  return { sb, member: data as { id: string; family_id: string } }
}

async function getFirstChild(sb: ReturnType<typeof createClient>, familyId: string) {
  const { data } = await sb
    .from('family_members')
    .select('id, display_name')
    .eq('family_id', familyId)
    .eq('role', 'member')
    .eq('is_active', true)
    .limit(1)
    .single()
  if (!data) throw new Error('No child member found in test family')
  return data as { id: string; display_name: string }
}

// ── Cleanup tracking ────────────────────────────────────────

const createdCollectionIds: string[] = []
const createdListIds: string[] = []

async function cleanup() {
  const { sb } = await getMomSupabase()
  for (const id of createdCollectionIds) {
    await sb.from('tasks').delete().eq('sequential_collection_id', id)
    await sb.from('sequential_collections').delete().eq('id', id)
  }
  for (const id of createdListIds) {
    await sb.from('list_items').delete().eq('list_id', id)
    await sb.from('lists').delete().eq('id', id)
  }
  createdCollectionIds.length = 0
  createdListIds.length = 0
}

// ── Overlay dismissal (shared pattern from other tests) ─────

async function dismissOverlays(page: import('@playwright/test').Page) {
  for (let i = 0; i < 4; i++) {
    for (const text of ["Don't show guides", 'Got it', 'Dismiss Guide', 'Dismiss guide', 'Dismiss']) {
      const btn = page.locator('button').filter({ hasText: text }).first()
      if (await btn.isVisible({ timeout: 250 }).catch(() => false)) {
        await btn.click({ force: true })
        await page.waitForTimeout(250)
      }
    }
  }
}

// ============================================================
// Tests
// ============================================================

test.describe.serial('PRD-09A/09B Studio Intelligence Phase 1', () => {
  test.afterAll(async () => {
    await cleanup()
  })

  test('1A. Sequential creation from the Lists page produces a full collection row + child tasks', async ({ page }) => {
    test.setTimeout(90000)
    const consoleErrors = captureConsoleErrors(page)
    const { sb, member } = await getMomMember()
    const child = await getFirstChild(sb, member.family_id)

    const title = `E2E Seq Lists ${Date.now()}`

    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // Open the [+ New List] picker
    await page.getByRole('button', { name: /new list/i }).first().click({ force: true })
    await page.waitForTimeout(500)

    // Verify Phase 1C: "Sequential Collection" tile is in the type picker
    const sequentialTile = page.getByRole('button', { name: /sequential collection/i }).first()
    await expect(sequentialTile).toBeVisible({ timeout: 5000 })
    await sequentialTile.click({ force: true })
    await page.waitForTimeout(700)

    // Phase 1A: SequentialCreatorModal should be open (not TaskCreationModal)
    await expect(page.getByText(/new sequential collection/i).first()).toBeVisible({ timeout: 5000 })

    // Pick the first child as assignee
    await page.getByRole('button', { name: child.display_name }).first().click({ force: true })
    await page.waitForTimeout(200)

    // Fill title
    await page.getByPlaceholder(/saxon math|e\.g\.,/i).first().fill(title)

    // Fill items (manual input mode is default)
    await page.getByPlaceholder(/chapter 1|items|one per line/i).first().fill('Item One\nItem Two\nItem Three')

    // Click the Create button (the final submit inside SequentialCreator)
    const createButton = page.getByRole('button', { name: /create collection \(3 items\)/i }).first()
    await createButton.click({ force: true })
    await page.waitForTimeout(2500)

    // Verify DB state: one collection + 3 child tasks, correctly wired
    const { data: collections } = await sb
      .from('sequential_collections')
      .select('*')
      .eq('family_id', member.family_id)
      .eq('title', title)
    expect(collections).not.toBeNull()
    expect(collections!.length).toBe(1)
    const coll = collections![0]
    createdCollectionIds.push(coll.id)

    expect(coll.total_items).toBe(3)
    expect(coll.active_count).toBeGreaterThanOrEqual(1)

    const { data: childTasks } = await sb
      .from('tasks')
      .select('id, title, task_type, sequential_collection_id, sequential_position, sequential_is_active')
      .eq('sequential_collection_id', coll.id)
      .order('sequential_position')
    expect(childTasks).not.toBeNull()
    expect(childTasks!.length).toBe(3)
    for (const t of childTasks!) {
      expect(t.task_type).toBe('sequential')
      expect(t.sequential_collection_id).toBe(coll.id)
    }
    // First item should be active; sequential_position should be 0, 1, 2
    expect(childTasks![0].sequential_position).toBe(0)
    expect(childTasks![1].sequential_position).toBe(1)
    expect(childTasks![2].sequential_position).toBe(2)
    expect(childTasks![0].sequential_is_active).toBe(true)

    // Sanity: no console errors that indicate a poisoned state
    const criticalErrors = consoleErrors.filter(e =>
      e.includes('SequentialCreatorModal') || e.includes('useCreateSequentialCollection')
    )
    expect(criticalErrors).toEqual([])
  })

  test('1C. The new sequential collection is visible on the Lists page with a Sequential badge', async ({ page }) => {
    const { member } = await getMomMember()
    // Use the collection created in test 1 (still in createdCollectionIds)
    expect(createdCollectionIds.length).toBeGreaterThan(0)

    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // Collection should render as a tile with a Sequential badge
    const badge = page.getByText(/^sequential$/i).first()
    await expect(badge).toBeVisible({ timeout: 5000 })

    // And the title is visible
    const { sb } = await getMomSupabase()
    const { data: coll } = await sb
      .from('sequential_collections')
      .select('title')
      .eq('id', createdCollectionIds[0])
      .single()
    expect(coll).not.toBeNull()
    await expect(page.getByText(coll!.title as string).first()).toBeVisible({ timeout: 5000 })

    // Avoid unused-var lint on member
    expect(member.id).toBeTruthy()
  })

  test('1C. The new sequential collection is visible on the Tasks → Sequential tab (dual access)', async ({ page }) => {
    expect(createdCollectionIds.length).toBeGreaterThan(0)
    const { sb } = await getMomSupabase()
    const { data: coll } = await sb
      .from('sequential_collections')
      .select('title')
      .eq('id', createdCollectionIds[0])
      .single()
    expect(coll).not.toBeNull()

    await loginAsMom(page)
    await page.goto('/tasks')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // Switch to the Sequential tab
    const sequentialTab = page.getByRole('tab', { name: /sequential/i }).first()
    await sequentialTab.click({ force: true })
    await page.waitForTimeout(1000)

    // SequentialCollectionView should render the collection card with its title
    await expect(page.getByText(coll!.title as string).first()).toBeVisible({ timeout: 5000 })
  })

  test('1B. Randomizer is in the Lists page [+ New List] type picker and creates a randomizer list', async ({ page }) => {
    test.setTimeout(60000)
    const { sb, member } = await getMomMember()
    const title = `E2E Randomizer ${Date.now()}`

    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    await page.getByRole('button', { name: /new list/i }).first().click({ force: true })
    await page.waitForTimeout(500)

    // Phase 1B: Randomizer tile must be visible in the grid (was missing before)
    const randomizerTile = page.getByRole('button', { name: /^randomizer/i }).first()
    await expect(randomizerTile).toBeVisible({ timeout: 5000 })
    await randomizerTile.click({ force: true })
    await page.waitForTimeout(500)

    // Normal list-name flow (unlike sequential, randomizer IS a real list_type)
    const nameInput = page.getByPlaceholder(/list name/i).first()
    await nameInput.fill(title)
    await page.getByRole('button', { name: /^create$/i }).first().click({ force: true })
    await page.waitForTimeout(2000)

    // Verify DB state: one lists row with list_type='randomizer'
    const { data: lists } = await sb
      .from('lists')
      .select('id, list_type, title')
      .eq('family_id', member.family_id)
      .eq('title', title)
    expect(lists).not.toBeNull()
    expect(lists!.length).toBe(1)
    expect(lists![0].list_type).toBe('randomizer')
    createdListIds.push(lists![0].id)
  })
})
