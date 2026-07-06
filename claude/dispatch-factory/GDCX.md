# Pre-Dispatch Pack — GDCX: Guided Dashboard Completion (PRD-25 Residuals)

> **Factory status:** synthesized → decisions-pending (5 decisions, batch 5)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: GDCX. Priority: P3 (kid-facing pain: HIGH).
> Evidence: `claude/dispatch-factory/GDCX-RECON.md`.
> **HEADLINE: Next Best Thing — PRD-25's flagship, mom-unhideable "killer feature" — has been
> fully dark for every Guided kid since 2026-05-03.** You disabled it because it suggested tasks
> not actually due that day; the recon root-caused it (the suggestion engine never applies the
> `filterTasksForToday` day-scheduling filter that the task list uses). One targeted fix
> re-lights it. Also: the Homework Help and Communication Coach modals the registry calls
> "Coming soon" are ALREADY fully wired (mode + prompt + toggle + launcher) — four stale registry
> rows get corrected.

## Rulings

1. **NBT re-enable is Slice 1 and the reason this pack dispatches early.** Fix = apply the same
   `filterTasksForToday` pipeline (recurringTaskFilter.ts) inside `useNBTEngine.ts` that
   `GuidedActiveTasksSection` uses, THEN flip the `return null` in GuidedDashboard.tsx:106-109.
   **Coordination:** CLIENT-DATE-REMEDIATION threads family-today into `filterTasksForToday` call
   sites — the NBT fix MUST use the same seeded pattern (todayFamily ?? todayLocalIso), never a
   bare client date. Founder eyes-on verifies the original complaint is gone (an MWF routine on
   the wrong day never surfaces) BEFORE the flip commits. Priority order already matches
   Convention #126 (8 levels — the PRD's 7 is superseded; no change).
2. **Stale-registry corrections:** STUB rows 395/396/400/401 (header indicators, task points,
   homework help, communication coach) flip to Wired with evidence.
3. **Unread badge:** wire `useUnreadNotificationCount()` into GuidedShell.tsx:610 (one line).
4. **Messages tab:** KEEP the redirect pattern as permanent (D-GDCX-1). The kid taps → full
   `/messages` with the real coaching checkpoint; an inline drawer compose would duplicate a
   coached surface for no gain. The drawer keeps the live unread count. PRD amended-by-record.
5. **Progress tab points at `/my-rewards` (D-GDCX-2).** KIDS-REWARDS built the real kid rewards
   home (points, prizes, victories, creatures, coloring); `GuidedProgress.tsx`'s warm stub
   retires. One rewards home per kid — two competing surfaces would be a Buffet-Principle
   violation in the wrong direction. Convention #124 amended accordingly.
6. **Victories restored to the primary Guided nav (D-GDCX-3)** per Convention #124 (5 tabs:
   Home, Tasks, Write, Victories, Progress). Convention is law until amended; if you prefer the
   current 4-tab + More layout, say so and #124 gets amended instead — either is one line.
7. **DailyCelebration Steps 2.5 + 3 + 4 unstub together (D-GDCX-4):** reflections step (reuse the
   WriteDrawerReflections card pattern; gated on `reflections_in_celebration`; saves
   journal_entries entry_type='reflection', source='daily_celebration'), streak step (compute_streak
   is real), theme step — all in the same file, same pass.
8. **Per-prompt reflection toggles: accepted simplification (D-GDCX-5).** The "N prompts per day"
   dropdown stands; per-prompt granularity registered Post-MVP; the dead
   `reflection_prompts`/`reflection_custom_prompts` preference fields noted for cleanup.
9. Header-indicator edge case: add the explicit `gamification_configs.enabled` check (tiny).

## Slice plan (single Sonnet worker)

