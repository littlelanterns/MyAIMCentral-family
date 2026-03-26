> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-08: Journal + Smart Notepad

**Status:** Not Started
**Dependencies:** PRD-01, PRD-02, PRD-03, PRD-04, PRD-05, PRD-05C, PRD-06, PRD-07
**Created:** March 4, 2026
**Last Updated:** March 5, 2026

---

## Overview

The Smart Notepad and Journal together form the **universal capture-and-route system** for MyAIM Family. The Smart Notepad is the always-available right-drawer workspace where content is captured, edited, and sent to its permanent home anywhere in the app. The Journal is the organized read view — a container of chronological entries with specialized sub-pages for entry types like Reflections and Commonplace.

The core philosophy: **Capture anything from one place, route it where it needs to go later.** Users should never have to figure out where something belongs before they capture it. The Notepad is the "I have a thought" entry point. Capture first, decide where it goes second.

The Smart Notepad also embodies the **Human-in-the-Mix** principle from the Faith & Ethics Framework: nothing goes from an AI conversation into the permanent record without the user touching it first. AI generates content in LiLa, the user sends it to the Notepad via "Edit in Notepad," reviews and refines it, then routes it to its permanent home via the "Send to..." grid.

> **Mom experience goal:** The Smart Notepad should feel like a trusted companion that's always within reach — a warm, personal workspace where mom can dump her brain, dictate while driving, capture a kid's quote, or refine something LiLa helped her create. It should never feel like a software tool. It should feel like her favorite notebook, except it magically files everything where it belongs.

---

## User Stories

### Capture
- As a mom, I want to jot down a thought instantly from any page so I don't lose it while I'm in the middle of something else.
- As a mom, I want to dictate hands-free while cooking or driving so I can capture things when typing isn't possible.
- As a teen, I want my own notepad space where I can write freely and decide what to do with it later.
- As a dad, I want to quickly capture meeting notes during a work call and route them later.

### Routing
- As a mom, I want to send notepad content to any feature in the app from one menu so I don't have to navigate away and re-type things.
- As a mom, I want the most-used destinations to appear first so my common workflows are fast.
- As a mom, I want to send the same content to multiple places (journal AND a task) without re-writing it.
- As a mom, I want to send a quick note to my husband or teen as an internal family message.

### AI Extraction (Review & Route)
- As a mom, I want to brain-dump everything on my mind and have LiLa sort it into tasks, journal entries, tracker data, and calendar events so I can process the chaos quickly.
- As a mom, I want to review what LiLa extracted before anything gets saved so I stay in control.
- As a mom, I want to voice-capture a recap of the day ("Jake did math, Emma did reading, I drank all my water") and have LiLa match each item to the right tracker.

### Journal
- As a mom, I want a chronological view of everything I've saved so I can look back on my life.
- As a mom, I want to filter my journal by type (gratitude, reflections, kid quips) so I can find specific kinds of entries.
- As a mom, I want to see my children's commonplace book entries so I can track their learning.
- As a teen, I want my journal entries to be private unless I choose to share specific ones.

### Edit in Notepad
- As a mom, I want to send LiLa's output to the Notepad for editing before it gets saved permanently so AI-generated content always has my personal touch.

---

## Screens

> **Depends on:** Right drawer layout — defined in PRD-04, Shell Routing & Layouts. Smart Notepad lives in the right drawer.
> **Depends on:** LiLa drawer — defined in PRD-05, LiLa Core AI System. LiLa lives in the bottom/left drawer, separate from Smart Notepad.
> **Depends on:** PermissionGate component — defined in PRD-02, Permission Architecture.

### Screen 1: Smart Notepad Drawer (Right Drawer)

**What the user sees:**

```
┌─────────────────────────────┐
│  Tab Bar                    │
│  [Tab 1] [Tab 2] [+]       │
│  ─────────────────────────  │
│                             │
│  (Light rich text editor)   │
│  Content area with          │
│  autosave...                │
│                             │
│  🎤  Microphone button      │
│                             │
│  ─────────────────────────  │
│  [Send to...] [Review&Route]│
│  ─────────────────────────  │
│  [<] collapse    [⤢] expand │
└─────────────────────────────┘
```

- **Tab bar** at top: active tabs displayed horizontally. Each tab shows auto-generated name (or user-renamed). Click to switch, double-click to inline rename, X button to close (archives to history). `+` button creates new tab. Warning badge appears at 6 tabs; soft limit at 8 tabs.
- **Content area:** Light rich text editor (bold, italic, bullet lists). Autosaves continuously to database with 500ms debounce. No "saving..." indicator unless on slow connection.
- **Microphone button:** Tap to start voice-to-text. Whisper API (online) with Web Speech API fallback (offline). Words appear in real-time as user speaks.
- **Bottom toolbar:** Two primary action buttons side by side — "Send to..." (gold, primary) and "Review & Route" (teal, accent).
- **Collapse button** (`>`) closes drawer. **Expand button** (`⤢`) transitions current tab to full main content area.

> **Decision rationale:** Light rich text (bold, italic, bullets) rather than plain text — gives users enough formatting for capture without creating complexity in routing. Each destination handles its own formatting after receiving content.

**Interactions:**
- Typing/dictating creates content in the active tab
- Content persists across sessions, devices, and browser restarts (database-backed)
- Tabs auto-named by LiLa after 30+ characters (2-second delay, fires once per tab). User can rename anytime.
- Closing a tab (X button) moves it to Notepad History as "archived" — content preserved, can be reopened
- Collapse (`>`) hides drawer; reopen (`<`) restores exact state
- Expand (`⤢`) fills main content area with current tab; sidebar remains accessible

**Data created/updated:**
- `notepad_tabs` record per tab (content, status, auto-naming)

### Screen 2: "Send to..." Grid Menu

**What the user sees** when tapping "Send to...":

```
┌─────────────────────────────┐
│  ★ FAVORITES (top 3)        │
│  ┌───────┐┌───────┐┌──────┐│
│  │Journal││ Tasks ││ Note ││
│  └───────┘└───────┘└──────┘│
│                             │
│  ALL DESTINATIONS           │
│  ┌───────┐┌───────┐┌──────┐│
│  │Journal││Tasks  ││ List ││
│  ├───────┤├───────┤├──────┤│
│  │Intent ││Victory││ Cal  ││
│  ├───────┤├───────┤├──────┤│
│  │Inner  ││Guiding││ Note ││
│  ├───────┤├───────┤├──────┤│
│  │Agenda ││Track  ││Messag││
│  ├───────┤├───────┤├──────┤│
│  │LiLa Op││       ││      ││
│  └───────┘└───────┘└──────┘│
│         [Cancel]            │
└─────────────────────────────┘
```

**Favorites section (top):** Top 3 most-used destinations, auto-sorted by usage frequency from `notepad_routing_stats` table. Larger buttons with tinted backgrounds matching destination accent colors. Adapts over time.

**All Destinations section (below):** Compact 3-column grid. Lucide icon + label per button. Hover/tap states with destination accent color.

