// Live production audit — read-only inspection of allowance state for
// Worker ALLOWANCE-COMPLETE Phase 1 audit. Run from worktree.
//   Run: npx tsx tests/verification/_audit_allowance_complete.ts
import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('\n=== LIVE PRODUCTION AUDIT — Worker ALLOWANCE-COMPLETE Phase 1 ===\n')

  const { data: periods } = await sb
    .from('allowance_periods')
    .select('id, family_member_id, period_start, period_end, status, grace_days, total_earned, completion_percentage, calculated_amount')
    .in('status', ['active', 'makeup_window'])
    .order('period_start', { ascending: false })

  console.log(`Active+makeup_window allowance periods: ${periods?.length ?? 0}`)
  for (const p of periods ?? []) {
    const { data: m } = await sb.from('family_members').select('display_name').eq('id', p.family_member_id).maybeSingle()
    const grace = (p.grace_days as string[]) ?? []
    console.log(`  ${m?.display_name ?? p.family_member_id}: ${p.period_start} -> ${p.period_end} | ${p.status} | grace=[${grace.join(', ')}] | %=${p.completion_percentage} | earned=$${p.total_earned}`)
  }

  const { count: txCount } = await sb
    .from('financial_transactions')
    .select('id', { count: 'exact', head: true })
  console.log(`\nTotal financial_transactions rows (all-time): ${txCount}`)

  const { data: txns } = await sb
    .from('financial_transactions')
    .select('id, family_member_id, transaction_type, amount, balance_after, source_type, created_at')
    .order('created_at', { ascending: false })
    .limit(20)
  if ((txCount ?? 0) > 0) {
    console.log('Recent 20 (most-recent first):')
    for (const t of txns ?? []) {
      const { data: m } = await sb.from('family_members').select('display_name').eq('id', t.family_member_id).maybeSingle()
      console.log(`  ${t.created_at?.slice(0,10)} ${m?.display_name ?? t.family_member_id} ${t.transaction_type} $${t.amount} bal_after=$${t.balance_after} src=${t.source_type ?? '-'}`)
    }
  } else {
    console.log('  (zero rows yet)')
  }

  // Per-member balance integrity (sum vs latest balance_after)
  const { data: members } = await sb
    .from('family_members')
    .select('id, display_name, family_id')
    .eq('is_active', true)
    .in('role', ['member'])
  console.log('\nPer-member ledger integrity:')
  for (const m of members ?? []) {
    const { data: rows } = await sb
      .from('financial_transactions')
      .select('amount, balance_after')
      .eq('family_member_id', m.id)
      .order('created_at', { ascending: false })
    const sum = (rows ?? []).reduce((s, r) => s + Number(r.amount), 0)
    const latest = rows?.[0] ? Number(rows[0].balance_after) : 0
    const drift = Math.abs(sum - latest)
    const integrity = drift < 0.01 ? 'OK' : `DRIFT $${drift.toFixed(2)}`
    if ((rows?.length ?? 0) > 0 || latest !== 0) {
      console.log(`  ${m.display_name}: ${rows?.length ?? 0} txns sum=$${sum.toFixed(2)} latest=$${latest.toFixed(2)} [${integrity}]`)
    }
  }

  // Opportunity completions without forward transaction
  const { data: oppTasks } = await sb
    .from('tasks')
    .select('id, title, task_type, family_id, assignee_id')
    .like('task_type', 'opportunity_%')
    .is('archived_at', null)
    .limit(50)
  console.log(`\nOpportunity tasks (live, not archived): ${oppTasks?.length ?? 0}`)
  if (oppTasks?.length) {
    let totalCompletions = 0, withForwardTxn = 0
    for (const t of oppTasks) {
      const { data: cs } = await sb.from('task_completions').select('id').eq('task_id', t.id)
      totalCompletions += cs?.length ?? 0
      for (const c of cs ?? []) {
        const { data: fx } = await sb
          .from('financial_transactions')
          .select('id')
          .eq('source_reference_id', c.id)
          .eq('transaction_type', 'opportunity_earned')
        if ((fx?.length ?? 0) > 0) withForwardTxn++
      }
    }
    console.log(`  Total completions across these tasks: ${totalCompletions}`)
    console.log(`  Completions with opportunity_earned txn: ${withForwardTxn}`)
    console.log(`  Completions WITHOUT forward txn (NEW-NN scope): ${totalCompletions - withForwardTxn}`)
  }

  // Allowance configs
  const { data: cfgs } = await sb
    .from('allowance_configs')
    .select('id, family_member_id, enabled, weekly_amount, calculation_approach, grace_days_enabled, extra_credit_enabled, period_start_day, calculation_time')
    .eq('enabled', true)
  console.log(`\nAllowance-enabled members: ${cfgs?.length ?? 0}`)
  for (const c of cfgs ?? []) {
    const { data: m } = await sb.from('family_members').select('display_name').eq('id', c.family_member_id).maybeSingle()
    console.log(`  ${m?.display_name}: $${c.weekly_amount}/wk, ${c.calculation_approach}, period_start=${c.period_start_day}, calc_time=${c.calculation_time}, grace=${c.grace_days_enabled}, extra=${c.extra_credit_enabled}`)
  }

  // Periods with grace days (any status)
  const { data: graceP } = await sb
    .from('allowance_periods')
    .select('id, family_member_id, period_start, grace_days, status')
    .neq('grace_days', '[]')
    .order('period_start', { ascending: false })
    .limit(20)
  console.log(`\nPeriods with grace days marked (any status): ${graceP?.length ?? 0}`)
  for (const p of graceP ?? []) {
    const { data: m } = await sb.from('family_members').select('display_name').eq('id', p.family_member_id).maybeSingle()
    console.log(`  ${m?.display_name}: period_start=${p.period_start} status=${p.status} grace=${JSON.stringify(p.grace_days)}`)
  }

  // task_rewards row count
  const { count: rewardCount } = await sb
    .from('task_rewards')
    .select('id', { count: 'exact', head: true })
  console.log(`\ntask_rewards rows (any): ${rewardCount}`)

  console.log('\n=== AUDIT COMPLETE ===')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
