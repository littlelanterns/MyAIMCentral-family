# PRD-28 Cross-PRD Impact Addendum

**Created:** March 17, 2026
**Session:** PRD-28 (Tracking, Allowance & Financial)
**Purpose:** Documents how PRD-28 decisions affect prior PRDs and establishes new PRD numbers and relationships.

---

## New PRD Numbers Established

| PRD # | Feature Name | Relationship | When to Write |
|-------|-------------|-------------|---------------|
| **PRD-36** | Universal Timer | Foundational component (like PRD-35). PRD-28 depends on it for homeschool time logging and business work hourly rate calculations. | Before or alongside PRD-09A build (timer needed for task time tracking) |

> **Note:** PRD-36 becomes NUMBER LOCKED once this addendum is committed, since PRD-28 references it by number.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- Tasks page gains a **"Finances" tab** (visible in Mom shell only), alongside existing tabs (My Tasks, Routines, Opportunities, Sequential, Queue)
- Task completion now triggers **three independent downstream systems**: (1) PRD-24 gamification points, (2) PRD-28 financial transaction creation (for opportunity earnings), (3) PRD-28 homeschool time logging (for homeschool-tagged tasks)
- Business work tasks need support for hourly rate pricing. The existing `task_rewards` table has `reward_type` and `reward_amount`. PRD-28 needs an `hourly` reward type where `reward_amount` represents the hourly rate and total earnings are calculated from timer sessions × rate.
- The `task_rewards.reward_type` field (which references `family_reward_types`) needs `'hourly'` added as a monetary reward subtype
- Homeschool-tagged tasks (`life_area_tag = 'homeschool'`) gain an additional configuration section in the Task Creation Modal: **"Subject Tracking"** with subject checkboxes and time allocation fields

**Action needed:**
- Add `'hourly'` to monetary reward types in `family_reward_types` / `task_rewards.reward_type` documentation
- Note Finances tab in Tasks page tab list
- Note that task completion triggers PRD-28 systems in addition to PRD-24
- Add Subject Tracking section spec to Task Creation Modal (Section 6: Rewards & Tracking) for homeschool-tagged tasks

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**
- **Allowance Calculator widget** (Type 10 in Widget Template Catalog) now has its full data source defined. It reads from `allowance_periods` for current progress and `financial_transactions` for balance. The three visual variants (10a Summary Card, 10b Fixed Task Grid, 10c Dynamic Category Rings, 10d Points List) are driven by `allowance_configs.calculation_approach`.
- **New widget type: Log Learning Widget** — shows per-subject progress bars for the day/week, "Log Learning" quick action button, and upcoming assignment list with [▶ Start] timer integration. Assignable to any family member (not just homeschool children) — adults track continuing education, teens track independent study. This is a new tracker type in the Widget Template Catalog.
- The Homeschool Dashboard Widget's Log Learning interaction opens a modal (Screen 7 in PRD-28). This modal is self-contained — no widget infrastructure changes needed, just standard widget modal pattern.

**Action needed:**
- Add "Log Learning" to widget type registry in Widget Template Catalog (assignable to all member roles)
- Update Allowance Calculator widget data contract to reference PRD-28 tables (`allowance_periods`, `financial_transactions`, `allowance_configs`)
- Add Log Learning starter configurations to the "📚 Education & Learning" category in the Widget Template Catalog, including an adult-focused variant ("My Learning Log")

---

## Impact on PRD-17 (Universal Queue & Routing System)

**What changed:**
- Two new request source types route through the Requests tab:
  - `'homeschool_child_report'` — child-submitted learning logs awaiting mom's review and approval
  - `'financial_approval'` — business work earnings calculated from timer sessions awaiting mom's confirmation
- For families with `homeschool_subjects` configured, the Requests tab gains conditional visibility for homeschool-related requests. Non-homeschool families never see these.
- The approval action on homeschool requests updates `homeschool_time_logs.status` from 'pending' to 'confirmed'
- The approval action on financial requests creates the `financial_transactions` record

**Action needed:**
- Add `'homeschool_child_report'` and `'financial_approval'` to the source enum for the Universal Queue
- Note conditional request type visibility based on family configuration
- Document the approval cascade: approval → status update → transaction creation

---

## Impact on PRD-22 (Settings)

**What changed:**
- Two new Settings sections added:
  - **"Allowance & Finances"** — per-child allowance configuration, financial overview summary cards. Follows the same pattern as Gamification settings (one card per child, tap to configure).
  - **"Homeschool Subjects"** — family-wide subject list, time allocation mode, per-child overrides. Only visible when at least one family member has `life_area_tag = 'homeschool'` on any task, OR when mom manually enables it.
- Both sections appear in the Settings category navigation

**Action needed:**
- Add "Allowance & Finances" and "Homeschool Subjects" to Settings category list
- Note conditional visibility for Homeschool Subjects (not all families need this)

---

## Impact on PRD-24 (Gamification Overview & Foundation)

**What changed:**
- The architectural boundary between gamification points and real money is now fully documented on both sides. PRD-24 Section "What Other PRDs Own" already states: "PRD-28 (Allowance) — Completely separate from gamification points. Points are in-app currency; allowance is real money. They never mix."
- No schema changes needed. The boundary is reinforced, not changed.
- Both systems independently listen to task completion events. No coordination or sequencing required.

