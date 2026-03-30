# Feature Decision File: PRD-14 — Personal Dashboard (Reconciliation Build)

> **Created:** 2026-03-30
> **PRD:** `prds/dashboards/PRD-14-Personal-Dashboard.md`
> **Addenda read:**
>   - `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
>   - `prds/dashboards/PRD-14D-Family-Hub.md` (perspective switcher changes)
>   - `claude/feature-decisions/PRD-04-repair.md` (View As sign-off investigation)
> **Build spec:** User-provided reconciliation build spec (7 items)
> **Founder approved:** pending

---

## What Is Being Built

This is a reconciliation build. PRD-14 was never formally built — its features arrived incrementally via PRD-04, PRD-09A, PRD-10, PRD-14B, and UX overhaul sessions S1-S5. A 37-item audit identified 9 MISSING and 14 PARTIAL items. This build closes those gaps to bring the Personal Dashboard into full compliance with PRD-14.

The core additions are: (1) a data-driven section system with drag-to-reorder, visibility toggling, and collapse persistence; (2) rotating Guiding Stars declaration in the greeting header; (3) auto-deployed starter widgets for new users; (4) horizontally scrolling task view pills; (5) collapsible calendar section; (6) perspective switcher for non-mom roles (per PRD-14D update); (7) View As theme/shell fix; (8) View As rework — `acted_by` attribution, permission-gated member picker, shell rendering, feature exclusion enforcement.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| Dashboard.tsx refactor | Replace hardcoded JSX sections with data-driven section renderer |
| DashboardSectionRenderer (new) | Loops over `layout.sections`, renders correct component per key |
| DashboardSectionWrapper (new) | Shared wrapper: collapse toggle, edit mode drag handle, eye toggle, header row |
| Greeting header — declaration line | New sub-component below greeting text, rotating Guiding Stars with fade |
| CalendarWidget wrapper | Wrap in DashboardSectionWrapper for collapse support |
| DashboardTasksSection refactor | Replace `<select>` dropdown with horizontal scroll pill buttons |
| PerspectiveSwitcher refactor | Role-based tab composition: mom 4 tabs, dad 2-4, teen 2, guided/play none |
| PerspectiveSwitcher — View As tab | Inline member picker using colored pill buttons |
| PerspectiveSwitcher — Hub PlannedExpansionCard | Inline PlannedExpansionCard for non-mom Hub tab |
| ViewAsShellWrapper fix | Load target member's theme + render their shell type |
| View As `acted_by` attribution | Add `acted_by` column to task_completions, intention_iterations, calendar_events |
| View As permission-gated member picker | Filter member picker by `view_as_permissions.enabled` |
| View As feature exclusion enforcement | Block excluded features in PermissionGate + nav during View As |
| Empty state — onboarding card | Warm dismissible card for new users, tracked via preferences.onboarding_dismissed |

---

## Key PRD Decisions (Easy to Miss)

1. **Greeting is NEVER collapsible, NEVER hideable, always first.** It's excluded from reorder/visibility controls but still in the sections array for completeness (order 0, always visible).
2. **Guiding Stars declaration in greeting filters by `is_included_in_ai = true` AND `archived_at IS NULL`.** Hides entirely if no eligible entries. Uses `--font-display` for member name, `--font-body` for declaration text.
3. **Default section order:** greeting (0), calendar (1), active_tasks (2), widget_grid (3). On first dashboard load, if no sections exist, seed defaults.
4. **Starter widgets are conditional:** Guiding Stars widget only if member has >=1 star. Best Intentions widget only if member has >=1 intention. Today's Victories widget always. Plus warm onboarding card (dismissed via `preferences.onboarding_dismissed`).
5. **PRD-14D overrides PRD-14 on perspective switcher:** PRD-14 said mom-only. PRD-14D extends to all roles. Mom gets 4 tabs, Dad/Adult gets 2+ (My Dashboard + Hub, plus Family Overview if permitted, plus View As if permitted), Independent gets 2 (My Dashboard + Hub). Guided/Play get no switcher.
6. **View As renders member's theme + data:** PRD-14 line 514 says "renders using that member's dashboard_configs row, that member's theme tokens, and that member's data." Investigation shows ViewAsShellWrapper is currently a passthrough — this was never fully built.
7. **Section edit mode:** Long-press triggers edit for BOTH sections AND widgets. Sections show drag handle (left) + eye toggle (right). Widget grid shows its existing PRD-10 edit mode simultaneously.
8. **Task view pills auto-sort by usage.** Track in `dashboard_configs.preferences.task_view_usage` JSONB. Most-used views appear first. 0-use views go to end in default order.
9. **`acted_by` pattern for View As writes:** When mom acts in View As, the record's `member_id` = target child, `acted_by` = mom. `widget_data_points` already has `recorded_by_member_id` (no change needed there). Other tables need new nullable `acted_by UUID FK` column.
10. **`view_as_permissions` table exists but is completely unwired.** Created in migration 00000000000009 with `enabled` boolean + `excluded_features` JSONB. Member picker currently does zero permission checks. Mom has implicit full access (no record needed). Dad needs explicit `enabled = true` record.
11. **Feature exclusion has two layers:** `view_as_permissions.excluded_features` (permanent per viewer-member pair) and `view_as_feature_exclusions` (per-session). ViewAsProvider already has `setFeatureExclusions()` method wired to the per-session table. Need to merge both layers for enforcement.
12. **`view_as_mode` feature key** already registered in `feature_access_v2` at Enhanced tier, mom role group only.

---

## Addendum Rulings

### From PRD-14-Cross-PRD-Impact-Addendum.md:
- `dashboard_configs.layout` JSONB now includes a `sections` array alongside `widgets` and `folders` arrays
- Sections can span configurable column widths on 3+ col grids (`col_span`) — **DEFERRED** per build spec
- Auto-arrange algorithm must account for sections sharing grid rows — **DEFERRED** per build spec
- PRD-25 and PRD-26 may add section keys (`gamification_progress`, `daily_celebration`)
- Greeting header is an additional consumer of Guiding Stars rotation data, distinct from the info widget

### From PRD-14D (perspective switcher update):
- Perspective switcher extended to non-mom members (significant change from PRD-14)
- Mom: My Dashboard, Family Overview, Hub, View As (4 tabs)
- Dad/Adult: My Dashboard, Hub + Family Overview if permitted + View As if permitted (2-4 tabs)
- Independent Teen: My Dashboard, Hub (2 tabs)
- Guided/Play: no perspective switcher
- Family Overview remains restricted (mom-only, or dad with explicit permission per PRD-14C)

### From PRD-04-repair.md (View As investigation):
- PRD-04 repair marked View As as complete on 2026-03-25
- Investigation reveals ViewAsShellWrapper is a passthrough (`return <>{children}</>`)
- No theme_preferences loading, no shell type swapping for target member
- View As currently renders as a modal overlay showing member's data but mom's shell/theme
- This was never fully built — the passthrough was intentional to avoid breaking MomShell's component tree

---

## Database Changes Required

### New Tables
None.

### Modified Tables

**`dashboard_configs`** — No schema change needed. The `layout` JSONB column and `preferences` JSONB column already exist. We're adding structured data to these JSONB fields via application logic, not new columns.

**`task_completions`** — Add `acted_by UUID REFERENCES family_members(id)` nullable column. NULL = member acted for themselves.

**`intention_iterations`** — Add `acted_by UUID REFERENCES family_members(id)` nullable column.

**`calendar_events`** — Add `acted_by UUID REFERENCES family_members(id)` nullable column. (Note: `created_by` already exists but means "who created the event originally", not "who performed this specific action in View As".)

### Migrations

**Migration 1: Seed default sections for existing dashboard_configs rows**
- For all existing `dashboard_configs` rows where `layout` is null or doesn't contain a `sections` key, set the default sections array.
- Idempotent — only updates rows missing sections.

**Migration 2: Add `acted_by` columns for View As attribution**
- `ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS acted_by UUID REFERENCES family_members(id);`
- `ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS acted_by UUID REFERENCES family_members(id);`
- `ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS acted_by UUID REFERENCES family_members(id);`
- Idempotent via `IF NOT EXISTS`.

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `personal_dashboard` | TBD (beta: all) | all | Dashboard layout and customization |
| `dashboard_section_reorder` | TBD (beta: all) | mom, dad_adults, independent_teens | Section drag-and-drop reorder |

Both already registered. No new keys needed.

---

## Stubs — Do NOT Build This Phase

- [ ] Section `col_span` on 3+ column grids (A6) — deferred, sections remain full-width
- [ ] Widget folder drag-to-create gesture (E2) — folder infrastructure exists, no creation UX
- [ ] Notification bell (J2) — depends on PRD-15 (Messages/Notifications)
- [ ] Calendar week/month toggle on dashboard (dashboard calendar is always week view per PRD-14B)
- [ ] Mom Self/Family calendar toggle (Pick Members filter already exists, functionally equivalent)
- [ ] ResizeObserver (matchMedia resize listener already handles viewport changes)
- [ ] LifeLantern summary widget — PRD-12A not built
- [ ] Special Adult shift-scoped dashboard read — requires PRD-27 shift infrastructure

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Dashboard greeting | ← reads | PRD-06 Guiding Stars | `guiding_stars` table, `is_included_in_ai = true`, `archived_at IS NULL` |
| Dashboard tasks | ← reads | PRD-09A Tasks | `tasks` table via `useTasks` hook |
| Dashboard widgets | ← reads | PRD-10 Widgets | `dashboard_widgets` table via `useWidgets` hook |
| Dashboard calendar | ← reads | PRD-14B Calendar | `calendar_events` table via `useEventsForRange` |
| Starter widgets | → creates | PRD-10 Widgets | `dashboard_widgets` table insert on first load |
| Section config | → saves | dashboard_configs | `layout.sections` JSONB via `useUpdateDashboardConfig` |
| Perspective switcher | → navigates | PRD-14D Hub | `/hub` route or inline PlannedExpansionCard |
| View As | → reads | PRD-02 Permissions | `view_as_sessions`, `family_members.theme_preferences` |

---

## Things That Connect Back to This Feature Later

- PRD-14C (Family Overview) wires into the Family Overview perspective tab
- PRD-14D (Family Hub) already wired — Hub tab navigates to /hub
- PRD-25 (Guided Dashboard) may add section keys
- PRD-26 (Play Dashboard) may add section keys
- PRD-12A (LifeLantern) adds summary widget to grid
- PRD-15 (Messages) adds notification bell to dashboard header

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

> To be completed after build.

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
