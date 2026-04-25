---
name: feature-session
description: "Scope a fresh-session worker prompt that bundles bugs the founder flagged + audit rows touching the same feature surface + new gaps surfaced during scoping. Produces a pasteable, self-contained dispatch prompt for one comprehensive feature-anchored session. Invoke with a surface name: /feature-session calendar, /feature-session allowance, /feature-session tasks. Pairs with /bug-triage-merge."
---

# Feature-Anchored Session Dispatch — Claude Code Skill

This skill is the founder-directed counterpart to `/prebuild`. Instead of starting from a PRD, it starts from a feature surface mom is actively using and feeling friction with. It scopes a single comprehensive worker session that fixes everything broken on that surface, builds anything missing on that surface, and addresses any audit rows touching that surface — all in one coordinated dispatch.

This is the standard workflow for "I'm using the app and noticed X is broken / I need Y / I want Z built on the [feature] page." The skill does not dispatch the worker; it produces the pasteable prompt the founder hands to a fresh Claude Code window.

## How to Invoke

```
/feature-session calendar
/feature-session allowance
/feature-session tasks
/feature-session lila
/feature-session messaging
/feature-session bookshelf
/feature-session [any feature surface name]
```

The argument is a feature surface — anything that maps to a PRD or a domain in `claude/feature_glossary.md`. If the argument is ambiguous (e.g. "tasks" could mean PRD-09A tasks page, PRD-17 task queue, or PRD-09B lists), ask the founder which they mean before scoping.

If invoked with no argument, prompt for one.

---

## The Founder Trigger

The founder usually arrives at this skill via one of three patterns:

1. **"X is broken"** — she noticed something while using the app
2. **"I need Y"** — she wants a feature that doesn't exist (or doesn't exist well enough)
3. **"I want to build Z"** — she's ready to invest in a bigger build on that surface

Sometimes she'll also arrive with a cluster handed to her by `/bug-triage-merge`. In that case she'll paste the cluster contents along with the surface name. Use that paste as the seed.

The skill works for all three patterns and any combination.

---

## Standing Rules

- **isolation="worktree"** — implied for the worker session this skill scopes
- **No code changes in this skill itself** — this skill produces a prompt, nothing more
- **PRDs are the spec** — the worker the prompt dispatches must read PRD + addenda before coding
- **Convention #257, #121, #246** — propagate these into the worker prompt
- **Surface ambiguity** — if the surface scope is unclear, ask the founder. Do not guess.

---

## Phase 1 — Founder Problem Statement

Capture the founder's trigger in her own words. Specifically:

- What's broken that she noticed?
- What does she need that doesn't exist?
- What does she want built?
- Any cluster handed in from `/bug-triage-merge`?

Restate it back to her in one sentence and confirm before proceeding. Misframing the trigger is the most common reason a feature-anchored session goes wrong.

---

## Phase 2 — Surface Inventory

Read every input that touches the surface:

- **PRD(s)** — locate via `claude/feature_glossary.md`. Read every word. Read every matching addendum in `prds/addenda/`.
- **`claude/web-sync/TRIAGE_WORKSHEET.md`** — every row whose Title, Notes, or Founder Decision touches the surface (PRD number, table name, feature key, component name)
- **`claude/web-sync/FIX_NOW_SEQUENCE.md`** — current version + relevant changelogs
- **`claude/live_schema.md`** — schema for every table on the surface
- **`claude/conventions.md` + CLAUDE.md** — conventions specific to the surface
- **`WIRING_STATUS.md`** — what's currently wired vs stubbed on the surface
- **Recent commits touching the surface's source files** — `git log --oneline -- <path>`
- **`beta_glitch_reports`** — any open reports tagged for this surface (query by `current_route` matching the surface or `what_doing`/`what_happened` mentioning the surface)

