# Universal Scheduler & Calendar — Consolidated Update Spec

**Type:** Combined update spec for Claude Code — covers Universal Scheduler redesign + Calendar schema decisions + shared MiniCalendarPicker component
**Priority:** Do this BEFORE building any calendar UI components
**Files affected:** Universal Scheduler components, new shared MiniCalendarPicker, calendar migration
**Context:** This spec consolidates decisions from the planning conversation. It supersedes any conflicting information in `specs/Calendar-System-Build-Spec.md` or `specs/Universal-Scheduler-Consistency-Update.md` — those files are still useful for context but THIS document has the final answers.

---

## Part 1: Universal Scheduler — "Best of Both" Redesign

### The Problem

The current v2 Universal Scheduler uses a compact NO/YES toggle + day chips + "More options..." link. This feels like configuring a widget, not answering a question. V1's task creation had radio buttons with plain-language descriptions ("How Often?") that felt conversational and intuitive, but lacked day-of-week selection, monthly, yearly, and custom options.

### The Solution: V1's Conversational Flow + V2's Power

The Universal Scheduler's primary interface becomes **radio buttons with descriptions** — matching v1's "How Often?" pattern. Each common option reveals its detail picker inline. The full power of the Universal Scheduler (intervals, alternating weeks, custody, completion-dependent, exceptions, calendar preview) lives under "Custom."

### New Primary Interface

When the Universal Scheduler renders (in either normal or compact mode), this is what the user sees:

```
+-- How Often? ----------------------------------------------+
|                                                            |
|  ( ) One-Time -- Something that needs to happen once       |
|    +- Date: [March 30, 2026              ] -+              |
|    +------------------------------------------+            |
|                                                            |
|  (*) Daily -- Repeats every single day                     |
|    (like morning routines)                                 |
|                                                            |
|  ( ) Weekly -- Repeats on specific days each week          |
|    (M) (Tu) (W) (Th) (F) (Sa) (Su)                       |
|                                                            |
|  ( ) Monthly -- Repeats each month                         |
|    On the: ( ) [17th] of each month                       |
|            ( ) [2nd] [Tuesday] of each month              |
|    [+ Add another date]                                    |
|                                                            |
|  ( ) Yearly -- Repeats once a year                         |
|    Month: (Jan)(Feb)(Mar)...(Dec)                         |
|    On: ( ) [17th]  ( ) [2nd] [Tuesday]                    |
|                                                            |
|  ( ) Custom -- Build your own schedule                     |
|    [Opens full scheduling options below]                   |
|                                                            |
+------------------------------------------------------------+
```

### Behavior Rules

**Radio selection reveals inline detail pickers — NO component swap, NO "More options" link for the first 5 options:**

| Selection | What Appears Inline Below It |
|---|---|
| One-Time | Date picker (single date input). If consuming feature has `showTimeDefault={true}`, also shows time picker. |
| Daily | Nothing additional needed. If `showTimeDefault={true}`, shows time picker. |
| Weekly | `WeekdayCircles` component — 7 tappable day circles. Respects `weekStartDay` prop. Must select at least 1 day. If `showTimeDefault={true}`, shows time picker. |
| Monthly | Radio sub-choice: "Specific date" (ordinal dropdown: 1st-31st, Last) OR "Specific weekday" (ordinal dropdown + weekday dropdown). **[+ Add another]** button adds additional rows. Each extra row has x to remove. If `showTimeDefault={true}`, shows time picker. |
| Yearly | Month multi-select pills (Jan-Dec, tap to toggle, can pick multiple). Then same date/weekday picker as Monthly ("On which day?" radio with ordinal + weekday). **[+ Add another]** for multiple dates/weekdays within selected months. If `showTimeDefault={true}`, shows time picker. |
| Custom | Full Universal Scheduler expansion renders inline below the radio buttons. This includes: interval picker ("Every [N] [days/weeks/months/years]"), day/date pickers based on unit, **More scheduling options** (alternating weeks, custody patterns, seasonal, completion-dependent), exceptions section, school-year-only toggle, calendar preview (MiniCalendarPicker). |

**The detail pickers are INLINE — they appear directly below the selected radio button, pushing other options down. They do NOT replace the radio list or navigate to a different view.**

