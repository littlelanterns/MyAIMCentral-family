# PRD-14D Cross-PRD Impact Addendum

**Source:** PRD-14D (Family Hub) session — March 11, 2026
**Purpose:** Documents all changes needed in prior PRDs as a result of decisions made during the PRD-14D session. To be applied during the pre-build audit or backported in a dedicated update pass.

---

## Impact Summary

PRD-14D introduces the Family Hub — a shared family coordination surface — with significant cross-PRD implications. The largest structural change is extending the perspective switcher from mom-only to all adult/teen shells. Five new tables are defined, one existing table is modified, and multiple PRDs gain new data consumers.

---

## PRD-14 (Personal Dashboard)

### Changes Required

1. **Perspective switcher is no longer mom-only.**
   - Current spec (PRD-14 line 134–137): "Segmented control in the main content header area... Tabs: My Dashboard (active by default), Family Overview (stub → PRD-14C), Family Hub (stub → PRD-14D), View As... (inline member picker, per PRD-02)."
   - **Update:** The perspective switcher now appears on Dad/Adult and Independent Teen shells, not just Mom's. Tab composition is role-based:
     - **Mom:** My Dashboard, Family Overview, Hub, View As (4 tabs — unchanged)
     - **Dad/Additional Adult:** My Dashboard, Hub (2 tabs). If dad has Family Overview permission, add Family Overview (3 tabs). No View As unless granted.
     - **Independent Teen:** My Dashboard, Hub (2 tabs). No Family Overview. No View As.
     - **Guided/Play:** No perspective switcher (unchanged).
   - Update the Visibility & Permissions table (PRD-14 line 330–339) to reflect non-mom perspective switcher access.
   - Update Decision #3 rationale or add a cross-reference noting PRD-14D extended this.

2. **Hub stub is fully wired.**
   - Update the Stubs section: "Perspective switcher: Family Hub (stub, shows placeholder)" → mark as WIRED by PRD-14D.

3. **Family Best Intentions widget auto-deploys to personal dashboards.**
   - Note in the Widget Grid section or CLAUDE.md Additions that family-scoped widgets can auto-deploy to personal dashboard grids when mom creates them (new pattern from PRD-14D).

---

## PRD-14B (Calendar)

### Changes Required

1. **`calendar_events` table — add `show_on_hub` column.**
   - New column: `show_on_hub BOOLEAN NOT NULL DEFAULT true`
   - This is a per-event flag. Events default to visible on the Hub. Mom toggles it off for specific events.

2. **Event creation/edit UI — add "Hide from Hub" toggle.**
   - When creating or editing a calendar event, a "Hide from Hub" toggle (or button) should be available. Default: visible (on). Toggling it sets `show_on_hub = false`.
   - This is a simple boolean toggle, not a complex visibility system.

3. **Hub is a fourth consumer of the calendar component.**
   - Current consumers: PRD-14B (Calendar page, own filter), PRD-14 (dashboard, self/family toggle), PRD-14C (Family Overview, synced to pill selector).
   - **Add:** PRD-14D (Family Hub, all family members, filtered by `show_on_hub`).
   - The calendar component's `memberIds` prop receives all family member IDs from the Hub. The Hub adds an additional filter: `WHERE show_on_hub = true`.

---

## PRD-14C (Family Overview)

### Changes Required

1. **Deferred items resolved by PRD-14D.** Update these entries in the Deferred table:
   - Decision #12: "Family Best Intentions (family-as-identity) deferred to PRD-14D Family Hub" → **Resolved in PRD-14D.** New `family_best_intentions` table with per-member tally interaction. Separate from personal `best_intentions` table.
   - Decision #13: "Vision Quest not surfaced on Family Overview" → **Resolved in PRD-14D.** Family Vision Statement displays on the Hub when active.
   - Decision #14: "Family Celebration launch point is personal dashboard or Family Hub, not Family Overview" → **Resolved in PRD-14D.** Celebrate button on Hub's victories section, PIN-protected on standalone Hub.

---

## PRD-04 (Shell Routing & Layouts)

### Changes Required

1. **Hub content fully specified.**
   - The Tablet Hub Layout section describes the widget grid, member drawer, and always-on mode. Add a cross-reference: "Hub content, section architecture, and interaction model are fully defined in PRD-14D."

