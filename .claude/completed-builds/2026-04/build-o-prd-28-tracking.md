# Build O: PRD-28 — Tracking, Allowance & Financial

> **Archived 2026-04-17 as part of Phase 0.26 S1.** Signed off 2026-04-13 per the CURRENT_BUILD.md top banner. Section header below preserved as-found — it was not updated when the build was signed off. This is an instance of the doc drift Phase 0.26 addresses.

### PRD Files
- `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md` (full PRD — 1,192 lines, read every word)

### Addenda Read
- `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md` (194 lines — PRD-36 established, task_rewards 'hourly', cross-PRD impacts)
- `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md` (325 lines — read for context, PRD-28B tables deferred)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md` (no PRD-28-specific rulings)
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` (no PRD-28-specific rulings)

### Feature Decision File
`claude/feature-decisions/PRD-28-Tracking-Allowance-Financial.md`

### Build Scope
**PRD-28 only.** PRD-28B (Compliance & Progress Reporting) deferred to separate build — needs working data first.

### Sub-Phase Split (Founder-Approved 2026-04-13)
- **Sub-phase A:** All 7 tables + schema updates + task-level tracking flags + allowance system + financial ledger + all financial screens + Privilege Status Widget + makeup work
- **Sub-phase B:** Homework subject config + time logging + Log Learning widget + homework screens

### Founder Session Additions (2026-04-13) — 3 Additions + Labeling Decision

**Addition 1: Task-Level Allowance Pool Flagging.** REPLACES the PRD's category-bucket approach. Each task/routine carries `counts_for_allowance`, `counts_for_homework`, `counts_for_gamification` boolean flags + `allowance_points` weight. Checkboxes in existing TaskCreationModal "Rewards & Completion Tracking" section. `allowance_configs.task_categories` and `point_values` columns REMOVED. Gamification pipeline (`roll_creature_for_completion`) gains a check against `counts_for_gamification`.

**Addition 2: Mom-Assigned Makeup Work.** `task_type = 'makeup'` — mom creates from [+ Assign Makeup Work] on WeeklyProgressCard. Counts toward current period allowance %. Third recovery mechanism alongside Makeup Window + Extra Credit.

**Addition 3: Privilege Status Widget.** `privilege_status` widget type. Red/Yellow/Green color zones based on completion %. Mom sets thresholds + free-text descriptions. Deployable to ANY dashboard including mom's own. Visibility only — never blocks features. Two data modes: reads allowance period completion % when configured, falls back to raw task completion % when not.

**Labeling:** User-facing "homework" not "homeschool." Internal table names/feature keys unchanged.

**Open Questions RESOLVED:** (1) First period starts immediately, pro-rated. (2) Grace day button on WeeklyProgressCard confirmed. (3) Hourly approval via `family_requests` confirmed. (4) AllowanceCalculatorTracker keeps fallback confirmed. (5) Proceed after this update + re-approval.

---

### Pre-Build Summary

#### Context

PRD-28 is the real-money and multi-dimensional tracking engine. Mom sets up each kid's allowance once — weekly amount, which tasks count, calculation approach — and the system does the math every week. She sees what she owes at a glance, marks payments, tracks loans, and knows homeschool hours are logged accurately. Business work for mom's business has clean hourly records. The whole financial picture in one place.

The financial system is ENTIRELY separate from PRD-24's gamification points. Both trigger on task completion independently. PRD-28 handles real money (DECIMAL precision); PRD-24 handles in-app currency (INTEGER). Separate ledgers, separate balances, separate configuration surfaces.

#### Dependency Status (Verified 2026-04-13)

