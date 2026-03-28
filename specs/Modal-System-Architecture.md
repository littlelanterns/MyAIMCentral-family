# MyAIM Family — Global Modal System & Surface Type Architecture

**Type:** Architecture spec + implementation requirements for Claude Code
**Priority:** High — foundational system that every feature depends on
**References:** PRD-04 (Shell Routing & Layouts), PRD-03 (Design System)
**Scope:** Defines the shared Modal component, modal behavior types, minimize/restore system, and maps every feature to its correct surface type

---

## The Problem

V2 has no consistent modal system. Some features use inline page content, some use portaled modals, some use bottom sheets, some use drawers. There's no shared behavior for close, minimize, state preservation, stacking, or responsive adaptation. This creates a disorienting experience where every interaction feels different.

V1 felt better because it used modals consistently — calendar month view, event creation, task creation, date details all opened as modals over the current page, so you never lost your place.

---

## Part 1: Four Surface Types

Every UI surface in the app falls into exactly one of these categories:

### 1. Full Pages
Things with a sidebar route and their own URL. You navigate TO them. The main content area renders them.

**Characteristics:**
- Has a `/route` in the router
- Appears in the sidebar navigation
- Replaces whatever was in the main content area
- Scroll position saved when navigating away, restored when returning
- Can contain internal tabs (Journal sub-pages, Studio tabs)
- Uses the page's appropriate density tier

### 2. Persistent Modals (Minimizable)
Creation flows and configuration surfaces where work-in-progress needs to survive interruptions. These are the "I'm in the middle of something but need to check something else" surfaces.

**Characteristics:**
- Opens as an overlay above the current page
- Can be **minimized** to a floating pill at the bottom of the screen
- Minimized state preserves ALL form data, scroll position, and internal state
- Click the pill to **restore** to exactly where you left off
- Both **click-off** (backdrop click) and **X button** trigger minimize (not close)
- Explicit "Cancel" or "Discard" button required to truly close and discard state
- "Save draft?" prompt appears when minimizing if there is unsaved content
- Maximum 3 minimized modals at once; attempting a 4th shows "You have 3 items open — would you like to close one?" with a list of the minimized items
- Gradient header bar with heading font (the v1 signature pattern)
- Section-card form layout for creation flows
- Desktop: centered, max-width per content type
- Mobile: full-screen with back button

### 3. Transient Modals (Standard)
Quick views, confirmations, pickers, and read-only detail overlays. These don't involve extended work — they're quick interactions that open fresh every time.

**Characteristics:**
- Opens as an overlay above the current page
- Click-off (backdrop click) **closes** the modal (no minimize)
- X button closes the modal
- Escape key closes the modal
- No state preservation — opens fresh every time
- No floating pill — when closed, it's gone
- Can stack on top of a Persistent Modal (e.g., delete confirmation on top of an event detail)
- Desktop: centered, sized to content (sm/md/lg)
- Mobile: bottom-sheet for small modals, full-screen for large ones

### 4. Drawers (Persistent Panels)
Always-available side panels that are part of the layout itself, not overlays.

**Characteristics:**
- Part of the 5-zone layout (sidebar, Smart Notepad, LiLa Chat, QuickTasks)
- Collapse/expand without overlaying other content (they share horizontal space)
- State persists across page navigations
- Never portaled — they're layout zones, not overlays
- Already defined in PRD-04, not changed by this spec

---

## Part 2: The Shared Modal Component

### `<Modal>` Component API

A single shared Modal component in `src/components/shared/Modal.tsx` that handles all modal rendering. Every modal in the app uses this component — no more one-off portal implementations.

```typescript
interface ModalProps {
  /** Unique ID for this modal instance (used for minimize/restore tracking) */
  id: string
  
  /** Whether the modal is currently open */
  isOpen: boolean
  
  /** Called when the modal should close (X button, Cancel, discard) */
  onClose: () => void
  
  /** Modal behavior type */
  type: 'persistent' | 'transient'
  
  /** Size hint for desktop rendering */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  
  /** Modal title (shown in header and in minimized pill) */
  title: string
  
  /** Optional subtitle (e.g., source label) */
  subtitle?: string
  
  /** Whether to show the gradient header bar */
  gradientHeader?: boolean
  
  /** Lucide icon for the minimized pill */
  icon?: React.ComponentType<{ size: number }>
  
  /** Whether the modal has unsaved changes (triggers draft prompt on minimize) */
  hasUnsavedChanges?: boolean
  
  /** Called when user confirms "Save draft?" */
  onSaveDraft?: () => void
  
  /** Content */
  children: React.ReactNode
  
  /** Footer content (sticky at bottom) */
  footer?: React.ReactNode
  
  /** Mobile rendering preference */
  mobileStyle?: 'bottom-sheet' | 'full-screen'
}
```

