# MyAIM Central v2 — Pre-Build Audit Prompt

## Context

You are Opus 4.6 with 1M context. You have access to the complete MyAIM Central family platform specification — 52+ PRDs, 39 addenda, 20+ spec documents, and philosophy/brand reference materials. This is a family management and transformation platform built by a solo founder (Tenise) for AI-curious moms managing complex households.

Your job is to perform a comprehensive pre-build audit, then generate all foundational files the build needs.

## Phase 1: Read Everything (Do This First, Silently)

Read every file in these folders:
- `prds/` (all subfolders — every PRD and addendum)
- `specs/` (all living docs and technical references)
- `reference/` (philosophy, brand, condensed intelligence)

Do NOT start outputting anything until you've read everything. The whole point is cross-referencing.

## Phase 2: Consistency Audit (Interactive — Tenise Is Present)

After reading everything, present your findings. For each inconsistency:

### Auto-Resolved (show in a summary table)
For OBVIOUS inconsistencies where there's clearly a newer decision that supersedes an older one:
- Show what was inconsistent
- Show what you resolved it to
- Show which document is authoritative

### Needs Ruling (present individually)
For GENUINELY AMBIGUOUS inconsistencies where reasonable people could disagree:
- Describe the conflict clearly
- Present 3 possible resolutions with trade-offs for each
- Highlight your recommended option and why
- Wait for Tenise's ruling before proceeding

### Categories to Check

1. **Table/Column Name Conflicts** — same table referenced with different names across PRDs
2. **Feature Key Inconsistencies** — feature keys that don't match across tier gating, permission matrix, and the PRDs that define them
3. **Stub Tracking** — stubs created in early PRDs that were supposed to be wired by later PRDs. Are any still unwired?
4. **Guided Mode Registry** — compile the complete list of guided modes across all PRDs. Any duplicates? Any that supersede others without noting it?
5. **Notification Categories** — compile the complete list across all PRDs. Any missing registrations?
6. **Event/Signal Contracts** — events that one PRD fires and another consumes. Do the shapes match?
7. **Schema Conflicts** — columns defined differently in different PRDs for the same table
8. **PRD Number References** — any PRD referencing a future PRD number that doesn't match what was actually written
9. **Build Order Dependencies** — any circular dependencies? Any PRD that needs something from a later-ordered PRD?
10. **Naming Conventions** — any nautical names that slipped into database tables? Any inconsistent compound naming (LifeLantern vs Life_Lantern)?
11. **Side Quest Resolution** — check the Side Quests list in MyAIM_Remaining_PRDs_Ordered.md. Which ones were resolved by written PRDs? Which remain?

## Phase 3: Generation (Autonomous — Tenise May Be Sleeping)

After all rulings are complete, generate these files. Write them directly — don't ask for permission for each one.

### 3A: CLAUDE.md (Root File)
Create a lean CLAUDE.md that uses @imports. This is what Claude Code reads at every session start. It should include:
- Project overview (2-3 paragraphs)
- Tech stack
- Key architectural patterns
- Import references to detailed files in `claude/`
- Critical conventions that apply to ALL code

### 3B: claude/live_schema.md
The live database schema snapshot, auto-generated from production via `npm run schema:dump`. Every API-exposed table and every column, with current row counts. Types, indexes, RLS policies, and triggers are NOT included — for those, refer to migration files under `supabase/migrations/`. Organized by domain (auth, personal_growth, family, communication, ai_vault, gamification, platform). Include the total table count.

### 3C: claude/architecture.md
Component architecture, routing structure, service layer patterns, state management approach, the 5-shell system, responsive patterns. Enough for a developer to understand how the app is structured without reading every PRD.

### 3D: claude/conventions.md
All coding conventions extracted from PRDs: naming patterns, RLS policy patterns, the Human-in-the-Mix pattern, feature key registration, PermissionGate usage, useCanAccess() wiring, activity logging patterns, queue routing patterns, stub conventions.

### 3E: claude/ai_patterns.md
LiLa's architecture, guided mode system, context assembly, the 9 AI cost optimization patterns (P1-P9), the embedding pipeline, the Platform Intelligence Pipeline channels, model routing (when to use Opus vs Sonnet vs Haiku).

### 3F: claude/feature_glossary.md
Updated feature glossary with every feature, its PRD, its display name, its database name, and its feature key(s).

### 3G: asset-requirements/visual-assets-needed.md
CRITICAL: Extract every reference to visual assets across all PRDs. Organize by category:
- LiLa character images and expressions
- Vault tool thumbnails (list every tool that needs one)
- Gamification reward images, animations, visual world assets
- Avatar options for family members
- Theme/vibe assets (textures, patterns)
- Star chart images, color-reveal zone maps
- Treasure box animations
- Tutorial screenshots/mockups
- Brand assets (logo variations, favicon)
- Any other images, icons, or visual content referenced anywhere

For each asset, note: which PRD references it, what it should depict, what format it needs to be in, and whether it's MVP-critical or post-MVP.

### 3H: build-prompts/00-build-order.md
The master build order. List every build prompt in sequence with:
- Which PRD(s) it covers
- What database tables it creates
- What it depends on (which earlier build prompts must be complete)
- Estimated complexity (small/medium/large)
- Whether it needs a StewardShip extraction pull first (see workflows/stewardship-extraction.md)

