# PRD-31 Cross-PRD Impact Addendum

**Generated from:** PRD-31 (Subscription Tier System) session, March 22, 2026

---

## Summary of Changes

PRD-31 introduces the monetization engine for MyAIM Family. It modifies 3 existing tables, replaces 1 table, and creates 9 new tables. It changes the `useCanAccess()` hook from a single-boolean tier check to a three-layer access model with 6 role groups. It also enhances PRD-02's Permission Hub with tier-awareness.

**Key architectural change:** The `feature_access` table (PRD-01) is replaced by `feature_access_v2` with per-role-group tier thresholds instead of a single enabled/disabled boolean. This is the most structurally significant change — every call to `useCanAccess()` across all 38 PRDs now flows through the new three-layer access model.

---

## Impact Detail by PRD

### PRD-01 (Auth & Family Setup)

**Schema changes:**
- `subscription_tiers` table: add `price_yearly` (DECIMAL, NULL), `founding_discount` (DECIMAL), `monthly_ai_allotment` (INTEGER, default 99999), `features_summary` (TEXT[]), `sort_order` (INTEGER), `updated_at` (TIMESTAMPTZ).
- `family_subscriptions` table: add `stripe_customer_id` (TEXT), `stripe_subscription_id` (TEXT), `pending_tier_id` (UUID, NULL), `cancelled_at` (TIMESTAMPTZ, NULL), `past_due_since` (TIMESTAMPTZ, NULL).
- `families` table: add `founding_onboarding_complete` (BOOLEAN, default false), `founding_onboarding_grace_deadline` (TIMESTAMPTZ, NULL), `founding_family_lost_at` (TIMESTAMPTZ, NULL).
- `feature_access` table REPLACED by `feature_access_v2` with columns: `feature_key`, `role_group` (6 values), `min_tier` (5 values including 'never'). Unique constraint on (feature_key, role_group).

**Logic changes:**
- `handle_new_user()` trigger updated: also creates `onboarding_milestones` row for 'account_created' milestone and awards 5 AI credits (if not founding family).
- Seed data for `subscription_tiers`: 4 tiers with real pricing.
- Seed data for `feature_access_v2`: all feature keys × 6 role groups.

**Action needed:** Update migration files. Replace `feature_access` creation with `feature_access_v2`. Add new columns to existing tables. Update `handle_new_user()` function.

---

### PRD-02 (Permissions & Access Control)

**`useCanAccess()` hook rewrite:**
The existing implementation:
```
1. Get family tier
2. Check founding family (if true + active → return true)
3. Look up feature_access for (tier_id, featureKey)
4. Return enabled boolean
```

New implementation:
```
1. Get family tier
2. Check founding family (if true + active + onboarding complete → return true)
3. Determine member's role_group from role + dashboard_mode
4. Look up feature_access_v2 for (featureKey, role_group)
5. If min_tier = 'never' → return false
6. If family tier >= min_tier → check member_feature_toggles
7. If toggle is false → return false
8. Return true
```

**Permission Hub enhancement (new Screen 7 in PRD-31):**
- Added to Permission Hub: tier-aware feature toggle grid.
- Per-member columns × per-feature rows.
- Four cell states: enabled, disabled-by-mom, locked-by-tier, not-available.
- Tapping enabled feature expands to existing PRD-02 granular controls.
- New table `member_feature_toggles` for mom's per-member decisions.

**Action needed:** Rewrite `useCanAccess()` hook. Add Screen 7 to Permission Hub. Create `member_feature_toggles` table.

---

### PRD-04 (Shell Routing & Layouts)

**Upgrade prompt rendering:**
When `useCanAccess()` returns false for a feature the user navigates to, the shell needs to render an upgrade prompt instead of a blank wall or error. The upgrade prompt shows: feature name, which tier unlocks it, [See Plan Details] button → navigates to PRD-31 Screen 1.

If the user has AI credits, the prompt also includes: [Try with AI Actions] → opens PRD-31 Screen 6 (Tier-Sampling Modal).

**Action needed:** Add upgrade prompt component to shell feature-area fallback rendering. Ensure all routed features check `useCanAccess()` before rendering.

