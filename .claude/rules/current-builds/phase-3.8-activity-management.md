# Phase 3.8 — Activity Management

## Status: ACTIVE

## Source Material

- **Dispatch doc:** `.claude/state/phase3.8-activity-management-dispatch.md`
- **Composition patterns:** `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md` §§2.1–2.10
- **Feature decision file:** `claude/feature-decisions/Phase-3.8-Activity-Management.md`

### Infrastructure Verified (2026-05-04)
- `list_items` per-item recurrence columns: ALL exist (is_repeatable, frequency_min/max, frequency_period, cooldown_hours, max_instances, completed_instances, period_completion_count, last_completed_at)
- `FrequencyRulesEditor` component exists (close match for ItemRecurrenceConfig)
- 13 wizard files in `src/components/studio/wizards/`, useWizardDraft hook ready
- Contract IF patterns: `above_daily_floor` fully implemented (types + SQL)
- Randomizer draw modes: focused/buffet/surprise + DrawModeSelector component
- Math gate: MathGate.tsx (generic) + RedrawButton.tsx (inline) — both ready
- promoted_to_task/promoted_task_id: schema exists, partial write logic in useLists, NOT wired as full promotion flow
- assign_task_godmother: fully implemented RPC
- PlayTaskTile: renders 72x72 icons from platform_assets, grouped by segment
- TaskIconPicker/TaskIconBrowser: exist for visual schedule assets, adaptable for icon launcher
- Widget types: 35 total (19 trackers + 12 info + 4 actions). No icon_launcher yet.
- Sequential collections: exist but no explicit browse-ahead mode

### Gaps Confirmed
1. No `ItemRecurrenceConfig` component — needs building (adapt from FrequencyRulesEditor)
2. No icon launcher widget type — new
3. No sequential-with-browse mode — new concept
4. No general-purpose platform asset picker — adapt TaskIconPicker
5. Claim-to-task promotion flow not wired — schema only

---

## Pre-Build Summary

### Layer 1: Per-Item Recurrence Component (Foundation)

**Reusable `ItemRecurrenceConfig` component** with three modes:
- **One-time** — done once, leaves the pool (`max_instances: 1`)
- **Recurring** — comes back on schedule (weekly/monthly/custom via `frequency_period` + `cooldown_hours`)
- **Always available** — default, rotates normally (`is_repeatable: true`, no cooldown)

**Wire into:**
1. ListRevealAssignmentWizard (both opportunity + draw paths) — per item alongside reward config
2. List detail view for compatible types (opportunity, randomizer, todo, custom) — inline per-item control
3. New wizards in Layers 2 and 3

### Layer 2: Activity List Wizard + Cross-Shell Surfaces

**ActivityListWizard** — new outcome-named wizard:
- Step 1: Name the subject (e.g., "Reading Fun", "Math Fun", "PE")
- Step 2: Add activities (BulkAddWithAI + per-item recurrence config)
- Step 3: Display mode picker (Random / Browse / Sequential-with-browse)
- Step 4: Daily requirement (floor count + extra credit flag via `above_daily_floor` contract)
- Step 5: Reward configuration (points/creatures/pages, per-subject vs combined thresholds)
- Step 6: Assign to kids → deploy

**Icon Launcher Widget** — new widget type `icon_launcher`:
- platform_assets icon (72x72) + label + linked list
- Play dashboard: big tappable tiles side by side
- Tap → draw from linked list → reveal animation → Claim / Dismiss
- Dismiss → MathGate speed bump (Play shell only)
- Claim → creates task on kid's board via assign_task_godmother or direct task creation

**Random/Browse Dual-Mode:**
- Render-time UX toggle: "Surprise me" (random draw) or "Let me pick" (browse full list)
- Not a list-level config — same list supports both modes at access time
- Guided dashboard: "Homeschool Variety" tile with mode toggle
- Independent: same at independent density

**Sequential-with-Browse Override:**
- Sequential position tracks "what's next" for the drip
- Kid can browse all items and complete any out of order
- Position advances on completion of the "next" item, or stays if they completed ahead

