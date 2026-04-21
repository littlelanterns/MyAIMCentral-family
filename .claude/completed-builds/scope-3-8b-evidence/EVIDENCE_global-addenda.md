---
Status: COMPLETE (orchestrator read-once pass — global addenda are process documents, not integration specs)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addenda: prds/addenda/PRD-Audit-Readiness-Addendum.md (287 lines) + prds/addenda/PRD-Template-and-Audit-Updates.md (146 lines)
Scope: Global / cross-cutting (not per-PRD integration surface)
---

## Orchestrator cover paragraph

Per PLAN §3.4, the two global addenda are read-once cross-cutting process documents, not cross-PRD integration surfaces. They describe PRD-writing habits and template additions to support the end-of-writing Opus audit (which is the audit currently running). Neither addendum describes code-level integration seams between PRDs — both address how PRDs should be written.

## PRD-Audit-Readiness-Addendum.md — summary

Documents 7 habits (+ Habit 8 from the companion update doc) for writing PRDs that enable a coherent audit pass:

1. **Record the Rationale, Not Just the Decision** — `> **Decision rationale:** ...` inline tag
2. **Tag Every Deferred Decision Consistently** — `> **Deferred:** ... resolution path` inline tag
3. **Name Cross-PRD Dependencies Explicitly** — `> **Depends on:** ... defined in PRD-XX, Section` inline tag
4. **Keep Shell Behavior Tables Complete and Consistent** — all 5 shells, no blanks
5. **Note Tier Availability Per Feature** — explicit even if "all tiers"
6. **Include "Why This Matters to Mom" on Key Flows** — `> **Mom experience goal:** ...` tag
7. **Flag Forward-Compatibility Considerations** — `> **Forward note:** ...` tag

Contains a draft audit prompt that was the seed for the Phase 2 audit currently running.

## PRD-Template-and-Audit-Updates.md — summary

Documents 4 updates to apply to project knowledge files:
1. PRD Template — add "Decisions Made This Session" section with 3 tables (Decided / Deferred / Cross-PRD Impact)
2. PRD Template — add "Audit Readiness Tags" section documenting the 6 inline tags
3. Audit Readiness Addendum — add Habit 8 (Consolidate Session Decisions in the PRD)
4. PRD-08 Starter Prompt — add audit-readiness references

## Cross-cutting observations (not findings)

The habits these addenda document are **well-represented in the PRDs actually audited in Scope 3+8b**:
- `> **Decision rationale:**` tags appear consistently across addendum text in PRD-15, PRD-16, PRD-17B, PRD-18, PRD-23, PRD-24, PRD-25, PRD-34 evidence files.
- `> **Deferred:**` tags are used in nearly every Cross-PRD Impact Addendum (e.g., PRD-21A §3A-§3C, PRD-26 Phase 2/3, PRD-31 monetization engine).
- `> **Depends on:**` tags appear but less consistently — some addenda name cross-PRD dependencies in prose rather than using the tag.
- Shell behavior tables are present but some have drift per EVIDENCE_prd14d seam #1 (PerspectiveSwitcher special_adult overgrant) and EVIDENCE_prd25 seam #1 (Guided bottom nav missing Victories) — these are spec-vs-code drifts, not addendum-writing drifts.

## Cross-cutting patterns that DO emerge from this audit (feed synthesis)

Although the global addenda are process docs, the audit of the 28 integration-surface files reveals several cross-cutting patterns that may warrant UPDATES to these process docs:

1. **"Addendum self-reporting drift" pattern** (EVIDENCE_prd21c seam — "PRD-21C claims completion when none exists"; EVIDENCE_prd24 seams #1+#11+#14 — "addendum pre-pivot, Build M shipped different architecture"). Habit recommendation: when a build supersedes an addendum's architecture, the addendum MUST be back-amended or marked `> **SUPERSEDED BY Build X:** ...`. Currently no such tag exists.

2. **"Stub-socket-as-WIRED claim" pattern** (EVIDENCE_prd29 Unexpected #3 — PRD-29 addendum marks stub sockets as "WIRED" when no writer exists). Habit recommendation: WIRED status requires a writer, not just a socket. Convention #73 (WIRING_STATUS "If it doesn't work, it's not wired") should be cross-referenced in the addendum-writing habits.

3. **"Addendum target-column naming drift"** (EVIDENCE_prd16 unexpected #1; EVIDENCE_prd27 seam #3). Habit recommendation: when an addendum references a column on another PRD's table, the author should verify the column name against the latest migration rather than relying on the PRD text.

## Proposed finding split

**0 SCOPE-3 findings. 0 SCOPE-8b findings.**

Rationale: The global addenda are process documents. No code surfaces to audit. The observations above are recommendations for the addendum-writing habits themselves, not code findings.

If the orchestrator wishes to capture these recommendations as `Intentional-Update-Doc` items (not Scope 3+8b findings), they could be written back into the PRD-Audit-Readiness-Addendum.md as Habits 9–11 during a future Gate-4 pre-build documentation pass.

## Beta Y candidates

None — these are documentation meta-habits.

## Orchestrator adjudication

No walk-through needed. Global addenda are process documents; the 3 cross-cutting addendum-writing patterns noted above are informational recommendations for future PRD-writing sessions, not findings against code.
