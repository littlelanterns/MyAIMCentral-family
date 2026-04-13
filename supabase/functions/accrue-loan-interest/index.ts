/**
 * accrue-loan-interest — PRD-28 Loan Interest Accrual
 *
 * Called by pg_cron (migration 100134) via pg_net. Runs hourly at :15.
 * For each family at local midnight, finds active loans with interest
 * enabled whose last accrual date is past the configured period.
 * Calculates interest on remaining_balance, creates interest_accrued
 * transaction, updates loan fields.
 *
 * Interest accrues on remaining_balance, NOT original_amount.
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
  loans_checked: number
  interest_accrued: number
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
    loans_checked: 0,
    interest_accrued: 0,
    errors: [],
  }

  try {
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('id, timezone')
    if (familiesError) throw familiesError
    if (!families?.length) return jsonResponse(stats)

    stats.families_checked = families.length
    const now = new Date()

    for (const family of families) {
      const timezone = family.timezone || 'America/Chicago'
      let currentLocalHour: number
      try {
        currentLocalHour = parseInt(
          new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: timezone,
          }).format(now)
        )
      } catch {
        continue
      }

      if (currentLocalHour !== 0) continue
      stats.families_at_midnight++

      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      }).format(now)

      // Load active loans with interest for this family
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'active')
        .gt('interest_rate', 0)

      if (loansError) {
        stats.errors.push(`loans load: ${loansError.message}`)
        continue
      }
      if (!loans?.length) continue

      for (const loan of loans) {
        stats.loans_checked++

        try {
          // Determine if accrual is due
          const periodDays = loan.interest_period === 'weekly' ? 7 : 30
          const lastAccrued = loan.interest_last_accrued
          if (lastAccrued) {
            const daysSince = ageInDays(lastAccrued, localDateStr)
            if (daysSince < periodDays) continue
          }

          // Calculate interest on remaining balance
          const rate = Number(loan.interest_rate) / 100
          const balance = Number(loan.remaining_balance)
          const interestAmount = Math.round(balance * rate * 100) / 100

          if (interestAmount <= 0) continue

          // Update loan
          const newTotal = Number(loan.total_interest_accrued) + interestAmount
          const newBalance = balance + interestAmount

          await supabase
            .from('loans')
            .update({
              remaining_balance: newBalance,
              interest_last_accrued: localDateStr,
              total_interest_accrued: newTotal,
            })
            .eq('id', loan.id)

          // Create interest transaction
          const { data: currentBalanceData } = await supabase.rpc(
            'calculate_running_balance',
            { p_member_id: loan.family_member_id }
          )
          const currentBalance = Number(currentBalanceData ?? 0)
          const balanceAfter = currentBalance + interestAmount

          await supabase
            .from('financial_transactions')
            .insert({
              family_id: family.id,
              family_member_id: loan.family_member_id,
              transaction_type: 'interest_accrued',
              amount: interestAmount,
              balance_after: balanceAfter,
              description: `Interest accrued — ${loan.interest_rate}% on $${balance.toFixed(2)}`,
              source_type: 'loan',
              source_reference_id: loan.id,
              metadata: {
                interest_rate: loan.interest_rate,
                interest_period: loan.interest_period,
                principal_at_accrual: balance,
              },
            })

          stats.interest_accrued++
        } catch (err) {
          stats.errors.push(
            `loan ${loan.id}: ${err instanceof Error ? err.message : 'unknown'}`
          )
        }
      }
    }

    return jsonResponse(stats)
  } catch (error) {
    console.error('[accrue-loan-interest] fatal error', error)
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

function ageInDays(earlier: string, later: string): number {
  const a = new Date(earlier + 'T00:00:00Z').getTime()
  const b = new Date(later + 'T00:00:00Z').getTime()
  return Math.floor((b - a) / (24 * 60 * 60 * 1000))
}
