# Feature Decision File: PRD-28 — Tracking, Allowance & Financial

> **Created:** 2026-04-13
> **PRD:** `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md`
> **Addenda read:**
>   - `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

PRD-28 is the real-money and multi-dimensional tracking engine. It covers three systems: (1) **Allowance Pool System** — percentage-based weekly allowance calculated from task completion with three approaches (Fixed, Dynamic, Points-Weighted), grace mechanisms, bonus thresholds, and mom-assigned makeup work; (2) **Payment Tracking** — complete financial ledger (append-only, DECIMAL precision) with opportunity earnings, loans, deductions, and running balances; (3) **Homework Subject Tracking** — multi-subject time logging with configurable overlap modes for compliance reporting, consuming Universal Timer (PRD-36) session data.

The financial system is entirely separate from PRD-24's gamification points. Both fire on task completion independently. PRD-28 handles real money; PRD-24 handles in-app currency.

**Build scope:** PRD-28 only. PRD-28B (Compliance & Progress Reporting) is deferred — it needs working data before it's useful.

**Sub-phase split (founder-approved 2026-04-13):**
- **Sub-phase A:** All 7 tables + schema updates + task-level tracking flags + allowance system + financial ledger + all financial screens + Privilege Status Widget + makeup work
- **Sub-phase B:** Homework subject config + time logging + Log Learning widget + homework screens

---

## Founder Session Additions (2026-04-13)

### Addition 1: Task-Level Allowance Pool Flagging

**Replaces the PRD's category-bucket approach entirely.** Instead of configuring allowance pools via category checkboxes on `allowance_configs`, each task/routine carries its own opt-in flags for which tracking systems it feeds.

**New columns on `tasks` table:**
- `counts_for_allowance BOOLEAN DEFAULT false` — task completion counts toward the child's allowance pool
- `counts_for_homework BOOLEAN DEFAULT false` — task completion logs homework/learning hours (visible only when family has homework tracking enabled via `useCanAccess('homeschool_subjects')`)
- `counts_for_gamification BOOLEAN DEFAULT true` — task completion earns gamification points (default TRUE preserves current behavior where all completions earn)
- `allowance_points INTEGER` — nullable, per-task weight for Points-Weighted approach (NULL = use `allowance_configs.default_point_value`)

**New columns on `task_templates` table:**
- Same 4 columns — routines inherit flags to their deployed tasks unless overridden per-task

**UI location:** Existing "Rewards & Completion Tracking" section in `TaskCreationModal`. Checkboxes added below existing options:
- `[ ] Count toward allowance pool` (new)
- `[ ] Count toward homework tracking` (new — only visible when `useCanAccess('homeschool_subjects')`)
- `[ ] Count toward gamification points` (new — default checked, preserves current behavior)

**Allowance pool calculation change:** `allowance_periods` completion % = tasks completed (where `counts_for_allowance=true` AND `assignee_id=child`) / tasks assigned (same filter). No category matching. Mom flags tasks individually or via routine templates.

**Schema cleanup on `allowance_configs`:**
- REMOVE `task_categories JSONB` (replaced by per-task flags)
- REMOVE `point_values JSONB` (replaced by per-task `allowance_points`)
- KEEP `default_point_value INTEGER DEFAULT 1` (fallback weight when per-task `allowance_points` is NULL)

**Gamification pipeline update:** `roll_creature_for_completion` RPC gains a check against `tasks.counts_for_gamification` — if `false`, skip gamification entirely. This gives mom per-task control over which completions earn creatures/points.

### Addition 2: Mom-Assigned Makeup Work

Third recovery mechanism alongside Makeup Window and Extra Credit. Mom-initiated, not system-triggered.

- Mom taps `[+ Assign Makeup Work]` on the child's `WeeklyProgressCard` in the Finances tab
- Creates a task with `task_type = 'makeup'` — functions like a one-time opportunity
- `counts_for_allowance = true` automatically
- When completed, counts toward the current period's allowance completion percentage
- Mom controls exactly what qualifies and when it's offered

**Schema:** Add `'makeup'` to `tasks.task_type` CHECK constraint.

### Addition 3: Privilege Status Widget

New deployable widget type displaying a family member's current privilege status based on their task completion percentage.

**Widget config** (stored in `dashboard_widgets.widget_config` JSONB):
- `linked_member_id UUID` — whose completion % drives this widget
- `red_threshold INTEGER` — below this % = red zone (e.g., 50)
- `yellow_threshold INTEGER` — below this % = yellow zone (e.g., 80)
- `red_description TEXT` — mom's free-text for red zone
- `yellow_description TEXT` — mom's free-text for yellow zone
- `green_description TEXT` — mom's free-text for green zone

**Display:** Shows current color zone prominently + live completion % + mom's text description for the active zone. Updates in real time as tasks are completed.

**Data source (two modes):**
1. For children with allowance configured: reads `allowance_periods.completion_percentage` for the current period
2. For anyone without allowance configured (including mom): calculates raw task completion % from `task_completions` for the current week

**Deployment:** Assignable to ANY family member's dashboard — including mom's own. Each instance independently configured. Mom controls whether it appears on a child's dashboard. Never automatic.

**Critical:** This widget is **visibility only**. The app does not block, restrict, or lock any features or devices based on the color status. The power is in the child seeing their own number and knowing what it means, without mom having to be the one who says no.

**Widget type:** `privilege_status` registered in widget catalog. No separate feature key — covered by `allowance_basic`.

### Labeling Decision

All user-facing labels for homework/learning tracking use **"homework"** or **"homework tracking"** instead of "homeschool":
- Settings section: "Homework & Subjects" (not "Homeschool Subjects")
- Task checkbox: "Count toward homework tracking" (not "Count toward homeschool hours")
- Widget: "Log Learning" (unchanged — already universal)
- Internal table names (`homeschool_subjects`, `homeschool_configs`, `homeschool_time_logs`) and feature key (`homeschool_subjects`) are **unchanged**

### Open Questions — RESOLVED (2026-04-13)

| # | Question | Answer |
|---|---|---|
| 1 | First allowance period start | Start immediately, pro-rated from today. Same logic as new tasks mid-period. |
| 2 | Grace day UI location | Button on WeeklyProgressCard in Finances tab. Confirmed. |
| 3 | Business work hourly approval | Route through `family_requests` with `source='financial_approval'`. Confirmed. |
| 4 | AllowanceCalculatorTracker fallback | Keep existing calculation as fallback for unconfigured families, use PRD-28 data when config exists. Confirmed. |
| 5 | Proceed to Sub-phase A | After feature decision file update + re-approval. |

---

## Screens & Components

### Sub-phase A Screens

| Screen / Component | PRD Screen # | Notes |
|---|---|---|
| Allowance & Finances Settings (All Children) | Screen 1 | Cards per child with summary, [Configure], family financial summary. Entry: Settings → Allowance & Finances |
| Per-Child Allowance Configuration | Screen 2 | 8 collapsible sections (minus category buckets — replaced by per-task flags). All 3 approaches. Dual nav path. |
| Tasks Page → Finances Tab | Screen 4 | Mom-only. "What I Owe", per-child WeeklyProgressCard (with [+ Assign Makeup Work] + [Mark Grace Day]), recent transactions. |
| Per-Child Transaction History | Screen 5 | Full-screen ledger, filter tabs, date range, tappable detail, loan section. Also visible to Independent teens when enabled. |
| Payment Confirmation Modal | Screen 8 | Full/partial payment, optional note. Creates `payment_made` transaction. |
| Loan Creation Modal | Screen 9 | Amount, reason, repayment mode (manual/auto-deduct), optional interest. |
| Purchase Deduction Modal | Screen 10 | Amount (validated against balance), description. |
| Settings Section Entry | — | "Allowance & Finances" section in SettingsPage.tsx, mom-only |
| Allowance Calculator Widget Data Wiring | — | Wire existing `AllowanceCalculatorTracker` to read from real `allowance_periods` + `financial_transactions` |
| Independent Teen Balance Card | — | Balance card on Independent Personal Dashboard when `child_can_see_finances=true` |
| Task-Level Tracking Flags | — | 3 checkboxes in TaskCreationModal "Rewards & Completion Tracking" section (Addition 1) |
| Privilege Status Widget | — | New widget type: color-zone display (Red/Yellow/Green) with live completion % + mom's text descriptions (Addition 3) |
| Privilege Status Widget Config | — | Widget configuration panel in WidgetConfiguration.tsx: member picker, 3 threshold inputs, 3 text fields |
| Makeup Work Creation | — | [+ Assign Makeup Work] on WeeklyProgressCard → opens TaskCreationModal pre-configured with `task_type='makeup'`, `counts_for_allowance=true` (Addition 2) |

### Sub-phase B Screens

| Screen / Component | PRD Screen # | Notes |
|---|---|---|
| Homework & Subjects Configuration | Screen 3 | Family-wide subject list, time allocation mode, per-child overrides. Entry: Settings → Homework & Subjects |
| Log Learning Widget | Screen 6 | Dashboard widget: subject progress bars, "Log Learning" button, upcoming assignments with [Start] timer |
| Log Learning Modal | Screen 7 | Description + time + subject checkboxes + "Also add as Victory?" Play variant: subject icons + preset time buttons |
| Settings Section Entry | — | "Homework & Subjects" section in SettingsPage.tsx, conditional visibility via `useCanAccess('homeschool_subjects')` |

### Components List

| Component | Sub-phase | Notes |
|---|---|---|
| `AllowanceSettingsPage` | A | Full settings page for Allowance & Finances |
| `ChildAllowanceConfig` | A | Per-child configuration form (sans category buckets) |
| `FinancesTab` | A | New tab content for Tasks page |
| `TransactionHistory` | A | Full-screen ledger with filters |
| `TransactionCard` | A | Single transaction row (tappable for detail) |
| `PaymentModal` | A | Payment confirmation with full/partial |
| `LoanModal` | A | Loan creation with terms |
| `PurchaseDeductionModal` | A | Deduction from balance |
| `WeeklyProgressCard` | A | Per-child weekly summary with [Mark Grace Day] + [+ Assign Makeup Work] |
| `BalanceCard` | A | Compact balance for Independent shell dashboard |
| `PrivilegeStatusWidget` | A | Color-zone widget with live completion % |
| `PrivilegeStatusConfig` | A | Widget config: thresholds + descriptions |
| `HomeworkSettingsPage` | B | Subject config page (user-facing label: "Homework & Subjects") |
| `SubjectEditor` | B | Inline subject name/hours editing |
| `LogLearningWidget` | B | Dashboard widget |
| `LogLearningModal` | B | Learning submission modal + Play variant |

---

## Key PRD Decisions (Easy to Miss)

1. **DECIMAL(10,2) for all money fields.** Never floating point. All money calculations use DECIMAL arithmetic.
2. **`financial_transactions` is append-only.** Never update or delete records. Reversals are new negative `adjustment` records.
3. **`balance_after` on every transaction** provides audit trail. If `SUM(amount)` != latest `balance_after`, there's a data integrity issue.
4. **Play mode ALWAYS shows completion % only** — never dollar amounts, regardless of `child_can_see_finances` setting.
5. **Financial data is excluded from LiLa context assembly.** LiLa never references specific dollar amounts.
6. **Zero tasks assigned = 100% completion.** "Nothing was asked, nothing was missed." Full allowance earned.
7. **All grace days = 100% completion.** Same logic as zero tasks.
8. **Extra credit capped at restoring 100%.** Cannot push above 100%. Bonus threshold evaluated against capped %.
9. **Makeup window overlap:** Makeup completions apply to OLD period only. New period starts clean.
10. **Negative balance only through loans.** Payments and deductions cannot exceed balance unless loans enabled.
11. **Unmark cascade:** Update active `allowance_periods` running count + create negative `adjustment` transaction.
12. **Loan interest accrues on `remaining_balance`**, not `original_amount`.
13. **Auto-deduct with insufficient allowance:** Deduct whatever was earned. Carry shortfall. Child balance = $0.
14. **Log Learning submission → victory immediately** (if checkbox checked), NOT on approval.
15. **Log Learning widget is assignable to ANY family member** — not restricted to homework children.
16. **Homework time logs use minutes (INTEGER)** as base unit. Display converts to hours.
17. **Configuration hierarchy:** family default → per-child → per-subject → per-assignment. Each inherits unless set.
18. **Weekly allowance period only at MVP.** Biweekly/monthly deferred to PRD-35.
19. **Simple "mark as paid" with optional note.** No payment categories.
20. **Hourly rate business work:** `task_rewards.reward_type = 'hourly'`, `reward_amount` = hourly rate. Total = timer sessions × rate, pending mom approval.
21. **CATEGORY-BUCKET APPROACH REPLACED.** Per-task `counts_for_allowance` boolean flag replaces `allowance_configs.task_categories` checklist. (Founder Addition 1, 2026-04-13)
22. **Makeup work is `task_type = 'makeup'`.** Mom creates from WeeklyProgressCard. Counts toward current period. (Founder Addition 2, 2026-04-13)
23. **Privilege Status Widget is visibility only.** Never blocks features or devices. The math speaks for itself. (Founder Addition 3, 2026-04-13)
24. **Privilege Status Widget works WITHOUT allowance config.** For unconfigured members (including mom), it reads raw task completion % for the current week.
25. **User-facing labels use "homework" not "homeschool."** Internal table/key names unchanged. (Founder labeling decision, 2026-04-13)
26. **First allowance period starts immediately, pro-rated.** No waiting for next configured start day.
27. **`counts_for_gamification` default TRUE.** Preserves current behavior where all completions earn points. Mom can un-check per task. Requires updating `roll_creature_for_completion` RPC to respect the flag.

---

## Addendum Rulings

### From PRD-28-Cross-PRD-Impact-Addendum.md:
- PRD-09A Tasks page gains "Finances" tab (Mom shell only)
- `task_rewards.reward_type` needs `'hourly'` added
- Task completion now triggers THREE independent downstream systems: PRD-24 points, PRD-28 financial transactions, PRD-28 homework time logging
- Two new Universal Queue request sources: `'homeschool_child_report'`, `'financial_approval'`
- Settings gains "Allowance & Finances" and "Homework & Subjects" sections
- `victories.source = 'homeschool_logged'` — **ALREADY EXISTS** (migration 100102)
- PRD-36 (Universal Timer) — **ALREADY BUILT**

### From PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md:
- PRD-28B tables — **DEFERRED to separate build**

### From Founder Session (2026-04-13):
- Category-bucket approach on `allowance_configs` is **REPLACED** by per-task `counts_for_allowance` flag
- `allowance_configs.task_categories` and `allowance_configs.point_values` columns **REMOVED** from schema
- New `task_type = 'makeup'` for mom-assigned makeup work
- New `privilege_status` widget type
- "Homework" labeling in user-facing strings
- Task-level tracking flag checkboxes live in existing TaskCreationModal "Rewards & Completion Tracking" section
- `counts_for_gamification` flag enables per-task gamification control — `roll_creature_for_completion` RPC must respect it

---

## Database Changes Required

### New Tables (7)

1. **`allowance_configs`** — Per-child allowance configuration. Key columns: `weekly_amount DECIMAL(10,2)`, `calculation_approach TEXT` ('fixed'/'dynamic'/'points_weighted'), `default_point_value INTEGER DEFAULT 1`, `minimum_threshold INTEGER DEFAULT 0`, `bonus_threshold INTEGER DEFAULT 90`, `bonus_percentage INTEGER DEFAULT 20`, `rounding_behavior TEXT`, grace/makeup/extra-credit toggles, loan settings, `child_can_see_finances BOOLEAN`, period config. **NO `task_categories` or `point_values` columns** (replaced by per-task flags).
2. **`financial_transactions`** — Append-only financial ledger (12 columns, DECIMAL precision). INSERT-only RLS.
3. **`allowance_periods`** — Per-period tracking with calculation results (22 columns). Tracks `total_tasks_assigned`, `grace_day_tasks_excluded`, `tasks_completed`, `extra_credit_completed`, `effective_tasks_completed`, `completion_percentage`, amounts, bonus.
4. **`loans`** — Outstanding loans with repayment terms (16 columns).
5. **`homeschool_subjects`** — Family-wide subject list (7 columns) — *Sub-phase B*
6. **`homeschool_configs`** — Per-child homework config overrides (7 columns) — *Sub-phase B*
7. **`homeschool_time_logs`** — Per-task per-subject time records (15 columns) — *Sub-phase B*

### Modified Tables

| Table | Change | Risk |
|---|---|---|
| **`task_rewards`** | ALTER CHECK: add `'hourly'` to `reward_type` | 0 rows — zero risk |
| **`tasks`** | ADD 4 columns: `counts_for_allowance BOOLEAN DEFAULT false`, `counts_for_homework BOOLEAN DEFAULT false`, `counts_for_gamification BOOLEAN DEFAULT true`, `allowance_points INTEGER` (nullable) | Existing tasks unaffected — defaults preserve current behavior |
| **`tasks`** | ALTER CHECK: add `'makeup'` to `task_type` | Additive, no existing rows affected |
| **`task_templates`** | ADD 4 columns: same as `tasks` (inherited by deployed tasks) | Existing templates unaffected |

### Migrations

- **Sub-phase A:** `00000000100134_allowance_financial.sql`
  - Creates `allowance_configs`, `financial_transactions`, `allowance_periods`, `loans`
  - Alters `task_rewards` CHECK (add `'hourly'`)
  - Alters `tasks` (add 4 tracking flag columns + add `'makeup'` to task_type CHECK)
  - Alters `task_templates` (add 4 tracking flag columns)
  - RLS + indexes + updated_at triggers
  - 5 feature keys + feature_access_v2 grants
  - 2 pg_cron jobs (allowance calculation at :10, interest accrual at :15)
  - Registers `privilege_status` widget type in widget catalog
- **Sub-phase B:** `00000000100135_homeschool_tracking.sql`
  - Creates `homeschool_subjects`, `homeschool_configs`, `homeschool_time_logs`
  - RLS + indexes + updated_at triggers

### Edge Functions (2)

- **`calculate-allowance-period`** — Cron-triggered hourly at :10. Timezone-aware. Finds active periods past `period_end`. Calculates completion % from tasks WHERE `counts_for_allowance=true AND assignee_id=child`. Applies grace/makeup/extra-credit. Writes `allowance_earned` transaction. Handles auto-deduct loan repayments. Advances to next period.
- **`accrue-loan-interest`** — Cron-triggered hourly at :15. Timezone-aware. Interest on `remaining_balance`. Creates `interest_accrued` transaction.

### RPCs (1)

- **`calculate_running_balance(p_member_id UUID)`** — SECURITY DEFINER. Returns current balance from `financial_transactions`.

### RPC Update (1)

- **`roll_creature_for_completion`** — Add check: if `tasks.counts_for_gamification = false`, skip gamification pipeline entirely. Preserves existing behavior for all current tasks (default TRUE).

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `allowance_basic` | Essential | mom, dad_adults | Fixed Template approach, up to 3 children. Includes Privilege Status Widget. |
| `allowance_advanced` | Enhanced | mom, dad_adults | All 3 approaches, unlimited, Points-Weighted, bonus thresholds |
| `financial_tracking` | Enhanced | mom, dad_adults | Full transaction ledger, loans, purchase deductions, business work |
| `homeschool_subjects` | Enhanced | mom, dad_adults | Subject config and time logging (Sub-phase B) |
| `homeschool_compliance` | Full Magic | mom | Compliance reporting — **STUB** (PRD-28B) |

---

## Stubs — Do NOT Build This Phase

### PRD-28B (separate build)
- [ ] `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices` tables
- [ ] All compliance reporting UI, ESA invoicing, Standards portfolio, SDS reporting, Family Newsletter

### Post-MVP
- [ ] Biweekly/monthly allowance periods (PRD-35 integration)
- [ ] Business work export (formatted PDF/CSV)
- [ ] Financial summary on Mom's Overview (PRD-14C)
- [ ] Family Economy unified view (PRD-24 + PRD-28)
- [ ] Allowance history trend charts
- [ ] Dad payment delegation
- [ ] Teen purchase deduction requests via PRD-15 Messages
- [ ] `homeschool_time_review` LiLa guided mode (PRD-05 dependency)
- [ ] Homework budget/cost tracking
- [ ] Advanced financial reports

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Reads task completions | ← | PRD-09A Tasks | `task_completions` + `tasks.counts_for_allowance` flag |
| Reads timer sessions | ← | PRD-36 Universal Timer | `time_sessions` table (already built) |
| Controls gamification per-task | → | PRD-24 Gamification | `tasks.counts_for_gamification` flag checked by `roll_creature_for_completion` |
| Creates victories from Log Learning | → | PRD-11 Victory Recorder | `victories.source = 'homeschool_logged'` |
| Routes approvals | → | PRD-17 Universal Queue | `family_requests.source = 'homeschool_child_report'` / `'financial_approval'` |
| Provides data to widgets | → | PRD-10 Widgets | `allowance_periods` + `financial_transactions` + privilege status |
| Adds Finances tab + tracking flags | → | PRD-09A Tasks | New tab (Mom only) + 3 checkboxes in TaskCreationModal |
| Adds settings sections | → | PRD-22 Settings | "Allowance & Finances" + "Homework & Subjects" |
| Financial data excluded from context | — | PRD-05 LiLa | Never load financial data in `_shared/context-assembler.ts` |

---

## Things That Connect Back to This Feature Later

- **PRD-28B** — reads `homeschool_time_logs`, `homeschool_subjects`, compliance reports
- **PRD-14C** — financial summary widgets on Mom's Overview
- **PRD-15** — teen purchase deduction requests, financial approval notifications
- **PRD-05** — `homeschool_time_review` guided mode
- **PRD-35** — biweekly/monthly allowance periods

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] Addition 1 (task-level flags replacing category buckets) captured correctly
- [ ] Addition 2 (makeup work as `task_type='makeup'`) captured correctly
- [ ] Addition 3 (Privilege Status Widget) captured correctly
- [ ] Labeling decision ("homework" not "homeschool" in UI) captured correctly
- [ ] Schema changes correct (including `tasks` + `task_templates` columns, `task_type` CHECK, `roll_creature_for_completion` update)
- [ ] All 5 open questions answered and reflected
- [ ] Stubs confirmed
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed after build, before declaring the phase done.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
