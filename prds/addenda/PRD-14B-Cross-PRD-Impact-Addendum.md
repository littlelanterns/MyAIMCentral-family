# PRD-14B Cross-PRD Impact Addendum

**Created:** March 10, 2026
**Session:** PRD-14B (Calendar)
**Purpose:** Documents how PRD-14B decisions affect prior PRDs and establishes new patterns/conventions.

---

## New Patterns Established

### Universal Queue Modal
PRD-14B defines a reusable tabbed modal component for processing pending items across features. Calendar registers the first tab. The component contract:
- Tabbed modal with badge counts per tab
- Each feature registers: label, badge count query, content component
- Opens to contextually relevant tab based on launch point
- Entry points: per-feature badge (Calendar page, Tasks page), dashboard pending count, QuickTasks "Review Queue"

**Action needed across PRDs:** PRD-09A's Task Creation Queue should be adapted to render as a tab in this modal during the audit/build phase. PRD-15 (Messages, Requests & Notifications) will add Requests and Messages tabs using the same contract.

### `calendar-parse-event` Edge Function (Reusable OCR Capability)
PRD-14B defines an Edge Function that accepts text or image input and returns structured event data. This uses OpenRouter vision models for image processing.

**Action needed:** PRD-09A's deferred OCR for sequential collections can reuse this same Edge Function capability (or a generalized version of it). Note this cross-reference during audit.

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- `family_members` table needs a `calendar_color` TEXT column (hex color for calendar display). If NULL, system assigns from a default 12-color palette.

**Action needed:**
- Add `calendar_color TEXT NULL` to the `family_members` table schema in PRD-01.

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- Four calendar feature keys registered: `calendar_basic` (Essential), `calendar_family` (Enhanced), `calendar_ai_intake` (Full Magic), `calendar_queue` (Enhanced).
- Calendar visibility follows the existing per-kid per-feature permission model — dad sees kid calendar events only if mom grants calendar access for that kid.

**Action needed:**
- Add calendar feature keys to the Feature Key Registry.
- Note calendar in the feature permission documentation as a feature that follows the standard per-kid access pattern.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Calendar page added as a sidebar navigation item (accessible to Mom, Dad, Independent, Guided shells; not Play).
- QuickTasks strip needs a "Review Queue" entry point that opens the Universal Queue Modal showing total pending count across all registered tabs.

**Action needed:**
- Add Calendar to the sidebar route configuration.
- Add "Review Queue" to QuickTasks strip definition (or note as a forward item if QuickTasks isn't fully specified yet).

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- `calendar_event_create` registered as a new guided mode. Context: family member names, default drive time, recent locations, existing recurring events.
- Calendar context for general conversations: next 7 days of events loaded when schedule/calendar context is relevant.
- `calendar-parse-event` Edge Function defined for event extraction from text and images.

**Action needed:**
- Add `calendar_event_create` to the guided mode registry in PRD-05.
- Add calendar events to the context assembly pipeline (when loaded, what's loaded, format).
- Reference the Edge Function in the Edge Function registry.

---

## Impact on PRD-08 (Journal + Smart Notepad)

**What changed:**
- "Send to → Calendar" routing stub now fully wired. Content routes through `calendar-parse-event` Edge Function. Extracted data populates Quick Add form. `source_type = 'review_route'`, `source_reference_id` = notepad tab ID.
- Review & Route calendar item routing: items with type "Calendar" route through the same parsing Edge Function.

**Action needed:**
- Mark the Calendar routing stub as wired in PRD-08's Stubs section.
- Note the Edge Function integration for calendar routing.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- Task due dates surface on the calendar as read-only items (queried directly from `tasks` table, no duplication).
- Calendar provides inline editing of task due dates: mom has full edit permission on any task's due date; members can only edit due dates on tasks they created themselves.
- Task Creation Queue should migrate into the Universal Queue Modal as a tab (same data, new container).

**Action needed:**
- Note the calendar-hosted task due date display in PRD-09A cross-references.
- Plan Task Creation Queue migration to Universal Queue Modal tab during build phase.
- Note that `calendar-parse-event` Edge Function establishes the OCR capability that PRD-09A's deferred sequential collection OCR can reuse.

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- Dashboard calendar section data source fully defined — reads from `calendar_events` table.
- `calendar_color_mode` preference added to `dashboard_configs.preferences` JSONB: `'dots'` or `'stripe'`.
- Calendar Queue badge count should feed into a dashboard-level "pending items" indicator in the greeting header area.

**Action needed:**
- Update PRD-14's `preferences` JSONB example to include `calendar_color_mode`.
- Note the pending items badge count as a dashboard feature (shows total across all queue tabs).
- Confirm dashboard calendar section reads `calendar_events WHERE status IN ('approved', 'pending_approval')`.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-14B completed.
- Universal Queue Modal established as a reusable pattern.
- `calendar-parse-event` Edge Function established as reusable OCR capability.
- **PRD-15 claimed for Messages, Requests & Notifications.** Covers: person-to-person messages (wires PRD-08 "Send to Person" stub), family requests with accept-and-route flow (Requests tab in Universal Queue Modal), and the notification delivery system (in-app + push) that calendar reminders, approval outcomes, and request responses depend on. Planned to write after the PRD-14 family is complete.

**Action needed during audit:**
- Move PRD-14B from Section 5 (flexible) to Section 2 (completed) in the Build Order.
- Add PRD-15 (Messages, Requests & Notifications) to Section 4 (locked) since PRD-14B now references it by number.
- Note Universal Queue Modal pattern in a conventions section.
- Note Edge Function reusability for PRD-09A.

---

*End of PRD-14B Cross-PRD Impact Addendum*