| Dependency | Status | Details |
|---|---|---|
| **PRD-09A Tasks** (`task_completions`) | **WIRED** | 10 rows, 8+ hooks, gamification pipeline fires via `roll_creature_for_completion` |
| **PRD-36 Universal Timer** (`time_sessions`, `timer_configs`) | **WIRED** | 1 row, full hook/component suite, TimerProvider wraps all shells |
| **PRD-10 Widgets** (`dashboard_widgets`) | **WIRED** | 152 widgets, `AllowanceCalculatorTracker` component exists (166 lines, functional calculation logic) |
| **PRD-24 Gamification** | **WIRED** | Pipeline updates `family_members` stats directly via RPC — no `gamification_events` table (points managed in-place) |
| **`task_rewards`** | **EXISTS (0 rows)** | CHECK allows `'points','money','privilege','custom'` — needs `'hourly'` added |
| **`victories.source`** | **READY** | `'homeschool_logged'` already in enum (migration 100102) — no change needed |
| **PRD-28 tables** | **ALL MISSING** | None of the 13 required tables exist |
| **PRD-28 code** | **MINIMAL** | Only `AllowanceCalculatorTracker` widget stub exists |

**No blockers.** PRD-36 (Universal Timer) is fully built — homework time logging can consume `time_sessions` directly. `victories.source` already includes `'homeschool_logged'`. Schema changes to existing tables: (1) add `'hourly'` to `task_rewards.reward_type` CHECK (0 rows, zero risk), (2) add 4 tracking flag columns to `tasks` and `task_templates` (defaults preserve current behavior), (3) add `'makeup'` to `tasks.task_type` CHECK, (4) update `roll_creature_for_completion` RPC to respect `counts_for_gamification` flag.

#### Dependencies Already Built (reuse wholesale)

- **`task_completions`** — 8+ hooks in `src/hooks/useTaskCompletions.ts`. `useCompleteTask`, `useApproveCompletion`, `useRejectCompletion` all functional. PRD-28 reads these to calculate allowance.
- **`time_sessions`** — full timer infrastructure in `src/features/timer/`. `useTimer`, `useActiveTimers`, `useTimerActions`, `TimerProvider` wrapping all shells. PRD-28 reads timer sessions for homeschool time logging and business work hourly rate calculations.
- **`AllowanceCalculatorTracker`** — 166-line component at `src/components/widgets/trackers/AllowanceCalculatorTracker.tsx`. Currently calculates from widget `dataPoints` (PRD-10 convention). Sub-phase A wires it to read from real `allowance_periods` + `financial_transactions` instead.
- **Tasks page tab structure** — `src/pages/Tasks.tsx:244-259`. `TaskTab` type union at line 98. Role-filtered (Guided sees 2 tabs, others see 5). Pattern for adding new tab is clear: add to type union + tab array + content switch.
- **Settings page structure** — `src/pages/SettingsPage.tsx`. `SettingsSection` wrapper pattern at lines 163-178. Role-filtered sections. `SettingsNavRow` for navigation to sub-pages.
- **pg_cron + Edge Function pattern** — `process-carry-forward-fallback` (migration 100110:356-369) and `mindsweep-auto-sweep` (migration 100093:9-22). Hourly cron → `net.http_post` → Edge Function checks family timezone → processes at local midnight. Carry-forward at :05, mindsweep at :00. PRD-28 allowance calculation at :10, interest accrual at :15.
- **Append-only ledger pattern** — `gamification_events` doesn't exist as a table (points updated in-place), but `financial_transactions` follows the same append-only pattern as `ai_credits` (PRD-31). Never UPDATE, never DELETE.

#### Dependencies NOT Yet Built

- **PRD-28B (Compliance & Progress Reporting)** — 6 tables + reporting engine. Deferred to separate build.
- **PRD-05 LiLa `homeschool_time_review` guided mode** — AI subject estimation. Stub.
- **PRD-35 (Universal Scheduler) biweekly/monthly periods** — weekly only at MVP.
- **PRD-15 teen purchase deduction requests** — deferred post-MVP.
- **Subject Tracking section in TaskCreationModal** — deferred to polish pass. Tasks already have `life_area_tag` for basic homeschool tagging.

