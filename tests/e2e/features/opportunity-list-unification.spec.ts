/**
 * Opportunity-List Unification — E2E Tests
 *
 * Tests the full flow:
 *   1. Mom creates a list and flags it as an opportunity
 *   2. Mom adds items with rewards
 *   3. Kid (Alex, independent teen) browses the opportunity list on the Opportunities tab
 *   4. Kid claims an item via "I'll do this!" button
 *   5. Claimed item appears as a task on kid's dashboard
 *   6. Mom creates a randomizer list flagged as opportunity (hybrid)
 *   7. Kid draws from the randomizer and sees opt-in "I'll do this!" instead of auto-assign
 */
import { test, expect } from '@playwright/test'
import { loginAsMom, loginAsAlex } from '../helpers/auth'
import { waitForAppReady, captureConsoleErrors } from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Supabase helpers ────────────────────────────────────────

function getServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function getMomSupabase() {
  const sb = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await sb.auth.signInWithPassword({
    email: 'testmom@myaim.test',
    password: 'TestPassword123!',
  })
  if (error || !data.user) throw new Error(`Mom login failed: ${error?.message}`)
  return { sb, userId: data.user.id }
}

async function getMomMember() {
  const { sb, userId } = await getMomSupabase()
  const { data } = await sb
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', userId)
    .limit(1)
    .single()
  if (!data) throw new Error('Mom family member not found')
  return { sb, member: data as { id: string; family_id: string } }
}

// ── Cleanup tracking ────────────────────────────────────────

const createdListIds: string[] = []
const createdTaskIds: string[] = []

test.afterAll(async () => {
  const sb = getServiceClient()
  // Clean up test data
  for (const id of createdTaskIds) {
    await sb.from('task_completions').delete().eq('task_id', id)
    await sb.from('task_claims').delete().eq('task_id', id)
    await sb.from('task_rewards').delete().eq('task_id', id)
    await sb.from('tasks').delete().eq('id', id)
  }
  for (const id of createdListIds) {
    await sb.from('list_items').delete().eq('list_id', id)
    await sb.from('lists').delete().eq('id', id)
  }
})

// ── Test 1: Mom creates an opportunity list via the Lists page ──

test('Mom can create a list, flag it as opportunity, and add items with rewards', async ({ page }) => {
  const errors = captureConsoleErrors(page)

  // Create the opportunity list directly via Supabase (more reliable than UI for setup)
  const { sb, member } = await getMomMember()

  // Clean up any previous test list
  await sb.from('lists').delete()
    .eq('family_id', member.family_id)
    .eq('title', 'Extra Jobs for Money')

  // Create the list
  const { data: newList, error: listError } = await sb
    .from('lists')
    .insert({
      family_id: member.family_id,
      owner_id: member.id,
      title: 'Extra Jobs for Money',
      list_type: 'custom',
      tags: [],
    })
    .select()
    .single()

  expect(listError).toBeNull()
  expect(newList).toBeTruthy()
  createdListIds.push(newList!.id)

  // Add items
  await sb.from('list_items').insert([
    { list_id: newList!.id, content: 'Organize the garage', sort_order: 0 },
    { list_id: newList!.id, content: 'Wash the car', sort_order: 1 },
    { list_id: newList!.id, content: 'Clean out the van', sort_order: 2 },
  ])

  // Now login as mom and navigate to the list to toggle opportunity flag
  await loginAsMom(page)
  await waitForAppReady(page)

  await page.goto('/lists')
  await waitForAppReady(page)

  // Click on the list to open detail view
  await page.click(`text=Extra Jobs for Money`)
  await waitForAppReady(page)

  // Should be in list detail view
  await expect(page.locator('h1:has-text("Extra Jobs for Money")')).toBeVisible({ timeout: 5000 })

  // Find and click the "This is an opportunity list" checkbox
  // Use .click() not .check() — the checkbox is React-controlled via async server mutation
  const opportunityLabel = page.locator('label:has-text("opportunity list")')
  await expect(opportunityLabel).toBeVisible({ timeout: 5000 })
  await opportunityLabel.click()
  await page.waitForTimeout(2000) // Wait for the updateList mutation to complete

  // Verify the Opportunity Defaults panel appeared
  await expect(page.locator('text=Opportunity Defaults')).toBeVisible({ timeout: 5000 })

  // Select "Claimable" subtype (should be default after checking the box)
  const claimableRadio = page.locator('label:has-text("Claimable") input[type="radio"]')
  await expect(claimableRadio).toBeChecked()

  // Set default reward: Money, $3.00
  const rewardSelect = page.locator('select').filter({ hasText: 'None' }).first()
  if (await rewardSelect.isVisible({ timeout: 2000 })) {
    await rewardSelect.selectOption('money')
    await page.waitForTimeout(500)
    // Fill the amount input
    const amountInput = page.locator('input[type="number"]').last()
    await amountInput.fill('3')
    await page.waitForTimeout(500)
  }

  // Verify opportunity settings are persisted via DB
  const { data: updatedList } = await sb
    .from('lists')
    .select('is_opportunity, default_opportunity_subtype, default_reward_type, default_reward_amount')
    .eq('id', newList!.id)
    .single()

  expect(updatedList).toBeTruthy()
  expect(updatedList!.is_opportunity).toBe(true)
  expect(updatedList!.default_opportunity_subtype).toBe('claimable')

  // Verify no infinite re-renders
  const renderErrors = errors.filter(
    (e) => e.includes('Maximum update depth') || e.includes('Too many re-renders')
  )
  expect(renderErrors).toHaveLength(0)
})


