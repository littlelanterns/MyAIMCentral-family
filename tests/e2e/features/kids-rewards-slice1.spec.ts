/**
 * KIDS-REWARDS-PAGE — Slice 1 verification (2026-06-12)
 *
 * Pins the reward-pipeline core (migrations 100266–100268) per the founder
 * directive at baton-pass approval. Six numbered items from the active build
 * file (.claude/rules/current-builds/KIDS-REWARDS-PAGE.md):
 *
 *   1. NULL-guard pin (REQUIRED): an inline-payload custom_reward contract
 *      with godmother_config_id = NULL — what ContractForm authors today —
 *      must grant end-to-end. Pins the round-2 hotfix restored by 100268.
 *   2. Both live vocabulary values (REQUIRED): the award pipe fires for
 *      reward_type 'privilege' AND 'custom' (migration 100267) — the values
 *      the task_rewards CHECK constraint actually accepts.
 *   3. Award timing (Q7): require_approval tasks award at APPROVAL, not at
 *      kid completion-mark; no-approval tasks award instantly. Idempotency:
 *      re-firing on the same completion → already_awarded, ONE prize row.
 *   4. Kid self-redeem: redeem_own_prize RPC succeeds for the earner, sets
 *      redeemed_at/redeemed_by, fires the quiet mom notification; a kid's
 *      direct UPDATE on earned_prizes is RLS-blocked (parent-only policy).
 *   5. Un-redeem round trip: mom clears redeemed_at/redeemed_by → card
 *      active again → kid can redeem again.
 *   6. Visibility probes (query layer, never rendered-then-hidden):
 *      private self-reward rows return ZERO rows under another non-mom
 *      member's client session; shared rows reach only listed members;
 *      mom sees private rows UNLESS personal_rewards_privacy=true on the
 *      earner (both states probed).
 *
 * GUARD LEDGER (founder-directed, 2026-06-12): execute_custom_reward_godmother
 * has regressed three times (100214→100223→100224→100268; round 4 = 100269).
 * Tests 1a–1g pin EVERY known guard individually — see the ledger comment at
 * the top of supabase/migrations/00000000100269_custom_reward_godmother_round4.sql:
 *   G1 NULL-config guard [1a] · G2 Bug C3 text-mode scalar fix [1a, 1c] ·
 *   G3 missing family_member_id graceful fail [1f] · G4 list_reference
 *   without reward_list_id graceful fail [1e] · G5 payload_config image [1b] ·
 *   G6 config image [1c] · G7 per-item list image wins + item checked [1d] ·
 *   G8 empty payload_text fallback [1g]
 *
 * All probes are query-layer (supabase-js clients authenticated as real
 * Testworth members) — UI eyes-on is the founder's parallel gate.
 *
 * Fixture hygiene: KRSLICE1-prefixed fixtures created/removed via service
 * role (role-scoping-leak-pass.spec.ts pattern), Testworth family.
 */
import { test, expect } from '@playwright/test'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

// Service role client — fixtures + ground-truth assertions (bypasses RLS)
const sr = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PREFIX = 'KRSLICE1'

let familyId = ''
const memberIds: Record<string, string> = {}

// Member-authenticated clients (real auth sessions → real RLS evaluation)
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

/** Create a KRSLICE1 task + task_rewards row, return the task id. */
async function createRewardTask(opts: {
  title: string
  assigneeId: string
  rewardType: 'privilege' | 'custom'
  rewardDescription: string
  requireApproval?: boolean
}): Promise<string> {
  const sarah = await memberId('Sarah')
  const { data: task, error: tErr } = await sr
    .from('tasks')
    .insert({
      family_id: familyId,
      created_by: sarah,
      assignee_id: opts.assigneeId,
      title: opts.title,
      task_type: 'task',
      status: 'pending',
      source: 'manual',
      require_approval: opts.requireApproval ?? false,
      reward_description: opts.rewardDescription,
    })
    .select('id')
    .single()
  if (tErr) throw new Error(`task fixture: ${tErr.message}`)

  const { error: rErr } = await sr.from('task_rewards').insert({
    task_id: task.id,
    reward_type: opts.rewardType,
    reward_value: { description: opts.rewardDescription },
  })
  if (rErr) throw new Error(`task_rewards fixture: ${rErr.message}`)
  return task.id
}

