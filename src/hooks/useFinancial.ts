// PRD-28: Tracking, Allowance & Financial — Data hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { isoDayOfWeek, isoDaysFrom } from '@/utils/dates'
import { useFamilyToday, fetchFamilyToday } from './useFamilyToday'
import type {
  AllowanceConfig,
  AllowanceConfigInput,
  FinancialTransaction,
  AllowancePeriod,
  Loan,
  ChildFinancialSummary,
  TransactionFilter,
  PaymentInput,
  LoanInput,
  DeductionInput,
} from '@/types/financial'

// ============================================================
// Allowance Config
// ============================================================

export function useAllowanceConfig(memberId: string | undefined) {
  return useQuery({
    queryKey: ['allowance-config', memberId],
    queryFn: async () => {
      if (!memberId) return null
      const { data, error } = await supabase
        .from('allowance_configs')
        .select('*')
        .eq('family_member_id', memberId)
        .maybeSingle()
      if (error) throw error
      return data as AllowanceConfig | null
    },
    enabled: !!memberId,
  })
}

export function useAllowanceConfigs(familyId: string | undefined) {
  return useQuery({
    queryKey: ['allowance-configs', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('allowance_configs')
        .select('*')
        .eq('family_id', familyId)
      if (error) throw error
      return (data ?? []) as AllowanceConfig[]
    },
    enabled: !!familyId,
  })
}

export function useUpsertAllowanceConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AllowanceConfigInput) => {
      const { data, error } = await supabase
        .from('allowance_configs')
        .upsert(input, { onConflict: 'family_member_id' })
        .select()
        .single()
      if (error) throw error
      return data as AllowanceConfig
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['allowance-config', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['allowance-configs', data.family_id] })
    },
  })
}

/**
 * NEW-SS (Path X) — bulk upsert allowance_configs for multiple members in
 * one round trip. Each member's row is merged by `family_member_id`.
 *
 * The Phase 1 audit confirmed:
 *   - RLS on allowance_configs checks family_id only, not per-child whitelist,
 *     so the primary_parent can write to all children's configs atomically.
 *   - No per-member dependent validation (all validations are local to a row).
 *
 * Callers pass an array of fully-formed `AllowanceConfigInput` rows. Missing
 * fields fall back to Postgres defaults on insert, and to existing values
 * on update (.upsert preserves columns not in the input shape).
 */
export function useBulkUpsertAllowanceConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (inputs: AllowanceConfigInput[]) => {
      if (inputs.length === 0) return [] as AllowanceConfig[]
      const { data, error } = await supabase
        .from('allowance_configs')
        .upsert(inputs, { onConflict: 'family_member_id' })
        .select()
      if (error) throw error
      return (data ?? []) as AllowanceConfig[]
    },
    onSuccess: (rows) => {
      for (const row of rows) {
        qc.invalidateQueries({ queryKey: ['allowance-config', row.family_member_id] })
      }
      if (rows.length > 0) {
        qc.invalidateQueries({ queryKey: ['allowance-configs', rows[0].family_id] })
      }
      qc.invalidateQueries({ queryKey: ['family-financial-summary'] })
    },
  })
}

// ============================================================
// Financial Transactions
// ============================================================

export function useFinancialTransactions(
  memberId: string | undefined,
  filter?: TransactionFilter,
) {
  return useQuery({
    queryKey: ['financial-transactions', memberId, filter],
    queryFn: async () => {
      if (!memberId) return []
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .eq('family_member_id', memberId)
        .order('created_at', { ascending: false })

      if (filter?.type && filter.type !== 'all') {
        query = query.eq('transaction_type', filter.type)
      }
      if (filter?.dateFrom) {
        query = query.gte('created_at', filter.dateFrom)
      }
      if (filter?.dateTo) {
        query = query.lte('created_at', filter.dateTo)
      }
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as FinancialTransaction[]
    },
    enabled: !!memberId,
  })
}

