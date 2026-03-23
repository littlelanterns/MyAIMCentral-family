# PRD-25: Guided Dashboard

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder & Daily Celebration), PRD-14 (Personal Dashboard — shared architecture), PRD-15 (Messages, Requests & Notifications), PRD-18 (Rhythms & Reflections), PRD-24 (Gamification Overview & Foundation), PRD-24A (Overlay Engine / Gamification Visuals)
**Created:** March 17, 2026
**Last Updated:** March 17, 2026

---

## Overview

PRD-25 defines the Guided Dashboard — the personal home screen for family members assigned to the Guided shell. This is the dashboard for kids who can read and follow instructions but benefit from simplified interfaces, prompted interactions, and mom-managed structure. The typical Guided member is an upper-elementary to middle-school child (~4th-6th grade, ages 8-12), though mom may assign it to a precocious 7-year-old or a slightly delayed or immature 13-15-year-old. Mom assigns based on readiness, never age.

The Guided Dashboard serves two very different kids equally well: a 10-year-old who loves codes, ciphers, and WW2 documentaries, and a 9-year-old who isn't quite reading yet but thrives with audiobooks and drawing. Both participate in the same activities and keep up in their own way. The dashboard must feel complete and capable to the first kid while remaining accessible to the second — never patronizing to either.

The Guided Dashboard reuses the section/grid hybrid architecture from PRD-14 (Personal Dashboard), consuming the same `dashboard_configs` table and widget rendering infrastructure from PRD-10. The key differences from adult dashboards: sections are mom-arranged (child can only reorder widgets, not sections), a prominent Next Best Thing button provides one-tap decision support, the Write drawer connects to the messaging system with spelling and grammar coaching, gamification is woven throughout the experience rather than siloed, and optional Reading Support accommodations serve kids at the lower end of the readability range without requiring a mode change to Play.

> **Design principle:** A Guided member's dashboard should feel like *their* space — not a locked-down version of mom's. Mom decides the structure, but within that structure, the child has agency: they can reorder their widgets, cycle through Next Best Thing suggestions, write freely in the notepad, record their own victories, and interact with every element on their screen. The dashboard celebrates what they've accomplished and gently points them toward what's next.

> **Depends on:** PRD-04 (Shell Routing) defines the Guided shell container — simplified sidebar, bottom nav, optional lightweight notepad drawer. PRD-14 defines the shared dashboard architecture, `dashboard_configs` table, and section/grid hybrid model. PRD-10 defines widget grid mechanics. PRD-24 defines gamification points, streaks, and rewards. PRD-24A defines Visual Worlds and overlays that skin the experience. PRD-11 defines the DailyCelebration 5-step sequence.

---

## User Stories

### Landing Experience
- As a Guided member, I want to land on my dashboard and immediately see something encouraging — my name, my progress, and what's happening today — so I feel welcomed and ready to engage.
- As a Guided member, I want my dashboard to feel like my own space that my mom set up for me, not like a watered-down adult app.
- As a mom, I want to arrange my Guided child's dashboard sections and assign widgets so their home screen shows exactly what I want them to focus on.

### Next Best Thing
- As a Guided member, I want to tap one button and be told what I should do next so I never have to stare at my task list wondering where to start.
- As a Guided member, I want to tap the button again if I don't want to do what it suggests, and get a different suggestion, so I have some agency in my day.
- As a mom, I want the Next Best Thing suggestions to respect the priorities I've set — if I marked math as the most important task today, that should come first.

### Writing & Communication
- As a Guided member, I want a writing space where I can jot down thoughts, draft messages to my parents or siblings, or just write freely, so I have a place for my words.
- As a Guided member, I want spell check that helps me learn — not just squiggly lines, but brief explanations of why a word is wrong, so I get better at writing over time.
- As a mom, I want to decide whether my child gets spelling coaching explanations or just standard spell check, because I know my child's tolerance level.

### Reflections
- As a mom, I want to enable reflection prompts for my Guided child so they build the habit of thinking about their day, without forcing every family into the same practice.
- As a Guided member, I want to answer reflection questions in my own time (from the Write drawer) or as part of my evening celebration, depending on what my mom set up.

### Reading Support
- As a mom, I want to enable reading support for my Guided child who struggles with reading, so they can participate fully in Guided mode without needing to be moved to Play mode.
- As a Guided member with reading support, I want to tap a speaker icon next to any text and hear it read aloud, so I can understand everything on my screen even when the words are hard.

### LiLa Tools
- As a Guided member, I want to ask LiLa for help with my homework when my mom has allowed it, so I can get unstuck without waiting for a parent.
- As a Guided member, I want LiLa to help me figure out how to talk to my parents or siblings about something that's bothering me, so I feel prepared before I bring it up.

### Gamification
- As a Guided member, I want to see my points, streaks, and Visual World progress on my dashboard at all times so I know how I'm doing and feel motivated.
- As a Guided member, I want completing a task to feel rewarding — a brief animation, points going up, progress moving forward.

### Graduation
- As a Guided member being moved to Independent, I want the transition to feel exciting — like I earned something — with a celebration and a walkthrough of my new capabilities.
- As a mom, I want graduating my child to Independent to be a one-tap decision with confidence that their data carries over and they'll be guided through the new experience.

---

## Screens

### Screen 1: Guided Dashboard Home

