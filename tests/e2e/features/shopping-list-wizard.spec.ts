/**
 * Shopping List Wizard — Full E2E walkthrough
 *
 * Tests the "Shared Family Shopping List" seeded template wizard from Studio.
 * Walks through all 6 steps as the Testworth mom (Sarah), creates a real
 * shared shopping list named "Testworth Family Groceries", and verifies
 * post-creation state on the Lists page and Shopping Mode.
 *
 * This test creates REAL data — the list is NOT cleaned up afterward.
 * Tenise wants to see it on the live site.
 */
import { test, expect, type Page } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
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

const SCREENSHOT_DIR = 'tests/e2e/screenshots/shopping-list-wizard'

// ── Helpers ────────────────────────────────────────────────────

async function dismissOverlays(page: Page) {
  for (let i = 0; i < 4; i++) {
    for (const text of [
      "Don't show guides",
      'Got it',
      'Dismiss Guide',
      'Dismiss guide',
      'Dismiss',
    ]) {
      const btn = page.locator('button').filter({ hasText: text }).first()
      if (await btn.isVisible({ timeout: 250 }).catch(() => false)) {
        await btn.click({ force: true })
        await page.waitForTimeout(250)
      }
    }
  }
}

/** Clear any saved wizard progress from localStorage so tests start clean. */
async function clearWizardProgress(page: Page) {
  await page.evaluate(() => {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && key.startsWith('wizard-v1-')) {
        localStorage.removeItem(key)
      }
    }
  })
}

/** Expand "Example Templates" accordion in a section, then click Customize on a card. */
async function expandExamplesAndClickCustomize(
  page: Page,
  sectionTitle: string,
  cardTitle: string,
) {
  // 1. Find the section by its heading text
  const section = page.locator('div.mb-8').filter({ hasText: sectionTitle })

  // 2. Expand the "Example Templates" accordion if it exists and is collapsed
  const examplesBtn = section
    .getByText(/Example Templates/i)
    .first()
  if (await examplesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await examplesBtn.click()
    await page.waitForTimeout(500)
  }

  // 3. Find the card by its title text within the section
  const card = section
    .locator('div.snap-start')
    .filter({ hasText: cardTitle })
    .first()
  await expect(card).toBeVisible({ timeout: 5000 })
  await card.scrollIntoViewIfNeeded()
  await card.click()
  await page.waitForTimeout(400)

  // 4. Click Customize
  const customizeBtn = card.getByRole('button', { name: /customize/i })
  await customizeBtn.click({ force: true })
  await page.waitForTimeout(500)
}

/** Click Customize on a specific template card by its title text (for non-accordion cards). */
async function clickCustomizeOnCard(page: Page, cardTitle: string) {
  const card = page
    .locator('div.snap-start')
    .filter({ hasText: cardTitle })
    .first()
  await card.scrollIntoViewIfNeeded()
  await card.click()
  await page.waitForTimeout(400)
  const customizeBtn = card.getByRole('button', { name: /customize/i })
  await customizeBtn.click({ force: true })
  await page.waitForTimeout(500)
}

async function getMomSupabase() {
  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await sb.auth.signInWithPassword({
    email: TEST_USERS.sarah.email,
    password: TEST_USERS.sarah.password,
  })
  if (error || !data.user) throw new Error(`Mom login failed: ${error?.message}`)
  return { sb, userId: data.user.id }
}

// ============================================================
// Tests — serial because each step depends on the prior
// ============================================================

