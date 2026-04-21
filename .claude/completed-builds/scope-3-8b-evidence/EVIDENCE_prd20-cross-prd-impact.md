---
Status: STUB (Deferred-to-Gate-4 per Round 0 PLAN §9.1)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-20-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-20 (source) ↔ PRD-05 (LiLa — 4 Safe Harbor guided modes), PRD-08 (Journal — Safe Harbor entries), PRD-11 (Victory aggregation exclusion), PRD-13 (Archives aggregation exclusion), PRD-19 (Family Context reports exclusion), PRD-28B (Compliance reports exclusion), PRD-30 (Safety Monitoring integration)
---

## Worker cover paragraph

Per `scope-3-8b-evidence/DECISIONS.md` Round 0, PRD-20 (Safe Harbor) is DEFERRED-TO-GATE-4 because PRD-20 is unbuilt per `SCOPE-8a.F3`. No evidence pass traversal is warranted at Stage C; the remediation scope for PRD-20's cross-PRD integration surface is already captured by the closed Scope 8a finding.

**Closed finding reference:** `SCOPE-8a.F3` (AUDIT_REPORT_v1.md §8a) — Safe Harbor infrastructure unbuilt.

## What the addendum promises (for Gate-4 prerequisite mapping)

The PRD-20 Cross-PRD Impact Addendum prescribes:
- **Safe Harbor aggregation-exclusion guardrail** (CLAUDE.md Convention #243) — all queries against `lila_conversations` used for aggregation, reporting, or context assembly MUST filter `is_safe_harbor = false`
- **4 Safe Harbor guided modes** registered in `lila_guided_modes`: `safe_harbor` (Sonnet, mom/dad/teen), `safe_harbor_guided` (Haiku, Guided children), `safe_harbor_orientation` (Sonnet, mom-only), `safe_harbor_literacy` (Haiku, teen-only)
- **3 Safe Harbor tables** (per Feature Glossary): `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records`
- **`lila_conversations.is_safe_harbor` BOOLEAN** — already present in live schema
- **Crisis Override** global + Safe Harbor-specific safety concern protocol (PRD-20 three-tier escalation: Normal Processing → Professional Referral → Crisis Override)
- **Aggregation pipeline exclusions** across PRD-11 (Victories), PRD-13 (Archives), PRD-19 (reports), PRD-28B (compliance) — all must filter Safe Harbor content

## Current state (latent seam observations, not findings)

- `lila_conversations.is_safe_harbor` column exists (migration `00000000000007_lila_ai_system.sql`). Zero Safe Harbor conversations in production.
- Safe Harbor tables **do not exist** in live schema.
- Safe Harbor guided modes **not seeded** in `lila_guided_modes` (43 rows, none are Safe Harbor).
- Convention #243 is "convention text only at this stage" — no grep-based CI check, no RLS/view guard in place. When PRD-20 (or any aggregation pipeline) is built, the aggregation-exclusion guardrail MUST be implemented.
- Cross-reference: **EVIDENCE_prd18 seam #14** (Feature Discovery does not surface Safe Harbor UI); **EVIDENCE_prd17B seam #6** (`classify_by_embedding` RPC has no `is_safe_harbor` filter on `journal_entries` — this is a PRE-SEAM warning for when the Safe Harbor build lands); **EVIDENCE_prd19 F-B** (monthly aggregation pipeline unbuilt — when built, MUST filter Safe Harbor); **EVIDENCE_prd34 seam #16** (ThoughtSift conversations pass through PRD-30 safety monitoring — currently Deferred-Document).

## Proposed finding split

**0 SCOPE-3 findings. 0 SCOPE-8b findings.**

Rationale: No code exists to audit against. Every cross-PRD seam the addendum prescribes is structurally absent because PRD-20 itself is unbuilt. Remediation is fully captured by `SCOPE-8a.F3` (the PRD-20 build itself). When PRD-20 builds, the pre-seam warnings above become active Scope 3+8b surfaces — the apply-phase should cross-reference this stub at that time.

## Beta Y candidates

None — deferred to PRD-20 build.

## Orchestrator adjudication

Deferred-to-Gate-4 per Round 0. No walk-through needed. Move to apply-phase cross-reference.
