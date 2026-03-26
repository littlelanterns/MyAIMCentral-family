> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-14C: Family Overview

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-06 (Guiding Stars & Best Intentions), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder & Daily Celebration), PRD-14 (Personal Dashboard), PRD-14B (Calendar)
**Created:** March 11, 2026
**Last Updated:** March 11, 2026

---

## Overview

PRD-14C defines the Family Overview — mom's aggregated command post where she can see every selected family member's activity in side-by-side columns. This is the second tab in the perspective switcher (PRD-14) and represents the "I need to know what's going on with everyone" view. It answers the questions a mom fields twenty times a day: who's done their work, who hasn't started, what's coming up, and can this kid go do something fun.

The primary interface is a **horizontally swipeable column layout** where each column represents one family member. Within each column, collapsible sections stack vertically — today's events, today's tasks (with inline mark-complete), Best Intentions with tally, active trackers, opportunities claimed, and victories recorded. The sections are consistent across all columns so mom can compare at a glance. Above the columns sits a standard family calendar (same component as PRD-14B) showing the full family schedule with member color dots.

Family Overview is not the same as Family Hub (PRD-14D), which is a shared coordination surface the whole family interacts with. Family Overview is mom's private monitoring lens — or dad's, if mom grants permission. No one else accesses it.

> **Mom experience goal:** When my kid asks "can I go to my friend's house?", I want to open one view and see in three seconds whether they've finished their tasks, what's on the calendar for the rest of the day, and whether they've done their reading. One glance. No hunting through five different screens.

> **Depends on:** PRD-14 (Personal Dashboard) defines the perspective switcher and dashboard page container — Family Overview renders as a tab within that container. PRD-14B (Calendar) defines the calendar component, family filter, member color coding, and Universal Queue Modal. PRD-09A (Tasks) defines the task data, completion tracking, and "mark anywhere = mark everywhere" convention. PRD-06 (Guiding Stars & Best Intentions) defines Best Intentions data and iteration tracking. PRD-11 (Victory Recorder) defines the victories data model. PRD-10 (Widgets, Trackers) defines tracker data.

---

## Related PRDs in the PRD-14 Family

| PRD | Feature | Relationship |
|-----|---------|-------------|
| **PRD-14** | Personal Dashboard | Parent — defines the perspective switcher and page container |
| **PRD-14B** | Calendar | Provides the calendar component, member colors, Universal Queue Modal |
| **PRD-14C** (this document) | Family Overview | Mom's aggregated all-seeing perspective |
| **PRD-14D** | Family Hub | Shared family coordination surface (separate PRD) |
| **PRD-14E** | Family Hub TV Mode | Ambient display (separate PRD) |

---

## User Stories

### Monitoring & Decision-Making
- As a mom, I want to see every selected family member's tasks, events, and progress in side-by-side columns so I can assess the whole family's status at a glance.
- As a mom, I want to swipe horizontally through member columns on my phone so I can review each person without scrolling through a long page.
- As a mom, I want to mark a child's task as complete directly from the Family Overview so I don't have to navigate to the Tasks page or switch to "View As."
- As a mom of nine, I want to select which family members appear in my overview and have that selection persist until I change it, so I'm not reconfiguring every time I open the tab.
- As a mom, I want to see a child's incomplete tasks with blank checkboxes and completed tasks with checkmarks and strikethrough so I can immediately see what's done and what isn't.
- As a mom, I want the family calendar above the columns showing everyone's schedule with color-coded dots so I know what's happening today and this week.

### Best Intentions & Victories
- As a mom, I want to see each member's Best Intentions with their daily tally count so I know who's working on their personal goals.
- As a mom, I want to see victories each family member has recorded today so I can notice and celebrate the good things happening.
- As a mom, I want to see which opportunities or extra credit tasks each child has claimed so I know who's showing initiative.

### Customization
- As a mom, I want to reorder the sections within the columns (events first, then tasks, then Best Intentions, etc.) via drag-and-drop so I can prioritize what I care about most.
- As a mom, I want to collapse a section across all columns at once so I can focus on just tasks or just events without visual clutter.
- As a mom, I want to override the collapse state for a specific member's column if I need to see one person's details while keeping others collapsed.
- As a mom, I want to reorder the member columns themselves so my most-checked kids appear first.

### Pending Items
- As a mom, I want a pending items bar showing how many things need my attention (calendar approvals, task queue items, requests) so I can process them from the Universal Queue Modal without leaving the overview.

### Dad's Access
- As a dad with Family Overview permission, I want to see the same column layout for the kids I have permission to view, plus my own column, so I can also track family progress.
- As a mom, I want to control whether dad has access to the Family Overview and which children he can see in it, consistent with the per-kid per-feature permission model.

### Persistence
- As any user with Family Overview access, I want every setting I configure — member selection, section order, collapse states, column order — to persist until I explicitly change it.

---

## Screens

### Screen 1: Family Overview — Column Layout

> **Mom experience goal:** This is the view I live in when I'm managing the household. Everything I need to make a quick parenting decision is visible without navigating away.

**What the user sees:**

The Family Overview replaces the dashboard content area when the "Family Overview" tab is selected in the perspective switcher (PRD-14). The page consists of three zones stacked vertically: a **pending items bar**, a **family calendar section**, and the **member columns area**.

