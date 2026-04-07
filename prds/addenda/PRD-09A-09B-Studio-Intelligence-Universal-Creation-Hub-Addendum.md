# Studio Intelligence & Universal Creation Hub Addendum
## Intent-Based Creation + Capability Tags + Cross-Surface Visibility

**Date:** April 6, 2026
**Status:** Phase 1 Approved for Build, Phase 2 Approved for Build, Phase 3 Forward Note
**Triggered by:** PRD-09A/09B audit; discovery that sequential creation is broken everywhere; founder direction to make Studio the intelligent universal creation surface
**Touches:** PRD-09A, PRD-09B (Studio + Lists), PRD-10 (Widgets/Trackers), PRD-24 (Gamification), PRD-05 (LiLa — Phase 3 only)
**Supersedes:** PRD-09B Studio section's tool-type-only browse model. PRD-09A's Tasks-only sequential management. Documents a deliberate architectural evolution from "three rigid pages" to "create anywhere, display everywhere appropriate."

---

## Overview

Studio evolves from a template library organized by tool type into an intelligent creation hub that helps mom find the right tool for what she's trying to accomplish. Instead of requiring mom to know the difference between a sequential collection, a randomizer list, a routine, and a tracker, Studio presents tools by what they DO and helps her match her intent to the right creation flow.

This addendum also establishes the principle that created items should be visible on whatever surface makes sense for the user, regardless of which database table they live in. Sequential collections appear on both the Tasks page and the Lists page. Randomizers are prominently available from the Lists page. Trackers and widgets surface on the Dashboard. Studio is the universal library where everything is browsable, deployable, and manageable.

> **Architectural evolution:** The original three-page model (Studio — Tasks — Lists) assumed clean separation between tool types. The Linked Steps/Mastery Advancement Addendum transforms sequential collections and randomizers into curriculum building blocks that mom thinks of as "lists of content," not "task-system items." This addendum acknowledges that user mental models don't match database schemas, and the UI should follow the user.

> **Design philosophy:** "What do you want to accomplish?" not "Which tool type do you need?" Mom thinks in outcomes, not architecture.

---

## Phase 1: Fix Broken Wiring + Cross-Surface Visibility + Capability Tags Foundation

**Status:** Approved for immediate build
**Scope:** Critical bug fixes, one-line UX gap fix, data foundation for Phase 2

### 1A. Fix Sequential Collection Creation (Critical Bug)

Sequential collection infrastructure is fully built but nothing is wired together. Today, clicking "Create Sequential" anywhere creates a single broken task with `task_type='sequential'` and zero child items. The `sequential_collections` table is empty.

**Dead code to revive:**
- `SequentialCreator.tsx` — full creation UI (title, manual/URL/image input, items textarea, AI parse, promotion timing, active count). Zero callers.
- `SequentialCollectionView.tsx` — full management view (progress bars, restart-for-another-student, archive, member picker). Zero callers.
- `useCreateSequentialCollection` hook — fully working mutation that correctly inserts collection + child task items. Never called.

**Broken paths to fix:**

| Surface | Current Behavior | Fixed Behavior |
|---------|-----------------|----------------|
| Tasks page — Sequential tab — [+ Create] | Opens TaskCreationModal which has no sequential option in TASK_TYPES_GRID. Creates broken single task. | Opens SequentialCreator (revived). Saves via `useCreateSequentialCollection`. |
| Studio — Sequential Collection card — [Customize] | Opens TaskCreationModal with `initialTaskType='sequential'`. Same broken result. | Opens SequentialCreator. Saves correctly. |
| TaskCreationModal receives `taskType='sequential'` | Silently creates a broken row in `tasks` table with no children and no `sequential_collections` entry. | Either routes to SequentialCreator, or `createTaskFromData` bails out for sequential type (since SequentialCreator handles its own save). |
| Tasks page — Sequential tab display | Reads from `tasks` table, groups by `sequential_collection_id`. Poor-man's view. | Uses revived `SequentialCollectionView` component for full PRD-09A Screen 6 experience (progress, restart, archive). |