**Complete destination list (14 destinations):**

| # | Destination | Icon | Accent | Sub-Picker | What Happens |
|---|-------------|------|--------|------------|-------------|
| 1 | Journal | BookOpen | Teal | Entry type picker (11 types) | Saves as journal entry with selected type |
| 2 | Tasks | CheckSquare | Gold | Structure picker: Single / Individual / AI Sort / Sequential | Sends to Studio Queue as draft(s) with `destination = 'task'` |
| 3 | List | List | Blue | Existing lists grouped by type + [+ Create New List]; for 3+ items, asks add-to-one vs review-individually | Sends to Studio Queue with `destination = 'list'`, routes to Lists page |
| 4 | Intention | Heart | Purple | None (direct save) | Creates Best Intention entry |
| 5 | Victory | Trophy | Rose | None (direct save) | Records in Victory Recorder |
| 6 | Calendar | Calendar | Green | Date/time picker or "LiLa extract dates" | Creates calendar event(s) |
| 7 | InnerWorkings | Compass | Warm brown | Category picker (5 categories) | Auto-saves to self_knowledge |
| 8 | Guiding Stars | Star | Gold/yellow | Type picker (4 types) | Auto-saves to guiding_stars |
| 9 | Note | StickyNote | Light blue | None (direct save) | Saves to journal_entries as quick_note |
| 10 | Agenda | Users | Muted rose | Meeting picker (inline overlay) | Adds agenda item to selected meeting |
| 11 | Track Progress | BarChart2 | Varies | Tracker picker with LiLa smart matching | Logs data point to selected tracker |
| 12 | Message | Send | Warm coral | Family member multi-select + cc/bcc | Sends internal family message |
| 13 | LiLa Optimizer | Sparkles | Teal | None (direct send) | Sends content to Optimizer workspace |
| 14 | Send to Person | — | — | — | *Merged into Message destination* |

> **Decision rationale:** "Send to Person" merged into a richer "Message" destination with multi-recipient cc/bcc and reply capability. Functions as a lightweight internal family email system rather than a one-way note drop.

> **Decision rationale:** "Note" routes to `journal_entries` with `entry_type = 'quick_note'` rather than a separate table. A Note is functionally a journal entry without reflective framing — avoids duplicating storage for the same concept.

**Inline Picker Overlay Pattern (Reusable Component):**

Several destinations use an inline picker that appears within the Send To grid without navigating away:

| Destination | Picker Shows | Create New Option |
|-------------|-------------|-------------------|
| Journal | Entry type list (11 types) | — |
| Tasks | Structure: Single / Individual / AI Sort / Sequential | — |
| List | Existing lists by type + [+ Create New List]; 3+ items prompt for batch handling | — |
| InnerWorkings | Category (5) | — |
| Guiding Stars | Type (4) | — |
| Agenda | Upcoming meetings | "+Create Meeting" |
| Track Progress | Existing trackers (LiLa pre-highlights match) | "+Create Tracker" |
| Message | Family members (multi-select) + cc/bcc toggle | — |

This is a single reusable component populated with different data per destination. Build once, use everywhere.

> **Forward note:** Future inline picker candidates include: List picker (add to existing list vs. new), Calendar picker (which calendar), Task assignment picker (assign to family member inline). Architecture should support adding new picker data sources without refactoring the component.

**After routing:**
- Tab closes with brief undo toast (5 seconds): "[Content name] sent to [Destination]. [Undo] [Also send to...]"
- "Undo" restores the tab to active state and deletes the created record
- "Also send to..." reopens the grid with the same content for a second routing to a different destination
- Tab moves to Notepad History tagged with destination
- If last tab: drawer auto-closes

> **Decision rationale:** Multi-destination routing handled via "Also send to..." on the undo toast rather than simultaneous multi-select. Keeps the primary "Send to..." flow single-destination and simple. "Review & Route" handles the case where content contains multiple discrete items for different destinations.

### Screen 3: Review & Route (Universal Reusable Component)

> **Depends on:** LiLa AI extraction capability — defined in PRD-05, LiLa Core AI System.

**What the user sees** when tapping "Review & Route":

```
┌─────────────────────────────────┐
│  ← Back        Review & Route   │
│  ─────────────────────────────  │
│  LiLa found 6 items:           │
│                                 │
│  ┌─────────────────────────────┐│
│  │ "Jake wants to try out for  ││
│  │  basketball"                ││
│  │ [Task] [Note] [Calendar]   ││
│  │ Confidence: 92%        [Skip]│
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ "Practice starts March 15"  ││
│  │ [Calendar] [Task] [Note]   ││
│  │ Confidence: 88%        [Skip]│
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ "He's nervous about tryouts"││
│  │ [Journal] [InnerWork] [Note]││
│  │ Confidence: 76%        [Skip]│
│  └─────────────────────────────┘│
│                                 │
│  [Route All Pending]            │
│  [Edit in Notepad] [Save Only]  │
└─────────────────────────────────┘
```

**This is defined as a universal reusable component.** PRD-08 establishes the component contract; other features wire in with their content as input.

