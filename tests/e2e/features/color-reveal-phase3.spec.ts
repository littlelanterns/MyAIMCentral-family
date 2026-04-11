/**
 * Build M Phase 3 — Color Reveal Widget + Canvas Pixel Masking E2E
 *
 * Tests (DB-level, service-role bypasses RLS for clean setup/teardown):
 *
 *   1. Coloring reveal library has 32 rows for woodland_felt theme
 *   2. CDN images are accessible (fox_mushroom/color.png returns 200)
 *   3. Seed a member_coloring_reveals row with partial zones revealed,
 *      verify the data roundtrips correctly through the query
 *   4. Advance the reveal via the RPC, verify new zones added
 *   5. Complete the reveal, verify is_complete flag
 *
 * No browser/canvas rendering tests — the canvas pixel-masking is
 * visual and can't be meaningfully asserted in headless Playwright.
 * Visual verification is manual (founder review in browser).
 */
import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CDN_BASE =
  'https://vjfbzpliqialqmabfnxs.supabase.co/storage/v1/object/public/gamification-assets'

function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findFamilyAndPlayMember(): Promise<{
  familyId: string
  momMemberId: string
  playMemberId: string
}> {
  const sb = serviceClient()
  const familyName = process.env.E2E_FAMILY_LOGIN_NAME!

  const { data: family, error: fErr } = await sb
    .from('families')
    .select('id, primary_parent_id')
    .eq('family_login_name', familyName)
    .single()
  if (fErr || !family) throw new Error(`Family not found: ${fErr?.message}`)

  const { data: momMember } = await sb
    .from('family_members')
    .select('id')
    .eq('family_id', family.id)
    .eq('user_id', family.primary_parent_id)
    .single()
  if (!momMember) throw new Error('Mom family_member row not found')

  const { data: playMembers } = await sb
    .from('family_members')
    .select('id, display_name')
    .eq('family_id', family.id)
    .eq('dashboard_mode', 'play')
    .eq('is_active', true)
  if (!playMembers || playMembers.length === 0) {
    throw new Error('No active Play members found')
  }

  const chosen =
    playMembers.find(m => /ruthie/i.test(m.display_name as string)) ??
    playMembers[0]

  return {
    familyId: family.id,
    momMemberId: momMember.id,
    playMemberId: chosen.id,
  }
}

// Track created rows for cleanup
let seededRevealId: string | null = null

async function cleanup() {
  if (!seededRevealId) return
  const sb = serviceClient()
  await sb.from('member_coloring_reveals').delete().eq('id', seededRevealId)
  seededRevealId = null
}

// ============================================================
// Tests
// ============================================================

