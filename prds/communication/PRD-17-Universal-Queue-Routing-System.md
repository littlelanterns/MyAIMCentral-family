# PRD-17: Universal Queue & Routing System

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates), PRD-14 (Personal Dashboard), PRD-14B (Calendar), PRD-15 (Messages, Requests & Notifications), PRD-16 (Meetings)
**Created:** March 12, 2026
**Last Updated:** March 12, 2026

---

## Overview

PRD-17 is a cross-cutting infrastructure PRD that consolidates and fully specifies the two most interconnected systems in the MyAIM Family platform: the **Universal Queue Modal** (the tabbed processing hub where mom handles all pending items across the platform) and the **Studio Queue & Routing Pipeline** (the complete flow from every entry point through intake, configuration, and deployment).

These systems were partially defined during other PRD sessions. PRD-09A sketched the Task Creation Queue, PRD-09B renamed it to Studio Queue and expanded the schema, PRD-14B established the Universal Queue Modal pattern and the Calendar tab, PRD-15 added the Requests tab and chat shortcut. No single document owned the complete picture. **PRD-17 is now the authoritative reference** for how items flow through the system — from the moment an idea is captured anywhere in the platform to the moment it becomes a deployed task, list item, or other configured record.

The guiding metaphor is a **sorting station.** Things arrive from all over — brain dumps, meetings, LiLa conversations, kid requests, goal breakdowns — and land in one unified inbox. Mom sits down, opens the Review Queue, and makes decisions: this becomes a recurring chore for Jake, that's a grocery list, this meeting action item goes on the calendar, that request gets acknowledged. Every item gets sorted to where it belongs. Nothing falls through the cracks.

> **Mom experience goal:** I open one modal and everything that needs my decision is right there. I process it all in one focused session — calendar approvals, task drafts, kid requests — then I close it and I'm done. No hunting through separate screens. No forgetting about that thing from last night's brain dump.

> **Depends on:** PRD-14B (Calendar) establishes the Universal Queue Modal container pattern. PRD-09A (Tasks) defines the Task Creation Modal (7 collapsible sections). PRD-09B (Lists, Studio & Templates) defines the `studio_queue` table schema. PRD-08 (Journal + Smart Notepad) defines the Send To routing grid and Review & Route extraction. PRD-15 (Messages, Requests & Notifications) defines the Requests tab and notification system. PRD-02 (Permissions) defines role-scoped access.

---

## Schema Reconciliation Note

> **Audit flag:** PRD-09A defines a `task_queue` table with columns `target_member_id`, `title`, `description`, `requested_by`, and `batch_id`. PRD-09B later renamed this to `studio_queue` with different column names: `owner_id`, `content`, `content_details`, `requester_id`, plus added `destination` and `requester_note`. PRD-09A also references `task_queue` throughout its screens, stubs, and CLAUDE.md additions. **PRD-17 defines the authoritative schema below. During the pre-build audit, PRD-09A must be updated to:**
>
> - Replace all references to `task_queue` with `studio_queue`
> - Replace `target_member_id` with `owner_id`
> - Replace `title` with `content`
> - Replace `description` with `content_details` (JSONB)
> - Replace `requested_by` with `requester_id`
> - Add `destination` flag, `requester_note`, and `batch_id` (restored from PRD-09A, dropped in PRD-09B)
> - Replace `tasks_queue` feature key with `studio_queue`
> - Update Screen 2 to reference the Sort tab within the Universal Queue Modal

---

## User Stories

### Processing Pending Items
- As a mom, I want one modal where I can see and process everything waiting for my decision — calendar approvals, task drafts, kid requests — so I don't have to check multiple screens.
- As a mom, I want to process a batch of brain dump items as a group (apply the same settings to all) OR step through them one at a time OR expand them into individual cards, depending on what makes sense for that batch.
- As a mom, I want a warm, inviting indicator when there are items to process — not a scary number that makes me avoid the queue.
- As a mom, I want to dismiss items that seemed like good ideas at 11pm but aren't worth configuring — without guilt and with an optional note about why.

### Routing Items from Anywhere
- As a mom, I want items I capture during brain dumps, meetings, and LiLa conversations to automatically land in my queue for processing later, so I never lose track of action items.
- As any family member, I want a consistent visual grid when routing items to destinations — the same grid pattern whether I'm in Notepad, processing a meeting, or accepting a request.
- As a mom, I want the routing grid to show only relevant destinations for the current context — all 15 when routing from Notepad, just 4-5 when accepting a kid's request.

### Queue Awareness
- As a mom, I want the Review Queue icon to gently glow when items are waiting, inviting me to process them without creating pressure or anxiety.
- As a mom, I want to see per-tab counts only after I've opened the modal, where the numbers are helpful context rather than stress triggers.
- As a mom, I want a satisfying "All caught up!" moment when I've processed everything.

### Task Configuration
- As a mom, I want a Quick Mode for simple tasks so I can assign "take out the trash Tuesday" to Jake in 5 seconds instead of scrolling through 7 configuration sections.
- As a mom, I want the full Task Creation Modal available when I need it — rewards, recurring schedules, routines with sub-steps — but not forced on me for every little thing.

---

## Screens

### Screen 1: Universal Queue Modal (Container)

> **Mom experience goal:** One place. Everything that needs a decision. Process it all, close the modal, done.

> **Depends on:** Modal container pattern — defined in PRD-14B, Screen 5. Tab registration — established conceptually in PRD-14B, fully specified here.

**What the user sees:**

A large centered modal (desktop) or full-screen modal (mobile) with a gradient header, tabbed navigation, scrollable content area, and a footer with a chat shortcut. The modal title is "Review queue."

```
┌─────────────────────────────────────────────────┐
│  Review queue                                ✕  │
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  │
│  [📅 Calendar (3)] [📝 Sort (5)] [🙋 Requests (2)]│
│  ─────────────────────────────────────────────  │
│                                                  │
│  [Tab content area — scrollable]                │
│                                                  │
│                                                  │
│                                                  │
│  ─────────────────────────────────────────────  │
│  💬 Open messages                   10 items    │
└─────────────────────────────────────────────────┘
```

**Header:** Gradient background using `--gradient-primary`. Modal title "Review queue" in `--color-text-on-dark`. Close button (Lucide `X` icon) with subtle semi-transparent background.

**Tabs:** Three registered tabs with Lucide icons, labels, and badge counts. Active tab has a `--color-btn-primary-bg` underline. Inactive tabs use `--color-text-secondary`. Badge counts use `--color-accent` background with `--color-text-on-dark` text.

**Content area:** Scrollable. Renders the active tab's content component. Minimum height ensures the modal doesn't collapse when switching between tabs with different content lengths.

**Footer:** Left side: chat shortcut (Lucide `MessageCircle` + "Open messages") linking to PRD-15 Messages page. Right side: total item count across all tabs in `--color-text-secondary`.

> **Decision rationale:** Lucide icons only — no emoji in the actual build. Emoji is used in PRD wireframes for quick communication but the build uses Lucide for visual consistency and theme compatibility.

**Tab registration contract:**

Each feature that has a queue registers a tab with the following configuration:

| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Unique identifier (e.g., 'calendar', 'sort', 'requests') |
| `label` | string | Display label (e.g., 'Calendar', 'Sort', 'Requests') |
| `icon` | LucideIcon | Lucide icon component (e.g., `Calendar`, `ArrowDownUp`, `HandHelping`) |
| `badgeQuery` | function | Returns pending count for this tab (async, Supabase query) |
| `component` | React component | The content component rendered when this tab is active |
| `requiredRole` | string[] | Array of roles that can see this tab (e.g., ['primary_parent', 'additional_adult']) |
| `order` | number | Display order (lower = further left) |

**Currently registered tabs:**

| Order | Key | Label | Icon | Required Roles |
|-------|-----|-------|------|---------------|
| 1 | `calendar` | Calendar | Lucide `Calendar` | primary_parent, additional_adult (if permitted) |
| 2 | `sort` | Sort | Lucide `ArrowDownUp` | primary_parent, additional_adult (if permitted) |
| 3 | `requests` | Requests | Lucide `HandHelping` | primary_parent, additional_adult, independent |

