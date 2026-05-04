# Phase 3 — Worker A+B Dispatch Prompt (Paste-Ready)

> Paste this entire prompt into a fresh Claude Code session.
> This worker ships sub-tasks 1-6: schema + infrastructure for the connector layer.

---

## Context Briefing

You are Worker A+B for Phase 3 of the Connector Architecture build for MyAIM Family. You ship the foundational schema and dispatch infrastructure that all subsequent workers build on top of.

**Your scope (sub-tasks 1-6):**
1. Schema: `contracts` table
2. Schema: `deed_firings` table — confirm or extend
3. Schema: godmother config tables
4. Schema: streak helper RPC
5. Cron infrastructure for deferred `stroke_of`
6. Godmother dispatch infrastructure

**Plus one preparatory refactor (founder-approved):**
- Extract `rollGamificationForCompletion` from 3 duplicated files into a shared utility. Workers C and D will work against this shared utility when replacing direct RPC calls with deed firings.

---

## Required Reading (In Order — Read ALL Before Writing Code)

1. `claude/PRE_BUILD_PROCESS.md` — **MANDATORY.** Follow the full pre-build ritual. This build touches reward/allowance infrastructure referenced by multiple PRDs. The addenda grep is especially important.
2. `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — Authoritative build plan. Your sub-tasks are §6.2 items 1-6.
3. `claude/web-sync/Connector-Architecture-and-Routing-Model.md` — Phase 1 design. Vocabulary, schema decisions, contract row field-by-field.
4. `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — Existing reward infrastructure forensic report.
5. `claude/web-sync/CONNECTOR_GROUND_TRUTH_2026-04-25.md` — Existing connector infrastructure forensic report.
6. `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md` — Cross-cutting principles. Especially §2.10 (locked source_type strings).
7. `.claude/state/phase3-investigation-dispatch.md` — The 16 investigation prompts (for context on what was asked).
8. `claude/live_schema.md` — Current database schema.

---

## Investigation Results (Pre-Digested Decisions)

These are the founder-approved answers from the 16 pre-build investigations. Use them directly — do not re-investigate.

### INV 1 — Godmother scope estimates
- 3 thin wrappers (victory, numerator dispatch, family_victory no-op)
- 3 moderate refactors (allowance, money, points)
- 3 new code (prize IOU surface, custom_reward delivery, assign_task)
- `reward_reveals` infrastructure (5 tables, 601 lines of hooks/modal/library) is built but has zero consumers — Phase 3 wires it

### INV 2 — task_rewards
- Only `reward_type='money'` path is consumed (by `awardOpportunityEarning`)
- `privilege` and `custom` reward types are write-only dead ends
- Phase 3 replaces this with contracts. Keep rows for audit trail. Do NOT drop the table in this worker — Worker F handles cutover.

### INV 4 — Polymorphic source_type
- No CHECK constraint conflicts with v1 source_types
- `deed_firings` table (Worker 5) intentionally deferred its CHECK constraint for Phase 3 to add
- `reward_reveal_attachments.source_type` uses entity names (task, widget, list, intention) — these are CORRECT and stay as-is. They answer "what entity is this reveal attached to?" The connector layer's verb-form names (task_completion, widget_data_point) answer "what event just happened?" These are different concepts, both legitimate. The prize godmother bridges them at dispatch time. NO migration needed on reward_reveal_attachments.

### INV 6 — Color reveal extension (APPROVED: Polymorphic — clean rewire)
- Replace `member_coloring_reveals.earning_task_id` FK with `(earning_source_type TEXT, earning_source_id UUID)`
- Zero rows in production — zero-risk migration
- 3 RPC locations to update (all in `roll_creature_for_completion`)
- 1 frontend mutation to update (`useCreateColoringReveal`)
- **Do this in sub-task 2 or 3** (schema change, prerequisite for coloring reveal godmother in Worker D)
- Founder vision: coloring reveals, creature rolls, points, and all gamification pieces should be independently wirable to ANY deed — not locked to task completions. The polymorphic rewire is step one of making the entire gamification system deed-source-agnostic.

