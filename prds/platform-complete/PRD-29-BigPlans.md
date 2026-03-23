# PRD-29: BigPlans

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities), PRD-12A (Personal LifeLantern), PRD-17 (Universal Queue & Routing System), PRD-18 (Rhythms & Reflections)
**Created:** March 22, 2026
**Last Updated:** March 22, 2026

---

## Overview

BigPlans is where intention becomes architecture. It's the planning and system-design tool for anything bigger than a single task — a goal with a deadline, a project with moving parts, or a household system that isn't working. Where Tasks (PRD-09A) handles what needs doing today and LifeLantern (PRD-12A) handles periodic life assessment, BigPlans handles the middle layer: the multi-step plans, the backward-designed goals, and the designed systems that turn recurring friction into reliable rhythm.

BigPlans has three planning modes, each serving a distinct need. **Goal backward-planning** starts from an end state and works backward through milestones to actionable tasks. **Multi-step project tracking** manages parallel tracks with dependencies and check-ins for projects like a home renovation or a family move. **System/routine design** takes a friction point — something in home or family life that keeps breaking down — and walks through diagnosis, design, deployment, and iterative refinement. All three produce real MyAIM components: tasks, sequential collections, routines, Best Intentions, trackers, calendar events, and lists. BigPlans doesn't just help you think about a plan — it deploys the plan into the tools you already use.

The feature includes the **Friction Detective** diagnostic engine, a conversational system where LiLa helps diagnose why something in family life isn't working using a four-category taxonomy: knowledge gaps, motivation issues, logistics problems, and capacity constraints. This engine powers both the in-app system-design mode and a future standalone freebie funnel tool (stubbed, not fully specced here). LiLa can also detect friction patterns in regular conversations and offer to route into system-design mode — bridging the gap between emotional processing and practical solution-building.

> **Mom experience goal:** Mom should feel like she finally has a co-planner who remembers the whole picture — not just today's tasks, but the big-picture goals, the family project timelines, and the systems that keep the house running. When she says "mornings are chaos," the tool doesn't just sympathize — it helps her design a system, deploy it into her actual routines and tasks, and then check back in two weeks to see if it's working. Planning should feel empowering, not overwhelming.

---

## User Stories

### Goal Planning
- As a mom, I want to set a goal with a deadline and have LiLa help me work backward to create milestones and tasks, so I can turn a big aspiration into manageable steps.
- As a mom, I want to connect my plan to my Guiding Stars, so I can see how daily execution serves who I'm becoming.
- As an independent teen, I want to create my own goal plan for college applications or personal projects, so I can learn to manage long-term goals independently.

### Project Tracking
- As a mom, I want to track a home renovation project with parallel workstreams (contractor, materials, permits), so I can see the whole picture and what depends on what.
- As a mom, I want to create a family plan (like planning a cross-country move) and assign milestones to different family members, so everyone knows their part.
- As a dad, I want to see family plans mom created and check in on milestones assigned to me, so I can stay aligned without needing mom to relay everything verbally.

### System Design
- As a mom, I want to tell LiLa that mornings are chaos and have her help me diagnose why — not just give generic advice, but figure out whether the problem is knowledge, motivation, logistics, or capacity, so I get a solution that actually fits.
- As a mom, I want the system design to deploy real components (a routine, a checklist, a Best Intention) into my existing tools, so the plan isn't just words — it's wired into my daily life.
- As a mom, I want to try a new system for two weeks and then have LiLa check in to see what worked and what didn't, so systems evolve instead of being abandoned.

### Ongoing Management
- As a mom, I want to see all my active plans on one page with progress bars and tappable milestone checkpoints, so I can check in on progress at a glance.
- As a mom, I want my plan check-ins to appear as rhythm cards in my morning routine, so I don't have to remember to review plans — the system reminds me.
- As a mom, I want to see how the pieces of a system design connect to each other — the routine, the tracker, the Best Intention — in one visual, so I understand how they work together.

### Manual & Non-AI
- As a mom, I want to create a plan without using AI — just a form where I enter milestones and details myself, so I can use BigPlans even when I know exactly what I want.

---

## Screens

### Screen 1: BigPlans Main Page (Sidebar Page)

**What the user sees:**
- "BigPlans" header with subtitle "Where your biggest ideas become real."
- "Start New Plan" button (primary action) → opens LiLa in BigPlans guided mode
- "Create Manually" link (secondary, quieter) → opens manual plan creation form
- Filter bar: Active (default), Paused, Completed, All
- Sort: Recently updated (default), Alphabetical, Target date
- Plan cards (see Screen 2 for card design)
- Completed plans in a collapsed section at the bottom
- Empty state: "No plans yet. When you have something bigger than a single task — a career move, a home project, a morning routine that actually works — this is where it takes shape."

> **Decision rationale:** Own sidebar page, not nested inside another feature. Plans are a return-to surface that users check regularly. Burying this inside Tasks or LifeLantern would make plans feel like afterthoughts rather than first-class citizens.

