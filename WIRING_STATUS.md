# Wiring Status — End-to-End Routing

> Tracks which RoutingStrip destinations actually work vs stub.
> Updated each build session.

## RoutingStrip Destinations

| Destination | Routes From | Creates Record In | Status | Notes |
|---|---|---|---|---|
| Calendar | Notepad, Meeting, Request | `calendar_events` | Stub | PRD-14B not built |
| Tasks | Notepad, Review & Route | `studio_queue` (destination='task') | **Wired** | Queue → TaskCreationModal works |
| List | Notepad, Review & Route | Shows list picker | Stub | ListPicker overlay not built yet |
| Journal | Notepad, Review & Route | `journal_entries` | **Wired** | Routes to journal |
| Guiding Stars | Notepad, Review & Route | `guiding_stars` | Stub | PRD-06 not built |
| Best Intentions | Notepad, Meeting | `best_intentions` | Stub | PRD-06 not built |
| Victory | Notepad, Review & Route | `victories` | Stub | PRD-11 not built |
| Track | Notepad | Widget data point | Stub | PRD-10 not built |
| Message | Notepad | Opens composer | Stub | PRD-15 not built |
| Agenda | Notepad | Meeting agenda item | Stub | PRD-16 not built |
| InnerWorkings | Notepad | `self_knowledge` | Stub | PRD-07 not built |
| Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built |
| Ideas | Notepad, Review & Route | `lists` (type='ideas') | **Wired** | Creates list item in Ideas list |
| Backburner | Notepad, Review & Route, Meeting | `lists` (type='backburner') | **Wired** | Creates list item in Backburner |
| Note | Notepad | `journal_entries` (free_write) | **Wired** | Quick note |
| Acknowledge | Request accept | Notification only | Stub | PRD-15 not built |
| Skip | Meeting action | No record | **Wired** | Just dismisses |

## System Lists (auto-created per member)

| List | Type | Auto-Created | Routes From | Status |
|---|---|---|---|---|
| Backburner | `backburner` | Should be auto-provisioned | Notepad, Review & Route, "not now" actions | **UI ready**, auto-provision not wired |
| Ideas | `ideas` | Should be auto-provisioned | Notepad, Review & Route, LiLa | **UI ready**, auto-provision not wired |

## User-Created List Types

| Type | Create UI | Detail View | Type-Specific Fields | Status |
|---|---|---|---|---|
| Shopping | **Working** | **Working** | quantity, unit, sections | Needs DB migration applied |
| Wishlist | **Working** | **Working** | URL, price, total | Needs DB migration applied |
| Expenses | **Working** | **Working** | amount, category, total | Needs DB migration applied |
| Packing | **Working** | **Working** | sections, progress | Needs DB migration applied |
| To-Do | **Working** | **Working** | promote to task | Needs DB migration applied |
| Prayer | **Working** | **Working** | basic items | Needs DB migration applied |
| Custom | **Working** | **Working** | flexible | Works now (uses 'custom' type) |
| Randomizer | In type config | Not built | Draw spinner | Needs Randomizer component |

## Blocking Issue

**Migration 024 not applied to remote Supabase.** The `lists.list_type` CHECK constraint only allows old types (simple, checklist, reference, template, randomizer, backburner). New types (shopping, wishlist, expenses, packing, todo, custom, ideas, prayer) are blocked until the SQL is run in Supabase SQL Editor. See the SQL block in this conversation or run `supabase db push`.