#### Sub-Phase A — Financial System (schema + allowance + ledger + all financial screens)

**Migration `00000000100134_allowance_financial.sql`:**
- CREATE TABLE `allowance_configs` (26 columns, UNIQUE on `family_member_id`, RLS family-scoped, mom full CRUD, members read own)
- CREATE TABLE `financial_transactions` (12 columns, DECIMAL(10,2), append-only — INSERT-only RLS policy, no UPDATE/DELETE)
- CREATE TABLE `allowance_periods` (22 columns, per-period tracking with full calculation breakdown)
- CREATE TABLE `loans` (16 columns, active/paid_off/forgiven status)
- ALTER `task_rewards` DROP + ADD CHECK constraint to include `'hourly'` (rebuild-enum pattern, 0 rows — safe)
- RLS on all 4 tables: family-scoped, mom reads all, members read own, `financial_transactions` INSERT-only
- Indexes per PRD schema section (member+date, family+status, source traceability)
- `set_updated_at` trigger on `allowance_configs`, `allowance_periods`, `loans`
- 5 feature keys: `allowance_basic` (Essential), `allowance_advanced` (Enhanced), `financial_tracking` (Enhanced), `homeschool_subjects` (Enhanced), `homeschool_compliance` (Full Magic — stub)
- `feature_access_v2` grants for each feature key × role groups
- pg_cron job `calculate-allowance-period` at `:10` → Edge Function
- pg_cron job `accrue-loan-interest` at `:15` → Edge Function

**Edge Function `calculate-allowance-period`:**
- Hourly cron, timezone-aware (same pattern as `process-carry-forward-fallback`)
- Finds active `allowance_periods` whose `period_end < local_today`
- For each period: count completed tasks in the allowance pool, apply grace day exclusions, calculate completion %, apply bonus threshold, create `allowance_earned` transaction, handle auto-deduct loan repayments, close period, open next period
- Three calculation approaches:
  - **Fixed:** Count tasks completed ÷ tasks assigned in the configured fixed template
  - **Dynamic:** Count all eligible tasks completed ÷ all eligible tasks that existed during the period
  - **Points-Weighted:** Sum points earned ÷ sum points possible, weighted by per-category point values
- Grace day logic: remove grace day tasks from denominator (not numerator)
- Makeup window: if enabled and active, delay period close by N days
- Extra credit: add to numerator, cap at 100%
- Auto-deduct loan repayment: if active loans with auto_deduct, create `loan_repayment` transaction, reduce loan balance, check paid-off

**Edge Function `accrue-loan-interest`:**
- Hourly cron, timezone-aware
- Finds active loans with `interest_rate > 0` whose `interest_last_accrued` is older than the configured period
- Calculates interest on `remaining_balance` × `interest_rate`
- Creates `interest_accrued` transaction
- Updates `loans.interest_last_accrued` and `total_interest_accrued`

**TypeScript types** (`src/types/financial.ts`):
- `AllowanceConfig`, `FinancialTransaction`, `AllowancePeriod`, `Loan`
- Enums: `CalculationApproach`, `TransactionType`, `PeriodStatus`, `LoanStatus`, `RoundingBehavior`

**Hooks** (`src/hooks/useFinancial.ts`):
- `useAllowanceConfig(memberId)` — query + upsert mutation
- `useAllowanceConfigs(familyId)` — all children's configs
- `useFinancialTransactions(memberId, filters?)` — paginated ledger with type/date filters
- `useFamilyFinancialSummary(familyId)` — balances per child, total owed
- `useAllowancePeriod(memberId, period?)` — current or specific period with calculation details
- `useCreatePayment()` — creates `payment_made` transaction, updates `balance_after`
- `useCreateLoan()` — creates `loan_issued` transaction + `loans` record
- `useCreateDeduction()` — creates `purchase_deduction` transaction
- `useCreateAdjustment()` — creates `adjustment` transaction (for unmark cascade)
- `useLoan(loanId)` — query + repayment + forgiveness mutations
- `useLoans(memberId)` — all loans for a member

