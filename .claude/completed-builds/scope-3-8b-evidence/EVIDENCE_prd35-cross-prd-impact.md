---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-35 (source) ↔ PRD-09A (task recurrence), PRD-14B (calendar event recurrence), PRD-16 (meeting recurrence), PRD-18 (rhythm timing — code built custom, not UniversalScheduler), PRD-27 (Special Adult access_schedules — shift bifurcation root cause)
Provenance: Worker `a18d9521d5b2a96b6` (Opus, report-only mode) ran full evidence pass across addendum + PRD-35 Infrastructure spec + Universal Scheduler convention block + `src/components/scheduling/` (8 files, 2,468 total lines — UniversalScheduler 1,144L, schedulerUtils 432L, useSchedulerState 216L, types 202L, CalendarPreview 195L, RecurringEditPrompt 205L, WeekdayCircles 56L) + `src/lib/scheduling/` + three consumer usages (EventCreationModal, ScheduleEditorModal, TaskCreationModal) + migration `00000000000004_universal_scheduler.sql` + `00000000100023:295-299` (tasks CHECK) + `00000000100052:87` (calendar CHECK) + `00000000100146:162` (meeting CHECK) + `00000000000019:521-558` (feature_key_registry seeds) + `src/utils/buildTaskScheduleFields.ts` + cross-references to EVIDENCE_prd14b, _prd16, _prd18, _prd27. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked the PRD-35 Universal Scheduler infrastructure surface end-to-end. Identified 10 integration seams collapsing to **3 distinct PRD-35-attributed findings** plus contributions to three cross-addendum patterns. The traversal's single most load-bearing finding is **THREE incompatible `schedule_type` vocabularies coexist in the codebase for the same scheduler output**: (a) `access_schedules.schedule_type` CHECK = `('shift','custody','always_on')`, (b) `SchedulerOutput.schedule_type` TypeScript = `('fixed','completion_dependent','custody')`, (c) `buildTaskScheduleFields` hardcodes `'recurring'`, (d) PRD-35 spec says `access_schedules` should use `('recurring','custody','always_on')`. The second load-bearing finding is the **alternating-weeks RRULE emission is mathematically broken** (`schedulerUtils.ts:99-107`): it outputs `FREQ=WEEKLY;INTERVAL=2` with combined Week A + Week B days, so every fortnight all days fire together — the Week A / Week B distinction is lost. The Full Magic tier "alternating weeks" marketed feature produces wrong output. Third load-bearing: `weekStartDay` propagation is incomplete — UniversalScheduler accepts the prop, WeekdayCircles uses it, but the shared `CalendarPreview` component hardcodes `firstDay.getDay()` (line 48) and none of the three consumers pass `weekStartDay` at all. Convention #115's promise is false. No SCOPE-8b primaries — Universal Scheduler is infrastructure, the safety surfaces live downstream in consumers (PRD-27 shift bifurcation is already logged as SCOPE-8b).

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **Universal Scheduler component exists and is imported from `@/components/scheduling`** (Convention #23) | Addendum PRD-02/PRD-09A/PRD-14B/PRD-16 rows require component reuse | Component exists at `src/components/scheduling/UniversalScheduler.tsx` (1,144 lines). Exported via `index.ts`. Imported by TaskCreationModal:1826, EventCreationModal:408, ScheduleEditorModal:169. Three consumer integrations **WIRED**. | Intentional-Document (wired correctly in 3/5 consumers) | **SCOPE-3** | N |
| 2 | **RRULE JSONB output format** (Convention #24) | Addendum L33-36 | `SchedulerOutput` at `types.ts:9-30` matches the spec exactly. `buildOutput()` at `schedulerUtils.ts:29-90` produces conforming structure. **WIRED.** | Intentional-Document | **SCOPE-3** | N |
| 3 | **rrule.js used for instance generation** (Convention #25) | Addendum L47 | `rrule` package imported in 5 files. `generatePreviewInstances` uses `RRuleSet.between()` — range-bounded. `schedulerUtils.ts:303` even caps completion-dependent at 100 instances for safety. **WIRED.** | Intentional-Document | **SCOPE-3** | N |
| 4 | **`access_schedules` replaces `shift_schedules`** (Convention #26) + columns `special_adult_id` + `recurrence_data` + schedule_type enum `('recurring','custody','always_on')` | Addendum L17-28 | Migration `00000000000004_universal_scheduler.sql:13-22` creates `access_schedules` with `member_id` (not `special_adult_id`), `recurrence_details` (not `recurrence_data`), and CHECK `('shift','custody','always_on')` (not `'recurring'`). **Three schema naming drifts.** Cross-reference EVIDENCE_prd27 — the `is_member_available()` PL/pgSQL helper returns NULL for shift/custody. | Unintentional-Fix-PRD | **SCOPE-3** | N |
| 5 | **Completion-dependent schedules generate next instance from last completion** (Convention #27) | Addendum L34 | `schedulerUtils.ts:293-311 generateCompletionDependentInstances()` generates from `anchor_date` — but anchor_date is set at save time. **No logic anywhere reads `task_completions.completed_at` to reset the anchor after completion.** Grep `completion_dependent` + `.update()` across hooks returns nothing. The UI displays "every N days after completion" but behaves as "every N days from initial save date". | Unintentional-Fix-Code (feature semantically unwired) | **SCOPE-3** | N |
| 6 | **[+ Add another] pattern for multi-value scheduling** (Convention #28) | Addendum implicit | `types.ts:148-158` has `ADD_MONTHLY_WEEKDAY`/`ADD_YEARLY_WEEKDAY`/`ADD_SEASONAL_RANGE`/`REMOVE_*` dispatch actions. **WIRED.** | Intentional-Document | **SCOPE-3** | N |
| 7 | **Calendar preview is REQUIRED on all scheduler instances** (Convention #29) + must respect `calendar_settings.week_start_day` (Convention #115) | Addendum implicit, CLAUDE.md #115 | `CalendarPreview.tsx` renders inside UniversalScheduler when `!compactMode`. But **`TaskCreationModal:1830` passes `compactMode`**, and **`EventCreationModal:412` passes `compactMode`** — only ScheduleEditorModal lets the preview render. 2/3 consumers skip the addendum-required calendar preview entirely. Separately, `CalendarPreview.tsx:48` uses `firstDay.getDay()` with no `weekStartDay` parameter — week-start always Sunday regardless of family `calendar_settings.week_start_day`. UniversalScheduler accepts `weekStartDay` but doesn't forward it to CalendarPreview. None of the three consumers pass `weekStartDay` at all. | Unintentional-Fix-Code | **SCOPE-3** | N |
| 8 | **Time optional by default; `showTimeDefault` for time-centric** (Conventions #30 + #109) | Addendum L164-166 | Already captured in EVIDENCE_prd14b seam #8 (Calendar violates #109). Cross-ref only. | Cross-ref only | — | N |
| 9 | **Alternating weeks RRULE emission** | PRD-35 L128-133 + `weekADays` + `weekBDays` | `schedulerUtils.ts:98-107` emits `FREQ=WEEKLY;INTERVAL=2` with **combined Week A + Week B days via `[...new Set([...weekADays, ...weekBDays])]`**. The RRULE inline comment acknowledges "Week B is a separate RRULE in practice" but the implementation merges them. Every 2 weeks, all merged days fire — Week A and Week B are indistinguishable. Mathematically the feature cannot produce what the UI promises. `outputToState` round-trips to `advancedMode='alternating'` if INTERVAL=2, losing `weekBDays` entirely. | Unintentional-Fix-Code (marketed Full Magic feature mathematically broken) | **SCOPE-3** | N (no users on Full Magic tier in beta yet) |
| 10 | **Rhythm timing uses Universal Scheduler** | Addendum L64-66 | `src/types/rhythms.ts:628-644 isRhythmActive()` is a custom implementation with `trigger_type` enum. Rhythm section components consume `config.timing` — a separate JSONB shape, NOT `SchedulerOutput`. PRD-18 Phase B-D built rhythm timing without UniversalScheduler integration. **Convention #23 violation**. | Unintentional-Fix-PRD (custom timing is legitimate domain-specific fit; PRD-35 addendum over-promised) | **SCOPE-3** | N |
| 11 | **`_legacy_recurrence` backup column migration** | Addendum L91-92 | Grep `_legacy_recurrence` across migrations returns **ZERO hits**. Never created. No backfill/conversion migration either. | Unintentional-Fix-Code (migration never shipped) | **SCOPE-3** | N |
| 12 | **LiLa schedule extraction — `schedule-extract` Edge Function** | Addendum L70-72 + L76-78 | Grep `schedule-extract\|scheduleExtract\|extractSchedule` returns ZERO hits. Edge Function absent. Cross-reference PRD-14B evidence seam #1. | Deferred-Document | **SCOPE-3** | N (already addendum-deferred) |

## Unexpected findings list (seams not covered in addendum)

1. **Two incompatible `RecurrenceDetails` TypeScript types in the codebase.** `src/components/scheduling/types.ts:9-30` defines `SchedulerOutput` with `schedule_type: 'fixed'|'completion_dependent'|'custody'`. `src/lib/scheduling/scheduleUtils.ts:21-34` defines a separate `RecurrenceDetails` with `startTime`/`endTime` embedded. The access_schedules loader expects the second shape; UniversalScheduler emits the first. A Special Adult shift saved through UniversalScheduler writes a `SchedulerOutput` to `access_schedules.recurrence_details` that `parseRecurrenceDetails` rejects as invalid, returning `null`, denying access. **Two scheduler JSONB contracts, one column.** This is the PRD-27 shift bifurcation's deeper root cause.

2. **`buildTaskScheduleFields.ts:24, 43` hardcodes `schedule_type: 'recurring'`** — a string that does NOT appear in `SchedulerOutput.schedule_type` union. Round-trip from task DB row back to scheduler state would mis-route.

3. **PRD-35 spec says `access_schedules.schedule_type` enum is `('recurring', 'custody', 'always_on')` but live migration says `('shift', 'custody', 'always_on')`.**

4. **`access_schedules` live column name is `member_id` (generic), PRD-35 says `special_adult_id`.**

5. **`allowedFrequencies` prop declared in `UniversalSchedulerProps` but implementation destructures it as `_allowedFrequencies`** (unused). Dead API surface.

6. **`RecurringEditPrompt` component exists (205 lines) and is exported from `index.ts` but NO consumer imports it.**

7. **`tasks.recurrence_rule` CHECK includes `'completion_dependent'` and `'custody'`; `calendar_events.recurrence_rule` CHECK and `meeting_schedules.recurrence_rule` CHECK do NOT.** Addendum L34 demands these on all three tables. Calendar/meeting rows written with those rule values would fail the CHECK.

8. **Feature tier gating for scheduler_custom / scheduler_advanced / scheduler_lila_extract is seeded in `feature_key_registry` + `feature_access_v2` (migration 100019:521-558) but zero `PermissionGate` / `useCanAccess('scheduler_*')` hits in `src/`.** Every user gets custody + seasonal + completion-dependent regardless of tier.

## Proposed consolidation (§5.1 + §5.2 candidates)

### §5.1 within-addendum
- Seams #4 + Unexpected #3 + #4 are three facets of "access_schedules schema drifted from PRD-35 spec" — consolidate.
- Seam #7 + Seam #11 are both "infrastructure promised by the addendum that wasn't built" but hit different tables — keep separate.
- Seams #1, #2, #3, #6 are WIRED-correctly — no findings.
- Seam #8 cross-references EVIDENCE_prd14b — do NOT re-emit.
- Seam #10 cross-references EVIDENCE_prd18 — do NOT re-emit.
- Seam #12 cross-references PRD14B-AI-INTAKE-UNBUILT closed candidate — do NOT re-emit.

### §5.2 cross-addendum candidates

**F. Schedule vocabulary drift (NEW cross-addendum pattern — PRD-35 contributes 4 specific instances)**

| Surface | Drift |
|---|---|
| `access_schedules.schedule_type` CHECK | Live `'shift'` vs PRD-35 spec `'recurring'` |
| `access_schedules.recurrence_details` column name | Live `recurrence_details` vs PRD-35 spec `recurrence_data` |
| `SchedulerOutput.schedule_type` TypeScript | `'fixed'` vs DB-bridge-written `'recurring'` |
| `calendar_events`/`meeting_schedules.recurrence_rule` CHECK | Missing `'completion_dependent'`, `'custody'` |

This is distinct from the source/enum pattern — this is **vocabulary-drift pattern in recurrence/schedule metadata**. 1 cross-addendum scope, 4 affected surfaces within PRD-35 alone.

**G. Addendum-promised but unwired infrastructure (EXPAND)**

- PRD-18: `contextual_help`, `mood_triage`, `tags` GIN index, `rhythm_request` enum
- PRD-35: `_legacy_recurrence` migration, `schedule-extract` Edge Function, tier gating enforcement
- PRD-14B: `calendar-parse-event` Edge Function, `calendar_event_create` guided mode

Pattern already at 3+ surfaces.

**H. Two-out-of-three consumer drift** — PRD-35-specific variant of "feature convention required but silently ignored."

## Proposed finding split

- **SCOPE-8b primary:** **0** — Universal Scheduler is pure infrastructure.
- **SCOPE-3 only:** **3 consolidated**
  1. **F-A (seam #4 + Unexpected #1 + #3 + #4):** "`access_schedules` schema drifted from PRD-35 spec across 4 dimensions — column name, type union, schedule_type enum value, plus a second incompatible `RecurrenceDetails` contract exists in `src/lib/scheduling/scheduleUtils.ts`."
  2. **F-B (seam #5 + #9 + Unexpected #2):** "Multiple scheduler-output broken semantics: completion-dependent never advances anchor on real completion; alternating-weeks RRULE merges Week A + Week B into identical fortnightly emission; `buildTaskScheduleFields` writes `schedule_type='recurring'` — a string not in the TypeScript union."
  3. **F-C (seam #7 + #11 + Unexpected #5 + #6 + #7 + #8):** "Universal Scheduler convention surface carries multiple unwired promises: calendar preview skipped by 2 of 3 consumers; `weekStartDay` never propagates to CalendarPreview; `allowedFrequencies` prop is dead; `RecurringEditPrompt` component has zero consumers; `_legacy_recurrence` migration never shipped; calendar/meeting `recurrence_rule` CHECKs missing values; scheduler_* tier feature keys never gated client-side."

- **Cross-addendum elevation contribution:** **2** (F-B's alternating-weeks RRULE defect + F-A's vocabulary drift feed the G pattern; F-C's CHECK-gap sub-element contributes to F pattern already tracked).

- **Closed cross-refs:** **3** (seam #8 → PRD-14B seam #8; seam #10 → PRD-18; seam #12 → PRD14B-AI-INTAKE-UNBUILT).

After consolidation: **0 SCOPE-8b + 3 SCOPE-3 (within-PRD-35)** + 2 cross-addendum contributors + 3 closed cross-refs.

## Beta Y candidates

**0 SCOPE-8b primaries.** The three SCOPE-3 findings are all default-N:

- F-A (schema drift): documentation/rename effort, no behavioral user-facing break.
- F-B (completion-dependent + alternating-weeks): broken Full Magic features that no beta user currently has tier access to exercise.
- F-C (convention surface unwired): incomplete infrastructure that degrades polish.

## Top 3 surprises

1. **`schedulerUtils.ts:99-107` Alternating weeks RRULE is mathematically wrong.** A mom who sets "Week A: Mon/Wed, Week B: Tue/Thu" gets "every 2 weeks on Mon/Tue/Wed/Thu" — four-day weeks, not alternating two-day weeks.

2. **Three `schedule_type` vocabularies coexist in one column.** `access_schedules.schedule_type` DB CHECK, `SchedulerOutput.schedule_type` TS union, `buildTaskScheduleFields` hardcoded string — every write path uses a different word. The `parseRecurrenceDetails` parser silently returns `null` when it receives the UniversalScheduler shape — the direct root cause of the PRD-27 shift bifurcation.

3. **`CalendarPreview` ignores `calendar_settings.week_start_day` completely.** Convention #115 names the Universal Scheduler calendar preview as a consumer. CalendarPreview hardcodes `firstDay.getDay()` (Sunday). Convention contract broken in two places at once.

## Watch-flag hits

- **F11 server-side enforcement** — Indirect hit via `access_schedules` schema drift + `parseRecurrenceDetails` shape-mismatch. Cascades into the PRD-27 F-A finding's deeper cause. No new SCOPE-8b — already logged.
- **Crisis Override** — Not applicable.
- **F17 messaging** — Not applicable.
- **F22+F23 archive column drift** — Not applicable.
- **studio_queue source discipline** — Not applicable. PRD-35 introduces `recurrence_rule` / `recurrence_details` drift, a DIFFERENT vocabulary-drift pattern.
- **`is_included_in_ai`** — Not applicable.

## Orchestrator adjudication

(empty — pending walk-through)