export function useFamilyTransactions(familyId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['family-transactions', familyId, limit],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as FinancialTransaction[]
    },
    enabled: !!familyId,
  })
}

export function useRunningBalance(memberId: string | undefined) {
  return useQuery({
    queryKey: ['running-balance', memberId],
    queryFn: async () => {
      if (!memberId) return 0
      const { data, error } = await supabase.rpc('calculate_running_balance', {
        p_member_id: memberId,
      })
      if (error) throw error
      return (data as number) ?? 0
    },
    enabled: !!memberId,
  })
}

// ============================================================
// Financial Summary (all children)
// ============================================================

export function useFamilyFinancialSummary(familyId: string | undefined) {
  return useQuery({
    queryKey: ['family-financial-summary', familyId],
    queryFn: async () => {
      if (!familyId) return []

      // Load configs + members in parallel
      const [configsRes, membersRes] = await Promise.all([
        supabase
          .from('allowance_configs')
          .select('*')
          .eq('family_id', familyId),
        supabase
          .from('family_members')
          .select('id, display_name, assigned_color, member_color, role')
          .eq('family_id', familyId)
          .eq('is_active', true)
          .in('role', ['member']),
      ])
      if (configsRes.error) throw configsRes.error
      if (membersRes.error) throw membersRes.error

      const configs = (configsRes.data ?? []) as AllowanceConfig[]
      const members = membersRes.data ?? []

      const summaries: ChildFinancialSummary[] = []

      for (const member of members) {
        const config = configs.find(c => c.family_member_id === member.id)

        // Get balance
        const { data: balance } = await supabase.rpc('calculate_running_balance', {
          p_member_id: member.id,
        })

        // Get active period
        const { data: activePeriod } = await supabase
          .from('allowance_periods')
          .select('*')
          .eq('family_member_id', member.id)
          .in('status', ['active', 'makeup_window'])
          .order('period_start', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Get active loans
        const { count: loansCount } = await supabase
          .from('loans')
          .select('*', { count: 'exact', head: true })
          .eq('family_member_id', member.id)
          .eq('status', 'active')

        const { data: loanBalances } = await supabase
          .from('loans')
          .select('remaining_balance')
          .eq('family_member_id', member.id)
          .eq('status', 'active')

        const totalLoanBalance = (loanBalances ?? []).reduce(
          (sum, l) => sum + Number(l.remaining_balance),
          0,
        )

        summaries.push({
          memberId: member.id,
          memberName: member.display_name,
          memberColor: member.assigned_color ?? member.member_color ?? null,
          balance: Number(balance ?? 0),
          allowanceEnabled: config?.enabled ?? false,
          weeklyAmount: config?.weekly_amount ?? 0,
          calculationApproach: config?.calculation_approach ?? 'dynamic',
          activePeriod: (activePeriod as AllowancePeriod) ?? null,
          activeLoansCount: loansCount ?? 0,
          activeLoansBalance: totalLoanBalance,
        })
      }

      return summaries
    },
    enabled: !!familyId,
  })
}

// ============================================================
// Allowance Periods
// ============================================================

export function useActivePeriod(memberId: string | undefined) {
  return useQuery({
    queryKey: ['active-period', memberId],
    queryFn: async () => {
      if (!memberId) return null
      const { data, error } = await supabase
        .from('allowance_periods')
        .select('*')
        .eq('family_member_id', memberId)
        .in('status', ['active', 'makeup_window'])
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as AllowancePeriod | null
    },
    enabled: !!memberId,
  })
}

export interface LiveAllowanceProgress {
  effective_tasks_assigned: number
  effective_tasks_completed: number
  completion_percentage: number
  total_points: number
  completed_points: number
  base_amount: number
  bonus_applied: boolean
  bonus_amount: number
  calculated_amount: number
  total_earned: number
  minimum_threshold: number
  bonus_threshold: number
  calculation_approach: string
  rounding_behavior: string
  raw_steps_completed: number
  raw_steps_available: number
  nonroutine_tasks_total: number
  nonroutine_tasks_completed: number
  // PRD-28 NEW-EE: Extra Credit tallies (migration 100171). Count of completed
  // tasks where is_extra_credit=true plus their weighted numerator contribution.
  // Extra-credit tasks are excluded from the denominator; counted only in the
  // numerator when allowance_configs.extra_credit_enabled=true.
  extra_credit_completed: number
  extra_credit_weight_added: number
}

export function useLiveAllowanceProgress(
  memberId: string | undefined,
  periodStart: string | undefined,
  periodEnd: string | undefined,
  /**
   * NEW-GG: pass the active period's `grace_days` JSONB array. When provided
   * AND the child's config has grace_days_enabled=true, the RPC shrinks the
   * routine step denominator + numerator by any date in the array. Omit (or
   * pass undefined/empty array) for the previous behavior.
   */
  graceDays?: string[],
) {
  return useQuery({
    queryKey: ['live-allowance-progress', memberId, periodStart, periodEnd, graceDays?.slice().sort().join(',') ?? ''],
    queryFn: async () => {
      if (!memberId || !periodStart || !periodEnd) return null
      const { data, error } = await supabase.rpc('calculate_allowance_progress', {
        p_member_id: memberId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_grace_days: (graceDays && graceDays.length > 0) ? graceDays : null,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      if (!row) return null
      return {
        effective_tasks_assigned: Number(row.effective_tasks_assigned),
        effective_tasks_completed: Number(row.effective_tasks_completed),
        completion_percentage: Number(row.completion_percentage),
        total_points: Number(row.total_points),
        completed_points: Number(row.completed_points),
        base_amount: Number(row.base_amount),
        bonus_applied: Boolean(row.bonus_applied),
        bonus_amount: Number(row.bonus_amount),
        calculated_amount: Number(row.calculated_amount),
        total_earned: Number(row.total_earned),
        minimum_threshold: Number(row.minimum_threshold),
        bonus_threshold: Number(row.bonus_threshold),
        calculation_approach: String(row.calculation_approach),
        rounding_behavior: String(row.rounding_behavior),
        raw_steps_completed: Number(row.raw_steps_completed ?? 0),
        raw_steps_available: Number(row.raw_steps_available ?? 0),
        nonroutine_tasks_total: Number(row.nonroutine_tasks_total ?? 0),
        nonroutine_tasks_completed: Number(row.nonroutine_tasks_completed ?? 0),
        extra_credit_completed: Number(row.extra_credit_completed ?? 0),
        extra_credit_weight_added: Number(row.extra_credit_weight_added ?? 0),
      } as LiveAllowanceProgress
    },
    enabled: !!memberId && !!periodStart && !!periodEnd,
    staleTime: 15_000,
  })
}

export function usePeriodHistory(memberId: string | undefined) {
  return useQuery({
    queryKey: ['period-history', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('allowance_periods')
        .select('*')
        .eq('family_member_id', memberId)
        .order('period_start', { ascending: false })
        .limit(52) // up to a year of weekly periods
      if (error) throw error
      return (data ?? []) as AllowancePeriod[]
    },
    enabled: !!memberId,
  })
}

// ============================================================
// Grace Days
// ============================================================

export function useAddGraceDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ periodId, date }: { periodId: string; date: string }) => {
      // Read current grace_days, append the new date
      const { data: period, error: readError } = await supabase
        .from('allowance_periods')
        .select('grace_days, family_member_id')
        .eq('id', periodId)
        .single()
      if (readError) throw readError

      const currentDays = (period.grace_days as string[]) ?? []
      if (currentDays.includes(date)) return period // already marked

      const { error } = await supabase
        .from('allowance_periods')
        .update({ grace_days: [...currentDays, date] })
        .eq('id', periodId)
      if (error) throw error

      return { ...period, grace_days: [...currentDays, date] }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['active-period', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['period-history', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary'] })
      // NEW-GG: invalidate live progress so the widget + Preview panel
      // recompute against the new grace-days array.
      qc.invalidateQueries({ queryKey: ['live-allowance-progress'] })
    },
  })
}

