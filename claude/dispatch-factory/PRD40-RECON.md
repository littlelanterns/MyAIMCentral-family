# PRD-40 COPPA — Recon Evidence Brief (Sonnet reader, 2026-07-04)

> Archived verbatim by the dispatch factory. Consumed by `PRD40.md` (the pack). Build-time worker
> re-verifies file:line refs per the freshness preamble.

## A. PRD Scope Inventory (numbered, with line refs)

**Header/Status:** L1-6 — Status "Not Started." Dependencies list includes "PRD-41 (LiLa Runtime Ethics Enforcement — COPPA infrastructure prerequisite, not yet authored)" (L4).

**Key Decisions (7, pre-established):** L22-32 — (1) per-parent verification, (2) payment-as-verification, (3) two-table structure, (4) trigger fires only on first under-13 add, (5) consent UX separate from T&C, (6) mom is sole verifying parent, (7) Safe Harbor 13+ only / no under-13 transparency exemption.

**10 Screens (L58-529):**
1. Screen 1 — Consent Section 1/5 "What We Collect" (L60-124): full-screen modal, scroll-enforced, checkbox-gated, enumerates 8 data-collection bullets (name/age/PIN/avatar/tasks/feature entries/LiLa convos/Archives notes/photos), `[LAWYER REVIEW REQUIRED]` marker.
2. Screen 2 — Section 2/5 "How LiLa Uses This" (L126-144): AI-provider disclosure (Anthropic/OpenAI/OpenRouter no-training clauses), embeddings never shared, per-child AI disable option.
3. Screen 3 — Section 3/5 "Who Sees It" (L147-165): access model, no sale/no ad-sharing, named third-party processors (Supabase/Vercel/Stripe).
4. Screen 4 — Section 4/5 "Your Rights" (L169-186): view/export/edit/delete/revoke rights, 14-day grace period, contact info.
5. Screen 5 — Section 5/5 "Verify You're the Parent" (L190-253): parent affirmation checkbox + Stripe Elements $1.00 PaymentIntent (`metadata.purpose=coppa_verification`); success creates `parent_verifications` + `coppa_consents` rows + commits held `family_members`; failure logs `parent_verification_attempts`.
6. Screen 6 — Verification Success (L257-296): confirmation + email receipt with disclosure-text-version + timestamp.
7. Screen 7 — Additional-Child Acknowledgment (L299-339): lightweight modal, no charge, per-child `coppa_consents` row linked to existing `parent_verifications`; shown sequentially per child in a multi-child bulk add.
8. Screen 8 — Settings → Privacy & Consent (L342-407): verification history, per-child consent cards (Active/Revoked/Superseded), audit-replay of exact disclosure text via `consent_version`.
9. Screen 9 — Revocation Flow, 3 steps (L410-508): what-happens disclosure → type-child-name-to-confirm + optional reason → confirmation with 14-day deletion date + Undo Revocation.
10. Screen 10 — Admin Verification Log (L511-529): PRD-32-dependent, stubbed to `/admin/coppa` if admin console not ready; searchable/filterable compliance table.

**6 New Tables:**
11. `parent_verifications` (L561-589) — immutable audit; unique constraint one-active-per-parent; RLS mom-SELECT-own, service-role-INSERT-only, admin-SELECT-all, no UPDATE/DELETE by anyone.
12. `coppa_consents` (L591-628) — per-child, linked to verification; unique-active-per-child; mom can UPDATE only revocation fields; RLS mom-SELECT-own-family, admin-SELECT-all, no DELETE ever.
13. `coppa_consent_templates` (L631-656) — versioned disclosure text, `lawyer_approved_at` gate, immutable once published, retire-not-update.
14. `parent_verification_attempts` (L659-683) — every attempt incl. failures, rate-limiting basis (5/hr, 20/day).
15. `parental_data_exports` (L783-797, columns at L793) — audit table for data-export requests, 1/child/7-days rate limit, 7-day signed URL expiry.
16. `retention_deletion_log` (L860-879) — audit trail for rolling-retention deletions, admin-SELECT-only.

**Column/Enum Additions:**
17. `family_members.coppa_age_bracket` TEXT enum (`under_13`/`13_to_17`/`adult`) default `adult` NOT NULL (L687-691).
18. `family_members.is_suspended_for_deletion` BOOLEAN default false (L692).
19. `coppa_consents.deletion_completion_notes` JSONB (L609, L827).
20. 3 enums: `verification_method`, `coppa_age_bracket`, `verification_attempt_status` (L696-701, L1172-1176).

**Flows:**
21. Incoming flows table (L706-716): bulk-add save branch, manual-add save branch, member-edit age-bracket-change branch, 2 Stripe webhook events, daily scheduled-deletion job, daily age-transition trigger.
22. Outgoing flows table (L718-727): PRD-02 RLS extension on every child-scoped write policy, `useCoppaConsent()` hook, PRD-15 notifications, PRD-22 Settings entry, PRD-31 webhook extension, PRD-32 admin log.

**AI Integration boundary (L732-736):** Edge Functions making AI calls for an under-13 child must call `useCoppaConsent()` first; blocked if missing/revoked.

