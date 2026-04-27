# Daily Progress Marking — Orchestrator Session Dispatch Prompt

> **Status:** ready to paste into a fresh Claude Code session.
> **Use:** open a fresh Claude Code session in `c:\dev\MyAIMCentral-family\MyAIMCentral-family`, paste everything between the triple-backtick fences below.

---

## Paste-ready prompt for Claude Code

```
You are opening a fresh orchestrator session for the Daily Progress Marking build. Your role definition auto-loads from .claude/rules/orchestrator.md; your full spec is at claude/orchestration/Orchestrator-Agent-Spec.md.

This is NOT a pre-scoped worker session. You are the orchestrator for this entire build: pre-build summary → execute → checkpoints → close-out. You coordinate, verify, and manage state. You also write the code (single-worker build — you are both orchestrator and executor).

Plan Mode work is already done — a previous conductor session ran discovery passes, surfaced all open questions, got founder approval on every decision, and produced a pre-build notes file. You enter Execute Mode against locked decisions, with one final pre-build summary for founder approval as the gate before code.

# Step 1 — Read required materials (in this order)

Read EVERY item. Do not skim.

ORCHESTRATION FRAMEWORK:
1. .claude/rules/orchestrator.md — your auto-loaded role definition
2. claude/orchestration/Orchestrator-Agent-Spec.md — full spec
3. claude/orchestration/Verifier-Checkpoint-Schedule.md — the six checkpoints you run
4. claude/orchestration/Close-Build-And-Baton-Pass-Spec.md — how this build closes

STATE:
5. .claude/state/CURRENT.md — current state (confirms this build is active, Workers 2+3 paused)
6. .claude/state/HISTORY.md — session history for continuity

THIS BUILD'S SPEC:
7. prds/addenda/PRD-09A-Daily-Progress-Marking-Addendum.md
   THE authoritative spec. Read every section. Pay particular attention to:
   - §1.4 (what this does NOT do — strict scope guard)
   - §3 (Model A — single "Worked on this today" button)
   - §4 (soft-claim semantics, including §4.5 soft-claim visibility on claimer's dashboard)
   - §5 (schema changes — §5.1 includes the practice_log CHECK constraint finding)
   - §6 (task inheritance — universal rule, 10 generation paths, §6.4 resolution function, §6.6 worker verification step)
   - §8 (UI surfaces with device-size breakdown)
   - §9 (forward-compat for Workers 2+3)
   - §12 (what "done" looks like — your verification checklist)
   - §13 (open questions — all answered in the pre-build notes)

8. claude/orchestration/Daily-Progress-Marking-Pre-Build-Notes.md
   Founder-approved Q&A answers from the previous conductor session. Contains:
   - All 6 open questions answered and locked
   - Scope decisions locked (schema, soft-claim Option B, chip values, generation paths, tier gating)
   - Discovery findings (what's already built vs what's new)
   - Schema findings (CHECK constraint on practice_log — CRITICAL for migration)
   - Forward-compat notes for Workers 2+3

PARENT PRD + DEPENDENCIES:
9. prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md — parent PRD
10. prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md — Build J shipped practice_log, useLogPractice, useSubmitMastery, sequential task UI; heavy dependency
11. claude/live_schema.md — verify columns. Key: tasks.track_duration EXISTS (row 64), practice_log.source_type has CHECK limiting to ('sequential_task','randomizer_item')

CONVENTIONS:
12. CLAUDE.md and claude/PRE_BUILD_PROCESS.md — non-negotiable conventions and mandatory pre-build ritual

# Step 2 — Intent confirmation (mandatory per Orchestrator-Agent-Spec §2.2)

After reading all materials, confirm to founder:

> "Materials read. I am the orchestrator for the Daily Progress Marking build.
>
> State confirmed:
> - Workers 2+3 is PAUSED with full scoping preserved at .claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md
> - Daily Progress Marking is the active build
> - Previous conductor session completed Plan Mode: all discovery passes done, all 6 open questions founder-approved, scope decisions locked
>
> Pre-build decisions locked (I will not re-litigate):
> - Schema: tasks.track_progress (new), tasks.in_progress_member_id (new, Option B), lists.default_track_progress (new), list_items.track_progress (new). tasks.track_duration already exists.
> - practice_log.source_type CHECK must be ALTERED to add 'task' and 'routine_step' (DB-level, additive, reversible)
> - Soft-claim: Option B (explicit column), set on first practice, cleared on completion, mom/creator always override, sibling cross-claim = warning not block
> - Duration chips: [5, 10, 15, 30, 45, 60] + Custom + Skip
> - Generation paths: A-G mandatory, H-J opportunistic
> - Tier gating: placeholder, all return true during beta
>
> Two items still need founder review during pre-build:
> - Q4: Aggregation display layout (I will propose, handling both '1 session · 15 min' and '273 sessions · 2,667 hours')
> - Q6: Soft-claim cross-claim warning copy (I will propose)
>
> Ready to run pre-build ritual and produce the summary for your approval."

Wait for founder's explicit confirmation before proceeding.

# Step 3 — Pre-build ritual (Checkpoint 1)

Follow claude/PRE_BUILD_PROCESS.md:

- Create feature decision file at claude/feature-decisions/PRD-09A-Daily-Progress-Marking.md
- Create active build file at .claude/rules/current-builds/daily-progress-marking.md (no YAML paths: frontmatter)

The pre-build summary must include:

a. Sub-task sequence (numbered, dependency order)
b. Schema migration plan (single migration covering all new columns + CHECK ALTER)
c. Code path mapping for each generation Path A-G (specific file:line references from codebase grep)
d. Aggregation display layout proposal — must handle ALL of these naturally without per-case redesign:
   - "1 session · 15 min"
   - "47 sessions · 32 hours"
   - "273 sessions · 2,667 hours"
   Founder reviews before code.
e. Soft-claim cross-claim warning copy proposal — founder reviews before code
f. Stub list (inactivity auto-unclaim, Paths H-J if not touched)
g. Mom-UI surfaces with device-size breakdown per surface (from addendum §8)
h. Initialize Mom-UI Verification Table in the active build file (empty, filled as work progresses)

Present summary to founder. Do not write code until founder explicitly approves.

# Step 4 — Locked decisions (do not re-litigate)

SCHEMA:
- tasks.track_progress BOOLEAN NOT NULL DEFAULT false — NEW column
- tasks.track_duration already exists — DO NOT re-add
- tasks.in_progress_member_id UUID NULL — NEW column (Option B for soft-claim)
- lists.default_track_progress BOOLEAN NOT NULL DEFAULT false — NEW column
- list_items.track_progress BOOLEAN NULL — NEW column (NULL = inherit from list)
- practice_log.source_type CHECK must be ALTERED to add 'task' and 'routine_step'
  - DB-level CHECK constraint, not just application validation
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
- Paths A-G: MANDATORY in this build
- Paths H-J: opportunistic (retrofit if touching the surface; else file stub)
- See addendum §6.3 for full enumeration

TIER GATING:
- Wire useCanAccess() with feature keys per addendum §10
- All return true during beta (placeholder, not enforced)

# Step 5 — Execute Mode (working pattern)

- One commit per sub-task. Report to founder with plain-English "What this means for mom" framing. Wait for approval before next sub-task.
- Checkpoint 2 fires between sub-tasks: deliverables present, tsc -b clean, Mom-UI verification if UI touched.
- Update Mom-UI Verification Table in active build file as each surface ships. Record evidence and timestamp.
- Visual Verification Standard: open browser, hard reload, eyes-on confirmation across mobile (375px), tablet (768px), desktop (1024px+).
- tsc -b must pass at every commit (Convention #121).
- Pre-commit and pre-push hooks fire automatically — do not bypass.
- No suggesting stopping points. Founder paces.
- No backward-compat scaffolding. One production family.
- If you discover scope expansion ("we should also build X"), surface to founder. Don't silently expand.
- Monitor own context budget per Orchestrator-Agent-Spec §3. Surface baton-pass options at ~70% context usage. Present options on merit, not as a stopping suggestion.

# Step 6 — Things to NOT do

- Don't build list-item practice/mastery action buttons (GAP-A — separate scope)
- Don't build bulk-edit UI for track toggles (GAP-D — separate scope)
- Don't build cross-task time aggregation reports (deferred to PRD-28B)
- Don't build inactivity-based auto-unclaim (stub it, register in STUB_REGISTRY)
- Don't touch Workers 2+3 scope (sharing mode, instantiation mode, four-mode matrix)
- Don't modify the paused Workers 2+3 build file
- Don't change existing sequential-task or randomizer-item practice flows — extend, don't replace

# Step 7 — Context: what's paused and why

Workers 2+3 (Shared Routines + Shared Lists) is PAUSED with full scoping intact at:
  .claude/rules/current-builds/workers-2-3-shared-routines-lists-PAUSED.md

That file contains all 8 founder-answered questions, discovery pass results, bug fixes folded in, and the convention to add. Workers 2+3 resumes after this build closes, inheriting your progress-marking infrastructure per addendum §9 (forward-compat section).

DO NOT modify the paused build file. DO NOT start any Workers 2+3 work. Your scope is Daily Progress Marking only.

# Step 8 — Close-out (Checkpoint 5 + 6)

When all sub-tasks complete, invoke Close-Build-And-Baton-Pass-Spec.md Trigger A (build complete):

1. Checkpoint 5 — Post-build audit:
   - Verify every item in addendum §12 ("What Done Looks Like")
   - Zero Missing requirements
   - Mom-UI Verification Table complete (all surfaces ✅ on all device sizes)
   - Present full verification table to founder

2. Checkpoint 6 — Close-out cascade:
   - Mark active build file complete, move to .claude/completed-builds/2026-04/
   - Update BUILD_STATUS.md, STUB_REGISTRY.md, live_schema.md (regen via npm run schema:dump)
   - Update CLAUDE.md with new conventions from addendum §11
   - Update WIRING_STATUS.md
   - Write HISTORY.md entry capturing observations from this build
   - Update CURRENT.md
   - Commit and push (with founder approval)

3. Surface to founder:
   > "Daily Progress Marking shipped. Workers 2+3 remains paused with full scoping intact. Ready to resume Workers 2+3?"

4. DO NOT auto-resume Workers 2+3. Wait for founder confirmation.

# Step 9 — Baton-pass (if needed mid-build)

If context runs thin before build completes, invoke Close-Build-And-Baton-Pass-Spec.md Trigger B:

- Active build file stays ACTIVE with progress recorded
- Write checkpoint HISTORY entry (where you are, what's done, what's left)
- Generate handoff prompt for next session (append to active build file under ## Baton-Pass Handoffs)
- Surface options to founder: continue here (estimated headroom), wrap after next sub-task, wrap now

# Begin

Read Step 1 materials. Then run Step 2 (intent confirmation). Wait for founder acknowledgment before proceeding to Step 3 (pre-build ritual).
```

---

## Notes for the founder before pasting

- Open a **fresh** Claude Code session (new "+" conversation in VS Code sidebar). Same project folder.
- All referenced files are committed (commit 9dc7a60). The fresh session can read them.
- First checkpoint: intent confirmation (Step 2). Second checkpoint: pre-build summary with Q4 + Q6 proposals (Step 3). Then per-sub-task commits through Execute Mode.
- The orchestrator framework files (.claude/rules/orchestrator.md, claude/orchestration/*.md) auto-load or are explicitly referenced — the fresh session will know how to run checkpoints and close out.
- After this build closes, you decide whether to resume Workers 2+3 or do something else.
