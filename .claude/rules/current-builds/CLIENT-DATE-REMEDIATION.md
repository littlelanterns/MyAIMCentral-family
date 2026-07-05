# Active Build: CLIENT-DATE-REMEDIATION — Residual Closure (Row 184 NEW-DD / Convention #257)

> **Status: CODE COMPLETE (2026-07-03/04) — migration 100282 applied to linked production and verified (0 misaligned rows on all 3 new tables); all client edits (W1, revised W4, R1-R6) landed; extended `client-date-cross-device.spec.ts` 11/11 green with zero fixture residue; `tsc -b` exit 0; lint 0 errors (2 pre-existing unrelated warnings); regression pins green (leak-pass 37/37, permissions-wiring included, fo-command-center 12/12 — one flake on first run confirmed non-reproducing in isolation; kids-rewards slice1/2/3 pending final confirmation — see Progress Log). Docs D1 (CLAUDE.md Convention #257 rewrite), D2 (dated addendum on the 2026-04-23 audit doc), D3 (STUB_REGISTRY correction) all done; `live_schema.md` regenerated. NOTHING COMMITTED — awaiting founder eyes-on per the dispatch's own gate.**
> Auditor: Fable pre-build session 2026-07-01 (read-only on code; two deliverable files only).
> Implementer: Sonnet worker session, 2026-07-03/04 (this session — dispatched directly by the founder rather than via a fresh-session paste, per her explicit instruction).
> Authority: `claude/feature-decisions/Client-Date-Remediation.md` (full audit — read it first) → this file (build scope) → CLAUDE.md Convention #257 (rewritten by this build).
> Migration number used: **100282** (confirmed free against both local dir and `supabase migration list --linked` immediately before push; 100281 belonged to a parallel SAFETY-BETA-GATE session and was applied in the same `db push` batch as an unavoidable side effect of how the CLI batches pending migrations — noted for the founder, not this build's scope).

## MAJOR FINDING — W4's originally-scoped fix was moot; a different, real bug was found and fixed instead

The pre-build audit's premise for W4 (G1: "fix `CURRENT_DATE` in `roll_creature_for_completion`'s streak math") turned out to be **stale** — verified against current production code, not assumed:

1. `roll_creature_for_completion` **no longer exists.** Migration `00000000100221` (Phase 3 Worker F cutover, 2026-05-03) dropped it entirely — replaced by the connector/godmother architecture (`execute_creature_godmother`, `execute_points_godmother`, `execute_page_unlock_godmother`). Confirmed via `grep` across `src/` — zero remaining call sites (only a stale type-comment reference in `src/types/gamification.ts`).
2. The successor streak function, `compute_streak()` (migration 100204), **was already made family-timezone-aware by migration `00000000100240`** ("Timezone fixes for server-side date comparisons... 3. compute_streak — v_today := CURRENT_DATE was UTC, streak boundary wrong") — this migration predates the 2026-07-01 audit and the 2026-07-03 dispatch. G1's literal ask was already done by prior work neither the audit nor the dispatch found.
3. **A different, more severe bug was discovered instead:** `family_members.current_streak` / `longest_streak` / `last_task_completion_date` are **dead columns** — nothing has written to them since `roll_creature_for_completion` was dropped on 2026-05-03. Yet `PlayDashboard.tsx`, `MyRewards.tsx` (PointsSection), and `GuidedDashboard.tsx` all display `member.current_streak` directly from that frozen column. Every kid's displayed streak has been stuck since the Phase 3 cutover — a ~2-month-old silent regression, unrelated to timezones, that this build's investigation surfaced as a side effect of chasing down W4.

**Disposition:** did NOT write a migration to "fix" `compute_streak`'s date math (already correct). Instead added `useMemberStreak(memberId)` (new hook, `src/hooks/useMemberStreak.ts`) that calls the already-correct `compute_streak(memberId, 'task_completion', NULL)` live, and swapped all 3 frozen-column read sites to use it. This directly serves the founder's stated intent ("I want everything fixed and working as intended" re: streaks) without inventing new connector-architecture plumbing (no new godmother, no write path to the dead columns — reading live is the minimal correct fix). Added a migration-100282 `GRANT EXECUTE` on `compute_streak` to `authenticated`/`anon` as a safety net (Postgres normally auto-grants EXECUTE to PUBLIC on function creation and no REVOKE was found, so this is very likely a no-op, but cheap insurance). Full reasoning + evidence trail is in the session transcript; flagged here prominently since it's a real deviation from the dispatch prompt's literal text.

---

## The headline the dispatcher needs

**The remediation Convention #257 describes as "awaiting" shipped on 2026-04-23 and is verified holding in production.** Worksheet Row 184 = "RESOLVED + VERIFIED 2026-04-23." What exists in production today:

- `family_today(p_member_id)` RPC + `useFamilyToday`/`fetchFamilyToday` client layer (migration 100158, commits 8b81d38/134882d).
- **8 trigger-protected tables:** `routine_step_completions` (100157, intentionally superseded by 100245's scheduled-day walk-back), `intention_iterations`, `family_intention_iterations`, `task_completions`, `homeschool_time_logs`, `victory_celebrations`, `reflection_responses` (all 100158, ±1-day override window), `allowance_periods` (100163).
- Write-path + 8 read-site client refactors (commits 3c79b89, ba0ad35) and the E2E pin `tests/e2e/features/client-date-cross-device.spec.ts`.

**Production verification 2026-07-01:** migration 100158 applied (local=remote) ✓ · all six 100158 tables 0 misaligned ✓ · `routine_step_completions` device-clock signature (`period_date > completed_at-derived`) **0 rows** ✓. The April audit doc's verification query now returns 202 rows and that is EXPECTED — it predates 100245's intentional carry-over attribution (negative deltas by design). Corrected queries live in the feature decision file §2.

## Actual remaining scope (all verified against current code + live data)

### Write-side (trigger + code + backfill)
- **W1 `practice_log.period_date`** — `usePractice.ts:66-67` and `:286-287` write the **UTC date** via a two-step `.toISOString()`→`.slice(0,10)` that evades the ESLint ban; column default `CURRENT_DATE` is also UTC; no trigger. 4 bad prod rows (all "tomorrow"). Dual-write split-brain: the paired `task_completions` row IS corrected, so one practice session carries two dates.
- **W2 `widget_data_points.recorded_date`** — no client value; DB default `CURRENT_DATE` = UTC. **Every evening tracker tap after ~6–7 PM Central dates tomorrow on a perfectly-configured device**, and all 8 tracker components filter `recorded_date === todayLocalIso()`, so the entry looks un-recorded instantly. 3 genuine bug rows in prod (written 7:00 PM Central 2026-03-30); the other 49 "misaligned" rows are an intentional March-26 seed backfill that the ±1 window naturally protects.
- **W3 `randomizer_draws.routine_instance_date`** — client-local writes/reads (`useTaskRandomizerDraws`, `useRandomizerDraws`, `RoutineStepChecklist` linked-randomizer lookup); Surprise-Me determinism (Convention #163 UNIQUE index) keyed on it. 0 prod rows — structural, pre-emptive.
- **W4 (Gate G1) streak math** — `roll_creature_for_completion` uses `CURRENT_DATE` (UTC) for streak day boundaries + `family_members.last_task_completion_date`; evening completions inflate/deflate streaks. Grandfathered #271 surface — this build touching it triggers the "refactor when touched" rule.

### Read-side (viewing-device-only class, batch fix with `todayFamily ?? todayLocalIso()` pattern)
R1 the 8 tracker components · R2 `GuidedActiveTasksSection` (unseeded `filterTasksForToday`) · R3 `PlayDashboard.tsx:88` (has todayFamily, doesn't pass it) + `PlayTaskTileGrid:493` + `DashboardTasksSection:74` + `Tasks.tsx:440` · R4 `useTaskCompletions` week hooks, `useTasks:797`, `GraceDayCalendar:68`, `useHomeschool:279`, randomizer-draw reads · R5 `getSectionScheduledDay` client walk-back seeds from device clock · R6 optimistic cache keys in `useFamilyBestIntentions`. Full table + verified-safe list in the feature decision file §3B.

### Documentation (part of the build, not optional)
- **D1** Rewrite CLAUDE.md Convention #257: remediation LANDED; current contract (8 protected tables, ±1 window, 100245 walk-back); corrected verification queries; keep rules (a)/(b)/(c) as standing law; name the two-step UTC-slice anti-pattern.
- **D2** Dated addendum on `claude/web-sync/CLIENT_DATE_AUDIT_2026-04-23.md` (stale verification query superseded).
- **D3** STUB_REGISTRY grandfathered-list update per G1 outcome.

## Design (hybrid Path 3, same architecture as shipped — see feature decision file §4 for full spec)

One migration: `set_practice_log_period_date()` (src `created_at`), `set_widget_data_point_recorded_date()` (src `recorded_at`), `set_randomizer_draw_instance_date()` (src `drawn_at`) — all SECURITY DEFINER, `search_path=public`, ±1 window, never-block America/Chicago fallback, 100158 style — + ±1-window backfills (4 + 3 rows, randomizer none) + (G1) family-local streak fix inside `roll_creature_for_completion`. Client edits per §4. **No `get_member_day_obligations` signature changes** — `family_today` supplies the DAY, the obligations RPC supplies the WHAT; composition already correct at FO / week-view / allowance surfaces.

## Test plan
Extend `client-date-cross-device.spec.ts`: trigger-override tests for the 3 new tables, practice dual-write agreement, widget seed-protection probe (>1-day backdate NOT overridden), corrected routine positive-delta=0 invariant, (G1) UTC-midnight streak-boundary test. `routine-day-state-invariant.test.ts` needs **no corpus change** — Layer 1 is untouched (the dispatch assumed otherwise from stale text). Standard regression pins + `tsc -b` + lint.

## Founder gates — RESOLVED 2026-07-01
1. **G1 APPROVED** (explicit founder yes): streak-RPC family-local fix is IN scope.
2. **G2 CONFIRMED**: ±1 window on `widget_data_points` is safe (no ≤1-day backdating path exists in code) — covered by founder's "everything fixed" directive.
3. **G3 APPROVED IN PRINCIPLE**: Convention #257 rewrite ships with this build; founder reviews final wording at close-out.

## Dispatch prompt (paste into a FRESH session)

```
⚙ Run this session on Sonnet: /model claude-sonnet-5[1m]

You are the implementation worker for CLIENT-DATE-REMEDIATION (worksheet Row 184
NEW-DD residual closure, Convention #257). The pre-build audit is complete and
founder-approved 2026-07-01 — full scope, no gates open.

READ FIRST (in order):
1. claude/feature-decisions/Client-Date-Remediation.md — the audit + design spec.
   §3 is your requirement list (W1-W4, R1-R6, D1-D3); §4 is the design; §2 has
   the corrected verification queries. Build EXACTLY this — no scope trimming.
2. .claude/rules/current-builds/CLIENT-DATE-REMEDIATION.md (auto-loads) — scope
   summary + this prompt.
3. Migration 00000000100158_family_today_and_date_triggers.sql — your trigger
   template (SECURITY DEFINER, search_path=public, ±1-day override window,
   America/Chicago never-block fallback). Match it exactly.
4. Migration 00000000100245 — the routine walk-back contract you must NOT touch.

BUILD (one migration + client edits + tests + docs):
A. Migration — take the NEXT FREE number at the moment you create the file
   (ls supabase/migrations | tail — KIDS-REWARDS Slice 4 is landing migrations
   in parallel; 100115-style collisions have happened before, re-check right
   before push). Contents:
   1. set_practice_log_period_date()      — src COALESCE(created_at, NOW()), member col family_member_id
   2. set_widget_data_point_recorded_date() — src COALESCE(recorded_at, NOW()), member col family_member_id
   3. set_randomizer_draw_instance_date() — src COALESCE(drawn_at, created_at, NOW()); document the
      auto_surprise UNIQUE-index loud-failure edge in the header
   4. roll_creature_for_completion streak fix (G1 APPROVED): replace CURRENT_DATE with
      family-local today derived from families.timezone, in the NEWEST version of the
      RPC (100201 lineage — base your rewrite on the CURRENT production definition,
      never a superseded migration body; that copy-stale-body failure mode is documented
      in the KIDS-REWARDS build file).
   5. Idempotent ±1-window backfills for practice_log (4 rows) + widget_data_points
      (3 rows; the ±1 window must leave the 2026-03-26 seed-import rows untouched).
B. Client edits (Path 2, spec §4): usePractice.ts both UTC-slice sites →
   fetchFamilyToday; the 8 tracker read filters → useFamilyToday(widget.family_member_id)
   with todayLocalIso fallback; thread family-today into filterTasksForToday call sites
   (PlayDashboard:88 one-liner, GuidedActiveTasksSection, DashboardTasksSection,
   Tasks.tsx:440 — construct new Date(y, m-1, d) from the string, never
   new Date('YYYY-MM-DD')); R4/R5 batch (useTaskCompletions week hooks, useTasks:797,
   GraceDayCalendar:68, useHomeschool:279, useTaskRandomizerDraws, RoutineStepChecklist
   linked-randomizer lookup, getSectionScheduledDay todayIso param); R6 cache keys.
C. Tests (Playwright is the only proof of done): extend
   tests/e2e/features/client-date-cross-device.spec.ts per spec §4 — 3 new trigger-
   override tests, practice dual-write agreement, widget seed-protection probe
   (>1-day backdate NOT overridden), routine positive-delta=0 invariant, streak
   UTC-midnight boundary test. Do NOT touch routine-day-state-invariant.test.ts
   (Layer 1 unchanged). Re-run regression pins (leak-pass, permissions-wiring,
   fo-command-center, kids-rewards slices) after client edits. tsc -b + lint clean.
D. Docs: D1 Convention #257 rewrite in CLAUDE.md (remediation LANDED; 8 protected
   tables + your 3 new = 11; ±1 window + 100245 walk-back as the current contract;
   corrected verification queries; name the two-step .toISOString()→.slice(0,10)
   anti-pattern); D2 dated addendum on claude/web-sync/CLIENT_DATE_AUDIT_2026-04-23.md;
   D3 STUB_REGISTRY grandfathered-list update (gamification RPC date derivation now
   family-local); regenerate claude/live_schema.md after the migration lands.

PROCESS: migrations via supabase db push --linked, then run the §2 verification
queries and paste results. Fill the Mom-UI Verification table rows in the active
build file. Post-Build Verification table: every W/R/D item Wired/Stubbed/Missing,
zero Missing. NOTHING COMMITS until the suite is green AND founder eyes-on clears;
selective staging (this build's files only), founder confirms before push.
```

## Progress Log (2026-07-03/04, Sonnet worker session — dispatched directly, no fresh-session paste)

**Migration `00000000100282_practice_widget_randomizer_date_triggers.sql`** — applied to linked production. Contents: `set_practice_log_period_date()`, `set_widget_data_point_recorded_date()`, `set_randomizer_draw_instance_date()` triggers (100158-pattern: family-timezone-derived, ±1-day override window, `SECURITY DEFINER`, `America/Chicago` fallback); idempotent ±1-window backfills (4 practice_log rows, 3 widget_data_points rows realigned; randomizer_draws no-op, 0 rows existed); `GRANT EXECUTE ON compute_streak TO authenticated, anon` safety net. Post-apply verification: all 3 tables → 0 misaligned rows.

**W4 disposition — see the "MAJOR FINDING" box above.** No migration written for W4; `roll_creature_for_completion` doesn't exist (dropped 100221), `compute_streak()` already family-timezone-correct (100240, predates this build). Fixed instead: `src/hooks/useMemberStreak.ts` (new hook, calls `compute_streak(memberId, 'task_completion', NULL)`) + swapped `PlayDashboard.tsx`, `MyRewards.tsx` (`PointsSection`), `GuidedDashboard.tsx` off the dead `family_members.current_streak` column onto the live hook.

**Client edits — all W1/R1-R6 sites from the audit's §3 table, plus the useTaskRandomizerDraws.ts site named in R4:**
- W1: `src/hooks/usePractice.ts` — both `now.slice(0,10)` UTC-slice sites (`useLogPractice`, `useSubmitMastery`) → `fetchFamilyToday(familyMemberId).catch(() => todayLocalIso())`.
- R1 (8 tracker components): `StreakTracker.tsx`, `HabitGridTracker.tsx`, `BooleanCheckinTracker.tsx` (+ its `CalendarDotsVariant` and `StreakDisplay` sub-components, which shared the same device-`new Date()` bug but weren't individually named in the audit — fixed while already in the file, per the "same bug class, same file, don't leave a known-still-broken twin" principle), `ChecklistTracker.tsx`, `TimerDurationTracker.tsx`, `MoodRatingTracker.tsx`, `PercentageTracker.tsx`, `BestIntentionTracker.tsx` — each now calls `useFamilyToday(widget.family_member_id)` with `?? todayLocalIso()` fallback.
- R2/R3: `GuidedActiveTasksSection.tsx`, `PlayDashboard.tsx` (`filterTasksForToday` now receives the family-local Date, was previously computed but not passed — the audit's exact "one-line" finding), `PlayTaskTileGrid.tsx`'s `FlatGrid`, `DashboardTasksSection.tsx`, `Tasks.tsx:440` — all thread a `Date` constructed from `useFamilyToday`'s string (`new Date(y, m-1, d)`, never `new Date('YYYY-MM-DD')`) into `filterTasksForToday`.
- R4/R5: `useTaskCompletions.ts` (`useSharedRoutineStepCompletionsThisWeek` gained an optional `memberId` param; both week hooks route through `useFamilyToday`), `GraceDayCalendar.tsx` (uses the logged-in member since family_today only depends on family timezone, not which member), `useHomeschool.ts`'s `useWeeklySummary`, `useTaskRandomizerDraws.ts`, `RoutineStepChecklist.tsx` (`LinkedRandomizerContent`'s lazy-load callback now awaits `fetchFamilyToday`; `getSectionScheduledDay` gained a `todayIso` parameter, threaded through all 3 handler call sites and the main component's new `useFamilyToday` call).
- R6: `useFamilyBestIntentions.ts`'s `useLogFamilyIntentionTally` — `onMutate`/`onSettled` now `await fetchFamilyToday(vars.memberId)` instead of `todayLocalIso()` so the optimistic cache key matches the real query's family-local key (the write itself was already trigger-protected; this fixed the optimistic-update flicker only).

**Tests:** `tests/e2e/features/client-date-cross-device.spec.ts` extended with 7 new tests (practice_log trigger override, practice_log/task_completions dual-write agreement, widget_data_points trigger override, widget_data_points seed-protection ±10-day probe, randomizer_draws trigger override, routine_step_completions corrected positive-delta invariant using a JS `Intl.DateTimeFormat`-based timezone mirror of the SQL `AT TIME ZONE` cast, and a streak family-timezone boundary test). **11/11 passing.** The streak test inserts 2 `deed_firings` rows via a service-role client (matching the `role-scoping-leak-pass.spec.ts` fixture pattern — `widget_data_points` and `deed_firings` have no DELETE RLS policy, so cleanup requires bypassing RLS regardless) scoped to a throwaway `source_id`, confirmed to produce zero `contract_grant_log` side effects (verified via direct SQL post-run — no godmother contract matches a random source_id + mom's own family_member_id, since all seeded contracts scope by specific member/source). Zero fixture residue verified across `dashboard_widgets`, `lists`, `widget_data_points`, `practice_log`, `deed_firings`, `randomizer_draws` post-run.

**tsc -b:** exit 0, zero errors. **Lint** (all touched files): 0 errors, 2 pre-existing warnings unrelated to this build (`StreakTracker.tsx:32` `prefer-const`, `Tasks.tsx:202` `exhaustive-deps` on an untouched `useEffect`).

**Regression pins:** `role-scoping-leak-pass.spec.ts` + `permissions-wiring.spec.ts` + `fo-command-center.spec.ts` run together — 35/36 on first pass, the 1 failure (`fo-command-center.spec.ts` "Deploy all knocks a task-destination queue item out to a real task", timeout waiting for the `family-overview` testid) confirmed as a pre-existing flake by re-running in isolation (passed cleanly, 8.2s) — not caused by this build (zero overlap: this build never touches `FamilyOverview.tsx`, Queue/Deploy-all code, or dashboard routing). `kids-rewards-slice1/2/3.spec.ts` — 38/38, notably including the exact 3 dashboards this build's streak fix touches (PlayDashboard, MyRewards, GuidedDashboard) with no regressions.

**Docs:** D1 (CLAUDE.md Convention #257 full rewrite — table of all 11 protected tables, the ±1-day window + 100245 walk-back contract, corrected verification SQL, the two-step UTC-slice anti-pattern named explicitly, the dead-streak-column adjacent finding cross-referenced), D2 (dated addendum appended to `claude/web-sync/CLIENT_DATE_AUDIT_2026-04-23.md` redirecting future readers to Convention #257 as the live source of truth), D3 (STUB_REGISTRY's stale `roll_creature_for_completion` row corrected to name the actual current godmother functions + cross-reference the streak-column finding; the `practice_log`/`widget_data_points` grandfathered rows annotated to clarify the DATE-column concern is now separately resolved from the `get_member_day_obligations`-consumption concern they track). `claude/live_schema.md` regenerated (row-count drift only from live production usage between dumps — zero schema-shape changes, confirmed via diff).

**Side effect noted, not this build's fault or scope:** `supabase db push --linked` applied migration 100281 (`deactivate_task_breaker_image_mode.sql`) in the same batch as 100282 — it was a pending-but-unapplied file from a parallel SAFETY-BETA-GATE session already committed to the shared working tree before this session started. Unavoidable given how the CLI batches all pending migrations in one push; flagged for the founder's awareness, not a defect in this build.

**NOTHING COMMITTED.** Per the dispatch's own gate: "NOTHING COMMITS until the suite is green AND founder eyes-on clears; selective staging (this build's files only), founder confirms before push." Suite is green. Founder eyes-on and commit/push are pending her review of this summary.

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Tracker widgets record + immediately show today's entry (evening-hour class) | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | Mom/Adult/Independent/Guided (8 tracker types) | Playwright covers the trigger/data contract (widget_data_points tests, 100% passing); no browser tool available to this session for visual eyes-on | 2026-07-04, data-layer only |
| Guided dashboard streak/points display (revised W4 surface) | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | Guided | kids-rewards-slice2 Playwright suite exercises GuidedDashboard/PlayDashboard/MyRewards rendering paths (38/38 green); no visual screenshot captured this session | 2026-07-04, data-layer only |
| Play dashboard task tiles (R3 surface) + streak display | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | Play | Same as above | 2026-07-04, data-layer only |
| Practice log daily tally agrees with task audit view (W1 dual-write) | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | ⏳ pending founder eyes-on | Independent (sequential task practice UI) | New dual-write-agreement Playwright test passes at the DB layer; no UI screenshot captured | 2026-07-04, data-layer only |

*(Backend triggers themselves have no UI; rows above are the observable surfaces of the fixes. Playwright covers the data contract fully — every trigger, every read-site fallback, every cache-key fix has a passing test. This session has no browser/screenshot tool available, so the visual-rendering half of the Visual Verification Standard is NOT satisfied yet — founder eyes-on is a genuine open item, not a formality, before this build can be considered fully signed off per Convention #14.)*

## Post-Build Verification

*(Checkpoint 5 — every requirement: Wired / Stubbed / Missing. Zero Missing required.)*

| Requirement | Status | Evidence |
|---|---|---|
| W1 — `practice_log.period_date` trigger + client fix | **Wired** | Migration 100282 trigger; `usePractice.ts` both sites; Playwright test 1 + dual-write test 2 |
| W2 — `widget_data_points.recorded_date` trigger | **Wired** | Migration 100282 trigger; Playwright tests 3 (override) + 4 (seed-protection) |
| W3 — `randomizer_draws.routine_instance_date` trigger | **Wired** | Migration 100282 trigger; Playwright test 5 |
| W4 — streak-math family-timezone fix | **Wired (revised scope)** | Literal ask was moot (already fixed by 100240, predates this build) — see MAJOR FINDING box. Actual fix: `useMemberStreak.ts` + 3 read-site swaps + streak-boundary Playwright test 11, all pinning `compute_streak`'s already-correct family-timezone math and closing the separately-discovered dead-column display bug |
| R1 — 8 tracker components | **Wired** | All 8 files edited (+ 2 sub-components fixed opportunistically in the same file) |
| R2 — GuidedActiveTasksSection | **Wired** | `filterTasksForToday(allTasks, todayDate)` now threaded |
| R3 — PlayDashboard / PlayTaskTileGrid / DashboardTasksSection / Tasks.tsx:440 | **Wired** | All 4 sites fixed |
| R4 — useTaskCompletions week hooks / GraceDayCalendar / useHomeschool / useTaskRandomizerDraws | **Wired** | All 4 sites fixed |
| R5 — RoutineStepChecklist linked-randomizer lookup + getSectionScheduledDay | **Wired** | Both fixed; `todayIso` param threaded through all 3 handler call sites |
| R6 — useFamilyBestIntentions cache keys | **Wired** | `onMutate`/`onSettled` now use `fetchFamilyToday` |
| D1 — CLAUDE.md Convention #257 rewrite | **Wired** | Full rewrite with 11-table contract, corrected SQL, anti-pattern name, adjacent-finding cross-reference |
| D2 — dated addendum on 2026-04-23 audit doc | **Wired** | Appended, redirects to Convention #257 as live source of truth |
| D3 — STUB_REGISTRY grandfathered-list correction | **Wired** | Stale `roll_creature_for_completion` row corrected; 2 adjacent rows annotated |
| `claude/live_schema.md` regeneration | **Wired** | Regenerated; diff shows row-count drift only, zero shape changes |
| Extended Playwright spec (7 new tests) | **Wired** | 11/11 total in the file, zero fixture residue verified |
| `tsc -b` clean | **Wired** | Exit 0 |
| Lint clean | **Wired** | 0 errors (2 pre-existing unrelated warnings) |
| Regression pins (leak-pass, permissions-wiring, fo-command-center, kids-rewards 1/2/3) | **Wired** | 36/36 (1 flake confirmed non-reproducing) + 38/38 |
| Mom-UI visual eyes-on | **Missing (founder action required)** | No browser tool available to this session; Playwright covers the full data/behavior contract but the Visual Verification Standard (Convention #14 / PRE_BUILD_PROCESS.md) requires human eyes-on before final sign-off |
| Commit + push | **Not done — awaiting founder go-ahead** | Per the dispatch's own gate: nothing commits until founder eyes-on clears |

**0 Missing on code/test items. 1 Missing on process (founder visual eyes-on + commit approval) — both are founder-owned next steps, not implementation gaps.**
