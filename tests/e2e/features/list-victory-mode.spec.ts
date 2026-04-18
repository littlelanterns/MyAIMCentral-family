/**
 * List Victory Mode E2E Tests — PRD-09B
 *
 * Tests victory_mode enum on lists and victory_flagged on list_items:
 *   - Per-item victories (victory_mode = 'item_completed')
 *   - Per-list victories (victory_mode = 'list_completed')
 *   - Combined mode (victory_mode = 'both')
 *   - Default victory_mode by list type
 *   - UI tests for victory mode selector and per-item flag toggle
 *   - Edge cases: empty list, shared list, idempotency
 */
import { test, expect, Page } from '@playwright/test'
import { loginAsMom, loginAsDad } from '../helpers/auth'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

// ── Supabase client helpers ──────────────────────────────────

async function getAuthenticatedSb(email: string, password: string) {
  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error || !data.user) throw new Error(`Login failed: ${error?.message}`)
  return { sb, userId: data.user.id }
}

async function getMomSupabase() {
  return getAuthenticatedSb(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
}

async function getMomMember() {
  const { sb, userId } = await getMomSupabase()
  const { data } = await sb
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', userId)
    .eq('role', 'primary_parent')
    .single()
  if (!data) throw new Error('Mom member not found')
  return { sb, member: data }
}

async function getDadMember() {
  const { sb, userId } = await getAuthenticatedSb(TEST_USERS.mark.email, TEST_USERS.mark.password)
  const { data } = await sb
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', userId)
    .single()
  if (!data) throw new Error('Dad member not found')
  return { sb, member: data }
}

// Create a test list with items via Supabase API
async function createTestList(opts: {
  title: string
  listType: string
  victoryMode: string
  itemContents: string[]
  allFlagged?: boolean
}) {
  const { sb, member } = await getMomMember()
  const { data: list, error: listErr } = await sb
    .from('lists')
    .insert({
      family_id: member.family_id,
      owner_id: member.id,
      title: opts.title,
      list_type: opts.listType,
      victory_mode: opts.victoryMode,
    })
    .select()
    .single()
  if (listErr || !list) throw new Error(`Create list failed: ${listErr?.message}`)

  const items = []
  for (let i = 0; i < opts.itemContents.length; i++) {
    const { data: item, error: itemErr } = await sb
      .from('list_items')
      .insert({
        list_id: list.id,
        content: opts.itemContents[i],
        sort_order: i,
        victory_flagged: opts.allFlagged ?? false,
      })
      .select()
      .single()
    if (itemErr || !item) throw new Error(`Create item failed: ${itemErr?.message}`)
    items.push(item)
  }

  return { sb, list, items, memberId: member.id, familyId: member.family_id }
}

// Count victories for a given source and reference
async function countVictories(familyId: string, source: string, sourceRefId?: string) {
  const { sb } = await getMomSupabase()
  let query = sb
    .from('victories')
    .select('id', { count: 'exact' })
    .eq('family_id', familyId)
    .eq('source', source)
  if (sourceRefId) {
    query = query.eq('source_reference_id', sourceRefId)
  }
  const { count } = await query
  return count ?? 0
}

// Cleanup helper
async function deleteTestList(listId: string) {
  const { sb } = await getMomSupabase()
  await sb.from('list_items').delete().eq('list_id', listId)
  await sb.from('lists').delete().eq('id', listId)
}

async function deleteVictoriesForList(familyId: string, listId: string, itemIds: string[]) {
  const { sb } = await getMomSupabase()
  await sb.from('victories').delete().eq('family_id', familyId).eq('source_reference_id', listId).eq('source', 'list_completed')
  for (const itemId of itemIds) {
    await sb.from('victories').delete().eq('source_reference_id', itemId).eq('source', 'list_item_completed')
  }
}

// Navigate to a list detail and wait for items to render
async function navigateToList(page: Page, listTitle: string) {
  await page.goto('/lists')
  await waitForAppReady(page)
  // Click list card by title
  const listLink = page.getByText(listTitle, { exact: false }).first()
  await listLink.click()
  // Wait for list items to render
  await page.waitForTimeout(800)
}

// Check an item by its 0-based index in the rendered list.
// Generic lists use .w-5.h-5 checkboxes; shopping lists use .w-4.h-4.
async function checkItemByIndex(page: Page, index: number) {
  // The checkbox is the first button inside each list item card row
  const checkboxes = page.locator('.w-5.h-5.rounded.border-2')
  const count = await checkboxes.count()
  if (count === 0) {
    // Try shopping-style checkboxes
    const shoppingCBs = page.locator('.w-4.h-4.rounded')
    await shoppingCBs.nth(index).click()
  } else {
    await checkboxes.nth(index).click()
  }
  await page.waitForTimeout(400)
}

// ════════════════════════════════════════════════════════════
// PER-ITEM VICTORY TESTS (victory_mode = 'item_completed')
// ════════════════════════════════════════════════════════════

test.describe('Per-item victory (item_completed mode)', () => {
  let testData: Awaited<ReturnType<typeof createTestList>>

  test.beforeAll(async () => {
    testData = await createTestList({
      title: `E2E ItemVic ${Date.now()}`,
      listType: 'todo',
      victoryMode: 'item_completed',
      itemContents: ['IV Alpha', 'IV Beta', 'IV Gamma', 'IV Delta', 'IV Epsilon'],
      allFlagged: true,
    })
  })

  test.afterAll(async () => {
    if (testData) {
      await deleteVictoriesForList(testData.familyId, testData.list.id, testData.items.map(i => i.id))
      await deleteTestList(testData.list.id)
    }
  })

  test('checking a flagged item creates a per-item victory', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    // Check item at index 2 (IV Gamma)
    await checkItemByIndex(page, 2)
    await page.waitForTimeout(1000)

    const gammaVictoryCount = await countVictories(testData.familyId, 'list_item_completed', testData.items[2].id)
    expect(gammaVictoryCount).toBe(1)

    // Check item at index 0 (IV Alpha)
    await checkItemByIndex(page, 0)
    await page.waitForTimeout(1000)

    const alphaVictoryCount = await countVictories(testData.familyId, 'list_item_completed', testData.items[0].id)
    expect(alphaVictoryCount).toBe(1)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('re-checking an item does not create a duplicate victory', async ({ page }) => {
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    // Uncheck IV Gamma (index 2) — already checked from previous test
    await checkItemByIndex(page, 2)
    await page.waitForTimeout(500)

    // Re-check IV Gamma
    await checkItemByIndex(page, 2)
    await page.waitForTimeout(1000)

    // Should still be 1, not 2
    const gammaVictoryCount = await countVictories(testData.familyId, 'list_item_completed', testData.items[2].id)
    expect(gammaVictoryCount).toBe(1)
  })

  test('unflagged item does not produce a victory', async ({ page }) => {
    // Unflag IV Beta via API
    await testData.sb.from('list_items').update({ victory_flagged: false }).eq('id', testData.items[1].id)

    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    // Check IV Beta (index 1, unflagged)
    await checkItemByIndex(page, 1)
    await page.waitForTimeout(1000)

    const betaVictoryCount = await countVictories(testData.familyId, 'list_item_completed', testData.items[1].id)
    expect(betaVictoryCount).toBe(0)

    // Check IV Delta (index 3, still flagged)
    await checkItemByIndex(page, 3)
    await page.waitForTimeout(1000)

    const deltaVictoryCount = await countVictories(testData.familyId, 'list_item_completed', testData.items[3].id)
    expect(deltaVictoryCount).toBe(1)
  })
})

// ════════════════════════════════════════════════════════════
// PER-LIST VICTORY TESTS (victory_mode = 'list_completed')
// ════════════════════════════════════════════════════════════

test.describe('Per-list victory (list_completed mode)', () => {
  let testData: Awaited<ReturnType<typeof createTestList>>

  test.beforeAll(async () => {
    testData = await createTestList({
      title: `E2E ListVic ${Date.now()}`,
      listType: 'todo',
      victoryMode: 'list_completed',
      itemContents: ['LV Shirts', 'LV Pants', 'LV Toothbrush', 'LV Charger', 'LV Passport'],
    })
  })

  test.afterAll(async () => {
    if (testData) {
      await deleteVictoriesForList(testData.familyId, testData.list.id, testData.items.map(i => i.id))
      await deleteTestList(testData.list.id)
    }
  })

  test('checking all items creates a list-level victory', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    // Check items 0-3 (no victory yet)
    for (let i = 0; i < 4; i++) {
      await checkItemByIndex(page, i)
    }

    let victoryCount = await countVictories(testData.familyId, 'list_completed', testData.list.id)
    expect(victoryCount).toBe(0)

    // Check last item (index 4)
    await checkItemByIndex(page, 4)
    await page.waitForTimeout(1000)

    victoryCount = await countVictories(testData.familyId, 'list_completed', testData.list.id)
    expect(victoryCount).toBe(1)

    // Celebration banner should show
    await expect(page.getByText('All done! Victory recorded!')).toBeVisible({ timeout: 2000 })

    assertNoInfiniteRenders(consoleErrors)
  })
})

test.describe('No victory when mode is none', () => {
  let testData: Awaited<ReturnType<typeof createTestList>>

  test.beforeAll(async () => {
    testData = await createTestList({
      title: `E2E NoVic ${Date.now()}`,
      listType: 'todo',
      victoryMode: 'none',
      itemContents: ['NV Milk', 'NV Eggs', 'NV Bread', 'NV Butter', 'NV Cheese'],
    })
  })

  test.afterAll(async () => {
    if (testData) {
      await deleteVictoriesForList(testData.familyId, testData.list.id, testData.items.map(i => i.id))
      await deleteTestList(testData.list.id)
    }
  })

  test('checking all items with mode=none creates no victory', async ({ page }) => {
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    for (let i = 0; i < 5; i++) {
      await checkItemByIndex(page, i)
    }
    await page.waitForTimeout(1000)

    const listVictoryCount = await countVictories(testData.familyId, 'list_completed', testData.list.id)
    expect(listVictoryCount).toBe(0)

    for (const item of testData.items) {
      const itemVictoryCount = await countVictories(testData.familyId, 'list_item_completed', item.id)
      expect(itemVictoryCount).toBe(0)
    }
  })
})

// ════════════════════════════════════════════════════════════
// BOTH MODE TESTS
// ════════════════════════════════════════════════════════════

test.describe('Combined mode (both)', () => {
  let testData: Awaited<ReturnType<typeof createTestList>>

  test.beforeAll(async () => {
    testData = await createTestList({
      title: `E2E BothVic ${Date.now()}`,
      listType: 'todo',
      victoryMode: 'both',
      itemContents: ['BV Step 1', 'BV Step 2', 'BV Step 3', 'BV Step 4', 'BV Step 5'],
      allFlagged: true,
    })
  })

  test.afterAll(async () => {
    if (testData) {
      await deleteVictoriesForList(testData.familyId, testData.list.id, testData.items.map(i => i.id))
      await deleteTestList(testData.list.id)
    }
  })

  test('all flagged: per-item + list-level victories', async ({ page }) => {
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    for (let i = 0; i < 5; i++) {
      await checkItemByIndex(page, i)
      await page.waitForTimeout(500)
    }
    await page.waitForTimeout(1000)

    // 5 per-item victories
    let totalItemVictories = 0
    for (const item of testData.items) {
      totalItemVictories += await countVictories(testData.familyId, 'list_item_completed', item.id)
    }
    expect(totalItemVictories).toBe(5)

    // 1 list-level victory
    const listVictoryCount = await countVictories(testData.familyId, 'list_completed', testData.list.id)
    expect(listVictoryCount).toBe(1)
  })
})

test.describe('Combined mode with partial unflagging', () => {
  let testData: Awaited<ReturnType<typeof createTestList>>

  test.beforeAll(async () => {
    testData = await createTestList({
      title: `E2E BothPartial ${Date.now()}`,
      listType: 'todo',
      victoryMode: 'both',
      itemContents: ['BP Task A', 'BP Task B', 'BP Task C', 'BP Task D', 'BP Task E'],
      allFlagged: true,
    })
    // Unflag items A, B, C (indices 0, 1, 2)
    for (const item of testData.items.slice(0, 3)) {
      await testData.sb.from('list_items').update({ victory_flagged: false }).eq('id', item.id)
    }
  })

  test.afterAll(async () => {
    if (testData) {
      await deleteVictoriesForList(testData.familyId, testData.list.id, testData.items.map(i => i.id))
      await deleteTestList(testData.list.id)
    }
  })

  test('unflagged items produce no per-item victory, flagged ones do + list victory', async ({ page }) => {
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    for (let i = 0; i < 5; i++) {
      await checkItemByIndex(page, i)
      await page.waitForTimeout(500)
    }
    await page.waitForTimeout(1000)

    // A, B, C unflagged -> 0 per-item victories
    for (const item of testData.items.slice(0, 3)) {
      const count = await countVictories(testData.familyId, 'list_item_completed', item.id)
      expect(count).toBe(0)
    }

    // D, E flagged -> 1 per-item victory each
    for (const item of testData.items.slice(3)) {
      const count = await countVictories(testData.familyId, 'list_item_completed', item.id)
      expect(count).toBe(1)
    }

    // List-level victory
    const listVictoryCount = await countVictories(testData.familyId, 'list_completed', testData.list.id)
    expect(listVictoryCount).toBe(1)
  })
})

// ════════════════════════════════════════════════════════════
// DEFAULT VICTORY_MODE BY LIST TYPE
// ════════════════════════════════════════════════════════════

test.describe('Default victory_mode by list type', () => {
  const createdListIds: string[] = []

  test.afterAll(async () => {
    const { sb } = await getMomSupabase()
    for (const id of createdListIds) {
      await sb.from('list_items').delete().eq('list_id', id)
      await sb.from('lists').delete().eq('id', id)
    }
  })

  async function createAndCheck(listType: string): Promise<string> {
    const { sb, member } = await getMomMember()
    const { data: list, error } = await sb
      .from('lists')
      .insert({
        family_id: member.family_id,
        owner_id: member.id,
        title: `E2E Default ${listType} ${Date.now()}`,
        list_type: listType,
      })
      .select('id, victory_mode')
      .single()
    if (error || !list) throw new Error(`Create ${listType} list failed: ${error?.message}`)
    createdListIds.push(list.id)
    return list.victory_mode
  }

  test('shopping defaults to none', async () => {
    const mode = await createAndCheck('shopping')
    expect(mode).toBe('none')
  })

  test('packing defaults to none', async () => {
    const mode = await createAndCheck('packing')
    expect(mode).toBe('none')
  })

  test('custom defaults to none', async () => {
    const mode = await createAndCheck('custom')
    expect(mode).toBe('none')
  })

  test('randomizer defaults to none (DB default)', async () => {
    // DB default is 'none' for all types. Frontend useCreateList overrides for randomizer.
    const mode = await createAndCheck('randomizer')
    expect(mode).toBe('none')
  })
})

// ════════════════════════════════════════════════════════════
// UI TESTS
// ════════════════════════════════════════════════════════════

test.describe('Victory mode UI', () => {
  let testData: Awaited<ReturnType<typeof createTestList>>

  test.beforeAll(async () => {
    testData = await createTestList({
      title: `E2E VicUI ${Date.now()}`,
      listType: 'todo',
      victoryMode: 'none',
      itemContents: ['UI Item 1', 'UI Item 2', 'UI Item 3'],
    })
  })

  test.afterAll(async () => {
    if (testData) {
      await deleteVictoriesForList(testData.familyId, testData.list.id, testData.items.map(i => i.id))
      await deleteTestList(testData.list.id)
    }
  })

  test('victory mode selector visible and changeable', async ({ page }) => {
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)

    // Mode selector should be visible with "Celebrate" label
    await expect(page.getByText('Celebrate')).toBeVisible()

    // "None" should be active initially
    const noneBtn = page.getByRole('button', { name: 'None' })
    await expect(noneBtn).toBeVisible()

    // Click "Per item"
    const perItemBtn = page.getByRole('button', { name: 'Per item' })
    await perItemBtn.click()
    await page.waitForTimeout(500)

    // Verify the change persisted in DB
    const { sb } = await getMomSupabase()
    const { data } = await sb.from('lists').select('victory_mode').eq('id', testData.list.id).single()
    expect(data?.victory_mode).toBe('item_completed')
  })

  test('auto-flagging works when switching to item_completed', async () => {
    // Previous test set mode to item_completed — check items are now flagged
    const { sb } = await getMomSupabase()
    const { data: items } = await sb.from('list_items').select('victory_flagged').eq('list_id', testData.list.id)
    const flaggedCount = items?.filter((i: { victory_flagged: boolean }) => i.victory_flagged).length ?? 0
    expect(flaggedCount).toBe(3) // All 3 items should be auto-flagged
  })
})

