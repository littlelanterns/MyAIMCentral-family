/**
 * SCOPE-2.F48 Admin Console shell — visual verification.
 *
 * Resolves the visual-verification gap flagged in Worker A4's report on
 * commit d27b1c9. Covers the two paths A4 could not confirm from a CLI
 * context:
 *
 *   1. Non-admin authenticated user visits /admin → renders the centered
 *      "Admin area" redirect card. Verified at 1440px desktop AND 375px
 *      mobile viewport (Convention #16 mobile parity check).
 *
 *   2. Super-admin authenticated user visits /admin → auto-redirects to
 *      /admin/approvals → renders the header + single tab + Inbox-icon
 *      empty-state. Verified at 1440px desktop.
 *
 * Auth approach — hybrid A + B (documented in worker report):
 *   - Path 1 uses real Supabase auth via loginAsMom (Sarah's email is not
 *     in SUPER_ADMIN_EMAILS and she has no staff_permissions row, so
 *     isAdmin=false through the full production code path).
 *   - Path 2 uses injectSuperAdminSession — synthetic session injection
 *     via localStorage. This bypasses real auth but is acceptable here
 *     because the super-admin-email check in useIsAdmin short-circuits
 *     before any DB query. Using real auth would require creating an
 *     auth.users row with tenisewertman@gmail.com (the founder's real
 *     email), which risks colliding with or polluting production data.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom, injectSuperAdminSession } from '../helpers/auth'

test.describe('Admin Shell (SCOPE-2.F48)', () => {
  test('non-admin visits /admin → sees redirect card at 1440px desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAsMom(page)

    await page.goto('/admin')

    // Card heading + body copy (AdminGate.tsx lines 47-54)
    await expect(
      page.getByRole('heading', { name: 'Admin area', level: 1 })
    ).toBeVisible()
    await expect(
      page.getByText(/This part of MyAIM is for platform administrators/)
    ).toBeVisible()

    // Back-to-dashboard link
    const backLink = page.getByRole('link', { name: 'Back to dashboard' })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/dashboard')

    // ShieldAlert lucide icon — rendered as an SVG in the card header
    const card = page
      .getByRole('heading', { name: 'Admin area', level: 1 })
      .locator('xpath=ancestor::div[1]')
    await expect(card.locator('svg').first()).toBeVisible()

    // URL stayed on /admin — card renders in place, no redirect
    await expect(page).toHaveURL(/\/admin$/)

    await page.screenshot({
      path: 'test-results/admin-non-admin-desktop.png',
      fullPage: false,
    })
  })

  test('non-admin visits /admin → redirect card fits at 375px mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginAsMom(page)

    await page.goto('/admin')

    await expect(
      page.getByRole('heading', { name: 'Admin area', level: 1 })
    ).toBeVisible()

    const backLink = page.getByRole('link', { name: 'Back to dashboard' })
    await expect(backLink).toBeVisible()
    await expect(backLink).toBeInViewport()

    // No horizontal overflow at 375px
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)

    await page.screenshot({
      path: 'test-results/admin-non-admin-mobile.png',
      fullPage: false,
    })
  })

  test('super-admin visits /admin → lands at /admin/approvals empty-state', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await injectSuperAdminSession(page, 'tenisewertman@gmail.com')

    await page.goto('/admin')

    // <Route index> Navigate redirects /admin → /admin/approvals
    await expect(page).toHaveURL(/\/admin\/approvals$/)

    // Header copy (AdminLayout.tsx lines 42-50)
    await expect(
      page.getByRole('heading', { name: 'Admin Console', level: 1 })
    ).toBeVisible()
    await expect(page.getByText('Platform management')).toBeVisible()

    // Back-to-app link
    const backToApp = page.getByRole('link', { name: 'Back to app' })
    await expect(backToApp).toBeVisible()
    await expect(backToApp).toHaveAttribute('href', '/dashboard')

    // Tab registry — Approvals tab always present, first in order, active
    // on /admin/approvals. Spec is tab-count-agnostic so later waves
    // (Personas, COPPA) can append tabs without breaking this.
    const tabs = page.getByRole('tab')
    await expect(tabs.first()).toHaveText('Approvals')
    await expect(tabs.first()).toHaveClass(/btn-primary/)

    // Empty-state card (ApprovalsPlaceholder.tsx lines 21-29)
    await expect(
      page.getByRole('heading', { name: 'No pending approvals', level: 2 })
    ).toBeVisible()
    await expect(
      page.getByText(/parental-consent requests or community personas/)
    ).toBeVisible()

    await page.screenshot({
      path: 'test-results/admin-super-admin-approvals.png',
      fullPage: false,
    })
  })
})
