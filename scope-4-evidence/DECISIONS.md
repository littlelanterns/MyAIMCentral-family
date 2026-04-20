---
Status: OPEN — walk-through has not started
Stage: C
Scope: 4 (cost optimization patterns P1–P9)
Opened: 2026-04-20
Related: [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §4; [PLAN.md](PLAN.md); [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 (lines 310–313); [claude/ai_patterns.md](../claude/ai_patterns.md) §"9 AI Cost Optimization Patterns"
---

# Scope 4 — Decisions Log

> **Purpose:** Append-only log of founder decisions per cost-optimization pattern. Orchestrator proposes adjudicated verdicts after reading each `EVIDENCE_P{N}_*.md`; founder confirms, amends, or overrides. Each entry is permanent — if a verdict is later revised, a new entry references the prior one rather than editing history.

## Recovery pointer

If this file is being read by a fresh session: the plan lives at [PLAN.md](PLAN.md); the gameplan source is [MYAIM_GAMEPLAN_v2.2.md](../MYAIM_GAMEPLAN_v2.2.md) Phase 2 lines 310–313; pattern definitions live in [claude/ai_patterns.md](../claude/ai_patterns.md) lines 192–202. Findings flow into [AUDIT_REPORT_v1.md](../AUDIT_REPORT_v1.md) §4 as `SCOPE-4.F{N}`. Dynamic-evidence patterns (P2, P4, P9) require founder approval at dispatch per PLAN §3.1.

## Standing rules

Inherited from Scope 5 walk-through ([WALKTHROUGH_DECISIONS.md](../.claude/completed-builds/scope-5-evidence/WALKTHROUGH_DECISIONS.md)) and Scope 8a adjudication log ([CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) §Standing rules), amended for Scope 4 content (cost-pattern verification; dynamic-evidence discipline on P2/P4/P9).

1. **Beta Readiness default = N** for Scope 4 findings. Set to Y only when the missing pattern produces a child-facing Sonnet call that should be Haiku, a context-bulk-load on Guided/Play shells, or a projected per-family AI cost >$5/month. Cost patterns are optimization, not beta-blocking by default.
2. **Non-concurrent zones untouched.** Universal-Setup-Wizards design docs and `src/components/studio/wizards/` are read-only.
3. **"If it doesn't work in the app, it is not wired."** Applied especially to P2 (classifier computes embeddings but never queries them) and P9 (assembleContext signature exists but per-turn window not actually slid).
4. **Evidence not intuition.** Every verdict cites file:line, grep hit, ai_patterns.md section reference, or `ai_usage_tracking` query result.
5. **Worker commits, orchestrator adjudicates.** Per-pattern worker runs grep + static inspection + (when approved) dynamic test + writes evidence file.
6. **Grep/Glob primary per Convention 242.** mgrep per-query-approved only.
7. **Dynamic tests require founder approval at dispatch.** Not at plan time — at the moment a worker is ready to run a staged test against `ai_usage_tracking`. Test recipe, expected result, expected row count all surfaced to founder before the test runs.
8. **Do not re-emit Scope 2 or Scope 3+8b findings.** When a Scope 4 miss is already captured by another scope, cite and skip.

## Decision log format

Each pattern round uses the following entry shape. Modeled on [CHECKLIST_DECISIONS.md](../.claude/completed-builds/scope-8a-evidence/CHECKLIST_DECISIONS.md) Round format.

```
## Round {N} — P{N} {pattern name} evidence pass

- **Date:** YYYY-MM-DD
- **Worker pass:** [EVIDENCE_P{N}_{pattern-slug}.md](EVIDENCE_P{N}_{pattern-slug}.md)
- **Static evidence:** {site count examined, sites applying correctly, sites missing}
- **Dynamic evidence:** {test recipe if applicable; `ai_usage_tracking` row counts; expected vs observed}

### Per-site verdict table

| Site | Proposed verdict (applied/not applied/ambiguous) | Expected-vs-observed summary | Cross-ref to other scope findings | Founder decision |
|---|---|---|---|---|
| {site ref} | {applied/not applied} | {one line} | {SCOPE-2.F{N} / SCOPE-3.F{N} if applicable} | (pending) |

### Load-bearing unexpected findings
{numbered list — sites surfaced during grep not on the expected-site list}

### Cross-references
{Scope 2 / Scope 3+8b finding IDs that this pattern round cites}

### Founder adjudication
{one paragraph per decided finding}

### Emission list
{final SCOPE-4.F{N} titles for apply-phase}
```

## Round 0 — Preliminary notes before evidence gathering

### Dynamic-test recipe approval protocol

Per PLAN §3.1, P2 and P9 evidence passes (and optionally P4) require dynamic-test recipes approved by the founder before dispatch. The recipe specifies: test family scope, test member, test input set, expected `ai_usage_tracking` row count under correct pattern application, expected row count under missed pattern, cleanup scope. Orchestrator drafts; founder approves. The dispatch worker does not run the test until approval is captured in this DECISIONS.md under the relevant round.

### Expected misses — priority verification targets

Per Gameplan lines 312–313:
- **P2** — "AI calls that should be using embedding-based classification but aren't." Candidate misses listed in PLAN §2.2 include feedback sentiment, blog comment moderation, routing-suggestion surfaces.
- **P4 / Layered Context Assembly** — "context loading is relevance-filtered, not bulk-loaded." Candidate drift: any lila-* Edge Function that bypasses `assembleContext()`.

Both surface as candidate findings in Round 2 (P2) and Round 4 (P4) kickoff. Orchestrator expects these to be the highest-finding-density patterns.

### Patterns with no dynamic evidence

P1, P3, P5, P6, P7, P8 can close on static evidence alone. If a worker for any of these patterns proposes a dynamic test, orchestrator asks "is static insufficient?" before approving; dynamic is the exception, not the default.

### Cross-pattern finding possibility

Per PLAN §5.3, if a single feature misses 3+ cost patterns at once (most likely: a new Edge Function added since the last audit and not instrumented), emit one feature-level finding listing the missed patterns rather than N per-pattern findings. Orchestrator watches for this during synthesis.

## Decisions

## Round 1 — P1 Batch Processing evidence pass

*(entry filled during walk-through; static-only expected)*

## Round 2 — P2 Embedding-Based Classification evidence pass

*(entry filled during walk-through; dynamic-evidence required; expected highest-density finding round)*

## Round 3 — P3 Context Learning Detection evidence pass

*(entry filled during walk-through; static-primary, dynamic optional)*

## Round 4 — P4 Semantic Context Compression evidence pass

*(entry filled during walk-through; dynamic optional but valuable)*

## Round 5 — P5 On-Demand Secondary Output evidence pass

*(entry filled during walk-through; static-only)*

## Round 6 — P6 Caching and Reuse evidence pass

*(entry filled during walk-through; static-primary, dynamic optional)*

## Round 7 — P7 Time-Based Sampling evidence pass

*(entry filled during walk-through; static-only)*

## Round 8 — P8 User-Controlled Scope evidence pass

*(entry filled during walk-through; static-only)*

## Round 9 — P9 Per-Turn Semantic Refresh evidence pass

*(entry filled during walk-through; dynamic-evidence required)*

## Synthesis pass

*(optional — if a cross-pattern feature-level finding emerges per PLAN §5.3, captured here. Modeled on WALKTHROUGH_DECISIONS.md aggregate findings section.)*
