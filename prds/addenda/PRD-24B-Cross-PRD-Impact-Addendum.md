# PRD-24B Cross-PRD Impact Addendum

**Status:** Approved — Ready for Pre-Build Audit Reconciliation
**Created:** March 16, 2026
**Parent PRD:** PRD-24B (Gamification Visuals & Interactions)
**Touches:** PRD-03, PRD-04, PRD-09B, PRD-10, PRD-11, PRD-14, PRD-22, PRD-24, PRD-24A, Widget Template Catalog, Build Order Source of Truth

---

## Impact on PRD-24 (Gamification System — Overview & Foundation)

**What changed:**

PRD-24B establishes a **Reveal Type Library** — a flat catalog of 8 reveal types that are first-class, interchangeable animation wrappers. This supersedes PRD-24's original treasure box animation template model in three ways:

1. **The "treasure chest" is now a reveal type, not a container that uses a template.** PRD-24 originally defined treasure boxes as containers that use one of 10 generic animation templates (pirate, princess, medieval, steampunk, etc.). PRD-24A replaced those generic templates with per-theme containers. PRD-24B completes the evolution: "treasure chest" is one of 8 reveal types in a flat library. Any reveal type can be attached to any context. The treasure box widget on the dashboard triggers whichever reveal type mom configured — it could be a card flip, a spinner wheel, or a treasure chest.

2. **`gamification_configs` gains a `default_reveal_type` column** (TEXT, DEFAULT 'treasure_chest') — the member's default reveal type for treasure box unlocks.

3. **`treasure_boxes` gains a `reveal_type` column** (TEXT, NULL) — per-box override of the member's default. NULL = use default from `gamification_configs`.

4. **PRD-24's `treasure_boxes.animation_template` column** — PRD-24A's cross-PRD addendum already noted this column's value set changes from generic template names to theme-derived container IDs. PRD-24B further clarifies: the column should be renamed to `reveal_type` and its allowed values are the 8 reveal type IDs: `'treasure_chest'`, `'gift_box'`, `'cracking_egg'`, `'slot_machine'`, `'spinner_wheel'`, `'three_doors'`, `'card_flip'`, `'scratch_off'`. The per-theme visual variant is determined at render time by the active overlay theme, not stored on the record.

5. **PRD-24 Screens affected:**
   - **Screen 5 (Treasure Box Reveal Modal):** Replaces the fixed "animation template plays" description with: "The configured reveal type plays. If reveal_type is a video-based type (treasure_chest, gift_box, cracking_egg, slot_machine), the themed video plays followed by a reward card. If interactive (spinner_wheel, three_doors, card_flip, scratch_off), the CSS/SVG interaction plays followed by the same reward card."
   - **Screen 8, Section I (Reveal Visuals):** Replaces the fixed template picker with a reference to PRD-24B's Reveal Type Picker (Screen 2) — a visual catalog of all 8 types. Mom picks from the catalog.
   - **Screen 9 (Treasure Box Configuration):** The `animation_template` field becomes `reveal_type`. The dropdown of generic templates becomes a tap-to-open Reveal Type Picker modal.

**Action needed during audit:**
- Rename `treasure_boxes.animation_template` → `treasure_boxes.reveal_type`. Update allowed values to the 8 reveal type IDs.
- Add `gamification_configs.default_reveal_type` column (TEXT, DEFAULT 'treasure_chest', NOT NULL).
- Update Screen 5 to describe the Reveal Type Library playback model (video-based vs. interactive, both ending with shared reward card + sparkle overlay).
- Update Screen 8 Section I to reference PRD-24B's Reveal Type Picker.
- Update Screen 9 to use `reveal_type` field with Reveal Type Picker.
- Remove any remaining references to the 10 generic animation templates (pirate, princess, medieval, etc.) — these are fully superseded.

---

## Impact on PRD-24A (Overlay Engine & Gamification Visuals)

**What changed:**