/** Insert a task_completions row for a member, return the completion id. */
async function createCompletion(
  taskId: string,
  earnerId: string,
  approvalStatus: 'pending' | 'approved' | null = null,
): Promise<string> {
  const { data, error } = await sr
    .from('task_completions')
    .insert({
      task_id: taskId,
      member_id: earnerId,
      family_member_id: earnerId,
      ...(approvalStatus ? { approval_status: approvalStatus } : {}),
    })
    .select('id')
    .single()
  if (error) throw new Error(`completion fixture: ${error.message}`)
  return data.id
}

/** Insert an earned_prizes row directly (visibility / redeem fixtures). */
async function createPrize(opts: {
  earnerId: string
  prizeText: string
  visibility?: 'family' | 'private' | 'shared'
  sharedWith?: string[]
  createdBy?: string
}): Promise<string> {
  const { data, error } = await sr
    .from('earned_prizes')
    .insert({
      family_id: familyId,
      family_member_id: opts.earnerId,
      source_type: 'task_completion',
      source_id: randomUUID(),
      prize_type: 'text',
      prize_text: opts.prizeText,
      prize_name: opts.prizeText.slice(0, 80),
      visibility: opts.visibility ?? 'family',
      shared_with_member_ids: opts.sharedWith ?? [],
      created_by: opts.createdBy ?? null,
    })
    .select('id')
    .single()
  if (error) throw new Error(`prize fixture: ${error.message}`)
  return data.id
}

/**
 * Create a custom_reward contract + matching deed firing, dispatch runs
 * synchronously in the INSERT trigger; returns the grant-log outcome.
 * memberId=null exercises the family-default contract + NULL-member firing.
 */
async function fireContract(opts: {
  payloadText?: string | null
  payloadConfig?: Record<string, unknown> | null
  configId?: string | null
  memberId?: string | null
}): Promise<{
  contractId: string
  status: string
  errorMessage: string | null
  grantRef: string | null
}> {
  const sarah = await memberId('Sarah')
  const sourceId = randomUUID()

  const { data: contract, error: cErr } = await sr
    .from('contracts')
    .insert({
      family_id: familyId,
      created_by: sarah,
      source_type: 'task_completion',
      source_id: sourceId,
      source_category: PREFIX, // cleanup anchor for contracts with NULL payload_text
      family_member_id: opts.memberId ?? null,
      if_pattern: 'every_time',
      godmother_type: 'custom_reward_godmother',
      godmother_config_id: opts.configId ?? null,
      payload_text: opts.payloadText ?? null,
      payload_config: opts.payloadConfig ?? null,
      stroke_of: 'immediate',
    })
    .select('id')
    .single()
  if (cErr) throw new Error(`fireContract contract: ${cErr.message}`)

  const { data: firing, error: fErr } = await sr
    .from('deed_firings')
    .insert({
      family_id: familyId,
      family_member_id: opts.memberId ?? null,
      source_type: 'task_completion',
      source_id: sourceId,
      metadata: { krslice1: true },
      idempotency_key: `${PREFIX}:${sourceId}`,
    })
    .select('id')
    .single()
  if (fErr) throw new Error(`fireContract firing: ${fErr.message}`)

  const { data: log, error: lErr } = await sr
    .from('contract_grant_log')
    .select('status, grant_reference, metadata')
    .eq('deed_firing_id', firing.id)
    .eq('contract_id', contract.id)
    .single()
  if (lErr) throw new Error(`fireContract grant log: ${lErr.message}`)

  return {
    contractId: contract.id,
    status: log.status,
    errorMessage: (log.metadata as Record<string, unknown> | null)?.error_message as
      | string
      | null,
    grantRef: log.grant_reference,
  }
}

/** Set/clear the personal_rewards_privacy grant on a member (merge, never clobber). */
async function setPersonalRewardsPrivacy(memberIdToSet: string, value: boolean) {
  const { data, error } = await sr
    .from('family_members')
    .select('preferences')
    .eq('id', memberIdToSet)
    .single()
  if (error) throw new Error(`read preferences: ${error.message}`)
  const prefs = { ...(data.preferences ?? {}), personal_rewards_privacy: value }
  const { error: uErr } = await sr
    .from('family_members')
    .update({ preferences: prefs })
    .eq('id', memberIdToSet)
  if (uErr) throw new Error(`write preferences: ${uErr.message}`)
}

