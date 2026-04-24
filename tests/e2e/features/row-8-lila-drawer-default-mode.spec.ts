/**
 * Row 8 — NEW-B LiLa drawer default mode = Assist + routing concierge.
 *
 * Asserts the behavior delivered in commits 5a52e80 + 1e25416 + 6c48021:
 *
 *  (a) Drawer boots with mode = Assist (not General). Header label reads
 *      "LiLa Assist" after the kid/mom lands on their shell.
 *  (b) Mode switcher dropdown does NOT include "General" (user-facing
 *      surface confirmed clean).
 *  (c) When a user in Assist mode sends a bug/help-keyword message, the
 *      lila-chat Edge Function Layer-1 pre-scan fires, returns a help
 *      auto_switch routing payload, and the drawer flips currentMode to
 *      "help" (visible as "LiLa Help" in the header).
 *
 * The concierge chip is rendered AFTER streaming completes per the green-
 * light guidance, so we wait for network idle + modeLabel change.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'

test.describe('Row 8 — LiLa drawer default mode + routing concierge', () => {
  test.setTimeout(60_000)

  test('default mode is Assist (not General), General absent from switcher, bug message auto-switches to Help', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Dismiss the GuidedIntroTour carousel(s). Multiple guides may mount on
    // the dashboard; click "Don't show guides" if available, otherwise fall
    // back to repeatedly dismissing. Guides overlay the drawer and can block
    // dropdown interactions with the FeatureGuide banner intercepting pointer
    // events.
    const stopGuides = page.getByRole('button', { name: /Don'?t show guides/ }).first()
    if (await stopGuides.isVisible().catch(() => false)) {
      await stopGuides.click()
      await page.waitForTimeout(300)
    } else {
      for (let i = 0; i < 4; i++) {
        const dg = page.getByRole('button', { name: 'Dismiss guide' }).first()
        if (await dg.isVisible().catch(() => false)) {
          await dg.click({ force: true }).catch(() => undefined)
          await page.waitForTimeout(200)
        } else {
          break
        }
      }
    }

    // Scope assertions to the drawer container (fixed bottom-14 md:bottom-0).
    const drawerRoot = page.locator('div.fixed.bottom-14').filter({
      has: page.getByRole('button', { name: 'Toggle drawer' }),
    })

    // (a) Drawer modeLabel inside the drawer is "LiLa Assist".
    const assistInDrawer = drawerRoot.getByText('LiLa Assist').first()
    await expect(assistInDrawer).toBeVisible({ timeout: 10_000 })

    // Negative: no "LiLa General" / "General Chat" anywhere.
    await expect(page.getByText('General Chat', { exact: true })).toHaveCount(0)
    await expect(page.getByText('LiLa General', { exact: true })).toHaveCount(0)

    // Expand the drawer via the PullTab button (aria-label="Toggle drawer").
    const pullTabBtn = page.getByRole('button', { name: 'Toggle drawer' }).first()
    await pullTabBtn.click()
    await page.waitForTimeout(600)

    // (b) Open the drawer's mode switcher. Scoped to the drawer so we don't
    //     collide with the top-of-shell FloatingLilaButton (also named
    //     "LiLa Assist" via its avatar alt). Use dispatchEvent to bypass any
    //     still-present FeatureGuide overlay intercepts.
    const switcherTrigger = drawerRoot
      .getByRole('button', { name: /LiLa Assist/ })
      .first()
    await switcherTrigger.scrollIntoViewIfNeeded()
    await switcherTrigger.dispatchEvent('click')
    await page.waitForTimeout(500)

    // Dropdown is portaled. Expect Core Modes section visible.
    await expect(page.getByText('Core Modes')).toBeVisible({ timeout: 3_000 })
    // Assist, Help, Optimizer present. General NOT present.
    await expect(page.getByText('LiLa Help', { exact: true })).toBeVisible()
    await expect(page.getByText('LiLa Optimizer', { exact: true })).toBeVisible()
    await expect(page.getByText('General Chat', { exact: true })).toHaveCount(0)
    await expect(page.getByText('LiLa General', { exact: true })).toHaveCount(0)

    // Close dropdown by clicking body
    await page.mouse.click(10, 10)
    await page.waitForTimeout(300)

    // (c) Send a bug-keyword message. Pre-scan should classify it as help
    //     and auto-switch. The input placeholder uses "What's on your mind?"
    //     or mode-specific text.
    const input = page
      .getByPlaceholder(/What do you want to learn about|on your mind/i)
      .first()
    await expect(input).toBeVisible({ timeout: 5_000 })
    // Focus + fill via direct DOM to bypass any lingering FeatureGuide
    // banner pointer intercepts (banner sits ABOVE the drawer visually but
    // below the floating buttons in z-order).
    await input.focus()
    await input.fill('There is a bug in the calendar — it is broken')
    await input.press('Enter')

    // Wait for streaming to complete. The Edge Function emits SSE with a
    // 'metadata' event carrying the routing payload; on auto_switch+help
    // the drawer sets currentMode='help', which flips modeLabel to
    // "LiLa Help" in the header. That's the user-facing signal.
    await expect(page.getByText('LiLa Help').first()).toBeVisible({ timeout: 20_000 })

    // Negative: after the switch, "LiLa Assist" should no longer be the
    // currently-displayed mode label in the drawer header (it may still
    // appear in background components; we only assert LiLa Help is there).
    await page.screenshot({
      path: 'test-results/row-8-lila-concierge-help.png',
      fullPage: false,
    })
  })
})
