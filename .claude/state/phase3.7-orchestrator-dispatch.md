# Phase 3.7 — Wizards & Seeded Templates — Orchestrator Dispatch

> Paste this into a fresh Claude Code session.
> This session orchestrates the Phase 3.7 build: three wizards, three seeded templates, and supporting infrastructure.

---

## Your Role

You are the orchestrator for Phase 3.7 of MyAIM Family. You coordinate worker sessions, run verifier checkpoints, and manage handoffs. **You do not write feature code yourself** — you generate paste-ready dispatch prompts for worker windows.

Before doing anything else, run `/orchestrate status` to orient yourself. Then read:
1. `.claude/rules/orchestrator.md` — your behavioral instructions
2. `claude/orchestration/Verifier-Checkpoint-Schedule.md` — the 6 checkpoints you enforce
3. `claude/orchestration/Close-Build-And-Baton-Pass-Spec.md` — handoff protocol

---

## What Phase 3.7 Ships

Three outcome-named wizards + three seeded templates + infrastructure, all built on top of the Phase 3 connector layer (contracts + deed_firings + godmothers).

### Three Wizards

1. **Rewards List Wizard** — "Create a Rewards List"
   Mom creates a named, curated list of rewards (popsicle, story, chocolate, trip to store) that treasure boxes and prize reveals draw from. Shareable across kids. Can be reused by any contract that awards prizes.

2. **Repeated Action Chart Wizard** — "Set Up a Progress Chart"
   Generic wizard for "kid does the same action repeatedly, gets milestone rewards." Composes contracts via the connector layer. Covers potty charts, reading goals, chore streaks, practice tracking — anything where repetition earns celebrations.

3. **List + Reveal + Assignment Wizard** — Two flavors:
   - **Opportunity flavor** ("Extra Earning Opportunities") — kid browses, claims, completes, earns money
   - **Draw flavor** ("Consequence Spinner") — mom/kid spins, result assigned as a task

### Three Seeded Templates

1. **Potty Chart** — pre-configured Repeated Action Chart: star chart widget + coloring reveal (10 zones/page, 5 pages across 50 trips) + treasure box prizes every 5 trips + special "I DID IT!" at trip 50
2. **Consequence Spinner** — pre-configured List + Reveal + Assignment (draw flavor): 8 sample consequences, person-pick-first spinner, task assignment on result
3. **Extra Earning Opportunities** — pre-configured List + Reveal + Assignment (opportunity flavor): 8 sample jobs with dollar amounts, claim-lock, mom approval, money deposit on completion

### Infrastructure

- Template library table (with community-sharing fields for future)
- Treasure box pool / animation rotation tables
- `WizardProgressSaver` component (localStorage draft persistence)
- `AttachRevealSection` wiring (reveals currently live at /dev/gamification only — must be wired for wizard exposure)
- Drafts page in Studio (or tab)
- Natural Language Composition entry point on Studio ("Describe what you want")

---

## Triage Fold-Ins (from TRIAGE_WORKSHEET.md)

These items are prerequisites or natural companions. Each folds into the worker where it fits:

| ID | Item | Severity | Folds Into |
|----|------|----------|------------|
| **NEW-WW** | Per-line-item reward picker on opportunity lists (reward type, amount, reveal wrapper per item) | High, Beta=Y | Worker D (Opportunity wizard) |
| **SCOPE-2.F61** | AttachRevealSection needs wiring — 4 CSS/SVG reveals + treasure box animations stuck at /dev/gamification only | Medium, Fix Next Build | Worker A (Infrastructure) |
| **SCOPE-3.F14** | Allowance first-period bootstrap — allowance non-operational at first use | High, Beta=Y, partially resolved | Worker D (Opportunity wizard handles gracefully) |
| **NEW-QQ** | "Setup is too hard" discoverability — founder didn't know how points/rewards work | Medium | All wizards (each wizard IS the fix — guided setup replaces manual discovery) |
| **SCOPE-2.F62** | Color reveal PRD-24B architecture (Sequential/Gradual/Random strategies) not shipped — Build M shape only | Medium, Intentional | Worker C (Repeated Action Chart uses Build M shape; document gap) |

---

## Worker Breakdown

### Worker A: Schema + Shared Components
**Scope:** Foundation that all three wizards need.