**Defensive requirement:** `createTaskFromData()` is used by 4 shells. If it still receives `taskType='sequential'`, it should either redirect to the proper creation flow or throw a clear error — not silently create a broken record. Add a guard clause.

### 1B. Add Randomizer to Lists Page Type Picker

**One-line fix.** `Lists.tsx:357` hard-codes the type picker grid and omits `'randomizer'`. Add it. The rest of the randomizer flow (TYPE_CONFIG, RandomizerDetailView, Randomizer component) already works.

### 1C. Cross-Surface Visibility for Sequential Collections

Sequential collections should be visible on the Lists page alongside regular lists, in addition to their existing home on Tasks — Sequential tab.

**Implementation:**
- Query `sequential_collections` for the family from the Lists page
- Render them as cards with distinct visual treatment (different icon, "Sequential" badge, progress indicator like "12/77")
- Tapping a sequential collection card navigates to the SequentialCollectionView (the revived component from 1A)
- "Sequential Collection" appears as a creation option in the Lists page [+ New List] type picker. Selecting it opens SequentialCreator.
- The Tasks — Sequential tab continues to work exactly as before (dual access, not moved)

**PRD divergence documentation:** This is a deliberate evolution from the original three-page model. Document in the feature decision file:
- **Original PRD ruling:** Sequential collections have their own tab on Tasks because the management experience is unique (PRD-09A line 469).
- **Evolution rationale:** The Linked Steps/Mastery Advancement Addendum transforms sequential collections into curriculum building blocks. Mom thinks of them as "lists of content for my kids," not "task-system items." Forcing her to the Tasks page to manage her reading lists and skill progressions while her shopping lists and randomizers live on the Lists page creates an artificial split that doesn't match her mental model.
- **Resolution:** Sequential collections are visible on BOTH the Lists page and the Tasks — Sequential tab. Studio remains the universal library. The management experience (SequentialCollectionView) is the same regardless of which page launched it.

### 1D. Capability Tags on All Template Types

Add a `capability_tags` TEXT[] column to the `task_templates` table (for task-system templates) and the `list_templates` table or equivalent (for list templates), or store tags in the Studio seed data configuration.

Every template type gets tagged with descriptors that describe what it DOES, not what it IS:

**Sequential Collection:**
`tracks_progress`, `ordered_steps`, `curriculum`, `mastery`, `practice_count`, `one_at_a_time`, `drip_feed`, `learning_path`, `skill_building`, `homeschool`

**Randomizer:**
`variety`, `surprise`, `draw_pool`, `mastery`, `practice`, `no_decision_fatigue`, `enrichment`, `chore_wheel`, `fun`

**Routine:**
`daily_checklist`, `recurring`, `sections`, `different_days`, `linked_content`, `morning_routine`, `school_routine`, `chore_routine`

**Simple Task:**
`one_time`, `assignable`, `due_date`, `quick_action`, `to_do`

**Opportunity (Repeatable/Claimable/Capped):**
`bonus_work`, `earn_rewards`, `job_board`, `claim_lock`, `family_economy`

**Shopping List:**
`ongoing`, `store_sections`, `purchase_tracking`, `family_shared`, `bulk_add`

**Wishlist:**
`gift_ideas`, `urls`, `prices`, `occasions`, `shared`

**Packing List:**
`trip_planning`, `sections`, `progress_bar`, `reusable`, `family_shared`

**To-Do List:**
`quick_capture`, `promote_to_task`, `lightweight`, `scratchpad`

**Expenses List:**
`spending_tracking`, `categories`, `running_total`, `budget`

**Custom List:**
`flexible`, `any_fields`, `sections`, `general_purpose`

**Prayer List:**
`spiritual`, `ongoing`, `personal`, `reflective`

**Ideas List:**
`brainstorm`, `someday`, `capture`, `creative`

**Backburner:**
`not_now`, `parking_lot`, `monthly_review`, `activate_later`

**Habit Tracker:**
`daily_check_in`, `streak`, `consistency`, `behavior_change`

**Widget:**
`dashboard_display`, `at_a_glance`, `countdown`, `progress_visual`, `weather`, `quick_actions`

**Gamification:**
`fun`, `motivation`, `rewards`, `achievements`, `points`, `visual_world`

