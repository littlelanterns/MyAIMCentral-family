> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-16: Meetings

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-07 (InnerWorkings), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder & Daily Celebration), PRD-14B (Calendar), PRD-15 (Messages, Requests & Notifications)
**Created:** March 11, 2026
**Last Updated:** March 11, 2026

---

## Overview

PRD-16 defines the Meetings system — structured, AI-guided conversations between family members with between-meeting item capture, recurring schedules, customizable agendas, and post-meeting routing of notes and action items.

Meetings are where families do their most important coordination work: couple check-ins, parent-child mentoring sessions, and family councils where everyone gets a voice. The system draws from a fully proven StewardShip v1 implementation (5 tables, 9 meeting types, dynamic AI prompt assembly) and adapts it for the multi-member MyAIM Family platform. The core facilitation experience is proven — what changes is the multi-participant dimension: shared meetings between real accounts, participant-scoped context loading, shared agendas visible to all participants before the meeting, and post-meeting action item routing through the universal Studio Queue.

A key design principle is that meetings train families to defer spontaneous requests and discussions to a structured time. When a kid asks for something mid-week, mom (or the kid, if Independent) adds it to the meeting agenda. By meeting time, there's already a curated list of real items to discuss. This reduces the frequency of on-the-spot decisions and teaches planning skills — every family member learns that their voice matters, but the right time to use it is when everyone is listening.

> **Mom experience goal:** When I open Meetings, I see every meeting type my family uses — couple meetings, mentor sessions with each child, family councils — with upcoming schedules, overdue indicators, and pending agenda items. Between meetings, anyone can add items to the agenda so we come prepared. During the meeting, LiLa walks us through our custom agenda conversationally. After, I route action items to the right people's task queues in seconds. My family has a rhythm of connection that feels natural, not forced.

> **Depends on:** PRD-05 (LiLa Core) provides the `meeting` guided mode and AI conversation engine. PRD-08 (Smart Notepad) defines the "Send to → Agenda" routing stub with inline meeting picker overlay. PRD-14B (Calendar) provides recurring event infrastructure for meeting schedules. PRD-15 (Messages) provides the notification system for meeting reminders and the conversation space for post-meeting summary sharing. PRD-09A (Tasks) provides the Studio Queue for action item routing with `source = 'meeting_action'`.

---

## User Stories

### Meeting Setup & Scheduling

- As a mom, I want to set up recurring meetings for each type (couple, mentor with each child, family council) with preferred day and time so they appear on our family calendar automatically.
- As a mom, I want to customize the agenda sections for each meeting type so the structure matches what our family actually discusses.
- As a mom, I want to create custom meeting templates for situations not covered by the built-in types (like a homeschool planning meeting or a holiday prep session) so I can structure any recurring conversation.
- As a dad (with permission), I want to see and manage meeting schedules that include me so I can prepare for upcoming meetings.

### Between-Meeting Agenda Capture

- As any family member, I want to add items to an upcoming meeting's agenda between meetings so I don't forget what I wanted to discuss.
- As a mom, I want to see all pending agenda items for each meeting type at a glance so I know what's queued up.
- As an Independent teen, I want to add items to my mentor meeting agenda and to the family council agenda so my voice is represented even before the meeting starts.
- As a mom, I want to add agenda items on behalf of my younger children so their needs are represented at family meetings.
- As any participant, I want to remove an agenda item I added if it's been resolved or is no longer relevant so the agenda stays clean.
- As a mom, I want to route a note from my Smart Notepad directly to a meeting agenda via "Send to → Agenda" so thoughts captured elsewhere flow into the right meeting.

### Running a Meeting

- As a mom, I want to start a meeting in "Live Mode" where LiLa walks us through the agenda conversationally with both participants present so we stay focused and productive.
- As a mom, I want to start a meeting in "Record After" mode where I capture what we already discussed (at dinner, in the car, etc.) so meetings that happen organically still get tracked.
- As a parent in a family council, I want to select which family members are participating in this particular meeting so I can run an "older kids only" session when appropriate.
- As a child (with facilitation privileges), I want to take a turn leading the family meeting while LiLa provides lighter guidance so I develop leadership skills.

### Post-Meeting

- As the person who ends a meeting, I want to see extracted action items as cards with routing options so I can send each item to the right person's task queue, the calendar, a list, or dismiss it.
- As a mom, I want to share the meeting summary to the relevant conversation space in Messages so both participants can reference it later.
- As a meeting participant, I want to receive a notification summarizing what action items were routed and where so I know what's expected of me.
- As a mom, I want meeting summaries saved to my journal automatically so I have a record of family discussions over time.

### Meeting History

- As a mom, I want to see a history of past meetings per type with summaries and impressions so I can track our family's growth over time.
- As a parent, I want to review what we discussed in the last meeting before starting a new one so we can follow up on previous conversations.

---

## Screens

### Screen 1: Meetings Home Page

> **Mom experience goal:** One page shows me everything — what's coming up, what's overdue, what's queued for discussion. I can start any meeting from here.

**What the user sees:**

The Meetings page, accessible from sidebar navigation. Layout has two main areas:

```
┌─────────────────────────────────────────────┐
│  Meetings                              ⚙️    │
│  ─────────────────────────────────────────  │
│  UPCOMING                                    │
│  ┌───────────────────────────────────────┐  │
│  │ 🔴 Couple Meeting         Overdue 2d  │  │
│  │    3 agenda items pending             │  │
│  │    [Live Mode]  [Record After]        │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ 🟡 Mentor: Jake           Due Today   │  │
│  │    1 agenda item from Jake            │  │
│  │    [Live Mode]  [Record After]        │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ ⚪ Family Council          In 3 days   │  │
│  │    5 agenda items (2 from kids)       │  │
│  │    [Live Mode]  [Record After]        │  │
│  └───────────────────────────────────────┘  │
│  ─────────────────────────────────────────  │
│  MEETING TYPES                               │
│  ▸ Couple Meeting                    ⚙️ 📅  │
│  ▸ Mentor Meetings (4 children)      ⚙️ 📅  │
│  ▸ Family Council                    ⚙️ 📅  │
│  ▸ Weekly Review (personal)          ⚙️ 📅  │
│  ▸ Monthly Review (personal)         ⚙️ 📅  │
│  ▸ Custom: Homeschool Planning       ⚙️ 📅  │
│  ─────────────────────────────────────────  │
│  [+ Create Custom Meeting Type]              │
│  ─────────────────────────────────────────  │
│  RECENT HISTORY                              │
│  Family Council — Mar 7 — "Discussed..."    │
│  Couple Meeting — Mar 5 — "Checked in..."   │
│  Mentor: Emma — Mar 3 — "Talked about..."   │
│  [View All History →]                        │
└─────────────────────────────────────────────┘
```

