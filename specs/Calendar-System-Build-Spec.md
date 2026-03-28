# Calendar System — Build Spec for Claude Code

**Type:** Implementation spec — ready for Claude Code
**Priority:** High — needed before beta (kids need to see their schedules)
**Reference PRDs:** PRD-14B (Calendar), PRD-14 (Personal Dashboard), PRD-04 (Shell Routing)
**V1 Reference:** CalendarSystem-18files.zip (working v1 implementation)
**V2 Status:** Not built yet — no calendar page exists in v2

---

## Executive Summary

Build the v2 calendar system following v1's proven patterns (modal-based interactions, week view as default widget, month modal for full view, section-card form for event creation) while incorporating v2's expanded spec (approval workflow, member color coding, family filtering, image OCR intake, task due date integration). The calendar should feel like v1 — warm, modal-based, guided — but use v2's CSS variable architecture and data model.

---

## What V1 Had (and V2 Should Keep)

### V1 Patterns to Preserve

1. **Week view as dashboard widget** — compact 7-column grid showing day names, dates, and event indicators. This is the primary calendar surface users see every day. It lives on the Personal Dashboard as a widget section.

2. **"View Month" button opens a full modal** — not a page navigation. The month view is an overlay that doesn't lose your place on the dashboard. Uses ReactDOM.createPortal to render above everything.

3. **Click any date → DateDetailModal** — a modal showing all events/tasks/reminders for that day, grouped by type (Tasks, Events, Deadlines, Reminders). Includes navigation arrows to move day-by-day within the modal. Has an "Add Event" button at the bottom.

4. **Event creation via modal** — EventCreationModal with gradient header, section cards for Date & Time / Location / Description / Recurrence / Family Members. Radio buttons with descriptions for recurrence. Checkbox rows for family member selection.

5. **Date picker dropdowns** — Month/Day/Year select dropdowns for quick date jumping (not a calendar picker widget — simple select elements).

6. **Week navigation** — Prev/Next arrows with date range label ("Mar 10 – Mar 16").

7. **Shell-specific calendar variants** — GuidedMode, PlayMode, IndependentMode, and PersonalCalendar all share the same underlying data but render differently per shell.

### V1 Things to Improve

1. **Hardcoded colors** — v1 had `#68a395`, `#d4e3d9`, etc. scattered through CSS. V2 must use only CSS variables.

2. **No approval workflow** — v1 had no pending/approved states. V2 adds kid event approval.

3. **No family overlay** — v1 showed only your events. V2 adds color-coded multi-member overlay.

4. **No image intake** — v1 had no camera/OCR. V2 adds photograph-a-flyer event creation.

5. **No task integration** — v1 tasks and calendar were separate. V2 surfaces task due dates on the calendar.

---

## Database Schema

### Use v1's schema as foundation, extended with v2 fields

The v1 migration (`022_calendar_events_system.sql`) provides a solid foundation. Extend it with PRD-14B additions:

```sql
-- calendar_events table (v1 base + v2 extensions)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic event information (v1)
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  
  -- Timing (v1)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  
  -- Event classification (v1 + v2 extensions)
  event_type VARCHAR(20) NOT NULL DEFAULT 'event' 
    CHECK (event_type IN ('task', 'event', 'deadline', 'reminder', 'appointment', 'activity')),
  category_id UUID REFERENCES event_categories(id),  -- v2: FK to categories table
  priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
  
  -- Visual
  color VARCHAR(7),  -- Hex, inherits from member color if NULL
  icon_override VARCHAR(50),  -- v2: Lucide icon name override
  
  -- Source tracking (v1 base + v2 extensions)
  source_type VARCHAR(30) DEFAULT 'manual' 
    CHECK (source_type IN ('manual', 'review_route', 'image_ocr', 'lila_guided', 'task_auto', 'google_sync')),
  source_reference_id UUID,  -- v2: links to source record
  source_image_url TEXT,     -- v2: for OCR source images
  external_id VARCHAR(255),
  
  -- Recurrence pattern (v1)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type VARCHAR(20) 
    CHECK (recurrence_type IN ('none', 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'yearly', 'custom')),
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date TIMESTAMPTZ,
  recurrence_days JSONB,     -- [0,1,2,3,4,5,6] where 0=Sunday
  recurrence_count INTEGER,
  recurrence_details JSONB,  -- v2: exceptions, custom rules
  
  -- v2: Approval workflow
  status VARCHAR(20) DEFAULT 'approved'
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled')),
  rejection_note TEXT,
  approved_by UUID REFERENCES family_members(id),
  approved_at TIMESTAMPTZ,
  
  -- v2: Transportation & logistics
  transportation_needed BOOLEAN DEFAULT false,
  transportation_details TEXT,
  items_to_bring TEXT[],
  leave_by_time TIMESTAMPTZ,  -- auto-calculated from start_time - drive time
  
  -- v2: Reminders
  reminder_minutes INTEGER[],  -- e.g., [15, 60] = 15min and 1hr before
  
  -- Ownership (v1)
  created_by UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Metadata (v1)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (end_time >= start_time)
);

-- Event attendees (v1 base + v2 role field)
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  can_view BOOLEAN DEFAULT true,
  attendee_role VARCHAR(20) DEFAULT 'attending'
    CHECK (attendee_role IN ('attending', 'driving', 'requested_presence')),
  response VARCHAR(20) DEFAULT 'pending'
    CHECK (response IN ('pending', 'accepted', 'declined')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, family_member_id)
);

-- v2: Event categories (family-scoped)
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT 'calendar',  -- Lucide icon name
  color VARCHAR(7),
  is_system BOOLEAN DEFAULT false,  -- system defaults can't be deleted
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- v2: Calendar settings (per family)
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  default_drive_time_minutes INTEGER DEFAULT 15,
  auto_approve_members UUID[],  -- members who don't need approval
  week_start_day INTEGER DEFAULT 0,  -- 0=Sunday
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id)
);
```

