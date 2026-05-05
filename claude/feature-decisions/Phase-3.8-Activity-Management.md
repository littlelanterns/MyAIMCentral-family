# Feature Decision File: Phase 3.8 — Activity Management

> **Created:** 2026-05-04
> **Source:** `.claude/state/phase3.8-activity-management-dispatch.md` (founder dispatch)
> **Cross-references:**
>   - `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md` (wizard conventions 249-255)
>   - `claude/web-sync/Connector-Build-Plan-2026-04-26.md` (connector architecture)
>   - `specs/studio-seed-templates.md` (Studio mental model)
>   - `claude/feature-decisions/Phase-3.7-Wizards-Seeded-Templates.md` (wizard infrastructure)
>   - `claude/feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md` (earning modes)
> **Founder approved:** pending

---

## What Is Being Built

Three layers of activity and task management extending the Phase 3 connector layer:

1. **Per-Item Recurrence UI** — reusable component exposing the existing `list_items` recurrence columns (is_repeatable, frequency_period, cooldown_hours, max_instances) that are already in the schema but have no UI. Wired into Phase 3.7 wizards and list detail views.

2. **Activity List Wizard + Cross-Shell Surfaces** — subject-based activity management (e.g., "Reading Fun", "Math Fun", "Homeschool Variety") that works as icon launchers on Play dashboard, dual-mode (Random/Browse) tiles on Guided dashboard, and browsable lists on Independent. Includes daily floor requirements via existing `above_daily_floor` contract IF pattern, and per-subject vs combined reward thresholds.

3. **Honey-Do Shared Task List Wizard** — shared browsable list between adults where claiming an item auto-promotes it to the claimer's personal task list. Task Breaker integration on promoted items. Completion write-back from task to source list item.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| `ItemRecurrenceConfig` | Reusable component: one-time / recurring / always-available modes. Wraps existing `list_items` frequency columns. |
| ListRevealAssignmentWizard — per-item recurrence | Wire `ItemRecurrenceConfig` inline per item row in both opportunity + draw flavors |
| List detail view — per-item recurrence | Inline `ItemRecurrenceConfig` on compatible list types (opportunity, randomizer, todo, custom) |
| `ActivityListWizard` | New wizard: name subject → add activities (with per-item recurrence) → display mode (Random/Browse/Sequential-with-browse) → daily requirement → reward config → assign → deploy |
| Seeded template: "Reading Fun Activities" | Pre-fills ActivityListWizard with reading-related activities |
| Seeded template: "Homeschool Variety Pack" | Pre-fills ActivityListWizard with multi-subject variety activities |
| Icon Launcher widget (`icon_launcher` widget type) | New dashboard widget: platform_assets icon + label + linked list. Tap → draw → reveal → Claim/Dismiss |
| Play dashboard icon launcher rendering | Big tappable icon tiles on PlayDashboard, side-by-side layout |
| Random/Browse dual-mode toggle | Render-time UX: kid chooses "Surprise me" (random draw) or "Let me pick" (browse). Not a list config change. |
| Sequential-with-browse-override | Sequential position tracking preserved, but kid can browse ahead and complete out of order. Hybrid mode. |
| Dismiss with math gate (Play shell) | Reuse MathGate.tsx pattern for dismiss action — prevents kids from fishing for preferred activities |
| Guided "Homeschool Variety" tile | New tile on GuidedDashboard with Random/Browse toggle |
| Independent activity list rendering | Standard list view at independent density |
| `SharedTaskListWizard` | New wizard: "Create a Shared To-Do" — name → add items (with per-item recurrence + optional Task Breaker flag) → share with people → claim config → deploy |
| Claim-to-task auto-promotion | Claiming a list item creates a `tasks` row on claimer's personal list via `promoted_task_id` |
| Completion write-back | Task completion → source list item marked checked via `promoted_task_id` FK |
| Seeded template: "Honey-Do List" | Pre-fills SharedTaskListWizard with household task items |
| Daily floor configuration UI | In ActivityListWizard: "How many per day are required?" slider/input, extras flagged as extra credit |
| Reward threshold config | Per-subject vs combined thresholds for creature/page earning |

---

## Key Decisions (Easy to Miss)

1. **Per-item recurrence is purely UI.** The `list_items` schema already has all the columns (`is_repeatable`, `cooldown_hours`, `frequency_min`, `frequency_max`, `frequency_period`, `max_instances`, `completed_instances`, `period_completion_count`, `last_completed_at`). The gap is a reusable component + wiring it into creation/edit surfaces.

2. **Random/Browse is a render-time choice, NOT a list-level config.** A single activity list supports both — the kid picks at access time. The list's existing `draw_mode` remains for the randomizer draw behavior; this is a separate UX toggle.

3. **Sequential-with-browse doesn't lock future items.** The sequential position still advances for the drip (next suggested item), but the kid can browse all items and complete any of them out of order. This is a hybrid of `sequential_collections` + browsable list.

4. **Daily floor uses existing `above_daily_floor` contract IF pattern.** The wizard needs to compose a contract with this IF pattern — wizard UI exposes "how many per day are required?" and the generated contract handles the rest (first N = required, extras = extra credit).

5. **Claim-to-task promotion flow:** Claiming a shared list item creates a task row with `source='list_promotion'`, links via `list_items.promoted_task_id`, and sets `list_items.promoted_to_task=true`. When the task completes, a write-back sets `list_items.checked=true` and `checked_by`.