/**
 * NEW-GG — inverse of useAddGraceDay. Removes a single date from the
 * period's grace_days array. No-op if the date isn't in the array.
 */
export function useRemoveGraceDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ periodId, date }: { periodId: string; date: string }) => {
      const { data: period, error: readError } = await supabase
        .from('allowance_periods')
        .select('grace_days, family_member_id')
        .eq('id', periodId)
        .single()
      if (readError) throw readError

      const currentDays = (period.grace_days as string[]) ?? []
      if (!currentDays.includes(date)) return period // already absent

      const nextDays = currentDays.filter(d => d !== date)
      const { error } = await supabase
        .from('allowance_periods')
        .update({ grace_days: nextDays })
        .eq('id', periodId)
      if (error) throw error

      return { ...period, grace_days: nextDays }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['active-period', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['period-history', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary'] })
      qc.invalidateQueries({ queryKey: ['live-allowance-progress'] })
    },
  })
}

// ============================================================
// Payments
// ============================================================

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PaymentInput) => {
      // Get current balance
      const { data: balance } = await supabase.rpc('calculate_running_balance', {
        p_member_id: input.family_member_id,
      })
      const currentBalance = Number(balance ?? 0)
      const paymentAmount = Math.min(input.amount, currentBalance) // cannot overpay
      if (paymentAmount <= 0) throw new Error('Nothing to pay')

      const newBalance = currentBalance - paymentAmount
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          transaction_type: 'payment_made',
          amount: -paymentAmount, // negative for payment
          balance_after: newBalance,
          description: input.note ? `Payment — ${input.note}` : 'Payment',
          source_type: 'manual',
          note: input.note ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as FinancialTransaction
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['financial-transactions', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-transactions', data.family_id] })
      qc.invalidateQueries({ queryKey: ['running-balance', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary', data.family_id] })
    },
  })
}

// ============================================================
// Loans
// ============================================================

export function useLoans(memberId: string | undefined) {
  return useQuery({
    queryKey: ['loans', memberId],
    queryFn: async () => {
      if (!memberId) return []
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('family_member_id', memberId)
        .order('issued_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Loan[]
    },
    enabled: !!memberId,
  })
}

export function useCreateLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: LoanInput) => {
      // Get current balance first
      const { data: balance } = await supabase.rpc('calculate_running_balance', {
        p_member_id: input.family_member_id,
      })
      const currentBalance = Number(balance ?? 0)

      // Create loan record
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          original_amount: input.amount,
          remaining_balance: input.amount,
          reason: input.reason ?? null,
          repayment_mode: input.repayment_mode,
          auto_deduct_amount: input.auto_deduct_amount ?? null,
          interest_rate: input.interest_rate ?? 0,
          interest_period: input.interest_period ?? 'monthly',
        })
        .select()
        .single()
      if (loanError) throw loanError

      // Create financial transaction
      const newBalance = currentBalance + input.amount // loan increases what mom owes
      const { error: txError } = await supabase
        .from('financial_transactions')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          transaction_type: 'loan_issued',
          amount: input.amount,
          balance_after: newBalance,
          description: input.reason
            ? `Loan issued — ${input.reason}`
            : 'Loan issued',
          source_type: 'loan',
          source_reference_id: loan.id,
        })
      if (txError) throw txError

      return loan as Loan
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['loans', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['financial-transactions', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['running-balance', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary', data.family_id] })
      qc.invalidateQueries({ queryKey: ['family-transactions', data.family_id] })
    },
  })
}