1. **Background celebration animation implementation** is now fully specified in PRD-24B. PRD-24A defined the 3-tier trigger model (small on every task, medium on 3rd/routine, large on 5th+ Perfect Day) and the celebration config JSONB structure. PRD-24B adds: SVG silhouette implementation, theme-color-token fill (not background-specific), CSS keyframe definitions, peripheral positioning rules, shell token scaling multipliers, and repeat avoidance logic.

2. **Evolution flipbook celebration** is now fully specified in PRD-24B. PRD-24A Game Modes Addendum defined the 5-phase evolution with flipbook concept and golden variant. PRD-24B adds: exact CSS crossfade timing (0.5s per phase, 200ms fade between), 2-second dramatic pause on phase 5, gold shimmer CSS overlay implementation (animated linear-gradient sweep with mix-blend-mode: overlay), golden variant detection (is_golden=true → enhanced shimmer + particle ring), shell variations.

3. **Per-theme reveal containers** defined in PRD-24A (pet carrier, dragon egg, potion crate, pixel chest, etc.) now function as the **themed visual variants of the video-based reveal types** in PRD-24B's flat Reveal Type Library. The poster frames generated in the content pipeline serve as the `poster` attribute on the `<video>` element. The reveal videos serve as the WebM/MP4 sources. This is an architectural clarification, not a functional change — the assets and their generation pipeline are unchanged.

4. **Content Creation Pipeline** — PRD-24A's pipeline Step 3 (Animate Reveal Containers) now produces assets consumed by PRD-24B's video-based reveal playback system. The pipeline output format (WebM primary + MP4 fallback per container) aligns with PRD-24B's `<video>` element specification.

**Action needed during audit:**
- Add note to PRD-24A's Background Celebrations section: "CSS/SVG implementation specification is in PRD-24B (Screen 12). PRD-24A defines trigger tiers and celebration config JSONB structure; PRD-24B defines the rendering."
- Add note to PRD-24A Game Modes Addendum's evolution celebration section: "Flipbook animation implementation is in PRD-24B (Screen 15). PRD-24A Addendum defines the 5-phase model and golden variant concept; PRD-24B defines the exact CSS timing, shimmer overlay, and shell variations."
- Add note to PRD-24A's Themed Reveal Container section: "These per-theme containers are the visual variants of PRD-24B's video-based reveal types (treasure_chest, gift_box, cracking_egg, slot_machine). The Reveal Type Library (PRD-24B) is the architectural owner; PRD-24A defines the themed asset variants and generates them in the content pipeline."
- No schema changes to PRD-24A tables.

---

## Impact on PRD-03 (Design System & Themes)

**What changed:**

PRD-24B introduces several new animation patterns that all consume PRD-03's shell animation tokens. These are not changes to PRD-03's token system — they are new consumers of existing tokens.

1. **Background celebration SVG animations** — a new CSS/SVG animation pattern. SVG silhouette elements filled with theme color tokens (`--color-accent`, `--color-accent-subtle`), animated via CSS keyframes with shell-appropriate timing. Duration, element scale, and particle count all scale per the shell token multipliers defined in PRD-24B's Theme-Aware Animation Styling Master Reference.

2. **Micro-celebration animations** — three new animation patterns:
   - Points popup: floating text element using `transform: translateY()` + `opacity`, shell-scaled duration
   - Streak fire: scale + color shift animation on the streak widget flame icon
   - Level-up burst: full-width sparkle bar using positioned div elements with `transform: translateX()`

3. **CSS sparkle overlay** — a reusable particle system used by all 8 reveal types and Star Chart/Color-Reveal completion celebrations. Uses `--color-gold` variations and `--color-accent` for particle colors. Particle count scales per shell.

4. **Idle animations** for the treasure box widget: breathing (locked) and bouncing (unlocked). These use `transform: scale()` and `transform: translateY()` respectively. Play shell includes shimmer and orbiting sparkle particles. These should be documented alongside PRD-03's existing idle animation note for Play shell: "Idle animations: subtle breathing/floating on key elements (gamification creatures, avatar pulse)."

