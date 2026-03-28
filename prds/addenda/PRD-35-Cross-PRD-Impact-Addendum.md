# PRD-35 Cross-PRD Impact Addendum: Universal Scheduler Component

**Created:** March 17, 2026
**Source PRD:** PRD-35 (Universal Scheduler Component)

---

## Purpose

This addendum documents all changes to existing PRDs required by the introduction of the Universal Scheduler Component. These changes will be reconciled by Claude Code in a single coordinated sweep during the pre-build audit, not piecemeal.

---

## Impacted PRDs

### PRD-02: Permissions & Access Control

| Section | Change | Details |
|---------|--------|---------|
| Data Schema: `shift_schedules` table | **REPLACED** by `access_schedules` | The simple `day_of_week` + `start_time` + `end_time` table is replaced by `access_schedules` with full RRULE JSONB `recurrence_data`, `schedule_type` enum ('recurring', 'custody', 'always_on'), and optional `start_time`/`end_time` for daily windows. See PRD-35 Data Schema. |
| Data Schema: `shift_sessions.started_by` enum | **ADD** value `'auto_custody'` | For sessions auto-created by custody schedule activation. |
| Screen 3: Special Adult Permission Config | **UPDATE** Section 3 (Shift Settings) | Replace the simple day/time schedule editor with the Universal Scheduler component (PRD-35). The scheduler renders inline within the Permission Hub configuration flow. Shift Schedule Configuration description updated to reference PRD-35. |
| Screen 3: Shift Schedule Configuration | **UPDATE** description | Remove: "mom sets recurring days/times (e.g., 'Tuesdays 3:00 PM – 6:00 PM')." Replace with: "mom configures access schedule using the Universal Scheduler (PRD-35), supporting simple recurring days/times, alternating weeks, custody patterns, seasonal blocks, and always-on access." |
| Screen 6: Special Adult Shift View | **UPDATE** forward note | Add: "Co-parents with `schedule_type = 'always_on'` or active custody window skip the shift start screen entirely. See PRD-27 for the complete co-parent experience." |
| Edge Cases: Special Adult Forgets to End Shift | **ADD** co-parent note | Add: "Co-parents with always-on access do not have shifts to forget. Activity logging is continuous and grouped by date." |
| Forward note (co-parent pattern) | **MARK** as fully wired | The forward note about co-parent pattern validation is now fully implemented via PRD-27 + PRD-35. |
| DATABASE_SCHEMA.md | **UPDATE** | Remove `shift_schedules` table. Add `access_schedules` table. Add `'auto_custody'` to `started_by` enum. |

### PRD-09A: Tasks, Routines & Opportunities

| Section | Change | Details |
|---------|--------|---------|
| Screen 3, Section 4: Schedule & Recurrence | **REPLACE** inline frequency selector | The current description of simple/custom/advanced frequency options is replaced by: "Section 4 embeds the Universal Scheduler component (PRD-35). The component handles all recurrence configuration including simple frequencies, custom intervals, yearly, alternating weeks, custody patterns, completion-dependent, and seasonal blocks. The scheduler's output is stored in `tasks.recurrence_details` as RRULE JSONB." |
| Screen 4: Routine Section Editor | **UPDATE** section frequency picker | "Section frequency uses the Universal Scheduler component in compact mode (`compactMode: true`). Compact mode shows day-of-week circles only (no advanced options, no calendar preview). Full scheduler available via an 'Advanced' link if needed." |
| Data Schema: `tasks.recurrence_rule` enum | **EXPAND** | Add values: `'yearly'`, `'completion_dependent'`, `'custody'`. These are for quick filtering only — the RRULE string in `recurrence_details` handles all complex patterns. |
| Data Schema: `tasks.recurrence_details` JSONB | **UPGRADE** format | Format upgraded from `{days: [], end_date, school_year_only, rotation}` to the full RRULE JSONB format defined in PRD-35: `{rrule, dtstart, until, count, exdates, rdates, timezone, schedule_type, completion_dependent, custody_pattern}`. Build migration converts existing simple patterns. Rotation data remains in the same JSONB (not displaced). |
| Data Schema: `task_template_sections.frequency_rule` enum | **EXPAND** | Add `'yearly'`, `'custom_interval'` for section-level frequency. Compact scheduler mode handles the UI. |
| Decision #7 (Fresh Reset default) | **NO CHANGE** | Fresh Reset and all incomplete action options remain exactly as defined. The Universal Scheduler handles "when," not "what happens when missed." |
| CLAUDE.md Additions | **ADD** | "Task Schedule & Recurrence (Section 4) uses the Universal Scheduler component (PRD-35). Never build a custom recurrence picker for tasks." |

### PRD-14B: Calendar