**Upcoming section:**
- Cards for meetings due within 7 days, sorted by urgency (overdue first, then due today, then upcoming)
- Each card shows: meeting type icon, name (with child's name for mentor/parent-child), due status indicator (🔴 overdue, 🟡 due today, ⚪ upcoming), pending agenda item count with contributor attribution, and Start buttons
- Overdue meetings show days overdue in red
- Agenda item count is tappable — expands inline to show the items with quick-add input

**Meeting Types section:**
- Accordion rows per type. Tapping `▸` expands to show: schedule summary, agenda item list with quick-add, and settings gear
- ⚙️ opens the Agenda Section Editor (Screen 4)
- 📅 opens the Schedule Editor (Screen 5)
- Mentor meetings group all children under one accordion with per-child sub-rows

**Recent History section:**
- Last 5 completed meetings across all types with one-line summaries
- "View All History" navigates to Screen 6

**Interactions:**
- **[Live Mode]:** Creates a meeting record (`status = 'in_progress'`), opens LiLa guided conversation in the `meeting` guided mode with appropriate subtype and participant context
- **[Record After]:** Same record creation, but LiLa opens in retrospective capture mode
- **[+ Create Custom Meeting Type]:** Opens Screen 7 (Custom Template Creator)
- **⚙️ (per-type):** Opens Agenda Section Editor for that type (Screen 4)
- **📅 (per-type):** Opens Schedule Editor for that type (Screen 5)
- **Quick-add input:** Inline text field below agenda items in expanded accordion. Typing and pressing Enter creates a `meeting_agenda_items` record with `status = 'pending'` scoped to the meeting type

**Data read:**
- `meeting_schedules` for due date calculations
- `meeting_agenda_items` where `status = 'pending'` per meeting type
- `meetings` for recent history (last 5, `status = 'completed'`)
- `meeting_participants` to determine which meetings involve the current user

---

### Screen 2: Live Meeting Mode (LiLa Guided Conversation)

> **Mom experience goal:** LiLa guides us through our agenda like a thoughtful facilitator — bringing up the right topics at the right moments, weaving in our pending agenda items naturally, and keeping us on track without being rigid.

**What the user sees:**

The LiLa guided conversation interface (bottom drawer in full state or full-screen modal, depending on device). The meeting conversation uses the `meeting` guided mode registered in PRD-05.

**Pre-meeting participant selection (family council only):**
When starting a family council meeting, a participant picker appears before the conversation starts:

```
┌─────────────────────────────────────────────┐
│  Family Council — Who's joining?             │
│  ─────────────────────────────────────────  │
│  [✓] Mom          [✓] Dad                   │
│  [✓] Jake (14)    [✓] Emma (12)             │
│  [✓] Ruthie (10)  [ ] Noah (5, Play)        │
│  [✓] [other kids...]                         │
│  ─────────────────────────────────────────  │
│  [Start Meeting]                             │
└─────────────────────────────────────────────┘
```

Default: all family members selected. Mom deselects anyone not participating. Play children are unchecked by default (mom opts them in if desired). Selected participants are saved to `meeting_participants`.

**During the meeting:**

LiLa's conversation flows through the meeting type's customized agenda sections. The AI dynamically assembles its prompt from the user's active sections (falling back to built-in defaults if sections haven't been customized). Pending agenda items are included in the AI context as a `PENDING AGENDA ITEMS:` block — LiLa weaves them in at appropriate moments rather than dumping them all at the start.

**Facilitator rotation (family council):**
If mom has designated a child as the meeting facilitator (set before starting), LiLa adapts its guidance level:
- For young facilitators (under 10): LiLa provides more structure — "Great job, [name]! The next thing on our agenda is..."
- For teen facilitators: LiLa stays quieter, offering prompts only when asked or when the conversation stalls
- The facilitator designation is stored on the `meetings` record

**Meeting controls (visible during conversation):**
- **Pause:** Pauses the meeting conversation (saves state, can resume)
- **End Meeting:** Transitions to the post-meeting review screen (Screen 3)
- **Agenda Items:** Expandable panel showing pending items with checkboxes to mark as discussed

**Data created/updated:**
- `meetings` record with `status = 'in_progress'`
- `meeting_participants` records for all selected participants
- `lila_conversations` and `lila_messages` per the PRD-05 conversation engine
- `meeting_agenda_items.status` updated to `'discussed'` as items are covered

---

### Screen 3: Record After Mode

> **Mom experience goal:** We had a great conversation over dinner. Now I want to capture what we discussed without having to recreate the whole thing. LiLa helps me remember and organize what happened.

**What the user sees:**

Same LiLa guided conversation interface, but LiLa's tone shifts to retrospective capture:

- "Tell me about your [couple meeting / mentor session / family council]. What did you talk about?"
- LiLa asks follow-up questions based on the meeting type's agenda sections: "Did you cover any scheduling or logistics?" "Were there any action items or commitments?"
- LiLa compiles the responses into a structured summary organized by agenda section
- User reviews and edits the summary before finalizing

**Participant selection:** Same as Live Mode for family council. For couple/mentor meetings, participants are implicit (the meeting type defines them).

**Data created/updated:** Same records as Live Mode. The `meetings.mode` field distinguishes `'live'` from `'record_after'`.

---

### Screen 4: Post-Meeting Review & Routing

> **Mom experience goal:** The meeting is done. Now I see a clean summary and can route action items to the right people in seconds — same workflow I use everywhere else in the app.

**What the user sees:**

After ending a meeting (from either Live or Record After mode):

```
┌─────────────────────────────────────────────┐
│  Meeting Complete — Couple Meeting           │
│  March 11, 2026 • 35 minutes                │
│  ─────────────────────────────────────────  │
│  SUMMARY                                     │
│  [Editable text area with LiLa-generated    │
│   summary organized by agenda section]       │
│  ─────────────────────────────────────────  │
│  IMPRESSIONS                                 │
│  How did this meeting feel?                  │
│  [Optional text area for personal notes]     │
│  ─────────────────────────────────────────  │
│  ACTION ITEMS                                │
│  ┌───────────────────────────────────────┐  │
│  │ Schedule dentist appointment          │  │
│  │ Route to: [Mom's Tasks ▾]             │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ Research summer camps                 │  │
│  │ Route to: [Dad's Tasks ▾]             │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ Family BBQ next Saturday              │  │
│  │ Route to: [Calendar ▾]                │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │ Jake wants new basketball shoes       │  │
│  │ Route to: [Shopping List ▾]  [Skip]   │  │
│  └───────────────────────────────────────┘  │
│  ─────────────────────────────────────────  │
│  [Share to Messages]  [Save & Close]         │
└─────────────────────────────────────────────┘
```

**Summary section:**
- LiLa-generated summary organized by the agenda sections that were covered
- Editable — user can refine before saving
- Saved to `meetings.summary`

**Impressions section:**
- Optional free-text area for personal reflections on the meeting
- Saved to `meetings.impressions`
- Impressions are personal to the person ending the meeting, not shared with other participants

**Action Items section:**
- LiLa extracts action items from the conversation and presents them as cards
- Each card has a "Route to" dropdown with options:
  - **[Member]'s Tasks** — deposits into that member's Studio Queue with `source = 'meeting_action'` and `source_reference_id` = meeting ID
  - **Calendar** — opens Quick Add pre-filled with item content
  - **List** — opens list picker to add item to an existing list
  - **Best Intention** — creates a Best Intention entry
  - **Guiding Stars** — creates a Guiding Stars entry (e.g., "I want to make honesty my guiding principle")
  - **Goals** — creates a goal or sequential collection (e.g., "Complete all math assignments by summer")
  - **Skip** — dismisses the item (no routing)
- Routing follows the universal queue pattern: items routed to Tasks land as drafts in the Studio Queue / Universal Queue Modal, not as finished tasks
- This routing dropdown is a compact routing strip — a focused subset of the Notepad's full Send To grid, aligned with the same pattern used in PRD-15's Requests accept flow

> **Decision rationale:** Action items always go through the Studio Queue with `source = 'meeting_action'`. They never bypass the queue to create tasks directly. This is consistent with every other source that feeds the task system (Notepad, Review & Route, Requests, Goals). The routing strip offers the destinations most likely to come from meeting conversations — not the full 15-destination Send To grid.

**Member routing ("Who is this for?"):**
- Each action item card includes a member selector dropdown: "Who is this for?"
- LiLa pre-suggests the responsible member based on conversation context (e.g., "Dad said he'd handle the research" → pre-selects Dad). User can override.
- For **personal review meetings** (weekly, monthly, quarterly), the member selector does not appear — all items route to the current user.
- For **couple meetings**, items default to one of the two participants based on AI analysis of the conversation.
- For **family council meetings**, items can route to any participating member.
- For **parent-child/mentor meetings**, items default to the parent's queue (parent configures and assigns to the child if appropriate).
- The selected member becomes the `owner_id` on the `studio_queue` record.

