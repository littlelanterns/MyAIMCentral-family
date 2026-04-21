---
Status: STUB (Deferred-to-Gate-4 per Round 0 PLAN §9.1)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-32-32A-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-32 (Admin Console) + PRD-32A (Demand Validation Engine) ↔ PRD-02 (`staff_permissions` role), PRD-21B (Vault admin moderation), PRD-21C (engagement moderation — see EVIDENCE_prd21c), PRD-31 (tier management admin), PRD-32A demand validation is wired via `feature_demand_responses`
---

## Worker cover paragraph

Per `scope-3-8b-evidence/DECISIONS.md` Round 0, PRD-32/32A (Admin Console) is DEFERRED-TO-GATE-4 because PRD-32 is unbuilt per `SCOPE-8a.F1` remediation scope.

**Closed finding reference:** `SCOPE-8a.F1` (AUDIT_REPORT_v1.md §8a) — Admin Console infrastructure unbuilt.

## What the addendum promises (for Gate-4 prerequisite mapping)

The PRD-32/32A Cross-PRD Impact Addendum prescribes:
- **Admin Console at `/admin/*`** with 5 tabbed sections: System, Analytics, Feedback, AI Vault, Moderation
- **`staff_permissions` table** with `permission_type` enum (includes `moderation_admin` reserved but unused — per EVIDENCE_prd21c Unexpected #3)
- **Admin tables** (per Feature Glossary): `feedback_submissions`, `known_issues`, `reported_threats`, `admin_notes`, `ai_usage_log`, `platform_usage_log`
- **PRD-32A Demand Validation Engine**: `feature_demand_responses` table + PlannedExpansionCard component pattern

## Current state (what IS built)

**PRD-32A (Demand Validation) is PARTIALLY WIRED:**
- `feature_demand_responses` table exists in live schema (1 row).
- `PlannedExpansionCard` component embedded in UI per CLAUDE.md Convention #31 (PlannedExpansionCard enhanced pattern: "What this will do" + "I'm interested" vote + "Notify me when ready").
- `feature_expansion_registry.ts` populated with entries.

**PRD-32 (Admin Console) is NOT built:**
- No `/admin/*` routes in `App.tsx`.
- No `AdminConsole` component.
- No `feedback_submissions`, `known_issues`, `reported_threats`, `admin_notes`, `ai_usage_log`, `platform_usage_log` tables in live schema (per feature_glossary.md — listed in DOMAIN_ORDER but missing from live DB per `live_schema.md`).
- `staff_permissions.permission_type` enum has `moderation_admin` reserved but NO user granted it (EVIDENCE_prd21c).

## Pre-seam warnings for PRD-32 build (from other evidence files)

1. **EVIDENCE_prd21c seam #14**: Admin Moderation tab expected at `/admin/moderation` with 4 sub-tabs. Does not exist.
2. **EVIDENCE_prd21c seam #15**: Admin engagement analytics queries depend on tables that don't exist.
3. **EVIDENCE_prd22 seam #3**: `process_expired_deletions()` function exists but cron is commented out; hard-delete cascade absent — admin-triggered data deletion workflow cannot be served.
4. **EVIDENCE_prd21A seam #7**: `vault_tool_sessions` unwired — admin session monitoring absent.
5. **Reserved-but-ungranted permission values pattern** (from PRD-21C Unexpected #3) — check other unused permission_type enum values when PRD-32 builds.

## Proposed finding split

**0 SCOPE-3 findings. 0 SCOPE-8b findings.**

Rationale: PRD-32 is unbuilt. PRD-32A (Demand Validation) IS wired and is correctly captured in CLAUDE.md Convention #31 + `feature_expansion_registry.ts`; no drift surfaces on the demand validation side. Remediation for PRD-32 is fully captured by `SCOPE-8a.F1`.

## Beta Y candidates

None — Admin Console is a mom-configuration surface, not a child-facing or safety surface. Deferred-to-Gate-4 appropriately.

## Orchestrator adjudication

Deferred-to-Gate-4 per Round 0. PRD-32A demand validation side is wired cleanly. PRD-32 admin side is structurally absent pending build.
