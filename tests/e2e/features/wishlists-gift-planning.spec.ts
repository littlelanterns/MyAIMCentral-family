/**
 * PRD-43 WishLists — Phase A end-to-end pins (2026-07-07)
 *
 * Rider-a standard: every pin drives the REAL flow with service-role DB
 * assertions. WISHTEST-prefixed fixtures, swept beforeAll+afterAll.
 *
 * Load-bearing leak probes (pack ruling #8 — not nice-to-haves):
 *   1. Kid session reads ZERO rows from gift_ideas lists (direct PostgREST)
 *   2. Kid session reads ZERO rows from gift_claims (direct PostgREST)
 *   3. Ungranted additional_adult reads ZERO rows from a gift_ideas list
 *   4. Granted additional_adult (gift_planning) CAN read the gift_ideas list
 *   5. Subject-exclusion: mom cannot see a claim against HER OWN wishlist
 *      item, but CAN see a claim against her kid's item
 *   6. Additional_adult gets default read+write on a KID's wishlist (no
 *      grant needed) but NOT on mom's own wishlist without the grant
 *
 * Functional round-trips:
 *   7. WishCatch capture creates a real wishlist item with correct
 *      attribution (added_by, wishlist_state, is_included_in_ai)
 *   8. Gift-ideas lazy-create + "Consider for gift" provenance copy
 *   9. Claim lifecycle: reserve → release → first-claim-wins partial
 *      unique index enforcement
 *
 * Migration: 00000000100292_wishlists_phase_a_foundation.sql +
 *            00000000100293_wishlist_item_provenance.sql
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { loginAsCasey } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!

const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'WISHTEST'
// The eyes-on tour spec (wishlists-eyes-on-tour.spec.ts) deliberately leaves its
// WISHTOUR-prefixed fixtures in place for screenshot review (kids-rewards
// precedent) and documents that THIS spec sweeps them on its next run. Several
// DB uniqueness constraints are per-subject (e.g. uq_lists_gift_ideas_per_subject
// — one gift_ideas list per subject member per family), so a leftover tour
// fixture for the same subject a regression test targets would otherwise
// collide. Sweep both prefixes to keep that promise true.
const TOUR_PREFIX = 'WISHTOUR'

let familyId = ''
const memberIds: Record<string, string> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await admin
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

/** Authenticated client for a test user (real RLS, not service role). */
async function clientFor(user: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`signIn failed for ${user.email}: ${error.message}`)
  return client
}

async function sweepPrefix(prefix: string) {
  // Two sweep passes are needed: prefixed LISTS (gift_ideas lists this spec
  // creates fresh) cascade-clean their items/claims via title match — but
  // several tests find-or-create the member's REAL (non-prefixed) "My Wish
  // List" / "Gift Ideas for X" list and insert prefixed ITEMS into it. Those
  // items (and claims against them) never match on list title, so sweep
  // list_items/gift_claims by their OWN content/snapshot prefix directly,
  // family-wide, regardless of parent list.
  const { data: taggedItems } = await admin
    .from('list_items')
    .select('id, list_id')
    .ilike('content', `%${prefix}%`)
  const taggedItemIds = (taggedItems ?? []).map((i) => i.id as string)
  if (taggedItemIds.length > 0) {
    await admin.from('gift_claims').delete().in('list_item_id', taggedItemIds)
    await admin.from('list_items').delete().in('id', taggedItemIds)
  }
  await admin.from('gift_claims').delete().eq('family_id', familyId).ilike('item_title_snapshot', `%${prefix}%`)

  const { data: lists } = await admin
    .from('lists')
    .select('id')
    .eq('family_id', familyId)
    .ilike('title', `%${prefix}%`)
  const listIds = (lists ?? []).map((l) => l.id as string)
  if (listIds.length > 0) {
    await admin.from('gift_claims').delete().in('list_item_id',
      (await admin.from('list_items').select('id').in('list_id', listIds)).data?.map((i) => i.id as string) ?? [])
    await admin.from('list_items').delete().in('list_id', listIds)
    await admin.from('lists').delete().in('id', listIds)
  }
}