---

### PRD-05 (LiLa Core AI System)

**LiLa Help subscription FAQ:**
LiLa Help should handle billing and subscription questions using data from `family_subscriptions` and `subscription_tiers`. Pattern-matched FAQ entries for: current plan info, pricing, upgrade process, founding family status, credit balance, billing cycle dates.

**Action needed:** Add subscription FAQ patterns to Help mode's pattern library.

---

### PRD-05C (LiLa Optimizer)

**Schema consolidation:**
- `ai_usage_tracking` table (PRD-05C) is superseded. Per-optimization tracking now uses:
  - `ai_usage_log` (PRD-32) for cost tracking (already instrumented across all Edge Functions).
  - `ai_credits` ledger (PRD-31) for credit deduction on Sonnet-level operations.
- `ai_credit_balance` column on `families` table (PRD-05C) is replaced by ledger-based balance calculation from `ai_credits` table.

**Credit checking in optimization pipeline:**
Before any Sonnet-level Optimizer call:
1. Check `ai_credits` balance for family.
2. If balance > 0 → proceed, deduct 1 AI action from ledger after successful call.
3. If balance = 0 → show soft throttle message (PRD-05C already designed this UI).

The soft throttle message references the credit pack purchase option and upgrade path.

**Action needed:** Remove `ai_usage_tracking` table definition. Remove `ai_credit_balance` column. Wire credit balance check into the optimization pipeline Edge Function. Update usage thermometer data source to query `ai_credits` ledger.

---

### PRD-10 (Widgets, Trackers & Dashboard Layout)

**New widget type: Usage Thermometer**
Register "AI Actions This Month" as a widget in the widget template catalog. Small/medium sizes. Shows usage count, limit, progress bar, reset date, and [+ Get More] button.

**Action needed:** Add widget definition to `widget_templates` seed data.

---

### PRD-21A (AI Vault — Browse & Content Delivery)

**Tier-sampling integration:**
When a user attempts to launch a Vault tool that is above their tier:
1. `useCanAccess()` returns false.
2. Instead of the standard upgrade prompt, check if user has AI credits.
3. If credits available → show Tier-Sampling Modal (PRD-31 Screen 6).
4. If no credits → show standard upgrade prompt with option to purchase credits.

The `allowed_tiers` field on individual Vault items now references the `feature_access_v2` system rather than a separate per-item tier list. Admin sets tool-level access in the Tier Assignment screen.

**Action needed:** Wire tier-sampling modal into Vault tool launch flow. Ensure `useCanAccess()` is checked on tool launch.

---

### PRD-22 (Settings)

**Screen 10 replacement:**
Screen 10 (Subscription & Billing stub) is fully replaced by PRD-31 Screen 1 (Plan Comparison). The placeholder content and "will be available when tiers launch" message are replaced with the full subscription management interface.

**Action needed:** Replace Screen 10 stub content with PRD-31 Screen 1 implementation.

---

### PRD-24 (Gamification Overview & Foundation)

**New gamification event: Onboarding Milestone Completion**
When a user completes an onboarding milestone:
1. Celebration animation fires (brief, joyful — similar to Victory completion).
2. Credit award toast appears: "You earned 5 AI actions! [See what you can try →]"
3. If founding family: milestone tracked but no credit toast. Instead: "Founding milestone complete! [X of 10 done]"

**Action needed:** Register `onboarding_milestone_completed` as a gamification event type. Define celebration animation variant.

---

### PRD-25 (Guided Dashboard)

**Onboarding milestone progress display:**
The onboarding flow (PRD-25 defines milestone UX) tracks completion using PRD-31's `onboarding_milestones` table. Progress indicators show milestone count and credit earnings (or founding status progress for founding families).

**Action needed:** Wire milestone progress UI to query `onboarding_milestones` table. Display appropriate messaging based on founding vs. non-founding status.

---

### PRD-28B (Compliance & Progress Reporting)

**ESA invoice data pipe confirmed:**
The ESA Invoice Generator (PRD-28B Screen 4) pulls the subscription amount from `family_subscriptions`. For founding families, this is the founding rate stored in `founding_rate_monthly`, not the standard `price_monthly` from `subscription_tiers`. No schema changes needed to PRD-28B — the data pipe just needs to reference the correct field.

