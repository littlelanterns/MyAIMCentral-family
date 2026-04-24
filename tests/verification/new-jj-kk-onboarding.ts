/**
 * NEW-JJ + NEW-KK — auto_provision_member_resources onboarding round-trip
 *
 * Verifies the fix for the shared root cause: migration 100115 regressed the
 * auto_provision_member_resources() trigger to write folder_type='family_member'
 * (rejected by the CHECK constraint added in 100035) and to drop the 7 system
 * category subfolders + wishlist + archive_member_settings seed required by
 * Convention #77.
 *
 * Migration 100165 restores the full archive provisioning block.
 *
 * Test plan:
 *   (1) auth.admin.createUser — a throwaway mom-shaped account. Asserts the
 *       auth call succeeds (proves NEW-JJ fixed).
 *   (2) Wait for handle_new_user to finish creating family + family_members,
 *       then locate the auto-provisioned member and family.
 *   (3) Inspect archive_folders for that member:
 *         - exactly 1 row with folder_type='member_root', is_system=true
 *         - exactly 7 rows with folder_type='system_category' parented at the root
 *         - exactly 1 row with folder_type='wishlist' parented at the root
 *       (proves NEW-KK fixed and Convention #77 intact)
 *   (4) Inspect archive_member_settings — exactly 1 row for the member.
 *   (5) Cleanup (explicit order to dodge FK issues):
 *         a) archive_member_settings WHERE member_id = X
 *         b) archive_folders WHERE member_id = X
 *         c) member_sticker_book_state, member_page_unlocks,
 *            gamification_configs, dashboard_configs, rhythm_configs,
 *            lists (backburner + ideas) — everything 100115/100165 creates
 *         d) auth.admin.deleteUser(auth_user_id) → cascades to family_members
 *            via auth.users FK. The family itself remains (handle_new_user
 *            creates it; we delete it directly for a clean test).
 *
 * Run: npx tsx tests/verification/new-jj-kk-onboarding.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const url = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(2)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const findings: Array<{ label: string; pass: boolean; detail: string }> = []

function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function run() {
  const stamp = Date.now()
  const testEmail = `prb-new-jj-kk-${stamp}@test.myaimcentral.app`
  let authUserId: string | null = null
  let familyId: string | null = null
  let memberId: string | null = null
  let rootFolderId: string | null = null

  try {
    // ================================================================
    // (1) NEW-JJ — auth.admin.createUser must succeed
    // ================================================================
    const { data: createRes, error: createErr } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'prb-test-password-9f7a2b',
      email_confirm: true,
      user_metadata: {
        display_name: 'Probe',
        timezone: 'America/Chicago',
      },
    })

    if (createErr || !createRes?.user?.id) {
      record(
        'NEW-JJ createUser',
        false,
        `createUser failed: ${JSON.stringify(createErr)} (this is the reported bug; migration 100165 not yet applied or another trigger is failing)`,
      )
      return
    }

    authUserId = createRes.user.id
    record('NEW-JJ createUser', true, `auth user created (${authUserId})`)

    // Let handle_new_user finish (it's synchronous within the insert, but the
    // cascade into auto_provision_member_resources + auto_provision_family_overview
    // should all complete inside the same transaction).
    await sleep(500)

    // ================================================================
    // (2) Locate the auto-provisioned family + primary_parent member
    // ================================================================
    const { data: member, error: memberErr } = await supabase
      .from('family_members')
      .select('id, family_id, role, display_name, dashboard_mode')
      .eq('user_id', authUserId)
      .limit(1)
      .maybeSingle()

    if (memberErr || !member) {
      record(
        'family_members auto-provisioned',
        false,
        `expected one family_members row for auth user — found none: ${JSON.stringify(memberErr)}`,
      )
      return
    }

    memberId = member.id as string
    familyId = member.family_id as string
    record(
      'family_members auto-provisioned',
      member.role === 'primary_parent' && member.dashboard_mode === 'adult',
      `member ${memberId} role=${member.role} dashboard_mode=${member.dashboard_mode}`,
    )

    // ================================================================
    // (3) NEW-KK — archive_folders provisioned per Convention #77
    // ================================================================
    const { data: folders, error: foldersErr } = await supabase
      .from('archive_folders')
      .select('id, folder_type, folder_name, parent_folder_id, is_system, sort_order')
      .eq('member_id', memberId)

    if (foldersErr || !folders) {
      record(
        'archive_folders query',
        false,
        `failed to read archive_folders: ${JSON.stringify(foldersErr)}`,
      )
      return
    }

    const roots = folders.filter((f) => f.folder_type === 'member_root')
    const categories = folders.filter((f) => f.folder_type === 'system_category')
    const wishlists = folders.filter((f) => f.folder_type === 'wishlist')

    record(
      'NEW-KK member_root folder (exactly 1)',
      roots.length === 1 && roots[0].is_system === true,
      `found ${roots.length} root(s), is_system=${roots[0]?.is_system}, name="${roots[0]?.folder_name}"`,
    )

    if (roots.length === 1) {
      rootFolderId = roots[0].id as string
    }

    const rootChildrenCategories = categories.filter(
      (c) => c.parent_folder_id === rootFolderId,
    )
    record(
      'NEW-KK 7 system_category subfolders parented at root',
      rootChildrenCategories.length === 7,
      `found ${rootChildrenCategories.length} category subfolders (expected 7)`,
    )

    const expectedCategoryNames = new Set([
      'Preferences',
      'Schedule & Activities',
      'Personality & Traits',
      'Interests & Hobbies',
      'School & Learning',
      'Health & Medical',
      'General',
    ])
    const actualCategoryNames = new Set(rootChildrenCategories.map((c) => c.folder_name))
    const allCategoriesPresent =
      [...expectedCategoryNames].every((n) => actualCategoryNames.has(n)) &&
      actualCategoryNames.size === expectedCategoryNames.size
    record(
      'NEW-KK 7 category names match Convention #77',
      allCategoriesPresent,
      `categories: ${[...actualCategoryNames].sort().join(', ')}`,
    )

    const rootChildrenWishlists = wishlists.filter(
      (w) => w.parent_folder_id === rootFolderId,
    )
    record(
      'NEW-KK wishlist folder (exactly 1, parented at root)',
      rootChildrenWishlists.length === 1 && rootChildrenWishlists[0].is_system === true,
      `found ${rootChildrenWishlists.length} wishlist folder(s), is_system=${rootChildrenWishlists[0]?.is_system}`,
    )

    // No invalid folder_type rows
    const invalidFolderTypes = folders.filter(
      (f) =>
        !['member_root', 'system_category', 'wishlist', 'family_overview', 'custom'].includes(
          f.folder_type as string,
        ),
    )
    record(
      'NEW-KK no invalid folder_type values',
      invalidFolderTypes.length === 0,
      `${invalidFolderTypes.length} row(s) with invalid folder_type (CHECK would reject — must be 0)`,
    )

    // ================================================================
    // (4) archive_member_settings — exactly one row seeded
    // ================================================================
    const { data: settings, error: settingsErr } = await supabase
      .from('archive_member_settings')
      .select('id, is_included_in_ai')
      .eq('member_id', memberId)

    record(
      'NEW-KK archive_member_settings seed (exactly 1)',
      !settingsErr && Array.isArray(settings) && settings.length === 1,
      `found ${settings?.length ?? 0} settings row(s) (err=${JSON.stringify(settingsErr)})`,
    )
  } finally {
    // ================================================================
    // (5) Cleanup — explicit order to dodge FK / trigger chains
    // ================================================================
    try {
      if (memberId) {
        // a) archive_member_settings
        await supabase.from('archive_member_settings').delete().eq('member_id', memberId)
        // b) archive_folders (all of them, including wishlist + categories + member_root)
        await supabase.from('archive_folders').delete().eq('member_id', memberId)
        // c) everything else auto-provisioned by 100165 / 100115
        await supabase.from('member_page_unlocks').delete().eq('family_member_id', memberId)
        await supabase.from('member_sticker_book_state').delete().eq('family_member_id', memberId)
        await supabase.from('gamification_configs').delete().eq('family_member_id', memberId)
        await supabase.from('dashboard_configs').delete().eq('family_member_id', memberId)
        await supabase.from('rhythm_configs').delete().eq('member_id', memberId)
        await supabase.from('lists').delete().eq('owner_id', memberId)
      }
      if (familyId) {
        // Also clear the family_overview folder tree (auto_provision_family_overview)
        await supabase.from('archive_folders').delete().eq('family_id', familyId)
        // Subscriptions row handle_new_user created
        await supabase.from('family_subscriptions').delete().eq('family_id', familyId)
        // Family itself (cascades to family_members via ON DELETE CASCADE)
        await supabase.from('families').delete().eq('id', familyId)
      }
      if (authUserId) {
        // Auth user last — cascades to anything FK-referencing auth.users(id)
        await supabase.auth.admin.deleteUser(authUserId)
      }
      console.log('[CLEANUP] done')
    } catch (e) {
      console.error('[CLEANUP] error (non-fatal):', e)
    }
  }

  const passCount = findings.filter((f) => f.pass).length
  const failCount = findings.filter((f) => !f.pass).length
  console.log('')
  console.log(`=== NEW-JJ + NEW-KK verification: ${passCount} PASS / ${failCount} FAIL ===`)

  if (failCount > 0) {
    process.exit(1)
  }
}

run().catch((e) => {
  console.error('FATAL', e)
  process.exit(2)
})
