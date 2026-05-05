# Phase 3.8 — Activity Management & List Enhancements — Baton Pass

> Paste this into a fresh Claude Code session.
> This session orchestrates Phase 3.8: per-item recurrence, Activity List wizard, Honey-Do shared task list wizard, and supporting infrastructure.

---

## Where We Are

**Phase 3.7 is complete and deployed.** Committed as `0f7457b`, pushed to main, migration 100229 applied to production, 6/6 Playwright tests passing. Three wizards (Rewards List, Repeated Action Chart, List + Reveal + Assignment) + three seeded templates (Potty Chart, Consequence Spinner, Extra Earning Opportunities) + NLC entry point + Drafts tab + draft persistence all working.

**Active build file:** `.claude/rules/current-builds/phase-3.7-wizards-seeded-templates.md` — needs to be closed out and archived as part of this session's startup (run `/orchestrate close` first, then start Phase 3.8).

**Key context from the Phase 3.7 session:**
- The founder tested the wizards via Playwright, found 4 bugs (hidden seeded templates, missing headings, draft save failure, card title mismatch), all fixed and verified 6/6 passing.
- During testing, the founder identified feature gaps that became Phase 3.8 scope.

---

## What Phase 3.8 Ships

Three layers of work, all building on the Phase 3 connector layer and Phase 3.7 wizard infrastructure.

### Layer 1: Per-Item Recurrence (Foundation for Everything Else)

Every list with completable/assignable items needs per-item recurrence controls. The `list_items` schema already has the columns (`is_repeatable`, `cooldown_hours`, `frequency_min`, `frequency_max`, `frequency_period`, `max_instances`). The gap is purely UI.

**Build a reusable `ItemRecurrenceConfig` component** with three modes:
- **One-time** — done once, leaves the pool (`max_instances: 1`)
- **Recurring** — comes back on a schedule (weekly/monthly/custom via `frequency_period` + `cooldown_hours`)
- **Always available** — default, rotates through the pool normally (`is_repeatable: true`, no cooldown)

**Wire into:**
1. Both Phase 3.7 wizards (ListRevealAssignmentWizard opportunity + draw paths) — per item row alongside reward config
2. List detail view for compatible list types (opportunity, randomizer, todo, custom) — inline per-item control
3. The new wizards in this phase (Activity List + Honey-Do)

### Layer 2: Activity List Wizard + Play/Guided/Independent Surfaces

The founder needs subject-based activity management that works across all three kid shells.

#### Founder's Use Cases (Verbatim)

**For Play shell kids (Ruthie & Avigaile, ages ~3-5):**
- Subject-specific activity lists: Reading Fun, Math Fun, Arts/Crafts, PE, Outside
- Icon tiles on Play dashboard (from `platform_assets` icon library, mom labels them)
- Tap icon → reveal animation (scratch card or sparkle card with fireworks) → activity shown
- Claim → becomes a task on their board → mark complete when done
- Dismiss → math gate (adult-only) → item goes back in pool for later
- Both kids share the same lists, both can mark things off
- Every 3 completed activities → fresh sticker book creature
- Every 10 creatures → fresh sticker page
- Some activities repeat (read a chapter book), some are one-time (build a volcano)
- Flexibility to change reward thresholds later (per-subject vs combined)

**For Guided shell son:**
- "Homeschool Variety" tile on Guided dashboard
- Two modes: **Random** (draw one activity) or **Browse** (pick from full list)
- Daily requirement: 2 items per day minimum. Extras count as extra credit.
- Claim → Complete flow
- Sequential drip option for specific use cases (Seminary Make-up Work): next assignment appears when current finishes, but kid can browse ahead and work out of order

**For Independent shell:**
- Same as Guided but at independent density
- Can browse freely

#### What Already Exists
- Randomizer lists with draw modes (focused/buffet/surprise) ✅
- Sequential collections with drip ✅
- Browsable lists (`is_browsable` flag) ✅
- `platform_assets` table (622 rows, semantically embedded icons) ✅
- Contracts with `above_daily_floor` IF pattern ✅
- `assign_task_godmother` (draw → create task) ✅
- Claim/dismiss mechanics on opportunity items ✅
- `is_extra_credit` flag on tasks ✅
- Sticker book creatures + pages + earning godmothers ✅
- Shared lists (Workers 2+3) ✅
- Per-item recurrence columns on `list_items` ✅ (schema only, UI is Layer 1)