> **Forward note:** Future features register additional tabs by adding entries to the tab registry. The modal container renders whatever tabs are registered — no code changes to the container itself.

**Entry points (where you open this modal from):**
- **QuickTasks strip "Review Queue" button** — opens to Sort tab by default (see default tab logic below)
- **Calendar page queue badge** — opens to Calendar tab
- **Tasks page queue badge** — opens to Sort tab
- **Dashboard pending items indicator** — opens to Sort tab
- **Any future feature's queue badge** — opens to that feature's tab

**Default tab logic when opening from QuickTasks strip or Dashboard:**
1. Open to Sort tab (default — this is where the bulk of decisions happen)
2. If Sort tab is empty, open to the first tab that has items (checking Calendar, then Requests)
3. If all tabs are empty, open to Sort tab showing the "All caught up!" empty state
4. If the user was previously in the modal during this session and closed it, reopen to the last tab they were viewing

> **Decision rationale:** Sort as default because it's where the highest volume of items land (brain dumps, meeting action items, LiLa suggestions, goal decompositions). Calendar and Requests are lower-volume, higher-urgency — but Sort is where mom spends the most time in "processing mode."

**Modal behavior:**
- Modal stays open as user switches between tabs — no close/reopen on tab switch
- Processing an item (approve, configure, dismiss) removes it from the tab with a brief fade-out animation
- Badge counts update in real-time as items are processed
- Tabs are always visible regardless of count — empty tabs show their empty state when selected
- Modal is dismissible via close button, Escape key, or clicking the overlay backdrop

**Data created/updated:**
- No data is created by the modal container itself — each tab's content component handles its own data operations

---

### Screen 2: Calendar Tab (within Universal Queue Modal)

> **Depends on:** Calendar event approval flow — defined in PRD-14B, Screen 5. Calendar event schema — defined in PRD-14B.

**What the user sees:**

All `calendar_events` where `status = 'pending_approval'` and the current user has approval authority (mom/primary parent).

Each card shows:
- Event title (with Lucide `Calendar` icon)
- Date, time, and location
- Who submitted it (child avatar + name, linked via `created_by`)
- Transportation needs ("Needs ride (Mom)" or "No ride needed")
- Source indicator if from image/Route ("From: flyer image" or "From: Review & Route")

**Actions per card:**
- **[Approve]** — Sage teal background. Changes `calendar_events.status` to `approved`, sets `approved_by` and `approved_at`. Event renders at full color on all relevant calendars. Creator receives notification.
- **[Edit & Approve]** — Soft gold background. Opens the event in the Detailed Add form (PRD-14B Screen 3). Mom edits details, saves as approved.
- **[Reject ▾]** — Light blush background. Dropdown with optional rejection note text field. Changes status to `rejected`. Creator receives notification with the note.

**Bulk action:**
- **[Approve all (N)]** — Gradient button using `--gradient-primary` at the bottom. Bulk approves all pending calendar events. All creators receive notifications.

**Empty state:**
- Lucide `CalendarCheck` icon (24px, `--color-btn-primary-bg`)
- "No events waiting for approval."
- Subtitle: "When your kids add events, they'll appear here for your review."

**Data updated:**
- `calendar_events.status` for each processed event
- `calendar_events.approved_by` and `calendar_events.approved_at` on approval
- `notifications` records created for approval/rejection outcomes (PRD-15)
- Processing an event auto-dismisses the corresponding notification from the notification tray, with a `processed` status retained in notification history

---

### Screen 3: Sort Tab (within Universal Queue Modal)

> **Mom experience goal:** This is my decision inbox. Everything that arrived from brain dumps, meetings, LiLa, kid requests, and goals lands here. I decide what each thing becomes and where it goes.

> **Depends on:** `studio_queue` table — authoritative schema defined in this PRD. Task Creation Modal — defined in PRD-09A, Screen 3. List creation flow — defined in PRD-09B.

**What the user sees:**

All `studio_queue` records where `processed_at IS NULL` and `dismissed_at IS NULL`, scoped by the permission model (mom sees all family items, other members see only their own `owner_id` items).

Each card shows:
- **Destination badge** — color-coded pill indicating what type of item this is:
  - `task` — Sage teal badge with Lucide `CheckSquare` icon + "Task"
  - `list` — Golden honey badge with Lucide `List` icon + "List"
  - `widget` — Dusty rose badge with Lucide `LayoutGrid` icon + "Widget"
  - `tracker` — Cool sage badge with Lucide `BarChart3` icon + "Tracker"
- **Source indicator** — muted text showing where this item came from:
  - "From: Notepad (single)" / "From: Notepad (individual)" / "From: Notepad (sequential)"
  - "From: Review & Route"
  - "From: Couple meeting (Mar 10)" / "From: Family council (Mar 8)"
  - "From: LiLa conversation"
  - "Request from: Jake" (with child avatar)
  - "From: Goal breakdown"
  - "Promoted from: To-Do List"
  - "From: Project planner"
- **Content** — the item title/content text
- **Requester note** (if `source = 'member_request'`) — italicized, showing the child's message
- **Batch indicator** (if `batch_id` is set and batch has multiple items) — `--color-bg-card` pill showing "xN grouped" with Lucide `Layers` icon

**Actions per individual card:**

For `destination = 'task'`:
- **[Configure]** — Opens the Task Creation Modal (PRD-09A Screen 3) pre-populated with content from this queue item. On save, sets `studio_queue.processed_at` and links `source_reference_id`.
- **[Dismiss]** — Sets `dismissed_at` with optional dismiss note. For `member_request` items, sends decline notification to requester.

For `destination = 'list'`:
- **[Add to list]** — Opens the list picker overlay (PRD-09B). User selects an existing list or creates a new one. Items are added to the chosen list. Sets `studio_queue.processed_at`.
- **[Dismiss]** — Same as above.

For `destination = 'widget'` or `destination = 'tracker'`:
- **[Configure]** — Opens the appropriate creation flow (PRD-10 widget creation or tracker setup). Sets `studio_queue.processed_at`.
- **[Dismiss]** — Same as above.

For `source = 'member_request'`:
- **[Configure]** — Same as task configure, but card displays requester avatar and note.
- **[Decline ▾]** — Dropdown with optional note text field. Sets `dismissed_at` and `dismiss_note`. Sends decline notification back to requester (PRD-15).

**Actions for grouped/batch cards (items sharing a `batch_id`):**

When multiple items share a `batch_id`, they display as a single grouped card:

```
┌───────────────────────────────────────────┐
│ [Task] [x3 grouped]  From: Brain dump     │
│                                           │
│ 3 items from evening brain dump           │
│ Return library books · Call insurance ·   │
│ Order birthday cake                       │
│                                           │
│ [Send as group] [Process all] [Expand]    │
│ [Dismiss]                                 │
└───────────────────────────────────────────┘
```

- **[Send as group]** — Applies the same configuration to all items in the batch at once. Opens the Task Creation Modal with batch mode active — assignment, schedule, rewards, and other settings apply to every item in the group. Useful when a batch of related items all need the same treatment (e.g., 5 grocery items all going to the same list, or 3 chores all assigned to the same kid with the same schedule).
- **[Process all]** — Steps through each item one at a time in the Task Creation Modal. Sequential flow: configure item 1, save, item 2 auto-loads, save, item 3 auto-loads, done. Progress indicator shows "2 of 3."
- **[Expand]** — Breaks the grouped card into individual cards in the Sort tab. Each item becomes its own card with its own [Configure] and [Dismiss] buttons. The `batch_id` remains on each record for traceability but they render independently.
- **[Dismiss]** — Dismisses the entire batch with optional note.

> **Decision rationale:** Three batch processing modes serve different real scenarios. "Send as group" handles the common case of related items needing identical treatment. "Process all" handles mixed batches where each item needs different configuration. "Expand" gives full control when you want to dismiss some and configure others differently.

**Where items go from the Sort tab — every possible outcome:**