**Component contract:**
- **Input:** Text content + optional context (active trackers, upcoming meetings, Guiding Stars, user's Mast/InnerWorkings categories)
- **Processing:** LiLa Edge Function analyzes content, returns extracted items with: `extracted_text`, `item_type`, `suggested_destination`, `confidence` score
- **Output:** Array of extracted item cards, each independently routable

**Item types extracted:**
- Action items → suggested as Tasks
- Commitments/goals → suggested as Best Intentions
- Calendar dates/events → suggested as Calendar entries
- Emotional insights → suggested as Journal entries
- Personal revelations → suggested as InnerWorkings
- Concerns/flags → suggested as Notes
- Shopping/needs → suggested as List items
- Victories/accomplishments → suggested as Victories
- Trackable data points → suggested as Track Progress (with smart matching to existing trackers)

**Per-item interactions:**
- Each card shows extracted text (editable inline), suggested destination (highlighted), alternative destinations, confidence percentage, and Skip button
- User taps a destination button to confirm routing for that item
- "Route All Pending" accepts all suggested destinations in bulk
- "Edit in Notepad" opens the original content in a new notepad tab for manual editing
- "Save Only" saves the original content as-is without extraction
- Skipped items remain in the original content but aren't routed anywhere

> **Decision rationale:** Review & Route defined as a universal reusable component in PRD-08 because this is where it first appears. Other features (LiLa conversations, meeting transcripts, ThoughtSift sessions, Library Vault tool outputs) wire into the same component with their content as input. Each future PRD just says "uses the Review & Route component from PRD-08."

> **Forward note:** The extraction AI will improve over time as it learns user patterns. Initial implementation uses a single Edge Function call with context; future versions may use conversation history to improve categorization accuracy.

### Screen 4: Journal Main Page (Container View)

> **Mom experience goal:** The Journal should feel like opening a beautiful personal book — a place of warmth and reflection, not a database query interface.

**What the user sees:**

```
┌──────────────────────────────────┐
│  My Journal                  [+] │
│  ─────────────────────────────── │
│  [All] [Reflections] [Common-   │
│   place] [Gratitude] [Kid Quips]│
│  ─────────────────────────────── │
│  🔍 Search    📅 Date   🏷️ Tags │
│  ─────────────────────────────── │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Today                      │  │
│  │ ┌──────────────────────┐   │  │
│  │ │ 📖 Journal Entry      │   │  │
│  │ │ "Feeling grateful..." │   │  │
│  │ │ 🏷️ spiritual, family  │   │  │
│  │ └──────────────────────┘   │  │
│  │ ┌──────────────────────┐   │  │
│  │ │ 📝 Quick Note         │   │  │
│  │ │ "Look into summer..." │   │  │
│  │ └──────────────────────┘   │  │
│  │ ┌──────────────────────┐   │  │
│  │ │ 💬 Kid Quips          │   │  │
│  │ │ "Emma said the fun..." │  │  │
│  │ └──────────────────────┘   │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Yesterday                  │  │
│  │ ...                        │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

- **`+` button** opens the Smart Notepad (right drawer) for new entry creation. The Journal itself is not a direct writing surface.
- **Sub-page tabs** across the top: "All" (default, shows everything), then tabs for each entry type that has its own sub-page experience (Reflections, Commonplace, Gratitude, Kid Quips). Tapping a tab navigates to that sub-page.
- **Filter bar:** Search (full-text across all entries), date range picker, life area tag filter, entry type filter (when on "All" view).
- **Timeline:** Entries grouped by date, most recent first. Each entry card shows: entry type badge with icon, content preview (truncated), life area tags as chips, source icon (voice, LiLa, meeting, manual), timestamp.
- **Tapping an entry** opens the full entry detail view (view/edit mode).

> **Decision rationale:** Journal sub-pages (Reflections, Commonplace, etc.) are specialized capture and viewing experiences nested within the Journal container. All write to the same `journal_entries` table with their respective `entry_type`. The main Journal timeline shows everything aggregated. This keeps data unified while giving each entry type its own tailored UX.

> **Deferred:** Reflections sub-page (rotating questions, family sharing requirements, Guided/Play participation) — to be fully designed in the Reflections PRD. PRD-08 defines the container, the entry type, and the sub-page navigation slot. The Reflections experience itself is deferred.

> **Deferred:** Commonplace sub-page (pre-loaded prompts, custom questions mom can assign, coaching questions for kids, sub-tags like questions/observations/theories) — to be fully designed in the Commonplace PRD. PRD-08 defines the container slot and entry type.

**Data created/updated:**
- `journal_entries` records (via routing from Notepad, not direct creation on this page)

### Screen 5: Journal Entry Detail

**What the user sees** when tapping an entry:

- Full entry text (editable)
- Entry type selector (changeable)
- Life area tags (AI-auto-applied, user-removable/addable)
- Source indicator (where this entry came from: manual, voice, LiLa, meeting, hatch routed)
- `is_included_in_ai` toggle ("Include in LiLa context")
- Sharing controls (per-entry: share with mom, share with dad — for teen/dad entries)
- Routing selector: "Also route to..." opens the same Send To grid for secondary routing. Original entry ALWAYS stays in Journal — routing creates a copy/link, never moves.
- Archive / Delete actions
- Created/updated timestamps

> **Decision rationale:** Routing from a journal entry creates a copy at the destination, never moves. The journal entry is the permanent record. This matches the StewardShip Log convention: `routed_to` TEXT[] tracks destinations, `routed_reference_ids` JSONB maps route types to created record IDs.

### Screen 6: Notepad History

**What the user sees:**

- Accessible from: dropdown in notepad drawer header (recent items) + full page in sidebar navigation
- Every notepad tab that has ever had content, organized by state:
  - **Active:** Currently open in drawer
  - **Routed:** Sent via "Send to...", tagged with destination + link
  - **Archived:** Closed via X button without routing
- Sort by: date created, date modified, name, status
- Filter by: status, destination, date range
- Search across all history entry content
- **Reopen:** archived entries create a new active tab with the content
- **Click routed entries:** opens content in its destination (Tasks page, Journal entry, etc.), not back in notepad
- **Delete:** permanent removal from history

### Screen 7: Full-Page Notepad Mode

When user taps the expand button (`⤢`):
- Current tab fills the full main content area
- Tab bar, content area, toolbar — all identical functionality
- Sidebar remains accessible (can be open/closed)
- Collapse button returns tab to right drawer
- Especially useful for: long meeting transcripts, document-style writing, brain dump sessions, reviewing AI-generated content

### Screen 8: Message Inbox (Recipient View)

> **Deferred:** Full message inbox design — to be resolved in the Messaging/Notifications PRD. PRD-08 defines the routing destination and the send flow from the Notepad side.

**What the recipient sees:**
- Notification badge on dashboard indicating unread messages
- Inbox area showing received messages: sender name, timestamp, preview, cc recipients (if cc, not bcc)
- Tap to open full message content
- Reply button (opens a Notepad tab pre-addressed to the sender)
- Mark read, archive, delete actions
- Messages are private between sender and recipients only

**Send flow from Notepad:**
1. User taps "Send to... → Message"
2. Family member picker appears with multi-select
3. User selects one or more recipients
4. cc/bcc toggle per recipient (default: cc)
5. Message sent; tab moves to history tagged "Sent to: [names]"

> **Forward note:** The messaging system is intentionally lightweight at launch — not a full chat app. Future versions may add threading, read receipts, or group conversations. Architecture should support these without schema changes.

---

## Visibility & Permissions

> **Depends on:** Five-role permission model — defined in PRD-01 and PRD-02.

### Smart Notepad Access

| Role | Notepad Access | Voice | Review & Route | Send To Destinations |
|------|---------------|-------|----------------|---------------------|
| Mom / Primary Parent | Full access | Yes | Yes | All 14 destinations |
| Dad / Additional Adult | Full access | Yes | Yes | All 14 destinations (subject to feature access grants from mom) |
| Special Adult | Not present | No | No | N/A — Special Adults do not have Smart Notepad |
| Independent (Teen) | Full access | Yes | Yes | All 14 destinations (hidden if teen lacks permission for the destination feature) |
| Guided | Not present in Smart Notepad | N/A | N/A | N/A — capture via Reflections and Commonplace sub-pages only |
| Play | Not present | N/A | N/A | N/A |

> **Decision rationale:** Special Adults do not get Smart Notepad — they have a scoped-down experience for assigned children only. The Notepad's universal routing would be confusing in that constrained context.

> **Deferred:** Guided children's capture experience — to be designed in the Guided Dashboard PRD. The Notepad architecture supports role-filtered destination configs for future Guided access if desired.

### Journal Access

| Role | Journal Access | Notes |
|------|---------------|-------|
| Mom / Primary Parent | Full CRUD on own entries. Can view children's entries per category-level visibility settings. | Mom configures which entry types are visible per child in Family Settings. |
| Dad / Additional Adult | Full CRUD on own entries. Cannot see mom's unless she shares. | Dad's entries are private by default. Per-entry sharing with mom available. |
| Special Adult | Not present | Special Adults do not have Journal access. |
| Independent (Teen) | Full CRUD on own entries. Entries private by default per category. Can share (increase disclosure) but cannot hide entries in visible categories. | Per-entry "Share with Mom" / "Share with Dad" toggles within private categories. |
| Guided | Reflections and Commonplace sub-pages only (via Journal container). | Mom sees all Guided child entries. No privacy controls for Guided. |
| Play | Reflections sub-page only (if enabled by mom). | Mom sees all Play child entries. |

### Journal Privacy Model: Category-Level Permissions

Mom configures visibility **per entry type per child** in Family Settings:

| Entry Type | Default Visibility (Teen) | Mom Can Configure |
|------------|--------------------------|-------------------|
| journal_entry | Private | Can toggle to visible |
| gratitude | Private | Can toggle to visible |
| reflection | Visible | Required for family sharing |
| quick_note | Private | Can toggle to visible |
| commonplace | Visible | Required for educational tracking |
| kid_quips | Visible | Typically visible (fun family content) |
| meeting_notes | Private | Can toggle to visible |
| brain_dump | Private | Can toggle to visible |
| custom | Private | Can toggle to visible |

**Key rules:**
- Teens can share entries within private categories (increase disclosure) via per-entry toggle
- Teens CANNOT hide entries within visible categories (cannot increase privacy)
- This follows the PRD-02 principle: teens can only increase sharing, never increase privacy
- Per-entry `is_shared_with_mom` and `is_shared_with_dad` toggles work within private categories
- Dad's entries follow the same per-entry sharing model as InnerWorkings (PRD-07)

> **Decision rationale:** Category-level privacy rather than all-or-nothing. Mom needs to see commonplace entries for educational tracking and reflection entries for family sharing, but shouldn't need access to a teen's private journal entries. This respects teen autonomy while preserving mom's parental role.

### Privacy & Transparency

- **Teen privacy indicator:** Journal page in Independent shell shows a badge per entry type indicating visibility status: "Mom can see [type] entries" or "Private." Tapping navigates to Settings.
- **Dad sharing:** Per-entry "Share with [partner name]" toggle, same pattern as InnerWorkings (PRD-07).
- **Guided/Play:** Mom sees all entries. No privacy controls for children in these modes.

---

## Data Schema

### Table: `notepad_tabs`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_member_id | UUID | | NOT NULL | FK → family_members |
| title | TEXT | 'New Tab' | NOT NULL | Auto-named by LiLa or user-renamed |
| content | TEXT | '' | NOT NULL | Tab content (light rich text as HTML or Markdown) |
| status | TEXT | 'active' | NOT NULL | Enum: 'active', 'routed', 'archived' |
| routed_to | TEXT | NULL | YES | Destination key when status = 'routed' |
| routed_reference_id | UUID | NULL | YES | FK to created record at destination |
| source_type | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'voice', 'edit_in_notepad', 'lila_optimizer' |
| source_reference_id | UUID | NULL | YES | FK to source (e.g., LiLa conversation ID) |
| is_auto_named | BOOLEAN | true | NOT NULL | False after user manually renames |
| sort_order | INTEGER | 0 | NOT NULL | Tab display order |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |
| archived_at | TIMESTAMPTZ | NULL | YES | Soft delete |

**RLS Policy:** Members CRUD own tabs only (owner_member_id = current user). Mom cannot see other members' notepad tabs — the notepad is a private workspace.

**Indexes:**
- `owner_member_id, status, sort_order` (active tabs for display)
- `owner_member_id, updated_at DESC` (history view)
- `owner_member_id, status, routed_to` (filtered history)

### Table: `notepad_routing_stats`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_member_id | UUID | | NOT NULL | FK → family_members |
| destination | TEXT | | NOT NULL | Routing destination key |
| route_count | INTEGER | 0 | NOT NULL | Usage count |
| last_used_at | TIMESTAMPTZ | now() | NOT NULL | |

**Unique constraint:** `(owner_member_id, destination)`
**RLS Policy:** Members CRUD own stats only.

### Table: `notepad_extracted_items`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| tab_id | UUID | | NOT NULL | FK → notepad_tabs. CASCADE delete. |
| extracted_text | TEXT | | NOT NULL | The extracted item text |
| item_type | TEXT | | NOT NULL | Enum: 'action_item', 'reflection', 'revelation', 'value', 'victory', 'trackable', 'meeting_followup', 'list_item', 'general' |
| suggested_destination | TEXT | | NOT NULL | AI-suggested routing destination key |
| actual_destination | TEXT | NULL | YES | User-confirmed destination (may differ from suggested) |
| confidence | NUMERIC(3,2) | | NOT NULL | AI confidence score 0.00–1.00 |
| status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'routed', 'skipped' |
| routed_reference_id | UUID | NULL | YES | FK to created record at destination |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Inherits from parent tab via family_id + owner check.
**Indexes:**
- `tab_id, status` (review screen)

### Table: `journal_entries`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_member_id | UUID | | NOT NULL | FK → family_members |
| entry_type | TEXT | 'journal_entry' | NOT NULL | Enum: 'journal_entry', 'gratitude', 'reflection', 'quick_note', 'commonplace', 'kid_quips', 'meeting_notes', 'transcript', 'lila_conversation', 'brain_dump', 'custom' |
| text | TEXT | | NOT NULL | Entry content |
| life_area_tags | TEXT[] | '{}' | NOT NULL | AI auto-applied on save, user-editable. GIN index. |
| source | TEXT | 'manual_text' | NOT NULL | Enum: 'manual_text', 'voice_transcription', 'lila_conversation', 'meeting_framework', 'hatch_routed', 'review_route', 'reflection_prompt', 'commonplace_prompt' |
| source_reference_id | UUID | NULL | YES | FK to source record (notepad tab, LiLa conversation, meeting, etc.) |
| is_included_in_ai | BOOLEAN | false | NOT NULL | Whether this entry feeds LiLa context |
| is_shared_with_mom | BOOLEAN | false | NOT NULL | Per-entry sharing toggle (for teen/dad entries) |
| is_shared_with_dad | BOOLEAN | false | NOT NULL | Per-entry sharing toggle |
| is_private | BOOLEAN | false | NOT NULL | Per-entry privacy override within visible categories (future use) |
| routed_to | TEXT[] | '{}' | NOT NULL | Destinations this entry has been routed to |
| routed_reference_ids | JSONB | '{}' | NOT NULL | Maps route types to created record IDs |
| mood_tag | TEXT | NULL | YES | Optional mood indicator |
| audio_file_path | TEXT | NULL | YES | Supabase Storage path for voice entries |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |
| archived_at | TIMESTAMPTZ | NULL | YES | Soft delete |

**RLS Policy:** Members CRUD own entries. Mom can read children's entries per category-level visibility configuration in `journal_visibility_settings`. Dad can read entries where `is_shared_with_dad = true`.

**Indexes:**
- `owner_member_id, created_at DESC` (timeline)
- `owner_member_id, entry_type, created_at DESC` (type-filtered views)
- `family_id, owner_member_id, entry_type` (category visibility queries)
- GIN index on `life_area_tags` (tag filtering)
- Full-text search index on `text` (search)

### Table: `journal_visibility_settings`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| parent_member_id | UUID | | NOT NULL | FK → family_members. The parent configuring visibility. |
| child_member_id | UUID | | NOT NULL | FK → family_members. The child whose entries are being configured. |
| entry_type | TEXT | | NOT NULL | Which entry type this setting controls |
| is_visible_to_parent | BOOLEAN | false | NOT NULL | Whether parent can see this entry type |
| is_included_in_ai_default | BOOLEAN | false | NOT NULL | Default AI context inclusion for this type |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(parent_member_id, child_member_id, entry_type)`
**RLS Policy:** Only mom (primary parent) can CRUD these settings.

### Table: `family_messages`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| sender_member_id | UUID | | NOT NULL | FK → family_members |
| subject | TEXT | NULL | YES | Optional subject line |
| body | TEXT | | NOT NULL | Message content |
| reply_to_id | UUID | NULL | YES | FK → family_messages (self-referential for threading) |
| source_tab_id | UUID | NULL | YES | FK → notepad_tabs (if routed from notepad) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Members can read messages where they are a recipient or the sender.

### Table: `family_message_recipients`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| message_id | UUID | | NOT NULL | FK → family_messages. CASCADE delete. |
| recipient_member_id | UUID | | NOT NULL | FK → family_members |
| recipient_type | TEXT | 'cc' | NOT NULL | Enum: 'cc', 'bcc' |
| is_read | BOOLEAN | false | NOT NULL | |
| read_at | TIMESTAMPTZ | NULL | YES | |
| archived_at | TIMESTAMPTZ | NULL | YES | Recipient-level archive |

**Unique constraint:** `(message_id, recipient_member_id)`
**RLS Policy:** Recipients can read/update own recipient records. Sender can read all recipients for their messages.

### Enum/Type Updates

- `journal_entries.source`: Add 'hatch_routed', 'review_route', 'reflection_prompt', 'commonplace_prompt' to existing source enums across the system
- `self_knowledge.source_type`: Existing 'log_routed' value now wired — PRD-08 defines how "Save to InnerWorkings" works from Notepad
- LiLa guided modes: No new guided mode from this PRD (Review & Route is not a guided conversation)

---

## Flows

### Incoming Flows (How Data Gets INTO Smart Notepad + Journal)

| Source | How It Works |
|--------|-------------|
| Direct typing/dictation | User creates content in Notepad tabs. Primary input path. |
| "Edit in Notepad" from LiLa (PRD-05) | Content from any LiLa conversation opens in a new Notepad tab. `source_type = 'edit_in_notepad'`, `source_reference_id` = conversation ID. |
| "Edit in Notepad" from Library Vault tools | Same pattern — Cyrano compliment, Higgins talking points, ThoughtSift insights all route to Notepad for editing. |
| LiLa Optimizer output (PRD-05C) | Optimizer can send crafted prompts to Notepad for editing before external use. |
| Meeting transcripts (future) | "Edit in Notepad" on meeting transcripts sends content to Notepad tab. |
| Morning/Evening rhythms (future) | Prompted entries (gratitude, reflection) save to `journal_entries` with `source = 'reflection_prompt'`. |

### Outgoing Flows (How Smart Notepad + Journal Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Journal | Routing creates `journal_entries` record with selected `entry_type`. |
| Studio Queue (Tasks) | Content arrives as draft task(s) with structure flag and `destination = 'task'`. PRD-09A defines task configuration; PRD-09B defines the `studio_queue` table and queue management. |
| Studio Queue (Lists) | Content arrives with `destination = 'list'`. For 3+ items, user chooses add-to-one-list vs review-individually. PRD-09B defines list management. |
| Best Intentions (PRD-06) | Creates `best_intentions` record. Direct save, no queue. |
| Victory Recorder | Creates `victories` record. Direct save. |
| Calendar (future PRD) | Creates calendar event(s). LiLa extracts date/time if present. |
| InnerWorkings (PRD-07) | Creates `self_knowledge` record with selected category. Wires the existing `source_type = 'log_routed'` stub. |
| Guiding Stars (PRD-06) | Creates `guiding_stars` record with selected type. Direct save. |
| Agenda (future PRD) | Adds item to selected meeting's agenda. Meeting Frameworks PRD defines agenda management. |
| Track Progress (future PRD) | Logs data point to selected tracker. Progress & Goals PRD defines tracker management. |
| Message | Creates `family_messages` + `family_message_recipients` records. |
| LiLa Optimizer (PRD-05C) | Sends content as Optimizer input. Additive — multiple sends append. |
| LiLa context assembly (PRD-05) | Journal entries with `is_included_in_ai = true` available to LiLa. Active notepad content available when user is on Notepad page. |

---

## AI Integration

### Auto-Title Generation
- Fires once per tab after content reaches 30+ characters (2-second delay)
- LiLa generates a 3–6 word descriptive title
- User can rename anytime; `is_auto_named` set to false after manual rename
- Uses lightweight model (Haiku equivalent) for cost efficiency

### AI Auto-Tagging on Journal Save
- When content is routed to Journal, LiLa auto-applies `life_area_tags` based on content analysis
- Tags appear as removable chips — user can remove or add but never needs to decide tags themselves
- Same auto-tagging pattern used across the platform (Tasks, Victories, etc.)

### Review & Route Extraction
- Edge Function: `notepad-extract` — takes content text + optional context (active trackers, upcoming meetings, Guiding Stars, InnerWorkings categories, people names)
- Returns JSON array of extracted items with `extracted_text`, `item_type`, `suggested_destination`, `confidence`
- Uses Haiku-equivalent model for cost efficiency
- Context loading makes extraction smarter: "Jake did math" matches to "Homeschool: Math - Jake" tracker if it exists

### Track Progress Smart Matching
- When routing to Track Progress, LiLa analyzes content and pre-highlights the suggested tracker match
- Examples: "Drank 8 glasses of water" → Water Intake tracker; "Ran 2 miles" → Exercise tracker
- If no match exists, "+Create Tracker" button offered

### Notepad Content as LiLa Context
- When user is on the Notepad page and opens LiLa, active tab content (first 5 tabs, title + 100-char preview) is included in context assembly
- When user selects "Send to... → LiLa Optimizer," content is sent as Optimizer input
- No keyword detection for notepad context from other pages at launch

> **Forward note:** Keyword detection for notepad context (recognizing when a user references notepad content from another page) may be added post-launch. The data availability is defined now; the trigger intelligence comes later.

### System Prompt Notes
- When Notepad content is in context: "The user has active notepad tabs. You can reference their content if relevant to the conversation."
- When routing to destinations: AI should use merciful defaults — if uncertain about categorization, default to Journal (never discard content with effort)
- Review & Route: Extract more items rather than fewer. Let user skip what's not relevant rather than missing something.

---

## Voice Pipeline

> **Depends on:** Voice-to-text infrastructure (Whisper API + Web Speech API fallback). This is a platform-wide capability; PRD-08 defines the Notepad's usage of it.

### Technology
- **Online (primary):** OpenAI Whisper API — real-time transcription, words appear as user speaks (2–3 second delay), highly accurate
- **Offline (fallback):** Browser Web Speech API — real-time, free, less accurate, automatic fallback when no connection detected

### Behavior in Smart Notepad
- Microphone button in the content area
- Tap to start recording; tap again to stop
- Transcribed text appears in the current tab as raw text (no automatic extraction)
- User decides what to do: edit, route with "Send to...", or "Review & Route" for extraction
- Maximum flexibility — it's their workspace

### Cost Context
- 15-minute voice note: ~$0.09
- 30-minute brain dump: ~$0.18
- Heavy user (10 min/day voice): under $2/month

> **Deferred:** OCR (camera capture of handwritten notes) — future enhancement. Architecture should accommodate image-to-text as an additional input method alongside voice and typing.

---

## Edge Cases

### Tab Limit Reached
- At 6 tabs: subtle warning badge on tab bar ("Consider routing some tabs")
- At 8 tabs: `+` button disabled with tooltip "Close or route some tabs first"
- User can still receive content via "Edit in Notepad" — creates tab even at limit (extends to 9 temporarily)

### Large Content in Review & Route
- If content exceeds extraction API limits (~4000 tokens), truncate with notice: "Content is very long. LiLa analyzed the first portion. You can split into multiple tabs for complete analysis."
- "Edit in Notepad" always works regardless of content size

### Offline Behavior
- Notepad content cached locally for continued editing during connectivity loss
- Routing requires connectivity (database writes)
- Voice: Falls back to Web Speech API (free, less accurate)
- Full offline sync pattern defined in separate Offline Addendum

> **Deferred:** Full offline sync architecture — to be defined in a cross-cutting Offline Addendum that applies to all features, not just Notepad.

### Undo After Routing
- 5-second undo window with progress bar toast
- Undo deletes the created destination record and restores tab to active status
- "Also send to..." on the same toast reopens grid for multi-destination routing
- If undo window expires, routing is finalized
- Undo only works for single-destination "Send to..." routing — not for individual items in Review & Route

### Concurrent Edits (Multi-Device)
- Last-write-wins for notepad content (same pattern as InnerWorkings)
- Autosave with 500ms debounce prevents most conflicts
- Journal entry edits: last-write-wins with server sync

### Empty Notepad State
- When no tabs exist: warm invitation message with suggested actions: "Start typing, tap the mic, or open a past tab from history"
- Drawer still opens normally — empty state is not a blocking condition

### Message to Self
- Users can send messages to themselves (useful as reminders)
- Shows up in their own inbox like any other message

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `notepad_basic` | Smart Notepad with tabs, autosave, manual routing | Essential |
| `notepad_voice` | Voice-to-text input in Notepad | Essential |
| `notepad_review_route` | AI extraction and Review & Route | Enhanced |
| `notepad_ai_titles` | AI auto-titling of tabs | Essential |
| `journal_basic` | Journal page with timeline, filtering, search | Essential |
| `journal_ai_tags` | AI auto-tagging of journal entries | Enhanced |
| `journal_ai_context` | Journal entries feeding LiLa context | Enhanced |
| `journal_reflections_sub` | Reflections sub-page | Essential |
| `journal_commonplace_sub` | Commonplace sub-page | Essential |
| `messaging_basic` | Internal family messaging | Enhanced |

> **Tier rationale:** Core capture (Notepad + Journal) is Essential because it's foundational to the entire platform — every feature feeds through it. AI-powered features (extraction, smart tagging, context integration) are Enhanced because they represent the intelligence layer that differentiates tiers. Messaging is Enhanced because it requires connected family members (not applicable to Essential/mom-only tier).

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Studio Queue — task destination (routing + structure flag + destination type) | Full task creation modal, queue management with destination routing (task/list/widget/tracker), rewards/tracking/recurrence | PRD-09A (Tasks, Routines & Opportunities) + PRD-09B (Lists, Studio & Templates) |
| Studio Queue — list destination (routing + list selection) | List management page, list types, reusable templates, Studio browsing | PRD-09B (Lists, Studio & Templates) |
| Calendar routing (creates event with LiLa date extraction) | Calendar feature, date/time picker, recurring events | Calendar PRD |
| Track Progress routing (logs data point to tracker) | Progress & Goals page, tracker management, smart matching refinement | Progress & Goals PRD |
| Agenda routing (adds item to meeting agenda) | Meeting Frameworks, agenda management, shared agendas | Meetings PRD |
| Reflections sub-page (container slot + entry type) | Rotating questions, family sharing, Guided/Play participation | Reflections PRD |
| Commonplace sub-page (container slot + entry type) | Pre-loaded prompts, custom questions, coaching, sub-tags | Commonplace PRD |
| Message inbox and reply system | Full inbox UI, threading, notifications | Messaging/Notifications PRD |
| Drag-to-rearrange / Move-to convention | Universal ordered list reordering, cross-feature move actions | Cross-cutting UX convention (all PRDs) |
| Studio Queue as reusable component | Goals, Lists, Widgets, Trackers, and other features depositing drafts into the queue with destination flags | PRD-09B+ |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| "Edit in Notepad" action chip on LiLa messages | PRD-05 | Content from LiLa conversations creates a new notepad tab with `source_type = 'edit_in_notepad'` |
| "Review & Route" action chip on LiLa conversations | PRD-05 | Triggers the Review & Route component with conversation content as input |
| MindSweep folded into Review & Route | PRD-05 Planning Decisions Addendum | Review & Route IS the MindSweep experience — brain dump in Notepad → "Review & Route" parses into items |
| `source_type = 'log_routed'` on InnerWorkings | PRD-07 | "Save to InnerWorkings" routing from Notepad creates `self_knowledge` entry with `source_type = 'log_routed'`, `source_reference_id` = notepad tab ID |
| Optimizer sends to Notepad | PRD-05C | Optimizer output routed to Notepad tab with `source_type = 'lila_optimizer'` |
| Guiding Stars creation from routed content | PRD-06 | "Save to Guiding Stars" routing creates `guiding_stars` entry with selected type |
| Best Intentions creation from routed content | PRD-06 | "Save to Intention" routing creates `best_intentions` entry |
| `is_included_in_ai` context convention | PRD-05 Planning Decisions Addendum | `journal_entries` table includes `is_included_in_ai` column, controllable at category and per-entry level |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Smart Notepad drawer with tab system (create, switch, rename, close, 8-tab limit with 6-tab warning)
- [ ] Light rich text editor (bold, italic, bullet lists) with continuous autosave (500ms debounce)
- [ ] AI auto-titling of tabs (fires once per tab after 30+ chars, 2s delay)
- [ ] Voice-to-text input via Whisper API with Web Speech API fallback
- [ ] Full-page mode (expand/collapse between drawer and main content area)
- [ ] "Send to..." grid with all 14 destinations, favorites learning (top 3 by usage)
- [ ] Inline picker overlays for destinations requiring sub-selection (Journal type, Task structure, InnerWorkings category, Guiding Stars type, Meeting picker, Tracker picker, Message recipients)
- [ ] Routing executes: Journal, Note, InnerWorkings, Guiding Stars, Intention, Victory, Message, LiLa Optimizer fully wired
- [ ] Routing stubs: Tasks (to queue), Lists, Calendar, Track Progress, Agenda — grid shows them, sends to stub/queue
- [ ] Undo toast with 5-second window + "Also send to..." for multi-destination
- [ ] Notepad History (full page + drawer dropdown) with search, filter, sort, reopen, delete
- [ ] Review & Route component: AI extraction → card-by-card review → per-item routing → "Route All Pending"
- [ ] Journal main page: chronological timeline, entry type tabs/sub-page navigation, filters (type, tags, date, search)
- [ ] Journal entry detail: view/edit, change type, manage tags, AI context toggle, sharing toggles, routing to other destinations
- [ ] Journal privacy: category-level visibility settings per child, per-entry sharing toggles
- [ ] `journal_visibility_settings` table with mom-configurable entry type visibility per child
- [ ] Family messaging: send from Notepad, multi-recipient cc/bcc, basic inbox with reply
- [ ] "Edit in Notepad" wired from LiLa conversations (PRD-05 stub)
- [ ] AI auto-tagging of life area tags on journal save
- [ ] RLS verified: notepad tabs private to owner; journal entries visible per category settings + sharing toggles; messages visible to sender + recipients only
- [ ] Empty states with warm invitations for Notepad, Journal, and History

### MVP When Dependency Is Ready
- [ ] Task routing deposits into Studio Queue with `destination = 'task'` (requires PRD-09A/09B queue implementation)
- [ ] List routing deposits into Studio Queue with `destination = 'list'` (requires PRD-09B lists and Studio implementation)
- [ ] Calendar routing creates events (requires Calendar PRD)
- [ ] Track Progress routing logs data points (requires Progress & Goals PRD)
- [ ] Agenda routing adds items to meetings (requires Meetings PRD)
- [ ] Reflections sub-page with rotating questions and family sharing (requires Reflections PRD)
- [ ] Commonplace sub-page with prompts and coaching (requires Commonplace PRD)
- [ ] Full message inbox with threading and notifications (requires Messaging PRD)
- [ ] Drag-to-rearrange on all ordered lists (requires cross-cutting UX implementation)

### Post-MVP
- [ ] OCR input (camera capture of handwritten notes)
- [ ] Keyword detection for notepad context in LiLa from any page
- [ ] AI learning user categorization patterns over time for smarter Review & Route
- [ ] Guided children's simplified notepad (filtered destinations, fewer tabs)
- [ ] Shared notepad tabs (mom shares a tab with spouse for collaborative capture)
- [ ] Keyboard shortcuts for common routing actions
- [ ] Drag-and-drop from notepad to main content area

---

## CLAUDE.md Additions from This PRD

- [ ] Smart Notepad conventions: right drawer, tabs with autosave, "Send to..." grid with 14 destinations, "Review & Route" universal extraction component
- [ ] Journal is a container with sub-pages, not a flat timeline. All entry types write to `journal_entries` table. Sub-pages (Reflections, Commonplace, etc.) are specialized capture/viewing experiences.
- [ ] Journal's `+` button opens Smart Notepad — Journal is NOT a direct writing surface
- [ ] "Note" routes to `journal_entries` with `entry_type = 'quick_note'` — no separate notes table
- [ ] Review & Route is a universal reusable component. Other features wire in with their content as input. Defined in PRD-08.
- [ ] Studio Queue pattern: Notepad deposits drafts into `studio_queue` with a destination flag (task/list/widget/tracker), a structure flag (single/individual/AI-sort/sequential), and source metadata. Full queue definition in PRD-09B. Queue is reusable by Goals, Meetings, and other features.
- [ ] Inline picker overlay is a reusable component: one component, different data sources per destination. Build once, use everywhere.
- [ ] Journal privacy: category-level visibility per child configured in `journal_visibility_settings`. Teens can share (increase disclosure) but cannot hide (increase privacy).
- [ ] Routing from journal entries creates copies, never moves. Original always stays in Journal. `routed_to` TEXT[] and `routed_reference_ids` JSONB track destinations.
- [ ] "Also send to..." on undo toast enables multi-destination routing without complicating the primary Send To flow.
- [ ] Family messaging: lightweight internal email with cc/bcc and reply. Not a full chat system. `family_messages` + `family_message_recipients` tables.
- [ ] AI auto-tagging: `life_area_tags` auto-applied on journal save as removable chips. User never needs to decide tags themselves. Same pattern across all tagged features.
- [ ] Merciful extraction defaults: if uncertain → Journal. Never discard content with effort. Extract more rather than fewer.
- [ ] Drag-to-rearrange / Move-to: cross-cutting UX convention. Every ordered list supports drag reorder. Every item has a "Move to..." action.
- [ ] List types are config-driven (extensible via config object, not hardcoded enums). List routing shows existing lists by type + [+ Create New List]. For 3+ items, prompts batch handling (add all to one list vs. review individually).
- [ ] Studio is the template workshop page (sidebar: "Studio", subtitle: "Templates, Trackers & Widgets"). Studio Queue (`studio_queue` table, defined in PRD-09B) is the universal creation queue replacing the simpler "Task Creation Queue" concept.
- [ ] Offline: defined in separate cross-cutting Offline Addendum. Notepad caches locally for offline authoring; routing requires connectivity.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `notepad_tabs`, `notepad_routing_stats`, `notepad_extracted_items`, `journal_entries`, `journal_visibility_settings`, `family_messages`, `family_message_recipients`

Tables referenced (no changes): `self_knowledge` (PRD-07), `guiding_stars` (PRD-06), `best_intentions` (PRD-06), `victories`

Enums updated:
- `self_knowledge.source_type`: 'log_routed' now wired (existing value, behavior defined)
- New enums: `notepad_tab_status`, `notepad_source_type`, `journal_entry_type`, `journal_source`, `message_recipient_type`

Triggers added: `set_updated_at` on `notepad_tabs`, `journal_entries`, `journal_visibility_settings`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Journal privacy uses category-level permissions per child** | Mom needs to see commonplace/reflection entries for educational and family sharing purposes, but shouldn't need access to a teen's private diary entries. More granular than all-or-nothing. |
| 2 | **Teens can share but not hide (one-directional disclosure)** | Follows PRD-02 principle: teens increase sharing, never increase privacy. Consistent with the platform's transparency model. |
| 3 | **Guided children's Notepad deferred to Guided Dashboard PRD** | Core Notepad is already the most complex PRD. Guided capture experience deserves its own design attention. |
| 4 | **8 active tabs, warning at 6** | Generous for brain dump sessions, prevents performance issues from tab hoarding. StewardShip uses 10 with no issues but family app may have younger users. |
| 5 | **Light rich text (bold, italic, bullets)** | Enough formatting for capture without creating routing complexity. Each destination handles its own formatting. |
| 6 | **Structured `entry_type` field + separate `life_area_tags` array** | Entry type controls filtering and AI context weighting. Tags control topical discovery. Dual approach serves different purposes. Adapted from StewardShip's proven pattern. |
| 7 | **AI context: category-level + per-entry `is_included_in_ai`, default OFF** | Journal is high-volume. Users opt specific entry types and entries into AI context rather than flooding LiLa with daily captures. |
| 8 | **All 14 routing destinations in grid; stubs for un-PRD'd features** | Shows the full vision from day one. Future PRDs wire the receiving end. Avoids redesigning the grid later. |
| 9 | **"Note" routes to `journal_entries` as `entry_type = 'quick_note'`** | Avoids a separate notes table for functionally identical data. Quick Note badge distinguishes it in the timeline. |
| 10 | **Notepad content as LiLa context: active page only + Send to Optimizer** | Simple, predictable trigger. No keyword detection at launch. Users copy/paste if they want notepad content in LiLa from another page. |
| 11 | **Offline defined in separate cross-cutting addendum** | Full offline affects every feature, not just Notepad. Deserves its own architectural spec. |
| 12 | **Review & Route as universal reusable component defined here** | This is where it first appears. Other features wire in. Prevents duplicate implementations (StewardShip had two separate implementations — Hatch extraction and Unload the Hold — for the same concept). |
| 13 | **Multi-destination via "Also send to..." on undo toast** | Keeps primary Send To flow single-destination and simple. Review & Route handles the multi-item-to-multiple-destinations case. |
| 14 | **Reflections and Commonplace are Journal sub-pages, deferred to own PRDs** | They need specialized capture experiences (rotating questions, family sharing, coaching prompts) that deserve dedicated design. PRD-08 defines the container slots and entry types. |
| 15 | **"Send to Person" merged into richer "Message" destination** | Internal family email with multi-recipient cc/bcc and reply is more useful than one-way note drops. |
| 16 | **Task routing goes to Studio Queue, not direct creation** | Tasks have complex configuration (rewards, tracking, recurrence, assignment). Notepad deposits drafts into `studio_queue` with `destination = 'task'`; full configuration happens in the Task Creation modal. Queue is reusable by other features with different destination flags (list/widget/tracker). |
| 17 | **Review & Route scoped to Notepad content; Unload the Hold separate** | They're distinct UX: writing down thoughts vs. having a conversation about them. Both use the same backend extraction pipeline but have different entry points. |
| 18 | **Journal sub-pages for ALL entry types** | Each entry type can have its own specialized viewing/capture sub-page within the Journal container. Main Journal aggregates everything. |
| 19 | **Drag-to-rearrange / Move-to as cross-cutting convention** | Every ordered list in the app should support reordering. Every item should have a "Move to..." action. Established here, applies everywhere. |
| 20 | **List types are config-driven (extensible)** | Adding new list types should be a config change, not a code change. Same pattern as routing destination config. |
| 21 | **Notepad tabs are private to owner — mom cannot see other members' tabs** | The Notepad is a personal workspace. Privacy applies even to mom. What gets routed to shared destinations (Journal with visible categories, Tasks, etc.) becomes visible per those features' own privacy rules. |
| 22 | **LiLa Optimizer sends are additive** | Multiple sends append content in the Optimizer workspace. User accumulates context from multiple notepad tabs before crafting. |
| 23 | **Sequential structure flag added to Tasks routing (PRD-09 update)** | A fourth structure option "Sequential" deposits items as an ordered sequential collection in the Studio Queue. Supports flows like photographing a table of contents and creating ordered tasks from it. Added during PRD-09 session. |
| 24 | **Task Creation Queue renamed to Studio Queue (PRD-09 update)** | The queue concept expanded beyond tasks to support list, widget, and tracker drafts. Table is `studio_queue` with a `destination` flag. Defined in PRD-09B. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Guided children's Notepad/capture experience | Guided Dashboard PRD |
| 2 | Reflections sub-page (rotating questions, family sharing, Guided/Play participation) | Reflections PRD |
| 3 | Commonplace sub-page (prompts, custom questions, coaching, sub-tags) | Commonplace PRD |
| 4 | Full message inbox design (threading, notifications, rich features) | Messaging/Notifications PRD |
| 5 | Studio Queue implementation, task creation modal, and queue management UI | PRD-09A (Tasks, Routines & Opportunities) + PRD-09B (Lists, Studio & Templates) |
| 6 | List management, Studio browsing, reusable templates | PRD-09B (Lists, Studio & Templates) |
| 7 | Calendar event creation from routing | Calendar PRD |
| 8 | Track Progress tracker management | Progress & Goals PRD |
| 9 | Meeting agenda management | Meetings PRD |
| 10 | Full offline sync architecture | Cross-cutting Offline Addendum |
| 11 | OCR input (camera capture) | Post-MVP enhancement |
| 12 | Keyword detection for notepad context in LiLa | Post-MVP enhancement |
| 13 | Drag-to-rearrange implementation details | Cross-cutting UX convention document |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core AI System) | "Edit in Notepad" and "Review & Route" action chips now fully specified. Notepad content as LiLa context defined. | Update context assembly section to reference `notepad_tabs` content loading when page = 'notepad'. Note that `member_self_insights` stub for Review & Route is now wired via PRD-08. |
| PRD-05 Planning Decisions Addendum | MindSweep → Review & Route now fully defined as universal reusable component. | Note that the component contract is in PRD-08, not PRD-05. |
| PRD-05C (LiLa Optimizer) | Optimizer ↔ Notepad bidirectional flow defined. Multiple sends are additive. | Update Optimizer spec to describe receiving content from Notepad and how additive sends work. |
| PRD-06 (Guiding Stars & Best Intentions) | Routing from Notepad to Guiding Stars and Best Intentions now defined with inline type pickers. | Note `source = 'hatch_routed'` and `source_reference_id` pointing to notepad tab. |
| PRD-07 (InnerWorkings) | `source_type = 'log_routed'` stub now wired. Routing from Notepad to InnerWorkings with category picker defined. | No schema changes needed — the stub anticipated this. Verify RLS allows the insert from Notepad routing context. |
| PRD-02 (Permissions) | Journal category-level visibility is a new permission pattern. `journal_visibility_settings` table defined. | Add journal visibility settings to the permission configuration screens in Family Settings. |
| PRD-04 (Shell Routing) | Journal sub-page navigation (Reflections, Commonplace, etc.) adds routes within the Journal container. | Update shell routing to accommodate Journal sub-pages as nested routes. |

---

*End of PRD-08*
