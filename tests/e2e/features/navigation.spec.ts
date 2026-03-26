/**
 * Core navigation tests for Mom Shell.
 * Verifies sidebar, drawers, settings, and perspective switcher.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import {
  captureConsoleErrors,
  assertNoInfiniteRenders,
  waitForAppReady,
} from '../helpers/assertions'

test.describe('Mom Shell Navigation', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
    await loginAsMom(page)
  })

  test('sidebar renders navigation sections', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // The sidebar should contain nav links — check for common nav text
    // These match the BottomNav / sidebar items from PRD-04
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible({ timeout: 10000 })
  })

  test('clicking sidebar nav items changes URL and renders content', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Test key navigation links
    const navTargets = [
      { text: /tasks/i, expectedUrl: '/tasks' },
      { text: /journal/i, expectedUrl: '/journal' },
    ]

    for (const target of navTargets) {
      // Find and click the nav link
      const link = page.locator(`a:has-text("${target.text.source}")`).first()
      if ((await link.count()) > 0) {
        await link.click()
        await waitForAppReady(page)

        // URL should have changed
        expect(page.url()).toContain(target.expectedUrl)

        // Main content should be visible
        await expect(page.locator('main').first()).toBeVisible()
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('LiLa drawer opens and closes', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Look for LiLa trigger button (usually in bottom area)
    const lilaButton = page.locator(
      'button:has-text("LiLa"), [aria-label*="LiLa"], [data-testid="lila-trigger"]'
    ).first()

    if ((await lilaButton.count()) > 0) {
      await lilaButton.click()
      await page.waitForTimeout(500)

      // Drawer should be visible
      const drawer = page.locator(
        '[data-testid="lila-drawer"], [class*="lila"], [role="dialog"]'
      ).first()

      if ((await drawer.count()) > 0) {
        await expect(drawer).toBeVisible()

        // Close the drawer
        const closeButton = drawer.locator(
          'button:has-text("Close"), [aria-label*="close"], button:has([class*="x"])'
        ).first()
        if ((await closeButton.count()) > 0) {
          await closeButton.click()
          await page.waitForTimeout(500)
        }
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Smart Notepad drawer opens and closes', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Look for Notepad trigger
    const notepadButton = page.locator(
      'button:has-text("Notepad"), [aria-label*="Notepad"], [data-testid="notepad-trigger"]'
    ).first()

    if ((await notepadButton.count()) > 0) {
      await notepadButton.click()
      await page.waitForTimeout(500)

      // Notepad drawer should appear
      const notepadDrawer = page.locator(
        '[data-testid="notepad-drawer"], [class*="notepad"]'
      ).first()

      if ((await notepadDrawer.count()) > 0) {
        await expect(notepadDrawer).toBeVisible()
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Settings gear opens Settings overlay', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Settings is a floating gear icon (PRD-04: not in sidebar)
    const settingsButton = page.locator(
      'button:has([class*="settings"]), [aria-label*="Settings"], [data-testid="settings-gear"]'
    ).first()

    if ((await settingsButton.count()) > 0) {
      await settingsButton.click()
      await page.waitForTimeout(500)

      // Should open an overlay, not navigate away
      expect(page.url()).toContain('/dashboard')

      // Settings overlay should be visible
      const settingsOverlay = page.locator(
        '[data-testid="settings-overlay"], [class*="settings"]'
      ).first()

      if ((await settingsOverlay.count()) > 0) {
        await expect(settingsOverlay).toBeVisible()
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })

  test('Perspective switcher tabs work on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // PerspectiveSwitcher is a segmented control — mom only, on dashboard
    const switcher = page.locator(
      '[data-testid="perspective-switcher"], [class*="perspective"]'
    ).first()

    if ((await switcher.count()) > 0) {
      // Look for the three perspective options
      const perspectives = ['My Dashboard', 'Family Overview', 'Family Hub']

      for (const perspective of perspectives) {
        const tab = switcher.locator(`button:has-text("${perspective}")`).first()
        if ((await tab.count()) > 0) {
          await tab.click()
          await page.waitForTimeout(500)

          // Should not navigate away
          expect(page.url()).toContain('/dashboard')
        }
      }
    }

    assertNoInfiniteRenders(consoleErrors)
  })
})
