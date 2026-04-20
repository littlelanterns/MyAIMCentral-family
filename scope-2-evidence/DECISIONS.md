---
Status: OPEN — walk-through has not started
Stage: C
Scope: 2 (PRD-to-code alignment)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2; [PLAN.md](PLAN.md); [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 300–304)
---

# Scope 2 — Decisions Log

> **Purpose:** Append-only log of founder decisions per Scope 2 domain batch. Orchestrator proposes adjudicated verdicts after reading each `EVIDENCE_BATCH_{N}_*.md`; founder confirms, amends, or overrides. Each round entry is permanent — if a verdict is later revised, a new entry references the prior one rather than editing history.

## Recovery pointer

If this file is being read by a fresh session: the plan lives at [PLAN.md](PLAN.md); the gameplan source is [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 lines 300–304. Findings flow into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §2 as `SCOPE-2.F{N}`. The 9 domain batches run in the order listed in PLAN.md §3.1.

## Standing rules

Inherited from Scope 5 walk-through ([WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md)) and Scope 8a adjudication log ([CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) §Standing rules), amended for Scope 2 content.

1. **Beta Readiness default = N** for Scope 2 findings. Set to Y only when the drift affects child-facing UX, privacy boundary, safety surface, compliance lifecycle, or role-boundary data leak. Most Scope 2 findings are PRD-text-vs-code-drift and do not block beta. Founder ruling 2026-04-20 (PLAN.md §6).
2. **Non-concurrent zones untouched.** Universal-Setup-Wizards design docs and `src/components/studio/wizards/` are read-only for this scope.
3. **"If it doesn't work in the app, it is not wired."** Inherited rule from Scope 5 walk-through. Applies to any row where the PRD claim is "built" but no consuming code actually runs the infrastructure. Applies especially to Foundation (PRD-01/02 invite + permission flows) and Personal Growth (context-source tables that require three-tier toggle wiring all the way to LiLa context assembly).
4. **Evidence not intuition.** Every verdict must cite migration SHA, `file:line`, grep hit, PRD section/line reference, or worker-pass report. "I remember reading..." is not evidence.
5. **Worker commits, orchestrator adjudicates.** The batch worker runs greps and writes `EVIDENCE_BATCH_{N}_*.md` and commits it. The orchestrator does not run substantive greps directly; it reads the evidence file, proposes verdicts, and captures founder adjudication here.
6. **Scope 2 does not re-emit Scope 5 / Scope 8a closed findings.** When a Scope 2 row maps 1:1 to a closed finding, the evidence file cites the finding ID and skips emission. When a Scope 2 row identifies a *new* drift on the same PRD as a closed finding, emit normally with a cross-reference.

## Decision log format

Each batch round uses the following entry shape. Modeled on [CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) Round format.

```
## Round {N} — {Domain name} evidence pass (Batch {N}, PRDs {...})

- **Date:** YYYY-MM-DD
- **Worker pass:** [EVIDENCE_BATCH_{N}_{slug}.md](EVIDENCE_BATCH_{N}_{slug}.md)
- **Aggregate:** {row counts per classification}

### Per-candidate-finding verdict table

| Candidate | PRD rows contributing | Proposed verdict | Proposed severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| SCOPE-2.F{N} title | {row refs} | {proposed} | Blocking/High/Medium/Low | SCOPE-2.F{N} | (pending) |

### Load-bearing unexpected findings

{numbered list drawn from evidence file's Unexpected Findings section}

### Cross-references
{links to any prior finding this batch cites — Scope 5, Scope 8a, Scope 1}

### Founder adjudication

{one paragraph per decided finding — confirmed/amended/overridden + rationale}

### Emission list

{final list of SCOPE-2.F{N} titles that will be written to AUDIT_REPORT_v1.md §2 by the apply-phase worker}
```

Each per-candidate row in the verdict table uses one of the 5 Gameplan classifications from PLAN.md §2 at the row level; the `Proposed verdict` column reflects that classification. Finding emission is the consolidation step — rows with the same classification and pattern collapse into one `SCOPE-2.F{N}`.

## Round 0 — Preliminary notes before evidence gathering

Items flagged for consideration before Foundation batch kicks off. Confirmed or overridden at Round 1 kickoff.

### Open scope question — PRDs not in any batch

Per PLAN.md §3.3, four PRDs that exist in `prds/` are not currently assigned to a batch: PRD-18 Rhythms, PRD-19 Family Context, PRD-31 Subscription, PRD-32A Demand Validation Engine. Founder ruling needed at plan-approval on placement or skip. Logged here so a fresh session knows the open question.

### Pattern-to-watch — three-tier toggle wiring drift

Scope 5 confirmed several context-source tables have `is_included_in_ai` columns but the three-tier toggle (person/category/item) may not be wired end-to-end in every case. Scope 2 Personal Growth batch (PRD-06/07/08/13) is the natural surface for verifying this drift per-PRD. Watch for cross-PRD pattern; may flag to Scope 3+8b.

### Pattern-to-watch — screen count drift

Several PRDs (notably PRD-14B Calendar, PRD-15 Messages, PRD-21A Vault) specify large numbers of screens. Scope 5 did not enumerate every screen. Scope 2 batches touching these PRDs should enumerate screen count claimed vs present; expect Deferred-Document classification on partial builds.

## Decisions

## Round 1 — Foundation evidence pass (Batch 1, PRDs 01–04)

*(entry filled during walk-through)*

## Round 2 — LiLa evidence pass (Batch 2, PRDs 05, 05C)

*(entry filled during walk-through)*

## Round 3 — Personal Growth evidence pass (Batch 3, PRDs 06, 07, 08, 11, 11B, 13)

*(entry filled during walk-through)*

## Round 4 — Tasks/Studio evidence pass (Batch 4, PRDs 09A, 09B, 17, 17B)

*(entry filled during walk-through)*

## Round 5 — Dashboards/Calendar evidence pass (Batch 5, PRDs 10, 14, 14B, 14C, 14D, 14E, 25, 26)

*(entry filled during walk-through)*

## Round 6 — Communication evidence pass (Batch 6, PRDs 15, 16)

*(entry filled during walk-through)*

## Round 7 — Vault/BookShelf evidence pass (Batch 7, PRDs 21, 21A, 21B, 21C, 22, 23, 34)

*(entry filled during walk-through)*

## Round 8 — Gamification evidence pass (Batch 8, PRDs 24, 24A, 24B)

*(entry filled during walk-through)*

## Round 9 — Compliance evidence pass (Batch 9, PRDs 27, 28, 29, 30, 35, 36, 37, 38)

*(entry filled during walk-through)*

## Synthesis pass

*(optional — if cross-batch patterns emerge that warrant a consolidation-level finding, captured here. Modeled on [WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md) aggregate findings section.)*
