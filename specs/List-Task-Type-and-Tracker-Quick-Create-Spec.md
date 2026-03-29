# List Task Type & Tracker Quick-Create — Feature Spec

**Type:** Feature addition spec for Claude Code
**Scope:** Adds "List" as a 5th task type in the Task Creation Modal + adds "Tracker" as a 7th Quick Create action
**Dependencies:** TaskCreationModal (Session 1 rebuild), QuickCreate (Session 2), Universal Scheduler (Session 3 redesign), Sequential Collections (PRD-09A Screen 6), Widget system (PRD-10)
**Reference PRDs:** PRD-09A (Tasks), PRD-09B (Lists/Studio), PRD-10 (Widgets/Trackers)

---

## PRD Reconciliation Decisions (Founder-Confirmed 2026-03-28)

These decisions override the spec text where they differ.

| # | Question | Decision |
|---|----------|----------|
| 1 | Batch mode `task_type` | `'task'` with `source = 'list_batch'` — standalone tasks, lineage via source field |
| 2 | Sequential delivery child tasks | `task_type = 'sequential'` — reuse PRD-09A infrastructure, single code path |
| 3 | New list `list_type` for task-linked lists | `'todo'` default — no new enum, `linked_list_id` distinguishes |
| 4 | Emoji in tracker quick-picks | Lucide icons per convention: Droplets, BookOpen, Music, CheckSquare, Activity |
| 5 | Visualization picker depth | 5 main types (tally, streak, percentage, checklist, habit grid) — full catalog via Customize |
| 6 | List-checklist dashboard expansion | Inline chevron accordion — collapsed shows progress, expanded shows checkable rows |
| 7 | Sequential path reuse | Same as #2 — child tasks get `task_type='sequential'`, link to `sequential_collections` |
| 8 | Parse method for freeform list | Both: instant line-split default + "Smart Parse" button for AI (Haiku `ai-parse`) |

**Dashboard rendering detail (Q6):**
- Collapsed: card with `>` chevron left, `ListChecks` icon, progress "1 of 4" right
- Expanded: `v` chevron, inline checkable rows, other cards push down
- Inline editing for mom: tap text to edit, checkbox to complete, "Add item" at bottom, drag to reorder
- No modal, no page navigation

---

## Part 1: "List" as a 5th Task Type

### Task Type Grid Update

The Task Type section card in the Task Creation Modal adds a 5th button. The layout shifts from a 2×2 grid to a 2×2 + 1 full-width row:

```
┌──────────────────────┐  ┌──────────────────────┐
│ ✓ Task               │  │ ↻ Routine            │
│ One-time or recurring │  │ Multi-step checklist  │
│ responsibility        │  │ with sections         │
└──────────────────────┘  └──────────────────────┘
┌──────────────────────┐  ┌──────────────────────┐
│ ★ Opportunity        │  │ ↗ Habit              │
│ Optional — earn      │  │ Track consistency     │
│ rewards, no pressure │  │ over time             │
└──────────────────────┘  └──────────────────────┘
┌─────────────────────────────────────────────────┐
│ ☰ List                                           │
│ Assign a checklist or ordered series of items    │
└─────────────────────────────────────────────────┘
```

Same styling as the existing 4 buttons: icon + bold label + description line, border, active state with primary color tint. The 5th button is full-width to balance the grid visually.

### Database: Add 'list' to task_type enum

Add `'list'` to the task_type CHECK constraint on the `tasks` table. The actual list items are stored in the existing `lists` / `list_items` tables (PRD-09B schema). The `tasks` record links to the list via a new column:

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS
  linked_list_id UUID REFERENCES lists(id) ON DELETE SET NULL;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS
  list_delivery_mode TEXT CHECK (list_delivery_mode IN ('checklist', 'batch', 'sequential'));
```

When `task_type = 'list'`:
- `linked_list_id` points to the list
- `list_delivery_mode` controls how items surface
- The Universal Scheduler controls when items surface (same as any other task type)
- Assignment works the same way (checkbox rows for family members)

### "List" Sub-Section (expands inline when List is selected)

When the user selects "List" as the task type, an inline sub-section expands below the type buttons (same pattern as Routine expanding to show RoutineSectionEditor, or Opportunity expanding to show sub-type config):

#### Decision 1: Which List?

```
┌─ List Source ───────────────────────────────────────┐
│                                                     │
│  ○ Choose an existing list                          │
│    [Select a list...                           ▾]   │
│                                                     │
│  ○ Create a new list                                │
│    ┌────────────────────────────────────────────┐   │
│    │ List name: [Monthly phone calls        ]   │   │
│    │                                            │   │
│    │ Items (freeform — type, paste, or brain    │   │
│    │ dump and AI will sort it into items):      │   │
│    │ ┌────────────────────────────────────────┐ │   │
│    │ │ Call insurance company about renewal   │ │   │
│    │ │ Call pediatrician to schedule checkup  │ │   │
│    │ │ Verify diaper prescription on the 25th │ │   │
│    │ │ Follow up on orthodontist referral     │ │   │
│    │ │                                        │ │   │
│    │ └────────────────────────────────────────┘ │   │
│    │ [Parse into items]  or  items auto-parse   │   │
│    │ on blur/submit                             │   │
│    └────────────────────────────────────────────┘   │
│                                                     │
│  ○ Import from image                                │
│    [📷 Upload photo]                                │
│    (table of contents, lesson plan, curriculum,     │
│     any list — AI extracts items)                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Existing list dropdown:** Shows all lists for this family from the `lists` table. Displays list name + item count + list type (shopping, to-do, custom, etc.). Selecting one loads its items for preview.

**Create new list — freeform entry:** A textarea where the user can:
- Type bullet points (one per line)
- Paste a copied list from any source
- Brain dump a paragraph ("I need to call the insurance company, and also the pediatrician, oh and verify the diaper prescription renewal happens on the 25th, and follow up on that orthodontist thing")

Below the textarea, a "Parse into items" button (or auto-parse on blur) sends the text through AI extraction (same Haiku-based parsing used by MindSweep/Review & Route). The parsed items appear as an editable list below:

```
┌────────────────────────────────────────────────────┐
│  Parsed Items (4):                                  │
│  ≡ Call insurance company about renewal        [×]  │
│  ≡ Call pediatrician to schedule checkup       [×]  │
│  ≡ Verify diaper prescription on the 25th      [×]  │
│  ≡ Follow up on orthodontist referral          [×]  │
│                                                     │
│  [+ Add item]  [↕ Reorder]                          │
│                                                     │
│  ✓ 4 items ready                                    │
└────────────────────────────────────────────────────┘
```

Each item is editable inline (click to edit text), removable (× button), and reorderable (drag handle or move up/down buttons). User can also add items manually with [+ Add item].

**Import from image:** Upload button opens the device camera or file picker. The image is sent through AI vision extraction (same OCR pipeline as calendar event image intake, stubbed if not yet built). Extracted items appear in the same editable list format for review.

#### Decision 2: How Should Items Be Delivered?

```
┌─ Delivery Mode ─────────────────────────────────────┐
│                                                     │
│  ○ Checklist — Assign as one task with a checklist  │
│    (all items visible, check off as you go)         │
│                                                     │
│  ○ Batch — Each item becomes its own task           │
│    (all assigned at once as individual tasks)        │
│                                                     │
│  ○ Sequential — Items drip-feed 1-2 at a time       │
│    (next item appears when the current one is done)  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Radio buttons with descriptions (matching the v1/v2 pattern used everywhere in the task modal).

**Checklist mode:**
- Creates ONE task record with `task_type = 'list'`, `list_delivery_mode = 'checklist'`, `linked_list_id` pointing to the list
- On the assignee's dashboard, it renders as a single task card with the list name as the title
- Clicking the task card expands to show all list items as checkable rows
- Progress tracked as items are checked off (e.g., "3 of 12 done")
- Scheduling via Universal Scheduler controls when the task appears and recurrence (the "monthly phone calls checklist on the 25th" use case)

**Batch mode:**
- Creates MULTIPLE task records, one per list item
- Each task has `task_type = 'task'` (standard), `source = 'list_batch'`, and a reference to the source list
- All tasks share the same assignment and scheduling configuration
- Each appears as its own task card on the assignee's dashboard
- Good for "here are 5 errands that each need to get done"

**Sequential mode:**
- Creates a sequential collection (using the existing `sequential_collections` table from PRD-09A)
- Items drip-feed according to the schedule
- On the assignee's dashboard, only the current active item(s) are visible
- When the current item is completed, the next one surfaces on the next scheduled day
- Scheduling determines WHEN next items surface (e.g., MWF for science curriculum)
- Uses existing `sequential_is_active`, `sequential_position`, `sequential_collection_id` fields on the `tasks` table

#### Decision 3: Schedule

The existing Schedule section card (Universal Scheduler with radio-button interface) handles this. No changes needed. The schedule meaning varies by delivery mode:

| Delivery Mode | What the Schedule Controls |
|---|---|
| Checklist | When the checklist task appears + recurrence (e.g., "every month on the 25th" = monthly reset) |
| Batch | When all individual tasks are due / recurrence for the batch |
| Sequential | When the NEXT item in the sequence surfaces (e.g., "Weekly on MWF" = new item every Mon, Wed, Fri) |

### Expandable "Types Explained" Update

The existing "What's the difference?" expandable section should add the List type:

> **Lists** are assigned checklists or ordered sequences. A packing list for a trip, a monthly phone call checklist, a science curriculum with chapters that drip-feed one at a time. Choose whether all items are visible at once, each becomes its own task, or items appear in sequence.

### "Types Explained" Full Updated Text

> **Tasks** are one-time or recurring responsibilities. Take out the trash, return library books, call the dentist.
>
> **Routines** are multi-step checklists with sections on different schedules — daily, weekly, or custom. Build once, deploy to any child. Resets fresh each period.
>
> **Opportunities** are optional jobs kids can browse and claim to earn rewards. No pressure, no guilt.
>
> **Habits** track consistency over time. Focus on showing up, not perfection.
>
> **Lists** are assigned checklists or ordered sequences. Packing lists, monthly call lists, curriculum chapters that drip-feed one at a time. Choose how items are delivered — all at once, each as its own task, or one by one in order.

---

## Part 2: Tracker Quick-Create

### Quick Create Menu Update

Add "Tracker" as the 7th action in the Quick Create popover:

```typescript
const QUICK_ACTIONS = [
  { key: 'task', label: 'Add Task', icon: CheckSquare, action: 'openTaskQuickMode' },
  { key: 'note', label: 'Quick Note', icon: StickyNote, action: 'openNotepad' },
  { key: 'victory', label: 'Log Victory', icon: Trophy, action: 'openVictoryMini' },
  { key: 'event', label: 'Calendar Event', icon: CalendarPlus, action: 'openEventCreation' },
  { key: 'request', label: 'Send Request', icon: HandHelping, action: 'openRequestMini' },
  { key: 'tracker', label: 'Track Something', icon: BarChart3, action: 'openTrackerQuickCreate' },
  { key: 'sweep', label: 'Mind Sweep', icon: Brain, action: 'openMindSweep' },
] as const
```

### Tracker Quick-Create Modal

Opens as a **persistent modal** (gradient header, size `sm`, `id: 'tracker-create'`). Minimizable — user might want to check what trackers already exist before creating a new one.

**Flow (matches PRD-10 Screen 5 "Track This" flow but in modal form):**

```
┌───────────────────────────────────────────┐
│ ██████ Track Something ████████  ─   X  │
├───────────────────────────────────────────┤
│                                           │
│  What do you want to track?               │
│  [Water intake                         ]  │
│                                           │
│  Quick picks:                             │
│  (💧 Water)(📖 Reading)(🎹 Practice)     │
│  (✅ Chores)(🏃 Exercise)                │
│                                           │
│  ─────────────────────────────────────── │
│                                           │
│  Visualization:                           │
│  [Progress Bar ▾]                         │
│  (or thumbnail carousel of variants)      │
│                                           │
│  Assign to: [Me              ▾]           │
│                                           │
│  Size: [S] [M•] [L]                      │
│                                           │
│         [Customize later →]               │
│                                           │
│              [Cancel]  [Add to Dashboard]  │
└───────────────────────────────────────────┘
```

**Fields:**
- **What to track** — text input, required. Quick-pick pills below for common tracker types (auto-suggested based on family context).
- **Visualization** — dropdown or thumbnail carousel showing visual variants appropriate for the entered tracker type. Defaults to the tracker type's `defaultVariant`. Can be changed later.
- **Assign to** — member dropdown (defaults to self). Mom can assign to any member.
- **Size** — S/M/L segmented control (defaults to M).
- **"Customize later →"** — text link that saves with defaults and opens the full Widget Configuration (PRD-10 Screen 4) for this widget. This is the escape hatch for complex configuration (goal amounts, reset periods, multiplayer, celebration types, etc.) without cluttering the quick-create flow.
- **"Add to Dashboard"** — creates the widget with the specified config and deploys it to the assigned member's dashboard.

**What happens on "Add to Dashboard":**
- Creates a `dashboard_widgets` record with the template_type, visual_variant, title, size, assigned member
- Widget appears on the target member's dashboard at the next available grid position
- If the user didn't customize (used defaults), the tracker works with sensible defaults (no goal, manual entry, no reset period)
- The user can always tap the widget later to configure it further

**"Customize later →" flow:**
- Saves the basic widget record (same as "Add to Dashboard")
- Then opens the full Widget Configuration modal (PRD-10 Screen 4) pre-populated with what was entered
- User can set goal amounts, reset periods, data sources, multiplayer, celebration types, etc.
- This is a persistent modal, so it can be minimized if needed

### Shell Visibility for Tracker Quick-Create

| Shell | Tracker in Quick Create |
|---|---|
| Mom | Yes |
| Adult | Yes |
| Independent | Yes (can create trackers for self) |
| Guided | No (Quick Create not available in Guided) |
| Play | No (Quick Create not available in Play) |

---

## Part 3: Integration Notes

### List Type + Existing Systems

**MindSweep/Review & Route:** When MindSweep extracts items and the user routes them to Tasks with the "Sequential" structure flag, it should create a sequential collection using the same pathway as the List task type's sequential mode. This is the same code path — MindSweep deposits into `studio_queue` with `destination = 'task'` and `structure = 'sequential'`, which the Task Creation Modal handles when processing queue items.

**Studio Templates:** List-type tasks can be saved as templates in Studio (the existing "Save as template" checkbox). A "Monthly Phone Calls" list template would save the list items + delivery mode + schedule, ready to redeploy.

**Smart Notepad "Send to → Tasks":** When routing notepad content to Tasks, the structure picker already has "Sequential" as an option. The List task type gives this a proper home — the routed items become a list with sequential delivery.

### Tracker Quick-Create + Existing Systems

**Notepad "Send to → Track This":** Already exists as a routing destination (PRD-10 Screen 5). The Tracker Quick-Create modal is the same flow, just triggered from Quick Create instead of the Notepad.

**LiLa "Track This" action chip:** When LiLa suggests tracking something during conversation, the action chip opens the same Tracker Quick-Create modal, pre-populated with the suggested tracker name.

**Dashboard "Add Widget" button:** The existing widget picker (PRD-10 Screen 3) is the full browsing experience. Tracker Quick-Create is the fast path for "I just want to start tracking water intake right now."

---

## Verification Checklist

### List Task Type
- [ ] "List" appears as 5th button in the Task Type grid (full-width bottom row)
- [ ] Selecting "List" expands inline sub-section with 3 decisions
- [ ] "Choose existing list" dropdown shows all family lists with name + count
- [ ] "Create new list" shows freeform textarea + "Parse into items" button
- [ ] Freeform text parses into editable item list (AI extraction or line-by-line split)
- [ ] "Import from image" upload triggers OCR extraction (stub if not built)
- [ ] Parsed items are editable (inline edit, remove, reorder, add)
- [ ] Delivery mode radio: Checklist / Batch / Sequential with descriptions
- [ ] Checklist mode creates one task with `linked_list_id` + renders as checkable list on dashboard
- [ ] Batch mode creates individual tasks per item
- [ ] Sequential mode creates a sequential collection with schedule-based item surfacing
- [ ] Schedule section (Universal Scheduler) works with all 3 delivery modes
- [ ] "What's the difference?" includes List type description
- [ ] `tasks.linked_list_id` and `tasks.list_delivery_mode` columns exist
- [ ] `task_type` enum includes `'list'`

### Tracker Quick-Create
- [ ] "Track Something" appears as 7th action in Quick Create popover
- [ ] Clicking opens a persistent modal (gradient header, size `sm`)
- [ ] Title input + quick-pick pills + visualization picker + assign-to + size
- [ ] "Add to Dashboard" creates widget and deploys to assigned member's dashboard
- [ ] "Customize later →" saves basic widget then opens full Widget Configuration
- [ ] Widget appears on dashboard after creation
- [ ] Modal is minimizable (persistent type)
