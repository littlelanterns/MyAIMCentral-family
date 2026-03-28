# MyAIM Family — Remaining Implementation Specs

**Purpose:** Individual component/feature specs for Claude Code, covering everything NOT already covered by the four main documents (Visual Density Overhaul, Task Creation Modal, Calendar System, Modal System Architecture).

---

## Spec 1: Quick Create Component

**File:** `src/components/global/QuickCreate.tsx` (new)
**Depends on:** Shared Modal component, Task Creation Modal (Quick Mode), Smart Notepad context

### What It Is

A persistent "+" button in the QuickTasks strip that opens a compact popover with 6 quick-action shortcuts. It's the fastest path to creating anything in the app.

### Placement

- **Desktop:** Rightmost position in the QuickTasks horizontal strip, visually distinct from the auto-sorted action pills (slightly larger, circular, uses `var(--gradient-primary)` background)
- **Mobile:** Floating action button (FAB) in the bottom-right corner, `56px` diameter, above the bottom nav

### Popover Content

When clicked, a small transient modal / popover appears directly above the button:

```typescript
const QUICK_ACTIONS = [
  { key: 'task', label: 'Add Task', icon: CheckSquare, action: 'openTaskQuickMode' },
  { key: 'note', label: 'Quick Note', icon: StickyNote, action: 'openNotepad' },
  { key: 'victory', label: 'Log Victory', icon: Trophy, action: 'openVictoryMini' },
  { key: 'list-item', label: 'Add to List', icon: ListPlus, action: 'openListItemMini' },
  { key: 'event', label: 'Calendar Event', icon: CalendarPlus, action: 'openEventCreation' },
  { key: 'sweep', label: 'Mind Sweep', icon: Brain, action: 'openMindSweep' },
] as const
```

### Popover Styling

- Background: `var(--color-bg-card)`
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--vibe-radius-card)`
- Shadow: `var(--shadow-lg)`
- Width: `200px`
- Each action row: icon (18px) + label, `padding: 0.5rem 0.75rem`, hover background `var(--color-bg-secondary)`
- Divider lines between items: `1px solid var(--color-border)`
- Click outside closes popover

### Action Behaviors

| Action | What Happens |
|---|---|
| Add Task | Opens Task Creation Modal in Quick Mode (persistent modal, `id: 'task-create'`) |
| Quick Note | Opens Smart Notepad drawer (if closed) or creates new tab (if already open). Does NOT open a modal. |
| Log Victory | Opens a compact persistent modal (`id: 'victory-create'`, size `sm`): title input + who dropdown + optional description textarea + "Record Victory" button |
| Add to List | Opens a compact transient modal (size `sm`): list picker dropdown + item text input + "Add" button. Selected list persists for the session (remembers last-used list). |
| Calendar Event | Opens EventCreationModal as persistent modal (`id: 'event-create'`) |
| Mind Sweep | Opens Smart Notepad drawer in MindSweep mode (voice capture focus). If MindSweep PWA entry exists, can also navigate to `/sweep`. |

### Shell Visibility

| Shell | Quick Create Available |
|---|---|
| Mom | Yes — all 6 actions |
| Adult | Yes — all 6 actions |
| Independent | Yes — all except Mind Sweep (permission-gated) |
| Guided | No — uses simplified bottom nav actions |
| Play | No — uses large tile actions |

---

## Spec 2: Spotlight Search (Cmd+K)

**File:** `src/components/global/SpotlightSearch.tsx` (new)
**Context:** `src/contexts/SearchIndexContext.tsx` (new)
**Depends on:** Shared Modal component (transient, size `md`)

### Trigger

- **Desktop:** `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
- **All platforms:** Search icon button in the sidebar header (visible when sidebar is expanded) or in the collapsed icon strip
- **Mobile:** Search icon in the hamburger menu header

### Modal Behavior

Transient modal, size `md` (640px), no gradient header. Uses a custom minimal header that's just the search input itself.

### Layout

```
┌──────────────────────────────────────────┐
│  🔍 [Search MyAIM...                  ]  │
│  ─────────────────────────────────────── │
│                                          │
│  FEATURES                                │
│  📋 Tasks                                │
│  📅 Calendar                             │
│  📓 Journal                              │
│                                          │
│  RECENT TASKS                            │
│  ☐ Take out trash (Jake, Tue)            │
│  ☐ Math homework (Miriam, Today)         │
│                                          │
│  LISTS                                   │
│  🛒 Grocery List (12 items)              │
│  📦 Amazon Wishlist (5 items)            │
│                                          │
│  [Search tip: Try "Jake's tasks" or      │
│   "grocery" or "dentist"]                │
└──────────────────────────────────────────┘
```

