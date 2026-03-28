# MyAIM Family: PRD Template
## Standard Structure for Feature PRDs

**Purpose:** This template defines the structure for all MyAIM Family PRDs. It is based on the proven StewardShip PRD pattern, adapted for the multi-member family platform. Sections are guidelines, not rigid requirements — flex based on feature complexity. Simple features may skip sections; complex ones may add subsections.

**Principle:** PRDs describe *what* we're building and *why*. Implementation details (file paths, component architecture, build phasing, session setup) belong in build prompts, not here.

---

## Template

---

```markdown
# PRD-[##]: [Feature Name]

**Status:** Not Started
**Dependencies:** [List PRD numbers this feature depends on]
**Created:** [Date]
**Last Updated:** [Date]

---

## Overview

[2-3 paragraphs max. What is this feature? Why does it matter? What problem does it solve for the user? If there's a guiding philosophy or metaphor, state it here. This should make someone who's never seen the app understand what this feature is about.]

---

## User Stories

### [Category 1]
- As a [role], I want to [action] so I can [benefit].

### [Category 2]
- As a [role], I want to [action] so I can [benefit].

[Group user stories by theme. Include stories for different member roles where relevant (mom, dad, teen, Special Adult). Don't try to be exhaustive — capture the intent and the important interactions.]

---

## Screens

### Screen 1: [Screen Name]

**What the user sees:**
- [Describe the visual layout, key elements, content shown]
- [Be specific enough that a designer or developer could build from this]

**Interactions:**
- [What happens when the user taps/clicks each element]
- [What data is created, updated, or displayed]
- [Where does the user go next]

**Data created/updated:**
- [What records are created or modified by actions on this screen]

### Screen 2: [Screen Name]
[Same pattern...]

[Continue for each screen. This is the heart of the PRD — be thorough here. Include wireframe-style ASCII layouts where they help clarify complex arrangements. Include empty states, error states, and loading states where relevant.]

---

## Visibility & Permissions

[How does each member role interact with this feature? This section is critical for MyAIM Family since every feature intersects with the 5-role permission model.]

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | [Full / Partial / None] | [Details] |
| Dad / Additional Adult | [Full / Partial / None] | [Details — what does mom control?] |
| Special Adult | [Full / Partial / None] | [Details — scoped to assigned kids?] |
| Independent (Teen) | [Full / Partial / None] | [Details — what can teen see/do?] |
| Guided / Play | [Full / Partial / None] | [Details — simplified version?] |

### Shell Behavior
[How does this feature appear (or not) in each shell? Does it have a different name, layout, or reduced functionality in certain shells?]

### Privacy & Transparency
[Any teen transparency rules? What can teens see about their own settings? Can dad adjust his own privacy for this feature?]

---

## Data Schema

### Table: `[table_name]`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| [column] | [type] | [default] | [nullable] | [notes] |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** [Describe who can read/write/update/delete. Reference the family_id + family_member_id scoping pattern. Be explicit.]

**Indexes:**
- [index description and columns]

[Repeat for each table. Include exact column names, types, and constraints. These become the migration SQL during build.]

### Enum/Type Updates
[Any additions to existing enums or types from other PRDs]

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| [Source feature] | [Description of data flow] |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| [Destination feature] | [Description of data flow] |

[This section maps cross-feature data connections. Every feature is part of a larger system — document how this one connects.]

---

## AI Integration

[If this feature involves LiLa or any AI behavior, describe it here.]

### Guided Mode
- Guided mode name: `[mode_name]`
- Context loaded: [What data does the AI receive?]
- AI behavior: [How should the AI behave in this mode?]

### System Prompt Notes
[Key instructions for the AI when this feature's context is active. Not the full system prompt — that goes in the build prompt. Just the behavioral rules and personality notes.]

[Skip this section entirely if the feature has no AI integration.]

---

## Edge Cases

### [Edge Case Name]
- [Description of the scenario]
- [How the system should handle it]

[Include: empty states, error states, what happens when data is missing, network failures, concurrent access, large data volumes, and any scenario where the "happy path" breaks.]

---

## Tier Gating

[Which `useCanAccess()` feature keys does this PRD introduce? All return true during beta, but the keys must exist from day one.]

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `[feature_key]` | [What it gates] | [Essential / Enhanced / Full Magic] |

[If this feature has no tier gating considerations, note "No tier-specific gating. Feature available at all tiers." and skip the table.]

---

## Stubs

### Stubs Created by This PRD
[Features or connections that this PRD references but that will be built in future PRDs. These become placeholder code during build.]

| Stub | Wires To | Future PRD |
|------|----------|------------|
| [Description] | [What it connects to] | PRD-[##] |

### Existing Stubs Wired by This PRD
[Stubs created by earlier PRDs that this feature now completes.]

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| [Description] | PRD-[##] | [Implementation] |

[If no stubs in either direction, note "None" and move on.]

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] [Specific, verifiable checklist item]
- [ ] [Another specific item]
- [ ] [Include at least one RLS verification item]
- [ ] [Include at least one cross-feature verification item if applicable]

### MVP When Dependency Is Ready
- [ ] [Feature that requires another PRD to be built first]
- [ ] [Note which PRD it depends on]

### Post-MVP
- [ ] [Nice-to-have features for later]
- [ ] [Enhancements that aren't critical for launch]

---

## CLAUDE.md Additions from This PRD

[Conventions, patterns, and rules this PRD establishes that should be added to the project's CLAUDE.md. These help Claude Code maintain consistency across future build sessions.]

- [ ] [Convention or pattern]
- [ ] [Another convention]

---

## DATABASE_SCHEMA.md Additions from This PRD

[Summary of schema changes for the master schema document.]

Tables defined: [list]
Enums updated: [list]
Triggers added: [list]

---

*End of PRD-[##]*
```

