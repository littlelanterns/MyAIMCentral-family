# MyAIM Family: System Overview PRD v1
## The Master Map for MyAIM v2 Unified Family Intelligence Platform

**Document Purpose:** This document provides the system-level view of how all MyAIM Family features connect to each other. It defines the data flow between features, shared data dependencies, naming conventions, and the rules that govern cross-feature interactions. Every individual feature PRD should be read alongside this document. This is the "map." The individual PRDs are the detailed blueprints for each location on the map.

**Created:** February 23, 2026
**Last Updated:** February 23, 2026
**Status:** Planning Phase - No code yet

---

## Project Overview

MyAIM Family is a unified family intelligence platform that provides personalized, role-based experiences for every family member - mom, dad/additional adults, teens, and younger children - all within a single app sharing one database. Mom is always the primary administrator. Every family member gets their own personal growth space with privacy by default and opt-in sharing.

### What This App Is
- A **mom-first family platform** where mom has full administrative control
- A **personal growth companion** for each family member (adapted from StewardShip)
- A **family coordination hub** with shared tasks, calendars, and dashboards
- An **AI literacy platform** with Library Vault for learning
- A **context management system** (Archives) for using AI effectively across platforms

### What This App Is NOT
- A surveillance tool (privacy by default, sharing is opt-in)
- A replacement for human connection (processing partner, not companion)
- Three separate apps stitched together (one app, one database, role-based views)

### Core Principles (from Faith & Ethics Framework)
1. **Enhancement, not replacement** - AI amplifies wisdom, doesn't replace it
2. **Human-in-the-Mix** - Every AI output has Edit, Approve, Regenerate, Reject
3. **Faith-aware & pluralistic** - Respects all traditions
4. **Processing partner, not companion** - Warm but boundaried
5. **Privacy by default** - Personal data is private until explicitly shared
6. **Mom-first design** - Primary parent has full control, always

---

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, pgvector)
- **Hosting:** Vercel (new project, fresh deployment)
- **AI:** Claude Sonnet via OpenRouter (initial); BYOK support planned
- **Transcription:** OpenAI Whisper API (optional)
- **Embeddings:** Supabase pgvector (for Knowledge Base RAG)
- **Domain:** myaimcentral.com (when ready)

### Design System
- **Themes:** User-selectable from shared theme library (50+ colors across 9 families from MyAIM + StewardShip themes merged)
- **Gradient toggle:** Each theme can optionally use gradients or flat colors
- **Typography:** Configurable per theme (serif headings, sans-serif body as default)
- **Icons:** Lucide React icons for navigation and UI affordance. NO Unicode emoji in adult interfaces. Emoji permitted only in Play Mode (young children).
- **CSS Variables:** All components use `var(--color-*)` - never hardcoded values
- **Modals:** Prefer modal-based interaction (from MyAIM pattern) over full page navigation where appropriate
- **Shared component library:** Button, Card, Input, Modal, Tooltip, Toast, DrawerChat, VisibilityToggle
- **Mobile-first:** All UI components must work on mobile before considering desktop layout

---

## Layout Architecture (Summary - Full Detail in PRD-03)

### Desktop Layout: Five Interaction Zones

```
┌──────────────────────────────────────────────────────────────────┐
│                   v QuickTasks (pull-down drawer)                 │
│        [Task1] [Task2] [Task3] [Task4] →  (horizontal scroll)   │
│                   ^ (collapse up)                                │
├─────────┬──────────────────────────────────────┬─────────────────┤
│         │                          [Li][La][⚙] │                 │
│  Side   │                                      │  Smart          │
│  Menu   │       Main Content Area              │  Notepad        │
│         │                                      │  / Clipboard    │
│         │       (modals appear above           │                 │
│ < close │        EVERYTHING)                   │         close > │
│         │                                      │                 │
│         │                                      │                 │
├─────────┴──────────────────────────────────────┴─────────────────┤
│                   ^ LiLa Chat (pull-up drawer)                   │
└──────────────────────────────────────────────────────────────────┘
```

### Zone Details

**1. Left - Sidebar Navigation**
- Defaults OPEN on desktop (fully expanded)
- `<` arrow at top or center to collapse, `>` to reopen
- On tablet: mostly hidden but with a visible hint (thin colored strip or subtle tab) so users know it's there
- On mobile: hamburger menu, slides in from left

**2. Top - QuickTasks Drawer**
- Defaults OPEN
- Horizontal scrolling row of action buttons, auto-sorted by usage frequency
- `^` collapses it up, `v` brings it back down
- Available on every page

**3. Right - Smart Notepad / Clipboard Drawer**
- Defaults OPEN on desktop
- `>` to collapse, `<` to reopen
- Always-available quick capture (tabbed scratchpad)
- This is the "quick capture mode" of the Journal/Smart Notepad merge
- Full Journal lives in the main content area via sidebar navigation

