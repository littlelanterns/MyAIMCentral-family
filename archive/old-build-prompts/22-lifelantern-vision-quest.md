# Build Prompt 22: LifeLantern & Family Vision Quest

## PRD Reference
- PRD-12A: `prds/personal-growth/PRD-12A-Personal-LifeLantern.md`
- PRD-12B: `prds/personal-growth/PRD-12B-Family-Vision-Quest.md`

## Prerequisites
- Phase 07 (GuidingStars & BestIntentions) complete
- Phase 08 (InnerWorkings) complete
- Phase 13 (Archives & Context) complete

## Objective
Build the Personal LifeLantern as a holistic life assessment and vision tool covering 6 life areas (e.g., relationships, career, health, finances, spirituality, personal growth). Each area includes self-assessment, vision statement crafting, goal setting, and role model identification. Build the Family Vision Quest as an asynchronous, family-wide collaborative process where members respond to guided prompts, LiLa synthesizes responses, and the family produces a shared Family Vision Statement through discussion and refinement.

## Database Work
Create tables:
- `life_lantern_areas` — Per-member life area records with area type, current assessment score, notes, vision text, goals
- `life_lantern_area_snapshots` — Point-in-time snapshots of life area assessments for tracking change over time
- `life_lantern_role_models` — Role models associated with life areas (name, description, what they represent, member association)
- `personal_vision_statements` — Member's overall personal vision statement with version history
- `family_vision_quests` — Family-level vision quest instances with status (active/completed), start date, synthesis results
- `vision_sections` — Sections/prompts within a vision quest (e.g., "What matters most to our family?")
- `vision_section_history` — Version history of vision section content over time
- `vision_section_responses` — Individual member responses to vision quest sections
- `vision_section_discussions` — Threaded discussion on vision sections for family deliberation
- `family_vision_statements` — Completed family vision statements with version history

Enable RLS on all tables. Members manage their own LifeLantern; Vision Quest responses are visible to participating members; mom initiates and manages quests.

## Component Work
- LifeLantern dashboard — Overview of all 6 life areas with assessment scores and visual indicators
- Life area detail view — Deep dive into one area with assessment, vision, goals, role models
- Assessment flow — Guided self-assessment for each life area with scoring and reflection
- Snapshot history — Timeline of assessment snapshots showing growth/change over time
- Role model management — Add, edit, browse role models per life area
- Personal vision statement editor — Craft and refine overall personal vision with LiLa assistance
- Family Vision Quest launcher — Mom initiates quest, selects participants, sets timeline
- Vision Quest response flow — Members respond to quest prompts asynchronously at their own pace
- LiLa synthesis — AI synthesizes all member responses into draft vision themes
- Family discussion view — Threaded discussion per vision section for deliberation and refinement
- Family Vision Statement editor — Collaborative editor for finalizing the shared statement
- Vision Quest archive — Browse past completed quests and statements

## Edge Function Work
- `synthesize-vision-responses` — Analyzes all member responses and produces thematic synthesis for family review

## Testing Checklist
- [ ] LifeLantern displays all 6 life areas with current assessment scores
- [ ] Assessment flow saves scores and creates snapshots for history tracking
- [ ] Role models can be added and associated with specific life areas
- [ ] Personal vision statement saves with version history
- [ ] Family Vision Quest sends prompts to all participating members
- [ ] Members can respond to quest prompts asynchronously
- [ ] LiLa synthesis produces coherent themes from member responses
- [ ] Family Vision Statement can be drafted, discussed, and finalized

## Definition of Done
- All PRD-12A and PRD-12B MVP items checked off
- LifeLantern functional with all 6 life areas and snapshot history
- Family Vision Quest end-to-end flow working (launch, respond, synthesize, discuss, finalize)
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
