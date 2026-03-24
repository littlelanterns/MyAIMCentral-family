# Build Prompt 30: Guided & Play Dashboards

## PRD Reference
- PRD-25: `prds/dashboards/PRD-25-Guided-Dashboard.md`
- PRD-26: `prds/dashboards/PRD-26-Play-Dashboard.md`
- Addenda: `prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md`, `prds/addenda/PRD-26-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 14 (Personal Dashboard, Calendar, Family Overview, Hub, TV Mode) complete
- Phase 29 (Gamification) complete

## Objective
Build two additional dashboard shell variants: the Guided dashboard (simplified, prompted interactions, parent-configured features, includes DailyCelebration) and the Play dashboard (visual, sticker-based, emoji-friendly, gamification-prominent, task completion triggers visual celebrations). Both use the existing `dashboard_configs` table. This is a Medium phase.

## Database Work
Uses existing tables:
- `dashboard_configs` — Extend with guided and play shell type configurations

No new tables required. Add guided/play shell types to dashboard_configs enum/type if not already present.

## Component Work
### Guided Dashboard (PRD-25)
- Guided shell layout — Simplified single-column or minimal layout with large touch targets
- Prompted interactions — Step-by-step guided prompts for daily activities (tasks, routines, check-ins)
- Parent-configured features — Mom selects which features appear on the guided dashboard per child
- DailyCelebration integration — End-of-day celebration summary rendered within guided shell
- Reduced navigation — Limited nav options to prevent overwhelm; focus on current activity

### Play Dashboard (PRD-26)
- Play shell layout — Visual, colorful layout with sticker and emoji-based interface elements
- Sticker-based UI — Task cards, status indicators, and navigation use sticker/emoji visual language
- Gamification-prominent display — Points, streaks, level, and overlay world front and center
- Task completion celebrations — Visual celebration animation on each task completion (confetti, sparkles, etc.)
- Simplified task view — Age-appropriate task display with large completion buttons

## Testing Checklist
- [ ] Guided dashboard renders with simplified layout
- [ ] Prompted interactions guide user through daily activities step by step
- [ ] Parent-configured features respect mom's selections per child
- [ ] DailyCelebration renders within guided shell
- [ ] Play dashboard renders with sticker/emoji-based visuals
- [ ] Gamification elements (points, streaks, level) display prominently on play shell
- [ ] Task completion triggers visual celebration animation
- [ ] Both dashboard types persist via dashboard_configs
- [ ] Shell type switching works between guided, play, and standard dashboards
- [ ] Both dashboards render correctly on mobile and tablet

## Definition of Done
- All PRD-25 and PRD-26 MVP items checked off
- Guided dashboard functional with prompted interactions and DailyCelebration
- Play dashboard functional with sticker-based UI and celebration animations
- Parent configuration of child dashboard features working
- Dashboard type selection integrated with existing shell/layout system
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