> **Decision rationale:** Tags are stored as arrays rather than a rigid taxonomy because the same tool can serve wildly different use cases. A randomizer list can be a chore wheel, an enrichment rotation, or a date night idea generator. Tags let semantic search find the right match without forcing mom into a category.

### 1D Schema

**Option A (on existing tables):** Add `capability_tags TEXT[]` to `task_templates` and add a `capability_tags` field to Studio seed data configuration objects.

**Option B (separate config):** Create a `studio_template_metadata` table or JSONB config that stores tags alongside template type definitions. This keeps the tags out of the runtime data tables.

**Recommendation:** Option B — tags are a Studio presentation concern, not a runtime data concern. Store them in the Studio seed data configuration alongside the existing template definitions. This means Phase 2's search can query them without touching the production tables.

---

## Phase 2: Intent-Based Studio Search & Use Case Categories

**Status:** Approved for build (after Phase 1)
**Scope:** Studio UX enhancement — search, categorization, and guided selection

### 2A. "What Do You Want to Create?" Search Bar

A prominent search/filter input at the top of the Studio page. Mom types a phrase describing what she wants to accomplish, and Studio filters to show the most relevant template types.

**How it works:**

1. Mom types: "track my kids progress through math curriculum"
2. Search compares input against capability tags using either:
   - **Simple approach:** Keyword matching against the tags array. "progress" matches `tracks_progress`, "curriculum" matches `curriculum`, "math" matches `homeschool` + `learning_path`.
   - **Smart approach (recommended):** Embedding-based semantic search. Generate an embedding for mom's input, compare against pre-computed embeddings for each template type's tag set + description. Uses the existing pgvector infrastructure and `text-embedding-3-small` model. Cost: negligible (one embedding per search, against a fixed set of ~15-20 template type embeddings).
3. Results ranked by relevance. Top matches shown with:
   - Template type name and icon
   - One-line description of what it does
   - "Best for: [use case]" tagline
   - [Create] button that opens the appropriate creation flow

**Fallback:** If no good match, show all template types with a message: "Not sure what fits? Browse all options below, or tell LiLa what you need." (LiLa link is Phase 3.)

### 2B. Use Case Categories (Browse by Outcome)

In addition to (or replacing) the current tool-type categories in Studio, organize templates by what mom is trying to do:

| Category | Icon | Template Types Included | Tagline |
|----------|------|------------------------|---------|
| **Track Progress Through Content** | BookOpen | Sequential Collection, Reading List template | "Ordered content your kids work through step by step" |
| **Daily Practice & Variety** | Shuffle | Randomizer, Routine with linked steps | "Keep things fresh with rotating practice and daily variety" |
| **Build Skills & Master Goals** | Target | Sequential (mastery mode), Randomizer (mastery mode), Habit Tracker | "Practice, track, and celebrate skill development" |
| **Organize & Plan** | ClipboardList | Shopping List, Packing List, To-Do, Custom, Expenses | "Lists for the practical stuff of life" |
| **Assign & Manage Work** | Users | Tasks, Routines, Opportunities, Sequential (chore mode) | "Assign, track, and approve family responsibilities" |
| **Monitor & Measure** | BarChart3 | Trackers, Widgets | "Keep an eye on what matters with dashboards and data" |
| **Capture & Hold** | Bookmark | Ideas, Backburner, Prayer, Custom | "Park things for later without losing them" |
| **Fun & Motivation** | Sparkles | Gamification overlays, Achievement badges | "Make the work feel like play" |

