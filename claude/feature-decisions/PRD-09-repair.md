# Feature Decision File: PRD-09 Repair — Smart Notepad (PRD-08)

> **Created:** 2026-03-25
> **PRD:** `prds/personal-growth/PRD-08-Journal-Smart-Notepad.md`
> **Addenda read:**
>   - `prds/addenda/PRD-08-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Founder approved:** Pending

---

## What Is Being Built

Repair session for the Smart Notepad (PRD-08). Fixing 8 audit findings and 4 founder UX directives. The notepad's plain textarea becomes a light rich text editor with bold/italic/bullets. Review & Route gets inline editing, "Edit in Notepad", and "Save Only" buttons. History view gets search, filter, sort, and delete. The Journal page becomes a read-only surface (+ opens Notepad). Routing toast gets tappable destination links. The close button becomes a slide-back PullTab.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| NotepadDrawer.tsx — Editor view | Replace textarea with tiptap rich text editor (bold, italic, bullet). Add character count indicator with soft limit warning. Replace X close with PullTab arrow. |
| NotepadDrawer.tsx — History view | Add search bar, filter by status/destination, sort options, delete with confirmation |
| NotepadReviewRoute.tsx — Extracted cards | Add inline text editing per card. Add "Edit in Notepad" button. Add "Save Only" button. |
| RoutingStrip.tsx — Destinations | Rename 'note' key to 'quick_note'. Add missing journal sub-types (letter, memory, goal_check_in, observation, reflection_response). |
| Journal.tsx | Convert to read-only view: remove inline create/edit form. + button opens Notepad. Edit button on entries opens content in Notepad. |
| RoutingToastProvider / UndoToast | Enhance toast with tappable link to destination page |
| NotepadRichEditor.tsx (new) | Tiptap StarterKit with 3-button toolbar: Bold, Italic, Bullet List |
| HScrollArrows (new shared component) | Universal horizontal scroll arrow indicators |

---

## Key PRD Decisions (Easy to Miss)

1. **PRD-08 Screen 1**: "Light rich text editor (bold, italic, bullet lists)" — NOT plain textarea
2. **PRD-08 Screen 2, Destination #9**: "Note" saves to `journal_entries` with `entry_type = 'quick_note'` — but DB schema only has `free_write`. Current CLAUDE.md convention #20 says Note routes with entry_type='free_write'. Since no migration is planned for this repair, we'll update the destination KEY to 'quick_note' but continue writing entry_type='free_write' to the DB.
3. **PRD-08 Screen 3**: Review & Route has three bottom actions — "Route All Pending", "Edit in Notepad", "Save Only"
4. **PRD-08 Screen 3**: "Each card shows extracted text (editable inline)"
5. **PRD-08 Screen 4**: "+ button opens the Smart Notepad (right drawer) for new entry creation. The Journal itself is not a direct writing surface."
6. **PRD-08 Screen 6**: History needs search, filter by status/destination, sort, delete
7. **PRD-08 Edge Cases**: Large content handling — character count indicator, gentle warning at threshold

---

## Addendum Rulings

### From PRD-08-Cross-PRD-Impact-Addendum.md:
- Journal sub-page routes (/journal/reflections, /journal/commonplace, etc.) — already wired
- "Edit in Notepad" action chip for LiLa — already wired in PRD-05 build
- Review & Route is universal reusable component — other features wire in later

### From PRD-Audit-Readiness-Addendum.md:
- No specific overrides for this repair — general audit quality habits apply

---

## Database Changes Required

### No New Tables

### Migration: Fix journal_entries.entry_type CHECK constraint
**File:** `supabase/migrations/00000000100031_fix_journal_entry_types.sql`

The DB was built with wrong entry_type values from database_schema.md instead of PRD-08's authoritative values. This migration:

1. Drops the old CHECK constraint
2. Maps existing rows: `free_write` → `journal_entry`, `daily_reflection` → `reflection`, `learning_capture` → `commonplace`, all others → `journal_entry` or `reflection`
3. Adds new CHECK constraint with PRD-08's 11 values: `journal_entry`, `gratitude`, `reflection`, `quick_note`, `commonplace`, `kid_quips`, `meeting_notes`, `transcript`, `lila_conversation`, `brain_dump`, `custom`

**Critical correction:** `learning_capture` is NOT a journal entry type. Homeschool learning capture lives in `family_moments` (PRD-37) and `homeschool_time_logs` (PRD-28). Commonplace is a distinct journal type for capturing quotes and ideas from reading — a Commonplace Book concept.

---

## Feature Keys

No new feature keys needed for this repair.

---

## Stubs — Do NOT Build This Phase

- [ ] Reflections sub-page full experience (deferred per PRD-08)
- [ ] Commonplace sub-page full experience (deferred per PRD-08)
- [ ] Message destination full inbox (deferred to PRD-15)
- [ ] List picker overlay (deferred — routes to studio_queue)
- [ ] Calendar date picker inline (deferred — routes to studio_queue)
- [ ] Track Progress smart matching (deferred — routes to studio_queue)
- [ ] Agenda meeting picker (deferred — routes to studio_queue)
- [ ] TaskCreationModal redesign (Phase 10 item, do not touch)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Smart Notepad | → | Journal | `journal_entries` table, entry_type='free_write' for quick_note destination |
| Smart Notepad | → | Studio Queue | `studio_queue` for tasks, list, calendar, track, agenda, message, optimizer |
| Smart Notepad | → | Best Intentions | `best_intentions` table direct insert |
| Smart Notepad | → | Victories | `victories` table direct insert |
| Smart Notepad | → | Guiding Stars | `guiding_stars` table direct insert |
| Smart Notepad | → | InnerWorkings | `self_knowledge` table direct insert |
| Journal | ← | Smart Notepad | Routed entries appear in journal timeline |
| LiLa | → | Smart Notepad | "Edit in Notepad" action chip |

---

## Repair Items Mapped to PRD

| # | Issue | PRD Reference | Approach |
|---|---|---|---|
| 1 | Plain textarea → rich text | PRD-08 Screen 1: "Light rich text editor (bold, italic, bullet lists)" | Install @tiptap/react + @tiptap/starter-kit. Create NotepadRichEditor with 3-button toolbar. |
| 2 | Journal entry types mismatch | PRD-08 Screen 2: "Entry type picker (11 types)" | Add all 11 entry types to RoutingStrip Journal sub-options |
| 3 | Note destination key 'note' → 'quick_note' | PRD-08 Screen 2 Destination #9, CLAUDE.md #20 | Rename key in ALL_DESTINATIONS, ROUTING_DESTINATIONS, context filters, undo table map, extraction AI prompt |
| 4 | Inline editing in Review & Route | PRD-08 Screen 3: "extracted text (editable inline)" | Add click-to-edit on ExtractedCard content |
| 5 | "Edit in Notepad" button | PRD-08 Screen 3 wireframe shows this button | Add button that creates new tab with item content and navigates back to editor |
| 6 | "Save Only" button | PRD-08 Screen 3 wireframe shows this button | Add secondary button that saves notepad content without extraction routing |
| 7 | History search/filter/sort/delete | PRD-08 Screen 6 requirements | Add search, filter pills, sort dropdown, delete with confirmation modal |
| 8 | Large content handling | PRD-08 Edge Cases | Add character count display + soft warning at 5000 chars |
| A | Close button → PullTab | Founder directive | Replace X with inward-pointing PullTab arrow on left edge of open drawer |
| B | Journal read-only surface | PRD-08 Screen 4: "Journal is not a direct writing surface" + founder directive | Remove inline create/edit form. + opens Notepad. Edit opens in Notepad. |
| C | Routing toast with destination link | Founder directive | Enhance toast message to include tappable link that navigates to the destination page |
| D | Horizontal scroll arrows | Founder directive (universal) | Create shared HScrollArrows component, apply to notepad tab bar and history filter pills |

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct (none needed)
- [ ] Feature keys identified (none needed)
- [ ] **Approved to build**

---

## Post-Build PRD Verification

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Rich text editor (bold/italic/bullets) | PRD-08 Screen 1 | **Wired** | tiptap StarterKit with 3-button toolbar (Bold, Italic, Bullet List) |
| Journal entry types aligned (all 11) | PRD-08 Screen 2 | **Wired** | Migration 00000000100031 fixes CHECK constraint + maps existing rows. All 11 PRD-08 types in RoutingStrip, useJournal, Journal page |
| Note destination key → quick_note | PRD-08 Screen 2 #9 | **Wired** | Renamed across ALL_DESTINATIONS, ROUTING_DESTINATIONS, context filters, undo map, AI extraction prompt |
| Inline editing in Review & Route | PRD-08 Screen 3 | **Wired** | Click-to-edit on ExtractedCard content text |
| Edit in Notepad button | PRD-08 Screen 3 | **Wired** | StickyNote icon on each card, creates new tab with item content |
| Save Only button | PRD-08 Screen 3 | **Wired** | Secondary button below Route All, saves as journal_entry without routing |
| History search/filter/sort/delete | PRD-08 Screen 6 | **Wired** | Search bar, filter pills (All/Routed/Archived), sort toggle (Newest/Oldest/Status), delete with confirm |
| Large content handling | PRD-08 Edge Cases | **Wired** | Char count in toolbar, warning message at 5000 chars |
| Close button → PullTab | Founder directive A | **Wired** | Desktop: PullTab with ChevronsRight on left edge. Mobile: ChevronsRight button replaces X |
| Journal read-only surface | PRD-08 Screen 4 + Founder B | **Wired** | Removed inline create/edit form. + opens Notepad. Entries expand to read view with "Edit in Notepad" button |
| Routing toast with destination link | Founder directive C | **Wired** | Toast message is tappable link that navigates to destination page |
| Horizontal scroll arrows | Founder directive D | **Wired** | HScrollArrows component wraps tab bar, journal filter pills, history filter pills |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified: 12
- Wired: 12
- Stubbed: 0
- Missing: **0**

---

## Post-Build Hotfix (2026-03-25)

Three infinite re-render loops discovered during visual verification. All caused "Maximum update depth exceeded" errors that prevented React from painting page content on navigation.

| File | Bug | Root Cause | Fix |
|---|---|---|---|
| `src/features/timer/TimerProvider.tsx:205` | `setIdleReminders` called unconditionally every tick | `[].filter()` returns a new array reference, which React treats as a state change. This fired every second via the timer tick interval, creating a render → setState → render loop. | Return `prev` unchanged when `filter` removes nothing (`filtered.length === prev.length ? prev : filtered`) |
| `src/hooks/useAutoCollapse.ts:37` | `quickTasksAutoCollapsed` state variable in its own useEffect dependency array | ResizeObserver fires → `setState` → re-render → effect re-runs → disconnects/reconnects observer → observer fires immediately → `setState` → infinite loop | Read current state via `useRef` instead of dependency; empty deps `[]` |
| `src/components/shared/UndoToast.tsx:43` | `onDismiss` (inline arrow function) in useEffect dependency array | New function reference on every render → effect cleanup/setup cycle → `setProgress` → re-render → new `onDismiss` → loop | Store `onDismiss` in a ref; remove from deps |