6. **Icon launcher is a NEW widget type**, not a Play-only construct. It's a `dashboard_widgets` row with `template_type='icon_launcher'` and `widget_config` containing `{ linked_list_id, icon_asset_key, icon_variant, display_label }`. It can sit on any dashboard but is designed primarily for Play.

7. **Dismiss math gate reuses existing `MathGate.tsx`** from `src/components/beta/`. Same simple addition problems, same silent dismissal on wrong answer. Prevents kids from fishing for preferred activities.

8. **Both kids share the same activity lists** — shared lists per Workers 2+3 infrastructure. Both can mark things off.

9. **Reward thresholds are per-subject vs combined.** Mom can configure "every 3 completed activities earn a creature" per-subject (each subject list has its own creature contract) or combined (a single contract counts completions across all linked lists).

10. **Task Breaker on promoted Honey-Do items works automatically** — once a list item is promoted to a task via `promoted_task_id`, the task is a regular `tasks` row and TaskBreaker already works on any task. No additional wiring needed.

---

## Database Changes Required

### New Tables
None anticipated — all infrastructure tables exist.

### Modified Tables (columns being added)
- `lists` — possibly `display_mode TEXT` for Random/Browse/Sequential-with-browse (or handled via widget_config). TBD during Worker B.
- `sequential_collections` — possibly `allow_out_of_order BOOLEAN DEFAULT false` for the browse-ahead capability. TBD during Worker B.

### New Widget Type Registration
- `icon_launcher` added to widget type system in `src/types/widgets.ts`
- Widget starter configs for icon launcher in `widget_starter_configs` table seed

### Migrations
- Migration 100231 (tentative): any schema additions needed after Worker B scoping confirms what's purely UI vs needs DB support.

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `activity_list_wizard` | Essential | primary_parent | Activity List wizard access |
| `shared_task_list_wizard` | Essential | primary_parent | Shared To-Do / Honey-Do wizard |
| `icon_launcher_widget` | Essential | all | Icon launcher widget on dashboards |

---

## Stubs — Do NOT Build This Phase

- [ ] LiLa context from activity completion patterns (future)
- [ ] Offline activity lists (PRD-33)
- [ ] Cross-family activity list sharing / community templates (future)
- [ ] Guided Form integration in activity lists (PRD-25 follow-on)
- [ ] Analytics dashboard for activity completion patterns (PRD-32)
- [ ] Activity list scheduling (painted/recurring) — exists on lists but not exposed in this wizard yet
- [ ] Sequential-collection-as-activity-list (the sequential-with-browse hybrid is list-based, not sequential_collections-based, unless Worker B determines otherwise)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Activity List wizard | → | Lists system (PRD-09B) | Creates `lists` + `list_items` rows |
| Activity List wizard | → | Contracts (Phase 3) | Composes contracts for daily floor + earning thresholds |
| Icon launcher widget | → | Dashboard widgets (PRD-10) | Creates `dashboard_widgets` rows with `template_type='icon_launcher'` |
| Icon launcher widget | → | Lists (draw) | Draws from linked list via `widget_config.linked_list_id` |
| Claim-to-task promotion | → | Tasks (PRD-09A) | Creates `tasks` rows via `promoted_task_id` |
| Task completion write-back | ← | Tasks (PRD-09A) | Reads `tasks.completed_at` → writes `list_items.checked` |
| Dismiss math gate | ← | MathGate (PRD-24/26) | Reuses `src/components/beta/MathGate.tsx` |
| Per-item recurrence | ← | Phase 3.7 wizards | `ItemRecurrenceConfig` wired into ListRevealAssignmentWizard |
| Earning thresholds | → | creature_godmother + page_unlock_godmother | Via contracts with `every_nth` / `on_threshold_cross` IF patterns |

---

## Things That Connect Back to This Feature Later

- **Phase 3.5 Multi-Pool Allowance** — activity lists could contribute to allowance pools
- **PRD-28B Compliance Reporting** — homeschool activity completion feeds into time logs
- **PRD-37 Family Feeds** — activity completion moments surface on family feed
- **BigPlans (PRD-29)** — activity lists could be components of larger project plans

---

## Founder Answers to Open Questions (2026-05-04)

1. **Sequential-with-browse:** `allow_out_of_order BOOLEAN DEFAULT false` on `sequential_collections`. Approved.
2. **Per-subject vs combined reward thresholds:** Wizard-step choice during creation AND editable later in gamification settings. Wizard must tell mom where to find this setting later.
3. **Icon launcher auto-creation:** Wizard auto-creates icon launcher widgets on assigned kids' dashboards. Mom picks icon via semantic search against `platform_assets`. Removable/rearrangeable later.
4. **Reveal animation:** Mom can pick ANY reveal style, configurable per list in wizard. Default: simple card that twirls/sparkles and shows the activity.
5. **Honey-Do "big job" flag:** Surface "Break this down" button on promoted task. Do NOT auto-trigger Task Breaker (HITM).

## Fold-In: Task Breaker Vault Entry Fix

Task Breaker Vault entry routes through `lila-chat` instead of `StandaloneTaskBreakerModal`. Fix: set `guided_mode_key = NULL` on vault_items row, wire Launch to open StandaloneTaskBreakerModal, deactivate `task_breaker` lila_guided_modes row.

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct
- [x] Feature keys identified
- [x] **Approved to build** — 2026-05-04

---

## Post-Build PRD Verification

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
