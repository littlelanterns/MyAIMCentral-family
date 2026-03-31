import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors } from '../helpers/assertions'

test('Debug: capture console errors on dashboard', async ({ page }) => {
  const errors = captureConsoleErrors(page)

  // Also capture ALL console messages
  const allLogs: string[] = []
  page.on('console', (msg) => {
    allLogs.push(`[${msg.type()}] ${msg.text()}`)
  })

  await loginAsMom(page)
  await page.goto('/dashboard')
  await waitForAppReady(page)
  await page.waitForTimeout(5000)

  console.log(`\n=== Console errors: ${errors.length} ===`)
  for (const e of errors) console.log(`  ERROR: ${e}`)

  console.log(`\n=== All console messages (last 30): ===`)
  for (const l of allLogs.slice(-30)) console.log(`  ${l}`)

  const mainVisible = await page.locator('main').first().isVisible().catch(() => false)
  console.log(`\nMain visible: ${mainVisible}`)

  // Take screenshot
  await page.screenshot({ path: 'test-results/fo-debug-screenshot.png' })
  console.log('Screenshot saved to test-results/fo-debug-screenshot.png')

  expect(true).toBeTruthy()
})