export function useForgiveLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ loanId, familyId, memberId }: {
      loanId: string
      familyId: string
      memberId: string
    }) => {
      const { data: loan, error: readErr } = await supabase
        .from('loans')
        .select('remaining_balance')
        .eq('id', loanId)
        .single()
      if (readErr) throw readErr

      // Mark loan as forgiven
      const { error: updateErr } = await supabase
        .from('loans')
        .update({ status: 'forgiven', paid_off_at: new Date().toISOString() })
        .eq('id', loanId)
      if (updateErr) throw updateErr

      // Create repayment transaction for the remaining balance
      const { data: balance } = await supabase.rpc('calculate_running_balance', {
        p_member_id: memberId,
      })
      const currentBalance = Number(balance ?? 0)
      const newBalance = currentBalance - Number(loan.remaining_balance)

      await supabase
        .from('financial_transactions')
        .insert({
          family_id: familyId,
          family_member_id: memberId,
          transaction_type: 'loan_repayment',
          amount: -Number(loan.remaining_balance),
          balance_after: newBalance,
          description: 'Loan forgiven',
          source_type: 'loan',
          source_reference_id: loanId,
          note: 'Forgiven by parent',
        })

      return { loanId }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['loans', variables.memberId] })
      qc.invalidateQueries({ queryKey: ['financial-transactions', variables.memberId] })
      qc.invalidateQueries({ queryKey: ['running-balance', variables.memberId] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary', variables.familyId] })
      qc.invalidateQueries({ queryKey: ['family-transactions', variables.familyId] })
    },
  })
}

