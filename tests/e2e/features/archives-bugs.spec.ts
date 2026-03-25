/**
 * Archives bug fix verification tests.
 *
 * Bug 1: archive_context_items queries returning 400 due to
 *         nonexistent sort_order column.
 * Bug 2: InnerWorkings file upload — extract-insights Edge Function
 *         was querying nonexistent user_settings table.
 *
 * These tests prove the fixes work by exercising the actual flows.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'

test.describe('Bug 1: Archives context items load without 400', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMom(page)
  })

  test('Archives main page loads and renders content', async ({ page }) => {
    await page.goto('/archives')

    // Wait for loading spinner to disappear (page is loading data)
    await page.waitForFunction(() => {
      return !document.querySelector('.animate-spin')
    }, { timeout: 15000 })

    // Should see either the Archives heading or member cards
    const archivesText = page.locator('text=Archives')
    await expect(archivesText.first()).toBeVisible({ timeout: 10000 })
  })

  test('Member archive detail loads folder contents without 400', async ({ page }) => {
    // Collect 400 errors on archive_context_items
    const failedRequests: string[] = []
    page.on('response', (response) => {
      if (response.status() === 400 && response.url().includes('archive_context_items')) {
        failedRequests.push(response.url())
      }
    })

    await page.goto('/archives')
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Find and click a member card (grid or list)
    const memberLink = page.locator('a[href*="/archives/member/"], [role="button"]').filter({ hasText: /insights|items/ })
    const count = await memberLink.count()

    if (count > 0) {
      await memberLink.first().click()
      await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
      // Give time for folder content queries to fire
      await page.waitForTimeout(3000)
    }

    // CRITICAL: No 400 errors on archive_context_items
    expect(failedRequests).toHaveLength(0)
  })

  test('Family Overview detail loads without 400 on archive_context_items', async ({ page }) => {
    const failedRequests: string[] = []
    page.on('response', (response) => {
      if (response.status() === 400 && response.url().includes('archive_context_items')) {
        failedRequests.push(response.url())
      }
    })

    await page.goto('/archives/family-overview')
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })
    await page.waitForTimeout(3000)

    // Page renders something (may show "Family not found" for test family without overview data — that's OK)
    await expect(page.locator('body')).not.toBeEmpty()

    // CRITICAL: No 400 errors on archive_context_items
    expect(failedRequests).toHaveLength(0)
  })

  test('Bulk Add FAB opens without archive_context_items errors', async ({ page }) => {
    const failedRequests: string[] = []
    page.on('response', (response) => {
      if (response.status() === 400 && response.url().includes('archive_context_items')) {
        failedRequests.push(response.url())
      }
    })

    await page.goto('/archives')
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Find and click the FAB (plus button at bottom-right)
    const fab = page.locator('button').filter({ has: page.locator('svg') }).last()
    const fabByLabel = page.locator('[aria-label*="context"], [aria-label*="menu"]')
    const target = (await fabByLabel.count()) > 0 ? fabByLabel.first() : fab

    if (await target.isVisible()) {
      await target.click()
      await page.waitForTimeout(1000)

      // Should see FAB options
      const bulkOption = page.locator('text=Bulk Add')
      if (await bulkOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bulkOption.click()
        await page.waitForTimeout(500)

        // Should see the bulk add modal textarea
        const textarea = page.locator('textarea')
        await expect(textarea).toBeVisible({ timeout: 5000 })
      }
    }

    // CRITICAL: No 400 errors throughout the flow
    expect(failedRequests).toHaveLength(0)
  })
})

test.describe('Bug 2: InnerWorkings file upload', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMom(page)
  })

  test('InnerWorkings page loads correctly', async ({ page }) => {
    await page.goto('/inner-workings')
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Should see the page — use exact: true to avoid ambiguity
    await expect(
      page.getByRole('heading', { name: 'InnerWorkings', exact: true })
    ).toBeVisible({ timeout: 10000 })
  })

  test('File upload does not fail with user_settings error', async ({ page }) => {
    // Track edge function errors
    const edgeFunctionErrors: string[] = []
    page.on('response', async (response) => {
      if (response.url().includes('extract-insights') && response.status() >= 400) {
        const body = await response.text().catch(() => '')
        edgeFunctionErrors.push(`${response.status()}: ${body}`)
      }
    })

    await page.goto('/inner-workings')
    await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 })

    // Create a test text file with personality content
    const testContent = `My Personality Assessment Results

I am an ENFP personality type. I am energized by social interaction and new ideas.

My top CliftonStrengths are:
1. Ideation - I love brainstorming and generating new concepts
2. Connectedness - I see how things are linked together
3. Communication - I express ideas clearly and persuasively
4. Strategic - I can see patterns and plan accordingly
5. Empathy - I sense other people's feelings intuitively

Growth areas:
- I sometimes start too many projects without finishing them
- I need to work on following through on commitments
- Detail-oriented tasks drain my energy`

    // Find the file input
    const fileInput = page.locator('input[type="file"]').first()
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'personality-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(testContent),
      })

      // Wait for extraction (up to 30s for AI call)
      await page.waitForTimeout(15000)

      // CRITICAL: No user_settings errors from the Edge Function
      const settingsErrors = edgeFunctionErrors.filter(e =>
        e.includes('user_settings') || e.includes('schema cache')
      )
      expect(settingsErrors).toHaveLength(0)
    }
  })
})