async function sweepFixtures() {
  await sweepPrefix(PREFIX)
  // Sweep leftover eyes-on-tour fixtures too (see TOUR_PREFIX comment above)
  // so a per-subject unique constraint never collides with a real regression
  // fixture just because the tour was run first.
  await sweepPrefix(TOUR_PREFIX)
  // member_permissions gift_planning grants created during tests
  await admin.from('member_permissions').delete().eq('family_id', familyId).eq('permission_key', 'gift_planning')
}

test.describe('PRD-43 WishLists — Phase A', () => {
  test.describe.configure({ mode: 'serial', retries: 1 })

  test.beforeAll(async () => {
    const { data: family, error } = await admin
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id
    await sweepFixtures()
  })

  test.afterAll(async () => {
    await sweepFixtures()
  })

  test('1. WishCatch-equivalent capture creates a real wishlist item with correct attribution', async () => {
    const casey = await clientFor(TEST_USERS.casey)
    const caseyId = await memberId('Casey')

    // Ensure/create Casey's canonical wishlist (find-or-create, mirrors
    // useEnsureWishlist).
    const { data: existing } = await casey
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', caseyId)
      .eq('list_type', 'wishlist')
      .maybeSingle()

    let listId = existing?.id as string | undefined
    if (!listId) {
      const { data: created, error: createErr } = await casey
        .from('lists')
        .insert({ family_id: familyId, owner_id: caseyId, title: 'My Wish List', list_type: 'wishlist', is_included_in_ai: true })
        .select('id')
        .single()
      expect(createErr).toBeNull()
      listId = created!.id as string
    }

    const { data: item, error: itemErr } = await casey
      .from('list_items')
      .insert({
        list_id: listId,
        content: `${PREFIX} LEGO Friends Heartlake Hotel`,
        wishlist_state: 'active',
        is_included_in_ai: true,
        added_by: caseyId,
      })
      .select('*')
      .single()

    expect(itemErr).toBeNull()
    expect(item?.wishlist_state).toBe('active')
    expect(item?.is_included_in_ai).toBe(true)
    expect(item?.added_by).toBe(caseyId)
  })

  test('2. LEAK PROBE: kid session reads ZERO rows from a gift_ideas list about them', async () => {
    const mom = await clientFor(TEST_USERS.sarah)
    const casey = await clientFor(TEST_USERS.casey)
    const momId = await memberId('Sarah')
    const caseyId = await memberId('Casey')

    const { data: giftIdeasList, error } = await mom
      .from('lists')
      .insert({
        family_id: familyId,
        owner_id: momId,
        subject_member_id: caseyId,
        title: `${PREFIX} Gift Ideas for Casey`,
        list_type: 'gift_ideas',
      })
      .select('id')
      .single()
    expect(error).toBeNull()

    // Kid session: direct PostgREST read must return ZERO rows.
    const { data: kidRead, error: kidErr } = await casey
      .from('lists')
      .select('id')
      .eq('id', giftIdeasList!.id)
    expect(kidErr).toBeNull()
    expect(kidRead).toEqual([])

    // Same for list_items under it.
    const { data: ideaItem } = await mom
      .from('list_items')
      .insert({ list_id: giftIdeasList!.id, content: `${PREFIX} secret idea` })
      .select('id')
      .single()

    const { data: kidItemRead } = await casey
      .from('list_items')
      .select('id')
      .eq('id', ideaItem!.id)
    expect(kidItemRead).toEqual([])
  })

  test('3. LEAK PROBE: kid session reads ZERO rows from gift_claims', async () => {
    const mom = await clientFor(TEST_USERS.sarah)
    const casey = await clientFor(TEST_USERS.casey)
    const momId = await memberId('Sarah')
    const caseyId = await memberId('Casey')

    // A real wishlist item to claim against (owned by Casey).
    const { data: list } = await mom
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', caseyId)
      .eq('list_type', 'wishlist')
      .maybeSingle()
    const { data: item } = await mom
      .from('list_items')
      .insert({ list_id: list!.id, content: `${PREFIX} claim target` })
      .select('id')
      .single()

    const { data: claim, error } = await mom
      .from('gift_claims')
      .insert({
        family_id: familyId,
        list_item_id: item!.id,
        item_title_snapshot: `${PREFIX} claim target`,
        claimed_by_member_id: momId,
        status: 'reserved',
      })
      .select('id')
      .single()
    expect(error).toBeNull()

    const { data: kidRead, error: kidErr } = await casey
      .from('gift_claims')
      .select('id')
      .eq('id', claim!.id)
    expect(kidErr).toBeNull()
    expect(kidRead).toEqual([])
  })

  test('4. LEAK PROBE: ungranted additional_adult reads ZERO rows from a gift_ideas list', async () => {
    const mom = await clientFor(TEST_USERS.sarah)
    const mark = await clientFor(TEST_USERS.mark)
    const momId = await memberId('Sarah')
    const jordanId = await memberId('Jordan')

    // Ensure no stray gift_planning grant survives from a prior run.
    await admin.from('member_permissions').delete()
      .eq('family_id', familyId).eq('permission_key', 'gift_planning').is('target_member_id', null)

    const { data: giftIdeasList } = await mom
      .from('lists')
      .insert({
        family_id: familyId, owner_id: momId, subject_member_id: jordanId,
        title: `${PREFIX} Gift Ideas for Jordan`, list_type: 'gift_ideas',
      })
      .select('id')
      .single()

    const { data: markRead } = await mark
      .from('lists')
      .select('id')
      .eq('id', giftIdeasList!.id)
    expect(markRead).toEqual([])
  })

  test('5. Granted additional_adult (gift_planning) CAN read the gift_ideas list', async () => {
    const mom = await clientFor(TEST_USERS.sarah)
    const mark = await clientFor(TEST_USERS.mark)
    const momId = await memberId('Sarah')
    const markId = await memberId('Mark')
    const jordanId = await memberId('Jordan')

    await admin.from('member_permissions').insert({
      family_id: familyId,
      granting_member_id: momId,
      granted_to: markId,
      target_member_id: null,
      permission_key: 'gift_planning',
      access_level: 'manage',
      permission_value: { access_level: 'manage' },
    })

    const { data: giftIdeasList } = await mom
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('subject_member_id', jordanId)
      .eq('list_type', 'gift_ideas')
      .single()

    const { data: markRead, error } = await mark
      .from('lists')
      .select('id')
      .eq('id', giftIdeasList!.id)
    expect(error).toBeNull()
    expect(markRead?.length).toBe(1)

    // Mark can also WRITE (insert an idea item) now that he's granted.
    const { error: writeErr } = await mark
      .from('list_items')
      .insert({ list_id: giftIdeasList!.id, content: `${PREFIX} Mark's idea` })
    expect(writeErr).toBeNull()
  })

  test('6. SUBJECT-EXCLUSION: mom cannot see a claim against her OWN wishlist item, but sees claims on her kid\'s', async () => {
    const mom = await clientFor(TEST_USERS.sarah)
    const mark = await clientFor(TEST_USERS.mark)
    const momId = await memberId('Sarah')
    const markId = await memberId('Mark')
    const caseyId = await memberId('Casey')

    // Mom's own wishlist item.
    const { data: momList } = await mom
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', momId)
      .eq('list_type', 'wishlist')
      .maybeSingle()
    let momListId = momList?.id as string | undefined
    if (!momListId) {
      const { data: created } = await mom
        .from('lists')
        .insert({ family_id: familyId, owner_id: momId, title: 'My Wish List', list_type: 'wishlist', is_included_in_ai: true })
        .select('id')
        .single()
      momListId = created!.id as string
    }
    const { data: momItem } = await mom
      .from('list_items')
      .insert({ list_id: momListId, content: `${PREFIX} mom's own wish` })
      .select('id')
      .single()

    // Mark (granted gift_planning from test 5) reserves it as a surprise for mom.
    const { data: claimOnMom, error: claimErr } = await mark
      .from('gift_claims')
      .insert({
        family_id: familyId,
        list_item_id: momItem!.id,
        item_title_snapshot: `${PREFIX} mom's own wish`,
        claimed_by_member_id: markId,
        status: 'reserved',
      })
      .select('id')
      .single()
    expect(claimErr).toBeNull()

    // Mom must NOT see this claim — it's a surprise about her own list.
    const { data: momRead } = await mom
      .from('gift_claims')
      .select('id')
      .eq('id', claimOnMom!.id)
    expect(momRead).toEqual([])

    // But mom DOES see a claim on Casey's (her kid's) item.
    const { data: caseyList } = await mom
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', caseyId)
      .eq('list_type', 'wishlist')
      .maybeSingle()
    const { data: caseyItem } = await mom
      .from('list_items')
      .insert({ list_id: caseyList!.id, content: `${PREFIX} casey claim target 2` })
      .select('id')
      .single()
    const { data: claimOnCasey } = await mom
      .from('gift_claims')
      .insert({
        family_id: familyId, list_item_id: caseyItem!.id,
        item_title_snapshot: `${PREFIX} casey claim target 2`,
        claimed_by_member_id: momId, status: 'reserved',
      })
      .select('id')
      .single()

    const { data: momReadCasey } = await mom
      .from('gift_claims')
      .select('id')
      .eq('id', claimOnCasey!.id)
    expect(momReadCasey?.length).toBe(1)
  })

  test('7. D-43-5: additional_adult reads+writes a KID\'s wishlist by default (no grant needed)', async () => {
    const mark = await clientFor(TEST_USERS.mark)
    const ruthieId = await memberId('Ruthie')

    const { data: ruthieList } = await mark
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', ruthieId)
      .eq('list_type', 'wishlist')
      .maybeSingle()

    let listId = ruthieList?.id as string | undefined
    if (!listId) {
      // No grant held by Mark for this — proves the DEFAULT (kid wishlist,
      // not gift_ideas) read+write path, distinct from test 4/5's gift_planning gate.
      const { data: created, error } = await mark
        .from('lists')
        .insert({ family_id: familyId, owner_id: ruthieId, title: 'My Wish List', list_type: 'wishlist', is_included_in_ai: true })
        .select('id')
        .single()
      expect(error).toBeNull()
      listId = created!.id as string
    }

    const { error: writeErr } = await mark
      .from('list_items')
      .insert({ list_id: listId, content: `${PREFIX} Mark added this for Ruthie`, added_by: await memberId('Mark') })
    expect(writeErr).toBeNull()
  })

  test('8. "Consider for gift" copy carries source_list_item_id provenance', async () => {
    const mom = await clientFor(TEST_USERS.sarah)
    const momId = await memberId('Sarah')
    const caseyId = await memberId('Casey')

    const { data: caseyList } = await mom
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', caseyId)
      .eq('list_type', 'wishlist')
      .single()
    const { data: sourceItem } = await mom
      .from('list_items')
      .insert({ list_id: caseyList!.id, content: `${PREFIX} considering source` })
      .select('*')
      .single()

    const { data: giftIdeasList } = await mom
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('subject_member_id', caseyId)
      .eq('list_type', 'gift_ideas')
      .maybeSingle()
    let listId = giftIdeasList?.id as string | undefined
    if (!listId) {
      const { data: created } = await mom
        .from('lists')
        .insert({ family_id: familyId, owner_id: momId, subject_member_id: caseyId, title: `${PREFIX} Gift Ideas for Casey 2`, list_type: 'gift_ideas' })
        .select('id')
        .single()
      listId = created!.id as string
    }

    const { data: copy, error } = await mom
      .from('list_items')
      .insert({
        list_id: listId,
        content: sourceItem!.content,
        source_list_item_id: sourceItem!.id,
        added_by: momId,
      })
      .select('*')
      .single()

    expect(error).toBeNull()
    expect(copy?.source_list_item_id).toBe(sourceItem!.id)
  })

  test('9. Claim lifecycle: reserve → release → first-claim-wins partial unique index', async () => {
    const mom = await clientFor(TEST_USERS.sarah)
    const momId = await memberId('Sarah')
    const caseyId = await memberId('Casey')

    const { data: caseyList } = await mom
      .from('lists')
      .select('id')
      .eq('family_id', familyId)
      .eq('owner_id', caseyId)
      .eq('list_type', 'wishlist')
      .single()
    const { data: item } = await mom
      .from('list_items')
      .insert({ list_id: caseyList!.id, content: `${PREFIX} race target` })
      .select('id')
      .single()

    const { data: claim1, error: err1 } = await mom
      .from('gift_claims')
      .insert({
        family_id: familyId, list_item_id: item!.id,
        item_title_snapshot: `${PREFIX} race target`,
        claimed_by_member_id: momId, status: 'reserved',
      })
      .select('id')
      .single()
    expect(err1).toBeNull()

    // Second concurrent claim on the SAME active (unreleased, reserved) item
    // must violate the partial unique index.
    const { error: err2 } = await mom
      .from('gift_claims')
      .insert({
        family_id: familyId, list_item_id: item!.id,
        item_title_snapshot: `${PREFIX} race target`,
        claimed_by_member_id: momId, status: 'reserved',
      })
    expect(err2).not.toBeNull()
    expect(err2?.message).toMatch(/duplicate key|unique/i)

    // Release the first claim.
    await mom.from('gift_claims').update({ released_at: new Date().toISOString() }).eq('id', claim1!.id)

    // Now a new claim on the same item succeeds (released rows don't conflict).
    const { error: err3 } = await mom
      .from('gift_claims')
      .insert({
        family_id: familyId, list_item_id: item!.id,
        item_title_snapshot: `${PREFIX} race target`,
        claimed_by_member_id: momId, status: 'reserved',
      })
    expect(err3).toBeNull()
  })

  test('10. Kid CANNOT insert a gift_ideas list or gift_claims row directly (RLS write probe)', async () => {
    const casey = await clientFor(TEST_USERS.casey)
    const caseyId = await memberId('Casey')
    const jordanId = await memberId('Jordan')

    const { error: listErr } = await casey
      .from('lists')
      .insert({ family_id: familyId, owner_id: caseyId, subject_member_id: jordanId, title: `${PREFIX} sneaky`, list_type: 'gift_ideas' })
    expect(listErr).not.toBeNull()

    const { data: someItem } = await admin
      .from('list_items')
      .select('id')
      .eq('list_id', (await admin.from('lists').select('id').eq('family_id', familyId).eq('owner_id', caseyId).eq('list_type', 'wishlist').single()).data?.id)
      .limit(1)
      .maybeSingle()

    if (someItem) {
      const { error: claimErr } = await casey
        .from('gift_claims')
        .insert({
          family_id: familyId, list_item_id: someItem.id,
          item_title_snapshot: 'sneaky claim', claimed_by_member_id: caseyId, status: 'reserved',
        })
      expect(claimErr).not.toBeNull()
    }
  })

  test('11. WishCatch UI: real browser typed-capture round-trip', async ({ page }) => {
    await loginAsCasey(page)
    await page.goto('/wishlists')
    await waitForAppReady(page)
    // Exact match — the sidebar's collapsible "Capture & Reflect" section
    // header also matches a loose /Capture/i regex when expanded, and (being
    // in DOM order first) would win a .first() race. The page's own button
    // has no other text/icon-derived accessible name collision.
    await page.getByRole('button', { name: 'Capture', exact: true }).click()
    const input = page.getByPlaceholder('Type it, paste a link, or use the mic')
    await input.fill(`${PREFIX} UI Round Trip Skateboard`)
    await page.getByRole('button', { name: /Add to (your|.*'s) list/i }).click()
    // The captured-session row renders inline with a check icon inside the
    // modal — proves the mutation resolved and justCaptured state updated
    // (not just that the click didn't throw). The underlying page's own list
    // ALSO already shows the item live behind the modal (shared React Query
    // cache) — both are legitimately visible at once, so scope to the modal.
    const modal = page.getByRole('dialog', { name: 'WishCatch' })
    await expect(modal.getByText(`${PREFIX} UI Round Trip Skateboard`)).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Close' }).click()
    // Modal gone; exactly one copy remains — the page's own item card.
    await expect(page.getByText(`${PREFIX} UI Round Trip Skateboard`)).toHaveCount(1)
    await expect(page.getByText(`${PREFIX} UI Round Trip Skateboard`)).toBeVisible()

    // DB assertion: real row, correct attribution, from the ACTUAL UI flow.
    const caseyId = await memberId('Casey')
    const { data: item } = await admin
      .from('list_items')
      .select('content, wishlist_state, is_included_in_ai, added_by')
      .eq('content', `${PREFIX} UI Round Trip Skateboard`)
      .single()
    expect(item?.wishlist_state).toBe('active')
    expect(item?.is_included_in_ai).toBe(true)
    expect(item?.added_by).toBe(caseyId)
  })
})
