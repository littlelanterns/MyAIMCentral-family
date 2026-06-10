# Family Overview — Command Center Vision (Founder, 2026-06-09)

> Status: CAPTURED — awaiting its own build session + pre-build process.
> Origin: chat session 2026-06-09 during the role-scoping leak pass. Founder words preserved.

## Founder's vision (verbatim intent)

> "I'd like to move all the abilities for spot checking, the tabs I like, the approvals,
> the queue tab, and spot checking a kid in the family overview. Those all are much more
> appropriate for that page than the tasks page. The task page should just be my page,
> and my 13 prioritization views. But, routines, and other things probably should have
> the ability to show as and be prioritize viewed alongside the tasks."

And on the overview layout:

> "I would like to also have it where in the family overview, I still have the ability
> to scroll side to side through all the members, and see it all at a glance for all
> selected people. I'd also like the ability to see all selected categories for all
> selected people. So tasks, routines, opportunities, etc. all listed under each of the
> selected people in the side to side swipe view of all members."

## Translation to scope

### Family Overview (PRD-14C surface) gains:
1. **Member spot-checking** — the per-member deep view that today lives behind the Tasks
   page member pill bar moves here.
2. **The tab set mom likes** — My Tasks / Routines / Opportunities / Sequential as
   *category sections* per member column (existing section system already has: events,
   tasks, best_intentions, trackers, weekly_completion, opportunities, victories —
   ADD: routines, sequential).
3. **Approvals** — PendingApprovalsSection relocates here (family-management concern).
4. **Queue tab** — the studio_queue decision inbox surface relocates here (the
   UniversalQueueModal entry stays wherever it is; the page-level tab moves).
5. **Category multi-select** — pick which categories show for all selected people at once
   (extends existing `family_overview_configs.section_states` / `selected_member_ids`).
6. Side-to-side member column scroll is ALREADY built — keep.

### Tasks page becomes:
- Purely personal: the member's own items only.
- 13 prioritization views remain its core identity.
- **New: routines and other item types (opportunities, sequential, habits) can be
  included in / viewed alongside tasks within the prioritization views** — a
  "what counts as a task for view purposes" inclusion control.

## Already built (70% head start)

- `family_overview_configs`: selected_member_ids, column_order, section_order,
  section_states, preferences.
- `src/components/family-overview/FamilyOverview.tsx`: member columns with collapsible
  sections (Events, Tasks, Best Intentions, Trackers, Weekly Completion, Opportunities,
  Victories) + per-member collapse overrides.
- `src/hooks/useFamilyOverviewData.ts` + `useFamilyOverviewConfig.ts`.

## Dependencies / cautions

- Depends on the role-scoping leak pass (2026-06-09) landing first — Family Overview is
  mom-only (PerspectiveSwitcher), so relocating family-management there strengthens the
  "Tasks page is personal" model.
- PendingApprovalsSection is shared by Build J mastery approvals (Convention #161) —
  relocation must preserve the mastery fork.
- Queue tab relocation must not break the Sort/Calendar/Requests tab contract
  (Convention #66, #146).
- Prioritization-view inclusion of routines: view metadata fields live on `tasks` rows
  (Convention #68) — routines are task rows (task_type='routine'), so inclusion is a
  display-filter change, not a schema change. Sequential/opportunities likewise.

## Pre-build pointers

- PRDs: PRD-14C (Family Overview), PRD-09A (Tasks views), PRD-17 (Queue).
- Check addenda for PRD-14 family + PRD-09A/09B per `claude/PRE_BUILD_PROCESS.md`.
