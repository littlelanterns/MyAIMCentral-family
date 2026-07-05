# Client-Date Remediation — Pre-Build Audit & Residual Closure Plan

> **Status:** PRE-BUILD AUDIT COMPLETE 2026-07-01 — awaiting founder gate. No code written, no migrations applied.
> **Worksheet:** Row 184 NEW-DD (Convention #257) — but see the Verdict below: Row 184 itself is RESOLVED.
> **Auditor:** Fable pre-build session, 2026-07-01. All findings verified against CURRENT code and LIVE production — nothing trusted from the April doc blindly.
> **Authority chain:** this file (audit ground truth) → `claude/web-sync/CLIENT_DATE_AUDIT_2026-04-23.md` (historical diagnosis; verification query STALE, see §2) → CLAUDE.md Convention #257 (STALE "remaining scope" text, rewrite is part of this build).

---

## 1. Verdict — the dispatched premise was stale

The dispatch prompt (and CLAUDE.md Convention #257) describe the hybrid Path 3 remediation as **"awaiting"** — "7 other vulnerable tables + 8 client-side filter sites."

**That remediation shipped and was verified on 2026-04-23**, the same day as the audit doc, and the worksheet records it:

> Row 184: "**RESOLVED + VERIFIED 2026-04-23** — Wave 1 remediation complete. Migration 100158 landed..."

What landed (all committed, all applied to production):

| Commit | Content |
|---|---|
| `8b81d38` | Migration `00000000100158_family_today_and_date_triggers.sql` — `family_today(p_member_id)` RPC + 6 BEFORE INSERT/UPDATE triggers (`intention_iterations`, `family_intention_iterations`, `task_completions`, `homeschool_time_logs`, `victory_celebrations`, `reflection_responses`) + idempotent backfills, all with a ±1-day override window |
| `134882d` | `src/hooks/useFamilyToday.ts` — `useFamilyToday()` hook (60s cache) + `fetchFamilyToday()` imperative variant |
| `3c79b89` | Write-path fixes: `buildTaskScheduleFields`, `createTaskFromData` rotation, `Tasks.tsx` |
| `ba0ad35` | 8+ read-filter sites across 10 files routed through `useFamilyToday` (PlayDashboard, FinancesTab, useFamilyOverviewData, useFinancial, useBestIntentions, useFamilyBestIntentions, useReflections, useHomeschool, LogLearningTracker, hub/dashboard intention sections) |
| `79fff78` | E2E pin `tests/e2e/features/client-date-cross-device.spec.ts` |
| `5bfe7ad` (2026-04-24) | Migration `00000000100163` — `allowance_periods` DATE trigger (Row 9 work, same pattern) |

**Protected-table count today: 8** — `routine_step_completions` (100157, superseded intentionally by 100245), the six 100158 tables, and `allowance_periods` (100163).

**What this build actually is:** a much smaller **residual-closure build** — 3 unprotected tables + 1 RPC + ~10 second-tier read sites + stale-documentation cleanup. Inventory in §3.

---

## 2. Production verification (run 2026-07-01, read-only)

- `supabase migration list --linked`: 100157 and 100158 both present locally AND remotely. ✓
- `trg_set_routine_step_period_date` exists and is enabled (`tgenabled='O'`). ✓
- **The audit doc's verification query returns 202, not 0 — and that is CORRECT behavior, not a broken trigger.** The query is stale: migration `00000000100245_routine_step_period_date_scheduled_day.sql` (Member-Day build, June) intentionally replaced the 100157 function. For `show_until_complete` sections completed on a non-scheduled day, the trigger now walks back ≤7 days and attributes the completion to the most recent *scheduled* day — so `period_date` legitimately differs from the completed_at-derived date (negative delta). The week-edit page also backdates compliantly (it passes `completed_at = past-day-noon-UTC` so the trigger derives the intended past date).
- **The corrected device-clock-signature query — `period_date > (completed_at AT TIME ZONE families.timezone)::date` — returns 0 rows.** The trigger is holding. (The device-clock bug only ever produces *positive* deltas: a fast clock writes tomorrow.)
- All six 100158 tables: **0 misaligned rows** within the trigger window. ✓
- `allowance_periods`: protected by `trg_set_allowance_period_dates`. ✓

### Corrected verification queries (supersede the audit doc's)

```sql
-- routine_step_completions: device-clock signature only (post-100245 contract).
-- Negative deltas are legitimate (carry-over walk-back + compliant backdating).
SELECT COUNT(*) FROM routine_step_completions rsc
JOIN family_members fm ON fm.id = rsc.member_id
JOIN families f ON f.id = fm.family_id
WHERE rsc.period_date > (rsc.completed_at AT TIME ZONE f.timezone)::date;
-- Expect 0. Verified 0 on 2026-07-01.

-- The six 100158 tables: misalignment WITHIN the ±1-day override window
-- (anything outside the window is intentional backdating, out of contract).
-- Template (adjust member column + timestamp column per table):
SELECT COUNT(*) FROM <table> t
JOIN family_members fm ON fm.id = t.<member_col>
JOIN families f ON f.id = fm.family_id
WHERE t.<date_col> != (t.<ts_col> AT TIME ZONE f.timezone)::date
  AND ABS(t.<date_col> - (t.<ts_col> AT TIME ZONE f.timezone)::date) <= 1;
-- Expect 0 per table. Verified 0 on all six, 2026-07-01.
```

---

## 3. Definitive residual inventory (verified against current code + live data, 2026-07-01)

Ground truth: `information_schema` query of **every DATE column in the public schema** (27 columns / 20 tables), cross-referenced against triggers, defaults, and every `todayLocalIso()` / ISO-string-slice call site in `src/`.

### 3A. Write-side residuals (Category B class — the real build scope)

| # | Table.column | Defect | Evidence | Severity |
|---|---|---|---|---|
| **W1** | `practice_log.period_date` | `usePractice.ts:66-67` (useLogPractice) and `:286-287` (useSubmitMastery) compute `new Date().toISOString()` then `.slice(0,10)` — the **UTC date**, in a two-step form that evades the ESLint ban. Column default `CURRENT_DATE` also evaluates UTC. No trigger. | **4 misaligned prod rows, all dated tomorrow.** Dual-write split-brain: the paired `task_completions` row IS trigger-corrected, so the same practice session carries two different dates across the two tables. | HIGH — live bug, fires on any evening practice log in US timezones, no misconfigured device needed |
| **W2** | `widget_data_points.recorded_date` | No client write at all; column default `CURRENT_DATE` = **server UTC date**. Every tracker tap after ~6–7 PM Central is dated tomorrow. All 8 tracker types (Streak, HabitGrid, Boolean, Checklist, Mood, Percentage, TimerDuration, BestIntention) read `dp.recorded_date === todayLocalIso()` — so an evening entry appears un-recorded the moment it's made, and streaks/grids read broken. | **3 genuine bug rows in prod, written 7:00–7:01 PM Central 2026-03-30.** (The other 49 "misaligned" rows are one bulk seed import from 2026-03-26 with intentional historical dates — NOT a bug; the ±1 window naturally protects them from any backfill.) | HIGH — worst residual; normal evening use triggers it on perfectly-configured devices |
| **W3** | `randomizer_draws.routine_instance_date` | Client-local writes: `useTaskRandomizerDraws.ts:33/154` (`today = todayLocalIso()`), `useRandomizerDraws.ts:255` (param from callers). Reads at `:55/231/268` and `RoutineStepChecklist.tsx:110-116` also client-local. The Surprise-Me determinism contract (Convention #163 UNIQUE partial index) is keyed on this column. No trigger, no default. | **0 rows in production** — feature not yet exercised. Structural gap only. | MEDIUM — pre-emptive; a misconfigured kid tablet would draw for the wrong day or defeat once-per-day |
| **W4** | `family_members.last_task_completion_date` + streak math | `roll_creature_for_completion` (every version through migration 100201) compares and writes `CURRENT_DATE` — **UTC day boundaries** for streaks. Evening completions in US timezones can double-count (6 PM + 8 PM Central straddle a UTC midnight → 2 "days") or skip (7:30 PM Mon + 6:30 PM Tue → same UTC day → streak doesn't grow). | Grandfathered surface under Convention #271 ("MUST refactor when next touched"). This build touching streak-date semantics IS a touch. | MEDIUM — kid-facing streaks quietly wrong in the evenings |

Not vulnerable / no action: `tasks.due_date` + rotation (fixed 3c79b89 via `fetchFamilyToday`); `visual_schedule_member_tasks.scheduled_date` (no client write path exists); `list_items.item_date`, `countdowns.target_date`, `calendar_events.event_date`, `allowance_configs.term_*`, `homeschool_configs.school_year_*`, `task_assignments.start/end_date` (all user-picked dates, visible in UI before save); `loans.interest_last_accrued` (Edge Function, family-timezone-aware); `family_members.date_of_birth` (user-entered).

### 3B. Read-side residuals (Category C class — viewing-device-only)

Post-triggers, bad data no longer *spreads*: these sites only show a wrong window **on the misconfigured viewing device itself**. Second-tier severity; fix as a batch with the April `todayFamily ?? todayLocalIso()` fallback pattern.

| # | Site | What it filters |
|---|---|---|
| R1 | The 8 tracker components (`StreakTracker:21`, `HabitGridTracker:125`, `BooleanCheckinTracker:10`, `ChecklistTracker:17`, `MoodRatingTracker:20`, `PercentageTracker:26`, `TimerDurationTracker:45`, `BestIntentionTracker:255`) | `recorded_date === today` client-local (pairs with W2 — fix together or evening entries still look missing) |
| R2 | `GuidedActiveTasksSection.tsx:46-48` | `filterTasksForToday()` unseeded (device clock inside) + completedToday grouping — the original Mosiah surface |
| R3 | `PlayDashboard.tsx:88` | has `todayFamily` in scope but doesn't pass it to `filterTasksForToday` (one-line); `PlayTaskTileGrid.tsx:493` raw; `DashboardTasksSection.tsx:74` and `Tasks.tsx:440` unseeded |
| R4 | `useTaskCompletions.ts:331,364` week hooks; `useTasks.ts:797` now/next bucketing; `GraceDayCalendar.tsx:68` isFuture; `useHomeschool.ts:279` weekly summary; `RoutineStepChecklist.tsx:110-116` linked-randomizer draw lookup; `useTaskRandomizerDraws.ts:33/55` | assorted today/week windows on device clock |
| R5 | `RoutineStepChecklist.tsx` `getSectionScheduledDay()` (~line 855) | client mirror of the 100245 walk-back seeds from device clock — uncheck of a carry-over row can fail to match on a drifted device |
| R6 | `useFamilyBestIntentions.ts:237,256` | optimistic-update **cache keys** only (the real query already uses familyToday) — cosmetic flicker on drifted devices |

Verified safe, no action: `useVictories` (TIMESTAMPTZ ranges via `startOfLocalDayUtc` — correct pattern); `useRoutineWeekView.ts:131` + `GraceDayCalendar.tsx:83` (explicitly UTC-constructed string math, eslint-justified); `useRoutineWeekView` `todayIso` param (RoutineWeekEditPage passes `useFamilyToday` ✓); `useFamilyOverviewData` (fully familyToday + `get_member_day_obligations` ✓); scheduler dtstart defaults (`useSchedulerState:20`, `schedulerUtils:24`, `RoutineDeployModal`) — mom-visible UI defaults; MindSweep/`extractCalendarDetail` `today:` AI context (optional polish); display-only labels (CelebrationArchive, InfoCalendarToday, Lists "Active today" badge, rhythm sections, exports/filenames).

### 3C. Documentation debris (part of this build)

- **D1 — CLAUDE.md Convention #257 rewrite.** Remove "awaiting remediation / remaining scope / next migration 100158" text. New text: remediation LANDED (100157→100245 lineage, 100158, 100163); the standing law (rules a/b/c) stays; the pre-work gate points at the §2 corrected queries; document the ±1 window and 100245 walk-back as the current contract.
- **D2 — CLIENT_DATE_AUDIT_2026-04-23.md** gets a dated addendum: status update + corrected verification queries (§2) + this file as the current inventory.
- **D3 — STUB_REGISTRY** "Member-Day Obligations — Grandfathered": record W4 disposition per the founder gate.

---

## 4. Hybrid Path 3 design for the residuals

Same architecture as shipped: **triggers own writes, `family_today` owns reads.** No new patterns.

### Migration work (numbers assigned at build dispatch — Slice 4 owns 100277+, do not reserve)

One migration, 100158-style, three trigger functions + backfill + (gated) one RPC edit:

1. **`set_practice_log_period_date()`** — member col `family_member_id`; source ts `COALESCE(NEW.created_at, NOW())`; ±1-day override window; SECURITY DEFINER, `SET search_path = public`, America/Chicago never-block fallback; `BEFORE INSERT OR UPDATE OF created_at, period_date`. Backfill: realign rows within ±1 (the 4 prod rows).
2. **`set_widget_data_point_recorded_date()`** — member col `family_member_id`; source ts `COALESCE(NEW.recorded_at, NOW())`; ±1 window (this is what keeps the March-26 seed import untouched — those rows are >1 day out). Backfill: realign ±1 rows (the 3 evening rows).
3. **`set_randomizer_draw_instance_date()`** — member col `family_member_id`; source ts `COALESCE(NEW.drawn_at, NEW.created_at, NOW())`; ±1 window. No backfill needed (0 rows). **Known edge:** a trigger correction could collide with the `auto_surprise` UNIQUE partial index if a draw already exists for the corrected day — the insert then fails loudly, which is correct (better than a silent split-brain draw pair); document in the migration header.
4. **(Founder gate G1)** `roll_creature_for_completion`: replace the streak block's `CURRENT_DATE` with family-local today (`(NOW() AT TIME ZONE f.timezone)::date` — the RPC already joins the member; one localized change in the newest version, 100201 lineage). Also `last_task_completion_date` write.

### Client code (Path 2)

- `usePractice.ts` both sites: `params.periodDate ?? await fetchFamilyToday(params.familyMemberId)` (value still needed for cache keys/advancement logic; the trigger is the backstop).
- R1 trackers: `useFamilyToday(widget.family_member_id)` with `?? todayLocalIso()` fallback (April pattern).
- R2/R3: thread a `today` Date (constructed `new Date(y, m-1, d)` from the familyToday string — NOT `new Date('YYYY-MM-DD')`, which parses UTC) into `filterTasksForToday(tasks, today)`; PlayDashboard already has the value in scope.
- R4/R5: batch-route through `useFamilyToday`/`fetchFamilyToday`; `getSectionScheduledDay` gains a `todayIso` param.
- R6: align optimistic cache keys with the familyToday the read query uses.
- Lint hardening note: the two-step `.toISOString()` → `.slice(0,10)` evasion (W1) can't be caught cheaply by AST; add it to the Convention #257 rewrite as an explicit named anti-pattern for review.

### Composition with Convention #271 (`get_member_day_obligations`)

Orthogonal by design, and already composed correctly everywhere that matters:

- **`family_today(member_id)` answers "WHICH day is it for this family."**
- **`get_member_day_obligations(member_id, start, end)` answers "WHAT counts on day X."**

Canonical pattern (already live in `useFamilyOverviewData`, `RoutineWeekEditPage`/`useRoutineWeekView`, `calculate_allowance_progress`, `calculate-allowance-period`): derive the day(s) from `family_today` or a server-stored period, pass them into the obligations RPC. This build changes **no** RPC signatures and re-derives **no** predicates — it only fixes the DAY input at the remaining call sites and the DATE column at the remaining write sites. The dashboard-truth invariant is strengthened, not modified.

### Test plan

- **`tests/e2e/features/client-date-cross-device.spec.ts` (extend — this is the main proof):**
  1. `practice_log` trigger override test (insert period_date=tomorrow, expect corrected) + **dual-write agreement**: a fresh practice session's `practice_log.period_date` === its `task_completions.period_date`.
  2. `widget_data_points` trigger override test (insert recorded_date=tomorrow with recorded_at=now, expect corrected); plus a seed-protection probe (insert recorded_date 10 days back → NOT overridden).
  3. `randomizer_draws` trigger override test (same shape).
  4. Replace/add the corrected `routine_step_completions` invariant: **positive-delta count = 0** (the post-100245 contract from §2).
  5. (If G1 accepted) streak boundary test: two completions same family-local evening straddling UTC midnight → streak +1, not +2.
- **`tests/routine-day-state-invariant.test.ts`:** NO corpus change required — this build does not touch the Layer-1 schedule predicate (`obligation_active_for_member_on_date`), so extending that corpus would assert nothing new. The dispatch prompt assumed otherwise from the stale convention text; the correct home for the new pins is the cross-device spec above. If G1 is accepted, the streak change is RPC-internal and also outside Layer 1.
- Standing regression pins (leak-pass, permissions-wiring, fo-command-center, kids-rewards slices) re-run after client edits; `tsc -b` + lint per Convention #121.

---

## 5. Founder gates — RESOLVED 2026-07-01

Founder ruling (2026-07-01): "1 with the streak fix is a yes. I want everything fixed and working as intended." All three gates resolved; full scope (W1–W4, R1–R6, D1–D3) approved for dispatch.

| # | Question | Resolution |
|---|---|---|
| G1 | Include the streak-RPC fix (W4) in this build? | **APPROVED** — explicit founder yes. |
| G2 | `widget_data_points` ±1 window — confirm no legitimate same-day/yesterday backdating path exists for trackers. | **CONFIRMED BY AUDIT** (no `recorded_date` client field exists; no backdating path; ±1 window safe) + covered by founder's "everything fixed" directive. |
| G3 | Approve the Convention #257 rewrite (D1) text at build close-out. | **APPROVED IN PRINCIPLE** — founder reviews the final wording at close-out as a standard checklist item. |

## 6. Effort

One migration + ~10 client file edits + E2E spec extension + doc rewrites. Single Sonnet worker session (xhigh) per `.claude/rules/model-routing.md`; half-day class. Migration number assigned at dispatch (Slice 4 owns 100277+).

## 7. Post-Build Verification

*(To be filled at Checkpoint 5 — every §3 item Wired / Stubbed / Missing.)*
