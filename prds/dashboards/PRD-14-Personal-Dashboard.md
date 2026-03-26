> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-14: Personal Dashboard

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder + Daily Celebration), PRD-12A (Personal LifeLantern — stub), PRD-13 (Archives & Context)
**Created:** March 10, 2026
**Last Updated:** March 10, 2026

---

## Overview

PRD-14 defines the Personal Dashboard — every member's home page when they open MyAIM Family. This is a personal growth space, not a family management tool. Each member lands on their own dashboard, customized to their needs and permission level.

This PRD establishes the shared dashboard architecture (the section/grid hybrid layout model, section reordering, greeting system, calendar display, active tasks hosting, widget grid hosting) and fully specifies the **Mom**, **Dad/Additional Adult**, and **Independent Teen** dashboard experiences. These three shells share the same layout engine with permission-scoped differences. Guided and Play dashboards — which require substantially different interaction patterns and heavy gamification integration — are specified in PRD-25 and PRD-26 respectively, written after PRD-24 (Rewards & Gamification).

> **Mom experience goal:** When mom opens the app, she should feel like she's arriving at *her* space — not a family command center, not a to-do list, but a personal growth home that happens to connect to everything else. Her dashboard greets her, reminds her of who she's choosing to become, shows her what's on today's calendar, presents her tasks in whatever lens she prefers, and gives her a customizable grid of widgets she's arranged exactly how she wants them. If she wants to check on her family, the perspective switcher is one tap away — but her default view is *her*.

> **Depends on:** PRD-04 (Shell Routing) defines the shell container and zone layout. PRD-14 defines the dashboard content that renders inside that container. PRD-10 (Widgets) defines the widget grid mechanics, widget templates, and portable widget components. PRD-09A (Tasks) defines the Active Tasks section contract (13 view toggles, per-shell rendering). PRD-06 (Guiding Stars & Best Intentions) defines the rotation widget and celebration widget data.

---

## Related PRDs in the PRD-14 Family

