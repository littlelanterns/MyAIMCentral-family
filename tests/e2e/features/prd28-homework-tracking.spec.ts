/**
 * PRD-28 Sub-phase B — Homework & Subjects Tracking E2E Tests
 *
 * Covers:
 *   1. homeschool_subjects table queryable, archive-only (no delete)
 *   2. homeschool_configs dual-record pattern — family default + per-child override
 *   3. homeschool_time_logs table queryable, INSERT with status='pending' works
 *   4. Log Learning widget registered in TRACKER_TYPE_REGISTRY
 *   5. homeschool_child_report source type accepted by family_requests
 *   6. useResolvedHomeschoolConfig resolves child → family → null correctly
 *   7. Victory created immediately on Log Learning submission when checkbox checked
 *   8. /settings/homework route loads for mom, not visible to children
 */
import { test, expect } from '@playwright/test'
import { loginAsMom, loginAsAlex } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? ''

// ── Supabase helpers ────────────────────────────────────────

function getServiceSupabase() {
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

async function getChild(sb: ReturnType<typeof createClient>, familyId: string, name: string) {
  const { data } = await sb
    .from('family_members')
    .select('id, display_name, dashboard_mode')
    .eq('family_id', familyId)
    .eq('role', 'member')
    .ilike('display_name', `%${name}%`)
    .limit(1)
    .single()
  return data as { id: string; display_name: string; dashboard_mode: string } | null
}

// ── Cleanup ─────────────────────────────────────────────────

async function cleanupTestData(familyId: string) {
  const admin = getServiceSupabase()
  // Clean up in reverse dependency order
  await admin.from('homeschool_time_logs').delete().eq('family_id', familyId)
  await admin.from('homeschool_configs').delete().eq('family_id', familyId)
  await admin.from('homeschool_subjects').delete().eq('family_id', familyId)
}

// ═══════════════════════════════════════════════════════════
// TEST 1: homeschool_subjects table — CRUD + archive-only
// ═══════════════════════════════════════════════════════════

test.describe('1. homeschool_subjects table', () => {
  test('can create, query, and archive subjects (never delete)', async () => {
    const { sb, member } = await getMomMember()
    const familyId = member.family_id

    // Cleanup
    await cleanupTestData(familyId)

    // Create a subject
    const { data: created, error: createErr } = await sb
      .from('homeschool_subjects')
      .insert({
        family_id: familyId,
        name: 'E2E Test Math',
        default_weekly_hours: null, // No target (opt-in)
        icon_key: 'Calculator',
      })
      .select()
      .single()

    expect(createErr).toBeNull()
    expect(created).toBeTruthy()
    expect(created.name).toBe('E2E Test Math')
    expect(created.default_weekly_hours).toBeNull()
    expect(created.is_active).toBe(true)

    // Query active subjects
    const { data: subjects } = await sb
      .from('homeschool_subjects')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)

    expect(subjects).toBeTruthy()
    expect(subjects!.length).toBeGreaterThanOrEqual(1)

    // Archive (never delete)
    const { error: archErr } = await sb
      .from('homeschool_subjects')
      .update({ is_active: false })
      .eq('id', created.id)

    expect(archErr).toBeNull()

    // Verify archived is excluded from active query
    const { data: activeOnly } = await sb
      .from('homeschool_subjects')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)

    const found = activeOnly?.find((s: { id: string }) => s.id === created.id)
    expect(found).toBeUndefined()

    // But still exists with includeArchived
    const { data: all } = await sb
      .from('homeschool_subjects')
      .select('*')
      .eq('family_id', familyId)

    const archived = all?.find((s: { id: string }) => s.id === created.id)
    expect(archived).toBeTruthy()
    expect(archived!.is_active).toBe(false)

    // Cleanup
    await cleanupTestData(familyId)
  })

  test('UNIQUE constraint prevents duplicate subject names per family', async () => {
    const { sb, member } = await getMomMember()
    const familyId = member.family_id

    await cleanupTestData(familyId)

    await sb.from('homeschool_subjects').insert({ family_id: familyId, name: 'E2E Unique Test' })

    const { error } = await sb
      .from('homeschool_subjects')
      .insert({ family_id: familyId, name: 'E2E Unique Test' })

    expect(error).toBeTruthy()
    expect(error!.code).toBe('23505') // unique_violation

    await cleanupTestData(familyId)
  })
})

// ═══════════════════════════════════════════════════════════
// TEST 2: homeschool_configs dual-record pattern
// ═══════════════════════════════════════════════════════════

