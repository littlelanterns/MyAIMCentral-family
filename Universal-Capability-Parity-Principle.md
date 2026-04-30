# Universal Capability Parity — Founder Principle

**Status:** Draft v2 for founder review, 2026-04-29
**Source sessions:** Daily Progress Marking detour ship (2026-04-28), Universal Capability Parity discovery 1 (2026-04-28), parity scoping conversation with Tenise (2026-04-28→29), discovery 2 verification (2026-04-29)
**Related docs (does NOT supersede):** `Composition-Architecture-and-Assembly-Patterns.md` §1.1 + §1.2, `PRD-09A-Daily-Progress-Marking-Addendum.md`, `Linked-Steps-Mastery-Advancement-Addendum.md`, `Connector-Architecture-and-Routing-Model.md`, `claude/web-sync/Universal-Capability-Parity-Discovery-Report.md`, `claude/web-sync/Universal-Capability-Parity-Discovery-Report-2.md`, `Composed-View-Surfaces-and-Wishlists.md`, `Master-Plans.md`

---

## Why this doc exists

The Composition Architecture doc names primitives (Section 1.1) and properties (Section 1.2) separately. It catalogs which properties apply to which primitives. It does not state — but the founder intends — that **every primitive should eventually expose every capability that makes sense for it, reachable through a consistent "Configure Item" entry point on every item wherever it renders.**

That principle is what the Daily Progress Marking detour build (commit 3f0f604, 2026-04-28) was the first slice of. Daily Progress Marking shipped track_progress + track_duration + soft-claim on tasks and routine steps. It did not ship those capabilities on list items, sequential items in their list-context, randomizer items in their list-context, or habits — that was scoped out, not because they don't apply.

This doc names the principle. Future builds extend the capability surface until parity holds.

## The principle in plain English

When mom looks at any thing in the app — a task, a list item, an item inside a sequential collection, an item inside a randomizer, a routine step, a habit, anything else mom can touch — she can tap a three-dot menu on that thing and reach the same set of capabilities. The capability set is universal. The per-primitive applicability is determined by what the data model actually supports, not by which feature scope first introduced the capability.

## The capability set

These are the capabilities that should be reachable from "Configure Item" on every primitive where they apply:

1. Track daily progress ("worked on this today")
2. Track time spent / duration
3. Counts for allowance
4. Counts for points / gamification
5. Counts for homework
6. Mark as victory on completion
7. Require approval
8. Advancement mode (complete / practice_count / mastery)
9. Attach a reward
10. Sharing / multi-assignee
11. Soft-claim (who's currently working on it)
12. Schedule / due date / recurrence
13. Categorize / life area tag (multi-value via `life_area_tags` array)
14. Mark as a milestone
15. Include in LiLa AI context
16. Resource URL
17. Image / icon
18. Notes / description
19. Subtasks (Task Breaker)

This list is not closed. Future capabilities added to the platform are added to this set and propagated across all applicable primitives.

## Configure Item editor — two surface patterns

The Configure Item entry point has two surface patterns, chosen by primitive type, both already partially shipped.

### Inline pattern (lists, list items)

Item expands in place; smart-sorted primary capability set; "More options" for the full set; small contextual dropdowns for single-value selectors (section, category); "Apply to other items?" affordance surfaces after Done with a multi-select picker. Other items in the list stay visible throughout. Already shipped on grocery list — see `Lists.tsx` inline editing with section dropdown.

This pattern is the right shape for primitives where the items are independent of each other (each grocery item, each wishlist entry, each opportunity item). Mom can edit one without needing to see the structure of the rest.

### Routine context view (routines, routine steps)

Edit opens the whole routine — sections visible with their frequency rules, all steps in their place, step being edited highlighted. Inline editing is supported within this view too. The full-routine view is the right pattern because routine steps are interconnected through section-level rhythms (Daily / MWF / Weekly / etc.) and seeing that structure is part of editing well.

**What's currently missing from the routine view (gap to fill):** Per-step assignment visibility. Mom can't see at a glance who each step is currently assigned to — particularly important for shared routines with rotation patterns. Adding "Currently assigned to: [Member name(s)]" to each step in the routine view is part of the parity work for shared routines.

### Both patterns share the underlying capabilities

- Smart-sorted by mom-frequency. The primary capability set auto-arranges to surface what mom uses most, same pattern as QuickTasks. Per-mom adaptive, not predefined.
- Inheritance is bulk-set-then-override. Capabilities configured at a parent level (list, sequential collection, routine, section) propagate to items by default. Per-item override is always available.
- Cross-item application is offered, not assumed. When mom configures one item, the system asks "want to apply these settings to other items in this list?" with a multi-select picker.
- Sharing is a capability among many, not a separate concern. Sharing composes orthogonally with every other capability.
- Mobile uses the same patterns (inline expand on list items, full-routine view on routines), with FAB-triggered bottom sheets for the secondary capability palette where helpful (per BookShelf chapter jump pattern).
- Auto-save with prompt-on-leave. Edits save as mom navigates between items. If she tries to leave with pending changes, the system prompts "Save your changes?"

## Deployed instances — content is shared, state is per-viewer

When a routine, list, or sequential collection is deployed to multiple kids, the system points multiple views at one source-of-truth content record.

- **What's shared:** title, steps, schedule, capabilities, structure — the content itself.
- **What's per-kid:** completion state, soft-claim, progress tracking, attribution data.

Mom's edits to content write to source. All views update because they all point at the source. No clones, no per-instance overrides on content fields, no propagation logic.

A kid's "edit" is recording their completion — a per-kid state operation, not a content edit. The two operations target different tables and never conflict.

**Per-kid customization happens by fork.** If mom wants Mosiah's routine to be different from Helam's, she copies the routine, customizes the copy, and assigns the appropriate kids to each version. The fork creates a new source-of-truth.

**Mom picks instantiation_mode per deployment.** For a given routine deployment, mom configures whether it's `shared_anyone_completes` (one source, all kids view it — co-op subjects, family devotional, household work that anyone can claim) or `per_assignee_instance` (each kid gets their own — individualized math, individualized reading list). A single routine can mix sections of both kinds. See File 3 (Master Plans) for how this composes into multi-faceted planning surfaces.

## Content edit timing — Now or Next cycle

When mom edits content on a deployed routine/list/collection, she chooses when the change takes effect:

- **Now** — write immediately to source-of-truth; the change applies to the current rotation/cycle in motion AND all future cycles. Used for mid-rotation fixes (a step is wrong and shouldn't continue as-is).
- **Next cycle** — stage the change; merge into source-of-truth at the next deployment trigger (next rotation, next week, next manual deploy). Used to avoid disrupting work already in motion.

**Defaults are type-aware:** typo fixes default to Now, structural changes (adding/removing steps, schedule or capability changes) default to Next cycle. Mom can flip either way per edit.

**For variants, far-future schedules, or different kids: mom forks.** Copying a routine creates a new source-of-truth that mom can customize, schedule, and deploy independently. The fork is the right pattern for "I want a different version" — not an override on the original. Forks handle far-future schedules ("start using this next school year") naturally because the fork itself can be scheduled for deployment.

**For Workers 2/3/4 implementation:** Ship the basic two-option choice. Schema needs a way to stage pending changes (pending_changes table, or staged_for_next_deployment flag on relevant content tables). The Apply Changes dialog mom sees lists which kids' deployments will be affected so she can make an informed call.

## Scope of this build: work-and-reward shape lists

This build focuses on the work-and-reward shape of lists — chores, opportunity lists, sequential learning collections, randomizer activity pools, custom to-do lists, idea lists, backburner, habit, consequences. Items in these lists are work units that mom configures with the full universal capability surface.

Other list shapes exist or will exist — shopping, packing, wishlist, expenses, prayer, maintenance, records, family password vaults, and shapes we haven't yet defined. They have their own capability needs that will be addressed by their own future capability work.

**Components built during this build must remain extensible.** The Configure Item editor, capability palette, bulk-add UX, image-attaching, URL handling, AI context toggle, sharing controls, and inheritance resolution must accommodate future list shapes plugging in. Don't hardcode "this only works on work-and-reward lists." Build the capability surface so primary capability sets adapt per list shape.

The architecture is a Lego model where lists have properties, not a closed taxonomy of list types. Future list shapes will have their own property combinations and capability needs.

## The 8-primitive matrix is implementation-shaped, not architecture-shaped

The discovery report's parity matrix uses 8 primitive columns: standalone task, recurring task, static routine step, linked routine step, sequential item, randomizer item, plain list item, habit.

That reflects the current code, not the architecture. Architecturally, there are fewer, more uniform primitives:

- **Task** (with task_type and recurrence properties — covers standalone, recurring, habit, sequential children)
- **List** (with four behavior properties: presentation_mode, is_browsable, is_opportunity, pick_n)
- **List item** (with item-level properties — covers all list_items regardless of parent presentation_mode)
- **Routine step** (with step_type — covers static and linked)

The current code has 3 storage shapes for what should be one thing — a sequential collection lives in `sequential_collections`, a randomizer in `lists` with `list_type='randomizer'`, a plain list in `lists` with another `list_type`. Future schema consolidation collapses the implementation. Until it does, capability work treats the architectural model as primary and handles the implementation split internally. Mom never sees the three paths — from her seat, it's one list with switches.

## The counting and crediting mechanisms

When mom toggles "this counts for allowance," "this counts for homework," attaches a reward, or marks something as a victory, multiple distinct mechanisms are in play. They're not the same shape and they need different runtime behavior. This is an open list — new mechanisms join as they're designed.

**Currently identified mechanisms:**

1. **Numerator (allowance pool)** — required floor work, advances the kid's pool fraction (12/15 chores done). `tasks.counts_for_allowance=true` today.
2. **Numerator bonus / extra credit** — work above the floor, advances the numerator past 100% with mom-selected pool target. Phase 3.5 mechanism.
3. **List-completion requirement** — pool requirement says "complete 3 items from List X" satisfies a pool. Practice sessions on items can count toward the 3-of-X (track_progress integrates). Pool-level configuration, not per-item.
4. **Complete-the-whole-list-as-job** — packing or shopping list completion is the work unit. List-level or task-level credit, not per-item.
5. **Direct points / gamification** — points fire at completion. Item-level. Separate currency from money.
6. **Direct rewards** — money, prize, custom item, or experience attached to the item. Fires when the work completes per the item's advancement_mode.
7. **Reward distribution on shared collaborative items** — multiplication (per_contributor vs single_shared) × split method (by_sessions, by_duration, equal_shares, submitter_only). Mom-configured per item with list-level defaults.
8. **Earnings against a wishlist target** — "Add as reward" promotes a wishlist item to a reward target tied to specific qualifications. Connector-layer mechanism (Phase 3+).
9. **Counts for homework** — separate currency from allowance, feeds homework tracking infrastructure (PRD-28B).
10. **Counts for victory** — celebration credit, fires a victory record at completion. Item-level toggle with list-level defaults.

**For the immediate parity work,** the toggles for these mechanisms get added at item level as configuration surfaces. Some wire to existing pipelines today (allowance numerator on single pool, gamification points, direct rewards, victory). Some are captured as configuration intent for connector-layer work to realize correctly when that ships.

## Critical fix from Discovery 2: allowance attribution on shared tasks

The current `calculate_allowance_progress` RPC credits `tasks.assignee_id` (the primary assignee column), NOT the actual completer from `task_completions.family_member_id`. For a shared task where Helam completes a chore Mosiah is primary on, **Mosiah currently gets the allowance credit** — wrong behavior.

Routines work correctly today (they credit the actual completer via `routine_step_completions.member_id`). Standalone shared tasks do not.

**This must be fixed in Workers 2/3/4 scope.** Without the fix, shared tasks ship with broken allowance attribution. Workers 2/3/4 is therefore not just "shared semantics + UX" — it includes auditing and fixing existing single-assignee assumptions in the systems that sharing touches. Allowance is the documented case; other systems may need similar fixes.

## Per-capability inheritance resolvers (V9 finding)

Daily Progress Marking shipped `resolveTrackingProperties.ts` as a single-source-of-truth helper for `track_progress` + `track_duration` inheritance. It is the ONLY single-source-of-truth resolver. All other capability inheritance is ad-hoc across 10 distinct creation paths (opportunity claim, sequential creation, sequential restart, routine duplicate, randomizer spinner, task breaker, rhythm capture, mindsweep-lite, horizon task breaker, generic createTaskFromData).

**The parity build creates a family of per-capability resolvers** following the same three-tier pattern (item value → list defaults → fallback). Each resolver is independently testable, composable, and addable incrementally:

- `resolveTrackingProperties` (existing)
- `resolveRewardProperties` — reward type, amount, distribution mode, split method
- `resolveAllowanceProperties` — counts_for_allowance, future pool target
- `resolveHomeworkProperties` — counts_for_homework, subject IDs
- `resolveSchedulingProperties` — due date, recurrence, schedule overrides
- `resolveCategorizationProperties` — life_area_tags, category, milestone flag
- `resolveAccessProperties` — sharing, soft-claim, instantiation mode, collaboration mode
- (Additional resolvers as new capability families emerge)

The audit work: walk through the 10 ad-hoc creation paths and route each through the appropriate resolvers. This is significant work but architecturally clean.

## Reward distribution on shared collaborative items

When an item is shared+collaborative (multiple kids contribute to one instance), reward distribution is mom-configurable on two questions:

1. **Reward multiplication** — `per_contributor` (each gets their own reward) OR `single_shared` (one reward distributes among contributors)
2. **Reward split method** (only when multiplication = single_shared) — `by_sessions`, `by_duration`, `equal_shares`, or `submitter_only`

Defaults adapt to reward type — money likely defaults to "single shared / equal," movies-for-everyone defaults to "per contributor," victories default to "per contributor" since celebration isn't a finite resource. This logic lives in the connector layer; the capability surface in the current build just needs to expose the configuration.

## Three shapes of shared items

Shared items resolve via two properties: `instantiation_mode` (existing as JSONB sub-field) + `collaboration_mode` (new column to add during parity work).

- **Per-assignee instance** — each kid gets their own copy. Skill mastery (each body learns).
- **Shared + solo-claim** — one copy, one kid claims at a time, only that kid can submit. Existing opportunity-list pattern. Used for shared chore lists where one person does each item.
- **Shared + collaborative** — one copy, multiple kids contribute, whoever finishes submits, reward distributes per mom's configured mode. Used for shared projects (treehouse, garage cleanup).

Real cases: skill mastery is per-assignee. Opportunity jobs are shared+solo. Shared building/cleaning projects are collaborative.

**Promote `instantiation_mode` from JSONB sub-field to top-level column** during parity work, alongside adding `collaboration_mode`. Both as enum columns on the relevant tables (tasks, lists, routine sections). Migration is structural; existing JSONB consumers update to read the column.

## Visibility for soft-claims on list items

When an item is soft-claimed (a kid is actively working on it), other family members still SEE the claim — outlined in the claimer's color with "Currently Claimed by [Name]" indicator. The claim button is disabled for non-claimers. Other kids who want to take over use the existing Ask Mom path (PRD-15 family_requests). Mom can always override / re-attribute.

**We reward action, not interest.** Soft-claim is action-triggered (first practice / first work session), never interest-triggered. Pre-task interest doesn't get a claim.

**Implementation note (V5 finding):** The list detail view does NOT currently join to tasks generated from list items. Adding the claim visibility requires a new join + render path — query for active tasks where `source_reference_id = list_item.id`, read `in_progress_member_id` from those tasks, render the colored outline + "Currently Claimed by [Name]" indicator on the list item card.

## Per-item scheduling overrides natural flow

Most items inherit the parent's pattern (sequential progresses naturally, randomizer draws when invoked, plain list items don't have dates). Per-item scheduling override allows specific items to be scheduled on a specific date/time, jumping the queue or replacing the natural flow for that occurrence.

Real cases: live curriculum lessons inserted into sequential math, birthday reveals scheduled on a date instead of a trigger, weekly chores in a daily-rotation chore list, the front door glass washed weekly while kids' toilet is daily.

**Implementation note (V6 finding):** Per-item scheduling on non-opportunity list items is entirely new infrastructure. `list_items` has no date/time columns. The Universal Scheduler integrates with tasks, lists (list-level), calendar events, and meetings — but not list items individually. Adding per-item scheduling means new columns + Scheduler integration at the list-item level.

## Per-step capabilities on routine steps

All capabilities are configurable at the step level, with parent-routine defaults and per-step override. No exceptions. Real cases that drive this:

- Schedule per step: chore steps already scheduled MWF inside daily routines.
- Sharing per step: feed-the-dogs is shared across the family inside an around-the-house routine; take-trash-to-the-road is restricted to oldest kids + husband for safety reasons (NOT shared with the 7-year-old). Same routine, different roster per step.
- Allowance per step: "feed the dogs earns money but brushing teeth doesn't" — both inside the same morning routine.

## Habit is a real distinct primitive

`task_type='habit'` is worth being its own thing with its own UX. When mom picks "habit" as the task type, she gets a wizard that helps her set up tracking, visualization, and data points for review later. Bujo (bullet journal) groups treat habit tracking as foundational. Existing tracker-style patterns (habit grids, streak counters, calendar dots from the Widget Catalog) are the visual vocabulary habit can pull from.

## Milestone is in scope as a column; the bigger feature is later

`is_milestone` (and probably `tracking_tags TEXT[]`) get added as columns now to every primitive that should support it. Mom can flag milestones immediately. The milestone map view, completion receipts, and tracking_tags routing for compliance reporting are separate future builds. Adding the column now means data accumulates from day one rather than landing into an empty map view.

## LiLa AI context inclusion

`is_included_in_ai` at the item level on lots of primitives — same pattern as the existing `lists.is_included_in_ai` and `archives.is_included_in_ai`. Adds the toggle now (cheap), wires to context assembly later when LiLa context pipeline is ready for individual items. Mom flags what to include as data accumulates; downstream features (Wishlist as composed view, LiLa proactive pattern recognition) read from these flags.

## Resource URL normalization

`list_items.url` and `tasks.resource_url` store the same conceptual thing. Rename `list_items.url` to `list_items.resource_url` early in the parity work. Single migration, all code sites updated in the same commit (10 sites identified in Discovery 2).

The column stores a URL; smart behaviors (auto-grouping by domain, password pairing, store-domain filtering for wishlists, etc.) layer on per list shape as future work. The naming consistency carries forward to all future list shapes.

## life_area_tag → life_area_tags multi-tag migration

Convert `tasks.life_area_tag`, `task_templates.life_area_tag`, `victories.life_area_tag`, and `sequential_collections.life_area_tag` from single TEXT enum to `TEXT[]` array. Add `life_area_tags TEXT[]` to `list_items` (default null = inherit from parent list).

Pattern follows the `journal_entries.tags TEXT[]` migration with GIN index — proven, reusable. Cross-feature queries (LifeArea views, Activity Log filters, Victory routing, compliance reporting) update to array-contains semantics.

**ByCategoryView (and any other single-tag-grouping consumer):** During migration, read `tags[0]` for grouping (the first tag in the array). Behavior matches today's single-tag world. When real multi-tag use cases emerge, add a "Group by primary tag / Group by all tags" toggle. Don't pre-design that UI now.

**Why now, not Phase 3.5:** Doing it before Workers 2/3/4 ships shared tasks at scale means we don't migrate hot data later. Backfill (single value → single-element array) happens cleanly while data volume is manageable.

## category, section_name, and life_area_tags coexist on list_items (V10 finding)

These three columns serve genuinely different purposes:

- `section_name` (single TEXT) — visual grouping in the list detail view (store sections, packing categories). Drives display layout.
- `category` (single TEXT) — semantic categorization for filtering/weighting (randomizer draw weights, opportunity categories). Doesn't drive display layout.
- `life_area_tags` (TEXT[] array) — platform taxonomy. Drives cross-feature filtering, victory routing, compliance reporting.

All three coexist on `list_items`. They don't overlap functionally. The Configure Item menu surfaces each per its purpose.

**Future enhancement (inventory-and-reference list shapes — see File 2):** Multi-dimensional grouping where mom can switch the active grouping view between section_name and tags. Out of scope for the immediate parity build; captured as design intent.

## What this principle is NOT

- **Not a refactor of existing primitives.** The data model already supports most of the capability surface. Where it doesn't, additions are additive.
- **Not a manifesto for "every capability on every primitive forever."** Some combinations don't make architectural sense; surface them as questions for the founder, not as automatic exclusions.
- **Not in conflict with Composition Architecture.** Composition Architecture defines the Lego blocks. This doc says "every Lego block should have every standard connector port."
- **Not in conflict with Connector Architecture.** Connector Architecture defines what fires when an item's deed happens (the workflow engine). Capability parity defines what mom can configure on the item itself. They touch but they're orthogonal layers.
- **Not a closed taxonomy of list shapes.** Other list shapes (shopping, wishlist, family password vault, etc.) have their own capability needs and will get their own capability work. The components built here must remain extensible to accommodate them.

## Sequencing

Universal Capability Parity is sequenced as follows:

**NOW (alongside Workers 2/3/4):** Tightly-scoped parity additions that unblock real money flow for the founder's family AND fix the existing broken behaviors that sharing surfaces. Specifically:

- Allowance RPC fix: credit actual completers (`task_completions.family_member_id`) instead of `assignee_id` for non-routine shared tasks. Required for shared tasks to work correctly.
- Audit other systems for similar single-assignee assumptions; fix as found.
- `instantiation_mode` promoted from JSONB sub-field to top-level column.
- `collaboration_mode` added as new column (solo_claim vs collaborative).
- `list_items.url` → `list_items.resource_url` rename.
- `life_area_tag` → `life_area_tags` (TEXT[]) migration across tasks, task_templates, victories, sequential_collections; add `life_area_tags` to `list_items`.
- Per-capability resolver pattern introduced (resolveRewardProperties, resolveAllowanceProperties, etc.); audit the 10 ad-hoc creation paths and route through resolvers.
- Per-item attributes (rewards, opportunity subtypes) configurable on opportunity lists so kids can earn from "wash a window" vs "paint the wall" (different rewards) immediately.
- Existing single-pool numerator credit fires correctly on shared list items (after the actual-completer fix).
- Existing gamification points pipeline fires correctly on shared item completion.
- Existing direct rewards (`task_rewards` rows) fire correctly at completion per item's advancement_mode.
- Victory records fire correctly when `victory_flagged=true` on shared list items.
- Content edit timing UI: Now / Next cycle choice with type-aware defaults; pending_changes staging for "Next cycle" edits.
- Routine context view enhancement: per-step assignment visibility ("Currently assigned to: [Member name(s)]").
- Soft-claim visibility on list items (claimed items show outlined in claimer's color with "Currently Claimed by [Name]"; new join + render path).

**Workers 2/3/4 is therefore broader than just sharing UX.** It's "shared semantics + audit and fix existing single-assignee assumptions + the parity additions that make sharing land cleanly." Going in thinking it's just UX work undersizes the build.

**LATER (sub-build alongside Phase 3.5 multi-pool allowance):** Broader capability parity:

- Multi-pool selection — the boolean `counts_for_allowance` becomes a pool-target reference.
- Numerator bonus as a distinct mechanism separate from required-floor credit.
- List-completion requirement integration with track_progress (practice counts toward "3 of List X").
- Reward distribution on shared collaborative items — multiplication × split method runtime math.
- Universal "Configure Item" editor as a coherent thing — the inline + routine context view patterns shipped consistently across all primitives.
- Milestone column added across primitives (the column itself; the Milestone Map view is its own future build).
- `is_included_in_ai` at item level across primitives (the column itself; context-assembly wiring follows when pipeline ready).
- All schema-only and missing cells from the discovery report.
- Per-item scheduling on non-opportunity list items.

**LATER STILL (connector-layer / Phase 3+):** "Add as reward" — wishlist items as reward targets. Composed-view surfaces (Wishlist, Milestone Map, Family Feed, Standards Portfolio) with partial two-way editing. Master Plans as a first-class composable surface (see File 3).

This sequencing matches the founder's priority: assemble shared lists with full per-item attributes NOW so kids can start earning money on the existing pipelines (with the bug fix); finish the universal capability surface alongside the connector work that gives the wiring its proper shape.

## Master Plans constraint (see File 3)

The Master Plans pattern (composable parent containers with mixed shared and per-kid sections, where steps can resolve to per-kid linked sources) is captured as future work in File 3. It depends on connector layer and Phase 3.5+ infrastructure.

**Current parity work and Workers 2/3/4 must build extensible enough to accommodate this layer when it ships.** Specifically (these are examples, not an exhaustive list — build with the meta-principle that future additions should not break current foundations):

1. Per-step capabilities (sharing, schedule, allowance, etc.) must extend cleanly to per-kid linked source assignments.
2. Configure Item inline editor and routine context view patterns must work in a Master Plan editing surface.
3. The instantiation_mode framing must explicitly leave room for "per-kid linked sources" as a future variant beyond per_assignee_instance and shared_anyone_completes.
4. Routine schema must accommodate (without restructuring) a future junction table for per-kid step sources.

The meta-principle: **build extensible enough that future additions don't break what's there.** The four constraints above are examples of what we currently know we'll need; more will emerge as Master Plans is designed in detail.

## How this principle governs scoping decisions

When scoping any build, ask: **"Does this expand or fragment the capability surface?"**

- **Expand** = the build adds a capability to a primitive that didn't have it, or extends a capability across more primitives. Aligned with the principle.
- **Fragment** = the build adds capability to one primitive in a way that makes the consistent-menu pattern harder to ship later. Surfaces as a scoping concern.

## Companion CLAUDE.md convention (proposed text)

> **Universal Capability Parity Principle (PRD-09A/09B foundation, 2026-04-28).** Every primitive that mom can configure should eventually expose the same set of capabilities through a consistent three-dot "Configure Item" menu. The capability set is universal; per-primitive applicability is determined by the data model. The Daily Progress Marking detour build was the first slice. Future builds extend the surface until parity holds. Sequencing: tightly-scoped parity additions now alongside Workers 2/3/4 (including the allowance RPC actual-completer fix, the per-capability resolver pattern, instantiation_mode + collaboration_mode columns, life_area_tags multi-tag migration, content edit timing); broader parity sub-build alongside Phase 3.5; composed-view surfaces and wishlist-as-reward-target alongside connector layer (Phase 3+). See `claude/feature-decisions/Universal-Capability-Parity-Principle.md` for the full principle, capability list, scoping test, and sequencing detail. Composition Architecture §1.2 catalogs the properties; this principle says every applicable property should be reachable on every applicable primitive. Master Plans pattern (File 3) is future work that current builds must accommodate.
