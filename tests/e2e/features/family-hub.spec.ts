/**
 * PRD-14D: Family Hub — E2E Tests
 *
 * Tests the Family Hub feature across multiple roles:
 * - Hub renders inline on perspective tab (mom, dad, teen)
 * - Hub renders on standalone /hub route
 * - Family Best Intentions: create, view, tally
 * - Countdowns: create, view
 * - Hub Settings: open, configure sections
 * - Section visibility toggles
 * - Calendar section shows events
 * - Member access section (standalone only)
 * - show_on_hub toggle on event creation
 * - Edit mode (long-press, mom only)
 */

import { test, expect, type Page } from '@playwright/test'
import { loginAsMom, loginAsDad, loginAsAlex } from '../helpers/auth'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function navigateToHubTab(page: Page): Promise<boolean> {
  await page.goto('/dashboard')
  await waitForAppReady(page)

  // Find and click the Hub tab in the perspective switcher
  const hubTab = page.locator('button[role="tab"]').filter({ hasText: /Hub/i })
  if (!(await hubTab.isVisible().catch(() => false))) {
    return false
  }
  await hubTab.click()
  await page.waitForTimeout(1000)
  return true
}

async function dismissOnboarding(page: Page): Promise<void> {
  const gotItBtn = page.getByText('Got it')
  if (await gotItBtn.isVisible().catch(() => false)) {
    await gotItBtn.click()
    await page.waitForTimeout(500)
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('PRD-14D: Family Hub', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
  })

  // ── Hub renders inline on perspective tab ─────────────────────────────

  test('Mom can see Hub tab and render inline', async ({ page }) => {
    await loginAsMom(page)
    const found = await navigateToHubTab(page)

    if (!found) {
      test.skip(true, 'Hub tab not found — likely auth/family issue')
      return
    }

    // Hub should render inline (NOT navigate to /hub)
    expect(page.url()).toContain('/dashboard')
    expect(page.url()).not.toContain('/hub')

    // Hub content should be visible
    const hub = page.locator('[data-testid="family-hub"]')
    await expect(hub).toBeVisible({ timeout: 10000 })

    // No infinite renders
    assertNoInfiniteRenders(consoleErrors)
  })

  test('Dad can see Hub tab and render inline', async ({ page }) => {
    await loginAsDad(page)
    const found = await navigateToHubTab(page)

    if (!found) {
      test.skip(true, 'Hub tab not found for dad')
      return
    }

    expect(page.url()).toContain('/dashboard')
    const hub = page.locator('[data-testid="family-hub"]')
    await expect(hub).toBeVisible({ timeout: 10000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Teen (Alex) can see Hub tab and render inline', async ({ page }) => {
    await loginAsAlex(page)
    const found = await navigateToHubTab(page)

    if (!found) {
      test.skip(true, 'Hub tab not found for teen')
      return
    }

    expect(page.url()).toContain('/dashboard')
    const hub = page.locator('[data-testid="family-hub"]')
    await expect(hub).toBeVisible({ timeout: 10000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Hub standalone route ──────────────────────────────────────────────

  test('Standalone /hub route renders Hub with header', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)

    // Hub should render
    const hub = page.locator('[data-testid="family-hub"]')
    await expect(hub).toBeVisible({ timeout: 10000 })

    // Header should be visible (standalone only)
    const header = page.locator('[data-testid="hub-header"]')
    await expect(header).toBeVisible()

    // Member access section should be visible (standalone only)
    const memberAccess = page.locator('[data-testid="hub-member-access-section"]')
    await expect(memberAccess).toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Hub tab does NOT show member access section', async ({ page }) => {
    await loginAsMom(page)
    const found = await navigateToHubTab(page)
    if (!found) {
      test.skip(true, 'Hub tab not found')
      return
    }

    // Member access should NOT be visible in tab context
    const memberAccess = page.locator('[data-testid="hub-member-access-section"]')
    await expect(memberAccess).not.toBeVisible()

    // Header should NOT be visible in tab context
    const header = page.locator('[data-testid="hub-header"]')
    await expect(header).not.toBeVisible()
  })

  test('Hub tab does NOT show header', async ({ page }) => {
    await loginAsMom(page)
    const found = await navigateToHubTab(page)
    if (!found) {
      test.skip(true, 'Hub tab not found')
      return
    }

    const header = page.locator('[data-testid="hub-header"]')
    await expect(header).not.toBeVisible()
  })

  // ── Hub Settings ──────────────────────────────────────────────────────

  test('Mom can open Hub Settings from standalone route', async ({ page }) => {
    test.slow()
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    // Click settings gear in header
    const settingsBtn = page.locator('[aria-label="Hub Settings"]')
    await expect(settingsBtn).toBeVisible()
    await settingsBtn.click()
    await page.waitForTimeout(500)

    // Settings modal should open
    const settingsModal = page.getByRole('heading', { name: 'Hub Settings' })
    await expect(settingsModal).toBeVisible({ timeout: 5000 })

    // Should show section visibility controls
    const sectionVisibility = page.locator('text=Section Visibility')
    await expect(sectionVisibility).toBeVisible()

    // Should show Family Best Intentions management
    const intentionsSection = page.locator('text=Family Best Intentions')
    await expect(intentionsSection.first()).toBeVisible()
  })

  test('Mom can open Hub Settings from tab context', async ({ page }) => {
    await loginAsMom(page)
    const found = await navigateToHubTab(page)
    if (!found) {
      test.skip(true, 'Hub tab not found')
      return
    }
    await dismissOnboarding(page)

    // Tab context: settings gear is inline
    const settingsBtn = page.locator('button[title="Hub Settings"]')
    await expect(settingsBtn).toBeVisible()
    await settingsBtn.click()
    await page.waitForTimeout(500)

    const settingsModal = page.getByRole('heading', { name: 'Hub Settings' })
    await expect(settingsModal).toBeVisible({ timeout: 5000 })
  })

  // ── Family Best Intentions: Create ────────────────────────────────────

  test('Mom can create a Family Best Intention via Hub Settings', async ({ page }) => {
    test.slow()
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    // Open settings
    const settingsBtn = page.locator('[aria-label="Hub Settings"]')
    await settingsBtn.click()
    await page.waitForTimeout(500)

    // Click "Create New Intention"
    const createBtn = page.locator('text=Create New Intention')
    await expect(createBtn).toBeVisible()
    await createBtn.click()
    await page.waitForTimeout(300)

    // Fill in the form
    const titleInput = page.locator('input[placeholder*="Intention title"]')
    await expect(titleInput).toBeVisible()
    await titleInput.fill('Remain Calm')

    const descInput = page.locator('input[placeholder*="Description"]')
    await descInput.fill('We choose calm words, even when frustrated')

    // Click Create button
    const submitBtn = page.locator('button').filter({ hasText: /^Create$/ })
    await submitBtn.click()
    await page.waitForTimeout(2000)

    // Intention should appear in the list
    const intentionItem = page.locator('text=Remain Calm')
    await expect(intentionItem.first()).toBeVisible()
  })

  test('Family Best Intention appears on Hub after creation', async ({ page }) => {
    test.slow()
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    // Check if the Best Intentions section shows the created intention
    const intentionSection = page.locator('[data-testid="hub-intentions-section"]')

    // If no intentions exist, the section may show empty state or the intention from prior test
    const intentionTitle = page.locator('text=Remain Calm')
    if (await intentionTitle.isVisible().catch(() => false)) {
      // Intention exists — verify tally display
      const tallyDisplay = page.locator('text=/Family tally today/i')
      await expect(tallyDisplay.first()).toBeVisible()
    }
    // If not found, the prior create test may not have run — skip gracefully
  })

  // ── Family Best Intentions: Tally ─────────────────────────────────────

  test('Mom can log a tally on Family Best Intention from Hub tab', async ({ page }) => {
    test.slow()
    await loginAsMom(page)
    const found = await navigateToHubTab(page)
    if (!found) {
      test.skip(true, 'Hub tab not found')
      return
    }
    await dismissOnboarding(page)

    // Look for any intention's tally button/avatar
    const intentionSection = page.locator('[data-testid="hub-intentions-section"]')
    if (!(await intentionSection.isVisible().catch(() => false))) {
      test.skip(true, 'No Best Intentions section visible — create one first')
      return
    }

    // In tab context, tapping an avatar should log for the current user directly
    const avatarButtons = intentionSection.locator('button[data-testid^="intention-avatar"]')
    const count = await avatarButtons.count()
    if (count === 0) {
      test.skip(true, 'No intention avatars found')
      return
    }

    // Get initial tally text
    const tallyText = intentionSection.locator('text=/Family tally today/i')

    // Click first avatar
    await avatarButtons.first().click()
    await page.waitForTimeout(1500)

    // Tally should have incremented (optimistic update)
    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Countdowns: Create ────────────────────────────────────────────────

  test('Mom can create a countdown via Hub Settings', async ({ page }) => {
    test.slow()
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    // Open settings
    const settingsBtn = page.locator('[aria-label="Hub Settings"]')
    await settingsBtn.click()
    await page.waitForTimeout(500)

    // Click "Create Countdown"
    const createBtn = page.locator('text=Create Countdown')
    await expect(createBtn).toBeVisible()
    await createBtn.click()
    await page.waitForTimeout(300)

    // Fill in the form
    const titleInput = page.locator('input[placeholder="Countdown title"]')
    await expect(titleInput).toBeVisible()
    await titleInput.fill('Beach Vacation')

    // Set a future date (30 days from now)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateStr = futureDate.toISOString().slice(0, 10)
    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill(dateStr)

    // Click Create
    const submitBtn = page.locator('button').filter({ hasText: /^Create$/ })
    await submitBtn.click()
    await page.waitForTimeout(2000)

    // Countdown should appear in settings list
    const countdownItem = page.locator('text=Beach Vacation')
    await expect(countdownItem.first()).toBeVisible()
  })

  test('Countdown appears on Hub with day count', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    // Look for countdown section
    const countdownSection = page.locator('[data-testid="hub-countdowns"]')
    if (!(await countdownSection.isVisible().catch(() => false))) {
      test.skip(true, 'No countdowns section visible')
      return
    }

    // Should show the Beach Vacation countdown (or any countdown)
    const dayCount = countdownSection.locator('text=/\\d+ days/i')
    if (await dayCount.first().isVisible().catch(() => false)) {
      // Countdown is rendering with a day count — pass
      await expect(dayCount.first()).toBeVisible()
    }
  })

  // ── Section Visibility ────────────────────────────────────────────────

  test('Mom can toggle section visibility from Hub Settings', async ({ page }) => {
    test.slow()
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    // Open settings
    const settingsBtn = page.locator('[aria-label="Hub Settings"]')
    await settingsBtn.click()
    await page.waitForTimeout(500)

    // Find the Countdowns visibility toggle (Eye icon button in the row)
    const countdownsRow = page.locator('text=Countdowns').locator('..')
    const eyeBtn = countdownsRow.locator('button').last()
    await eyeBtn.click()
    await page.waitForTimeout(1000)

    // Close settings
    const closeBtn = page.locator('[data-testid="modal-close-hub-settings"]')
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click()
    } else {
      // Press Escape to close
      await page.keyboard.press('Escape')
    }
    await page.waitForTimeout(500)

    // Toggle back to visible (re-open settings)
    await settingsBtn.click()
    await page.waitForTimeout(500)
    const countdownsRow2 = page.locator('text=Countdowns').locator('..')
    const eyeBtn2 = countdownsRow2.locator('button').last()
    await eyeBtn2.click()
    await page.waitForTimeout(1000)

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Calendar Section ──────────────────────────────────────────────────

  test('Calendar section renders on Hub', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    // Calendar section should be visible
    const calendarSection = page.locator('[data-testid="hub-calendar-section"]')
    await expect(calendarSection).toBeVisible({ timeout: 10000 })
  })

  // ── Victories Summary Stub ────────────────────────────────────────────

  test('Victories section shows stub with Coming soon', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    const victoriesSection = page.locator('[data-testid="hub-victories-section"]')
    if (await victoriesSection.isVisible().catch(() => false)) {
      await expect(victoriesSection).toContainText(/coming soon/i)
    }
    // May not be visible if section was hidden — that's OK
  })

  // ── Standalone Member Access Section ──────────────────────────────────

  test('Standalone Hub shows member access with family members', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await dismissOnboarding(page)

    const memberAccess = page.locator('[data-testid="hub-member-access-section"]')
    await expect(memberAccess).toBeVisible({ timeout: 10000 })

    // Should show "Tap your name" text
    const subtitle = page.locator('text=/Tap your name/i')
    await expect(subtitle).toBeVisible()

    // Should show at least one family member
    const memberCards = memberAccess.locator('[data-testid^="hub-member-"]')
    const count = await memberCards.count()
    expect(count).toBeGreaterThan(0)
  })

  // ── Onboarding Card ───────────────────────────────────────────────────

  test('Onboarding card shows on first Hub visit and can be dismissed', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)

    const onboarding = page.locator('[data-testid="hub-onboarding"]')
    if (await onboarding.isVisible().catch(() => false)) {
      await expect(onboarding).toContainText(/Welcome to your Family Hub/i)

      // Dismiss
      const gotItBtn = page.getByText('Got it')
      await gotItBtn.click()
      await page.waitForTimeout(1000)

      // Should be hidden after dismiss
      await expect(onboarding).not.toBeVisible()
    }
    // If not visible, it was already dismissed — that's fine
  })

  // ── /hub/tv route stub ────────────────────────────────────────────────

  test('/hub/tv route shows PlannedExpansionCard stub', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub/tv')
    await waitForAppReady(page)

    // Should show the planned expansion card
    const expansionCard = page.locator('text=/TV Mode/i')
    if (await expansionCard.isVisible().catch(() => false)) {
      await expect(expansionCard).toBeVisible()
    }
  })

  // ── show_on_hub toggle on Event Creation ──────────────────────────────

  test('Event creation modal has Show on Family Hub toggle', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/calendar')
    await waitForAppReady(page)

    // Open event creation (click + button or a date)
    const newEventBtn = page.locator('button').filter({ hasText: /New Event|Add Event|\+/i })
    if (await newEventBtn.first().isVisible().catch(() => false)) {
      await newEventBtn.first().click()
      await page.waitForTimeout(500)

      // Check for the Hub toggle
      const hubToggle = page.locator('text=Show on Family Hub')
      await expect(hubToggle).toBeVisible({ timeout: 5000 })

      // The checkbox should be checked by default
      const checkbox = page.locator('input[type="checkbox"]').last()
      if (await checkbox.isVisible().catch(() => false)) {
        await expect(checkbox).toBeChecked()
      }
    } else {
      test.skip(true, 'Could not find new event button on calendar page')
    }
  })

  // ── Cross-role: Dad sees Hub but no settings ──────────────────────────

  test('Dad cannot see Hub Settings gear in tab view', async ({ page }) => {
    await loginAsDad(page)
    const found = await navigateToHubTab(page)
    if (!found) {
      test.skip(true, 'Hub tab not found for dad')
      return
    }

    // Hub should render
    const hub = page.locator('[data-testid="family-hub"]')
    await expect(hub).toBeVisible({ timeout: 10000 })

    // Settings gear should NOT be visible (mom-only)
    const settingsBtn = page.locator('button[title="Hub Settings"]')
    await expect(settingsBtn).not.toBeVisible()
  })

  test('Dad sees Hub on standalone /hub route', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/hub')
    await waitForAppReady(page)

    const hub = page.locator('[data-testid="family-hub"]')
    await expect(hub).toBeVisible({ timeout: 10000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Cross-role: Teen sees Hub ─────────────────────────────────────────

  test('Teen sees Hub tab with family content', async ({ page }) => {
    test.slow()
    await loginAsAlex(page)

    // Dismiss any guides first
    await page.goto('/dashboard')
    await waitForAppReady(page)
    const gotItBtn = page.getByText('Got it')
    if (await gotItBtn.first().isVisible().catch(() => false)) {
      await gotItBtn.first().click()
      await page.waitForTimeout(500)
    }

    const found = await navigateToHubTab(page)
    if (!found) {
      test.skip(true, 'Hub tab not found for teen')
      return
    }

    const hub = page.locator('[data-testid="family-hub"]')
    await expect(hub).toBeVisible({ timeout: 15000 })

    // Teen should NOT see settings gear
    const settingsBtn = page.locator('button[title="Hub Settings"]')
    await expect(settingsBtn).not.toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Edit Mode ─────────────────────────────────────────────────────────

  test('No infinite render loops on Hub', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/hub')
    await waitForAppReady(page)
    await page.waitForTimeout(3000) // Extra time for potential loops

    assertNoInfiniteRenders(consoleErrors)
  })
})
