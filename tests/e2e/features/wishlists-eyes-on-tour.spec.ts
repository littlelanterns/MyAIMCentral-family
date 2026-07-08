/**
 * PRD-43 WishLists — EYES-ON TOUR (manual helper, NOT a regression test)
 *
 * Convention #277: Claude drives this tour via Playwright, reads every
 * screenshot, and fills the Mom-UI Verification table in
 * .claude/rules/current-builds/PRD-43-wishlists.md. Gated behind
 * EYES_ON_TOUR so it never runs as part of the normal suite.
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/wishlists-eyes-on-tour.spec.ts --headed
 *
 * Surfaces toured (desktop ~1440px / tablet ~768px / mobile ~390px):
 *   1. WishCatch capture sheet — mom
 *   2. /wishlists Independent full-control view (dnd, occasions, hearts) — Alex
 *   3. /wishlists Guided simplified view — Jordan
 *   4. /wishlists Play picture grid (no prices) — Ruthie (loginAsRiley)
 *   5. /wishlists Mom/Adult person tabs + item detail sheet — mom
 *   6. Gift Planning tab — mom
 *   7. Archives Wishlist folder doorway — mom
 *   8. Sidebar (desktop) + BottomNav More menu (mobile) parity — mom
 *
 * Fixtures: "WISHTOUR " prefixed, LEFT IN PLACE for review (kids-rewards
 * precedent) — swept automatically by the next wishlists-gift-planning.spec.ts
 * run (WISHTEST prefix is separate; these are cleaned manually if needed).
 */
import { test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom, loginAsAlex, loginAsJordan, loginAsRiley } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const sr = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')
const PREFIX = 'WISHTOUR'

async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function linger(page: Page, ms = 700) {
  await page.waitForTimeout(ms)
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
}

let familyId = ''
const memberIds: Record<string, string> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

async function ensureWishlistItem(memberName: string, content: string) {
  const mId = await memberId(memberName)
  const { data: existingList } = await sr
    .from('lists')
    .select('id')
    .eq('family_id', familyId)
    .eq('owner_id', mId)
    .eq('list_type', 'wishlist')
    .maybeSingle()
  let listId = existingList?.id as string | undefined
  if (!listId) {
    const { data: created } = await sr
      .from('lists')
      .insert({ family_id: familyId, owner_id: mId, title: 'My Wish List', list_type: 'wishlist', is_included_in_ai: true })
      .select('id')
      .single()
    listId = created!.id as string
  }
  const { data: existingItem } = await sr
    .from('list_items')
    .select('id')
    .eq('list_id', listId)
    .eq('content', content)
    .maybeSingle()
  if (!existingItem) {
    await sr.from('list_items').insert({
      list_id: listId, content, price: 24.99, currency: 'USD',
      wishlist_state: 'active', is_included_in_ai: true, added_by: mId,
      priority: 'would_love',
    })
  }
}

