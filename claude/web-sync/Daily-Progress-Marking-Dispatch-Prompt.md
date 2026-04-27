# Daily Progress Marking — Worker Dispatch Prompt

> **Status:** ready to paste into a fresh Claude Code session.
> **Use:** open a fresh Claude Code session in `c:\dev\MyAIMCentral-family\MyAIMCentral-family`, paste everything between the triple-backtick fences below.

---

## Paste-ready prompt for Claude Code

```
You are the Daily Progress Marking worker — a focused build that adds "Worked on this today" capability to tasks and routine steps. This is a detour build: Workers 2+3 (Shared Routines + Shared Lists) is paused and will resume after you complete. Your work gives Workers 2+3 a cleaner foundation to build sharing semantics on top of.

# What you're building (plain English)

Right now tasks and routine steps are binary: done or not done. That breaks for multi-day work. You're adding the ability to mark "I worked on this today" as a separate event from "this is done." Optionally with duration capture ("I worked on this for 25 minutes"). The system logs each session, aggregates totals, and shows who's working on what. When the thing is genuinely done, a separate "Done" action completes it.

# Step 1 — Read required materials (in this order)

1. prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md
   THE authoritative spec for this build. Read every section. Pay particular attention to:
   - §1.4 (what this does NOT do — strict scope guard)
   - §3 (Model A — single "Worked on this today" button)
   - §4 (soft-claim semantics)
   - §5 (schema changes — §5.1 was UPDATED after the initial draft to include the practice_log CHECK constraint finding)
   - §6 (task inheritance — universal rule, 10 generation paths)
   - §8 (UI surfaces with device-size breakdown)
   - §9 (forward-compat for Workers 2+3)
   - §12 (what "done" looks like — your verification checklist)
   - §13 (open questions — all answered below)

2. claude/orchestration/Daily-Progress-Marking-Pre-Build-Notes.md
   Pre-build Q&A answers from the orchestrator session, all founder-approved. Contains:
   - All 6 open questions answered
   - Scope decisions locked
   - Discovery findings (what's already built vs what's new)
   - Schema findings (CHECK constraint on practice_log)
   - Forward-compat notes for Workers 2+3

3. prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md
   The parent PRD. Read relevant sections for tasks and routine steps.

4. prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md
   Heavy dependency — Build J shipped the practice_log, useLogPractice, useSubmitMastery, and sequential task UI that you're extending.

5. claude/live_schema.md
   Verify columns against the addendum. Key findings already in the pre-build notes:
   - tasks.track_duration EXISTS (row 64) — you only add track_progress
   - practice_log.source_type has a CHECK constraint limiting to ('sequential_task', 'randomizer_item')

6. CLAUDE.md and claude/PRE_BUILD_PROCESS.md
   Non-negotiable conventions and mandatory pre-build ritual.

# Step 2 — Pre-build decisions (LOCKED — do not re-litigate)

These are founder-approved. Build against them, don't question them:

SCHEMA:
- tasks.track_progress BOOLEAN NOT NULL DEFAULT false — NEW column
- tasks.track_duration already exists — DO NOT re-add
- tasks.in_progress_member_id UUID NULL — NEW column (Option B for soft-claim)
- lists.default_track_progress BOOLEAN NOT NULL DEFAULT false — NEW column
- list_items.track_progress BOOLEAN NULL — NEW column (NULL = inherit from list)
- practice_log.source_type CHECK must be ALTERED to add 'task' and 'routine_step'
  - This is a DB-level CHECK constraint, not just application validation
  - Migration must be additive (existing rows stay valid) and reversible
  - Test that 0 existing rows violate the new CHECK before applying

SOFT-CLAIM:
- Option B: explicit in_progress_member_id column on tasks
- Set on first practice session logged
- Cleared on task completion
- Mom and task creator always override completion gate
- Sibling cross-claim: warning surface, not hard block

DURATION CHIPS:
- [5, 10, 15, 30, 45, 60] minutes plus Custom field plus Skip option

GENERATION PATHS:
- Paths A-G: MANDATORY in this build (highest-traffic surfaces)
- Paths H-J: opportunistic (retrofit if you touch the surface; else file stub)
- See addendum §6.3 for the full path enumeration

TIER GATING:
- Wire useCanAccess() with feature keys per addendum §10
- All return true during beta (placeholder, not enforced)

# Step 3 — Pre-build ritual (mandatory)

Follow claude/PRE_BUILD_PROCESS.md. Specifically:

- Create feature decision file at claude/feature-decisions/PRD-09A-Daily-Progress-Marking.md
- Create active build file at .claude/rules/current-builds/daily-progress-marking.md (no YAML paths: frontmatter)
- The pre-build summary must include:
  a. Sub-task sequence (numbered, dependency order)
  b. Schema migration plan (single migration covering all new columns + CHECK ALTER)
  c. Code path mapping for each generation Path A-G (specific file:line references)
  d. Aggregation display layout proposal — must work for BOTH "1 session · 15 min" AND "273 sessions · 2,667 hours" (founder reviews before code)
  e. Soft-claim cross-claim warning copy proposal (founder reviews before code)
  f. Stub list (inactivity auto-unclaim, Paths H-J if not touched)
  g. Mom-UI surfaces with device-size breakdown per surface (from addendum §8)
- Present to founder for explicit approval before writing code

# Step 4 — Open questions still needing founder input during pre-build

Q4 — Aggregation display layout: Worker proposes. Must handle both extremes naturally ("1 session · 15 min" and "273 sessions · 2,667 hours"). Founder reviews.

Q6 — Soft-claim cross-claim warning copy: Worker proposes. Founder reviews.

Both must be in the pre-build summary. Don't start coding until founder approves both.

# Step 5 — Working pattern

- One commit per sub-task. Report to founder. Wait for approval. Move to next.
- Plain English mandatory in every report. "What this means for mom" framing.
- Visual Verification Standard: open browser, hard reload, eyes-on confirmation.
- Mobile (375px), tablet (768px), desktop (1024px+) verification on all UI surfaces.
- tsc -b must pass at every commit (Convention #121).
- No suggesting stopping points. Founder paces.
- No backward-compat scaffolding. One production family.
- If you discover scope expansion, surface to founder. Don't silently expand.

# Step 6 — Things to NOT do

- Don't build list-item practice/mastery action buttons (GAP-A — separate scope)
- Don't build bulk-edit UI for track toggles (GAP-D — separate scope)
- Don't build cross-task time aggregation reports (deferred to PRD-28B)
- Don't build inactivity-based auto-unclaim (stub it, register in STUB_REGISTRY)
- Don't touch Workers 2+3 scope (sharing mode, instantiation mode, four-mode matrix)
- Don't change the existing sequential-task or randomizer-item practice flows — extend, don't replace

# Step 7 — Context: what's paused and why

Workers 2+3 (Shared Routines + Shared Lists) is PAUSED with full scoping intact at:
  .claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md

That file contains all 8 founder-answered questions, discovery pass results, bug fixes folded in, and the convention to add. Workers 2+3 resumes after this build closes, inheriting your progress-marking infrastructure per addendum §9 (forward-compat section).

DO NOT modify the paused build file. DO NOT start any Workers 2+3 work. Your scope is Daily Progress Marking only.

# Step 8 — Post-build

When all sub-tasks complete:
1. Run post-phase checklist (Convention #14)
2. Verify every item in addendum §12 ("What Done Looks Like")
3. Present verification table to founder
4. After sign-off: move build file to completed-builds, update IDLE.md
5. Surface to founder: "Daily Progress Marking shipped. Workers 2+3 remains paused with full scoping intact. Ready to resume Workers 2+3?"
6. DO NOT auto-resume Workers 2+3. Wait for founder confirmation.

# Begin

Read Step 1 materials. Then confirm:
  "Materials read. I am the Daily Progress Marking worker. Ready to run pre-build."
Wait for founder acknowledgment before proceeding to Step 3.
```

---

## Notes for the founder before pasting

- Open a **fresh** Claude Code session (new "+" conversation in VS Code sidebar). Same project folder.
- The addendum at `prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md` must be committed before the worker reads it. If you haven't committed it yet, do so first.
- The pre-build notes at `claude/orchestration/Daily-Progress-Marking-Pre-Build-Notes.md` and the paused Workers 2+3 file at `.claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md` should also be committed so the fresh session can read them.
- First checkpoint: worker confirms materials read. Second checkpoint: pre-build summary with Q4 layout proposal + Q6 warning copy. Third checkpoint: per-sub-task commits.
- After this build closes, you'll decide whether to resume Workers 2+3 or do something else.
