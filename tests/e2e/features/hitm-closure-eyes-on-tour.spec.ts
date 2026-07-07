/**
 * HITM-CLOSURE — Convention #277 eyes-on tour (EYES_ON_TOUR=1 gated)
 *
 * Drives the three touched surfaces with REAL model calls and screenshots
 * them to eyes-on-tour/ (gitignored) for Claude to read and judge:
 *
 *   01-03  Ask LiLa draft card (mom) — desktop / tablet / mobile (one
 *          invocation; viewport resized with the draft card mounted)
 *   04-06  Board of Directors advisor HITM row (mom) — desktop/tablet/mobile
 *          (one live advisor call; resized)
 *   07-09  BookShelf discussion HITM row (mom) — desktop/tablet/mobile
 *          (seeded fixture, no model call)
 *   10     Ask LiLa draft card as a GUIDED kid (Jordan) — mobile, verifying
 *          the age-appropriate copy variant (one invocation)
 *
 * Run: EYES_ON_TOUR=1 npx playwright test tests/e2e/features/hitm-closure-eyes-on-tour.spec.ts
 * Total model calls: 3 (2 Ask LiLa + 1 BoD advisor).
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { loginAsMom, loginAsJordan } from '../helpers/auth'

const RUN_TOUR = process.env.EYES_ON_TOUR === '1'
const admin = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'HITMTOUR'
const SHOT_DIR = path.join(process.cwd(), 'eyes-on-tour')

const DESKTOP = { width: 1440, height: 900 }
const TABLET = { width: 768, height: 1024 }
const MOBILE = { width: 390, height: 844 }

let familyId: string
let momId: string
let jordanId: string
let threadId: string
let bookAssistantMsgId: string

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage: false })
}

async function sweep() {
  const { data: spaces } = await admin.from('conversation_spaces').select('id').ilike('name', `${PREFIX}%`)
  for (const s of spaces ?? []) {
    const { data: threads } = await admin.from('conversation_threads').select('id').eq('space_id', s.id)
    for (const t of threads ?? []) {
      await admin.from('message_read_status').delete().eq('thread_id', t.id)
      await admin.from('messages').delete().eq('thread_id', t.id)
    }
    await admin.from('conversation_threads').delete().eq('space_id', s.id)
    await admin.from('conversation_space_members').delete().eq('space_id', s.id)
    await admin.from('conversation_spaces').delete().eq('id', s.id)
  }
  const { data: titled } = await admin.from('lila_conversations').select('id').ilike('title', `${PREFIX}%`)
  const { data: live } = momId
    ? await admin.from('lila_conversations').select('id').eq('member_id', momId).eq('guided_mode', 'board_of_directors').gte('created_at', suiteStart)
    : { data: [] }
  for (const c of [...(titled ?? []), ...(live ?? [])]) {
    const { data: sessions } = await admin.from('board_sessions').select('id').eq('conversation_id', c.id)
    for (const b of sessions ?? []) {
      await admin.from('board_session_personas').delete().eq('board_session_id', b.id)
      await admin.from('board_sessions').delete().eq('id', b.id)
    }
    await admin.from('lila_messages').delete().eq('conversation_id', c.id)
    await admin.from('lila_conversations').delete().eq('id', c.id)
  }
  await admin.from('board_personas').delete().ilike('persona_name', `${PREFIX}%`)
  const { data: discs } = await admin.from('bookshelf_discussions').select('id').ilike('title', `${PREFIX}%`)
  for (const d of discs ?? []) {
    await admin.from('bookshelf_discussion_messages').delete().eq('discussion_id', d.id)
    await admin.from('bookshelf_discussions').delete().eq('id', d.id)
  }
}

let suiteStart: string

test.describe('HITM-CLOSURE eyes-on tour', () => {
  test.skip(!RUN_TOUR, 'EYES_ON_TOUR=1 not set')
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(300_000)

  test.beforeAll(async () => {
    if (!RUN_TOUR) return
    fs.mkdirSync(SHOT_DIR, { recursive: true })
    suiteStart = new Date().toISOString()

    const { data: fam } = await admin.from('families').select('id').ilike('family_name', '%testworth%').single()
    familyId = fam!.id
    const { data: mom } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('role', 'primary_parent').single()
    momId = mom!.id
    const { data: jordan } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('dashboard_mode', 'guided').limit(1).single()
    jordanId = jordan!.id

    await sweep()

    const { data: space } = await admin.from('conversation_spaces')
      .insert({ family_id: familyId, space_type: 'direct', name: `${PREFIX} Space`, created_by: momId })
      .select('id').single()
    await admin.from('conversation_space_members').insert([
      { space_id: space!.id, family_member_id: momId },
      { space_id: space!.id, family_member_id: jordanId },
    ])
    const { data: thread } = await admin.from('conversation_threads')
      .insert({ space_id: space!.id, title: `${PREFIX} Tour Thread`, started_by: momId })
      .select('id').single()
    threadId = thread!.id

    await admin.from('board_personas').insert({
      persona_name: `${PREFIX} Advisor`,
      persona_type: 'personal_custom',
      personality_profile: { traits: ['practical', 'brief'], known_for: 'Tour advisor — one short sentence', communication_style: 'One short, direct sentence.' },
      content_policy_status: 'approved',
      is_public: false,
      created_by: momId,
      family_id: familyId,
    })

    const { data: disc } = await admin.from('bookshelf_discussions')
      .insert({ family_id: familyId, family_member_id: momId, bookshelf_item_ids: [], discussion_type: 'discuss', audience: 'personal', title: `${PREFIX} Book Chat` })
      .select('id').single()
    await admin.from('bookshelf_discussion_messages').insert({ discussion_id: disc!.id, role: 'user', content: 'What is the main idea?', metadata: {} })
    const { data: aiMsg } = await admin.from('bookshelf_discussion_messages')
      .insert({ discussion_id: disc!.id, role: 'assistant', content: 'The main idea is stewardship — caring well for what you have been given.', metadata: {} })
      .select('id').single()
    bookAssistantMsgId = aiMsg!.id
  })

  test.afterAll(async () => {
    if (!RUN_TOUR) return
    await sweep()
  })

  test('01-03 — Ask LiLa draft card (mom, three viewports)', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await loginAsMom(page)
    await page.goto(`/messages/thread/${threadId}`)
    const input = page.getByPlaceholder('Type a message...')
    await expect(input).toBeVisible({ timeout: 15_000 })
    await input.fill('What is one fun thing we could do together this weekend?')
    await page.getByRole('button', { name: 'Ask LiLa & Send' }).click()
    await expect(page.getByTestId('lila-draft-send')).toBeVisible({ timeout: 120_000 })
    await shot(page, 'hitm-01-draft-mom-desktop')
    await page.setViewportSize(TABLET)
    await page.waitForTimeout(600)
    await shot(page, 'hitm-02-draft-mom-tablet')
    await page.setViewportSize(MOBILE)
    await page.waitForTimeout(600)
    await shot(page, 'hitm-03-draft-mom-mobile')
    await page.getByTestId('lila-draft-discard').click()
  })

  test('04-06 — BoD advisor HITM row (mom, three viewports)', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await loginAsMom(page)
    await page.goto('/vault')
    await expect(page.getByRole('heading', { name: 'AI Vault' })).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1500)
    const vaultSearch = page.getByPlaceholder(/search/i).first()
    await vaultSearch.fill('Board of Directors')
    await page.waitForTimeout(1000)
    const cardHeading = page.getByRole('heading', { name: 'Board of Directors', level: 3, exact: true }).first()
    await expect(cardHeading).toBeVisible({ timeout: 10_000 })
    await cardHeading.locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]').dispatchEvent('click')
    await page.getByRole('button', { name: /Launch Tool/i }).click()
    const modal = page.getByTestId('board-of-directors-modal')
    await expect(modal).toBeVisible({ timeout: 10_000 })

    await modal.getByRole('button', { name: /Add/ }).first().click()
    const personaSearch = page.getByPlaceholder('Search for a person, character, or archetype...')
    await personaSearch.fill(PREFIX)
    const seatBtn = page.getByRole('button', { name: 'Seat', exact: true }).first()
    await expect(seatBtn).toBeVisible({ timeout: 10_000 })
    await seatBtn.click()

    const boardInput = modal.getByPlaceholder('Type a message...')
    await expect(boardInput).toBeVisible({ timeout: 10_000 })
    await boardInput.fill('In one sentence: should we plant a garden this spring?')
    await boardInput.press('Enter')
    await expect(page.locator('[data-testid^="bod-hitm-"]').first()).toBeVisible({ timeout: 120_000 })
    await shot(page, 'hitm-04-bod-mom-desktop')
    await page.setViewportSize(TABLET)
    await page.waitForTimeout(600)
    await shot(page, 'hitm-05-bod-mom-tablet')
    await page.setViewportSize(MOBILE)
    await page.waitForTimeout(600)
    await shot(page, 'hitm-06-bod-mom-mobile')
  })

  test('07-09 — BookShelf discussion HITM row (mom, three viewports)', async ({ page }) => {
    await page.setViewportSize(DESKTOP)
    await loginAsMom(page)
    await page.goto('/bookshelf')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2_000)
    await page.getByRole('button', { name: /History/ }).click()
    await expect(page.getByText('BookShelf History')).toBeVisible({ timeout: 10_000 })
    await page.getByText(`${PREFIX} Book Chat`).first().click()
    await expect(page.getByTestId(`bookshelf-hitm-${bookAssistantMsgId}`)).toBeVisible({ timeout: 15_000 })
    await shot(page, 'hitm-07-bookshelf-mom-desktop')
    await page.setViewportSize(TABLET)
    await page.waitForTimeout(600)
    await shot(page, 'hitm-08-bookshelf-mom-tablet')
    await page.setViewportSize(MOBILE)
    await page.waitForTimeout(600)
    await shot(page, 'hitm-09-bookshelf-mom-mobile')
  })

  test('10 — Ask LiLa draft card as Guided kid (Jordan, mobile) — kid copy', async ({ page }) => {
    await page.setViewportSize(MOBILE)
    await loginAsJordan(page)
    await page.goto(`/messages/thread/${threadId}`)
    const input = page.getByPlaceholder('Type a message...')
    await expect(input).toBeVisible({ timeout: 15_000 })
    await input.fill('What should I say to mom about my project?')
    await page.getByRole('button', { name: 'Ask LiLa & Send' }).click()
    await expect(page.getByTestId('lila-draft-send')).toBeVisible({ timeout: 120_000 })
    // Kid copy variant must be present
    await expect(page.getByText("LiLa's idea — only you can see it right now")).toBeVisible()
    await expect(page.getByRole('button', { name: 'Make it my own' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Skip it' })).toBeVisible()
    await shot(page, 'hitm-10-draft-kid-mobile')
    await page.getByTestId('lila-draft-discard').click()
  })
})
