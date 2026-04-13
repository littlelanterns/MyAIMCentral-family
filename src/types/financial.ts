// PRD-28: Tracking, Allowance & Financial — TypeScript types

// ============================================================
// Enums
// ============================================================

export type CalculationApproach = 'fixed' | 'dynamic' | 'points_weighted'
export type TransactionType =
  | 'allowance_earned'
  | 'opportunity_earned'
  | 'payment_made'
  | 'purchase_deduction'
  | 'loan_issued'
  | 'loan_repayment'
  | 'interest_accrued'
  | 'adjustment'
export type PeriodStatus = 'active' | 'makeup_window' | 'calculated' | 'closed'
export type LoanStatus = 'active' | 'paid_off' | 'forgiven'
export type RoundingBehavior = 'round_up' | 'round_down' | 'nearest_cent'
export type BonusType = 'percentage' | 'flat'
export type PeriodStartDay = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
export type LoanInterestPeriod = 'weekly' | 'monthly'
export type RepaymentMode = 'manual' | 'auto_deduct'

// Privilege Status Widget
export type PrivilegeZone = 'red' | 'yellow' | 'green'
export type FallbackCalculationMode = 'today' | 'this_week' | 'rolling_7' | 'this_month' | 'rolling_30'

// ============================================================
// Database Row Interfaces
// ============================================================

export interface AllowanceConfig {
  id: string
  family_id: string
  family_member_id: string
  enabled: boolean
  weekly_amount: number
  calculation_approach: CalculationApproach
  default_point_value: number
  minimum_threshold: number
  bonus_threshold: number
  bonus_type: BonusType
  bonus_percentage: number
  bonus_flat_amount: number
  rounding_behavior: RoundingBehavior
  grace_days_enabled: boolean
  makeup_window_enabled: boolean
  makeup_window_days: number
  extra_credit_enabled: boolean
  child_can_see_finances: boolean
  period_type: 'weekly'
  period_start_day: PeriodStartDay
  calculation_time: string
  loans_enabled: boolean
  loan_interest_enabled: boolean
  loan_default_interest_rate: number
  loan_interest_period: LoanInterestPeriod
  loan_max_amount: number | null
  created_at: string
  updated_at: string
}

export interface FinancialTransaction {
  id: string
  family_id: string
  family_member_id: string
  transaction_type: TransactionType
  amount: number
  balance_after: number
  description: string
  source_type: string | null
  source_reference_id: string | null
  category: string | null
  note: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface AllowancePeriod {
  id: string
  family_id: string
  family_member_id: string
  period_start: string
  period_end: string
  status: PeriodStatus
  total_tasks_assigned: number
  grace_day_tasks_excluded: number
  effective_tasks_assigned: number
  tasks_completed: number
  extra_credit_completed: number
  effective_tasks_completed: number
  completion_percentage: number
  base_amount: number
  calculated_amount: number
  bonus_applied: boolean
  bonus_amount: number
  total_earned: number
  grace_days: string[]
  calculation_details: Record<string, unknown>
  calculated_at: string | null
  closed_at: string | null
  closed_early: boolean
  created_at: string
  updated_at: string
}

export interface Loan {
  id: string
  family_id: string
  family_member_id: string
  original_amount: number
  remaining_balance: number
  reason: string | null
  repayment_mode: RepaymentMode
  auto_deduct_amount: number | null
  interest_rate: number
  interest_period: LoanInterestPeriod
  interest_last_accrued: string | null
  total_interest_accrued: number
  status: LoanStatus
  issued_at: string
  paid_off_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// UI / Component Interfaces
// ============================================================

export interface ChildFinancialSummary {
  memberId: string
  memberName: string
  memberColor: string | null
  balance: number
  allowanceEnabled: boolean
  weeklyAmount: number
  calculationApproach: CalculationApproach
  activePeriod: AllowancePeriod | null
  activeLoansCount: number
  activeLoansBalance: number
}

export interface TransactionFilter {
  type?: TransactionType | 'all'
  dateFrom?: string
  dateTo?: string
  memberId?: string
}

export interface PrivilegeStatusConfig {
  linked_member_id: string
  red_threshold: number
  yellow_threshold: number
  red_description: string
  yellow_description: string
  green_description: string
  fallback_calculation_mode: FallbackCalculationMode
}

export interface PrivilegeStatusState {
  zone: PrivilegeZone
  completionPercentage: number
  description: string
  thresholds: {
    red: number
    yellow: number
  }
}

// ============================================================
// Form / Creation Interfaces
// ============================================================

export interface AllowanceConfigInput {
  family_id: string
  family_member_id: string
  enabled?: boolean
  weekly_amount?: number
  calculation_approach?: CalculationApproach
  default_point_value?: number
  minimum_threshold?: number
  bonus_threshold?: number
  bonus_type?: BonusType
  bonus_percentage?: number
  bonus_flat_amount?: number
  rounding_behavior?: RoundingBehavior
  grace_days_enabled?: boolean
  makeup_window_enabled?: boolean
  makeup_window_days?: number
  extra_credit_enabled?: boolean
  child_can_see_finances?: boolean
  period_start_day?: PeriodStartDay
  calculation_time?: string
  loans_enabled?: boolean
  loan_interest_enabled?: boolean
  loan_default_interest_rate?: number
  loan_interest_period?: LoanInterestPeriod
  loan_max_amount?: number | null
}

export interface PaymentInput {
  family_id: string
  family_member_id: string
  amount: number
  note?: string
}

export interface LoanInput {
  family_id: string
  family_member_id: string
  amount: number
  reason?: string
  repayment_mode: RepaymentMode
  auto_deduct_amount?: number
  interest_rate?: number
  interest_period?: LoanInterestPeriod
}

export interface DeductionInput {
  family_id: string
  family_member_id: string
  amount: number
  description: string
}

export interface GraceDayInput {
  period_id: string
  date: string
}

// ============================================================
// Constants
// ============================================================

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  allowance_earned: 'Allowance',
  opportunity_earned: 'Job Earnings',
  payment_made: 'Payment',
  purchase_deduction: 'Purchase',
  loan_issued: 'Loan',
  loan_repayment: 'Loan Repayment',
  interest_accrued: 'Interest',
  adjustment: 'Adjustment',
}

export const CALCULATION_APPROACH_LABELS: Record<CalculationApproach, { label: string; description: string }> = {
  fixed: {
    label: 'Fixed Template',
    description: 'Set a fixed weekly task schedule. Best for consistent routines.',
  },
  dynamic: {
    label: 'Dynamic Pool',
    description: 'Tasks are counted dynamically each week. Best for variable schedules.',
  },
  points_weighted: {
    label: 'Points-Weighted',
    description: 'Different tasks worth different points. Best for incentivizing harder tasks.',
  },
}

export const PERIOD_START_DAY_LABELS: Record<PeriodStartDay, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
}

export const FALLBACK_CALCULATION_MODE_LABELS: Record<FallbackCalculationMode, string> = {
  today: 'Today',
  this_week: 'This week',
  rolling_7: 'Rolling 7 days',
  this_month: 'This month',
  rolling_30: 'Rolling 30 days',
}

export const DEFAULT_PRIVILEGE_STATUS_CONFIG: PrivilegeStatusConfig = {
  linked_member_id: '',
  red_threshold: 50,
  yellow_threshold: 80,
  red_description: '',
  yellow_description: '',
  green_description: '',
  fallback_calculation_mode: 'this_week',
}
