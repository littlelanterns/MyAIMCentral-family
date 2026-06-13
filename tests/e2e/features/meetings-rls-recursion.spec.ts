/**
 * Meetings RLS recursion pin — migration 100273 (2026-06-12).
 *
 * The meetings ↔ meeting_participants policy pair has produced 42P17
 * ("infinite recursion detected in policy") TWICE:
 *   - 100238: self-recursion inside mp_participant_read
 *   - 100273: cross-table cycle meetings_participant_read ↔ mp_mom_read,
 *     which kept EVERY authenticated meetings read 500ing platform-wide
 *     (found by founder console report during KIDS-REWARDS-PAGE Slice 2)
 *
 * This spec pins both directions for every role shape, plus the
 * participant-visibility path that meetings_participant_read (now backed by
 * the SECURITY DEFINER util.my_meeting_ids()) is supposed to grant.
 *
 * Query-layer probes against production RLS (Testworth family, real auth
 * sessions). Fixtures are KRMEET-prefixed and swept via service role.
 */
import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'KRMEET'

let familyId = ''
const memberIds: Record<string, string> = {}
const clients: Record<string, SupabaseClient> = {}

async function memberId(name: string): Promise<string> {
  if (memberIds[name]) return memberIds[name]
  const { data, error } = await sr
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)
    .eq('display_name', name)
    .single()
  if (error || !data) throw new Error(`Member ${name} not found: ${error?.message}`)
  memberIds[name] = data.id
  return data.id
}

async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: true },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`signIn ${email}: ${error.message}`)
  return client
}

async function cleanup() {
  const { data: meetings } = await sr
    .from('meetings')
    .select('id')
    .eq('family_id', familyId)
    .ilike('custom_title', `${PREFIX}%`)
  const ids = (meetings ?? []).map(m => m.id)
  if (ids.length) {
    await sr.from('meeting_participants').delete().in('meeting_id', ids)
    await sr.from('meetings').delete().in('id', ids)
  }
}

test.describe('Meetings RLS — no policy recursion (migrations 100238 + 100273)', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    await Promise.all([memberId('Sarah'), memberId('Mark'), memberId('Alex'), memberId('Casey')])
    await cleanup()

    clients.mom = await signIn(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
    clients.dad = await signIn(TEST_USERS.mark.email, TEST_USERS.mark.password)
    clients.alex = await signIn(TEST_USERS.alex.email, TEST_USERS.alex.password)
    clients.casey = await signIn(TEST_USERS.casey.email, TEST_USERS.casey.password)
  })

  test.afterAll(async () => {
    await cleanup()
    for (const c of Object.values(clients)) {
      // scope:'local' — global signOut revokes other specs' cached sessions
      await c.auth.signOut({ scope: 'local' })
    }
  })

  test('every role reads meetings without 42P17 (the dashboard query shape)', async () => {
    for (const [label, client] of Object.entries(clients)) {
      const { error } = await client
        .from('meetings')
        .select('id, family_id, meeting_type, status, completed_at')
        .eq('family_id', familyId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10)
      expect(error, `${label} meetings read should not error (got: ${error?.message})`).toBeNull()
    }
  })

  test('every role reads meeting_participants without 42P17 (reverse direction)', async () => {
    for (const [label, client] of Object.entries(clients)) {
      const { error } = await client
        .from('meeting_participants')
        .select('id, meeting_id, family_member_id')
        .limit(10)
      expect(error, `${label} participants read should not error (got: ${error?.message})`).toBeNull()
    }
  })

  test('participant visibility still works through util.my_meeting_ids()', async () => {
    const sarah = memberIds['Sarah']
    const alex = memberIds['Alex']

    // Meeting with Alex as a participant (service-role fixture)
    const { data: meeting, error: mErr } = await sr
      .from('meetings')
      .insert({
        family_id: familyId,
        meeting_type: 'mentor',
        custom_title: `${PREFIX} participant visibility probe`,
        status: 'completed',
        started_by: sarah,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (mErr) throw new Error(`meeting fixture: ${mErr.message}`)

    const { error: pErr } = await sr.from('meeting_participants').insert({
      meeting_id: meeting.id,
      family_member_id: alex,
      role: 'participant',
    })
    if (pErr) throw new Error(`participant fixture: ${pErr.message}`)

    // Alex (participant) sees the meeting
    const { data: alexRows, error: aErr } = await clients.alex
      .from('meetings')
      .select('id')
      .eq('id', meeting.id)
    expect(aErr).toBeNull()
    expect(alexRows?.length, 'participant should see their meeting').toBe(1)

    // Casey (NOT a participant, not mom) does not
    const { data: caseyRows, error: cErr } = await clients.casey
      .from('meetings')
      .select('id')
      .eq('id', meeting.id)
    expect(cErr).toBeNull()
    expect(caseyRows?.length, 'non-participant teen should not see it').toBe(0)

    // Mom sees it via meetings_mom_read
    const { data: momRows, error: momErr } = await clients.mom
      .from('meetings')
      .select('id')
      .eq('id', meeting.id)
    expect(momErr).toBeNull()
    expect(momRows?.length, 'mom should see all family meetings').toBe(1)
  })
})
