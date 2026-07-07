/**
 * HITM-CLOSURE — Beta Readiness HITM audit closure pins (2026-07-06)
 *
 * Pins the three code fixes from the founder-ruled HITM audit
 * (claude/feature-decisions/Beta-Readiness-Report-2026-07.md §4E):
 *
 *  1. "Ask LiLa & Send" gate — the streamed reply is a PRIVATE draft;
 *     nothing persists to `messages` until [Send]. [Edit] moves the text
 *     into the invoker's composer to post as THEMSELVES. [Discard] leaves
 *     zero rows. Forged send_draft signatures are rejected (HMAC verbatim
 *     guarantee — nobody can post edited words under LiLa's name).
 *  2. Board of Directors advisor replies carry HITM controls; Reject
 *     deletes that advisor's lila_messages row.
 *  3. BookShelf discussion replies carry HITM controls; Reject deletes the
 *     bookshelf_discussion_messages row.
 *
 * Cost note: tests 1-4 make REAL Sonnet calls through the deployed
 * lila-message-respond function (~3 invocations per run). Tests 5-6 are
 * seeded-fixture UI pins with no model calls (BoD regenerate is exercised
 * by code review + the deployed action; a live regen would cost a Sonnet
 * call per run for no additional assertion value beyond test 5's).
 *
 * Fixtures: HITMCLO prefix, created in beforeAll, swept in beforeAll +
 * afterAll via service role. Zero residue.
 */
import { test, expect, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsMom } from '../helpers/auth'
import { TEST_USERS } from '../helpers/seed-testworths-complete'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'HITMCLO'

let familyId: string
let momId: string
let otherMemberId: string

// Messaging fixtures — one thread per Ask-LiLa test so row counts stay clean
let spaceId: string
let threadDiscardId: string
let threadSendId: string
let threadEditId: string

// BoD fixtures — a seeded PERSONAL persona the live board session seats.
// NOTE: resumed BoD conversations open ToolConversationModal (which already
// has HITM via LilaMessageBubble) — BoardOfDirectorsModal only ever runs LIVE
// sessions, so the pin drives a real board turn (1 Sonnet advisor call).
let bodPersonaId: string
let suiteStartIso: string

// BookShelf fixtures
let bookDiscussionId: string
let bookAssistantMsgId: string

// ── Helpers ──

async function threadMessages(threadId: string) {
  const { data } = await admin
    .from('messages')
    .select('id, message_type, sender_member_id, content, metadata')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  return data ?? []
}

async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (v: T) => boolean,
  timeoutMs = 15_000,
  intervalMs = 500,
): Promise<T> {
  const start = Date.now()
  let last: T = await fn()
  while (Date.now() - start < timeoutMs) {
    if (predicate(last)) return last
    await new Promise(r => setTimeout(r, intervalMs))
    last = await fn()
  }
  return last
}