| Slice | Scope | Routing |
|---|---|---|
| 1 | **NBT fix + re-enable**: filterTasksForToday (family-today-seeded) in useNBTEngine → founder eyes-on → flip GuidedDashboard return null | Sonnet xhigh |
| 2 | Small wires: unread badge; Victories nav restore (+ mobile-behavior check on the Guided nav); header-indicator enabled check; Progress tab → /my-rewards + GuidedProgress retire | Sonnet xhigh |
| 3 | DailyCelebration Steps 2.5/3/4 unstub (prop threading from CelebrateSection, reflection card, streak, theme; all skippable; celebration-only tone) | Sonnet xhigh |
| 4 | E2E (`tests/e2e/features/guided-dashboard-completion.spec.ts`: NBT shows only today-due items — the MWF-on-Tuesday pin MUST fail against pre-fix code; badge count; celebration step flow incl. skip; nav tabs) + registry corrections + Convention #124/#126 doc notes | Sonnet xhigh |
| Gates | Checkpoint 5 verify | **Fable if available, else Opus** |

## Open founder decisions (batch 5)

| # | Decision | Recommendation |
|---|---|---|
| D-GDCX-1 | Messages tab keeps the redirect pattern (permanent) | Yes — one coached compose surface, not two |
| D-GDCX-2 | Progress nav tab → /my-rewards; GuidedProgress stub retires | Yes — one rewards home per kid |
| D-GDCX-3 | Victories restored to primary Guided nav per Convention #124 | Yes (or say "keep 4-tab" and #124 gets amended — one line either way) |
| D-GDCX-4 | DailyCelebration Steps 3/4 bundle with 2.5 | Yes — same file, data now real |
| D-GDCX-5 | Per-prompt toggles = accepted simplification (count dropdown stands) | Yes |

## Dependency edges
Coordinate with CLIENT-DATE-REMEDIATION (filterTasksForToday seeding — whichever lands second
re-verifies the other's pattern). After SAFETY-BETA-GATE (already shipped its Slice A prompts —
confirmed live by the recon). Independent otherwise; HIGH kid-facing value per effort.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-5 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for GDCX — Guided Dashboard completion (PRD-25 residuals).
Pre-dispatch pack: claude/dispatch-factory/GDCX.md (9 rulings + 4-slice plan). Evidence:
claude/dispatch-factory/GDCX-RECON.md (file:line work list). All decisions RESOLVED per
recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`; check
whether CLIENT-DATE-REMEDIATION landed (if yes, useNBTEngine's day filter MUST consume the same
family-today seeding it introduced at the other filterTasksForToday call sites; if no, build the
seeded pattern anyway per Convention #257); re-verify the recon's file:line refs.

READ FIRST: (1) prds/dashboards/PRD-25-Guided-Dashboard.md — the Screen 3 (NBT), Screen 5
(management), Screen 6 (DailyCelebration) sections IN FULL + prds/addenda/PRD-25-Cross-PRD-
Impact-Addendum.md; (2) the pack + recon; (3) CLAUDE.md Conventions #122-135 (Guided rules) +
#126 (8-level NBT priority — canonical). Create .claude/rules/current-builds/GDCX-guided-
completion.md (no YAML frontmatter), pre-build summary, founder approval BEFORE code.

BUILD per the 4-slice plan. HARD RULES: NBT flip happens ONLY after the founder eyes-on confirms
the day-scheduling bug is gone (her 2026-05-03 complaint is the acceptance test); the MWF-on-
wrong-day E2E pin must FAIL against pre-fix code; NBT stays unhideable (#123); celebration-only
tone everywhere (skippable steps, no pressure); Guided nav is purpose-built (exempt from
sidebar parity but View-As must render identically — verify in the modal); Lucide only; zero
hardcoded colors + density (myaim-frontend-design skill); Convention #257 dates.

PROOF: the new spec + tsc -b + lint + kids-rewards slice pins if you touched /my-rewards routing
(ask the founder before shared-fixture suites). NOTHING COMMITS until proof green AND founder
eyes-on clears (eyes-on: a real Guided kid's dashboard shows NBT again, suggesting only
today-due items). Selective staging; founder confirms before push. Close-out: Checkpoint 5,
STUB_REGISTRY corrections (rows 391-406 sweep: 395/396/400/401 → Wired w/ evidence; Step 2.5 →
Wired; Progress → resolved-by-redirect), Convention #124 amendment per D-GDCX-3 outcome, archive
build file.
```
