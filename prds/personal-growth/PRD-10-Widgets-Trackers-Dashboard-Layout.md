> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-10: Widgets, Trackers & Dashboard Layout

**Status:** Not Started
**Dependencies:** PRD-01 (Auth), PRD-02 (Permissions), PRD-03 (Design System), PRD-04 (Shell Routing), PRD-06 (Guiding Stars & Best Intentions), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates)
**Created:** March 5, 2026
**Last Updated:** March 5, 2026

---

## Overview

PRD-10 defines three interconnected systems: the **Widget Template Library** (a catalog of visual tracker and display components), the **Dashboard Grid Layout** (the spatial arrangement and interaction model for all dashboard types), and the **Track This** flow (the quick-creation pipeline from "I want to track something" to a deployed widget on a dashboard).

> **Mom experience goal:** Dashboards should feel like *your* space — a scrapbook, a command center, a vision board, whatever fits your personality. Widgets snap into a phone-home-screen grid where you long-press to rearrange, drag into folders, and resize to small/medium/large. Auto-organize handles the layout by default; customization is always one long-press away. When you want to track something new, the path from idea to live tracker on a dashboard is three taps.

The Widget Template Library provides a three-level architecture of **19 tracker types** (the data behavior engines), **75+ visual variants** (how each type can look), and **95+ starter configurations** (pre-built examples organized by life area in Studio). Each template follows a three-layer rendering model: **Theme** (color tokens from the active theme), **Configuration** (user settings like title, goal, target, assigned member), and **Template** (the visual rendering pattern — progress bar, star chart, streak counter, etc.). This means every widget automatically adapts to any theme, and the same tracker type can be configured and visualized differently for different family members.

The system also includes a **Multiplayer Layer** — a cross-cutting configuration option that allows any numeric tracker to display data for multiple family members within the same widget, with each member's data rendered in their assigned member color. Multiplayer widgets support three modes (Collaborative, Competitive, Both), multiple visual styles for multi-member rendering, and a family/personal view toggle so the same widget can show "us" on the family hub and "me" on a personal dashboard.

> **Companion document:** The complete tracker type definitions, visual variant listings, multiplayer system specification, and starter configuration library are maintained in the **Widget Template Catalog v3** — a living reference document that can grow without schema changes as new visual variants and starter configs are added.

Widgets are portable components. They render identically regardless of whose screen they appear on — mom's dashboard, a child's Guided dashboard, or a Special Adult's shift view. This portability is essential because caregivers need to operate a child's widgets (checking off tasks, logging events) and see the child's celebrations fire in real time.

> **Depends on:** Task types and task completion model (PRD-09A). Studio page structure and template browsing (PRD-09B). Theme token system (PRD-03). Shell routing and dashboard modes (PRD-04). Permission model for Special Adults and shift-based access (PRD-02).

---

## User Stories

### Dashboard Layout
- As a mom, I want my dashboard to feel like a phone home screen where I can long-press, drag, and rearrange widgets so my most-used tools are always where I want them.
- As a mom, I want auto-organize as the default so I don't have to manually arrange everything, but I want to be able to customize whenever I feel like it.
- As a mom, I want to group related widgets into folders (like phone folders) so I can keep my dashboard clean while still having lots of trackers.
- As a mom, I want widgets in three sizes (small, medium, large) so I can make important things bigger and tuck secondary things into small cards.
- As a mom using the Cozy Journal vibe, I want my dashboard to have scrapbook-style decorative elements (washi tape, thumbtacks, paper textures) so it feels warm and personal.
- As a dad/additional adult, I want the same grid drag-and-drop layout on my personal dashboard so I can organize my own space.
- As an independent teen, I want to arrange my own dashboard widgets and choose my own sizes so my space feels like mine.
- As a Guided-mode child, I want to be able to rearrange my widgets within my dashboard so I can put my favorite things first.
- As a Play-mode child, I see the dashboard exactly as mom arranged it — no rearranging (mom controls the layout).

### Widget Template Library
- As a mom, I want to browse a library of visual tracker templates (progress bars, star charts, streak counters, habit grids, etc.) so I can pick the right visualization for what I'm tracking.
- As a mom, I want to configure a widget template with a title, goal, target, unit, assigned member, and optional image so the widget is personalized for my family.
- As a mom, I want widgets to automatically adopt the active theme's colors so everything looks cohesive on the dashboard.
- As a teen, I want to create my own trackers from the template library and deploy them to my dashboard.

### Track This
- As a mom, I want a "Track This" shortcut that takes me from "I want to track something" to a configured widget on a dashboard in three taps.
- As a mom, I want "Track This" available from the QuickTasks strip, from LiLa, and as a routing destination from Smart Notepad.
- As a teen, I want to create my own trackers via "Track This" for personal goals.

### Special Adult Child-Widget View
- As a Special Adult (caregiver), I want to see the assigned child's widgets using the child's theme during my shift so the child can watch me check things off and see their celebrations happen.
- As a Special Adult caring for multiple children, I want to switch between children's widget views without ending my shift.
- As a mom in a shared custody arrangement, I want my co-parent (set up as a Special Adult with broader permissions) to see and interact with the children's task widgets and trackers without having access to my full dashboard or personal features.
- As a mom, I want to see records of what the caregiver marked during their shift in the widget's history.

### Widget Folders
- As a mom, I want to drag one widget onto another to create a folder, just like on my phone.
- As a mom, I want to tap a folder to open it as a modal overlay showing the grouped widgets inside.
- As a mom, I want to name my folders and drag widgets in and out of them.

---

## Screens

### Screen 1: Dashboard Grid Layout (All Roles)

**What the user sees:**

The dashboard renders as a snap-to-grid layout. The grid adapts to screen size:

| Breakpoint | Grid Columns | Widget Size Mapping |
|-----------|-------------|-------------------|
| Desktop (>1024px) | 4 columns | S=1×1, M=2×1, L=2×2 |
| Tablet (768–1024px) | 3 columns | S=1×1, M=2×1, L=3×1 (full width) |
| Mobile (<768px) | 2 columns | S=1×1, M=2×1 (full width), L=2×2 (full width, taller) |

Widgets snap to grid cells. Empty cells are filled by auto-arrange by default. Each widget shows at its configured size with its template rendering inside.

**Normal mode (default):**
- Widgets display in their grid positions
- Tapping a widget opens it (for interactive widgets) or shows detail (for display widgets)
- Scrolling is vertical; grid extends downward as needed
- Folders appear as a single grid cell showing a 2×2 mini-preview of the first 4 widgets inside, with a folder name label

**Edit mode (long-press to enter):**
- All widgets enter a subtle "wiggle" animation (iOS-style)
- Drag handles appear on each widget
- Resize handle appears in bottom-right corner of each widget (drag to cycle S→M→L)
- [×] delete button appears on each widget's top-left corner
- Dragging a widget onto another creates a folder
- Dragging a widget out of a folder removes it
- A persistent "Done" button appears at the top to exit edit mode
- For Cozy Journal vibe: decorative element placement mode activates — user can add/remove/reposition stickers, washi tape, thumbtacks from a decoration palette that slides up from the bottom

