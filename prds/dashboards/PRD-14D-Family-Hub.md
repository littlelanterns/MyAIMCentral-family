> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-14D: Family Hub

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder + Daily Celebration), PRD-11B (Family Celebration), PRD-12B (Family Vision Quest), PRD-14 (Personal Dashboard), PRD-14B (Calendar), PRD-14C (Family Overview)
**Created:** March 11, 2026
**Last Updated:** March 11, 2026

---

## Overview

PRD-14D defines the Family Hub — the shared family coordination surface that belongs to no one and everyone. If the Personal Dashboard (PRD-14) is "my space" and the Family Overview (PRD-14C) is "mom's monitoring lens," the Family Hub is "our space." It is the digital equivalent of the kitchen bulletin board, the family whiteboard, and the dinner table conversation combined.

The Hub has one aesthetic that mom configures. It looks the same no matter who is looking at it — there are no shell-specific rendering differences. It is accessible through three paths: as a perspective switcher tab available to all family members from their personal dashboard, as the standalone `/hub` route for shared family tablets, and as the `/hub/tv` route for smart TV rendering (PRD-14E). The Hub is also the foundation for TV Mode — all content must be designed with living-room-scale legibility in mind.

When a family member wants to interact with their personal account from the Hub (e.g., on a shared tablet), they tap their name, authenticate via PIN, and a near-full-screen modal opens showing their personal shell. When they close the modal, they're back at the shared Hub surface.

> **Mom experience goal:** When I walk into the kitchen, the tablet on the counter shows me what's for dinner, whose birthday is in 3 days, that my kids logged 14 victories today, and that there are 2 jobs available on the job board. When my kid walks up to that same tablet, they see the same thing — and can tap their name to jump into their own space. It's a family hearth, not a control panel.

> **Depends on:** PRD-04 (Shell Routing) defines the Hub as a standalone layout (`/hub`) with a member drawer and widget grid. PRD-14D fully specifies the content and interaction model that renders inside that layout. PRD-14 (Personal Dashboard) defines the perspective switcher — PRD-14D wires the "Hub" tab and extends the perspective switcher to all member shells, not just mom's.

---

## Related PRDs in the PRD-14 Family

| PRD | Feature | Relationship |
|-----|---------|-------------|
| **PRD-14** | Personal Dashboard | Parent — defines the perspective switcher and dashboard page container |
| **PRD-14B** | Calendar | Provides the calendar component, member colors, Universal Queue Modal |
| **PRD-14C** | Family Overview | Mom's aggregated monitoring view (separate from Hub) |
| **PRD-14D** (this document) | Family Hub | Shared family coordination surface |
| **PRD-14E** | Family Hub TV Mode | Smart TV PWA rendering, D-pad navigation, ambient mode (separate PRD) |

---

## User Stories

### Shared Family Surface
- As a family, we want a shared digital surface that shows our schedule, goals, and victories so we all know what's going on without asking mom twenty times.
- As a mom, I want to configure one family display surface — choose what sections are visible, what theme it uses, what content appears — and have every family member see the same thing.
- As a mom, I want the Hub to work on our kitchen tablet as an always-on family display so it replaces the paper calendar and whiteboard we never update.

### Viewing from Personal Dashboard
- As any family member, I want to toggle to the Family Hub from my personal dashboard so I can check what's happening tonight without walking to the kitchen tablet.
- As a teen, I want to see the family Hub from my phone so I know what's for dinner and whether there are any jobs I can claim.
- As a dad, I want to glance at the Hub tab to see family countdowns and the calendar without switching apps or devices.

### Shared Device Interaction
- As a family member on the shared tablet, I want to tap my name, enter my PIN, and open my personal dashboard in a modal so I can check my tasks without leaving the Hub.
- As a mom, I want the Hub to return to the shared view automatically after a family member's session times out so the tablet doesn't get stuck on someone's personal dashboard.

