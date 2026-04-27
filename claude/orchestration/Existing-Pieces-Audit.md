# Existing Pieces Audit — What to Keep, Extend, Add

**Purpose:** Map what already exists in the MyAIM repo against what the orchestration layer needs. Tells Claude Code exactly what to keep as-is, what to extend, and what's net-new — so the implementation builds on existing strength rather than reinventing.

**Status:** Draft — read this BEFORE implementing the orchestration layer.

**Companion to:** `Orchestrator-Agent-Spec.md`, `Verifier-Checkpoint-Schedule.md`, `Close-Build-And-Baton-Pass-Spec.md`.

---

## Plain English (What This Means For Tenise)

You have a real, substantial foundation already — five working agents, five working skills, a documented pre-build process, a feature decisions library, and active build files that auto-load. The orchestration layer **isn't building from zero** — it's adding the connective tissue between pieces that already work. This audit tells Claude Code "here's what's already strong, don't rewrite it" and "here's what's missing, build that." The goal is to land the orchestration layer in one focused session, not a multi-day rebuild.

---

## Section 1 — Existing Skills

### 1.1 `/prebuild` — KEEP AS-IS, MINOR EXTENSION

**Location:** `.claude/skills/prebuild/SKILL.md`

**What it does:** Runs the mandatory pre-build ritual for a PRD. Reads PRD + addenda, checks live schema, creates feature decision file, populates active build file. Step 0 includes thorough tool health checks.

**Status:** **Keep as-is.** This skill is well-developed and battle-tested.

**Minor extension needed:** The pre-build summary should explicitly enumerate **mom-UI surfaces to verify** so Checkpoint 5 has a checklist. Add a section to the summary template:

```markdown
## Mom-UI Surfaces

This build will touch the following mom-facing surfaces. Each must be verified at desktop ≥1024px and mobile ≤640px in every shell mom encounters.

- [Surface name] — shells: [Mom, Independent, etc.]
- [Surface name] — shells: [list]

Backend-only deliverables (no UI):
- [list, or "none"]
```

**How the Orchestrator uses it:** Plan Mode invokes `/prebuild PRD-XX` for PRD-driven builds. Orchestrator does not duplicate this work.

---

### 1.2 `/feature-session` — KEEP AS-IS, MINOR EXTENSION

**Location:** `.claude/skills/feature-session/SKILL.md`

**What it does:** Scopes a fresh-session worker prompt that bundles founder-flagged bugs + audit rows on a feature surface + new gaps surfaced during scoping. Produces a paste-ready dispatch prompt for one comprehensive feature-anchored session.

**Status:** **Keep as-is.** This skill is the entry point for feature-session and bug-fix-pass builds.

**Minor extension needed:** Same as `/prebuild` — the worker prompt this skill produces should explicitly enumerate mom-UI surfaces affected by the bundled scope.

**How the Orchestrator uses it:** Plan Mode invokes `/feature-session [surface]` for feature-surface-driven builds. For bug-fix passes, Plan Mode invokes `/bug-triage-merge` first, founder picks cluster, then Orchestrator invokes `/feature-session` against the cluster's surface.

---

### 1.3 `/bug-triage-merge` — KEEP AS-IS

**Location:** `.claude/skills/bug-triage-merge/SKILL.md`

**What it does:** Pulls every open bug report from `beta_glitch_reports`, cross-references against `TRIAGE_WORKSHEET.md`, clusters by feature surface, returns prioritized clustered queue.

**Status:** **Keep as-is.** This skill is the entry point for bug-fix-pass builds.

**No extension needed:** The skill correctly hands its output to the founder; the Orchestrator reads the founder's cluster choice and invokes `/feature-session` against the right surface.

**How the Orchestrator uses it:** Plan Mode invokes when founder triggers a bug-fix pass. After founder picks a cluster, Orchestrator pivots to `/feature-session [surface]`.

---

### 1.4 `/bug-reports` — KEEP AS-IS

**Location:** `.claude/skills/bug-reports/SKILL.md`

**What it does:** Looks at individual bug reports in detail. Used during scoping when ambiguous reports need investigation.

**Status:** **Keep as-is.** Niche tool, used by `/feature-session` during scoping.

**How the Orchestrator uses it:** Indirect — invoked during `/feature-session` scoping, not directly by Orchestrator.

---

### 1.5 `/myaim-frontend-design` — KEEP AS-IS

