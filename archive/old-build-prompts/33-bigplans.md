# Build Prompt 33: BigPlans

## PRD Reference
- PRD-29: `prds/platform-complete/PRD-29-BigPlans.md`
- Addendum: `prds/addenda/PRD-29-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 06 (LiLa Core AI) complete
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Phase 12 (Victory Recorder & Family Celebration) complete

## Extraction Pull
- `bigplans_condensed_intelligence.md` for seeding friction diagnosis templates and plan archetypes

## Objective
Build the BigPlans project planning feature: manual and AI-compiled project plans with milestone tracking, LiLa check-ins, friction detection (Friction Finder as a free onboarding feature), system design trial (7-day), deployed components (widgets/UI on dashboard), and journal integration. Also adds `journal_entries.related_plan_id` column. This is a Medium phase.

## Database Work
Create tables:
- `plans` — Project plan records with title, description, status, type (manual/AI-compiled), owner, timeline, deployed component config
- `plan_milestones` — Milestone records within a plan with target date, status, completion criteria
- `plan_components` — Deployable components (widgets, UI elements) associated with a plan for dashboard display
- `plan_check_ins` — LiLa check-in records with plan context, progress notes, friction indicators, next steps
- `friction_diagnosis_templates` — Seeded templates for Friction Finder analysis (free onboarding feature)

Alter existing tables:
- `journal_entries` — Add `related_plan_id` column (nullable FK to plans)

Enable RLS on all tables. Members access their own plans. Family plans visible to configured members.

## Component Work
### Plan Creation & Management
- Manual plan creation — Create plans with title, description, milestones, timeline
- AI-compiled plans — LiLa generates plan structure from goal description (milestones, timeline, components)
- Plan overview — Dashboard view of all plans with status, progress percentage, next milestone
- Milestone tracking — View, update, complete milestones with progress indicators

### LiLa Integration
- LiLa check-ins — Scheduled or on-demand check-ins where LiLa reviews plan progress and suggests adjustments
- Friction detection — LiLa identifies friction points (stalled milestones, missed deadlines, recurring blockers)
- Friction Finder — Free onboarding feature: diagnose project friction using seeded templates (no subscription required)

### System Design Trial
- 7-day trial — Time-limited plan experience for new users to explore BigPlans functionality

### Deployed Components
- Plan widgets — Deployable widgets showing plan progress on personal dashboard
- Plan UI elements — Contextual plan information displayed within dashboard layout

### Journal Integration
- Related plan linking — Journal entries can be linked to a plan via related_plan_id
- Plan journal view — View all journal entries related to a specific plan

## Testing Checklist
- [ ] Manual plan creation with milestones works
- [ ] AI-compiled plan generates reasonable milestones and timeline from goal description
- [ ] Plan overview displays all plans with correct status and progress
- [ ] Milestone completion updates plan progress percentage
- [ ] LiLa check-in generates contextual progress review
- [ ] Friction detection identifies stalled milestones
- [ ] Friction Finder works without subscription (free onboarding feature)
- [ ] 7-day system design trial activates and expires correctly
- [ ] Plan widgets deploy to dashboard
- [ ] Journal entries link to plans via related_plan_id
- [ ] Plan journal view shows related entries
- [ ] RLS restricts plan access to owner and configured members

## Definition of Done
- All PRD-29 MVP items checked off
- Manual and AI-compiled plan creation operational
- Milestone tracking with progress calculation working
- LiLa check-ins and friction detection functional
- Friction Finder available as free onboarding feature
- Deployed components rendering on dashboard
- Journal integration via related_plan_id verified
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
