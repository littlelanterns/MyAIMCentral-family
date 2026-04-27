# Close-Build & Baton-Pass — Specification

**Purpose:** Define the close-out cascade that fires at end of build OR mid-build baton-pass. Eliminates inconsistent state file updates by making them part of a defined cascade rather than a thing someone has to remember.

**Status:** Draft — implement after Worker 5 ships.

**Companion to:** `Orchestrator-Agent-Spec.md` (the Orchestrator runs this cascade) and `Verifier-Checkpoint-Schedule.md` (this is Checkpoint 6).

---

## Plain English (What This Means For Tenise)

You currently rely on someone remembering to update BUILD_STATUS, mark the active build IDLE, write the HISTORY entry, do the final commit and push. Sometimes it happens, sometimes it doesn't — and when it doesn't, the next session starts confused because state files are stale. This cascade fires automatically. State updates happen. The handoff prompt for the next session is generated and ready to paste. Nothing falls through.

---

## Two Triggers, One Cascade

The same cascade runs whether you're closing a build (it's done) or baton-passing mid-build (context is thin or you want to wrap the session). The cascade adapts based on context.

### Trigger A — Build Complete

**Conditions:**
- Checkpoint 5 (post-build audit) passed with Zero Missing
- All Mom-UI Verification rows are ✅
- Founder has approved the close-out

**Cascade behavior:**
- Mark active build file IDLE
- Write final HISTORY entry
- Move active build file to `.claude/rules/completed-builds/` (or rename in place — implementation choice)
- Generate "build complete" summary for founder

### Trigger B — Baton-Pass

**Conditions (any one):**
- Orchestrator hit ~70% context threshold and founder approved baton-pass
- Founder said "wrap up" / "let's hand off" / "save state and we'll continue later"
- An emergency-stop scenario (rare — see §Emergency Stop)

**Cascade behavior:**
- Active build file stays ACTIVE
- Write checkpoint HISTORY entry (where we are, what's done, what's left)
- Generate handoff prompt for next session
- Append handoff prompt to active build file under `## Baton-Pass Handoffs`

---

## The Cascade — Step-by-Step

Both triggers run these steps in order. Adaptive notes for each trigger appear inline.

### Step 1 — Confirm With Founder

Before any state changes, Orchestrator surfaces:

**For Trigger A (Build Complete):**
> "Ready to close out [build name]. Final state:
> - All [N] requirements: [W Wired, S Stubbed, 0 Missing]
> - Mom-UI: all surfaces ✅ on desktop and mobile
> - Tests: [X passing, Y skipped, 0 failing]
>
> I'll now: update state files, commit, push, mark build IDLE, generate completion summary.
>
> Confirm to proceed, or flag anything to address first."

**For Trigger B (Baton-Pass):**
> "Wrapping this session for baton-pass. Current state:
> - In-progress build: [build name]
> - Workers done this session: [list]
> - Workers remaining: [list]
> - Open items: [list]
>
> I'll now: write checkpoint HISTORY entry, generate handoff prompt for next session, commit current state, push.
>
> Confirm to proceed, or flag anything to address first."

Founder confirms or adjusts. No state changes happen until confirmation.

### Step 2 — Update State Files

The state file updates required:

#### 2a. `BUILD_STATUS.md`
- Update phase row(s) to reflect current state
- For Trigger A: mark phase "Complete" with completion date
- For Trigger B: update progress notation (e.g., "Workers 1, 2 done; 3, 4 pending")

#### 2b. Active Build File (`.claude/rules/current-builds/<build-name>.md`)
- For Trigger A: change `Status: ACTIVE` to `Status: IDLE`, add post-build verification section if not already present
- For Trigger B: append baton-pass handoff section (see §Handoff Prompt Format)

#### 2c. Feature Decision File (`claude/feature-decisions/<build-name>.md`)
- For Trigger A: add complete post-build verification table (from Checkpoint 5)
- For Trigger B: not updated (still in progress)

#### 2d. HISTORY File (`.claude/state/HISTORY.md` — create if doesn't exist)

Append entry in this format:

**For Trigger A:**
```markdown
## [YYYY-MM-DD] — [Build Name] CLOSED

**Type:** [PRD-driven / Feature-session / Bug-fix pass]
**Scope:** [one-line summary]
**Workers:** [list]
**Final state:** [N Wired / S Stubbed / 0 Missing]
**Mom-UI:** All surfaces verified desktop + mobile
**Commit:** [SHA, will fill in after commit]
**Notes:** [any overrides recorded, any deferred items]
```