async function sweep() {
  // Messaging (messages → read status → threads → members → spaces)
  const { data: spaces } = await admin
    .from('conversation_spaces')
    .select('id')
    .ilike('name', `${PREFIX}%`)
  for (const s of spaces ?? []) {
    const { data: threads } = await admin
      .from('conversation_threads')
      .select('id')
      .eq('space_id', s.id)
    for (const t of threads ?? []) {
      await admin.from('message_read_status').delete().eq('thread_id', t.id)
      await admin.from('messages').delete().eq('thread_id', t.id)
    }
    await admin.from('conversation_threads').delete().eq('space_id', s.id)
    await admin.from('conversation_space_members').delete().eq('space_id', s.id)
    await admin.from('conversation_spaces').delete().eq('id', s.id)
  }

  // BoD (messages → session personas → sessions → conversations → personas).
  // Live-created board conversations have no title — sweep by title prefix
  // AND by mom's board conversations created during this suite run.
  const { data: titled } = await admin
    .from('lila_conversations')
    .select('id')
    .ilike('title', `${PREFIX}%`)
  let liveConvs: Array<{ id: string }> = []
  if (suiteStartIso && momId) {
    const { data } = await admin
      .from('lila_conversations')
      .select('id')
      .eq('member_id', momId)
      .eq('guided_mode', 'board_of_directors')
      .gte('created_at', suiteStartIso)
    liveConvs = data ?? []
  }
  const convs = [...(titled ?? []), ...liveConvs]
  for (const c of convs) {
    const { data: sessions } = await admin
      .from('board_sessions')
      .select('id')
      .eq('conversation_id', c.id)
    for (const b of sessions ?? []) {
      await admin.from('board_session_personas').delete().eq('board_session_id', b.id)
      await admin.from('board_sessions').delete().eq('id', b.id)
    }
    await admin.from('lila_messages').delete().eq('conversation_id', c.id)
    await admin.from('lila_conversations').delete().eq('id', c.id)
  }
  await admin.from('board_personas').delete().ilike('persona_name', `${PREFIX}%`)

  // BookShelf discussions (messages cascade on FK, but delete explicitly for safety)
  const { data: discs } = await admin
    .from('bookshelf_discussions')
    .select('id')
    .ilike('title', `${PREFIX}%`)
  for (const d of discs ?? []) {
    await admin.from('bookshelf_discussion_messages').delete().eq('discussion_id', d.id)
    await admin.from('bookshelf_discussions').delete().eq('id', d.id)
  }
}

