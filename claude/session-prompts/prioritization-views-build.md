# Session Prompt: Build 5 Remaining Prioritization Views (PRD-09A)

## Context

PRD-09A defines 13 task prioritization views — same tasks, different lenses. 7 are built, ABCDE was removed (2026-04-13), 5 remain as `PlannedViewStub` placeholders. All DB columns exist on `tasks`. Cross-view sync logic exists in `computeViewSync.ts`. This session builds the remaining 5.

## What Already Exists

**Built views (pattern references):**
- `EisenhowerView.tsx` — 2x2 grid, drag between quadrants, writes `eisenhower_quadrant`
- `EatTheFrogView.tsx` — ranked list, writes `frog_rank`
- `KanbanView.tsx` — column board (To Do / In Progress / Done), writes `kanban_status`
- Simple List, Now/Next/Optional, By Category, 1-3-5 Rule — all inline in Tasks.tsx

**Infrastructure:**
- `ViewCarousel.tsx` — horizontal pill strip with `VIEW_DEFINITIONS`, `isPlanned` flag controls rendering
- `PlannedViewStub.tsx` — shows `PlannedExpansionCard` for unbuilt views
- `computeViewSync.ts` — cross-view sync (suggest fills for empty fields when user categorizes in one view)
- `TaskCard.tsx` — shared card component used by all views, accepts `onToggle`, `onEdit`, `onUpdateTask`, etc.
- `tasks` table columns: `big_rock BOOLEAN`, `ivy_lee_rank INTEGER`, `moscow_category TEXT`, `impact_effort TEXT`, all nullable
- `useTasks` hook with `useUpdateTask` mutation

**View rendering in Tasks.tsx:**
The My Tasks tab renders a switch on `activeView` (a `TaskViewKey`). Built views get their component; planned views get `<PlannedViewStub viewKey={activeView} />`. After building each view, flip `isPlanned: true` to `false` (or remove it) in `VIEW_DEFINITIONS` and add the component to the switch.

## The 5 Views to Build

### 1. Big Rocks View (`big_rocks`)
- **Column:** `tasks.big_rock BOOLEAN DEFAULT false`
- **Layout:** Two sections — "Big Rocks" (big_rock = true) and "Gravel" (big_rock = false/null). Big Rocks get emphasized styling (larger cards, bold border). Gravel is compact.
- **Interaction:** Toggle button on each task to promote/demote between Big Rock and Gravel.
- **File:** `src/components/tasks/views/BigRocksView.tsx`
- **Sync:** Setting big_rock=true suggests eisenhower_quadrant='do_now', importance_level='critical_1'

### 2. Ivy Lee View (`ivy_lee`)
- **Column:** `tasks.ivy_lee_rank INTEGER` (1-6, nullable)
- **Layout:** Numbered list of up to 6 tasks. Rank 1 is prominent (do this first). Unranked tasks in a secondary "Other tasks" section below.
- **Interaction:** Drag-to-reorder sets rank 1-6. "Add to Ivy Lee" button on unranked tasks. "Remove from list" on ranked tasks.
- **File:** `src/components/tasks/views/IvyLeeView.tsx`
- **Sync:** Rank 1-2 suggests importance_level='critical_1'. Rank 3-4 suggests importance_level='important_3'.

### 3. MoSCoW View (`moscow`)
- **Column:** `tasks.moscow_category TEXT` CHECK: 'must', 'should', 'could', 'wont'
- **Layout:** 4 columns/sections — Must Do, Should Do, Could Do, Won't Do (This Cycle). Similar visual weight to Eisenhower but 4 horizontal columns instead of 2x2.
- **Interaction:** Drag between columns or tap-to-categorize dropdown. Color-coded headers (error for Must, primary for Should, info for Could, muted for Won't).
- **File:** `src/components/tasks/views/MoscowView.tsx`
- **Sync:** 'must' suggests eisenhower_quadrant='do_now'. 'wont' suggests eisenhower_quadrant='eliminate'.

### 4. Impact/Effort View (`impact_effort`)
- **Column:** `tasks.impact_effort TEXT` CHECK: 'quick_win', 'major_project', 'fill_in', 'thankless'
- **Layout:** 2x2 grid like Eisenhower but axes are Impact (high/low) × Effort (low/high). Quadrants: Quick Wins (high impact, low effort), Major Projects (high impact, high effort), Fill-Ins (low impact, low effort), Thankless Tasks (low impact, high effort).
- **Interaction:** Same as Eisenhower — move between quadrants via buttons.
- **File:** `src/components/tasks/views/ImpactEffortView.tsx`
- **Pattern:** Can literally copy EisenhowerView.tsx and change the quadrant definitions + field name.

### 5. By Member View (`by_member`)
- **Column:** `tasks.assignee_id` (already exists — no new column)
- **Layout:** Horizontal columns, one per family member. Each column shows that member's assigned tasks. Unassigned tasks in an "Unassigned" column.
- **Interaction:** Drag tasks between member columns to reassign (updates `assignee_id`). Task count per member shown in column header.
- **File:** `src/components/tasks/views/ByMemberView.tsx`
- **Data:** Uses `useFamilyMembers` for column headers with member colors. Tasks grouped by `assignee_id`.
- **Availability:** Mom only (already gated in VIEW_DEFINITIONS).

## Build Pattern (for each view)

1. Create `src/components/tasks/views/[ViewName]View.tsx`
2. Props match existing pattern: `tasks: Task[]`, `onToggle`, `onEdit?`, `onUpdateTask?`, `isCompleting?`
3. Render tasks using `TaskCard` (existing) in the view's layout
4. On categorization change: call `onUpdateTask(taskId, { [field]: value, ...computeViewSync(task, { [field]: value }) })`
5. In `ViewCarousel.tsx`: remove `isPlanned: true` from the view definition
6. In `Tasks.tsx`: add case to the view switch importing the new component
7. In `PlannedViewStub.tsx`: remove the view from `VIEW_FEATURE_KEYS` and `VIEW_DESCRIPTIONS`

## Non-Goals

- No AI auto-sort (deferred)
- No drag-and-drop between quadrants for 2x2 views (use buttons like Eisenhower does)
- ABCDE view removed (2026-04-13) — don't build it
- Don't add new DB columns — all fields already exist

## Verification

After all 5 are built: `tsc --noEmit` clean, each view renders real tasks, categorization persists to DB, cross-view sync fires on categorization, `PlannedViewStub` no longer renders for any of these keys.
