# MyAIM Family: Build Prompt Template
## Standard Structure for Claude Code Build Sessions

**Purpose:** Every build prompt follows this structure. It was refined across 12+ build phases during StewardShip development and produces consistent, high-quality results with minimal rework.

**Usage:** The AI Planning Tool (Opus in Claude.ai) drafts these prompts. The user copies the prompt into a new Claude Code session in VS Code. Claude Code reads the referenced files, implements, and verifies.

---

## Template Structure

### 1. Session Context Header

```
# Phase [X]: [Feature Name] — Fresh Session Prompt

Copy everything below into a new conversation to start Phase [X].

---

## Context for New Session

I'm building MyAIM Family, a unified family intelligence platform 
(Vite + React 19 + TypeScript + Supabase + Vercel).

**Completed phases:**
- Phase 1: [one-line summary]
- Phase 2: [one-line summary]
- ...
- Phase [X-1]: [one-line summary]

**This phase builds: [Feature Name] ([PRD reference])**
[2-3 sentence summary of what this feature is and why it matters]
```

**Rules for this section:**
- Always list ALL completed phases so Claude Code has full project context
- Keep each phase summary to one line
- Reference the specific PRD number(s) this phase implements

---

### 2. Read These First (Ordered File List)

```
## Read These First (in order):

1. CLAUDE.md (full file — conventions, stub registry, patterns)
2. docs/[relevant-PRD].md (the feature spec for this phase)
3. docs/DATABASE_SCHEMA.md (table schemas — verify existing tables)
4. docs/MyAIM_Family_System_Overview.md (system context, cross-feature rules)
5. src/core/database/types.ts (existing TypeScript interfaces)
6. [any additional files specific to this phase — contexts, hooks, 
   edge functions to reference as patterns, migration files to verify]
```

**Rules for this section:**
- CLAUDE.md always first — it contains the conventions Claude Code must follow
- The relevant PRD always second — it's the spec being implemented
- DATABASE_SCHEMA.md always third — prevents schema mismatches
- Additional files should be the minimum needed, with a reason noted
- Never list more than 10 files — too many causes context overload

---

### 3. What You're Building

```
## What You're Building

### [Feature/Component Name]
[Detailed description pulled from the PRD. Include:]

**Pages:**
1. [PageName] (`src/path/to/Page.tsx`) — [what it shows, key interactions]

**Components:**
- [ComponentName] — [purpose, where it's used]

**Hooks:**
- [useFeatureName] — [what data it manages, CRUD operations]

**Edge Functions (if any):**
- [function-name] — [purpose, when it's called]

**Database tables (verify existing / create new):**
- [table_name] — [status: exists in migration XXX / new migration needed]
```

**Rules for this section:**
- Be specific about file paths — Claude Code should know exactly where each file goes
- Reference the folder structure from the Architecture Plan
- Specify whether database tables already exist or need new migrations
- Include behavioral rules, edge cases, and cross-feature interactions from the PRD
- Include system prompt text verbatim when relevant (for AI-powered features)

---

### 4. Schema / Migration Details

```
## Schema Details

### Existing Tables (verify in migration files)
[List tables that should already exist, with key columns to verify]

### New Migration (if needed)
Create `supabase/migrations/[NNN]_[description].sql`:

```sql
-- [Exact SQL for new tables, columns, indexes, RLS policies]
```

### RLS Policy Pattern
[Specify the exact RLS pattern for this feature's tables.
Reference the visibility/permissions system from PRD-02.]
```

**Rules for this section:**
- Always include the exact SQL — never leave it for Claude Code to infer
- Always specify RLS policies explicitly
- Always specify indexes
- Note which columns use the visibility system (if applicable)
- Reference the family_member_id + family_id scoping pattern

---

### 5. Edge Function Specifications (if applicable)

```
## Edge Function: [function-name]

Create `supabase/functions/[function-name]/index.ts`

**Pattern:** Follow the same structure as [reference existing function]

**Inputs:**
```typescript
{
  // Exact TypeScript interface for the request body
}
```

**Outputs:**
```typescript
{
  // Exact TypeScript interface for the response
}
```

**System Prompt:**
```
[Exact system prompt text if this is an AI-powered function]
```

**Key decisions:**
- [API key handling — same as existing pattern]
- [Model selection — Haiku for lightweight, Sonnet for complex]
- [Cost considerations if relevant]
```

**Rules for this section:**
- Always reference an existing edge function as the structural pattern
- Include exact TypeScript interfaces for inputs and outputs
- Include exact system prompt text — don't leave it for Claude Code to write
- Specify which AI model to use and why

---

### 6. Stub Wiring

```
## Stub Wiring This Phase

### Stubs to Wire (from previous phases)
Check CLAUDE.md Stub Registry for these — they should be marked STUB:
- [Stub description] → [what to wire it to, how]

### Cross-Feature Connections
- [Feature A] → [Feature B]: [what data flows, how]
```

