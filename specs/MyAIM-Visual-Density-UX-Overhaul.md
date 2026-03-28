# MyAIM Family v2 — Visual Density & UX Overhaul

**Type:** Implementation Requirements for Claude Code
**Priority:** High — blocks beta testing (kids won't use the app until task creation flow is intuitive)
**Scope:** App-wide visual density fixes + task creation flow redesign + new UX patterns
**Reference PRDs:** PRD-03 (Design System), PRD-04 (Shell Routing), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks), PRD-09B (Lists/Studio), PRD-17 (Universal Queue)

---

## Context for the Build Agent

MyAIM Family v2 has a systemic visual density problem. Every surface uses the same generous spacing — browsing grids, settings panels, creation forms, and navigation all use 1.5-2rem padding, 2rem grid gaps, and fixed card heights designed for worst-case content. The result is an app that feels oversized and empty despite having a lot of features. Meanwhile, the task creation modal went the opposite direction — cramming form sections into a dense 2-column grid with tiny pill selectors that lost the guided, intuitive flow of v1.

This document specifies the exact changes needed across the app, organized by priority. Every change must use CSS custom properties from the existing PRD-03 design system — zero hardcoded hex values.

---

## Part 1: Density Tier System (New App-Wide Pattern)

### 1.1 Add a `--density` CSS Custom Property

Add a density multiplier system that components consume for spacing. This goes in the ThemeProvider alongside existing token generation.

```
--density-multiplier: 1;        /* default: comfortable */
--density-multiplier-compact: 0.7;
--density-multiplier-tight: 0.5;
```

Each page/surface sets its density class on its wrapper element:

```css
.density-comfortable { --density-multiplier: 1; }
.density-compact     { --density-multiplier: 0.7; }
.density-tight       { --density-multiplier: 0.5; }
```

Components that consume spacing tokens multiply:
```css
.section-padding {
  padding: calc(var(--spacing-md) * var(--density-multiplier));
}
.grid-gap {
  gap: calc(var(--spacing-md) * var(--density-multiplier));
}
```

### 1.2 Surface-to-Density Mapping

| Surface Type | Density | Examples |
|---|---|---|
| Creation flows & forms | `comfortable` | Task Creation Modal, list creation, journal entry editing, family setup |
| Content consumption | `comfortable` | Tutorial detail view, journal reading, LiLa chat, journal entry detail |
| Browsing & navigation | `compact` | Studio, AI Vault, Archives, Command Center, dashboard widgets |
| Control panels & settings | `tight` | Theme selector panel, filter bars, inline config panels, permission editors |
| Data lists & tables | `compact` | Task lists, queue items, notification lists, history views |

### 1.3 Implementation Notes

- The density class is set on the page-level wrapper, NOT globally
- Shell token overrides (Play = larger, Guided = moderate) still apply ON TOP of density — density reduces spacing, shell overrides increase touch targets. They compose.
- The `--density-multiplier` does NOT affect `--touch-target-min` — touch targets are governed by shell, not density
- Add `density-compact` and `density-tight` utility classes to App.css

---

## Part 2: Card Size Variants (Shared Component Enhancement)

### 2.1 Add `size` Prop to Shared Card Component

The Card component in `src/components/shared/` needs a `size` prop:

```typescript
interface CardProps {
  size?: 'sm' | 'md' | 'lg';
  // ...existing props
}
```

| Size | Internal Padding | Text Size | Use Case |
|---|---|---|---|
| `sm` | `0.75rem` (12px) | `var(--font-size-xs)` for body | Studio templates, vault browse cards, queue items |
| `md` | `1rem` (16px) | `var(--font-size-sm)` for body | Dashboard widgets, task cards, list items |
| `lg` | `1.5rem` (24px) | `var(--font-size-base)` for body | Form section cards, detail views, modal content panels |

### 2.2 Remove All Fixed Card Heights

These specific fixed heights must be removed and replaced with content-driven sizing:

| File | Current | Replace With |
|---|---|---|
| `Library.css` `:root` | `--card-height: 360px;` | Remove entirely |
| `Library.css` `.card-content` | `height: 200px;` | `min-height: 0;` (let content drive) |
| `Library.css` `.tutorial-card` | `height: var(--card-height);` | Remove `height`, keep `width` but reduce to `240px` |
| `CommandCenter.css` `.grid-container` | `minmax(300px, 1fr)` | `minmax(200px, 1fr)` |

