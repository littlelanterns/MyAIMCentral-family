# PRD-09A: Tasks, Routines & Opportunities

**Status:** Not Started
**Dependencies:** PRD-01 (Auth), PRD-02 (Permissions), PRD-03 (Design System), PRD-04 (Shell Routing), PRD-05 (LiLa Core), PRD-08 (Journal + Smart Notepad)
**Created:** March 5, 2026
**Last Updated:** March 5, 2026
**Companion:** PRD-09B (Lists, Studio & Templates)

---

## Overview

Tasks are the daily heartbeat of family life. More than any other feature, this is where mom, dad, teens, and kids interact with the app every single day. PRD-09A defines the core task engine: the system that manages tasks, routines with sectioned sub-step checklists, opportunities with claimable job boards, sequential collections that drip-feed tasks one at a time, the Task Creation Queue that receives drafts from across the platform, the Task Creation Modal for full configuration, 13 prioritization views for seeing the same tasks through different lenses, task action tools (Task Breaker AI and Focus Timer), and the Task Breaker AI that decomposes overwhelming tasks into manageable steps — including from photos.

> **Mom experience goal:** Opening the app should feel like having a capable assistant who already organized everything. Mom sees what needs doing across the family, assigns and tracks it effortlessly, and never has to wade through a pile of guilt from yesterday's incomplete tasks. Kids see a clear, motivating list of what's expected and what they could choose to do for extra rewards. The system adapts to how the family thinks — not the other way around.

The core philosophy: **See what needs doing. Do it. See that it mattered.**

The architecture follows a three-page model:
- **Studio** (PRD-09B) — blank templates, trackers, and widgets. The "craft store" where things are designed.
- **Tasks** (this PRD) — the library of customized task-type items and the management/deployment surface. Where mom configures assignments, schedules, and rewards.
- **Dashboard/Compass** — each person's daily active view with collapsible sections and view toggles. Where tasks are completed.

> **Depends on:** Family member roles and authentication — defined in PRD-01. Permission model, shift-based access, and `PermissionGate` — defined in PRD-02. Shell-specific rendering — defined in PRD-04. LiLa context assembly and AI task creation — defined in PRD-05. Task Creation Queue stub and routing from Smart Notepad — defined in PRD-08.

---

## User Stories

### Task Management (Mom)
- As a mom, I want to create a chore routine with daily, MWF, and weekly sub-steps so I can assign one template that generates the right checklist for each day.
- As a mom, I want to deploy the same routine template to different kids on a rotating weekly schedule so bathroom cleaning rotates fairly without manual reassignment.
- As a mom, I want to see all my customized reusable tasks in one place, with who each is currently assigned to, so I can manage the family task system efficiently.
- As a mom, I want incomplete daily chores to simply reset fresh each morning so my kids' task lists feel motivating, not shameful.
- As a mom of nine, I want to assign the same task template to multiple kids simultaneously, each getting their own independent version, so I don't recreate "Clean Bedroom" nine times.
- As a mom, I want to configure what happens when a task isn't completed — fresh reset, auto-reschedule, drop after date, reassign until complete, require my decision, or escalate to me — per task.

### Task Management (Dad)
- As a dad with task permissions, I want to create and assign tasks to kids mom has granted me access to so I can contribute to family task management.
- As a dad, I want to manage my own personal tasks with prioritization views so I have my own productivity system.

### Opportunities & Job Board
- As a mom, I want to create a shared job board where any kid can claim optional tasks for monetary or point rewards, with jobs that lock for a configurable time and release back to the pool if not completed.
- As a mom, I want to create repeatable opportunity tasks (like "practice reading — 5 stars each time") that kids can complete over and over, with optional caps on how many times they earn rewards.
- As a mom, I want to create individual opportunity lists where each kid gets their own version, so I can offer educational bonus tasks where each child tracks independently.
- As a mom, I want Ruthie's aides (Special Adults) to see her available opportunities during their shift and mark completions on her behalf.

### Sequential Collections
- As a mom, I want to photograph a textbook's table of contents and have LiLa parse it into 77 sequential tasks that feed to my child one chapter at a time, auto-advancing on completion.
- As a mom, I want to create a list of tutorial URLs where each link becomes a sequential task — my kid clicks it, completes the tutorial, marks it done, and the next one appears.
- As a mom, I want to reuse a sequential collection year after year, reassigning it to the next child.

### Daily Active View (All Roles)
- As any family member, I want my daily task view to be a collapsible section on my dashboard so I can focus on tasks when I need to and collapse them when I don't.
- As a mom, I want to toggle between 14 different views of my tasks (Simple List, Eisenhower, Kanban, Now/Next/Optional, By Member, etc.) to see my work through different lenses throughout the day.
- As a teen, I want to see my required tasks for today, upcoming tasks this week, and optional opportunities in one clear view.
- As a child in Guided mode, I want to see my tasks as simple, tappable checklists with big buttons and encouraging feedback.
- As a child in Play mode, I want to see big colorful task tiles that I can tap to complete with celebrations.

### Task Requests
- As a teen, I want to send a task request to mom or dad ("Can you pick up poster board for my project?") so it lands on their task queue instead of me just telling them verbally and hoping they remember.
- As a dad, I want to receive task requests from kids and accept, decline, or modify them.

### Task Breaker
- As a kid given "clean your room," I want to take a photo of my messy room and get AI-suggested steps so I know where to start without mom spoon-feeding me.
- As a mom, I want to break down any overwhelming task into subtasks at three detail levels (quick, detailed, granular) with family-aware assignment suggestions.

### Special Adults
- As a babysitter on shift, I want to see the assigned kids' task lists and mark tasks complete so the family's routine continues in mom's absence.
- As a caregiver, I want a "Log Activity" button to record additional things I did with the kids that weren't on the task list, creating a record mom can review.

### Task Creation Queue
- As a mom, I want all draft tasks from Notepad brain dumps, LiLa conversations, meeting action items, and kid requests to land in one queue that I process when I'm ready.
- As a mom, I want to batch-configure multiple queue items with shared settings (same assignee, same due date) so processing 5 items from a brain dump is fast.

---

## Screens

### Screen 1: Tasks Page — Management View (Mom/Adult)

> **Depends on:** Shell routing — defined in PRD-04. Permission model — defined in PRD-02.

**What the user sees:**

