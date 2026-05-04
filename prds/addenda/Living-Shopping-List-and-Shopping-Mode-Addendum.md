# Living Shopping List & Shopping Mode Addendum
## PRD-09B Enhancement: Always-On Lists + Store-Filtered Composed View

**Date:** May 4, 2026
**Status:** Ready for Build
**Triggered by:** Founder request; concept captured April 6, 2026 during PRD-09A/09B audit fix session
**Touches:** PRD-09B (Lists), PRD-14 (Dashboard), PRD-24 (Gamification/Rewards), PRD-22 (Settings)
**Future touches (V2/V3):** Wishlists, Gift Idea lists, PRD-05 (LiLa context), Cookbook/Smart Scanning Addendum
**Schema verified against:** `claude/live_schema.md` regenerated 2026-05-03 + direct `information_schema` query 2026-05-04

> **Production schema notes (May 4, 2026):**
> - `lists`: 42 columns. Key columns: `owner_id` (UUID, NOT NULL), `title` (TEXT, NOT NULL), `list_name` (TEXT, nullable — migration artifact, both exist), `list_type`, `victory_mode` (TEXT, default 'none'), `is_shared`, `is_included_in_ai`, `archived_at`. No `is_always_on` or visibility-timing columns yet — genuinely new.
> - `list_items`: 56 columns. Primary text field is `content` (TEXT, NOT NULL). `item_name` also exists (nullable — migration artifact). `gift_for` is UUID (FK → family_members), NOT text. `resource_url` (not `url`). Has `checked`, `checked_by`, `checked_at`, `section_name`, `quantity` (numeric), `quantity_unit`, `price` (numeric), `currency`, `category`, `victory_flagged`. No `store_tags` or `store_category` yet — genuinely new.
> - `list_shares`: 8 columns. `shared_with` (UUID, NOT NULL), `member_id` (UUID, nullable), `permission`, `is_individual_copy`, `can_edit`.
> - `gamification_configs`: 19 columns. Exists and is live.
> - `contracts`: 32 columns. Phase 3 connector layer — wiring rules.
> - `contract_grant_log`: 14 columns. Phase 3 — execution log for fired contracts.
> - `earned_prizes`: 17 columns. Phase 3 — earned rewards. Has `prize_type`, `prize_name`, `prize_text`, `redeemed_at`, `redeemed_by`. This is the V2 reward-fulfillment integration point.
> - Tables that DO NOT EXIST: `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_events`, `gamification_achievements`, `gamification_daily_summaries`, `deed_log`, `allowance_pools`, `allowance_transactions`. Some may arrive in Phase 3.5.
> - `purchase_history`: DOES NOT EXIST in production. Genuinely new table proposed here.

---

## Overview

The shopping list should be permanent family infrastructure — not a disposable checklist you create, complete, and archive. In real life, the shopping list is always there. Things flow in and out continuously. You don't "finish" a shopping list; you shop, come home, and start adding to it again.

This addendum redesigns the shopping list experience around two interconnected concepts:

**Living Shopping List** — always-on lists that never complete. Purchased items stay visible with strikethrough for a configurable duration per store section, then move to a Recently Purchased tab, then auto-archive. Purchase history accumulates over time, building context for LiLa.

**Shopping Mode** — a composed view that aggregates items across multiple lists, filtered by store. When mom is at Target, she sees everything she needs from every list she has access to — groceries, household items, opportunistic "look for anywhere" items, and (in V2) wishlist matches, gift ideas, and rewards that need to be purchased. One screen, nothing missed.

### Plain English: What This Means for Mom

Today, if you have a private shopping list and a shared family shopping list, you have to check both when you're at the store. If Jake earned a reward that's a physical item you need to buy, that lives in a completely different part of the app. If you have a mental note to look for a belt for Gideon at whatever store has a good one, that's in your head — not in the app.

After this: you tap "I'm at Target," and everything appears in one view — your groceries, the family's groceries, the belt for Gideon (tagged "Anywhere"), Jake's earned Lego reward, and eventually items from wishlists and gift idea lists too. You check things off as you shop, and each item writes back to wherever it came from. When you're done, you close Shopping Mode and go home. The lists stay alive, already accumulating new items for next time.

---

## Part 1: Living Shopping List

### 1.1 Always-On Lists

Families can create as many always-on shopping lists as they want. An always-on list differs from a standard list in these ways:

- **No "complete" or "archive" action.** The list is permanent infrastructure. There is no "all items checked = list done" behavior. The list card never shows a completion state.
- **Checked items don't disappear immediately.** They remain visible with strikethrough styling for a configurable duration, then move to the Recently Purchased tab.
- **The list is always accessible** from the Lists page, from Shopping Mode, from the QuickTasks strip, and from LiLa.

