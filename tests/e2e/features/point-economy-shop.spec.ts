/**
 * PECON-SHOP — Reward Shop pins (PRD-24 Point Economy Addendum, Worker B,
 * Slice B4, 2026-07-07)
 *
 * Backend/RPC-driven, matching the point-economy-earning.spec.ts (Worker A)
 * and allowance-payment-settlement.spec.ts precedent: these are RPC/ledger-
 * correctness + authorization pins, not UI-flow pins (the Convention #277
 * eyes-on tour separately covers the Shop tab, item editor, Queue card, kid
 * Shop section, and Play picture shelf).
 *
 * Fixtures: PECONSHOP-marked reward_shop_items rows against Testworth's
 * real members (Alex 540 pts / Casey 20 pts / Ruthie 5 pts [Play] / Mark
 * additional_adult / Amy special_adult / Sarah mom) — verified live before
 * writing this spec. Every test captures each touched member's balance
 * before and restores it after; afterAll sweeps every PECONSHOP-marked row
 * by prefix plus a ledger self-heal (SUM(point_transactions)=balance) for
 * every member touched, mirroring point-economy-earning.spec.ts's own
 * afterAll discipline.
 *
 * Family-shadow purchase authorization (ruling: "the purchase RPC accepts
 * ... a family-shadow session") is NOT re-derived here as a live Playwright
 * session — the rls-verifier pass on migration 100302 already live-proved
 * every role including family-shadow sessions for both families (see
 * RLS-VERIFICATION.md, "Migration 100302 — PECON-SHOP"). This spec adds a
 * lightweight static tripwire (item 12 below) so a future refactor that
 * drops the `util.is_family_shadow_of` branch from purchase_reward_shop_item
 * fails loudly instead of silently regressing.
 */
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { TEST_USERS } from '../helpers/seed-testworths-complete'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!

const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const MARKER = 'PECONSHOP'

let familyId = ''
let sarahId = ''
let alexId = ''
let caseyId = ''
let ruthieId = ''
let markId = ''
let amyId = ''

async function clientFor(user: { email: string; password: string }): Promise<SupabaseClient> {
  const client = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password })
  if (error) throw new Error(`signIn failed for ${user.email}: ${error.message}`)
  return client
}

async function balanceOf(memberId: string): Promise<number> {
  const { data, error } = await admin.from('family_members').select('gamification_points').eq('id', memberId).single()
  if (error) throw error
  return (data?.gamification_points as number) ?? 0
}