// ════════════════════════════════════════════════════════════
// EDGE CASES
// ════════════════════════════════════════════════════════════

test.describe('Edge cases', () => {
  test('empty list with list_completed mode creates no victory', async () => {
    const { sb, member } = await getMomMember()
    const { data: list } = await sb
      .from('lists')
      .insert({
        family_id: member.family_id,
        owner_id: member.id,
        title: `E2E EmptyVic ${Date.now()}`,
        list_type: 'todo',
        victory_mode: 'list_completed',
      })
      .select()
      .single()
    if (!list) throw new Error('Failed to create empty list')

    const victoryCount = await countVictories(member.family_id, 'list_completed', list.id)
    expect(victoryCount).toBe(0)

    await sb.from('lists').delete().eq('id', list.id)
  })

  test('shared list: last-checker gets the list-level victory', async ({ page }) => {
    const testData = await createTestList({
      title: `E2E SharedVic ${Date.now()}`,
      listType: 'todo',
      victoryMode: 'list_completed',
      itemContents: ['SV Item 1', 'SV Item 2'],
    })

    // Share with Dad
    const { member: dadMember } = await getDadMember()
    await testData.sb.from('list_shares').insert({
      list_id: testData.list.id,
      shared_with: dadMember.id,
      member_id: dadMember.id,
      permission: 'edit',
      can_edit: true,
    })

    // Mom checks item 1
    await loginAsMom(page)
    await navigateToList(page, testData.list.title)
    await checkItemByIndex(page, 0)
    await page.waitForTimeout(500)

    let victoryCount = await countVictories(testData.familyId, 'list_completed', testData.list.id)
    expect(victoryCount).toBe(0)

    // Dad checks item 2 (last item)
    await loginAsDad(page)
    await navigateToList(page, testData.list.title)
    await checkItemByIndex(page, 1)
    await page.waitForTimeout(1500)

    victoryCount = await countVictories(testData.familyId, 'list_completed', testData.list.id)
    expect(victoryCount).toBe(1)

    // Verify it's attributed to Dad
    const { sb } = await getMomSupabase()
    const { data: victories } = await sb
      .from('victories')
      .select('family_member_id')
      .eq('source_reference_id', testData.list.id)
      .eq('source', 'list_completed')
      .single()
    expect(victories?.family_member_id).toBe(dadMember.id)

    // Cleanup
    await deleteVictoriesForList(testData.familyId, testData.list.id, testData.items.map(i => i.id))
    await sb.from('list_shares').delete().eq('list_id', testData.list.id)
    await deleteTestList(testData.list.id)
  })
})
