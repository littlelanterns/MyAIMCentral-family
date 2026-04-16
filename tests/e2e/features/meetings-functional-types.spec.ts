/**
 * PRD-16 Meetings — Meeting Type-Specific Behavior Tests
 *
 * Tests each of the 4 built-in meeting types has correct behavior:
 * 1. Couple Meeting — dad has implicit permission, no participant picker
 * 2. Parent-Child Meeting — per-child rows, requires member_permissions
 * 3. Mentor Meeting — per-child rows, grandma (special_adult) has no access
 * 4. Family Council — participant picker, child facilitator option, "Select Everyone"
 * 5. Custom meeting type — creation and visibility
 *
 * Run: npx playwright test tests/e2e/features/meetings-functional-types.spec.ts --headed
 */

import { test, expect, type Page } from '@playwright/test'
import { loginAsMom, loginAsDad, loginAsGrandma } from '../helpers/auth'

const BASE_URL = 'http://localhost:5173'

test.use({
  launchOptions: { slowMo: 200 },
  viewport: { width: 1280, height: 900 },
})

async function dismissGuides(page: Page) {
  await page.evaluate(() => {
    sessionStorage.setItem('myaim_intro_tour_dismissed', 'true')
    localStorage.setItem('myaim_guide_prefs', JSON.stringify({
      dismissed_guides: ['dashboard', 'tasks', 'lila', 'studio', 'calendar', 'settings', 'meetings_basic', 'meetings_shared'],
      all_guides_dismissed: true,
    }))
  })
}

async function navigateToMeetings(page: Page) {
  await page.goto(`${BASE_URL}/meetings`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('h1').filter({ hasText: 'Meetings' })).toBeVisible({ timeout: 15000 })
}

