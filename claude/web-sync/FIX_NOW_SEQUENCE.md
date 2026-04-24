# FIX_NOW_SEQUENCE.md

> **Status:** DRAFT v15 — Row 9 SCOPE-3.F14 B1a correctness floor landed 2026-04-24
> **Generated:** 2026-04-21 by Dependency-Graph worker; revised 2026-04-21 (v2), 2026-04-22 (v3), 2026-04-23 (v13 NEW-DD resolve), 2026-04-24 (v14 Wave 1 landing, v15 Row 9 B1a) by orchestrator
> **Purpose:** Session 2 adjudication aid — orders Fix Now + Fix Next Build findings so the execution queue respects real dependencies. Reads alongside [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) and [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md).
> **Scope:** 189 rows total (184 + 5 B1b follow-up rows NEW-EE..NEW-II added by Worker B1a 2026-04-24). Wave-assigned: 11 Fix Now + 3 Fix Now (+compound) + 1 Fix Code + 24 new Fix Next Build rows (NEW-F..NEW-CC) + 5 B1b follow-up rows + existing Fix Next Build rows. 32 Beta Readiness blockers anchor the ordering. `Defer-to-Gate-4`, `Tech Debt`, `Intentional-Update-Doc`, `Closed/Resolved`, `Informational`, `Capture-only` rows omitted from waves but called out when they appear as upstream blockers.

---

## What changed from v14 → v15 (Row 9 SCOPE-3.F14 B1a correctness floor 2026-04-24)

**Row 9 B1a LANDED. Row 9 does NOT resolve until B1b lands.** Worker B1a shipped the allowance correctness floor per founder's two-worker split decision (B1a = correctness floor, B1b = PRD-28 conformance).

**B1a deliverables:**
- Migration `00000000100163_allowance_periods_date_trigger.sql` (commit `5bfe7ad`) — BEFORE INSERT OR UPDATE trigger deriving `period_start` + `period_end` server-side (Option (b) semantics: first period may be partial; subsequent periods are full 7-day aligned) + partial unique index preventing concurrent active periods + idempotent backfill.
- Migration `00000000100164_calculate_allowance_progress_fix.sql` (commit `adc62b2`) — RPC body replaced with corrected numerator logic. **Bug 1 fix:** weekday filter now symmetric (numerator respects section.frequency_days). **Bug 2 fix:** DISTINCT on (step_id, period_date) dedupes check/uncheck/recheck cycles.
- Frontend + Edge Function audit fixes (commit `ecd96ed`) — `useStartAllowancePeriod` trigger-derives `period_end`; `useCompletionPercentage` fallback uses `isoDaysFrom(familyToday)`; `ChildAllowanceConfig` effect gains `!startPeriod.isPending` guard; `AllowanceCalculatorTracker` legacy-fallback threads `familyToday`; `calculate-allowance-period` cron roll-over trigger-derives `period_end`.
- Verification script (commit `aed10ff`) — `tests/verification/row-9-allowance-end-to-end.ts`, 10 scenarios covering bootstrap / trigger correction / backdated / double-bootstrap guard / cron roll-over / non-weekly raise / Bug 1 / Bug 2 / negative case. **10/10 pass locally.**

**Production RPC delta spot-check (pre-fix buggy-numerator simulation vs post-100164 RPC):**

| Child  | pre | post | delta |
|--------|-----|------|-------|
| Helam  | 14  | 14   | 0     |
| Gideon | 37  | 22   | 15    |
| Miriam | 6   | 6    | 0     |
| Mosiah | 110 | 56   | 54    |

Gideon's completion count was inflated by 41%, Mosiah's by 49%. Helam + Miriam unchanged (their completions are clean — all on-schedule and non-duplicated). Real money on the line.

**B1b follow-up rows added (Worker B1a flagged during PRD-28 conformance walkthrough of Row 9):**

| Row | ID | Gap |
|---|---|---|
| 185 | NEW-EE | PRD-28 Extra Credit mechanism stubbed in schema, not implemented |
| 186 | NEW-FF | PRD-28 "Preview This Week" button missing from config screen |
| 187 | NEW-GG | PRD-28 Grace Days — plumbing exists, no UI for mom to mark a day |
| 188 | NEW-HH | PRD-28 unmark/rollback cascade unimplemented |
| 189 | NEW-II | PRD-28 `calculation_time` ignored by cron (always fires at midnight) |

**Migration collision guard:** next new migration ≥ `00000000100165_`.

**Convention #257 compliance check:** zero new `todayLocalIso()` / `localIsoDaysFromToday` client writes to DATE columns introduced by this commit set. `isoDaysFrom(baseIso, offset)` + `isoDayOfWeek(baseIso)` added to `src/utils/dates.ts` as server-anchored helpers.

**Coordination resolved:**
- Row 184 NEW-DD → Row 9 B1a: B1a consumed the `family_today()` RPC from 100158 and extended the trigger family to cover `allowance_periods`.
- Row 44 NEW-W still Fix Next Build pool — dedup work now lives IN the 100164 RPC (Bug 2 fix), so NEW-W's original scope is materially reduced to Segment-side counting; re-scope needed.

---

## What changed from v13 → v14 (Phase 4 Wave 1 landing complete 2026-04-24)

**11 Wave 1 rows resolved in a single session (Phase 4 Phase A dispatch, 5 workers: A1 NEW-B, A2 Wave 1B Board sprint, A3 Tier 1 cluster, A4 Admin shell, A5 Playwright verification).**

Resolved rows and authoritative commits:

| Row | Finding | Worker | Commits |
|---|---|---|---|
| 8 | NEW-B (drawer default + General removal + routing concierge) | A1 | `5a52e80`, `1e25416`, `6c48021` |
| 10 | SCOPE-3.F41 (MemberAssignmentModal column drift) | A3 | `ba68ebd` |
| 11 | SCOPE-4.F4 (Board persona cache architecture) | A2 | `ab318e4`, `dab078d` |
| 12 | SCOPE-4.F8a (privacy hard-constraint bypass) | A2 | `8a16889` |
| 18 | SCOPE-8b.F3 (HITM gate on board_personas) | A2 | `0c8b5f4`, `6476646` |
| 21 | SCOPE-8b.F7 (.ics CHECK constraint) | A3 | `1744969` |
| 26 | SCOPE-8a.F5 (content policy fail-closed) | A2 | `dab078d` |
| 27 | SCOPE-3.F22 (/rewards route) | A3 | `81e07bf` |
| 62 | SCOPE-2.F48 (Admin Console shell) | A4, A5 | `d27b1c9`, `c7c516e` |
| 94 | SCOPE-4.F8b (assembleContext refactor — Board scope only) | A2 | `8a16889` |
| 180 | SCOPE-4.F7 (moderator opt-in) | A2 | `8a16889`, `0c8b5f4` |

