---
Status: STUB (Deferred-to-Gate-4 per Round 0 PLAN §9.1)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-30-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-30 (source) ↔ every LiLa surface (PRD-05, PRD-21, PRD-23 discuss, PRD-25 guided tools, PRD-34 ThoughtSift × 5)
---

## Worker cover paragraph

Per `scope-3-8b-evidence/DECISIONS.md` Round 0, PRD-30 (Safety Monitoring) is DEFERRED-TO-GATE-4 because PRD-30 is unbuilt per `SCOPE-8a.F3`. No evidence pass traversal is warranted at Stage C; the remediation scope for PRD-30's cross-PRD integration surface is already captured by the closed Scope 8a finding.

**Closed finding reference:** `SCOPE-8a.F3` (AUDIT_REPORT_v1.md §8a) — Safety Monitoring infrastructure unbuilt.

## What the addendum promises (for Gate-4 prerequisite mapping)

The PRD-30 Cross-PRD Impact Addendum prescribes:
- **Two-layer detection** per `claude/ai_patterns.md`:
  - Layer 1 (synchronous): keyword/phrase matching on every message — **PARTIALLY WIRED** via global Crisis Override (`detectCrisis` in `_shared/crisis-detection.ts`)
  - Layer 2 (async): Haiku conversation classification via `safety-classify` Edge Function — **NOT BUILT**
- **Three severity tiers**: Concern / Warning / Critical
- **Locked categories** (always High severity): `self_harm`, `abuse`, `sexual_predatory`
- **Children monitored by default, adults opt-in**
- **`lila_messages.safety_scanned`** flag prevents double-processing — column exists
- **Safety tables** (per Feature Glossary): `safety_monitoring_configs`, `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, `safety_keywords`, `safety_resources`, `safety_pattern_summaries`
- **Global Crisis Override** across EVERY LiLa conversation — partially wired per prior evidence files

## Current state (latent seam observations from other evidence files)

- **EVIDENCE_prd15 seam #6**: `message-coach` + `auto-title-thread` Edge Functions import zero crisis-detection code — crisis-language drafts go straight to Haiku without safety check.
- **EVIDENCE_prd17B open flag**: `mindsweep-sort` Crisis Override exempt per RECON ruling — but `/sweep` is `ProtectedRouteNoShell` accessible to Independent teens (teen-surface Crisis Override coverage gap).
- **EVIDENCE_prd21**: All 8 PRD-21 tool Edge Functions correctly integrate `detectCrisis` — **strong positive**.
- **EVIDENCE_prd23 Finding A**: `bookshelf-discuss` bypasses Crisis Override + safety monitoring; messages persist to `bookshelf_discussion_messages` not `lila_messages` — PRD-30 cannot scan them when built.
- **EVIDENCE_prd25 seam #7**: `guided-nbt-glaze` missing `authenticateRequest` + no crisis check.
- **EVIDENCE_prd34**: All 5 ThoughtSift Edge Functions correctly integrate `detectCrisis` — **strong positive**. Mediator `safety_triggered` flag is the best-in-class safety implementation. BUT `lila_messages.safety_scanned` is NOT marked on insert, so PRD-30 Layer 2 classifier (when built) won't pick them up without client-side changes.
- **EVIDENCE_prd18 seam #13**: LiLa `contextual_help` context injection + `mood_triage` never wired — PRD-30 relies on `mood_triage` signals.

## Pre-seam warnings for PRD-30 build

1. **`bookshelf-discuss` must be added to PRD-30 scan surface** (or migrated to use `lila_messages` persistence).
2. **`message-coach` + `auto-title-thread` need Crisis Override integration** before PRD-30 Layer 2 can meaningfully classify messaging drafts.
3. **`guided-nbt-glaze` needs `authenticateRequest` + crisis check** before PRD-30 scans its output.
4. **Every Edge Function that inserts `lila_messages` must set `safety_scanned: false`** so the classifier sweeps `WHERE safety_scanned = false` picks them up.
5. **Teen-surface Crisis Override on `mindsweep-sort`** — RECON ruling assumed mom-only; `/sweep` route allows teens.

## Proposed finding split

**0 SCOPE-3 findings. 0 SCOPE-8b findings** (all contributing surfaces already captured in other evidence files as SCOPE-8b primaries with cross-references to PRD-30 build).

Rationale: PRD-30 safety tables and Layer 2 classifier are structurally absent. Remediation is fully captured by `SCOPE-8a.F3`. When PRD-30 builds, the 5 pre-seam warnings above become the prerequisite checklist for that build's pre-build audit.

## Beta Y candidates

None directly from this stub — but note that **global Crisis Override gaps flagged in PRD-15, PRD-23, PRD-25 evidence files remain Beta Y SCOPE-8b findings** regardless of PRD-30 build status, because Crisis Override is a CLAUDE.md #7 independent requirement.

## Orchestrator adjudication

Deferred-to-Gate-4 per Round 0. No walk-through needed. Move to apply-phase cross-reference.
