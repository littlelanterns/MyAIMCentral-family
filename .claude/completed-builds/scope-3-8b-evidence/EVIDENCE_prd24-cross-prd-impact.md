---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-24 (source) ↔ PRD-09A (Tasks — task_completions trigger + counts_for_gamification flag + points_override), PRD-09B (Lists — randomizer availability rules + reveal_visual), PRD-10 (widget types for TreasureBox/PointsDashboard/FamilyLeaderboard), PRD-14 (Personal Dashboard widget deployment), PRD-15 (reward_redemption request + 6 notification types + 'gamification' category), PRD-26 (Play Dashboard — primary consumer), PRD-28 (counts_for_gamification flag consumer via RPC Step 2)
Provenance: Worker `af99aecc78a4cc814` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum (316 lines) + PRD-24 base file + core RPC migrations (`…100115_play_dashboard_sticker_book`, `…100123_rpc_fix_roll_creature_for_completion`, `…100128_coloring_reveal_task_link_rpc`, `…100130_rpc_fix_uninitialized_record`, `…100134_allowance_financial` — final active) + configurable earning strategies migration `…100126` + feature decision files for Build M Play Dashboard and Configurable Earning Strategies + the 4 hook sites (`useTasks.ts` × 2, `useTaskCompletions.ts`, `usePractice.ts`) + the `GamificationResult` type + `TreasureBoxIdle` widget + auto-provision trigger at L1684 + live_schema.md spot-check against the addendum's eight promised tables. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked the PRD-24 Cross-PRD Impact Addendum integration surface end-to-end against code reality. **The headline story: addendum L262 and L308 describe PRD-24 completion as "8 new tables: `gamification_configs`, `gamification_events`, `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_achievements`, `gamification_daily_summaries`" but only 1 of these 8 actually shipped.** What actually shipped uses a completely different table topology (`gamification_creatures`, `gamification_sticker_pages`, `member_creature_collection`, `member_sticker_book_state`, `member_page_unlocks`, `member_coloring_reveals`, `coloring_reveal_library`, `gamification_themes`, `congratulations_messages`, `task_segments`, `reveal_animations`, `reward_reveals`, `earned_prizes`). Build M signed off 2026-04-13 with 42 wired/12 stubbed/0 missing against its own feature-decision file — but the Cross-PRD Impact Addendum that was supposed to describe the cross-cutting integrations was never updated to match the pivot. **Primary headline drift is Intentional-Document (founder scope-cut) with a cross-addendum docs-update debt.** **Primary SCOPE-8b axis (financial/context exclusion subset)**: gamification data is cleanly EXCLUDED from LiLa context assembly — zero grep hits in `supabase/functions/_shared/context-assembler.ts` for any gamification table. Strong positive, same gold standard as PRD-28's financial exclusion. **Primary F11 watch-point**: `roll_creature_for_completion` is SECURITY DEFINER with ZERO caller identity check — any authenticated user could invoke with any `p_task_completion_id`. Attack surface narrow (UUIDs unguessable, RLS on `task_completions` blocks SELECT outside family, idempotency UNIQUE allows one-shot per completion), but the defense-in-depth gap exists. **Primary Convention #206 ack**: task unmark cascade is stubbed in `useUncompleteTask` L434-438 with a comment saying "when PRD-24 is built" — but PRD-24 IS built. Addendum's `reward_redemption` request source, 6 gamification notification types, and `'gamification'` notification category (L199-221) are entirely absent from migrations and code — none of the PRD-15 integration the addendum promises shipped.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **8 new tables promised by PRD-24 family** | Addendum L262+L308: `gamification_configs`, `gamification_events`, `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_achievements`, `gamification_daily_summaries` | **Only `gamification_configs` shipped.** Grep across migrations + live_schema for the other 7 returns ZERO matches. Shipped topology is entirely different. Build M signed off with this pivoted topology. | Intentional-Document (founder scope-cut; addendum pre-pivot) | **SCOPE-3** Medium | N |
| 2 | **`roll_creature_for_completion` RPC — authoritative pipeline endpoint, SECURITY DEFINER, atomic, idempotency-safe** | CLAUDE.md Conv #198 | Migration `…100134:391-…` — CREATE OR REPLACE with SECURITY DEFINER, search_path=public, idempotency via UNIQUE on `member_creature_collection.awarded_source_id`, atomic within single function body, all 4 hooks wired via fire-and-forget wrapper. Matches spec. | Documented (strong positive) | — | — |
| 3 | **4 hook sites invoke the RPC** | Conv #198 | All 4 present: `useCompleteTask` (`useTasks.ts:304`), `useApproveTaskCompletion` (`useTasks.ts:829`), `useApproveCompletion` (`useTaskCompletions.ts:193`), `useApproveMasterySubmission` (`usePractice.ts:518`). Each uses `rollGamificationForCompletion` wrapper with try/catch → console.warn → return null. Matches Conv #199 (never throws). | Documented (strong positive) | — | — |
| 4 | **Practice sessions do NOT trigger pipeline** | Conv #200 + Q8=Option C | RPC Step 3 at `…100134:498-504`: `IF v_completion_type NOT IN ('complete', 'mastery_approved') THEN RETURN skipped_completion_type`. Approval-path flips `mastery_submit` → `mastery_approved` in `usePractice.ts:468` before firing RPC. Matches spec. | Documented (strong positive) | — | — |
| 5 | **`useCompleteTask` only fires RPC when `requireApproval===false`** | Conv #201 | `useTasks.ts:302-305` — `let gamificationResult = null; if (!requireApproval) gamificationResult = await rollGamificationForCompletion(completion.id)`. Approval hooks fire RPC at approval time. Matches spec. | Documented (strong positive) | — | — |
| 6 | **Cache invalidation right keys** | Conv #202 | All 4 hooks invalidate `['family-member']` + `['family-members', familyId]` when `gamificationResult && !error`. Specific hooks add `['task-completions']`, `['pending-approvals']`, etc. Matches spec. | Documented (strong positive) | — | — |
| 7 | **`GamificationResult` flat optional interface + 3 narrowing helpers** | Conv #203 | `src/types/gamification.ts:59-86` — flat interface, all fields optional, 3 helpers `gamificationDidAwardPoints` / `gamificationDidAwardCreature` / `gamificationDidUnlockPage` at L94-115. Matches spec. | Documented (strong positive) | — | — |
| 8 | **LiLa context ABSOLUTELY excludes gamification data** | Convention #225-pattern applied to PRD-24 | Grep `gamification\|member_creature\|sticker_book\|treasure_box` in `supabase/functions/_shared/context-assembler.ts` → ZERO hits. Grep same pattern across all `supabase/functions/` → hits only in gamification-owned RPCs, never in LiLa surfaces or ThoughtSift. | Documented (strong positive — same gold standard as PRD-28 financial exclusion) | — | — |
| 9 | **`counts_for_gamification` flag respected by RPC** | CLAUDE.md #224 + founder decision at Build M + PRD-28 Build O extension | `…100134:458-460` — Step 2 of the RPC: `IF COALESCE(v_task.counts_for_gamification, true) = false THEN RETURN skipped_gamification_opt_out`. Default true = non-breaking additive. | Documented (strong positive — cross-references PRD-28 evidence file seam #2) | — | — |
| 10 | **Task unmark cascade reverses points + streak + creature removal** | Addendum L31-37 names 6 specific reverse-cascade steps | `useTasks.ts:434-438` contains literal `// STUB: Reverse gamification reward/streak — wires when PRD-24 is built` comment — **stale since Build M shipped**. Hard-deletes `task_completions` row via `tc_delete_adult_or_self` RLS policy, but does NOTHING to `family_members.gamification_points`, `current_streak`, or `member_creature_collection`. CLAUDE.md Conv #206 explicitly acknowledges this as a known gap. | Intentional-Document (Conv #206 founder-acknowledged); stub comment stale | **SCOPE-3** Low (stub-comment staleness) | N |
| 11 | **`reward_redemption` request source + 6 notification types + `'gamification'` notification category** | Addendum L199-221 | Grep `reward_redemption\|reward_redeemed\|reward_approved\|reward_denied\|treasure_box_unlocked\|level_up` across `supabase/migrations/` and `src/` returns ZERO matches. **Not built.** | Intentional-Document (scope-cut with Build M pivot away from rewards architecture) | **SCOPE-3** Medium | N |
| 12 | **`lists.reveal_visual` + `max_respins_per_period` + `respin_period`** | Addendum L114-116 + L118-119 | `max_respins_per_period INTEGER` + `respin_period TEXT` present at `…000008:311-312`. **`reveal_visual` column does NOT exist** on `lists`. Actual reveal style is stored in `task_segments.randomizer_reveal_style` (Conv #214) — entirely different home. | Unintentional-Fix-PRD (Build M moved reveal-style config to `task_segments`) | **SCOPE-3** Low | N |
| 13 | **Availability rules on `list_items` (5 cols)** | Addendum L108-112 | `availability_mode`, `max_instances`, `completed_instances`, `recurrence_config`, `next_available_at` all present at `…000008:381-385`. **Daily cron for re-enabling scheduled items per addendum L135 does NOT exist.** | Unintentional-Fix-Code (schema shipped, cron re-enable loop absent) | **SCOPE-3** Low | N |
| 14 | **7 feature keys registered to `feature_key_registry`** | Addendum L38-39 names exactly 7: `gamification_basic`, `gamification_rewards_advanced`, `gamification_reveal_visuals`, `gamification_treasure_animations`, `gamification_leaderboard`, `gamification_visual_worlds`, `gamification_overlays` | `…100115:1821-1827` registers a DIFFERENT 7 keys. **Only 1 of 7 overlaps (`gamification_basic`).** Build M shipped MVP-first keys. | Intentional-Document (same scope-cut pattern as seam #1) | **SCOPE-3** Low | N |
| 15 | **`auto_provision_member_resources` seeds `gamification_configs` with shell-appropriate defaults** | Addendum L13-18 | `…100115:1684-1697` sets only `enabled`, `base_points_per_task`, `currency_name`, `currency_icon`. Column DEFAULTs cover `bonus_at_three=3`, `bonus_at_five=5`, `visualization_mode='counter'`. Addendum says Guided should get `bonus_at_three=35, bonus_at_five=60`; code ships `3, 5`. Addendum says Adult should get `base_points_per_task=1`; code ships `10`. | Unintentional-Fix-Code (trigger drift from addendum's shell-defaults matrix) | **SCOPE-3** Low | N |
| 16 | **`TreasureBox widget`, `Points Dashboard widget`, `Family Leaderboard widget` deployable to PRD-10/PRD-14 dashboards** | Addendum L143-145 | `TreasureBoxIdle.tsx` component exists as SVG animation, rendered only in `GamificationShowcase.tsx` demo. **No `dashboard_widgets` type wired. `PointsDashboard` + `FamilyLeaderboard` components don't exist.** | Unintentional-Fix-Code (reveal UI primitives exist; dashboard widget integration undelivered) | **SCOPE-3** Low | N |
| 17 | **`tasks.source='randomizer_draw'`** | Addendum L91 | `Randomizer.tsx:176` writes `source: 'randomizer_draw'` on Opportunity-task creation. Wired. | Documented (strong positive) | — | — |
| 18 | **`tasks.points_override INTEGER NULL`** | Addendum L89 | Migration `…100115:420` adds column with CHECK `points_override IS NULL OR points_override >= 0`. RPC at `…100134:518` reads `COALESCE(v_task.points_override, v_config.base_points_per_task)`. Wired. | Documented (strong positive) | — | — |
| 19 | **F11 — RPC caller identity check (SECURITY DEFINER bypasses RLS)** | CLAUDE.md #3 + PLAN §2.3 surfaces | `roll_creature_for_completion(p_task_completion_id)` body contains ZERO `auth.uid()` references or caller-vs-target family check. Any authenticated user could POST `supabase.rpc('roll_creature_for_completion', { p_task_completion_id: <any UUID> })`. **Attack surface narrow:** UUIDs unguessable, RLS on `task_completions` SELECT prevents discovery outside family, idempotency UNIQUE allows one-shot per completion. **Practically mitigated by UUID entropy + RLS.** | Unintentional-Fix-Code (defense-in-depth gap) | **SCOPE-8b** Low + **SCOPE-3** cross-ref | N (mitigations hold) |

## Unexpected findings list

1. **Stale STUB comment in `useUncompleteTask`** — `useTasks.ts:434` says "when PRD-24 is built" but Build M signed off 2026-04-13.
2. **`awarded_source_id` is not a FK** — `member_creature_collection.awarded_source_id UUID` has no REFERENCES constraint. Combined with hard-DELETE on `useUncompleteTask`, creature rows are orphaned (by design per Conv #219 "never taken away"); but a re-completion produces a NEW `task_completions.id`, so double-creature-award on unmark+remark is possible.
3. **`randomizer_reveal_style` lives on `task_segments`, not `lists`** — addendum L114 places it on `lists.reveal_visual`; Build M placed it on `task_segments.randomizer_reveal_style` (Conv #214).
4. **`coloring_reveal_library` with 32 rows shipped** but addendum doesn't mention coloring reveals at all — that entire feature surface (Conv #211-#213) is outside the addendum's framing.
5. **`reward_reveals` + `earned_prizes` + `reveal_animations` tables shipped** with their own RPCs, but addendum's `reward_redemptions` + `gamification_rewards` pattern never materialized.

## Proposed consolidation (§5.1 + §5.2 candidates)

**§5.1 within-addendum:**

- Seams #1 + #11 + #14 share root cause: **PRD-24 pivoted post-addendum; the addendum was never back-amended.** Consolidate.
- Seams #10 + #12 + #13 + #15 + #16 share root cause: **partial-wiring / stub comments stale / docs-vs-code drift at integration edges.** Consolidate.
- Seams #2-#9 and #17-#18 all document strong-positive wiring.
- Seam #19 is the lone SCOPE-8b primary. Keep standalone.

After §5.1: **3 SCOPE-3 findings** + **1 SCOPE-8b Low** + **9 documented positives**.

**§5.2 cross-addendum candidates:**

**A. "Pre-pivot addendum never back-amended" pattern.** PRD-24 is the strongest instance so far. Check future PRD-24A + PRD-24B for same drift. Not yet 3+ pattern.

**B. SECURITY DEFINER RPC caller-identity gap — 3 surfaces, threshold reached:**

| Surface | RPC | Caller check? |
|---|---|---|
| PRD-17B | `classify_by_embedding` | NO |
| PRD-18 | `match_book_extractions` | NO |
| **PRD-24 (new)** | **`roll_creature_for_completion`** | **NO** |

**ESCALATE** cross-addendum F11 consolidation: "SECURITY DEFINER RPCs use caller-provided identifiers without verifying caller's family membership at RPC-body layer."

**C. Stale stub comments.** Global audit candidate: grep `// STUB:` across `src/hooks/` for any other stubs referencing a PRD that has since built.

## Proposed finding split

- **F-α: PRD-24 Addendum describes a pre-pivot architecture; Build M shipped a different table topology, feature-key set, and PRD-15 integration scope** (consolidated seams #1+#11+#14). **Intentional-Document. SCOPE-3 Medium. Beta N.**
- **F-β: PRD-24 integration edges ship as schema/primitive-only; full cross-PRD integrations (unmark cascade, cron re-enable, dashboard widget types, shell-appropriate trigger defaults) undelivered** (consolidated seams #10+#12+#13+#15+#16). **Unintentional-Fix-Code + Intentional-Document (Conv #206) mix. SCOPE-3 Low. Beta N.**
- **F-γ: `roll_creature_for_completion` RPC lacks caller identity check** (seam #19). **Unintentional-Fix-Code. SCOPE-8b Low + SCOPE-3 cross-ref. Beta N** (practically mitigated).

## Beta Y candidates

**Zero Beta-Y candidates from this surface.** All SCOPE-3 findings are addendum-drift / docs-update debt. The single SCOPE-8b finding is practically mitigated; defense-in-depth gap only.

## Top 3 surprises

1. **6 of 8 tables promised by the addendum simply do not exist.** The addendum was written against an earlier PRD-24 design that Build M pivoted away from and was never back-amended.
2. **The gamification pipeline is the best-wired integration seam of any PRD audited so far.** Convention #198-#203 are implemented precisely.
3. **Task unmark cascade is documented as Convention #206 "known gap," but the `useUncompleteTask` stub comment still reads "wires when PRD-24 is built"** — stale 11+ days after Build M sign-off.

## Watch-flag hits

- **F11 (server-side enforcement — SECURITY DEFINER discipline)** — **PARTIAL HIT.** Seam #19. Cross-addendum pattern with PRD-17B + PRD-18 — **3+ pattern threshold reached. ESCALATE.**
- **Crisis Override** — N/A
- **F17 messaging** — Addendum promises `reward_redemption` request type + 6 notification types + `'gamification'` category. ZERO built. Covered by consolidated F-α.
- **F22+F23** — N/A
- **studio_queue source discipline** — N/A
- **`is_included_in_ai` / gamification data NOT in LiLa context** — **PASSES.** Strong positive, same gold-standard pattern as PRD-28's financial exclusion.

## Orchestrator adjudication

(empty — pending walk-through)
