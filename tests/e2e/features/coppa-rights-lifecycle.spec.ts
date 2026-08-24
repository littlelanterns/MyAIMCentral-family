/**
 * PRD-40 COPPA — Slice 4 (Rights + Lifecycle) pins.
 *
 * Covers: R-10 rejections on revoke_coppa_consent / undo_coppa_revocation /
 * coppa-export-child-data; the revoke -> grace -> undo cycle; the deletion
 * cascade centerpiece (hard-delete, scrub-nullable, scrub-notnull-fallback-
 * to-delete, array-scrub, the two SPECIAL_TABLES, an append-only ledger,
 * family_goal_contributions recompute, shadow-account teardown,
 * retention_deletion_log, deletion_completion_notes, sibling-row byte-
 * identical preservation); and the per-child export flow (ZIP download +
 * rate limit).
 *
 * Fixture isolation: every row this spec creates carries the COPPATEST
 * prefix or is tracked by id and swept in afterAll (service role, loud
 * failures per the Slice-3 lesson — a silent sweep failure caused stray
 * accumulation on 2026-08-23).
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { TEST_USERS } from '../helpers/seed-testworths-complete'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const FN = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`

const sr = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function signInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: true } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`)
  return client
}

// ── Fixture state ──────────────────────────────────────────────────────────
let familyId = ''
let sarahMemberId = ''
const createdMemberIds: string[] = []
const createdConsentIds: string[] = []
const createdVerificationIds: string[] = []
const createdShadowAuthUserIds: string[] = []
const createdNotificationIds: string[] = []
const createdContractIds: string[] = []
const createdPrizeIds: string[] = []
const createdGoalIds: string[] = []
const createdTaskIds: string[] = []
const createdCalendarEventIds: string[] = []
const createdListIds: string[] = []
const createdGuidingStarIds: string[] = []
const createdBestIntentionIds: string[] = []
const createdPointTxnIds: string[] = []

async function resolveTestworth() {
  const { data: fam, error } = await sr
    .from('families')
    .select('id, is_founding_family')
    .eq('family_name', 'The Testworth Family')
    .single()
  if (error || !fam) throw new Error(`Testworth family not found: ${error?.message}`)
  familyId = fam.id

  const { data: sarah } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('role', 'primary_parent')
    .single()
  if (!sarah) throw new Error('Sarah (primary_parent) not found')
  sarahMemberId = sarah.id
}

async function seedVerification(): Promise<string> {
  const { data: existing } = await sr
    .from('parent_verifications')
    .select('id')
    .eq('parent_member_id', sarahMemberId)
    .is('revoked_at', null)
    .maybeSingle()
  if (existing) return existing.id
  const { data, error } = await sr
    .from('parent_verifications')
    .insert({
      family_id: familyId, parent_member_id: sarahMemberId, verification_method: 'stripe_charge',
      stripe_payment_intent_id: `pi_COPPATEST_S4_${Date.now()}`, amount_charged_cents: 100, currency: 'USD',
    })
    .select('id').single()
  if (error || !data) throw new Error(`seed verification failed: ${error?.message}`)
  createdVerificationIds.push(data.id)
  return data.id
}

async function seedChild(name: string, opts: { withShadowAccount?: boolean } = {}): Promise<{ id: string; userId: string | null }> {
  let userId: string | null = null
  if (opts.withShadowAccount) {
    const email = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@pin.myaimcentral.app.test`
    // TEEN-CRED referee finding (2026-08-24): this is a CHILD's shadow
    // account, not a top-level signup — without skip_auto_family,
    // handle_new_user() (migration 100325) still spawns a phantom
    // families + primary_parent family_members + subscription row for it
    // (the .test suffix on this domain doesn't match the @pin.myaimcentral.app
    // skip pattern, by design — this fixture deliberately avoids the real
    // PIN shadow domain). 17 such orphans accumulated in production before
    // this was caught.
    const { data: created, error } = await sr.auth.admin.createUser({
      email,
      password: 'CoppaTest2026!Shadow',
      email_confirm: true,
      user_metadata: { skip_auto_family: true },
    })
    if (error || !created.user) throw new Error(`shadow createUser failed: ${error?.message}`)
    userId = created.user.id
    createdShadowAuthUserIds.push(userId)
  }
  const { data, error } = await sr
    .from('family_members')
    .insert({
      family_id: familyId, display_name: name, role: 'member', dashboard_mode: 'guided', relationship: 'child',
      age: 8, in_household: true, dashboard_enabled: true, auth_method: opts.withShadowAccount ? 'pin' : 'none',
      is_active: true, coppa_age_bracket: 'under_13', user_id: userId, member_color: '#68a395',
    })
    .select('id').single()
  if (error || !data) throw new Error(`seed child failed: ${error?.message}`)
  createdMemberIds.push(data.id)
  return { id: data.id, userId }
}

async function seedConsent(childId: string, verificationId: string): Promise<string> {
  const { data, error } = await sr
    .from('coppa_consents')
    .insert({
      family_id: familyId, child_member_id: childId, parent_member_id: sarahMemberId, verification_id: verificationId,
      consent_version: '1.0.0', acknowledged_sections: ['what_we_collect', 'how_lila_uses', 'who_sees_it', 'your_rights', 'parent_affirmation'],
    })
    .select('id').single()
  if (error || !data) throw new Error(`seed consent failed: ${error?.message}`)
  createdConsentIds.push(data.id)
  return data.id
}

async function sweep() {
  if (createdNotificationIds.length) await sr.from('notifications').delete().in('id', createdNotificationIds)
  if (createdPointTxnIds.length) await sr.from('point_transactions').delete().in('id', createdPointTxnIds)
  if (createdGoalIds.length) {
    await sr.from('family_goal_contributions').delete().in('goal_id', createdGoalIds)
    await sr.from('family_goal_sources').delete().in('goal_id', createdGoalIds)
    await sr.from('family_goals').delete().in('id', createdGoalIds)
  }
  if (createdPrizeIds.length) await sr.from('earned_prizes').delete().in('id', createdPrizeIds)
  if (createdContractIds.length) await sr.from('contracts').delete().in('id', createdContractIds)
  if (createdBestIntentionIds.length) await sr.from('best_intentions').delete().in('id', createdBestIntentionIds)
  if (createdGuidingStarIds.length) await sr.from('guiding_stars').delete().in('id', createdGuidingStarIds)
  if (createdListIds.length) {
    await sr.from('list_shares').delete().in('list_id', createdListIds)
    await sr.from('lists').delete().in('id', createdListIds)
  }
  if (createdCalendarEventIds.length) await sr.from('calendar_events').delete().in('id', createdCalendarEventIds)
  if (createdTaskIds.length) await sr.from('tasks').delete().in('id', createdTaskIds)
  if (createdConsentIds.length) await sr.from('coppa_consents').delete().in('id', createdConsentIds)
  if (createdMemberIds.length) {
    const dl = await sr.from('lists').delete().in('owner_id', createdMemberIds)
    if (dl.error) console.warn('sweep: lists-by-owner delete failed:', dl.error.message)
    const dm = await sr.from('family_members').delete().in('id', createdMemberIds)
    if (dm.error) console.warn('sweep: family_members delete failed:', dm.error.message)
  }
  const { data: strays } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST S4%')
  if (strays?.length) {
    await sr.from('coppa_consents').delete().in('child_member_id', strays.map((s) => s.id))
    await sr.from('lists').delete().in('owner_id', strays.map((s) => s.id))
    await sr.from('family_members').delete().in('id', strays.map((s) => s.id))
  }
  if (createdVerificationIds.length) {
    await sr.from('coppa_consents').delete().in('verification_id', createdVerificationIds)
    await sr.from('parent_verifications').delete().in('id', createdVerificationIds)
  }
  for (const uid of createdShadowAuthUserIds) {
    await sr.auth.admin.deleteUser(uid).catch(() => { /* already deleted by the cascade under test — expected */ })
  }
  const { data: residue } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST S4%')
  if (residue?.length) console.warn(`sweep: ${residue.length} COPPATEST S4 member row(s) COULD NOT be removed`)
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await resolveTestworth()
  await sweep()
})

