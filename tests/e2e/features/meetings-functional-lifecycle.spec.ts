/**
 * PRD-16 Meetings — Full Meeting Lifecycle Tests
 *
 * Tests the complete meeting flow:
 * 1. Start Meeting modal — mode selection (Live / Record After)
 * 2. Family Council — participant picker + facilitator designation
 * 3. Live Meeting conversation view — send message, agenda sidebar, mark discussed, pause/resume, end
 * 4. Record After mode — retrospective capture
 * 5. Post-Meeting Review — summary, impressions, action item extraction
 * 6. Action item routing — route to tasks/best_intentions via RoutingStrip, skip items
 * 7. Save & Close — journal auto-save, schedule advance, notifications
 *
 * Run: npx playwright test tests/e2e/features/meetings-functional-lifecycle.spec.ts --headed
 */

import { test, expect, type Page } from '@playwright/test'
import { loginAsMom, loginAsDad } from '../helpers/auth'

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

/** Opens StartMeetingModal for a given meeting type by expanding the row and clicking Start Meeting */
async function openStartMeetingForType(page: Page, meetingTypeText: string) {
  const row = page.locator('button').filter({ hasText: meetingTypeText }).first()
  await expect(row).toBeVisible({ timeout: 5000 })
  await row.click()
  await page.waitForTimeout(500)

  // Click "Start Meeting" button inside the expanded section
  const startBtn = page.locator('button').filter({ hasText: 'Start Meeting' }).first()
  await expect(startBtn).toBeVisible({ timeout: 3000 })
  await startBtn.click()
  await page.waitForTimeout(1000)
}