### INV 7 — Cron slots (APPROVED)
- :25 — `contract-week-end-sweep` (weekly, for `stroke_of='end_of_week'`)
- :30 — `contract-lifecycle-sweep` (hourly, `recently_deleted` → `archived` after 48h)
- Extend :20 `fire-painted-schedules` to also check `stroke_of='end_of_day'` and `stroke_of='at_specific_time'` contracts
- `stroke_of='custom'` routes through Universal Scheduler recurrence_details — no separate cron

### INV 8 — fixed vs dynamic (APPROVED: Collapse, forward-facing)
- Deprecate `fixed`. Keep `dynamic` and `points_weighted` as the two real approaches.
- Migrate any existing `fixed` configs to `dynamic` in your migration.
- CHECK constraint on `allowance_configs.calculation_approach` should be updated to `('dynamic', 'points_weighted')`.
- **Forward-facing note:** Phase 3.5 pool schema should include room for a `task_count_mode` field (e.g., 'live' | 'snapshot_at_period_start') so "locked denominator" behavior can be added later without schema migration. Don't build the logic — just don't close the door.

### INV 10 — Painter/deferred firing strategy (APPROVED)
- Keep `fire-painted-schedules` focused on deed-firing writes (event source)
- Phase 3 adds a SEPARATE contract-evaluation Edge Function for deferred stroke_of values
- Separation of concerns: painter fires events → contract evaluator decides what to do

### INV 14 — Verification strategy (APPROVED with lighter scope)
- Feature flag: `families.allowance_dispatch_via` column for instant rollback
- `allowance_dispatch_audit` table for dual-logging (low cost, build it)
- Hourly discrepancy cron: nice-to-have, build if low effort, skip if adds scope
- Migration-time exact match: compare 5 fields (completion_percentage, calculated_amount, bonus_applied, bonus_amount, total_earned) — zero tolerance

---

## Gamification Impact Plan (Founder Must Approve Before Code)

Phase 3 decomposes the current gamification pipeline (`roll_creature_for_completion`) into independent, separately-wirable pieces. This is the architectural change that enables mom to decide what earns what — mixing and matching rewards freely.

**What STAYS UNTOUCHED (visual/rendering layer):**
- Creature library (161 creatures, woodland felt theme)
- Sticker pages (26 pages with scenes/seasons)
- Creature reveal animations (Mossy Chest video)
- Page unlock animations (Fairy Door video)
- Treasure box reveal animations (14 variants)
- Coloring reveal library (32 subjects, reveal sequences)
- All frontend rendering: sticker book, creature collection, coloring canvas, reveal modals
- Rarity weights, theme selection, page positioning

**What GETS DECOMPOSED (trigger/earning layer):**
- Today: `roll_creature_for_completion` = one atomic blob that does points + streak + creature roll + page unlock + coloring advance, triggered ONLY by task completions
- After Phase 3: Each piece becomes an independent godmother, triggerable by ANY deed via contracts:
  - `points_godmother` — awards base points to family_members.gamification_points
  - Creature roll — separate logic (d100 against rarity weights), wirable independently
  - Page unlock — separate logic (every N creatures), wirable independently
  - Coloring advance — separate logic (advance one zone), wirable independently
  - Streak — computed by `compute_streak()` RPC, usable as an IF condition on any contract

**What this means for mom:**
- "Chore completions earn points + creature roll" = two contracts on the same deed
- "Piano practice earns just a coloring zone, no points" = one contract, different godmother
- "Potty trips earn treasure box every 5th trip + coloring zone every trip" = two contracts with different IF patterns
- "Reading 30 minutes earns a page unlock" = one contract wiring time_session_ended → page unlock godmother
- Mom mixes and matches. The visual pieces are Lego bricks; the contracts are the instructions for what snaps where.

**What does NOT change for kids:**
- Same sticker book UI
- Same creature reveals
- Same coloring pages filling in
- Same treasure boxes opening
- They never see contracts — they just see rewards appearing when they do things

**Decomposition happens in Workers C and D (sub-tasks 7-15), not Worker A+B.** Worker A+B builds the schema and dispatch engine that ENABLES this decomposition. The actual surgery on `roll_creature_for_completion` happens later.

---

## Sub-Task 1: Schema — `contracts` table

Create the central `contracts` table. Fields from Phase 1 design (Connector-Architecture-and-Routing-Model.md) + Phase 2 refinements:

