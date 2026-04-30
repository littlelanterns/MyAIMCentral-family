# Composed-View Surfaces and Wishlists

**Status:** Draft v2 for founder review, 2026-04-29
**Source session:** Universal Capability Parity scoping conversation with Tenise (2026-04-28→29)
**Related docs:** `Composition-Architecture-and-Assembly-Patterns.md`, `PRD-07-InnerWorkings.md`, `PRD-06-Guiding-Stars-Best-Intentions.md`, `PRD-29-BigPlans.md`, `Connector-Architecture-and-Routing-Model.md`, `Universal-Capability-Parity-Principle.md`, `Master-Plans.md`

**Status of implementation:** OUT OF SCOPE for the immediate Universal Capability Parity work. This doc captures design intent so when wishlist / composed-view work happens, the decisions don't have to be re-derived.

---

## Why this doc exists

In the parity scoping conversation, the founder named multiple use cases for wishlists, shopping lists, and reference lists that revealed a broader architectural pattern: **some surfaces in the app aren't primitives, they're views composed from data that already lives in other primitives.**

Wishlists are the clearest case. A wishlist is not "a list of things to buy" — it's a **portrait of who this person is and what they're moving toward**, assembled from data that already lives in self_knowledge, guiding stars, best intentions, BigPlans, journal entries, plus its own data for things that don't have a natural home elsewhere.

This pattern generalizes. The Milestone Map, Family Feed, Standards Portfolio, Master Plans (see File 3), and likely future surfaces all follow the same shape: pull from underlying primitives, present a unified view, allow editing where natural.

## The wishlist surface

A wishlist holds:

**Direct wishlist data** (lives on the wishlist):
- Specific material wants — items with or without URLs ("Lego Friends Heartlake set, $50")
- Specific experiences wanted — "go to a trampoline park," "see the ocean"
- Free-text wants — "anything related to horses"

**Composed-view data** (pulled from other primitives):
- **Categories of favorites** (from `self_knowledge`): flavors, colors, scents, brands, music, authors
- **Things they enjoy doing** (from `self_knowledge` and `journal_entries`): "drawing horses," "building Lego scenes"
- **Goals they're working toward** (from `bigplans`): "save for a violin," "learn to ride a bike"
- **What they're working on** (from `best_intentions`): "be more curious about new things"
- **Values and identity** (from `guiding_stars`): "creativity, connection"

The wishlist is the surface where all of this is visible together.

## Wishlist requirements

**Bulk-add with progressive refinement.** Mom or kid brain-dumps items in seconds; refines later with URLs, images, notes. Reuses existing bulk-add infrastructure (mindsweep-scan, curriculum-parse, SmartImportModal patterns).

**Multiple "modes" of items in one list.** Title-only, title+URL, title+image, title+notes, category-of-favorites entries, free-text entries. All coexist in the same wishlist.

**Item-level capabilities required:**
- title, notes, resource_url (per the parity normalization), image
- per-item category/section grouping (the existing `list_items.category` field handles this)
- approximate price or price range (future addition or live in notes for now)
- "still wanted" state — kid changes their mind, mark dormant without deleting (could reuse existing archive pattern)

**Sharing patterns are nuanced.** Wishlists may be shared with grandparents (who see material wants and experiences), kept private from siblings, partial-shared with mom, or fully private for some items. The four-mode sharing matrix and per-item visibility controls accommodate this naturally — including per-item `is_included_in_ai` for what surfaces to LiLa.

## Partial two-way editing on composed views

When mom looks at Maya's wishlist and edits "favorite scent: lavender" pulled from self_knowledge, the edit writes back to self_knowledge — not to a wishlist-local copy. Wishlist refreshes; anywhere else that reads self_knowledge also reflects the change.

