/**
 * PRD-42 KitchenCompass, Phase A — end-to-end pins
 *
 * Covers (per the active build file's PROOF list):
 *  1. Recipe Box displays a captured recipe + keyword search finds it
 *  2. Recipe Detail: client-side scaling math (no AI call) + save version row
 *  3. Add to plan → meal_plan_entries row; This Week shows the entry
 *  4. Mark made → status/made_at/times_made bump + follow-up strip
 *  5. Send to shopping list → list_items rows with scaled quantities + store_category
 *  6. Food restrictions: always-include (no is_included_in_ai column/toggle in the UI)
 *  7. Family Pointers: recipe-specific pointer created + technique-tag match renders in Cook View
 *  8. Teen (Alex) suggested-recipe WITH CHECK: direct RLS insert probes
 *  9. Queue Recipe card → prefilled capture modal (destination='recipe')
 *  10. Drag persists date/slot via direct mutation-path verification
 *
 * The live recipe-extract Edge Function calls (link/photo/paste/went_well
 * extraction, scale_assist) are NOT exercised here — Playwright cannot hold
 * a model API key for this phase (matches the build's own PROOF note: "mock
 * the model only where Playwright can't hold a key"). Recipes are seeded via
 * direct admin insert to simulate the POST-HITM-approval state, which is
 * exactly what recipe-extract + Approve produces. Live extraction is
 * eyes-on-toured separately once the function is deployed.
 *
 * Fixtures are MEALTEST-prefixed, created via service role, swept in
 * beforeAll + afterAll (leak-pass pattern).
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsAlex } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { localIsoDaysFromToday, todayLocalIso } from '../helpers/dates'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!

const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'MEALTEST'

let familyId = ''
const memberIds: Record<string, string> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await admin
    .from('family_members')
    .select('id, family_id')
    .eq('display_name', name)
    .eq('is_active', true)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  if (!familyId) familyId = data.family_id
  return data.id
}

async function clientFor(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`signIn failed for ${email}: ${error.message}`)
  return client
}

async function createRecipe(overrides: Record<string, unknown> = {}) {
  const sarahId = await memberId('Sarah')
  const { data, error } = await admin
    .from('recipes')
    .insert({
      family_id: familyId,
      created_by: sarahId,
      title: `${PREFIX} Chicken Chili`,
      description: 'A family favorite',
      source_type: 'manual',
      ingredients: [
        { text: '2 cups flour', quantity: 2, unit: 'cups', item: 'flour', store_category: 'pantry', optional: false, scaling_note: null },
        { text: '1 egg', quantity: 1, unit: null, item: 'egg', store_category: 'dairy', optional: false, scaling_note: 'discrete item' },
      ],
      instructions: [
        { step: 1, text: 'Brown the ground beef in a skillet' },
        { step: 2, text: 'Add the flour and stir' },
      ],
      servings_base: 4,
      total_minutes: 45,
      effort_level: 'standard',
      ...overrides,
    })
    .select()
    .single()
  if (error || !data) throw new Error(`createRecipe failed: ${error?.message}`)
  return data
}

async function sweepFixtures() {
  const { data: recipes } = await admin.from('recipes').select('id').ilike('title', `${PREFIX}%`)
  const recipeIds = (recipes ?? []).map((r) => r.id)
  if (recipeIds.length > 0) {
    await admin.from('meal_feedback').delete().in('recipe_id', recipeIds)
    await admin.from('meal_plan_entries').delete().in('recipe_id', recipeIds)
    await admin.from('recipe_versions').delete().in('recipe_id', recipeIds)
    await admin.from('meal_pointers').delete().in('recipe_id', recipeIds)
  }
  await admin.from('meal_plan_entries').delete().ilike('title_snapshot', `${PREFIX}%`)
  await admin.from('meal_pointers').delete().ilike('text', `${PREFIX}%`)
  await admin.from('food_restrictions').delete().ilike('item', `${PREFIX}%`)
  await admin.from('recipes').delete().ilike('title', `${PREFIX}%`)
  await admin.from('list_items').delete().ilike('item_name', `${PREFIX}%`)
  await admin.from('studio_queue').delete().ilike('content', `${PREFIX}%`)
  await admin.from('lists').delete().ilike('title', `${PREFIX}%`)
}

test.describe('PRD-42 KitchenCompass — Phase A', () => {
  test.beforeAll(async () => {
    await memberId('Sarah')
    await sweepFixtures()
  })

  test.afterAll(async () => {
    await sweepFixtures()
  })

  test('1. Recipe Box displays a captured recipe + keyword search finds it', async ({ page }) => {
    const recipe = await createRecipe()
    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Recipe Box' }).click()
    await expect(page.getByText(recipe.title)).toBeVisible({ timeout: 15000 })

    await page.getByPlaceholder('Search recipes...').fill('Chicken Chili')
    await expect(page.getByText(recipe.title)).toBeVisible()
    await page.getByPlaceholder('Search recipes...').fill('NoSuchRecipeXYZ')
    await expect(page.getByText(recipe.title)).not.toBeVisible()
  })

  test('2. Recipe Detail: client-side scaling math + save version row', async ({ page }) => {
    const recipe = await createRecipe({ title: `${PREFIX} Scaling Test Recipe` })
    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Recipe Box' }).click()
    await page.getByText(recipe.title).click()

    // 2x scale: 2 cups flour -> 4 cups flour (pure client math, no AI call)
    await page.getByRole('button', { name: '2×' }).click()
    await expect(page.getByText(/^4 cups flour$/)).toBeVisible()

    // Save this version
    await page.getByRole('button', { name: 'Save this version' }).click();
    await page.getByPlaceholder('e.g. Double batch for co-op').fill(`${PREFIX} Double Batch`)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByText(`${PREFIX} Double Batch`)).toBeVisible()

    const { data: versions } = await admin.from('recipe_versions').select('*').eq('recipe_id', recipe.id)
    expect(versions?.length).toBe(1)
    expect(versions![0].scale_factor).toBe(2)
    expect(versions![0].servings).toBe(8)
  })

  test('3. Add to plan creates meal_plan_entries row visible on This Week', async ({ page }) => {
    const recipe = await createRecipe({ title: `${PREFIX} Plan Test Recipe` })
    const sarahId = await memberId('Sarah')
    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Recipe Box' }).click()
    await page.getByText(recipe.title).click()
    await page.getByRole('button', { name: 'Add to plan' }).click()
    await page.getByRole('button', { name: 'Add to Plan', exact: true }).click()
    // The modal closes only after createEntry.mutateAsync resolves — wait
    // for that as the signal the insert has actually landed, else the DB
    // assertion below can race the in-flight request.
    await expect(page.getByRole('button', { name: 'Add to Plan', exact: true })).not.toBeVisible()

    const { data: entries } = await admin.from('meal_plan_entries').select('*').eq('recipe_id', recipe.id)
    expect(entries?.length).toBe(1)
    expect(entries![0].created_by).toBe(sarahId)
    expect(entries![0].status).toBe('planned')
  })

  test('4. Mark made bumps times_made + status + follow-up strip appears', async ({ page }) => {
    // Title deliberately avoids the substring "Mark made" — it collides
    // (case-insensitively) with the button's accessible name and creates a
    // Playwright strict-mode ambiguity against the draggable entry card.
    const recipe = await createRecipe({ title: `${PREFIX} Enchilada Bake`, times_made: 2 })
    const sarahId = await memberId('Sarah')
    const { data: entry } = await admin.from('meal_plan_entries').insert({
      family_id: familyId, created_by: sarahId, entry_date: todayLocalIso(), meal_slot: 'dinner',
      recipe_id: recipe.id, title_snapshot: recipe.title, servings_planned: 4,
    }).select().single()

    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await page.getByText(recipe.title).first().click()
    await page.getByRole('button', { name: 'Mark made', exact: true }).click()
    await expect(page.getByText('Nice work!')).toBeVisible()

    const { data: updated } = await admin.from('meal_plan_entries').select('*').eq('id', entry!.id).single()
    expect(updated!.status).toBe('made')
    expect(updated!.made_at).not.toBeNull()

    const { data: updatedRecipe } = await admin.from('recipes').select('times_made').eq('id', recipe.id).single()
    expect(updatedRecipe!.times_made).toBe(3)
  })

  test('5. Send to shopping list writes list_items with scaled quantities + store_category', async ({ page }) => {
    const recipe = await createRecipe({ title: `${PREFIX} Shopping Recipe`, servings_base: 4 })
    const sarahId = await memberId('Sarah')

    // Ensure a shopping list exists to receive the items.
    const { data: list } = await admin.from('lists').insert({
      family_id: familyId, owner_id: sarahId, title: `${PREFIX} Groceries`, list_type: 'shopping',
    }).select().single()

    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Recipe Box' }).click()
    await page.getByText(recipe.title).click()
    await page.getByRole('button', { name: 'Send ingredients to shopping list' }).click()
    await page.getByTestId('shopping-list-picker').selectOption({ label: `${PREFIX} Groceries` })
    await page.getByRole('button', { name: /Add \d+ item/ }).click()
    await expect(page.getByText(/item.*added to/)).toBeVisible({ timeout: 10000 })

    const { data: items } = await admin.from('list_items').select('*').eq('list_id', list!.id)
    expect(items?.length).toBeGreaterThanOrEqual(2)
    const flourItem = items!.find((i) => i.item_name === 'flour')
    expect(flourItem).toBeTruthy()
    expect(flourItem!.quantity).toBe(2)
    expect(flourItem!.category).toBe('pantry')
    expect(flourItem!.content).toBeTruthy() // content NOT NULL — must be populated
  })

  test('6. Food restrictions: always-include, no toggle to disable', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Food Profiles' }).click()
    await page.getByText('Add restriction').first().click()
    await page.getByPlaceholder('e.g. peanuts').fill(`${PREFIX} peanuts`)
    await page.getByRole('button', { name: 'Save restriction' }).click()

    await expect(page.getByText(`${PREFIX} peanuts`)).toBeVisible()
    await expect(page.getByText("LiLa always plans around these. This can't be turned off.").first()).toBeVisible()

    const { data: restriction } = await admin.from('food_restrictions').select('*').ilike('item', `${PREFIX}%`).single()
    expect(restriction).toBeTruthy()
    expect(restriction).not.toHaveProperty('is_included_in_ai')
  })

  test('7. Family Pointers: recipe-specific pointer + technique-tag match in Cook View', async ({ page }) => {
    // "Cook this" lives on the entry sheet (PRD §6.1), not on Recipe Detail
    // directly — a plan entry is the real entry point into Cook View.
    const recipe = await createRecipe({
      title: `${PREFIX} Pointer Recipe`,
      instructions: [{ step: 1, text: 'Brown the ground beef in a skillet' }],
    })
    const sarahId = await memberId('Sarah')
    await admin.from('meal_plan_entries').insert({
      family_id: familyId, created_by: sarahId, entry_date: todayLocalIso(), meal_slot: 'dinner',
      recipe_id: recipe.id, title_snapshot: recipe.title,
    })

    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'Recipe Box' }).click()
    await page.getByText(recipe.title).click()
    await page.getByPlaceholder('e.g. Use the small skillet, we do half the sugar').fill(`${PREFIX} use the cast iron pan`)
    await page.locator('button[title="Add for this recipe"]').click()
    await expect(page.getByText(`${PREFIX} use the cast iron pan`)).toBeVisible()

    // Reusable technique pointer matching a step ("brown") — added while the
    // Recipe Detail modal is still open, then close it via its X button.
    await admin.from('meal_pointers').insert({
      family_id: familyId, created_by: sarahId, technique_tag: 'brown',
      text: `${PREFIX} always brown on medium, not high`, sort_order: 0,
    })
    await page.getByTestId('recipe-detail-close').click()

    // "Cook this" lives on the ENTRY SHEET, not Recipe Detail — switch to
    // This Week and tap the plan entry card (not the Recipe Box card).
    await page.getByRole('button', { name: 'This Week' }).click()
    await page.getByText(recipe.title).first().click()
    await page.getByRole('button', { name: 'Cook this' }).click()
    await expect(page.getByText(`${PREFIX} use the cast iron pan`)).toBeVisible() // recipe-specific, pinned at top
    await expect(page.getByText(`${PREFIX} always brown on medium, not high`)).toBeVisible() // technique match beside the matching step

    const { data: pointer } = await admin.from('meal_pointers').select('*').eq('recipe_id', recipe.id).single()
    expect(pointer!.text).toContain('cast iron pan')
  })

  test('8. Teen suggested-recipe WITH CHECK: RLS probes', async ({ }) => {
    const alexClient = await clientFor('alextest@testworths.com', 'Demo2026!')

    // Alex CANNOT insert an approved recipe directly.
    const approvedAttempt = await alexClient.from('recipes').insert({
      family_id: familyId, created_by: await memberId('Alex'), title: `${PREFIX} Alex Approved Attempt`,
      approval_status: 'approved', ingredients: [], instructions: [],
    })
    expect(approvedAttempt.error).toBeTruthy()

    // Alex CAN insert a suggested recipe.
    const suggestedAttempt = await alexClient.from('recipes').insert({
      family_id: familyId, created_by: await memberId('Alex'), title: `${PREFIX} Alex Suggested Recipe`,
      approval_status: 'suggested', ingredients: [], instructions: [],
    }).select().single()
    expect(suggestedAttempt.error).toBeFalsy()
    expect(suggestedAttempt.data?.approval_status).toBe('suggested')

    // Alex cannot self-approve.
    const selfApprove = await alexClient
      .from('recipes')
      .update({ approval_status: 'approved' })
      .eq('id', suggestedAttempt.data!.id)
      .select()
    expect(selfApprove.data?.length ?? 0).toBe(0)
  })

  test('9. Queue Recipe card opens capture modal prefilled with content', async ({ page }) => {
    const sarahId = await memberId('Sarah')
    await admin.from('studio_queue').insert({
      family_id: familyId, owner_id: sarahId, requester_id: sarahId,
      destination: 'recipe', content: `${PREFIX} Grandma's Sunday Sauce: tomatoes, basil, garlic`,
      source: 'mindsweep_auto',
    })

    await loginAsMom(page)
    // Family Overview's Queue tab mounts the real SortTab (Convention #66/#146).
    await page.goto('/dashboard?view=family_overview&fotab=queue')
    await waitForAppReady(page)
    await expect(page.getByText('Review & Save')).toBeVisible({ timeout: 15000 })
    await page.getByRole('button', { name: 'Review & Save' }).click()
    // Assert on the Paste textarea's actual VALUE — the queue card behind
    // the modal still shows a content preview with the same text, so a
    // text-content search would be ambiguous.
    await expect(page.getByPlaceholder('Paste ingredients and instructions here...')).toHaveValue(new RegExp(`${PREFIX} Grandma's Sunday Sauce`))
  })

  test('10. Plan entry move persists entry_date/meal_slot (mutation-path verification)', async ({ page }) => {
    const recipe = await createRecipe({ title: `${PREFIX} Move Test Recipe` })
    const sarahId = await memberId('Sarah')
    const { data: entry } = await admin.from('meal_plan_entries').insert({
      family_id: familyId, created_by: sarahId, entry_date: todayLocalIso(), meal_slot: 'dinner',
      recipe_id: recipe.id, title_snapshot: recipe.title,
    }).select().single()

    await loginAsMom(page)
    await page.goto('/meals')
    await waitForAppReady(page)
    await expect(page.getByText(recipe.title).first()).toBeVisible({ timeout: 15000 })

    // Structural-field guard: an additional_adult without the meal_planning
    // grant may NOT move a plan entry (RLS + field-scoped trigger).
    const markClient = await clientFor('testdad@testworths.com', 'Demo2026!')
    const moveAttempt = await markClient
      .from('meal_plan_entries')
      .update({ entry_date: localIsoDaysFromToday(2) })
      .eq('id', entry!.id)
      .select()
    expect(moveAttempt.data?.length ?? 0).toBe(0)

    // Mom (full edit, primary_parent) can move it. Uses a mom-AUTHENTICATED
    // client, not the service-role admin client — the field-scoped BEFORE
    // UPDATE trigger resolves the actor via auth.uid(), which the
    // service-role key doesn't carry (it would fall through to the
    // no-actor-found branch and get rejected, same as any other stranger).
    const momClient = await clientFor('testmom@testworths.com', 'Demo2026!')
    const { error: momMoveError } = await momClient
      .from('meal_plan_entries')
      .update({ entry_date: localIsoDaysFromToday(2) })
      .eq('id', entry!.id)
    expect(momMoveError).toBeFalsy()
    const { data: moved } = await admin.from('meal_plan_entries').select('entry_date').eq('id', entry!.id).single()
    expect(moved!.entry_date).toBe(localIsoDaysFromToday(2))
  })
})
