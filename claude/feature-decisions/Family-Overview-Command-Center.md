# Feature Decision File: Family Overview Command Center (FO-COMMAND-CENTER)

> **Created:** 2026-06-10
> **Vision (THE LAW):** `claude/feature-decisions/Family-Overview-Command-Center-Vision.md` (founder words verbatim, 2026-06-09)
> **PRDs read in full:**
>   - `prds/dashboards/PRD-14C-Family-Overview.md`
>   - `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`
>   - `prds/communication/PRD-17-Universal-Queue-Routing-System.md`
> **Addenda read:**
>   - `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`
>   - `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md`
>   - `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md`
>   - `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
>   - PRD-31 Permission Matrix rulings absorbed via `.claude/completed-builds/2026-06/permissions-wiring.md` (which read it in full)
> **Build files read:** `.claude/completed-builds/2026-06/role-scoping-leak-pass.md`, `.claude/completed-builds/2026-06/permissions-wiring.md`
> **Founder approved:** 2026-06-10 — all gate questions (Q1–Q9) answered; decisions recorded in the active build file. Highlights: dad granted-scoped FO approved; Finances tab → FO; Q2 hybrid (global default + per-day override pills, sequential shows next-item-only in views); inline edit modal in spot-check; section order Events → Tasks → Routines → Sequential → Opportunities → Best Intentions → Trackers → Weekly Completion → Victories; Sequential [+ Create] relocates to FO; Victories + Weekly Completion wired live.

---

## What Is Being Built

Family Overview becomes mom's command center: the per-member spot-checking, the
Routines / Opportunities / Sequential category views, Pending Approvals, and the
studio_queue decision surface all move FROM the Tasks page TO Family Overview —
joining the already-built member-column scroll, member multi-select, pending items
bar, and inline mark-complete. A new category multi-select lets mom choose "all
selected categories for all selected people." The Tasks page becomes purely
personal: the member's own items presented through the prioritization views, with
a new inclusion control letting routines, opportunities, and sequential items be
viewed alongside tasks inside those views.

---

## Current State (verified in code 2026-06-10)

| Surface | State |
|---|---|
| `FamilyOverview.tsx` (798 li) | Built: PendingItemsBar (opens UniversalQueueModal), simple today-only calendar list, MemberPillSelector (persisted multi-select), horizontal snap-scroll member columns, 7 section keys, row-level collapse, inline task mark-complete. NOT built from PRD-14C: per-column collapse override (long-press), section drag-reorder, column drag-reorder, week/month calendar component. `victories` + `weekly_completion` sections are stubs. |
| FO dad scoping | Reads `view_as_permissions` (STALE — predates leak-pass `useViewableMembers`). Dead code in practice: `PerspectiveSwitcher` shows the Family Overview tab to mom only, so no dad can reach FO today. |
| `Tasks.tsx` (1737 li) | Tabs: My Tasks / Routines / Opportunities / Sequential / Queue(N) / Finances (mom-only, PRD-28). Member pill bar from `viewableMembers` (default own, founder ruling 2026-06-09). PendingApprovalsSection with Build J mastery fork (`completion_type='mastery_submit'` → `useApprove/RejectMasterySubmission`). QueueTab renders studio_queue inline (batch grouping, dismiss, configure). Header QueueBadge opens UniversalQueueModal. Sequential tab hosts `SequentialCollectionView` + SequentialCreatorModal entry (Convention #150). |
| 13 prioritization views | Live in `DashboardTasksSection` (Dashboard only — PRD-09A Screen 7). 7 views real (simple_list, eisenhower, eat_the_frog, now_next_optional, by_category, one_five_three, kanban); 6 render `PlannedViewStub` (big_rocks, ivy_lee, abcde, moscow, impact_effort, by_member). The Tasks page has NO view carousel today. |
| `UniversalQueueModal` | 3-tab modal (Calendar/Sort/Requests, Convention #66/#146). Entry points: QuickTasks strip, Tasks page QueueBadge, Calendar page, Dashboard, MindSweepCapture, FO PendingItemsBar. Unaffected by this build except entry-point geography. |
| `family_overview` feature key | Already registered (`feature_key_registry`, migration 000009 line 481). |
| `family_overview_configs` | Live table: selected_member_ids, column_order, section_order TEXT[], section_states JSONB, calendar_collapsed, preferences JSONB. Section keys are registered TEXT constants — **adding `routines` + `sequential` needs NO migration** (PRD-14C extensibility mechanism). |

---

## Key PRD Decisions (Easy to Miss)

1. **PRD-09A View 13 ("By Member") was always spec'd as living on Family Overview** — "Only available on Mom's Family Overview (and Dad's if granted permission)." The founder's restructure is *with* the PRD grain, not against it.
2. **PRD-14C Decision 8: mark-complete from FO columns, NO unmark.** Unmark cascade stays on the full Tasks page / task detail. Preserve when adding richer sections.
3. **PRD-14C: section keys are registered string constants, not enums** — unrecognized keys render "Coming soon." Add `'routines'` and `'sequential'` to `FAMILY_OVERVIEW_SECTION_KEYS`; persisted `section_order` arrays from existing rows must gracefully gain the new keys (append-if-missing at read time, not a data migration).
4. **PRD-14C: row-level collapse default + per-column long-press override** — override is spec'd but never built; this build touches section UX, so decide whether to build it now or re-stub explicitly.
5. **PRD-14C: one control governs columns AND calendar** (member pill selector). New category multi-select must not introduce a second conflicting member picker.
6. **PRD-17: the Tasks page "Queue tab" and the UniversalQueueModal Sort tab are TWO renderings of the same studio_queue data.** PRD-17 says PRD-09A Screen 2 "is now the Sort tab within the Universal Queue Modal" — the inline page tab was a convenience surface. Moving it changes geography only; the modal contract (3 tabs, default-tab logic, entry points) is untouched.
7. **Convention #161: mastery approvals fork inside PendingApprovalsSection** on `completion_type='mastery_submit'` → mastery hooks, and `useApproveMasterySubmission` flips `completion_type` to `'mastery_approved'` so the gamification RPC accepts it (Convention #200). The relocation must move this logic intact — it is load-bearing for Build J and Build M.
8. **Convention #150: Tasks → Sequential tab → [+ Create] is one of three SequentialCreatorModal entry points.** If the Sequential tab leaves Tasks, the entry point moves with it (Studio + Lists entry points unchanged). Convention amendment required.
9. **Convention #68: view metadata lives on `tasks` rows** for ALL task types — routines/opportunities/sequential are `tasks` rows, so including them in prioritization views is a display-filter change, zero schema.
10. **Daily Progress Marking addendum §4.5: soft-claimed tasks must remain visible on the claimer's Tasks page** — the "purely personal" filter must keep `in_progress_member_id = me` tasks visible.
11. **Leak-pass ruling (2026-06-09): Tasks defaults to OWN member for every role including mom** — already shipped; this build completes the relocation that ruling anticipated ("relocation is a separate future build" → this is that build).
12. **PERMISSIONS-WIRING Decision 9: 'view' grants mean SEE ONLY** — `canActOnTask` / `accessLevelAtLeast(level, 'contribute')` gating must travel with Approvals and any FO action surfaces (inline complete, approve/reject).
13. **PRD-14C dad scoping spec:** dad sees pills ONLY for himself + granted kids; mom's column only if she shares per-feature. If dad FO access ships, scope via `useViewableMembers` (NOT the stale `view_as_permissions` read).
14. **PRD-14C empty states:** "(none today)" muted text per section; member column always renders even when empty; "All clear" pending bar never hidden.
15. **`weekly_completion` section was stubbed "until financial tracking PRD"** — PRD-28 has since shipped (allowance periods, `calculate_allowance_progress`). Wiring it is now possible; founder decides scope (gate Q9).

---

## Addendum Rulings Affecting This Build

### Studio Intelligence Addendum (PRD-09A/09B):
- "Tasks — Sequential tab continues to work exactly as before (dual access, not moved)" — **superseded by the newer founder vision (2026-06-09)**; newer wins per CLAUDE.md Convention #11. Document the supersession; Lists + Studio entry points unchanged.
- Created items display wherever matches mom's mental model — moving family-management surfaces to FO is the same principle.

### Linked Steps / Mastery Addendum:
- Mastery submissions appear in mom's approval queue alongside task approvals — the relocated PendingApprovalsSection must keep practice-history count + evidence display.
- Routine step "Done" placement and linked-step rendering are NOT touched by this build.

### Daily Progress Marking Addendum:
- Soft-claim visibility (§4.5) — personal Tasks filter must include held tasks.
- "Worked on this today" / duration prompt flows on Tasks.tsx move/stay with the personal page untouched.

### PRD-17B addendum:
- studio_queue has `mindsweep_confidence` / `mindsweep_event_id` + mindsweep source values — the relocated queue surface keeps rendering confidence badges and the cross-member INSERT path (migration 100120) untouched.

---

## Database Changes Required

**Expected: NONE.**
- New FO section keys = registered TEXT constants (PRD-14C extensibility).
- Category multi-select + view-inclusion preferences persist in existing JSONB (`family_overview_configs.section_states/preferences`, `dashboard_configs.preferences` or equivalent — final home decided at gate).
- `family_overview` feature key already registered.
If a migration becomes necessary, check `npx supabase migration list --linked` for the next free number first (last known: 100261).

---

## Feature Keys

| Feature Key | Status | Notes |
|---|---|---|
| `family_overview` | Already registered | Wrap FO tab with `useCanAccess('family_overview')` / PermissionGate if not already (PRD-14C MVP item). Enhanced tier (beta: true). |
| `family_overview_ai` | NOT this build | Post-MVP AI digest/forecast. |

---

## Stubs — Do NOT Build This Phase

- [ ] AI Daily Digest / Weekly Forecast / Proactive Observations (PRD-14C post-MVP)
- [ ] Full PRD-14B calendar component on FO (week/month grid, memberIds prop) — unless founder pulls it in; today-list stays
- [ ] Tasks/Lists RLS hardening (Convention #39 migration point)
- [ ] Reflections revamp, My Rewards content, Special Adult Experience (queued builds)
- [ ] The 6 PlannedViewStub views (big_rocks, ivy_lee, abcde, moscow, impact_effort, by_member) — stay stubs; no reduction AND no new view builds
- [ ] Export/share FO snapshot, section pinning, quick-nav to View As (PRD-14C post-MVP)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| FO routines section | ← | PRD-09A routines | `tasks` (task_type='routine') + `task_template_sections/steps` + `routine_step_completions` |
| FO sequential section | ← | PRD-09A/09B sequential | `sequential_collections` + `tasks` (sequential_collection_id), `useSequentialCollections(familyId, visibleMemberIds)` |
| FO approvals | ← / → | Build J mastery + Build M gamification | `task_completions.completion_type` fork; approval hooks fire `roll_creature_for_completion` |
| FO queue surface | ← | studio_queue (PRD-17) | mom family-wide RLS (migration 100255); modal contract untouched |
| FO member scoping | ← | PERMISSIONS-WIRING | `useViewableMembers`, `viewableLevels`, `accessLevelAtLeast` |
| Tasks page views | ← | Dashboard ViewCarousel/ViewRenderer | shared components from `src/components/tasks/` |
| Sidebar/BottomNav | → | Convention #16/#274 | if any nav entry changes, `getSidebarSections` + parity check |

---

## Open Decisions for the Founder Gate (do NOT decide silently)

See the active build file pre-build summary — Q1–Q9.

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Open decisions Q1–Q9 answered
- [ ] Stubs confirmed — nothing extra will be built
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Filled after build. Zero Missing = build complete.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0 required**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs acceptable + in STUB_REGISTRY.md
- [ ] Zero Missing confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
