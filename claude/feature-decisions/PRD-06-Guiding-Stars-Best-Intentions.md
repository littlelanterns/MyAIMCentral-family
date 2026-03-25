# Feature Decision File: PRD-06 — Guiding Stars & Best Intentions

> **Created:** 2026-03-25
> **PRD:** `prds/personal-growth/PRD-06-Guiding-Stars-Best-Intentions.md`
> **Addenda read:**
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`
>   - No PRD-06-specific addenda exist
> **Founder approved:** pending

---

## What Is Being Built

**Repair pass + gap fill.** Guiding Stars and Best Intentions pages already exist with basic CRUD. This session brings them into full PRD compliance:
- Swap Eye/EyeOff → Heart/HeartOff for context toggle (platform convention)
- Add collapsible groups by entry_type (replacing flat list)
- Add drag-to-reorder within groups
- Add soft delete (archive/restore) replacing hard delete
- Add "Craft with LiLa" button (stub — opens LiLa pre-primed)
- Repair Best Intentions: add active/resting sections, tap-to-celebrate with confetti, tracker style, related members, description field
- Add conditional context loading (shouldLoadGuidingStars / shouldLoadBestIntentions)
- Summary indicator wording fix

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| Guiding Stars main page | Collapsible groups by entry_type (value, declaration, scripture_quote, vision). Heart toggle. Drag-to-reorder. Archive/restore. Summary: "LiLa is drawing from X/Y stars" |
| Guiding Stars entry card | Heart icon toggle, entry text, type tag, description (optional), edit/archive actions, drag handle |
| Guiding Stars create/edit form | Content field, category (entry_type) picker with 4 types, optional description, "Craft with LiLa" link |
| Guiding Stars empty state | Warm copy per PRD. Two buttons: "Write My First Star", "Let LiLa Help Me Discover Mine" (stub) |
| Guiding Stars archived section | Collapsible "View Archived" at bottom with restore/permanent-delete per entry |
| Best Intentions main page | Active section (prominent) + Resting section (collapsed). Summary: "LiLa is drawing from X/Y intentions" |
| Best Intentions card (active) | Statement, tap-to-celebrate button, today's count badge "×N today", tracker viz (counter default), Heart toggle, edit/archive |
| Best Intentions card (resting) | Muted styling, reactivate toggle, edit/archive |
| Best Intentions quick add form | Title (required), description (optional), related members (optional), tags (optional), tracker style picker, active toggle |
| Best Intentions empty state | Warm copy per PRD. Button: "Add My First Intention" |
| BulkAddWithAI integration | Already wired on both pages — keep as-is |
| "The Art of Honest Declarations" modal | Already wired on GuidingStars — keep as-is |

---

## Key PRD Decisions (Easy to Miss)

1. **Guiding Stars entry_type** is a fixed enum: `value`, `declaration`, `scripture_quote`, `vision`. NOT freeform categories. Current code uses freeform strings (Value, Declaration, Scripture, Vision, Priority, Principle, Custom) — must be constrained to PRD's 4 types.
2. **`owner_type`** column on guiding_stars: 'member' (personal) or 'family' (family-level from LifeLantern). Family-level creation is stubbed but column must exist.
3. **Best Intentions has `title` not `statement`** in PRD schema. Current code uses `statement`. Live DB may use `statement`. Keep `statement` since it's already deployed — note the PRD/DB name difference.
4. **Best Intentions `tracker_style`** enum: 'counter', 'bar_graph', 'streak'. Counter is Essential tier, others Enhanced.
5. **Best Intentions has `is_active` boolean** — Active vs Resting sections. Current code has no active/resting distinction.
6. **Best Intentions `related_member_ids` UUID[]** — optional related family members per intention.
7. **Tap-to-celebrate creates `intention_iterations` record** — append-only, 500ms debounce, confetti animation.
8. **intention_iterations schema differs from current**: PRD requires `family_id`, `member_id`, `recorded_at`, `day_date` columns. Current code only has `intention_id`, `victory_reference`, `created_at`.
9. **"Craft with LiLa" is NOT a guided mode** — it's a pre-primed conversation context. No registry entry needed.
10. **Heart/HeartOff is the platform standard** for is_included_in_ai toggle. Replaces Eye/EyeOff.
11. **Conditional context loading** — Guiding Stars loads when values/identity/growth topics detected. Best Intentions loads when topic matches related_member_ids or tags. Neither loads on every conversation.
12. **`archived_at` soft delete** — no hard deletes. Both tables.
13. **`sort_order`** integer per entry for drag-to-reorder within groups.
14. **Declaration language coaching** — LiLa guides toward honest commitment language when crafting. Never blocks manual entries.
15. **"Select All / Deselect All" per entry_type group** — heart all/unheart all within a collapsible group.

---

## Addendum Rulings

### From PRD-Audit-Readiness-Addendum.md:
- Record rationale with every decision (PRD-06 already does this well)
- Tag deferred decisions consistently
- Complete shell behavior tables (Mom/Adult/Independent/Guided/Play)

### From PRD-31-Permission-Matrix-Addendum.md:
- Feature keys: `guiding_stars_basic` (Essential), `guiding_stars_ai_craft` (Enhanced), `guiding_stars_family` (Full Magic), `best_intentions` (Essential), `best_intentions_tracker_views` (Enhanced)
- All return true during beta
- PermissionGate wraps tier-specific UI

### From PRD-Template-and-Audit-Updates.md:
- No PRD-06-specific rulings — general template hygiene only

---

## Database Changes Required

### Existing Tables (columns to add/verify)

**guiding_stars** — verify live schema has:
- `entry_type` TEXT (value/declaration/scripture_quote/vision) — current code uses freeform `category`. Need to add `entry_type` if missing, or repurpose `category`.
- `owner_type` TEXT DEFAULT 'member' — may not exist
- `title` TEXT nullable — may not exist
- `source_reference_id` UUID nullable — may not exist
- `is_private` BOOLEAN DEFAULT false — may not exist
- `is_shared_with_partner` BOOLEAN DEFAULT false — may not exist
- `sort_order` INTEGER DEFAULT 0 — may not exist
- `archived_at` TIMESTAMPTZ nullable — may not exist

**best_intentions** — verify live schema has:
- `description` TEXT nullable — may not exist
- `related_member_ids` UUID[] nullable — may not exist
- `tracker_style` TEXT DEFAULT 'counter' — may not exist
- `is_active` BOOLEAN DEFAULT true — may not exist
- `is_private` BOOLEAN DEFAULT false — may not exist
- `is_shared_with_partner` BOOLEAN DEFAULT false — may not exist
- `source_reference_id` UUID nullable — may not exist
- `sort_order` INTEGER DEFAULT 0 — may not exist
- `archived_at` TIMESTAMPTZ nullable — may not exist

**intention_iterations** — verify live schema has:
- `family_id` UUID NOT NULL — PRD requires, may not exist
- `member_id` UUID NOT NULL — PRD requires, may not exist
- `recorded_at` TIMESTAMPTZ — PRD requires, may not exist
- `day_date` DATE — PRD requires, may not exist

### Migrations
- Add missing columns to all three tables (idempotent ALTER TABLE ADD COLUMN IF NOT EXISTS)
- Backfill `entry_type` from existing `category` values where possible
- Add indexes per PRD spec
- No destructive changes to existing data

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `guiding_stars_basic` | Essential | mom, dad_adults, independent_teens | Manual entry, display, toggle |
| `guiding_stars_ai_craft` | Enhanced | mom, dad_adults, independent_teens | Craft with LiLa |
| `guiding_stars_family` | Full Magic | mom | Family-level entries (stub) |
| `best_intentions` | Essential | mom, dad_adults, independent_teens | Full feature with counter tracker |
| `best_intentions_tracker_views` | Enhanced | mom, dad_adults, independent_teens | Bar graph + streak visualizations |

---

## Stubs — Do NOT Build This Phase

- [ ] Family-level Guiding Stars creation flow (requires PRD-12 LifeLantern)
- [ ] "Extract from Content" input path (requires Knowledge Base PRD)
- [ ] Dashboard widgets for GS/BI (PRD-10 defines containers — widget configs only)
- [ ] Morning/Evening Review integration (future PRD)
- [ ] Victory Recorder daily intention summary (PRD-11)
- [ ] Victory Recorder thread detection (PRD-11)
- [ ] Review & Route detection of GS/BI content (PRD-08 wires this)
- [ ] Guided children's light experience
- [ ] AI near-duplicate detection
- [ ] AI misalignment reflection
- [ ] Bar graph and streak tracker visualizations (counter only for now — UI picker present but other views show PlannedExpansionCard)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Guiding Stars | → | LiLa context assembly | `is_included_in_ai`, conditional loading via shouldLoadGuidingStars() |
| Best Intentions | → | LiLa context assembly | `is_included_in_ai` + `is_active`, conditional loading via shouldLoadBestIntentions() |
| Best Intentions | → | intention_iterations | Tap-to-celebrate creates append-only records |
| Notepad routing | → | Guiding Stars | RoutingStrip destination `guiding_stars` (already wired) |
| Notepad routing | → | Best Intentions | RoutingStrip destination `best_intentions` (already wired) |
| Tasks | → | Best Intentions | `tasks.related_intention_id` FK (stub — column exists) |

---

## Things That Connect Back to This Feature Later

- Victory Recorder (PRD-11): consumes intention_iterations, checks GS for thread connections
- Dashboard Widgets (PRD-10): GS rotation widget, BI celebration widget
- Morning/Evening Review (PRD-18): surfaces GS and BI in daily rhythms
- LifeLantern (PRD-12): creates family-level Guiding Stars
- LiLa Optimizer (PRD-05C): preset filtering on BI tags

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**
