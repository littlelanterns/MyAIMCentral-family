/**
 * PRD-41 Phase 3 — Convention #277 eyes-on tour (EYES_ON_TOUR=1 gated).
 *
 * Drives the two NEW mom/founder-facing surfaces this phase adds and
 * screenshots them to eyes-on-tour/ (gitignored) for Claude to read + judge:
 *
 *   el-01..03  Settings → LiLa Response Log (mom), POPULATED (3 seeded
 *              rejection rows) — desktop / tablet / mobile. Proves: plain-
 *              language category labels, per-member framing, when, NO excerpt.
 *   el-04      Settings → LiLa Response Log (mom), EMPTY state — mobile.
 *   el-05..06  Admin → Ethics Patterns curation screen (founder/staff) —
 *              desktop / mobile. Proves: ops strip counts, active-exemplar
 *              list per category (150 seeds), empty candidate queue.
 *
 * No model calls — all fixtures are service-role inserts.
 * Run: EYES_ON_TOUR=1 npx playwright test tests/e2e/features/ethics-log-eyes-on-tour.spec.ts
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { loginAsMom } from '../helpers/auth'

const RUN_TOUR = process.env.EYES_ON_TOUR === '1'
const admin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'ELTOUR'
const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

const DESKTOP = { width: 1440, height: 900 }
const TABLET = { width: 768, height: 1024 }
const MOBILE = { width: 390, height: 844 }

let familyId = ''
let momId = ''
let kidId = ''
let momUserId = ''
let staffRowId: string | null = null

async function shot(page: Page, name: string) {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function resolve() {
  const { data: fam } = await admin.from('families').select('id').ilike('family_name', '%testworth%').single()
  familyId = fam!.id
  const { data: mom } = await admin.from('family_members').select('id, user_id').eq('family_id', familyId).eq('role', 'primary_parent').single()
  momId = mom!.id
  momUserId = mom!.user_id
  const { data: kid } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('dashboard_mode', 'guided').eq('is_active', true).limit(1).single()
  kidId = kid?.id ?? momId
}

async function seedRejections() {
  await admin.from('lila_ethics_rejections').insert([
    {
      family_id: familyId, member_id: kidId, surface: 'lila-chat', mode_key: 'assist',
      direction: 'input', tier: 0, category: 'manipulation', action: 'reframed',
      content_excerpt: `${PREFIX} would-be content A`,
    },
    {
      family_id: familyId, member_id: momId, surface: 'message-coach',
      direction: 'input', tier: 0, category: 'shame_based_control', action: 'reframed',
      content_excerpt: `${PREFIX} would-be content B`,
    },
    {
      family_id: familyId, member_id: kidId, surface: 'lila-chat', mode_key: 'general',
      direction: 'output', tier: 2, category: 'withholding_affection', action: 'logged_only',
      content_excerpt: `${PREFIX} would-be content C`,
    },
  ])
}

async function sweepRejections() {
  await admin.from('lila_ethics_rejections').delete().eq('family_id', familyId).like('content_excerpt', `${PREFIX}%`)
}

test.describe('PRD-41 Phase 3 eyes-on tour', () => {
  test.skip(!RUN_TOUR, 'EYES_ON_TOUR=1 not set')
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(120_000)

  test.beforeAll(async () => {
    await resolve()
    await sweepRejections()
    // Ensure no stale staff row lingers (the admin test grants its own).
    await admin.from('staff_permissions').delete().eq('user_id', momUserId).eq('permission_type', 'ethics_admin')
  })

  test.afterAll(async () => {
    await sweepRejections()
    if (staffRowId) await admin.from('staff_permissions').delete().eq('id', staffRowId)
    await admin.from('staff_permissions').delete().eq('user_id', momUserId).eq('permission_type', 'ethics_admin')
  })

  test('LiLa Response Log — populated + empty', async ({ page }) => {
    await seedRejections()
    await loginAsMom(page)

    for (const [name, vp] of [['el-01-desktop', DESKTOP], ['el-02-tablet', TABLET], ['el-03-mobile', MOBILE]] as const) {
      await page.setViewportSize(vp)
      await page.goto('/settings')
      await page.waitForLoadState('networkidle')
      // Expand the collapsible "LiLa Response Log" section.
      const header = page.getByRole('button', { name: /LiLa Response Log/i }).first()
      await expect(header).toBeVisible({ timeout: 15_000 })
      await header.click()
      const firstRow = page.getByText(/LiLa gently redirected|LiLa softened/i).first()
      await expect(firstRow).toBeVisible({ timeout: 10_000 })
      await firstRow.scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      await shot(page, name)
    }

    // Empty state — remove the rows and reload.
    await sweepRejections()
    await page.setViewportSize(MOBILE)
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    const emptyHeader = page.getByRole('button', { name: /LiLa Response Log/i }).first()
    await emptyHeader.click()
    const emptyMsg = page.getByText(/Nothing to show yet/i)
    await expect(emptyMsg).toBeVisible({ timeout: 10_000 })
    await emptyMsg.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await shot(page, 'el-04-empty-mobile')
  })

  test('Admin Ethics Patterns curation screen', async ({ page }) => {
    // Grant a temporary ethics_admin staff row (removed in afterAll) so the
    // AdminGate + staff-gated RPCs admit the Testworth mom for the screenshots.
    // Scoped to THIS test only — granting it family-wide/earlier would make
    // the mom an admin during the Response Log test and redirect her.
    const { data: staff, error } = await admin
      .from('staff_permissions')
      .insert({ user_id: momUserId, permission_type: 'ethics_admin', granted_by: momUserId })
      .select('id')
      .single()
    if (error || !staff) throw new Error(`staff row insert failed: ${error?.message}`)
    staffRowId = staff.id

    await loginAsMom(page)

    for (const [name, vp] of [['el-05-admin-desktop', DESKTOP], ['el-06-admin-mobile', MOBILE]] as const) {
      await page.setViewportSize(vp)
      await page.goto('/admin/ethics-patterns')
      await page.waitForLoadState('networkidle')
      // useIsAdmin resolves async on mount; give it a beat to admit us.
      await page.waitForTimeout(1500)
      await expect(page.getByRole('heading', { name: /Ethics Patterns/i })).toBeVisible({ timeout: 15_000 })
      // Active exemplars from the 150 seeds render.
      await expect(page.getByText(/Active exemplars/i)).toBeVisible({ timeout: 10_000 })
      await shot(page, name)
    }
  })
})
