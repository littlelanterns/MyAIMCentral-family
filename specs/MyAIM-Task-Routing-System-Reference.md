# MyAIM Family: Task Routing System — Complete Reference

**Purpose:** This document maps the complete task lifecycle from every entry point through the Studio Queue, the Task Creation Modal, deployment, and the daily active view. Use this as a reference when writing any PRD that creates, routes, or interacts with tasks.

**Source PRDs:** PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates), PRD-14B (Calendar), PRD-15 (Messages, Requests & Notifications)

---

## The Big Picture: Three-Page Model

MyAIM's task ecosystem is organized across three distinct surfaces, each with a different purpose:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────────┐
│              │       │              │       │                      │
│   STUDIO     │──────▶│   TASKS      │──────▶│   DASHBOARD          │
│  (PRD-09B)   │       │  (PRD-09A)   │       │  (PRD-14, per-member)│
│              │       │              │       │                      │
│  "The craft  │       │  "The library │       │  "My daily view"     │
│   store"     │       │   of config'd │       │                      │
│              │       │   items"      │       │  Active tasks,       │
│  Browse blank│       │              │       │  routines, opps      │
│  templates,  │       │  Customized   │       │  with completion     │
│  customize,  │       │  reusable     │       │  tracking and        │
│  deploy      │       │  templates,   │       │  sparkle animations  │
│              │       │  assignments, │       │                      │
│              │       │  schedules,   │       │                      │
│              │       │  queue        │       │                      │
└──────────────┘       └──────────────┘       └──────────────────────┘
```

**Studio** = where things are designed (blank templates, customization)
**Tasks page** = where things are managed (configured items, assignments, queue, deployment)
**Dashboard** = where things are done (each member's daily active view with collapsible sections)

---

## The Studio Queue: Universal Intake Funnel

The `studio_queue` table (defined in PRD-09B) is the single universal intake point for all draft items entering the task system from anywhere in the platform. It's not just for tasks — it handles lists, widgets, and trackers too, via a `destination` flag.

### Schema Summary

```
studio_queue
├── id (UUID, PK)
├── family_id (FK → families)
├── owner_id (FK → family_members — who this item belongs to)
├── destination ('task' | 'list' | 'widget' | 'tracker')
├── content (TEXT — the raw title/content)
├── content_details (JSONB — structured data from source)
├── source (enum — where this item came from)
├── source_reference_id (UUID — FK to originating record)
├── structure_flag ('single' | 'individual' | 'ai_sort' | 'sequential' | 'chronological')
├── requester_id (FK → family_members, for member requests)
├── requester_note (TEXT)
├── processed_at (TIMESTAMPTZ — when configured/promoted, NULL = pending)
├── dismissed_at (TIMESTAMPTZ — when declined)
├── dismiss_note (TEXT)
└── created_at (TIMESTAMPTZ)
```

### Source Values (Where Items Come From)

| Source Enum | Origin | Typical Destination | How It Arrives |
|-------------|--------|--------------------|----|
| `notepad_routed` | Smart Notepad "Send to → Tasks" | task | User writes in Notepad, taps Send To → Tasks, selects structure (Single/Individual/AI Sort/Sequential) |
| `review_route` | Review & Route extraction | task or list | LiLa extracts actionable items from Notepad content, user routes each card to Tasks |
| `lila_conversation` | LiLa suggests creating a task during chat | task | LiLa says "Want me to add that to your tasks?" User confirms. |
| `meeting_action` | Meeting action items | task | After a meeting, LiLa compiles action items. User confirms which become tasks. Source includes `meeting_id` in `source_reference_id`. |
| `goal_decomposition` | LifeLantern or Goal system breaks a goal into steps | task | Goal is decomposed into actionable steps, each deposited into queue |
| `project_planner` | Project Planner breaks a project into tasks | task | Project milestones decomposed into tasks |
| `member_request` | Family member sends a Task Request | task | Kid asks parent "Can you add [thing] to my tasks?" — arrives with `requester_id` and `requester_note` |
| `list_promoted` | List item promoted to task | task | User taps [→ Tasks] on a list item, promoting it from a reference list to an actionable task |

---

## Every Entry Point That Creates Tasks

### 1. Manual Creation (Tasks Page)

**Path:** Tasks page → [+ Create] → Task Creation Modal
**Queue involvement:** None — goes directly to the Task Creation Modal
**Source:** Direct creation, no `studio_queue` record

### 2. Smart Notepad "Send to → Tasks" (PRD-08)

**Path:** Notepad → Send To grid → Tasks → Structure picker → Studio Queue → Task Creation Modal
**How it works:**
1. User writes content in a Notepad tab
2. Taps "Send to..." → selects "Tasks" from the grid
3. Inline picker appears with structure options:
   - **Single** — entire note becomes one task
   - **Individual** — LiLa parses into separate task items
   - **AI Sort** — LiLa suggests optimal task structure
   - **Sequential** — items become an ordered sequential collection
4. Content deposited into `studio_queue` with `destination = 'task'`, `source = 'notepad_routed'`, and the chosen `structure_flag`
5. Notepad tab closes (with undo toast), moves to history tagged "Routed to: Tasks"
6. Items appear in the Tasks page Queue tab for configuration via the Task Creation Modal

### 3. Review & Route Extraction (PRD-08)

**Path:** Notepad content → "Review & Route" → LiLa extracts items → User routes individual cards → Studio Queue → Task Creation Modal
**How it works:**
1. User taps "Review & Route" on Notepad content (or meeting transcript, or LiLa conversation)
2. LiLa processes the content and extracts actionable/saveable items as individual cards
3. Each card has its own routing buttons (same Send To grid icons)
4. User taps Tasks on specific cards → deposited into `studio_queue` with `source = 'review_route'`
5. Other cards can route to Calendar, Lists, Journal, etc. — each going to the appropriate destination

### 4. Meeting Action Items (PRD-16 — Meetings)

**Path:** Meeting conversation → LiLa compiles action items → User confirms → Studio Queue → Task Creation Modal
**How it works:**
1. During a guided meeting conversation (couple, parent-child, family, mentor), discussions produce action items
2. On meeting completion, LiLa compiles a summary including identified action items
3. User reviews the action items. For each:
   - Confirm as task → deposited into `studio_queue` with `source = 'meeting_action'`, `source_reference_id = meeting_id`
   - Dismiss / not a task → skipped
4. **In multi-member MyAIM:** Action items from a couple meeting might go to Mom's queue OR Dad's queue. The routing flow should let the user specify which family member's queue receives each action item.
5. Items appear in the target member's Queue tab for configuration

**Key convention for Meetings PRD:** Meeting action items do NOT bypass the Studio Queue. They enter the queue like everything else, with `source = 'meeting_action'`. The Task Creation Modal then handles the full configuration (assignment, schedule, rewards, etc.). This keeps the task creation flow consistent regardless of origin.

### 5. LiLa Conversation Suggestion (PRD-05)

**Path:** LiLa conversation → "Want me to add that to your tasks?" → User confirms → Studio Queue → Task Creation Modal
**How it works:**
1. During any LiLa conversation, LiLa detects an actionable item
2. LiLa offers: "That sounds like something to add to your tasks. Want me to?"
3. User confirms → deposited into `studio_queue` with `source = 'lila_conversation'`, `source_reference_id = conversation_id`

### 6. Family Request → Accepted → "Add to Tasks" (PRD-15)

**Path:** Request received → Queue Modal Requests tab → Accept → "Add to Tasks" → Studio Queue → Task Creation Modal
**How it works:**
1. A family member sends a request (e.g., kid asks "Can I have a new math workbook?")
2. Request appears in recipient's Universal Queue Modal, Requests tab
3. Recipient taps Accept → routing strip appears → taps "✅ Add to Tasks"
4. Request content deposited into `studio_queue` with `source = 'member_request'`, `requester_id` set
5. Alternatively, some requests ARE task requests directly — "Can you add [chore] to my list?" — these also route to the queue

### 7. Goal Decomposition (LifeLantern / Goals)

**Path:** Goal → "Break into steps" → LiLa decomposes → Studio Queue → Task Creation Modal
**How it works:**
1. User has a goal in LifeLantern or the Goal system
2. Taps "Break Down" or LiLa suggests decomposition
3. LiLa generates actionable steps
4. Each step deposited into `studio_queue` with `source = 'goal_decomposition'`

### 8. List Item Promotion (PRD-09B)

**Path:** Lists page → item → [→ Tasks] button → Studio Queue → Task Creation Modal
**How it works:**
1. User has a to-do list, packing list, or other list with actionable items
2. Taps [→ Tasks] icon on a specific item
3. Item deposited into `studio_queue` with `source = 'list_promoted'`, `source_reference_id = list_item.id`
4. Original list item stays in the list with a "promoted" badge

### 9. QuickTasks Strip "Add Task" (PRD-04)

**Path:** QuickTasks strip → "Add Task" → Task Creation Modal
**Queue involvement:** None — goes directly to the Task Creation Modal (same as manual creation)

### 10. Notepad "Send to → Agenda" (PRD-08 → Meetings)

**Path:** Notepad → Send To → Agenda → Inline meeting picker → Agenda item on meeting
**Note:** This does NOT go to the Studio Queue. It creates a `meeting_agenda_item` for a specific upcoming meeting. The item becomes a task only AFTER the meeting, if it's identified as an action item during the meeting conversation.

---

## The Universal Queue Modal — Tasks Tab

The Universal Queue Modal (defined in PRD-14B, expanded in PRD-15) is a tabbed modal for processing pending items across the platform. The Tasks tab shows items from the `studio_queue` where `destination = 'task'`.

### What Mom Sees in the Tasks Tab

```
┌─────────────────────────────────────────────────┐
│  Review Queue                                ✕  │
│  [Calendar (3)] [Tasks (5)] [Requests (2)]      │
│  ─────────────────────────────────────────────  │
│  ┌───────────────────────────────────────────┐  │
│  │ 📝 Clean out garage                       │  │
│  │ Source: Notepad → Tasks (single)          │  │
│  │ [Configure]  [Dismiss]                    │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  │ 🙋 "Can I have a new math workbook?"     │  │
│  │ Request from: Jake                        │  │
│  │ [Configure]  [Decline ▾]                 │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 🤝 Action: Schedule dentist appointments  │  │
│  │ Source: Couple Meeting (Mar 10)           │  │
│  │ [Configure]  [Dismiss]                    │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ 📋 3 items from brain dump                │  │
│  │ Source: Review & Route                    │  │
│  │ [Process All]  [Configure Each]           │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  💬 [Open Messages]                              │
└─────────────────────────────────────────────────┘
```

### Processing Queue Items

- **[Configure]** → opens the Task Creation Modal pre-populated with whatever the source provided (title from content, details from content_details, requester info if applicable)
- **[Process All]** → opens a sequential configuration flow, moving through each item one at a time
- **[Dismiss]** → removes from queue with optional note. For `member_request` items, decline note is sent back to the requester.
- Items with `source = 'member_request'` show the requester's avatar and name
- Items grouped by source when they arrived together (e.g., 3 items from one brain dump)

### Queue Also Accessible From

- The Tasks page itself (Queue tab alongside My Tasks, Routines, Opportunities, Sequential)
- The badge count on the Tasks page tab bar
- The Universal Queue Modal (Tasks tab)
- The QuickTasks strip "Review Queue" button (opens Queue Modal to the tab with most items)

---

## The Task Creation Modal — 7 Collapsible Sections

The Task Creation Modal (PRD-09A, Screen 3) is the universal task configuration interface. It's used everywhere tasks are created — from the Tasks page, from the Queue, from Goals, and from any surface that creates tasks. Full-screen on mobile, large centered modal on desktop.

### Section 1: Task Basics
- **Task name** (required)
- **Description** (optional, rich text)
- **Duration estimate** dropdown (5min → full-day, custom)
- **Image upload** (optional — photo of the task, reference image)
- **Life area tag** (auto-suggested by LiLa, user can override): spiritual, spouse_marriage, family, career_work, home, health_physical, social, financial, personal, homeschool, extracurriculars, meal_planning, auto_transport, digital_tech, hobbies, custom
- **AI buttons:** [Break It Down] (Task Breaker AI), [Organize as Checklist]

### Section 2: Task Type
- **Task** (standard one-off or recurring)
- **Routine** (recurring checklist with sections — opens the Routine Section Editor)
  - Sections have per-section frequency (daily steps, MWF steps, weekly steps)
  - Drag-to-rearrange, Break Down per step, photo-on-completion per step
- **Opportunity** (optional/bonus) with sub-types:
  - Repeatable (unlimited or max completions)
  - Claimable Job (lock duration + auto-release)
  - Capped (required max completions)
- **Habit** (daily tracked behavior)

### Section 3: Assignment
- Family member checkboxes (multi-select) + "Whole Family" option
- Per member: **individual copy** (default) or **shared** (one task, shared completion)
- For routines: **rotation** option — cycle through members on schedule (weekly, biweekly, monthly, custom)

### Section 4: Schedule & Recurrence
- **One-time:** specific date or no date
- **Recurring:** daily, weekdays, weekly, biweekly, monthly, custom days (M/T/W/Th/F/Sa/Su), specific day of month, seasonal/annual, school-year-only toggle
- Start date and optional end date
- Rotation schedule (if rotation in Assignment)

### Section 5: Incomplete Action
What happens when a task isn't completed:
- **Fresh Reset** (default for routines) — resets clean each period, no guilt
- **Auto-Reschedule** (default for one-time) — moves to next day
- **Drop After Date** — disappears after specified date
- **Reassign Until Complete** — keeps appearing
- **Require Decision** — prompts owner to decide
- **Escalate to Parent** — flags for parent attention after configurable time

### Section 6: Rewards & Tracking
- Reward type dropdown (stars, points, money, privileges, family activities)
- Reward amount per completion
- Bonus threshold (default 85% = 20% bonus)
- **Require approval** checkbox (parent must approve before completion counts)
- **"View and Track as Widget"** toggle — creates dashboard widget
- **Victory flag** — "Flag completions as victories"

### Section 7: Template Options
- "Save as reusable template" checkbox → saves to Studio library
- Template name (if saving)
- "Update template" option when editing existing template deployment

### How the Modal Adapts Based on Source

| Source | Pre-populated Fields | Behavior |
|--------|---------------------|----------|
| Manual (+ Create) | Nothing — blank form | Standard creation |
| Notepad (single) | Title from content | Description populated with full notepad content |
| Notepad (individual) | Title per parsed item | LiLa pre-parsed, each item becomes its own modal pass |
| Review & Route | Title + details from extraction | Source link back to original content |
| Meeting action item | Title from action item text | Source shows "From: [Meeting Type] - [Date]" |
| LiLa suggestion | Title from conversation context | Source link to conversation |
| Member request | Title from request content | Shows requester avatar/name, requester's note |
| Goal decomposition | Title from goal step | Links back to parent goal |
| List promotion | Title from list item | Source shows "Promoted from: [List Name]" |
| Studio template | All fields from template | Full pre-fill, user adjusts for this deployment |

---

## Meeting Action Items → Tasks: The Complete Flow

This is the specific flow for how meeting discussions become tasks. This is the convention that any Meetings PRD should follow:

```
Meeting Conversation (LiLa guided)
        │
        ▼