All patterns follow PRD-03's conventions: `will-change: transform, opacity` for GPU compositing, shell-appropriate timing functions, `prefers-reduced-motion` respect with static fallbacks.

**Action needed during audit:**
- Add to PRD-03's Animation & Motion Guidelines section, under "Per-Shell Motion Profiles" → "Play": note that PRD-24B defines gamification-specific animation patterns (reveal sparkles, micro-celebrations, background celebrations, idle states) that extend the existing Play shell animation vocabulary.
- Add to PRD-03's "Gold Celebratory Effects" section: "PRD-24B's CSS sparkle overlay is the gamification-specific implementation of gold celebratory effects, used across all reveal types, Star Chart, and Color-Reveal completion celebrations. It follows the same rules: gold effects for victories only, never routine interactions."
- No token changes. No new CSS variables. PRD-24B consumes existing tokens.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**

1. **Background celebration animation layer** — PRD-24A's cross-PRD addendum noted that background celebrations are "absolutely-positioned CSS/SVG overlays that render on top of dashboard content." PRD-24B adds specificity: animations are positioned in the **peripheral zones** of the viewport (not the center 40% vertically where primary content lives). The animation layer sits above the background image + readability gradient but below dashboard cards and widgets. This is relevant to PRD-04's rendering layer order.

2. **Dashboard rendering layer order** (expanded from PRD-24A's cross-PRD addendum):
   ```
   Layer 1: Background image (position: fixed, background-size: cover)
   Layer 2: Readability gradient (::before pseudo-element, per-shell opacity)
   Layer 3: Background celebration SVG animations (absolutely positioned, peripheral)
   Layer 4: Widget grid + dashboard cards (normal flow, boosted card opacity)
   Layer 5: Micro-celebration overlays (points popup, level-up burst — absolutely positioned)
   Layer 6: Modal overlays (reveal type modals, treasure box reveal, etc.)
   ```

3. **Play shell "Fun" tab** — PRD-24's cross-PRD addendum notes that Play shell bottom nav "Fun" tab connects to Reward Menu + Treasure Boxes. With the Reveal Type Library, the "Fun" tab also provides access to any active reveal type triggers (e.g., an unlocked treasure box ready to reveal).

**Action needed during audit:**
- Update PRD-04's dashboard rendering layer specification to include the 6-layer order above (if not already updated from PRD-24A's cross-PRD addendum, which noted layers 1-2 and 4).
- Add Layer 3 (background celebration animations) and Layer 5 (micro-celebration overlays) to the spec.
- Note that background celebrations are peripherally positioned — they avoid the center content zone.

---

## Impact on PRD-09B (Lists, Studio & Templates)

**What changed:**

1. **`lists` table gains a `reveal_type` column** (TEXT, NULL). When a Randomizer-type list has a `reveal_type` set, drawing an item from the randomizer triggers the specified reveal animation before showing the drawn item. When NULL, the draw result is shown directly (no reveal ceremony).

2. **Randomizer draw flow** — the existing draw behavior from PRD-09B (draw from pool → show result → accept/pass flow from PRD-24) now has an optional animation layer: draw from pool → reveal animation plays → result shown on reward card → accept/pass. The reveal type wraps the existing result display.

