# PRD-36: Universal Timer

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts)
**Created:** March 17, 2026
**Last Updated:** March 17, 2026
**Consumed by:** PRD-09A (Tasks), PRD-10 (Widgets), PRD-28 (Tracking, Allowance & Financial), PRD-24 (Gamification)

---

## Overview

The Universal Timer is a shared time-tracking engine and UI component for MyAIM Family. Every feature that involves measuring time — task focus sessions, Pomodoro intervals, homeschool hour logging, business work clock-in/clock-out, widget accumulator tracking, and general-purpose stopwatch/countdown — uses this one system instead of building its own timer.

The timer is not a visual stopwatch on screen (though it can show one). It is fundamentally a **timestamp-based time tracking engine**. When you "clock in," the system records a start timestamp in the database. When you "clock out," it records an end timestamp. Duration is calculated math: `ended_at - started_at`. This architecture means multiple things can be timed simultaneously — because each is just an independent row with its own timestamps — and timers survive app close, page refresh, and device switches. If you clock in on your phone and clock out on a tablet, it works.

The user-facing surface is a **floating bubble** — a draggable, persistent overlay that shows active timer status across all pages. Tap to expand a mini panel with controls for all running timers. When no timers are active, the bubble minimizes to a subtle clock icon or disappears entirely. For Play mode children, the bubble transforms into a playful visual timer (sand timer, hourglass animation) that makes time tangible and fun.

> **Mom experience goal:** My kids tap one button to start timing their schoolwork, and I never have to think about it. The hours show up in my reports. When my son does work for my business, he clocks in and out and I have clean time records. If I need to fix a timestamp because someone forgot to clock out, I just edit it. The timer is everywhere it needs to be, and invisible everywhere it doesn't.

> **Depends on:** PRD-04 (Shell Routing) defines the shell overlay layer where the floating bubble lives. PRD-03 (Design System) provides the theme tokens the bubble consumes.

---

## Architectural Boundaries

### What PRD-36 Owns

| System | Scope |
|--------|-------|
| Time session engine | Start/stop timestamp recording, duration calculation, concurrent session support, session editing |
| Stopwatch mode | Open-ended count-up timer, standalone or attached |
| Countdown timer mode | Set-duration countdown with completion notification |
| Pomodoro mode | Structured focus/break intervals with configurable durations |
| Clock in/out mode | Task-attached time tracking with multiple sessions per day |
| Floating bubble UI | Global overlay, draggable, persistent across navigation, expandable mini panel |
| Active timer management | View all running timers, pause/stop any, idle reminders |
| Timer configuration | Per-child timer visibility, idle reminder settings, Pomodoro defaults |
| Session editing | Mom can edit timestamps on any session, with audit trail |
| Visual timer (Play mode) | Fun animated timer display for young children |

### What Other PRDs Own (Not Duplicated Here)

| PRD | What It Owns | How PRD-36 Connects |
|-----|-------------|---------------------|
| PRD-09A (Tasks) | Task completion logic, Focus Timer view reference, task UI | PRD-36 provides the timer engine that PRD-09A's Focus Timer invokes. Task completion can be triggered by timer threshold. |
| PRD-10 (Widgets) | Tally accumulator widgets, Timer/Duration Logger widget type | PRD-36 provides session data that Duration Logger widgets display. Tally widgets tracking hours consume timer sessions. |
| PRD-28 (Allowance & Financial) | Homeschool time logging, business work earnings calculation | PRD-28 consumes timer sessions to create `homeschool_time_logs` and calculate `time × hourly_rate` earnings. |
| PRD-24 (Gamification) | Points pipeline, gamification events | Task completion (which may be triggered by timer threshold) fires the gamification pipeline. Timer itself doesn't award points — task completion does. |
| PRD-15 (Notifications) | Push notifications, notification preferences | PRD-36 fires idle reminder notifications through PRD-15's delivery system. |
| PRD-35 (Universal Scheduler) | Recurrence patterns | Future: recurring alarms/reminders use PRD-35 for scheduling. |

---

## User Stories

### Clock In/Out (Task Time Tracking)
- As a homeschool student, I want to tap a clock icon on my Math assignment and have it start timing so my hours are logged automatically.
- As a teen doing business work for mom's company, I want to clock in when I start and clock out when I stop so my work hours are accurately recorded.
- As a mom, I want to see that my son spent 47 minutes on his math assignment today across two sessions (32 min morning + 15 min afternoon) without either of us keeping track manually.
- As a child, I want to pause my timer when I take a bathroom break and resume when I come back so the time is accurate.

### Pomodoro Mode
- As a teen, I want to start a Pomodoro session on my homework so I stay focused for 25 minutes with a break reminder at the end.
- As a mom, I want to configure shorter Pomodoro intervals (15 min focus / 3 min break) for my 10-year-old who can't sustain 25 minutes of focus yet.
- As an adult, I want to use 50/10 Pomodoro intervals for deep work sessions.
- As a Guided child (with timer enabled), I want to see a fun countdown that tells me how much longer until my break.

### Stopwatch & Countdown
- As a mom, I want a general stopwatch I can start anytime — timing how long dinner takes, how long the kids play outside, or just curiosity.
- As a kid, I want to set a 10-minute countdown timer for my reading challenge so I know when time is up.
- As a teen, I want to time my workout without attaching it to a specific task.

### Multiple Concurrent Timers
- As a mom doing homeschool outside, I want my "1000 Hours Outside" tracker running at the same time as my son's Math timer and my daughter's Nature Study timer — all independently.
- As a teen, I want to have my study timer and my chore timer both visible so I can switch between activities and track both.

### Timer Management
- As a mom, I want to see all active timers across the family at a glance so I can catch any forgotten ones.
- As a mom, I want to edit a timer's start or end time when someone forgot to clock out so the records are accurate.
- As a mom, I want to get a notification when a timer has been running for 2+ hours so I can check if it was forgotten.
- As a child, I want to see my active timer as a floating bubble that I can tap to stop, even if I've navigated away from the task page.

