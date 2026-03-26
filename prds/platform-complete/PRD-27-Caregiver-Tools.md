> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-27: Caregiver Tools

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-04 (Shell Routing), PRD-10 (Widgets & Dashboard Layout), PRD-15 (Messages), PRD-35 (Universal Scheduler)
**Created:** March 17, 2026
**Last Updated:** March 17, 2026

---

## Overview

Caregiver Tools defines the complete experience for Special Adults — babysitters, aides, grandparents, therapists, tutors, and out-of-home co-parents — when they interact with MyAIM Family. This PRD finalizes the caregiver shell layout (deferred from PRD-04), defines the two-view model (Kid View and Caregiver View), specifies mom's trackable event category system, implements caregiver messaging, establishes the out-of-home co-parent access pattern, and details mom's shift history and report generation.

> **Mom experience goal:** "I hand the babysitter my phone number, they log in, and they see exactly what they need for my kids — nothing more, nothing less. When the shift ends, I get a clean summary of everything that happened."

The infrastructure for Special Adults is heavily pre-defined across PRD-01 (role, assignments), PRD-02 (permissions, shifts, shift summaries, preset bundles), and PRD-10 (widget rendering during shifts). This PRD wires those pieces together into a cohesive caregiver experience and adds the missing surfaces: the caregiver's own working view, trackable event configuration, the co-parent access pattern, and messaging.

**Key UX principle:** The caregiver experience must be usable by a grandma who doesn't do technology. One page, big clear buttons, no navigation complexity. The child's view must feel exactly like the child's own dashboard so the kid doesn't notice they're on someone else's phone.

---

## User Stories

### Caregiver Experience
- As a babysitter, I want to see all my assigned kids on one screen with their trackable items so I can quickly log diaper changes, meals, and potty trips without jumping between pages.
- As a babysitter, I want to tap a kid's name button to open their full interactive dashboard so the child can use my phone to do their tasks and play their games.
- As a caregiver, I want a running timestamped log at the bottom of my screen showing everything I've done this shift so I can see my own activity trail.
- As a caregiver, I want to compile a shift summary with one tap at the end of my shift so mom gets a clean report without me having to write it up.

### Co-Parent Experience
- As a co-parent, I want to log in and immediately see my children's dashboards without starting or ending a shift — I'm their parent, not a babysitter.
- As a co-parent, I want my access to automatically activate and deactivate based on the custody schedule mom programmed, so neither of us has to manually toggle anything.

### Mom Configuration
- As a mom, I want to create custom trackable event categories (ate lunch, went potty, changed diaper, fed bottle, took medication) per child so each caregiver sees the right items for the right kid.
- As a mom, I want to view a complete shift history with expandable detail and the option to generate aggregated reports across multiple shifts or date ranges.
- As a mom, I want to message my caregiver directly from the app and see their responses in real time during the shift.

### Child Experience
- As a child, I want to use my caregiver's phone to interact with my own dashboard and it should look and feel exactly like my tablet — same theme, same spinners, same tasks.
- As a child, I want anything I complete on the caregiver's phone to count the same as if I did it on my own device.

---

## Screens

### Screen 1: Caregiver Shell — Main View

**What the user sees:**

When a Special Adult logs in during an active access window (shift or custody schedule), they see a single-page layout with their assigned children as swipeable columns (mobile) or side-by-side columns (tablet/desktop).

```
┌─────────────────────────────────────────────────┐
│  🟢 On Shift — started 3:00 PM                  │
│  [End Shift]          [💬 Messages]    [⚙]      │
│  ─────────────────────────────────────────────── │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ ● Ruthie     │  │ ● Avvi       │   ← swipe   │
│  │ [View Ruthie]│  │ [View Avvi]  │              │
│  │──────────────│  │──────────────│              │
│  │ ☐ Ate lunch  │  │ ☐ Ate lunch  │              │
│  │ ☐ Potty trip │  │ ☐ Diaper chg │              │
│  │ ☐ Took meds  │  │ ☐ Fed bottle │              │
│  │ ☐ Hand wash  │  │ ☐ Nap time   │              │
│  │              │  │              │              │
│  │ [+ Log note] │  │ [+ Log note] │              │
│  └──────────────┘  └──────────────┘              │
│  ─────────────────────────────────────────────── │
│  SHIFT LOG                                       │
│  3:15 PM  Ruthie — Ate lunch ✓                   │
│  3:22 PM  Avvi — Diaper changed ✓ "messy"       │
│  3:30 PM  Ruthie — Potty trip ✓                  │
│  3:45 PM  [Note] Avvi was fussy after bottle     │
│  ─────────────────────────────────────────────── │
│  [Compile Shift Notes]                           │
└─────────────────────────────────────────────────┘
```