**Share to Messages:**
- Opens a pre-composed message containing the meeting summary
- Recipient defaults to the relevant conversation space (Mom ↔ Dad space for couple meetings, Mom ↔ Jake space for mentor meetings, Whole Family or selected group for family council)
- Creates a new thread in that space with `source_type = 'meeting_summary'` and `source_reference_id` = meeting ID
- Not automatic — mom explicitly chooses to share

> **Decision rationale:** Manual "Share to Messages" preserves the human-in-the-mix principle. Mom decides what gets shared and can edit the summary before it goes out.

**Save & Close:**
- Saves the meeting record with summary, impressions, and any remaining unrouted action items
- Advances the `meeting_schedules.next_due_date` based on the recurrence configuration
- Marks any linked `calendar_events` instance as completed
- Notifies all other participants: "[Mom] completed the [meeting type]. [N] action items routed."
- Meeting moves to history

**Journal routing:**
- Meeting summary is automatically saved as a `journal_entries` record with `entry_type = 'meeting_notes'` and `source = 'meeting'`
- This happens on Save & Close without requiring explicit user action

> **Decision rationale:** Meeting notes should always be captured in the journal for long-term reference. The automatic save removes friction without violating human-in-the-mix (the user already edited the summary before saving).

**Data created/updated:**
- `meetings.status` → `'completed'`, plus summary, impressions, completed_at
- `meeting_agenda_items` remaining pending items carry forward to next meeting
- `studio_queue` records for action items routed to Tasks (with `source = 'meeting_action'`)
- `calendar_events` for items routed to Calendar
- `journal_entries` record with `entry_type = 'meeting_notes'`
- `notifications` for all other participants
- `meeting_schedules.next_due_date` advanced
- Optionally: `messages` record in PRD-15 conversation thread (if Share to Messages used)

---

### Screen 5: Agenda Section Editor

> **Mom experience goal:** I want to make our couple meeting truly ours. I keep the sections that work, archive the ones that don't, and add my own that reflect what matters to us.

**What the user sees:**

A modal for customizing agenda sections per meeting type. Opens from the ⚙️ icon on any meeting type row.

```
┌─────────────────────────────────────────────┐
│  Couple Meeting — Agenda Sections        ✕  │
│  ─────────────────────────────────────────  │
│  Drag to reorder • Tap to edit              │
│  ─────────────────────────────────────────  │
│  ≡  Check-In                          ✏️ 📁 │
│     "How are we each doing?"                │
│  ≡  Relationship Temperature          ✏️ 📁 │
│     "How are we feeling about us?"          │
│  ≡  Parenting Alignment               ✏️ 📁 │
│     "Are we on the same page with..."       │
│  ≡  Calendar & Logistics              ✏️ 📁 │
│     "What's coming up this week?"           │
│  ≡  Dreams & Goals                    ✏️ 📁 │
│     "What are we working toward?"           │
│  ≡  Appreciation                      ✏️ 📁 │
│     "What do I appreciate about you?"       │
│  ─────────────────────────────────────────  │
│  ARCHIVED SECTIONS                           │
│  ↩️  [Restore any archived defaults]         │
│  ─────────────────────────────────────────  │
│  [+ Add Custom Section]                      │
│  ─────────────────────────────────────────  │
│  [Done]                                      │
└─────────────────────────────────────────────┘
```

**Interactions:**
- **≡ (drag handle):** Drag-to-reorder sections (dnd-kit pattern)
- **✏️ (edit):** Inline edit the section title and LiLa prompt text. The prompt text is what LiLa uses to guide that segment of the conversation.
- **📁 (archive):** Archives the section (moves to "Archived" area). Default sections can be archived and restored; custom sections can be deleted permanently.
- **↩️ Restore:** Restores an archived default section to its original position
- **[+ Add Custom Section]:** Creates a new custom section with title and prompt fields. Custom sections persist across all future meetings of this type.

**Section structure (per record):**
- `section_name`: Display title
- `prompt_text`: The instruction LiLa uses during the meeting conversation (e.g., "Ask both participants how they're feeling about the relationship. Listen for underlying emotions.")
- `sort_order`: Position in the agenda
- `is_default`: Whether this is a system-seeded section
- `is_archived`: Whether currently hidden from the active agenda

**Data created/updated:**
- `meeting_template_sections` records. Auto-seeded on first access from `BUILT_IN_AGENDAS` defaults.

---

### Screen 6: Schedule Editor

**What the user sees:**

A form for configuring when a meeting type recurs. Opens from the 📅 icon on any meeting type row.

```
┌─────────────────────────────────────────────┐
│  Couple Meeting — Schedule                ✕ │
│  ─────────────────────────────────────────  │
│  Frequency                                   │
│  (●) Weekly  ( ) Biweekly  ( ) Monthly       │
│  ( ) Custom days  ( ) Custom monthly         │
│  ─────────────────────────────────────────  │
│  [If Weekly/Biweekly:]                       │
│  Preferred Day: [Saturday ▾]                 │
│  Preferred Time: [8:00 PM ▾]                 │
│  ─────────────────────────────────────────  │
│  [If Custom days:]                           │
│  [M] [T] [W] [Th] [F] [Sa] [Su]             │
│  ─────────────────────────────────────────  │
│  [If Custom monthly:]                        │
│  ( ) Specific date: [17th ▾]                 │
│  ( ) Ordinal weekday: [3rd ▾] [Thursday ▾]   │
│  ─────────────────────────────────────────  │
│  End Date                                    │
│  (●) Ongoing  ( ) Until [date picker]        │
│  ─────────────────────────────────────────  │
│  Calendar Integration                        │
│  [✓] Create calendar events automatically    │
│  ─────────────────────────────────────────  │
│  [Save Schedule]                             │
└─────────────────────────────────────────────┘
```

**Recurrence pattern:** Adopts the same `recurrence_rule` + `recurrence_details` JSONB pattern established in PRD-09A for task scheduling. This ensures a future shared recurrence UI component can be built once and used across Tasks, Calendar, and Meetings.

> **Forward note:** A universal recurring/scheduling component should be harmonized across Tasks (PRD-09A), Calendar (PRD-14B), and Meetings (PRD-16) during the pre-build audit. PRD-16 adopts the PRD-09A pattern to ensure compatibility. The shared UI component will be designed in a separate session.

**Calendar integration:** When "Create calendar events automatically" is checked, saving the schedule creates a recurring `calendar_events` record with `source = 'meeting_schedule'` and `source_reference_id` = meeting_schedules.id. Completing a meeting marks the corresponding calendar event instance as done.

> **Decision rationale:** Meeting schedules create calendar events so meetings are visible in the family calendar alongside everything else. No separate reminder infrastructure — calendar reminders handle meeting notifications via PRD-15's notification system.

**Data created/updated:**
- `meeting_schedules` record (one per meeting type per family, or per meeting type per child for mentor meetings)
- `calendar_events` record if calendar integration enabled

---

### Screen 7: Custom Template Creator

**What the user sees:**

A form for creating a new custom meeting type.

```
┌─────────────────────────────────────────────┐
│  Create Custom Meeting Type               ✕ │
│  ─────────────────────────────────────────  │
│  Meeting Name                                │
│  [Homeschool Planning Meeting          ]     │
│  ─────────────────────────────────────────  │
│  Participant Type                            │
│  (●) Personal (just me)                      │
│  ( ) Two-person (me + one family member)     │
│  ( ) Group (me + selected family members)    │
│  ─────────────────────────────────────────  │
│  [If two-person:]                            │
│  Default Partner: [Dad ▾]                    │
│  ─────────────────────────────────────────  │
│  [If group:]                                 │
│  Default Participants:                       │
│  [✓] Dad [✓] Jake [✓] Emma [ ] Noah         │
│  ─────────────────────────────────────────  │
│  Starting Sections                           │
│  ( ) Start blank — I'll add my own           │
│  (●) Let LiLa suggest sections based on      │
│      the meeting name                        │
│  ( ) Copy sections from: [Couple Meeting ▾]  │
│  ─────────────────────────────────────────  │
│  [Create Meeting Type]                       │
└─────────────────────────────────────────────┘
```