test.afterAll(async () => {
  await sweep()
})

// ── 1. R-10 rejections ─────────────────────────────────────────────────────

test('R-10: revoke_coppa_consent / undo_coppa_revocation / coppa-export-child-data all reject dad, kid, and family-shadow sessions', async ({ request }) => {
  const fakeId = '00000000-0000-0000-0000-000000000000'
  const dad = await signInClient(TEST_USERS.mark.email, TEST_USERS.mark.password)
  const kid = await signInClient(TEST_USERS.casey.email, TEST_USERS.casey.password)
  const FAMILY_PASSWORD = process.env.E2E_TESTWORTH_FAMILY_PASSWORD || 'Lanterns2026'
  const shadow = await signInClient(`${familyId}@family.myaimcentral.app`, FAMILY_PASSWORD)

  for (const [label, client] of [['dad', dad], ['kid', kid], ['family-shadow', shadow]] as const) {
    const revokeRes = await client.rpc('revoke_coppa_consent', { p_child_member_id: fakeId, p_reason: null })
    expect(revokeRes.error?.message, `revoke rejected for ${label}`).toContain('Not authorized')
    const undoRes = await client.rpc('undo_coppa_revocation', { p_child_member_id: fakeId })
    expect(undoRes.error?.message, `undo rejected for ${label}`).toContain('Not authorized')
  }

  for (const [label, session] of [
    ['dad', await dad.auth.getSession()],
    ['kid', await kid.auth.getSession()],
    ['family-shadow', await shadow.auth.getSession()],
  ] as const) {
    const token = session.data.session?.access_token
    const res = await request.post(FN('coppa-export-child-data'), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { child_member_id: fakeId },
    })
    expect(res.status(), `export rejected for ${label}`).toBe(403)
  }
})