Any shopping list can be toggled to always-on mode during creation or in list settings. The default for new shopping lists is always-on = true. Mom can turn it off for one-shot shopping lists (party supplies, specific event shopping) if she wants the traditional create-shop-archive pattern.

> **Schema:** New column on `lists`: `is_always_on BOOLEAN DEFAULT true` for `list_type = 'shopping'`. Default false for all other list types. When `is_always_on = true`, the archive/complete affordances are hidden and the checked-item-visibility behavior activates.

### 1.2 Store Sections with Per-Section Settings

Shopping lists are organized by store. Each store is a section (using the existing `section_name` column on `list_items`). The AI Shopping Organizer already auto-assigns items to store sections — this is shipped and working.

**What's new:** Each store-section on an always-on list carries its own timing settings:

- **Checked item visibility** (hours): How long a purchased item stays visible with strikethrough before moving to Recently Purchased. Options: 12, 24, 48, 72 hours, or 1 week. Different stores have different shopping rhythms — Aldi might be 24 hours (you go twice a week), Costco might be 1 week (monthly trips).
- **Purchase history retention** (days): How long items stay in the Recently Purchased tab for that section. Default 30 days. Useful for "did we already buy that?" checks.
- **Auto-archive** (days): How long before purchased items are permanently archived (moved to a purchase history archive, not deleted). Default 90 days. Keeps Recently Purchased clean without losing data.

**Defaults cascade:** List-level defaults apply to all sections. Mom overrides per section only when she wants different timing for a specific store. New sections inherit the list-level defaults.

> **Schema:** New table `list_section_settings`:
>
> | Column | Type | Default | Notes |
> |--------|------|---------|-------|
> | id | UUID | gen_random_uuid() | PK |
> | list_id | UUID | | FK → lists |
> | section_name | TEXT | | The store/section name |
> | checked_visibility_hours | INTEGER | NULL | NULL = inherit from list default |
> | purchase_history_days | INTEGER | NULL | NULL = inherit from list default |
> | auto_archive_days | INTEGER | NULL | NULL = inherit from list default |
> | created_at | TIMESTAMPTZ | now() | |
> | updated_at | TIMESTAMPTZ | now() | |
>
> New columns on `lists` (defaults for all sections):
>
> | Column | Type | Default | Notes |
> |--------|------|---------|-------|
> | default_checked_visibility_hours | INTEGER | 48 | List-level default |
> | default_purchase_history_days | INTEGER | 30 | List-level default |
> | default_auto_archive_days | INTEGER | 90 | List-level default |
> | is_always_on | BOOLEAN | varies | TRUE default for shopping lists |

### 1.3 Recently Purchased Tab

The shopping list detail view gains a tab bar:

```
┌──────────────────────────────────────────────────┐
│  Weekly Groceries                    [Shopping Mode]│
│  [Need to Buy]  [Recently Purchased]              │
├──────────────────────────────────────────────────┤
```

**Need to Buy** (default tab): All unchecked items plus items still within their checked-visibility window (shown with strikethrough, greyed). Grouped by store section with collapsible headers. This is the primary shopping view.

**Recently Purchased**: Items past their checked-visibility window but within the purchase-history-days window. Grouped by store section. Each item shows when it was purchased and who checked it off. Useful for:
- "Did we already buy butter?" checks
- Re-adding recurring items ("we go through milk every week — add it back")
- LiLa context (pattern detection over time)

Items in Recently Purchased have a one-tap "Add back to list" action that unchecks them and moves them back to Need to Buy.

### 1.4 Auto-Archive and Purchase History

A scheduled process (Supabase cron or pg_cron) runs daily and:

1. Moves items past their `purchase_history_days` threshold from Recently Purchased to a purchase history archive.
2. Permanently deletes (or deep-archives) items past their `auto_archive_days` threshold.

The purchase history archive is not a user-facing surface in V1 — it's data storage for LiLa context assembly in V3. The data exists; the UI to browse full purchase history is future work.

> **Implementation note:** The cron job queries `list_items WHERE checked = true AND checked_at < (now() - interval)` joined against `list_section_settings` (or list-level defaults). Lightweight query, runs once daily.

### 1.5 Purchase History Capture

Every time an item is checked off on a shopping list, a purchase event is recorded:

> **Schema:** New table `purchase_history`:
>
> | Column | Type | Default | Notes |
> |--------|------|---------|-------|
> | id | UUID | gen_random_uuid() | PK |
> | family_id | UUID | | FK → families |
> | list_item_id | UUID | | FK → list_items |
> | list_id | UUID | | FK → lists (denormalized for query efficiency) |
> | item_name | TEXT | | Snapshot of item name at purchase time |
> | store_section | TEXT | | Snapshot of section_name (store) at purchase time |
> | quantity | DECIMAL | | Snapshot of quantity |
> | quantity_unit | TEXT | | Snapshot of unit |
> | purchased_by | UUID | | FK → family_members |
> | purchased_at | TIMESTAMPTZ | now() | |
> | price_paid | DECIMAL | NULL | Optional — manual entry or receipt scan (V3) |
>
> **Indexes:**
> - `(family_id, store_section, purchased_at)` — store-level purchase patterns
> - `(family_id, item_name, purchased_at)` — item-level purchase frequency
> - `(family_id, purchased_at)` — chronological history

This table grows over time and becomes the foundation for LiLa's shopping intelligence (V3). In V1, it's write-only — captured but not yet surfaced in AI context assembly.

### 1.6 Bulk Add from Anywhere

Items can be added to any shopping list from multiple entry points (most of these already exist):

- **Directly on the list** — tap + Add Item, type or paste
- **AI Bulk Add** — paste freeform text, LiLa parses into structured items with store-section assignments (existing, shipped)
- **QuickTasks strip** — "Add to grocery list" quick action
- **LiLa conversation** — "Add milk and eggs to the grocery list" (existing routing pattern)
- **MindSweep capture** — items classified as groceries route to the designated shopping list (existing routing)
- **Notepad routing** — select text, "Send to → Grocery List" (existing routing)
- **Meal plan integration** — recipe ingredients auto-added to shopping list (Cookbook Addendum, future)
- **Connector-driven** — godmother actions (snack-rewards, pantry-low triggers) add items automatically (Phase 3 infrastructure exists)

No new bulk-add infrastructure needed for V1 — the existing patterns cover all entry points.

### 1.7 Victory Mode on Shopping Lists

Per the April 6, 2026 design session, shopping lists support the `victory_mode` enum:

- `'none'` (default for shopping lists) — no victories on purchase
- `'item_completed'` — victory per item checked off
- `'list_completed'` — not applicable to always-on lists (they never complete), but available if `is_always_on = false`
- `'both'` — same caveat

Mom can override per item via `victory_flagged`. The default of `'none'` for shopping lists reflects that buying groceries isn't typically victory-worthy — but mom might flag specific items ("finally found that specialty ingredient!") for victory if she wants.

---

## Part 2: Shopping Mode

### 2.1 What Shopping Mode Is

Shopping Mode is a composed read-view that aggregates items across multiple lists, filtered by store. It's not a separate list — it's a lens over existing lists. Items live on their source lists; Shopping Mode reads through them.

When mom taps "I'm shopping" and selects a store, Shopping Mode queries all lists she has access to and pulls items tagged for that store (plus all "Anywhere" items). She checks things off right in the view; each checkmark writes back to the source list.

### 2.2 Store Tags on Items

Every shopping-list item has a store assignment. This replaces the current single `section_name` with a richer model:

**Store tag options:**
- **One specific store** — "Aldi", "Target", "Costco" (the current behavior, using `section_name`)
- **Multiple specific stores** — "Target, Ross, TJ Maxx" (new: item shows up at any of these stores in Shopping Mode)
- **Anywhere** — item shows up at every store (new: for opportunistic purchases like "belt for Gideon")

> **Schema evolution:** The existing `section_name` column on `list_items` currently holds the store name as a single text value. For V1 Shopping Mode, we add:
>
> | Column | Type | Default | Notes |
> |--------|------|---------|-------|
> | store_tags | TEXT[] | NULL | Array of store names. NULL = use section_name (backward compatible). `['__anywhere__']` = Anywhere. |
> | store_category | TEXT | NULL | Aisle/department within a store: "Frozen", "Dairy", "Produce", "Clothing", "Electronics", etc. |
>
> **Existing column reuse:** `gift_for` (UUID, FK → family_members) already exists on `list_items` and serves the "who is this item for?" purpose. Production type is UUID, not TEXT — it's already a proper FK. No new column needed for the "belt for Gideon" use case. The column name is semantically narrow (not every for-member item is a "gift"), but renaming is a separate migration decision — functionally it works as-is.
>
> When `store_tags` is NULL, the item uses `section_name` as its single store (backward compatible with all existing data). When `store_tags` is populated, it's the authoritative store assignment. Migration: no data migration needed — existing items continue working via `section_name` fallback.

