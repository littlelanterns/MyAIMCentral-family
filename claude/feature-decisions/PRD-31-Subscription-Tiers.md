# PRD-31 — Subscription Tier System — Feature Decisions

> **Status:** Pre-build audit COMPLETE + **FOUNDER-APPROVED 2026-07-08** (summary approved; OD-31-A..D all resolved + the three chart default rules approved — verbatim resolutions in §4). Slice-1 dispatch prompt READY in the active build file — **NOT dispatched; the coordination seat sequences it.** No code written, no migrations.
> **Tier chart is a LIVING DRAFT until flip time** (founder's beta strategy): the approved A-principle + D-move + default rules are encodable now; her cell-level markup lands on her schedule and flows in via seed updates or the Screen-4 admin grid once built.
> Authority chain: `prds/scale-monetize/PRD-31-Subscription-Tier-System.md` (the PRD) → `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` + `PRD-31-Cross-PRD-Impact-Addendum.md` → `claude/dispatch-factory/PRD31.md` (approved pack, rulings 1–9; D-PRD31-1..7 RESOLVED 2026-07-04, D-PRD31-5 = GREENFIELD Stripe) → `claude/dispatch-factory/PRD31-RECON.md` (evidence) → `claude/feature-decisions/PRD-40-COPPA-Compliance.md` §3 (THE Stripe boundary — cited, not redrawn) → THIS FILE (freshness rulings, newer wins) → the active build file (`.claude/rules/current-builds/PRD-31-subscriptions.md`, slice plan + dispatch prompts).
> Where this file and the PRD text disagree, this file wins — every divergence is a named, dated ruling below.
> **Companion deliverable:** `claude/feature-decisions/PRD-31-Tier-Chart-DRAFT.md` — the founder-markup tier chart (Convention #256's human-readable form), built from the live 390-row `feature_access_v2` seed set.

---

## 1. Verdict re-confirmed (2026-07-08 freshness pass — live code + live DB)

- **Stripe: still 0% built, GREENFIELD confirmed** (D-PRD31-5). Zero Stripe imports; deps in package.json only; `.env.template` placeholders. PRD-40's Stripe foundation (which would be PRD-31 Slice 2's base) is **NOT yet dispatched** — PRD-40 sits at pre-build-approved, Slice 1 holding for the coordination seat.
- **`useCanAccess()` is still the hardcoded Convention #10 stub** (`src/lib/permissions/useCanAccess.ts:19-23`, returns `{allowed:true, blockedBy:'none', loading:false}`). The type signature ALREADY matches the addendum's `{allowed, blockedBy, upgradeTier?, loading}` shape — the rebuild is internals-only, no caller migration.
- **`PermissionGate` three-layer resolution + `tierFallback`/`toggleFallback` props exist with zero call sites passing them** — confirmed; 8 pages mount `<PermissionGate>` today (SettingsPage, MeetingsPage, BookShelfPage, 5 Archives pages).
- **Credits/metering: 0% built.** All 6 credit-side tables absent (`ai_credits`, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations`). `ai_usage_tracking` live (709 rows) fed by `_shared/cost-logger.ts` `logAICost()` — fire-and-forget, no check/deduct path. D-PRD31-4/-7 hold: the credit layer extends THIS pipeline; PRD-32's `ai_usage_log`/`platform_usage_log` are never built.
- **Access-layer live counts (2026-07-08 direct query):** `feature_access_v2` **390 rows** (was 362 at recon), `feature_key_registry` **222** (was 211), `permission_level_profiles` **173** (was 167), `member_feature_toggles` 24. The seed set keeps growing build-by-build — one more reason the chart is derived live, not from migrations.
- **SAFETY-BETA-GATE C/B/A + Slice E: DEPLOYED** (commits `4b86cb0`, `3faac3a`). The pack's Slice-3 sequencing constraint ("after SAFETY-BETA-GATE deploys — same ~50 files") is **now satisfied**. New since the pack: **NOTRAIN-HARDEN** (`0df6de7`) routed all 48 AI call sites through a shared OpenRouter client — a second natural choke point the Slice-3 worker weighs against cost-logger for the deduct hook.
- **`subscription_tiers` seeds re-confirmed:** allotments 100/300/750/2000, `price_yearly` populated ($99.99–$399.99), `founding_discount` 2/3/4/5 ✓ (matches PRD). D-PRD31-3 holds: monthly-only UI; allotment numbers re-decided by the founder at Slice 0; thermometer shows "∞" during beta.
- **`family_subscriptions` still missing the founding-rate columns** (`founding_rate_monthly`/`_yearly`, `is_founding_family` mirror) — live_schema confirms. `families` founding columns all present. `handle_new_user()` has zero founding/milestone/counter logic (recon-verified; unchanged).

## 2. Freshness rulings (2026-07-08, newer wins — binding on the build)

### R31-1. Live `role_group` vocabulary is canonical: the PLURALIZED values
Live `feature_access_v2.role_group` values are `mom, dad_adults, special_adults, independent_teens, guided_kids, play_kids` — NOT the PRD's singular enum (`dad_adult`, `special_adult`, …). 390 production rows + two shipped builds write the plural forms. Ruling: **plural values are canonical**; the PRD text is amended at close-out; `useCanAccess()`'s role-group mapper and every new seed uses the plural forms. Same logic as D-PRD31-1 (never migrate production vocabulary to match a doc).

### R31-2. The 'never' representation is EXPLICIT rows; today ZERO exist — absence means not-yet-assigned
All 390 live rows are `is_enabled=true`. The D-PRD31-1 semantics ("row with `is_enabled=false` = Never; absent row = not-yet-assigned") is therefore pure convention today with no data exercising it. Binding consequences: (a) Slice 1 documents the semantics in code + chart; (b) the **activation default for absent rows is UNGATED (allowed)** — flipping the switch must never silently remove a feature because a seed row was missing (proposed as Rule 1 of the chart, founder approves); (c) Screen 4's ✕ cell writes `is_enabled=false`, never deletes rows.

### R31-3. Seed-data repairs are Slice-1 scope, founder-visible
Live query found: **45 rows with NULL `minimum_tier_id`** (coloring_reveal ×12, gamification_earning_modes ×6, task_segments ×6, lists/studio/vault stragglers ×21), **3 unregistered keys carrying live rows** (`meal_planning`, `quicktasks`, `smart_notepad`), and **4 duplicate/near-duplicate key pairs** (`smart_notepad`↔`notepad_basic`, `duration_tracking`↔`task_duration_tracking`, `tasks_teen_studio`↔`studio_teen_access`, `tasks_pomodoro`↔`timer_advanced`) plus a display-name collision (`task_assignment` grant key vs `tasks_family_assignment`). All repairs + merge directions are itemized in the DRAFT chart §N; Slice 1 executes them in one idempotent migration after founder markup.

### R31-4. Management-grant keys compose with tiers as AND — tier never grants
`financial_tracking`, `studio`, `reward_rules`, `task_assignment`, `gift_planning`, `meal_planning` are Convention #274/#276 explicit-grant keys that ALSO appear in `feature_access_v2`. Ruling: the tier decides whether the grant SYSTEM is available to the family; the mom-issued grant decides whether a specific adult has it; `useCanAccess()` returning allowed for a grant key never substitutes for `useViewableMembers`/`util.finance_grant_level()`/`util.task_assign_allowed()` checks. Slice 4 adds a code comment at the gate + the chart §M documents it. (Founder confirms the composition rule via chart approval — OD-31-B.)

### R31-5. Points ≠ AI credits — the PECON firewall
Since the pack, the point economy shipped (Conventions #280/#281: `point_transactions` ledger, `record_point_transaction()`, Reward Shop). AI credits (`ai_credits`, "AI actions") are a SEPARATE economy. Binding rules: (a) `ai_credits` never flows through `record_point_transaction()` and vice versa — two ledgers, two choke points, zero shared rows; (b) UI vocabulary: credits are always "AI actions," never "points"; the thermometer and credit balance NEVER render inside kid-facing reward surfaces (My Rewards, Play shelf, Prize Board kid views); (c) kid role groups never see credit balances or purchase surfaces — credits are mom's (Screen 1/2 are mom-only per the PRD); (d) grep-verify at close-out: no file imports from both economies' write paths. Verified clean today (zero "credit" hits in `src/components/rewards`).

### R31-6. Metering hook placement: cost-logger is the accounting spine; the shared OpenRouter client is the enforcement point candidate
D-PRD31-7 scoped the credit layer as an extension of `_shared/cost-logger.ts` (38 importers). NOTRAIN-HARDEN (2026-07-07) added `_shared/openrouter.ts` — ALL 48 AI call sites now route through one client. Ruling: the Slice-3 worker builds the check/deduct as a shared module callable from EITHER choke point, decides the exact wiring in-session, and must (a) preserve cost-logger's fire-and-forget logging unchanged, (b) make the deduct fail-open during beta (a metering outage must never block an AI feature while the switch is off), (c) classify every call site metered/not-metered per the PRD's counted list — Haiku/embeddings/Whisper NEVER metered, (d) not touch the `model-id-guard` grandfathered pricing row without updating that test's list.

### R31-7. Admin tab position is dynamic; staff permission type extends the CHECK
`ADMIN_TABS` today: Approvals, Personas, Ethics Patterns (3 rows). PRD-40 claims the 4th (COPPA) whenever it builds. Ruling: Tier Assignment takes the NEXT free row at build time with `permissionType: 'tier_admin'`, and the same migration extends the `staff_permissions.permission_type` CHECK (the SM-B lesson — the CHECK rejects unregistered types).

### R31-8. Email is NOT a dependency for PRD-31 MVP
The platform still has no outbound email (PRD-30's email delivery stub: founder "not ready" 2026-07-08 — needs Resend key + DNS). PRD-31's touchpoints survive without it: past-due + credit-expiry warnings are in-app `notifications` rows (PRD-15, live); Stripe sends payment receipts/dunning emails natively from its own infrastructure; automated dunning sequences are Post-MVP per the PRD. Nothing queues behind the shared sender.

### R31-9. Tier-gating semantics doc: every key names WHOSE access it checks
Chart review surfaced a recurring ambiguity: keys like `messaging_coaching` (configured by mom, fires on kids), `allowance_basic` (configured by mom, pays kids), `reward_reveals_basic` (authored by mom, seen by kids), `tasks_routines`/`linked_routine_steps` (authored by adults, rendered by kids). Ruling: Slice 1 adds a one-line `access_semantics` note per ambiguous key in `feature_key_registry.description` ("gates configuration by the checking member," etc.), and `useCanAccess` call sites always pass the ACTING member. Kids experiencing mom-authored content is never gated by the kid's own row.

### R31-10. Safety keys get a policy review before the switch flips
`safety_monitoring_basic` (En) / `safety_monitoring_ai` (FM) are the exact keys `safety-classify`'s `TIER_GATE_ENABLED` reads when Slice 4 wires it. Tier-gating child-safety monitoring is a VALUES decision, not just pricing — flagged in the chart (§I) for explicit founder confirmation. Non-negotiables preserved regardless: Crisis Override (Convention #7) is global and never gated; safety notifications' DND bypass (#143/#282) unchanged; `lila_ethics_log` and `teen_transparency_panel` (disclosure surfaces) are recommended NEVER-gated.

### R31-11. Beta-bypass exit is a REGISTRY, not a folklore list
The founder-required enumeration of every surface the `useCanAccess()` beta-bypass exit touches lives in the active build file (§Beta-Bypass Exit Registry) and becomes Slice 4's checklist + Slice 7's probe list. Any NEW beta-bypassed surface added by parallel builds between now and Slice 4 MUST register there (the PRD-30 precedent: `safety-classify` registered its `TIER_GATE_ENABLED` stub in STUB_REGISTRY — that's the pattern).

### R31-12. The Stripe boundary is PRD-40 §3, verbatim
No redraw. PRD-31 Slice 2: subscription products/prices/Checkout/Customer Portal; registers its 5 subscription events in the SAME purpose-routed `stripe-webhook-handler`; owns `family_subscriptions` lifecycle; looks up existing customers via `parent_verifications.stripe_customer_id` before creating new ones. **Sequencing (both orders pre-authorized by pack ruling 7 + PRD-40 §3):** if PRD-40 Slice 2 lands first, PRD-31 extends its router; if PRD-31 Slice 2 goes first, IT builds `_shared/stripe.ts` + the router + `stripe_webhook_events` dedup table exactly per the §3 contract and PRD-40 extends. The coordination seat picks the order; the contract makes either safe. One handler, one client module, either way.

## 3. What the two access layers become (D-PRD31-6 made concrete)

- **`useCanAccess(featureKey, memberId?)`** — the canonical GATE. Rebuilt internals per the addendum's algorithm (founding override → plural role-group mapping → `feature_access_v2` FK+boolean lookup with `is_enabled=false`=Never → `member_feature_toggles`), returning the existing `{allowed, blockedBy, upgradeTier?, loading}` shape. Behind the activation switch: while `tier_gating` layer is OFF it returns the beta constant (today's behavior, now switchable instead of hardcoded).
- **`useResolvedFeatureAccess(member)`** — remains the NAV-VISIBILITY layer. Its documented tier-check slot (`useResolvedFeatureAccess.ts:94`) starts consulting the same Layer-1 primitive, returning `{enabled:false, source:'tier_lock'}`; Sidebar/BottomNav/ViewAsModal parity is automatic (all three consume `getSidebarSections` options).
- **`TOGGLE_KEY_ALIASES` retirement:** the 9-entry alias map dies when the tier chart's single vocabulary lands — sidebar featureKeys are renamed to registry keys (or registry rows added) so `toToggleKey()` becomes identity, then is deleted. Chart §N is the vocabulary source.
- **Permission Hub Screen 7:** 4-state cells (enabled / disabled-by-mom / 🔒 tier / ··· never) READ `blocked_by_tier` + the chart; `keyWiringStatus.ts` gains the tier dimension so the Hub never claims a tier lock it can't enforce.

## 4. Founder decisions OD-31-A..D + chart default rules — **✅ ALL RESOLVED (founder, 2026-07-08)**

Founder verbatim: A — "Approved as recommended: keep the Essential-is-mom-only story; non-mom Essential cells become Enhanced; I'll mark exceptions during my chart markup (which happens on my schedule — the chart is a living draft until flip time, per my beta strategy)." B — "Approved as written: tier changes never auto-grant or auto-revoke anything I granted; grants stay mine." C — "Defer the AI-action numbers to flip time, decided from real usage data." D — "Move safety_monitoring_basic (keyword layer) DOWN to Essential — basic 'mom knows' is floor-level safety, not a premium. The AI layer (classification, starters, digests) stays premium as proposed." Plus: "Also approved: the three safe-default rules for unassigned/NULL rows."

| # | Decision | Resolution |
|---|---|---|
| OD-31-A | Essential-story principle + chart markup | **RESOLVED — story kept.** Essential = mom-only; Slice 1 mechanically converts every non-mom `E` cell to `En`; founder marks per-row exceptions on her own schedule (living draft until flip time — cell-level marks flow in via later seed updates or the Screen-4 grid once built). Slice 1 does NOT block on full markup. |
| OD-31-B | Grant×tier composition (R31-4) | **RESOLVED — approved as written.** Tier gates the grant system's availability; grants stay mom's; tier changes never auto-grant/auto-revoke. E2E probe pins it (registry row 13). |
| OD-31-C | Allotment numbers (D-PRD31-3 carry-over) | **RESOLVED — deferred to flip time**, decided from real beta usage data. Slice 1 keeps the live seeds (100/300/750/2000) documented as placeholders; thermometer shows "∞" throughout beta. |
| OD-31-D | Safety-key tier placement (R31-10) | **RESOLVED — `safety_monitoring_basic` moves DOWN to Essential** ("basic 'mom knows' is floor-level safety, not a premium"). `safety_monitoring_ai` (Layer-2 classification, conversation starters, weekly digests) stays Full Magic. **Encoding detail:** mom cell → `E`; the dad cell follows the A-principle (`En` — dads only exist at Enhanced+); flagged in the chart for founder override if she wants dad's recipient row at E too. |
| Rules 1–3 | Chart safe defaults (unassigned = UNGATED at activation; NULL-tier rows repaired per noted suggestions; Special Adults default Never outside the SA addendum list) | **RESOLVED — approved.** Rule 1 is the activation-safety backstop (R31-2c); Phase 41 is the deadline for closing the 78 unassigned keys. |

**Founder external actions (calendar gates, not decisions):** create the Stripe account + supply TEST-mode `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` as Supabase secrets before Slice 2's proof (shared gate with PRD-40 §8); live keys are a launch step, not a build blocker. Slice-1 dispatch is sequenced by the coordination seat, NOT auto-dispatched.

## 5. Pre-approved stubs (registered at close-out, not built)

Annual billing UI (schema ready, `price_yearly` stays seeded but hidden — D-PRD31-3); referral credits (`earned_promotion` source exists); Team/Org tier; free read-only post-cancellation mode (Screen 3 copy promises it — ships as status handling + a defined-later shell behavior, registered stub); PayPal/Venmo (Stripe dashboard config); dunning email automation (needs the shared sender — R31-8); credit gifting; MRR/churn analytics dashboard (PRD-32); Screen 4 cost/usage columns read `ai_usage_tracking` aggregations per D-PRD31-4 (the PRD's `ai_usage_log`/`platform_usage_log` references are amended, never built); milestone celebration animation + Guided-dashboard milestone UI ride existing PRD-24/25 systems where present, stub where not; Friction Finder milestone #9 fires only when PRD-29 builds (milestone row seeded, trigger stubbed).

## 6. Post-Build Verification

*(Populated at Checkpoint 5 — every PRD MVP item + every ruling above: Wired / Stubbed / Missing. Zero Missing required.)*

| Requirement | Status | Evidence |
|---|---|---|
| *(build time)* | | |