Add a shared `max-height` constraint with overflow for cards that might have unbounded content:
```css
.card-content-bounded {
  max-height: 280px;
  overflow: hidden;
}
```

---

## Part 3: Specific CSS Fixes by Surface

### 3.1 AI Vault / Library

**File:** `src/components/Library/Library.css`

| Property | Current Value | New Value | Reason |
|---|---|---|---|
| `--card-width` | `280px` | `220px` | Fits more cards per row |
| `--card-height` | `360px` | Remove | Content-driven |
| `.library-header` padding | `30px 20px` | `16px` | Header is informational, not a hero |
| `.library-header` margin-bottom | `30px` | `16px` | Reduce gap before content |
| `.card-content` height | `200px` | Remove | Let text determine height |
| `.card-content` padding | `15px` | `12px` | Tighter card internals |
| `.category-row` margin-bottom | `30px` | `16px` | Reduce between categories |
| `.featured-section` margin-bottom | `30px` | `16px` | Same |
| `.card-image-container` height | `160px` | `120px` | Reduce image dominance |
| `.card-title` font-size | `1.1rem` | `0.95rem` | Proportional to smaller card |
| `.card-description` font-size | `0.9rem` | `0.8rem` | Proportional |
| `.library-title` font-size | `2.2rem` | `1.5rem` | Less headline dominance |

Also: Replace all hardcoded hex colors in Library.css (`#666`, `#333`, `#f0f0f0`, `#e0e0e0`, etc.) with CSS variable equivalents (`var(--color-text-secondary)`, `var(--color-text-primary)`, `var(--color-bg-secondary)`, `var(--color-border)`).

### 3.2 Command Center

**File:** `src/pages/CommandCenter.css`

| Property | Current Value | New Value |
|---|---|---|
| `.grid-container` gap | `2rem` | `1rem` |
| `.grid-container` grid-template-columns | `minmax(300px, 1fr)` | `minmax(200px, 1fr)` |
| `.card` padding | `1.5rem` | `1rem` |
| `.command-center h1` margin-bottom | `2rem` | `1rem` |
| `.card h3` font-size | `1.5rem` | `1.15rem` |

Also: Replace hardcoded `#68a395`, `#eee`, `#333`, `white` with CSS variables.

### 3.3 Theme Selector Panel

The theme selector is built with inline styles/Tailwind, not a dedicated CSS file. These changes apply to the ThemeSelector component:

- **MODE buttons (Light/Dark/Auto/Gradient):** Reduce from large pill buttons to a compact segmented control. Each segment: `padding: 0.375rem 0.75rem`, `font-size: 0.8rem`. The gradient toggle can be a small switch beside the segmented control, not a full-width button.
- **COLOR THEME swatches:** Reduce grid gap from current spacing to `6px`. Swatch circles can go from ~48px to ~36px diameter. Theme name text below each swatch: `font-size: 0.65rem`.
- **Mood category sections:** Reduce section label margin to `4px` bottom, `12px` top. When collapsed, the section row (label + count + chevron) should be ~32px tall, not ~48px.
- **VIBE selector:** Change from 2×2 large button grid to a single horizontal row of compact pills: `padding: 0.375rem 0.75rem`, `font-size: 0.8rem`. One row, four items.
- **SIZE selector (S/M/L/XL):** Reduce to a single compact segmented control, same style as MODE.
- **Overall panel:** If the panel is a right-side drawer or popover, cap its width at `280px` and add `overflow-y: auto` with compact internal padding (`12px`).

### 3.4 Studio Templates Page

The Studio template cards need the `size="sm"` Card treatment:

- Card internal padding: `0.75rem`
- Icon size inside card: `20px` (not `32px`+)
- Card title: `var(--font-size-sm)` (`0.875rem`)
- Card description: `var(--font-size-xs)` (`0.75rem`), max 3 lines with `-webkit-line-clamp: 3`
- Grid gap between template cards: `0.75rem`
- Category heading ("Task & Chore Templates"): `var(--font-size-sm)`, `font-weight: 600`, with count badge tight to the text
- "EXAMPLE TEMPLATES" collapsible section: same compact treatment

### 3.5 Family Dashboard Header

**File:** `src/components/dashboard/modes/family/FamilyModeDashboard.css`

