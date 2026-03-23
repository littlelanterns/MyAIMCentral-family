# PRD-04: Shell Routing & Layouts

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — shell definitions, member roles, `dashboard_mode`, family hub, PWA entry points), PRD-02 (Permissions & Access Control — PermissionGate, View As, role-based access levels), PRD-03 (Design System & Themes — visual tokens, shell token overrides, responsive breakpoints, shared components)
**Created:** March 3, 2026
**Last Updated:** March 3, 2026

---

## Overview

This PRD defines how MyAIM Family decides what a member sees when they use the app. Every member has a `dashboard_mode` (assigned by mom) that determines which shell they experience — and each shell has its own layout structure, navigation, available zones, and responsive behavior. The shell is the outermost container: it controls the sidebar, the drawers, the floating buttons, and how all of those adapt from a 27" desktop monitor down to a phone screen.

The shell system serves a wide range of users: mom managing nine children needs persistent access to every feature through a rich sidebar, quick-capture notepad, and AI chat drawer. A 10-year-old in Guided mode needs a focused, simplified layout with larger touch targets and a lightweight journal input. A toddler in Play mode needs big colorful tiles they can tap without accidentally navigating somewhere confusing. The shell routing system makes each of these feel like a purpose-built app while sharing one codebase and one database underneath.

PRD-03 defined the visual tokens per shell (typography scale, animation curves, spacing density, color intensity). This PRD defines the structural containers those tokens fill — the layout grids, navigation patterns, drawer mechanics, modal behavior, and routing logic that assembles each shell from shared components.

**Architectural principle: edited somewhere, edited everywhere.** The perspectives available to mom (Personal Dashboard, Family Overview, Family Hub, View As) are different lenses on the same underlying data. Marking a task done in View As updates the same record as marking it done on the member's own dashboard. No data duplication between views.

---

## User Stories

### Shell Routing
- As a mom, I want to land on my Personal Dashboard when I sign in so I'm treated as a person first, not just a family manager.
- As a dad, I want to land on my Personal Dashboard when I sign in so I have my own growth space.
- As a teen, I want to land on my dashboard when I sign in so I can see my tasks, journal, and progress right away.
- As a child in Guided mode, I want to see my tasks, routines, and journal prompts in a simple layout when I sign in.
- As a young child in Play mode, I want to see big colorful tiles for my tasks and rewards when I sign in.
- As a mom, I want each family member to automatically get the right layout for their role so I don't have to configure layout settings manually.

### Navigation
- As a mom, I want a sidebar that organizes all features into logical sections so I can find what I need quickly.
- As a mom, I want the sidebar to be collapsible so I can maximize my content area when I need to focus.
- As a teen, I want a sidebar with just my features so I'm not overwhelmed by things I can't access.
- As any mobile user, I want a bottom navigation bar for the most important sections and a hamburger menu for everything else.

### Perspectives (Mom Only)
- As a mom, I want to switch between My Dashboard, Family Overview, and Family Hub from my dashboard page so I can see different angles on family life.
- As a mom, I want "View As" to open a modal showing exactly what a family member sees so I can check their tasks, mark things done, and understand their experience.
- As a mom, I want the View As modal to show the member's theme so I can see what their space actually looks like.

### Drawers & Zones
- As a mom or adult, I want a Smart Notepad drawer on the right side so I can capture thoughts without leaving my current page.
- As any user, I want the LiLa chat drawer to pull up from the bottom so I can get AI help without navigating away.
- As any user, I want a QuickTasks strip so I can trigger common actions from any page.
- As a mom, I want drawers to auto-collapse when my screen is too narrow so the main content stays usable.

### Tablet Hub
- As a family, we want a shared hub on our tablet that shows family content and lets any member tap in to their own experience.
- As a mom, I want the hub to stay on indefinitely as a family information display.
- As a family member, I want to tap "Back to Hub" when I'm done so the next person can use the device.

### Responsive
- As a phone user, I want the app to feel native — bottom nav, swipe gestures for drawers, full-screen modals.
- As a laptop user, I want the full desktop layout with sidebar, drawers, and all zones visible.

---

## Shell Routing Logic

### How Shell Selection Works

When a member authenticates, the system reads their `role` and `dashboard_mode` from the `family_members` table and routes to the appropriate shell:

| Role | dashboard_mode | Shell | Layout Component |
|------|---------------|-------|-----------------|
| primary_parent | — | Mom Shell | `MomLayout` |
| additional_adult | — | Adult Shell | `AdultLayout` |
| special_adult | — | Special Adult (TBD) | Scoped `AdultLayout` or purpose-built `CaregiverLayout` |
| family_member | independent | Independent Shell | `IndependentLayout` |

