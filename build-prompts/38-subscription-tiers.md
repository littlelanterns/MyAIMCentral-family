# Build Prompt 38: Subscription Tier System

## PRD Reference
- PRD-31: `prds/scale-monetize/PRD-31-Subscription-Tier-System.md`
- Addenda: `prds/addenda/PRD-31-Cross-PRD-Impact-Addendum.md`, `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`

## Prerequisites
- Phase 02 (Permissions & Access Control) complete
- Phase 27 (Settings) complete

## Objective
Build the full subscription tier system with Stripe integration (Customer Portal + custom UI), 4 tiers (Essential $9.99, Enhanced $16.99, Full Magic $24.99, Creator $39.99), founding family program (100 family limit, lifetime rates $7.99/$13.99/$20.99/$34.99, 30-day grace period), AI credit system (append-only ledger, spending priority: expiring → monthly → earned → purchased), tier sampling (per-use credit spend for features above current tier), 10 onboarding milestones (5 credits each), `useCanAccess` three-layer activation check, and webhook handling for subscription lifecycle events. This is a Large phase.

## Database Work
Create tables:
- `subscription_tiers` — Tier definitions (Essential, Enhanced, Full Magic, Creator) with pricing, features, Stripe price IDs
- Extend `family_subscriptions` — Add founding family flag, lifetime rate lock, grace period tracking, Stripe subscription ID, status
- `feature_key_registry` — Master registry of all feature keys in the platform with descriptions
- `feature_access_v2` — Feature-to-tier mapping with per-role-group thresholds (replaces or extends existing access control)
- `member_feature_toggles` — Per-member overrides for feature access (mom can grant/restrict individual features)
- `ai_credits` — Append-only credit ledger with type (monthly, earned, purchased, expiring), amount, expiry, source
- `credit_packs` — Purchasable credit pack definitions with Stripe price IDs and credit amounts
- `tier_sampling_costs` — Per-feature credit cost for tier sampling (accessing features above current tier)
- `tier_sample_sessions` — Records of tier sampling usage (feature accessed, credits spent, timestamp)
- `onboarding_milestones` — 10 milestone definitions with completion criteria and credit reward (5 credits each)
- `subscription_cancellations` — Cancellation records with reason, feedback, effective date, win-back offer tracking

Enable RLS on all tables. Tier definitions and feature registry are system-level read-only. Family subscription data scoped to family. Credit ledger scoped to family with mom visibility into all members.

## Component Work
### Stripe Integration
- Stripe Customer Portal — Link to Stripe-hosted portal for payment method and invoice management
- Custom subscription UI — Tier comparison page, upgrade/downgrade flow, billing history
- Webhook handler — Process Stripe events: subscription.created, subscription.updated, subscription.deleted, invoice.paid, invoice.payment_failed, customer.subscription.trial_will_end

### Tier System
- 4 tiers — Essential ($9.99), Enhanced ($16.99), Full Magic ($24.99), Creator ($39.99)
- Tier comparison — Side-by-side feature comparison across tiers
- Upgrade/downgrade flow — Proration handling, confirmation, and immediate/end-of-period switching

### Founding Family Program
- 100 family limit — Counter for founding family slots with waitlist after capacity
- Lifetime rates — $7.99/$13.99/$20.99/$34.99 locked for founding families
- 30-day grace period — New founding families get 30-day grace before first charge

### AI Credit System
- Append-only ledger — All credit transactions are INSERT-only (no updates/deletes)
- Credit types — Monthly (reset each period), earned (from milestones/actions), purchased (from credit packs), expiring (time-limited bonuses)
- Spending priority — Expiring credits first → monthly → earned → purchased
- Credit balance display — Current balance with breakdown by type
- Credit pack purchase — Buy additional credits via Stripe

### Tier Sampling
- Per-use credit spend — Access features above current tier by spending credits
- Sampling cost display — Show credit cost before sampling a feature
- Sampling session tracking — Record each sampling usage for analytics

### Onboarding Milestones
- 10 milestones — Define completion criteria (e.g., "Complete profile", "Create first task", "Use LiLa")
- 5 credits each — Award 5 credits on milestone completion (50 total available)
- Milestone progress UI — Display completed and remaining milestones

### Access Control
- `useCanAccess` hook — Three-layer check: (1) tier-based feature_access_v2, (2) member_feature_toggles override, (3) credit-based tier sampling fallback
- Feature gating UI — Locked feature indicators with upgrade CTA or sampling option

## Testing Checklist
- [ ] Stripe checkout creates subscription at correct tier and price
- [ ] Stripe Customer Portal accessible for payment management
- [ ] Webhook handles subscription.created and activates tier
- [ ] Webhook handles subscription.updated (upgrade/downgrade)
- [ ] Webhook handles subscription.deleted and revokes access
- [ ] Webhook handles invoice.payment_failed with grace period
- [ ] All 4 tiers display with correct pricing
- [ ] Tier comparison page shows accurate feature access per tier
- [ ] Founding family counter tracks against 100 limit
- [ ] Founding family lifetime rates lock correctly
- [ ] 30-day grace period activates for founding families
- [ ] AI credits: monthly allocation credited on subscription renewal
- [ ] AI credits: spending priority follows expiring → monthly → earned → purchased
- [ ] AI credits: append-only ledger has no UPDATE/DELETE operations
- [ ] Credit pack purchase adds credits via Stripe
- [ ] Tier sampling deducts correct credits and grants temporary access
- [ ] Onboarding milestones award 5 credits each on completion
- [ ] useCanAccess performs three-layer check correctly
- [ ] Feature gating shows upgrade CTA or sampling option for locked features
- [ ] Cancellation records reason and feedback
- [ ] RLS restricts subscription data to owning family

## Definition of Done
- All PRD-31 MVP items checked off
- Stripe integration operational (checkout, portal, webhooks)
- All 4 tiers with correct pricing and feature gating
- Founding family program with 100-limit counter and lifetime rates
- AI credit system with append-only ledger and correct spending priority
- Tier sampling functional with per-use credit deduction
- 10 onboarding milestones awarding credits
- useCanAccess three-layer check verified across features
- Webhook lifecycle handling tested end-to-end
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