test.describe('PRD-43 WishLists eyes-on tour', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    await ensureWishlistItem('Alex', `${PREFIX} LEGO Technic Race Car`)
    await ensureWishlistItem('Jordan', `${PREFIX} Art supply set`)
    await ensureWishlistItem('Ruthie', `${PREFIX} Stuffed dinosaur`)
    await ensureWishlistItem('Casey', `${PREFIX} Skateboard`)

    // Seed a gift_planning grant to Mark for the tour (Gift Planning tab visibility for mom is inherent).
    const momId = await memberId('Sarah')
    const caseyId = await memberId('Casey')
    const { data: existingGiftList } = await sr
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('subject_member_id', caseyId)
      .eq('list_type', 'gift_ideas')
      .maybeSingle()
    if (!existingGiftList) {
      const { data: giftList } = await sr
        .from('lists')
        .insert({ family_id: familyId, owner_id: momId, subject_member_id: caseyId, title: `${PREFIX} Gift Ideas for Casey`, list_type: 'gift_ideas' })
        .select('id')
        .single()
      await sr.from('list_items').insert({ list_id: giftList!.id, content: `${PREFIX} Skateboard helmet (matching)`, added_by: momId })
    }
  })

  test('1. WishCatch capture sheet', async ({ browser }) => {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      const context = await browser.newContext({ viewport: vp })
      const page = await context.newPage()
      await loginAsMom(page)
      await page.goto('/wishlists')
      await waitForAppReady(page)
      await page.getByRole('button', { name: /Capture/i }).first().click()
      await linger(page, 500)
      await shot(page, `wl-01-wishcatch-${vpName}`)
      await context.close()
    }
  })

  test('2. Independent (Alex) full-control wishlist view', async ({ browser }) => {
    for (const vpName of ['desktop', 'mobile'] as const) {
      const context = await browser.newContext({ viewport: VIEWPORTS[vpName] })
      const page = await context.newPage()
      await loginAsAlex(page)
      await page.goto('/wishlists')
      await waitForAppReady(page)
      await linger(page)
      await shot(page, `wl-02-independent-${vpName}`)
      await context.close()
    }
  })

  test('3. Guided (Jordan) simplified wishlist view', async ({ browser }) => {
    const context = await browser.newContext({ viewport: VIEWPORTS.mobile })
    const page = await context.newPage()
    await loginAsJordan(page)
    await page.goto('/wishlists')
    await waitForAppReady(page)
    await linger(page)
    await shot(page, 'wl-03-guided-mobile')
    await context.close()
  })

  test('4. Play (Ruthie) picture grid, no prices', async ({ browser }) => {
    const context = await browser.newContext({ viewport: VIEWPORTS.mobile })
    const page = await context.newPage()
    await loginAsRiley(page)
    await page.goto('/wishlists')
    await waitForAppReady(page)
    await linger(page)
    await shot(page, 'wl-04-play-mobile')
    // Also the Fun tab's "My Wish List" entry point.
    await page.goto('/rewards')
    await waitForAppReady(page)
    await linger(page)
    await shot(page, 'wl-04b-play-fun-tab-entrypoint')
    await context.close()
  })

  test('5. Mom person tabs + item detail sheet', async ({ browser }) => {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop })
    const page = await context.newPage()
    await loginAsMom(page)
    await page.goto('/wishlists')
    await waitForAppReady(page)
    await linger(page)
    await shot(page, 'wl-05a-mom-family-tab')

    // Switch to Casey's tab if visible.
    const caseyPill = page.getByRole('button', { name: 'Casey', exact: true })
    if (await caseyPill.isVisible().catch(() => false)) {
      await caseyPill.click()
      await linger(page)
      await shot(page, 'wl-05b-mom-casey-tab')

      // Open item detail sheet on the first item.
      const firstItem = page.getByText(`${PREFIX} Skateboard`).first()
      if (await firstItem.isVisible().catch(() => false)) {
        await firstItem.click()
        await linger(page)
        await shot(page, 'wl-05c-item-detail-sheet')
      }
    }
    await context.close()
  })

  test('6. Gift Planning tab', async ({ browser }) => {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop })
    const page = await context.newPage()
    await loginAsMom(page)
    await page.goto('/wishlists')
    await waitForAppReady(page)
    const giftPlanningTab = page.getByRole('button', { name: 'Gift Planning' })
    if (await giftPlanningTab.isVisible().catch(() => false)) {
      await giftPlanningTab.click()
      await linger(page)
      await shot(page, 'wl-06-gift-planning-tab')
    }
    await context.close()
  })

  test('7. Archives Wishlist folder doorway', async ({ browser }) => {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop })
    const page = await context.newPage()
    await loginAsMom(page)
    const alexId = await memberId('Alex')
    await page.goto(`/archives/member/${alexId}`)
    await waitForAppReady(page)
    await linger(page)
    await shot(page, 'wl-07a-archives-member-detail')
    const wishlistFolder = page.getByText('Wishlist', { exact: true }).first()
    if (await wishlistFolder.isVisible().catch(() => false)) {
      await wishlistFolder.click()
      await linger(page)
      await shot(page, 'wl-07b-archives-doorway-navigated')
    }
    await context.close()
  })

  test('8. Sidebar (desktop) + BottomNav More menu (mobile) parity', async ({ browser }) => {
    const desktopCtx = await browser.newContext({ viewport: VIEWPORTS.desktop })
    const desktopPage = await desktopCtx.newPage()
    await loginAsMom(desktopPage)
    await desktopPage.goto('/dashboard')
    await waitForAppReady(desktopPage)
    await linger(desktopPage)
    await shot(desktopPage, 'wl-08a-sidebar-desktop')
    await desktopCtx.close()

    const mobileCtx = await browser.newContext({ viewport: VIEWPORTS.mobile })
    const mobilePage = await mobileCtx.newPage()
    await loginAsMom(mobilePage)
    await mobilePage.goto('/dashboard')
    await waitForAppReady(mobilePage)
    const moreButton = mobilePage.getByRole('link', { name: 'More' }).or(mobilePage.getByRole('button', { name: 'More' }))
    if (await moreButton.first().isVisible().catch(() => false)) {
      await moreButton.first().click()
      await linger(mobilePage)
      await shot(mobilePage, 'wl-08b-bottomnav-more-mobile')
    }
    await mobileCtx.close()
  })
})
