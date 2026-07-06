# Pre-Dispatch Pack — PRD31: Subscription Tier System (+ Tier Chart NEW-BB + Phase 41)

> **Factory status:** synthesized → decisions-pending (7 decisions, batch 2)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD31. Priority: P2 (monetization root).
> Evidence: `claude/dispatch-factory/PRD31-RECON.md` (full brief with file:line citations).
> Headline: schema is ~40% present (tiers/subscriptions/access tables live), **Stripe is 0% built,
> credits/metering is 0% built with only 4 of ~50 Edge Functions cost-instrumented**, and the
> access layer has TWO partially-shipped parallel implementations that this build must unify.

## Reconciliation rulings (newer wins — named explicitly)

1. **`feature_access_v2` shape: AMEND THE PRD, keep the live schema.** Live FK+boolean shape
   (`minimum_tier_id UUID` + `is_enabled`) is written by two shipped builds (PERMISSIONS-WIRING
   100260, RR-DEPLOY-SCOPING). Migrating 362 rows + two builds' write paths to the PRD's TEXT enum
   is pure risk. "Never" gets an explicit semantics on the live shape: **row present with
   `is_enabled=false` = Never; row absent = not-yet-assigned** (treated per role-group default
   documented in the tier chart). (D-PRD31-1)
2. **`member_feature_toggles`: pre-populated model is canonical.** Production
   (`apply_permission_profile()`) already committed to the addendum's pre-populated model; the base
   PRD (L867) and the sparse wording in CLAUDE.md/conventions.md are corrected at build close-out.
   `useResolvedFeatureAccess`'s "no row = role default" read stays valid (rows exist after a
   profile apply; default applies when none was ever applied). (D-PRD31-2)
3. **Seed drift is drift, not decision** (best evidence: no decision doc anywhere). `price_yearly`
   stays populated in the DB but the UI ships MONTHLY-ONLY at launch (annual = post-MVP stub per
   PRD); `monthly_ai_allotment` numbers get re-decided by the founder at Slice 0 using the PRD's
   tuning table as the starting point — during beta the thermometer shows "∞" regardless.
   (D-PRD31-3)
4. **Metering pipeline: extend `ai_usage_tracking` + `_shared/cost-logger.ts`; do NOT build
   PRD-32's parallel `ai_usage_log`/`platform_usage_log` tables.** One pipeline, one truth. Screen
   4's cost/usage columns read aggregations of `ai_usage_tracking` (+ `activity_log_entries` for
   usage frequency). PRD-32 pack is informed (its recon is in flight). PRD amended. (D-PRD31-4)