| You tap... | It becomes... | It lives on... |
|---|---|---|
| Configure, save as task | Deployed task | Assignee's dashboard |
| Configure, save as routine | Deployed routine | Assignee's dashboard (recurring) |
| Configure, save as opportunity | Opportunity listing | Opportunity board / assignee's dashboard |
| Configure, save as sequential | Sequential collection | Assignee's dashboard (drip-fed) |
| Configure, save as habit | Tracked habit | Assignee's dashboard |
| Add to list | List item(s) | The chosen list on the Lists page |
| Send as group to a list | Entire batch as list items | The chosen list on the Lists page |
| Dismiss | Nothing — removed | Queue history only |
| Decline (request) | Declined request | Requester gets notification |

**Sort tab ordering:**
- Member request items (`source = 'member_request'`) appear first — a kid is waiting for an answer
- Meeting action items (`source = 'meeting_action'`) appear second — time-relevant from recent meetings
- All other items ordered by `created_at` descending (newest first)
- Grouped/batch items use the earliest `created_at` in the batch for ordering

**Empty state:**
- Lucide `Inbox` icon (24px, `--color-btn-primary-bg`)
- "Nothing to sort right now."
- Subtitle: "Items from brain dumps, meetings, LiLa, and requests will appear here when they arrive."

**Data updated:**
- `studio_queue.processed_at` when an item is configured and saved
- `studio_queue.dismissed_at` and `studio_queue.dismiss_note` when an item is dismissed
- Related records created in destination tables (tasks, list_items, widgets, trackers) on configure
- `notifications` records created for member request declines (PRD-15)
- Processing an item auto-dismisses the corresponding notification from the notification tray, with a `processed` status retained in notification history

---

### Screen 4: Requests Tab (within Universal Queue Modal)

> **Depends on:** Requests system — defined in PRD-15, Screen 8. `family_requests` table — defined in PRD-15.

**What the user sees:**

All `family_requests` where `status = 'pending'` and `recipient_member_id` = current user's member ID.

Each card shows:
- Request content (the question or ask)
- Who sent it (child avatar + name)
- Context/timing info
- Requester's note (italicized)

**Actions per card:**
- **[Accept ▾]** — Opens the RoutingStrip grid (see Screen 6) with context-appropriate destinations: Calendar, Tasks, List, Acknowledge. Each routing option creates the appropriate record and sends an acceptance notification to the requester with routing details.
- **[Decline ▾]** — Dropdown with optional decline note and a "Discuss" option that creates a conversation thread (PRD-15).
- **[Snooze]** — Pushes the request down the list. Reappears after a configured interval (default: 4 hours, configurable).

**Empty state:**
- Lucide `HandHelping` icon (24px, `--color-btn-primary-bg`)
- "No requests waiting."
- Subtitle: "When your family sends you requests, they'll appear here."

**Data updated:**
- `family_requests.status` on accept/decline
- Routing destination records created on accept (calendar events, studio_queue items, list items, or just a notification for acknowledge)
- `notifications` records for acceptance/decline outcomes (PRD-15)
- Processing a request auto-dismisses the corresponding notification from the notification tray

> **Forward note:** The Requests tab content component is defined in PRD-15. PRD-17 specifies how it registers as a tab in the Universal Queue Modal and the integration contract. The full request card layout, decline dropdown, and snooze behavior are in PRD-15 Screen 8.

---

### Screen 5: "All Caught Up!" Global Empty State

**What the user sees when all tabs have zero pending items:**

Instead of showing an empty tab, the modal displays a centered celebration state:

```
┌─────────────────────────────────────────────────┐
│  Review queue                                ✕  │
│  [Calendar (0)] [Sort (0)] [Requests (0)]       │
│  ─────────────────────────────────────────────  │
│                                                  │
│                    ✨                            │
│           All caught up!                         │
│                                                  │
│    Nothing needs your attention right now.       │
│    Go enjoy your people.                         │
│                                                  │
│                                                  │
│  ─────────────────────────────────────────────  │
│  💬 Open messages                               │
└─────────────────────────────────────────────────┘
```

- Lucide `Sparkles` icon (32px, `--color-secondary`) centered above the message
- "All caught up!" in heading font (The Seasons, serif) at 18px, `--color-text-heading`
- Subtitle in body font, `--color-text-secondary`
- Tabs still visible with (0) badges — user can click into any tab to see its per-tab empty state
- The message copy "Go enjoy your people." is intentionally warm and permission-giving — it acknowledges that clearing a queue of family items is an accomplishment

> **Decision rationale:** Both per-tab empty states AND a global celebration state. Per-tab empties provide context ("no events waiting" vs "nothing to sort"). The global state triggers only when every tab is clear — a rare and satisfying moment for a mom of nine that deserves acknowledgment.

---

### Screen 6: RoutingStrip (Universal Routing Grid Component)

> **Mom experience goal:** Whether I'm routing from Notepad, accepting a request, or processing a meeting action item, the routing experience looks and works the same — a visual grid of destinations I can tap.

**What the user sees:**

A grid of destination tiles, each with a Lucide icon and a short label. The grid is the same visual component everywhere it appears, but filtered to show only the destinations relevant to the current context.

**Grid layout:**
- 3 columns for 5+ destinations, 4 columns for exactly 4 destinations
- Each tile: `--color-bg-secondary` background, `--vibe-radius-input` corner radius, centered Lucide icon (20px) above label text (11px)
- Tap a tile to route the item to that destination (specific behavior depends on destination)
- Active/selected tile: `--color-btn-primary-bg` background with `--color-text-on-dark` icon and text

**Full destination catalog (all possible tiles):**

| Destination | Lucide Icon | Label | What Happens on Tap |
|-------------|-------------|-------|-------------------|
| Calendar | `Calendar` | Calendar | Opens Quick Add (PRD-14B) pre-filled with content |
| Tasks | `CheckSquare` | Tasks | Deposits into `studio_queue` with `destination = 'task'` |
| List | `List` | List | Opens list picker overlay (PRD-09B) |
| Journal | `BookOpen` | Journal | Creates `journal_entries` record with `entry_type` based on content |
| Guiding Stars | `Star` | Guiding Stars | Opens Guiding Star creation (PRD-06) pre-filled |
| Best Intentions | `Heart` | Best Intentions | Opens Best Intention creation (PRD-06) pre-filled |
| Victory | `Trophy` | Victory | Creates victory record in Victory Recorder (PRD-11) |
| Track | `BarChart3` | Track | Logs data point to matching tracker (PRD-10) |
| Message | `MessageCircle` | Message | Opens message composer (PRD-15) with content |
| Agenda | `ListChecks` | Agenda | Opens inline meeting picker, adds to meeting agenda (PRD-16) |
| InnerWorkings | `Brain` | InnerWorkings | Opens category picker, creates self-knowledge entry (PRD-07) |
| Optimizer | `Wand2` | Optimizer | Sends content to LiLa Optimizer workspace (PRD-05C) |
| Note | `StickyNote` | Note | Saves as `journal_entries` with `entry_type = 'quick_note'` |
| Acknowledge | `ThumbsUp` | Acknowledge | Marks as accepted with no routing — notification only |
| Skip | `SkipForward` | Skip | Skips item with no action (meeting context only) |

**Context-filtered destination sets:**

| Context | Destinations Shown | Grid Columns |
|---------|-------------------|-------------|
| Notepad "Send To" (PRD-08) | Calendar, Tasks, List, Journal, Guiding Stars, Best Intentions, Victory, Track, Message, Agenda, InnerWorkings, Optimizer, Note | 3 |
| Request accept routing (PRD-15) | Calendar, Tasks, List, Acknowledge | 4 |
| Meeting action item routing (PRD-16) | Tasks, Best Intentions, Calendar, List, Skip | 3 |
| Review & Route per-card routing (PRD-08) | Calendar, Tasks, List, Journal, Guiding Stars, Best Intentions, Victory, Track, Message, Note | 3 |

> **Decision rationale:** One universal RoutingStrip component with context-dependent filtering rather than separate routing UIs per feature. This ensures visual consistency ("I always know what the routing grid looks like"), reduces build complexity (one component, not four), and makes adding new destinations a config change rather than a code change in multiple places.

**Sub-destination drill-down:**

