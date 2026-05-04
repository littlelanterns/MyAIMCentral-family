# PRD-09B — Living Shopping List & Shopping Mode (V1)

## Status: ACTIVE

## Source Material

- **Primary spec:** `prds/addenda/Living-Shopping-List-and-Shopping-Mode-Addendum.md`
- **Parent PRD:** `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`
- **Feature decision file:** `claude/feature-decisions/PRD-09B-Living-Shopping-List-Shopping-Mode.md`

### Addenda Read
- Living-Shopping-List-and-Shopping-Mode-Addendum.md (full read — all 6 parts + edge cases + schema)
- PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md (context only)
- PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md (context only)
- PRD-09A-Daily-Progress-Marking-Addendum.md (context only)

### Production Schema Verified
- `lists`: 42 columns. No `is_always_on`, no timing columns. `victory_mode` exists (default 'none'). Both `title` (NOT NULL) and `list_name` (nullable) exist. Both `owner_id` (NOT NULL) and `created_by` (nullable) exist.
- `list_items`: 56 columns. `content` (NOT NULL) is primary text. `item_name` (nullable) migration artifact. `gift_for` is UUID FK to family_members. `resource_url` (not `url`). No `store_tags` or `store_category`.
- `list_shares`: 8 columns. Working.
- `purchase_history` table: DOES NOT EXIST — genuinely new.
- `list_section_settings` table: DOES NOT EXIST — genuinely new.

### Existing Wiring Verified
- **Victory mode**: Already wired in Lists.tsx. `VictoryModeSelector` component, `handleSharedListEdit` for victory_mode changes, per-item `victory_flagged` toggle. Shopping lists default to `'none'`. No additional wiring needed.
- **AI Shopping Organizer**: Exists inline in Lists.tsx (lines 862–909). Detects store names from natural language, assigns to `section_name` as category. Enhancement target: add `store_tags` and `store_category` output fields.
- **AI Bulk Add**: Working for all list types. Shopping-specific prompt already handles quantities, units, store detection.
- **List sharing / RLS**: Working. Shopping Mode will query through existing RLS.

---

## Pre-Build Summary

### Scope: V1 Only (Part 6 of the addendum)

