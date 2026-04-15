/**
 * Studio Setup Wizards — E2E Tests
 *
 * Tests the Phase 2 setup wizards:
 * 1. Star Chart Wizard — opens from Studio Gamification section, 5 steps
 * 2. Get to Know Wizard — opens from Studio Growth section, member picker + categories
 * 3. Routine Builder Wizard — opens from Setup Wizards section, AI parse flow
 * 4. CSS token fix — verifies missing theme tokens are now rendered
 */
import { test, expect, type Page } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'

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

/** Click Customize on a specific template card by its title text. */
async function clickCustomizeOnCard(page: Page, cardTitle: string) {
  // Cards are inside snap-start containers. Find the one containing our title text.
  const card = page.locator('div.snap-start').filter({ hasText: cardTitle }).first()
  // First click expands the card (mobile tap behavior in StudioTemplateCard)
  await card.click()
  await page.waitForTimeout(400)
  // Now click the Customize button INSIDE this card
  const customizeBtn = card.getByRole('button', { name: /customize/i })
  await customizeBtn.click({ force: true })
  await page.waitForTimeout(500)
}

// ============================================================
// Tests
// ============================================================

test.describe('Studio Setup Wizards', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
  })

  test('Studio page renders all 7 sections including Setup Wizards', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // Verify key sections render
    await expect(page.getByText('Task & Chore Templates').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Trackers & Widgets').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Gamification & Rewards').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Growth & Self-Knowledge').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Setup Wizards').first()).toBeVisible({ timeout: 5000 })

    // Verify wizard-specific template cards are visible
    await expect(page.getByText('Star / Sticker Chart').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Get to Know Your Family').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Routine Builder (AI)').first()).toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Star Chart wizard opens and renders 5 step indicators', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // Find the Gamification section first, then the Star Chart card within it
    const gamSection = page.locator('text=Gamification & Rewards').first()
    await gamSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)

    // Find Star / Sticker Chart card within the Gamification section's parent
    const gamContainer = gamSection.locator('xpath=ancestor::div[contains(@class, "mb-8")]')
    const card = gamContainer.locator('div.snap-start').filter({ hasText: 'Star / Sticker Chart' }).first()
    await card.click()
    await page.waitForTimeout(400)
    const customizeBtn = card.getByRole('button', { name: /customize/i })
    await customizeBtn.click({ force: true })
    await page.waitForTimeout(500)

    // Star Chart Wizard modal should be open
    await expect(page.getByText('Star Chart Setup').first()).toBeVisible({ timeout: 5000 })

    // All 5 step indicators should be visible (numbered 1-5)
    await expect(page.getByText('Name It').first()).toBeVisible({ timeout: 3000 })
    // The step dots (1, 2, 3, 4, 5) should exist
    for (let i = 1; i <= 5; i++) {
      // Step dots contain the number
      const dot = page.locator('.rounded-full').filter({ hasText: String(i) }).first()
      await expect(dot).toBeVisible({ timeout: 2000 })
    }

    // Step 1 should show the name input
    const nameInput = page.getByPlaceholder(/potty stars|reading chart/i).first()
    await expect(nameInput).toBeVisible({ timeout: 3000 })

    // Type a chart name
    await nameInput.fill('E2E Test Stars')

    // Click Next to step 2
    await page.getByRole('button', { name: /next/i }).first().click()
    await page.waitForTimeout(300)

    // Step 2: "Who" — should show family member buttons
    await expect(page.getByText('Who').first()).toBeVisible({ timeout: 3000 })

    // Close the wizard by pressing Escape (ModalV2 transient type closes on Escape)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Get to Know wizard opens with member picker and connection categories', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // Scroll to Growth section
    const getToKnowText = page.getByText('Get to Know Your Family').first()
    await getToKnowText.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)

    // Click the card then Customize
    await clickCustomizeOnCard(page, 'Get to Know Your Family')

    // Wizard should open with "Pick a Person" step
    await expect(page.getByText('Pick a Person').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/connection preferences/i).first()).toBeVisible({ timeout: 3000 })

    // Should show family member buttons (at least one non-mom member) INSIDE the modal
    const modal = page.locator('[role="dialog"]').first()
    const memberButtons = modal.locator('button').filter({ hasText: /\w{3,}/ })
    const count = await memberButtons.count()
    expect(count).toBeGreaterThan(0)

    // Pick the first member (use force: true to bypass any overlay interception)
    await memberButtons.first().click({ force: true })
    await page.waitForTimeout(200)

    // Click Next inside the modal
    await modal.getByRole('button', { name: /next/i }).first().click({ force: true })
    await page.waitForTimeout(300)

    // Should now be on a category step (first category: "Things I'd Love")
    await expect(modal.getByText("Things I'd Love").first()).toBeVisible({ timeout: 3000 })

    // Should show a prompt with a question about gifts/presents
    const promptCard = modal.locator('text=/gift|present|want|week/i').first()
    await expect(promptCard).toBeVisible({ timeout: 3000 })

    // Close the wizard by pressing Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Routine Builder wizard opens with AI brain dump form and example buttons', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // Scroll to Setup Wizards section
    const routineText = page.getByText('Routine Builder (AI)').first()
    await routineText.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)

    // Click the card then Customize
    await clickCustomizeOnCard(page, 'Routine Builder (AI)')

    // Wizard should open
    await expect(page.getByText('Routine Builder').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Describe').first()).toBeVisible({ timeout: 3000 })

    // Should have a routine name input
    const nameInput = page.getByPlaceholder(/morning routine|bedroom/i).first()
    await expect(nameInput).toBeVisible({ timeout: 3000 })

    // Should have a textarea
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 3000 })

    // Should show example routine buttons
    const morningBtn = page.getByRole('button', { name: 'Morning Routine' }).first()
    await expect(morningBtn).toBeVisible({ timeout: 3000 })
    const bedroomBtn = page.getByRole('button', { name: 'Bedroom Clean-Up' }).first()
    await expect(bedroomBtn).toBeVisible({ timeout: 3000 })

    // Click an example to populate
    await morningBtn.click()
    await page.waitForTimeout(300)

    // Name and textarea should be populated
    await expect(nameInput).toHaveValue('Morning Routine')
    const textareaValue = await textarea.inputValue()
    expect(textareaValue).toContain('make bed')

    // Close the wizard
    await page.getByRole('button', { name: /cancel/i }).first().click()
    await page.waitForTimeout(300)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('CSS theme tokens render correctly on the Studio page', async ({ page }) => {
    test.setTimeout(60000)
    await loginAsMom(page)
    await page.goto('/studio')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
    await dismissOverlays(page)

    // The theme provider should have set the missing tokens on :root
    const bgTertiary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg-tertiary').trim()
    )
    const textTertiary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-text-tertiary').trim()
    )
    const textMuted = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim()
    )

    // They should be non-empty strings
    expect(bgTertiary.length).toBeGreaterThan(0)
    expect(textTertiary.length).toBeGreaterThan(0)
    expect(textMuted.length).toBeGreaterThan(0)

    assertNoInfiniteRenders(consoleErrors)
  })
})
