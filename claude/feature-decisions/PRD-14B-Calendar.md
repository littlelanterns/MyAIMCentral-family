# Feature Decision File: PRD-14B — Calendar

> **Created:** 2026-03-28
> **PRD:** `prds/dashboards/PRD-14B-Calendar.md`
> **Addenda read:**
>   - `prds/addenda/PRD-14B-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-08-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md`
>   - `specs/Universal-Scheduler-Calendar-Consolidated-Update.md` (superseding spec)
> **Founder approved:** Pending

---

## What Is Being Built

The Calendar system — a full standalone Calendar page accessible from the sidebar, plus a compact week-view dashboard widget. The calendar shows family events (color-coded by member), task due dates, and supports an approval workflow for kid-created events. Mom sees everything overlaid; other members see their own events. Events are created via modals with the Universal Scheduler for recurrence. The system includes member color coding (dots/stripe modes), date navigation with a MiniCalendarPicker, configurable week start day, and approval/rejection from DateDetailModal.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| Full Calendar Page (`/calendar`) | Sidebar route. Default view: **Month**. Day/Week/Month toggle, filter modes (Me/Family/Pick Members), color mode (Dots/Stripe), date navigation with month dropdown + editable year + MiniCalendarPicker + Today button. `density-compact`. |
| Calendar Dashboard Widget | Week view widget on Personal Dashboard. 7-column grid respecting `week_start_day`. "View Month" opens modal overlay. Jump-to-date via MiniCalendarPicker. |
| DateDetailModal | Transient modal (ModalV2, size `md`). Shows events grouped by type for a specific date. Prev/next day arrows + MiniCalendarPicker jump. Approve/reject buttons for mom on pending events. |
| EventCreationModal | Persistent modal (ModalV2, size `md`, gradient header). Section-card form: Title, Date & Time, Location, Description, Recurrence (Universal Scheduler with `showTimeDefault={true}`), Who's Involved (checkbox rows with attendee roles), Transportation & Logistics, Category dropdown, Reminders chips. |
| Event Detail Modal | Transient modal showing full event details. Edit/Approve/Reject/Delete actions. Items-to-bring checklist is interactive. |
| Task Due Date Flyout | Transient modal when clicking a task due date on calendar. Shows task title, assignee, status. Change Due Date (mom: any task; member: self-created only), Mark Complete, View Full Task. |
| Calendar Settings | Accessible from Calendar page gear icon. Week start day, default view, color mode, default drive time, required intake fields for kid events, auto-approve member toggles. |
| MiniCalendarPicker (shared) | Compact month grid with clickable month dropdown + editable year + Today button. Shared by Calendar page, DateDetailModal, Dashboard widget, Universal Scheduler. |
| Calendar Queue Tab (stub) | Universal Queue Modal Calendar tab — stub for now, approval happens in DateDetailModal. |
| Month View Modal (from widget) | Transient modal (size `xl`) showing full month. Opened from dashboard widget "View Month" button. |
| Empty states | Calendar page: "Your calendar is empty..." / Queue: "All caught up!" / Family view: "No family events scheduled..." |

---

## Key PRD Decisions (Easy to Miss)

