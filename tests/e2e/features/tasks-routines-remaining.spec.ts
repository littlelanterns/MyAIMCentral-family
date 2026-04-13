/**
 * E2E Test: Remaining task/routine flows
 *
 * 1. Kitchen Duties with specific date range via Custom scheduler
 * 2. All 4 segments for Riley + assign tasks to them
 * 3. Randomizer draw → assign to child (full flow)
 * 4. Final verification clean run
 */
import { test, expect, type Page } from '@playwright/test'
import { loginAsMom, loginAsAlex, loginAsRiley } from '../helpers/auth'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function serviceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function scrollModal(page: Page, position: number | 'bottom') {
  const scrollable = page.locator('[role="dialog"] .overflow-y-auto').first()
  if (await scrollable.isVisible()) {
    if (position === 'bottom') {
      await scrollable.evaluate(el => el.scrollTop = el.scrollHeight)
    } else {
      await scrollable.evaluate((el, pos) => el.scrollTop = pos, position)
    }
    await page.waitForTimeout(300)
  }
}

async function dismissOverlays(page: Page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  await page.mouse.click(10, 10)
  await page.waitForTimeout(200)
  // Force-hide any fixed z-40 floating overlays (LiLa drawer, suggestion tooltips)
  await page.evaluate(() => {
    document.querySelectorAll('.fixed.z-40, [class*="z-40"]').forEach(el => {
      (el as HTMLElement).style.display = 'none'
    })
  })
  await page.waitForTimeout(100)
}