Some destinations have sub-types. When the user taps a destination that has sub-options, the tile expands inline (or a second row of smaller tiles appears beneath it) showing the sub-type picker. The user taps the sub-type to complete the routing.

| Destination | Sub-types | Picker Behavior |
|-------------|-----------|----------------|
| Journal | Quick Note, Reflection, Commonplace, Gratitude | Tile expands to show sub-type grid |
| Tasks | Single, Individual, AI Sort, Sequential (structure flags) | Tile expands to show structure picker |
| List | Existing lists + "New list" option | Tile opens list picker overlay |
| Track | Active trackers by name | Tile opens tracker picker overlay |
| Agenda | Upcoming meetings by name | Tile opens inline meeting picker |
| InnerWorkings | Personality, Strengths, Growth Areas, Preferences | Tile expands to show category grid |

Destinations without sub-types (Calendar, Guiding Stars, Best Intentions, Victory, Message, Optimizer, Note, Acknowledge, Skip) route immediately on tap.

> **Decision rationale:** Inline expansion rather than dropdown menus for sub-destinations. Keeps the visual pattern consistent (always a grid, never a dropdown) and avoids jarring mode switches mid-routing.

**Routing confirmation:**
- On successful routing, a brief toast appears: "[Lucide icon] Sent to [Destination]" with `--color-success` accent
- Toast includes an undo action for 5 seconds: "Undo" link that reverses the routing
- In Notepad context, the tab closes with undo toast and moves to history tagged "Routed to: [Destination]" (per PRD-08)

---

### Screen 7: Quick Mode (Task Creation Modal Enhancement)

> **Mom experience goal:** "Take out trash, Jake, Tuesdays" — that's all I need for this one. Don't make me scroll through 7 sections.

> **Depends on:** Task Creation Modal — defined in PRD-09A, Screen 3. This screen adds Quick Mode as a toggle enhancement.

**What the user sees:**

When the Task Creation Modal opens, a toggle at the top switches between Quick Mode and Full Mode. Quick Mode is the default when opening from the Sort tab for simple items.

**Quick Mode layout:**
```
┌─────────────────────────────────────────────┐
│  New task                    [Quick | Full]  │
│  ─────────────────────────────────────────  │
│                                              │
│  Task name: [________________________]      │
│                                              │
│  Assign to: [Jake ▾]  [Whole family]        │
│                                              │
│  When: [One-time ▾]  Date: [Mar 15 ▾]      │
│        [Recurring ▾] Days: [Tu Th ▾]       │
│                                              │
│  [Save]                    [Full mode →]     │
└─────────────────────────────────────────────┘
```

**Quick Mode fields:**
- **Task name** (required) — single text input, pre-populated from `studio_queue.content`
- **Assign to** — family member dropdown (multi-select) + "Whole family" option. Defaults to the queue item's `owner_id` if it was from a member request.
- **When** — toggle between one-time (date picker) and recurring (day-of-week selector). Defaults to one-time with no date.
- **[Save]** — Creates the task with defaults for all other settings: Fresh Reset incomplete action, no rewards, no template save, no duration estimate, no image, auto-suggested life area tag
- **[Full mode →]** — Expands to the full 7-section Task Creation Modal (PRD-09A Screen 3) with any Quick Mode entries preserved

**Full Mode** is the standard 7-section collapsible form from PRD-09A. The toggle simply remembers the user's preference per session.

**When Quick Mode activates automatically:**
- Opening from Sort tab for a single-item queue entry with `destination = 'task'`
- Opening from QuickTasks "Add Task" button

**When Full Mode activates automatically:**
- Opening from Sort tab for a batch/grouped queue entry (batch processing needs full config per item)
- Opening from Sort tab for a `source = 'meeting_action'` item (meeting action items often need more configuration)
- Opening from Studio template deployment
- When the user has toggled to Full Mode in this session (persists until session ends)

> **Decision rationale:** Quick Mode exists because a mom of nine creates dozens of simple tasks that need nothing more than a name, an assignee, and a day. The full 7-section modal is valuable for complex configuration but overkill for "Jake — trash — Tuesdays." Quick Mode defaults for Sort tab items; Full Mode defaults for contexts that typically need richer configuration.

---

### Screen 8: Source-Adaptive Pre-Population (Task Creation Modal Behavior)

> **Depends on:** Task Creation Modal sections — defined in PRD-09A, Screen 3.

When the Task Creation Modal opens from a Studio Queue item, it pre-populates fields based on the item's `source` and `content_details`. This table defines exactly which fields are pre-filled from which source.

**Source-adaptive behavior table:**

| Source | Task Name | Description | Assignment | Schedule | Other Pre-fills | Source Display |
|--------|-----------|-------------|------------|----------|----------------|---------------|
| Manual (+ Create) | Empty | Empty | Empty | Empty | None — blank form | None |
| `notepad_routed` (single) | `content` | Full notepad content in `content_details` | `owner_id` | Empty | Life area tag: LiLa auto-suggest from content | "From: Notepad" |
| `notepad_routed` (individual) | Per-parsed item from `content_details.items[]` | Empty | `owner_id` | Empty | Life area tag: LiLa auto-suggest | "From: Notepad" |
| `notepad_routed` (sequential) | Collection title from `content` | Empty | `owner_id` | Empty | Task type auto-set to Sequential | "From: Notepad (sequential)" |
| `notepad_routed` (ai_sort) | Per LiLa-suggested item | Per LiLa suggestion | `owner_id` | LiLa-suggested if applicable | LiLa may suggest task type, life area | "From: Notepad (AI sorted)" |
| `review_route` | Extracted title from `content_details.extracted_title` | Extracted details from `content_details` | `owner_id` | Empty | Source link back to original content via `source_reference_id` | "From: Review & Route" |
| `meeting_action` | Action item text from `content` | Empty | `owner_id` (may differ from mom) | Empty | `source_reference_id` = meeting ID | "From: [Meeting Type] — [Date]" |
| `lila_conversation` | Conversation-derived title from `content` | Empty | `owner_id` | Empty | `source_reference_id` = conversation ID | "From: LiLa conversation" |
| `member_request` | Request content from `content` | `requester_note` populates description | `requester_id` as default assignee | Empty | Requester avatar and name shown | "Request from: [Name]" |
| `goal_decomposition` | Goal step title from `content` | Goal context in `content_details` | `owner_id` | Empty | Links back to parent goal | "From: Goal breakdown" |
| `project_planner` | Milestone/task title from `content` | Project context in `content_details` | `owner_id` | Suggested timeline if in `content_details` | Links back to project | "From: Project planner" |
| `list_promoted` | List item text from `content` | Empty | `owner_id` | Empty | Original stays on list with "promoted" badge | "Promoted from: [List Name]" |
| Studio template | All fields from template | All fields from template | From template or empty | From template | Full pre-fill — user adjusts | "From: Studio template" |
| QuickTasks "Add Task" | Empty | Empty | Empty | Empty | None — same as manual | None |

**Source display line:** Shown as muted text below the modal title. Tappable when `source_reference_id` is set — navigates to the originating record (meeting, conversation, goal, list, etc.).

**Queue-to-modal handoff contract:**
When the user taps [Configure] on a Sort tab item, the following data passes to the Task Creation Modal:
- `queue_item_id` — the `studio_queue.id` being processed
- `content` — pre-fills task name
- `content_details` — JSONB with source-specific structured data
- `source` — determines source display line and any source-specific behavior
- `source_reference_id` — links back to originating record
- `owner_id` — pre-fills assignment
- `requester_id` + `requester_note` — for member request items
- `structure_flag` — determines task type for Notepad items (sequential = Sequential type)
- `batch_id` + `batch_mode` — if processing as a batch, includes mode (group/sequential)

On save, the modal:
1. Creates the appropriate destination record (task, list item, etc.)
2. Sets `studio_queue.processed_at = now()` on the queue item
3. Returns to the Sort tab (or advances to the next batch item if in sequential processing mode)
4. Auto-dismisses any related notification in the notification tray

---

## Presence Indicator (Universal Breathing Glow Convention)

> **Mom experience goal:** I see a gentle warm glow on my Review Queue button and I think "oh, some things landed — I'll process those after lunch." Not "oh god, 47 things are screaming at me."

