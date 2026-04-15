# Studio Setup Wizards — Feature Decision File

> **Status:** Phase 1 complete (2026-04-14). Phase 2+ planned.
> **Triggered by:** Bug report audit — founder observed Studio templates not wired correctly, LiLa giving inaccurate guidance, and gamification section showing "Coming Soon" despite being fully built.

---

## Problem Statement

The platform has ~20 tracker types (75+ visual variants), 4 reveal animations, gamification earning modes, coloring reveals, randomizer spinners, reward reveals, allowance tracking, routine builders, sequential collections, and more — but Studio doesn't surface most of them, and the connections between features aren't discoverable. Even the founder finds it overwhelming to set up.

LiLa Assist fabricates setup steps (e.g., "create a Practice task type" which doesn't exist) because she doesn't know what's actually available in Studio.

---

## Audit Findings (2026-04-14)

### What's Built vs What Studio Shows

| Category | Built & Functional | Studio Before Fix |
|---|---|---|
| Reveal Animations | 4 CSS types (CardFlip, ThreeDoors, SpinnerWheel, ScratchOff) + video | Nothing |
| Celebration Animations | 4 types (PointsPopup, StreakFire, LevelUpBurst, BackgroundCelebration) | Nothing |
| Tracker Types | 20 types, 75+ visual variants | 35 starter config cards |
| Coloring Reveals | 32 Woodland Felt images, full config flow, tally widget | Hidden in Settings |
| Reward Reveal System | Complete: animation picker, prize editor, prize box, attach-to-anything | Hidden in task/widget config |
| Gamification Settings | Full 6-section modal (segments, earning modes, coloring, resets) | "Coming Soon" PlannedExpansionCard |
| Randomizer + Spinner | Full draw system, 3 draw modes, frequency rules, spinner animation | Just a list template card |
| Self Knowledge | 11 categories, starter prompts for all 6 connection types | Not in Studio |
| Routine BrainDump | AI parses natural language into structured routines | Hidden inside routine creation |
| Best Intentions | Full CRUD with 3 tracker styles | Not in Studio |

### Specific Issues Found

1. **Gamification section said "ON OUR ROADMAP"** — GamificationSettingsModal has 6 fully functional sections
2. **Example templates don't load pre-filled content** — all 13 examples open blank creation forms
3. **No setup wizard flow** — Customize opens raw creation modals with no guided walkthrough
4. **Reward Reveals invisible** — buried inside task/widget config as AttachRevealSection
5. **Key use cases missing** — no "Potty Chart", "Star Chart", "Coloring Page Reveal", "Reward Spinner" templates
6. **Search hid Trackers & Widgets** entirely (guard: `!searchQuery`)

### Bugs Fixed in This Session

1. **Rotation routine creating duplicates** — `createTaskFromData` forced `assignMode='any'` when `rotationEnabled=true` (was defaulting to 'each', creating separate copies). Two-layer fix: data utility + UI state.
2. **Studio Gamification PlannedExpansionCard replaced** with 6 real template cards
3. **Growth & Self-Knowledge section added** with 2 template cards
4. **All Studio sections now searchable** — removed `!searchQuery` guard from Trackers, Gamification, Growth

---

## Phase Plan

### Phase 1 — Fix What's Lying (COMPLETE 2026-04-14)

- [x] Replace Gamification "Coming Soon" with real template cards
- [x] Add Gamification Setup, Day Segments, Coloring Page Reveal, Reward Reveal, Star Chart, Reward Spinner
- [x] Add Growth & Self-Knowledge section (Get to Know Family, Best Intentions Starter)
- [x] Make all Studio sections searchable
- [x] Fix rotation bug (createTaskFromData + TaskCreationModal)

### Phase 2 — Use-Case Setup Wizards (PLANNED)

Create guided multi-step flows that chain existing modals/components. Each wizard replaces the current "open a blank modal" experience with a step-by-step walkthrough.

**Priority wizards (based on founder feedback):**

| Wizard | Steps | Existing Components to Chain |
|---|---|---|
| **Potty Chart / Star Chart** | 1. Name the chart → 2. Pick visual (star_chart/animated_sticker_grid) → 3. Set target count → 4. Attach Reward Reveal (optional) → 5. Assign to child → Deploy | WidgetConfiguration + AttachRevealSection |
| **Coloring Page Reward** | 1. Browse 32 images → 2. Pick linked task → 3. Choose step count → 4. Pick lineart → Deploy | ColoringImagePickerModal (already exists as a single modal) |
| **Reward Spinner** | 1. Create reward list (or pick existing) → 2. Configure spinner widget → 3. Assign to child → Deploy | List creation + WidgetConfiguration |
| **Chore System with Rewards** | 1. List chores (BulkAddWithAI) → 2. Assign to kids (rotation?) → 3. Set up gamification (earning mode) → 4. Attach celebrations → Deploy | TaskCreationModal + GamificationSettingsModal + AttachRevealSection |
| **Morning Routine Builder** | 1. Brain dump routine (RoutineBrainDump AI) → 2. Review sections → 3. Assign → 4. Link randomizer/sequential sources → Deploy | RoutineBrainDump + RoutineSectionEditor + LinkedSourcePicker |
| **Get to Know [Child]** | 1. Pick family member → 2. Walk through 6 connection categories → 3. Answer prompts → 4. Save entries | Self Knowledge hooks + CONNECTION_STARTER_PROMPTS (already exist) |
| **Gamification Quick Setup** | 1. Pick child → 2. Enable gamification → 3. Choose earning mode → 4. Set up segments → 5. Pick coloring reveal (optional) | GamificationSettingsModal sections (restructured as wizard steps) |

**Architecture approach:** Each wizard is a new component wrapping existing hooks/modals in a step-by-step flow. No new database tables needed. Use Haiku for bulk-add parsing (already proven in RoutineBrainDump and BulkAddWithAI).

### Phase 3 — LiLa Knowledge Update

After Studio has proper wizard templates:

1. **`src/lib/ai/help-patterns.ts`** — Add keyword patterns for common setup questions:
   - "potty chart" / "star chart" / "sticker chart" → point to Star Chart template
   - "reward" / "treasure" / "celebration" → point to Reward Reveal
   - "coloring" / "color reveal" → point to Coloring Page Reveal
   - "chore rotation" / "rotating chores" → point to routine with rotation
   - "spinner" / "wheel" / "random reward" → point to Reward Spinner

2. **`supabase/functions/_shared/feature-guide-knowledge.ts`** — Add page knowledge for Studio sections explaining what each template does and how features connect

### Phase 4 — Conversational Setup (Future)

The founder's full vision: a conversational AI wizard (Haiku-class, cheap) that asks "What do you want to set up?" and walks mom through the entire flow conversationally, connecting routines + gamification + allowance + rewards in one conversation. This is the largest phase and would require a new LiLa guided mode (`studio_setup_guide`).

**Key connections that need guided discovery:**
- Routine → gamification points on completion
- Task → allowance tracking (counts_for_allowance flag)
- Tracker widget → Reward Reveal attachment
- Randomizer list → spinner widget
- Coloring reveal → linked repeating task
- Sequential collection → linked routine step
- Day segments → task grouping on dashboard

---

## Asset Inventory (from audit)

### Reveal Animations (4 functional)
- CardFlipReveal (559 lines) — 3 face-down cards, pick one, flip with 3D rotation
- ThreeDoorsReveal (598 lines) — 3 wooden doors, pick one, swings open
- SpinnerWheelReveal (521 lines) — SVG wheel, 6/8/12 segments, tap to spin
- ScratchOffReveal (~360 lines) — canvas scratch-off with 4 texture skins

### Celebration Animations (4 functional)
- PointsPopup — floating "+N points" on task completion
- StreakFire — flame icon scaled by streak length (4 tiers)
- LevelUpBurst — overlay on level threshold crossing
- BackgroundCelebration — SVG silhouettes at dashboard edges (3 themes x 9 animations)

### Tracker Types (20 registered, 75+ variants)
- Phase A (fully functional rendering): tally (12 variants), streak (4), percentage (5), checklist (2), multi_habit_grid (4), randomizer_spinner (1), privilege_status (1)
- Phase B (functional rendering but limited data): boolean_checkin (4), sequential_path (5), achievement_badge (3), xp_level (3), allowance_calculator (4), leaderboard (3), mood_rating (4), log_learning (1), countdown (3), timer_duration (3), snapshot_comparison (3), color_reveal (3), gameboard (6)

### Coloring Reveal Library
- 32 Woodland Felt subjects (20 animals + 12 scenes)
- 6 step-count variants each (5/10/15/20/30/50)
- 6 file types per subject (color, grayscale, lineart_simple/medium/complex, grid_preview)

### Gamification Settings (6 sections, all functional)
1. Master toggles (enable/disable, points per task)
2. Day Segments (CRUD with DnD, day-of-week filters)
3. Creature Earning Mode (4 modes: random_per_task, every_n_completions, segment_complete, complete_the_day)
4. Page/Background Earning Mode (3 modes: every_n_creatures, every_n_completions, tracker_goal)
5. Coloring Reveals (browse library, assign task, pick step count + lineart)
6. Reset & Advanced

### Reward Reveal System (8 components, all functional)
- RewardRevealModal, RewardRevealProvider, RevealAnimationPicker
- PrizeContentEditor, CongratulationsMessagePicker, PrizeBox
- AttachRevealSection, RewardRevealLibrary

---

## Files Changed (Phase 1)

| File | Change |
|---|---|
| `src/utils/createTaskFromData.ts` | Force `mode='any'` when `rotationEnabled` |
| `src/components/tasks/TaskCreationModal.tsx` | Force `assignMode='any'` when rotation toggled on |
| `src/components/studio/studio-seed-data.ts` | Added `GAMIFICATION_TEMPLATES` (6 entries) + `GROWTH_TEMPLATES` (2 entries) |
| `src/pages/Studio.tsx` | Replaced PlannedExpansionCard with real sections, added member picker, added GamificationSettingsModal, made all sections searchable |
