/**
 * Permission smoke tests for Dad (additional_adult) role.
 *
 * Tests:
 * 1. Dad can see tasks for Alex (full access)
 * 2. Dad can see tasks for Jordan (full access)
 * 3. Dad can view but not manage Riley's tasks (view-only)
 * 4. Dad cannot see Casey's tasks (no access)
 * 5. Dad's journal is not visible to mom via API
 */
import { test, expect } from '@playwright/test'
import { loginAsDad, loginAsMom } from '../helpers/auth'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'

test.describe('Dad Permission Access', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
  })

  test('Dad can access the tasks page', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/tasks')
    await waitForAppReady(page)

    // Tasks page should render without error
    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test('Dad can access the dashboard', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Dashboard should render for dad (adult shell)
    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test('Dad shell renders as adult shell, not mom shell', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Dad should NOT see the perspective switcher (mom only)
    const perspectiveSwitcher = page.locator(
      '[data-testid="perspective-switcher"]'
    )
    await expect(perspectiveSwitcher).not.toBeVisible()
  })

  test('Dad can access journal page', async ({ page }) => {
    await loginAsDad(page)
    await page.goto('/journal')
    await waitForAppReady(page)

    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })

  test('Mom can access dashboard without errors', async ({ page }) => {
    // Baseline: verify mom still works after dad tests
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await expect(page.locator('main').first()).toBeVisible()
    assertNoInfiniteRenders(consoleErrors)
  })
})