**Identity:**
- `id` UUID PK DEFAULT gen_random_uuid()
- `family_id` UUID FK→families NOT NULL
- `created_by` UUID FK→family_members NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

**Lifecycle:**
- `status` TEXT CHECK ('active', 'recently_deleted', 'archived') DEFAULT 'active'
- `deleted_at` TIMESTAMPTZ — when status moved to recently_deleted (48h escape hatch)
- `archived_at` TIMESTAMPTZ

**Deed end (polymorphic addressing):**
- `source_type` TEXT NOT NULL — CHECK against v1 set (10 types)
- `source_id` UUID — NULL = "any source of this type" (family-default contracts)
- `source_category` TEXT — optional category filter (e.g., 'chores', 'school')
- `family_member_id` UUID FK→family_members — NULL = all kids in family

**The IF (qualification logic):**
- `if_pattern` TEXT NOT NULL CHECK ('every_time', 'every_nth', 'on_threshold_cross', 'above_daily_floor', 'above_window_floor', 'within_date_range', 'streak', 'calendar')
- `if_n` INTEGER — for every_nth
- `if_floor` INTEGER — for above_daily_floor, above_window_floor
- `if_window_kind` TEXT — for above_window_floor ('day', 'week', 'month')
- `if_window_starts_at` TIMESTAMPTZ — for within_date_range
- `if_window_ends_at` TIMESTAMPTZ — for within_date_range
- `if_calendar_pattern` JSONB — for calendar IF (rrule-based)
- `if_offset` INTEGER DEFAULT 0 — offset before IF evaluates (e.g., "after the 2nd completion")

**Godmother end:**
- `godmother_type` TEXT NOT NULL CHECK (9 v1 types)
- `godmother_config_id` UUID — FK to per-godmother config table (NULL if inline payload suffices)

**Payload (inline for simple godmothers):**
- `payload_amount` DECIMAL — dollar amount, point amount, etc.
- `payload_text` TEXT — custom reward description, victory text, etc.
- `payload_config` JSONB — complex payloads (assign_task template config, etc.)

**stroke_of (timing):**
- `stroke_of` TEXT NOT NULL CHECK ('immediate', 'end_of_day', 'end_of_week', 'end_of_period', 'at_specific_time', 'custom') DEFAULT 'immediate'
- `stroke_of_time` TIME — for at_specific_time
- `recurrence_details` JSONB — for custom (Universal Scheduler output format)

**Inheritance:**
- `inheritance_level` TEXT NOT NULL CHECK ('family_default', 'kid_override', 'deed_override') DEFAULT 'family_default'
- `override_mode` TEXT CHECK ('replace', 'add', 'remove') DEFAULT 'replace'

**Presentation:**
- `presentation_mode` TEXT CHECK ('silent', 'toast', 'reveal_animation', 'treasure_box') DEFAULT 'silent'
- `presentation_config` JSONB — animation pool references, etc.

**Indexes:**
- `(family_id, source_type, family_member_id, godmother_type)` — contract lookup on deed firing
- `(family_id, status)` — active contract listing
- `(family_id, family_member_id, source_type, inheritance_level)` — inheritance resolution
- Partial unique indexes per inheritance level (prevent duplicate contracts at same level)

**RLS:** Family-scoped. Mom sees all within family. Other roles: read-only on contracts that affect them.

---

## Sub-Task 2: Schema — `deed_firings` table confirm/extend

Worker 5 created this table (migration 100180). Confirm it has:
- `id` UUID PK
- `family_id` UUID FK
- `family_member_id` UUID FK — who performed the deed
- `source_type` TEXT — **Add CHECK constraint with all 10 v1 types** (Worker 5 deferred this)
- `source_id` UUID — polymorphic reference to the source record
- `fired_at` TIMESTAMPTZ DEFAULT now()
- `metadata` JSONB — deed-specific context (e.g., task title, completion details)
- `idempotency_key` TEXT UNIQUE — prevents double-firing

**Extend if missing:**
- Index on `(family_id, source_type, fired_at)` — contract evaluation lookup
- Index on `(family_member_id, source_type, fired_at)` — per-kid deed history