**Rule:** Common edits (title, notes, simple fields) write back to source from the view. Complex edits (advancement configuration, tracking setup, anything requiring source's full context) navigate mom to the source's own edit surface.

**Generalizes beyond wishlists.** The Milestone Map, Family Feed, Standards Portfolio, Master Plans, and future composed-view surfaces should follow the same pattern. Mom doesn't have to know "which primitive owns this data" to make basic changes — she edits where she's looking. Reduces friction across the system.

**Distinct from "deployed instances are views" pattern.** File 1 covers the case where a routine/list/collection is deployed to multiple kids — content is shared, state is per-kid, edits to content propagate. The composed-view pattern here covers a different shape: a single surface (wishlist) assembles content from multiple source primitives, and edits at the assembly surface write back to whichever source owns the data. Both are forms of "edit where you're looking" but they have different write-routing logic.

## Wishlist items as reward targets ("Add as reward")

Mom looks at a wishlist item ("Lego Friends Heartlake set, $50") and clicks "Add as reward." A reward configuration modal opens:

- What kind of reward? (Money toward purchase / The actual item once earned / Custom)
- What qualifies for earning it? (Pool threshold, specific task completion, mastery achievement, savings goal hit, milestone reached)
- When does it fire? (Stroke-of-event / threshold cross / completion)
- Who can earn it? (Just Maya, or shared)

Saving creates a reward configuration that **references the wishlist item** (via foreign key — `wishlist_reward_links` table or extending `task_rewards`). The wishlist item displays a "Configured as reward" indicator. When the qualification fires, the reward delivers — money toward purchase lands in the appropriate pool with a notation; "the actual item" generates a notification for mom; custom rewards run through `custom_reward_godmother`.

**Connector-layer territory.** This is Phase 3+ work. The wishlist surface needs to be addressable as a reward target — meaning a reward contract can reference a wishlist item by ID, and the wishlist item's display reflects when it's been configured as a reward.

## Bridge between aspiration and motivation

The wishlist isn't just a profile-portrait. It's the **bridge between what someone wants and what they have to do to earn it**. The kid sees their wants AND their progress toward earning them on the same surface. The aspirational and the actionable live together.

Different from a generic "earn points to spend at the prize box" because **the reward IS the specific thing the kid wanted**, not abstract currency. This is a meaningful motivational design pattern worth preserving.

## Wishlists belong to a different list shape

Wishlists are a different shape than work-and-reward lists (chores, opportunity lists, sequential learning collections, etc.). Items are things-being-tracked or aspired-to, not work units. The capability surface differs:

- title, notes, resource_url, image, category/section grouping
- access controls (who can view/edit/add to the list)
- list-shape-specific extensions (price range, "still wanted" state, image attachment, store-domain auto-grouping)

The work-and-reward capabilities (advancement_mode, counts_for_allowance, soft-claim, sharing semantics with reward distribution) don't apply directly to wishlists — though wishlist items can be PROMOTED to reward targets via "Add as reward," and that promotion creates the work-side configuration.

## Other list shapes follow similar patterns

Wishlists aren't the only list shape outside work-and-reward. Each has its own capability needs:

- **Shopping list** — quantity, unit, store category, brand preference URL, access controls. Connector destination for godmother actions (snack-rewards, pantry-low restocking, meal-plan ingredient routing). Living shopping list pattern (always-on, purchased items linger with strikethrough, recently-purchased tab) captured as design intent.
- **Family password vault** — URL paired with username/password, access controls, secure storage. Tap-to-fill behavior in the future.
- **Packing list** — completion-as-job rather than per-item rewards, pre-trip activation, reusable templates per trip type.
- **Prayer list / intention list** — items as ongoing intentions, no completion in the work sense, possibly tied to journaling reflection.
- **Maintenance list** — items as recurring inspections / replacements, schedule-driven, possibly connected to home inventory.
- **Records / expenses** — items as records, append-only, export-friendly, possibly connected to compliance reporting.

Each gets its own capability work when its priority emerges. The architecture is a Lego model — none of these are "types" of list, they're combinations of properties and item shapes.

## Multi-dimensional grouping for inventory-and-reference list items

Inventory items often carry multiple overlapping grouping dimensions — a grocery item is simultaneously at a specific store, in a food category, in a meal-use category, possibly in a numbered aisle. Mom views the list through whichever dimension currently matters: at Costco, sort by store; meal planning, sort by meal use; in the store, sort by aisle.

**Today's schema has `section_name` (single, used by shopping/packing for visual grouping) and `category` (single, used for semantic categorization) as separate single-purpose columns.** The richer pattern is per-list-shape dimension configuration:

- List shape defines available grouping dimensions (shopping: store, food_category, aisle, meal_use; packing: clothing_type, day_of_trip, weather_dependency; etc.)
- Mom can add custom dimensions per list (above the defaults)
- Each item carries a value per dimension (or null)
- List view exposes "Group by..." selector that changes active grouping without changing data
- Bulk-add can auto-suggest dimension values based on item content (AI infers store from URL domain, food category from product type)

**Out of scope for the immediate parity work. Captured as design intent for shopping/packing/wishlist capability work.** The components built for the work-and-reward family must be flexible enough to accommodate this richer grouping model when inventory-and-reference shape work happens.

The current shipped behavior on shopping lists (AI organizes items into store-named `section_name` values, items group by `section_name` only) is a single-dimension version of this pattern. Multi-dimensional grouping is the natural evolution.

## Connector-destination addressability

Some inventory-and-reference-shape lists become routing targets in connector contracts. Examples:

- **Snack-rewards:** when all kids hit weekly chore threshold, a randomized snack from a "snacks pool" list gets added to the grocery list
- **Pantry-low:** when pantry inventory hits threshold, the item gets added to the shopping list
- **Meal-plan integration:** recipe ingredients get added to shopping list when the meal plan is selected
- **Wishlist-to-budget:** when mom adds an item to a kid's wishlist, the price (if known) factors into birthday or holiday budget calculations

These integrations require list shapes to be addressable as connector destinations and to expose their item-creation interfaces to godmothers.

## Domain parsing for URLs (future smart behavior)

Wishlist items with URLs can auto-group by store domain. Lego Friends linked to Target groups under "Target." Art supplies linked to Amazon groups under "Amazon." Mom or grandma shopping at a particular store can filter the wishlist to that store's items.

Same utility serves shopping list URL handling (brand-preference URLs), family password vault (login URLs paired with credentials for tap-to-fill), and any other list shape with URL data.

**Implementation:** Small URL parsing utility, extracts and normalizes domain. List-shape-aware rendering decides whether to surface domain grouping. Future work — not required for the initial wishlist build.

## What's required infrastructure (built during the immediate parity work)

Even though wishlists themselves are out of scope, the immediate Universal Capability Parity work enables several things wishlists will need:

- **Image / icon at item level** — currently schema-only across most primitives. Surfacing it across the work-and-reward shape lists also makes it available for other shapes to inherit.
- **Resource URL normalization** — `list_items.resource_url` matches `tasks.resource_url`. Naming consistency carries forward to all list shapes.
- **`is_included_in_ai` at item level** — wishlists pull only the source items mom flagged. Same toggle, multiple downstream consumers.
- **Reusable Configure Item editor pattern** — when wishlists get their own configure surface, the editor pattern is established and adapts to other content shapes.
- **Bulk-add infrastructure** — already exists (mindsweep, curriculum-parse, SmartImportModal). Wishlist bulk-add reuses it.
- **`life_area_tags` (TEXT[]) on list_items** — wishlists can carry multi-value taxonomy from day one when the column is added during parity work.

## Companion CLAUDE.md convention (proposed text)

> **Composed-view surfaces (post-MVP, design intent captured 2026-04-29).** Some surfaces in the app are views composed from data in other primitives, not primitives themselves. Wishlist (pulls from self_knowledge, guiding_stars, best_intentions, bigplans, journal_entries, plus own data), Milestone Map (pulls from `is_milestone=true` items), Family Feed (pulls from activity entries), Standards Portfolio (pulls from `tracking_tags` items), Master Plans (see File 3 — pulls from underlying routines/lists/collections). Source-of-truth stays in original primitive; partial two-way editing supported (common edits write back from the view; complex edits navigate to source). Visibility flags on source primitives gate what surfaces. See `claude/feature-decisions/Composed-View-Surfaces-and-Wishlists.md` for full design intent including wishlist item structure, "Add as reward" promotion pattern, list-shape extensibility, multi-dimensional grouping, and connector-destination addressability.