### Family Best Intentions
- As a family, we want shared intentions like "Remain Calm" or "Sincerity Instead of Sarcasm" displayed on the Hub so everyone is reminded of what we're working on together.
- As any family member, I want to tap to log that I practiced a family intention from my OWN personal dashboard — not just from the Hub — so I don't have to walk to the kitchen tablet every time.
- As any family member, I want my individual tallies to add up on the Hub's combined display so we all see the family's collective progress.
- As a mom, I want to decide whether each family intention requires a PIN to log (to prevent kids from tapping for each other) or is open (because it's low-stakes and positive).
- As a mom, I want to create family intentions myself, incorporating input from family meetings, conversations, and messaging — not through a formal in-app suggestion queue.

### Family Celebration
- As a parent, I want a prominent "Celebrate" button on the Hub so we can launch the family celebration ritual when we gather in the evening.
- As a mom, I want the Celebrate button to require a parent PIN on the Hub so kids can't trigger AI celebrations unsupervised.

### Calendar & Events
- As a family, we want the Hub calendar to always show everyone's schedule so anyone walking past the tablet can check what's happening.
- As a mom, I want to hide specific events from the Hub (like "Buy Jake's birthday present") with a simple "Hide from Hub" button without hiding them from my personal calendar.

### Countdowns
- As a family, we want visual countdowns to exciting events (vacation, birthdays, holidays) displayed prominently on the Hub so we can build anticipation together.
- As a mom, I want to create countdowns that push to individual dashboards, the Hub, or both.

### Victories & Job Board
- As a family member, I want to see a summary of how many victories our family recorded today so we feel collective pride.
- As a kid, I want to browse available jobs on the Hub so I know what's up for grabs before I log in to claim one.

### Slideshow Frame
- As a mom, I want the Hub to double as a digital picture frame displaying family photos, famous art, word art images, or beautifully rendered text quotes and scriptures — with different timers for images vs. text vs. word art.
- As a mom, I want to be able to type text (quotes, scriptures, poetry) and have the system render it beautifully to match the Hub theme, OR upload word art images with their own display timing.
- As anyone, I want to tap one button to switch between the Hub and the slideshow frame so it's effortless to go back and forth.

---

## Screens

### Screen 1: Family Hub — Main Surface

> **Mom experience goal:** The Hub should feel warm and alive — like a kitchen that smells like dinner is cooking. Not a control panel, not a dashboard, not a data display. A family hearth.

**What the user sees:**

A vertically scrolling page with a sequence of configurable sections. On the standalone `/hub` route, this fills the full viewport with no sidebar, no drawers, and a hidden member drawer on the left edge (per PRD-04). When rendered as a perspective switcher tab, it fills the main content area of the user's shell.

```
┌────────────────────────────────────────────────────────┐
│  [⋮ Members]  The Smith Family Hub        [🖼 Frame] [⚙]│
├────────────────────────────────────────────────────────┤
│                                                        │
│  📅 Family Calendar                                    │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐   │
│  │ Sun  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │   │
│  │      │●●●   │●     │●●    │      │●●●●  │●     │   │
│  │      │Dntst │      │Soccr │      │Piano │Game  │   │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘   │
│                                                        │
│  ┌─ Our Family Vision ─────────────────────────────┐   │
│  │ "We are a family that chooses kindness, values  │   │
│  │  hard work, celebrates each other, and makes    │   │
│  │  time to play together."                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Family Best Intentions ────────────────────────┐   │
│  │  Remain Calm                                     │   │
│  │  (Mom)(Dad)(Jake)(Emma)(Sam) ← avatar circles    │   │
│  │  Family tally today: 7                           │   │
│  │                                                  │   │
│  │  Sincerity > Sarcasm                             │   │
│  │  (Mom)(Dad)(Jake)(Emma)(Sam)                     │   │
│  │  Family tally today: 4                           │   │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  🎉 14 victories recorded today!       [Celebrate 🔒]  │
│                                                        │
│  ┌─ Countdown ─────────────────────────────────────┐   │
│  │  🏖 Beach Vacation     │  🎂 Jake's Birthday    │   │
│  │     12 days            │     5 days             │   │
│  └────────────────────────┴────────────────────────┘   │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐     │
│  │ 🍽 Dinner    │  │ 📋 Job Board │  │ 📚 Family│     │
│  │ Taco Tuesday │  │ 3 available  │  │ Reading  │     │
│  │              │  │              │  │ Challenge│     │
│  │   (M)        │  │   (M)        │  │ 47/100   │     │
│  └──────────────┘  └──────────────┘  └──────────┘     │
│                                                        │
│  [🖼 Slideshow Frame]  ← widget in grid                │
│                                                        │
│  ┌─ Family Members ────────────────────────────────┐   │
│  │ (Mom 🔒)(Dad 🔒)(Jake 🔒)(Emma 🔒)(Sam)(Rosie) │   │
│  │  Tap your name to open your space               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Header:**
- Left: Member drawer pull tab (standalone `/hub` route only — hidden on perspective tab view since the user already has sidebar access)
- Center: Family name or custom Hub title (mom-configurable)
- Right: Frame toggle button (opens slideshow overlay) and Settings gear (PIN-protected)

**Sections (configurable order, configurable visibility):**

| # | Section Key | Content | Default Visibility |
|---|-------------|---------|-------------------|
| 1 | `family_calendar` | Shared family calendar — all members, same PRD-14B component with `memberIds` = all family member IDs. Week view default. | Visible |
| 2 | `family_vision` | Active Family Vision Statement from PRD-12B. Styled as a prominent, warm quote card. Hidden if no Vision Quest has been completed. | Visible (when data exists) |
| 3 | `family_best_intentions` | Family-level Best Intentions with per-member avatar tally interaction. See Screen 2. | Visible |
| 4 | `victories_summary` | "X victories recorded today!" summary count. Tap opens a brief, celebratory summary (not individual details). "Celebrate" button launches Family Celebration (PRD-11B), PIN-protected. | Visible |
| 5 | `countdowns` | Visual countdown cards for upcoming exciting events. See Screen 4. | Visible |
| 6 | `widget_grid` | Family-scoped widget grid. Includes Menu widget, Job Board widget, Slideshow Frame widget, shared trackers (e.g., family reading challenge), and any other family-scoped widgets. Uses PRD-10 grid mechanics. | Visible |
| 7 | `member_access` | Family member avatar row. Tap name → PIN auth → personal shell modal. See Screen 5. | Visible (standalone route). Hidden on perspective tab view (user is already authenticated). |

> **Decision rationale:** Seven section types, all mom-configurable for order and visibility. The Hub is a "what you see is what you get" surface — no filtering, no per-user customization beyond what mom configures. Like a kitchen bulletin board: one board, one arrangement, everyone sees the same thing.

**Calendar section details:**

- Same rendering component as PRD-14B and PRD-14. Receives `memberIds` prop with ALL family member IDs.
- No `MemberPillSelector` — always all-family. Mom uses Family Overview (PRD-14C) for filtered views.
- Week view default. Week/Month toggle available.
- **Hub event visibility:** Events have a `show_on_hub` boolean (default `true`). When creating or editing an event, a "Hide from Hub" button is available. Mom taps it to toggle `show_on_hub = false` for that event. The Hub calendar component filters by this flag. Simple per-event control — no category-level system.
- Color coding uses member `calendar_color` from `family_members` table.
- Tap any event → Event Detail flyout (PRD-14B Screen 3).

> **Depends on:** PRD-14B (Calendar) for the shared calendar component and `calendar_events` table. The `show_on_hub` boolean is a schema addition defined in this PRD.

> **Decision rationale:** Per-event "Hide from Hub" button is simple and direct. Category-level defaults were considered but add complexity that isn't needed for MVP — most events should show on the Hub, and the few that shouldn't (surprise parties, private appointments) are easily toggled individually.

**Family Vision Statement section:**

- Reads the active `family_vision_statements` record (PRD-12B) where `is_active = true`.
- Rendered as a warm, prominent quote card with serif display font (`--font-display`).
- If no active Family Vision Statement exists, section is hidden entirely (not an empty state — the section simply doesn't appear).
- Tapping the vision card navigates to the Family Vision Quest page (PRD-12B) for the viewer's role (mom sees the Quest Hub; other members see their answerable sections).

> **Depends on:** PRD-12B (Family Vision Quest) for `family_vision_statements` table and `is_active` flag.

**Victories summary section:**

- Shows a single warm line: "The [Family Name] recorded [X] victories today!" with a subtle celebration icon.
- Count aggregates across all family members. Teen victories included or excluded per mom's configuration (see Visibility section).
- Tapping the summary line shows a brief expansion: victory count per family member (by first name), no individual victory details. "Jake: 4 · Emma: 2 · Sam: 3 · Mom: 3 · Dad: 2"
- **"Celebrate" button:** Prominent, warm, positioned beside or below the victories summary. Opens Family Celebration (PRD-11B Screen 1). PIN-protected on standalone Hub (parent PIN required). On perspective tab, no PIN needed (user is already authenticated as themselves).
- Mom configures teen victory visibility for the Hub separately from the Family Overview visibility. Guided recommendation: app explains that showing teen victories on the Hub means siblings can see the count, while hiding them keeps teen privacy on the shared surface. Mom makes the final call.

> **Decision rationale:** Summary counts, not individual details, on the Hub. This respects the principle from PRD-11B: no sibling comparisons. The evening Family Celebration (via the Celebrate button) is where LiLa narrates individual achievements with nuance and intention.

> **Forward note:** When the Family Celebration feature auto-archive is built (post-MVP per PRD-11B), past celebration summaries could display as a "recent celebrations" card on the Hub.

**Interactions on the main surface:**
- Sections are NOT collapsible on the Hub (unlike the Personal Dashboard). The Hub is a glanceable display — if mom doesn't want a section, she hides it from Hub settings, she doesn't collapse it mid-view.
- Scrolling is the primary navigation. On tablet/TV, sections are large and spaced for readability.
- Long-press enters edit mode (same trigger as PRD-14 and PRD-10): sections can be reordered, visibility toggled, widget grid enters edit mode. Only accessible by mom (requires PIN on standalone Hub).

**Data read:**
- `family_hub_configs` for section order, visibility, and preferences
- `calendar_events` filtered by `show_on_hub = true`
- `family_vision_statements` WHERE `is_active = true`
- `family_best_intentions` + `family_intention_iterations`
- `victories` aggregated counts per member for today
- `countdowns` table for active countdowns
- Widget data per PRD-10

---

### Screen 2: Family Best Intentions — Hub Display & Interaction

> **Mom experience goal:** Our family intentions should feel like a rallying cry on the wall — something we all look at and feel united about. When my 8-year-old taps their avatar to say "I was calm today," that should feel meaningful, not like checking a box.

**What the user sees:**

Each family intention displays as a card with:
- **Intention title** — prominent, warm typography (e.g., "Remain Calm")
- **Optional description** — one line of context (e.g., "We choose calm words, even when we're frustrated")
- **Member avatars** — small circular avatars for each participating family member, arranged in a row below the title
- **Today's tally** — "Family tally today: 7" showing the combined count across all members
- **Per-member mini-tally** — subtle count below or beside each avatar showing that member's individual count for today (e.g., Mom: 2, Jake: 3, Emma: 2)

**Interaction — Tap to Tally:**
- Tapping a member's avatar logs one iteration of that intention for that member.
- **PIN requirement is per-intention, configured by mom:** If the intention has `require_pin_to_tally = true`, tapping the avatar prompts for that member's PIN before logging. If `false`, the tap logs immediately — no authentication.
- On successful tally: brief celebratory micro-animation on the avatar (subtle pulse, small sparkle). The family tally count increments. The per-member count increments.
- Multiple taps per day per member are allowed (same as personal Best Intentions — PRD-06).

> **Decision rationale:** Mom configures PIN per intention because some families want accountability ("prove it was you"), while others want frictionless positive reinforcement ("just tap when you remember"). A family intention like "Drink more water" is low-stakes tap; "No screen time after 8 PM" might warrant PIN verification.

**Personal Dashboard Participation:**

Family Best Intentions are NOT Hub-only. When a member is assigned to a family intention, that intention also appears on their personal dashboard — either as a widget in their widget grid or as an entry in their Best Intentions section (rendered distinctly from personal Best Intentions with a "family" badge/indicator).

- **From their personal dashboard:** The member taps to log their own tally. Same interaction as the Hub, but scoped to their own avatar — no need to select which member they are (they're already authenticated).
- **All tallies aggregate to the Hub display.** Whether a tally was logged from the Hub, from a personal dashboard, or from a family tablet, it all feeds the same `family_intention_iterations` table.
- **The personal dashboard view shows:** The intention title, the member's own tally for today, and the family total. "Remain Calm — You: 2 today · Family: 7 today."
- **Widget deployment:** When mom creates a family intention and assigns members, a Family Best Intentions widget auto-deploys to each assigned member's personal dashboard widget grid. The member can move or hide it like any widget (per PRD-10 edit mode), but cannot delete the underlying intention.

> **Decision rationale:** The Hub is the combined scoreboard, but you shouldn't have to walk to the kitchen to participate. Family intentions live on personal dashboards too — everyone contributes from wherever they are, and the Hub shows the collective result.

> **Depends on:** PRD-10 (Widgets) for widget auto-deployment to personal dashboards. PRD-14 (Personal Dashboard) for widget grid hosting.

**Creating family intentions:**

- Mom creates family Best Intentions from the Family Hub Settings screen (Screen 6).
- Family input comes through natural channels — conversations, family meetings, messaging (Higgins/PRD-13A when built), or mom simply knowing her family's needs. There is no in-app formal suggestion queue for MVP.
- On the Hub surface: no creation UI for non-mom members.

> **Forward note:** A future "Suggest an Intention" flow could let family members propose intentions from their personal dashboard, which appear in a queue for mom to review. For MVP, family input flows through conversation, not a formal queue.

**Data created/updated:**
- `family_intention_iterations` — one row per tally tap (member_id, intention_id, timestamp)

---

### Screen 3: Widget Grid — Family Widgets

> **Depends on:** PRD-10 (Widgets, Trackers & Dashboard Layout) for grid mechanics, widget templates, and rendering.

The Hub widget grid uses the same PRD-10 grid system as personal dashboards. Widgets snap to the grid in Small (1×1), Medium (2×1), and Large (2×2) sizes. Mom arranges widgets in edit mode (PIN-protected on standalone Hub).

**Hub-specific widget types:**

| Widget | Type | Default Size | Description |
|--------|------|-------------|-------------|
| **Menu / Dinner** | Text card | Medium | Mom-editable text card for MVP. "Tonight: Taco Tuesday!" Free text. Eventually pulls from a dedicated Meal Planning tool — the widget is the display surface, the data source is a future Meal Planning PRD. |
| **Job Board** | Read-only list | Medium | Shows count of available opportunities and a brief list. "3 jobs available: Organize garage ($5), Weed garden ($3), Wash car ($4)." Tap opens a detail overlay (not interactive — claim requires personal shell auth). |
| **Slideshow Frame** | Media widget | Any size | Thumbnail preview of current slideshow image. Tap opens the near-full-screen frame overlay (Screen 7). |
| **Shared Tracker** | Tracker widget | Small–Large | Any tracker created with `scope = 'family'` — e.g., "Family Reading Challenge: 47/100 books." Uses PRD-10 tracker visual variants. |
| **Countdown** | Countdown card | Small–Medium | Individual countdown for an event. "🏖 Beach Vacation — 12 days." Created from the Countdowns section or as standalone countdown widgets. |
| **Custom Text** | Text card | Any size | Free-text card for mom to post announcements, reminders, or notes. "Don't forget: Grandma arrives Thursday!" |

> **Decision rationale:** The widget grid is the "bulletin board pins" — mom sticks whatever she wants on there. The Menu and Job Board are widgets (opt-in) rather than mandatory sections because not every family needs them on the Hub surface at all times.

> **Forward note:** Meal plan integration (structured day-by-day grid, recipe links, grocery list connection) replaces the simple Menu text card when a Meal Planning PRD is written.

**Job Board widget — read-only behavior:**
- Shows available opportunities from `tasks` WHERE `task_type LIKE 'opportunity_%'` AND status is available.
- Displays: task name, reward ($ or points), claim status (available / claimed by [name] if mom configured claim visibility to show names).
- Tapping the widget opens a detail overlay with the full opportunity list. NO claim button on the Hub — the overlay shows "Log in to your account to claim a job" with a pointer to the member access row.

> **Decision rationale:** Read-only on the Hub preserves the PIN-per-action security model. One kid can't claim under another kid's name from the shared tablet without authentication.

---

### Screen 4: Countdowns

**What the user sees:**

Countdowns display as colorful cards with large numbers, each showing:
- **Event name** with optional emoji/icon
- **Days remaining** in large, prominent text
- **Target date** in smaller text below
- Optional **assigned members** shown as small avatar dots (if the countdown is for specific people vs. the whole family)

**Countdown creation:**
- Mom creates countdowns from Hub Settings (Screen 6) or from a [+ Add Countdown] action in the countdown section during edit mode.
- Each countdown has: title, target date, optional emoji/icon, assignment scope (Hub-only, whole family, or specific members).
- **Assignment scope:**
  - **Hub-only:** Countdown appears only on the Hub.
  - **Whole family:** Countdown appears on the Hub AND pushes as a widget to every family member's personal dashboard.
  - **Specific members:** Countdown appears on the Hub AND pushes as a widget to the selected members' personal dashboards.

> **Decision rationale:** Countdowns as assignable widgets mirror the philosophy of opportunities — mom creates centrally, distribution is configurable. "Beach Vacation" goes to everyone. "Jake's Science Fair" goes to Jake's dashboard and the Hub.

**Data created:**
- `countdowns` table — one row per countdown event.

**Behavior:**
- Countdowns auto-hide when the target date passes (or mom can configure to show "Today is the day!" on the target date and hide the next day).
- Countdowns sort by nearest date first.

---

### Screen 5: Member Quick Access (Standalone Hub Only)

> **Depends on:** PRD-01 (Auth & Family Setup) for PIN authentication. PRD-04 (Shell Routing) for member drawer behavior.

**What the user sees:**

On the standalone `/hub` route, a "Family Members" section at the bottom of the Hub shows a row of family member avatars/names. This is the entry point for any family member to access their personal space from the shared device.

- Each member shows: avatar circle (or initials), first name, lock icon if PIN-protected.
- **Tap a member →** PIN prompt (or direct entry if `auth_method = 'none'`) → near-full-screen modal opens showing that member's personal shell/dashboard.
- The modal has a prominent "Back to Hub" button in the header. Tapping it closes the modal and returns to the Hub.
- Session timeout returns to Hub automatically (per PRD-01 session management settings).

> **Decision rationale:** This is the same interaction model described in PRD-04's Tablet Hub spec, now fully specified. The modal overlay preserves the Hub state underneath — when you close the modal, the Hub is right there, no reload needed.

**On the perspective tab view:** This section is hidden. The user is already authenticated on their own device — they don't need a member selector to log in. They're viewing the Hub as a read-only tab, and their personal dashboard is one tab-tap away.

**Privacy benefit:** On the standalone Hub, member names and avatars are in a scrollable row at the bottom — visitors see the Hub content (calendar, countdowns, etc.) first, not a list of family members.

---

### Screen 6: Hub Settings (Mom Only, PIN-Protected)

**Access:** Tap the settings gear on the Hub header. On standalone Hub, requires mom's PIN. On perspective tab, no extra PIN needed (mom is already authenticated).

**What mom sees:**

A settings page/modal with the following configuration groups:

**Hub Appearance:**
- Hub title (default: "[Family Name] Hub", editable)
- Theme selection for the Hub surface (uses the family's default theme from PRD-03, or mom can choose a specific theme override for just the Hub)

**Section Visibility & Order:**
- List of all section keys with visibility toggles and drag-to-reorder handles
- Each section shows its key, current visibility, and order position
- Drag sections to change the order. Toggle eye icon to show/hide.

**Family Best Intentions Management:**
- List of existing family intentions with edit/archive actions
- [+ Create New Intention] button → creation form:
  - Title (required)
  - Description (optional — one-line context)
  - Participating members (multi-select, default: all family members)
  - Require PIN to tally? (toggle, default: off)
  - Active/Inactive toggle
- No in-app suggestion queue for MVP. Mom creates intentions based on family conversations, meetings, and messaging.

> **Forward note:** A formal suggestion flow (family members propose, mom approves) could be added post-MVP. For now, family input flows through conversation.

**Calendar Hub Visibility:**
- Note: per-event "Hide from Hub" toggle is managed in the event creation/edit flow (PRD-14B), not here. Hub Settings simply notes: "Events are visible on the Hub by default. You can hide individual events from the Hub when creating or editing them."

**Countdown Management:**
- List of active countdowns with edit/delete/archive
- [+ Create Countdown] button → creation form (see Screen 4)

**Victory Display:**
- "Show victory count on Hub" toggle (default: on)
- "Include teen victories in Hub count" toggle with guided recommendation (default: on, with explanation of what siblings will see)
- Celebrate button PIN requirement toggle (default: on for standalone Hub)

**Widget Grid:**
- "Manage Widgets" link → enters Hub widget grid edit mode (same as PRD-10 edit mode, scoped to the Hub's `dashboard_configs` record)

**Data updated:**
- `family_hub_configs` table — all settings above

---

### Screen 7: Slideshow Frame Overlay

> **Mom experience goal:** I want the tablet to be beautiful when we're not actively using it — showing art, quotes, or family photos. But I need to be able to get back to the Hub instantly.

**What the user sees:**

A near-full-screen overlay that fills the viewport, displaying slideshow content. A small, semi-transparent "Back to Hub" button floats in one corner (configurable position). The overlay is one tap or swipe away from the Hub at all times.

**Content sources (mixed into a single rotation):**
- **Uploaded images (photos/art):** Mom uploads family photos, famous art prints, etc. Standard image category.
- **Uploaded images (word art):** Mom uploads word art, typographic prints, quote graphics, etc. Separate "word art" category with its own timer setting — these are meant to be read, so they linger longer than regular images.
- **Typed text slides:** Mom types quotes, scriptures, poetry, or custom text. The system renders it beautifully as a text slide matching the Hub theme (display fonts, theme colors, warm background). For moms who just want a single dump box of text without fussing with categories — that works too.
- **Family Guiding Stars auto-feed:** If enabled, active family-level Guiding Stars (from `guiding_stars` WHERE `owner_type = 'family'` AND `is_included_in_ai = true`) are automatically mixed into the slideshow rotation as styled text slides.

**Duration settings (per content type):**
- **Photos/art images:** configurable duration (default: 60 seconds per image)
- **Word art images:** configurable duration (default: 5 minutes per image — longer than photos because they're meant to be read)
- **Typed text slides and Guiding Stars:** configurable duration (default: 10 minutes per text slide — long enough to read, reflect, and absorb)
- **Single-image freeze:** Mom can select one image to display indefinitely (no rotation) — useful as a static digital frame.
- Transition: smooth cross-fade between slides.

**Slideshow management (in Hub Settings):**
- Upload images (multiple file upload, drag-and-drop) with category selection: "Photos & Art" or "Word Art"
- Add typed text slides (body text required, rendered by the system matching Hub theme)
- Enable/disable Guiding Stars auto-feed toggle
- Set duration per content type (photos/art, word art, text/Guiding Stars)
- Set rotation order: sequential, random, or grouped by category
- Remove/reorder individual slides
- Single dump box mode: mom can just add everything without worrying about categories — system applies sensible defaults

**Interactions:**
- **Tap anywhere** on the slideshow overlay → pause/play toggle (shows a subtle play/pause icon briefly)
- **Tap "Back to Hub" button** → close overlay, return to Hub
- **Swipe down** (on touch devices) → close overlay, return to Hub
- **Frame toggle button** in Hub header → open/close the overlay

> **Decision rationale:** The slideshow is defined in PRD-14D (not deferred to PRD-14E) because it has significant value on a tablet — a wall-mounted tablet showing family art and quotes is a real, desirable use case. PRD-14E extends this with TV-specific rendering (ambient mode with time/event overlay in a corner, D-pad remote navigation to pause/skip/exit).

> **Forward note:** Future integration with AI Vault content library could provide curated image/quote packs (famous art collections, daily scripture feeds, seasonal quote rotations) that mom can subscribe to instead of uploading everything manually.

---

## Visibility & Permissions

| Role | Hub Access | Hub Configuration | Family Best Intentions | Celebrate Button | Member Quick Access |
|------|-----------|-------------------|----------------------|-----------------|-------------------|
| Mom / Primary Parent | Full view via perspective tab and standalone Hub. Edit mode for sections and widgets. | Full configuration access (settings, section visibility, theme, intentions management, countdown creation, slideshow management). | View, tally (own avatar), create/edit/archive intentions, manage suggestion queue. | Trigger without PIN (perspective tab). PIN on standalone Hub. | N/A on perspective tab. Uses own auth on standalone. |
| Dad / Additional Adult | Full view via perspective tab (if mom grants Hub access — default: granted) and standalone Hub. No edit mode. | No configuration access. | View, tally (own avatar), suggest intentions. | Trigger with PIN on standalone Hub. Trigger without PIN from perspective tab (if mom grants `family_celebration` permission per PRD-11B). | Tap own name → PIN → personal shell modal. |
| Special Adult | View Hub on standalone device during active shift only. No perspective tab. | No configuration access. | View only. Cannot tally (not a household member in the permanent sense). | Cannot trigger. | N/A — Special Adults access assigned children's features during shift, not through the Hub member access flow. |
| Independent (Teen) | Full view via perspective tab and standalone Hub. No edit mode. | No configuration access. | View, tally (own avatar), suggest intentions. | Cannot trigger. | Tap own name → PIN → personal shell modal. |
| Guided | View Hub on standalone device. No perspective tab (Guided shell has no perspective switcher). | No configuration access. | View, tally (own avatar, if mom configured no PIN requirement). | Cannot trigger. | Tap own name → PIN/visual password/none → personal shell modal. |
| Play | View Hub on standalone device. No perspective tab (Play shell has no perspective switcher). | No configuration access. | View, tally (own avatar, if mom configured no PIN requirement). | Cannot trigger. | Tap own name → auth method per PRD-01 → personal shell modal. |

### Shell Behavior

- **Hub content is shell-independent.** The Hub renders identically regardless of which shell the viewer came from. There are no shell-specific rendering differences on the Hub surface itself.
- **Perspective tab access:** Mom, Dad/Adult, and Independent Teen shells gain a "Hub" tab in their dashboard perspective area. Guided and Play shells do NOT have a perspective switcher — those members access the Hub only from the standalone `/hub` route on a shared device.
- **PRD-14 update:** The perspective switcher, previously mom-only, is extended. Mom sees all four tabs (My Dashboard, Family Overview, Hub, View As). Dad/Adult sees two tabs (My Dashboard, Hub) — plus View As if mom grants it. Independent Teen sees two tabs (My Dashboard, Hub). Family Overview remains mom-only (or dad with explicit permission per PRD-14C).

> **Decision rationale:** Extending the perspective switcher to non-mom members is a significant change from PRD-14's original design (which was mom-only). The rationale: the Hub is a shared family surface, not a management tool. Every family member should be able to peek at the bulletin board from their phone. Family Overview remains restricted because it's a monitoring tool with per-kid data comparison.

### Privacy & Transparency

- **Hub visibility is family-wide by design.** Content on the Hub is visible to anyone who can see the Hub (all family members on shared devices, authenticated members via perspective tab).
- **Teen victory visibility on Hub:** Mom-configurable. Default: included. App provides guided recommendation explaining the privacy tradeoff (siblings see the count).
- **Calendar event privacy:** Per-event `show_on_hub` flag plus category-level defaults. Events hidden from Hub are still visible on the member's personal calendar and in Family Overview.
- **Family Best Intentions iterations are not private.** Tapping your avatar to log a tally is visible to anyone looking at the Hub. This is intentional — the Hub is a shared accountability surface.
- **Personal shell modal from Hub:** When a member opens their personal shell via the Hub's member access, their personal data is shown in the modal. Other family members cannot see into this modal (it's authenticated per-member). When the modal closes, the Hub returns — no personal data leaks to the Hub surface.

---

## Data Schema

### Table: `family_hub_configs`

One row per family. Stores all Hub configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families. UNIQUE — one config per family. |
| hub_title | TEXT | NULL | NULL | Custom Hub title. NULL = "[Family Name] Hub" default. |
| theme_override | TEXT | NULL | NULL | Theme ID override for Hub. NULL = family default theme. |
| section_order | TEXT[] | See default | NOT NULL | Ordered array of section keys. |
| section_visibility | JSONB | '{}' | NOT NULL | Map of section_key → boolean. Missing keys default to true. |
| victory_settings | JSONB | '{}' | NOT NULL | `{ show_count: true, include_teens: true, celebrate_pin_required: true }` |
| slideshow_config | JSONB | '{}' | NOT NULL | `{ enabled: true, photo_duration_seconds: 60, word_art_duration_seconds: 300, text_duration_seconds: 600, guiding_stars_feed: true, rotation_order: 'sequential', frozen_slide_id: null }` |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Default `section_order`:** `['family_calendar', 'family_vision', 'family_best_intentions', 'victories_summary', 'countdowns', 'widget_grid', 'member_access']`

**RLS Policy:**
- All family members can SELECT (needed to render the Hub)
- Only `primary_parent` can INSERT/UPDATE/DELETE

**Indexes:**
- `family_id` (UNIQUE)

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON family_hub_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Table: `family_best_intentions`

Family-level intentions that the whole family works on together.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by_member_id | UUID | | NOT NULL | FK → family_members. Who created this intention (always mom for MVP, but schema supports any member for future suggestion-approve flow). |
| title | TEXT | | NOT NULL | The intention statement. "Remain Calm" |
| description | TEXT | | NULL | Optional one-line context. "We choose calm words, even when we're frustrated." |
| participating_member_ids | UUID[] | | NOT NULL | FK[] → family_members. Which members participate in this intention's tally. |
| require_pin_to_tally | BOOLEAN | false | NOT NULL | If true, tapping an avatar requires that member's PIN before logging. |
| is_active | BOOLEAN | true | NOT NULL | Active = shows on Hub. Inactive = hidden from Hub, iterations still preserved. |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Standard context toggle. PRD-05 Addendum pattern. |
| sort_order | INTEGER | 0 | NOT NULL | Display order on the Hub. |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete. Non-null = archived. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- All family members can SELECT active, non-archived intentions
- Only `primary_parent` can INSERT/UPDATE/DELETE

**Indexes:**
- `family_id, is_active, archived_at` (active family intentions)
- `family_id, is_included_in_ai, archived_at` (context assembly query)

### Table: `family_intention_iterations`

Individual tally entries for family intentions. One row per tap.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| intention_id | UUID | | NOT NULL | FK → family_best_intentions |
| member_id | UUID | | NOT NULL | FK → family_members. Who tapped. |
| day_date | DATE | CURRENT_DATE | NOT NULL | For daily aggregation. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | Exact timestamp of the tap. |

**RLS Policy:**
- All family members can SELECT (needed to render tallies on Hub)
- All family members can INSERT their own rows (where `member_id` = auth user's member ID). If `require_pin_to_tally` is true on the intention, the PIN check happens in the application layer before the insert.
- Only `primary_parent` can DELETE (to correct accidental taps)

**Indexes:**
- `intention_id, day_date` (daily tally aggregation)
- `intention_id, member_id, day_date` (per-member daily tally)

### Table: `countdowns`

Countdown events displayed on the Hub and optionally pushed to member dashboards.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by_member_id | UUID | | NOT NULL | FK → family_members (always mom for now) |
| title | TEXT | | NOT NULL | "Beach Vacation" |
| emoji | TEXT | | NULL | Optional emoji for visual flair. "🏖" |
| target_date | DATE | | NOT NULL | The date being counted down to. |
| scope | TEXT | 'hub_only' | NOT NULL | Enum: 'hub_only', 'whole_family', 'specific_members' |
| assigned_member_ids | UUID[] | | NULL | FK[] → family_members. Only used when scope = 'specific_members'. |
| show_on_target_day | BOOLEAN | true | NOT NULL | If true, show "Today is the day!" on the target date. |
| is_active | BOOLEAN | true | NOT NULL | Auto-set to false after target date passes (or day after, if show_on_target_day = true). |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- All family members can SELECT active countdowns
- Only `primary_parent` can INSERT/UPDATE/DELETE

**Indexes:**
- `family_id, is_active, target_date` (active countdowns sorted by date)

### Table: `slideshow_slides`

Individual slides in the Hub slideshow frame.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| slide_type | TEXT | | NOT NULL | Enum: 'image_photo', 'image_word_art', 'text', 'guiding_star_auto'. Photo/art and word art have separate timers. 'guiding_star_auto' slides are auto-generated. |
| image_url | TEXT | | NULL | Storage URL for uploaded images. Required when slide_type = 'image_photo' or 'image_word_art'. |
| text_body | TEXT | | NULL | Body text for typed text slides. Required when slide_type = 'text'. System renders matching Hub theme. |
| source_guiding_star_id | UUID | | NULL | FK → guiding_stars. For auto-generated Guiding Star slides. |
| sort_order | INTEGER | 0 | NOT NULL | Order in the slideshow. |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- All family members can SELECT (needed to render slideshow)
- Only `primary_parent` can INSERT/UPDATE/DELETE

**Indexes:**
- `family_id, is_active, sort_order` (active slides in order)

### Schema Additions to Existing Tables

**`calendar_events` (PRD-14B) — add column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| show_on_hub | BOOLEAN | true | NOT NULL | If false, event is hidden from the Family Hub calendar. Per-event override for Hub visibility. |

> **Forward note for build:** This column addition requires a migration on the `calendar_events` table defined in PRD-14B. The "Hide from Hub" button in the event creation/edit UI toggles this column.

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-01 (Auth & Family Setup) | `family_members` table provides member list, avatar URLs, auth methods for the member access row. PIN authentication for Hub settings and member shell modal. |
| PRD-04 (Shell Routing) | Hub layout container (`/hub` route), member drawer behavior, always-on mode, "Back to Hub" button pattern. PRD-14D fills this container with content. |
| PRD-06 (Guiding Stars) | Family-level Guiding Stars (`owner_type = 'family'`) feed into the slideshow auto-rotation when enabled. |
| PRD-09A (Tasks) | Opportunity tasks (`task_type LIKE 'opportunity_%'`) provide data for the read-only Job Board widget. |
| PRD-10 (Widgets) | Widget grid mechanics, widget templates, edit mode. Hub uses the same grid system scoped to `dashboard_type = 'family_hub'`. |
| PRD-11 (Victory Recorder) | `victories` table provides aggregated counts for the victories summary section. |
| PRD-11B (Family Celebration) | Family Celebration generation flow launched from the Hub's Celebrate button. |
| PRD-12B (Family Vision Quest) | `family_vision_statements` table provides the active Family Vision Statement for display. |
| PRD-14 (Personal Dashboard) | Perspective switcher architecture. PRD-14D extends it to non-mom shells. |
| PRD-14B (Calendar) | Calendar component with `memberIds` prop. `calendar_events` table with new `show_on_hub` column. |
| PRD-14C (Family Overview) | `MemberPillSelector` shared component (not used on Hub, but established pattern). |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| PRD-05 (LiLa context) | Active family Best Intentions loaded as family context for LiLa (where `is_included_in_ai = true`). |
| PRD-10 (Widgets) | Countdown widgets pushed to member dashboards when scope = 'whole_family' or 'specific_members'. Uses standard widget deployment mechanism. |
| PRD-14E (TV Mode) | Hub content, section architecture, slideshow overlay, and route structure (`/hub/tv`) provide the foundation for TV-specific rendering. PRD-14E defines CSS overrides, D-pad navigation, ambient auto-cycle, and hub lock mode. |

---

## AI Integration

### Context Loading

When a family member is in any LiLa conversation, active family Best Intentions are loaded as part of the family context (alongside Family Vision Statement, family Guiding Stars, etc.). This follows the standard PRD-05 context assembly pattern.

**Context payload for family Best Intentions:**
```
Family Best Intentions (active):
- "Remain Calm" — Family tally today: 7 (Mom: 2, Dad: 1, Jake: 3, Emma: 1)
- "Sincerity Instead of Sarcasm" — Family tally today: 4
```

LiLa can reference family intentions in coaching conversations: "I noticed your family is working on 'Remain Calm' — how did that go for you today?"

### No Guided Mode

The Family Hub itself does not introduce a new LiLa guided mode. The Hub is a display and interaction surface, not a conversational feature.

> **Forward note:** A future "Family Check-In" guided mode could use the Hub's data (intention tallies, victory counts, countdowns) as context for a LiLa-facilitated family conversation — but that's a separate PRD.

---

## Edge Cases

### No Family Best Intentions Created
- Section shows a warm empty state: "No family intentions yet. Create one in Hub Settings!" (visible to mom only). For other members: section is hidden entirely.

### No Family Vision Statement
- Vision section is hidden automatically (not an empty state). Hub renders without it — no visual gap.

### No Victories Recorded Today
- Victories section shows: "No victories recorded yet today — there's still time!" with the Celebrate button still visible (disabled if no victories exist to celebrate).

### No Countdowns Active
- Countdowns section is hidden automatically.

### Large Families (9+ Members)
- Family Best Intentions avatar row scrolls horizontally when there are more members than fit in the width.
- Member Quick Access row scrolls horizontally with dot indicators.
- Calendar handles many color-coded events gracefully (same as PRD-14B).

### Hub Not Configured (First Use)
- Hub auto-deploys with default section order, all sections visible, and a warm onboarding message: "Welcome to your Family Hub! This is your family's shared space. Tap the ⚙ gear to customize what appears here."
- Onboarding message dismisses on first settings visit (tracked in `family_hub_configs`).

### Concurrent Access
- Multiple family members can view the Hub simultaneously (on their own devices via perspective tab, or walking up to the shared tablet while someone is already viewing).
- Tally taps on Family Best Intentions are optimistic — the count updates immediately, syncs in background. Concurrent taps by different members on different devices resolve cleanly (each is a separate row insert).
- If two people tap the same member's avatar simultaneously, two rows are inserted. This is acceptable — mom can delete accidental duplicates.

### Perspective Tab on Non-Mom Shells
- The perspective switcher on Dad/Adult and Independent Teen shells shows only two tabs: "My Dashboard" and "Hub." The "Family Overview" and "View As" tabs are NOT shown (those remain mom-only or permission-gated per PRD-14C/PRD-02).
- If dad has Family Overview permission, he sees three tabs: "My Dashboard", "Hub", "Family Overview."

### Slideshow with No Content
- If no slides have been added and Guiding Stars auto-feed is off, the slideshow frame widget shows a placeholder: "Add photos or quotes in Hub Settings to start your slideshow."
- If only Guiding Stars auto-feed is enabled and no family Guiding Stars exist, same placeholder.

---

## Tier Gating

> **Tier rationale:** The Hub is a core family coordination feature. Basic Hub functionality (calendar, member access, manual sections) should be available at Enhanced tier (which unlocks connected family features per PRD-01). Family Best Intentions and slideshow may be gated to higher tiers due to their interactive and media-heavy nature.

| Feature Key | Description | Intended Tier (TBD) |
|-------------|-------------|---------------------|
| `family_hub` | Core Hub display — calendar, countdowns, victory summary, member access, widget grid | Enhanced (connected family tier) |
| `family_hub_best_intentions` | Family Best Intentions creation, display, and tally tracking | TBD — likely Enhanced or FullMagic |
| `family_hub_slideshow` | Slideshow frame widget — image/text upload, Guiding Stars feed, overlay mode | TBD — likely FullMagic (media storage costs) |
| `family_hub_tv_route` | `/hub/tv` route for TV rendering (PRD-14E defines this, key registered here) | TBD — likely FullMagic |

All feature keys return `true` during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| `/hub/tv` route (registered, shows "TV Mode coming soon" placeholder) | TV-specific rendering, D-pad navigation, ambient mode, hub lock mode | PRD-14E (Family Hub TV Mode) |
| Menu widget — simple text card with forward note for structured meal plan integration | Meal plan data, recipe links, grocery list connection | Future Meal Planning PRD |
| Slideshow AI Vault integration (curated image/quote packs) | AI Vault content library | Future AI Vault PRD |
| Family Check-In guided mode (Hub data as LiLa context for family conversation) | LiLa guided mode registry | Future Family Rhythms or Check-In PRD |
| Countdown → Calendar event auto-link (countdown created from calendar event) | PRD-14B calendar event metadata | Enhancement — can be wired at build time if straightforward |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Perspective switcher: Family Hub (stub, shows placeholder) | PRD-04, PRD-14 | Fully wired. Hub tab renders the Family Hub content. Extended to Dad/Adult and Independent Teen shells. |
| Hub widget grid (layout + drag-drop, stub widget cards) | PRD-04 | Fully wired. Widget grid renders family-scoped widgets with real data. |
| Family Best Intentions (family-as-identity concept deferred from PRD-14C) | PRD-14C Decision #12 | Fully defined. New `family_best_intentions` table with per-member tally interaction. |
| Family Vision Quest display on dashboard family (deferred from PRD-14C) | PRD-14C Decision #13 | Family Vision Statement section on the Hub reads `family_vision_statements` WHERE `is_active = true`. |
| Family Celebration launch point (deferred from PRD-14C) | PRD-14C Decision #14 | Celebrate button on Hub's victories section, PIN-protected on standalone Hub. |
| PIN-protected trigger on Family Hub (noted in PRD-11B) | PRD-11B | Celebrate button requires parent PIN on standalone Hub. No PIN on perspective tab (user already authenticated). |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `family_hub_configs` table created with RLS policies
- [ ] `family_best_intentions` table created with RLS policies
- [ ] `family_intention_iterations` table created with RLS policies
- [ ] `countdowns` table created with RLS policies
- [ ] `slideshow_slides` table created with RLS policies
- [ ] `calendar_events.show_on_hub` column added (migration on PRD-14B table)
- [ ] Hub renders on standalone `/hub` route with all seven sections
- [ ] Hub renders as perspective tab in Mom, Dad/Adult, and Independent Teen shells
- [ ] Perspective switcher extended to Dad/Adult and Independent shells (My Dashboard + Hub tabs)
- [ ] Family calendar section shows all-family events filtered by `show_on_hub`
- [ ] Family Vision Statement displays when active record exists, hidden when not
- [ ] Family Best Intentions display with per-member avatar tally interaction
- [ ] PIN-per-intention tally gating works correctly
- [ ] Family Best Intentions auto-deploy as widgets to assigned members' personal dashboards
- [ ] Tally logged from personal dashboard aggregates to Hub display correctly
- [ ] Victory summary shows aggregated count, expandable to per-member breakdown
- [ ] Celebrate button launches Family Celebration (PRD-11B), PIN-protected on standalone Hub
- [ ] Countdown cards display with correct day calculation, auto-hide after target date
- [ ] Countdown push to member dashboards works for 'whole_family' and 'specific_members' scopes
- [ ] Widget grid renders family-scoped widgets (Menu text card, Job Board read-only, shared trackers)
- [ ] Job Board widget is read-only — no claim action from Hub
- [ ] Member Quick Access row with PIN auth → personal shell modal → "Back to Hub" close
- [ ] Hub Settings page with all configuration groups functional
- [ ] Section reordering and visibility toggles work and persist
- [ ] Hub auto-deploys with default configuration on first access
- [ ] RLS: all family members can read Hub data; only primary_parent can configure
- [ ] Mom's teen victory visibility setting applies correctly to Hub count

### MVP When Dependency Is Ready
- [ ] Slideshow frame overlay with image upload and text slides (requires media storage setup)
- [ ] Guiding Stars auto-feed in slideshow (requires PRD-06 build with `owner_type = 'family'` data)
- [ ] Calendar `show_on_hub` filtering (requires PRD-14B build with `calendar_events` table)
- [ ] Family Vision Statement section (requires PRD-12B build with `family_vision_statements` table)

### Post-MVP
- [ ] `/hub/tv` route with TV-optimized rendering (PRD-14E)
- [ ] Hub lock mode — TV gated behind task completion (PRD-14E)
- [ ] Ambient auto-cycle mode for TV display (PRD-14E)
- [ ] Meal plan structured widget (replaces Menu text card)
- [ ] Slideshow AI Vault integration (curated content packs)
- [ ] Family Check-In guided mode using Hub data as LiLa context
- [ ] Countdown auto-creation from calendar events with specific tags
- [ ] Push notification when new family intention is created ("Your family has a new intention!")
- [ ] Past Family Celebration summaries displayed as a "recent celebrations" card

---

## CLAUDE.md Additions from This PRD

- [ ] Family Hub is a single, family-scoped surface with one aesthetic that mom configures. No shell-specific rendering differences on the Hub itself. Hub content renders identically regardless of viewing context.
- [ ] Hub is accessible via three paths: perspective switcher tab (all adult/teen shells), standalone `/hub` route (shared tablet), `/hub/tv` route (TV — PRD-14E stub).
- [ ] Perspective switcher is NO LONGER mom-only. Mom: My Dashboard, Family Overview, Hub, View As. Dad/Adult: My Dashboard, Hub (+ Family Overview if permitted). Independent Teen: My Dashboard, Hub. Guided/Play: no perspective switcher.
- [ ] `family_hub_configs` table: one row per family. Stores Hub title, theme override, section order, section visibility, victory settings, calendar category Hub defaults, slideshow config.
- [ ] `family_best_intentions` table: family-level intentions with per-member tally. NOT the same as `best_intentions` (which are personal, PRD-06). `require_pin_to_tally` is per-intention. Mom creates via Hub Settings; no in-app suggestion queue for MVP.
- [ ] Family Best Intentions auto-deploy as widgets to assigned members' personal dashboards. Tally can be logged from Hub OR personal dashboard — all feed the same `family_intention_iterations` table. Hub shows aggregate; personal dashboard shows "You: X · Family: Y."
- [ ] `family_intention_iterations`: one row per tally tap. Optimistic insert, daily aggregation via `day_date`.
- [ ] Hub sections are NOT collapsible (unlike Personal Dashboard sections). Mom hides sections via settings — they don't collapse mid-view.
- [ ] Hub calendar always shows all family members. No `MemberPillSelector`. Events filtered by `show_on_hub` boolean on `calendar_events` (default true, per-event "Hide from Hub" toggle).
- [ ] `calendar_events.show_on_hub` BOOLEAN default true — per-event Hub visibility. Simple "Hide from Hub" button in event creation/edit UI. No category-level defaults for MVP.
- [ ] Countdowns are assignable: hub_only, whole_family (pushes widget to all dashboards + Hub), specific_members (pushes to selected dashboards + Hub).
- [ ] Slideshow frame is a Hub widget that opens a near-full-screen overlay. Content: uploaded photos/art (fast timer), uploaded word art (medium timer), typed text rendered in Hub theme (slow timer), Guiding Stars auto-feed (slow timer). Per-content-type duration settings.
- [ ] Convention: standalone Hub (`/hub`) shows member access section. Perspective tab view hides it (user already authenticated). Use rendering context to toggle.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `family_hub_configs`, `family_best_intentions`, `family_intention_iterations`, `countdowns`, `slideshow_slides`
Tables modified: `calendar_events` (added `show_on_hub` BOOLEAN)
Enums updated: `dashboard_type` TEXT CHECK — add `'family_hub'` value (for Hub's `dashboard_configs` widget grid record)
Triggers added: `set_updated_at` on `family_hub_configs`, `family_best_intentions`, `countdowns`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Hub accessible via perspective tab for ALL adult/teen members, not just mom** | The Hub is a shared family surface. Every family member should be able to peek at the bulletin board from their phone. Family Overview remains restricted (it's a monitoring tool). |
| 2 | **Standalone routes: `/hub` (auto-responsive phone→tablet) and `/hub/tv` (TV mode, PRD-14E)** | Different devices need different rendering. The route determines the context — no manual display mode toggle needed. |
| 3 | **New `family_best_intentions` table, not extending `best_intentions`** | Family intentions have a different interaction model (per-member trackable with aggregate display, PIN-configurable tally, suggestion-approve flow). Separate table keeps RLS clean and avoids overloading the personal intentions schema. |
| 4 | **Family Best Intentions: per-member trackable from Hub AND personal dashboards, family-aggregate on Hub** | "Remain Calm" is a family goal, but each member taps to log their own practice from wherever they are — Hub, personal dashboard, any device. The Hub shows combined tallies. Individual accountability feeding a communal display. |
| 5 | **PIN requirement per intention, mom-configurable** | Some families want accountability ("prove it was you"), others want frictionless positive reinforcement. Mom knows her family's dynamic. |
| 6 | **Mom creates family intentions; family input through natural channels (conversation, meetings, messaging)** | Family intentions are mom's to curate. Input comes from family life, not from an in-app suggestion queue. A formal suggestion flow is a natural post-MVP addition. |
| 7 | **Victory summary count on Hub, not individual details** | Respects PRD-11B's "no sibling comparisons" principle. Summary tally is celebratory; individual details are for the evening Family Celebration narrative. |
| 8 | **Teen victory visibility on Hub: mom-configurable with guided recommendation** | App explains the tradeoff (siblings see the count). Mom makes the informed call. Default: included. |
| 9 | **Job Board widget: read-only on Hub** | Preserves PIN-per-action security model. Prevents one kid from claiming under another kid's name without authentication. |
| 10 | **Calendar: always all-family, no `MemberPillSelector`** | The Hub is the kitchen wall calendar. You don't filter names off a kitchen calendar. |
| 11 | **Calendar event Hub visibility: simple per-event "Hide from Hub" toggle, default visible** | Per-event toggle handles "Jake's birthday surprise." Events default to visible. Simple, direct, no category-level complexity for MVP. |
| 12 | **Countdowns as assignable widgets: hub-only, whole family, or specific members** | Mirror's opportunity assignment philosophy — mom creates centrally, distribution is configurable. "Beach Vacation" goes everywhere. "Jake's Science Fair" goes to Jake + Hub. |
| 13 | **Slideshow frame widget defined in PRD-14D (not deferred to PRD-14E)** | Tablet slideshow is a real, valuable use case now — not just a TV feature. PRD-14E extends with TV-specific rendering. |
| 14 | **Slideshow content: uploaded images + manual text slides + Guiding Stars auto-feed** | Rich content mix. Images for art and photos. Text for quotes/scriptures. Guiding Stars auto-feed connects the slideshow to the family's values system. |
| 15 | **Per-content-type slideshow duration (images ~1 min, text ~10 min)** | Text needs time to be read and absorbed. Images rotate faster. Mom configures both. |
| 16 | **Menu widget: simple text card for MVP, forward note for meal plan PRD** | Not every family needs a structured meal planner on the Hub. A simple "Tonight: Taco Tuesday!" card is immediately useful. Structured meal plan is a substantial feature deserving its own PRD. |
| 17 | **Dedicated `family_hub_configs` table, not extending `families.hub_config` JSONB** | Hub has substantial configuration (section order, visibility, victory settings, calendar defaults, slideshow config). A dedicated table is cleaner, mirrors PRD-14C pattern, and supports proper RLS. |
| 18 | **Hub sections are NOT collapsible** | Unlike the Personal Dashboard, the Hub is a glanceable display. If mom doesn't want a section, she hides it from settings — no collapse/expand state management on the shared surface. |
| 19 | **Perspective switcher composition per role: Mom (4 tabs), Dad (2-3 tabs), Teen (2 tabs)** | Family Overview is a monitoring tool (restricted). Hub is a shared surface (open). View As is an admin tool (restricted). Each role sees only what's appropriate. |
| 20 | **Family Best Intentions auto-deploy as widgets to assigned members' personal dashboards** | Members shouldn't have to walk to the kitchen tablet to participate in family goals. The Hub is the scoreboard; personal dashboards are where you contribute from wherever you are. |
| 21 | **Slideshow has three timer tiers: photos/art (fast ~1min), word art images (medium ~5min), typed text/Guiding Stars (slow ~10min)** | Photos rotate quickly for visual variety. Word art lingers because it needs to be read. Typed text and Guiding Stars linger longest for reflection and absorption. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | TV-specific rendering, D-pad navigation, ambient mode, hub lock mode | PRD-14E (Family Hub TV Mode) |
| 2 | Structured meal plan widget | Future Meal Planning PRD |
| 3 | Slideshow AI Vault integration (curated content packs) | AI Vault PRD |
| 4 | Family Check-In LiLa guided mode | Future Family Rhythms PRD |
| 5 | Push notifications for new family intentions | Notifications PRD |
| 6 | Countdown auto-creation from tagged calendar events | Enhancement — can be wired at build time |
| 7 | Past Family Celebration summaries on Hub | Post-MVP enhancement after PRD-11B auto-archive |
| 8 | Rate limiting on Family Celebration generation from Hub | Settings / cost management sprint |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-14 (Personal Dashboard) | Perspective switcher extended from mom-only to all adult/teen shells. Mom: 4 tabs. Dad/Adult: 2 tabs (+ Family Overview if permitted). Independent Teen: 2 tabs. Hub tab is no longer a stub. | Update PRD-14 perspective switcher spec to note multi-role access. Update stubs section to mark Hub stub as wired. |
| PRD-14B (Calendar) | `calendar_events` table extended with `show_on_hub` BOOLEAN column (default true). "Hide from Hub" button needed in event creation/edit UI. Hub is a fourth consumer of the calendar component (after PRD-14B page, PRD-14 dashboard, PRD-14C overview). | Update PRD-14B schema to include `show_on_hub` column. Add "Hide from Hub" toggle to event creation/edit UI spec. Note Hub as a calendar component consumer. |
| PRD-14C (Family Overview) | Family Best Intentions (Decision #12) and Family Vision display (Decision #13) and Family Celebration launch (Decision #14) — all resolved in this PRD. | Update PRD-14C deferred items to reference PRD-14D as resolution. |
| PRD-04 (Shell Routing) | Hub content fully specified. `families.hub_config` JSONB usage replaced by dedicated `family_hub_configs` table — PRD-04 noted this as a JSONB on `families`, this PRD creates a proper table. Hub perspective tab access extended beyond mom shell. | Update PRD-04 Hub section to note that Hub content is defined in PRD-14D and configuration lives in `family_hub_configs` table. Note perspective switcher expansion. |
| PRD-06 (Guiding Stars & Best Intentions) | Family-level Guiding Stars (`owner_type = 'family'`) consumed by the Hub slideshow auto-feed. New family Best Intentions concept introduced as a separate table (not extending PRD-06's `best_intentions` table). | Note Hub slideshow as a consumer of family Guiding Stars. Clarify in PRD-06 that personal Best Intentions (`best_intentions` table) and family Best Intentions (`family_best_intentions` table) are distinct features with separate schemas. |
| PRD-11B (Family Celebration) | Hub's Celebrate button confirmed as launch point. PIN protection on standalone Hub confirmed. | Verify PRD-11B's Hub trigger spec is consistent with this PRD's implementation. |
| PRD-12B (Family Vision Quest) | Family Vision Statement displays on Hub when active. Hub is a consumer of `family_vision_statements`. | Note Hub as a display surface for Family Vision Statement in PRD-12B outgoing flows. |
| PRD-02 (Permissions & Access Control) | `family_hub` feature key registered. Hub access for Dad is a new default-granted permission. Perspective switcher role-based composition established. | Add `family_hub` and sub-keys to Feature Key Registry. Note Hub perspective tab access as a default permission. |
| PRD-10 (Widgets) | Hub widget grid uses `dashboard_type = 'family_hub'` on a `dashboard_configs` record. New widget types: Menu (text card), Job Board (read-only), Slideshow Frame, Countdown. **Family Best Intentions auto-deploy as widgets to assigned members' personal dashboard grids** — requires widget auto-deployment mechanism to create widgets on member dashboards when mom creates a family intention. | Register Hub widget types in PRD-10 widget template catalog. Note `'family_hub'` as a `dashboard_type` value. Document auto-deployment pattern for family intention widgets. |
| PRD-09A (Tasks) | Opportunity tasks surfaced on Hub as a read-only Job Board widget. No interaction changes to task system. | Note Hub Job Board as a read-only consumer of opportunity task data. |
| Build Order Source of Truth | PRD-14D completed. Feature keys locked: `family_hub`, `family_hub_best_intentions`, `family_hub_slideshow`, `family_hub_tv_route`. | Update Section 2 to list PRD-14D as completed. Add feature keys to locked registry. |

---

*End of PRD-14D*
