# Universal Capability Parity — Discovery Report 2 (Targeted Verification)

> **Generated:** 2026-04-29
> **Type:** Read-only targeted verification — no code changes
> **Context:** Follows up on the first discovery report with 11 specific behavior/architecture verifications identified during the founder's question-walkthrough.

---

## V1 — Shopping List Store-Aware Routing

### a. Where does the store value get stored?

**There is no dedicated "store" column on `list_items`.** Store grouping uses the existing `list_items.section_name` column. The AI bulk-add parsing writes detected store names into the parsed item's `category` field, which is then mapped to `section_name` at insert time.

Evidence:
- [Lists.tsx:853-862](src/pages/Lists.tsx#L853-L862) — The shopping-specific AI prompt instructs: *"Detect store names... Use them as the 'category' to group items by store."*
- [Lists.tsx:1207](src/pages/Lists.tsx#L1207) — At insert time: `section_name: item.category || undefined`
- [Lists.tsx:1477](src/pages/Lists.tsx#L1477) — Same mapping in the randomizer/other parsing path.

The `list_items.category` column also exists as a separate schema column, but for shopping lists, the AI parsing result's `.category` property is mapped to `section_name`, NOT to `list_items.category`. These are two different columns doing different things — see V10 for details.

### b. How does the AI Shopping Organizer assign the store value?

Two distinct flows exist:

**Flow 1 — Bulk-add at creation (SmartImportModal / inline add):** AI parsing via the `ai-parse` edge function (generic). Shopping-specific prompt at [Lists.tsx:853-862](src/pages/Lists.tsx#L853-L862) instructs Haiku to detect store names with store-continuity logic ("items between store mentions belong to the most recently mentioned store"). The parsed result's `category` field maps to `section_name` on insert.

**Flow 2 — Post-hoc "Organize by Store" button:** A dedicated function at [Lists.tsx:1658-1730](src/pages/Lists.tsx#L1658-L1730) (`handleOrganize`) sends existing items to the `ai-parse` edge function with a shopping-organization prompt. Mom enters store names (or leaves blank for auto-grouping). The AI returns `{storeName: [itemNames]}` JSON. Results are applied by updating each item's `section_name` — [Lists.tsx:1719](src/pages/Lists.tsx#L1719).

The UI trigger for Flow 2 is a "Organize by store with AI" tooltip button at [Lists.tsx:2113-2116](src/pages/Lists.tsx#L2113-L2116), with a preview/apply panel at [Lists.tsx:2571-2640](src/pages/Lists.tsx#L2571-L2640).

### c. Is there a "Group by..." selector?

**No.** There is no explicit "Group by store / Group by section / Group by category" toggle or selector in the list detail UI. The shopping list view groups items by `section_name` unconditionally — [Lists.tsx:1499-1501](src/pages/Lists.tsx#L1499-L1501):

```typescript
if (item.section_name) {
  if (!sections.has(item.section_name)) sections.set(item.section_name, [])
  sections.get(item.section_name)!.push(item)
```

Ungrouped items (no `section_name`) appear in an "Uncategorized" section. The only way to change grouping is to change the `section_name` values — either via the AI Organize flow or by manually editing the section dropdown per item ([Lists.tsx:1874](src/pages/Lists.tsx#L1874)).

### d. Is there a pattern for switching grouping dimensions?

**No.** The current codebase has no implemented or documented pattern for "same data, different grouping views." The closest thing is the Tasks page with its 13 prioritization views (ByCategoryView, EisenhowerView, etc.), but those are separate components rendering the same tasks dataset differently. No list surface has an equivalent multi-view selector.

---

## V2 — life_area_tag → life_area_tags Migration Shape

### a. Every place that reads `tasks.life_area_tag` or filters by it

| # | File:Line | Usage |
|---|---|---|
| 1 | [createTaskFromData.ts:108](src/utils/createTaskFromData.ts#L108) | Write on task insert: `life_area_tag: data.lifeAreaTag \|\| null` |
| 2 | [createTaskFromData.ts:522](src/utils/createTaskFromData.ts#L522) | Write on subtask insert (inherits from parent) |
| 3 | [Tasks.tsx:371](src/pages/Tasks.tsx#L371) | Write on task create: `life_area_tag: data.lifeAreaTag \|\| null` |
| 4 | [Tasks.tsx:975](src/pages/Tasks.tsx#L975) | Read for edit pre-population: `lifeAreaTag: editingTask.life_area_tag` |
| 5 | [DashboardTasksSection.tsx:259](src/components/tasks/DashboardTasksSection.tsx#L259) | Write on dashboard-inline create |
| 6 | [DashboardTasksSection.tsx:278](src/components/tasks/DashboardTasksSection.tsx#L278) | Read for edit pre-population |
| 7 | [ByCategoryView.tsx:90](src/components/tasks/views/ByCategoryView.tsx#L90) | **Key reader:** Groups tasks by `task.life_area_tag ?? 'uncategorized'` |
| 8 | [TaskCard.tsx:688-694](src/components/tasks/TaskCard.tsx#L688-L694) | Display: renders tag as badge with `.replace(/_/g, ' ')` |
| 9 | [TaskBreaker.tsx:138](src/components/tasks/TaskBreaker.tsx#L138) | Passes to task-breaker Edge Function |
| 10 | [task-breaker/index.ts:60,101-102](supabase/functions/task-breaker/index.ts#L60) | Edge Function: uses in context prompt ("Life area: {tag}") |
| 11 | [SequentialCreatorModal.tsx:79](src/components/tasks/sequential/SequentialCreatorModal.tsx#L79) | Write on sequential collection create |
| 12 | [SequentialCollectionView.tsx:286-288](src/components/tasks/sequential/SequentialCollectionView.tsx#L286-L288) | Display on collection detail |
| 13 | [useSequentialCollections.ts:153,345,363,385](src/hooks/useSequentialCollections.ts#L153) | Query select, inherit, restart |
| 14 | [extractTaskIconTags.ts:213](src/lib/assets/extractTaskIconTags.ts#L213) | Maps life_area_tag to icon search tags |
| 15 | [usePlayTaskIcons.ts:52](src/hooks/usePlayTaskIcons.ts#L52) | Passes life_area_tag to icon extraction |
| 16 | [OnTheHorizonSection.tsx:84,158](src/components/rhythms/sections/OnTheHorizonSection.tsx#L84) | Select + pre-populate for horizon tasks |
| 17 | [TaskBreakerModalFromHorizon.tsx:72,99](src/components/rhythms/sections/TaskBreakerModalFromHorizon.tsx#L72) | Inherits from parent task |
| 18 | [RecordVictory.tsx:50,61](src/components/victories/RecordVictory.tsx#L50) | Write on victory (victory.life_area_tag) |
| 19 | [VictoryDetail.tsx:19,43](src/components/victories/VictoryDetail.tsx#L19) | Edit victory life_area_tag |
| 20 | [VictoryRecorder.tsx:359,423](src/pages/VictoryRecorder.tsx#L359) | Display on victory cards |
| 21 | [VictorySuggestions.tsx:78,192](src/components/victories/VictorySuggestions.tsx#L78) | Display on suggestions |
| 22 | [DailyCelebration.tsx:161](src/components/victories/DailyCelebration.tsx#L161) | Write on celebration |
| 23 | [GuidedVictories.tsx:34,156](src/pages/GuidedVictories.tsx#L34) | Write + display on guided victory surface |
| 24 | [celebrate-victory/index.ts:75,253](supabase/functions/celebrate-victory/index.ts#L75) | Edge Function reads for celebration narrative |
| 25 | [scan-activity-victories/index.ts:154](supabase/functions/scan-activity-victories/index.ts#L154) | Edge Function: AI suggests life_area_tag |

**Distinct tables with life_area_tag:** `tasks`, `task_templates`, `sequential_collections`, `victories`

### b. Single-value assumption analysis

**Most readers are mechanical and would convert cleanly to array-contains:** ByCategoryView groups by `task.life_area_tag ?? 'uncategorized'` — this is the most structurally embedded single-value assumption, because it assumes ONE tag per task maps to ONE group. Multi-tag would need to place a task in MULTIPLE groups or use the first/primary tag.

**Places where single-value is structurally embedded:**
- [ByCategoryView.tsx:90](src/components/tasks/views/ByCategoryView.tsx#L90) — grouping logic assumes one tag. Multi-tag requires either "appears in all matching groups" or "primary tag" semantics.
- [extractTaskIconTags.ts:213](src/lib/assets/extractTaskIconTags.ts#L213) — maps life_area_tag to icon search terms. Would need to handle array.
- Edge functions that use the tag as a string in prompts (task-breaker, celebrate-victory) — straightforward `.join(', ')`.

**Everything else (writes, reads, badge display):** Mechanical change — swap `TEXT` for `TEXT[]`, change `= value` to `@> ARRAY[value]` or `value = ANY(column)`.

### c. Reference template for TEXT[] + GIN migration

**Yes.** `journal_entries.tags TEXT[]` with GIN index exists: [migration 000009:160](supabase/migrations/00000000000009_remediation_schema_batch.sql#L160):
```sql
CREATE INDEX IF NOT EXISTS idx_je_life_area ON journal_entries USING gin (life_area_tags);
```

Also `lists.tags TEXT[]` with GIN: [migration 100099](supabase/migrations/00000000100099_reference_list_tags.sql#L8):
```sql
CREATE INDEX IF NOT EXISTS idx_lists_tags ON lists USING GIN (tags);
```

Both use the same pattern: `TEXT[] DEFAULT '{}'` + GIN index. The migration pattern is consistent and reusable.

---

## V3 — Configure Item / List-Aware Editor Pattern

### a. Does any existing component implement a list-aware focused-item editor?

**No.** No component in the codebase implements the pattern described (parent list visible, focused item highlighted, capability palette alongside, shift focus without closing).

**Closest matches:**
1. **TaskCreationModal** (persistent modal type) — Opens for a single item, full-screen on mobile. Can edit any task property. But: no list context, no item-to-item navigation, no alongside palette.
2. **Lists.tsx inline item editing** — The list detail view renders all items inline with per-item expandable editors (section dropdown, notes, quantity, etc.) at [Lists.tsx:1874](src/pages/Lists.tsx#L1874). But: each item's editor is tiny (one field at a time), not a focused panel.
3. **SequentialCollectionView** — Renders collection items with expand/collapse cards. Each card has inline mastery/practice controls. But: no "focused item + config palette" pattern.

### b. BookShelf Chapter Jump FAB / bottom sheet

**Exists as a standalone component, not extracted as a reusable primitive.**

File: [src/components/bookshelf/ChapterJumpOverlay.tsx](src/components/bookshelf/ChapterJumpOverlay.tsx)

It implements: mobile-only (<768px) FAB button → bottom sheet overlay with scrollable navigation entries → tap an entry to scroll to that section. The component uses `useState(false)` for open/close, renders a fixed-position FAB, and a slide-up overlay. It's inline to the BookShelf feature — not a shared component.

### c. Other FAB-triggered bottom-sheet patterns

**Two additional instances found:**

1. **BoardOfDirectorsModal** ([src/components/lila/BoardOfDirectorsModal.tsx](src/components/lila/BoardOfDirectorsModal.tsx)) — Uses a FAB-like trigger for the persona panel.

2. **ModalV2** ([src/components/shared/ModalV2.tsx](src/components/shared/ModalV2.tsx)) — The shared modal system supports `persistent` type with minimize-to-pill behavior. Not a bottom sheet per se, but the architectural primitive for overlay patterns.

**No shared `<BottomSheet>` or `<FABSheet>` component exists.** The ChapterJumpOverlay pattern would need to be extracted into a reusable primitive before the Configure Item editor could use it.

---

## V4 — instantiation_mode and collaboration_mode Columns

### a. instantiation_mode

**Exists as a JSONB sub-field, NOT as a standalone schema column.**

`instantiation_mode` lives inside `SchedulerOutput` (TypeScript type at [src/components/scheduling/types.ts:37](src/components/scheduling/types.ts#L37)):
```typescript
instantiation_mode?: 'per_assignee_instance' | 'shared_anyone_completes' | null
```

It is persisted inside `recurrence_details JSONB` on tasks, or inside `schedule_config JSONB` on lists. It is NOT a top-level column on any table.

**Runtime consumers:**
- [TaskCreationModal.tsx:2176-2181](src/components/tasks/TaskCreationModal.tsx#L2176-L2181) — UI renders segmented control for mode selection when 2+ assignees
- [schedulerUtils.ts:48](src/components/scheduling/schedulerUtils.ts#L48) — Serialized into SchedulerOutput
- [schedulerUtils.ts:393](src/components/scheduling/schedulerUtils.ts#L393) — Deserialized back with default `'per_assignee_instance'`
- [fire-painted-schedules/index.ts:39,168](supabase/functions/fire-painted-schedules/index.ts#L39) — Read from schedule data in deed_firings
- [migration 100181](supabase/migrations/00000000100181_lists_schedule_config.sql#L14) — Documented as a JSONB sub-field of `lists.schedule_config`

**No top-level `instantiation_mode TEXT` column exists on `tasks` or `lists`.**

### b. collaboration_mode

**Does NOT exist anywhere in the schema or code.**

The only reference found is in the planning document [Universal-Capability-Parity-Principle.md:114](Universal-Capability-Parity-Principle.md#L114):
> "Shared items resolve via two existing properties (instantiation_mode + collaboration_mode)"

This is **documented intent only**, not shipped code. The concept (solo_claim vs collaborative) has no column, no enum, no hook, no UI.

### c. Closest existing mechanism for shared vs individual

The existing mechanism is `tasks.is_shared BOOLEAN` combined with `instantiation_mode` inside the scheduler output JSONB:

- `is_shared = false` → single assignee, or "Each of them" (per-assignee instances, independent)
- `is_shared = true` → "Any of them" (shared, anyone-can-complete)

The `is_shared` boolean is the current runtime discriminator. It is set in [createTaskFromData.ts:429](src/utils/createTaskFromData.ts#L429): `is_shared: assignees.length >= 2` (when "Any" mode is selected).

**No finer distinction** between "shared-anyone-completes" vs "shared-collaborative-progress" exists in shipped code. The Workers 2+3 scoping decisions would add this nuance.

---

## V5 — Soft-Claim Visibility on List Items via Task Join

### a. Does the list_items query/render layer join to active tasks?

**Only in the opportunity flow.**

`useActiveOpportunityClaims` at [useOpportunityLists.ts:406-426](src/hooks/useOpportunityLists.ts#L406-L426) queries tasks where `source='opportunity_list_claim'` and `status IN ('pending', 'in_progress', 'pending_approval')`. This is used by the opportunity browse surface to show which items are already claimed.

**The main list detail view (`Lists.tsx`) does NOT join to tasks.** It queries `list_items` directly and renders them with no awareness of any generated tasks.

### b. Does anything currently render "claimed by" or "in progress by" on a list item view?

**No.** The opportunity browse component ([OpportunityListBrowse.tsx](src/components/lists/OpportunityListBrowse.tsx)) shows items as "available" or not, but does not render a "Claimed by [Name]" indicator with the claimer's color. The standard list detail view has no claim/in-progress indicator at all.

### c. What would be required?

To surface the claimer's color and name on a list item from the joined task's `in_progress_member_id`:

1. The list detail query would need a secondary query: for each `list_item.id`, check if a `tasks` row exists where `source_reference_id = list_item.id` AND `status IN ('pending', 'in_progress')`.
2. From that task row, read `in_progress_member_id`.
3. Resolve to member color via `useMemberColor(memberId)`.
4. Render the outline + name indicator on the list item card.

This is a new join + render path. No existing infrastructure does this. The closest pattern is `useActiveOpportunityClaims` which does the task query but doesn't render per-list-item indicators.

---

## V6 — Per-Item Scheduling on Non-Opportunity Items

### a. Are scheduling columns consumed only by the opportunity claim flow?

**`claim_lock_duration`, `claim_lock_unit`:** Consumed ONLY by the opportunity claim flow in [useOpportunityLists.ts:184-185,210-211](src/hooks/useOpportunityLists.ts#L184-L185) and the claim-lock timer/expiration system in [useTaskClaims.ts](src/hooks/useTaskClaims.ts).

**`cooldown_hours`:** Consumed by BOTH the opportunity claim flow ([useOpportunityLists.ts:130-132](src/hooks/useOpportunityLists.ts#L130-L132)) AND the smart-draw system for randomizers ([useSmartDraw.ts:104,134,248,264](src/hooks/useSmartDraw.ts#L104)). The smart-draw uses `cooldown_hours` to prevent re-drawing a recently completed item.

### b. Infrastructure for scheduling a list item for a specific date/time?

**Entirely new.** `list_items` has no `due_date`, `start_date`, `recurrence_details`, or any date/time columns. The closest existing column is `list_items.item_date DATE` (exists in schema), but it's used for expenses tracking (date of purchase), not scheduling.

`lists.schedule_config JSONB` exists (migration 100181, Worker 5) for **list-level** scheduling (the entire list is active/inactive on certain dates). But this is a list-level property, not per-item.

### c. Does Universal Scheduler integrate with list items?

**No.** The Universal Scheduler (`src/components/scheduling/`) integrates with:
- Tasks (via `tasks.recurrence_details JSONB`) — primary consumer
- Lists (via `lists.schedule_config JSONB`) — list-level scheduling only
- Calendar events (via `calendar_events.recurrence_details JSONB`)
- Meetings (via `meeting_schedules.recurrence_details JSONB`)

No per-list-item scheduling exists. The Scheduler output type (`SchedulerOutput`) is designed to attach to a parent entity, not to individual items within a collection.

---

## V7 — Sequential Item Completion Pipeline and Rewards

### a. Does sequential item completion route through useCompleteTask?

**Yes, with a caveat.** Sequential items are `tasks` rows. When a sequential item is marked complete (advancement_mode='complete') or when mastery is approved (advancement_mode='mastery'), the completion goes through `useCompleteTask` at [useTasks.ts:383-519](src/hooks/useTasks.ts#L383-L519). This handles:
- Inserting `task_completions` row
- Updating task status
- Firing gamification pipeline
- Firing opportunity earning forward-write
- Auto-creating homework time logs

For practice sessions (not final completion), the flow goes through `useLogPractice` in [usePractice.ts](src/hooks/usePractice.ts) instead, which writes to `practice_log` and increments `practice_count`.

### b. Is task_rewards read at sequential item completion?

**Not directly during completion.** The `useCompleteTask` hook does NOT query `task_rewards`. The gamification pipeline (`roll_creature_for_completion` RPC) and the opportunity earning helper (`awardOpportunityEarning`) run post-completion, but they read `tasks.points_override`, not `task_rewards`.

`task_rewards` is created during opportunity claim ([useOpportunityLists.ts:197-205](src/hooks/useOpportunityLists.ts#L197-L205)) and is read by the financial forward-write system, but NOT during standard sequential item completion.

### c. Are reward_per_item_type and reward_per_item_amount consumed at runtime?

**No.** These columns exist on `sequential_collections` in the schema and in the TypeScript type ([types/tasks.ts:500-501](src/types/tasks.ts#L500-L501)). They are:
- Selected during collection restart ([useSequentialCollections.ts:364-365](src/hooks/useSequentialCollections.ts#L364-L365))
- Set to `null` during creation ([SequentialCreatorModal.tsx:80-81](src/components/tasks/sequential/SequentialCreatorModal.tsx#L80-L81))

**But:** No code reads these values to create `task_rewards` rows on sequential items, and no UI exposes them for configuration. They are **spec'd-but-not-built** columns.

### d. Duplicate-firing risk?

If rewards are propagated from sequential items to `task_rewards` rows during item creation (in `useCreateSequentialCollection`), and if `useCompleteTask` is later extended to read `task_rewards` at completion time, there is a potential double-credit risk: the claim-time reward write (opportunity flow) + the completion-time reward read would both fire for opportunity-sourced sequential items. The fix would be: only write rewards at creation for opportunity claims (already the case), and only read rewards at completion for sequential items (new path). These are distinct flows with distinct item types, so the risk is low if the branching is explicit.

---

## V8 — Numerator Firing on Shared List-Item-Derived Tasks

### a. Does the allowance RPC handle is_shared=true correctly?

**No. The RPC is NOT shared-task-aware.**

The `calculate_allowance_progress` RPC at [migration 100171:157](supabase/migrations/00000000100171_calculate_allowance_progress_extra_credit.sql#L157) iterates:
```sql
FOR v_task IN
  SELECT t.id, t.task_type, t.status, t.template_id, t.allowance_points, t.created_at,
         t.is_extra_credit
  FROM tasks t
  WHERE t.assignee_id = p_member_id
    AND t.counts_for_allowance = TRUE
    AND t.archived_at IS NULL
    AND t.created_at::DATE <= p_period_end
LOOP
```

It queries `t.assignee_id = p_member_id` — the PRIMARY assignee column, not `task_assignments`. For a shared task where the primary `assignee_id` is Member A but Member B also has a `task_assignments` row, **the task only counts in Member A's allowance**, not Member B's.

### b. Does it credit the actual completer or the assignee?

**Assignee for non-routine tasks; actual completer for routine steps.**

- **Non-routine tasks:** The RPC checks `t.status = 'completed'` at [line 240-244](supabase/migrations/00000000100171_calculate_allowance_progress_extra_credit.sql#L238-L244). It does NOT join to `task_completions` to find WHO completed it. If the task is complete, it credits the member matched by `assignee_id`. The actual completer's identity is not consulted.

- **Routine steps:** The RPC joins to `routine_step_completions` with `rsc.member_id = p_member_id` at [line 220](supabase/migrations/00000000100171_calculate_allowance_progress_extra_credit.sql#L220). This IS the actual completer. So for routines, the correct member gets credit. For non-routine tasks, the assignee gets credit regardless of who completed.

### c. Test cases for shared-task allowance attribution?

**No.** No test files were found that test shared-task (`is_shared=true`) scenarios with the allowance calculation RPC. The existing allowance tests ([tests/verification/row-9-allowance-end-to-end.ts](tests/verification/row-9-allowance-end-to-end.ts), [tests/e2e/features/prd28-allowance-financial.spec.ts](tests/e2e/features/prd28-allowance-financial.spec.ts)) use single-assignee tasks only.

**This is untested-behavior territory.** Workers 2+3 would need to either:
1. Extend the RPC to also query `task_assignments` for shared tasks, OR
2. Change the `assignee_id` on shared task completion to the actual completer

---

## V9 — Inheritance Resolver: Beyond resolveTrackingProperties

### a. Does any analogous resolver exist for other capabilities?

**No.** `resolveTrackingProperties` at [src/lib/tasks/resolveTrackingProperties.ts](src/lib/tasks/resolveTrackingProperties.ts) is the ONLY single-source-of-truth resolver. All other capability inheritance is ad-hoc per generation path.

### b. Every place that creates a task from a list_item / sequential / opportunity / routine

| # | Creation Path | File:Line | Capabilities Resolved | How |
|---|---|---|---|---|
| 1 | **Opportunity claim → task** | [useOpportunityLists.ts:162-190](src/hooks/useOpportunityLists.ts#L162-L190) | advancement_mode, practice_target, mastery settings, track_duration, track_progress, in_progress_member_id, claim_lock, resource_url, reward | **Ad hoc** — inline field-by-field mapping with `??` fallback chains |
| 2 | **createTaskFromData (main path)** | [createTaskFromData.ts:79-137](src/utils/createTaskFromData.ts#L79-L137) | track_progress, track_duration (via `resolveTrackingProperties`), counts_for_allowance/homework/gamification, life_area_tag, victory_flagged, require_approval, icon, claim_lock | **Mixed** — tracking via resolver, everything else ad hoc |
| 3 | **Sequential collection create** | [useSequentialCollections.ts:124-173](src/hooks/useSequentialCollections.ts#L124-L173) | advancement_mode, practice_target, mastery settings, track_duration, track_progress, life_area_tag, resource_url | **Ad hoc** — reads collection defaults, applies per-item overrides |
| 4 | **Sequential collection restart** | [useSequentialCollections.ts:345-421](src/hooks/useSequentialCollections.ts#L345-L421) | advancement_mode, practice_target, mastery settings, track_duration, track_progress, life_area_tag, resource_url, reward_per_item | **Ad hoc** — copies from existing items |
| 5 | **Routine duplicate → task** | [RoutineDuplicateDialog.tsx:165](src/components/tasks/RoutineDuplicateDialog.tsx#L165) | Template fields only (task_type, template_id, status, family_id, assignee_id) | **Minimal** — does NOT propagate tracking/reward/capability fields |
| 6 | **Randomizer spinner → task** | [RandomizerSpinnerTracker.tsx:106](src/components/widgets/trackers/RandomizerSpinnerTracker.tsx#L106) | Title only | **Minimal** — does NOT propagate any capabilities from the list item |
| 7 | **Task Breaker subtasks** | [createTaskFromData.ts:505-530](src/utils/createTaskFromData.ts#L505-L530) | life_area_tag, track_progress, track_duration (from parent task) | **Ad hoc** — copies specific fields from parent `taskBase` |
| 8 | **Rhythm Tomorrow Capture** | [commitTomorrowCapture.ts:104-105](src/lib/rhythm/commitTomorrowCapture.ts#L104-L105) | track_progress, track_duration | **Ad hoc** — reads from staged item |
| 9 | **MindSweep-Lite commit** | [commitMindSweepLite.ts:185-186](src/lib/rhythm/commitMindSweepLite.ts#L185-L186) | track_progress, track_duration | **Ad hoc** — reads from staged item |
| 10 | **Horizon Task Breaker** | [TaskBreakerModalFromHorizon.tsx:99](src/components/rhythms/sections/TaskBreakerModalFromHorizon.tsx#L99) | life_area_tag (from parent) | **Ad hoc** — one field only |

### c. Is resolveTrackingProperties structured to extend?

**Yes, cleanly.** The function signature is:
```typescript
resolveTrackingProperties(item?: ItemWithTracking, listDefaults?: ListDefaults): TrackingProperties
```

The pattern is: (1) check item-level value, (2) fall back to list defaults, (3) fall back to `false`. This three-tier resolution could be extended to handle additional capability fields by widening the interfaces. The function is pure (no side effects, no DB calls) and composable.

However: extending it to handle ALL capabilities would require a larger interface refactor — `ItemWithTracking` → `ItemWithCapabilities` covering 15+ fields. An alternative pattern would be a per-capability resolver family (e.g., `resolveRewardProperties`, `resolveAllowanceProperties`) following the same three-tier pattern.

---

## V10 — list_items.category vs list_items.section_name

### a. section_name — which list types, consumed where

`section_name` is used by **shopping lists primarily** and any list type that supports AI-organized sections:

- [Lists.tsx:1493](src/pages/Lists.tsx#L1493) — `const isShopping = list.list_type === 'shopping'` — triggers the shopping-specific view
- [Lists.tsx:1499-1501](src/pages/Lists.tsx#L1499-L1501) — **Runtime grouping:** items are grouped into sections by `section_name`. This runs on ALL list types, not just shopping.
- [Lists.tsx:1719](src/pages/Lists.tsx#L1719) — AI Organize writes to `section_name`
- [Lists.tsx:1732](src/pages/Lists.tsx#L1732) — Manual section reassignment updates `section_name`
- [Lists.tsx:1874](src/pages/Lists.tsx#L1874) — Per-item section dropdown reads/writes `section_name`
- [Lists.tsx:2079](src/pages/Lists.tsx#L2079) — Wishlist-specific section suggestions: `['Want', 'Need', 'Saving For']`

`section_name` is the **visual grouping column** — it controls how items are grouped in the list detail view.

### b. category — which list types, consumed where

`category` appears in two distinct roles:

**Role 1 — AI parsing intermediate value:** The AI bulk-add parsing returns a `category` field for each parsed item. At insert time, this is mapped to `section_name`: [Lists.tsx:1207](src/pages/Lists.tsx#L1207) `section_name: item.category || undefined`. The `category` value from parsing is a transient intermediate — it maps to `section_name` on the DB row.

**Role 2 — Standalone DB column:** `list_items.category TEXT` exists as a separate schema column from `section_name`. In the live schema, it's column #23 on `list_items`. It's used in:
- [Lists.tsx:1469](src/pages/Lists.tsx#L1469) — Read to populate the section dropdown: `categories={[...new Set(items.map(i => i.section_name).filter(Boolean))]}`
  - Note: this line reads `section_name` for the dropdown, NOT `category`

### c. Are both used simultaneously?

**Not intentionally.** The AI parsing result has a `.category` property that maps to `section_name` at insert time. The `list_items.category` DB column is never explicitly written to in the main list flows (it may contain values from the SmartImportModal which does write `category` — [SmartImportModal.tsx:242](src/components/lists/SmartImportModal.tsx#L242)).

The `category` column is primarily consumed by the **smart-draw weighting system** ([useSmartDraw.ts](src/hooks/useSmartDraw.ts)) for randomizer-specific item categorization (quick/medium/big/connection), which is a different semantic than visual grouping.

### d. Can they unify?

**They are doing genuinely different jobs:**
- `section_name`: visual grouping in the list detail view (store sections, packing categories, etc.)
- `category`: semantic categorization for filtering/weighting (randomizer draw categories, opportunity categories)

Unifying would conflate display grouping with semantic categorization. A shopping list item grouped under "Sam's Club" (section_name) might also be categorized as "quick" (category) for randomizer weighting purposes if the list is also an opportunity. These are orthogonal dimensions.

---

## V11 — Component Reusability for Inventory-and-Reference List Shapes

### a. Components rendering shopping / wishlist / packing items

**All rendered inline in Lists.tsx — not separate components.**

The list detail view at [Lists.tsx](src/pages/Lists.tsx) has a single large render function (`ListItemRow` starting around line 2900) that handles ALL list types with conditional branches:

- **Shopping:** quantity + unit fields rendered when `list_type === 'shopping'`
- **Wishlist:** URL link rendered at [Lists.tsx:2933-2935](src/pages/Lists.tsx#L2933-L2935) when `isWishlist && item.url`; price display
- **Packing:** section-based grouping (same as shopping — uses `section_name`)
- **Expenses:** amount + category; total calculation at [Lists.tsx:2415](src/pages/Lists.tsx#L2415)

**No `ShoppingListItem`, `WishlistItem`, or `PackingListItem` components exist.** Everything is inline in one monolithic function with type-specific conditional branches.

### b. Bulk-add infrastructure extensibility

Three bulk-add flows exist:

1. **SmartImportModal** ([src/components/lists/SmartImportModal.tsx](src/components/lists/SmartImportModal.tsx)) — Used for list items. Sends text to `smart-list-import` Edge Function. The Edge Function accepts list context (type, is_opportunity) and returns structured items. **Extensible:** The Edge Function's Zod schema ([supabase/functions/smart-list-import/index.ts:84-85](supabase/functions/smart-list-import/index.ts#L84-L85)) already handles `reward_type`, `reward_amount`, `category`, and could be extended with more fields.

2. **CurriculumParseModal** ([src/components/studio/CurriculumParseModal.tsx](src/components/studio/CurriculumParseModal.tsx)) — Used for sequential collection items from curriculum text. Different Edge Function (`curriculum-parse`). Not reusable for general list items.

3. **ListImageImportModal** ([src/components/lists/ListImageImportModal.tsx](src/components/lists/ListImageImportModal.tsx)) — Vision-based import for lists (scan a recipe, photo of a shelf, etc.). 

For a future wishlist-style multi-mode bulk add (title-only, title+URL, title+image, free text): `SmartImportModal` is the extensible foundation. Its Edge Function prompt is list-type-aware ([smart-list-import/index.ts:130](supabase/functions/smart-list-import/index.ts#L130)) and the Zod schema is already flexible. Adding URL extraction, image handling modes, etc. would extend the existing pattern without replacing it.

### c. URL column rename (`list_items.url` → `list_items.resource_url`)

**Would require changes in these locations:**

| # | File:Line | Usage |
|---|---|---|
| 1 | [Lists.tsx:2933,2935](src/pages/Lists.tsx#L2933-L2935) | Renders `item.url` as link on wishlists |
| 2 | [useSequentialCollections.ts:164](src/hooks/useSequentialCollections.ts#L164) | Maps `item.url` → `resource_url` on task insert |
| 3 | [useOpportunityLists.ts:189](src/hooks/useOpportunityLists.ts#L189) | Maps `listItem.url` → `resource_url` on opportunity claim |
| 4 | [UniversalListWizard.tsx:245](src/components/studio/wizards/UniversalListWizard.tsx#L245) | Reads `item.url` from wizard state |
| 5 | [SequentialCreator.tsx:291](src/components/studio/wizards/../../tasks/sequential/SequentialCreator.tsx#L291) | Maps `item.url` to task data |
| 6 | [CurriculumParseModal.tsx:375,380](src/components/studio/CurriculumParseModal.tsx#L375-L380) | Renders `item.url` in preview |
| 7 | [SmartImportModal.tsx](src/components/lists/SmartImportModal.tsx) | N/A — uses list_items directly |
| 8 | TypeScript type `ListItem.url` in [types/lists.ts](src/types/lists.ts) | Type definition |
| 9 | `smart-list-import` Edge Function | Returns `url` in response |
| 10 | `listPresets.ts:96` | Prompt mentions URL extraction |

**Migration shape:** `ALTER TABLE list_items RENAME COLUMN url TO resource_url;` is clean — no foreign keys reference this column. All code changes are mechanical string renames. **Risk:** Any cached API responses in TanStack Query would break until invalidated. A rename-with-alias (view or generated column) could provide backwards compatibility during the transition.

---

## Open Questions for Founder

### From V1
**OQ-1.** The store-aware grouping today uses `section_name` as the single grouping dimension. The founder described seeing store-aware grouping working. **Confirm:** is the current behavior (AI writes store names to `section_name`, items group by `section_name`) what you saw, or were you expecting a separate "store" concept that can coexist with section grouping?

### From V4
**OQ-2.** `collaboration_mode` (solo_claim vs collaborative) exists only in the planning doc, not in code. The current `is_shared` boolean and Workers 2+3 scoping decisions cover the behavioral distinction. **Confirm:** should `collaboration_mode` be added as an explicit column during parity work, or is the current `is_shared + instantiation_mode` combination sufficient?

### From V8
**OQ-3.** The allowance RPC credits `assignee_id` for non-routine tasks, NOT the actual completer. For shared tasks, this means only the primary assignee gets credit. **Confirm:** this is a Workers 2+3 fix item (extend the RPC to join `task_completions.family_member_id`), not a parity-build item? Or should parity address it?

### From V9
**OQ-4.** The inheritance resolver pattern (`resolveTrackingProperties`) is clean and extensible but currently covers only 2 of 19 capabilities. **Confirm:** should the parity build create a family of per-capability resolvers (e.g., `resolveRewardProperties`, `resolveAllowanceProperties`) following the same pattern, or should it create one large `resolveAllCapabilities` function?

### From V11
**OQ-5.** The `list_items.url` → `list_items.resource_url` rename is mechanically clean (10 code sites, 1 migration). **Confirm:** proceed with rename during parity, or defer to avoid churn?

---

*End of Universal Capability Parity Discovery Report 2*