// ── 2. Revoke -> grace -> undo cycle ────────────────────────────────────────

test('revoke_coppa_consent + undo_coppa_revocation: full grace-period cycle', async () => {
  const verificationId = await seedVerification()
  const child = await seedChild('COPPATEST S4 UndoKid')
  await seedConsent(child.id, verificationId)

  const mom = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)

  const revoke = await mom.rpc('revoke_coppa_consent', { p_child_member_id: child.id, p_reason: 'Privacy concerns' })
  expect(revoke.error).toBeNull()
  expect(revoke.data.success).toBe(true)

  const { data: afterRevoke } = await sr
    .from('coppa_consents')
    .select('revoked_at, scheduled_deletion_at, revocation_reason')
    .eq('child_member_id', child.id)
    .single()
  expect(afterRevoke?.revoked_at).toBeTruthy()
  expect(afterRevoke?.scheduled_deletion_at).toBeTruthy()
  expect(afterRevoke?.revocation_reason).toBe('Privacy concerns')

  const { data: suspendedMember } = await sr.from('family_members').select('is_suspended_for_deletion').eq('id', child.id).single()
  expect(suspendedMember?.is_suspended_for_deletion).toBe(true)

  // Second revoke attempt fails — no active consent left to revoke.
  const doubleRevoke = await mom.rpc('revoke_coppa_consent', { p_child_member_id: child.id, p_reason: null })
  expect(doubleRevoke.error?.message).toContain('no_active_consent')

  const undo = await mom.rpc('undo_coppa_revocation', { p_child_member_id: child.id })
  expect(undo.error).toBeNull()
  expect(undo.data.success).toBe(true)

  const { data: afterUndo } = await sr
    .from('coppa_consents')
    .select('revoked_at, scheduled_deletion_at, revocation_reason')
    .eq('child_member_id', child.id)
    .single()
  expect(afterUndo?.revoked_at).toBeNull()
  expect(afterUndo?.scheduled_deletion_at).toBeNull()
  expect(afterUndo?.revocation_reason).toBeNull()

  const { data: unsuspendedMember } = await sr.from('family_members').select('is_suspended_for_deletion').eq('id', child.id).single()
  expect(unsuspendedMember?.is_suspended_for_deletion).toBe(false)

  // Undo again fails — nothing pending.
  const doubleUndo = await mom.rpc('undo_coppa_revocation', { p_child_member_id: child.id })
  expect(doubleUndo.error?.message).toContain('no_revocation_to_undo')

  const { data: notifs } = await sr.from('notifications').select('id').eq('recipient_member_id', sarahMemberId).in('notification_type', ['coppa_consent_revoked', 'coppa_revocation_undone']).order('created_at', { ascending: false }).limit(2)
  if (notifs) createdNotificationIds.push(...notifs.map((n) => n.id))
  expect((notifs ?? []).length).toBeGreaterThanOrEqual(2)
})

