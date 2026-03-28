# PRD-24 Cross-PRD Impact Addendum

**Status:** Approved — Ready for Pre-Build Audit Reconciliation
**Created:** March 16, 2026
**Parent PRD:** PRD-24 (Gamification System — Overview & Foundation)
**Touches:** PRD-01, PRD-02, PRD-03, PRD-04, PRD-09A, PRD-09B, PRD-10, PRD-11, PRD-14, PRD-15, PRD-17, PRD-22, Build Order Source of Truth, Widget Template Catalog

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- `family_members` table extended with 6 gamification columns: `gamification_points` (INTEGER DEFAULT 0), `gamification_level` (INTEGER DEFAULT 1), `current_streak` (INTEGER DEFAULT 0), `longest_streak` (INTEGER DEFAULT 0), `last_task_completion_date` (DATE NULL), `streak_grace_used_today` (BOOLEAN DEFAULT false).
- When a new family member is created, a `gamification_configs` record must be auto-seeded with shell-appropriate defaults:
  - Play mode: `currency_name='stars'`, `currency_icon='⭐'`, `base_points_per_task=1`, `bonus_at_three=3`, `bonus_at_five=5`, `visualization_mode='counter'`, `enabled=true`
  - Guided mode: `currency_name='points'`, `currency_icon='⭐'`, `base_points_per_task=10`, `bonus_at_three=35`, `bonus_at_five=60`, `visualization_mode='counter'`, `enabled=true`
  - Independent mode: `currency_name='points'`, `currency_icon='⭐'`, `base_points_per_task=10`, `bonus_at_three=35`, `bonus_at_five=60`, `visualization_mode='level'`, `enabled=false`
  - Adult mode: `currency_name='points'`, `currency_icon='⭐'`, `base_points_per_task=1`, `bonus_at_three=3`, `bonus_at_five=5`, `visualization_mode='hidden'`, `enabled=false`
- The family member creation wizard gains an optional "Gamification" step for Guided and Play members. This step shows Visual World selection (stub → PRD-24A) and basic points/reward configuration. It can be skipped (defaults apply).