**Auto-Arrange behavior:**
- Default for all new dashboards
- Fills grid efficiently top-to-bottom, left-to-right
- Respects widget sizes (larger widgets get placed first to minimize gaps)
- When a user manually moves any widget, the layout switches from "auto" to "manual" for that dashboard
- "Reset to Auto" option available in edit mode to return to automatic arrangement

```
┌─────────────────────────────────────────────────┐
│  My Dashboard                       [⚙ Edit]    │
│                                                   │
│  ┌──────────────┐  ┌──────┐  ┌──────┐          │
│  │ Morning      │  │ Best │  │ Star │          │
│  │ Routine      │  │ Int. │  │ Chart│          │
│  │ ▓▓▓▓░░ 74%  │  │ 4/5  │  │ ★★★★ │          │
│  │              │  │      │  │ ★★★☆ │          │
│  │   (M)        │  │ (S)  │  │ (S)  │          │
│  └──────────────┘  └──────┘  └──────┘          │
│                                                   │
│  ┌──────┐  ┌──────────────────────────┐          │
│  │📁    │  │  Weekly Habit Grid        │          │
│  │Potty │  │  M T W T F S S           │          │
│  │Train │  │  ■ ■ ■ ■ ■ □ □           │          │
│  │ (S)  │  │  ■ ■ ■ □ □ □ □           │          │
│  └──────┘  │         (L)               │          │
│            └──────────────────────────┘          │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Allowance    │  │ Streak       │              │
│  │ Calculator   │  │ Counter 🔥   │              │
│  │ $10.44       │  │ 14 days      │              │
│  │   (M)        │  │   (M)        │              │
│  └──────────────┘  └──────────────┘              │
│                                                   │
│  [+ Add Widget]                                   │
└─────────────────────────────────────────────────┘
```

**Interactions:**
- Long-press anywhere on the dashboard → enter edit mode
- Drag widget → reposition (snaps to nearest grid cell)
- Drag widget onto another widget → create folder
- Tap resize handle → cycle through S/M/L
- Tap [×] → remove widget from dashboard (widget template still exists, can be re-added)
- Tap "Done" → exit edit mode, save layout
- Tap [+ Add Widget] → opens widget picker (Screen 3)
- Tap folder → opens folder overlay (Screen 2)

**Data created/updated:**
- `dashboard_configs.layout` JSONB updated with new positions, sizes, folder groupings
- `dashboard_configs.layout_mode` set to 'manual' on first user rearrangement

**Role-specific behavior:**

| Role | Edit Mode | Resize | Folders | Decorations | Auto-Arrange |
|------|-----------|--------|---------|-------------|-------------|
| Mom | Full access | Yes | Yes | Yes (vibe-dependent) | Default ON, toggle OFF |
| Dad / Additional Adult | Full access | Yes | Yes | Yes | Default ON, toggle OFF |
| Independent Teen | Full access | Yes | Yes | Yes | Default ON, toggle OFF |
| Guided Child | Rearrange only (no resize, no delete) | No — mom sets | No — mom creates | No | Mom sets default, child can reorder |
| Play Child | No edit mode | No | No | No | Mom sets, locked |

---

### Screen 2: Widget Folder Overlay

**What the user sees:**

When the user taps a folder on the dashboard, a centered modal overlay appears. The overlay shows the folder's name at the top with an edit icon, and the contained widgets rendered at their individual sizes in a mini-grid layout inside the modal. The background dashboard is dimmed but visible.