**LiLa section suggestions:** If the user chooses "Let LiLa suggest," a brief AI call generates 4-6 appropriate agenda sections based on the meeting name. The user can then customize via the Agenda Section Editor.

**Template sharing:** Mom can create a template and deploy it for any participant pair. For example, a "Weekly 1-on-1" template created once can be deployed for Mom+Jake, Mom+Emma, Mom+Ruthie with the same section structure but independent agenda items and histories.

**Data created:**
- `meeting_templates` record with the template definition
- `meeting_template_sections` auto-seeded from LiLa suggestions, copied sections, or blank

---

### Screen 8: Agenda Items List (Embedded Component)

> **Mom experience goal:** Adding something to next week's meeting agenda should be as fast as jotting a note. No navigation, no forms — just type and go.

**What the user sees:**

An inline component embedded in the Meetings Home page (inside expanded accordion rows and upcoming meeting cards) and in the Notepad's inline meeting picker overlay.

```
┌───────────────────────────────────────┐
│  Agenda Items — Couple Meeting        │
│  ─────────────────────────────────── │
│  • Discuss Jake's basketball tryouts  │
│    Added by Mom • Mar 8               │
│  • Plan spring break                  │
│    Added by Dad • Mar 9               │
│  • Budget review                      │
│    Added by Mom • Mar 10              │
│  ─────────────────────────────────── │
│  [+ Add item...                    ]  │
└───────────────────────────────────────┘
```

**Item display:** Each item shows content, who added it, and when. Items appear in chronological order (oldest first — they accumulate between meetings).

**Interactions:**
- **Quick-add input:** Type text, press Enter to add. Creates `meeting_agenda_items` record with `status = 'pending'`.
- **Tap an item:** Expands to show full text (if truncated) and options: Edit, Remove (if you added it), Mark Discussed.
- **Remove:** Only the person who added the item (or mom) can remove it. Removes from the active list.
- For family council meetings: any participant can add items. All participants see all pending items.

**Data created/updated:**
- `meeting_agenda_items` records

---

### Screen 9: Meeting History

**What the user sees:**

Accessible from "View All History" on the Meetings Home page. Shows past meetings filterable by type.

```
┌─────────────────────────────────────────────┐
│  Meeting History                         ✕  │
│  [All] [Couple] [Mentor] [Family] [Custom]  │
│  ─────────────────────────────────────────  │
│  Couple Meeting — Mar 11                     │
│  "Discussed Jake's tryouts, spring break..." │
│  35 min • 3 action items routed              │
│  ─────────────────────────────────────────  │
│  Family Council — Mar 7                      │
│  "Covered chore rotation, screen time..."    │
│  45 min • 5 action items routed              │
│  ─────────────────────────────────────────  │
│  Mentor: Jake — Mar 5                        │
│  "Great conversation about responsibility..."│
│  20 min • 1 action item routed               │
│  ─────────────────────────────────────────  │
│  [Load More]                                 │
└─────────────────────────────────────────────┘
```

**Tapping a meeting:** Opens a read-only view of the meeting summary, impressions (if the current user was the one who recorded them), participants, and action item routing log.

**Data read:**
- `meetings` where `status = 'completed'`, filtered by type, ordered by `completed_at DESC`
- `meeting_participants` to show who was present
- Limited to meetings the current user participated in (or all family meetings for mom)

---

## Visibility & Permissions

> **Depends on:** Five-role permission model — defined in PRD-01 and PRD-02.

| Role | Meetings Access | Can Start Meetings | Can Add Agenda Items | Can View History |
|------|----------------|-------------------|---------------------|-----------------|
| Mom / Primary Parent | Full access. Sees all meeting types. Manages all schedules and sections. | Yes — all types. | Yes — all meeting types. On behalf of Play children. | All family meeting history. |
| Dad / Additional Adult | Sees meeting types they participate in. Can manage schedule/sections if mom grants permission. | Yes — couple meetings, family council (if permitted). Cannot start parent-child meetings without permission. | Yes — meetings they participate in. On behalf of Play children (if permitted). | Meetings they participated in. |
| Special Adult | Not present. Special Adults do not have access to the Meetings feature. | No. | No. | No. |
| Independent (Teen) | Sees their mentor/parent-child meetings and family council. | No — can request a meeting via PRD-15 Requests. | Yes — their own mentor meeting and family council. | Their own meeting history only. |
| Guided | Limited. "Things to Talk About" capture area on their dashboard or via parent prompt. | No. | Indirectly — via "Things to Talk About" which appears in parent's mentor meeting agenda as "Suggested by [child]." | No direct access. |
| Play | Not present. Parents add agenda items on behalf of Play children. | No. | No. | No. |

### Shell Behavior

- **Mom Shell:** Full Meetings page in sidebar navigation. All screens accessible.
- **Dad Shell:** Meetings page shows only meeting types dad participates in. Schedule/section editing requires permission from mom.
- **Independent Teen Shell:** Simplified Meetings view — shows their mentor meeting and family council only. Agenda item add and history view.
- **Guided Dashboard:** "Things to Talk About" capture widget. Simple text input that creates `meeting_agenda_items` with `suggested_by_guided = true`.
- **Play Dashboard:** No Meetings presence.

### Privacy & Transparency

- Meeting summaries for couple meetings are visible to both participants.
- Meeting summaries for mentor meetings are visible to the parent and to the Independent teen. Guided children do not see their mentor meeting summaries.
- Meeting impressions are personal — only visible to the person who recorded them.
- Family council summaries are visible to all participants (and mom can share via Messages to include non-participating members).
- Teens can see that a meeting is scheduled and what agenda items exist, maintaining transparency about family processes.

---

## Data Schema

### Table: `meetings`

Individual meeting records.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| meeting_type | TEXT | | NOT NULL | Enum: 'couple', 'parent_child', 'family_council', 'mentor', 'weekly_review', 'monthly_review', 'quarterly_inventory', 'business', 'custom' |
| template_id | UUID | | NULL | FK → meeting_templates. For custom types. |
| custom_title | TEXT | | NULL | Override title (e.g., "Mentor: Jake" instead of generic "Mentor Meeting") |
| related_member_id | UUID | | NULL | FK → family_members. The specific child for parent-child/mentor meetings. |
| status | TEXT | 'in_progress' | NOT NULL | Enum: 'in_progress', 'paused', 'completed', 'cancelled' |
| mode | TEXT | 'live' | NOT NULL | Enum: 'live', 'record_after' |
| facilitator_member_id | UUID | | NULL | FK → family_members. Who is facilitating (for family council rotation). NULL = parent/AI facilitates. |
| started_by | UUID | | NOT NULL | FK → family_members. Who initiated the meeting. |
| summary | TEXT | | NULL | LiLa-generated, user-edited meeting summary. |
| impressions | TEXT | | NULL | Personal reflections from the person who ended the meeting. |
| lila_conversation_id | UUID | | NULL | FK → lila_conversations. Links to the AI conversation. |
| schedule_id | UUID | | NULL | FK → meeting_schedules. Which schedule this meeting fulfills. |
| calendar_event_id | UUID | | NULL | FK → calendar_events. The calendar event this meeting corresponds to. |
| started_at | TIMESTAMPTZ | now() | NOT NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| duration_minutes | INTEGER | | NULL | Calculated on completion. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom can read all family meetings. Other members can read meetings where they are a participant (via `meeting_participants`). The person who started the meeting can update it.