1. **Template library table** — `wizard_templates` or extend existing template tables
   - `id`, `family_id` (NULL for system), `template_type`, `title`, `description`
   - `template_source` ('system' | 'family' | 'community'), `is_example`, `config` JSONB
   - `cloned_from_template_id`, `original_author_id` (community-sharing prep)
   - `tags` JSONB array, `sharing_mode`, `created_at`, `archived_at`
   - RLS: family-scoped read/write, system templates readable by all

2. **Treasure box pool tables**
   - `reveal_animation_pools`: `id`, `family_id`, `name`, `sharing_mode`, `created_by`
   - `reveal_animation_pool_members`: `pool_id`, `reveal_animation_id`, `weight`, `tag`
   - Add `tag TEXT` column to `reveal_animations`

3. **AttachRevealSection wiring** (SCOPE-2.F61 fold-in)
   - Wire the 4 CSS/SVG reveal components + treasure box animation out of /dev/gamification into the shared component
   - Make `AttachRevealSection` a production-ready picker that wizards can embed

4. **WizardProgressSaver component**
   - localStorage persistence wrapper: auto-save wizard state on every step change
   - Keyed by `wizard-{wizardType}-{familyId}-{draftId}`
   - Restore on mount, clear on deploy or explicit discard
   - "Save as draft?" prompt on wizard close (default: save)

5. **Drafts surface in Studio**
   - Drafts tab or section showing in-progress wizard skeletons
   - Click to resume at last step
   - "Start fresh" option when draft exists for same wizard type

**Migration:** `00000000100229` (or next available — current highest is 100228)
**tsc -b:** Zero errors after this worker.

### Worker B: Rewards List Wizard
**Scope:** First wizard. Foundation for Workers C and D (both reference reward lists).

**Wizard steps:**
1. Name and describe — "What are these rewards for?" (e.g., "Potty Rewards")
2. Add reward items — BulkAddWithAI-powered list:
   - Reward name, optional photo, optional tier/category
   - Drag-to-reorder
   - "Let AI help" → Haiku suggests reward ideas from the name/description
3. Sharing mode — who sees this list (this kid only / all kids / specific kids)
4. Review & Deploy — save to template library, make available to reveals

**Creates:** A `lists` row with `list_type='reward_list'` (or appropriate type) + `list_items` rows.

**Convention compliance:**
- Convention 249: outcome-named ("Create a Rewards List")
- Convention 250: save-and-return via WizardProgressSaver
- Convention 251: AI assistance ("Let AI suggest rewards")
- Convention 252: Bulk-AI-Add on the items step
- Convention 255: friction-first (can deploy with 1 item minimum)
- Human-in-the-Mix on all AI suggestions

**Empty state:** "No rewards lists yet. Create one to use with treasure boxes, spinners, and milestone charts."

### Worker C: Repeated Action Chart Wizard + Potty Chart Template
**Scope:** The wizard that creates potty charts, reading goals, chore streaks, etc.

**Wizard steps:**
1. **Name the chart** — "Potty Chart for Ruthie", "Reading Goal", etc. Pre-filled from template if using one.
2. **Pick the action** — what triggers each mark: task completion (default), routine step, or custom. For potty chart: creates a "Used the potty!" task.
3. **Chart display** — pick visual: star chart widget (tally) and/or coloring reveal. Configure:
   - Star chart: which widget style
   - Coloring reveal: pick image from coloring_reveal_library (32 Woodland Felt options), pick step count (5/10/15/20/30/50)
4. **Milestones & rewards** — configure what happens at milestones:
   - Every Nth (e.g., every 5th): treasure box → pick or create a rewards list (routes to Rewards List Wizard if needed)
   - At specific count (e.g., trip 50): special prize (text reward or from list)
   - Coloring reveal completion milestones (every 10th if using 10-zone images): treasure box reveals the new coloring page
5. **Assign to kid** — MemberPillSelector, per-kid instance
6. **Review & Deploy**

**Composition output (contracts created):**
- `widget_data_point_godmother` contract: every_time → auto-tally star chart
- `coloring_reveal_godmother` contract: every_time → advance one zone (with auto_init + grant_fresh_on_complete)
- `prize_godmother` contract(s): every_nth → treasure box from reward list at milestones
- `prize_godmother` or `custom_reward_godmother`: on_threshold_cross → special prize at chart completion

