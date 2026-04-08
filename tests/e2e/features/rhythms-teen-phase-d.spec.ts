/**
 * PRD-18 Phase D + Build N.2 — Independent Teen Evening Rhythm
 *
 * E2E coverage of the teen evening rhythm "Ask someone" flow:
 *
 *   1. Login as an Independent teen (Alex, Testworths family).
 *   2. Visit /dashboard. RhythmDashboardCard derives audience='teen'
 *      from Alex's dashboard_mode='independent' and the evening rhythm
 *      card auto-opens since the current time is in the 18:00–24:00
 *      evening window.
 *   3. Inside the evening rhythm modal, expand MindSweep-Lite.
 *   4. Type 3 brain dump items, tap [Sort it], wait for Haiku parse.
 *   5. For EACH parsed item, manually open the disposition dropdown
 *      and pick "Ask someone", then change the recipient picker to
 *      a different family member (Test Mom → Test Dad → Casey).
 *      This is the founder-critical Build N.2 path: classifier never
 *      auto-suggests family_request; only deliberate user override.
 *   6. Tap Close My Day.
 *   7. Verify via admin client:
 *      - 3 new family_requests rows with sender = Alex, source =
 *        'mindsweep_auto', status = 'pending', recipients = the 3
 *        different family members
 *      - ZERO new journal_entries with tags ['talk_to_someone'] for
 *        Alex from this rhythm session (founder-critical privacy
 *        rule: family_request items must NOT route through the
 *        talk_to_someone case)
 *      - rhythm_completions row for evening exists with status
 *        'completed' and metadata.mindsweep_items contains 3 items
 *        with disposition='family_request' and the right recipients
 *   8. Cleanup: delete the 3 test family_requests + the rhythm
 *      completion row so the test is rerunnable.
 *
 * Time-window dependency: this test only works during local evening
 * hours (18:00–23:59). If you're running it in the morning, the
 * evening rhythm card will not auto-render and the test will skip.
 *
 * Stability strategy: text-based selectors throughout. The teen
 * section uses no data-testid attributes; we rely on stable copy
 * ("Anything looping?", "Sort it", "Ask someone", "Send to:",
 * "Close My Day"). If any of these strings change in future builds,
 * update this file alongside the component.
 */
import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loginAsAlex } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ──────────────────────────────────────────────────────

interface TestworthsFamily {
  familyId: string
  alex: { id: string; display_name: string }
  testMom: { id: string; display_name: string }
  testDad: { id: string; display_name: string }
  casey: { id: string; display_name: string }
}

/** Resolve Testworths family + the 4 members we need for the test. */
async function getTestworthsFamily(): Promise<TestworthsFamily> {
  const { data: family, error: famErr } = await adminClient
    .from('families')
    .select('id')
    .eq('family_login_name', 'testworths')
    .single()
  if (famErr || !family) {
    throw new Error(`Testworths family not found: ${famErr?.message ?? 'no row'}`)
  }

  const { data: members, error: memErr } = await adminClient
    .from('family_members')
    .select('id, display_name, role, dashboard_mode')
    .eq('family_id', family.id)
    .eq('is_active', true)
  if (memErr || !members) {
    throw new Error(`Testworths members fetch failed: ${memErr?.message}`)
  }

  const byName = (name: string) => {
    const m = members.find(x => x.display_name === name)
    if (!m) throw new Error(`Testworths member "${name}" not found`)
    return m
  }

  return {
    familyId: family.id,
    alex: byName('Alex'),
    testMom: byName('Test Mom'),
    testDad: byName('Test Dad'),
    casey: byName('Casey'),
  }
}