**Action needed:**
- No changes. Verify the boundary statement in PRD-24 is consistent with PRD-28's documentation.

---

## Impact on PRD-11 (Victory Recorder + Daily Celebration)

**What changed:**
- New victory source: `source = 'homeschool_logged'` — created when a child submits a Log Learning entry with the "Also add as a Victory?" checkbox checked
- Victory flow: child submits Log Learning → homeschool approval request created → victory created immediately (victory doesn't wait for mom's approval of the time log, because the accomplishment is real regardless of how many minutes get allocated)

**Action needed:**
- Add `'homeschool_logged'` to `victories.source` enum
- Note that this victory source creates the record immediately on submission, not on approval

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Tasks page gains a Finances tab in the Mom shell tab bar
- This tab is Mom-only. It does not appear in any other shell.

**Action needed:**
- Note Finances tab in Tasks page shell routing configuration (Mom shell only)

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- Financial data introduces a new permission dimension: `child_can_see_finances` on `allowance_configs` controls whether children see dollar amounts or percentage only
- Play mode override: regardless of the toggle, Play mode children ALWAYS see percentage only
- Dad/Additional Adult can view children's financial data if permitted by existing PRD-02 permission framework, but cannot modify allowance configuration or create loans
- Special Adults have NO access to financial data — excluded entirely from caregiver shift views

**Action needed:**
- Note the `child_can_see_finances` permission pattern alongside existing visibility controls
- Verify that the Play mode override is documented in PRD-02's shell behavior rules

---

## Impact on Build Order Source of Truth v2

**What changed:**
- PRD-28 is now written (was listed as locked but unwritten)
- PRD-36 (Universal Timer) established as a new foundational PRD
- PRD-36 should build before or alongside PRD-09A (Tasks) since tasks need timer capability
- PRD-36 is now NUMBER LOCKED

**Action needed:**
- Move PRD-28 from "Remaining PRDs" to "Completed PRDs" section
- Add PRD-36 to remaining PRDs list with note: "Foundational component like PRD-35. Builds before/alongside PRD-09A."
- Add PRD-36 to Section 3 locked numbers: "PRD-27, PRD-28, PRD-36"
- Update Summary count

---

## Impact on Widget Template Catalog v3

**What changed:**
- Allowance Calculator widget (Type 10) data contract now fully defined — reads from `allowance_periods` and `financial_transactions`
- New widget type: **Homeschool Dashboard Widget** with subject progress bars, Log Learning quick action, upcoming assignments, and timer integration
- Suggested starter configurations for Log Learning Widget:
  - "Today's School" — daily view of subject progress with Log Learning (homeschool children)
  - "Weekly School Hours" — weekly summary of hours per subject (homeschool children)
  - "Subject Deep Dive" — single-subject focus with history (any member)
  - "My Learning Log" — adult-focused personal development hour tracking
  - "Study Tracker" — teen independent study logging

**Action needed:**
- Add Homeschool Dashboard as a new widget type (Type 19 or next available)
- Add starter configurations to "📚 Education & Learning" category
- Update Allowance Calculator (Type 10) data source documentation

---

## Starter Prompt for Next Session (PRD-36: Universal Timer)

```
We're writing PRD-36: Universal Timer. This is a foundational component PRD (like PRD-35 Universal Scheduler) that provides time tracking capability across the entire platform.

Read these documents first:
- PRD-28-Tracking-Allowance-Financial.md — the primary consumer; defines what time data is needed for homeschool tracking and business work
- PRD-09A-Tasks-Routines-Opportunities.md — tasks that need timing, Pomodoro view reference
- PRD-10-Widgets-Trackers-Dashboard-Layout.md — widgets that track accumulated time (Tally accumulators with time units)
- Widget-Template-Catalog-v3-Final.md — Timer / Duration Logger visual variants (14a-d)
- PRD-24-Gamification-Overview-Foundation.md — gamification event pipeline triggered by timer completions
- PRD-35-Universal-Scheduler.md — parallel pattern reference for a foundational component PRD

What this PRD needs to cover:
- Start/Stop time session recording (timestamps and duration math, not a visual stopwatch)
- Multiple concurrent timers (independent time records with overlapping windows)
- Pomodoro mode as a structured layer on top of basic start/stop (auto-stop at interval, break prompts)
- Three completion behaviors: time threshold, manual completion, time record only
- Active timer indicator in shell (badge count, tap to see list, clock out from anywhere)
- Idle/runaway timer protection (configurable reminder after N hours, optional auto-pause)
- Integration with PRD-28: timer sessions → homeschool time logs, timer sessions × hourly rate → business work earnings
- Integration with PRD-24: timer completion → gamification event pipeline
- Integration with PRD-09A: any task can be time-tracked, timer data feeds task completion
- Integration with PRD-10: widgets (especially Tally accumulators tracking hours) can be timed
- Data model: `time_sessions` table with task_id, widget_id, family_member_id, started_at, ended_at, duration_minutes, session_type
```

---

*End of PRD-28 Cross-PRD Impact Addendum*