PRD-17 establishes the **breathing glow** as a platform-wide convention for indicating that something has pending items or notifications. This is not specific to the Queue Modal — any feature with pending attention can use the same pattern.

**The breathing glow animation:**
- The Lucide icon gains a soft glowing, breathing pulse animation
- Glow color: `--color-btn-primary-bg` at approximately 30% opacity
- Animation: CSS `@keyframes` with a gentle inhale/exhale rhythm (approximately 3 second cycle). Scale: subtle 1.0 to 1.05 to 1.0. Opacity of glow: 0.15 to 0.30 to 0.15.
- The glow says "things are here when you're ready" — warm and inviting, not urgent or anxiety-inducing

**Where the breathing glow applies:**
- **QuickTasks strip "Review Queue" button** (Lucide `Inbox`) — when any Queue Modal tab has pending items
- **QuickTasks strip feature buttons** — any QuickTasks button whose feature has pending items or unprocessed notifications can use the same glow
- **Notification bell** (Lucide `Bell`) in the shell header — when unread notifications exist
- **Sidebar navigation items** — any sidebar page with pending items (e.g., Tasks page when Studio Queue has items, Calendar when events are pending approval)
- **Any future feature** that has a "things waiting for you" state

**When the glow is active (pending items exist):**
- Gentle breathing pulse animation as described above
- No number, no dot, no badge — just the warm glow

**When there's nothing pending:**
- Icon renders normally with no animation — static, at rest
- Absence of glow IS the signal that nothing needs attention

**User preference: Discreet (default) vs Numeric**

Users can choose their preferred indicator style in Settings:

| Setting | Behavior | Default |
|---------|----------|---------|
| **Discreet** (default) | Breathing glow animation, no numbers visible until opening the feature | Yes |
| **Numeric** | Standard numeric badge on icons showing pending count | No |

The preference applies globally to all presence indicators across the platform — QuickTasks buttons, notification bell, sidebar items. It's a single toggle, not per-feature.

> **Decision rationale:** Numeric badges on navigation elements create anxiety, especially for a large family where the number is often high. A breathing glow transforms pending items from "work I'm behind on" into "a warm place that has things ready for me when I have a moment." But some users prefer concrete numbers — the option is there for them. Defaulting to discreet aligns with the maximalist-options-with-minimalist-defaults principle.

**Per-tab numeric counts always appear INSIDE the Queue Modal** regardless of the user's indicator preference — on the tab badges. Once you've opened the modal, the numbers are helpful context rather than external pressure.

> **Forward note:** This convention should be added to PRD-03 (Design System & Themes) as a reusable animation token, and to PRD-04 (Shell Routing & Layouts) as a QuickTasks strip behavior pattern. The user preference toggle belongs in the Settings PRD.

---

## Visibility & Permissions

| Role | Queue Modal Access | Sort Tab | Calendar Tab | Requests Tab | Notes |
|------|-------------------|----------|--------------|-------------|-------|
| Mom / Primary Parent | Full access to all tabs | Sees all family queue items (all `owner_id` values) | Sees all pending events for approval | Sees all requests addressed to her | Mom is the primary queue processor |
| Dad / Additional Adult | Permission-gated | Sees own `owner_id` items only. If mom grants task management permission for specific kids, sees those kids' items too. | Sees pending events only if mom grants calendar approval permission | Sees requests addressed to him | Access controlled via PRD-02 `member_permissions` |
| Special Adult | No access | No access | No access | No access | Special Adults don't process queues — they execute tasks during shifts |
| Independent (Teen) | Requests tab only | No access | No access | Sees requests addressed to them (from other members or parents) | Teens can receive and respond to requests but don't manage the family queue |
| Guided | No access | No access | No access | No access | |
| Play | No access | No access | No access | No access | |

### Shell Behavior

| Shell | Queue Modal | Review Queue Button | RoutingStrip |
|-------|-------------|-------------------|-------------|
| Mom | Full modal, all tabs, gradient header, chat shortcut | QuickTasks strip with breathing glow indicator | Full destination grid (all 15 destinations) |
| Dad / Additional Adult | Permission-gated tabs, same visual treatment | QuickTasks strip, glow only if permitted tabs have items | Filtered grid based on permissions |
| Independent (Teen) | Requests tab only in a simplified modal | No Review Queue button — requests accessible from Messages page | Reduced grid (Journal, Note, Message, Victory) |
| Guided | No access | Not present | Not present |
| Play | No access | Not present | Not present |

> **Decision rationale:** The queue is fundamentally a decision-making and management surface. Mom makes the bulk of family decisions. Dad participates when mom grants permission. Teens see requests addressed to them but don't manage family-wide queues. This matches the mom-first architecture principle.

### Privacy & Transparency

- Teen transparency: teens can see that a queue system exists (they see the Requests tab) but cannot see Sort or Calendar tabs. They know mom processes requests — no hidden mechanics.
- Dad visibility: dad sees his own queue items and, if permitted, items for kids he manages. He never sees mom's personal queue items.
- The RoutingStrip destinations are filtered by the current user's permissions — a teen routing from their Notepad won't see destinations they don't have access to.

---

## Data Schema

### Table: `studio_queue` (Authoritative Definition)

The universal intake funnel. Receives draft items from Notepad, LiLa, Review & Route, Goals, Meeting action items, Requests, and other sources. Each item has a `destination` flag indicating whether it's headed for Tasks, Lists, Widgets, or Trackers.

> **This is the authoritative schema.** PRD-09A's `task_queue` and PRD-09B's `studio_queue` are superseded by this definition. See Schema Reconciliation Note at the top of this PRD.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_id | UUID | | NOT NULL | FK → family_members. Whose queue this item belongs to. Determines visibility. |
| destination | TEXT | 'task' | NOT NULL | CHECK: 'task', 'list', 'widget', 'tracker'. Determines which creation flow processes this item. |
| content | TEXT | | NOT NULL | The raw content/title of the draft item |
| content_details | JSONB | '{}' | NOT NULL | Structured data from source: parsed items, extracted fields, structure metadata. Shape varies by source. |
| source | TEXT | | NOT NULL | CHECK: 'notepad_routed', 'review_route', 'lila_conversation', 'meeting_action', 'goal_decomposition', 'project_planner', 'member_request', 'list_promoted' |
| source_reference_id | UUID | | NULL | FK to the originating record (conversation, meeting, goal, list_item, etc.) for traceability |
| structure_flag | TEXT | | NULL | From PRD-08: 'single', 'individual', 'ai_sort', 'sequential', 'chronological'. Only set by Notepad routing. |
| batch_id | UUID | | NULL | Groups items that arrived together from the same source action. NULL for individually-routed items. |
| requester_id | UUID | | NULL | FK → family_members. For `member_request` source — who sent the request. |
| requester_note | TEXT | | NULL | Optional message from the requester explaining their request |
| processed_at | TIMESTAMPTZ | | NULL | When this item was configured and promoted to its destination. NULL = still in queue. |
| dismissed_at | TIMESTAMPTZ | | NULL | When this item was dismissed without processing. |
| dismiss_note | TEXT | | NULL | Optional note when declining/dismissing (sent to requester for member_request items) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- Mom (primary_parent) reads all family queue items (any `owner_id` within the family)
- Dad/Additional Adult reads items where `owner_id` = self, PLUS items for kids they have task management permission for (via `member_permissions` in PRD-02)
- Independent teens read items where `owner_id` = self (only items deposited into their own queue)
- Requesters (`requester_id`) can read the status of their requests (processed/dismissed) but not the full queue view
- Write access: only the `owner_id` member or mom can update `processed_at`, `dismissed_at`, `dismiss_note`

**Indexes:**
- `(family_id, owner_id, processed_at, dismissed_at)` — pending items for a member (the primary query for Sort tab)
- `(family_id, source)` — filter by source
- `(family_id, destination)` — filter by destination type
- `(batch_id)` — grouped items lookup
- `(source, source_reference_id)` — traceability lookups

