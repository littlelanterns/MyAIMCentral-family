> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-35: Universal Scheduler Component

**Status:** Not Started
**Dependencies:** None (foundational infrastructure consumed by PRD-09A, PRD-14B, PRD-16, PRD-18, PRD-02/27)
**Created:** March 17, 2026
**Last Updated:** March 17, 2026

---

## Overview

The Universal Scheduler is a shared UI component and data model for configuring when anything in MyAIM Family recurs. Every feature that involves scheduling — tasks, routines, calendar events, meetings, rhythms, caregiver shifts, custody access windows — uses this one component instead of building its own recurrence picker.

> **Mom experience goal:** "I set it once and it just works — whether it's a daily chore, a custody schedule, or flea medicine every 60 days."

The component follows a progressive disclosure philosophy: the most common scheduling patterns (daily, weekly on certain days, monthly) are immediately visible with minimal taps. Custom intervals, alternating weeks, custody patterns, seasonal blocks, and completion-dependent scheduling are available under expandable sections. The full power is always accessible, but never overwhelming.

The technical foundation is RFC 5545 (iCalendar RRULE standard), implemented via the rrule.js library. This means every schedule in MyAIM stores as a standards-compliant RRULE string, making future calendar export (ICS) trivially possible.

---

## User Stories

### Scheduling Common Patterns
- As a mom, I want to schedule a chore for Tu/W/Th/F by tapping four day circles so I don't have to navigate complex menus for simple weekly patterns.
- As a mom, I want to set "every 3 months on the 17th" for flea medicine without having to think about what "custom" means.
- As a mom, I want to schedule "every May" for Ruthie's annual blood test without typing a date — just pick the month and the day.

### Scheduling Complex Patterns
- As a mom, I want to set up my custody schedule (2-2-3 rotation) once and have it automatically determine when the co-parent has access to the kids' data.
- As a mom, I want to schedule "1st Tuesday, 2nd Thursday, 3rd Wednesday, 4th Friday" for a women's lunch group using "+ Add another" rows.
- As a mom, I want to set "every 90 days from when I actually gave the flea medicine" so the next dose shifts based on real completion, not a fixed calendar date.
- As a mom, I want to set a due window of "57-63 days" for the dog's vet appointment so it shows up early and escalates if I miss the ideal window.

### Verification & Exceptions
- As a mom, I want to see a mini calendar preview showing exactly which dates are highlighted before I save, so I can verify complex patterns are correct.
- As a mom, I want to skip specific dates (holidays, vacations) without changing the overall schedule.
- As a mom, I want a "school-year only" toggle that automatically pauses scheduling during summer break.

### Bulk Scheduling (LiLa Integration)
- As a mom, I want to brain-dump "Ruthie blood test every May, flea medicine every 3 months, women's lunch 1st and 3rd Tuesdays, change HVAC filter every 90 days" into the Notepad, hit Review & Route, and have LiLa parse each one into a scheduled item I can approve or edit.

---

## Screens

### Screen 1: Universal Scheduler Component (Inline)

This is a reusable component embedded within other features' creation/edit flows. It is NOT a standalone page. It appears inside the Task Creation Modal (PRD-09A Section 4), Calendar Event Creator (PRD-14B), Meeting Schedule Editor (PRD-16 Screen 6), Rhythm Configuration (PRD-18), Caregiver Access Schedule (PRD-27), and any future feature that needs recurrence.

**Layout — Tier 1 (Quick Picks, always visible):**

```
┌─────────────────────────────────────────────────┐
│  HOW OFTEN?                                      │
│  [One-time] [Daily] [Weekly●] [Monthly]          │
│  [Yearly] [Custom]                               │
│  ─────────────────────────────────────────────── │
│  REPEAT ON                                       │
│  (Su) (M) (Tu●) (W●) (Th●) (F●) (Sa)           │
│  ─────────────────────────────────────────────── │
│  [+ Add time]                                    │
│  ─────────────────────────────────────────────── │
│  SCHEDULE UNTIL  [Ongoing ▾]                     │
│  ─────────────────────────────────────────────── │
│  ▼ View on calendar                              │
└─────────────────────────────────────────────────┘
```

**Frequency buttons:** One-time, Daily, Weekly, Monthly, Yearly, Custom. Pill-shaped, Sage Teal border, Dark Teal text. Active state fills with Sage Teal, text stays Dark Teal for contrast.