### Visual Timer (Play Mode)
- As a young child, I want to see a big colorful sand timer counting down so I know how much longer I need to work.
- As a mom, I want my Play mode child to see a fun visual timer without seeing raw numbers or time-tracking concepts.

---

## Screens

### Screen 1: Floating Timer Bubble (Global Overlay)

**What the user sees:**

A small, draggable circular bubble that floats above all app content. It persists across page navigation. Position is remembered per session (resets to bottom-right corner on new session).

**States:**

**No active timers:**
```
(Lucide Clock icon, subtle, bottom-right corner — or hidden per config)
```
A Lucide `Clock` icon (from the Lucide icon library — consistent with PRD-03 design system). Tap to open mini panel where [+ New Stopwatch] and [+ New Timer] are available.

**One active timer:**
```
  ┌────────┐
  │ 🕐 0:47│
  └────────┘
```
Lucide `Clock` icon with elapsed time (or countdown remaining) displayed beside it. Subtle pulse animation on the icon indicates active timing. Tapping opens the mini panel.

**Multiple active timers:**
```
  ┌────┐
  │ 🕐 │ ③
  └────┘
```
Lucide `Clock` icon with a small numbered badge (theme accent color) in the corner showing the count of active timers. Tapping opens the mini panel.

**Play mode — Mom Quick-Start Countdown:**

In Play shell, the bubble includes a **quick-start countdown** feature. Mom taps the bubble and sees preset countdown buttons:

```
┌─────────────────────────────────┐
│ Quick Timer            [×]      │
│                                 │
│ [1 min] [2 min] [5 min]        │
│ [10 min] [15 min] [30 min]     │
│ [Custom: ___ min]               │
│                                 │
└─────────────────────────────────┘
```

Tapping a preset or entering a custom number starts a full-screen visual countdown on the Play child's screen (sand timer, thermometer, arc, etc. based on the child's configured style). Mom can also trigger this from her own shell when viewing a Play child's context.

**Age gate for Play children:** When a Play child taps the timer bubble (or tries to start any timer), a simple gate appears: "How old are you?" with a number input. Any number 18+ unlocks the timer controls. Numbers under 18 show a friendly message: "Ask a grown-up to start the timer!" This is a speed bump to prevent young children from activating timers unsupervised — not a security measure.

> **Decision rationale:** The Lucide Clock icon is consistent with the design system (Lucide icons only per PRD-03). The badge number follows standard mobile app badge patterns. The age gate is intentionally simple — it's about preventing accidental toddler timer spam, not about security.

