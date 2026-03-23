# PRD-14 Cross-PRD Impact Addendum

**Created:** March 10, 2026
**Session:** PRD-14 (Personal Dashboard)
**Purpose:** Documents how PRD-14 decisions affect prior PRDs and establishes new PRD numbers and relationships.

---

## New PRD Numbers Established

| PRD # | Feature Name | Relationship | When to Write |
|-------|-------------|-------------|---------------|
| **PRD-14B** | Calendar | Sub-PRD of PRD-14 family | Separate session (next recommended) |
| **PRD-14C** | Family Overview | Sub-PRD of PRD-14 family | After PRD-14B |
| **PRD-14D** | Family Hub (tablet/browser) | Sub-PRD of PRD-14 family | After PRD-14C |
| **PRD-14E** | Family Hub TV Mode | Sub-PRD of PRD-14 family | After PRD-14D |
| **PRD-25** | Guided Mode Dashboard | Tentatively earmarked | After PRD-24 (Rewards & Gamification) |
| **PRD-26** | Play Mode Dashboard | Tentatively earmarked | After PRD-24 (Rewards & Gamification) |

> **Note:** PRD-25 and PRD-26 are tentative assignments to open numbers. They become locked once any completed PRD references them by number. PRD-27 (Caregiver Tools) and PRD-28 (Tracking, Allowance & Financial) are already locked.

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**
- `dashboard_configs` table extended with `preferences` JSONB column (calendar view, week start, calendar filter, onboarding state, greeting rotation interval).
- `dashboard_configs.layout` JSONB now includes a `sections` array alongside the existing `widgets` and `folders` arrays. Each section has `key`, `visible`, `collapsed`, `order`, and `col_span` fields.
- Sections can span configurable column widths on 3+ column grids (not always full-width). `col_span` field controls this. `null` = span all columns. Integer = span that many columns.
- Auto-arrange algorithm must account for sections sharing grid rows with widgets on tablet/desktop.

**Action needed:**
- Update PRD-10 schema documentation to note the `preferences` column addition and the `sections` array in `layout` JSONB.
- Verify PRD-10's auto-arrange logic description is compatible with sections occupying partial grid rows.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Perspective switcher tabs confirmed: My Dashboard (implemented in PRD-14), Family Overview (stub → PRD-14C), Family Hub (stub → PRD-14D), View As (PRD-02).
- Dashboard collapsible sections pattern fully specified with responsive column spanning.
- Orientation handling confirmed: grid re-flows on viewport change (including tablet rotation) without reload, using ResizeObserver.

**Action needed:**
- No structural changes to PRD-04. Verify perspective switcher stub labels match: "My Dashboard", "Family Overview", "Family Hub", "View As..."
- Note in PRD-04 that the collapsible sections pattern is fully specified in PRD-14.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- Active Tasks section hosted as a collapsible section with configurable column span on the dashboard.
- Section can share grid rows with widgets on tablet/desktop (not always full-width).
- Section order is user-configurable — tasks might not be the first thing on the page.

**Action needed:**
- No changes to PRD-09A's Screen 7 contract. The section component renders the same regardless of its position or width in the dashboard layout.

---

## Impact on PRD-06 (Guiding Stars & Best Intentions)

**What changed:**
- Greeting header uses Guiding Stars data for a rotating declaration display. This is a separate rendering from the PRD-06 Guiding Stars rotation widget (which is an info widget in the grid). Same data source (`guiding_stars` table, `is_included_in_ai = true`), different UI.
- A user could have both the greeting rotation AND a Guiding Stars rotation widget on their dashboard simultaneously. Both read from the same table. The greeting shows one declaration as text; the widget shows one entry as a card. No conflict.

**Action needed:**
- Note in PRD-06 that the greeting header is an additional consumer of Guiding Stars rotation data, distinct from the widget.

---

## Impact on PRD-09B (Lists, Studio & Templates)

**What changed:**
- List pinning as lightweight dashboard widget confirmed as an info widget in the PRD-10 grid, hosted by PRD-14's widget grid section.

**Action needed:**
- No changes to PRD-09B. The stub is consumed as-is.

---

## Impact on PRD-11 (Victory Recorder + Daily Celebration)

**What changed:**
- Victory Recorder dashboard presence confirmed: "Log Victory" in QuickTasks strip (PRD-04), optional "Today's Victories" info widget in the dashboard grid. No standalone FAB on the dashboard.
- DailyCelebration (Guided/Play) dashboard integration deferred to PRD-25 and PRD-26.

**Action needed:**
- Verify PRD-11's "floating action button" language doesn't conflict with this decision. PRD-11 says "Record a Victory" FAB is "also accessible as global quick-action from any page" — this is the QuickTasks strip, not a separate FAB overlay on the dashboard.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-14B, 14C, 14D, 14E established as sub-PRDs.
- PRD-25 (Guided Dashboard) and PRD-26 (Play Dashboard) tentatively earmarked.
- Fire TV PWA validation noted (StewardShip functional on Fire TV via Silk browser).

**Action needed during audit:**
- Add PRD-14B/C/D/E to Section 4 or Section 5 of Build Order as appropriate.
- Add PRD-25 and PRD-26 to Section 5 with note "tentatively earmarked, assigned during PRD-14 session."
- Update the "Play Mode Dashboard" and "Guided Mode Dashboard" entries in Section 5 to reference PRD-25 and PRD-26.

---

*End of PRD-14 Cross-PRD Impact Addendum*