**For Trigger B:**
```markdown
## [YYYY-MM-DD HH:MM] — [Build Name] BATON-PASS

**Reason:** [Context threshold / founder-initiated / emergency]
**Done this session:** [list]
**Remaining:** [list]
**Active build file:** [path]
**Next handoff prompt:** see active build file §Baton-Pass Handoffs (entry timestamped [HH:MM])
```

#### 2e. CURRENT.md (`.claude/state/CURRENT.md` — create if doesn't exist)

Overwrite with current state:

```markdown
# Current State — As of [YYYY-MM-DD HH:MM]

## Active build
[build name OR "None — between builds"]

## Active build file
[path OR "n/a"]

## Last completed
[build name + date]

## Open queues
- Beta glitch reports: [count] open
- TRIAGE_WORKSHEET: [count] open rows
- FIX_NOW_SEQUENCE: [count] open items

## Suggested next moves
[1-3 options based on state]

---
*This file is overwritten at every close-out and every baton-pass. For history, see HISTORY.md.*
```

### Step 3 — Run Pre-Commit Checkpoint (Checkpoint 3)

Orchestrator commits the state file changes. Pre-commit hook fires automatically (Checkpoint 3 from `Verifier-Checkpoint-Schedule.md`). If the hook fails, Orchestrator reports the failure and stops — founder fixes, then resume.

### Step 4 — Run Pre-Push Checkpoint (Checkpoint 4)

Orchestrator pushes. Pre-push hook fires automatically. State file freshness check should pass since Step 2 just updated them. If hook fails, Orchestrator reports and stops.

### Step 5 — Generate Completion Output

#### For Trigger A (Build Complete):

Orchestrator produces a completion summary:

```markdown
# Build Complete: [Build Name]

**Type:** [build type]
**Closed:** [YYYY-MM-DD HH:MM]
**Commit:** [SHA]

## What Shipped

- [bullet list of major deliverables]

## Verification Summary

- Requirements: [N total — W Wired, S Stubbed, 0 Missing]
- Mom-UI: All surfaces ✅ desktop + mobile across [shells tested]
- Tests: [X passing, Y skipped, 0 failing]

## Stubs Created

[list of stubs added to STUB_REGISTRY.md, if any]

## Overrides Recorded

[list of any --no-verify overrides or step-0 overrides during this build]

## What's Next

- Active build queue: [list of pending items]
- Suggested next: [1 recommendation]

## Files Modified

- [path]
- [path]

---

Active build file moved to `.claude/rules/completed-builds/[name].md` (IDLE).
HISTORY entry written.
CURRENT.md updated to reflect "between builds" state.
```

#### For Trigger B (Baton-Pass):

Orchestrator produces the **handoff prompt** for the next session — see §Handoff Prompt Format below.

### Step 6 — Final Mom-UI Sweep

For both triggers, the Orchestrator confirms one final time:

> "Final check before I'm done: any mom-UI surfaces touched this session that you have NOT yet verified at desktop + mobile? If yes, name them and we'll add 'needs verification' notes. If no, I'm done."

Anything left in `⚠️ needs eyes-on` state gets explicitly logged in the HISTORY entry so the next session knows.

### Step 7 — Done

Orchestrator's final message:

**For Trigger A:** "Build closed. State synced. Ready for the next thing whenever you are."

**For Trigger B:** "Session wrapped. Open a fresh Claude Code window in this repo, paste the handoff prompt above, and we'll pick up exactly where we left off."

---

## Handoff Prompt Format (Trigger B)

The handoff prompt is the most important artifact the baton-pass produces. It needs to be paste-ready and complete enough that the next session can resume without any re-explanation.

### Template

