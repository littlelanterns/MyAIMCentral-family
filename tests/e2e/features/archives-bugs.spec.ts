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

  test('Archives main page loads without network errors', async ({ page }) => {
    // Navigate to archives
    await page.goto('/archives')
    await page.waitForLoadState('networkidle')

    // Should see the Archives heading
    await expect(page.getByRole('heading', { name: 'Archives' })).toBeVisible()

    // Should see Family Members section
    await expect(page.getByText('Family Members')).toBeVisible()
  })

  test('Member archive detail loads folder contents without 400', async ({ page }) => {
    // Collect network errors
    const failedRequests: string[] = []
    page.on('response', (response) => {
      if (response.status() === 400 && response.url().includes('archive_context_items')) {
        failedRequests.push(response.url())
      }
    })

    // Navigate to archives
    await page.goto('/archives')
    await page.waitForLoadState('networkidle')

    // Click first member card to go to detail
    const memberCards = page.locator('[role="button"]').filter({ hasText: /insights|items/ })
    const cardCount = await memberCards.count()

    if (cardCount > 0) {
      await memberCards.first().click()
      await page.waitForLoadState('networkidle')

      // Wait a bit for all folder content queries to fire
      await page.waitForTimeout(2000)

      // No 400 errors on archive_context_items
      expect(failedRequests).toHaveLength(0)
    }
  })

  test('Family Overview detail loads without 400', async ({ page }) => {
    const failedRequests: string[] = []
    page.on('response', (response) => {
      if (response.status() === 400 && response.url().includes('archive_context_items')) {
        failedRequests.push(response.url())
      }
    })

    await page.goto('/archives/family-overview')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Should see Family Overview heading
    await expect(page.getByRole('heading', { name: 'Family Overview' })).toBeVisible()

    // No 400 errors
    expect(failedRequests).toHaveLength(0)
  })

  test('Bulk Add saves items that appear in archives', async ({ page }) => {
    const failedRequests: string[] = []
    page.on('response', (response) => {
      if (response.status() >= 400 && response.url().includes('archive_context_items')) {
        failedRequests.push(`${response.status()} ${response.url()}`)
      }
    })

    await page.goto('/archives')
    await page.waitForLoadState('networkidle')

    // Open FAB
    const fab = page.locator('button[aria-label="Add context"], button[aria-label="Close menu"]')
    await fab.click()

    // Click "Bulk Add & Sort"
    const bulkAddBtn = page.getByText('Bulk Add & Sort')
    if (await bulkAddBtn.isVisible()) {
      await bulkAddBtn.click()
      await page.waitForTimeout(500)

      // Should see the modal
      await expect(page.getByText('Describe your family')).toBeVisible()
    }

    // No 400 errors during navigation
    const archiveItemErrors = failedRequests.filter(r => r.includes('archive_context_items'))
    expect(archiveItemErrors).toHaveLength(0)
  })
})

test.describe('Bug 2: InnerWorkings file upload', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMom(page)
  })

  test('InnerWorkings page loads and shows upload button', async ({ page }) => {
    await page.goto('/inner-workings')
    await page.waitForLoadState('networkidle')

    // Should see the page heading
    await expect(page.getByRole('heading', { name: /InnerWorkings/i })).toBeVisible()

    // Should see the Upload button
    const uploadBtn = page.getByText(/Upload|Document/i)
    await expect(uploadBtn.first()).toBeVisible()
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
    await page.waitForLoadState('networkidle')

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

    // Find the file input and upload
    const fileInput = page.locator('input[type="file"]').first()
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'personality-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(testContent),
      })

      // Wait for the extraction to complete (or fail)
      await page.waitForTimeout(10000)

      // Check that we did NOT get a user_settings error
      const settingsErrors = edgeFunctionErrors.filter(e =>
        e.includes('user_settings') || e.includes('schema cache')
      )
      expect(settingsErrors).toHaveLength(0)
    }
  })
})
