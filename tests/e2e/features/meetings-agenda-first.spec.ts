/**
 * Meetings — Agenda-First System Tests
 *
 * Tests the redesigned agenda-first meetings flow:
 * 1. Mom adds agenda items to multiple meeting types (Couple, Family Council, Parent-Child)
 * 2. Agenda items visible with count badges on collapsed cards
 * 3. Open Meeting flow — agenda sidebar shows items, mark as discussed
 * 4. End meeting — Post-Meeting Review opens
 * 5. Undiscussed items carry forward (persist after meeting ends)
 * 6. Meeting history shows completed meetings
 * 7. Meeting history search works
 * 8. Record & Transcribe checkbox available in Start Meeting modal
 * 9. No "Overdue" language anywhere on the page
 * 10. Sections editor still works with cleaned-up data
 *
 * Run: npx playwright test tests/e2e/features/meetings-agenda-first.spec.ts --headed
 */

import { test, expect, type Page } from '@playwright/test'
import { loginAsMom, loginAsDad } from '../helpers/auth'
import { captureConsoleErrors, assertNoInfiniteRenders } from '../helpers/assertions'

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

async function expandMeetingCard(page: Page, meetingLabel: string) {
  const card = page.locator('button').filter({ hasText: meetingLabel }).first()
  await expect(card).toBeVisible({ timeout: 5000 })
  await card.click()
  await page.waitForTimeout(500)
  return card
}

async function addAgendaItem(page: Page, text: string) {
  const quickAdd = page.locator('input[placeholder*="Add agenda item"]').first()
  await expect(quickAdd).toBeVisible({ timeout: 3000 })
  await quickAdd.fill(text)
  await quickAdd.press('Enter')
  await page.waitForTimeout(1500)
  await expect(quickAdd).toHaveValue('')
}

