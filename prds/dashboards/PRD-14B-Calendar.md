> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-14B: Calendar

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-14 (Personal Dashboard)
**Created:** March 10, 2026
**Last Updated:** March 10, 2026

---

## Overview

PRD-14B defines the Calendar — everything behind the dashboard calendar display section (PRD-14) plus the full standalone Calendar page. This includes the `calendar_events` data model, event creation and editing, the MindSweep-to-calendar intake pipeline, family calendar views with member color coding, event approval queues, recurring events, attendee tagging with transportation logistics, and the Play mode icon calendar system.

The Calendar is both a personal planning tool and a family coordination surface. Every member has their own calendar. Mom has the unique ability to see everyone's calendar overlaid, filter by any combination of family members, and approve or reject events submitted by kids. The system also surfaces task due dates from PRD-09A on the calendar, giving mom a unified view of everything happening across the family.

A core design principle of the Calendar is **"Help Mom Help You"** — when kids or family members create events, the system guides them through thinking about logistics (when, where, who's driving, what to bring) so mom receives complete information in her approval queue instead of half-formed requests that require five follow-up questions. This teaches executive function skills while reducing mom's mental load.

> **Mom experience goal:** When mom opens her calendar, she should be able to see her entire family's schedule at a glance — events, task deadlines, who needs rides where, what's pending her approval — without having to check nine separate places. One view, nothing falls through the cracks. And when a kid adds an event, mom gets everything she needs to make a decision without asking "when?", "where?", "do you need a ride?", "what do you need?"

> **Depends on:** PRD-14 (Personal Dashboard) defines the dashboard calendar display section — this PRD provides the data and full calendar experience behind it. PRD-08 (Journal + Smart Notepad) defines the Review & Route pipeline — Calendar is a routing destination. PRD-09A (Tasks) defines task due dates that surface on the calendar. PRD-02 (Permissions) defines the access model that governs who sees whose events.

---

## Related PRDs in the PRD-14 Family

| PRD | Feature | Relationship |
|-----|---------|-------------|
| **PRD-14** | Personal Dashboard | Parent — defines the dashboard calendar display section that reads from PRD-14B data |
| **PRD-14B** (this document) | Calendar | Defines the data model, full Calendar page, event management, and intake flows |
| **PRD-14C** | Family Overview | Will consume calendar data for the aggregated family view |
| **PRD-14D** | Family Hub | Will include a family calendar surface using the same filter/color patterns |
| **PRD-14E** | Family Hub TV Mode | Will render calendar in ambient/TV display mode |

---

## User Stories

### Event Management
- As a mom, I want a full calendar page where I can see day, week, and month views so I can plan and manage my family's schedule.
- As a mom, I want to quickly add a personal event with just a title, date, and time so I don't have to fill out a full form for simple things.
- As any adult member, I want to create events on my own calendar without approval so I can manage my own schedule independently.
- As a mom, I want to edit any family member's event directly from my calendar so I can fix details without navigating elsewhere.

### Family Calendar Views
- As a mom, I want to overlay all family members' calendars in one view, color-coded by person, so I can see the full family picture at a glance.
- As a mom, I want to pick and choose which family members' calendars I see at any time so I can focus on specific kids when planning.
- As a mom, I want to choose between colored dots and colored border stripes for member color coding, because I want the view that works best for my family's size.
- As any member, I want my calendar color to come from my profile so it's consistent everywhere and I can change it if I want.

### Kid Event Creation & Approval
- As an independent teen, I want to add events to my calendar and have them "penciled in" (visible but pending) until mom approves so I can plan ahead while keeping mom informed.
- As a guided member, I want LiLa to help me add an event by asking me questions about what, when, where, and what I need, so I can give mom all the information she needs.
- As any kid, I want to tag who needs to be present at my event (especially if I need a ride) so mom sees my transportation needs automatically.
- As a mom, I want pending events to show up on the calendar in a faded/gray state so I can see what's been requested before I approve it.

### MindSweep Calendar Intake
- As any family member, I want to photograph a flyer or screenshot an event announcement and have the system extract the event details automatically so I don't have to type everything manually.
- As a mom, I want events extracted from images or text to land in my approval queue with all the parsed details so I can review and approve quickly.
- As a family member using Review & Route, I want "Calendar" as a routing destination so I can send date-related items from my notepad directly to the calendar.

### Task Due Dates
- As a mom, I want to see all family members' task due dates on the family calendar view so I have a unified picture of everything happening.
- As a mom, I want to inline edit task due dates directly from the calendar so I can reschedule without navigating to the Tasks page.
- As a member, I want to see my own task due dates on my personal calendar so I know what's coming up alongside my events.

### Logistics & Transportation
- As a mom, I want a default drive time setting so the system automatically calculates "leave by" times for events that need travel.
- As a mom, I want to inline edit the "leave by" time on any event because some trips take longer or shorter than the default.
- As a kid creating an event, I want to indicate whether I need a ride and have the system figure out the "leave by" time so mom has what she needs.

### Reminders
- As any member, I want to set a reminder before an event so I don't forget about it.
- As a mom, I want to see reminders for my kids' events (especially ones requiring transportation) so I can prepare in advance.

---

## Screens

### Screen 1: Full Calendar Page

> **Mom experience goal:** This is where mom goes when she needs the big picture — not just today, but the whole week or month, with full management power.

**What the user sees:**

A full-page calendar accessible from the sidebar navigation. The page has a toolbar header and the calendar grid below.

**Toolbar:**
```
┌─────────────────────────────────────────────────────┐
│  Calendar                              [+ Add Event] │
│  ─────────────────────────────────────────────────── │
│  [< Prev]  March 10–16, 2026  [Next >]              │
│  [Day] [Week•] [Month]                               │
│  ─────────────────────────────────────────────────── │
│  Filter: [👤 Me•] [👥 Family] [☑ Pick Members]      │
│  Color: [● Dots•] [▌Stripe]                         │
│  ─────────────────────────────────────────────────── │
│  Members: [Mom•] [Dad•] [Jake] [Emma•] [Ruthie] ... │
│  (visible only in "Pick Members" filter mode)        │
└─────────────────────────────────────────────────────┘
```

- **View toggle:** Day, Week (default), Month. Persists in user preferences.
- **Date navigation:** Left/right arrows for previous/next. Center label shows current range. Tapping center label opens the date picker dropdown (month dropdown + inline editable year text field, per PRD-14 decision #7). Date is also inline editable — tap the date text to type directly.
- **Filter modes:**
  - **Me** — personal events + my task due dates only
  - **Family** — all family members' events overlaid with color coding
  - **Pick Members** — reveals member avatar row; tap to toggle each member on/off. Multiple selections supported. Selected members' events overlay with their assigned colors.
- **Color mode toggle:** Dots or Stripe. Persists in `dashboard_configs.preferences.calendar_color_mode`.
- **[+ Add Event]** button → opens Quick Add form (default) or can switch to Detailed Add.

**Calendar Grid (Week View):**
```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ Sun  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │
│  9   │  10  │  11  │  12  │  13  │  14  │  15  │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│      │●9:00 │      │●●3pm │      │●10am │      │
│      │Dentist│     │Soccer│      │Piano │      │
│      │      │      │ prac │      │      │      │
│      │      │──────│──────│      │      │      │
│      │      │▪Math │▪Read │      │      │      │
│      │      │ due  │ due  │      │      │      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
● = calendar event (with member color dot or stripe)
▪ = task due date (checkbox icon, distinct visual, member color)
Gray/faded = pending approval event
```

- **Event rendering:** Each event shows: time, title, and member color indicator (dot or left-border stripe based on preference). Multi-attendee events show stacked dots or a gradient stripe.
- **Task due date rendering:** Visually distinct from events — checkbox icon prefix, slightly muted style. Member color applied same as events.
- **Pending events:** Render in faded gray with a dotted border and small "pending" badge. Visible to the requesting member and to mom.
- **Tap any event** → opens Event Detail flyout (Screen 3).
- **Tap any task due date** → opens Task Detail flyout with inline edit capability (Screen 4).
- **Tap any empty date slot** → opens Quick Add pre-populated with that date.

**Day View:** Full timeline layout (6am–10pm, scrollable). Events rendered as time blocks. Tasks shown in a "Due Today" section at the top.

**Month View:** Grid of dates with compact event indicators (dots only, no titles — too small). Tap any date → transitions to Day View for that date. Today highlighted. Days with events show colored dots stacked. Days with pending events show a gray dot.

**Data created/updated:** None on this screen (read-only display). Preferences stored in `dashboard_configs.preferences`.

---

### Screen 2: Event Creation — Quick Add & Detailed Add

> **Mom experience goal:** Adding an event should take 5 seconds for simple things and 30 seconds for complex logistics — never more.

**Quick Add (default for all adults):**

A compact form/modal that appears when tapping [+ Add Event] or an empty date slot.

```
┌─────────────────────────────────────┐
│  Quick Add Event                 ✕  │
│  ─────────────────────────────────  │
│  Title: [Basketball tryouts____]    │
│  Date:  [Mar 15, 2026] (editable)  │
│  Start: [3:00 PM]  End: [5:00 PM]  │
│  Category: [Sports ●] (icon picker)│
│                                     │
│  [+ More Details]  [Save Event]     │
└─────────────────────────────────────┘
```

- **Title:** Free text, required.
- **Date:** Pre-populated if tapped from a date slot. Inline editable.
- **Start / End time:** Time pickers. End time optional (defaults to 1 hour after start).
- **Category:** Dropdown with icon preview. Defaults to "Other."
- **[+ More Details]** → expands to Detailed Add fields (below).
- **[Save Event]** → creates the event. If created by mom for herself, status = `'approved'`. If created by a kid, status = `'pending_approval'` (unless bypass granted).

**Detailed Add (expanded or standalone for kid-created events):**

All fields below are **optional by default**. Mom can configure required fields in Calendar Settings (stored in `calendar_settings.required_intake_fields` JSONB array).

```
┌─────────────────────────────────────────┐
│  Add Event                           ✕  │
│  ─────────────────────────────────────  │
│  Title: [Basketball tryouts________]    │
│  Date:  [Mar 15, 2026]                  │
│  Start: [3:00 PM]  End: [5:00 PM]      │
│  Category: [Sports ●]                   │
│  ─────────────────────────────────────  │
│  📍 Location: [Greenfield Rec Center_]  │
│  ─────────────────────────────────────  │
│  👥 Who needs to be there?              │
│  [Mom ✓] [Jake ✓] [Emma] [Ruthie]      │
│  ─────────────────────────────────────  │
│  🚗 Need a ride?  [Yes•] [No]          │
│  Leave by: 1:55 PM (auto-calculated)    │
│  ✏️ (tap to edit leave time)            │
│  Who's driving? [Mom ▾]                 │
│  ─────────────────────────────────────  │
│  🎒 What to bring:                      │
│  [✓] Basketball shoes                   │
│  [✓] Water bottle                       │
│  [✓] Athletic clothes                   │
│  [+ Add item]  (LiLa auto-suggested)   │
│  ─────────────────────────────────────  │
│  📝 Notes for mom:                      │
│  [Coach said to arrive 15 min early_]   │
│  ─────────────────────────────────────  │
│  🔁 Repeats: [None ▾]                   │
│     Options: None, Daily, Weekdays,     │
│     Weekly, Biweekly, Monthly, Custom   │
│  ─────────────────────────────────────  │
│  🔔 Reminder: [15 min before ▾]         │
│     Options: None, 5/10/15/30/60 min,   │
│     1 hour, 2 hours, 1 day, custom      │
│  ─────────────────────────────────────  │
│  [Cancel]              [Save Event]     │
└─────────────────────────────────────────┘
```

- **Location:** Free text with recent locations autocomplete.
- **Attendees:** Tap family member avatars to tag. Multi-select.
- **Transportation:**
  - "Need a ride?" toggle. When Yes:
  - **Leave by time** auto-calculated: `event_start_time - default_drive_time` (from Calendar Settings). Inline editable — tap to change. Mom's default drive time is set in Calendar Settings (stored in `calendar_settings.default_drive_time_minutes`).
  - **Who's driving** dropdown: family members with driving capability (adults + permitted teens).
- **Items to bring:** Checklist. When event is created from an image (MindSweep), LiLa auto-suggests items based on event context (e.g., swim party → swimsuit, towel, sunscreen). Each item is inline editable. [+ Add item] to add manually.
- **Notes:** Free text field for anything else.
- **Recurrence:** Uses the same pattern as PRD-09A — `recurrence_rule` (none, daily, weekdays, weekly, biweekly, monthly, custom) + `recurrence_details` JSONB for complex patterns (specific days, end date, school-year-only, seasonal).
- **Reminder:** Dropdown for pre-event reminder timing. Stored on the event record.

**"Help Me Plan This" — LiLa Guided Intake (kid option):**

When a Guided or Independent member taps [+ Add Event], they see two options:
- **"Quick Add"** → the structured form above
- **"Help Me Plan This"** → launches LiLa in a guided conversation

LiLa guided intake flow:
1. "What's the event?" → kid describes in natural language or voice
2. "When is it?" → LiLa parses date/time from response
3. "Where is it?" → location
4. "Do you need a ride?" → if yes, LiLa notes it
5. "Who needs to be there?" → attendee tagging
6. "Anything you need to bring?" → LiLa may suggest based on event type
7. "Anything else mom should know?" → open field
8. LiLa compiles all answers into a structured event form for review → kid confirms → event created with `status = 'pending_approval'`

> **Decision rationale:** Both quick form and guided flow produce identical event data. The guided flow teaches kids executive function by walking them through logistical thinking. The quick form respects teens who already think that way and just want to enter the data fast. Let the kid choose.

> **Decision rationale:** The "items to bring" auto-suggestion from LiLa is a small AI touch that delights — mom doesn't have to think of everything, and kids get a helpful nudge. The list is always editable, never forced.

**Data created:**
- `calendar_events` record with all fields populated
- `event_attendees` records for each tagged member (with role: attending, driving, requested_presence)
- If `status = 'pending_approval'`, event appears in mom's Calendar Queue

---

### Screen 3: Event Detail Flyout

**What the user sees:**

When tapping an event on the calendar grid, a flyout/modal opens showing full event details.

```
┌─────────────────────────────────────────┐
│  Basketball Tryouts              [Edit] │
│  ─────────────────────────────────────  │
│  📅 Saturday, March 15, 2026           │
│  🕒 3:00 PM – 5:00 PM                  │
│  📍 Greenfield Rec Center              │
│  🏀 Sports                              │
│  ─────────────────────────────────────  │
│  👥 Attendees:                          │
│  ● Jake (attending)                     │
│  ● Mom (driving)                        │
│  ─────────────────────────────────────  │
│  🚗 Leave by: 1:55 PM                  │
│  ─────────────────────────────────────  │
│  🎒 Bring:                              │
│  ☑ Basketball shoes                     │
│  ☑ Water bottle                         │
│  ☑ Athletic clothes                     │
│  ─────────────────────────────────────  │
│  📝 Coach said to arrive 15 min early   │
│  ─────────────────────────────────────  │
│  🔁 Does not repeat                     │
│  🔔 Reminder: 1 hour before             │
│  ─────────────────────────────────────  │
│  Created by: Jake  •  Pending Approval  │
│  ─────────────────────────────────────  │
│  [Approve] [Reject] [Edit] [Delete]    │
│  (Approve/Reject shown only for        │
│   pending events when mom is viewing)   │
└─────────────────────────────────────────┘
```

- **[Edit]** → opens the Detailed Add form pre-populated with this event's data. Permission-scoped: mom can edit any event; members can edit their own events only.
- **[Approve] / [Reject]** → shown only to mom for `pending_approval` events. Approve transitions to `approved` (full color on calendar). Reject transitions to `rejected` (removed from calendar; notification sent to creator with optional rejection note).
- **[Delete]** → soft-delete with confirmation. Mom can delete any event. Members can delete their own events.
- **Items to bring checklist** is interactive — members can check items off as they pack.

**Data updated:**
- `calendar_events.status` on approve/reject
- `event_attendees` items_checked state (local/optimistic for packing checklist)

---

### Screen 4: Task Due Date Flyout (Calendar-Hosted)

**What the user sees:**

When tapping a task due date on the calendar, a task detail flyout opens. This is a calendar-hosted view of the task, not a navigation away from the calendar.

```
┌─────────────────────────────────────────┐
│  📋 Math Assignment — Chapter 12   [→]  │
│  ─────────────────────────────────────  │
│  Due: Tuesday, March 11, 2026          │
│  Assigned to: Jake                      │
│  Status: Pending                        │
│  Category: Learning                     │
│  ─────────────────────────────────────  │
│  [Change Due Date]  [Mark Complete]     │
│  [Delete Task]  [View Full Task →]      │
└─────────────────────────────────────────┘
```

- **[→] and [View Full Task]** → navigates to the task detail on the Tasks page.
- **[Change Due Date]** → inline date picker. **Permission-scoped:**
  - Mom: can change due date on any task
  - Member: can change due date only on tasks they created themselves (self-assigned tasks with self-set due dates). Cannot change due dates on tasks assigned by mom.
- **[Mark Complete]** → marks the task as completed (same as completing from the Tasks page).
- **[Delete Task]** → permission-scoped same as due date editing.

**Data updated:**
- `tasks.due_date` on date change
- `tasks.status` on completion
- Updates flow through to the Tasks system (PRD-09A) — the calendar is just an alternate interface for the same data.

---

### Screen 5: Calendar Event Queue (Universal Queue Modal — Calendar Tab)

> **Mom experience goal:** Process all pending items in one sitting, one place. Don't make me hunt through three different screens.

**What the user sees:**

A modal that can be launched from multiple entry points:
- Calendar page queue badge: "3 pending" indicator in the toolbar
- Dashboard pending items badge count
- QuickTasks strip "Review Queue" button
- Any future feature's queue entry point

The modal has tabs across the top — one for each feature that has a queue. PRD-14B defines the Calendar tab and the modal container. PRD-09A's task queue migrates into this same modal at audit/build time.

```
┌─────────────────────────────────────────────────┐
│  Review Queue                                ✕  │
│  [Calendar (3)] [Tasks (5)] [Requests (2)]      │
│  ─────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────┐  │
│  │ 🏀 Basketball Tryouts                     │  │
│  │ Mar 15, 3:00 PM • Greenfield Rec Center  │  │
│  │ Submitted by: Jake  •  Needs ride (Mom)   │  │
│  │ [Approve] [Edit & Approve] [Reject ▾]    │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 🎵 Spring Concert                         │  │
│  │ Apr 2, 7:00 PM • Lincoln High Auditorium │  │
│  │ Submitted by: Emma  •  From: flyer image  │  │
│  │ [Approve] [Edit & Approve] [Reject ▾]    │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 📚 Book Club Meeting                      │  │
│  │ Mar 20, 4:00 PM • Library                 │  │
│  │ Submitted by: Ruthie  •  No ride needed   │  │
│  │ [Approve] [Edit & Approve] [Reject ▾]    │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [Approve All]                                   │
└─────────────────────────────────────────────────┘
```

**Universal Queue Modal — Component Contract:**
- **Container:** Tabbed modal with a tab for each registered queue feature
- **Tab registration:** Each feature that has a queue registers a tab with: label, badge count query, and queue content component
- **Launch behavior:** Opens to the tab matching the launch context (Calendar badge → Calendar tab, Tasks badge → Tasks tab, QuickTasks → tab with most pending items)
- **Persistence:** Modal stays open as user switches between tabs. Processes items across features in one session.

**Calendar Queue Tab:**
- Shows all `calendar_events` where `status = 'pending_approval'` and the current user is mom/primary parent
- Each card shows: event title, date/time, location, who submitted it, transportation needs, source indicator (manual, flyer image, Review & Route)
- **[Approve]** → changes status to `approved`, event renders at full color on all relevant calendars
- **[Edit & Approve]** → opens the event in Detailed Add form, mom edits, then saves as approved
- **[Reject ▾]** → dropdown with optional rejection note. Status changes to `rejected`. Creator receives notification.
- **[Approve All]** → bulk approve all pending calendar events

**Data updated:**
- `calendar_events.status` for each processed event
- `calendar_events.approved_by` and `calendar_events.approved_at` on approval
- Notification records created for rejection (wired by PRD-15 Messages, Requests & Notifications)

> **Forward note:** The Universal Queue Modal is defined here as a reusable component. During the audit/build phase, PRD-09A's Task Creation Queue should be adapted to render as a tab in this same modal. Future features with queues add tabs. The QuickTasks strip gets a "Review Queue" entry point showing total pending count across all registered tabs. PRD-15 (Messages, Requests & Notifications) will define the Requests tab where any family member can send requests to any other member (kid-to-parent, parent-to-parent, parent-to-teen), the message inbox wiring PRD-08's "Send to Person" stub, and the notification delivery system that calendar reminders and approval outcomes depend on.

---

### Screen 6: MindSweep Calendar Intake (Image-to-Event)

> **Mom experience goal:** My kid photographs a flyer at school, and 30 seconds later the event is in my approval queue with all the details parsed. I just tap approve.

**What the user sees:**

Multiple entry points lead to the same intake flow:

1. **Camera/photo capture** on the Calendar page: a camera icon next to [+ Add Event]
2. **"Send to → Calendar"** from Smart Notepad (PRD-08) when content contains date/event information
3. **Review & Route** extraction (PRD-08 Screen 3) where an item is routed to Calendar
4. **Image attachment** during Quick Add or Detailed Add — user attaches a photo and LiLa extracts details

**Image-to-Event Flow:**
```
┌─────────────────────────────────────────────┐
│  📷 Event from Image                    ✕   │
│  ─────────────────────────────────────────  │
│  [Image preview of flyer/screenshot]        │
│  ─────────────────────────────────────────  │
│  LiLa extracted:                            │
│                                             │
│  Title: [Spring Concert____________]  ✏️    │
│  Date:  [April 2, 2026_____________]  ✏️    │
│  Time:  [7:00 PM – 9:00 PM_________]  ✏️    │
│  Location: [Lincoln High Auditorium_]  ✏️   │
│  Category: [Music & Arts 🎵_________]  ✏️   │
│                                             │
│  🎒 Don't forget to bring:                  │
│  [✓] Formal attire (LiLa suggested)   ✏️   │
│  [✓] Instrument (LiLa suggested)      ✏️   │
│  [+ Add item]                               │
│                                             │
│  Confidence: 94%                            │
│  ─────────────────────────────────────────  │
│  [Edit Details]  [Create Event]             │
│  (Creates as pending_approval if kid)       │
└─────────────────────────────────────────────┘
```

- **LiLa extraction:** Image sent to a vision model via OpenRouter Edge Function. Model returns structured event data: title, date, time, location, category guess, and suggested items to bring.
- **All extracted fields are inline editable** (✏️) — human-in-the-mix always.
- **"Don't forget to bring"** auto-suggested based on event context. Each suggestion is editable and removable. Kid (or mom) can add more items.
- **Confidence score** shown to indicate extraction quality.
- **[Edit Details]** → opens full Detailed Add form pre-populated with extracted data.
- **[Create Event]** → creates event. If kid → `pending_approval`. If mom → `approved`.

**Text-to-Event Flow (from Review & Route):**
When Review & Route (PRD-08 Screen 3) extracts a calendar item, the user taps "Calendar" as the routing destination. The extracted text (e.g., "Practice starts March 15th") is sent to the LiLa event parsing Edge Function which returns structured date/time/title/location data. The same extraction preview form (above) appears, minus the image preview.

> **Decision rationale:** Image-to-event OCR is included at MVP because it's the core of the MindSweep calendar vision — kids photographing flyers and school announcements is the primary real-world intake path. The underlying vision model capability via OpenRouter also serves PRD-09A's deferred OCR for sequential collections.

> **Tier rationale:** Image-to-event intake is a Full Magic tier feature (when tier gating is activated). Text-based event creation is available at all tiers.

---

### Screen 7: Calendar Settings

**What the user sees:**

Accessible from the Calendar page toolbar (gear icon) or from the main Settings area.

```
┌─────────────────────────────────────────┐
│  Calendar Settings                   ✕  │
│  ─────────────────────────────────────  │
│  Display                                │
│  Week starts on: [Sunday ▾]            │
│  Default view: [Week ▾]                │
│  Color mode: [● Dots] [▌Stripe]       │
│  ─────────────────────────────────────  │
│  Transportation                         │
│  Default drive time: [65] minutes       │
│  (Auto-calculates "leave by" times)    │
│  ─────────────────────────────────────  │
│  Event Creation (Mom Only)              │
│  Required fields for kid events:        │
│  [ ] Location                           │
│  [ ] Transportation info                │
│  [ ] Items to bring                     │
│  ─────────────────────────────────────  │
│  Approval Settings (Mom Only)           │
│  Auto-approve events from:              │
│  [ ] Dad / Additional Adults            │
│  [ ] Jake (Independent)                 │
│  [ ] Emma (Independent)                 │
│  (Unchecked = requires approval)        │
│  ─────────────────────────────────────  │
│  [Save]                                 │
└─────────────────────────────────────────┘
```

- **Display settings:** week start day, default view, color mode. Stored in `dashboard_configs.preferences`.
- **Default drive time:** Mom sets once (e.g., 65 minutes). Applied automatically to all events with transportation. Inline editable per-event. Stored in `calendar_settings.default_drive_time_minutes`.
- **Required intake fields:** Mom selects which detail fields are mandatory when kids create events. Default: all optional. Stored in `calendar_settings.required_intake_fields` JSONB array.
- **Approval bypass:** Per-member toggle. When checked, that member's events skip the approval queue and go directly to `approved` status. Default: all unchecked (everyone needs approval). Stored in `calendar_settings.auto_approve_members` UUID array.

**Data created/updated:**
- `calendar_settings` record for the family
- `dashboard_configs.preferences` for display settings

---

## Visibility & Permissions

| Role | Calendar Access | Event Creation | Event Editing | Queue Access | Approval Power |
|------|----------------|----------------|---------------|-------------|----------------|
| Mom / Primary Parent | Full — personal view, family view, pick-and-choose filter, all member calendars visible | Full CRUD for self and any family member. Events auto-approved. | Can edit ANY event (own or any member's). Can inline edit task due dates for any task. | Full access to Calendar Queue tab in Universal Queue Modal | Can approve/reject all pending events |
| Dad / Additional Adult | Personal view. Family view IF mom grants calendar access for kids (per PRD-02 per-kid feature permissions). | Can create events for self (auto-approved) and for permitted kids (goes to mom's queue unless bypass granted). | Can edit own events. Can edit kids' events if permission level = contribute or manage. | No queue access (mom only) | No approval power |
| Special Adult | View assigned kids' calendar events during active shift only. Personal events on own calendar. | Can create events for self only. Cannot create events for assigned kids. | Can edit own events only. | No queue access | No approval power |
| Independent (Teen) | Personal view only. Cannot see other family members' calendars. | Can create events for self. Events default to `pending_approval` ("penciled in"). Mom can grant auto-approve bypass in Calendar Settings. | Can edit own events they created. Cannot edit events created by mom for them. Can change due dates on tasks they created themselves only. | No queue access | No approval power |
| Guided | Personal view only (simplified display with icons). | Can create events via LiLa guided flow or Quick Add. Events always `pending_approval`. | Cannot edit events. | No queue access | No approval power |
| Play | Icon calendar on dashboard only (PRD-26). No standalone Calendar page. | Cannot create events. Mom creates for them. | Cannot edit events. | No queue access | No approval power |

### Shell Behavior

| Shell | Calendar Page | Dashboard Section | Creation Paths |
|-------|--------------|-------------------|----------------|
| Mom | Full page with all views, family filter, queue | Full section (per PRD-14) with self/family toggle | Quick Add, Detailed Add, Image intake, Review & Route |
| Dad / Additional Adult | Full page with personal + permitted kid views | Full section (per PRD-14) — personal view only (no family toggle) | Quick Add, Detailed Add, Image intake |
| Independent (Teen) | Full page with personal view | Full section — personal view only | Quick Add, Detailed Add, "Help Me Plan This" guided, Image intake |
| Guided | Simplified calendar page — icon-enhanced, fewer controls | Simplified section with icons | "Help Me Plan This" guided flow primarily, Quick Add available |
| Play | No calendar page (dashboard only) | Icon calendar in PRD-26 dashboard | Not applicable |

### Privacy & Transparency
- Teens can see their own events (including pending status) and know that mom can see them.
- Teens cannot see other family members' events.
- The "penciled in" (pending) visual treatment is transparent — everyone sees that it's awaiting approval, no hidden states.
- Mom's personal events are private to her unless she explicitly invites family members as attendees.
- Dad cannot see kid events unless mom has granted calendar access for that kid (per PRD-02).

---

## Data Schema

### Table: `calendar_events`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members (who created this event) |
| title | TEXT | | NOT NULL | |
| description | TEXT | | NULL | |
| event_date | DATE | | NOT NULL | |
| start_time | TIME | | NULL | NULL = all-day event |
| end_time | TIME | | NULL | |
| is_all_day | BOOLEAN | false | NOT NULL | |
| location | TEXT | | NULL | |
| category | TEXT | 'other' | NOT NULL | Enum: 'learning', 'sports', 'medical', 'family', 'social', 'faith', 'music_arts', 'travel', 'celebration', 'work', 'other', or custom |
| icon_override | TEXT | | NULL | Lucide icon name. If set, overrides category default icon. |
| status | TEXT | 'approved' | NOT NULL | Enum: 'draft', 'pending_approval', 'approved', 'rejected', 'cancelled' |
| approved_by | UUID | | NULL | FK → family_members. Set on approval. |
| approved_at | TIMESTAMPTZ | | NULL | |
| rejection_note | TEXT | | NULL | Mom's optional note when rejecting |
| recurrence_rule | TEXT | | NULL | Enum: 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom'. NULL = no recurrence. |
| recurrence_details | JSONB | | NULL | Complex patterns: {days: ['mon','wed'], end_date: '2026-12-31', school_year_only: true, exceptions: ['2026-03-20']} |
| recurrence_parent_id | UUID | | NULL | FK → calendar_events. For generated recurring instances pointing to parent. |
| leave_by_time | TIME | | NULL | Auto-calculated from start_time - drive_time. Inline editable. |
| transportation_needed | BOOLEAN | false | NOT NULL | |
| transportation_notes | TEXT | | NULL | e.g., "Mom driving" or "Carpool with Smith family" |
| items_to_bring | JSONB | '[]' | NOT NULL | Array of {text: string, checked: boolean, ai_suggested: boolean} |
| notes | TEXT | | NULL | Free text notes |
| reminder_minutes | INTEGER | | NULL | Minutes before event to remind. NULL = no reminder. |
| source_type | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'review_route', 'image_ocr', 'lila_guided', 'task_auto' |
| source_reference_id | UUID | | NULL | FK to source record (notepad tab, lila conversation, etc.) |
| source_image_url | TEXT | | NULL | Supabase Storage URL for the source flyer/screenshot image |
| external_id | TEXT | | NULL | For future external calendar sync (Google Calendar event ID) |
| external_source | TEXT | | NULL | Enum: 'google', 'apple', 'manual'. Default NULL = internal. |
| last_synced_at | TIMESTAMPTZ | | NULL | For future external sync |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Whether LiLa can reference this event in context |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Members can read events where: `created_by = auth.uid()` OR they are in the `event_attendees` table for this event OR (they are primary_parent and event belongs to any family member in their family).
- Members can insert events where: `created_by = auth.uid()` AND `family_id` matches their family.
- Members can update events where: `created_by = auth.uid()` OR (they are primary_parent and event belongs to their family).
- Members can delete (soft) events where: `created_by = auth.uid()` OR they are primary_parent.
- Dad/Additional Adult can read kid events where: `member_permissions` grants view or higher for that kid's calendar feature key.
- Special Adults can read assigned kids' events during active shift only (join on `shift_sessions` + `special_adult_assignments`).

**Indexes:**
- `(family_id, event_date)` — family-scoped date queries
- `(created_by, event_date)` — personal calendar queries
- `(family_id, status)` — queue queries (pending_approval events)
- `(recurrence_parent_id)` — recurring event instance lookups
- `(external_id, external_source)` — future sync lookups

---

### Table: `event_attendees`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| event_id | UUID | | NOT NULL | FK → calendar_events |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| role | TEXT | 'attending' | NOT NULL | Enum: 'attending', 'driving', 'requested_presence' |
| response_status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'accepted', 'declined' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- Same scoping as parent `calendar_events` — if you can read the event, you can read its attendees.
- Members can insert attendees on events they created.
- Mom can insert/update/delete attendees on any family event.

**Indexes:**
- `(event_id)` — attendees per event
- `(family_member_id, response_status)` — member's event invitations

**Unique Constraint:**
- `(event_id, family_member_id)` — one attendee record per member per event

---

### Table: `event_categories`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| name | TEXT | | NOT NULL | Display name |
| slug | TEXT | | NOT NULL | Internal key: 'learning', 'sports', etc. |
| icon | TEXT | | NOT NULL | Lucide icon name |
| color | TEXT | | NULL | Optional category color (hex). If NULL, uses member color. |
| is_system | BOOLEAN | true | NOT NULL | System categories are not deletable |
| sort_order | INTEGER | 0 | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**Seed data (system categories):**

| Slug | Name | Icon |
|------|------|------|
| learning | Learning | BookOpen |
| sports | Sports & Activities | Circle (ball) |
| medical | Medical | Stethoscope |
| family | Family | Home |
| social | Social | Users |
| faith | Faith | Church |
| music_arts | Music & Arts | Music |
| travel | Travel | MapPin |
| celebration | Celebration | PartyPopper |
| work | Work / Appointment | Briefcase |
| other | Other | CalendarDays |

**RLS Policy:**
- All family members can read categories.
- Mom can insert/update/delete custom categories. Cannot delete system categories.

**Indexes:**
- `(family_id, slug)` — unique per family per slug

---

### Table: `calendar_settings`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families. One row per family. |
| default_drive_time_minutes | INTEGER | 30 | NOT NULL | Mom's default drive time for "leave by" calculation |
| required_intake_fields | JSONB | '[]' | NOT NULL | Array of field keys mom requires for kid events: ['location', 'transportation', 'items_to_bring'] |
| auto_approve_members | JSONB | '[]' | NOT NULL | Array of family_member_id UUIDs whose events skip approval |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- All family members can read calendar settings (needed for drive time calculation).
- Only mom (primary_parent) can update.

**Indexes:**
- `(family_id)` — unique, one per family

---

### Modifications to Existing Tables

**`family_members` (PRD-01) — add column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| calendar_color | TEXT | | NULL | Hex color for calendar display. If NULL, system assigns from a default palette. |

> **Decision rationale:** Member color is stored on the member profile rather than a separate calendar table because the color is used across multiple surfaces (calendar, family overview, family hub) and should be consistent everywhere. Members can change their color in their profile settings.

**`dashboard_configs.preferences` (PRD-14) — add keys:**

```json
{
  "calendar_color_mode": "dots",  // 'dots' | 'stripe'
  // existing keys: calendar_view, week_start_day, calendar_filter, etc.
}
```

### Enum/Type Updates

New TEXT CHECK enums to add:
- `event_status`: 'draft', 'pending_approval', 'approved', 'rejected', 'cancelled'
- `attendee_role`: 'attending', 'driving', 'requested_presence'
- `attendee_response`: 'pending', 'accepted', 'declined'
- `event_source`: 'manual', 'review_route', 'image_ocr', 'lila_guided', 'task_auto'

Reuses from PRD-09A:
- `recurrence_rule` values: 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom'

---

## Flows

### Incoming Flows (How Data Gets INTO the Calendar)

| Source | How It Works |
|--------|-------------|
| PRD-08 (Smart Notepad — Send To) | "Send to → Calendar" from the Send To grid. Text content sent to LiLa event parsing Edge Function. Extracted event data populates the creation form. `source_type = 'review_route'`. |
| PRD-08 (Review & Route) | When Review & Route extracts a calendar date/event item, routing to Calendar sends the extracted text through the same parsing Edge Function. `source_type = 'review_route'`. |
| PRD-09A (Tasks) | Tasks with `due_date IS NOT NULL` surface on the calendar as read-only items. No `calendar_events` record created — the calendar reads directly from the `tasks` table. Mom can inline edit task due dates from the calendar. |
| PRD-05 (LiLa conversations) | LiLa can suggest creating a calendar event during conversation. "Sounds like that's on March 15 — want me to add it to the calendar?" User confirms → event created via the Quick Add flow with `source_type = 'lila_guided'`. |
| Camera/Image capture | User photographs a flyer or screenshot. Image processed by vision model Edge Function. Extracted data populates event form. `source_type = 'image_ocr'`. Source image stored in Supabase Storage, URL saved in `source_image_url`. |
| Manual creation | User creates event directly via Quick Add or Detailed Add. `source_type = 'manual'`. |

### Outgoing Flows (How Calendar Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-14 (Dashboard calendar section) | Dashboard reads from `calendar_events` where event_date is in the displayed range and `status IN ('approved', 'pending_approval')`. Filters by member based on calendar_filter preference. |
| PRD-14C (Family Overview — future) | Family Overview consumes the same family calendar data, likely using the "all members" filter mode. |
| PRD-14D (Family Hub — future) | Family Hub renders a shared family calendar. Same data, same filter/color patterns defined in PRD-14B. |
| LiLa Context (PRD-05) | Calendar events where `is_included_in_ai = true` and event_date is within relevant range are loaded into LiLa's context assembly when calendar context is relevant (e.g., user asks "what's happening this week?"). |
| PRD-15 (Messages, Requests & Notifications) | Event reminders, approval/rejection notifications, attendee requests — all create notification records for PRD-15's notification delivery system. |

---

## AI Integration

### LiLa Event Parsing (Edge Function)

**Function:** `calendar-parse-event`

**Input:** Text content OR image (base64) + context (family member names, recent locations, existing recurring events)

**Processing:**
- For text: LiLa extracts structured event data from natural language (title, date, time, location, attendees by name matching to family members)
- For images: Vision model (via OpenRouter) reads flyer/screenshot, extracts event details + suggests "items to bring" based on event context
- Returns confidence score for extraction quality

**Output:**
```json
{
  "title": "Spring Concert",
  "date": "2026-04-02",
  "start_time": "19:00",
  "end_time": "21:00",
  "location": "Lincoln High Auditorium",
  "category_guess": "music_arts",
  "attendees_mentioned": ["Emma"],
  "items_to_bring": [
    {"text": "Formal attire", "ai_suggested": true},
    {"text": "Instrument", "ai_suggested": true}
  ],
  "confidence": 0.94
}
```

### LiLa Guided Event Creation Mode

**Guided mode name:** `calendar_event_create`
**Context loaded:** Family member names and roles, default drive time, recent locations, existing recurring events (to detect duplicates)
**AI behavior:** Friendly, conversational. Walks the user through event details step by step. Confirms each piece of information. Suggests auto-fill from recurring patterns ("Is this the same basketball practice as last week?"). Compiles answers into a structured event for review.

### Calendar Context for General LiLa Conversations

**When loaded:** User's page context is Calendar, or user asks about schedule/events/what's happening.
**What's loaded:** Next 7 days of events (title, date, time, location) for the current member. If mom, includes family events.
**Format:** Compact text summary, not full records.

---

## Edge Cases

### Large Families (7+ kids)
- Pick-and-choose filter with 10+ member avatars: horizontally scrollable row with "Select All" / "Clear All" shortcuts
- Color assignment: system assigns distinct colors from a 12-color palette on member creation. Members can customize their color in profile settings. If family exceeds palette size, colors start repeating with a pattern indicator (e.g., color + dot pattern).
- Month view with many events per day: show first 2-3 dots, then "+N more" indicator. Tap to expand.

### Recurring Event Conflicts
- When a recurring event is edited, prompt: "Edit this event only, this and future events, or all events in this series?"
- Recurring event exceptions stored in `recurrence_details.exceptions` array (dates to skip).
- If a recurring event is deleted, prompt same three options.

### Pending Event Lifecycle
- Pending events not acted on within 7 days: show a subtle "aging" indicator in the queue (not auto-rejected — mom might be busy)
- If the event date passes while still pending: auto-transition to `cancelled` with notification to creator ("Your event request for [title] expired because it wasn't approved before the event date")

### Empty States
- Calendar page with no events: "Your calendar is empty. Tap + to add your first event, or photograph a flyer to get started."
- Calendar queue with no pending items: "All caught up! No events waiting for approval." (with a small celebration indicator)
- Family view with no family events: "No family events scheduled. When family members add events, they'll appear here."

### Timezone Handling
- All times stored in UTC in the database.
- Display times converted to the family's configured timezone (stored in family settings from PRD-01, or browser timezone as fallback).
- Events created with local times are converted to UTC on save.

### Image OCR Failures
- If vision model cannot extract data from an image: show friendly message "LiLa couldn't read this image clearly. You can enter the details manually." Pre-populate what was partially extracted.
- Low confidence extractions (< 70%): show a warning indicator and highlight uncertain fields for review.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `calendar_basic` | Personal calendar — create/view/edit own events, reminders | Essential |
| `calendar_family` | Family calendar views, member filtering, color coding, attendee tagging | Enhanced |
| `calendar_ai_intake` | Image-to-event OCR, LiLa guided event creation, AI "items to bring" suggestions | Full Magic |
| `calendar_queue` | Event approval queue (mom feature) | Enhanced |

> **Tier rationale:** Personal calendar is fundamental and available to everyone. Family coordination features (seeing/filtering other members' calendars) require Enhanced because they need connected family members. AI-powered intake (OCR, guided creation, smart suggestions) is Full Magic because it's the intelligence layer.

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Event reminder delivery (push notifications) | Push notification system for event reminders | PRD-15 (Messages, Requests & Notifications) |
| Calendar tab on Family Hub | Family Hub calendar surface using same data/filter patterns | PRD-14D (Family Hub) |
| Play mode icon calendar rendering | Icon-rich visual calendar for Play mode dashboard | PRD-26 (Play Mode Dashboard) |
| Guided mode simplified calendar | Simplified calendar with icon enhancement for Guided dashboard | PRD-25 (Guided Mode Dashboard) |
| Google Calendar sync read/write | Two-way sync with Google Calendar API | Post-MVP Google Calendar PRD |
| Universal Queue Modal — future tabs (Requests, Messages, etc.) | Queue tabs for additional features with pending item flows | PRD-15 (Messages, Requests & Notifications) and future PRDs as applicable |
| Calendar context for LiLa | Loading calendar events into LiLa context assembly pipeline | Wires into PRD-05 context assembly |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Calendar routing destination in Send To grid | PRD-08 | "Send to → Calendar" routes content through `calendar-parse-event` Edge Function, extracted data populates Quick Add form. `source_type = 'review_route'`, `source_reference_id` = notepad tab ID. |
| Calendar dates/events extraction type in Review & Route | PRD-08 | Review & Route items with type "Calendar" route through the same parsing Edge Function. Items create `calendar_events` with `source_type = 'review_route'`. |
| Dashboard calendar display data source | PRD-14 | Dashboard calendar section reads from `calendar_events` table. Filters, preferences, and display behavior as specified in PRD-14. |
| Task due dates surfacing on calendar | PRD-09A (implied) | Tasks with `due_date IS NOT NULL` are queried by the calendar display alongside `calendar_events`. Read from `tasks` table directly, no duplication into `calendar_events`. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `calendar_events`, `event_attendees`, `event_categories`, `calendar_settings` tables created with RLS policies
- [ ] `calendar_color` column added to `family_members` table with default palette assignment
- [ ] `calendar_color_mode` preference added to `dashboard_configs.preferences`
- [ ] Full Calendar page accessible from sidebar navigation with day/week/month views
- [ ] Quick Add event creation (title, date, time, category)
- [ ] Detailed Add event creation (all fields — location, attendees, transportation, items to bring, recurrence, reminders, notes)
- [ ] "Help Me Plan This" LiLa guided event creation mode for kids
- [ ] Personal / Family / Pick-and-Choose filter modes on Calendar page
- [ ] Colored dots AND left-border stripe rendering for member events, preference toggle
- [ ] Pick-and-choose filter scales to 10+ members (scrollable row with Select All / Clear All)
- [ ] Event detail flyout with full event information display
- [ ] "Penciled in" pending state — gray/faded/dotted rendering for `pending_approval` events
- [ ] Event approval/rejection by mom (status transition, optional rejection note)
- [ ] Universal Queue Modal with Calendar tab (renders pending events for mom approval)
- [ ] Calendar Queue accessible from Calendar page badge, dashboard badge, QuickTasks strip
- [ ] Default drive time in Calendar Settings, auto-calculated leave_by_time on events
- [ ] Inline editable leave_by_time per event
- [ ] Image-to-event OCR via `calendar-parse-event` Edge Function (OpenRouter vision model)
- [ ] LiLa "don't forget to bring" auto-suggestions from image/text context
- [ ] "Send to → Calendar" routing from Smart Notepad and Review & Route wired
- [ ] Recurring events (daily, weekdays, weekly, biweekly, monthly, custom) with edit this/future/all
- [ ] In-app reminder data model (reminder_minutes field on events)
- [ ] System event categories seeded with icons, custom category CRUD for mom
- [ ] Mom can override icon on any individual event
- [ ] Independent teen events default to pending_approval, mom can grant bypass in Calendar Settings
- [ ] Approval bypass configurable per member in Calendar Settings
- [ ] Required intake fields configurable by mom in Calendar Settings
- [ ] RLS verification: member A cannot see member B's personal events (unless mom or permitted)
- [ ] RLS verification: Special Adult can only see assigned kids' events during active shift
- [ ] RLS verification: teen cannot see other family members' calendars
- [ ] Event date navigation: month dropdown + inline editable year (per PRD-14)
- [ ] Dashboard calendar section reads from `calendar_events` correctly (per PRD-14 spec)

### MVP When Dependency Is Ready
- [ ] Task due dates surface on calendar as read-only items (depends on PRD-09A build)
- [ ] Mom inline edits task due dates from calendar flyout (depends on PRD-09A build)
- [ ] Task due date permission scoping: mom edits any, members edit only self-created (depends on PRD-09A build)
- [ ] Calendar events loaded into LiLa context assembly (depends on PRD-05 context wiring)
- [ ] Play mode icon calendar rendering (depends on PRD-26)
- [ ] Guided mode simplified calendar (depends on PRD-25)
- [ ] Universal Queue Modal — Tasks tab migration (depends on PRD-09A queue adaptation)
- [ ] Family Hub calendar surface (depends on PRD-14D)
- [ ] QuickTasks "Review Queue" entry point wired (depends on PRD-04 QuickTasks update)

### Post-MVP
- [ ] Google Calendar two-way sync
- [ ] Push notification delivery for event reminders
- [ ] Event conflict detection (warn mom when events overlap for the same member or driver)
- [ ] Suggested event times based on family schedule gaps
- [ ] Recurring event templates ("Every Tuesday basketball practice" as reusable)
- [ ] Calendar sharing/export as .ics URL for external calendar subscriptions
- [ ] Calendar widget for the dashboard widget grid (compact next-3-events card)
- [ ] Event location integration with maps (tap location → open in maps app)
- [ ] Multi-family event coordination (shared events across families — e.g., carpool groups)
- [ ] Drag-to-reschedule events on the calendar grid

---

## CLAUDE.md Additions from This PRD

- [ ] Calendar is both a standalone page (sidebar nav) and a data source for the PRD-14 dashboard calendar section. The `calendar_events` table is the single source of truth for all event data.
- [ ] Convention: events created by mom (primary_parent) auto-approve (`status = 'approved'`). Events created by kids default to `status = 'pending_approval'` unless the member is in `calendar_settings.auto_approve_members`. Events from dad/additional adults may auto-approve based on same setting.
- [ ] Convention: "Penciled in" visual treatment for pending events — gray/faded color, dotted border, "pending" badge. Transitions to full member color on approval.
- [ ] Convention: `leave_by_time` is auto-calculated as `start_time - calendar_settings.default_drive_time_minutes` when `transportation_needed = true`. Always inline editable to override.
- [ ] Convention: task due dates from PRD-09A surface on the calendar via direct query from the `tasks` table — NO duplication into `calendar_events`. Displayed with a distinct checkbox icon and slightly muted style.
- [ ] Convention: mom can inline edit task due dates from the calendar flyout. Members can only edit due dates on tasks they created themselves.
- [ ] Convention: member calendar colors stored on `family_members.calendar_color`. System assigns from a 12-color palette if NULL. Used across calendar, family overview, family hub.
- [ ] Convention: `calendar_color_mode` preference in `dashboard_configs.preferences` — 'dots' or 'stripe'. User chooses which visual treatment for member color coding.
- [ ] Convention: Universal Queue Modal is a reusable tabbed modal component. Calendar registers the first tab. Future features (Tasks, Requests, Messages) register additional tabs. Opens to the contextually relevant tab. QuickTasks strip has a "Review Queue" entry point.
- [ ] Convention: image-to-event OCR uses the `calendar-parse-event` Edge Function with OpenRouter vision model. Same capability can be reused by PRD-09A for sequential collection OCR.
- [ ] Convention: event categories are family-scoped with system defaults (not deletable) + custom categories (mom CRUD). Icons are Lucide names. Category default icon overridable per-event via `icon_override`.
- [ ] Convention: recurrence on calendar events uses the same `recurrence_rule` + `recurrence_details` pattern as PRD-09A tasks. Edit/delete recurring events offers three options: this event, this and future, all events.
- [ ] Convention: all event times stored in UTC, displayed in family timezone.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `calendar_events`, `event_attendees`, `event_categories`, `calendar_settings`
Tables modified: `family_members` (added `calendar_color` TEXT column), `dashboard_configs.preferences` (added `calendar_color_mode` key)
Enums defined: `event_status` ('draft', 'pending_approval', 'approved', 'rejected', 'cancelled'), `attendee_role` ('attending', 'driving', 'requested_presence'), `attendee_response` ('pending', 'accepted', 'declined'), `event_source` ('manual', 'review_route', 'image_ocr', 'lila_guided', 'task_auto')
Triggers added: `set_updated_at` on `calendar_events` and `calendar_settings`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Full Calendar page (sidebar nav) + dashboard display section** | Dashboard section is a compact view; the full page gives day/week/month views with management power. Both read from the same data. |
| 2 | **Three filter modes: Personal, Family (all), Pick-and-Choose** | Personal for individual focus. Family for the whole picture. Pick-and-choose for targeted planning ("just the three kids with activities today"). Essential for large families. |
| 3 | **Color mode preference: dots or stripe, user picks** | Both are valid visual treatments. Dots scale better for large families. Stripes are more visible on single events. Let the user choose what works for their family size and visual preference. |
| 4 | **Member color stored on `family_members.calendar_color`** | Color is used across calendar, family overview, family hub. Storing on the member profile ensures consistency everywhere. System assigns from a palette if not set. |
| 5 | **Image-to-event OCR is MVP** | Core MindSweep vision — kids photographing flyers is the primary real-world intake path. The capability also serves PRD-09A's deferred sequential collection OCR. |
| 6 | **LiLa auto-suggests "items to bring" from event context** | Small AI delight that reduces mom's mental load. Always editable (human-in-the-mix). Works for both image-parsed and manually created events. |
| 7 | **Universal Queue Modal with tabs, not per-feature queue pages** | Mom processes all pending items in one session. Each feature registers a tab. Opens to contextually relevant tab. Follows same data contract as PRD-09A task queue. |
| 8 | **"Penciled in" pending state for teen events** | Teens see their events immediately (agency). Mom sees them faded/pending (awareness). Transparent — no hidden states. Approval transitions to full color. Expired pending events auto-cancel with notification. |
| 9 | **Quick Add + Detailed Add + LiLa Guided Intake — kid picks** | Quick form for speed. Guided flow for kids who need help thinking through logistics. Both produce identical event data. The guided flow doubles as executive function teaching. |
| 10 | **Default drive time in Calendar Settings, auto-calculated leave_by_time** | Mom sets once (e.g., 65 min). System calculates "leave by" automatically. Always inline editable per-event. Reduces mental math for transportation planning. |
| 11 | **All detail fields optional by default, mom configures required fields** | Reduces friction for simple events. Mom can require location and transportation info for kid events if she wants complete logistics. Flexible per family. |
| 12 | **Independent Teens default to approval-required, mom grants bypass** | Trust is granted, not assumed. Matches mom-first philosophy. Per-member toggle in Calendar Settings. |
| 13 | **Task due dates surface on calendar via direct query, not duplication** | Tasks table is the source of truth for tasks. Calendar reads from it. No sync issues, no duplicate data. Mom inline edits task due dates from calendar (full permission), kids edit only self-created task dates. |
| 14 | **Same recurrence pattern as PRD-09A** | Consistency across the system. `recurrence_rule` + `recurrence_details` JSONB handles daily, weekly, monthly, custom, school-year-only, seasonal patterns. |
| 15 | **Revised event categories with "Learning" (BookOpen), custom categories** | "Learning" resonates better than "School" for homeschool families. Custom categories let any family tailor to their life. Sports uses a ball icon (Circle), not Trophy (reserved for Victory). |
| 16 | **Reminder data model in PRD-14B, in-app reminders MVP, push deferred** | Data model is simple (minutes before event). In-app reminders work at MVP. Push notifications are a cross-cutting system deferred to a Notifications PRD. |
| 17 | **Google Calendar sync post-MVP, schema sync-ready** | `external_id`, `external_source`, `last_synced_at` fields designed into the schema now. Google is the target integration. Apple/others only if demand warrants. Zero build cost now, saves refactor later. |
| 18 | **Date navigation includes inline editing** | Users can tap date text to type directly, in addition to the month dropdown + year text field from PRD-14. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Push notification delivery for reminders | PRD-15 (Messages, Requests & Notifications) |
| 2 | Event conflict detection | Post-MVP enhancement |
| 3 | Google Calendar two-way sync | Post-MVP (schema ready now) |
| 4 | Apple / other calendar sync | Post-MVP only if demand warrants |
| 5 | Play mode icon calendar full spec | PRD-26 (Play Mode Dashboard) |
| 6 | Guided mode simplified calendar | PRD-25 (Guided Mode Dashboard) |
| 7 | Family Hub calendar surface | PRD-14D (Family Hub) |
| 8 | TV mode calendar ambient display | PRD-14E (Family Hub TV Mode) |
| 9 | Calendar widget for dashboard grid | Post-MVP (compact next-events widget) |
| 10 | Drag-to-reschedule on calendar grid | Post-MVP enhancement |
| 11 | Unified Mom's Inbox (aggregated queue across all features) | Future PRD — queue modal pattern supports this as an aggregation view |
| 12 | Tier gating activation for calendar features | When subscription tiers are implemented (future) |
| 13 | Family Requests system (any member → any member, accept/decline/snooze, sender notified) | PRD-15 (Messages, Requests & Notifications) |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | `family_members` table needs `calendar_color` TEXT column. | Add column to PRD-01 schema during audit. |
| PRD-08 (Journal + Smart Notepad) | "Send to → Calendar" routing stub now fully wired. Review & Route calendar item routing defined. | Update PRD-08 stubs section to mark Calendar routing as wired. Note `source_type = 'review_route'` and the `calendar-parse-event` Edge Function. |
| PRD-09A (Tasks) | Task due dates surface on calendar. Calendar provides inline edit for task due dates (mom full permission, members self-created only). Task Creation Queue should migrate to Universal Queue Modal as a tab. | Note calendar task due date display in PRD-09A cross-references. Plan queue modal migration during build. |
| PRD-14 (Personal Dashboard) | Dashboard calendar section data source fully defined. `calendar_color_mode` preference added. Calendar Queue badge count available for dashboard pending items indicator. | Update PRD-14 to reference PRD-14B data source. Add `calendar_color_mode` to preferences JSONB example. Note pending items badge. |
| PRD-05 (LiLa Core AI System) | Calendar event context assembly defined (next 7 days of events). `calendar_event_create` guided mode registered. `calendar-parse-event` Edge Function defined. | Add calendar context to PRD-05 context assembly pipeline. Register guided mode. |
| PRD-04 (Shell Routing & Layouts) | Calendar page added to sidebar navigation. QuickTasks strip needs "Review Queue" entry point. | Add Calendar to sidebar route list. Note Queue entry point for QuickTasks. |
| PRD-02 (Permissions & Access Control) | Calendar feature keys registered: `calendar_basic`, `calendar_family`, `calendar_ai_intake`, `calendar_queue`. Calendar visibility follows per-kid per-feature permission model. | Add calendar feature keys to Feature Key Registry. Note calendar in visibility documentation. |
| PRD-10 (Widgets, Trackers & Dashboard) | Potential future calendar widget for the dashboard grid (post-MVP). | Note as forward reference, no action needed now. |
| Build Order Source of Truth | PRD-14B completed. Universal Queue Modal pattern established. `calendar-parse-event` Edge Function established as reusable OCR capability. | Update Section 3/4 to reflect PRD-14B completion. Note Edge Function reusability for PRD-09A OCR. |

---

*End of PRD-14B*