> **Depends on:** PRD-04 Guided shell container. PRD-14 section/grid hybrid architecture. PRD-10 widget grid. PRD-24 gamification data.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────────┐
│  Header                                                        │
│  "Good morning, Ethan!"                       ⭐ 247  🔥 12   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🎯 Next Best Thing                                      │  │
│  │  "Time for your math lesson! You're on a roll this week."│  │
│  │                                    [Do This] [Something  │  │
│  │                                               Else]      │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ▼ Calendar — Today, March 17                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  9:00 AM  Math with Mrs. Johnson                          ││
│  │  1:00 PM  Swimming                                        ││
│  │  3:30 PM  Free time                                       ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  ▼ My Tasks — 4 to do today                                   │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  ☐ Math lesson (Chapter 7)               ⭐ 10            ││
│  │  ☐ Read for 20 minutes                   ⭐ 5             ││
│  │  ☐ Clean room                            ⭐ 5             ││
│  │  ☐ Practice piano — 15 min               ⭐ 5             ││
│  │                                                            ││
│  │  ── Opportunities ──                                       ││
│  │  ☐ Help with dinner prep                 ⭐ 15            ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  [Widget Grid — mom-arranged]                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │ 🐉 Dragon│ │ 📖 Read- │ │ ⭐ Star  │                      │
│  │ Academy  │ │ ing Log  │ │ Chart    │                      │
│  │ Stage 2  │ │ 14/20 bks│ │ ████░░░  │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🎉 Celebrate! — See today's victories                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  🏠 Home | ✅ Tasks | 📝 Write | ⭐ Victories | 📊 Progress  │
└────────────────────────────────────────────────────────────────┘
```

**Header:**
- Personalized greeting using the member's name. Tone is warm and encouraging, slightly larger font per Guided shell tokens (PRD-03). Uses time-of-day variants: "Good morning," "Good afternoon," "Good evening."
- Gamification progress indicators in the header area: current point/currency balance (using mom's chosen currency name per PRD-24) and active streak count with flame icon. Both are always visible. If gamification is disabled for this member, these indicators are hidden — no empty space.
- If the member has Guiding Stars entries with `is_included_in_ai = true`, a rotating declaration appears below the greeting (same rotation logic as PRD-14, same data source as PRD-06). Most Guided members won't have Guiding Stars entries, so this line hides automatically when there are no eligible entries.

**Next Best Thing card:**
- Prominent card immediately below the header. Visually distinct — slightly elevated, accent-colored border per the member's Visual World theme (PRD-24A), with a target/compass icon.
- Displays one suggestion at a time: the suggested action (task title, routine step, or opportunity name) and an AI-generated encouraging sentence connecting the suggestion to context (time of day, streak, progress). The encouragement is brief — one sentence, age-appropriate.
- Two action buttons: **[Do This]** navigates to the relevant task/routine/opportunity for completion. **[Something Else]** cycles to the next suggestion with a brief shuffle animation.
- Tapping [Something Else] repeatedly cycles through available suggestions. After all reasonable suggestions are exhausted, shows: "You're all caught up! Nice work." with a small celebration sparkle.
- If no tasks, routines, or opportunities are pending, the card shows: "Nothing on the list right now. Enjoy your free time!" — never an empty or error state.

**Next Best Thing logic (non-AI, with AI glaze):**

The suggestion engine is primarily logic-driven, with AI generating only the encouraging wrapper text.

Priority order for suggestion selection:
1. **Overdue tasks** — any task past its due date/time
2. **Active routine in progress** — if a routine has been started but not completed, suggest the next incomplete step
3. **Current time-block task** — if a task has a scheduled time that matches now (within 15-minute window)
4. **Mom-prioritized tasks** — tasks where mom set `importance_level` = critical_1 or flagged as priority for today
5. **Next due task** — the task with the earliest due date/time that hasn't been started
6. **Available opportunities** — claimable opportunities sorted by point value (highest first), showing the most rewarding option
7. **Unscheduled tasks** — remaining assigned tasks with no specific time, sorted by mom's priority weighting if set, otherwise by creation order

When the user taps [Something Else], the engine moves to the next item in the priority list. It does not re-randomize — the order is deterministic so the child gets consistent guidance.

AI glaze: After the logic engine selects the suggestion, a lightweight AI call (Haiku-class) generates one encouraging sentence. Context provided to AI: task title, time of day, current streak count, member's name. The AI sentence is cached per suggestion for the session — tapping [Something Else] and coming back to a previous suggestion reuses the cached text.

> **Cost note:** The AI glaze call happens once per suggestion per session. With an average of 3-5 suggestions per day and Haiku-class costs, this is <$0.001/member/day.

**Calendar section:**
- Collapsible, same calendar display component as PRD-14. Self-only filter (Guided members see only their own events).
- Default view: day view showing today's events chronologically. Week/month toggle available but defaults to day for Guided (simpler at a glance).
- Tap a date to see the day detail overlay (PRD-14 Screen 3).
- Section order controlled by mom via dashboard management.

**Active Tasks section:**
- Collapsible, labeled "My Tasks" (not "Active Tasks" — warmer language for kids).
- Shows today's assigned tasks with two view options: **Simple List** (default — plain checkboxes, drag reorder) and **Now/Next/Optional** (integrates Opportunities per PRD-09A).
- Each task shows: checkbox, task title, and point value if gamification is enabled (star icon + number).
- Opportunities appear below a subtle divider labeled "Opportunities" within the Now/Next/Optional view.
- Task completion triggers the PRD-24 gamification pipeline: brief celebration animation (gentle scale + color pulse per PRD-03 Guided shell tokens), point increment visible in the header, and streak update if applicable.
- If a task requires approval (PRD-09A), completion shows the task in a "Waiting for Mom" state with a clock icon instead of a checkmark.
- Routine tasks expand to show step progress when tapped (per PRD-09A routine architecture).

**Widget grid:**
- Same grid architecture as PRD-14 / PRD-10. Widgets render inside the grid using Guided shell tokens.
- Mom arranges and assigns widgets. Child can reorder within the grid (drag-and-drop) but cannot resize, delete, or create widgets.
- Gamification widgets (Visual World progress card, star chart, streak calendar, reward progress, treasure box) appear as mom-assigned widgets in this grid (per PRD-24 I-16 through I-25).
- Widget touch targets use Guided shell minimum of 48px (PRD-04).

**Celebrate! button:**
- Full-width button near the bottom of the scrollable content. Gold gradient, prominent, with celebration emoji.
- Tapping launches the DailyCelebration 5-step sequence (PRD-11) as a full-screen overlay.
- Button label adapts: "Celebrate!" when victories exist for today, "Celebrate!" when none exist (the sequence handles the empty state gracefully — PRD-11 shows the opener animation regardless, then "Let's make tomorrow amazing!" for the close).

**Section ordering:**
- All section order is controlled by mom via dashboard management (Settings → Family Management → member → Manage Dashboard).
- Default section order: Greeting → Next Best Thing → Calendar → My Tasks → Widget Grid → Celebrate.
- Mom can hide sections (except Greeting and Next Best Thing, which are always visible).
- Hidden sections show in mom's management view with reduced opacity.

**Data read:**
- `dashboard_configs` row for this member (layout, preferences, section order)
- `tasks` and `task_completions` for today's assigned tasks
- `calendar_events` for today's events (stub until PRD-14B)
- `gamification_balances` for point/currency display
- `streaks` for active streak count
- `guiding_stars` for declaration rotation (if entries exist)

---

### Screen 2: Write Drawer

> **Depends on:** PRD-08 (Journal + Smart Notepad) drawer architecture. PRD-15 (Messages) messaging system. PRD-18 (Rhythms & Reflections) reflection prompt library.

**What the user sees:**

The Write drawer slides in from the right side of the screen, overlaying whatever page the child was viewing. Triggered by tapping the "Write" button in the bottom nav. The right-edge pull tab is also present as a secondary trigger on tablet/desktop.

```
┌──────────────────────────────────────────────────────┐
│  Write                                          [✕]  │
│  ─────────────────────────────────────────────────── │
│  [📝 Notepad] [💬 Messages] [💭 Reflections]        │
│  ─────────────────────────────────────────────────── │
│                                                      │
│  (Tab content area)                                  │
│                                                      │
│                                                      │
│                                                      │
│  ─────────────────────────────────────────────────── │
│  [🎤 Voice]                    [Send To... ▾]       │
│  ─────────────────────────────────────────────────── │
│  Spelling & Grammar: ✓ "their" → belonging to them  │
└──────────────────────────────────────────────────────┘
```

**Three tabs:**

**Tab 1 — Notepad (default):**
- Single text area for freeform writing. Large text (per Guided shell tokens). Voice input button available.
- Spell check with real-time red squiggles (default on). When Spelling & Grammar Coaching is enabled by mom, tapping a squiggled word shows a brief teaching explanation in a tooltip below the word (e.g., "Did you mean 'their'? 'Their' means belonging to them, 'there' means a place, and 'they're' means 'they are.'"). When coaching is disabled, tapping shows standard correction suggestions only.
- A "Check My Writing" button is also available at the bottom — runs a full grammar and spelling pass and highlights all issues at once. Useful for kids who prefer to write first and check later.
- "Send To..." button at the bottom opens a simplified routing grid: **Journal** (saves as journal entry), **Message** (opens recipient picker — shows family members the child is permitted to message per PRD-15), **Task Note** (attaches to a task as a completion note).
- Content persists in the drawer across tab switches within the same session. On app close, unsaved content shows a "You have unsaved writing. Save to Journal?" prompt.

**Tab 2 — Messages:**
- Simplified view of the child's conversation spaces (PRD-15). Shows threads with permitted family members.
- Compose new message: recipient picker (shows permitted contacts per PRD-15 Guided permissions), text area with same spell check/coaching, send button.
- Before-send coaching (PRD-15): if mom has enabled coaching for this member (default: enabled for Guided), LiLa reviews the message before sending and offers a gentle suggestion if the tone could be improved. The child sees: "LiLa's tip: [suggestion]" with [Send Anyway] and [Edit] buttons. This is the PRD-15 coaching checkpoint rendered within the Write drawer.
- Incoming messages appear as notifications (inline indicators per PRD-15 Guided shell behavior — no notification bell, but a badge on the "Write" bottom nav item when unread messages exist).
- Threading and full messaging features per PRD-15.

**Tab 3 — Reflections (visible only when mom enables reflections):**
- If mom has not enabled reflections for this member, this tab is hidden entirely. The tab strip shows only Notepad and Messages.
- When enabled, shows today's reflection prompt(s) selected from the kid-specific prompt library (PRD-18 prompts 28-32 plus mom-configured custom prompts and LiLa dynamic/contextual prompts).
- Each prompt displays as a card with the question text, a text area for the answer, and voice input.
- Answered prompts show a checkmark and the child's response (editable).
- Answers save to `journal_entries` with `entry_type = 'reflection'` (per PRD-18 architecture).
- A gentle progress indicator: "You've reflected on 2 of 3 today" — never enforced, always encouraging.
- If reading support is enabled, a speaker icon appears next to each prompt for text-to-speech.

**Drawer behavior:**
- Slides in from the right on all screen sizes (consistent with adult Smart Notepad drawer).
- On phone: full-width overlay. On tablet/desktop: partial-width drawer alongside main content.
- Close via [✕] button or tap outside the drawer.
- The child's current page remains underneath — they can close the drawer and return exactly where they were.

**Data created/updated:**
- Notepad content → `journal_entries` (when routed to Journal)
- Messages → `conversation_messages` (per PRD-15 schema)
- Reflections → `journal_entries` with `entry_type = 'reflection'`

---

### Screen 3: Next Best Thing — Expanded Flow

**What the user sees when they tap [Do This]:**

The dashboard navigates to the relevant feature:
- **Task:** Opens the task detail within the Tasks page, with the task highlighted and a "Mark Done" button prominent.
- **Routine step:** Opens the routine within the Tasks page, scrolled to the current step with step-by-step progress visible.
- **Opportunity:** Opens the opportunity detail with a "Claim This" button.

After the child completes the suggested action and returns to the dashboard (via bottom nav "Home"), the Next Best Thing card automatically advances to the next suggestion. The completed item does not reappear.

**What the user sees when they tap [Something Else] repeatedly:**

Each tap cycles to the next item in the priority list. A brief shuffle animation (card slides left, new card slides in from right) provides visual feedback. The cycling is deterministic — same order every time within a session. If the child cycles past all items and back around, previously dismissed items reappear (they might have changed their mind).

When all suggestions have been shown once, the button text changes to "Start Over" on the last card, and tapping it returns to suggestion #1.

---

### Screen 4: Reading Support Mode

> **Enabled by mom in dashboard settings. Not a separate mode — an accommodation layer within Guided.**

**What changes when Reading Support is enabled:**

- **Text-to-speech icons:** A small speaker icon (🔊) appears next to all significant text: task titles, calendar event names, section headers, widget labels, Next Best Thing suggestions, reflection prompts, and navigation labels. Tapping the icon reads that text aloud using the device's native text-to-speech API.
- **Larger default font:** Base font size increases by 2 steps within the Guided shell token scale (e.g., from 16px base to 20px base). This is applied via a CSS class on the dashboard container, not by modifying the design system tokens.
- **Icon pairing:** Key navigation text gets paired with representative Lucide icons where not already present. Bottom nav already has icons; this adds icons to section headers (📅 Calendar, ✅ My Tasks, etc.) and to action buttons throughout the dashboard.
- **Voice input prominence:** The microphone button in the Write drawer becomes larger and more visually prominent. A "Tap to Talk" label appears below it.

**What does NOT change:**
- The dashboard layout, section structure, and widget grid remain identical.
- The child's Visual World theme and gamification experience are unchanged.
- Other family members' experiences are unaffected.
- Reading Support is invisible to other family members — it's a per-member setting with no family-visible indicator.

**Data stored:** `dashboard_configs.preferences.reading_support_enabled` (boolean, default false).

---

### Screen 5: Mom's Dashboard Management for Guided Members

> **Accessed from:** Settings → Family Management → select Guided member → Manage Dashboard.

**What mom sees:**

A configuration screen showing a preview of the child's dashboard with management controls. This is NOT a full rendered dashboard — it's a simplified management view showing section cards and widget slots.

**Section management:**
- Each section shown as a card: Greeting, Next Best Thing, Calendar, My Tasks, Widget Grid, Celebrate.
- Drag-and-drop to reorder sections.
- Visibility toggle (eye icon) on each section. Greeting and Next Best Thing cannot be hidden.
- Expand each section card to see section-specific settings:
  - **Calendar:** Day/week view default.
  - **My Tasks:** Default view (Simple List or Now/Next/Optional).
  - **Widget Grid:** Links to widget assignment interface (PRD-10 widget management, scoped to this member).

**Feature toggles:**
- **Reading Support:** On/Off. When toggled on, shows brief description: "Adds read-aloud icons, larger text, and icon labels throughout [Name]'s dashboard."
- **Spelling & Grammar Coaching:** On/Off. "When on, spell check includes brief teaching explanations. When off, standard spell check only."
- **Reflections:** On/Off, with sub-options when on:
  - "In Write drawer" — enables the Reflections tab in the Write drawer.
  - "In evening celebration" — adds a Reflections step to the DailyCelebration sequence (between Step 2 victories summary and Step 3 streak update).
  - Both can be enabled simultaneously.
  - Prompt selection: mom sees the default kid prompts (28-32) and can enable/disable each, plus add custom prompts.
- **Gamification:** Enabled/Disabled (per PRD-24 — this is the same toggle, surfaced here for convenience).

**LiLa tool access (per-tool toggles):**
- **Homework Help:** On/Off. "LiLa helps [Name] work through homework problems step by step. Never gives direct answers."
- **Communication Coach (Higgins):** On/Off. "Helps [Name] figure out how to talk to family members about things that are on their mind."
- Additional LiLa tools appear here as they're defined in future PRDs.
- Each toggle shows a brief description so mom understands what she's enabling.
- All LiLa conversations are visible to mom (per PRD-04/PRD-05 — stated here for mom's reassurance): "You can see all of [Name]'s LiLa conversations."

**Data updated:**
- `dashboard_configs.layout.sections` — section order, visibility
- `dashboard_configs.preferences` — reading support, spelling coaching, reflections settings
- `member_permissions` — LiLa tool access flags (per PRD-02 pattern)

---

### Screen 6: DailyCelebration with Reflections Integration

> **Depends on:** PRD-11 (DailyCelebration 5-step sequence). Only modified when mom enables "In evening celebration" for reflections.

**Modified DailyCelebration sequence when reflections are enabled:**

The standard PRD-11 DailyCelebration sequence (5 steps) gains a Reflections step inserted between Step 2 (Victories Summary) and Step 3 (Streak Update):

1. **Step 1 — The Opener** (unchanged from PRD-11)
2. **Step 2 — Victories Summary** (unchanged from PRD-11)
3. **Step 2.5 — Reflections** (NEW — only when enabled)
   - Warm transition: "Let's think about your day for a moment."
   - Shows 1-3 reflection prompts (mom-configured count, default 1). Each prompt appears as a card with text area and voice input.
   - "Skip" button available — reflections are never forced.
   - If reading support is enabled, prompts have text-to-speech icons.
   - Answers save immediately to `journal_entries` with `entry_type = 'reflection'` and `source = 'daily_celebration'`.
   - After answering (or skipping), gentle transition to next step.
4. **Step 3 — Streak Update** (unchanged from PRD-11)
5. **Step 4 — Theme Progress** (unchanged from PRD-11)
6. **Step 5 — The Close** (unchanged from PRD-11)

The inserted step follows all DailyCelebration rendering rules: skippable, age-appropriate language per Guided mode (specific praise, slightly longer sentences), and the child's Visual World aesthetic frames the experience.

---

### Screen 7: Graduation Celebration (Guided → Independent)

> **Triggered when:** Mom changes a member's `dashboard_mode` from 'guided' to 'independent' in Family Management.

**What the child sees on next login:**

**Step 1 — Celebration Moment (full-screen overlay):**
- Large, animated celebration with the child's name. Uses their current Visual World aesthetic with gold/confetti accents.
- Message: "Amazing news, [Name]! Mom has invited you to the Independent experience!"
- Brief pause for the celebration to land (3 seconds), then [Let's Go!] button.

**Step 2 — Interactive Tutorial (guided walkthrough):**
A step-by-step tour highlighting new capabilities. Each step focuses on one feature with a brief explanation and a simple task to complete.

Tutorial steps:
1. **"Your sidebar is here now"** — Highlights the sidebar (replaces bottom nav as primary navigation on desktop/tablet). Task: tap a sidebar item and return.
2. **"QuickTasks — add things fast"** — Highlights the QuickTasks strip. Task: add a simple test task (pre-suggested: "My first independent task").
3. **"Your full notepad"** — Opens the Smart Notepad drawer showing the full multi-tab experience (Review & Route, all routing destinations). Task: write one word and close.
4. **"You can customize your dashboard"** — Shows the edit mode (long-press). Task: reorder one section.
5. **"Create your own widgets"** — Shows the [+ Add Widget] button. Task: browse the widget library (no need to add one).

**Step 3 — Welcome Home (dashboard loads):**
- Tutorial complete. Dashboard renders with the Independent shell layout.
- All Guided-era data carries over: widgets (now editable), task history, victories, gamification progress, journal entries, conversation history.
- A one-time dismissible welcome card appears on the dashboard (same pattern as PRD-14 onboarding card): "Welcome to your Independent dashboard! You can now customize your sections, create widgets, and use the full Smart Notepad. Explore at your own pace."
- Tracked in `dashboard_configs.preferences.graduation_tutorial_completed` (boolean).

**What carries over:**
- `dashboard_configs` row preserved. Section order, widget positions, and preferences carry over.
- New capabilities become available: section reordering, widget CRUD, full Smart Notepad with Review & Route.
- Gamification data, streaks, points, and Visual World progress continue uninterrupted.
- LiLa tool access transitions to Independent shell model — drawer available if mom permits (PRD-04/PRD-05).

**What changes:**
- Bottom nav replaced by sidebar on desktop/tablet. Bottom nav on mobile shifts to adult-pattern items.
- "Write" bottom nav button no longer needed — Smart Notepad accessible via pull tab and sidebar.
- QuickTasks strip appears.
- Dashboard edit mode becomes available (long-press).
- Task views expand from 2 (Simple List, Now/Next/Optional) to all 14 prioritization views (PRD-09A).

---

## Visibility & Permissions

| Role | Dashboard Access | Section Management | Widget Control | LiLa Tools | Next Best Thing |
|------|-----------------|-------------------|---------------|------------|----------------|
| Mom / Primary Parent | Full management via Settings → Manage Dashboard. Can View As this member (PRD-02). | Full control — reorder, show/hide, configure per section. | Full widget assignment — add, remove, position, resize. | Per-tool enable/disable. Sees all conversations. | Configurable: can disable NBT card if desired (hide via section management). |
| Dad / Additional Adult | Can View As if mom grants permission (PRD-02). No management access. | None | None | None | None |
| Special Adult | Can view assigned Guided member's dashboard during shift (PRD-27). | None | Interact with permitted child widgets. No layout changes. | None | None |
| Guided Member (self) | Full dashboard view and interaction. | Cannot reorder sections. Cannot hide/show sections. | Can reorder widgets (drag-and-drop). Cannot resize, delete, or create. | Use permitted tools via modals. All conversations visible to mom. | Full interaction — [Do This] and [Something Else]. |

### Shell Behavior
- Guided shell layout per PRD-04: simplified sidebar (desktop/tablet), bottom nav (all screens), optional Write drawer (this PRD upgrades from "lightweight notepad" to full Write drawer), gamification woven in, no QuickTasks, no LiLa drawer, no floating LiLa buttons.
- Bottom nav items: 🏠 Home, ✅ Tasks, 📝 Write, ⭐ Victories, 📊 Progress.
- "Write" in bottom nav opens the Write drawer (slides in from right). It does NOT navigate to a separate page.

### Privacy & Transparency
- All LiLa tool conversations are visible to mom by default (per PRD-04/PRD-05). This is stated clearly during LiLa tool interactions: "Your parent can see this conversation."
- Messages follow PRD-15 Guided permissions: messages to parents by default, siblings if mom permits per-member.
- Journal entries and reflections are visible to mom (per PRD-02 default Guided visibility).
- Dashboard layout configuration is not content — not shown on any transparency panel.
- The child is never surprised by what mom can see. Transparency is communicated clearly, never hidden.

---

## Data Schema

### Extensions to `dashboard_configs.preferences` JSONB (PRD-14 table)

PRD-25 adds the following keys to the existing `preferences` JSONB column:

```json
{
  "reading_support_enabled": false,
  "spelling_coaching_enabled": true,
  "reflections_in_drawer": false,
  "reflections_in_celebration": false,
  "reflection_prompts": [28, 29, 31],
  "reflection_custom_prompts": [
    { "id": "uuid", "text": "What was the kindest thing you did today?" }
  ],
  "reflection_daily_count": 1,
  "nbt_last_suggestion_index": 0,
  "graduation_tutorial_completed": false,
  "guided_task_view_default": "simple_list"
}
```

**Key descriptions:**
- `reading_support_enabled` — Enables text-to-speech icons, larger font, icon pairing.
- `spelling_coaching_enabled` — Enables teaching explanations on spell check corrections. Default true (mom can disable).
- `reflections_in_drawer` — Shows Reflections tab in Write drawer.
- `reflections_in_celebration` — Adds Reflections step to DailyCelebration sequence.
- `reflection_prompts` — Array of prompt IDs from the default library (PRD-18) that mom has enabled.
- `reflection_custom_prompts` — Mom's custom prompts for this child.
- `reflection_daily_count` — How many prompts to show per day/celebration (default 1).
- `nbt_last_suggestion_index` — Tracks where the child is in the Next Best Thing cycle (reset daily at midnight).
- `graduation_tutorial_completed` — Whether the Guided → Independent tutorial has been completed.
- `guided_task_view_default` — Which task view is default for this member ('simple_list' or 'now_next_optional').

### New Section Keys

Added to the section key string constants (extending PRD-14):
- `'next_best_thing'` — The Next Best Thing suggestion card section.
- `'celebrate'` — The Celebrate! button section.

These join existing keys: `'greeting'`, `'calendar'`, `'active_tasks'`, `'widget_grid'`.

### Enum/Type Updates

No new enums. Section keys remain string constants. `dashboard_mode` enum values unchanged.

---

## Flows

### Incoming Flows (How Data Gets INTO the Guided Dashboard)

| Source | How It Works |
|--------|-------------|
| PRD-09A (Tasks) | Assigned tasks, routines, and opportunities populate the Active Tasks section and feed the Next Best Thing engine. |
| PRD-14B (Calendar) | Calendar events populate the Calendar section (stub until PRD-14B). |
| PRD-24 (Gamification) | Point balances, streak data, and reward progress populate header indicators and gamification widgets. |
| PRD-24A (Visual Worlds) | Active Visual World theme skins the dashboard experience. |
| PRD-06 (Guiding Stars) | Declaration text populates the greeting rotation (if entries exist). |
| PRD-10 (Widgets) | Mom-assigned widgets populate the widget grid. |
| PRD-15 (Messages) | Unread message count displays as a badge on the "Write" bottom nav item. Conversation threads appear in the Messages tab. |
| PRD-18 (Reflections) | Reflection prompts populate the Reflections tab and DailyCelebration Step 2.5. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-09A (Tasks) | Task completions triggered from the dashboard (checkbox taps) feed the task completion pipeline. |
| PRD-24 (Gamification) | Task completions trigger the gamification event pipeline (points → streak → theme progress → celebration). |
| PRD-11 (Victory Recorder) | Completed tasks that are flagged for auto-victory feed Victory Recorder. The Celebrate! button launches DailyCelebration. |
| PRD-08 (Journal) | Write drawer notepad content and reflection answers save as journal entries. |
| PRD-15 (Messages) | Write drawer Messages tab sends messages through the PRD-15 messaging system. |
| PRD-13 (Archives) | Journal entries and reflection answers are surfaced in Archives per PRD-13 aggregation. |

---

## AI Integration

### Next Best Thing — AI Glaze

- **Guided mode name:** Not a conversation mode. Uses a lightweight Haiku-class API call for text generation only.
- **Context provided:** Task title, time of day, member name, current streak count, currency name.
- **AI behavior:** Generate one encouraging sentence (10-20 words) connecting the suggestion to context. Tone: warm, specific, brief. Never generic ("Great job!" is forbidden — always connect to something concrete). Examples:
  - "Math first thing — you've done 12 days in a row!" (streak connection)
  - "Reading time! Pick up where you left off yesterday." (continuity)
  - "Dinner prep is worth 15 stars — the biggest reward today!" (reward connection)
- **Caching:** Generated text cached per suggestion per session. Not regenerated on [Something Else] cycling.
- **Fallback:** If AI call fails, show the task title with a generic but warm prefix: "Up next: [task title]."

### LiLa Tool Modals — Homework Help

- **Guided mode name:** `guided_homework_help`
- **Context loaded:** Member's age-appropriate profile, current task list (to understand what homework is assigned), member's name.
- **AI behavior:** Socratic method — never gives direct answers. Asks guiding questions to help the child work through the problem. Uses language appropriate for the 8-12 age range. If the child seems frustrated, acknowledges the frustration and simplifies the approach. If the child asks LiLa to just give the answer, LiLa responds warmly but redirects: "I bet you can figure this out — let's try it a different way."
- **Safety:** If the child expresses distress beyond homework frustration, LiLa follows Safe Harbor (PRD-20) protocols appropriate for Guided members.

### LiLa Tool Modals — Communication Coach (Kid Higgins)

- **Guided mode name:** `guided_communication_coach`
- **Context loaded:** Family member names and relationships, member's name, relationship_type for the selected person.
- **AI behavior:** Adapts the Higgins communication coaching pattern (PRD-21/Higgins) for the 8-12 age range. Two sub-modes:
  - "Help me say something" — crafts age-appropriate message suggestions. Teaches one communication skill per interaction (same 7 skills as Higgins, age-adapted language).
  - "Help me figure this out" — helps the child process a situation and explore how to handle it.
- **Coaching adaptations for Guided age range (per existing Higgins spec):** Simple, concrete language. Models emotional vocabulary. Beginning independence respect. Never takes sides. Always redirects toward real human connection ("This sounds like something you could talk to your mom about. Want me to help you figure out what to say?").

### Spell Check Coaching — AI Enhancement

- **Not a conversation mode.** Spell check uses the browser's built-in spell check API for detection. The teaching explanations are generated from a pre-built lookup table of common misspellings and grammar errors with kid-friendly explanations, NOT from an AI call per word.
- **For unusual or context-dependent errors:** Falls back to a lightweight AI call (Haiku-class) for explanation generation. These are cached globally (not per-user) — the explanation for "their/there/they're" is the same for everyone.
- **Cost:** Effectively zero for pre-built lookup; negligible for AI-generated explanations due to global caching.

---

## Edge Cases

### Member with No Tasks Assigned
- Active Tasks section shows: "No tasks for today! Ask your mom if there's anything she'd like you to work on, or enjoy your free time." — warm, never empty-feeling.
- Next Best Thing card shows: "Nothing on the list right now. Enjoy your free time!" with a relaxed illustration.
- Opportunities still appear if any are available (claimable items don't require assignment).

### Member with Gamification Disabled
- Header gamification indicators (points, streak) are hidden entirely — no empty space.
- Task point values are hidden from task list items.
- Gamification widgets are not assignable to the member's dashboard.
- DailyCelebration still runs (it's a celebration feature, not a gamification feature) but Step 4 (Theme Progress) is skipped.
- Next Best Thing suggestion language drops reward references ("Dinner prep is next!" instead of "Dinner prep is worth 15 stars!").

### Reading Support with Messages
- Text-to-speech icons appear on received message content.
- When composing: spell check coaching is especially valuable for these users. Voice input is the primary composition method.
- Message coaching (LiLa before-send check) reads aloud if reading support is enabled.

### Very Long Task List (15+ tasks)
- Active Tasks section is scrollable within its collapsed area.
- Next Best Thing prioritization becomes more valuable — the child doesn't need to parse the full list.
- Section can be collapsed to hide the overwhelming list; NBT card provides guidance regardless.

### Guided Member with Guiding Stars Entries
- Unusual but valid — a mature Guided member (e.g., a 14-year-old with developmental delays) might have Guiding Stars entries.
- Declaration rotation works identically to adult shells. The greeting shows their name + rotating declaration.
- If entries exist but none have `is_included_in_ai = true`, the declaration line is hidden.

### Network Failure During AI Glaze
- Next Best Thing: shows task title with warm generic prefix (fallback text).
- Homework Help / Communication Coach: shows "LiLa is having trouble connecting. Try again in a moment." with a retry button. Does not fail silently.
- Spell check coaching: pre-built lookup table works offline. AI-generated explanations gracefully degrade to standard corrections.

### Graduation with Active Visual World
- Visual World progress carries over to Independent dashboard. The theme continues to apply.
- Mom can change the Visual World theme after graduation if the teen prefers a less gamified aesthetic.
- Points, streaks, and all gamification state carry over unless mom disables gamification post-graduation.

### Shell Change During Active Session
- If mom changes a member from Guided to Independent while the member is logged in, the change takes effect on next login/refresh (per PRD-04). The member sees: "Your experience has been updated! Refresh to see the changes."

---

## Tier Gating

All Guided Dashboard features are available to all users during beta. The `useCanAccess()` hooks are wired from day one and return `true`.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `guided_dashboard` | Guided Dashboard layout and all sections | TBD post-beta |
| `guided_reading_support` | Reading Support accommodations (TTS, larger font, icon pairing) | TBD post-beta |
| `guided_spelling_coaching` | Spelling & Grammar Coaching teaching explanations | TBD post-beta |
| `guided_reflections` | Reflection prompts in drawer and celebration | TBD post-beta |
| `guided_next_best_thing` | Next Best Thing suggestion engine | TBD post-beta |
| `guided_lila_homework` | LiLa Homework Help tool | TBD post-beta |
| `guided_lila_communication` | LiLa Communication Coach tool | TBD post-beta |

> **Tier rationale:** Reading Support and Spelling Coaching are strong upgrade incentives — parents whose children need these accommodations would find them immediately valuable. Next Best Thing and LiLa tools are premium AI features with per-call costs.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Graduation tutorial content for each Independent feature | Independent shell onboarding | N/A (build phase content) |
| Advanced Next Best Thing (considers energy level, Best Intentions, whole-family context) | Future enhancement | Post-MVP |
| "Ask Mom" button on Next Best Thing when child disagrees with all suggestions | PRD-15 (Messages) quick-request | Post-MVP |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Guided Dashboard (full specification) | PRD-14, Screen 5 | Fully wired — all stub descriptions from PRD-14 are implemented or superseded. |
| Guided shell optional lightweight notepad | PRD-04 | Upgraded to full Write drawer with messaging, spell check coaching, and reflections. |
| Guided shell bottom nav "Journal" item | PRD-04 | Renamed to "Write" — opens Write drawer. |
| DailyCelebration Reflections step | PRD-18 (Reflections architecture) | Step 2.5 inserted into DailyCelebration when mom enables reflections in celebration. |
| Guided shell permission-gated LiLa modal tools | PRD-04, PRD-05 | Homework Help and Communication Coach fully specified with guided modes and system prompts. |
| `reading_support_enabled` preference | N/A (new) | New feature — no prior stub. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Guided Dashboard renders with all sections: Greeting, Next Best Thing, Calendar, Active Tasks, Widget Grid, Celebrate
- [ ] Section order reads from `dashboard_configs.layout.sections` with Guided-specific defaults
- [ ] Mom cannot hide Greeting or Next Best Thing sections
- [ ] Guided member can reorder widgets but not resize/delete/create
- [ ] Next Best Thing engine returns suggestions in priority order (overdue → active routine → time-block → mom-priority → next due → opportunities → unscheduled)
- [ ] Next Best Thing [Do This] navigates to relevant task/routine/opportunity
- [ ] Next Best Thing [Something Else] cycles through suggestions with animation
- [ ] Next Best Thing AI glaze generates encouraging one-liner (Haiku-class, cached per session)
- [ ] Next Best Thing fallback text works when AI call fails
- [ ] Write drawer opens from bottom nav "Write" button (slides in from right)
- [ ] Write drawer Notepad tab with freeform text, voice input, and "Send To..." routing (Journal, Message, Task Note)
- [ ] Write drawer Messages tab showing conversation spaces and compose flow per PRD-15 Guided permissions
- [ ] Write drawer Reflections tab (hidden when reflections not enabled) with prompt cards and answer routing
- [ ] Spell check with real-time squiggles (default on) + "Check My Writing" button
- [ ] Spelling & Grammar Coaching toggle in mom's dashboard management (teaching explanations from lookup table + AI fallback)
- [ ] Reading Support toggle: text-to-speech icons, larger font, icon pairing when enabled
- [ ] DailyCelebration Reflections step (Step 2.5) inserted when mom enables reflections in celebration
- [ ] Bottom nav: Home, Tasks, Write, Victories, Progress — with "Write" opening the drawer, not navigating to a page
- [ ] Gamification indicators in header (points + streak) — hidden when gamification disabled
- [ ] Task completion triggers gamification pipeline (celebration animation, point increment, streak update)
- [ ] Mom's dashboard management screen in Settings → Family Management → member → Manage Dashboard
- [ ] All feature toggles in management screen: Reading Support, Spelling Coaching, Reflections (drawer + celebration independently), LiLa tools
- [ ] `useCanAccess()` hooks wired for all 7 feature keys (return true during beta)
- [ ] RLS policies: member reads own dashboard_configs; mom reads/updates all family members
- [ ] Unread message badge on "Write" bottom nav item

### MVP When Dependency Is Ready
- [ ] Calendar section displays real event data (requires PRD-14B Calendar)
- [ ] LiLa Homework Help modal (requires PRD-05 guided mode infrastructure)
- [ ] LiLa Communication Coach modal (requires PRD-05 guided mode infrastructure + PRD-21 Higgins patterns)
- [ ] Before-send message coaching in Write drawer (requires PRD-15 coaching system)
- [ ] Visual World theme skinning the dashboard (requires PRD-24A Visual Worlds)
- [ ] Gamification widgets in grid (requires PRD-24 + PRD-10 gamification widget types)

### Post-MVP
- [ ] Graduation celebration and interactive tutorial (Guided → Independent)
- [ ] Advanced Next Best Thing with energy awareness, Best Intentions, whole-family context
- [ ] "Ask Mom" quick-request from Next Best Thing when child disagrees with all suggestions
- [ ] Smart widget suggestions from LiLa for mom when configuring Guided dashboards
- [ ] Multiple saved dashboard configurations per Guided member (school day vs. weekend vs. summer)
- [ ] Keyboard shortcuts for power-user Guided teens
- [ ] Guided-specific onboarding tutorial (first-time Guided member experience)

---

## CLAUDE.md Additions from This PRD

- [ ] Guided Dashboard section keys: `'next_best_thing'` and `'celebrate'` join `'greeting'`, `'calendar'`, `'active_tasks'`, `'widget_grid'` as valid section key constants.
- [ ] Guided Dashboard sections that cannot be hidden: `'greeting'` and `'next_best_thing'`. Mom can hide all others.
- [ ] Bottom nav for Guided shell: Home, Tasks, Write, Victories, Progress. "Write" opens the Write drawer (right-side slide-in), not a page navigation.
- [ ] Write drawer is the Guided shell's upgraded notepad. Three tabs: Notepad, Messages, Reflections. Reflections tab hidden when reflections not enabled.
- [ ] Next Best Thing suggestion priority order: overdue → active routine → time-block → mom-priority → next due → opportunities → unscheduled. Deterministic, not random. AI glaze is Haiku-class, cached per suggestion per session.
- [ ] Reading Support is a per-member setting in `dashboard_configs.preferences`, NOT a separate dashboard mode. It adds text-to-speech, larger font, and icon pairing within the existing Guided shell.
- [ ] Spelling & Grammar Coaching uses a pre-built lookup table for common errors + Haiku-class AI fallback for unusual errors. Globally cached (not per-user). Mom toggle controls whether explanations show.
- [ ] Graduation (Guided → Independent): celebration overlay + 5-step interactive tutorial + welcome card. All data carries over. Tracked in `dashboard_configs.preferences.graduation_tutorial_completed`.
- [ ] DailyCelebration Reflections step (Step 2.5): inserted between Step 2 (Victories) and Step 3 (Streak) only when `reflections_in_celebration = true`. Skippable. Answers save to `journal_entries` with `entry_type = 'reflection'`, `source = 'daily_celebration'`.

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables modified:**
- `dashboard_configs` — `preferences` JSONB extended with 10 new keys for Guided-specific settings (reading_support_enabled, spelling_coaching_enabled, reflections_in_drawer, reflections_in_celebration, reflection_prompts, reflection_custom_prompts, reflection_daily_count, nbt_last_suggestion_index, graduation_tutorial_completed, guided_task_view_default).

**New section key constants:** `'next_best_thing'`, `'celebrate'`.

**No new tables defined.** Guided Dashboard reuses `dashboard_configs` (PRD-14), `journal_entries` (PRD-08), `conversation_messages` (PRD-15), and all gamification tables (PRD-24).

**No new enums defined.**

**No new triggers defined.**

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Bottom nav "Journal" renamed to "Write" for Guided shell** | The Write drawer serves journal, messaging, and reflections — "Journal" is too narrow. "Write" is clear and grows naturally into "Smart Notepad" on graduation. |
| 2 | **Write drawer opens from bottom nav button, slides in from right** | Consistent drawer direction across all shells. Bottom nav button is the intuitive trigger for kids; pull tab available as secondary trigger on larger screens. |
| 3 | **Write drawer has three tabs: Notepad, Messages, Reflections** | Consolidates all writing surfaces into one drawer. Reflections tab hidden when mom hasn't enabled it, keeping the default simple. |
| 4 | **Reading Support is a per-member accommodation, not a separate mode** | Serves the kid who isn't quite reading yet without demoting them to Play mode. Accommodation, not demotion. Both kids in the same organizational tier. |
| 5 | **Spelling & Grammar Coaching uses lookup table + AI fallback, not per-word AI** | Cost-effective and fast. Common errors (their/there/they're) from pre-built table; unusual errors get cached AI explanations shared globally. |
| 6 | **Next Best Thing priority is deterministic, not random** | Children benefit from consistent, predictable guidance. Random shuffling would feel chaotic. Priority order is transparent and logical. |
| 7 | **Reflections live in both Write drawer AND DailyCelebration, mom enables each independently** | Anytime journaling access + evening routine integration serve different family patterns. Some kids will use both; most will use one. |
| 8 | **Graduation includes interactive tutorial with tasks to complete** | Learning by doing, not reading. The tutorial itself teaches how the Independent shell works by having the child use it. |
| 9 | **Next Best Thing button cannot be hidden by mom** | This is the killer feature for the Guided experience — the one-tap answer to "what should I do?" Hiding it would lose the core value proposition. |
| 10 | **LiLa tools specified: Homework Help (Socratic) + Communication Coach (kid Higgins)** | These are the two tools most requested for the 8-12 age range. Homework help uses step-by-step Socratic method (never gives answers). Communication coach adapts the proven Higgins pattern for kids. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Advanced Next Best Thing with energy awareness and Best Intentions | Post-MVP enhancement — add when family usage data shows demand |
| 2 | Multiple dashboard layouts per Guided member (school/weekend/summer) | Post-MVP — same pattern as adult dashboard saved layouts |
| 3 | Guided-specific first-time onboarding tutorial | Post-MVP or build phase content |
| 4 | "Ask Mom" quick-request from Next Best Thing | Post-MVP — requires PRD-15 quick-request flow |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-04 (Shell Routing) | Guided shell bottom nav: "Journal" → "Write". Write button opens drawer, not page. | Update PRD-04 Guided shell bottom nav spec. Note that "Write" triggers the right-side drawer. |
| PRD-08 (Journal + Smart Notepad) | Guided notepad upgraded from "lightweight single-tab" to full Write drawer with three tabs. Spell check coaching added. | Update PRD-08 to note Guided shell gets Write drawer (3 tabs) instead of lightweight notepad. Add spell check coaching to notepad capabilities. |
| PRD-11 (Victory Recorder) | DailyCelebration gains optional Step 2.5 (Reflections) for Guided members when mom enables. | Note optional step insertion point in PRD-11 DailyCelebration spec. Reflections step is skippable and mom-enabled. |
| PRD-14 (Personal Dashboard) | Guided Dashboard stub (Screen 5) fully superseded by PRD-25. New section keys added. `preferences` JSONB extended. | Mark PRD-14 Screen 5 Guided stub as "Superseded by PRD-25." Add new section keys and preference keys to PRD-14 schema documentation. |
| PRD-15 (Messages) | Messages tab integrated into Write drawer for Guided shell. Before-send coaching checkpoint rendered within drawer. Unread badge on bottom nav. | Note Guided shell messaging surface location (Write drawer Messages tab). Verify coaching checkpoint UI fits drawer context. |
| PRD-18 (Rhythms & Reflections) | Reflections confirmed for Guided kids in two placements. Kid-specific prompts (28-32) confirmed as the default library. | Note Guided reflections architecture. Confirm prompts 28-32 as kid-appropriate defaults. |
| PRD-22 (Settings) | Guided Dashboard Management screen added to Settings → Family Management → member. | Add "Manage Dashboard" entry to the Family Management member detail screen in PRD-22. |
| PRD-24 (Gamification) | Gamification indicators in Guided header confirmed. Gamification disable = hide indicators + skip DailyCelebration Step 4. | No changes needed — PRD-24 already supports per-member disable. Note header indicator location. |
| Feature Highlight Audit | Next Best Thing confirmed for Guided dashboard with full specification. | Update audit to note PRD-25 as the authoritative spec for Guided NBT. |
| Build Order Source of Truth | PRD-25 written. | Move PRD-25 to Section 2 (completed). |

---

*End of PRD-25*
