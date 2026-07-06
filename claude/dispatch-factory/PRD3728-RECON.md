# PRD-37 Family Feeds + PRD-28B Compliance Reporting — Shared Recon Brief (Sonnet reader, 2026-07-04)

> Archived condensed with citations. Consumed by `PRD37.md` + `PRD28B.md`.

## A. Scope

**PRD-28B (6 screens):** Report Generation (extends PRD-19 Screen 5; category dropdown; 6 basic + 6 AI homeschool templates; SDS Monthly Summary fully specified L151-231, Acumen DCI format); Preview & Edit (HITM, non-removable disclaimer); Standards Portfolio Living View (per-standard evidence, coverage %, LiLa Suggest @ Full Magic); ESA Invoice Generator (all tiers, INV-YYYY-MM-NNN); Homeschool Configuration settings (state, per-student framework, evaluator, ESA program, schedule); Reporting Schedule & Reminders (notification-driven, NEVER auto-generated). 6 tables (homeschool_family_config, homeschool_student_config, education_standards [SYSTEM-level], standard_evidence, report_templates [data-not-code], esa_invoices); enums; extends generated_reports.template_type +16 values; mode homeschool_report_generation; 8 compliance_* keys. PRD self-stubs: IEP/Therapy templates, custom authoring, non-FL states, vendor integration.

**PRD-37 (8 screens):** Feeds page (Family tab always; Portfolio tab gated on homeschool_subjects rows); Family Life Feed (cards, hearts, comments, member filter); Portfolio Feed (subject tags, time logged, standards linkage, Highlight badge, sub-filters); Post Creation (role-adapted; Guided simplified; Play = mom posts on behalf); Bulk Summary (voice/text dump → LiLa parse → per-child entries, MAX 1-2 clarifying questions); Approval Queue (opt-in per child, Requests tab source='family_feed_post'); Out of Nest feed view (feed-first shell, /feed PWA); Hub widget "Recent Moments." 6 tables (family_moments, moment_media [30-day voice TTL], moment_reactions, moment_comments, out_of_nest_feed_settings, feed_approval_settings); mode homeschool_bulk_summary; 7 family_feed_* keys. Addendum locks **build order 37 → 28B** (L18, L928 d16); family_moments.standards_links UUID[] forward-references 28B's education_standards (37 L555).

## B. Verdicts — both 100% unbuilt

- All 12 tables absent (live_schema + migrations verified). **PRD-19's generated_reports/monthly_data_aggregations ALSO absent** — 28B's "extension" premise rests on them (RESOLVED by factory: PRD19 pack Slice 6 builds them; PRD19 is 28B's mandatory prerequisite).
- Routes: `/feeds` → FamilyFeedsStub (PlannedExpansionCard, sidebar-wired ×3 shells); `/family-feed` → generic PlaceholderPage (App.tsx:225) — DUPLICATE dead route.
- No report-generate/bulk-summary/ESA Edge Functions (49 EFs listed; none match). Both guided modes REGISTERED unused (migration 000007:273, :275 w/ requires_feature_key). victories.source 'family_feed' pre-seeded in 3 CHECKs, no writer.
- Feature keys: **1 of 15 registered** (compliance_esa_invoice, migration 000011:254).
- PRD-28 substrate BUILT, ZERO data: homeschool_subjects/configs/time_logs fully wired in useHomeschool.ts (CRUD, config cascade, summaries, 3 allocation modes) — 0 rows (founder hasn't used Log Learning). homework-estimate EF wired (LogLearningModal.tsx:69, homeschool_time_review mode).
- notify-out-of-nest EF = email stub (sent:false always). out_of_nest_members (4 rows) has NO feed columns.
- **Convention #131 first brick is a JOURNAL write:** SendToGrid.tsx:19,48,51,153 routes Guided "Homework" to journal_entries(entry_category='homework') — NOT family_moments (Convention #20's declared home). Reconciliation required at 37 build.
- PRD-31 ESA hook documented (PRD-31 L206,217,756-757,998,1200 — Settings button pre-populated from family_subscriptions [2 rows, ready]); no UI exists.

## C. Schema gaps
12 new tables (PRD column specs unusually migration-ready). education_standards needs a Common Core + AZ/FL/UT seed/import pipeline (no analog exists). standards_links FK forward-reference (ship bare UUID[] in 37; 28B adds FK). 14 keys to register. Queue source +'family_feed_post'; notification category +'reporting_reminder'.

## D. Touchpoints
PRD-19 handoff (28B extends generated_reports — prerequisite ruled); homeschool_time_logs convergence (both consume; useHomeschool reusable zero-rework); Bulk Summary = DEDICATED sibling EF per #165 (curriculum-parse precedent), category-1 → assembleContext (verify context_sources non-empty); victory wiring trivial post-family_moments; Queue Requests tab additive (reward_proposal precedent); demand signal: check feature_demand_responses for family_feeds votes.

## E. Conflicts (named)
1. PRD-19 boundary (RESOLVED by factory: PRD19 prerequisite; STUB rows 261-262 premature-Wired already walked back once).
2. Convention #243 CI-check obligation → lands with PRD19 Slice 6 (first aggregation shipper), not 28B.
3. **PRD-40 COPPA (L754-765) names 28B as inheriting the binding aggregation-exclusion constraint** — 28B PRD text predates PRD-40 and never mentions it; current per-family-only scope is likely compliant by construction; needs explicit sign-off row, not assumption.
4. Convention #20 vs live SendToGrid (journal homework category vs family_moments home).
5. Duplicate stub routes (/feeds canonical, /family-feed dead).
6. Composition conventions #249-256 postdate both PRDs (Bulk Summary ≈ bulk-AI-add; report gen draft semantics — proportionate reconciliation, not forced wizardization).
7. #157 linked-steps vs 28B Screen 3 sequential-standard-tag auto-linking (predates Build J; addendum L114 suggests standard_tags field OR subject-tag mapping layer — design at build).
8. #271 silent on portfolio items (not scoreable today; note only).

## F. Open questions (absorbed into packs)
1. PRD-19 prerequisite vs absorb (factory-ruled: prerequisite). 2. Defer on 0-rows data vs proceed (portfolio tab self-gates on subjects; family tab needs no homeschool data). 3. Route cleanup. 4. COPPA assertion depth. 5. SendToGrid redirect. 6. FK forward-ref handling. 7. Key backfill timing. 8. Bulk Summary dedicated EF (confirm). 9. **SDS Vault tool split-out** (28B Decisions 14-15 L914-916: free standalone pre-launch marketing asset + founder's personal need — Ruthie's SDS reporting).
