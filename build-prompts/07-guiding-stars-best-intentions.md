# Build Prompt 07: GuidingStars & BestIntentions

## PRD Reference
- PRD-06: `prds/personal-growth/PRD-06-Guiding-Stars-Best-Intentions.md`

## Prerequisites
- Phase 06 (LiLa Core) complete

## Objective
Build GuidingStars declarations and BestIntentions tracking with celebration integration.

## Database Work
Create tables:
- `guiding_stars` — Identity declarations with categories, source, embedding
- `best_intentions` — Intentional reminders with tags, iteration count
- `intention_iterations` — Records each practice/celebration

## Component Work
- GuidingStars page with category sections
- Manual entry flow
- "Craft with LiLa" guided mode (AI-assisted declaration writing)
- BestIntentions page with tap-to-celebrate
- Iteration tracking with confetti animation (debounced 500ms)
- is_included_in_ai toggle per item
- Context assembly integration (GuidingStars + BestIntentions as context sources)

## Stubs Created
- Family-level GuidingStars → PRD-12B
- Dashboard widget containers → PRD-10
- Morning/Evening rhythm rotation → PRD-18
- Extract from Content → future content upload

## Testing Checklist
- [ ] Can create GuidingStars manually
- [ ] Craft with LiLa generates declarations
- [ ] BestIntentions iteration tap works with confetti
- [ ] is_included_in_ai toggle works
- [ ] Embedding pipeline processes new entries
- [ ] Context assembly includes these sources

## Definition of Done
- Both features fully functional
- Embedding trigger firing for new entries
- LiLa context assembly wired