### Search Input

- Full-width, large font (`var(--font-size-base)`), autofocus
- Lucide `Search` icon as prefix (inside the input)
- `Escape` clears input if text present, closes modal if empty
- Results appear below as user types (debounced 200ms)
- Placeholder: "Search MyAIM..."

### Result Categories (searched in this order)

| Category | Data Source | Result Format |
|---|---|---|
| Features | Static list of sidebar nav items | Icon + feature name + description |
| Tasks | `tasks` table (recent 50, title search) | Checkbox icon + title + assignee + due info |
| Lists | `lists` table (name search) | List icon + name + item count |
| Journal Entries | `journal_entries` table (first 200 chars, content search) | Entry type badge + first line + date |
| Vault Items | `vault_content` table (display_title search) | Content type badge + title |
| Victories | `victories` table (title search) | Trophy icon + title + date |
| Family Members | `family_members` table (display_name search) | Avatar + name + "View As" action (mom only) |

### Result Interactions

- **Click a Feature result:** Navigate to that route via sidebar
- **Click a Task result:** Open task detail (transient modal)
- **Click a List result:** Navigate to `/lists` with that list open
- **Click a Journal result:** Navigate to `/journal` scrolled to that entry
- **Click a Vault result:** Open vault detail (transient modal)
- **Click a Victory result:** Open victory detail
- **Click a Family Member result (mom):** Open View As modal for that member

### Keyboard Navigation

- `↓` / `↑` arrows move through results
- `Enter` opens the selected result
- `Tab` moves to next category
- `Escape` closes modal

### Empty State

When no results match: "No results for '[query]'. Try a different search term."

When modal first opens (no query): Show "Recent" section with last 5 accessed features/items.

### Implementation Notes

- Start with client-side search across React Query cached data
- Feature search is instant (static list)
- Database search uses existing hooks (`useTasks`, `useLists`, `useJournal`, etc.)
- Debounce database queries at 300ms (feature search at 0ms — instant)
- Future: add Supabase full-text search for large datasets
- Search index context provides a `search(query)` function that fans out to all sources

---

## Spec 3: Sidebar Collapsible Sections

**File:** Modify `src/components/shells/MomShell.tsx` (and equivalent shells) sidebar rendering
**State:** Session-only (not persisted to DB)

### Section Structure

From PRD-04's sidebar spec:

```typescript
const SIDEBAR_SECTIONS = [
  {
    key: 'home',
    label: 'Home',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: Home, route: '/dashboard' },
      { key: 'command-center', label: 'Command Center', icon: Compass, route: '/command-center' },
    ],
  },
  {
    key: 'capture',
    label: 'Capture & Reflect',
    items: [
      { key: 'journal', label: 'Journal', icon: BookOpen, route: '/journal' },
      { key: 'morning-rhythm', label: 'Morning Rhythm', icon: Sunrise, route: '/rhythms/morning' },
      { key: 'evening-review', label: 'Evening Review', icon: Moon, route: '/rhythms/evening' },
    ],
  },
  {
    key: 'plan',
    label: 'Plan & Do',
    items: [
      { key: 'tasks', label: 'Tasks', icon: CheckSquare, route: '/tasks' },
      { key: 'calendar', label: 'Calendar', icon: Calendar, route: '/calendar' },
      { key: 'widgets', label: 'Widgets & Trackers', icon: BarChart3, route: '/widgets' },
      { key: 'lists', label: 'Lists', icon: List, route: '/lists' },
      { key: 'studio', label: 'Studio', icon: Palette, route: '/studio' },
    ],
  },
  {
    key: 'grow',
    label: 'Grow',
    items: [
      { key: 'guiding-stars', label: 'Guiding Stars', icon: Star, route: '/guiding-stars' },
      { key: 'foundation', label: 'My Foundation', icon: Layers, route: '/inner-workings' },
      { key: 'victories', label: 'Victories', icon: Trophy, route: '/victories' },
      { key: 'life-lantern', label: 'LifeLantern', icon: Flame, route: '/life-lantern' },
    ],
  },
  {
    key: 'family',
    label: 'Family',
    items: [
      { key: 'people', label: 'People', icon: Users, route: '/people' },
      { key: 'partner', label: 'Partner Profile', icon: Heart, route: '/partner' },
      { key: 'management', label: 'Family Management', icon: Settings, route: '/family-management' },
    ],
  },
  {
    key: 'tools',
    label: 'AI & Tools',
    items: [
      { key: 'optimizer', label: 'LiLa Optimizer', icon: Sparkles, route: '/optimizer' },
      { key: 'vault', label: 'Library Vault', icon: Library, route: '/vault' },
      { key: 'archives', label: 'Archives', icon: Archive, route: '/archives' },
      { key: 'knowledge', label: 'Knowledge Base', icon: Database, route: '/knowledge-base' },
    ],
  },
] as const
```