### Size Mapping (Desktop)

| Size | Max Width | Use Case |
|---|---|---|
| `sm` | 480px | Confirmations, quick pickers, simple forms |
| `md` | 640px | Event creation, victory log, list item add |
| `lg` | 750px | Task creation, template customization |
| `xl` | 960px | Vault detail view, View As, calendar month |
| `full` | 90vw | Admin panels, complex configuration |

### Mobile Behavior

| Size | Mobile Rendering |
|---|---|
| `sm` | Bottom-sheet (slides up, max 60vh) |
| `md` | Bottom-sheet (slides up, max 80vh) |
| `lg` | Full-screen with back arrow |
| `xl` | Full-screen with back arrow |
| `full` | Full-screen with back arrow |

---

## Part 3: Minimize / Restore System

### `useModalManager` Hook

A global context that manages minimized modal state:

```typescript
interface MinimizedModal {
  id: string
  title: string
  icon?: React.ComponentType<{ size: number }>
  state: Record<string, unknown>  // serialized form state
  scrollPosition: number
  timestamp: Date
  hasUnsavedChanges: boolean
}

interface ModalManagerContext {
  minimizedModals: MinimizedModal[]
  minimize: (modal: MinimizedModal) => void
  restore: (id: string) => MinimizedModal | null
  close: (id: string) => void
  isMinimized: (id: string) => boolean
  canMinimize: () => boolean  // false if already at 3
}
```

### Floating Pill Bar

When modals are minimized, a floating bar appears at the bottom of the screen (above mobile bottom nav if present):

```
┌──────────────────────────────────────────────────────┐
│  [📋 New Task ●]  [📅 Event: Dentist]  [📝 List...]  │
└──────────────────────────────────────────────────────┘
```

**Pill bar styling:**
- Position: fixed, bottom `16px` (above mobile bottom nav: `calc(var(--nav-height) + 16px)`)
- Z-index: above page content, below active modals
- Background: `var(--color-bg-card)` with `var(--shadow-lg)` shadow
- Border: `1px solid var(--color-border)`
- Border-radius: `var(--radius-full)` (pill shape)
- Padding: `4px 8px`
- Max-width: `min(90vw, 500px)`, centered horizontally

**Individual pill styling:**
- Background: `color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))`
- Border-radius: `var(--radius-full)`
- Padding: `6px 12px`
- Font-size: `var(--font-size-xs)`
- Lucide icon (14px) + truncated title (max 15 chars)
- Orange dot indicator (●) when `hasUnsavedChanges = true`
- Click → restore that modal
- Long-press or right-click → option to close/discard

**Pill limit behavior:**
When user tries to minimize a 4th modal:
- A small dialog appears: "You have 3 items open. Close one to continue?"
- Shows list of the 3 minimized items with title + unsaved indicator
- User picks one to close (with draft prompt if unsaved)
- Then the new modal minimizes

### Minimize Flow

1. User clicks backdrop (outside modal) OR clicks a minimize button
2. If `hasUnsavedChanges`:
   - Dialog: "Save draft before minimizing?"
   - [Save & Minimize] — calls `onSaveDraft()`, then minimizes
   - [Minimize Without Saving] — minimizes with in-memory state only
   - [Cancel] — returns to modal
3. If no unsaved changes: minimize immediately
4. Modal slides down/fades out, pill appears in the bar

### Restore Flow

1. User clicks a pill in the floating bar
2. Modal slides up/fades in with preserved state
3. Scroll position restored, form fields preserved, cursor position preserved
4. Pill removed from the bar

### Close/Discard Flow (explicit)

1. User clicks "Cancel" or "Discard" within the modal
2. If `hasUnsavedChanges`:
   - Dialog: "Discard unsaved changes?"
   - [Discard] — closes modal, clears state
   - [Keep Editing] — returns to modal
