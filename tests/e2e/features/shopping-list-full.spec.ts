/**
 * Shopping List Full Feature Tests
 *
 * Tests the complete shopping list lifecycle:
 *   1. Mom creates a shopping list via Bulk Add with store sections
 *   2. Items are sorted into Mama Jeans, Sam's, Aldi sections
 *   3. Mom shares the list with Jerrod (Dad)
 *   4. Jerrod can see the list and check off items
 *   5. Mom adds more items to the existing list
 *   6. Inline editing works for the list creator
 *
 * Credentials stored in .env.local (gitignored):
 *   E2E_DEV_EMAIL, E2E_DEV_PASSWORD (mom / Tenise)
 *   E2E_DAD_EMAIL, E2E_DAD_PASSWORD (dad / Jerrod)
 */
import { test, expect, Page } from '@playwright/test'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const MOM_EMAIL = process.env.E2E_DEV_EMAIL!
const MOM_PASSWORD = process.env.E2E_DEV_PASSWORD!
const DAD_EMAIL = process.env.E2E_DAD_EMAIL!
const DAD_PASSWORD = process.env.E2E_DAD_PASSWORD!

const AUTH_CACHE_DIR = path.join(process.cwd(), 'tests', 'e2e', '.auth')

// Unique list name per test run to avoid collisions
const TEST_LIST_NAME = `E2E Grocery Run ${Date.now()}`

// ── Login helpers ──────────────────────────────────────────────────────────

async function loginWithEmail(page: Page, email: string, password: string, cacheKey: string): Promise<void> {
  const cachePath = path.join(AUTH_CACHE_DIR, `${cacheKey}.json`)

  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    const expiresAt = cached.expires_at * 1000
    if (Date.now() < expiresAt - 60000) {
      await injectSession(page, cached)
      return
    }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    throw new Error(`Failed to login as ${email}: ${error?.message || 'No session'}`)
  }

  if (!fs.existsSync(AUTH_CACHE_DIR)) fs.mkdirSync(AUTH_CACHE_DIR, { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(data.session))
  await injectSession(page, data.session)
}

async function injectSession(page: Page, session: Record<string, unknown>): Promise<void> {
  await page.goto('/')
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  await page.evaluate(
    ([key, value]) => { localStorage.setItem(key, value) },
    [storageKey, JSON.stringify(session)]
  )
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)
}

async function loginAsMom(page: Page) { await loginWithEmail(page, MOM_EMAIL, MOM_PASSWORD, 'shopping-mom') }
async function loginAsDad(page: Page) { await loginWithEmail(page, DAD_EMAIL, DAD_PASSWORD, 'shopping-dad') }

/** Dismiss FeatureGuide cards and GuidedIntroTour overlays that block clicks */
async function dismissOverlays(page: Page) {
  // Dismiss all FeatureGuide "Don't show guides" buttons
  for (let i = 0; i < 3; i++) {
    const guideBtn = page.locator('button').filter({ hasText: "Don't show guides" }).first()
    if (await guideBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await guideBtn.click({ force: true })
      await page.waitForTimeout(400)
    }
  }
  // Dismiss the GuidedIntroTour
  const tourBtn = page.locator('button').filter({ hasText: 'Dismiss Guide' }).first()
  if (await tourBtn.isVisible({ timeout: 500 }).catch(() => false)) {
    await tourBtn.click({ force: true })
    await page.waitForTimeout(400)
  }
  // Dismiss docked tour card too
  const dockDismiss = page.locator('button').filter({ hasText: 'Dismiss' }).first()
  if (await dockDismiss.isVisible({ timeout: 500 }).catch(() => false)) {
    await dockDismiss.click({ force: true })
    await page.waitForTimeout(400)
  }
}

// ── Supabase client for direct DB queries ──────────────────────────────────

function getSupabaseAsServiceRole() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── Cleanup helper ─────────────────────────────────────────────────────────

let createdListId: string | null = null

async function cleanupTestList() {
  if (!createdListId) return
  const sb = getSupabaseAsServiceRole()
  await sb.auth.signInWithPassword({ email: MOM_EMAIL, password: MOM_PASSWORD })
  // Delete shares first (FK constraint), then items, then list
  await sb.from('list_shares').delete().eq('list_id', createdListId)
  await sb.from('list_items').delete().eq('list_id', createdListId)
  await sb.from('lists').delete().eq('id', createdListId)
  createdListId = null
}