### Collapse Behavior

```typescript
function useSidebarSections(currentRoute: string) {
  // Find which section contains the active route
  const activeSection = SIDEBAR_SECTIONS.find(section =>
    section.items.some(item => currentRoute.startsWith(item.route))
  )
  
  // State: which sections are expanded (session-only)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    // Default: only the section containing the current page
    return new Set(activeSection ? [activeSection.key] : ['home'])
  })

  // When route changes, auto-expand the section containing the new route
  useEffect(() => {
    if (activeSection && !expandedSections.has(activeSection.key)) {
      setExpandedSections(prev => new Set([...prev, activeSection.key]))
    }
  }, [currentRoute])

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return { expandedSections, toggleSection }
}
```

### Visual Design

**Section header (always visible):**
```css
.sidebar-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.75rem;
  cursor: pointer;
  user-select: none;
}

.sidebar-section-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.sidebar-section-chevron {
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
}

.sidebar-section-chevron.expanded {
  transform: rotate(90deg);
}
```

**Section children (expand/collapse):**
```css
.sidebar-section-items {
  overflow: hidden;
  transition: max-height 0.2s ease;
}

.sidebar-section-items.collapsed {
  max-height: 0;
}

.sidebar-section-items.expanded {
  max-height: 500px; /* large enough for any section */
}
```

**When sidebar is collapsed to icon strip:** Section headers are hidden. Only nav item icons are shown in a flat list (no grouping). Hovering shows feature name + description tooltip.

---

## Spec 4: Theme Selector Compaction

**File:** Modify the ThemeSelector component (likely in `src/components/settings/` or rendered from the appearance panel)

### Current Problems
- MODE buttons too large
- Color swatches have too much gap
- Mood category sections take too much vertical space
- VIBE selector is a 2×2 grid of large buttons
- SIZE selector is oversized

### Compacted Design

**Overall panel:** Max-width `280px`, internal padding `12px`, `overflow-y: auto`.

**MODE (Light/Dark/Auto + Gradient toggle):**
```
┌──────────────────────────────────────┐
│ MODE                                 │
│ [Light][Dark][Auto]    Gradient [●]  │
└──────────────────────────────────────┘
```
- Segmented control: 3 segments, each `padding: 0.25rem 0.625rem`, `font-size: 0.8rem`
- Gradient: small toggle switch (not a full button), inline to the right
- Total height: ~36px including label

**COLOR THEME:**
```
┌──────────────────────────────────────┐
│ COLOR THEME                          │
│ ▾ Original (9)                       │
│  (●)(●)(●)(●)                        │
│  (●)(●)(●)(●)                        │
│  (●)                                 │
│ ▸ Warm (7)  ▸ Cool (7)              │
│ ▸ Bold (6)  ▸ Soft (5)              │
│ ▸ Bright (6)  ▸ Seasonal (6)        │
└──────────────────────────────────────┘
```
- Swatch circles: `32px` diameter (down from ~48px), gap `6px`
- Theme name below swatch: `font-size: 0.6rem`, truncated
- Active swatch: `2px solid var(--color-btn-primary-bg)` ring
- Collapsed categories: single row showing label + count + chevron, `height: 28px`
- Expanded categories show their swatches in a 4-column grid
- Only the category containing the active theme is expanded by default

**VIBE:**
```
┌──────────────────────────────────────┐
│ VIBE                                 │
│ [Classic][Modern][Prof.][Cozy]       │
└──────────────────────────────────────┘
```
- Single horizontal row of 4 compact pills
- Each pill: `padding: 0.25rem 0.5rem`, `font-size: 0.75rem`
- Active pill: `var(--color-btn-primary-bg)` background, white text
- Total height: ~32px including label