async function cleanup() {
  // Contracts + their dispatch artifacts. Anchor-matched (source_category =
  // PREFIX, plus payload_text prefix for pre-anchor leftovers) so a crashed
  // prior run's leftovers are caught even without recorded ids.
  const { data: contracts } = await sr
    .from('contracts')
    .select('id')
    .eq('family_id', familyId)
    .or(`source_category.eq.${PREFIX},payload_text.ilike.${PREFIX}%`)
  const contractIds = (contracts ?? []).map((c) => c.id)

  const { data: firings } = await sr
    .from('deed_firings')
    .select('id')
    .eq('family_id', familyId)
    .contains('metadata', { krslice1: true })
  const firingIds = (firings ?? []).map((f) => f.id)

  // Godmother-created prizes are deleted via grant_reference (covers prizes
  // whose text is NOT prefix-matched, e.g. the G8 generated-fallback text)
  if (contractIds.length) {
    const { data: logs } = await sr
      .from('contract_grant_log')
      .select('grant_reference')
      .in('contract_id', contractIds)
      .not('grant_reference', 'is', null)
    const refIds = (logs ?? []).map((l) => l.grant_reference)
    if (refIds.length) {
      await sr.from('earned_prizes').delete().in('id', refIds)
    }
    await sr.from('contract_grant_log').delete().in('contract_id', contractIds)
    await sr.from('deferred_grants').delete().in('contract_id', contractIds)
  }
  if (firingIds.length) {
    await sr.from('contract_grant_log').delete().in('deed_firing_id', firingIds)
    await sr.from('deferred_grants').delete().in('deed_firing_id', firingIds)
    await sr.from('deed_firings').delete().in('id', firingIds)
  }
  if (contractIds.length) {
    await sr.from('contracts').delete().in('id', contractIds)
  }

  // Godmother configs (created by the guard-ledger tests 1c–1e)
  await sr
    .from('custom_reward_godmother_configs')
    .delete()
    .eq('family_id', familyId)
    .ilike('reward_text', `${PREFIX}%`)

  // Reward lists (list_items first — no cascade assumption)
  const { data: lists } = await sr
    .from('lists')
    .select('id')
    .eq('family_id', familyId)
    .ilike('title', `${PREFIX}%`)
  for (const l of lists ?? []) {
    await sr.from('list_items').delete().eq('list_id', l.id)
    await sr.from('lists').delete().eq('id', l.id)
  }

  // Prizes (+ the prize_redeemed notifications that reference them)
  const { data: prizes } = await sr
    .from('earned_prizes')
    .select('id')
    .eq('family_id', familyId)
    .ilike('prize_text', `${PREFIX}%`)
  const prizeIds = (prizes ?? []).map((p) => p.id)
  if (prizeIds.length) {
    await sr
      .from('notifications')
      .delete()
      .eq('family_id', familyId)
      .eq('notification_type', 'prize_redeemed')
      .in('source_reference_id', prizeIds)
    await sr.from('earned_prizes').delete().in('id', prizeIds)
  }

  // Tasks (task_rewards + task_completions cascade via FK)
  await sr.from('tasks').delete().eq('family_id', familyId).ilike('title', `${PREFIX}%`)

  // Safety: never leave the privacy grant set on Mark
  if (memberIds['Mark']) {
    await setPersonalRewardsPrivacy(memberIds['Mark'], false)
  }
}

