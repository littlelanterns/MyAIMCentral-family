# Feature Decision File: Worker 5 — Painter / Universal Scheduler Upgrade

> **Created:** 2026-04-27
> **PRD:** `prds/infrastructure/PRD-35-Universal-Scheduler.md` (primary)
> **Addenda read:**
>   - `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` (always-relevant)
>   - `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md` (cross-cutting design principles)
>   - `claude/web-sync/Connector-Architecture-and-Routing-Model.md` (Phase 1 design, deed-firings schema)
>   - `claude/web-sync/Connector-Architecture-Master-Plan.md` (phase structure)
>   - `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md` (upstream vision, linked steps/items)
>   - `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` (existing scheduler/cron infrastructure)
>   - `claude/web-sync/Connector-Build-Plan-2026-04-26.md` (Phase 2 build plan, godmother/deed specs)
>   - `claude/web-sync/Connector-Build-Sequence-Orientation.md` (multi-worker sequencing)
>   - `claude/feature-decisions/Worker-5-Painter-Review-Checklist.md` (sign-off review concerns)
> **Founder approved:** pending

---

## What Is Being Built

**Plain English for mom:** Today, Universal Scheduler lets mom set up recurring patterns ("every Tuesday and Thursday" or "monthly on the 15th"). The Painter adds a new way to express schedules: mom can literally paint specific dates on a calendar. This is for patterns that don't fit neat recurrence rules — "do this on May 3rd, May 7th, May 12th, and May 20th" or "Mosiah does outside chores on Sundays and Tuesdays, Helam does them on Wednesdays and Thursdays." Mom paints the dates, optionally assigns specific kids to specific dates, optionally sets time-of-day windows, and the system handles the rest. She can also attach painted schedules to lists ("Big Saturday Opportunity List is active on first Saturdays").

**Technical:** Worker 5 adds a painted-calendar input mode to the existing `UniversalScheduler` component. Painted dates produce `SchedulerOutput` with explicit `rdates`. Per-date assignee mappings and time-of-day windows are optional metadata on the output. Worker 5 also creates the `deed_firings` table (the foundation for the connector layer) and writes `scheduled_occurrence_active` deed firings when painted days arrive in the family's timezone.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| `UniversalScheduler.tsx` — new "Painted Calendar" frequency option | A new frequency type alongside One-time/Daily/Weekly/etc. Opens a full interactive calendar where mom taps dates to toggle them on/off. |
| Painted calendar grid inside scheduler | Month-view calendar (reuses `MiniCalendarPicker` or extends `CalendarPreview`). Tapped dates toggle sage-teal highlight. Multi-month navigation. Selected dates shown as removable pills below. |
| Per-date assignee picker | Appears when mom has 2+ assignees on the consuming feature AND switches to painted mode. Each painted date gets a member color pill showing who's assigned that date. Defaults to "everyone" unless mom paints per-date assignments. |
| Instantiation mode selector | When 2+ assignees: "Each kid does their own" vs "Shared — anyone completes." Segmented control with inline description per Convention #118. |
| Time-of-day window fields | Optional "Active from [time] to [time]" fields on painted schedules. Hidden by default, revealed via "[+ Add time window]". |
| List attachment UI (consuming feature side) | When the Painter is used from a list context, the schedule attaches to the list. Lists page shows "Active today" / "Not active today" badge per attached schedule. |
| Pattern detection prompt | When painted dates reveal a clear recurrence (every Sunday, every other Tuesday), the system offers: "These dates follow a pattern — every Sunday. Convert to a recurring schedule?" |
| CalendarPreview update | Existing preview now renders painted dates alongside RRULE-generated dates, distinguishing them visually. |

---

## Key PRD Decisions (Easy to Miss)

1. **Painter is a NEW INPUT MODE of Universal Scheduler, NOT a separate primitive.** Both painted dates and RRULE recurrence produce the same `SchedulerOutput` shape. Downstream consumers see one shape.

2. **Painted dates are stored as explicit `rdates` in the `SchedulerOutput` JSONB.** The `rrule` field is null for pure painted schedules (same pattern as custody/completion-dependent). A new `schedule_type` value `'painted'` is added.

3. **Per-date assignee map is OPTIONAL metadata on `SchedulerOutput`.** Most schedules don't need it. When present, it's `assignee_map: { "2026-05-03": ["mosiah-uuid"], "2026-05-05": ["helam-uuid"] }`. Array values support multi-person days.

4. **Assignee is a property of the consumer, not the schedule** (Coordination Brief §3.1 item 3). When multiple consumers reference the same painted schedule, each can override the assignee map.

