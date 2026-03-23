# Workflow: Build a Feature

## Standard Pattern for Each Build Prompt

### Pre-Build (if extraction needed)
1. Check if this feature has a condensed intelligence file in `reference/`
2. If not, and the feature needs extracted wisdom, run `workflows/stewardship-extraction.md` first
3. Read the condensed intelligence file before writing any LiLa prompts

### Database Phase
1. Read the PRD's Data Schema section
2. Write Supabase migration files in `supabase/migrations/`
3. Create tables, columns, indexes, RLS policies, triggers
4. Run migration: `npx supabase db push` or `npx supabase migration up`
5. Verify tables exist and RLS works

### Component Phase
1. Read the PRD's Screens section
2. Scaffold page routes and components in `src/`
3. Build UI components following the Design System (PRD-03)
4. Wire PermissionGate and useCanAccess() from day one
5. Implement Human-in-the-Mix pattern for all AI outputs

### Service Phase
1. Build Supabase Edge Functions for any server-side logic
2. Wire LiLa guided modes if applicable
3. Implement queue routing patterns if applicable
4. Set up activity logging

### Testing Phase
1. Read the PRD's "What Done Looks Like" section
2. Write tests that verify each MVP checklist item
3. Run tests and fix failures
4. Document any issues in the build prompt's completion notes

### Completion
1. Mark the build prompt as complete
2. Note any stubs created for future PRDs
3. Note any deviations from the PRD (with reasoning)
4. Move to the next build prompt

## Conventions (Apply to ALL Code)

- TypeScript strict mode
- Functional components with hooks
- Tailwind CSS for styling (through the Design System's vibe/theme layer)
- Supabase client via shared singleton
- All dates in UTC, display in user's timezone
- Feature keys wired from day one (useCanAccess returns true during beta)
- Activity logging on all CRUD operations
- Mobile-first responsive design
- No console.log in production code (use structured logging)