test.describe('KIDS-REWARDS-PAGE Slice 1 — reward pipeline core', () => {
  test.beforeAll(async () => {
    const { data: family, error } = await sr
      .from('families')
      .select('id')
      .eq('family_login_name_lower', 'testworthfamily')
      .single()
    if (error || !family) throw new Error(`Testworth family not found: ${error?.message}`)
    familyId = family.id

    await Promise.all([
      memberId('Sarah'),
      memberId('Mark'),
      memberId('Alex'),
      memberId('Casey'),
      memberId('Jordan'),
    ])

    await cleanup() // clear leftovers from any crashed prior run

    clients.mom = await signIn(TEST_USERS.sarah.email, TEST_USERS.sarah.password)
    clients.dad = await signIn(TEST_USERS.mark.email, TEST_USERS.mark.password)
    clients.alex = await signIn(TEST_USERS.alex.email, TEST_USERS.alex.password)
    clients.casey = await signIn(TEST_USERS.casey.email, TEST_USERS.casey.password)
    clients.jordan = await signIn(TEST_USERS.jordan.email, TEST_USERS.jordan.password)
  })

  test.afterAll(async () => {
    await cleanup()
    for (const c of Object.values(clients)) {
      // scope:'local' — a bare signOut() defaults to GLOBAL and revokes every
      // session for that user, killing the .auth/*.json sessions other specs
      // cache (REST keeps working statelessly but auth.getUser()-validating
      // Edge Functions start 401ing — burned us during the eyes-on tour).
      await c.auth.signOut({ scope: 'local' }).catch(() => {})
    }
  })

  // ── 1. NULL-guard pin: inline-payload contract (godmother_config_id = NULL) ──
  // ContractForm authors contracts with NO godmother_config_id — the payload is
  // inline (payload_text / payload_config). 100266's godmother rewrite dropped
  // the round-2 NULL-config guard (100223) and would have crashed every such
  // contract; 100268 restored it. This test pins it end-to-end through the REAL
  // pipeline: deed_firings INSERT → trg_deed_firings_dispatch →
  // dispatch_godmothers → execute_custom_reward_godmother → earned_prizes.
  test('1. inline-payload custom_reward contract (config_id=NULL) grants end-to-end', async () => {
    const sarah = await memberId('Sarah')
    const jordan = await memberId('Jordan')

    // (a) Text-only inline contract — the exact regression shape
    const textSourceId = randomUUID()
    const { data: textContract, error: cErr } = await sr
      .from('contracts')
      .insert({
        family_id: familyId,
        created_by: sarah,
        source_type: 'task_completion',
        source_id: textSourceId,
        family_member_id: jordan,
        if_pattern: 'every_time',
        godmother_type: 'custom_reward_godmother',
        godmother_config_id: null, // ← the pin
        payload_text: `${PREFIX} inline popsicle`,
        stroke_of: 'immediate',
      })
      .select('id')
      .single()
    if (cErr) throw new Error(`text contract: ${cErr.message}`)

    const { data: textFiring, error: fErr } = await sr
      .from('deed_firings')
      .insert({
        family_id: familyId,
        family_member_id: jordan,
        source_type: 'task_completion',
        source_id: textSourceId,
        metadata: { krslice1: true },
        idempotency_key: `${PREFIX}:null-guard-text:${textSourceId}`,
      })
      .select('id')
      .single()
    if (fErr) throw new Error(`text deed firing: ${fErr.message}`)

    // Dispatch runs synchronously inside the INSERT trigger — grant log is final.
    const { data: textGrant } = await sr
      .from('contract_grant_log')
      .select('status, error_message, grant_reference')
      .eq('deed_firing_id', textFiring.id)
      .eq('contract_id', textContract.id)
      .single()
    expect(textGrant?.status, `grant log error: ${textGrant?.error_message}`).toBe('granted')

    const { data: textPrize } = await sr
      .from('earned_prizes')
      .select('*')
      .eq('id', textGrant!.grant_reference)
      .single()
    expect(textPrize).toBeTruthy()
    expect(textPrize!.family_member_id).toBe(jordan)
    expect(textPrize!.prize_text).toBe(`${PREFIX} inline popsicle`)
    expect(textPrize!.prize_name).toBe(`${PREFIX} inline popsicle`)
    expect(textPrize!.prize_type).toBe('text')
    expect(textPrize!.visibility).toBe('family')
    expect(textPrize!.created_by).toBe(sarah)
    expect(textPrize!.redeemed_at).toBeNull()

    // (b) Inline contract WITH payload_config image — pins 100268's image
    //     fallback chain (contracts.payload_config → earned_prizes snapshot)
    const imgSourceId = randomUUID()
    const imgUrl = 'https://example.com/gamification-assets/reward-images/test/krslice1.png'
    const { data: imgContract, error: icErr } = await sr
      .from('contracts')
      .insert({
        family_id: familyId,
        created_by: sarah,
        source_type: 'task_completion',
        source_id: imgSourceId,
        family_member_id: jordan,
        if_pattern: 'every_time',
        godmother_type: 'custom_reward_godmother',
        godmother_config_id: null,
        payload_text: `${PREFIX} inline ice cream trip`,
        payload_config: { reward_image_url: imgUrl },
        stroke_of: 'immediate',
      })
      .select('id')
      .single()
    if (icErr) throw new Error(`image contract: ${icErr.message}`)

    const { data: imgFiring, error: ifErr } = await sr
      .from('deed_firings')
      .insert({
        family_id: familyId,
        family_member_id: jordan,
        source_type: 'task_completion',
        source_id: imgSourceId,
        metadata: { krslice1: true },
        idempotency_key: `${PREFIX}:null-guard-img:${imgSourceId}`,
      })
      .select('id')
      .single()
    if (ifErr) throw new Error(`image deed firing: ${ifErr.message}`)

    const { data: imgGrant } = await sr
      .from('contract_grant_log')
      .select('status, error_message, grant_reference')
      .eq('deed_firing_id', imgFiring.id)
      .eq('contract_id', imgContract.id)
      .single()
    expect(imgGrant?.status, `grant log error: ${imgGrant?.error_message}`).toBe('granted')

    const { data: imgPrize } = await sr
      .from('earned_prizes')
      .select('prize_type, prize_image_url, prize_text')
      .eq('id', imgGrant!.grant_reference)
      .single()
    expect(imgPrize!.prize_type).toBe('image')
    expect(imgPrize!.prize_image_url).toBe(imgUrl)
    expect(imgPrize!.prize_text).toBe(`${PREFIX} inline ice cream trip`)
  })

  // ── 1c–1g. Guard ledger pins (founder-directed) ─────────────────────────────
  // Every known guard in execute_custom_reward_godmother gets its OWN pin.
  // See the GUARD LEDGER comment in migration 100269.

  // G2 (config path) + G6: config-based TEXT contract — exercises the C3
  // scalar fix on the config-exists branch AND pins the config-image snapshot.
  test('1c. config-based text contract: config text + config image snapshot (G2/G6)', async () => {
    const jordan = await memberId('Jordan')
    const cfgImg = 'https://example.com/gamification-assets/reward-images/test/krslice1-config.png'

    const { data: cfg, error: cfgErr } = await sr
      .from('custom_reward_godmother_configs')
      .insert({
        family_id: familyId,
        delivery_mode: 'text',
        reward_text: `${PREFIX} config movie night`,
        reward_image_url: cfgImg,
      })
      .select('id')
      .single()
    if (cfgErr) throw new Error(`config fixture: ${cfgErr.message}`)

    const result = await fireContract({
      configId: cfg.id,
      payloadText: `${PREFIX} payload should lose to config text`,
      memberId: jordan,
    })
    expect(result.status, `error: ${result.errorMessage}`).toBe('granted')

    const { data: prize } = await sr
      .from('earned_prizes')
      .select('prize_text, prize_type, prize_image_url, family_member_id')
      .eq('id', result.grantRef!)
      .single()
    expect(prize!.prize_text).toBe(`${PREFIX} config movie night`)
    expect(prize!.prize_type).toBe('image')
    expect(prize!.prize_image_url).toBe(cfgImg)
    expect(prize!.family_member_id).toBe(jordan)
  })

  // G7: list_reference draw — per-item image WINS over config image, prize
  // text = item name, and the drawn (non-repeatable) item gets checked.
  test('1d. list_reference contract: item drawn, per-item image wins, item checked (G7)', async () => {
    const jordan = await memberId('Jordan')
    const sarah = await memberId('Sarah')
    const cfgImg = 'https://example.com/gamification-assets/reward-images/test/krslice1-cfg-lose.png'
    const itemImg = 'https://example.com/gamification-assets/reward-images/test/krslice1-item-wins.png'

    const { data: list, error: listErr } = await sr
      .from('lists')
      .insert({
        family_id: familyId,
        owner_id: sarah,
        created_by: sarah,
        title: `${PREFIX} Rewards List`,
        list_name: `${PREFIX} Rewards List`,
        list_type: 'custom',
      })
      .select('id')
      .single()
    if (listErr) throw new Error(`list fixture: ${listErr.message}`)

    const { data: item, error: itemErr } = await sr
      .from('list_items')
      .insert({
        list_id: list.id,
        content: `${PREFIX} surprise sundae`,
        item_name: `${PREFIX} surprise sundae`,
        checked: false,
        reward_image_url: itemImg,
      })
      .select('id')
      .single()
    if (itemErr) throw new Error(`list item fixture: ${itemErr.message}`)

    const { data: cfg, error: cfgErr } = await sr
      .from('custom_reward_godmother_configs')
      .insert({
        family_id: familyId,
        delivery_mode: 'list_reference',
        reward_list_id: list.id,
        reward_text: `${PREFIX} list-exhausted fallback`,
        reward_image_url: cfgImg,
      })
      .select('id')
      .single()
    if (cfgErr) throw new Error(`list config fixture: ${cfgErr.message}`)

    const result = await fireContract({ configId: cfg.id, memberId: jordan })
    expect(result.status, `error: ${result.errorMessage}`).toBe('granted')

    const { data: prize } = await sr
      .from('earned_prizes')
      .select('prize_text, prize_type, prize_image_url')
      .eq('id', result.grantRef!)
      .single()
    expect(prize!.prize_text).toBe(`${PREFIX} surprise sundae`)
    expect(prize!.prize_type).toBe('image')
    expect(prize!.prize_image_url).toBe(itemImg) // per-item wins over config

    // The drawn non-repeatable item is consumed
    const { data: drawn } = await sr
      .from('list_items')
      .select('checked, checked_by')
      .eq('id', item.id)
      .single()
    expect(drawn!.checked).toBe(true)
    expect(drawn!.checked_by).toBe(jordan)
  })

  // G4: list_reference mode with NO reward_list_id → graceful failed, no crash
  test('1e. list_reference without reward_list_id fails gracefully (G4)', async () => {
    const jordan = await memberId('Jordan')

    const { data: cfg, error: cfgErr } = await sr
      .from('custom_reward_godmother_configs')
      .insert({
        family_id: familyId,
        delivery_mode: 'list_reference',
        reward_list_id: null,
        reward_text: `${PREFIX} broken list config`,
      })
      .select('id')
      .single()
    if (cfgErr) throw new Error(`broken config fixture: ${cfgErr.message}`)

    const result = await fireContract({ configId: cfg.id, memberId: jordan })
    expect(result.status).toBe('failed')
    expect(result.errorMessage).toContain('no reward_list_id configured')
  })

  // G3: deed firing with NO family_member_id → graceful failed, no crash
  test('1f. deed firing without family_member_id fails gracefully (G3)', async () => {
    const result = await fireContract({
      payloadText: `${PREFIX} no member firing`,
      memberId: null,
    })
    expect(result.status).toBe('failed')
    expect(result.errorMessage).toContain('no family_member_id')
  })

  // G8: empty payload_text (and no config) → generated fallback text, still grants
  test('1g. empty payload_text falls back to generated text (G8)', async () => {
    const jordan = await memberId('Jordan')

    const result = await fireContract({ payloadText: null, memberId: jordan })
    expect(result.status, `error: ${result.errorMessage}`).toBe('granted')

    const { data: prize } = await sr
      .from('earned_prizes')
      .select('prize_text, prize_type')
      .eq('id', result.grantRef!)
      .single()
    expect(prize!.prize_text).toMatch(/^Custom reward from contract /)
    expect(prize!.prize_type).toBe('text')
  })

  // ── 2. Both live vocabulary values: 'privilege' AND 'custom' ────────────────
  // task_rewards.reward_type CHECK accepts ('points','money','privilege','custom').
  // Migration 100267 widened the RPC filter to the live values — drive both.
  for (const rewardType of ['privilege', 'custom'] as const) {
    test(`2. award pipe fires for reward_type='${rewardType}'`, async () => {
      const jordan = await memberId('Jordan')
      const desc = `${PREFIX} popsicle via ${rewardType}`
      const taskId = await createRewardTask({
        title: `${PREFIX} ${rewardType} no-approval task`,
        assigneeId: jordan,
        rewardType,
        rewardDescription: desc,
      })
      const completionId = await createCompletion(taskId, jordan)

      // Same call the wired hooks make (useCompleteTask → awardCustomRewardForCompletion)
      const { data, error } = await clients.jordan.rpc('award_custom_reward_for_completion', {
        p_task_completion_id: completionId,
      })
      expect(error).toBeNull()
      expect(data.status).toBe('awarded')
      expect(data.prize_id).toBeTruthy()

      const { data: prize } = await sr
        .from('earned_prizes')
        .select('*')
        .eq('id', data.prize_id)
        .single()
      expect(prize!.family_member_id).toBe(jordan)
      expect(prize!.prize_text).toBe(desc)
      expect(prize!.prize_type).toBe('text')
      expect(prize!.source_type).toBe('task_completion')
      expect(prize!.source_id).toBe(taskId)
      expect(prize!.awarded_completion_id).toBe(completionId)
      expect(prize!.visibility).toBe('family')
    })
  }

  // ── 3. Award timing (Q7) + idempotency ──────────────────────────────────────
  test('3a. require_approval task awards at APPROVAL, not at kid completion-mark', async () => {
    const jordan = await memberId('Jordan')
    const desc = `${PREFIX} late night with friends`
    const taskId = await createRewardTask({
      title: `${PREFIX} approval-required task`,
      assigneeId: jordan,
      rewardType: 'privilege',
      rewardDescription: desc,
      requireApproval: true,
    })

    // Kid marks complete → pending approval → NO award yet
    const completionId = await createCompletion(taskId, jordan, 'pending')
    const { data: early } = await clients.jordan.rpc('award_custom_reward_for_completion', {
      p_task_completion_id: completionId,
    })
    expect(early.status).toBe('skipped_pending_approval')

    const { count: preCount } = await sr
      .from('earned_prizes')
      .select('id', { count: 'exact', head: true })
      .eq('awarded_completion_id', completionId)
    expect(preCount).toBe(0)

    // Mom approves → award fires (same RPC the approval hooks call)
    const sarah = await memberId('Sarah')
    await sr
      .from('task_completions')
      .update({ approval_status: 'approved', approved_by: sarah })
      .eq('id', completionId)

    const { data: atApproval } = await clients.mom.rpc('award_custom_reward_for_completion', {
      p_task_completion_id: completionId,
    })
    expect(atApproval.status).toBe('awarded')

    const { data: prize } = await sr
      .from('earned_prizes')
      .select('prize_text, family_member_id')
      .eq('awarded_completion_id', completionId)
      .single()
    expect(prize!.prize_text).toBe(desc)
    expect(prize!.family_member_id).toBe(jordan)
  })

  test('3b. no-approval task awards instantly; re-fire is idempotent (ONE prize row)', async () => {
    const jordan = await memberId('Jordan')
    const taskId = await createRewardTask({
      title: `${PREFIX} instant-award task`,
      assigneeId: jordan,
      rewardType: 'custom',
      rewardDescription: `${PREFIX} extra screen time`,
    })
    const completionId = await createCompletion(taskId, jordan)

    const { data: first } = await clients.jordan.rpc('award_custom_reward_for_completion', {
      p_task_completion_id: completionId,
    })
    expect(first.status).toBe('awarded')

    // Re-fire on the SAME completion → already_awarded, no second row
    const { data: second } = await clients.jordan.rpc('award_custom_reward_for_completion', {
      p_task_completion_id: completionId,
    })
    expect(second.status).toBe('already_awarded')

    const { count } = await sr
      .from('earned_prizes')
      .select('id', { count: 'exact', head: true })
      .eq('awarded_completion_id', completionId)
    expect(count).toBe(1)
  })

  // ── 4. Kid self-redeem RPC + RLS UPDATE block ───────────────────────────────
  test('4. redeem_own_prize: earner-only redeem, mom notification, direct UPDATE blocked', async () => {
    const jordan = await memberId('Jordan')
    const alex = await memberId('Alex')
    const sarah = await memberId('Sarah')

    const prizeId = await createPrize({ earnerId: jordan, prizeText: `${PREFIX} redeem me` })

    // Another member CANNOT redeem someone else's prize
    const { data: wrongEarner } = await clients.alex.rpc('redeem_own_prize', {
      p_prize_id: prizeId,
    })
    expect(wrongEarner.status).toBe('not_allowed')

    // The earner redeems — succeeds, sets redeemed_at/redeemed_by
    const { data: redeemed, error } = await clients.jordan.rpc('redeem_own_prize', {
      p_prize_id: prizeId,
    })
    expect(error).toBeNull()
    expect(redeemed.status).toBe('redeemed')
    expect(redeemed.redeemed_by).toBe(jordan)

    const { data: row } = await sr
      .from('earned_prizes')
      .select('redeemed_at, redeemed_by')
      .eq('id', prizeId)
      .single()
    expect(row!.redeemed_at).not.toBeNull()
    expect(row!.redeemed_by).toBe(jordan)

    // Quiet mom notification fired
    const { data: notif } = await sr
      .from('notifications')
      .select('recipient_member_id, notification_type, category')
      .eq('family_id', familyId)
      .eq('notification_type', 'prize_redeemed')
      .eq('source_reference_id', prizeId)
      .single()
    expect(notif).toBeTruthy()
    expect(notif!.recipient_member_id).toBe(sarah)
    expect(notif!.category).toBe('gamification')

    // Double-redeem guard
    const { data: again } = await clients.jordan.rpc('redeem_own_prize', {
      p_prize_id: prizeId,
    })
    expect(again.status).toBe('already_redeemed')

    // RLS probe: a kid's DIRECT UPDATE on earned_prizes is blocked (parent-only
    // policy) — the RPC is the only kid path. UPDATE matches zero rows.
    const probeId = await createPrize({ earnerId: jordan, prizeText: `${PREFIX} rls probe` })
    const { data: updated, error: updErr } = await clients.jordan
      .from('earned_prizes')
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: jordan })
      .eq('id', probeId)
      .select('id')
    expect(updErr).toBeNull()
    expect(updated).toHaveLength(0)

    const { data: untouched } = await sr
      .from('earned_prizes')
      .select('redeemed_at')
      .eq('id', probeId)
      .single()
    expect(untouched!.redeemed_at).toBeNull()
  })

  // ── 5. Un-redeem round trip (mom reversal, Q2) ──────────────────────────────
  test('5. mom un-redeems → card active again → kid can redeem again', async () => {
    const jordan = await memberId('Jordan')

    const prizeId = await createPrize({ earnerId: jordan, prizeText: `${PREFIX} round trip` })

    // Kid redeems
    const { data: r1 } = await clients.jordan.rpc('redeem_own_prize', { p_prize_id: prizeId })
    expect(r1.status).toBe('redeemed')

    // Mom un-redeems via the normal UPDATE policy (PrizeBoard Un-redeem)
    const { data: cleared, error: clrErr } = await clients.mom
      .from('earned_prizes')
      .update({ redeemed_at: null, redeemed_by: null })
      .eq('id', prizeId)
      .select('id, redeemed_at, redeemed_by')
    expect(clrErr).toBeNull()
    expect(cleared).toHaveLength(1)
    expect(cleared![0].redeemed_at).toBeNull()
    expect(cleared![0].redeemed_by).toBeNull()

    // Card is active again → kid can redeem again
    const { data: r2 } = await clients.jordan.rpc('redeem_own_prize', { p_prize_id: prizeId })
    expect(r2.status).toBe('redeemed')

    const { data: final } = await sr
      .from('earned_prizes')
      .select('redeemed_at, redeemed_by')
      .eq('id', prizeId)
      .single()
    expect(final!.redeemed_at).not.toBeNull()
    expect(final!.redeemed_by).toBe(jordan)
  })

  // ── 6. Visibility probes — query-layer, never rendered-then-hidden ──────────
  test('6a. private self-reward returns ZERO rows under another member\'s session', async () => {
    const mark = await memberId('Mark')

    const privateId = await createPrize({
      earnerId: mark,
      prizeText: `${PREFIX} dad private treat`,
      visibility: 'private',
      createdBy: mark,
    })

    // Alex (teen, non-mom, not listed) — zero rows at the query layer
    const { data: alexRows, error: aErr } = await clients.alex
      .from('earned_prizes')
      .select('id')
      .eq('id', privateId)
    expect(aErr).toBeNull()
    expect(alexRows).toHaveLength(0)

    // Casey too — zero rows
    const { data: caseyRows } = await clients.casey
      .from('earned_prizes')
      .select('id')
      .eq('id', privateId)
    expect(caseyRows).toHaveLength(0)

    // The earner/creator sees his own
    const { data: dadRows } = await clients.dad
      .from('earned_prizes')
      .select('id')
      .eq('id', privateId)
    expect(dadRows).toHaveLength(1)
  })

  test('6b. shared row reaches ONLY listed members (+ earner/creator)', async () => {
    const mark = await memberId('Mark')
    const alex = await memberId('Alex')

    const sharedId = await createPrize({
      earnerId: mark,
      prizeText: `${PREFIX} dad shared win`,
      visibility: 'shared',
      sharedWith: [alex],
      createdBy: mark,
    })

    // Listed member sees it
    const { data: alexRows } = await clients.alex
      .from('earned_prizes')
      .select('id')
      .eq('id', sharedId)
    expect(alexRows).toHaveLength(1)

    // Unlisted member does not
    const { data: caseyRows } = await clients.casey
      .from('earned_prizes')
      .select('id')
      .eq('id', sharedId)
    expect(caseyRows).toHaveLength(0)
  })

  test('6c. mom sees private rows UNLESS personal_rewards_privacy is granted (both states)', async () => {
    const mark = await memberId('Mark')

    const privateId = await createPrize({
      earnerId: mark,
      prizeText: `${PREFIX} dad privacy-grant probe`,
      visibility: 'private',
      createdBy: mark,
    })

    try {
      // Default (no grant): mom-sees-all includes adults' private self-rewards
      const { data: visibleToMom } = await clients.mom
        .from('earned_prizes')
        .select('id')
        .eq('id', privateId)
      expect(visibleToMom).toHaveLength(1)

      // Mom grants Mark personal rewards privacy → his private rows hidden from mom too
      await setPersonalRewardsPrivacy(mark, true)
      const { data: hiddenFromMom } = await clients.mom
        .from('earned_prizes')
        .select('id')
        .eq('id', privateId)
      expect(hiddenFromMom).toHaveLength(0)

      // Reversible: clearing the grant restores mom's visibility
      await setPersonalRewardsPrivacy(mark, false)
      const { data: visibleAgain } = await clients.mom
        .from('earned_prizes')
        .select('id')
        .eq('id', privateId)
      expect(visibleAgain).toHaveLength(1)
    } finally {
      await setPersonalRewardsPrivacy(mark, false)
    }
  })
})
