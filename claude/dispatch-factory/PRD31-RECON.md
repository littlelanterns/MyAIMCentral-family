# PRD-31 Subscription Tier System — Recon Evidence Brief (Sonnet reader, 2026-07-04)

> Archived by the dispatch factory (condensed, all citations kept). Consumed by `PRD31.md`.

## A. Scope inventory (refs → `prds/scale-monetize/PRD-31-Subscription-Tier-System.md`)

1. Four tiers (L59-70): Essential $9.99/$7.99, Enhanced $16.99/$13.99, Full Magic $24.99/$20.99, Creator $39.99/$34.99; annual `price_yearly` NULL at launch (L84-88).
2. Three-layer access model (L92-147): L1 platform tier gating (`feature_access_v2`, 6 role groups) → L2 family toggles (`member_feature_toggles`) → L3 PRD-02 granular perms. Full `useCanAccess()` algorithm L128-146.
3. Screen 1 Plan Comparison (L152-233): Settings → Subscription & Billing (replaces PRD-22 Screen 10 stub); founding badge; AI thermometer; credit balance; Stripe Portal links; ESA invoice; cancel.
4. Screen 2 Credit Packs (L236-280): Starter 25/$1.99, Bundle 100/$4.99, Power 300/$12.99; admin-configurable `credit_packs`.
5. Screen 3 Cancellation (L282-311): 3-step, end-of-period, writes `subscription_cancellations`.
6. Screen 4 Tier Assignment admin grid (L315-386): role-group × feature-key grid w/ cost+usage columns from `ai_usage_log`/`platform_usage_log`; cycling dot selector (E→En→FM→C→✕).
7. Screen 5 Usage Thermometer widget (L388-417): beta shows "∞".
8. Screen 6 Tier-Sampling modal (L420-476): credit-spend to try above-tier features; `tier_sampling_costs`, `tier_sample_sessions`.
9. Screen 7 Permission Hub enhancement (L479-536): 4 cell states (enabled/disabled-by-mom/locked-by-tier/not-available), Quick Setup presets.
10. Founding Family Program (L539-582): 100 cap, two-stage activation (enroll → 10 milestones), 30-day grace post-beta, durability table, atomic counter, public counter.
11. AI Credits (L585-660): append-only `ai_credits` ledger; 4 sources; spending priority expiring-soonest→monthly→earned→purchased; allotment tuning table 30/100/300/500 (L610-616) w/ beta placeholder 99999 (L617); metering = Sonnet-level ONLY (L631-659).
12. Onboarding credits (L663-692): 10 milestones × 5 = 50, `onboarding_milestones`, 90-day expiry; founding families track milestones but earn zero credits.
13. Stripe (L696-736): Checkout, 5 webhook events via single `stripe-webhook-handler`, Portal, upgrade immediate/prorated, downgrade end-of-period.
14. Edge cases (L739-761): founding-spot race (atomic), negative balance allowed, mid-conversation downgrade finishes, free read-only post-cancel, ESA invoice uses founding rate.
15. Schema (L764-973): modify `subscription_tiers`/`family_subscriptions`/`families`; `feature_access` → `feature_access_v2`; 9 new tables incl. addendum's `permission_level_profiles`.
16. MVP checklist (L1055-1091): ~30 items incl. "All AI-calling Edge Functions instrumented to check/deduct credits."
17. Permission Matrix Addendum: layers only-restrict-never-expand (L8-52); Light/Balanced/Maximum profiles per role group (L56-256); `PermissionGate` `tierFallback`/`toggleFallback` (L259-309); pre-populated `member_feature_toggles` w/ `blocked_by_tier`+`applied_profile_level` (L392-419); access-check returns `{allowed, blockedBy, upgradeTier?}` (L423-465).
18. Cross-PRD Impact Addendum: action items for PRD-01/02/04/05/05C/10/21A/22/24/25/28B/29/32/32A/38.

## B. What exists (file:line, verdicts)

