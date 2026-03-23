# PRD-21 Cross-PRD Impact Addendum
## Communication & Relationship Tools — Impact on Existing PRDs

**Created:** March 14, 2026
**Parent PRD:** PRD-21 (Communication & Relationship Tools)

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- QuickTasks strip gains 3 new button types with sub-selection behavior: Love Languages (opens popover with 5 tool options), Cyrano (direct launch), Higgins (opens mode picker with 2 options).
- This introduces a new QuickTask interaction pattern: grouped buttons with popover/bottom-sheet sub-menus.
- AI Toolbox added as a new sidebar navigation section for all dashboard shells (Mom, Adult, Independent, Guided — not Play).

**Action needed:**
- Add "popover" and "mode picker" as QuickTask button interaction types alongside the existing "direct action" type.
- Add AI Toolbox section to sidebar route configuration for applicable shells.
- Note that AI Toolbox section visibility is dynamically filtered by `lila_tool_permissions`.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- Guided modes can now specify a preferred UI container. The drawer-for-mom / modal-for-others default is now understood as a default that individual modes can override.
- All 8 mode keys already registered. No new registrations needed.
- Person pill selector pattern established for tool conversation headers.

**Action needed:**
- Add `container_preference: 'modal' | 'drawer' | 'default'` to the guided mode registry schema. All 8 relationship tool modes set to `'modal'`.
- Note person pill selector as a reusable guided mode header component.
- Note mode switching within modals as a supported pattern.

---

## Impact on PRD-08 (Journal + Smart Notepad)

**What changed:**
- Gratitude tool creates `journal_entries` with `entry_type = 'gratitude'` via "Save to Journal" action chip.
- Higgins Navigate creates `journal_entries` with `entry_type = 'journal_entry'` via same pattern.

**Action needed:**
- Verify journal creation API supports external callers specifying `entry_type`, `life_area_tag`, and `metadata`.
- Note Gratitude and Higgins Navigate as journal entry sources.

---

## Impact on PRD-09A (Tasks) and PRD-09B (Lists)

**What changed:**
- Quality Time, Gifts, Observe & Serve, Words of Affirmation, and Higgins Navigate use "Create Task" action chip.
- Gifts tool uses "Add to Gift Ideas List" action chip to create list items.

**Action needed:**
- Verify task and list item creation APIs support external callers with source metadata.
- Note relationship tools as task and list creation sources.

---

## Impact on PRD-13 (Archives & Context)

**What changed:**
- Veto memory pattern: negative-preference context items saved via context learning write-back.
- Wishlist integration: Gifts tool links to person's wishlist folder.
- "How to Reach Me" card confirmed as high-priority context for ALL 8 tools.

**Action needed:**
- Consider adding `is_negative_preference` flag or "avoid" category for negative-preference items.
- Verify wishlist folder and item APIs support external callers.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- "Send via Message" action chip on Cyrano and Higgins Say opens compose flow with pre-filled text.
- Coaching integration stub partially wired.

**Action needed:**
- Verify compose flow accepts pre-filled body text from external callers.
- Mark coaching integration stub as partially wired.

---

## Impact on PRD-19 (Family Context & Relationships)

**What changed:**
- AI Toolbox stub partially wired (sidebar section + 8 defaults + permission filtering).
- Name resolution, "How to Reach Me" card, relationship notes, and private notes all confirmed as tool context sources.

**Action needed:**
- Mark AI Toolbox stubs as partially wired. Full wiring depends on PRD-21A.
- Mark relationship note loading and "How to Reach Me" high-priority loading as wired.

---

## Summary of Stubs Affected

### Stubs Now WIRED

| Stub | Created By | Wired By |
|------|-----------|----------|
| Relationship tools person-context adaptation | PRD-05 | PRD-21 — all 8 tools use person context |
| Gift wishlists linked from Gifts guided mode | PRD-05 | PRD-21 — "Add to Wishlist" action chip |
| Higgins/Cyrano/etc. living in AI Toolbox | PRD-19 | PRD-21 — all 8 tools in Toolbox + QuickTasks |

### Stubs PARTIALLY WIRED

| Stub | Created By | Status |
|------|-----------|--------|
| AI Toolbox page + per-member tool assignment | PRD-19 | Sidebar section created. Vault-based assignment = PRD-21A. |
| Higgins/Cyrano coaching integration | PRD-15 | "Send via Message" works. Checkpoint trigger = post-MVP. |

### Stubs Created by PRD-21

| Stub | Wires To | When |
|------|----------|------|
| AI Vault browse + "+Add to AI Toolbox" | PRD-21A | Next PRD |
| ThoughtSift tools in AI Toolbox | Future PRD | When written |
| Homework Helper / Teen tools | Future PRD | When written |
| Cyrano growth tracking and export | Post-MVP | Based on usage |
| Dedicated per-tool data tables | Post-MVP | Based on beta feedback |

---

*End of PRD-21 Cross-PRD Impact Addendum*