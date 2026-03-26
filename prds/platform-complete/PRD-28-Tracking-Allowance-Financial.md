> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-28: Tracking, Allowance & Financial

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-17 (Universal Queue & Routing System), PRD-22 (Settings), PRD-24 (Gamification Overview & Foundation), PRD-36 (Universal Timer — not yet written)
**Created:** March 17, 2026
**Last Updated:** March 17, 2026

---

## Overview

PRD-28 is the real-money and multi-dimensional tracking engine for MyAIM Family. It covers three interconnected systems: the **Allowance Pool System** (percentage-based weekly allowance calculated from task completion), **Payment Tracking** (opportunity earnings, loans, deductions, and the full financial ledger), and **Homeschool Subject Tracking** (multi-subject time logging with configurable overlap modes for compliance reporting). Together, these systems answer the questions every family manager carries in her head: "What do I owe each kid? Did they do what they were supposed to? How many hours of math did we log this week?"

The financial system is entirely separate from PRD-24's gamification points. Gamification points are in-app currency (integers) that drive Visual Worlds and reward menus. PRD-28 handles real money (DECIMAL precision) — allowance earned, work completed, payments made, loans and repayments. The two systems share the same trigger source (task completions) but maintain separate ledgers, separate balances, and separate configuration surfaces.

The homeschool tracking system transforms MyAIM from a task manager into a compliance-ready educational platform. A single completed task can simultaneously count toward an allowance pool, earn gamification points, and log hours across multiple academic subjects — all without mom doing any manual bookkeeping. The data model supports the queries that state reporting requires (hours per subject per child per date range), while the reporting UI itself is deferred as a side quest.

> **Mom experience goal:** I set up each kid's allowance once — their weekly amount, which tasks count, and how I want it calculated. After that, the system does the math every week. I can see what I owe everyone at a glance, mark things as paid, and know that my homeschool hours are being logged accurately without me keeping a spreadsheet. When my son does work for my business, his hours and earnings show up as clean records I can reference later. The whole financial picture for my family is in one place.

---

## Architectural Boundaries

### What PRD-28 Owns

| System | Scope |
|--------|-------|
| Allowance pool configuration | Per-child weekly amount, calculation approach (Fixed/Dynamic/Points-Weighted), task category selection, bonus thresholds, grace mechanisms |
| Allowance calculation engine | End-of-period % calculation, grace day exclusions, makeup window, extra credit, period closing |
| Financial transaction ledger | Append-only record of all real-money movements per child |
| Financial balances | Running balance per child (what mom owes), derived from ledger |
| Payment tracking | Mom marks payments, optional notes |
| Loan system | Borrow against future earnings, optional interest, repayment tracking |
| Homeschool subject configuration | Family-wide subject list, per-child hour targets, time allocation modes |
| Homeschool time logging | Per-task subject-time records, integration with Universal Timer (PRD-36) |
| Log Learning widget | Child-facing entry point for reporting unplanned learning |
| Mom's financial overview | Finances tab on Tasks page, summary cards in Settings |

### What Other PRDs Own (Not Duplicated Here)

| PRD | What It Owns | How PRD-28 Connects |
|-----|-------------|---------------------|
| PRD-09A (Tasks) | Task completions, task_rewards table, opportunity claiming | PRD-28 reads task_completions and task_rewards to calculate allowance and opportunity earnings |
| PRD-10 (Widgets) | Allowance Calculator widget rendering, dashboard grid, widget configuration modal | PRD-28 defines the calculation engine; PRD-10 renders the widget display |
| PRD-17 (Universal Queue) | Requests tab, approval flow infrastructure | Homeschool child reports and financial approvals route through PRD-17's Requests tab |
| PRD-22 (Settings) | Settings overlay container, category navigation | PRD-28 defines the Allowance & Finances settings screens hosted within PRD-22's framework |
| PRD-24 (Gamification) | Points system, gamification_events ledger, reward menu | Completely separate ledger. Task completion fires both PRD-24 points AND PRD-28 financial calculations independently |
| PRD-36 (Universal Timer) | Time session recording, start/stop/Pomodoro UI, concurrent timer support | PRD-28 consumes timer session data for homeschool time logging and hourly-rate business work calculations |

---

## User Stories

### Allowance (Mom)
- As a mom, I want to set each child's weekly allowance amount so the system calculates what they earn based on what they complete.
- As a mom, I want to choose which task categories count toward each child's allowance so chores and schoolwork count but "fun" tasks don't.
- As a mom, I want to pick between Fixed, Dynamic, and Points-Weighted calculation approaches per child so I can match each child's situation.
- As a mom, I want to set a bonus threshold (e.g., 90% completion = 20% bonus) to reward kids who go above and beyond.
- As a mom, I want to mark grace days when life happens so sick days and field trips don't penalize the allowance calculation.
- As a mom, I want to give kids a makeup window to complete missed tasks after the period ends so they have a chance to earn back what they missed.
- As a mom, I want to designate certain extra tasks as "extra credit" so kids can do additional work to offset missed tasks.

### Allowance (Children)
- As a teen (Independent), I want to see my weekly progress and estimated allowance so I know where I stand before the week ends.
- As a child (Guided/Play), I want to see my task completion percentage without dollar amounts so I'm motivated by progress, not money (if mom configures it that way).

### Payment Tracking (Mom)
- As a mom, I want to see what I owe each child at a glance — allowance earned plus opportunity earnings minus payments made.
- As a mom, I want to mark payments as "paid" with an optional note so I can track how I paid (cash, savings deposit, etc.) without the system requiring categories.
- As a mom, I want to see a complete transaction history per child so I can look back at what was earned, when, and why.

### Opportunity Earnings
- As a mom, I want opportunity task completions to automatically record the monetary reward so I don't have to manually enter what I owe.
- As a mom, I want business work tasks to auto-calculate earnings from timer sessions × hourly rate, pending my approval, so I have clean work records for my kids' employment.
- As a child, I want to see my earnings from completed jobs separately from my allowance so I know what I earned through extra effort.

### Loans & Deductions
- As a mom, I want to create a loan when my child borrows against future earnings so there's a clear record of what they owe back.
- As a mom, I want to optionally add interest to a loan so I can teach financial literacy while my kids are still at home.
- As a child (Independent), I want to request a purchase deduction from my balance so I can buy something without mom handing me cash.
- As a mom, I want to see loan balances and repayment progress per child so I know how much they still owe.

### Homeschool Tracking (Mom)
- As a homeschool mom, I want to configure my family's subjects once so every homeschool task can be tagged with the right subjects.
- As a homeschool mom, I want to choose how multi-subject time is counted (Full, Weighted, or Strict mode) so my records match my state's requirements.
- As a homeschool mom, I want to see hours logged per subject per child per week so I know if we're on track.
- As a homeschool mom, I want to pull a date-range report of hours per subject per child so I can fill out compliance paperwork.

### Homeschool Tracking (Children)
- As a homeschool student, I want to log unplanned learning ("I read about volcanoes for an hour") through a widget on my dashboard so it counts toward my school hours.
- As a homeschool student, I want to tap on a pre-configured school assignment, mark it complete, and have the subjects and time auto-logged so I don't have to do bookkeeping.
- As a Play mode child, I want to tap a subject icon and a time button to log what I did so it's easy even if I can't type well yet.

### Learning Tracking (Adults & Teens)
- As a mom, I want to track my own continuing education or personal development hours using the same Log Learning widget I set up for my kids.
- As a teen (Independent), I want to self-assign a Log Learning widget and track my independent study hours without needing mom's approval for every entry.
- As a dad, I want to log certification study hours so I have a record of time invested in professional development.