**Also in this sub-task:** Polymorphic extension of `member_coloring_reveals`:
- DROP `earning_task_id` FK
- ADD `earning_source_type TEXT`
- ADD `earning_source_id UUID`
- Update the 3 RPC locations in `roll_creature_for_completion` that reference `earning_task_id`
- Update `useCreateColoringReveal` frontend mutation

**Also in this sub-task:** Collapse `calculation_approach='fixed'`:
- UPDATE `allowance_configs SET calculation_approach = 'dynamic' WHERE calculation_approach = 'fixed'`
- ALTER CHECK constraint to `('dynamic', 'points_weighted')`

---

## Sub-Task 3: Schema — Godmother config tables

Create per-godmother config tables for godmothers that need richer config than inline `payload_*` columns:

**`allowance_godmother_configs`** — pool assignment, calculation overrides
**`points_godmother_configs`** — base points, streak bonuses, creature roll config
**`prize_godmother_configs`** — prize type, prize pool reference, IOU text, expiry
**`assign_task_godmother_configs`** — template_id, assignment mode, due date logic
**`custom_reward_godmother_configs`** — delivery mode (text/list_reference), list_id if applicable

Godmothers that DON'T need config tables (use inline payload_* on contracts):
- `numerator_godmother` — payload_amount = boost weight
- `money_godmother` — payload_amount = dollar amount
- `victory_godmother` — payload_text = victory description (or NULL for auto)
- `family_victory_godmother` — no-op, no config needed

All config tables:
- `id` UUID PK
- `family_id` UUID FK
- `created_at` TIMESTAMPTZ
- Per-godmother-specific columns

RLS: Family-scoped, mom read/write, other roles read-only.

---

## Sub-Task 4: Schema — Streak helper RPC

Create `compute_streak(p_family_member_id UUID, p_source_type TEXT, p_source_id UUID DEFAULT NULL)` RPC.

Returns: `{current_streak INTEGER, longest_streak INTEGER, last_fired_at TIMESTAMPTZ}`

Logic:
- Reads `deed_firings` for the member+source_type (optionally scoped to source_id)
- Counts consecutive days with at least one firing
- Respects `gamification_configs.streak_grace_days` (gap tolerance)
- Respects `gamification_configs.streak_schedule_aware` (only count scheduled days)

This replaces the inline streak logic currently in `roll_creature_for_completion` Step 5.

---

## Sub-Task 5: Cron infrastructure for deferred `stroke_of`

**New Edge Function: `evaluate-deferred-contracts`**

Invoked by two cron schedules:
- `:25` weekly — evaluates `stroke_of='end_of_week'` contracts (Sunday boundary per family timezone)
- `:30` hourly — evaluates `stroke_of='end_of_day'` contracts (midnight per family timezone) AND runs lifecycle sweep (`recently_deleted` → `archived` after 48h)

**Extend `fire-painted-schedules` (at :20):**
- After writing painted-day deed firings, also check for `stroke_of='at_specific_time'` contracts whose `stroke_of_time` has passed in the current hour for each family's timezone

**Convention #246 compliant:** All cron → Edge Function invocations use `util.invoke_edge_function()`.

**Edge Function pattern:**
- Reads all families
- For each family, computes current time in family timezone
- Evaluates relevant contracts based on stroke_of timing
- Calls godmother dispatch for contracts whose conditions are met
- Idempotent (deed_firing_id + contract_id prevents double-grant)

---

## Sub-Task 6: Godmother dispatch infrastructure

**Create: `dispatch_godmothers(p_deed_firing_id UUID)` RPC (or Edge Function — choose based on complexity)**

Logic:
1. Load the deed firing record
2. Find all active contracts matching `(source_type, source_id OR NULL, family_member_id OR NULL, family_id)`
3. Apply inheritance resolution: deed_override > kid_override > family_default. Per godmother_type, the highest-specificity contract wins (unless override_mode='add')
4. For each matching contract, evaluate the IF:
   - `every_time` → always passes
   - `every_nth` → count deed firings for this source, check modulo
   - `on_threshold_cross` → count total, check if this firing crosses the threshold
   - `above_daily_floor` → count today's firings, check if above floor
   - `above_window_floor` → count firings in window, check if above floor
   - `within_date_range` → check fired_at within range
   - `streak` → call `compute_streak()`, check against if_n
   - `calendar` → check if today matches if_calendar_pattern (rrule evaluation)
