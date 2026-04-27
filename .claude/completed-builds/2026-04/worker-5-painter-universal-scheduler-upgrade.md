# Worker 5 — Painter / Universal Scheduler Upgrade

## Status: ACTIVE

**PRD:** `prds/infrastructure/PRD-35-Universal-Scheduler.md`
**Feature decision file:** `claude/feature-decisions/Worker-5-Painter-Universal-Scheduler-Upgrade.md`
**Worker identity:** Worker 5 in the Connector Architecture multi-worker build sequence
**Started:** 2026-04-27

### Addenda Read

- `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md`
- `claude/web-sync/Connector-Architecture-and-Routing-Model.md`
- `claude/web-sync/Connector-Architecture-Master-Plan.md`
- `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md`
- `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md`
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md`
- `claude/web-sync/Connector-Build-Sequence-Orientation.md`
- `claude/feature-decisions/Worker-5-Painter-Review-Checklist.md`

---

## Pre-Build Summary

### A. Scope — What Worker 5 Ships

Worker 5 delivers 8 sub-tasks in dependency order:

**Sub-task 1: deed_firings table (migration 100180)**
Creates the `deed_firings` table per the Phase 1 design. Schema:
- `id UUID PK`, `family_id UUID NOT NULL FK`, `family_member_id UUID NULL FK`, `source_type TEXT NOT NULL`, `source_id UUID NOT NULL`, `fired_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `metadata JSONB NOT NULL DEFAULT '{}'`, `idempotency_key TEXT NOT NULL UNIQUE`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Indexes for contract lookup, per-source history, chronological feed
- RLS: family-scoped SELECT, service-role-only INSERT
- No CHECK constraint on `source_type` yet (Phase 3 will tighten; Worker 5 writes only `scheduled_occurrence_active`)

**Plain English:** This table is where the system records "something happened" — a painted day arrived, a task was completed, a list item was checked off. Today Worker 5 writes the table and the first type of event; Phase 3 inherits it and makes those events trigger rewards.

**Sub-task 2: lists.schedule_config column (migration 100181)**
Adds `schedule_config JSONB NULL` to `lists`. Stores a `SchedulerOutput` blob so a list can have a painted or recurring schedule attached. NULL = always active (backward compatible).

**Plain English:** This lets mom say "this opportunity list is only available on first Saturdays" by painting those dates and attaching the schedule to the list.

**Sub-task 3: SchedulerOutput type extensions**
Extends `src/components/scheduling/types.ts`:
- Add `'painted'` to `schedule_type` union
- Add optional `assignee_map?: Record<string, string[]>` (date → member UUIDs)
- Add optional `active_start_time?: string | null` and `active_end_time?: string | null`
- Add optional `instantiation_mode?: 'per_assignee_instance' | 'shared_anyone_completes' | null`
- Add corresponding `SchedulerState` fields and `SchedulerAction` types
- Update `useSchedulerState` reducer to handle painted-calendar state

**Sub-task 4: Painted calendar UI in UniversalScheduler**
New frequency option "Painted Calendar" in the scheduler component. When selected:
- Renders a full interactive month-view calendar (extends CalendarPreview or builds inline)
- Mom taps dates to toggle them on/off (sage-teal highlight for selected)
- Navigate months with arrows
- Selected dates shown as removable pills below the calendar
- Produces `SchedulerOutput` with `schedule_type='painted'`, `rdates` populated with painted dates, `rrule=null`

**Plain English:** Mom opens the scheduler, picks "Painted Calendar" instead of "Weekly" or "Monthly," and literally taps the dates she wants on a calendar. No RRULE to think about — just tap dates.