**Play mode (visual timer active):**
```
  ┌──────────────┐
  │  ⏳           │
  │  (sand timer  │
  │   animation)  │
  │  12 min left  │
  └──────────────┘
```
Larger bubble with a playful animated timer. Sand timer, hourglass, melting ice cream, or filling jar animation (themed to the child's Visual World if gamification is active). Shows time remaining in large, friendly text.

> **Decision rationale:** The floating bubble ensures timer access from any screen without dedicating permanent UI real estate. Draggable positioning lets users place it where it doesn't obstruct their current task.

**Interactions:**
- **Tap:** Opens the mini panel (Screen 2)
- **Long press:** Opens quick actions (pause all, stop all)
- **Drag:** Repositions the bubble. Snaps to screen edges.
- **Swipe away:** Minimizes to a tiny dot at the screen edge (tap to restore). Does NOT stop timers.

---

### Screen 2: Timer Mini Panel (Expanded Bubble)

**What the user sees:**

An expandable panel that slides up from the bubble, showing all active timers and quick-start options.

```
┌─────────────────────────────────────┐
│ Active Timers                    [×]│
├─────────────────────────────────────┤
│ ⏱ Math — Chapter 12      0:47:22  │
│   Jake · Clock In/Out              │
│   [⏸ Pause]  [⏹ Stop]             │
├─────────────────────────────────────┤
│ ⏱ 1000 Hours Outside     1:23:05  │
│   Family · Stopwatch               │
│   [⏸ Pause]  [⏹ Stop]             │
├─────────────────────────────────────┤
│ 🍅 Science Reading        18:42    │
│   Emma · Pomodoro (focus 2/4)      │
│   [⏭ Skip Break]  [⏹ End Session] │
├─────────────────────────────────────┤
│                                     │
│ [+ New Stopwatch]  [+ New Timer]    │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- Each timer row shows: icon (clock, tomato, stopwatch), title, elapsed/remaining time, who it belongs to, timer mode
- [⏸ Pause] pauses the timer (creates a `ended_at` on the current session, timer can be resumed which starts a new session)
- [⏹ Stop] / [⏹ End Session] stops the timer and finalizes the session. If a task has a time threshold, prompts about completion.
- [⏭ Skip Break] (Pomodoro only) skips the current break and starts the next focus interval
- [+ New Stopwatch] starts a standalone stopwatch
- [+ New Timer] opens a duration picker (preset buttons: 5 min, 10 min, 15 min, 30 min, 1 hr, custom) and starts a countdown
- [×] collapses back to bubble
- Tapping a timer row navigates to the attached task/widget (if applicable)

**Data created/updated:**
- `time_sessions` records (pause creates `ended_at`, resume creates new session)

---

### Screen 3: Timer Controls on Task/Widget

**What the user sees:**

When a task or widget is configured with time tracking enabled, a timer control appears on the task card or widget.

**Task card with timer (not running):**
```
┌─ Math — Chapter 12 ─────────────────┐
│ Today: 32 min (1 session)            │
│                                      │
│ [▶ Clock In]  [🍅 Pomodoro]         │
└──────────────────────────────────────┘
```

**Task card with timer (running):**
```
┌─ Math — Chapter 12 ─────────────────┐
│ ⏱ 0:47:22 (active)                  │
│ Today: 32 min + current session      │
│                                      │
│ [⏸ Pause]  [⏹ Done]                │
└──────────────────────────────────────┘
```

**Task card with Pomodoro (running):**
```
┌─ Math — Chapter 12 ─────────────────┐
│ 🍅 Focus: 18:42 remaining           │
│ Session 2 of 4                       │
│ Today: 32 min + 6:18 this interval   │
│                                      │
│ [⏸ Pause]  [⏭ Skip]  [⏹ End]      │
└──────────────────────────────────────┘
```

**Guided child task card (timer enabled by mom):**
```
┌─ Math — Chapter 12 ─────────────────┐
│                                      │
│        [  ▶ START  ]                 │
│                                      │
│   You've done 32 minutes today!      │
└──────────────────────────────────────┘
```

**Play child task card (visual timer):**
```
┌─ Math ───────────────────────────────┐
│                                      │
│         ⏳ (sand animation)          │
│         12 minutes left!             │
│                                      │
│      (progress fills as time         │
│       elapses toward goal)           │
│                                      │
└──────────────────────────────────────┘
```

**Interactions:**
- [▶ Clock In] starts a new time session. Creates `time_sessions` record with `started_at = now()`. Bubble appears/updates.
- [🍅 Pomodoro] starts a Pomodoro session with configured intervals. Same underlying `time_sessions` data.
- [⏸ Pause] ends the current session and shows a [▶ Resume] button.
- [⏹ Done] ends the session AND completes the task (or prompts for completion if approval required).
- [⏹ End] (Pomodoro) ends the Pomodoro sequence early. Completed intervals are logged.
- For time-threshold tasks: when accumulated time reaches the threshold, a celebration fires and the task becomes completable (or auto-completes if no approval needed).

**Data created/updated:**
- `time_sessions` record on start, updated on stop
- Task completion record (if threshold reached or Done tapped)

---

### Screen 4: Session History & Editing (Mom)

**Entry point:** Task detail → Time History, or Settings → Family Timer Settings → View Sessions

**What the user sees:**

```
Math — Chapter 12 · Jake
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This Week: 3 hrs 15 min (7 sessions)

Today
  10:15 AM – 10:47 AM  (32 min)  [✎ Edit]
  2:30 PM  – 2:45 PM   (15 min)  [✎ Edit]

Yesterday
  9:00 AM  – 9:52 AM   (52 min)  [✎ Edit]
  1:15 PM  – 1:42 PM   (27 min)  [✎ Edit]
  ⚠ 3:30 PM – (auto-paused at 7:30 PM)
     4 hrs — likely forgotten        [✎ Edit]

Monday
  10:00 AM – 10:45 AM  (45 min)  [✎ Edit]
  2:00 PM  – 2:24 PM   (24 min)  [✎ Edit]

[+ Add Manual Session]
```

**Edit Session Modal:**

```
┌─ Edit Session ──────────────────────┐
│                                      │
│ Started: [10:15 AM ▼] on [Mar 17 ▼] │
│ Ended:   [10:47 AM ▼] on [Mar 17 ▼] │
│                                      │
│ Duration: 32 minutes                 │
│                                      │
│ Reason for edit (optional):          │
│ ┌──────────────────────────────────┐ │
│ │ Forgot to start until 10 min in │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Original: 10:15 AM – 10:47 AM       │
│                                      │
│       [Save Changes]  [Cancel]       │
│                                      │
│ [Delete Session]                     │
└──────────────────────────────────────┘
```

**Interactions:**
- [✎ Edit] opens the Edit Session Modal with time pickers for start and end
- Duration recalculates live as timestamps are adjusted
- Original timestamps shown for reference (audit trail)
- Optional reason field for the edit
- [+ Add Manual Session] creates a session from manual timestamp entry (for when someone forgot to use the timer entirely)
- [Delete Session] removes the session with confirmation (soft delete — `deleted_at` timestamp, data preserved for audit)
- ⚠ Flag on sessions that were auto-paused (likely forgotten) draws mom's attention

**Data created/updated:**
- `time_sessions` record updated (edit preserves originals in metadata)
- New `time_sessions` record (manual entry)

---

### Screen 5: Timer Configuration (Per-Child)

**Entry point:** Settings → Timer Settings

**What the user sees:**

```
Timer Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Family Defaults
  Idle reminder after:      [2 hours ▼]
  Repeat reminder every:    [1 hour ▼]
  Auto-pause after:         [Off ▼]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Per Child Settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Jake (Independent)
  Timer visible: ● Yes  ○ No    (default: Yes)
  Pomodoro defaults: 25 / 5 / 15
  Can start standalone timers: ● Yes  ○ No

Emma (Guided)
  Timer visible: ● Yes  ○ No    (default: No)
  Pomodoro defaults: 15 / 3 / 10
  Can start standalone timers: ○ Yes  ● No
  Visual timer style: [Sand Timer ▼]

Lily (Play)
  Timer visible: always visual
  Visual timer style: [Hourglass ▼]
  Show time as numbers: ○ Yes  ● No
  (Play children always see visual timer only)
```

**Interactions:**
- Family defaults apply to all members unless overridden
- Per-child overrides for visibility, Pomodoro durations, standalone timer access
- Play children always see visual timer — the only config is which animation style
- Visual timer style options: Sand Timer, Hourglass, Thermometer, Arc (progress ring), Filling Jar — all SVG/CSS, all theme-color-adaptable via semantic tokens
- Play children always see visual timer — the only config is which animation style and whether to show numbers alongside the visual

> **Decision rationale:** Five visual timer styles, all implemented as SVG/CSS animations consuming theme color tokens. They render identically across all themes — only colors change. No pre-rendered video assets needed. Sand Timer and Hourglass are object-oriented (a thing with sand flowing). Thermometer and Arc are abstract/metric-oriented (a shape filling). Filling Jar is playful. Covers the range from minimal to whimsical.

**Data created/updated:**
- `timer_configs` record (family-wide defaults + per-child overrides)

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full access | Start/stop/edit/delete any family member's timer sessions. View all active timers. Configure all settings. Add manual sessions. |
| Dad / Additional Adult | Own timers + permitted children's timers | Can start/stop timers for permitted children. Cannot edit historical sessions (mom only). |
| Special Adult | Active timers for assigned children during shift | Can start/stop timers for assigned children. Sessions logged with `started_by` noting the caregiver. Cannot edit or delete. |
| Independent (Teen) | Own timers | Full start/stop/pause control. Can start standalone timers. View own session history. Cannot edit timestamps (mom only). |
| Guided | Own timers (if `timer_visible = true`) | Big start/stop buttons. Simplified display. Cannot start standalone timers unless mom enables. If timer_visible = false, timing runs silently — mom sees data, child doesn't. |
| Play | Visual timer only | Fun animated timer on tasks with time tracking. No clock-in/out concept. No session history. No standalone timers. Timer runs when mom or the task starts it. |

### Shell Behavior

| Shell | Timer Display | Bubble Behavior | Timer Controls |
|-------|--------------|----------------|----------------|
| Mom Shell | Full session detail, edit capability | Standard bubble with timer count/elapsed time | Start/stop/pause any member's timers. Edit timestamps. |
| Dad Shell | Own + permitted children's timers | Standard bubble, own + children's timers | Start/stop/pause. No editing. |
| Special Adult Shell | Assigned children's active timers during shift | Standard bubble, shift children only | Start/stop for assigned children. Logged with caregiver attribution. |
| Independent Shell | Own timers only | Standard bubble, own timers | Full start/stop/pause. Standalone timers if enabled. |
| Guided Shell | Simplified timer on tasks (if enabled) | Simplified bubble showing elapsed time or countdown | Big start/stop buttons. No standalone. |
| Play Shell | Visual animated timer | Visual bubble (sand timer / hourglass / themed animation) | Timer controlled by task start/completion. No manual controls. |

### Privacy & Transparency
- Teens can see their own session history and total time per task but cannot see siblings' timer data
- Timer data is included in LiLa context assembly for homeschool estimation (subject, duration) but NOT for financial calculations (dollar amounts are excluded per PRD-28)
- Session editing is mom-only to maintain data integrity for homeschool compliance and business work records

---

## Data Schema

### Table: `time_sessions`

Individual timer sessions. One row per start/stop cycle.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (who is being timed) |
| started_by | UUID | | NOT NULL | FK → family_members (who pressed start — may differ from family_member_id for caregivers/parents) |
| task_id | UUID | | NULL | FK → tasks (NULL for standalone/widget/list sessions) |
| widget_id | UUID | | NULL | FK → widgets (for Tally accumulators tracking hours) |
| list_item_id | UUID | | NULL | FK → list_items (for timing list items directly) |
| source_type | TEXT | | NULL | Generic attachment: 'learning_log', 'project_step', or any future source. NULL when task_id/widget_id/list_item_id is set. |
| source_reference_id | UUID | | NULL | FK to the source record for generic attachments |
| timer_mode | TEXT | 'clock' | NOT NULL | 'clock', 'pomodoro_focus', 'pomodoro_break', 'stopwatch', 'countdown' |
| started_at | TIMESTAMPTZ | now() | NOT NULL | Precise start timestamp |
| ended_at | TIMESTAMPTZ | | NULL | NULL = currently active |
| duration_minutes | INTEGER | | NULL | Calculated on session end: `EXTRACT(EPOCH FROM ended_at - started_at) / 60`. NULL while active. |
| is_standalone | BOOLEAN | false | NOT NULL | True if not attached to any task, widget, list item, or source |
| standalone_label | TEXT | | NULL | User-provided label for standalone sessions (e.g., "Timing dinner prep") |
| pomodoro_interval_number | INTEGER | | NULL | Which interval in the Pomodoro sequence (1, 2, 3, 4...) |
| pomodoro_config | JSONB | | NULL | `{focus_minutes, short_break_minutes, long_break_minutes, intervals_before_long_break}` |
| countdown_target_minutes | INTEGER | | NULL | For countdown mode: original target duration |
| auto_paused | BOOLEAN | false | NOT NULL | True if session was ended by auto-pause (idle protection) |
| edited | BOOLEAN | false | NOT NULL | True if timestamps were manually adjusted |
| edited_by | UUID | | NULL | FK → family_members (who edited) |
| edited_at | TIMESTAMPTZ | | NULL | When the edit occurred |
| original_timestamps | JSONB | | NULL | `{started_at, ended_at}` — preserved when edited for audit trail |
| edit_reason | TEXT | | NULL | Optional reason for the edit |
| deleted_at | TIMESTAMPTZ | | NULL | Soft delete. NULL = active. |
| metadata | JSONB | '{}' | NOT NULL | Additional context (threshold reached, completion triggered, etc.) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

> **Decision rationale:** Dedicated FKs (`task_id`, `widget_id`, `list_item_id`) provide indexed query performance for the most common attachment points. The generic `source_type` + `source_reference_id` pair handles future attachment points (learning logs, project steps, etc.) without schema migration. At least one FK or `source_type` must be non-null, OR `is_standalone = true`.

**RLS Policy:** Family-scoped. Mom reads/writes all. Members read/write own (start/stop only — no edit). Dad reads children if permitted. Special Adults read/write assigned children during shift.

**Indexes:**
- `(family_member_id, ended_at)` — active sessions (ended_at IS NULL) and recent history
- `(task_id, family_member_id, created_at)` — sessions for a specific task
- `(widget_id, family_member_id, created_at)` — sessions for a specific widget
- `(list_item_id, family_member_id, created_at)` — sessions for a specific list item
- `(source_type, source_reference_id)` — generic attachment lookups
- `(family_id, ended_at)` — family-wide active sessions
- `(family_member_id, timer_mode, created_at)` — filtered by mode
- `(auto_paused)` — flagged sessions for review

---

### Table: `timer_configs`

Per-member timer configuration. One record per family member.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| timer_visible | BOOLEAN | | NOT NULL | Default varies by shell: true for Mom/Dad/Independent, false for Guided, always true (visual) for Play |
| idle_reminder_minutes | INTEGER | 120 | NOT NULL | Minutes before first idle reminder. 0 = disabled. |
| idle_repeat_minutes | INTEGER | 60 | NOT NULL | Minutes between repeated reminders. 0 = no repeat. |
| auto_pause_minutes | INTEGER | 0 | NOT NULL | Auto-pause after this many minutes. 0 = disabled. |
| pomodoro_focus_minutes | INTEGER | 25 | NOT NULL | Default Pomodoro focus interval |
| pomodoro_short_break_minutes | INTEGER | 5 | NOT NULL | Default short break |
| pomodoro_long_break_minutes | INTEGER | 15 | NOT NULL | Default long break |
| pomodoro_intervals_before_long | INTEGER | 4 | NOT NULL | Focus intervals before a long break |
| pomodoro_break_required | BOOLEAN | false | NOT NULL | For Guided/Play: dim task UI during breaks |
| can_start_standalone | BOOLEAN | | NOT NULL | Default: true for Mom/Dad/Independent, false for Guided/Play |
| visual_timer_style | TEXT | 'sand_timer' | NOT NULL | For Play/Guided visual mode: 'sand_timer', 'hourglass', 'thermometer', 'arc', 'filling_jar' |
| show_time_as_numbers | BOOLEAN | true | NOT NULL | False for Play mode: shows only visual, no numeric time |
| bubble_position | JSONB | '{"x": "right", "y": "bottom"}' | NOT NULL | Remembered bubble position |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Members read own.

**Indexes:**
- `(family_member_id)` UNIQUE — one config per member
- `(family_id)` — family-level queries

---

### Enum/Type Updates

```sql
-- New enum for timer modes
CREATE TYPE timer_mode AS ENUM ('clock', 'pomodoro_focus', 'pomodoro_break', 'stopwatch', 'countdown');

-- New enum for visual timer styles
CREATE TYPE visual_timer_style AS ENUM ('sand_timer', 'hourglass', 'thermometer', 'arc', 'filling_jar');
```

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-09A (Tasks) | When a task has "Track Time" enabled in its configuration, the timer controls appear on the task card. Tapping [▶ Clock In] or [🍅 Pomodoro] creates a `time_sessions` record. |
| PRD-10 (Widgets) | Tally accumulator widgets tracking time (hours/minutes) can have [▶ Start] buttons that create `time_sessions` records linked via `widget_id`. |
| PRD-28 (Log Learning) | The Log Learning modal's [Use Timer ▶] button starts a timer session linked to the learning entry being created. |
| Standalone start | The floating bubble's [+ New Stopwatch] and [+ New Timer] create standalone sessions with `is_standalone = true`. |
| Manual entry (Mom) | Mom can add sessions retroactively via [+ Add Manual Session] on the session history screen. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-09A (Tasks) | Timer sessions provide duration data for time-tracked tasks. When a time threshold is reached, the timer emits a `threshold_reached` event that the task system can use to auto-complete or enable completion. |
| PRD-28 (Homeschool) | Timer sessions on homeschool-tagged tasks are consumed by PRD-28 to create `homeschool_time_logs` entries. Session duration feeds the subject time allocation. |
| PRD-28 (Financial) | Timer sessions on business-work opportunity tasks are consumed by PRD-28 to calculate `duration_minutes × hourly_rate = earnings`. |
| PRD-24 (Gamification) | Timer-triggered task completion fires the gamification event pipeline (points earned, streak updated). The timer doesn't interact with gamification directly — it flows through task completion. |
| PRD-10 (Widgets) | Timer sessions linked to widgets update the widget's accumulated value (e.g., Tally accumulator adds session minutes to total). |
| PRD-15 (Notifications) | Idle reminders and auto-pause events fire notifications through PRD-15's delivery system. |

### Event Emission Pattern

When a timer session ends (clock out, Pomodoro interval complete, countdown finished, or auto-pause), the system emits a `time_session_completed` event with the session data. Consuming features listen independently:

1. **PRD-09A** checks: Is this session attached to a task? Update task time accumulation. Check threshold.
2. **PRD-28** checks: Is the attached task homeschool-tagged? Create/update `homeschool_time_logs`. Is the attached task a business-work opportunity? Calculate earnings.
3. **PRD-10** checks: Is this session attached to a widget? Update widget data point.

Each consumer processes the event independently. No sequencing required. No consumer blocks another.

---

## AI Integration

### No Guided Mode

The Universal Timer does not register its own LiLa guided mode. Timer data is consumed by other features' guided modes:

- **PRD-28's `homeschool_time_review` mode** receives timer session data as context when LiLa estimates subject allocation
- **PRD-05's task context assembly** includes active timer status and recent session history for the current task when LiLa is consulted about task-related questions

### System Prompt Notes
- LiLa can reference timer data in general terms ("You've spent 45 minutes on math today") when discussing task progress
- LiLa does not start or stop timers — timer control is always user-initiated
- When a child asks LiLa "how long have I been working on this?", LiLa can read the active session's elapsed time from context

---

## Edge Cases

### Session Management

**Forgotten timer (no auto-pause):** If auto-pause is disabled and a timer runs overnight, the session records whatever duration accumulated. Mom can edit the timestamps to the actual work time. The ⚠ flag on long sessions draws her attention.

**App crash / network loss during active session:** Since `started_at` is written to the database on clock-in, the session persists regardless of client state. On reconnection, the client queries for active sessions (`ended_at IS NULL`) and resumes display. No data loss.

**Device switch mid-session:** Start on phone, stop on tablet. The session record lives in the database. Any client that queries active sessions for this user will show the running timer. Stop from any device writes `ended_at`.

**Simultaneous start conflict:** If two devices attempt to start a timer on the same task for the same user at the same instant, both create session records. This is fine — multiple sessions on the same task is the normal case (morning + afternoon sessions). If truly simultaneous, mom can edit/delete the duplicate.

### Pomodoro Specifics

**Partial Pomodoro interval:** If a user stops a Pomodoro mid-interval, the partial interval is logged as a session with the actual duration (not the full interval duration). The Pomodoro sequence state resets.

**Pomodoro across app close:** Pomodoro interval tracking (which interval number, break vs. focus) is stored client-side since it's UI state. If the app closes mid-Pomodoro, on reopen the active session is detected (server-side `ended_at IS NULL`) but the interval sequence resets. The time is preserved; the Pomodoro structure restarts. This is an acceptable tradeoff — Pomodoro is a focus technique, and if you left the app, you broke focus anyway.

**Pomodoro break enforcement (Guided/Play):** When `pomodoro_break_required = true`, the task card UI dims during break time and shows a break animation. The child cannot interact with the task until the break ends or is skipped by a parent. This is UI-only — no data enforcement (the session records are the same regardless).

### Concurrent Timers

**Too many active timers:** At 5+ active timers, the bubble shows a count badge and the mini panel adds a gentle note: "You have 5 timers running. Did you forget one?" No enforcement — just awareness.

**Timer on completed task:** If a task is marked complete while a timer is active, the timer stops automatically and the session is finalized with the completion timestamp as `ended_at`.

### Editing

**Mom edits session that feeds into financial calculation:** When a session's timestamps are edited, any downstream calculations that consumed the original session (PRD-28 homeschool logs, financial transactions) are flagged for recalculation. The system re-runs the affected calculations with the new duration.

**Deleted session that was already consumed:** Soft delete (`deleted_at` set). Downstream consumers check for deleted sessions in their next calculation cycle and adjust accordingly (remove the deleted session's contribution).

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `timer_basic` | Clock in/out on tasks, single active timer, basic bubble | Essential |
| `timer_advanced` | Pomodoro mode, concurrent timers, standalone stopwatch/countdown, session editing | Enhanced |
| `timer_visual` | Visual timer styles for Play/Guided (sand timer, hourglass, themed animations) | Enhanced |

> **Tier rationale:** Basic clock in/out is a core productivity feature. Pomodoro, concurrent timers, and visual styles add sophistication. All return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Alarm/reminder system | One-time and recurring alarms with notification delivery | Post-MVP extension bridging PRD-36 (timer UI), PRD-15 (notifications), PRD-35 (scheduler) |
| Visual World themed timer animations | Timer visuals that match the child's active Visual World theme | PRD-24A (Visual Worlds) |
| Timer data in compliance reports | Session history as evidence for homeschool hour verification | Side Quest: Homeschool Compliance Reporting |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Focus Timer (Pomodoro) on tasks | PRD-09A | PRD-36 provides the Pomodoro engine and UI. Focus Timer view in PRD-09A invokes PRD-36's Pomodoro mode on the selected task. |
| Timer / Duration Logger widget type | Widget Template Catalog (Type 14) | PRD-36 provides session data that the Duration Logger widget displays. Widget [▶ Start] button invokes PRD-36's clock mode linked via `widget_id`. |
| Universal Timer integration points | PRD-28 | PRD-36 provides `time_sessions` data consumed by homeschool time logging, business work earnings, and the Log Learning flow. `time_session_completed` event drives downstream processing. |
| Configurable Pomodoro timer durations | PRD-09A (Deferred #16) | PRD-36 delivers configurable Pomodoro intervals (focus, short break, long break, intervals before long) per member. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `time_sessions` table created with all columns and indexes
- [ ] `timer_configs` table created with per-member configuration
- [ ] Clock in/out mode: start/stop creates session records with precise timestamps
- [ ] Duration calculated as `ended_at - started_at` on session end
- [ ] Multiple concurrent sessions supported (independent rows, no conflicts)
- [ ] Pomodoro mode: configurable focus/break intervals, interval tracking, break prompts
- [ ] Pomodoro break enforcement option for Guided/Play (dims task UI during break)
- [ ] Stopwatch mode: standalone count-up timer
- [ ] Countdown mode: set duration, count down, notify on completion
- [ ] Floating bubble: draggable, persistent across navigation, shows active timer count or elapsed time
- [ ] Floating bubble: tap to expand mini panel with all active timers and controls
- [ ] Mini panel: pause/stop/resume controls per timer
- [ ] Mini panel: [+ New Stopwatch] and [+ New Timer] quick-start
- [ ] Timer controls on task cards (when task has time tracking enabled)
- [ ] Timer controls on widget cards (for time-tracking widgets)
- [ ] Idle reminder notifications after configurable duration (default: 2 hours)
- [ ] Repeated idle reminders at configurable interval (default: every 1 hour)
- [ ] Auto-pause after configurable maximum duration (default: off)
- [ ] Auto-paused sessions flagged with ⚠ in session history
- [ ] Session history view per task with date grouping
- [ ] Mom can edit session timestamps with audit trail (original preserved, edit reason)
- [ ] Mom can add manual sessions retroactively
- [ ] Mom can soft-delete sessions
- [ ] Timer persists across app close / page refresh (server-side timestamps)
- [ ] Timer works across device switches (query active sessions on load)
- [ ] `time_session_completed` event emitted on session end for downstream consumers
- [ ] Play mode visual timer (sand timer animation as default, 5 SVG/CSS styles total)
- [ ] Play mode age gate: "How old are you?" prompt prevents unsupervised timer starts
- [ ] Play mode mom quick-start countdown: preset buttons (1/2/5/10/15/30 min + custom) launch full-screen visual countdown
- [ ] All visual timer styles implemented as SVG/CSS consuming theme color tokens (sand timer, hourglass, thermometer, arc, filling jar)
- [ ] Guided mode timer visibility toggle (mom-configurable per child)
- [ ] Per-child Pomodoro defaults configurable
- [ ] Per-child standalone timer permission configurable
- [ ] Timer configuration screen in Settings
- [ ] RLS policies enforce family-scoped access on all tables
- [ ] All 5 shells render timer appropriately per shell behavior table
- [ ] `useCanAccess()` wired for all feature keys
- [ ] Downstream recalculation triggered when sessions are edited or deleted

### MVP When Dependency Is Ready
- [ ] Timer sessions → homeschool time log creation (requires PRD-28 built)
- [ ] Timer sessions × hourly rate → financial transaction (requires PRD-28 built)
- [ ] Timer sessions → widget data point updates (requires PRD-10 widget build)
- [ ] Timer on sequential list items (requires PRD-09B list rendering)
- [ ] Idle reminder delivery through notification system (requires PRD-15 built)
- [ ] Visual World themed timer animations (requires PRD-24A Visual Worlds)
- [ ] Task time threshold → auto-completion trigger (requires PRD-09A task completion wiring)

### Post-MVP
- [ ] Alarm system (one-time alarms with notification)
- [ ] Recurring alarms/reminders (PRD-35 scheduler + PRD-15 notifications)
- [ ] Additional visual timer styles (themed to Visual Worlds)
- [ ] Timer analytics (weekly time reports per family member)
- [ ] Time comparison across siblings (optional, mom-enabled)
- [ ] Timer sounds/haptics (focus start chime, break bell, completion celebration)
- [ ] Smart Pomodoro (LiLa adjusts interval length based on past focus patterns)

---

## CLAUDE.md Additions from This PRD

- [ ] All time tracking in MyAIM uses the Universal Timer (PRD-36). Never build a custom timer component.
- [ ] Timer sessions are server-side timestamps, not client-side counters. `started_at` is written on clock-in. `ended_at` is written on clock-out. Duration = math. Client displays calculated elapsed time.
- [ ] Multiple concurrent timers are supported. Each is an independent `time_sessions` row. No global "active timer" singleton.
- [ ] Floating bubble is a global overlay rendered in the shell's overlay layer (same z-index tier as modals but non-blocking). Persists across navigation. Position is client-side state.
- [ ] Timer session editing preserves original timestamps in `original_timestamps` JSONB. Edits set `edited = true`, `edited_by`, `edited_at`. Never overwrite originals without preserving them.
- [ ] Soft delete on sessions: set `deleted_at`, never hard delete. Downstream consumers check `deleted_at IS NULL`.
- [ ] `time_session_completed` event is the integration point. Consumers (PRD-09A, PRD-28, PRD-10, PRD-24 via task completion) listen independently. No consumer blocks another.
- [ ] Pomodoro state (which interval, break vs. focus) is client-side. Session timestamps are server-side. App restart preserves the session but resets the Pomodoro sequence.
- [ ] Floating bubble uses Lucide `Clock` icon with numbered badge for multiple active timers. Consistent with Lucide-only icon policy (PRD-03).
- [ ] Five visual timer styles: Sand Timer, Hourglass, Thermometer, Arc, Filling Jar. All SVG/CSS animations consuming theme semantic tokens. No hardcoded colors. No pre-rendered video.
- [ ] Play mode age gate: "How old are you?" number input. 18+ unlocks timer controls. Under 18 shows friendly redirect. Speed bump, not security.
- [ ] Timer can attach to tasks (`task_id`), widgets (`widget_id`), list items (`list_item_id`), or generic sources (`source_type` + `source_reference_id`). At least one must be set, or `is_standalone = true`.
- [ ] Play mode children always see visual timer, never raw numbers or clock-in/out concepts.
- [ ] Guided children's timer visibility is controlled by `timer_configs.timer_visible`. When false, timing runs silently.
- [ ] Duration stored as INTEGER minutes in `duration_minutes` for completed sessions. Display converts as needed (hours:minutes). Calculations use minutes as base unit (consistent with PRD-28 homeschool time logs).

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `time_sessions`, `timer_configs`
Enums created: `timer_mode`, `visual_timer_style`
Triggers added:
- `updated_at` auto-trigger on `timer_configs`
- `duration_minutes` auto-calculated trigger on `time_sessions` when `ended_at` is set

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Timestamp-based engine, not client-side counter | Server-side timestamps survive app close, device switches, and network loss. Duration is calculated math. Client just displays `now() - started_at`. |
| 2 | Floating draggable bubble as the global timer UI | Persistent across navigation without dedicated screen real estate. Expandable mini panel for multi-timer management. Draggable so it never blocks content. |
| 3 | No hard limit on concurrent timers | Multiple activities CAN run simultaneously (outside time + math time). Soft warning at 5+. Idle reminders catch forgotten ones. |
| 4 | Pomodoro as a mode on top of clock in/out | Same underlying data model (time_sessions). Pomodoro adds interval management, break prompts, and optional break enforcement. Not a separate system. |
| 5 | Three completion behaviors: threshold, manual, time-record-only | Tasks can auto-complete on time threshold, require manual completion despite timer, or just log time without any completion concept. Covers all use cases. |
| 6 | Mom can edit any session timestamps with audit trail | Real life requires timestamp corrections (forgot to clock in/out, caregiver times need adjustment). Original timestamps preserved in JSONB for audit. Edit reason optional. |
| 7 | Timer visible toggle for Guided children (default: off) | Some Guided children (e.g., a capable 10-year-old) want to see and control their timers. Mom decides per child. When off, timing runs silently. |
| 8 | Play mode always uses visual timer | Fun animated timer (sand timer, hourglass, etc.) makes time tangible for young children without exposing clock-in/out or time-tracking concepts. Themed to Visual World when gamification is active. |
| 9 | Session editing triggers downstream recalculation | When timestamps change, homeschool time logs and financial calculations that consumed the original session must be recalculated. Maintains data integrity across systems. |
| 10 | Soft delete on sessions, never hard delete | Time data is used for compliance reporting and financial records. Deleted sessions must remain queryable for audit. `deleted_at IS NULL` filter on all active queries. |
| 11 | Alarms and recurring reminders deferred to Post-MVP | Alarms overlap with PRD-15 (Notifications) and PRD-35 (Scheduler). The timer UI (floating bubble) is the natural home for alarm display, but the backend is notification-based, not timer-based. Bridge it later. |
| 12 | Standalone stopwatch and countdown available | General-purpose timing utility. Not everything needs a task attached. Mom timing dinner, kid timing a reading challenge, teen timing a workout. `is_standalone = true` with optional label. |
| 13 | `time_session_completed` event as the integration pattern | Loose coupling. Each consuming feature listens independently. Adding a new consumer doesn't require modifying the timer. Same pattern as task completion events. |
| 14 | Auto-pause creates a valid session, doesn't delete | Forgotten timers that auto-pause log the full duration up to the auto-pause point. Mom can edit to the actual time. Better to have a long session to trim than lost data. |
| 15 | PRD-36 is NUMBER LOCKED | Referenced by PRD-28. Cannot be renumbered. |
| 16 | Floating bubble uses Lucide Clock icon with badge count | Consistent with PRD-03 design system (Lucide icons only). Badge follows standard mobile app patterns. |
| 17 | Five visual timer styles, all SVG/CSS, all theme-adaptable | Sand Timer, Hourglass, Thermometer, Arc (progress ring), Filling Jar. Consume theme color tokens. No pre-rendered video needed. |
| 18 | Age gate for Play children: "How old are you?" | Speed bump, not security. Prevents toddler timer spam. Any number 18+ unlocks. Friendly redirect for children. |
| 19 | Mom quick-start countdown for Play mode | Mom can launch a visual countdown (1/2/5/10/15/30 min or custom) directly from the bubble. Full-screen visual countdown appears on the Play child's screen. |
| 20 | `list_item_id` FK + generic `source_type`/`source_reference_id` on time_sessions | Dedicated FKs for tasks, widgets, and list items provide indexed performance. Generic source pair handles future attachment points without schema migration. Timer tracks anything. |
| 21 | Mom can edit any session timestamps with audit trail | Original timestamps preserved in JSONB. Edit reason optional. Supports SDS aide timesheet corrections and any "forgot to clock out" scenarios. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Alarms (one-time) | Post-MVP, bridges PRD-36 bubble UI + PRD-15 notification delivery |
| 2 | Recurring alarms/reminders | Post-MVP, bridges PRD-36 + PRD-15 + PRD-35 scheduler |
| 3 | Visual World themed timer animations | Post-MVP, requires PRD-24A Visual Worlds assets |
| 4 | Timer analytics/weekly reports | Post-MVP visualization enhancement |
| 5 | Timer sounds/haptics | Post-MVP UX enhancement |
| 6 | Smart Pomodoro (LiLa-adjusted intervals) | Post-MVP AI enhancement |
| 7 | Time comparison across siblings | Post-MVP, requires careful opt-in to avoid competition pressure |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-09A (Tasks) | Focus Timer fully specified. Task cards gain timer controls (clock in/out + Pomodoro buttons). Time threshold completion mode defined. Deferred #16 (configurable Pomodoro durations) resolved. | Update task card wireframes to include timer controls. Add time_tracking_enabled boolean to task configuration. Reference PRD-36 for Focus Timer implementation. |
| PRD-10 (Widgets) | Timer/Duration Logger widget (Type 14) now backed by `time_sessions` data. Tally accumulator widgets tracking hours can invoke the timer. | Update widget type 14 data source to reference `time_sessions`. Add [▶ Start] button spec for time-tracking widgets. |
| PRD-28 (Tracking & Financial) | Timer integration points fully defined. `time_session_completed` event drives homeschool time logs and business work earnings. Session editing triggers downstream recalculation. | No changes needed — PRD-28 already references PRD-36 as a dependency. Verify event consumption patterns match. |
| PRD-24 (Gamification) | Timer-triggered task completion feeds the gamification pipeline indirectly (through task completion events, not through timer events directly). | No changes needed. Verify gamification pipeline handles time-threshold-triggered completions the same as manual completions. |
| PRD-04 (Shell Routing) | Floating bubble is a new global overlay in the shell's overlay layer. Must render above page content but below modals. | Add timer bubble to shell overlay layer definition. Note z-index: above content, below modals, below full-screen overlays. |
| PRD-15 (Notifications) | Idle timer reminders and auto-pause notifications fire through PRD-15's delivery system. New notification types: `timer_idle_reminder`, `timer_auto_paused`. | Add notification types to PRD-15's notification type registry. |
| PRD-22 (Settings) | "Timer Settings" section added with family defaults and per-child configuration. | Add "Timer Settings" to Settings category navigation. |
| PRD-03 (Design System) | Visual timer animations (sand timer, hourglass, etc.) need formal design tokens for timing, colors, and theme integration. Floating bubble needs design spec (size, shadow, drag affordance). | Add timer animation tokens and bubble component spec to design system. |
| Build Order Source of Truth v2 | PRD-36 added as foundational component. Builds before or alongside PRD-09A. | Add PRD-36 to completed PRDs. Update remaining count. Note build order placement. |

---

*End of PRD-36*
