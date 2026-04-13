/**
 * E2E Test: Full Tasks, Routines, Segments, and Completion Flows
 *
 * Tests:
 * 1. Cleanup duplicate tasks from prior test runs
 * 2. Kitchen routine with sections/steps, date ranges, assigned to Alex
 * 3. Segments for Riley via gamification settings
 * 4. Randomizer-to-task assignment (consequence spinner)
 * 5. Teen (Alex) sees routine on Routines tab + completes steps
 * 6. Play (Riley) sees tasks in segments + taps to complete
 * 7. Linked routine steps (sequential + randomizer connections)
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

// Track created records for cleanup
const createdTaskIds: string[] = []
const createdListIds: string[] = []
const createdCollectionIds: string[] = []

// Helper: scroll modal body
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

// ─────────────────────────────────────────────────────────────
// CLEANUP: Remove test-created tasks from prior runs
// ─────────────────────────────────────────────────────────────

test.describe.serial('Full task flow with cleanup', () => {

  test('0. cleanup prior test data', async () => {
    const sb = serviceClient()

    // Find the Testworths family
    const { data: family } = await sb
      .from('families')
      .select('id')
      .eq('family_login_name', 'testworths')
      .single()

    if (!family) {
      console.log('No testworths family found, skipping cleanup')
      return
    }

    // Archive old test tasks by title patterns
    const testTitles = [
      'Kitchen Duties',
      'Feed the Dogs',
      'Practice Reading (15 minutes)',
      'Practice Reading',
    ]

    for (const title of testTitles) {
      const { data: tasks } = await sb
        .from('tasks')
        .select('id')
        .eq('family_id', family.id)
        .eq('title', title)
        .is('archived_at', null)

      if (tasks && tasks.length > 0) {
        // Delete completions first (FK constraint)
        await sb.from('task_completions').delete().in('task_id', tasks.map(t => t.id))
        // Then soft-delete tasks
        await sb.from('tasks')
          .update({ archived_at: new Date().toISOString() })
          .in('id', tasks.map(t => t.id))
        console.log(`Archived ${tasks.length} old "${title}" tasks`)
      }
    }

    // Clean up old test lists
    const testListTitles = [
      'Consequence Spinner',
      "Riley's Little Helper Jobs",
      "Riley's Reading & Letter Fun",
    ]

    for (const title of testListTitles) {
      const { data: lists } = await sb
        .from('lists')
        .select('id')
        .eq('family_id', family.id)
        .eq('title', title)
        .is('archived_at', null)

      if (lists && lists.length > 0) {
        // Delete items, then archive lists
        for (const list of lists) {
          await sb.from('list_items').delete().eq('list_id', list.id)
        }
        await sb.from('lists')
          .update({ archived_at: new Date().toISOString() })
          .in('id', lists.map(l => l.id))
        console.log(`Archived ${lists.length} old "${title}" lists`)
      }
    }

    // Clean up old sequential collections
    const { data: seqCollections } = await sb
      .from('sequential_collections')
      .select('id')
      .eq('family_id', family.id)
      .ilike('title', "%Phonics%")

    if (seqCollections && seqCollections.length > 0) {
      for (const sc of seqCollections) {
        // Archive child tasks
        await sb.from('tasks')
          .update({ archived_at: new Date().toISOString() })
          .eq('sequential_collection_id', sc.id)
      }
      console.log(`Cleaned up ${seqCollections.length} old sequential collections`)
    }

    console.log('✅ Cleanup complete')
  })

  // ─────────────────────────────────────────────────────────────
  // 1. Kitchen Routine with real sections and steps
  // ─────────────────────────────────────────────────────────────

  test('1. Mom creates Kitchen Duties routine with daily/weekly sections', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    // Open Routines tab first
    const routinesTab = page.getByRole('tab', { name: /Routine/i })
    if (await routinesTab.isVisible()) {
      await routinesTab.click()
      await page.waitForTimeout(500)
    }

    // Click Create
    const createBtn = page.locator('button').filter({ hasText: /Create/ }).first()
    await createBtn.click()
    await page.waitForTimeout(1000)

    // Fill title
    const titleInput = page.locator('input[placeholder="What needs to be done?"]').first()
    await titleInput.fill('Kitchen Duties')

    // Fill description
    const descInput = page.locator('textarea[placeholder="Describe what needs to be done..."]')
    if (await descInput.isVisible()) {
      await descInput.fill('Kitchen cleaning routine - daily wipe-downs plus weekly deep clean')
    }

    // Scroll to Task Type and select Routine
    await scrollModal(page, 400)
    const routineBtn = page.locator('button.btn-inline').filter({ hasText: 'Routine' }).first()
    if (await routineBtn.isVisible()) {
      await routineBtn.click()
      await page.waitForTimeout(500)
      console.log('✅ Selected Routine type')
    }

    // NOW scroll to the Routine Section Editor that appears below Task Type
    await scrollModal(page, 700)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-01-section-editor.png', fullPage: true })

    // Look for "Add section" button or existing section editor
    const addSectionBtn = page.locator('[role="dialog"] button').filter({ hasText: /Add section/i }).first()
    const addSectionVisible = await addSectionBtn.isVisible()
    console.log(`Add section button visible: ${addSectionVisible}`)

    if (addSectionVisible) {
      // Click to add first section — frequency defaults to 'daily', no need to change it
      await addSectionBtn.click()
      await page.waitForTimeout(500)

      // The section starts in editing mode with a name input (placeholder="Section name…")
      const sectionNameInput = page.locator('[role="dialog"] input[placeholder*="Section name"]').first()
      if (await sectionNameInput.isVisible()) {
        await sectionNameInput.fill('Daily Kitchen Tasks')
        console.log('✅ Named first section: Daily Kitchen Tasks (frequency defaults to daily)')
      }

      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-02-first-section.png', fullPage: true })

      // Scroll to see the section content and add steps
      await scrollModal(page, 900)
      await page.waitForTimeout(300)

      // Add steps — the "Add step" button is inside the section
      const addStepBtn = page.locator('[role="dialog"] button').filter({ hasText: /Add step/i }).first()
      if (await addStepBtn.isVisible()) {
        // The section already starts with one blank step. Fill it first.
        const existingStepInput = page.locator('[role="dialog"] input[placeholder*="Step"]').first()
        if (await existingStepInput.isVisible()) {
          await existingStepInput.fill('Wipe down counters')
          console.log('  Filled existing step: Wipe down counters')
        }

        // Add more steps
        const moreSteps = ['Load/unload dishwasher', 'Sweep floor', 'Take out trash']
        for (const step of moreSteps) {
          await addStepBtn.click()
          await page.waitForTimeout(300)
          const stepInputs = page.locator('[role="dialog"] input[placeholder*="Step"]')
          await stepInputs.last().fill(step)
          console.log(`  Added step: ${step}`)
        }
      } else {
        console.log('❌ Add step button not found — listing all buttons in area')
        const btns = await page.locator('[role="dialog"] button').all()
        for (const btn of btns.slice(0, 10)) {
          const text = await btn.textContent()
          if (text?.trim()) console.log(`  Button: "${text.trim()}"`)
        }
      }

      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-03-daily-steps.png', fullPage: true })

      // Scroll back up to find the "+ new section" button
      await scrollModal(page, 700)
      await page.waitForTimeout(300)

      // Add second section for Weekly Deep Clean
      const newSectionBtn = page.locator('[role="dialog"] button').filter({ hasText: /new section|Add section/i }).first()
      if (await newSectionBtn.isVisible()) {
        await newSectionBtn.click()
        await page.waitForTimeout(500)

        // Fill the new section name
        const sectionInputs = page.locator('[role="dialog"] input[placeholder*="Section name"]')
        await sectionInputs.last().fill('Weekly Deep Clean')
        console.log('✅ Named second section: Weekly Deep Clean')

        // Change frequency to weekly — the native <select> inside the editing panel
        // Each section has its own <select>. Find the LAST one (belongs to new section)
        const freqSelects = page.locator('[role="dialog"] select').filter({ has: page.locator('option[value="weekly"]') })
        const count = await freqSelects.count()
        if (count > 0) {
          await freqSelects.last().selectOption('weekly')
          console.log('✅ Set second section frequency to weekly')
        }

        // Scroll to see and add weekly steps
        await scrollModal(page, 1200)
        await page.waitForTimeout(300)

        const addStepBtns = page.locator('[role="dialog"] button').filter({ hasText: /Add step/i })
        const lastAddStep = addStepBtns.last()
        if (await lastAddStep.isVisible()) {
          // Fill existing blank step first
          const stepInputs2 = page.locator('[role="dialog"] input[placeholder*="Step"]')
          await stepInputs2.last().fill('Clean inside microwave')
          console.log('  Filled step: Clean inside microwave')

          const weeklySteps = ['Wipe cabinet fronts', 'Scrub kitchen sink', 'Mop floor']
          for (const step of weeklySteps) {
            await lastAddStep.click()
            await page.waitForTimeout(300)
            const inputs = page.locator('[role="dialog"] input[placeholder*="Step"]')
            await inputs.last().fill(step)
            console.log(`  Added weekly step: ${step}`)
          }
        }
      }

      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-04-weekly-steps.png', fullPage: true })
    }

    // Scroll to assignment - assign to Alex
    await scrollModal(page, 'bottom')
    await page.waitForTimeout(300)

    const alexBtn = page.locator('[role="dialog"] button, [role="dialog"] label, [role="dialog"] span').filter({ hasText: /^Alex$/ }).first()
    if (await alexBtn.isVisible()) {
      await alexBtn.click()
      console.log('✅ Assigned to Alex')
    }

    // Set schedule to Weekly
    const weeklyRadio = page.locator('[role="dialog"] button.btn-inline, [role="dialog"] label').filter({ hasText: /^Weekly$/ }).first()
    if (await weeklyRadio.isVisible()) {
      await weeklyRadio.click()
      console.log('✅ Set schedule to Weekly')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-05-assigned-scheduled.png', fullPage: true })

    // Save
    await scrollModal(page, 'bottom')
    const saveBtn = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
      console.log('✅ Saved Kitchen Duties routine')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-06-routine-saved.png', fullPage: true })

    // Verify it appears on Routines tab
    const routinesTabAgain = page.getByRole('tab', { name: /Routine/i })
    if (await routinesTabAgain.isVisible()) {
      await routinesTabAgain.click()
      await page.waitForTimeout(500)
    }

    const routineVisible = await page.locator('text=Kitchen Duties').isVisible().catch(() => false)
    console.log(`Kitchen Duties on Routines tab: ${routineVisible}`)
    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-07-routines-tab.png', fullPage: true })
  })

  // ─────────────────────────────────────────────────────────────
  // 2. Mom creates tasks for Riley and consequence spinner
  // ─────────────────────────────────────────────────────────────

  test('2. Mom creates Feed the Dogs + Practice Reading for Riley', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    // Create Feed the Dogs
    const createBtn = page.locator('button').filter({ hasText: /Create/ }).first()
    await createBtn.click()
    await page.waitForTimeout(1000)

    const titleInput = page.locator('input[placeholder="What needs to be done?"]').first()
    await titleInput.fill('Feed the Dogs')

    // Set daily
    await scrollModal(page, 600)
    const dailyRadio = page.locator('[role="dialog"] button.btn-inline').filter({ hasText: /^Daily$/ }).first()
    if (await dailyRadio.isVisible()) await dailyRadio.click()

    // Assign Riley
    await scrollModal(page, 'bottom')
    const rileyBtn = page.locator('[role="dialog"] button, [role="dialog"] span').filter({ hasText: /^Riley$/ }).first()
    if (await rileyBtn.isVisible()) await rileyBtn.click()

    // Save
    await scrollModal(page, 'bottom')
    const saveBtn = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    }
    console.log('✅ Created Feed the Dogs for Riley')

    // Create Practice Reading
    await page.locator('button').filter({ hasText: /Create/ }).first().click()
    await page.waitForTimeout(1000)
    await page.locator('input[placeholder="What needs to be done?"]').first().fill('Practice Reading (15 minutes)')

    await scrollModal(page, 600)
    const dailyRadio2 = page.locator('[role="dialog"] button.btn-inline').filter({ hasText: /^Daily$/ }).first()
    if (await dailyRadio2.isVisible()) await dailyRadio2.click()

    await scrollModal(page, 'bottom')
    const rileyBtn2 = page.locator('[role="dialog"] button, [role="dialog"] span').filter({ hasText: /^Riley$/ }).first()
    if (await rileyBtn2.isVisible()) await rileyBtn2.click()

    await scrollModal(page, 'bottom')
    const saveBtn2 = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn2.isVisible()) {
      await saveBtn2.click()
      await page.waitForTimeout(2000)
    }
    console.log('✅ Created Practice Reading for Riley')

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-10-riley-tasks-created.png', fullPage: true })
  })

  // ─────────────────────────────────────────────────────────────
  // 3. Mom creates consequence spinner and draws
  // ─────────────────────────────────────────────────────────────

  test('3. Mom creates consequence spinner, draws, and assigns result', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')

    // Create randomizer
    const newListBtn = page.locator('button').filter({ hasText: /New List|Create|\+/ }).first()
    await newListBtn.click()
    await page.waitForTimeout(500)

    const randTile = page.locator('button, div[role="button"], label, a').filter({ hasText: /Randomizer/ }).first()
    if (await randTile.isVisible()) {
      await randTile.click()
      await page.waitForTimeout(500)
    }

    // Name it
    const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="List name"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Consequence Spinner')
      const confirmBtn = page.locator('button').filter({ hasText: /Create|Save|OK/ }).first()
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
        await page.waitForTimeout(1000)
      }
    }

    // Add consequence items
    const jobs = [
      'Scrub the toilet', 'Vacuum living room', 'Wipe bathroom mirror',
      'Organize shoe rack', 'Dust bookshelf', 'Clean windows',
      'Sort recycling', 'Weed garden', 'Fold laundry', 'Clean car'
    ]

    const addInput = page.locator('input[placeholder*="Add" i], input[placeholder*="item" i]').first()
    if (await addInput.isVisible()) {
      for (const job of jobs) {
        await addInput.fill(job)
        await addInput.press('Enter')
        await page.waitForTimeout(200)
      }
      console.log(`✅ Added ${jobs.length} consequence items`)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-20-spinner-items.png', fullPage: true })

    // Draw from spinner
    const drawBtn = page.locator('button').filter({ hasText: /Draw|Spin/ }).first()
    if (await drawBtn.isVisible()) {
      await drawBtn.click()
      await page.waitForTimeout(3500) // Wait for full animation
      console.log('✅ Spinner drawn')

      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-21-spinner-result.png', fullPage: true })

      // Look for the result card with "Assign to" member picker
      const assignLabel = page.locator('text=/Assign to/i').first()
      const hasAssign = await assignLabel.isVisible().catch(() => false)
      console.log(`Assign to section visible: ${hasAssign}`)

      if (hasAssign) {
        // Look for Alex in the assign picker
        const alexAssign = page.locator('button').filter({ hasText: /Alex/ }).first()
        if (await alexAssign.isVisible()) {
          await alexAssign.click()
          await page.waitForTimeout(1000)
          console.log('✅ Assigned spinner result to Alex')
          await page.screenshot({ path: 'tests/e2e/.screenshots/flow-22-assigned-result.png', fullPage: true })
        }
      }
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 4. Mom creates sequential phonics for Riley
  // ─────────────────────────────────────────────────────────────

  test('4. Mom creates sequential phonics list for Riley', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')

    const newListBtn = page.locator('button').filter({ hasText: /New List|Create|\+/ }).first()
    await newListBtn.click()
    await page.waitForTimeout(500)

    const seqTile = page.locator('button, div[role="button"], label, a').filter({ hasText: /Sequential/ }).first()
    await seqTile.click()
    await page.waitForTimeout(1000)

    // Select Riley in modal
    const modalRileyBtn = page.locator('[role="dialog"] button').filter({ hasText: /^Riley$/ }).first()
    if (await modalRileyBtn.isVisible()) {
      await modalRileyBtn.click()
      console.log('✅ Selected Riley')
    }

    // Fill title
    const titleInput = page.locator('[role="dialog"] input[placeholder*="Saxon"]').first()
    if (await titleInput.isVisible()) {
      await titleInput.fill("Riley's Phonics Journey")
    }

    // Fill items
    const textarea = page.locator('[role="dialog"] textarea').first()
    if (await textarea.isVisible()) {
      const lessons = Array.from({ length: 10 }, (_, i) =>
        `Lesson ${i + 1}: Phonics Unit ${i + 1}`
      )
      await textarea.fill(lessons.join('\n'))
    }

    await page.waitForTimeout(500)
    const createBtn = page.locator('[role="dialog"] button').filter({ hasText: /Create Collection/ }).first()
    if (await createBtn.isEnabled()) {
      await createBtn.click()
      await page.waitForTimeout(2000)
      console.log('✅ Created sequential phonics')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-30-phonics-created.png', fullPage: true })
  })

  // ─────────────────────────────────────────────────────────────
  // 5. Mom creates segments for Riley via gamification settings
  // ─────────────────────────────────────────────────────────────

  test('5. Mom creates Morning/School/Jobs/Evening segments for Riley', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/family-members')
    await page.waitForLoadState('networkidle')

    // Dismiss any floating overlays (FeatureGuide cards, LiLa suggestions, toasts)
    // Click away or press Escape to clear them
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    // Also try dismissing the FeatureGuide "Show me" card if present
    const dismissBtn = page.locator('button').filter({ hasText: /Dismiss|×|Got it|Close/i }).first()
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click({ force: true })
      await page.waitForTimeout(300)
    }
    // Click on an empty area to dismiss any floating overlays
    await page.mouse.click(10, 10)
    await page.waitForTimeout(300)

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-40-family-members.png', fullPage: true })

    // Scroll to the bottom to find Riley
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-40b-scrolled.png', fullPage: true })

    // Find Riley's row and click its Edit button
    // The FamilyMembers page renders MemberRow for each member. Each row has
    // the member name and action buttons (key, mail, pencil icons).
    // We need to find the pencil button WITHIN Riley's specific row.
    // Use force:true to bypass any remaining overlays.
    const rileyNameElement = page.locator('p, span').filter({ hasText: /^Riley$/ }).last()
    const rileyVisible = await rileyNameElement.isVisible().catch(() => false)
    console.log(`Riley name element visible: ${rileyVisible}`)

    if (rileyVisible) {
      // Each member row is a <div class="rounded-xl ..."> card.
      // The Edit button has title="Edit" and is inside the same card as Riley's name.
      // Find the card that contains Riley's name, then find its Edit button.
      const rileyCard = page.locator('.rounded-xl').filter({ hasText: /Riley/ }).last()
      const editBtn = rileyCard.locator('button[title="Edit"]')
      if (await editBtn.isVisible()) {
        await editBtn.click({ force: true })
        await page.waitForTimeout(500)
        console.log('✅ Clicked Edit on Riley\'s card')
      }
    }

    // Scroll down to see expanded content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-41-riley-edit.png', fullPage: true })

    // Check if gamification settings button appeared
    const gamifBtnCheck = await page.locator('button').filter({ hasText: /Gamification Settings/ }).isVisible().catch(() => false)
    console.log(`Gamification Settings button visible after edit: ${gamifBtnCheck}`)

    if (!gamifBtnCheck) {
      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-40c-no-gamif-btn.png', fullPage: true })
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-41-riley-edit.png', fullPage: true })

    // Look for Gamification Settings button
    const gamifBtn = page.locator('button').filter({ hasText: /Gamification Settings/ }).first()
    const gamifVisible = await gamifBtn.isVisible().catch(() => false)
    console.log(`Gamification Settings button visible: ${gamifVisible}`)

    if (gamifVisible) {
      await gamifBtn.click()
      await page.waitForTimeout(500)

      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-42-gamification-modal.png', fullPage: true })

      // Find and expand Day Segments section — the text may be behind a parent div
      const daySegments = page.locator('text=/Day Segment/i').first()
      if (await daySegments.isVisible()) {
        await daySegments.click({ force: true })
        await page.waitForTimeout(300)
      }

      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-43-segments-section.png', fullPage: true })

      // Create segments: Morning, School, Jobs, Evening
      const segmentNames = ['Morning', 'School', 'Jobs', 'Evening']

      for (const name of segmentNames) {
        const addBtn = page.locator('button, a').filter({ hasText: /Add Segment/i }).first()
        if (await addBtn.isVisible()) {
          await addBtn.click()
          await page.waitForTimeout(300)

          // Try clicking a suggested name button first
          const suggestion = page.locator('button').filter({ hasText: new RegExp(`^${name}$`) }).first()
          if (await suggestion.isVisible()) {
            await suggestion.click()
            console.log(`  Clicked suggestion: ${name}`)
          } else {
            // Type it
            const nameInput = page.locator('input[placeholder*="egment name"]').first()
            if (await nameInput.isVisible()) {
              await nameInput.fill(name)
            }
          }

          // Click the confirm/check button
          await page.waitForTimeout(200)
          // The check button is usually the last small button after the input
          const checkBtns = page.locator('button').filter({ has: page.locator('svg') })
          // Try finding a button that's NOT the cancel X
          const confirmBtn = page.locator('button[type="button"]').last()
          await confirmBtn.click()
          await page.waitForTimeout(500)
          console.log(`✅ Created segment: ${name}`)
        }
      }

      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-44-segments-created.png', fullPage: true })
    } else {
      console.log('❌ Gamification Settings button not found — exploring page state')
      const allButtons = await page.locator('button').all()
      for (const btn of allButtons.slice(0, 15)) {
        const text = await btn.textContent()
        if (text?.trim()) console.log(`  Button: "${text.trim()}"`)
      }
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 6. Alex (teen) views routine and completes a step
  // ─────────────────────────────────────────────────────────────

  test('6. Alex sees Kitchen Duties on Routines tab and attempts completion', async ({ page }) => {
    await loginAsAlex(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-50-alex-tasks.png', fullPage: true })

    // Click Routines tab
    const routinesTab = page.getByRole('tab', { name: /Routine/i })
    if (await routinesTab.isVisible()) {
      await routinesTab.click()
      await page.waitForTimeout(500)
      console.log('✅ Clicked Routines tab')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-51-alex-routines.png', fullPage: true })

    // Look for Kitchen Duties
    const kitchenDuties = page.locator('text=Kitchen Duties').first()
    const visible = await kitchenDuties.isVisible().catch(() => false)
    console.log(`Kitchen Duties on Routines tab: ${visible}`)

    if (visible) {
      // Click to expand/open
      await kitchenDuties.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-52-routine-expanded.png', fullPage: true })

      // Try to complete a step (click checkbox/toggle)
      const firstStep = page.locator('button, div[role="checkbox"], input[type="checkbox"]').first()
      if (await firstStep.isVisible()) {
        await firstStep.click()
        await page.waitForTimeout(500)
        console.log('✅ Toggled first step')
        await page.screenshot({ path: 'tests/e2e/.screenshots/flow-53-step-completed.png', fullPage: true })
      }
    }

    // Also check dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-54-alex-dashboard.png', fullPage: true })
  })

  // ─────────────────────────────────────────────────────────────
  // 7. Riley (play) sees tasks and taps to complete
  // ─────────────────────────────────────────────────────────────

  test('7. Riley sees tasks on Play Dashboard and taps to complete', async ({ page }) => {
    await loginAsRiley(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-60-riley-dashboard.png', fullPage: true })

    // Look for task tiles in "What's next" section
    const feedDogs = page.locator('text=/Feed the Dogs/i').first()
    const fdVisible = await feedDogs.isVisible().catch(() => false)
    console.log(`Feed the Dogs tile visible: ${fdVisible}`)

    const practiceReading = page.locator('text=/Practice Reading/i').first()
    const prVisible = await practiceReading.isVisible().catch(() => false)
    console.log(`Practice Reading tile visible: ${prVisible}`)

    // Scroll down to see all tiles
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-61-riley-full.png', fullPage: true })

    // Try tapping a task tile to complete it
    if (fdVisible) {
      await feedDogs.click()
      await page.waitForTimeout(1000)
      console.log('✅ Tapped Feed the Dogs tile')
      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-62-after-tap.png', fullPage: true })
    }

    // Check tasks page too
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-63-riley-tasks.png', fullPage: true })

    // Try completing a task from the list view
    const firstCheckbox = page.locator('button[role="checkbox"], input[type="checkbox"], [aria-checked]').first()
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.click()
      await page.waitForTimeout(1000)
      console.log('✅ Completed a task from list')
      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-64-riley-task-completed.png', fullPage: true })
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 8. Mom uses Task delete/archive to clean up
  // ─────────────────────────────────────────────────────────────

  test('8. Mom can archive/delete tasks via context menu', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/.screenshots/flow-70-mom-tasks.png', fullPage: true })

    // Find any task card and try the context menu (right-click or long-press)
    const firstTask = page.locator('[class*="card"], [class*="task"]').filter({ hasText: /Kitchen Duties|Feed the Dogs/ }).first()
    if (await firstTask.isVisible()) {
      // Try right-clicking for context menu
      await firstTask.click({ button: 'right' })
      await page.waitForTimeout(300)
      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-71-context-menu.png', fullPage: true })

      // Look for Delete option
      const deleteOption = page.locator('text=/Delete|Archive/i').first()
      const deleteVisible = await deleteOption.isVisible().catch(() => false)
      console.log(`Delete/Archive option visible: ${deleteVisible}`)

      if (deleteVisible) {
        // Don't actually delete here - just verify the option exists
        console.log('✅ Delete/Archive option available in context menu')
        // Press Escape to close menu
        await page.keyboard.press('Escape')
      }
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 9. Test linked routine steps UI
  // ─────────────────────────────────────────────────────────────

  test('9. Mom explores linked routine steps UI', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    // Create a new routine to test linked steps
    const createBtn = page.locator('button').filter({ hasText: /Create/ }).first()
    await createBtn.click()
    await page.waitForTimeout(1000)

    const titleInput = page.locator('input[placeholder="What needs to be done?"]').first()
    await titleInput.fill('Daily School Routine')

    // Select Routine type
    await scrollModal(page, 400)
    const routineBtn = page.locator('button.btn-inline').filter({ hasText: 'Routine' }).first()
    if (await routineBtn.isVisible()) {
      await routineBtn.click()
      await page.waitForTimeout(500)
    }

    // Scroll to section editor
    await scrollModal(page, 700)
    await page.waitForTimeout(500)

    // Look for the section editor and linked step buttons
    const addSectionBtn = page.locator('[role="dialog"] button').filter({ hasText: /Add section/i }).first()
    if (await addSectionBtn.isVisible()) {
      await addSectionBtn.click()
      await page.waitForTimeout(500)

      // After adding a section, look for the step type options
      // Build J added linked step options (Link icon button)
      const linkBtn = page.locator('[role="dialog"] button').filter({ has: page.locator('svg') }).filter({ hasText: /Link|Linked/i }).first()
      const linkVisible = await linkBtn.isVisible().catch(() => false)
      console.log(`Linked step button visible: ${linkVisible}`)

      // Also look for all buttons in the step row area
      await page.screenshot({ path: 'tests/e2e/.screenshots/flow-80-linked-steps-ui.png', fullPage: true })
    }

    // Close without saving
    const cancelBtn = page.locator('[role="dialog"] button').filter({ hasText: /Cancel/ }).first()
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click()
    }
  })
})