**SIZE:**
```
┌──────────────────────────────────────┐
│ T SIZE                               │
│ [S][M][L][XL]                        │
└──────────────────────────────────────┘
```
- Segmented control: 4 segments, same compact style as MODE
- Total height: ~32px including label

**Total panel height:** Should be approximately 60-70% of current height. Most of the savings come from swatch size reduction, category collapse, and vibe selector going from 2×2 grid to single row.

---

## Spec 5: Hardcoded Color Audit & Fix

**Scope:** Every `.css` and `.tsx` file in the codebase

### What to Find

Run this grep to identify all hardcoded colors:
```bash
# In .tsx files (inline styles)
grep -rn "color: '#\|background: '#\|borderColor: '#\|fill: '#\|stroke: '#" src/ --include="*.tsx"

# In .css files
grep -rn "#[0-9a-fA-F]\{3,8\}" src/ --include="*.css" | grep -v "\/\*\|comment\|svg"

# Common hardcoded colors found in v2:
# #666, #333, #f0f0f0, #e0e0e0 — should be var(--color-text-secondary), etc.
# #68a395 — should be var(--color-btn-primary-bg) or var(--primary-color)
# #d4e3d9 — should be var(--color-border) or var(--accent-color)
# #5a4033 — should be var(--color-text-primary)
# #fff4ec — should be var(--color-bg-primary)
# white — should be var(--color-bg-card) or var(--color-text-on-dark)
# rgba(0,0,0,...) — acceptable for shadows, but border colors should use tokens
```

### Replacement Map

| Hardcoded | Replace With |
|---|---|
| `#68a395` | `var(--color-btn-primary-bg)` |
| `#d6a461` | `var(--color-accent)` or `var(--secondary-color)` |
| `#d4e3d9` | `var(--color-border)` or `var(--color-bg-secondary)` |
| `#5a4033` | `var(--color-text-primary)` |
| `#fff4ec` | `var(--color-bg-primary)` |
| `#333`, `#333333` | `var(--color-text-primary)` |
| `#666`, `#666666` | `var(--color-text-secondary)` |
| `#999` | `var(--color-text-secondary)` (with reduced opacity) |
| `#f0f0f0`, `#f8f8f8` | `var(--color-bg-secondary)` |
| `#e0e0e0` | `var(--color-border)` |
| `#eee` | `var(--color-border)` |
| `white`, `#fff`, `#ffffff` | `var(--color-bg-card)` (for backgrounds) or `var(--color-text-on-dark)` (for text on dark backgrounds) |
| `black`, `#000` | `var(--color-text-primary)` |

### Files Known to Have Issues

