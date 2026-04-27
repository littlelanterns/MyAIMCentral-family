---
name: orchestrate
description: "Build orchestration: /orchestrate status, /orchestrate plan [target], /orchestrate resume, /orchestrate close, /orchestrate baton-pass, /orchestrate context-check. Coordinates builds, runs checkpoints, manages state and session handoffs."
---

# Orchestrate — Claude Code Skill

Build orchestration for MyAIM Central. Coordinates builds, runs checkpoints, manages state files and session handoffs. This skill provides explicit commands; the behavioral context auto-loads from `.claude/rules/orchestrator.md`.

## Commands

```
/orchestrate status
/orchestrate plan PRD-22
/orchestrate plan calendar
/orchestrate plan bug-pass
/orchestrate resume
/orchestrate close
/orchestrate baton-pass
/orchestrate context-check
```

If invoked with no subcommand, prompt for one.

---

## `/orchestrate status` — Status Mode

Read-only state summary. No proposals, no dispatch.

**Read in this order:**
1. `.claude/state/CURRENT.md` — last known state
2. `BUILD_STATUS.md` — phase progress
3. `.claude/rules/current-builds/` — any ACTIVE build files (skip IDLE.md)
4. `git log --oneline -10` — recent commits
5. `.claude/state/OVERRIDES.md` — any unacknowledged overrides
6. `claude/web-sync/FIX_NOW_SEQUENCE.md` — open items

**Output:**
```markdown
## Status Report — [YYYY-MM-DD]

### Where we are
[Active build, progress, current phase/worker]

### Recently completed
- [Build] — [date]

### Open queues
- FIX_NOW: [N] open
- Recent commits: [summary]

### Override alerts
[Overrides since last session, or "None"]

### Suggested next moves
1. [Option]
2. [Option]
```

Do NOT write state files, commit, push, or generate dispatch prompts.

---

## `/orchestrate plan [target]` — Plan Mode

Read state, confirm direction, produce dispatch prompts. Stop before code.

**Targets:**
- `PRD-XX` → PRD-driven build via `/prebuild PRD-XX`
- `[surface-name]` → feature-surface build via `/feature-session [surface]`
- `bug-pass` → `/bug-triage-merge` first, founder picks cluster, then `/feature-session`

**Process:**
1. Always confirm what founder wants, even if the command includes a target
2. Invoke the right entry skill
3. Present plan to founder
4. Wait for explicit approval
5. On approval, generate paste-ready dispatch prompts for worker sessions

Do NOT write code, commit, or dispatch (founder pastes prompts into worker windows).

---

## `/orchestrate resume` — Execute Mode

Resume coordination of the active build.

1. Read active build file from `.claude/rules/current-builds/`
2. Read `.claude/state/CURRENT.md` for last known state
3. Read last baton-pass handoff (if any) from active build file
4. Confirm with founder: which build, where we are, what's next
5. Enter Execute Mode coordination cycle

**Execute Mode cycle:**
- Dispatch Worker N → founder pastes prompt
- Worker completes → run Checkpoint 2 (deliverables + tsc + mom-UI)
- If passed → dispatch Worker N+1
- At end → Checkpoint 5 (post-build audit) → Checkpoint 6 (close-out)

Monitor context pressure throughout. Err on side of early flagging.

---

## `/orchestrate close` — Close-Out Cascade

Run Checkpoint 6, Trigger A (Build Complete).

**Prerequisites:** Checkpoint 5 must have passed (zero Missing, Mom-UI table all ✅).

**Cascade:**
1. Confirm with founder
2. Update state files:
   - `BUILD_STATUS.md` — mark phase complete
   - Active build file → Status: IDLE
   - `claude/feature-decisions/` — add verification table
   - `.claude/state/HISTORY.md` — append closure entry
   - `.claude/state/CURRENT.md` — overwrite
   - `STUB_REGISTRY.md` — if stubs added
   - `WIRING_STATUS.md` — if wiring changed
3. Commit + push (triggers Checkpoints 3 + 4)
4. Move active build to `.claude/completed-builds/YYYY-MM/`
5. Generate completion summary

Full cascade: `claude/orchestration/Close-Build-And-Baton-Pass-Spec.md`

---

## `/orchestrate baton-pass` — Session Handoff

Run Checkpoint 6, Trigger B (Baton-Pass).

**Cascade:**
1. Confirm with founder
2. Update state files:
   - `BUILD_STATUS.md` — progress notation
   - Active build file — append handoff section
   - `.claude/state/HISTORY.md` — append baton-pass entry
   - `.claude/state/CURRENT.md` — overwrite
3. Generate handoff prompt (per Close-Build-And-Baton-Pass-Spec §Handoff Prompt Format)
4. Append handoff to active build file under `## Baton-Pass Handoffs`
5. Commit + push

The handoff prompt must be self-contained: the next session can resume without any re-explanation.

---

## `/orchestrate context-check` — Context Pressure Assessment

Honest assessment of current context state.

Report:
- Estimated conversation length/complexity
- Whether compaction has occurred
- How many files have been read this session
- Recommendation: continue / wrap at next breakpoint / baton-pass now

**Bias toward early flagging.** A baton-pass with headroom is graceful. A baton-pass at the limit is a scramble.

---

## Rules

- Every build type (PRD, feature-surface, bug-fix) gets all six checkpoints
- Never skip Checkpoint 5 or 6 for any reason
- Bug-fix passes are builds, not "just fixing things"
- Never suggest stopping — founder decides; present options on merit
- Always confirm intent before launching any cascade
- Baton-pass is about context, not time or energy
