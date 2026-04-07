# Linked Routine Steps, Mastery & Practice Advancement Addendum
## Routine Content Linking + Sequential/Randomizer Advancement Modes

**Date:** April 6, 2026
**Status:** Approved — Ready for Build
**Triggered by:** PRD-09A/09B audit; homeschool curriculum and life skills use cases
**Touches:** PRD-09A, PRD-09B, PRD-29 (forward note), PRD-24 (forward note)

---

## Overview

This addendum introduces three interconnected enhancements to the task and list systems that transform how families manage skill-building, curriculum progression, and daily practice:

1. **Linked Routine Steps** — Routine steps that dynamically pull today's content from another source (sequential list, randomizer, recurring task) instead of being static text.
2. **Advancement Modes for Sequential Items** — Per-item choice of how an item advances: simple completion (existing), practice count (complete N times), or mastery (practice until demonstrated, optional mom approval).
3. **Randomizer Mastery & Draw Modes** — Randomizer items gain the same advancement modes, plus three configurable draw behaviors: Focused (one at a time), Buffet (configurable active limit), and Surprise Me (auto-rotation).

Together these features enable workflows like: a school routine where "Math" pulls today's chapter from a sequential list, "Scripture Study" pulls today's reading from a reading list with duration tracking, and "Skateboard Practice" pulls a random trick from a mastery-enabled randomizer — all within a single daily routine, each advancing independently.

> **Design philosophy:** These are tools to make the boxes, not the boxes themselves. Mom configures how each item advances; the child experiences a simple daily checklist. The complexity is in setup, not in use.

---

## Enhancement A: Linked Routine Steps

### What It Is

A new step type in the Routine Section Editor (PRD-09A) where instead of typing a static step name, mom selects "Linked Content" and connects the step to an external source. The routine step dynamically displays whatever content is currently active from that source.

### Supported Source Types

| Source Type | What It Pulls | Example |
|-------------|--------------|---------|
| Sequential List | Current active item(s) from the collection | "Math — Saxon Ch. 12: Fractions Review" |
| Randomizer List | Current active drawn item(s), or auto-drawn item (Surprise Me mode) | "Skateboard Practice — Kickflip" |
| Recurring Task | The linked task instance for today | "Piano Practice — Scales & Arpeggios" |

> **Deferred:** BookShelf reading assignments as a linked source. Reading lists are modeled as sequential lists with duration tracking for now (see Enhancement D: Reading List Template).

### How It Works — Mom's Setup Experience

In the Routine Section Editor, when mom taps [+ Add Step], she sees two options:

- **Text Step** (existing) — type a step name
- **Linked Content** — pick a source

If she chooses Linked Content:

1. Source type picker: Sequential List / Randomizer / Recurring Task
2. Source picker: shows all lists/tasks of that type in the family (filtered by the assigned member's access)
3. Display name (optional override): if blank, shows the source name + current item title. If set, shows the override name and the current item title appears on tap.

### How It Works — Child's Experience

The routine step displays the source name (e.g., "Math" or "Scripture Study"). The child taps the step to see what's currently active. For sequential lists with `active_count: 1`, this shows one item. For `active_count: 3`, it shows three items with individual checkboxes.

Completing the active item(s) marks the routine step done for the day. The linked source tracks its own advancement independently — if the sequential item needs 5 more practices before advancing, that's tracked on the sequential side, not the routine side.

**Key behavior:** The routine step completion is daily. The linked source advancement is cumulative. A child can practice "Kickflip" for 10 routine days before mastering it. Each day the routine step shows as completed; the kickflip stays active in the randomizer until mastered.

### How It Works — Direct List Access

The child can also go to the Lists page (if permissioned) and mark items practiced/mastered directly from the full list view — not only through the routine. Completions from either path record to the same log and activity history. Both paths feed Victory Recorder when applicable.

> **Decision rationale:** Direct list access prevents the routine from being the only gateway to progress. A child who finishes their routine early and wants to do extra practice on a sequential item can do so from the list view without waiting for tomorrow's routine instance.

### Schema Changes for Linked Steps

**`task_template_steps` table — new columns:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| step_type | TEXT | 'static' | NOT NULL | Enum: 'static', 'linked_sequential', 'linked_randomizer', 'linked_task' |
| linked_source_id | UUID | | NULL | FK to `sequential_collections.id`, `lists.id`, or `tasks.id` depending on step_type |
| linked_source_type | TEXT | | NULL | Redundant with step_type but explicit for query clarity: 'sequential_collection', 'randomizer_list', 'recurring_task' |
| display_name_override | TEXT | | NULL | Optional label override. NULL = use source name + current item title. |

> **Decision rationale:** `step_type` as an enum rather than a boolean `is_linked` because future source types may have different rendering behavior. Keeping it typed allows the UI to render source-appropriate controls.

---

## Enhancement B: Sequential Advancement Modes

### What It Is

Per-item advancement configuration on sequential collection items. Currently all items advance via simple completion. This addendum adds two additional modes.

### Three Advancement Modes

**1. Complete (existing behavior)**
Check it off, next item promotes. No change to current behavior. This is the default.

**2. Practice Count**
Item stays active until completed N times, then auto-advances. Each completion increments a counter. Counter hits threshold and the next item promotes.

Use cases: "Do this worksheet 5 times," "Practice this piano piece 10 times," "Read this chapter 3 times."

Progress display on the item: "3/5 practices"

**3. Mastery**
Item stays active indefinitely. Child marks "Practiced" each day (completing the routine step for the day). When the child feels ready, they submit "Mastered." If `require_approval` is true, the mastery submission goes to mom for verification. If false, self-assessed and advances immediately.

Use cases: memorize states/capitals, learn a skateboard trick, demonstrate a life skill, complete a book.

Progress display on the item: "Practiced 8 times" with a [Submit as Mastered] button.

### Bulk Set Then Override

When creating or editing a sequential collection, mom sets a **default advancement mode** for the entire list. All items inherit this default. Mom can then tap any individual item to override its advancement mode.

UI flow:
1. Collection settings — Default advancement: Complete / Practice Count / Mastery
2. If Practice Count: default practice target (e.g., 5)
3. If Mastery: default require_approval toggle
4. Individual item override — tap item — change advancement mode, practice target, or approval requirement

> **Decision rationale:** A Life Skills list with 30 items shouldn't require mom to configure each one individually. Bulk default handles 90% of items; overrides handle the exceptions.

### Duration Tracking (Optional Per Item)

When enabled on an item, the practice/completion action prompts "How long?" before marking done. Options: 15 min, 30 min, 45 min, 1 hr, custom. Duration is stored on the completion record and feeds into activity log and compliance reporting (PRD-28B).

Mom enables duration tracking per item or as a collection-level default (same bulk-set-then-override pattern).

Use cases: reading time per book, practice time per skill, study time per subject.

### Evidence on Mastery Submission

Mom can configure per-collection (or per-item override) whether mastery submission requires evidence. This uses the same `require_photo` mechanism that already exists on routine steps. When enabled, the [Submit as Mastered] action requires a photo or note attachment before submission.

### Schema Changes for Sequential Items

Sequential items are stored as rows in the `tasks` table with `task_type = 'sequential'` and `sequential_collection_id` set. New columns on the `tasks` table:

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| advancement_mode | TEXT | 'complete' | NOT NULL | Enum: 'complete', 'practice_count', 'mastery' |
| practice_target | INTEGER | | NULL | Required when advancement_mode = 'practice_count'. Number of completions needed. |
| practice_count | INTEGER | 0 | NOT NULL | Current count of practice completions toward target or mastery history. |
| mastery_status | TEXT | | NULL | Enum: 'practicing', 'submitted', 'approved', 'rejected'. NULL when advancement_mode != 'mastery'. |
| mastery_submitted_at | TIMESTAMPTZ | | NULL | When child submitted for mastery review. |
| mastery_approved_by | UUID | | NULL | FK → family_members. Who approved mastery. |
| mastery_approved_at | TIMESTAMPTZ | | NULL | |
| require_mastery_approval | BOOLEAN | true | NOT NULL | Whether mastery requires mom approval. |
| require_mastery_evidence | BOOLEAN | false | NOT NULL | Whether mastery submission requires photo/note. |
| track_duration | BOOLEAN | false | NOT NULL | Whether to prompt for duration on each practice. |

New columns on the `sequential_collections` table (collection-level defaults):

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| default_advancement_mode | TEXT | 'complete' | NOT NULL | Default for new items: 'complete', 'practice_count', 'mastery' |
| default_practice_target | INTEGER | | NULL | Default practice count target when mode = 'practice_count' |
| default_require_approval | BOOLEAN | true | NOT NULL | Default mastery approval requirement |
| default_require_evidence | BOOLEAN | false | NOT NULL | Default mastery evidence requirement |
| default_track_duration | BOOLEAN | false | NOT NULL | Default duration tracking |

New columns on the `task_completions` table (practice records):

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| completion_type | TEXT | 'complete' | NOT NULL | Enum: 'complete', 'practice', 'mastery_submit'. Distinguishes between final completion and practice sessions. |
| duration_minutes | INTEGER | | NULL | Duration logged for this practice session, when track_duration is enabled. |
| mastery_evidence_url | TEXT | | NULL | Photo/attachment URL when require_mastery_evidence is true. |
| mastery_evidence_note | TEXT | | NULL | Text note accompanying mastery submission. |

### Advancement Flow

**Practice Count flow:**
1. Child completes item → `task_completions` record created with `completion_type = 'practice'`
2. `tasks.practice_count` incremented
3. If `practice_count >= practice_target` → item status set to 'completed', next sequential item promotes per existing `promotion_timing` logic
4. If `practice_count < practice_target` → item stays active, routine step still marked done for the day

**Mastery flow:**
1. Child marks "Practiced" → `task_completions` record with `completion_type = 'practice'`, `tasks.practice_count` incremented, routine step done for the day
2. Child taps [Submit as Mastered] → `tasks.mastery_status = 'submitted'`, `task_completions` record with `completion_type = 'mastery_submit'`
3. If `require_mastery_approval = false` → auto-approve, item status = 'completed', next item promotes
4. If `require_mastery_approval = true` → item enters `pending_approval` status, appears in mom's approval queue
5. Mom approves → `mastery_status = 'approved'`, item status = 'completed', next item promotes
6. Mom rejects → `mastery_status = 'rejected'`, `mastery_status` reset to 'practicing', child continues practicing. Rejection note stored on the `task_completions` record.

### History & Visibility

Every practice session is recorded in `task_completions`. This creates a rich history:
- "Kickflip: 10 practices over 14 days before mastery"
- "Memorize States: practiced 22 times over 6 weeks, submitted twice (rejected once, approved once)"
- "Saxon Ch. 12: completed in 1 session"

This history feeds into Victory Recorder (the mastery moment is a celebration), activity logs, and future compliance reporting (PRD-28B) for homeschool portfolio documentation.

---

## Enhancement C: Randomizer Advancement Modes & Draw Behaviors

### Advancement Modes for Randomizer Items

Randomizer list items gain the same three advancement modes as sequential items: complete, practice_count, and mastery. These extend the existing `is_repeatable` / `is_available` behavior.

| Existing Behavior | New Behavior |
|-------------------|-------------|
| `is_repeatable = true` → item returns to pool after completion | Still works. Item with `advancement_mode = 'complete'` and `is_repeatable = true` returns to pool each time. |
| `is_repeatable = false` → one-time item, removed after completion | Still works. Item with `advancement_mode = 'complete'` and `is_repeatable = false` exits pool permanently. |
| (new) `advancement_mode = 'practice_count'` | Item stays active until practiced N times. Then follows `is_repeatable` rule (returns to pool or exits). |
| (new) `advancement_mode = 'mastery'` | Item stays active until mastered. On mastery, exits pool permanently with full practice history preserved. `is_repeatable` ignored for mastery items — mastered means done. |

### Three Draw Behaviors

Mom configures the draw behavior at the list level. This controls how items become active.

**A. Focused Draw (`draw_mode = 'focused'`)**
`max_active_draws: 1` (configurable). Child taps Draw, gets one item. Draw button locked until that item is completed/mastered. Then they can draw again.

**B. Buffet Draw (`draw_mode = 'buffet'`)**
`max_active_draws: N` (configurable, default 3). Child can draw up to N items. Draws lock when limit reached. Any completion/mastery opens a slot for a new draw.

**C. Surprise Me (`draw_mode = 'surprise'`)**
No manual drawing. When the randomizer is linked to a routine step, the system auto-draws an item for the child each time the routine instance generates. Uses existing smart draw weighting (cooldown, frequency rules from `useSmartDraw`). The drawn item is locked in for that routine instance — it doesn't re-randomize on refresh.

Items with advancement requirements (practice_count or mastery) keep appearing in the rotation until their requirement is met. Mastered items exit the pool. The system naturally weights toward items that haven't been practiced recently.

> **Decision rationale for three modes:** Focused serves disciplined, deep-focus learners. Buffet serves variety-seekers who want bounded choice. Surprise Me serves kids who benefit from zero decision fatigue and daily variety. All three are real use cases that emerged from homeschool curriculum planning.

### Surprise Me — Detailed Mechanics

- **Trigger:** When a routine instance generates for the day (or when the child first opens the routine), the linked randomizer step auto-draws from the pool.
- **Selection:** Uses existing `useSmartDraw` weighting. Items not practiced recently get higher weight. Items practiced yesterday get cooldown penalty.
- **Lock-in:** The drawn item is fixed for that routine instance. Refreshing the page shows the same item.
- **Completion from routine:** Child can mark "Practiced" or "Mastered" directly from the routine step view. No need to navigate to the list.
- **Pool exhaustion:** When all items are mastered and the pool is empty, the routine step shows "All items mastered!" with a celebration indicator. The linked step becomes a completed badge rather than a daily task.

### Schema Changes for Randomizer Advancement

**`list_items` table — new columns:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| advancement_mode | TEXT | 'complete' | NOT NULL | Enum: 'complete', 'practice_count', 'mastery'. Defaults to 'complete' (existing behavior unchanged). |
| practice_target | INTEGER | | NULL | Required when advancement_mode = 'practice_count'. |
| practice_count | INTEGER | 0 | NOT NULL | Current count of practice completions. |
| mastery_status | TEXT | | NULL | Enum: 'practicing', 'submitted', 'approved', 'rejected'. NULL when not in mastery mode. |
| mastery_submitted_at | TIMESTAMPTZ | | NULL | |
| mastery_approved_by | UUID | | NULL | FK → family_members. |
| mastery_approved_at | TIMESTAMPTZ | | NULL | |
| require_mastery_approval | BOOLEAN | true | NOT NULL | |
| require_mastery_evidence | BOOLEAN | false | NOT NULL | |
| track_duration | BOOLEAN | false | NOT NULL | |

**`lists` table — new columns (for randomizer-type lists):**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| draw_mode | TEXT | 'focused' | NULL | Enum: 'focused', 'buffet', 'surprise'. Only applies to randomizer lists. NULL for other list types. |
| max_active_draws | INTEGER | 1 | NULL | For focused and buffet modes. Number of items that can be active simultaneously. |
| default_advancement_mode | TEXT | 'complete' | NULL | Default advancement mode for new items in this randomizer. |
| default_practice_target | INTEGER | | NULL | Default practice count when advancement_mode = 'practice_count'. |
| default_require_approval | BOOLEAN | true | NULL | Default mastery approval setting. |
| default_require_evidence | BOOLEAN | false | NULL | Default evidence requirement. |
| default_track_duration | BOOLEAN | false | NULL | Default duration tracking. |

**New table: `randomizer_draws`**

Tracks active and historical draws for randomizer lists. Needed for draw slot management, Surprise Me daily assignments, and mastery history.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| list_id | UUID | | NOT NULL | FK → lists |
| list_item_id | UUID | | NOT NULL | FK → list_items |
| family_member_id | UUID | | NOT NULL | FK → family_members (who this draw is for) |
| drawn_at | TIMESTAMPTZ | now() | NOT NULL | When the item was drawn/assigned |
| draw_source | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'auto_surprise'. How the draw happened. |
| routine_instance_date | DATE | | NULL | For Surprise Me mode: which routine day this draw is for. |
| status | TEXT | 'active' | NOT NULL | Enum: 'active', 'completed', 'mastered', 'released'. |
| completed_at | TIMESTAMPTZ | | NULL | |
| practice_count | INTEGER | 0 | NOT NULL | Practice sessions logged against this specific draw. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped via list_id → lists.family_id. Members can read own draws. Mom reads all.

**Indexes:**
- `(list_id, family_member_id, status)` — active draws for a member
- `(list_id, status)` — all active draws (for slot counting)
- `(list_item_id, family_member_id)` — draw history per item per member

**New table: `practice_log`**

Unified practice tracking for both sequential items and randomizer items. Stores every individual practice session with optional duration.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| source_type | TEXT | | NOT NULL | Enum: 'sequential_task', 'randomizer_item' |
| source_id | UUID | | NOT NULL | FK to `tasks.id` (sequential) or `list_items.id` (randomizer) |
| draw_id | UUID | | NULL | FK → randomizer_draws. Only for randomizer items. |
| practice_type | TEXT | 'practice' | NOT NULL | Enum: 'practice', 'mastery_submit' |
| duration_minutes | INTEGER | | NULL | Logged duration for this session. |
| evidence_url | TEXT | | NULL | Photo/attachment for mastery submissions. |
| evidence_note | TEXT | | NULL | Text note for mastery submissions. |
| period_date | DATE | | NOT NULL | Which day this practice is for. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Members can write own. Mom reads all.

**Indexes:**
- `(source_type, source_id, family_member_id)` — practice history per item per member
- `(family_member_id, period_date)` — "what did I practice today"
- `(family_id, period_date)` — family practice activity for a day

> **Decision rationale:** A unified `practice_log` table rather than overloading `task_completions` for both sequential and randomizer practice. Sequential items live in the `tasks` table but randomizer items live in `list_items` — different parent tables. A unified practice log keeps the query pattern clean: "show me all practice activity for this member today" is one query regardless of source type. The `task_completions` table continues to handle standard task completion/approval flows; `practice_log` handles the incremental practice/mastery flow.

---

## Enhancement D: Reading List Template

### What It Is

A Studio template that pre-configures a sequential list optimized for reading assignments. Not a new list type — it's a sequential collection with specific defaults pre-set.

### Template Defaults

| Setting | Default Value |
|---------|--------------|
| Default advancement mode | Mastery |
| Default require approval | true (mom confirms book is finished) |
| Default track duration | true (prompts "How long did you read?") |
| Default require evidence | false |
| Active count | 1 (one book at a time, configurable) |
| Promotion timing | manual (mom advances to next book, or auto on mastery approval) |

### Mom's Setup Experience

1. Studio — Browse Templates — "Reading List" template
2. Opens sequential collection creator with reading-optimized defaults
3. Mom adds book titles (type, paste, or drag to reorder)
4. Assigns to child
5. Deploys

### Child's Experience

Daily routine linked step shows: "Reading — [Current Book Title]"
Child taps — sees current book — taps "Mark as Read" — duration prompt — done for the day.
When finished with the book — [Submit as Finished] — mom approves — next book activates.

---

## Enhancement E: AI-Assisted List Creation from Curriculum Text

### What It Is

An AI parse step in the sequential collection creator (and randomizer creator) where mom can paste a large block of curriculum text — badge requirements, chapter lists, skill inventories, scope-and-sequence documents — and LiLa structures it into items with suggested advancement modes.

This follows the same pattern as Routine Brain Dump (already built, 641 lines in RoutineBrainDump.tsx), applied to list creation.

### How It Works

1. Mom opens the sequential collection creator (or randomizer creator)
2. Instead of adding items one by one, she taps [Paste Curriculum] (or [AI Import])
3. A text area opens. Mom pastes a block of curriculum text (badge requirements, chapter list, copied from a website, etc.)
4. AI parse step (Haiku, single-turn, same Edge Function pattern as routine-brain-dump) analyzes the text and returns structured items:
   - Item titles extracted and cleaned
   - Required/starred items flagged
   - URLs detected and auto-populated into the URL field
   - Advancement mode suggested per item: "This sounds like a one-time activity" → complete. "This sounds like an ongoing skill to demonstrate" → mastery. "This mentions doing something multiple times" → practice_count with suggested target.
   - Items that reference other badges or prerequisites flagged with a note ("References Level 2 requirements — may need separate list")
5. Mom reviews the parsed results in a list editor. She can accept all, adjust individual items, change advancement modes, reorder, add/remove items.
6. Human-in-the-Mix: nothing saves until mom approves.

### Edge Function: `curriculum-parse`

**Pattern:** Same as `routine-brain-dump`

**Model:** Haiku (single-turn structured extraction — lightweight)

**Input:**
```typescript
{
  raw_text: string;          // The pasted curriculum text
  list_type: 'sequential' | 'randomizer';
  context?: {
    subject_area?: string;   // "Math", "Life Skills", etc. if known
    target_level?: string;   // "Level 3", "Grade 6-8", etc. if known
  }
}
```

**Output:**
```typescript
{
  items: Array<{
    title: string;
    notes?: string;
    url?: string;                              // Auto-detected from text
    is_required?: boolean;                     // Starred/mandatory items
    suggested_advancement_mode: 'complete' | 'practice_count' | 'mastery';
    suggested_practice_target?: number;        // When mode = practice_count
    suggested_require_approval?: boolean;
    prerequisite_note?: string;                // "References Level 2 requirements"
    sort_order: number;
  }>;
  detected_metadata?: {
    source_name?: string;     // "Frontier Girls Level 3 Life Skills"
    total_required?: number;  // "Do six requirements including the two starred"
    pick_n_of_m?: { n: number; m: number; required_count?: number };  // Detected "pick N of M" pattern — flagged for BigPlans future use
  }
}
```

> **Decision rationale:** The `pick_n_of_m` detection in metadata is informational only — it's flagged so mom knows this curriculum has a selection pattern, but the list is still created as a flat sequential/randomizer list. The "pick N of M" completion logic belongs in BigPlans (PRD-29), not in the list itself.

### URL Detection

The parser detects URLs embedded in curriculum text and auto-populates them on the corresponding item's URL field. This enables linked steps to show items with tappable resource links — YouTube tutorials, Khan Academy lessons, online quiz sites, worksheet generators.

URLs on list items are already supported in the existing schema (`list_items.url` for wishlists and references). Sequential items stored in the `tasks` table don't currently have a URL field — this addendum adds one.

**`tasks` table — additional new column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| resource_url | TEXT | | NULL | URL for linked learning resources (videos, websites, worksheets). Tappable from task card and routine linked step. |

---

## Enhancement F: Curriculum Library & Reuse

### Store Now, Deploy Later

Mom can create sequential lists and randomizer lists without assigning them to anyone. These sit in her Studio library as undeployed templates, ready for use whenever she's ready. This is already how Studio works — no new infrastructure needed. The addendum just makes this workflow explicit for curriculum planning.

**Curriculum planning workflow:**

1. Mom finds a curriculum she likes (Frontier Girls badges, a book list, a scope-and-sequence)
2. She creates a sequential list using [Paste Curriculum] to import items quickly
3. She does NOT assign it to any child — it saves as an undeployed template in Studio
4. She repeats for all subjects/curricula she wants available
5. When planning a child's year, she deploys relevant templates to that child
6. Some templates deploy as individual copies (each child gets independent progress tracking)
7. Some templates deploy as shared (siblings collaborate on the same list)

### Deploy and Duplicate

When mom deploys a template to a second child, the template remains unchanged. The deployment creates a new independent instance with its own progress tracking. This is the existing "Deploy to New Student" pattern on sequential collections, extended to all list types with advancement modes.

**Cross-child duplication for routines:**

When mom has built a school routine for one child with linked steps pointing to specific sequential/randomizer lists, she can duplicate the routine for another child. The duplication process:

1. Creates a copy of the routine template with all sections and steps
2. For linked steps, prompts mom: "Miriam's routine links to 'Saxon Math 6.' Which list should Gideon's link to?" Options: same list (shared progress), a different existing list, or "create new" (which could be a fresh deployment of the same or different template)
3. Mom resolves each linked step's source for the new child
4. The new routine deploys with all linkages configured

> **Decision rationale:** Routine duplication with linked step resolution is the key complexity reducer for multi-child families. Without it, mom rebuilds the entire routine structure from scratch for each child. With it, she copies the structure and only swaps out the content-specific lists.

### Forward Note: Community Curriculum Templates

At the Creator tier (PRD-31), mom could share curriculum templates she's built — "Frontier Girls Level 3 Life Skills (30 items, mastery advancement)" — for other families to deploy. This is a natural extension of the Studio template sharing concept. Not in scope for this addendum but the architecture supports it.

### Forward Note: Pre-Built Curriculum Templates in Studio

A future Studio category — "Curriculum" or "Learning Paths" — could offer pre-populated templates for commonly used programs: Frontier Girls badge levels, classical education scope-and-sequence, standard math curricula chapter lists, etc. These would be curated templates with items, advancement modes, and resource URLs already configured. Mom deploys, assigns, and adjusts. This reduces setup from "paste and configure" to "browse, pick, deploy." Architecture already supports this — it's a content seeding effort, not a technical feature.

### Forward Note: Learning Path Duplication in BigPlans (PRD-29)

When BigPlans is built, the ability to duplicate an entire Learning Path (BigPlan + all linked sequential/randomizer lists + routine with linked steps) for a second child should be a first-class feature. Mom copies "Miriam's Level 3 STEAM Path" for Gideon, resolves each milestone's list source, and gets a complete independent learning path in one action. This extends the routine duplication pattern to the BigPlan container level.

### Forward Note: Conversational School Year Planner (PRD-05 + PRD-18 + PRD-29)

The ultimate complexity reduction: mom sits down with LiLa and describes her school year in conversation. "Miriam is doing Saxon Math 6, Level 3 Life Skills, Physics and Biographies badges, and I want daily enrichment variety with typing, cursive, and geography." LiLa asks clarifying questions, generates all lists with advancement modes, builds the routine with linked steps and section frequencies, and creates a BigPlan container — then presents everything for mom to review and approve before saving. Depends on LiLa guided modes (PRD-05), Rhythms as activation engine (PRD-18), and BigPlans (PRD-29). Captured here as the north star experience that all these building blocks work toward.

### Tappable Resource URLs

Items with URLs (on both sequential tasks and randomizer list items) display the URL as a tappable link in all contexts where the item appears: the full list view, the routine linked step expanded view, and the dashboard task card. Tapping opens the URL in a new browser tab. This enables curriculum items to link directly to YouTube videos, Khan Academy lessons, online quiz sites, worksheet generators, and any web resource mom wants associated with the item.

For linked routine steps specifically: when the child taps the routine step to see what's active, the expanded view shows the item title, progress indicator, and resource URL (if present) as a tappable link. The child can tap the link, complete the resource, then tap "Mark as Practiced" without navigating away from the routine.

---

## Enhancement A Clarification: Linked Steps and Section Frequency

Linked routine steps inherit the frequency schedule of the section they belong to. The linked source tracks advancement independently of the routine schedule.

**Example:** A school routine with these sections:

- **Daily (M-F):** Math (linked sequential), Reading (linked sequential), Enrichment (linked randomizer — Surprise Me)
- **MWF:** Science (linked sequential), Life Skills (linked sequential)
- **T/Th:** Social Studies (linked sequential), Biography (linked sequential)
- **Friday:** Weekly Review (static step)

On Tuesday, the child sees Daily + T/Th sections. On Wednesday, Daily + MWF. The linked sequential list for Science doesn't care that it only shows MWF — its advancement tracks cumulative practice regardless of which days it appears. If Science item #3 needs 5 practices and it shows 3 days/week, it takes roughly 2 weeks to advance.

For Surprise Me randomizer steps, the auto-draw happens each time the section is active. If the enrichment randomizer is in a Daily section, a new item draws each weekday. If it were in a MWF section, draws would happen 3 days/week. The smart draw weighting accounts for the gap — items drawn Monday still get cooldown weight on Wednesday.

---

## Cross-PRD Impact

### PRD-09A: Tasks, Routines & Opportunities

| Area | Change | Details |
|------|--------|---------|
| Routine Section Editor (Screen 4) | **ADD** linked step type | New step_type selector: Static / Linked Content. Linked steps show source picker and display name override. |
| task_template_steps table | **ADD** 4 columns | `step_type`, `linked_source_id`, `linked_source_type`, `display_name_override` |
| tasks table | **ADD** 10 columns | `advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, `mastery_submitted_at`, `mastery_approved_by`, `mastery_approved_at`, `require_mastery_approval`, `require_mastery_evidence`, `track_duration` |
| sequential_collections table | **ADD** 5 columns | `default_advancement_mode`, `default_practice_target`, `default_require_approval`, `default_require_evidence`, `default_track_duration` |
| task_completions table | **ADD** 4 columns | `completion_type`, `duration_minutes`, `mastery_evidence_url`, `mastery_evidence_note` |
| Sequential Collection View (Screen 6) | **UPDATE** | Items display practice progress ("3/5 practices" or "Practiced 8 times"). [Submit as Mastered] button on mastery items. Duration prompt on practice completion when enabled. |
| Sequential Creator | **UPDATE** | Add default advancement mode selector with bulk-set-then-override UI. Per-item advancement override in item editor. Add [Paste Curriculum] / [AI Import] button that invokes `curriculum-parse` Edge Function. |
| tasks table | **ADD** 1 additional column | `resource_url` — URL for linked learning resources (videos, websites, worksheets). |
| Routine duplication | **ADD** | Duplicate routine for another child with linked step source resolution prompts. |
| Dashboard task card | **UPDATE** | Linked routine steps render source name + tap-to-expand current item. Practice progress shown as subtitle text. |
| Approval queue | **UPDATE** | Mastery submissions appear alongside existing task approval items. Mastery submissions show practice history count and optional evidence. |
| CLAUDE.md | **ADD** | "Linked routine steps use step_type enum on task_template_steps. Source is resolved at render time, not stored as task content. Routine step completion is daily; linked source advancement is cumulative and independent." |
| CLAUDE.md | **ADD** | "Sequential advancement modes are per-item with collection-level defaults. Three modes: complete (existing), practice_count (N completions), mastery (practice + approval gate). Practice sessions are logged in practice_log table." |

### PRD-09B: Lists, Studio & Templates

| Area | Change | Details |
|------|--------|---------|
| list_items table | **ADD** 10 columns | `advancement_mode`, `practice_target`, `practice_count`, `mastery_status`, `mastery_submitted_at`, `mastery_approved_by`, `mastery_approved_at`, `require_mastery_approval`, `require_mastery_evidence`, `track_duration` |
| lists table | **ADD** 7 columns | `draw_mode`, `max_active_draws`, `default_advancement_mode`, `default_practice_target`, `default_require_approval`, `default_require_evidence`, `default_track_duration` |
| Randomizer section | **UPDATE** | Draw mode selector (Focused/Buffet/Surprise Me). Max active draws config. Per-item advancement mode override. Mastery submission flow. Practice progress display. |
| Randomizer creation/edit | **UPDATE** | Add default advancement mode + draw mode to list creation flow. Bulk-set-then-override for item advancement. Add [Paste Curriculum] / [AI Import] for bulk item creation. |
| Studio seed data | **ADD** | "Reading List" template: sequential collection with mastery + duration tracking defaults. |
| New Edge Function: curriculum-parse | **CREATE** | Haiku-powered text parser for curriculum import. Same pattern as routine-brain-dump. Detects items, URLs, required flags, suggests advancement modes. |
| New table: randomizer_draws | **CREATE** | Tracks active and historical draws per member per list. |
| New table: practice_log | **CREATE** | Unified practice tracking for sequential and randomizer items. |

### PRD-29: BigPlans (Forward Note)

**Capture for future design:** The badge/award program pattern observed in curriculum systems (Frontier Girls, scouting programs) requires "pick N of M with required items" completion criteria, nested prerequisites (one badge required to earn another), and level-gated variants. This pattern does not fit sequential lists or routines — it needs its own data structure.

**Recommended approach:** BigPlans can serve as the container. Multiple sequential lists, randomizer lists, and other feature items can all contribute as milestones toward a BigPlan goal. Example: a "STEAM Award" BigPlan would have milestones for "Math Badge" (linked to a sequential list), "2 Life Science Badges" (linked to two more sequential lists), and individual standalone requirements.

**What's needed in PRD-29:** Milestone completion criteria beyond simple task completion — specifically "N of M items completed" with optional required items. Milestone linking to sequential collections (completion of the collection = milestone complete). This connects the per-item mastery tracking from this addendum to the higher-level goal tracking in BigPlans.

### PRD-24: Gamification (Forward Note)

Practice count and mastery completions should award gamification points when PRD-24 is wired. Suggested point events:
- Practice session completed — base points
- Practice streak (consecutive days on same item) — streak bonus
- Mastery achieved — mastery bonus (larger than single completion)
- All items in a collection mastered — collection completion celebration

### PRD-11: Victory Recorder (Forward Note)

Mastery moments are natural victory candidates. When a child masters an item (especially after many practice sessions), the mastery approval should auto-suggest or auto-create a Victory entry with the practice history summary: "Mastered Kickflip after 10 practice sessions over 14 days."

### PRD-28B: Compliance & Progress Reporting (Forward Note)

Practice logs with duration tracking provide rich data for homeschool compliance documentation. "Student practiced math for 45 minutes on March 15" with a per-subject breakdown over a reporting period. The `practice_log` table's `source_type` + `duration_minutes` + `period_date` columns are designed with this reporting use case in mind.

---

## Decisions Made This Session

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Per-item advancement mode with collection-level defaults** | Life Skills lists have 30 items — shouldn't require individual configuration. Bulk default + per-item override is fast for setup, flexible for exceptions. |
| 2 | **Three advancement modes: complete, practice_count, mastery** | Complete is existing behavior. Practice count handles "do this N times" without judgment. Mastery handles open-ended skill acquisition with optional approval gate. These cover all curriculum and skill-building patterns observed. |
| 3 | **Mom decides approval requirement at creation** | Some items are self-assessable (reading a chapter). Others need verification (demonstrating a life skill). Mom knows which is which. |
| 4 | **Three randomizer draw modes: Focused, Buffet, Surprise Me** | Focused for disciplined deep-focus learners. Buffet for bounded variety. Surprise Me for zero-decision-fatigue daily variety. All three emerged from real homeschool use cases. |
| 5 | **Surprise Me auto-draws on routine generation** | The system picks for the child each day using existing smart draw weighting. Removes decision fatigue entirely. Item is locked in for the day — no re-randomizing on refresh. |
| 6 | **max_active_draws mirrors sequential active_count** | Same concept, same configuration pattern. Default 1 for focused, configurable for buffet. Established UX precedent. |
| 7 | **Unified practice_log table** | Sequential items (tasks table) and randomizer items (list_items table) have different parents. A unified practice log enables "all practice today" queries without joining two completion tables. task_completions continues handling standard task flows. |
| 8 | **Reading List is a Studio template, not a new list type** | A sequential collection with mastery + duration defaults pre-set. No new data structure needed. Faster to build, consistent with existing architecture. |
| 9 | **Direct list access for progress marking** | Children shouldn't be locked into the routine as the only way to practice. Extra practice from the list view counts the same way. |
| 10 | **Badge/award programs deferred to BigPlans** | "Pick N of M with required items" is a different data structure from sequential lists. BigPlans is the right container — multiple lists can contribute as milestones toward a larger goal. |
| 11 | **Mastery items exit randomizer pool permanently** | Mastered means done. The full practice history is preserved in practice_log and randomizer_draws for review. No reason for a mastered item to reappear. |
| 12 | **AI-assisted list creation from pasted curriculum text** | Mom already has curriculum content in text form. Paste-and-parse with AI suggestion of advancement modes, URL detection, and required item flagging reduces setup from "configure 30 items manually" to "paste, review, approve." Same pattern as Routine Brain Dump. |
| 13 | **Undeployed lists as curriculum library** | Store now, deploy later. Mom builds her curriculum library in Studio without assigning to children. Deploys when ready. Same template deploys to multiple children as independent instances. Existing Studio architecture, no new infrastructure. |
| 14 | **Routine duplication with linked step resolution** | Multi-child families should not rebuild routine structure from scratch per child. Copy structure, resolve linked sources per child. Key complexity reducer for families with 3+ children in school. |
| 15 | **Linked steps inherit section frequency** | A Science linked step in a MWF section shows MWF. The linked source's advancement tracks cumulative practice regardless of routine schedule. Routine schedule controls display cadence; source tracks progress. |
| 16 | **Resource URLs tappable from all contexts** | Items with URLs show tappable links in list view, routine linked step view, and dashboard task card. Opens in new browser tab. Enables direct linking to video lessons, quiz sites, worksheets. |
| 17 | **Conversational planner is the north star** | All building blocks (linked steps, advancement modes, AI list parse, routine duplication, BigPlans milestones) work toward the future experience where mom describes her school year to LiLa and gets a complete structure generated for review. |

---

## Tier Gating

| Feature Key | Description | Tier |
|-------------|-------------|------|
| `sequential_advancement` | Practice count and mastery modes on sequential items | Enhanced |
| `randomizer_advancement` | Practice count and mastery modes on randomizer items | Enhanced |
| `linked_routine_steps` | Linked content steps in routines | Enhanced |
| `draw_mode_surprise` | Surprise Me auto-rotation draw mode | Full Magic |
| `duration_tracking` | Duration prompts on practice completion | Essential |
| `curriculum_ai_parse` | AI-assisted list creation from pasted curriculum text | Enhanced |

> **Tier rationale:** Duration tracking is Essential because it's lightweight and valuable for all families. Advancement modes and linked steps are Enhanced because they add meaningful curriculum management capability. Surprise Me is Full Magic because it requires system-driven AI-weighted selection.

All features return true during beta.

---

## CLAUDE.md Additions from This Addendum

- [ ] Linked routine steps use `step_type` enum on `task_template_steps`. Source content is resolved at render time from the linked source, not copied into the step. Routine step completion is daily; linked source advancement is cumulative and independent.
- [ ] Sequential advancement modes are per-item with collection-level defaults (bulk-set-then-override pattern). Three modes: `complete` (existing), `practice_count` (N completions auto-advance), `mastery` (practice + optional approval gate).
- [ ] Randomizer draw modes are list-level configuration: `focused` (one active, manual draw), `buffet` (N active, manual draw), `surprise` (auto-draw on routine generation, uses smart draw weighting).
- [ ] Practice sessions are logged in the `practice_log` table — unified across sequential tasks and randomizer items. This is separate from `task_completions` which handles standard task completion/approval flows.
- [ ] Mastery items in randomizer lists exit the pool permanently on mastery approval. Full history preserved in `practice_log` and `randomizer_draws`.
- [ ] Reading List is a Studio template (sequential collection with mastery + duration defaults), not a separate list type.
- [ ] The badge/award program pattern ("pick N of M with required items") is captured as a BigPlans (PRD-29) design need, not a sequential list feature.
- [ ] AI-assisted list creation (`curriculum-parse` Edge Function) follows the same pattern as `routine-brain-dump`: paste text — AI structures into items — mom reviews and approves. Never auto-creates without Human-in-the-Mix approval.
- [ ] Linked routine steps inherit the frequency schedule of their parent section. The linked source's advancement is cumulative and independent of the routine schedule.
- [ ] Routine duplication for another child prompts mom to resolve each linked step's source for the new child — same list (shared), different list, or create new.

---

*End of Addendum*