**Rules for this section:**
- Always check the Stub Registry before writing this section
- Be explicit about what "wiring" means — which file, which function, what data

---

### 7. Project Conventions Reminder

```
## Project Conventions (same as always)

- TypeScript must compile without errors
- All CSS uses `var(--color-*)` variables — no hardcoded colors
- All new tables need RLS verification
- Mobile-first — test on mobile viewport before desktop
- No Unicode emoji in adult interfaces — Lucide icons only
- Merciful defaults — no guilt language, no aggressive nudging
- Human-in-the-Mix — every AI output has Edit/Approve/Regenerate/Reject
- Edge Functions follow the established proxy pattern
- All shared components imported from `src/core/components/`
- Visibility system follows the pattern from PRD-02
```

**Rules for this section:**
- Keep this consistent across all prompts — don't change the conventions
- Add new conventions as they're discovered (they get added to CLAUDE.md too)

---

### 8. What "Done" Looks Like

```
## What "Done" Looks Like

- [ ] [Specific, verifiable checklist item]
- [ ] [Another specific item]
- [ ] [UI behavior: "User can do X and sees Y"]
- [ ] [Data behavior: "Entry saves to table with correct family_member_id"]
- [ ] [RLS: "Member A cannot see Member B's private entries"]
- [ ] [Cross-feature: "Feature A reads from Feature B correctly"]
- [ ] TypeScript compiles without errors
- [ ] All CSS uses var(--color-*) variables
- [ ] CLAUDE.md updated (stub registry, new conventions)
- [ ] BUILD_STATUS.md updated (phase marked complete, timestamp)
- [ ] System Overview updated (PRD index status)
- [ ] DATABASE_SCHEMA.md updated (if new tables/columns)
```

**Rules for this section:**
- Every item must be verifiable — no vague "works correctly"
- Always include the four doc-update items at the end
- Include at least one RLS verification item for any phase with data
- Include at least one cross-feature verification item

---

### 9. Stubs Created This Phase

```
## Stubs Created This Phase

| Stub | Created In | Wires To | Phase | Status |
|------|-----------|----------|-------|--------|
| [Description] | [File/component] | [Target feature] | Phase [Y] | STUB |
```

**Rules for this section:**
- Every stub must specify which future phase will wire it
- Use the exact same format as the CLAUDE.md Stub Registry
- Claude Code copies this table into CLAUDE.md during the doc update step

---

### 10. Documentation Updates

```
## Documentation Updates

### CLAUDE.md Updates
- Add to Stub Registry: [exact entries]
- Add to Conventions (if new patterns discovered): [description]
- Update any existing entries that changed

### BUILD_STATUS.md Updates
- Mark Phase [X] as complete with timestamp

### System Overview Updates
- Update PRD Index: `| PRD-XX: [Name] | Phase [X] Built ✅ |`
- Update Build Order section with completion markers

### DATABASE_SCHEMA.md Updates
- [Exact tables/columns to add or update]
- [Or "No changes needed" if no schema changes]
```

**Rules for this section:**
- Be explicit about what goes where — Claude Code should be able to follow these as step-by-step instructions
- Always include all four documents even if some say "No changes needed"

---

## Sub-Phase Splitting Guidelines

If a phase is too large for one Claude Code session (rule of thumb: more than 3 new pages + 1 edge function + significant cross-feature wiring), split into sub-phases:

- **[X]A:** Data layer + core UI (tables, hooks, main page, CRUD)
- **[X]B:** AI integration + cross-feature wiring (edge functions, context loading, stub wiring)
- **[X]C:** Polish + secondary features (if needed)

Each sub-phase gets its own complete build prompt following this template.

---

## Session Prompt (for planning sessions that draft build prompts)

When starting a planning session to draft a build prompt, use this format:

```
## Your Tasks

Before writing the build prompts, please:

1. Read the current repo docs — CLAUDE.md, DATABASE_SCHEMA.md, System Overview
2. Read [relevant PRD] thoroughly
3. Check the Stub Registry for all stubs that wire in this phase
4. Confirm the sub-phase split makes sense (or suggest adjustments)
5. Write the build prompt(s), including all sections from the template
6. Flag any architectural decisions that need discussion before building

**Key architectural decisions to consider:**
- [Decision 1 specific to this phase]
- [Decision 2]
```

---

## Anti-Patterns (Things That Went Wrong When We Skipped Steps)

1. **Skipping the "Read These First" list** → Claude Code makes assumptions that contradict existing patterns
2. **Vague "What Done Looks Like"** → Features built but untestable, bugs found later
3. **Missing stub documentation** → Stubs forgotten, discovered as broken connections phases later
4. **No schema SQL in the prompt** → Claude Code invents column names that don't match the PRD
5. **Too many files in one session** → Context window fills up, quality drops in later files
6. **Skipping doc updates** → Next session's Claude Code starts with stale context, makes mistakes

---

*Template version: 1.0*
*Based on: StewardShip Phase 7, 8, 9 build prompts (proven across 12+ build cycles)*
*Created: February 2026*