- `useCanAccess.ts:19-23` — hardcoded `return {allowed:true,...}`; comment says "restore the RPC check" but **no RPC check ever existed** — from-scratch build, not re-enable.
- `PermissionGate.tsx` — three-layer resolution + `tierFallback`/`toggleFallback` props EXIST (L79-110) but **zero call sites pass them** — dead code path; no upgrade prompt renders anywhere.
- `subscription_tiers` (4 rows, migration 000001:177-209) — `price_yearly` **NOT NULL and pre-populated** ($99.99/$169.99/$249.99/$399.99), contra PRD NULL-at-launch; `monthly_ai_allotment` seeded **100/300/750/2000** (matches neither 99999 placeholder nor 30/100/300/500 table); missing `description`; `name`/`slug` naming inversion vs PRD (functionally fine).
- `family_subscriptions` (2 rows) — `stripe_customer_id`, `stripe_subscription_id`, `pending_tier_id`, `cancelled_at`, `past_due_since` already present. **Missing: `is_founding_family` mirror, `founding_rate_monthly`, `founding_rate_yearly`** — locked founding rate has nowhere to live.
- `families` — `is_founding_family`, `founding_family_rates` JSONB (different shape than PRD's two DECIMAL columns), onboarding-complete/grace/lost columns all present (migration 000001:8-28). No UI consumes founding status (no badge component).
- `feature_access_v2` (362 rows) — **live shape: `minimum_tier_id UUID FK` + `is_enabled BOOLEAN`** (migration 000002:88-109; write pattern confirmed in 100260:55-58). PRD wants `min_tier TEXT` enum incl. `'never'`. **No explicit "never" representation exists.** Most consequential schema divergence.
- `feature_key_registry` (211 rows) — missing `category`, `is_lite_version`, `lite_version_of`.
- `member_feature_toggles` (24 rows) — **hybrid dual-generation schema**: original sparse-intent (`is_disabled` NOT NULL, `disabled_by` NOT NULL) + addendum pre-populated columns (`enabled`, `blocked_by_tier`, `applied_profile_level`); `apply_permission_profile()` (100260:100-103) DELETEs + re-INSERTs full row sets (pre-populated model), writing BOTH `is_disabled` AND `enabled`.
- `permission_level_profiles` (167 rows) — **addendum table already fully built + seeded** (earlier PRD-02 remediation).
- `useResolvedFeatureAccess.ts` — SECOND parallel Layer-2 mechanism (PERMISSIONS-WIRING 2026-06-09) for sidebar/nav; treats missing rows as role-default-enabled; needs `TOGGLE_KEY_ALIASES` bridge because sidebar vocabulary ≠ profile vocabulary. Comment: "when billing goes live, the tier check slots in here."
- **ABSENT entirely** (no table, no migration, no code): `ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations`, `ai_usage_log`, `platform_usage_log`.
- **Stripe:** deps in package.json (L30, L48) but **zero imports anywhere**; `.env.template:38-43` placeholders only; no webhook handler; no Edge Functions.
- **Metering:** `ai_usage_tracking` (679 rows) via `_shared/cost-logger.ts` `logAICost()`. **⚠ RECON ERROR, CORRECTED BY FACTORY 2026-07-04:** this brief originally claimed "4 of ~50 Edge Functions" instrumented. A direct factory grep found **38 Edge Functions import cost-logger** (lila-chat, all 13+ lila-* tools, task-breaker, ai-parse, mindsweep-*, bookshelf-*, etc.). Cost LOGGING is ~95% covered; what's missing for PRD-31 is the CREDIT layer (check/deduct + metered-vs-not-metered classification), which is a centralized change to the shared logger + call-site classification — NOT an instrumentation sweep.
- Admin shell: `AdminLayout.tsx` ADMIN_TABS (Approvals, Personas) — Tier Assignment tab is a clean drop-in; per-tab gating pattern exists but "not enforced."
- Settings Screen 1: pure PlannedExpansionCard stub (`feature_expansion_registry.ts:289-294`, `subscription_tiers` entry).
- `handle_new_user()` (000001:269-307): creates family + mom + essential/active subscription row; **zero founding-family logic, zero milestone creation, zero counter.**

## C. Schema gap table (condensed)

Missing tables: ai_credits, credit_packs, tier_sampling_costs, tier_sample_sessions, onboarding_milestones, subscription_cancellations, ai_usage_log, platform_usage_log (last two = PRD-32 deps for Screen 4).
Column gaps: subscription_tiers.description; family_subscriptions founding-rate columns; feature_key_registry category/lite-version columns.
Shape conflicts: feature_access_v2 (FK+bool vs TEXT enum w/ 'never'); families.founding_family_rates JSONB vs split DECIMALs; member_feature_toggles dual-generation.
Seed conflicts: price_yearly populated (PRD: NULL); monthly_ai_allotment 100/300/750/2000 (PRD: 99999 beta / 30-500 tuning).

## D. Wiring touchpoints

Waiting on PRD-31: every PermissionGate surface (beta bypass exit); UpgradeModal (STUB_REGISTRY:288 — deleted during /simplify, rebuild fresh); recalculate-tier-blocks EF (STUB_REGISTRY:92); BUILD_STATUS Phase 38 + Phase 41 (Tier Assignment Review); PRD-32 admin Tier tab; feature_expansion_registry subscription_tiers card retirement; PRD-28B ESA invoice founding-rate source; PRD-38 pricing page + founding counter; PRD-21A vault `allowed_tiers` unification.
PRD-31 depends on: ai_usage_log/platform_usage_log OR a decision to extend ai_usage_tracking; comprehensive cost-logging coverage (4/50 today); PRD-24 celebration event for milestone completion (absent); PRD-25 milestone UI (absent).

## E. Conflicts (named by recon)

1. **Sparse vs pre-populated `member_feature_toggles`** — CLAUDE.md convention + PRD body (L867) say sparse; PRD-31's own addendum (L479) says pre-populated; **production already implements pre-populated** via apply_permission_profile(). Three sources disagree; production committed.
2. **feature_access_v2 shape** — PRD TEXT-enum w/ 'never' vs live FK+boolean used by 2 shipped builds.
3. **price_yearly** populated contra PRD NULL-at-launch.
4. **monthly_ai_allotment** seeds match no documented decision.
5. **Two parallel Layer-2 implementations** (profiles/toggles vs useResolvedFeatureAccess) with diverged vocabularies bridged by TOGGLE_KEY_ALIASES.
6. Convention #256 tier chart: **no hardcoded tier checks exist anywhere** (grep clean) — greenfield, nothing to conflict, nothing to build on beyond the mismatched tables.
7. **Pricing: NO conflict** — CLAUDE.md table = PRD L63-68 = seeded data. All agree.
8. UpgradeModal deliberately deleted (/simplify) — design fresh against existing unused PermissionGate props.

## F. Open questions (absorbed into pack decisions)

1. feature_access_v2: migrate to PRD shape vs amend PRD to live shape + explicit 'never' semantics?
2. Sparse vs pre-populated: correct PRD+conventions to production reality?
3. price_yearly/allotment seeds: deliberate or drift?
4. ai_usage_log/platform_usage_log: build vs extend ai_usage_tracking vs stub Screen 4 columns?
5. Cost-logging retrofit (~46 EFs): in-scope slice or prerequisite pass?
6. Stripe dashboard-side state: anything configured outside the repo?
7. Founding enrollment purely post-webhook?
8. useResolvedFeatureAccess vs useCanAccess: deprecate or keep separate concerns?