**Child Data Boundaries in LiLa Context Assembly (L740-776):**
23. Privacy Filtered role-asymmetric rule elevated to binding COPPA requirement (L744-752) — forward-note that the (then-current) implementation was an "unconditional strip," not role-asymmetric (owned by separate phase, not PRD-40).
24. Aggregation exclusion — under-13 rows never in platform-wide/cross-family/anonymized aggregation, named as binding constraint on PRD-19, PRD-28B, and the Platform Intelligence Pipeline (L754-765).
25. Runtime ethics enforcement — PRD-41 named as binding prerequisite for under-13 beta access (L767-775).

**Parental Access Rights (L779-827):**
26. Data export mechanism, JSON+README ZIP, 7-day signed URL, 1/child/7-days rate limit (L783-797).
27. Deletion = the revocation flow; no partial per-table deletion at launch (L799-804).
28. Cascade behavior table — 8 reference-type rules (hard-delete vs. scrub vs. preserve), with the sibling-data-preservation principle as the load-bearing rule (L806-827).

**Retention Policy (L831-879):**
29. Per-table retention limits: 90 days rolling (`lila_messages`/`lila_conversations`), 180 days rolling (task photos), indefinite-under-consent (tasks/victories/trackers/archive items), permanent (COPPA audit tables), 90-days-post-download (`parental_data_exports`) (L837-847).
30. 3 daily scheduled jobs: rolling retention sweep, consent-lifecycle sweep, storage cleanup (L850-856).

**Safe Harbor & Under-13 (L883-898):**
31. Safe Harbor gated on `coppa_age_bracket != 'under_13'` at DB access-gating + frontend entry points (moot while PRD-20 is backburnered).

**Dependencies & Prerequisites table (L902-913):** 6 rows — privacy-filter fix, PRD-41, RLS-VERIFICATION.md expansion, aggregation-exclusion convention, lawyer approval of consent templates, lawyer review of privacy policy.

**12 Edge Cases (L917-979):** bulk-add mixed ages; mom cancels mid-flow; Stripe succeeds/webhook fails (+ daily reconciliation job); card declined; re-verification after global revoke; revocation mid-LiLa-conversation; deletion cascade table list (10 items, L948-958); orphaned `lila_messages.safety_scanned` column (NOT adopted by PRD-40, owned by PRD-30); child ages into 13; undo-within-14-days; consent-template-retired-mid-flow; no-card-on-file.

**Tier Gating (L983-994):** COPPA is universal, never tier-gated; 2 new feature keys `coppa_consent_review`/`coppa_consent_revoke`, always return true.

**Stubs (L998-1013):** created — age-transition notification (console.log+email fallback until PRD-15), Admin Console Compliance tab (`/admin/coppa` fallback until PRD-32), multi-parent/custody (out of scope), `subscription_payment` verification method (post-beta).

