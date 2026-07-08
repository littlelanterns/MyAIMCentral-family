/**
 * PRD-42 KitchenCompass, Phase A — EYES-ON TOUR (manual helper, NOT a
 * regression test)
 *
 * Convention #277: Claude drives this tour via Playwright, reads every
 * screenshot, and fills the Mom-UI Verification table in
 * .claude/rules/current-builds/PRD-42-meal-planning.md. Gated behind
 * EYES_ON_TOUR so it never runs as part of the normal suite.
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/meal-planning-eyes-on-tour.spec.ts --headed
 *
 * Surfaces toured (desktop 1440 / tablet 768 / mobile 390):
 *   1. Recipe Box (populated) + Recipe Capture 4-tile chooser — mom
 *   2. Recipe Detail (scaling, versions, Family Pointers, hearts) — mom
 *   3. This Week (week view with an entry) — mom
 *   4. Entry sheet + Cook View — mom
 *   5. Food Profiles — mom
 *
 * Fixtures: "MEALTOUR " prefixed, LEFT IN PLACE for review (kids-rewards
 * precedent) — swept by the next run of meal-planning.spec.ts's own sweep
 * only if the prefix matches; these use a distinct MEALTOUR prefix so they
 * survive independently for founder review.
 */
import { test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { todayLocalIso } from '../helpers/dates'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const sr = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function linger(page: Page, ms = 500) {
  await page.waitForTimeout(ms)
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
}

let familyId = ''
let sarahId = ''
let recipeId = ''

test.describe('PRD-42 KitchenCompass eyes-on tour', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    const { data: sarah } = await sr
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('display_name', 'Sarah')
      .single()
    sarahId = sarah!.id

    // Clean up any stale tour fixtures, then seed a fresh recipe + plan entry.
    const { data: oldRecipes } = await sr.from('recipes').select('id').ilike('title', 'MEALTOUR%')
    if (oldRecipes?.length) {
      const ids = oldRecipes.map((r) => r.id)
      await sr.from('meal_plan_entries').delete().in('recipe_id', ids)
      await sr.from('meal_pointers').delete().in('recipe_id', ids)
      await sr.from('recipe_versions').delete().in('recipe_id', ids)
      await sr.from('recipes').delete().in('id', ids)
    }

    const { data: recipe } = await sr
      .from('recipes')
      .insert({
        family_id: familyId,
        created_by: sarahId,
        title: 'MEALTOUR Chicken Tortilla Soup',
        description: "Grandma's recipe, always a hit on chilly nights",
        source_type: 'manual',
        ingredients: [
          { text: '2 cups shredded chicken', quantity: 2, unit: 'cups', item: 'shredded chicken', store_category: 'meat', optional: false, scaling_note: null },
          { text: '1 can diced tomatoes', quantity: 1, unit: 'can', item: 'diced tomatoes', store_category: 'pantry', optional: false, scaling_note: 'discrete item' },
          { text: '1 egg (for the crema)', quantity: 1, unit: null, item: 'egg', store_category: 'dairy', optional: true, scaling_note: 'discrete item' },
        ],
        instructions: [
          { step: 1, text: 'Brown the chicken in a large pot' },
          { step: 2, text: 'Add the tomatoes and simmer for 20 minutes' },
          { step: 3, text: 'Top with crema and tortilla strips' },
        ],
        servings_base: 4,
        total_minutes: 40,
        effort_level: 'standard',
        tags: ['soup', 'comfort_food'],
      })
      .select()
      .single()
    recipeId = recipe!.id

    await sr.from('meal_pointers').insert({
      family_id: familyId, created_by: sarahId, recipe_id: recipeId,
      text: 'Ruthie likes the tortilla strips on the side, not mixed in', sort_order: 0,
    })

    await sr.from('meal_plan_entries').insert({
      family_id: familyId, created_by: sarahId, entry_date: todayLocalIso(), meal_slot: 'dinner',
      recipe_id: recipeId, title_snapshot: recipe!.title, servings_planned: 4,
    })
  })

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    test(`tour @ ${vpName}`, async ({ page }) => {
      await page.setViewportSize(vp)
      await loginAsMom(page)

      // 1. Recipe Box (populated)
      await page.goto('/meals')
      await waitForAppReady(page)
      await page.getByRole('button', { name: 'Recipe Box' }).click()
      await linger(page)
      await shot(page, `meal-01-recipe-box-${vpName}`)

      // 1b. Recipe Capture 4-tile chooser
      await page.getByRole('button', { name: 'Add Recipe' }).click()
      await linger(page)
      await shot(page, `meal-02-capture-tiles-${vpName}`)

      // 2. Recipe Detail (fresh navigation dismisses the capture modal)
      await page.goto('/meals')
      await waitForAppReady(page)
      await page.getByRole('button', { name: 'Recipe Box' }).click()
      await page.getByText('MEALTOUR Chicken Tortilla Soup').click()
      await linger(page)
      await shot(page, `meal-03-recipe-detail-${vpName}`)
      await page.getByRole('button', { name: '2×' }).click()
      await linger(page)
      await shot(page, `meal-04-recipe-detail-scaled-${vpName}`)
      await page.getByTestId('recipe-detail-close').click()

      // 3. This Week (week view with the seeded entry)
      await page.getByRole('button', { name: 'This Week' }).click()
      await linger(page)
      await shot(page, `meal-05-this-week-${vpName}`)

      // 4. Entry sheet + Cook View
      await page.getByText('MEALTOUR Chicken Tortilla Soup').first().click()
      await linger(page)
      await shot(page, `meal-06-entry-sheet-${vpName}`)
      await page.getByRole('button', { name: 'Cook this' }).click()
      await linger(page)
      await shot(page, `meal-07-cook-view-${vpName}`)

      // 5. Food Profiles (fresh navigation dismisses Cook View)
      await page.goto('/meals')
      await waitForAppReady(page)
      await page.getByRole('button', { name: 'Food Profiles' }).click()
      await linger(page)
      await shot(page, `meal-08-food-profiles-${vpName}`)
    })
  }

  // Desktop half of the Convention #16 parity pair — same section/label/icon
  // as the mobile More menu, read from the identical getSidebarSections().
  test('desktop sidebar shows KitchenCompass in Plan & Do', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)
    const expandBtn = page.locator('button:has(svg.lucide-chevron-right)').first()
    if (await expandBtn.isVisible().catch(() => false)) await expandBtn.click()
    await linger(page)
    const planDo = page.getByText('Plan & Do').first()
    await planDo.scrollIntoViewIfNeeded().catch(() => {})
    await linger(page, 300)
    await shot(page, 'meal-11-desktop-sidebar-parity')
  })

  // Convention #16 mobile nav parity: KitchenCompass isn't one of the 4
  // pinned bottom-tab items (dashboard/tasks/bookshelf/vault), so it must
  // surface correctly inside the More menu, reading from the same
  // getSidebarSections() the desktop Sidebar uses — never a parallel list.
  test('mobile More menu shows KitchenCompass + routes correctly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await loginAsMom(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('button', { name: 'More' }).click()
    await linger(page)
    await shot(page, 'meal-09-more-menu-mobile')

    const kitchenCompassLink = page.getByRole('link', { name: 'KitchenCompass' })
    await kitchenCompassLink.waitFor({ state: 'visible' })
    await kitchenCompassLink.click()
    await waitForAppReady(page)
    await page.waitForURL('**/meals')
    await linger(page)
    await shot(page, 'meal-10-more-menu-routed-mobile')
  })
})