**Key behavior:**
- Some template types appear in multiple categories (Sequential Collection is in both "Track Progress" and "Assign & Manage" depending on how it's configured)
- Each category card expands to show its template types with descriptions
- Mom can still switch to a flat "All Types" view if she prefers browsing by tool type

### 2C. Template Type Cards with Context

Each template type card in Studio (whether found via search or browse) should include:

- **Name and icon** (existing)
- **One-line description:** What it does in plain language
- **"Best for:" tagline:** 2-3 concrete use cases. "Best for: math curriculum chapters, reading lists, badge requirements"
- **Key capabilities:** 3-4 tag pills showing what makes it special. "Mastery tracking · Ordered progress · Mom approval"
- **[Create] button** that opens the appropriate creation flow
- **[See examples]** link that shows example templates (existing Studio seed data examples)

### 2D. Smart Recommendations After Creation

After mom creates a new item (sequential list, randomizer, etc.), Studio can suggest next steps:

- "Want to link this to a daily routine?" — opens Routine Section Editor with a linked step pre-configured
- "Want to add this to a Learning Path?" — opens BigPlan creation (when built) with this as the first milestone
- "Want to deploy this to another child?" — opens the deployment flow
- "Save as a reusable template?" — saves to Studio library

These are optional suggestion cards, not required steps. Dismissable. They appear once and don't nag.

### 2E. "My Library" Tab Enhancement

Studio's "My Customized" tab (rename to "My Library"?) should show ALL created items across both tables:

- Deployed sequential collections (from `sequential_collections` table)
- Deployed randomizer lists (from `lists` table where `list_type = 'randomizer'`)
- Deployed routines (from `task_templates` where `template_type = 'routine'`)
- All other deployed templates
- Undeployed/saved templates (the curriculum library concept from the Linked Steps addendum)

Each item shows: name, type badge, deployment status (deployed to [names] / undeployed), last modified date. Filterable by type, by child, by tag.

This makes Studio the single management surface for mom's entire content library, regardless of which database table an item lives in.

---

## Phase 3: LiLa-Guided Creation (Forward Note)

**Status:** Future development — depends on PRD-05 (LiLa guided modes), PRD-18 (Rhythms), PRD-29 (BigPlans)
**Captured here for architectural awareness**

### 3A. "Help Me Choose" Conversational Flow

A LiLa guided mode accessible from Studio where mom describes what she wants conversationally and LiLa recommends the right tool type, explains why, and offers to create it.

**Guided mode name:** `studio_create_guide`

**Context loaded:** All template types with capability tags, descriptions, and use case examples. Family member names and shell types. Existing deployed items (to avoid duplicating what already exists).

**Example conversation:**
- Mom: "I want to set up something for my kids to practice geography"
- LiLa: "A few options could work here. If you want them to practice random geography facts daily with variety, a Randomizer in Surprise Me mode would draw a different topic each day. If you want them to work through a structured list of countries/capitals in order, a Sequential Collection with mastery advancement would let them practice each one until they've got it. Which sounds more like what you're after?"
- Mom: "The surprise one sounds fun for Jake, but I want Miriam to do the structured one."
- LiLa: "Got it. I'll create a Geography Enrichment randomizer for Jake and a Countries & Capitals sequential list for Miriam. Want me to link both to their school routines?"

**Output:** LiLa generates the items, presents them for review (Human-in-the-Mix), mom approves, items are created and optionally linked to routines.

### 3B. Full Conversational School Year Planner

Extension of 3A where mom describes an entire school year and LiLa generates the complete structure — multiple sequential lists, randomizers, a routine with linked steps and section frequencies, and a BigPlan container. See the Linked Steps/Mastery Advancement Addendum forward note for the full vision.

### 3C. Smart Studio Suggestions Based on Family Activity

LiLa proactively suggests tool types based on what the family is doing:
- "You've been manually creating tasks for scripture study every day. Want me to set up a sequential collection so it auto-advances?"
- "Jake has 12 one-off tasks about skateboard tricks. Want to convert these into a mastery-enabled randomizer?"

These surface as gentle suggestion cards in Studio or on the Dashboard. Not pushy. Dismissable. Only shown when confidence is high.

---

## Cross-PRD Impact

### PRD-09A: Tasks, Routines & Opportunities

| Area | Change | Details |
|------|--------|---------|
| Sequential Collection creation | **FIX** | Wire SequentialCreator and useCreateSequentialCollection. Currently broken everywhere. |
| Tasks — Sequential tab display | **UPGRADE** | Replace inline rendering with revived SequentialCollectionView for full PRD-09A Screen 6 experience. |
| TaskCreationModal | **GUARD** | Add guard clause for `taskType='sequential'` — route to SequentialCreator instead of broken inline creation. |
| createTaskFromData | **GUARD** | Prevent silent broken-record creation for sequential type. |

### PRD-09B: Lists, Studio & Templates

| Area | Change | Details |
|------|--------|---------|
| Lists page type picker | **ADD** | Add 'randomizer' to the hard-coded type grid. One-line fix. |
| Lists page | **ADD** | Query and display sequential collections alongside regular lists. Distinct visual treatment. |
| Lists page creation | **ADD** | "Sequential Collection" as a creation option, opens SequentialCreator. |
| Studio browse model | **EVOLVE** | Add use case categories (Phase 2) alongside existing tool-type categories. |
| Studio seed data | **ADD** | Capability tags on all template type definitions. |
| Studio search | **ADD** (Phase 2) | Intent-based search bar with semantic matching against capability tags. |
| Studio "My Customized" tab | **ENHANCE** (Phase 2) | Show all deployed items across both lists and tasks tables. Rename to "My Library." |

### PRD-10: Widgets, Trackers & Dashboard Layout

| Area | Change | Details |
|------|--------|---------|
| Studio template types | **ADD** | Capability tags for tracker and widget template types. |
| Studio categories | **ADD** (Phase 2) | Trackers and widgets appear in "Monitor & Measure" use case category. |

### PRD-05: LiLa Core AI System (Phase 3 only)

| Area | Change | Details |
|------|--------|---------|
| Guided modes | **ADD** | `studio_create_guide` mode for conversational tool selection. |
| Context assembly | **ADD** | Template types with capability tags loaded as context for creation guidance. |

### CLAUDE.md Convention Updates

| Convention | Change |
|------------|--------|
| Three-page model | **EVOLVE** | "Studio is the universal creation and library surface. Created items display on whatever page makes sense for the user's mental model. Sequential collections are visible on both Tasks — Sequential and Lists. The original three-page model (Studio — Tasks — Lists) is a deployment architecture, not a user-facing constraint." |
| Sequential collections | **ADD** | "Sequential collections are creatable from Studio, Tasks — Sequential tab, and Lists page. All three entry points use the same SequentialCreator component and useCreateSequentialCollection hook." |
| Capability tags | **ADD** | "All Studio template types have capability_tags describing what they DO, not what they ARE. Tags power the intent-based search in Studio and future LiLa creation guidance." |
| Studio search | **ADD** (Phase 2) | "Studio search uses semantic matching against capability tags. Simple keyword matching for Phase 2; embedding-based for optimization if needed." |

---

## Decisions Made This Session

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Fix sequential creation wiring before anything else** | Sequential creation is broken everywhere — critical bug that blocks all downstream work. Dead code exists and just needs to be wired. |
| 2 | **Deliberate evolution from three-page model** | The Linked Steps/Mastery Advancement Addendum transforms sequential collections into curriculum building blocks. Mom thinks "lists of content," not "task-system items." UI should follow the user's mental model, not the database schema. |
| 3 | **Sequential collections visible on both Tasks and Lists** | Dual access, not moved. Tasks — Sequential keeps the rich management experience. Lists page provides discoverability alongside other list-shaped content. |
| 4 | **Studio as the universal creation hub** | Instead of adding creation buttons to every page, make Studio so good that mom naturally starts there. Intent-based search + use case categories + smart recommendations after creation. |
| 5 | **Capability tags as the foundation for intelligent search** | Tags describe what tools DO, not what they ARE. Stored on seed data config, not runtime tables. Powers both keyword search (Phase 2) and future semantic search and LiLa guidance (Phase 3). |
| 6 | **Use case categories in addition to tool-type categories** | Mom browses by outcome ("Track Progress Through Content") not by architecture ("Sequential Collections"). Some tools appear in multiple categories because they serve multiple use cases. |
| 7 | **"My Library" as the unified management surface** | Studio's My Customized tab should show ALL created items across all tables — sequential collections, randomizer lists, routines, trackers, everything. One place to see and manage the whole family content library. |
| 8 | **Phase 3 depends on LiLa guided modes** | Conversational creation is the north star but requires PRD-05, PRD-18, and PRD-29 infrastructure. Captured as forward note, not committed to a build date. |
| 9 | **Smart recommendations after creation are suggestions, not requirements** | "Want to link this to a routine?" cards are optional, dismissable, shown once. Not a required workflow step. Providing value, not demanding engagement. |

---

## Tier Gating

| Feature Key | Description | Tier |
|-------------|-------------|------|
| `studio_browse` | Studio browsing and template deployment | Essential |
| `studio_search` | Intent-based search with capability tag matching | Enhanced |
| `studio_use_case_categories` | Use case category browse alongside tool-type browse | Essential |
| `studio_smart_recommendations` | Post-creation suggestion cards | Enhanced |
| `studio_my_library` | Unified library view across all table types | Essential |
| `studio_lila_create_guide` | Conversational creation with LiLa (Phase 3) | Full Magic |

All features return true during beta.

---

## Build Sequence

### Phase 1 (immediate — audit fix session):
1. Fix sequential creation wiring (revive SequentialCreator, wire to useCreateSequentialCollection)
2. Fix SequentialCollectionView on Tasks — Sequential tab
3. Guard createTaskFromData against broken sequential creation
4. Add 'randomizer' to Lists page type picker
5. Add sequential collections to Lists page (query + display + creation entry point)
6. Add capability tags to Studio seed data configuration
7. Tests: sequential creation from Studio + Tasks + Lists, all producing correct DB records

### Phase 2 (follow-up build session):
1. "What do you want to create?" search bar on Studio page
2. Semantic matching against capability tags (keyword-based first, upgrade to embedding if needed)
3. Use case category cards on Studio browse
4. Enhanced template type cards with descriptions, "Best for" taglines, capability tag pills
5. "My Library" tab showing all deployed items across tables
6. Post-creation smart recommendation cards
7. Tests: search returns relevant results, category browse works, My Library shows cross-table items

### Phase 3 (future — after PRD-05 + PRD-18 + PRD-29):
1. `studio_create_guide` LiLa guided mode
2. Conversational tool selection and creation
3. Full school year planner
4. Proactive Studio suggestions based on family activity patterns

---

## Build Sequencing Across Related Addenda

This addendum is one of three April 6, 2026 artifacts that must be built in dependency order:

**Session 1 (this addendum's Phase 1 — immediate):**
Fix sequential creation wiring + randomizer on Lists page + sequential on Lists page + capability tags. This is the critical bug fix and data foundation. Blocks everything downstream.

**Session 2 (the Linked Steps / Mastery / Advancement Addendum):**
Advancement modes, `practice_log` table, linked routine steps, `curriculum-parse` Edge Function, Reading List template, routine duplication with linked step resolution. Depends on Session 1 — cannot extend sequential collections with advancement modes until sequential creation actually works.

**Session 3 (this addendum's Phase 2):**
Studio intent-based search, use case categories, enhanced template cards, My Library tab, post-creation recommendations. Depends on Session 2 — no point making Studio smart about finding tools that don't yet have advancement modes and linked step capabilities.

**Session 4+ (this addendum's Phase 3 — future):**
LiLa-guided creation, conversational school year planner. Depends on PRD-05 LiLa guided modes, PRD-18 Rhythms, PRD-29 BigPlans. Captured as forward note.

---

## CLAUDE.md Additions from This Addendum

- [ ] Studio is the universal creation and library surface. Created items display on whatever page makes sense for the user's mental model, regardless of underlying storage. Sequential collections are visible on both Tasks — Sequential and Lists.
- [ ] All Studio template types have `capability_tags` describing what they DO, not what they ARE. Tags power intent-based search and future LiLa creation guidance.
- [ ] Sequential collections are creatable from Studio, Tasks — Sequential tab, and Lists page. All three entry points use the same SequentialCreator component and useCreateSequentialCollection hook.
- [ ] `createTaskFromData()` has a guard clause for `taskType='sequential'` — it must never silently create a broken single-task record. Sequential creation is handled exclusively by useCreateSequentialCollection.
- [ ] Studio browse supports both tool-type categories (existing) and use-case categories (new). Some template types appear in multiple use-case categories.
- [ ] Post-creation recommendation cards in Studio are suggestions, not required steps. Dismissable. Shown once. Follow the "providing value, not demanding engagement" principle.

---

*End of Addendum*
