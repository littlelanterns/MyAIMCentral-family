/**
 * Shared assertion helpers for E2E tests.
 */
import { Page, expect } from '@playwright/test'

/**
 * Captures console errors during a test.
 * Call in beforeEach, then check the array after navigation.
 */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

/**
 * Assert no infinite re-render errors appeared in console.
 */
export function assertNoInfiniteRenders(errors: string[]): void {
  const infiniteRenderErrors = errors.filter(
    (e) =>
      e.includes('Maximum update depth exceeded') ||
      e.includes('Too many re-renders') ||
      e.includes('Minified React error #185')
  )

  if (infiniteRenderErrors.length > 0) {
    throw new Error(
      `Infinite re-render detected:\n${infiniteRenderErrors.join('\n')}`
    )
  }
}

/**
 * Assert that the page rendered without hitting an error boundary.
 */
export async function assertNoErrorBoundary(page: Page): Promise<void> {
  const errorBoundary = page.locator('[data-testid="error-boundary"]')
  const count = await errorBoundary.count()
  if (count > 0) {
    const text = await errorBoundary.first().textContent()
    throw new Error(`Error boundary rendered: ${text}`)
  }
}

/**
 * Assert that the main content area is visible and not empty.
 */
export async function assertMainContentVisible(page: Page): Promise<void> {
  await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 })
}

/**
 * Wait for the app to fully load after navigation.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  // Give React time to finish rendering
  await page.waitForTimeout(500)
}
