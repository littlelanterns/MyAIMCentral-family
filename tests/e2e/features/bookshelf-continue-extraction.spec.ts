/**
 * BookShelf Continue Extraction + Go Deeper — Phase 1b-B
 *
 * Tests:
 * 1. Continue Extraction banner appears for partially-extracted books
 * 2. Continue Extraction button works and extracts remaining sections
 * 3. Go Deeper button works on the active tab
 *
 * Uses The Montessori Method (partially extracted — 3 of ~20 sections done).
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const MOM_EMAIL = process.env.E2E_DEV_EMAIL!
const MOM_PASSWORD = process.env.E2E_DEV_PASSWORD!
const AUTH_CACHE_DIR = path.join(process.cwd(), 'tests', 'e2e', '.auth')

const MONTESSORI_ID = '48165482-b2ec-470a-89c7-c6983b5dda74'
// Christmas Jar has full extraction (25 items across 1 section) — good for Go Deeper test
const CHRISTMAS_JAR_ID = '289c7411-0990-4309-a346-93fc033fa3b0'

async function navigateAuthenticated(page: Page, url: string): Promise<void> {
  await page.goto('/auth/sign-in')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  if (!page.url().includes('/auth')) {
    if (!page.url().endsWith(url)) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
    }
    return
  }

  const emailInput = page.locator('input[type="email"]')
  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(MOM_EMAIL)
  await page.locator('input[type="password"]').fill(MOM_PASSWORD)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL('**/dashboard**', { timeout: 20000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  if (url !== '/dashboard') {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
  }
}

// ── Continue Extraction Tests ──────────────────────────────────────────

test.describe('BookShelf Continue Extraction', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('partially extracted book shows Continue Extraction banner', async ({ page }) => {
    await navigateAuthenticated(page, `/bookshelf?book=${MONTESSORI_ID}`)

    // Book title visible
    await expect(page.getByText('Montessori', { exact: false }).first()).toBeVisible({ timeout: 15000 })

    // Should see extraction content (the 3 sections already done)
    const summariesTab = page.locator('button').filter({ hasText: /Summaries/i }).first()
    await expect(summariesTab).toBeVisible({ timeout: 10000 })

    // The Continue Extraction banner should appear
    const continueBtn = page.locator('button').filter({ hasText: /Continue Extraction/i }).first()
    await expect(continueBtn).toBeVisible({ timeout: 10000 })

    // Banner should show section count info
    const banner = continueBtn.locator('..')
    const bannerText = await banner.locator('..').textContent()
    expect(bannerText).toMatch(/\d+ of \d+ sections/)
    expect(bannerText).toMatch(/remaining/)
  })

  test('Continue Extraction starts extracting remaining sections', async ({ page }) => {
    test.setTimeout(180_000) // 3 minutes — just needs to start, not finish all

    await navigateAuthenticated(page, `/bookshelf?book=${MONTESSORI_ID}`)

    await expect(page.getByText('Montessori', { exact: false }).first()).toBeVisible({ timeout: 15000 })

    // Click Continue Extraction
    const continueBtn = page.locator('button').filter({ hasText: /Continue Extraction/i }).first()
    await expect(continueBtn).toBeVisible({ timeout: 10000 })
    await continueBtn.click()

    // Progress should appear — either "Skipping" already-done sections or "Extracting section"
    await expect(
      page.getByText(/Skipping|Extracting section/i).first()
    ).toBeVisible({ timeout: 30000 })

    // Wait for at least one section to complete (look for progress text changing)
    await expect(
      page.getByText(/Extracting section \d+ of \d+/i).first()
    ).toBeVisible({ timeout: 120000 })

    // Cancel to avoid waiting for the full book
    const cancelBtn = page.getByText('Cancel')
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click()
    }

    // After cancel, the content should still be visible (the existing + any new sections)
    await page.waitForTimeout(3000)
    const bodyText = await page.textContent('body')
    expect(bodyText!.length).toBeGreaterThan(200)
  })
})

// ── Go Deeper Tests ────────────────────────────────────────────────────

test.describe('BookShelf Go Deeper', () => {
  test.use({ viewport: { width: 1280, height: 800 } })
  test.setTimeout(180_000) // Go Deeper calls Sonnet

  test('Go Deeper button is visible and clickable on extracted book', async ({ page }) => {
    await navigateAuthenticated(page, `/bookshelf?book=${CHRISTMAS_JAR_ID}`)

    // Book title visible
    await expect(page.getByText('Christmas Jar', { exact: false }).first()).toBeVisible({ timeout: 15000 })

    // Extraction content should exist (25 items from our earlier test)
    const summariesTab = page.locator('button').filter({ hasText: /Summaries/i }).first()
    await expect(summariesTab).toBeVisible({ timeout: 10000 })

    // Go Deeper button should be visible
    const goDeeper = page.locator('button, a').filter({ hasText: /Go Deeper/i }).first()
    await expect(goDeeper).toBeVisible()
  })

  test('Go Deeper adds new extractions to the active tab', async ({ page }) => {
    await navigateAuthenticated(page, `/bookshelf?book=${CHRISTMAS_JAR_ID}`)

    await expect(page.getByText('Christmas Jar', { exact: false }).first()).toBeVisible({ timeout: 15000 })

    // Switch to Insights tab
    const insightsTab = page.locator('button').filter({ hasText: /Insights/i }).first()
    await expect(insightsTab).toBeVisible({ timeout: 10000 })
    await insightsTab.click()
    await page.waitForTimeout(1000)

    // Get current insight count from the tab
    const insightsText = await insightsTab.textContent()
    const beforeMatch = insightsText?.match(/(\d+)/)
    const beforeCount = beforeMatch ? parseInt(beforeMatch[1]) : 0

    // Click Go Deeper
    const goDeeper = page.locator('button, a').filter({ hasText: /Go Deeper/i }).first()
    await expect(goDeeper).toBeVisible()
    await goDeeper.click()

    // Should show loading state (Sparkles animating)
    await page.waitForTimeout(1000)

    // Wait for Go Deeper to complete (the goingDeeper state resets, refetch happens)
    // The count on the Insights tab should increase
    await page.waitForFunction(
      (prevCount) => {
        const tabs = document.querySelectorAll('button')
        for (const tab of tabs) {
          const text = tab.textContent || ''
          const match = text.match(/Insights\s*(\d+)/)
          if (match && parseInt(match[1]) > prevCount) return true
        }
        return false
      },
      beforeCount,
      { timeout: 120000 },
    )

    // Verify the count increased
    const afterText = await insightsTab.textContent()
    const afterMatch = afterText?.match(/(\d+)/)
    const afterCount = afterMatch ? parseInt(afterMatch[1]) : 0
    expect(afterCount).toBeGreaterThan(beforeCount)

    console.log(`Go Deeper: Insights ${beforeCount} → ${afterCount}`)
  })
})