**"Schedule Until" section** appears below the radio buttons (not inside them) when any repeating option is selected (Daily, Weekly, Monthly, Yearly, Custom):
- Dropdown: Ongoing (default), Specific date, After X times
- "Specific date" reveals a date picker
- "After X times" reveals a number input

### Compact Mode

When `compactMode={true}` (used in routine section editors or tight layouts):
- Radio labels show short text only (no descriptions): One-Time, Daily, Weekly, Monthly, Yearly, Custom
- Inline pickers are tighter (less padding)
- Calendar preview is collapsed by default
- Same functionality, just denser

### Language Rules (from PRD-35 — MANDATORY)

NEVER use in user-facing text: RRULE, recurrence, biweekly, interval, custody pattern, advanced mode, dtstart, RFC 5545, frequency

ALWAYS use: "Repeats every week on...", "Every other week", "Ends after X times", "Rotation schedule", "How often?", "Build your own schedule"

### Output Format (unchanged)

Regardless of which radio option is selected, the output is always the same `SchedulerOutput` (RRULE JSONB):

```json
{
  "rrule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
  "dtstart": "2026-03-17",
  "until": null,
  "count": null,
  "exdates": [],
  "rdates": [],
  "timezone": "America/Chicago",
  "schedule_type": "fixed",
  "completion_dependent": null,
  "custody_pattern": null
}
```

One-Time generates: `{ "rrule": null, "dtstart": "2026-03-30", "schedule_type": "one_time" }`
Daily generates: `{ "rrule": "FREQ=DAILY", ... }`
Weekly MWF generates: `{ "rrule": "FREQ=WEEKLY;BYDAY=MO,WE,FR", ... }`
Monthly on 17th generates: `{ "rrule": "FREQ=MONTHLY;BYMONTHDAY=17", ... }`
Monthly on 2nd Tuesday generates: `{ "rrule": "FREQ=MONTHLY;BYDAY=2TU", ... }`
Yearly in May on 17th generates: `{ "rrule": "FREQ=YEARLY;BYMONTH=5;BYMONTHDAY=17", ... }`

### Props (updated)

```typescript
interface UniversalSchedulerProps {
  value: SchedulerOutput | null
  onChange: (value: SchedulerOutput) => void
  showTimeDefault?: boolean      // Calendar=true, Tasks=false
  compactMode?: boolean          // Tighter layout for inline embedding
  allowedFrequencies?: string[]  // Restrict which radio options appear
  weekStartDay?: 0 | 1          // Passed to WeekdayCircles and MiniCalendarPicker
}
```

### What This Changes From Current v2

- Removes the NO/YES toggle as the primary interface
- Makes radio buttons with descriptions the primary selector
- Monthly and Yearly become top-level options (not hidden under Custom)
- One-Time, Daily, Weekly, Monthly, Yearly detail pickers render INLINE below the selected radio
- Only "Custom" triggers the full expansion with intervals, custody, etc.
- The full Universal Scheduler power is preserved — just reorganized behind progressive disclosure

---

## Part 2: Shared MiniCalendarPicker Component

### Create `src/components/shared/MiniCalendarPicker.tsx`

A compact, reusable month grid with fast date navigation. Used by:
1. Universal Scheduler -> Calendar Preview section (under Custom)
2. Calendar page -> toolbar date picker popup
3. DateDetailModal -> header jump-to-date popup
4. Calendar Dashboard Widget -> jump-to-date popup

### API

```typescript
interface MiniCalendarPickerProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  highlightedDates?: Date[]            // RRULE matches (scheduler preview)
  exceptionDates?: Date[]              // EXDATE (scheduler preview)
  manualDates?: Date[]                 // RDATE (scheduler preview)
  allowToggleExceptions?: boolean      // Scheduler mode: click toggles EXDATE/RDATE
  onToggleDate?: (date: Date, action: 'add_exception' | 'remove_exception' | 'add_manual' | 'remove_manual') => void
  weekStartDay?: 0 | 1                // 0=Sunday, 1=Monday
  showTodayButton?: boolean
  compact?: boolean                    // Smaller cells for inline embedding
  highlightColor?: (date: Date) => string | undefined  // Custody pattern colors
}
```

### Navigation Elements

- **Clickable month name** -> dropdown of all 12 months, instant jump
- **Clickable year** -> inline editable text field, type any year, Enter to jump
- **Prev/next arrows** -> one month at a time (ChevronLeft/ChevronRight, 16px)
- **"Today" button** -> jumps to current month, highlights today (visible when `showTodayButton={true}`)