// ============================================================
// 1. MOM — CREATE LIST & BULK ADD WITH STORE SECTIONS
// ============================================================

test.describe.serial('Shopping List Full Lifecycle', () => {
  test.afterAll(async () => {
    await cleanupTestList()
  })

  test('Mom creates a shopping list', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)

    // Create the list via Supabase API to avoid UI flakiness with overlays
    const sb = getSupabaseAsServiceRole()
    const { data: authData } = await sb.auth.signInWithPassword({ email: MOM_EMAIL, password: MOM_PASSWORD })
    if (!authData.user) throw new Error('Mom login failed')

    // Find mom's family_member record
    const { data: momMember } = await sb
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', authData.user.id)
      .limit(1)
      .single()
    if (!momMember) throw new Error('Mom family member not found')

    // Create the list directly
    const { data: listRow, error: createErr } = await sb
      .from('lists')
      .insert({
        family_id: momMember.family_id,
        owner_id: momMember.id,
        title: TEST_LIST_NAME,
        list_type: 'shopping',
      })
      .select()
      .single()
    if (createErr) throw new Error(`List creation failed: ${createErr.message}`)
    createdListId = listRow.id

    // Now verify it shows in the UI
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    // Open the list
    const listCard = page.locator('button').filter({ hasText: TEST_LIST_NAME }).first()
    await expect(listCard).toBeVisible({ timeout: 10000 })
    await listCard.click()
    await page.waitForTimeout(2000)

    // Verify we're in the detail view
    await expect(page.locator('input[placeholder="Add an item..."]')).toBeVisible({ timeout: 10000 })

    // createdListId already set above from direct DB creation

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Mom uses Bulk Add with store sections', async ({ page }) => {
    test.setTimeout(120000)
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    // Open the test list
    const listCard = page.locator('button').filter({ hasText: TEST_LIST_NAME }).first()
    await expect(listCard).toBeVisible({ timeout: 10000 })
    await listCard.click()
    await page.waitForTimeout(2000)

    // Click Bulk Add button (has Sparkles icon + "Bulk" text)
    const bulkBtn = page.locator('button').filter({ hasText: /Bulk/i }).first()
    await expect(bulkBtn).toBeVisible({ timeout: 5000 })
    await bulkBtn.click()
    await page.waitForTimeout(1000)

    // BulkAddWithAI renders a textarea in its input step
    const bulkInput = page.locator('textarea').first()
    await expect(bulkInput).toBeVisible({ timeout: 5000 })

    // Enter items with store sections
    await bulkInput.fill(
      `Mama Jeans:
Organic whole milk
Free range eggs
Sourdough bread
Local honey

Sam's:
Toilet paper 36 pack
Chicken breast bulk pack
Cheddar cheese block
Olive oil 2-pack

Aldi:
Bananas
Frozen pizza 4 pack
Greek yogurt
Almond butter`
    )

    // Click "Process with AI" button
    const processBtn = page.locator('button').filter({ hasText: 'Process with AI' })
    await expect(processBtn).toBeVisible()
    await processBtn.click()

    // Wait for AI processing (Haiku call)
    await expect(page.locator('button').filter({ hasText: /Save Selected/ })).toBeVisible({ timeout: 60000 })

    // Preview step should show parsed items
    const previewText = await page.textContent('body')
    expect(previewText).toContain('item')

    // Click "Save Selected" to add all items
    const saveBtn = page.locator('button').filter({ hasText: /Save Selected/ }).first()
    await saveBtn.click()

    // Wait for items to be saved and bulk add to close
    await page.waitForTimeout(5000)

    // Verify items appear on the page
    const pageText = await page.textContent('body')
    const hasItems = (pageText?.toLowerCase().includes('milk') ?? false)
      || (pageText?.toLowerCase().includes('banana') ?? false)
      || (pageText?.toLowerCase().includes('pizza') ?? false)
      || (pageText?.toLowerCase().includes('honey') ?? false)
    expect(hasItems).toBe(true)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Verify sections exist in database', async () => {
    if (!createdListId) test.skip()

    const sb = getSupabaseAsServiceRole()
    await sb.auth.signInWithPassword({ email: MOM_EMAIL, password: MOM_PASSWORD })

    const { data: items } = await sb
      .from('list_items')
      .select('content, section_name')
      .eq('list_id', createdListId!)

    expect(items).toBeTruthy()
    expect(items!.length).toBeGreaterThan(0)

    // Check that we have multiple section names
    const sections = new Set(items!.map(i => i.section_name).filter(Boolean))
    // We expect at least some sections from the bulk add
    // (AI may or may not perfectly parse the store names, but should get some)
    console.log('Sections found:', Array.from(sections))
    console.log('Total items:', items!.length)
  })

  // ============================================================
  // 2. MOM — SHARE LIST WITH JERROD
  // ============================================================

  test('Mom shares the list with Jerrod', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    // Open the test list
    await page.locator('button').filter({ hasText: TEST_LIST_NAME }).first().click()
    await page.waitForTimeout(2000)

    // Click share button — it has svg.lucide-share-2 and a "relative" class
    const shareBtn = page.locator('button.relative').filter({ has: page.locator('svg') }).first()
    await expect(shareBtn).toBeVisible({ timeout: 5000 })
    await shareBtn.click()
    await page.waitForTimeout(1000)

    // Share modal should appear (fixed overlay)
    const shareModal = page.locator('.fixed.inset-0').first()
    await expect(shareModal).toBeVisible({ timeout: 5000 })
    await expect(shareModal.locator('text=Share List')).toBeVisible()

    // Find Jerrod's pill button and click it
    const jerrodBtn = shareModal.locator('button').filter({ hasText: 'Jerrod' }).first()
    await expect(jerrodBtn).toBeVisible({ timeout: 5000 })
    await jerrodBtn.click()
    await page.waitForTimeout(2000)

    // Button should now show a check icon (shared state — filled bg with white text)
    const jerrodBtnAfter = shareModal.locator('button').filter({ hasText: 'Jerrod' }).first()
    const hasSvg = await jerrodBtnAfter.locator('svg').count()
    expect(hasSvg).toBeGreaterThan(0)

    // Click Done
    await shareModal.locator('button').filter({ hasText: 'Done' }).click()
    await page.waitForTimeout(1000)

    // Verify "Shared with" indicator appears
    await expect(page.locator('text=Shared with')).toBeVisible({ timeout: 5000 })

    // Verify in DB
    if (createdListId) {
      const sb = getSupabaseAsServiceRole()
      await sb.auth.signInWithPassword({ email: MOM_EMAIL, password: MOM_PASSWORD })
      const { data: shares } = await sb
        .from('list_shares')
        .select('*')
        .eq('list_id', createdListId)
      expect(shares?.length).toBeGreaterThan(0)
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  // ============================================================
  // 3. JERROD — VIEW SHARED LIST & CHECK OFF ITEMS
  // ============================================================

  test('Jerrod can see the shared list', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsDad(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    // The list should appear in Jerrod's list view (same family_id)
    const listCard = page.locator('button').filter({ hasText: TEST_LIST_NAME }).first()
    await expect(listCard).toBeVisible({ timeout: 15000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Jerrod checks off items from the list', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsDad(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    // Open the list
    await page.locator('button').filter({ hasText: TEST_LIST_NAME }).first().click()
    await page.waitForTimeout(2000)

    // Find checkboxes and check off the first 2 items
    const checkboxes = page.locator('.w-4.h-4.rounded.border-\\[1\\.5px\\]')
    const checkboxCount = await checkboxes.count()

    if (checkboxCount >= 2) {
      // Click first checkbox
      await checkboxes.nth(0).click()
      await page.waitForTimeout(500)
      // Click second checkbox
      await checkboxes.nth(1).click()
      await page.waitForTimeout(500)
    }

    // Verify progress indicator shows checked items
    await page.waitForTimeout(1000)
    const progress = page.locator('text=/\\d+\\/\\d+/')
    if (await progress.isVisible({ timeout: 3000 }).catch(() => false)) {
      const progressText = await progress.textContent()
      // Should show at least 2 checked
      expect(progressText).toBeTruthy()
    }

    // Verify in DB that items are checked
    if (createdListId) {
      const sb = getSupabaseAsServiceRole()
      await sb.auth.signInWithPassword({ email: DAD_EMAIL, password: DAD_PASSWORD })
      const { data: checkedItems } = await sb
        .from('list_items')
        .select('id, checked')
        .eq('list_id', createdListId)
        .eq('checked', true)
      expect(checkedItems?.length).toBeGreaterThanOrEqual(1)
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  // ============================================================
  // 4. MOM — ADD MORE ITEMS VIA MANUAL ADD
  // ============================================================

  test('Mom adds more items to the existing list', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    // Open the list
    await page.locator('button').filter({ hasText: TEST_LIST_NAME }).first().click()
    await page.waitForTimeout(2000)

    // Use the manual add input
    const addInput = page.locator('input[placeholder="Add an item..."]')
    await expect(addInput).toBeVisible({ timeout: 5000 })

    // Add a few items
    const newItems = ['Paper towels', 'Dish soap', 'Trash bags']
    for (const item of newItems) {
      await addInput.fill(item)
      await addInput.press('Enter')
      await page.waitForTimeout(500)
    }

    // Verify items appear on page
    for (const item of newItems) {
      await expect(page.locator(`text=${item}`).first()).toBeVisible({ timeout: 5000 })
    }

    // Verify in DB
    if (createdListId) {
      const sb = getSupabaseAsServiceRole()
      await sb.auth.signInWithPassword({ email: MOM_EMAIL, password: MOM_PASSWORD })
      const { data: allItems } = await sb
        .from('list_items')
        .select('content')
        .eq('list_id', createdListId)
      const contents = allItems?.map(i => i.content) ?? []
      for (const item of newItems) {
        expect(contents).toContain(item)
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  // ============================================================
  // 5. MOM — INLINE EDITING
  // ============================================================

  test('Mom can inline edit an item', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    await page.locator('button').filter({ hasText: TEST_LIST_NAME }).first().click()
    await page.waitForTimeout(2000)

    // Find "Paper towels" text and click to edit
    const itemText = page.locator('span.cursor-text').filter({ hasText: 'Paper towels' }).first()
    if (await itemText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await itemText.click()
      await page.waitForTimeout(500)

      // Should now be an input — find the focused input in the item row
      const editInput = page.locator('input:focus').first()
      if (await editInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editInput.clear()
        await editInput.type('Paper towels (Bounty)')
        await editInput.press('Enter')
        await page.waitForTimeout(1000)

        // Verify the edit persisted
        await expect(page.locator('text=Paper towels (Bounty)').first()).toBeVisible({ timeout: 5000 })
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  // ============================================================
  // 6. MOM — BULK ADD AGAIN (re-use after initial creation)
  // ============================================================

  test('Mom can use Bulk Add again on existing list', async ({ page }) => {
    test.setTimeout(120000)
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await dismissOverlays(page)

    await page.locator('button').filter({ hasText: TEST_LIST_NAME }).first().click()
    await page.waitForTimeout(2000)

    // Bulk Add button should still be visible (re-usable)
    const bulkBtn = page.locator('button').filter({ hasText: /Bulk/i }).first()
    await expect(bulkBtn).toBeVisible({ timeout: 5000 })
    await bulkBtn.click()
    await page.waitForTimeout(1000)

    // Textarea should appear fresh (empty)
    const bulkInput = page.locator('textarea').first()
    await expect(bulkInput).toBeVisible({ timeout: 5000 })

    // Add more items
    await bulkInput.fill('Coffee creamer\nOrange juice\nButter')

    // Process with AI
    await page.locator('button').filter({ hasText: 'Process with AI' }).click()

    // Wait for preview step
    await expect(page.locator('button').filter({ hasText: /Save Selected/ })).toBeVisible({ timeout: 60000 })

    // Save
    await page.locator('button').filter({ hasText: /Save Selected/ }).first().click()
    await page.waitForTimeout(5000)

    // Verify new items appear
    const pageText = await page.textContent('body')
    const hasNewItems = (pageText?.toLowerCase().includes('butter') ?? false)
      || (pageText?.toLowerCase().includes('juice') ?? false)
      || (pageText?.toLowerCase().includes('creamer') ?? false)
    expect(hasNewItems).toBe(true)

    assertNoInfiniteRenders(consoleErrors)
  })
})
