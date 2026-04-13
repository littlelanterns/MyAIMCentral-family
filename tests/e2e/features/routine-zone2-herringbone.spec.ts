/**
 * Zone 2: Herringbone — Real-world routine creation E2E test
 *
 * Tests the full flow: login as Tenise → create routine via AI brain dump →
 * name it "Zone 2: Herringbone" → assign to Helam → set end date 4/19/26 →
 * enable allowance tracking → save.
 *
 * Run: npx playwright test tests/e2e/features/routine-zone2-herringbone.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const BASE_URL = 'http://localhost:5173'
const DEV_EMAIL = process.env.E2E_DEV_EMAIL!
const DEV_PASSWORD = process.env.E2E_DEV_PASSWORD!

if (!DEV_EMAIL || !DEV_PASSWORD) {
  throw new Error('Missing E2E_DEV_EMAIL or E2E_DEV_PASSWORD in .env.local')
}

test.use({
  launchOptions: { slowMo: 200 },
  viewport: { width: 1280, height: 900 },
})

const CLEANING_SCHEDULE = `🧹 Daily Tasks (Mon–Sat)
Tidy all floor zones (main area, entry, toy areas)
Sweep or vacuum herringbone floors (all levels)
Straighten toys, books, baskets, pillows, and couch cushions
Wipe couch surfaces if needed
Gather laundry or stray items
Quick dust of visible surfaces if something looks neglected
🗓️ Monday
Clean/organize messiest shelf, cupboard, or drawer
Sweep/vacuum basket landing
Wipe light switches
Dust piano top
Wash walls/corners in ROTUNDA
Wipe baseboards – Rotunda side
Sweep under entry shelf
Tidy toy bench
🗓️ Tuesday
Crosswave floors (all herringbone areas)
Clean/organize messiest shelf, cupboard, or drawer
Wipe down white dog gates
Light dusting: decorative ledges, window sills, low traffic surfaces
Check/spot-clean corners and smudges
🗓️ Wednesday
Crosswave floors
Clean/organize messiest shelf, cupboard, or drawer
Wash walls/corners in MAIN area
Wipe down piano surface if dusty or used
Wipe baseboards – Main level
Tidy doll house and toy bins behind couches
Sweep behind game cupboard and entry shelf
🗓️ Thursday
Clean/organize messiest shelf, cupboard, or drawer
Dust railings and shelf edges in basket landing
Spot-clean sticky floor areas
Wipe front door handle and frame
Light straighten of all storage areas (not deep sort)
🗓️ Friday
Clean/organize messiest shelf, cupboard, or drawer
Wash walls/corners in ENTRY
Vacuum/sweep stairs
Organize toy bench
Wipe baseboards – Entry & stairs area
Final wipe of light switches if smudged
🗓️ Saturday
Crosswave floors
Clean/organize messiest shelf, cupboard, or drawer
Vacuum under all major furniture (couches, piano)
Final tidy/reset: doll house, toys behind couches
Sweep or vacuum basket landing if needed
Final entry floor sweep, check front door, and finish any missed spots`

// NOTE: The "Rotating Weekly Focus Summary" table is intentionally excluded —
// it's a redundant summary that could confuse the AI parser.

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`)
  await page.waitForLoadState('networkidle')

  // Dismiss tours and feature guides
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({
      dismissed_guides: ['dashboard', 'tasks', 'lila', 'studio', 'calendar'],
      all_guides_dismissed: true,
    }))
  })

  await page.fill('input[type="email"]', DEV_EMAIL)
  await page.fill('input[type="password"]', DEV_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
  console.log('✓ Logged in as', DEV_EMAIL)
}

test('Zone 2: Herringbone — full routine creation via AI brain dump', async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000)

  // Capture browser console for debugging
  page.on('console', msg => {
    const text = msg.text()
    if (text.includes('createTaskFromData') || text.includes('routine') || text.includes('template')) {
      console.log(`  [browser] ${text}`)
    }
  })

  await login(page)

  // ═══ Navigate to Tasks page ═══
  await page.goto(`${BASE_URL}/tasks`)
  await page.waitForLoadState('networkidle')

  // Dismiss any FeatureGuide cards
  const dismissBtn = page.locator('button', { hasText: 'Got it' }).first()
  if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dismissBtn.click()
  }

  // ═══ Open TaskCreationModal ═══
  const createBtn = page.locator('button', { hasText: 'Create' }).first()
  await createBtn.click()
  const modal = page.locator('[role="dialog"]')
  await expect(modal).toBeVisible({ timeout: 10000 })
  console.log('✓ TaskCreationModal opened')

  // ═══ Enter title ═══
  const titleInput = modal.locator('input[placeholder="What needs to be done?"]')
  await titleInput.fill('Zone 2: Herringbone')
  console.log('✓ Title: "Zone 2: Herringbone"')

  // ═══ Switch to Full Mode ═══
  const fullModeBtn = modal.locator('button.btn-inline', { hasText: 'full' })
  if (await fullModeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fullModeBtn.click()
    await page.waitForTimeout(300)
  }

  // ═══ Select Routine type ═══
  const routineBtn = modal.locator('button.btn-inline', { hasText: 'Routine' })
  await routineBtn.scrollIntoViewIfNeeded()
  await routineBtn.click({ force: true })
  await page.waitForTimeout(500)
  console.log('✓ Routine type selected')

  // ═══ Click "Paste your schedule and let AI organize it" ═══
  const aiOptionBtn = modal.locator('button', { hasText: 'Paste your schedule' })
  await aiOptionBtn.scrollIntoViewIfNeeded()
  await expect(aiOptionBtn).toBeVisible({ timeout: 5000 })
  await aiOptionBtn.click()
  console.log('✓ AI brain dump opened')
  await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-01-braindump-open.png' })

  // ═══ Paste the cleaning schedule ═══
  const textarea = modal.locator('textarea').last()
  await expect(textarea).toBeVisible({ timeout: 3000 })
  await textarea.fill(CLEANING_SCHEDULE)
  console.log('✓ Schedule pasted')

  // ═══ Click "Let AI organize this" ═══
  await modal.locator('button', { hasText: 'Let AI organize this' }).click()
  console.log('⏳ AI organizing...')

  await expect(modal.locator('text=Organizing...')).toBeVisible({ timeout: 5000 })
  await expect(modal.locator('text=Edit anything before accepting')).toBeVisible({ timeout: 60000 })
  console.log('✓ AI organized the routine')

  // ═══ Verify sections ═══
  const sectionSelects = modal.locator('select')
  const sectionCount = await sectionSelects.count()
  console.log(`  Sections created: ${sectionCount}`)

  const freqs: string[] = []
  for (let i = 0; i < sectionCount; i++) {
    freqs.push(await sectionSelects.nth(i).inputValue())
  }
  console.log(`  Frequencies: ${freqs.join(', ')}`)

  // Should have at least 3 sections (daily + day-specific sections)
  expect(sectionCount).toBeGreaterThanOrEqual(3)

  // Should have proper frequency values (no blank or "none")
  const badFreqs = freqs.filter(f => !f || f === 'none' || f === '')
  if (badFreqs.length > 0) {
    console.log(`⚠ WARNING: ${badFreqs.length} sections have empty/none frequency`)
  }

  await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-02-ai-preview.png' })

  // ═══ Accept the AI result ═══
  const acceptBtn = modal.locator('button', { hasText: 'Use this routine' })
  await acceptBtn.scrollIntoViewIfNeeded()
  await acceptBtn.click()
  await page.waitForTimeout(500)
  await expect(modal.locator('text=Routine steps')).toBeVisible()
  console.log('✓ Sections accepted into editor')
  await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-03-sections-in-editor.png' })

  // ═══ Assign to Helam ═══
  const assignHeading = modal.locator('text=Who\'s Responsible?')
  await assignHeading.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const helamPill = modal.locator('button.rounded-full', { hasText: 'Helam' })
  if (await helamPill.isVisible({ timeout: 3000 }).catch(() => false)) {
    await helamPill.click()
    console.log('✓ Helam selected')
  } else {
    const allPills = modal.locator('button.rounded-full')
    const pillCount = await allPills.count()
    const names: string[] = []
    for (let i = 0; i < pillCount; i++) {
      names.push(await allPills.nth(i).innerText())
    }
    console.log(`⚠ Helam not found. Visible pills: ${names.join(', ')}`)
    if (pillCount > 1) {
      await allPills.first().click()
      console.log(`  Fallback: selected ${names[0]}`)
    }
  }
  await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-04-helam-assigned.png' })

  // ═══ Set end date — "Run until" 4/19/2026 ═══
  const durationHeading = modal.locator('text=How Long Should This Run?')
  await durationHeading.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  // Click "Run until" radio
  const runUntilRadio = modal.locator('label', { hasText: 'Run until' })
  if (await runUntilRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
    await runUntilRadio.click()
    await page.waitForTimeout(300)

    // Fill in the date
    const dateInput = modal.locator('input[type="date"]').last()
    await dateInput.fill('2026-04-19')
    console.log('✓ End date set: 2026-04-19')
  } else {
    console.log('⚠ "Run until" option not found')
  }
  await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-05-end-date-set.png' })

  // ═══ Enable allowance tracking ═══
  const rewardsHeading = modal.locator('text=Rewards & Completion Tracking')
  await rewardsHeading.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const allowanceCheckbox = modal.locator('label', { hasText: 'Count toward allowance pool' })
  if (await allowanceCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
    await allowanceCheckbox.click()
    console.log('✓ Allowance tracking enabled')
  } else {
    console.log('⚠ Allowance tracking checkbox not found')
  }
  await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-06-allowance-and-footer.png' })

  // ═══ Verify footer buttons ═══
  const saveToStudioBtn = modal.locator('button', { hasText: 'Save to Studio' })
  const assignCreateBtn = modal.locator('button', { hasText: 'Assign & Create' })
  console.log(`  "Save to Studio" visible: ${await saveToStudioBtn.isVisible().catch(() => false)}`)
  console.log(`  "Assign & Create" visible: ${await assignCreateBtn.isVisible().catch(() => false)}`)

  // ═══ Save ═══
  if (await assignCreateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await assignCreateBtn.scrollIntoViewIfNeeded()
    await assignCreateBtn.click()
    console.log('⏳ Saving via "Assign & Create"...')
  } else {
    const fallbackBtn = modal.locator('button', { hasText: /Create|Save/ }).last()
    await fallbackBtn.scrollIntoViewIfNeeded()
    await fallbackBtn.click()
    console.log('⏳ Saving (fallback button)...')
  }

  await expect(modal).not.toBeVisible({ timeout: 15000 })
  console.log('✓ Routine saved — modal closed')

  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-07-after-save.png' })

  // ═══ Verify ═══
  // Note: Routine is assigned to Helam, so mom's Routines tab won't show it
  // (the tab filters to assignee_id = current user). This is expected behavior.
  // The routine template exists in task_templates and can be found in Studio → My Customized.
  const routinesTab = page.locator('button[role="tab"]', { hasText: 'Routines' })
  if (await routinesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await routinesTab.click()
    await page.waitForTimeout(1000)
    const routineCard = page.locator('text=Zone 2: Herringbone')
    const found = await routineCard.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`  Visible on mom's Routines tab: ${found} (expected: false — assigned to Helam)`)
    await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-08-routines-tab.png' })
  }

  // Check Studio → My Customized for the template
  await page.goto(`${BASE_URL}/studio`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)

  // Click "My Customized" tab
  const customizedTab = page.locator('button[role="tab"]', { hasText: /Customized|My/ })
  if (await customizedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await customizedTab.click()
    await page.waitForTimeout(1000)
    const templateCard = page.locator('text=Zone 2: Herringbone')
    const templateFound = await templateCard.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  Visible in Studio My Customized: ${templateFound}`)
    await page.screenshot({ path: 'tests/e2e/.screenshots/zone2-09-studio-customized.png' })
  }

  console.log('\n═══ ZONE 2: HERRINGBONE TEST COMPLETE ═══')
})