| Property | Current | New |
|---|---|---|
| `.family-dashboard-header` padding | `2rem` | `1.25rem` |
| `.family-dashboard-title` font-size | `2rem` | `1.5rem` |
| `.family-widgets-grid` gap | `1.5rem` | `1rem` |

### 3.6 Global Modal Padding

**File:** `src/styles/global.css` (v1 pattern) or inline modal styles

All modals except creation-flow modals should use tighter padding:

| Element | Current | New (browsing/settings modals) | New (creation flow modals) |
|---|---|---|---|
| `.modal-content` | `25-30px` | `16px` | `20px` |
| `.modal-header` | `20-25px` | `12px 16px` | `16px 20px` |

### 3.7 Global `min-height` Fix

**File:** `src/App.css`

Current rule applies 44px min-height to ALL interactive elements:
```css
button, a, input, select, textarea {
  min-height: var(--touch-target-min, 44px);
}
```

Replace with scoped rules:
```css
/* Primary interactive elements get full touch target */
button:not(.btn-icon):not(.btn-chip):not(.btn-inline),
input[type="text"], input[type="email"], input[type="password"],
input[type="number"], input[type="date"],
textarea, select {
  min-height: var(--touch-target-min, 44px);
}

/* Small UI elements get reduced minimum */
.btn-icon, .btn-chip, .btn-inline,
button[aria-label*="Move"],
button[aria-label*="Remove"],
button[aria-label*="Close"] {
  min-height: 28px;
}
```

---

## Part 4: Task Creation Modal Redesign

This is the highest priority individual component. The v2 modal needs to be restructured to follow v1's guided, linear flow while keeping v2's data model and advanced features.

### 4.1 Layout Change: Stacked Full-Width Sections

Remove the 2-column grid layout. Replace with full-width stacked section cards.

**Modal container:**
- Desktop: centered, `max-width: 750px`, vertically centered with `max-height: 90vh`, overflow-y scroll
- Mobile: bottom-sheet (slides up from bottom)
- Background: `var(--color-bg-primary)` or theme background
- Border-radius: `var(--vibe-radius-modal)` (top corners on mobile, all corners on desktop)

**Modal header:**
- Background: `var(--gradient-primary)` when gradient ON, `var(--color-btn-primary-bg)` when OFF
- Text: `var(--color-text-on-dark)` or white
- Font: `var(--font-heading)`, `1.25rem`, `font-weight: 600`
- Subtitle showing source label when from queue: `font-size: 0.85rem`, `opacity: 0.9`
- Close button: circular, `rgba(255,255,255,0.2)` background, white icon
- Padding: `1rem 1.25rem`
- Batch progress bar sits below the header text when in batch mode

**Section card pattern (used for each form section):**
```css
.form-section-card {
  background: color-mix(in srgb, var(--color-bg-card) 90%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--vibe-radius-card);
  padding: var(--spacing-lg);  /* 1.5rem — forms breathe */
  margin-bottom: var(--spacing-md);  /* 1rem between sections */
}

.form-section-heading {
  color: var(--color-btn-primary-bg);
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);  /* 0.5rem */
}
```

### 4.2 Section Order (Top to Bottom)

1. **Task name** (full-width input, always visible, autofocus)
2. **Task Basics** section card — description textarea, duration picker, life area tag, TaskBreaker AI preview
3. **Task Type** section card — type selector with inline descriptions, expandable "Types Explained" section
4. **Who's Responsible** section card — checkbox rows with name/age/role, Whole Family option
5. **Schedule** section card — radio buttons (One-Time, Daily, Weekly, Custom) with descriptions, contextual detail pickers
6. **If Not Completed** section card — radio buttons with descriptions for each incomplete action
7. **Rewards & Tracking** section card — reward type selector, amount, approval toggle, tracking options
8. **Template** section (not a card — just a checkbox row) — "Save as reusable template" with optional name field
9. **Footer** — Cancel + Create Task buttons, sticky at bottom

### 4.3 Task Type Selector — Larger Buttons with Descriptions

Replace the `PillSelect` with larger toggle buttons. Each type gets an icon, name, and one-line description:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│ ☐ Task                  │  │ ☐ Routine               │
│ One-time or recurring   │  │ Multi-step checklist     │
│ responsibility          │  │ with sections            │
└─────────────────────────┘  └─────────────────────────┘
┌─────────────────────────┐  ┌─────────────────────────┐
│ ☐ Opportunity           │  │ ☐ Habit                 │
│ Optional — earn rewards │  │ Track consistency over   │
│ without pressure        │  │ time                     │
└─────────────────────────┘  └─────────────────────────┘
```

Below the type selector, add an expandable "Types Explained" section:
- Trigger: text link with chevron, styled in `var(--color-btn-primary-bg)`
- Content: explanation of Tasks vs Routines vs Opportunities vs Habits vs Lists
- Background: `color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))`
- Keep it collapsed by default

When "Routine" is selected, the RoutineSectionEditor appears below the type selector within the same section card.

When "Opportunity" is selected, the opportunity sub-type config (from existing `TaskTypeSelector.tsx`) appears below.

### 4.4 Assignment — Checkbox Rows, Not Chips

Replace `MemberChips` with full-width checkbox rows:

```
┌──────────────────────────────────────────┐
│ ☑ Gideon (Age 12) — Independent          │
│ ☐ Miriam (Age 9) — Guided                │
│ ☐ Ruthie (Age 7) — Guided                │
│ ☐ Noah (Age 4) — Play                    │
│ ─────────────────────────────────────────│
│ ☐ Whole Family                            │
└──────────────────────────────────────────┘
```

Each row:
- Checkbox with `accent-color: var(--color-btn-primary-bg)`
- Name in `var(--color-text-primary)`, `font-weight: 600`
- Age and access level in `var(--color-text-secondary)`, `font-size: var(--font-size-xs)`
- "Whole Family" separated by a divider line, clears individual selections when toggled

### 4.5 Schedule — Radio Buttons with Descriptions

Replace quick-day-chips with radio buttons as the primary selector:

```
○ One-Time — Something that needs to be done once
○ Daily — Repeats every day (like morning routines)
○ Weekly — Repeats on specific days each week
○ Custom — Specific dates, intervals, or flexible timing
```

When "Weekly" is selected, show the day-of-week chips (Su M Tu W Th F Sa) inline below.
When "Custom" is selected, show the "Open full scheduler" button that opens `UniversalScheduler`.
When "One-Time" is selected, show a date picker inline.

Each radio option:
- Radio input with `accent-color: var(--color-btn-primary-bg)`
- Label: `var(--color-text-primary)`, `font-weight: 600`
- Description after the em-dash: `var(--color-text-secondary)`, `font-weight: 400`

### 4.6 Incomplete Action — Same Radio Pattern

```
○ Auto-Disappear — Task vanishes if not done; fresh start each day (great for daily routines)
○ Auto-Reschedule — Moves to next available day (helpful for important but flexible tasks)
○ Fresh Reset — Counter resets; try again next cycle (good for habits and routines)
○ Drop After Date — Disappears after a specific date passes
○ Reassign Until Done — Keeps reassigning until someone completes it
○ Ask Me — Goes to your review queue for a manual decision
○ Escalate — Flags for parent review
```

### 4.7 Rewards — Visible Section Card, Not Collapsed

Remove the `MoreSection` wrapper. Show the rewards section card directly in the flow. Use the existing `RewardConfig` component's data model but present fields in the v1 card layout:

- Reward type: dropdown (None, then family reward types, with fallback defaults)
- Amount/value: text input (visible only when type ≠ none)
- Require approval: checkbox with label
- Track as widget: checkbox with label
- Flag as victory: checkbox with label
- Bonus threshold/percentage: visible only when reward type is set (progressive disclosure within the section, not hidden behind "More")

### 4.8 TaskBreaker AI Preview — Restored

In the "Task Basics" section card, below the description textarea, add the TaskBreaker preview area:

- Background: `color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))`
- Heading: "TaskBreaker AI Preview" in `var(--color-btn-primary-bg)`
- Helper text: "Based on your description, TaskBreaker can break this into smart subtasks..."
- Two buttons side by side:
  - "Generate Subtasks Preview" — primary style, calls AI to generate subtask suggestions
  - "Organize as Checklist" — secondary style, splits description into checkable items
- Results render inline as checkbox list items
- Each subtask is clickable to expand into mini-steps (nested list)

For MVP/beta, the AI call can be stubbed (mock data or simple text splitting). The UI and interaction pattern should be fully built.

### 4.9 Remove the MoreSection Pattern

Delete the `MoreSection` component usage from the task creation modal entirely. All sections are visible in the scroll flow. Description, life area tag, duration — all of these move into the "Task Basics" section card. Rewards get their own section card. Template save gets its own row at the bottom.

### 4.10 Helper Text on Fields

Add small helper text (`var(--color-text-secondary)`, `var(--font-size-xs)`) below these fields:

| Field | Helper Text |
|---|---|
| Task name | (no helper — it's obvious) |
| Description | "Describe what needs to be done. TaskBreaker can turn this into step-by-step subtasks." |
| Duration | "Set a time limit only if needed (like 30 minutes of reading practice)" |
| Life area tag | "Optional — helps organize tasks by area of life" |
| Schedule > Custom | "For complex schedules like 'every other Wednesday' or 'first Monday of each month'" |
| Incomplete action | "What should happen when the scheduled time passes and the task isn't done?" |
| Reward amount | "How much does completing this task earn?" |
| Bonus threshold | "What completion percentage triggers a bonus? (Default: 85%)" |
| Template name | "Name it something descriptive, like 'Weekly Bedroom Clean' or 'Daily Reading Practice'" |

---

## Part 5: Quick Create Strip

### 5.1 Persistent Quick Create Button

Add a "+" floating action button or a persistent button in the QuickTasks strip that opens a mini creation popover. This is NOT the full Task Creation Modal — it's a lightweight entry point for the most common actions.

**Location:** Rightmost position in the QuickTasks horizontal strip (top of main content area), or as a small FAB in the bottom-right corner on mobile.

**What it opens:** A compact popover/dropdown with 6 quick actions:

```
┌─────────────────────────┐
│  + Quick Create          │
│  ─────────────────────  │
│  📋 Add Task             │
│  📝 Quick Note           │
│  ✅ Log Victory          │
│  📃 Add to List          │
│  🗓️ Calendar Event       │
│  💭 Mind Sweep            │
└─────────────────────────┘
```

(Use Lucide icons in build, not emoji — emoji shown here for wireframe clarity only.)

**Behavior per action:**

| Action | What Happens |
|---|---|
| Add Task | Opens Task Creation Modal in Quick Mode (name + assign + date only) |
| Quick Note | Opens Smart Notepad drawer with a new tab, or focuses existing tab |
| Log Victory | Opens Victory creation mini-modal (title + who + optional description) |
| Add to List | Opens a compact modal: list picker dropdown + item text input |
| Calendar Event | Opens EventCreationModal |
| Mind Sweep | Opens Smart Notepad in MindSweep mode (voice capture + auto-sort) |

### 5.2 Quick Mode on Task Creation Modal

When opened from Quick Create "Add Task", the Task Creation Modal opens in Quick Mode (already specified in PRD-17 Screen 7). Quick Mode shows only:

- Task name (required)
- Assign to (family member dropdown + "Whole family")
- When (toggle: one-time with date picker / recurring with day selector)
- [Save] button (creates with sensible defaults)
- [Full mode →] link (expands to full section-card layout)

Quick Mode uses comfortable density (it's still a creation flow) but with fewer fields. The modal is shorter and faster.

---

## Part 6: Journal Page Clarification

### 6.1 Journal Is a Read/Edit Surface, Not a Creation Surface

The Journal page (`/journal`) is an organized reading and inline-editing surface for entries that were created elsewhere (primarily via Smart Notepad routing).

**The "+" button on the Journal page opens the Smart Notepad drawer** — it does NOT open an inline creation form on the Journal page itself.

### 6.2 Journal Entry Display

Each journal entry in the timeline/list should support:

- **Inline viewing:** Entry content visible in the list (expandable for long entries)
- **Inline editing:** Tap/click an entry to enter edit mode with light rich text (bold, italic, bullet lists)
- **Light rich text rendering:** Entries preserve the formatting applied in Smart Notepad
- **Entry type badge:** Visual badge showing the entry type (Quick Note, Reflection, Commonplace, Gratitude, Kid Quip)
- **Source indicator:** Small text showing where the entry came from ("From Notepad", "From LiLa", "From Review & Route")
- **Routed-to badges:** If the entry was also routed to other destinations, show small badges ("Also in: Tasks, Calendar")

### 6.3 Journal Sub-Page Navigation

The Journal container has internal tabs for filtered views:

- **All** — aggregated timeline of all entry types
- **Reflections** — filtered to `entry_type = 'reflection'`
- **Commonplace** — filtered to `entry_type = 'commonplace'`
- **Gratitude** — filtered to `entry_type = 'gratitude'`
- **Kid Quips** — filtered to `entry_type = 'kid_quip'`

These tabs sit below the page header. Active tab has `var(--color-btn-primary-bg)` underline.

### 6.4 Rich Text Capabilities

All journal entries support light rich text:
- Bold, italic, underline
- Bullet lists and numbered lists
- No images, no tables, no headings — this is capture text, not a document editor
- The same Tiptap editor configuration used in Smart Notepad should be used for inline journal editing
- Content is stored as HTML or Tiptap JSON in the `journal_entries.content` column

---

## Part 7: Spotlight Search (Cmd+K)

### 7.1 Global Search Modal

Add a keyboard-triggered spotlight search accessible from anywhere in the app.

**Trigger:** `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux), or tap the search icon in the sidebar header.

**What it searches:**
- Feature names (sidebar nav items) — "Tasks", "Journal", "Studio", etc.
- Task titles
- List names and items
- Journal entry content (first 200 chars)
- Vault item titles
- Victory titles
- Family member names (navigates to their dashboard via View As)

**UI:**
- Centered modal overlay, `max-width: 500px`
- Large search input at top with autofocus
- Results appear below as the user types (debounced 200ms)
- Results grouped by category (Features, Tasks, Journal, Vault, etc.)
- Arrow keys navigate results, Enter opens the selected result
- Escape closes the modal
- Use `var(--color-bg-card)` background, `var(--shadow-lg)` shadow

**Implementation notes:**
- Start with client-side search across already-loaded data
- Future: add server-side full-text search via Supabase `to_tsvector` / `plainto_tsquery`
- The search index should be built lazily (not on every page load)

---

## Part 8: Collapsible Sidebar Sections

### 8.1 Section Collapse Behavior

The sidebar has ~15 nav items across 6 sections. On screens where the sidebar is visible but the nav requires scrolling, section headers should be collapsible.

**Default state:** The section containing the currently active page is expanded. All other sections show only the section header (collapsed). This reduces visible nav from ~15 items to ~6 section headers + the active section's children.

**Interaction:**
- Click a section header to expand/collapse
- Expanding one section does NOT auto-collapse others (user controls all)
- Section collapse state persists per session (not persisted to database — resets on page reload)
- When user navigates to a page in a collapsed section, that section auto-expands

**Visual:**
- Section headers: `text-transform: uppercase`, `font-size: var(--font-size-xs)`, `letter-spacing: 0.05em`, `color: var(--color-text-secondary)`, with a small chevron icon (right = collapsed, down = expanded)
- Collapsed section: shows only the header row (~24px height)
- Expanded section: header + all child nav items
- Smooth height transition on expand/collapse (`max-height` transition, 200ms)

**Sections (from PRD-04):**
1. Home — Dashboard, Command Center
2. Capture & Reflect — Journal, Morning Rhythm, Evening Review
3. Plan & Do — Tasks, Calendar, Widgets & Trackers, Lists, Studio
4. Grow — Guiding Stars, My Foundation, Victories, LifeLantern
5. Family — People & Relationships, Partner Profile, Family Management
6. AI & Tools — LiLa Optimizer, Library Vault, Archives, Knowledge Base

---

## Part 9: Tooltip Theming (Already Specced, Needs Enforcement)

### 9.1 All Tooltips Must Be Theme-Adaptive

Per CLAUDE.md item 43, tooltips use:
- Background: `var(--color-accent-deep)` (NOT black, NOT hardcoded)
- Text: `var(--color-text-on-primary)` (NOT white, NOT hardcoded)
- Border: `var(--color-border-default)`
- Border-radius: `var(--vibe-radius-input)`
- Desktop: hover with 300ms delay
- Mobile: long-press
- Auto-positioning via portal (never clipped by parent overflow)

### 9.2 Sidebar Hover Descriptions

Sidebar nav item tooltips (from PRD-04):
- When sidebar is expanded: tooltip appears on hover showing a short feature description (under 10 words)
- When sidebar is collapsed to icon strip: tooltip shows feature NAME + description
- These tooltips use the same theme-adaptive styling above

Audit all existing tooltip implementations and replace any that use hardcoded colors or the browser's default `title` attribute with the shared Tooltip component.

---

## Part 10: Frontend Design Skill (SKILL.md Draft)

Create a file at `/mnt/skills/user/myaim-frontend-design/SKILL.md` with the following content. This skill constrains Claude Code to the MyAIM design system rather than inventing new styles.

The skill should encode these rules:

1. **Zero hardcoded colors.** Every `color`, `background`, `border-color`, `box-shadow` color, `fill`, `stroke` must use `var(--*)` tokens. No hex, no rgb, no named colors.

2. **Density tiers.** Every new component or page must declare its density tier. Creation flows = comfortable. Browsing = compact. Settings = tight. Content reading = comfortable.

3. **Card sizes.** Use the shared Card component with size prop. Never set fixed pixel heights on cards.

4. **Section card pattern for forms.** Multi-field forms use the section card pattern: translucent card background, colored heading, generous internal padding, full-width fields.

5. **Gradient modal headers on primary modals.** Task creation, list creation, event creation, detail views — all get the gradient header with heading font and white text.

6. **Helper text on non-obvious fields.** Small gray text below the field explaining in plain language.

7. **Radio buttons with descriptions for exclusive non-obvious choices.** Never use tiny pills without descriptions for things like scheduling frequency or incomplete actions.

8. **Expandable inline explainers for terminology.** "Types Explained" pattern: text link + chevron, tinted background, paragraph descriptions.

9. **Touch target enforcement scoped by element type.** Primary inputs/buttons get full `--touch-target-min`. Icon buttons, chips, inline toggles get `28px` minimum.

10. **Lucide icons only in Mom/Adult/Independent/Guided shells.** Emoji only in Play shell.

11. **Shell token overrides compose with density.** Play shell's larger sizes apply on top of the surface's density tier.

12. **No global spacing overrides.** Don't use `!important` on spacing. Let the density system and component props handle it.

---

## Implementation Order

1. **App.css fixes** — global min-height scoping, add density utility classes (30 min)
2. **Card component size prop** — add `sm`/`md`/`lg` to shared Card (1 hour)
3. **Task Creation Modal redesign** — the highest-impact single change (4-6 hours)
4. **Theme selector compaction** — resize all controls (2-3 hours)
5. **Library/Vault card shrink** — remove fixed heights, reduce spacing (1-2 hours)
6. **Studio template card shrink** — apply `size="sm"` Card pattern (1 hour)
7. **Command Center density** — grid gap and card min-width fixes (30 min)
8. **Dashboard header compaction** — reduce padding and font sizes (30 min)
9. **Quick Create strip** — new component + mini-modals (3-4 hours)
10. **Sidebar collapsible sections** — section header collapse logic (2-3 hours)
11. **Spotlight search (Cmd+K)** — search modal + client-side index (3-4 hours)
12. **Tooltip audit** — replace all non-themed tooltips (1-2 hours)
13. **Frontend design SKILL.md** — create the skill file (1 hour)
14. **Journal page inline editing** — Tiptap rich text on entry detail (2-3 hours)

**Total estimate:** ~24-34 hours of implementation

---

## Verification Checklist

After implementation, verify:

- [ ] No page in the app uses hardcoded hex colors (run a grep for `#[0-9a-fA-F]{3,8}` in .tsx and .css files, excluding comments and SVG assets)
- [ ] Library cards render at content-driven heights (no 360px fixed)
- [ ] Studio template cards are visually compact (icon ~20px, tight padding)
- [ ] Theme selector panel fits in ~280px width without scrolling the controls themselves
- [ ] Task Creation Modal scrolls through full-width section cards with gradient header
- [ ] Every form field that isn't self-explanatory has helper text below it
- [ ] Task type, schedule, and incomplete action use radio buttons with descriptions
- [ ] Quick Create "+" is accessible from every page via QuickTasks strip
- [ ] Cmd+K opens spotlight search from any page
- [ ] Sidebar sections collapse/expand with current-page section auto-expanded
- [ ] All tooltips use theme-adaptive colors (test by switching themes)
- [ ] Journal "+" opens Smart Notepad, not an inline creation form
- [ ] Journal entries support inline rich text editing (bold, italic, bullets)