**Location:** `.claude/skills/myaim-frontend-design/SKILL.md`

**What it does:** Frontend design conventions for MyAIM Family.

**Status:** **Keep as-is.** Reference material for workers building UI.

**How the Orchestrator uses it:** Indirect — workers reference it when building UI. Orchestrator may surface it in dispatch prompts when a worker is doing frontend work.

---

## Section 2 — Existing Agents

### 2.1 `pre-build-auditor` — KEEP AS-IS, MINOR EXTENSION

**Location:** `.claude/agents/pre-build-auditor.md`

**What it does:** Performs the mandatory PRE_BUILD_PROCESS.md ritual for a given PRD number. Produces complete pre-build summary for founder review.

**Status:** **Keep as-is.** This agent is the workhorse for Checkpoint 1.

**Minor extension needed:** Output should include the mom-UI surfaces section described in §1.1 above.

**How the Orchestrator uses it:** Invokes during Plan Mode for PRD-driven builds. Output flows to Checkpoint 1 (founder approval).

---

### 2.2 `post-build-verifier` — KEEP AS-IS, EXTEND

**Location:** `.claude/agents/post-build-verifier.md`

**What it does:** Reads the pre-build summary and verifies every requirement as Wired/Stubbed/Missing. Produces verification table for founder sign-off.

**Status:** **Keep core behavior.** This is Checkpoint 5 for PRD-driven builds.

**Extension needed:**

1. **Add Mom-UI Verification Table to output.** Currently the agent verifies code-level requirements; it does not verify mom-UI. Extend output template to include the Mom-UI table from `Verifier-Checkpoint-Schedule.md` §Mom-UI Verification Protocol.

2. **Add support for non-PRD builds.** Currently the agent assumes a PRD with a requirement list. Feature-session and bug-fix builds don't have a PRD requirement list — they have a bundled scope. Extend the agent to handle two modes:
   - **PRD mode** (existing): verify against PRD requirements
   - **Bundle mode** (new): verify against the founder-flagged bugs + audit rows + new gaps from the `/feature-session` dispatch

   In bundle mode, the verification table swaps "Wired/Stubbed/Missing per requirement" for "Fixed/Stubbed/Not-Fixed per bug + Status-Updated/Stale per audit row."

3. **Run regression check on adjacent surfaces** (bundle mode): Playwright suite for surfaces adjacent to the bundle's primary surface, to catch regressions.

**How the Orchestrator uses it:** Invokes at Checkpoint 5. Output gates close-out (Checkpoint 6).

---

### 2.3 `migration-writer` — KEEP AS-IS

**Location:** `.claude/agents/migration-writer.md`

**What it does:** Writes Supabase migrations following project conventions.

**Status:** **Keep as-is.** Specialist agent invoked by workers when migrations are needed.

**How the Orchestrator uses it:** Indirect — workers invoke it. Orchestrator may surface it in dispatch prompts when a worker's scope includes schema changes.

---

### 2.4 `edge-function-scaffolder` — KEEP AS-IS

**Location:** `.claude/agents/edge-function-scaffolder.md`

**What it does:** Scaffolds new Supabase Edge Functions following project conventions.

**Status:** **Keep as-is.** Specialist agent invoked by workers when edge functions are needed.

**How the Orchestrator uses it:** Indirect — workers invoke it.

---

### 2.5 `rls-verifier` — KEEP AS-IS, USED BY CHECKPOINT 3

**Location:** `.claude/agents/rls-verifier.md`

**What it does:** Verifies Row-Level Security policies on Supabase tables.

**Status:** **Keep as-is.** Specialist agent — and now also a Checkpoint 3 component.

**How the Orchestrator uses it:** Pre-commit hook (Checkpoint 3) invokes this agent in headless mode when migrations or RLS-related code changed.

---

## Section 3 — Existing State Files

### 3.1 `.claude/rules/current-builds/` — KEEP, FORMAT MAY EXTEND

**What it does:** Auto-loads into every Claude Code session via recursive `.claude/rules/` discovery. Holds the active build file with pre-build summary, addenda list, build items, stubs, decisions.

**Status:** **Keep as-is.** Mechanism is solid. May need a folder companion `completed-builds/` for IDLE builds (or just flag in-place — implementer choice).