**Sub-task 5: Per-date assignee picker**
When the consuming feature has 2+ assignees AND the schedule is in painted mode:
- Each painted date shows a row with member-color pills for assignee selection
- "All" is the default (everyone assigned to every date)
- Mom can tap to assign specific members to specific dates
- Uses the Universal People Picker pattern (member-color pill buttons per Convention #119)
- Instantiation mode selector appears: "Each kid does their own" vs "Shared — anyone completes" (segmented control)

**Plain English:** When mom has multiple kids assigned to a routine, she can say "Mosiah does this on Sunday and Tuesday, Helam does it on Wednesday and Thursday" by painting dates and assigning kids to specific ones.

**Sub-task 6: Time-of-day window fields**
Optional "[+ Add time window]" button on painted schedules. When opened:
- "Active from [time picker] to [time picker]"
- Stored as `active_start_time` / `active_end_time` on `SchedulerOutput`
- Times are always family-local (rendered in family timezone, stored as TIME strings)

**Plain English:** Mom can say "this is only active from 9am to 2pm on painted days" — useful for school-time-only schedules.

**Sub-task 7: Painted-day deed firing (push pattern)**
pg_cron job + Edge Function that fires painted-day deed firings:
- Cron runs at `:20 * * * *` (offset from existing cluster at :00-:15)
- Edge Function loads all families, computes current hour in each family's timezone
- For families whose local hour = 0 (midnight) OR whose `active_start_time` matches current hour: checks which painted dates have arrived today
- For each arrived painted date: inserts a `deed_firings` row with `source_type='scheduled_occurrence_active'`, `family_member_id` per the assignee map, idempotency key prevents double-firing
- For `per_assignee_instance` mode: one firing per assignee
- For `shared_anyone_completes` mode: one firing per assignee (contracts evaluate per kid; completion layer enforces first-completer-wins)
- For per-date assignee maps: only that date's assignees get firings

**Plain English:** Every hour, the system checks each family's timezone. At midnight (or at the configured start time), it looks at today's painted dates and records "this scheduled thing became active for this kid." Those records sit in the table waiting for Phase 3's connector layer to do something with them. Until Phase 3, they're just observable data.

**Sub-task 8: Convert-to-recurrence detection (optional, may defer)**
Client-side heuristic: when painted dates form a clear weekly pattern (e.g., all are Sundays), offer to convert to an RRULE. Mom can accept or decline.

**This sub-task is explicitly deferrable** — if time pressure exists, it ships as a stub. Core value is painting + deed firing.

### B. Deed-Firings Table Schema

Matches Phase 1 design (Connector-Architecture-and-Routing-Model.md §8.2 polymorphic identity pattern):

```sql
CREATE TABLE IF NOT EXISTS public.deed_firings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  fired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT deed_firings_idempotency UNIQUE (idempotency_key)
);
```

Phase 3 reserved fields NOT created by Worker 5: `contract_id`, `dispatch_status`, `dispatch_results`. Phase 3 adds these via migration when it ships.

### C. Painter UI Design

The Painter is a new frequency option in the existing `UniversalScheduler` component:

```
┌─────────────────────────────────────────────────┐
│  HOW OFTEN?                                      │
│  [One-time] [Daily] [Weekly] [Monthly]           │
│  [Yearly] [Custom] [Painted●]                    │
│  ─────────────────────────────────────────────── │
│  TAP DATES TO SELECT                             │
│        ← May 2026 →                              │
│  Su  M  Tu  W  Th  F  Sa                        │
│               1   2  •3•  4                      │
│  •5•  6  •7•  8   9  10  11                     │
│  •12• 13  14  15  16  17  18                     │
│  19  •20• 21  22  23  24  25                     │
│  26  27  28  29  30  31                          │
│  ─────────────────────────────────────────────── │
│  Selected: May 3 × | May 5 × | May 7 × | ...   │
│  ─────────────────────────────────────────────── │
│  [+ Add time window]                             │
│  ─────────────────────────────────────────────── │
│  SCHEDULE UNTIL  [Ongoing ▾]                     │
└─────────────────────────────────────────────────┘
```

When 2+ assignees exist on the consuming feature, an additional section appears:

```
┌─────────────────────────────────────────────────┐
│  WHO DOES THIS?                                  │
│  [Each kid does their own●] [Shared — anyone]    │
│  ─────────────────────────────────────────────── │
│  ASSIGN PER DATE (optional)                      │
│  May 3:  [Mosiah●] [Helam] [Gideon]             │
│  May 5:  [Mosiah] [Helam●] [Gideon]             │
│  May 7:  [Mosiah●] [Helam●] [Gideon]            │
│  ...                                             │
│  ─────────────────────────────────────────────── │
│  Default: Everyone assigned to every date        │
│  [Reset to default]                              │
└─────────────────────────────────────────────────┘
```

### D. Multi-Assignee Firing Semantics (Explicit Answer)

**`per_assignee_instance` + N assignees:** N firings, one per kid. Each carries that kid's `family_member_id`.

**`shared_anyone_completes` + N assignees:** N firings, one per assignee. All contracts evaluate. First-completer-wins is downstream, not at the firing layer.

**Per-date assignee map (Sun=Mosiah, Tue=Helam):** Only that date's assignees get firings. Sunday → 1 firing for Mosiah. Tuesday → 1 firing for Helam.

**Founder: please confirm this behavior is correct.**

### E. Verb-Form Lock Confirmation

Every deed firing Worker 5 writes uses `source_type='scheduled_occurrence_active'` verbatim. No past-tense. No parent-level form. Confirmed.

### F. Coordination Handoffs

**To Workers 2+3 (Shared Routines + Lists):**
- Schema contract for deed_firings: columns listed in Sub-task 1 above. Workers 2+3 write rows with `source_type='list_item_completion'` or `source_type='routine_step_completion'`.
- Idempotency key format: `{source_type}:{source_id}:{family_member_id}:{date_iso}` — Workers 2+3 follow the same format.

**To Phase 3:**
- Phase 3 inherits the deed_firings table as-is.
- Phase 3 adds `contract_id`, `dispatch_status`, `dispatch_results` columns.
- Phase 3 adds contract evaluation + godmother dispatch logic that reads from deed_firings.

**To Phase 3.7:**
- Chart wizards can produce contracts wired to `scheduled_occurrence_active` deeds. The deed schema is documented in this build file.

### G. Stub Registry Additions

| Stub | Wires To | Future PRD/Phase |
|---|---|---|
| deed_firings: contract evaluation + godmother dispatch | Phase 3 Connector Layer | Phase 3 |
| deed_firings: dispatch_status / dispatch_results columns | Phase 3 Connector Layer | Phase 3 |
| lists.schedule_config: Lists page active/inactive rendering | Phase 3 UX or separate Lists phase | TBD |
| Convert-to-recurrence detection (if deferred) | Polish pass | Post Worker 5 |
| LiLa schedule extraction | PRD-05 + PRD-08 | Post-MVP |

### H. Open Questions for Founder

1. **Multi-assignee firing for `shared_anyone_completes`:** N firings per assignee (recommended) or single firing without member ID? See section D above.

2. **Painted frequency label:** "Painted Calendar" as the user-facing name? Or "Custom Dates" / "Pick Dates" / something warmer?

3. **List schedule visibility gating:** Should Worker 5 also build the Lists page rendering that shows "Active today" / "Not active today" per schedule? Or defer to a future build? (Worker 5 ships the column; the rendering could be a fast add or deferred.)

---

## Sub-Task Sequence

| # | Sub-task | Dependency | Migration? |
|---|---|---|---|
| 1 | deed_firings table | None | Yes: 100180 |
| 2 | lists.schedule_config column | None | Yes: 100181 |
| 3 | SchedulerOutput type extensions | None | No |
| 4 | Painted calendar UI in UniversalScheduler | Sub-task 3 | No |
| 5 | Per-date assignee picker + instantiation mode | Sub-task 4 | No |
| 6 | Time-of-day window fields | Sub-task 4 | No |
| 7 | Painted-day deed firing (cron + Edge Function) | Sub-tasks 1, 3 | Yes: 100182 |
| 8 | Convert-to-recurrence detection (optional) | Sub-task 4 | No |

Sub-tasks 1+2 can be combined into a single migration commit. Sub-tasks 3-6 are frontend work. Sub-task 7 is the backend deed-firing mechanism. Sub-task 8 is optional polish.

---

## Post-Build Verification Table

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |
