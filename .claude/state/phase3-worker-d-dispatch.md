# Phase 3 — Worker D Dispatch Prompt (Paste-Ready)

> Paste this entire prompt into a fresh Claude Code session.
> This worker ships sub-tasks 11-15: the remaining five godmother implementations.

---

## Context Briefing

You are Worker D for Phase 3 of the Connector Architecture build for MyAIM Family. You implement the final five godmothers — completing the full set of 9 action functions that respond when deeds fire and contracts match.

Workers A+B and C have already shipped:
- Full connector infrastructure (contracts table, deed_firings, dispatch RPC, cron, config tables)
- Dynamic dispatch via `pg_proc` lookup — your godmothers auto-register by naming: `execute_<godmother_type>`
- 4 godmothers already live: allowance, numerator, money, points
- Generic helpers: `grantMoney` (src/lib/financial/), `grantPoints` (src/lib/gamification/)
- `contract_grant_log` for idempotent audit logging

**Your scope (sub-tasks 11-15):**
11. `prize_godmother` — IOU creation + mom-facing unredeemed prizes surface
12. `victory_godmother` — thin wrapper around victory creation
13. `family_victory_godmother` — no-op placeholder until PRD-11B
14. `custom_reward_godmother` — text payload OR list reference delivery
15. `assign_task_godmother` — create tasks from templates via contracts

---

## Required Reading (In Order)