1. **Date storage uses separate fields:** `event_date DATE` + `start_time TIME` + `end_time TIME` + `end_date DATE` (for multi-day). NULL times = all-day event. This is simpler for date queries than combined TIMESTAMPTZ.
2. **Category uses UUID FK** to `event_categories.id` — not a text slug column. System categories have `family_id IS NULL`.
3. **11 system categories** (not 8): Learning, Sports, Medical, Family, Social, Faith, Music & Arts, Travel, Celebration, Work, Other. "Learning" not "School" (per Decision #15 — homeschool families).
4. **`items_to_bring` is JSONB** with structure `[{text: string, checked: boolean, ai_suggested: boolean}]` — not a simple text array. Checkable state for packing.
5. **`transportation_notes TEXT`** (not `transportation_details`) — PRD naming wins.
6. **Default drive time is 30 minutes** (not 15).
7. **`required_intake_fields JSONB DEFAULT '[]'`** in `calendar_settings` — mom configures which fields are mandatory for kid events.
8. **Recurrence uses Universal Scheduler** output: `recurrence_details JSONB` (RRULE format) + `recurrence_rule TEXT` (quick-filter enum). No individual recurrence columns.
9. **Week default view: Full page = Month, Dashboard widget = Week.** PRD says "Week (default)" for the page but founder overrode this to Month for the full page.
10. **Click any date on any view** opens DateDetailModal as transient overlay — calendar stays visible behind it. Consistent across Month/Week/Day.
11. **Events by mom auto-approved.** Events by members in `calendar_settings.auto_approve_members` auto-approved. All others `pending_approval`.
12. **Pending event rendering:** faded/gray, dotted border, "pending" badge. Full color on approval.
13. **Task due dates read from `tasks` table** — NO duplication into `calendar_events`. Distinct checkbox icon, slightly muted style.
14. **`reminder_minutes INTEGER[]`** — array supports multiple reminders per event.
15. **Member color stored on `family_members.calendar_color`** (already exists in live schema). Used for dots/stripe rendering across calendar surfaces.

---

## Addendum Rulings

### From PRD-14B-Cross-PRD-Impact-Addendum.md:
- Universal Queue Modal is a reusable tabbed component. Calendar registers first tab. **Stubbed for this phase** — approval happens in DateDetailModal.
- `calendar-parse-event` Edge Function for OCR. **Stubbed** — needs OpenRouter vision model.
- `calendar_event_create` guided mode for LiLa. **Stubbed** — needs LiLa integration.
- 4 feature keys: `calendar_basic`, `calendar_family`, `calendar_ai_intake`, `calendar_queue`.
- Calendar added to sidebar nav. QuickTasks "Review Queue" entry point noted.

### From PRD-35-Cross-PRD-Impact-Addendum.md:
- **Replaces custom recurrence dropdown** with Universal Scheduler component.
- `recurrence_details JSONB` format: `{rrule, dtstart, until, count, exdates, rdates, timezone, schedule_type, completion_dependent, custody_pattern}`.

### From specs/Universal-Scheduler-Calendar-Consolidated-Update.md (supersedes):
- Universal Scheduler redesigned to radio-button primary interface ("How Often?").
- EventCreationModal uses Universal Scheduler with `showTimeDefault={true}`.
- MiniCalendarPicker is a shared component used everywhere.
- WeekdayCircles gets `weekStartDay` prop.
- All schema answers confirmed (see Part 4 of that spec).

---

## Database Changes Required

### New Tables
- `event_categories` — family-scoped categories. `family_id` nullable (NULL = system). 11 system seeds.
- `calendar_events` — main events table. Separate `event_date DATE` + `start_time TIME` + `end_time TIME` + `end_date DATE`. `category_id UUID` FK. `recurrence_details JSONB` + `recurrence_rule TEXT`. `items_to_bring JSONB`. `transportation_notes TEXT`. `reminder_minutes INTEGER[]`.
- `event_attendees` — per-event per-member. Role: attending/driving/requested_presence. Response: pending/accepted/declined. UNIQUE(event_id, family_member_id).
- `calendar_settings` — per-family. `default_drive_time_minutes INTEGER DEFAULT 30`, `required_intake_fields JSONB DEFAULT '[]'`, `auto_approve_members UUID[]`, `week_start_day INTEGER DEFAULT 0`.

### Modified Tables
- `family_members` — `calendar_color VARCHAR(7)` (already exists in live schema per dump).

### Migrations
- Single idempotent migration: `00000000100052_calendar_system.sql`
- Creates all 4 tables, RLS, indexes, triggers, seeds 11 system categories.

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `calendar_basic` | Essential | all | Personal calendar, create/view/edit own events |
| `calendar_family` | Enhanced | mom, dad_adults | Family views, member filtering, color coding |
| `calendar_ai_intake` | Full Magic | mom, dad_adults, independent_teens | Image-to-event OCR, LiLa guided creation (stub) |
| `calendar_queue` | Enhanced | mom | Event approval queue |

---

## Stubs — Do NOT Build This Phase

- [ ] Image-to-event OCR (`calendar-parse-event` Edge Function) — needs OpenRouter vision model
- [ ] LiLa guided event creation ("Help Me Plan This") — needs LiLa guided mode integration
- [ ] Universal Queue Modal Calendar tab — approval happens in DateDetailModal for now
- [ ] Calendar context for LiLa conversations — needs PRD-05 context assembly wiring
- [ ] Guided shell simplified calendar — needs PRD-25
- [ ] Play shell icon calendar — needs PRD-26
- [ ] Google Calendar sync — post-MVP
- [ ] Push notification delivery for reminders — needs PRD-15
- [ ] Event conflict detection — post-MVP
- [ ] Drag-to-reschedule — post-MVP
- [ ] "Send to Calendar" routing from Notepad — needs `calendar-parse-event` Edge Function
- [ ] Camera/photo capture on Calendar page — needs OCR Edge Function
- [ ] LiLa "items to bring" auto-suggestions — needs AI integration

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Calendar events | <- | Smart Notepad "Send to Calendar" | `source_type = 'review_route'` (stub — needs Edge Function) |
| Calendar events | <- | Review & Route Calendar routing | `source_type = 'review_route'` (stub) |
| Calendar page | <- reads | Tasks table | `tasks.due_date IS NOT NULL` — read-only display on calendar |
| Calendar events | -> | Dashboard calendar widget | Reads `calendar_events` for week view |
| Calendar events | -> | LiLa context assembly | `is_included_in_ai = true` events loaded as context (stub) |
| Calendar approval | -> | Notifications | Approval/rejection notifications (stub — PRD-15) |
| Calendar settings | <- | Family settings | `calendar_settings.week_start_day` used by MiniCalendarPicker, WeekdayCircles |
| Calendar recurrence | <- | Universal Scheduler | `recurrence_details JSONB` output |

---

## Things That Connect Back to This Feature Later

- PRD-15 (Messages, Requests & Notifications) — notification delivery for reminders and approval outcomes
- PRD-14C (Family Overview) — will consume calendar data for aggregated family view
- PRD-14D (Family Hub) — shared family calendar surface using same filter/color patterns
- PRD-14E (Family Hub TV Mode) — ambient calendar display
- PRD-25 (Guided Dashboard) — simplified calendar for Guided shell
- PRD-26 (Play Dashboard) — icon calendar for Play shell
- PRD-05 (LiLa) — calendar context in conversations, `calendar_event_create` guided mode
- PRD-08 (Notepad) — "Send to Calendar" routing wired through Edge Function
- PRD-17B (MindSweep) — MindSweep-to-calendar intake pipeline

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

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Post-Build Verification (2026-03-28)

**Summary: 185 requirements — 155 Wired, 13 Stubbed, 17 Missing**

### Missing Items (17)

| # | Item | Cluster | Severity |
|---|------|---------|----------|
| 58 | Pick Members filter mode (third filter with member avatars) | Toolbar | Medium |
| 59 | Color mode toggle (Dots/Stripe) | Toolbar | Low |
| 60 | calendar_color_mode preference persistence | Toolbar | Low |
| 80 | ?new=1 URL param auto-opens EventCreationModal | Toolbar | Low |
| 93 | MiniCalendarPicker in CalendarWidget | Widget | Low |
| 106 | [Edit] button on event in DateDetailModal | Detail | Medium |
| 107 | [Delete] button on event in DateDetailModal | Detail | Medium |
| 108 | Items-to-bring interactive checklist in event detail | Detail | Medium |
| 109 | Leave-by time display in event detail | Detail | Low |
| 110 | Attendees display with roles in event detail | Detail | Medium |
| 111 | Recurrence info display in event detail | Detail | Low |
| 112 | Rejection note input on reject | Detail | Low |
| 146 | Required intake fields config in Settings | Settings | Medium |
| 147 | Default view preference in Settings | Settings | Low |
| 148 | Color mode preference in Settings | Settings | Low |
| 163-166 | Task due date actions (Change Due Date, Mark Complete, View Task) | Tasks | Medium |

### Stubbed Items (13) — all pre-approved, external dependencies

Image OCR, LiLa guided creation, Queue Modal Calendar tab, Calendar context for LiLa, Guided/Play shell variants, Google Calendar sync, Push notifications, Notepad-to-Calendar, Event conflict detection, Drag-to-reschedule, LiLa items-to-bring suggestions, Camera/photo capture.

### Wired Items (155)

Full database layer (4 tables, RLS, indexes, triggers, seeds, feature keys), types, hooks (14 hooks), CalendarPage (Month/Week/Day views, navigation, filters, toolbar), CalendarWidget (week default, gradient header, event dots, task squares), DateDetailModal (approve/reject, pending treatment), EventCreationModal (all fields including scheduler, attendees, items-to-bring, transportation), MonthViewModal, CalendarSettingsModal (week start, drive time, auto-approve), MiniCalendarPicker (month dropdown, editable year, scheduler preview), approval workflow, task due dates on calendar.

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] 17 Missing items: build now or approve as stubs?
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] **Phase approved as complete**
- **Completion date:**