From our analysis:
- `src/components/Library/Library.css` — extensive hardcoded colors (#666, #333, etc.)
- `src/pages/CommandCenter.css` — #68a395, #eee, #333, white
- `src/styles/global.css` (v1 patterns) — rgba values with hardcoded color components
- `src/components/global/QuickActions.css` — #fff4ec, #5a4033
- Various dashboard mode CSS files

### Process

1. Run the grep commands above
2. For each file with findings, replace using the map
3. Test with 3+ different themes to verify nothing breaks
4. Test in dark mode to verify contrast

---

## Spec 6: Frontend Design SKILL.md Content

**File:** `.claude/skills/myaim-frontend-design/SKILL.md`

```yaml
---
name: myaim-frontend-design
description: "Use this skill whenever creating, modifying, or reviewing any UI component, 
CSS, or visual element in the MyAIM Family v2 codebase. Triggers include: creating new 
components, modifying styles, building modals or forms, adjusting spacing/padding, working 
with theme tokens, creating page layouts, or any task involving visual output."
---
```

### Rules (the constraint layer)

1. **Zero hardcoded colors.** Every `color`, `background`, `border-color`, `fill`, `stroke`, `box-shadow` color value must use `var(--*)` CSS custom properties. No hex, no rgb(), no named colors. The ONLY exception is `rgba(0,0,0,...)` for shadow definitions — and even those should prefer `var(--shadow-*)` tokens when possible.

2. **Density tiers.** Every new page or surface must declare its density class on its wrapper element. Creation flows and forms use `density-comfortable`. Browsing grids and navigation use `density-compact`. Settings panels and control surfaces use `density-tight`. Content reading surfaces use `density-comfortable`.

3. **Card sizes via prop.** Use the shared Card component with `size="sm"`, `size="md"`, or `size="lg"`. Never set fixed pixel heights on cards. Let content drive height. Studio/Vault browse = `sm`. Dashboard widgets = `md`. Form section cards = `lg`.

4. **Section card pattern for forms.** Multi-field forms use stacked full-width section cards: translucent card background (`color-mix(in srgb, var(--color-bg-card) 90%, transparent)`), colored section heading in `var(--font-heading)`, `1px solid var(--color-border)`, `var(--vibe-radius-card)` corners, generous internal padding (`1.25rem`).

5. **Gradient headers on primary modals.** All persistent (minimizable) modals get the gradient header: `var(--gradient-primary)` background (with solid fallback), `var(--font-heading)`, white/on-dark text, circular close button with translucent white background. Transient modals get a plain header with border-bottom.

6. **Helper text on non-obvious fields.** Every form field whose purpose isn't immediately obvious from its label gets helper text: `var(--color-text-secondary)`, `var(--font-size-xs)`, placed directly below the input with `4px` gap. Written in conversational plain language.

7. **Radio buttons with descriptions for exclusive non-obvious choices.** When options are mutually exclusive AND a user wouldn't know what to pick without context, use radio buttons where each option has a bold label and a description line. Never use tiny pills without descriptions for these cases. Chips/pills are fine for well-understood selections (days of week, family members by name).

8. **Expandable inline explainers for terminology.** For any place where the app introduces terminology that might confuse a first-time user (task types, list types, opportunity sub-types), add an expandable "What's the difference?" section: text link trigger in `var(--color-btn-primary-bg)`, expanded content in a tinted background card.

9. **Touch targets scoped by element type.** Primary interactive elements (buttons, inputs, selects) get `min-height: var(--touch-target-min)` (44px adult, 48px guided, 56px play). Icon buttons, chips, inline toggles, and filter pills get `min-height: 28px`. Never apply 44px minimum to every button globally.

10. **Lucide icons only in Mom/Adult/Independent/Guided shells.** No Unicode emoji as decoration, bullets, or status indicators. Play shell permits emoji. Icon size: 18-20px adult, 22-24px guided, 28-32px play.

11. **Shell token overrides compose with density.** When building for Guided or Play shells, the shell's larger font/spacing/touch-target overrides apply ON TOP of the surface's density tier. Density reduces base spacing; shell overrides increase it for accessibility. They multiply, not conflict.

12. **No `!important` on spacing.** Never use `!important` to override padding, margin, gap, or any spacing value. If spacing needs to be different, use the density system or component props. The density multiplier system exists specifically to avoid !important wars.

13. **Modal type correctness.** Use `type="persistent"` for creation/editing flows (task, event, list creation, template config, victory recording). Use `type="transient"` for read-only views, confirmations, pickers, and quick actions. Never build a one-off portal — always use the shared Modal component.

14. **Consistent modal patterns.** All persistent modals: gradient header, section-card body, sticky footer with Cancel + primary action. All transient modals: plain header with border, content body, optional footer. Both: backdrop click behavior per type, Escape key, focus trap, portal rendering.

---

## Summary: Complete Document Set for Claude Code

After this file, you have **five** implementation specs ready:

| # | Document | Covers |
|---|---|---|
| 1 | MyAIM-Visual-Density-UX-Overhaul.md | App-wide density fixes, CSS changes, journal clarification |
| 2 | TaskCreationModal-Redesign-Spec.md | Component-level task creation rebuild |
| 3 | Calendar-System-Build-Spec.md | Full calendar build from v1 patterns + v2 PRD |
| 4 | Modal-System-Architecture.md | Shared modal, minimize/restore, feature mapping |
| 5 | This file (Remaining-Implementation-Specs.md) | Quick Create, Spotlight Search, Sidebar Sections, Theme Compaction, Color Audit, SKILL.md |

**Build order recommendation:**
1. SKILL.md (constraint layer — 15 min)
2. Hardcoded color audit (mechanical find/replace — 1-2 hours)
3. Shared Modal component + ModalManagerContext (foundational — 3-4 hours)
4. Density system + Card size prop (foundational — 1-2 hours)
5. Task Creation Modal (highest impact — 4-6 hours)
6. Theme selector compaction (visible quick win — 2 hours)
7. Sidebar collapsible sections (navigation improvement — 2 hours)
8. Quick Create component (new feature — 3 hours)
9. Surface-by-surface density fixes: Library, Studio, CommandCenter, Dashboard (2-3 hours)
10. Spotlight Search (new feature — 3-4 hours)
11. Calendar system (separate workstream — 8-12 hours)
12. Tooltip audit (cleanup — 1 hour)
