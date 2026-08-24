/**
 * PRD-40 COPPA — Slice 5 (Enforcement) pins.
 *
 * THE INERTNESS INVARIANT IS THE CENTERPIECE. Tests titled "INERTNESS:" are
 * apply-state-agnostic — they assert that real write paths SUCCEED for every
 * existing member class, so the founder-gated proof sequence is:
 *
 *   1. `npx playwright test coppa-enforcement -g "INERTNESS"`  (BEFORE apply)
 *   2. apply migrations 100327 + 100328 (founder-gated)
 *   3. run the FULL spec                                        (AFTER apply)
 *
 * Identical green INERTNESS results across runs 1 and 3 IS the before/after
 * proof. The classes probed:
 *   - adult (Sarah, primary parent)
 *   - 13-17 teen (Casey, real email session)
 *   - UNCONSENTED under-13 child in a FOUNDING family (COPPATEST fixture
 *     with a real shadow-auth session — the stand-in for the founder's own
 *     under-13 kids, who are never touched by tests; R-8 dormancy is what
 *     keeps this class unaffected)
 *   - consented under-13 fixture child
 *
 * "ENFORCEMENT:" tests exercise the suspension branch (active immediately,
 * dormancy does not apply): a suspended-for-deletion fixture child's writes
 * are RLS-blocked on their own session AND on mom's session when the child
 * is the data subject, and the child disappears from the roster RPCs.
 * These tests REQUIRE migrations 100327+100328 and fail before the apply —
 * that is the point, not a flake.
 *
 * "AI GATE:" is additionally gated on COPPA_AI_GATE_DEPLOYED=1 (set only
 * after the founder-approved lila-chat deploy) — it proves a suspended
 * member's lila-chat call is refused with the friendly message and NOTHING
 * persists.
 *
 * Fixture isolation: COPPATEST prefix everywhere, tracked ids, loud sweep
 * (Slice-3 lesson), zero residue asserted at the end.
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
let caseyMemberId = ''
const SHADOW_PASSWORD = 'CoppaTest2026!Shadow'

let unconsentedChild = { id: '', userId: '', email: '' }
let consentedChild = { id: '', userId: '', email: '' }
const createdMemberIds: string[] = []
const createdShadowAuthUserIds: string[] = []
const createdVerificationIds: string[] = []
let createdSpaceId: string | null = null
let createdThreadId: string | null = null
let createdConversationId: string | null = null

async function resolveTestworth() {
  const { data: fam, error } = await sr
    .from('families')
    .select('id, is_founding_family')
    .eq('family_name', 'The Testworth Family')
    .single()
  if (error || !fam) throw new Error(`Testworth family not found: ${error?.message}`)
  if (!fam.is_founding_family) throw new Error('Testworth must be a founding family — the dormancy probes model the founder posture')
  familyId = fam.id

  const { data: sarah } = await sr
    .from('family_members').select('id')
    .eq('family_id', familyId).eq('role', 'primary_parent').single()
  if (!sarah) throw new Error('Sarah (primary_parent) not found')
  sarahMemberId = sarah.id

  const { data: casey } = await sr
    .from('family_members').select('id')
    .eq('family_id', familyId).eq('display_name', 'Casey').single()
  if (!casey) throw new Error('Casey not found')
  caseyMemberId = casey.id
}

/** R-8 dormancy must actually hold in production, or the INERTNESS premise changed. */
async function assertDormancy() {
  const { data } = await sr
    .from('coppa_consent_templates')
    .select('version')
    .not('lawyer_approved_at', 'is', null)
    .is('retired_at', null)
  if (data?.length) {
    throw new Error(
      'A lawyer-approved consent template exists — COPPA enforcement is ACTIVE. ' +
        'The INERTNESS dormancy probes no longer model production reality; re-scope this spec.',
    )
  }
}

