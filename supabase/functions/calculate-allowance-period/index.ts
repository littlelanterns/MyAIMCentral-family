/**
 * calculate-allowance-period — PRD-28 Multi-Pool Allowance Period Calculation
 *
 * Called by pg_cron via util.invoke_edge_function. Runs hourly at :10.
 * For each family, checks whether any child has expired allowance periods
 * across any pool. Processes per-pool independently, then computes the
 * weighted combination for the combined payout.
 *
 * Phase 3.5 multi-pool changes:
 *   - Each kid can have N pools with independent configs and periods
 *   - Each pool closes independently on its own schedule
 *   - Combined payout = sum of individual pool payouts (non-measurement-only)
 *   - Combined percentage = weighted average across pools (informational)
 *   - Cross-pool penalty/multiplier contracts evaluated at period close
 *   - Per-pool pool_contribution informational transactions for the ledger
 *   - Measurement-only pools close (record %) but write NO financial transaction
 *   - Backward compatible: single "default" pool behaves identically to pre-multi-pool
 *
 * Auth: service role only.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProcessingStats {
  families_checked: number
  families_at_midnight: number
  periods_processed: number
  periods_closed: number
  periods_opened: number
  transactions_created: number
  pool_contributions_created: number
  loan_repayments: number
  cross_pool_adjustments: number
  errors: string[]
}

interface PoolCloseResult {
  poolName: string
  periodId: string
  configId: string
  completionPct: number
  totalEarned: number
  bonusApplied: boolean
  bonusAmount: number
  calculatedAmount: number
  payoutMode: string
  poolWeight: number
  weeklyAmount: number
  isMeasurementOnly: boolean
  calculationDetails: Record<string, unknown>
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(serviceRoleKey)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const stats: ProcessingStats = {
    families_checked: 0,
    families_at_midnight: 0,
    periods_processed: 0,
    periods_closed: 0,
    periods_opened: 0,
    transactions_created: 0,
    pool_contributions_created: 0,
    loan_repayments: 0,
    cross_pool_adjustments: 0,
    errors: [],
  }

  try {
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, timezone')
    if (familiesError) throw familiesError
    if (!families?.length) {
      return jsonResponse(stats)
    }

    stats.families_checked = families.length
    const now = new Date()

    for (const family of families) {
      const timezone = family.timezone || 'America/Chicago'
      let currentLocalHour: number
      let currentLocalMinute: number
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: timezone,
        }).formatToParts(now)
        currentLocalHour = parseInt(parts.find(p => p.type === 'hour')!.value)
        currentLocalMinute = parseInt(parts.find(p => p.type === 'minute')!.value)
      } catch {
        continue
      }
      const currentMinutesOfDay = currentLocalHour * 60 + currentLocalMinute

      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      }).format(now)

      stats.families_at_midnight++

      // Load active periods that have ended (across all pools)
      const { data: periods, error: periodsError } = await supabase
        .from('allowance_periods')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'active')
        .lt('period_end', localDateStr)

      if (periodsError) {
        stats.errors.push(`periods load: ${periodsError.message}`)
        continue
      }
      if (!periods?.length) {
        await processMakeupWindows(supabase, family.id, localDateStr, now)
        continue
      }

      // Group periods by family_member_id
      const periodsByMember = new Map<string, typeof periods>()
      for (const period of periods) {
        const memberId = period.family_member_id as string
        if (!periodsByMember.has(memberId)) {
          periodsByMember.set(memberId, [])
        }
        periodsByMember.get(memberId)!.push(period)
      }

      // Process each member's pools
      for (const [memberId, memberPeriods] of periodsByMember) {
        try {
          // Load ALL pool configs for this member (active + enabled)
          const { data: configs } = await supabase
            .from('allowance_configs')
            .select('*')
            .eq('family_member_id', memberId)
            .eq('pool_status', 'active')
            .eq('enabled', true)

          if (!configs?.length) continue

          const poolResults: PoolCloseResult[] = []

          // Process each pool independently
          for (const period of memberPeriods) {
            stats.periods_processed++

            const poolName = (period.pool_name as string) ?? 'default'
            const config = configs.find(
              // deno-lint-ignore no-explicit-any
              (c: any) => c.pool_name === poolName,
            )

            if (!config) {
              stats.errors.push(`period ${period.id}: no matching config for pool '${poolName}'`)
              continue
            }

            // Check calculation_time window per config
            if (!isInCalcTimeWindow(config.calculation_time, currentMinutesOfDay)) {
              continue
            }

            // Check payout_mode readiness
            const payoutMode = (config.payout_mode as string) ?? 'weekly'

            if (payoutMode === 'event_driven') {
              // Event-driven pools don't close on time
              continue
            }

            if (payoutMode === 'term') {
              const termEnd = config.term_end_date as string | null
              if (termEnd && localDateStr <= termEnd) {
                continue
              }
            }

            // Handle makeup window
            if (config.makeup_window_enabled) {
              const windowEnd = addDays(period.period_end, config.makeup_window_days ?? 2)
              if (localDateStr <= windowEnd) {
                if (period.status === 'active') {
                  await supabase
                    .from('allowance_periods')
                    .update({ status: 'makeup_window' })
                    .eq('id', period.id)
                }
                continue
              }
            }

            // Call per-pool RPC
            // deno-lint-ignore no-explicit-any
            const gracePayload: any[] = Array.isArray(period.grace_days)
              ? (period.grace_days as unknown[])
              : []
            const { data: progressRows, error: progressError } = await supabase
              .rpc('calculate_allowance_progress', {
                p_member_id: memberId,
                p_period_start: period.period_start,
                p_period_end: period.period_end,
                p_grace_days: gracePayload.length > 0 ? gracePayload : null,
                p_pool_name: poolName,
              })

            if (progressError || !progressRows?.[0]) {
              stats.errors.push(
                `period ${period.id} pool '${poolName}': progress rpc failed — ${progressError?.message ?? 'empty result'}`,
              )
              continue
            }

            const progress = progressRows[0]

            // Count raw task rows for total_tasks_assigned display
            const totalTasksAssignedCount = await countAssignedTasks(
              supabase,
              family.id,
              memberId,
              period.period_start,
              period.period_end,
              config.id,
              poolName,
            )

            const completionPct = Number(progress.completion_percentage)
            const calculatedAmount = Number(progress.calculated_amount)
            const bonusApplied = Boolean(progress.bonus_applied)
            const bonusAmount = Number(progress.bonus_amount)
            const totalEarned = Number(progress.total_earned)
            const effectiveAssigned = Math.round(Number(progress.effective_tasks_assigned))
            const effectiveCompleted = Math.round(Number(progress.effective_tasks_completed))
            const extraCreditCompleted = Math.round(Number(progress.extra_credit_completed ?? 0))
            const extraCreditWeightAdded = Number(progress.extra_credit_weight_added ?? 0)
            const graceDays: unknown[] = Array.isArray(period.grace_days)
              ? (period.grace_days as unknown[])
              : []

            // Grace-day exclusion audit tally
            let graceDayTasksExcluded = 0
            if (graceDays.length > 0) {
              const { data: noGraceRows } = await supabase
                .rpc('calculate_allowance_progress', {
                  p_member_id: memberId,
                  p_period_start: period.period_start,
                  p_period_end: period.period_end,
                  p_grace_days: null,
                  p_pool_name: poolName,
                })
              const noGrace = noGraceRows?.[0]
              if (noGrace) {
                const noGraceAssigned = Math.round(Number(noGrace.effective_tasks_assigned))
                graceDayTasksExcluded = Math.max(0, noGraceAssigned - effectiveAssigned)
              }
            }

            // Close the period
            const calculationDetails = {
              approach: progress.calculation_approach,
              total_points: Number(progress.total_points),
              completed_points: Number(progress.completed_points),
              grace_days: graceDays,
              minimum_threshold: Number(progress.minimum_threshold),
              bonus_threshold: Number(progress.bonus_threshold),
              extra_credit_completed: extraCreditCompleted,
              extra_credit_weight_added: extraCreditWeightAdded,
              numerator_boost_total: Number(progress.numerator_boost_total ?? 0),
              pool_name: poolName,
              rpc: 'calculate_allowance_progress',
            }

            await supabase
              .from('allowance_periods')
              .update({
                status: 'calculated',
                total_tasks_assigned: totalTasksAssignedCount ?? 0,
                grace_day_tasks_excluded: graceDayTasksExcluded,
                effective_tasks_assigned: effectiveAssigned,
                tasks_completed: Math.max(0, effectiveCompleted - extraCreditCompleted),
                extra_credit_completed: extraCreditCompleted,
                effective_tasks_completed: effectiveCompleted,
                completion_percentage: completionPct,
                calculated_amount: calculatedAmount,
                bonus_applied: bonusApplied,
                bonus_amount: bonusAmount,
                total_earned: totalEarned,
                calculation_details: calculationDetails,
                calculated_at: now.toISOString(),
                closed_at: now.toISOString(),
              })
              .eq('id', period.id)

            stats.periods_closed++

            const isMeasurementOnly = payoutMode === 'measurement_only'

            poolResults.push({
              poolName,
              periodId: period.id,
              configId: config.id,
              completionPct,
              totalEarned,
              bonusApplied,
              bonusAmount,
              calculatedAmount,
              payoutMode,
              poolWeight: Number(config.pool_weight ?? 1.0),
              weeklyAmount: Number(config.weekly_amount ?? 0),
              isMeasurementOnly,
              calculationDetails,
            })

            // Open next period for this pool
            const nextStart = addDays(period.period_end, 1)
            await supabase
              .from('allowance_periods')
              .insert({
                family_id: family.id,
                family_member_id: memberId,
                pool_name: poolName,
                period_start: nextStart,
                status: 'active',
                base_amount: config.weekly_amount,
              })

            stats.periods_opened++
          }

          // Skip financial transactions if no pools closed
          if (poolResults.length === 0) continue

          // Compute weighted combination (uses live progress for all pools,
          // including any that didn't close this cycle)
          const latestPeriod = memberPeriods[0]
          const { data: combinationRows } = await supabase
            .rpc('calculate_weighted_combination', {
              p_member_id: memberId,
              p_period_start: latestPeriod.period_start,
              p_period_end: latestPeriod.period_end,
            })

          const combination = combinationRows?.[0]
          const combinedPercentage = Number(combination?.combined_percentage ?? 0)
          const poolDetails = combination?.pool_details ?? []

          // Write combined_percentage on each closed pool's period row (option a)
          for (const result of poolResults) {
            await supabase
              .from('allowance_periods')
              .update({
                combined_percentage: combinedPercentage,
                calculation_details: {
                  ...result.calculationDetails,
                  combined_percentage: combinedPercentage,
                  pool_details: poolDetails,
                },
              })
              .eq('id', result.periodId)
          }

          // Sum total earned across non-measurement-only pools
          let combinedPayoutAmount = poolResults
            .filter((r) => !r.isMeasurementOnly)
            .reduce((sum, r) => sum + r.totalEarned, 0)

          // Evaluate cross-pool penalty/multiplier contracts
          const crossPoolAdjustments = await evaluateCrossPoolContracts(
            supabase,
            memberId,
            family.id,
            poolResults,
            poolDetails,
          )

          if (crossPoolAdjustments.length > 0) {
            for (const adj of crossPoolAdjustments) {
              if (adj.type === 'multiplicative') {
                combinedPayoutAmount *= (1 - adj.rate)
              } else if (adj.type === 'additive') {
                combinedPayoutAmount += adj.amount
              }
              stats.cross_pool_adjustments++
            }
            combinedPayoutAmount = Math.max(0, Math.round(combinedPayoutAmount * 100) / 100)

            // Record adjustments on the period calculation_details
            for (const result of poolResults) {
              const { data: periodRow } = await supabase
                .from('allowance_periods')
                .select('calculation_details')
                .eq('id', result.periodId)
                .single()

              if (periodRow) {
                await supabase
                  .from('allowance_periods')
                  .update({
                    calculation_details: {
                      ...(periodRow.calculation_details as Record<string, unknown>),
                      cross_pool_adjustments: crossPoolAdjustments,
                      combined_payout_after_adjustments: combinedPayoutAmount,
                    },
                  })
                  .eq('id', result.periodId)
              }
            }
          }

          // Write per-pool informational transactions
          for (const result of poolResults) {
            if (result.isMeasurementOnly) continue

            const { data: balForContrib } = await supabase.rpc('calculate_running_balance', {
              p_member_id: memberId,
            })

            await supabase
              .from('financial_transactions')
              .insert({
                family_id: family.id,
                family_member_id: memberId,
                transaction_type: 'pool_contribution',
                amount: 0,
                balance_after: Number(balForContrib ?? 0),
                description: `${result.poolName} pool: ${result.completionPct.toFixed(1)}% (weight ${result.poolWeight})`,
                source_type: 'allowance_period',
                source_reference_id: result.periodId,
                pool_name: result.poolName,
                metadata: {
                  pool_percentage: result.completionPct,
                  pool_weight: result.poolWeight,
                  pool_earned: result.totalEarned,
                  bonus_applied: result.bonusApplied,
                  bonus_amount: result.bonusAmount,
                },
              })

            stats.pool_contributions_created++
          }

          // Write the combined allowance_earned transaction
          if (combinedPayoutAmount > 0) {
            const { data: balanceData } = await supabase.rpc('calculate_running_balance', {
              p_member_id: memberId,
            })
            let currentBalance = Number(balanceData ?? 0)

            // Handle auto-deduct loan repayments BEFORE recording allowance
            let netEarned = combinedPayoutAmount
            const { data: activeLoans } = await supabase
              .from('loans')
              .select('id, remaining_balance, auto_deduct_amount, repayment_mode')
              .eq('family_member_id', memberId)
              .eq('status', 'active')
              .eq('repayment_mode', 'auto_deduct')

            if (activeLoans?.length) {
              for (const loan of activeLoans) {
                if (netEarned <= 0) break

                const deductAmount = Math.min(
                  Number(loan.auto_deduct_amount ?? 0),
                  netEarned,
                  Number(loan.remaining_balance),
                )
                if (deductAmount <= 0) continue

                currentBalance = currentBalance + combinedPayoutAmount
                currentBalance = currentBalance - deductAmount

                await supabase
                  .from('financial_transactions')
                  .insert({
                    family_id: family.id,
                    family_member_id: memberId,
                    transaction_type: 'loan_repayment',
                    amount: -deductAmount,
                    balance_after: currentBalance,
                    description: `Loan repayment (auto-deduct from allowance)`,
                    source_type: 'loan',
                    source_reference_id: loan.id,
                  })

                const newLoanBalance = Number(loan.remaining_balance) - deductAmount
                await supabase
                  .from('loans')
                  .update({
                    remaining_balance: newLoanBalance,
                    ...(newLoanBalance <= 0
                      ? { status: 'paid_off', paid_off_at: now.toISOString() }
                      : {}),
                  })
                  .eq('id', loan.id)

                netEarned -= deductAmount
                stats.loan_repayments++
              }
            }

            // Build description showing per-pool breakdown
            const payoutPools = poolResults.filter((r) => !r.isMeasurementOnly)
            let description: string
            if (payoutPools.length === 1) {
              const p = payoutPools[0]
              description = `Allowance — ${p.completionPct.toFixed(1)}% of $${p.weeklyAmount.toFixed(2)}${p.bonusApplied ? ' + bonus' : ''}`
            } else {
              const poolSummaries = payoutPools
                .map((p) => `${p.poolName}: ${p.completionPct.toFixed(1)}%`)
                .join(', ')
              description = `Allowance — ${poolSummaries} (combined ${combinedPercentage.toFixed(1)}%)`
            }

            const balanceAfterAllowance = Number(balanceData ?? 0) + combinedPayoutAmount
            await supabase
              .from('financial_transactions')
              .insert({
                family_id: family.id,
                family_member_id: memberId,
                transaction_type: 'allowance_earned',
                amount: combinedPayoutAmount,
                balance_after: balanceAfterAllowance,
                description,
                source_type: 'allowance_period',
                source_reference_id: poolResults[0].periodId,
                pool_name: null,
                metadata: {
                  pool_count: payoutPools.length,
                  combined_percentage: combinedPercentage,
                  pool_details: poolDetails,
                  cross_pool_adjustments: crossPoolAdjustments.length > 0
                    ? crossPoolAdjustments
                    : undefined,
                  per_pool: payoutPools.map((p) => ({
                    pool_name: p.poolName,
                    completion_percentage: p.completionPct,
                    total_earned: p.totalEarned,
                    bonus_applied: p.bonusApplied,
                  })),
                },
              })

            stats.transactions_created++
          }
        } catch (err) {
          stats.errors.push(
            `member ${memberId}: ${err instanceof Error ? err.message : 'unknown'}`,
          )
        }
      }

      // Also check makeup_window periods that have expired
      await processMakeupWindows(supabase, family.id, localDateStr, now)
    }

    return jsonResponse(stats)
  } catch (error) {
    console.error('[calculate-allowance-period] fatal error', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'unknown error',
        stats,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})

// ── Helpers ──────────────────────────────────────────────────────────

function isInCalcTimeWindow(
  calcTimeRaw: unknown,
  currentMinutesOfDay: number,
): boolean {
  const calcTimeStr = (calcTimeRaw as string) || '23:59:00'
  const [calcHour, calcMin] = calcTimeStr.split(':').map(Number)
  const calcMinutesOfDay = calcHour * 60 + (calcMin || 0)
  const windowEndExclusive = calcMinutesOfDay + 60

  if (windowEndExclusive <= 1440) {
    return (
      currentMinutesOfDay >= calcMinutesOfDay &&
      currentMinutesOfDay < windowEndExclusive
    )
  }
  const wrapEnd = windowEndExclusive % 1440
  return currentMinutesOfDay >= calcMinutesOfDay || currentMinutesOfDay < wrapEnd
}

async function countAssignedTasks(
  supabase: SupabaseClient,
  familyId: string,
  memberId: string,
  periodStart: string,
  periodEnd: string,
  configId: string,
  poolName: string,
): Promise<number> {
  // Convention #271: the routine portion of "tasks assigned" comes from the
  // single canonical query get_member_day_obligations, aggregated by task_id.
  // This is what fixes the painted bug for the displayed count — a past-end-date
  // painted routine produces ZERO obligation rows in the period, so it no longer
  // inflates total_tasks_assigned. Counting distinct task_ids that have at least
  // one active day in the period gives the set of routines that were genuinely
  // assigned during the period.
  const { data: obligations, error: obligationsError } = await supabase
    .rpc('get_member_day_obligations', {
      p_member_id: memberId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    })
  if (obligationsError) {
    console.warn('[calculate-allowance-period] get_member_day_obligations failed', obligationsError.message)
  }
  const routineTaskIds = new Set<string>()
  for (const row of (obligations ?? []) as Array<{ source_type: string; task_id: string; pool_id: string | null }>) {
    if (row.source_type !== 'routine_step') continue
    // Pool affiliation: default pool counts pool_id IS NULL; named pool matches configId.
    const inPool = poolName === 'default' ? row.pool_id == null : row.pool_id === configId
    if (inPool) routineTaskIds.add(row.task_id)
  }
  const routineCount = routineTaskIds.size

  // Non-routine tasks are NOT yet populated by Layer 2 (Convention #271 stub —
  // future build extends get_member_day_obligations with source_type='task').
  // Until then the non-routine portion of the display count is a grandfathered
  // direct count, scoped to non-routine task rows so it doesn't double-count the
  // routines already tallied above. Non-routine tasks have no painted schedule,
  // so the painted bug does not apply to them.
  let primaryQuery = supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .eq('assignee_id', memberId)
    .eq('counts_for_allowance', true)
    .neq('task_type', 'routine')
    .or(`archived_at.is.null,archived_at.gt.${periodStart}`)
    .lte('created_at', periodEnd + 'T23:59:59Z')

  if (poolName === 'default') {
    primaryQuery = primaryQuery.is('pool_id', null)
  } else {
    primaryQuery = primaryQuery.eq('pool_id', configId)
  }
  const { count: primaryNonRoutine } = await primaryQuery

  const { count: additionalNonRoutine } = await supabase
    .from('task_assignments')
    .select(
      'task_id, tasks!inner(family_id, counts_for_allowance, archived_at, created_at, assignee_id, pool_id, task_type)',
      { count: 'exact', head: true },
    )
    .eq('member_id', memberId)
    .eq('tasks.family_id', familyId)
    .eq('tasks.counts_for_allowance', true)
    .neq('tasks.task_type', 'routine')
    .or(`archived_at.is.null,archived_at.gt.${periodStart}`, { foreignTable: 'tasks' })
    .lte('tasks.created_at', periodEnd + 'T23:59:59Z')
    .neq('tasks.assignee_id', memberId)

  return routineCount + (primaryNonRoutine ?? 0) + (additionalNonRoutine ?? 0)
}

interface CrossPoolAdjustment {
  contractId: string
  type: 'multiplicative' | 'additive'
  rate: number
  amount: number
  description: string
  conditions: Array<{
    pool: string
    operator: string
    threshold: number
    actual: number
    met: boolean
  }>
}

async function evaluateCrossPoolContracts(
  supabase: SupabaseClient,
  memberId: string,
  familyId: string,
  poolResults: PoolCloseResult[],
  // deno-lint-ignore no-explicit-any
  poolDetails: any[],
): Promise<CrossPoolAdjustment[]> {
  // Load contracts with multi_pool_threshold IF pattern and end_of_period timing
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('family_id', familyId)
    .eq('status', 'active')
    .eq('if_pattern', 'multi_pool_threshold')
    .eq('stroke_of', 'end_of_period')

  if (!contracts?.length) return []

  // Build a pool percentage lookup from both closed results and live details
  const poolPctMap = new Map<string, number>()
  for (const result of poolResults) {
    poolPctMap.set(result.poolName, result.completionPct)
  }
  // Fill in live details for pools that didn't close this cycle
  if (Array.isArray(poolDetails)) {
    for (const detail of poolDetails) {
      const name = detail?.pool_name as string
      if (name && !poolPctMap.has(name)) {
        poolPctMap.set(name, Number(detail?.percentage ?? 0))
      }
    }
  }

  const adjustments: CrossPoolAdjustment[] = []

  for (const contract of contracts) {
    // Check if this contract targets this member
    const contractMemberId = contract.family_member_id as string | null
    if (contractMemberId && contractMemberId !== memberId) continue

    const payloadConfig = contract.payload_config as {
      adjustment_type?: string
      rate?: number
      amount?: number
      conditions?: Array<{
        pool: string
        operator: string
        threshold: number
      }>
    } | null

    if (!payloadConfig?.conditions?.length) continue

    // Evaluate all conditions
    const evaluatedConditions = payloadConfig.conditions.map((cond) => {
      const actual = poolPctMap.get(cond.pool) ?? 0
      let met = false
      switch (cond.operator) {
        case 'lt':
          met = actual < cond.threshold
          break
        case 'lte':
          met = actual <= cond.threshold
          break
        case 'gt':
          met = actual > cond.threshold
          break
        case 'gte':
          met = actual >= cond.threshold
          break
        case 'eq':
          met = Math.abs(actual - cond.threshold) < 0.01
          break
        default:
          met = false
      }
      return { ...cond, actual, met }
    })

    // All conditions must be met for the contract to fire
    const allMet = evaluatedConditions.every((c) => c.met)
    if (!allMet) continue

    const adjustmentType = (payloadConfig.adjustment_type ?? 'multiplicative') as
      | 'multiplicative'
      | 'additive'
    const rate = Number(payloadConfig.rate ?? 0)
    const amount = Number(payloadConfig.amount ?? 0)

    const condDesc = evaluatedConditions
      .map((c) => `${c.pool} ${c.operator} ${c.threshold}% (actual: ${c.actual.toFixed(1)}%)`)
      .join(', ')

    adjustments.push({
      contractId: contract.id,
      type: adjustmentType,
      rate,
      amount,
      description: `Cross-pool ${adjustmentType}: ${condDesc}`,
      conditions: evaluatedConditions,
    })
  }

  return adjustments
}

async function processMakeupWindows(
  supabase: SupabaseClient,
  familyId: string,
  localDateStr: string,
  now: Date,
) {
  const { data: makeupPeriods } = await supabase
    .from('allowance_periods')
    .select('*, allowance_configs!inner(makeup_window_days)')
    .eq('family_id', familyId)
    .eq('status', 'makeup_window')

  if (!makeupPeriods?.length) return

  for (const mp of makeupPeriods) {
    // deno-lint-ignore no-explicit-any
    const windowDays = (mp as any).allowance_configs?.makeup_window_days ?? 2
    const windowEnd = addDays(mp.period_end, windowDays)
    if (localDateStr > windowEnd) {
      await supabase
        .from('allowance_periods')
        .update({ status: 'closed', closed_at: now.toISOString() })
        .eq('id', mp.id)
    }
  }
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
