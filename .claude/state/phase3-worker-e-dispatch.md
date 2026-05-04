# Phase 3 — Worker E Dispatch Prompt (Paste-Ready)

> Paste this entire prompt into a fresh Claude Code session.
> This worker ships sub-tasks 16-17: presentation layer + mom contract authoring UI.

---

## Context Briefing

You are Worker E for Phase 3 of the Connector Architecture build for MyAIM Family. You wire the presentation layer (how rewards appear visually to kids) and build the mom-facing contract authoring UI (how mom creates and manages the rules that wire deeds to godmothers).

Workers A+B, C, and D have shipped:
- Full connector infrastructure (contracts table, deed_firings, dispatch RPC, cron, config tables)
- All 9 godmothers implemented and auto-registered via `execute_<godmother_type>` naming
- Prize Board at `/prize-board` (mom's IOU surface)
- Generic helpers: `grantMoney`, `grantPoints`, `createVictoryForDeed`
- Entity↔Event bridge in prize_godmother
- `contract_grant_log` for idempotent audit

**Your scope (sub-tasks 16-17 + one small addition):**
16. Presentation layer — wire `presentation_mode` on grant-style godmothers to existing reveal infrastructure
16b. `recognition_godmother` — a 10th godmother that does nothing transactional, just logs acknowledgment. Enables "no reward, just presentation" contracts (e.g., potty trip → coloring advance only).
17. Mom-functional baseline UI for contract authoring — CRUD form for creating/editing/pausing/deleting contracts

---

## Required Reading (In Order)

1. `claude/PRE_BUILD_PROCESS.md` — **MANDATORY.** Follow the full pre-build ritual.
2. `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — §6.2 items 16-17.
3. `claude/web-sync/REWARDS_GROUND_TRUTH_2026-04-25.md` — §3 (reward_reveals architecture — 5 tables, hooks, modal).
4. `claude/web-sync/Connector-Architecture-and-Routing-Model.md` — §8 (contract row field-by-field), §9 (inheritance).
5. `claude/web-sync/Parallel-Builder-Coordination-Brief-2026-04-26.md` — §2.5 (override_mode).
6. `.claude/rules/current-builds/phase-3-connector-worker-ab.md` — Worker A+B summary.
7. `claude/live_schema.md` — Current schema.
8. `src/hooks/useRewardReveals.ts` — Existing reveal infrastructure (601 lines). You're wiring this.
9. `src/components/gamification/RewardRevealModal.tsx` — Existing reveal modal.
10. `src/pages/PrizeBoard.tsx` — Worker D's IOU surface (you may extend for presentation config).

---

## Investigation Results (Relevant to Worker E)

### INV 12 — Reveal animations are ready
- 14 treasure-box-opening animations across 10 style categories
- `TreasureBoxIdle` widget (locked/transitioning/unlocked states)
- `RewardRevealModal` + `VideoRevealRenderer` for playing animations
- `AttachRevealSection` for mom configuration
- No new assets needed

### INV 13 — Coloring reveal advancement
- `advance_coloring_reveal()` RPC works correctly
- Polymorphic source addressing shipped (migration 100201)
- Coloring advance is a `presentation_mode` on grant-style godmothers — not its own godmother
- No auto-start-fresh on completion (stays complete when done — Phase 3.7 adds this if needed)

### Prize/reveal naming (founder decision — DO NOT change)
- `reward_reveal_attachments.source_type` = ENTITY names (`task`, `widget`, `list`, `intention`)
- `deed_firings.source_type` = EVENT names (`task_completion`, `widget_data_point`)
- Prize godmother already bridges these (Worker D built the mapping)
- Presentation layer extends this same bridge pattern

---

## Sub-Task 16: Presentation Layer

**What it does:** When a grant-style godmother fires (prize, custom_reward, assign_task), the `presentation_mode` on the contract determines how the kid SEES it:
- `'silent'` — no visual feedback (default)
- `'toast'` — brief notification banner
- `'reveal_animation'` — play a reveal animation (treasure box opening, card flip, etc.)
- `'treasure_box'` — specific treasure-box-opening experience with progress tracking

**What already exists (DO NOT rebuild):**
- `reward_reveals` table — stores reveal definitions
- `reward_reveal_attachments` table — links reveals to entities
- `checkRevealTrigger(sourceType, sourceId, memberId, count, animations)` — evaluates whether a reveal should fire
- `RewardRevealModal` — full-screen modal with video playback
- `VideoRevealRenderer` — plays reveal videos
- `TreasureBoxIdle` — progress widget (locked/transitioning/unlocked)
- `AttachRevealSection` — mom UI for attaching reveals to entities
- 14+ treasure box animations seeded in `reveal_animations` table

**What to build:**

1. **Presentation dispatch in godmother grant flow:**
   - After a grant-style godmother returns `{status: 'granted'}`, check the contract's `presentation_mode`
   - If `'silent'` → do nothing (already the default)
   - If `'toast'` → write a `notifications` row with `category='rewards'`, `notification_type='reward_granted'`, visible to the kid
   - If `'reveal_animation'` → write to a `pending_reveals` queue that the frontend polls/subscribes to. Include `animation_slug` from `presentation_config` or from the reveal attachment lookup (Worker D's bridge)
   - If `'treasure_box'` → same as reveal_animation but also update the `TreasureBoxIdle` widget progress state

2. **Frontend reveal trigger:**
   - The existing `RewardRevealModal` needs a data source to know WHEN to open
   - Create a `usePendingReveals(memberId)` hook that:
     - Subscribes to Supabase Realtime on a `pending_reveals` table (or reads from `contract_grant_log` where `presentation_mode != 'silent'` and `revealed_at IS NULL`)
     - When a new pending reveal appears → opens `RewardRevealModal` with the animation
     - After modal closes → marks the reveal as shown (`revealed_at = NOW()`)
   - Wire this hook into the shell providers (MomShell, GuidedShell, PlayShell) so reveals can fire on any dashboard

3. **`pending_reveals` table (or extend `contract_grant_log`):**
   - Decide: new table or add `revealed_at` + `presentation_mode` columns to `contract_grant_log`?
   - Recommendation: Add columns to `contract_grant_log` — it already has one row per grant, and adding `presentation_mode TEXT` + `revealed_at TIMESTAMPTZ` + `animation_slug TEXT` avoids a separate table. The frontend queries: `WHERE family_member_id = X AND presentation_mode != 'silent' AND revealed_at IS NULL`
   - RLS: Kid can read their own pending reveals. Mom can read all.

4. **Mom configuration UI for presentation mode:**
   - In the contract authoring form (Sub-task 17), add a "How should the kid see this?" section:
     - Radio buttons: Silent / Toast / Reveal Animation / Treasure Box / Coloring Advance
     - If Reveal Animation or Treasure Box selected: show animation picker (existing `AttachRevealSection` component or similar)
     - Animation picker reads from `reveal_animations` table, filtered by style_category
   - This is part of the contract form, not a separate surface

5. **Coloring reveal as presentation_mode:**
   - When `presentation_mode = 'coloring_advance'` (a distinct value, not a sub-type of reveal_animation):
     - Call `advance_coloring_reveal()` RPC for the kid's active reveal
     - The frontend shows the coloring page advancing one zone (existing rendering in `ColorRevealTallyWidget`)
   - This is a presentation-mode variant, not a separate godmother
   - **Key use case:** "Potty trip → just advance the coloring page, no reward." Mom creates a contract with `godmother_type='recognition_godmother'` + `presentation_mode='coloring_advance'`. The recognition godmother logs the acknowledgment; the presentation layer advances the coloring.

6. **recognition_godmother (10th godmother — add to dispatch):**
   - Create RPC: `execute_recognition_godmother(contract_id, deed_firing, payload, stroke_of)`
   - Does nothing transactional — no money, no points, no prize
   - Writes to `contract_grant_log` with `status='granted'`, metadata `{type: 'recognition_only'}`
   - Returns `{status: 'granted', grant_reference: contract_grant_log.id}`
   - Follows same `execute_<godmother_type>` naming → auto-registers via pg_proc
   - ~15 minutes of work. Same pattern as `family_victory_godmother` but returns 'granted' instead of 'no_op' (because recognition IS the grant)
   - **UPDATE the contracts table CHECK constraint** to add 'recognition_godmother' as the 10th allowed godmother_type value (ALTER in a migration)

---

## Sub-Task 17: Mom Contract Authoring UI

**What it does:** A real working form where mom can create, edit, pause, and delete contracts. This is the "power user" interface — functional, not pretty. Future wizards (Phase 3.7) will wrap this with friendly guided flows.

**Location:** New page at `/contracts` in the "Plan & Do" sidebar section (mom-only). Or if you judge it fits better as a tab within an existing settings/gamification surface, that's acceptable — but it needs its own dedicated entry point, not buried 3 levels deep.

**Contract CRUD:**

1. **List view (default):**
   - All active contracts for this family, grouped by `family_member_id` (NULL = family-default)
   - Each contract shows: source_type icon + label, IF pattern summary, godmother_type icon + label, stroke_of timing
   - Status badges: Active (green), Paused/Recently Deleted (yellow), Archived (gray)
   - Actions per contract: Edit, Pause/Resume, Delete (48h recovery), Archive
   - Filter: by member, by godmother_type, by source_type
   - "Recently Deleted" section at bottom (contracts within 48h recovery window, with "Restore" action)

2. **Create/Edit form:**
   - **Section 1 — "When this happens" (Deed):**
     - Source type picker (10 options, icon + label for each)
     - Optional: specific source (task picker, list picker, etc.) — NULL = "any [source_type]"
     - Optional: source category filter (text input, e.g., "chores")
     - Optional: specific family member (member pill picker) — NULL = all kids
   - **Section 2 — "If this condition is met" (The IF):**
     - Pattern picker (8 options with plain-English descriptions):
       - "Every time" — always fires
       - "Every Nth time" — number input for N
       - "When total reaches..." — threshold number input
       - "More than N per day" — floor number input
       - "More than N per [period]" — floor + window picker
       - "Within date range" — date range picker
       - "On a streak of N days" — streak number input
       - "On matching calendar days" — (stubbed, shows "coming soon")
     - If offset: "Skip the first N" — number input (default 0)
   - **Section 3 — "Then do this" (Godmother):**
     - Godmother type picker (9 options, icon + label)
     - Inline payload fields (show/hide based on godmother type):
       - money/points/numerator: amount input
       - victory: description text input (optional)
       - prize/custom_reward: text input + optional list picker
       - assign_task: template picker + assignment mode + due date mode
     - Or: "Use advanced config" toggle → links to the godmother_config table
     - **"Recognition only (no reward)"** — selects `recognition_godmother`. NO payload fields shown. The presentation mode (Section 5) provides the kid-visible feedback.
   - **Section 4 — "When to grant" (stroke_of):**
     - Timing picker: Immediately / End of day / End of week / End of period / At specific time / Custom schedule
     - If "At specific time": time picker
     - If "Custom schedule": (stubbed, shows "coming in Phase 3.5")
   - **Section 5 — "How the kid sees it" (Presentation):**
     - Radio: Silent / Toast / Reveal Animation / Treasure Box
     - If animation: animation picker (from `reveal_animations`)
     - If treasure box: (uses same picker, filtered to treasure-box style)
   - **Section 6 — "Inheritance & Override" (Advanced):**
     - Inheritance level: Family Default / Per-Kid / Per-Deed (auto-detected from Section 1 choices)
     - Override mode: Replace (default) / Add / Remove
     - Plain-English explanation of what this means: "This contract [replaces/adds to/removes from] any broader contract for the same godmother type"

3. **Validation:**
   - Source type required
   - IF pattern required
   - Godmother type required
   - Payload must be valid for the godmother type (e.g., money needs an amount > 0)
   - Warn (don't block) if a duplicate contract exists at the same level for the same deed + godmother

4. **Inheritance visualization:**
   - On the list view, show inheritance with visual nesting:
     - Family defaults at top level
     - Per-kid overrides indented under the relevant kid
     - Per-deed overrides indented further, showing which specific task/item they target
   - Color-code: family defaults in neutral, kid overrides in kid's member color, deed overrides in accent

5. **Delete + Recovery:**
   - "Delete" sets `status = 'recently_deleted'`, `deleted_at = NOW()`
   - Contract disappears from active list, appears in "Recently Deleted" section
   - "Restore" sets `status = 'active'`, `deleted_at = NULL`
   - After 48h, the lifecycle cron (:30) moves it to `'archived'`
   - "Archive immediately" skips the 48h window

---

## UI Design Guidelines

- **Shell:** Mom-only (MomShell)
- **Density:** `density-compact` (it's a data management surface)
- **Mobile:** Must work at 375px. Form sections stack vertically. List view is a simple card list.
- **Components:** Use shared components (Card, Button, Badge, Select, Input, Toggle, Modal, Tabs)
- **Theme:** Full theme token compliance. No hardcoded colors.
- **Icons:** Lucide React. Good icon choices:
  - Source types: CheckCircle (task), List (list), Target (intention), Activity (widget), Clock (time), Calendar (schedule), Gift (opportunity), Shuffle (randomizer)
  - Godmothers: DollarSign (money/allowance), Star (points), Trophy (victory), Gift (prize), Wand2 (custom), ListPlus (assign_task)
  - Presentation: BellOff (silent), Bell (toast), Sparkles (reveal), Box (treasure)
- **Empty state:** "No contracts yet. Contracts are rules that connect what your family does to what they earn. Create your first one to get started."
- **No wizard language.** This is the power-user interface. Labels are direct: "Source Type," "Condition," "Action," "Timing," "Presentation." Wizards come in Phase 3.7.

---

## Constraints

- **DO NOT modify BookShelf files.**
- **DO NOT modify the four gamification hook sites** — Worker F handles deed-firing wiring.
- **DO NOT modify godmother implementations** (Workers C+D). You're consuming their output, not changing their logic.
- **DO NOT rebuild reveal infrastructure.** Wire the existing `RewardRevealModal`, `checkRevealTrigger`, `AttachRevealSection`, etc. If something is missing, add the minimum needed — don't redesign.
- **One commit per sub-task** (2-3 commits total — sub-task 16b can be its own commit or bundled with 16).
- **Run `tsc -b` after every commit.** Zero errors required.
- **Mobile/desktop parity:** The contract authoring page gets a sidebar entry. Verify it appears in the BottomNav "More" menu on mobile (per Convention #16 — `getSidebarSections` is the single source).
- **Override mode default:** UI nudges toward `'replace'` per Coordination Brief §2.5.

---

## Output Format

After each sub-task commit, report:
1. Files created/modified
2. New routes/pages added
3. Any surprises or deviations from this spec
4. `tsc -b` result
5. Mobile nav parity confirmation

After both commits, produce a summary table.

---

## Migration Numbering

Worker D used migrations through 100215.

**Your migrations start at: `00000000100216`**

Sub-task 16 likely needs a migration (adding columns to `contract_grant_log` for presentation tracking). Sub-task 17 is likely code-only (React pages + hooks reading existing tables). Use migrations only where schema changes are required.