### Member Color (add to family_members if not already present)
```sql
ALTER TABLE family_members 
  ADD COLUMN IF NOT EXISTS calendar_color VARCHAR(7);
-- Default palette assignment handled by application code
```

### Indexes (keep v1's, add v2's)
```sql
-- v1 indexes (keep all)
CREATE INDEX IF NOT EXISTS idx_cal_events_family ON calendar_events(family_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_creator ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_cal_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_cal_events_recurring ON calendar_events(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_cal_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cal_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_cal_attendees_member ON event_attendees(family_member_id);

-- v2 additions
CREATE INDEX IF NOT EXISTS idx_cal_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_cal_events_source ON calendar_events(source_type);
```

### RLS Policies
Use v1's RLS policies as the base (they're well-structured). Extend the SELECT policy to include status-based filtering:
- Pending events visible to: the creator + primary_parent + additional_adults with calendar permission
- Rejected events visible only to: the creator + primary_parent
- All other policies from v1 remain as-is

---

## Component Architecture

### Page: `/calendar` — Full Calendar Page

**Layout:** Main content area, uses `density-compact` class.

**Toolbar:**
- Title: "Calendar" in heading font
- [+ Add Event] button (primary, gradient when ON)
- Date navigation: ‹ Prev | Date Range | Next ›
- View toggle: Day | Week | Month (segmented control, compact)
- Filter: Me | Family | Pick Members (segmented control)
- Color mode: Dots | Stripe (small toggle)
- Member filter row (visible only in "Pick Members" mode): horizontal scroll of member avatars with checkboxes, colored borders

**Calendar Grid:**
- Renders based on active view (day/week/month)
- Events render with member color coding (dot or left-border stripe)
- Task due dates render distinctly (checkbox icon, muted style)
- Pending events render faded with dotted border + "pending" badge
- Click any event → Event Detail flyout/modal
- Click any empty slot → Quick Add pre-populated with date
- Click any task due date → Task detail flyout

### Widget: Calendar Dashboard Widget

**Purpose:** Compact week view for the Personal Dashboard (PRD-14).