**Interactions:**
- Tap "Start New Plan" → opens LiLa drawer/modal in `bigplans_goal`, `bigplans_project`, or `bigplans_system` guided mode (LiLa asks what they're trying to accomplish first, then routes to the appropriate sub-mode)
- Tap "Create Manually" → opens manual plan creation form (Screen 6)
- Tap a plan card → navigates to Plan Detail view (Screen 3)
- Filter/Sort controls update the card list in real-time
- Family plans section (if any exist) appears above personal plans with a "Family Plans" label

**Data displayed:**
- All `plans` records for the current member (personal) + all family plans visible to this member

---

### Screen 2: Plan Card (Reusable Component)

**What the user sees:**
- Plan title (bold)
- Plan type badge: "Goal" / "Project" / "System" (muted, small)
- Status badge: Active (default green), Paused (amber), Completed (muted)
- Description preview (1-2 lines, truncated)
- Progress bar showing milestone completion percentage (visual overview at a glance)
- Milestone checkpoints overlaid on the progress bar — small tappable dots at each milestone position. Completed milestones are filled; upcoming are hollow; overdue pulse gently.
- Connected Guiding Stars (if any) shown as small tag chips below the description
- Next milestone name + target date (if applicable)
- For system-design plans: "Trial period: X days remaining" indicator when in trial
- For family plans: member avatars showing who's involved
- Check-in indicator: breathing glow dot if a check-in is due

**Interactions:**
- Tap card body → navigates to Plan Detail (Screen 3)
- Tap a milestone checkpoint → opens a quick milestone detail popover showing title, target date, status, linked tasks count, with "Mark Complete" and "View Tasks" actions
- Tap Guiding Star chip → navigates to that Guiding Star on the Guiding Stars page

---

### Screen 3: Plan Detail View (Tabbed)

Three tabs: **Plan**, **Journal**, **Conversations**

#### Tab 1: Plan

**What the user sees:**
- Plan title (editable inline)
- Status badge with dropdown: Active, Paused, Completed, Archived
- Plan type badge (not editable after creation — type is structural)
- Description (editable inline)
- Connected Guiding Stars section: chips for each linked star, "Add Connection" button to link more, "×" to remove
- Check-in rhythm indicator: "Checking in every [frequency]" with edit link. Shows next check-in date.
- Trial period indicator (system-design plans only): "Trying this system for [X] days — [Y] days remaining. [Extend] [End Trial & Review]"

**Milestones Section:**
- Ordered timeline of milestones with:
  - Title (editable inline)
  - Target date (editable inline, date picker)
  - Status: Not Started / In Progress / Complete / Overdue
  - Linked task count badge (tappable → shows linked tasks)
  - "Break Down" button → opens Task Breaker with milestone as input, creating tasks with `source = 'project_planner'` and `related_plan_id` set
  - "Create Sequential" button → creates a sequential collection (PRD-09A) from the milestone's sub-steps, depositing into `studio_queue` with `source = 'project_planner'`
  - Expand arrow → shows milestone description, notes, and linked task list
- "Add Milestone" button at bottom of timeline
- Drag-to-reorder (or up/down arrows on mobile)

**Ecosystem Map (system-design plans only):**
- Interactive visual showing all deployed components and how they connect
- Grouped by feature type: Routines, Tasks, Best Intentions, Trackers, Calendar Events, Lists, Sequential Collections
- Each component is a tappable node that navigates to the actual item in its home feature
- Connection lines show relationships (e.g., routine → tasks it generates, tracker → what it measures)
- Visual updates in real-time as components are completed or modified
- "Add Component" button to deploy additional items from the plan

> **Decision rationale:** The ecosystem map teaches users how MyAIM features work together by showing them in context. This is the "I Go First" philosophy applied to feature discovery — the platform itself is the curriculum.

**Parallel Tracks (project plans only):**
- Named tracks (e.g., "Contractor", "Materials", "Permits") displayed as parallel timelines
- Each track has its own milestones
- Dependency lines between milestones across tracks (e.g., "Permits approved" must precede "Construction begins")
- Visual indicator when a dependency is blocking progress

**Friction Diagnosis Summary (system-design plans only):**
- Collapsible section showing the friction diagnosis results
- Primary friction category identified (Knowledge / Motivation / Logistics / Capacity)
- Contributing factors listed
- Design rationale: why the deployed system targets this friction type

**Action buttons:**
- "Continue Planning" → opens LiLa with full plan context loaded
- "Check In Now" → opens LiLa check-in conversation for this plan
- Plan menu (⋯): Pause, Archive, Delete, Share (family plans)

#### Tab 2: Journal

- Journal entries linked via `related_plan_id` on `journal_entries` table
- Also shows entries with matching `life_area_tag` as a secondary match (same fallback pattern as StewardShip Wheel Journal tab)
- Entries created during BigPlans conversations automatically get `related_plan_id` set
- "Write about this plan" button → opens Journal with plan context pre-loaded
- LiLa can offer to link relevant entries from regular conversations: "Want me to connect this to your plan about [title]?"

#### Tab 3: Conversations

- All LiLa conversations with `guided_mode` matching any BigPlans mode AND `guided_mode_reference_id` matching this plan's ID
- Shows conversation date, duration, and a brief AI-generated summary of what was discussed/decided
- Tap a conversation → reopens it in LiLa (read-only for past, continues for the most recent)

---

### Screen 4: BigPlans Compile Review (Post-Conversation)

**What the user sees:**
After LiLa finishes the planning conversation and the user taps "Compile Plan," the `bigplans-compile` Edge Function processes the conversation and returns a structured plan preview.

**For Goal Backward-Plans:**
- Title, description, connected Guiding Stars
- Milestones in reverse chronological order (working backward from the deadline)
- Each milestone shows: title, target date, description
- Suggested tasks per milestone (optional — user can break down later)

**For Multi-Step Projects:**
- Title, description
- Parallel tracks with named workstreams
- Milestones per track with target dates
- Dependencies between milestones (shown as connecting lines in a simple Gantt-style view)

**For System Designs:**
- Title, description
- Friction diagnosis summary (category + contributing factors)
- System Blueprint: all proposed components grouped by type
  - Routines (with section detail)
  - Tasks (individual or sequential collections)
  - Best Intentions
  - Trackers/Widgets
  - Calendar Events
  - Lists
- Suggested trial period (default 14 days, editable)
- Suggested check-in rhythm

**Human-in-the-Mix on every component:**
- Each proposed component has: [✓ Approve] [✎ Edit] [↻ Regenerate] [✕ Reject]
- "Approve All" button for users who trust the output
- "Edit" opens inline editing for that component
- "Regenerate" sends the component back to LiLa for a revised version
- "Reject" removes the component from the plan

**After review:**
- "Deploy Plan" button → creates all approved components in their respective features
- Tasks → deposited into `studio_queue` with `source = 'project_planner'`
- Sequential collections → created in `sequential_collections` with linked tasks
- Routines → created as `task_templates` with `task_type = 'routine'`
- Best Intentions → created directly in `best_intentions` with `source = 'bigplans'`
- Trackers → deposited into `studio_queue` with `destination = 'tracker'`
- Calendar Events → created directly in `calendar_events`
- Lists → created directly in `lists`
- Plan record saved to `plans` table with all milestones

---

### Screen 5: Check-In Conversation

**Entry points:**
- "Check In Now" button on Plan Detail
- Rhythm card in morning/evening rhythm (PRD-18) on the configured check-in day
- LiLa nudge in regular conversation (when plan has overdue milestones or approaching deadlines)

**What LiLa does:**
- Loads full plan context: title, milestones (with completion status), deployed components (with their current state), journal entries, and Guiding Stars connections
- For goal/project plans: "Let's check in on [plan title]. You've completed [X of Y] milestones. [Next milestone] is coming up on [date]. How are things going?"
- For system-design plans in trial: "You've been trying your [system name] for [X] days now. What's working? What's breaking down?"
- LiLa asks targeted questions, then offers adjustments: add milestones, adjust dates, modify deployed components, pause the plan, or mark milestones complete
- Check-in results are compiled and the plan is updated (with Human-in-the-Mix on all changes)

**For system-design trial reviews:**
- LiLa guides through: "What worked?" → "What didn't?" → "What surprised you?"
- Proposes specific adjustments to deployed components
- Option to extend the trial, end the trial and keep the system, or pivot to a different approach (Persist / Pause / Pivot framework from the condensed intelligence)
- Adjusted components go through Human-in-the-Mix review before being deployed

---

### Screen 6: Manual Plan Creation

**What the user sees:**
- Plan type selector with three plain-language options:
  - "I have a goal with a deadline" → Goal backward-planning
  - "I have a project with multiple moving parts" → Multi-step project tracking
  - "Something in my home/life isn't working and I want to fix it" → System/routine design
- Title field
- Description field (optional)
- Guiding Stars connection picker (optional)
- Deadline / target date (for goals)

**After type selection:**
- Goal: Add milestones form with title + target date per milestone
- Project: Add tracks form, then add milestones per track
- System: Add friction description, then add component list manually (type picker per component)

**Check-in rhythm picker:** Weekly / Biweekly / Monthly / None
**Trial period (system only):** Number of days (default 14)

"Create Plan" button → saves plan and navigates to Plan Detail

> **Decision rationale:** Manual creation serves users who already know what they want. No AI conversation required. Follows the buffet principle — AI is the recommended path, not the required one. Also provides a fallback when AI credits are depleted.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full CRUD on all personal plans. Full CRUD on family plans. Can view all family members' plans. Can assign milestones/tasks within family plans to any member. | Mom is the default family plan creator. |
| Dad / Additional Adult | Full CRUD on own personal plans. View + check in on family plans. Can be assigned milestones/tasks. Can create family plans IF mom grants `bigplans_family_create` permission. | Dad sees his own plans + family plans he's involved in. Cannot see mom's personal plans unless she shares. |
| Special Adult | Not present | Special Adults do not access BigPlans. |
| Independent (Teen) | Full CRUD on own personal plans. View + check in on family plans they're assigned to. | Teens can create personal goal and project plans. Cannot create family plans. Cannot access system-design mode (friction diagnosis requires household-level context). |
| Guided / Play | Not present | BigPlans is not available in Guided or Play shells. |

### Shell Behavior
- **Mom shell:** Full BigPlans page in sidebar with all features.
- **Dad/Adult shell:** BigPlans page in sidebar with personal plans + visible family plans. Family plan creation only if permitted.
- **Independent shell:** BigPlans page in sidebar with personal plans only + assigned family plan sections. System-design mode hidden.
- **Guided/Play shells:** No BigPlans page. Not in sidebar.

### Privacy & Transparency
- Personal plans are private by default. Mom can see all members' plans (mom-first architecture).
- Family plans are visible to all adults and independent teens who are assigned to them.
- Teens know BigPlans exists and can see their own work. They cannot see other members' personal plans.
- When a family member is assigned a milestone, they see only that milestone and its tasks — not the full plan, unless the plan creator explicitly shares the full view.

---

## Data Schema

### Table: `plans`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members |
| owner_type | TEXT | 'personal' | NOT NULL | CHECK: 'personal', 'family'. Family plans visible to assigned members. |
| plan_type | TEXT | | NOT NULL | CHECK: 'goal', 'project', 'system'. Immutable after creation. |
| title | TEXT | | NOT NULL | |
| description | TEXT | | NULL | |
| status | TEXT | 'active' | NOT NULL | CHECK: 'active', 'paused', 'completed', 'archived' |
| target_date | DATE | | NULL | For goal plans — the deadline. |
| check_in_rhythm | TEXT | 'biweekly' | NULL | CHECK: 'weekly', 'biweekly', 'monthly', NULL. NULL = no scheduled check-ins. |
| next_check_in_date | DATE | | NULL | Computed from check_in_rhythm. Updated after each check-in. |
| trial_period_days | INTEGER | | NULL | System-design plans only. Number of days for the trial. |
| trial_start_date | DATE | | NULL | When the trial began. |
| trial_end_date | DATE | | NULL | Computed: trial_start_date + trial_period_days. |
| friction_diagnosis | JSONB | | NULL | System-design plans only. Stores: { primary_category: TEXT, contributing_factors: TEXT[], diagnosis_summary: TEXT, solution_rationale: TEXT } |
| ecosystem_map | JSONB | | NULL | System-design plans only. Stores deployed component references: { components: [{ type: TEXT, record_id: UUID, display_name: TEXT, connections: UUID[] }] } |
| nudge_in_conversations | BOOLEAN | true | NOT NULL | Whether LiLa mentions this plan in regular conversations when relevant. |
| guiding_star_ids | UUID[] | '{}' | NOT NULL | FK[] → guiding_stars. Connected identity anchors. |
| source | TEXT | 'manual' | NOT NULL | CHECK: 'manual', 'lila_conversation', 'lifelantern'. How this plan was created. |
| source_reference_id | UUID | | NULL | FK to source record (conversation, LifeLantern area, etc.) |
| completed_at | TIMESTAMPTZ | | NULL | |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Personal plans: creator + mom can read. Family plans: all assigned members + mom can read. Write: creator + mom. Family-scoped via family_id.

**Indexes:**
- `(family_id, created_by, status)` — personal active plans
- `(family_id, owner_type, status)` — family active plans
- `(family_id, next_check_in_date)` — plans with upcoming check-ins
- `(family_id, archived_at)` — active plans

---

### Table: `plan_milestones`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| plan_id | UUID | | NOT NULL | FK → plans |
| track_name | TEXT | | NULL | For project plans with parallel tracks. NULL for goal/system plans. |
| title | TEXT | | NOT NULL | |
| description | TEXT | | NULL | |
| sort_order | INTEGER | 0 | NOT NULL | Order within the track (or within the plan for non-tracked types) |
| target_date | DATE | | NULL | |
| status | TEXT | 'not_started' | NOT NULL | CHECK: 'not_started', 'in_progress', 'completed', 'skipped' |
| assigned_to | UUID | | NULL | FK → family_members. For family plans — who owns this milestone. |
| dependency_ids | UUID[] | '{}' | NOT NULL | FK[] → plan_milestones. Milestones that must complete before this one starts. |
| task_breaker_level | TEXT | | NULL | CHECK: 'quick', 'detailed', 'granular'. Set when tasks are generated from this milestone. |
| completed_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Inherits from parent plan's RLS.

**Indexes:**
- `(plan_id, sort_order)` — ordered milestones within a plan
- `(plan_id, track_name, sort_order)` — ordered milestones within a track
- `(plan_id, status)` — filter by status
- `(assigned_to)` — milestones assigned to a member

---

### Table: `plan_components`

Tracks deployed MyAIM components that were created from a system-design plan.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| plan_id | UUID | | NOT NULL | FK → plans |
| component_type | TEXT | | NOT NULL | CHECK: 'task', 'routine', 'best_intention', 'tracker', 'calendar_event', 'list', 'sequential_collection' |
| component_id | UUID | | NOT NULL | FK to the actual record in its home table |
| display_name | TEXT | | NOT NULL | Human-readable name for the ecosystem map |
| connection_ids | UUID[] | '{}' | NOT NULL | FK[] → plan_components. Other components this one relates to. |
| status | TEXT | 'active' | NOT NULL | CHECK: 'active', 'modified', 'removed'. Tracks if the deployed component was changed outside BigPlans. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Inherits from parent plan's RLS.

**Indexes:**
- `(plan_id, component_type)` — components by type within a plan
- `(component_type, component_id)` — reverse lookup: given any record, find its plan

---

### Table: `plan_check_ins`

Records each check-in event for tracking and review.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| plan_id | UUID | | NOT NULL | FK → plans |
| checked_in_by | UUID | | NOT NULL | FK → family_members |
| conversation_id | UUID | | NULL | FK → lila_conversations. NULL for manual check-ins. |
| summary | TEXT | | NULL | AI-generated or user-written summary of the check-in |
| changes_made | JSONB | '{}' | NOT NULL | Record of what was adjusted: { milestones_added: INT, milestones_completed: INT, components_modified: INT, trial_extended: BOOLEAN, etc. } |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Inherits from parent plan's RLS.

**Indexes:**
- `(plan_id, created_at)` — check-in history in order

---

### Table: `friction_diagnosis_templates`

Platform-level diagnostic question patterns for the Friction Detective engine. Lives in `platform_intelligence` schema.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| category | TEXT | | NOT NULL | CHECK: 'knowledge', 'motivation', 'logistics', 'capacity' |
| question_template | TEXT | | NOT NULL | The diagnostic question pattern for LiLa's system prompt |
| follow_up_templates | JSONB | '[]' | NOT NULL | Follow-up questions based on the answer |
| signal_patterns | JSONB | '{}' | NOT NULL | What user responses indicate this category: keywords, phrases, patterns |
| solution_feature_map | JSONB | '{}' | NOT NULL | Which MyAIM features address this friction type |
| sort_order | INTEGER | 0 | NOT NULL | |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Admin-only write. Platform-wide read (no family_id — this is shared intelligence).

---

### Table: `freebie_friction_results` (Stub)

Stores friction diagnosis results for future freebie funnel and onboarding seeding.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| email | TEXT | | NULL | For non-users (freebie funnel). NULL for in-app users. |
| family_id | UUID | | NULL | For existing users. NULL for non-users. |
| diagnosis_results | JSONB | | NOT NULL | Full friction diagnosis output |
| feature_recommendations | JSONB | | NOT NULL | Which MyAIM features map to their friction points |
| source | TEXT | | NOT NULL | CHECK: 'in_app', 'freebie_web', 'freebie_vault' |
| converted_to_user | BOOLEAN | false | NOT NULL | Whether this freebie lead signed up |
| seeded_to_onboarding | BOOLEAN | false | NOT NULL | Whether results were used to personalize onboarding |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Admin-only for freebie entries. Family-scoped for in-app entries.

> **Forward note:** This table is a stub. The freebie delivery mechanism (standalone web page, Vault tool, email flow) is not specced in this PRD. The data model supports future onboarding bridge (freebie answers seed in-app experience) but the bridge is not built.

---

### Column Additions to Existing Tables

**`journal_entries` (PRD-08):**
- Add `related_plan_id UUID NULL FK → plans` — links journal entries to plans. Same pattern as StewardShip's `related_rigging_plan_id` on `log_entries`.

**`tasks` (PRD-09A):**
- `related_plan_id` FK already exists (stubbed in PRD-09A). Wired by this PRD.
- `source = 'project_planner'` already exists in source enum (stubbed in PRD-09A). Wired by this PRD.

**`studio_queue` (PRD-17):**
- `source = 'project_planner'` already exists in source CHECK (stubbed in PRD-17). Wired by this PRD.

---

### Enum/Type Updates

No new database enums. `plans.plan_type`, `plans.status`, `plan_milestones.status`, `plan_components.component_type`, and `friction_diagnosis_templates.category` all use TEXT with CHECK constraints, following the established pattern.

Add to `best_intentions` source values: `'bigplans'`.

---

## Flows

### Incoming Flows (How Data Gets INTO BigPlans)

| Source | How It Works |
|--------|-------------|
| LiLa Conversations (PRD-05) | Primary creation path. User describes what they're planning, LiLa detects type, guides the conversation, compiles the plan. |
| LifeLantern Goal Generation (PRD-12A) | Complex goals route to BigPlans via `studio_queue` with `source = 'goal_decomposition'`. Wires the existing PRD-12A stub. |
| LiLa Friction Detection (PRD-05 addendum) | LiLa detects friction patterns in regular conversations and offers to route into system-design mode. Conversation transitions seamlessly. |
| Manual Creation | User creates plan directly via form (Screen 6). No AI involved. |
| Smart Notepad (PRD-08) | "Send to → BigPlans" on the RoutingStrip deposits content as a plan seed into `studio_queue` with `source = 'project_planner'`, `destination = 'plan'`. |

### Outgoing Flows (How BigPlans Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Tasks (PRD-09A) | Milestone breakdown creates tasks with `source = 'project_planner'` and `related_plan_id` set. Deposited via `studio_queue`. |
| Sequential Collections (PRD-09A) | System-design and goal milestones can generate sequential task collections. Items promote in chronological order. |
| Best Intentions (PRD-06) | System-design mode can create Best Intentions with `source = 'bigplans'`. |
| Trackers/Widgets (PRD-10) | System-design mode can create trackers via `studio_queue` with `destination = 'tracker'`. |
| Calendar Events (PRD-14B) | Milestone target dates and plan deadlines surface on the calendar. System components can include calendar events. |
| Lists (PRD-09B) | System-design mode can create lists (e.g., a supplies checklist for a renovation project). |
| Routines (PRD-09A) | System-design mode can create routine templates for deployment. |
| Rhythms & Reflections (PRD-18) | Scheduled check-ins appear as rhythm cards on configured check-in days. |
| Victory Recorder (PRD-11) | Plan completion and milestone completion can trigger victory suggestions. |
| LiLa Context (PRD-05) | Active plans loaded into LiLa context assembly for relevant conversations. Plan nudges in regular conversations when enabled. |
| Journal (PRD-08) | Entries from BigPlans conversations auto-linked via `related_plan_id`. |

---

## AI Integration

### Guided Mode Registrations

BigPlans registers **four** guided modes: one router mode and three plan-type-specific modes.

#### Mode: `bigplans` (Router)

| Field | Value |
|---|---|
| mode_key | `bigplans` |
| display_name | BigPlans |
| parent_mode | — |
| avatar_key | optimizer |
| model_tier | sonnet |
| context_sources | ['guiding_stars', 'best_intentions', 'active_plans'] |
| person_selector | false |
| opening_messages | See below |
| system_prompt_key | bigplans_router |
| available_to_roles | ['mom', 'adult', 'independent'] |
| requires_feature_key | bigplans_create |

**Opening messages (rotating):**
- "Let's build something! What are you planning — a goal you want to reach, a project you need to manage, or something in your home that needs to work better?"
- "Hey! Tell me what's on your mind — whether it's a dream with a deadline, a project with a lot of pieces, or a system that keeps breaking down, I'm here to help you plan it out."
- "Ready to plan? Tell me what you're working toward, and I'll figure out the best way to approach it with you."

**Router behavior:** LiLa listens to the user's description and infers which plan type fits. She confirms: *"This sounds like [plain-language type description]. Does that match what you're thinking?"* On confirmation, the conversation transitions into the appropriate sub-mode. Power users can specify directly: "I want to do a system design" or "This is a goal with a deadline."

#### Mode: `bigplans_goal` (Goal Backward-Planning)

| Field | Value |
|---|---|
| mode_key | `bigplans_goal` |
| display_name | BigPlans — Goal |
| parent_mode | bigplans |
| avatar_key | optimizer |
| model_tier | sonnet |
| context_sources | ['guiding_stars', 'best_intentions', 'active_plans', 'self_knowledge'] |
| person_selector | false |
| system_prompt_key | bigplans_goal |
| available_to_roles | ['mom', 'adult', 'independent'] |
| requires_feature_key | bigplans_create |

**AI Behavior:**
1. Establish the goal and deadline
2. Connect to Guiding Stars when natural ("This connects to your value of [star] — want to link them?")
3. Work backward from the deadline to identify milestones
4. For each milestone, estimate realistic time requirements (referencing planning fallacy — "most people underestimate by 30-50%, so let's build in buffer")
5. Ask about potential obstacles (brief pre-mortem)
6. When ready: "Compile Plan" button → `bigplans-compile` Edge Function
7. User reviews compiled plan (Screen 4)

#### Mode: `bigplans_project` (Multi-Step Project)

| Field | Value |
|---|---|
| mode_key | `bigplans_project` |
| display_name | BigPlans — Project |
| parent_mode | bigplans |
| avatar_key | optimizer |
| model_tier | sonnet |
| context_sources | ['guiding_stars', 'active_plans', 'calendar_events'] |
| person_selector | false |
| system_prompt_key | bigplans_project |
| available_to_roles | ['mom', 'adult'] |
| requires_feature_key | bigplans_create |

**AI Behavior:**
1. Understand the project scope
2. Identify parallel workstreams ("What are the different tracks of work here?")
3. Map milestones per track
4. Identify dependencies between tracks
5. For family plans: identify who owns each track or milestone
6. Establish timeline and check-in rhythm
7. Compile plan with parallel track structure

#### Mode: `bigplans_system` (System/Routine Design with Friction Detective)

| Field | Value |
|---|---|
| mode_key | `bigplans_system` |
| display_name | BigPlans — System Design |
| parent_mode | bigplans |
| avatar_key | optimizer |
| model_tier | sonnet |
| context_sources | ['guiding_stars', 'best_intentions', 'active_plans', 'self_knowledge', 'family_context', 'active_tasks', 'active_routines'] |
| person_selector | false |
| system_prompt_key | bigplans_system |
| available_to_roles | ['mom', 'adult'] |
| requires_feature_key | bigplans_system_design |

**AI Behavior — Friction Detective Phase:**
1. Listen to the presenting problem ("Tell me what's breaking down")
2. Ask diagnostic questions conversationally, mapping to the four-category taxonomy:

**Knowledge Gap diagnostics:**
- "Does everyone involved know exactly what 'done' looks like for this?"
- "When this breaks down, is it because someone didn't know what to do, or they knew but it didn't happen?"
- "If you wrote down the exact steps, could someone else follow them and get the same result?"
- "Has anyone been taught this skill, or are we assuming they picked it up?"

**Motivation Issue diagnostics:**
- "When this falls apart, is someone actively choosing not to do it — or does it just… not happen?"
- "Does this feel like a 'want to but can't' or a 'could but don't want to'?"
- "Is there anything about this that feels punishing, boring, or thankless?"
- "If you could make this task genuinely enjoyable, what would need to change?"

**Logistics Problem diagnostics:**
- "Walk me through what physically happens when this routine breaks down. Where does the sequence stall?"
- "Is there a bottleneck — one person or one step that everything depends on?"
- "Are the tools and supplies where they need to be, when they need to be there?"
- "What time of day does this happen, and is that realistic given what's happening around it?"

**Capacity Constraint diagnostics:**
- "Is this failing on busy days specifically, or even on calm days?"
- "How many things are people trying to remember at the same time during this?"
- "If someone wrote everything down and put it in front of them, would it still fail?"
- "Is the person this depends on running on fumes by the time it matters?"

3. Converge on a primary diagnosis and name it in plain language: *"The core issue here is a logistics problem — the morning routine has a bottleneck where only you can pack lunches, and everything else stalls while that happens."*
4. Ethics guardrail throughout: LiLa never implies mom is doing something wrong. Frame is always "this is a friction point in the system, not a failure in you."

**AI Behavior — System Design Phase:**
5. Propose a system design targeting the diagnosed friction category
6. Show how the system maps to specific MyAIM components: "Here's what I'm thinking — a morning routine with three sections, a sequential checklist for lunch prep that the kids can follow, and a Best Intention about letting go of perfection in the mornings."
7. Walk through each component conversationally
8. Ask about trial period: "Want to try this for two weeks and then we'll check in?"
9. Compile system blueprint with all components

### Friction Detection in Regular Conversations (PRD-05 Addendum)

LiLa should detect friction patterns in regular conversations and offer to route into system-design mode. This is an intent recognition pattern added to LiLa's core intelligence layer.

**Triggers:**
- Repeated complaints about the same topic across conversations (if mom has mentioned morning chaos three times this week, the offer becomes more confident)
- Explicit frustration language + actionable domain (mornings, chores, meals, homework, finances, bedtime, transitions)
- Direct requests: "I need a better way to handle X" / "Nothing works for Y"

**Response pattern:** LiLa gently offers: *"It sounds like [area] keeps coming up. Would you like me to help you design a system for that? We could figure out what's really causing the friction and build something that actually works."*

**If yes:** Conversation transitions seamlessly into `bigplans_system` mode. No modal, no page change — the conversation just shifts direction.
**If no:** LiLa continues normally. No follow-up offers for at least 7 days on the same topic.

**Cross-conversation detection:** Requires embedding-based topic matching across recent conversations. Uses the existing pgvector infrastructure (Semantic Context Infrastructure Addendum). Threshold: 3+ mentions of the same friction domain within 14 days before offering.

> **Forward note:** This addendum must be added to PRD-05's guided mode registry and LiLa's system prompt assembly. The detection logic (cross-conversation topic matching) is an enhancement to the context assembly pipeline.

### Edge Function: `bigplans-compile`

Supabase Edge Function via OpenRouter. Same architectural pattern as StewardShip's `rigging-compile`.

**Input:**
```json
{
  "user_id": "UUID",
  "plan_id": "UUID | null",
  "plan_type": "'goal' | 'project' | 'system'",
  "conversation_messages": [{ "role": "string", "content": "string" }],
  "guiding_stars": "string[]",
  "existing_plan_data": "object | null"
}
```

**Output (Goal):**
```json
{
  "title": "string",
  "description": "string",
  "target_date": "DATE",
  "milestones": [{ "title": "string", "description": "string", "target_date": "DATE" }],
  "guiding_star_connections": "UUID[]",
  "suggested_check_in_rhythm": "'weekly' | 'biweekly' | 'monthly'"
}
```

**Output (Project):**
```json
{
  "title": "string",
  "description": "string",
  "tracks": [{
    "name": "string",
    "milestones": [{ "title": "string", "description": "string", "target_date": "DATE", "assigned_to": "UUID | null", "dependency_ids": "temp_id[]" }]
  }],
  "suggested_check_in_rhythm": "'weekly' | 'biweekly' | 'monthly'"
}
```

**Output (System):**
```json
{
  "title": "string",
  "description": "string",
  "friction_diagnosis": {
    "primary_category": "'knowledge' | 'motivation' | 'logistics' | 'capacity'",
    "contributing_factors": "string[]",
    "diagnosis_summary": "string",
    "solution_rationale": "string"
  },
  "components": [{
    "type": "'routine' | 'task' | 'sequential' | 'best_intention' | 'tracker' | 'calendar_event' | 'list'",
    "title": "string",
    "details": "object",
    "connections": "temp_id[]"
  }],
  "trial_period_days": "number",
  "suggested_check_in_rhythm": "'weekly' | 'biweekly' | 'monthly'"
}
```

**System prompt for compile:** "Compile a structured plan from this planning conversation. For goals: extract milestones in reverse chronological order working backward from the deadline. For projects: organize into parallel tracks with dependencies. For systems: include the friction diagnosis and all proposed components with their connection relationships. Use plain language throughout. Never use planning jargon. Every component must be specific enough to deploy directly into the app."

### Context Assembly for Regular Conversations

When a user has active BigPlans plans, their brief summaries are included in LiLa's context assembly for regular conversations:

```
Active Plans:
- "Morning routine redesign" (System Design, trying for 8 more days)
- "Apply to nursing program" (Goal, 3/7 milestones complete, next: submit application by April 15)
```

If `nudge_in_conversations` is true for a plan, LiLa can mention it once per conversation when contextually relevant.

---

## Edge Cases

### Empty state — no plans
Warm invitation without pressure: "No plans yet. When you have something bigger than a single task — a career move, a home project, a morning routine that actually works — this is where it takes shape."

### Plan with no milestones
Valid for newly created manual plans. LiLa offers to help add milestones: "This plan doesn't have milestones yet. Want me to help you break it down?"

### All milestones completed but plan not marked complete
LiLa celebrates and asks: "All milestones are done! Ready to mark this plan as complete?" Plan remains active until user explicitly completes it.

### System-design trial expires
If the trial period ends and no check-in has happened, the plan card shows an "overdue review" indicator. LiLa offers a check-in in the next conversation. The deployed components remain active — the trial ending doesn't deactivate anything.

### Deployed component modified outside BigPlans
If a routine or task created by BigPlans is edited directly in Tasks or Studio, the `plan_components` record shows `status = 'modified'`. The ecosystem map shows a subtle "modified" indicator. LiLa can mention this during the next check-in: "I noticed you adjusted the morning routine — should we update the plan to match?"

### Deployed component deleted outside BigPlans
`plan_components` record shows `status = 'removed'`. Ecosystem map shows the component grayed out with "Removed" label. Plan doesn't break — the component reference is informational, not structural.

### Very long planning conversation
Same handling as all LiLa conversations — if the conversation exceeds context window limits, earlier messages are summarized. The compile function works from the full conversation, not the truncated context.

### Family plan with no assigned members
Valid — mom may create a family plan and assign people later. Plan appears only in mom's view until members are assigned.

### Teen tries to access system-design mode
System-design mode is not available to independent teens. If a teen describes a friction point, LiLa responds as a helpful conversation partner but does not offer system-design routing. The mode simply doesn't appear in the teen's LiLa mode options.

---

## Tier Gating

All BigPlans features return true during beta. Feature keys wired from day one.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `bigplans_create` | Create personal plans (all three types) | Enhanced |
| `bigplans_system_design` | System/routine design mode with Friction Detective | Full Magic |
| `bigplans_family` | Create and manage family plans | Enhanced |
| `bigplans_family_create` | Dad permission to create family plans | Enhanced (mom-granted) |
| `bigplans_check_in` | Scheduled check-in conversations | Enhanced |
| `bigplans_ecosystem_map` | Interactive ecosystem map on system-design plans | Full Magic |
| `bigplans_manual` | Manual plan creation (no AI) | Essential |

> **Tier rationale:** Manual plan creation is Essential because anyone should be able to track a multi-step goal without AI. Full planning with LiLa is Enhanced because it requires Sonnet-tier AI calls. System-design with Friction Detective and the ecosystem map are Full Magic because they're the highest-value AI features. This follows the "build unlocked, gate later" approach — real usage data will inform final tier placement.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Freebie friction funnel delivery (web page / Vault tool / email flow) | Marketing + onboarding | Future Marketing PRD or PRD-31 (Subscription) |
| Freebie → onboarding bridge (friction answers seed in-app experience) | Onboarding personalization | PRD-31 (Subscription Tier System) |
| Earned AI credits for friction diagnosis completion | Credit ledger | PRD-31 (Subscription Tier System) |
| BigPlans completion → Victory suggestion | Victory creation with source = 'plan_completed' | PRD-11 (Victory Recorder) |
| Milestone completion → Victory suggestion | Victory creation with source = 'milestone_completed' | PRD-11 (Victory Recorder) |
| BigPlans check-in → Rhythms & Reflections rhythm card | Periodic rhythm card registration | PRD-18 (Rhythms & Reflections) |
| BigPlans milestone → BookShelf RAG for planning conversations | Book wisdom during planning | PRD-23 (BookShelf) |
| Ecosystem map → platform intelligence capture (anonymized system design patterns) | Platform intelligence pipeline | Platform Intelligence Pipeline v2 |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| `source = 'project_planner'` on tasks table | PRD-09A | Tasks created from milestone breakdown use this source value. |
| `related_plan_id` FK on tasks table | PRD-09A | Set on all tasks created from BigPlans milestones. |
| `studio_queue` routing for `source = 'project_planner'` | PRD-17 | BigPlans deposits milestone-generated tasks and trackers into the queue. |
| Goal decomposition routing through Universal Queue | PRD-17 | LifeLantern complex goals route into BigPlans plan creation. |
| Project Planner stub in LifeLantern goal generation | PRD-12A | LifeLantern's "Complex multi-step long-term goal → Project Planner" now routes to BigPlans. |
| Project planner → Studio Queue deposit | PRD-17 | Fully specified: milestone decomposition deposits into `studio_queue` with `source = 'project_planner'`. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] BigPlans page in sidebar with plan cards, filter/sort, empty state
- [ ] Plan cards showing progress bar + tappable milestone checkpoints + status + Guiding Star connections
- [ ] Plan Detail view with three tabs: Plan, Journal, Conversations
- [ ] Plan tab with milestones section, Guiding Star connections, check-in rhythm, status management
- [ ] Journal tab showing linked journal entries + life_area_tag fallback
- [ ] Conversations tab showing linked LiLa conversations
- [ ] "Start New Plan" → LiLa BigPlans router mode with type detection and confirmation
- [ ] Goal backward-planning conversational flow → compile → review → deploy
- [ ] Multi-step project tracking conversational flow with parallel tracks → compile → review → deploy
- [ ] System/routine design conversational flow with Friction Detective → compile → review → deploy
- [ ] Friction Detective: conversational diagnostic using four-category taxonomy (knowledge, motivation, logistics, capacity)
- [ ] System-design output deploys real components: tasks, sequential collections, routines, Best Intentions, trackers, calendar events, lists
- [ ] `bigplans-compile` Edge Function with three output schemas (goal, project, system)
- [ ] Human-in-the-Mix review on all compiled output: Approve / Edit / Regenerate / Reject per component
- [ ] "Deploy Plan" creates all approved components in their respective features
- [ ] Milestone "Break Down" → Task Breaker integration with `source = 'project_planner'` and `related_plan_id`
- [ ] Milestone "Create Sequential" → sequential collection creation via `studio_queue`
- [ ] Manual plan creation form (no AI) with all three plan types
- [ ] "Continue Planning" button → reopens LiLa with full plan context
- [ ] "Check In Now" button → LiLa check-in conversation with plan context
- [ ] Check-in conversations: what's working, what's not, adjustments compiled and reviewed
- [ ] System-design trial period: configurable days, indicator on plan card, trial review prompt
- [ ] Scheduled check-in rhythm (weekly/biweekly/monthly) with next check-in date tracking
- [ ] Family plans: mom (and permitted dad) create, assign milestones, family members view and check in
- [ ] Plan status management: active, paused, completed, archived
- [ ] Guiding Stars connection on plans: add/remove linked stars, visible on plan cards
- [ ] Connected Guiding Stars loaded in LiLa context during planning and check-in conversations
- [ ] `related_plan_id` on `journal_entries` — auto-set during BigPlans conversations
- [ ] LiLa context assembly includes active plan summaries for regular conversations
- [ ] Per-plan nudge toggle (on/off for LiLa mentioning in regular conversations)
- [ ] RLS working on all tables: personal plans visible to creator + mom, family plans visible to assigned members + mom
- [ ] `useCanAccess()` hooks wired for all feature keys (return true during beta)
- [ ] All CSS uses var(--color-*) variables
- [ ] All icons are Lucide