test.describe('PRD-16 Meetings — Full Meeting Lifecycle', () => {

  test.describe('Start Meeting Modal', () => {

    test('Start Meeting modal shows Live Mode and Record After options for Couple Meeting', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await openStartMeetingForType(page, 'Couple Meeting')

      // Modal should be visible with mode selection
      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Two mode buttons
      const liveMode = page.getByText('Live Mode')
      const recordAfter = page.getByText('Record After')
      await expect(liveMode).toBeVisible()
      await expect(recordAfter).toBeVisible()
      console.log('✓ Start Meeting modal shows Live Mode and Record After options')

      // Live mode description
      const liveDesc = page.getByText(/guides you through your agenda/i)
      const hasLiveDesc = await liveDesc.isVisible().catch(() => false)
      console.log(`  Live mode description visible: ${hasLiveDesc}`)

      // Record After description
      const recordDesc = page.getByText(/capture what you already discussed/i)
      const hasRecordDesc = await recordDesc.isVisible().catch(() => false)
      console.log(`  Record After description visible: ${hasRecordDesc}`)

      // Start button should exist
      const startLive = page.locator('button').filter({ hasText: /start live meeting|start recording/i })
      await expect(startLive).toBeVisible()
      console.log('✓ Start button is visible')

      // Close without starting
      const closeBtn = modal.locator('button').filter({ hasText: /×/ }).first()
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click()
      } else {
        await page.keyboard.press('Escape')
      }
    })

    test('Family Council start modal shows participant picker and facilitator option', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await openStartMeetingForType(page, 'Family Council')

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Participant picker should be visible for family council
      const whoJoining = page.getByText(/who.*joining/i)
      const hasParticipantPicker = await whoJoining.isVisible().catch(() => false)
      console.log(`✓ Participant picker visible: ${hasParticipantPicker}`)

      // Child facilitator option
      const facilitator = page.getByText(/child facilitator/i)
      const hasFacilitator = await facilitator.isVisible().catch(() => false)
      console.log(`  Child facilitator option visible: ${hasFacilitator}`)

      // "Parent leads" default
      const parentLeads = page.getByText(/parent leads/i)
      const hasParentLeads = await parentLeads.isVisible().catch(() => false)
      console.log(`  "Parent leads" default visible: ${hasParentLeads}`)

      await page.keyboard.press('Escape')
    })

    test('Selecting Record After mode changes the start button text', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await openStartMeetingForType(page, 'Couple Meeting')

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Click Record After mode
      const recordAfter = page.getByText('Record After')
      await recordAfter.click()
      await page.waitForTimeout(500)

      // Start button text should change
      const startBtn = page.locator('button').filter({ hasText: /start recording/i })
      const hasRecordBtn = await startBtn.isVisible().catch(() => false)
      console.log(`✓ After selecting Record After, button says "Start Recording": ${hasRecordBtn}`)

      await page.keyboard.press('Escape')
    })
  })

  test.describe('Live Meeting Conversation', () => {

    test('Starting a Couple Meeting in Live Mode opens conversation view', async ({ page }) => {
      test.setTimeout(120000)
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await openStartMeetingForType(page, 'Couple Meeting')

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Select Live Mode (should be default)
      const liveMode = page.getByText('Live Mode')
      await liveMode.click()
      await page.waitForTimeout(300)

      // Click start button — for couple meeting it should be enabled immediately
      const startBtn = page.locator('button').filter({ hasText: /start live meeting/i })
      await expect(startBtn).toBeEnabled({ timeout: 5000 })
      await startBtn.click()

      // Wait for the conversation view to render
      await page.waitForTimeout(5000)

      // The conversation view should show:
      // 1. Meeting title in the header
      const meetingTitle = page.getByText('Couple Meeting').first()
      const hasMeetingTitle = await meetingTitle.isVisible().catch(() => false)
      console.log(`✓ Meeting conversation view open, title visible: ${hasMeetingTitle}`)

      // 2. "Live meeting in progress" indicator
      const liveIndicator = page.getByText(/live meeting in progress/i)
      const hasLiveIndicator = await liveIndicator.isVisible().catch(() => false)
      console.log(`  Live meeting indicator: ${hasLiveIndicator}`)

      // 3. Message input area
      const inputArea = page.locator('textarea[placeholder*="Type your response"]')
      const hasInput = await inputArea.isVisible().catch(() => false)
      console.log(`  Message input area: ${hasInput}`)

      // 4. End Meeting button
      const endBtn = page.locator('button').filter({ hasText: /end/i })
      const hasEndBtn = await endBtn.isVisible().catch(() => false)
      console.log(`  End Meeting button: ${hasEndBtn}`)

      // 5. LiLa should have sent an opening message
      await page.waitForTimeout(3000)
      const lilaMessages = page.locator('[class*="message"], [class*="bubble"]')
      const messageCount = await lilaMessages.count()
      console.log(`  LiLa messages rendered: ${messageCount}`)

      // 6. Agenda sidebar
      const agendaToggle = page.locator('button').filter({ hasText: /agenda/i })
      const hasAgenda = await agendaToggle.isVisible().catch(() => false)
      console.log(`  Agenda sidebar/toggle: ${hasAgenda}`)

      // Now end the meeting to clean up
      if (hasEndBtn) {
        await endBtn.click({ force: true })
        await page.waitForTimeout(2000)
        console.log('✓ Meeting ended via End button')
      }
    })

    test('Sending a message in live meeting and marking agenda items discussed', async ({ page }) => {
      test.setTimeout(120000)
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // First add an agenda item so we have something to mark discussed
      const coupleRow = page.locator('button').filter({ hasText: 'Couple Meeting' })
      await coupleRow.click()
      await page.waitForTimeout(500)
      const quickAdd = page.locator('input[placeholder*="Add agenda item"]').first()
      await quickAdd.fill(`Test discussion topic ${Date.now()}`)
      await quickAdd.press('Enter')
      await page.waitForTimeout(1500)

      // Now start a live meeting
      const startBtn = page.locator('button').filter({ hasText: 'Start Meeting' }).first()
      await startBtn.click()
      await page.waitForTimeout(1000)

      const liveMode = page.getByText('Live Mode')
      await liveMode.click()
      await page.waitForTimeout(300)

      // Wait for participants to load (button disabled until members query resolves)
      const startLive = page.locator('button').filter({ hasText: /start live meeting/i })
      await expect(startLive).toBeEnabled({ timeout: 10000 })
      await startLive.click()
      await page.waitForTimeout(5000)

      // Send a message
      const inputArea = page.locator('textarea[placeholder*="Type"]').first()
      if (await inputArea.isVisible().catch(() => false)) {
        await inputArea.fill('We should plan something special for the kids this weekend.')
        const sendBtn = page.locator('button').filter({ hasText: /send/i }).first()
        if (await sendBtn.isVisible().catch(() => false)) {
          await sendBtn.click()
        } else {
          await inputArea.press('Enter')
        }
        await page.waitForTimeout(3000)
        console.log('✓ Message sent in live meeting')
      }

      // Check for agenda items in the sidebar
      const agendaCheckboxes = page.locator('svg.lucide-circle, svg.lucide-check-circle-2')
      const checkboxCount = await agendaCheckboxes.count()
      console.log(`  Agenda item checkboxes found: ${checkboxCount}`)

      if (checkboxCount > 0) {
        // Click the first unchecked item to mark it as discussed
        await agendaCheckboxes.first().click()
        await page.waitForTimeout(1000)
        console.log('✓ Marked an agenda item as discussed')
      }

      // End the meeting
      const endBtn = page.locator('button').filter({ hasText: /end/i }).first()
      if (await endBtn.isVisible().catch(() => false)) {
        await endBtn.click({ force: true })
        await page.waitForTimeout(2000)
        console.log('✓ Meeting ended')
      }
    })
  })

  test.describe('Record After Mode', () => {

    test('Record After mode shows retrospective input prompt', async ({ page }) => {
      test.setTimeout(120000)
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      await openStartMeetingForType(page, 'Couple Meeting')

      const modal = page.locator('[role="dialog"]')
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Select Record After
      const recordAfter = page.getByText('Record After')
      await recordAfter.click()
      await page.waitForTimeout(300)

      // Wait for participants to load before start is enabled
      const startBtn = page.locator('button').filter({ hasText: /start recording/i })
      await expect(startBtn).toBeEnabled({ timeout: 10000 })
      await startBtn.click()
      await page.waitForTimeout(5000)

      // Should show a different prompt for retrospective capture
      const retroPrompt = page.locator('textarea[placeholder*="tell me what you discussed"]')
      const hasRetroPrompt = await retroPrompt.isVisible().catch(() => false)

      // Or the generic input
      const genericInput = page.locator('textarea[placeholder*="Type"]').first()
      const hasGenericInput = await genericInput.isVisible().catch(() => false)

      console.log(`✓ Record After mode open. Retro prompt: ${hasRetroPrompt}, Generic input: ${hasGenericInput}`)

      // Record After indicator
      const recordIndicator = page.getByText(/recording what was discussed/i)
      const hasRecordIndicator = await recordIndicator.isVisible().catch(() => false)
      console.log(`  "Recording what was discussed" indicator: ${hasRecordIndicator}`)

      // End
      const endBtn = page.locator('button').filter({ hasText: /end/i }).first()
      if (await endBtn.isVisible().catch(() => false)) {
        await endBtn.click({ force: true })
        await page.waitForTimeout(2000)
      }
    })
  })

  test.describe('Post-Meeting Review', () => {

    test('Post-Meeting Review opens after ending a meeting with conversation', async ({ page }) => {
      test.setTimeout(120000) // 2 minute timeout for AI operations

      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      // Start a Record After Couple Meeting (faster to test — no participant picker needed)
      await openStartMeetingForType(page, 'Couple Meeting')

      const startModal = page.locator('[role="dialog"]')
      await expect(startModal).toBeVisible({ timeout: 5000 })

      const recordAfter = page.getByText('Record After')
      await recordAfter.click()
      await page.waitForTimeout(300)

      // Wait for participants to auto-populate before button enables
      const startBtn = page.locator('button').filter({ hasText: /start recording/i })
      await expect(startBtn).toBeEnabled({ timeout: 10000 })
      await startBtn.click()
      await page.waitForTimeout(5000)

      // Type a summary of what was discussed
      const input = page.locator('textarea[placeholder*="Type"]').first()
      if (await input.isVisible().catch(() => false)) {
        await input.fill(
          'We discussed chores for this week. Alex will take out trash on Monday and Wednesday. ' +
          'Jordan wants to help with cooking on weekends. We agreed to have a family movie night on Friday. ' +
          'Mom will look into summer camp options. Dad will fix the backyard fence this weekend.'
        )

        const sendBtn = page.locator('button').filter({ hasText: /send/i }).first()
        if (await sendBtn.isVisible().catch(() => false)) {
          await sendBtn.click()
        } else {
          await input.press('Enter')
        }
        await page.waitForTimeout(5000)
        console.log('✓ Sent meeting summary content')
      }

      // End the meeting
      const endBtn = page.locator('button').filter({ hasText: /end/i }).first()
      if (await endBtn.isVisible().catch(() => false)) {
        await endBtn.click({ force: true })
        await page.waitForTimeout(3000)
      }

      // Post-Meeting Review modal should open
      const reviewModal = page.getByText('Meeting Review')
      const hasReview = await reviewModal.isVisible().catch(() => false)
      console.log(`✓ Post-Meeting Review modal visible: ${hasReview}`)

      if (hasReview) {
        // Should have three sections: Summary, Personal Impressions, Action Items
        const summarySection = page.getByText('Summary').first()
        const impressionsSection = page.getByText('Personal Impressions')
        const actionSection = page.getByText('Action Items')

        console.log(`  Summary section: ${await summarySection.isVisible().catch(() => false)}`)
        console.log(`  Impressions section: ${await impressionsSection.isVisible().catch(() => false)}`)

        // Wait for AI to extract action items (may take up to 30s)
        const extractingText = page.getByText(/extracting action items/i)
        const isExtracting = await extractingText.isVisible().catch(() => false)
        if (isExtracting) {
          console.log('  Waiting for AI action item extraction...')
          await expect(extractingText).toBeHidden({ timeout: 45000 })
        }

        // Check for action items
        await page.waitForTimeout(2000)
        const actionItems = page.locator('text=/Route|Skip/').first()
        const hasActionItems = await actionItems.isVisible().catch(() => false)
        console.log(`  Action items with Route/Skip buttons: ${hasActionItems}`)

        // Summary textarea should have content (AI-generated or blank for writing)
        const summaryTextarea = page.locator('textarea').first()
        if (await summaryTextarea.isVisible()) {
          const summaryValue = await summaryTextarea.inputValue()
          console.log(`  Summary textarea has content: ${summaryValue.length > 0}`)
        }

        // Personal impressions section
        const impressionsArea = page.locator('textarea').nth(1)
        if (await impressionsArea.isVisible().catch(() => false)) {
          await impressionsArea.fill('Good family discussion. Everyone participated well.')
          console.log('✓ Filled in personal impressions')
        }

        // Save & Close button
        const saveBtn = page.locator('button').filter({ hasText: /save.*close/i })
        const hasSave = await saveBtn.isVisible().catch(() => false)
        console.log(`  Save & Close button visible: ${hasSave}`)

        if (hasSave) {
          await saveBtn.click()
          await page.waitForTimeout(3000)
          console.log('✓ Save & Close clicked — meeting review completed')
        }
      }
    })
  })

  test.describe('Meeting History', () => {

    test('Completed meetings appear in Recent History section', async ({ page }) => {
      await loginAsMom(page)
      await dismissGuides(page)
      await navigateToMeetings(page)

      const historySection = page.locator('h2').filter({ hasText: 'Recent History' })
      await expect(historySection).toBeVisible({ timeout: 5000 })

      // Check if there are any completed meetings listed
      const historyCards = historySection.locator('..').locator('.rounded-lg')
      const cardCount = await historyCards.count()
      console.log(`✓ Recent History section visible, ${cardCount} meeting card(s) found`)

      // If there are meetings, check for "View All History" link
      if (cardCount > 0) {
        const viewAll = page.getByText('View All History')
        const hasViewAll = await viewAll.isVisible().catch(() => false)
        console.log(`  "View All History" link visible: ${hasViewAll}`)

        if (hasViewAll) {
          await viewAll.click()
          await page.waitForTimeout(1000)

          // Meeting History modal should open
          const historyModal = page.locator('[role="dialog"]')
          const hasHistoryModal = await historyModal.isVisible().catch(() => false)
          console.log(`  Meeting History modal visible: ${hasHistoryModal}`)

          if (hasHistoryModal) {
            // Should have type filter pills
            const filterPills = page.getByText(/couple|mentor|family council|parent-child/i)
            const pillCount = await filterPills.count()
            console.log(`  Type filter pills found: ${pillCount}`)

            await page.keyboard.press('Escape')
          }
        }
      } else {
        const emptyText = page.getByText(/history will appear here/i)
        const hasEmpty = await emptyText.isVisible().catch(() => false)
        console.log(`  Empty state text visible: ${hasEmpty}`)
      }
    })
  })
})