test.describe('HITM-CLOSURE pins', () => {
  test.describe.configure({ mode: 'serial' })
  test.setTimeout(180_000)

  test.beforeAll(async () => {
    // Resolve Testworth family + mom + one other member
    const { data: family } = await admin
      .from('families')
      .select('id')
      .ilike('family_name', '%testworth%')
      .single()
    familyId = family!.id

    const { data: mom } = await admin
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .eq('role', 'primary_parent')
      .single()
    momId = mom!.id

    const { data: other } = await admin
      .from('family_members')
      .select('id')
      .eq('family_id', familyId)
      .neq('id', momId)
      .neq('role', 'family')
      .eq('is_active', true)
      .limit(1)
      .single()
    otherMemberId = other!.id

    await sweep()

    // Coaching must not intercept the Edit-path send — force mom's setting off
    const { data: coach } = await admin
      .from('message_coaching_settings')
      .select('id')
      .eq('family_member_id', momId)
      .limit(1)
      .maybeSingle()
    if (coach) {
      await admin.from('message_coaching_settings').update({ is_enabled: false }).eq('id', coach.id)
    }

    // ── Messaging fixtures: one space, three threads ──
    const { data: space } = await admin
      .from('conversation_spaces')
      .insert({
        family_id: familyId,
        space_type: 'direct',
        name: `${PREFIX} Space`,
        created_by: momId,
      })
      .select('id')
      .single()
    spaceId = space!.id

    await admin.from('conversation_space_members').insert([
      { space_id: spaceId, family_member_id: momId },
      { space_id: spaceId, family_member_id: otherMemberId },
    ])

    const mkThread = async (title: string) => {
      const { data: t } = await admin
        .from('conversation_threads')
        .insert({ space_id: spaceId, title, started_by: momId })
        .select('id')
        .single()
      return t!.id
    }
    threadDiscardId = await mkThread(`${PREFIX} Discard Thread`)
    threadSendId = await mkThread(`${PREFIX} Send Thread`)
    threadEditId = await mkThread(`${PREFIX} Edit Thread`)

    // ── BoD fixture: a personal persona the live session will seat ──
    suiteStartIso = new Date().toISOString()
    const { data: persona } = await admin
      .from('board_personas')
      .insert({
        persona_name: `${PREFIX} Advisor`,
        persona_type: 'personal_custom',
        personality_profile: {
          traits: ['practical', 'brief'],
          known_for: `${PREFIX} test advisor — answers in one short sentence`,
          communication_style: 'One short, direct sentence.',
        },
        content_policy_status: 'approved',
        is_public: false,
        created_by: momId,
        family_id: familyId,
      })
      .select('id')
      .single()
    bodPersonaId = persona!.id

    // ── BookShelf fixtures: discussion + user msg + assistant msg ──
    // bookshelf_item_ids only feeds the client-side title lookup — any owned
    // book id works; fall back to any book, then to an empty array.
    const { data: ownBook } = await admin
      .from('bookshelf_items')
      .select('id')
      .eq('family_id', familyId)
      .limit(1)
      .maybeSingle()
    const bookIds = ownBook ? [ownBook.id] : []

    const { data: disc } = await admin
      .from('bookshelf_discussions')
      .insert({
        family_id: familyId,
        family_member_id: momId,
        bookshelf_item_ids: bookIds,
        discussion_type: 'discuss',
        audience: 'personal',
        title: `${PREFIX} Book Chat`,
      })
      .select('id')
      .single()
    bookDiscussionId = disc!.id

    await admin.from('bookshelf_discussion_messages').insert({
      discussion_id: bookDiscussionId,
      role: 'user',
      content: `${PREFIX} — what is the main idea?`,
      metadata: {},
    })
    const { data: bookMsg } = await admin
      .from('bookshelf_discussion_messages')
      .insert({
        discussion_id: bookDiscussionId,
        role: 'assistant',
        content: `${PREFIX} assistant reply: the main idea is stewardship.`,
        metadata: {},
      })
      .select('id')
      .single()
    bookAssistantMsgId = bookMsg!.id
  })

  test.afterAll(async () => {
    await sweep()
  })

  // ── Shared Ask-LiLa driver ──

  async function invokeAskLila(page: Page, threadId: string, prompt: string) {
    await page.goto(`/messages/thread/${threadId}`)
    const input = page.getByPlaceholder('Type a message...')
    await expect(input).toBeVisible({ timeout: 15_000 })
    await input.fill(prompt)
    await page.getByRole('button', { name: 'Ask LiLa & Send' }).click()
    // The invoker's own message posts immediately; the draft streams in.
    await expect(page.getByTestId('lila-draft-preview')).toBeVisible({ timeout: 30_000 })
    // Draft ready = action buttons render (stream complete)
    await expect(page.getByTestId('lila-draft-send')).toBeVisible({ timeout: 120_000 })
  }

  // ── 1. Draft is private; Discard leaves ZERO new rows ──

  test('Ask LiLa: draft is invoker-private and Discard persists nothing', async ({ page }) => {
    await loginAsMom(page)
    await invokeAskLila(page, threadDiscardId, `${PREFIX} what is a good bedtime routine?`)

    // While the draft is on screen, the DB holds ONLY mom's user message —
    // no lila row exists, so no other member can possibly see one.
    const during = await threadMessages(threadDiscardId)
    expect(during.filter(m => m.message_type === 'lila')).toHaveLength(0)
    expect(during.filter(m => m.message_type === 'user')).toHaveLength(1)

    await page.getByTestId('lila-draft-discard').click()
    await expect(page.getByTestId('lila-draft-preview')).not.toBeVisible()

    const after = await threadMessages(threadDiscardId)
    expect(after.filter(m => m.message_type === 'lila')).toHaveLength(0)
    expect(after).toHaveLength(1)
  })

  // ── 2. Send posts exactly one verbatim lila row ──

  test('Ask LiLa: Send posts exactly one message_type=lila row, verbatim', async ({ page }) => {
    await loginAsMom(page)
    await invokeAskLila(page, threadSendId, `${PREFIX} name one fun rainy day activity`)

    const draftText = (await page.getByTestId('lila-draft-content').innerText()).trim()
    expect(draftText.length).toBeGreaterThan(0)

    await page.getByTestId('lila-draft-send').click()
    await expect(page.getByTestId('lila-draft-preview')).not.toBeVisible({ timeout: 20_000 })

    const rows = await pollUntil(
      () => threadMessages(threadSendId),
      msgs => msgs.some(m => m.message_type === 'lila'),
    )
    const lilaRows = rows.filter(m => m.message_type === 'lila')
    expect(lilaRows).toHaveLength(1)
    // Verbatim: DB content matches what the preview showed (whitespace-normalized
    // — innerText collapses rendering artifacts; the HMAC guarantees byte-exactness
    // server-side, this asserts the user saw what got posted).
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
    expect(normalize(lilaRows[0].content)).toBe(normalize(draftText))
    const meta = (lilaRows[0].metadata ?? {}) as Record<string, unknown>
    expect(meta.feature).toBe('ask_lila_send')
    expect(meta.approved_by_member_id).toBe(momId)
    expect(lilaRows[0].sender_member_id).toBeNull()
  })

  // ── 3. Edit moves the text into the composer; posting creates a USER row ──

  test('Ask LiLa: Edit prefills the composer and posts as the member, never as LiLa', async ({ page }) => {
    await loginAsMom(page)
    await invokeAskLila(page, threadEditId, `${PREFIX} suggest a chore for a 7 year old`)

    const draftText = (await page.getByTestId('lila-draft-content').innerText()).trim()
    await page.getByTestId('lila-draft-edit').click()
    await expect(page.getByTestId('lila-draft-preview')).not.toBeVisible()

    const input = page.getByPlaceholder('Type a message...')
    // The prefill lands in a follow-up React commit — wait for it, don't race it
    await expect(input).not.toHaveValue('', { timeout: 10_000 })
    const composerValue = await input.inputValue()
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
    expect(normalize(composerValue)).toBe(normalize(draftText))

    await page.getByRole('button', { name: 'Send message' }).click()

    const rows = await pollUntil(
      () => threadMessages(threadEditId),
      msgs => msgs.filter(m => m.message_type === 'user').length >= 2,
    )
    // The edited text posted as MOM (user row #2); zero lila rows ever existed.
    expect(rows.filter(m => m.message_type === 'lila')).toHaveLength(0)
    const userRows = rows.filter(m => m.message_type === 'user')
    expect(userRows).toHaveLength(2)
    expect(normalize(userRows[1].content)).toBe(normalize(composerValue))
    expect(userRows[1].sender_member_id).toBe(momId)
  })

  // ── 4. Forged draft signature is rejected ──

  test('Ask LiLa: send_draft with a forged signature is rejected and persists nothing', async () => {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: auth } = await client.auth.signInWithPassword({
      email: TEST_USERS.sarah.email,
      password: TEST_USERS.sarah.password,
    })
    expect(auth.session).toBeTruthy()

    const before = await threadMessages(threadDiscardId)

    const res = await fetch(`${supabaseUrl}/functions/v1/lila-message-respond`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.session!.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        thread_id: threadDiscardId,
        action: 'send_draft',
        draft_id: crypto.randomUUID(),
        draft_content: 'FORGED — this must never post under LiLa\'s name',
        draft_signature: 'deadbeef'.repeat(8),
      }),
    })
    expect(res.status).toBe(403)

    const after = await threadMessages(threadDiscardId)
    expect(after).toHaveLength(before.length)
    expect(after.filter(m => m.message_type === 'lila')).toHaveLength(0)
  })

  // ── 5. Board of Directors: LIVE advisor reply carries HITM; Reject deletes ──
  // Real board turn (1 Sonnet advisor call): Vault launch → seat the seeded
  // persona → send → advisor streams → HITM row renders → Reject → row gone.

  test('BoD: advisor reply carries HITM controls and Reject deletes the lila_messages row', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/vault')
    await expect(page.getByRole('heading', { name: 'AI Vault' })).toBeVisible({ timeout: 15_000 })
    await page.waitForTimeout(1500)

    // Launch via the Vault card (row-180 proven path)
    const vaultSearch = page.getByPlaceholder(/search/i).first()
    await vaultSearch.fill('Board of Directors')
    await page.waitForTimeout(1000)
    const cardHeading = page.getByRole('heading', { name: 'Board of Directors', level: 3, exact: true }).first()
    await expect(cardHeading).toBeVisible({ timeout: 10_000 })
    const cardRoot = cardHeading.locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]')
    await cardRoot.dispatchEvent('click')
    const launch = page.getByRole('button', { name: /Launch Tool/i })
    await expect(launch).toBeVisible({ timeout: 5_000 })
    await launch.click()

    const modal = page.getByTestId('board-of-directors-modal')
    await expect(modal).toBeVisible({ timeout: 10_000 })

    // Seat the seeded HITMCLO advisor
    await modal.getByRole('button', { name: /Add/ }).first().click()
    const personaSearch = page.getByPlaceholder('Search for a person, character, or archetype...')
    await expect(personaSearch).toBeVisible({ timeout: 5_000 })
    await personaSearch.fill(PREFIX)
    const seatBtn = page.getByRole('button', { name: 'Seat', exact: true }).first()
    await expect(seatBtn).toBeVisible({ timeout: 10_000 })
    await seatBtn.click()
    // seatPersona() closes the selector overlay itself

    // Send one message — the seeded advisor responds (live Sonnet call)
    const boardInput = modal.getByPlaceholder('Type a message...')
    await expect(boardInput).toBeVisible({ timeout: 10_000 })
    await boardInput.fill(`${PREFIX} in one sentence: should we start a garden?`)
    await boardInput.press('Enter')

    // The advisor reply persists, messages refetch, and the HITM row renders
    const hitm = page.locator('[data-testid^="bod-hitm-"]').first()
    await expect(hitm).toBeVisible({ timeout: 120_000 })
    await expect(hitm.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(hitm.getByRole('button', { name: 'Approve' })).toBeVisible()
    await expect(hitm.getByRole('button', { name: 'Regenerate' })).toBeVisible()

    // Resolve the advisor message row the UI is showing
    const advisorMsgId = (await hitm.getAttribute('data-testid'))!.replace('bod-hitm-', '')
    const { data: rowBefore } = await admin
      .from('lila_messages')
      .select('id, role, metadata')
      .eq('id', advisorMsgId)
      .single()
    expect(rowBefore).toBeTruthy()
    expect(rowBefore!.role).toBe('assistant')
    expect((rowBefore!.metadata as Record<string, unknown>).persona_id).toBe(bodPersonaId)

    await hitm.getByRole('button', { name: 'Reject' }).click()

    const gone = await pollUntil(
      async () => {
        const { data } = await admin
          .from('lila_messages')
          .select('id')
          .eq('id', advisorMsgId)
          .maybeSingle()
        return data
      },
      row => row === null,
    )
    expect(gone).toBeNull()
    await expect(page.getByTestId(`bod-hitm-${advisorMsgId}`)).not.toBeVisible()
  })

  // ── 6. BookShelf discussion: HITM row present; Reject deletes the row ──

  test('BookShelf: discussion reply carries HITM controls and Reject deletes the message row', async ({ page }) => {
    await loginAsMom(page)
    await page.goto('/bookshelf')
    await page.waitForLoadState('networkidle')
    // Let React finish binding handlers before the single toggle click —
    // a blind retry loop would TOGGLE the panel open/closed and race itself.
    await page.waitForTimeout(2_000)
    const historyBtn = page.getByRole('button', { name: /History/ })
    await expect(historyBtn).toBeVisible({ timeout: 20_000 })
    await historyBtn.click()
    await expect(page.getByText('BookShelf History')).toBeVisible({ timeout: 10_000 })

    const discRow = page.getByText(`${PREFIX} Book Chat`).first()
    await expect(discRow).toBeVisible({ timeout: 15_000 })
    await discRow.click()

    const hitm = page.getByTestId(`bookshelf-hitm-${bookAssistantMsgId}`)
    await expect(hitm).toBeVisible({ timeout: 15_000 })
    await expect(hitm.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(hitm.getByRole('button', { name: 'Regenerate' })).toBeVisible()

    await hitm.getByRole('button', { name: 'Reject' }).click()

    const gone = await pollUntil(
      async () => {
        const { data } = await admin
          .from('bookshelf_discussion_messages')
          .select('id')
          .eq('id', bookAssistantMsgId)
          .maybeSingle()
        return data
      },
      row => row === null,
    )
    expect(gone).toBeNull()
    await expect(page.getByTestId(`bookshelf-hitm-${bookAssistantMsgId}`)).not.toBeVisible()
  })
})