### Day Grid

- Respects `weekStartDay`: Sunday start = `Su M Tu W Th F Sa`, Monday start = `M Tu W Th F Sa Su`
- Cell sizes: standard `32px`, compact `28px`
- Today: ring of `var(--color-accent)`
- Selected: `var(--color-btn-primary-bg)` fill
- Highlighted: `color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)` fill
- Exception: strikethrough text, dimmed
- All colors via CSS variables

---

## Part 3: WeekdayCircles Update

### Add `weekStartDay` Prop

```typescript
interface WeekdayCirclesProps {
  days: number[]
  onChange: (days: number[]) => void
  weekStartDay?: 0 | 1  // 0=Sunday (default), 1=Monday
}
```

When `weekStartDay={1}`: display order becomes `M Tu W Th F Sa Su`. Internal values unchanged (Monday=1, Sunday=0).

---

## Part 4: Calendar Schema Reconciliation Answers

**These are the founder's confirmed decisions. Use PRD-14B as source of truth with these specific resolutions. Regenerate the migration with all corrections.**

| Issue | Resolution |
|---|---|
| **Date fields** | Use PRD's separate fields: `event_date DATE`, `start_time TIME`, `end_time TIME`. Add `end_date DATE` for multi-day events. NULL times for all-day events. Simpler for date queries and all-day events. |
| **Category column** | Use `category_id UUID` FK to `event_categories.id` (build spec is correct -- UUID FK is better for CRUD on custom categories) |
| **Category seeds** | Use PRD's full 11: **Learning** (not School), Sports, Medical, Family, Social, **Faith**, **Music & Arts**, **Travel**, **Celebration**, Work, Other |
| **Transportation notes** | Use PRD name: `transportation_notes TEXT` |
| **Items to bring** | Use PRD's JSONB: `items_to_bring JSONB` with structure `[{text, checked, ai_suggested}]` |
| **Reminder** | Use `reminder_minutes INTEGER[]` (array -- multiple reminders is more flexible; build spec wins here) |
| **Default drive time** | Use PRD: `DEFAULT 30` (not 15) |
| **Required intake fields** | Add `required_intake_fields JSONB DEFAULT '[]'` to `calendar_settings` (missing from migration) |
| **Auto approve members** | Use `UUID[]` (build spec is correct -- cleaner than JSONB) |
| **Week start day** | Aligned: `week_start_day INTEGER DEFAULT 0` in `calendar_settings` |
| **event_categories.family_id** | Allow NULL -- system categories need `family_id IS NULL` to be shared across all families |
| **Recurrence** | Use RRULE JSONB via Universal Scheduler. Store in `recurrence_details JSONB` column. Keep `recurrence_rule TEXT` as quick-filter enum ('daily', 'weekly', 'monthly', 'yearly', 'custom', 'none'). **Drop** the individual columns (`recurrence_type`, `recurrence_interval`, `recurrence_days`, `recurrence_end_date`, `recurrence_count`) -- they're redundant with RRULE JSONB. |

### Features to Stub vs Build

| Feature | Decision |
|---|---|
| Image-to-event OCR | **Stub** -- needs Edge Function + OpenRouter vision model |
| LiLa guided event creation | **Stub** -- needs LiLa integration |
| Universal Queue Modal Calendar tab | **Stub** -- build approval in DateDetailModal now, stub Queue tab |
| Calendar Settings page | **Build** -- needed for week start day, drive time, auto-approve list |
| "Help Me Plan This" for kids | **Stub** -- needs LiLa guided mode |
| Calendar context for LiLa | **Stub** |
| Guided/Play shell variants | **Stub** |

---

## Part 5: Calendar-Specific Decisions

These decisions were made in the planning conversation and should be followed by the calendar build:

| Decision | Detail |
|---|---|
| **Full Calendar page default view** | **Month** (not Week). The full page is the big-picture view. |
| **Dashboard widget default view** | **Week**. The widget shows "what's happening this week." |
| **Click any date on Month view** | Opens **DateDetailModal** as transient modal overlay. Month view stays visible behind it. |
| **Click any date on Week view** | Opens **DateDetailModal** as transient modal overlay. Week view stays visible behind it. |
| **Click any date on Day view** | Opens **DateDetailModal** as transient modal overlay. Consistent across all views. |
| **Date navigation on Calendar page** | Clickable month name (dropdown), clickable year (editable text field), mini-calendar picker popup (shared `MiniCalendarPicker` component), "Today" button, plus prev/next arrows. No month-by-month scrolling to reach distant dates. |
| **Date navigation in DateDetailModal** | Prev/next day arrows + mini-calendar picker popup (same `MiniCalendarPicker`). |
| **Week start day** | Configurable in Calendar Settings: Sunday (0) or Monday (1). Stored in `calendar_settings.week_start_day`. Respected by: Calendar page grid, Dashboard widget grid, WeekdayCircles, MiniCalendarPicker, Universal Scheduler calendar preview. |
| **EventCreationModal** | Uses Universal Scheduler (with the new radio-button interface) for recurrence, with `showTimeDefault={true}`. Persistent modal via ModalV2 with gradient header. |

---

## Part 6: Implementation Order

1. **Shared MiniCalendarPicker** -- create the component (used by everything else)
2. **WeekdayCircles update** -- add `weekStartDay` prop
3. **Universal Scheduler redesign** -- replace NO/YES toggle with radio-button primary interface, Monthly/Yearly as top-level options, Custom expands to full power, wire MiniCalendarPicker into calendar preview
4. **Verify TaskCreationModal** -- confirm the scheduler still works correctly in the task creation flow after the redesign
5. **Regenerate calendar migration** -- apply all schema reconciliation answers from Part 4
6. **Build calendar** -- follow `specs/Calendar-System-Build-Spec.md` for component architecture, using the decisions from Part 5

---

## Verification Checklist

### Universal Scheduler
- [ ] Radio buttons with descriptions are the primary interface ("How Often?")
- [ ] One-Time selected -> date picker appears inline below
- [ ] Daily selected -> nothing extra needed (time picker if `showTimeDefault`)
- [ ] Weekly selected -> WeekdayCircles appear inline below (respects weekStartDay)
- [ ] Monthly selected -> date ordinal / weekday ordinal picker appears inline with [+ Add another]
- [ ] Yearly selected -> month pills + date/weekday picker appears inline
- [ ] Custom selected -> full Universal Scheduler expansion renders inline below radio buttons
- [ ] "Schedule Until" appears below radios when any repeating option is selected
- [ ] All options output the same `SchedulerOutput` RRULE JSONB format
- [ ] Compact mode shows short labels, tighter spacing
- [ ] No user-facing jargon (no RRULE, recurrence, interval, dtstart)
- [ ] TaskCreationModal still works after the redesign

### MiniCalendarPicker
- [ ] Clickable month name -> dropdown of 12 months
- [ ] Clickable year -> editable text field
- [ ] "Today" button jumps to current month
- [ ] Respects `weekStartDay` (Monday-first when `weekStartDay={1}`)
- [ ] Scheduler preview mode: click toggles EXDATE/RDATE
- [ ] Used by Calendar page, DateDetailModal, Dashboard widget, and Universal Scheduler

### WeekdayCircles
- [ ] `weekStartDay={1}` shows Monday first
- [ ] Internal day values unchanged (Monday=1, Sunday=0)

### Calendar Schema
- [ ] Migration uses `event_date DATE` + `start_time TIME` + `end_time TIME` (separate fields)
- [ ] Migration uses `recurrence_details JSONB` + `recurrence_rule TEXT` (no individual recurrence columns)
- [ ] 11 category seeds including Learning, Faith, Music & Arts, Travel, Celebration
- [ ] `transportation_notes` (not `transportation_details`)
- [ ] `items_to_bring JSONB` (not TEXT[])
- [ ] `reminder_minutes INTEGER[]` (array)
- [ ] `default_drive_time_minutes DEFAULT 30`
- [ ] `required_intake_fields JSONB DEFAULT '[]'` present in `calendar_settings`
- [ ] `event_categories.family_id` allows NULL for system categories

### Calendar UX
- [ ] Full Calendar page defaults to Month view
- [ ] Dashboard widget defaults to Week view
- [ ] Click any date on any view -> DateDetailModal overlay
- [ ] Date navigation: month dropdown + editable year + MiniCalendarPicker + Today button
- [ ] Week start day setting works and all views respect it