| PRD | Feature | Status |
|-----|---------|--------|
| **PRD-14** (this document) | Personal Dashboard — shared architecture + Mom/Adult/Independent | Current |
| **PRD-14B** | Calendar | Planned (separate session) |
| **PRD-14C** | Family Overview (mom's aggregated all-seeing perspective) | Planned |
| **PRD-14D** | Family Hub (shared family coordination, tablet hub surface) | Planned |
| **PRD-14E** | Family Hub TV Mode (smart TV PWA, ambient display, remote navigation) | Planned (after PRD-14D) |
| **PRD-25** | Guided Mode Dashboard (after PRD-24 Gamification) | Planned |
| **PRD-26** | Play Mode Dashboard (after PRD-24 Gamification) | Planned |
| **PRD-27** | Caregiver Tools / Special Adult shift view | Locked |

---

## User Stories

### Landing Experience
- As a mom, I want to land on my personal dashboard when I open the app so I'm treated as a person first, not just a family manager.
- As a dad, I want my own personal dashboard that feels like mine — not a limited version of mom's.
- As an independent teen, I want a dashboard that treats me as a capable person with my own goals, tasks, and trackers.

### Greeting & Inspiration
- As any adult member, I want a personalized greeting with a rotating view of my Guiding Stars declarations so I'm reminded of who I'm choosing to become every time I open the app.
- As a mom, I want the greeting to feel warm but not saccharine — a simple "Good morning, [Name]" with one of my declarations rotating beneath it.

### Calendar Display
- As any member, I want a collapsible calendar on my dashboard showing my schedule so I know what's happening today and this week without navigating to a separate page.
- As a mom, I want to toggle between seeing just my schedule and the whole family's schedule on my dashboard calendar.
- As any member, I want to choose whether my calendar shows a weekly or monthly view, and I want that choice to persist.
- As any member, I want to pick whether my week starts on Sunday or Monday.
- As any member, I want to tap any date on the calendar and see what's scheduled for that day.
- As any member, I want to navigate to a different month or year easily — not by scrolling through a long picker wheel, but with a dropdown where I can select month and year or type a year directly.

### Active Tasks
- As any adult member, I want a collapsible Active Tasks section on my dashboard with view toggles so I can see my tasks through whichever productivity lens suits my mood.
- As a mom, I want my most-used task view to appear first automatically so I don't have to scroll through toggles every morning.

### Widget Grid
- As a mom, I want my widgets arranged in a phone-home-screen grid below my sections so I can see trackers, info cards, and pinned lists at a glance.
- As a teen, I want to create and arrange my own widgets on my dashboard.
- As a dad, I want the same grid customization as mom on my own dashboard.

### Section Customization
- As any adult member, I want to drag-and-drop full-width sections to reorder them so I can put what matters most to me at the top.
- As a mom, I want to be able to put my widget grid above my tasks if that's what I prefer — no forced ordering.

### Perspective Switcher (Mom Only)
- As a mom, I want a perspective switcher on my dashboard page so I can toggle between my personal view, the family overview, and viewing as a specific family member — all without leaving the dashboard page.

---

## Screens

### Screen 1: Personal Dashboard — Mom / Adult / Independent (Full Layout)

> **Depends on:** Shell container layout — defined in PRD-04. Widget grid mechanics — defined in PRD-10.

**What the user sees:**

A vertically scrolling page inside the main content zone of the shell layout (PRD-04). The page consists of an optional **Perspective Switcher** (mom only), followed by a sequence of **full-width collapsible sections** and the **widget grid**. All sections and the widget grid are reorderable via drag-and-drop in edit mode.

```
┌─────────────────────────────────────────────────┐
│  [My Dashboard] [Family Overview] [Hub] [View As]│  ← Mom only
├─────────────────────────────────────────────────┤
│                                                   │
│  Good morning, Tenise                             │
│  "I do hard things until hard things become easy" │  ← rotating
│                                                   │
├─────────────────────────────────────────────────┤
│  📅 Calendar                              [v] ▼  │
│  ┌─ Mar 10  ─┬─ Mar 11 ─┬─ Mar 12 ─┬─ ...    │
│  │ Soccer 3p │ Dentist  │          │          │
│  │ Piano 5p  │ 10:30a   │          │          │
│  └───────────┴──────────┴──────────┴─ ...    │
│  [Week ○ Month]  [Self ○ Family]  [< Mar 2026 >]│
├─────────────────────────────────────────────────┤
│  ✅ Active Tasks (7)                       [v] ▼  │
│  [Simple List] [Eisenhower] [Eat the Frog] [...] │
│  ┌──────────────────────────────────────────┐    │
│  │ ☐ Review Q1 budget          Due: Today   │    │
│  │ ☐ Schedule dentist for Jake  Due: Wed     │    │
│  │ ☐ Meal plan for next week    Due: Thu     │    │
│  └──────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐  ┌──────┐  ┌──────┐          │
│  │ Reading       │  │ Water│  │ GS   │          │
│  │ Tracker       │  │ 4/8  │  │ ✦✦✦  │          │
│  │ ▓▓▓▓░░ 74%   │  │ cups │  │ rotate│          │
│  │   (M)         │  │ (S)  │  │ (S)  │          │
│  └──────────────┘  └──────┘  └──────┘          │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │ Best          │  │ Pinned List  │              │
│  │ Intentions    │  │ Grocery      │              │
│  │ ☑ Pause ×3   │  │ 8/12 items   │              │
│  │   (M)         │  │   (M)        │              │
│  └──────────────┘  └──────────────┘              │
│                                                   │
│  [+ Add Widget]                                   │
└─────────────────────────────────────────────────┘
```

**Greeting Header (always visible, not collapsible):**
- Personalized greeting based on time of day: "Good morning, [Name]" / "Good afternoon, [Name]" / "Good evening, [Name]"
- Below the greeting, a single Guiding Stars declaration rotates with a smooth fade transition. Rotation interval: configurable (default 30 seconds), or tap to advance. Only shows entries where `is_included_in_ai = true` on the `guiding_stars` table. If the member has no Guiding Stars entries, this line is hidden — no empty state nudge in the greeting area.
- Greeting area uses `--font-display` (The Seasons serif) for the member name and `--font-body` (DM Sans) for the declaration text.

> **Decision rationale:** The greeting is not collapsible because it's the emotional anchor of the page — the first thing you see. Collapsing it saves trivial vertical space at the cost of the "this is YOUR space" feeling.

**Perspective Switcher (mom shell only):**
- Segmented control in the main content header area (per PRD-04 spec).
- Tabs: **My Dashboard** (active by default), **Family Overview** (stub → PRD-14C), **Family Hub** (stub → PRD-14D), **View As...** (inline member picker, per PRD-02).
- Disappears when mom navigates to any other feature page via sidebar (per PRD-04 decision #3).

**Collapsible Sections:**
- Each section has a header row with: section icon, section title, item count badge (where applicable), and a `▼` / `▶` collapse toggle on the right.
- Sections remember their collapsed/expanded state per user (persisted in `dashboard_configs.layout` JSONB).

**Responsive Section Width:**
- **Mobile (2-col grid):** Sections always span full width. No widgets beside sections.
- **Tablet and Desktop (3+ col grid):** Sections span a configurable number of columns (default: 3 of 4 on desktop, 3 of 3 on tablet). Widgets can fill remaining columns beside a section when space allows.
- **Auto-arrange (default):** When `layout_mode = 'auto'`, the system intelligently places small widgets beside narrower sections to maximize space usage. Sections default to 3-col span on 4-col grids.
- **Manual mode:** In edit mode, the user can resize section width (similar to widget resize — cycle between available span options for the current grid). This lets mom put her calendar at 2-col wide with two small widgets beside it, or stretch tasks to full width.
- **Section `col_span` persists** in the `dashboard_configs.layout.sections` array per section.

> **Decision rationale:** Desktop with sidebar + notepad open leaves ~700-800px of main content. Full-width sections waste space that could hold widgets. Allowing sections to share rows with widgets creates a denser, more useful layout on larger screens while gracefully collapsing to full-width on mobile.

**Orientation & Viewport Handling:**
- The dashboard grid responds to viewport changes (including tablet orientation changes) without page reload. CSS Grid column count adjusts automatically based on available main content width.
- **Tablet portrait** (~768px main content): 3-col grid, sections span full width.
- **Tablet landscape** (~1024px main content, sidebar open): 3-4 col grid, sections can share rows with widgets.
- **Desktop with notepad open** (~700-780px main content): 4-col grid with narrower columns; section/widget side-by-side layout.
- **Desktop without notepad** (~980-1060px main content): 4-col grid with wider columns; more breathing room for side-by-side.
- Orientation changes re-flow sections and widgets using the same auto-arrange algorithm. No user action required.

> **Decision rationale:** Horizontally mounted family tablets are a real use case. The dashboard must render correctly in both portrait and landscape without requiring the user to rotate their device. ResizeObserver (per PRD-04) handles this reactively.

> **Forward note for PRD-14D (Family Hub) and PRD-14E (TV Mode):** The Family Hub should be renderable as a PWA at any resolution and orientation, including smart TV displays. A "TV mode" is a high-value product opportunity — families could install the Hub as a PWA on Android TV, Google TV, or Fire TV (these platforms support installable PWAs) and use it as a digital family bulletin board on their existing TV, replacing dedicated devices like Skylight. TV mode requires: (1) a large-screen CSS layer (fonts readable from 10 feet, high contrast, no hover states, no tiny tap targets), (2) D-pad/remote navigation via proper focus management (CSS `:focus-visible`, logical tab order, large focusable cards — arrow keys map to focus movement), (3) an auto-cycle "ambient" mode that rotates through content panels (calendar, today's tasks, countdown to events, meal plan, family victories) when idle, and (4) a remote-friendly navigation pattern (big cards you arrow between, not a sidebar). This is achievable as a CSS/layout mode on top of the existing PWA — no native TV app needed. Marketing angle: "Turn any TV into a family command center. No extra hardware." This is a significant differentiator for the target market (families who already have smart TVs). PRD-14D defines the Hub content and tablet rendering; PRD-14E (written after PRD-14D) defines the TV-specific rendering, D-pad navigation, ambient mode, and PWA install flow.
>
> **Validated:** StewardShip was successfully navigated on a Fire TV via Silk browser — user selection, task completion, and large button interaction all functional. Confirms PWA-on-TV approach is viable. PRD-14E optimizes what already works.
>
> **Additional TV mode concepts for PRD-14E:**
> - **Hub lock mode:** Mom can configure the TV to stay locked on the Family Hub until a condition is met (e.g., all required tasks complete for the day, daily celebration done). The family's entertainment screen becomes the accountability screen — TV content is gated behind task completion. Condition types and override rules (mom PIN unlock) to be specified in PRD-14E.
> - **Slideshow Frame widget:** A photo slideshow widget for the Family Hub that rotates through mom-uploaded images. Can render as a standard widget in the Hub grid, or maximize to full-screen as a digital picture frame with Hub info (time, next event, task count) overlaid in a corner. Turns the TV from a purely functional display into something families want on their screen even when there's nothing to do. Image upload, rotation interval, and display mode (grid widget vs. full-screen frame vs. picture-in-picture with Hub content) to be specified in PRD-14D or PRD-14E.

**Calendar Section (collapsible):**
- Dashboard-level calendar display. Full calendar feature spec in PRD-14B.
- **View toggle:** Week (default) or Month. Persists per user in `dashboard_configs.preferences`.
- **Week start:** Sunday (default) or Monday. Configurable in dashboard settings, persists in `dashboard_configs.preferences`.
- **Date navigation:** Left/right arrows for previous/next week or month. Center label shows current range (e.g., "Mar 10–16, 2026" for week view, "March 2026" for month view). Tapping the center label opens a **date picker dropdown**: month selector (dropdown), year with inline editable text field (tap to type a year directly), and a mini calendar grid for quick date jumping. No scroll wheel for years.

> **Decision rationale:** The "wheel of fortune" year scroller is a terrible UX pattern for navigating dates far in the future or past. A typed year input plus dropdown month gives fast, precise navigation.

- **Tap any date:** Opens a day detail overlay/flyout showing that day's scheduled items as cards (event title, time, location if available, assigned member color dot for family view). Tapping an event card navigates to the event detail (when Calendar PRD is built; stub for now).
- **Mom filter toggle:** "My Schedule" (default) or "Family Schedule." Family view shows all family members' events with member color coding. Other adult shells and Independent teens see only their own schedule (no family toggle).
- **Data source:** Reads from `calendar_events` table (stub — table defined in PRD-14B Calendar). Until Calendar PRD is built, the section shows an empty state: "Your calendar will appear here once you start adding events."

> **Forward note for PRD-14B (Calendar):** Tenise's calendar vision includes a MindSweep/Review & Route intake flow: kids and family members can send screenshots, notes, text, emails, or images of flyers to the MindSweep pipeline (PRD-08 Review & Route). The system routes these to a calendar event queue where mom can approve the who/when/where logic and route to appropriate calendars. Mom can optionally allow trusted members to bypass approval. Default is human-in-the-mix. Additionally, when adding events, members should tag who needs to be present so mom sees attendance requirements. The Play mode calendar should be icon-rich (auto-suggested icons by event category, mom can override). All of this belongs in PRD-14B.

**Active Tasks Section (collapsible):**
- Implements the contract defined in PRD-09A Screen 7.
- Section header: "Active Tasks" with task count badge showing number of incomplete tasks.
- **View toggle carousel:** Horizontally scrolling row of view pills below the section header. Auto-sorted by the user's personal usage frequency (most-used views appear first). 13 views for adult shells as defined in PRD-09A.
- Task cards render per the PRD-09A specification for the active view.
- **Task Action Tools** accessible from any task via long-press: Task Breaker, Focus Timer (per PRD-09A).

**Widget Grid:**
- Implements the grid layout system defined in PRD-10.
- 4-column desktop, 3-column tablet, 2-column mobile.
- Widgets snap to grid in sizes: Small (1×1), Medium (2×1), Large (2×2).
- Auto-arrange is the default (`layout_mode = 'auto'`). Switches to `'manual'` on first user rearrangement. "Reset to Auto" reverts.
- [+ Add Widget] button at the bottom of the grid opens the Widget Picker (PRD-10 Screen 3).
- Widget folders supported (drag widget onto widget to create, per PRD-10).
- Decorative layer available for Cozy Journal vibe (per PRD-10, post-MVP).

**Default widgets for new users (auto-deployed on first dashboard load):**

| Widget | Type | Size | Condition |
|--------|------|------|-----------|
| Guiding Stars Rotation | Info widget | Small | If member has ≥1 Guiding Star |
| Best Intentions Celebration | Info widget | Medium | If member has ≥1 Best Intention |
| Today's Victories | Info widget | Small | Always |

> **Decision rationale:** Three starter widgets give the dashboard life on day one without overwhelming. Additional widgets are deployed as features are activated (e.g., when a tracker is created, its widget auto-deploys to the dashboard).

**Interactions:**
- **Long-press anywhere on the dashboard** → enter edit mode (wiggle animation on all sections and widgets, drag handles appear, per PRD-10).
- **In edit mode:** drag sections to reorder (sections snap above or below each other, or beside widgets on 3+ col grids). Drag widgets to reposition within the grid. Resize widgets. Resize section width (on 3+ col grids, cycle through available column span options). Create/manage folders. Toggle section visibility. Tap "Done" to exit edit mode and save.
- **Section visibility toggle (edit mode only):** Each section shows an eye icon in edit mode. Tap to hide/show. Hidden sections don't render but remain in the config for easy re-enabling.
- **Scroll behavior:** Smooth vertical scroll. Collapsed sections take minimal vertical space (just the header row). Widget grid scrolls as part of the page, not independently.

**Data created/updated:**
- `dashboard_configs.layout` JSONB updated with section order, section visibility, section collapse state, widget positions, widget sizes, folder groupings.
- `dashboard_configs.preferences` JSONB updated with calendar view mode, week start day, calendar filter (self/family).
- `dashboard_configs.layout_mode` set to `'manual'` on first section or widget rearrangement.

**Role-specific behavior:**

| Role | Section Reorder | Widget Edit | Calendar Filter | Perspective Switcher | Task Views |
|------|----------------|-------------|-----------------|---------------------|------------|
| Mom | Full drag-and-drop | Full (PRD-10) | Self / Family toggle | Yes (4 tabs) | All 13 |
| Dad / Additional Adult | Full drag-and-drop | Full (PRD-10) | Self only (no family toggle) | No | All 13 (except By Member unless granted) |
| Independent Teen | Full drag-and-drop | Full (PRD-10) | Self only | No | All 13 (except By Member) |
| Guided | Locked by mom | Reorder only (PRD-10) | Self only | No | Simple List, Now/Next/Optional only |
| Play | Locked by mom | No edit | Icon-rich visual (PRD-26) | No | No view toggles (PRD-26) |

> **Forward note:** Guided and Play rows above are summary stubs. Full specifications in PRD-25 (Guided Dashboard) and PRD-26 (Play Dashboard).

---

### Screen 2: Section Edit Mode

**What the user sees:**

When the user long-presses on the dashboard, the entire page enters edit mode:

- All sections and widgets show a subtle wiggle animation.
- Each full-width section shows a **drag handle** (⋮⋮ icon) on the left and an **eye toggle** on the right.
- The widget grid shows individual widget drag handles, resize handles, and [×] remove buttons (per PRD-10 edit mode).
- A floating "Done" button appears at the bottom of the screen.
- Background dims slightly behind the edit controls.

**Section reordering:**
- Drag a section by its handle to move it above or below other sections.
- The widget grid is treated as a section for ordering purposes — it can be moved above or below any full-width section.
- Drop zones show a highlighted line between sections during drag.
- Sections snap to position on drop (no free-floating).

**Section visibility:**
- Tap the eye icon to toggle a section between visible and hidden.
- Hidden sections show with reduced opacity and a strikethrough title during edit mode.
- Hidden sections are not rendered during normal viewing.

**Interactions:**
- Tap "Done" → exit edit mode, persist all changes to `dashboard_configs.layout` JSONB.
- Tap outside any draggable element → same as "Done."
- Changes are saved optimistically (UI updates immediately, server sync in background).

**Data updated:**
- `dashboard_configs.layout.sections` array updated with new order, visibility flags, and collapse state.
- `dashboard_configs.layout.widgets` array updated with positions, sizes, folder assignments (per PRD-10).

---

### Screen 3: Day Detail Overlay (Calendar Tap)

**What the user sees:**

When the user taps a date on the calendar section, a flyout/overlay appears showing that day's events:

- **Header:** Day name and full date (e.g., "Wednesday, March 12, 2026")
- **Event cards:** Chronologically ordered. Each shows:
  - Time (or "All day")
  - Event title
  - Location (if set)
  - Member color dot(s) (in family view, showing which members are involved)
  - Source indicator if the event came from a task due date
- **Empty state:** "Nothing scheduled for this day." with a muted "Add Event" link (stub until PRD-14B).
- **Close:** Tap outside the overlay, or tap the [×] button.

> **Depends on:** PRD-14B (Calendar) for event data. Until Calendar PRD is built, this overlay shows the empty state for all dates.

**Data read:**
- `calendar_events` table filtered by date and member scope (stub).

---

### Screen 4: Dashboard Empty State (New User)

**What the user sees on first login:**

- Greeting header with their name (no Guiding Stars declaration yet — that line is hidden).
- Calendar section in collapsed state with empty state message: "Your calendar will appear here once you start adding events."
- Active Tasks section showing zero tasks with a warm message: "No tasks yet — and that's perfectly fine. When you're ready, tap the sidebar or use the QuickTasks strip to add your first one."
- Widget grid with 1 auto-deployed widget: "Today's Victories" (showing zero). Below it, a warm onboarding card (not a widget — a one-time dismissible card): "Welcome to your dashboard! This is your personal space. As you explore MyAIM, trackers and tools will appear here. You can always add more from the [+ Add Widget] button."
- The onboarding card has a "Got it" dismiss button. Once dismissed, it never reappears (tracked in `dashboard_configs.preferences.onboarding_dismissed`).

> **Mom experience goal:** Day one should feel inviting, not empty. The single Victory widget and the warm onboarding message create a sense of "this space is ready for you" rather than "you have nothing."

---

### Screen 5: Guided and Play Dashboard (Stubs)

> **Forward note:** These are architectural stubs only. Full specifications in PRD-25 (Guided Dashboard) and PRD-26 (Play Dashboard), written after PRD-24 (Rewards & Gamification).

**Guided Dashboard (PRD-25):**
- Uses the same section/grid hybrid architecture as adult shells.
- Collapsible sections present: Calendar (same display, self-only filter), Active Tasks (2 views: Simple List and Now/Next/Optional).
- Widget grid: mom-arranged, child can reorder but not resize/delete/create.
- Greeting: warmer tone, slightly larger font per Guided shell tokens. Guiding Stars declaration rotation if teen has entries (most Guided members won't).
- Section order locked by mom. Widget arrangement locked by mom except reordering.
- Gamification progress indicator in header area (per PRD-04 Guided shell spec).
- Bottom nav always visible (per PRD-04).

**Play Dashboard (PRD-26):**
- Different rendering layer but same underlying data model (`dashboard_configs` table).
- Large visual tiles instead of standard sections.
- Icon-rich calendar: collapsible, shows icons per event (auto-suggested by category, mom can override). Minimal text.
- Tasks as large colorful tiles with one-tap completion and celebration animations. No view toggles. Always expanded.
- Widget grid: mom-arranged and locked. Larger touch targets. No edit mode.
- Greeting: visual/avatar-based. Child's name large and center. "Hi [Name]!" with animated wave or sparkle. Shows "Today you have [X] things to do!" instead of a declaration.
- Section order locked by mom. Everything locked by mom.

---

## Visibility & Permissions

| Role | Dashboard Access | Section Reorder | Widget Control | Calendar Filter | Perspective Switcher |
|------|-----------------|----------------|---------------|-----------------|---------------------|
| Mom / Primary Parent | Full personal dashboard. Can View As any member (PRD-02). | Full drag-and-drop reorder + visibility toggle | Full widget CRUD + layout control (PRD-10) | Self / Family toggle | Yes — My Dashboard, Family Overview (stub), Hub (stub), View As |
| Dad / Additional Adult | Own personal dashboard. Same layout engine as mom. | Full drag-and-drop reorder + visibility toggle | Full widget CRUD + layout control | Self only | No |
| Special Adult | Sees assigned children's dashboards during active shift (PRD-27). No personal dashboard unless mom grants one. | No | Interact with permitted child widgets during shift. No layout changes. | N/A | No |
| Independent (Teen) | Own personal dashboard. Full-featured, most similar to adult shell. | Full drag-and-drop reorder + visibility toggle | Full widget CRUD + layout control | Self only | No |
| Guided | Own dashboard (simplified). Specified in PRD-25. | Locked by mom | Reorder only — no resize, delete, create (PRD-10) | Self only | No |
| Play | Own dashboard (visual). Specified in PRD-26. | Locked by mom | View/interact only — no layout changes (PRD-10) | Icon-rich visual (PRD-26) | No |

### Shell Behavior
- **Mom Shell:** Full five-zone layout (PRD-04). Perspective switcher on dashboard page. Three LiLa floating buttons + Settings. All sidebar sections. Command Center accessible via sidebar.
- **Adult Shell:** Full five-zone layout. No perspective switcher. Settings button only (no LiLa floating buttons). Sidebar filtered by permissions.
- **Independent Shell:** Full five-zone layout. No perspective switcher. Settings button only. Sidebar shows personal features only.
- **Guided Shell:** Simplified layout (PRD-04). Bottom nav. Stub details in PRD-25.
- **Play Shell:** Minimal layout (PRD-04). Big tile layout. Bottom nav with emoji. Stub details in PRD-26.

### Privacy & Transparency
- Dashboard configurations are private per member. No member can see another member's layout preferences.
- Mom can View As any member's dashboard (PRD-02) — she sees their dashboard rendered with their theme and their layout.
- Teen dashboard widget data follows the standard teen privacy model — visible to mom by default per the Transparency Panel (PRD-02).
- Dashboard layout preferences are NOT visible on the Transparency Panel (they're configuration, not content).

---

## Data Schema

### Table: `dashboard_configs` (Extended from PRD-10)

PRD-10 defined this table. PRD-14 extends the `layout` and adds a `preferences` JSONB column.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| dashboard_type | TEXT | 'personal' | NOT NULL | Enum: 'personal', 'family_overview', 'family_hub' |
| layout | JSONB | '{}' | NOT NULL | Sections array + widgets array + folders (see structure below) |
| layout_mode | TEXT | 'auto' | NOT NULL | Enum: 'auto', 'manual' |
| decorations | JSONB | '[]' | NOT NULL | Cozy Journal vibe decorative elements (PRD-10) |
| preferences | JSONB | '{}' | NOT NULL | **NEW.** Calendar view mode, week start, calendar filter, onboarding state |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**`layout` JSONB structure:**
```json
{
  "sections": [
    {
      "key": "greeting",
      "visible": true,
      "collapsed": false,
      "order": 0
    },
    {
      "key": "calendar",
      "visible": true,
      "collapsed": false,
      "order": 1,
      "col_span": 3
    },
    {
      "key": "active_tasks",
      "visible": true,
      "collapsed": false,
      "order": 2,
      "col_span": null
    },
    {
      "key": "widget_grid",
      "visible": true,
      "collapsed": false,
      "order": 3
    }
  ],
  "widgets": [
    {
      "widget_id": "uuid",
      "position": { "row": 0, "col": 0 },
      "size": "medium",
      "folder_id": null
    }
  ],
  "folders": [
    {
      "id": "uuid",
      "name": "Potty Training",
      "position": { "row": 1, "col": 0 }
    }
  ]
}
```

**`preferences` JSONB structure:**
```json
{
  "calendar_view": "week",
  "week_start_day": "sunday",
  "calendar_filter": "self",
  "onboarding_dismissed": false,
  "greeting_rotation_interval_seconds": 30
}
```

**RLS Policy:** Members can read/update their own `dashboard_configs` row. Mom (primary_parent) can read/update all family members' rows (for View As and for setting Guided/Play layouts). Special Adults can read assigned children's rows during active shift.

**Indexes:**
- `(family_member_id, dashboard_type)` — unique per member per dashboard type
- `(family_id)` — family-scoped queries

### Enum/Type Updates

No new enums. `dashboard_type` uses TEXT CHECK constraint: `'personal'`, `'family_overview'`, `'family_hub'`.

Section keys are string constants (not a database enum): `'greeting'`, `'calendar'`, `'active_tasks'`, `'widget_grid'`.

> **Forward note:** PRD-25 and PRD-26 may add section keys specific to Guided and Play dashboards (e.g., `'gamification_progress'`, `'daily_celebration'`).

---

## Flows

### Incoming Flows (How Data Gets INTO the Dashboard)

| Source | How It Works |
|--------|-------------|
| PRD-06 (Guiding Stars) | Greeting header reads active, `is_included_in_ai = true` Guiding Stars for rotation display. |
| PRD-09A (Tasks) | Active Tasks section reads tasks assigned to this member, renders per PRD-09A Screen 7 contract. |
| PRD-10 (Widgets) | Widget grid renders widgets from `widgets` table, uses `dashboard_configs.layout.widgets` for positioning. |
| PRD-10 (Widget Picker) | New widgets added via Widget Picker (PRD-10 Screen 3) update `dashboard_configs.layout.widgets` and `widgets` table. |
| PRD-09B (Lists) | Pinned lists render as lightweight info widgets in the grid. |
| PRD-06 (Best Intentions) | Best Intentions celebration widget renders in grid, reads from `best_intentions` and `intention_iterations`. |
| PRD-14B (Calendar — stub) | Calendar section reads from `calendar_events` table. Stub until Calendar PRD is built. |
| PRD-11 (Victory Recorder) | "Today's Victories" info widget reads from `victories` table filtered to today. |
| PRD-12A (LifeLantern — stub) | LifeLantern summary widget renders in grid when available. Stub until PRD-12A is built. |

### Outgoing Flows (How the Dashboard Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-04 (Shell Routing) | Perspective switcher selection determines which dashboard view renders. View As opens the modal (PRD-02). |
| PRD-09A (Tasks) | Task interactions on the dashboard (complete, approve, start timer) update `tasks`, `task_completions`, `activity_log_entries` tables. |
| PRD-10 (Widgets) | Widget interactions on the dashboard (log data point, check off daily checklist item) update `widget_data_points` table. |
| PRD-11 (Victory Recorder) | Task completions and widget milestones on the dashboard trigger silent victory auto-routing (per PRD-11). |

---

## AI Integration

### No Guided Mode Registered

The Personal Dashboard does not register a guided mode in the LiLa registry. The dashboard is a display surface, not a conversation tool. LiLa is accessed from the dashboard via the floating buttons (mom) or feature entry points (other shells), per PRD-04 and PRD-05.

### LiLa Context from Dashboard

When LiLa is opened from the dashboard (via floating Help/Assist/Optimizer buttons), the context assembly (PRD-05) should include:
- Current dashboard state: which sections are visible, what's in the Active Tasks section, recent widget data points.
- This enables LiLa to make contextual suggestions: "I see you have 7 tasks due today — want me to help you prioritize?" or "Your reading tracker is at 74% — you're close to your goal!"

> **Decision rationale:** The dashboard doesn't need its own AI mode, but LiLa should be aware of what the user is looking at when they open a conversation from the dashboard page.

---

## Edge Cases

### Member with No Guiding Stars
- Greeting header shows the personalized greeting only. The declaration rotation line is hidden entirely (no empty space, no nudge). Declarations appear automatically when the member creates their first Guiding Star.

### Member with Only Archived Guiding Stars
- Same as above — only active, `is_included_in_ai = true` entries are eligible for rotation. If all are archived or excluded, the line hides.

### All Sections Hidden
- If the user hides all sections via edit mode, the dashboard shows only the greeting header and the widget grid. If the widget grid is also hidden (unlikely but possible), show a gentle message: "Your dashboard is empty. Long-press to customize." This is not an error state — it's valid if the user prefers a minimal view.

### Large Number of Widgets
- The widget grid scrolls naturally as part of the page. No pagination needed — CSS Grid handles layout efficiently. At extreme counts (50+ widgets), performance may degrade; but this is an edge case we can address post-MVP if it occurs.

### View As: Dashboard Rendering
- When mom opens View As for a family member, the dashboard renders using that member's `dashboard_configs` row, that member's theme tokens, and that member's data. Mom's perspective switcher is NOT visible in View As mode — she's seeing the member's experience. The "Viewing as [Name]" banner (PRD-02) is the only mom-colored element.
- Mom can interact with the member's dashboard: mark tasks done, log widget data points, rearrange sections/widgets (for Guided/Play members). Changes persist to the member's `dashboard_configs` row.

### Offline / PWA
- Dashboard layout structure works offline (it's CSS/JS). Section collapse state cached locally.
- Data inside sections may show stale indicators: "Last updated [time]" on widgets and tasks if connectivity is lost.
- Full offline spec deferred to Offline/PWA PRD.

### Shell Change (Guided → Independent Graduation)
- When mom changes a member from Guided to Independent, the member's dashboard transitions on next login. Their `dashboard_configs` row is preserved — section order and widget positions carry over. New capabilities (section reordering, widget creation, additional task views) become available. The transition feels like an upgrade, not a reset.

---

## Tier Gating

All dashboard features are available to all users during beta. The `useCanAccess('personal_dashboard')` hook is wired from day one and returns `true`.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `personal_dashboard` | Dashboard layout, sections, and customization | TBD post-beta |
| `dashboard_section_reorder` | Ability to reorder full-width sections | TBD post-beta |

> **Tier rationale:** Dashboard customization is a natural upgrade incentive — the basic dashboard with default layout could be Essential, while section reordering and advanced widget layouts could be Enhanced. But premature gating decisions would constrain beta testing.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Calendar section display (reads from `calendar_events` table) | Full calendar feature: event CRUD, MindSweep intake, recurring events, reminders | PRD-14B (Calendar) |
| Perspective switcher: Family Overview tab (placeholder) | Aggregated family progress data assembly | PRD-14C (Family Overview) |
| Perspective switcher: Family Hub tab (placeholder) | Shared family coordination surface | PRD-14D (Family Hub) |
| Guided dashboard full spec | Guided-specific sections, gamification integration, simplified interactions | PRD-25 (Guided Dashboard) |
| Play dashboard full spec | Play-specific tiles, icon calendar, celebration-driven UX | PRD-26 (Play Dashboard) |
| LifeLantern summary widget | Area summary or vision statement snippet on dashboard | PRD-12A (Personal LifeLantern) |
| Calendar event icons for Play mode | Auto-suggested icons by category, mom override | PRD-14B (Calendar) + PRD-26 (Play Dashboard) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Dashboard widget area (personal dashboard layout) | PRD-04 | Fully defined: section/grid hybrid, section ordering, edit mode, greeting header |
| Dashboard active tasks section (collapsible with view toggle carousel) | PRD-09A | Hosted as a full-width collapsible section per PRD-09A Screen 7 contract |
| Widget grid hosting on personal dashboard | PRD-10 | Widget grid renders as a reorderable section in the dashboard layout |
| Dashboard widget containers for Guiding Stars and Best Intentions | PRD-06 | Guiding Stars rotation in greeting header + info widget. Best Intentions as info widget in grid. |
| List pinning as lightweight dashboard widget | PRD-09B | Pinned lists render as info widgets in the widget grid |
| Perspective switcher stub (My Dashboard tab) | PRD-04 | "My Dashboard" tab fully implemented; other tabs are stubs |
| Victory Recorder dashboard presence | PRD-11 | "Today's Victories" info widget in grid. "Log Victory" in QuickTasks strip (PRD-04). |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Dashboard renders correctly for Mom, Dad/Adult, and Independent Teen shells
- [ ] Greeting header: personalized time-of-day greeting + rotating Guiding Stars declaration
- [ ] Calendar section: collapsible, week/month toggle (persists), Sunday/Monday start (persists), date navigation with month/year picker (no scroll wheel), tap-date-to-see-day overlay. Empty state until Calendar PRD.
- [ ] Mom calendar filter: Self / Family toggle (family view stub until Calendar PRD)
- [ ] Active Tasks section: collapsible, 13 view toggle carousel auto-sorted by usage, renders per PRD-09A Screen 7 contract
- [ ] Widget grid: renders PRD-10 widgets with snap-to-grid, S/M/L sizing, auto-arrange default
- [ ] Long-press enters edit mode: wiggle animation, section drag-and-drop reorder, section visibility toggle, widget rearrange/resize/folder/delete per PRD-10
- [ ] Section collapse/expand state persists per user
- [ ] Section order persists per user
- [ ] Default layout for new users: greeting + collapsed calendar + expanded tasks + 3 starter widgets
- [ ] Empty state for new users with warm onboarding card (dismissible)
- [ ] Perspective switcher (mom only): My Dashboard active, Family Overview stub, Hub stub, View As with member picker
- [ ] View As renders member's dashboard with member's theme and data (PRD-02)
- [ ] `dashboard_configs` table extended with `preferences` JSONB column
- [ ] `dashboard_configs.layout` JSONB includes `sections` array alongside `widgets` array
- [ ] All layout changes save optimistically with server sync
- [ ] RLS: members read/update own config. Mom reads/updates all. Special Adults read assigned children during shift.
- [ ] `useCanAccess('personal_dashboard')` wired from day one (returns true during beta)
- [ ] PermissionGate wraps all member-scoped dashboard elements
- [ ] All components consume PRD-03 CSS variables and shell token overrides — no hardcoded colors

### MVP When Dependency Is Ready
- [ ] Calendar section displays real event data (requires PRD-14B Calendar)
- [ ] Family Overview perspective shows aggregated family data (requires PRD-14C)
- [ ] Family Hub perspective shows shared family content (requires PRD-14D)
- [ ] LifeLantern summary widget renders on dashboard (requires PRD-12A)
- [ ] Guided dashboard full experience (requires PRD-24 + PRD-25)
- [ ] Play dashboard full experience (requires PRD-24 + PRD-26)

### Post-MVP
- [ ] Decorative layer for Cozy Journal vibe on dashboard (stickers, washi tape, per PRD-10)
- [ ] Multiple saved dashboard layouts (Morning, Evening, Weekend — layout switching)
- [ ] Smart widget suggestions from LiLa ("Based on your usage, try adding a Reading Tracker")
- [ ] Dashboard sharing ("Sarah shared her layout with you")
- [ ] Dashboard screenshots / export for sharing
- [ ] Animated section transitions during reorder
- [ ] Keyboard shortcuts for section collapse/expand

---

## CLAUDE.md Additions from This PRD

- [ ] Dashboard architecture: hybrid layout with full-width collapsible sections + widget grid. Sections and grid are reorderable via drag-and-drop in edit mode. Long-press = edit mode (same trigger as PRD-10 widget editing).
- [ ] Section keys are string constants: `'greeting'`, `'calendar'`, `'active_tasks'`, `'widget_grid'`. PRD-25/26 may add more.
- [ ] Greeting header is NOT collapsible. It's the emotional anchor. Rotating Guiding Stars declaration uses `is_included_in_ai = true` entries only. Hidden if no eligible entries.
- [ ] Calendar section is a dashboard display component — reads from `calendar_events` (PRD-14B) but creates no data. Week/month toggle and Sunday/Monday start persist in `dashboard_configs.preferences`.
- [ ] Calendar date navigation: month dropdown + inline editable year text field. No scroll wheel for years.
- [ ] Section reordering: Mom/Dad/Independent Teen can reorder. Guided/Play locked by mom.
- [ ] `dashboard_configs.preferences` JSONB stores calendar_view, week_start_day, calendar_filter, onboarding_dismissed, greeting_rotation_interval_seconds.
- [ ] `dashboard_configs.layout.sections` array stores section key, order, visibility, collapse state.
- [ ] Default new user dashboard: greeting (expanded) + calendar (collapsed) + active tasks (expanded) + widget grid with 3 starter widgets + one-time onboarding card.
- [ ] Perspective switcher is dashboard-page-only, mom-shell-only (per PRD-04 decision #3). Other tabs are stubs until PRD-14C/14D.
- [ ] Convention: section collapse/expand state and section order persist per user in `dashboard_configs.layout.sections`. Optimistic saves.
- [ ] Responsive section width: Mobile (2-col) = always full width. Tablet/Desktop (3+ col) = sections have configurable `col_span` (default 3 on 4-col grid, null = full width). Auto-arrange places widgets beside narrower sections.
- [ ] Orientation handling: dashboard grid re-flows on viewport change (including tablet rotation) without reload. Uses ResizeObserver per PRD-04. Column count adjusts based on available main content width, not device type.
- [ ] `dashboard_configs.layout.sections[].col_span`: integer or null. Null = span all columns. Integer = span that many columns. Only effective on grids with 3+ columns; ignored on 2-col mobile.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables modified: `dashboard_configs` — added `preferences` JSONB column (default '{}')
Tables defined: None new (extends PRD-10's table)
Enums updated: `dashboard_type` TEXT CHECK adds no new values (already defined in PRD-10 or extends naturally)
Triggers added: None new (`set_updated_at` already exists from PRD-10)

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Hybrid layout: full-width collapsible sections + widget grid** | Tasks need full-width for 13 view toggles. Calendar needs full-width for date navigation. Widgets work best in the PRD-10 grid. The hybrid gives each element the space it needs. |
| 2 | **PRD-14 = shared architecture + Mom/Adult/Independent. Guided = PRD-25, Play = PRD-26** | Guided and Play are substantially different experiences requiring PRD-24 (Gamification) as a prerequisite. Adult shells are 90% the same with permission scoping. |
| 3 | **PRD-14B = Calendar, PRD-14C = Family Overview, PRD-14D = Family Hub** | Calendar is a significant feature deserving its own doc. Family Overview and Family Hub are separate data surfaces with different audiences. |
| 4 | **Greeting header is NOT collapsible** | It's the emotional anchor of the dashboard — "this is YOUR space." Collapsing it saves trivial space at the cost of the personal touch. |
| 5 | **Greeting includes rotating Guiding Stars declarations** | Keeps declarations top-of-mind as daily reminders of who you're choosing to become. Rotation uses the same data feed as the PRD-06 Guiding Stars rotation widget. |
| 6 | **Calendar display only in PRD-14. Full calendar spec in PRD-14B.** | Keeps PRD-14 focused. Calendar intake vision (MindSweep routing, screenshot-to-queue, mom approval) captured as forward notes for PRD-14B. |
| 7 | **Calendar date navigation: dropdown month + inline editable year** | No scroll wheel for years. Typing a year is faster and less frustrating than scrolling through decades. Both dropdown and inline editing available. |
| 8 | **Mom can toggle Self / Family on calendar. Other shells see self only.** | Mom needs the family view. Others don't have permission to see family-wide scheduling by default. |
| 9 | **All adult shells can reorder sections. Guided/Play locked by mom.** | Adults and teens deserve agency over their own space. Younger members benefit from mom's curation. |
| 10 | **Default layout: greeting + collapsed calendar + expanded tasks + 3 starter widgets** | Day one should feel alive but not overwhelming. Calendar starts collapsed because it's empty. Tasks expanded because it's the primary daily surface. Three small widgets give the grid life. |
| 11 | **Victory Recorder presence: QuickTasks strip + optional info widget. No standalone FAB.** | QuickTasks already has "Log Victory." An info widget in the grid is optional and moveable. A FAB would compete with the existing floating LiLa buttons. |
| 12 | **Play mode has a collapsible icon-rich calendar** | Even young children benefit from seeing their week visually. Icons auto-suggested by event category, mom can override. Full spec in PRD-26. |
| 13 | **PRD-25 = Guided Dashboard, PRD-26 = Play Dashboard (tentative, after PRD-24)** | These need gamification (PRD-24) as a prerequisite. PRD-25 and PRD-26 are open numbers in the Build Order. |
| 14 | **Sections span configurable column width on 3+ col grids; full-width on mobile** | Desktop with sidebar + notepad leaves ~700-800px. Full-width sections waste space that could hold widgets. Auto-arrange places widgets beside narrower sections. Manual mode lets users resize section width. |
| 15 | **Dashboard handles tablet orientation changes without reload** | Horizontally mounted family tablets are a real use case. CSS Grid + ResizeObserver re-flows sections and widgets reactively when orientation changes. |
| 16 | **Smart TV / ambient display mode noted as forward architecture consideration for Family Hub** | Families want to cast or mount a display showing the family calendar, tasks, and countdowns. PRD-14D (Family Hub) should be renderable at any resolution including TV screens. Noted as forward note, not MVP scope. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Calendar event creation, MindSweep intake, recurring events, reminders | PRD-14B (Calendar) |
| 2 | Family Overview aggregated data display | PRD-14C (Family Overview) |
| 3 | Family Hub shared coordination surface | PRD-14D (Family Hub) |
| 4 | Guided dashboard full specification | PRD-25 (after PRD-24) |
| 5 | Play dashboard full specification | PRD-26 (after PRD-24) |
| 6 | Special Adult shift dashboard view | PRD-27 (Caregiver Tools, locked) |
| 7 | LifeLantern dashboard widget content | PRD-12A (Personal LifeLantern) |
| 8 | Decorative layer (Cozy Journal vibe) | Post-MVP (per PRD-10) |
| 9 | Multiple saved dashboard layouts (Morning/Evening/Weekend) | Post-MVP |
| 10 | Calendar event icons for Play mode (auto-suggest by category, mom override) | PRD-14B + PRD-26 |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-10 (Widgets) | `dashboard_configs` table extended with `preferences` JSONB. `layout` JSONB now includes `sections` array alongside `widgets` array. | Update PRD-10 schema documentation to note PRD-14 extensions. Verify widget grid rendering accounts for section ordering. |
| PRD-04 (Shell Routing) | Perspective switcher tabs confirmed: My Dashboard (active), Family Overview (stub → PRD-14C), Family Hub (stub → PRD-14D), View As (PRD-02). Collapsible sections pattern fully specified. | No structural changes needed — PRD-04 already anticipated this. Verify stub labels match. |
| PRD-09A (Tasks) | Active Tasks section hosted as collapsible full-width section. Section order is user-configurable. | No changes to PRD-09A — the section contract is consumed as-is. |
| PRD-06 (Guiding Stars) | Greeting header uses Guiding Stars data for rotation. Same data as the PRD-06 rotation widget but rendered differently (text line vs. widget card). | Verify PRD-06 rotation widget and greeting rotation can coexist (user might have both — different rendering, same data). |
| Build Order Source of Truth | PRD-25 = Guided Dashboard, PRD-26 = Play Dashboard tentatively earmarked. PRD-14B/C/D sub-PRDs established. | Update Build Order Section 5 to note PRD-25/26 tentative assignment. Add PRD-14B/C/D to Section 4 or 5 as appropriate. |

---

*End of PRD-14*