async function createItem(opts: {
  name: string
  pointCost: number
  requiresApproval?: boolean
  audienceMemberIds?: string[]
  limitPerMember?: number | null
  limitPeriod?: 'day' | 'week' | 'month' | null
  unlockRule?: { type: 'completion_pct'; threshold: number; window: 'week' } | null
}) {
  const { data, error } = await admin
    .from('reward_shop_items')
    .insert({
      family_id: familyId,
      created_by: sarahId,
      name: `${MARKER} ${opts.name}`,
      point_cost: opts.pointCost,
      requires_approval: opts.requiresApproval ?? false,
      audience_member_ids: opts.audienceMemberIds ?? [],
      limit_per_member: opts.limitPerMember ?? null,
      limit_period: opts.limitPeriod ?? null,
      unlock_rule: opts.unlockRule ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** DATE-only string for a UTC instant N days ago (Postgres session timezone
 *  on Supabase is UTC, so this matches the DB's own reference frame — the
 *  same reasoning as point-economy-earning.spec.ts's dbToday() helper).
 *  Deliberately uses getUTC* accessors, never the banned ISO-string
 *  date-slicing chain (Convention #257 lint rule). */
function utcDaysAgoDateOnly(days: number): string {
  const d = new Date(Date.now() - days * 86400000)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function deleteItem(itemId: string) {
  await admin.from('reward_shop_purchases').delete().eq('store_item_id', itemId)
  await admin.from('reward_shop_items').delete().eq('id', itemId)
}

test.beforeAll(async () => {
  const { data: family } = await admin
    .from('families')
    .select('id')
    .eq('family_login_name_lower', 'testworthfamily')
    .single()
  if (!family) throw new Error('Testworth family not found')
  familyId = family.id

  const byName = async (name: string) => {
    const { data } = await admin.from('family_members').select('id').eq('family_id', familyId).eq('display_name', name).single()
    return data!.id as string
  }
  sarahId = await byName('Sarah')
  alexId = await byName('Alex')
  caseyId = await byName('Casey')
  ruthieId = await byName('Ruthie')
  markId = await byName('Mark')
  amyId = await byName('Amy')
})

test.afterAll(async () => {
  const { data: items } = await admin.from('reward_shop_items').select('id').eq('family_id', familyId).ilike('name', `${MARKER}%`)
  const itemIds = (items ?? []).map((i) => i.id)
  if (itemIds.length) {
    await admin.from('reward_shop_purchases').delete().in('store_item_id', itemIds)
    await admin.from('reward_shop_items').delete().in('id', itemIds)
  }
  // Belt-and-suspenders: any purchase row whose snapshot name carries the
  // marker even if its item was already deleted mid-test.
  await admin.from('reward_shop_purchases').delete().ilike('item_name', `${MARKER}%`)
  await admin.from('earned_prizes').delete().eq('source_type', 'store_purchase').ilike('prize_name', `${MARKER}%`)
  await admin.from('point_transactions').delete().in('source_type', ['store_purchase', 'store_refund']).ilike('description', `%${MARKER}%`)
  await admin.from('notifications').delete().eq('source_type', 'reward_shop_purchase').ilike('body', `%${MARKER}%`)
  // Also catch notifications whose body doesn't carry the marker (auto-approve
  // path's body is just "N points spent") by title, which always does.
  await admin.from('notifications').delete().ilike('title', `%${MARKER}%`)

  // The unlock-gate test seeds plain tasks (title-marked) for the completion-
  // percentage math — sweep those too (a mid-test failure would otherwise
  // leave them dangling and permanently skew future runs' baseline math).
  const { data: gateTasks } = await admin.from('tasks').select('id').eq('family_id', familyId).ilike('title', `${MARKER}%`)
  const gateTaskIds = (gateTasks ?? []).map((t) => t.id)
  if (gateTaskIds.length) {
    await admin.from('point_transactions').delete().in('source_id', gateTaskIds)
    await admin.from('tasks').delete().in('id', gateTaskIds)
  }

  // Ledger self-heal for every member this spec touches, mirroring the
  // point-economy-earning.spec.ts afterAll discipline.
  for (const mid of [alexId, caseyId, ruthieId]) {
    const { data: rows } = await admin.from('point_transactions').select('amount').eq('family_member_id', mid)
    const reconciled = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0)
    await admin.from('family_members').update({ gamification_points: reconciled }).eq('id', mid)
  }

  const { count } = await admin.from('reward_shop_items').select('id', { count: 'exact', head: true }).eq('family_id', familyId).ilike('name', `${MARKER}%`)
  expect(count ?? 0).toBe(0)
  const { count: taskCount } = await admin.from('tasks').select('id', { count: 'exact', head: true }).eq('family_id', familyId).ilike('title', `${MARKER}%`)
  expect(taskCount ?? 0).toBe(0)
})

test.describe('Reward Shop — purchase lifecycle', () => {
  test('auto-approve purchase: spend txn + earned_prizes + quiet mom notification, balance math exact', async () => {
    const item = await createItem({ name: 'auto item', pointCost: 15 })
    const before = await balanceOf(alexId)

    const { data, error } = await admin.rpc('purchase_reward_shop_item', {
      p_item_id: item.id, p_member_id: alexId, p_acted_by: null,
    })
    expect(error).toBeNull()
    const result = data as { status: string; purchase_id: string; balance_after: number }
    expect(result.status).toBe('auto_approved')
    expect(result.balance_after).toBe(before - 15)
    expect(await balanceOf(alexId)).toBe(before - 15)

    const { data: txn } = await admin.from('point_transactions').select('amount, transaction_type, source_type').eq('source_id', item.id).eq('family_member_id', alexId).single()
    expect(txn?.amount).toBe(-15)
    expect(txn?.transaction_type).toBe('spend')
    expect(txn?.source_type).toBe('store_purchase')

    const { data: purchase } = await admin.from('reward_shop_purchases').select('*').eq('id', result.purchase_id).single()
    expect(purchase?.status).toBe('auto_approved')
    expect(purchase?.earned_prize_id).toBeTruthy()

    const { data: prize } = await admin.from('earned_prizes').select('source_type, source_id, family_member_id, visibility').eq('id', purchase!.earned_prize_id).single()
    expect(prize?.source_type).toBe('store_purchase')
    expect(prize?.source_id).toBe(result.purchase_id)
    expect(prize?.family_member_id).toBe(alexId)
    expect(prize?.visibility).toBe('family')

    const { data: notif } = await admin.from('notifications').select('recipient_member_id, category').eq('source_reference_id', result.purchase_id).eq('notification_type', 'store_purchase_auto').maybeSingle()
    expect(notif?.recipient_member_id).toBe(sarahId)
    expect(notif?.category).toBe('gamification')

    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('earned_prizes').delete().eq('id', purchase!.earned_prize_id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('approval-required purchase → pending + points held; mom approve → prize + kid notification', async () => {
    const item = await createItem({ name: 'approval item', pointCost: 8, requiresApproval: true })
    const before = await balanceOf(alexId)

    const purchase1 = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: alexId, p_acted_by: null })
    const r1 = purchase1.data as { status: string; purchase_id: string }
    expect(r1.status).toBe('pending')
    expect(await balanceOf(alexId)).toBe(before - 8) // held immediately, not at approval

    const { data: pendingRow } = await admin.from('reward_shop_purchases').select('status, earned_prize_id').eq('id', r1.purchase_id).single()
    expect(pendingRow?.status).toBe('pending')
    expect(pendingRow?.earned_prize_id).toBeNull()

    const resolve = await admin.rpc('resolve_reward_shop_purchase', {
      p_purchase_id: r1.purchase_id, p_action: 'approve', p_decline_note: null, p_processed_by: sarahId,
    })
    expect(resolve.error).toBeNull()
    const rr = resolve.data as { status: string; prize_id: string }
    expect(rr.status).toBe('approved')

    const { data: approvedRow } = await admin.from('reward_shop_purchases').select('status, earned_prize_id').eq('id', r1.purchase_id).single()
    expect(approvedRow?.status).toBe('approved')
    expect(approvedRow?.earned_prize_id).toBe(rr.prize_id)
    expect(await balanceOf(alexId)).toBe(before - 8) // unchanged by approval — already deducted

    const { data: notif } = await admin.from('notifications').select('recipient_member_id').eq('source_reference_id', r1.purchase_id).eq('notification_type', 'store_purchase_approved').maybeSingle()
    expect(notif?.recipient_member_id).toBe(alexId)

    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('earned_prizes').delete().eq('id', rr.prize_id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', alexId)
  })

  test('mom decline → refund transaction + no prize + kid notification', async () => {
    const item = await createItem({ name: 'decline item', pointCost: 6, requiresApproval: true })
    const before = await balanceOf(caseyId)

    const purchase = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null })
    const pr = purchase.data as { purchase_id: string }
    expect(await balanceOf(caseyId)).toBe(before - 6)

    const resolve = await admin.rpc('resolve_reward_shop_purchase', {
      p_purchase_id: pr.purchase_id, p_action: 'decline', p_decline_note: 'Not this week', p_processed_by: sarahId,
    })
    expect(resolve.error).toBeNull()
    expect((resolve.data as { status: string }).status).toBe('declined')

    expect(await balanceOf(caseyId)).toBe(before) // fully refunded

    const { data: declinedRow } = await admin.from('reward_shop_purchases').select('status, earned_prize_id, decline_note, refund_transaction_id').eq('id', pr.purchase_id).single()
    expect(declinedRow?.status).toBe('declined')
    expect(declinedRow?.earned_prize_id).toBeNull()
    expect(declinedRow?.decline_note).toBe('Not this week')
    expect(declinedRow?.refund_transaction_id).toBeTruthy()

    const { count: prizeCount } = await admin.from('earned_prizes').select('id', { count: 'exact', head: true }).eq('source_id', pr.purchase_id)
    expect(prizeCount ?? 0).toBe(0)

    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', caseyId)
  })

  test('kid cancel → refund ("Take it back")', async () => {
    const item = await createItem({ name: 'cancel item', pointCost: 4, requiresApproval: true })
    const before = await balanceOf(caseyId)

    const purchase = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null })
    const pr = purchase.data as { purchase_id: string }
    expect(await balanceOf(caseyId)).toBe(before - 4)

    const caseyClient = await clientFor(TEST_USERS.casey)
    const cancel = await caseyClient.rpc('cancel_reward_shop_purchase', { p_purchase_id: pr.purchase_id })
    expect(cancel.error).toBeNull()
    expect((cancel.data as { status: string }).status).toBe('cancelled')
    expect(await balanceOf(caseyId)).toBe(before)

    const { data: cancelledRow } = await admin.from('reward_shop_purchases').select('status, refund_transaction_id').eq('id', pr.purchase_id).single()
    expect(cancelledRow?.status).toBe('cancelled')
    expect(cancelledRow?.refund_transaction_id).toBeTruthy()

    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', caseyId)
  })
})

test.describe('Reward Shop — validation & fairness', () => {
  test('race probe: two concurrent purchases against a balance covering only one → exactly one succeeds', async () => {
    const item = await createItem({ name: 'race item', pointCost: 10 })
    const before = await balanceOf(caseyId)
    // Set Casey's balance to exactly one item's cost — the second concurrent
    // purchase MUST fail with insufficient_balance, never double-spend.
    await admin.from('family_members').update({ gamification_points: 10 }).eq('id', caseyId)

    const [r1, r2] = await Promise.all([
      admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null }),
      admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null }),
    ])
    const statuses = [r1.data as { status: string }, r2.data as { status: string }].map((r) => r.status)
    expect(statuses.filter((s) => s === 'auto_approved').length).toBe(1)
    expect(statuses.filter((s) => s === 'insufficient_balance').length).toBe(1)
    expect(await balanceOf(caseyId)).toBe(0) // exactly one deduction landed

    const { data: purchases } = await admin.from('reward_shop_purchases').select('id, earned_prize_id').eq('store_item_id', item.id).eq('family_member_id', caseyId)
    expect(purchases?.length).toBe(1) // only the winner wrote a row

    await admin.from('earned_prizes').delete().in('id', (purchases ?? []).map((p) => p.earned_prize_id).filter(Boolean) as string[])
    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', caseyId)
  })

  test('audience scoping: an item outside a kid\'s audience is invisible via RLS and rejected by the purchase RPC', async () => {
    const item = await createItem({ name: 'alex-only item', pointCost: 5, audienceMemberIds: [alexId] })
    const caseyBefore = await balanceOf(caseyId)

    // RLS: Casey's own authenticated session cannot even SELECT this row.
    const caseyClient = await clientFor(TEST_USERS.casey)
    const { data: caseySees } = await caseyClient.from('reward_shop_items').select('id').eq('id', item.id)
    expect(caseySees?.length ?? 0).toBe(0)

    // RPC: a direct call (bypassing the UI) is still rejected — no deduction.
    const attempt = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null })
    expect(attempt.error).toBeNull()
    expect((attempt.data as { status: string }).status).toBe('not_in_audience')
    expect(await balanceOf(caseyId)).toBe(caseyBefore)

    // Alex, who IS in the audience, can see and buy it.
    const alexClient = await clientFor(TEST_USERS.alex)
    const { data: alexSees } = await alexClient.from('reward_shop_items').select('id').eq('id', item.id)
    expect(alexSees?.length).toBe(1)

    await deleteItem(item.id)
  })

  test('purchase limit window: caps at N per period, freed by decline', async () => {
    const item = await createItem({ name: 'limited item', pointCost: 3, requiresApproval: true, limitPerMember: 1, limitPeriod: 'day' })
    const before = await balanceOf(caseyId)

    const first = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null })
    const fr = first.data as { status: string; purchase_id: string }
    expect(fr.status).toBe('pending')

    const second = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null })
    expect((second.data as { status: string }).status).toBe('limit_reached')

    // Decline the pending purchase — the slot frees up (addendum §10 edge case).
    await admin.rpc('resolve_reward_shop_purchase', { p_purchase_id: fr.purchase_id, p_action: 'decline', p_decline_note: null, p_processed_by: sarahId })
    const third = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null })
    const tr = third.data as { status: string; purchase_id: string }
    expect(tr.status).toBe('pending')

    await admin.rpc('resolve_reward_shop_purchase', { p_purchase_id: tr.purchase_id, p_action: 'decline', p_decline_note: null, p_processed_by: sarahId })
    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', caseyId)
  })

  test('unlock gate: below threshold blocked at the RPC (with progress in the response), above threshold purchasable', async () => {
    // member_completion_percentage weights ANY task whose created_at
    // predates the 7-day window at FULL weight 1.0 (its effective_start
    // clamps to period_start, effective_end=period_end — same "documented
    // #271 grandfathered blend" calculate_allowance_progress uses). Ruthie
    // is a REAL fixture member with her own ambient production tasks, so a
    // naive "5 fresh tasks, 2 completed" assumption is NOT reliable — her
    // pre-existing completed tasks (also full-weight) can dominate the
    // ratio regardless of what this test adds (confirmed live: a first
    // draft of this test assumed isolation and got 88% instead of the
    // expected ~40%). Fix: MEASURE her real non-routine baseline first
    // (tasks predating the window, so they're the same full-weight class),
    // then add a large backdated batch sized to dominate that baseline
    // deterministically in both directions.
    const item = await createItem({ name: 'gated item', pointCost: 1, unlockRule: { type: 'completion_pct', threshold: 80, window: 'week' } })
    const before = await balanceOf(ruthieId)

    const periodStart = utcDaysAgoDateOnly(6)
    const wellBeforeWindow = new Date(Date.now() - 30 * 86400000).toISOString()

    const { data: existingTasks } = await admin
      .from('tasks')
      .select('id, status, task_type')
      .eq('assignee_id', ruthieId)
      .is('archived_at', null)
      .lte('created_at', periodStart)
    const nonRoutineExisting = (existingTasks ?? []).filter((t) => t.task_type !== 'routine')
    const baseAssigned = nonRoutineExisting.length
    const baseCompleted = nonRoutineExisting.filter((t) => t.status === 'completed').length

    // A batch large enough to dominate any plausible baseline for this
    // small fixture family, all backdated so every one gets full weight.
    const BATCH = 40
    const taskIds: string[] = []
    for (let i = 0; i < BATCH; i++) {
      const { data: t } = await admin.from('tasks').insert({
        family_id: familyId, created_by: sarahId, assignee_id: ruthieId,
        title: `${MARKER} gate task ${i}`, task_type: 'task', status: 'pending',
        counts_for_gamification: true, created_at: wellBeforeWindow,
      }).select('id').single()
      taskIds.push(t!.id)
    }

    // Sanity-check the test's own math BEFORE asserting on the RPC — if this
    // fails, the batch size (not the product) needs adjusting, not the gate.
    const expectedBelowPct = (baseCompleted / (baseAssigned + BATCH)) * 100
    expect(expectedBelowPct).toBeLessThan(80)

    const belowAttempt = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: ruthieId, p_acted_by: null })
    expect(belowAttempt.error).toBeNull()
    const belowResult = belowAttempt.data as { status: string; completion_percentage: number; threshold: number }
    expect(belowResult.status).toBe('gate_not_met')
    expect(belowResult.completion_percentage).toBeLessThan(80)
    expect(belowResult.threshold).toBe(80)
    expect(await balanceOf(ruthieId)).toBe(before) // no deduction on a blocked gate

    // Complete just enough of the new batch to comfortably clear 80%.
    const k = Math.min(BATCH, Math.max(0, Math.ceil(0.8 * (baseAssigned + BATCH) - baseCompleted) + 2))
    await admin.from('tasks').update({ status: 'completed' }).in('id', taskIds.slice(0, k))

    const aboveAttempt = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: ruthieId, p_acted_by: null })
    const aboveResult = aboveAttempt.data as { status: string; purchase_id: string }
    // Ruthie is Play (dashboard_mode='play') — every purchase pends
    // regardless of the item's requires_approval flag (Play-always-approval
    // rule, separately pinned in the "Play shell" describe block). The
    // meaningful assertion here is that the gate no longer BLOCKS the
    // purchase — 'pending' (not 'gate_not_met') proves the gate passed.
    expect(aboveResult.status).toBe('pending')
    expect(aboveResult.purchase_id).toBeTruthy()

    await admin.rpc('resolve_reward_shop_purchase', { p_purchase_id: aboveResult.purchase_id, p_action: 'decline', p_decline_note: null, p_processed_by: sarahId })
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('tasks').delete().in('id', taskIds)
    await deleteItem(item.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', ruthieId)
  })

  test('0-assigned = ungated (allowance parity) — a member with zero assigned tasks always passes the gate', async () => {
    const { data: family } = await admin.from('families').select('id').eq('family_login_name_lower', 'testworthfamily').single()
    const { data: kylie } = await admin.from('family_members').select('id').eq('family_id', family!.id).eq('display_name', 'Kylie').single()
    const kylieId = kylie!.id
    const { count: existingTaskCount } = await admin.from('tasks').select('id', { count: 'exact', head: true }).eq('assignee_id', kylieId)
    expect(existingTaskCount ?? 0).toBe(0) // confirms the isolation this test relies on

    const item = await createItem({ name: '0-assigned gated item', pointCost: 1, unlockRule: { type: 'completion_pct', threshold: 80, window: 'week' } })
    await admin.from('family_members').update({ gamification_points: 5 }).eq('id', kylieId)

    const attempt = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: kylieId, p_acted_by: null })
    expect(attempt.error).toBeNull()
    expect((attempt.data as { status: string }).status).toBe('auto_approved') // 0/0=100%, ungated

    const purchaseId = (attempt.data as { purchase_id: string }).purchase_id
    await admin.from('reward_shop_purchases').delete().eq('id', purchaseId)
    await admin.from('earned_prizes').delete().eq('source_id', purchaseId)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await deleteItem(item.id)
    await admin.from('family_members').update({ gamification_points: 0 }).eq('id', kylieId)
  })
})

