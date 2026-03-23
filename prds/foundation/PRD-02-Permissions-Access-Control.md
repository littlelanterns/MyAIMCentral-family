# PRD-02: Permissions & Access Control

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup)
**Created:** March 2, 2026
**Last Updated:** March 5, 2026

---

## Overview

This PRD defines the permission engine that controls who can see what across the entire MyAIM Family platform. PRD-01 established the five member roles (Mom/Primary Parent, Dad/Additional Adult, Special Adult, Independent Teen, Guided/Play Child) and the database tables that hold them. PRD-02 builds the system that enforces what each of those roles can actually access, at what granularity, and under what conditions.

The core philosophy is **mom-first architecture.** Mom sees everything about her kids by default — not because this is a surveillance tool, but because MyAIM Family is built for involved, intentional parents who know their kids best. Mom decides what dad can see (per feature, per kid). Mom decides what Special Adults can access (only during active shifts). Mom can grant teens transparent privacy controls, and she can restrict her own visibility when she chooses to. Every other family member's experience flows from decisions mom has made.

This PRD introduces six major systems: the granular permission model with four access levels, the View As mode for mom (and optionally dad) to act as other family members, shift-based access for Special Adults, teen transparency rules, the `PermissionGate` component pattern that every future PRD uses, and the `useCanAccess()` tier-gating hook (replacing the PRD-01 stub that always returned true).

> **Mom experience goal:** Permissions should feel like mom is handing someone a set of keys — she picks exactly which doors each key opens, and she can change her mind anytime. View As should feel like picking up a kid's phone and doing things for them, but without actually needing their phone. Fast, natural, no friction.

---

## User Stories

### Mom — Permission Management
- As mom, I want to control exactly what my husband can see and do for each child so I can share responsibility without losing oversight.
- As mom, I want to set up a babysitter's access in seconds using a preset, then fine-tune individual permissions if I need to.
- As mom, I want to grant my teen private journal space while keeping visibility into their task completion and commonplace entries so I respect their growth while staying informed.
- As mom, I want to restrict my own view of certain features for a specific kid so my teen knows I trust them, and I want them notified when I do.
- As mom, I want to switch between kids quickly in View As mode so I can mark off tasks for Ruthie and then immediately do the same for Avvi without logging in and out.