**Indexes:**
- `(family_id, meeting_type, status)` — active/recent meetings by type
- `(family_id, completed_at DESC)` — history sorted by recency
- `(schedule_id)` — meetings linked to a schedule
- `(related_member_id)` — meetings for a specific child

---

### Table: `meeting_participants`

Tracks who participates in each meeting.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| meeting_id | UUID | | NOT NULL | FK → meetings. CASCADE delete. |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| role | TEXT | 'participant' | NOT NULL | Enum: 'participant', 'facilitator', 'observer' |
| notified_at | TIMESTAMPTZ | | NULL | When the post-meeting notification was sent |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Members can read participant records for meetings they are part of. Mom can read all.

**Indexes:**
- `(meeting_id)` — who was in this meeting
- `(family_member_id, created_at DESC)` — this member's meeting history
- Unique constraint on `(meeting_id, family_member_id)`

---

### Table: `meeting_schedules`

Recurring meeting configuration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| meeting_type | TEXT | | NOT NULL | Same enum as meetings.meeting_type |
| template_id | UUID | | NULL | FK → meeting_templates. For custom types. |
| related_member_id | UUID | | NULL | FK → family_members. For per-child mentor meetings. |
| recurrence_rule | TEXT | 'weekly' | NOT NULL | Enum: 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom' |
| recurrence_details | JSONB | '{}' | NOT NULL | Complex patterns: `{days: ['sat'], preferred_time: '20:00', monthly_type: 'ordinal', monthly_ordinal: 3, monthly_weekday: 'thu', end_date: null}` |
| next_due_date | TIMESTAMPTZ | | NULL | Calculated. When the next meeting is due. |
| last_completed_date | TIMESTAMPTZ | | NULL | When the most recent meeting was completed. |
| calendar_event_id | UUID | | NULL | FK → calendar_events. The recurring calendar event linked to this schedule. |
| is_active | BOOLEAN | true | NOT NULL | Can be paused without deleting |
| created_by | UUID | | NOT NULL | FK → family_members |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

> **Decision rationale:** Uses the same `recurrence_rule` + `recurrence_details` JSONB pattern as PRD-09A tasks. This ensures compatibility with a future shared recurrence UI component.

**RLS Policy:** Family-scoped. Mom can CRUD all. Dad can CRUD schedules for meeting types he participates in (if permitted). Teens can read schedules for their meetings.

**Indexes:**
- `(family_id, meeting_type, is_active)` — active schedules per type
- `(family_id, next_due_date)` — upcoming meetings sorted by due date
- `(related_member_id)` — schedules for a specific child

---

### Table: `meeting_templates`

Custom user-created meeting templates.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| name | TEXT | | NOT NULL | Template display name |
| participant_type | TEXT | 'personal' | NOT NULL | Enum: 'personal', 'two_person', 'group' |
| default_partner_id | UUID | | NULL | FK → family_members. For two_person types. |
| default_participant_ids | UUID[] | | NULL | Array of FKs → family_members. For group types. |
| created_by | UUID | | NOT NULL | FK → family_members |
| is_archived | BOOLEAN | false | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom can CRUD all. Template creator can update their own. Other participants can read templates for meetings they're part of.

**Indexes:**
- `(family_id, is_archived)` — active templates

---

### Table: `meeting_template_sections`

Per-user customizable agenda sections for each meeting type.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| meeting_type | TEXT | | NOT NULL | Meeting type this section belongs to |
| template_id | UUID | | NULL | FK → meeting_templates. For custom type sections. |
| section_name | TEXT | | NOT NULL | Display title |
| prompt_text | TEXT | | NULL | LiLa instruction for this section. If NULL, LiLa uses the section_name as a general topic. |
| sort_order | INTEGER | | NOT NULL | Position in the agenda |
| is_default | BOOLEAN | false | NOT NULL | System-seeded default section |
| is_archived | BOOLEAN | false | NOT NULL | Archived = hidden from active agenda |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom can CRUD all. Dad can CRUD sections for meeting types he participates in (if permitted). Teens can read.

**Indexes:**
- `(family_id, meeting_type, is_archived, sort_order)` — active sections in order
- `(template_id, sort_order)` — sections for a custom template

---

### Table: `meeting_agenda_items`

Between-meeting discussion items.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| meeting_type | TEXT | | NOT NULL | Which meeting type this item is for |
| template_id | UUID | | NULL | FK → meeting_templates. For custom types. |
| related_member_id | UUID | | NULL | FK → family_members. For per-child meetings (mentor, parent-child). |
| content | TEXT | | NOT NULL | The agenda item text |
| added_by | UUID | | NOT NULL | FK → family_members. Who added this item. |
| suggested_by_guided | BOOLEAN | false | NOT NULL | True if added via a Guided child's "Things to Talk About" capture. |
| status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'discussed', 'removed' |
| discussed_in_meeting_id | UUID | | NULL | FK → meetings. Which meeting this was discussed in. |
| source | TEXT | 'quick_add' | NOT NULL | Enum: 'quick_add', 'notepad_route', 'review_route' |
| source_reference_id | UUID | | NULL | FK to source record (e.g., notepad_tabs.id) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. All meeting participants can read pending items for meetings they're part of. Mom can read all. The person who added an item can update/remove it. Mom can update/remove any item.

**Indexes:**
- `(family_id, meeting_type, status)` — pending items per meeting type
- `(family_id, meeting_type, related_member_id, status)` — pending items for a specific child's meeting
- `(discussed_in_meeting_id)` — items discussed in a specific meeting
- `(added_by)` — items a member has added

---

### Enum/Type Updates

New TEXT CHECK enums:
- `meeting_type`: 'couple', 'parent_child', 'family_council', 'mentor', 'weekly_review', 'monthly_review', 'quarterly_inventory', 'business', 'custom'
- `meeting_status`: 'in_progress', 'paused', 'completed', 'cancelled'
- `meeting_mode`: 'live', 'record_after'
- `meeting_participant_role`: 'participant', 'facilitator', 'observer'
- `agenda_item_status`: 'pending', 'discussed', 'removed'
- `agenda_item_source`: 'quick_add', 'notepad_route', 'review_route'
- `template_participant_type`: 'personal', 'two_person', 'group'

Updates to existing enums:
- `studio_queue.source`: Add `'meeting_action'` (already referenced in PRD-09A/09B)
- `journal_entries.entry_type`: Add `'meeting_notes'`
- `journal_entries.source`: Add `'meeting'`
- `calendar_events.source`: Add `'meeting_schedule'`
- `notifications.notification_type`: Add `'meeting_reminder'`, `'meeting_completed'`, `'meeting_action_routed'`
- `notifications.category`: Add `'meetings'`
- `conversation_threads.source_type`: Add `'meeting_summary'`

---

## Flows

### Incoming Flows (How Data Gets INTO Meetings)

| Source | How It Works |
|--------|-------------|
| Smart Notepad "Send to → Agenda" (PRD-08) | Inline meeting picker overlay shows upcoming meetings with agenda capability. User selects a meeting, content becomes a `meeting_agenda_items` record with `source = 'notepad_route'`. Wires the PRD-08 stub. |
| Quick-add on Meetings page | Direct text input in the agenda items list component. Creates `meeting_agenda_items` with `source = 'quick_add'`. |
| Review & Route extraction (PRD-08) | Extracted items tagged as "agenda item" route to the meeting picker. Same inline overlay pattern. `source = 'review_route'`. |
| Guided child "Things to Talk About" | Simple capture input on Guided dashboard creates `meeting_agenda_items` with `suggested_by_guided = true`. |
| PRD-14B Calendar | Meeting schedules create recurring calendar events. Calendar events link back to meetings via `source_reference_id`. |
| PRD-15 Requests | A teen can send a "Request a meeting" to mom. Not a direct meeting creation — mom decides whether to start one. |