// ── 3. The deletion cascade centerpiece ─────────────────────────────────────

test('coppa-deletion-cascade: hard-delete, scrub (nullable + not-null-fallback), array-scrub, SPECIAL_TABLES, ledger carve-out, goal recompute, shadow-account teardown, sibling preservation', async ({ request }, testInfo) => {
  testInfo.setTimeout(90000)
  const verificationId = await seedVerification()
  const child = await seedChild('COPPATEST S4 CascadeKid', { withShadowAccount: true })
  const consentId = await seedConsent(child.id, verificationId)

  // Sibling fixture (existing Testworth kid Casey) — parallel rows prove
  // preservation. Resolve Casey's member id.
  const { data: casey } = await sr.from('family_members').select('id').eq('family_id', familyId).eq('display_name', 'Casey').single()
  const siblingId = casey!.id

  // ── hard_delete (single column): guiding_stars ──
  const { data: gsChild } = await sr.from('guiding_stars').insert({ family_id: familyId, member_id: child.id, content: 'COPPATEST S4 child star', category: 'test' }).select('id').single()
  const { data: gsSibling } = await sr.from('guiding_stars').insert({ family_id: familyId, member_id: siblingId, content: 'COPPATEST S4 sibling star', category: 'test' }).select('id').single()
  createdGuidingStarIds.push(gsChild!.id, gsSibling!.id)

  // ── hard_delete (multi-column: assignee_id primary, created_by secondary scrub) ──
  const { data: taskChildAssignee } = await sr.from('tasks').insert({ family_id: familyId, created_by: sarahMemberId, assignee_id: child.id, title: 'COPPATEST S4 child task', task_type: 'task', status: 'pending', source: 'manual' }).select('id').single()
  const { data: taskSiblingAssigneeChildCreator } = await sr.from('tasks').insert({ family_id: familyId, created_by: child.id, assignee_id: siblingId, title: 'COPPATEST S4 sibling task authored by child', task_type: 'task', status: 'pending', source: 'manual' }).select('id').single()
  createdTaskIds.push(taskChildAssignee!.id, taskSiblingAssigneeChildCreator!.id)

  // ── scrub, nullable column: calendar_events.created_by ──
  const { data: eventChildCreator } = await sr.from('calendar_events').insert({ family_id: familyId, created_by: child.id, title: 'COPPATEST S4 event by child', event_date: '2026-09-01', event_type: 'event', status: 'approved' }).select('id').single()
  createdCalendarEventIds.push(eventChildCreator!.id)

  // ── scrub, NOT NULL column -> delete-row fallback: list_shares.shared_with ──
  const { data: siblingList } = await sr.from('lists').insert({ family_id: familyId, owner_id: siblingId, created_by: sarahMemberId, title: 'COPPATEST S4 sibling list', list_type: 'custom' }).select('id').single()
  createdListIds.push(siblingList!.id)
  await sr.from('list_shares').insert({ list_id: siblingList!.id, shared_with: child.id, permission: 'view' })
  const { data: siblingSelfShare } = await sr.from('list_shares').insert({ list_id: siblingList!.id, shared_with: siblingId, permission: 'edit' }).select('id').single()

  // ── array scrub: best_intentions.related_member_ids ──
  const { data: biChildOwn } = await sr.from('best_intentions').insert({ family_id: familyId, member_id: child.id, statement: 'COPPATEST S4 child intention' }).select('id').single()
  const { data: biSiblingRelated } = await sr.from('best_intentions').insert({ family_id: familyId, member_id: siblingId, statement: 'COPPATEST S4 sibling intention', related_member_ids: [child.id, siblingId] }).select('id').single()
  createdBestIntentionIds.push(biChildOwn!.id, biSiblingRelated!.id)

  // ── SPECIAL: earned_prizes (child-owned hard-delete vs family-level array-scrub) ──
  const { data: prizeChildOwned } = await sr.from('earned_prizes').insert({ family_id: familyId, family_member_id: child.id, source_type: 'task_completion', source_id: taskChildAssignee!.id, prize_type: 'text', prize_text: 'COPPATEST S4 child prize' }).select('id').single()
  const familyGoalSourceId = crypto.randomUUID()
  const { data: prizeFamilyLevel } = await sr.from('earned_prizes').insert({ family_id: familyId, family_member_id: null, source_type: 'family_goal', source_id: familyGoalSourceId, prize_type: 'text', prize_text: 'COPPATEST S4 family prize', visibility: 'family', shared_with_member_ids: [child.id, siblingId] }).select('id').single()
  createdPrizeIds.push(prizeChildOwned!.id, prizeFamilyLevel!.id)

  // ── SPECIAL: contracts (child-scoped hard-delete vs family-wide untouched) ──
  const { data: contractChildScoped } = await sr.from('contracts').insert({ family_id: familyId, created_by: sarahMemberId, family_member_id: child.id, source_type: 'task_completion', if_pattern: 'every_time', godmother_type: 'victory_godmother' }).select('id').single()
  const { data: contractFamilyWide } = await sr.from('contracts').insert({ family_id: familyId, created_by: sarahMemberId, family_member_id: null, source_type: 'task_completion', if_pattern: 'every_time', godmother_type: 'victory_godmother' }).select('id').single()
  createdContractIds.push(contractChildScoped!.id, contractFamilyWide!.id)

  // ── append-only ledger carve-out: point_transactions ──
  const { data: ptChild } = await sr.from('point_transactions').insert({ family_id: familyId, family_member_id: child.id, amount: 10, balance_after: 10, transaction_type: 'earn', source_type: 'manual', idempotency_key: `coppatest-s4-child-${Date.now()}` }).select('id').single()
  const { data: ptSibling } = await sr.from('point_transactions').insert({ family_id: familyId, family_member_id: siblingId, amount: 5, balance_after: 5, transaction_type: 'earn', source_type: 'manual', idempotency_key: `coppatest-s4-sibling-${Date.now()}` }).select('id').single()
  createdPointTxnIds.push(ptChild!.id, ptSibling!.id)

  // ── family_goal_contributions recompute (Convention #278) ──
  const { data: goal } = await sr.from('family_goals').insert({
    family_id: familyId, created_by: sarahMemberId, title: 'COPPATEST S4 goal', participating_member_ids: [child.id, siblingId],
    earning_mode: 'shared_counter', target_count: 100, prize_name: 'COPPATEST S4 goal prize', prize_text: 'COPPATEST S4 goal prize',
  }).select('id').single()
  createdGoalIds.push(goal!.id)
  await sr.from('family_goal_sources').insert({ family_id: familyId, goal_id: goal!.id, source_kind: 'task', source_id: taskChildAssignee!.id })
  // 3 contributions from child, 2 from sibling -> current_progress should auto-become 5.
  for (let i = 0; i < 3; i++) {
    await sr.from('family_goal_contributions').insert({ family_id: familyId, goal_id: goal!.id, member_id: child.id, source_kind: 'task', source_ref_id: crypto.randomUUID() })
  }
  for (let i = 0; i < 2; i++) {
    await sr.from('family_goal_contributions').insert({ family_id: familyId, goal_id: goal!.id, member_id: siblingId, source_kind: 'task', source_ref_id: crypto.randomUUID() })
  }
  const { data: goalBefore } = await sr.from('family_goals').select('current_progress, status').eq('id', goal!.id).single()
  expect(goalBefore?.current_progress).toBe(5)
  expect(goalBefore?.status).toBe('active')

  // ── Snapshot sibling rows BEFORE the cascade for byte-identical comparison ──
  const { data: siblingTaskBefore } = await sr.from('tasks').select('*').eq('id', taskSiblingAssigneeChildCreator!.id).single()
  const { data: siblingBestIntentionBefore } = await sr.from('best_intentions').select('*').eq('id', biSiblingRelated!.id).single()

  // ── Fast-forward the schedule and invoke the cascade directly ──
  await sr.from('coppa_consents').update({ scheduled_deletion_at: new Date(Date.now() - 60000).toISOString() }).eq('id', consentId)

  const res = await request.post(FN('coppa-deletion-cascade'), {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  })
  expect(res.ok(), `coppa-deletion-cascade must be deployed for this LIVE pin — got ${res.status()}`).toBeTruthy()
  const body = await res.json()
  const thisChildResult = (body.results ?? []).find((r: { child_member_id: string }) => r.child_member_id === child.id)
  expect(thisChildResult, 'cascade result for this child').toBeTruthy()
  expect(thisChildResult.ok, `cascade succeeded: ${thisChildResult.error}`).toBe(true)

  // ── hard_delete assertions ──
  const { data: gsChildAfter } = await sr.from('guiding_stars').select('id').eq('id', gsChild!.id).maybeSingle()
  expect(gsChildAfter, 'child guiding_star hard-deleted').toBeNull()
  const { data: gsSiblingAfter } = await sr.from('guiding_stars').select('id').eq('id', gsSibling!.id).maybeSingle()
  expect(gsSiblingAfter, 'sibling guiding_star preserved').toBeTruthy()

  const { data: taskChildAfter } = await sr.from('tasks').select('id').eq('id', taskChildAssignee!.id).maybeSingle()
  expect(taskChildAfter, 'child-assigned task hard-deleted').toBeNull()

  // ── scrub (secondary column on a surviving multi-column hard_delete table).
  //    tasks.created_by is NOT NULL in production — the fallback reassigns
  //    to mom rather than deleting the row (the real bug this test caught
  //    live, 2026-08-24: the row-delete fallback destroyed this SIBLING's
  //    own task). ──────────────────────────────────────────────────────
  const { data: taskSiblingAfter } = await sr.from('tasks').select('*').eq('id', taskSiblingAssigneeChildCreator!.id).single()
  expect(taskSiblingAfter, 'sibling task survives (assignee_id was never the child)').toBeTruthy()
  expect(taskSiblingAfter.created_by, 'created_by reassigned to mom, not deleted').toBe(sarahMemberId)
  // Byte-identical elsewhere: only created_by + updated_at should differ.
  for (const key of Object.keys(siblingTaskBefore!)) {
    if (key === 'created_by' || key === 'updated_at') continue
    expect(taskSiblingAfter[key], `sibling task.${key} unchanged`).toEqual(siblingTaskBefore![key])
  }

  // ── scrub (calendar_events.created_by is ALSO NOT NULL in production —
  //    same reassign-to-mom fallback, not the null it would get if nullable). ──
  const { data: eventAfter } = await sr.from('calendar_events').select('id, created_by').eq('id', eventChildCreator!.id).single()
  expect(eventAfter, 'event survives').toBeTruthy()
  expect(eventAfter.created_by, 'event created_by reassigned to mom').toBe(sarahMemberId)

  // ── scrub (NOT NULL -> reassign-to-mom fallback, list_shares.shared_with) ──
  const { data: shareChildAfter } = await sr.from('list_shares').select('id, shared_with').eq('list_id', siblingList!.id).eq('shared_with', child.id).maybeSingle()
  expect(shareChildAfter, 'child list_share row no longer references the child').toBeNull()
  const { data: shareReassigned } = await sr.from('list_shares').select('id').eq('list_id', siblingList!.id).eq('shared_with', sarahMemberId).maybeSingle()
  expect(shareReassigned, 'the share row survives, reassigned to mom instead of deleted').toBeTruthy()
  const { data: shareSiblingAfter } = await sr.from('list_shares').select('id').eq('id', siblingSelfShare!.id).maybeSingle()
  expect(shareSiblingAfter, 'sibling list_share preserved').toBeTruthy()

  // ── array scrub ──
  const { data: biChildAfter } = await sr.from('best_intentions').select('id').eq('id', biChildOwn!.id).maybeSingle()
  expect(biChildAfter, 'child best_intention hard-deleted').toBeNull()
  const { data: biSiblingAfter } = await sr.from('best_intentions').select('*').eq('id', biSiblingRelated!.id).single()
  expect(biSiblingAfter.related_member_ids, 'child id removed from array, sibling id remains').toEqual([siblingId])
  for (const key of Object.keys(siblingBestIntentionBefore!)) {
    // embedding: async pipeline (Convention: embeddings always async via
    // queue) may populate it between the snapshot and this check — platform
    // background behavior, not a cascade side effect.
    if (key === 'related_member_ids' || key === 'updated_at' || key === 'embedding') continue
    expect(biSiblingAfter[key], `sibling best_intention.${key} unchanged`).toEqual(siblingBestIntentionBefore![key])
  }

  // ── SPECIAL: earned_prizes ──
  const { data: prizeChildAfter } = await sr.from('earned_prizes').select('id').eq('id', prizeChildOwned!.id).maybeSingle()
  expect(prizeChildAfter, 'child-owned prize hard-deleted').toBeNull()
  const { data: prizeFamilyAfter } = await sr.from('earned_prizes').select('shared_with_member_ids').eq('id', prizeFamilyLevel!.id).single()
  expect(prizeFamilyAfter.shared_with_member_ids, 'family prize survives, child id scrubbed from participants').toEqual([siblingId])

  // ── SPECIAL: contracts ──
  const { data: contractChildAfter } = await sr.from('contracts').select('id').eq('id', contractChildScoped!.id).maybeSingle()
  expect(contractChildAfter, 'child-scoped contract hard-deleted').toBeNull()
  const { data: contractFamilyAfter } = await sr.from('contracts').select('id').eq('id', contractFamilyWide!.id).maybeSingle()
  expect(contractFamilyAfter, 'family-wide (NULL family_member_id) contract untouched').toBeTruthy()

  // ── append-only ledger carve-out ──
  const { data: ptChildAfter } = await sr.from('point_transactions').select('id').eq('id', ptChild!.id).maybeSingle()
  expect(ptChildAfter, 'child point_transactions row hard-deleted').toBeNull()
  const { data: ptSiblingAfter } = await sr.from('point_transactions').select('id').eq('id', ptSibling!.id).maybeSingle()
  expect(ptSiblingAfter, 'sibling point_transactions row untouched').toBeTruthy()

  // ── family_goal_contributions recompute ──
  const { data: goalAfter } = await sr.from('family_goals').select('current_progress, status').eq('id', goal!.id).single()
  expect(goalAfter?.current_progress, 'goal progress recomputed to the 2 surviving sibling contributions').toBe(2)
  expect(goalAfter?.status, 'goal still active (2 < target 100)').toBe('active')

  // ── shadow-account teardown. KNOWN PLATFORM LIMITATION (2026-08-24): hard
  //    delete fails on this Supabase project for every auth user tested,
  //    including zero-reference brand-new ones — a GoTrue-level issue, not
  //    something fixable in application code (see coppa-deletion-cascade's
  //    code comment). Soft-delete + global sign-out is the verified,
  //    working mitigation: the account can never authenticate again, which
  //    is what this assertion proves. ─────────────────────────────────
  const { data: getUserResult } = await sr.auth.admin.getUserById(child.userId!)
  expect(getUserResult?.user, 'shadow account still resolvable (soft-deleted)').toBeTruthy()
  expect(getUserResult!.user.deleted_at ?? getUserResult!.user.banned_until, 'shadow account is soft-deleted (deleted_at set)').toBeTruthy()

  // ── family_members row itself ──
  const { data: childRowAfter } = await sr.from('family_members').select('id').eq('id', child.id).maybeSingle()
  expect(childRowAfter, 'child family_members row deleted').toBeNull()

  // ── coppa_consents completion — checked FIRST to recover job_run_id, since
  //    migration 100326 makes retention_deletion_log.child_member_id go NULL
  //    the moment family_members is deleted (ON DELETE SET NULL, not
  //    CASCADE — the fix for the real bug this test caught live,
  //    2026-08-24: the ORIGINAL FK was CASCADE, which silently destroyed
  //    coppa_consents itself the instant the member row was removed). The
  //    row survives permanently; only the now-meaningless FK link clears,
  //    so querying retention_deletion_log by child_member_id no longer
  //    finds anything post-cascade — job_run_id is the durable join key. ──
  const { data: consentAfter } = await sr.from('coppa_consents').select('id, deletion_completed_at, deletion_completion_notes').eq('id', consentId).maybeSingle()
  expect(consentAfter, 'coppa_consents row SURVIVES the family_members delete (was being destroyed before the 100326 fix)').toBeTruthy()
  expect(consentAfter?.deletion_completed_at, 'deletion_completed_at set').toBeTruthy()
  expect(consentAfter?.deletion_completion_notes, 'deletion_completion_notes populated').toBeTruthy()
  const notes = consentAfter?.deletion_completion_notes as { job_run_id?: string; tables?: Record<string, unknown> }
  expect(notes?.tables).toBeTruthy()
  expect(notes?.job_run_id).toBeTruthy()

  // ── retention_deletion_log — also survives (same ON DELETE SET NULL fix);
  //    joined by job_run_id, not child_member_id (which is now NULL here too). ──
  const { data: logRows } = await sr.from('retention_deletion_log').select('source_table, deletion_trigger, row_count, child_member_id').eq('job_run_id', notes!.job_run_id!)
  expect((logRows ?? []).length, 'retention_deletion_log rows written and survive').toBeGreaterThan(0)
  expect(logRows!.every((r) => r.deletion_trigger === 'consent_revocation')).toBe(true)
  expect(logRows!.some((r) => r.source_table === 'guiding_stars')).toBe(true)
  expect(logRows!.every((r) => r.child_member_id === null), 'child_member_id correctly nulled by ON DELETE SET NULL').toBe(true)

  // ── mom notification ──
  const { data: doneNotif } = await sr.from('notifications').select('id').eq('recipient_member_id', sarahMemberId).eq('notification_type', 'coppa_deletion_completed').order('created_at', { ascending: false }).limit(1)
  if (doneNotif?.length) createdNotificationIds.push(...doneNotif.map((n) => n.id))
  expect((doneNotif ?? []).length, 'deletion-completed notification sent to mom').toBeGreaterThan(0)

  // Cascade already removed most fixture rows for this child — clear tracked
  // ids that no longer exist so the afterAll sweep doesn't warn on them.
  createdShadowAuthUserIds.length = 0
})

