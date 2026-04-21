---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-31-Cross-PRD-Impact-Addendum.md (+ prds/addenda/PRD-31-Permission-Matrix-Addendum.md)
Bridged PRDs: PRD-31 (source) ↔ PRD-01, PRD-02, PRD-04, PRD-05, PRD-05C, PRD-10, PRD-21A, PRD-22, PRD-24, PRD-25, PRD-28B, PRD-29, PRD-32, PRD-32A, PRD-38 (14 cascading consumer PRDs)
Provenance: Worker `ad31d883677471ebe` (Opus, report-only mode) ran the full evidence pass in-memory across both PRD-31 addenda, the first 1100 lines of `PRD-31-Subscription-Tier-System.md`, the live `useCanAccess.ts` and `PermissionGate.tsx` implementations, the `usePermission.ts` hook, the `check_feature_access` RPC, all 196 feature key registry entries via grep counts, the `permission_level_profiles` seed migration, all 9 `useCanAccess()` consumer call sites, and the 7 `<PermissionGate>` consumer files. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Scope of this addendum's traversal: PRD-31 Cross-PRD Impact Addendum is the highest-leverage Scope 3+8b surface in the audit because it defines the subscription tier system that every built and unbuilt PRD depends on for feature gating. PRD-31 itself is `Status: Not Started` per its own header, but the addendum prescribes how PRD-31 will integrate with 14 existing PRDs (PRD-01, PRD-02, PRD-04, PRD-05, PRD-05C, PRD-10, PRD-21A, PRD-22, PRD-24, PRD-25, PRD-28B, PRD-29, PRD-32, PRD-32A, PRD-38) and the platform-wide `useCanAccess()` hook. I read both addenda in full (`PRD-31-Cross-PRD-Impact-Addendum.md`, `PRD-31-Permission-Matrix-Addendum.md`), the first 1100 lines of `PRD-31-Subscription-Tier-System.md`, the live `useCanAccess.ts` and `PermissionGate.tsx` implementations, the `usePermission.ts` hook, the `check_feature_access` RPC, all 196 feature key registry entries via grep counts from live schema, and the `permission_level_profiles` seed migration. I also walked the 9 `useCanAccess()` consumer call sites and the 7 `<PermissionGate>` consumer files.

The defining surprise: `useCanAccess()` is a 5-line hardcoded `return { allowed: true }` stub. The `check_feature_access` RPC exists in the database (migration `100028_prd02_repair.sql`) and implements the full three-layer check the addendum prescribes — but the client-side hook bypasses it entirely with the comment "BETA: All features unlocked. Convention #10 — useCanAccess returns true for everything." This means the entire three-layer gating cascade described in this addendum is **schema-only**: the tables exist (`feature_access_v2` 330 rows, `member_feature_toggles` 24 rows, `permission_level_profiles` 164 rows, `feature_key_registry` 196 rows) and the seed data is largely populated, but no production code path consumes any of it. This is consistent with Convention #10's beta-mode design — but it also means PRD-31's cross-PRD integration surface is presently a 100% Documented + Deferred-to-Gate-4 surface from a "wire-through" perspective, and a 50/50 Scope 3 vs Scope 8b surface from a "what's missing for post-beta" perspective. Server-side enforcement is entirely absent: no Edge Function checks subscription tier or AI credit balance before executing a Sonnet-level call. That is the watch-flag F11 hit.

A second surprise: `member_feature_toggles` has accumulated dual-state columns. The original PRD-02 migration created `is_disabled BOOLEAN DEFAULT true`. The PRD-31 addendum migration (`00000000000011_permissions_remediation.sql`) added `enabled BOOLEAN DEFAULT true` (the addendum spec name) without dropping `is_disabled`. The `check_feature_access` RPC handles both columns at line 95 with `OR` logic, but no surface has been consolidated and the dual-meaning columns are a maintenance trap.