> **Special Adult shell — open question:** Special Adults primarily view and mark content for assigned kids and may generate reports. They may not need the full Adult shell with all its zones. Options range from a scoped-down Adult shell (sidebar filtered to only assigned children's features during active shifts) to a purpose-built minimal layout focused on task completion and reporting. This will be finalized during the Caregiver Tools PRD or during build.
| family_member | guided | Guided Shell | `GuidedLayout` |
| family_member | play | Play Shell | `PlayLayout` |

The function `getShellForMember(member)` returns the shell identifier. The router wraps the appropriate layout component around all child routes for that session.

### Shell Changes

When mom changes a member's `dashboard_mode` in Family Management (e.g., moves a child from Guided to Independent), the change takes effect on the member's next login or page refresh. No live mid-session shell switching — the member sees a gentle message: "Your experience has been updated! Refresh to see the changes."

---

## Layout Structures

### Zone Inventory

The app defines seven interaction zones. Not all zones appear in all shells.

| Zone | Position | Description |
|------|----------|-------------|
| Sidebar | Left | Feature navigation (collapsible) |
| QuickTasks | Top | Horizontal scrolling action buttons |
| Smart Notepad | Right drawer | Capture/edit/route workspace |
| LiLa Chat | Bottom drawer | AI assistant pull-up |
| Main Content | Center | Where features render |
| Floating Buttons | Top-right (above Smart Notepad) | Li, La, Settings — always visible |
| Modals | Above everything | Feature interactions, View As |

### Zone Availability by Shell

| Zone | Mom | Adult | Independent | Guided | Play |
|------|-----|-------|-------------|--------|------|
| Sidebar | Full | Full | Reduced | Simplified | None |
| QuickTasks | Yes | Yes | Yes | No | No |
| Smart Notepad (right drawer) | Full | Full | Full | Lightweight (permission-gated) | No |
| LiLa Chat (bottom drawer) | Yes (mom-only) | No (modal access) | No (modal access) | No (modal access) | No |
| Main Content | Yes | Yes | Yes | Yes | Yes |
| Floating Buttons | Help + Assist + Optimizer + Settings | Settings only | Settings only | Settings only | Settings only (simplified) |
| Modals | Yes | Yes (+ LiLa tool modals) | Yes (+ LiLa tool modals) | Yes (simplified, + LiLa tool modals) | Yes (simplified) |

---

## Desktop Layout: Mom / Adult / Independent Shells

### Five-Zone Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  [QuickTasks strip — horizontal scroll]     [Help][Assist][Opt][⚙]   │
├──────────┬─────────────────────────────────────────┬───────────────────┤
│          │  Perspective Switcher (dashboard only)   │                   │
│  Side    │                                          │  Smart            │
│  bar     │         Main Content Area                │  Notepad          │
│          │                                          │  Drawer           │
│          │                                          │                   │
│  < close │                                          │          close >  │
│          │                                          │                   │
├──────────┴─────────────────────────────────────────┴───────────────────┤
│  ▲ LiLa Chat (pull-up drawer — mom only)                              │
└────────────────────────────────────────────────────────────────────────┘
```

**Floating Buttons (LiLa Help, Assist, Optimizer, Settings):** These four buttons live in the top-right corner of the viewport, above the Smart Notepad drawer, to the right of the QuickTasks strip. They are persistent across all pages and all drawer states. When the Smart Notepad is open, they sit above its top edge. When the Smart Notepad is collapsed, they remain in the same screen position (floating over the right edge of the main content area). They are never obscured by drawers — only modals appear above them. The three LiLa avatar buttons are only visible in mom's shell; all other shells show only the Settings gear.

**Perspective Switcher:** Appears only on dashboard pages (`/dashboard`). A segmented control or tab bar in the main content header area showing: My Dashboard (active by default), Family Overview, Family Hub, and View As... (with inline member picker). This is not a global element — it disappears when mom navigates to any other feature page via the sidebar.

**Dashboard Collapsible Sections:** The Personal Dashboard contains collapsible sections, each with a `>` / `v` toggle to expand or collapse. Active Tasks is one collapsible section (contract defined in PRD-09A). PRD-14 (Personal Dashboard) will define the full dashboard layout, section ordering, and which sections are collapsible vs. always-visible.

### Feature Container Routes

Some features are containers with nested sub-page routes accessed via internal tab navigation. The sidebar shows a single nav item; sub-pages are tabs within the feature page.

**Journal Container Routes (defined in PRD-08):**
- `/journal` — Main timeline (all entry types aggregated)
- `/journal/reflections` — Reflections sub-page
- `/journal/commonplace` — Commonplace sub-page
- `/journal/gratitude` — Gratitude sub-page (filtered view)
- `/journal/kid-quips` — Kid Quips sub-page (filtered view)

**Studio Container Routes (defined in PRD-09B):**
- `/studio` — Studio page (Templates, Trackers & Widgets)
- `/studio/my-customized` — Customized templates view

> Studio hover tooltip: "Templates, Trackers & Widgets — Browse and customize reusable templates for tasks, lists, trackers, and more."

> **Forward note:** Other feature PRDs may define their own container routes following this same pattern. The sidebar shows one nav item; internal navigation is handled by tabs within the feature page.

### Zone Dimensions and Defaults

| Zone | Default Width | Min Width | Max Width | Default State |
|------|--------------|-----------|-----------|---------------|
| Sidebar | 220px | 220px | 220px (fixed) | Open (desktop) |
| Smart Notepad | 280px | 260px | 360px | Open (desktop, xl breakpoint) |
| QuickTasks | Full width | — | — | Open |
| LiLa Chat | Full width (minus sidebar) | — | — | Collapsed (handle visible) |
| Main Content | Remaining space | 480px | — | Always visible |

### Sidebar Navigation

The sidebar is a vertically scrolling list of navigation links organized into labeled sections. Each link has a Lucide icon and a text label. The active page is highlighted with a right border accent and subtle background.

**Sidebar structure pattern (all adult shells):**

The sidebar follows a consistent section-grouping pattern. Each shell gets a subset of sections based on available features. The sections below represent the full Mom sidebar — the most complete version. Adult and Independent shells show subsets.

| Section | Features (Mom) | Adult | Independent |
|---------|---------------|-------|-------------|
| Home | Dashboard, Command Center | Dashboard | Dashboard |
| Capture & Reflect | Journal, Morning Rhythm, Evening Review | Journal, Morning Rhythm, Evening Review | Journal, Morning Rhythm, Evening Review |
| Plan & Do | Tasks, Calendar, Widgets & Trackers, Lists, Studio | Tasks, Calendar, Widgets & Trackers, Lists, Studio | Tasks, Calendar, Widgets & Trackers, Lists, Studio (Full Magic w/ permission) |
| Grow | Guiding Stars, My Foundation, Victories, LifeLantern | Guiding Stars, My Foundation, Victories, LifeLantern | Guiding Stars, My Foundation, Victories |
| Family | People & Relationships, Partner Profile, Family Management | People & Relationships, Partner Profile | — |
| AI & Tools | LiLa Optimizer, Library Vault, Archives, Knowledge Base | — (initially) | — (initially) |
> **Note:** Individual feature PRDs may add, rename, or rearrange sidebar items as they're built. This table reflects the initial structure. The Command Center link in mom's sidebar provides the artistic, card-based navigation view as a complement to the sidebar's list-based navigation. Settings is NOT in the sidebar — it's accessed via the Settings gear in the floating top-right buttons (persistent across all pages).

**Sidebar hover descriptions:**
- On desktop, hovering over any sidebar item shows a tooltip with a short description of the feature (e.g., "Journal — Capture thoughts, reflect, and review"). This helps new users learn what each feature does without navigating to it. Descriptions should be warm and concise (under 10 words).
- When the sidebar is collapsed to the icon-only strip, hovering an icon shows the feature name AND description in the tooltip (since the label isn't visible).

**Mobile "More" menu info mode:**
- When the hamburger/More menu opens on mobile, an info button (ⓘ circle icon) appears in the menu header.
- Tapping the info button toggles description mode: short feature descriptions appear below each nav item label throughout the menu.
- Tap ⓘ again to hide descriptions and return to the compact list.
- This follows the existing pattern in the connected StewardShip GitHub repo's More menu implementation.

**Sidebar collapse behavior:**
- Desktop (≥1024px): Sidebar defaults open (full 220px with icons + labels). `<` arrow collapses to a narrow icon-only strip (~48px) showing just the Lucide icons without text labels (similar to Claude.ai's collapsed sidebar pattern). `>` arrow or hovering the strip re-expands to full width. The icon strip provides quick visual recognition of sections and one-click navigation without consuming horizontal space.
- Tablet (768px–1023px): Sidebar defaults to the icon-only strip. Tap any icon or swipe from left edge to expand as an overlay with full labels. Tap outside or `<` arrow to collapse back to icon strip.
- Mobile (<768px): No sidebar or icon strip. Navigation via hamburger menu (top-left) that slides in as a full-height overlay from the left, plus bottom navigation bar.

### QuickTasks Strip

A horizontal scrolling row of pill-shaped action buttons that sit at the top of the main area, spanning from the sidebar's right edge to the floating buttons' left edge. Available on every page.

**Behavior:**
- Defaults open on desktop and tablet.
- `▲` button on the right end collapses the strip up. `▼` brings it back.
- Buttons are auto-sorted by usage frequency (most-used first).
- Horizontal scroll with fade-out gradient on the right edge to indicate more items.
- On mobile: collapses into a compact horizontal scrolling strip below the page header, or hidden behind a "Quick Actions" button if screen space is critical.
- Open/closed state persists per user.

**Default QuickTasks (mom, adjusts by shell):**
- Add Task, Journal Entry, Mind Sweep, Log Victory, Family Calendar, Quick Note

> "Add Task" opens the Task Creation Modal (defined in PRD-09A). No other task-related buttons needed in the strip.

> Feature PRDs may add their own QuickTask buttons. The system auto-sorts by frequency, so rarely-used buttons naturally scroll off-screen.

### Smart Notepad (Right Drawer)

**Full version (Mom, Adult, Independent):**
- Right-side drawer, defaults open on xl breakpoint (≥1280px), defaults closed on lg (1024–1279px).
- `>` button to collapse, `<` to reopen.
- Tabbed interface: multiple capture tabs, each with content.
- "Send to..." routing button for completed content.
- Voice input button.
- Full-page expand mode (diagonal arrow) takes the current tab to the main content area.
- Content persists across sessions (database-backed).
- Full spec in PRD-08 (Journal + Smart Notepad).

**Lightweight version (Guided, permission-gated by mom):**
- Same right-drawer position, but simplified UI.
- Single tab (no multi-tab).
- Freeform text input with larger font (per Guided shell token overrides).
- Voice-to-text input button (prominent, large).
- Used for journal reflections and prompted writing.
- No "Send to..." routing grid — content saves directly to the member's journal.
- No full-page expand mode.
- Mom can enable or disable this via permissions. When disabled, the drawer slot is empty (main content takes the full width).
- Forward-compatible: when a member graduates from Guided to Independent, the full notepad unlocks in the same drawer position. No layout shift, just richer functionality.

**Play Shell:** No Smart Notepad drawer. Main content fills the available width.

### LiLa Chat (Bottom Drawer)

Pull-up drawer at the bottom of the page. This is **mom's primary LiLa interface** — other family members access LiLa tools through permission-gated modals instead of the drawer.

**Three states:**
1. **Collapsed:** Only the drag handle visible (28px height). On mobile, sits above the bottom nav bar.
2. **Peek:** Half-screen (55vh). Shows recent conversation and input field.
3. **Full:** Near full-screen (`100dvh - spacing-xl`). Full conversation view.

**Resting state avatar:** When the drawer opens without a specific mode active (user pulls up the handle directly), it shows a "sitting LiLa" character art (meditative pose with glowing heart) as the default state. This is the general conversation LiLa who can chat openly and is smart enough to recognize when a specialized mode (Higgins, Optimizer, ThoughtSift, etc.) would better serve the user, and either auto-routes or suggests the appropriate tool. When a specific mode is active (launched via a floating button or feature entry point), the drawer header shows that mode's avatar instead.

**Behavior:**
- Drag handle to pull up/push down. Supports touch drag gesture.
- On desktop, the drawer spans from the sidebar's right edge to the viewport's right edge (underneath the Smart Notepad if open).
- Current page stays exactly where it was when the drawer opens — no navigation change, no scroll reset.
- LiLa drawer is context-aware: it knows which page is currently active and can tailor suggestions. Full spec in PRD-05 (LiLa Core).

**Shell availability:**
- Mom: Always available. Full drawer with all modes, conversation history, and mode switching.
- Adult: Not available as a drawer. Dad/Additional Adults access LiLa tools via permission-gated modals launched from feature entry points (Marriage Toolbox, People & Relationships, etc.). No drawer handle shown.
- Independent: Not available as a drawer. Teens access LiLa tools via permission-gated modals launched from feature entry points (mom grants access). No drawer handle shown.
- Guided: Not available as a drawer. Permission-gated modal access to specific LiLa tools only (granted by mom). No drawer handle shown.
- Play: Not available. No drawer handle shown. Bottom of the layout is flush.

**Important architectural note:** The conversation engine powering the drawer and the modals is identical — the only difference is the UI container. This ensures that upgrading dad/teens to full drawer access (planned for Full Magic tier) is a configuration change, not a rebuild.

### Floating Buttons (LiLa Help, LiLa Assist, LiLa Optimizer, Settings)

Four small buttons in the top-right corner of the viewport, arranged horizontally.

**Position:** Fixed to viewport. Sits above the Smart Notepad drawer (when open) or in the top-right corner of the main content area (when notepad is closed). Always to the right of the QuickTasks strip's right edge.

**Buttons:**
1. **LiLa Help (open arms avatar)** — Small circular avatar showing LiLa's "Happy to Help" character art (open arms pose). Opens the LiLa drawer in Help mode. Grows slightly on hover.
2. **LiLa Assist (clipboard avatar)** — Small circular avatar showing LiLa's "Your Guide" character art (clipboard pose). Opens the LiLa drawer in Assist mode. Same hover behavior.
3. **LiLa Optimizer (thinking avatar)** — Small circular avatar showing LiLa's "Smart AI" character art (thinking/chin-tap pose). Opens the LiLa drawer in Optimizer mode. Same hover behavior.
4. **Settings gear** — Neutral circle with gear icon, opens Settings page or settings modal.

All three LiLa buttons are *launchers* — tapping one opens the LiLa Chat drawer and immediately enters that mode. The drawer header updates to show the active LiLa avatar. If the user taps a different LiLa button while a conversation is active, it offers to start a new conversation in that mode or switch modes.

**Shell-specific visibility:**
- Mom: All four visible (Help, Assist, Optimizer, Settings).
- Adult: Settings only. LiLa tools accessed via permission-gated modals from feature entry points.
- Independent: Settings only. LiLa tools accessed via permission-gated modals from feature entry points.
- Guided: Settings only (simplified gear icon).
- Play: Settings only (may be a parent-lock icon that requires mom's PIN to access).

**z-index:** Above sidebar, above drawers, above QuickTasks. Below modals only.

### Modals

Modals are the preferred interaction pattern for feature access (inherited from MyAIM v1 pattern).

**Behavior:**
- Appear above everything: all zones, all drawers, floating buttons.
- Semi-transparent backdrop behind the modal.
- Click/tap outside the modal = close, but save the user's place (scroll position, form state).
- On desktop: centered, max-width varies by content (sm: 480px, md: 640px, lg: 800px, xl: 960px).
- On mobile: full-screen (100vw × 100vh) with a close button in the top corner.
- Modals can stack (e.g., View As modal open, then a confirmation modal on top of it).
- Escape key closes the topmost modal.
- Focus traps inside the modal for accessibility.

**View As Modal (Mom only):**
- Full-screen or near-full-screen modal showing the selected member's dashboard.
- Renders with the member's theme and visual token overrides so mom sees what they see.
- A persistent banner at the top of the modal in mom's theme colors: "Viewing as [Member Name]" with a close/back button.
- Mom has full read/write access within the View As modal — she can mark tasks done, view progress, interact with features as that member.
- When mom closes the View As modal, she returns to exactly where she was on her own dashboard.
- The View As modal does not affect the member's session — it's mom acting on their behalf from her own login.

---

## Desktop Layout: Guided Shell

The Guided Shell uses a simplified layout structure. It does not have the full five-zone layout.

### Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Header: Member name, date, greeting]                        [⚙]    │
├──────────┬─────────────────────────────────────────────────────────────┤
│          │                                                             │
│  Simple  │         Main Content Area                                   │
│  Side    │         (tasks, routines, journal prompts,                  │
│  bar     │          widgets, progress, gamification)                   │
│          │                                                             │
│          │                                                    [close > │
│          │                                          Lightweight        │
│          │                                          Notepad (if        │
│          │                                          permitted)         │
├──────────┴─────────────────────────────────────────────────────────────┤
│  [Bottom nav: Home | Tasks | Journal | Victories | Progress]           │
└────────────────────────────────────────────────────────────────────────┘
```

### Zones

- **Simplified sidebar (desktop/tablet only):** Fewer sections, larger text, larger touch targets (48px min). Contains only features available to Guided members. On mobile, replaced by bottom nav + hamburger menu.
- **Main content area:** Tasks, routines, journal prompts, mom-assigned widgets, progress trackers, gamification elements.
- **Lightweight notepad (right drawer, if mom permits):** Simplified capture drawer. See Smart Notepad section above.
- **No QuickTasks strip.** The Guided shell's actions are embedded in the main content.
- **No LiLa drawer.** No pull-up at the bottom.
- **Settings:** Simplified — just appearance settings (dark mode toggle, font size) if mom permits. May require PIN/parent confirmation for access.
- **Bottom nav (always visible):** 5 items — Home, Tasks, Journal, Victories, Progress. Larger icons and labels than adult shells. Visible on all screen sizes.

### Gamification Integration

Gamification is woven throughout the Guided experience rather than siloed into a separate tool:

- **Persistent progress indicator:** A star count, streak counter, or level indicator visible in the header area. Always present so the member sees their progress at a glance.
- **Task completion celebrations:** Brief, encouraging animations when tasks are marked done (gentle scale + color pulse per PRD-03 Guided shell tokens).
- **Routine progress:** Visual progress bars or step indicators on routine cards.
- **Dashboard integration:** Gamification widgets (star tracker, achievement board, streak calendar, reward progress) appear as cards on the home dashboard, configured by mom.
- **Dedicated progress page:** Accessible via the "Progress" item in the bottom nav. Shows full achievement history, streak records, reward progress, and any unlockables. This is the "deep dive" view for gamification while the woven-in elements provide the ambient motivation.

> Full gamification spec (reward types, themes, point systems) deferred to the Gamification PRD. PRD-04 defines where gamification elements appear in the layout.

---

## Desktop Layout: Play Shell

The Play Shell has the most dramatically different layout. No sidebar, no drawers, no traditional navigation. Everything is big, colorful, and tappable.

### Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Header: "Hi [Name]!" + avatar + greeting]          [🔒 Settings]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│         Main Content Area                                              │
│         (big colorful task tiles, routine cards,                       │
│          star/reward tracker, celebrate button)                        │
│                                                                        │
│         — scrollable, vertically stacked —                             │
│                                                                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🎉  Celebrate!  (big, prominent, gold gradient)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [Bottom nav: 🏠 Home | ✅ Tasks | ⭐ Stars | 🎮 Fun ]               │
└────────────────────────────────────────────────────────────────────────┘
```

### Zones

- **No sidebar.** Navigation is through the bottom nav with large emoji icons (emoji permitted in Play shell per PRD-03).
- **No QuickTasks.** Actions are the task tiles themselves.
- **No Smart Notepad.** No right drawer.
- **No LiLa.** No bottom pull-up drawer.
- **No floating Li/La buttons.** Only a Settings button (parent-locked — requires mom's PIN or auth to access).
- **Main content:** Vertically scrolling list of big, colorful, rounded cards. Task tiles with large emoji, routine step cards, star/reward progress, and a prominent "Celebrate!" button. Play shell task tiles have no view toggle carousel — tasks display as large colorful tiles in a single visual layout. View toggles are an adult/teen concept.
- **Bottom nav:** 3–4 items with large emoji icons and short text labels. Minimum 56px touch targets. Items determined by mom's configuration.
- **Celebrate! button:** Always visible near the bottom of the scrollable content. Triggers a celebration review of what the member has accomplished today/this week/this month. Uses Play shell's bouncy animation tokens.

### Gamification in Play

Gamification is the primary motivational framework in Play mode:
- Star/sticker rewards visible on every task tile.
- Completion triggers celebratory animations (bouncy, sparkly, per PRD-03 Play shell tokens).
- Progress toward rewards (e.g., "2 more stars for a surprise!") shown prominently.
- The "Fun" bottom nav item leads to any gamification mini-features mom has enabled (sticker collection, achievement gallery, etc.).

---

## Mobile Layout (All Shells)

### Common Mobile Patterns

All shells share these mobile behaviors (adapted per shell's visual tokens):

**Bottom Navigation Bar:**
- Fixed at the bottom of the viewport.
- 4–5 items maximum.
- Items are shell-specific (see per-shell tables below).
- Active item highlighted with accent color.
- Touch targets meet shell minimums (44px adult, 48px guided, 56px play).

**Hamburger Menu (Mom, Adult, Independent, Guided):**
- Triggered by a hamburger icon in the top-left of the page header.
- Slides in from the left as a full-height overlay panel.
- Contains the full sidebar navigation organized into sections.
- Semi-transparent backdrop behind the panel.
- Tap backdrop or X button to close.
- Not available in Play shell (Play only uses bottom nav).

**Smart Notepad on Mobile:**
- Accessed via bottom nav ("Notepad" item) or a pull tab on the right edge of the screen.
- Slides in from the right as a full-width overlay.
- Swipe right to dismiss.
- On Guided shell: if permitted, accessible via a "Write" or "Journal" button rather than a persistent pull tab.

**LiLa on Mobile:**
- Pull-up drawer from bottom, same as desktop.
- In collapsed state, the handle sits just above the bottom nav bar.
- Peek state: half-screen.
- Full state: full-screen.

**Modals on Mobile:**
- Always full-screen (no centered card).
- Close button in the top corner.
- Swipe-down gesture to dismiss (optional enhancement).

### Mobile Bottom Nav by Shell

| Shell | Item 1 | Item 2 | Item 3 | Item 4 | Item 5 |
|-------|--------|--------|--------|--------|--------|
| Mom | Home | Tasks | Journal | Notepad | More |
| Adult | Home | Tasks | Journal | Notepad | More |
| Independent | Home | Tasks | Journal | Notepad | More |
| Guided | Home | Tasks | Journal | Victories | Progress |
| Play | 🏠 Home | ✅ Tasks | ⭐ Stars | 🎮 Fun | — |

> "More" opens the hamburger menu overlay. Guided doesn't need "More" because its feature set is small enough to fit in 5 items. Play doesn't need "More" — its entire feature set fits in 4 items.

---

## Tablet Hub Layout

The Tablet Hub is a standalone layout that exists outside the five member shells. It serves as the always-on family dashboard for shared devices.

### Route

- URL: `/hub` (or `/family`)
- PWA installable as a separate home screen app (e.g., "Smith Family")
- Uses the family's default theme (not any individual member's theme)

### Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────┐  [Family Name / Branding]                    [⚙ Settings]   │
│  │ pull │                                                              │
│  │ tab  │  Widget Grid                                                 │
│  │      │  (drag-and-drop, resizable S/M/L)                           │
│  │      │                                                              │
│  │ (tap │  Family Calendar | Shared Goals | Dinner Menu                │
│  │  to  │  Family Reminders | Coming Soon | Progress                   │
│  │ open │                                                              │
│  │ mem- │  (mom configures which widgets appear)                       │
│  │ ber  │                                                              │
│  │ draw │                                                              │
│  │ er)  │                                                              │
│  │      │                                                              │
│  └──────┘                                                              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Member Selection Drawer (Left Side)

The member selection lives in a left-side drawer (same position as the sidebar on regular shell pages), hidden by default so the widget grid gets the full viewport for family information display.

- **Default state:** Hidden. A subtle pull tab or family icon on the left edge indicates the drawer's presence.
- **Open behavior:** Tap the pull tab, swipe from the left edge, or tap a "Switch Member" button in the hub header. Drawer slides in showing a vertical list of family member avatars/names.
- **Member cards:** Each member shows their avatar/icon, name, and a visual indicator of their auth method (lock icon for PIN, image grid icon for visual password, no icon for "none").
- **Tap a member →** authenticate (PIN / visual password / none, per member config from PRD-01) → loads their shell.
- **Large families:** The vertical list scrolls naturally. Search/filter available for 10+ members.
- **Close behavior:** Tap outside the drawer, swipe left, or tap the X button. Drawer slides back to hidden.
- **Privacy benefit:** Member names and avatars aren't always visible on screen when the hub is displayed as a wall-mounted family dashboard — visitors see the widget grid, not a list of family members.

### Characteristics

- **No traditional sidebar, no Smart Notepad, no floating LiLa buttons, no QuickTasks.** The hub is a clean, focused family display with a hidden member drawer on the left edge.
- **Larger UI elements** appropriate for wall-mounted or countertop viewing distance.
- **Higher contrast** for visibility from across the room.
- **Widget grid:** Drag-and-drop arrangeable by mom. Widgets available in Small, Medium, and Large sizes. Manually-placed widgets stay put; remaining widgets auto-organize to fill available space. The hub shows family-level data (shared goals, family calendar, collective progress), not individual records.
- **Settings gear:** Requires mom's PIN or full auth to access. Prevents children from changing hub configuration.
- **Always-on mode:** Configurable by mom — no session timeout for the hub view. Individual member sessions (after tapping in) have their own timeout settings. When a member's session times out, the device returns to the hub, not a login screen.
- **"Back to Hub" button:** Always visible in the header of any member's shell when accessed from the hub. Tap → logs out the member's session → returns to hub.

### Hub vs. Family Overview vs. Family Dashboard

These three concepts serve different purposes:

| Surface | Who Sees It | What It Shows | Where It Lives |
|---------|-------------|---------------|----------------|
| Tablet Hub (`/hub`) | Anyone on the family device | Family-level content: shared goals, family calendar, collective progress. Not individual records. | Standalone layout, its own PWA |
| Family Overview (mom's perspective) | Mom only | Aggregated view of all family members' individual progress, tasks, achievements, calendars — everything mom has permission to see | A perspective on mom's dashboard page |
| Family Dashboard (future PRD) | Mom, adults, members with access | Shared family coordination: family tasks, shared calendar, family Best Intentions | A feature accessed via sidebar |

---

## Responsive Behavior

### Breakpoints (from PRD-03)

```
--breakpoint-sm: 640px      /* Small phones → larger phones */
--breakpoint-md: 768px      /* Phones → tablets */
--breakpoint-lg: 1024px     /* Tablets → laptops */
--breakpoint-xl: 1280px     /* Laptops → desktops */
```

### Zone Behavior by Breakpoint

| Zone | < 768px (Mobile) | 768–1023px (Tablet) | 1024–1279px (Laptop) | ≥ 1280px (Desktop) |
|------|------------------|--------------------|--------------------|-------------------|
| Sidebar | Hidden. Hamburger menu. | Collapsed to 4px hint strip. Tap to overlay. | Open (220px). Collapsible to 48px icon strip. | Open (220px). Collapsible. |
| QuickTasks | Compact strip below header or hidden behind button | Full strip | Full strip | Full strip |
| Smart Notepad | Slide-in overlay from right (via bottom nav or pull tab) | Slide-in overlay from right | Closed by default. Open as side panel. | Open by default as side panel (280px). |
| LiLa Chat | Pull-up above bottom nav | Pull-up from bottom | Pull-up from bottom | Pull-up from bottom |
| Floating Buttons | In page header (smaller, 28px circles) | Fixed top-right (32px circles) | Fixed top-right (32px circles) | Fixed top-right (32px circles) |
| Main Content | Full width | Full width (minus sidebar hint) | Remaining space | Remaining space |

### Auto-Collapse Logic

When the main content area drops below its minimum width (480px), the system auto-collapses zones in priority order to reclaim space. This can happen on a 13" laptop with both sidebar and notepad open, or when a user manually opens multiple zones.

**Collapse priority (last to collapse → first to collapse):**
1. **Main content** — never collapses. The protected zone.
2. **LiLa drawer** — collapses to handle.
3. **Sidebar** — collapses to icon strip (desktop) or hides (tablet/mobile).
4. **Smart Notepad** — collapses (drawer closes).
5. **QuickTasks** — collapses up.

The system monitors the main content area's computed width. When it drops below `--content-min-width: 480px`, it triggers auto-collapse starting from priority 5 (QuickTasks first) and working upward until the main content area meets the minimum width. Each collapsed zone remembers that it was auto-collapsed (vs. manually collapsed) so it can auto-reopen if space becomes available (e.g., user switches from a 13" to an external monitor).

**CSS variable for threshold:**
```
--content-min-width: 480px;
```

The build prompt will determine the exact implementation (ResizeObserver, CSS container queries, or similar).

### Open/Closed State Persistence

Each zone's open/closed state persists per user in `family_members.layout_preferences` (JSONB). This includes:
- Sidebar: open/closed
- Smart Notepad: open/closed
- QuickTasks: open/closed
- LiLa drawer: last state (collapsed/peek/full)

Auto-collapsed states are tracked separately so the system can distinguish "user chose to close this" from "system closed this for space."

---

## PWA Entry Points

The URL structure supports multiple PWA installations so different devices can save different views as separate home screen apps.

| URL | PWA Name | Purpose |
|-----|----------|---------|
| `/hub` | "[Family Name] Hub" | Family tablet — always-on family dashboard |
| `/dashboard` | "MyAIM" | Personal device — member's personal dashboard |
| `/` | "MyAIM Family" | General entry — routes to login or dashboard based on auth state |

Each PWA entry point uses the same codebase but renders differently based on the URL and auth state. The PWA manifest dynamically adjusts the app name and icon based on the entry point.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | All zones, all perspectives, View As, full sidebar, all features. LiLa drawer with all modes. Three LiLa floating buttons (Help, Assist, Optimizer). |
| Dad / Additional Adult | Full layout | Same zone structure as mom. Sidebar items filtered by permissions. No Family Management. No View As. No LiLa drawer or floating LiLa buttons. LiLa tools via permission-gated modals from feature entry points. Conversation history accessible. |
| Special Adult | Scoped layout | Same as Adult but sidebar only shows features for assigned children during active shifts. No perspectives. No LiLa access of any kind. |
| Independent (Teen) | Reduced | Full zone structure. Sidebar shows personal features only. No LiLa drawer or floating LiLa buttons. LiLa tools via permission-gated modals from feature entry points (mom grants access). Conversation history accessible. |
| Guided | Simplified | Reduced zones: simplified sidebar, main content, optional lightweight notepad. No QuickTasks. No LiLa drawer or floating LiLa buttons. Permission-gated modal access to specific LiLa tools (granted by mom). All conversations visible to mom by default. Bottom nav always visible. |
| Play | Minimal | No sidebar, no drawers. Big tile layout. Bottom nav with emoji icons. Settings parent-locked. No LiLa access of any kind. |

### Shell Behavior

- Mom Shell: Full five-zone layout. All sidebar sections. Perspective switcher on dashboard. View As modal. Command Center as sidebar nav item. Access to Family Management, Library Vault, Archives, and all features. Full LiLa drawer with all modes. Three LiLa floating buttons (Help, Assist, Optimizer).
- Adult Shell: Full five-zone layout. Sidebar filtered by mom's permission grants. No Command Center, no Family Management. No LiLa drawer. No LiLa floating buttons. LiLa tools accessible via permission-gated modals launched from feature entry points (Marriage Toolbox, People & Relationships, etc.). Conversation history view accessible from shell. Dashboard perspective may include Family Overview if mom grants access.
- Independent Shell: Full five-zone layout. Sidebar shows personal features only. No LiLa drawer. No LiLa floating buttons. LiLa tools accessible via permission-gated modals launched from feature entry points (mom grants access). Conversation history view accessible from shell. Dashboard is personal only — no perspectives.
- Guided Shell: Simplified layout. Bottom nav. Optional lightweight notepad. Gamification woven in + dedicated progress page. No LiLa drawer. No LiLa floating buttons. Permission-gated modal access to specific LiLa tools (mom grants access per tool). All tool conversations fully visible to mom by default. Age-appropriate AI guardrails (defined in PRD-05).
- Play Shell: Minimal layout. Big tiles. Bottom nav with emoji. Gamification is the primary UX framework. No LiLa access of any kind.

### Privacy & Transparency

- View As modal always shows the "Viewing as [Name]" banner so there is zero ambiguity about which member's data is being viewed/modified.
- Actions taken by mom in View As are attributed to mom in audit logs (if implemented in future PRD), not to the member.
- **Mom's sidebar:** Features that mom cannot access due to tier restrictions are shown greyed out or blurred with a message: "This feature unlocks at [Enhanced/FullMagic] level." This gives mom visibility into what's available upon upgrading and serves as a natural upsell surface. Features mom has access to but hasn't set up yet show normally.
- **All other members' sidebars:** Features that a member cannot access do not appear at all — they are hidden, not greyed out. The member's shell should feel complete, not restricted. They should never see a "you can't use this" message in their navigation.

---

## Data Schema

### Updates to Existing Table: `family_members` (from PRD-01)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| layout_preferences | JSONB | '{}' | NOT NULL | Per-member layout state persistence |

**`layout_preferences` JSONB structure:**
```json
{
  "sidebar_open": true,
  "notepad_open": true,
  "quicktasks_open": true,
  "lila_drawer_state": "collapsed",
  "auto_collapsed_zones": [],
  "default_perspective": "personal"
}
```

**Defaults when empty/missing:**
- `sidebar_open`: true (desktop), false (mobile/tablet)
- `notepad_open`: true (xl breakpoint), false (smaller)
- `quicktasks_open`: true
- `lila_drawer_state`: "collapsed"
- `auto_collapsed_zones`: []
- `default_perspective`: "personal"

**RLS:** Same as PRD-01 — members can read/update their own record. Mom can read/update all members.

### Updates to Existing Table: `families` (from PRD-01)

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| hub_config | JSONB | '{}' | NOT NULL | Tablet Hub widget configuration |

**`hub_config` JSONB structure:**
```json
{
  "widgets": [
    { "type": "family_calendar", "size": "large", "position": { "x": 0, "y": 0 } },
    { "type": "shared_goals", "size": "medium", "position": { "x": 1, "y": 0 } }
  ],
  "always_on": true,
  "hub_theme": "family_default"
}
```

**RLS:** Only primary_parent can update `hub_config`. All family members can read (needed to render the hub).

### No New Tables

The shell routing system stores all preferences in existing tables. Shell selection is derived from `family_members.role` and `family_members.dashboard_mode` (defined in PRD-01). Layout preferences extend the existing `family_members` row. Hub configuration extends the existing `families` row.

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-01 (Auth & Family Setup) | `family_members.role` and `family_members.dashboard_mode` determine shell selection. Login flow routes to the appropriate shell layout. |
| PRD-01 (Tablet Hub) | Hub screen defined in PRD-01 is fully specified here with layout, widget grid, and member selection behavior. |
| PRD-02 (Permissions) | `PermissionGate` controls which sidebar items, drawer zones, and floating buttons appear per member. View As access level determines what mom can see/do in the modal. |
| PRD-03 (Design System) | Shell visual token overrides (typography, animation, spacing) are applied by the layout components based on the active shell. Breakpoints defined in PRD-03 drive responsive layout changes. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| Every feature PRD | Features render inside the main content area of the shell layout. Each feature can assume the sidebar, drawers, and floating buttons are available (or not) based on the shell. |
| PRD-05 (LiLa Core) | LiLa drawer layout, pull-up mechanics, and peek/full states are defined here. PRD-05 defines the chat behavior inside the drawer. |
| PRD-08 (Journal + Smart Notepad) | Smart Notepad drawer layout, tab behavior, and full-page expand mechanics are defined here. PRD-08 defines the capture/route functionality. |
| PRD-10 (Widgets) | Widget rendering areas (dashboard main content, hub widget grid) are defined here. PRD-10 defines widget types and configuration. |
| Future Gamification PRD | Gamification placement in Guided and Play shells defined here. The Gamification PRD defines point systems, reward types, and themes. |

---

## AI Integration

No direct AI integration in the shell routing system. LiLa operates inside the LiLa Chat drawer and floating buttons, but the drawer is a layout container — the AI behavior is defined in PRD-05.

---

## Edge Cases

### Member with No dashboard_mode Set
- If `dashboard_mode` is null or empty, default to `guided` for members with `role = 'family_member'`. Primary parent always gets Mom shell. Additional adults always get Adult shell.
- Log a warning for monitoring — this shouldn't happen in normal flows since PRD-01's member creation sets a default.

### Screen Resize During Session
- If a user connects/disconnects an external monitor, the auto-collapse system should react to the new viewport width. No page reload needed — use ResizeObserver or equivalent.
- If zones were auto-collapsed and space becomes available, auto-reopen them (respecting the user's manual open/close choices).

### Very Narrow Viewports (< 360px)
- All drawers auto-close. Sidebar hidden. Bottom nav items may truncate labels (icons only below 320px).
- LiLa peek state goes full-screen instead of 55vh.
- Content width is protected at all costs — this is the non-negotiable zone.

### Large Families on Hub (9+ Members)
- Member selection grid scrolls horizontally with overflow indicators.
- Grid wraps to multiple rows if space allows (responsive grid layout).
- Search/filter available for very large families (10+ members) — type to filter member list.

### View As: Navigating Within the Modal
- When mom opens View As, she sees the member's dashboard. Can she navigate to the member's Tasks page, Journal page, etc. within the modal? **Yes.** The View As modal is essentially a full shell rendered inside a modal container. Mom can use the member's sidebar/nav to explore their entire experience. The modal maintains its own navigation state, independent of mom's underlying page.
- Back button inside the modal navigates within the modal. Close button (or clicking the "Viewing as [Name]" banner's close button) exits the entire modal.

### Offline / PWA
- Layout structure works offline (it's just CSS/JS). Drawer open/close state is cached locally.
- Content inside the layout may show offline indicators (defined in future Offline/PWA PRD).
- Hub in always-on mode should be resilient to brief connectivity drops — cached widget data displayed with a subtle "last updated [time]" indicator.

### Special Adult Shift Expiry
- When a Special Adult's shift ends, sidebar items for assigned children disappear. If they were viewing a child-scoped feature, the main content shows a friendly message: "Your session for today has ended. Thanks for your help!" and offers to navigate to their own dashboard (if they have one) or back to the hub.

### Guided → Independent Graduation
- When mom changes a member from Guided to Independent, the layout structure changes on next login: full sidebar replaces simplified sidebar, full Smart Notepad replaces lightweight notepad, LiLa drawer becomes available (if permitted), QuickTasks strip appears, bottom nav is replaced by sidebar on desktop.
- The transition should feel like an upgrade, not a disruption. A one-time welcome message: "Your experience has been upgraded!" with a brief tour of new features.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `family_hub` | Access to the Tablet Hub (`/hub`) and hub configuration | Enhanced |
| `view_as` | Mom's ability to view other members' dashboards via View As modal | Enhanced |
| `family_overview` | Mom's Family Overview perspective on dashboard | Enhanced |
| `smart_notepad` | Access to the Smart Notepad right drawer | Essential |
| `quicktasks` | Access to the QuickTasks strip | Essential |
| `lila_drawer` | Access to the LiLa Chat bottom drawer (mom-only for MVP) | Essential (mom) |
| `lila_modal_access` | Family members' access to LiLa tools via modals from feature entry points | Enhanced (family members), Full Magic (full drawer upgrade) |

Note: All features return true during beta. The infrastructure exists from day one.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| LiLa Chat drawer container (UI shell, resting avatar, mode switching header) + LiLa modal container for non-mom members | LiLa conversation engine, context assembly, guided mode registry, Help/Assist/Optimizer modes | PRD-05 (LiLa Core) |
| Smart Notepad drawer container (UI shell, tab structure) | Capture/route system, tabs, voice, Send To grid | PRD-08 (Journal + Smart Notepad) |
| Hub widget grid (layout + drag-drop, stub widget cards) | Widget templates, real data rendering | PRD-10 (Widgets) |
| Dashboard widget area (personal dashboard layout) | Widget rendering with real data | PRD-10 (Widgets) |
| Gamification placement slots in Guided/Play shells | Point systems, reward types, achievement definitions, gamification themes | Future PRD (Gamification) |
| Perspective switcher: Family Overview (stub, shows placeholder) | Aggregated family progress data assembly | PRD-14 (Personal Dashboard) or future family dashboard PRD |
| Perspective switcher: Family Hub (stub, shows placeholder) | Hub data rendered in mom's dashboard context | PRD-10 (Widgets) or future family dashboard PRD |
| Calendar widget in dashboard (stub card) | Calendar views (monthly/weekly/day zoom), event management | Future Calendar PRD |
| Sidebar nav items per feature (placeholder labels) | Each feature PRD adds its sidebar link during build | All feature PRDs |
| Bottom nav items per shell (initial set) | Feature PRDs may adjust bottom nav composition | All feature PRDs |
| Command Center page (artistic card-based navigation view) | Design and implementation of the card layout | Future build or feature PRD |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Shell routing placeholder (`getShellForMember()`) | PRD-01 | Fully implemented: reads `role` + `dashboard_mode`, returns shell identifier, router wraps appropriate layout component |
| Shell visual token overrides | PRD-03 | Layout components apply shell-specific CSS class that activates token overrides defined in PRD-03 |
| Tablet hub screen (stub in PRD-01) | PRD-01 | Fully specified: widget grid, member selection, always-on mode, PWA entry point, "Back to Hub" behavior |
| PermissionGate for feature visibility | PRD-02 | Sidebar items, drawer availability, and floating buttons wrapped in PermissionGate to show/hide based on member's access |
| View As access model | PRD-02 | Implemented as a modal rendering the member's shell with mom's read/write access, member's theme + mom-colored banner |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `getShellForMember()` correctly returns shell identifier based on `role` + `dashboard_mode`
- [ ] Router wraps the correct layout component (MomLayout, AdultLayout, IndependentLayout, GuidedLayout, PlayLayout, HubLayout) for each shell
- [ ] Mom shell: sidebar with section grouping, collapsible, all sections present with placeholder nav items
- [ ] Adult shell: sidebar with filtered sections based on role
- [ ] Independent shell: sidebar with personal features only
- [ ] Guided shell: simplified layout with bottom nav, simplified sidebar (desktop), no LiLa, no QuickTasks
- [ ] Play shell: big tile layout, bottom nav with emoji, no sidebar, no drawers, settings parent-locked
- [ ] Hub layout: widget grid (stub cards), member selection in left-side hidden drawer, always-on mode, "Back to Hub" button
- [ ] QuickTasks strip: horizontal scroll, auto-sort stub, collapse/expand, state persistence
- [ ] Smart Notepad drawer: open/close, right-side panel, stub content area, collapse behavior
- [ ] Lightweight notepad for Guided shell (permission-gated): single-tab, text input, voice button stub
- [ ] LiLa Chat drawer: three states (collapsed/peek/full), drag handle, stub content area
- [ ] Floating buttons (Li character image, La character image, Settings gear): persistent top-right, correct visibility per shell, above all zones except modals
- [ ] Sidebar hover tooltips: short description on every nav item; icon strip shows name + description
- [ ] Mobile More menu: ⓘ info toggle that shows/hides feature descriptions below nav item labels
- [ ] Sidebar collapsed state: icon-only strip (~48px) with Lucide icons, no text labels
- [ ] Mom sidebar: tier-locked features shown greyed out/blurred with unlock message; all other members: inaccessible features hidden entirely
- [ ] Perspective switcher on dashboard page (mom only): My Dashboard active, Family Overview stub, Family Hub stub, View As with inline member picker
- [ ] View As modal: opens with member's theme, "Viewing as [Name]" banner in mom's colors, full navigation within modal, close returns to mom's page
- [ ] Responsive: sidebar collapse/hamburger at breakpoints, bottom nav on mobile, notepad as overlay on mobile
- [ ] Auto-collapse logic: main content protected at 480px min, zones collapse in priority order
- [ ] Layout preferences persist to `family_members.layout_preferences` JSONB
- [ ] Hub config persists to `families.hub_config` JSONB
- [ ] Themed scrollbars on all scrollable zones (sidebar, main content, notepad, drawers) per PRD-03
- [ ] PWA entry points: `/hub` and `/dashboard` both work with appropriate routing
- [ ] Modal system: backdrop, click-outside-to-close, save scroll position, full-screen on mobile, focus trap, escape key, stacking
- [ ] All layout components consume PRD-03 CSS variables and shell token overrides — no hardcoded colors or spacing
- [ ] RLS: members can read/update their own `layout_preferences`. Mom can read/update all. Only primary_parent can update `hub_config`.

### MVP When Dependency Is Ready
- [ ] Sidebar nav items populated with real feature links (requires individual feature PRDs to be built)
- [ ] Hub widgets render real family data (requires PRD-10 Widgets + Calendar PRD)
- [ ] LiLa drawer contains functional AI chat (requires PRD-05 LiLa Core)
- [ ] Smart Notepad drawer contains functional capture/route system (requires PRD-08 Journal + Smart Notepad)
- [ ] Gamification elements render in Guided/Play shells (requires Gamification PRD)
- [ ] Family Overview perspective shows aggregated family data (requires feature PRDs for tasks, victories, calendar, etc.)
- [ ] Calendar widget supports monthly/weekly toggle and day zoom for Adult, Independent, and Guided shells (requires Calendar PRD)
- [ ] Command Center page renders with artistic card-based navigation (requires design + build)

### Post-MVP
- [ ] Keyboard shortcuts for zone toggle (e.g., Cmd+\ for sidebar, Cmd+] for notepad)
- [ ] Drag-to-resize sidebar width and notepad width
- [ ] Gesture support: swipe from left for sidebar, swipe from right for notepad, swipe up for LiLa
- [ ] Animated transitions when switching shells (e.g., Guided → Independent graduation)
- [ ] Hub widget library with community-shared widget configurations
- [ ] Multi-hub support (different hub configurations for different family tablets)
- [ ] Hub screen saver mode (dims after inactivity, shows time/weather, wakes on tap)
- [ ] View As: pip mode (small floating window of member's dashboard instead of full modal)

---

## CLAUDE.md Additions from This PRD

- [ ] Shell routing: `getShellForMember(member)` reads `role` + `dashboard_mode` to determine layout. MomLayout, AdultLayout, IndependentLayout, GuidedLayout, PlayLayout, HubLayout.
- [ ] Layout architecture: Sidebar (left) + QuickTasks (top) + Main Content (center) + Smart Notepad (right drawer) + LiLa Chat (bottom drawer) + Floating Buttons (top-right) + Modals (above all). Not all zones in all shells.
- [ ] Floating buttons: Three LiLa avatar buttons (Help, Assist, Optimizer) + Settings gear. Each LiLa button launches the drawer in that mode. **Mom-only for LiLa buttons; all other shells show Settings only.**
- [ ] LiLa Chat drawer is **mom-only**. Dad, teens, and guided members access LiLa tools through permission-gated modals. The conversation engine is container-agnostic (drawer vs modal) — upgrading roles to full drawer access is a config change, not a rebuild.
- [ ] LiLa drawer resting state shows "sitting LiLa" meditative avatar for general conversation mode. Mode-specific avatar appears in header when a specific mode (Help/Assist/Optimizer/guided) is active.
- [ ] Perspective switcher (My Dashboard / Family Overview / Family Hub / View As) is dashboard-page-only, NOT global. It disappears when navigating to any other feature via sidebar.
- [ ] View As renders as a modal with the member's theme + a persistent banner in mom's theme colors. Mom has full read/write access. Actions update the same data the member would update ("edited somewhere, edited everywhere").
- [ ] Auto-collapse priority (first to collapse → last): QuickTasks → Smart Notepad → Sidebar → LiLa → Main Content (never collapses). Triggered when main content width < `--content-min-width: 480px`.
- [ ] Guided shell: no LiLa drawer, no LiLa floating buttons, no QuickTasks, simplified sidebar, optional lightweight notepad (permission-gated), bottom nav always visible, gamification woven in + dedicated progress page. Permission-gated modal access to specific LiLa tools (mom grants per tool). All conversations visible to mom.
- [ ] Play shell: no sidebar, no drawers, no LiLa, no floating Li/La buttons. Big tile layout, emoji bottom nav, settings parent-locked. Gamification is primary UX framework.
- [ ] Hub is a standalone layout (`/hub`), not a shell. Widget grid fills full viewport. Member selection lives in a hidden left-side drawer (swipe/tap to reveal). Uses family's default theme. Always-on mode. Settings requires mom's auth.
- [ ] Layout preferences persist to `family_members.layout_preferences` JSONB. Hub config persists to `families.hub_config` JSONB.
- [ ] Sidebar visibility rules: **Mom** sees tier-locked features greyed out/blurred with "[Feature] unlocks at [tier] level" message (upsell surface). **All other members** see inaccessible features HIDDEN entirely — their shell should feel complete, not restricted.
- [ ] Sidebar hover descriptions: every sidebar item shows a short tooltip description on hover (~10 words). Collapsed icon strip shows name + description in tooltip.
- [ ] Mobile "More" menu info toggle: ⓘ button in menu header toggles short descriptions below each nav item label. Follows StewardShip MoreMenu pattern.
- [ ] Mobile: bottom nav (4-5 items, shell-specific), hamburger menu for full nav with ⓘ info toggle, notepad as right-side overlay, LiLa pull-up above bottom nav, modals full-screen.
- [ ] Floating LiLa buttons use character avatar images (Help=open arms, Assist=clipboard, Optimizer=thinking pose). Resting drawer state uses "sitting LiLa" meditative avatar. Settings uses a gear icon.
- [ ] Sidebar collapsed state = narrow icon-only strip (~48px) with Lucide icons, no text labels (Claude.ai pattern). NOT a thin hint strip.
- [ ] Smart Notepad for Guided shell: single-tab, large text, voice input, saves to journal, no routing grid. Permission-gated by mom. Forward-compatible with full notepad on graduation to Independent.

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables modified:**
- `family_members` — added `layout_preferences` JSONB (default '{}')
- `families` — added `hub_config` JSONB (default '{}')

**No new tables defined.** Shell routing is derived from existing columns (`role`, `dashboard_mode`). Layout state and hub configuration extend existing tables.

**No new enums defined.** Shell identifiers are used as string constants in code, not database enums.

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Personal Dashboard is mom's landing page, not Command Center** | Mom should be treated as a person first. Command Center moves to sidebar as an artistic navigation complement. |
| 2 | **Sidebar = features, perspective switcher = lenses on data** | Eliminates redundancy between Command Center and sidebar. Features are tools you use; perspectives are views on data. |
| 3 | **Perspective switcher is dashboard-page-only, not global** | It's only relevant when viewing dashboards. Disappears when navigating to feature pages via sidebar. |
| 4 | **View As opens as a modal with member's theme + mom-colored banner** | Mom gets authentic preview of member's experience while maintaining clear "observation mode" indicator. |
| 5 | **View As modal is fully navigable** | Mom can use the member's sidebar/nav within the modal to explore their entire experience. |
| 6 | **"Edited somewhere, edited everywhere" — perspectives are lenses, not data stores** | Marking a task done in View As updates the same record everywhere. No data duplication between views. |
| 7 | **Guided and Play shells do NOT get full five-zone layout** | Guided gets simplified sidebar + main + optional lightweight notepad. Play gets big tiles + bottom nav only. No LiLa in either. |
| 8 | **Smart Notepad available in all shells, simplified for Guided** | Guided gets lightweight single-tab notepad (permission-gated, forward-compatible). Play gets none. |
| 9 | **LiLa drawer is mom-only for MVP** | Other family members access LiLa tools via modals from feature entry points. Conversation engine is container-agnostic for future tier upgrade. |
| 10 | **Three LiLa floating buttons (Help, Assist, Optimizer) + Settings** | Each button is a mode launcher using LiLa character avatar images. Mom-only; all other shells show Settings only. |
| 11 | **Resting "sitting LiLa" avatar in drawer** | General conversation mode that smart-routes to specialized tools. Different from the three mode-specific avatars. |
| 12 | **Hub member selection in left-side hidden drawer** | Privacy benefit — members not always visible on screen. Widget grid gets full viewport. |
| 13 | **Sidebar collapsed = icon-only strip (Claude.ai pattern)** | ~48px strip with Lucide icons, no text labels. Quick visual recognition without consuming horizontal space. |
| 14 | **Settings NOT in sidebar** | Accessed only via floating gear icon in top-right. No duplication. |
| 15 | **Mom sees tier-locked features greyed/blurred; others see them hidden** | Mom gets upsell visibility. Other members get a clean, complete-feeling shell. |
| 16 | **Sidebar hover descriptions + mobile ⓘ info toggle** | Helps new users learn features. Follows existing StewardShip MoreMenu pattern for mobile. |
| 17 | **Gamification woven into Guided + dedicated Progress page** | Ambient motivation through woven-in elements; deep dive available via bottom nav. |
| 18 | **Play shell uses emoji icons in bottom nav** | Emoji permitted in Play shell per PRD-03. Big visual icons for pre-readers. |
| 19 | **Guided members get permission-gated modal LiLa tool access** | Changed from "no LiLa" to scoped modal access. Mom controls which tools. All conversations visible to mom. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Special Adult shell layout (full Adult shell vs purpose-built minimal layout) | Caregiver Tools PRD or build phase |
| 2 | Specific sidebar item names and ordering | Build phase — trivially changeable |
| 3 | Gamification point systems, reward types, themes | Future Gamification PRD |
| 4 | Calendar widget monthly/weekly/day-zoom implementation | Future Calendar PRD |
| 5 | Command Center page design (artistic card-based navigation) | Future build or feature PRD |
| 6 | Auto-collapse exact implementation (ResizeObserver vs CSS container queries) | Build prompt |
| 7 | Hub widget types and data rendering | PRD-10 (Widgets) |
| 8 | Keyboard shortcuts and gesture support for zones | Post-MVP |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core) | Three LiLa floating buttons (not two). Sitting LiLa resting state. Drawer is mom-only. Guided shell gets permission-gated modal tools. | Applied via PRD-05 planning update. |
| PRD-08 (Journal + Smart Notepad) | Journal sub-page routes defined as container routes within PRD-04. Lightweight notepad for Guided shell specified. | Journal container route pattern added to PRD-04. PRD-08 defines the full Journal spec. |
| PRD-03 (Design System) | Shell token overrides now have specific layout containers to apply to. | No changes needed — PRD-03 already defines tokens per shell. PRD-04 consumes them. |
| PRD-09A/B (Tasks, Lists, Studio) | Studio added to sidebar. Studio container routes added. "Add Task" confirmed as Task Creation Modal launcher. Dashboard collapsible sections pattern noted. Play shell has no view toggles. | Applied via PRD-09 cross-PRD impact update. |

---

*End of PRD-04*