**Components:**
- `AllowanceSettingsPage` — Screen 1: all-children overview cards + family summary
- `ChildAllowanceConfig` — Screen 2: 8-section configuration form
- `FinancesTab` — Screen 4: new tab content for Tasks page (What I Owe + Weekly Progress + Recent Transactions)
- `TransactionHistory` — Screen 5: full-screen ledger with filters
- `TransactionCard` — single transaction row
- `PaymentModal` — Screen 8: full/partial payment
- `LoanModal` — Screen 9: loan creation with terms
- `PurchaseDeductionModal` — Screen 10: deduction from balance
- `WeeklyProgressCard` — per-child weekly summary
- `BalanceCard` — compact balance for Independent shell dashboard

**Tasks page integration:**
- Add `'finances'` to `TaskTab` type union (line 98)
- Add tab to `tabs` array (after `queue`, mom-only via `isGuidedMember` guard)
- Add `FinancesTab` rendering in content switch
- Tab only visible when member role is `primary_parent`

**Settings integration:**
- Add "Allowance & Finances" `SettingsSection` in `SettingsPage.tsx` (mom-only)
- `SettingsNavRow` navigating to `/settings/allowance`
- Add route in `App.tsx`

**Allowance Calculator widget wiring:**
- Update `AllowanceCalculatorTracker.tsx` to optionally read from `allowance_periods` and `financial_transactions` when PRD-28 data exists, falling back to current `dataPoints` calculation when it doesn't
- Add `balance` display when `child_can_see_finances=true`

**Task completion → financial transaction wiring:**
- In `useCompleteTask` or a new side-effect hook: when a task is completed AND it has a `task_rewards` record with `reward_type='money'` or `reward_type='hourly'`:
  - For `money`: create `opportunity_earned` transaction immediately
  - For `hourly`: create `financial_approval` request in `family_requests` for mom to confirm (earnings = timer minutes × hourly rate)
- For tasks in the allowance pool: update active `allowance_periods.tasks_completed` running count
- Task unmark: create negative `adjustment` transaction

**Independent teen visibility:**
- When `allowance_configs.child_can_see_finances=true` AND member is Independent:
  - Show `BalanceCard` on personal dashboard
  - Show transaction history at `/finances/history` (own data only, filtered by RLS)
- When `child_can_see_finances=false` OR member is Guided/Play:
  - Allowance Calculator widget shows completion % only, no dollar amounts
  - Play mode: ALWAYS % only, regardless of toggle

#### Sub-Phase B — Homework Tracking (schema + subjects + time logging + Log Learning widget)

> **Founder decisions applied 2026-04-13:** (1) Migration number verified — highest existing is 100135, using **100136**. (2) Unlimited subjects confirmed. (3) School year dates added to `homeschool_configs`. (4) Hour targets are opt-in, NULL by default — counting not measuring. (5) Widget alignment with existing infrastructure confirmed.

**Migration `00000000100136_homeschool_tracking.sql`:**
- CREATE TABLE `homeschool_subjects` (8 columns, UNIQUE on `(family_id, name)`, family-scoped RLS)
  - `id UUID PK`, `family_id UUID FK NOT NULL`, `name TEXT NOT NULL`, `default_weekly_hours DECIMAL(5,2) DEFAULT NULL` (**nullable, no default — targets are opt-in**), `icon_key TEXT NULL` (Lucide icon for Play variant), `sort_order INTEGER DEFAULT 0`, `is_active BOOLEAN DEFAULT true`, `created_at`, `updated_at`
  - UNIQUE on `(family_id, name)`, index on `(family_id, is_active)`
  - RLS: family-scoped, mom full CRUD, members read. **No cap on subject count — mom can add unlimited subjects.**
  - Subjects can be renamed, reordered, and archived at any time. **Archive = `is_active=false`. Deletion is never allowed — historical time logs must always have a valid FK reference.**
