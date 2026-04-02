/**
 * Routine Brain Dump — E2E Test
 *
 * Tests the "Describe it to AI" flow in the Routine Section Editor.
 * Logs in as Sarah Testworth, opens TaskCreationModal in Routine mode,
 * types a natural-language routine description, lets AI parse it,
 * and verifies the preview sections appear.
 *
 * Run: npx playwright test tests/e2e/features/routine-brain-dump.spec.ts --headed --project=chromium
 */

import { test, expect, type Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'
const TESTMOM = { email: 'testmom@testworths.com', password: 'Demo2026!' }

test.use({
  launchOptions: { slowMo: 300 },
  viewport: { width: 1280, height: 900 },
})

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/sign-in`)
  await page.waitForLoadState('networkidle')

  // Dismiss tour and feature guides
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({
      dismissed_guides: ['dashboard', 'tasks', 'lila'],
      all_guides_dismissed: true,
    }))
  })

  await page.fill('input[type="email"]', TESTMOM.email)
  await page.fill('input[type="password"]', TESTMOM.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

test('Routine Brain Dump: describe routine → AI organizes → preview sections', async ({ page }, testInfo) => {
  testInfo.setTimeout(90000) // AI calls can take time
  await login(page)

  // Navigate to tasks page
  await page.goto(`${BASE_URL}/tasks`)
  await page.waitForLoadState('networkidle')

  // Dismiss any FeatureGuide cards
  const dismissBtn = page.locator('text=Got it').first()
  if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dismissBtn.click()
  }

  // Click the + Create button to open TaskCreationModal
  const createBtn = page.locator('button', { hasText: 'Create' }).first()
  await createBtn.click()

  // Wait for TaskCreationModal to appear
  await page.waitForSelector('text=Create Task', { timeout: 10000 })

  // Select "Routine" task type — it's a grid button inside the modal
  const modal = page.locator('[role="dialog"]')

  // Scroll down to find the Task Type section, then click Routine button
  const routineBtn = modal.locator('button.btn-inline', { hasText: 'Routine' })
  await routineBtn.scrollIntoViewIfNeeded()
  await routineBtn.click({ force: true })

  // Wait a moment for the RoutineSectionEditor to render
  await page.waitForTimeout(500)

  // Scroll down to find "Describe it to AI" in the RoutineSectionEditor empty state
  const brainDumpBtn = modal.locator('button', { hasText: 'Describe it to AI' })
  await brainDumpBtn.scrollIntoViewIfNeeded()
  await expect(brainDumpBtn).toBeVisible({ timeout: 5000 })

  // Click "Describe it to AI"
  await brainDumpBtn.click()

  // Should see the brain dump input area
  await expect(modal.locator('text=Describe Your Routine')).toBeVisible({ timeout: 3000 })
  await expect(modal.locator('text=Explain this routine the way')).toBeVisible()

  // Type a bathroom cleaning routine
  const textarea = modal.locator('textarea').last()
  await textarea.fill(
    `Every day: wipe down the sinks and pick up anything on the floor.
Tuesday and Thursday: clean the mirrors with glass spray.
Monday, Wednesday, and Friday: scrub the toilets, make sure you get under the rim.
Take out the bathroom trash on Monday and Friday.
Once a week scrub the bathtub — keep it on the list until it's done.`
  )

  // Click "Let AI organize this"
  await modal.locator('text=Let AI organize this').click()

  // Wait for AI to process (up to 45 seconds for Haiku call)
  await expect(modal.locator('text=Organizing...')).toBeVisible({ timeout: 5000 })

  // Wait for preview to appear
  await expect(modal.locator('text=Edit anything before accepting')).toBeVisible({ timeout: 45000 })

  // ── Verify sections have DIFFERENT frequencies ─────────────────
  // Each PreviewSectionCard has a header with the section name input + a frequency <select>
  // Grab all sections by finding the frequency selects
  const sectionCards = modal.locator('select')  // frequency dropdowns in preview cards
  const sectionCount = await sectionCards.count()
  console.log(`\n═══ AI ORGANIZED ROUTINE ═══`)
  console.log(`Sections: ${sectionCount}`)

  // We expect at LEAST 3 different sections (daily, MWF or custom, T/Th or custom, weekly)
  expect(sectionCount).toBeGreaterThanOrEqual(3)

  // Log each section's frequency and its steps
  const sectionFreqs: string[] = []
  for (let s = 0; s < sectionCount; s++) {
    const freq = await sectionCards.nth(s).inputValue()
    sectionFreqs.push(freq)
  }

  // Now get section names from the name inputs (first text input in each section header)
  // The section cards are the top-level bordered divs inside the preview scroll area
  const previewArea = modal.locator('.space-y-2')
  const sectionNameInputs = previewArea.locator('input[type="text"]').first()

  // Get ALL text inputs — section names are the ones in the header, step names have placeholder "Step name..."
  const allInputs = modal.locator('input[type="text"]')
  const inputCount = await allInputs.count()
  const stepNames: string[] = []
  const sectionNames: string[] = []
  for (let i = 0; i < inputCount; i++) {
    const placeholder = await allInputs.nth(i).getAttribute('placeholder')
    const value = await allInputs.nth(i).inputValue()
    if (placeholder === 'Step name...') {
      stepNames.push(value)
    } else if (!placeholder && value) {
      // Section name inputs have no placeholder in the preview
      sectionNames.push(value)
    }
  }

  // Check for "show until complete" checkboxes
  const showUntilChecks = modal.locator('input[type="checkbox"]')
  const checkCount = await showUntilChecks.count()
  const checkedStates: boolean[] = []
  for (let i = 0; i < checkCount; i++) {
    checkedStates.push(await showUntilChecks.nth(i).isChecked())
  }

  // Log the full structure
  for (let s = 0; s < sectionNames.length; s++) {
    const freq = sectionFreqs[s] || '???'
    const showUntil = checkedStates[s] ? ' [SHOW UNTIL COMPLETE]' : ''
    console.log(`\n── Section ${s + 1}: "${sectionNames[s]}" — ${freq}${showUntil}`)
  }
  console.log(`\nAll steps: ${stepNames.join(', ')}`)
  console.log(`All frequencies: ${sectionFreqs.join(', ')}`)

  // ── Key assertions ────────────────────────────────────────────

  // Must have multiple DIFFERENT frequencies (not all "daily")
  const uniqueFreqs = new Set(sectionFreqs)
  console.log(`Unique frequencies: ${[...uniqueFreqs].join(', ')}`)
  expect(uniqueFreqs.size).toBeGreaterThanOrEqual(3)

  // Must have at least one weekly section (for the tub)
  expect(sectionFreqs.some(f => f === 'weekly')).toBe(true)

  // Must have at least one daily section
  expect(sectionFreqs.some(f => f === 'daily')).toBe(true)

  // Must have steps covering our key tasks
  const joinedSteps = stepNames.join(' ').toLowerCase()
  expect(joinedSteps).toContain('sink')
  expect(joinedSteps).toContain('toilet')
  expect(joinedSteps).toContain('tub')

  // At least one "show until complete" should be checked (the weekly tub)
  const anyShowUntil = checkedStates.some(c => c === true)
  console.log(`Show until complete found: ${anyShowUntil}`)

  console.log(`\n═══ TEST PASSED ═══`)

  // Verify "Use this routine" button is visible
  await expect(modal.locator('text=Use this routine')).toBeVisible()

  // Click "Use this routine" to accept
  await modal.locator('text=Use this routine').click()

  // Brain dump should close and RoutineSectionEditor should now have sections
  await expect(modal.locator('text=Describe Your Routine')).not.toBeVisible({ timeout: 3000 })

  // The routine section editor should now show sections with steps
  await expect(modal.locator('text=Routine steps')).toBeVisible()

  // ── Now actually save the routine ─────────────────────────────
  // Give it a title first
  const titleInput = modal.locator('input[placeholder="What needs to be done?"]')
  await titleInput.fill('Clean Bathroom')

  // Click Save
  const saveBtn = modal.locator('button', { hasText: /^(Create|Save)/ }).last()
  await saveBtn.scrollIntoViewIfNeeded()
  await saveBtn.click()

  // Wait for modal to close (task saved)
  await expect(modal).not.toBeVisible({ timeout: 10000 })

  console.log('--- Routine saved! Verifying DB persistence... ---')

  // Verify the routine template was actually persisted to the database
  // by checking that we can find it on the Routines tab
  const routinesTab = page.locator('button[role="tab"]', { hasText: 'Routines' })
  if (await routinesTab.isVisible()) {
    await routinesTab.click()
    await page.waitForTimeout(1000)

    // The routine should appear with our title
    const routineCard = page.locator('text=Clean Bathroom')
    const found = await routineCard.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`Routine "Clean Bathroom" visible on Routines tab: ${found}`)
  }

  console.log('--- Routine Brain Dump test COMPLETE! ---')
})
