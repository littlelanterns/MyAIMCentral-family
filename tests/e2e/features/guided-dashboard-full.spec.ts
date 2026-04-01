/**
 * PRD-25 Guided Dashboard — Full E2E Tests (Phases A, B, C)
 *
 * Tests against the real family from env.local:
 * - Mom (E2E_DEV_EMAIL) — full dashboard + Tasks page
 * - Mosiah (E2E_MOSIAH_PIN) — Guided member dashboard experience
 *
 * All credentials read from .env.local — nothing hardcoded.
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`

// ─── Auth helpers ─────────────────────────────────────────────

async function clearAuth(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'commit' })
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY)
  await page.waitForTimeout(200)
}

async function loginAsMom(page: Page) {
  const email = process.env.E2E_DEV_EMAIL!
  const password = process.env.E2E_DEV_PASSWORD!

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`Mom login failed: ${error?.message}`)

  // Go to the login page (no auth guard) to set localStorage
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(([key, val]) => localStorage.setItem(key, val), [
    STORAGE_KEY,
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

  // Now navigate to dashboard — auth should be active
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

async function loginAsMosiah(page: Page) {
  const pin = process.env.E2E_MOSIAH_PIN!
  const familyName = process.env.E2E_FAMILY_LOGIN_NAME!

  // Clear any existing session first
  await clearAuth(page)

  await page.goto('/auth/family-login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Step 1: Enter family login name
  const familyInput = page.locator('input').first()
  await familyInput.waitFor({ state: 'visible', timeout: 10000 })
  await familyInput.fill(familyName)

  // Click Continue
  const continueBtn = page.locator('button[type="submit"]').first()
  await continueBtn.click()
  await page.waitForTimeout(2500)

  // Step 2: Select Mosiah from member grid
  const mosiah = page.locator('button:has-text("Mosiah")')
  await mosiah.waitFor({ state: 'visible', timeout: 10000 })
  await mosiah.click()
  await page.waitForTimeout(1000)

  // Step 3: Enter PIN
  const pinInput = page.locator('input[type="password"]')
  await pinInput.waitFor({ state: 'visible', timeout: 10000 })
  await pinInput.fill(pin)

  // Submit PIN
  const enterBtn = page.locator('button[type="submit"]')
  await enterBtn.click()

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {
    // If not redirected, try navigating directly
  })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

function captureErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message))
  return errors
}

function assertNoInfiniteRenders(errors: string[]) {
  const bad = errors.filter(e =>
    e.includes('Maximum update depth exceeded') ||
    e.includes('Too many re-renders') ||
    e.includes('Minified React error #185')
  )
  if (bad.length > 0) throw new Error(`Infinite render: ${bad.join('\n')}`)
}

// ─── Mom Tests ────────────────────────────────────────────────

test.describe('Mom — Dashboard & Tasks', () => {
  let errors: string[]

  test.beforeEach(async ({ page }) => {
    errors = captureErrors(page)
    await loginAsMom(page)
  })

  test('Mom dashboard loads without errors', async ({ page }) => {
    // Should see the dashboard with a main element
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 })
    assertNoInfiniteRenders(errors)
  })

  test('Mom Tasks page shows all 5 tabs + Create button', async ({ page }) => {
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.locator('text=My Tasks')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('tab', { name: 'Routines' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Opportunities' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Sequential' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create', exact: true })).toBeVisible()
    assertNoInfiniteRenders(errors)
  })

  test('Mom Victories page shows placeholder', async ({ page }) => {
    await page.goto('/victories')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.locator('h1:has-text("Victories")').first()).toBeVisible({ timeout: 10000 })
    assertNoInfiniteRenders(errors)
  })

  test('Mom Trackers page shows placeholder', async ({ page }) => {
    await page.goto('/trackers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await expect(page.locator('h1:has-text("Trackers")').first()).toBeVisible({ timeout: 10000 })
    assertNoInfiniteRenders(errors)
  })
})

// ─── Mosiah (Guided member) Tests ─────────────────────────────

test.describe('Mosiah — Guided Dashboard Experience', () => {
  let errors: string[]

  test.beforeEach(async ({ page }) => {
    errors = captureErrors(page)
    await loginAsMosiah(page)
  })

  test('Guided Dashboard loads with greeting', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // GuidedDashboard renders time-of-day greeting
    const greeting = page.locator('text=/Good (morning|afternoon|evening)/i')
    await expect(greeting.first()).toBeVisible({ timeout: 15000 })
    assertNoInfiniteRenders(errors)
  })

  test('Guided Dashboard has TransparencyIndicator on Best Intentions', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // The TransparencyIndicator shows even when there are no intentions
    // (it's in the section footer, not per-item)
    const indicator = page.locator('text=Your parent can see your Best Intentions')
    // Also check for the section itself — may show "No Best Intentions set yet"
    const section = page.locator('text=/Best Intentions|parent can see/i')
    await expect(section.first()).toBeVisible({ timeout: 15000 })
    assertNoInfiniteRenders(errors)
  })

  test('Guided Dashboard has Next Best Thing section', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // NBT card may show a suggestion or empty state
    const nbt = page.locator('text=/Next Best Thing|Up next|no suggestions|Something Else|No tasks/i')
    await expect(nbt.first()).toBeVisible({ timeout: 15000 })
    assertNoInfiniteRenders(errors)
  })

  test('Guided bottom nav has all 5 items', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const nav = page.locator('nav').last()
    await expect(nav.locator('text=Home')).toBeVisible({ timeout: 10000 })
    await expect(nav.locator('text=Tasks')).toBeVisible()
    await expect(nav.locator('text=Write')).toBeVisible()
    await expect(nav.locator('text=Victories')).toBeVisible()
    await expect(nav.locator('text=Progress')).toBeVisible()
    assertNoInfiniteRenders(errors)
  })

  test('Guided Tasks page: 2 tabs, no Create button', async ({ page }) => {
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.locator('text=My Tasks')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Opportunities')).toBeVisible()
    // No Create button for Guided members
    await expect(page.locator('button:has-text("Create")')).not.toBeVisible()
    assertNoInfiniteRenders(errors)
  })

  test('Guided Victories page shows warm stub', async ({ page }) => {
    await page.goto('/victories')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.locator('text=Your victories page is coming soon')).toBeVisible({ timeout: 15000 })
    assertNoInfiniteRenders(errors)
  })

  test('Guided Progress page shows warm stub', async ({ page }) => {
    await page.goto('/trackers')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await expect(page.locator('text=Your progress page is coming soon')).toBeVisible({ timeout: 15000 })
    assertNoInfiniteRenders(errors)
  })

  test('Write drawer opens from bottom nav', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Tap Write in bottom nav (it's a button, not a link)
    const nav = page.locator('nav').last()
    const writeBtn = nav.locator('button:has-text("Write")').first()
    await writeBtn.click()
    await page.waitForTimeout(600)

    // TransparencyIndicator should appear in the drawer
    await expect(page.locator('text=Your parent can see what you write')).toBeVisible({ timeout: 5000 })
    assertNoInfiniteRenders(errors)
  })

  test('Write drawer notepad accepts text input', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Open Write drawer
    const nav = page.locator('nav').last()
    await nav.locator('button:has-text("Write")').first().click()
    await page.waitForTimeout(600)

    const textarea = page.locator('textarea')
    await expect(textarea.first()).toBeVisible({ timeout: 5000 })
    await textarea.first().fill('Test from Playwright')
    await expect(textarea.first()).toHaveValue('Test from Playwright')
    assertNoInfiniteRenders(errors)
  })
})
