# Verifier Checkpoint Schedule — Specification

**Purpose:** Define the six verifier checkpoints that fire automatically during build sessions, eliminating reliance on the founder remembering to invoke verification. Each checkpoint specifies: when it fires, what runs, what blocks progression, and how mom-UI verification fits in.

**Status:** Draft — implement after Worker 5 ships.

**Companion to:** `Orchestrator-Agent-Spec.md` (the Orchestrator runs these checkpoints) and `Close-Build-And-Baton-Pass-Spec.md` (Checkpoint 6 details live there).

---

## Plain English (What This Means For Tenise)

Right now, verification fires when someone remembers to invoke it — sometimes it's `pre-build-auditor` at the start, sometimes it's `post-build-verifier` at the end, sometimes things slip through entirely (especially on bug-fix passes). The six checkpoints below run automatically at specific moments. You don't have to remember any of them. If a checkpoint fails, the Orchestrator stops and tells you what's wrong — you decide whether to fix it or override. **Most importantly, mom-UI verification fires at every checkpoint where UI could have changed**, so visual breaks don't compound silently from one phase to the next.

---

## The Six Checkpoints — At-a-Glance

| # | Name | When It Fires | Mandatory? | Blocks On |
|---|------|---------------|------------|-----------|
| 1 | Pre-Build Summary | After `pre-build-auditor` produces summary | Yes (existing) | Founder approval |
| 2 | Inter-Worker | After each worker completes, before next dispatches | Yes (multi-worker phases) | Worker deliverables present + tests pass + mom-UI clean if UI touched |
| 3 | Pre-Commit | git pre-commit hook | Yes | Banned patterns clean + tsc clean + mom-UI evidence if UI touched |
| 4 | Pre-Push | git pre-push hook | Yes | State files current + HISTORY entry written |
| 5 | Post-Build Audit | End of build, before close-out | Yes | Zero Missing requirements + Mom-UI table complete + bug-fix cluster items resolved |
| 6 | Close-Out / Baton-Pass | End of session OR context threshold | Yes | State files updated + handoff prompt generated if applicable |

---

## Checkpoint 1 — Pre-Build Summary

### When It Fires
After `pre-build-auditor` agent (or `/prebuild` skill) completes its work. **This already happens** — current Step 6 of `claude/PRE_BUILD_PROCESS.md`.

### What Runs
- `pre-build-auditor` produces the pre-build summary
- Summary is written to active build file in `.claude/rules/current-builds/`
- Founder reviews and approves

### What Blocks Progression
- Founder has not explicitly approved
- Required addenda not read (auditor must list them)
- Schema gaps not identified (auditor must check `live_schema.md`)
- Stub registry not consulted

### Mom-UI Element
For Checkpoint 1, mom-UI is **planned**, not verified — the pre-build summary should explicitly enumerate which mom-facing surfaces will be touched and which device sizes need verification. This becomes the checklist Checkpoint 5 verifies against.

### Existing Infrastructure
- `pre-build-auditor` agent — keep as-is, extend its output to include "Mom-UI surfaces to verify" section
- `claude/PRE_BUILD_PROCESS.md` — add a step requiring auditor to enumerate mom-UI surfaces

---

## Checkpoint 2 — Inter-Worker (Multi-Worker Phases Only)

### When It Fires
After Worker N completes its scope, before Worker N+1 dispatches. Skipped for single-worker builds.

### What Runs
A lightweight verification — NOT a full PRD audit. Purpose is to catch "Worker N left something half-done that Worker N+1 will build on top of."

**Checks:**
1. Worker N's stated deliverables are present (files exist, migrations applied, edge functions deployed)
2. `tsc -b` clean (no TypeScript errors)
3. Migrations applied successfully (no failed migration in `supabase/migrations/`)
4. Existing tests still pass (Playwright suite for surfaces Worker N touched)
5. **Mom-UI clean if UI touched** (see §Mom-UI Verification Protocol below)

### What Blocks Progression
- Any deliverable missing
- TypeScript errors present
- Migration failures
- Test regressions
- Mom-UI broken on any verified surface (desktop OR mobile OR any shell mom encounters)

### Override
If founder explicitly says "proceed despite [issue]," Orchestrator records an audit entry in the active build file (per existing Step 0 override pattern) and continues. Override applies to this build only.

### Mom-UI Element
**If Worker N touched any mom-facing surface:**
- Capture screenshot or manual confirmation that the surface still renders correctly
- Test desktop breakpoint (≥1024px) and mobile breakpoint (≤640px)
- Test in every shell mom can view this surface from
- Record in active build file under `## Mom-UI Verification — Worker N`

If Worker N touched only backend (no UI), this section is skipped with a note: "Worker N: backend only, no UI verification needed."

### Implementation Notes
- The Orchestrator runs this checkpoint, NOT a separate agent
- For deliverable-presence checks, use Grep + file existence checks
- For tests, run `npx playwright test [surface-relevant-tests]`
- For mom-UI, founder provides the eyes-on confirmation; Orchestrator just asks and records the answer

---

## Checkpoint 3 — Pre-Commit