**Action needed during audit:**
- Add 6 columns to `family_members` table definition in PRD-01.
- Add `gamification_configs` seeding to the member creation flow, after the member record is created.
- Add optional Gamification step to the member creation wizard (after mode selection, before confirmation). For Independent/Adult members, this step is hidden by default (gamification OFF).

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- The "task unmark reward cascade" stub (PRD-02 references this as "PRD-30 (Rewards)" in two locations — already flagged in Build Order Source of Truth Section 11 as a numbering inconsistency) is now fully specified. When a task completion is unmarked:
  1. Points earned from that completion are deducted from `family_members.gamification_points`
  2. A `gamification_events` record is created with `event_type='points_reversed'` and negative `points_amount`
  3. `gamification_daily_summaries` for that day is recalculated
  4. Streak is recalculated — if the unmarked task was the only completion that day, the streak may break (respecting grace period)
  5. If the completion triggered a treasure box unlock that has NOT yet been opened, the unlock is reverted (`treasure_boxes.status` returns to 'locked', progress decremented)
  6. If the completion triggered a treasure box that HAS been opened, the reversal does NOT reclaim the reward (you can't un-open a treasure box)
- New feature key registrations for PermissionGate:
  - `gamification_basic`, `gamification_rewards_advanced`, `gamification_reveal_visuals`, `gamification_treasure_animations`, `gamification_leaderboard`, `gamification_visual_worlds`, `gamification_overlays`

**Action needed during audit:**
- Update the two references to "PRD-30 (Rewards)" to "PRD-24 (Gamification)" in PRD-02.
- Replace the task unmark reward cascade stub description with a reference to PRD-24's reverse pipeline specification (Section: Gamification Event Pipeline, edge case: task completion unmarked).
- Add 7 gamification feature keys to PRD-02's Feature Key Registry.

---

## Impact on PRD-03 (Design System & Themes)

**What changed:**
- PRD-03 Section "Deferred #4" says "Gamification visual themes (Flower Garden, Dragon Academy, etc.) — Gamification PRD." This is now addressed — PRD-24A will define the Visual World theme token sets. PRD-24 establishes the architecture: each Visual World is a set of CSS variable overrides applied to the child's dashboard shell.
- The micro-celebration animation (points popup on task completion) is a new shared animation component. It should follow PRD-03's animation token conventions: Play shell uses bouncy ease curves (cubic-bezier(0.34, 1.56, 0.64, 1), 300-400ms), Guided uses standard ease (250ms), Adult uses subtle ease (200ms).
- The treasure box widget's dancing/glowing idle state animation is a new animation pattern that should use shell-appropriate tokens.

**Action needed during audit:**
- Update Deferred #4 to reference "PRD-24A (Visual Worlds & Overlay Engine) — defines gamification visual themes and token sets."
- Note that PRD-24 introduces a micro-celebration animation component that must use shell-aware animation tokens.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- PRD-04's Guided shell section describes "Gamification Integration" with a persistent progress indicator, task completion celebrations, routine progress, dashboard integration, and a dedicated Progress page. PRD-24 now provides the data layer for all of these:
  - Persistent progress indicator reads `gamification_configs.visualization_mode` and renders the appropriate display (counter, level, ring, badge, or hidden).
  - Task completion celebrations fire the micro-celebration animation from the gamification event pipeline (step 10).
  - Dashboard integration: gamification widgets (points widget, treasure box, leaderboard) render in PRD-10's grid.
  - Dedicated Progress page: the Points Detail Modal (PRD-24, Screen 2) with Overview, History, and Achievements tabs.
- PRD-04's Play shell bottom nav includes "⭐ Stars" and "🎮 Fun" tabs. "Stars" now maps to the Points Detail Modal. "Fun" maps to the Reward Menu and Treasure Box views.
- The treasure box widget introduces a new widget that can have an animated idle state (dancing, glowing). The Play shell should expect widgets with continuous animation.

**Action needed during audit:**
- Update PRD-04's Guided shell "Gamification Integration" section to reference PRD-24 data sources:
  - Persistent progress indicator → `gamification_configs.visualization_mode`
  - Task celebrations → gamification event pipeline micro-celebration
  - Dashboard widgets → PRD-10 grid hosting PRD-24 widget types
  - Progress page → PRD-24 Screen 2 (Points Detail Modal)
- Update Play shell bottom nav descriptions:
  - "Stars" tab → Points Detail Modal (PRD-24, Screen 2)
  - "Fun" tab → Reward Menu (PRD-24, Screen 3) + Treasure Boxes

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- The `task_rewards` table defined as a stub in PRD-09A is **superseded** by PRD-24's reward economy. PRD-24 introduces `gamification_rewards`, `reward_redemptions`, and the full gamification event pipeline. The `task_rewards` table from PRD-09A should be removed during audit and all references updated to point to PRD-24.
- Task Creation Modal Section 7 (Rewards) needs a new field: `points_override` (INTEGER, nullable). When set, this value overrides the child's `base_points_per_task` for this specific task. When null, the base rate applies.
- The `tasks` table needs a `points_override` column: INTEGER, nullable, default NULL.
- Routine completion mode affects gamification: PRD-24 introduces the concept that a routine can award points "per step" or "on full completion." This is configured in `gamification_configs.routine_points_mode`, not on the task itself. But the task completion event handler needs to know which mode is active for the member to decide when to fire the gamification pipeline.
- Opportunities: when a child self-assigns an item drawn from a Randomizer (PRD-24's accept/pass flow), the system creates an Opportunity-type task with `source='randomizer_draw'` and `source_reference_id=list_item.id`. This is a new source value for the tasks table.
- PRD-09A's "MVP When Dependency Is Ready" item: "Reward transaction processing on task completion (requires PRD-24)" is now fully specified. The gamification event pipeline (PRD-24, Section: Gamification Event Pipeline) is the implementation.

**Action needed during audit:**
- Remove `task_rewards` table from PRD-09A schema. Replace with a reference: "Reward processing is handled by PRD-24's gamification event pipeline."
- Add `points_override` column (INTEGER, NULL) to `tasks` table schema.
- Add `points_override` field to Task Creation Modal Section 7 (Rewards): "Points for this task (optional — overrides child's default rate)."
- Add `'randomizer_draw'` to the `tasks.source` enum values.
- Update the "MVP When Dependency Is Ready" item to reference PRD-24's gamification event pipeline.
- Note that routine_points_mode is read from `gamification_configs` during the task completion event handler.

---

## Impact on PRD-09B (Lists, Studio & Templates)

**What changed:**
- `list_items` table extended with 5 columns for Randomizer availability rules:
  - `availability_mode` TEXT DEFAULT 'unlimited' ('unlimited', 'limited_instances', 'scheduled')
  - `max_instances` INTEGER NULL (for limited_instances mode — cap on completions)
  - `completed_instances` INTEGER DEFAULT 0 (current count toward cap)
  - `recurrence_config` JSONB NULL (for scheduled mode — same shape as PRD-09A task recurrence)
  - `next_available_at` TIMESTAMPTZ NULL (calculated from recurrence_config after completion)
- `lists` table extended with 3 columns for Randomizer gamification integration:
  - `reveal_visual` TEXT NULL ('spinner', 'doors', 'cards', 'scratch_off' — only applies to randomizer-type lists)
  - `max_respins_per_period` INTEGER DEFAULT 3 NULL (re-spin limit per period)
  - `respin_period` TEXT DEFAULT 'day' NULL ('day', 'week', 'session')
- Randomizer draw behavior extended:
  - When a Randomizer list has `reveal_visual` set, the draw experience launches in a gamification modal (PRD-24, Screen 6) instead of the standard inline card.
  - Items drawn but not accepted ("Pass") return to the pool. Re-spin count decremented against `max_respins_per_period`.
  - Items accepted ("Accept") self-assign as Opportunity-type tasks (PRD-09A) with source='randomizer_draw'.
  - Items with `availability_mode='limited_instances'` increment `completed_instances` on completion. When `completed_instances >= max_instances`, the item's `is_available` is set to false.
  - Items with `availability_mode='scheduled'` set `is_available=false` and calculate `next_available_at` based on `recurrence_config` after completion. A daily cron job re-enables items whose `next_available_at` has passed.
- Studio "Coming Soon" gamification template cards: these remain stubs. PRD-24A will define what gamification templates appear in Studio.
- Randomizer dashboard widget (PRD-09B): the [Draw] button behavior now checks if the parent list has a `reveal_visual` configured. If yes, it launches the gamification reveal modal. If no (or null), it uses the standard inline draw animation from PRD-09B.

**Action needed during audit:**
- Add 5 columns to `list_items` table definition in PRD-09B.
- Add 3 columns to `lists` table definition in PRD-09B.
- Update Randomizer list type behavior description to include:
  - Gamification reveal visual integration (when `reveal_visual` is set on the parent list)
  - Accept/Pass flow for personal Randomizer draws (Context B)
  - Availability mode per item (unlimited / limited_instances / scheduled)
  - Re-spin limit enforcement
  - Self-assign on accept creating Opportunity task
- Add a daily cron job description: re-enable scheduled Randomizer items whose `next_available_at` has passed.
- Update the Randomizer dashboard widget behavior to check for `reveal_visual` on the parent list.

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**
- New widget type: **Treasure Box** (1×1 dashboard widget). Has two visual states: locked (subtle pulse, optional progress indicator) and unlocked (dancing, glowing, "Open!" button). Tapping the Open button launches the treasure box reveal modal (PRD-24, Screen 5).
- New widget type: **Points Dashboard** (S/M/L sizes). Displays member's gamification status in the configured visualization mode (counter, level, progress ring, minimal badge). PRD-24 Screen 1 defines the display. PRD-10 hosts it in the grid.
- New widget type: **Family Leaderboard** (M/L sizes). Percentage-based family ranking. PRD-24 Screen 10 defines the display.
- Gamification info widgets I-16 through I-25 from the Widget Template Catalog now have data sources:
  - I-16 (Theme Progress): reads `gamification_configs.visual_world_theme` + progress data (stub → PRD-24A)
  - I-17 (Achievement Gallery): reads `gamification_achievements`
  - I-18 (Rewards & Stars): reads `gamification_configs` + `gamification_rewards` + current point balance
  - I-19 (Coloring Gallery): reads `coloring_gallery` (stub → PRD-24B)
  - I-20 (Progress Dashboard): reads `gamification_daily_summaries` + `gamification_events` aggregate
  - I-21 (Family Leaderboard): reads task_completions aggregate, percentage-based
  - I-22 through I-25 (Family collaborative widgets): stub → PRD-24C
- Widget milestone completions (star chart fills up, color-reveal completes, gameboard reaches end) should fire a gamification event. This connection was described as a stub in PRD-10; PRD-24 defines the event: create `gamification_events` record with `source='widget_milestone'`, `source_reference_id=widget_id`.

**Action needed during audit:**
- Add Treasure Box (1×1) to PRD-10's widget type registry with two-state rendering behavior.
- Add Points Dashboard (S/M/L) to PRD-10's widget type registry with 5 visualization modes.
- Add Family Leaderboard (M/L) to PRD-10's widget type registry.
- Update Widget Template Catalog gamification widgets (I-16 through I-25) to reference PRD-24 data sources.
- Update widget milestone completion stub: on tracker completion, create `gamification_events` record with type='points_earned', source='widget_milestone'.

---

## Impact on PRD-11 (Victory Recorder & Daily Celebration)

**What changed:**
- DailyCelebration **Step 3 (Streak Update)** now has a real data source: `gamification_daily_summaries.streak_count` and `gamification_daily_summaries.streak_milestone_today`. When `streak_milestone_today` is not null, Step 3 shows an enhanced celebration with gold effects (as already described in PRD-11). When null but streak_count > 0, Step 3 shows the standard streak display. When streak_count = 0, Step 3 is skipped.
- DailyCelebration **Step 4 (Theme Progress)** now has a partial data source: `gamification_daily_summaries.points_earned_today` can be displayed as "Points earned today: +40." The theme progress visuals and overlay reveals remain stubs for PRD-24A. But the points display can render now.
- The DailyCelebration sequence should also show treasure box unlocks that happened today. If `gamification_daily_summaries.treasure_boxes_opened > 0`, Step 4 can note "You opened a treasure box today!" as part of the celebration.
- PRD-11's stub "Gamification approach modules (Dragon, Star Jar, Achievement Board, etc.)" remains a stub for PRD-24A. PRD-24 provides the data layer these modules will consume.

**Action needed during audit:**
- Update PRD-11 DailyCelebration Step 3 to reference `gamification_daily_summaries.streak_count` and `.streak_milestone_today` as the data source. Remove "stub until PRD-24" language for streak data — it's now wired.
- Update PRD-11 DailyCelebration Step 4 to reference `gamification_daily_summaries.points_earned_today` for points display. Keep "stub until PRD-24A" for theme progress visuals and overlay reveals.
- Note that treasure box opens are available in `gamification_daily_summaries` for optional Step 4 display.

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- Three new widget types deployable to the personal dashboard:
  - Points Dashboard widget (any visualization mode, S/M/L)
  - Treasure Box widget (1×1, animated states)
  - Family Leaderboard widget (M/L, opt-in)
- For Guided and Play members with gamification enabled, the gamification setup wizard can auto-deploy default widgets: Points Dashboard (medium) and any configured Treasure Box widgets.
- The greeting header's contextual data could include gamification info: "[Name], you're on a 12-day streak!" or "3 more stars until your treasure box!" — reading from `gamification_configs` and `gamification_daily_summaries`. This is an enhancement, not MVP required.

**Action needed during audit:**
- Note three new widget types available for dashboard deployment.
- Consider auto-deploy of gamification widgets for Guided/Play members during member setup.
- Forward note for greeting header: gamification context as optional rotation item.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- New request type: `'reward_redemption'`. Created when a child redeems a reward that requires mom's approval.
  - Request shows: child name, reward name, reward description, point cost, child's current balance.
  - Accept: deducts reserved points, updates `reward_redemptions.status` to 'approved', sends celebration notification to child.
  - Decline: returns reserved points, updates status to 'denied', sends gentle notification with optional mom note.
- 6 new notification types:
  - `'reward_redeemed'` — mom notified when a child uses an auto-approved reward
  - `'reward_approved'` — child notified when mom approves a reward request
  - `'reward_denied'` — child notified when mom denies a reward request (with optional note)
  - `'treasure_box_unlocked'` — child notified when a treasure box is ready to open; mom also notified
  - `'streak_milestone'` — child notified of milestone; mom notified of child's milestone
  - `'level_up'` — child notified of level increase
- New notification category: `'gamification'`. Appears in notification preference settings so members can control gamification notification volume.
- Notification preference defaults for the gamification category: ON for children, ON for mom (for children's events), OFF for adults' own gamification events (since adult gamification is opt-in and subtle).

**Action needed during audit:**
- Add `'reward_redemption'` to `requests.request_type` enum.
- Add 6 notification types to `notification_type` enum.
- Add `'gamification'` to `notification_category` enum.
- Add gamification category to notification preferences seeding with role-appropriate defaults.
- Document reward_redemption request display format (child name, reward details, point cost, balance).
- Document accept/decline behavior for reward requests.

---

## Impact on PRD-17 (Universal Queue & Routing System)

**What changed:**
- Reward approval requests appear in the **Requests tab** of the Universal Queue Modal. They follow the standard request processing flow defined in PRD-17.
- Reward request cards in the Requests tab show:
  - Child's avatar and name
  - Reward name and description
  - Point cost and child's current balance
  - [Approve] and [Decline] buttons (Decline has optional note field)
- Processing a reward request follows the same pattern as other requests — one-tap approve, optional note on decline, processed items move to the "Done" section.

**Action needed during audit:**
- Note in PRD-17 that `'reward_redemption'` is a request type that appears in the Requests tab.
- Add reward request card layout to PRD-17's Requests tab card templates (alongside calendar approvals, kid requests, etc.).

---

## Impact on PRD-22 (Settings)

**What changed:**
- New Settings category: **"Gamification"** — accessible from the Settings overlay's category navigation. Appears under Family Members → [Member Name] → Gamification. Not a top-level category; it's a sub-section of each member's settings.
- Three gamification settings screens are fully defined in PRD-24:
  - Screen 7: Reward Menu Editor (CRUD for rewards with name, cost, approval type, availability)
  - Screen 8: Gamification Settings Panel (9 collapsible sections: Enable/Disable, Currency, Point Rates, Streaks, Progress Display, Treasure Boxes, Rewards, Visual World, Reveal Visuals)
  - Screen 9: Treasure Box Configuration (list of boxes with add/edit, trigger type, content type, animation template)
- PRD-22's Family Members → [Member Name] section gains a "Gamification" navigation item that opens Screen 8.
- PRD-22's Appearance section: the "set themes for Guided and Play members" functionality now intersects with Visual World selection. For members with gamification enabled, theme selection is in the Gamification section (Visual World picker). For members without gamification, theme selection remains in Appearance. The PRD-03 theme system and the PRD-24A Visual World system coexist — Visual World overrides the dashboard theme when active.

**Action needed during audit:**
- Add "Gamification" as a navigation item under Family Members → [Member Name] in PRD-22's Settings category structure.
- Reference PRD-24 Screens 7, 8, 9 for the gamification settings panel specifications.
- Note the theme/Visual World coexistence: when gamification is enabled and a Visual World is selected, it overrides the PRD-03 theme for that member's dashboard. When gamification is disabled or no Visual World is selected, the PRD-03 theme applies normally.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-24 completed. 8 new tables: `gamification_configs`, `gamification_events`, `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_achievements`, `gamification_daily_summaries`.
- 3 existing tables extended: `family_members` (6 columns), `list_items` (5 columns), `lists` (3 columns).
- Sub-PRDs established: PRD-24A (Visual Worlds & Overlay Engine), PRD-24B (Gamification Visuals & Interactions), PRD-24C (Family Challenges & Multiplayer Gamification).
- Content Creation Pipeline validated: three-step flow (Claude generates structured prompts → Manus batch-executes against AI video tools → organized asset folders). First 7 treasure box animation templates successfully batch-generated.
- Post-PRD tooling artifacts planned: Claude Skill (overlay content generator, color-reveal processor), Manus workflow (bulk asset generation), Midjourney batch prompts (hero assets).

**Action needed during audit:**
- Move PRD-24 to Section 2 (Completed PRDs) in Build Order Source of Truth.
- Register 8 new tables.
- Note 3 table extensions.
- Add PRD-24A, PRD-24B, PRD-24C to Section 4 (Locked Numbers) — all referenced by PRD-24.
- Update Section 9 (Build Phase Mapping): PRD-24 family likely maps to Build Phase 24+ with sub-phases for each sub-PRD.
- Note in Section 10 (Reference Docs) that the Gamification Master Manuscript is the design reference for PRD-24A/B/C, same as its current notation.
- Add the validated Content Creation Pipeline to Section 12 (Strategic Context) as a new development workflow.

---

## Impact on Widget Template Catalog

**What changed:**
- Gamification info widgets I-16 through I-25 now have confirmed data sources from PRD-24's tables. These were noted as "stubs until PRD-24 is built" in the catalog.
- New widget types not in the original catalog:
  - **Treasure Box widget** (1×1): two-state (locked/unlocked) with animated transitions. Not a tracker — a gamification reward container with its own table.
  - **Points Dashboard widget** (S/M/L): 5 visualization modes. Reads from `gamification_configs` and `gamification_events`.
- The catalog's relationship table entry for PRD-24 should be updated from the current description ("Points system, Visual Worlds, Overlays, Victory Recorder, Family Quests, Family Challenges, Seasons") to reflect the actual PRD-24 family scope split.

**Action needed during audit:**
- Update Widget Catalog relationship table PRD-24 entry to: "PRD-24 (Foundation): points engine, rewards, treasure boxes, streaks, leaderboard. PRD-24A: Visual Worlds, overlays. PRD-24B: reveal animations, Star Chart, Color-Reveal. PRD-24C: family challenges, quests."
- Add Treasure Box and Points Dashboard as new widget types if not already covered by I-16 through I-25.
- Update I-16 through I-25 data source notes from "stub" to specific PRD-24 table references.

---

## Summary of All Schema Changes Across PRDs

For quick reference during the pre-build audit, here is every schema modification PRD-24 requires in other PRDs:

| Table | PRD Owner | Changes |
|-------|-----------|---------|
| `family_members` | PRD-01 | +6 columns: gamification_points, gamification_level, current_streak, longest_streak, last_task_completion_date, streak_grace_used_today |
| `tasks` | PRD-09A | +1 column: points_override (INTEGER NULL) |
| `list_items` | PRD-09B | +5 columns: availability_mode, max_instances, completed_instances, recurrence_config, next_available_at |
| `lists` | PRD-09B | +3 columns: reveal_visual, max_respins_per_period, respin_period |
| `requests` (enum) | PRD-15 | +1 value: 'reward_redemption' |
| `notifications` (enum) | PRD-15 | +6 types, +1 category |

And PRD-24's own 8 new tables: `gamification_configs`, `gamification_events`, `gamification_rewards`, `reward_redemptions`, `treasure_boxes`, `treasure_box_opens`, `gamification_achievements`, `gamification_daily_summaries`.

**Total new columns across existing tables: 15**
**Total new tables: 8**
**Total enum additions: 8 values across 3 enums**

---

*End of PRD-24 Cross-PRD Impact Addendum*
