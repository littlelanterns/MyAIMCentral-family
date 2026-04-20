---
Status: OPEN — walk-through has not started
Stage: C
Scope: 3 + 8b (cross-PRD integration; integration compliance & safety)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §3 and §8b; [PLAN.md](PLAN.md); [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 305–308, 332)
---

# Scope 3 + 8b — Decisions Log

> **Purpose:** Append-only log of founder decisions per integration surface. Orchestrator proposes adjudicated verdicts after reading each `EVIDENCE_{addendum-slug}.md`; founder confirms, amends, or overrides. Each entry is permanent — if a verdict is later revised, a new entry references the prior one rather than editing history.

## Recovery pointer

If this file is being read by a fresh session: the plan lives at [PLAN.md](PLAN.md); the gameplan source is [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 lines 305–308 (Scope 3) and line 332 (Scope 8b). Findings flow into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §3 (design findings) or §8b (safety/compliance findings). The integration surface inventory lives in PLAN.md §3.

## Standing rules

Inherited from Scope 5 walk-through ([WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md)) and Scope 8a adjudication log ([CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md)), amended for Scope 3+8b content.

1. **Beta Readiness default = N for SCOPE-3** (design-only); **default Y for SCOPE-8b** (safety/compliance integration). Set SCOPE-3 to Y only when the design defect makes a child-facing surface non-viable for beta. Set SCOPE-8b to N only when the finding is clearly informational.
2. **Non-concurrent zones untouched.** Universal-Setup-Wizards design docs and `src/components/studio/wizards/` are read-only for this scope.
3. **"If it doesn't work in the app, it is not wired."** Applied especially to integration seams — both sides must actually run, not just exist in schema or addendum text.
4. **Evidence not intuition.** Every verdict cites migration SHA, file:line, grep hit, or addendum/PRD section reference.
5. **Worker commits, orchestrator adjudicates.** Per-surface worker runs the grep + read + write + commit loop; orchestrator does not grep substantively, only reads evidence files and proposes verdicts.
6. **Grep/Glob primary per Convention 242.** mgrep per-query-approved only.
7. **Emission tag decided at finding time.** A single addendum may produce both Scope 3 and Scope 8b findings. Do not pre-classify an addendum.
8. **Consolidate across addenda when a pattern repeats 3+ times** per PLAN §5.2. Single-PRD findings belong in Scope 2.
9. **Cross-reference closed findings** from Scope 5 and Scope 8a rather than re-describing their content.

## Decision log format

Each per-surface round uses the following entry shape. Modeled on [CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md).

```
## Round {N} — {addendum short name} evidence pass

- **Date:** YYYY-MM-DD
- **Surface:** prds/addenda/{filename}
- **Bridged PRDs:** PRD-X, PRD-Y, ...
- **Worker pass:** [EVIDENCE_{addendum-slug}.md](EVIDENCE_{addendum-slug}.md)
- **Aggregate:** {row counts per classification; seam count}

### Per-seam verdict table

| Seam | Proposed classification | Proposed finding tag | Proposed severity | Emits into | Founder decision |
|---|---|---|---|---|---|
| {seam short name} | {Intentional-Document / Unintentional-Fix-Code / etc.} | SCOPE-3 / SCOPE-8b / BOTH | Blocking/High/Medium/Low | SCOPE-3.F{N} / SCOPE-8b.F{N} | (pending) |

### Load-bearing unexpected findings
{numbered list}

### Cross-references
{Scope 5, Scope 8a, Scope 1 finding IDs that this surface cites}

### Founder adjudication
{one paragraph per decided finding}

### Emission list
{final SCOPE-3.F{N} and SCOPE-8b.F{N} titles for apply-phase}
```

## Round 0 — Preliminary notes before traversal

### Surfaces expected to be Deferred-to-Gate-4 due to unbuilt PRDs

Per PLAN §9.1, several integration surfaces cannot be evaluated because one side of the seam is unbuilt. For these, the evidence pass produces a stub file that cites the closed Scope 5 / Scope 8a finding and classifies as `Deferred-Document` / Defer-to-Gate-4. No `SCOPE-3` or `SCOPE-8b` finding is emitted — the remediation scope is already captured by the closed finding.

| Surface | Blocking unbuilt PRD | Closed finding reference |
|---|---|---|
| PRD-20 Safe Harbor integrations | PRD-20 unbuilt | SCOPE-8a.F3 |
| PRD-30 Safety Monitoring integrations | PRD-30 unbuilt | SCOPE-8a.F3 |
| PRD-32/32A Admin Console integrations | PRD-32 unbuilt | SCOPE-8a.F1 remediation scope |
| PRD-28B Compliance & Progress Reporting seam (PRD-37 × PRD-28B) | PRD-28B unbuilt | Scope 5 Finding A |
| PRD-40 COPPA consent gating integrations | PRD-40 unbuilt | SCOPE-8a.F1 |
| PRD-41 Runtime ethics enforcement integrations | PRD-41 unauthored | SCOPE-8a.F3 |

Evidence-pass worker for each of these surfaces writes a short stub file per PLAN §10 rather than a full traversal.

### Expected cross-addendum consolidations

Flagged in advance for orchestrator attention during walk-through. Confirmed or dropped based on what evidence actually surfaces.

- **studio_queue handoff pattern** — PRD-08, PRD-15, PRD-16, PRD-17, PRD-17B, PRD-34 all write to `studio_queue`. Watch for drift in `source` field discipline, queue-vs-direct-insert decisions, requester_id population.
- **Universal Scheduler consumers pattern** — PRD-14B, PRD-16, PRD-18, PRD-27, PRD-35 addenda all describe recurrence integrations. Watch for drift in RRULE JSONB contract.
- **HITM pattern across AI Edge Functions** — SCOPE-8a.F8 already noted shared component under-reuse. Scope 3+8b examines whether the cross-PRD integration seams (e.g., MindSweep → Journal, Notepad → Tasks) preserve HITM semantics across the handoff.
- **Privacy Filtered + Safe Harbor exempt propagation** — addenda for PRD-13, PRD-19, PRD-20 may all cite these rules. Watch for drift in whether every downstream consumer of context data respects both filters.
- **`is_included_in_ai` three-tier toggle propagation** — Personal Growth context-source tables to LiLa context assembler. Classical drift pattern per Scope 5 walk-through.

### Pattern-to-watch — addenda that reference closed findings

Several cross-PRD addenda may already describe integrations to PRDs that Scope 8a closed as unbuilt. Those rows within the addendum evidence file classify as `Deferred-Document` and cross-reference the closed finding. Not a finding in their own right.

## Decisions

*(entries filled as each integration surface walk-through closes; one `## Round {N}` heading per surface, in the order the surfaces run per PLAN §9 gating)*

## Synthesis pass

*(optional — if cross-addendum patterns emerge that warrant elevation to a systemic integration finding, captured here. Modeled on Scope 5's WALKTHROUGH_DECISIONS.md aggregate findings section.)*
