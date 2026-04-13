/**
 * E2E Test: Mom Creates Routines, Randomizers, and Play Child Content
 *
 * Tests the full creation flow through the UI as if a real mom user:
 * 1. Kitchen chore routine assigned to teen (Alex) for a week
 * 2. Consequence spinner (randomizer) for all kids
 * 3. Play child (Riley) daily recurring tasks
 * 4. Sequential phonics list for Riley
 *
 * Then tests as teen and play user to verify their experience.
 */
import { test, expect } from '@playwright/test'
import { loginAsMom, loginAsAlex, loginAsRiley } from '../helpers/auth'

// Helper to scroll inside a ModalV2 dialog — the scrollable container is the
// .overflow-y-auto child inside [role="dialog"], NOT the dialog itself.
async function scrollModalDown(page: import('@playwright/test').Page) {
  const scrollable = page.locator('[role="dialog"] .overflow-y-auto').first()
  if (await scrollable.isVisible()) {
    await scrollable.evaluate(el => el.scrollTop = el.scrollHeight)
    await page.waitForTimeout(300)
  }
}

async function scrollModalTo(page: import('@playwright/test').Page, position: number) {
  const scrollable = page.locator('[role="dialog"] .overflow-y-auto').first()
  if (await scrollable.isVisible()) {
    await scrollable.evaluate((el, pos) => el.scrollTop = pos, position)
    await page.waitForTimeout(300)
  }
}

// ─────────────────────────────────────────────────────────────
// PART 1: Mom creates a kitchen chore routine
// ─────────────────────────────────────────────────────────────

test.describe('Mom creates kitchen chore routine', () => {
  test('create routine with daily and weekly sections, assign to Alex', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    // Screenshot starting state
    await page.screenshot({ path: 'tests/e2e/.screenshots/01-tasks-page-start.png', fullPage: true })

    // Click "+ Create" button to open TaskCreationModal
    const createBtn = page.locator('button').filter({ hasText: /Create/ }).first()
    await createBtn.click()
    await page.waitForTimeout(1000)

    await page.screenshot({ path: 'tests/e2e/.screenshots/02-modal-opened.png', fullPage: true })

    // The modal defaults to Full mode. Fill in the title first.
    const titleInput = page.locator('input[placeholder="What needs to be done?"]').first()
    await titleInput.fill('Kitchen Duties')

    // Fill description
    const descInput = page.locator('textarea[placeholder="Describe what needs to be done..."]')
    if (await descInput.isVisible()) {
      await descInput.fill('Weekly kitchen cleaning routine - daily basics plus weekly deep clean')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/03-title-filled.png', fullPage: true })

    // Scroll down to find the Task Type section
    await scrollModalTo(page, 400)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/e2e/.screenshots/04-task-type-area.png', fullPage: true })

    // Click "Routine" in the 2x2 task type grid
    // The buttons contain text "Routine" with description "Multi-step checklist with sections"
    const routineBtn = page.locator('button.btn-inline').filter({ hasText: 'Routine' }).first()
    if (await routineBtn.isVisible()) {
      await routineBtn.click()
      await page.waitForTimeout(500)
      console.log('✅ Clicked Routine type button')
    } else {
      console.log('❌ Routine type button not found — looking for alternatives')
      // Try any element with Routine text
      const altRoutine = page.locator('text=Routine').first()
      if (await altRoutine.isVisible()) {
        await altRoutine.click()
        await page.waitForTimeout(500)
      }
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/05-routine-selected.png', fullPage: true })

    // Scroll further to find the Routine Section Editor
    await scrollModalTo(page, 800)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/e2e/.screenshots/06-routine-section-editor.png', fullPage: true })

    // Look for the RoutineSectionEditor area
    // It should have section name inputs and step inputs
    // Take a full scrollable screenshot to see what's rendered
    await scrollModalDown(page)
    await page.screenshot({ path: 'tests/e2e/.screenshots/07-modal-bottom.png', fullPage: true })

    // Try scrolling back up to where the section editor should be (after task type)
    await scrollModalTo(page, 600)
    await page.screenshot({ path: 'tests/e2e/.screenshots/08-mid-modal.png', fullPage: true })

    // Try finding section-related elements
    const sectionElements = await page.locator('text=/Section|section name|Add Section|Add Step/i').all()
    console.log(`Found ${sectionElements.length} section-related elements`)
    for (const el of sectionElements.slice(0, 5)) {
      const text = await el.textContent()
      console.log(`  Section element: "${text}"`)
    }

    // Try finding all input fields in the modal to understand what's there
    const allInputs = await page.locator('[role="dialog"] input').all()
    console.log(`Found ${allInputs.length} inputs in modal:`)
    for (const inp of allInputs.slice(0, 10)) {
      const placeholder = await inp.getAttribute('placeholder')
      const value = await inp.getAttribute('value')
      console.log(`  Input: placeholder="${placeholder}" value="${value}"`)
    }

    // Try finding all buttons
    const allButtons = await page.locator('[role="dialog"] button').all()
    console.log(`Found ${allButtons.length} buttons in modal:`)
    for (const btn of allButtons.slice(0, 15)) {
      const text = await btn.textContent()
      const visible = await btn.isVisible()
      if (visible && text && text.trim()) {
        console.log(`  Button: "${text.trim()}"`)
      }
    }

    // ASSIGNMENT SECTION: Scroll to find member assignment area
    await scrollModalTo(page, 1200)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/e2e/.screenshots/09-assignment-area.png', fullPage: true })

    // Look for Alex in member assignment
    const alexElement = page.locator('button, label, span, div').filter({ hasText: /^Alex$/ }).first()
    const alexVisible = await alexElement.isVisible().catch(() => false)
    console.log(`Alex assignment button visible: ${alexVisible}`)
    if (alexVisible) {
      await alexElement.click()
      console.log('✅ Assigned to Alex')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/10-assigned-alex.png', fullPage: true })

    // SCHEDULE: Look for schedule/recurrence options
    await scrollModalTo(page, 1600)
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/e2e/.screenshots/11-schedule-area.png', fullPage: true })

    // Set schedule to Daily
    const dailyRadio = page.locator('button.btn-inline, label, div[role="radio"]').filter({ hasText: /^Daily$/ }).first()
    if (await dailyRadio.isVisible()) {
      await dailyRadio.click()
      console.log('✅ Set schedule to Daily')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/12-schedule-daily.png', fullPage: true })

    // SAVE: Find and click the Create/Save button
    await scrollModalDown(page)
    await page.waitForTimeout(300)

    const saveBtn = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
      console.log('✅ Clicked Save/Create')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/13-after-save.png', fullPage: true })

    // Verify task appears
    const taskVisible = await page.locator('text=Kitchen Duties').isVisible().catch(() => false)
    console.log(`Kitchen Duties visible after save: ${taskVisible}`)
  })
})

// ─────────────────────────────────────────────────────────────
// PART 2: Mom creates consequence spinner (randomizer)
// ─────────────────────────────────────────────────────────────

test.describe('Mom creates consequence spinner randomizer', () => {
  test('create randomizer list with consequence jobs', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'tests/e2e/.screenshots/20-lists-page.png', fullPage: true })

    // Find the create/new list button
    const newListBtn = page.locator('button').filter({ hasText: /New List|Create|\+/ }).first()
    await newListBtn.click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'tests/e2e/.screenshots/21-type-picker.png', fullPage: true })

    // Look for what appeared - could be a type picker modal/dropdown
    // Find and click Randomizer type
    const randomizerTile = page.locator('button, div[role="button"], label, a').filter({ hasText: /Randomizer/ }).first()
    const randVisible = await randomizerTile.isVisible().catch(() => false)
    console.log(`Randomizer tile visible: ${randVisible}`)

    if (randVisible) {
      await randomizerTile.click()
      await page.waitForTimeout(500)
      console.log('✅ Clicked Randomizer type')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/22-randomizer-selected.png', fullPage: true })

    // Fill in the list name
    const nameInputs = await page.locator('input[type="text"]').all()
    console.log(`Found ${nameInputs.length} text inputs after randomizer selection`)
    for (const inp of nameInputs.slice(0, 5)) {
      const ph = await inp.getAttribute('placeholder')
      console.log(`  Input placeholder: "${ph}"`)
    }

    // Try to find the name field
    const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="title" i], input[placeholder*="list" i]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Consequence Spinner')
      console.log('✅ Filled list name')
    }

    // Confirm creation
    const confirmBtn = page.locator('button').filter({ hasText: /Create|Save|OK|Done/ }).first()
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
      await page.waitForTimeout(1000)
      console.log('✅ Confirmed list creation')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/23-randomizer-detail.png', fullPage: true })

    // Now add items to the randomizer
    const consequenceJobs = [
      'Scrub the toilet',
      'Vacuum the living room',
      'Wipe bathroom mirror',
      'Organize shoe rack',
      'Dust the bookshelf',
      'Clean windows in your room',
      'Sort the recycling',
      'Weed garden bed',
      'Fold laundry',
      'Clean out the car'
    ]

    // Find the add item input area
    const addInput = page.locator('input[placeholder*="Add" i], input[placeholder*="item" i], input[placeholder*="new" i]').first()
    if (await addInput.isVisible()) {
      for (const job of consequenceJobs) {
        await addInput.fill(job)
        await addInput.press('Enter')
        await page.waitForTimeout(300)
      }
      console.log(`✅ Added ${consequenceJobs.length} consequence jobs`)
    } else {
      console.log('❌ Could not find add item input — trying alternative methods')
      // Maybe there's an "Add Item" button
      const addBtn = page.locator('button').filter({ hasText: /Add|add item|\+/ }).first()
      if (await addBtn.isVisible()) {
        console.log('Found add button, using it...')
      }
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/24-items-added.png', fullPage: true })

    // Try the spinner/draw
    const drawBtn = page.locator('button').filter({ hasText: /Draw|Spin/ }).first()
    if (await drawBtn.isVisible()) {
      await drawBtn.click()
      await page.waitForTimeout(3000) // Wait for spinner animation
      console.log('✅ Triggered spinner draw')
      await page.screenshot({ path: 'tests/e2e/.screenshots/25-spinner-result.png', fullPage: true })
    }
  })
})

// ─────────────────────────────────────────────────────────────
// PART 3: Mom creates daily "Feed the Dogs" task for Riley
// ─────────────────────────────────────────────────────────────

test.describe('Mom creates tasks for Riley', () => {
  test('create daily Feed the Dogs task', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    const createBtn = page.locator('button').filter({ hasText: /Create/ }).first()
    await createBtn.click()
    await page.waitForTimeout(1000)

    // Fill title
    const titleInput = page.locator('input[placeholder="What needs to be done?"]').first()
    await titleInput.fill('Feed the Dogs')

    // Scroll to schedule section and set to Daily
    await scrollModalTo(page, 1000)
    await page.waitForTimeout(300)

    const dailyRadio = page.locator('button.btn-inline, label').filter({ hasText: /^Daily$/ }).first()
    if (await dailyRadio.isVisible()) {
      await dailyRadio.click()
      console.log('✅ Set to Daily')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/30-feed-dogs-daily.png', fullPage: true })

    // Scroll to assignment and select Riley
    await scrollModalTo(page, 1400)
    await page.waitForTimeout(300)

    const rileyBtn = page.locator('button, label, span').filter({ hasText: /^Riley$/ }).first()
    if (await rileyBtn.isVisible()) {
      await rileyBtn.click()
      console.log('✅ Assigned to Riley')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/31-feed-dogs-riley.png', fullPage: true })

    // Save
    await scrollModalDown(page)
    const saveBtn = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
      console.log('✅ Saved Feed the Dogs')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/32-feed-dogs-saved.png', fullPage: true })
  })

  test('create daily Practice Reading task', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')

    const createBtn = page.locator('button').filter({ hasText: /Create/ }).first()
    await createBtn.click()
    await page.waitForTimeout(1000)

    const titleInput = page.locator('input[placeholder="What needs to be done?"]').first()
    await titleInput.fill('Practice Reading (15 minutes)')

    // Set to Daily
    await scrollModalTo(page, 1000)
    const dailyRadio = page.locator('button.btn-inline, label').filter({ hasText: /^Daily$/ }).first()
    if (await dailyRadio.isVisible()) {
      await dailyRadio.click()
    }

    // Assign to Riley
    await scrollModalTo(page, 1400)
    const rileyBtn = page.locator('button, label, span').filter({ hasText: /^Riley$/ }).first()
    if (await rileyBtn.isVisible()) {
      await rileyBtn.click()
    }

    await scrollModalDown(page)
    const saveBtn = page.locator('[role="dialog"] button').filter({ hasText: /Create Task|Save/ }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
      console.log('✅ Saved Practice Reading')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/33-practice-reading-saved.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────────────────────
// PART 4: Mom creates randomized jobs list for Riley
// ─────────────────────────────────────────────────────────────

test.describe('Mom creates randomized jobs for Riley', () => {
  test('create kids job randomizer', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')

    const newListBtn = page.locator('button').filter({ hasText: /New List|Create|\+/ }).first()
    await newListBtn.click()
    await page.waitForTimeout(500)

    // Select Randomizer
    const randTile = page.locator('button, div[role="button"], label, a').filter({ hasText: /Randomizer/ }).first()
    if (await randTile.isVisible()) {
      await randTile.click()
      await page.waitForTimeout(500)
    }

    // Name it
    const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="title" i], input[placeholder*="list" i]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill("Riley's Little Helper Jobs")
    }

    const confirmBtn = page.locator('button').filter({ hasText: /Create|Save|OK/ }).first()
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
      await page.waitForTimeout(1000)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/40-riley-jobs-randomizer.png', fullPage: true })

    // Add age-appropriate items
    const kidsJobs = [
      'Put toys in the toy bin',
      'Help set the table',
      'Wipe the table',
      'Water the plants',
      'Pick up sticks in yard',
      'Sort socks from laundry',
      'Put books on the shelf',
      'Sweep with small broom',
      'Carry dishes to sink',
      'Tidy the shoe basket'
    ]

    const addInput = page.locator('input[placeholder*="Add" i], input[placeholder*="item" i], input[placeholder*="new" i]').first()
    if (await addInput.isVisible()) {
      for (const job of kidsJobs) {
        await addInput.fill(job)
        await addInput.press('Enter')
        await page.waitForTimeout(200)
      }
      console.log(`✅ Added ${kidsJobs.length} kids jobs`)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/41-riley-jobs-items.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────────────────────
// PART 5: Mom creates reading activities randomizer for Riley
// ─────────────────────────────────────────────────────────────

test.describe('Mom creates reading activities randomizer', () => {
  test('create reading/letter activities randomizer', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')

    const newListBtn = page.locator('button').filter({ hasText: /New List|Create|\+/ }).first()
    await newListBtn.click()
    await page.waitForTimeout(500)

    const randTile = page.locator('button, div[role="button"], label, a').filter({ hasText: /Randomizer/ }).first()
    if (await randTile.isVisible()) {
      await randTile.click()
      await page.waitForTimeout(500)
    }

    const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="title" i], input[placeholder*="list" i]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill("Riley's Reading & Letter Fun")
    }

    const confirmBtn = page.locator('button').filter({ hasText: /Create|Save|OK/ }).first()
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
      await page.waitForTimeout(1000)
    }

    const readingActivities = [
      'Trace letters A-E with finger paint',
      'Find 5 things starting with letter B',
      'Read a picture book with mom',
      'Practice writing your name',
      'Sound out CVC words (cat, dog, sun)',
      'Letter matching flashcard game',
      'Circle letter S on magazine page',
      'Listen to audiobook 10 minutes',
      'Draw pictures for a story',
      'Play letter bingo'
    ]

    const addInput = page.locator('input[placeholder*="Add" i], input[placeholder*="item" i], input[placeholder*="new" i]').first()
    if (await addInput.isVisible()) {
      for (const activity of readingActivities) {
        await addInput.fill(activity)
        await addInput.press('Enter')
        await page.waitForTimeout(200)
      }
      console.log(`✅ Added ${readingActivities.length} reading activities`)
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/50-reading-activities.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────────────────────
// PART 6: Mom creates sequential phonics list for Riley
// ─────────────────────────────────────────────────────────────

test.describe('Mom creates sequential phonics list', () => {
  test('create sequential collection from Lists page', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/lists')
    await page.waitForLoadState('networkidle')

    const newListBtn = page.locator('button').filter({ hasText: /New List|Create|\+/ }).first()
    await newListBtn.click()
    await page.waitForTimeout(500)

    await page.screenshot({ path: 'tests/e2e/.screenshots/60-type-picker-for-seq.png', fullPage: true })

    // Look for Sequential option
    const seqTile = page.locator('button, div[role="button"], label, a').filter({ hasText: /Sequential/ }).first()
    const seqVisible = await seqTile.isVisible().catch(() => false)
    console.log(`Sequential tile visible: ${seqVisible}`)

    if (seqVisible) {
      await seqTile.click()
      await page.waitForTimeout(1000)
      console.log('✅ Clicked Sequential')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/61-sequential-modal.png', fullPage: true })

    // The SequentialCreatorModal is now open. It has:
    // 1. "Who is this for?" member pills at the top
    // 2. Collection Title input (placeholder: "e.g., Saxon Math 5 — Chapters")
    // 3. Input Method (Manual/URL/Image tabs)
    // 4. Textarea for items (paste mode)
    // 5. "Create Collection" button

    // Step 1: Select Riley in the "Who is this for?" section (inside the modal)
    // The pills are inside [role="dialog"] — must scope to the modal
    const modalRileyBtn = page.locator('[role="dialog"] button').filter({ hasText: /^Riley$/ }).first()
    if (await modalRileyBtn.isVisible()) {
      await modalRileyBtn.click()
      await page.waitForTimeout(300)
      console.log('✅ Selected Riley in modal assignee picker')
    } else {
      console.log('❌ Riley button not found inside modal')
      // List all buttons in the modal for debugging
      const modalButtons = await page.locator('[role="dialog"] button').all()
      for (const btn of modalButtons.slice(0, 10)) {
        const text = await btn.textContent()
        if (text?.trim()) console.log(`  Modal button: "${text.trim()}"`)
      }
    }

    // Step 2: Fill the Collection Title (specific placeholder from SequentialCreator)
    const titleInput = page.locator('[role="dialog"] input[placeholder*="Saxon"]').first()
    if (await titleInput.isVisible()) {
      await titleInput.fill("Riley's Phonics Journey")
      console.log('✅ Filled phonics title')
    } else {
      // Fallback: find any text input inside the modal that isn't the number input
      const modalTextInputs = page.locator('[role="dialog"] input[type="text"]')
      const count = await modalTextInputs.count()
      console.log(`Found ${count} text inputs in modal`)
      if (count > 0) {
        // The first text input in the modal should be the title
        await modalTextInputs.first().fill("Riley's Phonics Journey")
        console.log('✅ Filled phonics title (fallback)')
      }
    }

    // Step 3: Fill the items textarea with phonics lessons
    const itemsTextarea = page.locator('[role="dialog"] textarea').first()
    if (await itemsTextarea.isVisible()) {
      const phonicsLessons = [
        'Lesson 1: Letter sounds A-F',
        'Lesson 2: Letter sounds G-L',
        'Lesson 3: Letter sounds M-R',
        'Lesson 4: Letter sounds S-Z',
        'Lesson 5: Short vowels (a, e, i, o, u)',
        'Lesson 6: Consonant blends (bl, cl, fl)',
        'Lesson 7: Consonant blends (br, cr, dr)',
        'Lesson 8: Digraphs (ch, sh, th)',
        'Lesson 9: Long vowels with silent e',
        'Lesson 10: Reading simple sentences'
      ]
      await itemsTextarea.fill(phonicsLessons.join('\n'))
      console.log('✅ Filled phonics lessons')
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/62-phonics-items.png', fullPage: true })

    // Step 4: Click "Create Collection" button — must be inside the modal
    await page.waitForTimeout(500) // Let React re-render after state changes
    const createBtn2 = page.locator('[role="dialog"] button').filter({ hasText: /Create Collection/ }).first()
    const isEnabled = await createBtn2.isEnabled()
    console.log(`Create Collection button enabled: ${isEnabled}`)

    if (isEnabled) {
      await createBtn2.click()
      await page.waitForTimeout(2000)
      console.log('✅ Saved phonics sequential')
    } else {
      // Debug: check what's missing
      const titleVal = await page.locator('[role="dialog"] input[type="text"]').first().inputValue()
      console.log(`Title value: "${titleVal}"`)
      const btnText = await createBtn2.textContent()
      console.log(`Button text: "${btnText}"`)

      // Try clicking anyway after a longer wait
      await page.waitForTimeout(1000)
      const isEnabled2 = await createBtn2.isEnabled()
      console.log(`After extra wait, button enabled: ${isEnabled2}`)
      if (isEnabled2) {
        await createBtn2.click()
        await page.waitForTimeout(2000)
        console.log('✅ Saved phonics sequential (after retry)')
      } else {
        console.log('❌ Create Collection button still disabled')
      }
    }

    await page.screenshot({ path: 'tests/e2e/.screenshots/64-phonics-saved.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────────────────────
// PART 7: Test as Teen (Alex) — verify assigned tasks
// ─────────────────────────────────────────────────────────────

test.describe('Teen Alex views their tasks', () => {
  test('Alex sees assigned content', async ({ page }) => {
    await loginAsAlex(page)

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/.screenshots/70-alex-dashboard.png', fullPage: true })

    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/.screenshots/71-alex-tasks.png', fullPage: true })

    // Look for Kitchen Duties
    const kitchenDuties = page.locator('text=Kitchen Duties')
    const visible = await kitchenDuties.isVisible().catch(() => false)
    console.log(`Kitchen Duties visible for Alex: ${visible}`)

    // Look at what's on the page
    const taskCards = await page.locator('[class*="task"], [class*="card"]').all()
    console.log(`Found ${taskCards.length} task/card elements on Alex's tasks page`)

    // Try clicking on any task to see detail
    const firstTask = page.locator('div, li, button').filter({ hasText: /Kitchen|task/i }).first()
    if (await firstTask.isVisible()) {
      await firstTask.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'tests/e2e/.screenshots/72-alex-task-detail.png', fullPage: true })
    }
  })
})

// ─────────────────────────────────────────────────────────────
// PART 8: Test as Play user (Riley) — verify play dashboard
// ─────────────────────────────────────────────────────────────

test.describe('Play user Riley views their dashboard', () => {
  test('Riley sees tasks on Play Dashboard', async ({ page }) => {
    await loginAsRiley(page)

    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/.screenshots/80-riley-play-dashboard.png', fullPage: true })

    // Check what's visible on the play dashboard
    const feedDogs = page.locator('text=/Feed the Dogs/i')
    const feedDogsVisible = await feedDogs.isVisible().catch(() => false)
    console.log(`Feed the Dogs visible for Riley: ${feedDogsVisible}`)

    const practiceReading = page.locator('text=/Practice Reading/i')
    const readingVisible = await practiceReading.isVisible().catch(() => false)
    console.log(`Practice Reading visible for Riley: ${readingVisible}`)

    // Check for the sticker book widget
    const stickerBook = page.locator('text=/Sticker|sticker/i')
    const stickerVisible = await stickerBook.isVisible().catch(() => false)
    console.log(`Sticker book visible: ${stickerVisible}`)

    // Scroll down to see all content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'tests/e2e/.screenshots/81-riley-dashboard-full.png', fullPage: true })

    // Navigate to tasks
    await page.goto('/tasks')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/.screenshots/82-riley-tasks.png', fullPage: true })

    // Check the bottom navigation
    const bottomNav = page.locator('nav, [role="navigation"]').last()
    if (await bottomNav.isVisible()) {
      await page.screenshot({ path: 'tests/e2e/.screenshots/83-riley-bottom-nav.png' })
    }
  })
})

// ─────────────────────────────────────────────────────────────
// PART 9: Mom checks gamification / segments settings for Riley
// ─────────────────────────────────────────────────────────────

test.describe('Mom manages segments for Riley', () => {
  test('explore gamification settings path', async ({ page }) => {
    await loginAsMom(page)

    // Try the settings page
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'tests/e2e/.screenshots/90-settings-page.png', fullPage: true })

    // Look for family members section or Riley specifically
    const allText = await page.locator('body').textContent()
    const hasRiley = allText?.includes('Riley')
    console.log(`Settings page has Riley: ${hasRiley}`)

    // Look for gamification-related buttons/links
    const gamButtons = await page.locator('button, a, div').filter({ hasText: /Gamification|Play|Segment|Sticker/ }).all()
    console.log(`Found ${gamButtons.length} gamification-related elements`)
    for (const btn of gamButtons.slice(0, 5)) {
      const text = await btn.textContent()
      console.log(`  Gamification element: "${text?.trim()}"`)
    }

    // Click on Riley if available
    const rileyBtn = page.locator('button, a, div, li').filter({ hasText: /Riley/ }).first()
    if (await rileyBtn.isVisible()) {
      await rileyBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'tests/e2e/.screenshots/91-riley-member-settings.png', fullPage: true })
    }

    // Try to find and open gamification settings
    const gamifBtn = page.locator('button, a').filter({ hasText: /Gamification|Play Settings|Segments/ }).first()
    if (await gamifBtn.isVisible()) {
      await gamifBtn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: 'tests/e2e/.screenshots/92-gamification-modal.png', fullPage: true })

      // Look for the Day Segments section
      const segmentsSection = page.locator('text=/Day Segment/i')
      if (await segmentsSection.isVisible()) {
        await segmentsSection.click()
        await page.waitForTimeout(300)
        await page.screenshot({ path: 'tests/e2e/.screenshots/93-segments-section.png', fullPage: true })
      }
    }
  })
})