### 3I: build-prompts/01-through-NN.md
Generate individual build prompt files for each build phase. Each prompt should include:
1. **Objective** — what this build prompt delivers
2. **PRD References** — which PRDs to read (with file paths)
3. **Prerequisites** — what must be built first
4. **Database Work** — tables to create, migrations to write
5. **Component Work** — what to build in the frontend
6. **Service/Edge Function Work** — backend logic
7. **Extraction Pull** — if this feature needs condensed intelligence from StewardShip, note it (Opus will run the extraction workflow before building)
8. **Testing Checklist** — specific tests to write and run, pulled from the PRD's "What Done Looks Like" section. Let Opus decide what type of testing makes sense for each prompt (unit, component, integration, e2e)
9. **Definition of Done** — how to know this prompt is complete

### 3J: Tracking & Build Infrastructure Files

Initialize these files per the Pre-Build Setup Checklist (specs/Pre-Build-Setup-Checklist.md):

1. **FIXME-LOG.md** — Cross-scope issues log (empty table header)
2. **PATTERN-DECISIONS.md** — Architectural decisions made during build (empty table header)
3. **RLS-VERIFICATION.md** — Per-table, per-role access verification matrix (empty table header, access level shorthand defined)
4. **AI-COST-TRACKER.md** — Edge function AI cost log (empty table header, pre-log the `embed` Edge Function as first entry)
5. **BUILD_STATUS.md** — All build phases listed as pending, with PRD references and dependency chains
6. **STUB_REGISTRY.md** — Compiled from every PRD's "Stubs Created" and "Stubs Wired" sections. Every stub across all 52+ PRDs, with created-by PRD, wired-by PRD (or "unwired"), and build phase assignment
7. **QA-SHELLS.md** — Per-shell verification checklist covering all 5 shells, with structural checks for routing, navigation zones, permission gates, LiLa access, and theme rendering

### 3K: Testing Infrastructure

Generate the foundational test suite files per the Testing QA Architecture (specs/MyAIM-Testing-QA-Architecture.md):
- Shell routing tests (from PRD-04 tables)
- Zone availability tests (from PRD-04 tables)
- Permission engine tests (from PRD-02 feature key registry)
- Convention lint rules
- Guided mode registration tests
- Vibe & theme token tests

These test files should be written to `tests/` and will initially fail against an empty app — that's correct TDD behavior.

### 3L: questions-for-tenise.md
Any questions that came up during generation that you couldn't resolve from the PRDs alone. Format as a numbered list with context for each question. Tenise will answer these in bulk when she wakes up.

## IMPORTANT: Pre-Build Tool Installation (Manual Steps for Tenise)

Before running the first build prompt, Tenise must install two tools manually. Remind her in questions-for-tenise.md:

### AURI Security Scanner (Endor Labs)
- Free MCP-based scanner, runs locally, code never leaves machine
- Install the AURI MCP server (no signup, no credit card)
- Add to VS Code MCP config
- Must be active from the FIRST line of auth code (PRD-01)

### mgrep Semantic Search (Mixedbread AI)
- `npm install -g @mixedbread-ai/mgrep`
- `mgrep login` (authenticates via browser)
- `cd MyAIMCentral-family && mgrep watch` (indexes project)
- `mgrep install-claude-code` (wires into Claude Code searches)
- Keeps 60-70% of context window free by replacing full-file loads with semantic chunk retrieval

## StewardShip Database Access

You have access to the StewardShip Supabase database via the credentials in `.env.local`. Use it to:
- Verify extraction content exists for features that depend on it
- Pull code patterns from the existing implementation
- Check what books have been extracted and what hasn't

Connection: Use the STEWARDSHIP_SUPABASE_URL and STEWARDSHIP_SUPABASE_ANON_KEY to query via the REST API, or STEWARDSHIP_DATABASE_URL for direct SQL.

## Important Rules

1. **PRDs are the source of truth.** If a spec doc conflicts with a PRD, the PRD wins. If two PRDs conflict, the more recently written one wins (check the date headers).
2. **The Build Order Source of Truth v2** in specs/ was last updated March 16 and is STALE — all PRDs are now written. Use it for historical context only.
3. **Never modify files in prds/, specs/, or reference/.** These are read-only source material.
4. **Write all generated files to claude/, build-prompts/, asset-requirements/, or workflows/.**
5. **Feature names use compound capitals:** LifeLantern, InnerWorkings, GuidingStars, BestIntentions, BookShelf, ThoughtSift, BigPlans, MindSweep, DailyCelebration.
6. **Database tables use snake_case.** No nautical names. No exceptions.
7. **The platform's AI assistant is named LiLa** (Little Lanterns).
8. **Human-in-the-Mix:** Every AI output goes through Edit/Approve/Regenerate/Reject before saving. This is both UX and legal liability protection.
9. **Buffet principle:** Maximalist options, minimalist auto-defaults.
10. **Celebration-only surfaces:** Victory Recorder is a Ta-Da list. No punishment mechanics anywhere.
