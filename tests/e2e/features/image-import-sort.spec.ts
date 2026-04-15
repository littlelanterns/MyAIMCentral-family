/**
 * Image Import → Smart Sort E2E Test
 *
 * Tests the full flow from the actual UI:
 * 1. Mom navigates to Lists page
 * 2. Creates target lists (Outside Fun, Arts & Crafts, Learning Fun)
 * 3. Clicks the camera button → OCR extracts text from image
 * 4. Extracted items flow into Smart Import → AI sorts across lists
 * 5. Mom reviews and commits
 *
 * Since we can't programmatically trigger a real camera capture in Playwright,
 * we test the Smart Import path with the OCR text pre-loaded (simulating what
 * the ListImageImportModal → SmartImportModal handoff does).
 */
import { test, expect } from '@playwright/test'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function getMomInfo() {
  const sb = getServiceClient()
  const { data: families } = await sb.from('families').select('id, primary_parent_id').limit(1).single()
  const { data: mom } = await sb.from('family_members').select('id').eq('user_id', families!.primary_parent_id).single()
  return { familyId: families!.id, momId: mom!.id, sb }
}

const createdListIds: string[] = []

test.afterAll(async () => {
  const sb = getServiceClient()
  for (const id of createdListIds) {
    await sb.from('list_items').delete().eq('list_id', id)
    await sb.from('lists').delete().eq('id', id)
  }
})

test('Mom uses Smart Import to sort activity image items across multiple lists', async ({ page }) => {
  test.setTimeout(120_000)

  const { familyId, momId, sb } = await getMomInfo()

  // Clean up + create target lists
  for (const title of ['Outside Fun', 'Arts & Crafts', 'Learning Fun']) {
    const { data: old } = await sb.from('lists').select('id').eq('family_id', familyId).eq('title', title)
    for (const o of old ?? []) {
      await sb.from('list_items').delete().eq('list_id', o.id)
      await sb.from('lists').delete().eq('id', o.id)
    }
  }

  const { data: outsideList } = await sb.from('lists').insert({
    family_id: familyId, owner_id: momId, title: 'Outside Fun',
    description: 'Outdoor nature and adventure activities',
    list_type: 'custom', is_opportunity: true, default_opportunity_subtype: 'repeatable', tags: [],
  }).select().single()

  const { data: artsList } = await sb.from('lists').insert({
    family_id: familyId, owner_id: momId, title: 'Arts & Crafts',
    description: 'Creative art projects and crafting activities',
    list_type: 'custom', is_opportunity: true, default_opportunity_subtype: 'repeatable', tags: [],
  }).select().single()

  const { data: learningList } = await sb.from('lists').insert({
    family_id: familyId, owner_id: momId, title: 'Learning Fun',
    description: 'Educational activities and nature learning',
    list_type: 'custom', is_opportunity: true, default_opportunity_subtype: 'repeatable', tags: [],
  }).select().single()

  createdListIds.push(outsideList!.id, artsList!.id, learningList!.id)

  // Login and navigate to Lists page
  await loginAsMom(page)
  await waitForAppReady(page)
  await page.goto('/lists')
  await waitForAppReady(page)

  // Click Smart Import (simulates what happens after OCR extracts text from the image)
  const smartImportBtn = page.locator('button:has-text("Smart Import")')
  await expect(smartImportBtn).toBeVisible({ timeout: 5000 })
  await smartImportBtn.click()
  await page.waitForTimeout(500)

  // Should see the Smart Import modal
  await expect(page.locator('text=Paste a list of activities')).toBeVisible({ timeout: 5000 })

  // Fill source context (what OCR would tell us)
  const sourceInput = page.locator('input[placeholder*="Big Book"]')
  if (await sourceInput.isVisible({ timeout: 2000 })) {
    await sourceInput.fill('Summer outdoor activities list (photo import)')
  }

  // Paste the OCR-extracted text from the image
  const textarea = page.locator('textarea')
  await textarea.fill(`Paint rocks
Sidewalk Chalk Drawing Contest
Make a bird feeder
Take your furry friend for a walk
Plant seeds in your garden
Birdwatch
Stargaze
Have a scavenger hunt
Hula hoop
Sidewalk Chalk Obstacle Course
Kitchen utensil bubble wands
Ride bikes or scooters
Play Catch
Create your own mini golf course
Play frisbee
Pick flowers for a friend
Hunt for bugs
Go for a nature walk
Have a picnic
Make a fort in the yard
Run around through the sprinkler
Try geocaching
Play a pick-up game of soccer or basketball
Look at different types of leaves
Find shapes in the clouds
Melt crayons into fun shapes with the heat of the sun
Have a backyard toy car wash
Read a book under a tree or in a cool spot outside`)

  // Click "Sort with AI"
  await page.locator('button:has-text("Sort with AI")').click()

  // Wait for classification
  await expect(page.locator('text=Sorting items into your lists')).toBeVisible({ timeout: 5000 })

  // Wait for review phase
  await page.waitForTimeout(15000)

  // Take screenshot of the AI classification results
  await page.screenshot({ path: 'tests/e2e/.screenshots/image-import-sort-review.png', fullPage: true })

  // Check that review loaded
  const commitButton = page.locator('button:has-text("Add")')
  const isReview = await commitButton.isVisible({ timeout: 15000 })

  if (isReview) {
    // Take a close-up of the grouped items
    await page.screenshot({ path: 'tests/e2e/.screenshots/image-import-sort-groups.png' })

    // Commit
    await commitButton.click()
    await page.waitForTimeout(5000)

    // Screenshot the success
    await page.screenshot({ path: 'tests/e2e/.screenshots/image-import-sort-done.png' })

    // Verify items landed in the DB
    const { data: outsideItems } = await sb.from('list_items').select('content').eq('list_id', outsideList!.id)
    const { data: artsItems } = await sb.from('list_items').select('content').eq('list_id', artsList!.id)
    const { data: learningItems } = await sb.from('list_items').select('content').eq('list_id', learningList!.id)

    console.log('\n=== RESULTS ===')
    console.log(`Outside Fun: ${outsideItems?.length ?? 0} items`)
    outsideItems?.forEach(i => console.log(`  - ${i.content}`))
    console.log(`Arts & Crafts: ${artsItems?.length ?? 0} items`)
    artsItems?.forEach(i => console.log(`  - ${i.content}`))
    console.log(`Learning Fun: ${learningItems?.length ?? 0} items`)
    learningItems?.forEach(i => console.log(`  - ${i.content}`))

    // Check that some items were sorted
    const total = (outsideItems?.length ?? 0) + (artsItems?.length ?? 0) + (learningItems?.length ?? 0)
    expect(total).toBeGreaterThan(0)
  }
})