5. **Time-of-day windows: `active_start_time` and `active_end_time` as optional fields on `SchedulerOutput`.** If set, deed firing happens at `active_start_time` (family timezone). If not set, fires at family midnight.

6. **`source_type='scheduled_occurrence_active'` — verbatim, locked.** No past-tense, no parent-level form per Coordination Brief §2.10.

7. **Multi-assignee deed firing semantics (Review Checklist item — CONFIRMED 2026-04-27):**
   - `per_assignee_instance` + N assignees → N deed firings, one per kid's `family_member_id`
   - `shared_anyone_completes` + N assignees → **N firings, one per assignee** — these firings record "painted day arrived for this kid," NOT "kid completed something." Completion UX (one checkmark in completer's color, visible everywhere, unmarkable by mom or completer) is Workers 2/3 scope.
   - Per-date assignee map → firing on each date carries ONLY that date's specific assignee(s)

8. **Push pattern for deed firing** — fires at the moment the painted occurrence becomes active, computed in family timezone. Not a cron pull. Implemented as a pg_cron job running per-family-timezone midnight checks (same pattern as `process-carry-forward-fallback`).

9. **List attachment via `lists.schedule_id`** — nullable UUID FK to a schedule storage row. When a list has a schedule attached, its visibility on dashboards / Lists page is gated by whether the current date is an active painted date.

10. **Convert-to-recurrence detection** — client-side heuristic. If painted dates have a clear day-of-week pattern (e.g., all Sundays), offer to convert to RRULE. Optional — mom can decline and keep explicit dates.

---

## Addendum Rulings

### From PRD-35-Cross-PRD-Impact-Addendum:
- Universal Scheduler output stored in consuming features' existing `recurrence_details` JSONB columns — same applies to painted schedules
- `access_schedules` replaces `shift_schedules` — already shipped, no Worker 5 action needed
- LiLa schedule extraction (Screen 3) — NOT in Worker 5 scope, remains a stub

### From Coordination Brief §2.10:
- Deed `source_type` strings locked to verb-form. Worker 5 uses `scheduled_occurrence_active` verbatim.

### From Coordination Brief §2.3:
- Instantiation mode question surfaced explicitly to mom when 2+ assignees are attached to a painted schedule.

### From Coordination Brief §2.6:
- Family timezone for ALL time-of-day logic. No UTC. `families.timezone` is the source column.

### From Coordination Brief §2.7:
- Templates produced by the wizard carry community-readiness fields (`template_source`, `original_author_id`, `cloned_from_template_id`). **Not applicable to Worker 5** — Painter doesn't produce templates. Painted schedules are per-consumer configuration, not reusable templates.

### From Coordination Brief §2.1:
- Polymorphic source addressing `(source_type, source_id)` on deed_firings table.

---

## Database Changes Required

### New Tables

**`deed_firings`** — The connector layer's event log. Created by Worker 5, inherited by Phase 3.

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `id` | UUID | gen_random_uuid() | NOT NULL | PK |
| `family_id` | UUID | | NOT NULL | FK → families |
| `family_member_id` | UUID | | NULL | The specific kid/member this firing is for. NULL = family-wide. |
| `source_type` | TEXT | | NOT NULL | Deed type. v1: `scheduled_occurrence_active`. Phase 3 adds more. |
| `source_id` | UUID | | NOT NULL | The specific source instance (schedule output ID, task ID, etc.) |
| `fired_at` | TIMESTAMPTZ | now() | NOT NULL | When the deed fired |
| `metadata` | JSONB | '{}' | NOT NULL | Additional context (painted date, schedule details, etc.) |
| `idempotency_key` | TEXT | | NOT NULL | Prevents duplicate firings. Format: `{source_type}:{source_id}:{family_member_id}:{date}` |
| `created_at` | TIMESTAMPTZ | now() | NOT NULL | |

Indexes:
- `UNIQUE (idempotency_key)` — prevents double-firing
- `(family_id, source_type, fired_at DESC)` — contract lookup by deed type
- `(source_id, family_member_id, fired_at DESC)` — per-source per-member history
- `(family_id, fired_at DESC)` — chronological family feed

RLS:
- SELECT: family members can read their own family's firings
- INSERT: service role only (deed firings are written by server-side processes, not client)

Reserved columns for Phase 3 (NOT created by Worker 5):
- `contract_id` — will FK to `contracts` when Phase 3 ships
- `dispatch_status` — will track whether godmothers have been dispatched
- `dispatch_results` — will hold godmother dispatch outcomes

### Modified Tables

**`lists`** — add schedule attachment:

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| `schedule_config` | JSONB | NULL | YES | Stores a `SchedulerOutput` blob for painted/recurring schedule. NULL = no schedule (list always active). |

Rationale: JSONB column on `lists` rather than a separate join table because the schedule is 1:1 with the list and the `SchedulerOutput` shape is already JSONB.

### SchedulerOutput Extensions

The existing `SchedulerOutput` type in `src/components/scheduling/types.ts` gains:

```typescript
// New schedule_type value
schedule_type: 'fixed' | 'completion_dependent' | 'custody' | 'painted'

// New optional fields
assignee_map?: Record<string, string[]>  // date ISO string → array of family_member_id UUIDs
active_start_time?: string | null  // TIME format "HH:MM", family timezone
active_end_time?: string | null    // TIME format "HH:MM", family timezone
instantiation_mode?: 'per_assignee_instance' | 'shared_anyone_completes' | null
```

### Migrations

- `00000000100180_deed_firings_table.sql` — creates `deed_firings` table with indexes and RLS
- `00000000100181_lists_schedule_config.sql` — adds `schedule_config JSONB` to `lists`
- `00000000100182_painted_schedule_cron.sql` — creates pg_cron job for painted-day deed firing

---

## Feature Keys

No new feature keys for Worker 5. The Painter is part of the existing Universal Scheduler infrastructure (`scheduler_basic` / `scheduler_custom` / `scheduler_advanced`). During beta all return true.

---

## Stubs — Do NOT Build This Phase

- [ ] **LiLa schedule extraction** (PRD-35 Screen 3) — remains a stub, wires to PRD-05 + PRD-08
- [ ] **Contracts table and contract evaluation** — Phase 3 scope. Worker 5 writes deed firings; Phase 3 evaluates them.
- [ ] **Godmother dispatch** — Phase 3 scope. Deed firings accumulate with no dispatch until Phase 3.
- [ ] **Community-readiness template fields** — not applicable to Painter (painted schedules are not templates)
- [ ] **Sharing mode column** on routines/lists — Workers 2+3 scope
- [ ] **Category column** on lists — Workers 2+3 scope
- [ ] **List filtering/hiding by schedule** — Phase 3 scope. Worker 5 builds display-only "Active today" badge but does NOT hide/filter lists based on schedule.
- [ ] **Convert-to-recurrence auto-detection** — nice-to-have; may defer to polish pass. Core: painting works, deed fires.
- [ ] **Natural language schedule input** — post-MVP per PRD-35

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Painter (UniversalScheduler) | → | tasks.recurrence_details | JSONB column already exists; painted schedule stored here |
| Painter | → | calendar_events.recurrence_details | Same JSONB column |
| Painter | → | lists.schedule_config | New JSONB column Worker 5 creates |
| Painter | → | deed_firings table | Worker 5 writes `scheduled_occurrence_active` firings |
| deed_firings table | → | Phase 3 contracts evaluation | Phase 3 reads firings, evaluates contracts, dispatches godmothers |
| Workers 2+3 | → | deed_firings table | They write `list_item_completion` and `routine_step_completion` firings |
| families.timezone | ← | Painter deed firing cron | Reads timezone for per-family midnight check |

---

## Things That Connect Back to This Feature Later

- **Phase 3 (Connector Layer)** — inherits deed_firings table, adds contracts evaluation + godmother dispatch
- **Phase 3.7 (Wizards)** — wizard-produced contracts may wire to `scheduled_occurrence_active` deeds from painted schedules
- **Workers 2+3 (Shared Routines + Lists)** — their painted-schedule-attached routines/lists use the assignee mapping from Painter
- **Worker 4 (Lists Template Deploy)** — list templates may carry `schedule_config` for deploy-time schedule attachment

---

## Multi-Assignee Deed Firing Semantics (Explicit Answer)

This is the Review Checklist's primary concern. Worker 5's answer:

**For `instantiation_mode='per_assignee_instance'` with N assignees:**
- N deed firings, one per kid. Each firing carries that kid's `family_member_id`.
- This is the straightforward case. Each kid has their own independent execution.

**For `instantiation_mode='shared_anyone_completes'` with N assignees:**
- **N firings, one per assignee.** Every assignee gets a firing so every assignee's contracts can evaluate.
- First-completer-wins is enforced at the completion/godmother layer, not the firing layer.
- Rationale: if Worker 5 wrote only ONE firing without `family_member_id`, contracts targeting specific kids would never qualify. The firing layer should be maximally informative; downstream layers filter.

**For per-date assignee maps (Sun=Mosiah, Tue=Helam):**
- Each date's firing carries ONLY that date's specific assignee(s) in `family_member_id`.
- If Sun is painted with Mosiah, only Mosiah gets a firing on Sunday.

**Founder: please confirm this multi-assignee firing behavior is correct before build begins.**

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Multi-assignee firing semantics confirmed
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