3. If no unsaved changes: closes immediately, no pill created

---

## Part 4: Common Modal Elements

### Gradient Header (Persistent Modals)

All persistent modals get the gradient header:

```css
.modal-header-gradient {
  background: var(--gradient-primary);
  padding: 1rem 1.25rem;
  color: var(--color-text-on-dark, white);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--vibe-radius-modal) var(--vibe-radius-modal) 0 0;
}

/* Gradient OFF fallback */
.gradient-off .modal-header-gradient {
  background: var(--color-btn-primary-bg);
}
```

- Title: `var(--font-heading)`, `1.25rem`, `font-weight: 600`
- Close (X) button: circular, `rgba(255,255,255,0.2)`, white icon
- Minimize (—) button: same style, next to close button (persistent modals only)

### Plain Header (Transient Modals)

Transient modals get a simpler header:

```css
.modal-header-plain {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

- Title: `var(--color-text-heading)`, `font-weight: 600`
- Close (X) button: `var(--color-text-secondary)`, `var(--color-bg-secondary)` background

### Modal Footer (Sticky)

```css
.modal-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-card);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
}
```

### Backdrop

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay, rgba(0,0,0,0.5));
  z-index: var(--z-modal-backdrop);
}
```

### Z-Index Layers

```css
:root {
  --z-layout: 1;           /* sidebar, drawers */
  --z-floating-buttons: 10; /* LiLa buttons, settings */
  --z-quicktasks: 15;       /* QuickTasks strip */
  --z-pill-bar: 40;         /* minimized modal pills */
  --z-modal-backdrop: 50;   /* modal backdrops */
  --z-modal-content: 55;    /* modal panels */
  --z-modal-stacked: 60;    /* stacked confirmations */
  --z-toast: 70;            /* toast notifications */
}
```

### Focus Trap & Accessibility

- Active modal traps focus (tab cycles within modal)
- Escape key: closes transient modals; minimizes persistent modals
- `role="dialog"`, `aria-modal="true"`, `aria-label` from title
- Focus returns to trigger element on close/minimize

---

## Part 5: Feature-to-Surface Mapping

### Full Pages (sidebar routes)

| Feature | Route | Notes |
|---|---|---|
| Personal Dashboard | `/dashboard` | Landing page, contains widget sections |
| Command Center | `/command-center` | Artistic card-based navigation |
| Journal | `/journal` | Read/edit surface with sub-page tabs |
| Tasks | `/tasks` | View modes, task list management |
| Calendar | `/calendar` | Full calendar with toolbar and grid |
| Lists | `/lists` | All lists with detail views |
| Studio | `/studio` | Template browsing and customization |
| AI Vault | `/vault` | Content browsing, category rows |
| Vault BookShelf | `/vault/bookshelf` | Book library |
| Archives | `/archives` | Context management, bublup folders |
| Guiding Stars | `/guiding-stars` | Values, principles, intentions |
| My Foundation (InnerWorkings) | `/inner-workings` | Self-knowledge, personality |
| Victories | `/victories` | Victory history and recording |
| LifeLantern | `/life-lantern` | Personal assessment |
| BigPlans | `/bigplans` | Project management |
| Messages | `/messages` | Family messaging |
| Meetings | `/meetings` | Family meeting management |
| People & Relationships | `/people` | Family member profiles |
| Family Feeds | `/family-feed` | Activity feed |
| Settings | overlay | Full-screen overlay (not a route) |
| Admin Console | `/admin/*` | Tabbed admin interface |

### Persistent Modals (Minimizable — preserve state)