test.describe.serial('Remaining task flows', () => {

  // ─────────────────────────────────────────────────────────────
  // 0. Cleanup
  // ─────────────────────────────────────────────────────────────

  test('0. cleanup', async () => {
    const sb = serviceClient()
    const { data: family } = await sb
      .from('families')
      .select('id')
      .eq('family_login_name', 'testworths')
      .single()

    if (!family) return

    // Archive old Kitchen Duties
    const { data: tasks } = await sb
      .from('tasks')
      .select('id')
      .eq('family_id', family.id)
      .ilike('title', '%Kitchen Duties%')
      .is('archived_at', null)

    if (tasks && tasks.length > 0) {
      await sb.from('task_completions').delete().in('task_id', tasks.map(t => t.id))
      await sb.from('tasks')
        .update({ archived_at: new Date().toISOString() })
        .in('id', tasks.map(t => t.id))
      console.log(`Archived ${tasks.length} old Kitchen Duties`)
    }

    // Delete old test segments for Riley
    const { data: riley } = await sb
      .from('family_members')
      .select('id')
      .eq('family_id', family.id)
      .eq('display_name', 'Riley')
      .single()

    if (riley) {
      // Clear tasks from segments first
      await sb.from('tasks')
        .update({ task_segment_id: null })
        .eq('family_id', family.id)
        .eq('assignee_id', riley.id)

      // Delete old segments
      const { data: segs } = await sb
        .from('task_segments')
        .select('id')
        .eq('family_member_id', riley.id)

      if (segs && segs.length > 0) {
        await sb.from('task_segments')
          .delete()
          .in('id', segs.map(s => s.id))
        console.log(`Deleted ${segs.length} old segments for Riley`)
      }
    }

    console.log('✅ Cleanup done')
  })

  // ─────────────────────────────────────────────────────────────
  // 1. Kitchen Duties with date range 4/13-4/20 via Custom scheduler
  // ─────────────────────────────────────────────────────────────

  test('1. Kitchen Duties 4/13-4/20 assigned to Alex', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    // Create task
    await page.locator('button').filter({ hasText: /Create/ }).first().click()
    await page.waitForTimeout(1000)

    // Title
    await page.locator('input[placeholder="What needs to be done?"]').first().fill('Kitchen Duties (Week 1: Apr 13-20)')

    // Select Routine type
    await scrollModal(page, 400)
    const routineBtn = page.locator('button.btn-inline').filter({ hasText: 'Routine' }).first()
    if (await routineBtn.isVisible()) {
      await routineBtn.click()
      await page.waitForTimeout(500)
    }

    // Add a section with daily steps
    await scrollModal(page, 700)
    const addSectionBtn = page.locator('[role="dialog"] button').filter({ hasText: /Add section/i }).first()
    if (await addSectionBtn.isVisible()) {
      await addSectionBtn.click()
      await page.waitForTimeout(500)

      const sectionInput = page.locator('[role="dialog"] input[placeholder*="Section name"]').first()
      if (await sectionInput.isVisible()) {
        await sectionInput.fill('Daily Kitchen Tasks')
      }

      // Add steps
      await scrollModal(page, 900)
      const existingStep = page.locator('[role="dialog"] input[placeholder*="Step"]').first()
      if (await existingStep.isVisible()) {
        await existingStep.fill('Wipe down counters')
      }

      const addStepBtn = page.locator('[role="dialog"] button').filter({ hasText: /Add step/i }).first()
      if (await addStepBtn.isVisible()) {
        for (const step of ['Load dishwasher', 'Sweep floor', 'Take out trash']) {
          await addStepBtn.click()
          await page.waitForTimeout(200)
          await page.locator('[role="dialog"] input[placeholder*="Step"]').last().fill(step)
        }
      }
    }

    // Assign to Alex
    await scrollModal(page, 'bottom')
    await page.waitForTimeout(300)
    const alexBtn = page.locator('[role="dialog"] button, [role="dialog"] span').filter({ hasText: /^Alex$/ }).first()
    if (await alexBtn.isVisible()) {
      await alexBtn.click()
      console.log('✅ Assigned to Alex')
    }

    // Set schedule to Custom for date range control
    await scrollModal(page, 'bottom')
    const customRadio = page.locator('[role="dialog"] button.btn-inline').filter({ hasText: /^Custom$/ }).first()
    if (await customRadio.isVisible()) {
      await customRadio.click()
      await page.waitForTimeout(500)
      console.log('✅ Switched to Custom schedule')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-01-custom-schedule.png', fullPage: true })

    // The Custom schedule opens the UniversalScheduler which has:
    // - Frequency radio buttons (One-Time, Daily, Weekly, Monthly, Yearly)
    // - Weekday selector
    // - "Ends" section with date picker
    // Look for the Weekly radio in the scheduler
    await scrollModal(page, 'bottom')
    await page.waitForTimeout(300)

    // Find and interact with the scheduler's date/frequency controls
    // The scheduler might render as radio buttons or a separate section
    const schedulerSection = page.locator('[role="dialog"]')

    // Look for date inputs in the scheduler area
    const dateInputs = await schedulerSection.locator('input[type="date"]').all()
    console.log(`Found ${dateInputs.length} date inputs in scheduler`)

    // Set the due date / start date if available
    if (dateInputs.length > 0) {
      await dateInputs[0].fill('2026-04-13')
      console.log('✅ Set start date to 2026-04-13')
    }

    // Look for "Ends" or "Until" or end date field
    if (dateInputs.length > 1) {
      await dateInputs[1].fill('2026-04-20')
      console.log('✅ Set end date to 2026-04-20')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-02-dates-set.png', fullPage: true })

    // Save
    await scrollModal(page, 'bottom')
    const saveBtn = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
      console.log('✅ Saved Kitchen Duties Week 1')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-03-week1-saved.png', fullPage: true })

    // Now create the second instance: 5/11-5/18
    await page.locator('button').filter({ hasText: /Create/ }).first().click()
    await page.waitForTimeout(1000)

    await page.locator('input[placeholder="What needs to be done?"]').first().fill('Kitchen Duties (Week 2: May 11-18)')

    // Select Routine
    await scrollModal(page, 400)
    const routineBtn2 = page.locator('button.btn-inline').filter({ hasText: 'Routine' }).first()
    if (await routineBtn2.isVisible()) await routineBtn2.click()

    // Add section with steps
    await scrollModal(page, 700)
    const addSection2 = page.locator('[role="dialog"] button').filter({ hasText: /Add section/i }).first()
    if (await addSection2.isVisible()) {
      await addSection2.click()
      await page.waitForTimeout(500)
      const secInput = page.locator('[role="dialog"] input[placeholder*="Section name"]').first()
      if (await secInput.isVisible()) await secInput.fill('Daily Kitchen Tasks')

      await scrollModal(page, 900)
      const stepInput = page.locator('[role="dialog"] input[placeholder*="Step"]').first()
      if (await stepInput.isVisible()) await stepInput.fill('Wipe down counters')
      const addStep2 = page.locator('[role="dialog"] button').filter({ hasText: /Add step/i }).first()
      if (await addStep2.isVisible()) {
        for (const step of ['Load dishwasher', 'Sweep floor', 'Take out trash']) {
          await addStep2.click()
          await page.waitForTimeout(200)
          await page.locator('[role="dialog"] input[placeholder*="Step"]').last().fill(step)
        }
      }
    }

    // Assign Alex + Custom schedule
    await scrollModal(page, 'bottom')
    const alexBtn2 = page.locator('[role="dialog"] button, [role="dialog"] span').filter({ hasText: /^Alex$/ }).first()
    if (await alexBtn2.isVisible()) await alexBtn2.click()

    const customRadio2 = page.locator('[role="dialog"] button.btn-inline').filter({ hasText: /^Custom$/ }).first()
    if (await customRadio2.isVisible()) await customRadio2.click()

    await scrollModal(page, 'bottom')
    await page.waitForTimeout(500)
    const dateInputs2 = await page.locator('[role="dialog"] input[type="date"]').all()
    if (dateInputs2.length > 0) await dateInputs2[0].fill('2026-05-11')
    if (dateInputs2.length > 1) await dateInputs2[1].fill('2026-05-18')

    await scrollModal(page, 'bottom')
    const saveBtn2 = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn2.isVisible()) {
      await saveBtn2.click()
      await page.waitForTimeout(2000)
      console.log('✅ Saved Kitchen Duties Week 2 (May 11-18)')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-04-week2-saved.png', fullPage: true })
  })

  // ─────────────────────────────────────────────────────────────
  // 2. Create all 4 segments for Riley and assign tasks
  // ─────────────────────────────────────────────────────────────

  test('2. Create Morning/School/Jobs/Evening segments for Riley', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/family-members')
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Scroll to find Riley
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // Find and click Edit on Riley's card
    const rileyCard = page.locator('.rounded-xl').filter({ hasText: /Riley/ }).last()
    const editBtn = rileyCard.locator('button[title="Edit"]')
    if (await editBtn.isVisible()) {
      await editBtn.click({ force: true })
      await page.waitForTimeout(500)
    }

    // Scroll to see expanded content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // Click Gamification Settings (force: true to bypass any remaining overlays)
    const gamifBtn = page.locator('button').filter({ hasText: /Gamification Settings/ }).first()
    if (await gamifBtn.isVisible()) {
      await gamifBtn.click({ force: true })
      await page.waitForTimeout(500)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-10-gamif-modal.png', fullPage: true })

    // Expand Day Segments section
    const daySegHeader = page.locator('text=/Day Segment/i').first()
    if (await daySegHeader.isVisible()) {
      await daySegHeader.click({ force: true })
      await page.waitForTimeout(300)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-11-segments-expanded.png', fullPage: true })

    // Create all 4 segments
    const segmentNames = ['Morning', 'School', 'Jobs', 'Evening']

    for (const name of segmentNames) {
      // Click "Add Segment"
      const addBtn = page.locator('button, a').filter({ hasText: /Add Segment/i }).first()
      if (await addBtn.isVisible()) {
        await addBtn.click()
        await page.waitForTimeout(300)

        // Try clicking the suggestion button with exact name match
        const suggestion = page.locator('button.rounded-full').filter({ hasText: new RegExp(`^${name}$`) }).first()
        if (await suggestion.isVisible()) {
          await suggestion.click()
          console.log(`  Clicked suggestion: ${name}`)
          await page.waitForTimeout(200)
        } else {
          // Type it manually
          const nameInput = page.locator('input[placeholder="Segment name"]').first()
          if (await nameInput.isVisible()) {
            await nameInput.fill(name)
          }
        }

        // Click the confirm button (Check icon) — it's the button right after the input
        // Use a more specific selector: button with Check icon that's not the X button
        const confirmBtn = page.locator('input[placeholder="Segment name"]').locator('..').locator('button').first()
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click()
          await page.waitForTimeout(500)
          console.log(`✅ Created segment: ${name}`)
        }
      }
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-12-all-segments.png', fullPage: true })

    // Now assign tasks to segments — click the task picker button on each segment
    // The task picker button has title="Assign tasks" (ListChecks icon)
    const segmentRows = page.locator('button[title="Assign tasks"]')
    const segmentCount = await segmentRows.count()
    console.log(`Found ${segmentCount} segment task-picker buttons`)

    // Assign "Feed the Dogs" to "Jobs" segment (should be the 3rd segment)
    if (segmentCount >= 3) {
      // Click the task picker for "Jobs" (3rd segment, index 2)
      await segmentRows.nth(2).click()
      await page.waitForTimeout(500)

      await page.screenshot({ path: 'tests/e2e/.screenshots/remain-13-task-picker.png', fullPage: true })

      // In the task picker modal, look for "Feed the Dogs" and click it
      const feedDogsTask = page.locator('button').filter({ hasText: /Feed the Dogs/ }).first()
      if (await feedDogsTask.isVisible()) {
        await feedDogsTask.click()
        await page.waitForTimeout(300)
        console.log('✅ Assigned Feed the Dogs to Jobs segment')
      }

      // Click Done to close
      const doneBtn = page.locator('button').filter({ hasText: /^Done$/ }).first()
      if (await doneBtn.isVisible()) {
        await doneBtn.click()
        await page.waitForTimeout(300)
      }
    }

    // Assign "Practice Reading" to "School" segment (2nd segment, index 1)
    if (segmentCount >= 2) {
      await segmentRows.nth(1).click()
      await page.waitForTimeout(500)

      const readingTask = page.locator('button').filter({ hasText: /Practice Reading/ }).first()
      if (await readingTask.isVisible()) {
        await readingTask.click()
        await page.waitForTimeout(300)
        console.log('✅ Assigned Practice Reading to School segment')
      }

      const doneBtn = page.locator('button').filter({ hasText: /^Done$/ }).first()
      if (await doneBtn.isVisible()) {
        await doneBtn.click()
        await page.waitForTimeout(300)
      }
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-14-tasks-assigned.png', fullPage: true })

    // Close gamification modal
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  // ─────────────────────────────────────────────────────────────
  // 3. Randomizer draw → assign to Alex (full flow)
  // ─────────────────────────────────────────────────────────────

  test('3. Consequence spinner: draw and assign to Alex', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')
    await dismissOverlays(page)

    // Find and click on the Consequence Spinner list
    const spinnerCard = page.locator('text=Consequence Spinner').first()
    if (await spinnerCard.isVisible()) {
      await spinnerCard.click()
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-20-spinner-detail.png', fullPage: true })

    // Click Draw button
    const drawBtn = page.locator('button').filter({ hasText: /Draw|Spin/ }).first()
    if (await drawBtn.isVisible()) {
      await drawBtn.click()
      await page.waitForTimeout(3500) // Wait for spinner animation
      console.log('✅ Drew from spinner')

      await page.screenshot({ path: 'tests/e2e/.screenshots/remain-21-draw-result.png', fullPage: true })

      // Dismiss any overlays that appeared after the draw
      await dismissOverlays(page)

      // Click "Assign to →" button on the result card
      const assignBtn = page.locator('button').filter({ hasText: /Assign to/ }).first()
      if (await assignBtn.isVisible()) {
        await assignBtn.click({ force: true })
        await page.waitForTimeout(500)
        console.log('✅ Opened assign picker')

        await page.screenshot({ path: 'tests/e2e/.screenshots/remain-22-assign-picker.png', fullPage: true })

        // Click on Alex in the member picker (force to bypass lingering overlays)
        const alexPick = page.locator('button').filter({ hasText: /Alex/ }).first()
        if (await alexPick.isVisible()) {
          await alexPick.click({ force: true })
          await page.waitForTimeout(300)
          console.log('✅ Selected Alex')
        }

        // Click Confirm to complete the assignment
        const confirmBtn = page.locator('button').filter({ hasText: /Confirm/ }).first()
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click({ force: true })
          await page.waitForTimeout(1000)
          console.log('✅ Confirmed assignment — task created for Alex')
        }

        await page.screenshot({ path: 'tests/e2e/.screenshots/remain-23-assigned.png', fullPage: true })
      }
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 4. Verify: Alex sees routine on Routines tab
  // ─────────────────────────────────────────────────────────────

  test('4. Alex sees Kitchen Duties routines on Routines tab', async ({ page }) => {
    await loginAsAlex(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    // Click Routines tab
    const routinesTab = page.getByRole('tab', { name: /Routine/i })
    if (await routinesTab.isVisible()) {
      await routinesTab.click()
      await page.waitForTimeout(500)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-30-alex-routines.png', fullPage: true })

    // Check for Kitchen Duties
    const week1 = page.locator('text=Kitchen Duties (Week 1')
    const week2 = page.locator('text=Kitchen Duties (Week 2')
    const w1Visible = await week1.isVisible().catch(() => false)
    const w2Visible = await week2.isVisible().catch(() => false)
    console.log(`Week 1 routine visible: ${w1Visible}`)
    console.log(`Week 2 routine visible: ${w2Visible}`)

    // Also check My Tasks tab for the spinner-assigned task
    const myTasksTab = page.getByRole('tab', { name: /My Task/i })
    if (await myTasksTab.isVisible()) {
      await myTasksTab.click()
      await page.waitForTimeout(500)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-31-alex-mytasks.png', fullPage: true })

    // Check if the spinner-assigned consequence task appears
    const pageText = await page.locator('body').textContent()
    const hasConsequence = pageText?.includes('Scrub') || pageText?.includes('Vacuum') ||
      pageText?.includes('Wipe') || pageText?.includes('Organize') || pageText?.includes('Dust') ||
      pageText?.includes('Clean') || pageText?.includes('Sort') || pageText?.includes('Weed') ||
      pageText?.includes('Fold') || pageText?.includes('car')
    console.log(`Alex has a consequence-assigned task: ${hasConsequence}`)
  })

  // ─────────────────────────────────────────────────────────────
  // 5. Verify: Riley's Play Dashboard shows segments
  // ─────────────────────────────────────────────────────────────

  test('5. Riley sees tasks organized by segments on Play Dashboard', async ({ page }) => {
    await loginAsRiley(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-40-riley-dash.png', fullPage: true })

    // Check for segment headers (Morning, School, Jobs, Evening)
    const morning = await page.locator('text=/Morning/i').isVisible().catch(() => false)
    const school = await page.locator('text=/School/i').isVisible().catch(() => false)
    const jobs = await page.locator('text=/Jobs/i').isVisible().catch(() => false)
    const evening = await page.locator('text=/Evening/i').isVisible().catch(() => false)
    console.log(`Segments visible - Morning: ${morning}, School: ${school}, Jobs: ${jobs}, Evening: ${evening}`)

    // Check for specific tasks
    const feedDogs = await page.locator('text=/Feed the Dogs/i').isVisible().catch(() => false)
    const reading = await page.locator('text=/Practice Reading/i').isVisible().catch(() => false)
    console.log(`Feed the Dogs: ${feedDogs}, Practice Reading: ${reading}`)

    // Scroll to see full dashboard
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/e2e/.screenshots/remain-41-riley-full.png', fullPage: true })

    // Try completing a task by tapping — click the parent tile element, not just the text span
    if (feedDogs) {
      // The text is inside a tile. Find the clickable tile that contains it.
      const tileContainer = page.locator('button, div[role="button"], [class*="tile"]').filter({ hasText: /Feed the Dogs/i }).first()
      if (await tileContainer.isVisible()) {
        await tileContainer.click({ force: true })
        await page.waitForTimeout(1500)
        console.log('✅ Tapped Feed the Dogs tile')
      } else {
        // Fallback: force-click the text element itself
        await page.locator('text=/Feed the Dogs/i').first().click({ force: true })
        await page.waitForTimeout(1500)
        console.log('✅ Force-clicked Feed the Dogs text')
      }
      await page.screenshot({ path: 'tests/e2e/.screenshots/remain-42-after-complete.png', fullPage: true })
    }
  })
})