/** Today's evening rhythm period string in YYYY-MM-DD local format. */
function todaysEveningPeriod(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Is the local clock currently inside the evening rhythm window? */
function isLocalEveningWindow(): boolean {
  const hour = new Date().getHours()
  return hour >= 18 && hour < 24
}

/**
 * Cleanup: delete any family_requests that match the test phrases
 * + the rhythm_completion for today + any journal_entries the test
 * may have created. Idempotent — safe to run before AND after.
 */
async function cleanupTestArtifacts(family: TestworthsFamily) {
  const period = todaysEveningPeriod()

  // Delete test family_requests
  await adminClient
    .from('family_requests')
    .delete()
    .eq('sender_member_id', family.alex.id)
    .like('title', '%PHASE_D_E2E%')

  // Delete the evening rhythm completion for today (so the test
  // doesn't pick up a stale completion and skip the modal)
  await adminClient
    .from('rhythm_completions')
    .delete()
    .eq('member_id', family.alex.id)
    .eq('rhythm_key', 'evening')
    .eq('period', period)

  // Delete any test-tagged journal entries Alex may have written
  await adminClient
    .from('journal_entries')
    .delete()
    .eq('member_id', family.alex.id)
    .contains('tags', ['rhythm_mindsweep_lite'])
    .like('content', '%PHASE_D_E2E%')
}

/**
 * Tap the disposition tag on a brain-dump item, pick "Ask someone"
 * from the dropdown, then pick the named recipient from the
 * "Send to:" select. Scoped to a single item via the input value
 * lookup so we don't cross-tap the wrong row.
 *
 * Stability note: after item N is tagged "Ask someone", item N's
 * disposition button label ALSO becomes "Ask someone" — so any
 * unscoped `getByRole('button', { name: 'Ask someone' })` would
 * match the wrong element. We must scope every option click to
 * the current row, AND we exclude the row's own disposition tag
 * (which is the [active] one) so we hit the dropdown option only.
 *
 * @param page Playwright page
 * @param itemText The text we typed into the brain-dump for this item
 * @param recipientName The display_name of the family member to pick
 */
async function setItemToAskSomeone(
  page: Page,
  itemText: string,
  recipientName: string,
) {
  // Locate the <li> by finding the input that holds this item's text.
  const itemInput = page.locator(`input[type="text"][value*="${itemText}"]`).first()
  await expect(itemInput).toBeVisible({ timeout: 10000 })
  const itemRow = itemInput.locator(
    'xpath=ancestor::li[contains(@class, "rounded-lg")]',
  )

  // Tap the disposition tag inside this row to open the dropdown.
  // Before any user interaction, the tag reads either "Schedule" or
  // "Journal about it" (Haiku's classification). Since we're scoped
  // to this row, the only button with that text is the row's tag.
  const dispositionButton = itemRow.locator('button').filter({
    hasText: /^(Schedule|Journal about it|Talk to someone|Let it go|Ask someone)$/,
  }).first()
  await dispositionButton.click()

  // Pick "Ask someone" from the dropdown — scoped to THIS row so we
  // don't accidentally re-click a previously-set row's disposition
  // tag. Also wait briefly for the dropdown to render before clicking.
  const askSomeoneOption = itemRow.locator('button').filter({
    hasText: /^Ask someone$/,
  })
  // After scoping to row, we expect TWO matches once the dropdown
  // is open: (a) the row's disposition tag (if it's already been set
  // to Ask someone — won't be on first pass) and (b) the dropdown
  // option. We always want the LAST one (the dropdown option, which
  // is rendered after the tag in the DOM).
  await expect(askSomeoneOption.last()).toBeVisible({ timeout: 5000 })
  await askSomeoneOption.last().click()

  // The recipient picker now renders below the row with label "Send to:"
  // and a <select> dropdown. Pick the requested recipient.
  const sendToLabel = itemRow.getByText('Send to:')
  await expect(sendToLabel).toBeVisible({ timeout: 5000 })

  const recipientSelect = itemRow.locator('select').first()
  await recipientSelect.selectOption({ label: recipientName })
}

// ── Test ────────────────────────────────────────────────────────

test.describe('PRD-18 Phase D — Independent Teen Evening Rhythm', () => {
  test.beforeEach(async () => {
    if (!isLocalEveningWindow()) {
      const hour = new Date().getHours()
      console.warn(
        `Skipping teen evening test — local hour is ${hour}, ` +
          `evening rhythm window is 18–24. Run this test in the evening.`,
      )
      test.skip()
    }
  })

  test('Alex (15) closes evening day with 3 Ask Someone requests to Mom, Dad, Casey', async ({
    page,
  }) => {
    const family = await getTestworthsFamily()

    // Pre-clean any leftover artifacts from a previous run
    await cleanupTestArtifacts(family)

    // Snapshot pre-state for delta verification
    const { data: requestsBefore } = await adminClient
      .from('family_requests')
      .select('id')
      .eq('sender_member_id', family.alex.id)
    const requestCountBefore = requestsBefore?.length ?? 0

    const { data: journalsBefore } = await adminClient
      .from('journal_entries')
      .select('id')
      .eq('member_id', family.alex.id)
      .contains('tags', ['talk_to_someone'])
    const talkToSomeoneJournalCountBefore = journalsBefore?.length ?? 0

    // ── Step 1: Login as Alex and visit dashboard ─────────────
    await loginAsAlex(page)
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Dismiss the FeatureGuide if it's blocking the layout (it's
    // inline content, not a true modal, but it pushes the rhythm
    // card down and can be visually distracting in screenshots).
    const dismissGuide = page.getByRole('button', { name: 'Got it' })
    if (await dismissGuide.isVisible().catch(() => false)) {
      await dismissGuide.click()
    }

    // ── Step 2: Click the Evening Check-in card to open modal ─
    // We rely on the explicit click rather than auto-open. Auto-
    // open is a UX nicety that depends on a useEffect race + a
    // sessionStorage flag — explicit click is the deterministic
    // path and matches what a real teen does after dismissing or
    // returning to the dashboard.
    const eveningCard = page.getByRole('button', { name: /Evening Check-in/i })
    await expect(eveningCard).toBeVisible({ timeout: 15000 })
    await eveningCard.click()

    // The modal heading is the Evening Greeting section's <h2>.
    // For Alex (teen variant), it reads "Hey Alex, how'd today go?"
    // The seed sets config.variant='teen' which the renderer
    // forwards to EveningGreetingSection.
    const eveningModal = page.getByRole('heading', {
      name: /How was your day|Hey.*how'd today go/i,
    })
    await expect(eveningModal).toBeVisible({ timeout: 15000 })

    // ── Step 3: Expand MindSweep-Lite "Anything looping?" ─────
    const mindSweepHeader = page.getByText('Anything looping?').first()
    await expect(mindSweepHeader).toBeVisible({ timeout: 10000 })
    await mindSweepHeader.click()

    // ── Step 4: Type 3 brain dump items + Sort it ─────────────
    // Each line uses the PHASE_D_E2E sentinel so cleanup can find
    // and delete only this test's artifacts. Haiku will classify
    // each into one of its destination types — we don't care which
    // because we'll override all 3 to family_request manually.
    const brainDump = [
      'PHASE_D_E2E: Need help with the field trip permission slip by Wednesday.',
      'PHASE_D_E2E: Want to borrow the lawnmower for my project.',
      'PHASE_D_E2E: Hoping to get my sweater back before the weekend.',
    ].join('\n')

    const textarea = page.locator('textarea').filter({
      hasText: '',
    }).first()
    // Use the more specific placeholder selector to avoid grabbing
    // the rhythm modal's other inputs (Tomorrow Capture etc.).
    const mindsweepTextarea = page.getByPlaceholder(
      /I said something weird in English class/i,
    )
    await expect(mindsweepTextarea).toBeVisible({ timeout: 5000 })
    await mindsweepTextarea.fill(brainDump)

    const sortButton = page.getByRole('button', { name: /^Sort it$/ })
    await sortButton.click()

    // Wait for Haiku to parse — the items render as <li> rows
    // inside the section. We expect 3 to appear.
    await expect(
      page.locator('input[value*="PHASE_D_E2E"]'),
    ).toHaveCount(3, { timeout: 30000 })

    // ── Step 5: Override each item to "Ask someone" with diff recipients ─
    // Item 1 → Test Mom
    await setItemToAskSomeone(page, 'permission slip', 'Test Mom')
    // Item 2 → Test Dad
    await setItemToAskSomeone(page, 'lawnmower', 'Test Dad')
    // Item 3 → Casey
    await setItemToAskSomeone(page, 'sweater', 'Casey')

    // Sanity: footer copy should now say something about Ask someone
    // going out, since at least one item is tagged family_request.
    await expect(
      page.getByText(/Ask someone.*goes out as a real request/i),
    ).toBeVisible({ timeout: 5000 })

    // Sanity: each row should now show "Send to:" with the right name
    await expect(page.getByText('Send to:').first()).toBeVisible()

    // ── Step 6: Close My Day ──────────────────────────────────
    const closeButton = page.getByRole('button', { name: /Close My Day/i })
    await expect(closeButton).toBeVisible()
    await closeButton.click()

    // Wait for the modal to dismiss — completion + commit must finish
    await expect(eveningModal).toBeHidden({ timeout: 15000 })

    // ── Step 7a: Verify 3 family_requests rows written ────────
    const { data: newRequests, error: reqErr } = await adminClient
      .from('family_requests')
      .select(
        'id, sender_member_id, recipient_member_id, title, status, source, created_at',
      )
      .eq('sender_member_id', family.alex.id)
      .eq('source', 'mindsweep_auto')
      .like('title', '%PHASE_D_E2E%')
      .order('created_at', { ascending: true })
    expect(reqErr).toBeNull()
    expect(newRequests).toHaveLength(3)

    // Step 7b: Recipients match (order doesn't matter — order by recipient)
    const recipientIds = new Set((newRequests ?? []).map(r => r.recipient_member_id))
    expect(recipientIds.has(family.testMom.id)).toBe(true)
    expect(recipientIds.has(family.testDad.id)).toBe(true)
    expect(recipientIds.has(family.casey.id)).toBe(true)

    // Step 7c: All 3 requests are pending status
    for (const req of newRequests ?? []) {
      expect(req.status).toBe('pending')
      expect(req.source).toBe('mindsweep_auto')
      expect(req.sender_member_id).toBe(family.alex.id)
    }

    // Step 7d: Net new family_requests = 3 (not 0, not 6 from a glitch)
    const { data: requestsAfter } = await adminClient
      .from('family_requests')
      .select('id')
      .eq('sender_member_id', family.alex.id)
    const requestCountAfter = requestsAfter?.length ?? 0
    expect(requestCountAfter - requestCountBefore).toBe(3)

    // Step 7e: FOUNDER-CRITICAL — zero new talk_to_someone journals.
    // The 3 items routed via family_request, NOT through the
    // talk_to_someone privacy path. If this assertion fails it means
    // the dispositions cross-contaminated and the founder-critical
    // privacy rule is broken.
    const { data: journalsAfter } = await adminClient
      .from('journal_entries')
      .select('id')
      .eq('member_id', family.alex.id)
      .contains('tags', ['talk_to_someone'])
    const talkToSomeoneJournalCountAfter = journalsAfter?.length ?? 0
    expect(
      talkToSomeoneJournalCountAfter - talkToSomeoneJournalCountBefore,
    ).toBe(0)

    // Step 7f: rhythm_completions row exists for today's evening
    const period = todaysEveningPeriod()
    const { data: completion, error: compErr } = await adminClient
      .from('rhythm_completions')
      .select('id, status, metadata, completed_at')
      .eq('member_id', family.alex.id)
      .eq('rhythm_key', 'evening')
      .eq('period', period)
      .single()
    expect(compErr).toBeNull()
    expect(completion).toBeTruthy()
    expect(completion!.status).toBe('completed')
    expect(completion!.completed_at).toBeTruthy()

    // Step 7g: metadata.mindsweep_items contains 3 family_request items
    const meta = completion!.metadata as {
      mindsweep_items?: Array<{
        text: string
        disposition: string
        created_record_type?: string | null
        destination_detail?: { recipient_member_id?: string; recipient_name?: string }
      }>
    }
    const familyRequestMetaItems = (meta?.mindsweep_items ?? []).filter(
      i => i.disposition === 'family_request',
    )
    expect(familyRequestMetaItems).toHaveLength(3)

    // Each metadata item should have a recipient recorded
    for (const item of familyRequestMetaItems) {
      expect(item.created_record_type).toBe('family_request')
      expect(item.destination_detail?.recipient_member_id).toBeTruthy()
    }

    // ── Step 8: Cleanup ───────────────────────────────────────
    await cleanupTestArtifacts(family)
  })
})