2. **`families.hub_config` JSONB superseded by `family_hub_configs` table.**
   - PRD-04 added `hub_config JSONB` to the `families` table for Hub configuration.
   - PRD-14D creates a dedicated `family_hub_configs` table instead (consistent with PRD-14C's `family_overview_configs` pattern).
   - **Update PRD-04:** Note that `families.hub_config` is no longer the Hub configuration location. The `family_hub_configs` table (PRD-14D) is authoritative. The `hub_config` column on `families` can be removed or repurposed during build.

3. **Perspective switcher extends beyond mom shell.**
   - PRD-04's perspective switcher description references it as mom-shell-only. Add a note: "PRD-14D extends the perspective switcher to Dad/Adult and Independent Teen shells with role-based tab composition."

---

## PRD-06 (Guiding Stars & Best Intentions)

### Changes Required

1. **Family Guiding Stars consumed by Hub slideshow.**
   - `guiding_stars` WHERE `owner_type = 'family'` AND `is_included_in_ai = true` are consumed by the Hub slideshow frame widget as auto-generated text slides.
   - Add to Outgoing Flows: "PRD-14D (Family Hub) — Family-level Guiding Stars feed into the Hub slideshow rotation when enabled."

2. **Clarify distinction between personal and family Best Intentions.**
   - PRD-06 defines `best_intentions` (personal, `owner_member_id` required).
   - PRD-14D defines `family_best_intentions` (family-level, separate table, different interaction model).
   - Add a note in PRD-06's CLAUDE.md Additions or Data Schema section: "Personal Best Intentions (`best_intentions` table, PRD-06) and Family Best Intentions (`family_best_intentions` table, PRD-14D) are distinct features with separate schemas and separate interaction models. Do not conflate them."

---

## PRD-11B (Family Celebration)

### Changes Required

1. **Hub Celebrate button confirmed.**
   - PRD-11B's "Where it lives" section references "Family Hub (shared tablet): 'Celebrate Our Family' button, PIN-protected."
   - Verify this is consistent with PRD-14D's implementation: PIN-protected on standalone `/hub` route, no extra PIN on perspective tab (user already authenticated).
   - No structural changes needed if already consistent.

---

## PRD-12B (Family Vision Quest)

### Changes Required

1. **Hub is a display surface for Family Vision Statement.**
   - Add to Outgoing Flows: "PRD-14D (Family Hub) — Active Family Vision Statement (`family_vision_statements` WHERE `is_active = true`) displays on the Hub as a prominent quote card."

---

## PRD-02 (Permissions & Access Control)

### Changes Required

1. **New feature keys to register in Feature Key Registry:**
   - `family_hub` — Core Hub display (calendar, countdowns, victory summary, member access, widget grid)
   - `family_hub_best_intentions` — Family Best Intentions creation, display, and tally tracking
   - `family_hub_slideshow` — Slideshow frame widget
   - `family_hub_tv_route` — `/hub/tv` route for TV rendering (PRD-14E stub)

2. **Hub access as a default-granted permission for Dad/Additional Adult.**
   - The perspective switcher Hub tab is visible to Dad by default. Note this as a default permission in PRD-02's partner permission configuration.

3. **Perspective switcher is now role-based, not mom-only.**
   - If PRD-02 references the perspective switcher as a mom-only feature, update to note that PRD-14D extended it.

---

## PRD-10 (Widgets, Trackers & Dashboard Layout)

### Changes Required

1. **`'family_hub'` as a `dashboard_type` value.**
   - The Hub's widget grid uses a `dashboard_configs` record with `dashboard_type = 'family_hub'`. Add this value to the `dashboard_type` enum documentation.

2. **New Hub-specific widget types to register:**
   - Menu / Dinner (text card)
   - Job Board (read-only list)
   - Slideshow Frame (media widget)
   - Countdown (countdown card)
   - Custom Text (free-text card)
   - Family Best Intentions (tally widget — also deploys to personal dashboards)

3. **Widget auto-deployment pattern for family Best Intentions.**
   - When mom creates a family intention with assigned members, a Family Best Intentions widget auto-deploys to each assigned member's personal dashboard widget grid. This is a new auto-deployment trigger (similar to how PRD-14 auto-deploys starter widgets for new users, but triggered by family intention creation rather than account creation).
   - Document this as a convention in PRD-10's CLAUDE.md Additions.

---

## PRD-09A (Tasks, Routines & Opportunities)

### Changes Required

1. **Hub Job Board as a read-only consumer.**
   - Opportunity tasks (`task_type LIKE 'opportunity_%'`) are consumed by the Hub's Job Board widget in read-only mode. No interaction changes to the task system.
   - Add to Outgoing Flows: "PRD-14D (Family Hub) — Job Board widget reads opportunity tasks in read-only mode. No claim action from Hub."

---

## Build Order Source of Truth

### Changes Required

1. **PRD-14D completed.** Add to Section 2 (Completed PRDs):
   - `PRD-14D | Family Hub | family_hub_configs, family_best_intentions, family_intention_iterations, countdowns, slideshow_slides`

2. **Feature keys locked:**
   - `family_hub`, `family_hub_best_intentions`, `family_hub_slideshow`, `family_hub_tv_route`

3. **Perspective switcher expansion** noted as a significant cross-PRD architectural change.

---

*End of PRD-14D Cross-PRD Impact Addendum*
