# PRD-32 + PRD-32A + PRD-21B — Recon Evidence Brief (Sonnet reader, 2026-07-04)

> Archived by the dispatch factory (condensed, citations kept). Consumed by `PRD32.md`.
> Factory verification note: this reader's "38 of ~40 Edge Functions use cost-logger" claim was
> CONFIRMED by direct grep (39 files incl. the shared module); the PRD-31 reader's "4 of ~50"
> was wrong and has been corrected in PRD31-RECON.md.

## A. Scope inventories

**PRD-21B (Vault Admin) — 8 screens:** Screen 0 admin shell (/admin, tab registry, staff_permissions gating, 3 hardcoded super-admin emails); S1 Vault Content Dashboard (status tabs, search/filter/sort, action menu, pagination); S2 adaptive Content Editor (6 content types, 9 sections, category inline-create, "Suggest with LiLa" metadata AI); S3 Prompt Pack Entry Manager (CRUD + drag-reorder, image uploads); S3B Curation Manager (drag-drop `vault_collection_items`); S4 Category Manager; S5 Content Request Queue (+ "Copy All Pending" Claude-export); S6 Content Analytics (+ Copy Report); S7 orphaned-Image Manager. Schema: `vault_items.last_published_at` (EXISTS in live schema); dedicated `vault-thumbnails`/`vault-prompt-images` buckets (superseded — see E7); permission types vault_admin etc.

**PRD-32 (Admin Console) — 13 screens:** S0 tab registry (System/Analytics/Feedback +); S1 Admin User Management (staff roster, per-tab permission checkboxes, optional expiry, soft-deactivate); S2 Users & Families (search, detail, disable/reset/note); S3 Safety Config (PRD-30 `safety_keywords`/`safety_resources` CRUD + BookShelf Ethics Review sub-tab); S4 Analytics Platform Overview; S5 Intelligence Review (12-channel queue; special handling Channels E/I); S6 AI Cost Monitoring; S7 Feedback Submissions Dashboard (Glitch/Feature/Praise/Flagged tabs, sentiment auto-flag); S8 Diagnostic Detail + "Copy for Claude Code" formatter; S9 Resolution + Known Issues library (hit counts); S10 user-facing Feedback FAB (3 quick actions, screenshot + console/nav buffers); S11 LiLa Help known-issues lookup before AI; S12 Settings feedback section; S13 (Wave 1B appendix) Personas approval tab. Schema: feedback_submissions, known_issues, reported_threats, admin_notes, ai_usage_log, platform_usage_log, feedback-attachments bucket; permission types system/analytics/feedback/persona_admin.

**PRD-32A (Demand Validation):** S1 `<PlannedExpansionCard>` (vote + note + change-answer-as-new-INSERT + View-As attribution); S2 admin Demand Validation Dashboard (per-feature %, role breakdown, notes, CSV export) as a Feedback-tab sub-view. Schema: `feature_demand_responses` + `feature_expansion_registry.ts` config.

## B. What exists (verdicts)

