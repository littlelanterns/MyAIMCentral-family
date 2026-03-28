# PRD-36 Cross-PRD Impact Addendum

**Created:** March 17, 2026
**Session:** PRD-36 (Universal Timer)
**Purpose:** Documents how PRD-36 decisions affect prior PRDs.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- Task cards gain **timer controls** when `time_tracking_enabled = true` on the task configuration. Controls: [▶ Clock In], [🍅 Pomodoro], [⏸ Pause], [⏹ Done/Stop].
- **Focus Timer** (referenced in PRD-09A Section 7 and the prioritization views list) is now fully implemented by PRD-36. The Pomodoro view in PRD-09A selects a task; PRD-36 provides the timer engine and UI.
- **Time threshold completion mode** added: tasks can be configured to auto-complete (or become completable) when accumulated timer time reaches a configured minimum. This is a new option alongside existing completion modes.
- **Deferred item #16** ("Configurable Pomodoro timer durations") is now **resolved** by PRD-36's per-member Pomodoro configuration.
- `time_tracking_enabled` boolean should be added to task configuration (Section 6: Rewards & Tracking in the Task Creation Modal) as a toggle. When enabled, the timer controls appear on the task card.
- `time_threshold_minutes` field (optional) on tasks: when set and time tracking is enabled, the task becomes completable only after this many minutes of accumulated timer time.

**Action needed:**
- Add `time_tracking_enabled` (boolean, default false) and `time_threshold_minutes` (integer, nullable) to tasks table schema
- Update task card wireframe description to include timer control states (not running, running, Pomodoro)
- Update Section 6 (Rewards & Tracking) in Task Creation Modal to include "Track Time" toggle and optional threshold
- Mark Deferred #16 as resolved by PRD-36
- Note that Focus Timer view invokes PRD-36's Pomodoro mode on the selected task

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**
- **Timer / Duration Logger widget** (Type 14 in Widget Template Catalog) now has its data source fully defined: `time_sessions` records linked via `widget_id`. The widget's [▶ Start] button invokes PRD-36's clock mode.
- **Tally accumulator widgets** tracking time units (hours, minutes) can optionally have a [▶ Start] button that creates a `time_sessions` record linked via `widget_id`. Session completion auto-adds the duration to the Tally's accumulated value.
- Visual variants 14a (Stopwatch + Bar), 14b (Clock Fill), 14c (Time Bar Chart) all consume `time_sessions` data for their displays.

**Action needed:**
- Update Type 14 data source documentation to reference `time_sessions` table
- Add `widget_id` as a linkage point for timer sessions in the widget configuration spec
- Note that Tally widgets with time units can optionally invoke the timer

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- **Floating timer bubble** is a new global overlay in the shell's overlay layer. It must render:
  - Above page content and the QuickTasks strip
  - Below modals and bottom sheets
  - Below full-screen overlays (gamification celebrations, DailyCelebration)
- The bubble is persistent across all page navigation — it is rendered at the shell level, not the page level
- The bubble is draggable and remembers position per session (client-side state)
- When no timers are active, the bubble is hidden (or shows as a minimal icon — configurable)

**Action needed:**
- Add timer bubble to the shell overlay layer z-index hierarchy: page content < QuickTasks < **timer bubble** < bottom sheets < modals < full-screen overlays
- Note that the bubble component is rendered once at the shell level, not re-rendered per page

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- Two new notification types for timer events:
  - `timer_idle_reminder` — "Your [task name] timer has been running for [X] hours. Still working?"
  - `timer_auto_paused` — "Your [task name] timer was auto-paused after [X] hours."
- These notifications use PRD-15's delivery system (push notification, in-app notification badge)
- Mom's notification preferences should include timer reminders as a configurable category (enabled by default)

**Action needed:**
- Add `timer_idle_reminder` and `timer_auto_paused` to notification type registry
- Add "Timer Reminders" category to notification preferences

---

## Impact on PRD-22 (Settings)

**What changed:**
- **"Timer Settings"** section added to Settings with:
  - Family defaults (idle reminder timing, auto-pause, repeat reminders)
  - Per-child configuration (timer visibility, Pomodoro defaults, standalone timer permission, visual timer style)
- This section appears in the Settings category navigation for Mom

**Action needed:**
- Add "Timer Settings" to Settings category list
- Note that per-child timer config follows the same pattern as gamification config (PRD-24) and allowance config (PRD-28) — one card per child, tap to configure

---

## Impact on PRD-03 (Design System & Themes)

**What changed:**
- **Floating bubble component** needs formal design spec:
  - Size: ~48px diameter default, expandable to mini panel
  - Shadow: elevated shadow token (same tier as FABs)
  - Background: theme-aware (uses surface token with slight transparency)
  - Drag affordance: subtle grab cursor, smooth animation on drag
  - Snap behavior: snaps to screen edges with 8px inset
- **Visual timer animations** need design tokens:
  - Sand timer, hourglass, filling jar, melting ice cream, growing flower
  - Each animation runs as CSS/SVG (not pre-rendered video)
  - Color-aware: uses theme accent tokens
  - Size: fills the Play mode task card timer area (~120px × 120px)
- **Pulse animation** for active timer on the bubble (subtle scale pulse, 2-second period)

**Action needed:**
- Add floating bubble component to the component library spec
- Add visual timer animation tokens to the Animations section
- Define pulse animation token for active timer indication

---

## Impact on PRD-24 (Gamification)

**What changed:**
- Timer-triggered task completions (time threshold reached) flow through the same task completion event that all other completions use. The gamification pipeline does not need to know or care that the completion was timer-triggered vs. manual.
- Visual World themed timer animations are a Post-MVP stub: when a child has an active Visual World, the visual timer style adapts to match (e.g., hourglass becomes a crystal ball in the Wizard's Tower world).

**Action needed:**
- No schema or logic changes. Verify that `time_threshold_reached` completions fire the same `task_completed` event that manual completions fire.
- Note the Post-MVP stub for Visual World themed timer animations in PRD-24A.

---

## Impact on PRD-28 (Tracking, Allowance & Financial)

**What changed:**
- PRD-36 is now fully specified — the dependency PRD-28 references is delivered.
- The `time_session_completed` event is the integration point PRD-28 consumes for:
  - Homeschool time log creation (session on homeschool-tagged task → `homeschool_time_logs` records)
  - Business work earnings calculation (session on hourly-rate opportunity → `duration_minutes × hourly_rate`)
- Session editing in PRD-36 triggers downstream recalculation in PRD-28 (re-run affected homeschool logs and financial transactions with updated duration)
- The Log Learning modal's [Use Timer ▶] button invokes PRD-36's clock mode, creating a session linked to the learning entry being created

**Action needed:**
- No changes needed to PRD-28. Verify event consumption patterns match PRD-36's `time_session_completed` event shape.
- Verify that PRD-28's recalculation logic handles session edits and soft deletes from PRD-36.

---

## Impact on Build Order Source of Truth v2

**What changed:**
- PRD-36 (Universal Timer) is now written
- PRD-36 is NUMBER LOCKED (referenced by PRD-28)
- Build order placement: PRD-36 should build before or alongside PRD-09A (Tasks), since tasks with time tracking need the timer component

**Action needed:**
- Move PRD-36 from "Remaining PRDs" to "Completed PRDs" section
- Add to Foundation PRDs or create a new "Infrastructure Components" category alongside PRD-35
- Update locked numbers: "PRD-27, PRD-28, PRD-36"
- Update Summary: Remaining PRDs decremented by 1 (PRD-28 was also completed this session — decrement by 2 total)

---

*End of PRD-36 Cross-PRD Impact Addendum*