5. For each passing contract:
   - If `stroke_of='immediate'` → invoke godmother NOW
   - If deferred → record in a `deferred_grants` queue table for the cron sweepers to pick up
6. Godmother invocation: call the appropriate godmother function with (contract_id, deed_firing, payload, stroke_of)
7. Record grant result in `contract_grant_log` (append-only audit)
8. Return summary of what fired

**Idempotency:** UNIQUE constraint on `contract_grant_log(deed_firing_id, contract_id)` prevents double-grants.

**Graceful no-op:** If a godmother_type is not yet implemented (e.g., `family_victory_godmother`), log and return `{status: 'no_op', reason: 'godmother_not_implemented'}`.

**Supporting tables (create in this sub-task):**
- `deferred_grants` — queue for non-immediate stroke_of values
- `contract_grant_log` — audit trail of all grants (deed_firing_id, contract_id, godmother_type, status, grant_reference, metadata, created_at)
- `allowance_dispatch_audit` — dual-logging table for migration verification (per INV 14)

---

## Preparatory Refactor: Extract rollGamificationForCompletion

**Before sub-task 1**, extract the duplicated `rollGamificationForCompletion` helper:

Current locations (copy-pasted identically):
- `src/hooks/useTasks.ts` (~line 440-460)
- `src/hooks/useTaskCompletions.ts` (~line 260-280)
- `src/hooks/usePractice.ts` (~line 540-560)

Extract to: `src/lib/gamification/rollGamificationForCompletion.ts`

Signature: `async function rollGamificationForCompletion(supabase, completionId, completerId, familyId, queryClient)`

All three call sites import from the shared utility. Verify `tsc -b` passes after extraction.

This is a pure refactor — no behavior change. Workers C and D will later replace these calls with deed-firing inserts.

---

## Constraints

- **DO NOT modify any BookShelf files.** BookShelf work is committed (commits `33ee29a` through `28edfa3`) and is a separate track.
- **DO NOT touch godmother implementation logic** (sub-tasks 7-15 are Workers C and D).
- **DO NOT remove or modify `task_rewards`, `calculate_allowance_progress`, or `awardOpportunityEarning`** — those stay until Worker F.
- **DO NOT modify the four gamification hook sites** beyond extracting the shared utility — Workers C and D handle the deed-firing replacement.
- **One commit per sub-task** (plus one commit for the preparatory refactor = 7 commits total).
- **Run `tsc -b` after every commit.** Zero errors required.
- **Follow Convention #246** for all cron → Edge Function wiring.
- **All source_type strings are verb-form** per Coordination Brief §2.10.
- **Feature flag column:** Add `allowance_dispatch_via TEXT CHECK ('legacy', 'connector') DEFAULT 'legacy'` to `families` table. Workers C-F will flip this to 'connector' at cutover.

---

## Output Format

After each sub-task commit, report:
1. Migration number used
2. Tables/RPCs created
3. Any surprises or deviations from this spec
4. `tsc -b` result

After all 7 commits (refactor + 6 sub-tasks), produce a summary table mapping each sub-task to its migration number and key deliverables.

---

## Migration Numbering

Current highest migration: `00000000100198` (get_book_chunks_for_study_guide — BookShelf, committed)

**Your migrations start at: `00000000100199`**

Sequence:
- (no migration) — preparatory refactor (code-only commit)
- 100199 — contracts table + RLS
- 100200 — deed_firings CHECK constraint + indexes (sub-task 2, commit 1 of 1 — these 3 migrations ship in one commit)
- 100201 — coloring reveal polymorphic extension (same commit as 100200)
- 100202 — collapse fixed/dynamic on allowance_configs (same commit as 100200)
- 100203 — godmother config tables
- 100204 — compute_streak RPC
- 100205 — deferred_grants + contract_grant_log + allowance_dispatch_audit + cron schedules
- 100206 — dispatch infrastructure (RPC or Edge Function)

**Why sub-task 2 is three migration files in one commit:** The three changes are logically independent (different tables, zero dependencies between them). Separate `.sql` files give granular DB-level rollback if any one has an issue, while a single commit keeps the git checkpoint clean. If the coloring reveal migration has a problem, it doesn't block the deed_firings CHECK from landing.

Do NOT modify any migration ≤ 100198.
