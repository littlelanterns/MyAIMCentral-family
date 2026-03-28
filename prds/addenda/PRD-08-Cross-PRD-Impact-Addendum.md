# PRD-08 Cross-PRD Impact Addendum
## Edits Needed in Prior PRDs Based on PRD-08 Decisions

**Date:** March 4, 2026
**Source PRD:** PRD-08 (Journal + Smart Notepad)
**Purpose:** Documents specific edits needed in prior PRDs to maintain cross-PRD consistency. Apply these before the final Opus audit.

---

## PRD-05 (LiLa Core AI System)

### 1. Context Assembly Pipeline — Add Notepad Context Source

In the context assembly section, add:

```
### Notepad Context
- **When loaded:** User is on the Notepad page (full-page mode or drawer open on /notepad route)
- **What's loaded:** First 5 active tabs — title + 100-char content preview per tab
- **Format:** Lightweight summary, not full content
- **Also loaded when:** User selects "Send to... → LiLa Optimizer" (full tab content sent as Optimizer input)
```

### 2. "Edit in Notepad" Action Chip — Add Cross-Reference

Update the "Edit in Notepad" action chip description to reference PRD-08:

```
> Full specification of the Edit in Notepad flow, Notepad tab creation, 
> and source tracking is in PRD-08, Screen 1 and Flows section.
```

### 3. "Review & Route" Action Chip — Add Cross-Reference

Update the "Review & Route" action chip description:

```
> Review & Route is defined as a universal reusable component in PRD-08, 
> Screen 3. This action chip triggers that component with conversation 
> content as input. The component contract (input/output/rendering) is 
> in PRD-08.
```

### 4. `member_self_insights` Table — Mark as Superseded

If not already done by PRD-07's addendum, confirm this note exists:

```
> `member_self_insights` is superseded by `self_knowledge` (PRD-07). 
> Review & Route routing to InnerWorkings creates `self_knowledge` 
> entries with `source_type = 'log_routed'` (wired in PRD-08).
```

---

## PRD-05 Planning Decisions Addendum

### 1. MindSweep → Review & Route — Update Reference

The existing note about MindSweep being folded into Smart Notepad's Review & Route pipeline should be updated:

```
> MindSweep is fully realized as the Review & Route universal reusable 
> component defined in PRD-08, Screen 3. The component contract covers: 
> input (text + context), processing (LiLa Edge Function extraction), 
> output (extracted items with types/destinations/confidence), and 
> rendering (card-by-card review with routing buttons). Other features 
> wire into this same component.
```

---

## PRD-05C (LiLa Optimizer)

### 1. Optimizer ↔ Notepad Bidirectional Flow

Add to the Optimizer's input/output section:

```
### Notepad Integration
- **Notepad → Optimizer:** User selects "Send to... → LiLa Optimizer" 
  from the Notepad Send To grid. Full tab content sent as Optimizer input.
- **Multiple sends are additive:** If user sends Tab A, then sends Tab B, 
  Tab B's content appends below Tab A's in the Optimizer workspace. 
  Content accumulates until user clears or starts a new session.
- **Optimizer → Notepad:** Optimizer output can be sent to a Notepad tab 
  via "Edit in Notepad" for further refinement before external use. 
  Creates tab with `source_type = 'lila_optimizer'`.
```

---

## PRD-06 (Guiding Stars & Best Intentions)

### 1. Source Tracking for Notepad-Routed Entries

Add to the `guiding_stars` and `best_intentions` table notes:

```
- Entries created via Smart Notepad routing use `source = 'hatch_routed'` 
  and `source_reference_id` pointing to the notepad tab ID. This enables 
  traceability back to the original capture.
```

If the `source` column doesn't exist on these tables, add it:

```
| source | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'lila_conversation', 'hatch_routed', 'review_route' |
| source_reference_id | UUID | NULL | YES | FK to source record |
```

---

## PRD-07 (InnerWorkings)

### 1. `source_type = 'log_routed'` — Now Wired

The existing stub note should be updated to confirmed/wired:

```
> WIRED by PRD-08: "Save to InnerWorkings" from Smart Notepad creates 
> a `self_knowledge` entry with `source_type = 'log_routed'`, 
> `source_reference_id` = notepad tab ID, and user-selected category 
> from the inline picker overlay. The Notepad's routing function handles 
> the insert; InnerWorkings RLS must allow inserts from the routing context 
> (same user creating their own entry).
```

---

## PRD-02 (Permissions & Access Control)

### 1. Journal Category-Level Visibility — New Permission Pattern

Add to the permission configuration section:

```
### Journal Visibility Settings
Mom configures which journal entry types are visible per child in 
Family Settings. This uses the `journal_visibility_settings` table 
(defined in PRD-08) with per-entry-type, per-child granularity.

Default visibility varies by entry type:
- reflection, commonplace, kid_quips: Visible (required for family sharing / educational tracking)
- journal_entry, gratitude, quick_note, meeting_notes, brain_dump, custom: Private

Teens can share entries within private categories (increase disclosure) 
but cannot hide entries within visible categories (increase privacy). 
This follows the existing teen permission principle.
```

---

## PRD-04 (Shell Routing & Layouts)

### 1. Journal Sub-Page Routes

Add to the routing section:

```
### Journal Container Routes
The Journal page is a container with nested sub-page routes:
- /journal — Main timeline (all entry types aggregated)
- /journal/reflections — Reflections sub-page
- /journal/commonplace — Commonplace sub-page
- /journal/gratitude — Gratitude sub-page (filtered view)
- /journal/kid-quips — Kid Quips sub-page (filtered view)

Sub-pages use tab navigation within the Journal container. 
The shell sidebar shows "Journal" as a single nav item; 
sub-pages are accessed via tabs within the Journal page, 
not separate sidebar entries.
```

---

## Summary

| PRD | Number of Changes | Complexity |
|-----|-------------------|-----------|
| PRD-05 (LiLa Core) | 4 changes | Medium — context assembly, action chip references, table note |
| PRD-05 Planning Addendum | 1 change | Light — reference update |
| PRD-05C (Optimizer) | 1 change | Light — new section on Notepad integration |
| PRD-06 (Guiding Stars) | 1 change | Light — source tracking columns if missing |
| PRD-07 (InnerWorkings) | 1 change | Light — stub status update |
| PRD-02 (Permissions) | 1 change | Medium — new permission pattern |
| PRD-04 (Shell Routing) | 1 change | Light — sub-page routes |

---

*End of PRD-08 Cross-PRD Impact Addendum*
