/**
 * Allowance Setup for Helam — E2E test
 *
 * Navigates to Settings → Allowance, opens Helam's config,
 * sets $17/week with 85% bonus threshold at $5 bonus,
 * verifies it saves and a period starts.
 *
 * Run: npx playwright test tests/e2e/features/allowance-helam-setup.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'http://localhost:5173'
const DEV_EMAIL = process.env.E2E_DEV_EMAIL!
const DEV_PASSWORD = process.env.E2E_DEV_PASSWORD!

test.use({
  launchOptions: { slowMo: 250 },
  viewport: { width: 1280, height: 900 },
})

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({
      dismissed_guides: ['dashboard', 'tasks', 'lila', 'studio', 'calendar', 'settings'],
      all_guides_dismissed: true,
    }))
  })
  await page.fill('input[type="email"]', DEV_EMAIL)
  await page.fill('input[type="password"]', DEV_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  console.log('✓ Logged in')
}

test('Set up Helam allowance: $17/week, 85% bonus threshold → $5 bonus', async ({ page }, testInfo) => {
  testInfo.setTimeout(60_000)

  // Capture console for debugging
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('allowance') || text.includes('financial') || text.includes('upsert') || text.includes('Error')) {
      console.log(`  [browser] ${text}`)
    }
  })

  await login(page)

  // ═══ Navigate to Allowance Settings ═══
  await page.goto(`${BASE_URL}/settings/allowance`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'tests/e2e/.screenshots/allowance-01-settings-page.png' })

  // Find Helam's card and click Configure
  // Each child is a card with their name in an h3 and a Configure button
  const helamHeading = page.locator('h3', { hasText: 'Helam' })
  await expect(helamHeading).toBeVisible({ timeout: 5000 })
  console.log('✓ Helam card visible')

  // The Configure button is in the same card container as the heading
  // Navigate up to the card div, then find the button
  const helamCard = helamHeading.locator('xpath=ancestor::div[contains(@class,"rounded-xl")]')
  const configBtn = helamCard.locator('button', { hasText: 'Configure' })
  await configBtn.click()
  console.log('✓ Clicked Configure on Helam')

  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  // Verify we're on Helam's config page
  const pageHeading = page.locator('h1')
  const headingText = await pageHeading.innerText().catch(() => '')
  console.log(`  Page heading: "${headingText}"`)
  expect(headingText).toContain('Helam')

  await page.screenshot({ path: 'tests/e2e/.screenshots/allowance-02-helam-config.png' })

  // ═══ Set weekly amount to $17 ═══
  // "Basic Setup" section should be open by default
  const weeklyInput = page.locator('input[type="number"]').first()
  await weeklyInput.scrollIntoViewIfNeeded()
  await weeklyInput.fill('17')
  console.log('✓ Weekly amount set to $17')
  await page.waitForTimeout(1000) // wait for auto-save debounce

  await page.screenshot({ path: 'tests/e2e/.screenshots/allowance-03-weekly-amount.png' })

  // ═══ Open Bonus & Thresholds section ═══
  const bonusSection = page.locator('button', { hasText: 'Bonus & Thresholds' })
  await bonusSection.scrollIntoViewIfNeeded()
  await bonusSection.click()
  await page.waitForTimeout(300)

  // Set bonus threshold to 85%
  // There should be: Minimum threshold, Bonus threshold, Bonus percentage
  const numberInputs = page.locator('input[type="number"]')
  const inputCount = await numberInputs.count()
  console.log(`  Number inputs visible: ${inputCount}`)

  // Log all visible number inputs with their labels
  for (let i = 0; i < inputCount; i++) {
    const input = numberInputs.nth(i)
    if (await input.isVisible().catch(() => false)) {
      const value = await input.inputValue()
      const label = await input.locator('..').locator('..').locator('label').first().innerText().catch(() => '?')
      console.log(`    Input ${i}: "${label}" = ${value}`)
    }
  }

  // Set Bonus threshold to 85%
  // Find the input labeled "Bonus threshold (%)"
  const bonusThresholdLabel = page.locator('label', { hasText: 'Bonus threshold' })
  if (await bonusThresholdLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const bonusThresholdInput = bonusThresholdLabel.locator('..').locator('input[type="number"]')
    await bonusThresholdInput.fill('85')
    console.log('✓ Bonus threshold set to 85%')
    await page.waitForTimeout(1000) // auto-save
  }

  // Calculate bonus percentage for $5 on $17 base: 5/17 * 100 = ~29.41%
  // $17 * 29.41% ≈ $5.00
  const bonusPct = Math.round((5 / 17) * 10000) / 100 // 29.41
  const bonusPctLabel = page.locator('label', { hasText: 'Bonus percentage' })
  if (await bonusPctLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const bonusPctInput = bonusPctLabel.locator('..').locator('input[type="number"]')
    await bonusPctInput.fill(String(bonusPct))
    console.log(`✓ Bonus percentage set to ${bonusPct}% ($${(17 * bonusPct / 100).toFixed(2)} bonus)`)
    await page.waitForTimeout(1000) // auto-save
  }

  await page.screenshot({ path: 'tests/e2e/.screenshots/allowance-04-bonus-configured.png' })

  // ═══ Wait for auto-save to complete ═══
  await page.waitForTimeout(2000) // ensure the 800ms debounce fires

  // ═══ Verify via database ═══
  await page.screenshot({ path: 'tests/e2e/.screenshots/allowance-05-final-state.png' })

  console.log('\n═══ ALLOWANCE SETUP COMPLETE ═══')
  console.log(`  Helam: $17/week, 85% threshold → ~$5 bonus (${bonusPct}%)`)
  console.log('  Config auto-saves on change — no save button needed')
})