### Outgoing Flows (How Meetings Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Studio Queue / Tasks (PRD-09A/09B) | Action items routed to any member's Task Queue with `source = 'meeting_action'` and `source_reference_id` = meeting ID. Lands in Universal Queue Modal Tasks tab for full configuration. |
| Calendar (PRD-14B) | Action items routed to Calendar open Quick Add pre-filled. Meeting schedules create recurring calendar events. |
| Lists (PRD-09B) | Action items routed to a list add the item to an existing list or create a new one via the list picker. |
| Best Intentions (PRD-06) | Action items routed as Best Intentions create `best_intentions` records. |
| Guiding Stars (PRD-06) | Action items routed as Guiding Stars create `guiding_stars` records. |
| Goals (PRD-12A) | Action items routed as Goals create goal records or sequential collections (stub — depends on LifeLantern/Goals PRD). |
| Journal (PRD-08) | Meeting summaries auto-saved as `journal_entries` with `entry_type = 'meeting_notes'`. |
| Messages (PRD-15) | "Share to Messages" creates a thread in the relevant conversation space with the meeting summary. |
| Notifications (PRD-15) | Post-meeting notifications to all participants. Meeting reminder notifications via calendar event reminders. |

---

## AI Integration

### Guided Mode: `meeting`

> **Depends on:** PRD-05 registers the `meeting` guided mode. PRD-16 defines its full behavior.

**Mode key:** `meeting`
**Subtypes:** The meeting type (couple, family_council, mentor, etc.) is passed as a subtype parameter.

### Context Loaded

| Context Source | When Loaded | Notes |
|----------------|-------------|-------|
| Recent meetings (last 2-3 of same type) | Always | Summaries from previous meetings for continuity |
| Pending agenda items | Always | All `meeting_agenda_items` with `status = 'pending'` for this meeting type/child |
| Customized agenda sections | Always | Active `meeting_template_sections` in sort order, with prompt text |
| InnerWorkings (PRD-07) | Couple, mentor, parent-child | Both participants' InnerWorkings entries (respecting sharing settings) |
| Guiding Stars (PRD-06) | All types | Active Guiding Stars for alignment check-ins |
| Best Intentions (PRD-06) | All types | Active Best Intentions for commitment check-ins |
| Recent victories (PRD-11) | Mentor, parent-child, family council | Participant victories for celebration and encouragement |
| Task completion patterns (PRD-09A) | Mentor, parent-child | Child's recent task/routine completion for accountability discussions |
| Family Vision Quest (PRD-12B) | Family council | Family vision statement and active vision sections for alignment |
| Family Communication Guidelines (PRD-15) | All multi-participant types | Mom's communication values for LiLa's facilitation tone |

### AI Behavior

**Live Mode:**
- Walk through agenda sections conversationally, using each section's `prompt_text` to guide the discussion
- Weave pending agenda items in at appropriate moments — don't dump them all at the start
- Reference recent meeting summaries for continuity ("Last time you mentioned wanting to revisit the screen time discussion...")
- For couple meetings: balance both participants' perspectives, never take sides
- For mentor meetings: encourage the child's voice, celebrate growth, address challenges with warmth
- For family council: ensure every participant gets heard, facilitate rather than lead, adapt to the designated facilitator if one is set
- Keep track of emerging action items during the conversation and surface them at the end

**Record After Mode:**
- Shift to a retrospective, journalistic tone: "Tell me what you talked about"
- Ask targeted follow-up questions based on the meeting type's agenda sections
- Compile responses into a structured summary organized by section
- Extract action items from the narrative

**Facilitator-aware (family council):**
- If a child facilitator is designated, LiLa provides structured prompts: "Great job, [name]! You might want to ask if anyone has anything for old business."
- For older/experienced facilitators, LiLa stays quiet unless asked or the conversation stalls
- LiLa never overrides the facilitator — supports, doesn't supplant

### System Prompt Notes

- Never reference specific framework names (TSG, Covey, etc.) — embody the principles without attribution
- For family council: emphasize that everyone gets heard, decisions aim for unity, and the goal is problem-solving ownership (not top-down directives)
- For couple meetings: balance warmth with directness, encourage vulnerability, reference shared goals and vision
- For mentor meetings: celebrate the child's growth, ask questions rather than lecture, help the parent connect with the child's perspective
- Always end by summarizing what was discussed and asking if there are action items to capture

---

## Edge Cases

### No Agenda Items
- If a meeting starts with no pending agenda items, LiLa acknowledges this and flows through the agenda sections conversationally. The meeting is still valuable — agenda items are a bonus, not a requirement.

### Meeting Interrupted (Network Failure / App Close)
- Meeting conversations are saved incrementally (per PRD-05 conversation engine). If the app closes mid-meeting, the `meetings` record stays at `status = 'in_progress'`. Reopening offers to resume.
- "Resume Meeting" option appears on the Meetings Home page for any in-progress meetings.

### Overdue Meetings
- If a meeting is overdue by more than 2 weeks, the upcoming card shows a gentle nudge: "It's been a while since your last [meeting type]. Ready to schedule one?"
- Overdue meetings don't create guilt — the indicator is informational, not judgmental.

### Large Family Council (7+ Participants)
- LiLa adapts its facilitation for group size: more structured turn-taking prompts for larger groups, awareness that not everyone will speak on every topic
- Agenda items from many participants may be grouped by theme when presented to LiLa

### Guided Child's "Things to Talk About" — No Items Added
- If a Guided child has no items in their "Things to Talk About" for an upcoming mentor meeting, no indicator appears. The absence is invisible — no shame for not having anything to add.

### Dad Wants to Start a Meeting He Doesn't Have Permission For
- If dad tries to start a parent-child meeting with a child he doesn't have meeting permissions for, the system shows a friendly message: "This meeting type requires permission from [mom]. Ask her to update your access."
- Dad can always start a couple meeting (implicit permission from being a couple) and personal review meetings.

### Multiple Custom Templates with Same Name
- Allowed. The system uses the template ID internally, not the name. Users might want "Weekly Check-In" for two different contexts.

### Meeting Started but Not Completed for Days
- After 24 hours, a stale in-progress meeting shows a prompt: "You have an unfinished [meeting type]. Want to complete it or cancel?"
- After 7 days, the meeting is auto-cancelled with a note in history.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `meetings_basic` | Personal review meetings (weekly, monthly, quarterly). Agenda item capture. Meeting history. | Essential |
| `meetings_shared` | Shared meetings: couple, parent-child, mentor, family council. Multi-participant agenda, shared visibility. | Enhanced |
| `meetings_ai` | LiLa guided facilitation, context-aware prompts, action item extraction, Record After structured capture. | Enhanced |
| `meetings_custom_templates` | Custom meeting templates with LiLa section suggestions. Template sharing and deployment. | Full Magic |
| `meetings_facilitator_rotation` | Child facilitator designation with adaptive LiLa guidance levels. | Full Magic |