### When It Fires
git pre-commit hook (automatic on `git commit`).

### What Runs

**Always:**
1. **Banned-pattern grep** — Convention #257 (no banned date patterns), Convention #121 (no `as any` without justification), any other patterns in `.claude/rules/banned-patterns.md` if exists
2. **`tsc -b` clean** — no TypeScript errors
3. **`rls-verifier` agent** — if any migration in this commit touches RLS or any Supabase-table-related code changed
4. **`migration-writer` validation** — if any new migration in this commit, verify it follows Convention conventions (file naming, idempotency, no destructive operations without explicit confirmation)

**Conditionally (if UI changed):**
5. **Mom-UI evidence check** — verify the active build file contains a `## Mom-UI Verification` section with entries for any UI surface touched in this commit

### What Blocks Progression
- Banned patterns present → hook blocks commit
- TypeScript errors → hook blocks commit
- RLS verification fails → hook blocks commit
- Migration validation fails → hook blocks commit
- UI changed but no mom-UI evidence in active build file → hook blocks commit

### Override
Pre-commit hook can be bypassed with `git commit --no-verify` BUT the Orchestrator (if active) detects this and surfaces:
> "You committed with --no-verify. The pre-commit checkpoint was skipped. I'm recording an override audit entry. What was the reason?"

Override reason gets recorded in active build file.

### Mom-UI Element
At this checkpoint, mom-UI is **evidence-checked**, not eyes-on-verified. The check is: "did the founder do mom-UI verification at Checkpoint 2 or earlier?" If evidence exists in the active build file, hook passes. If UI changed and no evidence exists, hook blocks.

### Implementation Notes
- Implement as a git hook in `.husky/pre-commit` or `.git/hooks/pre-commit`
- Hook calls a script that runs the four checks
- Script exits non-zero if any check fails
- For RLS verification, hook invokes `rls-verifier` agent in headless mode
- For mom-UI evidence, hook greps the active build file for mom-UI section

---

## Checkpoint 4 — Pre-Push

### When It Fires
git pre-push hook (automatic on `git push`).

### What Runs

1. **State files current:**
   - `BUILD_STATUS.md` reflects current phase progress
   - Active build file in `.claude/rules/current-builds/` is either ACTIVE (build still in progress) or has been moved/marked appropriately
   - Feature decision file in `claude/feature-decisions/` has post-build verification section if build is closing
2. **HISTORY entry written:**
   - If build is closing with this push, an entry exists in the build's history record (see Close-Build-And-Baton-Pass-Spec.md §State File Updates)
3. **No uncommitted state file changes:**
   - All state files are committed; no dangling edits

### What Blocks Progression
- State files out of sync → hook blocks push
- Build closing but no HISTORY entry → hook blocks push
- Uncommitted state file changes → hook blocks push (founder must commit them first)

### Override
Same as Checkpoint 3 — `git push --no-verify` bypasses, Orchestrator records override.

### Mom-UI Element
At this checkpoint, the Orchestrator confirms the active build file's Mom-UI Verification section is complete for any UI surfaces touched. If anything is in `⚠️ needs eyes-on` state, push is blocked until resolved or explicitly overridden.

### Implementation Notes
- Implement as `.husky/pre-push` or `.git/hooks/pre-push`
- Hook runs script that checks state file freshness (compare mtimes against last commit affecting code in `src/`)
- Hook fails if any state file is older than the most recent code change

---

## Checkpoint 5 — Post-Build Audit

### When It Fires
At end of feature build (PRD-driven OR feature-session OR bug-fix pass), before close-out (Checkpoint 6) runs.

### What Runs

**For PRD-driven builds:**
- `post-build-verifier` agent — full Convention #14 Part A audit
- Produces verification table: every requirement Wired / Stubbed / Missing
- **Zero Missing required** — build cannot close with Missing items

**For feature-session builds:**
- Verify every founder-flagged bug is fixed (still reproducible? no = fixed)
- Verify every audit row touched is updated correctly (status changed in TRIAGE_WORKSHEET.md)
- Verify any new gaps surfaced during scoping are addressed or explicitly stubbed
- Run Playwright on the feature surface to confirm no regressions

**For bug-fix pass builds (post-`/bug-triage-merge` cluster):**
- Verify every bug report in the cluster: still reproducible? (no = fixed)
- Verify every audit row in the cluster: status updated correctly?
- Run Playwright on adjacent surfaces to detect regressions
- Update `beta_glitch_reports.status` for fixed reports

**For ALL build types — Mom-UI Verification Table:**

```markdown
## Mom-UI Verification

| Surface | Desktop ≥1024px | Mobile ≤640px | Shells Tested | Evidence |
|---------|-----------------|---------------|---------------|----------|
| [page name] | ✅ verified | ✅ verified | Mom, Independent | screenshot path or "manual confirm 2026-04-27" |
| [page name] | ⚠️ needs eyes-on | ✅ verified | Mom only | "founder hasn't desktop-verified yet" |
```

Every row must be ✅ in every column for the build to close. ⚠️ or ❌ blocks close-out until resolved.