| Section | Change | Details |
|---------|--------|---------|
| Screen 2: Event Creation Form | **UPDATE** recurrence section | Replace the `🔁 Repeats: [None ▾]` dropdown with: "Recurrence configuration uses the Universal Scheduler component (PRD-35) embedded inline. Supports all frequency types including yearly, custom intervals, and completion-dependent." |
| Data Schema: `calendar_events.recurrence_details` JSONB | **UPGRADE** format | Same RRULE JSONB format upgrade as tasks. |
| Edge Cases: Recurring Event Conflicts | **ADD** note | "Edit this event only / this and future / all events" behavior maps to RRULE EXDATE (this only), RRULE split at date (this and future), or base RRULE modification (all). The Universal Scheduler handles the split mechanics via rrule.js." |
| Forward note (universal recurrence component) | **MARK** as fully wired | "A universal recurring/scheduling component should be harmonized across Tasks, Calendar, and Meetings" — this is now PRD-35. Remove the forward note. |

### PRD-16: Meetings

| Section | Change | Details |
|---------|--------|---------|
| Screen 6: Schedule Editor | **REPLACE** custom schedule form | Replace the entire schedule editor layout (frequency radios, preferred day/time, custom days, custom monthly) with: "The schedule editor embeds the Universal Scheduler component (PRD-35). The scheduler handles all recurrence configuration. Output stored in `meeting_schedules.recurrence_details` as RRULE JSONB." |
| Data Schema: `meeting_schedules.recurrence_rule` enum | **EXPAND** | Add `'yearly'`, `'custom_interval'`. |
| Data Schema: `meeting_schedules.recurrence_details` JSONB | **UPGRADE** format | Same RRULE JSONB format as tasks and calendar. |
| Decision #13 (Adopt PRD-09A's recurrence pattern) | **UPDATE** | Change to: "Adopts the Universal Scheduler component (PRD-35), which supersedes the PRD-09A inline pattern. All features share one component." |
| Forward note (universal recurrence component) | **MARK** as fully wired | Same as PRD-14B — the forward note is now resolved by PRD-35. |
| Deferred #1 (Universal recurrence UI component design) | **MARK** as resolved | "Separate design session to harmonize across Tasks, Calendar, and Meetings" — resolved by PRD-35. |

### PRD-18: Rhythms & Reflections

| Section | Change | Details |
|---------|--------|---------|
| Rhythm schedule configuration | **UPDATE** | Rhythm timing configuration uses the Universal Scheduler component (PRD-35). Reference PRD-35 for the recurrence picker UI and RRULE output format. |

### PRD-08: Journal + Smart Notepad

| Section | Change | Details |
|---------|--------|---------|
| Review & Route flow | **ADD** schedule extraction card type | When LiLa detects schedule-related content during Review & Route, it generates schedule extraction cards (defined in PRD-35 Screen 3). Each card shows the detected schedule, suggested destination (task/calendar/reminder), and options to edit, approve, skip, or queue. |
| Stubs | **ADD** | "LiLa schedule extraction cards in Review & Route" — wires to PRD-35 Screen 3. |

### PRD-17B: MindSweep

| Section | Change | Details |
|---------|--------|---------|
| MindSweep → Review & Route flow | **ADD** note | MindSweep brain dumps containing schedule-related items are parsed by LiLa during Review & Route using the schedule extraction pattern defined in PRD-35. No changes to MindSweep itself — the extraction happens downstream in Review & Route. |

---

## Migration Notes

### `recurrence_details` JSONB Migration

All tables with `recurrence_details` columns (`tasks`, `meeting_schedules`, `calendar_events`) need a migration that:

1. Reads existing simple format: `{days: ['mon','wed','fri'], end_date: '...', school_year_only: true}`
2. Converts to RRULE JSONB format: `{rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR', dtstart: '...', until: '...', exdates: [], rdates: [], timezone: '...', schedule_type: 'fixed'}`
3. Preserves rotation data in the same JSONB (rotation is task-specific, not scheduler-specific)
4. Backs up original data to `_legacy_recurrence` column (TEXT, nullable) for 90 days

### `shift_schedules` → `access_schedules` Migration

1. For each `shift_schedules` record, create an `access_schedules` record with:
   - `schedule_type = 'recurring'`
   - `recurrence_data` converted from simple day_of_week + times to RRULE JSONB
   - `start_time` and `end_time` preserved
2. Update all foreign key references from `shift_schedules` to `access_schedules`
3. Drop `shift_schedules` table after verification

---

## Summary

| PRD | Impact Level | Changes |
|-----|-------------|---------|
| PRD-02 | High | Table replaced, enum added, screens updated, forward note resolved |
| PRD-09A | High | Section 4 replaced by component, schema format upgraded, enums expanded |
| PRD-14B | Medium | Recurrence section replaced, schema upgraded, forward note resolved |
| PRD-16 | Medium | Schedule editor replaced, schema upgraded, forward note resolved, deferred item resolved |
| PRD-18 | Low | Reference added |
| PRD-08 | Low | Schedule extraction card type added to Review & Route |
| PRD-17B | Low | Note added about downstream extraction |

---

*End of PRD-35 Cross-PRD Impact Addendum*
