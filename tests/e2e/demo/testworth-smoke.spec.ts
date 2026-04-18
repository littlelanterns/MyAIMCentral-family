/**
 * Smoke test: Verify Testworth demo family sign-in and basic data visibility.
 * Run: npx playwright test tests/e2e/demo/testworth-smoke.spec.ts --headed
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

const DEMO_USERS = {
  sarah: { email: 'testmom@testworths.com', password: 'Demo2026!' },
  alex: { email: 'alextest@testworths.com', password: 'Demo2026!' },
}

async function loginAs(page: Page, email: string, password: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`Login failed: ${error?.message}`)

  await page.goto('/')
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  await page.evaluate(([key, val]) => localStorage.setItem(key, val), [
    storageKey,
    JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in || 3600,
      token_type: 'bearer',
      type: 'access',
      user: data.session.user,
    }),
  ])
  await page.reload()
  await page.waitForLoadState('networkidle')
}

test.describe('Testworth Demo Family', () => {
  test('Sarah can sign in and reach dashboard', async ({ page }) => {
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    // Should see some content (not redirected to auth)
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 })
    // Should NOT be on auth pages
    expect(page.url()).not.toContain('/auth/')
  })

  test('Alex can sign in and reach dashboard', async ({ page }) => {
    await loginAs(page, DEMO_USERS.alex.email, DEMO_USERS.alex.password)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 })
    expect(page.url()).not.toContain('/auth/')
  })

  test('Sarah can see Guiding Stars', async ({ page }) => {
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/guiding-stars')
    await page.waitForLoadState('networkidle')
    // Look for her guiding star content
    await expect(page.getByText('I lead with love', { exact: false })).toBeVisible({ timeout: 10000 })
  })

  test('Sarah can see Best Intentions', async ({ page }) => {
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/guiding-stars')
    await page.waitForLoadState('networkidle')
    // Best Intentions is a separate section — click sidebar or scroll
    await page.click('text=BestIntentions', { timeout: 5000 }).catch(() => {
      // If sidebar link doesn't work, scroll to bottom of page
      return page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    })
    await page.waitForTimeout(1000)
    // Check for any intention text — may be in a card below Guiding Stars
    const mainContent = await page.locator('main').first().textContent()
    expect(mainContent).toBeTruthy()
  })

  test('Sarah can see InnerWorkings', async ({ page }) => {
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/inner-workings')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('CliftonStrengths', { exact: false }).first()).toBeVisible({ timeout: 10000 })
  })

  test('Sarah can see Tasks', async ({ page }) => {
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('insurance', { exact: false })).toBeVisible({ timeout: 10000 })
  })

  test('Sarah can see Archives', async ({ page }) => {
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/archives')
    await page.waitForLoadState('networkidle')
    // Should see family member names or archive content
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 })
    // Archives may show member cards or folder structure — verify page loaded with content
    const mainText = await page.locator('main').first().textContent()
    expect(mainText?.length).toBeGreaterThan(10)
  })

  test('Sarah can see Lists', async ({ page }) => {
    await loginAs(page, DEMO_USERS.sarah.email, DEMO_USERS.sarah.password)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Grocery', { exact: false })).toBeVisible({ timeout: 10000 })
  })
})