#### Gaps to Build
1. **Activity List wizard** — new wizard: name the subject → add activities (with per-item recurrence) → pick display mode (Random/Browse/Sequential-with-browse) → configure daily requirement (floor count + extra credit) → configure rewards (points/creatures/pages, per-subject vs combined thresholds) → assign to kids → deploy
2. **Icon launcher widget for Play dashboard** — a new widget type: icon (from platform_assets picker) + label + linked list. Tap → draw from list → reveal → Claim/Dismiss. Multiple icon launchers can sit on the Play dashboard side by side.
3. **Random/Browse dual-mode** on a single list — currently a list is one mode. Need a toggle at access time: kid can choose "Surprise me" (random draw) or "Let me pick" (browse full list). This is a render-time UX choice, not a list-level config change.
4. **Sequential-with-browse-override** — sequential collection tracks position (what's "next"), but allows kid to browse all items and complete out of order. Position still advances for the drip, but doesn't lock future items. Hybrid of sequential and browsable.
5. **Daily floor configuration** in wizard UI — the `above_daily_floor` IF pattern exists on contracts, wizard needs to expose "How many per day are required?" with extras as extra credit.
6. **Dismiss with math gate** — for Play shell, dismiss requires solving a simple math problem (adult speed bump, not security). Already exists in concept from redraw mechanism (Convention 215: `RedrawButton` math gate). Reuse the pattern.

### Layer 3: Honey-Do Shared Task List Wizard

A shared browsable list between specific adults (typically mom + dad) where items can be claimed and promoted to personal task lists.

#### Founder's Use Case (Verbatim)
- Shared list between mom and dad
- All the honey-do items go on it
- Both can browse it, both can mark things done
- Claiming an item puts it on the claimer's personal task list
- Claimed status shows on the shared list ("Mark is on it")
- Completed status shows on the shared list when done
- Task Breaker attached — big intimidating items can be broken down after claiming
- Mostly no rewards (just jobs) — but reward capability is there if wanted
- The point is: mom puts it on the list instead of nagging. Dad sees it. Whoever claims it does it.

#### What Already Exists
- Shared lists with member claims (`in_progress_member_id`) ✅ (Convention 268)
- `list_items.promoted_to_task` + `promoted_task_id` columns ✅ (schema exists)
- Task Breaker AI ✅ (works on tasks)
- Completion attribution (`checked_by`) ✅
- Member color rendering on claimed items ✅

#### Gaps to Build
1. **Claim-to-task auto-promotion** — claiming a list item creates a `tasks` row on the claimer's personal task list via `promoted_task_id`. Currently claim just sets `in_progress_member_id` without creating a task. The list_items schema has the columns, the flow isn't wired.
2. **Task Breaker on promoted items** — after claim→promote, the promoted task should surface Task Breaker naturally (Task Breaker already works on any task, so this may work automatically once promotion is wired).
3. **"Shared Task List" wizard** — new wizard: name the list → add items (with per-item recurrence + optional Task Breaker pre-break) → share with specific people → configure claim behavior (claim-to-promote on/off, approval on completion on/off) → deploy. Outcome-named: "Create a Shared To-Do" or "Honey-Do List."
4. **Completion-shows-on-shared-list feedback** — when a promoted task is completed, the source list item should show as completed too. This is a write-back from `tasks.completed_at` → `list_items.checked` via the `promoted_task_id` FK.

---

## Suggested Worker Breakdown

### Worker A: Per-Item Recurrence Component + List Detail Wiring
- Build `ItemRecurrenceConfig` reusable component
- Wire into ListRevealAssignmentWizard (both flavors)
- Wire into list detail view for compatible types
- Write Playwright test: create opportunity list with mix of one-time + recurring items

### Worker B: Activity List Wizard + Seeded Templates
- New wizard: `ActivityListWizard`
- Seeded templates: "Reading Fun Activities", "Homeschool Variety Pack"
- Random/Browse dual-mode UI
- Daily floor configuration
- Reward threshold config (per-subject vs combined)
- Sequential-with-browse-override hybrid mode
- Icon picker (from platform_assets) integration

### Worker C: Play Dashboard Icon Launchers + Guided/Independent Surfaces
- New widget type: icon launcher (icon + label + linked list)
- Play dashboard rendering: big tappable icons
- Tap → draw → reveal → Claim/Dismiss flow
- Dismiss math gate (reuse Convention 215 pattern)
- Claim → task creation on kid's board
- Guided dashboard "Homeschool Variety" tile with Random/Browse toggle
- Independent rendering at independent density

### Worker D: Honey-Do Shared Task List Wizard
- New wizard: `SharedTaskListWizard` ("Create a Shared To-Do")
- Claim-to-task promotion wiring (list_items → tasks via promoted_task_id)
- Completion write-back (task complete → list item checked)
- Task Breaker integration on promoted items
- Seeded template: "Honey-Do List"

### Worker E: Integration + Testing
- NLC routing for new wizard types ("activity list for reading" → ActivityListWizard, "honey do list" → SharedTaskListWizard)
- Studio shelf cards for new wizards + seeded templates
- Playwright E2E tests for all new flows
- tsc -b clean

### Dependencies
```
Worker A (recurrence component) ─┬── Worker B (Activity wizard)
                                 │         │
                                 │         └── Worker C (dashboard surfaces)
                                 │
                                 ├── Worker D (Honey-Do wizard)
                                 │
                                 └── Worker E (integration + tests, runs last)
```

A must complete first. B and D can run in parallel after A. C depends on B. E runs last.

---

## Phase 3.7 Close-Out (Do This First)

Before starting Phase 3.8, close out Phase 3.7:
1. Run `/orchestrate close` — updates BUILD_STATUS.md, moves build file to completed-builds, writes HISTORY entry
2. Update CURRENT.md
3. Then start the Phase 3.8 pre-build process

---

## Source Material for Pre-Build

- `.claude/rules/current-builds/phase-3.7-wizards-seeded-templates.md` — just-completed build (close out first)
- `claude/feature-decisions/Phase-3.7-Wizards-Seeded-Templates.md` — Phase 3.7 decisions
- `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md` — wizard design patterns, all conventions
- `claude/web-sync/Connector-Build-Plan-2026-04-26.md` — connector architecture context
- `src/components/studio/wizards/` — all existing wizard implementations (pattern reference)
- `src/components/studio/wizards/useWizardDraft.ts` — draft persistence (reuse for new wizards)
- `src/types/lists.ts` — ListType, per-item columns, opportunity types
- `src/types/contracts.ts` — Contract interface, IF patterns including `above_daily_floor`
- `supabase/migrations/00000000100126_earning_strategies_color_reveal.sql` — coloring reveal + sticker book schema
- `src/lib/connector/fireDeed.ts` — deed firing utility

### Key Schema References (list_items columns for per-item recurrence)
```
is_repeatable BOOLEAN
cooldown_hours INTEGER (via frequency columns)
frequency_min INTEGER
frequency_max INTEGER
frequency_period TEXT ('day' | 'week' | 'month')
max_instances INTEGER
completed_instances INTEGER
period_completion_count INTEGER
last_completed_at TIMESTAMPTZ
opportunity_subtype TEXT ('one_time' | 'claimable' | 'repeatable')
promoted_to_task BOOLEAN
promoted_task_id UUID FK tasks(id)
```

### Key Contract IF Patterns (already exist)
- `above_daily_floor` — "first N per day are required, rest are extra credit"
- `every_nth` — "every 3rd completion triggers reward"
- `on_threshold_cross` — "at 50 total, trigger special reward"
- `every_time` — "every completion triggers"

### Convention 215 Math Gate Pattern (reuse for Dismiss)
`RedrawButton` math gate: adult members must solve a simple math problem before redrawing. Same pattern applies to Dismiss on Play shell — prevents kids from fishing for preferred activities.

---

## Getting Started

1. Close out Phase 3.7 (`/orchestrate close`)
2. Run `/orchestrate status` to orient
3. Run the pre-build process for Phase 3.8
4. Present pre-build summary to founder for approval
5. On approval, generate Worker A dispatch prompt

**Do not write code. Generate dispatch prompts. Coordinate workers. Run checkpoints.**