```
┌─────────────────────────────────────────────────┐
│ [My Dashboard] [Family Overview•] [Hub] [View As]│
├─────────────────────────────────────────────────┤
│ Pending: Calendar (3) · Tasks (5) · Requests (2)│
├─────────────────────────────────────────────────┤
│ 📅 Family Calendar                        [v] ▼ │
│ [< Prev]  March 10–16, 2026  [Next >]          │
│ [Week•] [Month]                                  │
│ ┌──────┬──────┬──────┬──────┬──────┬─────┬─────┐│
│ │ Sun  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri │ Sat ││
│ │      │●●10a │      │●3pm  │      │●●5p │     ││
│ │      │Dentst│      │Soccr │      │Pian │     ││
│ └──────┴──────┴──────┴──────┴──────┴─────┴─────┘│
├─────────────────────────────────────────────────┤
│ Members: (Jake) (Emma) (Ruthie) (Sam) (Mom)     │
│          ●filled  ○outline = deselected          │
├─────────────────────────────────────────────────┤
│        ← swipe →                                 │
│ ┌──────────┬──────────┬──────────┐               │
│ │  Jake    │  Emma    │  Ruthie  │               │
│ │  ●teal   │  ●coral  │  ●purple │               │
│ ├──────────┼──────────┼──────────┤               │
│ │▼ Events  │▼ Events  │▼ Events  │               │
│ │ Dentist  │ Piano 5p │ (none    │               │
│ │ 10:30a   │          │  today)  │               │
│ ├──────────┼──────────┼──────────┤               │
│ │▼ Tasks   │▼ Tasks   │▼ Tasks   │               │
│ │ ☑ Bed    │ ☑ Bed    │ ☑ Bed    │               │
│ │ ☑ Dishes │ ☐ Math   │ ☑ Read   │               │
│ │ ☐ Read   │ ☐ Piano  │ ☐ Chores │               │
│ │  2/3     │  1/3     │  2/3     │               │
│ ├──────────┼──────────┼──────────┤               │
│ │▼ Best Int│▼ Best Int│▼ Best Int│               │
│ │ Pause ×3 │ Read  ×2 │ Kind ×1  │               │
│ ├──────────┼──────────┼──────────┤               │
│ │▼ Trackers│▼ Trackers│▼ Trackers│               │
│ │ Water 5/8│ Steps 6k │ (none)   │               │
│ ├──────────┼──────────┼──────────┤               │
│ │▼ Wk Comp │▼ Wk Comp │▼ Wk Comp │               │
│ │  72%     │  45%     │  81%     │               │
│ │  $14.40  │  $9.00   │  $16.20  │               │
│ ├──────────┼──────────┼──────────┤               │
│ │▼ Opps    │▼ Opps    │▼ Opps    │               │
│ │ ☑ Yard   │ (none)   │ ☑ Read+  │               │
│ │   $5     │          │   5 pts  │               │
│ ├──────────┼──────────┼──────────┤               │
│ │▼ Victories│▼ Victories│▼ Victories│             │
│ │ Helped   │ (none    │ Finished │               │
│ │ brother  │  today)  │ chapter! │               │
│ └──────────┴──────────┴──────────┘               │
└─────────────────────────────────────────────────┘
```

---

**Pending Items Bar:**

A compact horizontal bar below the perspective switcher and above the calendar. Shows badge counts for each registered Universal Queue Modal tab (PRD-14B).

- Each badge shows: label + count (e.g., "Calendar (3)")
- Tapping any badge opens the Universal Queue Modal to that tab
- Counts update in real-time (optimistic, synced)
- If all counts are zero, the bar displays "All clear" with a subtle checkmark — never hidden entirely (its presence reminds mom the feature exists)

> **Decision rationale:** Persistent bar rather than a dismissible notification because mom's queue is a continuous stream, not a one-time alert. "All clear" is a rewarding state.

---

**Family Calendar Section (collapsible):**

The same calendar rendering component used on the full Calendar page (PRD-14B) and the dashboard calendar section (PRD-14), but wired to the **Family Overview's member selection** rather than having its own independent filter.