**Daily Floor + Extra Credit:**
- Wizard exposes "How many per day are required?" input
- Generates contract with `above_daily_floor` IF pattern
- First N completions = required, rest = extra credit via `is_extra_credit` flag
- Reward thresholds: per-subject (each list has own creature contract) OR combined (single contract across lists)

**Seeded Templates:**
1. "Reading Fun Activities" — reading-specific activities with Random/Browse mode
2. "Homeschool Variety Pack" — multi-subject sampler

### Layer 3: Honey-Do Shared Task List Wizard

**SharedTaskListWizard** — "Create a Shared To-Do":
- Step 1: Name the list (default: "Honey-Do List")
- Step 2: Add items (BulkAddWithAI + per-item recurrence + optional "big job" flag for Task Breaker)
- Step 3: Share with specific people (member picker)
- Step 4: Claim behavior (claim-to-promote on/off, approval on completion on/off)
- Step 5: Deploy

**Claim-to-Task Auto-Promotion:**
- Claiming sets `in_progress_member_id` + creates `tasks` row with `source='list_promotion'`
- Links via `list_items.promoted_task_id`, sets `list_items.promoted_to_task=true`
- Task Breaker works automatically on promoted task (no additional wiring)

**Completion Write-Back:**
- When promoted task completes → source list item: `checked=true`, `checked_by=completer_id`, `checked_at=now()`
- Visible on shared list: "[Name] completed this"

**Seeded Template:**
- "Honey-Do List" — pre-filled with common household tasks

### Out of Scope (Explicit Stubs)
- LiLa context from activity completion patterns
- Offline activity lists (PRD-33)
- Cross-family sharing / community templates
- Activity list scheduling (painted/recurring)
- Analytics for activity patterns (PRD-32)

---

## Worker Breakdown

### Worker A: Per-Item Recurrence Component + List Detail Wiring
- Build `ItemRecurrenceConfig` reusable component (adapt from FrequencyRulesEditor)
- Wire into ListRevealAssignmentWizard (both opportunity + draw paths)
- Wire into list detail view for compatible types
- Playwright test: create opportunity list with mix of one-time + recurring items

### Worker B: Activity List Wizard + Seeded Templates
- New wizard: `ActivityListWizard`
- Seeded templates: "Reading Fun Activities", "Homeschool Variety Pack"
- Random/Browse dual-mode UI
- Daily floor configuration
- Reward threshold config (per-subject vs combined)
- Sequential-with-browse-override hybrid mode
- Icon picker (adapt TaskIconPicker for platform_assets) integration

### Worker C: Play Dashboard Icon Launchers + Guided/Independent Surfaces
- New widget type: icon_launcher (icon + label + linked list)
- Play dashboard rendering: big tappable icons
- Tap → draw → reveal → Claim/Dismiss flow
- Dismiss math gate (reuse MathGate.tsx)
- Claim → task creation on kid's board
- Guided dashboard "Homeschool Variety" tile with Random/Browse toggle
- Independent rendering at independent density

### Worker D: Honey-Do Shared Task List Wizard
- New wizard: `SharedTaskListWizard` ("Create a Shared To-Do")
- Claim-to-task promotion wiring (list_items → tasks via promoted_task_id)
- Completion write-back (task complete → list item checked)
- Task Breaker integration confirmation on promoted items
- Seeded template: "Honey-Do List"