**Seeded template: Potty Chart**
Pre-fills: 50 trips, star chart, 10-zone coloring reveal (5 pages), treasure box every 5 trips (odd fives), coloring page reveal every 10 trips (even tens), "I DID IT!" special at 50.

**SCOPE-2.F62 note:** Uses Build M coloring reveal shape (1:1 source-linked tally). Document that Sequential/Gradual/Random reveal strategies from PRD-24B are roadmap.

### Worker D: List + Reveal + Assignment Wizard + Templates + NEW-WW
**Scope:** The two-flavor wizard + both seeded templates + per-line-item reward picker (NEW-WW triage fold-in).

**Flavor selection (Step 1):** Two big cards:
- "Opportunity — kids browse & earn" → opportunity path
- "Draw — spin or reveal, assign result" → draw path

**Opportunity path steps:**
1. Flavor selection
2. Create or pick a list — BulkAddWithAI for items
3. **Per-item reward config** (NEW-WW fold-in): for each item, set reward type (money/points/custom), amount, reveal wrapper, approval required
4. Who can browse — MemberPillSelector
5. Claim rules — lock duration, max completions, subtask templates
6. Review & Deploy

**Draw path steps:**
1. Flavor selection
2. Create or pick a list — BulkAddWithAI for items (consequences, activities, etc.)
3. Reveal animation — pick from AttachRevealSection (spinner, mystery box, card flip)
4. Person-pick config — person-first (pick kid, then spin) vs draw-first (spin, then assign)
5. Skip rules — mom can skip (always yes), kid can skip (configurable)
6. Deploy target — dashboard widget, routine step, or standalone
7. Review & Deploy

**Seeded template: Consequence Spinner**
Pre-fills: 8 sample consequences, draw flavor, spinner reveal, person-pick-first, mom-can-skip/kid-cannot.

**Seeded template: Extra Earning Opportunities**
Pre-fills: 8 sample jobs with dollar amounts ($5-$30), opportunity flavor, claim-lock, mom approval required.

**SCOPE-3.F14 handling:** If the assigned kid has no active allowance period when deploying an opportunity that pays money, show an inline prompt: "Allowance isn't set up for [Name] yet. Money earned will go to their balance — set up allowance in Settings to track it properly." Don't block deployment.

### Worker E: NLC Entry Point + Studio Integration + Testing
**Scope:** Natural Language Composition entry point, Studio shelf integration, and E2E verification.

1. **Natural Language Composition entry point on Studio**
   - Text input at top of Studio: "Describe what you want to create"
   - Haiku parses description → identifies wizard type + pre-fills fields
   - Opens the matching wizard pre-populated
   - Fallback: "Based on what I'm hearing — [restate] — these wizards might fit. Want to try one?"
   - Human-in-the-Mix on all AI-proposed fields

2. **Studio shelf integration**
   - Add "Setup Wizards" category section to Studio Browse tab
   - Three seeded template cards: Potty Chart, Consequence Spinner, Extra Earning Opportunities
   - Each card: outcome name, warm description, [Customize] button opens the wizard pre-filled
   - "Create Your Own" cards for each wizard type (blank start)

3. **Drafts integration**
   - Drafts tab/section in Studio showing in-progress wizard skeletons
   - Resume flow: "We saved this from last time. Continue or start fresh?"

4. **E2E testing scenarios:**
   - Mom creates Rewards List (5 items) via wizard
   - Mom uses Potty Chart template → customizes for kid → deploys → verifies 6 contracts created
   - Mom uses Consequence Spinner template → spins → verifies task assignment
   - Mom uses Extra Earning Opportunities → kid claims → completes → verifies money credits
   - Mom uses NLC: "I want a potty chart for Ruthie" → correct wizard opens pre-filled
   - Mom saves draft mid-wizard → returns → resumes at correct step

---

## Coordination Rules

### Dependencies Between Workers
```
Worker A (infrastructure) ──┬── Worker B (Rewards List Wizard)
                            │         │
                            │         ├── Worker C (Repeated Action Chart + Potty Chart)
                            │         │
                            │         └── Worker D (List + Reveal + Assignment + Templates)
                            │                    │
                            └────────────────────┴── Worker E (NLC + Studio + Testing)
```