```markdown
# Resume Orchestrator — [Build Name]

You are resuming the Orchestrator role for [build name]. Read this entire prompt before doing anything.

## Required reading (do this first, in order)

1. `.claude/rules/current-builds/[build-name].md` — active build file with full pre-build summary
2. `.claude/state/CURRENT.md` — current state snapshot
3. `claude/feature-decisions/[build-name].md` — feature decision file
4. Last 10 git commits: `git log --oneline -10`
5. `claude/orchestration/Orchestrator-Agent-Spec.md` — your role definition

## Where we are

- **Build:** [build name]
- **Type:** [PRD-driven / feature-session / bug-fix pass]
- **Phase:** [phase or worker number we're on]
- **Last session ended:** [YYYY-MM-DD HH:MM]
- **Reason for baton-pass:** [context threshold / founder-initiated / etc.]

## What's done

[Bullet list of completed deliverables this build]

- ✅ [item] — [brief detail]
- ✅ [item] — [brief detail]

## What's next

[Bullet list of remaining work]

- ⏭️ [Worker name / Phase name] — [scope summary]
- ⏭️ [Worker name / Phase name] — [scope summary]

## Mom-UI Status

[Mom-UI Verification table from active build file]

Items still in ⚠️ state that need eyes-on:
- [list, or "none"]

## Open questions / unresolved items

[List anything that came up but wasn't decided. Be specific.]

## Verifier checkpoints next

Per Verifier-Checkpoint-Schedule.md, the next checkpoint that fires is:
- [Checkpoint #N — name — when it fires]

## Founder's likely next move

When you greet the founder, expect them to want to:
- [Most likely option based on state]
- Or possibly: [alternative]

## Required first action

After reading the above, run intent confirmation per Orchestrator-Agent-Spec §2.2 with the founder:

> "I've loaded the [build name] context. Last session ended with [N] workers complete and [N] remaining. Before I dispatch the next worker, want me to:
> - Resume Execute Mode and dispatch [next worker]?
> - Run a quick status review first?
> - Adjust the plan?
>
> Which?"

Wait for founder confirmation before doing anything else.

---

*Generated by Orchestrator at [YYYY-MM-DD HH:MM]. Append to active build file under `## Baton-Pass Handoffs`.*
```

### What Makes a Good Handoff Prompt

- **Specific:** "Worker 3 left the migrations applied but the edge function deployment is pending" not "some things are done"
- **Actionable:** the next session can immediately act, no guesswork
- **Self-contained:** contains everything needed; doesn't assume the next session has any prior context
- **Honest about ambiguity:** if something is unresolved, says so explicitly under "Open questions"

### What to Avoid

- Vague status ("things are going well")
- Implied context ("you know what we mean by Worker 5")
- Skipping the Mom-UI status section (this is where things slip)
- Assuming the founder will remember details — the prompt is for the *agent* primarily

---

## State File Updates — Authoritative List

For implementer reference. Every close-out (Trigger A or B) updates these files in this order:

1. `BUILD_STATUS.md` (always)
2. `.claude/rules/current-builds/<build-name>.md` (always)
3. `claude/feature-decisions/<build-name>.md` (Trigger A only — adds verification section)
4. `.claude/state/HISTORY.md` (always — create if doesn't exist)
5. `.claude/state/CURRENT.md` (always — overwrite)
6. `STUB_REGISTRY.md` (Trigger A only, if new stubs added)
7. `WIRING_STATUS.md` (Trigger A only, if wiring changed)
8. `claude/web-sync/TRIAGE_WORKSHEET.md` (if bug-fix pass — update row statuses)

For Trigger B, files 3, 6, 7, 8 are not updated (build still in progress; updates happen at final close-out).

---

## Emergency Stop

A rare scenario: founder needs to wrap immediately, no time for full cascade.

**Founder says:** "Emergency stop, save what you can"

**Orchestrator response:**
1. Append to active build file: `## EMERGENCY STOP — [YYYY-MM-DD HH:MM]` with one-line note about what's incomplete
2. Update `.claude/state/CURRENT.md` with "EMERGENCY STOP — see [active build file] for last known state"
3. Commit state files only with message `WIP: emergency stop, partial state saved`
4. Skip push (founder pushes manually when ready)
5. Tell founder: "State saved. Active build file flagged as emergency-stop. Push when you're ready. Open a fresh session and say 'resume from emergency stop' to recover."

This path skips the full cascade but preserves enough state to resume.

---

## Open Implementation Questions

Resolve during implementation:

- File location for `.claude/state/` — does this folder already exist? If not, create it
- Whether `completed-builds/` folder exists or builds stay in `current-builds/` flagged IDLE — implementer choice based on existing patterns
- Whether HISTORY.md should auto-rotate (e.g., archive entries older than 6 months) — probably yes eventually, not for v1
- Whether CURRENT.md should be machine-readable (JSON) for downstream tools, or stay human-readable markdown — recommend markdown for now

---

*End of Close-Build-And-Baton-Pass-Spec.md*