**4. Bottom - LiLa Chat Drawer**
- Pull-up drawer at the bottom of every page (same pattern as StewardShip's Helm)
- Connected to general LiLa (smart, context-aware)
- Pull up to chat, push down when done
- Current page stays exactly where it was

**5. Center - Main Content Area**
- Where features render when selected from sidebar
- Adapts width as side drawers open/close
- Auto-collapses side drawers on narrow viewports (e.g., 13" laptop with both open)

**6. Floating Top-Right**
- 3 LiLa shortcut buttons (small, grow on hover) + Settings gear icon
- NOT a full header bar - just floating elements in the top-right of the content area
- Settings gear opens settings (themes, vibes, account, etc.)

**7. Modals**
- Appear above EVERYTHING (all zones, all drawers)
- Click outside the modal = close, but save the user's place
- Preferred interaction pattern for feature access (MyAIM pattern)

### Mobile Layout
- Bottom navigation bar for main sections (5-6 key areas)
- Hamburger menu for full navigation (slides in from left)
- QuickTasks: collapsible strip at top or integrated into bottom nav
- Smart Notepad: slide-in from right (gesture or button)
- LiLa: pull-up drawer from bottom (same as desktop)
- Modals: full-screen on mobile

### Responsive Behavior
- Minimum content width threshold triggers auto-collapse of drawers
- Priority: main content > LiLa drawer > sidebar > Smart Notepad > QuickTasks
- Each zone remembers its open/closed state per user

---

## Vibe System (Visual Aesthetic Presets)

Beyond color themes, users can select a "vibe" that changes the overall aesthetic feel of the app. Vibes affect fonts, border-radius, shadow styles, spacing density, and visual personality. Color themes are applied ON TOP of vibes.

### Available Vibes

**1. Classic MyAIM (DEFAULT)**
- Warm serif headings (The Seasons) + clean sans-serif body (HK Grotesk)
- Soft, generous border-radius
- Warm shadows with slight color tint
- Approachable, inviting, designed-for-moms feel
- Default for all new users

**2. Clean & Modern**
- All sans-serif typography (clean, minimal)
- Tighter border-radius
- Neutral shadows
- Crisp spacing, professional feel
- Similar to StewardShip's current aesthetic

**3. Nautical**
- StewardShip-inspired aesthetic
- Maritime typography choices
- Slightly textured backgrounds (subtle wave/rope patterns)
- Nautical accent elements
- Optional name pack add-on (see below)

**4. Cozy Journal**
- Handwriting-style headings
- Paper-like textures and backgrounds
- Scrapbook-inspired card styling
- Warmest, most personal aesthetic
- Sticker-like decorative elements

### Vibe + Theme Relationship
- **Vibe** = structural aesthetic (fonts, corners, shadows, textures)
- **Theme** = color palette (50+ colors across 9 families)
- **Gradient toggle** = on/off per user preference
- Users pick a vibe AND a color theme independently
- Any vibe works with any color theme

### Name Packs (Optional Add-On to Any Vibe)
Users can optionally apply a "name pack" that changes feature display names:

**Nautical Name Pack:**
- LiLa → The Helm
- Journal → The Log
- Tasks → The Compass
- Self-Knowledge → The Keel
- Guiding Stars → The Mast
- Growth Cycle → The Wheel
- Dashboard → Crow's Nest
- MindSweep → Unload the Hold
- People → Crew
- etc.

Name packs are independent of vibes - a user could use the Classic MyAIM vibe with the Nautical name pack, or the Nautical vibe with default MyAIM names. Complete freedom.

### Settings Location
Vibe selection lives in Settings (accessed via the gear icon in the floating top-right). It is NOT in the header bar. Settings contains: Vibe, Color Theme, Gradient Toggle, Name Pack, and other preferences.

---

## Authentication & Access Model

### Family Structure
```
auth.users (Supabase Auth)
  |
  +-- families (auth_user_id = primary parent)
       |
       +-- family_members
            |
            +-- Each member CAN have their own auth_user_id (for individual login)
            +-- Members without auth_user_id use PIN login
            +-- Each member's personal data scoped to their family_member_id
            +-- Primary parent sees family dashboard by default
            +-- All other members see their personal dashboard by default
```

### Login Methods
1. **Mom Login:** Email/password via Supabase Auth (full access)
2. **Individual Member Login:** Email/password for adults/teens with their own accounts
3. **Family Tablet Mode:** Signed into family account, "View As" with member selection
   - Members identified by avatar/image they select
   - Optional PIN protection per member
   - Parents/teens can require PIN to prevent younger kids accessing their dashboard
   - Younger kids can use image/avatar tap (no PIN required, configurable)
4. **PIN Login:** Family Name + Member Name + PIN (from MyAIM, already built)

### Shells (Role-Based Experiences)
Each family member sees a different "shell" based on their role and dashboard_mode:

| Shell | Who | Default Features |
|---|---|---|
| **Mom Shell** | Primary parent | Full access to everything: Command Center, Library Vault, Archives, LiLa, Inner Wisdom, Family Dashboards, Admin |
| **Adult Shell** | Dad, additional adults | Personal growth workspace + permission-based family access + meeting co-host |
| **Independent Shell** | Family members mom assigns to Independent mode | All personal growth features + mom-configured permissions (including whether LiLa is accessible) |
| **Guided Shell** | Family members mom assigns to Guided mode | Simplified versions of tasks, progress, victories, journal prompts. No LiLa access. |
| **Play Shell** | Family members mom assigns to Play mode | Visual tasks, sticker rewards, celebrations, emoji permitted. No LiLa access. |

> **Important:** Dashboard modes (Play, Guided, Independent) are assigned by the primary parent based on the child's readiness, NOT by numeric age. Mom knows her kids best. The UI never displays age-based labels like "ages 3-7." These are internal developer guidelines only.

### Permission Model
- **Mom:** Full access to everything. Admin of all family settings.
- **Dad/Adults:** View + permission-based for: family dashboard, children's dashboards, task assignment, reward management, meeting hosting, gamification management. Can share meeting notes/action items to other members' tasks or journal.
- **Independent:** Full personal features. LiLa access is a mom-configured permission (on or off). Can share items to family. Cannot access admin, other members' private data, or Library Vault admin features.
- **Guided/Play:** Limited to mode-appropriate features. Parent controls what's visible. No LiLa access.

> **Mode assignment principle:** Mom assigns each family member to Play, Guided, or Independent mode based on the child's maturity and readiness. She can change modes at any time. The system never auto-assigns modes based on age.

---

## Feature Inventory & Name Mapping

### Naming Convention
Features have THREE names:
1. **Database name** - the table/column name (never changes, snake_case)
2. **Internal name** - what developers call it in code (consistent across shells)
3. **Display name** - what the user sees (can vary by shell, some are user-customizable)

### Complete Feature Map

#### Personal Growth Features (from StewardShip, renamed)

| # | StewardShip Name | Database Name | Internal Name | Display Name (Default) | User Can Rename? | Shells |
|---|---|---|---|---|---|---|
| 1 | The Helm | helm_conversations | lila | LiLa | No | Mom, Adult, Independent (if mom permits) |
| 2 | The Mast | guiding_stars | guidingStars | Guiding Stars | No | Mom, Adult, Independent |
| 3 | The Keel | self_knowledge | selfKnowledge | (User chooses: Compass Rose, Inner Workings, My Blueprint, Operating System, or custom) | YES | Mom, Adult, Independent |
| 4 | The Wheel | growth_cycles | growthCycle | (User chooses: Growth Cycle, Turning Point, The Shift, or custom) | YES | Mom, Adult, Independent |
| 5 | The Log | journal_entries | journal | My Journal | No | Mom, Adult, Independent, Guided (prompted) |
| 6 | The Compass | tasks | tasks | My Tasks | No | All (adapted per shell) |
| 7 | Charts + Goals | goals, progress_trackers | progress | Progress & Goals | No | All (adapted per shell) |
| 8 | Victory Recorder | victories | victories | Victory Recorder | No | All (adapted per shell) |
| 9 | Crow's Nest | dashboard_configs | dashboard | My Dashboard | No | All (adapted per shell) |
| 10 | First Mate | partner_profile, partner_insights | partner | Partner Profile | No | Mom, Adult |
| 11 | Crew | people_profiles, people_notes | people | People & Relationships | No | Mom, Adult, Independent (simplified) |
| 12 | Sphere of Influence | my_circle_entities | myCircle | My Circle | No | Mom, Adult, Independent |
| 13 | Safe Harbor | safe_harbor_sessions | safeHarbor | Safe Harbor | No | Mom, Adult, Independent |
| 14 | The Manifest | knowledge_base_items, kb_chunks | knowledgeBase | Knowledge Base | No | Mom, Adult |
| 15 | Rigging | project_plans, plan_milestones | projectPlanner | Project Planner | No | Mom, Adult, Independent (optional) |
| 16 | Unload the Hold | mindsweep_sessions | mindSweep | MindSweep | No | Mom, Adult, Independent (simplified) |
| 17 | Reveille | morning_checkins | morningCheckin | Morning Check-in | No | Mom, Adult, Independent (optional) |
| 18 | Reckoning | evening_reviews | eveningReview | Evening Review | No | Mom, Adult, Independent (optional) |
| 19 | Life Inventory | life_checkin_snapshots | lifeCheckin | Life Check-in | No | Mom, Adult |
| 20 | Lists | lists, list_items | lists | Lists | No | Mom, Adult, Independent, Guided (view) |
| 21 | Meeting Frameworks | meetings, meeting_notes | meetings | Meetings | No | Mom, Adult (both can host) |

#### MyAIM-Originated Features

| # | Feature | Database Name | Internal Name | Display Name | Shells |
|---|---|---|---|---|---|
| 22 | Command Center | (routing, no table) | commandCenter | Command Center | Mom |
| 23 | Library Vault | library_items, library_categories, user_library_progress | library | Library Vault | Mom (full+admin), Adult (browse, future tier-gated), Independent (browse, future tier-gated) |
| 24 | Archives | archive_folders, archive_context_items | archives | Archives | Mom (full+admin), Adult (own folders), Independent (own folder) |
| 25 | Best Intentions | best_intentions, intention_categories | bestIntentions | Best Intentions | All (adapted per shell, privacy levels) |
| 26 | LiLa Optimizer | lila_conversations (prompt mode) | lilaOptimizer | LiLa Prompt Crafter | Mom, Adult, Independent (if mom permits) |
| 27 | Smart Notepad / Journal | (merged with journal) | journal (quick capture mode) | Smart Notepad | Mom, Adult, Independent |
| 28 | Family Dashboard | (aggregation views) | familyDashboard | Family Dashboard | Mom (full), Adult (if permitted) |
| 29 | Calendar | calendar_events, event_attendees | calendar | Calendar | All (individual + family views) |
| 30 | Rewards & Gamification | family_rewards, reward_transactions, gamification_progress | rewards | Rewards | Mom (admin), Adult (view + permission-based), Independent+Guided+Play (participate) |
| 31 | Inner Wisdom | inner_wisdom_sessions | innerWisdom | (User chooses: Inner Wisdom, Inner Guide, Inner Oracle, My Compass, or custom) | Mom, Adult |

#### New for v2

| # | Feature | Database Name | Internal Name | Display Name | Shells |
|---|---|---|---|---|---|
| 32 | Visibility & Sharing | (columns on all personal tables) | visibility | (no UI name - it's a toggle on each item) | All |
| 33 | Safety Monitoring | safety_flags | safetyMonitoring | (invisible to monitored members) | Primary parent always; additional parent-role members by permission |
| 34 | Homeschool Tracking | homeschool_logs, subject_configs | homeschoolTracking | Homeschool Tracker | Mom, Guided, Independent |
| 35 | Tasks: Opportunities | tasks (task_type='opportunity') | opportunities | Opportunities | All (adapted per shell) |
| 36 | View As (Tablet Mode) | (auth session management) | viewAs | View As | Family tablet login |
| 37 | Offline/PWA | (IndexedDB + sync) | offlineSync | (invisible - just works) | All |
| 38 | Subscription & Tier System | subscription_tiers, feature_access | subscriptionTier | (admin/billing UI) | Mom (admin) |
| 39 | Founding Member Status | (flag on families table) | foundingMember | (badge + pricing) | Mom (admin) |
| 40 | ThoughtSift (within Inner Wisdom) | thoughtsift_sessions | thoughtSift | ThoughtSift | Mom, Adult |

#### Future (Not in MVP, but schema-aware)

| # | Feature | Notes |
|---|---|---|
| 37 | Business Entity View | A "business" acts like a family member with its own self-knowledge, guiding stars, knowledge base. Mom toggles between personal and business contexts. Business StewardShip. |
| 38 | White-label / Creator Suite | Build and share family tools |
| 39 | Google Calendar Sync | Two-way calendar integration |
| 40 | n8n Workflow Integration | Advanced automation |
| 41 | Custom GPT / Gem Integration | Connect to external AI tools with context |

---

## Privacy & Sharing Model

### Core Rules
1. **All personal data is PRIVATE by default**
2. **Sharing is always opt-in** via a visibility toggle on each item
3. **Three visibility levels:** Private, Family, Parents Only
4. **Mom cannot override privacy** (builds trust, especially with teens and spouse)
5. **Sharing can be revoked at any time**

### What Mom Always Sees (regardless of sharing)
- Family-scoped data: shared tasks, family calendar, family Best Intentions
- Any item a member has explicitly shared
- Aggregate stats IF the member opts into stat sharing
- Teen safety flags (see Teen Safety Monitoring)

### What Mom Does NOT See (unless shared)
- Any member's journal entries
- Any member's Guiding Stars or self-knowledge
- Any member's Growth Cycle (Wheel) work
- Any member's Safe Harbor usage
- Any member's People/relationship notes

### Safety Monitoring
- LiLa monitors AI conversations for crisis keywords (for any member mom designates for monitoring)
- Flags are generated PRIVATELY for designated parent(s) only
- The monitored member does NOT know a flag was raised
- **Notification access is permission-based:** Primary parent always receives flags. Primary parent can grant notification access to any other parent-role family member (e.g., dad/spouse). This is a toggle in family settings.
- Trigger categories: self-harm indicators, substance use, eating disorder language, abuse indicators, severe bullying, other concerning patterns
- Designated parents receive a notification (configurable: in-app, email, or both)
- Flag includes context snippet and suggested resources
- This respects privacy while protecting safety
- Aligns with Faith & Ethics Framework safety guardrails

### Visibility Database Pattern
Every member-scoped table includes:
```sql
family_member_id UUID NOT NULL,
family_id UUID NOT NULL,
visibility TEXT DEFAULT 'private',  -- 'private', 'family', 'parents_only'
shared_at TIMESTAMPTZ,
```

---

## Smart Notepad (Right Drawer) - Complete Behavior

The Smart Notepad is the **central capture and editing hub** for the entire app. It is NOT a journal - it's the always-available workspace where content is created, edited, and routed to its permanent home. The core philosophy: **capture anything from one place, route it where it needs to go later.**

### Core Behavior
- Lives in the right drawer (defaults open on desktop, slide-in on mobile)
- `>` to collapse, `<` to reopen
- **Full-page mode:** Expand button (diagonal arrow) transitions the current tab to the full main content area for serious editing. Collapse button returns to drawer. Tab and content stay the same.
- **Autosaves continuously** - leaving the page and coming back, content is still there
- Content persists across sessions (saved to database) until routed or manually closed
- **Multiple tabs supported** - can have several captures going at once
- Each tab has its own X to close
- Voice-to-text input (microphone button) - see Voice & Extraction Pipeline section
- Tabs are auto-named by LiLa based on content (user can rename)

### Three Roles
1. **Fresh capture:** Start typing or speaking something new from scratch
2. **AI editing desk:** "Edit in Notepad" from any AI conversation to refine before saving
3. **Routing hub:** "Send to..." menu sends finished content to its permanent home

### "Edit in Notepad" Button
Available on every AI interaction in the app:
- Any LiLa conversation (general chat in bottom drawer)
- ThoughtSift sessions (within Inner Wisdom)
- Any Library Vault tool interaction (Higgins, Cyrano, marriage tools, etc.)
- Meeting transcripts after a meeting ends
- LiLa conversation history (reviewing past conversations)

User can send a **highlighted section** or the **whole conversation**. Content appears in a new Smart Notepad tab, fully editable.

### Routing UI: "Send to..." Grid Menu (Option B)
A clean "Send to..." button opens a two-section grid menu:

**Favorites section (top, larger buttons):** Top 3-4 most-used destinations, auto-sorted by usage frequency. Each shows a Lucide icon + label with a subtle tinted background.

**All Destinations section (below, compact grid):** Full grid of every routing option, 3 columns, Lucide icon + label for each:

| Destination | Lucide Icon | What Happens |
|---|---|---|
| Journal | BookOpen | Saves as journal entry (tagged, searchable) |
| Tasks (individual) | CheckSquare | LiLa parses into separate task items, opens Tasks page with drafts |
| Tasks (single) | ClipboardCheck | Saves entire note as one task, opens Tasks page |
| List | List | Saves items as a single list card with checkboxes, opens Lists page |
| Intention | Heart | Creates a Best Intention entry |
| Victory | Trophy | Records as a victory |
| Calendar | Calendar | Creates calendar event(s) |
| Self-Knowledge | Compass | Saves to Self-Knowledge profile |
| Guiding Stars | Star | Updates Guiding Stars |
| Note | StickyNote | Saves as a general note |
| Agenda | Users | Opens inline meeting picker overlay (see below) |
| Track Progress | BarChart2 | Opens inline chart/tracker picker overlay (see below) |
| Send to Person | Send | Opens inline family member picker overlay (see below) |

Below the grid: "Review & Route" button (LiLa extracts all items for individual routing).

### Inline Picker Overlay Pattern (Reusable Component)
Three destinations use the same inline picker overlay - a small menu that appears right within the Send To grid without navigating away:

| Destination | Picker Shows | Create New Option |
|---|---|---|
| Agenda | Upcoming meetings with agenda capability | "+Create Meeting" |
| Track Progress | Existing trackers/charts, LiLa pre-highlights suggested match | "+Create Tracker" |
| Send to Person | Connected family members with role/avatar | N/A |

Build once, use three times. Same UI component, different data source.

### Track Progress Routing
When user selects "Track Progress," the inline tracker picker appears showing all existing trackers. LiLa pre-highlights the suggested match based on content analysis. User confirms or picks a different one. LiLa extracts the data point and logs it.

Examples of smart matching:
- "Drank 8 glasses of water" → Water Intake tracker (pre-highlighted)
- "Jake did 45 min of math" → Homeschool: Math - Jake tracker (pre-highlighted)
- "Ran 2 miles" → Exercise tracker (pre-highlighted)
- "Read 30 pages" → Reading tracker (pre-highlighted)

If no matching tracker exists, "+Create Tracker" button creates a new one. On the Progress & Goals page, a **"Recently Tracked" review list** shows what was logged and where, with an Edit button on each entry for corrections. Items age off the review list after a day or two, but data stays permanently in the tracker.

### Internal Family Notes (Send to Person)
When user selects "Send to Person," the inline family member picker appears. User taps the recipient. Note is delivered to a **simple notification/inbox area on the recipient's dashboard.** Recipients can view, read, and reply (which sends a note back). Notes are private between sender and recipient only. This is lightweight internal messaging, not a full chat system.

### Tasks & Lists Routing Details

**"Save & Edit as Tasks" (individual):**
- LiLa parses content into separate task items
- Each becomes its own draft task card on the Tasks page
- User assigns family members, due dates, priority, recurrence, etc. on the Tasks page
- Supports bulk assignment (same task to multiple people)

**"Save as Single Task":**
- Entire note becomes one task (useful for complex tasks with sub-steps)
- Opens on Tasks page for configuration

**"Save & Edit as List":**
- Items stay grouped as a single list card with checkboxes
- Card gets a title (AI-suggested or user-named)
- Routes to Lists page as one unit
- **Reusable as template:** A list can be saved as reusable (e.g., "Weekly Chore List") and assigned fresh to different people on different schedules

### Notepad Tab Lifecycle After Routing
1. User routes content via "Send to..." → tab closes with brief "Undo" toast (few seconds to reverse)
2. Tab moves to **Notepad History** → tagged with destination (e.g., "Routed to: Tasks", "Routed to: Couple Meeting Agenda")
3. Clicking a history entry opens the content **in its destination tool** (not back in the notepad):
   - Routed to Tasks → opens Tasks page with that task
   - Routed to Agenda → opens meeting agenda view
   - Routed to List → opens Lists page with that list
   - Went through Review & Route → opens the extraction/routing page
4. History entries are sortable by date, name, status (active/routed/archived)
5. Can delete history entries or search through them

### Notepad History
- Every tab that has content is preserved (autosaved to database)
- **Active tabs:** Currently open in the drawer
- **Routed tabs:** Content was sent somewhere, tagged with destination + link
- **Archived tabs:** Manually closed without routing (still in history, can be reopened)
- Accessible via a dropdown in the notepad drawer header
- Full history view available from sidebar navigation

---

## Journal / The Log (Sidebar → Main Content)

The Journal is the **organized history view** of everything the user has captured and routed. It is primarily a read/filter/search interface, not a direct writing tool.

### What Appears in the Journal
Everything routed there from any source:
- Smart Notepad entries routed to Journal
- Reflections from morning/evening rhythms
- Best Intentions (tagged as such)
- Victories (tagged as such)
- General notes
- ThoughtSift session summaries (routed by user)
- Meeting notes (routed by user)
- MindSweep processed outputs (routed by user)
- Any content the user chose to "Add to Journal" from anywhere

### What Does NOT Appear in the Journal
- Raw LiLa/AI conversation transcripts (those live in LiLa Conversation History)
- Unrouted Smart Notepad content (still in the notepad tabs)
- Tasks (those live in the Tasks feature)
- Calendar events (those live in Calendar)

### Filtering & Search
- **Auto-tags:** System-generated based on content source (reflection, intention, victory, note, meeting, thoughtsift, mindsweep)
- **Custom tags:** User-created tags
- **System categories:** Based on which routing button was used
- **Date range:** Filter by time period
- **Source filter:** Where the content originated (Smart Notepad, ThoughtSift, Meeting, LiLa, etc.)
- **Full-text search:** Search content of all entries

### Creating New Entries
- `+` button in the Journal view opens the Smart Notepad (right drawer) for new entry creation
- The Journal itself is not a direct writing surface

---

## LiLa Conversation History (Separate from Journal)

All AI conversations are saved in their own history, completely separate from the Journal.

### What Gets Saved
- Every LiLa conversation (general chat from bottom drawer)
- Every ThoughtSift session
- Every Library Vault tool interaction (Higgins, Cyrano, etc.)
- Meeting transcripts (the raw recording/transcript, separate from routed meeting notes)

### Capabilities
- Browse past conversations by date, type, or search
- Continue a previous conversation (pick up where you left off)
- "Edit in Notepad" button available on any past conversation
- View which items were extracted/routed from a conversation

### Relationship to Journal
- Conversation history = raw AI interactions (complete record)
- Journal = user-curated content (only what the user chose to keep)
- The Smart Notepad bridges the two (edit in notepad → route to journal)

---

## Voice & Extraction Pipeline

### Voice-to-Text Availability
Voice input is available **everywhere text input is allowed** - microphone button appears alongside any text input field in the app. However, the behavior after recording depends on context:

**From LiLa (bottom drawer):**
- Voice becomes part of the conversation with LiLa (as if they typed it)
- LiLa responds naturally to what was said
- It's a conversation, not a transcript
- "Edit in Notepad" and "Review & Route" available on the conversation

**From Meetings:**
- Creates a transcript record of the meeting
- User can review the raw transcript
- "Extract & Route" button triggers the extraction pipeline
- Extracted items appear as routable cards
- Full transcript saved to meeting history regardless

**From Smart Notepad:**
- Creates raw text in the current tab (no automatic extraction)
- User decides what to do: edit as a document, route with bottom buttons, or hit "Review & Route" to trigger LiLa extraction
- Maximum flexibility - it's their workspace

**From any LiLa tool conversation (Cyrano, Higgins, ThoughtSift, etc.):**
- Voice input works as conversation with that tool
- "Review & Route" extracts the relevant outputs (the compliment from Cyrano, talking points from Higgins, insights from ThoughtSift)
- "Edit in Notepad" grabs content for hands-on refinement

### Two Universal Actions

These two actions are available **everywhere content exists** in the app. They always behave the same way:

**1. "Review & Route"**
Available on: Smart Notepad tabs, LiLa conversations, meeting transcripts, ThoughtSift sessions, Library tool outputs, any content surface.

What it does: LiLa scans the content, extracts actionable/saveable items, presents them as cards with routing buttons (Task, Journal, Intention, Victory, Calendar, List, Self-Knowledge, Guiding Stars, Note, Skip).

**2. "Edit in Notepad"**
Available on: Any LiLa conversation, any Library tool output, meeting transcripts, past conversation history, extracted items, any content surface.

What it does: Grabs the selected content (a section or the whole thing) and opens it in a new Smart Notepad tab for hands-on editing. From there, the user can refine it and use the bottom routing buttons or "Review & Route" when ready.

### Transcription Technology
- **Online (primary):** OpenAI Whisper API - real-time transcription, words appear as user speaks (2-3 second delay), highly accurate
- **Offline (fallback):** Browser Web Speech API - real-time, free, less accurate
- **Cost:** Whisper = ~$0.006/minute ($0.36/hour). Extremely affordable even for heavy use.
- **Future enhancement:** Hybrid approach using browser API for live display with Whisper cleanup pass for accuracy

### The Record → Transcribe → Extract → Route Pipeline

This is one of the platform's most differentiating features. The complete flow:

**1. Record**
User taps microphone in any input area. Audio streams to Whisper in real-time chunks. Text appears as they speak.

**2. Transcribe**
Full transcript available immediately when recording stops. Text lands in the appropriate location (Smart Notepad tab, Meeting record, or LiLa conversation).

**3. Extract**
- **Meetings:** Automatic extraction after recording stops. LiLa processes immediately.
- **Smart Notepad:** On-demand via "Review & Route" button. User decides when/if to extract.
- **LiLa conversations:** On-demand via "Review & Route" button on the conversation.

AI identifies and extracts structured items:
- Action items → suggested as Tasks
- Commitments/goals → suggested as Best Intentions
- Calendar dates/events → suggested as Calendar entries
- Emotional insights → suggested as Journal entries
- Personal revelations → suggested as Self-Knowledge
- Concerns/flags → suggested as Notes or Safety Flags (if applicable)
- Shopping/needs → suggested as List items
- Victories/accomplishments → suggested as Victories

**4. Review**
Extracted items appear as cards, each with routing buttons (same Lucide icon grid as the Smart Notepad "Send to..." menu):

```
Extracted from: Tuesday check-in with Jake (12 min)

┌─────────────────────────────────────────────────┐
│ "Jake wants to try out for basketball"           │
│ [Task] [Intention] [Note] [Calendar] [Skip]     │
├─────────────────────────────────────────────────┤
│ "Practice starts March 15th"                     │
│ [Calendar] [Task] [Note] [Skip]                 │
├─────────────────────────────────────────────────┤
│ "He's feeling nervous about tryouts"             │
│ [Journal] [Self-Knowledge] [Note] [Skip]        │
├─────────────────────────────────────────────────┤
│ "We agreed to practice together Saturdays"       │
│ [Task] [Intention] [Calendar] [Skip]            │
├─────────────────────────────────────────────────┤
│ "He mentioned Marcus is being mean at school"    │
│ [Journal] [Note] [Skip]                         │
├─────────────────────────────────────────────────┤
│ "Wants new basketball shoes"                     │
│ [List] [Task] [Skip]                            │
└─────────────────────────────────────────────────┘

[Route All Selected] [Edit Transcript in Notepad] [Save Transcript Only]
```

Each extracted item is editable before routing. User clicks the destination button for each item. Skipped items remain in the transcript but don't get routed anywhere.

**5. Route**
Selected items are sent to their destinations. The full transcript is always saved to the conversation/meeting history regardless of what was extracted.

### Use Cases
- **Family meeting:** Record discussion, auto-extract action items, commitments, calendar dates
- **Couple meeting:** Extract relationship insights, shared goals, follow-ups, prayer intentions
- **Mentor session (parent-child):** Extract what the child shared, commitments, encouragements, concerns
- **MindSweep / Brain dump:** Stream-of-consciousness voice capture, LiLa sorts chaos into categories
- **Voice journal:** Talk through your day, LiLa extracts the meaningful bits
- **Quick capture:** Voice note while driving, hands full, etc. - process later

### Human-in-the-Mix
Nothing routes automatically without user confirmation. AI extracts and suggests, the user reviews every item and decides where it goes (or skips it). This aligns with the Faith & Ethics Framework principle that AI suggests, human decides.

---

## Data Flow Overview

### LiLa (AI Chat) - Central Hub
LiLa is the AI chat interface. It exists as a **persistent drawer** (available from any page) and a **full page** (for longer conversations). It also has a **prompt optimization mode** (LiLa Prompt Crafter) for creating prompts to use on other AI platforms.

**LiLa reads from:**
1. Guiding Stars (always loaded as baseline context)
2. Self-Knowledge (loaded when personality context improves response)
3. Active Growth Cycle data (if user is working on one)
4. Partner Profile (if relationship topic)
5. People profiles (if specific people mentioned)
6. My Circle data (if relationship/boundary topic)
7. Knowledge Base RAG results (if relevant)
8. Recent journal entries (if user references recent events)
9. Progress/goals summary (if trends relevant)
10. Today's tasks (if task-related)
11. Active project plans (if planning topic)
12. Current page context (which page the drawer was opened from)
13. Best Intentions (active, relevant ones)
14. Archive context items (active checkboxes)
15. Family member profiles (if discussing a family member)

**LiLa writes to:**
- Journal entries (user confirms save)
- Tasks (user confirms creation)
- Victories (user confirms recording)
- Self-Knowledge (user confirms insights)
- Guiding Stars (user confirms declarations)
- People profiles (user confirms saving context about someone)

### Smart Notepad + Journal (Clarified Roles)
**Smart Notepad** = input/editing tool (right drawer, always available)
**Journal** = organized history view (sidebar → main content)

Smart Notepad captures and routes. Journal displays and filters. LiLa conversation history stores raw AI interactions separately.

**Routing options from Smart Notepad:**
- Save as journal entry (tagged, searchable)
- Create a task or opportunity
- Add to a list
- Add as Best Intention
- Record as a victory
- Save to Self-Knowledge or Guiding Stars
- Add to Calendar
- Just capture (raw note, unprocessed)

### Tasks & Opportunities
Task types: **task** (required), **routine** (recurring), **opportunity** (optional, earn credit)

Opportunities appear as "things you can do" on dashboards - not assigned or required, but completing them earns points/recognition. Great for teaching initiative.

### Family Dashboard Aggregation
Mom's Family Dashboard pulls ONLY shared data:
- Shared victories from all members
- Family-scoped tasks and completion status
- Family Best Intentions
- Shared goal progress (opted-in members)
- Family calendar events
- Per-member cards showing what they've chosen to share

### Meeting Notes Routing
After a meeting (Couple Meeting, Parent-Child Mentor, etc.), notes and action items can be routed to:
- Either participant's journal
- Either participant's tasks
- Either participant's Best Intentions
- Shared family Best Intentions

Both mom and dad can host meetings and share outputs.

---

## Self-Knowledge Sharing (Special Case)

Self-Knowledge entries (personality, strengths, growth areas, preferences) have special sharing value:
- **Spouse sharing:** Spouse can share selected self-knowledge items to help their partner understand them better, and for AI to help with relationship interactions
- **Parent-child sharing:** Independent members can share selected items to help parents understand their perspective
- **Parent access to child self-knowledge:** Parents can see items children have explicitly shared. Helps AI give parents better advice about interacting with that child.
- **This is NOT automatic.** Each item is individually toggled for sharing.

---

## Library Vault Access Model

| Role | Browse | Use Tools | Comment | Admin | LiLa Optimize |
|---|---|---|---|---|---|
| Mom | Yes | Yes | Yes | Yes | Yes |
| Adult | Yes (view only, future tier-gated) | Yes | No | No | Yes |
| Independent | Yes (view only, future tier-gated) | Yes (curated) | No | No | Yes (if mom permits LiLa) |
| Guided | No | Curated only | No | No | No |
| Play | No | No | No | No | No |

Library Vault is primarily a mom space. Others can browse and use tools but cannot comment or contribute. This preserves it as a community space for moms.

> **Future tier-gating:** Adult and Independent browse access will eventually be gated to higher subscription tiers. The permission system should support this from day one even though we don't enforce it at MVP.

---

## Homeschool Tracking (Forward-Looking Schema)

Not in MVP but the task/activity schema must support:
- **Subject tagging** on tasks and activities
- **Time logging** per activity
- **Double-dipping configuration:** Can an activity count for multiple subjects? (e.g., writing about science counts for both Writing and Science)
- **Per-family subject configuration:** What subjects does this family track?
- **Report generation:** Configurable time period, subject breakdown, hours logged
- **Integration with Progress & Goals:** Subject hours feed into progress tracking

Schema hooks needed from day one:
```sql
-- On tasks table
subject_tags TEXT[] DEFAULT '{}',
time_logged_minutes INTEGER,
homeschool_tracked BOOLEAN DEFAULT false,

-- New table (created when feature is built)
homeschool_subject_configs (
  family_id, subject_name, allows_overlap BOOLEAN,
  minimum_hours_per_period, period_type
)

homeschool_activity_logs (
  family_member_id, task_id, subject_tags,
  minutes_logged, date, notes, overlap_approved_by
)
```

---

## Subscription Tier System (Future-Ready Architecture)

The app will eventually support tiered subscription access. While we don't enforce tiers at MVP, the architecture must support them from day one.

### Architecture Approach
- `subscription_tiers` table defines available tiers and their features
- `feature_access` table maps `tier + feature_key = enabled/disabled`
- Central `useCanAccess('feature_key')` hook checks permissions before rendering any gated component
- Every feature that might eventually be tier-gated should use this hook even at MVP (just returns true for now)
- This means adding tier-gating later is a configuration change, not a refactor

### Planned Tiers (from v1, subject to change)
- **Essential** ($9.99/mo) - Core features
- **Enhanced** ($16.99/mo) - Personal growth features, family dashboards
- **Full Magic** ($24.99/mo) - All features including Inner Wisdom, model choice
- **Creator** ($39.99/mo) - Build and share tools

### Founding Member Program
- First 100 sign-ups get `founding_member: true` flag on their family record
- Founding members receive permanently locked discounted pricing
- `founding_discount_percent` field on families table
- Founding member badge displayed in their profile
- This is a simple flag + discount field, no complex logic needed at MVP

---

## Inner Wisdom Portal (User-Named)

**Database name:** `inner_wisdom_sessions` (and `thoughtsift_sessions` within it)
**Display name:** User chooses from: Inner Wisdom (default), Inner Guide, Inner Oracle, My Compass, or custom

Inner Wisdom is the dedicated portal for deeper personal processing, personality understanding, and guided reflection. It contains ThoughtSift as its core conversation tool.

### ThoughtSift Post-Session Routing

After a ThoughtSift conversation ends, the user gets a **Route & Review** screen (same pattern as StewardShip's post-conversation flow):

**Routing options:**
- Save insights to Self-Knowledge
- Create tasks from action items
- Add to Journal
- Update Guiding Stars
- Record a victory
- Add a Best Intention
- Save to a list
- Route to a specific person in My Circle (notes about that relationship)
- Just close (capture conversation transcript only)

Each routable item from the conversation is presented as a card the user can review, edit, and choose where to send. Nothing routes automatically - the user confirms every save.

---

## Mode Assignment (Play / Guided / Independent)

### Core Principle
**Mom assigns dashboard mode based on her child's readiness, NOT based on numeric age.** The system never auto-assigns modes. Mom can change a member's mode at any time in family settings.

### What Each Mode Controls
- Which features appear in the member's dashboard
- Which UI complexity level is used (simplified vs full)
- Whether LiLa access is available (Independent only, and only if mom permits)
- Content complexity and language level
- Available gamification themes and reward types

### Mode Descriptions (Internal Developer Reference Only)
These descriptions help developers understand the target maturity level. They are NEVER shown in the UI:
- **Play Mode:** Designed for early readers and pre-readers. Large visual elements, tap-based interaction, sticker rewards, celebration animations. Emoji permitted.
- **Guided Mode:** Designed for members who can read and follow instructions but benefit from simplified interfaces and prompted interactions. Journal prompts instead of freeform, curated task views.
- **Independent Mode:** Full-featured personal growth workspace. All features available (subject to mom's permission toggles). Most similar to the Adult shell but with safety monitoring capability.

### No Age Labels in UI
The UI refers to modes by name only: Play, Guided, Independent. Never "ages 3-7" or "for younger kids." This respects that every child develops differently and mom is the expert on her own children.

---

## Offline/PWA Sync Model

**When online:**
- Supabase real-time subscriptions keep all devices in sync immediately
- Changes on any device appear on all other online devices in real time

**When offline:**
- Changes save to IndexedDB on the device
- Queue of pending changes builds up
- Visual indicator shows "offline" and "X changes pending"
- When connectivity returns, changes sync to Supabase
- Conflict resolution: last-write-wins with "recently synced" indicator
- Critical: tasks, journal entries, and victories should work seamlessly offline

---

## Build Order (PRD Sequence)

| PRD | Feature | Priority | Depends On |
|---|---|---|---|
| PRD-00 | System Overview (this document) | Foundation | - |
| PRD-01 | Auth & Family Setup | Critical | - |
| PRD-02 | Design System & Themes | Critical | - |
| PRD-03 | Shell Routing & Navigation (incl. Mode Assignment) | Critical | PRD-01 |
| PRD-04 | LiLa (AI Chat) | Critical | PRD-01, PRD-02, PRD-03 |
| PRD-05 | Self-Knowledge (user-named) | High | PRD-01 |
| PRD-06 | Guiding Stars | High | PRD-01 |
| PRD-07 | Journal + Smart Notepad | High | PRD-01, PRD-04 |
| PRD-08 | Tasks & Opportunities | High | PRD-01, PRD-03 |
| PRD-09 | Progress & Goals | High | PRD-08 |
| PRD-10 | Victory Recorder | High | PRD-01, PRD-04 |
| PRD-11 | Visibility & Sharing | High | PRD-01 (applies to all personal features) |
| PRD-12 | Archives & Context | High | PRD-01, PRD-11 |
| PRD-13 | Best Intentions | High | PRD-01, PRD-06 |
| PRD-14 | Family Dashboard | High | PRD-11, PRD-08, PRD-10 |
| PRD-15 | Play Mode Dashboard | Medium | PRD-03, PRD-08, PRD-10 |
| PRD-16 | Guided Mode Dashboard | Medium | PRD-03, PRD-08, PRD-10 |
| PRD-17 | Safety Monitoring (permission-based) | High | PRD-04, PRD-11 |
| PRD-18 | Growth Cycle (user-named) | Medium | PRD-05, PRD-06, PRD-04 |
| PRD-19 | Life Check-in | Medium | PRD-04, PRD-05 |
| PRD-20 | My Circle & People | Medium | PRD-01, PRD-12 |
| PRD-21 | MindSweep | Medium | PRD-04, PRD-07, PRD-08 |
| PRD-22 | Library Vault | Medium | PRD-01, PRD-03 |
| PRD-23 | Rhythms (Morning/Evening) | Medium | PRD-06, PRD-08, PRD-09 |
| PRD-24 | Meetings | Medium | PRD-04, PRD-07 |
| PRD-25 | Lists | Medium | PRD-01 |
| PRD-26 | Calendar | Medium | PRD-01, PRD-08 |
| PRD-27 | Rewards & Gamification | Medium | PRD-08, PRD-10 |
| PRD-28 | Partner Profile | Medium | PRD-05, PRD-04 |
| PRD-29 | Safe Harbor | Medium | PRD-04, PRD-05 |
| PRD-30 | Inner Wisdom Portal + ThoughtSift (user-named) | Medium | PRD-04, PRD-05, PRD-06, PRD-13 |
| PRD-31 | Knowledge Base (RAG) | Lower | PRD-04, PRD-12 |
| PRD-32 | Project Planner | Lower | PRD-04, PRD-06, PRD-08 |
| PRD-33 | Subscription Tier System | Lower | PRD-01 (hooks from day one, UI later) |
| PRD-34 | Offline/PWA | Lower | All core features |
| PRD-35 | Homeschool Tracking | Lower | PRD-08, PRD-09 |
| PRD-36 | View As / Tablet Mode | Medium | PRD-01, PRD-03 |

---

## Source Repositories

### Active Repos
- **StewardShip:** github.com/littlelanterns/StewardShip - standalone personal growth app (husband testing now)
- **MyAIM_Central:** github.com/littlelanterns/MyAIM_Central - current family platform (v1, mostly scaffolding)
- **MyAIM_Family:** [NEW REPO - to be created] - unified v2 platform

### What Gets Ported From Where
- **From StewardShip:** Component library, hooks pattern, service layer, all feature code (renamed), edge functions, theme system
- **From MyAIM:** Family auth system, PIN login, Archives system, Best Intentions, Library Vault, multi-member architecture, theme colors (50+), task/reward integration
- **Built fresh:** Visibility system, shell routing, family dashboard aggregation, teen safety monitoring, tablet View As mode, offline sync

### StewardShip Stays Alive
The standalone StewardShip repo continues for husband's immediate use and testing. It does NOT need to stay in sync with the unified app. The unified app takes the best patterns and adapts them independently.

---

## Database: Separate Supabase Project

A brand new Supabase project will be created for MyAIM Family v2.

**Reasoning:**
- Neither current project has real user data to preserve
- Clean schema designed for unified multi-user model from day one
- No legacy table structures to work around
- StewardShip's husband data can be migrated via SQL export/import when ready

**Schema approach:**
- Each PRD defines its own tables
- All tables documented in this master document as PRDs are completed
- One comprehensive migration file per PRD
- All RLS policies consolidated in a separate migration for clarity

---

## Open Questions (Tracked, Decide As We Go)

1. ~~Hosting~~ -> Fresh Vercel project. Archive old ones when ready.
2. ~~Domain~~ -> myaimcentral.com when ready.
3. ~~StewardShip data migration~~ -> SQL export/import.
4. ~~Library content~~ -> None exists yet. Just need the add/admin system.
5. ~~Teen onboarding~~ -> Mom sets up + invite code. PIN-based login. View As on tablets.
6. **Notification system** -> TBD. Push notifications for rhythms, task reminders, shared victories?
7. ~~Offline~~ -> Yes, IndexedDB with sync-on-reconnect.
8. **Business Entity View** -> Future feature. Schema-aware but not built in MVP.
9. **Figma/FigJam integration** -> Use for PRD visualization during planning phase.
10. **Supabase region** -> TBD (avoid us-east-1 issues from before?)

---

## Appendix: Quick Reference

### Design Rules
- No Unicode emoji in adult interfaces (lucide icons are fine)
- Mobile-first always
- Modal-based interaction preferred over full page navigation
- Theme-aware: all colors via CSS variables
- Gradient toggle per theme
- Text-based buttons (no emoji buttons)

### Privacy Rules
- Private by default on all personal data
- Three levels: Private, Family, Parents Only
- Mom cannot override (except teen safety flags)
- Sharing revocable at any time

### Naming Rules
- Database: snake_case, never changes
- Components: PascalCase
- Hooks: camelCase with use prefix
- CSS variables: kebab-case with --color- prefix
- User-facing: configurable where noted, otherwise consistent across shells

### Faith & Ethics Quick Reference
- Enhancement, not replacement
- Human-in-the-Mix on all AI outputs
- Faith context only when relevant
- Processing partner, not companion
- Crisis detection with appropriate resources
- No clinical diagnoses from AI
- Redirect to human connection and professional help when needed
