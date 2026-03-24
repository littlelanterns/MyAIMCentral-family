# Build Prompt 19: Rhythms & Reflections

## PRD Reference
- PRD-18: `prds/daily-life/PRD-18-Rhythms-Reflections.md`

## Prerequisites
- Phase 07 (GuidingStars & BestIntentions) complete
- Phase 09 (Journal & Smart Notepad) complete
- Phase 12 (Victory Recorder & Family Celebration) complete
- Phase 14 (Personal Dashboard & Calendar) complete

## Objective
Build the Rhythms system for structured daily routines (Morning, Evening, and Periodic) with 26+ configurable section types that pull from across the platform (gratitude, intentions review, victory recap, journal prompt, prayer, scripture, weather, calendar preview, etc.). Build the Reflection Prompts system with 32 default prompts plus custom prompt creation. Implement DailyCelebration for guided children as a simplified, visually engaging daily wrap-up experience.

## Database Work
Create tables:
- `rhythm_configs` — Per-member rhythm definitions with type (morning/evening/periodic), section order, schedule, enabled status
- `rhythm_completions` — Records of rhythm completions with timestamp, sections completed, duration, streak tracking
- `reflection_prompts` — Prompt library with text, category, default flag, custom flag, member association
- `reflection_responses` — Member responses to reflection prompts with text, timestamp, associated rhythm completion

Enable RLS on all tables. Members manage their own rhythms and responses; mom can configure rhythms for guided children.

## Component Work
- Rhythm builder — Configure rhythm with ordered sections from 26+ available types
- Morning rhythm — Guided flow through configured sections (greeting, weather, calendar preview, intention setting, gratitude, etc.)
- Evening rhythm — Guided flow through configured sections (day review, victory recap, gratitude, reflection, tomorrow preview, etc.)
- Periodic rhythm — Configurable rhythm for weekly/monthly check-ins
- Section type renderers — Individual components for each section type (gratitude input, scripture display, weather widget, calendar summary, etc.)
- Reflection prompt browser — Browse, search, and select from prompt library; create custom prompts
- Reflection response input — Text entry for responding to prompts within rhythm or standalone
- DailyCelebration — Simplified daily wrap-up for guided children with visual celebrations, stickers, and simple prompts
- Rhythm streak tracker — Visual streak display for consecutive rhythm completions
- Rhythm dashboard section — Dashboard integration showing rhythm status and next scheduled rhythm

## Edge Function Work
- None (rhythms use existing platform data; no dedicated AI processing needed)

## Testing Checklist
- [ ] Morning rhythm flows through all configured sections in order
- [ ] Evening rhythm includes day review with data from tasks, victories, and journal
- [ ] All 26+ section types render correctly within rhythm flow
- [ ] Reflection prompts include 32 defaults and support custom prompt creation
- [ ] DailyCelebration renders simplified experience for guided children
- [ ] Rhythm streaks track consecutive completions accurately
- [ ] Rhythm completions save and appear in history
- [ ] Rhythm status appears correctly on personal dashboard

## Definition of Done
- All PRD-18 MVP items checked off
- Morning and Evening rhythms functional with configurable sections
- Reflection prompt system operational with defaults and custom prompts
- DailyCelebration working for guided child role
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