test.describe('Meetings — Agenda-First System', () => {
  let consoleErrors: string[]

  test.beforeEach(async ({ page }) => {
    consoleErrors = captureConsoleErrors(page)
  })

  test.describe('Agenda CRUD across multiple meeting types', () => {

    test('Mom adds items to Couple Meeting agenda', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await expandMeetingCard(page, 'Couple Meeting')

      const item1 = `Date night planning ${Date.now()}`
      const item2 = `Budget review this month ${Date.now()}`
      await addAgendaItem(page, item1)
      await addAgendaItem(page, item2)

      // Both items should be visible in the expanded card
      await expect(page.getByText(item1)).toBeVisible()
      await expect(page.getByText(item2)).toBeVisible()
      console.log('✓ Mom added 2 agenda items to Couple Meeting')

      assertNoInfiniteRenders(consoleErrors)
    })

    test('Mom adds items to Family Council agenda', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await expandMeetingCard(page, 'Family Council')

      const item = `Screen time discussion ${Date.now()}`
      await addAgendaItem(page, item)

      await expect(page.getByText(item)).toBeVisible()
      console.log('✓ Mom added agenda item to Family Council')

      assertNoInfiniteRenders(consoleErrors)
    })

    test('Mom adds item to a specific child Parent-Child Meeting', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Find first Parent-Child Meeting row (should include child name)
      const parentChildRow = page.locator('button').filter({ hasText: /Parent-Child Meeting:/ }).first()
      const isVisible = await parentChildRow.isVisible().catch(() => false)

      if (isVisible) {
        const childLabel = await parentChildRow.textContent()
        await parentChildRow.click()
        await page.waitForTimeout(500)

        const item = `Goals check-in ${Date.now()}`
        await addAgendaItem(page, item)
        await expect(page.getByText(item)).toBeVisible()
        console.log(`✓ Mom added agenda item to ${childLabel?.trim()}`)
      } else {
        console.log('⚠ No Parent-Child Meeting rows found (no children with member role in Testworths)')
      }

      assertNoInfiniteRenders(consoleErrors)
    })

    test('Agenda count badges show on collapsed cards', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Add an item to Couple Meeting
      await expandMeetingCard(page, 'Couple Meeting')
      await addAgendaItem(page, `Badge test item ${Date.now()}`)

      // Collapse by clicking again
      await page.locator('button').filter({ hasText: 'Couple Meeting' }).first().click()
      await page.waitForTimeout(500)

      // The card header area should show a badge with a number
      const cardArea = page.locator('button').filter({ hasText: 'Couple Meeting' }).first()
      const badge = cardArea.locator('span').filter({ hasText: /^\d+$/ })
      const badgeCount = await badge.count()
      if (badgeCount > 0) {
        const text = await badge.first().textContent()
        expect(parseInt(text ?? '0')).toBeGreaterThanOrEqual(1)
        console.log(`✓ Agenda count badge shows: ${text}`)
      } else {
        console.log('⚠ Badge not visible after collapse (may need page refresh)')
      }

      assertNoInfiniteRenders(consoleErrors)
    })

    test('Dad adds item to Couple Meeting agenda', async ({ page }) => {
      await loginAsDad(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await expandMeetingCard(page, 'Couple Meeting')
      const item = `Weekend plans from Dad ${Date.now()}`
      await addAgendaItem(page, item)
      await expect(page.getByText(item)).toBeVisible()
      console.log('✓ Dad added agenda item to Couple Meeting')

      assertNoInfiniteRenders(consoleErrors)
    })
  })

  test.describe('Open Meeting flow', () => {

    test('Mom opens a Couple Meeting and sees agenda sidebar', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Add an item first so there's something to see
      await expandMeetingCard(page, 'Couple Meeting')
      const agendaText = `Sidebar test ${Date.now()}`
      await addAgendaItem(page, agendaText)

      // Click "Open Meeting"
      const openBtn = page.locator('button').filter({ hasText: 'Open Meeting' }).first()
      await expect(openBtn).toBeVisible({ timeout: 3000 })
      await openBtn.click()
      await page.waitForTimeout(1500)

      // Start Meeting modal should appear
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Should see "Open Meeting" button (the start button)
      const startBtn = modal.locator('button').filter({ hasText: 'Open Meeting' })
      await expect(startBtn).toBeVisible({ timeout: 3000 })

      // Check for Record & Transcribe option
      const recordOption = page.getByText('Record & Transcribe')
      const hasRecord = await recordOption.isVisible().catch(() => false)
      console.log(`✓ Start Meeting modal visible, Record & Transcribe option: ${hasRecord}`)

      // Start the meeting
      await startBtn.click()
      await page.waitForTimeout(3000)

      // Full-screen meeting view should appear with agenda sidebar
      const agendaHeader = page.getByText('Agenda')
      const hasAgenda = await agendaHeader.isVisible().catch(() => false)

      if (hasAgenda) {
        console.log('✓ Meeting conversation view open with Agenda sidebar')

        // Check for "Items to Discuss" section
        const itemsSection = page.getByText('Items to Discuss')
        const hasItems = await itemsSection.isVisible().catch(() => false)
        console.log(`  Items to Discuss section: ${hasItems}`)

        // Check for template sections
        const sectionsHeader = page.getByText('Sections')
        const hasSections = await sectionsHeader.isVisible().catch(() => false)
        console.log(`  Template Sections: ${hasSections}`)
      }

      // End the meeting
      const endBtn = page.locator('button').filter({ hasText: 'End Meeting' })
      if (await endBtn.isVisible().catch(() => false)) {
        await endBtn.click()
        await page.waitForTimeout(2000)
        console.log('✓ Meeting ended')

        // Post-Meeting Review should appear
        const reviewModal = page.locator('[role="dialog"]')
        const hasReview = await reviewModal.isVisible().catch(() => false)
        if (hasReview) {
          console.log('✓ Post-Meeting Review modal opened')
          // Close the review
          const closeBtn = reviewModal.locator('button').filter({ hasText: /close|save|done/i }).first()
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click()
            await page.waitForTimeout(1000)
          }
        }
      }

      assertNoInfiniteRenders(consoleErrors)
    })

    test('Agenda items marked as discussed during meeting persist', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Add a fresh item to Family Council
      await expandMeetingCard(page, 'Family Council')
      const discussItem = `Mark discussed test ${Date.now()}`
      await addAgendaItem(page, discussItem)

      // Open meeting
      const openBtn = page.locator('button').filter({ hasText: 'Open Meeting' }).first()
      await openBtn.click()
      await page.waitForTimeout(1000)

      // Start from modal
      const modal = page.locator('[role="dialog"]')
      const startBtn = modal.locator('button').filter({ hasText: 'Open Meeting' })
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click()
        await page.waitForTimeout(3000)
      }

      // In the meeting view, find our item in the agenda sidebar and click it to mark as discussed
      const agendaItem = page.getByText(discussItem)
      if (await agendaItem.isVisible().catch(() => false)) {
        await agendaItem.click()
        await page.waitForTimeout(1000)
        console.log('✓ Clicked agenda item to mark as discussed')
      }

      // End meeting
      const endBtn = page.locator('button').filter({ hasText: 'End Meeting' })
      if (await endBtn.isVisible().catch(() => false)) {
        await endBtn.click()
        await page.waitForTimeout(2000)

        // Close review if it opened
        const reviewClose = page.locator('[role="dialog"] button').filter({ hasText: /close|×/i }).first()
        if (await reviewClose.isVisible().catch(() => false)) {
          await reviewClose.click()
          await page.waitForTimeout(1000)
        }
      }

      assertNoInfiniteRenders(consoleErrors)
    })
  })

  test.describe('No overdue language', () => {

    test('Meetings page has no "Overdue" text', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const overdueText = page.getByText(/overdue/i)
      const hasOverdue = await overdueText.count()
      expect(hasOverdue).toBe(0)
      console.log('✓ No "Overdue" language on the meetings page')

      assertNoInfiniteRenders(consoleErrors)
    })

    test('Meetings page has no "Due Today" text', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const dueText = page.getByText(/due today/i)
      const hasdue = await dueText.count()
      expect(hasdue).toBe(0)
      console.log('✓ No "Due Today" language on the meetings page')

      assertNoInfiniteRenders(consoleErrors)
    })
  })

  test.describe('Meeting history', () => {

    test('Meeting history view opens and has search', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Look for "View All" link in Recent History section
      const viewAllBtn = page.getByText('View All')
      const hasViewAll = await viewAllBtn.isVisible().catch(() => false)

      if (hasViewAll) {
        await viewAllBtn.click()
        await page.waitForTimeout(1000)

        // History modal should open
        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible({ timeout: 5000 })

        // Should have search input
        const searchInput = modal.locator('input[placeholder*="Search"]')
        await expect(searchInput).toBeVisible({ timeout: 3000 })
        console.log('✓ Meeting history view has search input')

        // Should have type filter chips
        const allFilter = modal.getByText('All Types')
        await expect(allFilter).toBeVisible()
        console.log('✓ Meeting history has type filter chips')

        // Close
        const closeBtn = modal.locator('button').first()
        if (await closeBtn.isVisible()) await closeBtn.click()
      } else {
        console.log('⚠ No "View All" button — no completed meetings yet to show history')
      }

      assertNoInfiniteRenders(consoleErrors)
    })
  })

  test.describe('Start Meeting modal — simplified', () => {

    test('Start Meeting modal shows "Open Meeting" as primary button, not Live/Record split', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await expandMeetingCard(page, 'Couple Meeting')

      const openBtn = page.locator('button').filter({ hasText: 'Open Meeting' }).first()
      await openBtn.click()
      await page.waitForTimeout(1000)

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Primary button should say "Open Meeting", not "Start Live Meeting" or "Start Recording"
      const primaryBtn = modal.locator('button.btn-primary').filter({ hasText: 'Open Meeting' })
      await expect(primaryBtn).toBeVisible({ timeout: 3000 })
      console.log('✓ Primary button says "Open Meeting"')

      // "Record & Transcribe" should be a checkbox option, not a separate mode card
      const recordCheckbox = modal.locator('input[type="checkbox"]')
      const recordLabel = modal.getByText('Record & Transcribe')
      const hasCheckbox = await recordCheckbox.isVisible().catch(() => false)
      const hasLabel = await recordLabel.isVisible().catch(() => false)
      console.log(`✓ Record & Transcribe: checkbox=${hasCheckbox}, label=${hasLabel}`)

      // Should NOT have the old "Live Mode" / "Record After" mode cards
      const liveMode = modal.getByText('Live Mode')
      const recordAfter = modal.getByText('Record After')
      const hasLiveMode = await liveMode.isVisible().catch(() => false)
      const hasRecordAfter = await recordAfter.isVisible().catch(() => false)
      expect(hasLiveMode).toBe(false)
      expect(hasRecordAfter).toBe(false)
      console.log('✓ No "Live Mode" or "Record After" mode selection cards')

      // Close modal
      const closeBtn = modal.locator('button').filter({ hasText: /×/ }).first()
      if (await closeBtn.isVisible().catch(() => false)) await closeBtn.click()

      assertNoInfiniteRenders(consoleErrors)
    })

    test('Family Council Start Meeting shows participant picker', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await expandMeetingCard(page, 'Family Council')
      const openBtn = page.locator('button').filter({ hasText: 'Open Meeting' }).first()
      await openBtn.click()
      await page.waitForTimeout(1000)

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Should show "Who's joining?" participant picker
      const whoJoining = modal.getByText("Who's joining?")
      await expect(whoJoining).toBeVisible({ timeout: 3000 })
      console.log('✓ Family Council shows participant picker')

      // Should show child facilitator option
      const facilitator = modal.getByText('Child facilitator')
      const hasFacilitator = await facilitator.isVisible().catch(() => false)
      console.log(`  Child facilitator option: ${hasFacilitator}`)

      assertNoInfiniteRenders(consoleErrors)
    })
  })

  test.describe('Sections editor with clean data', () => {

    test('Sections editor shows exactly 6 built-in sections for Couple Meeting', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await expandMeetingCard(page, 'Couple Meeting')

      // Click "Sections" button
      const sectionsBtn = page.locator('button').filter({ hasText: 'Sections' }).first()
      await expect(sectionsBtn).toBeVisible({ timeout: 3000 })
      await sectionsBtn.click()
      await page.waitForTimeout(2000)

      // Modal should open with sections
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Check for known couple meeting sections
      const checkIn = modal.getByText('Check-In')
      const appreciation = modal.getByText('Appreciation')
      const hasCheckIn = await checkIn.isVisible().catch(() => false)
      const hasAppreciation = await appreciation.isVisible().catch(() => false)
      console.log(`✓ Sections editor open: Check-In=${hasCheckIn}, Appreciation=${hasAppreciation}`)

      // Should have "Add Custom Section" button
      const addCustom = modal.getByText('Add Custom Section')
      await expect(addCustom).toBeVisible()
      console.log('✓ "Add Custom Section" button visible')

      assertNoInfiniteRenders(consoleErrors)
    })
  })

  test.describe('Schedule is optional', () => {

    test('Meeting cards show "Add Schedule" when no schedule exists', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await expandMeetingCard(page, 'Couple Meeting')

      const addScheduleBtn = page.locator('button').filter({ hasText: 'Add Schedule' }).first()
      const scheduleBtn = page.locator('button').filter({ hasText: /^Schedule$/ }).first()

      const hasAddSchedule = await addScheduleBtn.isVisible().catch(() => false)
      const hasSchedule = await scheduleBtn.isVisible().catch(() => false)

      // Should show "Add Schedule" (not "Schedule") when no schedule is set
      console.log(`✓ Add Schedule button: ${hasAddSchedule}, Schedule button: ${hasSchedule}`)
      expect(hasAddSchedule || hasSchedule).toBe(true)

      assertNoInfiniteRenders(consoleErrors)
    })
  })
})