**Supporting commits (not wave-assigned rows):**
- `4a533bd` — A4 Admin shell follow-up commit after initial `d27b1c9`
- `abc42f4` — BUILD_STATUS timestamp auto-update
- `b5c3b6f` — `live_schema.md` regeneration after migrations 100161 + 100162 applied

**Migration ledger (Wave 1):**
- 100159 — A1 Assist concierge opening_messages seed
- 100160 — A3 calendar_events CHECK widen (attribution entangled — A3 authored, landed via A2's collision-resolution merge in `1744969`)
- 100161 — A2 persona_architecture_rebuild (three-tier schema + RPCs + invariants)
- 100162 — A2 list_approved_personas RPC

**Migration collision guard:** next new migration ≥ `00000000100163_`.

**Production verification 2026-04-24:** all 4 post-migration invariants pass (18 Tier-3 rows, 0 non-personal rows in `public.board_personas`, 0 promotion queue rows, Board `context_sources` widened to 5 sources).

**Carryovers / known gaps:**
- **Row 94 Decision Guide refactor deferred.** Board of Directors scope of F8b resolved via assembleContext refactor; Decision Guide needs the same treatment — add as Fix Next Build follow-up row.
- **Row 180 PRD-34 moderator-behavior amendment deferred.** Code change landed; PRD text update belongs in Intentional-Update-Doc sweep.
- **Row 18 PRD-34 §5 classifier deferred infrastructure polish.** Layer B Playwright multi-user E2E test (addendum §8) deferred per founder answer #5 during sprint dispatch — will be recorded in TECH_DEBT_REGISTER.md follow-up.
- **A5 visual verification spec** `tests/e2e/features/admin-shell.spec.ts` authored but NOT executed against live app — founder to run `npx playwright test tests/e2e/features/admin-shell.spec.ts` (or manual /admin check) as post-landing confirmation.

**Lessons from Phase 4 Phase A:**
- **Parallel workers shared a worktree** during the session. Observed symptoms included stash-pop conflict markers in A2's files, A5's uncommitted work surviving despite apparent reverts (A2 explicitly unstaged them per commit message), A3/A2 commit SHA churn during collision resolution (migration 100160), and A2's final commit `6476646` landing only on local main until post-session push. **All Phase B+ dispatches MUST specify `isolation: "worktree"` in the Agent tool invocation.** The Agent tool supports this; not specifying it in Phase A cost review time and attribution clarity.
- **Migration number coordination worked via race-to-commit-first** despite shared worktree. Three workers held reservations on 100159; A1 took it first, A3 took 100160, A2 took 100161+100162. No number collision shipped to origin.
- **Worker self-reports about reverting files** (A5) and **attribution entanglement** (A3) were correct diagnostics. Parallel git operations (checkout, stash, rebase) in a shared worktree do produce the exact symptoms observed.

## What changed from v12 → v13 (NEW-DD Wave 1 remediation complete 2026-04-23)

**Row 184 NEW-DD RESOLVED.** Migration 100158 landed (commit 8b81d38 and follow-ons 134882d, 3c79b89, ba0ad35, 79fff78). Scope delivered as planned:
- `family_today(p_member_id UUID)` RPC (SECURITY DEFINER, STABLE)
- 6 BEFORE INSERT OR UPDATE triggers on `intention_iterations`, `family_intention_iterations`, `task_completions`, `homeschool_time_logs`, `victory_celebrations`, `reflection_responses`
- Idempotent backfill with 1-day override window
- `src/hooks/useFamilyToday.ts` hook + `fetchFamilyToday` helper
- 2 write sites + 8+ read-filter sites migrated
- E2E cross-device date regression test locks 4 invariants
- `tsc -b` + `npm run prebuild` clean
- `claude/live_schema.md` regenerated post-migration

**Convention #257 compliance check:** zero new `todayLocalIso()` client writes to DATE columns introduced by this commit set (ESLint `no-restricted-syntax` rule enforced in prebuild).

**Migration collision guard:** next new migration ≥ `00000000100159_`.

**Coordination resolved:**
- SCOPE-3.F14 dispatch-time note still valid — F14 worker now consumes the `family_today` RPC rather than inlining its own trigger.
- NEW-W dispatch-time note still valid — dedup work consumes `calculate_allowance_progress` RPC + `family_today` semantics.

**Production verification complete 2026-04-23:** all 7 tables return 0 misaligned rows. Trigger pattern holding end-to-end, backfill ran cleanly.

## What changed from v11 → v12 (post-Session-2 NEW-DD addition 2026-04-23)

**Post-audit finding added after Session 2 close:** Client-computed date bug class discovered 2026-04-23 (see `claude/web-sync/CLIENT_DATE_AUDIT_2026-04-23.md`). `todayLocalIso()` client writes to DATE columns silently misalign when device clocks/timezones are misconfigured, causing cross-device data invisibility (kid's routine step checkmarks invisible to mom on correctly-configured device). Partial fix landed same day for `routine_step_completions` only (migration 100157 — BEFORE INSERT OR UPDATE trigger + 31-row backfill).

- **Worksheet Row 184 NEW-DD added** — Fix Now (+compound), Wave 1, Beta=Y, High severity. Remediation scope: 7 other vulnerable tables + 8 client-side filter sites via hybrid Path 3 (per-table triggers + `family_today(member_id)` RPC).
- **Parallel-safe in Wave 1:** hybrid Path 3 is per-table independent. F14/NEW-W workers either consume NEW-DD framework if it lands first OR inline their own trigger following migration 100157 pattern.
- **Standing rule published as Convention 257** — no new `todayLocalIso()` client writes to DATE columns; all "today" filters use server-derived dates. Fast-commit pattern (NEW-G / SCOPE-2.F39 analogue) — convention published immediately to prevent regression during any other Wave 1 dispatch.
- **Dispatch-time notes updated on:** Row 9 SCOPE-3.F14 (allowance_periods DATE columns follow Convention 257), Row 44 NEW-W (allowance dedup DATE touches follow Convention 257).
- **Migration collision guard:** next new migration starts at `00000000100158_` (supersedes prior `100157` references in handoff notes).
- **Distribution:** Fix Now (+compound) 2 → 3; total rows 183 → 184; Beta Readiness blockers 27 → 28; High severity 21 → 22.

### v12 adjacency list additions

```
# NEW-DD (v12) — Wave 1 date-class remediation
# Parallel-safe with other Wave 1 rows. F14 + NEW-W either consume NEW-DD
# framework if it lands first OR inline their own triggers (migration 100157
# pattern).
NEW-DD ~~> SCOPE-3.F14
NEW-DD ~~> SCOPE-3.F41  # if F41 MemberAssignmentModal writes any DATE column
NEW-DD ~~> NEW-W        # Fix Next Build, sequences after F14 anyway
```

---

## Session 2 audit-calibration note (captured 2026-04-23)

**Scope 4 Intentional-Update-Doc rate-of-drift at audit-to-triage interface: 7/8 (87.5%).** Pattern: Phase 2 classifier read consistency-of-failure as consistency-of-intent, miscoding Unintentional-Fix-Code as Intentional-Update-Doc. The feature was consistently broken or unwired and the audit read the consistency as evidence of intentional design.

Seven Scope 4 rows reclassified Intentional-Update-Doc → Fix Code during Session 2:
SCOPE-4.F1 (Row 31, three-question test surfaced), SCOPE-4.F5 (Row 93, three-question test surfaced), SCOPE-4.F3, F6, F7, F9, F10 (all surfaced via Batch 6 mandatory-surface criterion for Scope 4 Intentional-Update-Doc).

One Scope 4 row held clean: SCOPE-4.F2 (pgmq pipeline dormant) — only row where audit explicitly cites an over-promised source doc (`claude/ai_patterns.md` §Embedding Pipeline L222-251).

**Future-audit calibration:** Scope 4 Intentional-Update-Doc proposals require source-doc citation as a default, not an exception. If a future Phase 2 pass processes Scope 4 findings, the classifier should default to Unintentional-Fix-Code unless a source doc can be cited that genuinely over-promises current behavior.

## What changed from v10 → v11 (Session 2 close — Batch 6 final surface + Scope 4 pattern resolution)

- **5 Scope 4 rows reclassified Intentional-Update-Doc → Fix Code.** Three-question test applied per Row 31 / Row 93 pattern. Reclassified: SCOPE-4.F10, F3, F6, F7, F9. Clean: SCOPE-4.F2 (only one where audit explicitly over-promises ai_patterns.md doc). Pattern now 7-for-8 across all Scope 4 Intentional-Update-Doc rows (F1+F5+F10+F3+F6+F7+F9 drift; F2 clean). Classifier systematically mis-coded Unintentional-Fix-Code at Scope 4.
- **SCOPE-4.F7 folded into Wave 1B Board sprint.** Same `lila-board-of-directors/index.ts` file as F4 + F8a + F8b + 8a.F5 + 8b.F3. Moderator auto-interjection revoke ships in the consolidated sprint. PRD-34 amendment (sub-item c) bundled with F4's PRD-34 addendum requirement.
- **Wave 1B Board sprint scope grew to 6 rows:** SCOPE-8a.F5 + SCOPE-4.F4 + SCOPE-8b.F3 + SCOPE-4.F8a + SCOPE-4.F8b + SCOPE-4.F7.
- **Dispatch-time notes encoded for production-intersection rows:** SCOPE-3.F14 (Row 9) flagged for scope-vs-production-fix verification; NEW-W (Row 44) must implement dedup INSIDE `calculate_allowance_progress` RPC; SCOPE-3.F31 (Row 168) must check dead enum values against new RPC architecture.
- **Distribution shift:** Intentional-Update-Doc 37→32 (-5), Fix Code 3→8 (+5).

## What changed from v9 → v10 (Session 2 Batch 6 first-20 recalibration)

- **Batch 6 recalibration:** Path 1 accepted — high silent-approve rate is expected for Low Beta=N uniform-pattern rows. Modifications adopted: (i) mandatory batch-close spot-check at 183/183 (criterion g retrospective on final 20 silent-approved); (ii) mid-batch spot-check at ~row 141 (same criterion g retrospective on most recent 20); (iii) Scope 4 addition — ALL remaining Scope 4 rows with Proposed = Intentional-Update-Doc surface regardless of severity (Row 31 + Row 93 pattern = 2-for-2 drift evidence at Scope 4 / Intentional-Update-Doc intersection).
- **SCOPE-2.F2 encoded with dependency + elevation.** Pre-monetization prerequisite; sequences after SCOPE-2.F1 (Wave 0 webhook-only) lands. Both F1 + F2 block full PRD-31 build (SCOPE-3.F34 Defer-to-Gate-4). F2 marked **ELEVATED priority-within-pool** (same pattern as SCOPE-3.F38 Row 89) — pre-monetization prerequisites should not sit indefinitely in general queue.

## What changed from v8 → v9 (Session 2 Batch 5 close + 3 holds resolved)

- **SCOPE-4.F5 reclassified Intentional-Update-Doc → Fix Code (Wave 5).** Row 31 three-question test returned gaps on all three: no intended-exclusion source doc, no over-promised doc to amend, no cost-model delta. Audit explicitly says "Unintentional-Fix-Code" with founder-approved scope 2026-04-20. Stays blocked by SCOPE-4.F4 W1B. Second reclassification of this pattern (first was SCOPE-4.F1 at Row 31).
- **SCOPE-8a.F4 pulled W2-adjacent → Wave 1.** Architectural check confirmed F4 is independent of SCOPE-8b.F5 — F4 uses existing `detectCrisis` helper + removes "except Translator" exception. Same safety-critical W1 pull pattern as SCOPE-2.F40 (Row 59). Third W1-pull-for-safety-not-calendar-grouping decision this session.
- **SCOPE-3.F38 Path B locked with ELEVATED priority-within-pool annotation.** Non-mom over-access confirmed (special_adult over-granted Family Overview + Family Hub per PRD-14C/D). Beta=N retained per audit (orphan surface, special_adult has no coordination-layer workflows). Fix Next Build stays. Elevation reason: UI-vs-PRD contradictions ossify if unfixed; future PerspectiveSwitcher work should build on corrected gating.
- **NEW-AA worker scope grew to 4 rows** with SCOPE-3.F30 fold: NEW-AA + SCOPE-3.F30 + SCOPE-2.F61 + SCOPE-2.F62 (PRD-24B reveal-system universalization + library restructure + connector architecture).

## What changed from v7 → v8 (Session 2 Batch 5 rows 61-80 lock)

- **PRD-24 family bundle resolved into 3 workers:**
  - **NEW-AA worker** = NEW-AA + SCOPE-2.F61 + SCOPE-2.F62 (3 rows, reveals as universal wrappers + connector architecture)
  - **F60c worker** = separate, sequences AFTER NEW-AA (reads reveal-wrapper decisions as input); theme overlay + game mode progression
  - **F58 worker** = separate, independent; PRD-24 reward economy only. ESCALATED-priority annotation adjudication deferred to worker dispatch (financial-correctness adjacency).
- **SCOPE-2.F48 W0 confirmed, minimum-scope locked.** Approval-queue UI route + admin auth gate only. Do NOT expand to full PRD-32 during beta build. Dual-purpose prereq for SCOPE-8a.F1 (W4 COPPA) + SCOPE-4.F4 (W1B Board sprint).
- **SCOPE-3.F2 W0 locked formally.** Prerequisite for SCOPE-8b.F11 (W2).
- **Pending verification tasks for Session 2 close:**
  - F68 upstream blocker (PRD-28B build-order) freshness re-check — confirm PRD-28B not reclassified forward since audit.
  - F58 ESCALATED-priority annotation decision at worker dispatch.

## What changed from v6 → v7 (Session 2 Batch 5 first-20 lock)

- **SCOPE-2.F40 pulled W2 → W1.** Not architecturally dependent on SCOPE-8b.F5 (F40 = notification-level DND filtering; F5 = message-level crisis detection; different pipeline layers). Safety-alert DND bypass is mom-first critical. Wave 1 placement per founder 2026-04-23.
- **SCOPE-2.F39 split-locked** with NEW-G pattern: (a) Convention #141 text amendment = Fix Now fast commit pointing to 3-state observation/private model per PRD-15 spec; (b) PRD-15 messaging-visibility work = Fix Next Build. Edge: (a) → (b).
- **SCOPE-2.F1 scope locked to webhook-only** (Wave 0 COPPA Stripe webhook prerequisite), NOT full PRD-31 monetization.
- **NEW-W sequencing clarified:** SCOPE-3.F14 is hard pre-req (F14 W1 bootstrap lands first); NEW-W sequences AFTER F14, does NOT ship in F14 W1 commit. Stays Fix Next Build pool slot.
- **NEW-N + NEW-O worker structure:** shared-language preamble authored first (defining `is_milestone` / `tracking_tags` semantics once), then PRDs amended to reference the preamble. Prevents 8 isolated redefinitions for NEW-N and cross-cutting drift for NEW-O.

## What changed from v5 → v6 (Session 2 silent batch + surfaced row sweep)

- **PRD-09B bundled-worker scope grown to 8 rows:** NEW-G(b) + SCOPE-2.F27 + NEW-F + NEW-T + NEW-V + NEW-Y + NEW-I + NEW-X. Single worker, single reading pass over Composition Architecture doc + PRD-09B + CLAUDE.md. Formalizes four independent list-behavior properties (presentation_mode, is_browsable, is_opportunity, pick_n) + crossed-off grace period + linked list items connector + rotation memory + kid_can_skip + person-pick-spin + assignment mode. Fallback 4+4 split documented if dispatch prompt over-scoped: (a) F27 + NEW-G(b) + NEW-I + NEW-X, (b) NEW-F + NEW-T + NEW-V + NEW-Y.
- **NEW-CC held out as separate follow-on worker.** Dispatches AFTER bundle lands so the composition matrix is derived from final property text, not concurrently drafted.
- **NEW-H / NEW-L / NEW-Z** remain separate workers (different PRD homes / audit-first / not-a-09B-row).
- **NEW-P HELD** pending founder PRD home decision (PRD-10 vs PRD-28; `homeschool_time_logs` precedent argues PRD-28).
- **Worker dispatch prompt for bundled PRD-09B worker** must: list all 8 row IDs as combined scope; reference Composition Architecture doc §1.1, §1.2, §1.3, Composition I, draft notes 5, 20, 23, 25, 27, 28, 30, 31, 32, 33; name the four independent list-behavior properties explicitly; require coherent cross-references between properties.

## What changed from v4 → v5 (Session 2 Batch 4 Row 28 lock)

- **NEW-G split-locked.** Row 28 split into (a) Convention 70 text amendment = Fix Now fast commit (CLAUDE.md only, ~2-min exposure closure for parallel sessions reading stale convention); (b) full PRD-09B amendment + studio-seed-templates.md + 4-properties formalization = Fix Next Build, bundled w/ SCOPE-2.F27 under single worker.
- **Draft-artifact re-review flagged:** `claude/feature-decisions/opportunity-list-unification-plan.md` written pre-correction — re-review against corrected framing when (a) lands.
- **Worker dispatch prompt for (b)** must name both NEW-G + SCOPE-2.F27 as combined scope and reference Composition Architecture doc §1.1, §1.2, draft notes 5, 20, 23, 33.

## What changed from v3 → v4 (2026-04-22 Session 2 Batch 1 lock)

- **SCOPE-8a.F3 sub-sequence encoded.** PRD-41 → PRD-20 → PRD-30 hard chain + SCOPE-2.F48 → PRD-30 prerequisite added to W1 internal ordering + adjacency list. Prevents parallel dispatch ambiguity at worker deploy time.

---

## What changed from v2 → v3 (2026-04-22 Composition Architecture delta)

- **SCOPE-3.F15 closed** (Intentional-Update-Doc → Closed/Resolved). Removed from waves.
- **SCOPE-2.F27 scope expanded Low → Medium.** Still Fix Next Build, non-Beta. No wave placement change.
- **24 new rows NEW-F..NEW-CC placed.** Summary below; details in worksheet.
- **NEW-B updated:** drawer default = Assist (not Help). NEW-B wave placement unchanged (Wave 1 — Fix Now, Beta Y). Assist system-prompt enhancement + PRD-05 addendum added to NEW-B scope.
- **NEW-K downgraded Beta Y → N.** Moved out of Beta blocker waves; now lives in the non-Beta Fix Next Build pool, but elevated priority per founder — ships as post-Gate-2 flagship, not Wave 3.
- **8 CLAUDE.md conventions 249–256 landed** as pre-walkthrough commits (outcome-named wizards, save-and-return/Drafts/Customized, AI-fills-gaps, Bulk-AI-Add, NLC front-door, MindSweep composition detection, friction-first wizard design, tier externalization).

### New-row wave placement

Most NEW-F..NEW-CC rows are **non-Beta Fix Next Build** and live in the large unsequenced pool that dispatches whenever workers have capacity. Specific coordination callouts:

| New row | Wave placement | Coordination |
|---|---|---|
| NEW-F, H, I, J, M, S, T, U, V, X, Y, Z, BB, CC | Non-Beta Fix Next Build pool | No hard sequencing; dispatch per worker availability |
| NEW-G | Non-Beta Fix Next Build (High severity — elevate priority) | Touches PRD-09B + Convention 70 + studio-seed-templates.md. Coordinate with SCOPE-2.F27 (same PRD-09B amendment pass) |
| NEW-K | Post-Gate-2 flagship (not wave-assigned in Gate 1 execution) | Depends on Gate 2 wizards landing first; becomes Phase 5 headline |
| NEW-L | Non-Beta Fix Next Build pool | Audit-first row — inventory surfaces before dispatching implementation work |
| NEW-N (is_milestone + Milestone Map) | Non-Beta Fix Next Build pool | **8-PRD addendum touch.** Assign one worker to own all 8 addenda to avoid cross-PRD drift |
| NEW-O (tracking_tags) | Non-Beta Fix Next Build pool | **Every content-producing PRD + PRD-28B** — cross-cutting; assign one worker |
| NEW-P (Reading Tracker) | Non-Beta Fix Next Build pool | PRD home decision (PRD-28 vs PRD-10) before dispatch |
| NEW-Q (finished products expansion) | Non-Beta Fix Next Build pool | Cross-ref SCOPE-2.F22 PRD-19 reports; coordinate with PRD-28B scope |
| NEW-R (Drafts + Customized Studio pages) | Non-Beta Fix Next Build pool | Studio Intelligence Addendum amendment; Convention 250 captures the rule |
| NEW-W (counts_toward_allowance on Segments + dedup) | Non-Beta Fix Next Build pool | **Coordinate with SCOPE-3.F14 (Wave 1, Beta Y).** Allowance bootstrap + Segment counting are related; one worker owns both if possible |
| NEW-AA (reveals as universal wrappers) | Non-Beta Fix Next Build pool | Coordinates with SCOPE-2.F61 + SCOPE-2.F62 (same PRD-24 family addendum) |
| NEW-E (local-LLM stub) | Capture-only, no wave | Post-Session-2 doc authorship task |

---

## What changed from v1 → v2 (2026-04-21 founder response)

- **COPPA chain unblocked.** SCOPE-2.F1 (Stripe webhook) + SCOPE-2.F48 (Admin Console) reclassified `Defer-to-Gate-4 → Fix Next Build` as Wave 4 prerequisites. Wave 4 now has a real path to landing.
- **Board of Directors 3-way file serialization consolidated into ONE wave.** SCOPE-8a.F5 + SCOPE-4.F4 + SCOPE-8b.F3 + SCOPE-4.F8a + SCOPE-4.F8b merged into **Wave 1B: Board-of-Directors consolidated sprint**. Single build cycle; eliminates cross-wave regression risk on `lila-board-of-directors/index.ts`.
- **SCOPE-4.F4 reclassified `Intentional-Update-Doc → Fix Code`** with design nuance (AI classifier personal-vs-community; community-relevant routes to PRD-32 Admin Console approval queue; approved personas enter shared cache). PRD-34 addendum required post-Session-2.
- **SCOPE-4.F8 split:** F8a (privacy-filter bypass, Fix Now, Beta Y) + F8b (assembler refactor, Fix Next Build — verdict `LILA-POWERED-BUT-BYPASSING` per [RECON_F8B_ASSEMBLER.md](RECON_F8B_ASSEMBLER.md)).
- **5 new findings added** (NEW-A, NEW-B, NEW-C, NEW-D, NEW-E). Placed in waves below.
- **First beta cohort scope:** families with no children under 13. Unlocks COPPA ship-dormant-but-built at beta launch without blocking first cohort. Second cohort opens after lawyer review + `lawyer_approved_at` populates + revocation cascade complete.

---

## TL;DR

- **6 waves + 1 consolidated sprint.** Wave 0 = doc/enabler prereqs; Wave 1 = Beta blockers with no dependencies; Wave 1B = Board-of-Directors consolidated sprint; Wave 2 = safety substrate (F1/F5/F11); Wave 3 = Wave-2-dependent Beta blockers + prompt audits; Wave 4 = COPPA cascade (now unblocked); Wave 5 = post-Board downstream cleanup.
- **Zero hard chain breaks remain.** Former Wave-4 block eliminated by F1/F48 reclassifications.
- **One soft coordination pair persists:** SCOPE-3.F9 ↔ SCOPE-8b.F4 (same convention area, opposite fates on `is_included_in_ai` column family). Ship in coordinated commit cycle to prevent PRD drift.
- **Two conventions landed 2026-04-21:** Convention 247 (LiLa scope), Convention 248 (Native AI Vault tool categories). These unblock every governance-tagged finding.

---

## Wave 0 — Upstream enablers (run in parallel with Wave 1/1B)

Doc / type / schema work that unblocks later waves. No code-path deps. Can dispatch immediately.

| Finding | Scope | Sev | Beta | Proposed | Unblocks | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|
| SCOPE-3.F2 | 3 | Med | N | Fix Next Build | SCOPE-8b.F11 (Wave 2) | All Wave 0/1/1B | PRD-35 vocabulary + `RecurrenceDetails` type consolidation. Root-cause of SCOPE-8b.F11 bifurcation. Ships spec amendment first, then TS consolidation. |
| SCOPE-3.F9 | 3 | Low | N | Intentional-Update-Doc | — (coord w/ SCOPE-8b.F4 Wave 3) | All Wave 0/1/1B | Drops `dashboard_widgets.is_included_in_ai`. ⚠️ Coordinate commit with SCOPE-8b.F4. |
| SCOPE-2.F1 | 2 | Med | N | Fix Next Build | SCOPE-8a.F1 (Wave 4) | SCOPE-2.F48 | Stripe webhook handler (minimum scope needed for COPPA revocation-path hook, not full monetization). |
| SCOPE-2.F48 | 2 | Med | N | Fix Next Build | SCOPE-8a.F1 (Wave 4), SCOPE-4.F4 (Wave 1B approval queue) | SCOPE-2.F1 | Admin Console shell (minimum scope: approval-queue UI route + admin auth gate). Dual-purpose: COPPA verification log + Board approval queue. |

---

## Wave 1 — Beta blockers with zero dependencies (parallel with Wave 0)

These land immediately. No upstream blockers. Safe to dispatch as parallel worker streams.

| Finding | Scope | Sev | Beta | Proposed | Unblocks | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|
| SCOPE-8a.F3 | 8a | Blocking | Y | Fix Now | — | All Wave 1 non-8a | PRD-20 + PRD-30 + PRD-41 build. Largest scope in Wave 1. **Sub-sequence encoded 2026-04-22 per founder:** PRD-41 (Platform AI Ethics / output validation) → PRD-20 (Safe Harbor) → PRD-30 (Safety Monitoring). PRD-41 is defense-in-depth foundation; PRD-20 depends on PRD-41 output validation; PRD-30 depends on PRD-20 data + SCOPE-2.F48 Admin Console (W0). PRD-30 lands late-W1 or early-W2. Workers MUST NOT parallel-dispatch the three — dependency chain is hard. |
| SCOPE-8a.F6 | 8a | Blocking | Y | Fix Now | — | All Wave 1 | DailyCelebration HITM. ~1 file. |
| SCOPE-8b.F7 | 8b | High | Y | Fix Now | — | All Wave 1 | `.ics` CHECK constraint. 1-line migration. |
| SCOPE-3.F22 | 3 | Low | Y | Fix Now | — | All Wave 1 | Play shell /rewards route. 1-line fix. |
| SCOPE-3.F41 | 3 | High | Y | Fix Now | — | All Wave 1 | MemberAssignmentModal broken write. Correct column names on INSERT. |
| SCOPE-3.F14 | 3 | High | Y | Fix Next Build | — | All Wave 1 | First allowance_periods bootstrap. Trigger on `allowance_configs.enabled=true`. |
| **NEW-A** | BookShelf | High | Y | Fix Next Build | — | All Wave 1 | `book_discuss` vs `book_discussion` dedup. Focused single-worker mini-audit. |
| **NEW-B** | LiLa UI | High | Y | Fix Now | — | All Wave 1 | Remove General from 10 user-facing surfaces (Recon-2); drawer default = Help. Preserve technical fallback. |

---

## Wave 1B — Board-of-Directors consolidated sprint (single serial sprint)

**All five findings touch `supabase/functions/lila-board-of-directors/index.ts`, related Board UI, and PRD-34.** Consolidated per founder direction 2026-04-21 to eliminate cross-wave regression risk. One build sprint, one Edge Function redeploy, one PRD-34 addendum.

| Finding | Scope | Sev | Beta | Proposed | Role in sprint |
|---|---|---|---|---|---|
| SCOPE-8a.F5 | 8a | Med | Y | Fix Now (+compound) | Content-policy fail-closed flip + server-side `contentPolicyCheck` re-invocation on `create_persona` action. Includes `content_policy_check` embedding pre-screen (folded from SCOPE-4.F4 per audit L2072). |
| SCOPE-4.F4 | 4 | High | Y | **Fix Code** | Persona cache 3-tier rebuild: (a) AI classifier personal-vs-community routing at creation, (b) approval queue UI in PRD-32 Admin Console (requires SCOPE-2.F48 Wave 0 prerequisite), (c) cache lookup respects `is_public` + `family_id` scoping. **PRD-34 addendum required post-sprint.** |
| SCOPE-8b.F3 | 8b | High | Y | Fix Next Build | HITM gate on `board_personas` generation — folds into F4's approval-queue review step. |
| SCOPE-4.F8a | 4 | High | Y | Fix Now | `is_privacy_filtered` hard-constraint bypass in Decision Guide + Board of Directors. Lands as part of F8b assembler refactor; privacy filter is the first thing the shared assembler does. |
| SCOPE-4.F8b | 4 | Med | N | Fix Next Build | Refactor Decision Guide + Board of Directors to call `assembleContext` (verdict: LILA-POWERED-BUT-BYPASSING per Recon-1). **Audit Perspective Shifter + Mediator in same pass.** Once landed, Convention 248 invariant (`context_sources` non-empty ⇒ must use shared assembler) is enforced across all ThoughtSift + Mediator tools. |

**Sprint prerequisite:** SCOPE-2.F48 Admin Console shell (Wave 0) must land before F4 approval queue work begins.

**Sprint unblocks:** SCOPE-4.F5 (alternative-persona substitution — Wave 5).

---

## Wave 2 — Safety-substrate commit cycle (depends on Wave 0)

**Ships-together block per audit line 1607:** F1 + F5 share `_shared/` directory, same class of fix, both safety substrate. F1 Mediator Full Picture ships first as proof-of-pattern; remaining 11+1 surfaces follow in tight sequence as one cohesive build. F11 sequences immediately after SCOPE-3.F2 lands.

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Unblocks | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|---|
| SCOPE-8b.F1 | 8b | Blocking | Y | Fix Now (+compound) | — | SCOPE-8b.F12 coaching-log server-side, SCOPE-8b.F13 tier-gate | SCOPE-8b.F5 (same cycle) | `_shared/auth.ts` `authorizeForFamily` helper. Mediator Full Picture lede. 13 surfaces in Fix Next Build follow-on. |
| SCOPE-8b.F5 | 8b | Blocking | Y | Fix Now | — | — | SCOPE-8b.F1 | Crisis Override in 3 Edge Functions. Same `_shared/` directory as F1. ~5 lines per file. |
| SCOPE-8b.F11 | 8b | High | Y | Fix Now | SCOPE-3.F2 (Wave 0) | — | SCOPE-8b.F1 / F5 | PRD-27 shift bifurcation. Consolidate `shift_sessions` → `time_sessions`, migrate 2 live rows, drop `shift_sessions`. |

---

## Wave 3 — Fix Next Build Beta blockers + prompt audits (after Wave 2)

Beta Y blockers proposed Fix Next Build. Most depend on F1's `authorizeForFamily` helper, F5's crisis-detection pattern, or the class-of-fix substrate. Plus the two new prompt-coverage audits (NEW-C + NEW-D) which can run anytime after Wave 0 conventions landed.

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Parallelizable with | Notes |
|---|---|---|---|---|---|---|---|
| SCOPE-8b.F2 | 8b | High | Y | Fix Next Build | — | All Wave 3 | HITM gate on `communication_drafts`. 8 Edge Functions. |
| SCOPE-8b.F4 | 8b | High | Y | Fix Next Build | Coordinate w/ SCOPE-3.F9 (Wave 0) | All Wave 3 | User-control enforcement sweep across 5 surfaces. ⚠️ Coordination pair with SCOPE-3.F9. |
| SCOPE-8b.F6 | 8b | High | Y | Fix Next Build | — | All Wave 3 | PRD-17B auto-sweep server-side routing layer. |
| SCOPE-8b.F8 | 8b | High | Y | Fix Next Build | — | All Wave 3 | GDPR `process_expired_deletions` cascade + cron + UI. ⛔ SERIAL with SCOPE-8a.F1/F2 (Wave 4 — cron infrastructure shared with COPPA retention). |
| SCOPE-8b.F9 | 8b | High | Y | Fix Next Build | — | All Wave 3 | Meeting impressions RLS / view redaction. |
| SCOPE-8b.F10 | 8b | High | Y | Fix Next Build | — | All Wave 3 | `useCreateMeeting` member_permissions check. |
| SCOPE-8b.F12 | 8b | High | Y | Fix Next Build | SCOPE-8b.F1 (Wave 2) | Other Wave 3 | Messaging safety — 4 sub-surfaces. Sub-surface 2 folds into F1's `authorizeForFamily` rollout. |
| SCOPE-8b.F13 | 8b | High | Y | Fix Next Build | SCOPE-8b.F1 (Wave 2) | Other Wave 3 | `_shared/tier-gate.ts` helper. Ships in F1 rollout directory. 47 Edge Functions. |
| **NEW-C** | LiLa prompts | Med | Y | Fix Next Build | Convention 247 (landed) | **NEW-D** (ship as paired pass) | On-task enforcement audit across specialized LiLa modes. Single prompt-review sweep. |
| **NEW-D** | LiLa prompts | Med | Y | Fix Next Build | Convention 247 (landed) | **NEW-C** (ship as paired pass) | Faith Ethics + LiLa core guardrail coverage audit across all 43 `lila_guided_modes` prompts. Paired with NEW-C — same file pass. |

---

## Wave 4 — COPPA cascade (prerequisites landed in Wave 0; first-beta-cohort scoping)

Per founder response 2026-04-21: COPPA framework builds in Wave 4 but first beta cohort is scoped to families with no children under 13. Framework ships dormant-but-built at beta launch. Second cohort opens after (a) lawyer review completes, (b) `lawyer_approved_at` populates on consent templates, (c) revocation cascade build completes.

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Notes |
|---|---|---|---|---|---|---|
| SCOPE-8a.F1 | 8a | Blocking | Y | Fix Now | SCOPE-2.F1 + SCOPE-2.F48 (Wave 0) | Full PRD-40 COPPA build. Founder decision Y on sub-build ordering + admin-shell concurrency. **Lawyer review gates live user consent; framework ships dormant until `lawyer_approved_at` populates.** |
| SCOPE-8a.F2 | 8a | Blocking | Y | Fix Now | SCOPE-8a.F1 | Privacy-data-lifecycle. F1's Fix Now scope per audit line 275 "must include the deletion cascade work captured in F2's resolution scope" — effectively same build. |

**Beta cohort scoping:** first cohort = no under-13s. Add matching CLAUDE.md convention or beta-planning note post-Session-2.

---

## Wave 5 — Downstream cleanup (after Wave 1B Board sprint lands)

| Finding | Scope | Sev | Beta | Proposed | Blocked-by | Notes |
|---|---|---|---|---|---|---|
| SCOPE-4.F5 | 4 | Med | N | Intentional-Update-Doc | SCOPE-4.F4 (Wave 1B) | Alternative-persona substitution. Blocked by F4 cache rebuild — F4 must land first. |

---

## Gate 4 — parking lot (consistent with upstream Defer-to-Gate-4)

Fix Next Build / Defer-to-Gate-4 rows whose upstream blockers are themselves Deferred. Do NOT schedule until upstream unblocks.

| Finding | Proposed | Blocked-by | Chain status |
|---|---|---|---|
| SCOPE-2.F52 | Defer-to-Gate-4 | SCOPE-2.F9 (Defer-to-Gate-4) | Consistent — both deferred. Optimize with LiLa stub. |
| SCOPE-2.F53 | Defer-to-Gate-4 | SCOPE-2.F9 (Defer-to-Gate-4) | Consistent — both deferred. Deploy with LiLa stub. |

---

## Capture-only (no wave, no fix — vision tracking)

| Finding | Classification | Notes |
|---|---|---|
| **NEW-E** | Capture-only | `LILA_FUTURE_LOCAL_LLM.md` stub — on-device small LLM for General/kid/privacy-sensitive chat. Post-beta vision. Author stub post-Session-2; do NOT schedule build. |

---

## Parallelization summary

| Wave | Max parallelism | Key serialization boundaries |
|---|---|---|
| Wave 0 | 4 workers | None internal — F2, F9, F1, F48 touch different files. |
| Wave 1 | Up to 8 workers | One per finding. All are file-disjoint. |
| Wave 1B | **1 worker (serial sprint)** | Same Edge Function + same PRD-34 addendum + same Admin Console surface. Do NOT split. |
| Wave 2 | 2–3 workers | F1 + F5 share `_shared/` directory — one worker. F11 separate. |
| Wave 3 | Up to 10 workers | ⛔ F8 cron infra overlaps Wave 4 COPPA retention cron. ⛔ F12 sub-2 + F13 gated on F1 `_shared/` helpers. NEW-C + NEW-D = single worker (paired pass). |
| Wave 4 | 1 worker (+ 1 Wave-3-F8 coordinator) | COPPA build spans PRD-40 + PRD-31 webhook + PRD-32 admin; founder-led scope. |
| Wave 5 | 1 worker | Post-Board-sprint cleanup. |

---

## Foreseeable blockers (⚠️ chain breaks summary)

All hard chain breaks from v1 resolved by founder response.

**Remaining soft coordination pairs:**

1. **SCOPE-3.F9 ↔ SCOPE-8b.F4** — same convention area (`is_included_in_ai` column family), opposite fates. PRD-14 and PRD-14D amendments must land in coordinated commit cycle to prevent doc drift.
2. **SCOPE-8b.F8 ↔ SCOPE-8a.F1/F2 cron infrastructure** — GDPR deletion cron + COPPA retention cron use the same `util.invoke_edge_function` pattern. Risk: duplicate cron registrations if Wave 3 F8 and Wave 4 land independently. Assign one worker to own both cron migrations.
3. **NEW-C + NEW-D** — same-file prompt pass. Ship as one worker dispatch.

---

## Machine-readable adjacency list

Format: `UPSTREAM -> DOWNSTREAM`. One edge per line. `->` = hard dependency (upstream must land first). `~~>` = coordination pair (ship-together recommended; not a hard block).

```
# Wave 0 → Wave 2/4
SCOPE-3.F2 -> SCOPE-8b.F11
SCOPE-2.F1 -> SCOPE-8a.F1
SCOPE-2.F48 -> SCOPE-8a.F1
SCOPE-2.F48 -> SCOPE-4.F4

# Wave 1 internal (SCOPE-8a.F3 sub-sequence)
PRD-41 -> PRD-20
PRD-20 -> PRD-30
SCOPE-2.F48 -> PRD-30

# NEW-G split (v5)
NEW-G(a) -> NEW-G(b)

# PRD-09B 8-row bundle (v6) — all ~~> within the single bundled worker
NEW-G(b) ~~> SCOPE-2.F27
NEW-G(b) ~~> NEW-F
NEW-G(b) ~~> NEW-T
NEW-G(b) ~~> NEW-V
NEW-G(b) ~~> NEW-Y
NEW-G(b) ~~> NEW-I
NEW-G(b) ~~> NEW-X

# NEW-CC derives matrix AFTER bundle lands
NEW-G(b) -> NEW-CC

# SCOPE-2.F39 split (v7, same pattern as NEW-G)
SCOPE-2.F39(a) -> SCOPE-2.F39(b)

# NEW-W sequencing (v7)
SCOPE-3.F14 -> NEW-W

# SCOPE-2.F1 → SCOPE-8a.F1 (W0 → W4 COPPA prerequisite, webhook-only scope)
SCOPE-2.F1 -> SCOPE-8a.F1

# SCOPE-2.F2 pre-monetization prerequisite (v10) — sequences after F1 W0
SCOPE-2.F1 -> SCOPE-2.F2
SCOPE-2.F2 -> SCOPE-3.F34  # both F1 + F2 block full PRD-31 build

# PRD-24 family workers (v8+F30 fold) — NEW-AA bundled with 4 rows
NEW-AA ~~> SCOPE-2.F61
NEW-AA ~~> SCOPE-2.F62
NEW-AA ~~> SCOPE-3.F30
NEW-AA -> SCOPE-2.F60c

# SCOPE-3.F2 W0 → SCOPE-3.F3 (same PRD-35 scheduler family)
SCOPE-3.F2 -> SCOPE-3.F3

# Wave 4 internal
SCOPE-8a.F1 -> SCOPE-8a.F2

# Wave 1B consolidated sprint (all internal to the sprint, ship together)
SCOPE-8a.F5 ~~> SCOPE-4.F4
SCOPE-4.F4 ~~> SCOPE-8b.F3
SCOPE-4.F4 ~~> SCOPE-4.F8a
SCOPE-4.F4 ~~> SCOPE-4.F8b
SCOPE-4.F4 ~~> SCOPE-4.F7   # v11 fold — moderator interjection revoke + PRD-34 amendment

# Wave 1B → Wave 5
SCOPE-4.F4 -> SCOPE-4.F5

# Wave 2 substrate → Wave 3
SCOPE-8b.F1 -> SCOPE-8b.F12
SCOPE-8b.F1 -> SCOPE-8b.F13
SCOPE-8b.F1 ~~> SCOPE-8b.F5

# Gate 4 parking
SCOPE-2.F9 -> SCOPE-2.F52
SCOPE-2.F9 -> SCOPE-2.F53

# Coordination pairs
SCOPE-3.F9 ~~> SCOPE-8b.F4
SCOPE-8a.F1 ~~> SCOPE-8b.F8
SCOPE-8a.F2 ~~> SCOPE-8b.F8
NEW-C ~~> NEW-D
```

---

## Source references

- Founder Session 1 response (2026-04-21) — COPPA chain resolution, Board sprint consolidation, NEW findings additions, F8 split, F4 reclassification.
- Recon-1 verdict: [RECON_F8B_ASSEMBLER.md](RECON_F8B_ASSEMBLER.md) — LILA-POWERED-BUT-BYPASSING.
- Recon-2 inventory: [RECON_GENERAL_MODE_SURFACES.md](RECON_GENERAL_MODE_SURFACES.md) — 10 user-facing surfaces; drawer default = Help.
- Conventions landed 2026-04-21: CLAUDE.md §247 (LiLa scope), §248 (Native AI Vault tool categories).
- Pre-adjudicated constraints + audit cross-references: [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md) + [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md).
- Ships-together block on F1+F5: [AUDIT_REPORT_v1.md §8b L1606–1609](AUDIT_REPORT_v1.md#L1606).
- F11 sequencing: [AUDIT_REPORT_v1.md §SCOPE-8b.F11 L1746–1748](AUDIT_REPORT_v1.md#L1746).
- NEW pairing SCOPE-3.F9 ↔ SCOPE-8b.F4: [AUDIT_REPORT_v1.md §Scope 3+8b header L1119, §SCOPE-3.F9 L1214](AUDIT_REPORT_v1.md#L1119).