### Mom — View As Mode
- As mom, I want to tap "View As Ruthie" from my phone and see Ruthie's dashboard with full read/write/edit access so I can mark off her completed tasks, check her charts, and manage her day.
- As mom, I want View As to bypass PINs and authentication since I'm already logged in as mom.
- As mom, I want to unmark a task that a child marked as done (when it wasn't really finished) and have all associated rewards and tracking roll back automatically.
- As mom, I want to decide per-kid and per-feature whether dad also gets View As access.

### Dad — Permission-Based Access
- As dad, I want to see what permissions I have so I know what I can do in the app without guessing.
- As dad, I want my own personal workspace (journal, goals, etc.) that is mine — mom doesn't see it unless I share.
- As dad, I want to be able to mark off tasks for the kids mom has given me access to so I can help manage the household.

### Special Adult — Shift-Based Access
- As a babysitter, I want to tap "Start Shift" and immediately see the tasks, routines, and schedules for the kids I'm watching so I can get to work.
- As a babysitter, when my shift ends, I want to tap "End Shift" and have my access go dark until next time.
- As a grandparent who watches kids every Tuesday, I want my access to automatically activate on my scheduled days so I don't have to remember to start a shift.

### Teen — Transparency
- As a teen, I want to see exactly what mom can view about me and who else has access so I always know what's shared.
- As a teen, I want to be able to share something with the whole family that was previously mom-only (like a victory or goal) so I can involve everyone.
- As a teen, I want to be notified if mom gives herself more access to my content so nothing changes without me knowing.

---

## Screens

### Screen 1: Permission Management Hub (Mom Only)

**What the user sees:**
- Accessible from MyFamily settings area
- Header: "Permissions" with family name
- A card for each family member (excluding mom herself), showing: name, avatar, role badge, and a summary line like "Full access to 4 kids" or "Shift access: Ruthie, Avvi"
- Cards are grouped by role type: Additional Adults first, then Special Adults, then Teens (Independent), then Guided/Play
- Tap any card → navigates to that member's detailed permission screen (Screen 2 or Screen 3 depending on role)

**Interactions:**
- Tap a member card → goes to their permission detail screen
- Quick actions visible on each card: toggle all access on/off (emergency lockout)

**Empty state:** If no additional adults, special adults, or teens exist, show friendly message: "Your family's permission settings will appear here as you add adults and teens." with link to MyFamily to add members.

---

### Screen 2: Dad/Additional Adult Permission Detail

**What the user sees:**
- Header: member name + role badge ("Additional Adult")
- Section 1: **Kids Access** — A list of all kids (non-adult family members) with toggle cards. Each kid card expands to show per-feature permissions.
- Section 2: **View As Access** — Toggle per kid: "Can use View As for [kid name]." When enabled, expandable section to exclude specific features from View As (e.g., uncheck "Period Calendar" for a daughter).
- Section 3: **Personal Features** — Which personal features dad has access to (his own journal, goals, etc.). These are all enabled by default — mom can disable if needed.
- Section 4: **Global Permissions** — Cross-cutting permissions not tied to a specific kid: "Can create paid jobs for kids," "Can approve task completion," "Can award reward points."

**Per-kid feature permissions (expanded view):**
Each kid's expanded card shows a list of feature categories. For each feature, mom sets one of four access levels:

| Level | Label | What It Means |
|-------|-------|--------------|
| None | "No Access" | Feature is invisible to dad for this kid |
| View | "Can View" | Read-only access |
| Contribute | "Can Add & Complete" | Can add new items, mark things complete. Cannot edit or delete mom's items. Can delete items he created. |
| Manage | "Full Access" | Can add, edit, delete (including mom's items). Essentially mom-level for this feature for this kid. |

> **Decision rationale:** Four levels (not three, not five) because real family scenarios require distinguishing "can see" from "can help" from "can run it." The Contribute level exists specifically so dad can mark tasks complete and add paid jobs without being able to edit or delete mom's content.

**Feature categories available for per-kid permissions:**
Tasks & Chores, Routines, Lists, Charts & Trackers, Goals, Journal/Log (viewable entries only — never edit), Calendar, Rewards & Points, Best Intentions, Opportunities/Paid Jobs, LifeLantern, Archives

**Preset buttons** at the top of each kid's section:
- "Full Partner" — sets everything to Manage
- "Active Helper" — sets most to Contribute, Journal to View, Archives to None
- "Observer" — sets everything to View
- "Custom" — start from current state, adjust individually

**Interactions:**
- Toggle a kid's master switch → enables/disables all access for that kid at once
- Expand a kid → see feature-by-feature controls
- Tap a preset → applies that preset's access levels (confirmable, not instant)
- Tap a feature's access level → cycles through None → View → Contribute → Manage
- View As toggles are per-kid, with sub-feature exclusions available on expand

**Data created/updated:**
- `member_permissions` records (one per dad-kid-feature combination)
- `view_as_permissions` records (one per dad-kid combination, with feature exclusions JSONB)

---

### Screen 3: Special Adult Permission Detail

**What the user sees:**
- Header: member name + custom role label (e.g., "Linda — Grandparent")
- Section 1: **Assigned Kids** — Which kids this person can access. Toggle per kid. (This modifies `special_adult_assignments` from PRD-01.)
- Section 2: **Access Type** — What they can see/do for assigned kids. Uses same feature category list but with a reduced set appropriate for caregivers: Tasks & Routines, Trackable Events, Opportunities/Jobs, Notes & Instructions, Shift Notes.
- Section 3: **Shift Settings** — Manual start/end (always available), plus optional recurring schedule.
- Section 4: **Report Settings** — When shift summary is compiled: per-kid or combined. Time scope options: per shift, daily, weekly, monthly.

**Shift Schedule Configuration:**
- "Manual only" (default) — caregiver taps Start/End Shift
- "Scheduled" — mom sets recurring days/times (e.g., "Tuesdays 3:00 PM – 6:00 PM"). Access auto-activates and auto-deactivates. Manual override always available (start early, end late).
- Mom can end any active shift remotely from her Permission Hub

> **Decision rationale:** Shift-based access (vs. always-on) exists because caregivers should only see kid data while actively caring for the kids. Mom doesn't want the babysitter browsing her daughter's task history at 11 PM on a Thursday. This also creates a natural audit trail of who was "on duty" when.

**Preset bundles for Special Adults:**
- **Babysitter** — Tasks & Routines (Contribute), Trackable Events (Contribute), Opportunities (View), Notes (View), Shift Notes (Contribute)
- **Grandparent** — Tasks & Routines (Contribute), Trackable Events (Contribute), Opportunities (View), Notes (View), Shift Notes (Contribute) — same as babysitter by default but mom can expand
- **Tutor/Therapist** — Specific trackable categories only (Contribute), Notes (View), Shift Notes (Contribute)
- **Custom** — mom picks everything

**Data created/updated:**
- `special_adult_assignments` records (kid assignments)
- `special_adult_permissions` records (feature access per assignment)
- `shift_schedules` records (recurring schedule)
- `shift_sessions` records (active/historical shifts)

---

### Screen 4: Teen Transparency Panel (Visible to Teen)

**What the user sees:**
- Accessible from the teen's own Settings
- Header: "What's Shared" or "My Privacy Settings"
- A clear, readable list showing every feature category and its current sharing status:
  - "Mom can see: ✓" / "Mom can see: ✗ (you turned this off)" — wait, teens can't turn things off that mom has on. Correct display:
  - "Mom can see: ✓" — mom has access
  - "Mom can see: ✗" — mom has chosen not to see this (mom restricted herself)
  - "Dad can see: ✓" — mom has granted dad access
  - "Family can see: ✓" — teen has shared this with family
- For each item, an indicator of who set the current state (mom or teen)
- A "Share with Family" action on items that are currently mom-only — teen can upgrade visibility but never downgrade below what mom has set

**Interactions:**
- Tap a feature → see details of what's shared and with whom
- "Share with Family" button on eligible items → upgrades visibility from `mom_only` to `family` (teen can do this without mom's approval)
- "Share with Dad" button → upgrades from `mom_only` to `both_parents` (if mom has configured dad to be eligible to receive this)
- No "Make Private" option on items mom has set to be visible — teen cannot restrict more than mom allows
- If mom has granted the teen a private area (e.g., private journal tag), that area shows as "Private — only you can see this"

**Notification behavior:**
- When mom INCREASES her own visibility (gives herself more access to teen's content): teen receives a notification: "[Feature] is now visible to Mom"
- When mom DECREASES her own visibility (restricts herself): no notification, just reflected in the panel
- When mom changes dad's access to teen's content: reflected in panel, no push notification

---

### Screen 5: View As Mode (Mom's Experience)

**What the user sees:**
- Accessible from: a persistent "View As" button/icon in mom's navigation (maybe in the family member quick-switcher area)
- Tap "View As" → shows a grid of family members mom can act as (all kids by default, plus any adults she's granted View As to)
- Selecting a member → the entire UI transforms to show that member's dashboard experience
- A persistent banner at the top: "Viewing as [Name] — [role badge]" with a button to switch member or exit View As
- Everything mom has permission to see for that member is visible and interactive (read/write/edit)
- Features mom has restricted herself from seeing are hidden (even in View As)

**Interactions:**
- Mark tasks complete/incomplete — actions are logged as the viewed member (e.g., "Ruthie completed task X")
- If mom unmarks a task, all associated rewards, points, and tracking entries roll back
- Edit charts, trackers, routines — all changes apply to the member's data
- Switch to another member → tap the banner → member grid appears → select new member (no re-authentication)
- Exit View As → return to mom's own dashboard
- No PIN prompts, no authentication barriers — mom is already authenticated

**What View As does NOT allow:**
- Changing the member's password or PIN (go to MyFamily settings for that)
- Modifying the member's own permission/transparency settings (go to Permission Hub for that)
- Accessing features mom has restricted herself from seeing for this member

**Data created/updated:**
- All data modifications are attributed to the viewed member (no separate audit trail — if it's marked done anywhere, it's marked done everywhere)

> **Decision rationale:** View As is read/write/edit (not read-only preview) because the primary use case is mom managing her kids' day from her own phone — marking off tasks for Ruthie, then switching to Avvi, without logging in and out. Actions log as the viewed member because the system tracks task completion, not who tapped the button. This is the simplest model and avoids confusing "completed by proxy" states in rewards/tracking.

---

### Screen 6: Special Adult Shift View

**What the user sees:**
- When a Special Adult logs in outside of an active shift: they see a clean screen with their name, assigned kids' names, and a prominent "Start Shift" button. No kid data is visible.
- If they have a scheduled shift that hasn't started yet: "Your next shift starts at [time] on [day]. You can start early if needed." with the Start Shift button.
- During an active shift: they see the kids assigned to them with the features mom has permitted. A persistent banner shows "On Shift — started [time]" with an "End Shift" button.
- During an active shift: a [Log Activity] button is visible. Tapping it opens a simple form (description text + optional photo). Creates an `activity_log_entries` record with `source = 'special_adult_shift'`. Mom sees these in the shift summary and can optionally promote them to victories.
- After ending a shift: "Shift ended. Would you like to compile a shift summary?" with option to compile notes and events into a report.

**Shift compilation:**
- AI compiles everything logged during the shift: tasks marked complete, trackable events recorded, notes added
- Output is a readable summary organized by kid (if multiple) or by time
- Caregiver can review, edit, and copy/paste the summary
- Summary is saved and visible to mom in the Shift History

**Mom's shift visibility:**
- Mom sees a "Shift Log" in the Permission Hub showing all past shifts: who, when, duration
- Mom can view compiled summaries from each shift
- Mom can see when a Special Adult starts/ends shifts in real-time (visible in Permission Hub, not a push notification unless she configures one)
- If a shift has been active for an unusual duration (e.g., past the scheduled end time by 2+ hours), mom sees a gentle indicator

---

## Visibility & Permissions

This PRD IS the visibility and permissions system — it defines the model that every other PRD references. Here's the consolidated role access table for the permission system itself:

| Role | Access to Permission System | Notes |
|------|---------------------------|-------|
| Mom / Primary Parent | Full | Creates, modifies, and deletes all permissions. Can restrict own visibility. View As with full read/write/edit. |
| Dad / Additional Adult | Read Own | Can see what permissions he has. Cannot see what he doesn't have access to (subject to UX decision). Cannot modify anyone's permissions. |
| Special Adult | Shift-Scoped | Sees assigned kids' data only during active shifts. Sees own shift history. Cannot modify permissions. |
| Independent (Teen) | Read Own + Share Up | Can see full transparency panel. Can share items up (mom_only → family). Cannot restrict below mom's settings. |
| Guided / Play | None | No awareness of permission system. Mom controls everything. |

### Shell Behavior
- **Mom Shell:** Permission Hub accessible from MyFamily/Settings. View As accessible from main navigation.
- **Adult Shell:** "My Permissions" link in Settings showing what features/kids are accessible (read-only).
- **Independent Shell:** "What's Shared" panel in Settings.
- **Guided/Play Shell:** No permission UI.
- **Special Adult Shell:** Start/End Shift is the primary interface. No permission configuration.

### Privacy & Transparency

**Teen transparency rules:**
1. Teen can see ALL of their privacy settings at all times (full transparency)
2. Teen can share MORE (upgrade `mom_only` → `both_parents` or `family`)
3. Teen CANNOT restrict more than mom has set (cannot downgrade `both_parents` → `mom_only`)
4. When mom increases her own visibility into teen's content → teen is notified
5. When mom decreases her own visibility → no notification, reflected in panel
6. Mom can grant per-feature, per-tag privacy areas (e.g., "private journal" tag that mom cannot see)

> **Decision rationale:** Teens can share UP but not restrict DOWN because MyAIM Family serves parents, not teens. This isn't a teen social app — it's a tool for involved moms. Teens always know what's shared (full transparency), and mom can grant privacy when she decides her kid is ready. The notification on visibility increase ensures nothing changes behind the teen's back.

**Dad privacy:**
1. Dad's personal content (his own journal, goals, etc.) is HIS — mom does not see it by default
2. Dad can choose to share his personal content with mom or family (opt-in)
3. Mom controls what dad can see about the KIDS, not dad's own personal workspace
4. Mom controls which personal features dad has access to (can disable features entirely)
5. Dad can see what permissions he has; whether he sees what he DOESN'T have is a UX decision deferred to design

> **Decision rationale:** "Mom sees all" applies to KIDS, not to dad. Dad is an adult partner, not a managed account. Mom controls what dad sees about the kids and which features dad has access to, but dad's own journal entries, goals, and personal workspace are his. This respects the spousal relationship while maintaining mom-first architecture for parenting.

> **Deferred:** Whether dad can see features he DOESN'T have access to (greyed out vs. hidden) — to be resolved in design/UX sprint, not a PRD-level decision.

### Journal Visibility Settings

> **Depends on:** `journal_visibility_settings` table — defined in PRD-08 (Journal + Smart Notepad).

Mom configures which journal entry types are visible per child in Family Settings. This uses the `journal_visibility_settings` table (defined in PRD-08) with per-entry-type, per-child granularity.

Default visibility varies by entry type:
- **Visible by default** (required for family sharing / educational tracking): reflection, commonplace, kid_quips
- **Private by default**: journal_entry, gratitude, quick_note, meeting_notes, brain_dump, custom

Teens can share entries within private categories (increase disclosure) but cannot hide entries within visible categories (increase privacy). This follows the existing teen permission principle: can share UP, cannot restrict DOWN.

---

## Data Schema

### Table: `member_permissions`

This is the core permission table. One record per (grantor, grantee, target_member, feature) combination. Primarily used for dad's per-kid-per-feature permissions, but architecturally supports any member-to-member permission grant.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| granted_by | UUID | | NOT NULL | FK → family_members (the person who set this permission — typically mom) |
| granted_to | UUID | | NOT NULL | FK → family_members (the person receiving access — typically dad) |
| target_member_id | UUID | | NOT NULL | FK → family_members (the kid whose data is being accessed) |
| feature_key | TEXT | | NOT NULL | Feature category identifier (e.g., 'tasks', 'routines', 'charts', 'journal', 'calendar', 'rewards', 'best_intentions', 'opportunities', 'lifelantern', 'archives', 'lists', 'goals') |
| access_level | TEXT | 'none' | NOT NULL | Enum: 'none', 'view', 'contribute', 'manage' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD all records in their family. Grantee can read their own records (where `granted_to = current_member_id`). No other roles can access.

**Indexes:**
- `(family_id, granted_to)` — "what can this person access?"
- `(family_id, granted_to, target_member_id)` — "what can this person access for this specific kid?"
- `(family_id, target_member_id, feature_key)` — "who has access to this kid's feature?"
- Unique constraint on `(family_id, granted_to, target_member_id, feature_key)`

---

### Table: `view_as_permissions`

Controls who can use View As for which members, and any feature-level exclusions within View As.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| viewer_id | UUID | | NOT NULL | FK → family_members (person using View As — mom or dad) |
| target_member_id | UUID | | NOT NULL | FK → family_members (person being viewed as) |
| enabled | BOOLEAN | true | NOT NULL | Master toggle for this View As pair |
| excluded_features | JSONB | '[]' | NOT NULL | Array of feature_keys excluded from View As (e.g., ["period_calendar"]) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD all records. Viewer can read their own records. Mom always has implicit View As for all members (record optional — absence means full access).

**Indexes:**
- `(family_id, viewer_id)` — "who can this person View As?"
- Unique constraint on `(family_id, viewer_id, target_member_id)`

**Note:** Mom's View As records are optional. If no `view_as_permissions` record exists for mom + a kid, mom has full View As access by default. Records are only created when mom wants to EXCLUDE specific features from her own View As (self-restriction). Dad's View As records must explicitly exist and be enabled.

---

### Table: `mom_self_restrictions`

Tracks features/content categories mom has chosen NOT to see for specific kids. This is the "mom restricts herself" mechanism.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| primary_parent_id | UUID | | NOT NULL | FK → family_members (mom) |
| target_member_id | UUID | | NOT NULL | FK → family_members (the kid) |
| feature_key | TEXT | | NOT NULL | Feature being restricted (e.g., 'journal') |
| restriction_type | TEXT | 'full' | NOT NULL | Enum: 'full' (entire feature hidden), 'tag' (specific tags/categories hidden) |
| restricted_tags | TEXT[] | '{}' | NOT NULL | If restriction_type = 'tag', which tags are hidden (e.g., ['private_diary']) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD their own restrictions. Target member (teen) can read restrictions affecting them (for transparency panel). No other roles can access.

**Indexes:**
- `(family_id, target_member_id)` — "what has mom restricted for this kid?"
- `(family_id, target_member_id, feature_key)` — specific feature lookup
- Unique constraint on `(family_id, primary_parent_id, target_member_id, feature_key)`

**Notification trigger:** When a record is DELETED (mom removes a restriction = increases her visibility), a notification is generated for the target member if they are in Independent mode.

---

### Table: `special_adult_permissions`

Per-assignment, per-feature access for Special Adults. Extends `special_adult_assignments` from PRD-01.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| assignment_id | UUID | | NOT NULL | FK → special_adult_assignments |
| feature_key | TEXT | | NOT NULL | Feature category (e.g., 'tasks_routines', 'trackable_events', 'opportunities', 'notes_instructions', 'shift_notes') |
| access_level | TEXT | 'none' | NOT NULL | Enum: 'none', 'view', 'contribute' (Special Adults never get 'manage') |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

> **Forward note:** Special Adults are capped at 'contribute' (never 'manage') at launch. If future use cases require a caregiver with full edit/delete access (e.g., a live-in nanny who functions as a co-parent), the enum can be extended without schema changes.
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD. Special adult can read their own records (joined through assignment_id → special_adult_assignments where special_adult_id = current_member). Only readable during active shift (enforced at application layer, not RLS — RLS checks family membership, app layer checks shift status).

**Indexes:**
- `assignment_id` — "what can this caregiver do for this kid?"
- Unique constraint on `(assignment_id, feature_key)`

---

### Table: `shift_sessions`

Tracks Special Adult shift start/end times and status.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| special_adult_id | UUID | | NOT NULL | FK → family_members |
| started_at | TIMESTAMPTZ | now() | NOT NULL | When the shift began |
| ended_at | TIMESTAMPTZ | null | NULL | When the shift ended. Null = currently active. |
| started_by | TEXT | 'manual' | NOT NULL | Enum: 'manual' (caregiver tapped Start), 'scheduled' (auto-started from schedule), 'mom' (mom started remotely) |
| ended_by | TEXT | null | NULL | Enum: 'manual', 'scheduled', 'mom'. Null if still active. |
| summary_compiled | BOOLEAN | false | NOT NULL | Whether a shift summary has been generated |
| summary_text | TEXT | null | NULL | The compiled shift summary content |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Primary parent can read all shifts in their family and can update (to end shifts remotely). Special adult can CRUD their own shifts. No other roles can access.

**Indexes:**
- `(family_id, special_adult_id)` — "all shifts for this caregiver"
- `(special_adult_id, ended_at)` — "find active shift" (where ended_at IS NULL)
- `(family_id, started_at)` — chronological shift history

---

### Table: `shift_schedules`

Recurring shift schedules for Special Adults.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| special_adult_id | UUID | | NOT NULL | FK → family_members |
| day_of_week | INTEGER | | NOT NULL | 0=Sunday, 1=Monday, ..., 6=Saturday |
| start_time | TIME | | NOT NULL | When shift auto-starts (e.g., '15:00:00') |
| end_time | TIME | | NOT NULL | When shift auto-ends (e.g., '18:00:00') |
| is_active | BOOLEAN | true | NOT NULL | Whether this schedule is currently active |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD. Special adult can read their own schedules.

**Indexes:**
- `(special_adult_id, is_active)` — "active schedules for this caregiver"
- `(day_of_week, is_active)` — "who has shifts today?" (for auto-start cron)

---

### Table: `teen_sharing_overrides`

Tracks when a teen has upgraded an item's visibility beyond the default (e.g., shared a victory with the whole family).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members (the teen) |
| feature_key | TEXT | | NOT NULL | Which feature the item belongs to |
| resource_id | UUID | | NOT NULL | The specific item being shared (FK to the feature's table) |
| original_visibility | TEXT | | NOT NULL | What it was before teen shared it |
| new_visibility | TEXT | | NOT NULL | What the teen changed it to (e.g., 'family', 'both_parents') |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Teen can CRUD their own overrides. Primary parent can read all overrides in their family. No other roles can access.

**Indexes:**
- `(member_id, feature_key)` — "what has this teen shared?"
- `(resource_id)` — "is this specific item shared beyond default?"

---

### Table: `permission_presets`

Stores mom's saved custom permission presets for reuse across multiple members.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members (mom) |
| preset_name | TEXT | | NOT NULL | Display name (e.g., "Homework Helper") |
| target_role | TEXT | | NOT NULL | Enum: 'additional_adult', 'special_adult' — which role type this preset is for |
| permissions_config | JSONB | | NOT NULL | Full permissions snapshot: `{ "tasks": "contribute", "routines": "view", ... }` |
| is_system_preset | BOOLEAN | false | NOT NULL | True for built-in presets (Full Partner, Active Helper, Observer, Babysitter, Grandparent, Tutor). Cannot be deleted. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Primary parent can CRUD their own presets. System presets are read-only for all.

**Indexes:**
- `(family_id, target_role)` — "presets for this role type"

---

### Enum/Type Updates

Additions to existing enums from PRD-01:

- **New enum `access_level`:** 'none', 'view', 'contribute', 'manage'
- **New enum `shift_trigger`:** 'manual', 'scheduled', 'mom'
- **New enum `restriction_type`:** 'full', 'tag'
- **New enum `preset_target_role`:** 'additional_adult', 'special_adult'

---

## The Permission Engine — How It All Works Together

> **Depends on:** `family_members.role` and `family_members.dashboard_mode` columns — defined in PRD-01, Data Schema section.

### Permission Resolution Order

When any part of the app needs to determine "can this person see/do this thing?", the permission engine resolves in this order:

1. **Is the user the primary parent (mom)?**
   - Yes → Check `mom_self_restrictions`. If no restriction exists for this feature + target member, ALLOW. If a restriction exists, DENY (mom has restricted herself).
   - Proceed to step 2 only for non-mom users.

2. **Is the user an additional adult (dad)?**
   - Check `member_permissions` for `(granted_to=dad, target_member_id=kid, feature_key=feature)`.
   - If no record exists → DENY (default deny for dad).
   - If record exists → return the `access_level` (none/view/contribute/manage).

3. **Is the user a Special Adult?**
   - Check if there is an active shift (`shift_sessions` where `special_adult_id=user` AND `ended_at IS NULL`).
   - If no active shift → DENY everything (access is dark).
   - If active shift → check `special_adult_permissions` via `special_adult_assignments` for the target kid + feature.
   - Return access_level if permitted, DENY if not.

4. **Is the user accessing their own data?**
   - Members always have full access to their own data for features available in their shell.
   - Exception: features mom has not enabled for their dashboard_mode (handled by shell routing, PRD-04).

5. **Default → DENY.**

### Visibility Resolution for Content Items

Every member-scoped data item in the system has an effective visibility determined by:

1. **Base visibility** — set by the content creator:
   - `mom_only` (default for most personal content)
   - `both_parents` (mom + dad can see it)
   - `family` (everyone in the family can see it)
   - `private_flagged` (teen's private area — mom gets notification but not content, unless mom has not granted this privacy)

2. **Teen sharing overrides** — if a teen has upgraded an item's visibility, the `teen_sharing_overrides` table records the change. The effective visibility is the HIGHER of the base visibility and the teen's override.

3. **Mom self-restrictions** — if mom has restricted herself from seeing a feature or tag for a specific kid, items matching that restriction are hidden from mom even though she would normally have access.

4. **Permission-based filtering** — dad sees items only where his `member_permissions` grant at least `view` access for that feature + kid. Special Adults see items only during active shifts where their `special_adult_permissions` grant access.

### Feature Key Registry

Every PRD that introduces member-scoped features must register its feature keys for the permission system. PRD-02 establishes the initial registry:

| Feature Key | Display Name | Available For | Notes |
|-------------|-------------|---------------|-------|
| `tasks` | Tasks & Chores | Additional Adult, Special Adult | Includes daily tasks, recurring tasks, assigned tasks. Dad can create tasks for himself always; can create/assign to kids only with contribute or manage access. Cannot assign tasks to mom (use Task Requests instead). |
| `routines` | Routines | Additional Adult, Special Adult | Daily routines, schedules |
| `lists` | Lists | Additional Adult | Shared and personal lists |
| `charts` | Charts & Trackers | Additional Adult, Special Adult (as 'trackable_events') | Custom trackers, progress charts |
| `goals` | Goals | Additional Adult | Personal and shared goals |
| `journal` | Journal / Log | Additional Adult (View only max) | Journal entries, commonplace. Never 'manage' for non-owner. |
| `calendar` | Calendar | Additional Adult, Special Adult | Events, scheduling |
| `rewards` | Rewards & Points | Additional Adult | Point awards, reward redemption |
| `best_intentions` | Best Intentions | Additional Adult | Intention tracking |
| `opportunities` | Opportunities / Paid Jobs | Additional Adult, Special Adult | Job/opportunity board interaction |
| `lifelantern` | LifeLantern | Additional Adult | Life assessment and visioning |
| `archives` | Archives | Additional Adult | Document storage, context items |
| `studio_access` | Studio | Additional Adult (default), Independent Teen (Full Magic, mom-permissioned) | Template browsing and customization. Teens require Full Magic tier + mom permission. |
| `tasks_routines` | Tasks & Routines | Special Adult | Combined tasks+routines for simpler caregiver view |
| `trackable_events` | Trackable Events | Special Adult | Custom tracking categories (toileting, hand washing, ISP goals, etc.) |
| `notes_instructions` | Notes & Instructions | Special Adult | Mom's notes attached to kids/tasks |
| `shift_notes` | Shift Notes | Special Adult | Caregiver's own shift observations |

Future PRDs add to this registry by including their feature keys in their "Tier Gating" or "Visibility & Permissions" sections.

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-01: Family Setup | When mom adds a member with role 'additional_adult', system creates default `member_permissions` records (all 'none' — mom must explicitly grant). When adding 'special_adult', system creates `special_adult_assignments` (PRD-01) but no permissions until mom configures in Permission Hub. |
| PRD-01: Member roles | `role` and `dashboard_mode` from `family_members` table drive which permission checks apply. |
| PRD-01: `useCanAccess()` stub | PRD-02 wires this stub to the real tier-gating logic. |
| Mom's Permission Hub | All permission CRUD flows through Screen 1-3 in this PRD. |
| Teen's Transparency Panel | Teen sharing overrides flow through Screen 4. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Every future PRD | All features use `PermissionGate` component and/or `usePermission()` hook to check access before rendering. |
| Shell Routing (PRD-04) | Shell layout uses permission data to show/hide navigation items. |
| Every data query | RLS policies on all member-scoped tables reference the permission engine to filter data. |
| Notification system | Mom self-restriction deletions trigger teen notifications. Shift auto-start triggers caregiver notifications. |
| Reward/Tracking systems | Task unmark in View As triggers reward rollback across all connected systems. |

---

## AI Integration

### Shift Summary Compilation

When a Special Adult ends a shift, they can optionally compile a shift summary using AI.

**Context loaded:**
- All actions taken during the shift (tasks marked, trackable events logged, notes added)
- The kids involved and their names
- Time range of the shift
- Any shift notes the caregiver entered

**AI behavior:**
- Organize events chronologically or by kid (depending on report settings)
- Use a warm, professional tone appropriate for parent-caregiver communication
- Highlight anything notable (unusual patterns, missed items, special notes)
- Keep it concise — this is a handoff report, not a novel

**Output:** A readable text summary that the caregiver can review, edit, and save. Mom sees it in Shift History.

---

## Edge Cases

### Dad Has No Permissions Yet
- If mom hasn't configured any permissions for dad, his dashboard shows only his personal features (journal, goals, etc.) with no kid-related content.
- A friendly message: "Your family permissions will appear here once [mom's name] sets them up."
- Dad does NOT see a list of things he doesn't have access to.

### Special Adult Forgets to End Shift
- If a scheduled shift passes its end time by more than 30 minutes with no manual end, the system auto-ends the shift.
- If a manual shift has been active for more than 12 hours, mom sees a gentle indicator in her Permission Hub. The shift remains active until manually ended (by caregiver or mom).
- Mom can always end any shift remotely.

### Mom Removes a Self-Restriction (Increases Her Visibility)
- The restriction record is deleted from `mom_self_restrictions`.
- If the target member is in Independent mode, a notification is generated: "[Feature] is now visible to Mom."
- The notification is informational, not a request for approval — mom's decision is final.

### Teen Tries to Share Something to Dad Who Doesn't Have Access
- If teen tries to change visibility to `both_parents` but dad has no `member_permissions` record for that feature for that kid, the share still succeeds — the visibility level is stored, but dad won't see it until mom grants him access to that feature.
- This avoids a confusing error for the teen while keeping mom in control.

### Multiple Special Adults on Overlapping Shifts
- Each Special Adult has their own independent shift session. Overlapping is fine.
- Each sees only the kids assigned to them, regardless of who else is on shift.
- Shift summaries are per-caregiver, not combined.

### View As — Unmark Task with Cascading Rewards
- When mom uses View As to unmark a task as incomplete, the system must cascade: remove any reward points awarded for that task, reverse any streak updates, adjust any chart/tracker data that was incremented on completion.
- This cascade is handled by the task/reward system (PRD-09/PRD-30), but PRD-02 establishes the principle: **unmark anywhere = unmark everywhere, with full cascade.**

### Founding Family Subscription Lapse
- If a founding family cancels and later resubscribes, founding rates are LOST. The `is_founding_family` flag is cleared on cancellation.
- This is tracked on `family_subscriptions.is_founding_family` and `families.is_founding_family` (both must be cleared).

### Large Family Permission Matrix
- For a family with 9 kids and 2 adults, the permission matrix could have 9 × 12 feature categories × 2 adults = 216 permission records.
- The UI handles this with presets and bulk actions — not by displaying 216 toggles at once.
- Per-kid expansion keeps the UI manageable.

### Task Requests (Cross-Cutting)

> **Depends on:** Studio Queue — defined in PRD-09B.

Any family member (Dad, Teen, Guided if mom permits) can send a Task Request to Mom or Dad. The request arrives in the parent's Studio Queue with `source = 'member_request'` and `requester_id`. The parent can accept (configure and save), decline (with optional note back), or modify and accept. Task Requests are NOT governed by the per-feature permission model — any connected family member can request. The parent decides what to do with it.

> **Decision rationale:** Task Requests bypass the normal permission model because requesting is not the same as creating. A teen asking "can we do X?" shouldn't require task-creation permissions. The parent retains full control over whether the request becomes a real task.

---

## Tier Gating

PRD-02 introduces the following `useCanAccess()` feature keys:

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `granular_permissions` | Per-feature, per-kid permission control for additional adults | Enhanced |
| `view_as_mode` | View As mode for mom (and dad if granted) | Enhanced |
| `special_adult_shifts` | Shift-based access and shift summaries for caregivers | Enhanced |
| `shift_scheduling` | Recurring shift schedules for Special Adults | FullMagic |
| `custom_permission_presets` | Mom can save custom permission presets | FullMagic |
| `teen_transparency_panel` | Teen's "What's Shared" settings panel | Enhanced |
| `mom_self_restrictions` | Mom can restrict her own visibility per kid per feature | Enhanced |

**`useCanAccess()` implementation notes:**
- During beta, all return `true`.
- The hook checks `feature_access` table via the family's `family_subscriptions.tier_id`.
- It also checks `families.is_founding_family` — founding families get all features regardless of tier as long as subscription is active.
- `useCanAccess()` is ONLY for tier gating. Role-based permissions use `usePermission()` (new hook from this PRD) and `PermissionGate` component.

> **Decision rationale:** Tier gating (`useCanAccess`) and role-based permissions (`usePermission`) are deliberately separate hooks because they answer different questions. "Can your subscription do this?" is independent of "does your role allow this for this member?" Combining them would create a confusing API and make it harder to reason about why something is denied.

> **Tier rationale:** Most permission features are Enhanced tier because they require connected family members (which is an Enhanced feature from PRD-01). Shift scheduling and custom presets are FullMagic because they're power-user conveniences, not core functionality. Manual shift start/end is Enhanced.

### `useCanAccess()` Full Implementation

```
useCanAccess(featureKey: string): boolean

1. Get current user's family_id from auth context
2. Get family's subscription tier from family_subscriptions
3. Check families.is_founding_family — if true AND subscription status = 'active', return true
4. Look up feature_access record for (tier_id, featureKey)
5. Return feature_access.enabled
6. If no record found, return false (deny by default)
```

### `usePermission()` Hook (New)

```
usePermission(action: string, targetMemberId?: string, featureKey?: string): { 
  allowed: boolean, 
  level: 'none' | 'view' | 'contribute' | 'manage' 
}

Follows the Permission Resolution Order defined above.
```

### `PermissionGate` Component Pattern

```
<PermissionGate 
  action="view_dashboard" 
  targetMemberId={kidId} 
  featureKey="tasks"
  fallback={<NoAccessMessage />}
>
  <TaskList memberId={kidId} />
</PermissionGate>
```

Every future PRD wraps member-scoped UI in `PermissionGate`. If the current user doesn't have access, the `fallback` renders instead (or nothing).

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Shift summary AI compilation | LiLa API for summary generation | PRD-05 (LiLa Core) |
| Task unmark cascade (reward rollback) | Reward and tracking system rollback | PRD-09 (Tasks), PRD-30 (Rewards) |
| Notification delivery for teen transparency changes | Notification system | PRD-Notifications (TBD) |
| Scheduled shift auto-start/end cron job | Background job system | Infrastructure (no PRD — build prompt task) |
| Feature key registry expansion | Each future PRD adds its feature keys | All future PRDs |
| Tag-level restriction (restricted_tags on mom_self_restrictions) | Journal/content tagging system | PRD-08 (Journal) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Permission check placeholder (`useCanAccess` returns true) | PRD-01 | Wired to real tier-gating logic via `feature_access` table lookup + founding family check |
| Special Adult "what they can see" scoping | PRD-01 | Wired via `special_adult_permissions` + `shift_sessions` tables |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `member_permissions` table created with CRUD operations for primary parent
- [ ] `view_as_permissions` table created with CRUD for primary parent
- [ ] `mom_self_restrictions` table created with CRUD for primary parent
- [ ] `special_adult_permissions` table created with CRUD for primary parent
- [ ] `shift_sessions` table created — start/end shift flow works
- [ ] `teen_sharing_overrides` table created
- [ ] `permission_presets` table created with system presets seeded (Full Partner, Active Helper, Observer, Babysitter, Grandparent, Tutor)
- [ ] Permission Hub screen (Screen 1) renders all family members with permission summaries
- [ ] Dad/Additional Adult permission detail screen (Screen 2) with per-kid, per-feature controls
- [ ] Four access levels working: none, view, contribute, manage
- [ ] Preset application works (tap preset → permissions applied to all features for that kid)
- [ ] Special Adult permission detail screen (Screen 3) with assigned kids and feature access
- [ ] Special Adult shift flow: Start Shift → access opens → End Shift → access closes
- [ ] Special Adult sees nothing outside of active shift
- [ ] Mom can end any shift remotely
- [ ] View As mode: mom can select any family member and interact as them with full read/write/edit
- [ ] View As bypasses PINs and authentication
- [ ] View As member switching works without re-authentication
- [ ] Task unmark in View As works (cascade to rewards deferred to PRD-09/30, but unmark itself works)
- [ ] Teen Transparency Panel shows current sharing status for all features
- [ ] Teen can share items up (mom_only → family) from transparency panel
- [ ] Teen cannot restrict below mom's settings
- [ ] `useCanAccess()` wired to real tier-gating logic (still returns true during beta)
- [ ] `useCanAccess()` checks founding family status
- [ ] `usePermission()` hook implements full Permission Resolution Order
- [ ] `PermissionGate` component wraps member-scoped UI with fallback rendering
- [ ] RLS policies on all PRD-02 tables enforce family-scoped access
- [ ] All permission changes take effect immediately (no cache delay)
- [ ] Dad sees only what he has permission to, nothing more

### MVP When Dependency Is Ready
- [ ] Shift summary AI compilation (requires PRD-05 LiLa Core)
- [ ] Task unmark reward cascade (requires PRD-09 Tasks + PRD-30 Rewards)
- [ ] Teen notification on mom visibility increase (requires Notification system)
- [ ] Tag-level self-restriction (requires PRD-08 Journal tagging system)
- [ ] Shell-aware permission gating in navigation (requires PRD-04 Shell Routing)

### Post-MVP
- [ ] `shift_schedules` table and recurring auto-start/end shift functionality
- [ ] Custom permission presets (mom creates and saves her own)
- [ ] Permission change audit log (who changed what, when)
- [ ] Dad visibility toggle: show/hide features he doesn't have access to (UX experiment)
- [ ] Bulk permission apply: apply one kid's permission set to multiple kids at once
- [ ] Permission templates shareable between families (future Creator tier feature)

> **Deferred:** Shift scheduling (recurring auto-start/end) — to be resolved as MVP stretch goal or early post-MVP. Infrastructure is ready (table defined), just needs cron job implementation.

> **Deferred:** Permission audit log — to be resolved in a future observability/admin PRD. Schema supports it (updated_at timestamps exist), but dedicated audit table is post-MVP.

> **Deferred:** Bulk permission apply (copy one kid's permissions to siblings) — to be resolved in UX sprint. Common scenario for large families but needs careful UI to avoid accidental overwrites.

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Mom sees all kids' content by default. Dad default is DENY — must be explicitly granted. Special Adults default is DENY outside of shifts.
- [ ] Convention: Four access levels for permissions: none, view, contribute, manage
- [ ] Convention: Every member-scoped UI must be wrapped in `PermissionGate` component
- [ ] Convention: `useCanAccess(featureKey)` is for TIER gating only. `usePermission(action, targetMemberId, featureKey)` is for ROLE-BASED access.
- [ ] Convention: View As mode logs all actions as the viewed member (no separate audit trail)
- [ ] Convention: Unmark anywhere = unmark everywhere. All associated rewards/tracking cascade.
- [ ] Convention: Special Adults have zero access outside active shifts. Shift status is checked on every data request.
- [ ] Convention: Teen transparency — teens can share UP (increase visibility) but never restrict DOWN (decrease below mom's settings)
- [ ] Convention: When mom increases her own visibility into teen's content → teen is notified. When mom decreases → no notification, reflected in panel.
- [ ] Convention: Dad's personal content is HIS. Mom controls what dad sees about KIDS, not dad's own workspace.
- [ ] Convention: All new feature PRDs must register feature keys in the Feature Key Registry for the permission system.
- [ ] Convention: System presets are read-only and cannot be deleted. Mom's custom presets are full CRUD.
- [ ] Convention: Founding family check: `families.is_founding_family = true` AND `family_subscriptions.status = 'active'` → all features unlocked regardless of tier.

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables defined:** `member_permissions`, `view_as_permissions`, `mom_self_restrictions`, `special_adult_permissions`, `shift_sessions`, `shift_schedules`, `teen_sharing_overrides`, `permission_presets`

**Enums defined:**
- `access_level`: 'none', 'view', 'contribute', 'manage'
- `shift_trigger`: 'manual', 'scheduled', 'mom'
- `restriction_type`: 'full', 'tag'
- `preset_target_role`: 'additional_adult', 'special_adult'

**Triggers defined:**
- `mom_self_restriction_deleted` → generates notification for target member if in Independent mode
- `shift_auto_end` → scheduled job checks for shifts past scheduled end time + 30min buffer

**References PRD-01 tables:**
- `families` (family_id FK on all tables)
- `family_members` (member FK references throughout)
- `special_adult_assignments` (extended by `special_adult_permissions`)
- `feature_access` (queried by `useCanAccess()`)
- `family_subscriptions` (tier lookup for `useCanAccess()`)

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Mom sees all kids' content by default; "mom sees all" does NOT apply to dad's personal content** | MyAIM serves parents, not teens. Dad is a partner, not a managed account. Mom controls what dad sees about kids, not dad's own workspace. |
| 2 | **Four access levels: none, view, contribute, manage** | Real family scenarios require distinguishing "can see" from "can help" from "can run it." Contribute covers "mark complete + add new" without edit/delete power over mom's content. |
| 3 | **View As is full read/write/edit, not read-only preview** | Primary use case is mom managing kids' day from her phone. Actions log as the viewed member — simplest model, no "completed by proxy" states. |
| 4 | **View As permissions are per-kid AND per-feature** | Default is per-kid toggle, but mom can exclude specific features (e.g., daughter's period calendar from dad's View As). |
| 5 | **Special Adults have shift-based access — zero visibility outside active shifts** | Caregivers should only see kid data while actively caring for kids. Creates natural audit trail. |
| 6 | **Special Adults capped at 'contribute' access level (never 'manage')** | Caregivers mark things complete and log observations. They don't edit or delete mom's content. |
| 7 | **Teen transparency: can share UP, cannot restrict DOWN** | Mom-first architecture. Teens always know what's shared. Mom grants privacy when she decides kid is ready. |
| 8 | **Teen notified when mom INCREASES visibility; no notification when mom DECREASES** | Increasing = mom sees more (teen should know). Decreasing = mom sees less (just a gift of trust, reflected in panel). |
| 9 | **`useCanAccess()` for tier gating only; `usePermission()` for role-based access** | Separate concerns: "can your subscription do this?" vs. "does your role allow this?" Combining would create confusing API. |
| 10 | **Unmark anywhere = unmark everywhere, with full cascade** | Single source of truth. If mom unmarks Mosiah's task, rewards, streaks, and tracking all roll back system-wide. |
| 11 | **Dad's personal content is opt-in sharing (dad chooses to share with mom/family)** | Respects spousal relationship. Mom-first applies to parenting, not to surveilling a spouse. |
| 12 | **Preset bundles for quick permission setup, then granular control available** | Easy 80% case (tap "Babysitter" preset), full control for the 20% who need it. System presets read-only; custom presets are CRUD. |
| 13 | **Shift schedules support recurring auto-start/end in addition to manual** | Covers the grandparent-every-Tuesday use case. Manual always available as override. |
| 14 | **Permission changes for dad: no push notification, just reflected in his visible permissions** | Avoids household drama. Dad sees what he has access to; changes are quiet. |
| 15 | **Journal entry-type visibility is per-child, per-entry-type** | Some entry types (commonplace, kid_quips) visible by default for educational tracking; others (journal_entry, gratitude) private by default. Added via PRD-08 cross-PRD impact. |
| 16 | **Task Requests bypass the per-feature permission model** | Any connected family member can send a request; requesting isn't creating. Parent retains full control over whether the request becomes a real task. Added via PRD-09 cross-PRD impact. |
| 17 | **Special Adults can Log Activity during shifts** | Simple form (description + optional photo) creates `activity_log_entries` record. Mom sees in shift summary and can promote to victories. Added via PRD-09 cross-PRD impact. |
| 18 | **`studio_access` feature key added; dad task creation scope clarified** | Studio requires Full Magic + mom permission for teens. Dad creates tasks for himself always; can only create/assign to kids with contribute or manage access on `tasks` key. Added via PRD-09 cross-PRD impact. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Whether dad can see features he doesn't have access to (greyed out vs. hidden) | UX/design sprint — not a PRD-level decision |
| 2 | Shift scheduling recurring auto-start/end implementation | MVP stretch goal or early post-MVP. Table defined, needs cron job. |
| 3 | Permission change audit log | Future observability/admin PRD. Schema supports it via timestamps. |
| 4 | Bulk permission apply (copy one kid's permissions to siblings) | UX sprint. Common for large families, needs careful UI. |
| 5 | Custom permission presets (mom creates and saves her own) | Post-MVP. System presets cover launch needs. |
| 6 | Permission templates shareable between families | Future Creator tier feature. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | `useCanAccess()` stub wired to real logic; `special_adult_assignments` extended with `special_adult_permissions` | No PRD-01 edits needed — stubs were designed for this. |
| PRD-04 (Shell Routing) | Shell layouts must respect `PermissionGate` for nav items; View As banner needs shell-aware rendering | PRD-04 should reference PRD-02's PermissionGate pattern and View As banner component. |
| PRD-05 (LiLa Core) | Shift summary compilation uses LiLa API | PRD-05 should include shift summary as a LiLa API use case. |
| PRD-08 (Journal) | Journal visibility settings added as PRD-02 permission pattern (applied via cross-PRD addendum) | Already applied. `journal_visibility_settings` table defined in PRD-08. |
| PRD-09 (Tasks) | Task unmark cascade principle established — PRD-09 must implement reward/streak rollback on unmark | PRD-09 should reference PRD-02's "unmark anywhere = unmark everywhere" convention. |
| PRD-09 (Tasks/Lists/Studio) | Task Request flow, Special Adult Log Activity, `studio_access` feature key, dad task creation scope added to PRD-02 | Already applied via PRD-09 cross-PRD impact addendum. |
| All future feature PRDs | Must register feature keys in the Feature Key Registry; must wrap member-scoped UI in `PermissionGate` | Convention documented in CLAUDE.md additions. |

---

*End of PRD-02*