### Worker E: Integration + Testing
- NLC routing for new wizard types
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

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| List detail — per-item recurrence inline controls | Mom, Adult, Independent | New |
| ListRevealAssignmentWizard — per-item recurrence row | Mom | Modification |
| ActivityListWizard (6 steps) | Mom | New |
| Studio Browse — Activity List wizard card | Mom | Modification (add to shelf) |
| Studio Browse — seeded template cards (2 new) | Mom | Modification |
| Play Dashboard — icon launcher tiles | Play | New |
| Guided Dashboard — "Homeschool Variety" tile | Guided | New |
| Independent — activity list browsing | Independent | New |
| SharedTaskListWizard (5 steps) | Mom | New |
| Studio Browse — Shared To-Do wizard card | Mom | Modification |
| Shared list — claim-to-task promotion UX | Mom, Adult | Modification |
| Shared list — completion write-back display | Mom, Adult | Modification |

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Per-item recurrence controls | | | | | | |
| ActivityListWizard | | | | | | |
| Studio shelf cards | | | | | | |
| Play icon launchers | | | | | | |
| Guided Variety tile | | | | | | |
| Independent activity browse | | | | | | |
| SharedTaskListWizard | | | | | | |
| Claim-to-task promotion | | | | | | |
| Completion write-back | | | | | | |

---

## Conventions to Enforce
- Convention 249: Wizard named by outcome
- Convention 250: Save-and-return + Drafts (reuse useWizardDraft)
- Convention 251: AI assistance at every creation surface
- Convention 252: Bulk-AI-Add on every multi-item surface
- Convention 253: Natural Language Composition routing
- Convention 255: Friction-first design
- Convention 121: `tsc -b` zero errors after every worker
- Convention 215: Math gate pattern for dismiss
- Convention 268: List claim semantics (in_progress_member_id)
- Human-in-the-Mix on ALL AI-generated content

---

## Open Questions — Founder Answers (2026-05-04)

1. **Sequential-with-browse storage:** `allow_out_of_order BOOLEAN DEFAULT false` on `sequential_collections`. **Approved.**

2. **Per-subject vs combined reward thresholds:** Wizard-step choice during creation AND editable later in gamification settings. Both places. **The wizard must tell mom exactly where to find and change this in the future** — e.g., "You can change this anytime in Settings → [child name] → Gamification." **Approved.**

3. **Icon launcher widget creation flow:** Wizard auto-creates icon launcher widgets on assigned kids' dashboards. Mom picks the icon via semantic search against `platform_assets` — type "reading" and book/reading icons surface, mom picks the one she wants. That becomes the dashboard tile image. Mom can remove/rearrange later. **Approved.**

4. **Reveal animation on icon launcher tap:** Mom can pick ANY reveal style (treasure box, cards, doors, spinner, scratch-off) — configurable per list in the wizard. **Default:** a simple card that twirls/sparkles and shows the activity, with either the icon library image or just text. **Approved.**

5. **Honey-Do "big job" flag:** Just surface a "Break this down" button on the promoted task. Do NOT auto-trigger Task Breaker — Human-in-the-Mix. **Approved.**

---

## Fold-In: Task Breaker Vault Entry Fix

**Priority: Fix alongside Phase 3.8 work (Worker A or earliest worker).**

**Problem:** The AI Vault's "Task Breaker" entry routes through `lila-chat` via the `task_breaker` guided mode in `lila_guided_modes`. This opens a LiLa conversation that tries to chat with mom instead of breaking down the task. The founder tried it and it had a conversation instead of producing subtasks.

**Root cause:** Task Breaker is a **Category 2 native utility tool** (Convention 248) — it has its own dedicated `task-breaker` Edge Function and should NOT use the LiLa conversation pipeline. The working Task Breaker is the `StandaloneTaskBreakerModal` accessible from the QuickTasks strip (Zap icon) and inside TaskCreationModal.

**Fix:**
1. Update the Vault's Task Breaker `vault_items` row: set `guided_mode_key = NULL` so it stops routing to `lila-chat`
2. Wire the Vault's "Launch" action for Task Breaker to open `StandaloneTaskBreakerModal` instead of a LiLa conversation
3. Optionally deactivate the `task_breaker` row in `lila_guided_modes` (`is_active = false`) since it's architecturally wrong — Task Breaker is not a LiLa mode, it's a standalone utility

**Verify:** Open AI Vault → find Task Breaker → tap Launch → should open the standalone modal with task name input + detail level picker + "Break it down" button, NOT a conversation.