// ============================================================
// Purchase Deductions
// ============================================================

export function useCreateDeduction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeductionInput) => {
      const { data: balance } = await supabase.rpc('calculate_running_balance', {
        p_member_id: input.family_member_id,
      })
      const currentBalance = Number(balance ?? 0)
      if (input.amount > currentBalance) {
        throw new Error('Deduction exceeds balance. Create a loan for overdrafts.')
      }

      const newBalance = currentBalance - input.amount
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          transaction_type: 'purchase_deduction',
          amount: -input.amount,
          balance_after: newBalance,
          description: input.description,
          source_type: 'manual',
        })
        .select()
        .single()
      if (error) throw error
      return data as FinancialTransaction
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['financial-transactions', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-transactions', data.family_id] })
      qc.invalidateQueries({ queryKey: ['running-balance', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary', data.family_id] })
    },
  })
}

// ============================================================
// Adjustment (for unmark cascade)
// ============================================================

export function useCreateAdjustment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      family_id: string
      family_member_id: string
      amount: number
      description: string
      source_type?: string
      source_reference_id?: string
    }) => {
      const { data: balance } = await supabase.rpc('calculate_running_balance', {
        p_member_id: input.family_member_id,
      })
      const currentBalance = Number(balance ?? 0)
      const newBalance = currentBalance + input.amount // can be negative for reversal

      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          family_id: input.family_id,
          family_member_id: input.family_member_id,
          transaction_type: 'adjustment',
          amount: input.amount,
          balance_after: newBalance,
          description: input.description,
          source_type: input.source_type ?? 'manual',
          source_reference_id: input.source_reference_id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as FinancialTransaction
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['financial-transactions', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-transactions', data.family_id] })
      qc.invalidateQueries({ queryKey: ['running-balance', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary', data.family_id] })
    },
  })
}

// ============================================================
// Period management
// ============================================================

export function useClosePeriodEarly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ periodId, memberId }: { periodId: string; memberId: string }) => {
      const { error } = await supabase
        .from('allowance_periods')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_early: true,
        })
        .eq('id', periodId)
      if (error) throw error
      return { periodId, memberId }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['active-period', variables.memberId] })
      qc.invalidateQueries({ queryKey: ['period-history', variables.memberId] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary'] })
    },
  })
}

// ============================================================
// Privilege Status Widget — completion % calculation
// ============================================================