- **Member filter is synced to the member pill selector.** The calendar shows events ONLY for members currently selected in the pill row above the columns. If mom has selected just her three teens, the calendar shows only those three teens' events. This is distinct from the full Calendar page (PRD-14B), which has its own independent "Pick Members" filter stored in `dashboard_configs.preferences.calendar_filter`. The two surfaces share the same rendering component but receive different member ID arrays as input.
- **No separate "Pick Members" UI on the Family Overview calendar.** The member pill selector IS the filter. This avoids having two member pickers on the same page that could conflict.
- **Color coding:** Uses member `calendar_color` from `family_members` table — dots or stripe per user's `calendar_color_mode` preference
- **View toggle:** Week (default) / Month. Persists in `family_overview_configs.preferences` (separate from the full Calendar page's view preference)
- **Date navigation:** Same as PRD-14B — left/right arrows, center label with date picker dropdown
- **Collapsible:** Standard section collapse/expand behavior. State persists.
- **Task due dates:** NOT shown on the Family Overview calendar. The calendar here shows events only — task status is visible in the member columns below. This keeps the calendar clean and avoids duplicating the column data.
- **Tap any event:** Opens Event Detail flyout (PRD-14B Screen 3)

> **Decision rationale:** Syncing the calendar filter to the member pill selector means one control governs both the calendar and the columns. If mom deselects a child from the pills, that child's events disappear from the calendar AND their column disappears — consistent and predictable. Calendar events only (no task due dates) because the task detail is already in the columns. Showing tasks in both places creates visual noise and makes the calendar harder to scan for scheduling conflicts.

> **Forward note for build:** The shared calendar component must accept a `memberIds` prop (or equivalent) to control which members' events are displayed. PRD-14B's Calendar page passes its own filter state; PRD-14's dashboard section passes the self/family toggle; PRD-14C passes the member pill selection. Same component, three different member ID inputs.

---

**Member Selector:**

A horizontal row of small oval pill buttons, one per family member. Each pill displays the member's first name and is colored using their `calendar_color`.

- **Selected state:** Solid fill in member's `calendar_color` with contrasting text
- **Deselected state:** Outline/border in member's `calendar_color` with color-matched text, transparent fill
- **Which direction (fill vs. outline) is selected vs. deselected** follows the system-wide button selected state convention established in PRD-03. The PRD-14C spec defers to whatever PRD-03 establishes — the point is visual clarity, not prescribing the specific treatment.
- **All family members** appear as selectable pills — mom, dad, every child regardless of age or role
- **Tap to toggle:** Tapping a pill toggles that member's column on/off. Selection persists in `family_overview_configs.selected_member_ids` UUID array.
- **First-time default:** All children selected. Mom and dad deselected. User adjusts from there.
- **Component reuse:** This is the same interaction pattern as PRD-14B's "Pick Members" filter. Both should use the same underlying `MemberPillSelector` component, styled with the small oval pill variant.

> **Decision rationale:** Oval pill buttons match the badge/pill design language in PRD-03. Using member `calendar_color` creates visual consistency with the calendar dots — the same color means the same person everywhere. First-time default of "all children" is the 80% use case; mom adds herself or dad when she wants to.

---

**Member Columns Area:**

The core of Family Overview. A horizontally scrollable container holding one column per selected member.

**Column header:**
- Member's first name, bold
- Small avatar circle (if set) or initials circle
- Accent stripe or top border in the member's `calendar_color`
- Column header is sticky (stays visible as user scrolls vertically through sections)

**Responsive behavior:**
- **Mobile (portrait):** 1 column visible at a time. Horizontal swipe to navigate. Dot indicators show position. Snap-to-column scrolling.
- **Mobile (landscape):** 2 columns visible. Swipe for more.
- **Tablet (portrait):** 2-3 columns visible.
- **Tablet (landscape):** 3-4 columns visible.
- **Desktop:** 3-5 columns visible depending on sidebar/notepad state. Horizontal scroll or swipe for overflow.
- Column width is equal and fixed within the viewport — columns don't vary in width.

**Column ordering:**
- Default order: follows `family_members` table `sort_order` (the order mom set up during family creation in PRD-01)
- Mom can reorder columns via drag-and-drop on the column headers (long-press to enter reorder mode, same trigger as PRD-14 edit mode)
- Custom column order persists in `family_overview_configs.column_order` UUID array

> **Decision rationale:** Swipeable columns rather than a scrollable list because the comparison value comes from seeing members side-by-side. On mobile, one-at-a-time with snap scroll is the natural pattern — you swipe through your kids the way you'd flip through cards. On larger screens, side-by-side comparison is the whole point.

---

**Sections Within Columns:**

Each column contains the same set of collapsible sections in the same order. Sections are the "rows" of the column grid — when you collapse "Tasks," it collapses across all columns simultaneously (row-level collapse), with the ability to override per-column.

**Section list (MVP):**

| # | Section | Content | Data Source |
|---|---------|---------|-------------|
| 1 | **Today's Events** | Calendar events for this member today. Shows: time, title, location (if set), category icon. If transportation needed, shows leave-by time. | `calendar_events` WHERE `event_date = today` AND member is creator or attendee. Status `approved` or `pending_approval` (pending shown faded). |
| 2 | **Today's Tasks** | Tasks due or active today. Completed tasks: checkmark + strikethrough. Incomplete tasks: empty checkbox. Count: "4/7 done." | `tasks` + `task_assignments` + `task_completions` WHERE assigned to this member AND (due today OR recurring today OR active with no due date). |
| 3 | **Best Intentions** | Active Best Intentions with today's iteration tally. Shows: intention title + "×N" count for today. | `best_intentions` WHERE `owner_member_id` = this member AND `is_active = true`. Tally from `intention_iterations` WHERE `day_date = today`. |
| 4 | **Active Trackers** | Widget trackers assigned to this member showing today's value. Shows: tracker name + current value + visual (mini bar, count, etc.). | `widgets` WHERE `family_member_id` = this member AND widget type is a tracker AND `is_active = true`. |
| 5 | **Weekly Completion** | Task completion percentage for the current week. Shows: percentage + on-track payout amount. | *Stub — requires financial tracking PRD. Shows placeholder: "Coming soon" with percentage stub.* |
| 6 | **Opportunities Claimed** | Extra credit / opportunity tasks completed today. Shows: task name + reward (points or $). | `task_completions` joined to `tasks` WHERE `task_type = 'opportunity'` AND `completed_at` is today AND assigned to this member. |
| 7 | **Victories** | Victories recorded today. Shows: victory description text. | `victories` WHERE `family_member_id` = this member AND `created_at` is today. |

**Section behavior:**

- **Collapse/expand:** Tapping a section header collapses or expands it. **Default behavior is row-level** — collapsing "Tasks" collapses it in every column simultaneously. This is the expected behavior because mom is usually scanning one data type across all kids.
- **Per-column override:** If mom taps a section header while holding (long-press), it toggles just that column's section, overriding the row-level state. A subtle indicator (small dot or color change on the section header) shows when a per-column override is active.
- **Collapse state persists** in `family_overview_configs.section_states` JSONB — both the row-level defaults and any per-column overrides.

> **Decision rationale:** Row-level collapse is the natural mental model — "I want to focus on tasks right now, hide everything else." Per-column override handles the exception case — "I need to see Jake's events because he asked about his afternoon, but I don't need everyone else's events right now." Long-press for override prevents accidental per-column toggles.

**Section ordering:**

- Mom can reorder sections via drag-and-drop (long-press on section header in any column to enter reorder mode)
- Section order is global — the same across all columns. There's no per-column section ordering.
- Reorder persists in `family_overview_configs.section_order` TEXT array (section keys in order)

> **Decision rationale:** Per-column section ordering would be confusing — the side-by-side comparison breaks if Jake's tasks are at position 2 but Emma's are at position 5. Global section order preserves the grid-like alignment that makes scanning work.

**Empty states:**

- Section with no data for a member: shows "(none today)" in muted text. Section header still visible with count badge showing "0".
- Member with no data at all (new member, no tasks assigned yet): all sections show empty states. Column still renders — it's not hidden.

---

### Screen 2: Tasks Section — Inline Mark-Complete

> **Mom experience goal:** I shouldn't have to leave this view to tell the system my kid finished something. If I watched them do it, or they told me, I tap the checkbox right here and it's done everywhere.

**What the user sees within the Tasks section of each column:**

```
┌──────────────────┐
│▼ Tasks       4/7 │
│──────────────────│
│ ☑̶ ̶M̶a̶k̶e̶ ̶b̶e̶d̶       │  ← completed: checkmark, strikethrough
│ ☑̶ ̶D̶i̶s̶h̶e̶s̶         │
│ ☑̶ ̶B̶r̶u̶s̶h̶ ̶t̶e̶e̶t̶h̶    │
│ ☑̶ ̶P̶i̶a̶n̶o̶ ̶p̶r̶a̶c̶t̶i̶c̶e̶│
│ ☐ Math homework  │  ← incomplete: empty checkbox
│ ☐ Read 20 min    │
│ ☐ Clean room     │
└──────────────────┘
```

**Interactions:**

- **Tap empty checkbox:** Marks the task complete. Follows the **"checked anywhere, checked everywhere"** pattern from PRD-09A — the completion writes to `task_completions` and is reflected on the member's own dashboard, the Tasks page, and any other surface showing this task.
- **Optimistic update:** Checkbox fills immediately. If offline, the completion saves locally and syncs when connectivity returns. No spinner, no wait.
- **Completed tasks:** Show with a filled checkbox and strikethrough text. Tapping a completed task does NOT uncheck it from this view — unchecking (unmarking) is a more intentional action that should happen from the full Tasks page, where the reward/streak rollback implications are visible.
- **Task order:** Incomplete tasks first, then completed tasks. Within each group, ordered by due time (if set), then by sort order.
- **Count badge:** "4/7" in the section header — completed count / total count.
- **Routine steps:** If a task is a routine with sub-steps, the column shows the routine name with a nested indented list of today's applicable steps, each with their own checkbox.

> **Decision rationale:** Unmark is intentionally excluded from this view. The "checked anywhere, checked everywhere" principle means unmarking triggers reward rollback, streak adjustment, and potentially activity log entries (per PRD-02's unmark cascade convention). That decision deserves the full task detail context, not a quick tap on a compact overview column.

**Data updated:**
- `task_completions` record inserted (task_id, family_member_id = the column member, completed_at = now, period_date = today)
- If task requires approval: `task_completions.approved_by` and `approved_at` set immediately (mom is approving by checking it herself)

---

### Screen 3: Member Selector & Column Configuration

> **Mom experience goal:** Setting up this view should take 10 seconds. Pick my kids, done. It remembers.

**Member Selector Row:**

```
┌──────────────────────────────────────────────────────┐
│ (●Jake) (●Emma) (●Ruthie) (○Sam) (○Baby) (○Mom) (○Dad) │
│  teal    coral    purple   green   gold   sage    blue    │
└──────────────────────────────────────────────────────┘
● = selected (filled oval pill in member's calendar_color)
○ = deselected (outline oval pill in member's calendar_color)
```

- Pills are small, horizontally scrollable if the family is large
- Tap any pill to toggle that member's column on/off
- Selection is instant — column appears/disappears with a smooth animation
- Selection persists across sessions

**Column Reorder Mode:**

- Long-press on any column header to enter reorder mode
- Column headers show drag handles
- Drag columns left/right to reorder
- Release to confirm new order
- Tap anywhere outside to exit reorder mode
- Same edit-mode trigger pattern as PRD-14 dashboard edit mode

**Section Reorder Mode:**

- Long-press on any section header to enter section reorder mode
- Section headers across all columns highlight to show they're reorderable
- Drag a section header up/down to reorder
- All columns reflect the new order simultaneously
- Release to confirm; tap outside to exit

**Data stored:**
- All configuration writes to `family_overview_configs` table

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Full access to Family Overview. Can see all family members as selectable pills. Can mark-complete tasks for any member. Can configure all settings. |
| Dad / Additional Adult | Permission-gated | Requires `family_overview` feature key permission granted by mom. When granted, sees member pills ONLY for: himself + children mom has granted him per-kid access to. Cannot see mom's pill unless mom explicitly shares. Cannot see children outside his permission scope. |
| Special Adult | Not present | Special Adults do not access the Family Overview. Their shift view (PRD-27) serves a different purpose. |
| Independent (Teen) | Not present | Teens do not see the Family Overview. The perspective switcher does not appear in the Independent shell. |
| Guided / Play | Not present | Children do not access Family Overview. |

### Shell Behavior

| Shell | Family Overview Tab | Perspective Switcher |
|-------|-------------------|---------------------|
| Mom | Full Family Overview as specified | Full switcher: My Dashboard, Family Overview, Hub, View As |
| Dad / Additional Adult | Permission-gated Family Overview (scoped member list) | If `family_overview` granted: My Dashboard, Family Overview, View As. If not granted: My Dashboard, View As only. Hub visibility depends on PRD-14D. |
| Independent (Teen) | Not present | Not present (no perspective switcher in teen shell) |
| Guided / Play | Not present | Not present |
| Special Adult | Not present | Not present |

### Privacy & Transparency

- **Mom sees all child data by default** per PRD-02's mom-first architecture. No additional permissions needed for mom to see any child's tasks, events, Best Intentions, trackers, or victories in Family Overview.
- **Dad sees only what mom has granted.** If dad has `family_overview` permission but doesn't have per-kid access to a specific child (e.g., a child from a prior relationship), that child's pill doesn't appear.
- **Mom sharing her own data with dad:** If mom selects her own pill and dad has `family_overview` access, dad can see mom's column ONLY IF mom has enabled per-feature sharing with partner for the relevant features. Mom controls this at the feature level, not the Family Overview level. If mom hasn't shared her tasks with dad, her task section appears empty in dad's view even though her column is visible.

> **Decision rationale:** This respects mom's privacy — she might want dad to see her calendar (shared logistics) but not her Best Intentions (personal growth goals that might be about the relationship). The per-feature sharing model from PRD-02 is the right granularity.

---

## Data Schema

### Table: `family_overview_configs`

Stores Family Overview layout preferences per user. One row per family member who has access.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members. The user whose config this is. Unique per member. |
| selected_member_ids | UUID[] | '{}' | NOT NULL | Which family members appear as columns. Empty = first-time default (all children). |
| column_order | UUID[] | '{}' | NOT NULL | Custom column order. Empty = use family_members.sort_order. |
| section_order | TEXT[] | DEFAULT_SECTION_ORDER | NOT NULL | Section keys in display order. Default: ['events', 'tasks', 'best_intentions', 'trackers', 'weekly_completion', 'opportunities', 'victories'] |
| section_states | JSONB | '{}' | NOT NULL | Row-level collapse states + per-column overrides. Shape: `{ "tasks": { "collapsed": false, "overrides": { "<member_id>": true } }, ... }` |
| calendar_collapsed | BOOLEAN | false | NOT NULL | Whether the calendar section is collapsed |
| preferences | JSONB | '{}' | NOT NULL | Additional preferences. Keys: `calendar_view` ('week'/'month'), extensible for future settings. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Members can SELECT and UPDATE their own config (`family_member_id` = auth user's member ID)
- Mom can SELECT any family member's config (for admin/debugging, not typical use)
- Members can INSERT their own config on first access

**Unique constraint:** `(family_member_id)` — one config per member

**Indexes:**
- `(family_member_id)` — primary lookup (unique constraint serves as index)
- `(family_id)` — family-scoped admin queries

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON family_overview_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Enum/Type Updates

No new enums. The `section_order` TEXT array uses string keys that are registered constants, not database enums — this allows future PRDs to add new section types without migration.

**Registered section keys (MVP):**
- `'events'` — Today's Events
- `'tasks'` — Today's Tasks
- `'best_intentions'` — Best Intentions + tally
- `'trackers'` — Active Trackers
- `'weekly_completion'` — Weekly Completion % + payout (stub)
- `'opportunities'` — Opportunities Claimed
- `'victories'` — Victories Recorded Today

> **Forward note:** Future PRDs can register new section keys. The Family Overview column renderer checks for registered section components by key — if a key exists in `section_order` but no component is registered for it, it renders a graceful "Coming soon" placeholder. This is the extensibility mechanism for features like homeschool tracking, allowance details, or AI digest.

---

## Flows

### Incoming Flows (How Data Gets INTO Family Overview)

| Source | How It Works |
|--------|-------------|
| PRD-14B (Calendar) | Calendar events read directly from `calendar_events` table via the shared calendar component. Family filter mode shows all selected members' events with color coding. |
| PRD-09A (Tasks) | Task data read from `tasks` + `task_assignments` + `task_completions`. Query scoped to today's active/due tasks per member. |
| PRD-06 (Best Intentions) | Best Intentions read from `best_intentions` WHERE `is_active = true`. Daily tally from `intention_iterations` WHERE `day_date = today`. |
| PRD-10 (Widgets/Trackers) | Active tracker widgets read from `widgets` table. Current value from associated tracker data tables. |
| PRD-11 (Victory Recorder) | Today's victories read from `victories` WHERE `created_at` is today. |
| PRD-09A (Opportunities) | Opportunity task completions from `task_completions` joined to `tasks` WHERE `task_type = 'opportunity'` AND completed today. |
| PRD-14B (Universal Queue) | Queue badge counts for pending items bar. Each registered queue tab provides its own count query. |

### Outgoing Flows (How Family Overview Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-09A (Tasks) | Mark-complete from columns writes `task_completions` record. Follows "checked anywhere, checked everywhere" — completion is immediately reflected on the member's own dashboard, Tasks page, and any other surface. |
| PRD-14B (Universal Queue Modal) | Pending items bar badge taps open the Universal Queue Modal to the relevant tab. |
| PRD-14B (Calendar) | Calendar event taps open the Event Detail flyout (PRD-14B Screen 3). |

---

## AI Integration

### Context Loading

When mom opens the LiLa drawer while on the Family Overview tab, the following context is loaded:

- **Page context:** `'family_overview'`
- **Selected members:** Names and IDs of members currently displayed in columns
- **Task summary per member:** Completed count / total count for today
- **Upcoming events:** Next 24 hours of events across selected members
- **Any pending queue items:** Count summary

This allows LiLa to answer questions like "Has Jake finished his reading?" or "What's happening after school today?" without mom having to specify which child or restate context.

### Future AI Sections (Post-MVP)

> **Deferred:** The following AI features are noted for future implementation as additional column sections or overview-level components:

- **Daily Digest:** A LiLa-generated morning summary — "Here's what's happening with your family today" — covering key events, task load per member, and anything unusual (overdue items, schedule conflicts).
- **Weekly Forecast:** A forward-looking summary of the coming week — major events, deadlines, schedule density by day, and transportation needs.
- **Proactive Observations:** LiLa notices patterns — "Jake has completed his reading every day this week" or "Emma's task completion has dropped this week."

> **Decision rationale:** Context loading is valuable at MVP because it makes LiLa aware of which page mom is on. The digest and forecast features require careful design to avoid crossing the "merciful defaults" line — they should celebrate and inform, never nag or shame. Deferred to post-MVP to get the tone right.

---

## Edge Cases

### Large Families
- With 9+ children selected, the column area handles overflow via horizontal scroll/swipe. Dot indicators show how many columns exist and current position.
- Member pill row scrolls horizontally if it exceeds viewport width.
- Performance: queries are batched per selected member. If > 10 members are selected, queries load in batches (first 5 immediately, remaining on scroll into view).

### Empty Family Overview (New Account)
- No tasks assigned, no events created, no Best Intentions set.
- All sections show empty states: "(none today)"
- A warm onboarding card appears above the columns: "This is your Family Overview — once your family starts using MyAIM, you'll see everyone's activity here at a glance. Start by assigning some tasks or creating calendar events."
- Card is dismissible and does not reappear (persisted in `family_overview_configs.preferences.onboarding_dismissed`).

### Offline / Poor Connectivity
- Family Overview reads from locally cached data if available.
- Mark-complete works offline: completion saved to local storage, synced when connected.
- Pending items bar shows last-known counts with a subtle "offline" indicator.
- Calendar section shows cached events.

### Member Added or Removed Mid-Session
- If a new member is added to the family while Family Overview is open, the member pill appears on next data refresh (no live push — user pulls to refresh or navigates away and back).
- If a member is removed, their column and pill disappear on next refresh. Their data is no longer queried.

### Dad's Scoped View
- If dad has `family_overview` permission but loses access to a specific child (mom revokes), that child's pill and column disappear on next load.
- If dad has no children in his permission scope, his Family Overview shows only his own column (if he's selected himself) with a message: "No family members are available in your overview. Contact [Mom's name] to adjust permissions."

### Section with No Registered Component (Future-Proofing)
- If `section_order` contains a key that has no registered component (e.g., a future section key added by a later PRD), the column renders a placeholder: "[Section Name] — Coming soon" in muted text.
- The section is still collapsible and reorderable. It just has no data.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `family_overview` | Access to the Family Overview tab in the perspective switcher | Enhanced |
| `family_overview_ai` | AI digest and forecast sections within Family Overview | Full Magic |

> **Tier rationale:** Family Overview is a power-user feature that provides significant value for managing a household. It's a natural Enhanced tier feature. The AI digest/forecast adds Full Magic value on top. During beta, both return true.

All feature access wrapped in `useCanAccess('family_overview')` from day one.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Weekly Completion section (placeholder) | Weekly task completion percentage calculation + payout tracking | Financial Tracking PRD (PRD-28 or later) |
| Pending Payout display in Weekly Completion section | Allowance/payout calculation based on completion percentage | Financial Tracking PRD |
| AI Daily Digest section (not rendered at MVP) | LiLa-generated morning family summary | Post-MVP AI enhancement |
| AI Weekly Forecast section (not rendered at MVP) | LiLa-generated week-ahead overview | Post-MVP AI enhancement |
| Proactive Observations section (not rendered at MVP) | LiLa pattern detection across family member data | Post-MVP AI enhancement |
| Family Hub tab in perspective switcher | Shared family coordination surface | PRD-14D (Family Hub) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Perspective switcher: Family Overview tab (placeholder) | PRD-14 | Fully implemented — tab renders the Family Overview column layout |
| Family Overview aggregated data display | PRD-14 (deferred #2) | Fully implemented — member columns with all section types |
| Universal Queue Modal entry point from dashboard | PRD-14B | Pending items bar provides an additional entry point to the Universal Queue Modal |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Family Overview renders as a tab in the perspective switcher (mom shell, dad shell if permitted)
- [ ] Pending items bar shows badge counts for all registered Universal Queue tabs; tapping opens modal to that tab
- [ ] Family calendar section: same component as PRD-14B, family filter default, week/month toggle, member color dots, collapsible, tap event for detail
- [ ] Calendar shows events only — no task due dates on the Family Overview calendar
- [ ] Member selector: oval pill buttons in each member's `calendar_color`, tap to toggle, selection persists
- [ ] First-time default: all children selected, mom and dad deselected
- [ ] Member columns render for each selected member with sticky header showing name + color accent
- [ ] Columns are horizontally swipeable on mobile (snap-to-column), side-by-side on tablet/desktop
- [ ] Column order: defaults to family setup order, reorderable via long-press drag, persists
- [ ] Seven section types render within columns: Events, Tasks, Best Intentions, Trackers, Weekly Completion (stub), Opportunities, Victories
- [ ] Sections collapse/expand at row level (all columns at once) by default
- [ ] Per-column collapse override via long-press on section header; override state persists
- [ ] Section order: reorderable via long-press drag, global across all columns, persists
- [ ] Tasks section: completed tasks show checkmark + strikethrough; incomplete show empty checkbox
- [ ] Tasks section: tapping empty checkbox marks task complete (writes `task_completions`, optimistic)
- [ ] Tasks section: mark-complete follows "checked anywhere, checked everywhere" — reflected system-wide
- [ ] Tasks section: no unmark from this view (intentional — unmark from Tasks page only)
- [ ] Best Intentions section: shows active intentions with today's iteration count
- [ ] Victories section: shows victories recorded today
- [ ] Opportunities section: shows opportunity tasks completed today with reward amount
- [ ] Active Trackers section: shows tracker name + current value
- [ ] Weekly Completion section: stub placeholder with "Coming soon" until financial tracking PRD
- [ ] Empty states: "(none today)" in muted text for sections with no data; onboarding card for brand-new accounts
- [ ] All configuration stored in `family_overview_configs` table with appropriate RLS
- [ ] Dad's view: scoped to permitted children + himself. Mom's pill not visible unless mom shares.
- [ ] `useCanAccess('family_overview')` wired from day one (returns true during beta)
- [ ] PermissionGate wraps the Family Overview tab rendering
- [ ] All components consume PRD-03 CSS variables and shell token overrides — no hardcoded colors
- [ ] Responsive: 1 column on mobile portrait, 2 on mobile landscape, 3-4 on tablet, 3-5 on desktop
- [ ] Offline mark-complete: saves locally, syncs when connected

### MVP When Dependency Is Ready
- [ ] Weekly Completion section shows real completion percentage (requires financial tracking PRD)
- [ ] Pending Payout shows real dollar amount (requires financial tracking PRD)
- [ ] AI Daily Digest section renders morning summary (requires post-MVP AI integration)
- [ ] AI Weekly Forecast section renders week-ahead view (requires post-MVP AI integration)
- [ ] Family Hub tab in perspective switcher links to real Family Hub (requires PRD-14D)

### Post-MVP
- [ ] AI Daily Digest — LiLa-generated morning family summary
- [ ] AI Weekly Forecast — week-ahead schedule, deadlines, transportation overview
- [ ] Proactive Observations — "Jake's reading streak is at 7 days!"
- [ ] Custom sections — mom creates a section type that displays custom tracked data per member
- [ ] Section pinning — pin a section to always show expanded for specific members regardless of row-level collapse
- [ ] Quick-navigate from column to "View As" — tap member name in column header to switch to View As for that member
- [ ] Routine sub-step rendering — show routine steps nested under the routine name in the Tasks section
- [ ] Export / share family overview snapshot (screenshot or formatted text for sharing with partner)

---

## CLAUDE.md Additions from This PRD

- [ ] Family Overview architecture: horizontally swipeable member columns with collapsible row-level sections. Perspective switcher tab within dashboard page container.
- [ ] Member pill selector: `MemberPillSelector` component — oval pills in member `calendar_color`, tap to toggle. Same component used in PRD-14B "Pick Members" filter and Family Overview member selection. Selected/deselected state follows PRD-03 button convention.
- [ ] Family Overview calendar: same calendar rendering component as PRD-14B, but member filter synced to the member pill selector (NOT the Calendar page's own filter). The shared calendar component accepts a `memberIds` prop — PRD-14B passes its own filter state, PRD-14 dashboard passes self/family toggle, PRD-14C passes the pill selection. Events only — no task due dates on Family Overview calendar.
- [ ] Section collapse convention: row-level collapse toggles all columns simultaneously. Long-press section header = per-column override. Both states persist in `family_overview_configs.section_states` JSONB.
- [ ] Section ordering is global across columns — no per-column section reordering.
- [ ] Mark-complete from Family Overview: writes `task_completions` with `approved_by = current_user` (mom approving by checking). No unmark from Family Overview — intentional, per "checked anywhere, checked everywhere" + unmark cascade concern.
- [ ] Section extensibility: registered section keys are string constants. Future PRDs add new sections by registering a component for a new key. Unrecognized keys render placeholder.
- [ ] `family_overview_configs` table: one row per user with access. Stores selected members, column order, section order, collapse states, calendar state, preferences.
- [ ] Convention: any setting mom configures persists until she explicitly changes it. No auto-reset, no session expiry. This is a system-wide principle documented here for emphasis.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `family_overview_configs`
Tables modified: None
Enums updated: None (section keys are registered constants, not database enums)
Triggers added: `set_updated_at` on `family_overview_configs`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Horizontally swipeable member columns as primary layout** | Mom needs to compare kids side-by-side. Columns let her swipe through on mobile or see 3-5 at once on tablet/desktop. Better than cards or data-type-first layouts for the "quick parenting decision" use case. |
| 2 | **Member selector uses small oval pill buttons in member's `calendar_color`** | Consistent with PRD-03 badge/pill design language. Color matches calendar dots, creating a unified visual language for "this color = this person." Same component as PRD-14B's Pick Members filter. |
| 3 | **Selected state = filled solid, deselected = outline** (or vice versa per PRD-03 system convention) | Defers to whatever PRD-03 establishes for button selected states. The spec describes the interaction, not the precise visual treatment. |
| 4 | **All family members selectable — mom and dad included with no special treatment** | Mom and dad are family members like anyone else in the selector. No artificial distinction. Default is children selected, adults deselected — but mom changes this with one tap. |
| 5 | **Calendar is the same component as PRD-14B, family filter, events only — no task due dates** | Reuse avoids inconsistency. Tasks are already visible in the columns below — doubling them on the calendar adds noise. Calendar stays clean for schedule scanning. |
| 6 | **Row-level section collapse with per-column override via long-press** | Row-level is the 90% case (collapse all "Events" to focus on "Tasks"). Per-column override handles the 10% (need to see Jake's events but nobody else's). Long-press prevents accidental overrides. |
| 7 | **Section order is global across all columns** | Per-column section ordering breaks the side-by-side alignment that makes the overview scannable. If Tasks is at position 2, it's position 2 for every kid. |
| 8 | **Mark-complete from columns, no unmark** | Mark-complete is quick and safe (additive). Unmark has cascade implications (reward rollback, streak adjustment per PRD-02) that deserve the full task detail context. |
| 9 | **Column order defaults to family setup order, reorderable** | Familiar starting point (the order mom set up her family). Reorderable so she can put the kids who need the most monitoring first. |
| 10 | **All settings persist until explicitly changed** | System-wide principle. Mom shouldn't have to reconfigure her Family Overview every session. Persistence respects her time. |
| 11 | **Dad's view scoped by per-kid permissions** | Consistent with PRD-02's per-kid per-feature model. Dad sees the subset he has access to. No all-or-nothing. |
| 12 | **Family Best Intentions (family-as-identity) deferred to PRD-14D Family Hub** | Best Intentions in PRD-06 are personal. The "family identity" concept is a schema change that belongs on the shared coordination surface (Hub), not the private monitoring lens (Overview). |
| 13 | **Vision Quest not surfaced on Family Overview** | Vision Quest lives in LifeLantern (sidebar) and will surface on Family Hub if anywhere. Family Overview is for daily operational monitoring, not long-term vision. |
| 14 | **Family Celebration launch point is personal dashboard or Family Hub, not Family Overview** | Family Celebration is a communal ritual. Family Overview is a private monitoring tool. The launch point should be on surfaces associated with gathering, not surveillance. |
| 15 | **AI integration: context loading at MVP, digest/forecast deferred** | Context loading is free value — LiLa knows where mom is. Digest and forecast need careful tone design to avoid nagging. Worth getting right, not rushing. |
| 16 | **Fixed structured layout, no widget grid on Family Overview** | The overview is a monitoring surface, not a customization playground. Section reordering provides enough flexibility. Avoids the "two dashboards to manage" problem. |
| 17 | **Separate `family_overview_configs` table, not extending `dashboard_configs`** | Family Overview has substantially different configuration needs (selected members, column order, section states with per-column overrides). A separate table is cleaner than overloading `dashboard_configs`. |
| 18 | **Section extensibility via registered string keys** | Future PRDs add sections by registering a component for a new key. No migration needed — just code. Unrecognized keys gracefully render "Coming soon." |
| 19 | **Weekly Completion and Pending Payout stubbed now** | Mom wants to see completion percentage and on-track payout. The data model doesn't exist yet (financial tracking PRD). Stubbing the sections reserves their place in the layout and signals intent. |
| 20 | **Family Overview calendar filter synced to member pill selector, not independent** | One control governs both surfaces — deselecting a kid from the pills removes their events from the calendar AND their column. Avoids conflicting member pickers on the same page. The shared calendar component accepts a `memberIds` prop; PRD-14B, PRD-14, and PRD-14C each pass different member ID arrays. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Weekly Completion percentage calculation | Financial Tracking PRD |
| 2 | Pending Payout amount calculation | Financial Tracking PRD |
| 3 | AI Daily Digest section | Post-MVP AI enhancement |
| 4 | AI Weekly Forecast section | Post-MVP AI enhancement |
| 5 | AI Proactive Observations section | Post-MVP AI enhancement |
| 6 | Family Best Intentions (family-as-identity) | PRD-14D Family Hub + schema change |
| 7 | Custom section types | Post-MVP |
| 8 | Quick-navigate from column header to View As | Post-MVP enhancement |
| 9 | Routine sub-step rendering in Tasks section | Can be added at build time if PRD-09A routine data is accessible; otherwise post-MVP |
| 10 | Export / share Family Overview snapshot | Post-MVP |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-14 (Personal Dashboard) | Family Overview stub fully wired. Perspective switcher "Family Overview" tab now links to real content. | Update PRD-14 stubs section to mark Family Overview stub as wired. |
| PRD-14B (Calendar) | Family Overview provides an additional entry point to the Universal Queue Modal (pending items bar). `MemberPillSelector` component defined — should be shared with PRD-14B's "Pick Members" filter. **Calendar component must accept a `memberIds` prop** so Family Overview can sync the calendar filter to the pill selector independently of PRD-14B's own filter state. Three consumers of the calendar component: PRD-14B (own filter), PRD-14 dashboard (self/family toggle), PRD-14C (pill selector). | Note shared `MemberPillSelector` component and calendar `memberIds` prop requirement in PRD-14B cross-references. |
| PRD-02 (Permissions & Access Control) | `family_overview` feature key registered. Dad's Family Overview access is a new permission. Mom's per-feature sharing with partner controls what dad sees in mom's column. | Add `family_overview` to the Feature Key Registry. Note the per-feature sharing implication in PRD-02's partner visibility documentation. |
| PRD-09A (Tasks) | Mark-complete from Family Overview writes `task_completions` with `approved_by` set (mom approving). Confirm PRD-09A's completion API supports this external write pattern. | Verify `task_completions` insert API doesn't require being on the Tasks page. Note Family Overview as a completion source. |
| PRD-03 (Design System) | `MemberPillSelector` component added to the shared component library. Small oval pills with member `calendar_color` fill/outline states. | Add to PRD-03 shared component list if not already covered by Badge component. |
| PRD-06 (Best Intentions) | Best Intentions data read by Family Overview for each selected member. No schema changes — reads existing `best_intentions` + `intention_iterations`. | Note Family Overview as a consumer of Best Intentions data in PRD-06 cross-references. |
| PRD-11 (Victory Recorder) | Victories data read by Family Overview for each selected member's today's victories. | Note Family Overview as a consumer of victories data. |
| PRD-10 (Widgets/Trackers) | Active tracker data read by Family Overview for each selected member. | Note Family Overview as a consumer of tracker data. |
| Build Order Source of Truth | PRD-14C completed. `family_overview` feature key locked. `MemberPillSelector` shared component established. | Update Section 2 to list PRD-14C as completed. Add feature key to locked registry. |

---

*End of PRD-14C*