Worker A must complete before B/C/D can start.
Worker B must complete before C and D (both reference reward lists).
Workers C and D can run in parallel after B.
Worker E runs last (integrates everything).

### Phase 3 Connector Dependency
Phase 3 must be closed out before Phase 3.7 workers deploy contracts. The following godmothers must exist:
- `prize_godmother` (Worker C+D treasure boxes)
- `custom_reward_godmother` (Worker C special prizes)
- `money_godmother` (Worker D opportunity earnings)
- `assign_task_godmother` (Worker D consequence/opportunity task creation)
- `creature_godmother` (Worker C optional creature roll)
- `coloring_reveal_godmother` (Worker C coloring reveal advance)
- `widget_data_point_godmother` (Worker C star chart auto-tally)
- `page_unlock_godmother` (Worker C optional page unlock)

Verify these exist before dispatching Worker C. Run: `SELECT proname FROM pg_proc WHERE proname LIKE 'execute_%_godmother';`

### Conventions to Enforce
- Convention 249: Every wizard named by outcome, not tool type
- Convention 250: Save-and-return + Drafts page
- Convention 251: AI assistance at every creation surface
- Convention 252: Bulk-AI-Add on every multi-item surface
- Convention 253: Natural Language Composition entry point
- Convention 255: Friction-first design (where would mom quit?)
- Convention 121: `tsc -b` zero errors after every worker
- Human-in-the-Mix on ALL AI-generated content

### Checkpoint Protocol
Run all 6 checkpoints per `.claude/rules/orchestrator.md`:
1. **Pre-build summary** — present to founder before code
2. **Inter-worker** — after each worker, before dispatching next: deliverables present + tsc clean + mom-UI verification
3. **Pre-commit** — automatic via hooks
4. **Pre-push** — automatic via hooks
5. **Post-build audit** — zero Missing items in verification table
6. **Close-out / baton-pass** — state files updated, handoff clean

### Mom-UI Verification
This build is heavily UI. Every wizard step must be verified in browser at desktop + mobile widths. The verification table in the active build file must have a row per wizard surface.

---

## Source Material

### Required Reading (for pre-build)
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §8 (Phase 3.7 spec)
- `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md` (wizard design patterns)
- `claude/web-sync/TRIAGE_WORKSHEET.md` (fold-in items: NEW-WW, SCOPE-2.F61, SCOPE-3.F14, NEW-QQ, SCOPE-2.F62)
- `src/pages/Studio.tsx` (current Studio structure, existing wizard pattern)
- `supabase/migrations/00000000100225_creature_page_unlock_godmothers.sql` (creature + page unlock godmothers)
- `supabase/migrations/00000000100228_coloring_reveal_widget_godmothers.sql` (coloring reveal + widget data point godmothers)
- `supabase/migrations/00000000100126_earning_strategies_color_reveal.sql` (coloring reveal schema + advance_coloring_reveal RPC)
- `specs/studio-seed-templates.md` (founder's Studio mental model)

### Existing Wizard Pattern (follow this)
Studio.tsx already has 5 wired wizards: `StarChartWizard`, `GetToKnowWizard`, `RoutineBuilderWizard`, `MeetingSetupWizard`, `UniversalListWizard`. Each uses:
- State variable `xxxWizardOpen` (boolean)
- ModalV2 wrapper
- `isOpen` / `onClose` / `familyId` / `memberId` props
- Success callback that closes wizard + refetches data

### Key Tables (already exist)
- `contracts` — the central switchboard (Phase 3)
- `deed_firings` — event log (Phase 3)
- `reveal_animations` — 33 animation rows
- `coloring_reveal_library` — 32 Woodland Felt images with zone sequences
- `member_coloring_reveals` — per-member coloring reveal progress
- `dashboard_widgets` + `widget_data_points` — tracker widgets
- `widget_starter_configs` — 39 pre-configured tracker templates
- `lists` + `list_items` — all list types
- `earned_prizes` — prize IOUs

---

## Getting Started

1. Run `/orchestrate status` to see current build state
2. Verify Phase 3 is closed out (check `.claude/rules/current-builds/`)
3. Run the pre-build process: create feature decision file + active build file
4. Present pre-build summary to founder for approval
5. On approval, generate Worker A dispatch prompt and present it

**Do not write code. Generate dispatch prompts. Coordinate workers. Run checkpoints.**