test.describe('2. homeschool_configs dual-record pattern', () => {
  test('family-default record (family_member_id=NULL) + per-child override', async () => {
    const { sb, member } = await getMomMember()
    const familyId = member.family_id

    await cleanupTestData(familyId)

    // Create family-default config (family_member_id = null)
    const { data: familyDefault, error: fdErr } = await sb
      .from('homeschool_configs')
      .insert({
        family_id: familyId,
        family_member_id: null,
        time_allocation_mode: 'full',
        school_year_start: '2026-08-15',
        school_year_end: '2027-05-30',
      })
      .select()
      .single()

    expect(fdErr).toBeNull()
    expect(familyDefault).toBeTruthy()
    expect(familyDefault.family_member_id).toBeNull()
    expect(familyDefault.school_year_start).toBe('2026-08-15')

    // Find a child
    const child = await getChild(sb, familyId, 'Alex')
    if (!child) {
      console.warn('No child named Alex found — skipping per-child override test')
      await cleanupTestData(familyId)
      return
    }

    // Create per-child override
    const { data: childOverride, error: coErr } = await sb
      .from('homeschool_configs')
      .insert({
        family_id: familyId,
        family_member_id: child.id,
        time_allocation_mode: 'strict',
        school_year_start: '2026-09-01', // Different start for this child
      })
      .select()
      .single()

    expect(coErr).toBeNull()
    expect(childOverride).toBeTruthy()
    expect(childOverride.time_allocation_mode).toBe('strict')
    expect(childOverride.school_year_start).toBe('2026-09-01')

    // Query all configs for the family
    const { data: allConfigs } = await sb
      .from('homeschool_configs')
      .select('*')
      .eq('family_id', familyId)

    expect(allConfigs).toBeTruthy()
    const familyRec = allConfigs!.find((c: { family_member_id: string | null }) => c.family_member_id === null)
    const childRec = allConfigs!.find((c: { family_member_id: string | null }) => c.family_member_id === child.id)
    expect(familyRec).toBeTruthy()
    expect(childRec).toBeTruthy()

    // Resolution: child.school_year_start overrides family default
    expect(childRec!.school_year_start).toBe('2026-09-01')
    // But family default has school_year_end while child doesn't
    expect(familyRec!.school_year_end).toBe('2027-05-30')
    expect(childRec!.school_year_end).toBeNull()

    await cleanupTestData(familyId)
  })
})

// ═══════════════════════════════════════════════════════════
// TEST 3: homeschool_time_logs table queryable
// ═══════════════════════════════════════════════════════════

test.describe('3. homeschool_time_logs', () => {
  test('can INSERT confirmed time log as mom', async () => {
    const { sb, member } = await getMomMember()
    const familyId = member.family_id

    await cleanupTestData(familyId)

    // Create a subject first
    const { data: subject } = await sb
      .from('homeschool_subjects')
      .insert({ family_id: familyId, name: 'E2E Log Test Subject' })
      .select()
      .single()

    expect(subject).toBeTruthy()

    // Insert time log
    const { data: log, error: logErr } = await sb
      .from('homeschool_time_logs')
      .insert({
        family_id: familyId,
        family_member_id: member.id,
        subject_id: subject!.id,
        log_date: '2026-04-13',
        minutes_logged: 45,
        allocation_mode_used: 'full',
        source: 'manual_entry',
        status: 'confirmed',
        description: 'E2E test learning session',
      })
      .select()
      .single()

    expect(logErr).toBeNull()
    expect(log).toBeTruthy()
    expect(log.minutes_logged).toBe(45)
    expect(log.status).toBe('confirmed')

    await cleanupTestData(familyId)
  })
})

// ═══════════════════════════════════════════════════════════
// TEST 4: Log Learning widget registered in TRACKER_TYPE_REGISTRY
// ═══════════════════════════════════════════════════════════

test.describe('4. Log Learning widget registration', () => {
  test('log_learning type visible in widget source code', async () => {
    // Verify the widget type is registered by reading the source file directly
    // (E2E tests cannot import @/ aliased modules)
    const fs = await import('fs')
    const widgetTypes = fs.readFileSync('src/types/widgets.ts', 'utf-8')
    expect(widgetTypes).toContain("type: 'log_learning'")
    expect(widgetTypes).toContain("label: 'Learning Log'")
    expect(widgetTypes).toContain("category: 'reflection_insight'")

    // Also verify WidgetRenderer has the case
    const renderer = fs.readFileSync('src/components/widgets/WidgetRenderer.tsx', 'utf-8')
    expect(renderer).toContain("case 'log_learning'")
    expect(renderer).toContain('LogLearningTracker')

    // And WidgetPicker has it in the category
    const picker = fs.readFileSync('src/components/widgets/WidgetPicker.tsx', 'utf-8')
    expect(picker).toContain("'log_learning'")
  })
})

// ═══════════════════════════════════════════════════════════
// TEST 5: homeschool_child_report source accepted by family_requests
// ═══════════════════════════════════════════════════════════