**Each frequency reveals its own configuration section:**

**One-time:**
- Date picker
- [+ Add time] button

**Daily:**
- [+ Add time] button
- (That's it — daily is daily)

**Weekly:**
- Day-of-week circles: Su M Tu W Th F Sa (tap to toggle, multi-select)
- [+ Add time] button

**Monthly:**
- Radio: "Recurring weekday" or "Recurring date"
- Recurring weekday: ordinal dropdown (1st/2nd/3rd/4th/Last) + weekday dropdown. **[+ Add another weekday]** button adds additional rows. Each extra row has an × remove button. Supports unlimited rows (1st Tuesday AND 2nd Thursday AND 3rd Wednesday AND 4th Friday).
- Recurring date: date dropdown (1st through 31st, Last). **[+ Add another date]** button adds additional date rows. Supports unlimited rows (4th, 17th, 20th, 23rd of each month).
- [+ Add time] button

**Yearly:**
- Month pills: Jan through Dec (tap to toggle, multi-select — can pick multiple months)
- "On which day?" — Radio: "Specific date" (date dropdown) or "Specific weekday" (ordinal + weekday dropdowns)
- Same [+ Add another] pattern for multiple dates/weekdays within the selected months
- [+ Add time] button

**Custom:**
- "Every [number input] [days/weeks/months/years dropdown]"
- When unit = days or weeks: day-of-week circles appear (same as Weekly)
- When unit = months or years: "On which day?" section appears (same as Monthly — date or weekday with + Add another)
- [+ Add time] button
- Divider
- **▼ More scheduling options** (expandable — Tier 2)

**Layout — Tier 2 (More Scheduling Options, under Custom):**

```
┌─────────────────────────────────────────────────┐
│  ▼ More scheduling options                       │
│  ─────────────────────────────────────────────── │
│  ○ Alternating weeks                             │
│  ○ Multi-week pattern                            │
│  ○ Seasonal / date range                         │
│  ○ Completion-dependent                          │
│  ─────────────────────────────────────────────── │
│  EXCEPTIONS                                      │
│  [date picker] [+ Skip date]                     │
│  ☐ School-year only                              │
└─────────────────────────────────────────────────┘
```

**Alternating weeks:**
- Hint text: "Set which days belong to Week A vs Week B. Repeats every 2 weeks from the anchor date."
- Anchor date picker ("Starts [date]")
- Week A: day-of-week circles
- Week B: day-of-week circles

**Multi-week pattern (custody):**
- Hint text: "For custody schedules and complex rotations. Pick a preset or tap days to switch."
- Preset buttons (Golden Honey accent): 2-2-3, 5-2-5-2, Week on/off, Build my own
- Tappable day grid showing the pattern (2 rows for a 14-day cycle). Each cell shows "Mom" or "Co" and is tappable to toggle. Colors: Sage Teal for Mom, Vintage Plum for Co-parent.
- Day header row (Su M Tu W Th F Sa) above the grid
- Legend: ■ Mom ■ Co-parent
- Anchor date picker ("Pattern starts [date]")
- Expandable "Longer patterns" section for 21-day or 28-day cycles (adds more rows to the grid)

**Seasonal / date range:**
- "From [date] to [date]"
- ☐ Repeats every year
- [+ Add another range] for multiple seasonal blocks (e.g., summer + winter break)

**Completion-dependent:**
- Hint text: "Next occurrence calculated from when you actually complete this item, not a fixed calendar date."
- "Every [number] [days/weeks/months] after last completion"
- Due window toggle: ☐ "Allow a due window"
  - When checked: "Due between [number] and [number] [days/weeks/months] after completion"
  - Item surfaces at the start of the window, escalates as it approaches the end
- Note: "First occurrence starts from [date picker or 'today']"

> **Decision rationale:** Completion-dependent scheduling is a separate radio option under "More scheduling options" rather than a toggle on all frequencies because it fundamentally changes how instances are generated (event-driven vs. calendar-driven). Mixing the two mental models in one interface would be confusing.

**Exceptions section (always visible under Tier 2):**
- Date picker + [+ Skip date] button. Each skipped date appears as a removable pill.
- ☐ School-year only toggle
- Future: link to family holiday calendar for auto-exclusions (post-MVP)

**Time handling:**
- Time is OPTIONAL by default. Every frequency shows a [+ Add time] dashed button.
- Tapping [+ Add time] reveals a time picker input + a "remove" link.
- The consuming feature passes a `showTimeDefault` prop: Calendar/Meetings/Shifts show the time picker by default. Tasks/Routines hide it by default.

**Schedule Until (always visible, bottom of component):**
- Dropdown: Ongoing (default), Specific date, After X times
- "Specific date" reveals a date picker
- "After X times" reveals a number input ("After [10] times")

### Screen 2: Calendar Preview (Collapsible)

**What the user sees:**

A collapsible mini calendar at the bottom of the scheduler component. Header shows "▼ View on calendar" — tapping opens a navigable month view.

```
┌─────────────────────────────────────────────────┐
│  ← March 2026 →                                 │
│  Su  M  Tu  W  Th  F  Sa                        │
│   1   2   3   4   5   6   7                      │
│   8   9  10  11  12  13  14                      │
│  15  16 •17• 18  19 •20• 21                      │
│  22  23  24  25  26  27  28                      │
│  29  30  31                                      │
└─────────────────────────────────────────────────┘
```

- Navigate to any month/year with arrow buttons
- Highlighted days (Sage Teal fill) reflect the configured schedule
- "Today" has a Golden Honey border ring
- Skipped/exception dates show with a strikethrough or dimmed highlight
- For custody patterns: days alternate between Mom color and Co-parent color
- For completion-dependent: shows predicted dates based on the anchor/start date
- For due windows: highlighted days show a gradient or range indicator

**Tap interaction:** Tapping a highlighted day un-highlights it (adds to EXDATE). Tapping an un-highlighted day highlights it (adds to RDATE). This allows manual fine-tuning of any pattern.

**Data flow:** The calendar preview reads the current RRULE + EXDATE + RDATE state in real-time. Any change to the frequency, days, or exceptions immediately re-renders the preview.

### Screen 3: LiLa Schedule Extraction (Review & Route Integration)

> **Depends on:** Review & Route pipeline — PRD-08. LiLa extraction — PRD-05.

**What happens:**

When a user brain-dumps multiple schedulable items into Notepad and triggers Review & Route, LiLa parses each item and extracts schedule information.

**LiLa extraction output per item:**
```json
{
  "title": "Dog flea medicine",
  "detected_schedule": {
    "type": "completion_dependent",
    "interval": 90,
    "unit": "days",
    "window_start": 57,
    "window_end": 63,
    "confidence": 0.85
  },
  "suggested_destination": "task",
  "raw_text": "flea medicine every 60-90 days from last dose"
}
```

**Review card layout (within Review & Route):**

```
┌─────────────────────────────────────────────────┐
│  Dog flea medicine                               │
│  📅 Every 90 days after completion (57-63 day    │
│     window)                                      │
│  → Task                                          │
│  [Edit schedule] [Change destination ▾]          │
│  [✓ Approve] [✗ Skip] [→ Queue for later]       │
└─────────────────────────────────────────────────┘
```

- [Edit schedule] opens the Universal Scheduler component inline with the detected values pre-populated
- [Change destination] dropdown: Task, Calendar Event, Reminder (lightweight task)
- [✓ Approve] creates the item with the detected schedule
- [→ Queue for later] sends to Studio Queue for manual configuration later
- Low-confidence extractions (< 0.7) show a warning indicator and default to "Queue for later"

**Batch approval:** A "Approve All" button at the top approves all high-confidence items in one tap. Items needing attention remain as individual cards.

---

## Visibility & Permissions

The scheduler component inherits permissions from its parent feature. It has no standalone access control.

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Can configure any schedule for any family member or feature. |
| Dad / Additional Adult | Scoped | Can configure schedules for features mom has granted permission to. |
| Special Adult | None | Cannot configure schedules. Mom configures their access schedules. |
| Independent (Teen) | Scoped | Can configure schedules on own tasks/events if permitted by mom. |
| Guided / Play | None | Mom configures all schedules for these members. |

---

## Data Schema

### RRULE Storage Pattern (No New Tables)

The Universal Scheduler does not create its own table. It outputs a structured JSONB object that consuming features store in their existing columns. The existing `recurrence_rule` + `recurrence_details` pattern on `tasks`, `meeting_schedules`, `calendar_events`, and `shift_schedules` is upgraded to this format.

**Standard output format:**

```json
{
  "rrule": "FREQ=WEEKLY;BYDAY=TU,WE,TH,FR",
  "dtstart": "2026-03-17T00:00:00Z",
  "until": null,
  "count": null,
  "exdates": ["2026-12-25", "2026-07-04"],
  "rdates": ["2026-03-20"],
  "timezone": "America/Chicago",
  "schedule_type": "fixed",
  "completion_dependent": null,
  "custody_pattern": null
}
```

**Completion-dependent extension:**

```json
{
  "rrule": null,
  "schedule_type": "completion_dependent",
  "completion_dependent": {
    "interval": 90,
    "unit": "days",
    "window_start": 57,
    "window_end": 63,
    "anchor_date": "2026-03-17"
  }
}
```

**Custody pattern extension:**

```json
{
  "rrule": null,
  "schedule_type": "custody",
  "custody_pattern": {
    "pattern": ["A","A","B","B","A","A","A","B","B","A","A","B","B","B"],
    "anchor_date": "2026-03-20",
    "labels": {"A": "Mom", "B": "Co-parent"}
  }
}
```

### Table Modifications (Existing Tables)

**`tasks` table — `recurrence_details` JSONB column:**
Existing column. Format upgraded from the simple `{days: [], end_date, school_year_only, rotation}` pattern to the full RRULE JSONB format above. Backward-compatible: the build migration converts existing simple patterns to RRULE format.

**`shift_schedules` table — REPLACED:**
The existing `shift_schedules` table (PRD-02) with its simple `day_of_week` + `start_time` + `end_time` columns is replaced by the `access_schedules` table:

### Table: `access_schedules`

Replaces `shift_schedules`. Stores recurrence-based access windows for Special Adults and co-parents using the Universal Scheduler output format.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| special_adult_id | UUID | | NOT NULL | FK → family_members |
| schedule_name | TEXT | | NULL | Optional label ("Custody Schedule", "Tuesday Babysitting") |
| schedule_type | TEXT | 'recurring' | NOT NULL | Enum: 'recurring', 'custody', 'always_on' |
| recurrence_data | JSONB | '{}' | NOT NULL | Full RRULE JSONB format from Universal Scheduler |
| start_time | TIME | | NULL | Daily access window start (NULL = all day) |
| end_time | TIME | | NULL | Daily access window end (NULL = all day) |
| is_active | BOOLEAN | true | NOT NULL | Can be paused without deleting |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD. Special adult can read their own schedules.

**Indexes:**
- `(special_adult_id, is_active)` — "active schedules for this person"
- `(family_id, schedule_type)` — filter by type

> **Decision rationale:** `always_on` is a schedule_type rather than a boolean because it simplifies the access-check query: if schedule_type = 'always_on', access is always granted. No RRULE evaluation needed. Co-parents with no shift UI get this type.

### Enum Updates

**`recurrence_rule` enum on `tasks` table:** Expanded from `'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom'` to include `'yearly', 'completion_dependent', 'custody'`. The RRULE string in `recurrence_details` handles all complex patterns; this enum is for quick filtering only.

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-09A: Task Creation Modal (Section 4) | Universal Scheduler component replaces the current inline frequency selector. Output stored in `tasks.recurrence_details`. |
| PRD-14B: Calendar Event Creator | Universal Scheduler replaces the recurrence dropdown. Output stored in `calendar_events.recurrence_details`. |
| PRD-16: Meeting Schedule Editor (Screen 6) | Universal Scheduler replaces the schedule form. Output stored in `meeting_schedules.recurrence_details`. |
| PRD-18: Rhythm Configuration | Universal Scheduler handles rhythm timing. |
| PRD-27: Caregiver Access Schedule | Universal Scheduler configures when co-parents/caregivers have access. Output stored in `access_schedules.recurrence_data`. |
| PRD-09A: Routine Section Editor | Compact variant of Universal Scheduler for per-section frequency (day-of-week only, no advanced options). |
| PRD-08: Review & Route (LiLa extraction) | LiLa parses schedule intent from text, outputs pre-populated scheduler values. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| rrule.js instance generator | All consuming features call `rruleFromJSON(recurrence_details)` to expand dates on demand. Never pre-generate. |
| Calendar preview | Component reads current state, generates next N instances via rrule.js, highlights on mini calendar. |
| Notification/reminder system | Future PRD-15 enhancement: reads `recurrence_details` to calculate reminder timing. |
| ICS export (post-MVP) | RRULE strings are directly ICS-compatible. |

---

## AI Integration

### LiLa Schedule Extraction

**Function:** `schedule-extract` (Edge Function)

**Input:** Text content (from Notepad, MindSweep, or conversational context) + family member names + existing schedule patterns for duplicate detection.

**Processing:** LiLa identifies schedule-related phrases and extracts structured schedule data. Handles natural language like "every other Tuesday," "twice a month on the 1st and 15th," "90 days after last dose," "every May," "weekdays except holidays."

**Output:** Array of extracted schedule objects with confidence scores.

**Prompt pattern notes:**
- Prefer specific extractions over generic ones ("every 3 months on the 17th" > "quarterly")
- When ambiguous, extract the most common interpretation and flag low confidence
- Recognize completion-dependent language: "after last," "from when," "since previous," "X days later"
- Recognize window language: "between X and Y days," "within X days," "X-Y days from"

### LiLa Conversational Schedule Builder

**Guided mode:** When a user asks LiLa to help set up a complex schedule (especially custody), LiLa walks them through it conversationally:

1. "What's the basic pattern?" → determines schedule type
2. "Which days?" → builds the day selection
3. "Any exceptions?" → adds EXDATE entries
4. "Let me show you what that looks like" → presents calendar preview
5. "Does that look right?" → confirms or iterates

This is registered as a LiLa guided mode subtype, not a standalone mode. It activates contextually when the user is in a scheduling flow and asks for help.

---

## Edge Cases

### Leap Year (Feb 29)
- Schedules set for "February 29th" only fire in leap years. In non-leap years, the instance is skipped (not shifted to Feb 28 or Mar 1).
- The calendar preview clearly shows Feb 29 only appearing in leap years when navigated to.

### Month-Length Variations
- "Every month on the 31st" fires Jan 31, Mar 31, May 31, Jul 31, Aug 31, Oct 31, Dec 31. Months without a 31st are skipped.
- "Last day of month" (BYMONTHDAY=-1) correctly resolves to 28/29/30/31 depending on the month.

### Completion-Dependent with No Completion History
- First instance uses the anchor date. If no anchor date is set, defaults to "today."
- If a completion-dependent item is never completed, it persists on the dashboard per the consuming feature's incomplete action setting (Fresh Reset, Reassign Until Complete, etc.).

### Due Window Overlap
- If a completion-dependent item with a 57-63 day window isn't completed and a new window would start before the old one ends, only one active instance exists at a time. The window extends until completion, then the next window starts fresh from the completion date.

### Custody Pattern Modifications
- "Edit this week only" adds RDATE/EXDATE overrides without changing the base pattern.
- "Edit all future" creates a new pattern anchored from the edit date (RRULE split, same as Google Calendar's "this and future events").
- "Edit entire series" modifies the base pattern.

### Very Long Patterns
- Custody patterns longer than 14 days: the grid adds additional rows. Maximum supported pattern length is 56 days (8 weeks), which covers even the most unusual custody arrangements.
- Pattern visualization wraps to show full weeks aligned to the day-of-week headers.

### Timezone Transitions (DST)
- All schedules store timezone identifier (e.g., "America/Chicago").
- rrule.js handles DST transitions — a 3:00 PM task stays at 3:00 PM local time regardless of clock changes.
- Custody access window times (start_time/end_time) are local time, not UTC.

### Schedule with Zero Selected Days
- If the user selects "Weekly" but doesn't check any days, save is disabled with a gentle message: "Select at least one day."

### Migration from Simple Patterns
- Existing `recurrence_details` JSONB in simple format (`{days: ['mon','wed','fri']}`) is auto-converted to RRULE format during the build migration.
- The migration is non-destructive: original data is preserved in a `_legacy_recurrence` backup column for 90 days.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `scheduler_basic` | Quick picks: one-time, daily, weekly, monthly, yearly | Essential |
| `scheduler_custom` | Custom intervals, alternating weeks | Enhanced |
| `scheduler_advanced` | Custody patterns, completion-dependent, seasonal blocks, due windows | Full Magic |
| `scheduler_lila_extract` | LiLa bulk schedule extraction from text | Full Magic |

All return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Family holiday calendar auto-exclusion | Holiday calendar feature for auto-EXDATE | Post-MVP |
| ICS export from RRULE strings | Calendar export/import | Post-MVP |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Universal recurrence component harmonization | PRD-16 (forward note) | Universal Scheduler IS the harmonized component. |
| Task recurrence (Section 4 of Task Creation Modal) | PRD-09A | Universal Scheduler replaces the inline frequency selector. |
| Calendar event recurrence | PRD-14B | Universal Scheduler replaces the recurrence dropdown. |
| Shift schedule configuration | PRD-02 | `access_schedules` table replaces `shift_schedules`. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Universal Scheduler component renders inline within Task Creation Modal
- [ ] All 6 frequency types work: one-time, daily, weekly, monthly, yearly, custom
- [ ] Weekly: day-of-week multi-select circles, tap to toggle
- [ ] Monthly: recurring weekday with [+ Add another weekday] unlimited rows
- [ ] Monthly: recurring date with [+ Add another date] unlimited rows
- [ ] Yearly: month multi-select pills + date or weekday picker
- [ ] Custom: interval + unit picker, contextual day/date picker based on unit
- [ ] Time is optional, revealed via [+ Add time] button
- [ ] Consuming feature controls time-default via `showTimeDefault` prop
- [ ] Schedule Until: ongoing, specific date, or after X times
- [ ] Calendar preview: navigable mini calendar highlighting scheduled dates
- [ ] Calendar preview: tap days to manually add/remove (RDATE/EXDATE)
- [ ] Calendar preview works for ALL frequency types including one-time
- [ ] Exception dates: date picker + [+ Skip date] with removable pills
- [ ] School-year-only toggle
- [ ] More scheduling options (under Custom): alternating weeks, multi-week custody, seasonal, completion-dependent
- [ ] Alternating weeks: anchor date + Week A/Week B day selection
- [ ] Custody presets: 2-2-3, 5-2-5-2, week on/off, build-your-own
- [ ] Custody grid: tappable day cells to toggle Mom/Co-parent
- [ ] Seasonal date range: from/to dates + yearly repeat toggle + [+ Add another range]
- [ ] Completion-dependent: interval + unit + optional due window (start-end range)
- [ ] RRULE JSONB output format stored in consuming features' existing columns
- [ ] `access_schedules` table created, replaces `shift_schedules`
- [ ] rrule.js integrated for instance generation
- [ ] Migration script converts existing simple `recurrence_details` to RRULE format
- [ ] Component accepts `showTimeDefault`, `compactMode`, and `allowedFrequencies` props for consumer customization
- [ ] Compact mode variant for routine section-level frequency (day-of-week only)

### MVP When Dependency Is Ready
- [ ] LiLa schedule extraction from Review & Route text (requires PRD-05 + PRD-08 wiring)
- [ ] LiLa conversational schedule builder (requires PRD-05 guided mode)
- [ ] Batch approval flow for bulk-extracted schedules (requires Review & Route UI)

### Post-MVP
- [ ] Family holiday calendar auto-exclusion
- [ ] ICS export from RRULE strings
- [ ] Natural language schedule input ("type your schedule in words")
- [ ] Schedule conflict detection (warn when two schedules overlap for the same person)
- [ ] Custody percentage calculator (show % split based on pattern)
- [ ] Pattern learning: suggest schedule based on past completion patterns (period tracker use case)

---

## CLAUDE.md Additions from This PRD

- [ ] All scheduling in MyAIM uses the Universal Scheduler component (PRD-35). Never build a custom recurrence picker.
- [ ] Schedule data is stored as RRULE JSONB in each consuming feature's `recurrence_details` column. Format: `{rrule, dtstart, until, count, exdates, rdates, timezone, schedule_type, completion_dependent, custody_pattern}`.
- [ ] Use rrule.js for all instance generation. Never pre-generate infinite instances. Expand on-the-fly with a configurable horizon.
- [ ] `access_schedules` replaces `shift_schedules` for Special Adult/co-parent access windows.
- [ ] Completion-dependent schedules generate the next instance from the last completion timestamp, not from a fixed calendar position.
- [ ] Due windows create a range, not a single date. Item surfaces at window_start, ideal at midpoint, overdue at window_end.
- [ ] The [+ Add another] pattern is the universal solution for multi-value scheduling (multiple weekdays, multiple dates, multiple seasonal ranges). No fixed limit on rows.
- [ ] Calendar preview is REQUIRED on all scheduler instances. It must work for every frequency type and be navigable to any month/year.
- [ ] Time is optional by default. Consuming features pass `showTimeDefault: true` for time-centric features (calendar, meetings, shifts).

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `access_schedules` (replaces `shift_schedules`)
Enums updated: `recurrence_rule` expanded with 'yearly', 'completion_dependent', 'custody'
Triggers added: None
Migrations: Convert existing `recurrence_details` simple format to RRULE JSONB; backup to `_legacy_recurrence` column

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | RRULE (RFC 5545) as the underlying standard | Industry gold standard used by Google Calendar, Outlook, Apple Calendar. Battle-tested rrule.js library handles all edge cases. Future ICS export is trivially possible. |
| 2 | Progressive disclosure: Quick Picks → Custom → More Options | Most users need weekly/monthly. Power users can always reach custody patterns and completion-dependent scheduling. Never overwhelming, always accessible. |
| 3 | [+ Add another] pattern for multi-value fields | Solves monthly multi-weekday, multi-date, multi-seasonal-range, and any other combinatorial scheduling without custom UI per pattern. |
| 4 | Completion-dependent as a separate scheduling mode | Fundamentally different instance generation (event-driven vs calendar-driven). Mixing the two in one interface would be confusing. |
| 5 | Due windows for completion-dependent items | Real-world items like vet appointments and medication have a range, not a single day. Surfaces early, escalates late. |
| 6 | `access_schedules` replaces `shift_schedules` | The simple day-of-week table can't support custody patterns. Full RRULE format handles everything from simple babysitting to complex custody. |
| 7 | Calendar preview required on all instances | Visual verification prevents scheduling mistakes, especially for complex patterns. |
| 8 | Time optional by default, consumer-controlled | Tasks don't need times. Calendar events do. Let the consuming feature decide. |
| 9 | Yearly as a top-level frequency | Annual events (blood tests, birthdays, anniversaries) are common enough to warrant a quick pick, not buried under Custom. |
| 10 | Custody patterns are tappable grids, not text descriptions | Visual pattern editing is intuitive. Preset buttons (2-2-3, etc.) provide starting points. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Family holiday calendar auto-exclusion | Post-MVP feature |
| 2 | ICS export/import | Post-MVP feature |
| 3 | Natural language schedule input in the component | LiLa conversational builder handles this; no need for inline NLP |
| 4 | Pattern learning from completion history | Post-MVP, feeds into tracker/widget system |
| 5 | Schedule conflict detection | Post-MVP, requires cross-feature query |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-09A (Tasks) | Section 4 (Schedule & Recurrence) replaced by Universal Scheduler component. `recurrence_details` JSONB format upgraded. | Update Section 4 description to reference PRD-35. Migration for existing format. |
| PRD-09A (Routine Section Editor) | Section frequency picker uses compact variant of Universal Scheduler. | Note compact mode prop usage. |
| PRD-14B (Calendar) | Event recurrence uses Universal Scheduler. | Update event creator to embed component. |
| PRD-16 (Meetings) | Schedule Editor (Screen 6) uses Universal Scheduler. | Replace custom schedule form with component. |
| PRD-18 (Rhythms) | Rhythm timing uses Universal Scheduler. | Embed component in rhythm configuration. |
| PRD-02 (Permissions) | `shift_schedules` table replaced by `access_schedules`. Shift schedule configuration in Permission Hub Screen 3 uses Universal Scheduler. | Update schema references. Update Permission Hub UI description. |
| PRD-27 (Caregiver Tools) | Co-parent/caregiver access windows use Universal Scheduler via `access_schedules`. | PRD-27 references this component directly. |
| PRD-08 (Journal + Smart Notepad) | Review & Route gains LiLa schedule extraction cards. | Add schedule extraction card type to Review & Route flow. |

---

*End of PRD-35*
