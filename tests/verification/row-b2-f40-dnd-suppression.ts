/**
 * Row 59 — SCOPE-2.F40 DND non-safety suppression.
 *
 * Proves two things:
 *   1. Static: src/hooks/useNotifications.ts loads notification_preferences
 *      DND categories and applies the `or(priority.eq.high, category.not.in.(...))`
 *      filter in BOTH useNotifications AND useUnreadNotificationCount.
 *   2. Runtime: against the live Testworth family, seed a DND pref on a
 *      non-safety category + insert two notifications (one normal-priority in
 *      the DND category, one high-priority safety). Execute the exact
 *      PostgREST pattern the hook uses (without RLS because this runs with the
 *      service role) and assert:
 *        - the normal-priority DND-category notification is FILTERED OUT
 *        - the high-priority safety notification PASSES THROUGH
 *      Convention #143: safety alerts always bypass DND — non-negotiable.
 *
 * Cleans up everything it creates.
 *
 * Run: npx tsx tests/verification/row-b2-f40-dnd-suppression.ts
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Worktree layout: .env.local lives at repo root (../../../).
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '../../../.env.local') })

const url = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(2)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface Finding { label: string; pass: boolean; detail: string }
const findings: Finding[] = []
function record(label: string, pass: boolean, detail: string) {
  findings.push({ label, pass, detail })
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${label} — ${detail}`)
}

// ── (1) Static invariants ──────────────────────────────────────────────────

function staticChecks() {
  const hookPath = path.join(process.cwd(), 'src/hooks/useNotifications.ts')
  if (!fs.existsSync(hookPath)) {
    record('useNotifications source exists', false, `not found at ${hookPath}`)
    return
  }
  const src = fs.readFileSync(hookPath, 'utf-8')

  record(
    'useNotifications loads notification_preferences DND categories',
    /from\(\s*['"]notification_preferences['"]\s*\)[\s\S]*?\.eq\(\s*['"]do_not_disturb['"]\s*,\s*true\s*\)/.test(src),
    'query pattern for DND-true prefs present'
  )
  // Both consumers (useNotifications, useUnreadNotificationCount) must apply
  // the OR filter pattern: priority.eq.high,category.not.in.(...)
  const orPatternCount = (src.match(/priority\.eq\.high,category\.not\.in\./g) ?? []).length
  record(
    'Both notification readers apply the OR DND filter (priority.eq.high bypass)',
    orPatternCount >= 2,
    `OR filter occurrences: ${orPatternCount} (expected ≥ 2)`
  )
  record(
    'loadDndCategories helper introduced',
    /async\s+function\s+loadDndCategories\s*\(/.test(src),
    'shared helper function declared'
  )
}

// ── (2) Runtime exercise ───────────────────────────────────────────────────

async function runtimeCheck() {
  // Resolve Testworth family + mom.
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .ilike('family_name', '%testworth%')
    .limit(1)
    .single()
  if (!family?.id) {
    record('Testworth family located', false, 'family not found')
    return
  }
  const familyId = family.id as string

  const { data: mom } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .single()
  if (!mom?.id) {
    record('Mom located', false, 'primary_parent not found')
    return
  }
  const memberId = mom.id as string

  // ── Snapshot existing DND state for `lila` category so we can restore.
  const { data: existingPref } = await supabase
    .from('notification_preferences')
    .select('id, do_not_disturb')
    .eq('family_member_id', memberId)
    .eq('category', 'lila')
    .maybeSingle()

  // Enable DND on `lila` (or insert if missing).
  if (existingPref?.id) {
    await supabase
      .from('notification_preferences')
      .update({ do_not_disturb: true })
      .eq('id', existingPref.id)
  } else {
    await supabase
      .from('notification_preferences')
      .insert({
        family_id: familyId,
        family_member_id: memberId,
        category: 'lila',
        in_app_enabled: true,
        push_enabled: false,
        do_not_disturb: true,
      })
  }

  // Seed two notifications. Track them for cleanup.
  const insertRes = await supabase
    .from('notifications')
    .insert([
      {
        family_id: familyId,
        recipient_member_id: memberId,
        notification_type: 'lila_suggestion',
        category: 'lila',
        title: 'B2 F40 test — LiLa suggestion (DND-filtered)',
        priority: 'normal',
      },
      {
        family_id: familyId,
        recipient_member_id: memberId,
        notification_type: 'safety_alert',
        category: 'safety',
        title: 'B2 F40 test — Safety alert (bypass)',
        priority: 'high',
      },
    ])
    .select('id, category, priority, title')
  if (insertRes.error || !insertRes.data) {
    record('Seed notifications inserted', false, insertRes.error?.message ?? 'no data')
    return
  }
  const seededIds = insertRes.data.map(r => r.id as string)

  try {
    // Simulate the hook's read-layer behavior.
    const { data: dndPrefs } = await supabase
      .from('notification_preferences')
      .select('category')
      .eq('family_member_id', memberId)
      .eq('do_not_disturb', true)
    const dndCategories = (dndPrefs ?? []).map((r: { category: string }) => r.category)
    record(
      '`lila` appears in DND categories for this member',
      dndCategories.includes('lila'),
      `dnd categories: [${dndCategories.join(', ')}]`
    )

    // Execute the same OR query pattern the hook uses.
    let q = supabase
      .from('notifications')
      .select('id, category, priority, title')
      .eq('recipient_member_id', memberId)
      .eq('is_dismissed', false)
      .in('id', seededIds)

    if (dndCategories.length > 0) {
      const list = dndCategories.join(',')
      q = q.or(`priority.eq.high,category.not.in.(${list})`)
    }

    const { data: visible, error } = await q
    if (error) {
      record('Notifications read with DND filter succeeded', false, error.message)
      return
    }
    const visibleByTitle = (visible ?? []).map(r => r.title as string)

    record(
      'Non-safety notification in DND category is FILTERED OUT',
      !visibleByTitle.includes('B2 F40 test — LiLa suggestion (DND-filtered)'),
      `visible titles: [${visibleByTitle.join(' | ')}]`
    )
    record(
      'Safety alert (priority=high) BYPASSES DND and remains visible',
      visibleByTitle.includes('B2 F40 test — Safety alert (bypass)'),
      `safety alert present: ${visibleByTitle.includes('B2 F40 test — Safety alert (bypass)')}`
    )
  } finally {
    // Cleanup: remove the two seeded notifications + restore pref.
    await supabase.from('notifications').delete().in('id', seededIds)
    if (existingPref?.id) {
      await supabase
        .from('notification_preferences')
        .update({ do_not_disturb: existingPref.do_not_disturb ?? false })
        .eq('id', existingPref.id)
    } else {
      await supabase
        .from('notification_preferences')
        .delete()
        .eq('family_member_id', memberId)
        .eq('category', 'lila')
    }
  }
}

// ── Run ────────────────────────────────────────────────────────────────────

async function main() {
  staticChecks()
  await runtimeCheck()
  const failed = findings.filter(f => !f.pass)
  console.log(`\n${findings.length} checks — ${findings.length - failed.length} pass, ${failed.length} fail`)
  if (failed.length > 0) {
    console.log('\nFailed checks:')
    failed.forEach(f => console.log(`  - ${f.label}: ${f.detail}`))
    process.exit(1)
  }
  process.exit(0)
}

main().catch(err => {
  console.error('Verification crashed:', err)
  process.exit(2)
})