**Action needed:** Confirm invoice generator queries `family_subscriptions.founding_rate_monthly` (if not null) else `subscription_tiers.price_monthly`.

---

### PRD-29 (BigPlans)

**Friction Finder as onboarding milestone #9:**
Completing a friction diagnosis conversation triggers milestone completion:
1. Edge Function detects conversation type = 'bigplans_system' and conversation completed.
2. Checks `onboarding_milestones` for family — if 'friction_finder' not yet completed, creates the row.
3. Awards 5 AI credits (non-founding) or marks founding milestone (founding).

**Action needed:** Add milestone trigger to BigPlans system-design conversation completion flow.

---

### PRD-32 (Admin Console)

**New section: Tier Assignment**
PRD-31 Screen 4 (Tier Assignment) is added as a new section within the Admin Console. It can live under the existing System tab or as its own tab — admin tab registry supports either approach.

**Founding Family counter:**
Add a "Founding Families: X / 100" counter card to the System tab's overview section.

**Data dependencies:**
The Tier Assignment screen reads from `ai_usage_log` (avg cost per feature) and `platform_usage_log` (monthly usage count per feature). Both tables are already defined in PRD-32 and instrumented across all Edge Functions.

**Action needed:** Add Tier Assignment screen to admin console. Add founding counter to System tab. Ensure `ai_usage_log` and `platform_usage_log` aggregation queries are available for the tier assignment screen.

---

### PRD-32A (Demand Validation Engine)

**Creator tier Planned Expansion Cards:**
The Creator tier uses PRD-32A's `<PlannedExpansionCard>` components for features in development. Each card includes the standard Yes/No vote plus a freeform "What would you hope this includes?" input.

Suggested Creator-tier expansion cards to register in `feature_expansion_registry`:
- `creator_ai_branding` — "AI Branding Module"
- `creator_business_plans` — "Business Plan Builder"
- `creator_idea_validation` — "Business Idea Validator"
- `creator_workflow_design` — "Custom Business Workflow Designer"
- `creator_ai_training_tools` — "AI Training Content Creator"

**Action needed:** Register Creator-tier expansion features in `feature_expansion_registry.ts`. Ensure freeform input is included on these cards (may need a minor enhancement to the PlannedExpansionCard component — the current spec has freeform on "Yes" votes only; this should be sufficient).

---

### PRD-38 (Blog — Cookie Dough & Contingency Plans)

**Founding Family counter on public site:**
When the founding window is open (counter < 100), the blog's beta CTA block and/or a dedicated banner shows: "Only [X] founding family spots remaining."

**Pricing page data source:**
The `/pricing` stub (PRD-38) will use `subscription_tiers` table data to render pricing cards. Founding rates shown with "Save $X/mo forever" messaging when the founding window is open.

**Action needed:** Wire founding counter and pricing data to public routes when the pricing page is built.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-31 (Subscription Tier System) completed.
- 9 new tables: `feature_access_v2`, `feature_key_registry`, `member_feature_toggles`, `ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations`.
- 3 modified tables: `subscription_tiers`, `family_subscriptions`, `families`.
- 1 replaced table: `feature_access` → `feature_access_v2`.
- 1 superseded table: `ai_usage_tracking` (PRD-05C) → consolidated into `ai_credits` + `ai_usage_log`.
- `useCanAccess()` hook rewritten for three-layer access model.
- PRD-02 Permission Hub enhanced with tier-aware feature toggle grid.
- New Edge Functions: `stripe-webhook-handler`, `credit-balance-check`, `credit-expiration-sweep`.

**Action needed:**
- Move PRD-31 to completed list.
- Update table inventory with new/modified tables.
- Note `feature_access` → `feature_access_v2` migration.
- Note `ai_usage_tracking` consolidation.
- Note that all remaining PRDs reference the updated `useCanAccess()` hook.
- Update remaining PRDs count (PRD-34 ThoughtSift is the only remaining PRD).

---

*End of PRD-31 Cross-PRD Impact Addendum*
