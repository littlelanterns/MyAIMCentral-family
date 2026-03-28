# PRD-24A Cross-PRD Impact Addendum

**Status:** Approved — Ready for Pre-Build Audit Reconciliation
**Created:** March 16, 2026
**Parent PRD:** PRD-24A (Overlay Engine & Gamification Visuals)
**Companion:** PRD-24A Game Modes Addendum
**Touches:** PRD-03, PRD-04, PRD-05, PRD-09A, PRD-10, PRD-11, PRD-14, PRD-15, PRD-22, PRD-24, Widget Template Catalog, Build Order Source of Truth

---

## Impact on PRD-24 (Gamification System — Overview & Foundation)

**What changed:**
- `gamification_configs.visual_world_theme` column renamed to `dashboard_background_key`. References `background_library.id` instead of a Visual World theme key.
- `gamification_configs.overlay_id` column **removed**. Replaced by the `overlay_instances` table which supports multiple overlays per member, each with a visual theme + game mode combination.
- `gamification_daily_summaries.theme_unlocks_today` column renamed to `background_change_today` (BOOLEAN). Simplified — just tracks if background was changed that day.
- `gamification_daily_summaries.overlay_progress_today` JSONB now populated with per-overlay data: `{ overlay_instance_id: { points_earned, stage_changed, collectibles_earned, recipes_brewable } }`.
- Gamification Event Pipeline **Step 8** fully specified: task category → find active overlay_instances → route to overlay engine → points + collectibles + stage checks + recipe checks + streak evolution + boss/bingo checks.
- Gamification Event Pipeline **Step 9 removed**. Dashboard backgrounds have no progress tracking. The overlay stage progression IS the visual progression system.
- PRD-24's Architectural Boundaries table entry for PRD-24A scope should be updated to reflect the modular Visual Theme × Game Mode architecture (replaces the original "Visual World themes" scope).
- PRD-24's **treasure box animation templates** (pirate, princess, medieval, steampunk, etc.) are **replaced by per-theme reveal containers**. The `treasure_box_template` field on `gamification_configs` (Screen 8, Section I) changes from a fixed list of generic templates to auto-derived options from the child's active visual theme. Each visual theme defines 3 reveal container types (e.g., Pets: pet carrier, mystery egg, paw print gift box). If no overlay is active, 3 generic fallback containers are available. PRD-24's `treasure_boxes.animation_template` column value set changes from `('pirate', 'princess', 'medieval', ...)` to theme-derived container IDs.

**Action needed during audit:**
- Rename `visual_world_theme` → `dashboard_background_key` in PRD-24 schema.
- Remove `overlay_id` column from PRD-24 schema, add note: "Replaced by overlay_instances table (PRD-24A)."
- Rename `theme_unlocks_today` → `background_change_today` in daily summaries schema.
- Update pipeline Step 8 to reference PRD-24A's full specification.
- Remove pipeline Step 9.
- Update Architectural Boundaries sub-PRD scope for PRD-24A.
- Replace PRD-24's 10 generic treasure box animation templates with per-theme reveal containers. Update Screen 5 (Treasure Box Reveal Modal), Screen 8 Section I (Reveal Visuals), and Screen 9 (Treasure Box Configuration) to reference theme-derived container options instead of the fixed template list.
- Update `treasure_boxes.animation_template` allowed values from generic template names to theme-derived container IDs.
- Add 3 generic fallback containers for members without an active overlay.

---

## Impact on PRD-03 (Design System & Themes)

**What changed:**
- Deferred #4 ("Gamification visual themes — Flower Garden, Dragon Academy, etc.") is now resolved differently than originally anticipated. Instead of gamification themes as CSS token override sets, the system uses:
  - **Dashboard backgrounds:** Cosmetic images (13 options) displayed behind dashboard content, independent of PRD-03 color themes.
  - **Background celebration animations:** CSS/SVG micro-animations that fire on task completion, themed to the active background. 3 random animations per background, 3 tiers (small/medium/large). These use PRD-03's shell animation tokens for timing (Play bouncy, Guided moderate, Adult subtle).
  - **Overlay visual themes:** Separate art sets (Pets, Apothecary, Dragons, Pixel Loot) with their own images, independent of the PRD-03 theme system.