**Output map:**
- Every audit row that touches the surface (with row #, ID, severity, beta status, current state)
- Every bug report touching the surface (open + recently resolved for regression check)
- Every PRD spec item that touches the surface
- Every relevant convention number
- Files the worker will read first

---

## Phase 3 — Scope the Bundle

Cluster what was found into one coherent dispatch. Bundle includes:

1. **Founder-flagged items** — her trigger problem(s)
2. **Bugs from beta_glitch_reports** — open reports on this surface
3. **Audit rows touching this surface** — Fix Now or Fix Next Build with surface match
4. **Newly observed gaps** — anything obviously broken or missing that surfaces during inventory but isn't yet in the worksheet (file as new NEW-XX rows)
5. **Convention drift** — anywhere the code on this surface violates a convention

**Order the bundle by dependency:**
- Bugs that block other items → ship first
- Foundational fixes (schema, RPC, hook layer) → before UI changes
- UI changes → after the data layer is correct
- Verification deliverable → ships with each row

**Flag scope risks:**
- If the bundle is genuinely too big for one worker (e.g. 8+ schema migrations + 12+ frontend changes + a PRD-spec ambiguity that needs founder input), recommend splitting into worker A + worker B with explicit hand-off semantics.
- If the bundle includes anything PRD-ambiguous, surface it as a Phase-2 founder-decision item in the dispatched worker's plan.

---

## Phase 4 — Produce the Pasteable Worker Prompt

Generate a self-contained prompt following this template structure:

```
You are Worker [SURFACE-NAME-COMPLETE]. Comprehensive [SURFACE] audit + fix session.
Single worker, single worktree, methodical end-to-end pass through every
[SURFACE] item flagged by founder + every audit row touching the surface +
new gaps surfaced during scoping.

ISOLATION: isolation="worktree". Report worktree path + branch at end.

REPO: c:\dev\MyAIMCentral-family\MyAIMCentral-family, branch main, today YYYY-MM-DD.
Migration floor: ≥ 00000000[NEXT]_.

STANDING RULES:
- PRDs are the spec. No MVP-ifying. No "for now we'll just..."
- Convention #257 strict. Convention #121 strict (tsc -b + npm run prebuild
  clean before every commit; warnings tolerated, errors not).
- Convention #246 for any cron-invoked Edge Function changes.
- Commit on worktree branch, do NOT push, orchestrator merges.
- Every behavior-changing commit MUST land with a verification deliverable.
  Run it locally before commit; paste pass output into commit message.

==============================================================================
CONTEXT: what's live in production right now on this surface
==============================================================================

[Surface inventory from Phase 2 — what's already wired, recent commits, recent
migrations, current conventions]

==============================================================================
SCOPE: [N] items in this bundle
==============================================================================

[List each item with: row #, ID, severity, beta status, one-line summary.
Order by dependency. Mark founder-flagged items distinctly.]

==============================================================================
APPROACH: investigation-first, audit-then-plan, verify-then-commit
==============================================================================

PHASE 1 — Audit. Read everything that touches [SURFACE].
   [List of files + docs to walk]
   [What to map: write sites, read sites, conditional renders, money-touching
    paths, RLS surface, etc.]
   [Output: audit report with state of each bundle item]

PHASE 2 — Founder review. Present audit + per-row plan. Wait for green-light
   before code. Specifically flag: [PRD-ambiguous items, UX choices, scope
   split decisions]

PHASE 3 — Build per row in dependency order:
   [Numbered list mirroring the bundle]
   [Per-row: code changes, verification deliverable, commit shape]

PHASE 4 — End-to-end verification. Re-run all related verification scripts.
   Spot-check live production data on the surface. `npm run prebuild` clean.

PHASE 5 — Doc updates:
   - TRIAGE_WORKSHEET.md: mark resolved rows; file any newly-surfaced rows
   - FIX_NOW_SEQUENCE.md: bump version + changelog
   - claude/live_schema.md: regenerate via `npm run schema:dump` if migrations
   - PRD conformance: confirm everything in [PRD §relevant sections] is built;
     flag any remaining gap

==============================================================================
FOUNDER-CRITICAL CONTEXT
==============================================================================

[Any production state the worker MUST NOT corrupt. Names of family members
using the surface today. Active rows that must stay valid through the build.]

==============================================================================
COMMIT STRUCTURE (target)
==============================================================================

[Per-row commit list with one-line description each]

==============================================================================
RETURN
==============================================================================

Phase 1 audit + Phase 2 per-row plan. STOP. Wait for orchestrator green-light.

Don't begin Phase 3 until founder confirms the plan. PRDs are the minimum.
Do not substitute simpler versions without explicit approval.

If anything in production data looks wrong during Phase 1 audit, STOP and
report immediately — do not auto-fix corruption.
```

Fill in every bracketed placeholder using Phase 2 inventory + Phase 3 bundle.

---

## Phase 5 — Hand Off to Founder

Output the prompt as a single pasteable code block. Above it, give a brief summary:

- Surface name + scope
- Bundle size: N items (X founder-flagged + Y audit rows + Z bug reports + W new gaps)
- Estimated migration count
- Any founder-decision items the worker will surface in Phase 2
- Any scope-split risks

Founder pastes the prompt into a fresh Claude Code window. The worker walks Phase 1 audit, returns plan, waits for green-light, then builds.

---

## What This Skill Does NOT Do

- Does not write code on the surface (the worker it scopes does)
- Does not dispatch the worker (founder pastes the prompt)
- Does not modify TRIAGE_WORKSHEET.md or FIX_NOW_SEQUENCE.md (the worker does, after build)
- Does not invent PRD interpretations (any ambiguity is flagged in the worker's Phase 2 plan)
- Does not split-scope unilaterally (any split recommendation surfaces to founder for decision)

---

## Pairing With Other Skills

- **`/bug-triage-merge`** — produces clustered queues. The founder picks a cluster and feeds it (or just its surface name) to this skill. The two skills compose: `/bug-triage-merge` organizes, `/feature-session` dispatches.
- **`/prebuild`** — used when starting fresh feature work from a PRD that has no existing code. This skill is for surfaces that already exist and need fixing/extending. They are complementary, not overlapping.
- **`/bug-reports`** — used to look at individual reports. Useful when scoping ambiguous reports during Phase 1 inventory.

---

## Why This Skill Exists

Without it, the founder either fixes one bug at a time (slow, surfaces stay broken in adjacent ways) or batches via the audit queue alone (invisible to her, doesn't address what she noticed). This skill makes the natural human workflow — "I noticed something, while we're in there fix everything else broken on the same page" — into a first-class operation. Every session leaves a coherent, fully-functional surface behind, and audit rows close as a side effect of feature work the founder is already directing.
