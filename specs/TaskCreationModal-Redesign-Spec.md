# Task Creation Modal — Redesign Spec for Claude Code

**Type:** Implementation spec — ready for Claude Code
**Priority:** Highest — this is the #1 blocker for beta testing
**Reference:** PRD-09A (Tasks), PRD-17 (Universal Queue), v1 TaskCreationModal.tsx
**Files to modify:** `src/components/tasks/TaskCreationModal.tsx` and sub-components

---

## Executive Summary

The current v2 TaskCreationModal is a dense 2-column layout with tiny pill selectors, hidden sections behind "More options," and no guided flow. It needs to be rebuilt as a linear, full-width, section-card form that walks mom through task creation like a conversation — matching v1's intuitive guided flow while keeping v2's data model, TypeScript types, batch processing, and advanced features (RoutineSectionEditor, UniversalScheduler, opportunity sub-types).

---

## Modal Container

### Desktop
- Centered overlay, `max-width: 750px`
- `max-height: 90vh`, `overflow-y: auto` on the body
- Background: `var(--color-bg-primary)`
- Border-radius: `var(--vibe-radius-modal)` on all corners
- Shadow: `var(--shadow-lg)` or `0 8px 32px rgba(0,0,0,0.3)`
- Backdrop: `var(--color-bg-overlay)` or `rgba(0,0,0,0.5)`
- Close on backdrop click, close on Escape key

### Mobile
- Bottom-sheet: slides up from bottom
- Border-radius: `var(--vibe-radius-modal)` on top corners only, 0 on bottom
- `max-height: 92dvh`
- Swipe-down to dismiss (future enhancement, not MVP)

---

## Modal Header

**Gradient header bar** — this is the signature v1 pattern:

```css
.task-modal-header {
  background: var(--gradient-primary);
  /* Fallback when gradient toggle OFF: */
  /* background: var(--color-btn-primary-bg); */
  padding: 1rem 1.25rem;
  color: var(--color-text-on-dark, white);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--vibe-radius-modal) var(--vibe-radius-modal) 0 0;
}
```

- Title: "New task" (or "Edit task" when editing) in `var(--font-heading)`, `font-size: 1.25rem`, `font-weight: 600`
- Source label when from queue: subtitle text, `font-size: 0.85rem`, `opacity: 0.9` (e.g., "Request from Jake", "From Notepad")
- Close button: circular, `background: rgba(255,255,255,0.2)`, `border-radius: 50%`, white X icon, `36px` square
- Batch progress bar: sits below the title/subtitle when in batch mode, uses `var(--color-btn-primary-bg)` fill on `var(--color-bg-secondary)` track

### Gradient Toggle Awareness
Check `theme_preferences.gradient_enabled`:
- ON: `background: var(--gradient-primary)`
- OFF: `background: var(--color-btn-primary-bg)` (solid)

---

## Section Card Pattern

Every form section uses this consistent card wrapper:

```css
.form-section-card {
  background: color-mix(in srgb, var(--color-bg-card) 90%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--vibe-radius-card);
  padding: 1.25rem;
  margin-bottom: 0.75rem;
}

.form-section-heading {
  color: var(--color-btn-primary-bg);
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
```

Icons in section headings use Lucide at 18px, colored `var(--color-btn-primary-bg)`.

---

## Section Order (Top to Bottom)

### 1. Task Name (not in a card — sits directly in the body)

```
[What needs to be done?                              ]
```

- Full-width text input, `font-size: 1rem`, `font-weight: 500`
- `autofocus` on modal open
- Padding: `0.75rem`
- Border: `1px solid var(--color-border)`, focus: `var(--color-border-focus)` + glow ring
- No label needed — the placeholder is the label
- Pre-populated from `queueItem.content` when from queue

---

### 2. Task Basics (section card)

**Heading:** (Lucide `FileText` icon) "Task Basics"

**Fields:**

**Description textarea:**
- Label: "Description & Instructions"
- `rows={3}`, resizable
- Helper text: "Describe what needs to be done. TaskBreaker can turn this into step-by-step subtasks."
- Pre-populated from `queueItem.requester_note` when source is `member_request`

**TaskBreaker AI Preview (inline, below description):**
- Background: `color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))`
- Border-radius: `var(--vibe-radius-input)`
- Padding: `1rem`
- Heading: "TaskBreaker AI" in `var(--color-btn-primary-bg)`, `font-size: 0.95rem`, `font-weight: 600`
- Helper: "Based on your description, TaskBreaker can create smart subtasks..."
- Two buttons:
  - "Generate Subtasks" — primary small button, calls AI (stub for beta: mock subtasks based on description keywords)
  - "Organize as Checklist" — secondary small button, splits description by sentences/bullets
- Results area: checkbox list of generated subtasks, each clickable to expand mini-steps
- Collapsed by default if description is empty; auto-shows when description has 30+ characters

**Duration picker:**
- Label: "Time Duration (Optional)"
- Use existing `DurationPicker` component or a select dropdown: No time limit, 5 min, 10 min, 15 min, 20 min, 30 min, 45 min, 1 hour, 1.5 hours, 2 hours, Custom
- Helper text: "Set a time limit only if needed (like 30 minutes of reading practice)"

**Life Area Tag:**
- Label: "Life Area (Optional)"
- Use existing `LifeAreaTagPicker` component
- Helper text: "Helps organize tasks by area of life"

---

### 3. Task Type (section card)

**Heading:** (Lucide `Layers` icon) "Task Type"

**Type selector — large toggle buttons with descriptions:**

Replace `PillSelect` with a 2×2 grid of larger buttons. Each button:
- Padding: `0.75rem`
- Border: `1.5px solid var(--color-border)`, active: `1.5px solid var(--color-btn-primary-bg)`
- Border-radius: `var(--vibe-radius-input)`
- Active background: `color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))`
- Layout: icon (14px) + bold label on one line, description on second line

```
┌──────────────────────┐  ┌──────────────────────┐
│ ☑ Task               │  │ ☐ Routine            │
│ One-time or recurring │  │ Multi-step checklist  │
│ responsibility        │  │ with sections         │
└──────────────────────┘  └──────────────────────┘
┌──────────────────────┐  ┌──────────────────────┐
│ ☐ Opportunity        │  │ ☐ Habit              │
│ Optional — earn      │  │ Track consistency     │
│ rewards, no pressure │  │ over time             │
└──────────────────────┘  └──────────────────────┘
```

**Expandable "Types Explained" section:**
- Below the type buttons
- Trigger: "What's the difference?" text link with chevron
- Styled in `var(--color-btn-primary-bg)`
- Expanded content: tinted background card explaining each type and when to use it vs Lists
- Collapsed by default

**Contextual sub-sections:**
- When **Routine** selected: `RoutineSectionEditor` renders below (existing component, keep as-is)
- When **Opportunity** selected: opportunity sub-type config renders below (existing `TaskTypeSelector` opportunity section)

**Smart default when type changes:**
- Routine → `incompleteAction` defaults to `'fresh_reset'`
- All others → `incompleteAction` defaults to `'auto_reschedule'`

---

### 4. Who's Responsible (section card)

**Heading:** (Lucide `Users` icon) "Who's Responsible?"

**Replace `MemberChips` with checkbox rows:**

Each family member gets a full-width row:
```
┌──────────────────────────────────────────────┐
│ [✓] Gideon (Age 12) — Independent            │
│ [ ] Miriam (Age 9) — Guided                  │
│ [ ] Ruthie (Age 7) — Guided                  │
│ [ ] Noah (Age 4) — Play                      │
│ ─────────────────────────────────────────────│
│ [ ] Whole Family                              │
└──────────────────────────────────────────────┘
```

- Checkbox: `accent-color: var(--color-btn-primary-bg)`
- Name: `var(--color-text-primary)`, `font-weight: 600`, `font-size: var(--font-size-sm)`
- Age + access level: `var(--color-text-secondary)`, `font-size: var(--font-size-xs)`
- "Whole Family" separated by a `1px solid var(--color-border)` divider
- Toggling "Whole Family" clears individual selections and vice versa
- If opened from a member request, pre-select the requesting member

---

### 5. Schedule (section card)

**Heading:** (Lucide `Calendar` icon) "How Often?"

**Primary selector — radio buttons with descriptions:**

```
○ One-Time — Something that needs to be done once
○ Daily — Repeats every day (like morning routines)
○ Weekly — Repeats on specific days each week
○ Custom — Define your own schedule
```

Radio styling:
- `accent-color: var(--color-btn-primary-bg)`
- Label: `var(--color-text-primary)`, `font-weight: 500`
- Description (after em-dash): `var(--color-text-secondary)`, `font-weight: 400`
- Spacing: `0.75rem` gap between options

**Contextual detail pickers:**

- **One-Time selected:** Show date picker inline below
  ```
  Date: [____/____/________]
  ```

- **Weekly selected:** Show day-of-week chips (keep existing `DayChips` component)
  ```
  Days: (Su) (M) (Tu) (W) (Th) (F) (Sa)
  ```

- **Custom selected:** Show "Open full scheduler" button → opens `UniversalScheduler` in a nested modal or inline expansion

- **Daily selected:** No additional picker needed

---

### 6. If Not Completed (section card)

**Heading:** (Lucide `AlertCircle` icon) "What happens if not completed?"

**Radio buttons with full descriptions:**

```
○ Auto-Disappear — Task vanishes if not done; fresh start each day
  (great for daily routines)

○ Auto-Reschedule — Moves to next available day
  (helpful for important but flexible tasks)

○ Fresh Reset — Counter resets; try again next cycle
  (good for habits and routines)

○ Drop After Date — Disappears after a specific date passes

○ Reassign Until Done — Keeps reassigning until someone completes it

○ Ask Me — Goes to your review queue for a manual decision
  (best for school/deadline tasks)

○ Escalate — Flags for parent review
```

Same radio styling as Schedule section. Helper text below the section heading: "What should happen when the scheduled time passes and the task isn't done?"

---

### 7. Rewards & Tracking (section card)

**Heading:** (Lucide `Gift` icon) "Rewards & Completion Tracking"

**Always visible — NOT behind MoreSection.**

**Reward type:** Dropdown select
- Options: None, then family reward types from `getFamilyRewardTypes()`, with fallback defaults (Stars, Points, Money, Special Privilege, Family Reward)
- Uses existing v2 semantic tokens for the select element

**Reward amount:** Text input (visible only when type ≠ "None")
- Helper text: "How much does completing this task earn?"

**Checkboxes:**
- [ ] Require parent approval before reward
- [ ] Track this task as a dashboard widget
- [ ] Flag completion as a Victory

**Bonus config (visible only when reward type is set):**
- Bonus threshold: number input with "%" suffix, default 85
  - Helper: "What completion percentage triggers a bonus?"
- Bonus percentage: number input with "%" suffix, default 20
  - Helper: "How much extra on top of the base reward?"

---

### 8. Template (not a card — simple row at bottom)

```
[ ] Save as a reusable template in your Studio library
```

- Checkbox + label, plain row, no card wrapper
- When checked, show template name input below:
  - Placeholder: "e.g. Weekly Bedroom Clean, Daily Reading Practice..."
  - Helper: "Name it something descriptive so you can find it later"

---

### 9. Footer (sticky at bottom of modal)

```css
.task-modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
  flex-shrink: 0;
}
```

- **Cancel:** secondary button, `var(--color-text-primary)` text, transparent background, border
- **Create Task:** primary button with gradient (when ON), `font-weight: 600`
- In batch mode, "Create Task" becomes "Save & Next" with the batch progress indicator

---

## Quick Mode Toggle

When opened from QuickTasks "Add Task" or from the Studio Queue Sort tab for simple items, the modal opens in Quick Mode.

**Quick Mode shows only:**
- Task name input
- Assign to (dropdown or checkbox rows)
- When (radio: One-Time with date / Recurring with day chips)
- [Save] button (creates with all other fields defaulted)
- [Full mode →] text link that expands to the full section-card layout

**Quick Mode → Full Mode preserves all entered data.**

**Quick Mode toggle:** Small segmented control in the header area: `[Quick | Full]`

---

## Data Model

Keep the existing `CreateTaskData` interface from v2 unchanged:

```typescript
interface CreateTaskData {
  title: string
  description: string
  durationEstimate: string
  customDuration: string
  lifeAreaTag: string
  customLifeArea: string
  imageUrl?: string
  taskType: TaskType
  opportunitySubType?: string
  maxCompletions?: string
  claimLockDuration?: string
  claimLockUnit?: string
  routineSections?: RoutineSection[]
  assignments: MemberAssignment[]
  wholeFamily: boolean
  rotationEnabled: boolean
  rotationFrequency: string
  schedule: SchedulerOutput | null
  incompleteAction: IncompleteAction
  reward: RewardConfigData
  saveAsTemplate: boolean
  templateName: string
  sourceQueueItemId?: string
  sourceBatchIds?: string[]
}
```

No data model changes. This is purely a UI restructure.

---

## Components to Keep From v2

- `RoutineSectionEditor` — keep as-is, renders when type=routine
- `DurationPicker` — keep or replace with simpler select dropdown
- `LifeAreaTagPicker` — keep as-is
- `UniversalScheduler` — keep as advanced option under Custom schedule
- `TaskTypeSelector` opportunity sub-type section — extract and inline
- `RewardConfig` data types — keep the data model, rebuild the UI into the section card
- `BulkAddWithAI` in RoutineSectionEditor — keep as-is
- Batch processing logic (`batchMode`, `batchItems`, `batchIndex`) — keep all logic

---

## Components to Remove or Replace

| Remove | Replace With |
|---|---|
| `PillSelect` for task type | 2×2 toggle button grid with descriptions |
| `MemberChips` for assignment | Full-width checkbox rows with name/age/role |
| `PillSelect` for incomplete action | Radio buttons with descriptions |
| `MoreSection` component usage | Direct rendering of all sections in scroll flow |
| Quick-day-chips as primary schedule selector | Radio buttons as primary, day chips as secondary |
| Bottom-sheet modal on desktop | Centered overlay modal |
| Plain text header | Gradient header bar |

---

## CSS Token Compliance

Every visual property must use CSS variables. Specifically:

- All backgrounds: `var(--color-bg-*)` or `var(--gradient-*)`
- All text colors: `var(--color-text-*)`
- All borders: `var(--color-border*)` 
- All radii: `var(--vibe-radius-*)`
- All shadows: `var(--shadow-*)`
- All font families: `var(--font-heading)` or `var(--font-body)`
- All font sizes: `var(--font-size-*)` or explicit rem values
- Gradient toggle: check before applying `var(--gradient-primary)`
- Accent/interactive colors: `var(--color-btn-primary-bg)`, never hardcoded

---

## Verification Checklist

After implementation:

- [ ] Modal opens centered on desktop, bottom-sheet on mobile
- [ ] Gradient header bar visible with heading font and white text
- [ ] All 8 sections render as full-width stacked cards (no 2-column grid)
- [ ] Task type uses large buttons with descriptions, not pills
- [ ] Assignment uses checkbox rows with name/age/role, not chips
- [ ] Schedule uses radio buttons with descriptions as primary selector
- [ ] Incomplete action uses radio buttons with descriptions
- [ ] Rewards section is always visible, not behind "More"
- [ ] TaskBreaker AI preview area is visible in Task Basics section
- [ ] Helper text appears below description, duration, life area, and other non-obvious fields
- [ ] "Types Explained" expandable section works
- [ ] Quick Mode toggle works and preserves data when switching to Full
- [ ] Batch mode still works (progress bar, sequential items)
- [ ] No hardcoded hex colors in the component (grep for `#[0-9a-fA-F]`)
- [ ] Modal respects gradient toggle (solid fallback when OFF)
- [ ] All existing TypeScript types and data flow unchanged
