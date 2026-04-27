# Connector Architecture & Routing Model

> **Status:** Draft, Phase 1 of Connector Architecture work. See `Connector-Architecture-Master-Plan.md` for full phase structure.
>
> **Date:** 2026-04-25.
> **Doc location:** `claude/web-sync/` (moved from repo root 2026-04-27).
> **Audience:** Claude.ai web (planning), Claude Code (execution), founder (review and decisions).
> **Related docs:** `Composition-Architecture-and-Assembly-Patterns.md`, `Connector-Architecture-Master-Plan.md`, `claude/web-sync/REWARDS_RECON_2026-04-25.md`, `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md`.

---

## 1. What This Doc Is

This document defines the **connector layer** for MyAIM Family — the data model and routing pattern that lets any deed (a task being completed, a Best Intention being tapped, a tracker entry being recorded, etc.) fire any number of godmothers (allowance credit, points awarded, victory written, prize IOU created, reveal animation triggered, etc.) without the deed needing to know what godmothers respond to it.

The connector layer is the missing data model underneath the architectural vision already named in `Composition-Architecture-and-Assembly-Patterns.md`:

> **Lego / Surge Protector Connection Architecture.** Every feature in MyAIM Family is a composable block with standard connection points. Blocks combine predictably. Mom doesn't need to understand database tables to build what she wants — she thinks in outcomes, and the system composes the primitives behind the scenes.

The Composition Architecture doc names the vision. This doc specifies the wiring that makes it real.

This doc is not user-facing. It is Claude.ai-to-Claude-Code communication, with founder review and decisions captured inline. It defines what gets built; it does not build anything itself.

The vocabulary in this doc (deed, contract, the IF, godmother, stroke_of, payload) is selectively magical — used where it makes the concept easier to understand, kept technical where the technical word is clearer. This vocabulary is for the founder's mental model and for Claude.ai/Claude Code's design conversations. It does not commit the front-end to the same vocabulary; the wizards and the user-facing surfaces will use whatever language makes sense for moms in the moment.

## 2. Why This Layer Exists

Today, the rewards / earnings / gamification surface is a tangle of partially-wired systems:

- The current allowance system writes through `task_rewards` columns and the `calculate_allowance_progress` RPC.
- Build M's gamification (Conventions #198–222) writes through the 11-step `roll_creature_for_completion` RPC, dispatched from four hardcoded hook sites.
- The reward-reveals architecture (5 tables, ~1,000 lines of TypeScript) is schema-complete but has zero callers and zero rows in production.
- Best Intentions write iterations to `intention_iterations` with no reward path of any kind.
- Victory Recorder is callable programmatically but is invoked from hardcoded sites; AIR (auto-routing) is unwired for all three documented sources (task completion, intention iteration, widget milestone).

Each system invented its own wiring. None of them compose with each other. Mom cannot say "when this Best Intention has been tapped 50 times, generate a spa-visit IOU" because Best Intentions has no path to IOUs. Mom cannot say "this task counts for allowance AND fires a creature roll AND writes a victory" without the wiring being hardcoded in TypeScript across multiple files.

The connector layer fixes this by introducing one architectural principle:

> **Deeds fire. Godmothers respond. Contracts are the agreements that say which deeds trigger which godmothers, with what conditions (the IF) and at what timing (stroke_of).**

A single deed firing can invoke many godmothers at once. When Maya completes "help with the baby," that one deed firing can simultaneously credit her allowance, add a helper point, write a victory record, fire a creature roll, and trigger a reveal animation — each through its own contract. This many-godmothers-per-deed capability is the central reason the connector layer exists. Without it, every cross-feature wiring has to be hardcoded; with it, mom composes any combination she wants.

Mom never sees this architecture directly. She sees a configuration UI that lets her say, in natural language, what she wants to happen when a kid does a thing. The connector layer is what makes those configurations expressible, composable, and addable-to-without-rewriting.

## 3. The Switchboard Metaphor

A house where every room was wired by a different contractor has working lights in each room — but you cannot put a switch in the bedroom that turns on a light in the kitchen, because the wiring doesn't connect across rooms. Adding a new room means adding a new wiring system.

A house with a **central switchboard** has one place where every wire terminates. Every switch in the house can be wired to any light in the house. Adding a new room is connecting to the existing switchboard, not building a new wiring system.

That is what this doc specifies: the central switchboard, with **labeled circuits** so that the right machinery picks up the right kind of connection. Every wire goes through one switchboard. Each wire is labeled with what kind of godmother it ends at — points, victory, allowance, reveal, prize, etc. — so the right consumer-side machinery handles it.

The metaphor breaks down at the implementation level — there is no literal "switchboard table" that does everything. The implementation is the contracts table plus per-godmother config tables. But conceptually, when designing, building, or reasoning about routing, the metaphor holds: **one central place where deeds meet godmothers, addressable uniformly.**

## 4. Vocabulary

This vocabulary is used consistently throughout the doc.

**Deed.** Any primitive in MyAIM Family that, when activated, generates a discrete action event. A deed says "I happened" when an action occurs. Deeds do not know what godmothers respond to them. Initial v1 deed set: task completion, Best Intention iteration, tracker entry / widget data point, list item completion, routine step completion, reading tracker progress event, time session ended (a Universal Timer session ending while attached to a task or other source). Open set; new deeds can be added without modifying the connector layer itself.

**Deed firing / "a deed fires."** The single act of a deed being activated — one task completion, one Best Intention tap, one tracker entry. Each deed firing has a polymorphic identity: `(source_type, source_id)` plus the family member to whom it belongs.

**Contract.** One row in the `contracts` table. The complete agreement that says: "When a particular deed fires, IF certain conditions are met, this godmother grants this payload at this stroke_of." A contract is the entire agreement — the deed it listens to, the IF it requires, the godmother it routes to, the payload it grants, and the stroke_of when it grants. Multiple contracts can be wired to the same deed (multi-routing). Multiple contracts can route to the same godmother (different deeds, different IFs, different payloads). The contract is the wire; deeds and godmothers are the endpoints.

**The IF.** The qualification logic on a contract. The "IF" clause in plain English — what has to be true for the contract to apply when the deed fires. Examples: "every time the deed fires," "every Nth time," "only when the cumulative deed count crosses N," "only when the deed fires above a daily required floor." The IF lives as one or more columns on the contracts table; the exact field shape is a Pass 2 design decision.

**stroke_of.** The column on a contract that says when the godmother actually grants. Common values: `immediate` (right when the deed fires), `end_of_day`, `end_of_week`, `end_of_month`, `at_period_close`, `on_threshold_cross`. Most contracts will be `immediate`. Deferred values are what enable allowance-style week-close payouts and spa-visit-by-month-end patterns. The full set of supported stroke_of values is a Pass 2 design decision.