---

## Section Usage Guide

### Always Include
- **Overview** — Every feature needs context
- **Screens** — The core spec; be thorough
- **Data Schema** — Exact tables and columns
- **What "Done" Looks Like** — Tiered verification checklist
- **CLAUDE.md Additions** — Patterns for future build consistency

### Include When Relevant
- **User Stories** — Skip for very small features or addenda (like Cyrano/Higgins)
- **Visibility & Permissions** — Skip only if the feature is mom-only with no multi-role considerations
- **Flows** — Skip if the feature is self-contained with no cross-feature data movement
- **AI Integration** — Skip if no AI involvement
- **Edge Cases** — Can be light for simple features, thorough for complex ones
- **Tier Gating** — Include even if just to say "available at all tiers"
- **Stubs** — Include even if just to say "none"

### Never Include in PRDs (These Belong in Build Prompts)
- File paths and folder structure (`src/components/feature/...`)
- Component architecture and hook specifications
- "Read These First" file lists for coding sessions
- Build phase splitting (Phase A / Phase B)
- Documentation update checklists (CLAUDE.md, BUILD_STATUS.md updates as tasks)
- Session context headers for Claude Code

### Flex Based on Complexity
- **Simple features** (like Higgins, Cyrano): Lean PRDs, maybe 100-200 lines. Overview, how it works, data model, done checklist.
- **Medium features** (like Victory Recorder, Safe Harbor): Full template, all sections, 200-400 lines.
- **Complex features** (like Auth, Tasks, Smart Notepad): Thorough PRDs, detailed screens, multiple tables, extensive edge cases, 400+ lines.

---

## Naming Conventions Reminder

- **Database tables:** snake_case, never nautical, never changes once created
- **Feature names:** As defined in Planning Decisions (LifeLantern, LiLa, Guiding Stars, etc.)
- **UI feature names:** User-configurable where noted, otherwise consistent across shells
- **PRD numbering:** Sequential, with letter suffixes for addenda (PRD-12A, PRD-13A)

---

*Template version: 1.0*
*Based on: StewardShip PRD patterns (PRD-01, PRD-06, PRD-12, PRD-12A, PRD-13A, PRD-20, PRD-21)*
*Adapted for: MyAIM Family v2 multi-member architecture*
*Created: February 28, 2026*