**Column header:** Each child's column has a button at the top in that child's assigned family member color (from PRD-03 member color assignment). The button shows the child's name and a "View [Name]" label. Tapping it transitions to Kid View (Screen 2).

**Trackable items:** Below each child's header button, the trackable event categories mom configured for that child appear as tappable checkbox rows. Each item:
- Tap to mark complete → adds timestamp + checkmark
- Optional quick note: a small text input appears briefly after tapping, allowing the caregiver to add a one-line note (e.g., "messy diaper," "ate half"). Dismisses after 3 seconds if no note is entered.
- Items that have been marked show a muted checkmark with timestamp
- Items can be marked multiple times per shift (e.g., potty trips). Each tap creates a new timestamped entry.
- [+ Log note] at the bottom of each column opens a free-text note entry attributed to that child

**Shift log:** A running timestamped feed at the bottom showing every action across all children. Scrollable. Most recent at top. Includes:
- Trackable event completions (with optional notes)
- Free-text notes
- Task completions (from Kid View interactions)
- Widget interactions (from Kid View)

**Persistent top bar:**
- Green dot + "On Shift — started [time]" (or for co-parents with always-on: just the child switcher, no shift indicator)
- [End Shift] button (not shown for always-on co-parents)
- [💬 Messages] icon with unread badge
- [⚙] mini-settings (theme override, notification sound toggle)

**Swipe behavior (mobile):** Columns swipe horizontally. If more than 2 children are assigned, the caregiver swipes through them. A dot indicator shows position.

**Data created/updated:**
- `trackable_event_logs` records (one per tap)
- `activity_log_entries` records with `source = 'special_adult_shift'` and `shift_session_id`
- `shift_notes` records (free-text entries)

### Screen 2: Kid View (Full Dashboard)

**What the user sees:**

When the caregiver taps a child's name button on Screen 1, the screen transitions to that child's full interactive dashboard, rendered in the child's active theme with their widgets, spinners, task lists, and gamification elements — exactly as defined in PRD-10 (for Guided/Play) or PRD-25/26 (for Guided/Play dashboards).

```
┌─────────────────────────────────────────────────┐
│  ← Back to My View      Ruthie's Dashboard      │
│  ─────────────────────────────────────────────── │
│                                                   │
│  [Ruthie's full dashboard exactly as she would   │
│   see it on her own device — same theme, same    │
│   widgets, same task lists, same gamification.   │
│   Filtered to features the caregiver has         │
│   permission to view/interact with.]             │
│                                                   │
└─────────────────────────────────────────────────┘
```