- CREATE TABLE `homeschool_configs` (10 columns, family-default + per-child override pattern)
  - `id UUID PK`, `family_id UUID FK NOT NULL`, `family_member_id UUID FK NULL` (**NULL = family-wide default**, non-NULL = per-child override), `time_allocation_mode TEXT DEFAULT 'full'` CHECK `('full','weighted','strict')`, `allow_subject_overlap BOOLEAN DEFAULT true`, `subject_hour_overrides JSONB DEFAULT '{}'`, `school_year_start DATE NULL`, `school_year_end DATE NULL`, `term_breaks JSONB DEFAULT '[]'` (array of `{name, start_date, end_date}` for semester/term boundaries), `created_at`, `updated_at`
  - **Two partial unique indexes:** `UNIQUE (family_id) WHERE family_member_id IS NULL` (one family default per family) + `UNIQUE (family_member_id) WHERE family_member_id IS NOT NULL` (one per child)
  - **Family-first, per-child override:** Mom configures school year dates once at the family level. Per-child records override only when a specific child diverges (different program, different grade level). When a per-child field is NULL, inherit from the family default.
  - **Resolution order:** child override (if set) → family default (if set) → system default
  - Summary views filter time logs to the resolved school year when set. PRD-28B compliance reporting will consume these boundaries.
  - `term_breaks` is optional — most families won't use it at MVP but the schema is ready for semester/quarterly breakdowns.
- CREATE TABLE `homeschool_time_logs` (15 columns, compliance-ready indexing)
  - `id UUID PK`, `family_id UUID FK NOT NULL`, `family_member_id UUID FK NOT NULL`, `subject_id UUID FK NOT NULL` → `homeschool_subjects`, `task_id UUID FK NULL` → `tasks`, `log_date DATE NOT NULL`, `minutes_logged INTEGER NOT NULL`, `allocation_mode_used TEXT NOT NULL`, `source TEXT NOT NULL` CHECK `('task_completed','child_report','manual_entry','timer_session')`, `source_reference_id UUID NULL`, `status TEXT DEFAULT 'confirmed'` CHECK `('pending','confirmed','rejected')`, `description TEXT NULL`, `approved_by UUID FK NULL`, `approved_at TIMESTAMPTZ NULL`, `created_at`, `updated_at`
  - Indexes: `(family_member_id, subject_id, log_date)`, `(family_member_id, log_date)`, `(family_id, subject_id, log_date)`, `(status)`, `(source, source_reference_id)`
  - RLS: family-scoped, mom reads all + writes all, members read own, children INSERT with `status='pending'` only
- `set_updated_at` triggers on all 3 tables
- Feature key `homeschool_subjects` already registered in Sub-phase A migration 100134

**TypeScript types** (`src/types/homeschool.ts`):
- `HomeschoolSubject`, `HomeschoolConfig`, `HomeschoolTimeLog`
- `TermBreak = { name: string; start_date: string; end_date: string }`
- Enums: `TimeAllocationMode`, `LogSource`, `LogStatus`
- `SubjectProgress = { subject: HomeschoolSubject; minutesLogged: number; targetMinutes: number | null }` — `targetMinutes` is null when no target set
- `LogLearningInput` — form data shape for the modal