**AI Organizer enhancement:** When items are bulk-added, the AI Organizer suggests store tags:
- Grocery items → specific store based on family patterns (or the list's default store)
- Clothing/shoes/accessories → Anywhere (clothing) or multi-store if patterns exist
- Generic household → Anywhere or multi-store
- Specific brand/product with URL → store inferred from URL domain

Mom reviews and adjusts. Over time (V3), the AI gets better at pre-suggesting based on purchase history.

### 2.3 The "For Member" Field (Existing: `gift_for`)

Items like "belt for Gideon" or "shoes for Mosiah" use the existing `gift_for` column (UUID FK → `family_members`) on `list_items`. This column already exists in production. It enables:

- Shopping Mode can show "Items for Gideon" as a grouping option
- The person-lens view: "Show me everything I need for each kid" across all stores and lists
- Gift idea lists and wishlists (V2) naturally use this field too

> **Note on naming:** `gift_for` is semantically narrow — a belt for Gideon isn't a "gift." A future rename to `for_member_id` would be cleaner but is a separate migration decision. The column functions correctly as-is for Shopping Mode purposes.

The field is optional. Most grocery items don't have a `gift_for`. Clothing, school supplies, gifts, and personal items often do.

### 2.4 Shopping Mode Entry Points

- **Lists page** — [Shopping Mode] button at the top
- **Individual list** — [Shopping Mode] button on any always-on shopping list
- **Dashboard widget** — a "Shopping Mode" quick-launch widget (1x1, shows count of items across all lists)
- **LiLa** — "I'm at Target, what do I need?" launches Shopping Mode filtered to Target

### 2.5 Shopping Mode UI

**Store Selection:**

```
┌──────────────────────────────────────────────────┐
│  Shopping Mode                         [X Close]  │
├──────────────────────────────────────────────────┤
│                                                   │
│  Where are you shopping?                          │
│                                                   │
│  [Aldi]  [Target]  [Costco]  [Walmart]  [+ Other]│
│                                                   │
│  Recent: Ross · TJ Maxx · Sam's Club              │
│                                                   │
└──────────────────────────────────────────────────┘
```

Store buttons are auto-populated from existing store sections across all the user's lists. Recent stores appear below. [+ Other] lets mom type a store name.

**Store View (after selecting Target):**

```
┌──────────────────────────────────────────────────┐
│  Shopping Mode: Target              [Switch Store] │
│  [By Section] [By List] [By Person] [All]         │
├──────────────────────────────────────────────────┤
│                                                   │
│  ── Target Items (Family Groceries) ────────────  │
│  □ Clorox wipes (2 pack)                          │
│  □ Kids' toothpaste                               │
│  □ Paper towels                                   │
│                                                   │
│  ── Target Items (Mom's Private List) ──────────  │
│  □ Face wash                                      │
│  □ New phone case                                 │
│                                                   │
│  ── Look For Anywhere ──────────────────────────  │
│  □ Belt for Gideon (brown, size 10-12)            │
│  □ Shoes for Mosiah (size 7, sneakers)            │
│  □ Birthday card for Grandma                      │
│                                                   │
│  ── Rewards to Fulfill ─────────────────────────  │
│  □ Jake's Lego set ($10 budget) — earned 5/2      │
│                                                   │
│  18 items · 4 lists                               │
└──────────────────────────────────────────────────┘
```

**Grouping options (tab bar):**
- **By Section** — groups by store department/aisle (Frozen, Dairy, Produce, Clothing, etc.) using the `store_category` field. Cross-list — a frozen item from the family list and a frozen item from mom's private list appear in the same Frozen section.
- **By List** — groups by source list. Shows which list each item came from. (Default view.)
- **By Person** — groups by `for_member_id`. "Items for Gideon", "Items for Mosiah", "General items."
- **All** — flat list, alphabetical. For quick scanning.

**Interactions:**
- Tap checkbox → item marked as purchased. Writes back to source list (`checked = true`, `checked_by`, `checked_at`). Purchase history record created. Item shows strikethrough briefly, then fades from Shopping Mode view.
- Tap item name → shows item details (notes, quantity, source list, for-member)
- Swipe left → "Not today" (hides from current Shopping Mode session without checking off; item remains on source list)
- Bottom bar shows total item count and how many lists are contributing

### 2.6 Aisle Lens

Within a store, mom can filter to a specific department/aisle. This uses the `store_category` field:

```
┌──────────────────────────────────────────────────┐
│  Shopping Mode: Target — Frozen      [All Aisles] │
├──────────────────────────────────────────────────┤
│                                                   │
│  □ Frozen pizza (Family Groceries)                │
│  □ Ice cream sandwiches (Family Groceries)        │
│  □ Frozen broccoli (Mom's List)                   │
│                                                   │
│  3 items in Frozen                                │
└──────────────────────────────────────────────────┘
```

The aisle filter is a horizontal scrollable chip bar: [All Aisles] [Produce] [Dairy] [Frozen] [Meat] [Pantry] [Household] [Clothing] [Electronics] ...

Aisles are auto-populated from the `store_category` values present in the current store's items. Empty aisles don't show chips.

### 2.7 Privacy in Shopping Mode

Shopping Mode respects all existing list access controls:

- Mom sees items from her private lists + all shared lists she has access to + all lists she can view by role (mom sees all family lists)
- Dad sees items from his private lists + shared lists he's on
- Teen sees items from their private lists + shared lists they're on
- A child's private wishlist items never appear in another member's Shopping Mode (except mom's, per role access)
- Mom's private "Christmas Ideas for Jake" list never appears in Jake's Shopping Mode

The composed view is a query-time filter — no data is copied or exposed beyond existing RLS boundaries.

### 2.8 Shopping Mode Data

Shopping Mode does not create its own data. It reads from:
- `list_items` (filtered by store_tags / section_name match + unchecked status)
- `lists` (to check access permissions and always-on status)
- `list_shares` (to determine which shared lists the current user can see)
- `reward_redemptions` (V2 — to surface fulfilled rewards needing purchase)

It writes to:
- `list_items` (checking off items)
- `purchase_history` (recording purchases)

No new tables needed for Shopping Mode itself. It's a view layer over existing data.

---

## Part 3: Cross-List-Type Integration (V2 — After Wishlists Are Built)

### 3.1 Opt-In to Shopping Mode

Any list type can opt into Shopping Mode via a toggle: `include_in_shopping_mode BOOLEAN DEFAULT false` on the `lists` table.

- Shopping lists: default TRUE (they're the primary Shopping Mode content)
- Wishlists: default FALSE (mom opts in per wishlist)
- Gift idea lists: default FALSE (mom opts in per list)
- Other list types: default FALSE

When a non-shopping list opts into Shopping Mode, its items appear in Shopping Mode at stores matching their `store_tags`, `resource_url` domain, or Anywhere tag.

### 3.2 Wishlist Items in Shopping Mode

When a wishlist is opted into Shopping Mode:

- Items with a `resource_url` pointing to a specific store domain (target.com, amazon.com) show up at that store. URL domain parsing extracts the store name.
- Items without a URL but with a `store_category` (e.g., "toys", "clothing") show up as Anywhere items at relevant stores.
- Items appear in a **"Wishlist Matches"** section in Shopping Mode, visually distinct from grocery/household items.
- Checking off a wishlist item in Shopping Mode marks it as purchased on the source wishlist.

### 3.3 Gift Idea Lists in Shopping Mode

Mom's private gift idea lists (e.g., "Christmas Ideas for Jake") can opt into Shopping Mode. They appear in a **"Gift Ideas"** section — visible only to members who have access to the source list. Jake never sees mom's gift ideas for him in his Shopping Mode.

### 3.4 Rewards to Fulfill

When a child earns a prize that's a physical item mom needs to purchase, it can surface in Shopping Mode.

> **Production reality (May 2026):** The Phase 3 connector layer consolidated reward infrastructure into three tables: `contracts` (32 columns — the wiring rules), `contract_grant_log` (14 columns — execution log), and `earned_prizes` (17 columns — the actual earned rewards). The PRD-24-designed `gamification_rewards` and `reward_redemptions` tables were never built — `earned_prizes` replaces them.
>
> Key `earned_prizes` columns for Shopping Mode:
> - `prize_type` (TEXT, NOT NULL) — determines what kind of prize this is
> - `prize_text`, `prize_name`, `prize_image_url` — display info
> - `redeemed_at` (TIMESTAMPTZ, nullable) — NULL = not yet fulfilled
> - `redeemed_by` (UUID, nullable) — who fulfilled it
> - `family_member_id` (UUID, NOT NULL) — who earned it
>
> Tables that do NOT exist: `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_events`, `gamification_achievements`, `gamification_daily_summaries`, `allowance_pools`, `allowance_transactions`, `deed_log`. Some may arrive in Phase 3.5.

**How it works:**

- `earned_prizes` records where `prize_type` indicates a physical item AND `redeemed_at IS NULL` are queryable by Shopping Mode.
- They appear in the **"Rewards to Fulfill"** section of Shopping Mode.
- Store matching: V2 would need to add `store_tags TEXT[]` to `earned_prizes` (or infer store from prize metadata/URL). Alternatively, mom could manually tag earned prizes with a store when she sees them in the Rewards to Fulfill section.
- Mom checks it off in Shopping Mode → sets `redeemed_at = now()` and `redeemed_by` on the `earned_prizes` record. Child gets a notification.

**V2 pre-build decisions needed:**
- Which `prize_type` values indicate "physical item requiring purchase"? This may need a new value or a separate `requires_purchase` boolean on `earned_prizes`.
- Whether `store_tags` goes on `earned_prizes` directly or is managed through a lightweight join table.
- Phase 3.5 may ship additional reward infrastructure before V2 — verify at V2 build time.

### 3.5 Watch For (Almost Earned)

Wishlist items configured as reward targets (via "Add as reward" — see Composed-View-Surfaces-and-Wishlists.md) that are close to being earned can optionally surface in Shopping Mode as a **"Watch For"** section.

- "Close to earned" threshold: configurable (default 80% of required points/completions)
- Mom toggles this visibility in Shopping Mode settings
- Purpose: if Jake is 2 tasks away from earning that art set and mom sees it on clearance at Target, she might grab it early
- These items are clearly marked as not-yet-earned and cannot be "checked off" in Shopping Mode — they're informational only

### 3.6 Connector-Driven Items

The Phase 3 connector layer already supports godmother actions that add items to shopping lists:

- **Snack-rewards godmother:** all kids hit weekly chore threshold → random snack from a "snacks pool" list auto-added to grocery list
- **Pantry-low godmother (future):** inventory threshold triggers → item added to shopping list
- **Meal-plan integration (future):** recipe ingredients auto-added when meal plan confirmed

These items appear in Shopping Mode automatically because they're regular `list_items` on shopping lists — no special handling needed. The source is transparent: the item's `created_by` or a metadata field can indicate it was auto-added by a connector.

---

## Part 4: Schema Summary

### New Columns on Existing Tables

**`lists` table:**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| is_always_on | BOOLEAN | varies by type | TRUE default for shopping lists, FALSE for others |
| default_checked_visibility_hours | INTEGER | 48 | List-level default for checked item visibility |
| default_purchase_history_days | INTEGER | 30 | List-level default for Recently Purchased retention |
| default_auto_archive_days | INTEGER | 90 | List-level default for auto-archive |
| include_in_shopping_mode | BOOLEAN | varies by type | TRUE default for shopping lists, FALSE for others |

**`list_items` table (56 columns in production):**

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| store_tags | TEXT[] | NULL | NEW. Array of store names. NULL = use section_name. `['__anywhere__']` = Anywhere. |
| store_category | TEXT | NULL | NEW. Aisle/department: Frozen, Dairy, Produce, Clothing, etc. |

Existing columns used as-is: `gift_for` (UUID FK → family_members, for "who is this item for?"), `section_name` (store grouping), `checked` / `checked_by` / `checked_at` (purchase tracking), `resource_url` (URL for store domain parsing), `content` (primary item text, NOT NULL), `item_name` (secondary/display name, nullable), `quantity` / `quantity_unit`, `price` / `currency`, `victory_flagged`.

**Reward-related tables (V2):**

`earned_prizes` (17 columns, shipped Phase 3) already has `redeemed_at` (TIMESTAMPTZ, nullable) and `redeemed_by` (UUID, nullable) for fulfillment tracking. V2 additions needed: a mechanism to identify physical-item prizes requiring purchase (new `prize_type` value or `requires_purchase BOOLEAN`), and optionally `store_tags TEXT[]` for Shopping Mode store matching. Phase 3.5 may add more reward infrastructure before V2 — verify at build time.

### New Tables

**`list_section_settings`** — per-store-section timing overrides:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| list_id | UUID | | FK → lists |
| section_name | TEXT | | The store/section this setting applies to |
| checked_visibility_hours | INTEGER | NULL | NULL = inherit list default |
| purchase_history_days | INTEGER | NULL | NULL = inherit list default |
| auto_archive_days | INTEGER | NULL | NULL = inherit list default |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

RLS: inherits from parent list. Unique constraint on `(list_id, section_name)`.

**`purchase_history`** — long-term purchase tracking for intelligence (NEW table):

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| family_id | UUID | | FK → families |
| list_item_id | UUID | | FK → list_items |
| list_id | UUID | | FK → lists (denormalized) |
| item_name | TEXT | | Snapshot of `content` (primary item text) at purchase time |
| store_section | TEXT | | Snapshot of `section_name` (store) at purchase time |
| store_category | TEXT | NULL | Snapshot of `store_category` (aisle/department) |
| quantity | NUMERIC | NULL | Snapshot — matches list_items.quantity type |
| quantity_unit | TEXT | NULL | |
| purchased_by | UUID | | FK → family_members |
| purchased_at | TIMESTAMPTZ | now() | |
| price_paid | NUMERIC | NULL | Optional — manual entry or receipt-scan (V3) |

RLS: family-scoped. Mom reads all. Members read own purchases.

Indexes: `(family_id, store_section, purchased_at)`, `(family_id, item_name, purchased_at)`, `(family_id, purchased_at)`.

---

## Part 5: Cross-PRD Impact

### PRD-09B (Lists Studio)
- Shopping list type gains always-on behavior, per-section settings, Recently Purchased tab.
- New `store_tags` and `store_category` fields on `list_items`.
- Existing `gift_for` (UUID) column used for "who is this item for?" — no new column needed.
- AI Bulk Add enhanced to suggest store_tags (specific store, multi-store, or Anywhere) and store_category (aisle/department).
- List creation flow for shopping lists: default `is_always_on = true`, configurable section timing defaults.
- List detail view gains [Need to Buy] / [Recently Purchased] tab bar for always-on lists.

### PRD-14 (Personal Dashboard)
- New dashboard widget: Shopping Mode quick-launch (1x1). Shows total unchecked item count across all opted-in lists. Tap launches Shopping Mode.

### PRD-24 / Connector Layer (Gamification) — V2
- `earned_prizes` (17 columns, shipped in Phase 3) is the reward fulfillment table. Has `redeemed_at` / `redeemed_by` for tracking fulfillment.
- V2 needs: a way to identify physical-item prizes (`prize_type` value or `requires_purchase` boolean), and optionally `store_tags` on `earned_prizes` for Shopping Mode store matching.
- `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, and related PRD-24 tables do not exist — `earned_prizes` + `contracts` + `contract_grant_log` replaced them.
- Phase 3.5 (multi-pool allowance restructure) may ship additional tables before V2 — verify at build time.

### PRD-22 (Settings)
- Shopping Mode preferences: which list types appear (shopping lists always on, wishlists/gift lists opt-in), "Watch For" threshold, default grouping view.
- Per-list always-on toggle and timing defaults accessible from list settings.

### PRD-05 (LiLa Core AI — V3)
- Purchase history table feeds LiLa context assembly for shopping-related conversations.
- LiLa can reference purchase patterns: "You usually buy milk at Aldi — should I add it to your Aldi list?"
- LiLa can pre-suggest store tags for new items based on purchase history.
- "I'm at Target, what do I need?" as a LiLa-driven Shopping Mode launch.

### Cookbook/Smart Scanning Addendum (V3)
- Receipt scanning feeds `purchase_history` with price data and brand information.
- Brand preferences learned from purchase history inform LiLa meal planning suggestions.
- Pantry staple detection (items purchased regularly) can auto-suggest re-adding items that haven't been bought in longer than usual.

### Composed-View-Surfaces-and-Wishlists.md
- Shopping Mode is the first composed view surface to ship. The patterns established here (cross-list querying, source-list write-back, privacy-respecting aggregation) inform all future composed views (Wishlist as composed view, Milestone Map, Family Feed, Standards Portfolio, Master Plans).
- The multi-dimensional grouping design intent (group by store, by aisle, by person, by list) is realized in Shopping Mode's grouping tabs.

---

## Part 6: Build Layering

### V1 — Build Now

**Living Shopping List core:**
- `is_always_on` toggle on lists (default true for shopping)
- Per-section timing settings (`list_section_settings` table)
- Recently Purchased tab on list detail view
- Auto-archive cron job
- `purchase_history` table (write-only — capture data, no AI consumption yet)
- Victory mode on shopping lists (already designed, needs wiring)

**Shopping Mode core:**
- `store_tags` (TEXT[]) and `store_category` on `list_items`
- Existing `gift_for` (UUID) used for person-grouping — no new column
- AI Organizer enhancement for multi-store and Anywhere suggestions
- Shopping Mode composed view: store selection, store view, grouping tabs (By Section, By List, By Person, All)
- Aisle Lens filtering within a store
- Check-off writes back to source list + creates purchase_history record
- "Not today" swipe action
- Shopping Mode entry points (Lists page, individual list, dashboard widget)
- Privacy model (RLS-respecting cross-list queries)

### V2 — After Wishlists and Gift Lists Are Built

- `include_in_shopping_mode` opt-in for non-shopping list types
- URL domain parsing for store matching on wishlist/gift items
- "Wishlist Matches" section in Shopping Mode
- "Gift Ideas" section in Shopping Mode (privacy-preserving)
- "Rewards to Fulfill" section — schema TBD against actual reward infrastructure (see §3.4 note)
- "Watch For (Almost Earned)" section (informational, configurable threshold)

### V3 — Intelligence Layer (After Platform Intelligence Pipeline)

- LiLa context assembly reads `purchase_history` for shopping conversations
- Purchase pattern learning: frequency, brand preferences, store preferences, typical quantities
- AI pre-suggests store tags based on learned patterns
- "You usually buy this here" intelligence on new items
- Gentle suggestions: "You haven't bought eggs in 10 days — need them?"
- LiLa-driven Shopping Mode launch: "I'm at Aldi" triggers filtered view
- Receipt scanning integration (from Cookbook/Smart Scanning Addendum) feeds price data into purchase_history
- Pantry staple detection and auto-re-add suggestions

---

## Edge Cases

### Multiple Lists, Same Store, Same Item
Two lists both have "milk" tagged for Aldi. Shopping Mode shows both — they're different items from different lists (maybe mom's private list has "oat milk" and the family list has "whole milk"). Each checks off independently.

If the items are truly duplicates (same item on private + shared list), Shopping Mode could eventually detect and flag duplicates — but V1 shows both and lets mom manage. Deduplication is V3 intelligence work.

### Anywhere Items at Online-Only Stores
If mom types "Amazon" as a store, Anywhere items still show (she might find that belt on Amazon too). The Anywhere tag is truly universal — it appears at every store selection.

### Item Moves Between Stores
Mom re-tags an item from "Aldi" to "Costco." The item disappears from Aldi in Shopping Mode and appears at Costco. If the item was already in a shopping session (mom had Shopping Mode open for Aldi), it disappears on next refresh/navigation.

### Store Names and Normalization
"Wal-Mart", "Walmart", "WalMart" should all resolve to the same store. The AI Organizer normalizes store names on item creation. A `store_directory` table (or simple normalization function) maps common variations. Mom can also manually merge stores in settings.

### Always-On List Shared with Someone Who Leaves the Family
Standard list-sharing behavior: if a family member is removed, their access to shared lists is revoked. Items they added remain on the list. Items they purchased retain the `purchased_by` reference (for history) but the member's name shows as "Former member" in Recently Purchased.

### Shopping Mode with No Items for a Store
If mom selects a store and no items match, Shopping Mode shows: "Nothing needed at [Store] right now. Your lists are looking good!" with a [+ Add Item] shortcut.

### Offline Shopping
Shopping Mode should function with cached data when connectivity is spotty (inside stores with poor reception). Checked-off items queue locally and sync when connectivity returns. This connects to PRD-33 (Offline/PWA) patterns.

---

## What Already Exists (No Changes Needed)

| Capability | Status | Notes |
|-----------|--------|-------|
| `list_items.section_name` | Shipped | Currently holds store name for shopping lists. Continues working; `store_tags` is additive. |
| `list_items.checked`, `checked_by`, `checked_at` | Shipped | Used for visibility duration calculation. No changes. |
| `list_items.gift_for` (UUID FK) | Shipped | Already a UUID FK to `family_members`. Used for "who is this item for?" in Shopping Mode grouping. No changes needed. |
| `list_items.resource_url` | Shipped | Used for URL domain parsing (store matching on wishlist/gift items in V2). No changes. |
| `list_items.content` (NOT NULL) + `item_name` (nullable) | Shipped | `content` is primary item text. Both exist (migration artifact). `purchase_history` snapshots from `content`. |
| `lists.victory_mode` | Shipped | Column exists in production, default `'none'`. Wiring per April 6 session may still be needed — verify during pre-build. |
| AI Shopping Organizer (auto-sort to store sections) | Shipped | Enhanced to suggest `store_tags` and `store_category` in addition to `section_name`. |
| AI Bulk Add (freeform text → structured items) | Shipped | Enhanced to suggest multi-store and Anywhere tags. |
| List sharing model (`list_shares`) | Shipped | Shopping Mode respects existing share records. |
| RLS policies on lists and list_items | Shipped | Shopping Mode queries go through RLS — no bypassing. |
| Connector layer (Phase 3) | Shipped | Godmother-added items appear in Shopping Mode automatically. |

---

## Project Knowledge Sync Notes

**ADD:**
- `Living-Shopping-List-and-Shopping-Mode-Addendum.md` (this document)

**DO NOT REMOVE:**
- `Composed-View-Surfaces-and-Wishlists.md` (upstream design intent — this addendum realizes part of it)
- `Cookbook-SmartScanning-Feature-Addendum.md` (receipt scanning feeds V3 purchase intelligence)
- `PRD-09B-Lists-Studio-Templates.md` (parent PRD — this addendum extends it)

**REFERENCE ONLY (not in project knowledge but informed this addendum):**
- April 6, 2026 conversation capture notes (Living Shopping List concept + victory mode design)
- Connector-Build-Plan (snack-rewards godmother pattern)
- PRD-24 (reward redemption schema)
