# Family Goals & Family Prizes — Handoff Brief for Fable Pre-Build

> **Status:** NOT YET SCOPED — this is a research handoff, not an approved build plan. Written by the KIDS-REWARDS-PAGE-S5 Sonnet worker (2026-07-05) when the founder raised this mid-session and explicitly asked to switch to Fable to design/build it properly, rather than have it absorbed into the Slice 5 PrizeBoard polish it was raised alongside.
> **Founder's own words (2026-07-05):** *"In the prizes section, there should be prizes for each person, and a category for family prizes, so if the family is working together on a prize or a goal, it would be a family prize."* Then, when asked whether to build real multi-member contribution tracking now vs. a simple mom-declared category: *"I want to build it now, but I want to switch to fable to do it. This should allow family tracking, family prizes, family best intentions, and other family goals."*
> **Next step:** run `/prebuild` (or an equivalent Fable-led pre-build ritual) against this brief before writing any code. This document is the research base, not the spec.

---

## 1. What the founder wants (as stated, unresolved into a design yet)

A family-level goal/tracking system, broader than just "Family Prizes on the Prize Board":

- **Family tracking** — some mechanism for the family to work toward something together (not one kid's task/routine).
- **Family prizes** — a prize category that isn't owned by one `family_member_id`; it's earned by the family collectively.
- **Family Best Intentions** — the founder named this explicitly as something this system "should allow," alongside Family Prizes and "other family goals." `family_best_intentions` ALREADY EXISTS (PRD-14D, Family Hub) but today it's a disconnected tally list with no reward pipeline — see §3.
- **Other family goals** — the founder's own phrasing implies this isn't just prizes; it's a general "family goal" abstraction that prizes are one manifestation of.

## 2. Three decisions the founder DID resolve (via AskUserQuestion mid-session, 2026-07-05)

1. **Build real contribution tracking now, not a manual mom-declared placeholder.** She explicitly rejected the "mom manually declares a family prize with no automation" option.
2. **Visibility:** *"If they have a family prize they have access to, or are trying to earn, yes, they should see it."* — a family goal/prize should surface on a member's own `/my-rewards` page when that member is a participant (has access to it / is working toward it), not just on the mom-facing Prize Board.
3. **Redemption:** mom marks a family prize redeemed **once, for everyone** — one row, one redeem action (matches the existing per-kid Prize Board "Redeemed" button semantics; NOT per-person individual redemption tracking).

Everything else — what "family working together" means mechanically, how it's authored, how it's evaluated, what UI surfaces it — is open and belongs to the Fable pre-build.

## 3. What already exists in the codebase (grounded research, not guesses)

### 3a. The reward pipeline is entirely per-member, with one nullable-but-differently-meaning exception

- **`earned_prizes`** (migration `00000000100144_earned_prizes_and_reveal_naming.sql:15`): `family_member_id UUID NOT NULL REFERENCES family_members(id)`. **Not nullable.** Every earned prize belongs to exactly one member today. A family prize needs either a schema change here (nullable + new semantic) or a parallel table — Fable should weigh both.
- **`contracts`** (migration `00000000100199_contracts_table.sql:36-37`): `family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL` — **already nullable**, but the existing meaning is *"NULL = all kids in family"* (an inheritance default that applies the SAME contract independently to EACH kid — see the family-default/kid-override/deed-override three-tier inheritance model, Convention #258-adjacent). **This is NOT "one shared goal split across kids."** A real family-goal contract type would need a genuinely new semantic here (or a new column) and must not collide with the existing family-default meaning — this is the single most important disambiguation for the Fable session to nail down early, or existing per-kid-default contracts and new family-shared contracts will be impossible to tell apart.
- **`deed_firings`** (migration `00000000100180`-era, Phase 3 Connector Layer) — every firing has exactly one `family_member_id` (the actor whose action triggered it) and dispatch (`dispatch_godmothers`) evaluates contracts against that one member. There is no concept of "N members must all fire this deed" or "the aggregate crossed a threshold" anywhere in `dispatch_godmothers` or any of the 12 existing godmothers (`money_godmother`, `points_godmother`, `creature_godmother`, `custom_reward_godmother`, etc. — see CLAUDE.md Convention #258/WIRING_STATUS "Phase 3 — Connector Layer"). A family-goal-firing godmother would need either (a) a new aggregation layer that watches multiple deed_firings and fires once a condition across members is met, or (b) each member's individual completion incrementing a shared counter that a trigger checks (closer to the `family_intention_iterations` pattern below).

### 3b. The one existing "shared goal" precedent — disconnected from rewards entirely

- **`family_best_intentions`** (migration `00000000100064_prd14d_family_hub.sql:118-133`): `title`, `description`, `participating_member_ids UUID[] NOT NULL`, `require_pin_to_tally BOOLEAN`. This IS a family-level goal definition with named participants — the closest existing analog to what the founder is describing.
- **`family_intention_iterations`** (same migration, `:214-221`): `intention_id` (FK to the above), `member_id`, `day_date` — each participating member can log a tally on a given day. This is the "everyone contributes" mechanic, already built and in production (4 rows currently).
- **The gap:** nothing reads `family_intention_iterations` to fire a reward. It's a pure tracking/display feature (Family Hub dashboard section, per Convention #178/#179). No connection to `contracts`, `deed_firings`, or `earned_prizes` exists. If the Fable session wants "Family Best Intentions" to be one of the things that can produce a "Family Prize," this is the natural place to attach a threshold-detection layer — but it's new work, not existing wiring.

### 3c. Precedent for "family-wide" as NULL elsewhere in the codebase (Convention #274)

Convention #274 established a working pattern for "this applies to the whole family, not one kid" using `target_member_id IS NULL` on `member_permissions` (financial_tracking grants), with **per-kid rows always winning as exceptions over the family-wide NULL row**, resolved via a dedicated SQL helper (`util.finance_grant_level()`) mirrored in a TS hook. This is a good structural precedent for "family-wide entry + per-kid override," but it's a permissions-grant pattern, not a goal-progress/threshold pattern — useful for how mom might scope WHO sees/participates in a family goal, not for HOW the goal's completion condition is evaluated.

## 4. Open design questions for the Fable pre-build (not resolved by this brief)

1. **What does "the family is working together on a goal" mean mechanically?** Candidates: (a) every participating member independently completes their own version of a task/routine N times (mirrors `family_intention_iterations`' per-member tally, aggregated to a family total or an all-members-hit-N threshold); (b) any member's contribution counts toward one shared counter (pure aggregate, order-independent); (c) a specific subset condition (e.g., "3 of 4 kids" — a quorum). The founder's phrasing ("working together") leans toward (a) or (b), not (c), but this needs an explicit founder decision during the Fable pre-build, not an assumption.
2. **Where does a family goal live relative to `family_best_intentions`?** Extend that existing table/feature (add reward-attachment capability to it), or build a new parallel "family goal" concept that `family_best_intentions` becomes one flavor of? The founder's phrasing ("family tracking, family prizes, family best intentions, and other family goals") suggests she may want ONE unifying "Family Goal" abstraction with Best Intentions and Prizes as two of its outcomes/flavors — this is a real architecture fork, not a detail.
3. **How does a family prize get evaluated/fired?** New godmother type (`family_prize_godmother`) fed by a new aggregation mechanism, vs. a scheduled/triggered check (cron-based threshold scan, per Convention #246's `util.invoke_edge_function` pattern) vs. a database trigger on `family_intention_iterations`/task_completions that recomputes a family goal's progress on every relevant write. Needs its own concurrency/idempotency thinking (the existing per-member godmother dispatch has a UNIQUE-constraint idempotency guard on `contract_grant_log.deed_firing_id + contract_id` — a family-scoped firing has no single deed_firing to key off of, so a new idempotency key shape is needed).
4. **Schema for the prize itself:** nullable `earned_prizes.family_member_id` (simplest, but changes a NOT NULL column with existing RLS policies keyed on it — audit every policy before touching it) vs. a new `family_earned_prizes`-style table (avoids touching the existing per-kid RLS/redeem/history code paths, but means "family prizes" and "my prizes" become two data sources the UI has to merge, including inside `MyRewards.tsx`'s Custom Rewards section per decision #2 below).
5. **Visibility resolution for decision #2 (surfaces on a member's own rewards page "if they have access to it, or are trying to earn it"):** needs a concrete rule — is "access" `participating_member_ids` membership? Is "trying to earn it" the same set, or does it include ANY family member as long as the goal is active (so kids can see what's in flight even before they've logged a tally)? This directly shapes the RLS design and the `MyRewards.tsx` query.
6. **Redemption UI (decision #3):** "mom marks it redeemed once, for everyone" is simple to implement once the schema question (#4) is settled — no new design work needed here beyond wiring the existing Prize Board redeem button to a family-scoped row.
7. **Where does mom author/define a family goal?** New Studio wizard entry (per Convention #249's outcome-naming rule — e.g. "Family Movie Night" not "Create a Family Goal")? An extension of the existing Family Hub "Family Best Intentions" creation flow? A new section on the Prize Board itself? This is exactly the kind of "which surface, following which existing pattern" question the wizard-friction-mapping conventions (#255) were written for.

## 5. Explicitly NOT resolved by this brief

- No PRD number is claimed or implied. Whether this becomes a new PRD, an addendum to PRD-06 (Guiding Stars/Best Intentions) or PRD-14D (Family Hub), or its own standalone feature-decision file is a call for the Fable session.
- No migration is written. No UI is built. `earned_prizes.family_member_id` remains `NOT NULL` until the Fable pre-build decides the schema shape.
- The KIDS-REWARDS-PAGE-S5 Sonnet session that produced this brief is proceeding with its ORIGINAL, already-approved, unrelated scope (Prize Board "By kid/By date" arrangement toggle, summary strip, mom's own-rewards pill) — none of which touches or depends on this Family Goals concept. See `.claude/completed-builds/2026-07/kids-rewards-page.md` and `STUB_REGISTRY.md` for that build's own tracking.

## 6. Suggested starting prompt for the Fable session

> Read `claude/feature-decisions/Family-Goals-And-Prizes-Handoff.md` in full. This is founder-directed: a family-level goal/tracking system spanning Family Prizes, Family Best Intentions, and general "family goals," where the family works toward something together rather than one kid alone. Real multi-member contribution tracking is wanted now, not a manual placeholder. Run the standard `claude/PRE_BUILD_PROCESS.md` ritual: read every relevant PRD (PRD-06 Guiding Stars/Best Intentions, PRD-14D Family Hub, PRD-24/26 gamification prize pipeline, PRD-32A demand validation) and any addenda, resolve the open design questions in §4 of the handoff brief with the founder before specifying a schema, and produce a pre-build summary for approval before any code is written.