### What Blocks Progression
- Any Missing requirement (PRD-driven)
- Any unfixed bug (feature-session or bug-fix)
- Any new regression detected (Playwright)
- Any ⚠️ or ❌ in Mom-UI Verification Table
- Founder has not signed off on the verification report

### Override
Founder can override individual items with explicit reason recorded. Orchestrator surfaces overrides in close-out summary so they're visible.

### Mom-UI Element
This is the **comprehensive** mom-UI checkpoint — every surface touched in the build, every device size, every shell mom encounters. This is the Visual Verification Standard elevated from "should happen" to "build cannot close until done."

### Implementation Notes
- For PRD-driven builds: `post-build-verifier` already exists and works — extend its output template to include the Mom-UI Verification Table
- For feature-session and bug-fix builds: create a parallel verifier (could be a mode of `post-build-verifier` or a new agent — implementer's call)
- Mom-UI table data comes from inter-worker checkpoints (Checkpoint 2) plus end-of-build verification — most of it should already be filled in by the time Checkpoint 5 runs

---

## Checkpoint 6 — Close-Out / Baton-Pass

### When It Fires
- **End of build:** Checkpoint 5 passed, build is closing
- **Mid-build context threshold:** Orchestrator hits ~70% context, baton-passing to next session
- **Founder-initiated:** Founder says "wrap up" or "let's hand off"

### What Runs
See `Close-Build-And-Baton-Pass-Spec.md` for full details. Summary:

1. State file updates (BUILD_STATUS, current-builds, feature-decisions, HISTORY)
2. Commit and push (which triggers Checkpoints 3 and 4)
3. If end-of-build: mark active build IDLE
4. If baton-pass: generate handoff prompt for next session
5. **Final Mom-UI sanity check:** confirm no surface is left in ⚠️ state

### What Blocks Progression
- State files not updateable (filesystem error, etc.)
- Commit/push checkpoints fail
- Founder hasn't approved the close-out summary
- Any ⚠️ Mom-UI state remains

### Mom-UI Element
**Final sweep:** before handing off (either to baton-pass or to "build is done"), the Orchestrator confirms the Mom-UI Verification Table from Checkpoint 5 is complete with all ✅ — no `needs eyes-on` items left dangling. This is the safety net.

---

## Mom-UI Verification Protocol

This is the cross-cutting protocol used at Checkpoints 2, 3, 4, 5, and 6.

### What "Mom-UI Verification" Means

Mom-UI verification means **eyes-on confirmation** that:
1. The surface renders correctly at desktop breakpoint (≥1024px)
2. The surface renders correctly at mobile breakpoint (≤640px)
3. The surface works in every shell mom can encounter it from
4. Interactive elements work (taps, clicks, drags) on both desktop and mobile

### Who Does the Verification

**The founder** does the eyes-on verification. The Orchestrator does NOT claim a surface is verified without founder confirmation.

**Workflow:**
1. Worker completes UI changes
2. Orchestrator asks: "Worker N touched [surface]. Please verify desktop and mobile in [list of shells]. Reply with confirmation or paste a screenshot."
3. Founder verifies, replies
4. Orchestrator records the confirmation in active build file with timestamp

### Recording Format

In active build file under `## Mom-UI Verification — [Phase Name]`:

```markdown
| Surface | Desktop ≥1024px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|----------|-----------|
| Tasks page | ✅ | ✅ | Mom, Independent | manual confirm | 2026-04-27 14:32 |
| Calendar widget | ✅ | ⚠️ overflow on iPhone SE | Mom | screenshot: claude/screenshots/calendar-mobile-overflow.png | 2026-04-27 14:35 |
```

### What Counts as Evidence

- **Strongest:** Screenshot saved to `claude/screenshots/` with descriptive filename
- **Acceptable:** Founder text confirmation ("manually confirmed desktop + mobile, looks good")
- **NOT acceptable:** "the code compiles," "the tests pass," "looks fine in dev," or any non-eyes-on signal

### When Mom-UI Is Skipped

Only when the worker/build genuinely touched no UI. Recorded as: "Backend-only build, no UI surfaces affected."

The Orchestrator does NOT skip mom-UI just because the founder is in a hurry. If the build touched UI, mom-UI fires.

### Bug-Fix Pass Specifics

For bug-fix passes, mom-UI verification covers:
- Every surface touched by a bug fix
- Every surface adjacent to a fixed bug (regression check)
- Every surface where audit rows said "UI broken on X" — that surface must be verified post-fix

---

## Open Implementation Questions

Resolve during implementation, not now:

- Exact list of banned patterns for Checkpoint 3 (depends on what's already in CLAUDE.md and any banned-patterns file that may exist)
- Whether Checkpoint 2 should run on EVERY worker or only on workers that touched files outside the worker's stated scope (defensive: run on every worker; permissive: only on cross-cutting workers)
- How to handle the case where founder is on a phone and can't easily verify desktop breakpoint (current spec: founder confirms when next at desktop, Orchestrator parks the build at "needs eyes-on" until then)
- Whether to add screenshot automation (Playwright can take screenshots — could supplement but not replace founder eyes-on)

---

*End of Verifier-Checkpoint-Schedule.md*
