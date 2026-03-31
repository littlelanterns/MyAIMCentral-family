# Feature Decision File: PRD-14C — Family Overview

> **Created:** 2026-03-30
> **PRD:** `prds/dashboards/PRD-14C-Family-Overview.md`
> **Addenda read:**
>   - `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
> **Founder approved:** 2026-03-30

---

## What Is Being Built

Mom's aggregated command post: a Family Overview tab in the perspective switcher that shows every selected family member's activity in side-by-side horizontally-swipeable columns. Each column contains the same collapsible sections (events, tasks, Best Intentions, trackers, opportunities) so mom can compare at a glance. A family calendar sits above the columns filtered by the same member selection. A pending items bar shows queue badge counts. Mom can mark a child's task complete directly from this view. Dad gets a permission-gated scoped version.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| FamilyOverview (replaces FamilyOverviewStrip in Dashboard.tsx) | Main container for the entire Family Overview tab |
| PendingItemsBar | Horizontal bar with badge counts for Calendar, Sort, Requests tabs. "All clear" when zero. Taps open UniversalQueueModal. |
| FamilyOverviewCalendar | CalendarWidget variant that accepts `memberIds` prop — filtered by member pill selection. Week/month toggle. Collapsible. Events only (no task due dates). |
| MemberPillSelector | Shared component: oval pill buttons in member's `calendar_color`. Tap to toggle. Reusable by PRD-14B "Pick Members" filter. |
| MemberColumn | Single column for one family member. Sticky header with name + avatar + color accent. Contains section renderers. |
| MemberColumnsContainer | Horizontally scrollable container with snap-to-column on mobile. Responsive column count. |
| FamilyOverviewSection (generic wrapper) | Section header with collapse/expand chevron + count badge. Row-level collapse default, long-press for per-column override. |
| EventsSection | Today's calendar events for one member |
| TasksSection | Today's tasks with inline mark-complete checkboxes |
| BestIntentionsSection | Active Best Intentions with daily iteration tally |
| TrackersSection | Active widget trackers with current value |
| WeeklyCompletionSection | STUB — "Coming soon" placeholder |
| OpportunitiesSection | Opportunity tasks completed today with reward |
| VictoriesSection | STUB — "Coming soon" placeholder per founder guidance |
| FamilyOverviewOnboardingCard | Warm dismissible card for new accounts with no data |
| Empty state per section | "(none today)" in muted text |
| Column dot indicators (mobile) | Position dots when swiping through columns |

---

## Key PRD Decisions (Easy to Miss)

1. **PRD schema overrides database_schema.md:** The PRD specifies `family_member_id` (one config row per user who has access), not `family_id` UNIQUE (one row per family). The PRD's per-member schema is correct because dad could have different settings than mom.
2. **Calendar filter is synced to member pill selector** — there is NO separate "Pick Members" filter on the Family Overview calendar. The pill selector IS the calendar filter.
3. **Calendar shows events ONLY — no task due dates.** Task status is in the columns below.
4. **Row-level section collapse by default.** Tapping a section header collapses it in ALL columns simultaneously. Long-press = per-column override only. Override indicator (subtle dot on header).
5. **Section order is GLOBAL across columns** — no per-column section ordering.
6. **No unmark from Family Overview.** Tapping a completed task does NOT uncheck it. Unmark requires full Tasks page context due to reward/streak rollback implications.
7. **Mark-complete sets `approved_by`:** When mom checks a task from Family Overview, `task_completions.approved_by` and `approved_at` are set immediately (mom is approving by checking it herself).
8. **First-time member selection default:** All children selected, mom and dad deselected.
9. **Empty `selected_member_ids` array means first-time** — apply the default (all children).
10. **Column width is equal and fixed** — columns don't vary in width within the viewport.
11. **Incomplete tasks listed first, then completed.** Within each group, ordered by due time then sort order.
12. **Routine sub-step rendering is POST-MVP** — show routine name with completion count but no nested steps.
13. **Section extensibility:** Unrecognized section keys render "Coming soon" placeholder gracefully.
14. **Dad sees only permitted children** + himself. Mom's pill not visible to dad unless mom has per-feature sharing enabled.
15. **Pending items bar shows "All clear" when all counts are zero** — never hidden entirely.

---

## Addendum Rulings

### From PRD-14-Cross-PRD-Impact-Addendum.md:
- `dashboard_configs.layout` JSONB includes `sections` array for personal dashboard. Family Overview uses its OWN table (`family_overview_configs`), not dashboard_configs.
- Perspective switcher tabs confirmed: My Dashboard, Family Overview, Hub, View As.
- PRD-14C section collapse pattern (row-level) is DIFFERENT from PRD-14 personal dashboard sections (per-section). Both are valid for their contexts.

### From PRD-Audit-Readiness-Addendum.md:
- All tables must have RLS enabled — `family_overview_configs` needs RLS policies.
- `reveal_type` not `animation_template`, `access_schedules` not `shift_schedules` — not directly relevant here but noted.

### From PRD-Template-and-Audit-Updates.md:
- No direct impact on PRD-14C.

---

## Database Changes Required

### New Tables

**`family_overview_configs`** (PRD schema is authoritative — per-member, not per-family):

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | — | NOT NULL | FK families |
| family_member_id | UUID | — | NOT NULL | FK family_members. UNIQUE per member. |
| selected_member_ids | UUID[] | '{}' | NOT NULL | Which members appear as columns. Empty = first-time default. |
| column_order | UUID[] | '{}' | NOT NULL | Custom column order. Empty = family_members sort_order. |
| section_order | TEXT[] | see default | NOT NULL | Section keys in display order. Default: ['events','tasks','best_intentions','trackers','weekly_completion','opportunities','victories'] |
| section_states | JSONB | '{}' | NOT NULL | Row-level + per-column overrides. Shape: `{"tasks": {"collapsed": false, "overrides": {"<member_id>": true}}}` |
| calendar_collapsed | BOOLEAN | false | NOT NULL | Calendar section collapse state |
| preferences | JSONB | '{}' | NOT NULL | `calendar_view` ('week'/'month'), `onboarding_dismissed`, extensible |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS:** Members can SELECT/UPDATE/INSERT their own config. Mom can SELECT any family member's config.
**Indexes:** `(family_member_id)` UNIQUE, `(family_id)`
**Trigger:** `trg_foc_updated_at`

### Modified Tables
None.

### Migrations
- `00000000100060_prd14c_family_overview_configs.sql` — Creates table, RLS, indexes, trigger.

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `family_overview` | Enhanced | mom, dad_adults | Already registered from PRD-14 build |
| `family_overview_ai` | Full Magic | mom, dad_adults | Future — AI digest/forecast sections |

---

## Stubs — Do NOT Build This Phase

- [ ] Weekly Completion section — "Coming soon" placeholder (requires PRD-28 financial tracking)
- [ ] Victories section — "Coming soon" placeholder per founder guidance (PRD-11 not fully wired)
- [ ] AI Daily Digest section — post-MVP
- [ ] AI Weekly Forecast section — post-MVP
- [ ] Proactive Observations section — post-MVP
- [ ] Routine sub-step rendering within Tasks section — post-MVP
- [ ] Quick-navigate from column header to View As — post-MVP
- [ ] Export/share family overview snapshot — post-MVP
- [ ] Offline mark-complete (IndexedDB sync) — deferred to PRD-33
- [ ] Section pinning — post-MVP
- [ ] Custom sections — post-MVP
- [ ] Batched queries for 10+ members — defer until needed

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Reads calendar events | <- | PRD-14B Calendar | `calendar_events` + `event_attendees` WHERE event_date = today AND member is creator/attendee |
| Reads tasks | <- | PRD-09A Tasks | `tasks` + `task_assignments` + `task_completions` WHERE assigned to member AND active/due today |
| Writes task completions | -> | PRD-09A Tasks | `task_completions` INSERT (checked anywhere, checked everywhere) |
| Reads Best Intentions | <- | PRD-06 | `best_intentions` WHERE is_active + `intention_iterations` WHERE day_date = today |
| Reads tracker widgets | <- | PRD-10 Widgets | `dashboard_widgets` + `widget_data_points` WHERE member's active trackers |
| Reads opportunities | <- | PRD-09A Tasks | `task_completions` JOIN `tasks` WHERE task_type LIKE 'opportunity%' AND completed today |
| Reads victories | <- | PRD-11 Victories | `victories` WHERE member_id AND created_at is today |
| Opens Universal Queue Modal | -> | PRD-14B | Pending items bar badge taps |
| Opens Event Detail | -> | PRD-14B | Calendar event taps open DateDetailModal |
| Reads pending counts | <- | PRD-14B/17 | `studio_queue`, `calendar_events`, `family_requests` pending counts |
| Respects member permissions | <- | PRD-02 | Dad's view scoped by `view_as_permissions` + `member_permissions` |

---

## Things That Connect Back to This Feature Later

- PRD-28 (Financial Tracking) wires the Weekly Completion section with real completion % and payout amounts
- PRD-11 (Victory Recorder) — when fully wired, Victories section shows real data
- Post-MVP AI features add Daily Digest, Weekly Forecast, Proactive Observations sections
- PRD-27 (Caregiver Tools) — Special Adult shift view is separate, but may reference Family Overview patterns
- Future PRDs can register new section keys that auto-render in columns

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

| # | Requirement | Status | Notes |
|---|---|---|---|
| 1 | `family_overview_configs` table with per-member UNIQUE | **Wired** | Migration 00000000100060 |
| 2 | RLS: members SELECT own, mom SELECT all | **Wired** | 4 policies |
| 3 | Feature keys registered | **Wired** | `family_overview` + `family_overview_ai` |
| 4 | `useFamilyOverviewConfig` hook with upsert | **Wired** | Auto-creates on first access |
| 5 | `MemberPillSelector` shared component | **Wired** | Pill buttons with member colors |
| 6 | `PendingItemsBar` with counts + "All clear" | **Wired** | `usePendingCounts` hook, 30s refresh |
| 7 | `FamilyOverviewCalendar` — events only, collapsible | **Wired** | Flat event list |
| 8 | Calendar week/month toggle | **Stubbed** | Post-MVP UX polish |
| 9 | FamilyOverview main — stacked layout | **Wired** | Pending → Calendar → Pills → Columns |
| 10 | Horizontal scroll with snap-to-column | **Wired** | |
| 11 | Responsive column widths (1-5 cols) | **Wired** | ResizeObserver |
| 12 | Sticky column headers with color accent | **Wired** | |
| 13 | Column drag-to-reorder | **Stubbed** | Post-MVP UX polish |
| 14 | Dot indicators on mobile | **Wired** | |
| 15 | EventsSection | **Wired** | time, title, pending faded |
| 16 | TasksSection | **Wired** | checkbox, strikethrough, N/M count, no unmark |
| 17 | BestIntentionsSection | **Wired** | daily tally |
| 18 | TrackersSection | **Wired** | |
| 19 | OpportunitiesSection | **Wired** | |
| 20 | WeeklyCompletionSection | **Stubbed** | PRD-28 dependency |
| 21 | VictoriesSection | **Stubbed** | Per founder guidance |
| 22 | Row-level section collapse | **Wired** | Persists to config |
| 23 | Per-column override (long-press) | **Stubbed** | Post-MVP UX polish |
| 24 | Section drag-to-reorder | **Stubbed** | Post-MVP UX polish |
| 25 | Dad's scoped view | **Wired** | Filters by view_as_permissions |
| 26 | Empty state for no columns | **Wired** | |
| 27 | Onboarding card | **Wired** | |
| 28 | E2E test suite | **Wired** | 11 tests |

**Summary:** 20 Wired, 8 Stubbed (4 planned + 4 post-MVP polish), 0 Missing

---

## Founder Sign-Off (Post-Build)

- [x] Verification table reviewed
- [x] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [x] Zero Missing items confirmed
- [x] **Phase approved as complete**
- **Completion date:** 2026-03-31