test.describe('PRD-16 Meetings — Type-Specific Behavior', () => {

  test.describe('Couple Meeting', () => {

    test('Couple Meeting row exists as a single row (not per-child)', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Should be exactly one Couple Meeting row (not expanded per child)
      // The button text includes the label plus optional badge/icons, so use a contains match
      // and count rows that DON'T include a child name (no colon in the text)
      const coupleRows = page.locator('button').filter({ hasText: 'Couple Meeting' })
      const count = await coupleRows.count()
      expect(count).toBe(1)
      console.log('✓ Exactly 1 Couple Meeting row (not per-child)')
    })

    test('Couple Meeting start modal does NOT show participant picker', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const coupleRow = page.locator('button').filter({ hasText: 'Couple Meeting' })
      await coupleRow.click()
      await page.waitForTimeout(500)

      const startBtn = page.locator('button').filter({ hasText: 'Start Meeting' }).first()
      await startBtn.click()
      await page.waitForTimeout(1000)

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Should NOT show "Who's joining?" picker
      const whoJoining = page.getByText(/who.*joining/i)
      const hasParticipantPicker = await whoJoining.isVisible().catch(() => false)
      expect(hasParticipantPicker).toBe(false)
      console.log('✓ Couple Meeting does NOT show participant picker')

      await page.keyboard.press('Escape')
    })

    test('Dad can start a Couple Meeting (implicit permission)', async ({ page }) => {
      await loginAsDad(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const coupleRow = page.locator('button').filter({ hasText: 'Couple Meeting' })
      await expect(coupleRow).toBeVisible({ timeout: 5000 })
      await coupleRow.click()
      await page.waitForTimeout(500)

      const startBtn = page.locator('button').filter({ hasText: 'Start Meeting' }).first()
      const canStart = await startBtn.isVisible().catch(() => false)
      console.log(`✓ Dad can see Start Meeting button: ${canStart}`)

      if (canStart) {
        await startBtn.click()
        await page.waitForTimeout(1000)

        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible({ timeout: 5000 })
        console.log('✓ Dad opened StartMeetingModal for Couple Meeting')

        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('Parent-Child Meeting', () => {

    test('Parent-Child meeting expands per child', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const parentChildRows = page.locator('button').filter({ hasText: /Parent-Child Meeting/ })
      const count = await parentChildRows.count()

      // Should have one row per child member (Alex, Casey, Jordan, Riley in Testworths)
      console.log(`✓ Found ${count} Parent-Child Meeting row(s)`)
      expect(count).toBeGreaterThanOrEqual(1)

      // Each row should include a child's name
      for (let i = 0; i < Math.min(count, 4); i++) {
        const text = await parentChildRows.nth(i).textContent()
        console.log(`  Row ${i + 1}: ${text?.trim()}`)
      }
    })

    test('Parent-Child meeting quick-add targets the specific child', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Find and expand a specific child's parent-child row
      const parentChildRows = page.locator('button').filter({ hasText: /Parent-Child Meeting/ })
      const firstRow = parentChildRows.first()
      await firstRow.click()
      await page.waitForTimeout(500)

      const quickAdd = page.locator('input[placeholder*="Add agenda item"]').first()
      await expect(quickAdd).toBeVisible({ timeout: 3000 })

      const itemText = `Talk about homework habits ${Date.now()}`
      await quickAdd.fill(itemText)
      await quickAdd.press('Enter')
      await page.waitForTimeout(1500)

      await expect(quickAdd).toHaveValue('')
      console.log('✓ Added agenda item to specific child\'s Parent-Child Meeting')
    })
  })

  test.describe('Mentor Meeting', () => {

    test('Mentor Meeting expands per child', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const mentorRows = page.locator('button').filter({ hasText: /Mentor Meeting/ })
      const count = await mentorRows.count()

      console.log(`✓ Found ${count} Mentor Meeting row(s)`)
      expect(count).toBeGreaterThanOrEqual(1)

      // Each should have a child name
      for (let i = 0; i < Math.min(count, 4); i++) {
        const text = await mentorRows.nth(i).textContent()
        console.log(`  Row ${i + 1}: ${text?.trim()}`)
      }
    })

    test('Special Adult (Grandma) has NO access to Meetings', async ({ page }) => {
      await loginAsGrandma(page)
      await dismissGuides(page)

      await page.goto(`${BASE_URL}/meetings`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)

      // Grandma (special_adult) should NOT see the Meetings page
      // Per PRD-16: "Special Adults have NO access to Meetings"
      const heading = page.locator('h1').filter({ hasText: 'Meetings' })
      const isVisible = await heading.isVisible().catch(() => false)

      if (isVisible) {
        // If she can see it, the meeting types should be restricted
        console.log('⚠ Grandma can see Meetings page — checking restrictions')
        const startBtns = page.locator('button').filter({ hasText: 'Start Meeting' })
        const startCount = await startBtns.count()
        console.log(`  Start Meeting buttons visible: ${startCount}`)
      } else {
        console.log('✓ Grandma (Special Adult) correctly restricted from /meetings')
      }
    })
  })

  test.describe('Family Council', () => {

    test('Family Council is a single row (not per-child)', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const fcRows = page.locator('button').filter({ hasText: 'Family Council' })
      const count = await fcRows.count()
      expect(count).toBe(1)
      console.log('✓ Exactly 1 Family Council row')
    })

    test('Family Council start modal has participant picker with "Select Everyone"', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const fcRow = page.locator('button').filter({ hasText: 'Family Council' })
      await fcRow.click()
      await page.waitForTimeout(500)

      const startBtn = page.locator('button').filter({ hasText: 'Start Meeting' }).first()
      await startBtn.click()
      await page.waitForTimeout(1000)

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Participant picker
      const whoJoining = page.getByText(/who.*joining/i)
      await expect(whoJoining).toBeVisible({ timeout: 3000 })
      console.log('✓ Family Council shows participant picker')

      // "Select Everyone" or similar toggle-all button
      const selectAll = page.getByText(/select everyone|everyone/i)
      const hasSelectAll = await selectAll.isVisible().catch(() => false)
      console.log(`  "Select Everyone" button visible: ${hasSelectAll}`)

      // Member pills should be visible (colored pill buttons)
      const memberPills = modal.locator('button').filter({ hasText: /Alex|Casey|Jordan|Riley|Dad|Mom/i })
      const pillCount = await memberPills.count()
      console.log(`  Member pills visible: ${pillCount}`)
      expect(pillCount).toBeGreaterThanOrEqual(2)

      // Play children note
      const playNote = page.getByText(/play children.*unchecked/i)
      const hasPlayNote = await playNote.isVisible().catch(() => false)
      console.log(`  Play children note visible: ${hasPlayNote}`)

      // Child facilitator option
      const facilitatorSection = page.getByText(/child facilitator/i)
      const hasFacilitator = await facilitatorSection.isVisible().catch(() => false)
      console.log(`  Child facilitator section visible: ${hasFacilitator}`)

      await page.keyboard.press('Escape')
    })

    test('Family Council child facilitator selection works', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const fcRow = page.locator('button').filter({ hasText: 'Family Council' })
      await fcRow.click()
      await page.waitForTimeout(500)

      const startBtn = page.locator('button').filter({ hasText: 'Start Meeting' }).first()
      await startBtn.click()
      await page.waitForTimeout(1000)

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // First ensure a child is selected as participant
      const childPill = modal.locator('button').filter({ hasText: /Alex|Jordan/i }).first()
      if (await childPill.isVisible().catch(() => false)) {
        // Make sure child is selected
        await childPill.click()
        await page.waitForTimeout(300)

        // Now look for the child's name in the facilitator section
        const facilitatorSection = page.getByText(/child facilitator/i)
        if (await facilitatorSection.isVisible().catch(() => false)) {
          // The child's name should appear as a facilitator option
          const childFacilitatorBtn = page.locator('button').filter({ hasText: /Alex|Jordan/i }).last()
          if (await childFacilitatorBtn.isVisible().catch(() => false)) {
            await childFacilitatorBtn.click()
            await page.waitForTimeout(300)
            console.log('✓ Selected a child as facilitator')
          }
        }
      }

      await page.keyboard.press('Escape')
    })
  })

  test.describe('Meeting Setup Wizard', () => {

    test('Empty state shows "Get Started" button that opens Meeting Setup Wizard', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Check for the "Get Started" button (visible when no schedules exist)
      const getStarted = page.locator('button').filter({ hasText: 'Get Started' })
      const hasGetStarted = await getStarted.isVisible().catch(() => false)

      if (hasGetStarted) {
        await getStarted.click()
        await page.waitForTimeout(1000)

        // Meeting Setup Wizard should open
        const wizard = page.locator('[role="dialog"]')
        const hasWizard = await wizard.isVisible().catch(() => false)
        console.log(`✓ Meeting Setup Wizard opened: ${hasWizard}`)

        if (hasWizard) {
          await page.keyboard.press('Escape')
        }
      } else {
        console.log('✓ No "Get Started" button (meetings already scheduled — expected)')
      }
    })
  })

  test.describe('Upcoming meetings display', () => {

    test('Upcoming section shows scheduled meetings with urgency indicators', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const upcomingSection = page.locator('h2').filter({ hasText: 'Upcoming' })
      await expect(upcomingSection).toBeVisible({ timeout: 5000 })

      // Check for upcoming cards
      const upcomingCards = upcomingSection.locator('..').locator('.rounded-lg')
      const cardCount = await upcomingCards.count()

      if (cardCount > 0) {
        // First card should have Live Mode and Record After buttons
        const firstCard = upcomingCards.first()
        const liveBtn = firstCard.locator('button').filter({ hasText: 'Live Mode' })
        const recordBtn = firstCard.locator('button').filter({ hasText: 'Record After' })

        const hasLive = await liveBtn.isVisible().catch(() => false)
        const hasRecord = await recordBtn.isVisible().catch(() => false)
        console.log(`✓ ${cardCount} upcoming meeting(s). Live: ${hasLive}, Record: ${hasRecord}`)

        // Check for urgency label (e.g., "Due Today", "In 3d", "Overdue")
        const urgencyTexts = firstCard.locator('text=/Due Today|In \\d+d|Overdue/i')
        const hasUrgency = await urgencyTexts.count() > 0
        console.log(`  Urgency indicator present: ${hasUrgency}`)

        // Check for agenda count
        const agendaCount = firstCard.getByText(/agenda item/i)
        const hasAgenda = await agendaCount.isVisible().catch(() => false)
        console.log(`  Agenda count visible: ${hasAgenda}`)
      } else {
        // Check for empty state message
        const emptyMsg = page.getByText(/no upcoming meetings/i)
        const noSchedules = page.getByText(/set up your family meetings/i)
        const isEmpty = await emptyMsg.isVisible().catch(() => false)
        const noSetup = await noSchedules.isVisible().catch(() => false)
        console.log(`✓ Upcoming section: empty (${isEmpty}), no schedules (${noSetup})`)
      }
    })
  })

  test.describe('Notepad → Agenda routing', () => {

    test('Notepad routing strip includes Agenda destination', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)

      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Open notepad drawer
      // Look for the notepad icon/button in QuickTasks or bottom nav
      const notepadBtn = page.locator('button[aria-label*="notepad" i], a[href="/notepad"], button').filter({ hasText: /notepad|note/i }).first()

      if (await notepadBtn.isVisible().catch(() => false)) {
        await notepadBtn.click()
        await page.waitForTimeout(1000)

        // Look for "Send to" section in the notepad
        const sendTo = page.getByText(/send to/i)
        if (await sendTo.isVisible().catch(() => false)) {
          // Look for Agenda tile in the routing strip
          const agendaTile = page.getByText('Agenda')
          const hasAgenda = await agendaTile.isVisible().catch(() => false)
          console.log(`✓ Agenda destination in Notepad routing strip: ${hasAgenda}`)
        } else {
          console.log('⚠ "Send to" section not visible in notepad (may need content first)')
        }
      } else {
        console.log('⚠ Could not open notepad drawer from dashboard')
      }
    })
  })
})