test.describe('Reward Shop — Play shell', () => {
  test('Play member: every purchase pends regardless of the item\'s requires_approval flag', async () => {
    const item = await createItem({ name: 'play item', pointCost: 2, requiresApproval: false })
    const before = await balanceOf(ruthieId)

    const purchase = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: ruthieId, p_acted_by: null })
    expect(purchase.error).toBeNull()
    const pr = purchase.data as { status: string; purchase_id: string }
    // requires_approval=false, yet Ruthie (dashboard_mode='play') still pends.
    expect(pr.status).toBe('pending')
    expect(await balanceOf(ruthieId)).toBe(before - 2)

    await admin.rpc('resolve_reward_shop_purchase', { p_purchase_id: pr.purchase_id, p_action: 'decline', p_decline_note: null, p_processed_by: sarahId })
    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
    await admin.from('family_members').update({ gamification_points: before }).eq('id', ruthieId)
  })
})

test.describe('Reward Shop — RLS + authorization pins', () => {
  test('kid cannot write reward_shop_items directly', async () => {
    const caseyClient = await clientFor(TEST_USERS.casey)
    const insertAttempt = await caseyClient.from('reward_shop_items').insert({
      family_id: familyId, created_by: caseyId, name: `${MARKER} kid-inserted`, point_cost: 1,
    })
    expect(insertAttempt.error).toBeTruthy()
  })

  test('kid cannot write reward_shop_purchases directly (no client write path — RPCs only)', async () => {
    const item = await createItem({ name: 'no-direct-write item', pointCost: 1 })
    const caseyClient = await clientFor(TEST_USERS.casey)
    const insertAttempt = await caseyClient.from('reward_shop_purchases').insert({
      family_id: familyId, store_item_id: item.id, family_member_id: caseyId,
      item_name: 'forged', points_cost: 0, status: 'auto_approved',
    })
    expect(insertAttempt.error).toBeTruthy()
    await deleteItem(item.id)
  })

  test('cannot purchase on a member belonging to a different family (family-match guard, evaluated even for service-role callers)', async () => {
    const item = await createItem({ name: 'cross-family item', pointCost: 1 })
    const { data: otherFamilyMember } = await admin
      .from('family_members')
      .select('id')
      .neq('family_id', familyId)
      .limit(1)
      .single()
    expect(otherFamilyMember).toBeTruthy()

    // The item belongs to Testworth; this member belongs to a different
    // family. The RPC's family-match guard runs BEFORE the auth-role branch,
    // so even a service-role caller is rejected here.
    const mismatch = await admin.rpc('purchase_reward_shop_item', {
      p_item_id: item.id, p_member_id: otherFamilyMember!.id, p_acted_by: null,
    })
    expect(mismatch.error).toBeTruthy()
    expect(mismatch.error?.message ?? '').toMatch(/not authorized/i)

    await deleteItem(item.id)
  })

  test('an unauthenticated caller cannot resolve or cancel a purchase (100298/100300 class)', async () => {
    const item = await createItem({ name: 'anon-probe item', pointCost: 1 })
    const purchase = await admin.rpc('purchase_reward_shop_item', { p_item_id: item.id, p_member_id: caseyId, p_acted_by: null })
    const pr = purchase.data as { purchase_id: string }

    // A truly-anonymous (anon-key, no JWT) caller is rejected at the
    // Postgres GRANT level before the function body ever runs — the 100304
    // hardening migration REVOKEd anon EXECUTE on both functions entirely,
    // so this is a "permission denied for function" error, not the
    // function's own internal "Not authorized" RAISE (that message is for
    // an AUTHENTICATED caller who fails the in-body family-membership
    // check — see the cross-family test above). Both are valid rejections
    // of the same class of caller; mirrors the assertion shape Worker A's
    // point-economy-earning.spec.ts uses for record_point_transaction/
    // execute_points_godmother against this exact anon-key scenario.
    const anonClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const anonResolve = await anonClient.rpc('resolve_reward_shop_purchase', {
      p_purchase_id: pr.purchase_id, p_action: 'approve', p_decline_note: null, p_processed_by: null,
    })
    expect(anonResolve.error).toBeTruthy()
    expect(anonResolve.error?.message ?? '').toMatch(/permission denied|not authorized/i)

    const anonCancel = await anonClient.rpc('cancel_reward_shop_purchase', { p_purchase_id: pr.purchase_id })
    expect(anonCancel.error).toBeTruthy()
    expect(anonCancel.error?.message ?? '').toMatch(/permission denied|not authorized/i)

    await admin.rpc('resolve_reward_shop_purchase', { p_purchase_id: pr.purchase_id, p_action: 'decline', p_decline_note: null, p_processed_by: sarahId })
    await deleteItem(item.id)
    await admin.from('point_transactions').delete().eq('source_id', item.id)
  })

  test('reward_rules grant is required to reach Shop management — mom always can, ungranted Mark cannot write items', async () => {
    // Confirm Mark has no reward_rules grant by default in this fixture.
    const { data: existingGrant } = await admin.from('member_permissions').select('id').eq('family_id', familyId).eq('granted_to', markId).eq('permission_key', 'reward_rules').is('target_member_id', null).maybeSingle()
    expect(existingGrant).toBeNull()

    const markClient = await clientFor(TEST_USERS.mark)
    const attempt = await markClient.from('reward_shop_items').insert({
      family_id: familyId, created_by: markId, name: `${MARKER} mark-inserted`, point_cost: 1,
    })
    expect(attempt.error).toBeTruthy()

    // Grant reward_rules to Mark — he can now manage the catalog.
    const { data: grantRow } = await admin.from('member_permissions').insert({
      family_id: familyId, granting_member_id: sarahId, granted_to: markId, target_member_id: null,
      permission_key: 'reward_rules', access_level: 'manage',
    }).select('id').single()

    const grantedInsert = await markClient.from('reward_shop_items').insert({
      family_id: familyId, created_by: markId, name: `${MARKER} mark item`, point_cost: 5,
    }).select('id').single()
    expect(grantedInsert.error).toBeNull()

    if (grantedInsert.data?.id) await deleteItem(grantedInsert.data.id)
    await admin.from('member_permissions').delete().eq('id', grantRow!.id)
  })

  test('purchase_reward_shop_item still consults util.is_family_shadow_of (static tripwire — live family-shadow paths already verified by rls-verifier on migration 100302)', async () => {
    const migrationSql = readFileSync('supabase/migrations/00000000100302_reward_shop.sql', 'utf-8')
    expect(migrationSql).toContain('util.is_family_shadow_of(v_family_id)')
  })
})