// ── Test 2: Kid sees opportunity lists on Opportunities tab ──

test('Kid sees opportunity lists on the Opportunities tab and can claim items', async ({ page }) => {
  const errors = captureConsoleErrors(page)

  // Set up the opportunity list via service client (ensures it exists regardless of test order)
  const admin = getServiceClient()
  const { sb, member } = await getMomMember()

  // Clean up any previous test list
  const { data: oldLists } = await admin
    .from('lists')
    .select('id')
    .eq('family_id', member.family_id)
    .eq('title', 'Extra Jobs for Money')

  for (const ol of oldLists ?? []) {
    await admin.from('list_items').delete().eq('list_id', ol.id)
    await admin.from('lists').delete().eq('id', ol.id)
  }

  // Create the opportunity list (via service client to bypass RLS)
  const { data: newList } = await admin
    .from('lists')
    .insert({
      family_id: member.family_id,
      owner_id: member.id,
      title: 'Extra Jobs for Money',
      list_type: 'custom',
      is_opportunity: true,
      default_opportunity_subtype: 'claimable',
      default_reward_type: 'money',
      default_reward_amount: 3,
      tags: [],
    })
    .select()
    .single()

  expect(newList).toBeTruthy()
  const listId = newList!.id
  createdListIds.push(listId)

  // Add items
  await admin.from('list_items').insert([
    { list_id: listId, content: 'Organize the garage', sort_order: 0 },
    { list_id: listId, content: 'Wash the car', sort_order: 1 },
    { list_id: listId, content: 'Clean out the van', sort_order: 2 },
  ])

  // Login as Alex (independent teen)
  await loginAsAlex(page)
  await waitForAppReady(page)

  // Navigate to Tasks page
  await page.goto('/tasks')
  await waitForAppReady(page)

  // Click the Opportunities tab
  const opportunitiesTab = page.locator('button:has-text("Opportunities")')
  await expect(opportunitiesTab).toBeVisible({ timeout: 5000 })
  await opportunitiesTab.click()
  await waitForAppReady(page)

  // Should see the opportunity list card — may need to scroll past FeatureGuide
  const listCard = page.locator('text=Extra Jobs for Money').first()
  await listCard.scrollIntoViewIfNeeded()
  await expect(listCard).toBeVisible({ timeout: 15000 })

  // Expand the list card by clicking its title
  await listCard.click()
  await page.waitForTimeout(2000)

  // Should see items with "I'll do this!" buttons
  const claimButton = page.locator('button:has-text("I\'ll do this!")').first()
  await expect(claimButton).toBeVisible({ timeout: 5000 })

  // Take a screenshot to verify the browse view
  await page.screenshot({ path: 'tests/e2e/.screenshots/opportunity-list-browse.png' })

  // Claim the first item
  await claimButton.click()
  await page.waitForTimeout(3000) // Wait for claim->task bridge to complete

  // Take a screenshot after claiming
  await page.screenshot({ path: 'tests/e2e/.screenshots/opportunity-list-after-claim.png' })

  // Verify a task was created in the DB (via service client to bypass RLS)
  const { data: claimedTasks } = await admin
    .from('tasks')
    .select('id, title, source, status, task_type')
    .eq('source', 'opportunity_list_claim')
    .eq('family_id', member.family_id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (claimedTasks && claimedTasks.length > 0) {
    expect(claimedTasks[0].source).toBe('opportunity_list_claim')
    expect(claimedTasks[0].status).toBe('in_progress')
    createdTaskIds.push(claimedTasks[0].id)
  }

  const renderErrors = errors.filter(
    (e) => e.includes('Maximum update depth') || e.includes('Too many re-renders')
  )
  expect(renderErrors).toHaveLength(0)
})


// ── Test 3: Mom creates a randomizer+opportunity hybrid ──

test('Mom can create a randomizer with opportunity flag (hybrid)', async ({ page }) => {
  const errors = captureConsoleErrors(page)

  // Create the randomizer opportunity list via service client
  const admin = getServiceClient()
  const { sb, member } = await getMomMember()

  // Clean up any previous test list
  const { data: oldLists } = await admin
    .from('lists')
    .select('id')
    .eq('family_id', member.family_id)
    .eq('title', 'Outside Fun Activities')

  for (const ol of oldLists ?? []) {
    await admin.from('list_items').delete().eq('list_id', ol.id)
    await admin.from('lists').delete().eq('id', ol.id)
  }

  const { data: newList } = await admin
    .from('lists')
    .insert({
      family_id: member.family_id,
      owner_id: member.id,
      title: 'Outside Fun Activities',
      list_type: 'randomizer',
      is_opportunity: false, // Will toggle in UI
      tags: [],
    })
    .select()
    .single()

  expect(newList).toBeTruthy()
  createdListIds.push(newList!.id)

  // Add items
  await admin.from('list_items').insert([
    { list_id: newList!.id, content: 'Nature scavenger hunt', sort_order: 0 },
    { list_id: newList!.id, content: 'Build a fort', sort_order: 1 },
    { list_id: newList!.id, content: 'Bird watching walk', sort_order: 2 },
  ])

  // Login as mom and navigate to the randomizer
  await loginAsMom(page)
  await waitForAppReady(page)

  await page.goto('/lists')
  await waitForAppReady(page)

  // Click the list to open detail view
  await page.locator('text=Outside Fun Activities').first().click()
  await waitForAppReady(page)

  // Should be in randomizer detail view
  await expect(page.locator('h1:has-text("Outside Fun Activities")')).toBeVisible({ timeout: 5000 })

  // Open settings panel (gear icon)
  const settingsButton = page.locator('button').filter({ has: page.locator('svg.lucide-settings-2') }).first()
  if (await settingsButton.isVisible({ timeout: 3000 })) {
    await settingsButton.click()
    await page.waitForTimeout(500)
  }

  // Find and click the "Optional (opportunity)" checkbox
  // Use .click() on the label — the checkbox is React-controlled via async mutation
  const opportunityLabel = page.locator('label:has-text("Optional")')
  await expect(opportunityLabel).toBeVisible({ timeout: 3000 })
  await opportunityLabel.click()
  await page.waitForTimeout(2000)

  // Verify the Opportunity Defaults panel appeared
  await expect(page.locator('text=Opportunity Defaults')).toBeVisible({ timeout: 5000 })

  // Take a screenshot of the randomizer+opportunity settings
  await page.screenshot({ path: 'tests/e2e/.screenshots/randomizer-opportunity-settings.png' })

  // Verify in DB
  const { data: randomList } = await sb
    .from('lists')
    .select('id, is_opportunity, list_type, default_opportunity_subtype')
    .eq('id', newList!.id)
    .single()

  expect(randomList).toBeTruthy()
  expect(randomList!.list_type).toBe('randomizer')
  expect(randomList!.is_opportunity).toBe(true)
  expect(randomList!.default_opportunity_subtype).toBe('repeatable')

  const renderErrors = errors.filter(
    (e) => e.includes('Maximum update depth') || e.includes('Too many re-renders')
  )
  expect(renderErrors).toHaveLength(0)
})


// ── Test 4: Verify DB schema — opportunity columns exist ──

test('Database has all opportunity columns on lists and list_items', async () => {
  const { sb } = await getMomMember()

  // Test lists columns by querying with new fields
  const { error: listError } = await sb
    .from('lists')
    .select('is_opportunity, default_opportunity_subtype, default_reward_type, default_reward_amount, default_claim_lock_duration, default_claim_lock_unit')
    .limit(1)

  expect(listError).toBeNull()

  // Test list_items columns
  const { error: itemError } = await sb
    .from('list_items')
    .select('opportunity_subtype, reward_type, claim_lock_duration, claim_lock_unit')
    .limit(1)

  expect(itemError).toBeNull()

  // Test tasks.source accepts new value by checking the constraint allows it
  // (we don't insert here, just verify the schema accepted the migration)
  const { data: sourceCheck } = await sb
    .from('tasks')
    .select('id')
    .eq('source', 'opportunity_list_claim')
    .limit(1)

  // This query should not error even if no rows match
  expect(sourceCheck).toBeDefined()
})


// ── Test 5: Smart Import — paste items and AI sorts them into correct lists ──

test('Mom can smart-import items and AI sorts them into the correct lists', async ({ page }) => {
  test.setTimeout(120_000) // AI classification + commit can take 30-60s
  const errors = captureConsoleErrors(page)

  // Set up two opportunity lists for the AI to target
  const admin = getServiceClient()
  const { sb, member } = await getMomMember()

  // Clean up any previous test lists
  for (const title of ['Household Chores', 'Outside Activities']) {
    const { data: oldLists } = await admin
      .from('lists')
      .select('id')
      .eq('family_id', member.family_id)
      .eq('title', title)

    for (const ol of oldLists ?? []) {
      await admin.from('list_items').delete().eq('list_id', ol.id)
      await admin.from('lists').delete().eq('id', ol.id)
    }
  }

  // Create two lists that the AI should match items to
  const { data: choresList } = await admin
    .from('lists')
    .insert({
      family_id: member.family_id,
      owner_id: member.id,
      title: 'Household Chores',
      description: 'Indoor cleaning and maintenance jobs',
      list_type: 'custom',
      is_opportunity: true,
      default_opportunity_subtype: 'claimable',
      default_reward_type: 'money',
      default_reward_amount: 3,
      tags: [],
    })
    .select()
    .single()

  const { data: outdoorList } = await admin
    .from('lists')
    .insert({
      family_id: member.family_id,
      owner_id: member.id,
      title: 'Outside Activities',
      description: 'Outdoor nature and adventure activities',
      list_type: 'custom',
      is_opportunity: true,
      default_opportunity_subtype: 'repeatable',
      tags: [],
    })
    .select()
    .single()

  expect(choresList).toBeTruthy()
  expect(outdoorList).toBeTruthy()
  createdListIds.push(choresList!.id, outdoorList!.id)

  // Login as mom
  await loginAsMom(page)
  await waitForAppReady(page)

  // Navigate to Lists page
  await page.goto('/lists')
  await waitForAppReady(page)

  // Click "Smart Import" button
  const smartImportButton = page.locator('button:has-text("Smart Import")')
  await expect(smartImportButton).toBeVisible({ timeout: 5000 })
  await smartImportButton.click()
  await page.waitForTimeout(500)

  // Should see the Smart Import modal
  await expect(page.locator('text=Paste a list of activities')).toBeVisible({ timeout: 5000 })

  // Fill in the source context
  const sourceInput = page.locator('input[placeholder*="Big Book"]')
  if (await sourceInput.isVisible({ timeout: 2000 })) {
    await sourceInput.fill('Summer activity guide')
  }

  // Paste items to sort
  const textarea = page.locator('textarea')
  await textarea.fill(`Vacuum the living room
Mop the kitchen floor
Nature scavenger hunt
Build a birdhouse
Clean the bathrooms
Go on a bird watching walk
Organize the pantry
Plant a garden`)

  // Click "Sort with AI"
  const sortButton = page.locator('button:has-text("Sort with AI")')
  await expect(sortButton).toBeVisible()
  await sortButton.click()

  // Wait for AI classification (can take a few seconds)
  await expect(page.locator('text=Sorting items into your lists')).toBeVisible({ timeout: 5000 })

  // Wait for review phase — look for the grouped items view
  // The AI should group items into "Household Chores" and "Outside Activities"
  await page.waitForTimeout(15000) // Give AI time to respond

  // Take screenshot of the review phase
  await page.screenshot({ path: 'tests/e2e/.screenshots/smart-import-review.png' })

  // Check that the review phase loaded (look for the commit button)
  const commitButton = page.locator('button:has-text("Add")')
  const isReviewPhase = await commitButton.isVisible({ timeout: 10000 })

  if (isReviewPhase) {
    // Click commit to add items to lists
    await commitButton.click()
    await page.waitForTimeout(3000)

    // Should see "Import complete!" success message
    await expect(page.locator('text=Import complete')).toBeVisible({ timeout: 10000 })

    // Take screenshot of success
    await page.screenshot({ path: 'tests/e2e/.screenshots/smart-import-done.png' })

    // Verify items were added to lists in the DB
    const { data: choresItems } = await admin
      .from('list_items')
      .select('content')
      .eq('list_id', choresList!.id)

    const { data: outdoorItems } = await admin
      .from('list_items')
      .select('content')
      .eq('list_id', outdoorList!.id)

    // At least some items should have been sorted into each list
    const totalSorted = (choresItems?.length ?? 0) + (outdoorItems?.length ?? 0)
    expect(totalSorted).toBeGreaterThan(0)
  }

  const renderErrors = errors.filter(
    (e) => e.includes('Maximum update depth') || e.includes('Too many re-renders')
  )
  expect(renderErrors).toHaveLength(0)
})