**Cross-PRD Impact (L1017-1253):** retrofit-required on PRD-01 (schema+parsing+preview UI+save-action branching+manual-add form, L1021-1040) and PRD-02 (hook+RLS extension+enforcement layer+umbrella-consent doc+teen forward-note, L1042-1058); forward-requirements on PRD-31 (Stripe product+webhook extension+cancellation-doesn't-revoke+founding-family-independence, L1060-1076).

**"What Done Looks Like":** ~35 MVP checkbox items (L1082-1119), 3 dependency-gated (L1121-1125), 5 Post-MVP (L1127-1133). **CLAUDE.md additions:** 22 proposed conventions (L1139-1162) — none landed. **Schema doc additions:** 6 tables, 3 column adds, 3 enums, 6 triggers/crons (L1166-1185). **Decisions:** 28 decided (L1191-1222), 8 deferred (L1226-1235).

## B. Current Build Status

**Verdict: 100% unbuilt, re-confirmed live 2026-07-04.** Zero COPPA hits in src/, supabase/ (functions + migrations), STUB_REGISTRY, WIRING_STATUS, BUILD_STATUS, RLS-VERIFICATION. `FamilySetup.tsx` still inserts `family_members` directly (~L279) with no consent branch/held-state. **Zero Stripe code anywhere** — no webhook handler, no Edge Functions (grep "stripe" -i over supabase/functions → 0 hits). `account_deletions`/`process_expired_deletions()` (migration 100027) only flips `is_active=false` — no child-data cascade (SCOPE-8a.F2). One change since the April audit: a minimal Admin Console shell now exists (`src/pages/admin/AdminLayout.tsx`, 2-tab `ADMIN_TABS`) whose header comment explicitly reserves a "Wave 4 (COPPA)" row. Registered platform-wide as SCOPE-8a.F1 + F2, LOCKED Fix Now rows #1/#2 in `claude/web-sync/TRIAGE_WORKSHEET.md`.

## C. Schema Gaps

All 6 tables, both `family_members` columns, and all 3 enums: **absent** from `claude/live_schema.md` (verified against the reproduced 42-column family_members list). PRD-40 has no domain section in live_schema at all — the schema-dump `DOMAIN_ORDER` constant was never taught to expect its tables.

## D. Wiring Touchpoints

**Waiting on PRD-40:** PRD-01 add-flow branching; PRD-02 `useCoppaConsent()` + RLS extension; PRD-22 Settings Privacy & Consent entry; PRD-32 admin COPPA tab (reserved comment only); Platform Intelligence under-13 exclusion (pipeline active, no age filter possible — column doesn't exist); 22 proposed CLAUDE.md conventions.
**PRD-40 depends on:** PRD-01/02 (built, not COPPA-aware); PRD-13 Privacy Filtered — the role-asymmetric fix DID land 2026-04-17 per STUB_REGISTRY entry 629 (`applyPrivacyFilter` + `isPrimaryParent` helpers, RESTRICTIVE RLS migration 100149) — build-time worker re-verifies; PRD-31 Stripe (absent entirely — largest missing prerequisite after PRD-41); PRD-41 (being authored via SAFETY-BETA-GATE Slice D); PRD-32 (2-tab shell sufficient for a third tab).

## E. Cross-PRD References + Sequencing Statements

PRD-41 statements (verbatim locations): L4, L771, L773, L775, L909, L1118, L1158, L1217 (Decision 23), L1250 — consistent meaning: **PRD-41 must ship before any real under-13 user uses LiLa; PRD-40 does not duplicate its spec.**
Other sequencing: L910/L1252 (RLS-VERIFICATION expansion after PRD-40+PRD-30 tables, before Beta Readiness Gate); L912-913 (lawyer gates); L887-898 (Safe Harbor — backburnered).

**External corroborating docs:**
- `RECON_DECISIONS_RESOLVED.md` Decision 9 (L146-160): PRD-41 standalone; maps to Convention #247 Layer 1 (SAFETY-BETA-GATE Slice E).
- `RECON_DECISIONS_RESOLVED.md` L289 "PRD-40 in flight in parallel session Phase 0.35" = the AUTHORING session (complete — the PRD exists). No build session ever started.
- **`claude/web-sync/FIX_NOW_SEQUENCE.md` L517 — founder resolution 2026-04-21 (most important on record):** "COPPA framework builds in Wave 4 but first beta cohort is scoped to families with no children under 13. Framework ships dormant-but-built at beta launch. Second cohort opens after (a) lawyer review completes, (b) `lawyer_approved_at` populates on consent templates, (c) revocation cascade build completes." Narrows PRD-40 from "blocks all beta" to "blocks the under-13-inclusive second cohort."
- `FIX_NOW_SEQUENCE.md` L521, L560-565: SCOPE-8a.F1 LOCKED Fix Now, "Wave 4 (1 worker + 1 Wave-3-F8 coordinator)," bundled with PRD-31 Stripe webhook + PRD-32 console, founder-led scope.
- `MYAIM_GAMEPLAN_v2.2.md` L521 (Gate 4 exit: "COPPA fully wired before beta") — plausibly stale/superseded by the cohort-scoping resolution; never reconciled in-repo.
- PRD-40's position relative to the locked "PRD-41 → PRD-30" safety sequence is stated nowhere.

**Named conflicts (flagged, not resolved by recon):**
1. **Convention #39 `filterKidPrivate()` vs PRD-40 Key Decision 7 (L32) + Screen 4 (L176).** Shipped convention hides kid-private journal/self-knowledge/lila-conversation items from mom-via-View-As, keyed on origin, NOT age bracket. PRD-40: "full parent-visibility model applies to all under-13 LiLa interactions — no transparency exemption"; "Mom can view everything collected about [Child] at any time." Direct tension; needs founder ruling.
2. **Convention #273 two-door/shadow-account architecture entirely unaddressed by PRD-40** (authored 2026-04-16, pre-dates it). Screen 1 disclosure copy and the deletion-cascade registry (L945-958) know nothing of per-child shadow auth accounts, `ensure_pin_shadow_account` sessions, picture-password HMAC secrets, family-device resting sessions. Temporal/scope gap; PRD needs extension before/at build.
3. No-conflict confirmation: `dashboard_mode` remains readiness-based, never an age gate — PRD-40's L691 assumption holds.

## F. Open Questions surfaced by recon (absorbed into pack decisions D-PRD40-1..6)

1. Cohort framing: dormant-but-built vs blocks-all-beta (docs disagree).
2. Founder's own kids already exposed pre-consent-infra — accepted interim risk?
3. PRD-40 non-LiLa infrastructure independent of PRD-41 sequencing?
4. Standalone /prebuild-style build vs original Wave-4 bundling?
5. COPPA $1 charge as platform's first Stripe integration vs land with PRD-31?
6. Lawyer engagement status for `[LAWYER REVIEW REQUIRED]` copy?
7. Privacy-filter role-asymmetric fix landed? (Factory answer: yes per STUB_REGISTRY 629 — re-verify at build.)
8. `filterKidPrivate()` age-bracket awareness vs revisit Key Decision 7?
9. Amend PRD for two-door architecture before building?
10. Admin Screen 10 as simple third tab? (Factory answer: yes — shell exists, row reserved.)
