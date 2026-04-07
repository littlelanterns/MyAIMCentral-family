# Quick Capture Notes — April 6, 2026
## Ideas surfaced during PRD-09A/09B audit fix session

**Status:** Concept Capture — future development
**Touches:** PRD-09B (Lists), PRD-11 (Victory Recorder), PRD-22 (Settings)
**Related:** PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum, PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum (all three April 6, 2026 planning session artifacts)

---

## Capture 1: Living Shopping List Enhancement

**Status:** Concept Capture — not yet scheduled
**Touches:** PRD-09B (Lists)

### The Idea

The shopping list should be a persistent, ongoing list rather than a one-shot checklist. Things flow in and out continuously. The list is always there.

### Key Behaviors

- **Always-on list:** The shopping list never "completes" — it's a living document. Family members bulk-add items as needed throughout the week.
- **Store-aware routing:** Items auto-sort to the appropriate store/section (this already exists — AI Shopping Organizer is wired per the audit).
- **Purchased items stay visible:** When an item is checked off (purchased), it remains visible with strikethrough styling for a user-configurable duration (24, 48, or 72 hours). After that period, it moves to the "Recently Purchased" tab.
- **Recently Purchased tab:** Shows items purchased in the last week (or user-configurable longer period). Useful for "did we already buy that?" checks and for LiLa context.
- **Auto-archive:** Past purchases auto-delete (or archive) after a user-selected amount of time. Keeps the list clean without manual cleanup.
- **Purchase history feeds LiLa:** Over time, the purchase history builds context for LiLa — brand preferences, shopping frequency, typical quantities, store preferences. This connects to the Cookbook/Smart Scanning addendum's receipt intelligence concept.
- **Bulk add from anywhere:** Family members can add items quickly from any context — QuickTasks strip, LiLa conversation, MindSweep capture, or directly on the list.

### How This Differs from Current Design

Current PRD-09B shopping list is a standard checklist: create list, add items, check them off, eventually archive the list. The living shopping list treats the list as permanent infrastructure, not a disposable artifact.

### Schema Implications

- `list_items.checked_at` already exists — used to calculate visibility duration
- New: `lists.checked_item_visibility_hours` (INTEGER, default 48) — how long checked items remain visible
- New: `lists.purchase_history_days` (INTEGER, default 7) — how long items appear in Recently Purchased tab
- New: `lists.auto_archive_days` (INTEGER, default 30) — how long before purchased items are permanently archived
- Alternatively, these could be user-level preferences in Settings (PRD-22) rather than per-list

### Connection to Other Features

- Cookbook/Smart Scanning addendum: receipt scanning feeds purchase history
- LiLa context assembly: purchase patterns inform meal planning and shopping suggestions
- Smart Shopping Lists (already built per audit): store-aware grouping already works

---

## Capture 2: Backburner & Ideas Activation as Victory

**Status:** Concept Capture — wire when Backburner activation paths are built
**Touches:** PRD-09B (Backburner addendum), PRD-11 (Victory Recorder)

### The Idea

When mom (or any member) activates a Backburner or Ideas item — turning it into a task, a Best Intention, a Guiding Star, or routing it somewhere actionable — that activation moment is victory-worthy. "I finally acted on that idea I had 3 months ago" is a celebration of decisiveness and follow-through.

### Behavior

- When a Backburner item is activated (not released/deleted, but actually routed to an actionable destination), auto-create a victory with:
  - `source = 'backburner_activated'`
  - `source_reference_id` = the Backburner item ID (or the new item it became)
  - Description: "Activated '[item title]' from your Backburner — from idea to action!"
- Same for Ideas list items that get promoted to tasks or other features:
  - `source = 'idea_activated'`
  - Description: "Turned your idea '[item title]' into action!"
- The victory narrative should celebrate the *decision to act*, not just the completion. Backburner items might sit for months — the courage to finally move on them is the win.

### When to Build

Wire this when the Backburner activation paths (one-tap routing from Backburner to Task/Best Intention/Guiding Star/Studio Queue) are built. The activation path creates the destination item AND creates the victory record in the same flow.

### Tone

Per Victory Recorder philosophy — sincerity over enthusiasm. "You've been sitting on this for a while. Today you decided to move. That's worth noticing." Not "AMAZING! YOU DID IT!"

---

*Captured during PRD-09A/09B audit fix session, April 6, 2026*