**Hooks** (`src/hooks/useHomeschool.ts`):
- `useHomeschoolSubjects(familyId)` — query active subjects ordered by `sort_order`. Returns all when `includeArchived=true`.
- `useCreateSubject()` — insert new `homeschool_subjects` row (no cap — unlimited)
- `useUpdateSubject()` — update name, hours, icon_key, sort_order
- `useArchiveSubject()` — set `is_active=false` (**never delete — preserves historical logs**)
- `useReorderSubjects()` — batch update `sort_order` after drag-to-reorder
- `useHomeschoolFamilyConfig(familyId)` — query the family-wide default config (`family_member_id IS NULL`)
- `useHomeschoolChildConfig(memberId)` — query per-child override config
- `useResolvedHomeschoolConfig(familyId, memberId)` — resolves child override → family default → system default for all fields
- `useUpsertHomeschoolConfig()` — upsert either family-level or per-child config (determined by whether `family_member_id` is passed)
- `useHomeschoolTimeLogs(memberId, dateRange?, subjectId?)` — filtered time logs, respects resolved school year boundaries when set
- `useDailySummary(memberId, date?)` — per-subject minutes for a day (for widget progress bars)
- `useWeeklySummary(memberId, weekStart?)` — per-subject minutes for a week
- `useSchoolYearSummary(memberId)` — per-subject minutes across configured school year (for compliance)
- `useLogLearning()` — creates `homeschool_time_logs` records + optional victory + optional approval request
- `useApproveTimeLog()` — `pending` → `confirmed`, sets `approved_by`/`approved_at`
- `useRejectTimeLog()` — `pending` → `rejected`

**Components:**
- `HomeworkSettingsPage` — Screen 3: family-wide subject list with drag-to-reorder, time allocation mode, school year dates, per-child overrides
  - **Suggested defaults on first visit:** 7 subjects (Math, Reading / Language Arts, Science, History & Geography, Art, Music, Physical Education) pre-populated **with `default_weekly_hours = NULL`** — no targets set. Mom can edit, remove, or add more before saving.
  - **[+ Add Subject]** — inline input, no cap. Mom can add unlimited subjects beyond the 7 suggestions.
  - **Subject lifecycle:** rename, reorder (drag-to-reorder via dnd-kit), archive (X icon → `is_active=false`). **No delete button.** Archived subjects preserve all historical time logs and appear in historical reports but are no longer available for new entries.
  - **School Year Configuration section (family-level, at the top):** `school_year_start` + `school_year_end` date pickers (optional). Stored on the family-wide `homeschool_configs` record (`family_member_id IS NULL`). When set, all summary views respect these boundaries. `[+ Add Term Break]` for optional semester/term boundaries. **This is the one-time config for most families.**
  - **Time Allocation Mode** — family-wide default: Full / Weighted / Strict radio buttons with descriptions. Stored on the family-wide config record.
  - **Per-child overrides** — member pill buttons. Tapping opens per-child config panel showing **inherited** values from the family default with an **"Override for this child"** toggle/link that unlocks the fields for that specific child: allocation mode override, per-subject hour override JSONB, school year date overrides (for children at different school levels or programs). When override fields are NULL on the child record, the family default is shown as the inherited value.
- `SubjectEditor` — inline editing: editable text name + optional hours input + optional icon picker for Play variant. Save on blur or Enter.
- `ChildHomeschoolOverrides` — per-child config panel showing inherited family defaults with "Override for this child" unlock for allocation mode, subject hour overrides, school year dates
- `LogLearningTracker` — Screen 6: dashboard widget registered as `log_learning` in `TRACKER_TYPE_REGISTRY`
  - **Two display modes based on whether targets are set:**
    - **No target set (`default_weekly_hours = NULL`):** Shows accumulating count only — "2h 15m this week" per subject. No progress bar percentage, no implied goal. Just the facts.
    - **Target set:** Shows progress bar with "Xh Ym of Zh target" per subject.
  - **Widget label adapts:** header "Today's Homework", per-subject rows show count-only or count-vs-target based on whether that subject has a target.
  - **[Log Learning]** button → opens `LogLearningModal`
  - **Upcoming assignments** — queries `tasks WHERE assignee_id=memberId AND counts_for_homework=true AND status IN ('pending','in_progress') AND due_date >= today`, limit 3. Each with **[Start]** timer button.
  - **Compact mode** — total minutes logged today + [Log Learning] button only
  - **Widget registration:** `TRACKER_TYPE_REGISTRY` entry (`type: 'log_learning'`, `category: 'reflection_insight'`, `icon: 'BookOpen'`), added to `PICKER_CATEGORIES['reflection_insight']` tracker types, case in `WidgetRenderer.tsx` switch