**Living Shopping List (6 sub-tasks):**
1. `is_always_on` toggle on `lists` — default true for shopping lists
2. `list_section_settings` table — per-store-section timing overrides with list-level defaults
3. Recently Purchased tab on list detail view (items past visibility window but within purchase-history-days)
4. Auto-archive Edge Function + cron job (daily, Convention #246 compliant)
5. `purchase_history` table — write-only capture on every list item check-off
6. Victory mode on shopping lists — ALREADY WIRED, no new work

**Shopping Mode (8 sub-tasks):**
7. `store_tags` (TEXT[]) and `store_category` (TEXT) columns on `list_items`
8. AI Organizer enhancement — add multi-store, Anywhere (`['__anywhere__']`), and store_category suggestions to existing shopping prompt
9. Shopping Mode store selection screen (auto-populated from existing store sections across user's lists)
10. Shopping Mode store view with grouping tabs (By Section, By List, By Person, All)
11. Aisle Lens chip bar filtering by store_category within a store
12. Check-off in Shopping Mode writes back to source `list_items` + creates `purchase_history` record
13. "Not today" swipe action (session-only hide, no DB persistence)
14. Entry points: Lists page button, individual list button, dashboard widget (1x1)

### Out of V1 Scope (explicitly documented stubs)
- `include_in_shopping_mode` opt-in for non-shopping lists (V2)
- Wishlist / gift list / reward fulfillment in Shopping Mode (V2)
- "Watch For (Almost Earned)" section (V2)
- URL domain parsing for store matching (V2)
- LiLa context from `purchase_history` (V3)
- Purchase pattern learning (V3)
- Receipt scanning (V3)
- LiLa-driven Shopping Mode launch (V3)
- Store name normalization/merge UI (deferred)
- Offline Shopping Mode (PRD-33)

### Migration: 00000000100230

Creates:
- `list_section_settings` table with RLS
- `purchase_history` table with RLS + indexes
- 5 new columns on `lists` (is_always_on, default_checked_visibility_hours, default_purchase_history_days, default_auto_archive_days, include_in_shopping_mode)
- 2 new columns on `list_items` (store_tags, store_category)
- Cron job for auto-archive (daily)
- Feature keys in `feature_key_registry`

### Key Decisions (Locked)
1. Per-list settings with per-section overrides — cascade model
2. `gift_for` (existing UUID) serves as "for member" — no new column
3. `content` is primary text field, `purchase_history` snapshots from it
4. `resource_url` is correct column name on `list_items`
5. `store_tags` NULL = use `section_name` (backward compatible)
6. `is_always_on` defaults TRUE for shopping, FALSE for everything else
7. `include_in_shopping_mode` defaults TRUE for shopping, FALSE for everything else
8. Victory mode already wired — no additional work needed

### Parallel Build Coordination
- Phase 3.7 (Wizards) is running simultaneously
- Both touch `list_items` — this build adds nullable columns only
- Migration 100230 does not conflict with 100229 (Phase 3.7 infrastructure)
- Do not push simultaneously

---

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| List Detail View — Tab Bar (Need to Buy / Recently Purchased) | Mom, Adult, Independent | New |
| List Settings — Always-On toggle + timing defaults | Mom | New |
| List Settings — Per-Section timing overrides | Mom | New |
| Shopping Mode — Store Selection Screen | Mom, Adult, Independent | New |
| Shopping Mode — Store View + Grouping Tabs | Mom, Adult, Independent | New |
| Shopping Mode — Aisle Lens filter bar | Mom, Adult, Independent | New |
| Lists Page — Shopping Mode button | Mom, Adult, Independent | New |
| Individual List — Shopping Mode button | Mom, Adult, Independent | New |
| Dashboard Widget — Shopping Mode (1x1) | Mom, Adult, Independent | New |
| AI Organizer — Enhanced store_tags + store_category output | Mom, Adult, Independent | Modification |

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| List Detail Tab Bar | | | | | | |
| List Settings Always-On | | | | | | |
| List Settings Per-Section | | | | | | |
| Shopping Mode Store Selection | | | | | | |
| Shopping Mode Store View | | | | | | |
| Shopping Mode Aisle Lens | | | | | | |
| Lists Page Shopping Mode button | | | | | | |
| Individual List Shopping Mode button | | | | | | |
| Dashboard Widget Shopping Mode | | | | | | |
| AI Organizer Enhancement | | | | | | |

---

## Build Order

Recommended sequential build order (one commit per sub-task):

1. **Migration 100230** — schema changes (tables, columns, RLS, indexes, cron, feature keys)
2. **TypeScript types** — update `List`, `ListItem` interfaces; add `ListSectionSettings`, `PurchaseHistory` types
3. **Living Shopping List — Always-On behavior** — `is_always_on` toggle in list settings, hide archive/complete on always-on lists
4. **Living Shopping List — Recently Purchased tab** — tab bar on list detail, recently purchased items display, "Add back to list" action
5. **Living Shopping List — Purchase history capture** — write to `purchase_history` on every check-off
6. **Living Shopping List — Auto-archive Edge Function + cron** — daily cleanup of stale items
7. **Living Shopping List — Per-section settings UI** — per-store timing overrides in list settings
8. **Shopping Mode — Core data hooks** — cross-list query for Shopping Mode (items by store, respecting RLS)
9. **Shopping Mode — Store selection screen** — auto-populated store buttons, recent stores
10. **Shopping Mode — Store view + grouping tabs** — four view modes (By Section, By List, By Person, All)
11. **Shopping Mode — Aisle Lens** — chip bar filter by store_category
12. **Shopping Mode — Check-off + Not Today** — write-back to source list + purchase_history + session-only hide
13. **Shopping Mode — Entry points** — Lists page button, individual list button, dashboard widget
14. **AI Organizer Enhancement** — update shopping prompt to suggest store_tags + store_category