Meeting Completion
        │
        ├── LiLa compiles summary + identifies action items
        │
        ▼
Action Item Review (post-meeting screen)
        │
        ├── For each action item:
        │   ├── "Create as task for [Mom/Dad/Child]?" 
        │   │   └── Yes → deposits into studio_queue
        │   │         source = 'meeting_action'
        │   │         source_reference_id = meeting.id
        │   │         owner_id = selected family member
        │   │
        │   ├── "Add to [list name]?" 
        │   │   └── Yes → creates list_item
        │   │
        │   ├── "Add to calendar?" 
        │   │   └── Yes → routes to calendar Quick Add
        │   │
        │   └── "Skip" → not actionable, just discussion
        │
        ▼
Studio Queue (pending)
        │
        ▼
Tasks Tab in Queue Modal (or Tasks page Queue tab)
        │
        ├── [Configure] → opens Task Creation Modal
        │   pre-populated with action item text
        │   source shown: "From: Couple Meeting - Mar 10"
        │
        ▼
Task Creation Modal (7 sections)
        │
        ├── User configures: assignment, schedule, rewards, etc.
        │
        ▼
Task deployed → appears on assignee's Dashboard
```

**Key principles:**
1. Meeting action items ALWAYS go through the Studio Queue — they never bypass it to create tasks directly
2. The post-meeting review screen lets the user decide WHERE each action item goes (tasks, lists, calendar, or skip)
3. In multi-member meetings (couple, parent-child, family), the user specifies WHICH member's queue receives each action item
4. The Task Creation Modal handles full configuration — the meeting just provides the seed content
5. `source_reference_id` links back to the meeting record for traceability

---

## Summary: The Routing Landscape

```
                    ┌─────────────────┐
                    │  Smart Notepad  │
                    │  "Send To →     │
                    │   Tasks"        │──────┐
                    └─────────────────┘      │
                    ┌─────────────────┐      │
                    │  Review & Route │      │
                    │  (extracted     │──────┤
                    │   action items) │      │
                    └─────────────────┘      │
                    ┌─────────────────┐      │
                    │  Meeting Action │      │         ┌──────────────┐
                    │  Items          │──────┤         │              │
                    └─────────────────┘      │         │  STUDIO      │
                    ┌─────────────────┐      ├────────▶│  QUEUE       │
                    │  LiLa           │      │         │              │
                    │  Suggestion     │──────┤         │ (universal   │
                    └─────────────────┘      │         │  intake)     │
                    ┌─────────────────┐      │         │              │
                    │  Request        │      │         └──────┬───────┘
                    │  Accepted →     │──────┤                │
                    │  "Add to Tasks" │      │                │
                    └─────────────────┘      │                ▼
                    ┌─────────────────┐      │    ┌───────────────────┐
                    │  Goal           │      │    │  TASK CREATION    │
                    │  Decomposition  │──────┤    │  MODAL            │
                    └─────────────────┘      │    │  (7 sections)     │
                    ┌─────────────────┐      │    │                   │
                    │  List Item      │      │    │  Configure:       │
                    │  Promotion      │──────┘    │  basics, type,    │
                    └─────────────────┘           │  assignment,      │
                                                  │  schedule,        │
                    ┌─────────────────┐           │  incomplete       │
                    │  Manual Create  │──────────▶│  action, rewards, │
                    │  (+ Create)     │           │  template         │
                    └─────────────────┘           └────────┬──────────┘
                    ┌─────────────────┐                    │
                    │  QuickTasks     │──────────▶          │
                    │  "Add Task"     │                    │
                    └─────────────────┘                    ▼
                                              ┌───────────────────────┐
                                              │  DEPLOYED TASK        │
                                              │                       │
                                              │  Appears on           │
                                              │  assignee's           │
                                              │  Dashboard            │
                                              └───────────────────────┘