| Feature | ID | Gradient Header | Size | Opens From |
|---|---|---|---|---|
| Task Creation | `task-create` | Yes | `lg` | QuickTasks "Add Task", Studio template, Queue |
| Task Edit | `task-edit-{id}` | Yes | `lg` | Task detail, task card actions |
| Event Creation | `event-create` | Yes | `md` | Calendar "+ Add Event", date detail, Quick Create |
| Event Edit | `event-edit-{id}` | Yes | `md` | Event detail flyout |
| List Creation | `list-create` | Yes | `md` | Lists page, Quick Create |
| List Item Add (batch) | `list-items-{id}` | Yes | `md` | List detail view |
| Template Customization | `template-config` | Yes | `lg` | Studio template card |
| Widget Configuration | `widget-config` | Yes | `md` | Widget picker, dashboard |
| Guiding Star Create/Edit | `star-edit` | Yes | `md` | Guiding Stars page |
| Best Intention Create | `intention-create` | Yes | `md` | Guiding Stars page |
| Victory Record | `victory-create` | Yes | `md` | Quick Create, Victories page |
| BigPlans Plan Editor | `plan-edit-{id}` | Yes | `xl` | BigPlans page |
| Review & Route | `review-route` | Yes | `lg` | Smart Notepad, MindSweep |
| Meeting Agenda Editor | `meeting-edit-{id}` | Yes | `lg` | Meetings page |
| Message Compose (long) | `message-compose` | Yes | `md` | Messages page |
| Family Member Setup | `member-setup-{id}` | Yes | `lg` | Family Management |
| LiLa Tool (non-drawer) | `lila-tool-{mode}` | Yes | `lg` | Feature entry points, Vault tools |
| MindSweep Session | `mindsweep` | Yes | `lg` | QuickTasks, Quick Create |

### Transient Modals (Standard — no state preservation)

| Feature | Size | Opens From |
|---|---|---|
| Date Detail (calendar day view) | `md` | Calendar grid day click, week widget day click |
| Calendar Month View | `xl` | Dashboard widget "View Month" button |
| Task Detail (read/quick-edit) | `md` | Task card click, calendar task due date click |
| Event Detail Flyout | `md` | Calendar event click |
| Delete Confirmation | `sm` | Any delete action |
| Discard Draft Confirmation | `sm` | Cancel on persistent modal with changes |
| Minimize Limit Dialog | `sm` | 4th modal minimize attempt |
| Upgrade / Locked Feature | `sm` | PermissionGate fallback |
| Quick Create Popover | `sm` | "+" button in QuickTasks |
| "Send to..." Grid | `sm` | Smart Notepad routing |
| Inline Picker Overlay | `sm` | Sub-destination drill-down (list picker, tracker picker) |
| Image Preview / Lightbox | `xl` | Vault gallery, Archives images |
| Spotlight Search (Cmd+K) | `md` | Keyboard shortcut |
| Theme Selector (if modal) | `md` | Settings or appearance panel |
| View As | `full` | Perspective switcher |
| Guided Form Assign | `md` | Studio guided forms |
| Widget Picker | `md` | Dashboard "+ Add Widget" |
| Color Picker | `sm` | Family member profile |
| Notification Detail | `sm` | Notification tray item |
| Comment / Report | `sm` | Vault content actions |
| Request Creation | `sm` | QuickTasks, Notepad "Send as Request" |
| Universal Queue Modal | `lg` | QuickTasks "Review Queue", page badges |

### Drawers (Layout Zones — unchanged from PRD-04)

| Drawer | Position | Behavior |
|---|---|---|
| Sidebar Navigation | Left | Collapse to icon strip / hamburger |
| Smart Notepad | Right | Collapse/expand, tab persistence |
| LiLa Chat | Bottom | Collapse/peek/full, mom-only drawer |
| QuickTasks | Top | Collapse up/down |

---

## Part 6: Behavior Decision Matrix

This table answers "what happens when..." for each surface type:

| Action | Full Page | Persistent Modal | Transient Modal | Drawer |
|---|---|---|---|---|
| Click backdrop | N/A | Minimize (draft prompt if unsaved) | Close | N/A |
| Press Escape | N/A | Minimize | Close | N/A |
| Click X button | N/A | Minimize | Close | Collapse |
| Click Cancel/Discard | N/A | Close (discard prompt if unsaved) | Close | N/A |
| Navigate via sidebar | Page changes | Modal stays on top (or minimizes to pill if user navigated) | Closes | Stays in current state |
| Open same feature again | Page reloads/scrolls to top | If minimized, restores. If closed, opens fresh. | Opens fresh | Expands if collapsed |
| Page refresh | Reloads at route | Lost (unless draft was saved to DB) | Lost | Restored from layout_preferences |
| Mobile back button | Previous route | Minimize | Close | Collapse |

### Special: Sidebar Navigation While Modal Is Open

When the user clicks a sidebar link while a persistent modal is open:
- The modal **auto-minimizes** to a pill (with draft prompt if unsaved)
- The page navigates to the new route
- The pill remains, and the user can restore the modal later from any page