1. `claude/PRE_BUILD_PROCESS.md` — **MANDATORY.** Follow the full pre-build ritual.
2. `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — §6.2 items 11-15.
3. `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — §3 (reward_reveals architecture), §5 (Best Intention→reward path), §6 (victory integration).
4. `.claude/rules/current-builds/phase-3-connector-worker-ab.md` — What Worker A+B built.
5. `claude/live_schema.md` — Current schema.
6. `supabase/migrations/00000000100207*` through `00000000100210*` — Worker C's godmothers (see their registration pattern).
7. `src/lib/tasks/createVictoryForCompletion.ts` — Existing victory helper you'll wrap.
8. `src/hooks/useRewardReveals.ts` — Existing reveal infrastructure (601 lines, zero consumers — you're the first consumer).

---

## Investigation Results (Relevant to Worker D)

### INV 1 — Scope estimates for your five godmothers
| Godmother | Existing Logic | Scope |
|-----------|---------------|-------|
| prize | `checkRevealTrigger()` in useRewardReveals.ts — already generic, accepts any sourceType | Thin wrapper + IOU surface (new) |
| victory | `createVictoryForCompletion()` — checks task.victory_flagged | Thin wrapper — make generic for any deed |
| family_victory | Nothing exists | New code (no-op placeholder) |
| custom_reward | task_rewards table (write-only dead end, no display) | New code — build the delivery path |
| assign_task | Nothing exists (sequential promotion is stubbed) | New code — template-based task creation |

### INV 12 — Treasure box reveal animations
- 14 treasure-box-opening animations exist across 10 style categories
- `TreasureBoxIdle` widget exists (locked/transitioning/unlocked states)
- `RewardRevealModal` + `VideoRevealRenderer` exist for playing animations
- Prize godmother can wire to these immediately — no asset generation needed

### INV 13 — Coloring reveal readiness
- Advancement lifecycle is complete (`advance_coloring_reveal()` RPC works)
- Polymorphic source addressing already shipped (Worker A+B, migration 100201)
- No auto-start-fresh on completion — when done, stays done. Phase 3.7 adds this if needed.
- Coloring advance is a **presentation_mode** on grant-style godmothers, not its own godmother

### Prize/reveal naming convention (founder decision)
- `reward_reveal_attachments.source_type` uses ENTITY names: `task`, `widget`, `list`, `intention`
- `deed_firings.source_type` uses EVENT names: `task_completion`, `widget_data_point`, etc.
- These are DIFFERENT CONCEPTS and BOTH are correct:
  - Entity = "what is this reveal attached to?" (the task itself)
  - Event = "what just happened?" (a completion of that task)
- The prize godmother BRIDGES them: when a `task_completion` event fires, look up reveals attached to the `task` entity
- Do NOT rename either convention. Map between them in the godmother logic.

---

## Sub-Task 11: prize_godmother

**What it does:** When a deed fires and a contract routes here, create a prize IOU for the kid. Optionally trigger a reveal animation (treasure box opening, etc.).

**Existing infrastructure to wire (NOT rebuild):**
- `earned_prizes` table (0 rows) — stores IOUs with `prize_type`, `prize_text`, `prize_name`, `prize_image_url`, `prize_asset_key`, `animation_slug`
- `reward_reveals` table — mom-configured reveal definitions (animation pools, prize modes)
- `reward_reveal_attachments` table — links reveals to source entities
- `checkRevealTrigger()` in `useRewardReveals.ts` — already accepts any `(sourceType, sourceId, memberId, count)` — fully generic
- `RewardRevealModal` — plays animations
- `TreasureBoxIdle` widget — progress display

**What to build:**

1. **Godmother RPC:** `execute_prize_godmother(contract_id, deed_firing, payload, stroke_of)`
   - Reads `prize_godmother_configs` for prize details (type, text, image, pool reference)
   - Inserts `earned_prizes` row with:
     - `family_member_id` from deed_firing
     - `source_type` + `source_id` from deed_firing (polymorphic — the EVENT that earned it)
     - `prize_type`, `prize_text`, etc. from config or inline payload
     - `redeemed_at = NULL` (unredeemed IOU)
   - If `presentation_mode = 'reveal_animation'` or `'treasure_box'`: writes metadata for the frontend to trigger the reveal
   - Returns `{status: 'granted', grant_reference: earned_prizes.id}`

2. **Mom-facing IOU surface (NEW — replaces scope item NEW-BBB):**
   - A simple list view showing all unredeemed `earned_prizes` across all kids
   - Grouped by kid (member color headers)
   - Each IOU shows: prize_text, earned_at date, which deed earned it
   - "Mark Redeemed" button per IOU → sets `redeemed_at = NOW()`, `redeemed_by = mom.id`
   - Location: accessible from Settings or a new "Reward Board" entry (check sidebar sections — if no natural home, add to Settings > Family > Rewards subsection)
   - This is a mom-only surface. Kids see prizes via the reveal animations / sticker book, not this admin list.

3. **Entity↔Event bridge for reveal lookup:**
   - When the prize godmother fires from a `task_completion` deed, it needs to check if a `reward_reveal_attachment` exists for the `task` entity
   - Map: `task_completion` → look up attachments with `source_type='task'` and `source_id=deed_firing.source_id`
   - Map: `intention_iteration` → look up attachments with `source_type='intention'` and `source_id=deed_firing.source_id`
   - Map: `list_item_completion` → look up attachments with `source_type='list'` (using the list_id from metadata)
   - If no attachment exists → silent grant (IOU only, no animation)
   - If attachment exists → include `animation_slug` in the grant metadata for frontend consumption

---

## Sub-Task 12: victory_godmother

**What it does:** When a deed fires and a contract routes here, create a victory record for the family member.

**Existing logic to wrap:** `createVictoryForCompletion()` in `src/lib/tasks/createVictoryForCompletion.ts`. This function:
- Checks `task.victory_flagged` (hardcoded to tasks only)
- Creates a `victories` row with source='task_completed', source_reference_id, family_member_id
- Includes task title as description

**The refactor:** Make it callable from any deed source, not just task completions.

**What to build:**

1. **Generic helper:** `src/lib/victories/createVictoryForDeed.ts`
   ```
   createVictoryForDeed({
     familyId, memberId, description, 
     source: string,  // e.g., 'contract_grant'
     sourceReferenceId: string,  // deed_firing.id or source entity id
     lifeAreaTag?: string,
     guidingStarId?: string,
     bestIntentionId?: string
   })
   ```
   - Inserts `victories` row
   - No `victory_flagged` check — the contract's existence IS the flag
   - Returns the victory record

2. **Godmother RPC:** `execute_victory_godmother(contract_id, deed_firing, payload, stroke_of)`
   - Calls a server-side equivalent (or directly inserts into `victories`)
   - Uses `payload.payload_text` as victory description (or auto-generates from deed metadata if NULL)
   - Sets `source = 'contract_grant'` and `source_reference_id = deed_firing.id`
   - Returns `{status: 'granted', grant_reference: victories.id}`

3. **Update `createVictoryForCompletion`** to call `createVictoryForDeed` internally (preserves backward compat for legacy path).

---

## Sub-Task 13: family_victory_godmother

**What it does:** Nothing yet. PRD-11B (Family Celebrations) isn't built. This is a graceful no-op.

**What to build:**

1. **Godmother RPC:** `execute_family_victory_godmother(contract_id, deed_firing, payload, stroke_of)`
   - Logs: "family_victory_godmother invoked but PRD-11B not yet built"
   - Returns `{status: 'no_op', metadata: {reason: 'prd_11b_not_built'}}`
   - Does NOT write to `contract_grant_log` with status='granted' — uses status='no_op' so it doesn't falsely appear as a successful grant

2. That's it. One small RPC. When PRD-11B ships, this gets upgraded to actually create family victory celebrations.

---

## Sub-Task 14: custom_reward_godmother

**What it does:** When a deed fires and a contract routes here, deliver a custom reward to the kid. Two delivery modes:
- **Text payload:** Mom typed a reward description (e.g., "Shopping trip for big girl underwear"). Creates an IOU similar to prize_godmother but with custom text.
- **List reference:** Reward is drawn from a rewards list (e.g., the "Potty Rewards" list with popsicle, story, chocolate, etc.). Picks the next item from the list.

**Current state:** `task_rewards` has `reward_type='custom'` rows that are written but NEVER READ or displayed. This godmother finally builds the delivery path.

**What to build:**

1. **Godmother RPC:** `execute_custom_reward_godmother(contract_id, deed_firing, payload, stroke_of)`
   - Reads `custom_reward_godmother_configs` for delivery mode
   - **Text mode** (`delivery_mode = 'text'`):
     - Creates `earned_prizes` row with `prize_type='custom'`, `prize_text` from config or payload
     - Returns `{status: 'granted', grant_reference: earned_prizes.id}`
   - **List reference mode** (`delivery_mode = 'list_reference'`):
     - Reads `config.list_id` to find the rewards list
     - Picks the next unawarded item (or random item if list is randomizer-style)
     - Creates `earned_prizes` row with the list item's content as prize_text
     - Marks the list item as awarded (if one-time) or increments count (if repeatable)
     - Returns `{status: 'granted', grant_reference: earned_prizes.id, metadata: {list_item_id, item_content}}`
   - Both modes respect `presentation_mode` from the contract (silent, toast, reveal)

2. **Fix NEW-AAA defect:** The current code writes `task_rewards` with `reward_type='custom'` but never displays them. After this godmother ships, custom rewards have a real delivery path through `earned_prizes` → mom's IOU surface (built in sub-task 11). The defect is fixed by having a working consumer.

---

## Sub-Task 15: assign_task_godmother

**What it does:** When a deed fires and a contract routes here, automatically create a new task for a family member. Use cases:
- Consequence spinner lands on "extra chores" → assign_task_godmother creates the chore task
- Kid claims an opportunity → assign_task_godmother creates the work task on their dashboard
- Achievement milestone → assign_task_godmother creates a celebration task

**What to build:**

1. **Godmother RPC:** `execute_assign_task_godmother(contract_id, deed_firing, payload, stroke_of)`
   - Reads `assign_task_godmother_configs` for:
     - `template_id` — which task template to instantiate
     - `assignment_mode` — 'deed_member' (assign to whoever did the deed) | 'specific_member' (config.target_member_id) | 'rotating' (round-robin from config.member_pool)
     - `due_date_mode` — 'immediate' | 'next_day' | 'end_of_week' | 'custom_offset' (config.due_date_offset_days)
     - `title_override` — optional custom title (NULL = use template title)
   - Creates `tasks` row using `createTaskFromData` pattern (or a server-side equivalent):
     - `source = 'contract_grant'`
     - `source_reference_id = contract.id`
     - `assignee_id` per assignment_mode
     - `due_date` per due_date_mode
     - `template_id` for linking
   - Returns `{status: 'granted', grant_reference: tasks.id, metadata: {assignee_id, title, due_date}}`

2. **Guard:** If `assign_task_godmother_configs.template_id` references a template that doesn't exist or is archived, return `{status: 'failed', error_message: 'template_not_found'}`. Don't create a broken task.

3. **Note on splitting:** The build plan mentions this godmother "may split into 2-3 focused godmothers if the consolidated config schema becomes unwieldy." If during implementation you find the config is clean and covers all cases, keep it as one. If you find yourself adding many conditional branches for different assignment scenarios, flag it and the founder will decide whether to split.

---

## Constraints

- **DO NOT modify BookShelf files.**
- **DO NOT modify the four gamification hook sites** — Worker F handles deed-firing wiring.
- **DO NOT remove or modify** `rollGamificationForCompletion`, `roll_creature_for_completion` RPC, `calculate_allowance_progress` RPC, `awardOpportunityEarning`, or `createVictoryForCompletion` (beyond having it call the new generic helper internally).
- **DO NOT break existing behavior.** All legacy paths continue to work.
- **One commit per sub-task** (5 commits total).
- **Run `tsc -b` after every commit.** Zero errors required.
- **Follow the `execute_<godmother_type>` naming convention** — auto-registers via pg_proc lookup in dispatch_godmothers.
- **Godmother signature:** `(contract_id UUID, deed_firing JSONB, payload JSONB, stroke_of TEXT)`
- **Return shape:** `{status TEXT, grant_reference UUID, error_message TEXT, metadata JSONB}`
- **Idempotency:** Handle `contract_grant_log` UNIQUE constraint violations gracefully (return existing grant, don't error).

---

## The IOU Surface — UI Notes

Sub-task 11 includes the mom-facing IOU list. This is the ONE UI surface in Worker D. Keep it minimal but functional:

- Location: If there's a natural "Rewards" or "Gamification" section in Settings, put it there. Otherwise, create a `/rewards` route accessible from the sidebar under "Plan & Do" section.
- Shell: Mom-only (MomShell). Not visible to kids.
- Components: Use existing shared components (Card, Button, Badge, Avatar for member colors).
- Theme: Follow existing density-compact patterns for list views.
- Mobile: Must work at 375px. Simple vertical list, no complex layout.
- Empty state: "No unredeemed prizes yet. When contracts award prizes, they'll appear here."

This is a **transient modal** if small scope, or a **page** if it has enough content. Use judgment based on how many IOUs realistically accumulate. A page is probably right since it persists across sessions and mom needs to find it reliably.

---

## Output Format

After each sub-task commit, report:
1. Files created/modified
2. How the godmother registers with dispatch
3. Any surprises or deviations from this spec
4. `tsc -b` result

After all 5 commits, produce a summary table.

---

## Migration Numbering

Worker C used migrations through 100210.

**Your migrations start at: `00000000100211`**

Some sub-tasks may be code-only (TypeScript godmother functions + React components). Use migrations only for new RPCs or schema changes. Follow the pattern Worker C established.
