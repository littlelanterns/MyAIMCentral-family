# Wiring Status — End-to-End Routing

> Tracks which RoutingStrip destinations actually work vs stub.
> Updated each build session. Last updated: 2026-04-06 (Studio Intelligence Phase 1).

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
| [Customize] Task types (task/routine/opportunity) | TaskCreationModal | **Wired** | Opens modal pre-configured for type |
| [Customize] Sequential Collection | SequentialCreatorModal | **Wired** | PRD-09A/09B Studio Intelligence Phase 1 — previously silently broken (opened TaskCreationModal which created malformed rows). Now routes through `useCreateSequentialCollection`. |
| [Customize] List types | Navigate /lists?create=type | **Wired** | URL param auto-opens create modal |
| [Customize] Randomizer | Navigate /lists?create=randomizer | **Wired** | Studio URL path; also accessible directly via Lists page [+ New List] picker as of Phase 1 |
| [Customize] Guided Forms | GuidedFormAssignModal | **Wired** | Opens 2-step assign flow |
| [Customize] Trackers/Widgets | WidgetPicker + WidgetConfiguration | **Wired** | PRD-10 Phase A |
| My Customized: Deploy | TaskCreationModal | **Wired** | Opens modal from template |
| My Customized: Edit | TaskCreationModal | **Wired** | Opens modal for editing |
| My Customized: Duplicate | Supabase insert | **Wired** | Creates copy in DB |
| My Customized: Archive | Supabase soft delete | **Wired** | Sets archived_at |

## Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)

| Capability | Entry Point | Status | Notes |
|---|---|---|---|
| Create from Studio | Studio → Sequential Collection [Customize] → SequentialCreatorModal | **Wired** | Phase 1 (2026-04-06). Before Phase 1 this opened TaskCreationModal and silently wrote a broken single-row task. |
| Create from Tasks → Sequential tab | Tasks → Sequential tab → [+ Create] → SequentialCreatorModal | **Wired** | Same modal as Studio. |
| Create from Lists page | Lists → [+ New List] → "Sequential Collection" tile → SequentialCreatorModal | **Wired** | Phase 1 cross-surface visibility — new entry point. |
| DB writes | `sequential_collections` row + N `tasks` rows with `task_type='sequential'`, `sequential_collection_id`, `sequential_position`, first `active_count` flagged `sequential_is_active=true` | **Wired** | Via `useCreateSequentialCollection` mutation. E2E verified in `tests/e2e/features/studio-intelligence-phase1.spec.ts`. |
| Visible on Tasks → Sequential tab | `<SequentialCollectionView>` renders expandable cards with progress, restart-for-another-student, archive | **Wired** | Revived from dead code in Phase 1. |
| Visible on Lists page | Inline tile in grid / list view with "Sequential" badge + `current_index/total_items` subtitle | **Wired** | Phase 1 dual access. Only shown on `filter='all'`. |
| Sequential detail view from Lists page | Back-button wrapper rendering `<SequentialCollectionCard>` | **Wired** | Phase 1 — uses exported `SequentialCollectionCard`. Card has its own expand/collapse. |
| `createTaskFromData` guard | Throws `Error` on `taskType='sequential'` | **Wired** | Prevents silent re-introduction of the broken path. |
| `TaskCreationModal` guard | Skips `initialTaskType='sequential'` with `console.warn` | **Wired** | Defensive layer above the guard. |
| Advancement modes (practice_count / mastery) | — | Stub | Session 2 (Linked Steps addendum) |
| Linked routine steps | — | Stub | Session 2 |
| `curriculum-parse` Edge Function | — | Stub | Session 2 |

## Studio Capability Tags (PRD-09A/09B Studio Intelligence Phase 1)

| Item | Status | Notes |
|---|---|---|
| `capability_tags: string[]` required on `StudioTemplate` type | **Wired** | Compile-time error if a future template forgets tags. |
| Tags populated on all 27 seed templates | **Wired** | Blank formats + examples across task, guided form, list, and randomizer categories. |
| Widget starter configs carry baseline tags | **Wired** | Adapter in Studio.tsx adds `['dashboard_display', 'at_a_glance', 'progress_visual', tracker_type]`. Phase 2 will replace with per-tracker-type tags. |
| Studio search bar rendering tags | — | Stub (Session 3 / Phase 2) |
| Use case category browse | — | Stub (Session 3 / Phase 2) |
| "Best for:" tagline + tag pills on cards | — | Stub (Session 3 / Phase 2) |
| "My Library" unified tab | — | Stub (Session 3 / Phase 2) |

## System Lists (auto-created per member)

| List | Type | Auto-Created | Routes From | Status |
|---|---|---|---|---|
| Backburner | `backburner` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |
| Ideas | `ideas` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |

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
| Image Mode | Camera/upload → Sonnet vision → action steps as subtasks | **Wired** | Full Magic tier (`tasks_task_breaker_image`). Camera capture + file upload in TaskBreaker.tsx, multimodal message to task-breaker Edge Function (Sonnet when image, Haiku for text-only). 2026-04-13. |

## Opportunity Claim Lock Expiration (PRD-09A)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Server-side cron | `expire_overdue_task_claims()` runs hourly via pg_cron, releases expired claims | **Wired** | Sets status='released', released=true |
| Client-side backup | `useExpireOverdueClaims` sweeps on page load | **Wired** | Belt-and-suspenders with server cron |

## List Victory Mode (PRD-09B)

| Feature | How It Works | Status | Notes |
|---|---|---|---|
| Victory mode selector | 4-option segmented control (None / Per item / All done / Both) in list detail header | **Wired** | Shopping + generic list views, owner/parent only |
| Per-item victories | Checking a flagged item → victory with source='list_item_completed', idempotent | **Wired** | Checks for existing victory before creating |
| List-level victories | Last unchecked item checked → victory with source='list_completed' | **Wired** | Debounced per session |
| Per-item flag toggle | Trophy icon on each item, toggleable by owner/parent | **Wired** | Auto-flags all items when switching to item_completed or both |
| Auto-flagging on mode change | Switching to item_completed/both bulk-sets all items' victory_flagged=true | **Wired** | Mom can unflag specific items |
| Default by list type | randomizer → 'item_completed', everything else → 'none' | **Wired** | Frontend default in useCreateList |
| Celebration banner | "All done! Victory recorded!" on list completion | **Wired** | Auto-dismisses after 4 seconds |
| victory_flagged column | Per-item boolean on list_items, default false | **Wired** | Migration 100102 |

## Known Issues / TODO

- LiLa help button in GuidedFormFillView is a stub (PRD-05 dependency)
- Guided Form child fill view + mom review flow not tested end-to-end
- Quick Create "Send Request" falls back to Notepad until PRD-15 is built