- Background celebration animations are a new CSS/SVG animation pattern. They should follow PRD-03 conventions: shell-aware timing tokens, no hardcoded colors (particle effects use theme token colors), non-blocking overlay positioning.

**Action needed during audit:**
- Update Deferred #4 to: "Resolved by PRD-24A. Dashboard backgrounds are cosmetic images with celebration animations. Overlay visual themes (Pets, Dragons, etc.) have their own art independent of the design system. No gamification-specific CSS token override sets needed."
- Note that background celebration animations use shell animation tokens.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Dashboard backgrounds introduce a new rendering layer: a full-bleed background image with a semi-transparent readability gradient, positioned behind all dashboard content. This affects all shells:
  - Play: lighter gradient, more opaque card backgrounds for readability with large text.
  - Guided: standard gradient.
  - Independent: background visible if enabled, member can toggle.
  - Adult: defaults to OFF.
- Background celebration animations are absolutely-positioned CSS/SVG overlays that render on top of dashboard content during task completion. Non-blocking — user can continue interacting. Animations last 2–4 seconds.
- PRD-04's Guided shell "Gamification Integration" section now has full data sources from PRD-24A:
  - Overlay collection widgets render in PRD-10's grid.
  - Dedicated Progress page shows overlay stage + collection + recipes.
- PRD-04's Play shell bottom nav "Stars" and "Fun" tabs now connect to:
  - "Stars" → Points Detail Modal (PRD-24, Screen 2).
  - "Fun" → Collection View (PRD-24A, Screen 6) + Reward Menu (PRD-24, Screen 3) + Boss/Bingo status.

**Action needed during audit:**
- Add background image rendering layer specification per shell.
- Add background celebration animation layer specification.
- Update Guided shell gamification integration references.
- Update Play shell bottom nav destinations.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- LiLa gains new context data when overlays are active for a member: active overlay names, current stages, recent collectibles, brewable recipes, active boss HP, bingo card progress.
- LiLa gains new generation capabilities:
  - **Bingo card generation:** Read family task data → generate balanced 5×5 card with difficulty distribution → present via Human-in-the-Mix.
  - **Boss/Quest generation:** Suggest boss HP based on family size and typical output → generate narrative text → present via Human-in-the-Mix.
  - **Passport page generation:** Generate micro-goal stamp slots based on the child's task patterns → present via Human-in-the-Mix.
- No new LiLa guided mode is introduced. All generation is initiated from Settings UI, not conversation.

**Action needed during audit:**
- Add overlay context fields to LiLa's context assembly documentation.
- Add bingo/boss/passport generation as LiLa capabilities with Human-in-the-Mix flow.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- Task categories are now consumed by the overlay engine for category-to-collectible mapping. The overlay setup flow reads the child's actual task categories to auto-populate the mapping.
- No schema changes to PRD-09A. The overlay engine reads task category data, it doesn't modify it.
- The gamification pipeline Step 8 checks task category on each completion to route to the correct overlay(s).

**Action needed during audit:**
- Note that task categories are consumed by PRD-24A's overlay engine for category mapping. The category field on tasks is now load-bearing for gamification.

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**
- Widget Catalog I-16 renamed from "Visual World Progress" to **"Overlay Progress."** Data source: `overlay_instances` (current stage, points, progress bar to next stage).
- Widget Catalog I-17 "Overlay Collection Display" wired to `overlay_collectibles` + `overlay_instances`. Shows daily collectible gallery.
- New widget types from PRD-24A and Game Modes Addendum:
  - **Collection View Widget** (M/L): Per-overlay collectible gallery with calendar view.
  - **Boss HP Bar Widget** (M/L): Shared boss HP bar with phase indicators. Lives on Family Hub.
  - **Bingo Card Widget** (L): 5×5 bingo grid with completion stamps. Lives on Family Hub.
  - **Evolution Creature Widget** (S/M): Current evolving creature with phase indicator.
  - **Passport Progress Widget** (S/M): Current passport page with stamp slots.