The Tasks page is the management surface for all customized task-type items. This is NOT the daily active view (that's on the Dashboard). This is where mom designs, configures, assigns, and oversees the family task system.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Tasks                                          [+ Create]   │
├──────────────────────────────────────────────────────────────┤
│  [My Tasks] [Routines] [Opportunities] [Sequential] [Queue(3)]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🔄 Clean Kitchen                           [Deploy ▾]  │ │
│  │ Routine · 12 steps · Daily/MWF/T,Th/Weekly              │ │
│  │ Assigned: Gideon (3/3-3/9), Miriam (3/10-3/16)         │ │
│  │ Rotation: Helam → Gideon → Miriam → Mosiah → Ruthie    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🔄 Clean Bedroom                           [Deploy ▾]  │ │
│  │ Routine · 8 steps · Daily                               │ │
│  │ Assigned: Helam, Gideon, Miriam, Mosiah, Ruthie (indef) │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ⭐ Feed Dog                                 [Deploy ▾]  │ │
│  │ Task · Simple · Daily                                    │ │
│  │ Assigned: Mosiah (indefinitely)                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📝 Saxon Math 5 — Chapters          [Deploy ▾] 12/77   │ │
│  │ Sequential · 1 active · Auto-advance                     │ │
│  │ Assigned: Jake (2025-2026)                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [+ Create]  [Browse Studio Templates]                       │
└──────────────────────────────────────────────────────────────┘
```

**Tabs:**
- **My Tasks:** All task-type items (simple tasks, routines, single-use tasks) that mom has created or customized. Shows assignment status.
- **Routines:** Filtered view of routine-type templates with their sectioned checklists, rotation schedules, and deployment status.
- **Opportunities:** All opportunity-type items — repeatable tasks, claimable job boards, capped opportunities. Shows availability and claim status.
- **Sequential:** All sequential collections with progress indicators (12/77, 3/20, etc.).
- **Queue (N):** Draft tasks waiting to be configured. Badge shows count.

**Interactions:**
- Tap any card → opens detail view with full configuration, sub-steps, assignment history, and deployment controls.
- [Deploy ▾] button → opens deployment flyout: select assignees, date range, rotation, schedule. Can deploy to one person, multiple people (individual copies), or configure rotation.
- [+ Create] → opens the Task Creation Modal.
- [Browse Studio Templates] → navigates to Studio page to browse blank templates.
- Cards are filterable by: assigned member, tag/category, status (active/unassigned/archived), type.
- Cards are sortable by: name, last deployed, most assigned, recently created.

**Data created/updated:**
- `task_templates` records (when creating reusable items)
- `tasks` records (when deploying)
- `task_assignments` records (when assigning to members)

> **Decision rationale:** The Tasks page is a management surface, not the daily active view. This separates "mom configuring the family system" from "kid checking off today's chores." The daily view lives on each member's Dashboard as a collapsible section.

---

### Screen 2: Task Creation Queue

> **Depends on:** Task Creation Queue stub — defined in PRD-08. Smart Notepad routing — defined in PRD-08.

**What the user sees:**

A tab on the Tasks page showing all draft tasks waiting to be configured. Items arrive from Smart Notepad ("Send to... → Tasks"), LiLa conversations, Review & Route extraction, meeting action items, Goal decomposition, and family member Task Requests.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Queue (5)                                    [Process All]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📋 "Pick up poster board"              [Configure] [✕]  │ │
│  │ From: Jake (Task Request) · 2 hours ago                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📋 "Schedule dentist for Miriam"       [Configure] [✕]  │ │
│  │ From: Notepad brain dump · Today 9:14 AM                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📋 "Research summer camps"             [Configure] [✕]  │ │
│  │ 📋 "Book flights for reunion"          [Configure] [✕]  │ │
│  │ 📋 "Order birthday supplies"           [Configure] [✕]  │ │
│  │ From: Notepad brain dump (3 items) · Today 9:14 AM       │ │
│  │                                      [Apply to All ▾]    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Interactions:**
- [Configure] → opens Task Creation Modal pre-populated with whatever the source provided.
- [✕] → dismisses the queue item (with confirmation).
- [Apply to All ▾] → for batched items from the same source, opens a panel to set common fields (assignee, due date, category) that apply to all items in the batch. Individual items can still be configured separately after.
- [Process All] → opens a sequential configuration flow, moving through each queue item one at a time.
- Items with `source = 'member_request'` show the requester's avatar and name. Accept = configure and save. Decline = dismiss with optional note back to requester.
- Items grouped by source when they arrived together (e.g., 3 items from one brain dump).

**Queue item persistence:**
- Items persist indefinitely until configured or dismissed. No expiration.
- Mom sees all family queue items. Other members see only their own.

**Notification integration:**
- When mom opens the Task Creation Modal (from anywhere, not just the queue), a subtle indicator shows "3 tasks waiting in queue" with a tap target to navigate there.

**Data created/updated:**
- `task_queue` records read and processed
- `tasks` records created when items are promoted
- `task_queue` records deleted or marked `processed_at` when configured

---

### Screen 3: Task Creation Modal (Reusable Component)

> **Depends on:** Family member data — defined in PRD-01. Reward types — stub to PRD-24.

**What the user sees:**

A full-screen modal (on mobile) or large centered modal (on desktop) with collapsible sections. This is the universal task configuration interface — used from the Tasks page, the Queue, Goals, and any surface that creates tasks.

**Collapsible sections:**

**Section 1: Task Basics**
- Task name (required)
- Description (optional, rich text)
- Duration estimate dropdown (5min, 10min, 15min, 30min, 45min, 1hr, 1.5hr, 2hr, half-day, full-day, custom)
- Image upload (optional — photo of the task, reference image)
- Life area tag (auto-suggested by LiLa, user can override). Expanded tag set: spiritual, spouse_marriage, family, career_work, home, health_physical, social, financial, personal, homeschool, extracurriculars, meal_planning, auto_transport, digital_tech, hobbies, custom.
- AI buttons: [Break It Down] (Task Breaker), [Organize as Checklist]

**Section 2: Task Type**
- Radio selection: Task (standard), Routine (recurring checklist with sections), Opportunity (optional/bonus), Habit (daily tracked behavior)
- If Routine: "Create from Studio template" option + section editor (see Routine Section Editor below)
- If Opportunity: sub-type selection — Repeatable, Claimable Job, Capped
  - Repeatable: max completions field (blank = unlimited)
  - Claimable: claim lock duration + unit (hours/day/week/custom), release behavior
  - Capped: max completions (required)

**Section 3: Assignment**
- Family member checkboxes (multi-select) + "Whole Family" option
- For each selected member: individual copy (default) or shared (one task, shared completion)
- For routines: rotation option — cycle through selected members on a configurable schedule (weekly, biweekly, monthly, custom)

**Section 4: Schedule & Recurrence**
- One-time: specific date or no date
- Recurring: frequency selector
  - Simple: daily, weekdays, weekly, biweekly, monthly
  - Custom days: day-of-week multi-select (M, T, W, Th, F, Sa, Su)
  - Advanced (expandable): specific day of month, seasonal/annual, school-year-only toggle
- Start date and end date (optional — blank end date = indefinite)
- Rotation schedule (if rotation selected in Assignment): assignee order + rotation frequency
- For routines with sectioned sub-steps: section-level frequency is set in the Routine Section Editor, not here. This section sets the overall deployment schedule.

**Section 5: Incomplete Action**
- Radio selection:
  - **Fresh Reset** (default for routines) — task resets clean each period. History recorded but no carry-forward.
  - **Auto-Reschedule** (default for one-time tasks) — moves to next day/period automatically.
  - **Drop After Date** — disappears if not completed by a specified date.
  - **Reassign Until Complete** — keeps appearing until done.
  - **Require Decision** — prompts owner to decide: reschedule, dismiss, or reassign.
  - **Escalate to Parent** — if not completed by a configurable time, flags for parent attention.

**Section 6: Rewards & Tracking**
- Reward type dropdown (populated from `family_reward_types` — stars, points, money, privileges, family activities)
- Reward amount per completion
- Bonus threshold (default 85% completion = 20% bonus)
- Require approval checkbox (parent must approve before task counts as complete and reward releases)
- "View and Track as Widget" toggle — creates a dashboard widget for this task's progress
- Victory flag option — "Flag completions as victories"

> **Deferred:** Full reward type management, transaction ledger, balance tracking, redemption catalog — to be resolved in PRD-24 (Rewards & Gamification). PRD-09A defines the task-side reward fields and `task_rewards` join table only.

**Section 7: Template Options**
- "Save as reusable template" checkbox — saves the configuration to the Studio template library
- Template name (if saving)
- If editing an existing template deployment: "Update template" option (changes the master, with confirmation that active deployments will be affected)

**Data created/updated:**
- `tasks` record
- `task_assignments` records (one per assignee)
- `task_subtasks` records (if sub-steps defined)
- `task_rewards` record (if reward configured)
- `task_templates` record (if saved as template)
- `task_queue` record updated (if promoted from queue)

---

### Screen 4: Routine Section Editor

**What the user sees:**

Within the Task Creation Modal (when type = Routine), a specialized editor for building sectioned checklists with per-section frequency scheduling.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Routine Steps                              [+ Add Section]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ▼ Daily                                          [Edit ✕]  │
│    ☐ Wash Dishes                          [⚡ Break Down]   │
│    ☐ Dry Dishes                           [⚡ Break Down]   │
│    ☐ Put Away Dishes                      [⚡ Break Down]   │
│    ☐ Wash Counters                        [⚡ Break Down]   │
│    [+ Add Step]                                              │
│                                                              │
│  ▼ MWF  (Mon, Wed, Fri)                          [Edit ✕]  │
│    ☐ Mop Floor                            [⚡ Break Down]   │
│    [+ Add Step]                                              │
│                                                              │
│  ▼ T, Th  (Tue, Thu)                             [Edit ✕]  │
│    ☐ Wipe Cabinets                        [⚡ Break Down]   │
│    ☐ Wipe Appliances                      [⚡ Break Down]   │
│    [+ Add Step]                                              │
│                                                              │
│  ▼ Weekly  (show until complete)                  [Edit ✕]  │
│    ☐ Clean & organize drawers/cupboards (×2)                │
│    ☐ Remove expired food from fridge                         │
│    ☐ Wipe fridge shelves and drawers                         │
│    [+ Add Step]                                              │
│                                                              │
│  [+ Add Section]                                             │
└──────────────────────────────────────────────────────────────┘
```

**Section configuration (via [Edit] on each section header):**
- Section name/label (free text: "Daily", "MWF", "Deep Clean", etc.)
- Frequency: day-of-week multi-select, or special options: daily, weekdays, weekly, monthly, custom
- Show behavior: "Only on scheduled days" (default) or "Show all days, grey out non-scheduled" (configurable per routine)
- Show-until-complete toggle: when ON, items appear every day of the period until checked off, then grey out for the rest of the period. Useful for weekly tasks that can be done on any day.
- Instance count: for steps that need to be done N times (e.g., "organize 2 drawers" = instances: 2, shows as 2 separate checkboxes)

**Step features:**
- Drag-to-rearrange within and between sections
- [⚡ Break Down] on each step → opens Task Breaker for that specific step
- Steps can have notes/instructions (expandable)
- Steps can be marked as "photo required on completion" (optional)

**Data created/updated:**
- `task_template_sections` records
- `task_template_steps` records within each section

---

### Screen 5: Opportunity / Job Board View

**What the user sees:**

The Opportunities tab on the Tasks page shows all opportunity-type items. Mom sees the management view; kids see the participation view on their Dashboard.

**Mom's management view:**
```
┌──────────────────────────────────────────────────────────────┐
│  Opportunities                                  [+ Create]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─── Shared Job Board: "Extra House Jobs" ──────────────┐  │
│  │ Available to: Helam, Gideon, Miriam, Mosiah            │  │
│  │ Claim visibility: Show who claimed                      │  │
│  │                                                         │  │
│  │ ☐ Organize garage shelves · $5 · Claimable (4hr lock) │  │
│  │   Status: Claimed by Gideon (2hr remaining)            │  │
│  │ ☐ Weed front garden · $3 · Claimable (1 day lock)     │  │
│  │   Status: Available                                     │  │
│  │ ☐ Wash car · $4 · Claimable (1 day lock)              │  │
│  │   Status: Available                                     │  │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─── Repeatable: "Ruthie's Practice Tasks" ─────────────┐  │
│  │ Assigned to: Ruthie (individual)                        │  │
│  │                                                         │  │
│  │ ∞ Practice reading 15 min · 5 stars · Unlimited         │  │
│  │   Completed: 12 times this week                         │  │
│  │ ∞ Practice speech exercises · 3 stars · Max 3/day       │  │
│  │   Completed: 1 of 3 today                               │  │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─── Individual: "Bonus School Tasks" ──────────────────┐  │
│  │ Assigned to: Jake, Emma, Miriam (individual copies)     │  │
│  │                                                         │  │
│  │ ☐ Read 30 min extra · 3 stars · Max 5/week             │  │
│  │ ☐ Write a book report · 10 stars · Unlimited           │  │
│  │ ☐ Nature journal entry · 5 stars · Unlimited           │  │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Kid's Dashboard view of opportunities:**

Shows in the "Optional" section of the Now/Next/Optional view, or as a dedicated "Opportunities" collapsible section on their Dashboard.

- Claimable jobs show [Claim] button. Claimed jobs show countdown timer and [Mark Complete] button.
- Repeatable tasks show [Do This] button. Each tap logs a completion and awards the reward (pending approval if configured).
- Capped tasks show progress: "2 of 5 this week."
- If mom configured claim visibility to show names, kids see "Claimed by Gideon (2hr left)." If configured to hide, they just see "Unavailable."

**Claim lock mechanics:**
- When a kid taps [Claim], the job is locked to them for the configured duration.
- A countdown timer shows remaining time.
- If the kid completes the job and it's approved (or auto-approved), reward credits to their balance.
- If the lock expires without completion, the job releases back to the pool. The kid who claimed it does NOT get penalized — it simply becomes available again.
- A kid can voluntarily release a claim before the timer expires.

> **Decision rationale:** Opportunities as a separate tab (not just mixed into views) because mom needs a management surface for job boards, and kids benefit from a clear "here are things I COULD do" browsing experience. They also appear in the "Optional" section of the Now/Next/Optional view for daily context.

---

### Screen 6: Sequential Collection View

**What the user sees:**

The Sequential tab on the Tasks page shows all sequential collections with progress tracking.

**Management view:**
```
┌──────────────────────────────────────────────────────────────┐
│  Sequential Collections                         [+ Create]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📚 Saxon Math 5 — Chapters                    12/77    │ │
│  │ Assigned: Jake · 1 active · Auto-advance on complete    │ │
│  │ Current: Chapter 12 — Fractions Review                  │ │
│  │ Category: Homeschool/Math · Weekdays only               │ │
│  │                                                         │ │
│  │ [View Full List] [Edit] [Reassign ▾] [Pause]           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🎥 Python Tutorial Series                      3/20    │ │
│  │ Assigned: Emma · 1 active · Manual advance              │ │
│  │ Current: Video 3 — Variables and Data Types             │ │
│  │ URL: https://youtube.com/...                            │ │
│  │                                                         │ │
│  │ [View Full List] [Edit] [Reassign ▾]                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 📚 Saxon Math 5 — Chapters              (Unassigned)   │ │
│  │ 77 items · Last used: Jake (2024-2025, completed)       │ │
│  │                                                         │ │
│  │ [Deploy to New Student ▾]                               │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**[View Full List] expands to show:**
- All items in order, with completed items checked and greyed
- Current active item(s) highlighted
- Drag-to-rearrange (mom can reorder, skip items, insert new items)
- Progress bar at top

**Kid's Dashboard view:**
- Shows as a single task card: "Saxon Math Ch. 12 — Fractions Review" with a checkbox
- If URL is attached, tapping the task title opens the URL in a new browser tab
- On completion, next item auto-promotes (or waits based on configuration: immediate, next day, manual)
- Progress indicator: "12 of 77" shown subtly on the card

**Creation flow:**
- [+ Create] → choose input method:
  - Manual: type/paste items one per line
  - Image/OCR (MVP): take photo(s) → LiLa parses into ordered items → review/edit
  - URL list: paste URLs one per line, each becomes an item with optional title
- Configure: assignee, category, active count (1 by default, configurable), promotion timing (immediate/next day/manual), recurrence (show on weekdays only, etc.), reward per item

**Reuse flow:**
- Completed or unassigned collections show [Deploy to New Student ▾]
- Deploying resets progress to 0 for the new assignee
- Original completion history preserved for the previous assignee

> **Decision rationale:** Sequential collections are a template type that generates tasks, but they need their own tab because the management experience (viewing progress, reordering items, reassigning across years) is unique.

---

### Screen 7: Dashboard Active Tasks Section (All Roles)

> **Depends on:** Dashboard layout — full spec in PRD-14 (Personal Dashboard). PRD-09A defines the task data and component contract.

**What the user sees:**

A collapsible section on each member's personal Dashboard showing their active tasks. The section header shows task count and has a `>` / `v` toggle to expand/collapse.

**View toggle carousel:**
Below the section header, a horizontally scrolling row of view pills. Auto-sorted by the user's personal usage frequency (most-used views appear first). Tapping a view pill switches the task layout below it.

**13 Views (detailed in Views section below):**
1. Simple List
2. Eisenhower Matrix
3. Eat the Frog
4. 1-3-5 Rule
5. Big Rocks
6. Ivy Lee
7. By Category
8. ABCDE Method
9. Kanban
10. MoSCoW
11. Impact/Effort
12. Now/Next/Optional
13. By Member (mom/family view only)

**Task Action Tools (accessible from any task in any view via long-press/right-click):**
- **Task Breaker** — AI decomposition into subtasks (3 detail levels + image input)
- **Focus Timer (Pomodoro)** — 25-minute focus sessions with break intervals. Logs time spent to Activity Log and sets task status to `in_progress` (half-filled checkbox visual).

**Per-shell rendering:**

| Shell | Task Display | Views Available | Task Interactions |
|-------|-------------|-----------------|-------------------|
| Mom | Full task cards with all metadata. Collapsible dashboard section. | All 13 views. By Member on Family Overview. | Create, assign, complete, approve, configure. Focus Timer on any task. |
| Dad / Additional Adult | Full task cards for own tasks + permitted kid tasks. Collapsible section. | All 13 views except By Member (unless mom grants family overview access). | Create (self + permitted kids), complete, approve (if granted). Focus Timer on any task. |
| Special Adult | Assigned kids' tasks during active shift only. Simplified cards. | Simple List and Now/Next/Optional only. | Mark complete, Log Activity. Cannot create or assign. |
| Independent (Teen) | Own tasks with full detail. Collapsible section. | All views except By Member. Views auto-sort by teen's usage. | Complete own tasks, create tasks for self, send Task Requests. Focus Timer. "Track This" (Full Magic w/ permission). |
| Guided | Simplified task cards with larger text, expandable checklists. | Simple List and Now/Next/Optional only. | Complete tasks (big tap targets). Cannot create. |
| Play | Large colorful task tiles. Always expanded (no collapse). | No view toggle — single visual layout. | One-tap completion with celebration animations. |

> **Decision rationale:** Play shell has no view toggles because the concept of prioritization frameworks isn't appropriate for young children. They just need big buttons and celebrations.

---

### Screen 8: Task Completion Flow

**Standard completion (no approval required):**
1. User taps checkbox / completion button on task
2. Task status → `completed`, `completed_at` timestamp set
3. If reward configured → reward amount queued (stub to PRD-24 reward transaction)
4. If victory flag → victory record created (source = 'task_completed')
5. Activity log entry auto-created via database trigger
6. Sparkle animation plays (per PRD-03 celebration tokens)
7. If routine → sub-steps completed today are recorded. Fresh reset generates tomorrow's checklist.
8. If sequential → next item auto-promotes based on configuration
9. If recurring → next instance generated with appropriate due date
10. Optional: completion note prompt (non-blocking toast: "Add a note?")

**Approval-required completion:**
1. User taps checkbox → task status → `pending_approval`
2. Notification sent to approver (mom or designated parent)
3. Approver sees pending approval on their Dashboard or in a notification
4. Approver taps Approve → task status → `completed`, reward releases
5. Approver taps Reject → task status → `pending`, optional note to assignee ("Try again — the bathroom mirror still has spots")
6. Reject count tracked for analytics but no penalty by default

**Completion evidence (optional per task):**
- Photo upload on completion (configured in Task Creation Modal)
- Completion note (free text)
- Both attached to the `task_completions` record

**Unmark behavior (from PRD-02):**
- Unmark anywhere = unmark everywhere, with full cascade
- If mom unmarks a task in View As, rewards roll back, streak adjusts, victory removed if auto-created

> **Depends on:** Reward transaction processing — defined in PRD-24. Victory creation — defined in PRD-11. Activity log triggers — pattern defined in PRD-08.

---

## Prioritization Views

> **Decision rationale:** All 14 views show the same underlying tasks — switching views changes the layout and grouping, not the data. Each task stores metadata for ALL frameworks simultaneously (same pattern as StewardShip). When a task is placed in one view, related fields in other views auto-fill with reasonable defaults but never overwrite explicit user values.

### View Metadata Fields on Tasks

Each task carries fields for framework placement across all views:

- `eisenhower_quadrant`: do_now / schedule / delegate / eliminate
- `frog_rank`: integer (1 = the frog)
- `importance_level`: critical_1 / important_3 / small_5 (for 1-3-5)
- `big_rock`: boolean
- `ivy_lee_rank`: integer (1-6)
- `abcde_category`: a / b / c / d / e
- `moscow_category`: must / should / could / wont
- `impact_effort`: high_impact_low_effort / high_impact_high_effort / low_impact_low_effort / low_impact_high_effort
- `kanban_status`: to_do / in_progress / done
- `life_area_tag`: for By Category view

Views that don't need stored metadata (they derive from existing fields): Simple List (sort_order), Eat the Frog (frog_rank), Now/Next/Optional (due_date + task_type), By Member (assignee), Pomodoro (user selects task to focus on).

### View Sync Logic

When a user places a task in one view, related fields auto-fill:
- Eisenhower "Do Now" → importance_level = critical_1, big_rock = true, abcde_category = a
- ABCDE "A" → eisenhower_quadrant = do_now, importance_level = critical_1
- Big Rock = true → importance_level = critical_1 or important_3
- Ivy Lee rank 1 → frog_rank = 1
- Moscow "must" → abcde_category = a, eisenhower_quadrant = do_now or schedule

Auto-fill never overwrites explicit user values. If a user manually sets eisenhower_quadrant = schedule but then drags it to ABCDE "A", the eisenhower_quadrant stays as schedule (user's explicit choice).

### AI Auto-Sort

When the user switches to a framework view and tasks are missing placement data for that view, LiLa offers to suggest placements. A banner appears: "I've suggested where each task fits. Tap any to adjust." User can accept all, adjust individually, or dismiss.

### The 14 Views

**1. Simple List** — Plain checkboxes, drag reorder. No framework. Default view.

**2. Eisenhower Matrix** — Four quadrants: Do Now (urgent + important), Schedule (important, not urgent), Delegate (urgent, not important), Eliminate (neither). Drag between quadrants.

**3. Eat the Frog** — Single highlighted "frog" card (rank 1, accented border) at top. Remaining tasks ranked below. Do the hardest thing first.

**4. 1-3-5 Rule** — Three sections: 1 Big task (max 1), 3 Medium tasks (max 3), 5 Small tasks (max 5). Forces realistic daily planning. Overflow goes to "Not Today" collapse.

**5. Big Rocks** — Binary split: Big Rocks (2-3 major priorities) vs. Gravel (everything else). Big rocks get visual emphasis.

**6. Ivy Lee** — Strict top-6 ranked list. Work on #1 until done. Then #2. No multitasking. Everything beyond 6 in "Not Today" collapse.

**7. By Category** — Tasks grouped by life_area_tag. See what each area of life needs from you today.

**8. ABCDE Method** — Five sections: A (must do, serious consequences), B (should do, mild consequences), C (nice to do), D (delegate), E (eliminate). Natural family fit — "D" tasks can show suggested assignees.

**9. Kanban** — Three columns: To Do, In Progress, Done. Drag between columns. Familiar, visual, universally understood.

**10. MoSCoW** — Four sections: Must Do, Should Do, Could Do, Won't Do (this cycle). Good for project planning and curriculum weeks.

**11. Impact/Effort** — 2×2 grid: Quick Wins (low effort, high impact), Major Projects (high effort, high impact), Fill-Ins (low effort, low impact), Thankless Tasks (high effort, low impact). Prioritize Quick Wins.

**12. Now/Next/Optional** — Three sections:
- **Now:** Required tasks due today.
- **Next:** Required tasks due this week but not today.
- **Optional:** All active opportunities available to this user (repeatable, claimable, capped).
This is the view that integrates Opportunities into the daily task experience.

**13. By Member** — Tasks grouped by family member. Only available on Mom's Family Overview (and Dad's if granted permission). Shows each member's task load at a glance. Useful for balancing assignments and checking family progress.

> **Tier rationale:** Simple List, Now/Next/Optional, and By Category available at Essential tier (mom-only). All 13 views available at Enhanced+. View auto-sort by usage available at all tiers.

---

## Task Action Tools

Task action tools are accessible from any task in any view via long-press (mobile) or right-click context menu (desktop). They appear alongside standard actions like edit, delete, and assign.

### Focus Timer (Pomodoro)

Available to: Mom, Dad, Independent Teen, Guided (simplified). Not available to Play shell.

**How it works:**
1. User long-presses a task → context menu → [Focus Timer]
2. Timer starts: 25-minute focus session. Task status → `in_progress`.
3. Task checkbox displays as half-filled (diagonal line) to indicate work in progress.
4. Timer persists if user navigates away. Audio/vibration notification on completion.
5. On timer completion: Activity Log entry auto-created: "[25 min] focused on [task name]"
6. User sees options: [Start Another Session] (begins new 25-min block), [Take a Break] (5-min break timer, 15-min after every 4 sessions), [Mark Complete] (task → completed), [Stop for Now] (task stays in_progress)
7. If user marks complete, normal completion flow triggers (rewards, victory, sparkle, next recurrence).
8. If user stops without completing, task stays `in_progress` with accumulated time tracked.

**Activity Log / Victory integration:**
- Each completed Pomodoro session creates an `activity_log_entries` record: type = 'focus_session', display_text = "[duration] focused on [task name]"
- Accumulated focus time is tracked on the task record for analytics
- Focus sessions can be flagged as victories ("I studied for 2 hours!")

> **Forward note:** Pomodoro timer durations (25/5/15) may become configurable post-MVP. Some users prefer 50/10 or other intervals. Custom timer presets per user could be a Full Magic feature.

> **Tier rationale:** Focus Timer available at Enhanced tier. Guided shell gets a simplified version (timer without break cycle management).

---

## Task Breaker

### Standard Mode (Text Input)
User types or selects a task → taps [Break It Down] → chooses detail level:
- **Quick:** 3-5 high-level steps
- **Detailed:** 5-10 steps with brief descriptions
- **Granular:** 10-20 micro-steps, very specific actions

LiLa generates subtasks. User reviews, edits, reorders, removes. Accepted subtasks become child tasks (parent_task_id links them). Parent/child cascade: check parent = auto-complete children, check last child = auto-complete parent + sparkle.

### Family-Context-Aware Decomposition
When breaking down a family task (e.g., "Clean the house"), Task Breaker considers family members and suggests assignments: "Mosiah: vacuum living room. Jake: clean bathroom. Emma: organize playroom." User can accept, adjust assignments, or ignore suggestions.

Context loaded: family member names, ages (from dashboard mode, not literal ages), active tasks (to avoid overloading someone), and task category.

### Image Input Mode (Full Magic Tier)
User takes a photo → taps [Break It Down] → LiLa analyzes the image and generates practical, action-oriented steps.

Example: Photo of messy bedroom → LiLa suggests:
1. Gather all dirty laundry into one pile by the door
2. Pick up all toys and put them in the toy bin
3. Collect any dishes/cups and bring to kitchen
4. Throw away all trash
5. Put books back on the shelf
6. Make the bed
7. Put away anything that belongs in other rooms

Steps become subtasks on the task. Available to teens, guided (with simplified output), and adults. Not available to Play shell.

> **Tier rationale:** Image-based Task Breaker is Full Magic because it's a premium AI feature with higher compute cost (image analysis). Text-based Task Breaker is Enhanced tier.

---

## Visibility & Permissions

| Role | Tasks Page Access | Dashboard Tasks | Task Creation | Task Completion | Opportunities |
|------|-------------------|-----------------|---------------|-----------------|---------------|
| Mom / Primary Parent | Full management view. All family tasks. | Own tasks + family overview. | Create for anyone. Assign to anyone. | Complete own. Approve others. Unmark anyone's via View As. | Create, manage, configure all job boards. |
| Dad / Additional Adult | Own tasks + tasks for permitted kids (per PRD-02 `member_permissions`). | Own tasks + permitted kids' tasks. | Create for self always. Create for permitted kids at contribute+ level. Cannot assign to mom. | Complete own. Approve permitted kids (if mom grants `approve_task_completion` permission). | View + interact with shared opportunities. Cannot create job boards (unless mom grants manage). |
| Special Adult | Assigned kids' tasks during active shift only. | Not applicable — no personal dashboard. Shift view shows assigned kids' tasks. | Cannot create tasks. Can Log Activity during shift. | Mark assigned kids' tasks complete (contribute level). | Mark assigned kids' opportunity completions. |
| Independent (Teen) | Simplified view: own created tasks + assigned tasks. Full Magic tier with permission for Studio access. | Own tasks with full view toggles. | Create for self. Send Task Requests to parents. | Complete own tasks. | Participate in assigned opportunities. Claim shared jobs. |
| Guided | No Tasks page access. | Simplified task cards on Dashboard. Expandable checklists. | Cannot create (unless mom enables "create personal tasks" for this child). | Complete own assigned tasks with big tap targets. | Participate in assigned individual opportunities. |
| Play | No Tasks page access. | Large colorful task tiles on Dashboard. | Cannot create. | One-tap completion with celebrations. | Simple visual opportunity tiles. |

### Task Request Permissions
- Any family member (Dad, Teen, Guided) can send a Task Request to Mom.
- Dad and Teens can also send Task Requests to each other (if Dad has permissions for that teen).
- Task Requests arrive in the recipient's Queue with `source = 'member_request'`.
- Guided children can send requests if mom enables the permission.

### Special Adult — Log Activity
- During active shift, Special Adults see a [Log Activity] button.
- Tapping it opens a simple form: description text + optional photo.
- Creates an `activity_log_entries` record with `source = 'special_adult_shift'`.
- Mom sees these in the shift summary (PRD-02) and can optionally promote to a victory.

---

## Data Schema

### Table: `task_templates`

The master blueprint for reusable tasks. Lives in Studio/Tasks page. Never assigned directly — deployments create `tasks` records.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members |
| template_name | TEXT | | NOT NULL | Display name in Studio/Tasks |
| template_type | TEXT | | NOT NULL | Enum: 'task', 'routine', 'opportunity_repeatable', 'opportunity_claimable', 'opportunity_capped', 'sequential', 'habit' |
| description | TEXT | | NULL | Rich text description |
| duration_estimate | TEXT | | NULL | Enum: '5min', '10min', '15min', '30min', '45min', '1hr', '1.5hr', '2hr', 'half_day', 'full_day', 'custom' |
| life_area_tag | TEXT | | NULL | Auto-tagged or user-selected |
| default_reward_type | TEXT | | NULL | FK concept → family_reward_types |
| default_reward_amount | DECIMAL | | NULL | |
| default_bonus_threshold | INTEGER | 85 | NOT NULL | Percentage completion for bonus |
| require_approval | BOOLEAN | false | NOT NULL | |
| incomplete_action | TEXT | 'auto_reschedule' | NOT NULL | Enum: 'fresh_reset', 'auto_reschedule', 'drop_after_date', 'reassign_until_complete', 'require_decision', 'escalate_to_parent' |
| image_url | TEXT | | NULL | Reference image |
| max_completions | INTEGER | | NULL | For capped opportunities. NULL = unlimited. |
| claim_lock_duration | INTEGER | | NULL | For claimable opportunities. |
| claim_lock_unit | TEXT | | NULL | Enum: 'hours', 'days', 'weeks' |
| sequential_active_count | INTEGER | 1 | NOT NULL | For sequential: how many items active at once |
| sequential_promotion | TEXT | 'immediate' | NOT NULL | Enum: 'immediate', 'next_day', 'manual' |
| display_mode | TEXT | 'collapsed' | NOT NULL | Enum: 'collapsed', 'expanded' — for routine sub-step display |
| usage_count | INTEGER | 0 | NOT NULL | How many times deployed |
| last_deployed_at | TIMESTAMPTZ | | NULL | |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Created by family members with appropriate permissions. Mom can CRUD all. Dad can CRUD own + permitted. Teens can CRUD own (if Studio access granted). Read access for all family members who need to see available templates.

**Indexes:**
- `(family_id, template_type)` — filter by type
- `(family_id, created_by)` — "my templates"
- `(family_id, archived_at)` — active templates

---

### Table: `task_template_sections`

Sections within routine templates. Each section has its own frequency schedule.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| template_id | UUID | | NOT NULL | FK → task_templates |
| section_name | TEXT | | NOT NULL | Display label ("Daily", "MWF", "Weekly") |
| frequency_rule | TEXT | | NOT NULL | Enum: 'daily', 'weekdays', 'weekly', 'monthly', 'custom' |
| frequency_days | TEXT[] | | NULL | Array of day abbreviations: ['mon','wed','fri'] |
| show_until_complete | BOOLEAN | false | NOT NULL | When true, items show every day until checked off |
| sort_order | INTEGER | | NOT NULL | Section ordering |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Inherits from parent template via template_id → task_templates.family_id.

**Indexes:**
- `(template_id, sort_order)` — ordered sections within a template

---

### Table: `task_template_steps`

Individual steps within routine sections.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| section_id | UUID | | NOT NULL | FK → task_template_sections |
| step_name | TEXT | | NOT NULL | |
| step_notes | TEXT | | NULL | Instructions or additional detail |
| instance_count | INTEGER | 1 | NOT NULL | How many checkboxes (e.g., 2 = "organize 2 drawers") |
| require_photo | BOOLEAN | false | NOT NULL | Photo required on completion |
| sort_order | INTEGER | | NOT NULL | Step ordering within section |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Inherits from parent section → template → family.

**Indexes:**
- `(section_id, sort_order)` — ordered steps within a section

---

### Table: `tasks`

Live task instances. Created by deploying templates or directly via Task Creation Modal.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members |
| template_id | UUID | | NULL | FK → task_templates. NULL if created directly. |
| task_type | TEXT | 'task' | NOT NULL | Enum: 'task', 'routine', 'opportunity_repeatable', 'opportunity_claimable', 'opportunity_capped', 'sequential', 'habit' |
| title | TEXT | | NOT NULL | |
| description | TEXT | | NULL | |
| status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'in_progress', 'completed', 'pending_approval', 'cancelled' |
| due_date | DATE | | NULL | |
| recurrence_rule | TEXT | | NULL | Enum: 'daily', 'weekdays', 'weekly', 'biweekly', 'monthly', 'custom' |
| recurrence_details | JSONB | | NULL | Complex patterns: {days: ['mon','wed','fri'], end_date: '2026-05-30', school_year_only: true, rotation: {members: [...], current_index: 0, period: 'weekly'}} |
| life_area_tag | TEXT | | NULL | |
| duration_estimate | TEXT | | NULL | |
| incomplete_action | TEXT | 'auto_reschedule' | NOT NULL | |
| require_approval | BOOLEAN | false | NOT NULL | |
| is_shared | BOOLEAN | false | NOT NULL | True = shared completion. False = individual instances. |
| parent_task_id | UUID | | NULL | FK → tasks. For subtasks from Task Breaker. |
| task_breaker_level | TEXT | | NULL | Enum: 'quick', 'detailed', 'granular' |
| sequential_collection_id | UUID | | NULL | FK → sequential_collections. Links sequential items to their parent collection. |
| sequential_position | INTEGER | | NULL | Order within sequential collection |
| sequential_is_active | BOOLEAN | false | NOT NULL | Whether this is a currently active sequential item |
| max_completions | INTEGER | | NULL | For capped opportunities |
| claim_lock_duration | INTEGER | | NULL | |
| claim_lock_unit | TEXT | | NULL | |
| eisenhower_quadrant | TEXT | | NULL | |
| frog_rank | INTEGER | | NULL | |
| importance_level | TEXT | | NULL | |
| big_rock | BOOLEAN | false | NOT NULL | |
| ivy_lee_rank | INTEGER | | NULL | |
| abcde_category | TEXT | | NULL | |
| moscow_category | TEXT | | NULL | |
| impact_effort | TEXT | | NULL | |
| kanban_status | TEXT | 'to_do' | NULL | |
| sort_order | INTEGER | 0 | NOT NULL | |
| image_url | TEXT | | NULL | |
| victory_flagged | BOOLEAN | false | NOT NULL | |
| completion_note | TEXT | | NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| source | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'template_deployed', 'lila_conversation', 'notepad_routed', 'review_route', 'meeting_action', 'goal_decomposition', 'project_planner', 'member_request', 'sequential_promoted', 'recurring_generated' |
| source_reference_id | UUID | | NULL | FK to source record |
| related_plan_id | UUID | | NULL | FK to project plans (future Project Planner PRD). Enables traceability from plan milestones to tasks. |
| related_intention_id | UUID | | NULL | FK to best_intentions (PRD-06). Links task to a Best Intention. |
| focus_time_seconds | INTEGER | 0 | NOT NULL | Accumulated Pomodoro/Focus Timer time on this task |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all. Dad reads own + permitted kids' tasks. Teens read own. Guided/Play read own. Special Adults read assigned kids' tasks during active shift.

**Indexes:**
- `(family_id, status, due_date)` — active tasks for today
- `(family_id, task_type)` — filter by type
- `(template_id)` — all deployments of a template
- `(parent_task_id)` — subtask lookup
- `(sequential_collection_id, sequential_position)` — ordered sequential items
- `(family_id, source)` — source tracking
- `(family_id, archived_at)` — active tasks

---

### Table: `task_assignments`

Who a task is assigned to. Supports multiple assignees per task.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| task_id | UUID | | NOT NULL | FK → tasks |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| assigned_by | UUID | | NOT NULL | FK → family_members |
| assigned_at | TIMESTAMPTZ | now() | NOT NULL | |
| start_date | DATE | | NULL | When assignment becomes active |
| end_date | DATE | | NULL | When assignment ends. NULL = indefinite. |
| rotation_position | INTEGER | | NULL | Position in rotation cycle. NULL if not rotating. |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped via task_id → tasks.family_id. Members can read their own assignments. Mom reads all.

**Indexes:**
- `(task_id, is_active)` — active assignees for a task
- `(family_member_id, is_active)` — "my assigned tasks"
- `(task_id, family_member_id)` — unique constraint candidate

---

### Table: `task_completions`

Records every completion event. Supports repeatable tasks with many completions.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| task_id | UUID | | NOT NULL | FK → tasks |
| family_member_id | UUID | | NOT NULL | FK → family_members (who completed) |
| completed_at | TIMESTAMPTZ | now() | NOT NULL | |
| completion_note | TEXT | | NULL | |
| photo_url | TEXT | | NULL | Completion evidence |
| approved_by | UUID | | NULL | FK → family_members. NULL if no approval required or not yet approved. |
| approved_at | TIMESTAMPTZ | | NULL | |
| rejected | BOOLEAN | false | NOT NULL | |
| rejection_note | TEXT | | NULL | |
| period_date | DATE | | NOT NULL | Which day/period this completion is for (for tracking and Fresh Reset) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Members can read own completions. Mom reads all. Parents can write approvals for kids' completions.

**Indexes:**
- `(task_id, period_date)` — completions for a specific period
- `(family_member_id, period_date)` — "what did I complete today"
- `(task_id, family_member_id, period_date)` — unique per member per period per task

---

### Table: `routine_step_completions`

Tracks individual step completions within routine tasks per member per day.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| task_id | UUID | | NOT NULL | FK → tasks (the deployed routine) |
| step_id | UUID | | NOT NULL | FK → task_template_steps |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| instance_number | INTEGER | 1 | NOT NULL | Which instance (for steps with instance_count > 1) |
| period_date | DATE | | NOT NULL | Which day this completion is for |
| completed_at | TIMESTAMPTZ | now() | NOT NULL | |
| photo_url | TEXT | | NULL | If step requires photo |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped via task_id. Members can write own completions. Mom reads all.

**Indexes:**
- `(task_id, family_member_id, period_date)` — "what steps did this member complete today"
- `(step_id, family_member_id, period_date, instance_number)` — unique constraint

---

### Table: `sequential_collections`

Ordered collections that drip-feed tasks one at a time.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| template_id | UUID | | NULL | FK → task_templates (if created from template) |
| title | TEXT | | NOT NULL | |
| total_items | INTEGER | | NOT NULL | |
| active_count | INTEGER | 1 | NOT NULL | How many items active at once |
| promotion_timing | TEXT | 'immediate' | NOT NULL | Enum: 'immediate', 'next_day', 'manual' |
| life_area_tag | TEXT | | NULL | |
| reward_per_item_type | TEXT | | NULL | |
| reward_per_item_amount | DECIMAL | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped.

**Indexes:**
- `(family_id)` — family's collections

---

### Table: `task_claims`

Tracks claim locks on claimable opportunity tasks.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| task_id | UUID | | NOT NULL | FK → tasks |
| claimed_by | UUID | | NOT NULL | FK → family_members |
| claimed_at | TIMESTAMPTZ | now() | NOT NULL | |
| expires_at | TIMESTAMPTZ | | NOT NULL | When the claim lock expires |
| completed | BOOLEAN | false | NOT NULL | |
| released | BOOLEAN | false | NOT NULL | Voluntarily released or expired |
| released_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped via task_id. All eligible family members can read claim status. Claimer can write.

**Indexes:**
- `(task_id, completed, released)` — active claims for a task
- `(claimed_by, completed)` — "my active claims"

---

### Table: `task_queue`

Draft tasks waiting to be configured and promoted.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| target_member_id | UUID | | NOT NULL | FK → family_members (whose queue) |
| title | TEXT | | NOT NULL | Draft title (from source) |
| description | TEXT | | NULL | Draft content |
| source | TEXT | | NOT NULL | Enum: 'notepad_routed', 'lila_conversation', 'review_route', 'meeting_action', 'goal_decomposition', 'member_request' |
| source_reference_id | UUID | | NULL | FK to source record |
| requested_by | UUID | | NULL | FK → family_members. For member_request source. |
| structure_flag | TEXT | 'single' | NOT NULL | Enum: 'single', 'individual', 'ai_sort', 'sequential' (from PRD-08) |
| batch_id | UUID | | NULL | Groups items that arrived together |
| processed_at | TIMESTAMPTZ | | NULL | When configured and promoted. NULL = pending. |
| dismissed_at | TIMESTAMPTZ | | NULL | When dismissed without promoting. |
| dismiss_note | TEXT | | NULL | Optional note when declining a request |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Mom reads all family queue items. Other members read only items where target_member_id = self.

**Indexes:**
- `(family_id, target_member_id, processed_at, dismissed_at)` — pending queue items for a member
- `(batch_id)` — grouped items
- `(source, source_reference_id)` — traceability

---

### Table: `task_rewards`

Per-task reward configuration. Stub for PRD-24.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| task_id | UUID | | NOT NULL | FK → tasks |
| reward_type | TEXT | | NOT NULL | References family_reward_types |
| reward_amount | DECIMAL | | NOT NULL | |
| bonus_threshold | INTEGER | 85 | NOT NULL | Completion percentage for bonus |
| bonus_percentage | INTEGER | 20 | NOT NULL | Bonus amount as % of base reward |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped via task_id.

> **Deferred:** Reward transactions, balance tracking, redemption — to be resolved in PRD-24 (Rewards & Gamification).

---

### Table: `activity_log_entries`

Extension of the activity log pattern from StewardShip for Special Adult activity logging.

> **Depends on:** Activity log trigger pattern — defined in StewardShip. PRD-09A adds the `special_adult_shift` source.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (who logged it) |
| event_type | TEXT | | NOT NULL | Enum extends existing: + 'special_adult_activity' |
| display_text | TEXT | | NOT NULL | |
| description | TEXT | | NULL | Detailed description |
| photo_url | TEXT | | NULL | |
| source | TEXT | | NOT NULL | Enum: 'special_adult_shift', 'task_completed', etc. |
| source_reference_id | UUID | | NULL | |
| shift_session_id | UUID | | NULL | FK → shift_sessions. Links to the active shift. |
| hidden | BOOLEAN | false | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

> **Forward note:** This table may merge with or extend the StewardShip `activity_log` table during build. The schema here describes the needed columns; the exact table name and migration strategy is a build-time decision.

---

### Enum/Type Updates

**New enums for PRD-09A:**

```sql
-- Task types
CREATE TYPE task_type AS ENUM ('task', 'routine', 'opportunity_repeatable', 'opportunity_claimable', 'opportunity_capped', 'sequential', 'habit');

-- Incomplete action behavior
CREATE TYPE incomplete_action AS ENUM ('fresh_reset', 'auto_reschedule', 'drop_after_date', 'reassign_until_complete', 'require_decision', 'escalate_to_parent');

-- Task source
CREATE TYPE task_source AS ENUM ('manual', 'template_deployed', 'lila_conversation', 'notepad_routed', 'review_route', 'meeting_action', 'goal_decomposition', 'member_request', 'sequential_promoted', 'recurring_generated');

-- Sequential promotion timing
CREATE TYPE sequential_promotion AS ENUM ('immediate', 'next_day', 'manual');

-- View framework metadata enums
CREATE TYPE eisenhower_quadrant AS ENUM ('do_now', 'schedule', 'delegate', 'eliminate');
CREATE TYPE importance_level AS ENUM ('critical_1', 'important_3', 'small_5');
CREATE TYPE abcde_category AS ENUM ('a', 'b', 'c', 'd', 'e');
CREATE TYPE moscow_category AS ENUM ('must', 'should', 'could', 'wont');
CREATE TYPE impact_effort AS ENUM ('high_impact_low_effort', 'high_impact_high_effort', 'low_impact_low_effort', 'low_impact_high_effort');
CREATE TYPE kanban_status AS ENUM ('to_do', 'in_progress', 'done');

-- Life area tags (expanded from StewardShip)
CREATE TYPE life_area_tag AS ENUM ('spiritual', 'spouse_marriage', 'family', 'career_work', 'home', 'health_physical', 'social', 'financial', 'personal', 'homeschool', 'extracurriculars', 'meal_planning', 'auto_transport', 'digital_tech', 'hobbies', 'custom');
```

> **Decision rationale:** Life area tags are config-driven in the UI (families can add custom tags), but the base set is defined as an enum for type safety and indexing. Custom tags use the 'custom' enum value with a separate `custom_tag_label` text field.

---

## Flows

### Incoming Flows (How Data Gets INTO Tasks)

| Source | How It Works |
|--------|-------------|
| Studio Templates (PRD-09B) | User customizes a blank template → deploys it → creates task records. Template ID stored on task for traceability. |
| Smart Notepad (PRD-08) | "Send to... → Tasks" deposits into Task Queue with structure flag (single/individual/ai_sort/sequential). |
| Review & Route (PRD-08) | Extracted action items routed to Task Queue with source = 'review_route'. |
| LiLa Conversations (PRD-05) | AI can create tasks from conversations with source = 'lila_conversation'. |
| Meeting Action Items (future PRD) | Action items from meetings route to Task Queue with source = 'meeting_action'. |
| Goal Decomposition (future PRD) | Goals broken into tasks route to Queue with source = 'goal_decomposition'. |
| Task Requests (any member) | Family members send requests to parent Queue with source = 'member_request'. |
| Recurring Generation | System auto-generates next instance of recurring tasks at midnight. Source = 'recurring_generated'. |
| Sequential Promotion | System promotes next sequential item when current is completed. Source = 'sequential_promoted'. |

### Outgoing Flows (How Tasks Feed Others)

| Destination | How It Works |
|-------------|-------------|
| Dashboard (PRD-14) | Active assigned tasks surface as a collapsible section on each member's Dashboard. |
| Activity Log | Task completion auto-creates activity log entry via database trigger. |
| Victory Recorder (PRD-11) | Tasks with `victory_flagged = true` auto-create victory on completion. |
| Reward System (PRD-24) | `task_rewards` configuration triggers reward transaction on completion (stub). |
| Allowance Pool (PRD-28) | Required tasks tied to allowance pool percentage calculation (stub). |
| LiLa Context (PRD-05) | Today's active tasks loaded into LiLa context assembly for relevant conversations. |
| Widgets (PRD-10) | "View and Track as Widget" toggle creates dashboard widget for task progress. |
| QuickTasks Strip (PRD-04) | "Add Task" button in strip opens Task Creation Modal. |

---

## AI Integration

### Task Breaker
- **Guided mode name:** `task_breaker`
- **Context loaded:** Task title, description, image (if provided), family member names and dashboard modes, existing assigned tasks for suggested members, life area tag.
- **AI behavior:** Generate practical, action-oriented steps. For family tasks, suggest member assignments. For image input, describe physical actions based on what's visible. Three detail levels produce progressively more specific steps. Keep language encouraging, not condescending.

### AI Auto-Sort (View Placement)
- **Guided mode name:** `task_placement`
- **Context loaded:** All unplaced tasks + current view framework definition.
- **AI behavior:** Suggest framework placement for tasks missing metadata for the current view. Banner offers user to accept/adjust. Never overwrite explicit user placements.

### AI Auto-Tagging
- **Triggered on:** Task creation (from any source).
- **AI behavior:** Analyze task title and description, suggest `life_area_tag`. Applied automatically but user can override. Uses lightweight model (Haiku equivalent) for cost efficiency.

### Sequential Collection Parsing (OCR)
- **Triggered on:** Image upload during sequential collection creation.
- **AI behavior:** Extract ordered text items from image (table of contents, numbered lists, etc.). Return as JSON array of strings. User reviews and edits before saving.

---

## Edge Cases

### Rotating Assignment — Member Removed from Family
- If a member in a rotation is removed from the family, they are removed from the rotation array. Rotation continues with remaining members. If only one member remains, rotation becomes a simple fixed assignment.

### Claim Lock Expires During Completion
- If a kid is actively completing a claimable job and the lock expires mid-task, the claim is extended by 30 minutes (grace period). If still not complete after grace, the job releases.

### Routine With No Steps Scheduled Today
- If a routine's sections have no steps matching today's day-of-week, the routine does not generate a task instance for today. The routine card doesn't appear on the dashboard for that day.

### Sequential Collection — All Items Completed
- When the last item is completed, the collection status → `completed`. A completion celebration fires. The collection remains visible on the Tasks page for reuse/reassignment.

### Task Created by Teen, Mom Modifies
- Teens can create tasks for themselves. Mom can see and modify these via View As (per PRD-02). Modifications are reflected immediately. No notification to teen (follows PRD-02 pattern for mom modifications).

### Queue Item Source Deleted
- If the source record (notepad tab, LiLa conversation) is deleted after a queue item was created, the queue item persists. Source reference shows "Source no longer available" but the draft content is preserved.

### Nine Kids Assigned Same Routine
- System creates 9 independent task assignment records. Each kid's dashboard shows only their instance. Mom's Tasks page and By Member view show all 9. Performance consideration: queries should be indexed on `(family_member_id, is_active)` to avoid scanning all family assignments.

### Opportunity Claimed by Two Kids Simultaneously
- First claim wins (database-level unique constraint on active claims per task). Second attempt shows "This job was just claimed by [name]" or "This job is no longer available" depending on mom's visibility configuration.

### Fresh Reset at Midnight — Task Was In Progress
- In-progress tasks at midnight are recorded as incomplete for tracking purposes, then reset. The `task_completions` table records a `period_date` entry with `completed = false` for the incomplete day. New day starts clean.

### Pomodoro Timer — User Navigates Away
- Timer continues running in the background. Audio notification fires when the Pomodoro completes. When user returns to the Pomodoro view, timer state is preserved. If the app is closed, timer state is saved to local state and resumed on reopen.

> **Forward note:** Pomodoro timer persistence across app closes may require service worker implementation. MVP may show "Timer was interrupted" if app was force-closed.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `tasks_basic` | Basic task creation and completion (Simple List, Now/Next/Optional, By Category views) | Essential |
| `tasks_views_full` | All 14 prioritization views | Enhanced |
| `tasks_family_assignment` | Assign tasks to family members | Enhanced |
| `tasks_routines` | Routine templates with sectioned checklists | Enhanced |
| `tasks_opportunities` | Opportunity tasks, job boards, repeatable/claimable | Enhanced |
| `tasks_sequential` | Sequential collections | Enhanced |
| `tasks_task_breaker_text` | Text-based Task Breaker (3 levels) | Enhanced |
| `tasks_task_breaker_image` | Image-based Task Breaker | Full Magic |
| `tasks_templates` | Save and manage reusable templates | Enhanced |
| `tasks_teen_studio` | Teen access to Studio for self-customization | Full Magic |
| `tasks_pomodoro` | Pomodoro timer view | Enhanced |
| `tasks_rotation` | Rotating assignments | Enhanced |
| `tasks_approval_workflows` | Parent approval on task completion | Enhanced |
| `tasks_queue` | Task Creation Queue | Enhanced |

> **Tier rationale:** Essential tier (mom-only) gets basic task management — she can create and complete her own tasks with 3 views. Enhanced (connected family) unlocks the full family system: assignments, routines, opportunities, all views, templates. Full Magic adds premium AI (image Task Breaker) and teen autonomy (Studio access). All features return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| `task_rewards` → reward transaction processing | Reward ledger, balance updates, notifications | PRD-24 (Rewards & Gamification) |
| `task_rewards` → allowance pool calculation | % completion = % earned formula | PRD-28 (Tracking, Allowance & Financial) |
| Task completion → victory auto-creation | Victory record with source = 'task_completed' | PRD-11 (Victory Recorder) |
| Task widget toggle → dashboard widget creation | Widget rendering on Dashboard | PRD-10 (Widgets) |
| Sequential collection → calendar view | Visual timeline of sequential progress | Calendar PRD |
| Gamification templates in Studio | Gamification theme customization and deployment | PRD-24 (Rewards & Gamification) |
| Creator tier custom template design | Design new blank template types for marketplace | Creator Tier PRD |
| "Share to MyAIM" from phone browser | External share sheet → routing queue | Post-MVP enhancement |
| URL auto-import from playlists/services | Parse external URLs into sequential collections | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Task Creation Queue (routing destination + structure flag) | PRD-08 | `task_queue` table defined, Queue tab on Tasks page, full processing flow. |
| LiLa task creation from conversations (source = 'lila_conversation') | PRD-05 | Tasks table includes source enum value, Queue accepts items from LiLa. |
| Task routing from Smart Notepad ("Send to... → Tasks") | PRD-08 | Notepad deposits into task_queue with structure_flag. |
| Review & Route action item extraction | PRD-08 | Extracted items route to task_queue with source = 'review_route'. |
| QuickTasks "Add Task" button | PRD-04 | Opens Task Creation Modal. |
| Task unmark reward cascade | PRD-02 | Unmark triggers reward rollback via task_rewards stub. |
| Best Intentions → related task creation | PRD-06 | Tasks can carry related_intention_id (added to schema as nullable FK). |
| Growth Areas → self-improvement tasks | PRD-07 | Tasks can carry source = 'manual' with description referencing growth area. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `task_templates` table created with CRUD for all template types
- [ ] `task_template_sections` and `task_template_steps` tables created for routine architecture
- [ ] `tasks` table created with all view metadata fields and type support
- [ ] `task_assignments` table created with multi-member and rotation support
- [ ] `task_completions` table created with approval flow
- [ ] `routine_step_completions` table created for per-step tracking
- [ ] `sequential_collections` table created
- [ ] `task_claims` table created for claimable opportunities
- [ ] `task_queue` table created and wired to PRD-08 routing
- [ ] `task_rewards` table created (stub — no transaction processing)
- [ ] Tasks page renders with tabs: My Tasks, Routines, Opportunities, Sequential, Queue
- [ ] Task Creation Modal works with all 7 sections
- [ ] Routine Section Editor works with per-section frequency scheduling
- [ ] All 14 prioritization views render and switch correctly
- [ ] View auto-sort by usage frequency working
- [ ] View sync (cross-view metadata auto-fill) working
- [ ] AI auto-sort (suggest placements for unplaced tasks) working
- [ ] Task Breaker (text, 3 levels) working
- [ ] Task completion flow with sparkle animation
- [ ] Approval flow (pending_approval → approved/rejected)
- [ ] Fresh Reset generates clean daily instances for routines
- [ ] Recurring task auto-generation at midnight
- [ ] Sequential collections with configurable active count and promotion
- [ ] Opportunity claim lock with timer and auto-release
- [ ] Repeatable opportunities with completion tracking and optional caps
- [ ] Task Requests from family members to parent queue
- [ ] Special Adult task view during shift + Log Activity button
- [ ] Drag-to-rearrange on all task lists and views
- [ ] AI auto-tagging on task creation
- [ ] RLS policies on all tables enforce family-scoped access
- [ ] All 5 shells render tasks appropriately per shell behavior table
- [ ] Dashboard active tasks section renders as collapsible with view toggles

### MVP When Dependency Is Ready
- [ ] Reward transaction processing on task completion (requires PRD-24)
- [ ] Victory auto-creation from flagged task completions (requires PRD-11)
- [ ] "View and Track as Widget" toggle creates dashboard widget (requires PRD-10)
- [ ] Task Breaker image mode (requires Full Magic tier gating + AI image pipeline)
- [ ] Pomodoro timer with background audio notifications (requires service worker)
- [ ] Sequential collection OCR parsing from photos (requires LiLa image processing)
- [ ] Gamification templates in Studio (requires PRD-24)
- [ ] Rotating assignment auto-advance (requires cron job or scheduled function)

### Post-MVP
- [ ] URL auto-import from YouTube playlists and external services
- [ ] "Share to MyAIM" from phone browser share sheet
- [ ] Creator tier: design new blank template types
- [ ] Marketplace for user-created templates
- [ ] Calendar view for task scheduling visualization
- [ ] Energy-based scheduling view (prioritize by energy level)
- [ ] Time blocking view
- [ ] Configurable Pomodoro timer durations
- [ ] AI learning user's categorization patterns for smarter auto-sort
- [ ] Bulk task creation from spreadsheet import

---

## CLAUDE.md Additions from This PRD

- [ ] Tasks use a three-page model: Studio (blank templates) → Tasks (customized library + management) → Dashboard (daily active view). These are three distinct surfaces with different purposes.
- [ ] Routines are task_type = 'routine' with sectioned sub-step checklists. Sections have independent frequency schedules. Each deployment creates independent per-member instances.
- [ ] Opportunities have three sub-types: repeatable (unlimited or capped completions), claimable (claim lock with timer), and capped. All use task_type starting with 'opportunity_'.
- [ ] Sequential collections drip-feed tasks one at a time from an ordered list. Active count and promotion timing are configurable.
- [ ] 14 prioritization views share the same underlying task data. View metadata stored simultaneously on each task. View sync auto-fills related fields but never overwrites explicit user values.
- [ ] Task Creation Queue receives drafts from Notepad, LiLa, Review & Route, meeting actions, goals, and member requests. All use the `task_queue` table.
- [ ] Task Creation Modal is a reusable component used from Tasks page, Queue, Goals, and any surface that creates tasks.
- [ ] Fresh Reset is the default incomplete action for routines — task resets clean each period with no carry-forward clutter.
- [ ] Claim locks use the `task_claims` table. First claim wins (database-level unique constraint). Grace period of 30 minutes on expiration.
- [ ] Activity log triggers fire on task completion (AFTER UPDATE on tasks where status → 'completed'). Same pattern as StewardShip.
- [ ] Task Requests flow: member creates → lands in parent's queue → parent accepts/declines. Source = 'member_request'.
- [ ] Special Adults during shift: view assigned kids' tasks, mark complete, Log Activity. No task creation.
- [ ] Templates are the reusable master blueprints. Deployments create task instances. Template never changes when its deployed instances are modified.
- [ ] `life_area_tag` expanded to 16 values from StewardShip's 10. Config-driven in UI for custom additions.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `task_templates`, `task_template_sections`, `task_template_steps`, `tasks`, `task_assignments`, `task_completions`, `routine_step_completions`, `sequential_collections`, `task_claims`, `task_queue`, `task_rewards`, `activity_log_entries` (extended)

Enums updated: `task_type`, `incomplete_action`, `task_source`, `sequential_promotion`, `eisenhower_quadrant`, `importance_level`, `abcde_category`, `moscow_category`, `impact_effort`, `kanban_status`, `life_area_tag`

Triggers added:
- AFTER UPDATE on `tasks` (status → 'completed') → insert `activity_log_entries`
- AFTER INSERT on `task_completions` → update task status, check sequential promotion, check recurring generation
- Midnight cron/scheduled function → generate daily routine instances, advance rotating assignments, expire claim locks

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Three-page model: Studio → Tasks → Dashboard** | Separates template design (Studio) from task management (Tasks page) from daily execution (Dashboard). Each surface has a clear purpose and avoids overwhelming any single page. |
| 2 | **Routines are task_type, not list_type** | Routines need assignment, rewards, tracking, completion %, and approval — all task capabilities. StewardShip's list-based routines couldn't support multi-member family needs. |
| 3 | **Routine sections with per-section frequency scheduling** | Mom needs "Daily: wipe sink, MWF: mop floor, Weekly: deep clean fridge" in one routine. Sectioned architecture with per-section frequency is the only way to model this. |
| 4 | **13 prioritization views + 2 task action tools, auto-sorted by usage** | StewardShip's 7 + Kanban, MoSCoW, Impact/Effort, ABCDE, Now/Next/Optional, By Member. Pomodoro moved from view to task action tool (Focus Timer) alongside Task Breaker. More views serve more thinking styles. Auto-sort prevents overwhelm by surfacing favorites. |
| 5 | **Opportunities with three sub-types** | Repeatable (practice reading), claimable (job board), and capped (limited-time offers) each serve distinct family use cases that can't be collapsed into one type. |
| 6 | **Sequential collections as a template type** | Textbook chapters, tutorial series, and curriculum progressions all need ordered-drip-feed behavior. This is architecturally a template that generates tasks one at a time. |
| 7 | **Fresh Reset as default for routines** | Mom of 9 shouldn't open the app to guilt from yesterday. Daily chores reset clean. History is recorded for tracking but doesn't clutter today's list. |
| 8 | **Six incomplete action options** | Fresh Reset, Auto-Reschedule, Drop After Date, Reassign Until Complete, Require Decision, and Escalate to Parent cover every family scenario from daily chores to one-time critical tasks. |
| 9 | **Task Requests from any member to any parent** | Kids and spouses need to "put it on my desk" instead of verbal requests that get forgotten. Arrives in parent's Queue like any other draft. |
| 10 | **Claim lock with timer and auto-release** | Prevents job board stagnation. If a kid claims a job and doesn't finish, it returns to the pool. No penalty, just availability. Grace period prevents mid-completion expiration. |
| 11 | **Image-based Task Breaker at Full Magic tier** | Premium AI feature (image analysis cost). Enables "take a photo of the mess, get cleaning steps" — powerful for kids who need guidance without mom spoon-feeding. |
| 12 | **Task Breaker with family-context-aware decomposition** | When breaking down "clean the house," suggesting which kid handles which room leverages family context that no generic task breaker has. |
| 13 | **Templates are MVP** | With 9 kids, recreating "Clean Bedroom" 9 times is unacceptable. Templates are the reusable master that makes the whole system manageable at scale. |
| 14 | **Studio page named "Studio"** | Creative, works for all ages/roles, subtitle "Templates, Trackers & Widgets" describes contents. Clean sidebar label. |
| 15 | **Tasks page is management surface, Dashboard is daily active view** | Mom manages the system on Tasks page. Kids interact on Dashboard. Clear separation of concerns. |
| 16 | **Reward configuration on tasks, full system deferred to PRD-24** | PRD-09A defines task_rewards join table and per-task reward config. Full gamification (transactions, balances, badges, streaks, redemption) is PRD-24. |
| 17 | **Rotating assignments with configurable cycle** | Bathroom rotation across 5 kids on a weekly cycle. Stored in recurrence_details JSONB with member array and current position. |
| 18 | **Routine display mode configurable: expanded or collapsed** | Play/Guided default to expanded (all steps visible). Teen/Adult default to collapsed (expandable). Mom can override per routine. |
| 19 | **Recurrence supports end dates, seasonal, school-year-only, rotating** | All four patterns confirmed as important for the family. JSONB recurrence_details handles complex scheduling without schema changes. |
| 20 | **Daily task generation at midnight** | Tasks ready when anyone opens the app in the morning. Simpler technically than on-first-open. |
| 21 | **Special Adult: Log Activity during shift** | Creates activity record mom sees in shift summary. Mom can promote to victory. SA doesn't create tasks. |
| 22 | **Show-until-complete toggle on routine sections** | Weekly items appear daily until checked off, then grey out. Gives flexibility to do weekly tasks on any day without them vanishing. |
| 23 | **Instance count on routine steps** | "Organize 2 drawers" = 2 separate checkboxes. Enables tasks that need to be done N times without creating N separate steps. |
| 24 | **Claim visibility configurable by mom per job board** | Some families want competitive transparency ("Gideon claimed it!"), others want less pressure. Mom decides per board. |
| 25 | **Pomodoro moved from view to task action tool (Focus Timer)** | Focus timers are useful on any task in any view, not just a view layout. Long-press context menu alongside Task Breaker. Logs time to Activity Log, shows half-filled checkbox for in_progress state. |
| 26 | **"Track This" action on tasks for teens at Full Magic** | Teens can convert any assigned task into a dashboard tracker/widget without mom having to create it. Reduces mom's workload. Stub defined here, wired by PRD-10. |
| 27 | **Opportunities work as both single tasks and lists** | "Deep clean garage — $15" is a single opportunity task. "Extra House Jobs" is an opportunity list. Both use task_type = 'opportunity_*' with different configuration. |
| 28 | **Project Planner source stub** | `source = 'project_planner'` and `related_plan_id` FK on tasks table. Goal decomposition from future Rigging-equivalent PRD deposits milestones into Task Creation Queue. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Full reward transaction system (ledger, balances, redemption) | PRD-24 (Rewards & Gamification) |
| 2 | Allowance pool (% completion = % earned) | PRD-28 (Tracking, Allowance & Financial) |
| 3 | Gamification themes as Studio templates | PRD-24 (Rewards & Gamification) |
| 4 | Victory Recorder wiring for task completions | PRD-11 (Victory Recorder) |
| 5 | Widget rendering on Dashboard | PRD-10 (Widgets) |
| 6 | Dashboard layout with collapsible sections | PRD-14 (Personal Dashboard) |
| 7 | Calendar view for task visualization | Calendar PRD |
| 8 | URL auto-import from external services | Post-MVP enhancement |
| 9 | "Share to MyAIM" from phone browser | Post-MVP enhancement |
| 10 | Creator tier: custom blank template design + marketplace | Creator Tier PRD |
| 11 | Energy-based scheduling view | Post-MVP view addition |
| 12 | Time blocking view | Post-MVP view addition |
| 13 | Configurable Pomodoro timer durations | Post-MVP enhancement |
| 14 | Studio page structure and template browsing experience | PRD-09B (Lists, Studio & Templates) |
| 15 | List types, list management, list sharing | PRD-09B (Lists, Studio & Templates) |
| 16 | Focus Timer configurable durations (25/5/15 → custom) | Post-MVP enhancement |
| 17 | "Track This" widget creation flow | PRD-10 (Widgets) defines tracker creation from task data |
| 18 | Project Planner / Rigging equivalent (goal → milestone → task decomposition) | Future Project Planner PRD |
| 19 | One universal Studio Queue with destination flags (task, widget, list) | PRD-09B defines queue table; PRD-10 wires widget destination |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-04 (Shell Routing) | QuickTasks strip "Add Task" button wired. Dashboard active tasks section defined as collapsible. Play shell has no view toggles. | Update QuickTasks button definition. Add collapsible section pattern. |
| PRD-05 (LiLa Core) | Task context assembly expanded. Task Breaker guided modes defined. Auto-tagging behavior specified. | Add task_breaker and task_placement guided modes to LiLa registry. Update context assembly to include active tasks. |
| PRD-08 (Journal + Smart Notepad) | Task Creation Queue fully defined. Structure flags mapped to queue processing. | Update stub reference to point to PRD-09A queue spec. |
| PRD-02 (Permissions) | Task Requests add `member_request` as a source. Special Adult Log Activity defined. Dad task creation scoped to permitted kids. | Add task_request flow to permission model documentation. |
| PRD-10 (Widgets) | Studio page shared between PRD-09B and PRD-10. "View as Widget" toggle defined on tasks. | Coordinate Studio page structure between PRD-09B and PRD-10. |
| PRD-14 (Personal Dashboard) | Dashboard active tasks defined as collapsible section with view toggle carousel. By Member view on family overview. | Dashboard PRD should reference PRD-09A for task section contract. |
| PRD-06 (Guiding Stars) | Tasks can carry related_intention_id for Best Intentions linkage. | Add FK reference to PRD-06 schema. |
| PRD-11 (Victory Recorder) | Task completions with victory_flagged auto-create victories. Source = 'task_completed'. | Add source value to Victory schema. |
| PRD-24 (Rewards & Gamification) | task_rewards table defined as stub. Gamification as Studio template type noted. | PRD-24 wires reward transactions, balances, and gamification templates. |
| PRD-28 (Tracking & Allowance) | Opportunity completion data feeds payment tracking. Required tasks feed allowance pool calculation. | PRD-28 reads from task_completions and task_rewards. |
| Planning Decisions | "Studio" confirmed as page name. PRD-10 scope clarified (widget rendering, not template browsing). Three-page model established. | Update feature list and PRD order description. |

---

*End of PRD-09A*
