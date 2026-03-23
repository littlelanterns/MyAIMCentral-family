# Build Prompt 29: Gamification

## PRD Reference
- PRD-24: `prds/gamification/PRD-24-Gamification-Overview-Foundation.md`
- PRD-24A: `prds/gamification/PRD-24A-Overlay-Engine-Gamification-Visuals.md`
- PRD-24B: `prds/gamification/PRD-24B-Gamification-Visuals-Interactions.md`
- Addenda: `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md`, `prds/addenda/PRD-24A-Cross-PRD-Impact-Addendum.md`, `prds/addenda/PRD-24A-Game-Modes-Addendum.md`, `prds/addenda/PRD-24B-Cross-PRD-Impact-Addendum.md`, `prds/addenda/PRD-24B-Content-Pipeline-Tool-Decisions.md`

## Prerequisites
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Phase 12 (Victory Recorder & Family Celebration) complete

## Objective
Build the full gamification system: points, streaks, levels, treasure boxes, and the overlay engine. The pipeline is task completion → points → streak → level → treasure box → overlay reveal. Includes mom-configured rewards, 8 treasure box reveal types (from PRD-24B), config-driven overlay engine with visual world themes, dashboard backgrounds, achievement badges, daily celebration pipeline, streak milestones (7/14/21/30/60/90 days), and equitable normalization for multi-child families. This is a Very Large phase — consider splitting into 29A (points/streaks/levels data layer) and 29B (treasure boxes + overlay engine + visuals).

## Database Work
Create tables:
- `gamification_configs` — Family-level gamification settings (point values, level thresholds, enabled features, normalization rules)
- `gamification_events` — Individual point-earning events with source (task, routine, habit, etc.), points awarded, timestamp
- `gamification_rewards` — Mom-configured rewards with point cost, availability, and redemption rules
- `reward_redemptions` — Reward redemption records with status (pending, approved, fulfilled)
- `treasure_boxes` — Earned treasure boxes with reveal type (1 of 8), contents, and open status
- `treasure_box_opens` — Records of treasure box opening events with reveal animation type used
- `gamification_achievements` — Achievement badge definitions and member unlock records
- `gamification_daily_summaries` — Daily rollup of points, streaks, levels for each member
- `overlay_instances` — Active overlay/visual world instances per member with theme and state
- `overlay_collectibles` — Collectible items earned within overlay worlds
- `recipe_completions` — Completion records for gamification recipe/challenge sequences

Enable RLS on all tables. Members see their own gamification data. Mom role configures family-level settings and rewards.

## Component Work
### Points & Streaks
- Points engine — Award points on task/routine/habit completion based on gamification_configs
- Streak tracker — Track consecutive-day activity with milestone detection (7/14/21/30/60/90)
- Level progression — Calculate level from cumulative points with configurable thresholds
- Equitable normalization — Adjust point earning rates for multi-child families based on age/ability

### Rewards & Treasure Boxes
- Mom-configured rewards — CRUD for rewards with point costs and redemption rules
- Reward redemption flow — Request → mom approval → fulfillment tracking
- Treasure boxes — Earn boxes at level-up or streak milestones
- Treasure box reveals — 8 reveal types from PRD-24B (animation variants for opening)

### Overlay Engine
- Overlay engine — Config-driven visual world system with theme definitions
- Visual world themes — Multiple theme options (space, ocean, forest, etc.) with collectible items
- Dashboard backgrounds — Unlockable dashboard backgrounds tied to gamification progress
- Achievement badges — Badge gallery with unlock conditions and display

### Celebrations
- Daily celebration pipeline — End-of-day summary of points earned, streaks maintained, achievements unlocked
- Streak milestone celebrations — Special celebration UI for 7/14/21/30/60/90-day milestones

## Testing Checklist
- [ ] Task completion awards correct points based on config
- [ ] Streak increments on consecutive-day activity
- [ ] Streak resets correctly on missed days
- [ ] Streak milestones (7/14/21/30/60/90) trigger celebrations
- [ ] Level progression calculates correctly from cumulative points
- [ ] Equitable normalization adjusts fairly for multi-child families
- [ ] Mom can create, edit, and delete rewards
- [ ] Reward redemption flow: request → approve → fulfill
- [ ] Treasure boxes earned at correct triggers (level-up, milestones)
- [ ] All 8 treasure box reveal types render correctly
- [ ] Overlay engine loads themes and displays visual world
- [ ] Collectibles accumulate within overlay world
- [ ] Dashboard backgrounds unlock and apply
- [ ] Achievement badges unlock at correct conditions
- [ ] Daily celebration summary generates accurately
- [ ] RLS restricts gamification config to mom role

## Definition of Done
- All PRD-24, PRD-24A, PRD-24B MVP items checked off
- Full pipeline operational: task → points → streak → level → treasure box → overlay
- Mom-configured rewards with redemption workflow functional
- All 8 treasure box reveal types implemented
- Overlay engine rendering with at least 2 theme options
- Equitable normalization verified for multi-child scenarios
- Streak milestones triggering celebrations
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