A third surprise: PRD-31 spec says `min_tier TEXT` enum with values 'essential'/'enhanced'/'full_magic'/'creator'/'never', but the built `feature_access_v2` table uses `minimum_tier_id UUID REFERENCES subscription_tiers(id)` plus a separate `is_enabled BOOLEAN`. This is a structurally different schema with the same semantics. Documented-Update-PRD or Documented-Update-Schema decision required.

A fourth surprise: `permission_level_profiles` table exists with 164 seeded rows BUT zero `src/` consumers. PermissionHub.tsx never offers the Light/Balanced/Maximum profile picker described in the addendum. Profile-based onboarding entirely unbuilt.

A fifth surprise: 6 of the 9 PRD-31-prescribed new tables are missing from live schema entirely (`ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations`) — confirmed by `claude/live_schema.md` "DOMAIN_ORDER missing" annotations. PRD-31's monetization engine is unbuilt at the storage layer, which is consistent with its "Not Started" status — but the cross-PRD addendum already prescribes 14 integration seams against unbuilt infrastructure.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | `useCanAccess()` three-layer rewrite (PRD-02 §) | Cross-PRD Addendum lines 36-55: hook should query `feature_access_v2` + `member_feature_toggles` + founding override per Permission Matrix Addendum lines 425-466. Returns `{allowed, blockedBy, upgradeTier?}`. | `src/lib/permissions/useCanAccess.ts:19-23` is a hardcoded stub returning `{allowed: true, blockedBy: 'none', loading: false}`. Comment cites Convention #10. The `check_feature_access` SECURITY DEFINER RPC at `00000000100028_prd02_repair.sql:12-106` implements the full spec correctly but is never called by client. | Intentional-Document (per Convention #10) for client; Unintentional-Fix-Code post-beta for the lack of even a feature-flagged path back to the RPC | SCOPE-3.F (post-beta wire-up gap; beta acceptance is documented) | N |
| 2 | `useCanAccess()` accepts `memberId` | Permission Matrix Addendum lines 425-466 specifies signature `useCanAccess(featureKey, memberId?)` with role-group derivation per member | All 9 consumer call sites pass only `featureKey` (no memberId): `MindSweepCapture.tsx:99,100`, `Sidebar.tsx:463`, `TaskBreaker.tsx:45`, `TaskCard.tsx:205,206`, `TaskCreationModal.tsx:475`. Even when the hook returns real data post-beta, per-member toggles will be unreachable from these consumers. | Unintentional-Fix-Code | SCOPE-3.F | N |
| 3 | `<PermissionGate>` enhanced with `tierFallback`/`toggleFallback` | Permission Matrix Addendum lines 278-309 | `PermissionGate.tsx:13-17` correctly accepts both props. Resolution order matches spec at lines 49-63. **However**, only 7 files in `src/` use `<PermissionGate>` — with 196 feature keys registered, the gate is missing from ~95% of the platform's gateable surfaces. | Unintentional-Fix-Code (component is correctly built; consumers haven't adopted) | SCOPE-3.F | N |
| 4 | `feature_access_v2` schema (Cross-PRD Addendum line 27) | Cross-PRD Addendum line 23: "feature_access_v2 with columns: feature_key, role_group (6 values), min_tier (5 values including 'never'). Unique constraint on (feature_key, role_group)." | `00000000000002_permissions_access_control.sql:88-98` built `minimum_tier_id UUID REFERENCES subscription_tiers(id)` + separate `is_enabled BOOLEAN` instead of `min_tier TEXT` enum. The 'never' value is encoded as `is_enabled=false` instead of `min_tier='never'`. Same semantics, different shape. RPC accommodates the actual shape correctly. | Intentional-Document (UUID FK is arguably more normalized than text enum; PRDs need to align) | SCOPE-3.F (low severity — schema drift documented) | N |
| 5 | `feature_access_v2` role_group enum naming | Addendum spec uses singular `'mom', 'dad_adult', 'special_adult', 'independent_teen', 'guided_kid', 'play_kid'` | Built CHECK constraint at `00000000000002_permissions_access_control.sql:91-93` uses plural `'mom','dad_adults','special_adults','independent_teens','guided_kids','play_kids'`. RPC at `00000000100028_prd02_repair.sql:46-57` maps roles to plural form. The addendum text is internally inconsistent. The build picked plural. | Intentional-Document | SCOPE-3.F (cosmetic) | N |
| 6 | `member_feature_toggles` columns | Permission Matrix Addendum lines 392-419 specifies columns: `enabled BOOLEAN DEFAULT true`, `blocked_by_tier`, `applied_profile_level TEXT NULL`, `updated_at TIMESTAMPTZ`. Default is sparse — rows only exist when mom explicitly disables. | Original migration `00000000000002_permissions_access_control.sql:114-122` built `is_disabled BOOLEAN DEFAULT true`, `disabled_by UUID NOT NULL`. The remediation migration `00000000000011_permissions_remediation.sql:89-94` ADDED `enabled`, `blocked_by_tier`, `applied_profile_level`, `updated_at` without dropping `is_disabled`/`disabled_by`. Live schema confirms BOTH `is_disabled` AND `enabled` columns coexist. | Unintentional-Fix-Code (dual-state columns are a maintenance trap; one must be retired) | SCOPE-3.F | N |
| 7 | `permission_level_profiles` seeded with Light/Balanced/Maximum profiles | Permission Matrix Addendum lines 88-191: 3 levels × 5 role groups × N feature keys, populated as `permission_level_profiles` rows. Mom selects on member creation; system pre-populates `member_feature_toggles` AND `member_permissions`. | `00000000000012_permission_profiles.sql` creates table and seeds 164 rows (live schema confirms). **Zero src/ consumers** of the table. PermissionHub.tsx (3,000+ lines) never offers the Light/Balanced/Maximum picker. Bulk add flow (PRD-01) doesn't trigger profile selection. | Unintentional-Fix-Code (storage built, UI/wire-up missing) | SCOPE-3.F | N |
| 8 | `family_subscriptions` consumed by ANY src code path | PRD-31 §Founding Family Program + Cross-PRD Addendum lines 17-31: family_subscriptions tracks Stripe IDs, status, tier, founding info — read by upgrade prompts, ESA invoice, etc. | `Grep` for `family_subscriptions` returns **0 results in src/** and **0 in supabase/functions/**. Only migration files reference it. The table has 2 live rows but no application reads or writes them. The `check_feature_access` RPC reads it (line 42-44) but no caller invokes the RPC. | Unintentional-Fix-Code | SCOPE-3.F | N |
| 9 | Stripe webhook handler | PRD-31 §Stripe Integration line 712: single Edge Function `stripe-webhook-handler` processes 5 event types | Edge Function does NOT exist. `ls supabase/functions/` shows no `stripe-webhook-handler`. No Stripe SDK imports anywhere. Stripe references in `src/` are only calendar settings unrelated to billing. | Documented (PRD-31 itself "Not Started" — flagged as Deferred-to-Gate-4) | SCOPE-3.F (informational; PRD-31 unbuilt) | N |
| 10 | Founding family override semantics | Permission Matrix Addendum line 446-449: founding override active iff `is_founding_family AND status='active' AND founding_onboarding_complete=true`, bypasses Layer 1 only. | `check_feature_access` RPC at `00000000100028_prd02_repair.sql:60-61` implements PARTIAL check: `v_is_founding := COALESCE(v_family.is_founding_family, false) AND COALESCE(v_subscription.status, '') = 'active'`. **Missing the `founding_onboarding_complete = true` clause** specified by Permission Matrix Addendum line 449 and PRD-31 spec line 138. Allows founding-flagged but not-yet-onboarded families to skip tier gating prematurely. | Unintentional-Fix-Code (RPC drift from spec) | SCOPE-3.F (security-adjacent — could allow tier bypass for incomplete onboarders) | N |
| 11 | **Server-side tier enforcement in AI Edge Functions** | Cross-PRD Addendum line 88-104 PRD-05C; line 122-128 PRD-21A; PRD-31 §AI Credits System line 633: "deduction happens at the Edge Function level". Every Sonnet-level Edge Function should: check `ai_credits` balance → invoke AI → deduct credit → log to `ai_credits` ledger. Tier-locked features should refuse to run if user's tier doesn't include them OR consume credits for tier-sampling. | Surveyed all 47 Edge Functions in `supabase/functions/`. **ZERO of them check subscription tier, query `ai_credits`, or perform credit deduction.** Mentions of "tier" in Edge Functions are exclusively about AI model tier (Haiku vs Sonnet), not subscription tier. `lila-chat`, `lila-board-of-directors`, `lila-cyrano`, `lila-mediator`, etc. all execute Sonnet calls without any subscription-side check. **Watch-flag F11 hit confirmed.** | Documented + Defer-to-Gate-4 | **SCOPE-8b** primary + SCOPE-3.F cross-reference | **Y** (post-beta blocker; flagged for Beta Readiness index) |
| 12 | Tier-sampling modal | PRD-31 Screen 6, Cross-PRD Addendum lines 122-128 | `tier_sampling_costs` and `tier_sample_sessions` tables do not exist (DOMAIN_ORDER missing). No modal component. Vault `VaultContentCard.tsx:40` has stub: `const isLocked = false // Will be: !userTierIncludes(item.allowed_tiers)`. | Documented (PRD-31 unbuilt) | SCOPE-3.F | N |
| 13 | Upgrade prompt rendering on shell when feature blocked | Cross-PRD Addendum PRD-04 §, lines 70-77 | `PermissionGate.tsx:80-95` defines a default `<UpgradePrompt>` component with theme tokens. **However**, `Sidebar.tsx:463` hardcodes `tierLocked = false`, and only 7 pages wrap content in `<PermissionGate>`. Most pages have NO upgrade prompt path. There is no Plan Comparison screen (Screen 1) to navigate to. Settings page `placeholder/index.tsx:47` is a stub. | Documented | SCOPE-3.F | N |
| 14 | LiLa Help subscription FAQ | Cross-PRD Addendum PRD-05 §, lines 79-85 | `src/lib/ai/help-patterns.ts` has ONE subscription pattern: keywords include 'upgrade', 'downgrade', 'subscription', 'billing', 'payment', 'tier', 'plan', 'pricing', 'cancel', 'founding'. Response is generic informational text. **Does not query** `family_subscriptions` for current plan, balance, or billing date. The "data" is hardcoded in the response string. | Intentional-Document | SCOPE-3.F | N |
| 15 | `ai_usage_tracking` superseded by `ai_credits` + `ai_usage_log` | Cross-PRD Addendum lines 90-104 | `ai_usage_tracking` exists in live schema with **531 rows** of tracking data. Table NOT removed. `ai_credits` and `ai_usage_log` are both DOMAIN_ORDER missing. The supersession was prescribed but never executed. | Unintentional-Fix-Code (dropping `ai_usage_tracking` would lose 531 rows; need migration plan) | SCOPE-3.F | N |
| 16 | Permission Hub Screen 7 — tier-aware feature toggle grid | Cross-PRD Addendum PRD-02 §, lines 56-65; Permission Matrix Addendum lines 350-365 | `PermissionHub.tsx:421,549,569,574` writes to `member_feature_toggles` and `:642-648` reads `feature_access_v2` for tier-locked states. Some Screen 7 UI exists. **Missing**: Light/Balanced/Maximum profile picker, [Change Access Level] button, profile reset confirmation flow. The "···" not-available indicator and 🔒 tier-locked indicator described in addendum lines 360-366 not visually verified. | Unintentional-Fix-Code (partial implementation) | SCOPE-3.F | N |
| 17 | Onboarding milestone trigger from PRD-29 Friction Finder | Cross-PRD Addendum PRD-29 §, lines 173-180 | `onboarding_milestones` table not in live schema. PRD-29 is unbuilt. No BigPlans Edge Function exists. | Documented + Defer-to-Gate-4 | SCOPE-3.F | N |
| 18 | Onboarding milestone progress display on Guided Dashboard | Cross-PRD Addendum PRD-25 §, lines 153-159 | `GuidedDashboard.tsx` does not query `onboarding_milestones`. No milestone progress UI. | Documented (PRD-31 unbuilt) | SCOPE-3.F | N |
| 19 | ESA invoice subscription amount data pipe | Cross-PRD Addendum PRD-28B §, lines 162-167 | PRD-28B reporting infrastructure not built — confirmed by Scope 5 Finding A (per Round 0 Note: PRD-28B unbuilt). No ESA Invoice Generator code. | Documented (Defer-to-Gate-4 per Round 0) | SCOPE-3.F | N |
| 20 | Creator-tier PlannedExpansionCard registration | Cross-PRD Addendum PRD-32A §, lines 198-211: 5 Creator-tier cards registered with freeform "What would you hope this includes?" input. | `Grep` of `feature_expansion_registry.ts` for these keys returns ZERO matches. Cards not registered. | Unintentional-Fix-Code (cheap one-shot registration; addendum is explicit) | SCOPE-3.F (low) | N |
| 21 | Founding Family counter on public site | Cross-PRD Addendum PRD-38 §, lines 214-221: Blog beta CTA / banner shows "Only [X] founding family spots remaining" when counter < 100. | Public blog (PRD-38) shows blog-related routes only; pricing page is `/pricing` stub per PRD-38 description. No counter widget. | Documented (PRD-38 marketing surface unbuilt) | SCOPE-3.F | N |
| 22 | Usage Thermometer widget | Cross-PRD Addendum PRD-10 §, lines 108-114; PRD-31 Screen 5 | `widget_starter_configs` has 39 rows. Grep confirms: no usage thermometer template exists in src/. `ai_credits` ledger nonexistent so widget would have nothing to display. | Documented | SCOPE-3.F | N |
| 23 | Recalculate-tier-blocks Edge Function | Permission Matrix Addendum line 494 | Edge Function does NOT exist. Tier change handling depends on the Stripe webhook which also doesn't exist. | Documented | SCOPE-3.F | N |
| 24 | `subscription_tiers` table schema additions | Cross-PRD Addendum line 20 | Live schema confirms ALL columns added. ✓ Spec satisfied. | Documented (matches spec) | none | N |
| 25 | `family_subscriptions` schema additions | Cross-PRD Addendum line 21: Add `stripe_customer_id`, `stripe_subscription_id`, `pending_tier_id`, `cancelled_at`, `past_due_since`. | Live schema confirms 5 columns present. **Missing per PRD-31 line 792**: `is_founding_family`, `founding_rate_monthly`, `founding_rate_yearly` are NOT in live schema. | Unintentional-Fix-Code (founding rate columns missing — ESA invoice can't compute founding rate without them) | SCOPE-3.F | N |
| 26 | `families` table founding-onboarding columns | Cross-PRD Addendum line 22 | Live schema confirms all 3 columns present. ✓ | Documented (matches spec) | none | N |
| 27 | `pending_tier_id` downgrade scheduling | PRD-31 Stripe §, line 735 | Column exists. Zero code path reads it. No downgrade indicator UI. Stripe webhook to set it doesn't exist. | Documented | SCOPE-3.F | N |
| 28 | `auth_family_setup` `handle_new_user()` enhancement | Cross-PRD Addendum PRD-01 §, line 26: Trigger creates `onboarding_milestones` row for 'account_created' AND awards 5 AI credits (if not founding). | `Grep` for `onboarding_milestones` in `00000000000001_auth_family_setup.sql` returns zero hits. `handle_new_user` doesn't seed milestones. | Documented | SCOPE-3.F | N |
| 29 | PRD-22 Settings Screen 10 replacement by PRD-31 Screen 1 | Cross-PRD Addendum PRD-22 §, lines 132-137 | Settings page is a placeholder per `src/pages/placeholder/index.tsx:47`. Subscription & Billing screen does not exist. | Documented | SCOPE-3.F | N |
| 30 | Convention #10 beta override coverage | CLAUDE.md #10: "During beta, useCanAccess returns true for everything." | `useCanAccess.ts:19-23` correctly enforces this for Layer 1+2. **However**, Layer 3 (`usePermission` for role-based per-member access in `usePermission.ts`) does NOT short-circuit during beta — it queries `member_permissions` real-time. Beta dad with no `member_permissions` rows still sees deny. | Documented (matches Convention #10 wording but Convention #10 may need clarification) | SCOPE-3.F (cosmetic/documentation) | N |

## Unexpected findings list

1. **Dual-state column drift on `member_feature_toggles`** — `is_disabled` (legacy) and `enabled` (addendum-prescribed) coexist with **opposite defaults**. Captured as Seam 6.
2. **`is_founding_family` mirror column on `family_subscriptions` not built** — PRD-31 line 792 specifies the column. Live schema does not have it.
3. **`founding_rate_monthly` and `founding_rate_yearly` missing from `family_subscriptions`** — PRD-31 lines 793-794 specify them; live schema does not include them. ESA invoice cannot pull "founding rate" without these. Captured as Seam 25.
4. **Internal addendum inconsistency on `tier_id` vs `min_tier`** — Cross-PRD Addendum self-references both keys for `feature_access_v2`. The RPC ignored the addendum and used UUIDs for both. Documented under Seam 4.
5. **`tier_sampling_costs` defaulted but every feature key would need a row** — PRD-31 line 924 specifies `credit_cost INTEGER DEFAULT 5`; addendum doesn't address whether absent rows fall back to 5 or to "feature isn't sampleable."
6. **`subscription_cancellations` has empty seed and zero callers** — PRD-31 prescribes capturing cancellation feedback but the table is missing from live schema entirely.
7. **Edge Function survey reveals zero subscription-aware code paths anywhere on the server** — even `ai_usage_tracking` (the 531 logged rows) has no per-family monthly aggregation Edge Function, no cron job to expire credits, no enforcement of monthly allotment. Captured as Seam 11.
8. **`useCanAccess` consumers do not call with `memberId`** — Captured as Seam 2. Means the per-member toggle architecture has zero in-app surface, even before considering the hook stub.
9. **Convention #10 wording vs Layer 3 behavior mismatch** — Captured as Seam 30.
10. **`feature_key_registry` has 196 rows, but only 9 `useCanAccess()` call sites and 7 `<PermissionGate>` wrappers exist** — meaning ~190 feature keys are seeded into the registry without any consumer linkage.

## Proposed consolidation

### §5.1 Within-addendum recommendations

**SCOPE-3 design findings:**
- **F-A: useCanAccess + PermissionGate adoption gap** — Consolidates Seams 1, 2, 3, 13, 16, 30. Hook stubbed, consumers don't pass memberId, gate barely used, upgrade prompt path incomplete.
- **F-B: Permission level profiles built but not surfaced** — Seam 7 alone (load-bearing enough; 164 seeded rows of dead data).
- **F-C: feature_access_v2 schema drift from PRD spec** — Consolidates Seams 4, 5, 6.
- **F-D: PRD-31 monetization engine entirely unbuilt at server layer** — Consolidates Seams 8, 9, 11, 12, 15, 17, 18, 19, 20, 21, 22, 23, 27, 28, 29. Essentially a Defer-to-Gate-4 finding.
- **F-E: Founding override missing onboarding-complete clause in RPC** — Seam 10 alone. Small but security-adjacent.
- **F-F: Founding rate columns missing from family_subscriptions** — Seam 25 alone. Small schema gap that blocks PRD-28B integration.

**SCOPE-8b safety/integration findings:**
- **F-G (paired with F-D): Server-side tier enforcement absent in all 47 Edge Functions** — Seam 11 elevated to Scope 8b. Without this, monetization can be bypassed via direct API calls AND child-data tier gating is purely client-side. **Beta Readiness flag: Y.** This is the single Beta-blocker finding for PRD-31.

After consolidation: **6 SCOPE-3 findings + 1 SCOPE-8b finding = 7 findings total.**

### §5.2 Cross-addendum candidates flagged for orchestrator

- **The "PermissionGate adoption gap" pattern** likely repeats across PRD-15, PRD-21A, PRD-23, etc. — every PRD prescribing a feature key but whose UI doesn't actually wrap with `<PermissionGate>`.
- **The "server-side tier enforcement gap" pattern** (F-G) is platform-wide. Each Edge Function in the audit will need this finding cross-referenced.
- **The "PRD-X-unbuilt cascading from PRD-31 unbuilt" pattern** — PRD-22 Screen 10 stub, PRD-32 Tier Assignment screen, PRD-29 Friction Finder, PRD-25 milestone display, PRD-28B ESA invoice founding rate, PRD-38 founding counter all collapse to "PRD-31 not built ⇒ cross-PRD seams non-evaluable."

### §5.3 Do NOT consolidate

F-D (Scope 3 design parent) and F-G (Scope 8b safety primary) stay separate per PLAN §2.2. F-G carries the Beta Readiness flag; F-D does not.

## Proposed finding split

- **SCOPE-8b primary count:** 1 (F-G)
- **SCOPE-3-only count:** 5 (F-A, F-B, F-C, F-E, F-F) + 1 cross-reference (F-D)
- **Documented (no finding):** 0
- **Provisional:** 0

After consolidation: **7 total findings (6 SCOPE-3 + 1 SCOPE-8b).** Cardinality matches PLAN §2 expectation.

## Beta Y candidates

1. **F-G — Server-side subscription tier enforcement absent in all AI Edge Functions.** Rationale: Scope 8b finding by definition (touches monetization integrity AND child-data tier protection AND HITM bypass surface — a teen/adult could trigger any Sonnet-level tool via direct API call regardless of `useCanAccess` client check). Per Standing Rule 1, Scope 8b default is Y. **The ONE Beta blocker for PRD-31 cross-PRD integration.**

All other findings (F-A through F-F) default to N because they are post-beta wire-up debt — Convention #10's "all features unlocked during beta" makes the missing client-side gating not a beta-time issue. They become Y candidates the moment Convention #10 flips off.

## Top 3 surprises

1. **`useCanAccess()` is a 5-line `return true` stub but `check_feature_access` SECURITY DEFINER RPC implementing the full three-layer spec exists and works.** The infrastructure for tier gating is 80% built — it's just bypassed by the client hook with a Convention #10 comment. When PRD-31 ships, the work is "delete the stub, paste the RPC call back in."
2. **`permission_level_profiles` has 164 seeded rows of Light/Balanced/Maximum profile data and is NEVER read by any `src/` file.** PermissionHub page is 3,000+ lines but never offers the profile picker the addendum explicitly designs.
3. **Server-side tier enforcement gap is total across all 47 Edge Functions.** Zero check `family_subscriptions` or `ai_credits`. All 47 Edge Functions execute regardless of subscription tier or credit balance. Single highest-leverage finding from this surface.

## Watch-flag hits

- **F11 — server-side per-tool-per-person enforcement:** **HIT.** Captured as Seam 11 / Finding F-G. Server-side enforcement absent across all Edge Functions. **Beta Y.**
- **Crisis Override duplication:** Not applicable to PRD-31 surface.
- **F17 — PRD-08 messaging behavior-vs-intent:** Not applicable.
- **F22+F23 — PRD-19 reports × archive column drift:** Not applicable.
- **studio_queue handoff `source` discipline:** Not applicable to PRD-31 surface.
- **`is_included_in_ai` three-tier propagation:** Not applicable.

Additional new watch-flag worth raising:
- **dual-state column trap on `member_feature_toggles`** — `is_disabled` and `enabled` both present with opposite defaults. Worth elevating to a standing watch-flag for orchestrator to look for in subsequent addenda where remediation migrations added columns without dropping originals.

## Orchestrator adjudication

(empty — pending walk-through)