This is the key UX innovation — you can be halfway through creating a task, realize you need to check something on the Calendar page, click Calendar in the sidebar, and your half-finished task creation is sitting in a pill at the bottom waiting for you.

---

## Part 7: Implementation Architecture

### File Structure

```
src/components/shared/
  Modal.tsx              — shared Modal component (renders both types)
  ModalHeader.tsx        — gradient + plain header variants
  ModalFooter.tsx        — sticky footer
  ModalBackdrop.tsx      — themed backdrop
  MinimizedPillBar.tsx   — floating pill bar at bottom
  MinimizedPill.tsx      — individual pill
  DraftPrompt.tsx        — "Save draft?" dialog
  LimitPrompt.tsx        — "Close one to continue?" dialog

src/contexts/
  ModalManagerContext.tsx — global minimize/restore state

src/hooks/
  useModal.ts            — hook for opening/closing/minimizing
  useModalState.ts       — hook for tracking form state within a persistent modal
```

### `useModal` Hook Usage

```typescript
// In any component that opens a modal:
const { open, close, minimize, isOpen, isMinimized } = useModal('task-create')

// Open the modal
open({ initialData: someData })

// The Modal component handles minimize/restore via ModalManagerContext
```

### Draft Persistence Strategy

For persistent modals, form state is held in React state (in-memory) while minimized. It survives across page navigations because the ModalManagerContext lives at the app root level, above the router.

If the user chooses "Save draft" when prompted:
- For tasks: save to `studio_queue` with `status = 'draft'`
- For events: save to `calendar_events` with `status = 'draft'`
- For other features: save to the feature's own draft mechanism (feature-specific)
- Drafts can be resumed from the feature's page (e.g., Tasks page shows "1 draft" indicator)

If the user chooses "Minimize without saving": state lives in memory only. Page refresh loses it. This is acceptable — it's the lightweight path for quick interruptions.

---

## Part 8: Migration Path

### Phase 1: Build the shared Modal component + ModalManagerContext
- Create Modal.tsx with both `persistent` and `transient` modes
- Create MinimizedPillBar with pill rendering
- Create DraftPrompt and LimitPrompt dialogs
- Wire into the app root (above Router, below ThemeProvider)

### Phase 2: Migrate Task Creation Modal
- Wrap in `<Modal type="persistent" id="task-create" ...>`
- Remove custom portal, backdrop, and close logic
- Test minimize/restore with form state preservation

### Phase 3: Migrate Event Creation Modal + Date Detail Modal
- EventCreationModal → `persistent`
- DateDetailModal → `transient`
- Calendar Month Modal → `transient`

### Phase 4: Audit and migrate all remaining modals
- Every modal in the app gets wrapped in the shared Modal component
- Custom portal code removed everywhere
- Z-index conflicts resolved via the shared layer system

### Phase 5: Wire sidebar navigation auto-minimize
- When sidebar link is clicked, check for open persistent modals
- Auto-minimize with draft prompt if needed
- Navigate after minimize completes

---

## Verification Checklist

- [ ] Shared Modal component renders correctly for both `persistent` and `transient` types
- [ ] Persistent modals show gradient header; transient modals show plain header
- [ ] Click-off on persistent modal triggers minimize (not close)
- [ ] Click-off on transient modal triggers close
- [ ] Minimized modals appear as pills in the floating bar at screen bottom
- [ ] Pills show icon + truncated title + orange dot for unsaved changes
- [ ] Clicking a pill restores the modal with all state preserved
- [ ] "Save draft?" dialog appears when minimizing a modal with unsaved changes
- [ ] Attempting to minimize a 4th modal shows the limit dialog with current 3 items listed
- [ ] Sidebar navigation auto-minimizes any open persistent modal
- [ ] Escape key minimizes persistent modals, closes transient modals
- [ ] Focus trap works inside active modals
- [ ] Stacking works (transient on top of persistent)
- [ ] Mobile: persistent modals render full-screen; small transient modals render as bottom sheets
- [ ] All modals use CSS variables (zero hardcoded colors)
- [ ] All modals respect gradient toggle
- [ ] Z-index layers don't conflict (pills below modals, modals below toasts)
- [ ] Page refresh loses in-memory minimized state (expected) but not saved drafts
