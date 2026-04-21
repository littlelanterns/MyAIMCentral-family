---
Status: STUB (Deferred-to-Gate-4 per Round 0 PLAN §9.1)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-37 (Family Feeds) ↔ PRD-28B (Compliance & Progress Reporting — Deferred-to-Gate-4), PRD-19 (Family Context reports), PRD-08 (Journal — homeschool learning capture), PRD-28 (Tracking — homework time logs)
---

## Worker cover paragraph

Per `scope-3-8b-evidence/DECISIONS.md` Round 0, the PRD-37 × PRD-28B integration seam is DEFERRED-TO-GATE-4 because PRD-28B is unbuilt per Scope 5 Finding A and confirmed in `EVIDENCE_prd28` seam #15 + `EVIDENCE_prd19` F-B.

**Closed finding references:**
- Scope 5 Finding A — PRD-28B (Compliance & Progress Reporting) unbuilt.
- `EVIDENCE_prd28` seam #15 — PRD-28B handoff confirmed Deferred-to-Gate-4.
- `EVIDENCE_prd19` F-B — PRD-19 reports × archive column drift is "pre-seam warning" for Phase 20 Archives build.

## What the addendum promises (for Gate-4 prerequisite mapping)

The PRD-37 × PRD-28B Cross-PRD Impact Addendum prescribes:
- **Homework portfolio pipeline**: Guided shell "Send to → Homework" writes `journal_entries` with `entry_category='homework'` → accumulates as learning capture → flows to PRD-37 Family Feeds for narrative presentation → routes to PRD-28B compliance reports
- **PRD-37 Family Feeds**: `family_moments`, `moment_media`, `moment_reactions`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings`
- **PRD-28B Compliance**: `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices`
- **Automatic evidence capture**: homework journal entries + homeschool time logs → standard_evidence rows tagged with state education standards
- **ESA invoice generation**: from `family_subscriptions.founding_rate_monthly` (see EVIDENCE_prd31 seam #25 — column MISSING from live schema)
- **LiLa `homeschool_report_generation` mode** for automated compliance report drafting

## Current state (partial-wiring observations)

**PRD-37 (Family Feeds) tables MOSTLY BUILT:**
- `family_moments`, `moment_media`, `moment_reactions`, `moment_comments`, `out_of_nest_feed_settings`, `feed_approval_settings` — per Feature Glossary PRD-37 row, MVP status.
- Portfolio pipeline first brick: **CONFIRMED WIRED** per CLAUDE.md Convention #131 — Guided Write drawer "Homework" destination routes to `journal_entries` with `entry_category='homework'`.

**PRD-28B (Compliance) tables NOT built:**
- `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices` — all ABSENT from live schema (feature_glossary lists them in DOMAIN_ORDER but `live_schema.md` flags as missing).
- No `homeschool_report_generation` guided mode seed.
- No compliance Edge Functions.

## Pre-seam warnings (from other evidence files)

1. **EVIDENCE_prd28 seam #15**: PRD-28B compliance reporting handoff explicitly Deferred.
2. **EVIDENCE_prd19 F-B**: Monthly aggregation + reports pipeline unbuilt. F22/F23 carry-forward is "pre-seam warning" — when Phase 20 Archives build ships, report-generation code MUST include the PRD-19 column extensions (is_private_note filter, share_with_spouse filter) AND must filter `is_safe_harbor=false` per Convention #243.
3. **EVIDENCE_prd31 seam #25**: `family_subscriptions` missing `founding_rate_monthly`/`founding_rate_yearly` columns — ESA invoice generation cannot compute founding rate without them.
4. **EVIDENCE_prd28 seam #5**: Convention #225 (financial data excluded from LiLa context) is cleanly wired. When PRD-28B reporting lands, the same exclusion discipline must extend to report-generation queries.
5. **EVIDENCE_prd31 F-G**: Server-side tier enforcement gap — PRD-28B compliance reports are Full Magic tier; tier gating must enforce before ESA invoice generation can serve.

## Proposed finding split

**0 SCOPE-3 findings. 0 SCOPE-8b findings** on the PRD-28B side (fully Deferred).

The PRD-37 side (Family Feeds — Homework portfolio first brick) is built per Convention #131; no drift surfaces on this stub's scope. If a deeper PRD-37 Cross-PRD Impact Addendum exists separately (not found in glob), it would be audited as its own surface; this addendum specifically covers the PRD-37 × PRD-28B seam which is gated by PRD-28B.

## Beta Y candidates

None — PRD-28B is explicitly post-MVP per multiple feature decision files. PRD-37 portfolio-first-brick is wired but downstream compliance surfaces are unreachable until PRD-28B builds.

## Orchestrator adjudication

Deferred-to-Gate-4 per Round 0. PRD-37 Family Feeds core surface is built (per Feature Glossary); the Homework portfolio first-brick is the only wired cross-seam and it's documented as Convention #131. PRD-28B compliance side is structurally absent pending build.
