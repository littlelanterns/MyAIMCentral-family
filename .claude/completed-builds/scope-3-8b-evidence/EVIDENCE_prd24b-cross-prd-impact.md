---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-24B-Cross-PRD-Impact-Addendum.md (+ prds/addenda/PRD-24B-Content-Pipeline-Tool-Decisions.md companion)
Bridged PRDs: PRD-24B (source) ↔ PRD-03 (animation tokens, sparkle overlay), PRD-04 (dashboard layer stack), PRD-09B (lists.reveal_type), PRD-10 (Star Chart + Color-Reveal tracker types + Treasure Box widget), PRD-11 (DailyCelebration Step 4), PRD-14 (Personal Dashboard rendering layers + opacity), PRD-22 (Settings — Reveal Type Picker + Gamification Settings Screen 8 Section I), PRD-24 (parent — default_reveal_type + treasure_boxes.reveal_type), PRD-24A (sibling — per-theme reveal container variants + background celebration + evolution flipbook)
Provenance: Worker `ab94e8e3771f27074` (Opus, report-only mode) ran full evidence pass across addendum (274 lines) + companion Content Pipeline Tool Decisions doc + live_schema.md §{lists, reveal_animations, reward_reveals, reward_reveal_attachments, earned_prizes, gamification_configs} + src/components/gamification/** (reveals/, celebrations/, widgets/, dashboard/, demo/, shared/, settings/) + src/components/reward-reveals/** (RevealAnimationPicker, RewardRevealLibrary, RewardRevealModal) + src/components/widgets/trackers/TallyTracker.tsx (Star Chart variant) + src/components/coloring-reveal/ColorRevealTallyWidget.tsx + src/types/reward-reveals.ts + src/types/lists.ts + migrations 100142/100144 + cross-ref to EVIDENCE_prd24 + EVIDENCE_prd24a. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked PRD-24B Cross-PRD Impact Addendum end-to-end against code reality. **This surface continues the "Build M supersedes PRD-24 family architecture wholesale" pattern established in the PRD-24 and PRD-24A evidence files.** The addendum (March 2026) specifies a **flat Reveal Type Library of 8 canonical IDs** (`treasure_chest`, `gift_box`, `cracking_egg`, `slot_machine`, `spinner_wheel`, `three_doors`, `card_flip`, `scratch_off`) that any consumer surface attaches to via a single `reveal_type` TEXT column. **Code reality ships a completely different architecture:** a `reveal_animations` platform library (33 rows in live DB) with `reveal_type` as a binary `'video'|'css'` field + a `style_category` taxonomy (`paper_craft`, `minecraft`, `anime`, `pokemon`, `unicorn`, `candy`, `dnd`, `steampunk`, `retro`, `pink_purple`, `ice_cream`, `css_effect`) accessed via FK from `reward_reveals.animation_ids[]`. Zero of the 8 addendum IDs appear in the seeded rows; the 4 CSS reveals shipped are `spinner`, `card_flip`, `door_open` (vs addendum's `spinner_wheel`, `card_flip`, `three_doors`) plus a `ScratchOffReveal` component that exists in `src/components/gamification/reveals/` but is NOT seeded in `reveal_animations` (demo-only). The addendum's two companion column additions (`treasure_boxes.reveal_type`, `gamification_configs.default_reveal_type`) target a `treasure_boxes` table that NEVER SHIPPED (same supersession as PRD-24 seam #1), and `gamification_configs` has no `default_reveal_type` column per live schema L2817-2839. The `lists.reveal_type` column DID ship (live schema L875) but is NEVER CONSUMED by frontend code — zero grep hits for `list.reveal_type` or `list_id.*reveal` across `src/`. **Primary headline: PRD-24B addendum describes a theoretical flat-ID architecture that Build M (2026-04-13) and migration 100142 (`reveal_animations_library`) pivoted away from — the shipped architecture is arguably RICHER (33 themed video variants vs 8 abstract IDs) but the cross-PRD integrations (Reveal Type Picker, PRD-22 Gamification Settings Screen 8 Section I, PRD-14 rendering layers, PRD-10 Color-Reveal zone map system, PRD-24 treasure_boxes consumer) cascadingly absent because the target architecture was never built.** **No SCOPE-8b safety hits** — reveal animations and visual celebrations carry zero Crisis Override / HITM / privacy-filter / Safe-Harbor / child-data-boundary surfaces. **Demo-only component pattern is the dominant sub-finding:** `GamificationShowcase.tsx` at `/dev/gamification` is the ONLY consumer of CardFlipReveal, ThreeDoorsReveal, SpinnerWheelReveal, ScratchOffReveal, BackgroundCelebration, ReadabilityGradient, StarChartAnimation, TreasureBoxIdle — 8 demo-only components total across PRD-24A+PRD-24B siblings. Cross-addendum pattern reaches 3+ instances (PRD-24, PRD-24A, PRD-24B) — **ESCALATE** to a cross-addendum consolidation finding.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **Flat Reveal Type Library — 8 canonical IDs** | Addendum L22, L258-260 — explicit CHECK values for all three `reveal_type` columns | **Zero of 8 IDs appear in `reveal_animations` seed data.** Migration `00000000100142_reveal_animations_library.sql:64-186` seeds 33 rows with themed slugs (`paper_craft_gift_box`, `minecraft_chest`, `anime_chest`, `pokeball_reveal`, etc.). The 4 CSS reveals (lines 180-185) use slugs `spinner`, `card_flip`, `door_open` — 2 of 4 semantically close to addendum but named differently. `scratch_off` has a component but NO seeded row. `reveal_animations.reveal_type` is binary `'video'|'css'` — NOT a CHECK of the 8 addendum IDs. | Intentional-Document (architecture pivoted post-addendum) | **SCOPE-3** Medium | N |
| 2 | **`treasure_boxes.reveal_type` column (rename of `animation_template`)** | Addendum L20, L247-249, L253-255 | **`treasure_boxes` table does NOT EXIST** (same finding as PRD-24 seam #1, PRD-24A seam #1). Column rename is on a phantom table. | Intentional-Document (cascade from PRD-24 supersession) | **SCOPE-3** (cross-reference to PRD-24 F-α) | N |
| 3 | **`gamification_configs.default_reveal_type` TEXT DEFAULT 'treasure_chest' NOT NULL** | Addendum L17-19, L247-248 | **Column does NOT exist.** `gamification_configs` per live schema L2819-2839 has 19 columns. NO `default_reveal_type`. | Intentional-Document (cascade) | **SCOPE-3** (cross-reference to PRD-24 F-α) | N |
| 4 | **`lists.reveal_type` TEXT NULL** | Addendum L112-113, L249-250 | **Column EXISTS** per live schema L875. Type `string \| null` in `src/types/lists.ts:51`. **But ZERO frontend consumers.** Grep `list\.reveal_type` across `src/` returns zero hits. Randomizer draw flow doesn't read it. The column is dead schema. Actual randomizer reveal style lives on `task_segments.randomizer_reveal_style` per Convention #214. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 5 | **Reveal Type Picker — reusable modal component** | Addendum L179-189 | **Component does NOT exist** — grep `RevealTypePicker` across `src/` returns zero hits. A parallel component ships: `RevealAnimationPicker.tsx` in `src/components/reward-reveals/` — consumes the `reveal_animations` table (33 rows, 12 style categories) not the flat 8-ID library. Grouping is by `style_category` not by reveal type ID. | Intentional-Document (pivoted to `RevealAnimationPicker`) | **SCOPE-3** (consolidates with #1) | N |
| 6 | **PRD-22 Gamification Settings Screen 8 Section I — "Reveal Type"** | Addendum L188-189 | **Does NOT exist as spec'd.** `GamificationSettingsModal.tsx` per Convention #221 ships 6 sections — **none is "Reveal Type" or "Reveal Visuals."** Build M-approved simplification. | Intentional-Document (same pattern as PRD-24A seam #7) | **SCOPE-3** (consolidates with #1) | N |
| 7 | **Star Chart widget animation spec** — parabolic arc flight, bounce landing, confetti, all-star pulse, SparkleOverlay → prize card, auto-save to gallery | Addendum L128-130, L197-200, L208-211 | **Partial wiring, demo-only.** `StarChartAnimation.tsx` component exists with the full PRD-24B animation spec — **but only consumed in `GamificationShowcase.tsx:614`**. The actually-wired Star Chart is `StarChartVariant` inside `TallyTracker.tsx:143-199` which renders a **static grid of filled/unfilled Lucide `<Star>` icons** — no parabolic arc, no confetti, no completion celebration, no SparkleOverlay, no auto-save. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 8 | **Color-Reveal tracker — SVG-path zone map, grayscale→color bloom, progressive excitement, print export, complexity levels 1–5** | Addendum L132-136, L204-205, L212 | **Does NOT exist as spec'd.** No `ColorRevealTracker.tsx`. `color_reveal` is declared in `TrackerType` enum at `src/types/widgets.ts:43` but **filtered OUT** of TrackThisModal at `TrackThisModal.tsx:74,78`. A DIFFERENT coloring-reveal model shipped per Build M Convention #211-#213: 1:1 task-linked tally counter via `member_coloring_reveals` + `coloring_reveal_library` (32 rows Woodland Felt) consumed by `ColorRevealTallyWidget.tsx` — NOT a tracker widget, NOT zone-map-based, NOT print-export-capable. | Intentional-Document (Build M shipped Convention #211-#213 tally-counter model instead) | **SCOPE-3** Medium | N |
| 9 | **Treasure Box widget idle animations** | Addendum L133-135, L206 | **Component exists, demo-only.** `TreasureBoxIdle.tsx` with full spec — BUT only consumed in `GamificationShowcase.tsx`. No treasure_boxes table to host it. No `dashboard_widgets.template_type='treasure_box'` registration. | Unintentional-Fix-Code | **SCOPE-3** (consolidates with #1 + PRD-24 F-α) | N |
| 10 | **Background celebration SVG animations** | Addendum L41-44, L64-67, L125-128 | **Component exists, demo-only** (duplicate of PRD-24A seam #6). `BackgroundCelebration.tsx` consumed only in `GamificationShowcase.tsx`. Not wired into any dashboard. | Deferred-Document (cross-reference to PRD-24A seam #6) | **SCOPE-3** (cross-reference) | N |
| 11 | **Dashboard rendering layer stack — 6 layers** | Addendum L89-99, L165-173 | **Not wired as a cascading stack.** `ReadabilityGradient.tsx` exists, demo-only. `BackgroundCelebration.tsx` exists, demo-only. No `dashboard_backgrounds` table. Per-shell card opacity boosts not implemented. | Deferred-Document (cascade from PRD-24A seam #1) | **SCOPE-3** (consolidates with PRD-24A F-A) | N |
| 12 | **Micro-celebrations — points popup, streak fire, level-up burst** | Addendum L69-73, L127-128 | **Components exist, demo-only.** `PointsPopup.tsx`, `StreakFire.tsx`, `LevelUpBurst.tsx` — all with full animation implementations. **All three only consumed in `GamificationShowcase.tsx`.** No invocation from `useTasks.ts` completion path, no invocation on streak advancement or level advancement. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 13 | **Evolution flipbook celebration** | Addendum L44-46 | **Does NOT exist.** Grep `evolution_flipbook\|EvolutionFlipbook\|evolution_creature\|is_golden` across `src/` returns zero hits. No `evolution_creatures` table. Structurally impossible. | Deferred-Document (full cascade from PRD-24A Game Modes Addendum supersession) | **SCOPE-3** (consolidates with PRD-24A F-A) | N |
| 14 | **CSS sparkle overlay — reusable particle system** | Addendum L68-71 + Convention #46 mandates 8-12 particle quick burst + 16-24 particle full celebration | **Component exists, partially wired.** `RevealSparkle.tsx` in `src/components/gamification/shared/` implements a particle system with modes `'burst'|'shower'|'trail'`. Consumed by the 4 reveal components (demo-only). NOT consumed by StarChartVariant in TallyTracker, NOT consumed by ColorRevealTallyWidget. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 15 | **PRD-11 DailyCelebration Step 4 Sub-step A collectible reveal** | Addendum L148-152 | **Does NOT exist — Step 4 auto-skipped** (cross-reference PRD-24A seam #2). PRD-24B's optional `reveal_type` configuration per-overlay is moot because Step 4 doesn't run. | Deferred-Document (cross-reference to PRD-24A seam #2) | **SCOPE-3** (cross-reference) | N |
| 16 | **PRD-03 animation tokens — no new CSS variables** | Addendum L59-76 | **Consumes `--color-accent`, `--color-accent-subtle`, `--color-gold` variations correctly.** `BackgroundCelebration.tsx`, `PointsPopup.tsx`, `RevealSparkle.tsx` all use `var(--color-*)` tokens. `prefers-reduced-motion` respected via `useReducedMotion.ts`. Addendum explicitly says "No token changes. No new CSS variables" — confirmed. | Documented (strong positive — theme-token discipline correct) | — | — |
| 17 | **PRD-24B Content Pipeline Tool Decisions — 12 deliverables "Claude Code builds these directly"** | Companion doc L115-132 | **Mixed.** 4/4 CSS reveals ✓ (demo-only). Reward card ✓. CSS sparkle overlay ✓. Star Chart animation ✓ (demo-only). Color-Reveal bloom ✗. Micro-celebrations ✓ (demo-only). Background celebration SVG ✓ (demo-only). Treasure box idle ✓ (demo-only). Evolution flipbook ✗. Reveal Type Picker ✗. Reduced-motion fallbacks ✓. **Summary: 9/12 deliverables coded (with 8 demo-only), 3/12 absent.** | Unintentional-Fix-Code | **SCOPE-3** (consolidates) | N |

## Unexpected findings list

1. **`door_open` vs `three_doors` naming mismatch between CSS seed and PRD-24B spec.** Migration 100142 L184 seeds `door_open` slug with `DoorOpenReveal` css_component, but PRD-24B spec calls the reveal type `three_doors` and the shipped component is `ThreeDoorsReveal.tsx`. The `css_component` string literal references `DoorOpenReveal` which does NOT exist — lookup would 404. Dead seed.

2. **`scratch_off` has a component but no library seed.** `ScratchOffReveal.tsx` exists with the `ScratchTexture` type but `reveal_animations` has zero rows with a `scratch_off` slug.

3. **`earned_prizes.animation_slug TEXT` (migration 100144 L32) is the ONLY wired breadcrumb from the reward reveal pipeline** — not the 8 reveal-type IDs from PRD-24B, but the `reveal_animations.slug` from the 33-row library.

4. **The companion `PRD-24B-Content-Pipeline-Tool-Decisions.md` doc has 4 unresolved research tasks** — none are blockers because the target features did not ship.

5. **`RevealAnimationPicker` uses `style_category` as primary grouping axis, not `reveal_type`** — structurally incompatible with PRD-24B's spec.

6. **`lists.reveal_type` column is dead schema** — same pattern as PRD-24 seam #12.

## Proposed consolidation (§5.1 + §5.2 candidates)

**§5.1 within-addendum consolidation:**

- Seams #1 + #2 + #3 + #5 + #6 share root cause: **PRD-24B flat Reveal Type Library architecture pivoted to `reveal_animations`/`reward_reveals` attachment model.** Consolidate.
- Seams #4 + #7 + #9 + #10 + #12 + #14 share root cause: **Animation primitives shipped at component layer but cross-surface integration absent.** Consolidate.
- Seams #8 + #13 + #15 represent full cascades from PRD-24 / PRD-24A supersession — cross-reference only.
- Seam #16 strong positive — keep standalone non-finding.
- Seam #17 (content pipeline) rolls up into the two consolidated findings above.

After §5.1: **2 SCOPE-3 findings** + **3 cross-references** + **1 documented positive**.

**§5.2 cross-addendum candidates:**

**A. "Build M supersedes PRD-24-family architecture wholesale" pattern — 3+ pattern THRESHOLD REACHED.**

| Addendum | Core supersession |
|---|---|
| PRD-24 | 6 of 8 promised tables absent |
| PRD-24A | 9 of 9 promised tables absent |
| **PRD-24B (new)** | **Flat 8-ID reveal library pivoted to `reveal_animations` style_category model** |

**ESCALATE** cross-addendum consolidation: **"PRD-24 family Cross-PRD Impact Addenda were authored pre-Build-M and have been architecturally superseded across the entire family. Addenda were never back-amended."**

**B. "Demo-only component pattern" — 3+ pattern THRESHOLD REACHED.** **9 demo-only components across the PRD-24 family** — all consumed only in `/dev/gamification` route. **ESCALATE.**

**C. "Addendum-specified column shipped but never consumed" pattern.** Two instances (PRD-24 seam #12 `lists.reveal_visual`, PRD-24B seam #4 `lists.reveal_type`). Not yet 3+ threshold but pattern worth watching.

## Proposed finding split

- **F-α: PRD-24B Addendum's flat Reveal Type Library architecture superseded** (consolidates seams #1+#2+#3+#5+#6). **Intentional-Document. SCOPE-3 Medium. Beta N.**
- **F-β: PRD-24B animation primitives ship at component layer as demo-only; integration absent; `lists.reveal_type` is dead schema** (consolidates seams #4+#7+#9+#10+#12+#14+#17). **Unintentional-Fix-Code + Intentional-Document mix. SCOPE-3 Medium. Beta N.**
- **F-γ: PRD-24B Color-Reveal zone-map tracker architecture replaced by Build M Convention #211-#213 tally-counter model** (seam #8 standalone). **Intentional-Document. SCOPE-3 Medium. Beta N.**
- **Strong positive (non-finding):** PRD-03 animation token discipline correct in the demo-only components (seam #16).
- **0 SCOPE-8b findings.**

**Expected final cardinality: 3 SCOPE-3 findings + 3 cross-references.**

## Beta Y candidates

**Zero Beta-Y candidates from this surface.** All findings are architectural-drift or demo-only-staging issues without child-facing breakage.

## Top 3 surprises

1. **The shipped reveal library (`reveal_animations`, 33 rows) is arguably RICHER than PRD-24B's spec** — 12 themed style categories provide thematic variety that 8 abstract reveal types never would. This isn't a regression; it's a different (and deeper) architecture. But the addendum was never updated.

2. **`door_open` CSS reveal points at a non-existent React component** (`DoorOpenReveal`) while the real component ships as `ThreeDoorsReveal`. Migration 100142 seeded a broken row that nobody has exercised because the production consumers don't render CSS reveals yet.

3. **8 of the 9 "demo-only" components flagged in PRD-24B belong to PRD-24B's scope** (PRD-24A contributes only 2). PRD-24B is almost entirely a "components without consumers" surface. Build quality of the components themselves is high — but the integration work was never done.

## Watch-flag hits

- **F11 server-side enforcement** — Non-hit.
- **Crisis Override** — Non-hit.
- **F17 messaging** — Non-hit.
- **F22+F23 privacy/is_included_in_ai** — Non-hit.
- **studio_queue source discipline** — Non-hit.
- **`is_included_in_ai` three-tier propagation** — Non-hit.
- **HITM (Convention #4)** — Non-hit.
- **Universal Timer Convention #35** — Non-hit and out-of-scope. Confirmed `sand_timer|hourglass|thermometer|arc|filling_jar` correctly present in `src/features/timer/types.ts:6`. PRD-24B and PRD-36 are architecturally independent.
- **SparkleOverlay Convention #46** — Partial-hit. `RevealSparkle.tsx` exists with correct modes and honors reduced motion. Infrastructure correct.
- **Build M supersession pattern** — **STRONG HIT.** Cross-addendum 3+ threshold reached.
- **Demo-only component pattern** — **STRONG HIT.** Cross-addendum 3+ threshold reached (9 components across PRD-24 family).

## Orchestrator adjudication

(empty — pending walk-through)