- `LogLearningModal` — Screen 7: description + time + subject checkboxes + "Also add as Victory?"
  - Standard layout (Guided/Independent/Adult): textarea (required), time input (manual or [Use Timer]), subject checkbox grid, submit, victory checkbox
  - **Play variant** (same component, `variant='play'` prop): subject icons instead of checkboxes, preset time buttons (15/30/60 min), description optional, larger tap targets
  - Submit routing: Play/Guided → `status='pending'` + `useCreateRequest({ source: 'homeschool_child_report' })`. Independent → `status='confirmed'`. Adults → `status='confirmed'`.
  - Victory creation: `source='homeschool_logged'` immediately on submission (not on approval)
  - Time allocation on submit: `full` = each subject gets full minutes; `weighted` = proportional by target hours; `strict` = divide equally

**Settings integration:**
- Add "Homework & Subjects" `SettingsSection` in `SettingsPage.tsx` (conditional: `useCanAccess('homeschool_subjects')`)
- `SettingsNavRow` with label **"Homework & Subjects"** (user-facing — not "Homeschool Subjects")
- Navigate to `/settings/homework`
- Add route in `App.tsx`

**Widget registration:**
- Register `log_learning` in `TRACKER_TYPE_REGISTRY` (`src/types/widgets.ts`)
- Add `'log_learning'` to `PICKER_CATEGORIES` under `reflection_insight`
- Add case in `WidgetRenderer.tsx` switch → `<LogLearningTracker />`
- Starter configs: "Today's Homework" (daily, assigned to children) + "My Learning Log" (adult-focused variant)

**Timer integration (reading `time_sessions`):**
- `LogLearningModal` [Use Timer] button: starts a timer via `useTimerActions().startTimer()` with `source_type='learning_log'`
- On timer completion, reads `time_sessions.duration_minutes` and populates the time field
- For tasks already being timed (via `FocusTimerButton`): Log Learning modal reads the session duration from the active/completed timer session

**Approval routing:**
- Guided/Play children: Log Learning creates `homeschool_time_logs` with `status='pending'` + routes to mom's Universal Queue Requests tab with `source='homeschool_child_report'`
- Independent teens: direct `status='confirmed'` (unless mom configured approval requirement)
- Adults: direct `status='confirmed'`, no routing

**Victory creation:**
- When "Also add as a Victory?" is checked: create `victories` record with `source='homeschool_logged'` immediately on submission (not on approval)
- Victory is real regardless of time allocation approval

#### Stubs (NOT Building Either Sub-phase)

- PRD-28B (all 6 tables + compliance reporting + ESA invoices)
- `homeschool_time_review` LiLa guided mode (PRD-05 dependency)
- Biweekly/monthly allowance periods (PRD-35)
- Business work export (PDF/CSV)
- Dad payment delegation
- Teen purchase deduction requests via PRD-15
- Subject Tracking section in TaskCreationModal
- Allowance history trend charts
- Family Economy unified view
- Financial summary on Family Overview (PRD-14C)
- Advanced financial reports
- Homeschool budget/cost tracking

#### Key Decisions