5. **Access-layer unification:** the real `useCanAccess()` (three-layer algorithm returning
   `{allowed, blockedBy, upgradeTier?}`) becomes the canonical GATE; `useResolvedFeatureAccess`
   remains the NAV-VISIBILITY layer consuming the same Layer-1/2 primitives; the
   `TOGGLE_KEY_ALIASES` vocabulary divergence is retired by the tier chart's single feature-key
   vocabulary (Convention #256 / NEW-BB). (D-PRD31-6)
6. **Activation model: everything ships behind an activation switch.** Beta bypass (Convention #10)
   remains until the founder flips it — building PRD-31 does NOT turn on gating. The switch flips
   per-layer (metering display → tier gating → billing enforcement) so activation is gradual and
   reversible.
7. **Stripe foundation ownership follows D-PRD40-2:** if PRD-40 dispatches first (recommended), its
   `stripe-webhook-handler` event router is the base and PRD-31 Slice 2 EXTENDS it with the 5
   subscription events; if PRD-31 somehow goes first, it builds the router and PRD-40 extends.
   Either way: ONE webhook handler, one `_shared/stripe.ts`.
8. **UpgradeModal is a fresh design** against the existing (never-invoked) `PermissionGate`
   `tierFallback`/`toggleFallback` props — not a resurrection (deleted deliberately in /simplify).
9. **Pricing table needs no reconciliation** — PRD, CLAUDE.md, and seeded data all agree (the one
   clean area).

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 0 | Founder/external: Stripe dashboard setup (products, prices, webhook secret, test mode), allotment numbers decision, confirm D-PRD31-1..7 | Founder (+ factory support) |
| 1 | Schema completion: 6 missing tables (`ai_credits` append-only, `credit_packs`, `tier_sampling_costs`, `tier_sample_sessions`, `onboarding_milestones`, `subscription_cancellations`), founding-rate columns on `family_subscriptions`, `feature_key_registry` additions, 'never' semantics doc, RLS + append-only enforcement (INSERT-only policy, Convention #223 pattern) | Sonnet xhigh + rls-verifier |
| 2 | Stripe: checkout flow, webhook handler (5 subscription events; extends PRD-40's router per ruling 7), Customer Portal, upgrade-immediate/downgrade-end-of-period proration, past-due lifecycle, founding durability rules + atomic 100-counter + `handle_new_user()` enrollment extension | Sonnet xhigh |
| 3 | Credits + metering: ledger mechanics (4 sources, spending priority, 90-day earned expiry cron via Convention #246), credit-pack purchase flow, **credit-deduction layer on the EXISTING cost-logger** (factory-verified 2026-07-04: 38 Edge Functions already import `_shared/cost-logger.ts` — the work is a centralized check/deduct extension + per-call-site metered-vs-not-metered classification, NOT an instrumentation sweep); Haiku/embeddings/Whisper explicitly NOT metered (enforce the PRD's counted/not-counted list); audit the handful of AI callers NOT on the shared logger and bring them on | Sonnet xhigh |
| 4 | Access activation infra: real `useCanAccess()` (3-layer, `blockedBy`/`upgradeTier`), UpgradeModal rebuild, `recalculate-tier-blocks` Edge Function, `useResolvedFeatureAccess` reconciliation + alias retirement, the ACTIVATION SWITCH (per-layer flags, default off) | Sonnet xhigh |
| 5 | Screens: Plan Comparison (retires the PlannedExpansionCard entry), Credit Packs, Cancellation flow, Usage Thermometer widget (beta "∞"), Tier-Sampling modal, Permission Hub 4-state tier-aware cells | Sonnet xhigh |
| 6 | Founding program (10 milestones + detection + grace lifecycle + admin/public counters) + admin Tier Assignment tab (ADMIN_TABS row) + **tier-assignment chart (Convention #256 / NEW-BB)**: the Screen-4 grid backed by `feature_access_v2` IS the chart; add the human-readable export + Phase 41 review checklist for the founder | Sonnet xhigh |
| 7 | E2E suite (`tests/e2e/features/subscription-tiers.spec.ts`: webhook lifecycle in Stripe test mode, credit spend priority + expiry, founding race/durability, gating probes per role group with the switch ON in a test family, sampling flow) + verification | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

Sequencing: Slice 3's Edge Function retrofit lands AFTER SAFETY-BETA-GATE C/B/A deploys (same
~50 files — do not collide). Slice 2 after PRD-40 Slice 2 if PRD-40 dispatches first.

## Open founder decisions (D-PRD31-1..7 — batch 2)

| # | Decision | Recommendation |
|---|---|---|
| D-PRD31-1 | Amend PRD to live `feature_access_v2` shape; 'never' = explicit `is_enabled=false` row | Yes — migrating production + 2 shipped builds to the PRD's enum is pure risk |
| D-PRD31-2 | Pre-populated `member_feature_toggles` canonical; fix PRD + convention text at close-out | Yes — production already committed; three disagreeing documents converge on reality |
| D-PRD31-3 | Treat seeds as drift: monthly-only UI at launch; you re-set allotment numbers at Slice 0 | Yes — no decision doc exists for the seeded numbers |
| D-PRD31-4 | One metering pipeline: extend `ai_usage_tracking`/cost-logger; skip `ai_usage_log`/`platform_usage_log` | Yes — two cost ledgers is how numbers stop agreeing |
| D-PRD31-5 | **✅ RESOLVED (founder, 2026-07-04): GREENFIELD.** Nothing exists in Stripe; build products/prices/webhooks from scratch, no reconciliation needed | Resolved |
| D-PRD31-6 | `useCanAccess` = canonical gate; `useResolvedFeatureAccess` = nav layer on same primitives; retire alias map via tier-chart vocabulary | Yes — one truth, two lenses |
| D-PRD31-7 | Credit-deduction layer rides INSIDE this build as Slice 3 (corrected scope: extend the shared cost-logger that 38 Edge Functions already use; classify call sites metered/not-metered; no instrumentation sweep needed) | Yes — smaller than originally scoped; centralized change |

## Dependency edges (manifest-mirrored)

- After: SAFETY-BETA-GATE C/B/A deployed (Slice 3 file territory); PRD-40 Slice 2 (webhook base,
  per D-PRD40-2) if PRD-40 goes first.
- Before/unblocks: PRD32 (admin analytics + billing surfaces consume this), Phase 41 tier review,
  PRD-38 pricing page + founding counter, PRD-28B ESA founding-rate source, beta-bypass exit,
  UpgradeModal-dependent UX everywhere.

---

## DISPATCH PROMPT (paste into a FRESH session — after D-PRD31-1..7 resolve; multi-session build, expect 2-3 worker sessions with baton passes)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-31 — Subscription Tier System (+ tier chart NEW-BB).
Pre-dispatch pack: claude/dispatch-factory/PRD31.md (9 reconciliation rulings + 7-slice plan).
Evidence: claude/dispatch-factory/PRD31-RECON.md. All pack decisions RESOLVED (founder
2026-07-04). D-PRD31-5 answered: **Stripe is GREENFIELD** — build products/prices/webhook
endpoints from scratch, no dashboard reconciliation. Slice-0 allotment numbers still collected
from the founder at Checkpoint 1.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`; re-read
CLAUDE.md conventions added since; confirm SAFETY-BETA-GATE C/B/A deployed BEFORE touching Edge
Functions (Slice 3 retrofit shares ~50 files with it); check whether PRD-40's build landed
(if yes, its stripe-webhook-handler is your Slice-2 base — EXTEND it, never fork a second
handler); re-check next free migration number immediately before every push.

READ FIRST (in order):
1. prds/scale-monetize/PRD-31-Subscription-Tier-System.md — FULL read, every word.
2. prds/addenda/PRD-31-Permission-Matrix-Addendum.md + PRD-31-Cross-PRD-Impact-Addendum.md — FULL.
3. claude/dispatch-factory/PRD31.md + PRD31-RECON.md — the 9 rulings are LAW for this build; where
   the PRD text disagrees with a ruling, the ruling wins and you record the PRD amendment in the
   feature-decision file.
4. Create .claude/rules/current-builds/PRD-31-subscription-tiers.md (no YAML frontmatter), full
   pre-build summary per claude/PRE_BUILD_PROCESS.md, founder approval BEFORE code (Checkpoint 1).

BUILD SLICES 1→7 per the pack table. HARD RULES: ai_credits is append-only (Convention #223
pattern — INSERT-only RLS); building does NOT activate gating (beta bypass Convention #10 stays
until the founder flips the per-layer activation switch you build in Slice 4); Haiku/embeddings/
Whisper are NEVER metered; 'never' = is_enabled=false row per ruling 1; ONE webhook handler,
ONE _shared/stripe.ts; the Screen-4 admin grid IS the Convention #256 tier chart (no hardcoded
tier names anywhere — grep-verify at close); cron jobs via util.invoke_edge_function (Convention
#246), cron-invoked functions deploy --no-verify-jwt.

PROOF: tests/e2e/features/subscription-tiers.spec.ts per the pack (Stripe test-mode webhook
lifecycle, credit spend-priority + expiry, founding race + durability, role-group gating probes
with the switch ON in a dedicated test family, sampling flow, append-only RLS probes). tsc -b
clean, lint clean, regression pins green (leak-pass, permissions-wiring — you are touching their
tables). Ask the founder before running shared-fixture suites. NOTHING COMMITS until proof is
green AND founder eyes-on clears; selective staging; founder confirms before push. Close-out:
Checkpoint 5 zero-Missing table, live_schema regen, STUB_REGISTRY (UpgradeModal + recalculate-
tier-blocks rows), conventions.md sparse-wording correction + CLAUDE.md additions, PlannedExpansionCard
retirement, baton-pass file if the build spans sessions.
```
