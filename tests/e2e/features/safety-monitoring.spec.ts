/**
 * PRD-30 Safety Monitoring — SM-A detection foundation verification.
 *
 * Two test classes (SAFETY-BETA-GATE / ethics-enforcement pattern):
 *   1. DB/RLS probes — run against the live linked Supabase project via
 *      direct PostgREST queries (no browser page). Require only the
 *      migration (00000000100289) to be applied — NOT the safety-classify
 *      Edge Function to be deployed. These are the permanent guardrails.
 *   2. LIVE pipeline pins (test.describe.serial, tagged LIVE) — invoke the
 *      deployed safety-classify Edge Function directly and assert the
 *      resulting DB rows. These require the founder-approved deploy pass
 *      and will fail with a clear message against an undeployed function.
 *
 * Fixture hygiene: every row this spec creates is tracked by id and
 * deleted via service role in afterAll/afterEach (safety_flags has no
 * DELETE RLS policy for authenticated users, so cleanup must go through
 * the service-role client — mirrors lila_ethics_rejections/ai_output_scans
 * cleanup in ethics-enforcement.spec.ts).
 */
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { loginAsMom, loginAsDad, loginAsAlex, loginAsCasey, loginAsJordan } from '../helpers/auth'
import { waitForAppReady } from '../helpers/assertions'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const FN = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`

const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function signInClient(email: string, password: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: true },
  })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`)
  return client
}

let familyId = ''
const memberIds: Record<string, string> = {}

async function resolveFamilyId(): Promise<string> {
  if (familyId) return familyId
  const { data, error } = await sr
    .from('families')
    .select('id')
    .eq('family_login_name_lower', 'testworthfamily')
    .single()
  if (error || !data) throw new Error(`Testworth family not found: ${error?.message}`)
  familyId = data.id
  return familyId
}

async function resolveMemberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const fid = await resolveFamilyId()
  const { data, error } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', fid)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

// Fixture rows this spec creates, tracked for cleanup.
const createdFlagIds: string[] = []
const createdConversationIds: string[] = []
const createdNotificationIds: string[] = []
const createdRecipientIds: string[] = []
const createdSummaryIds: string[] = []

test.afterAll(async () => {
  // Notification cleanup is a SWEEP by source_reference_id, not just the
  // explicitly-tracked createdNotificationIds — sendConsolidatedNotification
  // fans out to EVERY active recipient (Sarah always, plus Mark once the
  // RLS dad-grant test runs earlier in the same spec run), so a single flag
  // event can produce more than one notifications row. Tracking only "the
  // most recent" id per test under-counts whenever 2+ recipients exist.
  if (createdFlagIds.length) {
    await sr.from('notifications').delete().in('source_reference_id', createdFlagIds)
  }
  if (createdSummaryIds.length) {
    await sr.from('notifications').delete().in('source_reference_id', createdSummaryIds)
    await sr.from('safety_pattern_summaries').delete().in('id', createdSummaryIds)
  }
  // safety-weekly-digest sweeps EVERY currently-monitored member
  // PLATFORM-WIDE on every invocation (that's the real, correct behavior —
  // the cron isn't scoped to one family). Testing one Testworth member's
  // digest therefore also generates summary rows for every OTHER monitored
  // Testworth member as a side effect, none of which are in
  // createdSummaryIds. Testworth should never carry a real production
  // summary or a real safety notification, so sweep the WHOLE family by
  // category — cross-referencing "notifications whose source_reference_id
  // still exists in safety_pattern_summaries" is fragile (a notification
  // can outlive its summary if an earlier pass deletes the summary but not
  // the notification, e.g. a prior manual/partial cleanup — a family+
  // category sweep can't leave that kind of orphan).
  const fidForSweep = await resolveFamilyId().catch(() => null)
  if (fidForSweep) {
    await sr.from('safety_pattern_summaries').delete().eq('family_id', fidForSweep)
    const { data: familyMemberIds } = await sr.from('family_members').select('id').eq('family_id', fidForSweep)
    const memberIds = (familyMemberIds ?? []).map(m => m.id)
    if (memberIds.length) {
      await sr.from('notifications').delete().eq('category', 'safety').in('recipient_member_id', memberIds)
    }
  }
  if (createdNotificationIds.length) await sr.from('notifications').delete().in('id', createdNotificationIds)
  if (createdFlagIds.length) await sr.from('safety_flags').delete().in('id', createdFlagIds)
  if (createdRecipientIds.length) await sr.from('safety_notification_recipients').delete().in('id', createdRecipientIds)
  if (createdConversationIds.length) {
    await sr.from('lila_messages').delete().in('conversation_id', createdConversationIds)
    await sr.from('lila_conversations').delete().in('id', createdConversationIds)
  }
})

// ============================================================
// Class 1 — DB / RLS probes (no deploy required)
// ============================================================

