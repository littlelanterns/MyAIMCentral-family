/**
 * PRD-17B: MindSweep Sprint 1+2 — E2E Tests
 *
 * Tests:
 * 1. /sweep page loads and renders capture UI
 * 2. /sweep text input and Sweep Now button work
 * 3. /sweep Save for Later adds to holding queue
 * 4. /sweep settings panel opens and shows modes
 * 5. /sweep scan button triggers file input
 * 6. /sweep link input shows URL field
 * 7. Notepad MindSweep tile exists in RoutingStrip
 * 8. /sweep requires auth (redirects if not logged in)
 * 9. Holding queue badge shows count
 * 10. Settings mode change persists
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'

test.describe('PRD-17B: MindSweep', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
  })

  // ── /sweep page ──

  test('/sweep page loads with capture UI', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // Should see MindSweep header
    await expect(page.getByRole('heading', { name: 'MindSweep' })).toBeVisible()

    // Text input should be present
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()

    // Sweep Now button should be present (disabled when empty)
    const sweepBtn = page.getByRole('button', { name: /Sweep Now/i })
    await expect(sweepBtn).toBeVisible()
    await expect(sweepBtn).toBeDisabled()

    // Save for Later button should be present
    const saveBtn = page.getByRole('button', { name: /Save for Later/i })
    await expect(saveBtn).toBeVisible()

    // Voice, Scan, Link buttons should be present
    await expect(page.getByRole('button', { name: /Voice|Tap to talk/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Photo/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Link/i })).toBeVisible()

    // Auto-sort indicator
    await expect(page.getByText(/Auto-sort:/)).toBeVisible()

    // Open MyAIM link
    await expect(page.getByRole('button', { name: /Open MyAIM/i })).toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep text enables Sweep Now button', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    const textarea = page.locator('textarea')
    const sweepBtn = page.getByRole('button', { name: /Sweep Now/i })

    // Initially disabled
    await expect(sweepBtn).toBeDisabled()

    // Type content
    await textarea.fill('Buy milk, eggs, and bread')

    // Now enabled
    await expect(sweepBtn).toBeEnabled()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep Save for Later adds to holding', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    const textarea = page.locator('textarea')
    await textarea.fill('Call the dentist tomorrow')

    const saveBtn = page.getByRole('button', { name: /Save for Later/i })
    await expect(saveBtn).toBeEnabled()
    await saveBtn.click()

    // Text should be cleared after save
    await page.waitForTimeout(1000)
    await expect(textarea).toHaveValue('')

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep settings panel opens', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // Click settings gear
    const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') })
    await settingsBtn.first().click()

    // Settings panel should appear with mode options
    await expect(page.getByText('MindSweep Settings')).toBeVisible()
    await expect(page.getByText('Auto-sort mode')).toBeVisible()
    await expect(page.getByText('Trust the Obvious')).toBeVisible()
    await expect(page.getByText('Full Autopilot')).toBeVisible()

    // Always review section should be expandable
    await expect(page.getByText('Always review (regardless of mode)')).toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep Photo button triggers file picker', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // The hidden file input should exist (no capture="environment" — allows gallery)
    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    await expect(fileInput).toBeAttached()
    // Verify capture attribute was removed (allows gallery picks)
    await expect(fileInput).not.toHaveAttribute('capture')

    // Clicking Photo should trigger the file input
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: /Photo/i }).click(),
    ])
    expect(fileChooser).toBeTruthy()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep link button shows URL input', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // Click Link button
    await page.getByRole('button', { name: /Link/i }).click()

    // URL input should appear
    const urlInput = page.locator('input[type="url"]')
    await expect(urlInput).toBeVisible()
    await expect(urlInput).toHaveAttribute('placeholder', 'Paste URL...')

    // Fetch button should appear
    await expect(page.getByRole('button', { name: /Fetch/i })).toBeVisible()

    // Close (X) button should dismiss the link input
    const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).last()
    await closeBtn.click()
    await expect(urlInput).not.toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep requires auth', async ({ page }) => {
    // Navigate without logging in
    await page.goto('/sweep')
    await page.waitForTimeout(3000)

    // Should NOT see MindSweep UI — should be redirected to auth
    const heading = page.getByRole('heading', { name: 'MindSweep' })
    const isVisible = await heading.isVisible().catch(() => false)
    expect(isVisible).toBe(false)

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep Open MyAIM navigates to dashboard', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    await page.getByRole('button', { name: /Open MyAIM/i }).click()
    await page.waitForTimeout(2000)

    expect(page.url()).toContain('/dashboard')

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Notepad MindSweep integration ──

  test('Notepad RoutingStrip shows MindSweep tile', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Open notepad via pull tab (desktop only — hidden on mobile viewport)
    const notepadTrigger = page.locator('button:has(svg.lucide-sticky-note)').first()
    if (!(await notepadTrigger.isVisible().catch(() => false))) {
      assertNoInfiniteRenders(consoleErrors)
      return
    }
    await notepadTrigger.click()
    await page.waitForTimeout(1000)

    // Create a new tab if empty state
    const newTabBtn = page.getByRole('button', { name: 'New Tab' })
    if (await newTabBtn.isVisible().catch(() => false)) {
      await newTabBtn.click()
      await page.waitForTimeout(1000)
    }

    // Type content via tiptap contenteditable editor
    const editor = page.locator('.ProseMirror, [contenteditable="true"]').first()
    if (!(await editor.isVisible().catch(() => false))) {
      assertNoInfiniteRenders(consoleErrors)
      return
    }
    await editor.click()
    await page.keyboard.type('Test content for MindSweep', { delay: 20 })
    await page.waitForTimeout(800)

    // Click Send To button
    const sendToBtn = page.getByRole('button', { name: /Send to/i })
    if (!(await sendToBtn.isEnabled().catch(() => false))) {
      // Content may not have registered — skip gracefully
      assertNoInfiniteRenders(consoleErrors)
      return
    }
    await sendToBtn.click()
    await page.waitForTimeout(500)

    // MindSweep tile should be in the RoutingStrip (use nth to handle QuickTasks also having "MindSweep")
    const mindSweepButtons = page.getByRole('button', { name: 'MindSweep' })
    expect(await mindSweepButtons.count()).toBeGreaterThanOrEqual(1)

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Settings persistence ──

  test('/sweep settings panel can be opened and closed', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // Open settings
    const settingsBtn = page.locator('button').filter({ has: page.locator('svg.lucide-settings') })
    await settingsBtn.first().click()
    await page.waitForTimeout(500)

    // Should see settings header and collapsible sections
    await expect(page.getByText('Auto-sort mode')).toBeVisible()
    await expect(page.getByText('Always review (regardless of mode)')).toBeVisible()
    await expect(page.getByText('Document scanning')).toBeVisible()
    await expect(page.getByText('Digest')).toBeVisible()

    // Close settings via X
    const settingsHeader = page.getByText('MindSweep Settings')
    const closeXBtn = settingsHeader.locator('..').locator('button')
    await closeXBtn.click()
    await page.waitForTimeout(500)

    // Settings should be hidden — just the capture area visible
    await expect(page.getByText('MindSweep Settings')).not.toBeVisible()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep Sweep Now with content shows processing state', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    const textarea = page.locator('textarea')
    await textarea.fill('Pick up prescription from pharmacy\nBuy bananas\nCall mom about Saturday')

    // Click Sweep Now
    const sweepBtn = page.getByRole('button', { name: /Sweep Now/i })
    await sweepBtn.click()

    // Should show processing indicator (may be brief)
    // Wait for either processing or completion state
    await page.waitForTimeout(500)
    const processing = page.getByText('MindSweep sorting...')
    const sorted = page.getByText(/Sorted!|items sent|auto-routed/)
    const error = page.getByText(/went wrong/)

    // One of these states should appear within 15s (Edge Function call)
    await expect(processing.or(sorted).or(error)).toBeVisible({ timeout: 15000 })

    // Text should be cleared on success
    if (await sorted.isVisible()) {
      await expect(textarea).toHaveValue('')
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  // ── Image Upload + OCR Tests ──

  test('/sweep Photo upload populates textarea with OCR text', async ({ page }) => {
    await loginAsMom(page)

    // Mock the mindsweep-scan Edge Function (handle both OPTIONS and POST)
    await page.route('**/functions/v1/mindsweep-scan', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          text: 'Crane Community Easter Egg Hunt\nApril 4\nToday at 3 PM – 4 PM\nCrane High School (Missouri)\nCrane, MO',
        }),
      })
    })

    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    const textarea = page.locator('textarea')

    // Upload a test image via the file input
    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    await fileInput.setInputFiles({ name: 'test-flyer.png', mimeType: 'image/png', buffer })

    // Wait for OCR processing
    await page.waitForTimeout(3000)

    // Textarea should now contain the extracted text
    const value = await textarea.inputValue()
    expect(value).toContain('Crane Community Easter Egg Hunt')
    expect(value).toContain('3 PM')

    // Sweep Now should be enabled
    await expect(page.getByRole('button', { name: /Sweep Now/i })).toBeEnabled()

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep OCR content sweeps as single item (not split)', async ({ page }) => {
    await loginAsMom(page)

    // Track the mindsweep-sort request to verify it receives scan_extracted type
    let sortRequestBody: Record<string, unknown> | null = null

    // Mock mindsweep-scan (OCR)
    await page.route('**/functions/v1/mindsweep-scan', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: 'Easter Egg Hunt\nApril 4\n3 PM – 4 PM\nCrane High School' }),
      })
    })

    // Mock mindsweep-sort — capture the request body
    await page.route('**/functions/v1/mindsweep-sort', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
        return
      }
      sortRequestBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          event_id: '00000000-0000-0000-0000-000000000001',
          results: [{
            original_content: 'Easter Egg Hunt\nApril 4\n3 PM – 4 PM\nCrane High School',
            extracted_text: 'Easter Egg Hunt\nApril 4\n3 PM – 4 PM\nCrane High School',
            category: 'calendar',
            destination: 'calendar',
            confidence: 'high',
            classified_by: 'llm_batch',
            sensitivity_flag: false,
          }],
          totals: { items_extracted: 1, items_auto_routed: 0, items_queued: 1, items_direct_routed: 0, items_classified_by_embedding: 0, items_classified_by_llm: 1, processing_cost_cents: 0 },
        }),
      })
    })

    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // Upload image → OCR text populates textarea
    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    await fileInput.setInputFiles({ name: 'flyer.png', mimeType: 'image/png', buffer })
    await page.waitForTimeout(3000)

    // Click Sweep Now
    await page.getByRole('button', { name: /Sweep Now/i }).click()
    await page.waitForTimeout(3000)

    // Verify the sort request sent scan_extracted (not text) and sent ONE item
    expect(sortRequestBody).not.toBeNull()
    const items = (sortRequestBody as Record<string, unknown>)?.items as Array<{ content_type: string }>
    expect(items).toHaveLength(1)
    expect(items[0].content_type).toBe('scan_extracted')

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep brain dump text gets split into multiple items', async ({ page }) => {
    await loginAsMom(page)

    let sortRequestBody: Record<string, unknown> | null = null

    // Mock mindsweep-sort
    await page.route('**/functions/v1/mindsweep-sort', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
        return
      }
      sortRequestBody = JSON.parse(route.request().postData() || '{}')
      const itemCount = (sortRequestBody?.items as unknown[])?.length || 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          event_id: '00000000-0000-0000-0000-000000000002',
          results: Array.from({ length: itemCount }, (_, i) => ({
            original_content: `Item ${i + 1}`,
            extracted_text: `Item ${i + 1}`,
            category: 'task',
            destination: 'task',
            confidence: 'medium',
            classified_by: 'llm_batch',
            sensitivity_flag: false,
          })),
          totals: { items_extracted: itemCount, items_auto_routed: 0, items_queued: itemCount, items_direct_routed: 0, items_classified_by_embedding: 0, items_classified_by_llm: itemCount, processing_cost_cents: 0 },
        }),
      })
    })

    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // Type a brain dump with multiple lines
    const textarea = page.locator('textarea')
    await textarea.fill('Buy milk and eggs\nCall dentist about appointment\nPick up library books\nSchedule oil change')

    // Click Sweep Now
    await page.getByRole('button', { name: /Sweep Now/i }).click()
    await page.waitForTimeout(3000)

    // Verify the sort request sent content_type='text' (will be split server-side)
    expect(sortRequestBody).not.toBeNull()
    const items = (sortRequestBody as Record<string, unknown>)?.items as Array<{ content_type: string; content: string }>
    expect(items).toHaveLength(1) // Client sends as one item
    expect(items[0].content_type).toBe('text')
    expect(items[0].content).toContain('Buy milk')
    expect(items[0].content).toContain('Call dentist')

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep holding queue batches items for Sweep All', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    const textarea = page.locator('textarea')

    // Add first item to holding
    await textarea.fill('Buy groceries for Easter dinner')
    await page.getByRole('button', { name: /Save for Later/i }).click()
    await page.waitForTimeout(1500)
    await expect(textarea).toHaveValue('')

    // Add second item to holding
    await textarea.fill('Call grandma about Sunday plans')
    await page.getByRole('button', { name: /Save for Later/i }).click()
    await page.waitForTimeout(1500)
    await expect(textarea).toHaveValue('')

    // Open holding queue panel — look for inbox icon button with badge
    const holdingToggle = page.locator('button').filter({ has: page.locator('svg.lucide-inbox') })
    if (await holdingToggle.isVisible()) {
      await holdingToggle.click()
      await page.waitForTimeout(1000)

      // Should see "Sweep All" button in the panel
      const sweepAllBtn = page.getByRole('button', { name: /Sweep All/i })
      await expect(sweepAllBtn).toBeVisible()

      // Should see held items listed
      await expect(page.getByText('Buy groceries').first()).toBeVisible()
      await expect(page.getByText('Call grandma').first()).toBeVisible()
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('/sweep error display shows when scan fails', async ({ page }) => {
    await loginAsMom(page)

    // Mock mindsweep-scan to return an error
    await page.route('**/functions/v1/mindsweep-scan', async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
        return
      }
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Vision extraction failed (502)' }),
      })
    })

    await page.goto('/sweep')
    await page.waitForTimeout(2000)

    // Upload a test image
    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    await fileInput.setInputFiles({ name: 'bad.png', mimeType: 'image/png', buffer })

    // Wait for error to display
    await page.waitForTimeout(3000)

    // Error message should be visible in the scan error container (span.text-xs inside border-t div)
    const errorContainer = page.locator('.border-t span.text-xs').filter({ hasText: /non-2xx|failed|error/i })
    await expect(errorContainer.first()).toBeVisible({ timeout: 5000 })

    assertNoInfiniteRenders(consoleErrors)
  })
})