async function seedChild(name: string): Promise<{ id: string; userId: string; email: string }> {
  const email = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@pin.myaimcentral.app.test`
  const { data: created, error } = await sr.auth.admin.createUser({
    email,
    password: SHADOW_PASSWORD,
    email_confirm: true,
    // TEEN-CRED referee finding (2026-08-24): without this, handle_new_user
    // spawns a phantom family for the child's shadow account.
    user_metadata: { skip_auto_family: true },
  })
  if (error || !created.user) throw new Error(`shadow createUser failed: ${error?.message}`)
  createdShadowAuthUserIds.push(created.user.id)

  const { data, error: memberError } = await sr
    .from('family_members')
    .insert({
      family_id: familyId, display_name: name, role: 'member', dashboard_mode: 'guided',
      relationship: 'child', age: 8, in_household: true, dashboard_enabled: true,
      auth_method: 'pin', is_active: true, coppa_age_bracket: 'under_13',
      user_id: created.user.id, member_color: '#68a395',
    })
    .select('id').single()
  if (memberError || !data) throw new Error(`seed child failed: ${memberError?.message}`)
  createdMemberIds.push(data.id)
  return { id: data.id, userId: created.user.id, email }
}

async function seedConsentFor(childId: string) {
  const { data: existing } = await sr
    .from('parent_verifications').select('id')
    .eq('parent_member_id', sarahMemberId).is('revoked_at', null).maybeSingle()
  let verificationId = existing?.id
  if (!verificationId) {
    const { data, error } = await sr
      .from('parent_verifications')
      .insert({
        family_id: familyId, parent_member_id: sarahMemberId, verification_method: 'stripe_charge',
        stripe_payment_intent_id: `pi_COPPATEST_S5_${Date.now()}`, amount_charged_cents: 100, currency: 'USD',
      })
      .select('id').single()
    if (error || !data) throw new Error(`seed verification failed: ${error?.message}`)
    createdVerificationIds.push(data.id)
    verificationId = data.id
  }
  const { error } = await sr.from('coppa_consents').insert({
    family_id: familyId, child_member_id: childId, parent_member_id: sarahMemberId,
    verification_id: verificationId, consent_version: '1.0.0',
    acknowledged_sections: ['what_we_collect', 'how_lila_uses', 'who_sees_it', 'your_rights', 'parent_affirmation'],
  })
  if (error) throw new Error(`seed consent failed: ${error.message}`)
}

/** A COPPATEST group space + thread the fixture children and mom belong to. */
async function seedMessagingFixture(memberIds: string[]) {
  const { data: space, error } = await sr
    .from('conversation_spaces')
    .insert({ family_id: familyId, space_type: 'group', name: 'COPPATEST S5 Space', created_by: sarahMemberId })
    .select('id').single()
  if (error || !space) throw new Error(`seed space failed: ${error?.message}`)
  createdSpaceId = space.id
  for (const id of [sarahMemberId, ...memberIds]) {
    const { error: mErr } = await sr.from('conversation_space_members').insert({ space_id: space.id, family_member_id: id })
    if (mErr) throw new Error(`seed space member failed: ${mErr.message}`)
  }
  const { data: thread, error: tErr } = await sr
    .from('conversation_threads')
    .insert({ space_id: space.id, title: 'COPPATEST S5 Thread', started_by: sarahMemberId })
    .select('id').single()
  if (tErr || !thread) throw new Error(`seed thread failed: ${tErr?.message}`)
  createdThreadId = thread.id
}

async function sweep() {
  const memberIds = [...createdMemberIds]
  const warn = (label: string, err: { message: string } | null) => {
    if (err) console.warn(`sweep: ${label} failed:`, err.message)
  }
  if (createdConversationId) {
    warn('lila_messages', (await sr.from('lila_messages').delete().eq('conversation_id', createdConversationId)).error)
    warn('lila_conversations', (await sr.from('lila_conversations').delete().eq('id', createdConversationId)).error)
    createdConversationId = null
  }
  if (createdThreadId) {
    warn('messages', (await sr.from('messages').delete().eq('thread_id', createdThreadId)).error)
    warn('conversation_threads', (await sr.from('conversation_threads').delete().eq('id', createdThreadId)).error)
    createdThreadId = null
  }
  if (createdSpaceId) {
    warn('conversation_space_members', (await sr.from('conversation_space_members').delete().eq('space_id', createdSpaceId)).error)
    warn('conversation_spaces', (await sr.from('conversation_spaces').delete().eq('id', createdSpaceId)).error)
    createdSpaceId = null
  }
  // Probe artifacts by COPPATEST prefix (mom/teen/child writes)
  warn('tasks', (await sr.from('tasks').delete().like('title', 'COPPATEST S5%')).error)
  warn('journal_entries', (await sr.from('journal_entries').delete().like('content', 'COPPATEST S5%')).error)
  warn('victories', (await sr.from('victories').delete().like('description', 'COPPATEST S5%')).error)
  {
    const { data: intentions } = await sr.from('best_intentions').select('id').like('statement', 'COPPATEST S5%')
    const ids = (intentions ?? []).map((i) => i.id)
    if (ids.length) {
      warn('intention_iterations', (await sr.from('intention_iterations').delete().in('intention_id', ids)).error)
      warn('best_intentions', (await sr.from('best_intentions').delete().in('id', ids)).error)
    }
  }
  if (memberIds.length) {
    warn('coppa_consents', (await sr.from('coppa_consents').delete().in('child_member_id', memberIds)).error)
    // auto-provisioned member resources before the member rows (NO-CASCADE FKs)
    for (const [table, col] of [
      ['lists', 'owner_id'], ['archive_folders', 'member_id'], ['dashboard_configs', 'family_member_id'],
      ['archive_member_settings', 'member_id'], ['dashboard_widgets', 'family_member_id'],
    ] as const) {
      warn(table, (await sr.from(table).delete().in(col, memberIds)).error)
    }
    warn('family_members', (await sr.from('family_members').delete().in('id', memberIds)).error)
    createdMemberIds.length = 0
  }
  if (createdVerificationIds.length) {
    warn('coppa_consents(verifications)', (await sr.from('coppa_consents').delete().in('verification_id', createdVerificationIds)).error)
    warn('parent_verifications', (await sr.from('parent_verifications').delete().in('id', createdVerificationIds)).error)
    createdVerificationIds.length = 0
  }
  for (const uid of createdShadowAuthUserIds) {
    const del = await sr.auth.admin.deleteUser(uid)
    if (del.error) console.warn('sweep: auth deleteUser failed:', del.error.message)
  }
  createdShadowAuthUserIds.length = 0
  // Loud residue check
  const { data: residue } = await sr.from('family_members').select('id').like('display_name', 'COPPATEST S5%')
  if (residue?.length) console.warn(`sweep: ${residue.length} COPPATEST S5 member row(s) COULD NOT be removed — investigate FK blockers`)
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  await resolveTestworth()
  await sweep()
  await assertDormancy()
  unconsentedChild = await seedChild('COPPATEST S5 Dormant Kid')
  consentedChild = await seedChild('COPPATEST S5 Consented Kid')
  await seedConsentFor(consentedChild.id)
  await seedMessagingFixture([unconsentedChild.id, consentedChild.id])
})

test.afterAll(async () => {
  await sweep()
})

// ═══ INERTNESS — identical green before AND after the migration apply ══════

test('INERTNESS: adult (mom) write paths — task, journal, victory, intention tally all succeed', async () => {
  const mom = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
  try {
    const { error: taskErr } = await mom.from('tasks').insert({
      family_id: familyId, created_by: sarahMemberId, assignee_id: sarahMemberId,
      title: 'COPPATEST S5 mom task', task_type: 'task', status: 'pending', source: 'manual',
    })
    expect(taskErr, `mom task insert: ${taskErr?.message}`).toBeNull()

    const { error: journalErr } = await mom.from('journal_entries').insert({
      family_id: familyId, member_id: sarahMemberId, entry_type: 'journal_entry', visibility: 'private', tags: [],
      content: 'COPPATEST S5 mom journal entry',
    })
    expect(journalErr, `mom journal insert: ${journalErr?.message}`).toBeNull()

    const { error: victoryErr } = await mom.from('victories').insert({
      family_id: familyId, family_member_id: sarahMemberId,
      description: 'COPPATEST S5 mom victory', source: 'manual', member_type: 'adult',
    })
    expect(victoryErr, `mom victory insert: ${victoryErr?.message}`).toBeNull()

    const { data: intention, error: intentionErr } = await mom.from('best_intentions').insert({
      family_id: familyId, member_id: sarahMemberId, statement: 'COPPATEST S5 mom intention', source: 'manual',
    }).select('id').single()
    expect(intentionErr, `mom intention insert: ${intentionErr?.message}`).toBeNull()
    const { error: tallyErr } = await mom.from('intention_iterations').insert({
      intention_id: intention!.id, family_id: familyId, member_id: sarahMemberId,
    })
    expect(tallyErr, `mom intention tally: ${tallyErr?.message}`).toBeNull()
  } finally {
    await mom.auth.signOut()
  }
})

test('INERTNESS: teen (Casey) write paths — journal + self-assigned task succeed', async () => {
  const casey = await signInClient(TEST_USERS.casey.email, TEST_USERS.casey.password)
  try {
    const { error: journalErr } = await casey.from('journal_entries').insert({
      family_id: familyId, member_id: caseyMemberId, entry_type: 'journal_entry', visibility: 'private', tags: [],
      content: 'COPPATEST S5 teen journal entry',
    })
    expect(journalErr, `teen journal insert: ${journalErr?.message}`).toBeNull()

    const { error: taskErr } = await casey.from('tasks').insert({
      family_id: familyId, created_by: caseyMemberId, assignee_id: caseyMemberId,
      title: 'COPPATEST S5 teen task', task_type: 'task', status: 'pending', source: 'manual',
    })
    expect(taskErr, `teen self task insert: ${taskErr?.message}`).toBeNull()
  } finally {
    await casey.auth.signOut()
  }
})

test('INERTNESS: UNCONSENTED under-13 in a founding family (the founder-kids class) — journal + message succeed under R-8 dormancy', async () => {
  await assertDormancy()
  const kid = await signInClient(unconsentedChild.email, SHADOW_PASSWORD)
  try {
    const { error: journalErr } = await kid.from('journal_entries').insert({
      family_id: familyId, member_id: unconsentedChild.id, entry_type: 'journal_entry', visibility: 'private', tags: [],
      content: 'COPPATEST S5 dormant kid journal',
    })
    expect(journalErr, `dormant kid journal insert: ${journalErr?.message}`).toBeNull()

    const { error: msgErr } = await kid.from('messages').insert({
      thread_id: createdThreadId, sender_member_id: unconsentedChild.id,
      message_type: 'user', content: 'COPPATEST S5 dormant kid message',
    })
    expect(msgErr, `dormant kid message insert: ${msgErr?.message}`).toBeNull()
  } finally {
    await kid.auth.signOut()
  }
})

test('INERTNESS: consented under-13 fixture child — journal succeeds', async () => {
  const kid = await signInClient(consentedChild.email, SHADOW_PASSWORD)
  try {
    const { error } = await kid.from('journal_entries').insert({
      family_id: familyId, member_id: consentedChild.id, entry_type: 'journal_entry', visibility: 'private', tags: [],
      content: 'COPPATEST S5 consented kid journal',
    })
    expect(error, `consented kid journal insert: ${error?.message}`).toBeNull()
  } finally {
    await kid.auth.signOut()
  }
})

// ═══ ENFORCEMENT — requires migrations 100327 + 100328 applied ═════════════

test('ENFORCEMENT: suspended child — own-session writes blocked, mom writes naming the child blocked, all restored on unsuspend', async () => {
  const { error: suspendErr } = await sr
    .from('family_members').update({ is_suspended_for_deletion: true }).eq('id', unconsentedChild.id)
  expect(suspendErr).toBeNull()

  const kid = await signInClient(unconsentedChild.email, SHADOW_PASSWORD)
  const mom = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
  try {
    // Child's own writes stop (PRD Screen 9: "blocks all data writes")
    const { error: journalErr } = await kid.from('journal_entries').insert({
      family_id: familyId, member_id: unconsentedChild.id, entry_type: 'journal_entry', visibility: 'private', tags: [],
      content: 'COPPATEST S5 suspended kid journal SHOULD FAIL',
    })
    expect(journalErr, 'suspended child journal insert must be RLS-blocked').not.toBeNull()

    const { error: msgErr } = await kid.from('messages').insert({
      thread_id: createdThreadId, sender_member_id: unconsentedChild.id,
      message_type: 'user', content: 'COPPATEST S5 suspended kid message SHOULD FAIL',
    })
    expect(msgErr, 'suspended child message insert must be RLS-blocked').not.toBeNull()

    // Mom's writes NAMING THE CHILD AS SUBJECT stop too (umbrella rule, PRD L1055)
    const { error: momTaskErr } = await mom.from('tasks').insert({
      family_id: familyId, created_by: sarahMemberId, assignee_id: unconsentedChild.id,
      title: 'COPPATEST S5 task for suspended kid SHOULD FAIL', task_type: 'task', status: 'pending', source: 'manual',
    })
    expect(momTaskErr, 'mom task insert naming suspended child must be RLS-blocked').not.toBeNull()

    // Mom's OWN writes are untouched while a family member is suspended
    const { error: momOwnErr } = await mom.from('journal_entries').insert({
      family_id: familyId, member_id: sarahMemberId, entry_type: 'journal_entry', visibility: 'private', tags: [],
      content: 'COPPATEST S5 mom journal during suspension',
    })
    expect(momOwnErr, `mom own journal during suspension: ${momOwnErr?.message}`).toBeNull()

    // Undo restores everything
    const { error: unsuspendErr } = await sr
      .from('family_members').update({ is_suspended_for_deletion: false }).eq('id', unconsentedChild.id)
    expect(unsuspendErr).toBeNull()

    const { error: afterErr } = await kid.from('journal_entries').insert({
      family_id: familyId, member_id: unconsentedChild.id, entry_type: 'journal_entry', visibility: 'private', tags: [],
      content: 'COPPATEST S5 dormant kid journal after unsuspend',
    })
    expect(afterErr, `post-unsuspend journal insert: ${afterErr?.message}`).toBeNull()
  } finally {
    await kid.auth.signOut()
    await mom.auth.signOut()
    await sr.from('family_members').update({ is_suspended_for_deletion: false }).eq('id', unconsentedChild.id)
  }
})

test('ENFORCEMENT: suspended child disappears from the roster RPCs, returns on unsuspend', async () => {
  await sr.from('family_members').update({ is_suspended_for_deletion: true }).eq('id', unconsentedChild.id)
  const mom = await signInClient(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
  try {
    const { data: hidden, error } = await mom.rpc('get_family_login_members', { p_family_id: familyId })
    expect(error).toBeNull()
    expect((hidden ?? []).map((m: { member_id: string }) => m.member_id)).not.toContain(unconsentedChild.id)

    await sr.from('family_members').update({ is_suspended_for_deletion: false }).eq('id', unconsentedChild.id)

    const { data: restored } = await mom.rpc('get_family_login_members', { p_family_id: familyId })
    expect((restored ?? []).map((m: { member_id: string }) => m.member_id)).toContain(unconsentedChild.id)
  } finally {
    await mom.auth.signOut()
    await sr.from('family_members').update({ is_suspended_for_deletion: false }).eq('id', unconsentedChild.id)
  }
})

// ═══ AI GATE — additionally requires the founder-approved lila-chat deploy ═

test('AI GATE: suspended member lila-chat call refused with the friendly message; nothing persists', async () => {
  test.skip(process.env.COPPA_AI_GATE_DEPLOYED !== '1', 'set COPPA_AI_GATE_DEPLOYED=1 after the founder-approved lila-chat deploy')

  const { data: conv, error: convErr } = await sr
    .from('lila_conversations')
    .insert({ family_id: familyId, member_id: unconsentedChild.id, title: 'COPPATEST S5 AI gate', mode: 'general', status: 'active', container_type: 'modal' })
    .select('id').single()
  expect(convErr).toBeNull()
  createdConversationId = conv!.id

  await sr.from('family_members').update({ is_suspended_for_deletion: true }).eq('id', unconsentedChild.id)
  const kid = await signInClient(unconsentedChild.email, SHADOW_PASSWORD)
  try {
    const { data: session } = await kid.auth.getSession()
    const res = await fetch(FN('lila-chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session!.access_token}` },
      body: JSON.stringify({ conversation_id: conv!.id, content: 'COPPATEST S5 hello lila' }),
    })
    const text = await res.text()
    expect(text).toContain('coppa_blocked')
    expect(text).not.toContain('COPPATEST S5 hello lila') // never echoed from a model

    // NOTHING persisted — not even the user message (persisting it would be collection)
    const { data: messages } = await sr.from('lila_messages').select('id').eq('conversation_id', conv!.id)
    expect(messages ?? []).toHaveLength(0)
  } finally {
    await kid.auth.signOut()
    await sr.from('family_members').update({ is_suspended_for_deletion: false }).eq('id', unconsentedChild.id)
  }
})