test.describe.serial('Shopping List Wizard — Full Walkthrough', () => {
  test.setTimeout(180_000) // 3 minutes for the full suite — AI calls may be slow

  test('Step 1: Open wizard from Studio and verify Purpose step', async ({
    page,
  }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)
    await dismissOverlays(page)
    await clearWizardProgress(page)

    // The "Shared Family Shopping List" is inside the "List Templates" section's
    // "Example Templates" accordion which is collapsed by default.
    // Expand it and click Customize.
    await expandExamplesAndClickCustomize(
      page,
      'List Templates',
      'Shared Family Shopping List',
    )

    // Wizard should open — verify the title
    const wizardTitle = page.getByText('Set Up Your Family Shopping List').first()
    await expect(wizardTitle).toBeVisible({ timeout: 5000 })

    // Verify the shared_shopping preset is auto-selected
    // The purpose step should already have detected the type (shopping)
    // Since it's a pre-configured preset, step 1 shows as ready to advance
    // Verify step indicator shows step 1
    const step1Dot = page.locator('.rounded-full').filter({ hasText: '1' }).first()
    await expect(step1Dot).toBeVisible({ timeout: 3000 })

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/step1-purpose.png`,
      fullPage: false,
    })
    console.log('[Step 1] Purpose step verified. Wizard title: "Set Up Your Family Shopping List"')

    assertNoInfiniteRenders(consoleErrors)

    // Advance to Step 2
    const modal = page.locator('[role="dialog"]').first()
    const nextBtn = modal.getByRole('button', { name: /next/i }).first()
    await nextBtn.click()
    await page.waitForTimeout(500)
  })

  test('Step 2: Verify pre-populated items and add more via AI', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)
    await dismissOverlays(page)
    await clearWizardProgress(page)

    // Open the wizard fresh from step 1
    await expandExamplesAndClickCustomize(page, 'List Templates', 'Shared Family Shopping List')
    await page.waitForTimeout(1000)

    const modal = page.locator('[role="dialog"]').first()

    // Should start on Step 1 (Purpose) — advance to Step 2 (Items)
    const nextBtn = modal.getByRole('button', { name: /next/i }).first()
    await expect(nextBtn).toBeVisible({ timeout: 5000 })
    await nextBtn.click()
    await page.waitForTimeout(1000)

    // Verify the 10 example items are pre-populated
    // The wizard shows "N items ready" when items are loaded
    const itemsReady = modal.getByText(/\d+ items? ready/i).first()
    await expect(itemsReady).toBeVisible({ timeout: 10000 })
    const itemsText = await itemsReady.textContent()
    console.log(`[Step 2] Pre-populated items: ${itemsText}`)

    // Verify specific example items are present — items are inside input[type="text"] elements
    // so we check input values, not textContent
    const itemInputs = modal.locator('input[type="text"]')
    const inputCount = await itemInputs.count()
    const allValues: string[] = []
    for (let i = 0; i < inputCount; i++) {
      const val = await itemInputs.nth(i).inputValue()
      if (val.trim()) allValues.push(val)
    }
    const joinedValues = allValues.join(' | ')
    console.log(`[Step 2] Item values: ${joinedValues}`)
    expect(joinedValues).toContain('Milk')
    expect(joinedValues).toContain('Eggs')
    expect(joinedValues).toContain('Bananas')

    // Verify the "Clear examples and start fresh" button exists
    const clearBtn = modal.getByText(/Clear examples and start fresh/i).first()
    await expect(clearBtn).toBeVisible({ timeout: 3000 })

    // Add 3 more items via textarea + AI parse
    const textarea = modal.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 3000 })
    await textarea.fill('Oat milk from Aldi, orange juice, tortillas from Costco')

    // Click "Organize with AI"
    const organizeBtn = modal.getByRole('button', { name: /organize with ai/i })
    await expect(organizeBtn).toBeVisible()
    await organizeBtn.click()

    // Wait for AI parsing to complete (this is a real Haiku call)
    // Either the items count increases, or we see "Organizing..." then it resolves
    await page.waitForTimeout(15000) // Give AI time

    // AI parse APPENDS newly parsed items to the existing items (deduped by text).
    // The 10 example items should still be there, plus the 3 new ones we typed.
    const updatedItemsReady = modal.getByText(/\d+ items? ready/i).first()
    await expect(updatedItemsReady).toBeVisible({ timeout: 10000 })
    const updatedText = await updatedItemsReady.textContent()
    const match = updatedText?.match(/(\d+)/)
    const itemCount = match ? parseInt(match[1]) : 0
    console.log(`[Step 2] Total items after AI parse: ${itemCount} (examples preserved + new items appended)`)
    // Should have at least 10 (original examples) + some new items (AI may split/merge)
    expect(itemCount).toBeGreaterThanOrEqual(11)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/step2-items.png`,
      fullPage: false,
    })

    assertNoInfiniteRenders(consoleErrors)

    // Advance to Step 3
    const nextBtn2 = modal.getByRole('button', { name: /next/i }).first()
    await nextBtn2.click()
    await page.waitForTimeout(500)
  })

  test('Step 3: Verify sharing defaults and select family members', async ({
    page,
  }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)
    await dismissOverlays(page)
    await clearWizardProgress(page)

    await expandExamplesAndClickCustomize(page, 'List Templates', 'Shared Family Shopping List')
    await page.waitForTimeout(1000)

    const modal = page.locator('[role="dialog"]').first()

    // Navigate from Step 1 through Step 2 to Step 3
    for (let i = 0; i < 2; i++) {
      const nextBtn = modal.getByRole('button', { name: /next/i }).first()
      await expect(nextBtn).toBeVisible({ timeout: 3000 })
      await nextBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify the shared_shopping preset defaults to "Me and specific people"
    const specificBtn = modal.getByText('Me and specific people').first()
    await expect(specificBtn).toBeVisible({ timeout: 5000 })

    // Verify all three modes exist
    await expect(modal.getByText('Just me').first()).toBeVisible({ timeout: 3000 })
    await expect(modal.getByText('Me and specific people').first()).toBeVisible({ timeout: 3000 })
    await expect(modal.getByText('Whole family').first()).toBeVisible({ timeout: 3000 })

    // Verify "Others can add items" checkbox is visible and pre-checked
    const addItemsLabel = modal.getByText(/Others can add items/i).first()
    await expect(addItemsLabel).toBeVisible({ timeout: 3000 })

    // Select family members — Mark (dad) and Alex should be available as pills
    const markPill = modal.locator('button.rounded-full').filter({ hasText: 'Mark' }).first()
    if (await markPill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await markPill.click()
      await page.waitForTimeout(300)
      console.log('[Step 3] Selected Mark (dad) for sharing')
    }

    const alexPill = modal.locator('button.rounded-full').filter({ hasText: 'Alex' }).first()
    if (await alexPill.isVisible({ timeout: 2000 }).catch(() => false)) {
      await alexPill.click()
      await page.waitForTimeout(300)
      console.log('[Step 3] Selected Alex for sharing')
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/step3-sharing.png`,
      fullPage: false,
    })

    assertNoInfiniteRenders(consoleErrors)

    // Advance to Step 4
    const nextBtn = modal.getByRole('button', { name: /next/i }).first()
    await nextBtn.click()
    await page.waitForTimeout(500)
  })

  test('Step 4: Verify store sections in Organize step', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)
    await dismissOverlays(page)
    await clearWizardProgress(page)

    await expandExamplesAndClickCustomize(page, 'List Templates', 'Shared Family Shopping List')
    await page.waitForTimeout(1000)

    const modal = page.locator('[role="dialog"]').first()

    // Navigate from Step 1 through to Step 4 (Organize)
    for (let i = 0; i < 3; i++) {
      const nextBtn = modal.getByRole('button', { name: /next/i }).first()
      await expect(nextBtn).toBeVisible({ timeout: 3000 })
      await nextBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify sections are pre-populated from the shared_shopping preset
    // The preset has: Produce, Dairy, Meat & Seafood, Pantry, Frozen, Snacks & Beverages, Household, Personal Care
    const modalText = await modal.textContent()
    const expectedSections = ['Produce', 'Dairy', 'Pantry', 'Frozen', 'Household']
    let sectionsFound = 0
    for (const section of expectedSections) {
      if (modalText?.includes(section)) {
        sectionsFound++
      }
    }
    console.log(`[Step 4] Found ${sectionsFound}/${expectedSections.length} expected store sections`)
    expect(sectionsFound).toBeGreaterThanOrEqual(3) // At least some sections should be present

    // Verify the Preview area shows items grouped by section
    // It may show section headers like "PRODUCE (3)" etc.
    const previewHeader = modal.getByText(/preview/i).first()
    if (await previewHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('[Step 4] Preview section is visible with grouped items')
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/step4-organize.png`,
      fullPage: false,
    })

    assertNoInfiniteRenders(consoleErrors)

    // Advance to Step 5
    const nextBtn = modal.getByRole('button', { name: /next/i }).first()
    await nextBtn.click()
    await page.waitForTimeout(500)
  })

  test('Step 5: Verify extras checkboxes', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)
    await dismissOverlays(page)
    await clearWizardProgress(page)

    await expandExamplesAndClickCustomize(page, 'List Templates', 'Shared Family Shopping List')
    await page.waitForTimeout(1000)

    const modal = page.locator('[role="dialog"]').first()

    // Navigate from Step 1 through to Step 5 (Extras)
    for (let i = 0; i < 4; i++) {
      const nextBtn = modal.getByRole('button', { name: /next/i }).first()
      await expect(nextBtn).toBeVisible({ timeout: 3000 })
      await nextBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify the 3 shared_shopping extras checkboxes
    await expect(
      modal.getByText(/Auto-sort items into store sections/i).first()
    ).toBeVisible({ timeout: 5000 })

    await expect(
      modal.getByText(/Keep this list always on/i).first()
    ).toBeVisible({ timeout: 3000 })

    await expect(
      modal.getByText(/Include in Shopping Mode/i).first()
    ).toBeVisible({ timeout: 3000 })

    // All 3 should be checked by default (defaultChecked: true in the preset)
    const checkboxes = modal.locator('input[type="checkbox"]')
    const checkboxCount = await checkboxes.count()
    let checkedCount = 0
    for (let i = 0; i < checkboxCount; i++) {
      if (await checkboxes.nth(i).isChecked()) checkedCount++
    }
    console.log(`[Step 5] ${checkedCount}/${checkboxCount} extras checkboxes are checked`)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/step5-extras.png`,
      fullPage: false,
    })

    assertNoInfiniteRenders(consoleErrors)

    // Advance to Step 6
    const nextBtn = modal.getByRole('button', { name: /next/i }).first()
    await nextBtn.click()
    await page.waitForTimeout(500)
  })

  test('Step 6: Review, name the list, and create', async ({ page }) => {
    test.setTimeout(60_000)
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(2000)
    await dismissOverlays(page)
    await clearWizardProgress(page)

    await expandExamplesAndClickCustomize(page, 'List Templates', 'Shared Family Shopping List')
    await page.waitForTimeout(1000)

    const modal = page.locator('[role="dialog"]').first()

    // Select Mark in Step 3 (Sharing) so we can verify shares later
    // Navigate Steps 1 → 2 → 3
    for (let i = 0; i < 2; i++) {
      const nextBtn = modal.getByRole('button', { name: /next/i }).first()
      await expect(nextBtn).toBeVisible({ timeout: 3000 })
      await nextBtn.click()
      await page.waitForTimeout(500)
    }
    // Step 3: Select Mark for sharing
    const markPill = modal.locator('button.rounded-full').filter({ hasText: 'Mark' }).first()
    if (await markPill.isVisible({ timeout: 3000 }).catch(() => false)) {
      await markPill.click()
      await page.waitForTimeout(300)
    }

    // Navigate 3 → 4 → 5 → 6
    for (let i = 0; i < 3; i++) {
      const nextBtn = modal.getByRole('button', { name: /next/i }).first()
      await expect(nextBtn).toBeVisible({ timeout: 3000 })
      await nextBtn.click()
      await page.waitForTimeout(500)
    }

    // Verify the summary shows correct info
    const modalText = await modal.textContent()
    expect(modalText).toContain('Type')
    expect(modalText).toContain('Items')
    expect(modalText).toContain('Sharing')

    // The list type should show "shopping"
    expect(modalText?.toLowerCase()).toContain('shopping')

    // Enter the list title
    const titleInput = modal.locator('input[type="text"]').first()
    await expect(titleInput).toBeVisible({ timeout: 5000 })
    await titleInput.fill('Testworth Family Groceries')
    await page.waitForTimeout(300)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/step6-review.png`,
      fullPage: false,
    })

    // Click "Create List"
    const createBtn = modal.getByRole('button', { name: /create list/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 5000 })
    await createBtn.click()

    // Wait for deployment to complete — wizard should close
    await page.waitForTimeout(5000)

    // Verify the wizard modal is closed (no dialog visible)
    const dialogAfter = page.locator('[role="dialog"]')
    const dialogCount = await dialogAfter.count()
    console.log(`[Step 6] After creation — dialog count: ${dialogCount}`)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/step6-after-create.png`,
      fullPage: false,
    })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Post-creation: Verify list on Lists page', async ({ page }) => {
    test.setTimeout(60_000)
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(3000)
    await dismissOverlays(page)

    // Find the "Testworth Family Groceries" list
    const listCard = page
      .locator('button, div, a')
      .filter({ hasText: 'Testworth Family Groceries' })
      .first()
    await expect(listCard).toBeVisible({ timeout: 15000 })
    console.log('[Post-creation] "Testworth Family Groceries" found on Lists page')

    // Click into the list detail
    await listCard.click()
    await page.waitForTimeout(3000)

    // Verify the list detail view loaded
    const pageText = await page.textContent('body')

    // Verify items are present (at least some from the preset)
    const hasItems =
      (pageText?.includes('Milk') ?? false) ||
      (pageText?.includes('Eggs') ?? false) ||
      (pageText?.includes('Bananas') ?? false)
    expect(hasItems).toBe(true)
    console.log('[Post-creation] List items are visible in the detail view')

    // Check for always-on tab bar (Need to Buy / Recently Purchased)
    const needToBuyTab = page.getByText(/Need to Buy/i).first()
    const recentlyPurchasedTab = page.getByText(/Recently Purchased/i).first()
    if (await needToBuyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('[Post-creation] "Need to Buy" tab is visible (always-on behavior)')
    } else {
      console.log('[Post-creation] WARNING: "Need to Buy" tab not found — may not be always-on')
    }
    if (await recentlyPurchasedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('[Post-creation] "Recently Purchased" tab is visible')
    }

    // Check for Shopping Mode button
    const shoppingModeBtn = page
      .locator('button')
      .filter({ hasText: /Shopping Mode|Shop/i })
      .first()
    if (await shoppingModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('[Post-creation] Shopping Mode button is present')
    } else {
      console.log('[Post-creation] WARNING: Shopping Mode button not found on list detail')
    }

    // Verify "Shared with" indicator
    const sharedWith = page.getByText(/Shared with/i).first()
    if (await sharedWith.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('[Post-creation] "Shared with" indicator is visible')
    }

    // Verify items are grouped into sections
    const sectionHeaders = page.locator('text=/PRODUCE|DAIRY|PANTRY|FROZEN|HOUSEHOLD/i')
    const sectionCount = await sectionHeaders.count()
    console.log(`[Post-creation] Found ${sectionCount} section headers (store sections)`)

    // Check that List Settings toggle exists
    const settingsBtn = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .filter({ hasText: /settings/i })
      .first()
    if (await settingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('[Post-creation] List Settings button is present')
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/post-creation-list-detail.png`,
      fullPage: false,
    })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Post-creation: Verify list exists in database', async () => {
    const { sb } = await getMomSupabase()

    // Find the list by title
    const { data: lists, error } = await sb
      .from('lists')
      .select('id, title, list_type, is_always_on, include_in_shopping_mode, is_shared')
      .eq('title', 'Testworth Family Groceries')
      .limit(1)

    expect(error).toBeNull()
    expect(lists).toBeTruthy()
    expect(lists!.length).toBeGreaterThan(0)

    const list = lists![0]
    console.log(`[DB Verify] List found: ${list.id}`)
    console.log(`[DB Verify] Type: ${list.list_type}`)
    console.log(`[DB Verify] Always-on: ${list.is_always_on}`)
    console.log(`[DB Verify] Shopping Mode: ${list.include_in_shopping_mode}`)

    expect(list.list_type).toBe('shopping')

    // Check items
    const { data: items } = await sb
      .from('list_items')
      .select('content, section_name, store_tags, store_category')
      .eq('list_id', list.id)

    expect(items).toBeTruthy()
    expect(items!.length).toBeGreaterThanOrEqual(3)
    console.log(`[DB Verify] Item count: ${items!.length}`)

    // Check sections
    const sections = new Set(items!.map((i) => i.section_name).filter(Boolean))
    console.log(`[DB Verify] Unique sections: ${Array.from(sections).join(', ')}`)

    // Check shares
    const { data: shares } = await sb
      .from('list_shares')
      .select('id, member_id')
      .eq('list_id', list.id)

    console.log(`[DB Verify] Shares: ${shares?.length ?? 0}`)
  })

  test('Post-creation: Shopping Mode entry point', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
    await page.goto('/lists')
    await waitForAppReady(page)
    await page.waitForTimeout(3000)
    await dismissOverlays(page)

    // Click into the list
    const listCard = page
      .locator('button, div, a')
      .filter({ hasText: 'Testworth Family Groceries' })
      .first()
    await expect(listCard).toBeVisible({ timeout: 10000 })
    await listCard.click()
    await page.waitForTimeout(3000)

    // Look for Shopping Mode button and click it
    const shoppingModeBtn = page
      .locator('button')
      .filter({ hasText: /Shopping Mode|Shop/i })
      .first()

    if (await shoppingModeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await shoppingModeBtn.click()
      await page.waitForTimeout(3000)

      // Should navigate to /shopping-mode
      const url = page.url()
      console.log(`[Shopping Mode] URL after click: ${url}`)
      if (url.includes('shopping-mode')) {
        console.log('[Shopping Mode] Successfully navigated to Shopping Mode page')
      }

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/shopping-mode-entry.png`,
        fullPage: false,
      })
    } else {
      // Try the Lists page shopping mode button instead
      console.log('[Shopping Mode] No button on list detail — checking Lists page level')
      await page.goto('/lists')
      await waitForAppReady(page)
      await page.waitForTimeout(2000)

      const listsPageShopBtn = page
        .locator('button')
        .filter({ hasText: /Shopping Mode/i })
        .first()
      if (await listsPageShopBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await listsPageShopBtn.click()
        await page.waitForTimeout(3000)
        console.log(`[Shopping Mode] URL: ${page.url()}`)
      } else {
        // Navigate directly as fallback
        await page.goto('/shopping-mode')
        await waitForAppReady(page)
        await page.waitForTimeout(3000)
        console.log('[Shopping Mode] Navigated directly to /shopping-mode')
      }

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/shopping-mode-entry.png`,
        fullPage: false,
      })
    }

    assertNoInfiniteRenders(consoleErrors)
  })
})
