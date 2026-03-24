# Build Prompt 05: Universal Scheduler & Timer

## PRD References
- PRD-35: `prds/infrastructure/PRD-35-Universal-Scheduler.md`
- PRD-36: `prds/infrastructure/PRD-36-Universal-Timer.md`
- PRD-35 Addendum: `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md`
- PRD-36 Addendum: `prds/addenda/PRD-36-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 04 (Shell Routing) complete

## Objective
Build two reusable infrastructure components: UniversalScheduler (RRULE-based scheduling) and UniversalTimer (clock/pomodoro/stopwatch/countdown with floating bubble).

## Database Work
Create tables:
- `access_schedules` — Special adult/co-parent access windows (replaces shift_schedules)
- `time_sessions` — Individual timer sessions with timestamps, mode, attachments
- `timer_configs` — Per-member timer configuration

## Component Work
### UniversalScheduler
- `<UniversalScheduler />` component with progressive disclosure
- Quick Picks → Custom → More Options
- Calendar preview (navigable month, RDATE/EXDATE fine-tuning)
- Frequency types: one-time, daily, weekly, monthly, yearly, custom
- Advanced: alternating weeks, custody patterns, seasonal, completion-dependent
- Custody pattern tappable day grid
- Output: RRULE JSONB (rrule, dtstart, until, count, exdates, rdates, timezone)
- Time optional by default (consumer-controlled via showTimeDefault prop)

### UniversalTimer
- Floating draggable bubble (global overlay, persistent across navigation)
- 4 modes: clock, pomodoro, stopwatch, countdown
- Multiple concurrent timers
- Idle reminders (configurable, default 2 hours)
- Play mode visual timers (5 styles: sand, hourglass, thermometer, arc, jar)
- Play mode age gate ("How old are you?" → 18+ unlocks, <18 redirect)
- Mom quick-start countdown for Play mode
- Session editing (timestamps with audit trail)
- `time_session_completed` event emission

## Tier Gating
- scheduler_basic (Essential): quick picks only
- scheduler_custom (Enhanced): custom intervals, alternating weeks
- scheduler_advanced (Full Magic): custody, completion-dependent, seasonal
- timer_basic (Essential): clock in/out, single timer
- timer_advanced (Enhanced): pomodoro, concurrent, standalone
- timer_visual (Enhanced): visual timer styles

## Testing Checklist
- [ ] RRULE output format matches spec
- [ ] Calendar preview highlights correct dates
- [ ] Custody pattern grid works
- [ ] Timer floats above content, draggable
- [ ] Multiple concurrent timers work
- [ ] Timer persists across navigation
- [ ] Play mode visual timers render correctly
- [ ] Idle reminder fires after configured interval
- [ ] Session timestamps are server-side

## Definition of Done
- Both components fully reusable by consuming features
- RRULE output validated against rrule.js library
- Timer sessions logged to database
