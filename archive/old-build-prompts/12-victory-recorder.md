# Build Prompt 12: Victory Recorder & Family Celebration

## PRD Reference
- PRD-11: `prds/personal-growth/PRD-11-Victory-Recorder-Daily-Celebration.md`
- PRD-11B: `prds/personal-growth/PRD-11B-Family-Celebration.md`

## Prerequisites
- Phase 07 (GuidingStars & BestIntentions) complete
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Phase 11 (Widgets, Trackers & Dashboard Layout) complete

## Objective
Build the Victory Recorder for quick capture of wins and accomplishments, with AIR (Automatic Identification & Routing) that detects victories from task completions, intention progress, and tracker milestones. Include celebration narrative generation via LiLa, voice selection for how celebrations are delivered, family celebration mode for shared acknowledgment, and a victory archive for looking back.

## Database Work
Create tables:
- `victories` — Individual victory records with description, source (manual/task/intention/tracker), category, member, timestamp
- `victory_celebrations` — Generated celebration narratives tied to victories, with voice/tone metadata
- `victory_voice_preferences` — Per-member preferences for celebration voice/style (enthusiastic, gentle, humorous, etc.)
- `family_victory_celebrations` — Family-wide celebration events aggregating individual victories for shared moments

Enable RLS on all tables. Members own their victories; family celebrations visible to all family members.

## Component Work
- Quick victory capture — One-tap record with optional description, auto-categorization
- AIR (Automatic Identification & Routing) — Detects victory-worthy events from tasks, intentions, trackers and auto-creates victory records
- Celebration narrative display — LiLa-generated celebration text with selected voice/tone
- Voice selection UI — Choose celebration personality (enthusiastic, gentle, humorous, poetic, coach)
- Family celebration mode — Aggregated view of family wins, shared celebration moment
- Victory archive — Searchable, filterable history of all victories with celebration narratives
- Victory widget — Dashboard widget showing recent victories and streaks

## Edge Function Work
- `generate-celebration` — Calls AI to produce celebration narrative based on victory context and voice preference

## Testing Checklist
- [ ] Manual victory capture saves and displays with celebration narrative
- [ ] AIR auto-detects victories from task completions
- [ ] AIR auto-detects victories from intention iterations
- [ ] Voice preference selection persists and affects narrative tone
- [ ] Family celebration mode aggregates victories from multiple members
- [ ] Victory archive filters by member, category, and date range
- [ ] Victory widget displays on dashboard correctly

## Definition of Done
- All PRD-11 and PRD-11B MVP items checked off
- AIR routing functional for tasks, intentions, and trackers
- Celebration narratives generating with correct voice preferences
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