**Extension needed:** Active build files should have a `## Mom-UI Verification` section that gets populated during the build (not at the end). Each Checkpoint 2 adds rows; Checkpoint 5 verifies all rows complete.

---

### 3.2 `claude/feature-decisions/` — KEEP AS-IS

**What it does:** Permanent build records. One file per PRD/build, created during pre-build, kept forever. Contains screens, easy-to-miss decisions, addendum rulings, schema changes, feature keys, stubs, cross-feature wiring.

**Status:** **Keep as-is.** This is the long-term knowledge artifact.

**Extension at close-out:** Add post-build verification table (from `post-build-verifier`) to the feature decision file when build closes (Trigger A only).

---

### 3.3 `BUILD_STATUS.md` — KEEP, BETTER UPDATE DISCIPLINE

**What it does:** Tracks phase completion across the project.

**Status:** **Keep as-is.** Format is fine; the problem is update consistency. Close-out cascade (Step 2a in Close-Build-And-Baton-Pass-Spec.md) makes updates mandatory.

---

### 3.4 `claude/web-sync/TRIAGE_WORKSHEET.md` — KEEP AS-IS

**What it does:** The audit triage queue. Cross-referenced by `/bug-triage-merge`.

**Status:** **Keep as-is.** Updated by workers during builds; close-out cascade verifies updates landed.

---

### 3.5 `claude/web-sync/FIX_NOW_SEQUENCE.md` — KEEP AS-IS

**What it does:** Tracks high-priority fixes that should ship soon.

**Status:** **Keep as-is.** Read by Status Mode for "open queues" summary.

---

### 3.6 `STUB_REGISTRY.md` — KEEP AS-IS

**What it does:** Registry of all stubs (`PlannedExpansionCard`, `// STUB:`, etc.). Critical for `post-build-verifier` to distinguish Stubbed from Missing.

**Status:** **Keep as-is.** Updated by workers when new stubs created; verifier reads it.

---

### 3.7 `WIRING_STATUS.md` — KEEP AS-IS

**What it does:** Tracks what features connect to what.

**Status:** **Keep as-is.** Read by `pre-build-auditor`, updated by workers when wiring changes.

---

### 3.8 `claude/PRE_BUILD_PROCESS.md` — KEEP, MINOR EXTENSION

**What it does:** Defines the mandatory pre-build ritual. Authoritative source for `pre-build-auditor` and `/prebuild` skill.

**Status:** **Keep as-is.** Add the mom-UI surfaces enumeration step described in §1.1.

---

### 3.9 `CLAUDE.md` — KEEP AS-IS

**What it does:** Accumulated build conventions.

**Status:** **Keep as-is.** Orchestrator references conventions when generating dispatch prompts.

---

## Section 4 — What's Net-New

This section lists the artifacts that don't currently exist and need to be created.

### 4.1 `.claude/agents/orchestrator.md` — NEW

The Orchestrator agent file. Frontmatter and behavior per `Orchestrator-Agent-Spec.md`.

### 4.2 `.claude/state/CURRENT.md` — NEW

Current-state snapshot file. Overwritten at every close-out / baton-pass. Format per `Close-Build-And-Baton-Pass-Spec.md` §2e.

### 4.3 `.claude/state/HISTORY.md` — NEW

Append-only log of build closures and baton-passes. Format per `Close-Build-And-Baton-Pass-Spec.md` §2d.

### 4.4 `.claude/state/` folder — NEW

Parent folder for the two state files above. May not exist yet.

### 4.5 Pre-commit hook — NEW (or extend if exists)

`.husky/pre-commit` or `.git/hooks/pre-commit`. Implements Checkpoint 3. May already exist in a partial form — extend rather than replace.

### 4.6 Pre-push hook — NEW (or extend if exists)

`.husky/pre-push` or `.git/hooks/pre-push`. Implements Checkpoint 4. May already exist in a partial form — extend rather than replace.

### 4.7 `claude/orchestration/` folder — NEW

Parent folder for the four spec docs (this audit, the three other specs). Source of truth for Orchestrator behavior; referenced by the Orchestrator agent.

---

## Section 5 — What to Investigate Before Implementing

These are unknowns that the implementer should check before coding:

1. **Are pre-commit / pre-push hooks already configured?** Check `.husky/`, `.git/hooks/`, `package.json` scripts. If yes, extend rather than replace.

2. **Is there a `.claude/state/` folder already?** Probably not, but check.

