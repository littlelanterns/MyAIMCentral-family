# Wiring Status — End-to-End Routing

> Tracks which RoutingStrip destinations actually work vs stub.
> Updated each build session. Last updated: 2026-04-06.

## RoutingStrip Destinations

| Destination | Routes From | Creates Record In | Status | Notes |
|---|---|---|---|---|
| Calendar | Notepad, MindSweep, .ics import | `studio_queue` → `calendar_events` | **Wired** | Queue → CalendarTab approve/edit/skip + .ics file upload on /sweep |
| Tasks | Notepad, Review & Route | `studio_queue` (destination='task') | **Wired** | Queue → TaskCreationModal works |
| List | Notepad, Review & Route | Shows list picker | **Wired** | ListPickerModal in SortTab |
| Journal | Notepad, Review & Route | `journal_entries` | **Wired** | Routes to journal |
| Guiding Stars | Notepad, Review & Route, MindSweep | `guiding_stars` | **Wired** | PRD-06 built |
| Best Intentions | Notepad, Meeting, MindSweep | `best_intentions` | **Wired** | PRD-06 built |
| Victory | Notepad, Review & Route, MindSweep | `victories` | **Wired** | PRD-11 built |
| Track | Notepad | Widget data point | Stub | PRD-10 widget data routing not built |
| Message | Notepad | Opens composer | Stub | PRD-15 not built |
| Agenda | Notepad | Meeting agenda item | Stub | PRD-16 not built |
| InnerWorkings | Notepad, MindSweep | `self_knowledge` | **Wired** | PRD-07 built |
| Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built |
| Ideas | Notepad, Review & Route | `lists` (type='ideas') | **Wired** | Creates list item in Ideas list |
| Backburner | Notepad, Review & Route, Meeting, MindSweep | `lists` (type='backburner') | **Wired** | Creates list item in Backburner |
| Note | Notepad | `journal_entries` (free_write) | **Wired** | Quick note |
| MindSweep | Notepad, /sweep | `studio_queue` + direct inserts | **Wired** | PRD-17B: embedding-first + Haiku classification |
| Acknowledge | Request accept | Notification only | Stub | PRD-15 not built |
| Skip | Meeting action | No record | **Wired** | Just dismisses |

## Studio → Feature Wiring

| Studio Action | Target | Status | Notes |
|---|---|---|---|
| [Customize] Task types | TaskCreationModal | **Wired** | Opens modal pre-configured for type |
| [Customize] List types | Navigate /lists?create=type | **Wired** | URL param auto-opens create modal |
| [Customize] Guided Forms | GuidedFormAssignModal | **Wired** | Opens 2-step assign flow |
| [Customize] Trackers/Widgets | PlannedExpansionCard | Stub | PRD-10 not built |
| My Customized: Deploy | TaskCreationModal | **Wired** | Opens modal from template |
| My Customized: Edit | TaskCreationModal | **Wired** | Opens modal for editing |
| My Customized: Duplicate | Supabase insert | **Wired** | Creates copy in DB |
| My Customized: Archive | Supabase soft delete | **Wired** | Sets archived_at |

## System Lists (auto-created per member)

| List | Type | Auto-Created | Routes From | Status |
|---|---|---|---|---|
| Backburner | `backburner` | Not yet (needs auto-provision trigger) | Notepad, Review & Route | **UI ready** |
| Ideas | `ideas` | Not yet (needs auto-provision trigger) | Notepad, Review & Route | **UI ready** |

## User-Created List Types

| Type | Create UI | Detail View | Type-Specific Fields | Status |
|---|---|---|---|---|
| Shopping | **Working** | **Working** | quantity, unit, sections | **Working** |
| Wishlist | **Working** | **Working** | URL, price, total | **Working** |
| Expenses | **Working** | **Working** | amount, category, total | **Working** |
| Packing | **Working** | **Working** | sections, progress | **Working** |
| To-Do | **Working** | **Working** | priority, promote to task | **Working** |
| Prayer | **Working** | **Working** | basic items | **Working** |
| Ideas | **Working** | **Working** | basic items | **Working** |
| Backburner | **Working** | **Working** | basic items | **Working** |
| Custom | **Working** | **Working** | flexible | **Working** |
| Randomizer | **Working** | **Working** | draw spinner, category filter | **Working** |

## Seed Data in DB

| Table | System Records | Example Records | Verified |
|---|---|---|---|
| task_templates | 8 blank formats | 7 pre-filled examples | Yes (API test) |
| task_template_sections | — | Morning Routine (3), Bedroom (3) | Yes (migration success) |
| task_template_steps | — | ~22 steps across routines | Yes (migration success) |
| list_templates | 7 blank formats | 4 pre-filled examples | Yes (API test) |
| guided_form_responses | Table exists | — | Yes (API test) |

## RLS Verification

| Table | Anon Read | Auth Read | Auth Write | Verified |
|---|---|---|---|---|
| task_templates (system) | Yes | Yes | No (correct) | Yes (API test) |
| list_templates (system) | Yes | Yes | No (correct) | Yes (API test) |
| lists | — | Owner + parent | Owner + parent | Yes (wishlist create test) |
| guided_form_responses | — | Family-scoped | Own records | Yes (empty query succeeds) |

## Quick Create Actions (Global "+" Button)

| Action | Opens | Status | Notes |
|---|---|---|---|
| Add Task | Navigate `/tasks?new=1` | **Wired** | TaskCreationModal in Quick Mode |
| Quick Note | Notepad drawer (mom) or `/notepad` | **Wired** | Via NotepadBridge context |
| Log Victory | Navigate `/victories?new=1` | **Wired** | Victory recording page |
| Calendar Event | Navigate `/calendar?new=1` | **Wired** | EventCreationModal on CalendarPage + CalendarWidget |
| Send Request | Opens Notepad (fallback) | Stub | PRD-15 request modal not built |
| Mind Sweep | Navigate `/sweep` | **Wired** | MindSweep capture: text, voice, scan, link, calendar import |

## Calendar Import (Phase 0)

| Path | How It Works | Status |
|---|---|---|
| Upload .ics file | Calendar button on /sweep → parse → studio_queue → CalendarTab approve | **Wired** |
| Screenshot event | Scan button → OCR → MindSweep classifies as calendar → CalendarTab | **Wired** |
| Paste event link | Link button → fetch + summarize → MindSweep classifies → CalendarTab | **Wired** |
| Type event details | Text → Sweep Now → MindSweep classifies as calendar → CalendarTab | **Wired** |
| Forward email (.ics) | Email forwarding → mindsweep-email-intake | Stub (DNS not configured) |
| Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP) |

## Task Breaker AI (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Text Mode — Quick | TaskCreationModal → TaskBreaker → `task-breaker` Edge Function (Haiku) → 3-5 subtasks | **Wired** | Family context + active task counts passed |
| Text Mode — Detailed | Same flow → 5-10 subtasks with descriptions | **Wired** | |
| Text Mode — Granular | Same flow → 10-20 micro-steps | **Wired** | |
| Subtask creation | Accepted subtasks → child `tasks` rows via `parent_task_id` | **Wired** | Created in `createTaskFromData` |
| Image Mode | Camera/upload → visual task decomposition | Stub | Full Magic tier, separate session |

## Known Issues / TODO

- System lists (Backburner, Ideas) not auto-provisioned yet — need trigger in auto_provision_member_resources
- LiLa help button in GuidedFormFillView is a stub (PRD-05 dependency)
- Guided Form child fill view + mom review flow not tested end-to-end
- Quick Create "Send Request" falls back to Notepad until PRD-15 is built