- **Admin shell PARTIAL:** `AdminLayout.tsx:19-22` ADMIN_TABS = Approvals + Personas only; `App.tsx:213-217` routes; `AdminGate.tsx` built-to-spec (friendly block card); `useIsAdmin.ts:11-19` two-layer check; `superAdmins.ts` 3 emails. `ApprovalsPlaceholder.tsx` = empty-state stub, currently orphaned.
- **Personas tab (S13): FULLY WIRED** — `PersonasAdminPage.tsx` (440 lines, 4-action set matching spec); RPCs in migration 100161:412-618 (approve/reject/defer/list, SECURITY DEFINER, persona_admin|super_admin gate); Edge Function proxy `lila-board-of-directors/index.ts:55-58,911-963`. **STUB_REGISTRY L355-356 stale** (persona half). Lens moderation half still UNSERVED.
- **PRD-32A: user side fully wired, admin side ZERO.** `PlannedExpansionCard.tsx` (452 lines) exceeds spec (Convention #31 three-section enhancement, dismissals table beyond spec, View-As attribution, INSERT-only history); registry file populated. **No admin page reads `feature_demand_responses` in aggregate — votes accumulate invisibly (write-only for the founder).**
- **Vault admin: entirely absent.** Zero admin CRUD; all 17 `vault_items` created via migration seeds (100043/100049/100057/100132) — every new Vault item today requires a hand-written migration. `ContentRequestForm.tsx` = user half only; no admin triage queue.
- **Feedback: built smaller + divergent.** `GlitchReporterFAB.tsx` (293 lines, feature-flagged, draggable, dom-to-image screenshot, Math Gate for Guided/Play) is GLITCH-ONLY (no feature-request/praise types); writes `beta_glitch_reports` (75 rows; 4 structured fields — RICHER than PRD's single freeform; no sentiment/submission_type/linked_known_issue/source columns). `.claude/skills/bug-reports/SKILL.md:11`: "There is no admin UI yet (that's PRD-32)" — triage happens via Claude Code skills + raw SQL. Known Issues library, LiLa Help DB lookup, Copy-for-Claude-Code formatter, sentiment auto-triage, reported_threats: NONE exist. help-patterns.ts (13 hardcoded FAQs) is a code-file cousin, not the admin-editable DB table.
- **AI cost: substantially solved under a different name.** `ai_usage_tracking` (679 rows, PRD-05 era) ≈ PRD-32's proposed `ai_usage_log`; cost-logger imported by 38 Edge Functions (factory-verified). NO admin dashboard reads it (S6 absent). `platform_usage_log` absent; `activity_log_entries` (323 rows) is a different shape, not a drop-in.
- **Intelligence Review: narrower architecture shipped.** Generic 12-channel `review_queue` never existed; Convention #258 shipped Channel-D-specific `persona_promotion_queue` (0 rows) + the Personas tab. Channels E-L have no queue tables. Ethics Review sub-tab not found in code — but `platform_intelligence.book_library.ethics_gate_status` column EXISTS (live schema) as a drainable data source.
- **Moderation tab (PRD-21C dependency): not built at all** (zero moderation_admin hits). PRD-38 Blog depends on it (blog PRD L528: held comments → Moderation tab "Blog Comments" filter) AND on PRD-21B's vault admin (blog mgmt = sub-section of Vault admin tab, L356). PRD-38 has zero code.

## C. Schema gaps

Missing: `feedback_submissions`, `known_issues`, `ai_usage_log` (functionally covered by ai_usage_tracking), `platform_usage_log`, `reported_threats` (never scaffolded), `admin_notes` (polymorphic), `staff_permissions.expires_at`, `staff_permissions.is_active` (Screen 1's soft-deactivate has no column; useIsAdmin can't filter is_active), `feedback-attachments` bucket, generic `review_queue`.
Present/ahead: `staff_permissions.permission_type` CHECK already registers all 6 PRD-32 types + persona_admin (DB ahead of UI); `vault_items.last_published_at`; `feature_demand_responses` (matches spec); `feature_expansion_dismissals` (beyond spec); `persona_promotion_queue`.
Diverged: dedicated vault buckets → path prefixes under unified `platform-assets` bucket + `platform_assets` table (622 rows).

## D. Wiring touchpoints

Waiting on this pack: STUB L355-356 lens-half (no drain); STUB L373-374 (cost drill-down, admin activity log — Post-MVP); STUB L645 (activity analytics); **PRD-38 hard-blocked** (needs Vault admin sub-section + Moderation tab); bug-reports/bug-triage-merge skills (stopgaps to retire/repoint); vault content growth (migration bottleneck); founder demand-data blindness.
Depends on: PRD-31 for credit/thermometer analytics tie-in (moot both ways today; **PRD-31 ruling D-PRD31-4 already decided: extend ai_usage_tracking, never build ai_usage_log**); staff_permissions completion; PRD-30 tables for S3 Safety Config (PRD-30 unbuilt, sequenced after SAFETY-BETA-GATE); PRD-23 ethics gate (column exists); PRD-34 Addendum §6 (implemented faithfully by 100161).

## E. Conflicts (named)

1. STUB_REGISTRY L355-356 factually stale (persona half wired; lens half still true).
2. STUB_REGISTRY L94 "Admin user management ✅ Wired Phase 39" is FALSE — only the bootstrap (hardcoded emails + useIsAdmin) exists; no roster UI; "Phase 39" appears nowhere else in repo.
3. Convention #258 forward note (PRD-32 L1373): Personas tab is provisional — future "Platform Knowledge Promotion" parent tab when Channel E (Book Knowledge) lands.
4. "Suggest with LiLa" admin metadata button = a THIRD AI category not named by Conventions #247/#248 (direct admin API call, not a guided mode, not a member-facing utility). PRD-21B's own addendum (L66-71) anticipated needing this classification.
5. staff_permissions vs member_permissions are cleanly separate systems (#273/#274 untouched); Admin Console has no sidebar presence BY DESIGN → Convention #16 parity N/A for /admin/*.
6. `ai_usage_log` vs `ai_usage_tracking`: building per spec would create a redundant second cost table + re-instrumentation; repoint Screen 6 at ai_usage_tracking (aligns with PRD-31 ruling D-PRD31-4).
7. Vault storage: PRD-21B's dedicated buckets superseded by unified platform-assets architecture (reference_manus_assets).
8. `curation` rename (tool_collection→curation): already landed at schema/convention level (Convention #81) — done deal.

## F. Open questions (absorbed into pack decisions)

1. Literal-spec build vs reconciliation-first repointing (ai_usage_tracking, extend beta_glitch_reports, platform-assets bucket)?
2. staff_permissions is_active/expires_at columns now?
3. Extend beta_glitch_reports into THE feedback table vs parallel feedback_submissions?
4. Which of the 12 intelligence channels matter for beta (only D has a queue; per-channel producer audit needed)?
5. Vault admin priority vs migration-seeding pain?
6. Minimal Moderation tab here (PRD-38 unblock) vs fully deferred?