> **Tier rationale:** Basic personal review meetings are Essential because they're single-user and provide core planning value with no AI cost. Shared meetings are Enhanced because they require multi-member infrastructure and represent the "connected family" value proposition. AI-guided facilitation is Enhanced because it's the core differentiating experience of the meetings feature. Custom templates and facilitator rotation are Full Magic because they add significant AI sophistication and represent power-user features.

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Guided child "Things to Talk About" capture widget | Full Guided Dashboard design with capture widgets | PRD-25 (Guided Dashboard) |
| Meeting-to-Gamification connection (meeting attendance streaks, facilitator badges) | Gamification reward triggers for meeting participation | PRD-24 (Rewards & Gamification) |
| Morning/Evening Rhythm integration (upcoming meetings as reminders) | Daily rhythm check-in surfaces meeting schedule | Morning/Evening Rhythm PRD |
| Meeting notes in Family Overview aggregation | Family Overview shows recent meeting summaries across all types | PRD-14C (Family Overview) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| "Send to → Agenda" routing destination with inline meeting picker overlay | PRD-08 | Fully wired: inline picker shows upcoming meetings from `meeting_schedules`, creates `meeting_agenda_items` with `source = 'notepad_route'`. |
| `meeting` guided mode registration | PRD-05 | Fully wired: mode key `meeting` with subtype parameter, full context assembly, and Live/Record After behavioral modes. |
| Agenda routing stub ("Adds agenda item to selected meeting") | PRD-08 | Fully wired: `meeting_agenda_items` table with source tracking and meeting picker overlay component. |
| `source = 'meeting_action'` in studio_queue | PRD-09A/09B | Fully wired: post-meeting action items route to Studio Queue with this source value. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Meetings Home page renders with Upcoming section, Meeting Types accordion, and Recent History
- [ ] All 9 meeting types available (couple, parent_child, family_council, mentor, weekly_review, monthly_review, quarterly_inventory, business, custom)
- [ ] Meeting schedule editor with recurrence configuration (weekly, biweekly, monthly, custom days, custom monthly)
- [ ] Meeting schedules create recurring calendar events when enabled
- [ ] Between-meeting agenda item capture: quick-add on Meetings page + "Send to → Agenda" from Notepad (wires PRD-08 stub)
- [ ] Inline meeting picker overlay in Notepad's Send To grid (reusable component from PRD-08 pattern)
- [ ] Shared agenda visibility: all participants see pending items for meetings they're part of
- [ ] Parents can add agenda items on behalf of Play children
- [ ] Live Mode: LiLa guided conversation using customized agenda sections with pending items in context
- [ ] Record After Mode: retrospective capture with structured summary output
- [ ] Family council participant selection before meeting start (default: whole family, deselect to exclude)
- [ ] Post-meeting review screen: editable summary, optional impressions, action item routing cards
- [ ] Action items route to Studio Queue with `source = 'meeting_action'` (never bypass queue)
- [ ] "Share to Messages" creates thread in relevant conversation space with meeting summary
- [ ] Meeting summary auto-saved to Journal as `entry_type = 'meeting_notes'`
- [ ] Agenda Section Editor: drag-to-reorder, edit titles/prompts, archive defaults, add custom sections
- [ ] Default sections seeded for couple, mentor, parent_child, family_council, weekly_review, monthly_review, quarterly_inventory
- [ ] Post-meeting notifications to all other participants with routing summary
- [ ] Meeting history with type filtering and per-meeting detail view
- [ ] `meeting_participants` join table enforcing dual ownership pattern
- [ ] Meeting completions advance `next_due_date` on schedule
- [ ] Calendar event instances marked completed when meeting completes
- [ ] RLS policies enforce participant-scoped access on all meeting tables
- [ ] `useCanAccess('meetings_*')` wired on all meeting surfaces from day one

### MVP When Dependency Is Ready
- [ ] Guided child "Things to Talk About" capture renders when PRD-25 (Guided Dashboard) is built
- [ ] Meeting attendance/facilitation gamification triggers when PRD-24 (Rewards & Gamification) is built
- [ ] Meeting summaries appear in Family Overview when PRD-14C is built
- [ ] Morning/Evening Rhythm surfaces upcoming meetings when that PRD is built

### Post-MVP
- [ ] Custom template sharing: deploy a template for multiple participant pairs
- [ ] LiLa section suggestions for custom templates
- [ ] Child facilitator rotation with adaptive AI guidance levels
- [ ] Voice input/recording for Record After mode (premium tier)
- [ ] Meeting transcription with Review & Route extraction from voice recording
- [ ] Meeting templates in AI Vault for community sharing
- [ ] Meeting attendance tracking and streak visualization
- [ ] "Refer back to decisions" feature: LiLa references past meeting decisions in other conversations
- [ ] Family council voting system (unanimous decisions with compromise facilitation)

---

## CLAUDE.md Additions from This PRD

- [ ] Meetings: action items from meetings ALWAYS route through Studio Queue with `source = 'meeting_action'`. Never create tasks directly from meeting completion.
- [ ] Meetings: `meeting_participants` join table is the canonical source for "who is in this meeting." All access checks go through this table.
- [ ] Meetings: agenda sections are dynamically assembled into the AI prompt from `meeting_template_sections`. Custom sections take effect immediately — no rebuild or restart needed.
- [ ] Meetings: pending agenda items are formatted as a `PENDING AGENDA ITEMS:` block in the system prompt. LiLa weaves them in naturally, never dumps them all at once.
- [ ] Meetings: default sections auto-seed on first access from `BUILT_IN_AGENDAS` constant. Users customize from that point forward.
- [ ] Meetings: `recurrence_rule` + `recurrence_details` JSONB pattern matches PRD-09A task scheduling for future shared component compatibility.
- [ ] Meetings: calendar events created from meeting schedules use `source = 'meeting_schedule'` on `calendar_events`.
- [ ] Meetings: the inline meeting picker overlay in the Notepad's Send To grid is a reusable component (same pattern as tracker picker and family member picker from PRD-08).
- [ ] Meetings: meeting summaries auto-save to `journal_entries` with `entry_type = 'meeting_notes'` and `source = 'meeting'`.
- [ ] Meetings: "Share to Messages" creates a `conversation_threads` record with `source_type = 'meeting_summary'` in the relevant PRD-15 conversation space.
- [ ] Meetings: all meeting-related UI must be wrapped in `PermissionGate` per PRD-02 conventions. Feature keys registered in Tier Gating section must be compatible with PRD-02's Feature Key Registry format.
- [ ] Meetings: post-meeting routing strip is a compact subset of the Notepad's Send To destinations — same pattern as PRD-15's Requests accept routing strip. Both should use a shared compact routing strip component.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `meetings`, `meeting_participants`, `meeting_schedules`, `meeting_templates`, `meeting_template_sections`, `meeting_agenda_items`

Enums updated:
- `studio_queue.source`: + 'meeting_action'
- `journal_entries.entry_type`: + 'meeting_notes'
- `journal_entries.source`: + 'meeting'
- `calendar_events.source`: + 'meeting_schedule'
- `notifications.notification_type`: + 'meeting_reminder', 'meeting_completed', 'meeting_action_routed'
- `notifications.category`: + 'meetings'
- `conversation_threads.source_type`: + 'meeting_summary'

Triggers added: `set_updated_at` on `meetings`, `meeting_schedules`, `meeting_templates`, `meeting_template_sections`, `meeting_agenda_items`

---

## Built-In Agenda Defaults

### Couple Meeting (6 sections)
1. **Check-In** — "How are we each doing? What's on your mind and heart?"
2. **Relationship Temperature** — "How are we feeling about us? Anything we need to address?"
3. **Parenting Alignment** — "Are we on the same page with the kids? Any concerns or adjustments?"
4. **Calendar & Logistics** — "What's coming up? What needs coordinating?"
5. **Dreams & Goals** — "What are we working toward together? Any progress to celebrate?"
6. **Appreciation** — "What do I appreciate about you this week?"

### Mentor / Parent-Child Meeting (6 sections)
1. **Check-In** — "How's your week been? What's going on in your world?"
2. **Wins & Celebrations** — "What went well? What are you proud of?"
3. **Challenges** — "What's been hard? Where are you struggling?"
4. **Goals & Commitments** — "How are your commitments going? Any adjustments needed?"
5. **Open Floor** — "Is there anything else you want to talk about?"
6. **Parent Encouragement** — "Share what you see growing in this child. Specific encouragement."