> **Decision rationale:** One universal queue with a `destination` flag rather than separate queues per feature type. This keeps the Sort tab unified (one stream showing all pending items) while allowing each item to route to the right creation flow when processed. `batch_id` is restored from PRD-09A (dropped in PRD-09B) because it enables the grouped card UX pattern with Send as Group / Process All / Expand options.

### Enum/Type Updates

No new database enums. `destination` and `source` use TEXT with CHECK constraints rather than database enums, following the established pattern from PRD-09B.

Add to existing source CHECK values (if not already present): `'project_planner'`, `'list_promoted'`.

---

## Flows

### Incoming Flows (How Data Gets INTO the Queue System)

| Source | Entry Point | Destination | How It Works |
|--------|------------|-------------|-------------|
| Smart Notepad (PRD-08) | "Send to → Tasks" | `studio_queue` (destination = 'task') | User writes in Notepad, taps Send To grid → Tasks, selects structure (Single/Individual/AI Sort/Sequential). Content deposited with `source = 'notepad_routed'` and chosen `structure_flag`. |
| Smart Notepad (PRD-08) | "Send to → List" | `studio_queue` (destination = 'list') | Same flow but taps Lists. Deposited with `source = 'notepad_routed'`, `destination = 'list'`. |
| Review & Route (PRD-08) | Per-card routing | `studio_queue` (varies) | LiLa extracts items from content, user routes each card via RoutingStrip. Each routed-to-Tasks card deposited with `source = 'review_route'`. |
| Meeting action items (PRD-16) | Post-meeting review | `studio_queue` (destination = 'task') | After meeting, LiLa compiles action items. User routes each to Tasks/Calendar/List/Best Intentions via RoutingStrip. Task items deposited with `source = 'meeting_action'`, `source_reference_id = meeting.id`. |
| LiLa conversation (PRD-05) | In-conversation suggestion | `studio_queue` (destination = 'task') | LiLa detects an actionable item, offers to add it. User confirms. Deposited with `source = 'lila_conversation'`, `source_reference_id = conversation_id`. |
| Request accepted (PRD-15) | Accept → "Add to Tasks" | `studio_queue` (destination = 'task') | Family member sends request, recipient accepts and taps Tasks on RoutingStrip. Deposited with `source = 'member_request'`, `requester_id` and `requester_note` set. |
| Goal decomposition (future) | "Break into steps" | `studio_queue` (destination = 'task') | Goal broken into actionable steps. Each step deposited with `source = 'goal_decomposition'`. |
| List item promotion (PRD-09B) | [→ Tasks] on list item | `studio_queue` (destination = 'task') | User taps promote on a list item. Deposited with `source = 'list_promoted'`, `source_reference_id = list_item.id`. |
| Project planner (future) | Milestone decomposition | `studio_queue` (destination = 'task') | Project milestones decomposed into tasks. Each deposited with `source = 'project_planner'`. |

### Non-Queue Routing (Items That DON'T Go Through studio_queue)

Not everything routes through the Studio Queue. These destinations receive items directly from the RoutingStrip without a queue intermediary:

| Destination | From RoutingStrip | What Happens |
|-------------|------------------|-------------|
| Calendar | Notepad, Meeting, Request accept | Opens Calendar Quick Add pre-filled. Creates `calendar_events` record directly. |
| Journal | Notepad, Review & Route | Creates `journal_entries` record directly. No queue needed. |
| Guiding Stars | Notepad, Review & Route | Opens Guiding Star creation. Creates record directly. |
| Best Intentions | Notepad, Meeting | Opens Best Intention creation. Creates record directly. |
| Victory | Notepad, Review & Route | Creates victory record directly. |
| Message | Notepad | Opens message composer. Sends directly. |
| InnerWorkings | Notepad | Opens category picker, creates self-knowledge entry directly. |
| Optimizer | Notepad | Sends content to Optimizer workspace directly. |
| Note | Notepad | Creates `journal_entries` with `entry_type = 'quick_note'` directly. |
| Acknowledge | Request accept | Marks request as accepted. Notification only — no record creation. |

> **Decision rationale:** Only items that need multi-step configuration go through the Studio Queue (tasks, lists, widgets, trackers). Items with simple destinations (journal entries, victories, messages) route directly — adding a queue step would be unnecessary friction.

### Outgoing Flows (How Data Gets OUT of the Queue System)

| Destination | Triggered By | What's Created |
|-------------|-------------|---------------|
| Tasks (PRD-09A) | [Configure] → save in Task Creation Modal | `tasks` record + `task_assignments` records |
| Routines (PRD-09A) | [Configure] → set type to Routine → save | `task_templates` record with routine sections |
| Opportunities (PRD-09A) | [Configure] → set type to Opportunity → save | `tasks` record with opportunity sub-type |
| Sequential (PRD-09A) | [Configure] for sequential structure_flag | `tasks` record with sequential collection |
| Lists (PRD-09B) | [Add to list] → select list → save | `list_items` records added to chosen list |
| Widgets (PRD-10) | [Configure] → widget creation flow | `widgets` record |
| Trackers (PRD-10) | [Configure] → tracker setup flow | Tracker record |
| Dismissed | [Dismiss] | `studio_queue.dismissed_at` set. For member requests, decline notification sent. |

---

## AI Integration

### LiLa's Role in the Queue System

LiLa interacts with the queue system at multiple points but does not have a dedicated guided mode for queue processing.

**Content analysis for routing suggestions:** When items arrive in the Sort tab, LiLa can analyze the content and suggest a destination. For example, "Choose sincerity over sarcasm" from a meeting might get a subtle suggestion: "This sounds like a Best Intention, not a task." The suggestion appears as a muted hint on the queue card, not as an automatic re-routing.

**Task Breaker AI in the Task Creation Modal:** When configuring a task, the [Break It Down] button in Section 1 (PRD-09A) invokes LiLa to decompose a complex task into sub-steps. This works from both Quick Mode and Full Mode.

**Auto-suggest life area tags:** When a queue item is opened in the Task Creation Modal, LiLa analyzes the content and pre-suggests a life area tag. User can override.

**Smart batch detection:** When LiLa parses items during Review & Route or Notepad "Individual" structure, it groups related items under the same `batch_id` so they arrive in Sort as a cohesive group.

> **Forward note:** Future AI enhancements could include: LiLa auto-routing (suggesting destinations without user intervention), priority sorting (surfacing time-sensitive items), and smart defaults (pre-filling Task Creation Modal fields based on patterns in previously configured items). These are post-MVP.

---

## Edge Cases

### Large Batch Handling
- **Scenario:** User does a massive brain dump in Notepad, LiLa parses it into 20+ individual items, all deposited in Sort.
- **Handling:** Items arrive grouped by `batch_id`. The grouped card shows "20 items from brain dump." Send as Group, Process All, and Expand all work at any batch size. Process All shows progress indicator "3 of 20" to prevent overwhelm. If expanded, items render as individual cards in the Sort tab.

### Conflicting Queue Items
- **Scenario:** A kid submits a calendar event AND sends a request about the same activity.
- **Handling:** Both appear in their respective tabs (Calendar and Requests). Processing one does NOT auto-process the other — they're independent records. Mom may approve the event and acknowledge the request separately. The platform does not attempt to merge or deduplicate across tabs.

### Queue Item from Deleted Source
- **Scenario:** A queue item has `source_reference_id` pointing to a meeting or conversation that was subsequently deleted.
- **Handling:** The queue item remains valid. The "From: [source]" link becomes non-navigable (shows source label but tap does nothing). The item can still be configured or dismissed normally.

### Concurrent Processing (Two Parents)
- **Scenario:** Mom and Dad both have the Queue Modal open and Dad processes an item that Mom also sees.
- **Handling:** Real-time subscription on `studio_queue` updates. When Dad processes an item, it fades out of Mom's Sort tab with a brief "Processed by [Dad]" indicator. Badge counts update in real-time.

### Empty Queue on Open
- **Scenario:** Mom opens the Queue Modal from QuickTasks but the breathing glow was from items that were just processed.
- **Handling:** Modal opens to the "All caught up!" global empty state. The breathing glow stops on next render cycle. Not an error — just a race condition that resolves gracefully.

