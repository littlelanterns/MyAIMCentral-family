// Verify ViewAs banner shows "Manage Tasks" button for Play child
// and the button routes correctly.

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'node:fs'

dotenv.config({ path: 'c:/dev/MyAIMCentral-family/MyAIMCentral-family/.env.local' })

const PROD_URL = process.env.DIAG_URL || 'https://www.myaimcentral.com'
const OUT_DIR = 'C:/tmp/viewas-verify'
const TEST_MOM = { email: 'testmom@myaim.test', password: 'TestPassword123!' }
const RILEY_ID = 'bec24ceb-2fa8-4b6b-822c-08717accc7d7' // Play child

fs.mkdirSync(OUT_DIR, { recursive: true })

async function main() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data, error } = await supabase.auth.signInWithPassword(TEST_MOM)
  if (error) throw new Error(`Auth failed: ${error.message}`)
  console.log(`[auth] Signed in as ${TEST_MOM.email}`)

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()

  await page.goto(PROD_URL)
  await page.evaluate((session) => {
    localStorage.setItem('myaim-auth', JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in || 3600,
      token_type: 'bearer',
      type: 'access',
      user: session.user,
    }))
  }, data.session)
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // Start ViewAs by directly navigating to a URL that triggers it, or opening
  // the picker. Simpler: write the viewingAs state into localStorage via a JS
  // call if the provider supports it. Otherwise navigate and use UI.
  //
  // Easiest test: use the /viewas?member= URL pattern if supported, OR set
  // the ViewAs state programmatically. Let's find the entry point.
  console.log(`[state] Dashboard loaded. Triggering ViewAs on Riley...`)

  // Trigger ViewAs programmatically via the picker.
  // Navigate to family settings or dashboard and use the picker.
  // Alt: inject into sessionStorage/localStorage if provider persists there.
  // Simplest fallback: just screenshot the dashboard, then manually trigger via
  // keyboard nav. For now, we'll check if the banner has the button by
  // opening the picker via URL query.

  // Navigate to dashboard; many apps have a "View as" option in a menu.
  // The ViewAsProvider should store state in memory. We need to trigger it.
  // For this verification, let's just check the ViewAsBanner component exists
  // with the right structure by simulating View As.

  // Workaround: hit the members endpoint, find the ViewAs picker button.
  // Look for the member picker trigger button on the dashboard.
  await page.screenshot({ path: `${OUT_DIR}/01-dashboard.png`, fullPage: false })

  // Try clicking a "View As" button if we can find one
  const viewAsBtn = await page.locator('button:has-text("View as"), button:has-text("View As")').first()
  const hasViewAsBtn = await viewAsBtn.count() > 0
  console.log(`[ui] View As button found on dashboard: ${hasViewAsBtn}`)

  if (hasViewAsBtn) {
    await viewAsBtn.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT_DIR}/02-picker-open.png` })

    // Find Riley's tile in the picker
    const rileyTile = page.locator('button:has-text("Riley"), [data-testid*="riley" i]').first()
    const hasRiley = await rileyTile.count() > 0
    console.log(`[ui] Riley tile in picker: ${hasRiley}`)

    if (hasRiley) {
      await rileyTile.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: `${OUT_DIR}/03-viewing-as-riley.png` })

      // Now look for ViewAs banner
      const banner = page.locator('[role="status"]:has-text("Viewing as")')
      const bannerText = await banner.textContent().catch(() => null)
      console.log(`[banner] text: ${bannerText}`)

      // Check for Manage Tasks button
      const manageTasksBtn = page.locator('button:has-text("Manage Tasks"), button[aria-label*="Manage"][aria-label*="tasks"]')
      const mtCount = await manageTasksBtn.count()
      console.log(`[button] Manage Tasks button count: ${mtCount}`)

      if (mtCount > 0) {
        const mtAriaLabel = await manageTasksBtn.first().getAttribute('aria-label')
        console.log(`[button] aria-label: ${mtAriaLabel}`)

        // Click it and verify navigation
        await manageTasksBtn.first().click()
        await page.waitForTimeout(2000)
        const urlAfter = page.url()
        console.log(`[nav] URL after click: ${urlAfter}`)
        await page.screenshot({ path: `${OUT_DIR}/04-tasks-page.png` })

        // Check if member filter is pre-set
        const activePill = page.locator('button:has-text("Riley")').first()
        const activeText = await activePill.textContent().catch(() => null)
        console.log(`[filter] Active member pill: ${activeText}`)
      }
    }
  }

  await browser.close()
  console.log(`\nScreenshots in ${OUT_DIR}`)
}

main().catch(e => { console.error(e); process.exit(1) })