**Follow v1's PersonalCalendar pattern:**
- Week grid: 7 columns, day name + date number + event indicators
- Header: "This Week" title + prev/next arrows + date range label + "View Month" button
- Click any day → DateDetailModal (modal, not navigation)
- "View Month" → Full month calendar in a modal overlay
- Jump-to-date: Calendar icon button opens month/day/year select dropdowns (v1's pattern)
- Today highlighted with `var(--color-btn-primary-bg)` background on the day header

### Modal: DateDetailModal

**Follow v1's pattern exactly, but with v2 tokens and v2 data:**

- Full-screen-ish modal (portal-rendered)
- Header: Formatted date ("Wednesday, March 12, 2026") + prev/next day arrows + date picker
- Body: Events grouped by type:
  - Tasks (from tasks table, `due_date` matches selected date)
  - Events (from calendar_events)
  - Deadlines (event_type = 'deadline')
  - Reminders (event_type = 'reminder')
- Each event card shows: time (or "All Day"), title, description, priority badge, category tag, edit/delete actions
- Empty state: clock icon + "No events scheduled" + "This day is free. Add an event to get started."
- Footer: [+ Add Event] button → opens EventCreationModal pre-populated with the selected date
- **v2 addition:** Pending events shown with faded styling + approve/reject buttons (mom only)

### Modal: EventCreationModal

**Follow v1's section-card form pattern, extended with v2 fields:**

**Modal container:** Same as Task Creation Modal — centered on desktop, bottom-sheet on mobile, gradient header, portal-rendered.

**Header:** Gradient bar, "Create Event" title with Calendar icon, close button.

**Sections (stacked section cards):**

1. **Event Title** — full-width input, required, placeholder "Enter event name"

2. **Date & Time** (section card with Clock icon heading)
   - "All day event" checkbox
   - Start date + start time (2-column when time is visible)
   - End date + end time
   - Helper: end date defaults to start date

3. **Location** (simple input, not a section card — just a labeled field)
   - Lucide MapPin icon + "Location (optional)"

4. **Description** (textarea, optional)

5. **Recurrence** (section card with Repeat icon heading)
   - Radio buttons with descriptions (v1 pattern):
     - One-time — Single event on this date only
     - Daily — Repeats every day
     - Weekly — Repeats every week on this day
     - Monthly — Repeats every month on this date
     - Yearly — Repeats annually on this date
     - Custom — Define your own schedule
   - Custom expanded: interval input + frequency dropdown + day-of-week buttons + end condition (never/after N/on date)

6. **Who's Involved?** (section card with Users icon heading)
   - "Select All / Deselect All" toggle button
   - Checkbox rows with member name and role (same pattern as Task creation)
   - **v2 addition:** Attendee role selector per member (attending / driving / requested presence)

7. **v2: Transportation & Logistics** (section card, optional — collapsed by default)
   - "Transportation needed" checkbox
   - Transportation details textarea
   - "Items to bring" — comma-separated or tag input
   - Leave-by time: auto-calculated from start_time minus `calendar_settings.default_drive_time_minutes`, inline editable

8. **v2: Category** (dropdown, optional)
   - System categories + family custom categories
   - "Add new category" option at bottom

9. **v2: Reminders** (optional)
   - Multi-select chips: 15 min, 30 min, 1 hour, 2 hours, 1 day before

**Footer:** Cancel + Create Event buttons (same styling as Task modal footer)

---

## Approval Workflow

### Auto-Approve Logic
Events created by `primary_parent` role → `status = 'approved'` automatically.
Events created by members in `calendar_settings.auto_approve_members` → `status = 'approved'`.
All other events → `status = 'pending_approval'`.

### Pending Event Rendering
- Calendar grid: faded/gray, dotted border, small "pending" badge
- DateDetailModal: shown in a "Pending" group with approve/reject buttons
- Universal Queue Modal: Calendar tab shows pending events for mom to process

### Approval Actions (mom only)
- **Approve:** `status → 'approved'`, `approved_by` set, `approved_at` set, event gains full color
- **Reject:** `status → 'rejected'`, `rejection_note` set, notification sent to creator
- **Edit & Approve:** mom can modify event details before approving

### Guided Mode: LiLa-Assisted Event Creation
For Guided shell members, instead of the full EventCreationModal, LiLa walks them through:
1. "What's happening?" → title
2. "When is it?" → date and time
3. "Where is it?" → location
4. "Do you need a ride?" → transportation
5. "What do you need to bring?" → items
6. "Who else is coming?" → attendees

LiLa compiles answers into a structured event, shows a preview card, and submits for approval.

---

## Task Due Date Integration

Tasks from the `tasks` table with `due_date IS NOT NULL` appear on the calendar:
- Rendered with a checkbox icon (Lucide `CheckSquare`) instead of a dot
- Slightly muted compared to calendar events
- Member color applied same as events
- Clicking opens a task detail flyout (not the full task modal) with:
  - Task title, description, assignees
  - Due date (inline editable by mom)
  - Status (completable inline)
  - "Open full task" link → navigates to Tasks page

This is a **read from the tasks table**, not a duplication into calendar_events.

---

## Member Color System

- Each family member has a `calendar_color` (or `assigned_color`) from the 44-color palette
- System auto-assigns visually distinct colors on member creation
- Mom can change any member's color in Family Settings
- Color appears as:
  - **Dots mode:** Small colored circle before the event text
  - **Stripe mode:** 3px left border on the event card in the member's color
- Multi-attendee events show stacked dots or gradient stripe
- Color mode preference stored in `dashboard_configs.preferences.calendar_color_mode`

---

## Shell-Specific Behavior

| Shell | Calendar Access | Creation | Approval | View |
|---|---|---|---|---|
| Mom | Full page + widget | Direct (auto-approved) | Approves others' events | All family or filtered |
| Dad/Adult | Full page + widget | Direct (auto-approved if in auto_approve list) | No approval power | Own + permitted family |
| Independent (teen) | Full page + widget | Creates pending events | N/A | Own events + approved family |
| Guided | Widget only | LiLa-guided creation | N/A | Own events (simplified) |
| Play | Widget only (visual, large) | No direct creation | N/A | Own events (icon-rich, large text) |

---

## Eventing Service

Port v1's `EventsService` class to v2 patterns. Key methods:

```typescript
// Core CRUD
createEvent(input: CreateEventInput, createdBy: string, familyId: string): Promise<CalendarEvent>
updateEvent(eventId: string, updates: Partial<CreateEventInput>): Promise<CalendarEvent>
deleteEvent(eventId: string): Promise<void>

// Queries
getEventsForRange(memberId: string, start: Date, end: Date): Promise<CalendarEvent[]>
getEventsForDate(memberId: string, date: Date): Promise<CalendarEvent[]>
getFamilyEventsForRange(familyId: string, start: Date, end: Date, memberIds?: string[]): Promise<CalendarEvent[]>
getPendingEvents(familyId: string): Promise<CalendarEvent[]>

// Approval
approveEvent(eventId: string, approvedBy: string): Promise<void>
rejectEvent(eventId: string, rejectedBy: string, note?: string): Promise<void>

// Attendees
addAttendees(eventId: string, attendees: AttendeeInput[]): Promise<void>
removeAttendee(eventId: string, memberId: string): Promise<void>
updateAttendeeResponse(eventId: string, memberId: string, response: string): Promise<void>

// Categories
getCategories(familyId: string): Promise<EventCategory[]>
createCategory(familyId: string, input: CategoryInput): Promise<EventCategory>

// Task due dates (read from tasks table)
getTasksDueInRange(memberId: string, start: Date, end: Date): Promise<TaskDueDate[]>
```

---

## Modal Consistency Note

The EventCreationModal and DateDetailModal should follow the same modal patterns as the redesigned Task Creation Modal:

- **Gradient header** with heading font and white text
- **Section cards** for grouped form fields
- **Radio buttons with descriptions** for exclusive choices (recurrence)
- **Checkbox rows** for family member selection
- **Portal rendering** (`ReactDOM.createPortal` or `createPortal`)
- **Backdrop click to close**, Escape key to close
- **Theme-adaptive** — all CSS variables, zero hardcoded colors
- **Responsive** — centered on desktop, bottom-sheet on mobile

This creates visual consistency: task creation, event creation, and date detail all feel like they belong to the same app.

---

## Implementation Order

1. **Database migration** — create/extend tables (calendar_events, event_attendees, event_categories, calendar_settings)
2. **EventsService** — port v1 service with v2 extensions
3. **Types** — port v1 event types with v2 additions (status, transportation, categories)
4. **Calendar Dashboard Widget** — week view for Personal Dashboard (highest visibility)
5. **DateDetailModal** — click-a-day modal with grouped events
6. **EventCreationModal** — section-card form with gradient header
7. **Full Calendar Page** — `/calendar` route with toolbar, grid, filtering
8. **Approval workflow** — pending states, approve/reject actions, queue integration
9. **Task due date integration** — read from tasks table, render on calendar
10. **Member color system** — dots/stripe rendering, color picker integration
11. **Shell variants** — Guided (LiLa-assisted), Play (large/visual), Independent (pending events)

---

## Verification Checklist

- [ ] Week view widget renders on Personal Dashboard with 7-day grid
- [ ] Click any day opens DateDetailModal with events grouped by type
- [ ] "View Month" opens full month in a modal overlay (not page navigation)
- [ ] Day navigation arrows work within DateDetailModal
- [ ] EventCreationModal has gradient header and section-card form layout
- [ ] Recurrence uses radio buttons with descriptions
- [ ] Family member selection uses checkbox rows
- [ ] Events created by mom are auto-approved
- [ ] Events created by kids show as "pending" (faded/dotted)
- [ ] Mom can approve/reject pending events from DateDetailModal or Queue
- [ ] Task due dates appear on calendar with distinct checkbox icon styling
- [ ] Member colors applied as dots or stripes based on preference
- [ ] All modals use ReactDOM.createPortal (render above everything)
- [ ] All colors use CSS variables (zero hardcoded hex)
- [ ] Calendar page accessible from sidebar navigation
- [ ] Guided shell: LiLa-assisted event creation instead of full modal
- [ ] Play shell: large visual calendar with bigger text and touch targets