**Payload.** The data the contract hands to the godmother when granting. Shape varies by godmother type — `1` (point amount) for points_godmother, `5` (percentage) for allowance_godmother, `"spa visit"` (text) for custom_reward_godmother, a reveal config ID for reveal_godmother. The payload column on the contracts table is likely JSONB or a reference to a per-godmother config row, depending on shape — a Pass 2 design decision.

**Godmother.** Any system that responds to deeds and grants something in response. Godmothers declare what shape of contract they accept and what they do when invoked. Initial v1 godmother set: allowance_godmother (binary contribution to a named allowance pool — "this task counts for 5% of the chores pool, completed or not"), numerator_godmother (count-based contribution to a named pool's numerator with a configurable required floor and above-floor behavior — "help mom 2x/day required; extras boost the numerator"), money_godmother (money to opportunity pool, separate from allowance pools), points_godmother (points-counter credit), prize_godmother (threshold-prize check + IOU creation), victory_godmother (Victory Recorder write — individual), family_victory_godmother (family-victory write — deferred to PRD-11B; routes safely with no-op until built), reveal_godmother (reveal trigger), custom_reward_godmother (custom-reward IOU). Open set; new godmothers can be added without modifying the connector layer itself.

**Godmother config.** Per-godmother-type configuration that lives in its own table (Path B from planning conversation). The contract points at a godmother config row when godmother-specific data is needed. Example: a contract routing to the reveal_godmother points at a `reward_reveal_attachments` row for the reveal-specific config (animation IDs, prize content, etc.). Naming convention for godmother config tables is a Pass 2 detail (likely `<name>_godmother_configs`, e.g., `reveal_godmother_configs`, `points_godmother_configs`).

**Inheritance.** The three-layer pattern that lets mom configure contracts at family-default, per-kid, or per-deed levels. A deed's effective contract set is the merge of family-default + kid-override + deed-override, with later layers overriding earlier ones.

**Deed firing mechanism.** The mechanism by which a deed notifies the connector layer that it fired. This is an architectural decision Phase 2 has to make concrete (synchronous direct dispatch, trigger-based, lightweight event bus, etc.). This doc names what fires; Phase 2 decides how.

**Polymorphic source addressing.** The pattern `(source_type TEXT, source_id UUID)` that lets a single contract point at any kind of deed. This pattern is already a de-facto convention in the existing codebase across `reward_reveal_attachments`, `earned_prizes`, `notifications`, `activity_log_entries`, `family_requests`, and `studio_queue` — this doc formalizes it as the connector layer's addressing standard.

## 5. Core Architectural Decisions (Already Settled)

These decisions were settled in pre-design conversation and ground-truth investigation. The remainder of this doc is built on them. Phase 1 may pressure-test details but does not re-litigate the decisions themselves without explicit founder direction.

1. **Strong composition.** Three-layer inheritance: family default → kid override → deed-level override.

2. **Multi-godmother fan-out per deed firing.** A single deed firing can invoke many godmothers at once, through many contracts wired to the same deed. This is the connector layer's primary design goal — without it, the layer would not justify its existence. Each matching contract fires its own godmother with its own payload at its own stroke_of, independently of other contracts wired to the same deed.

3. **Deeds decoupled from godmothers.** A deed doesn't know which godmothers respond to it. A godmother doesn't know which deeds fire it. The contract is the only thing that knows both.

4. **Path B chosen for table architecture.** A new dedicated `contracts` table is the central switchboard. Existing godmother-specific tables (e.g., `reward_reveal_attachments`) become godmother config tables that contracts point at when needed. The existing reveal infrastructure is reframed, not subsumed.

5. **Polymorphic source addressing standardized.** `(source_type, source_id)` is the universal way to identify a deed firing. This formalizes an existing de-facto pattern.

6. **Best Intentions are a deed primitive, not a special case.** Best Intentions can attach to any godmother through a contract, same as tasks or trackers. Today they have zero contracts wired; future configurations include the founder's spa-visit-after-50-eye-contact-taps example.

7. **family_victory_godmother routing is first-class in the model from v1, gracefully no-ops until PRD-11B is built.** The connector layer routes to it safely without errors when family victory infrastructure does not yet exist. Other not-yet-implemented godmothers follow the same pattern.

8. **`tasks.related_intention_id` is dead code.** Removed during connector build cleanup (Phase 3 hygiene scope).

9. **Above-threshold routing has three modes** (decorative recognition via victory_godmother, bonus to separate prize lane via points_godmother + prize_godmother, boost to allowance pool numerator via numerator_godmother). The fourth mode discussed in planning (mom-discretionary in-the-moment) is cut — adds workflow burden to mom that violates the design principle.

11. **allowance_godmother and numerator_godmother are separate primitives.** allowance_godmother handles binary contributions ("this task is worth 5% of the chore pool, completed or not"). numerator_godmother handles count-based contributions with a configurable required floor and above-floor behavior ("help mom with whatever she needs — 2x/day required; additional clicks act as numerator boost"). They look similar from a distance but the mechanics differ enough that they need separate godmothers, separate config, and separate evaluation logic.

12. **Multi-pool allowance is built into Phase 3 / Phase 3.5, not deferred.** The connector layer carries `pool_name` on allowance and numerator godmother configs from day one. The allowance system itself is restructured to compute per-pool percentages, per-pool bonuses, and optional rollup behavior. This expands Phase 3 scope significantly but matches the founder's real-world need (kids must do BOTH chores AND school; reading-all-day must not collapse the chores pool). Phase 3.5 is a tight follow-on to Phase 3, not a deferred build.

13. **Streak detection is a universal Lego helper, not connector-layer logic.** A streak helper takes `(source_type, source_id, family_member_id, day_definition)` and returns current/longest streak. The IF pattern `streak` calls the helper. Other consumers (dashboard widgets, gamification, Best Intentions analytics) call the same helper. One implementation, many consumers. Phase 3 builds the helper as part of supporting streak-pattern IFs.

10. **EARNINGS-PAGE and wizards are downstream.** Both become consumers of connector outputs; both wait for Phase 3 to ship before their own builds proceed.

## 6. Scope Boundaries

The connector layer does NOT cover, and this doc does not specify:

- **Reveal animation specifics.** Animation library, timing, visual treatment, sequence rendering — all PRD-24B territory. The connector layer specifies "fire the reveal_godmother with this attachment ID"; the reveal_godmother handles the rest.

- **Victory Recorder narrative generation.** The AI logic that turns a victory row into a celebration paragraph is PRD-11 territory. The connector layer specifies "fire the victory_godmother with these fields"; PRD-11 handles narrative.

- **Wizard design.** Studio Intelligence and the Wizard Library Taxonomy (Composition Architecture Part 3, pending) are downstream features. They use the connector layer as a write target — wizards generate contracts based on mom's natural-language description of what she wants. This doc specifies what contracts look like; wizards decide what contracts to generate.

- **EARNINGS-PAGE layout, components, or routing.** Downstream consumer surface. Built as queries against contract outputs, not a feature with new schema.

- **Specific gamification mechanics beyond the godmother receive signature.** Whether points convert at 1-per-task or 5-per-task, whether streaks have grace days, whether certain rewards auto-approve vs. require mom approval — all PRD-24 territory. The connector layer specifies "fire the points_godmother with this payload"; the points_godmother handles its own internal logic.

- **AI-cost optimization for downstream godmothers.** Each godmother manages its own AI usage if any. The connector layer fires godmothers and is not concerned with whether the godmother calls Haiku, embeds, or runs synchronously.

- **Family Victory Recorder feature build.** PRD-11B remains its own future build. The connector layer prepares the ground; PRD-11B fills in the destination.

- **Migration of existing partial systems.** Phase 2 plans the migration; Phase 3 executes. This doc specifies the target state, not the migration path.

The connector layer's job is narrow on purpose: route deeds to godmothers, with mom-configurable contracts and three-layer inheritance. Everything else is somebody else's job.

## 7. No Existing Users Yet — Design Freedom This Gives Us

MyAIM Family is in pre-beta. The only production family using the app today is the founder's own. There are no external users whose data, configurations, workflows, or expectations need to be preserved across this build.

This is load-bearing context for Phase 2 and Phase 3:

- **No backward-compatibility burden.** Tables can be renamed. Columns can be dropped. Schemas can be redesigned without migration paths that preserve existing user data. The only data to consider is the founder's own family, and the founder accepts that her family's data may need to be re-entered or migrated manually as a one-off.

- **No feature-flag rollouts.** New connector behavior can be released directly. There is no need to gate new functionality behind beta-cohort flags or to support both old and new pathways simultaneously while existing users transition.

- **No deprecation cycles.** Old code paths can be deleted, not deprecated. If Phase 3 replaces the four-hook fan-in pattern (Convention #198) with a deed-firing pattern, the old hooks can be removed entirely rather than maintained for compatibility.

- **No customer communication.** Schema changes, behavior changes, UI changes do not require release notes, migration guides, or user-facing communication. The founder will know what changed because she designed and approved the change.

- **Build prompts should not include backward-compatibility scaffolding.** A common failure mode in AI-assisted builds is to default to "preserve existing behavior, add new behavior alongside." That is wrong here. The right default is "design and build the correct architecture; replace whatever doesn't fit." Phase 2 and Phase 3 prompts should explicitly state this so Claude Code does not waste effort on unnecessary safety scaffolding.

This freedom does not mean carelessness. The founder's family is real. Her data is real. Her use of the app daily is real. Migrations should be done thoughtfully and with the founder's input on what to preserve. But the design space is fully open in a way that it will not be after beta.

When beta launches, this section becomes obsolete and should be deleted from this doc. Until then, it stays.

---

> **End of Pass 1.**
>
> Pass 2 begins below — the contract row itself.

---

## 8. The Contract Row — Field-by-Field

This section specifies what a single row in the `contracts` table contains. Each field has a purpose, a shape, and a rationale. Where Pass 2 needs to make a real design decision (rather than just describe the obvious), the decision is named explicitly with the chosen answer and the alternative that was rejected.

### 8.1 Identity and ownership

Every contract belongs to a family and was created by someone. These fields are uncontroversial:

- **`id` UUID PK** — primary key.
- **`family_id` UUID NOT NULL FK family_circles** — the family that owns this contract. Used by RLS.
- **`created_by` UUID FK family_members** — the family member (mom, dad, or other primary parent) who created this contract. For audit, not for permissions.
- **`created_at`, `updated_at` TIMESTAMPTZ** — standard.
- **`is_active` BOOLEAN DEFAULT true** — soft-pause without deleting. Lets mom turn off a contract temporarily (kid is sick this week, family is on vacation) without losing its configuration. Different from the `status` field in §8.9, which tracks the delete lifecycle. Mom uses `is_active` for "pause/resume," `status` for "delete/archive."

### 8.2 The deed end of the wire

A contract listens for one deed. The deed is identified polymorphically — the contract doesn't know what kind of deed it is at the schema level; it just knows the source type and ID.

- **`source_type` TEXT NOT NULL** — what kind of deed. Initial v1 values: `'task'`, `'best_intention'`, `'tracker_widget'`, `'list_item'`, `'routine_step'`, `'reading_progress'`, `'time_session'`. CHECK constraint enforces the valid set; new values added by migration when a new deed type is introduced.
- **`source_id` UUID NOT NULL** — the specific deed instance (a specific task, a specific Best Intention, a specific tracker widget, etc.).
- **`family_member_id` UUID NULL FK family_members** — the kid (or mom) the contract applies to. NULL means "all family members" at this level.

**Decision #1 (Pass 2): Polymorphic source addressing without a registry table.**

The source_type / source_id pattern is enforced by a CHECK constraint on source_type, not by a foreign key. There is no `deed_types` registry table. The valid set of source_type values is defined in code (a TypeScript enum + a SQL CHECK) and updated by migration when a new deed type is introduced.

**Why:** A registry table adds a join to every contract lookup and doesn't earn its keep — the valid set changes maybe once a year, not dynamically. Code-level enforcement (CHECK + enum) is simpler and faster.

**Alternative rejected:** A `deed_types` registry table with FK from `contracts.source_type`. Would let mom add new deed types from the UI without a migration. We don't need that flexibility — new deed types are a developer-level event.

### 8.3 The IF — qualification logic

The IF is what determines whether this contract applies when its deed fires. This is where the most variation happens between contracts. A contract for "every time" needs no logic. A contract for "every Nth time" needs N. A contract for "above a daily floor of 2" needs a floor and a window. A contract for "when the cumulative count crosses 50" needs a threshold and history awareness.

**Decision #2 (Pass 2): The IF is structured columns with named patterns, not free-form JSONB.**

Each IF takes one of a small set of named patterns. The pattern name lives in a column; the parameters for that pattern live in typed columns.

- **`if_pattern` TEXT NOT NULL** — which IF pattern this contract uses. Initial v1 set: `'every_time'`, `'every_nth'`, `'on_threshold_cross'`, `'above_daily_floor'`, `'above_window_floor'`, `'within_date_range'`, `'streak'`, `'calendar'`. CHECK constraint enforces the valid set.
- **`if_n` INTEGER NULL** — for `every_nth`: how many deed firings between contract triggers. For `on_threshold_cross`: the cumulative count threshold. For `streak`: the required consecutive-day count.
- **`if_floor` INTEGER NULL** — for `above_daily_floor` / `above_window_floor`: the required count below which this contract doesn't fire.
- **`if_window_kind` TEXT NULL** — for `above_window_floor`: `'day'`, `'week'`, `'month'`. (For `above_daily_floor`, the window is implicitly day.)
- **`if_window_starts_at`, `if_window_ends_at` TIMESTAMPTZ NULL** — for `within_date_range`: bounded date range during which the contract is active. Useful for short-term incentive programs ("for the month of June, every helping deed earns double points").
- **`if_calendar_pattern` JSONB NULL** — for `calendar`: which days/dates the contract qualifies on. Shape: `{kind: 'weekly', days: [0,2,4]}` for "every Sun/Tue/Thu", or `{kind: 'monthly_date', dates: [1, 15]}` for "first and fifteenth of each month", etc. The shape mirrors the patterns the Universal Scheduler already supports (PRD-35); the connector layer reads them but does not invoke Universal Scheduler — calendar evaluation is local to the IF check.

**Streak pattern requires a universal streak helper.** Phase 3 builds a `compute_streak(source_type, source_id, family_member_id, day_definition)` helper that returns `(current_streak, longest_streak, last_break_date)`. The IF qualification logic for `if_pattern='streak'` calls this helper. The helper is also reusable by dashboard widgets, gamification displays, Best Intentions analytics, and any other consumer that needs streak data — one implementation, many consumers (the Lego pattern).

**Why structured columns over JSONB:**
- Queryable. A query like "show me all contracts that fire above a daily floor of 2 or more" is a clean SQL filter, not a JSONB path query.
- Validatable. CHECK constraints can enforce that `if_pattern='every_nth'` requires `if_n IS NOT NULL`. JSONB makes that validation hard.
- Predictable. Mom's UI can render the right form fields based on the pattern name. JSONB schemas drift; column schemas don't.

**Alternative rejected:** A single `if_config JSONB` column. More flexible but harder to validate, harder to query, and easier to drift over time.

**Trade-off accepted:** Adding a new IF pattern requires a migration if it needs new parameter columns. That's fine — IF patterns are slow-changing infrastructure, not user-configurable values.

### 8.4 The godmother end of the wire

A contract routes to one godmother. The godmother is named polymorphically, same pattern as the deed.

- **`godmother_type` TEXT NOT NULL** — which godmother responds. Initial v1 set: `'allowance_godmother'`, `'numerator_godmother'`, `'money_godmother'`, `'points_godmother'`, `'prize_godmother'`, `'victory_godmother'`, `'family_victory_godmother'`, `'reveal_godmother'`, `'custom_reward_godmother'`. CHECK constraint enforces the valid set.
- **`godmother_config_id` UUID NULL** — for godmothers that need rich config (reveal_godmother needs animation IDs, prize content, etc.), this points at a row in a per-godmother config table. NULL for godmothers whose payload fits in inline columns.

**Decision #3 (Pass 2): Hybrid payload — inline columns for simple godmothers, godmother_config_id for rich config.**

Some godmothers need almost no per-contract config — the points_godmother just needs an integer ("how many points to grant"). The allowance_godmother needs a percentage. The custom_reward_godmother needs a text label and optional photo URL. These can live in inline columns on the contracts table.

Other godmothers need rich, structured config — the reveal_godmother needs animation IDs (potentially a list), prize content (text/image/randomizer), congratulations message ID, prize pool config, etc. These get their own godmother config table.

The contract row carries inline fields for the simple cases AND a nullable `godmother_config_id` for the rich cases. Each godmother documents which mode it uses.

**Inline payload columns:**
- **`payload_amount` NUMERIC NULL** — for godmothers that grant a numeric quantity (points, percentages, dollars). The unit is implicit from godmother_type.
- **`payload_text` TEXT NULL** — for godmothers that grant a text label (custom_reward_godmother).
- **`payload_image_url` TEXT NULL** — for godmothers that grant a custom-photo reward.

**Why hybrid over either pure approach:**
- Pure inline (every godmother stores its config in the same column set) breaks down for rich godmothers. The reveal_godmother's config doesn't fit in three columns.
- Pure config-table (every godmother gets its own config table, even simple ones) creates table proliferation and forces a join for every contract lookup, even when the payload is "1 point."

**Alternative rejected (pure JSONB payload):** A single `payload JSONB` column. Same critique as the IF — flexible but unvalidatable.

### 8.5 stroke_of — when the godmother grants

The stroke_of column says when the godmother actually fires its grant. For most contracts this will be `immediate`, meaning the moment the deed fires (and the IF qualifies). For some contracts — allowance week-close, end-of-month spa visit, end-of-day decorative summary — the grant is deferred.

- **`stroke_of` TEXT NOT NULL DEFAULT 'immediate'** — when the godmother grants. Initial v1 set: `'immediate'`, `'end_of_day'`, `'end_of_week'`, `'end_of_month'`, `'at_period_close'`, `'on_threshold_cross'`. CHECK constraint enforces the valid set.

**Decision #4 (Pass 2): on_threshold_cross is a stroke_of value, not just an IF pattern.**

There's overlap between `if_pattern='on_threshold_cross'` (the contract qualifies when cumulative count crosses N) and `stroke_of='on_threshold_cross'` (the grant fires when cumulative count crosses N). This is intentional. Most threshold-cross use cases want both — the contract should qualify AND fire at the same moment. But there's a real case where they're different: a contract might qualify continuously ("every time the deed fires") but only fire its grant at end-of-week, with the granted amount accumulating across the week. The two columns let those cases be expressed cleanly.

**Why deferred stroke_of values matter:** Without them, allowance can't work. The allowance system today batches contributions into a weekly period and pays out at week-close. The connector layer has to support that pattern, otherwise allowance can't be modeled as a godmother. Building deferred stroke_of into the model from day one is much cheaper than retrofitting it later.

**Pass 2 design question still open: how does deferred stroke_of actually fire?** The answer involves either (a) cron-driven sweeps that look for contracts due to fire ("every hour, find contracts with stroke_of='end_of_day' and grant pending payloads"), or (b) per-stroke_of-type fire mechanisms (the existing `calculate-allowance-period` Edge Function is exactly this for `at_period_close`). This is a Phase 2 implementation question, not a Phase 1 schema question — but the schema needs to support whichever Phase 2 picks.

**Existing infrastructure to use:** `pg_cron + util.invoke_edge_function(...)` is the established pattern for scheduled firing in this codebase, currently shipping for allowance period close. Phase 3 will use this same pattern for non-allowance deferred stroke_of values rather than introducing a new event bus or queue.

**Implementation concerns deferred stroke_of values must honor:**

- **Family timezone, not server UTC.** "End of day" means end of day in the family's configured timezone (existing pattern: per-family `timezone` column on `family_circles`, per-child `calculation_time` window on `allowance_configs`). Phase 3 cannot assume UTC.
- **Idempotency.** Cron firing twice (e.g., a retry) must not double-grant. Existing pattern: idempotency key on the source event ID + period ID, partial unique index enforces it. Phase 3 inherits this pattern.
- **Grace handling.** If a contract has `stroke_of='end_of_week'` and mom marked Friday as a grace day, does the contract still fire? Answer must align with how the underlying allowance / pool / deed treats grace days. Phase 2 should specify per stroke_of value how grace interacts.
- **ISO date semantics.** Date math at period boundaries has been a source of bugs in the existing allowance system (per ground truth). Phase 3 must use the established ISO-aware helpers, not naive `Date()` math.

### 8.6 The inheritance lane

Contracts live at one of three inheritance levels: family-default, kid-override, or deed-override. The level determines how the contract is found and merged with others.

- **`inheritance_level` TEXT NOT NULL** — `'family_default'`, `'kid_override'`, or `'deed_override'`. CHECK constraint enforces the valid set.

**Decision #5 (Pass 2): Inheritance is a column on the contract, not separate tables.**

Contracts at different inheritance levels live in the same `contracts` table, distinguished by the `inheritance_level` column. A family-default contract has `family_member_id` NULL and `source_id` NULL (or a special marker — see below). A kid-override has `family_member_id` set and `source_id` NULL. A deed-override has both set.

**Why one table over three:**
- Queries that resolve a deed's effective contract set are simpler. One table to query, with a WHERE clause that filters by inheritance level and merges results.
- Renames and schema changes happen in one place.
- Indexes and RLS policies are defined once.

**Alternative rejected:** Separate tables (`family_default_contracts`, `kid_override_contracts`, `deed_override_contracts`). Cleaner conceptually but requires three-way unions for every resolution query.

**Pass 2 design question still open: how does family-default work when source_id can't be NULL?**

The schema constraint above says `source_id UUID NOT NULL`. But a family-default contract by definition isn't tied to a specific deed — it's a default that applies to every deed of a given source_type for a given family. There are two ways to handle this:

- **Option A:** `source_id` is nullable. NULL at the family-default and kid-override levels means "applies to all deeds of this source_type." A CHECK constraint enforces that source_id is non-NULL at the deed-override level only.
- **Option B:** `source_id` is always non-NULL but family-default and kid-override contracts use a sentinel UUID like `'00000000-0000-0000-0000-000000000000'` to mean "all deeds of this source_type." Avoids nullable FKs but introduces a magic value.

I lean **Option A.** Nullable source_id is more honest about what's happening — there's nothing being addressed. Sentinel values are clever but invite bugs when someone forgets the convention.

### 8.7 Multi-godmother fan-out — how it works mechanically

When Maya completes a task, the connector layer:

1. Identifies the deed: `(source_type='task', source_id=<task-id>, family_member_id=<maya>)`.
2. Loads all contracts that match this deed across all three inheritance levels:
   - Family-default contracts: `WHERE source_type='task' AND family_member_id IS NULL AND source_id IS NULL`
   - Kid-override contracts: `WHERE source_type='task' AND family_member_id=<maya> AND source_id IS NULL`
   - Deed-override contracts: `WHERE source_type='task' AND source_id=<task-id> AND (family_member_id=<maya> OR family_member_id IS NULL)`
3. Merges them per the inheritance rules (deed-override wins over kid-override wins over family-default *for the same godmother_type*; different godmother_types stack).
4. For each surviving contract, evaluates the IF. Contracts whose IF fails are skipped.
5. For contracts whose IF passes, dispatches to the godmother — either immediately (`stroke_of='immediate'`) or by writing a pending grant record for later firing (deferred stroke_of values).

**Decision #6 (Pass 2): Inheritance merges by godmother_type, not by contract identity.**

If mom sets a family-default "every task earns 1 point" (points_godmother) and overrides at the kid level "Maya's tasks earn 2 points" (points_godmother), Maya's tasks get 2 points (kid override wins for that godmother_type). Mom does NOT also get 1 point from the family-default contract — overrides replace, they don't add.

But if mom sets a family-default "every task earns 1 point" (points_godmother) and adds a kid-level "Maya's tasks also fire a victory" (victory_godmother), Maya's tasks fire BOTH — 1 point AND a victory — because they're different godmother_types.

This is the natural mom-mental-model interpretation: "I've set a default, and I'm changing how this one godmother behaves for this kid" replaces the default for that godmother. "I'm adding another godmother" stacks on top. The merge logic enforces this.

**Pass 2 design question still open: does deed-override completely replace kid-override AND family-default for that godmother_type, or does it merge field-by-field?**

I lean **complete replacement.** A deed-level contract is mom saying "for this specific deed, this godmother behaves like this." She's not saying "tweak one field of the kid-level config." Field-by-field merge is more flexible but harder to predict from the UI. Complete replacement is what the homeschool_configs pattern does (Convention #226) and it works well there.

### 8.8 Indexes and uniqueness

Pass 2 names the indexes the contracts table needs; Phase 3 builds them. Subject to refinement once query patterns are concrete.

- **Lookup by deed:** `(source_type, source_id, family_member_id) WHERE is_active=true AND status='active'` — for the per-deed contract resolution query in §8.7.
- **Lookup by family default:** `(family_id, source_type, godmother_type, inheritance_level) WHERE inheritance_level='family_default' AND is_active=true AND status='active'` — for resolving family defaults.
- **Lookup by kid:** `(family_member_id, source_type, godmother_type, inheritance_level) WHERE inheritance_level='kid_override' AND is_active=true AND status='active'` — for resolving kid overrides.

**Uniqueness constraints:**
- One family-default contract per `(family_id, source_type, godmother_type)`. A family can't have two contradictory defaults for the same godmother on the same source_type.
- One kid-override contract per `(family_member_id, source_type, godmother_type)`. Same logic at the kid level.
- One deed-override contract per `(source_id, family_member_id, godmother_type)`. Same logic at the deed level.

These are partial unique indexes filtered on `status='active'` so deleted/archived contracts don't conflict with active ones. Paused contracts (is_active=false) DO still hold the unique slot — pausing doesn't free the slot for a different contract; mom must delete to free it.

### 8.9 The contract lifecycle

**Plain English first.** Mom creates contracts, edits them, and sometimes deletes them. Most moms won't want their dashboards cluttered with old contracts they're no longer using. So when mom deletes a contract, it doesn't disappear immediately — it goes into a "recently deleted" state for 48 hours, in case she made a mistake and wants to bring it back. After 48 hours, it disappears from her active dashboard but is archived (kept in the database) in case she wants to refer to it later or recreate something similar. Mom can also choose to archive it immediately if she's sure she won't want to undo, or restore from archive if she wants to bring something back from the dead.

**What this means for mom.** Three states she can put a contract in:
- **Active** — it's running, magic happens when its deed fires.
- **Recently Deleted** — invisible from her main dashboard but recoverable for 48 hours.
- **Archived** — fully retired; doesn't fire anymore, but still searchable in an "old contracts" view if she wants to revive or reference it.

She can move contracts between these states from her own UI. There's no "permanent delete" in normal operation — that only happens during developer cleanup of the founder's pre-beta data.

**Schema implementation.**

- **`status` TEXT NOT NULL DEFAULT 'active'** — `'active'`, `'recently_deleted'`, `'archived'`. CHECK constraint enforces the valid set.
- **`deleted_at` TIMESTAMPTZ NULL** — set when status moves to `'recently_deleted'`. A scheduled job (cron, see §8.5 firing notes) sweeps daily to move records from `'recently_deleted'` to `'archived'` once `deleted_at` is more than 48 hours ago.
- **`archived_at` TIMESTAMPTZ NULL** — set when status moves to `'archived'`. Records remain in the table indefinitely; they're filtered out of active queries via `WHERE status = 'active'`.

When a contract is edited, the edit is in-place — no version history. Pass 2 does not specify versioning because the founder has not asked for it. If versioning becomes desirable later (audit trail, undo, "show me what this contract looked like last month"), it can be added as a sibling `contract_history` table.

**Hard delete is for developer use only.** Phase 3 schema migrations or explicit pre-beta cleanup may hard-delete rows. Normal mom-facing operation goes through the three-state lifecycle above.

### 8.10 Multi-pool support — what contracts can express, what the allowance system needs to restructure

**Plain English first.** You want to track chores compliance separately from school compliance, with both rolling up into the kid's weekly allowance payout. Different parents could pay different amounts per pool, or have different schedules per pool (homework on a term basis, chores weekly). Mom should be able to see compliance percentages on each task's title card (showing this task's contribution to its pool), each routine's title card (showing this routine's contribution), the pool itself (overall percentage for the chosen timeframe — day / week / term), and the allowance tracker widget (configurable to show whichever pools mom wants).

**What's possible today vs. what needs to be built.** The contracts table can already say "this task routes to the chores pool" or "this task routes to the school pool" by carrying a `pool_name` on its allowance_godmother or numerator_godmother config. That part is clean. **But the allowance system today is single-pool** — it knows how to compute one percentage per kid, not multiple. Per ground truth (Q0 of CONNECTOR_GROUND_TRUTH_2026-04-25.md):

- `allowance_configs` has UNIQUE on `family_member_id` (one config per kid).
- The `calculate_allowance_progress` RPC accumulators (`v_total_assigned`, `v_total_completed`, etc.) are scalar singletons.
- The RPC RETURNS TABLE is a 20-column flat shape, not per-pool.
- Bonus columns (`bonus_threshold`, `bonus_percentage`, `bonus_flat_amount`, `bonus_type`) are scalars on `allowance_configs`.
- The widget reads ONE `completion_percentage`. Period close writes ONE `financial_transaction`.

**Phase 3 / Phase 3.5 split.** Founder direction (2026-04-25): build it architecturally correct, not phased. Two coherent commits:

- **Phase 3:** Contracts table ships with multi-pool *expression*. `pool_name` is a real field on godmother configs. Mom can configure contracts that name different pools. Visual verification: contracts can be created naming chores, school, or any pool name mom invents.
- **Phase 3.5:** Allowance system restructured for multi-pool *computation*. `allowance_pools` table created (or equivalent JSONB shape on `allowance_configs`). RPC restructured to compute per-pool. Bonus columns become per-pool. Period close writes per-pool transactions. Widget renders multiple pool percentages plus optional rollup.

These are separate commits but Phase 3.5 is a tight follow-on, not a deferred build. The two together represent the full multi-pool capability.

**Pool configuration shape (Phase 2 will detail).** Each pool has:
- A name (mom-defined: "chores," "school," "homework_term," etc.).
- A weekly amount (or term amount, semester amount, etc.).
- A bonus threshold and bonus amount/percentage.
- A calculation approach (the fixed/dynamic/points_weighted choice — see §13 hygiene note about these being identical in current code).
- A payout schedule (how often it pays out — weekly, biweekly, monthly, term).
- An optional **rollup target**: if this pool rolls up into another pool's percentage rather than paying out independently, name the parent pool. Mom's chore pool and school pool might both roll up into a "weekly allowance" pool that pays out the actual money based on combined compliance.

The rollup mechanic is what makes the founder's real-world model work: separate accountability per pool ("kids must do BOTH chores AND school"), but combined payout ("one weekly check based on combined compliance").

**Surfacing pool percentages in the UI (Phase 3.5 scope):**
- Each task and routine title card shows that item's contribution to its pool (e.g., "5% of chores pool").
- Each pool gets its own percentage display, scoped to a timeframe mom chooses (day / week / term / etc.).
- The allowance tracker widget becomes pool-aware: mom configures which pools it displays. Could show one pool, several pools, or a rolled-up total — mom's choice.

**What this means for mom.** When this is built, mom can set up her chores pool and her school pool separately. She'll see per-pool percentages on the dashboard ("chores: 67%, school: 53%"). When she configures the allowance tracker, she picks which pools to show. At week close, the system pays out based on however she configured the rollup — separately per pool, or combined into a weekly total. The kid can't gam the system by reading all day and skipping chores, because reading credits go to the school pool only.

### 8.11 Time-attached deeds (time_session deed type)

`time_session` is a deed type. When a Universal Timer session ends with a `task_id` (or other source) attached, the connector layer treats the session-end as a deed firing. The deed's identity is `(source_type='time_session', source_id=time_session.id)`.

**The deed fires; consumers may not yet listen.** The connector layer supports `time_session` deeds at v1. But the godmothers that would meaningfully consume them — particularly an IF that says "minutes accumulated above 60 this week" — require infrastructure that doesn't exist yet (`calculate_allowance_progress` does not read `time_sessions` today). Phase 3 will support `time_session` as a deed type but full end-to-end integration ("piano practice minutes contribute to the school pool") is deferred to the wizard library / reading log work.

**Founder fallback (until tracker integration ships):** If mom has a routine step like "practice piano 30 min daily," the kid can mark it complete when they hit the daily target (analog tracking outside the app, or via the Universal Timer's standalone mode). The contract on that routine step fires normally. When the tracker eventually ships and is wired to auto-mark the routine step at the daily target threshold, no connector changes are needed — the same contract continues to fire from the same routine_step deed.

---

## 9. Godmother Dispatch Contract

**Plain English first.** This section is about what every godmother has to be able to do. Think of it like an interview with a fairy godmother — to be qualified for the job, every godmother has to know how to: receive an order, do the magic, and report back what she did. The rules in this section describe the standard interview every godmother passes before she's allowed to grant anything in the system.

**Why this matters for mom.** Mom doesn't see this directly. But because every godmother follows the same standard, when a new godmother gets added later (a new kind of magic), mom doesn't have to learn anything new. The new one fits into the same pattern. Configuration screens, dashboards, and wizards already know how to talk to godmothers, so a new one slots in cleanly.

**Why this matters for the build.** When Phase 3 builds the dispatch logic, every godmother written has to follow this same shape. That makes the dispatch code simple — it doesn't need special cases per godmother. Every godmother gets the same inputs and returns the same shape of result. That uniformity is what makes the system extensible without breaking.

This section specifies the interface every godmother must implement. When a contract qualifies and its stroke_of fires, the dispatch logic hands the deed firing data to the godmother and the godmother does its thing. The contract between dispatch logic and godmother is what this section defines.

### 9.1 What every godmother must do

When a godmother is invoked, the connector layer hands it the following inputs:

- **`contract_id`** — the contract row that triggered this invocation.
- **`deed_firing`** — `(source_type, source_id, family_id, family_member_id, fired_at)` — the deed that fired.
- **`payload`** — the contract's payload data (inline columns and/or godmother config row reference, per §8.4's hybrid pattern).
- **`stroke_of`** — the stroke_of that triggered this invocation (for godmothers that behave differently for immediate vs. deferred firings).

The godmother performs its grant — writes to its own data store, fires its own side effects — and returns:

- **`status`** — `'granted'`, `'no_op'`, `'failed'`, `'deferred'`.
- **`grant_reference`** (when `status='granted'`) — an ID or reference to the thing that was created (e.g., the financial_transactions row ID for allowance, the victories row ID for victory_godmother, the earned_prizes row ID for prize_godmother).
- **`error_message`** (when `status='failed'`) — human-readable description of what failed.
- **`metadata`** (optional JSONB) — godmother-specific data the connector layer should log but not interpret.

### 9.2 Status semantics

- **`granted`** — the godmother did its job and produced an artifact. The connector layer logs success and moves on.
- **`no_op`** — the godmother chose not to grant. Examples: family_victory_godmother when PRD-11B isn't built yet, points_godmother when gamification is disabled for this family. This is not an error — it's an expected outcome. The connector layer logs the no-op for diagnosis but does not retry or alert.
- **`failed`** — the godmother tried to grant and something went wrong (database error, missing config, etc.). The connector layer logs the failure with the error message. Phase 2 decides retry semantics — likely no automatic retry for v1; mom-visible error surface in v2.
- **`deferred`** — the godmother accepted the deed but won't grant immediately. Used by godmothers that batch (e.g., allowance_godmother accepting a deed during the week, granting at period close). The connector layer logs the deferred acceptance; the godmother is responsible for completing the grant later via its own scheduled mechanism.

### 9.3 Not-yet-implemented godmothers

Some godmothers are first-class in the model but not yet built (family_victory_godmother is the v1 example — PRD-11B is not built). The connector layer must route to them safely.

The contract for a not-yet-implemented godmother:

- The godmother registers itself as `'not_yet_implemented'` at the connector layer (a registration record or a code-level enum value).
- When invoked, it returns `status='no_op'` with metadata `{reason: 'not_yet_implemented', expected_in: 'PRD-11B'}`.
- The connector layer logs the no-op. Mom does not see an error.
- When the godmother is eventually built, the registration changes from `'not_yet_implemented'` to `'active'`. Existing contracts wired to it begin firing without any change to the contracts themselves.

**This is the "graceful no-op" pattern.** It lets mom configure contracts today against godmothers that don't yet exist, and those contracts start working the moment the godmother ships. No retrofit, no migration, no discovery of orphaned contracts.

### 9.4 Godmother registration

Phase 3 builds a code-level registry of godmothers. Each godmother registers:

- Its `godmother_type` string (matches the contracts.godmother_type CHECK enum).
- Its dispatch function (the function the connector layer calls when invoking).
- Its config table (if it uses a godmother config table per §8.4).
- Its current status (`'active'`, `'not_yet_implemented'`, `'disabled'`).
- Optional: its config validation function (called when mom creates a contract, to validate the payload before write).

The registry is code-level, not database-level. Adding a new godmother type means: write the godmother's dispatch function, register it, add its godmother_type to the CHECK enum via migration. No mom-facing UI to add godmothers; this is developer infrastructure.

### 9.5 Godmother configs — when and why they exist

Per §8.4, the contract row carries inline payload columns for simple godmothers (`payload_amount`, `payload_text`, `payload_image_url`) AND a nullable `godmother_config_id` for godmothers that need rich config.

**When a godmother needs a config table:**

- Its payload doesn't fit inline (e.g., reveal_godmother needs animation IDs as an array, prize content with multiple variants, congratulations message reference).
- Its config is reusable across contracts (e.g., a single reveal config attached to many tasks).
- Its config has its own lifecycle (e.g., mom edits the prize content; all attached contracts pick up the change).

**When inline payload is enough:**

- Single scalar value: `payload_amount=1` for points, `payload_amount=5` for percentages, `payload_text='spa visit'` for custom rewards.
- No reuse: every contract has its own value.
- No independent lifecycle.

**Config tables follow a naming pattern.** Each godmother that needs a config table gets one named `<godmother>_godmother_configs` (without the `_godmother` redundancy where it reads cleaner — Phase 2 may refine). Examples:
- `reveal_godmother_configs` (or reuse existing `reward_reveal_attachments` per §5 decision #4)
- `allowance_godmother_configs` (would carry pool_name, weight, etc.)
- `numerator_godmother_configs` (would carry pool_name, required_count, required_period, above_floor_behavior)

**Pre-existing godmother configs.** `reward_reveal_attachments` already exists in the schema and was built for exactly the reveal-godmother case (§5 decision #4). Phase 3 reuses it as `reveal_godmother`'s config table. This is one of the few places the connector build benefits from existing infrastructure rather than starting fresh.

### 9.6 Concrete dispatch examples

**Plain English first.** This section walks through three real-life moments — Maya doing her dishes, Maya going above and beyond on helping with the baby, and mom's spa-visit Best Intention — and shows what the system does behind the scenes when each happens. If any of these stories doesn't match what you'd want the system to do, that's a flag the architecture is wrong somewhere and we should fix it before going further. Each example is told as a story first, then shown technically.

---

**Example A: Maya does her dishes.**

*The story.* Maya washes the dishes. She marks the task complete on her tablet. Three things happen at once, automatically:

1. The dishes task adds 5% to her **chores pool** for the week — but the system doesn't pay it out yet; it just adds to her running tally. At the end of the week, when her allowance is calculated, this 5% will be part of what determines her payout.
2. A **victory** gets quietly written to her Victory Recorder: "Maya did her dishes." Mom can see this later when she reviews victories or when she reads Maya's weekly summary.
3. A **reveal animation** plays on Maya's screen — maybe a sticker, maybe a creature, depending on what mom configured for the dishes task. Maya sees the magic immediately.

Mom set all this up by creating three separate contracts on the dishes task. She didn't have to think "and now wire allowance, AND wire victories, AND wire animations" — she just clicked some options when she made the task, and the system created the three contracts. From Maya's perspective, dishes done = magic happens.

*Technically.*

1. Task completion writes a `task_completions` row.
2. The dispatch logic detects the deed firing: `(source_type='task', source_id=<dishes-task-id>, family_member_id=<maya>)`.
3. Loads matching contracts. Finds three:
   - Contract 1: allowance_godmother, pool_name='chores', payload_amount=5, if_pattern='every_time', stroke_of='at_period_close'.
   - Contract 2: victory_godmother, payload_text='Did her dishes', if_pattern='every_time', stroke_of='immediate'.
   - Contract 3: reveal_godmother, godmother_config_id=<reveal-config>, if_pattern='every_time', stroke_of='immediate'.
4. Evaluates each IF: all three are `every_time`, all qualify.
5. Dispatches:
   - Contract 1 → allowance_godmother. stroke_of='at_period_close', so godmother returns `status='deferred'` with metadata noting the contribution is queued for week close.
   - Contract 2 → victory_godmother. Returns `status='granted', grant_reference=<victories-row-id>`.
   - Contract 3 → reveal_godmother. Returns `status='granted', grant_reference=<reveal-fire-event-id>`.
6. Dispatch logic logs the three results. Mom and Maya see the immediate effects (victory recorded, reveal animated). Allowance contribution accumulates silently for week-close payout.

---

**Example B: Maya goes above and beyond helping with the baby.**

*The story.* Mom set up a "help with the baby" task with a required floor of 2 times per day. Maya helps once. Maya helps twice — she's hit her required count for the day, and that contributes to her chores pool normally. Then Maya helps a third time, just because. Two new things happen:

1. That third help **boosts her chores pool numerator** — meaning her percentage goes up beyond what the requirement alone would have given her. It's like extra credit within her chores pool.
2. The system writes a **special victory**: "Maya went above and beyond helping today." Not a generic "Maya helped with the baby" — specifically a recognition that she did MORE than was asked. Mom sees this when she reviews victories. It's the system noticing her character, automatically.

Mom didn't have to be there to notice. Mom didn't have to write down "Maya helped extra today." The system saw it, recorded it, and gave her credit for it.

*Technically.*

1. Maya completes "help mom" task for the third time today.
2. Dispatch logic detects the deed firing.
3. Loads matching contracts. Finds two:
   - Contract 1: numerator_godmother, pool_name='chores', payload_amount=1 (per completion), required_count=2, required_period='day', above_floor_behavior='add_to_pool_numerator', if_pattern='every_time', stroke_of='immediate'.
   - Contract 2: victory_godmother, payload_text='Went above and beyond helping today', if_pattern='above_daily_floor', if_floor=2, stroke_of='immediate'.
4. Evaluates each IF:
   - Contract 1's IF is `every_time` — qualifies.
   - Contract 2's IF is `above_daily_floor` with floor=2 — checks count of today's completions of this task; count is 3 (this is the 3rd), which is above 2 — qualifies.
5. Dispatches:
   - Contract 1 → numerator_godmother. The godmother increments the chores pool numerator. For the first 2 of today, it would have credited the required floor; for this 3rd, the above_floor_behavior='add_to_pool_numerator' means it adds to the numerator as a boost. Returns `status='granted', metadata={pool_contribution: 1, was_above_floor: true}`.
   - Contract 2 → victory_godmother. Writes a victory: "Maya went above and beyond helping today." Returns `status='granted', grant_reference=<victories-row-id>`.

---

**Example C: Mom's own spa-visit Best Intention.**

*The story.* Mom set up a Best Intention for herself: "remember to look in my daughter's eyes when she talks." She also set up a contract on that Best Intention that says: when she's tapped this 50 times, give herself a spa visit.

She taps it a few times a day for several weeks. Eventually, on the 50th tap, an IOU appears on her own dashboard: "Spa visit." That's it. The system noticed she hit 50, knew that triggered the spa-visit contract, and created the IOU. Now she has to actually go book the spa visit (the system doesn't book it for her), but she's earned it and it's recorded.

This is the example that shows Best Intentions can attach to anything. They're not just decoration. Mom's intention to be present with her daughter has a real-world reward she promised herself, and the system delivered on it without her having to remember "when did I hit 50?"

*Technically.*

1. Mom taps her Best Intention for the 50th time this month.
2. Dispatch logic detects the deed firing: `(source_type='best_intention', source_id=<intention-id>, family_member_id=<mom>)`.
3. Loads matching contracts. Finds one:
   - Contract: custom_reward_godmother, payload_text='spa visit', if_pattern='on_threshold_cross', if_n=50, stroke_of='immediate'.
4. Evaluates IF: `on_threshold_cross` with N=50 — checks cumulative count of this Best Intention's iterations for this month (or all-time, depending on `if_window_kind`); the count just crossed 50 — qualifies.
5. Dispatches to custom_reward_godmother. Godmother creates an IOU row in `earned_prizes` (or its own custom_rewards table — Phase 2 detail). Returns `status='granted', grant_reference=<iou-row-id>`.
6. Mom sees the spa-visit IOU on her own dashboard.

---

These three examples cover the core mechanics: deferred allowance (Example A), above-floor numerator boost + recognition (Example B), and Best-Intention-as-deed routing to a custom reward (Example C). If all three stories match how you'd want the system to behave, the architecture is sound. If any feels wrong, that's where to push back.

---

> **End of Pass 2.**
>
> Pass 3 will define the v1 deed and godmother sets in detail — for each deed, what triggers a firing and what data is in the firing; for each godmother, what its dispatch function does, what it writes to, and what config it requires.

---

## 13. Adjacent Hygiene Findings — For Phase 2 Triage

The Phase 1 ground-truth investigation surfaced three hygiene findings that are not direct connector-layer work but that Phase 2 should know about when planning the multi-pool restructuring and the audit fold-in. These are not bugs to fix in Phase 3 unless they intersect with connector work.

### 13.1 `calculation_approach='fixed'` and `'dynamic'` are mathematically identical

The PRD describes three calculation approaches (Fixed Template, Dynamic Pool, Points-Weighted). The live RPC code branches only on `'points_weighted'`; both `'fixed'` and `'dynamic'` fall through the same `ELSE` path producing identical math. Mom's UI choice between Fixed and Dynamic is currently cosmetic.

**Connector relevance:** When Phase 3.5 restructures the allowance system for multi-pool, the per-pool `calculation_approach` field needs deliberate handling. If `'fixed'` is meant to behave differently (mom locks the pool to a template), Phase 3.5 either implements the difference or deprecates the redundant value. Decision punted to Phase 2.

### 13.2 `task_categories JSONB` on `allowance_configs` is specced but ignored by the RPC

PRD-28 §674 specifies that the `task_categories` JSONB column on `allowance_configs` filters which task tag categories count toward this kid's allowance. The column exists in the live schema. The RPC ignores it entirely.

**Connector relevance:** Once multi-pool is real, `task_categories` becomes vestigial — pool membership becomes the new way mom controls "what counts." Phase 3.5 likely deprecates or repurposes this column. Phase 2 should decide whether to migrate `task_categories` data to pool memberships (probably none in the founder's family today) or simply remove the column.

### 13.3 PRD-10's "task completion → widget data point" trigger is not wired

PRD-10 §995 specifies that task completions should auto-insert into `widget_data_points` for linked widgets (via `data_source_ids`). This trigger is not built. Widget data points exist as a table; the wiring from task completion to widget data point creation is missing.

**Connector relevance:** When the connector layer adds `tracker_widget` and `widget_data_point` as deed types (already in the v1 deed set per §4), the underlying mechanism for getting data into widgets needs to exist. Phase 2 should determine whether the PRD-10 trigger is in scope for Phase 3 (likely yes, as a prerequisite for tracker_widget deed firings) or remains separate.