3. **Is there a `completed-builds/` folder, or do builds stay in `current-builds/` with IDLE flag?** Check `.claude/rules/` structure and pick whichever pattern is already in use.

4. **What's the current state of `BUILD_STATUS.md`?** May need format adjustment to support automated updates from Orchestrator.

5. **Do agents currently auto-load on session start, or are they invoked explicitly?** This affects how the Orchestrator gets activated. If Claude Code agents only fire on explicit invocation, the trigger-phrase pattern from `Orchestrator-Agent-Spec.md` §2.1 needs a wrapper that detects those phrases. If agents auto-load by being present in `.claude/agents/`, the Orchestrator is always available and just stays silent until triggered.

6. **Are there existing GitHub Actions related to this work?** Per `RECON_DECISIONS_RESOLVED.md`, there's mention of GitHub Action design (Decision 2) — check current state and integrate.

---

## Section 6 — Implementation Order (Recommended)

Suggested sequence for implementing the orchestration layer in one focused session:

### Phase A — Specs in repo (foundation)

1. Create `claude/orchestration/` folder
2. Add the four spec docs (this audit + the three others)

### Phase B — State infrastructure

3. Create `.claude/state/` folder
4. Create `.claude/state/HISTORY.md` (empty header)
5. Create `.claude/state/CURRENT.md` (initial state snapshot of where things are right now)

### Phase C — Extensions to existing pieces

6. Extend `pre-build-auditor` agent file to include mom-UI surfaces section
7. Extend `post-build-verifier` agent file to include Mom-UI Verification Table + bundle mode
8. Extend `claude/PRE_BUILD_PROCESS.md` to require mom-UI enumeration
9. Update active build file template to include `## Mom-UI Verification` section

### Phase D — New Orchestrator agent

10. Create `.claude/agents/orchestrator.md` per `Orchestrator-Agent-Spec.md`

### Phase E — Git hook checkpoints

11. Investigate existing hooks; extend or create `.husky/pre-commit` for Checkpoint 3
12. Investigate existing hooks; extend or create `.husky/pre-push` for Checkpoint 4

### Phase F — Test

13. Open a fresh Claude Code session; type "Where are we?" — verify Status Mode runs
14. Type "Resume orchestrating" — verify it reads active build and confirms intent
15. Try a fake mid-build context warning to test baton-pass prompt generation
16. Verify pre-commit hook blocks a commit with a banned pattern
17. Verify pre-push hook blocks a push with stale state files

### Phase G — Hand off to founder

18. Tenise tests in real use on the next build (Workers 2/3/4 or Phase 3, depending on timing)

---

## Section 7 — What This Does NOT Replace

To be explicit:

- This does NOT replace the existing skills (`/prebuild`, `/feature-session`, `/bug-triage-merge`, `/bug-reports`, `/myaim-frontend-design`)
- This does NOT replace the existing agents (`pre-build-auditor`, `post-build-verifier`, `migration-writer`, `edge-function-scaffolder`, `rls-verifier`)
- This does NOT replace the PRE_BUILD_PROCESS — it makes the process automatic instead of memory-dependent
- This does NOT replace the founder's approval gates — every checkpoint still surfaces to the founder for confirmation
- This does NOT introduce Harness or any external tool — purely native Claude Code agents and hooks

---

## Section 8 — One-Page Summary for Quick Reference

**What's already strong (keep as-is):**
- 5 skills, 5 agents, 9+ state files
- PRE_BUILD_PROCESS.md ritual
- Active build file auto-load mechanism
- Feature decision library

**What needs minor extension:**
- `pre-build-auditor` and `post-build-verifier` outputs (add mom-UI sections)
- Active build file template (add Mom-UI Verification section)
- PRE_BUILD_PROCESS.md (add mom-UI enumeration step)

**What's net-new:**
- Orchestrator agent (`orchestrator.md`)
- `.claude/state/CURRENT.md` and `HISTORY.md`
- Pre-commit hook (Checkpoint 3)
- Pre-push hook (Checkpoint 4)
- `claude/orchestration/` folder with the four specs

**What gets eliminated:**
- Re-explaining "you are the orchestrator" every session
- Forgetting to update state files at close
- Bug-fix passes drifting through without verification
- Mom-UI verification happening "when someone remembers"
- Cross-window context loss

---

*End of Existing-Pieces-Audit.md*