### Family Council (6 sections)
1. **Fun Opening / Weekly Highs** — "What went well this week? What's everyone grateful for?"
2. **Old Business** — "Review decisions from last meeting. How are they working?"
3. **Calendar & Upcoming Week** — "Review the schedule. Bring requests and plans."
4. **New Business / Problem-Solving** — "Address issues or ideas anyone has brought to the agenda."
5. **Appreciation Round** — "Each person encourages or thanks someone in the family."
6. **Decisions & Commitments** — "Summarize what was decided. Who's doing what?"

### Weekly Review — Personal (5 sections)
1. **Week in Review** — "What happened this week? Highs and lows?"
2. **Wins & Progress** — "What did I accomplish? What moved forward?"
3. **What Didn't Work** — "What fell through? What needs to change?"
4. **Next Week Planning** — "What's most important for next week?"
5. **Personal Check-In** — "How am I doing overall? Energy, spirit, relationships?"

### Monthly Review — Personal (5 sections)
1. **Month Overview** — "How would I describe this month in a sentence?"
2. **Progress on Goals** — "Where did I make progress? Where did I stall?"
3. **Patterns & Insights** — "What patterns am I noticing? What's working, what isn't?"
4. **Adjustments** — "What needs to shift for next month?"
5. **Gratitude & Growth** — "What am I grateful for? Where have I grown?"

### Quarterly Inventory — Personal (5 sections)
1. **Quarter Overview** — "What defined this quarter?"
2. **Life Area Assessment** — "How am I doing across my key life areas?"
3. **Goal Progress Deep Dive** — "Detailed review of each active goal."
4. **Vision Alignment** — "Am I moving toward who I want to be?"
5. **Next Quarter Intentions** — "What are my top priorities for the next 90 days?"

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Dual ownership via `meeting_participants` join table** | One meeting record, multiple participants linked via join table. Matches PRD-15's `conversation_space_members` pattern. Avoids duplicating records while giving all participants access. |
| 2 | **Parents initiate meetings; teens request via PRD-15 Requests** | Mom-first architecture. Dad can initiate if he has permission. Teens can request a meeting but cannot start one — preserves parental control over family rhythms. |
| 3 | **Shared agenda visibility for all meeting participants** | "Both people come prepared" principle. Anyone can add/remove items for family council. Parents enter on behalf of Play children. Between-meeting capture trains families to defer requests to the meeting. |
| 4 | **Guided children: "Things to Talk About" capture** | Low-friction participation without Notepad access. Items appear in parent's agenda view as "Suggested by [child]." Full widget design deferred to PRD-25. |
| 5 | **Manual "Share to Messages" post-meeting, not automatic** | Human-in-the-mix principle. Mom decides what gets shared and can edit before it goes out. Creates thread in relevant PRD-15 conversation space. |
| 6 | **Meetings are self-contained LiLa guided conversations** | Meeting facilitation is distinct from messaging. The meeting happens in LiLa's guided mode. Summaries can be shared TO messaging afterward, but the live discussion is its own focused experience. |
| 7 | **Meeting schedules create recurring calendar events** | `source = 'meeting_schedule'` on calendar_events. Meetings visible on family calendar. Completing marks the calendar event done. No separate reminder infrastructure — calendar reminders handle everything via PRD-15 notifications. |
| 8 | **Calendar reminders handle meeting notifications** | One reminder system for everything. No meeting-specific notification infrastructure. |
| 9 | **Live Mode = both present, LiLa facilitates. Record After = retrospective capture. Same output.** | Two entry modes, same meeting record, same routing. `meetings.mode` distinguishes them. AI tone adapts (facilitative vs. retrospective). |
| 10 | **Action items always route through Studio Queue with `source = 'meeting_action'`** | Consistent with universal queue pattern. Person who ends meeting routes everything. All participants notified of routing decisions. Never bypasses queue to create tasks directly. |
| 11 | **Family council defaults to whole family, mom can select subset** | Flexible for large families. Participant picker appears before family council meetings. Selected participants tracked in `meeting_participants`. |
| 12 | **Unbranded framework-inspired defaults, fully customizable sections** | Six default sections per meeting type embodying best practices without attributing any framework. Custom persistent sections that recur across every instance. All customizable via Agenda Section Editor. |
| 13 | **Adopt PRD-09A's recurrence pattern for meeting schedules** | `recurrence_rule` + `recurrence_details` JSONB. Don't invent a new system. Universal recurrence component to be harmonized during pre-build audit in a separate session. |
| 14 | **Custom templates shareable, deployed for specific participant pairs** | Mom creates a template once, deploys for multiple relationships. Matches task template deployment pattern from PRD-09A. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Universal recurrence UI component design | Separate design session to harmonize across Tasks, Calendar, and Meetings |
| 2 | Guided child "Things to Talk About" full widget design | PRD-25 (Guided Dashboard) |
| 3 | Meeting gamification (attendance streaks, facilitator badges) | PRD-24 (Rewards & Gamification) |
| 4 | Voice recording and transcription for meetings | Post-MVP premium feature |
| 5 | Family council voting system | Post-MVP |
| 6 | Meeting templates in AI Vault | Post-MVP, depends on AI Vault PRD |
| 7 | "Refer back to decisions" cross-conversation feature | Post-MVP enhancement to LiLa context system |
| 8 | Child facilitator rotation with adaptive guidance | MVP stretch or post-MVP (Full Magic tier) |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-08 (Journal + Smart Notepad) | "Send to → Agenda" stub fully wired. Inline meeting picker overlay populated from `meeting_schedules`. Agenda items created with `source = 'notepad_route'`. Journal gains `entry_type = 'meeting_notes'` and `source = 'meeting'`. | Mark Agenda routing stub as wired. Add 'meeting_notes' to entry_type enum. Add 'meeting' to source enum. |
| PRD-05 (LiLa Core AI System) | `meeting` guided mode fully specified with subtype parameter, context assembly, Live/Record After behavioral modes, and facilitator-aware behavior. | Update guided mode registry to reflect full specification. Note meeting context sources in context assembly documentation. |
| PRD-09A/09B (Tasks & Studio) | `source = 'meeting_action'` on `studio_queue` now fully wired. Meeting post-review routes action items to Studio Queue. | Confirm 'meeting_action' in studio_queue.source enum. Note meeting as an incoming source in task flow documentation. |
| PRD-14B (Calendar) | `source = 'meeting_schedule'` on `calendar_events`. Meeting schedules create recurring calendar events. Meeting completion marks calendar event instances as done. | Add 'meeting_schedule' to calendar_events.source enum. Document the meeting→calendar linkage pattern. |
| PRD-15 (Messages, Requests & Notifications) | 'meeting_reminder', 'meeting_completed', 'meeting_action_routed' added to notification_type. 'meetings' added to notification category. 'meeting_summary' added to conversation_threads.source_type. | Update notification enum documentation. Add meetings category to notification preferences seeding. |
| PRD-06 (Guiding Stars & Best Intentions) | Best Intentions is a routing destination from meeting action items. Guiding Stars and Best Intentions loaded as meeting AI context. | No schema changes. Note meeting as an incoming source for Best Intentions. |
| PRD-11 (Victory Recorder) | Recent victories loaded as meeting AI context for mentor/parent-child/family council meetings. | No schema changes. Note victory data as a meeting context source. |
| PRD-12B (Family Vision Quest) | Family Vision Quest data loaded as context for family council meetings. | No schema changes. Note vision data as a meeting context source. |
| Build Order Source of Truth | PRD-16 completed. 6 new tables. `meeting` guided mode fully wired. Meetings registered as a notification category. | Move PRD-16 to Section 2 (completed). Register 6 tables. Update guided mode registry (Section 9). |

---

*End of PRD-16*
