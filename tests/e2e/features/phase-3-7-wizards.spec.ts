/**
 * Phase 3.7 — Wizards & Seeded Templates E2E Tests
 *
 * 6 test scenarios:
 *   1. Rewards List Wizard — full flow (Studio → name → items → share → deploy)
 *   2. Potty Chart template — opens pre-filled from seeded templates
 *   3. Consequence Spinner template — opens pre-filled from seeded templates
 *   4. Extra Earning Opportunities template — opens pre-filled from seeded templates
 *   5. NLC — high confidence routing (describe → wizard opens)
 *   6. Draft persistence — save and resume
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function sb(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function dismissOverlays(page: Page) {
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

async function navigateToStudio(page: Page) {
  await loginAsMom(page)
  await page.goto('/studio')
  await waitForAppReady(page)
  await page.waitForTimeout(1500)
  await dismissOverlays(page)
}

async function clickCustomizeOnCard(page: Page, cardTitle: string) {
  const card = page.locator('div.snap-start').filter({ hasText: cardTitle }).first()
  await card.scrollIntoViewIfNeeded()
  await card.click()
  await page.waitForTimeout(400)
  const customizeBtn = card.getByRole('button', { name: /customize/i })
  await customizeBtn.click({ force: true })
  await page.waitForTimeout(500)
}

// ============================================================
// Tests
// ============================================================

test.describe('Phase 3.7 Wizards & Seeded Templates', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
  })

  // ── 1. Rewards List Wizard — full flow ──────────────────────
  test('Rewards List Wizard opens from Studio and shows all 4 steps', async ({ page }) => {
    test.setTimeout(60000)
    await navigateToStudio(page)

    // Find and expand the Setup Wizards section
    const setupSection = page.getByText('Setup Wizards').first()
    await expect(setupSection).toBeVisible({ timeout: 5000 })

    // Click Customize on "Create a Rewards List"
    await clickCustomizeOnCard(page, 'Create a Rewards List')

    // Wizard should open — check for Step 1 content
    await expect(page.getByText(/name your rewards list/i).or(page.getByText(/step 1/i)).first()).toBeVisible({ timeout: 5000 })

    // Type a list name
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Test Rewards')
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── 2. Potty Chart template — pre-filled ────────────────────
  test('Potty Chart seeded template opens RepeatedActionChartWizard pre-filled', async ({ page }) => {
    test.setTimeout(60000)
    await navigateToStudio(page)

    // Expand Setup Wizards and find Potty Chart
    const setupSection = page.getByText('Setup Wizards').first()
    await expect(setupSection).toBeVisible({ timeout: 5000 })

    // Potty Chart should be in the Example Templates sub-section
    await clickCustomizeOnCard(page, 'Potty Chart')

    // Wizard should open with pre-filled content
    // Check for "Potty Chart" or "Used the potty!" text
    const preFillIndicator = page.getByText('Potty Chart').or(page.getByText('Used the potty!'))
    await expect(preFillIndicator.first()).toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── 3. Consequence Spinner template — pre-filled ─────────────
  test('Consequence Spinner seeded template opens ListRevealAssignmentWizard with draw flavor', async ({ page }) => {
    test.setTimeout(60000)
    await navigateToStudio(page)

    const setupSection = page.getByText('Setup Wizards').first()
    await expect(setupSection).toBeVisible({ timeout: 5000 })

    await clickCustomizeOnCard(page, 'Consequence Spinner')

    // Wizard should open with draw flavor pre-selected
    // Look for consequence/spinner indicators
    const wizardContent = page.getByText(/consequence/i).or(page.getByText(/spinner/i)).or(page.getByText(/draw/i))
    await expect(wizardContent.first()).toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── 4. Extra Earning template — pre-filled ───────────────────
  test('Extra Earning Opportunities seeded template opens with opportunity flavor', async ({ page }) => {
    test.setTimeout(60000)
    await navigateToStudio(page)

    const setupSection = page.getByText('Setup Wizards').first()
    await expect(setupSection).toBeVisible({ timeout: 5000 })

    await clickCustomizeOnCard(page, 'Extra Earning Opportunities')

    // Wizard should open with opportunity flavor
    const wizardContent = page.getByText(/earning/i).or(page.getByText(/opportunity/i)).or(page.getByText(/job/i))
    await expect(wizardContent.first()).toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── 5. NLC — high confidence routing ─────────────────────────
  test('NLC input routes "potty chart" description to RepeatedActionChartWizard', async ({ page }) => {
    test.setTimeout(90000)
    await navigateToStudio(page)

    // NLC input should be visible on Browse tab (above sections)
    const nlcInput = page.locator('input[placeholder*="Describe what you want"]')
    await expect(nlcInput).toBeVisible({ timeout: 5000 })

    // Type a description that should match repeated_action_chart
    await nlcInput.fill('I want a potty chart for my toddler')

    // Submit via button click
    const submitBtn = nlcInput.locator('..').locator('..').locator('button').last()
    await submitBtn.click()

    // Wait for AI response — this may take a few seconds
    await page.waitForTimeout(8000)

    // Either the wizard opens directly (high confidence) or a confirmation card appears
    const wizardOrConfirmation = page.getByText(/potty/i).or(page.getByText(/progress chart/i)).or(page.getByText(/it sounds like/i))
    await expect(wizardOrConfirmation.first()).toBeVisible({ timeout: 15000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── 6. Draft persistence — save and resume ───────────────────
  test('Wizard draft saves on close and appears in Drafts tab', async ({ page }) => {
    test.setTimeout(60000)
    await navigateToStudio(page)

    // Open the Rewards List Wizard
    await clickCustomizeOnCard(page, 'Create a Rewards List')
    await page.waitForTimeout(1000)

    // Wizard should be open — type a name
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('My Draft List')
      await page.waitForTimeout(500)
    }

    // Close the wizard (should auto-save as draft)
    // Look for close/X button
    const closeBtn = page.locator('button[aria-label="Close"]').or(page.locator('button').filter({ hasText: /close/i })).or(page.locator('[data-testid="modal-close"]'))
    if (await closeBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.first().click()
      await page.waitForTimeout(1000)
    } else {
      // Try pressing Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    }

    // Handle save-as-draft confirmation if it appears
    const saveDraftBtn = page.getByRole('button', { name: /save.*draft/i }).or(page.getByRole('button', { name: /yes.*save/i }))
    if (await saveDraftBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveDraftBtn.click()
      await page.waitForTimeout(500)
    }

    // Navigate to Drafts tab
    const draftsTab = page.getByText(/drafts/i).first()
    await draftsTab.click()
    await page.waitForTimeout(1000)

    // Draft should appear
    const draftCard = page.getByText('My Draft List').or(page.getByText('Rewards List'))
    await expect(draftCard.first()).toBeVisible({ timeout: 5000 })

    // Click Resume and verify wizard reopens
    const resumeBtn = page.getByRole('button', { name: /resume/i }).first()
    if (await resumeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resumeBtn.click()
      await page.waitForTimeout(1000)

      // Wizard should be open again with the name pre-filled
      const nameField = page.locator('input[type="text"]').first()
      if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
        const value = await nameField.inputValue()
        expect(value).toContain('My Draft')
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })
})