- Dashboard background rendering adds a new CSS layer behind all widget content.

**Action needed during audit:**
- Rename I-16 to "Overlay Progress."
- Wire I-17 data source.
- Register new widget types: Collection View, Boss HP Bar, Bingo Card, Evolution Creature, Passport Progress.
- Document dashboard background as a rendering layer beneath the widget grid.

---

## Impact on PRD-11 (Victory Recorder & Daily Celebration)

**What changed:**
- DailyCelebration Step 4 is **fully specified** by PRD-24A:
  - **Sub-step A:** Daily collectible reveal per active overlay. Effort mode shows sized creature/item. Category mode shows earned bottles/items per completed category.
  - **Sub-step B:** Stage evolution animation if any overlay crossed a stage threshold today. Crossfade from old stage image to new.
  - **Sub-step C:** Points summary with animated counter.
  - **Streak Evolution addition:** If a creature evolved today, the flipbook animation (5 phases in sequence) plays during Sub-step A.
- Step 4 handles multiple overlays by rendering reveals sequentially (Play shell: full animation each; Guided: condensed if 2+).
- The "Gamification approach modules (Dragon, Star Jar, Achievement Board)" stub from PRD-11 is fully resolved: the overlay engine with Visual Theme × Game Mode IS the approach module system.

**Action needed during audit:**
- Replace Step 4 stub with reference to PRD-24A specification.
- Remove "Gamification approach modules" from stubs — resolved by PRD-24A overlay engine.
- Note that Step 4 content varies by overlay count and game mode.

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- Personal dashboards now support a background image layer (from PRD-24A's dashboard background system).
- Overlay widgets (Collection View, Evolution Creature, Passport Progress) are deployable to personal dashboards.
- The dashboard rendering order is: background image → readability gradient → widget grid → floating elements.

**Action needed during audit:**
- Add background image as a rendering layer in dashboard composition.
- Note new widget types available for dashboard deployment.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- New notification types from the Game Modes Addendum:
  - `'boss_phase_changed'` — Boss entered a new phase
  - `'boss_defeated'` — Family defeated the boss
  - `'boss_failed'` — Boss quest expired without completion
  - `'bingo_line'` — Family completed a bingo line
  - `'bingo_blackout'` — Family completed full blackout
  - `'creature_evolved'` — A creature reached a new phase
  - `'creature_legendary'` — A creature reached legendary form
  - `'passport_page_complete'` — A passport page was filled
- Recipe brew completions that link to `requires_approval` rewards create PRD-15 requests (already noted in PRD-24A).

**Action needed during audit:**
- Add 8 notification types to PRD-15 enum documentation.
- All new notification types fall under the existing `'gamification'` notification category (added by PRD-24).

---

## Impact on PRD-22 (Settings)

**What changed:**
- Gamification Settings Screen 8, Section H: renamed from "Visual World" to **"Dashboard Background."** Contains the background selector (PRD-24A, Screen 2).
- New Section: **"Overlays"** added to the gamification settings panel. Contains the overlay selector (PRD-24A, Screen 3), setup flow (Screen 4), and per-overlay configuration (Screen 5). The overlay selector now shows Visual Theme × Game Mode as a two-step choice.
- Boss Battle/Party Quest configuration accessible from a "Family Challenges" section in family-level settings (not per-member). Mom creates bosses/quests that apply to the whole family.
- Bingo card management accessible from the same "Family Challenges" section. Mom generates/edits/approves bingo cards.

**Action needed during audit:**
- Rename Section H to "Dashboard Background."
- Add "Overlays" section with reference to PRD-24A screens.
- Add "Family Challenges" section for Boss Battle and Bingo configuration.

---

## Impact on Widget Template Catalog

**What changed:**
- I-16 renamed from "Visual World Progress" to "Overlay Progress." Data source: `overlay_instances`.
- I-17 "Overlay Collection Display" wired. Data source: `overlay_collectibles` + `overlay_instances`.
- New widget types registered:
  - Collection View Widget (M/L)
  - Boss HP Bar Widget (M/L)
  - Bingo Card Widget (L)
  - Evolution Creature Widget (S/M)
  - Passport Progress Widget (S/M)
- Catalog's PRD-24 relationship entry updated: "PRD-24A: Overlay engine (Visual Theme × Game Mode), dashboard backgrounds, daily collectibles, collection view, recipe system, boss battles, bingo, streak evolution, stamp passport."

**Action needed during audit:**
- Rename I-16, wire I-17.
- Add 5 new widget types to the catalog.
- Update PRD-24 family relationship description.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-24A completed. Scope: Overlay engine with modular Visual Theme × Game Mode architecture, dashboard backgrounds with celebration animations, 4 visual themes, 7 game modes (3 existing + 4 new), DailyCelebration Step 4 wiring, Visual Asset Manifest, Content Creation Pipeline.
- New tables: `dashboard_backgrounds`, `overlay_instances`, `overlay_collectibles`, `recipe_completions`, `background_library`, `boss_quests`, `bingo_cards`, `evolution_creatures`, `passport_books` — **9 new tables**.
- Modified tables: `gamification_configs` (1 rename, 1 removal), `gamification_daily_summaries` (1 rename).
- Companion document: PRD-24A Game Modes Addendum.
- Reference document: Gamification Themes & Modes Master Brainstorm (18 themes, 15 solo modes, 6 co-op modes).
- Visual Asset Manifest: ~369 image assets + ~125 CSS/animation definitions across all gamification sub-PRDs.
- Content Creation Pipeline: Nano Banana grid generation + Image Cutter slicing + Manus batch orchestration. ~4 hours total pipeline time for all launch assets.

**Action needed during audit:**
- Move PRD-24A to Section 2 (Completed PRDs).
- Register 9 new tables.
- Note 2 table modifications.
- Add Game Modes Addendum and Brainstorm to Section 10 (Reference Docs).
- Add Content Creation Pipeline to Section 12 (Strategic Context).

---

## Summary of All Schema Changes

### New Tables (PRD-24A + Game Modes Addendum)

| Table | Owner | Purpose |
|-------|-------|---------|
| `dashboard_backgrounds` | PRD-24A | Per-member background config |
| `overlay_instances` | PRD-24A | Active/paused overlays per member (theme + mode + mapping) |
| `overlay_collectibles` | PRD-24A | Daily collectibles earned |
| `recipe_completions` | PRD-24A | Recipe/quest brew log |
| `background_library` | PRD-24A | Seed data: 13 background definitions |
| `boss_quests` | Addendum | Shared boss battles and party quests |
| `bingo_cards` | Addendum | Family bingo cards |
| `evolution_creatures` | Addendum | Streak evolution creature instances |
| `passport_books` | Addendum | Stamp passport instances |

### Modified Tables

| Table | PRD Owner | Changes |
|-------|-----------|---------|
| `gamification_configs` | PRD-24 | `visual_world_theme` → renamed to `dashboard_background_key`; `overlay_id` → removed |
| `gamification_daily_summaries` | PRD-24 | `theme_unlocks_today` → renamed to `background_change_today` |

### New Notification Types (PRD-15)

8 new types: `boss_phase_changed`, `boss_defeated`, `boss_failed`, `bingo_line`, `bingo_blackout`, `creature_evolved`, `creature_legendary`, `passport_page_complete`

All under existing `gamification` notification category.

**Total new tables: 9**
**Total modified tables: 2**
**Total new notification types: 8**

---

*End of PRD-24A Cross-PRD Impact Addendum*
