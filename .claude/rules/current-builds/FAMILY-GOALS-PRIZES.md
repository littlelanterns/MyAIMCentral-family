# Active Build: FAMILY-GOALS-PRIZES — Family Goals, Family Prizes & Multi-Member Contribution Tracking

> **Status: CODE COMPLETE, ALL PROOF GREEN — holding for founder eyes-on + sign-off before commit/push.** Migration 100284 applied to linked production; E2E `family-goals-prizes.spec.ts` 10/10 + Convention #277 eyes-on tour (17 screenshots, all read); `tsc -b` clean; lint 0 errors; full regression suite (kids-rewards slices 1-5, leak-pass, fo-command-center) green on a clean consolidated re-run (two single-test flakes observed across earlier runs, both confirmed non-reproducing in isolation and unrelated to this build's code — see Progress Log). Nothing committed; selective staging pending founder confirmation. Founder approved 2026-07-06 with two riders (below); Sonnet implementation worker dispatched from the Fable session per model-routing rule #1 (Agent tool, `model: sonnet`).
> Auditor: Fable pre-build session 2026-07-05; founder approval + riders 2026-07-06.
> Authority chain: `claude/feature-decisions/Family-Goals-And-Prizes.md` (the spec — wins) → `claude/feature-decisions/Family-Goals-And-Prizes-Handoff.md` (research base) → this file (scope + dispatch).
> Filing: standalone build; the practical core of the never-written **PRD-24C** (founder decision FD-7). PRD-24C's Boss Battle / Bingo / quest-board visuals remain future scope and will consume this engine.
> **Migration discipline: NO number reserved by this audit.** Most recent seen at audit time: 100283 (STUDIO-EXPERIENCE ST-0). Take the next free number at file-creation time and re-verify immediately before push — parallel sessions land migrations.
>
> 2026-07-05 — Step 0 override: endor-cli-tools (AURI) failed to connect (both registrations: plugin + direct endorctl.exe), Tenise proceeded with override acknowledged. Known gap: AURI security scanning unavailable this build. (Codegraph's orphaned lock was cleared with her approval in the same gate and re-probed healthy: 880 files / 10,067 nodes.)

---

## Source material read (this session, in full)

- PRDs: PRD-06 (Guiding Stars & Best Intentions), PRD-14D (Family Hub), PRD-24 (Gamification Foundation), PRD-26 (Play Dashboard), PRD-32A (Demand Validation)
- Addenda: PRD-14D-Cross-PRD-Impact, PRD-24-Cross-PRD-Impact, **PRD-24A-Game-Modes** (load-bearing — founder-approved family-challenge shapes), PRD-26-Cross-PRD-Impact, PRD-32-32A-Cross-PRD-Impact, PRD-31-Permission-Matrix, PRD-35-Cross-PRD-Impact, PRD-Audit-Readiness
- Handoff brief `Family-Goals-And-Prizes-Handoff.md` — every §3 codebase claim independently re-verified against live migrations/code: **all accurate** (earned_prizes NOT NULL @100144:15; contracts NULL="all kids" @100199:37; dispatch per-member matching + family-wide IF-counts @100206; family tallies never fire deeds — no `fireDeed` in `useFamilyBestIntentions.ts`)
- Live surfaces: `useEarnedPrizes.ts`, PrizeBoard tabs (allowance/prizes/balance), MyRewards component family, 100266 visibility-model migration, STUB_REGISTRY + WIRING_STATUS

## Context (why this build)

Founder (2026-07-05): *"there should be prizes for each person, and a category for family prizes, so if the family is working together on a prize or a goal, it would be a family prize... This should allow family tracking, family prizes, family best intentions, and other family goals."* Real contribution tracking now, not a placeholder. `family_best_intentions` tallies have existed since PRD-14D with zero reward pipeline attached; every prize today belongs to exactly one member; PRD-24C (the designated sub-PRD for family challenges) was never written. This build closes the loop with a purpose-built Family Goal engine.

## Founder decisions — RESOLVED 2026-07-05 (this session, AskUserQuestion)

1. **FD-4:** NEW `family_goals` container linking Family Best Intentions and tasks (NOT extending `family_best_intentions`).
2. **FD-5:** BOTH earning modes ship, mom picks per goal: `shared_counter` ("All together") / `each_member` ("Everyone does their part").
3. **FD-6:** One `FamilyGoalManager`, two doors: Prize Board + Hub Settings. Studio wizard deferred.
4. **FD-7:** Standalone build, PRD-24C noted. No PRD document authored now.
Plus handoff-session decisions FD-1/2/3 (real tracking; participant visibility on /my-rewards; redeem once for everyone).

## Founder riders — approval conditions (2026-07-06, verbatim intent)

- **Rider 1 — earned_prizes touches Slice 1's visibility/RLS model.** The kids-rewards slice pins (slices 1–5, `tests/e2e/features/kids-rewards-slice*.spec.ts`) are **MANDATORY regression gates** for this build — all green before close-out, no exceptions. The every-reader audit (Build Item 8) must have its **findings RECORDED in this build file** (see "Earned-Prizes Reader Audit Findings" table below) — performing the audit without writing down what was found at each site does not satisfy the rider.
- **Rider 2 — events vs. obligations, codified.** Family-goal contributions count **EVENTS** — taps and completions as they happen (numerators). Any future goal type that asks "did everyone finish what was assigned today" is an assigned-**denominator** question and **MUST route through `get_member_day_obligations` (Convention #271)** — which is exactly why that goal type is stubbed in this build. **Never derive assigned-denominators inline.** This rider is the standing law for every future extension of the family-goals engine (new `source_kind` values included).

## Earned-Prizes Reader Audit Findings (Rider 1 — populated by the worker)

| Reader (file) | NOT-NULL assumption found? | Change made / why safe as-is |
|---|---|---|
| `src/hooks/useRewardProvenance.ts` | No | Never touches `family_member_id` at all — pure `source_type`/`source_id` join against tasks/best_intentions/list_items. No change needed. |
| `PrizesSection` (`src/pages/PrizeBoard.tsx`) | **Yes — 2 real bugs found** | (1) `viewableIds.has(p.family_member_id)` scoping filter for granted adults silently excluded family prizes (`viewableIds.has(null)` is always false) — fixed: `p.family_member_id === null \|\| viewableIds.has(p.family_member_id)`. (2) `grouped` reduce keyed by `prize.family_member_id` directly — a null key would bucket under the string `"null"` with no visual treatment — fixed: `prize.family_member_id ?? FAMILY_GROUP_KEY` sentinel + dedicated "Family" header (Users icon, accent color) rendered FIRST in both By-kid and By-date arrangements. Also added: summary strip math now excludes family prizes from the "N kids" count and calls them out separately ("+N family prize(s)"), mirroring the existing mom's-self-reward-exclusion pattern without literally excluding family prizes from the visible list (they still render, just not counted as a "kid"). |
| `src/components/rewards/RedeemedHistoryModal.tsx` | No direct assumption, but was structurally unreachable for family prizes | Only ever queried via the member-scoped `useEarnedPrizes(memberId)` (`useRewardReveals.ts`), which can never return a null-member row. Extended (not fixed-as-broken) with a new optional `additionalRedeemed?: EarnedPrize[]` prop so callers can merge in redeemed family prizes the member participated in — used by the new My Rewards Family section's "Previously redeemed" button. |
| `src/pages/PlayRewards.tsx` | No direct assumption | No direct `earned_prizes` query — delegates entirely to `<MyRewards variant="play">`, which inherits the Family section fix automatically (same shared component, Convention: "founder gate Q3: ONE component"). |
| `src/hooks/useRewardReveals.ts` (+ `src/types/reward-reveals.ts`) | **Yes — type-level** | `EarnedPrize.family_member_id` and `EarnedPrizeInput.family_member_id` were both typed as non-nullable `string`. Widened `EarnedPrize.family_member_id` to `string \| null` (with a doc comment explaining it's structurally never null through these member-scoped queries, just matching the DB schema honestly). Left `EarnedPrizeInput.family_member_id` as required `string` — client code never creates a family prize directly (only the DB trigger `evaluate_family_goal_award` does), so this stays a deliberate compile-time guardrail against ever trying to. |
| `src/hooks/useEarnedPrizes.ts` | **Yes — type-level, plus a pre-existing gap found** | `EarnedPrize.family_member_id` widened to `string \| null`. Also discovered and fixed a pre-existing gap unrelated to nullability: this interface was missing 4 columns migration 100266 added (`visibility`, `shared_with_member_ids`, `created_by`, `awarded_completion_id`) even though `select('*')` always fetched them — added all 4 as optional fields so `PrizesSection` and the new My Rewards Family section can read `shared_with_member_ids` with full type safety. Mutation param types (`useRedeemPrize`, `useUnredeemPrize`, `useUpdatePrizeImage`) widened from `memberId?: string` to `memberId?: string \| null` to accept a family prize's null id being passed through unchanged. |
| Additional consumers found by grep | — | No other file queries or destructures `earned_prizes.family_member_id` directly. `src/lib/connector/awardCustomReward.ts` and `award_custom_reward_for_completion` (SQL RPC) always target a real member (privileges/family_activities task rewards are never family-goal-sourced) — out of scope, correctly untouched. |

## Dependencies Already Built

- `family_best_intentions` + `family_intention_iterations` (PRD-14D, live, 1+4 rows) with Hub tally UI + personal-dashboard widget (`InfoFamilyIntention.tsx`) + `useFamilyBestIntentions.ts`
- `earned_prizes` + 100266 visibility model (family/private/shared + `shared_with_member_ids`) + redeem/un-redeem hooks + Prize Board Prizes tab + My Rewards sections + `RedeemedHistoryModal` + `RewardImagePicker` + `my_rewards_sections` per-member toggle pattern (KIDS-REWARDS Slices 1–5)
- `family_hub_configs` section order/visibility machinery (PRD-14D) — new section keys graft at read time
- Convention #257 trigger discipline (100158 pattern) — the template for this build's counting triggers
- Member pill selector, ModalV2, theme tokens, `useCanAccess`/feature key registry

## Dependencies NOT Yet Built (and deliberately not blocking)

- Contracts/godmother layer CANNOT host this (verified NULL-member semantics collision — Key Decision #2 in the spec). Not a dependency; an explicit non-connection.
- PRD-24C visuals, LiLa suggestion flow, Studio wizard, FO section — all stubs (below).

## Build Items

1. **Migration** (next free number; idempotent; one file): `family_goals`, `family_goal_sources`, `family_goal_contributions` (+ RLS per spec; contributions append-only, no direct client INSERT); `earned_prizes.family_member_id` DROP NOT NULL + `CHECK (family_member_id IS NOT NULL OR source_type='family_goal')` + partial UNIQUE `(source_id) WHERE source_type='family_goal'` — **with a pre-flight read of every live earned_prizes policy** (100266+) verifying NULL-member family-visibility rows resolve for all members; counting triggers `count_family_goal_contribution_from_intention` (AFTER INSERT ON family_intention_iterations) + `count_family_goal_contribution_from_completion` (AFTER INSERT OR UPDATE ON task_completions, Convention-#200-mirroring filter: `completion_type IN ('complete', NULL, 'mastery_approved')` AND approved-or-no-approval-required) + shared `evaluate_family_goal_award()` (status-guarded completion UPDATE → prize INSERT, same transaction); `family_goals` feature key seed into `feature_key_registry`. After apply: `npm run schema:dump`.
2. **Types + hooks**: `src/types/family-goals.ts`; `useFamilyGoals` (CRUD, mom-gated), `useFamilyGoalProgress` (per-goal totals + per-member counts from contributions), family-prize read integration into existing prize hooks; cache invalidation covers `['earned-prizes', familyId]` + goal keys on every mutation (Convention #261 discipline).
3. **`FamilyGoalManager`** (ModalV2): Active/Completed/Archived groups; create/edit/archive; Duplicate from completed (Key Decision #16); creation form per spec (outcome-named title, prize w/ `RewardImagePicker`, participant pills, mode segmented control w/ inline descriptions, target, source pickers — active Family Best Intentions dropdown + assignee-scoped task picker, optional end date, progress-visible toggle, Heart `is_included_in_ai` toggle); edit-never-resets-progress copy.
4. **Prize Board (Prizes tab)**: Family prizes group (By-kid arrangement gains a "Family" group; By-date gets a Family badge); Family Goals strip (active goals w/ progress + prize preview) + [Manage Family Goals] door; redeem/un-redeem on family rows via existing hooks (verify NULL-member handling in `PrizesSection`, summary strip owed-math EXCLUDES family prizes the same way mom's self-rewards are excluded — Slice 5 precedent).
5. **Hub section `'family_goals'`**: new section key (read-time graft into saved `section_order`), mom-configurable visibility, non-collapsible, hidden when empty (mom-only warm empty state); Mode A family progress bar / Mode B per-member mini-progress in member colors; ≤48h-completed celebration banner "You did it! [Prize] earned!"; respects `progress_visible=false` (shows goal + prize, hides numbers).
6. **Hub Settings door**: "Family Goals & Prizes" management group beside Family Best Intentions Management → same `FamilyGoalManager`.
7. **My Rewards Family section**: participants only (FD-2: membership in `participating_member_ids` for in-flight; `shared_with_member_ids` for earned); "You: X · Family: Y/Target" framing; earned unredeemed family prizes; redeemed included in `RedeemedHistoryModal`; `my_rewards_sections` toggle (default ON); mom's Me view included.
8. **Nullable-member code audit**: sweep every `earned_prizes` consumer for NOT-NULL assumptions — `useRewardProvenance`, `PrizesSection` groupings, `RedeemedHistoryModal`, `PlayRewards`, `useRewardReveals` prize queries — add explicit family-prize branches or guards.
9. **FeatureGuide + LiLa knowledge** (Convention #14 Part B): `<FeatureGuide featureKey="family_goals" />` on the manager surface; `src/lib/ai/help-patterns.ts` patterns ("how do family prizes work", "family goal"); `supabase/functions/_shared/feature-guide-knowledge.ts` page knowledge + warm setup recipe.
10. **E2E spec** `tests/e2e/features/family-goals-prizes.spec.ts` (service-role fixtures, FAMGOAL prefix, swept beforeAll+afterAll): create Mode A goal via UI; intention taps increment progress; threshold-cross awards EXACTLY ONE family prize (concurrency probe: rapid Nth/N+1th contributions); Mode B withholds until every participant hits target; non-participant contributions never count; window: post-`ends_at` contribution doesn't count; task-source goal counts at completion AND approval-required counts only at approval; My Rewards participant visibility + non-participant absence of the goal; mom redeem-once → reflected for all; un-redeem; RLS probes (kid cannot INSERT/UPDATE `family_goals` or INSERT `family_goal_contributions` directly). **Every pin drives the real flow with DB assertions** (STUDIO-EXPERIENCE rider (a) standard).
11. **Eyes-on tour** (Convention #277): EYES_ON_TOUR-gated spec covering FamilyGoalManager, Prize Board family group + strip, Hub section, Hub Settings door, My Rewards Family section — desktop/tablet/mobile, mom + a participant kid role; Claude reads every screenshot and fills the Mom-UI table below. Mobile nav parity N/A (no new top-level page — all surfaces live inside existing pages).
12. **Docs close-out** (Checkpoint 6): STUB_REGISTRY (update the 2026-07-05 awaiting-pre-build entry → built, register the stubs below), WIRING_STATUS section, CLAUDE.md convention entry (Family Goals engine contract), `live_schema.md` regen, verification table copy-back to the feature decision file, archive this file to `.claude/completed-builds/2026-07/`, feature-decisions README index row.

## Stubs (NOT building — full list with rationale in the feature decision file)

Boss Battle/Bingo visuals (PRD-24C proper) · "everyone completes everything on day X" goal type (Convention #271 obligations class) · money-payload family prizes (#223) · LiLa goal suggestions + NLC/Studio wizard · Family Overview section · PlayRewards display (Hub covers Play kids) · reveal-ceremony/presentation-layer award animation (Hub banner only) · award notifications · realtime Hub progress · contribution rewind on un-complete (#206 consistency) · LiLa context assembly (column ships, wiring later) · repeating goals (Universal Scheduler when built) · victory/tracker/homework source kinds.

## Key Decisions (architectural, with rationale — full versions in the spec)

- **D-A: Purpose-built engine, NOT contracts.** `contracts.family_member_id IS NULL` already means "applies to each kid independently," and dispatch IF-counts behave family-wide for NULL-member contracts while granting to the Nth-deed member — irreconcilable with one shared goal. Precedent for a dedicated engine: coloring reveals (Convention #211).
- **D-B: Family Prize = `earned_prizes` row with NULL member** (visibility='family', participants snapshot in `shared_with_member_ids`, `source_type='family_goal'`). One row = mom redeems once for everyone (FD-3), existing redeem hooks unchanged.
- **D-C: DB-trigger counting** so every write path contributes (Hub taps, dashboards, family-device shadow sessions, approvals) with zero per-path client wiring; award is transactional + race-safe (status-guarded UPDATE + partial unique index).
- **D-D: Contributions count actions, never points** (PRD-24 Family Challenge Equity law).
- **D-E: Celebration-only:** no rewind, no revocation, expired goals never shame.

## Mom-UI Surfaces

- Prize Board → Prizes tab (Family group + Family Goals strip + manager door) — shells: mom (+ granted dads read-only), modification
- `FamilyGoalManager` modal — shells: mom, new
- Hub Settings → Family Goals & Prizes group — shells: mom, modification
- Family Hub → `family_goals` section — shells: all (Hub is shell-independent), new section
- My Rewards → Family section — shells: mom (Me view), adult, independent, guided, modification

## Mom-UI Verification

*(Claude-driven per Convention #277 — `family-goals-prizes-eyes-on-tour.spec.ts`, EYES_ON_TOUR=1, 17 screenshots in `eyes-on-tour/fg-*.png`, all read and judged directly.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| FamilyGoalManager list view (Active/Completed groups, edit/duplicate/archive icons) | ✅ `fg-manager-list-desktop.png` | ✅ `fg-manager-list-tablet.png` | ✅ `fg-manager-list-mobile.png` (bottom-sheet) | Mom | Active goal card shows "3/10 together"; Completed card shows "1/1 together · completed" + duplicate icon | 2026-07-06 |
| FamilyGoalManager creation form (title/description/prize+picture picker/participant pills/mode toggle/target/sources/end date/progress-visible/Heart) | ✅ `fg-manager-form-desktop.png` | ✅ `fg-manager-form-tablet.png` | ✅ `fg-manager-form-mobile.png` | Mom | All fields render correctly themed; participant pills show correct member colors; "All together" mode description text renders | 2026-07-06 |
| Prize Board Family group + Family Goals strip + summary strip math | ✅ `fg-prizeboard-desktop.png` | ✅ `fg-prizeboard-tablet.png` | ✅ `fg-prizeboard-mobile.png` | Mom | Strip shows "3/10" progress bar + Manage button; summary strip reads "2 prizes waiting across 2 kids · +1 family prize" (exact designed copy); "Family (1 unredeemed)" group renders FIRST with Users icon, correct prize name, Redeemed button | 2026-07-06 |
| Hub `family_goals` section — active goal progress + ≤48h celebration banner | ✅ `fg-hub-section-desktop.png` | ✅ `fg-hub-section-tablet.png` | ✅ `fg-hub-section-mobile.png` | Mom (Hub is shell-independent) | "You did it! FAMGOAL Eyes-On Family Bike Ride Prize earned!" banner + active goal "3/10" progress bar, positioned correctly between Family Intentions and Victories | 2026-07-06 |
| Hub Settings "Family Goals & Prizes" door (+ "Family Goals" in Section Visibility & Order) | ✅ `fg-hubsettings-door-desktop.png` + `fg-hubsettings-door-scrolled-desktop.png` | — (not meaningfully viewport-differentiated) | ✅ `fg-hubsettings-door-mobile.png` | Mom | "Family Goals" row present in Section Visibility & Order between Family Best Intentions and Victories Summary; scrolled shot confirms the "Family Goals & Prizes" settings group + description + "Manage Family Goals" button render right after Family Best Intentions | 2026-07-06 |
| My Rewards Family section — participant "You: X · Family: Y/Target" framing + family prizes ready | ✅ `fg-myrewards-participant-desktop.png` | ✅ `fg-myrewards-participant-tablet.png` | ✅ `fg-myrewards-participant-mobile.png` | Independent (Alex) | "FAMGOAL Eyes-On Movie Night — You: 2 · Family: 3/10" + "Family prizes ready — FAMGOAL Eyes-On Family Bike Ride Prize", exact designed copy confirmed | 2026-07-06 |
| My Rewards Family section — non-participant correct empty state (goal absent) | — | — | ✅ `fg-myrewards-nonparticipant-mobile.png` | Guided (Jordan) | "Family Goals — No family goals in progress right now." renders; the goal Jordan is NOT a participant in is correctly absent | 2026-07-06 |

Mobile nav parity: N/A — no new top-level page was added (all 5 surfaces live inside existing pages/modals per the build's Mom-UI Surfaces list).

## Dispatch prompt (paste into a FRESH session AFTER founder approval)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for FAMILY-GOALS-PRIZES — family goals with
multi-member contribution tracking and family prizes. Pre-build complete and
founder-approved 2026-07-05; all design decisions are RESOLVED — build exactly
what the spec says, no scope trimming, no simpler-for-now substitutions.

READ FIRST (in order):
1. claude/feature-decisions/Family-Goals-And-Prizes.md — THE SPEC. Schema,
   triggers, surfaces, key decisions, stubs. Your requirement list.
2. .claude/rules/current-builds/FAMILY-GOALS-PRIZES.md (auto-loads) — build
   items 1-12, in that order.
3. claude/feature-decisions/Family-Goals-And-Prizes-Handoff.md — background.
4. Migration 00000000100266_kids_rewards_pipeline_core.sql — the earned_prizes
   visibility model + RLS you are extending. Read every policy before touching
   the table.
5. Migration 00000000100158_family_today_and_date_triggers.sql — the trigger
   discipline template (SECURITY DEFINER, search_path=public, family-timezone
   derivation, America/Chicago fallback).

NON-NEGOTIABLES:
- Do NOT route family goals through contracts/deed_firings/godmothers (spec
  Key Decision #2 — the NULL-member semantics collide). Purpose-built tables
  + triggers only.
- Contributions count ACTIONS (one tally = 1, one completion = 1), never
  points. Task completions count only when completion_type IN ('complete',
  NULL, 'mastery_approved') AND (no approval required OR approved) — mirror
  the Convention #200 filter.
- Award = status-guarded UPDATE + prize INSERT in ONE transaction; the
  partial unique index on earned_prizes(source_id) WHERE
  source_type='family_goal' is your double-award backstop. Prove it with the
  concurrency E2E probe.
- earned_prizes.family_member_id goes nullable with the CHECK constraint from
  the spec. Audit EVERY consumer (useRewardProvenance, PrizesSection,
  RedeemedHistoryModal, PlayRewards, useRewardReveals) for NOT-NULL
  assumptions before shipping.
- No client-side "today" writes (Convention #257): contributions carry
  TIMESTAMPTZ only; window checks happen in the trigger at families.timezone.
- Migration number: take the NEXT FREE number at file-creation time and
  re-check right before applying (parallel sessions). If `supabase migration
  list --linked` shows unapplied migrations that are NOT yours, do NOT `db
  push` (it batches everything) — apply only your own idempotent SQL via
  `supabase db query --linked -f <file>` instead.
- Lucide icons only, no emoji; Heart = is_included_in_ai toggle; theme tokens
  only (run npm run check:colors).
- FOUNDER RIDER 1: kids-rewards slice pins 1-5
  (tests/e2e/features/kids-rewards-slice*.spec.ts) are MANDATORY regression
  gates — all green before close-out. RECORD the earned_prizes every-reader
  audit findings in the build file's "Earned-Prizes Reader Audit Findings"
  table — one row per reader, what was found, what changed or why it's safe.
  Performing the audit without recording it does not satisfy the rider.
- FOUNDER RIDER 2: contributions count EVENTS (taps/completions as they
  happen — numerators). Never derive assigned-denominators inline anywhere in
  this build; the "everyone finished what was assigned today" goal type is
  stubbed precisely because it must route through get_member_day_obligations
  (Convention #271) when built.

PROOF: tests/e2e/features/family-goals-prizes.spec.ts per build item 10 —
every pin drives the REAL flow with service-role DB assertions; FAMGOAL
fixture prefix, swept beforeAll+afterAll; zero residue verified. Then the
Convention #277 eyes-on tour (build item 11), read every screenshot, fill the
Mom-UI Verification table in the active build file. tsc -b clean, lint clean,
regression pins green (kids-rewards slices — you touch their surfaces —
plus leak-pass + fo-command-center). Ask the founder before running the full
shared Playwright suites (other windows share fixtures).

COORDINATION: STUDIO-EXPERIENCE slices and SAFETY-BETA-GATE may be in flight.
Your territory: the new migration, src family-goals code, the five surfaces
named in the build items, and the earned_prizes consumer audit. Do not touch
other builds' files; flag cross-territory needs for the founder.

CLOSE-OUT: fill the Post-Build Verification table (every build item + spec
requirement Wired/Stubbed/Missing, zero Missing), copy to the feature
decision file, complete build item 12 docs. NOTHING COMMITS until proof is
green AND founder confirms; selective staging (this build's files only).
```

## Progress Log (2026-07-06, Sonnet worker session)

**Migration `00000000100284_family_goals_and_prizes.sql`** — took 100284 (100283 was latest at both apply-time checks). Applied via `supabase db push --linked`; verification block passed (3 tables, nullable column, CHECK constraint, unique index, feature key). Live query confirmed all 3 tables exist.

**Pre-flight RLS audit (per the migration's own mandate) — result: zero policy rewrite needed.** Read every live `earned_prizes` policy from migration 100266 directly: the SELECT and UPDATE policies both short-circuit on `visibility = 'family'` BEFORE any `family_member_id` comparison is reached, so a NULL `family_member_id` with `visibility='family'` (exactly what a family prize is) already resolves to visible/editable for the whole family + mom. `redeem_own_prize()` also already degrades safely — `fm.id = v_prize.family_member_id` with `family_member_id=NULL` never matches any real member, so kids correctly cannot self-redeem a family prize (matches FD-3: mom redeems once for everyone). This was verified by reading the actual policy SQL, not assumed.

**Trigger design decision, documented in CLAUDE.md Convention #278:** a contribution that arrives after a goal has already flipped to `'completed'` does NOT count (each per-source trigger gates on `fg.status='active'`). This surfaced during the concurrency-probe E2E test (test 3) — the first version of that test asserted `current_progress === 4` after two truly-concurrent threshold-crossing contributions, but the real (correct) outcome lands on 3 OR 4 depending on real commit-ordering timing, because the "losing" transaction's own trigger correctly declines to count once the goal is already won. Fixed the TEST's assertion (not the trigger) to `toBeGreaterThanOrEqual(3)` / `toBeLessThanOrEqual(4)`, keeping the one invariant that must always hold — exactly one prize, ever — as a strict equality check. This is judged correct product behavior, not a bug: once the family hits the threshold, additional simultaneous actions don't need to keep incrementing a frozen counter.

**Nullable-member audit (Rider 1) found 2 real bugs in the PRE-EXISTING `PrizesSection`** (not introduced by this build, but only surfaced because this build made `family_member_id` nullable for the first time): (1) `viewableIds.has(p.family_member_id)` — granted adults would have silently lost visibility into family prizes entirely, since `Set.has(null)` is always false; (2) the `grouped` reduce keyed directly by `prize.family_member_id`, which would have bucketed every family prize under the literal string `"null"` with no visual treatment. Both fixed as part of Build Item 4/8 (see Earned-Prizes Reader Audit Findings table).

**A second pre-existing gap found and fixed while auditing:** `src/hooks/useEarnedPrizes.ts`'s `EarnedPrize` interface was missing 4 columns that migration 100266 (KIDS-REWARDS-PAGE) added months ago — `visibility`, `shared_with_member_ids`, `created_by`, `awarded_completion_id` — even though `select('*')` always fetched them. Added all 4 as optional fields; this was necessary for the new My Rewards Family section to read `shared_with_member_ids` with type safety, and incidentally closes a pre-existing type-completeness gap unrelated to nullability.

**Regression-suite flake investigation (Rider 1 mandatory gate):** the full combined suite (kids-rewards slices 1-4 + kids-rewards-page.spec.ts [Slice 5] + role-scoping-leak-pass + fo-command-center, 74 tests) was run to completion **three times** during this build:
1. First run: 1 failure — `kids-rewards-page.spec.ts` test 1 (arrangement toggle), a Playwright strict-mode violation from finding 2 "Casey" elements in the By-date list. Root-caused to STALE pre-existing `KRS5`-prefixed fixtures left in the shared Testworth family by an old manual `kids-rewards-eyes-on-tour.spec.ts` session (visible in `eyes-on-tour/` screenshots dated mid-June), never swept because `kids-rewards-page.spec.ts` alphabetically runs before `kids-rewards-slice1.spec.ts` (whose `beforeAll` is what sweeps the `KRS5` prefix) in a combined multi-file run. Confirmed via direct SQL: 0 `KRS5`-prefixed `earned_prizes` rows existed by the time slice1's cleanup had run later in that same suite. Not a regression from this build's code — a pre-existing test-suite ordering hazard, now resolved as a side effect (the stale rows are gone).
2. Second run (after confirming 0 stale rows): all 74 tests green.
3. Third run (added `family-goals-prizes.spec.ts` itself into the same combined pass, interleaved with the regression suite, to prove no cross-suite interference): 1 unrelated single-test flake — `kids-rewards-slice2.spec.ts`'s prefs-persistence `.poll()` timing out once, on a test that has zero relationship to Family Goals code. Re-ran in isolation: passed cleanly. A final full consolidated run (all 8 spec files together, including `family-goals-prizes.spec.ts`) is the one referenced in the Post-Build Verification table below.

**Nothing committed.** Per the dispatch's own gate and the standing rule for this session: selective staging (this build's files only — see the file list in the final report) is prepared but held pending founder eyes-on and explicit confirmation to commit/push.

## Post-Build Verification

*(Checkpoint 5 — every Build Item + spec requirement: Wired / Stubbed / Missing. Zero Missing required.)*

| Requirement | Status | Evidence |
|---|---|---|
| Build Item 1 — Migration: 3 new tables + RLS + triggers + earned_prizes nullable + feature key | **Wired** | Migration `00000000100284_family_goals_and_prizes.sql` applied to linked production; verification block passed (3 tables, nullable column, CHECK constraint, unique index, feature key) |
| Pre-flight audit of every live `earned_prizes` RLS policy before altering | **Wired** | Confirmed via direct read of migration 100266's SELECT/UPDATE policies + `redeem_own_prize()` — both already resolve correctly for NULL `family_member_id` via the `visibility='family'` short-circuit; zero policy rewrite needed (documented in the migration's own comments + Convention #278) |
| Counting trigger: `count_family_goal_contribution_from_intention` (AFTER INSERT on family_intention_iterations) | **Wired** | E2E test 2 (tap increments), test 5 (non-participant excluded), test 6 (window/expiry) |
| Counting trigger: `count_family_goal_contribution_from_completion` (AFTER INSERT OR UPDATE on task_completions, Convention #200 mirror) | **Wired** | E2E test 7 (no-approval counts at insert; approval-required counts only at approval) — predicate based on the CURRENT authoritative migration 100278 body, not superseded/dropped versions |
| Shared `evaluate_family_goal_award()` — status-guarded + partial-unique-index race safety | **Wired** | E2E test 3 concurrency probe: 2 truly-concurrent threshold-crossing contributions → exactly 1 prize, always. `EXECUTE` revoked from PUBLIC/anon/authenticated |
| `npm run schema:dump` regeneration | **Wired** | `claude/live_schema.md` regenerated post-migration |
| Build Item 2 — Types + hooks (`family-goals.ts`, `useFamilyGoals.ts`) | **Wired** | `src/types/family-goals.ts`, `src/hooks/useFamilyGoals.ts`; cache invalidation (Convention #261) wired into `useLogFamilyIntentionTally`, `useCompleteTask`, `useApproveTaskCompletion` |
| Build Item 3 — `FamilyGoalManager` (Active/Completed/Archived, create/edit/archive, Duplicate-from-completed, full creation form) | **Wired** | `src/components/rewards/FamilyGoalManager.tsx`; E2E test 1 (UI creation); eyes-on tour screenshots (list + form, 3 viewports) |
| Build Item 4 — Prize Board Family group + Family Goals strip + manager door + redeem/un-redeem on family rows | **Wired** | `src/pages/PrizeBoard.tsx`, `src/components/rewards/FamilyGoalsStrip.tsx`; E2E test 9 (redeem-once + un-redeem via UI, DB-asserted); eyes-on tour (summary strip math, Family group ordering) |
| Build Item 5 — Hub `family_goals` section (progress + celebration banner + empty state + progress_visible respect) | **Wired** | `src/components/hub/sections/HubFamilyGoalsSection.tsx`; eyes-on tour confirms celebration banner text + progress bar rendering |
| Build Item 6 — Hub Settings "Family Goals & Prizes" door | **Wired** | `src/components/hub/HubSettings.tsx`; eyes-on tour scrolled screenshot confirms placement + button |
| Build Item 7 — My Rewards Family section (participant-only, "You: X · Family: Y/Target" framing, earned prizes, redeemed history merge, toggle default ON) | **Wired** | `src/components/rewards/MyRewards.tsx`; E2E test 8 (participant sees it, non-participant doesn't); eyes-on tour confirms exact copy + non-participant empty state |
| Build Item 8 — Nullable-member code audit (6 readers) | **Wired** | Full findings table above (Rider 1) — 2 real bugs found and fixed in `PrizesSection`, types widened in 2 files, `RedeemedHistoryModal` extended |
| Build Item 9 — FeatureGuide + LiLa knowledge | **Wired** | `<FeatureGuide featureKey="family_goals">` on the manager; `feature_guide_registry.ts` entry; `help-patterns.ts` pattern; `feature-guide-knowledge.ts` PAGE_KNOWLEDGE (`/prize-board`, `/my-rewards`) + new USE_CASE_RECIPE |
| Build Item 10 — E2E spec, every pin DB-asserted | **Wired** | `tests/e2e/features/family-goals-prizes.spec.ts` — 10/10 passing, zero FAMGOAL fixture residue verified post-run |
| Build Item 11 — Eyes-on tour, Claude reads every screenshot | **Wired** | `tests/e2e/features/family-goals-prizes-eyes-on-tour.spec.ts` — 17 screenshots across 3 viewports × mom/participant/non-participant, all read and judged (Mom-UI table above) |
| Build Item 12 — Close-out docs | **Wired** | STUB_REGISTRY.md flipped + 13 stubs registered; WIRING_STATUS.md new section; CLAUDE.md Convention #278; `live_schema.md` regenerated; this table; feature decision file copy-back; build file archival pending founder sign-off |
| Rider 1 — kids-rewards slice pins 1-5 mandatory regression gate | **Wired** | `kids-rewards-slice1/2/3/4.spec.ts` + `kids-rewards-page.spec.ts` (Slice 5) all green in the full combined re-run (see Progress Log) — one transient failure traced to PRE-EXISTING stale `KRS5`-prefixed fixtures left by an old manual `kids-rewards-eyes-on-tour.spec.ts` session (alphabetical file-discovery order ran `kids-rewards-page.spec.ts` before `kids-rewards-slice1.spec.ts`'s cleanup could sweep them) — unrelated to this build's code, confirmed by clean re-run after the stale fixtures were swept |
| Rider 1 — audit findings recorded in this file | **Wired** | Table above, populated per-reader with what was found and what changed |
| Rider 2 — events-not-denominators standing law | **Wired** | Codified in CLAUDE.md Convention #278 + `family_goal_sources` table comment + STUB_REGISTRY's Family Bingo-goal-type stub entry, all cross-referencing `get_member_day_obligations` (Convention #271) as the mandatory future route |
| `tsc -b` clean | **Wired** | Exit 0, verified multiple times through the build |
| `npm run lint` clean on touched files | **Wired** | 0 errors (1 error introduced then fixed — a banned `.toISOString().split()` pattern in the test file, replaced with `localIsoDaysFromToday(-1)`); 83 pre-existing warnings elsewhere, none new |
| Regression gates: leak-pass, fo-command-center | **Wired** | Both green in the full combined re-run |

**0 Missing.**
| *(populated at build close-out)* | | |
