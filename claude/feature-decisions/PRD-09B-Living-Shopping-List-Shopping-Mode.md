# Feature Decision File: PRD-09B — Living Shopping List & Shopping Mode

> **Created:** 2026-05-04
> **PRD:** `prds/personal-growth/PRD-09B-Lists-Studio-Templates.md`
> **Addenda read:**
>   - `prds/addenda/Living-Shopping-List-and-Shopping-Mode-Addendum.md` (primary spec)
>   - `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`
>   - `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md`
>   - `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

Two interconnected shopping enhancements: (1) **Living Shopping List** — always-on lists that never complete, with per-store-section timing for checked item visibility, a Recently Purchased tab, purchase history capture, and auto-archive cron; and (2) **Shopping Mode** — a composed cross-list view filtered by store that aggregates items from all accessible shopping lists into one screen, with grouping by section/list/person/all, aisle lens filtering, check-off that writes back to source lists, and a "Not today" swipe action. V1 only — no wishlist/gift/reward integration, no LiLa context from purchase history, no receipt scanning.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| **List Detail View — Tab Bar** | New [Need to Buy] / [Recently Purchased] tab bar on always-on shopping lists |
| **Need to Buy tab** | Default tab: unchecked items + items within checked-visibility window (strikethrough). Grouped by store section. |
| **Recently Purchased tab** | Items past visibility window but within purchase-history-days. Shows purchased_at, purchased_by. One-tap "Add back to list" action. |
| **List Settings — Always-On section** | `is_always_on` toggle, default timing overrides (checked visibility hours, purchase history days, auto-archive days) |
| **List Settings — Per-Section Settings** | Per-store-section timing overrides (inherits from list defaults when NULL) |
| **Shopping Mode — Store Selection Screen** | "Where are you shopping?" with auto-populated store buttons + recent stores + [+ Other] |
| **Shopping Mode — Store View** | Items for selected store across all accessible lists. Header with store name + [Switch Store]. |
| **Shopping Mode — Grouping Tab Bar** | [By Section] [By List] [By Person] [All] |
| **Shopping Mode — Aisle Lens** | Horizontal scrollable chip bar filtering by store_category within a store |
| **Shopping Mode — Item Check-Off** | Writes back to source list_items + creates purchase_history record |
| **Shopping Mode — "Not today" swipe** | Hides from current session without checking off. Session-only state. |
| **Shopping Mode — Empty State** | "Nothing needed at [Store] right now!" with [+ Add Item] shortcut |
| **Lists Page — Shopping Mode button** | Entry point at top of Lists page |
| **Individual List — Shopping Mode button** | Entry point on any always-on shopping list |
| **Dashboard Widget — Shopping Mode (1x1)** | Quick-launch widget showing total unchecked item count across all shopping lists |
| **AI Organizer Enhancement** | Enhance existing ai-parse shopping prompt to suggest store_tags (multi-store, Anywhere) and store_category (aisle) |

---

## Key PRD Decisions (Easy to Miss)

1. **`content` is the primary item text field** on `list_items` (TEXT, NOT NULL). `item_name` also exists (nullable, migration artifact). `purchase_history.item_name` snapshots from `content`.

2. **`gift_for` is UUID FK** to `family_members`, NOT text. Serves as the "for member" field. Naming is semantically narrow but functional — do NOT create a new `for_member_id`.

3. **`resource_url`** is the correct column name on `list_items` (not `url`).

4. **`store_tags` NULL = use `section_name`** (backward compatible). When `store_tags` is populated, it's authoritative. Special sentinel: `['__anywhere__']` = appears at every store.

5. **`is_always_on` default varies by list type**: TRUE for shopping, FALSE for all others. When true: no archive/complete affordances, checked-item-visibility behavior activates.

6. **Timing defaults cascade**: List-level defaults → per-section overrides (NULL = inherit). New sections auto-inherit list defaults.

7. **Victory mode is already wired** — `victory_mode` column exists with default `'none'`, Lists.tsx has full wiring (VictoryModeSelector, handleSharedListEdit for victory_mode). Shopping lists default to `'none'`.

8. **Purchase history is write-only in V1** — captured on every check-off, no AI consumption. Table grows over time for V3 LiLa intelligence.

9. **Shopping Mode is a composed read-view, not a separate list.** It reads through existing RLS — no data copied or exposed beyond existing boundaries.

10. **"Not today" is session-only.** No database persistence — just hides from current Shopping Mode session.

11. **Auto-archive cron** runs daily. Moves items past `purchase_history_days` to archive, deletes items past `auto_archive_days`. Lightweight query.

12. **`lists` has BOTH `owner_id` (UUID, NOT NULL) and `created_by` (UUID, nullable).** Use `owner_id` as primary owner reference.

13. **`lists` has BOTH `title` (TEXT, NOT NULL) and `list_name` (TEXT, nullable).** Respect existing codebase patterns for which is used where.

---

## Addendum Rulings

### From Living-Shopping-List-and-Shopping-Mode-Addendum.md:
- V1 scope explicitly listed in Part 6. V2 (wishlists, gift lists, rewards) and V3 (LiLa intelligence) are OUT of scope.
- `include_in_shopping_mode` is V2 — do NOT build it in V1. Shopping lists are always in Shopping Mode by default.
- URL domain parsing for store matching is V2.
- Store name normalization (Wal-Mart → Walmart) documented as edge case — V1 relies on AI Organizer for initial normalization, manual merge deferred.
- Offline Shopping Mode documented but ties to PRD-33 (Post-MVP).
- Duplicate detection across lists is V3 intelligence work.

### From PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md:
- Lists page type picker already includes shopping. No changes needed for this addendum.
- AI Bulk Add is already shipped — this build enhances the shopping-specific prompt to include store_tags and store_category suggestions.

---

## Database Changes Required

### New Tables

**`list_section_settings`** — per-store-section timing overrides:
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| family_id | UUID | NOT NULL | FK → families |
| list_id | UUID | NOT NULL | FK → lists |
| section_name | TEXT | NOT NULL | Store/section name |
| checked_visibility_hours | INTEGER | NULL | NULL = inherit list default |
| purchase_history_days | INTEGER | NULL | NULL = inherit list default |
| auto_archive_days | INTEGER | NULL | NULL = inherit list default |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

UNIQUE constraint: `(list_id, section_name)`. RLS: family-scoped, inherits from parent list.

**`purchase_history`** — long-term purchase tracking:
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | UUID | gen_random_uuid() | PK |
| family_id | UUID | NOT NULL | FK → families |
| list_item_id | UUID | NOT NULL | FK → list_items |
| list_id | UUID | NOT NULL | FK → lists (denormalized) |
| item_name | TEXT | NOT NULL | Snapshot of `content` at purchase time |
| store_section | TEXT | NULL | Snapshot of `section_name` |
| store_category | TEXT | NULL | Snapshot of `store_category` |
| quantity | NUMERIC | NULL | Snapshot |
| quantity_unit | TEXT | NULL | Snapshot |
| purchased_by | UUID | NOT NULL | FK → family_members |
| purchased_at | TIMESTAMPTZ | now() | |
| price_paid | NUMERIC | NULL | Optional — manual entry, V3 receipt scan |

Indexes: `(family_id, store_section, purchased_at)`, `(family_id, item_name, purchased_at)`, `(family_id, purchased_at)`.
RLS: family-scoped. Mom reads all. Members read own purchases.

### Modified Tables (columns being added)

**`lists`** — 5 new columns:
| Column | Type | Default |
|--------|------|---------|
| is_always_on | BOOLEAN | (see trigger below) |
| default_checked_visibility_hours | INTEGER | 48 |
| default_purchase_history_days | INTEGER | 30 |
| default_auto_archive_days | INTEGER | 90 |
| include_in_shopping_mode | BOOLEAN | (see trigger below) |

Default logic: `is_always_on` and `include_in_shopping_mode` default TRUE when `list_type = 'shopping'`, FALSE otherwise. Implement via BEFORE INSERT trigger or application-side default.

**`list_items`** — 2 new columns:
| Column | Type | Default |
|--------|------|---------|
| store_tags | TEXT[] | NULL |
| store_category | TEXT | NULL |

### Migrations

Migration number: **00000000100230** (next after 100229 which is Phase 3.7 infrastructure).

### Cron Job

Auto-archive cron: daily at a sensible off-peak time. Convention #246 compliant (`util.invoke_edge_function`). Edge Function `shopping-list-auto-archive` processes items past timing thresholds.

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `shopping_mode` | Essential | mom, adult, independent | Shopping Mode composed view |
| `lists_always_on` | Essential | mom, adult, independent | Always-on list behavior |
| `lists_purchase_history` | Essential | mom, adult, independent | Purchase history capture |

All return `true` during beta.

---

## Stubs — Do NOT Build This Phase

- [ ] `include_in_shopping_mode` opt-in for non-shopping list types (V2)
- [ ] Wishlist/Gift list integration in Shopping Mode (V2)
- [ ] Reward fulfillment section ("Rewards to Fulfill") in Shopping Mode (V2)
- [ ] "Watch For (Almost Earned)" section (V2)
- [ ] URL domain parsing for store matching (V2)
- [ ] LiLa context assembly from `purchase_history` (V3)
- [ ] Purchase pattern learning / AI suggestions (V3)
- [ ] Receipt scanning integration (V3)
- [ ] "I'm at Target, what do I need?" LiLa-driven Shopping Mode launch (V3)
- [ ] Store name normalization/merge UI in settings (deferred)
- [ ] Offline Shopping Mode (PRD-33)
- [ ] Duplicate detection across lists (V3)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Shopping Mode reads items | ← | `list_items` (all accessible lists) | RLS-respecting query joining lists + list_shares |
| Shopping Mode check-off | → | `list_items` | Updates checked/checked_by/checked_at |
| Shopping Mode check-off | → | `purchase_history` | Inserts purchase record |
| AI Organizer enhancement | → | `list_items` | Writes store_tags + store_category on bulk add |
| Auto-archive cron | → | `list_items` | Soft-archives items past thresholds |
| Dashboard widget | ← | `list_items` | Counts unchecked items across shopping lists |
| Existing entry points (Notepad, MindSweep, LiLa) | → | `list_items` | Items routed to shopping lists appear in Shopping Mode automatically |

---

## Things That Connect Back to This Feature Later

- V2: Wishlists and gift lists opt into Shopping Mode via `include_in_shopping_mode`
- V2: Earned prizes from connector layer surface as "Rewards to Fulfill" in Shopping Mode
- V3: LiLa context assembly reads purchase_history for shopping intelligence
- V3: Receipt scanning populates price_paid on purchase_history
- Phase 3.7 Wizards: "Shared Shopping List with Family" wizard creates a shopping list — will work with always-on behavior automatically
- Cookbook/Smart Scanning Addendum: Recipe ingredients auto-added to shopping lists

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed after build, before declaring the phase done.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
