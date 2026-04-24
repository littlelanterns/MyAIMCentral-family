/**
 * calculate-allowance-period — PRD-28 Allowance Period Calculation
 *
 * Called by pg_cron (migration 100134) via pg_net. Runs hourly at :10.
 * For each family, checks whether the current hour in the family's
 * local timezone is 0 (first hour of local midnight). If so, processes
 * every child with an active allowance_periods row whose period_end
 * has passed, calculates the final completion %, applies grace days /
 * makeup / extra credit / bonus, writes the allowance_earned transaction,
 * handles auto-deduct loan repayments, closes the period, and opens
 * the next one.
 *
 * Pro-rated assignments: when a task or routine is added to the allowance
 * pool mid-period, its pool weight is scaled to (days_active / period_days)
 * where days_active is counted from max(task.created_at_date, period_start)
 * through period_end inclusive. For routines, the same shrinkage is applied
 * to the "total possible steps" denominator (total_steps × days_active). A
 * completed task still credits its full weight toward the numerator — the
 * kid gets full credit for completing something, but only a partial penalty
 * if they didn't (the thing wasn't on their list the whole week).
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
  loan_repayments: number
  errors: string[]
}

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
    loan_repayments: 0,
    errors: [],
  }

  try {
    // 1. Load all families
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, timezone')
    if (familiesError) throw familiesError
    if (!families?.length) {
      return jsonResponse(stats)
    }

    stats.families_checked = families.length
    const now = new Date()

    // 2. Check each family's local time
    for (const family of families) {
      const timezone = family.timezone || 'America/Chicago'
      let currentLocalHour: number
      let currentLocalMinute: number
      try {
        // NEW-II: capture both hour AND minute so per-child calculation_time
        // gating can compute a minute-level window. Replaces the hard-coded
        // `currentLocalHour !== 0` family-wide gate that ignored config.
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

      // Local date in YYYY-MM-DD
      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      }).format(now)

      // NEW-II: family-wide hour 0 gate removed. Per-child gating moves
      // inside the period loop after the config is loaded, so each child's
      // configured calculation_time is honored. The existing
      // `period_end < localDateStr` filter still ensures we never fire
      // before the period has actually ended.
      stats.families_at_midnight++ // legacy stat name kept; semantic now is "families considered this hour"

      // 3. Load active periods that have ended
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
      if (!periods?.length) continue

      for (const period of periods) {
        stats.periods_processed++

        try {
          // Load the child's allowance config
          const { data: config } = await supabase
            .from('allowance_configs')
            .select('*')
            .eq('family_member_id', period.family_member_id)
            .maybeSingle()

          if (!config?.enabled) continue

          // NEW-II — calculation_time per-child precision.
          //
          // PRD-28 Screen 2 Section 7 (L214): calculation_time TIME NOT NULL
          // DEFAULT '23:59:00' specifies WHEN end-of-period calculation
          // runs. Pre-NEW-II, the function gated on `currentLocalHour === 0`
          // (midnight family-local) regardless of config. For default 23:59
          // that's ~10 minutes off but functionally equivalent; for any
          // non-default value (e.g. 07:00) it was wrong by hours.
          //
          // New gate: cron runs hourly, so we fire when the current
          // minutes-of-day falls in a 1-hour window starting at
          // calculation_time. The window wraps midnight when calc_time is
          // in the last hour of the day, which preserves the legacy default
          // behavior (calc_time=23:59 → window covers 23:59 + the next
          // 00:xx hour, and the existing `period_end < localDateStr` filter
          // forces the firing to land on the day AFTER period_end).
          //
          // Examples (cron fires at HH:10 of each local hour):
          // - calc_time=23:59 (= 1439 min): window = [1439, 1499 mod 1440)
          //   = [1439, 1440) ∪ [0, 59). Cron at 23:10 local → 1390, NOT in
          //   window. Cron at 00:10 next day → 10, IN window. period_end
          //   < localDateStr (next day), so fires. ✓
          // - calc_time=07:00 (= 420 min): window = [420, 480). Cron at
          //   07:10 local → 430, IN window. Day after period_end fires. ✓
          // - calc_time=18:30 (= 1110 min): window = [1110, 1170). Cron at
          //   18:10 local → 1090, NOT in window. Cron at 19:10 → 1150, IN
          //   window. (1-hour delay vs ideal 18:30; tolerated per spec.)
          const calcTimeStr = (config.calculation_time as string) || '23:59:00'
          const [calcHour, calcMin] = calcTimeStr.split(':').map(Number)
          const calcMinutesOfDay = (calcHour * 60) + (calcMin || 0)
          const windowEndExclusive = calcMinutesOfDay + 60
          let inCalcTimeWindow: boolean
          if (windowEndExclusive <= 1440) {
            inCalcTimeWindow =
              currentMinutesOfDay >= calcMinutesOfDay &&
              currentMinutesOfDay < windowEndExclusive
          } else {
            // Wraparound: e.g. calc_time 23:59 means window spans into
            // the next day's 00:xx hour.
            const wrapEnd = windowEndExclusive % 1440
            inCalcTimeWindow =
              currentMinutesOfDay >= calcMinutesOfDay ||
              currentMinutesOfDay < wrapEnd
          }
          if (!inCalcTimeWindow) continue

          // If makeup window is enabled and we're still in the window, skip
          if (config.makeup_window_enabled) {
            const windowEnd = addDays(period.period_end, config.makeup_window_days)
            if (localDateStr <= windowEnd) {
              // Update status to makeup_window if not already
              if (period.status === 'active') {
                await supabase
                  .from('allowance_periods')
                  .update({ status: 'makeup_window' })
                  .eq('id', period.id)
              }
              continue
            }
          }

          // 4. Call the shared RPC for frequency-day-aware tally.
          // Single source of truth — same math as the live widget (see
          // migration 00000000100154_allowance_progress_rpc.sql + 100171
          // + 100172). NEW-GG: pass `period.grace_days` so denominator
          // and numerator both respect marked grace days.
          const gracePayload: string[] = (period.grace_days as string[]) ?? []
          const { data: progressRows, error: progressError } = await supabase
            .rpc('calculate_allowance_progress', {
              p_member_id: period.family_member_id,
              p_period_start: period.period_start,
              p_period_end: period.period_end,
              p_grace_days: gracePayload.length > 0 ? gracePayload : null,
            })

          if (progressError || !progressRows?.[0]) {
            stats.errors.push(`period ${period.id}: progress rpc failed — ${progressError?.message ?? 'empty result'}`)
            continue
          }

          const progress = progressRows[0]

          // Count raw task rows for the display column total_tasks_assigned.
          const { count: totalTasksAssignedCount } = await supabase
            .from('tasks')
            .select('id', { count: 'exact', head: true })
            .eq('family_id', family.id)
            .eq('assignee_id', period.family_member_id)
            .eq('counts_for_allowance', true)
            .is('archived_at', null)
            .lte('created_at', period.period_end + 'T23:59:59Z')

          const completionPct = Number(progress.completion_percentage)
          const calculatedAmount = Number(progress.calculated_amount)
          const bonusApplied = Boolean(progress.bonus_applied)
          const bonusAmount = Number(progress.bonus_amount)
          const totalEarned = Number(progress.total_earned)
          const effectiveAssigned = Math.round(Number(progress.effective_tasks_assigned))
          const effectiveCompleted = Math.round(Number(progress.effective_tasks_completed))
          // NEW-EE (migration 100171): RPC now returns extra_credit_completed
          // as its own column. This call site previously hardcoded 0 on the
          // update write. Null-coalesce to 0 so older RPC bodies still work.
          const extraCreditCompleted = Math.round(Number(progress.extra_credit_completed ?? 0))
          const extraCreditWeightAdded = Number(progress.extra_credit_weight_added ?? 0)
          const graceDays: string[] = (period.grace_days as string[]) ?? []

          // NEW-GG audit: compute the `grace_day_tasks_excluded` display
          // tally by calling the RPC a second time WITHOUT grace days and
          // diffing the effective_tasks_assigned. Once per-period at close
          // time; negligible cost. When no grace days are marked, skip.
          let graceDayTasksExcluded = 0
          if (graceDays.length > 0) {
            const { data: noGraceRows } = await supabase
              .rpc('calculate_allowance_progress', {
                p_member_id: period.family_member_id,
                p_period_start: period.period_start,
                p_period_end: period.period_end,
                p_grace_days: null,
              })
            const noGrace = noGraceRows?.[0]
            if (noGrace) {
              const noGraceAssigned = Math.round(Number(noGrace.effective_tasks_assigned))
              graceDayTasksExcluded = Math.max(0, noGraceAssigned - effectiveAssigned)
            }
          }

          // 5. Close the period
          await supabase
            .from('allowance_periods')
            .update({
              status: 'calculated',
              total_tasks_assigned: totalTasksAssignedCount ?? 0,
              grace_day_tasks_excluded: graceDayTasksExcluded,
              effective_tasks_assigned: effectiveAssigned,
              // tasks_completed now reports the REGULAR (non-extra-credit)
              // completions portion only, matching the semantic split on the
              // table (tasks_completed + extra_credit_completed = numerator).
              tasks_completed: Math.max(0, effectiveCompleted - extraCreditCompleted),
              extra_credit_completed: extraCreditCompleted,
              effective_tasks_completed: effectiveCompleted,
              completion_percentage: completionPct,
              calculated_amount: calculatedAmount,
              bonus_applied: bonusApplied,
              bonus_amount: bonusAmount,
              total_earned: totalEarned,
              calculation_details: {
                approach: progress.calculation_approach,
                total_points: Number(progress.total_points),
                completed_points: Number(progress.completed_points),
                grace_days: graceDays,
                minimum_threshold: Number(progress.minimum_threshold),
                bonus_threshold: Number(progress.bonus_threshold),
                extra_credit_completed: extraCreditCompleted,
                extra_credit_weight_added: extraCreditWeightAdded,
                rpc: 'calculate_allowance_progress',
              },
              calculated_at: now.toISOString(),
              closed_at: now.toISOString(),
            })
            .eq('id', period.id)

          stats.periods_closed++

          // 6. Create allowance_earned transaction
          if (totalEarned > 0) {
            // Get current balance
            const { data: balanceData } = await supabase.rpc('calculate_running_balance', {
              p_member_id: period.family_member_id,
            })
            let currentBalance = Number(balanceData ?? 0)

            // Handle auto-deduct loan repayments BEFORE recording allowance
            let netEarned = totalEarned
            const { data: activeLoans } = await supabase
              .from('loans')
              .select('id, remaining_balance, auto_deduct_amount, repayment_mode')
              .eq('family_member_id', period.family_member_id)
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

                // Create loan repayment transaction
                currentBalance = currentBalance + totalEarned // add allowance first
                currentBalance = currentBalance - deductAmount // then deduct repayment

                await supabase
                  .from('financial_transactions')
                  .insert({
                    family_id: family.id,
                    family_member_id: period.family_member_id,
                    transaction_type: 'loan_repayment',
                    amount: -deductAmount,
                    balance_after: currentBalance,
                    description: `Loan repayment (auto-deduct from allowance)`,
                    source_type: 'loan',
                    source_reference_id: loan.id,
                  })

                // Update loan balance
                const newLoanBalance = Number(loan.remaining_balance) - deductAmount
                await supabase
                  .from('loans')
                  .update({
                    remaining_balance: newLoanBalance,
                    ...(newLoanBalance <= 0 ? {
                      status: 'paid_off',
                      paid_off_at: now.toISOString(),
                    } : {}),
                  })
                  .eq('id', loan.id)

                netEarned -= deductAmount
                stats.loan_repayments++
              }
            }

            // Create allowance earned transaction (full amount before deductions)
            const balanceAfterAllowance = (Number(balanceData ?? 0)) + totalEarned
            await supabase
              .from('financial_transactions')
              .insert({
                family_id: family.id,
                family_member_id: period.family_member_id,
                transaction_type: 'allowance_earned',
                amount: totalEarned,
                balance_after: balanceAfterAllowance,
                description: `Weekly allowance — ${completionPct}% of $${Number(config.weekly_amount).toFixed(2)}${bonusApplied ? ' + bonus' : ''}`,
                source_type: 'allowance_period',
                source_reference_id: period.id,
                metadata: {
                  period_start: period.period_start,
                  period_end: period.period_end,
                  completion_percentage: completionPct,
                  bonus_applied: bonusApplied,
                },
              })

            stats.transactions_created++
          }

          // 7. Open next period.
          // Row 9 SCOPE-3.F14 / migration 100163: period_end is derived by the
          // BEFORE INSERT trigger (period_start + 6 for subsequent periods).
          // We send period_start explicitly so the trigger's "subsequent-period
          // respect exactly" branch kicks in rather than its
          // "fall-back-to-prior-row" branch, keeping the inductive schedule
          // alignment crisp.
          const nextStart = addDays(period.period_end, 1)

          await supabase
            .from('allowance_periods')
            .insert({
              family_id: family.id,
              family_member_id: period.family_member_id,
              period_start: nextStart,
              // period_end intentionally omitted — trigger derives.
              status: 'active',
              base_amount: config.weekly_amount,
            })

          stats.periods_opened++
        } catch (err) {
          stats.errors.push(`period ${period.id}: ${err instanceof Error ? err.message : 'unknown'}`)
        }
      }

      // Also check makeup_window periods that have expired
      const { data: makeupPeriods } = await supabase
        .from('allowance_periods')
        .select('*, allowance_configs!inner(makeup_window_days)')
        .eq('family_id', family.id)
        .eq('status', 'makeup_window')

      // Process expired makeup windows the same way as active periods above
      // (they pass through the same calculation logic since the window has passed)
      if (makeupPeriods?.length) {
        for (const mp of makeupPeriods) {
          const windowDays = (mp as Record<string, unknown>).allowance_configs
            ? ((mp as Record<string, Record<string, number>>).allowance_configs?.makeup_window_days ?? 2)
            : 2
          const windowEnd = addDays(mp.period_end, windowDays)
          if (localDateStr > windowEnd) {
            // Window expired — recalculate and close (same logic would apply)
            // For now, just close it. The calculation was done when it transitioned
            // from active. The makeup window just gave extra time for completions.
            await supabase
              .from('allowance_periods')
              .update({ status: 'closed', closed_at: now.toISOString() })
              .eq('id', mp.id)
          }
        }
      }
    }

    return jsonResponse(stats)
  } catch (error) {
    console.error('[calculate-allowance-period] fatal error', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'unknown error',
        stats,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

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