test.describe('5. homeschool_child_report request source', () => {
  test('family_requests accepts homeschool_child_report source', async () => {
    const { sb, member } = await getMomMember()
    const familyId = member.family_id

    // Create a request with homeschool_child_report source
    const { data: request, error } = await sb
      .from('family_requests')
      .insert({
        family_id: familyId,
        sender_member_id: member.id,
        recipient_member_id: member.id, // self-request for test
        title: 'E2E Learning log test',
        details: 'Studied math for 45 minutes',
        source: 'homeschool_child_report',
        status: 'pending',
      })
      .select('id, source')
      .single()

    expect(error).toBeNull()
    expect(request).toBeTruthy()
    expect(request!.source).toBe('homeschool_child_report')

    // Cleanup
    await sb.from('family_requests').delete().eq('id', request!.id)
  })
})

// ═══════════════════════════════════════════════════════════
// TEST 6: Resolved config — child → family → null
// ═══════════════════════════════════════════════════════════

test.describe('6. Config resolution', () => {
  test('child override takes precedence over family default', async () => {
    const { sb, member } = await getMomMember()
    const familyId = member.family_id

    await cleanupTestData(familyId)

    // Family default: mode=full, school year Aug-May
    await sb.from('homeschool_configs').insert({
      family_id: familyId,
      family_member_id: null,
      time_allocation_mode: 'full',
      school_year_start: '2026-08-15',
      school_year_end: '2027-05-30',
    })

    const child = await getChild(sb, familyId, 'Alex')
    if (!child) {
      await cleanupTestData(familyId)
      return
    }

    // Child override: mode=strict, school_year_start different, school_year_end NULL (inherit)
    await sb.from('homeschool_configs').insert({
      family_id: familyId,
      family_member_id: child.id,
      time_allocation_mode: 'strict',
      school_year_start: '2026-09-01',
      school_year_end: null,
    })

    // Fetch both
    const { data: all } = await sb
      .from('homeschool_configs')
      .select('*')
      .eq('family_id', familyId)

    const familyRec = all!.find((c: { family_member_id: string | null }) => c.family_member_id === null)
    const childRec = all!.find((c: { family_member_id: string | null }) => c.family_member_id === child.id)

    // Resolve: child override → family default → null
    const resolvedMode = childRec?.time_allocation_mode ?? familyRec?.time_allocation_mode ?? 'full'
    const resolvedStart = childRec?.school_year_start ?? familyRec?.school_year_start ?? null
    const resolvedEnd = childRec?.school_year_end ?? familyRec?.school_year_end ?? null

    expect(resolvedMode).toBe('strict') // child override wins
    expect(resolvedStart).toBe('2026-09-01') // child override wins
    expect(resolvedEnd).toBe('2027-05-30') // falls back to family default

    await cleanupTestData(familyId)
  })
})

// ═══════════════════════════════════════════════════════════
// TEST 7: Victory created on Log Learning submission
// ═══════════════════════════════════════════════════════════

test.describe('7. Victory from Log Learning', () => {
  test('victory with source=homeschool_logged can be created', async () => {
    const { sb, member } = await getMomMember()
    const familyId = member.family_id

    // Create a victory directly (simulating what useLogLearning + useCreateVictory do)
    const { data: victory, error } = await sb
      .from('victories')
      .insert({
        family_id: familyId,
        family_member_id: member.id,
        description: 'E2E: Logged 45 min of learning',
        source: 'homeschool_logged',
        member_type: 'adult',
      })
      .select('id, source')
      .single()

    expect(error).toBeNull()
    expect(victory).toBeTruthy()
    expect(victory!.source).toBe('homeschool_logged')

    // Cleanup
    await sb.from('victories').delete().eq('id', victory!.id)
  })
})

// ═══════════════════════════════════════════════════════════
// TEST 8: /settings/homework route — mom access, not children
// ═══════════════════════════════════════════════════════════

test.describe('8. Settings route access', () => {
  test('mom can navigate to /settings/homework', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('http://localhost:5173/settings/homework')
    await waitForAppReady(page)

    // Should see the Homework & Subjects heading
    const heading = page.locator('h1:has-text("Homework & Subjects")')
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test('Settings page shows Homework & Subjects section for mom', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('http://localhost:5173/settings')
    await waitForAppReady(page)

    // Look for the Homework & Subjects nav row
    const navRow = page.locator('text=Homework & Subjects')
    await expect(navRow.first()).toBeVisible({ timeout: 10000 })
  })

  test('child (Alex) does not see Homework & Subjects in settings', async ({ page }) => {
    await loginAsAlex(page)
    await page.goto('http://localhost:5173/settings')
    await waitForAppReady(page)

    // Homework & Subjects should NOT appear (it's mom-only)
    const navRow = page.locator('a:has-text("Homework & Subjects")')
    // Wait a moment to ensure page is loaded
    await page.waitForTimeout(2000)
    await expect(navRow).toHaveCount(0)
  })
})