### MVP When Dependency Is Ready
- [ ] Interactive ecosystem map on system-design plans (visual showing component connections) — may require a lightweight graph rendering library
- [ ] Rhythms & Reflections check-in cards on configured check-in days (requires PRD-18 periodic card registration)
- [ ] LifeLantern complex goal → BigPlans routing via `studio_queue` (requires PRD-12A goal generation to deposit)
- [ ] LiLa friction detection in regular conversations (cross-conversation topic matching via pgvector) — requires enhanced context assembly pipeline
- [ ] Victory suggestion on plan/milestone completion (requires PRD-11 source registration)
- [ ] Friction diagnosis templates in `platform_intelligence` schema (requires admin review pipeline from Platform Intelligence Pipeline v2)
- [ ] BookShelf RAG for planning conversations — LiLa references planning wisdom during BigPlans sessions (requires PRD-23)

### Post-MVP
- [ ] Freebie friction funnel delivery mechanism (standalone web page or Vault tool)
- [ ] Freebie → onboarding bridge (friction answers seed in-app experience)
- [ ] Earned AI credits for friction diagnosis completion
- [ ] Parallel track Gantt-style visualization on project plans
- [ ] Dependency blocking alerts (notification when a milestone is blocked by an incomplete dependency)
- [ ] Plan sharing between family members (share a personal plan read-only with specific people)
- [ ] Plan templates in Studio (reusable plan structures for common scenarios)
- [ ] AI-suggested plans based on LifeLantern gap analysis ("I notice your career area has a big gap — want to create a plan?")
- [ ] Budget/resource tracking dimension on project plans
- [ ] Plan duplication (copy a completed plan structure for reuse)
- [ ] Neurodiversity-specific system design templates (ADHD morning routine, autism transition protocol)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: BigPlans has three plan types: 'goal' (backward from deadline), 'project' (parallel tracks), 'system' (friction diagnosis → design → deploy → iterate). Plan type is immutable after creation.
- [ ] Convention: `plans.owner_type` distinguishes personal ('personal') from family ('family') plans. Family plans are visible to assigned members.
- [ ] Convention: System-design plans have a trial period. Trial expiration prompts a check-in but does NOT deactivate deployed components.
- [ ] Convention: Ecosystem map (`plans.ecosystem_map` JSONB + `plan_components` table) tracks deployed components. Components modified or removed outside BigPlans are tracked via `plan_components.status`.
- [ ] Convention: Friction Detective uses a four-category taxonomy: knowledge, motivation, logistics, capacity. LiLa never implies the user is failing — frame is always "friction in the system, not failure in you."
- [ ] Convention: `bigplans-compile` Edge Function has three output schemas (goal, project, system). All output goes through Human-in-the-Mix review before deployment.
- [ ] Convention: BigPlans deposits tasks into `studio_queue` with `source = 'project_planner'`. Tasks created from milestones have `related_plan_id` set.
- [ ] Convention: `related_plan_id` on `journal_entries` auto-set during BigPlans LiLa conversations. Same pattern as StewardShip's `related_rigging_plan_id`.
- [ ] Convention: LiLa friction detection in regular conversations uses cross-conversation topic matching. Minimum 3 mentions of same domain within 14 days before offering. If declined, no re-offer for 7 days on same topic.
- [ ] Convention: BigPlans guided modes: `bigplans` (router), `bigplans_goal`, `bigplans_project`, `bigplans_system`. Router detects type and transitions. Power users can specify directly.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `plans`, `plan_milestones`, `plan_components`, `plan_check_ins`, `friction_diagnosis_templates` (platform_intelligence schema), `freebie_friction_results` (stub)

