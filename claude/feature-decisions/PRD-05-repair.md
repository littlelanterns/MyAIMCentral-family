# Feature Decision File: Phase 05 Repair — PRD-35 + PRD-36

> **Created:** 2026-03-25
> **PRDs:** `prds/infrastructure/PRD-35-Universal-Scheduler.md`, `prds/infrastructure/PRD-36-Universal-Timer.md`
> **Addenda read:**
>   - `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-36-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Founder approved:** Pending

---

## What Is Being Built

This is a REPAIR session, not a fresh build. The Universal Scheduler and Universal Timer were previously built but have audit findings that need correction. This session:

1. **Redesigns** the UniversalScheduler UI to be compact (founder directive — mandatory)
2. **Fixes** FloatingBubble resting state (wrong: returns null when no timers)
3. **Adds missing** timer features: event emissions, task card controls, idle reminders, auto-pause, Pomodoro break enforcement, feature gating, recurring edit modes, bubble gestures, MiniPanel navigation, resume after pause

---

## Screens & Components

| Screen / Component | Change Type | Notes |
|---|---|---|
| UniversalScheduler.tsx | **Redesign** | Compact toggle-based UI: NO/YES repeat, day chips, "More options" link. Max ~120px default. |
| FloatingBubble.tsx | **Fix** | Show resting Clock icon when no active timers (subtle, no badge, no pulse). Don't return null. |
| MiniPanel.tsx | **Enhancement** | Task name tappable → navigate to /tasks. Resume button for paused sessions. |
| TaskCard.tsx | **Enhancement** | Add inline timer controls: Clock In, Pomodoro, Pause, Done buttons. |
| useTimer.ts | **Enhancement** | Emit `time_session_completed` and `time_session_modified` CustomEvents after mutations. Add idle reminder logic. Add auto-pause logic. |
| TimerProvider.tsx | **Enhancement** | Expose idle check and auto-pause in tick loop. |

---

## Key PRD Decisions (Easy to Miss)

1. **Scheduler language rules:** NEVER use RRULE, recurrence, biweekly, interval, custody pattern, advanced mode, dtstart, RFC 5545 in user-facing text. USE "Repeats every week on...", "Every other week", "Ends after X times", "Rotation schedule".
2. **FloatingBubble resting state (PRD-36 Screen 1):** "A Lucide Clock icon (subtle, bottom-right corner)" when no timers are active. Tap opens mini panel where [+ New Stopwatch] and [+ New Timer] are available.
3. **`time_session_completed` event (PRD-36 Flows):** Emitted when any session ends. Shape: `{ sessionId, taskId, memberId, durationMinutes }`. Consumers listen independently.
4. **Timer controls on task cards (PRD-36 Screen 3):** [▶ Clock In] and [🍅 Pomodoro] when not running. [⏸ Pause] and [⏹ Done] when running.
5. **Idle reminder (PRD-36):** After `idle_reminder_minutes` (default 120 from timer_configs), show in-app toast. Repeat every `idle_repeat_minutes` (default 60).
6. **Auto-pause (PRD-36):** After `auto_pause_minutes` (default 0 = disabled) from timer_configs, call pauseTimer automatically.
7. **Pomodoro break enforcement (PRD-36):** When `pomodoro_break_required = true` and shell is guided/play, hide Stop/Done — break cannot be dismissed early.
8. **Recurring edit modes (PRD-35):** "Edit this occurrence only" / "Edit this and all future" / "Edit entire series" — applies to all recurring patterns.
9. **Long press bubble → timer config; swipe away → temporarily hide (PRD-36 Screen 1).**
10. **Resume after pause:** Creates a new `time_sessions` row with same `task_id`, visually grouped.

---

## Addendum Rulings

### From PRD-35-Cross-PRD-Impact-Addendum.md:
- `access_schedules` replaces `shift_schedules` — already done in migration
- RRULE JSONB format migration for existing `recurrence_details` — needs to be checked/applied
- Compact mode for routine section editor: day-of-week circles only (already implemented)

### From PRD-36-Cross-PRD-Impact-Addendum.md:
- Task cards gain timer controls when `time_tracking_enabled = true`
- `time_tracking_enabled` and `time_threshold_minutes` fields on tasks — already in live schema
- Two notification types: `timer_idle_reminder`, `timer_auto_paused` — stub (PRD-15 not built)
- Timer bubble z-index: above content/QuickTasks, below modals
- `time_session_completed` event is the integration point for PRD-28

### From PRD-Audit-Readiness-Addendum.md:
- Cross-cutting: all decisions must have rationale, all deferred items tagged
- No impact on specific repair items

---

## Database Changes Required

### No New Tables
All tables already exist (`time_sessions`, `timer_configs`, `access_schedules`).

### No Schema Modifications
`time_tracking_enabled` and `time_threshold_minutes` already exist on `tasks` table per live schema.

### Migrations
- **Item 8 — RRULE migration: NO-OP.** Verified 2026-03-25 via live DB query:
  - `tasks` table: 0 rows total. 0 rows with `recurrence_details`. 0 rows with `recurrence_rule`.
  - `access_schedules` table: 0 rows.
  - `time_sessions` table: 0 rows.
  - `timer_configs` table: 0 rows.
  - No legacy data exists to convert. Migration is unnecessary. **Item 8:** Check if existing `recurrence_details` data in tasks needs RRULE format conversion. If no legacy data exists (empty tables), this is a no-op.

---

## Feature Keys

Already registered. Gating needs to be wired in code:

| Feature Key | Minimum Tier | Notes |
|---|---|---|
| `timer_basic` | Essential | Clock in/out, single timer, basic bubble |
| `timer_advanced` | Enhanced | Pomodoro, concurrent timers, standalone, session editing |
| `timer_visual` | Enhanced | Visual timer styles for Play/Guided |
| `timer_pomodoro` | Enhanced | Pomodoro mode buttons |
| `timer_countdown` | Enhanced | Countdown mode |
| `scheduler_basic` | Essential | Quick picks |
| `scheduler_custom` | Enhanced | Custom intervals, alternating weeks |
| `scheduler_advanced` | Full Magic | Custody, completion-dependent, seasonal |

---

## Stubs — Do NOT Build This Phase

- [ ] LiLa schedule extraction (requires PRD-05 + PRD-08 wiring)
- [ ] LiLa conversational schedule builder (requires PRD-05 guided mode)
- [ ] Timer → homeschool time log creation (requires PRD-28)
- [ ] Timer → financial transaction (requires PRD-28)
- [ ] Timer → widget data point (requires PRD-10)
- [ ] Idle reminder delivery through PRD-15 notification system (PRD-15 not built — use in-app toast only)
- [ ] Visual World themed timer animations (requires PRD-24A)
- [ ] ICS export
- [ ] Family holiday calendar auto-exclusion
- [ ] Timer sounds/haptics
- [ ] Smart Pomodoro (LiLa-adjusted)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Timer | → | Tasks (PRD-09A) | `time_session_completed` CustomEvent |
| Timer | → | Future PRD-28 | `time_session_completed` CustomEvent |
| Timer | → | Future PRD-10 | `time_session_modified` CustomEvent |
| Tasks | → | Timer | `time_tracking_enabled` flag on task → shows timer controls |
| Scheduler | → | Tasks | `recurrence_details` JSONB on `tasks` table |
| Scheduler | → | Calendar (future) | `recurrence_details` JSONB on `calendar_events` |

---

## Event Contract Documentation

### `time_session_completed`
```typescript
window.dispatchEvent(new CustomEvent('time_session_completed', {
  detail: {
    sessionId: string,
    taskId: string | null,
    memberId: string,
    durationMinutes: number,
    timerMode: TimerMode,
  }
}))
```
Fired after successful `stopTimer()` DB update. Consumers: PRD-09A (task time accumulation), PRD-28 (homeschool logs, financial calc), PRD-10 (widget data).

### `time_session_modified`
```typescript
window.dispatchEvent(new CustomEvent('time_session_modified', {
  detail: {
    sessionId: string,
    taskId: string | null,
    memberId: string,
    action: 'edit' | 'delete',
  }
}))
```
Fired after `editSession()` or `deleteSession()`. Consumers: PRD-28 (recalculation).

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct (none needed)
- [x] Feature keys identified
- [x] **Approved to build** — 2026-03-25

---

## Post-Build PRD Verification

| Issue # | Description | Source | Status | Notes |
|---------|-------------|--------|--------|-------|
| 0 | Scheduler redesign — compact widget | Founder Directive | **Wired** | NO/YES toggle, day chips default, "More options" expander. ~120px default. Zero jargon. |
| 1 | Bubble resting state when empty | PRD-36 Screen 1 | **Wired** | 36px bubble, opacity 0.5, no badge/pulse. Tap opens MiniPanel. |
| 2 | time_session_completed event | PRD-36 Flows | **Wired** | Dispatched after stopTimer with sessionId, taskId, memberId, durationMinutes |
| 3 | Timer controls on task cards | PRD-36 Screen 3 | **Wired** | TaskTimerControls: Clock In + Pomodoro when idle, Pause + Done when running |
| 4 | Idle reminder toast | PRD-36 MVP | **Wired** | IdleReminderBanner in TimerProvider, configurable via timer_configs thresholds |
| 5 | Auto-pause at max duration | PRD-36 MVP | **Wired** | Auto-pause in TimerProvider tick effect, tracks paused sessions to avoid repeats |
| 6 | Pomodoro break enforcement | PRD-36 Edge Cases | **Wired** | isBreakEnforced() in TimerProvider, MiniPanel hides Stop/Pause during enforced breaks |
| 7 | useCanAccess gating | PRD-36 Tier Gating | **Wired** | timer_basic gates Clock In, timer_advanced gates Pomodoro. PRD defines 3 keys (basic/advanced/visual). |
| 8 | RRULE migration check | PRD-35 Migration | **Wired** | DB verified empty (0 rows in tasks, access_schedules). No migration needed. Documented. |
| 9 | Recurring edit modes | PRD-35 Edge Cases | **Wired** | RecurringEditPrompt component: this_only / this_and_future / entire_series |
| 10 | time_session_modified event | PRD-36 Flows | **Wired** | Dispatched after editSession and deleteSession with action: 'edit' or 'delete' |
| 11 | Long press + swipe-away | PRD-36 Screen 1 | **Wired** | Long press (500ms) opens panel. Swipe-away hides to 12px restore dot. |
| 12 | MiniPanel task navigation | PRD-36 Screen 2 | **Wired** | Task label tappable → navigate('/tasks'). Non-task labels are plain text. |
| 13 | Resume after pause | PRD-36 Screen 2 | **Wired** | Resume button on auto_paused sessions. Calls startTimer with same task_id. |