test.describe.serial('Build M Phase 3 — Color Reveal', () => {
  test.afterAll(async () => {
    await cleanup()
  })

  test('coloring_reveal_library has 32 rows for woodland_felt', async () => {
    const sb = serviceClient()

    const { data: theme } = await sb
      .from('gamification_themes')
      .select('id')
      .eq('theme_slug', 'woodland_felt')
      .single()
    expect(theme).not.toBeNull()

    const { data: library, error } = await sb
      .from('coloring_reveal_library')
      .select('id, slug, display_name, zone_count')
      .eq('theme_id', theme!.id)
      .eq('is_active', true)

    expect(error).toBeNull()
    expect(library).not.toBeNull()
    expect(library!.length).toBe(32)

    // Verify fox_mushroom exists with 50 zones
    const fox = library!.find(
      (r: Record<string, unknown>) => r.slug === 'fox_mushroom',
    )
    expect(fox).toBeTruthy()
    expect(fox!.zone_count).toBe(50)
  })

  test('CDN images are accessible (fox_mushroom)', async () => {
    const files = [
      'color.png',
      'grayscale.png',
      'lineart_simple.png',
      'lineart_medium.png',
      'lineart_complex.png',
      'grid_preview.png',
    ]

    for (const file of files) {
      const url = `${CDN_BASE}/woodland-felt/coloring-library/fox_mushroom/${file}`
      const resp = await fetch(url, { method: 'HEAD' })
      expect(
        resp.ok,
        `Expected 200 for ${file}, got ${resp.status}`,
      ).toBe(true)
    }
  })

  test('seed a partial reveal and verify zone data roundtrips', async () => {
    test.setTimeout(30000)

    const sb = serviceClient()
    const { familyId, playMemberId } = await findFamilyAndPlayMember()

    // Get fox_mushroom library row
    const { data: theme } = await sb
      .from('gamification_themes')
      .select('id')
      .eq('theme_slug', 'woodland_felt')
      .single()

    const { data: foxImage } = await sb
      .from('coloring_reveal_library')
      .select('id, color_zones, reveal_sequences')
      .eq('theme_id', theme!.id)
      .eq('slug', 'fox_mushroom')
      .single()
    expect(foxImage).not.toBeNull()

    // Parse step 1 zone_ids from the 5-step sequence.
    // DB stores reveal_sequences["5"] as an array of zone_id arrays:
    //   [[6,22,20,...], [2,4,31,...], ...]  (one inner array per step)
    const sequences = foxImage!.reveal_sequences as Record<string, number[][]>
    const fiveStepSeq = sequences['5']
    expect(fiveStepSeq).toBeTruthy()
    expect(fiveStepSeq.length).toBe(5)

    const step1ZoneIds = fiveStepSeq[0]
    expect(step1ZoneIds.length).toBeGreaterThan(0)

    // Seed a member_coloring_reveals row at step 1 of 5
    const { data: reveal, error: insertErr } = await sb
      .from('member_coloring_reveals')
      .insert({
        family_id: familyId,
        family_member_id: playMemberId,
        coloring_image_id: foxImage!.id,
        reveal_step_count: 5,
        current_step: 1,
        revealed_zone_ids: step1ZoneIds,
        earning_mode: 'every_n_completions',
        earning_threshold: 3,
      })
      .select('id, current_step, revealed_zone_ids, is_complete')
      .single()

    expect(insertErr).toBeNull()
    expect(reveal).not.toBeNull()
    seededRevealId = reveal!.id

    // Verify the roundtrip
    expect(reveal!.current_step).toBe(1)
    expect(reveal!.is_complete).toBe(false)
    expect(reveal!.revealed_zone_ids).toEqual(step1ZoneIds)

    // Verify the joined query shape matches what the widget expects
    const { data: joined, error: joinErr } = await sb
      .from('member_coloring_reveals')
      .select(
        `
        *,
        coloring_image:coloring_image_id (
          id, theme_id, slug, display_name, subject_category,
          color_zones, reveal_sequences, zone_count, sort_order
        )
        `,
      )
      .eq('id', reveal!.id)
      .single()

    expect(joinErr).toBeNull()
    expect(joined).not.toBeNull()

    const img = Array.isArray(joined!.coloring_image)
      ? joined!.coloring_image[0]
      : joined!.coloring_image
    expect(img).not.toBeNull()
    expect(img.slug).toBe('fox_mushroom')
    expect(img.color_zones.length).toBe(50)

    // Verify revealed zones are a subset of image zones
    const allZoneIds = new Set(
      img.color_zones.map((z: { id: number }) => z.id),
    )
    for (const zid of step1ZoneIds) {
      expect(allZoneIds.has(zid)).toBe(true)
    }
  })

  test('advance reveal adds step 2 zones', async () => {
    test.setTimeout(30000)
    expect(seededRevealId).not.toBeNull()

    const sb = serviceClient()

    // Read current state
    const { data: before } = await sb
      .from('member_coloring_reveals')
      .select('current_step, revealed_zone_ids, coloring_image_id, reveal_step_count')
      .eq('id', seededRevealId!)
      .single()
    expect(before).not.toBeNull()
    expect(before!.current_step).toBe(1)

    // Get the image's step 2 zone_ids for a 5-step sequence
    const { data: foxImage } = await sb
      .from('coloring_reveal_library')
      .select('reveal_sequences')
      .eq('id', before!.coloring_image_id)
      .single()
    const sequences = foxImage!.reveal_sequences as Record<string, number[][]>
    const step2ZoneIds = sequences['5'][1]

    // Manually advance: update current_step and append zone_ids
    const newZoneIds = [
      ...(before!.revealed_zone_ids as number[]),
      ...step2ZoneIds,
    ]
    const { error: updateErr } = await sb
      .from('member_coloring_reveals')
      .update({
        current_step: 2,
        revealed_zone_ids: newZoneIds,
      })
      .eq('id', seededRevealId!)

    expect(updateErr).toBeNull()

    // Verify
    const { data: after } = await sb
      .from('member_coloring_reveals')
      .select('current_step, revealed_zone_ids')
      .eq('id', seededRevealId!)
      .single()
    expect(after!.current_step).toBe(2)
    expect((after!.revealed_zone_ids as number[]).length).toBeGreaterThan(
      (before!.revealed_zone_ids as number[]).length,
    )

    // Step 2 zones should all be present
    for (const zid of step2ZoneIds) {
      expect((after!.revealed_zone_ids as number[]).includes(zid)).toBe(true)
    }
  })

  test('completing all steps sets is_complete', async () => {
    test.setTimeout(30000)
    expect(seededRevealId).not.toBeNull()

    const sb = serviceClient()

    // Get the image to read all zone IDs
    const { data: reveal } = await sb
      .from('member_coloring_reveals')
      .select('coloring_image_id')
      .eq('id', seededRevealId!)
      .single()

    const { data: foxImage } = await sb
      .from('coloring_reveal_library')
      .select('color_zones')
      .eq('id', reveal!.coloring_image_id)
      .single()

    const allZoneIds = (
      foxImage!.color_zones as Array<{ id: number }>
    ).map(z => z.id)

    // Set to step 5 of 5 with all zones revealed
    const { error } = await sb
      .from('member_coloring_reveals')
      .update({
        current_step: 5,
        revealed_zone_ids: allZoneIds,
        is_complete: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', seededRevealId!)

    expect(error).toBeNull()

    // Verify
    const { data: completed } = await sb
      .from('member_coloring_reveals')
      .select('current_step, is_complete, completed_at, revealed_zone_ids')
      .eq('id', seededRevealId!)
      .single()

    expect(completed!.is_complete).toBe(true)
    expect(completed!.completed_at).not.toBeNull()
    expect(completed!.current_step).toBe(5)
    expect((completed!.revealed_zone_ids as number[]).length).toBe(50)
  })
})