```

**Two paths to task creation:**
1. **Through the Studio Queue** (8 sources) → Queue processing → Task Creation Modal → Deployed task
2. **Direct to Task Creation Modal** (2 sources: manual + QuickTasks) → Deployed task

The Studio Queue is the universal funnel. The Task Creation Modal is the universal configuration surface. No matter where a task idea originates, it ends up in the same configuration flow.

---

## Queue Modal vs. Tasks Page Queue Tab

These are the same data, two access points:

| Surface | Where | What It Shows | When to Use |
|---------|-------|---------------|-------------|
| **Universal Queue Modal → Tasks tab** | Modal overlay, opens from QuickTasks "Review Queue", Dashboard badge, or feature badges | `studio_queue` items where `destination = 'task'` and `processed_at IS NULL` | Quick processing during a queue session (alongside Calendar approvals and Requests) |
| **Tasks page → Queue tab** | Tab on the full Tasks page alongside My Tasks, Routines, Opportunities, Sequential | Same data: `studio_queue` items where `destination = 'task'` and `processed_at IS NULL` | Dedicated task management session |

Both render the same queue items. Both use [Configure] to open the Task Creation Modal. The Queue Modal is for "process everything quickly across features." The Tasks page Queue tab is for "I'm in task management mode."

---

## Key Conventions for Other PRDs

1. **Always deposit into `studio_queue` with the right `source` enum.** Never create tasks directly from another feature — go through the queue so items are processed consistently.
2. **Use `source_reference_id` to link back.** This creates traceability — "this task came from this meeting / this conversation / this goal."
3. **Use `owner_id` to control whose queue receives the item.** In multi-member scenarios (meetings, requests), the originating feature decides which member should process the item.
4. **The Task Creation Modal handles all configuration.** Other features provide the seed content (title, details). The modal handles assignment, scheduling, rewards, and everything else.
5. **`structure_flag` is optional.** Only Notepad routing uses it (single/individual/ai_sort/sequential). Other sources can leave it NULL.
6. **`requester_id` and `requester_note` are for member requests.** When a family member requests something that becomes a task, these fields preserve who asked and why.

---

*This document is a reference synthesis from PRD-08, PRD-09A, PRD-09B, PRD-14B, and PRD-15. It does not introduce new decisions — it maps existing decisions into one navigable document.*