```
┌─────────────────────────────────────┐
│  Potty Training ✎             [×]   │
│  ─────────────────────────────────  │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ Star     │  │ Streak   │       │
│  │ Chart    │  │ Counter  │       │
│  │ ★★★★★   │  │ 🔥 5 days│       │
│  │ ★★★☆☆   │  │          │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐                      │
│  │ Reward   │                      │
│  │ Goal     │                      │
│  │ 🎧 2/3   │                      │
│  │ weeks    │                      │
│  └──────────┘                      │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- Tap ✎ → edit folder name inline
- Tap [×] → close overlay, return to dashboard
- Tap any widget inside → opens that widget's detail/interaction view
- In edit mode: drag widgets within the folder to reorder; drag a widget out of the folder overlay to the dashboard behind it to ungroup
- Tap outside the modal → close overlay

**Data created/updated:**
- `dashboard_widget_folders.name` on rename
- `dashboard_widgets.folder_id` when widgets are added/removed from folder

---

### Screen 3: Widget Picker (Add Widget)

**What the user sees:**

A full-height modal/drawer that appears when the user taps [+ Add Widget] on the dashboard. Organized into sections:

**Section 1: "Your Widgets"** — widgets the user has already configured but aren't currently on this dashboard (removed or from another layout). Quick re-add.

**Section 2: "Create New"** — browse the Widget Template Library. Cards organized by the 8 categories from the architecture overview:

| Category | Icon | Templates Included |
|----------|------|--------------------|
| Routine Trackers | 📅 | Daily Checklist (10), Weekly Habit Grid (5), Streak Counter (4) |
| Goal Pursuit | 🎯 | Custom Reward Goal Card (19), Step Unlock Path (20), Tally Accumulator (21) |
| Progress Visualizers | 📈 | Progress Bar (1), Donut Ring (2), Thermometer Meter (6), Responsibility Gauge (13) |
| Reward & Allowance | 💰 | Coin Jar (7), Allowance Calculator (11), Countdown Timer (12) |
| Achievement & Recognition | 🏆 | Badge Wall (9), XP Counter + Level (8), Weekly Celebration Card (18), Personal Records (15) |
| Reflection & Insight | 👁 | Mood Check-in (17) |
| Family & Social | 👨‍👩‍👧‍👦 | Family Leaderboard (16) |
| Skill Tracking | 📚 | Mastery Path (14), Star Chart (3) |

**Section 3: "Info Widgets"** — non-tracker display widgets: Best Intentions summary, upcoming tasks, family calendar, recent Archive updates, quick stats.

**Section 4: "Quick Actions"** — shortcut widgets: Add new intention, Mind Sweep capture, Quick Add task.

Each template card shows a thumbnail preview of the widget in the current theme colors, the template name, a one-line description, and a [Customize] button.

**Interactions:**
- Tap category header → expand/collapse category
- Tap [Customize] on a template → opens Widget Configuration (Screen 4)
- Tap a "Your Widgets" card → immediately adds it back to the dashboard at the next available position
- Tap an Info Widget or Quick Action → immediately adds it to the dashboard (no configuration needed)
- Search bar at top filters templates by name/category

**Data created/updated:**
- None until the user completes configuration and deploys

---

### Screen 4: Widget Configuration

**What the user sees:**

A configuration form that adapts based on the selected template type. All fields are contextual — only relevant fields appear for each template.

**Common fields (all templates):**
- **Title** — free text, pre-filled with template default (e.g., "Morning Routine Streak")
- **Assigned To** — member picker (defaults to current user; mom can assign to any family member)
- **Size** — S / M / L toggle (visual preview updates in real time)
- **Goal** (where applicable) — numeric target
- **Target** (where applicable) — numeric value for completion
- **Unit** (where applicable) — what's being counted (days, tasks, hours, stars, points, etc.)
- **Image Upload** (optional) — custom image for the widget header (e.g., headphones photo for a reward goal)
- **Prize** (for reward templates) — text description of the reward

**Template-specific fields:**

| Template | Additional Fields |
|----------|------------------|
| Star Chart (1c/1d) | Stars per row, total stars to earn, animated vs. static |
| Weekly Habit Grid (4a–d) | Tracked habits (multi-line), tracked days |
| Streak Counter (3a–e) | Streak type (consecutive days, completions, weekly), grace period (0 or 1 day) |
| Allowance Calculator (10a–d) | Base amount, calculation method (% of completion, fixed per task, points-weighted), structure approach |
| Countdown (13a–c) | Target date, what happens at zero |
| Mastery Path (7b) | Steps (ordered list with labels), unlock condition per step |
| Step Unlock Path (7a) | Steps (ordered list with labels per step) |
| Badge Wall (8a–d) | Badge definitions (name, icon, unlock criteria) |
| Leaderboard (11a–c) | Participating members, ranked metric |
| Mood Check-in (12a–d) | Check-in frequency, mood scale type |
| Tally Accumulator (1a–l) | Unit, history view timeframe, reset period |
| Custom Reward Goal (S-2) | Qualifying condition, qualifying period, qualifying threshold |
| Color-Reveal (16a–c) | Image selection (from curated library), total achievements needed (5–100+), reveal strategy (automatic/gradual/random), achievement source |
| Gameboard (17a–f) | Total spaces, board theme, what moves piece forward, special space frequency and types, prize at end |
| Timer / Duration (14a–c) | Timer mode (manual / start-stop / both), goal per period |

**Multiplayer configuration section** (collapsible, appears for any multiplayer-compatible tracker type):

1. **Enable Multiplayer** — toggle (default OFF)
2. **Participants** — multi-select of family members (shown as avatars with member colors)
3. **Mode** — Collaborative / Competitive / Both (with brief descriptions; "Recommended for most families" label on Both)
4. **Visual Style** — thumbnail picker of available multi-member rendering styles for this tracker type (colored bars, colored segments, colored markers, colored stars, game pieces — options vary by type)
5. **Shared Target** (collaborative/both modes only) — combined goal number. System suggests default based on participants × individual target.
6. **Privacy** — "All participants can see each other's values" (default) / "Participants see only own + combined total" / "Only I (mom) can see individual breakdowns"
7. **Deploy As** — Linked Pair (auto-deploy to family hub in family view + each participant's personal dashboard in personal view) / Standalone (deploy to one location only)
8. **Live Preview** — sample data in member colors showing exactly how the widget will look

**Family/Personal View Toggle:**

When a multiplayer widget is deployed as a Linked Pair, it appears on both the family hub (defaulting to family view showing all participants) and each participant's personal dashboard (defaulting to personal view showing "my data within our shared context"). A small toggle icon in the widget header allows switching between views from either location.

When deployed as Standalone, the toggle is still available but only shows data for the dashboard it's on (e.g., a family hub standalone shows family view with toggle to see individual breakdown; a personal dashboard standalone shows personal view with toggle to see family context).

**Live preview:** The right side (desktop) or top section (mobile) shows a real-time preview of the widget as it will appear on the dashboard, using the current theme tokens and the values being entered.

**Tracker Structure Selection** (for task-linked templates):

When a widget is linked to tasks/routines (e.g., Allowance Calculator, Daily Checklist), the configuration includes a structure selection:

- **Approach A: Fixed Task Template** — predefined tasks repeated on a weekly grid. Best for ages 6–12, routine-focused.
- **Approach B: Dynamic Task Pool** — tasks grouped into categories with completion rings per category. Best for ages 10–16, flexible schedules.
- **Approach C: Points-Weighted System** — each task has a point value; total percentage determines allowance. Best for ages 12–17, financial literacy.

Each approach shows a visual preview matching the tracker structures mockup.

**Interactions:**
- Fill in configuration fields → live preview updates
- Tap [Deploy to Dashboard] → widget is created and placed on the target dashboard
- Tap [Save as Template] → saves this configuration as a reusable template in Studio "My Customized" tab
- If assigned to a family member other than self: widget deploys to that member's dashboard (mom must have permission)

**Data created/updated:**
- `dashboard_widgets` record created with template_type, configuration, assigned member, size
- `widget_instances` record created linking the widget to its data source
- If using task-linked templates: `widget_task_links` records connecting widget to task IDs

---

### Screen 5: Track This (Quick-Creation Flow)

**What the user sees:**

"Track This" is a streamlined entry point into the Widget Configuration (Screen 4). It can be triggered from three places:

1. **QuickTasks strip** — "Track This" button alongside "Add Task" and other quick actions
2. **LiLa conversation** — when the user mentions wanting to track something, LiLa offers a "Track This" action chip
3. **Smart Notepad routing** — "Send to → Track This" as a routing destination

**Step 1: What are you tracking?**
A simple prompt: "What do you want to track?" with a text input. Below the input, a row of quick-pick suggestions based on context (e.g., "Water intake," "Reading minutes," "Piano practice," "Potty successes").

If triggered from Smart Notepad or LiLa, the text input is pre-filled with the relevant content.

**Step 2: Pick your visualization**
A horizontally scrollable carousel of widget template thumbnails, filtered to the most relevant templates for what was entered. Each thumbnail shows the template rendered with the entered title. The user taps one.

**Step 3: Quick Configure**
A simplified version of Screen 4 showing only the essential fields: Title (pre-filled), Goal (if applicable), Assigned To (defaults to self), Size (defaults to M). An "Advanced" link expands to show all configuration fields.

**Step 4: Deploy**
Tap [Add to Dashboard] → widget appears on the target dashboard. Done.

The entire flow should feel like 3–4 taps for simple trackers.

**Interactions:**
- Type or accept pre-fill → see template suggestions → tap one → quick configure → deploy
- At any point, tap "Advanced" to access full Widget Configuration (Screen 4)

**Data created/updated:**
- Same as Screen 4 (widget creation records)

---

### Screen 6: Special Adult Child-Widget View (Shift View)

**What the user sees:**

When a Special Adult starts a shift, they see a child-selection screen showing avatars/names of the children assigned to them. Tapping a child loads that child's widgets — filtered to only the features the caregiver has permission for — rendered using the child's active theme.

The layout is auto-arranged (the caregiver cannot rearrange). A persistent banner at the top shows: "On Shift — [Child Name]'s Dashboard" with a child-switcher dropdown and an "End Shift" button.

```
┌─────────────────────────────────────────────────┐
│  🟢 On Shift — Ruthie's Dashboard    [▼ Switch] │
│                               [End Shift]        │
│  ─────────────────────────────────────────────── │
│                                                   │
│  ┌──────────────┐  ┌──────┐  ┌──────┐          │
│  │ Morning      │  │ Star │  │Potty │          │
│  │ Checklist    │  │ Chart│  │Track │          │
│  │ □ Brush teeth│  │ ★★★★ │  │ 🔥 5 │          │
│  │ □ Get dressed│  │ ★★☆☆ │  │ days │          │
│  │ □ Breakfast  │  │      │  │      │          │
│  └──────────────┘  └──────┘  └──────┘          │
│                                                   │
│  ┌──────────────────────────┐                    │
│  │ Weekly Habit Grid         │                    │
│  │ M T W T F S S            │                    │
│  │ ■ ■ ■ □ □ □ □            │                    │
│  └──────────────────────────┘                    │
│                                                   │
│  [Log Activity]                                   │
└─────────────────────────────────────────────────┘
```

**What happens when the caregiver interacts with widgets:**
- Checking off a task on the Daily Checklist → the widget's celebration animation fires (confetti, star appears, counter increments) immediately on the caregiver's screen
- The child's dashboard updates in real time if they're watching on another device
- The same data records are created as if the child (or mom) had checked it off — single source of truth
- All actions are timestamped with the active shift ID for audit trail

**Co-parent use case:**
A co-parent is configured as a Special Adult with broader permissions (e.g., tasks, routines, trackable events, notes, calendar — everything except journal, archives, personal features). Mom can set their shift access to "always on" (no manual start/end required) via the shift schedule configuration in PRD-02. The co-parent then sees the children's widgets whenever they log in, operates them exactly like any caregiver, and all data flows back to mom's view. Mom controls which widgets and features are visible through the standard permission scoping.

**Interactions:**
- Tap [▼ Switch] → dropdown of assigned children → tap to switch (auto-arrange loads new child's widgets)
- Tap a widget → interact with it (check off tasks, log events, view details)
- Celebrations fire on interaction (using child's theme animations)
- Tap [Log Activity] → free-text + optional photo entry (existing PRD-02 behavior)
- Tap [End Shift] → shift ends, access goes dark, shift summary prompt appears

**Data created/updated:**
- Task completions, tracker increments, etc. — attributed to the child's records
- `activity_log_entries` with `source = 'special_adult_shift'` and `shift_session_id`
- Shift session records per PRD-02

---

### Screen 7: Widget Detail View

**What the user sees:**

Tapping any widget on the dashboard opens its detail view. The content depends on the template type:

**For interactive widgets (trackers, checklists):**
- Full-size rendering of the widget
- Interaction controls (check boxes, increment buttons, log entry)
- History view (tap "History" to see past data — last 7 days, 14 days, 30 days, all time)
- Chart visualization of historical data where applicable
- [Edit Widget] button → returns to Widget Configuration (Screen 4) with current values pre-filled
- [Remove from Dashboard] → removes widget from dashboard layout (data preserved)

**For display widgets (info, stats):**
- Full-size rendering with expanded detail
- Links to related features (e.g., Best Intentions widget → tap to go to Best Intentions page)

**For celebration widgets (Weekly Celebration Card):**
- Animated celebration plays on open
- Summary stats for the period
- [Share] button (future)

**Data created/updated:**
- Varies by interaction type (task completions, tracker increments, mood entries, etc.)

---

### Screen 8: Decorative Layer (Cozy Journal Vibe)

**What the user sees:**

When the active vibe is "Cozy Journal" and the user enters edit mode, an additional decoration palette appears at the bottom of the screen. This palette offers:

- **Stickers** — small decorative images that can be placed anywhere on the dashboard (stars, hearts, flowers, seasonal items)
- **Washi tape** — strips that can be placed across widget edges or as section dividers
- **Thumbtacks** — pin widgets to give them a bulletin-board feel
- **Paper textures** — background texture options for widget cards (lined paper, graph paper, kraft paper)
- **Doodles** — hand-drawn arrows, circles, underlines that can be placed as annotations

Decorative elements are theme-colored using the active palette. They layer on top of the functional grid without affecting widget functionality or snap positions.

**Interactions:**
- Tap a decoration from the palette → it appears in the center of the screen
- Drag to position → slight rotation applied automatically for authenticity (random 3–15°)
- Pinch to resize (mobile) or drag corner handle (desktop)
- Tap to select → show delete button
- All decorations are saved as part of the dashboard layout

**Other vibes:**
- Classic MyAIM: No decorative layer
- Clean & Modern: No decorative layer
- Nautical: No decorative layer (may add nautical decorations post-MVP)

**Data created/updated:**
- `dashboard_configs.decorations` JSONB array of positioned decorative elements

---

## Visibility & Permissions

| Role | Dashboard Layout | Widget Creation | Widget Interaction | Resize/Rearrange | Folders | Decorations | Track This |
|------|-----------------|----------------|-------------------|-----------------|---------|-------------|-----------|
| Mom / Primary Parent | Full control of own + can set Play/Guided kids' layouts | Create for self + any family member | Full interaction on own + View As for any member | Yes (own + Play/Guided kids) | Yes | Yes (vibe-dependent) | Yes |
| Dad / Additional Adult | Full control of own dashboard | Create for self (+ kids if mom permits) | Own dashboard + View As if mom grants | Yes (own only) | Yes | Yes | Yes |
| Special Adult | Auto-arranged child widgets during shift only | No creation | Interact with permitted child widgets during shift | No | No | No | No |
| Independent Teen | Full control of own dashboard | Create for self | Own widgets | Yes | Yes | Yes | Yes |
| Guided Child | Can reorder widgets (not resize, not delete) | No (mom creates) | Own widgets | Reorder only | No (mom creates) | No | No |
| Play Child | View only | No | Own widgets (tap to interact) | No | No | No | No |

### Shell Behavior

- **Mom's shell:** Full widget picker, Track This in QuickTasks strip, decorative layer in edit mode for Cozy Journal vibe
- **Adult shell:** Same as mom minus family-wide management widgets
- **Independent shell:** Full widget picker for self-created widgets, Track This available
- **Guided shell:** No widget picker, no edit mode (except reorder), widgets are configured by mom via View As
- **Play shell:** No edit mode, larger touch targets on widget interactions, more prominent celebration animations

### Privacy & Transparency

- Widgets assigned to a teen are visible on the teen's Transparency Panel ("Mom can see: Charts & Trackers ✓")
- Teens can create personal widgets that are visible to mom by default (per standard teen privacy model — mom sees all unless she opts to reduce visibility)
- Widget data follows the same visibility rules as the underlying feature (task completion data follows task permissions, etc.)

---

## Data Schema

### Table: `dashboard_widgets`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members. The dashboard owner. |
| template_type | TEXT | | NOT NULL | Template identifier (e.g., 'progress_bar', 'star_chart', 'streak_counter', 'daily_checklist', 'allowance_calculator', 'badge_wall', etc.) |
| title | TEXT | | NOT NULL | User-facing widget title |
| size | TEXT | 'medium' | NOT NULL | Enum: 'small', 'medium', 'large' |
| position_x | INTEGER | 0 | NOT NULL | Grid column (0-indexed) |
| position_y | INTEGER | 0 | NOT NULL | Grid row (0-indexed) |
| folder_id | UUID | null | NULL | FK → dashboard_widget_folders. Null = top-level on dashboard. |
| sort_order | INTEGER | 0 | NOT NULL | Order within folder or dashboard |
| widget_config | JSONB | '{}' | NOT NULL | Template-specific configuration (goal, target, unit, prize, image_url, structure_approach, habits list, badge definitions, etc.) |
| data_source_type | TEXT | null | NULL | What feeds this widget: 'tasks', 'routines', 'trackable_events', 'manual', 'best_intentions', 'guiding_stars', 'calculated' |
| data_source_ids | UUID[] | '{}' | NOT NULL | Array of task_ids, routine_ids, etc. that feed this widget |
| assigned_member_id | UUID | null | NULL | FK → family_members. If widget tracks another member's data (mom creating widget for child). Null = same as family_member_id. |
| is_active | BOOLEAN | true | NOT NULL | Soft active/inactive toggle |
| is_on_dashboard | BOOLEAN | true | NOT NULL | Currently placed on dashboard (false = removed but data preserved) |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Standard LiLa context toggle |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |
| archived_at | TIMESTAMPTZ | null | NULL | Soft delete |

**RLS Policy:** Owner (family_member_id) has full CRUD. Primary parent can CRUD any family member's widgets. Additional Adults can CRUD their own. Special Adults read-only on assigned children's widgets during active shift (application layer enforces shift check). Independent Teens CRUD their own.

**Indexes:**
- `(family_id, family_member_id, is_on_dashboard)` — "what's on this person's dashboard?"
- `(family_id, assigned_member_id)` — "what widgets track this member?"
- `(folder_id)` — "what's in this folder?"

---

### Table: `dashboard_widget_folders`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members. Dashboard owner. |
| name | TEXT | 'Folder' | NOT NULL | User-editable folder name |
| position_x | INTEGER | 0 | NOT NULL | Grid column |
| position_y | INTEGER | 0 | NOT NULL | Grid row |
| sort_order | INTEGER | 0 | NOT NULL | Order on dashboard |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Same as dashboard_widgets — owner + primary parent.

**Indexes:**
- `(family_id, family_member_id)` — "this person's folders"

---

### Table: `widget_data_points`

Stores the actual tracking data for widgets. Each interaction (check-off, increment, log entry) creates a data point.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| widget_id | UUID | | NOT NULL | FK → dashboard_widgets |
| family_member_id | UUID | | NOT NULL | FK → family_members. Whose data this is. |
| recorded_at | TIMESTAMPTZ | now() | NOT NULL | When the data point was recorded |
| recorded_date | DATE | CURRENT_DATE | NOT NULL | Date-only for daily aggregation |
| value | NUMERIC | | NOT NULL | The numeric value (1 for boolean check, count for tally, percentage for completion, etc.) |
| value_type | TEXT | 'increment' | NOT NULL | Enum: 'increment', 'set', 'boolean', 'mood', 'percentage' |
| metadata | JSONB | '{}' | NOT NULL | Additional context (mood_label, note, source_task_id, shift_session_id, etc.) |
| recorded_by_member_id | UUID | null | NULL | FK → family_members. Who recorded it (differs from family_member_id when caregiver records for child). Null = self-recorded. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent reads all family data. Owner reads own. Special Adult can insert for assigned children during shift. Widget data inherits visibility from widget's assigned_member_id permission chain.

**Indexes:**
- `(widget_id, recorded_date)` — "today's data for this widget"
- `(widget_id, recorded_at DESC)` — "recent history for this widget"
- `(family_id, family_member_id, recorded_date)` — "all tracking for this member today"

---

### Table: `dashboard_configs` (Updated from existing)

Add columns to existing table:

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| layout_mode | TEXT | 'auto' | NOT NULL | Enum: 'auto', 'manual'. Switches to 'manual' on first user rearrangement. |
| decorations | JSONB | '[]' | NOT NULL | Array of decorative element placements: [{type, asset_id, x, y, rotation, scale}] |
| grid_columns | INTEGER | null | NULL | Override grid columns (null = responsive default) |

---

### Table: `widget_templates` (System-provided + User-customized)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | null | NULL | Null = system template. Non-null = user-customized template. |
| family_member_id | UUID | null | NULL | Who customized it. Null for system templates. |
| template_type | TEXT | | NOT NULL | Same enum as dashboard_widgets.template_type |
| category | TEXT | | NOT NULL | Enum: 'routine_trackers', 'goal_pursuit', 'progress_visualizers', 'reward_allowance', 'achievement_recognition', 'reflection_insight', 'family_social', 'skill_tracking' |
| name | TEXT | | NOT NULL | Display name |
| description | TEXT | null | NULL | One-line description |
| default_config | JSONB | '{}' | NOT NULL | Default configuration values for this template |
| thumbnail_config | JSONB | '{}' | NOT NULL | Configuration for generating theme-aware thumbnail previews |
| is_system | BOOLEAN | true | NOT NULL | System-provided vs. user-customized |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** System templates readable by all. User templates scoped to family_id + family_member_id. Primary parent can read all family templates.

**Indexes:**
- `(category, is_system)` — "system templates by category"
- `(family_id, family_member_id, is_system)` — "user's custom templates"

---

### Enum/Type Updates

Add to `template_type` enum — these are the 17 tracking types (Info Display and Quick Action are type categories, not individual enum values):
```
'tally', 'boolean_checkin', 'streak', 'multi_habit_grid', 'checklist',
'percentage', 'sequential_path', 'achievement_badge', 'xp_level',
'allowance_calculator', 'leaderboard', 'mood_rating', 'countdown',
'timer_duration', 'snapshot_comparison', 'color_reveal', 'gameboard'
```

Add to `visual_variant` — each template_type has multiple visual variants identified by slug:
```
-- Examples (not exhaustive — full list in Widget Template Catalog v3):
'progress_bar', 'donut_ring', 'star_chart', 'animated_star_chart',
'thermometer', 'coin_jar', 'bar_chart_history', 'bubble_fill',
'tally_marks', 'pixel_art_grid', 'garden_growth', 'fuel_gauge',
'flame_counter', 'chain_links', 'mountain_climb', 'growing_tree',
'classic_grid', 'color_coded_grid', 'sticker_board',
'standard_checklist', 'card_stack',
'responsibility_gauge', 'battery',
'winding_path', 'mastery_path', 'staircase', 'game_board', 'skill_tree', 'map_journey',
'badge_wall', 'trophy_shelf', 'sticker_album',
'shield_bar', 'character_levelup', 'rank_badge',
'summary_card', 'fixed_task_grid', 'dynamic_category_rings', 'points_list',
'classic_leaderboard', 'podium', 'race_track',
'emoji_row_trend', 'color_gradient', 'weather_metaphor',
'big_number', 'calendar_tearaway', 'advent_calendar',
'stopwatch_bar', 'clock_fill', 'time_bar_chart',
'before_after_card', 'trend_line', 'record_board',
'standard_reveal', 'mosaic_reveal', 'spotlight_reveal',
'road_trip', 'space_route', 'garden_path', 'castle_quest', 'ocean_voyage', 'custom_path'
```

Add to `studio_queue.destination` enum (from PRD-09B):
```
'widget'  -- routes to Widget Configuration (Screen 4)
```

Add `multiplayer_mode` enum:
```
'collaborative', 'competitive', 'both'
```

Add `multiplayer_visual_style` enum:
```
'colored_bars_side', 'colored_bars_stacked', 'colored_segments',
'colored_markers', 'colored_stars', 'game_pieces'
```

Add `multiplayer_privacy` enum:
```
'all_see_all', 'own_plus_total', 'mom_only'
```

Add `color_reveal_strategy` enum:
```
'automatic', 'gradual', 'random'
```

---

### Table: `dashboard_widgets` — Additional Columns for Multiplayer

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| visual_variant | TEXT | null | NULL | Which visual variant is selected for this tracker type (e.g., 'flame_counter', 'coin_jar'). Null = type's default variant. |
| multiplayer_enabled | BOOLEAN | false | NOT NULL | Whether this widget shows multi-member data |
| multiplayer_participants | UUID[] | '{}' | NOT NULL | Array of family_member_ids participating |
| multiplayer_config | JSONB | '{}' | NOT NULL | {mode, visual_style, shared_target, privacy, deploy_as} |
| linked_widget_id | UUID | null | NULL | FK → dashboard_widgets. If deployed as linked pair, points to the counterpart widget on the other dashboard. Null = standalone. |
| view_mode | TEXT | 'default' | NOT NULL | Enum: 'default', 'family', 'personal'. 'default' = inherits from dashboard context (family hub → family, personal dashboard → personal). |

---

### Table: `coloring_image_library` (for Color-Reveal tracker type)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| color_image_url | TEXT | | NOT NULL | Original full-color image |
| grayscale_image_url | TEXT | null | NULL | Auto-generated grayscale version |
| line_art_url | TEXT | null | NULL | B&W version for printable coloring books |
| thumbnail_url | TEXT | null | NULL | For browsing in image picker |
| image_name | TEXT | | NOT NULL | Display name ("Monarch Butterfly") |
| theme_category | TEXT | null | NULL | 'garden', 'space', 'ocean', 'fantasy', etc. |
| gamification_theme | TEXT | null | NULL | Link to Visual World if theme-specific |
| color_zones | JSONB | | NOT NULL | Array of {color, hex, name, order} |
| total_color_zones | INTEGER | | NOT NULL | Count of distinct color zones |
| recommended_min_achievements | INTEGER | 5 | NOT NULL | Minimum meaningful achievement count |
| recommended_max_achievements | INTEGER | 30 | NOT NULL | Maximum before gradients get too subtle |
| supports_gradient_reveals | BOOLEAN | true | NOT NULL | Can this image's zones be split into gradients? |
| complexity_level | INTEGER | 3 | NOT NULL | 1–5 scale |
| age_group | TEXT | 'all_ages' | NOT NULL | 'preschool', 'elementary', 'all_ages' |
| keywords | TEXT[] | '{}' | NOT NULL | For search/filtering |
| is_available_for_print | BOOLEAN | true | NOT NULL | Can be included in printable coloring book bundles |
| is_active | BOOLEAN | true | NOT NULL | Available for selection |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Readable by all authenticated users. Writeable only by system admin (product owner uploads images).

**Indexes:**
- `(theme_category, is_active)` — browse by category
- `(age_group, is_active)` — filter by age appropriateness

---

### Table: `color_reveal_progress` (per widget instance)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| widget_id | UUID | | NOT NULL | FK → dashboard_widgets |
| color_zone_index | INTEGER | | NOT NULL | Which zone was revealed (1-indexed) |
| color_hex | TEXT | | NOT NULL | The color value revealed |
| color_name | TEXT | null | NULL | Display name of this color zone |
| revealed_at | TIMESTAMPTZ | now() | NOT NULL | When this zone was revealed |
| revealed_by_member_id | UUID | null | NULL | FK → family_members. Who earned this reveal (for multiplayer collaborative). |
| achievement_count | INTEGER | null | NULL | Running count at time of reveal |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Same as parent widget.

**Indexes:**
- `(widget_id, color_zone_index)` — unique per widget
- Unique constraint on `(widget_id, color_zone_index)`

---

### Table: `coloring_gallery` (completed images saved as achievements)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| widget_id | UUID | | NOT NULL | FK → dashboard_widgets (the color-reveal widget that was completed) |
| coloring_image_id | UUID | | NOT NULL | FK → coloring_image_library |
| image_name | TEXT | | NOT NULL | Cached from library for display |
| completed_image_url | TEXT | null | NULL | Snapshot of the completed reveal (optional) |
| completed_at | TIMESTAMPTZ | now() | NOT NULL | |
| total_achievements | INTEGER | | NOT NULL | How many achievements it took |
| achievement_description | TEXT | null | NULL | Custom text about what was achieved |
| is_favorite | BOOLEAN | false | NOT NULL | Pinned to top of gallery |
| display_order | INTEGER | 0 | NOT NULL | Sort order in gallery |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Owner + primary parent. Gallery is a celebration feature — always visible to mom.

**Indexes:**
- `(family_id, family_member_id, completed_at DESC)` — "this member's gallery, newest first"

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-09A: Task completions | When a task is marked complete, any linked widget's data_point is automatically created. Triggers celebration animation on the widget. |
| PRD-09A: Task Creation Queue | Items with `destination = 'widget'` route to Widget Configuration (Screen 4). |
| PRD-09B: Studio "Coming Soon" cards | PRD-10 wires the tracker/widget template cards in Studio to live functionality. Tapping [Customize] opens Screen 4. |
| PRD-06: Best Intentions iterations | Tap-to-celebrate on Best Intentions can trigger linked widget progress (e.g., streak counter for intention consistency). |
| PRD-08: Smart Notepad routing | "Send to → Track This" routes content to Screen 5 with pre-filled title. |
| PRD-05: LiLa conversation | LiLa offers "Track This" action chip when user expresses desire to track something. Routes to Screen 5. |
| PRD-02: Special Adult shift start | Shift start triggers loading of assigned children's widgets for the caregiver view (Screen 6). |
| PRD-03: Theme changes | When a member's theme changes, all their widgets re-render with new theme tokens automatically. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-11: Victory Recorder | Widget milestones (completing a star chart, reaching a streak goal, filling a coin jar) trigger victory records with `source = 'widget_milestone'`. |
| PRD-24: Rewards & Gamification | Widget completions feed gamification themes (flowers bloom, pets level up, etc.). Points earned from widgets feed reward balances. |
| PRD-28: Tracking & Allowance | Allowance Calculator widget's completion percentage feeds allowance pool calculations. |
| PRD-05: LiLa context | Widgets with `is_included_in_ai = true` provide progress context to LiLa (e.g., "Ruthie has a 14-day morning routine streak"). |
| Dashboard rendering | All dashboard views (mom's, family overview, View As, tablet hub) consume widget data for display. |

---

## AI Integration

### LiLa Context Loading
Widgets with `is_included_in_ai = true` contribute to LiLa's context assembly:

```
Widget context for [Member Name]:
- Morning Routine: 14-day streak (current)
- Reading Goal: 67.5 / 100 hours (67.5%)
- Star Chart: 18/20 stars this week
- Allowance: $10.44 earned this week (74.6% completion)
```

### Track This via LiLa
When a user says something like "I want to track how much water I drink" or "Can we track Ruthie's piano practice?", LiLa:
1. Recognizes the tracking intent
2. Offers a "Track This" action chip
3. Pre-fills the Track This flow (Screen 5) with extracted information (what to track, who it's for)
4. Returns to conversation after widget is deployed with confirmation: "Done! I added a [template name] to [member]'s dashboard."

### System Prompt Notes
- LiLa should proactively suggest tracking when a user repeatedly mentions checking on the same metric
- LiLa should reference widget progress when celebrating victories or coaching
- LiLa should not overwhelm with tracker suggestions — one suggestion per conversation maximum

---

## Edge Cases

### Empty Dashboard
- New users see a pre-populated dashboard with Welcome Widget, Best Intentions Widget, Quick Add Widget, and Library Shortcut Widget (per existing spec)
- After first tool or tracker is added, Welcome Widget auto-hides

### Widget with No Data Yet
- Display empty state with encouraging message: "No data yet — check off your first [task/item] to see progress!"
- Progress visualizations show at 0% / empty state
- Streak counter shows "Start your streak!" rather than "0 days"

### Widget Linked to Deleted Task
- If all linked tasks are archived/deleted, widget shows "This tracker's tasks have been archived. Restore them or link new tasks." with action buttons
- Widget data is preserved (historical data points remain)

### Folder with One Widget
- If a folder contains only one widget, display it as a regular widget on the dashboard (auto-unfolder)
- If user drags the last remaining widget out of a folder, the folder is auto-deleted

### Special Adult Shift Ends Mid-Interaction
- If a scheduled shift auto-ends while the caregiver is interacting, show a gentle notification: "Your shift has ended. You can finish what you're doing, but new interactions will require starting a new shift."
- Data entered up to the end of the shift is preserved

### Large Number of Widgets
- Dashboard supports up to 50 widgets per member (including folder contents)
- Performance optimization: widgets below the fold are lazy-loaded
- Warning at 40+ widgets: "Your dashboard is getting full! Consider grouping widgets into folders."

### Theme Change Mid-Session
- When a member's theme changes, all widgets re-render with new tokens on next dashboard load
- Currently visible widgets update in real time via CSS variable swap (no reload needed)

### Co-Parent Always-On Shift
- When mom configures a Special Adult with "always on" shift access (no start/end required), the co-parent sees the children's widgets immediately on login without tapping "Start Shift"
- All other Special Adult behaviors remain the same (filtered by permissions, child-switcher, data attribution)

---

## Tier Gating

**Tier gating deferred.** All widget types, visual variants, starter configurations, multiplayer features, folders, decorative layer, and Track This are available to all users during beta. Tier splits will be determined after real usage testing reveals which features deliver the most value and which are natural upgrade incentives.

The `useCanAccess('widgets')` hook is wired from day one and returns `true` for all widget features during beta. When tier gating is implemented (post-beta), granular feature keys will be added without schema changes.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `widgets` | All widget functionality | TBD post-beta |

> **Decision rationale:** Premature tier splitting would constrain testing and limit discovery of which features are "must-have" vs. "nice-to-have." The maximalist philosophy applies here — give everyone everything during beta, then make informed tier decisions based on actual usage patterns.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Widget milestone → Victory Record | Victory Recorder auto-creation from widget completions | PRD-11 (Victory Recorder) |
| Widget completion → Gamification theme progress | Points/progress feeding gamification overlays | PRD-24 (Rewards & Gamification) |
| Allowance Calculator → payment tracking | Completion percentage feeding allowance pool | PRD-28 (Tracking, Allowance & Financial) |
| Widget pinning from Lists | List displayed as a lightweight widget on dashboard | PRD-14 (Personal Dashboard) — deferred list-pin widget type |
| Seasonal decoration packs | Additional sticker/decoration sets for Cozy Journal vibe | Post-MVP content |
| Nautical vibe decorations | Maritime-themed decorative elements | Post-MVP content |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Widget rendering system and layout engine | PRD-01 (Decision #10) | Fully defined: grid layout, snap-to-grid, S/M/L sizing, auto-arrange + manual mode |
| Tracker/widget template cards in Studio "Coming Soon" | PRD-09B | Studio cards link to Widget Configuration (Screen 4). Category "Trackers & Widgets" is now live. |
| Studio queue destination = 'widget' | PRD-09B | Queue items with widget destination route to Screen 4 |
| "Track This" widget creation flow from task data | PRD-09A (Deferred #17) | Screen 5 defines the Track This quick-creation pipeline |
| Dashboard widget containers for Guiding Stars and Best Intentions | PRD-06 | Info widget templates: 'info_best_intentions' and related widgets defined in template catalog |
| View As widget interaction | PRD-02 (Screen 5) | View As renders child's widgets using this PRD's portable widget components; mom interacts as if child |
| Tablet hub widget slots | PRD-01 | Tablet hub uses the same grid layout and widget rendering system with tablet-appropriate breakpoints |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Dashboard grid layout renders correctly at all three breakpoints (mobile 2-col, tablet 3-col, desktop 4-col)
- [ ] Widgets snap to grid cells with S/M/L sizing
- [ ] Auto-arrange mode places widgets efficiently by default
- [ ] Long-press enters edit mode with wiggle animation, drag handles, resize handles, delete buttons
- [ ] Drag-to-reorder works on all touch and pointer devices
- [ ] Widget folders: drag-to-create, modal overlay on tap, drag-to-ungroup
- [ ] All 17 tracker types function correctly with their data engines
- [ ] All visual variants from mockup sheets ([M] tagged in catalog) render with theme token consumption
- [ ] Widget Configuration (Screen 4) works for all tracker types with live preview
- [ ] Widget Picker (Screen 3) organized by life-area categories with thumbnail previews
- [ ] Track This flow (Screen 5) accessible from QuickTasks strip
- [ ] Special Adult shift view renders child's widgets with child's theme
- [ ] Caregiver interactions trigger celebration animations on their screen
- [ ] Child-switcher works for caregivers assigned to multiple children
- [ ] Color-Reveal tracker type: image selection from library, progressive zone reveal, gradient splitting for counts > zones, gallery save on completion
- [ ] Gameboard tracker type: path rendering, game piece movement, special spaces, themed by Visual World
- [ ] Multiplayer layer: enable toggle, participant selection, mode picker (collaborative/competitive/both), visual style picker
- [ ] Multiplayer rendering: colored bars, colored segments, colored markers on track, colored stars, game pieces in member colors
- [ ] Family/personal view toggle on multiplayer widgets
- [ ] Linked pair deployment: auto-deploy to family hub + personal dashboards
- [ ] Member color system: colors assigned from existing PRD-03 brand palette (44+ colors), no hard cap on members, shape modifiers for game pieces
- [ ] `dashboard_widgets`, `dashboard_widget_folders`, `widget_data_points`, `widget_templates`, `coloring_image_library`, `color_reveal_progress`, `coloring_gallery` tables created with RLS
- [ ] RLS verified: caregiver cannot see widgets outside their assigned children and active shift
- [ ] RLS verified: teen cannot see other family members' widget data (unless multiplayer participant)
- [ ] RLS verified: multiplayer privacy settings enforced (own_plus_total hides individual breakdown from participants)
- [ ] Task completion → widget data point auto-creation works for task-linked widgets
- [ ] Widget history view shows last 7/14/30/all-time data
- [ ] Guided children can reorder widgets but not resize or delete
- [ ] Play children see fixed layout set by mom
- [ ] Play children always see collaborative multiplayer view (never competitive)
- [ ] `is_included_in_ai` toggle works on widgets
- [ ] Three tracker structure approaches (Fixed Task, Dynamic Pool, Points-Weighted) configurable for Allowance Calculator
- [ ] Starter configuration library populates Studio with 90+ pre-built configs across 10 life-area categories

### MVP When Dependency Is Ready
- [ ] Track This from LiLa conversation (requires PRD-05 action chip wiring)
- [ ] Track This from Smart Notepad routing (requires PRD-08 routing destination wiring)
- [ ] Widget milestone → Victory Record creation (requires PRD-11)
- [ ] Widget completion → Gamification theme progress (requires PRD-24)
- [ ] Allowance Calculator → payment tracking (requires PRD-28)
- [ ] Gamification system templates in Studio (requires PRD-24)

### Post-MVP
- [ ] Decorative layer for Cozy Journal vibe (stickers, washi tape, thumbtacks, doodles)
- [ ] Nautical vibe decorative elements
- [ ] Seasonal decoration packs
- [ ] Widget marketplace / community-shared templates
- [ ] Multiple dashboard layouts (Morning, Evening, Weekend — saved layout switching)
- [ ] Shared dashboard layouts ("Sarah shared her layout with you")
- [ ] Smart widget suggestions from LiLa ("Based on your usage, try adding a Reading Tracker")
- [ ] Widget export/share (image snapshot of widget for sharing)
- [ ] Advanced chart visualizations in widget history (line charts, comparison views)
- [ ] Co-parent always-on shift auto-login (no start shift button needed)

---

## CLAUDE.md Additions from This PRD

- [ ] Dashboard grid: 4-col desktop, 3-col tablet, 2-col mobile. Widgets S=1×1, M=2×1, L=2×2 (desktop). CSS Grid with `grid-template-columns: repeat(var(--grid-cols), 1fr)`.
- [ ] Widget three-level architecture: Tracker Type (data engine) → Visual Variant (rendering) → Starter Configuration (JSON preset). Types are schema-level, variants are React components, starter configs are data.
- [ ] Widgets consume theme tokens exclusively — never hardcode colors. Same widget renders identically across all themes via CSS variable swap.
- [ ] Widgets are portable components: render identically regardless of host dashboard. Props: `themeTokens`, `widgetConfig`, `dataSource`, `multiplayerData` (optional).
- [ ] Auto-arrange is default. `layout_mode = 'auto'` until user manually moves a widget, then switches to `'manual'`. "Reset to Auto" reverts.
- [ ] Long-press = edit mode. Wiggle animation + drag handles + resize + delete buttons. "Done" to exit.
- [ ] Folders: drag widget onto widget = create folder. Tap folder = modal overlay. One widget in folder = auto-unfolder.
- [ ] Special Adult shift view uses child's theme tokens and widget components. Celebrations fire on caregiver's screen.
- [ ] `widget_data_points` is append-only for tracking history. Never update or delete data points — always insert new ones.
- [ ] Track This = streamlined entry into Widget Configuration. Pre-fill from Smart Notepad or LiLa context. 3–4 taps to deploy.
- [ ] Guided children: reorder yes, resize/delete/create no. Play children: view only, mom controls layout.
- [ ] Decorative layer (Cozy Journal vibe only, post-MVP): decorations stored in `dashboard_configs.decorations` JSONB. `pointer-events: none` on decorations. Random slight rotation (3–15°) for authenticity.
- [ ] **Member color tokens:** Member colors are assigned from the existing brand palette (PRD-03, 44+ colors across 9 families). `family_members.assigned_color_token` is TEXT referencing a palette color. No hard cap on members. Shape modifiers (`game_piece_shape`) provide additional distinctness for game pieces and accessibility.
- [ ] **Multiplayer layer:** Cross-cutting config on any numeric tracker. Three modes: collaborative, competitive, both. Play mode = always collaborative. Default = both. Never defaults to competitive.
- [ ] **Multiplayer visual styles:** colored_bars_side, colored_bars_stacked, colored_segments, colored_markers, colored_stars, game_pieces. Component pattern: `MultiplayerDataProvider` fetches all participants' data → passes `{memberId, value, color, label}[]` → visual style component renders.
- [ ] **Family/personal view toggle:** Multiplayer widgets have two views. Family view = all participants. Personal view = my data in shared context. Linked pair = auto-deploy to both family hub + personal dashboards. Toggle in widget header switches views.
- [ ] **Color-Reveal tracker:** Image from `coloring_image_library` + dynamic gradient splitting algorithm. Achievements > zones → split into gradient families. Completion → `coloring_gallery` save + celebration.
- [ ] **Gameboard tracker:** Board-game path with game pieces in member colors. Special spaces (bonus, shortcut, mystery). Themed by Visual World. Multiplayer = multiple pieces on same board.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `dashboard_widgets`, `dashboard_widget_folders`, `widget_data_points`, `widget_templates`, `coloring_image_library`, `color_reveal_progress`, `coloring_gallery`
Tables updated: `dashboard_configs` (added `layout_mode`, `decorations`, `grid_columns`), `family_members` (added `assigned_color_token` referencing PRD-03 palette, `game_piece_shape` — coordinate with PRD-01)
Enums added: `template_type` (17 tracker types), `visual_variant` (75+ slugs), `multiplayer_mode`, `multiplayer_visual_style`, `multiplayer_privacy`, `color_reveal_strategy`
Enums updated: `studio_queue.destination` (added 'widget')
Triggers added: Task completion → `widget_data_points` insert for linked widgets. Color-reveal achievement → `color_reveal_progress` insert + gallery save check.

---

*End of PRD-10*