Column additions: `journal_entries.related_plan_id` (UUID, FK → plans)

Existing stubs wired: `tasks.related_plan_id`, `tasks.source = 'project_planner'`, `studio_queue.source = 'project_planner'`

Triggers added: `set_updated_at` on `plans`, `set_updated_at` on `plan_milestones`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Three plan types: goal, project, system** | Each serves a distinct planning need with different data structures (milestones with dates, parallel tracks with dependencies, component blueprints with friction diagnosis). Locked in pre-session. |
| 2 | **LiLa detects plan type from conversation and confirms** | Users think in problems, not plan categories. LiLa's detection + confirmation bridges the gap. Power users can specify directly. Locked in pre-session. |
| 3 | **BigPlans is the final name** | Working title confirmed as permanent. |
| 4 | **Own sidebar page** | Plans are a return-to surface. Burying inside another feature would undermine the "ongoing tracking" promise. |
| 5 | **Plan cards show both progress bar AND tappable milestone checkpoints** | Bar for at-a-glance progress, checkpoints for quick interaction without opening the full detail view. |
| 6 | **Interactive ecosystem map for system-design plans** | Shows users how MyAIM features connect by demonstrating it in the context of their actual problem. "I Go First" philosophy applied to feature discovery. |
| 7 | **Family plans with assigned milestones and tasks** | Family members can both view progress AND be assigned work within a family plan. Mom (and permitted dad) create family plans. |
| 8 | **Friction Detective uses conversational diagnosis, not a rigid questionnaire** | Four-category taxonomy (knowledge, motivation, logistics, capacity) explored through natural follow-up questions. LiLa converges on a diagnosis and names it in plain language. |
| 9 | **System-design output deploys real MyAIM components** | Tasks, sequential collections, routines, Best Intentions, trackers, calendar events, lists. The plan doesn't just describe a system — it builds it. |
| 10 | **Trial period for system-design plans** | Default 14 days. LiLa prompts a review at trial end. Persist / Pause / Pivot framework for iteration. |
| 11 | **Check-ins feed Rhythms & Reflections** | Scheduled check-ins appear as periodic rhythm cards, keeping plans in the natural daily flow. |
| 12 | **Three compile output schemas** | One per plan type. Goal: milestones with dates. Project: tracks with dependencies. System: friction diagnosis + component blueprint. |
| 13 | **Manual plan creation included** | Serves users who know what they want or prefer not to use AI. Buffet principle — AI is recommended, not required. |
| 14 | **BigPlans can generate sequential collections** | Milestones → sequential task collections → individual tasks promoting in order. Uses existing PRD-09A sequential infrastructure. |
| 15 | **Three-tab plan detail: Plan, Journal, Conversations** | Same proven pattern as StewardShip Rigging detail view. |
| 16 | **Goal ecosystem connections at three levels** | Guiding Stars as plan anchors, Best Intentions as plan outputs, LifeLantern as plan source. Plans are woven into the identity/values/assessment ecosystem. |
| 17 | **Freebie funnel stub scope: data model + friction-to-feature mapping only** | Delivery mechanism deferred. Data model supports future onboarding bridge but bridge not built. |
| 18 | **Independent teens get goal and project modes, not system-design** | System-design requires household-level context and parental authority over routines. Goal and project planning builds teen independence. |
| 19 | **Four LiLa guided modes: router + three sub-modes** | Router detects type, sub-modes have specialized prompts and context sources. Clean separation of concerns. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Freebie friction funnel delivery mechanism | Future Marketing PRD or PRD-31 |
| 2 | Freebie → onboarding bridge | PRD-31 (Subscription Tier System) |
| 3 | Earned AI credits for friction diagnosis | PRD-31 (Subscription Tier System) |
| 4 | Parallel track Gantt-style visualization | Post-MVP enhancement |
| 5 | Budget/resource tracking in projects | Post-MVP enhancement |
| 6 | Plan templates in Studio | Post-MVP enhancement |
| 7 | Neurodiversity-specific system design templates | Post-MVP — compose from condensed intelligence principles |
| 8 | Seasonal system transition framework | Post-MVP — individual insights exist but no unified framework |
| 9 | Co-parenting / blended family system design | Post-MVP — minimal coverage in condensed intelligence |
| 10 | Plan sharing between personal plans | Post-MVP enhancement |
| 11 | Ecosystem map as a standalone diagnostic view ("show me all my active systems") | Post-MVP enhancement |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core) | Four new guided modes registered: `bigplans`, `bigplans_goal`, `bigplans_project`, `bigplans_system`. Friction detection intent recognition pattern added. Active plans loaded in context assembly. | Add modes to guided mode registry. Add friction detection to intent recognition patterns. Add active plan summaries to context assembly. |
| PRD-06 (Guiding Stars & Best Intentions) | Plans can link to Guiding Stars via `guiding_star_ids`. BigPlans system-design can create Best Intentions with `source = 'bigplans'`. | Add 'bigplans' to `best_intentions` source values. |
| PRD-08 (Journal + Smart Notepad) | `related_plan_id` column added to `journal_entries`. Notepad "Send to → BigPlans" added as RoutingStrip destination. | Add column to schema. Add BigPlans tile to RoutingStrip destinations. |
| PRD-09A (Tasks) | `source = 'project_planner'` and `related_plan_id` stubs wired. Sequential collections created from BigPlans milestones. | Update stub status to WIRED. |
| PRD-12A (LifeLantern) | "Complex multi-step long-term goal → Project Planner (stub)" now routes to BigPlans. | Update stub reference to point to PRD-29. |
| PRD-17 (Universal Queue) | `source = 'project_planner'` stub wired. BigPlans deposits into `studio_queue`. Add `destination = 'plan'` for Notepad → BigPlans routing. | Update stub status to WIRED. Add 'plan' to destination CHECK values. |
| PRD-18 (Rhythms & Reflections) | BigPlans check-in rhythm cards registered as a periodic rhythm source. | Add BigPlans check-in to periodic card registry. |
| PRD-11 (Victory Recorder) | Plan completion and milestone completion as victory sources. | Add 'plan_completed' and 'milestone_completed' to victory source values. |
| Platform Intelligence Pipeline v2 | Anonymized system design patterns as a capture channel for platform intelligence. | Add BigPlans pattern capture to Stage 1 capture channels. |
| Build Order Source of Truth | PRD-29 completed. | Update completion status and add to Section 2. |

---

*End of PRD-29*