### Queue Item Expiration
- **Queue items persist indefinitely until configured or dismissed.** No auto-expiration, no auto-cleanup. If a brain dump from six months ago is still sitting in the queue, that's fine — mom can dismiss it when she gets to it. The Sort tab ordering (newest first, with requests and meeting items prioritized) naturally pushes old items down.

> **Decision rationale:** No expiration because losing a queue item feels worse than having a cluttered queue. Mom can always bulk-dismiss old items. An "Archive old items" action (dismiss all items older than X) is a post-MVP convenience.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `studio_queue` | Studio Queue intake and Sort tab processing | Essential |
| `queue_modal` | Universal Queue Modal with all tabs | Essential |
| `queue_quick_mode` | Quick Mode toggle on Task Creation Modal | Essential |
| `routing_strip` | RoutingStrip universal routing grid | Essential |
| `queue_batch_processing` | Batch grouping with Send as Group / Process All / Expand | Enhanced |
| `queue_lila_suggestions` | LiLa destination suggestions on queue items | Enhanced |

> **Tier rationale:** The core queue and routing system is Essential because every mom needs to process items that arrive from brain dumps and manual creation — this is foundational workflow. Batch processing and LiLa suggestions are Enhanced because they serve families with higher volume (more members generating more items) and benefit from AI intelligence. All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Widget creation flow from Sort tab (`destination = 'widget'`) | Widget creation modal/flow | PRD-10 (Widgets, Trackers & Dashboard Layout) |
| Tracker creation flow from Sort tab (`destination = 'tracker'`) | Tracker setup flow | PRD-10 (Widgets, Trackers & Dashboard Layout) |
| Goal decomposition → `studio_queue` deposit | Goal breakdown depositing steps into queue | LifeLantern / Goals PRD |
| Project planner → `studio_queue` deposit | Project milestone decomposition into queue | Project Planner PRD |
| LiLa destination suggestion hints on queue cards | AI analyzing queue item content to suggest routing | PRD-05 enhancement / post-MVP |
| RoutingStrip destinations: Track, Agenda, InnerWorkings, Optimizer | Full wiring to feature creation flows | Respective feature PRDs |
| Queue Modal: future tab registration | Additional features registering tabs | Future PRDs as applicable |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Task Creation Queue stub (routing destination + structure flag) | PRD-08 | `studio_queue` table fully defined. Sort tab processes all queued items. RoutingStrip handles the "Send to → Tasks" flow end-to-end. |
| Universal Queue Modal container pattern | PRD-14B | Fully specified: tab registration, entry points, default tab logic, header/footer, empty states, role scoping. |
| Calendar tab in Queue Modal | PRD-14B | Registered as the first tab. Calendar queue processing flow fully specified. |
| Requests tab in Queue Modal | PRD-15 | Registered as the third tab. Request processing with RoutingStrip integration specified. |
| Tasks tab migration to Queue Modal | PRD-09A | PRD-09A's Screen 2 "Task Creation Queue" is now the Sort tab within the Universal Queue Modal. |
| Chat shortcut button on Queue Modal | PRD-15 | Specified in the modal footer: Lucide `MessageCircle` + "Open messages" linking to Messages page. |
| QuickTasks "Review Queue" entry point | PRD-04, PRD-14B | Fully specified: Lucide `Inbox` icon with breathing glow presence indicator, opens Queue Modal to Sort tab by default. |
| `studio_queue` table (partial definition) | PRD-09B | Authoritative schema now in PRD-17 with `batch_id` restored and column reconciliation complete. |
| Meeting action items → Studio Queue | PRD-16 | Flow fully specified: post-meeting review → RoutingStrip per action item → `studio_queue` deposit. |
| Member request → "Add to Tasks" | PRD-15 | Flow fully specified: Request accept → RoutingStrip → Tasks tile → `studio_queue` deposit. |
| Notepad "Send to" grid | PRD-08 | RoutingStrip defined as the universal component implementing this grid. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Universal Queue Modal renders with tabbed navigation and gradient header
- [ ] Three tabs registered: Calendar, Sort, Requests — each with Lucide icon, label, and badge count
- [ ] Modal opens from QuickTasks strip, Calendar page badge, Tasks page badge, and Dashboard indicator
- [ ] Default tab logic: Sort first, fallback to first tab with items, persist last-viewed within session
- [ ] Breathing glow presence indicator on QuickTasks Review Queue button when any tab has pending items; static when all empty
- [ ] Breathing glow convention available for any feature with pending items (notification bell, sidebar items, other QuickTasks buttons)
- [ ] User preference toggle: discreet (breathing glow, default) vs numeric badge — global setting, applies to all presence indicators
- [ ] Per-tab numeric counts always shown inside the Queue Modal on tab badges regardless of indicator preference
- [ ] All colors reference semantic tokens only — no hardcoded color values anywhere in this feature
- [ ] Sort tab renders all `studio_queue` items with destination badges, source indicators, and content
- [ ] Sort tab ordering: member requests first, meeting actions second, then by created_at descending
- [ ] Calendar tab renders pending approval events with Approve / Edit & Approve / Reject actions
- [ ] Requests tab renders pending requests with Accept (RoutingStrip) / Decline / Snooze
- [ ] [Configure] on task items opens Task Creation Modal pre-populated per source-adaptive table
- [ ] [Add to list] on list items opens list picker overlay
- [ ] [Dismiss] sets `dismissed_at` with optional note; decline notifications sent for member requests
- [ ] Batch grouping: items sharing `batch_id` render as grouped card with Send as Group / Process All / Expand / Dismiss
- [ ] Send as Group applies identical configuration across all batch items
- [ ] Process All steps through batch items sequentially with progress indicator
- [ ] Expand breaks grouped card into individual cards in Sort tab
- [ ] Quick Mode toggle on Task Creation Modal: name + assign + when, saves with defaults
- [ ] Full Mode: standard 7-section collapsible form (PRD-09A Screen 3)
- [ ] Quick Mode auto-activates for simple Sort tab items; Full Mode for batches, meeting actions, templates
- [ ] RoutingStrip grid component renders with context-filtered destinations and Lucide icons
- [ ] Sub-destination drill-down expands inline for Journal, Tasks structure, List picker, Track, Agenda, InnerWorkings
- [ ] Routing confirmation toast with 5-second undo
- [ ] Per-tab empty states with Lucide icon, message, and subtitle
- [ ] Global "All caught up!" empty state when all tabs are clear
- [ ] Processing an item auto-dismisses the corresponding notification, retaining processed status in history
- [ ] `studio_queue` table created with authoritative schema (this PRD), RLS policies, and indexes
- [ ] Role-scoped visibility: Mom sees all family items, Dad sees own + permitted kids, Teens see own requests only
- [ ] `useCanAccess('studio_queue')` and `useCanAccess('queue_modal')` hooks wired (return true during beta)
- [ ] Modal footer: chat shortcut to Messages page
- [ ] All icons are Lucide — no emoji in the build

### MVP When Dependency Is Ready
- [ ] Widget creation flow from Sort tab (requires PRD-10 widget creation)
- [ ] Tracker creation flow from Sort tab (requires PRD-10 tracker setup)
- [ ] Goal decomposition deposits into `studio_queue` (requires LifeLantern / Goals PRD)
- [ ] Project planner deposits into `studio_queue` (requires Project Planner PRD)
- [ ] RoutingStrip → Track destination wired (requires PRD-10 tracker matching)
- [ ] RoutingStrip → Agenda destination wired (requires PRD-16 agenda item creation)
- [ ] LiLa destination suggestion hints on Sort tab cards (requires PRD-05 enhancement)
- [ ] Real-time concurrent processing indicators (requires real-time subscription infrastructure)