test.describe('PRD-30 SM-A — backfill correctness', () => {
  test('every existing role=member child has an ACTIVE safety_monitoring_configs row', async () => {
    const fid = await resolveFamilyId()
    for (const name of ['Alex', 'Casey', 'Jordan', 'Ruthie']) {
      const memberId = await resolveMemberId(name)
      const { data } = await sr
        .from('safety_monitoring_configs')
        .select('is_active')
        .eq('family_id', fid)
        .eq('monitored_member_id', memberId)
        .single()
      expect(data?.is_active, `${name} should be monitored by default`).toBe(true)
    }
  })

  test('additional_adult (Mark) has an INACTIVE safety_monitoring_configs row (opt-in)', async () => {
    const fid = await resolveFamilyId()
    const markId = await resolveMemberId('Mark')
    const { data } = await sr
      .from('safety_monitoring_configs')
      .select('is_active')
      .eq('family_id', fid)
      .eq('monitored_member_id', markId)
      .single()
    expect(data?.is_active, 'Mark should be opt-in, not active by default').toBe(false)
  })

  test('primary_parent (Sarah) has NO safety_monitoring_configs row — mom cannot be monitored', async () => {
    const fid = await resolveFamilyId()
    const sarahId = await resolveMemberId('Sarah')
    const { data, error } = await sr
      .from('safety_monitoring_configs')
      .select('id')
      .eq('family_id', fid)
      .eq('monitored_member_id', sarahId)
      .maybeSingle()
    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  test('primary_parent (Sarah) has an ACTIVE safety_notification_recipients row', async () => {
    const fid = await resolveFamilyId()
    const sarahId = await resolveMemberId('Sarah')
    const { data } = await sr
      .from('safety_notification_recipients')
      .select('is_active, notification_channels')
      .eq('family_id', fid)
      .eq('recipient_member_id', sarahId)
      .single()
    expect(data?.is_active).toBe(true)
    expect(data?.notification_channels).toContain('in_app')
  })

  test('special_adult members (Amy, Kylie) have no config and no recipient row', async () => {
    const fid = await resolveFamilyId()
    for (const name of ['Amy', 'Kylie']) {
      const memberId = await resolveMemberId(name)
      const { data: cfg } = await sr
        .from('safety_monitoring_configs')
        .select('id')
        .eq('family_id', fid)
        .eq('monitored_member_id', memberId)
        .maybeSingle()
      expect(cfg, `${name} should have no monitoring config`).toBeNull()
      const { data: rec } = await sr
        .from('safety_notification_recipients')
        .select('id')
        .eq('family_id', fid)
        .eq('recipient_member_id', memberId)
        .maybeSingle()
      expect(rec, `${name} should have no recipient row`).toBeNull()
    }
  })
})

test.describe('PRD-30 SM-A — RLS leak probes', () => {
  test('a monitored kid session (Casey) reads ZERO rows from every safety table EXCEPT her own monitoring on/off state', async () => {
    const fid = await resolveFamilyId()
    const caseyId = await resolveMemberId('Casey')
    const client = await signInClient(TEST_USERS.casey.email, TEST_USERS.casey.password)

    // safety_flags is column-guarded (content_snippet/matched_keywords/
    // classification_reasoning REVOKEd from authenticated) — a real client
    // must always select an explicit, non-content column list against this
    // table (select('*') hard-errors with 42501 regardless of RLS, since
    // column-level privilege checks happen before row-level policies).
    // This is itself part of the proof: it's structurally impossible for
    // any authenticated session, including Casey's, to read the guarded
    // columns via select('*').
    const { data: flagData, error: flagError } = await client
      .from('safety_flags')
      .select('id, category, severity, status')
      .eq('family_id', fid)
    expect(flagError, 'safety_flags (non-content columns) should not error, just return empty under RLS').toBeNull()
    expect(flagData, 'Casey (flagged member) must read ZERO rows from safety_flags').toEqual([])

    const otherTables = [
      'safety_sensitivity_configs',
      'safety_notification_recipients',
      'safety_pattern_summaries',
    ]
    for (const table of otherTables) {
      const { data, error } = await client.from(table).select('*').eq('family_id', fid)
      expect(error, `${table} should not error, just return empty under RLS`).toBeNull()
      expect(data, `Casey (flagged member) must read ZERO rows from ${table}`).toEqual([])
    }

    // safety_monitoring_configs is a DELIBERATE, NARROW exception as of SM-B
    // (migration 00000000100299): a monitored member may read their OWN
    // is_active state — this IS the disclosure (J5/D4), never a leak. Casey
    // reads exactly her own row and nothing else, and NEVER another member's.
    const { data: ownConfig, error: ownError } = await client
      .from('safety_monitoring_configs')
      .select('monitored_member_id, is_active')
      .eq('family_id', fid)
    expect(ownError, 'safety_monitoring_configs self-read should not error').toBeNull()
    expect(ownConfig?.length, "Casey must see exactly her own row, never siblings'").toBe(1)
    expect(ownConfig?.[0]?.monitored_member_id).toBe(caseyId)
  })

  test('safety_keywords is completely unreadable — even by mom', async () => {
    const client = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
    const { data, error } = await client.from('safety_keywords').select('*').limit(1)
    // Column/table-level REVOKE means PostgREST returns an empty array or a
    // permission error depending on RLS/grant interaction — either is an
    // acceptable "cannot read" outcome; the only unacceptable outcome is
    // actually receiving keyword rows.
    expect(data === null || data.length === 0, 'safety_keywords must never be readable via the client SDK').toBe(true)
    void error
  })

  test('safety_resources IS readable by an authenticated family member (not sensitive)', async () => {
    const client = await signInClient(TEST_USERS.casey.email, TEST_USERS.casey.password)
    const { data, error } = await client.from('safety_resources').select('resource_name, category').limit(5)
    expect(error).toBeNull()
    expect(data && data.length).toBeGreaterThan(0)
  })

  test('a seeded flag: ungranted dad (Mark) cannot read it; granted dad CAN read it (non-content columns only)', async () => {
    const fid = await resolveFamilyId()
    const caseyId = await resolveMemberId('Casey')

    const { data: convo } = await sr
      .from('lila_conversations')
      .insert({ family_id: fid, member_id: caseyId, container_type: 'drawer', status: 'active' })
      .select('id')
      .single()
    createdConversationIds.push(convo!.id)

    const { data: flag } = await sr
      .from('safety_flags')
      .insert({
        family_id: fid,
        flagged_member_id: caseyId,
        conversation_table: 'lila_conversations',
        conversation_id: convo!.id,
        surface: 'lila-chat',
        category: 'substance',
        severity: 'warning',
        detection_layer: 'keyword',
        context_snippet: [{ role: 'user', content: 'SAFETYMON test snippet — should never leak', message_id: 'fake' }],
        matched_keywords: ['getting high'],
        classification_reasoning: 'SAFETYMON test reasoning — should never leak',
      })
      .select('id')
      .single()
    createdFlagIds.push(flag!.id)

    // Mark (dad) has no active recipient row yet — must read zero rows.
    const markId = await resolveMemberId('Mark')
    const markClientBefore = await signInClient(TEST_USERS.mark.email, TEST_USERS.mark.password)
    const { data: beforeGrant } = await markClientBefore.from('safety_flags').select('id').eq('id', flag!.id)
    expect(beforeGrant, 'ungranted dad must not see the flag').toEqual([])

    // Grant Mark as an active recipient.
    const { data: recipient } = await sr
      .from('safety_notification_recipients')
      .insert({ family_id: fid, recipient_member_id: markId, is_active: true, notification_channels: ['in_app'] })
      .select('id')
      .single()
    createdRecipientIds.push(recipient!.id)

    const markClientAfter = await signInClient(TEST_USERS.mark.email, TEST_USERS.mark.password)
    const { data: afterGrant, error: afterError } = await markClientAfter
      .from('safety_flags')
      .select('id, category, severity, status')
      .eq('id', flag!.id)
      .single()
    expect(afterError, 'granted dad should be able to read the non-content columns').toBeNull()
    expect(afterGrant?.id).toBe(flag!.id)
    expect(afterGrant?.category).toBe('substance')

    // Column guard: even a fully-authorized reader (granted dad) hard-errors
    // requesting the content-bearing columns — the REVOKE is column-level,
    // not row-level, so authorization to READ THE ROW never implies
    // authorization to read content_snippet/matched_keywords/
    // classification_reasoning (mirrors migration 100286's guard exactly).
    const { data: markContentAttempt, error: markContentError } = await markClientAfter
      .from('safety_flags')
      .select('context_snippet, matched_keywords, classification_reasoning')
      .eq('id', flag!.id)
      .maybeSingle()
    expect(markContentAttempt, 'granted dad must never receive content-bearing columns').toBeNull()
    expect(markContentError?.code, 'requesting guarded columns must hard-error (42501), not silently return them').toBe('42501')

    // And mom herself — same column guard applies to EVERY authenticated
    // session, not just non-primary-parent readers.
    const momClient = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
    const { data: momContentAttempt, error: momContentError } = await momClient
      .from('safety_flags')
      .select('context_snippet, matched_keywords, classification_reasoning')
      .eq('id', flag!.id)
      .maybeSingle()
    expect(momContentAttempt, "mom must never receive content-bearing columns either — no side door around the frozen kid-privacy carve-out").toBeNull()
    expect(momContentError?.code).toBe('42501')
  })

  test('no DELETE policy exists on safety_flags — mom cannot delete a flag', async () => {
    const fid = await resolveFamilyId()
    const caseyId = await resolveMemberId('Casey')
    const { data: flag } = await sr
      .from('safety_flags')
      .insert({
        family_id: fid,
        flagged_member_id: caseyId,
        surface: 'lila-chat',
        category: 'other',
        severity: 'concern',
        detection_layer: 'keyword',
      })
      .select('id')
      .single()
    createdFlagIds.push(flag!.id)

    const momClient = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
    await momClient.from('safety_flags').delete().eq('id', flag!.id)

    // Row must still exist — RLS silently blocks the delete (no policy).
    const { data: stillThere } = await sr.from('safety_flags').select('id').eq('id', flag!.id).single()
    expect(stillThere?.id).toBe(flag!.id)
  })

  test('mom can update flag status (acknowledge); a kid session cannot', async () => {
    const fid = await resolveFamilyId()
    const jordanId = await resolveMemberId('Jordan')
    const { data: flag } = await sr
      .from('safety_flags')
      .insert({
        family_id: fid,
        flagged_member_id: jordanId,
        surface: 'lila-chat',
        category: 'bullying',
        severity: 'concern',
        detection_layer: 'keyword',
      })
      .select('id')
      .single()
    createdFlagIds.push(flag!.id)

    const momClient = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
    const { error: momError } = await momClient
      .from('safety_flags')
      .update({ status: 'acknowledged', reviewed_at: new Date().toISOString() })
      .eq('id', flag!.id)
    expect(momError).toBeNull()

    const { data: afterMom } = await sr.from('safety_flags').select('status').eq('id', flag!.id).single()
    expect(afterMom?.status).toBe('acknowledged')

    const jordanClient = await signInClient(TEST_USERS.jordan.email, TEST_USERS.jordan.password)
    await jordanClient.from('safety_flags').update({ status: 'dismissed' }).eq('id', flag!.id)
    const { data: afterKidAttempt } = await sr.from('safety_flags').select('status').eq('id', flag!.id).single()
    expect(afterKidAttempt?.status, 'kid update must be silently blocked by RLS').toBe('acknowledged')
  })
})

// ============================================================
// Class 2 — LIVE pipeline pins (require safety-classify deployed)
// ============================================================
//
// Extended timeout (SM-C, 2026-07-08): safety-classify's sweep now makes
// REAL Haiku calls that succeed (conversation-starter generation was
// silently failing fast on an invalid model ID since SM-A — see the model-
// id-guard fix in this same session). A successful sweep across every
// monitored member/conversation platform-wide legitimately takes longer
// than the invalid-model-ID's fast-400-and-give-up path did. 60s replaces
// the 30s default for these three tests only.

test.describe.serial('PRD-30 SM-A — LIVE pipeline (requires safety-classify deployed)', () => {
  test('seeded keyword message -> flag row + notification row after a sweep', async ({ request }) => {
    test.setTimeout(60000)
    const fid = await resolveFamilyId()
    const jordanId = await resolveMemberId('Jordan')

    const { data: convo } = await sr
      .from('lila_conversations')
      .insert({ family_id: fid, member_id: jordanId, container_type: 'drawer', status: 'active' })
      .select('id')
      .single()
    createdConversationIds.push(convo!.id)

    const { data: msg } = await sr
      .from('lila_messages')
      .insert({ conversation_id: convo!.id, role: 'user', content: 'I got in a fight and someone is bullying me at school', metadata: {} })
      .select('id')
      .single()

    const res = await request.post(FN('safety-classify'), {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    })
    expect(res.ok(), `safety-classify must be deployed for this LIVE pin — got ${res.status()}`).toBeTruthy()

    const { data: flags } = await sr
      .from('safety_flags')
      .select('id, category, severity')
      .eq('family_id', fid)
      .eq('flagged_member_id', jordanId)
      .eq('conversation_id', convo!.id)
    expect(flags && flags.length).toBeGreaterThan(0)
    if (flags) createdFlagIds.push(...flags.map(f => f.id))
    expect(flags?.some(f => f.category === 'bullying')).toBe(true)

    const { data: scannedMsg } = await sr.from('lila_messages').select('safety_scanned').eq('id', msg!.id).single()
    expect(scannedMsg?.safety_scanned).toBe(true)

    const { data: notifs } = await sr
      .from('notifications')
      .select('id, priority, category, notification_type')
      .eq('family_id', fid)
      .eq('notification_type', 'safety_flag')
      .order('created_at', { ascending: false })
      .limit(1)
    expect(notifs && notifs.length).toBeGreaterThan(0)
    if (notifs) createdNotificationIds.push(...notifs.map(n => n.id))
    expect(notifs?.[0]?.category).toBe('safety')
  })

  test('sensitivity=Low suppresses a Concern-severity keyword hit', async ({ request }) => {
    test.setTimeout(60000)
    const fid = await resolveFamilyId()
    const caseyId = await resolveMemberId('Casey')

    await sr.from('safety_sensitivity_configs').upsert(
      { family_id: fid, monitored_member_id: caseyId, category: 'substance', sensitivity: 'low' },
      { onConflict: 'family_id,monitored_member_id,category' },
    )

    const { data: convo } = await sr
      .from('lila_conversations')
      .insert({ family_id: fid, member_id: caseyId, container_type: 'drawer', status: 'active' })
      .select('id')
      .single()
    createdConversationIds.push(convo!.id)

    await sr.from('lila_messages').insert({ conversation_id: convo!.id, role: 'user', content: 'we were vaping at the party', metadata: {} })

    const res = await request.post(FN('safety-classify'), {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    })
    expect(res.ok()).toBeTruthy()

    const { data: flags } = await sr
      .from('safety_flags')
      .select('id')
      .eq('family_id', fid)
      .eq('flagged_member_id', caseyId)
      .eq('conversation_id', convo!.id)
      .eq('category', 'substance')
    expect(flags, 'Low sensitivity should suppress a Concern-severity substance hit').toEqual([])

    await sr.from('safety_sensitivity_configs').delete().eq('family_id', fid).eq('monitored_member_id', caseyId).eq('category', 'substance')
  })

  test('Critical notification is priority=high (bypasses DND per D3)', async ({ request }) => {
    test.setTimeout(60000)
    const fid = await resolveFamilyId()
    const ruthieId = await resolveMemberId('Ruthie')

    const { data: convo } = await sr
      .from('lila_conversations')
      .insert({ family_id: fid, member_id: ruthieId, container_type: 'drawer', status: 'active' })
      .select('id')
      .single()
    createdConversationIds.push(convo!.id)

    await sr.from('lila_messages').insert({ conversation_id: convo!.id, role: 'user', content: 'I want to kill myself', metadata: {} })

    const res = await request.post(FN('safety-classify'), {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    })
    expect(res.ok()).toBeTruthy()

    const { data: flags } = await sr
      .from('safety_flags')
      .select('id, category, severity')
      .eq('family_id', fid)
      .eq('flagged_member_id', ruthieId)
      .eq('conversation_id', convo!.id)
    expect(flags?.some(f => f.category === 'self_harm' && f.severity === 'critical')).toBe(true)
    if (flags) createdFlagIds.push(...flags.map(f => f.id))

    const { data: notifs } = await sr
      .from('notifications')
      .select('id, priority')
      .eq('family_id', fid)
      .eq('notification_type', 'safety_flag')
      .order('created_at', { ascending: false })
      .limit(1)
    expect(notifs?.[0]?.priority).toBe('high')
    if (notifs) createdNotificationIds.push(...notifs.map(n => n.id))
  })
})

// ============================================================
// Class 3 — SM-B mom-surface UI pins (real Playwright browser flows,
// DB-asserted per rider (a)). Require the app dev server + safety-classify
// deployed (unchanged from Class 2). Run AFTER Class 1/2 so any residual
// fixture state from those tests doesn't interfere.
// ============================================================

// Extra fixture tracking for SM-B (distinct from SM-A's arrays above so a
// failure here can't silently absorb into SM-A's cleanup accounting).
const smbFlagIds: string[] = []
const smbRecipientIds: string[] = []
const smbSensitivityConfigIds: string[] = []

test.afterAll(async () => {
  if (smbFlagIds.length) await sr.from('notifications').delete().in('source_reference_id', smbFlagIds)
  if (smbFlagIds.length) await sr.from('safety_flags').delete().in('id', smbFlagIds)
  if (smbRecipientIds.length) await sr.from('safety_notification_recipients').delete().in('id', smbRecipientIds)
  if (smbSensitivityConfigIds.length) await sr.from('safety_sensitivity_configs').delete().in('id', smbSensitivityConfigIds)
  // Restore Alex's and Casey's monitoring to the default ON state in case the
  // toggle tests above left either mid-flip (e.g. a test failure between the
  // off-click and the on-click) — never leave the shared fixture family with
  // a real kid silently un-monitored.
  const fid = await resolveFamilyId()
  const alexId = await resolveMemberId('Alex')
  const caseyId = await resolveMemberId('Casey')
  await sr.from('safety_monitoring_configs').update({ is_active: true }).eq('family_id', fid).eq('monitored_member_id', alexId)
  await sr.from('safety_monitoring_configs').update({ is_active: true }).eq('family_id', fid).eq('monitored_member_id', caseyId)
})

test.describe('PRD-30 SM-B — Settings section + sensitivity modal', () => {
  test('mom can toggle a member\'s monitoring on/off (persists)', async ({ page }) => {
    const fid = await resolveFamilyId()
    const caseyId = await resolveMemberId('Casey')

    await loginAsMom(page)
    await page.goto('/settings')
    await waitForAppReady(page)

    const header = page.getByRole('button', { name: /Safety Monitoring/i }).first()
    await header.click()

    const caseyRow = page.getByTestId(`safety-member-row-${caseyId}`)
    await expect(caseyRow).toBeVisible({ timeout: 10000 })
    const toggle = page.getByTestId(`safety-member-toggle-${caseyId}`)

    // Toggle off, assert DB AND the UI's own re-render (aria-pressed reflects
    // the React Query refetch), THEN toggle back on. Without waiting for the
    // UI to actually reflect the new state, a second click can race the
    // invalidation/refetch round trip and read a stale `checked` value,
    // silently re-sending the SAME value instead of flipping back (never
    // leave the shared fixture family with a real kid mid-way un-monitored).
    await toggle.click()
    await expect
      .poll(async () => {
        const { data } = await sr.from('safety_monitoring_configs').select('is_active').eq('family_id', fid).eq('monitored_member_id', caseyId).single()
        return data?.is_active
      }, { timeout: 10000 })
      .toBe(false)
    await expect(toggle).toHaveAttribute('aria-pressed', 'false', { timeout: 10000 })

    await toggle.click()
    await expect
      .poll(async () => {
        const { data } = await sr.from('safety_monitoring_configs').select('is_active').eq('family_id', fid).eq('monitored_member_id', caseyId).single()
        return data?.is_active
      }, { timeout: 10000 })
      .toBe(true)
    await expect(toggle).toHaveAttribute('aria-pressed', 'true', { timeout: 10000 })
  })

  test('locked categories show a Lock pill, not an editable control — even with a tampered override row', async ({ page }) => {
    const fid = await resolveFamilyId()
    const jordanId = await resolveMemberId('Jordan')

    // Simulate an API bypass attempt: directly write a 'low' override for a
    // LOCKED category. The pipeline (safety-classify-match.ts) already
    // ignores this at scan time (vitest-covered); this pin proves the UI
    // ALSO never renders it as editable or "Low" — isLockedCategory always
    // wins over any stored value.
    const { data: tampered } = await sr
      .from('safety_sensitivity_configs')
      .upsert({ family_id: fid, monitored_member_id: jordanId, category: 'self_harm', sensitivity: 'low' }, { onConflict: 'family_id,monitored_member_id,category' })
      .select('id')
      .single()
    if (tampered) smbSensitivityConfigIds.push(tampered.id)

    await loginAsMom(page)
    await page.goto('/settings')
    await waitForAppReady(page)
    await page.getByRole('button', { name: /Safety Monitoring/i }).first().click()
    await page.getByTestId(`safety-sensitivity-gear-${jordanId}`).click()

    await expect(page.getByTestId('safety-sensitivity-locked-self_harm')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('safety-sensitivity-locked-self_harm')).toContainText('High')
    await expect(page.getByTestId('safety-sensitivity-control-self_harm')).toHaveCount(0)
    await expect(page.getByTestId('safety-sensitivity-locked-abuse')).toBeVisible()
    await expect(page.getByTestId('safety-sensitivity-locked-sexual_predatory')).toBeVisible()

    // An adjustable category IS editable and persists.
    await expect(page.getByTestId('safety-sensitivity-control-substance')).toBeVisible()
    await page.getByTestId('safety-sensitivity-control-substance').getByRole('button', { name: 'High' }).click()
    await expect
      .poll(async () => {
        const { data } = await sr.from('safety_sensitivity_configs').select('sensitivity').eq('family_id', fid).eq('monitored_member_id', jordanId).eq('category', 'substance').maybeSingle()
        return data?.sensitivity
      }, { timeout: 10000 })
      .toBe('high')
    const { data: substanceRow } = await sr.from('safety_sensitivity_configs').select('id').eq('family_id', fid).eq('monitored_member_id', jordanId).eq('category', 'substance').single()
    if (substanceRow) smbSensitivityConfigIds.push(substanceRow.id)
  })
})

test.describe('PRD-30 SM-B — flag history + detail (one-way review)', () => {
  test('flag review is one-way: acknowledge, then the actions disappear; history filters work', async ({ page }) => {
    const fid = await resolveFamilyId()
    const ruthieId = await resolveMemberId('Ruthie')
    const jordanId = await resolveMemberId('Jordan')

    const { data: flagA } = await sr
      .from('safety_flags')
      .insert({ family_id: fid, flagged_member_id: ruthieId, surface: 'lila-chat', category: 'bullying', severity: 'warning', detection_layer: 'keyword' })
      .select('id')
      .single()
    smbFlagIds.push(flagA!.id)
    const { data: flagB } = await sr
      .from('safety_flags')
      .insert({ family_id: fid, flagged_member_id: jordanId, surface: 'lila-chat', category: 'substance', severity: 'concern', detection_layer: 'keyword' })
      .select('id')
      .single()
    smbFlagIds.push(flagB!.id)

    await loginAsMom(page)
    await page.goto('/safety-flags')
    await waitForAppReady(page)

    // Filter by member — only Ruthie's row should show.
    await page.getByTestId('safety-history-filter-member').selectOption(ruthieId)
    await expect(page.getByTestId(`safety-flag-row-${flagA!.id}`)).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId(`safety-flag-row-${flagB!.id}`)).toHaveCount(0)
    await page.getByTestId('safety-history-filter-member').selectOption('')

    // Open Ruthie's flag, acknowledge it.
    await page.getByTestId(`safety-flag-row-${flagA!.id}`).click()
    await expect(page.getByTestId('safety-flag-acknowledge')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('safety-flag-acknowledge').click()

    await expect
      .poll(async () => {
        const { data } = await sr.from('safety_flags').select('status').eq('id', flagA!.id).single()
        return data?.status
      }, { timeout: 10000 })
      .toBe('acknowledged')

    // One-way: reopening shows no action buttons anymore, just the status.
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
    await page.getByTestId(`safety-flag-row-${flagA!.id}`).click()
    await expect(page.getByTestId('safety-flag-detail-body')).toContainText('Acknowledged', { timeout: 10000 })
    await expect(page.getByTestId('safety-flag-acknowledge')).toHaveCount(0)
    await expect(page.getByTestId('safety-flag-dismiss')).toHaveCount(0)
  })

  test('a kid session (Casey, own login) is blocked from /safety-flags', async ({ page }) => {
    await loginAsCasey(page)
    await page.goto('/safety-flags')
    await waitForAppReady(page)
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Safety Flag History' })).toHaveCount(0)
  })

  test('a guided child (Jordan, own login) is blocked from /safety-flags', async ({ page }) => {
    await loginAsJordan(page)
    await page.goto('/safety-flags')
    await waitForAppReady(page)
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).toBeVisible({ timeout: 15000 })
  })

  test('ungranted dad (Mark, own login) is blocked; granted dad passes', async ({ page }) => {
    const fid = await resolveFamilyId()
    const markId = await resolveMemberId('Mark')

    // Make sure Mark starts ungranted for this pin regardless of prior state.
    await sr.from('safety_notification_recipients').delete().eq('family_id', fid).eq('recipient_member_id', markId)

    await loginAsDad(page)
    await page.goto('/safety-flags')
    await waitForAppReady(page)
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).toBeVisible({ timeout: 15000 })

    // Mom grants Mark via the Settings toggle (UI-driven, not a raw DB write).
    await loginAsMom(page)
    await page.goto('/settings')
    await waitForAppReady(page)
    await page.getByRole('button', { name: /Safety Monitoring/i }).first().click()
    await page.getByTestId(`safety-recipient-toggle-${markId}`).click()

    await expect
      .poll(async () => {
        const { data } = await sr.from('safety_notification_recipients').select('is_active').eq('family_id', fid).eq('recipient_member_id', markId).maybeSingle()
        return data?.is_active
      }, { timeout: 10000 })
      .toBe(true)
    const { data: markRecipient } = await sr.from('safety_notification_recipients').select('id').eq('family_id', fid).eq('recipient_member_id', markId).single()
    if (markRecipient) smbRecipientIds.push(markRecipient.id)

    await loginAsDad(page)
    await page.goto('/safety-flags')
    await waitForAppReady(page)
    await expect(page.getByRole('heading', { name: 'Safety Flag History' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Parent-only area' })).toHaveCount(0)
  })
})

test.describe('PRD-30 SM-B — teen disclosure row', () => {
  test('a monitored teen (Alex) sees the standing disclosure; an unmonitored one does not', async ({ page }) => {
    const fid = await resolveFamilyId()
    const alexId = await resolveMemberId('Alex')

    await loginAsAlex(page)
    await page.goto('/settings')
    await waitForAppReady(page)
    await page.getByRole('button', { name: /What's Shared/i }).first().click()
    await expect(page.getByTestId('teen-safety-disclosure-row')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('teen-safety-disclosure-row')).toContainText('Safety monitoring is on for you')

    // Turn Alex's monitoring off and confirm the row disappears, then restore.
    await sr.from('safety_monitoring_configs').update({ is_active: false }).eq('family_id', fid).eq('monitored_member_id', alexId)
    await page.reload()
    await waitForAppReady(page)
    await page.getByRole('button', { name: /What's Shared/i }).first().click()
    await expect(page.getByTestId('teen-safety-disclosure-row')).toHaveCount(0)

    await sr.from('safety_monitoring_configs').update({ is_active: true }).eq('family_id', fid).eq('monitored_member_id', alexId)
  })
})

// ============================================================
// Class 4 — SM-C LIVE pins (require safety-weekly-digest, mindsweep-sort,
// message-coach deployed with the D5/digest changes). Run AFTER Class 1-3
// so any residual fixture state doesn't interfere.
//
// mindsweep-scan's D5 wiring (both handleScan and handleLink hit sites) is
// covered by the static drift pin + code review only (tests/safety-crisis-
// flag.test.ts) — mirroring the exact precedent SAFETY-BETA-GATE Slice B
// already established for this same function ("mindsweep-scan ...covered
// by static pin + code review — schemas make live probing require heavier
// fixtures [real vision-model image or an uncontrolled external URL fetch],
// judged lower-value than the static coverage"). A live pin here would
// require either a base64-encoded image or a stable external URL whose
// fetched text contains crisis language — neither is a repeatable, isolated
// CI fixture, and the underlying flagCrisisEvent() helper is already fully
// covered (both by its own pure-logic vitest and by the two LIVE pins below
// exercising the exact same code path via different callers).
// ============================================================

test.describe('PRD-30 SM-C — LIVE: D5 crisis-hit flag wiring (requires mindsweep-sort/message-coach deployed)', () => {
  test('mindsweep-sort: a crisis phrase in a brain-dump item creates a Critical flag (conversation_table NULL) + mom notification', async () => {
    const fid = await resolveFamilyId()
    const jordanId = await resolveMemberId('Jordan')
    const jordanClient = await signInClient(TEST_USERS.jordan.email, TEST_USERS.jordan.password)

    const { data, error } = await jordanClient.functions.invoke('mindsweep-sort', {
      body: {
        items: [{ content: 'I want to kill myself, nobody would even notice', content_type: 'text' }],
        family_id: fid,
        member_id: jordanId,
        source_channel: 'rhythm_evening',
        input_type: 'text',
      },
    })
    expect(error, `mindsweep-sort must be deployed with the D5 change for this LIVE pin — ${error?.message}`).toBeFalsy()
    expect(data?.crisis).toBe(true)
    expect(data?.response).toContain('988') // member STILL sees resources (Convention #7 unaffected by D5)

    const { data: flags } = await sr
      .from('safety_flags')
      .select('id, category, severity, surface, conversation_table, conversation_id, matched_keywords')
      .eq('family_id', fid)
      .eq('flagged_member_id', jordanId)
      .eq('surface', 'mindsweep-sort')
      .order('created_at', { ascending: false })
      .limit(1)
    expect(flags?.length).toBe(1)
    expect(flags?.[0].severity).toBe('critical')
    expect(flags?.[0].category).toBe('self_harm')
    expect(flags?.[0].conversation_table).toBeNull()
    expect(flags?.[0].conversation_id).toBeNull()
    expect(flags?.[0].matched_keywords).toEqual(['kill myself'])
    if (flags) createdFlagIds.push(...flags.map(f => f.id))

    const { data: notifs } = await sr
      .from('notifications')
      .select('id, priority, category, notification_type')
      .eq('family_id', fid)
      .eq('source_reference_id', flags![0].id)
    expect(notifs && notifs.length).toBeGreaterThan(0)
    expect(notifs?.[0].priority).toBe('high')
    expect(notifs?.[0].category).toBe('safety')
    if (notifs) createdNotificationIds.push(...notifs.map(n => n.id))
  })

  test('message-coach: a crisis phrase in a message draft creates a Critical flag + mom notification (member still sees the coaching-note resources)', async () => {
    const fid = await resolveFamilyId()
    const caseyId = await resolveMemberId('Casey')
    const caseyClient = await signInClient(TEST_USERS.casey.email, TEST_USERS.casey.password)

    const { data, error } = await caseyClient.functions.invoke('message-coach', {
      body: { thread_id: '11111111-1111-1111-1111-111111111111', message_content: 'I want to kill myself' },
    })
    expect(error, `message-coach must be deployed with the D5 change for this LIVE pin — ${error?.message}`).toBeFalsy()
    expect(data?.crisis).toBe(true)
    expect(data?.shouldCoach).toBe(true)
    expect(data?.isClean).toBe(false)
    expect(data?.coachingNote).toContain('988')

    const { data: flags } = await sr
      .from('safety_flags')
      .select('id, category, severity, surface')
      .eq('family_id', fid)
      .eq('flagged_member_id', caseyId)
      .eq('surface', 'message-coach')
      .order('created_at', { ascending: false })
      .limit(1)
    expect(flags?.length).toBe(1)
    expect(flags?.[0].severity).toBe('critical')
    expect(flags?.[0].category).toBe('self_harm')
    if (flags) createdFlagIds.push(...flags.map(f => f.id))

    const { data: notifs } = await sr
      .from('notifications')
      .select('id, priority')
      .eq('family_id', fid)
      .eq('source_reference_id', flags![0].id)
    expect(notifs && notifs.length).toBeGreaterThan(0)
    expect(notifs?.[0].priority).toBe('high')
    if (notifs) createdNotificationIds.push(...notifs.map(n => n.id))
  })

  test('dedup: a second crisis hit for the same member+category within 24h does not create a duplicate flag or notification', async () => {
    const fid = await resolveFamilyId()
    const jordanId = await resolveMemberId('Jordan')
    const jordanClient = await signInClient(TEST_USERS.jordan.email, TEST_USERS.jordan.password)

    const { data: beforeFlags } = await sr
      .from('safety_flags')
      .select('id')
      .eq('family_id', fid)
      .eq('flagged_member_id', jordanId)
      .eq('surface', 'mindsweep-sort')
      .eq('category', 'self_harm')
    const beforeCount = beforeFlags?.length ?? 0
    expect(beforeCount).toBeGreaterThan(0) // the earlier test in this block already created one

    const { data, error } = await jordanClient.functions.invoke('mindsweep-sort', {
      body: {
        items: [{ content: 'end it all, I cannot go on', content_type: 'text' }],
        family_id: fid,
        member_id: jordanId,
        source_channel: 'rhythm_evening',
        input_type: 'text',
      },
    })
    expect(error).toBeFalsy()
    expect(data?.crisis).toBe(true)

    const { data: afterFlags } = await sr
      .from('safety_flags')
      .select('id')
      .eq('family_id', fid)
      .eq('flagged_member_id', jordanId)
      .eq('surface', 'mindsweep-sort')
      .eq('category', 'self_harm')
    expect(afterFlags?.length).toBe(beforeCount) // no new row — dedup window absorbed it
  })
})

test.describe('PRD-30 SM-C — LIVE: weekly digest (requires safety-weekly-digest deployed)', () => {
  test('a backdated flag inside the digest window produces a non-zero summary with a content-free narrative + a quiet in-app notification', async ({ request }) => {
    const fid = await resolveFamilyId()
    const alexId = await resolveMemberId('Alex')

    // Fresh slate — a residual summary from a prior CI run for the SAME
    // family-local week would short-circuit generation via the idempotency
    // check before this test's backdated flag was ever inserted.
    await sr.from('safety_pattern_summaries').delete().eq('family_id', fid).eq('monitored_member_id', alexId)

    // 3 days ago is safely inside the digest's rolling 7-day window
    // (period_end = yesterday, period_start = period_end - 6) for any
    // real-world family timezone.
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const CONTENT_MARKER = 'ZZZ_DIGEST_CONTENT_LEAK_MARKER_ZZZ'
    const { data: flag } = await sr
      .from('safety_flags')
      .insert({
        family_id: fid,
        flagged_member_id: alexId,
        conversation_table: null,
        conversation_id: null,
        surface: 'lila-chat',
        category: 'substance',
        severity: 'warning',
        detection_layer: 'keyword',
        matched_keywords: [CONTENT_MARKER],
        classification_reasoning: `${CONTENT_MARKER} — this must never reach the digest narrative`,
        status: 'new',
        is_safe_harbor: false,
        created_at: threeDaysAgo,
      })
      .select('id')
      .single()
    expect(flag).toBeTruthy()
    createdFlagIds.push(flag!.id)

    const res = await request.post(FN('safety-weekly-digest'), {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    })
    expect(res.ok(), `safety-weekly-digest must be deployed for this LIVE pin — got ${res.status()}`).toBeTruthy()

    const { data: summaries } = await sr
      .from('safety_pattern_summaries')
      .select('id, summary_data, narrative')
      .eq('family_id', fid)
      .eq('monitored_member_id', alexId)
      .order('created_at', { ascending: false })
      .limit(1)
    expect(summaries?.length).toBe(1)
    const summary = summaries![0]
    createdSummaryIds.push(summary.id)

    expect(summary.summary_data.total_flags).toBeGreaterThanOrEqual(1)
    expect(summary.summary_data.category_counts.substance).toBeGreaterThanOrEqual(1)
    expect(summary.narrative).toBeTruthy()
    // Content-free by construction (J2/D2): the Haiku prompt receives only
    // counts, never the flag's content-bearing columns.
    expect(summary.narrative).not.toContain(CONTENT_MARKER)

    const { data: notifs } = await sr
      .from('notifications')
      .select('id, priority, notification_type, category, body')
      .eq('family_id', fid)
      .eq('source_reference_id', summary.id)
    expect(notifs && notifs.length).toBeGreaterThan(0)
    expect(notifs?.[0].priority).toBe('normal') // digest is a trend review, not an alert (J3/D3)
    expect(notifs?.[0].notification_type).toBe('safety_digest')
    expect(notifs?.[0].category).toBe('safety')
    expect(notifs?.[0].body).not.toContain(CONTENT_MARKER)
    if (notifs) createdNotificationIds.push(...notifs.map(n => n.id))
  })

  test('idempotent: re-running the sweep does not create a second summary for the same member+period', async ({ request }) => {
    const fid = await resolveFamilyId()
    const alexId = await resolveMemberId('Alex')

    const res = await request.post(FN('safety-weekly-digest'), {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    })
    expect(res.ok()).toBeTruthy()

    const { data: summaries } = await sr
      .from('safety_pattern_summaries')
      .select('id')
      .eq('family_id', fid)
      .eq('monitored_member_id', alexId)
    expect(summaries?.length).toBe(1) // still just the one from the previous test
  })

  test('zero-flag week: a monitored member with no flags in the window gets the PRD literal narrative, no Haiku call', async ({ request }) => {
    const fid = await resolveFamilyId()
    const ruthieId = await resolveMemberId('Ruthie')

    await sr.from('safety_pattern_summaries').delete().eq('family_id', fid).eq('monitored_member_id', ruthieId)

    const res = await request.post(FN('safety-weekly-digest'), {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    })
    expect(res.ok()).toBeTruthy()

    const { data: summaries } = await sr
      .from('safety_pattern_summaries')
      .select('id, summary_data, narrative')
      .eq('family_id', fid)
      .eq('monitored_member_id', ruthieId)
      .order('created_at', { ascending: false })
      .limit(1)
    expect(summaries?.length).toBe(1)
    createdSummaryIds.push(summaries![0].id)
    expect(summaries![0].summary_data.total_flags).toBe(0)
    expect(summaries![0].narrative).toBe('No concerns detected this week.')
  })
})