1. **Two sub-phases, not three.** Financial system is one complete story (Sub-phase A). Homeschool tracking is genuinely independent (Sub-phase B). Loans are tightly coupled with the financial ledger and belong in Sub-phase A.
2. **`task_rewards` CHECK constraint updated in Sub-phase A migration.** Table has 0 rows — zero risk. Rebuild-enum pattern (DROP + ADD).
3. **`victories.source = 'homeschool_logged'` already exists.** No schema change needed (migration 100102).
4. **PRD-36 Universal Timer is already built.** No blocker. Sub-phase B reads `time_sessions` directly.
5. **Allowance calculation cron at :10, interest accrual at :15.** Avoids collision with mindsweep-auto-sweep (:00) and carry-forward-fallback (:05).
6. **Append-only `financial_transactions` with INSERT-only RLS.** No UPDATE or DELETE policies. Reversals are negative `adjustment` records.
7. **`AllowanceCalculatorTracker` already exists (166 lines).** Sub-phase A wires it to real data instead of rebuilding.
8. **Finances tab is mom-only.** Independent teens see their own data via `BalanceCard` on dashboard + `/finances/history` route (own data, RLS-filtered).
9. **Log Learning widget is universal.** Assignable to any family member. Adults/teens submit directly; children submit for approval.
10. **Financial data excluded from LiLa.** Explicit check in `context-assembler.ts` — never load from `financial_transactions`, `allowance_configs`, or `loans`.
11. **Migration number verified.** Highest existing is `00000000100135_allowance_bonus_type.sql`. Sub-phase B uses **`00000000100136_homeschool_tracking.sql`**.
12. **Unlimited subjects, no cap.** Mom can add as many subjects as she wants beyond the 7 suggested defaults. Subjects can be renamed, reordered (drag-to-reorder), and archived at any time. **Deletion is never allowed** — archived subjects preserve all historical time log FK references.
13. **School year / term date configuration — family-first, per-child override.** `school_year_start DATE NULL`, `school_year_end DATE NULL`, `term_breaks JSONB DEFAULT '[]'` on `homeschool_configs`. The table uses `family_member_id NULL` for the family-wide default record + non-NULL for per-child overrides. Two partial unique indexes enforce one family default + one per child. Most families configure once at the family level. Per-child overrides only when a child has a different academic calendar. Resolution: child override → family default → system default. PRD-28B compliance reporting will consume these boundaries.
14. **Hours counting, NOT measuring against targets — opt-in targets.** `homeschool_subjects.default_weekly_hours` is nullable, default NULL — no targets pre-populated. The 7 suggested subjects ship with NULL targets. Widget display has two modes: **no target** = accumulating count only ("2h 15m this week"), no progress bar %; **target set** = progress bar with "Xh Ym of Zh target". Mom opts IN to targets — they are never the default. No pressure, no judgment.
15. **Log Learning widget uses existing infrastructure.** `TRACKER_TYPE_REGISTRY`, `WidgetRenderer`, `WidgetConfiguration` — all consumed as-is. No widget system changes needed, just a new widget type registration.

#### Open Questions for Founder

1. **Allowance period auto-start:** When mom first configures allowance for a child, should the first period start immediately (this week) or on the next configured start day? PRD doesn't specify. **Recommendation:** Start immediately with a pro-rated first period.

2. **Grace day UI:** Where does mom mark grace days during the week? The PRD says "mom can mark specific days as grace days during or after the week." **Recommendation:** Add a "Mark Grace Day" button on the `WeeklyProgressCard` in the Finances tab that opens a date picker for the current period.

3. **Business work `task_rewards` hourly flow:** The PRD says timer sessions × hourly rate → pending mom approval → `financial_approval` request. Is this approval routing through `family_requests` (PRD-15) correct, or should it go through a simpler confirmation modal? **Recommendation:** Since PRD-15 is built, use `family_requests` with `source='financial_approval'`.

4. **Allowance Calculator widget transition:** The existing `AllowanceCalculatorTracker` (166 lines) calculates from widget `dataPoints`. Should we replace it entirely with PRD-28 data, or keep the existing calculation as a fallback for families that haven't configured allowance? **Recommendation:** Keep existing as fallback — if no `allowance_configs` record exists for the member, render existing behavior. If config exists, read from `allowance_periods` + `financial_transactions`.

5. **Ready to proceed to Sub-phase A?**

---