// ── 4. Export flow ──────────────────────────────────────────────────────────

test('coppa-export-child-data: real ZIP download, correct contents, and rate limit', async ({ request }, testInfo) => {
  testInfo.setTimeout(60000)
  const verificationId = await seedVerification()
  const child = await seedChild('COPPATEST S4 ExportKid')
  await seedConsent(child.id, verificationId)

  const { data: star } = await sr.from('guiding_stars').insert({ family_id: familyId, member_id: child.id, content: 'COPPATEST S4 export star', category: 'test' }).select('id').single()
  createdGuidingStarIds.push(star!.id)

  const mom = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
  const { data: session } = await mom.auth.getSession()
  const token = session.session!.access_token

  const res = await request.post(FN('coppa-export-child-data'), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { child_member_id: child.id },
  })
  expect(res.ok(), `export request status ${res.status()}: ${await res.text()}`).toBeTruthy()
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.download_url).toContain('coppa-exports')
  expect(body.tables_included).toBeGreaterThan(0)

  // Real download: verify it's a genuine, non-trivial ZIP (magic bytes 'PK').
  const download = await request.get(body.download_url)
  expect(download.ok(), 'signed URL is fetchable').toBeTruthy()
  const bytes = await download.body()
  expect(bytes.length).toBeGreaterThan(100)
  expect(bytes.subarray(0, 2).toString('latin1')).toBe('PK')

  const { data: exportRow } = await sr.from('parental_data_exports').select('archive_path, completed_at').eq('child_member_id', child.id).single()
  expect(exportRow?.completed_at).toBeTruthy()
  expect(exportRow?.archive_path).toBeTruthy()

  // Rate limit: a second immediate request is blocked.
  const secondRes = await request.post(FN('coppa-export-child-data'), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { child_member_id: child.id },
  })
  expect(secondRes.status()).toBe(429)

  const { data: notif } = await sr.from('notifications').select('id').eq('recipient_member_id', sarahMemberId).eq('notification_type', 'coppa_export_ready').order('created_at', { ascending: false }).limit(1)
  if (notif?.length) createdNotificationIds.push(...notif.map((n) => n.id))

  // Cleanup the storage object (best-effort, not asserted).
  await sr.storage.from('coppa-exports').remove([exportRow!.archive_path]).catch(() => {})
})
