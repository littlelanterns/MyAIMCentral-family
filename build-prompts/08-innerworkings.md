# Build Prompt 08: InnerWorkings

## PRD Reference
- PRD-07: `prds/personal-growth/PRD-07-InnerWorkings.md`
- PRD-07 Addendum: `prds/addenda/PRD-07-Session-Addendum.md`

## Prerequisites
- Phase 06 (LiLa Core) complete

## Objective
Build InnerWorkings (self-knowledge) with 5 categories, multiple input paths, sharing model.

## Database Work
Create table:
- `self_knowledge` — 5 categories (personality, strengths, growth_areas, communication_style, how_i_work), source_type, sharing booleans, embedding

Note: This replaces the deprecated `member_self_insights` table from PRD-05.

## Component Work
- InnerWorkings page with 5 category sections
- Manual entry per category
- Bulk add (paste and categorize)
- File upload with AI extraction (Enhanced tier)
- "Self-Discovery with LiLa" guided mode (Enhanced tier)
- Sharing toggles (share_with_mom, share_with_dad)
- is_included_in_ai toggle
- Teen privacy: private by default, mom toggles visibility

## Testing Checklist
- [ ] All 5 categories render and accept entries
- [ ] Bulk add correctly categorizes
- [ ] File upload extracts to correct categories
- [ ] Sharing toggles work (teen default: private)
- [ ] Context assembly includes InnerWorkings
- [ ] Embedding pipeline processes entries

## Definition of Done
- All input paths working
- Sharing model enforced by RLS
- Context assembly integration complete