- "← Back to My View" returns to Screen 1 (Caregiver View)
- All interactions (marking tasks, tapping widgets, playing with spinners) create the same data records as if the child or mom had done it
- Celebration animations fire on completion (using the child's theme)
- All actions are timestamped with the active shift ID and logged to the shift log
- The dashboard is filtered to only features the caregiver has permission for (via `special_adult_permissions` from PRD-02)
- If the child is in Play mode, the Play Dashboard (PRD-26) renders. If Guided, the Guided Dashboard (PRD-25) renders.

> **Decision rationale:** Kid View is the child's actual dashboard, not a simplified proxy. The child should be able to use the caregiver's phone exactly like their own device. This also means gamification, theme, and celebrations all work correctly — the experience is identical.

**Data created/updated:**
- Same as the child's normal dashboard interactions — task completions, widget increments, tracker logs, etc.
- Additionally: all actions tagged with `shift_session_id` for audit trail

### Screen 3: Co-Parent Experience (No Shift UI)

**What the user sees:**

When a co-parent (Special Adult with `schedule_type = 'always_on'` or within their active custody access window) logs in, they go directly to Screen 1 WITHOUT the shift bar. No "Start Shift" / "End Shift" UI.

```
┌─────────────────────────────────────────────────┐
│  [💬 Messages]    [⚙]                           │
│  ─────────────────────────────────────────────── │
│                                                   │
│  [Same column layout as Screen 1, but no shift   │
│   banner, no shift log, no "End Shift" button.   │
│   Just the children and their trackable items.]  │
│                                                   │
│  ACTIVITY LOG                          [▼ Today] │
│  (Same timestamped feed but labeled "Activity    │
│   Log" instead of "Shift Log")                   │
│                                                   │
└─────────────────────────────────────────────────┘
```

- Activity log still records everything (for mom's visibility) but it's organized by date, not by shift
- Co-parent can tap child buttons to enter Kid View identically to other caregivers
- "Compile Notes" is still available — generates a date-range report instead of a shift-scoped report
- Messages with mom are always accessible

**Outside the custody access window:**
The co-parent sees a locked screen:
```
┌─────────────────────────────────────────────────┐
│  Hi [Name]!                                      │
│                                                   │
│  Your next access window:                        │
│  Friday, March 20 at 5:00 PM                    │
│                                                   │
│  [💬 Messages]                                   │
│  (messaging always available regardless of       │
│   access window)                                 │
└─────────────────────────────────────────────────┘
```

> **Decision rationale:** Co-parents can always message mom even outside their access window. This supports co-parenting communication without requiring child data access. The lockout applies to child data only.

### Screen 4: Mom's Trackable Event Category Configuration

**What the user sees:**

Accessible from the Permission Hub (PRD-02) under each assigned child's settings for a Special Adult, or from the child's profile in Family Management.

```
┌─────────────────────────────────────────────────┐
│  Trackable Events — Ruthie                    ✕ │
│  ─────────────────────────────────────────────── │
│  These items appear on caregivers' shift view    │
│  for Ruthie. Tap to mark each time it happens.   │
│  ─────────────────────────────────────────────── │
│                                                   │
│  ☐ Ate breakfast          [Edit] [✕]             │
│  ☐ Ate lunch              [Edit] [✕]             │
│  ☐ Ate dinner             [Edit] [✕]             │
│  ☐ Potty trip             [Edit] [✕]             │
│  ☐ Took medication (AM)   [Edit] [✕]             │
│  ☐ Took medication (PM)   [Edit] [✕]             │
│  ☐ Hand washing           [Edit] [✕]             │
│                                                   │
│  [+ Add trackable event]                         │
│                                                   │
│  ─────────────────────────────────────────────── │
│  QUICK ADD FROM PRESETS                          │
│  [Infant] [Toddler] [Special Needs]             │
│  [School Age] [Medical]                          │
└─────────────────────────────────────────────────┘
```

**Preset bundles:**
- **Infant:** Fed bottle, Diaper change (wet), Diaper change (soiled), Nap started, Nap ended, Tummy time, Bath
- **Toddler:** Ate meal, Snack, Potty trip, Diaper change, Nap started, Nap ended, Hand washing, Brushed teeth
- **Special Needs:** Took medication, Therapy exercise, ISP goal practice, Sensory break, Behavior note, Toileting, Hand washing
- **School Age:** Ate meal, Homework started, Homework finished, Practice (instrument/sport), Screen time started, Screen time ended
- **Medical:** Took medication (AM), Took medication (PM), Blood sugar check, Temperature check, Symptom note

Mom can use presets as starting points and customize (rename, reorder, add, remove). Presets don't override — they append to existing items.

**Edit modal (per item):**
- Event name (free text)
- Icon selection (from Lucide icon set)
- Allow notes toggle (default: on) — whether caregivers can add a note when marking
- Allow multiple per shift toggle (default: on) — whether the item can be tapped more than once per shift
- Require note toggle (default: off) — forces a note before the mark is saved
- Sort order (drag to reorder)

**Data created/updated:**
- `trackable_event_categories` records

### Screen 5: Mom's Shift History & Reports

**What the user sees:**

Accessible from the Permission Hub (PRD-02) or from each child's profile. Shows a timeline of all caregiver activity.

```
┌─────────────────────────────────────────────────┐
│  Caregiver Activity                              │
│  [All Caregivers ▾] [All Children ▾] [This Week]│
│  ─────────────────────────────────────────────── │
│                                                   │
│  ▼ Tue Mar 17 — Grandma Jean (3:00–6:15 PM)     │
│    Ruthie: Ate lunch, Potty trip ×2, Took meds   │
│    Avvi: Diaper ×3, Fed bottle ×2, Nap 1hr      │
│    📝 "Avvi was fussy after second bottle"       │
│    [📄 View compiled report]                     │
│                                                   │
│  ▼ Mon Mar 16 — Grandma Jean (3:00–6:00 PM)     │
│    Ruthie: Ate lunch, Hand wash ×3               │
│    Avvi: Diaper ×2, Fed bottle ×1                │
│    [Compile report]                              │
│                                                   │
│  ▼ Fri Mar 13 — Sarah (babysitter) (7:00–11 PM) │
│    All kids: Dinner, Teeth brushed, Bedtime      │
│    📝 "Jake didn't want to go to bed, read 2     │
│        extra stories"                            │
│    [Compile report]                              │
│                                                   │
│  ─────────────────────────────────────────────── │
│  [Generate Custom Report]                        │
└─────────────────────────────────────────────────┘
```

**Filters:** Caregiver dropdown, child dropdown, date range selector (today, this week, this month, custom range).

**Each shift card (collapsed):** Caregiver name, date, time range, one-line summary per child (event counts), note preview if any, compiled report link if exists.

**Each shift card (expanded):** Full chronological detail — every timestamped event, every note, every task completion from Kid View, every widget interaction.

**[Generate Custom Report]:** Opens a modal where mom selects:
- Date range (specific shift, single day, custom range)
- Children to include (all or specific)
- Caregivers to include (all or specific)
- Report style: chronological (timeline) or aggregated (summary stats)

LiLa compiles the report using the same AI compilation as the per-shift summary (PRD-02), but across the selected range. Output is a readable text block that mom can review, edit, copy, or share via Messages.

**Data created/updated:**
- `shift_reports` records (compiled report text + metadata)

### Screen 6: Caregiver Messages

**What the user sees:**

A simplified messaging interface between the caregiver and mom, wired into PRD-15's existing messaging infrastructure.

**Caregiver side:**
- [💬 Messages] icon on the top bar opens a slide-up panel or full-screen chat view
- Shows conversation thread with mom only (no other family members visible)
- Simple text input + send button
- Photo attachment option (e.g., snap a photo of an injury, a milestone moment, a mess)
- Messages are timestamped and tagged with shift_session_id if during an active shift
- Co-parents: messages are always available, even outside access window

**Mom side:**
- Caregiver messages appear in her existing Messages page (PRD-15)
- Thread is labeled with the caregiver's name and a shift indicator if the caregiver is currently on shift
- Mom can see the message thread from any page — it's a standard conversation thread, not a separate surface

**Data created/updated:**
- `conversation_threads` records with `thread_type = 'caregiver'`
- `messages` records within the thread
- Uses PRD-15's existing messaging tables — no new tables needed

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full configuration | Creates trackable categories, configures access schedules, views shift history, generates reports, messages caregivers. |
| Dad / Additional Adult | View shift history (if permitted) | Mom can grant dad read access to caregiver shift history. Cannot configure caregiver permissions. |
| Special Adult (Babysitter/Aide) | Shift-scoped | Sees assigned children's data only during active shift. Sees own shift history. Can message mom. |
| Special Adult (Co-parent) | Schedule-scoped or always-on | Sees assigned children's data during custody access window (or always if mom sets always-on). No shift UI. Can always message mom. |
| Independent (Teen) | Not applicable | Teens do not interact with the caregiver system. |
| Guided / Play | Indirect | Children's dashboards are rendered in Kid View for caregiver interaction. Children don't see or interact with caregiver tools. |

### Shell Behavior

The Special Adult shell is a **purpose-built `CaregiverLayout`** — NOT a scoped-down version of the Adult shell.

> **Decision rationale:** This resolves the open question from PRD-04. A purpose-built layout is simpler, cleaner, and more appropriate for the target user (who may not be tech-savvy). No sidebar, no drawers, no navigation complexity. One page with two views.

- **No sidebar.** The caregiver has one page with columns and a shift log.
- **No drawers.** Messages open as a slide-up panel or full screen.
- **No LiLa access.** Caregivers do not interact with LiLa.
- **No navigation.** The only "navigation" is tapping a child's button to enter Kid View and tapping "Back" to return.
- **No personal features.** No journal, goals, LifeLantern, archives, or any personal feature surface.
- **Settings minimal.** Only: notification sound toggle, theme override (light/dark).

### Privacy & Transparency

- Caregivers cannot see other caregivers' shift history or notes (unless mom explicitly enables this in Permission Hub).
- All caregiver actions are logged with timestamps and shift IDs. Mom sees everything.
- Co-parent messages with mom are private to that thread. Other caregivers cannot see them.
- Children cannot see the shift log, caregiver notes, or compiled reports. Those are adult-facing data.

---

## Data Schema

### Table: `trackable_event_categories`

Mom-defined categories for caregiver logging, per child.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members (the child this category is for) |
| event_name | TEXT | | NOT NULL | Display label ("Ate lunch", "Potty trip") |
| icon | TEXT | 'circle-check' | NOT NULL | Lucide icon name |
| allow_notes | BOOLEAN | true | NOT NULL | Whether caregiver can add a note when marking |
| allow_multiple | BOOLEAN | true | NOT NULL | Whether item can be marked multiple times per shift |
| require_note | BOOLEAN | false | NOT NULL | Whether a note is required before saving |
| sort_order | INTEGER | | NOT NULL | Display order within the child's column |
| is_active | BOOLEAN | true | NOT NULL | Soft disable without deleting |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD. Special adults can read categories for their assigned children (during active access window — enforced at app layer).

**Indexes:**
- `(family_id, member_id, is_active, sort_order)` — "active trackable events for this child, ordered"

### Table: `trackable_event_logs`

Individual log entries when a caregiver marks a trackable event.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| category_id | UUID | | NOT NULL | FK → trackable_event_categories |
| member_id | UUID | | NOT NULL | FK → family_members (the child) |
| logged_by | UUID | | NOT NULL | FK → family_members (the caregiver who marked it) |
| shift_session_id | UUID | | NULL | FK → shift_sessions. NULL for co-parent activity (no shift). |
| note | TEXT | | NULL | Optional caregiver note |
| logged_at | TIMESTAMPTZ | now() | NOT NULL | Exact timestamp of the event |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent can read all. Special adults can CRUD their own entries for assigned children during active access window.

**Indexes:**
- `(family_id, member_id, logged_at DESC)` — "all events for this child, most recent first"
- `(shift_session_id)` — "all events during this shift"
- `(category_id, logged_at DESC)` — "history of a specific event type"

### Table: `shift_reports`

Compiled shift or date-range reports generated by LiLa or manually.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| generated_by | UUID | | NOT NULL | FK → family_members (mom or caregiver who triggered compilation) |
| report_type | TEXT | 'shift' | NOT NULL | Enum: 'shift', 'daily', 'custom_range' |
| shift_session_id | UUID | | NULL | FK → shift_sessions. For single-shift reports. |
| date_range_start | DATE | | NULL | For custom range reports. |
| date_range_end | DATE | | NULL | For custom range reports. |
| caregiver_ids | UUID[] | | NULL | Which caregivers are included. NULL = all. |
| member_ids | UUID[] | | NULL | Which children are included. NULL = all assigned. |
| report_style | TEXT | 'chronological' | NOT NULL | Enum: 'chronological', 'aggregated' |
| report_text | TEXT | | NOT NULL | The compiled report content |
| edited_text | TEXT | | NULL | If the user edited the compiled report |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent can CRUD all. Caregivers can read and create reports for their own shifts.

**Indexes:**
- `(family_id, created_at DESC)` — "all reports, most recent first"
- `(shift_session_id)` — "report for this specific shift"

### Table Modifications

**`shift_sessions` table (PRD-02):** Add column:

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| is_co_parent_session | BOOLEAN | false | NOT NULL | True for co-parent activity logging (no shift start/end). Auto-created daily for always-on co-parents for log grouping. |

**`activity_log_entries` table:** Existing table. `source` enum gains value: `'trackable_event'`. Trackable event logs also create activity_log_entries for the universal activity feed.

### Enum Updates

**`shift_sessions.started_by` enum:** Add `'auto_custody'` — for sessions auto-created by custody schedule activation.

**`conversation_threads.thread_type` enum (PRD-15):** Add `'caregiver'`.

**`activity_log_entries.source` enum:** Add `'trackable_event'`.

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-01: Family Setup (Special Adult creation) | When mom adds a Special Adult, system creates `special_adult_assignments`. PRD-27 surfaces their caregiver view once permissions are configured. |
| PRD-02: Permission Hub (Screen 3) | Mom configures which features the caregiver can access and their access schedule. Uses Universal Scheduler (PRD-35) for schedule configuration. Creates `access_schedules` records. |
| PRD-02: Preset bundles | Babysitter, Grandparent, Tutor/Therapist, Custom presets populate `special_adult_permissions`. |
| PRD-10: Widget rendering | Kid View renders the child's dashboard widgets using PRD-10's rendering contract. |
| PRD-25/26: Guided/Play Dashboard | Kid View for Guided children uses PRD-25. Kid View for Play children uses PRD-26. |
| PRD-35: Universal Scheduler | Access schedules (recurring shifts, custody patterns, always-on) configured via Universal Scheduler component. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| PRD-02: Shift History (mom's Permission Hub) | Shift sessions, trackable event logs, and compiled reports visible in mom's Permission Hub. |
| PRD-15: Messages | Caregiver↔Mom messaging uses PRD-15's conversation infrastructure. Thread type = 'caregiver'. |
| PRD-10: Widget data | All widget interactions in Kid View create standard widget data records. Celebrations fire normally. |
| PRD-09A: Task completions | Task completions in Kid View create standard `task_completions` records. Rewards flow normally. |
| PRD-11: Victory Recorder | Mom can promote notable caregiver activity log entries to victories (optional). |
| Activity log | All caregiver actions create `activity_log_entries` records for universal feed. |

---

## AI Integration

### Shift Summary Compilation (Enhancement of PRD-02)

Already defined in PRD-02's AI Integration section. PRD-27 adds:

**Custom range compilation:**
- Mom selects a date range (e.g., "last 2 weeks") and optionally filters by caregiver/child
- LiLa compiles all activity within that range into a single report
- Report can be chronological (day-by-day timeline) or aggregated (summary statistics: "Ruthie averaged 3 potty trips per shift, medication given on time 95% of shifts")

**Context loaded for compilation:**
- All `trackable_event_logs` in the range
- All `shift_notes` in the range
- All `activity_log_entries` with `source = 'special_adult_shift'` or `source = 'trackable_event'` in the range
- Child names and caregiver names
- Trackable event category names (for readable labels)

**AI behavior:**
- Warm, professional tone appropriate for parent-caregiver communication
- Organize by child if multiple children, then chronologically within each child
- Highlight patterns: "Avvi's nap duration increased from 45 min to 1.5 hours over the past week"
- Note any gaps or anomalies: "No medication logged on Thursday — confirm with caregiver"
- Aggregated mode: calculate averages, counts, streaks, and trends
- Keep it concise — this is a handoff/review tool, not a narrative

### LiLa Context for Mom's Conversations

When mom is viewing the Caregiver Activity page or discussing caregiver-related topics with LiLa, recent shift data is loaded into context:
- Last 3 shifts per active caregiver (summary only)
- Any flagged items (missed medications, unusual patterns)
- Active trackable event categories per child

---

## Edge Cases

### Caregiver Logs In Outside Access Window
- Babysitter/aide: sees locked screen with "Start Shift" button (manual start is always available per PRD-02) if mom allows manual shifts, otherwise sees "Your next shift starts [date/time]."
- Co-parent: sees locked screen with "Your next access window: [date/time]" and messaging icon.
- Always-on co-parent: never sees a locked screen.

### Multiple Caregivers Simultaneously
- If two caregivers are on shift at the same time (e.g., babysitter and co-parent), each sees only the children assigned to them. If they share assigned children, both can log events. The shift log shows entries from both caregivers with attribution. No conflict — events are append-only.

### Child Completes Task in Kid View While Caregiver is Logging
- No conflict. The task completion and the trackable event are independent records. Both appear in the shift log with their own timestamps.

### Custody Schedule Transition During Active Use
- If the co-parent's access window ends while they're actively using the app, a gentle banner appears: "Your access window has ended. You can finish what you're doing, but new interactions will be limited." Active interactions (mid-note, mid-task) are allowed to complete. After 5 minutes of inactivity, the view locks.

### Caregiver Forgets to End Shift (already defined in PRD-02)
- Scheduled shift: auto-ends 30 minutes past scheduled end time.
- Manual shift: remains active. After 12 hours, mom sees a gentle indicator. Mom can end any shift remotely.

### No Trackable Events Configured
- If mom hasn't configured any trackable events for a child, the child's column shows: "[Child name] — No trackable items set up yet. Mom can add them in settings." The [View Name] button still works — the caregiver can still access Kid View for tasks and widgets.

### Trackable Event Category Modified Mid-Shift
- If mom adds, removes, or renames a category while a caregiver is on shift, the caregiver's view updates on next refresh or interaction. Existing log entries retain their original category name (denormalized in the log for historical accuracy).

### Very Large Shift Log
- If a shift generates 100+ entries (e.g., busy daycare scenario), the shift log paginates. Most recent 50 entries shown, "Load more" at the bottom. Compilation works on all entries regardless.

### Co-Parent Also Buys a Subscription
- Known future edge case. For now: a person can only be a member of one family at a time. If a co-parent wants their own subscription with their own family setup, they would need a separate account. The children cannot be "shared" between two primary parent accounts. Noted as a future business decision, not a PRD-27 concern.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `caregiver_access` | Special Adult invites and shift-based access | Enhanced |
| `caregiver_trackable_events` | Custom trackable event categories | Enhanced |
| `caregiver_shift_reports` | AI-compiled shift and date-range reports | Full Magic |
| `caregiver_custody_schedule` | Custody-pattern access scheduling (uses PRD-35 advanced patterns) | Full Magic |
| `caregiver_messaging` | Caregiver ↔ Mom messaging | Enhanced |

All return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Trackable event data feeding into widget/tracker system | Mom creates tracker widgets from trackable event data | PRD-10 enhancement |
| Push notifications for shift events | Mom gets notified of notable shift events | PRD-15 + push notification side quest |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Special Adult "what they can see" scoping | PRD-01 | Fully wired: caregiver view renders only permitted features via `special_adult_permissions`. |
| Special Adult shift view | PRD-02 Screen 6 | Fully wired: Screen 1 (Caregiver View) + Screen 2 (Kid View) implement the complete shift experience. |
| Special Adult child-widget view | PRD-10 Screen 6 | Fully wired: Kid View renders child's dashboard widgets per PRD-10 spec. |
| Special Adult shell layout decision | PRD-04 (deferred) | Resolved: purpose-built `CaregiverLayout`. No sidebar, no drawers, one page with two views. |
| Shift schedule configuration | PRD-02 Screen 3 | Enhanced: now uses Universal Scheduler (PRD-35) via `access_schedules` table. |
| Co-parent always-on pattern | PRD-02/PRD-10 forward notes | Fully wired: `schedule_type = 'always_on'` on `access_schedules`, no shift UI for co-parents. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `CaregiverLayout` renders as purpose-built single-page layout
- [ ] Caregiver View (Screen 1): swipeable child columns with trackable items
- [ ] Each child's column header is a button in their member color
- [ ] Trackable event items: tap to mark, optional quick note, timestamp recorded
- [ ] Multiple marks per shift supported (e.g., multiple potty trips)
- [ ] Running shift log at bottom showing all timestamped actions across children
- [ ] Kid View (Screen 2): tap child button → child's full dashboard in their theme
- [ ] Kid View renders Play Dashboard (PRD-26) or Guided Dashboard (PRD-25) as appropriate
- [ ] Kid View interactions create standard data records (task completions, widget data)
- [ ] All Kid View actions logged to shift log with shift_session_id
- [ ] "← Back to My View" returns to Caregiver View
- [ ] Co-parent experience: no shift UI, direct access during custody window
- [ ] Co-parent lockout screen with next access window time when outside schedule
- [ ] Co-parent always-on mode: no lockout, no shift bar
- [ ] Mom's trackable event category configuration per child
- [ ] Trackable event presets: Infant, Toddler, Special Needs, School Age, Medical
- [ ] [+ Add another] for custom categories, drag to reorder
- [ ] Category settings: allow notes, allow multiple, require note toggles
- [ ] Caregiver ↔ Mom messaging via PRD-15 infrastructure
- [ ] Co-parent messaging available even outside access window
- [ ] Mom's Shift History page with filters (caregiver, child, date range)
- [ ] Shift cards: collapsed summary + expandable detail
- [ ] Compile Shift Notes (caregiver-initiated, per shift)
- [ ] Generate Custom Report (mom-initiated, custom date range)
- [ ] `access_schedules` table replaces `shift_schedules` (from PRD-35)
- [ ] Custody schedule support via Universal Scheduler integration
- [ ] `trackable_event_categories` table created with RLS
- [ ] `trackable_event_logs` table created with RLS
- [ ] `shift_reports` table created with RLS
- [ ] All caregiver actions create `activity_log_entries` for audit trail
- [ ] Celebrations fire in Kid View using child's theme

### MVP When Dependency Is Ready
- [ ] Trackable event data feeding into tracker widgets (requires PRD-10 enhancement)
- [ ] Push notifications for caregiver shift events (requires PRD-15 push notification side quest)

### Post-MVP
- [ ] Caregiver can see other caregivers' shift notes (mom-configurable per PRD-02)
- [ ] Photo logging (caregiver snaps a photo as a log entry)
- [ ] Voice note logging (caregiver records a voice note instead of typing)
- [ ] Multi-caregiver coordination view for mom (see all active caregivers at once)
- [ ] Caregiver onboarding wizard (first login walkthrough)
- [ ] Printable daily sheet (PDF export of trackable items as a paper checklist for tech-averse caregivers)
- [ ] Trackable event pattern alerts (mom gets notified if a usual event doesn't happen — e.g., medication not logged by 10 AM)

---

## CLAUDE.md Additions from This PRD

- [ ] Special Adult shell uses `CaregiverLayout` — purpose-built single-page layout. No sidebar, no drawers, no LiLa, no personal features. One page with two views: Caregiver View (columns) and Kid View (child's dashboard).
- [ ] Caregiver View shows assigned children as swipeable columns. Each column has a member-color header button (enter Kid View) and trackable event items below.
- [ ] Kid View renders the child's actual dashboard (PRD-25 for Guided, PRD-26 for Play) filtered by caregiver permissions. All interactions create standard data records tagged with `shift_session_id`.
- [ ] Co-parents use `schedule_type = 'always_on'` or custody schedules on `access_schedules`. No shift UI — they log in and see their kids. Lockout screen shows next access window when outside schedule.
- [ ] Co-parent messaging is always available, even outside access window. Child data access is the only thing gated by the schedule.
- [ ] Trackable event categories are per-child, mom-configured. Each mark creates a `trackable_event_logs` record with timestamp, caregiver attribution, optional note, and shift_session_id.
- [ ] Shift reports can be per-shift (caregiver-initiated) or custom-range (mom-initiated). Both use LiLa compilation with chronological or aggregated style options.
- [ ] All caregiver actions create `activity_log_entries` with appropriate source values for universal audit trail.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `trackable_event_categories`, `trackable_event_logs`, `shift_reports`
Tables modified: `shift_sessions` (add `is_co_parent_session` column)
Tables replaced: `shift_schedules` → `access_schedules` (from PRD-35)
Enums updated: `shift_sessions.started_by` + 'auto_custody'; `conversation_threads.thread_type` + 'caregiver'; `activity_log_entries.source` + 'trackable_event'
Triggers added: `trackable_event_logs` AFTER INSERT → creates `activity_log_entries` record

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Purpose-built `CaregiverLayout`, not scoped Adult shell | Resolves PRD-04 deferred item. Caregivers may not be tech-savvy. One page, two views, no complexity. |
| 2 | Two-view model: Caregiver View + Kid View | Caregiver View is the working surface (columns, tracking, shift log). Kid View is the child's actual dashboard for interactive use. Clean separation. |
| 3 | Swipeable child columns with member-color header buttons | One screen, no page jumping. Header button in child's color doubles as Kid View entry point. |
| 4 | Running shift log at bottom of Caregiver View | Ambient awareness of everything logged this shift. Records actions from both Caregiver View and Kid View. |
| 5 | Co-parent = no shift UI, custody-schedule-gated or always-on | Co-parents are parents, not babysitters. No Start/End Shift ceremony. |
| 6 | Co-parent messaging always available, even outside access window | Co-parenting communication shouldn't be gated by custody schedules. Only child data access is gated. |
| 7 | Trackable events are per-child, mom-configured | Different kids have different tracking needs (infant vs school age vs special needs). |
| 8 | Preset bundles for trackable events | Reduces mom's setup time. Presets append, don't override. |
| 9 | Mom can generate custom date-range reports | Not just per-shift — "how did this week go?" or "show me the last month of Ruthie's medication tracking." |
| 10 | Kid View renders the actual child dashboard, not a proxy | Child should be able to use caregiver's phone identically to their own device. Gamification, theme, celebrations all work. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Co-parent also buys subscription (dual-family child accounts) | Future business decision. Not a technical blocker. |
| 2 | Trackable event data → tracker widgets pipeline | PRD-10 enhancement, post-MVP |
| 3 | Push notifications for shift events | PRD-15 push notification side quest |
| 4 | Caregiver onboarding wizard | Post-MVP UX enhancement |
| 5 | Photo/voice note logging | Post-MVP |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-04 (Shell Routing) | Special Adult shell resolved: `CaregiverLayout`. | Update shell routing table: `special_adult → CaregiverLayout`. Remove "open question" note. |
| PRD-02 (Permissions) | `shift_schedules` replaced by `access_schedules` (PRD-35). Shift summary compilation enhanced with custom range reports. Co-parent always-on pattern fully defined. | Update schema references. Add `'auto_custody'` to `started_by` enum. |
| PRD-10 (Widgets) | Screen 6 (Special Adult Child-Widget View) confirmed as Kid View rendering contract. | No changes needed — PRD-10 already defines this correctly. |
| PRD-15 (Messages) | `'caregiver'` thread type added. Caregiver messaging is a simplified entry point to existing infrastructure. | Add thread type to enum. |
| PRD-25/26 (Guided/Play Dashboard) | Confirmed: these dashboards render inside Kid View for caregiver interactions. | No changes needed — already compatible. |
| PRD-35 (Universal Scheduler) | Custody schedules and access windows use Universal Scheduler via `access_schedules`. | PRD-35 handles this directly. |

---

*End of PRD-27*