### Financial Overview (Mom)
- As a mom, I want a Finances tab on the Tasks page showing all children's balances, recent transactions, and weekly summaries so the financial picture is always accessible from where tasks live.

---

## Screens

### Screen 1: Allowance & Finances Settings (All Children)

**Entry point:** Settings → Allowance & Finances

> **Depends on:** Settings overlay container — defined in PRD-22.

**What the user sees:**

Top-level view shows a card per child with summary info:

```
┌─────────────────────────────────┐
│ Jake (age 14)                   │
│ $14.00/week · Dynamic Pool      │
│ Balance: $23.44 owed            │
│ [Configure]                     │
├─────────────────────────────────┤
│ Emma (age 10)                   │
│ $10.00/week · Fixed Template    │
│ Balance: $7.20 owed             │
│ [Configure]                     │
├─────────────────────────────────┤
│ Lily (age 6)                    │
│ $6.00/week · Fixed Template     │
│ Balance: $0.00 (paid up)        │
│ [Configure]                     │
├─────────────────────────────────┤
│ [+ Set Up Allowance for...]     │
│ (shows children without config) │
└─────────────────────────────────┘
```

Below the child cards: a **Family Financial Summary** section showing total owed across all children, total paid this month, and a "View All Transactions" link to the Tasks → Finances tab.

**Interactions:**
- Tapping [Configure] on a child opens Screen 2 (Per-Child Allowance Configuration)
- Tapping [+ Set Up Allowance for...] shows a picker of children who don't have allowance configured yet
- Tapping "View All Transactions" navigates to Tasks → Finances tab

**Data created/updated:**
- No data created on this screen — it's a navigation/overview surface

---

### Screen 2: Per-Child Allowance Configuration

**Entry points:** Settings → Allowance & Finances → [Configure] on a child, OR Family Management → Child → Allowance & Finances

> **Decision rationale:** Two navigation paths to the same screen. Settings path is for "configure the family economy." Family Management path is for "configure everything about this child."

**What the user sees:**

A scrollable configuration form organized into sections with progressive disclosure:

**Section 1: Basic Setup**
- Weekly allowance amount (currency input, default: $1 × child's age)
- Calculation approach (segmented control with descriptions):
  - **Fixed Template** — "Set a fixed weekly task schedule. Best for consistent routines." (Approach A)
  - **Dynamic Pool** — "Tasks are counted dynamically each week. Best for variable schedules." (Approach B)
  - **Points-Weighted** — "Different tasks worth different points. Best for incentivizing harder tasks." (Approach C)

**Section 2: Task Categories** (expandable)
- Multi-select checklist of task categories that count toward allowance. Categories are derived from `life_area_tag` values plus custom categories mom has created:
  - [ ] Homework / Schoolwork
  - [ ] Chores (general)
  - [ ] Reading
  - [ ] Exercise / Physical activity
  - [ ] Personal hygiene / Self-care routine
  - [ ] Kindness / Service acts
  - [ ] Practice (instrument, sport, skill)
  - [ ] Creative projects
  - [ ] Helping siblings
  - [ ] Following schedule / Being on time
  - [ ] Screen time limits respected
  - [ ] Custom category (mom defines)

> **Decision rationale:** These categories map to task tags, not to the `life_area_tag` enum directly. A task tagged `life_area_tag = 'homeschool'` would match "Homework / Schoolwork." The mapping is defined once in the allowance config and evaluated at calculation time.

**Section 3: Points Configuration** (visible only for Approach C — Points-Weighted)
- Per-category point values (e.g., Homework = 3 pts, Chores = 1 pt, Reading = 2 pts)
- Default point value for uncategorized tasks

**Section 4: Bonus & Thresholds** (expandable)
- Minimum threshold: completion percentage below which the child earns nothing (default: 0% — no minimum)
- Bonus threshold: completion percentage above which a bonus is awarded (default: 90%)
- Bonus percentage: additional percentage of base allowance awarded as bonus (default: 20%)
- Rounding behavior: round up / round down / exact to nearest cent (default: round to nearest cent)

**Section 5: Grace Mechanisms** (expandable)
- Grace Days: toggle enabled/disabled (default: enabled). When enabled, mom can mark specific days as grace days during or after the week.
- Makeup Window: toggle enabled/disabled (default: disabled). When enabled, configurable window duration (1, 2, or 3 days after period ends).
- Extra Credit: toggle enabled/disabled (default: disabled). When enabled, mom designates qualifying tasks.

> **Forward note:** Makeup window and extra credit add calculation complexity. Enabled by default = off. Mom opts in per child.

**Section 6: Visibility** (expandable)
- "Child can see financial details" toggle (default: ON for Independent, OFF for Guided/Play)
- When OFF: child's Allowance Calculator widget shows completion percentage only, no dollar amounts
- When ON: child sees full financial details including balance, transaction history, and dollar amounts

**Section 7: Period Configuration**
- Allowance period: Weekly (default, only option at MVP)
- Week starts on: day picker (default: Sunday)
- Calculation time: time picker (default: 11:59 PM on last day of period)

> **Deferred:** Biweekly and monthly periods — Post-MVP enhancement, will use Universal Scheduler (PRD-35) component for period configuration when implemented.

**Section 8: Loan Settings** (expandable)
- Allow loans: toggle enabled/disabled (default: disabled)
- Interest enabled: toggle (default: disabled, only visible when loans enabled)
- Interest rate: percentage input (default: 0%)
- Interest accrual period: weekly / monthly (default: monthly)
- Maximum loan amount: currency input (optional — no max by default)

**Interactions:**
- All changes auto-save (debounced, same pattern as PRD-22 Settings)
- Changing calculation approach shows a confirmation if there's an active period: "Changing the approach mid-week will recalculate this week's progress using the new method."
- "Preview This Week" button at bottom shows a real-time calculation preview based on current task completion data

**Data created/updated:**
- `allowance_configs` record (one per child, upsert)

---

### Screen 3: Homeschool Subject Configuration

**Entry point:** Settings → Homeschool Subjects

> **Decision rationale:** Homeschool subjects are a family-wide configuration that affects task creation and time logging across all homeschool children. Separate from per-child allowance config because subjects are shared across the family.

**What the user sees:**

A list of configured subjects with suggested defaults pre-populated on first visit:

```
Your Family's Subjects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Math                    [Edit] [×]
  Default: 5 hrs/week per child

Reading / Language Arts  [Edit] [×]
  Default: 3.75 hrs/week per child

Science                  [Edit] [×]
  Default: 3 hrs/week per child

History & Geography      [Edit] [×]
  Default: 2.5 hrs/week per child

Art                      [Edit] [×]
  Default: 1 hr/week per child

Music                    [Edit] [×]
  Default: 1 hr/week per child

Physical Education       [Edit] [×]
  Default: 2.5 hrs/week per child

[+ Add Subject]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Time Allocation Mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
● Full — Every subject gets full session time
○ Weighted — LiLa or mom allocates (can exceed session time)
○ Strict — Time divided to equal actual session duration

Default for: ○ All children  ● Per child (configure below)

[Jake: Full]  [Emma: Strict]  [Lily: Full]
```

**Interactions:**
- [Edit] opens inline editing: rename subject, set weekly hour target (family-wide default), set per-child overrides for hour targets
- [+ Add Subject] adds a new custom subject with name and optional hour target
- [×] archives a subject (doesn't delete — historical time logs still reference it)
- Time allocation mode selector: family-wide default with per-child override toggle
- Per-child override chips: tapping opens a picker to set that child's mode

**Data created/updated:**
- `homeschool_subjects` records
- `homeschool_configs` record (family-wide and per-child settings)

---

### Screen 4: Tasks Page — Finances Tab

**Entry point:** Tasks page → Finances tab (visible to Mom / Primary Parent only)

> **Depends on:** Tasks page tab structure — defined in PRD-09A. PRD-28 adds the "Finances" tab alongside My Tasks, Routines, Opportunities, Sequential, Queue.

**What the user sees:**

**Top section: Family Financial Summary**

```
What I Owe
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jake:    $23.44  (allowance $13.44 + jobs $10.00)
Emma:    $7.20   (allowance $7.20)
Lily:    $0.00   (paid up ✓)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:   $30.64

[Pay All]  [Pay Selected]
```

**Middle section: This Week's Progress** (one card per child with allowance enabled)

```
┌─ Jake's Week (Dynamic Pool) ─────────────┐
│ Tasks completed: 37 of 44                 │
│ [████████████████░░░░] 84.1%              │
│ Estimated allowance: $11.77 of $14.00     │
│                                           │
│ Grace days: Wednesday (sick)              │
│ Extra credit: 2 tasks completed           │
│ Adjusted: 37 of 37 → 100% → $14.00 + $2.80 bonus │
│ [View Breakdown]                          │
└───────────────────────────────────────────┘
```

**Bottom section: Recent Transactions** (unified across all children, most recent first)

```
Recent Transactions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mar 16  Jake   +$10.00  Deep clean garage (Opportunity)
Mar 15  Jake   +$14.00  Weekly allowance (100% + bonus)
Mar 15  Emma   +$7.20   Weekly allowance (72%)
Mar 14  Jake   -$15.00  Paid (cash — birthday shopping)
Mar 10  Emma   +$5.00   Organized pantry (Opportunity)
...
[View Full History]  [Filter by Child ▼]
```

**Interactions:**
- [Pay All] opens a confirmation modal: "Mark all balances as paid?" with optional note field. Creates one `payment_made` transaction per child.
- [Pay Selected] shows checkboxes on each child row for selective payment.
- [View Breakdown] expands to show the per-category task completion detail for that child's week.
- [View Full History] navigates to a full-screen transaction ledger with date range filters, child filter, and transaction type filter.
- [Filter by Child] filters the recent transactions list.
- Each transaction row is tappable for detail view (shows source task, date/time, any notes).

**Data created/updated:**
- `financial_transactions` records (when payments are made)
- No other data created — this is primarily a read surface

---

### Screen 5: Per-Child Transaction History

**Entry point:** Finances tab → View Full History, or Finances tab → child name tap

**What the user sees:**

Full-screen ledger for one child (child selector at top to switch):

```
Jake's Financial History
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Balance: $23.44

[All] [Allowance] [Jobs] [Payments] [Loans]

Date Range: [Last 30 Days ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mar 16  +$10.00  Deep clean garage
        Opportunity · Completed and approved

Mar 15  +$14.00  Weekly allowance
        Week of Mar 9-15 · 100% + bonus
        37/37 adjusted tasks (1 grace day applied)

Mar 14  -$15.00  Payment
        Cash — birthday shopping

Mar 12  +$2.50   Content organization (2.5 hrs @ $10/hr)
        Business Work · Timer verified

Mar 8   +$12.60  Weekly allowance
        Week of Mar 2-8 · 90%
        53/59 tasks

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Loans Outstanding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$20.00 borrowed Mar 1 · $12.00 remaining
Interest: 2%/month · Next accrual: Apr 1
Repayment: $4.00/week auto-deducted from allowance
[View Loan Details]
```

**Interactions:**
- Filter tabs (All, Allowance, Jobs, Payments, Loans) filter transaction types
- Date range picker for historical queries
- Each transaction is tappable for full detail including source task link
- [View Loan Details] shows loan terms, repayment history, interest accruals
- For Independent teens (when child visibility is ON): this same screen is available in their shell, filtered to their own data only

**Data created/updated:**
- No data created — read-only surface

---

### Screen 6: Log Learning Widget

**What the user sees:**

A widget assignable to any family member's dashboard — homeschool children, Independent teens, and adults. Mom assigns it (or adults/Independent teens self-assign). The widget shows today's subject/learning progress and provides the Log Learning entry point. For Play mode children, the widget shows a simplified view with larger tap targets and subject icons instead of progress bars.

> **Decision rationale:** Learning tracking is not inherently child-only or homeschool-only. Adults tracking continuing education, certification hours, or personal development use the same pattern. The widget is the universal "log what I learned and how long it took" surface.

```
┌─ Today's School ─────────────────────────┐
│                                           │
│ Math:     45 min / 60 min  [███████░░░]   │
│ Reading:  30 min / 45 min  [██████░░░░]   │
│ Science:  0 min / 36 min   [░░░░░░░░░░]   │
│ History:  0 min / 30 min   [░░░░░░░░░░]   │
│                                           │
│ Total today: 1.25 hrs / 2.85 hrs          │
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ 📚 Log Learning                     │   │
│ │ Record something you learned today  │   │
│ └─────────────────────────────────────┘   │
│                                           │
│ Upcoming:                                 │
│ ○ Science — Chapter 8 Review              │
│ ○ History — Civil War Timeline            │
│                                           │
│ [▶ Start] on each upcoming assignment     │
└───────────────────────────────────────────┘
```

**Interactions:**
- Subject progress bars update in real time as tasks are completed or time is logged
- [Log Learning] opens the Log Learning modal (Screen 7)
- [▶ Start] on an upcoming assignment starts the Universal Timer (PRD-36) for that task and navigates to the task's timer view
- Tapping a completed subject row shows the detail of what was logged

**Data created/updated:**
- No data created directly — this widget reads from `homeschool_time_logs` and `tasks`

---

### Screen 7: Log Learning Modal

**Entry point:** Log Learning Widget → [Log Learning]

> **Decision rationale:** This is a widget modal interaction. For Guided and Play children, it opens as a modal over their dashboard — no shell permission changes needed. The widget is the permission boundary. For adults and Independent teens, the same modal but submission goes directly to confirmed status (no approval routing).

**What the user sees:**

A modal with a simple form:

```
┌─ Log Learning ──────────────────────────┐
│                                          │
│ What did you do?                         │
│ ┌──────────────────────────────────────┐ │
│ │ I read about volcanoes and wrote a   │ │
│ │ summary of what I learned...         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ How long? (optional)                     │
│ [1] hr [30] min   OR   [Use Timer ▶]    │
│                                          │
│ Subjects (optional — LiLa can estimate): │
│ ☑ Science    ☑ Reading    ☐ Writing      │
│ ☐ Math       ☐ History    ☐ Art          │
│                                          │
│        [Submit]                          │
│                                          │
│ ☑ Also add as a Victory? 🎉             │
└──────────────────────────────────────────┘
```

**Play mode variant:** Simplified — larger buttons, subject icons instead of checkboxes, "What did you do?" is optional (parent/LiLa fills in detail during review). Primary interaction is tap subject icon + tap time (preset buttons: 15 min, 30 min, 1 hr) + tap submit.

**Interactions:**
- Text field for description (required for Guided/Independent/Adult; optional for Play)
- Time entry: manual input OR start the Universal Timer (PRD-36) which logs the session
- Subject checkboxes: pre-populated from family's `homeschool_subjects`. Optional — if user skips, LiLa estimates during review.
- Submit behavior varies by role:
  - **Play / Guided children:** Creates a homeschool approval request in mom's Universal Queue (PRD-17) Requests tab. Time logs saved with `status = 'pending'`.
  - **Independent teens:** Direct submission (status = 'confirmed') unless mom has configured approval requirement for this child.
  - **Adults (Mom, Dad):** Direct submission (status = 'confirmed'). No approval routing.
- "Also add as a Victory?" checkbox (default: checked): if checked, creates a victory record with `source = 'homeschool_logged'` after submission
- If subjects are selected AND time is entered, LiLa applies the family's time allocation mode (Full/Weighted/Strict) to generate the per-subject time log entries as a draft (for review if child, or direct save if adult)

**Data created/updated:**
- `homeschool_approval_queue` record (routes to Universal Queue Requests tab with `source: 'homeschool_child_report'`)
- `victories` record (if checkbox checked, with `source = 'homeschool_logged'`)
- `homeschool_time_logs` records created in `pending` status (finalized when mom approves)

---

### Screen 8: Payment Confirmation Modal

**Entry point:** Finances tab → [Pay All] or [Pay Selected] or per-child → [Mark as Paid]

**What the user sees:**

```
┌─ Mark as Paid ──────────────────────────┐
│                                          │
│ Paying: Jake — $23.44                    │
│                                          │
│ Note (optional):                         │
│ ┌──────────────────────────────────────┐ │
│ │ Cash — from birthday shopping trip   │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Amount to pay:                           │
│ ● Full balance ($23.44)                  │
│ ○ Partial amount: [$___.__]              │
│                                          │
│        [Confirm Payment]  [Cancel]       │
└──────────────────────────────────────────┘
```

**Interactions:**
- Full or partial payment selection
- Optional note field
- [Confirm Payment] creates a `payment_made` transaction, reduces balance
- If partial payment, the remaining balance persists

**Data created/updated:**
- `financial_transactions` record with type = `payment_made`

---

### Screen 9: Loan Creation Modal

**Entry point:** Per-child transaction history → [New Loan] or Finances tab → child → [Loan]

**What the user sees:**

```
┌─ Create Loan ───────────────────────────┐
│                                          │
│ Borrower: Jake                           │
│                                          │
│ Amount: [$20.00]                          │
│                                          │
│ Reason (optional):                       │
│ ┌──────────────────────────────────────┐ │
│ │ Advance for video game — will repay  │ │
│ │ from allowance                       │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Repayment:                               │
│ ○ Manual (I'll track repayments myself)  │
│ ● Auto-deduct from allowance             │
│   Amount per period: [$4.00]             │
│                                          │
│ Interest:                                │
│ ○ None                                   │
│ ● Add interest: [2]% per [month ▼]      │
│                                          │
│        [Create Loan]  [Cancel]           │
└──────────────────────────────────────────┘
```

**Interactions:**
- Amount input (validated against maximum loan amount if configured)
- Repayment mode: manual or auto-deduct from allowance (configurable amount per period)
- Interest: none or configurable rate + accrual period
- [Create Loan] creates a `loan_issued` transaction and a `loans` record for ongoing tracking
- If auto-deduct is enabled, system automatically creates `loan_repayment` transactions each allowance period

**Data created/updated:**
- `financial_transactions` record with type = `loan_issued`
- `loans` record for ongoing tracking

---

### Screen 10: Purchase Deduction Modal

**Entry point:** Per-child transaction history → [Deduction] (mom-initiated) OR child requests via Messages/Requests (PRD-15) for Independent teens

**What the user sees:**

```
┌─ Purchase Deduction ────────────────────┐
│                                          │
│ Child: Jake                              │
│ Current balance: $23.44                  │
│                                          │
│ Amount: [$12.99]                          │
│                                          │
│ What was purchased:                      │
│ ┌──────────────────────────────────────┐ │
│ │ Minecraft expansion pack             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ New balance after deduction: $10.45      │
│                                          │
│        [Confirm Deduction]  [Cancel]     │
└──────────────────────────────────────────┘
```

**Interactions:**
- Amount validated against current balance (cannot exceed balance unless loans are enabled)
- Description required
- [Confirm Deduction] creates a `purchase_deduction` transaction

**Data created/updated:**
- `financial_transactions` record with type = `purchase_deduction`

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full access | All configuration, all children's data, all transaction history, payment actions, loan management |
| Dad / Additional Adult | Read access to children's financial data if permitted by mom (PRD-02) | Cannot configure allowance. Can mark payments if mom enables. Cannot create loans. |
| Special Adult | No access | Financial data is not visible during caregiver shifts. Caregivers log task completions which may trigger financial calculations, but they don't see the financial layer. |
| Independent (Teen) | Read own financial data (if `child_can_see_finances = true`) | Sees own balance, transaction history, allowance progress. Can request purchase deductions. Cannot see siblings' data. Cannot modify configuration. |
| Guided / Play | Widget-only access | Sees Allowance Calculator widget (completion % only if `child_can_see_finances = false`, full detail if true). Interacts with Log Learning widget via modal. No access to transaction history or configuration. |

### Shell Behavior

| Shell | What Appears | What's Different |
|-------|-------------|-----------------|
| Mom Shell | Finances tab on Tasks page. Allowance & Finances in Settings. Financial summary cards on child profiles. Homeschool Subject Configuration in Settings. | Full financial management surface. |
| Dad Shell | Read-only financial summary for permitted children. No Finances tab unless mom enables. | No configuration access. May have payment marking if mom delegates. |
| Special Adult Shell | Not present. | Financial data excluded from caregiver view entirely. |
| Independent Shell | Balance card on Personal Dashboard (if visibility enabled). Own transaction history accessible. Purchase deduction request. Allowance Calculator widget. | Own data only. No configuration. No sibling data. |
| Guided Shell | Allowance Calculator widget (if assigned by mom). Log Learning widget (if assigned by mom). | Widget modal interactions only. No navigation to financial pages. |
| Play Shell | Allowance Calculator widget showing completion % only (if assigned by mom). | No dollar amounts even if visibility is enabled — Play mode always shows % only. |

> **Decision rationale:** Play mode children (typically ages 3-7) always see completion percentage only, never dollar amounts, regardless of the `child_can_see_finances` setting. Money concepts at this age should be handled by parents in person, not by the app.

### Privacy & Transparency
- Teens can see their own financial data when enabled but cannot see siblings' data
- Dad can see children's financial summaries but cannot see mom's personal financial notes or loan reasoning
- All financial data is excluded from LiLa context assembly — LiLa never references specific dollar amounts in conversations

---

## Data Schema

### Table: `allowance_configs`

One record per child. Stores all allowance and financial configuration for that child.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| enabled | BOOLEAN | true | NOT NULL | Master allowance toggle |
| weekly_amount | DECIMAL(10,2) | 0.00 | NOT NULL | Base weekly allowance |
| calculation_approach | TEXT | 'dynamic' | NOT NULL | 'fixed', 'dynamic', 'points_weighted' |
| task_categories | JSONB | '[]' | NOT NULL | Array of category strings that count toward allowance |
| point_values | JSONB | '{}' | NOT NULL | Category → point value mapping (Approach C only) |
| default_point_value | INTEGER | 1 | NOT NULL | Points for uncategorized tasks (Approach C only) |
| minimum_threshold | INTEGER | 0 | NOT NULL | % below which child earns nothing |
| bonus_threshold | INTEGER | 90 | NOT NULL | % above which bonus is awarded |
| bonus_percentage | INTEGER | 20 | NOT NULL | Bonus as % of base amount |
| rounding_behavior | TEXT | 'nearest_cent' | NOT NULL | 'round_up', 'round_down', 'nearest_cent' |
| grace_days_enabled | BOOLEAN | true | NOT NULL | |
| makeup_window_enabled | BOOLEAN | false | NOT NULL | |
| makeup_window_days | INTEGER | 2 | NOT NULL | Days after period end for makeup |
| extra_credit_enabled | BOOLEAN | false | NOT NULL | |
| child_can_see_finances | BOOLEAN | | NOT NULL | Default set by shell: true for Independent, false for Guided/Play |
| period_type | TEXT | 'weekly' | NOT NULL | 'weekly' (MVP). Future: 'biweekly', 'monthly' |
| period_start_day | TEXT | 'sunday' | NOT NULL | Day of week the period starts |
| calculation_time | TIME | '23:59:00' | NOT NULL | When end-of-period calculation runs |
| loans_enabled | BOOLEAN | false | NOT NULL | |
| loan_interest_enabled | BOOLEAN | false | NOT NULL | |
| loan_default_interest_rate | DECIMAL(5,2) | 0.00 | NOT NULL | Default interest % for new loans |
| loan_interest_period | TEXT | 'monthly' | NOT NULL | 'weekly' or 'monthly' |
| loan_max_amount | DECIMAL(10,2) | | NULL | NULL = no maximum |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read own (to determine visibility settings). Dad reads children if permitted.

**Indexes:**
- `(family_member_id)` UNIQUE — one config per child
- `(family_id)` — family-level queries

---

### Table: `financial_transactions`

Append-only ledger of all real-money movements. Never updated or deleted.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (the child) |
| transaction_type | TEXT | | NOT NULL | Enum: 'allowance_earned', 'opportunity_earned', 'payment_made', 'purchase_deduction', 'loan_issued', 'loan_repayment', 'interest_accrued', 'adjustment' |
| amount | DECIMAL(10,2) | | NOT NULL | Positive for earned/owed, negative for payments/deductions |
| balance_after | DECIMAL(10,2) | | NOT NULL | Running balance after this transaction |
| description | TEXT | | NOT NULL | Human-readable: "Weekly allowance — 84% of $14.00" or "Deep clean garage" or "Content organization — 2.5 hrs @ $10/hr" |
| source_type | TEXT | | NULL | 'task', 'allowance_period', 'manual', 'loan', 'interest' |
| source_reference_id | UUID | | NULL | FK to source record (task_id, allowance_period_id, loan_id) |
| category | TEXT | | NULL | Optional: 'allowance', 'household', 'business_work', 'personal' |
| note | TEXT | | NULL | Mom's optional note (e.g., "paid cash", "deducted for Minecraft") |
| metadata | JSONB | '{}' | NOT NULL | Additional context (period details, timer session IDs, etc.) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | Immutable timestamp |

**RLS Policy:** Family-scoped. Mom reads all. Members read own. Append-only — no updates or deletes.

**Indexes:**
- `(family_member_id, created_at DESC)` — member transaction history
- `(family_id, created_at DESC)` — family-wide history
- `(family_member_id, transaction_type)` — filtered views
- `(source_type, source_reference_id)` — traceability

> **Decision rationale:** DECIMAL(10,2) for all money fields. Never use floating point for currency. The `balance_after` field provides an audit trail — any discrepancy between sum of transactions and the balance_after on the latest record indicates a data integrity issue.

---

### Table: `allowance_periods`

Tracks each calculation period with its results.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| period_start | DATE | | NOT NULL | First day of the period |
| period_end | DATE | | NOT NULL | Last day of the period |
| status | TEXT | 'active' | NOT NULL | 'active', 'makeup_window', 'calculated', 'closed' |
| total_tasks_assigned | INTEGER | 0 | NOT NULL | Denominator before grace |
| grace_day_tasks_excluded | INTEGER | 0 | NOT NULL | Tasks removed from denominator |
| effective_tasks_assigned | INTEGER | 0 | NOT NULL | Denominator after grace |
| tasks_completed | INTEGER | 0 | NOT NULL | Regular completions |
| extra_credit_completed | INTEGER | 0 | NOT NULL | Extra credit tasks completed |
| effective_tasks_completed | INTEGER | 0 | NOT NULL | Numerator (completed + extra credit) |
| completion_percentage | DECIMAL(5,2) | 0.00 | NOT NULL | Capped at 100% for allowance calc |
| base_amount | DECIMAL(10,2) | | NOT NULL | Configured weekly amount |
| calculated_amount | DECIMAL(10,2) | 0.00 | NOT NULL | base × percentage |
| bonus_applied | BOOLEAN | false | NOT NULL | Did they hit the bonus threshold? |
| bonus_amount | DECIMAL(10,2) | 0.00 | NOT NULL | Additional bonus amount |
| total_earned | DECIMAL(10,2) | 0.00 | NOT NULL | calculated + bonus |
| grace_days | JSONB | '[]' | NOT NULL | Array of dates marked as grace days |
| calculation_details | JSONB | '{}' | NOT NULL | Full breakdown: per-category counts, point totals (Approach C), etc. |
| calculated_at | TIMESTAMPTZ | | NULL | When the period was calculated |
| closed_at | TIMESTAMPTZ | | NULL | When the period was finalized |
| closed_early | BOOLEAN | false | NOT NULL | Mom manually closed the period |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all. Members read own.

**Indexes:**
- `(family_member_id, period_start DESC)` — member period history
- `(family_id, status)` — active periods
- `(family_member_id, status)` — member's active period

---

### Table: `loans`

Tracks outstanding loans with repayment terms.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| original_amount | DECIMAL(10,2) | | NOT NULL | Amount borrowed |
| remaining_balance | DECIMAL(10,2) | | NOT NULL | Current outstanding amount |
| reason | TEXT | | NULL | Description of what the loan is for |
| repayment_mode | TEXT | 'manual' | NOT NULL | 'manual' or 'auto_deduct' |
| auto_deduct_amount | DECIMAL(10,2) | | NULL | Amount to deduct per allowance period |
| interest_rate | DECIMAL(5,2) | 0.00 | NOT NULL | Interest rate percentage |
| interest_period | TEXT | 'monthly' | NOT NULL | 'weekly' or 'monthly' |
| interest_last_accrued | DATE | | NULL | Last date interest was calculated |
| total_interest_accrued | DECIMAL(10,2) | 0.00 | NOT NULL | Running total of interest charged |
| status | TEXT | 'active' | NOT NULL | 'active', 'paid_off', 'forgiven' |
| issued_at | TIMESTAMPTZ | now() | NOT NULL | |
| paid_off_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read own.

**Indexes:**
- `(family_member_id, status)` — active loans per member
- `(family_id, status)` — family-wide active loans

---

### Table: `homeschool_subjects`

Family-wide subject configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| name | TEXT | | NOT NULL | Display name (e.g., "Math", "Reading / Language Arts") |
| default_weekly_hours | DECIMAL(5,2) | | NULL | Family-wide default target |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_active | BOOLEAN | true | NOT NULL | Archived subjects remain for historical queries |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read.

**Indexes:**
- `(family_id, is_active)` — active subjects for a family
- `(family_id, name)` UNIQUE — no duplicate subject names per family

---

### Table: `homeschool_configs`

Per-child homeschool configuration overrides.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| time_allocation_mode | TEXT | 'full' | NOT NULL | 'full', 'weighted', 'strict' |
| allow_subject_overlap | BOOLEAN | true | NOT NULL | Master overlap toggle |
| subject_hour_overrides | JSONB | '{}' | NOT NULL | subject_id → weekly_hours overrides for this child |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read own.

**Indexes:**
- `(family_member_id)` UNIQUE — one config per child

---

### Table: `homeschool_time_logs`

Per-task, per-subject time records. This is the core compliance data.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| subject_id | UUID | | NOT NULL | FK → homeschool_subjects |
| task_id | UUID | | NULL | FK → tasks (NULL for Log Learning entries without a task) |
| log_date | DATE | | NOT NULL | The date this learning occurred |
| minutes_logged | INTEGER | | NOT NULL | Minutes allocated to this subject for this task/entry |
| allocation_mode_used | TEXT | | NOT NULL | 'full', 'weighted', 'strict' — which mode generated this record |
| source | TEXT | | NOT NULL | 'task_completed', 'child_report', 'manual_entry', 'timer_session' |
| source_reference_id | UUID | | NULL | FK to source (task_completion_id, timer_session_id, etc.) |
| status | TEXT | 'confirmed' | NOT NULL | 'pending' (child-reported, awaiting approval), 'confirmed', 'rejected' |
| description | TEXT | | NULL | What was done (especially for child-reported entries) |
| approved_by | UUID | | NULL | FK → family_members. Who approved (for pending → confirmed) |
| approved_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all, writes all. Members read own. Children can create with status = 'pending' only.

**Indexes:**
- `(family_member_id, subject_id, log_date)` — hours per subject per child per day
- `(family_member_id, log_date)` — all subjects for a child on a date
- `(family_id, subject_id, log_date)` — family-wide subject queries
- `(status)` — pending approvals
- `(source, source_reference_id)` — traceability

> **Decision rationale:** This table is optimized for the compliance query: `SELECT subject_id, SUM(minutes_logged) FROM homeschool_time_logs WHERE family_member_id = ? AND log_date BETWEEN ? AND ? GROUP BY subject_id`. This directly supports state reporting requirements.

---

### Enum/Type Updates

```sql
-- New enum for financial transaction types
CREATE TYPE financial_transaction_type AS ENUM (
  'allowance_earned',
  'opportunity_earned',
  'payment_made',
  'purchase_deduction',
  'loan_issued',
  'loan_repayment',
  'interest_accrued',
  'adjustment'
);

-- New enum for allowance calculation approaches
CREATE TYPE allowance_approach AS ENUM ('fixed', 'dynamic', 'points_weighted');

-- New enum for time allocation modes
CREATE TYPE time_allocation_mode AS ENUM ('full', 'weighted', 'strict');

-- New enum for allowance period status
CREATE TYPE allowance_period_status AS ENUM ('active', 'makeup_window', 'calculated', 'closed');

-- New enum for loan status
CREATE TYPE loan_status AS ENUM ('active', 'paid_off', 'forgiven');

-- New enum for homeschool time log source
CREATE TYPE homeschool_log_source AS ENUM ('task_completed', 'child_report', 'manual_entry', 'timer_session');

-- New enum for homeschool time log status
CREATE TYPE homeschool_log_status AS ENUM ('pending', 'confirmed', 'rejected');
```

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-09A (Task Completions) | When a task is completed, PRD-28 checks: (1) Is this task in any child's allowance pool? If yes, update the active `allowance_periods` running count. (2) Is this an opportunity with a monetary reward? If yes, create an `opportunity_earned` financial transaction. (3) Is this task tagged with homeschool subjects? If yes, create `homeschool_time_logs` records. |
| PRD-09A (task_rewards) | The `task_rewards` table provides the reward_type and reward_amount. PRD-28 processes rewards where `reward_type` references a monetary type. |
| PRD-36 (Universal Timer) | Timer session completions on time-tracked tasks provide duration data. For homeschool tasks: duration feeds into `homeschool_time_logs`. For business work: duration × hourly rate = earnings calculation. |
| PRD-24 (Gamification — indirectly) | Both systems listen to the same task completion events independently. No direct data flow between PRD-24 and PRD-28. |
| PRD-17 (Universal Queue) | Homeschool child reports and financial approval requests route through the Requests tab. Mom's approval/rejection updates `homeschool_time_logs.status` and triggers/blocks financial transaction creation. |
| Manual entry (Mom) | Mom can manually create adjustments, payments, loans, and purchase deductions. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-10 (Allowance Calculator Widget) | The widget reads from `allowance_periods` (current period progress) and `financial_transactions` (balance). PRD-28 provides the data; PRD-10 renders it. |
| PRD-10 (Homeschool / Log Learning Widget) | The Log Learning widget reads from `homeschool_time_logs` and `homeschool_subjects` to show daily/weekly progress. Assignable to any family member — children, teens, and adults. |
| PRD-14C (Mom's Overview — future) | Financial summary data (total owed, per-child balances) available for Mom's Overview widgets. |
| PRD-11 (Victory Recorder) | Log Learning submissions with "Also add as a Victory?" create victory records with `source = 'homeschool_logged'`. |
| Future: Compliance Reporting (Side Quest) | `homeschool_time_logs` provides the data foundation for generating state-required reports. |

---

## AI Integration

### Guided Mode: `homeschool_time_review`

- **Guided mode name:** `homeschool_time_review`
- **Context loaded:** Child's Log Learning submission (description, time, subjects selected), family's homeschool subjects, family's time allocation mode, child's recent homeschool activity
- **AI behavior:** LiLa reviews the child's description and estimates: which subjects apply, how much time per subject (respecting the allocation mode), and a confidence level. Produces a draft `homeschool_time_logs` entry set for mom's review. Explains reasoning: "This activity sounds like it covers Science and Reading. Based on your Full allocation mode, I've logged 60 minutes for each."
- **Human-in-the-Mix:** LiLa's estimates go through Edit/Approve/Regenerate/Reject before any data is saved.

### System Prompt Notes
- LiLa never references specific dollar amounts in conversations — financial data is excluded from context assembly
- LiLa can reference task completion percentages and homeschool hour progress in general terms ("You've completed 84% of your tasks this week" is fine; "$11.77 earned" is not)
- When estimating homeschool time, LiLa considers the activity description, the family's subject list, and typical time allocations for similar activities
- LiLa defaults to generous subject tagging (if an activity plausibly touches a subject, include it) — mom can remove subjects during review

---

## Edge Cases

### Allowance Calculation

**Mid-week task changes:** If mom adds or removes tasks from the allowance pool mid-week, the calculation uses the pool as it stands at calculation time. Historical changes are not retroactive — what matters is "what tasks existed and were assigned during the period."

**Zero tasks assigned:** If a child has no allowance-eligible tasks assigned in a period, completion = 100% (nothing was asked, so nothing was missed). Full allowance earned. This prevents children from being penalized for mom not assigning tasks.

**All grace days:** If every day in a period is marked as grace, effective_tasks_assigned = 0 → same rule as zero tasks → 100% → full allowance.

**Extra credit exceeding 100%:** Effective completion is capped at 100% for the base calculation. Extra credit can restore you to 100% but cannot push above it — bonus threshold is evaluated against the capped percentage.

> **Decision rationale:** Allowing >100% would create inflation in the allowance system and incentivize gaming. The bonus mechanism already rewards overachievement.

**Makeup window overlap with new period:** If a makeup window extends into the next period, makeup task completions apply to the OLD period only. The new period starts clean.

### Financial Transactions

**Negative balance:** Possible only through loans. Regular allowance and opportunity earnings never go negative. Payment transactions cannot exceed the current balance (partial payment required if balance is less than attempted payment). Purchase deductions also cannot exceed balance unless loans are enabled.

**Concurrent period calculations:** If the system processes two children's period calculations simultaneously, each operates on independent data (separate `allowance_configs`, separate task_completions). No cross-child data dependencies.

**Unmark/rollback:** If mom unmarks a task completion (PRD-02 unmark cascade), the system: (1) updates the active `allowance_periods` running count, (2) reverses any `opportunity_earned` transaction by creating a negative `adjustment` transaction. Append-only ledger is preserved — reversals are new records, not deletions.

### Homeschool Tracking

**Rejected child report:** If mom rejects a Log Learning submission, the `homeschool_time_logs` records move to `status = 'rejected'` and do not count toward subject hours. The rejection is visible to the child on Independent shell.

**Retroactive subject changes:** If mom archives a subject, historical time logs for that subject are preserved. The subject appears in historical reports but is no longer available for new entries.

**Timer-based vs. estimated time:** When a task has both a timer session (actual time) and pre-configured estimated time, the timer session takes precedence. Estimated time is a fallback for tasks completed without the timer.

### Loans

**Interest calculation:** Interest accrues on the `remaining_balance`, not the `original_amount`. Repayments reduce the balance first; interest is calculated on whatever remains. Interest transactions are created automatically on the configured accrual date.

**Loan forgiveness:** Mom can forgive a loan at any time. This creates a `loan_repayment` transaction for the remaining balance and sets `loan.status = 'forgiven'`. The child's balance is not affected (the loan was already tracked separately).

**Auto-deduct with insufficient allowance:** If the auto-deduct amount exceeds the allowance earned in a period, the system deducts whatever was earned (full allowance goes to repayment) and carries the shortfall to the next period. The child's allowance balance for that period is $0.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `allowance_basic` | Basic allowance (Fixed Template approach, up to 3 children) | Essential |
| `allowance_advanced` | All 3 approaches, unlimited children, Points-Weighted, bonus thresholds | Enhanced |
| `financial_tracking` | Full transaction ledger, loans, purchase deductions, business work tracking | Enhanced |
| `homeschool_subjects` | Homeschool subject configuration and time logging | Enhanced |
| `homeschool_compliance` | Compliance reporting data export (future side quest) | Full Magic |

> **Tier rationale:** Basic allowance is a core family feature. Advanced calculation approaches and financial tracking add sophistication that warrants Enhanced tier. Homeschool compliance reporting is a specialized need that maps to Full Magic.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Universal Timer integration points | Timer session data consumption for homeschool and business work | PRD-36 (Universal Timer) |
| Compliance reporting data model | Reporting UI for generating state-required homeschool reports | Side Quest: Homeschool Compliance Reporting |
| Biweekly/monthly allowance periods | Period configuration using Universal Scheduler component | PRD-35 (Universal Scheduler) — Post-MVP enhancement |
| Business work export | Formatted work record export (PDF/CSV) for child employment records | Post-MVP enhancement |
| `homeschool_time_review` guided mode | LiLa estimation of subjects and time from child descriptions | PRD-05 (LiLa guided mode registration) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| `task_rewards` → allowance pool calculation | PRD-09A | PRD-28 reads `task_rewards` and `task_completions` to calculate allowance. Allowance pool categories determine which tasks count. |
| Allowance Calculator widget → payment tracking | PRD-10 | PRD-28 provides the `allowance_periods` and `financial_transactions` data that the Allowance Calculator widget displays. |
| Opportunity completion data → payment tracking | PRD-09A | When an opportunity task with monetary reward is completed, PRD-28 creates an `opportunity_earned` financial transaction. |
| Allowance Calculator widget type (3 approaches) | Widget Template Catalog | PRD-28 defines the calculation engine for Fixed, Dynamic, and Points-Weighted approaches. The widget renders the results. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `allowance_configs` table created with per-child configuration
- [ ] `financial_transactions` table created (append-only, DECIMAL precision)
- [ ] `allowance_periods` table created with period tracking
- [ ] `loans` table created
- [ ] `homeschool_subjects` table created with family-wide subjects
- [ ] `homeschool_configs` table created with per-child overrides
- [ ] `homeschool_time_logs` table created with compliance-ready indexing
- [ ] Allowance & Finances section in Settings with all-children overview and per-child configuration
- [ ] Per-child allowance configuration screen with all 3 approaches (Fixed, Dynamic, Points-Weighted)
- [ ] Three grace mechanisms configurable: Grace Days, Makeup Window, Extra Credit
- [ ] End-of-period automatic allowance calculation (Supabase Edge Function, cron-triggered)
- [ ] Running estimate updates in real time during active period
- [ ] Manual early period close by mom
- [ ] Finances tab on Tasks page with family financial summary
- [ ] Per-child transaction history with filters (type, date range)
- [ ] Payment confirmation modal (full and partial payment)
- [ ] Loan creation, tracking, and auto-deduct repayment
- [ ] Interest accrual on loans (optional, configurable)
- [ ] Purchase deduction modal
- [ ] Opportunity task completion → automatic `opportunity_earned` transaction
- [ ] Task unmark → financial transaction reversal (negative adjustment)
- [ ] Homeschool Subject Configuration screen in Settings
- [ ] Three time allocation modes (Full, Weighted, Strict) with family/child/subject/assignment override hierarchy
- [ ] Homeschool time log creation on task completion for homeschool-tagged tasks
- [ ] Log Learning widget assignable to any family member (children, teens, adults)
- [ ] Log Learning modal: Play variant with simplified UI (subject icons, preset time buttons)
- [ ] Log Learning approval routing: Guided/Play → pending approval; Independent/Adult → direct confirmed
- [ ] Victory creation from Log Learning ("Also add as a Victory?" checkbox)
- [ ] Child visibility toggle (financial details vs. percentage only)
- [ ] Play mode always shows percentage only (never dollar amounts)
- [ ] RLS policies enforce family-scoped access on all tables
- [ ] Financial data excluded from LiLa context assembly
- [ ] All 5 shells render appropriately per shell behavior table
- [ ] `useCanAccess()` wired for all feature keys

### MVP When Dependency Is Ready
- [ ] Universal Timer session data consumption for homeschool time logging (requires PRD-36)
- [ ] Universal Timer session data × hourly rate for business work earnings (requires PRD-36)
- [ ] Allowance Calculator widget rendering with live data (requires PRD-10 widget build)
- [ ] Homeschool Dashboard Widget with subject progress bars (requires PRD-10)
- [ ] LiLa homeschool time estimation (`homeschool_time_review` guided mode) (requires PRD-05)
- [ ] Business work task auto-calculation from timer × rate with mom approval (requires PRD-36)

### Post-MVP
- [ ] Biweekly and monthly allowance periods (PRD-35 integration)
- [ ] Business work export (formatted PDF/CSV work records)
- [ ] Compliance reporting UI (side quest)
- [ ] Financial summary on Mom's Overview (PRD-14C)
- [ ] Family-wide financial dashboard / "Family Economy" overview pulling from both PRD-24 and PRD-28
- [ ] Allowance history trends (charts showing weekly earnings over time per child)
- [ ] Dad payment delegation (mom enables dad to mark payments)
- [ ] Purchase deduction requests from Independent teens via Messages/Requests

---

## CLAUDE.md Additions from This PRD

- [ ] Financial data uses DECIMAL(10,2) — never floating point. All money calculations use DECIMAL arithmetic.
- [ ] `financial_transactions` is append-only. Never update or delete records. Reversals are new negative `adjustment` records.
- [ ] Financial ledger (PRD-28) and gamification ledger (PRD-24) are completely separate systems. They share the same trigger (task completion) but maintain independent data, types, and balances.
- [ ] `balance_after` on financial_transactions provides audit trail. If `SUM(amount)` ≠ latest `balance_after`, there's a data integrity issue.
- [ ] Homeschool time logs use minutes (INTEGER) as the base unit. Display converts to hours. This avoids fractional hour rounding issues.
- [ ] Three time allocation modes for homeschool: Full (each subject gets full session time), Weighted (LiLa or mom allocates, can exceed session time), Strict (time divided to equal actual session duration).
- [ ] Configuration hierarchy for homeschool: family default → per-child override → per-subject override → per-assignment override. Each level inherits from above unless explicitly set.
- [ ] Play mode children ALWAYS see completion percentage only — never dollar amounts, regardless of `child_can_see_finances` setting.
- [ ] Financial data is excluded from LiLa context assembly. LiLa never references specific dollar amounts.
- [ ] Grace days, makeup window, and extra credit are independent mechanisms. Any combination can be enabled per child.
- [ ] Extra credit completion is capped at restoring 100% — cannot push above 100% for base calculation. Bonus threshold is evaluated against the capped percentage.
- [ ] Loan interest accrues on `remaining_balance`, not `original_amount`.
- [ ] Log Learning widget is assignable to ANY family member (children, teens, adults). Not restricted to homeschool children. Adults and Independent teens submit directly (status = 'confirmed'). Guided/Play children submit for approval (status = 'pending').

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `allowance_configs`, `financial_transactions`, `allowance_periods`, `loans`, `homeschool_subjects`, `homeschool_configs`, `homeschool_time_logs`

Enums created: `financial_transaction_type`, `allowance_approach`, `time_allocation_mode`, `allowance_period_status`, `loan_status`, `homeschool_log_source`, `homeschool_log_status`

Triggers added:
- `updated_at` auto-trigger on `allowance_configs`, `allowance_periods`, `loans`, `homeschool_subjects`, `homeschool_configs`, `homeschool_time_logs`
- End-of-period allowance calculation (Supabase Edge Function, cron-triggered at configured `calculation_time`)
- Interest accrual on active loans (Supabase Edge Function, cron-triggered on configured `loan_interest_period`)

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Section named "Allowance & Finances" (not "Family Economy") | PRD-24 already owns the gamification reward menu. Calling PRD-28 "Family Economy" would create scope confusion between monetary and point-based reward management. "Allowance & Finances" cleanly scopes to real money. |
| 2 | Configuration lives in Settings with dual navigation path (Settings → all children, Family Management → per-child) | Follows PRD-24 gamification config pattern. Two entry points serve different workflows: system-wide setup vs. per-child configuration. |
| 3 | Financial overview lives on Tasks page as Finances tab + summary cards in Settings | Financial data originates from task completions. Keeping it on the Tasks page keeps mom in her workflow. Summary cards in Settings provide quick-glance when configuring. |
| 4 | Homeschool subjects are a separate system from `life_area_tag` | Subjects need multi-select, per-task time allocation, and compliance-grade time logging. The `life_area_tag` enum is a single-select categorical tag. Different purposes, different data models. |
| 5 | Three time allocation modes: Full, Weighted, Strict | Covers all family preferences. Full for "integrated learning gets full credit." Weighted for "mom/LiLa estimates emphasis." Strict for "minutes only count once" (state compliance). |
| 6 | Config hierarchy: family → child → subject → assignment | Maximum flexibility with minimalist defaults. Most families set one mode and forget it. Override capability exists at every level for edge cases. |
| 7 | Mom controls `allow_subject_overlap` with mode selection. Default: Full. | Some states may not allow double-dipping. Mom can switch to Strict mode for compliance. Default is the most generous interpretation. |
| 8 | Child visibility: configurable per child. Default ON for Independent, OFF for Guided/Play. Play ALWAYS shows % only. | Respects age-appropriateness. Play children (3-7) shouldn't engage with money concepts via the app. Independent teens benefit from financial transparency. |
| 9 | Simple "mark as paid" with optional note. No payment categories. | Keeps the system dead simple. Note field provides flexibility without building a payment categorization system. |
| 10 | Separate `financial_transactions` ledger from PRD-24's `gamification_events` | Different data types (DECIMAL vs INTEGER), different business rules, different visibility. Clean separation prevents accidental currency mixing. |
| 11 | All three grace mechanisms available: Grace Days, Makeup Window, Extra Credit | Grace Days for "life happened." Makeup Window for "earn it back in extra time." Extra Credit for "do additional work to offset." Mom enables any combination per child. |
| 12 | Loans with optional interest, auto-deduct repayment | Financial literacy teaching tool. Interest is opt-in per loan (default: none). Auto-deduct from allowance provides structured repayment. |
| 13 | Purchase deductions reduce balance directly. Loan required for overdraft. | Clean boundary: deductions come from positive balance only. Going negative requires an explicit loan, which teaches borrowing concepts. |
| 14 | Business work tracked via task description + "Business Work" category tag + timer integration | Task descriptions written in professional language carry through to the financial ledger as work records. Category tag enables filtered reporting. Timer provides verifiable time records. |
| 15 | Log Learning widget is assignable to any family member — not just homeschool children | Learning tracking is universal. Adults track continuing education, teens track independent study, children track schoolwork. Same widget, same modal, different approval routing: adults/Independent save directly; Guided/Play route to mom's approval queue. |
| 16 | Log Learning auto-suggests victory creation | Data flows from school → victory (not victory → school). Keeps Victory Recorder as pure celebration. "Also add as a Victory?" checkbox on submission. |
| 17 | Universal Timer gets its own PRD (PRD-36) | Timer touches tasks, widgets, homeschool, financial, gamification, sequential lists. Too many integration points to bury in PRD-28. PRD-28 defines what time data it needs; PRD-36 defines how time is captured. |
| 18 | Homeschool approval requests route through Universal Queue Requests tab | No new approval infrastructure needed. Homeschool families see these requests; non-homeschool families don't. Conditional tab/filter visibility based on `homeschool_subjects` being configured. |
| 19 | `homeschool_time_review` guided mode for LiLa estimation | LiLa reviews child descriptions and estimates subject allocation based on family's configured mode. Human-in-the-Mix applies — mom approves before data saves. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Biweekly and monthly allowance periods | Post-MVP, PRD-35 (Universal Scheduler) integration |
| 2 | Business work export (formatted PDF/CSV) | Post-MVP enhancement |
| 3 | Compliance reporting UI | Side Quest: Homeschool Compliance Reporting |
| 4 | Financial summary on Mom's Overview | PRD-14C enhancement |
| 5 | Family Economy unified view (gamification + financial) | Post-MVP — pulls from both PRD-24 and PRD-28 |
| 6 | Dad payment delegation | Post-MVP permission enhancement |
| 7 | Teen purchase deduction requests | Post-MVP, requires PRD-15 Messages/Requests integration |
| 8 | Allowance history trend charts | Post-MVP visualization enhancement |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-09A (Tasks) | Finances tab added to Tasks page. Task completion now triggers financial transaction creation AND homeschool time logging. Business work tasks need `hourly_rate` field or rely on `task_rewards.reward_amount` as hourly rate when `reward_type = 'hourly'`. | Add 'hourly' to `reward_type` options. Note Finances tab in Tasks page tab list. |
| PRD-10 (Widgets) | Allowance Calculator widget now has full data source defined. Homeschool Dashboard Widget (Log Learning + progress bars) defined as new widget type. | Add Homeschool Dashboard Widget to widget type registry. Update Allowance Calculator widget data contract. |
| PRD-17 (Universal Queue) | Homeschool child reports route to Requests tab as `source: 'homeschool_child_report'`. Financial approvals (business work earnings) also route here. | Add source value to Universal Queue schema. Note conditional visibility for homeschool families. |
| PRD-22 (Settings) | "Allowance & Finances" section added. "Homeschool Subjects" section added. | Add both sections to Settings category navigation. |
| PRD-24 (Gamification) | Boundary explicitly documented: gamification points ≠ real money. Both triggered by task completion independently. | No schema changes. Note in PRD-24 that financial side is defined in PRD-28. |
| PRD-11 (Victory Recorder) | New victory source: `source = 'homeschool_logged'` from Log Learning submissions. | Add source value to `victories.source` enum. |
| PRD-04 (Shell Routing) | Tasks page gains a Finances tab (Mom shell only). | Note in tab structure. |
| Build Order Source of Truth v2 | PRD-36 (Universal Timer) established as new PRD. | Add PRD-36 to remaining PRDs list. Note it's a foundational component like PRD-35. |
| PRD-36 (Universal Timer — new) | PRD-28 defines integration requirements: timer sessions consumed for homeschool time logging AND business work hourly rate calculations. Timer must support concurrent sessions. Must emit `time_session_completed` events. Must include active timer notifications and idle reminders. | To be fully specified in PRD-36 session. |

---

*End of PRD-28*
