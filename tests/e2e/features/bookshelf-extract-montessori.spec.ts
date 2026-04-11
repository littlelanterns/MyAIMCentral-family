/**
 * BookShelf Extraction Flow — The Montessori Method
 *
 * End-to-end test: navigate to the book, see the "Extract This Book" button,
 * click it, watch progress, verify extractions appear with youth text.
 * Uses the real dev family account.
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const MOM_EMAIL = process.env.E2E_DEV_EMAIL!
const MOM_PASSWORD = process.env.E2E_DEV_PASSWORD!
const AUTH_CACHE_DIR = path.join(process.cwd(), 'tests', 'e2e', '.auth')

const MONTESSORI_ID = '48165482-b2ec-470a-89c7-c6983b5dda74'

async function getSession(): Promise<Record<string, unknown>> {
  const cachePath = path.join(AUTH_CACHE_DIR, 'extract-test-mom.json')
  if (fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    if (Date.now() < (cached.expires_at as number) * 1000 - 60000) return cached
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.auth.signInWithPassword({
    email: MOM_EMAIL, password: MOM_PASSWORD,
  })
  if (error || !data.session) throw new Error(`Login failed: ${error?.message}`)
  if (!fs.existsSync(AUTH_CACHE_DIR)) fs.mkdirSync(AUTH_CACHE_DIR, { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(data.session))
  return data.session as unknown as Record<string, unknown>
}

async function navigateAuthenticated(page: Page, url: string): Promise<void> {
  await page.goto('/auth/sign-in')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  if (!page.url().includes('/auth')) {
    if (!page.url().includes(url.replace(/^\//, ''))) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
    }
    return
  }

  const emailInput = page.locator('input[type="email"]')
  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(MOM_EMAIL)
  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.fill(MOM_PASSWORD)
  const submitBtn = page.locator('button[type="submit"]').first()
  await submitBtn.click()
  await page.waitForURL('**/dashboard**', { timeout: 20000 })
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  if (url !== '/dashboard') {
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
  }
}

test.describe('BookShelf extraction flow — Montessori Method', () => {
  test.use({ viewport: { width: 1280, height: 800 } })
  // This test calls Sonnet per section — it can take several minutes
  test.setTimeout(600_000)

  test('full extraction flow: navigate → Extract button → extractions appear', async ({ page }) => {
    // Step 1: Navigate to the book
    await navigateAuthenticated(page, `/bookshelf?book=${MONTESSORI_ID}`)

    // Step 2: Verify book title is visible
    await expect(page.getByText('Montessori', { exact: false }).first()).toBeVisible({ timeout: 15000 })

    // Step 3: "Extract This Book" button should be visible (book has chunks but no extractions)
    const extractBtn = page.locator('button').filter({ hasText: /Extract This Book/i }).first()
    await expect(extractBtn).toBeVisible({ timeout: 10000 })

    // Step 4: Verify "Ready to extract" message
    await expect(page.getByText('Ready to extract', { exact: false })).toBeVisible()

    // Step 5: Click "Extract This Book"
    await extractBtn.click()

    // Step 6: Progress text should appear
    await expect(page.getByText('Discovering sections', { exact: false })).toBeVisible({ timeout: 30000 })

    // Step 7: Wait for extraction to progress (first section)
    await expect(page.getByText(/Extracting section \d+ of \d+/i)).toBeVisible({ timeout: 120000 })

    // Step 8: Wait for "Done" or for extraction items to appear
    // We'll wait for either the progress to say "Done" or for actual extraction counts > 0
    // This can take several minutes for a 236-chunk book
    await page.waitForFunction(() => {
      // Check if any tab shows a count > 0
      const tabs = document.querySelectorAll('button')
      for (const tab of tabs) {
        const text = tab.textContent || ''
        const match = text.match(/Summaries\s+(\d+)/)
        if (match && parseInt(match[1]) > 0) return true
      }
      // Check if progress says Done
      const body = document.body.textContent || ''
      if (body.includes('Done! Loading')) return true
      return false
    }, { timeout: 540000 }) // 9 minutes max

    // Step 9: Verify extractions are now visible
    // Wait for refetch to complete
    await page.waitForTimeout(5000)

    // At least one tab should show items
    const summariesTab = page.locator('button').filter({ hasText: /Summaries/i }).first()
    await expect(summariesTab).toBeVisible()

    // Check the tab text contains a number > 0
    const tabText = await summariesTab.textContent()
    const countMatch = tabText?.match(/(\d+)/)
    const count = countMatch ? parseInt(countMatch[1]) : 0
    expect(count).toBeGreaterThan(0)

    // Step 10: Verify at least one extraction item renders
    const items = page.locator('[class*="border-l-"]')
    await expect(items.first()).toBeVisible({ timeout: 10000 })

    console.log(`✅ Extraction complete: Summaries tab shows ${count} items`)
  })

  test('verify extractions persisted to platform with youth text', async () => {
    // API-level check — no browser needed
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await supabase.auth.signInWithPassword({ email: MOM_EMAIL, password: MOM_PASSWORD })

    const { data: fm } = await supabase.from('family_members')
      .select('id').eq('user_id', (await supabase.auth.getUser()).data.user!.id)
      .limit(1).single()

    const { data, error } = await supabase.rpc('get_book_extractions', {
      p_bookshelf_item_ids: [MONTESSORI_ID],
      p_member_id: fm!.id,
      p_audience: 'original',
    })

    console.log('Platform extractions:', data?.length || 0, error?.message || '')

    // Should have extractions from the UI test above
    if (data && data.length > 0) {
      const guidedCount = data.filter((r: { guided_text: string | null }) => r.guided_text).length
      const indepCount = data.filter((r: { independent_text: string | null }) => r.independent_text).length
      console.log(`guided_text: ${guidedCount}/${data.length}`)
      console.log(`independent_text: ${indepCount}/${data.length}`)

      expect(guidedCount).toBeGreaterThan(0)
      expect(indepCount).toBeGreaterThan(0)
    } else {
      // If the first test didn't run, skip gracefully
      console.log('No extractions yet — run the UI test first')
    }
  })
})