### Post-MVP
- [ ] LiLa auto-routing (suggesting destinations without user intervention)
- [ ] Smart defaults (pre-filling Task Creation Modal based on patterns in previously configured items)
- [ ] "Archive old items" bulk action for dismissing items older than a configurable threshold
- [ ] Keyboard shortcuts for queue processing (Enter = Configure, D = Dismiss, arrow keys to navigate)
- [ ] Swipe gestures on mobile (swipe right = configure, swipe left = dismiss)
- [ ] Queue analytics for mom ("You processed 47 items this week" — Victory Recorder integration)
- [ ] Additional Queue Modal tabs for future features (Gamification approvals, etc.)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Universal Queue Modal is the platform-wide processing hub. Three tabs: Calendar, Sort, Requests. Future features register additional tabs. The modal is a shell-level component opened from QuickTasks, feature badges, and Dashboard.
- [ ] Convention: `studio_queue` is the authoritative table name (not `task_queue`). PRD-17 owns the authoritative schema. All references to `task_queue` in PRD-09A must be updated during audit.
- [ ] Convention: `studio_queue.batch_id` groups items that arrived together from the same source action. Grouped items render as a single card in Sort with Send as Group / Process All / Expand options.
- [ ] Convention: RoutingStrip is a universal grid component used everywhere items are routed to destinations. Same visual pattern, different destination filters per context. Defined in PRD-17. Always grid layout, never dropdown. Sub-destinations expand inline.
- [ ] Convention: Task Creation Modal has Quick Mode (name + assign + when) and Full Mode (7 sections from PRD-09A). Quick Mode is default for simple Sort tab items.
- [ ] Convention: Breathing glow is a platform-wide presence indicator convention. Any Lucide icon with pending items uses a gentle breathing pulse animation (`--color-btn-primary-bg` at 30% opacity, ~3s cycle). No numeric badge by default. User can toggle to numeric badges in Settings. Defined in PRD-17, should be added to PRD-03 as a reusable animation token.
- [ ] Convention: Lucide icons only in the build. No emoji. PRD wireframes may use emoji for quick communication but build implementations use Lucide icons exclusively.
- [ ] Convention: No hardcoded color values anywhere. All colors reference semantic tokens from PRD-03 (e.g., `--color-btn-primary-bg`, `--color-bg-secondary`, `--color-text-heading`). Features must be fully theme-dependent.
- [ ] Convention: Processing a queue item auto-dismisses the corresponding notification in the notification tray, with a `processed` status retained in notification history.
- [ ] Convention: Non-queue routing destinations (Journal, Guiding Stars, Best Intentions, Victory, Message, InnerWorkings, Optimizer, Note, Acknowledge) route directly from the RoutingStrip without going through `studio_queue`. Only items needing multi-step configuration (tasks, lists, widgets, trackers) go through the queue.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `studio_queue` (authoritative — supersedes PRD-09A `task_queue` and PRD-09B partial definition)

Columns added vs PRD-09B: `batch_id` (UUID, nullable — restored from PRD-09A)

Columns reconciled from PRD-09A to PRD-17:
- `target_member_id` → `owner_id`
- `title` → `content`
- `description` → `content_details` (JSONB)
- `requested_by` → `requester_id`
- Added: `destination`, `requester_note` (from PRD-09B)
- Restored: `batch_id` (from PRD-09A, dropped in PRD-09B)

Enums updated: None (TEXT with CHECK constraints)

Triggers added: None

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Sort tab name for Studio Queue items** | "Sort" captures the decision-making nature of the tab — mom is sorting items to their proper destinations. Warm, active, not corporate. |
| 2 | **Combined tab for all Studio Queue destinations** | Separate tabs for non-task items would be mostly empty. One stream with destination badges keeps everything in one place for "process everything in one session" workflow. |
| 3 | **Grid layout for all routing contexts (RoutingStrip)** | Grid is more visual and scannable than dropdown. Same component filtered per context. Sub-destinations expand inline to maintain the grid pattern. |
| 4 | **Lucide icons only in build** | Emoji in PRD wireframes for readability; Lucide in actual build for theme compatibility and visual consistency. |
| 5 | **Breathing glow as universal presence indicator with user preference toggle** | Numeric badges create anxiety for large families. Breathing glow is warm and inviting. Established as a platform-wide convention (not just Queue). Users can toggle to numeric badges if they prefer, but default is discreet. Maximalist options, minimalist defaults. |
| 6 | **Quick Mode on Task Creation Modal** | A mom of nine creates dozens of simple tasks that need only name + assign + date. Quick Mode defaults for simple Sort tab items. |
| 7 | **Batch processing: Send as Group + Process All + Expand** | Three modes cover all real scenarios: identical treatment for related items, sequential individual config, and full manual control. |
| 8 | **Default tab: Sort, with smart fallback** | Sort is where highest volume of items land. If empty, opens to first tab with items. Persists last-viewed tab within session. |
| 9 | **Per-tab AND global empty states** | Per-tab gives context. Global "All caught up!" gives satisfaction when everything is clear. |
| 10 | **Notification auto-dismiss on queue processing** | Processing an item fulfills the notification's purpose. Processed status retained in history. |
| 11 | **PRD-17 owns the authoritative studio_queue schema** | PRD-09A and PRD-09B have conflicting definitions. One authoritative source prevents build-time confusion. |
| 12 | **Batch_id column restored** | Dropped in PRD-09B but essential for the grouped card UX pattern. |
| 13 | **Sub-destination drill-down expands inline** | Maintains visual consistency with the grid pattern. No dropdown mode switches. |
| 14 | **Non-queue routing for simple destinations** | Journal, Guiding Stars, etc. route directly — no queue for items that don't need multi-step configuration. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Widget creation flow from Sort tab | PRD-10 |
| 2 | Tracker creation flow from Sort tab | PRD-10 |
| 3 | Goal decomposition → Studio Queue deposit | LifeLantern / Goals PRD |
| 4 | Project planner → Studio Queue deposit | Project Planner PRD |
| 5 | LiLa destination suggestion AI on queue cards | Post-MVP enhancement |
| 6 | Queue analytics / Victory Recorder integration | Post-MVP enhancement |
| 7 | Additional Queue Modal tabs for future features | Registered per-feature as needed |
| 8 | Keyboard shortcuts and swipe gestures | Post-MVP UX enhancement |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-09A (Tasks) | `task_queue` table superseded by `studio_queue`. Screen 2 now lives as Sort tab in Queue Modal. Task Creation Modal gets Quick Mode. | Replace all `task_queue` references. Update Screen 2 to reference Queue Modal. Add Quick Mode to Screen 3. Update `tasks_queue` feature key. |
| PRD-09B (Lists, Studio & Templates) | `studio_queue` schema now authoritative in PRD-17 with `batch_id` restored. | Note PRD-17 as authoritative schema source. |
| PRD-14B (Calendar) | Universal Queue Modal fully specified in PRD-17. | Add "See PRD-17" reference for Queue Modal container spec. |
| PRD-15 (Messages, Requests & Notifications) | Requests tab registration specified. RoutingStrip replaces per-context routing UIs. Notification auto-dismiss specified. | Note PRD-17 as authoritative Queue Modal reference. Update Request accept routing to use RoutingStrip. |
| PRD-08 (Journal + Smart Notepad) | "Send To" grid now implemented as RoutingStrip component. | Note RoutingStrip as the component implementing the Send To grid. |
| PRD-04 (Shell Routing & Layouts) | QuickTasks "Review Queue" button specified with breathing glow indicator. | Update QuickTasks section to reference breathing glow pattern. |
| PRD-03 (Design System & Themes) | Breathing glow established as a universal presence indicator convention. All colors must use semantic tokens — no hardcoded color values. | Add breathing glow animation token to design system. Note presence indicator as a reusable pattern. |
| Settings PRD (future) | User preference: discreet (breathing glow) vs numeric badge indicator. Default: discreet. Global toggle, not per-feature. | Include presence indicator preference in Settings. |
| PRD-16 (Meetings) | Post-meeting action item routing specified using RoutingStrip. | Note RoutingStrip for post-meeting routing. Confirm `source = 'meeting_action'` flow. |
| PRD-05 (LiLa Core AI System) | LiLa's queue-adjacent roles specified. | Note queue-related AI behaviors. |
| PRD-14 (Personal Dashboard) | Dashboard pending items indicator opens Queue Modal. | Update Dashboard to reference Queue Modal. |
| Build Order Source of Truth | PRD-17 completed. | Add PRD-17 to completed PRDs. |

---

*End of PRD-17*