3. **Randomizer list configuration** — where PRD-24 added `reveal_visual` to the `lists` table (from PRD-24's cross-PRD addendum), PRD-24B's `reveal_type` column replaces or extends it. The `reveal_visual` column from PRD-24's cross-PRD impact was described as selecting a reveal visual for randomizer draws — PRD-24B's `reveal_type` serves this exact purpose with the full 8-type library.

**Action needed during audit:**
- Add `reveal_type` column (TEXT, NULL) to `lists` table schema in PRD-09B.
- Reconcile with PRD-24's cross-PRD addendum which added `reveal_visual` to `lists`. These may be the same column — if so, rename `reveal_visual` → `reveal_type` for consistency with the Reveal Type Library naming. Allowed values: the 8 reveal type IDs, or NULL for no reveal.
- Update Randomizer draw behavior description to note: "If `reveal_type` is set on the list, the draw result is presented through the specified reveal animation (PRD-24B Reveal Type Library) before the accept/pass flow."

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**

1. **Star Chart animation** — PRD-10 defines the Star Chart as a tracker type (Widget Catalog, Master Manuscript Section 9). PRD-24B fully specifies the animation sequence: button tap → confetti → parabolic arc star flight (Play) / straight line (Independent) → bounce landing → counter update. Chart completion: all-star pulse → SparkleOverlay → prize card (or reveal type if configured) → auto-save to gallery. The animation implementation lives in the Star Chart widget component.

2. **Color-Reveal animation** — PRD-10 defines the Color-Reveal as a tracker type (Widget Catalog, Master Manuscript Section 8). PRD-24B fully specifies: zone map JSON consumption, grayscale-to-color bloom animation per zone (CSS filter transition + radial glow), progressive excitement on later zones (expanding ring effect), completion celebration, gallery save, and print export (individual + batch PDF). The zone map format uses SVG path data for resolution-independent boundaries.

3. **Treasure box widget** — PRD-10 hosts the treasure box widget (1×1 size). PRD-24B specifies two idle animation states: locked (breathing scale + progress ring) and unlocked (bounce + gold ring + sparkle particles in Play shell). Also specifies the transition animation between states (shake → flash → sparkle → state swap).

4. **Color-Reveal complexity levels expanded** — PRD-24B defines complexity levels 1–5 mapping to 3–100 zones per image. Level 1 (3–5 zones) for Play-mode toddlers, Level 5 (50–100 zones) for ornate adult coloring. This extends the Master Manuscript's original range and should be reflected in the Color-Reveal tracker configuration options.

5. **Star Chart prize configuration** — PRD-24B adds the option to attach a reveal type to the Star Chart's completion prize. Mom can configure a reveal animation for the prize moment (e.g., card flip to reveal the prize). If no reveal type is configured, the simple prize card displays directly.

**Action needed during audit:**
- Add note to PRD-10's Star Chart tracker type: "Animation specification is in PRD-24B (Screen 9). Includes star flight animation, landing bounce, and completion celebration sequence."
- Add note to PRD-10's Color-Reveal tracker type: "Animation specification is in PRD-24B (Screen 10). Includes zone bloom animation, progressive excitement, completion celebration, and print export (individual + batch PDF). Zone map format uses SVG path data."
- Add note to PRD-10's Treasure Box widget type: "Idle animation states (locked breathing, unlocked bounce, transition) are specified in PRD-24B (Screen 14)."
- Update Color-Reveal tracker configuration to reflect complexity levels 1–5 with zone counts 3–100.
- Add optional `reveal_type` configuration field to Star Chart tracker type for completion prize reveals.

---

## Impact on PRD-11 (Victory Recorder & Daily Celebration)

**What changed:**

1. **DailyCelebration Step 4 collectible reveals** — PRD-24A wired Step 4 with three sub-steps: A (daily collectible reveal), B (stage evolution), C (points summary). PRD-24B adds: Sub-step A's collectible reveal can optionally use any of the 8 reveal types from the Reveal Type Library when configured by mom. If no reveal type is configured for overlay reveals, the collectible appears with the default egg-crack/silhouette-reveal animation described in PRD-24A Screen 9.

2. **Points summary animation** — Sub-step C's "points counter animates from 0 to 35 with sparkle" is now specified as a variant of PRD-24B's points popup micro-celebration, using the same CSS animation pattern but rendered larger (inside the celebration modal rather than floating over a task card).

**Action needed during audit:**
- Add note to PRD-11's DailyCelebration Step 4: "Collectible reveals in Sub-step A can optionally use PRD-24B's Reveal Type Library. Mom configures reveal type for overlay collectible reveals in overlay settings. Default (no reveal type configured): standard collectible appearance animation from PRD-24A."
- Add note to Step 4 Sub-step C: "Points counter animation uses the same pattern as PRD-24B's micro-celebration points popup, scaled up for the celebration modal context."

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**

1. **Dashboard rendering layers** — PRD-24A's cross-PRD addendum noted the background image layer. PRD-24B adds two more overlay layers: background celebration animations (Layer 3, peripheral SVG silhouettes) and micro-celebration overlays (Layer 5, points popup and level-up burst). These are absolutely positioned above dashboard content.

2. **Dashboard card opacity** — When a background image is active, PRD-24B specifies per-shell card opacity boosts: Play 95%, Guided 90%, Independent/Adult 85%. These are applied as additional `background-color` opacity on the card components to ensure readability.

**Action needed during audit:**
- Update PRD-14's dashboard rendering composition to include all 6 layers from PRD-24B's Screen 13.
- Add per-shell card opacity boost values to the dashboard card rendering specification.

---

## Impact on PRD-22 (Settings)

**What changed:**

1. **Reveal Type Picker** — a new reusable modal component introduced by PRD-24B. It displays a visual catalog of all 8 reveal types with preview images, names, descriptions, and a [Preview] button that plays a demo animation. The picker is used in multiple settings contexts:
   - Gamification Settings Screen 8, Section I (member's default reveal type for treasure boxes)
   - Treasure Box Configuration Screen 9 (per-box reveal type override)
   - Randomizer list configuration (reveal type for draws)
   - Star Chart widget configuration (reveal type for completion prize)
   - Any future context where mom assigns a reveal animation

2. **Gamification Settings Screen 8, Section I** — renamed from "Reveal Visuals" to **"Reveal Type"**. Instead of a dropdown of the old generic animation templates, it now opens the Reveal Type Picker modal. The selected reveal type becomes the member's `default_reveal_type` in `gamification_configs`.

**Action needed during audit:**
- Register the Reveal Type Picker as a shared settings modal component in PRD-22's component inventory.
- Update Gamification Settings Screen 8, Section I: rename to "Reveal Type", replace template dropdown with Reveal Type Picker trigger button showing current selection.
- Note that the Reveal Type Picker is consumed by multiple settings surfaces (not just gamification settings).

---

## Impact on Widget Template Catalog

**What changed:**

1. **Star Chart visual variant** — the "Animated Star Chart" visual variant now has full animation specification from PRD-24B. Animation includes: parabolic arc flight (Play) / straight line (Independent), bounce landing, confetti on placement, and full completion celebration sequence. PRD-24B is the authoritative reference for the animation implementation.

2. **Color-Reveal visual variant** — the "Standard Reveal" visual variant now has full animation specification from PRD-24B. Animation includes: SVG-path-based zone boundaries, grayscale-to-color bloom with radial glow, progressive excitement scaling on later zones, and completion celebration. Complexity levels expanded to 1–5 (3–100 zones). Print export capability (individual + batch PDF) is specified.

3. **Treasure Box widget** — idle animation states (locked breathing + progress ring, unlocked bounce + gold ring, transition animation) are fully specified in PRD-24B.

4. **New reusable component: Reveal Type Picker** — applicable as a configuration option for any widget or tracker that has a prize/reward at the end (Star Charts, Color-Reveal completion, sequential paths, etc.). The Reveal Type Picker is not a widget itself but a configuration modal that can appear in any widget's settings.

**Action needed during audit:**
- Update Star Chart entry: add "Animation specification: PRD-24B Screen 9" reference.
- Update Color-Reveal entry: add "Animation specification: PRD-24B Screen 10" reference. Note complexity levels 1–5 (3–100 zones). Note print export capability.
- Update Treasure Box widget entry: add "Idle animation specification: PRD-24B Screen 14" reference.
- Add note to the catalog's configuration patterns section: "Reveal Type Picker (PRD-24B Screen 2) is available as a configuration field for any widget with a prize/reward reveal moment."
- Update PRD-24 relationship description: add "PRD-24B: Reveal Type Library (8 types), animation specs for Star Chart, Color-Reveal, treasure box widget, micro-celebrations, background celebrations, evolution flipbook."

---

## Impact on Build Order Source of Truth

**What changed:**

- PRD-24B completed. Scope: Reveal Type Library (8 types — 4 video-based, 4 CSS/SVG interactive), Star Chart animation sequence, Color-Reveal tracker system with zone map format and print export, micro-celebrations (points popup, streak fire, level-up burst), background celebration CSS/SVG implementation, dashboard readability gradient system, treasure box widget idle animations, evolution flipbook celebration, theme-aware animation styling master reference.
- **New tables: 0.** PRD-24B is an animation specification PRD — it animates data owned by other PRDs.
- **Modified tables: 3 columns added.**
  - `gamification_configs` (PRD-24): +1 column `default_reveal_type` TEXT DEFAULT 'treasure_chest'
  - `treasure_boxes` (PRD-24): +1 column `reveal_type` TEXT NULL (or rename of existing `animation_template`)
  - `lists` (PRD-09B): +1 column `reveal_type` TEXT NULL (or reconciliation with existing `reveal_visual`)
- Companion document: PRD-24B Content Pipeline Tool Decisions (tool assignments for build-phase asset generation).
- Reveal Type Library architecture: flat catalog, any type attachable to any context, theme-adapted via CSS tokens (Tier 1 MVP) with shape variants (Tier 2 post-MVP).

**Action needed during audit:**
- Move PRD-24B to Section 2 (Completed PRDs).
- Note 3 column additions (0 new tables).
- Note column reconciliation needed: `treasure_boxes.animation_template` (PRD-24) → `treasure_boxes.reveal_type` (PRD-24B); `lists.reveal_visual` (PRD-24) → `lists.reveal_type` (PRD-24B).
- Add PRD-24B Content Pipeline Tool Decisions to Section 10 (Reference Docs).
- Update PRD-24 family scope description to include PRD-24B's Reveal Type Library and animation specs.

---

## Summary of All Schema Changes Across PRDs

### Column Additions

| Table | PRD Owner | Column Added | Type | Default | Notes |
|-------|-----------|-------------|------|---------|-------|
| `gamification_configs` | PRD-24 | `default_reveal_type` | TEXT | 'treasure_chest' | NOT NULL. Member's default reveal type for treasure boxes. |
| `treasure_boxes` | PRD-24 | `reveal_type` | TEXT | NULL | Per-box override. NULL = use member default. Replaces/renames `animation_template`. |
| `lists` | PRD-09B | `reveal_type` | TEXT | NULL | Reveal animation for randomizer draws. NULL = no reveal. Replaces/reconciles with `reveal_visual`. |

### Column Reconciliations (Resolve During Audit)

| Table | Existing Column (from PRD-24 cross-PRD) | New Column (PRD-24B) | Resolution |
|-------|----------------------------------------|---------------------|------------|
| `treasure_boxes` | `animation_template` | `reveal_type` | Rename. Update allowed values from generic template names to 8 reveal type IDs. |
| `lists` | `reveal_visual` | `reveal_type` | Likely the same intent — reconcile into single `reveal_type` column with 8 reveal type IDs as allowed values. |

### Valid Values for `reveal_type` Columns

`'treasure_chest'`, `'gift_box'`, `'cracking_egg'`, `'slot_machine'`, `'spinner_wheel'`, `'three_doors'`, `'card_flip'`, `'scratch_off'`

### No New Tables

PRD-24B creates 0 new tables. All animation state is derived from existing data models at render time.

**Running total for the PRD-24 family:**
- PRD-24: 8 new tables, 3 existing tables extended (15 columns)
- PRD-24A + Addendum: 9 new tables, 2 existing tables modified (2 renames, 1 removal)
- PRD-24B: 0 new tables, 3 columns added (2 of which reconcile with PRD-24 cross-PRD additions)
- **Grand total: 17 new tables, 5 existing tables modified**

---

*End of PRD-24B Cross-PRD Impact Addendum*