export function useCompletionPercentage(
  memberId: string | undefined,
  mode: 'allowance' | 'fallback',
  fallbackMode?: 'today' | 'this_week' | 'rolling_7' | 'this_month' | 'rolling_30',
) {
  // Row 184 NEW-DD Path 2: family-today for date-range task filters so
  // cross-device clock drift can't shift the counting window.
  const { data: familyToday } = useFamilyToday(memberId)
  return useQuery({
    queryKey: ['completion-percentage', memberId, mode, fallbackMode, familyToday],
    queryFn: async () => {
      if (!memberId || !familyToday) return 0

      if (mode === 'allowance') {
        // Read from active allowance period
        const { data } = await supabase
          .from('allowance_periods')
          .select('completion_percentage')
          .eq('family_member_id', memberId)
          .in('status', ['active', 'makeup_window'])
          .order('period_start', { ascending: false })
          .limit(1)
          .maybeSingle()
        return data?.completion_percentage ?? 0
      }

      // Fallback: raw task completion %
      // Row 9 SCOPE-3.F14 / Convention #257: every date offset is computed
      // from the server-derived `familyToday`, never from `new Date()` or
      // `localIsoDaysFromToday`. A drifted device clock must not shift the
      // allowance-adjacent completion window.
      const today = familyToday
      let dateFrom: string
      switch (fallbackMode ?? 'this_week') {
        case 'today':
          dateFrom = today
          break
        case 'this_week': {
          // Sunday-start week: move back to the Sunday of the server-derived
          // today. (DOW: 0=Sun..6=Sat; subtracting DOW lands on this week's
          // Sunday.)
          const dow = isoDayOfWeek(today)
          dateFrom = isoDaysFrom(today, -dow)
          break
        }
        case 'rolling_7':
          dateFrom = isoDaysFrom(today, -7)
          break
        case 'this_month': {
          // First day of the month containing server-today.
          const [y, m] = today.split('-')
          dateFrom = `${y}-${m}-01`
          break
        }
        case 'rolling_30':
          dateFrom = isoDaysFrom(today, -30)
          break
        default:
          dateFrom = isoDaysFrom(today, -7)
      }

      // Count assigned vs completed tasks in date range
      const { count: assigned } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', memberId)
        .gte('due_date', dateFrom)
        .lte('due_date', today)
        .is('archived_at', null)
        .in('status', ['pending', 'in_progress', 'completed', 'pending_approval'])

      const { count: completed } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', memberId)
        .gte('due_date', dateFrom)
        .lte('due_date', today)
        .is('archived_at', null)
        .eq('status', 'completed')

      if (!assigned || assigned === 0) return 100 // zero tasks = 100%
      return Math.round(((completed ?? 0) / assigned) * 10000) / 100 // 2 decimal places
    },
    enabled: !!memberId && !!familyToday,
    refetchInterval: 30000, // refresh every 30s for real-time-ish updates
  })
}

// ============================================================
// Start first allowance period (immediate, pro-rated)
// ============================================================

export function useStartAllowancePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      familyId,
      memberId,
      weeklyAmount,
    }: {
      familyId: string
      memberId: string
      weeklyAmount: number
      /** @deprecated Kept for call-site compatibility; period_end now derives server-side. */
      periodStartDay?: string
    }) => {
      // Row 9 SCOPE-3.F14 / Convention #257: period_start + period_end are both
      // derived server-side by the BEFORE INSERT trigger on allowance_periods
      // (migration 100163). Implements founder Option (b): first period runs
      // today → day-before-next-configured-period_start_day (partial first
      // week for mid-week enable); subsequent periods are full 7-day weeks
      // aligned to period_start_day. We still send period_start = family_today
      // as a belt-and-suspenders hint so any pre-trigger inspection shows the
      // right value; the trigger will pass it through unchanged.
      const todayStr = await fetchFamilyToday(memberId)

      const { data, error } = await supabase
        .from('allowance_periods')
        .insert({
          family_id: familyId,
          family_member_id: memberId,
          period_start: todayStr,
          // period_end intentionally omitted — trigger derives from
          // allowance_configs.period_start_day + first-period detection.
          status: 'active',
          base_amount: weeklyAmount,
        })
        .select()
        .single()
      if (error) throw error
      return data as AllowancePeriod
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['active-period', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['period-history', data.family_member_id] })
      qc.invalidateQueries({ queryKey: ['family-financial-summary', data.family_id] })
    },
  })
}
